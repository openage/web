import { inject, Injectable } from '@angular/core';
import { ContextService } from './context.service';
import { DocumentSourceRegistry } from '../../../../plugins/documents/document-source.registry';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private options: any = {};           // Options for configuring the service
  context = inject(ContextService);
  documentSourceRegistry = inject(DocumentSourceRegistry);

  constructor() { }

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

    this.context.isProcessing.set(true);
    if (!file || !(file instanceof File)) {
      return Promise.reject('Invalid file provided');
    }
    const plugin = this.documentSourceRegistry.getPlugin(options);
    try {
      return await plugin.upload(file, options);
    } catch (err) {
      this.handleError(err, options);
    }
    return;
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
}
