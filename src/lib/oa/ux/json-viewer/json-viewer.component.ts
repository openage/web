import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnChanges, OnInit } from '@angular/core';
import { ContextService } from '../../core/services/context.service';
import { DataService } from '../../core/services/data.service';

@Component({
  selector: 'oa-json-viewer',
  imports: [
    CommonModule
  ],
  templateUrl: './json-viewer.component.html',
  styleUrl: './json-viewer.component.scss'
})
export class JsonViewerComponent implements OnInit, OnChanges {
  @Input()
  style: any;

  @Input()
  class?: string;

  @Input()
  value: any;

  @Input()
  options: any;

  items: any[] = [];

  initialized = false;


  context = inject(ContextService);
  dataService = inject(DataService);

  ngOnInit(): void {
    this.options = this.options || {};
    this.class = this.class || this.options.class;
    this.style = this.class || this.options.style;
  }

  ngOnChanges() {
    this.value = this.value ?? {};
    if (typeof this.value === 'string') {
      const value = this.context.data().get(this.value);

      if (value) {
        if (value.subscribe) {
          value.subscribe((p: any) => {
            this.value = p;
            this.init();
            this.initialized = true;
          })
        } else {
          this.value = value;
          this.init()
          this.initialized = true;
        }
      } else {
        this.init()
        this.initialized = true;
      }
    } else {
      this.init()
      this.initialized = true;
    }
  }

  init() {
    if (typeof this.value === 'string') {
      this.value = JSON.parse(this.value);
    }

    this.items = this.objectToArray(this.value);
  }

  toggle(item: any): void {
    item.isCollapsed = !item.isCollapsed;
  }

  objectToArray(object: any) {
    let array: any[] = [];
    this.options = this.options || {};
    if (object !== null && typeof object === 'object') {
      for (const key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
          let value = object[key];
          if (value === undefined) {
            value = 'Not Set';
          }
          const type = typeof value;
          if (type === 'function') {
            continue
          }

          array.push({
            key: key,
            value: value,
            type: type,
            isComplex: value !== null && type === 'object',
            isArray: Array.isArray(value)
          })
        }
      }
    }

    const skip = this.options.skip;
    if (skip) {
      if (skip.fields) {
        array = array.filter(i => !(skip.fields.find((s: string) => s == i.key)))
      }
      if (skip.empty) {
        array = array.filter(i => i.value !== 'Not Set')
      }
    }

    if (this.options.sort) {
      if (this.options.sort.key) {
        array = array.sort((a, b) => {
          return (a.key < b.key) ? -1 : 0;
        });
      }
    }
    for (const item of array) {

      item.isCollapsed = true;

      if (item.isComplex) {
        item.items = this.objectToArray(item.value)
      } else if (typeof item.value === 'string' && this.options.limit && item.value.length > this.options.limit) {
        item.value = `${item.value.substring(0, this.options.limit - 8)}...${item.value.substring(item.value.length - 5)}`;
      }
    }
    return array;
  }
}
