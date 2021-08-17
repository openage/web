import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { UxService } from '../../core/services/ux.service';
import { StorageService, StringService } from '../../core/services';
import { ContextService } from '../../core/services/context.service';

@Component({
  selector: 'oa-input-with-http',
  templateUrl: './input-with-http.component.html',
  styleUrls: ['./input-with-http.component.css']
})
export class InputWithHttpComponent implements OnInit {
  @Input()
  id: string | undefined;

  @Input()
  optionsId: string | undefined;

  @Input()
  readonly = false;

  @Input()
  disabled = false;

  @Input()
  value: any = "";

  @Input()
  placeholder?: string;

  // create: boolean = false;
  editPermissions: any = [];

  @Input()
  api?: DataService;

  // @Input()
  // url: {
  //   code?: string;
  //   addOn?: string;
  // } = { code: "", addOn: "" };

  @Input()
  displayValue?: (() => string);

  // @Input()
  // options: any;

  @Input()
  target?: any;

  @Input()
  options: any = {}; // target.code, target.key


  constructor(
    public uxService: UxService,
    public auth: ContextService,
    private cache: StorageService,
    private stringService: StringService) {

  }

  ngOnInit(): void {

    this.options = this.options || {};

    // TODO
    if (this.options) {

      this.target = this.target || this.options.target || {};
      this.value = this.options.value || "0";
      this.editPermissions = this.options.permissions || ["system.manage"]
      this.disabled = !this.auth.hasPermission(this.editPermissions)
      // this.create = this.options.create || false;
    }

    if (!this.api) {
      this.api = new DataService().init(this.options.data?.src);
    }
    if (this.target.code && this.target.key) {
      this.api.get(this.target.code).then((data) => { this.value = data[this.target.key] || "0"; });
    }
  }

  onBlur($event: { target: { value: any; }; }) {
    const value = $event.target.value;
    if (!this.target.key) {
      return;
    }
    const model: any = {};
    model[this.target.key] = value;

    if (this.options.update) {
      new DataService().init(this.options.update).update(this.target.code, model).then();
    } else if (this.options.create) {
      new DataService().init(this.options.create).create(model).then();
    }
  }
}
