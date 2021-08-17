export class TimeLine {
  start?: Date;
  finish?: Date;

  constructor(obj?: any) {
    if (!obj) { return; }
    this.start = obj.start;
    this.finish = obj.finish;
  }
}
