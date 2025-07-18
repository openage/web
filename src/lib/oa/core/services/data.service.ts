/* eslint-disable no-prototype-builtins */
/* eslint-disable prefer-const */
import { HttpClient, HttpHeaders, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, Observable, Subject } from 'rxjs';
import { Logger, ServerData } from '../models';
import { Page } from '../models/page.model';
import { ContentService } from './content.service';
import { ContextService } from './context.service';
import { UxService } from './ux.service';
import { ActivatedRoute } from '@angular/router';
import { DataSourceRegistry } from '../../../../plugins/data/data-source.registry';
import { TransformService } from './transform.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private options: any = {};           // Options for configuring the service

  isProcessing?: boolean = false
  // Injecting HttpClient and ContextService
  http = inject(HttpClient);
  context = inject(ContextService);
  content = inject(ContentService);
  uxService = inject(UxService);
  route = inject(ActivatedRoute);
  dataSourceRegistry = inject(DataSourceRegistry);
  transformService = inject(TransformService);

  logger = new Logger(DataService);

  sources: any = {};


  public addSource(code: string, source: any) {
    this.sources = this.sources || {};

    const subject = new Subject<any>();

    this.sources[code] = {
      options: source,
      data: subject.asObservable()
    }
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
   * const item = await dataService.get(1, {
   *  headers: { 'Custom-Header': 'value' } , {
   *  config: {
   *    src: 'http://example.com/api/items'
   *  }
   * });
   */
  public get = async (id: number | string, options?: any): Promise<any> => {
    this.context.isProcessing.set(true);
    if (typeof options === 'string') {
      options = {
        src: options
      }
    }
    const plugin = this.dataSourceRegistry.getPlugin(options);
    try {
      const data = await plugin.get(id, options)
      return this.transform(data, options);

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
   * const results = await dataService.search({ name: 'item' }, {
   *  page: {
   *    limit: 10,
   *    sort: { name: 'asc' }
   *  }, {
   *  config: {
   *    src: 'http://example.com/api/items'
   *  }
   * }););
   */
  public search = async (query?: any, options?: any): Promise<Page<any> | undefined> => {
    this.context.isProcessing.set(true);
    if (typeof options === 'string') {
      options = {
        src: options
      }
    }
    const plugin = this.dataSourceRegistry.getPlugin(options);
    try {
      const data = await plugin.search(query, options)
      const page: Page<any> = new Page<any>();

      const items: any[] = Array.isArray(data) ? data : (data?.items ?? []);
      if (Array.isArray(data)) {
        page.pageNo = 1;
        page.pageSize = data.length;
        page.total = data.length;
        page.stats = {};
      } else {
        page.pageNo = data?.pageNo;
        page.pageSize = data?.pageSize;
        page.total = data?.total;
        page.stats = data?.stats;
      }

      page.items = this.transform(items, options);

      return page;
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
   * const newItem = await dataService.create({ name: 'NewItem' }, {
   *  config: {
   *    src: 'http://example.com/api/items'
   *  }
   * });
   */
  public create = async (model: any, options?: any): Promise<any> => {
    this.context.isProcessing.set(true);
    if (typeof options === 'string') {
      options = {
        src: options
      }
    }
    const plugin = this.dataSourceRegistry.getPlugin(options);
    try {
      const data = await plugin.create(model, options)
      return this.transform(data, options);
    } catch (err) {
      this.handleError(err, options);
    } finally {
      this.context.isProcessing.set(false);
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
   * const updatedItem = await dataService.update(1, { name: 'UpdatedItem' }, {
   *  config: {
   *    src: 'http://example.com/api/items'
   *  }
   * });
   */
  public update = async (id: number | string, model: any, options?: any): Promise<any> => {
    this.context.isProcessing.set(true);
    if (typeof options === 'string') {
      options = {
        src: options
      }
    }
    const plugin = this.dataSourceRegistry.getPlugin(options);
    try {
      const data = await plugin.update(id, model, options)
      return this.transform(data, options);
    } catch (err) {
      this.handleError(err, options);
    } finally {
      this.context.isProcessing.set(false);
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
   * const success = await dataService.remove(1, {
   *  config: {
   *    src: 'http://example.com/api/items'
   *  }
   * });
   */
  public remove = async (id: number | string, options?: any): Promise<boolean> => {
    const plugin = this.dataSourceRegistry.getPlugin(options);
    if (typeof options === 'string') {
      options = {
        src: options
      }
    }
    try {
      return await plugin.remove(id, options)
    } catch (err) {
      this.handleError(err, options);
    } finally {
      this.context.isProcessing.set(false);
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

    // Enhanced error handling for network and CORS errors
    if (err.status === 0) {
      const errorMessage = 'Network error occurred. This could be due to CORS restrictions or the server being unreachable.';
      err = new Error(errorMessage, { cause: err });
    }

    if (handleError) {
      handleError(err);
    } else {
      throw err;
    }
  }

  private transform(data: any, config?: any): any {
    if (config.map) {
      if (Array.isArray(data)) {
        data = data.map(i => config.map(i));
      } else {
        data = config.map(data)
      }
    }

    if (config.transforms) {
      data = this.transformService.apply(data, config.transforms)
    }

    return data;
  }

}
