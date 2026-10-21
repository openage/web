import { CommonModule } from '@angular/common';
import { Component, effect, inject, Injector, Input, OnDestroy, OnInit } from '@angular/core';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { Logger } from '../../core/models';
import { CacheService } from '../../core/services/cache.service';
import { DataService } from '../../core/services/data.service';
import { ContextService } from '../../core/services/context.service';
import { NavService } from '../../core/services/nav.service';
import { IconComponent } from '../icon/icon.component';
import { HtmlViewerComponent } from '../html-viewer/html-viewer.component';
import { JsonEditorComponent } from '../json-editor/json-editor.component';
import { BuilderController } from '../builder/builder-controller.model';
import { BuilderCanvasSectionMetadata, BuilderMetadata } from '../builder/builder-metadata.model';

@Component({
  selector: 'oa-canvas',
  standalone: true,
  imports: [CommonModule, CdkDrag, CdkDropList, IconComponent, HtmlViewerComponent, JsonEditorComponent],
  templateUrl: './canvas.component.html'
})
export class CanvasComponent implements OnInit, OnDestroy {
  @Input({ required: true }) builder!: BuilderController;
  @Input() options: Record<string, unknown> = {};
  @Input() value: unknown;

  get className(): string {
    return typeof this.options['class'] === 'string' ? this.options['class'] : '';
  }

  get editorSections(): BuilderCanvasSectionMetadata[] {
    const configured = this.builder.metadata()?.canvasSections;
    if (configured?.length) return configured;
    const metadata = this.builder.metadata();
    if (!metadata) return [];
    return [
      { code: 'items', title: metadata.itemLabel, path: metadata.itemCollectionPath },
      ...(metadata.auxiliaryCollections || []).map((collection) => ({
        code: collection.path.split('.').at(-1) || collection.path,
        title: collection.title,
        path: collection.path
      }))
    ];
  }

  get editorSectionGroups(): Array<{ title: string; sections: BuilderCanvasSectionMetadata[] }> {
    const groups = new Map<string, BuilderCanvasSectionMetadata[]>();
    for (const section of this.editorSections) {
      const title = section.group || 'Workspace';
      groups.set(title, [...(groups.get(title) || []), section]);
    }
    return [...groups].map(([title, sections]) => ({ title, sections }));
  }

  get viewerOptions(): Record<string, unknown> {
    const viewer = this.options['viewer'];
    return viewer && typeof viewer === 'object' && !Array.isArray(viewer)
      ? viewer as Record<string, unknown>
      : {};
  }

  readonly childKeys: Array<'sections' | 'components'> = ['sections', 'components'];

  sectionValue(section: BuilderCanvasSectionMetadata): unknown {
    return this.builder.getBuilderPath(this.builder.workspaceData(), section.path);
  }

  sectionAvailable(section: BuilderCanvasSectionMetadata): boolean {
    return !section.optional || section.path === '' || this.sectionValue(section) !== undefined;
  }

  isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
  }

  isObject(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  objectItems(value: unknown[]): Record<string, unknown>[] {
    return value.every((item) => !!item && typeof item === 'object' && !Array.isArray(item))
      ? value as Record<string, unknown>[]
      : [];
  }

  objectLabel(value: Record<string, unknown>, fallback: string): string {
    return String(value['title'] || value['name'] || value['code'] || fallback);
  }

  selectObject(value: Record<string, unknown>, path: string): void {
    if (!path) {
      this.builder.selectWorkspace();
      return;
    }
    const index = Number(path.split('.').at(-1)) || 0;
    this.builder.selectItem(value, path, index);
  }

  get rootDocumentType(): string {
    return typeof this.value === 'string' ? this.value : this.builder.workspaceType();
  }

  get canvasTabs(): Array<{ code: string; label: string; title: string; icon: string }> {
    return (this.builder.metadata()?.actions || []).map((tab) => ({
      code: tab.code,
      label: tab.title,
      title: tab.title,
      icon: tab.icon
    }));
  }

  get showCanvasViewSwitch(): boolean {
    return this.builder.workspaceType() !== 'application';
  }

  get activeWorkspaceMode(): string {
    const mode = this.builder.metadata()?.actions.find((tab) => tab.code === this.activeTab())?.workspaceMode
      || this.builder.currentTab()?.workspaceMode;
    if (mode === 'summary') return 'viewer';
    if (mode === 'wysiwyg' || mode === 'structure' || mode === 'config') return 'editor';
    if (mode === 'json') return 'code';
    return mode || 'viewer';
  }

  activeTab(): string {
    return this.builder.activeTab();
  }

  private readonly injector = inject(Injector);
  private readonly cache = inject(CacheService);
  private readonly dataService = inject(DataService);
  private readonly context = inject(ContextService);
  private readonly navService = inject(NavService);
  private readonly logger = new Logger(CanvasComponent);
  private effectRef?: { destroy(): void };
  private initializedMetadata?: BuilderMetadata;
  private initializedCode = '';
  private initializedWorkspaceType = '';
  private initializedPage?: unknown;
  get codeEditorOptions(): Record<string, unknown> {
    const code = this.options['code'];
    if (!code || typeof code !== 'object' || Array.isArray(code)) return {};
    const editorOptions = (code as Record<string, unknown>)['editorOptions'];
    return editorOptions && typeof editorOptions === 'object' && !Array.isArray(editorOptions)
      ? editorOptions as Record<string, unknown>
      : {};
  }

  ngOnInit(): void {
    this.effectRef = effect(() => {
      const metadata = this.builder.metadata();
      const code = this.builder.pageCode();
      const workspaceType = metadata?.workspaceType || '';
      const activePage = workspaceType === 'page' && !code ? this.context.page() : undefined;
      if (!metadata || !['application', 'page', 'workflow'].includes(workspaceType)) return;
      if (metadata === this.initializedMetadata && code === this.initializedCode &&
        workspaceType === this.initializedWorkspaceType && activePage === this.initializedPage) return;
      this.initializedMetadata = metadata;
      this.initializedCode = code;
      this.initializedWorkspaceType = workspaceType;
      this.initializedPage = activePage;
      void this.loadWorkspace(metadata, code, activePage as Record<string, unknown> | undefined);
    }, { injector: this.injector });
  }

  ngOnDestroy(): void {
    this.effectRef?.destroy();
  }

  private async loadWorkspace(
    metadata: BuilderMetadata,
    code: string,
    activePage?: Record<string, unknown>
  ): Promise<void> {
    this.builder.loading.set(true);
    try {
      if (metadata.workspaceType === 'workflow') {
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
        return;
      }
      if (metadata.workspaceType === 'page') {
        await this.loadPageWorkspace(metadata, code, activePage);
        return;
      }
      let source: Record<string, unknown>;
      if (code) {
        const draft = this.cache.get(`builder-draft:${metadata.workspaceType}:${code}`);
        if (draft) {
          source = draft as Record<string, unknown>;
        } else {
          const application = await this.dataService.get(code, {
            service: 'system',
            collection: 'applications'
          }) as Record<string, unknown> | undefined;
          if (!application) throw new Error(`Application "${code}" could not be loaded from system applications.`);
          source = application;
        }
      } else {
        source = structuredClone(metadata.defaultData);
      }
      const workspace = this.builder.normalizeWorkspace(source);
      this.builder.workspaceData.set(workspace);
      this.builder.validateWorkspace();
      const sourceLocation = this.builder.getBuilderPath(workspace, 'meta.src');
      this.context.appSource.set(typeof sourceLocation === 'string' && sourceLocation.trim() ? sourceLocation.trim() : undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.builder.loadError.set(message);
      this.logger.error(`Unable to load ${metadata.workspaceType} workspace`, error);
    } finally {
      this.builder.loading.set(false);
    }
  }

  private async loadPageWorkspace(
    metadata: BuilderMetadata,
    code: string,
    activePage?: Record<string, unknown>
  ): Promise<void> {
    const navigation = code ? this.navService.getByCode(code) : activePage;
    if (code && !navigation) throw new Error(`Page "${code}" is not present in application navigation.`);

    let remotePage: Record<string, unknown> | undefined;
    if (navigation?.['id'] && code) {
      remotePage = await this.dataService.get(navigation['id'], {
        service: 'system',
        collection: 'navs'
      }) as Record<string, unknown> | undefined;
      if (!remotePage) {
        this.builder.loadError.set(`Full metadata for "${code}" was not returned; using the navigation entry as a draft base.`);
        this.logger.warn('Page metadata lookup returned no page body', code);
      }
    }

    const source = remotePage || navigation;
    const sourceCode = code || String(source?.['code'] || metadata.defaultData['code'] || 'new');
    const draft = this.cache.get(`builder-draft:${metadata.workspaceType}:${sourceCode}`);
    const workspace = structuredClone((draft || source || metadata.defaultData) as Record<string, unknown>);
    const rawMeta = workspace['meta'];
    const meta = rawMeta && typeof rawMeta === 'object' && !Array.isArray(rawMeta)
      ? rawMeta as Record<string, unknown>
      : {};
    workspace['meta'] = meta;
    const rawLayout = meta['layout'];
    const layout = rawLayout && typeof rawLayout === 'object' && !Array.isArray(rawLayout)
      ? rawLayout as Record<string, unknown>
      : {};
    meta['layout'] = layout;
    layout['type'] ||= 'workspace';
    if (!Array.isArray(layout['sections'])) layout['sections'] = [];
    if (!Array.isArray(meta['data'])) meta['data'] = [];
    if (!Array.isArray(meta['actions'])) meta['actions'] = [];
    this.builder.workspaceData.set(workspace);
  }

}
