import { Component, inject, Input, OnInit } from '@angular/core';
import { ContextService } from '../../core/services/context.service';
import { DataService } from '../../core/services/data.service';
import { ContentService } from '../../core/services/content.service';
import { ConstantService } from '../../core/services/constant.service';

@Component({
  selector: 'oa-html-viewer',
  imports: [],
  templateUrl: './html-viewer.component.html',
  styleUrl: './html-viewer.component.scss'
})
export class HtmlViewerComponent implements OnInit {


  @Input()
  value?: any;

  @Input()
  options?: any;

  content?: any;
  initialized = false;

  constantService = inject(ConstantService);
  contentService = inject(ContentService);
  context = inject(ContextService);
  dataService = inject(DataService);

  ngOnInit(): void {
    this.options = this.options || {};

    // if (this.options! instanceof ViewerOptions) {
    //   this.options = new ViewerOptions(this.options);
    // }
    if (typeof this.value === 'string') {
      const value = this.context.data().get(this.value);
      if (!value) {
        this.init()
      } else {
        if (value.subscribe) {
          value.subscribe((p: any) => {
            this.value = p;
            this.init();
          })
        }
        this.value = value;
        this.init()
      }
    } else {
      this.init();
    }
  }

  async init() {

    if (!this.value) {
      return;
    }

    const templateCode = this.options?.template?.code || this.options?.view

    const template = templateCode ?
      await this.constantService.templates.get(templateCode)
      : Array.isArray(this.value) ? '{{#each this}} {{{this}}} {{/each}}' : '{{this}}'


    console.log(templateCode);
    this.content = this.contentService.inject(template, this.value);



    this.initialized = true;

  }
}
