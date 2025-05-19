import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { UnitPickerComponent } from '../unit-picker/unit-picker.component';

@Component({
    selector: 'oa-value-editor',
    templateUrl: './amount-editor.component.html',
    styleUrls: ['./amount-editor.component.css'],
    standalone: false
})
export class AmountEditorComponent implements OnInit, OnChanges {

  @ViewChild('unitPicker')
  unitPicker: UnitPickerComponent;

  @Input()
  view: 'slab' | 'fixed' | 'container' | 'inline' | 'margin' | 'options' = 'fixed';


  @Input()
  type: 'currency' | 'weight' | 'length' | 'temperature' | 'humidity' | 'cbm' | 'basis' | 'chargeableWeight' | 'span';

  @Input()
  value: {
    value?: any,
    unit?: any
  } = {
      value: 0,
      unit: {}
    };

  @Input()
  units: any[];

  @Input()
  decimal = 2;

  @Input()
  contentOnly = false;

  @Input()
  readonly = false;

  @Input()
  switchOptions = false;

  @Input()
  options: any = {};

  @Input()
  basis: string;

  @Output()
  changed: EventEmitter<any> = new EventEmitter();

  @Output()
  changedView: EventEmitter<string> = new EventEmitter();

  optionsArray: any[] = [];



  afterDecimal: any;

  constructor() { }

  ngOnChanges(): void {
    this.ngOnInit();
  }

  ngOnInit() {
    if (typeof this.value === 'string') {
      this.value = {
        value: parseFloat(this.value)
      };
      this.view = 'fixed';
    } else if (typeof this.value === 'number') {
      this.value = { value: this.value };
      this.view = 'fixed';
    } else if (typeof this.value === 'object' && this.value.value) {
      if (Array.isArray(this.value.value)) {
        if (!this.value.value.length) {
          this.value.value = [{}];
        }
        this.view = 'slab';
      } else if (typeof this.value.value === 'object') {
        this.optionsArray = [];
        Object.keys(this.value.value).forEach((key) => {
          this.optionsArray.push({ option: key, value: this.value.value[key] });
        });
        if (!this.optionsArray.length) {
          this.optionsArray = [{}];
        }
        this.view = 'options';
      }
    } else {
      this.view = 'fixed';
    }

    this.changedView.emit(this.view);

    if (this.units) {
      this.unitPicker.items = this.units;
    }
  }

  decimalCalculator() {
    const tempValue = this.value.value.toString().split('.');

    this.value.value = tempValue[0];

    if (tempValue[1]) {
      let temp = tempValue[1].slice(0, this.decimal)
      if (temp.length < this.decimal) {
        for (let i = 0; i < this.decimal - temp.length; i++) {
          temp = temp.concat("0")
        }
      }
      this.afterDecimal = temp
    }
  }

  setUnit(unit) {
    this.value = this.value || {
      value: 0,
      unit: {}
    };
    if (this.value.unit === unit.code) { return; }
    this.value.unit = unit;
    this.changed.emit(this.value);
  }

  setValue($event) {
    this.value = this.value || {
      value: 0,
      unit: {}
    };

    let value = 0;

    if ($event.value) {
      value = $event.value;
    } else if ($event.currentTarget && $event.currentTarget.value) {
      value = parseFloat($event.currentTarget.value);
    }
    // if (this.value.value === value) { return; }
    this.value.value = value;
    this.changed.emit(this.value);
  }

  setOptionsValue() {
    this.value = this.value || {
      value: {},
      unit: {}
    };

    const value = {};
    this.optionsArray.forEach((o) => { value[o.option] = o.value; });

    this.value.value = value;
    this.changed.emit(this.value);
  }

  removeOption(index) {
    this.optionsArray.splice(index, 1);
  }

  removeFromValue(index) {
    this.value.value.splice(index, 1);
  }

  changeChargeMood(code: string) {
    if ((this.view === code) && (code !== 'fixed')) {
      if (code === 'slab') {
        return this.value.value.push({});
      } else if (code === 'options') {
        return this.optionsArray.push({});
      }
    }
    if (code === 'fixed') {
      this.value.value = 0;
    } else if (code === 'options') {
      this.value.value = {};
    } else if (code === 'slab') {
      this.value.value = [];
    }
    this.ngOnInit();
  }
}
