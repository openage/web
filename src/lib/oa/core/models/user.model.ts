import { ModelBase } from "./model-base.model";
import { Profile } from "./profile.model";

export class User extends ModelBase {
  phone?: string;
  email?: string;
  profile?: Profile;

  role?: any;

  roles?: any[];

  constructor(obj?: any) {
    super(obj);
    if (!obj) {
      return;
    }

    this.phone = obj.phone;
    this.email = obj.email;
    this.profile = new Profile(obj.profile);
    this.role = obj.role;
  }

}
