import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output } from '@angular/core';
import { ContextService } from '../../core/services/context.service';
import { DataService } from '../../core/services/data.service';

@Component({
  selector: 'oa-json-editor',
  standalone: true,
  templateUrl: './json-editor.component.html',
  styleUrls: ['./json-editor.component.scss']
})
export class JsonEditorComponent implements OnInit, OnChanges {

  @Input()
  style: any;

  @Input()
  class?: string;

  @Input()
  value: any;

  @Input()
  options: any;

  @Output()
  valueChange: EventEmitter<any> = new EventEmitter();

  text?: string;
  initialized = false;
  parseError = '';

  context = inject(ContextService);
  dataService = inject(DataService);

  constructor() { }

  ngOnInit() {

    this.options = this.options || {};

    this.class = this.class || this.options.class;
    this.style = this.class || this.options.style;
  }

  ngOnChanges(): void {
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
    this.parseError = '';
    if (typeof this.value === 'string') {
      this.text = this.syntaxHighlight(this.value);
    } else {
      const value = this.safeStringify(this.value || {});
      this.text = this.syntaxHighlight(value);
    }
  }



  safeStringify(obj: any) {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (this.options?.skip?.fields) {
        if (this.options.skip.fields.find((s: string) => s == key)) {
          return undefined;
        }
      }

      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular]";
        }
        seen.add(value);
      }
      return value;
    }, 2);
  }

  onSelect() {

  }
  onTextChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const subject = target instanceof HTMLInputElement ? target.value : target.innerText;
    if (!subject.trim()) {
      this.parseError = 'JSON cannot be empty.';
      return;
    }

    try {
      const value = JSON.parse(subject);
      this.parseError = '';
      this.valueChange.emit(value);
    } catch (error) {
      this.parseError = error instanceof Error ? `Invalid JSON: ${error.message}` : 'Invalid JSON.';
    }
  }

  syntaxHighlight(json: string) {
    json = json
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    // .replace(/(?:\r\n|\r|\n)/g, '<br>');

    // eslint-disable-next-line max-len
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (match) => {
      let cls = 'number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'key';
        } else {
          cls = 'string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'boolean';
      } else if (/null/.test(match)) {
        cls = 'null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    });
  }

}
