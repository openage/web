import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, computed, inject, OnDestroy, signal, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Logger } from '../../lib/oa/core/models';
import { Action } from '../../lib/oa/core/models/action.model';
import { Link } from '../../lib/oa/core/models/link.model';
import { LayoutComponent } from '../../lib/oa/core/components/layout/layout.component';
import { CacheService } from '../../lib/oa/core/services/cache.service';
import { ContextService } from '../../lib/oa/core/services/context.service';
import { ValidationService } from '../../lib/oa/core/services/validation.service';
import { DynamicPageComponent } from '../dynamic-page/dynamic-page.component';
import { BuilderController } from '../../lib/oa/ux/builder/builder-controller.model';
import { BuilderMetadata, BuilderSelection, BuilderTabMetadata, BuilderToolbarItem, BuilderToolMetadata, BuilderValidationError } from './builder-metadata.model';
import { ToolboxComponent } from '../../lib/oa/ux/toolbox/toolbox.component';
import { PropertiesComponent } from '../../lib/oa/ux/properties/properties.component';
import { CanvasComponent } from '../../lib/oa/ux/canvas/canvas.component';
import { IconComponent } from '../../lib/oa/ux/icon/icon.component';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-builder-page',
  standalone: true,
  imports: [
    LayoutComponent,
    ToolboxComponent,
    PropertiesComponent,
    CanvasComponent,
    IconComponent
  ],
  templateUrl: './builder-page.component.html',
  styleUrl: './builder-page.component.scss'
})
export class BuilderPageComponent extends DynamicPageComponent implements BuilderController, AfterViewInit, OnDestroy {
  private readonly builderRouter = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly cache = inject(CacheService);
  private readonly validator = inject(ValidationService);
  readonly builderContext = inject(ContextService);
  readonly appSource = this.builderContext.appSource;
  private readonly builderLogger = new Logger(BuilderPageComponent);
  private cachedBuilderSource?: object;
  private cachedBuilderComponents?: any[];
  private cachedBuilderLayout?: unknown;
  private cachedBuilderMetadata?: BuilderMetadata;
  private routeBuilderMetadata?: BuilderMetadata;
  private previousContextActions?: Action[];
  private installedContextActions?: Action[];
  private hasPreviousContextActions = false;
  @ViewChild('toolbarTemplate') toolbarTemplate?: TemplateRef<unknown>;
  @ViewChild('propertiesTemplate') propertiesTemplate?: TemplateRef<unknown>;
  @ViewChild('canvasTemplate') canvasTemplate?: TemplateRef<unknown>;

  get builderController(): BuilderController {
    return this;
  }

  get propertiesData(): Record<string, unknown> {
    return this.selected()?.item ?? this.workspaceData();
  }

  get propertiesType(): string {
    const selection = this.selected();
    if (!selection) return 'workspace';
    if (/(?:^|\.)sections\.\d+(?:\.|$)/.test(selection.path)) {
      return String(selection.item['code'] || selection.item['type'] || selection.item['control'] || 'section');
    }
    return selection.type;
  }

  private setSelection(selection: BuilderSelection | null): void {
    this.selected.set(selection);
  }

  propertiesOptions(options: Record<string, unknown>): Record<string, unknown> {
    return {
      ...options,
      schema: options['schema'] ?? this.builderMetadata?.propertySchemas ?? {},
      validationSchema: this.builderMetadata?.validationSchema ?? {},
      validationErrors: this.validationErrors(),
      selectionPath: this.selected()?.path || ''
    };
  }

  collapsiblePanelOptions(options: Record<string, unknown>): Record<string, unknown> {
    return { ...options, collapsible: options['collapsible'] !== false };
  }

