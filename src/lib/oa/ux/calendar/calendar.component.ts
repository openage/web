import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import moment from 'moment';
import { FormatPipe } from '../../pipes/format.pipe';
import { IconComponent } from '../icon/icon.component';
import { CalendarOptions } from './calendar.options';

class Day {
  date?: Date;
  class?: string;
  isSelected: boolean = false;
  canSelect: boolean = false;
  events: any[] = [];

  constructor(obj?: any) {
    if (!obj) return;
    this.date = obj.date;
    this.class = obj.class;
    this.canSelect = obj.canSelect;

    if (obj.events) {
      this.events = obj.events;
    }
  }
}

// eslint-disable-next-line max-classes-per-file
@Component({
  selector: 'oa-calendar',
  standalone: true,
  imports: [
    FormatPipe,
    IconComponent
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnChanges {

  @Input()
  value?: Date;

  @Input()
  month?: Date;

  @Input()
  events: any[] = [];

  @Input()
  options?: CalendarOptions;

  @Input()
  legends: {
    label: string,
    status: string
  }[] = [];

  dateForm?: UntypedFormGroup;

  momentMonth = moment();

  isReserved = null;

  days: Day[] = [];
  selected?: Day;

  @Output()
  valueChange: EventEmitter<Date> = new EventEmitter<Date>();

  // @Output()
  // select: EventEmitter<any> = new EventEmitter<Date>();

  isSelectDay = false;

  constructor(
    private fb: UntypedFormBuilder,
    // public uxService: UxService
  ) {
    this.initDateRange();
    this.momentMonth = moment(this.month);
  }

  initDateRange() {
    return (this.dateForm = this.fb.group({
      dateFrom: [null, Validators.required],
      dateTo: [null, Validators.required]
    }));
  }

  ngOnChanges() {
    this.momentMonth = moment(this.month);
    this.createCalendar();
    this.events.forEach((item) => {
      const day = this.days.find((d) => moment(d.date).isSame(item.date, 'day'));
      if (day) {
        day.events = day.events || [];
        day.events.push(item);
      }
    });
  }

  createCalendar() {
    if (!this.month) {
      if (this.value) {
        this.month = this.value;
      } else {
        this.month = new Date();
      }
    }
    const momentMonth = moment(this.month);

    const firstMonthDay = momentMonth.startOf('M');

    const days = []

    for (let index = 0; index < momentMonth.daysInMonth(); index++) {
      days.push(new Day({
        date: moment(firstMonthDay).add(index, 'd').toDate(),
        canSelect: true
      }))

    }

    for (let n = 0; n < firstMonthDay.weekday(); n++) {
      days.unshift(new Day({
        date: moment(firstMonthDay).subtract(n + 1, 'd').toDate(),
        canSelect: false
      }));
    }

    const lastMonthDay = this.momentMonth.endOf('M');

    for (let m = 0; m < 6 - lastMonthDay.weekday(); m++) {
      days.push(new Day({
        date: moment(lastMonthDay).add(m, 'd').toDate(),
        canSelect: false
      }));
    }
    this.days = days;
  }

  nextMonth() {
    this.month = moment(this.month).add(1, 'M').toDate();
    this.createCalendar();
  }

  previousMonth() {
    this.month = moment(this.month).subtract(1, 'M').toDate();
    this.createCalendar();
  }

  isToday(date: moment.MomentInput) {
    return moment().isSame(date, 'date');
  }

  isSelected(day: moment.MomentInput) {
    if (!day || !this.dateForm) {
      return false as any;
    }
    const dateFromMoment = moment(this.dateForm.value.dateFrom, 'MM/DD/YYYY');
    const dateToMoment = moment(this.dateForm.value.dateTo, 'MM/DD/YYYY');
    if (this.dateForm.valid) {
      return (
        dateFromMoment.isSameOrBefore(day) && dateToMoment.isSameOrAfter(day)
      );
    }
    // if (this.dateForm.get('dateFrom').valid) {
    //   return dateFromMoment.isSame(day);
    // }
  }

  // selectDay(items) {
  //   this.isSelectDay = true;
  //   items.forEach((event) => {
  //     const day = this.days.find((d) => d.date.isSame(event.date, 'day'));
  //     if (day) {
  //       day.items = day.items || [];
  //       day.items.push(event);
  //     }
  //   });
  // }

  onSelect($event: Day) {
    if (this.selected) {
      this.selected.isSelected = false;
    }
    if ($event) {
      this.selected = $event;
      this.selected.isSelected = true;
    }
    this.value = $event?.date;
    this.valueChange.emit(this.value);
  }

  // openDialog(day): void {
  //   const dialogRef = this.uxService.openDialog(CalenderDayDetailComponent, {
  //     width: '260px',
  //   });

  //   const instance = dialogRef.componentInstance
  //   instance.event = day.item;
  // }
}
