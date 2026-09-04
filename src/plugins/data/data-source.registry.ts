import { Injectable } from '@angular/core';
import { GithubData } from './github.data';
import { DataSourcePlugin } from '../data-source.plugin';
import { OpenAgeData } from './open-age.data';
import { RemoteData } from './remote.data';

/**
 * Angular service responsible for managing data source plugins.
 * This registry maintains a collection of plugins that can handle different types of data sources.
 */
@Injectable({
  providedIn: 'root'
})
export class DataSourceRegistry {
  /**
   * Collection of registered data source plugins.
   * Each plugin must implement the DataSourcePlugin interface.
   * @private
   */
  private plugins: DataSourcePlugin[] = [];

  /**
   * Initializes the registry with default plugins.
   * Currently includes OpenAgePlugin and GithubGistPlugin by default.
   */
  constructor() {
    this.registerPlugin(new RemoteData());
    this.registerPlugin(new OpenAgeData());
    this.registerPlugin(new GithubData());
  }

  /**
   * Registers a new data source plugin in the registry.
   * @param plugin The plugin instance implementing DataSourcePlugin interface
   */
  registerPlugin(plugin: DataSourcePlugin): void {
    this.plugins.push(plugin);
  }

  /**
   * Retrieves an appropriate plugin that can handle the given configuration.
   * @param config Configuration object containing details about the data source
   * @returns {DataSourcePlugin} A plugin instance that can handle the given configuration
   * @throws {Error} If no suitable plugin is found for the given configuration
   */
  getPlugin(config: any): DataSourcePlugin {
    config = config || {};
    let src = config.src || config.url || config.service;
    if (typeof src === 'string') {
      src = {
        url: src,
        provider: config.provider
      }
    }

    const plugin = this.plugins.find(plugin => plugin.canHandle(src));

    if (!plugin) {
      throw new Error(`Data source plugin '${src.provider}' not found for the given options`);
    }

    return plugin;
  }
}
