import { Organization } from "./organization.model";

export class Entity {
  id?: string | number;
  code?: string;
  type?: string;
  name?: string;
  organization?: Organization;
  timeStamp?: Date;

  parent?: {
    id: string | number;
    code: string;
    type: string;
    name: string;
  };
  isSelected = false;
  isProcessing = false;
  isDeleted = false;
  entityDetailOnly = false;
  meta: any = {};

  constructor(obj?: any, type?: string, organization?: any) {
    if (!obj) { return; }

    this.id = obj.id;
    this.code = obj.code;
    this.type = type || obj.type;
    this.name = obj.name;
    this.entityDetailOnly = obj.entityDetailOnly;
    this.timeStamp = obj.timeStamp;
    this.meta = obj.meta;
    if (obj.parent) {
      this.parent = {
        id: obj.parent.id,
        code: obj.parent.code,
        type: obj.parent.type,
        name: obj.parent.name
      };
    }
    this.organization = organization || obj.organization;
  }
}