  onPropertiesChange(data: Record<string, unknown>): void {
    const next = structuredClone(this.workspaceData());
    const selection = this.selected();
    if (selection) {
      this.setBuilderPath(next, selection.path, structuredClone(data));
      const updated = this.getBuilderPath(next, selection.path);
      if (updated && typeof updated === 'object' && !Array.isArray(updated)) {
        this.setSelection({ ...selection, item: updated as Record<string, unknown> });
      }
    } else {
      this.workspaceData.set(structuredClone(data));
    }
    if (selection) this.workspaceData.set(next);
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
    if (metadata.workspaceType === 'application') {
      const source = this.getBuilderPath(workspace, 'meta.src');
      this.builderContext.appSource.set(typeof source === 'string' && source.trim() ? source.trim() : undefined);
    }
    this.setSelection(null);
    this.markChanged();
    this.propertyError.set('');
  }

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
    const toolbarOptions = optionsFor(['toolbar']);
    const propertiesOptions = optionsFor(['properties']);
    const canvasOptions = optionsFor(['oa-page-canvas', 'application-canvas', 'oa-workflow-canvas']);
    const builder = metadata as BuilderMetadata;
    const control = configuredComponents.find((item: any) =>
      ['oa-page-canvas', 'application-canvas', 'oa-workflow-canvas'].includes(item.control)
    );
    const configuredType = canvasOptions?.['type'];
    const workspaceType = builder.workspaceType || (typeof configuredType === 'string' ? configuredType : undefined) || ({
      'application-canvas': 'application',
      'oa-workflow-canvas': 'workflow',
      'oa-page-canvas': 'page'
    } as Record<string, string>)[control?.control] || this.routeParam('workspaceType') || 'page';
    const pageData = pageMetadata?.['data'];
    const defaultDataEntry = Array.isArray(pageData)
      ? pageData.find((item) => item && typeof item === 'object' && 'data' in item) as { data?: unknown } | undefined
      : undefined;
    const defaultData = builder.defaultData ||
      (defaultDataEntry?.data && typeof defaultDataEntry.data === 'object'
        ? defaultDataEntry.data as Record<string, unknown>
        : workspaceType === 'application'
          ? { code: 'new-application', title: 'New Application', services: [], navs: [] }
          : {});
    const auxiliaryCollections = builder.auxiliaryCollections || (
      workspaceType === 'application'
        ? [{ path: 'services', title: 'Services' }]
        : workspaceType === 'page'
          ? [{ path: 'meta.data', title: 'Data sources' }, { path: 'meta.actions', title: 'Actions' }]
          : []
    );

