export class Theme {
  code?: string;
  name?: string;
  style?: string;
  icon?: string;
  styles?: any;
  type?: string; // light|dark
  image?: string;
  status?: string;

  constructor(obj?: any) {
    if (!obj) {
      return;
    }

    this.code = obj.code;
    this.type = obj.type;
    this.name = obj.name;
    this.image = obj.image;
    this.status = obj.status;
    this.style = obj.style;
    this.icon = obj.icon;
    this.styles = obj.styles || {};
  }
}
