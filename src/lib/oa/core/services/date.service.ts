import { Injectable } from '@angular/core';
import moment from 'moment';

@Injectable({
  providedIn: 'root',
})
export class DateService {

  day = (date?: Date) => {
    const day = date ? moment(date).weekday() : moment().weekday();

    switch (day) {
      case 0:
        return 'sunday';
      case 1:
        return 'monday';
      case 2:
        return 'tuesday';
      case 3:
        return 'wednesday';
      case 4:
        return 'thursday';
      case 5:
        return 'friday';
      case 6:
        return 'saturday';
    }
    return null as any
  }

  constructor() { }

  parse(param: any = ''): Date {
    if (param) {
      return new Date();
    }
    if (param instanceof Date) {
      return param;
    }
    if (param instanceof Number) {
      const dateNum = param as number;
      return new Date(dateNum);
    }

    if (moment.isMoment(param)) {
      return param.toDate();
    }
    if (param.toLowerCase().indexOf('z', param.length - 1) !== -1) {
      return moment(param).toDate();
    }

    const dateRE = /^\/Date\((-?\d+)(\+|-)?(\d+)?\)\/$/;
    const arr = param && dateRE.exec(param);
    if (arr) {
      return new Date(parseInt(arr[1], 10));
    }

    // dd/mm/yyyy dd-mm-yyyy  formatted
    const parsedDate = new Date();
    parsedDate.setDate(parseInt(param.substr(0, 2), 10));
    parsedDate.setMonth(parseInt(param.substr(3, 2), 10) - 1);
    parsedDate.setFullYear(parseInt(param.substr(6, 4), 10));
    return parsedDate;
  }

  format(value: Date, format?: string): string {
    return moment(value).format(format || 'DD-MM-YYYY');
  }

  inMonth(value: Date): Date[] {
    const days: Date[] = [];
    for (let day = 1; day <= moment(value).daysInMonth(); day++) {
      days.push(moment(value).set('date', day).toDate());
    }
    return days;
  }

  inWeek(value: Date): Date[] {
    const days: Date[] = [];
    const start = moment(value).startOf('isoWeek').toDate();
    const end = moment(start).add(7, 'days').toDate();

    for (let day = start; day < end; day = moment(day).add(1, 'days').toDate()) {
      days.push(day);
    }
    return days;
  }

  weekFromNow(value: Date): Date[] {
    const days: Date[] = [];
    const start = moment(value).toDate();
    const end = moment(start).add(7, 'days').toDate();

    for (let day = start; day < end; day = moment(day).add(1, 'days').toDate()) {
      days.push(day);
    }
    return days;
  }

  slots(options: {
    start?: number,
    count?: number,
    step?: number,
    date?: Date
  }, value?: Date): Date[] {
    const slots: Date[] = [];
    value = value || options.date;

    const start = options.start || 8;
    const count = options.count || 9;
    const step = options.step || 1;

    for (let index = 0; index < count; index++) {
      slots.push(moment(value).set('hour', start + step * index)
        .set('minute', 0)
        .set('second', 0).toDate());
    }

    return slots;
  }

  compare(date1: Date, date2: Date, type?: string) {
    type = type || 'date';

    if (type === 'date') {
      return moment(date2).format('DD-MM-YYYY') === moment(date1).format('DD-MM-YYYY');
    } else if (type === 'time') {
      return moment(date2).format('HH:mm') === moment(date1).format('HH:mm');
    }

    return false;
  }

  withinTime(date: any, start: string | number, minutes: number) {
    const fromTime = moment.duration(start);
    const tillTime = moment.duration(start).add(minutes, 'm');
    const time = moment.duration(date);

    return fromTime <= time && time < tillTime;
  }

  setTime(date: Date, time: Date) {
    const newTime = moment(time);
    return moment(date)
      .set('hour', newTime.hour())
      .set('minute', newTime.minute())
      .set('second', newTime.second());
  }

  nextDay(date: Date) {
    return moment(date).add(1, 'day').toDate();
  }

  previousDay(date: Date) {
    return moment(date).subtract(1, 'day').toDate();
  }

  toString(date: Date, option: string): string {
    switch (option) {
      case 'time':
        return moment(date).format('HH:mm');
      case 'month':
        return moment(date).format('MMM');
      case 'date':
      default:
        return moment(date).format('DD-MM-YYYY');
    }
  }