    this.cachedBuilderSource = metadata;
    this.cachedBuilderComponents = this.components;
    this.cachedBuilderLayout = this.layout;
    this.cachedBuilderMetadata = {
      ...builder,
      workspaceType,
      title: builder.title || this.page?.title || 'Builder',
      icon: builder.icon || (typeof canvasOptions?.['icon'] === 'string'
        ? canvasOptions['icon']
        : this.page?.icon || 'dashboard'),
      itemCollectionPath: builder.itemCollectionPath || (workspaceType === 'application'
        ? 'navs'
        : workspaceType === 'page'
          ? 'meta.layout.sections'
          : 'items'),
      itemLabel: builder.itemLabel || (workspaceType === 'application' ? 'Navigation items' : 'Items'),
      auxiliaryCollections,
      defaultData,
      toolbox: {
        groups: (toolbarOptions?.['groups'] as BuilderMetadata['toolbox']['groups'] | undefined) ?? builder.toolbox?.groups ?? []
      },
      propertySchemas: (propertiesOptions?.['schema'] as BuilderMetadata['propertySchemas'] | undefined) ?? builder.propertySchemas ?? {},
      validationSchema: (canvasOptions?.['schema'] as BuilderMetadata['validationSchema'] | undefined) ?? builder.validationSchema ?? {},
      actions: this.workspaceActions(builder.actions),
      canvasSections: Array.isArray(canvasOptions?.['sections'])
        ? canvasOptions['sections'] as BuilderMetadata['canvasSections']
        : builder.canvasSections
    };
    return this.cachedBuilderMetadata;
  }

  private workspaceActions(configured: BuilderTabMetadata[] | undefined): BuilderTabMetadata[] {
    const entries = (configured || []).flatMap((tab) =>
      tab.type === 'toggle' && Array.isArray(tab.items) ? tab.items : [tab]
    );
    const aliases: Record<string, BuilderTabMetadata['workspaceMode']> = {
      viewer: 'viewer', summary: 'viewer', overview: 'viewer',
      editor: 'editor', visual: 'editor', wysiwyg: 'editor', structure: 'editor',
      code: 'code', raw: 'code', json: 'code'
    };
    const byMode = new Map<string, BuilderTabMetadata>();
    for (const entry of entries) {
      const mode = entry.workspaceMode || aliases[entry.code];
      if (!mode) continue;
      const canonicalMode = aliases[mode] || mode;
      if (canonicalMode === 'viewer' || canonicalMode === 'editor' || canonicalMode === 'code') {
        byMode.set(canonicalMode, { ...entry, workspaceMode: canonicalMode });
      }
    }
    const defaults: BuilderTabMetadata[] = [
      { code: 'viewer', title: 'Viewer', icon: 'visibility', sections: [], workspaceMode: 'viewer' },
      { code: 'editor', title: 'Editor', icon: 'edit', sections: [], workspaceMode: 'editor' },
      { code: 'code', title: 'Code', icon: 'code', sections: [], workspaceMode: 'code' }
    ];
    return defaults.map((fallback) => {
      const match = byMode.get(fallback.workspaceMode!);
      return match ? { ...fallback, ...match, code: fallback.workspaceMode! } : fallback;
    });
  }

  get builderType(): string {
    if (this.builderMetadata?.workspaceType) return this.builderMetadata.workspaceType;
    const canvas = this.builderConfiguredComponents.find((component: any) =>
      ['oa-page-canvas', 'application-canvas', 'oa-workflow-canvas'].includes(component.control)
    );
    return canvas?.options?.type || ({
      'application-canvas': 'application',
      'oa-workflow-canvas': 'workflow',
      'oa-page-canvas': 'page'
    } as Record<string, string>)[canvas?.control] || 'page';
  }

  private get builderConfiguredComponents(): any[] {
    const sectionComponents = Array.isArray(this.layout?.sections)
      ? this.layout.sections.flatMap((section: any) =>
        Array.isArray(section.components) ? section.components : []
      )
      : [];
    return [...(Array.isArray(this.components) ? this.components : []), ...sectionComponents];
  }

  override ngAfterViewInit(): void {
    this.addTemplate('toolbar', this.toolbarTemplate);
    this.addTemplate('properties', this.propertiesTemplate);
    this.addTemplate('oa-page-canvas', this.canvasTemplate);
    this.addTemplate('application-canvas', this.canvasTemplate);
    this.addTemplate('oa-workflow-canvas', this.canvasTemplate);
    super.ngAfterViewInit();
    void this.initialize();
  }
  readonly workspaceType = signal(this.route.snapshot.paramMap.get('workspaceType') || 'page');
  readonly pageCode = signal(this.routeParam('code') || '');
  readonly metadata = signal<BuilderMetadata | null>(null);
  readonly workspaceData = signal<Record<string, unknown>>({});
  readonly selected = signal<BuilderSelection | null>(null);
  readonly activeTab = signal('viewer');
  readonly validationErrors = signal<BuilderValidationError[]>([]);
  readonly workspaceValid = computed(() => this.validationErrors().length === 0);
  readonly loading = signal(false);
  readonly dirty = signal(false);
  readonly saved = signal(false);
  readonly loadError = signal('');
  readonly propertyError = signal('');
  readonly toolSearch = signal('');
  readonly toolDragInProgress = signal(false);
  readonly activeTool = signal<BuilderToolbarItem | null>(null);
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
  readonly darkMode = signal(false);
  readonly toolboxCollapsed = signal(false);
  readonly propertiesCollapsed = signal(false);
  readonly sourceEditorOpen = signal(false);
  readonly sourceText = signal('');
  readonly sourceError = signal('');
  readonly lastSavedAt = signal('');

  readonly filteredToolGroups = computed(() => {
    const metadata = this.metadata();
    const query = this.toolSearch().trim().toLowerCase();
    if (!metadata) return [];
    const allowedControls = this.currentTab()?.workspaceMode === 'editor'
      ? this.currentTab()?.allowedControls
      : undefined;
    return metadata.toolbox.groups
      .map((group) => ({
        ...group,
        items: group.items.filter((tool) =>
          (!allowedControls || allowedControls.includes(tool.type)) &&
          (!query || `${tool.title} ${tool.type} ${group.title}`.toLowerCase().includes(query))
        )
      }))
      .filter((group) => group.items.length > 0);
  });

  readonly currentTab = computed(() =>
    this.metadata()?.actions.find((tab) => tab.code === this.activeTab()) ?? null
  );

  readonly rootItems = computed(() => {
    const path = this.metadata()?.itemCollectionPath;
    const items = path ? this.getBuilderPath(this.workspaceData(), path) : undefined;
    return Array.isArray(items) ? items as Record<string, unknown>[] : [];
  });

  readonly workspaceTitle = computed(() => {
    const data = this.workspaceData();
    return String(data['title'] || data['name'] || this.metadata()?.title || 'Workspace');
  });

  readonly rawJson = computed(() => JSON.stringify(this.workspaceData(), null, 2));

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

  private fragmentSubscription?: { unsubscribe(): void };
  constructor() {
    super();
    this.fragmentSubscription = this.route.fragment.subscribe((fragment) => {
      const tabCode = fragment || this.activeTab();
      if (this.metadata()?.actions.some((tab) => tab.code === tabCode)) {
        if (this.activeTab() !== tabCode) {
          this.setSelection(null);
          this.propertyError.set('');
        }
        this.activeTab.set(tabCode);
        this.syncBuilderContextActions();
      }
    });
  }

  override ngOnDestroy(): void {
    this.fragmentSubscription?.unsubscribe();
    if (this.installedContextActions && this.builderContext.actions() === this.installedContextActions) {
      this.builderContext.actions.set(this.previousContextActions || []);
    }
    super.ngOnDestroy();
  }

  async initialize(): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');
    try {
      const type = this.routeParam('workspaceType') || this.builderType || this.workspaceType();
      this.workspaceType.set(type);
      this.pageCode.set(this.routeParam('code') || '');
      this.routeBuilderMetadata =
        this.route.snapshot.data['builderMetadata'] as BuilderMetadata | undefined ||
        this.builderContext.getPageMeta('builder') as BuilderMetadata | undefined;
      const metadataUrl = this.route.snapshot.data['builderMetadataUrl'] as string | undefined;
      if (metadataUrl) {
        const loaded = await firstValueFrom(this.http.get<BuilderMetadata>(metadataUrl));
        if (loaded.workspaceType !== type) {
          throw new Error(`Metadata at "${metadataUrl}" is for "${loaded.workspaceType}", not "${type}".`);
        }
        this.routeBuilderMetadata = loaded;
        this.cachedBuilderSource = undefined;
      }
      const metadata = this.builderMetadata;
      if (!metadata) throw new Error(`No builder metadata is available for workspace type "${type}".`);
      this.validateBuilderMetadata(metadata);
      this.metadata.set(metadata);
      const themePreference = this.cache.get(this.builderThemePreferenceKey());
      this.darkMode.set(
        typeof themePreference?.darkMode === 'boolean'
          ? themePreference.darkMode
          : this.builderContext.theme()?.type === 'dark'
      );
      const tab = this.route.snapshot.fragment;
      if (tab && metadata.actions.some((candidate) => candidate.code === tab)) {
        this.activeTab.set(tab);
      } else {
        this.activeTab.set(metadata.actions.find((candidate) => candidate.workspaceMode === 'viewer')?.code || 'viewer');
      }

      this.setSelection(null);
      this.validationErrors.set([]);
      this.dirty.set(false);
      this.toolboxCollapsed.set(false);
      this.propertiesCollapsed.set(false);
      this.syncBuilderContextActions();
      this.builderContext.breadcrumbs.set(type === 'application'
        ? [
          new Link({ title: 'Console', url: '/console' }),
          new Link({ title: 'Applications', url: '/console/applications' }),
          new Link({ title: this.pageCode() || metadata.title, url: this.builderUrl() })
        ]
        : [
          new Link({ title: 'Builder', url: this.builderUrl() }),
          new Link({ title: metadata.title }),
          ...(this.pageCode() ? [new Link({ title: this.pageCode() })] : [])
        ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.loadError.set(message);
      this.builderLogger.error('Unable to initialize builder workspace', error);
      this.loading.set(false);
    }
  }

  private validateBuilderMetadata(metadata: BuilderMetadata): void {
    if (!metadata || typeof metadata !== 'object') throw new Error('Builder metadata must be an object.');
    if (!metadata.workspaceType?.trim()) throw new Error('Builder metadata must define a workspaceType.');
    if (!metadata.title?.trim() || !metadata.icon?.trim() || !metadata.itemCollectionPath?.trim()) {
      throw new Error(`Builder metadata for "${metadata.workspaceType}" must include title, icon, and itemCollectionPath.`);
    }
    if (!metadata.defaultData || typeof metadata.defaultData !== 'object' ||
      !metadata.validationSchema || typeof metadata.validationSchema !== 'object' ||
      !metadata.propertySchemas || typeof metadata.propertySchemas !== 'object') {
      throw new Error(`Builder metadata for "${metadata.workspaceType}" must include defaultData, propertySchemas, and validationSchema.`);
    }
    if (!Array.isArray(metadata.actions) || metadata.actions.some((tab) =>
      !tab.code?.trim() || !tab.title?.trim() || !tab.icon?.trim() || !Array.isArray(tab.sections)
    )) {
      throw new Error(`Builder metadata for "${metadata.workspaceType}" must define valid actions and sections.`);
    }
    if (!metadata.toolbox || !Array.isArray(metadata.toolbox.groups) ||
      metadata.toolbox.groups.some((group) => !group.code?.trim() || !group.title?.trim() || !Array.isArray(group.items))) {
      throw new Error(`Builder metadata for "${metadata.workspaceType}" must define valid toolbox groups.`);
    }
  }

  selectTab(code: string): void {
    const normalizedCode = this.metadata()?.actions.some((tab) => tab.code === code)
      ? code
      : ({ summary: 'viewer', overview: 'viewer', visual: 'editor', wysiwyg: 'editor', structure: 'editor', raw: 'code', json: 'code' } as Record<string, string>)[code] || code;
    if (this.activeTab() !== normalizedCode) {
      this.setSelection(null);
      this.propertyError.set('');
    }
    this.activeTab.set(normalizedCode);
    this.syncBuilderContextActions();
    void this.builderRouter.navigate([], {
      relativeTo: this.route,
      fragment: normalizedCode,
      queryParamsHandling: 'preserve',
      replaceUrl: true
    }).then(() => this.syncBuilderContextActions());
  }

  selectWorkspace(): void {
    this.setSelection(null);
    this.propertyError.set('');
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
    if (path === 'meta.src') {
      this.builderContext.appSource.set(typeof value === 'string' && value.trim() ? value.trim() : undefined);
    }
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
    const isApplicationNav = this.workspaceType() === 'application' &&
      path.startsWith(`${this.metadata()?.itemCollectionPath || 'navs'}.`);
    const type = String(isLayoutSection ? 'section' : collection
      ? (collection.path.endsWith('services') ? 'service' : item['type'] || path.split('.').at(-2) || 'item')
      : isApplicationNav ? 'application-nav' : item['type'] || item['control'] || item['code'] || path.split('.').at(-1) || 'item');
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

  addTool(tool: BuilderToolMetadata, targetPath?: string): void {
    const metadata = this.metadata();
    if (!metadata) return;
    if (!this.workspaceValid()) {
      this.loadError.set('Resolve schema validation errors before adding items.');
      return;
    }
    if (!tool.allowedDropTargets.includes(metadata.workspaceType) && !tool.allowedDropTargets.includes('canvas')) {
      this.loadError.set(`${tool.title} cannot be added to a ${metadata.workspaceType} workspace.`);
      return;
    }

    const auxiliary = metadata.auxiliaryCollections || [];
    const auxiliaryPath = tool.type === 'data-source'
      ? auxiliary.find((collection) => collection.path.endsWith('.data'))?.path
      : tool.type === 'action'
        ? auxiliary.find((collection) => collection.path.endsWith('.actions'))?.path
        : tool.type === 'service'
          ? auxiliary.find((collection) => collection.path.endsWith('.services'))?.path
          : undefined;
    const droppingAtRoot = targetPath === metadata.itemCollectionPath;
    let path = droppingAtRoot && auxiliaryPath
      ? auxiliaryPath
      : targetPath || auxiliaryPath || metadata.itemCollectionPath;
    if (metadata.workspaceType === 'page' && !targetPath && !auxiliaryPath && path === metadata.itemCollectionPath && tool.type !== 'section') {
      const selection = this.selected();
      if (selection?.type === 'section') {
        path = `${selection.path}.components`;
      } else {
        const section = this.createItem({
          type: 'section',
          title: 'New Section',
          components: [],
          sections: [],
          container: { header: { title: 'New Section' }, body: {} }
        }, 'section');
        const next = structuredClone(this.workspaceData());
        const sections = this.getBuilderPath(next, metadata.itemCollectionPath) as Record<string, unknown>[];
        sections.push(section);
        const sectionPath = `${metadata.itemCollectionPath}.${sections.length - 1}`;
        this.setBuilderPath(next, `${sectionPath}.components`, [this.createItem(tool.defaultProperties, tool.type)]);
        this.workspaceData.set(next);
        this.markChanged();
        this.selectItem(section, sectionPath, sections.length - 1);
        return;
      }
    }

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
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.refreshAfterStructureChange(targetPath, event.currentIndex);
      return;
    }

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

    const previous = event.previousContainer.data;
    const current = event.container.data;
    if (!Array.isArray(previous) || !Array.isArray(current)) return;
    transferArrayItem(previous, current, event.previousIndex, event.currentIndex);
    this.workspaceData.set(structuredClone(this.workspaceData()));
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

  childItems(item: Record<string, unknown>, key: 'sections' | 'components'): Record<string, unknown>[] {
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
    if (metadata.workspaceType === 'page') {
      const meta = (workspace['meta'] && typeof workspace['meta'] === 'object' ? workspace['meta'] : {}) as Record<string, unknown>;
      workspace['meta'] = meta;
      const layout = (meta['layout'] && typeof meta['layout'] === 'object' ? meta['layout'] : {}) as Record<string, unknown>;
      meta['layout'] = layout;
      layout['type'] ||= 'workspace';
      if (!Array.isArray(layout['sections'])) layout['sections'] = [];
      if (!Array.isArray(meta['data'])) meta['data'] = [];
      if (!Array.isArray(meta['actions'])) meta['actions'] = [];
    }
    if (metadata.workspaceType === 'application') {
      const existingMeta = workspace['meta'];
      const meta = existingMeta && typeof existingMeta === 'object' && !Array.isArray(existingMeta)
        ? existingMeta as Record<string, unknown>
        : {};
      workspace['meta'] = meta;
      for (const [key, fallback] of [
        ['layout', { type: 'workspace', sections: [] }],
        ['header', { enabled: true }],
        ['footer', { enabled: true }]
      ] as const) {
        const value = meta[key];
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
          meta[key] = structuredClone(fallback);
        }
      }
      if (!Array.isArray(workspace['styles'])) workspace['styles'] = [];
    }
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
    const errors = this.validator.validate(this.workspaceData(), metadata.validationSchema);
    this.validationErrors.set(errors);
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
    if (config.target) {
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
    if (!collectionPath || !Array.isArray(this.getBuilderPath(this.workspaceData(), collectionPath))) {
      this.loadError.set(`The configured target "${target}" is not a valid item collection.`);
      return;
    }
    this.insertConfiguredValue(collectionPath, seed, target === 'components');
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

  private sectionTargetPath(): string {
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
    return 'meta.layout.sections';
  }

  async saveDraft(): Promise<void> {
    const metadata = this.metadata();
    if (!metadata) return;
    this.validateWorkspace();
    if (!this.workspaceValid()) return;
    const key = this.draftKey(metadata.workspaceType, this.pageCode() || String(this.workspaceData()['code'] || 'new'));
    try {
      this.cache.set(key, structuredClone(this.workspaceData()));
      this.lastSavedAt.set(new Date().toLocaleTimeString());
      this.saved.set(true);
      this.dirty.set(false);
      this.loadError.set('Saved as a local draft. Server publishing is not configured.');
      this.syncBuilderContextActions();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.loadError.set(`Unable to save local draft: ${message}`);
      this.builderLogger.error('Unable to save local builder draft', error);
    }
  }

  openSourceEditor(): void {
    this.sourceText.set(JSON.stringify(this.workspaceData(), null, 2));
    this.sourceError.set('');
    this.sourceEditorOpen.set(true);
  }

  closeSourceEditor(): void {
    this.sourceEditorOpen.set(false);
  }

  updateSourceText(event: Event): void {
    this.sourceText.set((event.target as HTMLTextAreaElement).value);
  }

  applySourceChanges(): void {
    const metadata = this.metadata();
    if (!metadata) return;
    try {
      const parsed = JSON.parse(this.sourceText()) as Record<string, unknown>;
      const validation = this.validator.validate(parsed, metadata.validationSchema);
      if (validation.length) {
        this.validationErrors.set(validation);
        this.sourceError.set(`Cannot apply JSON: ${validation.length} schema issue(s) found.`);
        return;
      }
      this.workspaceData.set(this.normalizeWorkspace(parsed));
      if (metadata.workspaceType === 'application') {
        const source = this.getBuilderPath(this.workspaceData(), 'meta.src');
        this.builderContext.appSource.set(typeof source === 'string' && source.trim() ? source.trim() : undefined);
      }
      this.validationErrors.set([]);
      this.setSelection(null);
      this.markChanged();
      this.sourceEditorOpen.set(false);
    } catch (error) {
      this.sourceError.set(error instanceof Error ? `Invalid JSON: ${error.message}` : 'Invalid JSON.');
    }
  }

  toggleTheme(): void {
    this.darkMode.update((value) => !value);
    this.cache.set(this.builderThemePreferenceKey(), { darkMode: this.darkMode() });
    const theme = this.builderContext.theme() || {};
    const updated = { ...theme, type: this.darkMode() ? 'dark' : 'light' };
    this.builderContext.theme.set(updated);
    this.cache.update('theme', updated);
    this.syncBuilderContextActions();
  }

  toggleToolbox(): void {
    this.toolboxCollapsed.update((collapsed) => !collapsed);
    this.syncBuilderContextActions();
  }

  toggleProperties(): void {
    this.propertiesCollapsed.update((collapsed) => !collapsed);
    this.syncBuilderContextActions();
  }

  builderPanelsHidden(): boolean {
    return this.currentTab()?.workspaceMode !== 'editor';
  }

  private syncBuilderContextActions(): void {
    if (this.workspaceType() !== 'application' || !this.metadata()) return;

    if (!this.hasPreviousContextActions) {
      this.previousContextActions = this.builderContext.actions();
      this.hasPreviousContextActions = true;
    }

    const modes = this.metadata()?.actions.map((tab) => ({ code: tab.code, title: tab.title, icon: tab.icon })) || [];
    const activeMode = modes.find((mode) => mode.code === this.activeTab()) || modes[0];
    const actions = (this.previousContextActions || []).map((action) => ({ ...action }));
    const configuredViewAction = actions.find((action) =>
      action.code === 'view' && (action.type === 'toggle' || action.view === 'toggle')
    );
    if (configuredViewAction && activeMode) {
      configuredViewAction.value = activeMode.code;
      configuredViewAction.event = (value: string) => this.selectTab(value);
    }
    actions.push(
      new Action({
        code: 'application-builder-save',
        title: 'Save',
        icon: 'save',
        view: 'button',
        class: 'context-menu-action context-menu-action-primary',
        isDisabled: !this.dirty() || !this.workspaceValid(),
        display: this.dirty() && this.workspaceValid() ? undefined : 'disabled',
        event: () => this.dirty() && this.workspaceValid() && void this.saveDraft()
      }),
      new Action({
        code: 'application-builder-validate',
        title: 'Validate',
        icon: 'fact_check',
        view: 'button',
        class: 'context-menu-action context-menu-action-default',
        event: () => this.validateWorkspace()
      }),
      new Action({
        code: 'application-builder-cancel',
        title: 'Cancel',
        icon: 'close',
        view: 'button',
        class: 'context-menu-action context-menu-action-default',
        event: () => this.closeBuilder()
      })
    );
    this.installedContextActions = actions;
    this.builderContext.actions.set(actions);
  }

  private builderThemePreferenceKey(): string {
    return `builder-theme:${this.workspaceType()}:${this.pageCode() || 'new'}`;
  }

  closeBuilder(): void {
    const segments = ['area', 'collection', 'code']
      .map((key) => this.routeParam(key))
      .filter((value): value is string => !!value);
    this.builderRouter.navigate(segments.length ? ['/', ...segments] : ['/']);
  }

  trackByCode(index: number, item: Record<string, unknown>): string | number {
    return String(item['code'] || index);
  }

  isTool(value: unknown): value is BuilderToolMetadata {
    return !!value && typeof value === 'object' && 'allowedDropTargets' in value && 'defaultProperties' in value;
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
    const allowed = (tool as Partial<BuilderToolMetadata>).allowedDropTargets;
    return !Array.isArray(allowed) || allowed.includes(this.workspaceType()) || allowed.includes('canvas');
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

  private draftKey(type: string, code: string): string {
    return `builder-draft:${type}:${code}`;
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
      const errors = this.validator.validate(this.workspaceData(), metadata.validationSchema);
      this.validationErrors.set(errors);
      if (errors.length) this.loadError.set(`Validation found ${errors.length} issue(s).`);
    }
    this.syncBuilderContextActions();
  }
}
