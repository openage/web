import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, firstValueFrom } from 'rxjs';
import { DataSourcePlugin } from '../data-source.plugin';
import { inject } from '@angular/core';
import { Page } from '../../lib/oa/core/models/page.model';

export class GithubData implements DataSourcePlugin {

  http = inject(HttpClient);

  canHandle(src: any): boolean {
    if (src.provider) {
      return src.provider === 'github';
    }
    const url = src.url;

    return url.includes('gist.githubusercontent.com');
  }

  get(id: number | string, config?: any): Promise<any> {
    const apiUrl = this.resourceUrl(id, config);

    return firstValueFrom(
      this.http.get<any>(apiUrl, { headers: this.getHeaders(config) }).pipe(
        map(response => {
          // Extract content from the first file in the gist
          const firstFile = Object.values(response.files)[0] as any;
          return firstFile.content;
        })
      )
    );
  }

  create(model: any, config?: any): Promise<any> {
    throw new Error('Method not implemented.');
  }
  search(query?: any, config?: any): Promise<Page<any> | undefined> {
    throw new Error('Method not implemented.');
  }
  update(id: number | string, model: any, config?: any): Promise<any> {
    throw new Error('Method not implemented.');
  }
  remove(id: number | string, config?: any): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  private resourceUrl(id?: number | string, config?: any): string {
    const resource = config?.src?.resource || config?.resource || config?.src?.collection || config?.collection;
    id = id || resource?.id || config?.src?.id || config.id
    const type = resource?.type || resource;
    // const resource = `${id}`;
    // https://gist.githubusercontent.com/user/gistId/raw/
    // const gistId = resource.includes('/') ? resource.split('/')[4] : resource;
    return `https://api.github.com/${resource}/${id}`;
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
