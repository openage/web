import { Injectable } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { DataService } from './data.service';
import { from, Observable, of } from 'rxjs';
import { ObservableObject } from '../models/observable.model';
import { ContextService } from './context.service';
import { NavService } from './nav.service';
import { DomainObject } from '../models/domain-object';
import { DomainPage } from '../models/domain-page';
import { Application, Link } from '../models';

@Injectable({
  providedIn: 'root'
})
export class RouteDataResolver implements Resolve<any> {
  constructor(
    private _dataService: DataService,
    private navService: NavService,
    private context: ContextService
  ) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {

    const path = this.navService.getPath(route);
    if (!path) {
      return of(null);
    }
    const page: Link = this.navService.getByPath(path);
    if (!page) {
      return of(null);
    }
    return from(this.buildData(page.meta.data, page));
  }

  private inject = (input: any, getter?: (key: string) => any): any => {
    if (!getter) {
      return input;
    }

    const isObject = typeof input === 'object';

    if (isObject) {
      input = JSON.stringify(input);
    }

    // Regular expression to match content inside {{}}
    const regex = /\{\{(.*?)\}\}/g;
    const keys = [];
    let match;

    // Find all matches
    while ((match = regex.exec(input)) !== null) {
      keys.push(match[1]); // Extract the key inside {{}}
    }

    for (const key of keys) {
      input = input.replace(`{{${key}}}`, getter(key))
    }

    for (const key of keys) {
      input = input.replace(`{{${key}}}`, getter(key))
    }

    for (const key of ['area', 'collection', 'code']) {
      if (input.indexOf(`:${key}`) !== -1) {
        input = input.replace(`:${key}`, getter(key))
      }
    }

    if (isObject) {
      input = JSON.parse(input);
    }

    return input;
  };

  private buildData = async (data: any, page: Link) => {

    if (!data) {
      return;
    }

    if (!Array.isArray(data)) {
      data = [data];
    }

    if (!data) {
      return;
    }
    const extract = async (d: any) => {
      if (typeof d === "string") {
        d = {
          code: d,
          type: 'remote',
          config: {
            src: d
          }
        }
      }

      d.config = d.config || {}
      let result: any;
      if (!d.type) {
        if (d.items) {
          d.type = 'data';
          d.config.items = d.items;
        } else if (d.src) {
          d.type = 'remote';
          d.config.src = d.src
        }
      }

      switch (d.type) {
        case 'data':
          result = this._localData(d, page)
          break;
        case 'remote':
          result = this._remoteData(d, page)
          break;
        case 'search':
          result = this._search(d, page);
          break;
        case 'get':
          result = this._get(d, page);
          break;
        case 'add':
          result = this.add(d, page);
          break;
      }
    }
    return Promise.all(data.map((d: any) => extract(d)))
  }

  private _localData = async (data: any, page: Link) => {

    const item = new ObservableObject<any>();
    this.context.data(data.code, item);

    const v = data.config || data.data || data.config?.data;
    item.set(v)
    return v;
  }

  private _remoteData = async (data: any, page: Link) => {
    const config = this.inject(data.config || data || {}, page.params?.get)

    const item = new ObservableObject<any>();
    this.context.data(data.code, item);

    const v = await this._dataService.search(config.query, {
      page: config.page,
      config: {
        src: config.src || config.url,
        field: config.field,
        extension: config.extension
      }
    })
    item.set(v)
    return v;
  }

  private _get = async (data: any, page: Link) => {
    const config = this.inject(data.config || data || {}, page.params?.get)

    const result = new DomainObject({
      id: config.id
    }, config, this._dataService)
    this.context.data(data.code, result);

    return result.refresh();
  }

  private _search = async (data: any, link: Link) => {
    const config = data.config || data;
    config.service = config.service || config.src || config.url
    const result = new DomainPage({}, {
      query: config.query,
      page: config.page,
      config: config
    }, this._dataService)
    this.context.data(data.code, result);

    return result.refresh();
  }
  public add = async (data: any, link: Link) => {
    const config = data.config || data;
    config.service = config.service || config.src || config.url
    const result = new DomainPage({}, {
      query: config.query,
      page: config.page,
      config: config
    }, this._dataService)
    this.context.data(data.code, result);
    return result.add();
    
      }
}
