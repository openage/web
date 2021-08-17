import { Inject, Injectable } from '@angular/core';
import { Application, Entity, ErrorModel, Link, Logger, Organization, Pic, Tenant, Theme, User } from '../models';
import { Role } from '../models/role.model';
import { Session } from '../models/session.model';
import { StorageService } from './storage.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { Service } from '../models/service.model';
import { IAuth } from './auth.interface';
import { environment } from '../../../../environments/environment';
import { Action } from '../models/action.model';
import { ObservableObject, ObservableStack } from '../models/observable.model';
import { SearchOptions } from '../models/search.options';
import { DOCUMENT } from '@angular/common';
import { Progress } from '../models/progress.model';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ContextService implements IAuth {

  private _organization?: Organization;
  private _tenant?: Tenant;
  private _application?: Application;
  private _role?: Role;
  private _user?: User;
  private _session?: Session;
  private _isImpersonateSession?: boolean;
  private _lastSession?: Session;

  private _data: any = {}

  // public _page?: Link;
  // public _entity?: Entity;
  // public _actions?: Action[];

  path = new ObservableObject<string>();
  tasks = new ObservableStack<Progress>();
  actions = new ObservableStack<Action>();
  entity = new ObservableObject<Entity>();
  page = new ObservableObject<Link | undefined>();
  breadcrumbs = new ObservableStack<Link>();
  navs = new ObservableStack<Link>();
  title = new ObservableObject<string>();

  logo = new ObservableObject<Pic>();
  theme = new ObservableObject<Theme>();
  device = new ObservableObject<string>();

  search = new ObservableStack<SearchOptions>();
  underMaintenance = new ObservableObject<string>();
  isProcessing = new ObservableObject<boolean>();
  showNav = new ObservableObject<boolean>();
  showSidePanel = new ObservableObject<boolean>();
  showSearch = new ObservableObject<boolean>();

  errors = new ObservableStack<ErrorModel>();

  private _organizationSubject = new Subject<Organization | undefined>();
  private _tenantSubject = new Subject<Tenant | undefined>();
  private _applicationSubject = new Subject<Application | undefined>();
  private _roleSubject = new Subject<Role | undefined>();
  private _userSubject = new Subject<User | undefined>();
  private _sessionSubject = new Subject<Session | undefined>();
  private _impersonateSubject = new BehaviorSubject<boolean>(false);

  organizationChanges = this._organizationSubject.asObservable();
  applicationChanges = this._applicationSubject.asObservable();
  tenantChanges = this._tenantSubject.asObservable();
  roleChanges = this._roleSubject.asObservable();
  userChanges = this._userSubject.asObservable();
  impersonateChanges = this._impersonateSubject.asObservable();

  private logger = new Logger(ContextService);

  constructor(
    private cache: StorageService,
    @Inject(DOCUMENT)
    private document: Document,
  ) {
  }

  public init() {
    const log = this.logger.get('init');
    // this should have been done during the booting of the application
    const application = this.cache.get('application');

    if (!application) {
      this.document.location.reload();
      return;
    }

    this.device.set('desktop');

    this.setApplication(new Application(application));

    const tenant = this.cache.get('tenant');
    this.setTenant(new Tenant(tenant));

    const organization = this.cache.get('organization');
    this.setOrganization(new Organization(organization));
  }

  private _setRole(role?: Role) {

    if (!role || !role.id) {
      this._role = undefined
      this.cache.remove('role');
    } else {
      this._role = role;

      role.email = role.email || this._user?.email;
      role.phone = role.phone || this._user?.phone;
      this.cache.update('role', role);
      this._setOrganization(role.organization);
    }
    this._roleSubject.next(this._role);
    return this._role;
  }

  private _setUser(user?: User) {
    this._user = user;

    if (user) {
      user.meta = user.meta || {};
    }
    this.cache.update('user', this._user);
    this._userSubject.next(this._user);
    return user;
  }

  private _setTenant(tenant?: Tenant) {
    this._tenant = tenant;
    if (tenant) {
      tenant.meta = tenant.meta || {};
    }

    this.cache.update('tenant', tenant);
    this._tenantSubject.next(this._tenant);
    return tenant;
  }

  private _setApplication(item?: Application) {
    this._application = item;
    if (item) {
      item.meta = item.meta || {};
    }

    this.cache.update('application', item);
    this.theme.set(item?.theme)
    this.navs.set(item?.navs);
    this._applicationSubject.next(this._application);
    return item;
  }

  private _setSession(item?: Session) {
    this._session = item
    this.cache.update('session', item);
    this._setUser(item?.user);
    this._setRole(item?.role);
    this._sessionSubject.next(this._session);
    return item;
  }

  private _setOrganization(item?: Organization) {
    if (!item?.code) {
      item = undefined;
    }
    this._organization = item;

    if (item) {
      item.meta = item.meta || {};
    }

    this.cache.update('organization', item);
    this._organizationSubject.next(this._organization);
    return item;
  }

  culture() {
    return {
      locale: 'en-IN'
    }
  }

  data(code: string, obj?: any): any {
    if (obj) {
      this._data[code.toLowerCase()] = obj;
      return obj
    } else {
      return this._data[code.toLowerCase()];
    }
  }

  application(item?: Application): Application | undefined {

    if (item === undefined) {
      return this.currentApplication();
    }

    return this.setApplication(item);
  }

  session(item?: Session): Session | undefined {

    if (item === undefined) {
      return this.currentSession();
    }

    return this.setSession(item);
  }

  role(item?: Role): Role | undefined {

    if (item === undefined) {
      return this.currentRole();
    }

    return this.setRole(item);
  }

  organization(item?: Organization): Organization | undefined {

    if (item === undefined) {
      return this.currentOrganization();
    }

    return this.setOrganization(item);
  }

  tenant(item?: Tenant): Tenant | undefined {

    if (item === undefined) {
      return this.currentTenant();
    }

    return this.setTenant(item);
  }


  currentRole(): Role | any {
    if (!this._role) {
      const role = this.cache.get('role');

      if (role && role.id) {
        this._role = new Role(role);
      }
    }
    return this._role;
  }

  currentUser(): User | undefined {

    this._isImpersonateSession = this.cache.get('isImpersonateSession')
    this._impersonateSubject.next(this._isImpersonateSession || false)

    if (this._user) {
      return this._user;
    }

    let item = this.cache.get('user');

    if (item) {
      item = new User(item);
    } else {
      return;
    }

    return this._setUser(item);
  }

  currentSession(): Session | undefined {
    if (this._session) {
      return this._session;
    }

    let item = this.cache.get('session');

    if (item) {
      item = new Session(item)
      // } else if (environment.code) {
      //   item = new Session(environment.code);
    } else {
      return
    }

    return this._setSession(item);
  }

  currentApplication(): Application | any {
    if (this._application) {
      return this._application;
    }

    let item = this.cache.get('application');

    // if (!item && environment.code) {
    //   item = new Application(environment.code);
    // }

    if (item) {
      item = new Application(item)
    } else {
      return
    }

    return this._setApplication(item);
  }

  currentTenant(): Tenant | any {
    if (this._tenant) {
      return this._tenant;
    }

    let item = this.cache.get('tenant');
    if (item) {
      item = new Tenant(item)
    } else if (environment.tenant?.code) {
      item = new Tenant(environment.tenant);
    } else {
      return
    }

    return this._setTenant(item);
  }

  currentOrganization(): Organization | undefined {
    if (this._organization && this._organization.code) {
      return this._organization;
    }

    let item = this.cache.get('organization');
    if (item) {
      item = new Organization(item)
    } else if (environment.tenant?.code) {
      // TODO
      // const orgCode = route.snapshot.queryParams['organization-code'];
      item = new Organization(environment.organization);
    } else {
      return
    }
    return this._setOrganization(item);
  }

  getService(code: string) {
    return this._application?.services?.find((s) => s.code === code);
  }

  private _defaultRole(user: User): Role {
    return user?.roles?.find((item) => !item.organization);
  }

  getRole() {
    return this.currentRole()
  }

  setRole(role?: Role) {
    const user = this.currentUser();
    if (!user) { return; }

    if (!role) {
      role = this._defaultRole(user);
    }

    const newRole = user.role?.find((item: { key: string | undefined; }) => item.key === role?.key);
    if (newRole) {
      this._setRole(newRole);
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

  setApplication(item: Application): Application | undefined {
    return this._setApplication(item);
  }

  setTenant(item: Tenant): Tenant | undefined {
    return this._setTenant(item);
  }

  setOrganization(item: Organization): Organization | undefined {
    return this._setOrganization(item);
  }

  setUser(item: any): User | undefined {
    const user = new User(item)
    return this._setUser(user);
  }

  setSession(item: any): Session | undefined {
    const session = this._setSession(new Session(item));
    return session;
  }



  getRoleKey() {
    return (this.cache.get('role') || {}).key;
  }

  impersonateSession(session: Session) {

    this._lastSession = this._session
    this.cache.update('lastSession', this._lastSession);

    this._setSession(new Session(session));
    this._setUser(new User(session.user));
    this._setRole(new Role(session.role));

    this._isImpersonateSession = true
    this.cache.update('isImpersonateSession', this._isImpersonateSession);
    this._impersonateSubject.next(true)
  }

  endImpersonateSession() {

    if (!this._lastSession) {
      this._lastSession = this.cache.get('lastSession')
    }

    this._setSession(new Session(this._lastSession));
    this._setUser(new User(this._lastSession?.user));
    this._setRole(new Role(this._lastSession?.role));

    this._lastSession = undefined
    this.cache.remove('lastSession');

    this._isImpersonateSession = false
    this.cache.update('isImpersonateSession', this._isImpersonateSession);
    this._impersonateSubject.next(false)
  }

  hasPermission(permissions?: string | string[]): boolean {
    const logger = this.logger.get(this.hasPermission)
    if (!permissions || Array.isArray(permissions) && !permissions.length) {
      return true; // every role has blank permission
    }

    const currentSession = this.currentSession();
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
    this.cache.update('tenant', tenant);
    this.cache.update('application', application);

    this._role = undefined;
    this._user = undefined;
    this._session = undefined;

    this._roleSubject.next(undefined);
    this._userSubject.next(undefined);
    this._sessionSubject.next(undefined);
  }

  getApiHeaders(code?: string) {

    const headers: any = {
      'Content-type': 'application/json'
    }

    const role = this.currentRole();
    const application = this.currentApplication();
    const session = this.currentSession();

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
        organization = this.currentOrganization();
      }
      if (organization?.code) {
        headers['x-organization-code'] = organization.code;
      }

      let tenant: any = environment.tenant;
      if (tenant?.code) {
        tenant = this.currentTenant();
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
        if (!value[key]) {
          value = null
          break
        }
        value = value[key]
      }
      return value
    }
    return getValue(key, this._application?.meta?.app);
  }

  getPageMeta(key: string) {

    const getValue = (identifier: string, value: any) => {
      if (!value) { return }
      for (const key of identifier.split('.')) {
        if (!value[key]) {
          value = null
          break
        }
        value = value[key]
      }
      return value
    }
    const page = this.page.get();

    const value: any = page ? getValue(key, page.meta) : null;

    if (value) {
      return value;
    }

    return getValue(key, this._application?.meta?.page);

  }

}
