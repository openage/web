import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import * as Quill from 'quill';
declare let require: any;

@Component({
  selector: 'oa-content-editor',
  standalone: true,
  templateUrl: './content-editor.component.html',
  styleUrls: [
    './content-editor.component.css',
    '../../../../../../node_modules/quill/dist/quill.core.css',
    '../../../../../../node_modules/quill/dist/quill.snow.css',
    '../../../../../../node_modules/quill/dist/quill.bubble.css'
  ],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => ContentEditorComponent),
    multi: true
  }],
  encapsulation: ViewEncapsulation.None
})
export class ContentEditorComponent implements AfterViewInit, ControlValueAccessor, OnChanges {

  content: string;

  @Input()
  value: string;

  @Input()
  readonly = false;

  @Input()
  placeholder: string;

  @Input()
  toolbar: any[] = [
    ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
    // ['blockquote', 'code-block'],

    [{ header: 1 }, { header: 2 }],               // custom button values
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ script: 'sub' }, { script: 'super' }],      // superscript/subscript
    [{ indent: '-1' }, { indent: '+1' }],          // outdent/indent
    // [{ direction: 'rtl' }],                         // text direction

    [{ size: ['small', false, 'large', 'huge'] }],  // custom dropdown
    // [{ header: [1, 2, 3, 4, 5, 6, false] }],

    // [{ color: new Array<any>() }, { background: new Array<any>() }],          // dropdown with defaults from theme
    // [{ font: new Array<any>() }],
    [{ align: new Array<any>() }],

    // ['clean'],                                         // remove formatting button

    // ['link', 'image', 'video']                         // link and image, video
  ];

  @Input()
  options: any;

  quillEditor: any;
  editorElem: HTMLElement;

  // @Output()
  // blur: EventEmitter<any> = new EventEmitter();
  @Output()
  focus: EventEmitter<any> = new EventEmitter();

  @Output()
  ready: EventEmitter<any> = new EventEmitter();

  @Output()
  changed: EventEmitter<any>; // obsolete

  @Output()
  valueChange: EventEmitter<any> = new EventEmitter();

  onModelChange: () => void = () => { };

  onModelTouched: () => void = () => { };

  constructor(private elementRef: ElementRef) {
    this.changed = this.valueChange;
  }

  ngAfterViewInit() {
    if (!this.toolbar) {
      return
    }
    this.editorElem = this.elementRef.nativeElement.children[0];

    const modules: any = { clipboard: { matchVisual: false } };

    if (this.toolbar && this.toolbar.length) {
      modules.toolbar = this.toolbar;
    }

    this.quillEditor = new Quill(this.editorElem, Object.assign({
      modules,
      placeholder: this.placeholder || '',
      readonly: this.readonly,
      theme: 'snow',
      boundary: document.body
    }, this.options || {}));

    if (this.content) {
      this.quillEditor.pasteHTML(this.content || '');
      // this.quillEditor.clipboard.dangerouslyPasteHTML(0, this.content || '')
    }

    this.ready.emit(this.quillEditor);

    // mark model as touched if editor lost focus
    this.quillEditor.on('selection-change', (range: any) => {
      this.content = this.editorElem.children[0].innerHTML;
      if (!range) {
        this.onModelTouched();
        this.changed.emit(this.content);
      } else {
        this.focus.emit(this.content);
      }
    });

    // update model if text changes
    this.quillEditor.on('text-change', (delta: any, oldDelta: any, source: any) => {

      this.content = this.editorElem.children[0].innerHTML;
      const text = this.quillEditor.getText();

      if (this.content === '<p><br></p>') { this.content = null; }

      // this.onModelChange(html);

      this.changed.emit(this.content);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    setTimeout(() => {
      if (!this.toolbar) {
        this.content = this.value;
        return
      }
      if (!this.quillEditor) {
        return;
      }
      if (changes['readonly']) {
        this.quillEditor.enable(!changes['readonly'].currentValue);
      }
      if (this.content === this.value) {
        return;
      }
      this.content = this.value;
      this.quillEditor.pasteHTML(this.content || '<p><br></p>');
    });
  }

  writeValue(currentValue: any) {
    this.content = currentValue;

    if (this.quillEditor) {
      if (currentValue) {
        this.quillEditor.pasteHTML(currentValue);
        return;
      }
      this.quillEditor.setText('');
    }
  }

  onChange($event) {
    if ($event.target.innerHTML) {
      $event = $event.target.innerHTML;
    }
    this.content = $event;
    this.changed.emit(this.content);
  }

  registerOnChange(fn: () => void): void {
    this.onModelChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onModelTouched = fn;
  }
}
