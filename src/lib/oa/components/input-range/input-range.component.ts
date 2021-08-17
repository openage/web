import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import * as moment from 'moment';
import { DatePickerComponent } from '../../ux/date-picker/date-picker.component';


@Component({
  selector: 'oa-input-range',
  standalone: true,
  imports: [CommonModule, DatePickerComponent],
  templateUrl: './input-range.component.html',
  styleUrls: ['./input-range.component.css']
})
export class InputRangeComponent implements OnInit, OnChanges {

  @Input()
  control?: string;

  @Input()
  style: any;

  @Input()
  class?: string;

  @Input()
  view?: string;

  @Input()
  value: any;

  @Input()
  error?: string;

  @Input()
  label?: string;

  @Input()
  showLabel: boolean | undefined = true;

  @Input()
  type: any;

  @Input()
  id?: string;

  @Input()
  disabled = false;

  @Input()
  readonly = false;

  @Input()
  required = false;


  @Input()
  options: any;

  @Input()
  validate: any;

  @Output()
  errored: EventEmitter<any> = new EventEmitter();

  @Output()
  valueChange: EventEmitter<any> = new EventEmitter();

  @Output()
  selected: EventEmitter<boolean> = new EventEmitter();

  @Output()
  canceled: EventEmitter<string> = new EventEmitter();


  initialValue: any;
  isDirty = false;
  isSelected = false;
  hidden = true;

  constructor() {
  }

  ngOnChanges(changes: SimpleChanges | any): void {
    if (changes.value) {
      this.initialValue = this.value;
    }
  }

  ngOnInit() {
    this.initialValue = this.value;

    this.options = this.options || {};

    // if (this.type === 'textarea') {
    //   this.options.keys.finish = 'enter'
    // }

    // initialize from options if set
    if (this.options.required !== undefined) {
      this.required = this.options.required;
    }

    this.class = this.options.class || this.class;
    this.style = this.options.style || this.style;

    switch (this.type) {
      case 'number':
        this.control = 'input';
        break;

      case 'date':
        this.control = 'date-picker';
        this.view = 'date';
        break;

      case 'day':
        this.control = 'date-picker';
        this.view = 'day';
        break;

      case 'week':
        this.control = 'date-picker';
        this.view = 'week';
        break;

      case 'month':
        this.control = 'date-picker';
        this.view = 'month';
        break;
    }
  }





  onValidate($event: any) {
    this.isDirty = false;
    this.error = $event;
    this.errored.emit(this.error)
  }


  onValueChange(event: any, key: 'from' | 'till') {

    const value = this.value || {};

    const item: any = {};

    if (event.target) {
      item.value = event.target['value'];
      item.label = item.value;
    }

    if (key === 'from') {

      value.from = item
    } else if (key === 'till') {
      value.till = item
    }

    this.valueChange.next(value);
  }
}
