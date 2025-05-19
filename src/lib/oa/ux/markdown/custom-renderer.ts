import { ComponentFactoryResolver, Injector, ViewContainerRef } from '@angular/core';
import * as marked from 'marked';
import { DomSanitizer } from '@angular/platform-browser';

// Map of known custom components
const KNOWN_COMPONENTS: { [key: string]: any } = {

};

export class CustomRenderer extends marked.Renderer {
  constructor(
    private resolver: ComponentFactoryResolver,
    private container: ViewContainerRef,
    private injector: Injector,
    private onComponentCreated: (ref: any) => void
  ) {
    super();
  }

  // Override how HTML is rendered to support Angular components
  override html({ text }: { text: string }): string {
    // Check if the HTML contains any known custom components
    const componentMatch = text.match(/<(\w+-[\w-]+)/);
    if (componentMatch && KNOWN_COMPONENTS[componentMatch[1]]) {
      const tagName = componentMatch[1];
      const placeholderId = `component-${Math.random().toString(36).substr(2, 9)}`;

      // Load the component dynamically
      this.loadComponent(tagName, text);

      // Return a placeholder that will be replaced
      return `<div id="${placeholderId}"></div>`;
    }

    // Default HTML rendering for non-component HTML
    return text;
  }

  private async loadComponent(tagName: string, html: string): Promise<void> {
    try {
      if (!KNOWN_COMPONENTS[tagName]) {
        console.warn(`Unknown component tag: ${tagName}`);
        return;
      }

      const componentLoader = KNOWN_COMPONENTS[tagName];
      const componentModule = await componentLoader();
      const componentClass = Object.values(componentModule)[0] as any;

      // Create the component
      const factory = this.resolver.resolveComponentFactory(componentClass);
      const componentRef = this.container.createComponent(factory);

      // Pass the original HTML as input if the component has an 'html' input
      const instance = componentRef.instance as any;
      if ('html' in instance) {
        instance.html = html;
      }

      // Notify parent about the created component
      this.onComponentCreated(componentRef);
    } catch (error) {
      console.error(`Failed to load component ${tagName}:`, error);
    }
  }
}
