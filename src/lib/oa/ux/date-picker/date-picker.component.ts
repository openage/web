import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { DatePickerDirective } from './date-picker.directive';
import { IconComponent } from '../icon/icon.component';
import { TimeLine } from '../../core/models/timeline.model';
import { DateService } from '../../core/services/date.service';
import { DatePickerOptions } from './date-picker.options';
import { FormatPipe } from '../../pipes/format.pipe';

// import { FormControl } from '@angular/forms';
// import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
// import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';

// export const MY_FORMATS = {
//   parse: {
//     dateInput: 'LL',
//   },
//   display: {
//     dateInput: 'LL',
//     monthYearLabel: 'MMM YYYY',
//     dateA11yLabel: 'LL',
//     monthYearA11yLabel: 'MMMM YYYY',
//   },
// };
@Component({
  selector: 'oa-date-picker',
  standalone: true,
  imports: [DatePickerDirective, IconComponent, FormatPipe],
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.scss'],
  // providers: [
  //   {
  //     provide: DateAdapter,
  //     useClass: MomentDateAdapter,
  //     deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
  //   },

  //   { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  // ],
})
export class DatePickerComponent implements OnInit, OnChanges {

  @Input()
  style: any;

  @Input()
  readonly: boolean = false;

  @Input()
  view: 'date' | 'inline' | 'day' | 'week' | 'month' | 'range' | 'readonly' | 'icon' | 'weekAndData' = 'date';

  @Input()
  placeholder?: string;

  @Input()
  required = false;

  @Input()
  value?: string | Date | TimeLine;

  @Input()
  populateData: any;

  @Input()
  minDate?: Date;

  @Input()
  maxDate?: Date;

  @Input()
  format = 'DD-MM-YYYY';

  @Input()
  disabled = false;

  @Input()
  isReset = false;

  // @Input()
  // showLabel = true;

  @Input()
  options?: DatePickerOptions

  @Input()
  overdue: boolean = false

  @Output()
  valueChange: EventEmitter<Date | TimeLine> = new EventEmitter();

  // @Output()
  // select: EventEmitter<Date> = new EventEmitter();

  // @ViewChild('picker')
  // picker: MatDatepicker<Date>;

  // @Output()
  // selected: EventEmitter<boolean> = new EventEmitter();

  // @Output()
  // onShowPrevious: EventEmitter<Date[]> = new EventEmitter();

  // @Output()
  // onShowNext: EventEmitter<Date[]> = new EventEmitter();

  // @ViewChild('inputContainer', { static: false })
  // inputContainer: ElementRef;

  // dates: Date[] = [];

  // month: string;
  date?: Date;
  range?: TimeLine;

  // isEditing = true;

  // now = new Date();

  // nativeElement: ElementRef;
  // isSelected = false;

  // value: FormControl;

  constructor(
    private dateService: DateService
  ) { }

  ngOnInit() {
    // this.config = this.config || {};

    // this.isEditing = !!this.value;

    //   // const date = this.dateService.parse(this.date);
    //   // this.setDates(date);

    //   // this.date = this.dates.find((i) => this.dateService.compare(i, date, 'date'));
    //   // this.date = moment(this.date).format('YYYY-MM');
  }

  ngOnChanges(changes?: SimpleChanges) {
    // if (this.isReset === true) {
    //   this.value = null;
    // }
    if (typeof this.value === 'string') {
      this.value = this.dateService.date(this.value).toDate();
    }

    if (this.value instanceof TimeLine) {
      this.view = 'range';
      this.range = this.value;
    } else {
      this.date = this.value;
    }

    // if (changes.value || changes.view) {
    //   switch (this.view) {
    //     case 'week':
    //       this.setWeek(this.value);
    //       break;

    //     case 'weekAndData':
    //       this.setWeek(this.value);
    //       break;

    //     case 'month':
    //       this.month = this.dateService.date(this.value).toString('month');
    //       break;

    //     case 'day':
    //       this.value = this.value || new Date();
    //       break;

    //     case 'date':
    //     case 'inline':
    //       if (this.value) {
    //         this.date = this.dateService.date(this.value).toString(this.format);
    //       }
    //       break;
    //   }
    // }
  }
  // ngAfterViewInit() {
  //   if (this.inputContainer) {
  //     this.nativeElement = this.inputContainer.nativeElement;
  //     this.options = this.options && this.options instanceof InputOptions ?
  //       this.options :
  //       new InputOptions(this.options);
  //   }
  // }

