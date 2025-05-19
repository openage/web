import { Component, Input, OnInit } from '@angular/core';
import { ConstantService } from '../../core/services/constant.service';
import { ActionComponent } from '../action/action.component';

@Component({
    selector: 'oa-not-found',
    imports: [ActionComponent],
    templateUrl: './not-found.component.html',
    styleUrls: ['./not-found.component.css']
})
export class NotFoundComponent implements OnInit {

  @Input()
  value: any;

  @Input()
  code: string = 'data-not-found';

  @Input()
  message = 'No Data Found';

  @Input()
  class?: string;

  @Input()
  icon?: string;

  @Input()
  actions?: any[];

  constructor(
    private constantService: ConstantService
  ) { }

  ngOnInit() {

    if (!(this.code || this.value)) {
      return;
    }

    if (!this.code && this.value) {
      if (typeof this.value === 'string') {
        this.code = this.value;
      } else {
        this.code = this.value.code
      }

    }

    const value = this.constantService.errors.get(this.code);
    if (value) {
      this.value = value;
    }

    if (!this.value) { return; }

    this.message = this.value.message || this.message;
    this.icon = this.value.icon || this.icon;
    this.class = this.value.class || this.class;
    this.actions = this.value.actions || this.actions;
  }
}
