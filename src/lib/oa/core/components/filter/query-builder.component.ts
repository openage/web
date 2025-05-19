import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

import moment from 'moment';
import { FilterOptions } from './filter.options';
import { FieldModel } from '../../models/field.model';
import { ContextService } from '../../services/context.service';
import { ContentService } from '../../services/content.service';
import { DatePickerComponent } from '../../../ux/date-picker/date-picker.component';
import { ErrorService } from '../../services';
import { InputTextComponent } from '../../../ux/input/input.component';
import { TogglerComponent } from '../../../ux/toggler/toggler.component';


@Component({
    selector: 'page-filter',
    imports: [
        DatePickerComponent,
        InputTextComponent,
        TogglerComponent
    ],
    templateUrl: './query-builder.component.html',
    styleUrls: ['./query-builder.component.css']
})
export class FilterComponent implements OnInit, OnChanges {

  @Input()
  view?: string;

  @Input()
  filters: FieldModel[] = [];

  @Input()
  options?: FilterOptions | any;

  @Output()
  apply: EventEmitter<any> = new EventEmitter();

  @Output()
  reset: EventEmitter<any> = new EventEmitter();

  values: any[] = [];

  // isReset = false;
  showMore = false;

  constructor(
    public context: ContextService,
    // public uxService: UxService,
    public errorService: ErrorService,
    private stringService: ContentService
  ) { }

  ngOnInit() {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.init();
  }

  onValueChange(filter: FieldModel, value: any) {
    this.addValue(filter, value);

    if (this.view === 'inline') {
      this.onApply()
    }
  }

  onApply() {
    // this.addContextFilter();
    for (const item of this.filters) {
      if (item.required && !this.values.find((i) => i.key === item.key)) {
        this.errorService.handleError(item.required || 'missing-values');
        return;
      }
    }
    this.apply.emit(this.values);
  }

  onReset() {
    this.values = [];
    this.filters.forEach((f) => {
      const value = f.value || f.template.default;
      if (value) {
        this.addValue(f, value);
      }
    });

    this.apply.emit(this.values)
  }

  init() {
    this.options = this.options || {};
    if (this.options! instanceof FilterOptions) {
      this.options = new FilterOptions(this.options);
    }
    this.view = this.view || this.options.view;

    this.onReset();
  }

  // addContextFilter() {
  //   const data = {};
  //   data['user'] = this.context.currentUser();
  //   data['role'] = this.context.currentRole();
  //   data['organization'] = this.context.currentOrganization();
  //   data['tenant'] = this.context.currentTenant();

  //   this.mainFilters.forEach((filter) => {
  //     if ((filter.control === 'context') && filter.config && filter.config.value) {
  //       this.addValue(filter, this.stringService.inject(filter.config.value, data), filter.label);
  //     }
  //   });
  // }

  addValue(filter: FieldModel, value: any) {
    if (!value) {
      this.removeValue(filter);
    }

    if (typeof value === 'object' && filter.template?.key) {
      value = value[filter.template.key]
    }

    const display = this.getText(filter, value);

    const item = this.values.find((i) => i.key === filter.key);
    if (item) {
      item.value = value;
      item.valueLabel = display;
    } else {
      this.values.push({
        key: filter.key,
        value,
        text: display
      });
    }
  }

  getText(filter: FieldModel, value: any) {
    if (typeof value === 'string') {
      return value;
    }

    if (value instanceof Date) {
      return moment(value).format(filter.template.format)
    }

    return value;
  }

  removeValue(filter: FieldModel) {
    this.values = this.values.filter((i) => i.key !== filter.key);
  }

  // onAutoCompleteSelect(filter: FieldModel, $event: any) {
  //   if ($event) {
  //     this.addValue(filter, $event[filter.config.valueKey || 'code'], $event.label);
  //   } else {
  //     this.removeValue(filter);
  //   }

  //   if (this.view === 'inline') {
  //     this.onApply()
  //   }
  // }
}
