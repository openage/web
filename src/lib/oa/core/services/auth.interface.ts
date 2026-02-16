import { Role } from '../models/role.model';
import { User } from '../models/user.model';
import { Application, Organization, Tenant } from '../models';
import { Session } from '../models/session.model';

export interface IAuth {
  hasPermission(permissions: string | string[]): boolean;
}
