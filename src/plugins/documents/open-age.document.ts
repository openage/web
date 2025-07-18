import { HttpClient, HttpHeaders } from "@angular/common/http";
import { inject } from "@angular/core";
import { ContentService } from "../../lib/oa/core/services/content.service";
import { ContextService } from "../../lib/oa/core/services/context.service";
import { DocumentSourcePlugin } from "../document-source.plugin";
import { firstValueFrom } from "rxjs";
import { ServerData } from "../../lib/oa/core/models";

/**
 * A document source plugin for handling OpenAge-specific document operations.
 * This plugin implements the DocumentSourcePlugin interface and provides
 * functionality for uploading files and tracking upload progress.
 */
export class OpenAgeDocument implements DocumentSourcePlugin {

  // Injected services
  private http = inject(HttpClient);
  private context = inject(ContextService);
  private content = inject(ContentService);


  /**
   * Determines if this plugin can handle the given configuration.
   * @param config - The configuration object to check.
   * @returns true if the plugin can handle the config, false otherwise.
   */
  canHandle(config: any): boolean {
    if (config.type === 'oa') {
      return true;
    }

    const src = config.src || config.url || config.service;
    if (src?.toLowerCase().startsWith('http') || src.startsWith('/')) {
      return false;
    }

    return true;
  }

  /**
   * Uploads a file to the OpenAge service.
   * @param file - The file to upload.
   * @param options - Upload options. Can be a string (treated as field name) or an object with additional settings.
   * @returns Promise resolving with the upload response.
   * @throws Error if the file is invalid.
   */
  public upload = async (file: File, options?: any): Promise<any> => {
    const formData: FormData = new FormData();

    if (!file || !(file instanceof File)) {
      return Promise.reject('Invalid file provided');
    }

    formData.append('file', file);


    if (options && typeof options === 'string') {
      options = { field: options };
    }

    formData.forEach((value, key) => {
      console.log(`${key}:`, value);
    });
    return await firstValueFrom(
      this.http.post<ServerData<any>>(this.uploadFileUrl(options), formData, {
        headers: this.getHeaders(),
        responseType: 'json',
      })
    );

  }

  /**
   * Constructs the URL for file upload based on the provided options.
   * @param options - Configuration options for building the URL.
   *                 Can include service, collection, field, extension, and query parameters.
   * @returns The constructed upload URL.
   * @throws Error if service or URL is invalid.
   * @private
   */
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


  /**
   * Gets the URL to check the progress of a file upload.
   * @param trackingId - The ID used to track the upload progress.
   * @param options - Configuration options for building the URL.
   *                 Can include service, collection, field, extension, and query parameters.
   * @returns The URL to check upload progress.
   * @throws Error if service or URL is invalid.
   */
  public getProgress(trackingId: string, options?: any): string {
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

    const collection = options.collection || `tasks/${trackingId}`;

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

}
