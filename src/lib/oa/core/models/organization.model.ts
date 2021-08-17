import { ModelBase } from "./model-base.model";
import { Pic } from "./pic.model";

export class Organization extends ModelBase {
  phone?: string;
  email?: string;
  logo?: Pic;

  constructor(obj?: any) {
    super(obj);
    if (!obj) {
      return;
    }

    if (obj.logo) {
      this.logo = new Pic(obj.logo);
    }

    this.phone = obj.phone;
    this.email = obj.email;
  }

}


