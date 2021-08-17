import { Params } from '@angular/router';
import { Subscription } from 'rxjs';
import { ModelBase } from '.';

export class Link extends ModelBase {
  index = 0;
  parent: any;
  src?: string;
  url?: string;
  activeUrl?: string;
  routerLink?: string[];
  path?: string;
  params?: {
    path?: Params;
    query?: Params;
    fragment?: string;
    get?: (key: string) => any;
  };

  // target: string;
  title?: string;
  discovery: any = {};
  order?: number;
  icon: any;
  handles?: string[];
  class: any;
  options: any;
  isActive = false;
  view = 'link';

  // queryParams: Params;
  current?: Link;
  items?: Link[];
  permissions?: string[];
  layout?: string;
  footer?: string;
  event?: (i: any) => void;
  pullDown?: boolean;

  constructor(obj?: any) {
    super(obj);

    if (!obj) {
      return;
    }
    this.index = obj.index || 0;
    this.src = obj.src;
    this.discovery = obj.discovery || {};

    if (obj.description) {
      this.discovery.description = obj.description;
    }

    if (obj.tags) {
      this.discovery.tags = obj.tags;
    }

    if (obj.title) {
      this.discovery.title = obj.title;
    }
    this.title = obj.title;

    this.order = obj.order;
    this.handles = obj.handles;
    this.event = obj.event;

    this.icon = {};
    if (obj.parent) {
      this.parent = obj.parent;

      // if (obj.parent instanceof Link) {
      //   this.parent = obj.parent;
      // } else {
      //   this.parent = new Link(obj.parent);
      // }
    }
    if (typeof obj.icon === 'string') {
      if (obj.icon.startsWith('http')) {
        this.icon.url = obj.icon;
      } else if (obj.icon.startsWith('fa-')) {
        this.icon.fa = obj.icon.substring(3);
      } else if (obj.icon.startsWith('oa-')) {
        this.icon.oa = obj.icon.substring(3);
      } else if (obj.icon.startsWith('mat-')) {
        this.icon.mat = obj.icon.substring(4);
      } else {
        this.icon.mat = obj.icon;
      }
    } else {
      this.icon = obj.icon;
    }

    this.isActive = obj.isActive;

    this.meta = obj.meta || {};
    this.class = obj.class || "";
    this.view = obj.view || 'link';

    this.params = {
      path: obj.params?.path || obj.pathParams,
      query: obj.params?.query || obj.queryParams,
      fragment: obj.params?.fragment || obj.fragment || '',
      get: obj.params?.get
    };

    this.url = obj.url;

    if (this.url) {
      if (!obj.url.startsWith('http')) {
        obj.path = Link.toPath(obj.url)
        if (obj.url.startsWith('/')) {
          obj.routerLink = [];
          obj.url.split('/').filter((p: any) => p).forEach((p: any) => {
            obj.routerLink.push(obj.routerLink.length ? p : `/${p}`);
          });
        } else {
          obj.routerLink = obj.url.split('/');
        }
      }
      this.params.path = this.params?.path || Link.toPathParams(this.url);
      this.params.query = this.params?.query || Link.toQueryParams(this.url);
      this.params.fragment = this.params.fragment || Link.toFragment(this.url) || '';
    }
    this.path = obj.path;

    if (this.path) {
      this.routerLink = this.path.split('/');
    }

    // if (obj.routerLink && obj.routerLink.length) {
    //   this.routerLink = [];
    //   let path = '';
    //   for (let index = 0; index < obj.routerLink.length; index++) {

    //     let item = obj.routerLink[index];
    //     if (index === (obj.routerLink.length - 1) && item.indexOf('?') !== -1) {
    //       this.params.query = this.params.query || {};

    //       const parts = item.split('?');

    //       item = parts[0];

    //       parts[1].split('&').forEach((p) => {
    //         const query = p.split('=');
    //         this.params.query[query[0]] = query[1];
    //       });
    //     }
    //     path = item.startsWith('/') ? `${path}${item}` : `${path}/${item}`;
    //     this.routerLink.push(item);
    //   }
    //   this.path = path;

    // }

    this.options = obj.options || {};
    if (obj.target && obj.target === '_blank') {
      this.options.newTab = true;
    }


    this.activeUrl = obj.activeUrl;
    this.layout = obj.layout;
    this.footer = obj.footer;


    this.items = [];

    if (obj.items && obj.items.length) {
      this.items = obj.items.map((i: any): Link => {
        const item = new Link(i);
        i.parent = this;
        return item;
      });
    }
    this.permissions = obj.permissions || [];
    this.pullDown = obj.pullDown
  }

  static toPath(url: string) {
    let path = url.split('#')[0].split('?')[0];

    if (path.startsWith('/')) {
      path = path.substring(1);
    }

    return path;
  }

  static toQueryParams(url: string) {
    let query = ''

    const params: any = {}

    if (url.indexOf('?') !== -1) {
      query = url.substring(url.indexOf('?') + 1);
    }

    if (query && query.indexOf('#') !== -1) {
      query = query.split('#')[0];
    }

    if (query) {
      query.split('&').forEach(i => {
        const parts = i.split('=');
        params[parts[0]] = parts[1]
      });
    }

    return params;
  }

  static toPathParams(url: string) {
    const parts = this.toPath(url).split('/');

    const params: any = {}

    for (const part of parts) {
      if (part.startsWith(':'))
        params[part.substring(1)] = null
    }
    return params;
  }

  static toFragment(url: string) {
    if (url.indexOf('#') === -1) {
      return undefined
    }
    let fragment = url.substring(url.indexOf('#') + 1);

    if (fragment.indexOf('?') === -1) {
      fragment = fragment.split('?')[0];
    }

    return fragment;
  }

  static toParams(url: any) {
    const params = [];
    const fragment = this.toFragment(url);

    if (fragment) {
      params.push({ key: 'fragment', value: fragment });
    }

    const query = this.toQueryParams(url);

    for (const key in query) {
      params.push({
        key: key,
        value: query[key]
      })
    }

    const path = this.toPathParams(url);

    for (const key in path) {
      params.push({
        key: key,
        value: path[key]
      })
    }

    return params;
  }
}
