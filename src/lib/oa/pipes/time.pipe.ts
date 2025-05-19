import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment';
import { DateService } from '../core/services/date.service';

@Pipe({
    name: 'time',
    standalone: false
})
export class TimePipe implements PipeTransform {

  constructor(
    private dateService: DateService
  ) {

  }

  toSpan(span: number) {
    if (span < 60) {
      return `${Math.ceil(span)} s`;
    } else if (span < 3600) {
      return `${Math.ceil(span / 60)} min`;
    } else if (span < 24 * 3600) {
      return `${Math.ceil(span / (3600))} hrs`;
    } else {
      return `${Math.ceil(span / (24 * 3600))} days`;
    }
  }

  toAgo(date: moment.MomentInput) {

    if (this.dateService.date(date).isFuture()) {
      return `in ${moment(date).fromNow(true)}`;
    } else {
      return `${moment(date).fromNow(true)} ago`;
    }

  }

  toDiff(data: moment.MomentInput[]) {
    const a = moment(data[0])
    const b = moment(data[1])
    const d = b.diff(a, 'days');
    a.add(d, 'days');
    const h = b.diff(a, 'hours');

    let value = ''
    if (d) {
      if (d < 2) {
        value = `${d} day `
      } else {
        value = `${d} day(s) `
      }
    }

    if (h) {
      if (h < 2) {
        value = value + `${h} hr`
      } else {
        value = value + `${h} hrs`
      }
    }

    return value;
  }

  toSecondsToHms(d: number) {
    d = Number(d);
    const h = Math.floor(d / 3600);
    const m = Math.floor(d % 3600 / 60);
    const s = Math.floor(d % 3600 % 60);

    const hDisplay = h > 0 ? h + (h === 1 ? ' hour, ' : ' hours, ') : '';
    const mDisplay = m > 0 ? m + (m === 1 ? ' minute, ' : ' minutes, ') : '';
    const sDisplay = s > 0 ? s + (s === 1 ? ' second' : ' seconds') : '';
    return hDisplay + mDisplay + sDisplay;
  }

  toSecondsToHmsShort(duration: number) {
    duration = Number(duration) * 100;
    const d = Math.floor(duration / (3600 * 8)) / 100;
    if (d > 1) return d + ' days';

    const h = Math.floor(duration / 3600) / 100;
    if (h > 1) return h + ' hrs';

    const m = Math.floor(duration / 60) / 100;
    if (m > 1) return m + ' mins';

    const s = Math.floor(duration) / 100;
    if (s > 1) return s + ' secs';

    // const hDisplay = h > 0 ? h + (h === 1 ? ' h ' : ' hrs ') : '';
    // const mDisplay = m > 0 ? m + (m === 1 ? ' min ' : ' mins ') : '';
    // const sDisplay = s > 0 ? s + (s === 1 ? ' sec ' : ' secs ') : '';
    // return dDisplay + hDisplay + mDisplay + sDisplay;
  }

  transform(value: any, args?: string): any {

    const format = 'HH:mm:ss';
    if (!args) {
      return moment(value).format(format);
    }

    switch (args) {
      case 'span':
        return this.toSpan(value);

      case 'ago':
        return this.toAgo(value);

      case 'diff':
        return this.toDiff(value);

      case 'clockWiseShort':
        return this.toSecondsToHmsShort(value);

      case 'clockWise':
        return this.toSecondsToHms(value);

      case 'merged':
        const now = new Date();
        const momentValue = moment(value);
        if (momentValue.isBefore(now, 'd')) {
          if (momentValue.add(2, 'd').isAfter(now, 'd')) {
            return `${moment(value).format('DD MMM')} [${moment(value).format('HH:mm A')}]`;
          } else if (momentValue.isBefore(now, 'y')) {
            return moment(value).format('DD MMM YYYY');
          } else {
            return moment(value).format('DD MMM');
          }
        } else {
          return moment(value).format('HH:mm A');
        }
    }

    return moment(value).format(args);
  }

}
