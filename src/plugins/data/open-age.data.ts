import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { inject } from '@angular/core';
import moment from 'moment';

import { DataSourcePlugin } from '../data-source.plugin';
import { ServerData } from '../../lib/oa/core/models';
import { Page } from '../../lib/oa/core/models/page.model';
import { ContentService } from '../../lib/oa/core/services/content.service';
import { ContextService } from '../../lib/oa/core/services/context.service';

/**
 * OpenAge Data Source Plugin
 * Implements the DataSourcePlugin interface for handling OpenAge API endpoints.
 * Provides CRUD operations with caching support and proper error handling.
 */
export class OpenAgeData implements DataSourcePlugin {
  // Injected services
  private http = inject(HttpClient);
  private context = inject(ContextService);
  private content = inject(ContentService);

  // Cache configuration
  private readonly cachePeriod = 1000;  // Cache duration in milliseconds
  private cache: Record<string, any> = {};


  /**
   * Determines whether the given configuration can be handled by this plugin.
   *
   * @param config - The configuration object to check. It may contain properties such as `type`, `src`, `url`, or `service`.
   * @returns `true` if the configuration is supported by this plugin, otherwise `false`.
   *
   * The method returns `true` if:
   * - The `type` property of the config is `'oa'`.
   * - The `src`, `url`, or `service` property does not start with `'http'` (case-insensitive) or `'/'`.
   *
   * Returns `false` if the source is an HTTP(S) URL or an absolute path.
   */
  /**
   * Determines if this plugin can handle the given configuration.
   *
   * @param config - Configuration object with the following properties:
   *                 - type: Optional type identifier ('oa' for OpenAge)
   *                 - src/url/service: Source endpoint specification
   * @returns true if:
   *         - config.type is 'oa', or
   *         - source is not an HTTP(S) URL or absolute path
   */
  canHandle(src: any): boolean {
    if (src.provider) {
      return src.provider === 'oa';
    }
    const url = src.url;
    const lowerUrl = url.toLowerCase();

    return !(lowerUrl.startsWith('http') || url.startsWith('/'));
  }

  /**
   * Searches for resources matching the provided query criteria.
   *
   * @param query - Search parameters object containing:
   *               - filter criteria
   *               - sort options
   *               - field selections
   * @param options - Additional options:
   *                 - page: Pagination configuration { skip, limit }
   *                 - sort: Sorting configuration
   *                 - src/url/service: Source endpoint specification
   * @returns Promise resolving to a Page containing matching items
   * @throws Error if the request fails or returns an error response
   */
  public search = async (query?: any, options?: any): Promise<Page<any> | undefined> => {
    const url = this.getSearchUrl(query, options);
    const response = await firstValueFrom(
      this.http.get<Page<any>>(url, {
        headers: this.getHeaders(options)
      })
    );
    return this.extractPage(response, options);
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
    const url = this.apiUrl(options);
    const response = await firstValueFrom(this.http.post<ServerData<any>>(url, model, { headers: this.getHeaders(options) }));
    return this.extractModel(response, options);
  }

  /**
   * Retrieves a resource by its ID, optionally using additional options.
   *
   * This method first attempts to retrieve the resource from a local cache.
   * If the resource is not found in the cache, it performs an HTTP GET request
   * to fetch the resource from the server. The response is then processed and
   * the model is extracted before returning.
   *
   * @param id - The unique identifier of the resource to retrieve.
   * @param options - Optional parameters to customize the request, such as headers or query parameters.
   * @returns A promise that resolves to the retrieved resource data.
   */
  public get = async (id: number | string, options?: any): Promise<any> => {
    const url = this.resourceUrl(id, options);
    const obj = this.getFromCache(url);
    if (obj) return obj.data;

    const response = await firstValueFrom(this.http.get<ServerData<any>>(url, { headers: this.getHeaders(options) }));
    return this.extractModel(response, options);

  }

  /**
 * Update an item by ID.
 * @param id The ID of the item.
 * @param model The updated item.
 * @param options Additional options.
 * @returns The updated item.
 *
 * @example
 * const updatedItem = await dataService.update(1, { name: 'UpdatedItem' }, { src: ':directory/api/items' });
 */
  public update = async (id: number | string, model: any, options?: any): Promise<any> => {
    const url = this.resourceUrl(id, options);
    const response = await firstValueFrom(this.http.put<ServerData<any>>(url, model, { headers: this.getHeaders(options) }));
    return this.extractModel(response, options);
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
    const url = this.resourceUrl(id, options);
    const response = await firstValueFrom(this.http.delete<any>(url, { headers: this.getHeaders(options) }));
    this.checkError(response);
    return true;
  }

  /**
   * Retrieves cached data for a given URL if it exists and hasn't expired.
   *
   * @param url - The URL key for the cached data
   * @returns The cached data if valid, undefined otherwise
   */
  private getFromCache(url: string): any {
    if (!this.cachePeriod) {
      return;
    }

    const obj = this.cache[url];
    if (!obj?.timeStamp) {
      return;
    }

    const isExpired = moment(obj.timeStamp)
      .add(this.cachePeriod, 'milliseconds')
      .isAfter(new Date(), 'millisecond');

    if (isExpired) {
      delete this.cache[url];
      return;
    }

    return obj.data;
  }

