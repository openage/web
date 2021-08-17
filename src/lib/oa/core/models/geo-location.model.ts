export class GeoLocation {
  name?: string;
  code?: string;
  description?: string;
  coordinates?: number[];

  constructor(obj?: any) {
    if (!obj) { return; }
    this.name = obj.name;
    this.code = obj.code;
    this.description = obj.description;
    this.coordinates = obj.coordinates || [];
  }
}
