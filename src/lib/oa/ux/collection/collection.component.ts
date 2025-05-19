
import { Component, Input, OnInit } from '@angular/core';
import { ContextService } from '../../core/services/context.service';
import { DataService } from '../../core/services/data.service';
import { UxService } from '../../core/services/ux.service';

@Component({
    selector: 'oa-collection',
    templateUrl: './collection.component.html',
    styleUrls: ['./collection.component.css'],
    imports: []
})
export class CollectionComponent implements OnInit {

  @Input()
  value: any;

  @Input()
  options: any;

  initialized = false;

  constructor(
    public context: ContextService,
    public dataService: DataService,
    private uxService: UxService
  ) { }

  ngOnInit() {
    if (typeof this.value === 'string') {
      const value = this.context.data(this.value);

      if (value.subscribe) {
        value.subscribe((p: any) => {
          this.value = p;
          this.init(this.options.fields);
          this.initialized = true;
        })
      } else if (value) {
        this.value = value;
        this.init(this.options.fields)
        this.initialized = true;
      }
    } else {
      this.init(this.options.fields)
      this.initialized = true;
    }
  }

  init(fields: any): void {
    if (!fields) {
      return;
    }
    for (const field of fields) {
      if (field.control === 'object') {
        this.init(field.fields)
      } else {
        field.value = this._getValue(this.value, field.key, field.defaultValue);
      }
    }
  }

}
