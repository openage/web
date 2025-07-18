import { Injectable } from '@angular/core';
import { DocumentSourcePlugin } from '../document-source.plugin';
import { OpenAgeDocument } from './open-age.document';

/**
 * Registry service for document source plugins.
 * Manages the registration and retrieval of document source plugins that handle
 * different types of document operations (upload, download, etc.).
 * This service follows the plugin registry pattern to allow extensible document handling.
 */
@Injectable({
  providedIn: 'root'
})
export class DocumentSourceRegistry {

  /**
   * Collection of registered document source plugins.
   * @private
   */
  private plugins: DocumentSourcePlugin[] = [];

  /**
   * Initializes the registry with default plugins.
   * Currently registers the OpenAgeDocumentPlugin by default.
   */
  constructor() {
    this.registerPlugin(new OpenAgeDocument());
  }

  /**
   * Registers a new document source plugin in the registry.
   * @param plugin - The plugin instance to register.
   */
  registerPlugin(plugin: DocumentSourcePlugin): void {
    this.plugins.push(plugin);
  }

  /**
   * Finds and returns a plugin that can handle the given configuration.
   * @param config - Configuration object used to determine which plugin to use.
   * @returns The first plugin that can handle the given configuration.
   * @throws Error if no suitable plugin is found.
   */
  getPlugin(config: any): DocumentSourcePlugin {
    const plugin = this.plugins.find(plugin => plugin.canHandle(config));

    if (!plugin) {
      throw new Error('Document source plugin not found for the given options');
    }

    return plugin;
  }
}
