import { Component, Input, OnInit } from '@angular/core';
import { ViewerOptions } from '../../core/models/viewer.options';
import { StringService } from '../../core/services';
import { ContextService } from '../../core/services/context.service';
import { DataService } from '../../core/services/data.service';

@Component({
  selector: 'oa-html-viewer',
  standalone: true,
  imports: [],
  templateUrl: './html-viewer.component.html',
  styleUrl: './html-viewer.component.scss'
})
export class HtmlViewerComponent implements OnInit {

  templates: any = {
    link: `<a href="{{url}}" class="link">{{title}}</a>`,
    summary: `
    <div class="summary">
      <img class="main-img" src="{{icon}}" alt="Icon">
      <div class="content">
        <h2 class="title">{{title}}</h2>
        <p class="description">{{description}}</p>
        <a href="{{options.root}}/{{code}}" class="link">Learn More</a>
      </div>
    </div>
    `,
  }

  @Input()
  value?: any;

  @Input()
  options?: any;

  content?: any;
  initialized = false;

  constructor(
    private stringService: StringService,
    public context: ContextService,
    public dataService: DataService,
  ) { }

  ngOnInit(): void {
    this.options = this.options || {};

    if (this.options! instanceof ViewerOptions) {
      this.options = new ViewerOptions(this.options);
    }
    if (typeof this.value === 'string') {
      const value = this.context.data(this.value);

      if (value) {
        if (value.subscribe) {
          value.subscribe((p: any) => {
            this.value = p;
            this.init();
            this.initialized = true;
          })
        }

        this.value = value;
        this.init()
        this.initialized = true;

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

    if (!this.value) {
      return;
    }

    const format = (v: any): any => {
      if (v.items) {
        v = v.items;
      }

      if (Array.isArray(v)) {
        return v.map(i => format(i));
      }

      let template = this.options.template

      if (!template && this.options.view) {
        template = this.templates[this.options.view]
      }

      if (typeof v === 'string') {
        v = {
          text: v
        }
      }

      v.options = this.options;

      if (template) {
        v.text = this.stringService.inject(template, v)
      }

      return {
        class: v?.class || this.options?.class,
        style: v?.style || this.options?.style,
        text: v?.text
      }
    }

    if (Array.isArray(this.value)) {
      this.value = this.value.join('')
    }

    this.content = format(this.value);
  }
}
