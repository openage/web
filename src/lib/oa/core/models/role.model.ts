
import { ModelBase } from './model-base.model';
import { Organization } from './organization.model';
import { Profile } from './profile.model';
import { RoleType } from './role-type.model';
import { User } from './user.model';

export class Role extends ModelBase {
  key?: string;
  email?: string;
  phone?: string;
  type?: RoleType;
  profile?: Profile;
  user?: User;
  organization?: Organization;
  permissions: string[] = [];
  supervisor?: Role;

  constructor(obj?: any) {
    super(obj);

    if (!obj) {
      return;
    }

    this.key = obj.key;
    this.email = obj.email;
    this.phone = obj.phone;
    this.type = new RoleType(obj.type);

    this.supervisor = new Role(obj.supervisor)

    if (obj.user) {
      this.user = new User(obj.user);
    }

    this.profile = obj.profile ? new Profile(obj.profile) : this.user?.profile;

    if (obj.organization) {
      this.organization = new Organization(obj.organization);
    }

    this.permissions = obj.permissions || [];

    (this.type?.permissions || []).map((p) => {
      if (!this.permissions.includes(p)) { this.permissions.push(p); }
    });
  }
}