  toJSON(date: Date): string {
    return moment(date).toJSON();
  }

  fromWeek(week: number): Date {
    return moment().week(week).toDate();
  }

  toWeek(date: Date): number {
    return moment(date).week();
    // // Copy date so don't modify original
    // date = new Date(+date);
    // date.setHours(0, 0, 0);
    // // Set to nearest Thursday: current date + 4 - current day number
    // // Make Sunday's day number 7
    // date.setDate(date.getDate() + 4 - (date.getDay() || 7));
    // // Get first day of year
    // const yearStart = new Date(date.getFullYear(), 0, 1);
    // // Calculate full weeks to nearest Thursday
    // const weekNo = Math.ceil((((date.valueOf() - yearStart.valueOf()) / 86400000) + 1) / 7);
    // // Return array of year and week number
    // return weekNo;
  }

  time = (time1: any) => {
    time1 = time1 || new Date();
    return {
      diff: (time2: any) => {
        let value = moment(time1).diff(moment(time2), 'seconds');
        if (value < 0) {
          value = -value;
        }

        return value;
      },

      span: (time2?: any) => {
        let value = 0;

        if (typeof time1 === 'number' && !time2) {
          value = time1;
        } else {
          const date = moment();

          const timeA = date
            .set('hour', moment(time1).get('hour'))
            .set('minute', moment(time1).get('minute'))
            .set('second', moment(time1).get('second'))
            .set('millisecond', moment(time1).get('millisecond')).toDate();

          const timeB = date
            .set('hour', moment(time2).get('hour'))
            .set('minute', moment(time2).get('minute'))
            .set('second', moment(time2).get('second'))
            .set('millisecond', moment(time2).get('millisecond')).toDate();

          value = moment(timeA).diff(moment(timeB), 'minutes');
        }

        if (value < 0) {
          value = -value;
        }

        let hours = value / 60;

        hours = parseInt(hours.toFixed(2));
        const minutes = value - hours * 60;
        let hoursText = '00';
        let minutesText = '00';

        if (hours < 10) {
          hoursText = `0${hours}`;
        } else {
          hoursText = `${hours}`;

        }

        if (minutes < 10) {
          minutesText = `0${minutes}`;
        } else {
          minutesText = `${minutes}`;
        }
        return `${hoursText}:${minutesText}`;

      },
      lt: (time2: any) => {
        if (!time2 || (!time1 && !time2)) {
          return false;
        }

        if (!time1) {
          return true;
        }

        const date = new Date();

        const timeA = moment(date)
          .set('hour', moment(time1).hour())
          .set('minute', moment(time1).minutes())
          .set('second', moment(time1).seconds());

        const timeB = moment(date)
          .set('hour', moment(time2).hour())
          .set('minute', moment(time2).minutes())
          .set('second', moment(time2).seconds());

        return (timeA.isBefore(timeB, 's'));
      },
      gt: (time2: any) => {
        if (!time2 || (!time1 && !time2)) {
          return false;
        }

        if (!time1) {
          return true;
        }

        const date = new Date();

        const timeA = moment(date)
          .set('hour', moment(time1).hour())
          .set('minute', moment(time1).minutes())
          .set('second', moment(time1).seconds());

        const timeB = moment(date)
          .set('hour', moment(time2).hour())
          .set('minute', moment(time2).minutes())
          .set('second', moment(time2).seconds());

        return (timeA.isAfter(timeB, 's'));
      }
    };
  }

