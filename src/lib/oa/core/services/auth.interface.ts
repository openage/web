import { Role } from '../models/role.model';
import { User } from '../models/user.model';
import { Application, Organization, Tenant } from '../models';
import { Session } from '../models/session.model';

export interface IAuth {
  currentRole(): Role | undefined;
  currentUser(): User | undefined;
  currentApplication(): Application | undefined;
  currentTenant(): Tenant | undefined;
  currentOrganization(): Organization | undefined;
  currentSession(): Session | undefined;
  // getService(code: string): Service;

  // getHeaders(): { key: string, value: string }[];

  hasPermission(permissions: string | string[]): boolean;
  clear(): void;
  // logout(): Observable<string>;
}
