import { inject, Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { Logger, Organization, Tenant, User } from '../models';
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
  private dataService = inject(DataService);
  private context = inject(ContextService);
  private route = inject(ActivatedRoute);

  private userApi = ':directory/users';
  private rolesApi = ':directory/roles';
  private sessionsApi = ':directory/sessions';

  logger: Logger;

  newUser(user: any) {
    this.context.user.set(user);
  }

  constructor(
  ) {
    this.logger = new Logger(AuthService);
  }

  public async getMyRoles() {
    try {
      const page = await this.dataService.search({ 'user': 'my' }, this.rolesApi);
      return page?.items || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Hydrates the active user and resolves the current role from the returned role set.
   * This is used after login, refresh, or other user-scoped actions where the server
   * returns the user and available roles together.
   */
  private setUserAndRole = async (data: any) => {
    const user = new User(data);
    this.context.user.set(user);
    const roles = await this.getMyRoles();
    const defaultRole = roles.find((r: any) => !r.organization) || roles[0] || user?.role;

    if (!defaultRole) {
      if (user?.role) {
        return this.context.setRole(new Role(user.role));
      }
      return this.context.role();
    }

    const availableRoles = await this.getMyRoles();
    if (!availableRoles.length) {
      this.context.setRole(new Role(defaultRole));
      return this.context.role();
    }

    let role;
    if (availableRoles.length > 1) {
      const roleKey = this.context.role()?.key;
      if (roleKey) {
        role = availableRoles.find((item: any) => item.key === roleKey);
      } else if (defaultRole && defaultRole.type?.code !== 'user') {
        role = defaultRole;
      } else if (availableRoles.length) {
        role = availableRoles.find((r: any) => !!r.organization) || availableRoles[0];
      }
    } else {
      role = availableRoles[0] || defaultRole;
    }

    return this.context.setRole(role);
  }

  /**
   * Starts the signup flow by creating a signup session for the new user.
   * The backend receives the user payload and source metadata together so it can
   * begin OTP verification / onboarding for the requested account.
   */
  public signup = async (user: User | any, source: any) => {
    // const userData = await this.dataService.create(user, this.userApi);
    // this.context.user.set(new User(userData));
    const session = await this.dataService.create({
      meta: {
        user,
        source
      },
      purpose: 'signup'
    }, this.sessionsApi);

    return new Session(session);
  }

  /**
   * Resends the verification code using the requested identity field.
   * The type is usually email or mobile and is mapped into the payload dynamically.
   */
  public sendOtp = async (value: string, type: string, templateCode?: string) => {
    const model: any = {}

    model[type] = value;
    if (templateCode) {
      model[templateCode] = templateCode;
    }

    return this.dataService.create(model, `${this.userApi}/resend`);
  }

  /**
   * Checks whether the supplied identity already belongs to a user.
   * If the type is omitted, the method infers email/mobile/code from the value format.
   */
  public exists = async (identity: string, type?: string) => {

    if (!type) {
      // eslint-disable-next-line max-len
      if (identity.match(/^[-a-z0-9~!$%^&*_=+}{'?]+(\.[-a-z0-9~!$%^&*_=+}{'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|glass|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i)) {
        type = 'email';
      } else if (
        identity.match(/^\d{10}$/) ||
        identity.match(/^(\+\d{1,3}[- ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/)) {
        type = 'mobile';
      } else {
        type = 'code';
      }
    }

    return this.dataService.get(`exists?${type}=${identity}`, this.userApi);
  }

  // public verifyPassword = async (email: string, mobile: string, code: string, password: string,
  //   app?: string, device?: string, method = 'password') => {
  //   const model = {
  //     purpose: 'login',
  //     app: this.context.application()?.code,
  //     device,
  //     user: {
  //       email,
  //       mobile,
  //       code,
  //       password,
  //       method
  //     },
  //     credentials: {
  //       password
  //     }
  //   };

  //   const session = await this.dataService.create(model, `${this.sessionsApi}`)
  //   return this.context.session.set(session)
  // }
  // public verifyLoginOtp = async (email: string, mobile: string, code: string, otp: string, sessionId?: string) => {
  //   const model = {
  //     purpose: 'login',
  //     app: this.context.application()?.code,
  //     sessionId,
  //     user: { email, mobile, code, otp, method: 'otp' },
  //     credentials: {
  //       otp
  //     }
  //   };
  //   const session = await this.dataService.create(model, `${this.sessionsApi}`);
  //   return this.context.session.set(session);
  // }

  /**
   * Authenticates a user by creating a login session with the provided user and credentials.
   */
  public login = async (user: any, credentials: any) => {
    const model = {
      purpose: 'login',
      user,
      credentials
    };
    const session = await this.dataService.create(model, `${this.sessionsApi}`);
    const currentSession = new Session(session);
    this.context.session.set(currentSession);

    if (currentSession?.user) {
      this.context.user.set(currentSession.user);
    }

    if (currentSession?.role) {
      this.context.setRole(currentSession.role);
      return currentSession;
    }

    if (currentSession?.token) {
      const me = await this.dataService.get('my', {
        headers: { 'x-access-token': currentSession.token },
        src: this.userApi
      });
      return this.setUserAndRole(me);
    }

    return currentSession;
  }

  public sendLoginOtp = async (email: string, mobile: string, code: string) => {
    return this.sendOtp(email, mobile, code);
  }

  public authSuccess = async (token: string, provider: string, applicaton?: string, device?: string) => {
    const subject = new Subject<Role>();
    const session = await this.dataService.get(`auth/${provider}/success?app=${this.context.application()?.code}&code=${token}`, this.userApi)
    return this.context.session.set(session)
  }

  /**
   * Updates the currently authenticated user's password on the active session.
   * A valid session token is required before the password can be persisted.
   */
  public setPassword = async (password: string) => {
    const session = this.context.session();

    if (!session?.token) {
      throw new Error('A valid session is required to set the password.');
    }

    return this.dataService.update('my', {
      credentials: { password }
    }, this.userApi);
  }

  public initPassword = async (model: any, otp: string, password: string) => {
    const subject = new Subject<any>();
    const data = await this.dataService.create({
      id: model.id || model,
      profile: model.profile,
      otp,
      password
    }, `${this.userApi}/setPassword`)
    return this.setUserAndRole(data)
  }

  public forgotPassword = async (model: any, otp: string, password: string) => {
    const data = await this.dataService.create({
      id: model.id || model,
      profile: model.profile,
      otp,
      password
    }, `${this.userApi}/setPassword`)
    return this.setUserAndRole(data)
  }

  /**
   * Verifies the OTP against the signup/session activation API.
   */
  public verifyOtp = async (id: string | number, otp: string) => {
    return this.activateSession(id, otp);
  }

  public refreshUser = async () => {
    const currentUser = this.context.user();
    if (!currentUser) {
      return
    }

    const data = await this.dataService.get('my', {
      headers: { 'x-role-key': currentUser?.roles?.find(r => !r.organization)?.key },
      src: this.userApi
    })
    return this.setUserAndRole(data)
  }

  public switchRole = async (role: Role | string | any) => {
    const roleKey = typeof role === 'string' ? role : role?.key;
    if (!roleKey) {
      return this.context.role();
    }

    const data = await this.dataService.get('my', {
      headers: { 'x-role-key': roleKey },
      src: this.sessionsApi
    });
    const session = new Session(data);
    this.context.session.set(session);

    if (session?.role) {
      this.context.setRole(session.role);
    } else if (session?.user?.roles?.length) {
      const matchingRole = session.user.roles.find((item: any) => item.key === roleKey) || session.user.roles[0];
      this.context.setRole(new Role(matchingRole));
    }

    return session;
  }

  public setRoleKey = async (roleKey: string) => {
    return this.switchRole(roleKey);
  }

  public setSessionToken = async (token: string) => {
    const data = await this.dataService.get('my', {
      headers: { 'x-access-token': token },
      src: this.sessionsApi
    });
    const session = new Session(data);
    this.context.session.set(session);

    if (session?.user) {
      this.context.user.set(session.user);
    }

    if (session?.role) {
      this.context.setRole(session.role);
    } else if (this.context.user()) {
      await this.setUserAndRole(this.context.user());
    }

    return session;
  }

  /**
   * Creates a new role assignment for the user, usually as a tenant or organization role.
   * The payload is passed through as-is to the roles API so the backend can resolve the
   * tenant/organization relationship and role metadata.
   */
  public createRole = async (role: any) => {
    // const newRole: any = {
    //   type: {
    //     code: role.type
    //   }
    // };
    // newRole.organization = this.context.organization() || organization;
    // newRole.type = new RoleType({ code: typeCode });
    // newRole.profile = profile;

    // if(organization) {
    //   role.user = new User({
    //     profile: {
    //       firstName: organization.meta.contactPerson
    //     },
    //     email: organization.email
    //   });
    // }
    const newRole = await this.dataService.create(role, this.rolesApi)
    // const user = this.context.user();
    // user?.roles?.push(newRole);
    // this.context.role.set(newRole);
    return newRole
  }

  public createSession = async () => {
    const session = new Session();
    session.app = this.context.application()?.code;
    const data = await this.dataService.create(session, this.sessionsApi);
    return this.context.session.set(new Session(data));
  }

  public getSession = async (id?: string) => {
    if (id) {
      const data = await this.dataService.get(id, this.sessionsApi)
      return this.context.session.set(new Session(data));
    }

    const session = this.context.session();
    const params = new URLSearchParams(window?.document?.location?.search);
    const token = params.get('session-token') || params.get('token') || params.get('access_token') || params.get('access-token');

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

  public activateSession = async (id: string | number, otp?: string, token?: string) => {
    const sessionData = await this.dataService.create({
      credentials: { otp },
      token
    }, `${this.sessionsApi}/${id}/activate`);
    const session = new Session(sessionData);
    this.context.session.set(session);
    return session;
  }

  public logout = async () => {
    const session = this.context.session();
    if (!session || !session.id) { return; }
    try {
      const data = await this.dataService.create({}, `${this.userApi}/signOut/${session.id}`)
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
    if (!url) {
      return
    }

    const session = this.context.session();
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
    const currentUser = this.context.user()
    if (!currentUser || user.id !== currentUser.id) {
      return false;
    }

    const currentRole = this.context.role()
    if (!currentRole || user.role?.id !== currentRole.id) {
      return false;
    }
    return true;
  }
}
