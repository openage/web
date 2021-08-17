import moment from 'moment';
import { Application } from '../models/application.model';
import { Tenant } from '../models/tenant.model';
import { Logger, Organization, Pic, Theme } from '../models';
import { environment } from '../../../../environments/environment';
import { Link } from '../models/link.model';
import { Service } from '../models/service.model';

class Cache {
  store: Storage;
  logger = new Logger(Cache);

  constructor() {
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

}

class InProcessStorage implements Storage {
  store: any = {};

  [name: string]: any;
  length: number = 0;

  clear(): void {
    this.store = {};
  }
  getItem(key: string): string | null {
    return this.store[key] as string;
  }
  key(index: number): string | null {
    const keys = Object.getOwnPropertyNames(this.store);

    if (!keys || !keys.length) {
      return null;
    }
    return this.store[keys[0]];
  }
  removeItem(key: string): void {
    this.store[key] = undefined;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
}

export class EnvironmentService {
  logger = new Logger('EnvironmentService');

  private application?: Application;

  private cache = new Cache();

  public init = async () => {
    const log = this.logger.get('init')
    this.application = this.cache.get('application');

    if (this.application && this.application.timeStamp &&
      moment(this.application.timeStamp).add(environment.session.cache.duration, 'm').isAfter(new Date())) {
      return this.application;
    }


    const location = window.document.location;

    let host: string | null = location.host;

    if (host.includes('netlify.app')) {
      host = host.split('.')[0].replace('-', '.');
    }

    if (host === environment.debug.host) { // Hack to handle multiple hosts
      host = environment.host;
    }

    const params = new URLSearchParams(location.search);
    if (params.has('host')) {
      host = params.get('host') || '';
    }

    const applicationUrl = environment.ref.replace('{{host}}', host);
    let applicationData = await this.getData(applicationUrl);

    applicationData = await this.overrides(applicationData);
    applicationData.code = applicationData.code || environment.code;
    applicationData.name = applicationData.name || environment.name;
    applicationData.env = applicationData.env || environment.env;
    applicationData.timeStamp = applicationData.timeStamp || new Date();
    applicationData.navs = await this.polulatedNav(applicationData.navs);
    this.application = new Application(applicationData);


    const tenantUrl = `${this.application.getService('directory')?.url}/tenants/${this.application.tenant?.code}`;
    const tenantData = await this.getData(tenantUrl);
    const tenant = new Tenant(tenantData);
    this.cache.set('tenant', tenant);


    if (this.application.organization) {
      const organizationUrl = `${this.application.getService('directory')?.url}/organizations/${this.application.organization?.code}`;
      const organizationData = await this.getData(organizationUrl);
      const organization = new Organization(organizationData);
      this.cache.set('organization', organization);
    }

    this.cache.set('application', this.application)

    log.end();
    return
  }

  private getData = async (url: string) => {
    let dataModel: any = await this.getFromUrl(url);

    if (dataModel.isSuccess === undefined) {
      dataModel = {
        isSuccess: true,
        data: dataModel
      }
    }

    const isSuccess = dataModel.isSuccess !== undefined ? dataModel.isSuccess : (dataModel as any).IsSuccess;
    if (!isSuccess) {
      const errorCode = dataModel.error || dataModel.code || dataModel.message || 'failed';
      throw new Error(errorCode === 'RESOURCE_NOT_FOUND' ? 'Application does not exist' : errorCode);
    }

    return dataModel.data;
  }

  private injectUrl(url?: string) {
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

  private async getFromUrl(url: string) {

    url = this.injectUrl(url);

    const headers: any = new Headers();
    headers.append('Content-Type', 'application/json')

    // TODO: Temporary hack to prevent headers

    // if (this.application?.code) {
    //   headers.append('x-application-code', this.application.code);
    // }

    // const role = this.cache.get('role');
    // const session = this.cache.get('session');
    // if (session?.token) {
    //   headers.append('x-access-token', session.token);
    // } else if (session?.id) {
    //   headers.append('x-session-id', session.id);
    // } else if (role?.key) {
    //   headers.append('x-role-key', role.key);
    // } else {
    //   let organization: any = environment.organization;
    //   if (!organization?.code) {
    //     organization = this.application?.organization;
    //   }
    //   if (organization?.code) {
    //     headers.append('x-organization-code', organization.code);
    //   }

    //   let tenant: any = environment.tenant;
    //   if (tenant?.code) {
    //     tenant = this.application?.tenant;
    //   }
    //   if (tenant?.code) {
    //     headers['x-tenant-code'] = tenant.code;
    //   }
    // }

    const response = await fetch(url, { method: 'GET', headers: headers });

    return response.json();
  }

  private async overrides(data: Application) {
    const logo = data.logo || environment.logo || {};
    if (logo?.url) {
      logo.url = this.injectUrl(logo?.url);
    }
    data.logo = new Pic(logo);

    const splash = data.splash || environment.splash || {};
    if (splash?.url) {
      splash.url = this.injectUrl(splash?.url);
    }
    data.splash = new Pic(splash);

    const favicon = data.favicon || environment.favicon;
    if (favicon?.url) {
      favicon.url = this.injectUrl(favicon?.url);
    }
    data.favicon = new Pic(favicon);

    if (environment.navs && environment.navs.length) {
      const navs = [];
      const appNavs = (data.navs || []).map((n) => typeof n === 'string' ? new Link({ code: n }) : new Link(n));
      const envNavs = environment.navs.map((n) => typeof n === 'string' ? new Link({ code: n }) : new Link(n));
      // overrides
      appNavs.forEach(n => {
        const overrideNav = envNavs.find(i => i.code && n.code && i.code.toLowerCase() === n.code.toLowerCase());
        navs.push(overrideNav || n);
      });

      // additionals
      navs.push(...envNavs.filter(o => !appNavs.find(n => n.code && n.code === o.code)))

      data.navs = navs;
    }

    if (environment.services && environment.services.length) {
      const services = environment.services.map((s) => new Service(s));

      if (data.services && data.services.length) {

        data.services.forEach((service) => {
          if (!services.find((s) => s.code === service.code)) {
            services.push(service);
          }
        });
      }

      data.services = services;
    }

    const theme = data.theme || environment.theme || {};
    data.theme = new Theme(theme)
    data.theme.style = this.injectUrl(data.theme.style);
    data.theme.icon = this.injectUrl(data.theme.icon);

    let meta: any = data.meta || environment.meta || {};
    const metaSource = typeof meta === 'string' ? meta : meta.src
    if (metaSource) {
      meta = await this.getFromUrl(metaSource);
    }

    data.meta = meta;
    // for (const key in meta) {
    //   data.meta[key] = meta[key];
    // }
    return data;
  }

  private polulatedNav = async (navs: Link[]) => {

    const items = [];
    for (const nav of navs) {
      items.push(await this.getNav(nav));
    }
    return items;
  }

  private getNav = async (link: any) => {

    if (typeof link === 'string') {
      link = { src: link };
    }

    let l = link;
    const src = link.src;

    if (link.src) {
      l = await this.getFromUrl(link.src);
    }

    if (l.items && l.items.length) {
      l.items = await this.polulatedNav(l.items);
    }
    return new Link(l);
  }
}
