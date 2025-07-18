import { Page } from '../lib/oa/core/models/page.model';

/**
 * Interface for implementing data source plugins.
 * Each plugin handles CRUD operations for a specific data source type.
 */
export interface DataSourcePlugin {
  /**
   * Determines if this plugin can handle the given data source configuration.
   *
   * @param config - Configuration object containing source details
   *                 - type: The type of data source
   *                 - src/url/service: The source endpoint
   *                 - headers: Optional HTTP headers
   *                 - auth: Optional authentication details
   * @returns true if plugin supports this configuration
   */
  canHandle(config: any): boolean;

  /**
   * Creates a new resource in the data source.
   *
   * @param model - Data object to create
   * @param options - Additional options:
   *                 - src: Source endpoint
   *                 - headers: Custom HTTP headers
   *                 - transform: Data transformation function
   * @returns Promise resolving to created resource
   */
  create(model: any, options?: any): Promise<any>;

  /**
   * Searches for resources matching query criteria.
   *
   * @param query - Search parameters:
   *               - filter: Filter criteria
   *               - sort: Sort options
   *               - fields: Fields to return
   * @param options - Additional options:
   *                 - page: Pagination details
   *                 - limit: Results per page
   *                 - cache: Cache settings
   * @returns Promise resolving to page of results
   */
  search(query?: any, options?: any): Promise<Page<any> | undefined>;

  /**
   * Retrieves a single resource by ID.
   *
   * @param id - Resource identifier
   * @param options - Additional options:
   *                 - fields: Fields to return
   *                 - expand: Related resources to include
   *                 - cache: Cache settings
   * @returns Promise resolving to resource
   */
  get(id: number | string, options?: any): Promise<any>;

  /**
   * Updates an existing resource.
   *
   * @param id - Resource identifier
   * @param model - Updated data
   * @param options - Additional options:
   *                 - patch: Patch vs full update
   *                 - version: Optimistic locking
   * @returns Promise resolving to updated resource
   */
  update(id: number | string, model: any, options?: any): Promise<any>;

  /**
   * Removes a resource by ID.
   *
   * @param id - Resource identifier
   * @param options - Additional options:
   *                 - force: Force delete
   *                 - cascade: Cascade delete
   * @returns Promise resolving to deletion success
   */
  remove(id: number | string, options?: any): Promise<boolean>;
}
