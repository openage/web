import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { ErrorModel } from '../../core/models';
import { ErrorService } from '../../core/services';
import { DateService } from '../../core/services/date.service';
import { ValidationService } from '../../core/services/validation.service';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { ActionComponent } from "../action/action.component";


@Component({
    selector: 'oa-error',
    templateUrl: './input-error.component.html',
    styleUrls: ['./input-error.component.scss'],
    imports: [TooltipDirective, ActionComponent]
})
export class InputErrorComponent implements OnInit, OnChanges {

  @Input()
  label = 'Field';

  @Input()
  view: 'input-hint' | 'form-hint' = 'input-hint';

  @Input()
  style: any;

  @Input()
  class: any;

  @Input()
  value: any;

  @Input()
  required = false;

  @Input()
  autoClear = 0;

  @Input()
  dirty = false;

  @Input()
  type?: string;

  @Input()
  errorMessage?: string;

  @Input()
  min: any;

  @Input()
  max: any;

  @Input()
  error?: ErrorModel;

  @Output()
  errorChange: EventEmitter<ErrorModel>;

  @Input()
  validate: any;

  @Output()
  errored: EventEmitter<ErrorModel> = new EventEmitter();

  initialValue: any;
  initialized = false;
  validations: any[] = [];

  constructor(
    private validator: ValidationService,
    private errorService: ErrorService,
    private dateService: DateService
  ) {
    this.errorChange = this.errored;
  }

  ngOnInit() {
    if (!this.initialValue && !this.initialized) {
      this.initialValue = this.value;
      this.initialized = true;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {


    if (!this.initialized || this.value === this.initialValue || !changes['dirty']) {

      if (changes['error'] && this.error && this.autoClear) {
        setTimeout(() => this.clearError(), this.autoClear * 1000)
      }
      return;
    }

    this.populateValidations();
    this.onValidate()


    // if (this.dirty) {
    //   this.onValidate()
    // } else {
    //   this.error = null;
    //   this.errored.emit(null);
    // }


    // if (!this.dirty && (!this.initialized || this.value === this.initialValue)) {
    //   if (this.error) {
    //     this.error = null;
    //     this.errored.emit(null);
    //   }
    //   return;
    // }

    // if (changes.error) {
    //   this.error = this.errorService.get(this.error)
    // }
  }


  populateValidations() {
    this.validations = [];

    if (this.required) {
      this.validations.push((value: string | any[]) => {

        if (!value || (Array.isArray(value) && !value.length)) {
          return {
            code: 'REQUIRED',
            message: `${this.label} is required`,
            data: {
              label: this.label
            }
          };
        } else {
          return
        }
      })
    }

    this.validations.push((value: any) => {
      if (!value) { return; }
      switch (this.type) {
        case 'email':
          return this.validator.isEmailValid(value);

        case 'mobile':
          return this.validator.isMobileValid(value);

        case 'gst':
          return this.validator.isGSTValid(value);

        case 'pan':
          return this.validator.isPANValid(value);

        case 'name':
          return this.validator.isNameValid(value);

        case 'orgName':
          return this.validator.isOrgNameValid(value);

        case 'code':
          return this.validator.isCodeValid(value);
      }
    })

    this.validations.push((value: any) => {
      if (!value) { return; }
      switch (this.type) {
        case 'number':
        case 'date':
          if (this.min && this.value < this.min) {
            return {
              code: 'INVALID',
              message: `${this.label} is less than ${this.dateService.date(this.min).toString('date')}`
            };
          }

          if (this.max && this.value > this.max) {
            return {
              code: 'INVALID',
              message: `${this.label} is more than ${this.dateService.date(this.min).toString('date')}`
            };
          }
          return;
        default:
          if (this.min && this.value.length < this.min) {
            return {
              code: 'INVALID',
              message: `${this.label} is less than ${this.min} characters`
            };
          }

          if (this.max && this.value.length > this.max) {
            return {
              code: 'INVALID',
              message: `${this.label} is more than ${this.max} characters`
            };
          }
          return;
      }
    });

    if (!this.validate) {
      return;
    }
    if (Array.isArray(this.validate)) {
      this.validate.forEach((v: any) => {
        if (typeof v === 'function') {
          this.validations.push(v);
        } else {
          switch (v) {
            case 'required':
              this.validations.push((value: string | any[]) => {
                if (!value || (Array.isArray(value) && !value.length)) {
                  return {
                    code: 'REQUIRED',
                    message: `${this.label} is required`,
                    data: {
                      label: this.label
                    }
                  };
                } else {
                  return;
                }
              });
              break;
          }
        }
      });
    } else if (typeof this.validate === 'function') {
      this.validations.push(this.validate);
    }
  }

  checkError(newError: ErrorModel | null | undefined) {
    if (this.error && !newError) {
      this.error = undefined;
      return this.errored.emit(undefined);
    }

    newError = this.errorService.get(newError);
    if ((!this.error && newError) || (this.error && newError?.code !== this.error.code)) {
      this.error = newError;
      this.errored.emit(this.error);

      if (this.autoClear) {
        setTimeout(() => this.clearError(), this.autoClear * 1000)
      }
    }
  }

  onValidate() {
    for (const validation of this.validations) {
      const result = validation(this.value)

      if (!result) { continue; }

      if (result.subscribe) {
        return result.subscribe({
          next: (v: any) => this.checkError(v),
          error: (e: any) => this.checkError(e)
        });
      } else {
        return this.checkError(result);
      }
    }
    return this.checkError(null)
  }

  clearError() {
    this.error = undefined;
    this.errored.emit(undefined);
  }
}
