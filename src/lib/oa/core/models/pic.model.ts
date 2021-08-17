export class Pic {
  url?: string;
  thumbnail?: string;
  type?: string;

  constructor(obj?: any) {

    if (!obj) {
      return;
    }

    this.url = obj.url;
    this.thumbnail = obj.thumbnail;
    this.type = obj.type;
  }
}
