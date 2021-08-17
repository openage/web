import { GeoLocation } from './geo-location.model';

export class Address {
  line1?: string;
  line2?: string;
  city?: string;
  district?: string;
  state?: string;
  stateCode?: string;
  pinCode?: string;
  country?: string;
  countryCode?: string;
  countryFlag?: string;
  location?: GeoLocation;
  type?: string;

  constructor(obj?: any) {

    if (!obj) {
      return;
    }

    this.line1 = obj.line1;
    this.line2 = obj.line2;
    this.district = obj.district;
    this.city = obj.city;
    this.state = obj.state;
    this.stateCode = obj.stateCode;
    this.pinCode = obj.pinCode;
    this.country = obj.country;
    this.countryCode = obj.countryCode;
    this.type = obj.type;
    this.countryFlag = obj.countryFlag;

    if (obj.location) {
      this.location = new GeoLocation(obj.location);
    }
  }
}
