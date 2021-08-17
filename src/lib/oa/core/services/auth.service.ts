import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { Logger, Organization, User } from '../models';
import { Profile } from '../models/profile.model';
import { RoleType } from '../models/role-type.model';
import { Role } from '../models/role.model';
import { Session } from '../models/session.model';
import { ContextService } from './context.service';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private _redirectUrl = '/';
  private _usersApi: DataService;
  private _rolesApi: DataService;
  private _sessionsApi: DataService;

  logger: Logger;

  newUser(user: any) {
    this.context.setUser(user);
  }

  constructor(
    private context: ContextService,
    // private router: Router,

    private route: ActivatedRoute
  ) {
    this.logger = new Logger(AuthService);

    this._rolesApi = new DataService().init({
      service: 'directory',
      collection: 'roles'
    });

    this._usersApi = new DataService().init({
      service: 'directory',
      collection: 'users'
    });

    this._sessionsApi = new DataService().init({
      service: 'directory',
      collection: 'sessions'
    });
  }

  private setUserAndRole = async (data: any) => {
    const user = this.context.setUser(new User(data));
    const defaultRole = user?.roles?.find(r => !r.organization);

    // if (this._user && this._user.roles && this._user.roles.length >= 2) {
    //   let role: Role = this._user.roles.find((item) => item.key === roleKey)
    //   if (!role) {
    //     role = this._user.roles.find((r) => !!r.organization) || this._user.roles[0];
    //   }
    //   subject.next(role)
    // }


    const page = await this._rolesApi.search({ 'user': 'my' }, { headers: { 'x-role-key': defaultRole.key } })
    const roles = page?.items || [];
    let role;
    if (roles.length > 1) {
      const roleKey = this.context.currentRole()?.key;
      if (roleKey) {
        role = roles.find((item) => item.key === roleKey);
      } else if (defaultRole && defaultRole.type.code !== 'user') {
        role = defaultRole;
      } else if (roles.length) {
        role = roles.find((r) => !!r.organization) || roles[0];
      }
    } else {
      role = roles[0];
    }

    return this.context.setRole(role);
  }

  public signup = async (user: User, organization?: Organization, roleType?: string, source?: any, app?: string) => {
    const email = user.email;
    const phone = user.phone;

    // eslint-disable-next-line max-len
    if (email && email.match(/^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|glass|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i)) {
      user.email = email;
    } else if (phone && (phone.match(/^\d{10}$/) || phone.match(/^(\+\d{1,3}[- ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/) || phone.match(/^(\+\d{1,3}[- ]?)?\(?([0-9]{2})\)?[-. ]?([0-9]{4})[-. ]?([0-9]{4})$/))) {
      user.phone = phone;
    } else {
      throw new Error('mobile or email is required');
    }

    const model: any = {
      purpose: 'signup',
      app: this.context.currentApplication(),
      user,
      meta: {
        organization,
        roleType,
        source
      }
    };

    return this._usersApi.post(model, 'signUp');
  }

  public sendOtp = async (email: string, mobile: string, code: string, templateCode?: string) => {
    return this._usersApi.post({ email, mobile, code, templateCode }, 'resend');
  }

  public exists = async (identity: string, type?: string) => {

    if (!type) {
      // eslint-disable-next-line max-len
      if (identity.match(/^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|glass|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i)) {
        type = 'email';
      } else if (
        identity.match(/^\d{10}$/) ||
        identity.match(/^(\+\d{1,3}[- ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/)) {
        type = 'mobile';
      } else {
        type = 'code';
      }
    }

    return this._usersApi.get(`exists?${type}=${identity}`);
  }

  public verifyPassword = async (email: string, mobile: string, code: string, password: string,
    app?: string, device?: string) => {
    const model = {
      purpose: 'login',
      app: this.context.currentApplication()?.code,
      device,
      user: {
        email,
        mobile,
        code,
        password
      }
    };

    const session = await this._usersApi.post(model, 'signIn')
    return this.context.setSession(session)
  }

  public authSuccess = async (token: string, provider: string, applicaton?: string, device?: string) => {
    const subject = new Subject<Role>();
    const session = await this._usersApi.get(`auth/${provider}/success?app=${this.context.currentApplication()?.code}&code=${token}`)
    return this.context.setSession(session)
  }

  public setPassword = async (password: string) => {
    return this._usersApi.post({ password }, `resetPassword`);
  }

  public initPassword = async (model: any, otp: string, password: string) => {
    const subject = new Subject<any>();
    const data = await this._usersApi.post({
      id: model.id || model,
      profile: model.profile,
      otp,
      password
    }, `setPassword`)
    return this.setUserAndRole(data)
  }

  public forgotPassword = async (model: any, otp: string, password: string) => {
    const data = await this._usersApi.post({
      id: model.id || model,
      profile: model.profile,
      otp,
      password
    }, `setPassword`)
    return this.setUserAndRole(data)
  }

  public verifyOtp = async (id: string, otp: string) => {
    const subject = new Subject<any>();
    const data = await this._usersApi.post({ id, otp }, 'confirm')
    return this.setUserAndRole(data)
  }

  public refreshUser = async () => {
    const currentUser = this.context.currentUser();
    if (!currentUser) {
      return
    }

    const data = await this._usersApi.get('my', { headers: { 'x-role-key': currentUser?.roles?.find(r => !r.organization)?.key } })
    return this.setUserAndRole(data)
  }

  public setRoleKey = async (roleKey: string) => {
    const data = await this._usersApi.get('my', { headers: { 'x-role-key': roleKey } })
    return this.setUserAndRole(data)
  }

  public setSessionToken = async (token: string) => {
    const data = await this._sessionsApi.get('my', { headers: { 'x-access-token': token } });
    return this.context.setSession(data)
  }

  public joinOrganization = async (profile: Profile, organization?: Organization, typeCode?: string) => {
    const newRole = new Role();
    newRole.organization = this.context.organization() || organization;
    newRole.type = new RoleType({ code: typeCode });
    newRole.profile = profile;

    // if(organization) {
    //   role.user = new User({
    //     profile: {
    //       firstName: organization.meta.contactPerson
    //     },
    //     email: organization.email
    //   });
    // }
    const role = await this._rolesApi.create(newRole)
    const user = this.context.currentUser();
    user?.roles?.push(role);
    return this.context.role(role);
  }

  public createSession = async () => {
    const session = new Session();
    session.app = this.context.application()?.code;
    const data = await this._sessionsApi.create(session);
    return this.context.setSession(new Session(data));
  }

  public getSession = async (id?: string) => {
    if (id) {
      const data = await this._sessionsApi.get(id)
      return this.context.setSession(new Session(data));
    }

    const session = this.context.currentSession();
    const params = new URLSearchParams(window?.document?.location?.search);
    const token = params.get('token') || params.get('access_token') || params.get('access-token');

    if (token) {
      if (session && session.token === token) {
        return session;
      }
      return this.setSessionToken(token);
    }
    if (session) {
      return session;
    }
    return this.createSession()
  }

  public activateSession = async (id: string, otp?: string, token?: string) => {
    const model = {
      otp,
      token,
      status: 'active'
    };
    return await this._sessionsApi.update(id, model)
  }

  public logout = async () => {
    const session = this.context.currentSession();
    if (!session || !session.id) { return; }
    try {
      const data = await this._usersApi.post({}, `signOut/${session.id}`)

    } finally {
      this.context.clear();
    }
  }

  public setRedirectUrl(url: string) {
    this._redirectUrl = url;
  }

  public getRedirectUrl(url?: string) {
    if (!url) {
      url = this._redirectUrl;
    }

    const session = this.context.currentSession();
    if (url.startsWith('http') && session) {
      if (url.indexOf('?') === -1) {
        url = `${url}?access-token=${session.token}`;
      } else {
        url = `${url}&access-token=${session.token}`;
      }
    }
    return decodeURI(url);
  }

  public isCurrent(user: User) {
    const currentUser = this.context.currentUser()
    if (!currentUser || user.id !== currentUser.id) {
      return false;
    }

    const currentRole = this.context.currentRole()
    if (!currentRole || user.role?.id !== currentRole.id) {
      return false;
    }
    return true;
  }
}
