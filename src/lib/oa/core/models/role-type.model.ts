import { ModelBase } from './model-base.model';

export class RoleType extends ModelBase {
  description?: string;
  permissions?: any[];
  constructor(obj?: any) {
    super(obj);

    if (!obj) {
      return;
    }

    this.description = obj.description;
    this.permissions = obj.permissions || [];
  }
}
