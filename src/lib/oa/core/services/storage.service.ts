import { Inject, Injectable } from '@angular/core';
import { Link } from '../models/link.model';
import { InProcessStorage } from './in-process-storage';
import { environment } from '../../../../environments/environment';
import { DOCUMENT } from '@angular/common';
import { Logger } from '../models';

// eslint-disable-next-line max-classes-per-file
@Injectable({
  providedIn: 'root',
})
export class StorageService {

  store: Storage;
  currentPage?: Link;
  logger = new Logger(StorageService);

  constructor(
    @Inject(DOCUMENT)
    private document: Document
  ) {
    switch (environment.session.cache.storage) {
      case 'session':
      case 'temporary':
        this.store = document.defaultView?.sessionStorage || new InProcessStorage();
        break;
      case 'none':
        this.store = new InProcessStorage();
        break;
      case 'local':
      case 'permanent':
      default:
        this.store = document.defaultView?.localStorage || new InProcessStorage();
        break;
    }
  }

  getItem(key: string): any {
    return this.store.getItem(key);
  }

  setItem(key: string, value: string): void {
    this.store.setItem(key, value);
  }

  clear(): void {
    return this.store.clear();
  }

  get(id: string, builder?: () => any): any {
    const item = this.store.getItem(id);
    try {
      if (item) {
        return JSON.parse(item);
      }
      if (builder) {
        const value = builder();
        this.set(id, value);
        return value;
      }
      return null;
    } catch (err) {
      this.logger.error(err);
      return null;
    }
  }

  set(id: string, value: any): any {
    if (!value) {
      this.store.removeItem(id);
    } else {
      if (typeof value === 'object') {
        this.store.setItem(id, JSON.stringify(value));
      } else {
        this.store.setItem(id, value);
      }
    }
    return value;
  }

  update(id: string, value: any): any {
    return this.set(id, value);
  }

  remove(id: string) {
    this.store.removeItem(id);
  }

  components(name: string) {
    return {
      set: (key: string | number, value: any): any => {
        const components = this.get('components') || {};
        if (this.currentPage && this.currentPage.code) {
          const code = this.currentPage.code.split('.').join('-');
          name = `${name}|${code}`;
        }
        components[name] = components[name] || {};
        components[name][key] = value;
        this.set('components', components);
        return value;
      },
      get: (key: string | number, defaultValue?: any): any => {
        const components = this.get('components') || {};
        if (this.currentPage && this.currentPage.code) {
          const code = this.currentPage.code.split('.').join('-');
          name = `${name}|${code}`;
        }
        components[name] = components[name] || {};

        const value = components[name][key];
        return value === undefined ? defaultValue : components[name][key];
      }
    };
  }

  public saveLink(link: Link) {
    this.setPage(link)
  }

  public setPage(item: Link) {
    this.currentPage = item;
  }

}
