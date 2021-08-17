import { Address } from '../../core/models/address.model';
import { GeoLocation } from '../../core/models/geo-location.model';
import { Pic } from '../../core/models/pic.model';

export class Profile {
  firstName?: string;
  lastName?: string;
  pic?: Pic;
  dob?: Date;
  fatherName?: string;
  bloodGroup?: string;
  gender?: string;
  adharcardNo?: number;

  address?: Address;

  constructor(obj?: any) {

    if (!obj) {
      return;
    }
    this.firstName = obj.firstName;
    this.lastName = obj.lastName;

    if (obj.pic) {
      this.pic = new Pic(obj.pic);
    }

    this.dob = obj.dob;
    this.fatherName = obj.fatherName;
    this.bloodGroup = obj.bloodGroup;
    this.gender = obj.gender;
    this.adharcardNo = obj.adharcardNo;
    this.address = new Address(obj.address);
  }
}
