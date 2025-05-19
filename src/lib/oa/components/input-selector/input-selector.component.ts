/* eslint-disable no-self-assign */
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
// import { MatOptionModule } from '@angular/material/core';

@Component({
    selector: 'oa-input-selector',
    imports: [CommonModule],
    templateUrl: './input-selector.component.html',
    styleUrls: ['./input-selector.component.css']
})
export class InputSelectorComponent implements OnInit, OnChanges {

  @Input()
  id?: string;

  @Input()
  style: any;

  @Input()
  class?: string;

  @Input()
  label?: string;

  @Input()
  showLabel: boolean | undefined = true;

  @Input()
  placeholder?: string;

  @Input()
  disabled = false;

  @Input()
  readonly = false;

  @Input()
  required = false;

  @Input()
  view: 'toggler' | 'list' | 'toggler-with-icons-and-stats' = 'toggler';

  @Input()
  items: any[] = [];

  @Input()
  type: 'priority' | 'custom' = 'custom';

  @Input()
  value: any = 'not-required';

  @Input()
  options: any = {};

  @Input()
  validate: any;

  @Output()
  changed: EventEmitter<any>; // obsolete

  @Output()
  valueChange: EventEmitter<any> = new EventEmitter();

  standard = {
    priority: [{
      label: 'High',
      value: 1
    }, {
      label: 'Medium',
      value: 2,
      default: true
    }, {
      label: 'Low',
      value: 3
    }]
  }

  selectedValue: any;

  constructor() {
    this.changed = this.valueChange;
  }

  ngOnInit() { }

  ngOnChanges() {

    switch (this.type) {
      case 'priority':
        this.items = this.standard.priority;
        break;
    }

    for (const item of this.items) {
      item.label = item.label || item.name;
      item.value = item.value || item.code;
      item.icon = item?.icon;
      item.stat = item?.stat;
    }

    if (!this.value) {
      this.value = this.items.find(i => i.default)
    } else {
      const value = this.value.value || this.value;
      this.value = this.items.find(i => i.value === value)
    }

    if (this.items.some(tab => tab.stat) || this.items.some(tab => tab.icon)) {
      this.view = 'toggler-with-icons-and-stats';
    }
  }

  onSelect(item: any) {
    this.value = item;
    this.changed.emit(item);
  }

  addItem($event: any) {
    const value = $event.target.value
    this.items = this.items || [];
    this.items = [...this.items, {
      label: value,
      value: value
    }]
    $event.target.value = null;
  }

  removeItem(index: any) {
    this.items = [... this.items.splice(index, 1)];
  }
}
