/* eslint-disable no-prototype-builtins */
/* eslint-disable prefer-const */
import { HttpClient, HttpHeaders, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import moment from 'moment';
import { firstValueFrom, Observable, Subject } from 'rxjs';
import { Logger, ServerData } from '../models';
import { Page } from '../models/page.model';
import { ContentService } from './content.service';
import { ContextService } from './context.service';
import { UxService } from './ux.service';
import { ActivatedRoute } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private options: any = {};           // Options for configuring the service
  private cachePeriod = 1000;          // Cache period in milliseconds
  private cache: any = {};             // Cache storage
  taskId: any
  isProcessing?: boolean = false
  // Injecting HttpClient and ContextService
  http = inject(HttpClient);
  context = inject(ContextService);
  content = inject(ContentService);
  uxService = inject(UxService)
  route = inject(ActivatedRoute)
  logger = new Logger(DataService);

  sources: any = {};

  constructor() { }

  public addSource(code: string, source: any) {
    this.sources = this.sources || {};

    const subject = new Subject<any>();

    this.sources[code] = {
      options: source,
      data: subject.asObservable()
    }




    Observable<any>
  }

  public subscibe(code: string): void {
    this.sources[code].subscribe();

  }



  /**
   * Initialize the service with given options.
   * @param options Configuration options for the service.
   * @returns The DataService instance.
   *
   * @example
   * dataService.init({ src: 'https://api.openage.in/directory/api', collection: 'items' });
   *
   * @example
   * dataService.init({ src: ':directory/users'});
   *
   * @example
   * dataService.init({
   *   service: 'directory',
   *   collection: 'users',
   *   handleError: customErrorHandler,
   *   headers: { 'Authorization': 'Bearer token' },
   *   limit: 10, // for search
   *   sort: { name: 'asc' } // for search
   * });
   */
  public init(options: any) {
    this.options = options;

    return this;
  }

  /**
   * Retrieve an item by ID.
   * @param id The ID of the item.
   * @param options Additional options.
   * @returns The requested item.
   *
   * @example
   * const item = await dataService.get(1, { src: 'http://example.com/api', headers: { 'Custom-Header': 'value' } });
   */
  public get = async (id: number | string, options?: any): Promise<any> => {
    this.context.isProcessing.set(true);
    try {
      options = options || {};
      const url = this.resourceUrl(id, options);
      const obj = this.getFromCache(url);
      if (obj) return obj.data;
      const response = await firstValueFrom(this.http.get<ServerData<any>>(url, { headers: this.getHeaders(options) }));
      return this.extractModel(response, options);
    } catch (err) {
      this.handleError(err, options);
    } finally {
      this.context.isProcessing.set(false);
    }
  }

  /**
   * Search for items based on a query.
   * @param query The search query.
   * @param options Additional options.
   * @returns A page of search results.
   *
   * @example
   * const results = await dataService.search({ name: 'item' }, { limit: 10, sort: { name: 'asc' } });
   */
  public search = async (query?: any, options?: any): Promise<Page<any> | undefined> => {
    this.context.isProcessing.set(true);

    try {
      const url = this.getSearchUrl(query, options);
      const response = await firstValueFrom(this.http.get<Page<any>>(url, { headers: this.getHeaders(options) }));
      return this.extractPage(response, options);
    } catch (err) {
      this.handleError(err, options);
    } finally {
      this.context.isProcessing.set(false);
    }
    return;
  }

  /**
   * Create a new item.
   * @param model The item to create.
   * @param options Additional options.
   * @returns The created item.
   *
   * @example
   * const newItem = await dataService.create({ name: 'NewItem' }, { src: 'http://example.com/api/items' });
   */
  public create = async (model: any, options?: any): Promise<any> => {
    try {
      const response = await firstValueFrom(this.http.post<ServerData<any>>(this.apiUrl(options), JSON.stringify(model), { headers: this.getHeaders(options) }));
      return this.extractModel(response, options);
    } catch (err) {
      this.handleError(err, options);
    } finally {
      this.context.isProcessing.set(false);
    }
    return;
  }

  /**
   * Post an item.
   * @param model The item to post.
   * @param options Additional options.
   * @returns The posted item.
   *
   * @example
   * const postedItem = await dataService.post({ name: 'PostedItem' }, { src: 'http://example.com/api/items' });
   */
  public post = async (model: any, options?: any): Promise<any> => {
    try {
      if (options && typeof options === 'string') {
        options = { field: options };
      }
      const response = await firstValueFrom(this.http.post<ServerData<any>>(this.apiUrl(options), JSON.stringify(model), { headers: this.getHeaders(options) }));
      return this.extractModel(response, options);
    } catch (err) {
      this.handleError(err, options);
    } finally {
      this.context.isProcessing.set(false);
    }
    return;
  }


  /**
   * Uploads a file to a server with the specified options.
   *
   * @param {File} file - The file to be uploaded.
   * @param {any} [options] - Optional parameters for the upload, such as service, collection, and field.
   * @returns {Promise<any>} - A promise that resolves with the server's response or handles errors if they occur.
   *
   * The options object may include:
   *   - service: The service endpoint to connect to (default: connect)
   *   - collection: The collection within the service to upload to. (default: data/upload)
   *   - field: The specific field to associate with the uploaded file (e.g., providerCode/integrationCode).
   *   - extension: The file extension, typically .csv for this implementation.
   *
   * Example endpoint URL structure:
   * /connect/data/upload/:providerCode/:integrationCode.csv
   *
   * This method constructs a POST request with the file data and sends it to the generated URL.
   * It handles the server's response, extracting the model if successful or managing errors otherwise.
   */

  public upload = async (file: File | null, options?: any): Promise<any> => {
    this.isProcessing = true
    const formData: FormData = new FormData();

    if (!file || !(file instanceof File)) {
      return Promise.reject('Invalid file provided');
    }

    formData.append('file', file);
    formData.append('status', 'in-progress');

    try {
      if (options && typeof options === 'string') {
        options = { field: options };
      }

      formData.forEach((value, key) => {
        this.logger.debug(`${key}:`, value);
      });
      const response = await firstValueFrom(
        this.http.post<ServerData<any>>(this.uploadUrl(options), formData, {
          headers: this.getHeaders(),
          responseType: 'json',
        })
      );
      if (options.status === 'new' || options.status === 'in-progress') {
        const item = {
          id: response.data.taskId,
          status: options.status,
          progress: 0,
          type: 'upload',
          api: {
            code: 'connect',
            service: 'employees'
          }
        };

        this.uxService.handleItemProgress(item);
        options.status = null;
      }
      if (response && response.data && response.data.taskId) {
        this.taskId = response.data.taskId;
        const getResponse = await firstValueFrom(
          this.http.get(this.getUploadedTask(this.taskId), {
            headers: this.getHeaders(),
            responseType: 'json'
          })
        );
        this.uxService.showMessage(`Task ${this.taskId} Upload successfully`);
        file = null;
        this.isProcessing = false
        return this.extractModel(options);
      } else {
        this.handleError(`${response.message}`, options);
      }
    } catch (err) {
      this.handleError(err, options);
    }
    return;
  }
  public uploadFile = async (file: File | null, options?: any): Promise<any> => {
    this.isProcessing = true
    const formData: FormData = new FormData();

    if (!file || !(file instanceof File)) {
      return Promise.reject('Invalid file provided');
    }

    formData.append('file', file);

    try {
      if (options && typeof options === 'string') {
        options = { field: options };
      }

      formData.forEach((value, key) => {
        console.log(`${key}:`, value);
      });
      const response = await firstValueFrom(
        this.http.post<ServerData<any>>(this.uploadFileUrl(options), formData, {
          headers: this.getHeaders(),
          responseType: 'json',
        })
      );
    } catch (err) {
      this.handleError(err, options);
    }
    return;
  }

  /**
   * Update an item by ID.
   * @param id The ID of the item.
   * @param model The updated item.
   * @param options Additional options.
   * @returns The updated item.
   *
   * @example
   * const updatedItem = await dataService.update(1, { name: 'UpdatedItem' }, { src: 'http://example.com/api/items' });
   */
  public update = async (id: number | string, model: any, options?: any): Promise<any> => {
    try {
      const response = await firstValueFrom(this.http.put<ServerData<any>>(this.resourceUrl(id, options), JSON.stringify(model), { headers: this.getHeaders(options) }));
      return this.extractModel(response, options);
    } catch (err) {
      this.handleError(err, options);
    }
    return;
  }

  /**
   * Remove an item by ID.
   * @param id The ID of the item.
   * @param options Additional options.
   * @returns Whether the item was successfully removed.
   *
   * @example
   * const success = await dataService.remove(1, { src: 'http://example.com/api/items' });
   */
  public remove = async (id: number | string, options?: any): Promise<boolean> => {
    try {
      const response = await firstValueFrom(this.http.delete<any>(this.resourceUrl(id, options), { headers: this.getHeaders(options) }));
      this.checkError(response);
      return true;
    } catch (err) {
      this.handleError(err, options);
    }
    return false;
  }

  /**
   * Handle errors during HTTP requests.
   * @param err The error object.
   * @param options Additional options.
   *
   * @example
   * dataService.handleError(new Error('Test Error'), { handleError: customErrorHandler });
   */
  private handleError(err: any, options: any): void {
    const handleError = options?.handleError || this.options.errorHandler?.handleError;
    if (handleError) {
      handleError(err);
    } else {
      throw err;
    }
  }

  /**
   * Check if the response contains an error.
   * @param dataModel The response data model.
   * @throws If an error is found in the response.
   */
  private checkError(dataModel: any) {
    const isSuccess = dataModel.isSuccess || dataModel.IsSuccess;
    if (isSuccess === false || isSuccess === 'false' || isSuccess === 'False') {
      throw new Error(dataModel.error || dataModel.code || dataModel.message || 'failed');
    }
  }

  /**
   * Extract a model from the server data.
   * @param dataModel The server data.
   * @param options Additional options.
   * @returns The extracted model.
   */
  private extractModel(dataModel?: ServerData<any>, options?: any): any {
    if (!dataModel) {
      return;
    }
    options = options || {};
    this.checkError(dataModel);
    let model: any;
    const mapper = options.map || this.options.map;
    if (mapper) {
      return mapper(dataModel.data);
    } else {
      model = dataModel.data;
    }
    return model;
  }

  /**
   * Extract a page from the server data.
   * @param dataModel The server data.
   * @param options Additional options.
   * @returns The extracted page.
   */
  private extractPage(dataModel: Page<any>, options: any): Page<any> {
    this.checkError(dataModel);
    const data = (dataModel as any)['data'] || dataModel;
    const items: any[] = [];
    const mapper = options.map || this.options.map;

    let collection = data;
    if (!Array.isArray(data) && data.items && Array.isArray(data.items)) {
      collection = data.items;
    } else {
      const extractFields = (obj: any) => {
        // Flatten and organize the data into a format suitable for your use case
        const result: any = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
              // Recursively extract fields from nested objects
              result[key] = extractFields(obj[key]);
            } else {
              result[key] = obj[key];
            }
          }
        }
        return result;
      };
      collection = [extractFields(data)];
    }

    collection.forEach((item: any) => {
      if (mapper) {
        items.push(mapper(item));
      } else {
        items.push(item);
      }
    });

    const page: Page<any> = new Page<any>();
    page.pageNo = data.pageNo;
    page.pageSize = data.pageSize;
    page.total = data.total;
    page.stats = data.stats;
    page.items = items;

    return page;
  }

  /**
     * Get HTTP headers for a request.
     * @param options Additional options.
     * @returns The HTTP headers.
     */
  private getHeaders(options?: any): HttpHeaders {
    const headers: any = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate, post-check=0, pre-check=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    if (options?.timeStamp) {
      headers['If-Modified-Since'] = options.timeStamp.toISOString();
    }

    const application = this.context.currentApplication();
    if (application?.code) {
      headers['x-application-code'] = application.code;
    }
    const session = this.context.currentSession();
    if (session) {
      if (session?.token) {
        headers['x-access-token'] = session?.token;
      }
      if (session?.id) {
        headers['x-session-id'] = session.id;
      }
    }
    const role = this.context.currentRole();
    if (role) {
      headers['x-role-key'] = role.key;
    }
    else {
      const organization = this.context.currentOrganization();
      if (organization) {
        headers['x-organization-code'] = organization.code;
      }
      const tenant = this.context.currentTenant();
      if (tenant) {
        headers['x-tenant-code'] = tenant.code;
      }
    }

    if (options?.headers) {
      for (const key in options.headers) {
        if (Object.prototype.hasOwnProperty.call(options.headers, key)) {
          let value = options.headers[key];
          if (value) {
            switch (typeof value) {
              case 'string':
                break;
              case 'function':
                value = value();
                break;
              case 'object':
                value = JSON.stringify(value);
                break;
            }
          } else {
            value = localStorage.getItem(key);
          }

          if (value) {
            headers[key] = value;
          }
        }
      }
    }

    return new HttpHeaders(headers);
  }

  private getFromCache(url: string) {
    if (!this.cachePeriod) return;
    const obj = this.cache[url]
    if (!obj) return;
    const timeStamp = this.cache[url].timeStamp
    if (!timeStamp) return;

    if (moment(timeStamp).add(this.cachePeriod, 'milliseconds').isAfter(new Date(), 'millisecond')) {
      delete this.cache[url];
      return;
    }

    return obj.data;
  }

  private apiUrl(options?: any): string {
    return this.resourceUrl(undefined, options);
  }

  private resourceUrl(resource?: number | string, options?: any): string {

    if (typeof options === 'string') {
      options = {
        url: options
      }
    }
    options = options || {};

    const src = options.src || options.url || options.service || this.options.src || this.options.url || this.options.service;

    let url: any = '';
    if (src?.toLowerCase().startsWith('http') || src.startsWith('/')) {
      url = src;
    } else if (src.startsWith(':')) {
      const serviceCode = src.split('/')[0].substring(1);

      const service = this.context.getService(serviceCode);
      if (!service) {
        throw new Error('SERVICE_INVALID', { cause: serviceCode })
      }
      url = src.replace(`:${serviceCode}`, service.url)
    } else {
      url = this.context.getService(src)?.url
    }

    if (!url) {
      throw new Error('URL_INVALID');
    }

    const collection = options.collection || this.options.collection;

    if (collection) {

      let key: string;

      switch (typeof collection) {
        case 'string':
          key = collection;
          break;
        case 'function':
          key = collection();
          break;
        default:
          key = JSON.stringify(collection);
          break;
      }

      url = `${url}/${key}`;
    }

    if (resource) {
      url = `${url}/${resource}`;
    }

    const field = options.field || this.options.field;
    if (field) {
      url = `${url}/${field}`;
    }

    const extension = options.extension || this.options.extension;

    if (extension) {
      url = `${url}.${extension}`;
    }

    return url;
  }

  private uploadUrl(options?: any): string {

    // options.service = connect
    // options.collection = data
    // options.field = provider code/integration code
    // options.extension = .csv

    if (typeof options === 'string') {
      options = {
        url: options
      }
    }
    options = options || {};

    const serviceCode = options.service || 'connect';

    const service = this.context.getService(serviceCode);

    if (!service) {
      throw new Error('SERVICE_INVALID', { cause: serviceCode })
    }

    let url = service.url

    if (!url) {
      throw new Error('URL_INVALID');
    }

    const collection = options.collection || 'data/upload';

    if (collection) {

      let key: string;

      switch (typeof collection) {
        case 'string':
          key = collection;
          break;
        case 'function':
          key = collection();
          break;
        default:
          key = JSON.stringify(collection);
          break;
      }

      url = `${url}/${key}`;
    }

    const field = options.field;
    if (field) {
      url = `${url}/${field}`;
    }

    const extension = options.extension;

    if (extension) {
      url = `${url}.${extension}`;
    }

    let query = options.query;

    if (query) {

      const params = new URLSearchParams();

      query = this.content.deflate(query);
      // eslint-disable-next-line prefer-const
      for (let key in query) {
        if (query[key] !== undefined) {
          params.set(key, query[key]);
        }
      }

      const queryString = params.toString();
      if (queryString) {
        if (url.includes('?')) {
          const subStrings = url.split('?');
          url = `${subStrings[0]}?${queryString}&${subStrings[1]}`;
        } else {
          url = `${url}?${queryString}`;
        }
      }
    }

    return url;
  }
  private uploadFileUrl(options?: any): string {
    if (typeof options === 'string') {
      options = {
        url: options
      }
    }
    options = options || {};

    const serviceCode = options.service || 'drive';

    const service = this.context.getService(serviceCode);

    if (!service) {
      throw new Error('SERVICE_INVALID', { cause: serviceCode })
    }

    let url = service.url

    if (!url) {
      throw new Error('URL_INVALID');
    }

    const collection = options.collection || 'files/root|org-detail';

    if (collection) {

      let key: string;

      switch (typeof collection) {
        case 'string':
          key = collection;
          break;
        case 'function':
          key = collection();
          break;
        default:
          key = JSON.stringify(collection);
          break;
      }

      url = `${url}/${key}`;
    }

    const field = options.field;
    if (field) {
      url = `${url}/${field}`;
    }

    const extension = options.extension;

    if (extension) {
      url = `${url}.${extension}`;
    }

    let query = options.query;

    if (query) {

      const params = new URLSearchParams();

      query = this.content.deflate(query);
      // eslint-disable-next-line prefer-const
      for (let key in query) {
        if (query[key] !== undefined) {
          params.set(key, query[key]);
        }
      }

      const queryString = params.toString();
      if (queryString) {
        if (url.includes('?')) {
          const subStrings = url.split('?');
          url = `${subStrings[0]}?${queryString}&${subStrings[1]}`;
        } else {
          url = `${url}?${queryString}`;
        }
      }
    }

    return url;
  }

  private getUploadedTask(options?: any): string {
    if (typeof options === 'string') {
      options = {
        url: options
      }
    }
    options = options || {};

    const serviceCode = options.service || 'connect';

    const service = this.context.getService(serviceCode);

    if (!service) {
      throw new Error('SERVICE_INVALID', { cause: serviceCode })
    }

    let url = service.url

    if (!url) {
      throw new Error('URL_INVALID');
    }

    const collection = options.collection || `tasks/${this.taskId}`;

    if (collection) {

      let key: string;

      switch (typeof collection) {
        case 'string':
          key = collection;
          break;
        case 'function':
          key = collection();
          break;
        default:
          key = JSON.stringify(collection);
          break;
      }

      url = `${url}/${key}`;
    }

    const field = options.field;
    if (field) {
      url = `${url}/${field}`;
    }

    const extension = options.extension;

    if (extension) {
      url = `${url}.${extension}`;
    }

    let query = options.query;

    if (query) {

      const params = new URLSearchParams();

      query = this.content.deflate(query);
      // eslint-disable-next-line prefer-const
      for (let key in query) {
        if (query[key] !== undefined) {
          params.set(key, query[key]);
        }
      }

      const queryString = params.toString();
      if (queryString) {
        if (url.includes('?')) {
          const subStrings = url.split('?');
          url = `${subStrings[0]}?${queryString}&${subStrings[1]}`;
        } else {
          url = `${url}?${queryString}`;
        }
      }
    }
    return url;
  }

  private getSearchUrl(query: any, options?: any): string {

    const params = new URLSearchParams();
    query = query || options.query || {};

    query = this.content.deflate(query);
    // eslint-disable-next-line prefer-const
    for (let key in query) {
      if (query[key] !== undefined) {
        params.set(key, query[key]);
      }
    }

    let url = this.apiUrl(options.config);

    options = options || {};

    //todo for the dynamic query pick the url route for navigation hardcoded value are use
    // const urlPath = window.location.pathname; // Get the pathname
    // const pathSegments = urlPath.split('/');
    // const id = pathSegments[3] ? decodeURIComponent(pathSegments[3]) : '';

    let page = options.page || this.options.page || {}

    // let offset = options.offset || this.options.offset;
    // let limit = options.limit || this.options.limit;

    // if (options.page) {
    //   offset = options.page * (limit || 10);
    // }

    if (page.skip || page.limit) {
      page.skip = page.skip || 0;
      page.limit = page.limit || 10;
      params.set('offset', page.skip.toString());
      params.set('limit', page.limit.toString());
      // params.set('code', id ? id : '')
    } else if (page.limit === -1) {
      params.set('noPaging', 'true');
      // params.set('code', id ? id : '')
    }

    const sort = page.sort || this.options.sort;
    if (sort) {
      Object.keys(page.sort).forEach(key => {
        params.set('sort', sort.toString());
        params.set('desc', (sort.sort[key] === 'desc').toString());
      });
    }

    const field = options.path || options.field || this.options.path || this.options.field;
    if (field) {
      url = `${url}/${field}`;
    }

    const queryString = params.toString();
    if (queryString) {
      if (url.includes('?')) {
        const subStrings = url.split('?');
        url = `${subStrings[0]}?${queryString}&${subStrings[1]}`;
      } else {
        url = `${url}?${queryString}`;
      }
    }

    return url;
  }
}
