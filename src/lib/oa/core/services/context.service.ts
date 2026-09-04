import { inject, Injectable, DOCUMENT, signal, effect } from '@angular/core';
import { Application, Entity, ErrorModel, Link, Logger, Organization, Pic, Tenant, Theme, User } from '../models';
import { Role } from '../models/role.model';
import { Session } from '../models/session.model';
import { CacheService } from './cache.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { Service } from '../models/service.model';
import { IAuth } from './auth.interface';
import { environment } from '../../../../environments/environment';
import { Action } from '../models/action.model';
import { SearchOptions } from '../models/search.options';

import { Progress } from '../models/progress.model';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ContextService implements IAuth {

  private logger = new Logger(ContextService);
  private document = inject(DOCUMENT);
  private cache = inject(CacheService);

  readonly theme = signal<Theme | undefined>(this.cache.get('theme'))
  readonly path = signal<string | undefined>(undefined);
  readonly tasks = signal<Progress[]>([]);
  readonly actions = signal<Action[]>([]);
  readonly breadcrumbs = signal<Link[]>([]);
  readonly navs = signal<Link[]>([]);
  readonly search = signal<SearchOptions[]>([]);
  readonly errors = signal<ErrorModel[]>([]);
  readonly entity = signal<Entity | undefined>(undefined);
  readonly page = signal<Link | undefined | undefined>(undefined);
  readonly title = signal<string | undefined>(undefined);
  readonly logo = signal<Pic | undefined>(undefined);

  readonly device = signal<string>('desktop');

  readonly tenant = signal<Tenant | undefined>(new Tenant(this.cache.get('tenant')));
  readonly application = signal<Application | undefined>(new Application(this.cache.get('application')));
  readonly organization = signal<Organization | undefined>(new Organization(this.cache.get('organization')));

  readonly role = signal<Role | undefined>(new Role(this.cache.get('role')));
  readonly user = signal<User | undefined>(new User(this.cache.get('user')));
  readonly session = signal<Session | undefined>(new Session(this.cache.get('session')));

  // readonly isImpersonateSession = signal<boolean>(false);
  // readonly lastSession = signal<Session | undefined>(undefined);

  // public _page?: Link;
  // public _entity?: Entity;
  // public _actions?: Action[];





  readonly underMaintenance = signal<boolean>(false);
  readonly isProcessing = signal<boolean>(false);
  readonly showNav = signal<boolean>(false);
  readonly showSidePanel = signal<boolean>(false);
  readonly showSearch = signal<boolean>(false);

  readonly data = signal(new Map<string, any>([]));

  readonly culture = signal({
    locale: 'en-IN'
  })


  constructor() {
    if (!this.application()) {
      this.document.location.reload();
      return;
    }

    effect((): void => {

      const session = this.session()
      if (session?.id) {
        this.cache.update('role', session);
        this.user.set(session.user)
        this.role.set(session.role)
      } else {
        this.cache.remove('role');
      }

      const user = this.user()
      if (user?.id) {
        this.cache.update('user', user);
      } else {
        this.cache.remove('role');
      }


      const role = this.role()
      if (role?.id) {
        this.cache.update('role', role);
        this.organization.set(role.organization)
      } else {
        this.cache.remove('role');
      }

      const organization = this.organization()
      if (organization?.code) {
        this.cache.update('organization', organization);
      } else {
        this.cache.remove('organization');
      }

      const tenant = this.tenant()
      if (tenant?.code) {
        this.cache.update('tenant', tenant);
      } else {
        this.cache.remove('tenant');
      }

      this.cache.update('device', this.device());
    });
  }

  getService(code: string) {
    return this.application()?.services?.find((s) => s.code === code);
  }

  private _defaultRole(user: User): Role {
    return user?.roles?.find((item) => !item.organization);
  }


  setRole(role?: Role) {
    const user = this.user();
    if (!user) { return; }

    if (!role) {
      role = this._defaultRole(user);
    }

    const newRole = user.role?.find((item: { key: string | undefined; }) => item.key === role?.key);
    if (newRole) {
      this.role.set(newRole);
    }

    return newRole;
  }

  // addRole(role: Role) {
  //   const user = this.currentUser();
  //   if (!user) { return null; }
  //   let exisingRole = user.roles?.find((item) => item.key === role.key);
  //   if (exisingRole) {
  //     return exisingRole;
  //   }

  //   user.roles = user.roles || [];
  //   user.roles.push(role);
  //   this.cache.update('user', user);
  //   return role;
  // }



  startImpersonation(session: Session) {
    const lastSession = this.session()
    this.cache.update('lastSession', lastSession);
    session.permissions.push('impersonating')
    this.session.set(session);
  }

  endImpersonation() {

    const lastSession = this.cache.get('lastSession')
    if (lastSession) {
      this.session.set(lastSession)
    }
  }

  hasPermission(permissions?: string | string[]): boolean {
    const logger = this.logger.get(this.hasPermission)
    if (!permissions || Array.isArray(permissions) && !permissions.length) {
      return true; // every role has blank permission
    }

    const currentSession = this.session();
    if (!currentSession) {
      return false;
    }

    if (!currentSession.permissions.length) { return false; }

    if (typeof permissions === 'string') {
      return this._hasPermission(permissions, currentSession.permissions);
    }

    for (const permission of permissions) {
      if (this._hasPermission(permission, currentSession.permissions)) {
        return true;
      }
    }
    return false;
  }

  private _hasPermission(permission: string, permissions: any[]): boolean {
    if (!permission) { return true; }
    let authorized = false;
    for (let item of permission.split('&&').map((p) => p.trim())) {

      const shouldNotHave = item.startsWith('!');
      if (shouldNotHave) {
        item = item.replace('!', '') as any;
      }

      const value = permissions.find((i) => item.toLowerCase() === i.toLowerCase());

      if (value) {
        if (shouldNotHave) {
          return false;
        } else {
          authorized = true;
        }
      } else {
        if (shouldNotHave) {
          authorized = true;
        }
      }
    }

    return authorized;
  }

  clear() {
    const tenant = this.cache.get('tenant');
    const application = this.cache.get('application');
    this.cache.clear();

    this.role.set(undefined);
    this.user.set(undefined);
    this.session.set(undefined);
    this.tenant.set(tenant);
    this.application.set(application);
  }

  getApiHeaders(code?: string) {

    const headers: any = {
      'Content-type': 'application/json'
    }

    const role = this.role();
    const application = this.application();
    const session = this.session();

    if (application?.code) {
      headers['x-application-code'] = application.code;
    }

    if (session?.token) {
      headers['x-access-token'] = session.token;
    } else if (session?.id) {
      headers['x-session-id'] = session.id;
    } else if (role?.key) {
      headers['x-role-key'] = role.key;
    } else {
      let organization: any = environment.organization;
      if (!organization?.code) {
        organization = this.organization();
      }
      if (organization?.code) {
        headers['x-organization-code'] = organization.code;
      }

      let tenant: any = environment.tenant;
      if (tenant?.code) {
        tenant = this.tenant();
      }

      if (tenant?.code) {
        headers['x-tenant-code'] = tenant.code;
      }
    }

    return new HttpHeaders(headers);

  }

  getConfig(key: string) {

  }

  getAppMeta(key: string) {

    const getValue = (identifier: string, value: any) => {
      if (!value) { return }
      for (const key of identifier.split('.')) {
        if (!Object.prototype.hasOwnProperty.call(value, key)) {
          value = null
          break
        }
        value = value[key]
      }
      return value
    }
    return getValue(key, this.application()?.meta?.app);
  }

  getPageMeta(key: string) {

    const getValue = (identifier: string, value: any) => {
      if (!value) { return }
      for (const key of identifier.split('.')) {
        if (!Object.prototype.hasOwnProperty.call(value, key)) {
          value = null
          break
        }
        value = value[key]
      }
      return value
    }
    const page = this.page();

    const value: any = page ? getValue(key, page.meta) : null;

    if (value !== undefined) {
      return value;
    }

    return getValue(key, this.application()?.meta?.page);

  }

}