  private resourceUrl(id?: number | string, config?: any): string {

    config = config || {};
    let src = config.src || config.url || config.service;
    if (typeof src === 'string') {
      src = {
        url: src
      }
    }


    let url: any = '';
    if (src.url.startsWith(':')) {
      const serviceCode = src.url.split('/')[0].substring(1);
      const service = this.context.getService(serviceCode);
      if (!service) {
        throw new Error('SERVICE_INVALID', { cause: serviceCode })
      }
      url = src.url.replace(`:${serviceCode}`, service.url)
    } else {
      url = this.context.getService(src.url)?.url
    }

    if (!url) {
      throw new Error('URL_INVALID');
    }

    const resource = config?.src?.resource || config?.resource || config?.src?.collection || config?.collection;

    const collection = resource?.type || resource;
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

    id = id || resource?.id || src?.id || config.id;
    if (id) {
      url = `${url}/${id}`;
    }

    const field = resource?.field || src.field || config.field;
    if (field) {
      url = `${url}/${field}`;
    }
    const extension = src.extension || config.extension;
    if (extension) {
      url = `${url}.${extension}`;
    }

    return url;
  }

  private getSearchUrl(query: any, config?: any): string {

    const params = new URLSearchParams();
    config = config || {};
    query = Object.assign({}, query)
    if (config.query) {
      query = Object.assign(query, config.query)
    }

    query = this.content.deflate(query);
    // eslint-disable-next-line prefer-const
    for (let key in query) {
      if (query[key] !== undefined) {
        params.set(key, query[key]);
      }
    }

    let url = this.apiUrl(config);


    //todo for the dynamic query pick the url route for navigation hardcoded value are use
    // const urlPath = window.location.pathname; // Get the pathname
    // const pathSegments = urlPath.split('/');
    // const id = pathSegments[3] ? decodeURIComponent(pathSegments[3]) : '';

    const page = config.page || {}

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

    const sort = page.sort;
    if (sort) {
      Object.keys(page.sort).forEach(key => {
        params.set('sort', sort.toString());
        params.set('desc', (sort.sort[key] === 'desc').toString());
      });
    }

    const field = config.path || config.field;
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

  private apiUrl(options?: any): string {
    return this.resourceUrl(undefined, options);
  }

  /**
 * Extract a model from the server data.
 * @param dataModel The server data.
 * @param config Additional options.
 * @returns The extracted model.
 */
  private extractModel(dataModel?: ServerData<any>, config?: any): any {
    if (!dataModel) {
      return;
    }
    config = config || {};
    this.checkError(dataModel);
  }

  /**
* Extract a page from the server data.
* @param dataModel The server data.
* @param options Additional options.
* @returns The extracted page.
*/
  /**
   * Extracts and processes page data from the server response.
   * Handles both array and paginated responses, applying optional data mapping.
   *
   * @param dataModel - Raw page data from server
   * @param config - Processing options:
   *                 - map: Optional transformation function
   * @returns Processed Page object with items and metadata
   * @throws Error if response indicates failure
   */
  private extractPage(dataModel: Page<any>, config: any): Page<any> {
    this.checkError(dataModel);
    const data = (dataModel as any)['data'] || dataModel;
    const mapper = config.map;

    let collection = data;
    if (!Array.isArray(data) && data.items && Array.isArray(data.items)) {
      collection = data.items;
    } else {
      const extractFields = (obj: any) => {
        // Flatten and organize the data into a format suitable for your use case
        const result: any = {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
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

    const items: any[] = [];
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
 * Check if the response contains an error.
 * @param dataModel The response data model.
 * @throws If an error is found in the response.
 */
  /**
   * Validates the response for error conditions.
   * Checks isSuccess flag in various formats and throws appropriate errors.
   *
   * @param dataModel - Response data to check
   * @throws Error with message from response or default 'failed' message
   */
  private checkError(dataModel: any): void {
    const isSuccess = dataModel.isSuccess || dataModel.IsSuccess;
    if (isSuccess === false || isSuccess === 'false' || isSuccess === 'False') {
      throw new Error(dataModel.error || dataModel.code || dataModel.message || 'failed');
    }
  }

  /**
   * Get HTTP headers for a request.
   * @param options Additional options.
   * @returns The HTTP headers.
   */
  /**
   * Builds HTTP headers for requests including authentication and caching directives.
   *
   * @param config - Optional configuration:
   *                 - timeStamp: For conditional requests
   *                 - headers: Custom headers to include
   * @returns HttpHeaders object with:
   *          - Standard headers (Content-Type, Cache-Control)
   *          - Authentication headers (tokens, session)
   *          - Context headers (application, organization)
   *          - Custom headers from options
   */
  private getHeaders(config?: any): HttpHeaders {
    config = config || {};
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate, post-check=0, pre-check=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    if (config.timeStamp) {
      headers['If-Modified-Since'] = config.timeStamp.toISOString();
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
        headers['x-session-id'] = session.id.toString();
      }
    }
    const role = this.context.currentRole();
    if (role) {
      headers['x-role-key'] = role.key;
    }
    else {
      const organization = this.context.currentOrganization();
      if (organization?.code) {
        headers['x-organization-code'] = organization.code;
      }
      const tenant = this.context.currentTenant();
      if (tenant) {
        headers['x-tenant-code'] = tenant.code;
      }
    }

    const configHeaders = config.src?.headers || config.headers || {};

    for (const key in configHeaders) {
      if (Object.prototype.hasOwnProperty.call(configHeaders, key)) {
        let value = configHeaders[key];
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

    return new HttpHeaders(headers);
  }
}
