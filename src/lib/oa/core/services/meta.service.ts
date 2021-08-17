import { Injectable } from '@angular/core';
import { Meta, MetaDefinition, Title } from '@angular/platform-browser';
import { environment } from '../../../../environments/environment';
import { ContextService } from './context.service';

@Injectable({
  providedIn: 'root'
})
export class MetaService {
  private _title = environment.title;

  constructor(
    private meta: Meta,
    private titleService: Title,
    private context: ContextService
  ) {
    this.context.title.changes.subscribe(t => {
      this.titleService.setTitle(t || this._title);
    })

    const application = this.context.application();

    this.context.page.changes.subscribe(page => {
      if (!page) return;

      page.discovery = page.discovery || {};



      for (const key in page.discovery) {
        if (Object.prototype.hasOwnProperty.call(page.discovery, key)) {
          this.setMetaTag({
            name: key,
            content: page.discovery[key]
          });
        }
      }

      const description = page.discovery?.description || application?.discovery?.description || ''
      const title = page.discovery?.title || page.title || application?.title || this._title
      const image = page.discovery?.image || application?.discovery?.image
      this.setMetaTag({ name: 'description', description });
      this.setMetaTag({ name: 'og:description', content: description });

      this.setMetaTag({ name: 'og:title', content: title });
      this.titleService.setTitle(title);

      this.setMetaTag({ name: 'og:site_name', content: application?.title || this._title });

      if (page.discovery.type) {
        this.setMetaTag({ name: 'og:type', content: page.discovery.type });
      }

      if (page.url) {
        this.setMetaTag({ name: 'og:url', content: page.url });
      }

      if (image) {
        this.setMetaTag({ name: 'og:image', content: image });
      }
    })

  }

  // setTitle(title?: string): void {
  //   this.titleService.setTitle(title || this._title);
  // }

  // getTitle(): string {
  //   return this.titleService.getTitle();
  // }

  setMetaTag(tag: MetaDefinition): void {
    this.meta.updateTag(tag);
  }

  setMetaTags(tags: Array<MetaDefinition | null>): void {
    tags.forEach((tag) => {
      tag && this.meta.updateTag(tag);
    });
  }

  removeMetaTag(str: string): void { //"name='description'", 'og:url'
    this.meta.removeTag(str);
  }
}
