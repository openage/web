import { CommonModule } from '@angular/common';
import { Component, effect, inject, Injector, Input, OnDestroy, OnInit } from '@angular/core';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { Logger } from '../../core/models';
import { CacheService } from '../../core/services/cache.service';
import { IconComponent } from '../icon/icon.component';
import { BuilderController } from '../builder/builder-controller.model';
import { BuilderMetadata } from '../builder/builder-metadata.model';

@Component({
  selector: 'oa-workflow-canvas',
  standalone: true,
  imports: [CommonModule, CdkDrag, CdkDropList, IconComponent],
  templateUrl: './workflow-canvas.component.html'
})
export class OaWorkflowCanvasComponent implements OnInit, OnDestroy {
  @Input({ required: true }) builder!: BuilderController;
  @Input() options: Record<string, unknown> = {};

  get className(): string {
    return typeof this.options['class'] === 'string' ? this.options['class'] : '';
  }

  private readonly injector = inject(Injector);
  private readonly cache = inject(CacheService);
  private readonly logger = new Logger(OaWorkflowCanvasComponent);
  private effectRef?: { destroy(): void };
  private initializedMetadata?: BuilderMetadata;
  private initializedCode = '';

  ngOnInit(): void {
    this.effectRef = effect(() => {
      const metadata = this.builder.metadata();
      const code = this.builder.pageCode();
      if (!metadata || metadata.workspaceType !== 'workflow') return;
      if (metadata === this.initializedMetadata && code === this.initializedCode) return;
      this.initializedMetadata = metadata;
      this.initializedCode = code;
      void this.loadWorkspace(metadata, code);
    }, { injector: this.injector });
  }

  ngOnDestroy(): void {
    this.effectRef?.destroy();
  }

  private async loadWorkspace(metadata: BuilderMetadata, code: string): Promise<void> {
    this.builder.loading.set(true);
    try {
      const draft = code ? this.cache.get(`builder-draft:${metadata.workspaceType}:${code}`) : undefined;
      const workspace = structuredClone((draft || metadata.defaultData) as Record<string, unknown>);
      if (!Array.isArray(this.builder.getBuilderPath(workspace, metadata.itemCollectionPath))) {
        this.builder.setBuilderPath(workspace, metadata.itemCollectionPath, []);
      }
      for (const collection of metadata.auxiliaryCollections || []) {
        if (!Array.isArray(this.builder.getBuilderPath(workspace, collection.path))) {
          this.builder.setBuilderPath(workspace, collection.path, []);
        }
      }
      this.builder.workspaceData.set(workspace);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.builder.loadError.set(message);
      this.logger.error('Unable to load workflow workspace', error);
    } finally {
      this.builder.loading.set(false);
    }
  }
}
