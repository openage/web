import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';

@Component({
    selector: 'oa-unit-picker',
    templateUrl: './unit-picker.component.html',
    styleUrls: ['./unit-picker.component.css'],
    standalone: false
})
export class UnitPickerComponent implements OnInit, OnChanges {

  @Input()
  id: string = 'unitPicker';

  @Input()
  scrollTop: number;

  @Input()
  value: any;

  @Input()
  type: 'currency' | 'weight' | 'length' | 'temperature' | 'humidity' | 'cbm' | 'basis' | 'chargeableWeight' | 'span' | 'margin' | 'gst' | 'tds';

  @Input()
  readonly = false;

  @Output()
  changed: EventEmitter<any> = new EventEmitter();

  @Input()
  items: any[] = [];

  @ViewChild('valueContainer')
  valueContainer: ElementRef;

  showOptions = false;
  ddlPosition = 'down';
  ddlWidth = '0px';

  constructor() { }

  ngOnInit() {

    switch (this.type) {
      case 'currency':
        this.items = [
          { code: 'INR', name: 'INR', isDefault: true },
          { code: 'USD', name: 'USD' },
          { code: 'EUR', name: 'EUR' },
          { code: 'GBP', name: 'GBP' },
          { code: 'AED', name: 'AED' },
          { code: 'BHD', name: 'BHD' },
          { code: 'CHF', name: 'CHF' },
          { code: 'CNY', name: 'CNY' },
          { code: 'XOF', name: 'XOF' },
          { code: 'JPY', name: 'JPY' },
          { code: 'HKD', name: 'HKD' },
          { code: 'IDR', name: 'IDR' },
          { code: 'AUD', name: 'AUD' },
          { code: 'KWD', name: 'KWD' },
          { code: 'SAR', name: 'SAR' }
        ];
        break;

      case 'weight':
        this.items = [
          { code: 'KG', name: 'KG', isDefault: true },
          { code: 'MT', name: 'MT' }
        ];
        break;

      case 'length':
        this.items = [
          { code: 'IN', name: 'IN' },
          { code: 'CM', name: 'CM' }
        ];
        break;

      case 'temperature':
        this.items = [
          { code: 'F', name: 'F' },
          { code: 'C', name: 'C' }
        ];
        break;

      case 'margin':
        this.items = [
          { code: '%', name: '%' },
          { code: 'INR', name: 'INR', isDefault: true }
        ];
        break;

      case 'humidity':
        this.items = [
          { code: '%', name: '%' }
        ];
        break;

      case 'cbm':
        this.items = [
          { code: 'CBM', name: 'CBM' }
        ];
        break;

      case 'chargeableWeight':
        this.items = [
          { code: 'KG', name: 'KG' }
        ];
        break;

      case 'span':
        this.items = [
          { code: 'min', name: 'Min' },
          { code: 'hr', name: 'Hr' },
          { code: 'day', name: 'Day' },
        ];
        break;

      case 'gst':
        this.items = [
          { code: 0, name: '0%' },
          { code: 2.5, name: '2.5%' },
          { code: 5, name: '5%' },
          { code: 6, name: '6%' },
          { code: 9, name: '9%' },
          { code: 12, name: '12%' },
          { code: 14, name: '14%' },
          { code: 18, name: '18%' },
          { code: 28, name: '28%' },
        ];
        break;

      case 'tds':
        this.items = [
          { code: 0, name: '0%' },
          { code: 1, name: '1%' },
          { code: 2, name: '2%' },
          { code: 5, name: '5%' },
          { code: 10, name: '10%' }
        ];
        break;

      case 'basis':
        break;
    }

    this.value = this.value || this.items[0];
    const code = ((typeof this.value !== 'object' ? typeof this.value === 'string' ? this.value.toLowerCase() : this.value : this.value.code));
    this.value = this.items.find((c) => (typeof c.code === 'string' ? c.code.toLowerCase() : c.code) === code) || { code, name: (typeof code === 'string' ? code.toUpperCase() : code), isDefault: true };
  }

  ngOnChanges(): void {
    this.ngOnInit();
    if (this.value) {
      const code = ((typeof this.value !== 'object' ? typeof this.value === 'string' ? this.value.toLowerCase() : this.value : this.value.code));
      this.value = this.items.find((c) => (typeof c.code === 'string' ? c.code.toLowerCase() : c.code) === code) || { code, name: (typeof code === 'string' ? code.toUpperCase() : code), isDefault: true };
    }
  }

  onSelect(item: any) {
    this.onShowOptions(false);
    this.value = item;
    this.changed.emit(this.value);
  }

  onClick() {
    if (this.readonly) {
      return;
    }
    switch (this.items.length) {
      case 1:
        break;
      case 2:
        this.onSelect(this.items.find((i) => i.code !== this.value.code));
        break;
      default:
        this.onShowOptions(true);
        break;
    }
  }

  onShowOptions(show) {

    if (show) {
      const bounds = this.valueContainer.nativeElement.getBoundingClientRect();
      this.ddlWidth = bounds.width;
      this.ddlPosition = bounds.top / window.innerHeight > .5 ? 'up' : 'down';
      if (this.scrollTop) {
        document.getElementById(this.id).style.marginTop = `${-this.scrollTop}px`
      }
    }
    this.showOptions = show;
  }
}
