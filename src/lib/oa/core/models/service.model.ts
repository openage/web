import { ModelBase } from './model-base.model';

export class Service extends ModelBase {
  logo?: string;
  url?: string;

  constructor(obj?: any) {
    super(obj);
    if (!obj) {
      return;
    }

    this.logo = obj.logo;
    this.url = obj.url;
  }
}
