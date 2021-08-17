import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { ActionComponent } from '../action/action.component';
import { FormsModule } from '@angular/forms';
import { AutofocusDirective } from '../../directives/autofocus.directive';
import { Action } from '../../core/models/action.model';
import { InputOptions } from './input.options';
import { DatePickerComponent } from '../date-picker/date-picker.component';
import { InputErrorComponent } from '../input-error/input-error.component';


@Component({
  selector: 'oa-text-input',
  standalone: true,
  imports: [
    ActionComponent,
    FormsModule,
    AutofocusDirective,
    DatePickerComponent,
    InputErrorComponent
  ],
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.css']
})
export class InputTextComponent implements OnInit, OnChanges, AfterViewInit {

  @Input()
  control: string = 'text';

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
  placeholder?: string;

  @Input()
  type: any = 'text';

  @Input()
  id?: string;

  @Input()
  disabled = false;

  @Input()
  readonly = false;

  @Input()
  required = false;

  @Input()
  preFix?: Action | any;

  @Input()
  postFix?: Action | any;

  @Input()
  uppercase = false;

  @Input()
  trimSpace = true;

  @Input()
  options: InputOptions | any;

  @Input()
  validate: any;

  @Output()
  errored: EventEmitter<any> = new EventEmitter();

  @Output()
  valueChange: EventEmitter<any> = new EventEmitter();

  @Output()
  changed: EventEmitter<any>; // obsolete

  @Output()
  selected: EventEmitter<boolean> = new EventEmitter();

  @Output()
  canceled: EventEmitter<string> = new EventEmitter();

  @ViewChild('valueTemplate')
  valueTemplate?: TemplateRef<any>;

  @ViewChild('inputContainer', { static: false })
  inputContainer?: ElementRef;

  nativeElement?: ElementRef;

  initialContent = '';
  content = '';
  isDirty = false;
  isSelected = false;
  hidden = true;

  otp = {
    char_1: '',
    char_2: '',
    char_3: '',
    char_4: '',
    char_5: '',
    char_6: '',
  };

  constructor() {
    this.changed = this.valueChange;
  }

  ngOnChanges(changes: SimpleChanges): void {

    this.options =
      this.options && this.options instanceof InputOptions
        ? this.options
        : new InputOptions(this.options);

    if (changes['value']) {
      this.content = this.value || '';
    }

    this.label = this.label || this.options.label;
  }

  ngOnInit() {
    this.initialContent = this.value || '';

    this.options = this.options && this.options instanceof InputOptions ?
      this.options :
      new InputOptions(this.options);

    // if (this.type === 'textarea') {
    //   this.options.keys.finish = 'enter'
    // }

    // initialize from options if set
    if (this.options.required !== undefined) {
      this.required = this.options.required;
    }

    if (this.options.inline) {
      this.showLabel = false;
    }

    this.placeholder = this.placeholder || this.options.placeholder || this.label;

    this.class = this.class || this.options.class;
    this.style = this.style || this.options.style;
    this.view = this.view || this.options.view;

    switch (this.type) {
      case 'text':
      case 'number':
      case 'email':
      case 'input':
      case 'phone':
        this.control = 'input';
        this.view = 'text';
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

      case 'multi-line':
        this.control = 'textarea';
        break;

      case 'html':
        this.control = 'rich';
        break;

      case 'config':
        this.control = 'json';
        break;

      default:
        this.control = this.control || this.type;
    }
  }

  ngAfterViewInit() {
    if (this.inputContainer) {
      this.nativeElement = this.inputContainer.nativeElement;
    }
  }

  onFocus() {
    this.initialContent = this.content;
    this.isDirty = false;
    this.isSelected = true;
    this.selected.next(true);
  }

  onBlur() {
    // this.isSelected = false;
    // this.selected.next(false);

    this.isDirty = this.initialContent !== this.content;
  }

  onValidate($event: any) {
    this.isDirty = false;
    this.error = $event;
    this.errored.emit(this.error)
  }

  onChange($event?: { target: any; }) {

    const target = $event ? $event.target : this.nativeElement;
    let text: string = target.value || target.innerHTML || '';

    text = text.replace(/\r?\n/g, '').trim();

    if (this.options.multiline && text === '<p><br></p>') { text = ''; }

    if (text === this.content) {
      return;
    }

    // if (!text || text === this.content || this.options.min && text.length < this.options.min) {
    //   return;
    // }

    this.content = text;

    if (this.options.changed === 'reset') {
      setTimeout(() => {
        target.value = '';
        this.content = '';
      });
    }

    this.onValueChange(text);
  }

  focusToNext(e: HTMLInputElement, nextEle?: HTMLInputElement) {
    if (e.value && nextEle && e.maxLength === e.value.length) {
      nextEle.select();
      nextEle.focus();
    } else if (!nextEle && this.otp.char_1 && this.otp.char_2 && this.otp.char_3 && this.otp.char_4 && this.otp.char_5 && this.otp.char_6) {
      const text = `${this.otp.char_1}${this.otp.char_2}${this.otp.char_3}${this.otp.char_4}${this.otp.char_5}${this.otp.char_6}`;
      this.onValueChange(text);
    }
  }

  onKeyUp($event: any) {
    if ($event.key === this.options.keys.cancel) {
      this.content = this.initialContent;
      $event.target.value = this.content;

      $event.target.blur();

      this.canceled.next(this.content);
      return;
    }

    if (this.options.trigger !== 'finish') {
      this.onChange($event);
    }
  }

  onValueChange(value: any) {
    this.changed.next(value);
  }

  // onKeyDown($event) {

  //   if ($event.key !== this.options.keys.finish) {
  //     return;
  //   }

  //   let text: string = $event.target.value;

  //   if (!text) {
  //     return;
  //   }
  //   text = text.replace(/\r?\n/g, '').trim();

  //   // this.isSelected = false;
  //   // this.selected.next(false);

  //   // $event.target.blur();

  //   if (text === this.content) {
  //     return;
  //   }

  //   this.onValueChange(text);

  //   if (this.options.changed === 'reset') {
  //     this.content = '';
  //   }
  // }

}
