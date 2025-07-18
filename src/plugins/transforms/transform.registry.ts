import { Injectable } from '@angular/core';
import { TransformPlugin } from '../transform.plugin';
import { ExtractTransform } from './extract.transform';


@Injectable({
  providedIn: 'root'
})
export class TransformRegistry {


  private plugins: TransformPlugin[] = [];


  constructor() {
    this.registerPlugin(new ExtractTransform());
  }


  registerPlugin(plugin: TransformPlugin): void {
    this.plugins.push(plugin);
  }


  getPlugin(type: any): TransformPlugin {
    const plugin = this.plugins.find(plugin => plugin.canHandle(type));

    if (!plugin) {
      throw new Error('Transform plugin not found for the given options');
    }

    return plugin;
  }
}
