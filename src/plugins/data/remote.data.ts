import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, firstValueFrom } from 'rxjs';
import { DataSourcePlugin } from '../data-source.plugin';
import { inject } from '@angular/core';
import { Page } from '../../lib/oa/core/models/page.model';
import { ContentService } from '../../lib/oa/core/services/content.service';
import { ContextService } from '../../lib/oa/core/services/context.service';

export class RemoteData implements DataSourcePlugin {

  http = inject(HttpClient);
  private content = inject(ContentService);
  private context = inject(ContextService);


  canHandle(src: any): boolean {
    if (src.provider) {
      return src.provider === 'remote';
    }
    const url = src.url;
    return url.toLowerCase().startsWith('http') || url.startsWith('/')
  }

  public get = async (id: number | string, config?: any): Promise<any> => {
    const apiUrl = this.resourceUrl(id, config);

    return firstValueFrom(
      this.http.get<any>(apiUrl, { headers: this.getHeaders(config) })
    );
  }

  create(model: any, config?: any): Promise<any> {
    throw new Error('Method not implemented.');
  }
  public search = async (query?: any, options?: any): Promise<Page<any> | undefined> => {
    const url = this.getSearchUrl(query, options);
    return firstValueFrom(
      this.http.get<Page<any>>(url, {
        headers: this.getHeaders(options)
      })
    );
  }
  update(id: number | string, model: any, config?: any): Promise<any> {
    throw new Error('Method not implemented.');
  }
  remove(id: number | string, config?: any): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  private resourceUrl(id?: number | string, config?: any): string {
    config = config || {};
    let src = config.src || config.url || config.service;
    if (typeof src === 'string') {
      src = {
        url: src
      }
    }

    let url = src.url
    if (url.startsWith(':')) {
      const serviceCode = src.url.split('/')[0].substring(1);
      const service = this.context.getService(serviceCode);
      if (!service) {
        throw new Error('SERVICE_INVALID', { cause: serviceCode })
      }
      url = url.replace(`:${serviceCode}`, service.url)
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
   * Get HTTP headers for a request.
   * @param config Additional config.
   * @returns The HTTP headers.
   */
  private getHeaders(config?: any): HttpHeaders {
    const headers: { [key: string]: string } = {
      'Accept': 'application/vnd.github.v3+json'
    };

    const configHeaders = config?.src?.headers || config?.headers || {};
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
