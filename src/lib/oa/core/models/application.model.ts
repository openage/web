import { Link } from './link.model';
import { ModelBase } from './model-base.model';
import { Organization } from './organization.model';
import { Pic } from './pic.model';
import { Service } from './service.model';
import { Tenant } from './tenant.model';
import { Theme } from './theme.model';

export class Application extends ModelBase {
  env?: string;
  title?: string;
  discovery: any = {};
  host?: string;
  logo?: Pic;
  splash?: Pic;
  favicon?: Pic;
  version?: string;
  theme?: Theme;
  styles?: string[];
  links: any;
  navs?: Link[];
  services?: Service[];

  level?: string;
  tenant?: Tenant;
  organization?: Organization;

  constructor(obj?: any) {
    super(obj)

    if (!obj) {
      return;
    }
    this.host = obj.host;

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
    this.title = obj.title || obj.name;
    this.version = obj.version || '1.0.0';

    if (obj.theme) {
      this.theme = new Theme(obj.theme);
    }

    this.styles = obj.styles || [];
    this.env = obj.env || 'prod';
    this.level = obj.level || 'tenant';

    if (obj.logo) {
      this.logo = new Pic(obj.logo)
    }

    if (obj.favicon) {
      this.favicon = new Pic(obj.favicon)
    }

    if (obj.splash) {
      this.splash = new Pic(obj.splash)
    }

    if (obj.navs) {
      this.navs = obj.navs.map((n: any) => new Link(n));
    }

    if (obj.links) {
      this.links = obj.links;
    }

    if (obj.services) {
      this.services = obj.services.map((s: any) => new Service(s));
    }

    if (obj.tenant) {
      this.tenant = new Tenant(obj.tenant);
    }

    if (obj.organization) {
      this.organization = new Organization(obj.organization);
      this.level = 'organization';
    }
  }

  public getService = (code: string) => {
    return this.services?.find((s) => s.code?.toLowerCase() === code.toLowerCase());
  }


}
