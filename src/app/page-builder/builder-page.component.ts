import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, computed, effect, inject, OnDestroy, signal, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Logger } from '../../lib/oa/core/models';
import { Action } from '../../lib/oa/core/models/action.model';
import { Link } from '../../lib/oa/core/models/link.model';
import { LayoutComponent } from '../../lib/oa/core/components/layout/layout.component';
import { CacheService } from '../../lib/oa/core/services/cache.service';
import { ContextService } from '../../lib/oa/core/services/context.service';
import { DataService } from '../../lib/oa/core/services/data.service';
import { ValidationService } from '../../lib/oa/core/services/validation.service';
import { DynamicPageComponent } from '../dynamic-page/dynamic-page.component';
import { BuilderMetadata, BuilderSelection, BuilderToolbarItem, BuilderToolMetadata, BuilderValidationError } from './builder-metadata.model';
import { ToolboxComponent, ToolboxDrag } from '../../lib/oa/ux/toolbox/toolbox.component';
import { PropertiesComponent } from '../../lib/oa/ux/properties/properties.component';
import { CanvasComponent, CanvasItemAction, CanvasItemDrop, CanvasSelection, CanvasToolDrop } from '../../lib/oa/ux/canvas/canvas.component';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-builder-page',
  standalone: true,
  imports: [
    LayoutComponent,
    ToolboxComponent,
    PropertiesComponent,
    CanvasComponent
  ],
  templateUrl: './builder-page.component.html',
  styleUrl: './builder-page.component.scss'
})
export class BuilderPageComponent extends DynamicPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasTemplate') canvasTemplate?: TemplateRef<any>;
  @ViewChild('toolboxTemplate') toolboxTemplate?: TemplateRef<any>;
  @ViewChild('propertiesTemplate') propertiesTemplate?: TemplateRef<any>;

  private readonly builderRouter = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly dataService = inject(DataService);
  private readonly cache = inject(CacheService);
  private readonly validator = inject(ValidationService);
  readonly builderContext = inject(ContextService);
  private readonly builderLogger = new Logger(BuilderPageComponent);
  private cachedBuilderSource?: object;
  private cachedBuilderComponents?: any[];
  private cachedBuilderLayout?: unknown;
  private cachedBuilderMetadata?: BuilderMetadata;
  private routeBuilderMetadata?: BuilderMetadata;
  private previousContextActions?: Action[];
  private installedContextActions?: Action[];
  private hasPreviousContextActions = false;
  private navigationSubscription?: { unsubscribe(): void };
  // Flow: layout -> metadata -> selection -> edits -> save/persist.
  // ----- Selection and property editing -----
  get propertiesData(): Record<string, unknown> {
    if (this.canvasSectionSelection()) return {};
    return this.selected()?.item ?? this.workspaceData();
  }

  get propertiesType(): string {
    const sectionSelection = this.canvasSectionSelection();
    if (sectionSelection) return Array.isArray(sectionSelection.value) ? 'collection' : sectionSelection.code;
    return this.selected()?.type || 'workspace';
  }

  get canvasSelection(): CanvasSelection | null {
    const sectionSelection = this.canvasSectionSelection();
    if (sectionSelection) return sectionSelection;
    const selection = this.selected();
    if (!selection) return null;
    const configuredSection = this.metadata()?.canvasSections
      ?.filter((section) => selection.path === section.path || selection.path.startsWith(`${section.path}.`))
      .sort((left, right) => right.path.length - left.path.length)[0];
    return {
      code: selection.type,
      sectionCode: configuredSection?.code || selection.type,
      groupCode: configuredSection?.group,
      value: selection.item,
      path: selection.path,
      index: selection.index
    };
  }

  get canvasDropListIds(): string[] {
    const activeTool = this.activeToolDrag()?.tool;
    return (this.metadata()?.canvasSections || []).flatMap((section) => {
      const value = this.getBuilderPath(this.workspaceData(), section.path);
      if (section.optional && value === undefined &&
        (!activeTool || !this.toolCanTargetSection(section, activeTool))) return [];
      const normalize = (value: string): string => value.replace(/[^a-zA-Z0-9_-]/g, '-');
      const ids = [Array.isArray(value)
        ? `oa-canvas-${normalize(section.code)}`
        : `oa-canvas-${normalize(section.code)}-section`];
      (Array.isArray(value) ? value : []).forEach((item, index) => {
        if (item && typeof item === 'object' && Array.isArray((item as Record<string, unknown>)['components'])) {
          ids.push(`oa-canvas-${normalize(section.code)}-${normalize(`${section.path}.${index}.components`)}`);
        }
      });
      return ids;
    });
  }

  private toolCanTargetSection(section: NonNullable<BuilderMetadata['canvasSections']>[number],
    tool: BuilderToolbarItem): boolean {
    const toolTargets = Array.isArray(tool.targets) && tool.targets.length
      ? tool.targets
      : tool.target === 'meta' && tool.code
        ? [`meta.${tool.code}`]
        : tool.target
          ? [tool.target]
          : [];
    const sectionTargets = section.targets ?? (section.target ? [section.target] : [section.code]);
    return toolTargets.some((target) => {
      if (tool.target === 'meta' && this.getBuilderPath(this.workspaceData(), target) !== undefined) return false;
      if (section.path.endsWith('.components')) return target === 'components';
      if (section.path.endsWith('.sections')) return target === 'sections';
      const metadataPathMatches = target.startsWith('meta.') &&
        (section.path === target ||
          (!!section.path && target.startsWith(`${section.path}.`)) ||
          (!section.path && tool.target === 'meta'));
      return sectionTargets.includes(target) ||
        metadataPathMatches;
    });
  }

  get toolboxDropListIds(): string[] {
    return this.toolbarGroups.map((group, index) => {
      const code = group.code || `group-${index}`;
      return `oa-tool-group-${code}`;
    });
  }

  private get toolbarGroups(): Array<{ code: string; title: string; tools: BuilderToolbarItem[] }> {
    const control = this.builderConfiguredComponents.find((component: any) =>
      component.control === 'toolbar' || component.control === 'tool-bar');
    const options = control?.options;
    const configured = options?.groups;
    return Array.isArray(configured)
      ? configured.filter((group): group is { code: string; title: string; tools: BuilderToolbarItem[] } =>
        !!group && typeof group === 'object' &&
        typeof (group as Record<string, unknown>)['code'] === 'string' &&
        typeof (group as Record<string, unknown>)['title'] === 'string' &&
        Array.isArray((group as Record<string, unknown>)['tools']))
      : [];
  }

  onCanvasSelection(selection: CanvasSelection): void {
    if (!this.isObjectRecord(selection.value)) {
      this.selected.set(null);
      this.canvasSectionSelection.set(selection);
      this.propertyError.set('');
      return;
    }
    this.canvasSectionSelection.set(null);
    this.setSelection({
      type: selection.code,
      item: selection.value,
      index: selection.index,
      path: selection.path
    });
    this.propertyError.set('');
  }

  onCanvasToolDropped(drop: CanvasToolDrop): void {
    const targets = drop.tool.targets ?? (drop.tool.target ? [drop.tool.target] : []);
    const targetPath = targets.includes('components') && !drop.targetPath.endsWith('.components')
      ? this.componentTargetPath() || drop.targetPath
      : drop.targetPath;
    this.addConfiguredItem(drop.tool, targetPath);
  }

  onCanvasItemDropped(drop: CanvasItemDrop): void {
    this.drop(drop.event, drop.targetPath);
  }

  onCanvasItemAction(action: CanvasItemAction): void {
    const selection = action.selection;
    this.setSelection({
      type: selection.code,
      item: selection.value,
      index: selection.index,
      path: selection.path
    });
    switch (action.action) {
      case 'move-up':
        this.moveSelection(-1);
        break;
      case 'move-down':
        this.moveSelection(1);
        break;
      case 'duplicate':
        this.duplicateSelection();
        break;
      case 'delete':
        this.removeSelection();
        break;
    }
  }

  onToolDragStart(tool: BuilderToolbarItem): void {
    const groupCode = this.toolbarGroups.find((group) => group.tools.includes(tool))?.code || '';
    this.activeToolDrag.set({ groupCode, tool });
    this.startToolDrag(tool);
  }

  onToolDragEnd(): void {
    this.activeToolDrag.set(null);
    this.clearToolDrag();
  }

  onToolSelected(tool: BuilderToolbarItem): void {
    this.addConfiguredItem(tool);
  }

  private setSelection(selection: BuilderSelection | null): void {
    this.canvasSectionSelection.set(null);
    this.selected.set(selection);
  }

  private isObjectRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  propertiesOptions(options: Record<string, unknown>): Record<string, unknown> {
    return {
      ...options,
      types: options['types'] ?? this.builderMetadata?.propertySchemas ?? {},
      validationSchema: this.builderMetadata?.validationSchema ?? {},
      validationErrors: this.validationErrors(),
      selectionPath: this.canvasSelection?.path || ''
    };
  }

  onPropertiesChange(data: Record<string, unknown>): void {
    if (this.canvasSectionSelection()) return;
    const next = structuredClone(this.workspaceData());
    const selection = this.selected();
    if (selection?.path) {
      this.setBuilderPath(next, selection.path, structuredClone(data));
      const updated = this.getBuilderPath(next, selection.path);
      if (updated && typeof updated === 'object' && !Array.isArray(updated)) {
        this.setSelection({ ...selection, item: updated as Record<string, unknown> });
      }
    } else {
      this.workspaceData.set(structuredClone(data));
      if (selection) this.setSelection({ ...selection, item: structuredClone(data) });
    }
    if (selection?.path) this.workspaceData.set(next);
    this.markChanged();
    this.propertyError.set('');
  }

  updateWorkspaceData(data: Record<string, unknown>): void {
    const metadata = this.metadata();
    if (!metadata) return;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      this.propertyError.set('Workspace source must be a JSON object.');
      return;
    }

    const workspace = this.normalizeWorkspace(structuredClone(data));
    this.workspaceData.set(workspace);
    this.setSelection(null);
    this.markChanged();
    this.propertyError.set('');
  }

  // ----- Metadata and workspace configuration -----
  get builderMetadata(): BuilderMetadata | undefined {
    const pageMetadata = this.builderContext.page()?.meta as Record<string, unknown> | undefined;
    const metadata = this.routeBuilderMetadata ||
      this.route.snapshot.data['builderMetadata'] as BuilderMetadata | undefined ||
      this.builderContext.getPageMeta('builder') as BuilderMetadata | undefined ||
      pageMetadata as BuilderMetadata | undefined;
    if (!metadata || typeof metadata !== 'object') return undefined;
    if (metadata === this.cachedBuilderSource && this.components === this.cachedBuilderComponents &&
      this.layout === this.cachedBuilderLayout) {
      return this.cachedBuilderMetadata;
    }

    const configuredComponents = this.builderConfiguredComponents;
    const optionsFor = (controls: string[]): Record<string, unknown> | undefined => {
      const component = configuredComponents.find((item: any) => controls.includes(item.control));
      return component?.options && typeof component.options === 'object' ? component.options : undefined;
    };
    const toolbarOptions = optionsFor(['toolbar', 'tool-bar']);
    const propertiesOptions = optionsFor(['properties']);
    const canvasOptions = optionsFor(['canvas']);
    const builder = metadata as BuilderMetadata;
    const pageData = pageMetadata?.['data'];
    const defaultDataEntry = Array.isArray(pageData)
      ? pageData.find((item) => item && typeof item === 'object' && 'data' in item) as { data?: unknown } | undefined
      : undefined;
    const defaultData = builder.defaultData ||
      (defaultDataEntry?.data && typeof defaultDataEntry.data === 'object'
        ? defaultDataEntry.data as Record<string, unknown>
        : {});
    const canvasSections = (Array.isArray(canvasOptions?.['sections'])
      ? canvasOptions['sections'] as BuilderMetadata['canvasSections']
      : builder.canvasSections) || [];
    const configuredCollections = canvasSections
      .filter((section) => !!section.path && Array.isArray(this.getBuilderPath(defaultData, section.path)))
      .map((section) => ({ path: section.path, title: section.title }));
    const itemCollectionPath = builder.itemCollectionPath || configuredCollections[0]?.path || 'items';
    const auxiliaryCollections = builder.auxiliaryCollections ||
      configuredCollections.filter((collection) => collection.path !== itemCollectionPath);

    this.cachedBuilderSource = metadata;
    this.cachedBuilderComponents = this.components;
    this.cachedBuilderLayout = this.layout;
    this.cachedBuilderMetadata = {
      ...builder,
      title: builder.title || this.page?.title || 'Builder',
      icon: builder.icon || (typeof canvasOptions?.['icon'] === 'string'
        ? canvasOptions['icon']
        : this.page?.icon || 'dashboard'),
      itemCollectionPath,
      itemLabel: builder.itemLabel || configuredCollections[0]?.title || 'Items',
      dataKey: builder.dataKey || (typeof canvasOptions?.['value'] === 'string'
        ? String(canvasOptions['value']).split('.')[0]
        : undefined),
      auxiliaryCollections,
      defaultData,
      toolbox: {
        groups: (toolbarOptions?.['groups'] as BuilderMetadata['toolbox']['groups'] | undefined) ?? builder.toolbox?.groups ?? []
      },
      propertySchemas: (propertiesOptions?.['types'] as BuilderMetadata['propertySchemas'] | undefined) ?? builder.propertySchemas ?? {},
      validationSchema: (canvasOptions?.['schema'] as BuilderMetadata['validationSchema'] | undefined) ?? builder.validationSchema ?? {},
      canvasSections: Array.isArray(canvasOptions?.['sections'])
        ? canvasOptions['sections'] as BuilderMetadata['canvasSections']
        : builder.canvasSections,
      persistence: builder.persistence,
      preview: builder.preview
    };
    return this.cachedBuilderMetadata;
  }

  private get builderConfiguredComponents(): any[] {
    const sections = Array.isArray(this.layout?.sections) ? this.layout.sections : [];
    const sectionComponents: any[] = [];
    const collect = (items: any[]): void => {
      for (const section of items) {
        if (Array.isArray(section.components)) sectionComponents.push(...section.components);
        if (Array.isArray(section.sections)) collect(section.sections);
      }
    };
    collect(sections);
    return [...(Array.isArray(this.components) ? this.components : []), ...sectionComponents];
  }

  private get builderDataKey(): string {
    const canvas = this.builderConfiguredComponents.find((component: any) => component.control === 'canvas');
    return typeof canvas?.value === 'string'
      ? canvas.value.split('.')[0]
      : this.metadata()?.dataKey || 'data';
  }

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.addTemplate('canvas', this.canvasTemplate);
    this.addTemplate('tool-bar', this.toolboxTemplate);
    this.addTemplate('properties', this.propertiesTemplate);

    this.ensureBuilderLayout();
    this.navigationSubscription = this.builderRouter.events.subscribe((event) => {
      if (event instanceof NavigationEnd) queueMicrotask(() => this.ensureBuilderLayout());
    });
    void this.initialize();
  }

  private ensureBuilderLayout(): void {
    if (this.builderConfiguredComponents.some((component: any) => component.control === 'canvas')) return;

    this.layout = {
      type: 'default',
      sections: [
        { code: 'tool-bar', class: 'builder-region-toolbar' },
        { code: 'canvas', class: 'builder-region-canvas' },
        { code: 'properties', class: 'builder-region-properties' }
      ]
    };
    this.components = [
      { section: 'toolbar', control: 'toolbar', options: { title: 'Builder tools', groups: [] } },
      { section: 'canvas', control: 'canvas', options: {}, value: [] },
      { section: 'properties', control: 'properties', options: { title: 'Properties', schema: {}, collapsible: true }, value: [] }
    ];
  }
  // ----- Reactive workspace state -----
  readonly pageCode = signal(this.routeParam('code') || '');
  readonly metadata = signal<BuilderMetadata | null>(null);
  readonly workspaceData = signal<Record<string, unknown>>({});
  readonly selected = signal<BuilderSelection | null>(null);
  private readonly canvasSectionSelection = signal<CanvasSelection | null>(null);
  readonly validationErrors = signal<BuilderValidationError[]>([]);
  readonly validationWarnings = signal<string[]>([]);
  readonly workspaceValid = computed(() => this.validationErrors().length === 0);
  readonly loading = signal(false);
  readonly previewMode = signal(false);
  readonly previewViewport = signal<'desktop' | 'tablet' | 'mobile'>('desktop');
  readonly dirty = signal(false);
  readonly saved = signal(false);
  private readonly savedWorkspace = signal<Record<string, unknown> | null>(null);
  readonly loadError = signal('');
  readonly propertyError = signal('');
  readonly toolDragInProgress = signal(false);
  readonly activeTool = signal<BuilderToolbarItem | null>(null);
  readonly activeToolDrag = signal<ToolboxDrag | null>(null);
  private readonly contextDataSyncEnabled = signal(false);
  readonly dropListIds = computed(() => {
    const metadata = this.metadata();
    if (!metadata) return [];
    const paths = new Set<string>();
    const collect = (path: string): void => {
      const items = this.getBuilderPath(this.workspaceData(), path);
      if (!Array.isArray(items)) return;
      paths.add(path);
      items.forEach((item, index) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return;
        const itemPath = `${path}.${index}`;
        for (const key of ['sections', 'components'] as const) {
          if (Array.isArray((item as Record<string, unknown>)[key])) collect(`${itemPath}.${key}`);
        }
      });
    };
    [metadata.itemCollectionPath, ...(metadata.auxiliaryCollections || []).map((item) => item.path),
    ...(metadata.canvasSections || []).map((section) => section.path)].forEach(collect);
    return [...paths].map((path) => this.dropListId(path));
  });
  readonly lastSavedAt = signal('');

  readonly rootItems = computed(() => {
    const path = this.metadata()?.itemCollectionPath;
    const items = path ? this.getBuilderPath(this.workspaceData(), path) : undefined;
    return Array.isArray(items) ? items as Record<string, unknown>[] : [];
  });

  readonly workspaceTitle = computed(() => {
    const data = this.workspaceData();
    return String(data['title'] || data['name'] || this.metadata()?.title || 'Workspace');
  });

  readonly previewLayout = computed<Record<string, unknown>>(() => {
    const path = this.metadata()?.preview?.layoutPath;
    const layout = path ? this.getBuilderPath(this.workspaceData(), path) : undefined;
    return layout && typeof layout === 'object' && !Array.isArray(layout)
      ? layout as Record<string, unknown>
      : { sections: [] };
  });
  readonly hasPreviewSections = computed(() => Array.isArray(this.previewLayout()['sections']) &&
    (this.previewLayout()['sections'] as unknown[]).length > 0);

  readonly previewComponents = computed<any[]>(() => {
    const path = this.metadata()?.preview?.componentsPath;
    const components = path ? this.getBuilderPath(this.workspaceData(), path) : undefined;
    return Array.isArray(components) ? components : [];
  });

  setPreviewViewport(viewport: 'desktop' | 'tablet' | 'mobile'): void {
    this.previewViewport.set(viewport);
  }

  readonly propertyDefinitions = computed(() => {
    const metadata = this.metadata();
    if (!metadata) return [];
    const selected = this.selected();
    const selectionType = selected?.type || 'workspace';
    return metadata.propertySchemas[selectionType] ?? metadata.propertySchemas['item'] ?? [];
  });

  readonly flattenedItems = computed(() => this.flattenItems(this.rootItems(), this.metadata()?.itemCollectionPath || ''));
  readonly selectedLabel = computed(() => {
    const selection = this.selected();
    if (!selection) return 'Workspace';
    return String(selection.item['title'] || selection.item['name'] || selection.item['code'] || 'Selected item');
  });

  constructor() {
    super();
    effect(() => {
      if (!this.contextDataSyncEnabled()) return;
      const key = this.builderDataKey;
      const workspace = this.workspaceData();
      const current = this.builderContext.data();
      if (current.get(key) === workspace) return;
      const next = new Map(current);
      next.set(key, workspace);
      this.builderContext.data.set(next);
    });
  }

  override ngOnDestroy(): void {
    this.navigationSubscription?.unsubscribe();
    if (this.installedContextActions && this.builderContext.actions() === this.installedContextActions) {
      this.builderContext.actions.set(this.previousContextActions || []);
    }
    super.ngOnDestroy();
  }

  async initialize(): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');
    try {
      this.pageCode.set(this.routeParam('code') || '');
      this.routeBuilderMetadata =
        this.route.snapshot.data['builderMetadata'] as BuilderMetadata | undefined ||
        this.builderContext.getPageMeta('builder') as BuilderMetadata | undefined;
      const metadataUrl = this.route.snapshot.data['builderMetadataUrl'] as string | undefined;
      if (metadataUrl) {
        const loaded = await firstValueFrom(this.http.get<BuilderMetadata>(metadataUrl));
        this.routeBuilderMetadata = loaded;
        this.cachedBuilderSource = undefined;
      }
      const metadata = this.builderMetadata;
      if (!metadata) throw new Error('No builder metadata is available.');
      this.validateBuilderMetadata(metadata);
      this.metadata.set(metadata);
      const configuredData = this.toWorkspaceRecord(this.builderContext.data().get(this.builderDataKey));
      this.workspaceData.set(this.normalizeWorkspace(configuredData ?? structuredClone(metadata.defaultData)));
      this.contextDataSyncEnabled.set(true);
      this.savedWorkspace.set(null);
      this.setSelection(null);
      this.validationErrors.set([]);
      this.dirty.set(false);
      this.syncBuilderContextActions();
      this.builderContext.breadcrumbs.set([
        new Link({ title: metadata.title, url: this.builderUrl() }),
        ...(this.pageCode() ? [new Link({ title: this.pageCode() })] : [])
      ]);
      this.loading.set(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.loadError.set(message);
      this.builderLogger.error('Unable to initialize builder workspace', error);
      this.loading.set(false);
    }
  }

  private validateBuilderMetadata(metadata: BuilderMetadata): void {
    if (!metadata || typeof metadata !== 'object') throw new Error('Builder metadata must be an object.');
    if (!metadata.title?.trim() || !metadata.icon?.trim() || !metadata.itemCollectionPath?.trim()) {
      throw new Error('Builder metadata must include title, icon, and itemCollectionPath.');
    }

    if (!metadata.defaultData || typeof metadata.defaultData !== 'object' ||
      !metadata.validationSchema || typeof metadata.validationSchema !== 'object' ||
      !metadata.propertySchemas || typeof metadata.propertySchemas !== 'object') {
      throw new Error('Builder metadata must include defaultData, propertySchemas, and validationSchema.');
    }
    if (!metadata.toolbox || !Array.isArray(metadata.toolbox.groups) ||
      metadata.toolbox.groups.some((group) => !group.code?.trim() || !group.title?.trim() || !Array.isArray(group.tools))) {
      throw new Error('Builder metadata must define valid toolbox groups.');
    }
  }

  private toWorkspaceRecord(value: unknown): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
    const entries = Object.entries(value).filter(([key, entry]) =>
      !key.startsWith('_') && typeof entry !== 'function');
    return structuredClone(Object.fromEntries(entries));
  }

  workspaceValue(path: string): unknown {
    return this.getBuilderPath(this.workspaceData(), path);
  }

  workspaceJson(path: string): string {
    const value = this.workspaceValue(path);
    return JSON.stringify(value ?? {}, null, 2);
  }

  updateWorkspaceValue(path: string, value: unknown): void {
    if (!path) return;
    const next = structuredClone(this.workspaceData());
    this.setBuilderPath(next, path, value);
    this.workspaceData.set(next);
    this.markChanged();
  }

  updateWorkspaceJson(path: string, event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    try {
      const value: unknown = JSON.parse(input.value);
      this.updateWorkspaceValue(path, value);
      this.propertyError.set('');
    } catch (error) {
      this.propertyError.set(error instanceof Error ? `Invalid JSON: ${error.message}` : 'Invalid JSON value.');
    }
  }

  selectItem(item: Record<string, unknown>, path: string, index: number): void {
    const collection = this.metadata()?.auxiliaryCollections?.find((candidate) => path.startsWith(`${candidate.path}.`));
    const isLayoutSection = /(?:^|\.)sections\.\d+(?:\.|$)/.test(path);
    const configuredSection = this.metadata()?.canvasSections?.find((section) =>
      section.path === path.replace(/\.\d+(?:\..*)?$/, '') || path.startsWith(`${section.path}.`));
    const type = String(configuredSection?.target || (item['control'] ? item['control'] : undefined) ||
      (isLayoutSection ? 'section' : undefined) || item['type'] ||
      (collection ? collection.title.replace(/s$/, '').toLowerCase() : undefined) ||
      item['code'] || path.split('.').at(-1) || 'item');
    this.setSelection({ type, item, index, path });
    this.propertyError.set('');
  }

  updateProperty(propertyPath: string, value: unknown): void {
    const selection = this.selected();
    const basePath = selection?.path || '';
    const targetPath = [basePath, propertyPath].filter(Boolean).join('.');
    const next = structuredClone(this.workspaceData());
    this.setBuilderPath(next, targetPath, value);
    this.workspaceData.set(next);
    this.markChanged();
    this.propertyError.set('');
    if (selection) {
      const updated = this.getBuilderPath(next, selection.path) as Record<string, unknown>;
      this.setSelection({ ...selection, item: updated });
    }
  }

  updateJsonProperty(propertyPath: string, event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    try {
      this.updateProperty(propertyPath, JSON.parse(input.value));
    } catch (error) {
      this.propertyError.set(error instanceof Error ? `Invalid JSON: ${error.message}` : 'Invalid JSON value.');
    }
  }

  inputValue(propertyPath: string): string {
    const selection = this.selected();
    const value = selection
      ? this.getBuilderPath(selection.item, propertyPath)
      : this.getBuilderPath(this.workspaceData(), propertyPath);
    if (value === undefined || value === null) return '';
    return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
  }

  // ----- Workspace mutation flow -----
  addTool(tool: BuilderToolMetadata, targetPath?: string): void {
    const metadata = this.metadata();
    if (!metadata) return;
    if (!this.workspaceValid()) {
      this.loadError.set('Resolve schema validation errors before adding items.');
      return;
    }
    const auxiliary = metadata.auxiliaryCollections || [];
    const toolTargets = tool.targets ?? (tool.target ? [tool.target] : []);
    const configuredTarget = metadata.canvasSections?.find((section) =>
      [section.code, section.path, section.target, ...(section.targets || [])]
        .some((candidate) => !!candidate && toolTargets.includes(candidate)))?.path;
    const auxiliaryPath = auxiliary.find((collection) =>
      collection.path === configuredTarget || toolTargets.includes(collection.path))?.path;
    const droppingAtRoot = targetPath === metadata.itemCollectionPath;
    let path = droppingAtRoot && auxiliaryPath
      ? auxiliaryPath
      : targetPath || auxiliaryPath || metadata.itemCollectionPath;
    const next = structuredClone(this.workspaceData());
    const target = this.getBuilderPath(next, path);
    if (!Array.isArray(target)) {
      this.loadError.set(`The drop target "${path}" is not a valid item collection.`);
      return;
    }
    const item = this.createItem(tool.defaultProperties, tool.type);
    target.push(item);
    this.workspaceData.set(next);
    this.markChanged();
    this.selectItem(item, `${path}.${target.length - 1}`, target.length - 1);
  }

  drop<T>(event: CdkDragDrop<T[]>, targetPath: string): void {
    const data = event.item.data as BuilderToolMetadata | { path: string; index: number };
    if (this.isTool(data)) {
      if (!this.canDropToolAt(data, targetPath)) return;
      this.addTool(data, targetPath);
      return;
    }
    if ('target' in data || 'targets' in data || 'control' in data) {
      if (!this.canDropToolAt(data as BuilderToolbarItem, targetPath)) return;
      this.addConfiguredItem(data as BuilderToolbarItem, targetPath);
      return;
    }

    const sourcePath = event.previousContainer === event.container
      ? targetPath
      : (data as { path: string }).path.replace(/\.\d+$/, '');
    const next = structuredClone(this.workspaceData());
    const previous = this.getBuilderPath(next, sourcePath);
    const current = this.getBuilderPath(next, targetPath);
    if (!Array.isArray(previous) || !Array.isArray(current)) return;
    if (sourcePath === targetPath) {
      moveItemInArray(previous, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(previous, current, event.previousIndex, event.currentIndex);
    }
    this.workspaceData.set(next);
    this.markChanged();
    this.selectItem(current[event.currentIndex] as Record<string, unknown>, `${targetPath}.${event.currentIndex}`, event.currentIndex);
  }

  private refreshAfterStructureChange(path: string, index: number): void {
    const next = structuredClone(this.workspaceData());
    this.workspaceData.set(next);
    this.markChanged();
    const items = this.getBuilderPath(next, path) as Record<string, unknown>[];
    if (items[index]) this.selectItem(items[index], `${path}.${index}`, index);
  }

  removeSelection(): void {
    const selection = this.selected();
    if (!selection) return;
    this.removeItem(selection.path);
  }

  duplicateSelection(): void {
    const selection = this.selected();
    if (!selection) return;
    const segments = selection.path.split('.');
    const index = Number(segments.pop());
    const parentPath = segments.join('.');
    const next = structuredClone(this.workspaceData());
    const parent = this.getBuilderPath(next, parentPath);
    if (!Array.isArray(parent) || !Number.isInteger(index) || !parent[index]) return;

    const duplicate = structuredClone(parent[index]) as Record<string, unknown>;
    this.regenerateBuilderIds(duplicate);
    parent.splice(index + 1, 0, duplicate);
    this.workspaceData.set(next);
    this.markChanged();
    this.selectItem(duplicate, `${parentPath}.${index + 1}`, index + 1);
  }

  private regenerateBuilderIds(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach((item) => this.regenerateBuilderIds(item));
      return;
    }
    if (!value || typeof value !== 'object') return;
    const item = value as Record<string, unknown>;
    if (typeof item['code'] === 'string') {
      const prefix = String(item['type'] || item['control'] || 'item');
      item['code'] = this.createBuilderId(prefix);
    }
    Object.values(item).forEach((child) => this.regenerateBuilderIds(child));
  }

  removeItem(path: string): void {
    const segments = path.split('.');
    const index = Number(segments.pop());
    const parentPath = segments.join('.');
    const next = structuredClone(this.workspaceData());
    const parent = this.getBuilderPath(next, parentPath);
    if (!Array.isArray(parent) || !Number.isInteger(index)) return;
    parent.splice(index, 1);
    this.workspaceData.set(next);
    this.setSelection(null);
    this.markChanged();
  }

  moveSelection(delta: -1 | 1): void {
    const selection = this.selected();
    if (!selection) return;
    const segments = selection.path.split('.');
    const index = Number(segments.pop());
    const parentPath = segments.join('.');
    const next = structuredClone(this.workspaceData());
    const parent = this.getBuilderPath(next, parentPath);
    const newIndex = index + delta;
    if (!Array.isArray(parent) || newIndex < 0 || newIndex >= parent.length) return;
    moveItemInArray(parent, index, newIndex);
    this.workspaceData.set(next);
    this.markChanged();
    this.selectItem(parent[newIndex] as Record<string, unknown>, `${parentPath}.${newIndex}`, newIndex);
  }

  itemPath(parentPath: string, index: number): string {
    return `${parentPath}.${index}`;
  }

  childItems(item: Record<string, unknown>, key: 'sections' | 'components' | 'items'): Record<string, unknown>[] {
    const value = item[key];
    return Array.isArray(value) ? value as Record<string, unknown>[] : [];
  }

  itemsAt(path: string): Record<string, unknown>[] {
    const items = this.getBuilderPath(this.workspaceData(), path);
    return Array.isArray(items) ? items as Record<string, unknown>[] : [];
  }

  normalizeWorkspace(source: Record<string, unknown>): Record<string, unknown> {
    const metadata = this.metadata();
    if (!metadata) return structuredClone(source);
    const workspace = structuredClone(source);
    if (!Array.isArray(this.getBuilderPath(workspace, metadata.itemCollectionPath))) {
      this.setBuilderPath(workspace, metadata.itemCollectionPath, []);
    }
    for (const collection of metadata.auxiliaryCollections || []) {
      if (!Array.isArray(this.getBuilderPath(workspace, collection.path))) {
        this.setBuilderPath(workspace, collection.path, []);
      }
    }
    return workspace;
  }

  getBuilderPath(target: unknown, path: string): unknown {
    return this.tokenizePath(path).reduce<unknown>((current, key) => {
      if (current === null || current === undefined) return undefined;
      const value = current as Record<string, unknown>;
      const actualKey = Object.prototype.hasOwnProperty.call(value, key)
        ? key
        : Object.keys(value).find((candidate) => this.normalizeKey(candidate) === this.normalizeKey(key));
      return actualKey === undefined ? undefined : value[actualKey];
    }, target);
  }

  setBuilderPath(target: Record<string, unknown>, path: string, value: unknown): void {
    const segments = this.tokenizePath(path);
    let current: Record<string, unknown> = target;
    for (let index = 0; index < segments.length - 1; index++) {
      const key = this.resolveKey(current, segments[index]);
      const nextKey = segments[index + 1];
      const next = current[key];
      if (!next || typeof next !== 'object') {
        current[key] = /^\d+$/.test(nextKey) ? [] : {};
      }
      current = current[key] as Record<string, unknown>;
    }
    const finalKey = this.resolveKey(current, segments[segments.length - 1]);
    current[finalKey] = value;
  }

  private normalizeKey(value: string): string {
    return value.replace(/[-_\s]/g, '').toLowerCase();
  }

  private resolveKey(value: Record<string, unknown>, key: string): string {
    if (Object.prototype.hasOwnProperty.call(value, key)) return key;
    return Object.keys(value).find((candidate) => this.normalizeKey(candidate) === this.normalizeKey(key)) ?? key;
  }

  private tokenizePath(path: string): string[] {
    return path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
  }

  private createBuilderId(prefix: string): string {
    const suffix = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    return `${prefix}-${suffix}`;
  }

  private flattenItems(items: Record<string, unknown>[], path: string): Array<{ item: Record<string, unknown>; path: string }> {
    return items.flatMap((item, index) => {
      const itemPath = `${path}.${index}`;
      const nested = [
        ...this.flattenItems(this.childItems(item, 'items'), `${itemPath}.items`),
        ...this.flattenItems(this.childItems(item, 'sections'), `${itemPath}.sections`),
        ...this.flattenItems(this.childItems(item, 'components'), `${itemPath}.components`)
      ];
      return [{ item, path: itemPath }, ...nested];
    });
  }

  createItem(source: Record<string, unknown>, type: string): Record<string, unknown> {
    const item = structuredClone(source);
    item['code'] = this.createBuilderId(type);
    item['type'] ||= type;
    item['title'] ||= type.charAt(0).toUpperCase() + type.slice(1);
    return item;
  }

  validateWorkspace(): void {
    const metadata = this.metadata();
    if (!metadata) return;
    const value = this.workspaceData();
    const errors = this.validator.isObjectValid(value, metadata.validationSchema);
    this.validationErrors.set(errors);
    this.validationWarnings.set([]);
    if (errors.length === 0) {
      this.loadError.set('');
    } else {
      this.loadError.set(`Validation found ${errors.length} issue(s).`);
    }
  }

  hasValidationError(path: string): boolean {
    const selectedPath = this.selected()?.path;
    const fullPath = path.startsWith('$')
      ? path
      : `$.${[selectedPath, path].filter(Boolean).join('.')}`;
    const normalized = fullPath.replace(/\.(\d+)(?=\.|$)/g, '[$1]');
    return this.validationErrors().some((error) => error.path === normalized || error.path === fullPath);
  }

  validationErrorForPath(path: string): string {
    const selectedPath = this.selected()?.path;
    const fullPath = path.startsWith('$')
      ? path
      : `$.${[selectedPath, path].filter(Boolean).join('.')}`;
    const normalized = fullPath.replace(/\.(\d+)(?=\.|$)/g, '[$1]');
    return this.validationErrors().find((error) =>
      error.path === normalized || error.path === fullPath
    )?.message || '';
  }

  // ----- Validation and path helpers -----
  schemaRequired(path: string): boolean {
    let schema: Record<string, unknown> | undefined = this.metadata()?.validationSchema;
    for (const segment of this.schemaPathSegments(path)) {
      if (/^\d+$/.test(segment)) {
        schema = schema?.['items'] as Record<string, unknown> | undefined;
        continue;
      }
      const required = schema?.['required'];
      if (Array.isArray(required) && required.includes(segment)) return true;
      const properties = schema?.['properties'] as Record<string, Record<string, unknown>> | undefined;
      schema = properties?.[segment];
    }
    return false;
  }

  schemaMinLength(path: string): number | null {
    let schema: Record<string, unknown> | undefined = this.metadata()?.validationSchema;
    for (const segment of this.schemaPathSegments(path)) {
      if (/^\d+$/.test(segment)) {
        schema = schema?.['items'] as Record<string, unknown> | undefined;
      } else {
        const properties = schema?.['properties'] as Record<string, Record<string, unknown>> | undefined;
        schema = properties?.[segment];
      }
    }
    return typeof schema?.['minLength'] === 'number' ? schema['minLength'] as number : null;
  }

  private schemaPathSegments(path: string): string[] {
    return path.replace(/^\$\.?/, '').match(/[^.[\]]+|\[\d+\]/g)
      ?.map((segment) => segment.replace(/^\[|\]$/g, '')) || [];
  }

  addConfiguredItem(config: BuilderToolbarItem, dropTargetPath?: string): void {
    if (!this.workspaceValid()) {
      this.loadError.set('Resolve schema validation errors before adding items.');
      return;
    }

    const seed = config.value === undefined ? undefined : structuredClone(config.value);
    if (config.target && !(config.target === 'components' && config.control)) {
      this.insertConfiguredTarget(config, seed, dropTargetPath);
      return;
    }
    if (!config.control) return;

    const initial = seed && typeof seed === 'object' && !Array.isArray(seed)
      ? seed as Record<string, unknown>
      : {};
    const options = config.options && typeof config.options === 'object'
      ? structuredClone(config.options)
      : {};
    const instance: Record<string, unknown> = {
      control: config.control,
      ...initial,
      ...(seed !== undefined && (!seed || typeof seed !== 'object')
        ? { value: structuredClone(seed) }
        : {})
    };
    const initialOptions = initial['options'] && typeof initial['options'] === 'object'
      ? structuredClone(initial['options'] as Record<string, unknown>)
      : undefined;
    if (initialOptions || config.options) {
      instance['options'] = { ...(initialOptions ?? {}), ...options };
    }
    const targetPath = dropTargetPath || this.componentTargetPath();
    if (!targetPath) {
      this.loadError.set('Select a section or container before adding a component.');
      return;
    }
    this.insertConfiguredValue(targetPath, instance, true);
  }

  private insertConfiguredTarget(config: BuilderToolbarItem, seed: unknown, dropTargetPath?: string): void {
    const target = config.target!;
    if (target === 'meta') {
      if (!config.code || !seed || typeof seed !== 'object' || Array.isArray(seed)) {
        this.loadError.set('Metadata toolbar items require a code and object value.');
        return;
      }
      const next = structuredClone(this.workspaceData());
      const path = `meta.${config.code}`;
      if (this.getBuilderPath(next, path) !== undefined) {
        this.loadError.set(`The configured section "${path}" already exists.`);
        return;
      }
      this.setBuilderPath(next, path, structuredClone(seed));
      this.workspaceData.set(next);
      this.markChanged();
      const inserted = this.getBuilderPath(next, path);
      if (inserted && typeof inserted === 'object' && !Array.isArray(inserted)) {
        this.selectItem(inserted as Record<string, unknown>, path, -1);
      }
      return;
    }

    if (seed === undefined) {
      this.loadError.set(`The configured target "${target}" is missing its seed value.`);
      return;
    }
    const collectionPath = target === 'components'
      ? dropTargetPath || this.componentTargetPath()
      : target === 'sections'
        ? dropTargetPath || this.sectionTargetPath()
        : target;
    const collection = collectionPath ? this.getBuilderPath(this.workspaceData(), collectionPath) : undefined;
    const canCreateCollection = (target === 'components' || target === 'sections') && collection === undefined;
    if (!collectionPath || (!Array.isArray(collection) && !canCreateCollection)) {
      this.loadError.set(`The configured target "${target}" is not a valid item collection.`);
      return;
    }
    this.insertConfiguredValue(collectionPath, seed, target === 'components' || target === 'sections');
  }

  private insertConfiguredValue(path: string, value: unknown, createCollection = false): void {
    const next = structuredClone(this.workspaceData());
    let target = this.getBuilderPath(next, path);
    if (!Array.isArray(target) && createCollection && target === undefined) {
      this.setBuilderPath(next, path, []);
      target = this.getBuilderPath(next, path);
    }
    if (!Array.isArray(target)) {
      this.loadError.set(`The configured target "${path}" is not a valid item collection.`);
      return;
    }
    const inserted = structuredClone(value);
    target.push(inserted);
    this.workspaceData.set(next);
    this.markChanged();
    if (inserted && typeof inserted === 'object' && !Array.isArray(inserted)) {
      this.selectItem(inserted as Record<string, unknown>, `${path}.${target.length - 1}`, target.length - 1);
    }
  }

  componentTargetPath(): string | undefined {
    const selection = this.selected();
    if (selection) {
      const selectedItem = this.getBuilderPath(this.workspaceData(), selection.path);
      if (selectedItem && typeof selectedItem === 'object') {
        const item = selectedItem as Record<string, unknown>;
        if (Array.isArray(item['components'])) {
          return `${selection.path}.components`;
        }
      }
      const parentPath = selection.path.replace(/\.\d+$/, '');
      const parent = this.getBuilderPath(this.workspaceData(), parentPath);
      if (parent && typeof parent === 'object' && Array.isArray((parent as Record<string, unknown>)['components'])) {
        return `${parentPath}.components`;
      }
      const selectedCollectionPath = selection.path.replace(/\.\d+$/, '');
      if (selectedCollectionPath.endsWith('.sections') || selectedCollectionPath.endsWith('.components')) {
        const collection = this.getBuilderPath(this.workspaceData(), selectedCollectionPath);
        if (Array.isArray(collection)) return `${selection.path}.components`;
      }
    }
    const configured = this.metadata()?.canvasSections?.find((section) =>
      section.path.endsWith('.components') && Array.isArray(this.getBuilderPath(this.workspaceData(), section.path)));
    if (configured) return configured.path;
    return undefined;
  }

  private sectionTargetPath(): string | undefined {
    const selection = this.selected();
    if (selection) {
      const item = this.getBuilderPath(this.workspaceData(), selection.path);
      if (item && typeof item === 'object' && Array.isArray((item as Record<string, unknown>)['sections'])) {
        return `${selection.path}.sections`;
      }
      const collectionPath = selection.path.replace(/\.\d+$/, '');
      const collection = this.getBuilderPath(this.workspaceData(), collectionPath);
      if (collectionPath.endsWith('.sections') && Array.isArray(collection)) return collectionPath;
    }
    const configured = this.metadata()?.canvasSections?.find((section) =>
      section.path.endsWith('.sections') && Array.isArray(this.getBuilderPath(this.workspaceData(), section.path)));
    if (configured) return configured.path;
    const configuredPath = this.metadata()?.canvasSections?.find((section) => section.path.endsWith('.sections'));
    if (configuredPath) return configuredPath.path;
    return undefined;
  }

  // ----- Persistence flow -----
  async saveDraft(): Promise<void> {
    const metadata = this.metadata();
    if (!metadata) return;
    this.validateWorkspace();
    if (!this.workspaceValid()) {
      this.loadError.set('Not saved, fix the errors first.');
      return;
    }
    const key = this.draftKey(this.pageCode() || String(this.workspaceData()['code'] || 'new'));
    try {
      if (metadata.persistence) {
        const id = this.getBuilderPath(this.workspaceData(), metadata.persistence.idPath || 'id');
        if (typeof id !== 'string' && typeof id !== 'number') {
          throw new Error(`The document is missing its "${metadata.persistence.idPath || 'id'}" value; it cannot be saved.`);
        }
        await this.dataService.update(id, structuredClone(this.workspaceData()), {
          service: metadata.persistence.service,
          collection: metadata.persistence.collection
        });
      }
      this.cache.set(key, structuredClone(this.workspaceData()));
      this.lastSavedAt.set(new Date().toLocaleTimeString());
      this.saved.set(true);
      this.dirty.set(false);
      this.savedWorkspace.set(structuredClone(this.workspaceData()));
      this.loadError.set(metadata.persistence ? 'Saved.' : 'Saved as a local draft.');
      this.syncBuilderContextActions();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.loadError.set(`Unable to save: ${message}`);
      this.builderLogger.error('Unable to save builder workspace', error);
    }
  }

  private syncBuilderContextActions(): void {
    if (!this.metadata()) return;

    if (!this.hasPreviousContextActions) {
      this.previousContextActions = this.builderContext.actions();
      this.hasPreviousContextActions = true;
    }

    const actions = (this.previousContextActions || []).map((action) => ({ ...action }));
    actions.push(
      new Action({
        code: 'builder-save',
        title: 'Save',
        icon: 'save',
        view: 'button',
        class: 'context-menu-action default primary',
        isDisabled: !this.dirty() || !this.workspaceValid(),
        display: this.dirty() && this.workspaceValid() ? undefined : 'disabled',
        event: () => this.dirty() && this.workspaceValid() && void this.saveDraft()
      }),
      new Action({
        code: 'builder-validate',
        title: 'Validate',
        icon: 'fact_check',
        view: 'button',
        class: 'context-menu-action default primary',
        event: () => this.validateWorkspace()
      }),
      new Action({
        code: 'builder-cancel',
        title: 'Cancel',
        icon: 'close',
        view: 'button',
        class: 'context-menu-action default primary',
        event: () => this.closeBuilder()
      })
    );
    this.installedContextActions = actions;
    this.builderContext.actions.set(actions);
  }

  closeBuilder(): void {
    const segments = ['area', 'collection', 'code']
      .map((key) => this.routeParam(key))
      .filter((value): value is string => !!value);
    this.builderRouter.navigate(segments.length ? ['/', ...segments] : ['/']);
  }

  rememberWorkspaceAsSaved(): void {
    this.savedWorkspace.set(structuredClone(this.workspaceData()));
  }

  trackByCode(index: number, item: Record<string, unknown>): string | number {
    return String(item['code'] || index);
  }

  isTool(value: unknown): value is BuilderToolMetadata {
    return !!value && typeof value === 'object' && 'defaultProperties' in value;
  }

  addToolFromClick(tool: BuilderToolMetadata): void {
    if (this.toolDragInProgress()) return;
    this.addTool(tool);
  }

  startToolDrag(tool: BuilderToolbarItem): void {
    this.activeTool.set(tool);
    this.toolDragInProgress.set(true);
  }

  canDropToolAt(tool: BuilderToolbarItem, targetPath: string): boolean {
    const targets = tool.targets ?? (tool.target ? [tool.target] : []);
    if (tool.target === 'meta') return false;
    if (targets.length) return targets.some((target) => target === targetPath || targetPath.endsWith(`.${target}`));
    return !targets.length || targets.some((target) => {
      if (target === targetPath || targetPath.endsWith(`.${target}`)) return true;
      return this.metadata()?.canvasSections?.some((section) =>
        section.path === targetPath && [section.code, section.target, ...(section.targets || [])].includes(target));
    });
  }

  isDropTarget(targetPath: string): boolean {
    const tool = this.activeTool();
    return this.toolDragInProgress() && !!tool && this.canDropToolAt(tool, targetPath);
  }

  dropListId(path: string): string {
    return `builder-drop-${path.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  }

  clearToolDrag(): void {
    this.activeTool.set(null);
    setTimeout(() => this.toolDragInProgress.set(false), 0);
  }

  private draftKey(code: string): string {
    return `builder-draft:${code}`;
  }

  private routeParam(key: string): string | null {
    let current: ActivatedRoute | null = this.route;
    while (current) {
      const value = current.snapshot.paramMap.get(key);
      if (value) return value;
      current = current.parent;
    }
    return null;
  }

  private builderUrl(): string {
    const segments = ['area', 'collection', 'code']
      .map((key) => this.routeParam(key))
      .filter((value): value is string => !!value);
    return segments.length ? `/${segments.join('/')}/builder` : '/';
  }

  private markChanged(): void {
    this.dirty.set(true);
    this.saved.set(false);
    this.loadError.set('');
    const metadata = this.metadata();
    if (metadata) {
      const errors = this.validator.isObjectValid(this.workspaceData(), metadata.validationSchema);
      this.validationErrors.set(errors);
      this.validationWarnings.set([]);
      if (errors.length) this.loadError.set(`Validation found ${errors.length} issue(s).`);
    }
    this.syncBuilderContextActions();
  }
}