  date = (date1?: any) => {
    date1 = date1 || new Date();

    let momValue: any;

    if (typeof date1 === 'string') {
      switch (date1.toLowerCase()) {
        case 'today':
          momValue = moment().startOf('day');
          break;

        case 'yesterday':
          momValue = moment(date1).subtract(1, 'days').startOf('day');
          break;

        case 'tomorrow':
          momValue = moment(date1).add(1, 'days').startOf('day');
          break;

        case 'bod':
          momValue = moment().startOf('day');
          break;

        case 'eod':
          momValue = moment().endOf('day');
          break;

        case 'now':
          momValue = moment();
          break;

        case 'bow':
          momValue = moment().startOf('week');
          break;

        case 'eow':
          momValue = moment().endOf('week');
          break;

        case 'bom':
          momValue = moment().startOf('month');
          break;

        case 'eom':
          momValue = moment().endOf('month');
          break;

        case 'boy':
          momValue = moment().startOf('year');
          break;

        case 'eoy':
          momValue = moment().endOf('year');
          break;

        default:
          momValue = moment(date1);
          break;
      }
    } else {
      momValue = moment(date1);
    }

    return {
      diff: (date2: any) => {
        const day1 = moment(date1).startOf('day');
        const day2 = moment(date2).startOf('day');
        let value = moment(day1).diff(day2, 'd');
        if (value < 0) {
          value = -value;
        }

        return value + 1;
      },
      day: () => {
        return this.day(momValue);
      },
      bod: () => {
        return momValue.startOf('day').toDate();
      },

      bom: () => {
        return momValue.startOf('month').toDate();
      },
      previousWeek: () => {
        return momValue.subtract(7, 'days').startOf('day').toDate();
      },
      previousBod: () => {
        return momValue.subtract(1, 'day').startOf('day').toDate();
      },
      nextBod: () => {
        return momValue.add(1, 'day').startOf('day').toDate();
      },
      nextWeek: () => {
        return momValue.add(7, 'days').startOf('day').toDate();
      },
      eod: () => {
        return momValue.endOf('day').toDate();
      },
      eom: () => {
        return momValue.endOf('month').toDate();
      },
      add: (value: any, unit: 'd' | 'h' | 'm' | 's' = 'd') => {
        return momValue.add(value, unit).toDate();
      },
      subtract: (days: any) => {
        return momValue.subtract(days, 'day').toDate();
      },
      setTime: (time: any) => {
        return momValue
          .set('hour', moment(time).get('hour'))
          .set('minute', moment(time).get('minute'))
          .set('second', moment(time).get('second'))
          .set('millisecond', moment(time).get('millisecond')).toDate();
      },
      isNextSevenDays: (date2: any) => {

        if (!date2) return false;

        date2 = new Date(date2);

        const oneDay = 24 * 60 * 60 * 1000;

        const diffDays = Math.round(Math.abs((date2 - date1) / oneDay));

        return (isGivenDateIsFromFuture(date2) && diffDays <= 6);

      },
      isAfterSevenDays: (date2: any) => {

        if (!date2) return false;

        date2 = new Date(date2);

        const oneDay = 24 * 60 * 60 * 1000;

        const diffDays = Math.round(Math.abs((date2 - date1) / oneDay));

        return (isGivenDateIsFromFuture(date2) && diffDays > 6);

      },
      isSame: (date2: any) => {

        if (!date2) return false;

        const day1 = moment(date1).format('DD-MM-YYYY').split('-');
        const day2 = moment(date2).format('DD-MM-YYYY').split('-');

        return (day1[0] === day2[0] && day1[1] === day2[1] && day1[2] === day2[2])
      },
      isToday: () => {
        return date1 && momValue.isSame(moment(new Date()).format('YYYYMMDD'));
      },
      isFuture: () => {
        return momValue.isAfter(new Date());
      },
      isPast: () => {
        return momValue.isBefore(new Date(), 'date');
      },
      isBetween: (from: any, till: any) => {
        return momValue.isBetween(moment(from), moment(till), 'day', '[]');
      },
      toDate: (): Date => {
        return momValue.toDate();
      },
      toString: (format?: string) => {
        format = format || 'dddd, MMMM Do YYYY';

        switch (format.toLowerCase()) {
          case 'day':
            return this.day(momValue.toDate());

          case 'date':
            format = 'DD-MM-YYYY';
            break;

          case 'date-time':
            format = 'DD-MM-YYYY hh:mm A';
            break;

          case 'time':
            format = 'hh:mm:ss';
            break;

          case 'month':
            format = 'YYYY-MM';
            break;

          case 'year':
            format = 'YYYY';
            break;
        }
        return momValue.format(format);
      },
      serialize: () => {
        return momValue.toISOString();
      }
    };
  }
}

const isGivenDateIsFromFuture = (date: Date) => {
  return date.setHours(0, 0, 0, 0) > new Date().setHours(0, 0, 0, 0)
}
