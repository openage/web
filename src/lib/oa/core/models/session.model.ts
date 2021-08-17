import { ModelBase } from './model-base.model';
import { Role } from './role.model';
import { User } from './user.model';

export class Session extends ModelBase {
  app?: string;
  user?: User;
  expiry?: Date;
  token?: string;
  role?: Role;
  permissions: string[] = [];

  constructor(obj?: any) {
    super(obj);
    if (!obj) {
      return;
    }

    this.app = obj.app;
    this.expiry = obj.expiry;
    this.token = obj.token;
    if (obj.user) {
      this.user = new User(obj.user);
    }

    if (obj.role) {
      this.role = new Role(obj.role);
    }
    this.permissions = obj.permissions || this.role?.permissions || [];

    if (this.user) {
      this.permissions.push('user');
    } else {
      this.permissions.push('guest');
    }
    if (this.role) {
      this.permissions.push(`role:${this.role.type?.code}`);
      this.permissions.push(`code:${this.role.code}`);
      this.permissions.push(`email:${this.role.email}`);
      this.permissions.push(`phone:${this.role.phone}`);
    }

  }
}
