/* eslint-disable prefer-const */
/* eslint-disable no-prototype-builtins */
import { Location } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Params, Router } from '@angular/router';
// import { Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Application, Entity, Link, Logger } from '../models';
import { Service } from '../models/service.model';
import { ContextService } from './context.service';
import { MetaService } from './meta.service';
import { StorageService } from './storage.service';


@Injectable({
  providedIn: 'root'
})
export class NavService {

  byPath: any = {};
  byCode: any = {};
  byEntity: any = {};
  navs: any = [];

  logger = new Logger(NavService);

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private context: ContextService,
    private metaService: MetaService,
    private storageService: StorageService,
    // private auth: RoleService
  ) {
    this.context.applicationChanges.subscribe(() => this.init());
    this.context.roleChanges.subscribe(() => this.init());
    // this.context.page.changes.subscribe(() => this.context.actions.clear());

    // this.context.path.subscribe(path => {
    //   this.register(path)
    // })
  }


  /**
   * Extracts the path from a URL.
   * @param url - The URL to extract the path from.
   * @returns The extracted path.
   * @example
   * const path = this.extractPath('http://example.com/path?query=1');
   */
  private extractPath(url?: string) {
    if (!url) {
      return '';
    }

    return url.split('#')[0].split('?')[0]
  }

  /**
   * Extracts the parameters from a URL.
   * @param url - The URL to extract parameters from.
   * @returns An object containing the extracted parameters.
   * @example
   * const params = this.extractParams('http://example.com/path?query=1');
   */
  private extractParams(url?: string) {
    const params: any = {};

    if (!url) {
      return params;
    }

    if (url.indexOf('#') !== -1) {
      let fragment = url.substring(url.indexOf('#') + 1);

      if (fragment.indexOf('?') === -1) {
        fragment = fragment.split('?')[0];
      }

      if (fragment) {
        params['fragment'] = fragment;
      }
    }

    let query = ''

    if (url.indexOf('?') !== -1) {
      query = url.substring(url.indexOf('?') + 1);
    }

    if (query && query.indexOf('#') !== -1) {
      query = query.split('#')[0];
    }

    if (query) {
      query.split('&').forEach(i => {
        const parts = i.split('=');
        params[parts[0]] = parts[1];
      });
    }

    return params;
  }

  /**
   * Gets the navigation details for a given page.
   * @param page - The page link.
   * @returns An object containing navigation details.
   * @example
   * const nav = this.getNav(currentPage);
   */
  private _getNav(page?: Link) {
    return {
      page,
      is: (key: string, params?: any) => {

        if (key.startsWith('/')) {
          return this._isCurrent(key);
        }

        const item = this.getByCode(key);

        if (!item) {
          return false;
        }
        params = params || {};
        const path = (item.item.path || '').split('/').map((p: string) => {
          if (p.startsWith(':')) {
            return params[p.substring(1)];
          }
        }).join('/');

        return this._isCurrent(path);
      },
      get: (key: string, route: ActivatedRoute) => {
        const snapshot = route.snapshot;

        if (snapshot.paramMap.has(key)) {
          return snapshot.paramMap.get(key);
        }

        if (snapshot.queryParamMap.has(key)) {
          return snapshot.queryParamMap.get(key);
        }

        return null;
      }
    };
  }

  /**
 * Checks if the user has access to a given link.
 * @param link - The link to check access for.
 * @returns True if the user has access, otherwise false.
 * @example
 * const hasAccess = this.hasAccess(someLink);
 */
  private hasAccess(link: Link) {
    if (this.context.hasPermission(link.permissions)) {
      return true;
    }

    if (link.items) {
      for (const item of link.items) {
        if (this.context.hasPermission(item.permissions)) {
          return true;
        }
      }
    }
    return false;
  }




  private _injectUrl = (url?: string) => {
    if (!url) {
      return '';
    }

    if (url.startsWith('http') || url.startsWith('/')) {
      return url;
    }

    let serviceCode = 'app';
    if (url.startsWith(':')) {
      serviceCode = url.split('/')[0].substring(1);
    }
    const service: any = environment.services.find((s: any) => s.code === serviceCode)

    if (!service) {
      throw new Error(`service '${serviceCode}' is not defined in environment.services section`)
    }

    if (url.startsWith(':')) {
      url = url.replace(`:${serviceCode}`, service.url)
    } else {
      url = `${service.url}/${url}`
    }

    return url
  }



  private _getUrl = (code?: string) => {
    let services: Service[] = [];
    let url

    const application = this.context.currentApplication();
    if (application && application.services && application.services.length) {
      services = application.services
    } else {
      services = (environment.services || []).map(s => new Service(s))
    }

    const service = services.find((s) => s.code === code);
    if (service) {
      url = service.url;
    }

    return url;
  }

  // private saveNavs(code: any, meta: any) {
  //   let application = this.context.currentApplication()

  //   function saveNav(items: any[], code: string, count: number): void {
  //     let c = code.split('.')
  //     let currentCode = c[count]
  //     let nav = (items || []).find(item => item.code.includes(currentCode));

  //     if (nav && nav.code === code) {
  //       nav.meta = meta
  //       return
  //     } else if (nav && nav.items.length) {
  //       count++
  //       saveNav(nav.items, code, count)
  //     } else {
  //       return
  //     }
  //   }

  //   saveNav(application.navs || [], code, 0)
  //   // this.auth.setTenant(tenant)
  // }




  private params = (link: Link, route: ActivatedRouteSnapshot) => {

    const application = this.context.application();

    function fromRoute(key: string, snapshot: ActivatedRouteSnapshot) {
      if (snapshot.paramMap.has(key)) {
        return snapshot.paramMap.get(key);
      }

      if (snapshot.queryParamMap.has(key)) {
        return snapshot.queryParamMap.get(key);
      }

      if (snapshot.parent) {
        return fromRoute(key, snapshot.parent);
      }

      return;
    }

    function fromPage(key: string, page: Link) {
      const query = page.params?.query || {};
      const path = page.params?.path || {};
      const fragment = page.params?.fragment || '';
      const params = Object.assign({}, query, path)
      params['fragment'] = fragment
      if (params[key]) {
        return params[key];
      }

      if (page.parent) {
        return fromPage(key, page.parent);
      }

      return;
    }

    function fromMeta(key: string, page: Link) {
      if (page.meta.params && page.meta.params[key]) {
        return page.meta.params[key];
      }

      if (page.parent) {
        return fromMeta(key, page.parent);
      }
      return (application?.meta?.page?.params || {})[key]
    }

    return (key: string) => {
      let value = fromPage(key, link);

      if (!value) {
        value = fromMeta(key, link);
      }
      if (!value) {
        value = fromRoute(key, route);
      }
      return value;
    }
  }

  _isCurrent(url: string): boolean {
    const link = url.endsWith('/') ? url.substring(0, url.length - 1) : url;
    const currentUrl = decodeURIComponent(this.router.url.split('?')[0].split('#')[0]).toLowerCase();
    return link.toLowerCase() === currentUrl.toLowerCase();
  }



  // get(key: string, onMatch?: () => void) {
  //   if (!key) {
  //     return;
  //   }

  //   if (key.startsWith('/')) {
  //     const navByPath = this._breadcrumbCodes.find((l) => l.path && key.toLowerCase() === l.path.toLowerCase());

  //     return {
  //       page: navByPath ? navByPath.item : null,
  //       is: (path: string) => this.router.isActive(path, true),
  //       get: this.getParam,
  //       change: this.navChanges
  //     };
  //   }

  //   const navByCode = this._breadcrumbCodes.find((l) => l.code && key.toLowerCase() === l.code.toLowerCase());

  //   return {
  //     page: navByCode ? navByCode.item : null,
  //     is: (path: string) => this.router.isActive(path, true),
  //     get: this.getParam,
  //     change: this.navChanges
  //   };

  // }

  // isCurrentPage(code: string | Link): boolean {

  //   if (this._currentPage) {
  //     if (typeof code === 'string') {
  //       return this._currentPage.code === code;
  //     } else {
  //       return this._currentPage.code === code.code;
  //     }
  //   }
  //   const item = typeof code === 'string' ? this.get(code) : code;

  //   return this.router.isActive(item.path, true);

  //   // let url = this.router.url;

  //   // if (url.indexOf('?') !== -1) {
  //   //   url = url.split('?')[0];
  //   // }

  //   // return item.path === url;
  // }

  private _gotoElement(key: string) {
    setTimeout(() => {
      const el = document.getElementById(key);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  private _gotoApplication(key: string, newTab = false) {
    if (newTab) {
      window.open(key, '_blank');
    } else {
      window.location.href = key
    }
  }

  private _gotoRoute(key: string, queryParams: any, newTab = false) {
    return newTab ? window.open(key, '_blank') : this.router.navigate([key], {
      queryParams: queryParams
    });
  }


  /**
 * Initializes the navigation service by setting the navigation structure.
 * @example
 * this.context.applicationChanges.subscribe(() => this.init());
 */
  public init() {
    let navs = this.context.application()?.navs;
    this.byPath = {};
    this.byCode = {};
    this.byEntity = {};
    this.navs = [];

    const parse = (links: any[], parent?: Link) => {
      if (!links || !links.length) {
        return;
      }

      for (const linkItem of links) {

        if (parent) {
          linkItem.parent = parent;
        }

        if (linkItem.items && linkItem.items.length) {
          parse(linkItem.items, linkItem);
        }

        const item = new Link(linkItem);
        item.params = this.extractParams(item.url)

        if (item.code) {
          this.byCode[item.code] = item
        }

        if (item.handles && item.handles.length) {
          item.handles.forEach((handle) => {
            this.byEntity[handle.toLowerCase()] = item;
          });
        }

        let path = this.extractPath(item.url)

        if (path) {
          this.byPath[path] = item;
        }

        this.navs.push(item);
      }
    }
    // navs = (navs || []).filter((n) => this.hasAccess(n));
    parse(navs || []);
    this.context.navs.set(navs);
  }

  /**
 * Sets the navigation structure.
 * @param navs - The navigation links to set.
 * @example
 * this.setNav(application.navs);
 */
  public setNav(navs?: Link[]) {

  }

  /**
 * Sets the current page based on a given code or Link object.
 *
 * @param page - The code or Link object to set the page.
 * @returns The Link object corresponding to the set page, if found.
 * @example
 * await this.navService.setPage('home');
 */
  public setPage = async (page: Link) => {
    if (!page) {
      return; // Exit if no code is provided
    }


    const setActive = (i: Link, status: boolean) => {
      i.isActive = status;
      if (i.parent) {
        setActive(i.parent, status);
      }
    }

    let current = this.context.page.get();

    if (current) {
      setActive(current, false);
    }

    setActive(page, true);
    this.storageService.saveLink(page); // Save the current link
    this.context.page.set(page)
    return page; // Return the link object
  }

  public populateMeta = async (link: Link) => {
    const log = this.logger.get('setPageMeta');
    const meta = link.meta || link.layout || link.footer;

    if (!meta) {
      return {};
    }
    let url = typeof meta === 'string' ? meta : meta.src || meta.ref;
    if (!url) {
      return meta
    }
    url = this._injectUrl(url);

    log.debug(`getting meta from url: ${url}`);

    if (!(url.startsWith('http') || url.startsWith('/'))) {
      const parts = url.split(':')
      url = `${this._getUrl(parts[0])}${parts[1]}`
    }

    const parts = url.split('?')[0].split('.');
    const type = parts[parts.length - 1] || ''
    const isText = 'HTML|MD|TXT|TEXT'.indexOf(type.toUpperCase()) > -1;
    let req: any;
    if (isText) {
      req = this.http.get(url, { responseType: 'text' })
    } else {
      req = this.http.get(url, { responseType: 'json' })
    }

    let res: any;
    if (req) {
      res = await req.toPromise();
    }

    log.debug('got meta');

    let content = type ? res : res?.data?.content;

    if (typeof content === 'string') {

      switch (type.toUpperCase()) {
        case 'JSON':
          content = JSON.parse(content);
          break;
        case 'HTML':
          content = {
            divs: [{
              control: 'html',
              html: content
            }]
          }
          break;

        case 'MD':
          content = {
            divs: [{
              control: 'markdown',
              markdown: content
            }]
          }
          break;

        case 'TXT':
        case 'TEXT':
          content = {
            divs: [{
              control: 'text',
              text: content
            }]
          }
          break;
      }
    }

    return content;
  }

  public getByPath = (path: string) => {
    return this.byPath[path.toLowerCase()];
  }

  /**
   * Gets a navigation item by its code.
   * @param code - The code of the navigation item.
   * @returns The navigation item.
   * @example
   * const navItem = this.getNavByCode('home');
   */
  public getByCode = (code: string) => {
    return this.byCode[code.toLowerCase()];
  }

  /**
   * Gets the page that handles for a specific type of entity.
   * @param type - The type of entity handler to retrieve.
   * @returns The entity handler.
   * @example
   * const handler = this.navService.getEntityHandler('user');
   */
  public getByEntity = (type: string) => {
    return this.byEntity[type.toLowerCase()];
  }

  public getPath = (route: ActivatedRouteSnapshot) => {
    let path = '';
    if (route.parent) {
      path += this.getPath(route.parent);
    }

    if (route.routeConfig?.path) {
      path = `${path}/${route.routeConfig.path}`;
    }

    return path.split('/').map((p) => {
      if (p.startsWith(':')) {
        const key = p.substring(1);
        const value = this.getValue(key, route);
        if (value) {
          p = value;
        }
      }
      return p;
    }).join('/');
  }

  private getValue = (k: string, ss: ActivatedRouteSnapshot): any => {
    if (ss.paramMap.has(k)) {
      return ss.paramMap.get(k);
    }

    if (ss.queryParamMap.has(k)) {
      return ss.queryParamMap.get(k);
    }

    if (ss.parent) {
      return this.getValue(k, ss.parent);
    }

    // const fragment = snapshot.fragment;
    return;
  }

  public getLink = (key?: any): any => {
    if (!key) {
      return;
    }

    // function getPath(ss: ActivatedRouteSnapshot) {
    //   let path = '';
    //   if (ss.parent) {
    //     path += getPath(ss.parent);
    //   }

    //   if (ss.routeConfig && ss.routeConfig.path) {
    //     path = `${path}/${ss.routeConfig.path}`;
    //   }
    //   return path;
    // }



    let path: string;
    let snapshot: ActivatedRouteSnapshot;
    if (key instanceof ActivatedRouteSnapshot) {
      snapshot = key;
      path = this.getPath(snapshot);
    } else {
      path = key.split('/').map((p: string) => {
        if (p.startsWith(':')) {
          const key = p.substring(1);
          const value = this.getValue(key, snapshot);
          if (value) {
            p = value;
          }
        }
        return p;
      }).join('/');
      snapshot = this.route.snapshot;
    }



    let item = this.getByPath(path);

    if (!item) {

      const actualPathParts = path.split('?')[0].split('/').filter(p => p !== '');

      item = this.navs.find((n: Link) => {
        // const linkPath = this.toUrl(l.path, route);
        if (!n.path) {
          return false;
        }

        const linkPathParts = n.path.split('?')[0].split('/').filter(p => p !== '');

        if (actualPathParts.length !== linkPathParts.length) {
          return false;
        }

        for (let index = 0; index < linkPathParts.length; index++) {
          let linkValue: any = linkPathParts[index];
          const actualValue = actualPathParts[index];
          if (linkValue.startsWith(':')) {
            linkValue = this.getValue(linkValue.substring(1), snapshot)
          }

          if (linkValue !== actualValue) {
            return false;
          }
        }
        return true;
      })
    }

    if (!item) {
      const parentPath = path.split('/').slice(0, -1).join('/');
      return this.getLink(parentPath);
    }

    item.meta = item.meta || {};
    item.path = path;
    item.routerLink = [path];
    item.params = item.params || {};
    item.params.get = this.params(item, snapshot)
    return item;
  }


  /**
   * Navigates to a specified path or URL based on the provided key.
   * The key can be a string, Link object, array, or other types of entities.
   *
   * @param key - The target path, URL, Link object, array of paths, or entity to navigate to.
   * @param params - Optional parameters for the navigation, including path, query, and fragment.
   * @param options - Optional options for the navigation, such as whether to open in a new tab.
   *
   * @returns void
   *
   * @example
   * this.goto('/home');
   * this.goto('https://example.com', { query: { id: 1 } }, { newTab: true });
   * this.goto(['path', 'to', 'route'], { query: { id: 1 } });
   * this.goto(someLinkObject);
   */
  goto(key: string | Link | string[] | any, params?: any, options?: any) {
    // Exit early if no key is provided
    if (!key) {
      return;
    }

    // Initialize params if not provided
    params = params || {};
    const pathParams = params.path || {};
    const queryParams = params.query;
    const fragment = params.fragment;
    const newTab = options?.newTab || key.options?.newTab;

    let nav: any = Link;

    // Handle different types of 'key' values
    if (typeof key === 'string') {
      // Handle internal fragment navigation
      if (key.startsWith('#')) {
        const el = document.getElementById(key.split('#')[1]);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
        return;
      }

      if (key.startsWith('http')) {
        // Handle external or internal URL navigation
        return newTab
          ? window.open(key, '_blank')
          : window.location.href = key;
      }

      if (key.startsWith('/')) {
        // Handle internal route navigation
        return newTab
          ? window.open(key, '_blank')
          : this.router.navigate([key], { queryParams });
      }
      // Handle navigation using breadcrumb codes
      nav = this.getByCode(key);
      // if (!nav) {
      //   return this.gotoParent(key, params);
      // }
    } else if (Array.isArray(key)) { // Handle array of navigation paths
      this.router.navigate(key, { queryParams });

      // Handle fragment navigation after route change
      if (fragment) {
        setTimeout(() => {
          const el = document.getElementById(fragment);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }
      return;
    } else if (!(key instanceof Link)) { // Handle entity handler navigation
      nav = this.getByEntity(key.type);
      pathParams['id'] = key.id || key.code;
      pathParams['code'] = key.code || key.id;
      for (const item in key) {
        if (!pathParams.hasOwnProperty(item)) {
          pathParams[item] = key[item];
        }
      }
    } else { // Handle direct Link object navigation
      nav = key;
    }

    // Perform navigation based on the resolved 'nav' object
    if (nav?.routerLink && nav.routerLink.length) {
      const parts = nav.routerLink.map((p: any) => {
        if (!p.startsWith(':')) {
          return p;
        }
        const param = pathParams[p.substring(1)];
        return param;
      });

      this.router.navigate(parts, {
        queryParams: queryParams || nav.params.query,
        fragment: fragment || nav.params.fragment
      });
    } else if (nav?.url) { // Handle URL navigation
      let url = nav.url;

      // Replace URL parameters
      for (const key in pathParams) {
        url = url.replace(`:${key}`, pathParams[key]);
      }

      // Append query parameters to URL
      if (params.query) {
        url = `${url}${url.indexOf('?') < 0 ? '?' : '&'}${(new HttpParams({ fromObject: params.query })).toString()}`;
      }
      window.open(url, newTab ? '_blank' : '_self');
    } else { // Default to going back if no navigation target is resolved
      this.back();
    }
    return
  }

  gotoParent(code: string | Link, params?: any, options?: any) {
    if (!code) {
      return;
    }
    const linkCode = typeof code === 'string' ? code : code.code as any;
    const link = this.getByCode(linkCode);

    if (!link || !link.parent) {
      this.back();
    }

    this.goto(link, params, options);
  }

  setLabel(page: Link, label: string) {
    page.title = label;
    this.context.breadcrumbs.update(i => i.code === page.code, i => i.title = label)

    if (this.context.page.get()?.code === page.code) {
      this.context.title.set(label)
    }
  }

  setByPath(path: string, page: Link) {
    this.byPath[path.toLowerCase()] = page;
  }

  back(key?: string | Link | string[] | Entity, params?: any) {
    if (key) {
      this.goto(key, params);
    } else if (this.router.navigated) {
      this.location.back(); // Use the browser's history
    } else {
      this.goto('home');
    }
  }

  reset() {
    this.context.title.clear();
    this.context.breadcrumbs.clear();
  }

  // title(item?: string | null): string | undefined {
  //   if (item === undefined) {
  //     return this._title;
  //   }
  //   if (item === null) {
  //     return this.resetTitle()
  //   } else {
  //     return this.setTitle(item);
  //   }

  // }

  // private setTitle(title?: string) {
  //   this._title = title;

  //   this.metaService.setTitle(title);
  //   this._titleSubject.next(title);

  //   return this._title;
  // }

  // private resetTitle() {
  //   this._title = '';
  //   this.metaService.setTitle(this._title);
  //   this._titleSubject.next(this._title);
  //   return this._title;
  // }

  setDescription(description: string) {
    this.metaService.setMetaTag({ name: 'description', content: description });
  }

  resetDescription() {
    this.metaService.removeMetaTag("name='description'");
  }

  changeQueryParams(params: Params, route: ActivatedRoute, handler?: 'merge' | 'preserve' | '') {
    this.router.navigate([], {
      relativeTo: route,
      queryParams: params,
      queryParamsHandling: handler || 'merge'
    });
  }
}