  // openPicker() {
  //   if (this.readonly) { return; }
  //   this.picker.open();
  //   this.picker.startAt = new Date(this.value || this.now);
  // }

  // configure() {
  //   this.config = this.config || {};
  //   this.view = this.config.view || this.view;
  // }

  // setWeek(date: Date) {
  //   this.dates = this.dateService.inWeek(date);
  //   const lastDate = this.dates[this.dates.length - 1];
  //   this.month = this.dateService.toString(lastDate, 'month');
  // }

  // setSevenData(date) {
  //   this.dates = this.dateService.weekFromNow(date);
  // }

  // showPreviousSeven() {
  //   const first = this.dates[0]
  //   this.dates = this.dateService.weekFromNow(moment(first).subtract(7, 'd').toDate());
  //   this.onShowPrevious.emit(this.dates)
  // }

  // showNextSeven() {
  //   const last = this.dates[this.dates.length - 1]
  //   this.dates = this.dateService.weekFromNow(moment(last).add(1, 'd').toDate());
  //   this.onShowNext.emit(this.dates)
  // }

  // getPopulateData(date: Date) {
  //   let key = moment(date).format('YYYYMMDD')
  //   let value
  //   if (this.populateData) {
  //     value = this.populateData[key]
  //   }
  //   return value || 0
  // }

  // isCurrent(item) {
  //   if (moment(moment(item).format('YYYYMMDD')).isSame(moment(this.value).format('YYYYMMDD'))) {
  //     return true;
  //   }
  //   return false
  // }

  // click(date: Date) {
  //   this.value = date;
  //   this.valueChange.emit(date);
  //   this.select.emit(date);
  // }

  // showNextWeek() {
  //   const lastDate = this.dates[this.dates.length - 1];
  //   this.setWeek(this.dateService.nextDay(lastDate));
  // }

  // showPreviousWeek() {
  //   this.setWeek(this.dateService.previousDay(this.dates[0]));
  // }

  // showNextMonth() {
  //   this.value = moment(this.value).add(1, 'month').toDate();
  //   this.select.emit(this.value);
  //   this.valueChange.emit(this.value);
  // }

  // showPreviousMonth() {
  //   this.value = moment(this.value).subtract(1, 'month').toDate();
  //   this.valueChange.emit(this.value);
  //   this.select.emit(this.value);
  // }

  // showNextDate() {
  //   this.value = moment(this.value).add(1, 'day').toDate();
  //   this.select.emit(this.value);
  //   this.valueChange.emit(this.value);
  // }

  // showPreviousDate() {
  //   this.value = moment(this.value).subtract(1, 'day').toDate();
  //   this.valueChange.emit(this.value);
  //   this.select.emit(this.value);
  // }

  updated($event: Date) {
    this.value = $event;
    this.valueChange.emit(this.value);
  }

  updatedStart($event: Date) {
    this.value = this.value || new TimeLine();
    if (this.value instanceof TimeLine) {
      this.value.start = $event;
      this.valueChange.emit(this.value);
    }
  }

  updatedFinish($event: Date) {
    this.value = this.value || new TimeLine();
    if (this.value instanceof TimeLine) {
      this.value.finish = $event;
      this.valueChange.emit(this.value);
    }
  }

  // getDate($event) {
  //   if ($event.value) {
  //     return $event.value;
  //   }

  //   if ($event.currentTarget && $event.currentTarget.value) {
  //     return moment($event.currentTarget.value);
  //   }

  //   return null;
  // }

}
