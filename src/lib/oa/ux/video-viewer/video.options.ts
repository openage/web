import { ViewerOptions } from "../../core/models/viewer.options";

export class VideoOptions extends ViewerOptions {

  provider?: string;
  muted: boolean = false;
  autoplay: boolean = false;

  constructor(obj?: any) {
    super(obj);
    obj = obj || {};

    this.provider = obj.provider;
    this.muted = obj.muted || false;
    this.autoplay = obj.autoplay || false;
  }
}
