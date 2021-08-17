import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { EditorOptions } from '../../core/models/editor.options';
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

  constructor(
    public context: ContextService,
    public dataService: DataService,
  ) { }

  ngOnInit() {

    this.options = this.options || {};

    this.class = this.class || this.options.class;
    this.style = this.class || this.options.style;
  }

  ngOnChanges(): void {
    if (typeof this.value === 'string') {
      const value = this.context.data(this.value);

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
  onTextChange($event: any) {
    let subject: string = $event.target.tagName === 'INPUT' ? $event.target.value : $event.target.innerText;

    if (!subject) {
      return;
    }

    subject = subject.replace(/(?:\r\n|\r|\n)/g, '');

    const value = JSON.parse(subject);
    Object.assign(this.value, value)
    this.valueChange.emit(this.value);
  }

  syntaxHighlight(json: string) {
    json = json
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    // .replace(/(?:\r\n|\r|\n)/g, '<br>');

    // eslint-disable-next-line max-len
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
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
