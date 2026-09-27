import { ChangeDetectorRef, Component, effect, inject, Injector, Input, OnInit } from '@angular/core';
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
  skeletonContent?: string;
  initialized = false;
  isLoading = false;
  private resolvedValue?: any;

  constantService = inject(ConstantService);
  contentService = inject(ContentService);
  context = inject(ContextService);
  dataService = inject(DataService);
  private changeDetector = inject(ChangeDetectorRef);
  private injector = inject(Injector);

  ngOnInit(): void {
    this.options = this.options || {};
    void this.loadSkeleton();

    // if (this.options! instanceof ViewerOptions) {
    //   this.options = new ViewerOptions(this.options);
    // }
    if (typeof this.value === 'string') {
      const key = this.value;
      const value = this.context.data().get(key);
      if (!value) {
        this.isLoading = true;
      } else {
        this.setValue(value);
      }
      effect(() => {
        const resolvedValue = this.context.data().get(key);
        if (resolvedValue) {
          this.setValue(resolvedValue);
        }
      }, { injector: this.injector });
    } else {
      void this.init();
    }
  }

  private setValue(value: any): void {
    if (value === this.resolvedValue) { return; }
    this.resolvedValue = value;
    this.isLoading = true;

    if (value.subscribe) {
      value.subscribe((resolvedValue: any) => {
        this.value = resolvedValue;
        void this.init();
      });
    }

    this.value = value;
    void this.init();
  }

  private async loadSkeleton(): Promise<void> {
    const templateCode = this.options?.template?.code || this.options?.view;
    if (!templateCode) { return; }

    try {
      this.skeletonContent = await this.constantService.templates.get(`${templateCode}.skeleton`);
    } catch {
      this.skeletonContent = undefined;
    } finally {
      this.changeDetector.markForCheck();
    }
  }

  async init() {

    if (!this.value) {
      this.initialized = true;
      this.isLoading = false;
      this.changeDetector.markForCheck();
      return;
    }

    this.isLoading = true;
    const templateCode = this.options?.template?.code || this.options?.view;

    try {
      const template = templateCode
        ? await this.constantService.templates.get(templateCode)
        : Array.isArray(this.value) ? '{{#each this}} {{{this}}} {{/each}}' : '{{this}}';

      this.content = this.contentService.inject(template, this.value);
      this.initialized = true;
    } finally {
      this.isLoading = false;
      this.changeDetector.markForCheck();
    }

  }
}
