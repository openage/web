/**
 * Interface defining the contract for document source plugins.
 * Document source plugins handle document-related operations like file uploads
 * for different types of storage or services. This interface ensures all plugins
 * implement the necessary methods for document handling.
 */
export interface DocumentSourcePlugin {

  /**
   * Determines if this plugin can handle the given configuration.
   * @param config - Configuration object that may contain type, source, URL, or service information.
   * @returns true if the plugin can handle documents with this configuration, false otherwise.
   */
  canHandle(config: any): boolean;

  /**
   * Uploads a file using this document source plugin.
   * @param file - The file to upload.
   * @param options - Optional configuration for the upload process. May include:
   *                 - field: The form field name for the file
   *                 - service: The target service identifier
   *                 - collection: The target collection or folder
   *                 - extension: File extension handling
   *                 - query: Additional query parameters
   * @returns A promise that resolves with the upload response.
   */
  upload(file: File, options?: any): Promise<any>
}
