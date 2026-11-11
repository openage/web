import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EMPTY, of } from 'rxjs';
import { vi } from 'vitest';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BuilderPageComponent } from './builder-page.component';
import { CacheService } from '../../lib/oa/core/services/cache.service';
import { ContextService } from '../../lib/oa/core/services/context.service';
import { ValidationService } from '../../lib/oa/core/services/validation.service';
import { UxService } from '../../lib/oa/core/services/ux.service';
import { ConstantService } from '../../lib/oa/core/services/constant.service';
import { NavService } from '../../lib/oa/core/services/nav.service';
import { DataService } from '../../lib/oa/core/services/data.service';
import { BuilderMetadata } from './builder-metadata.model';
import fixtureDocument from '../../testing/fixtures/home.page.json';

describe('BuilderPageComponent page workspace editing', () => {
  let component: BuilderPageComponent;
  let updatePage: ReturnType<typeof vi.fn>;

  const fixturePage = fixtureDocument as Record<string, unknown>;

  const metadata: BuilderMetadata = {
    title: 'Page',
    icon: 'dashboard',
    itemCollectionPath: 'meta.layout.sections',
    itemLabel: 'Sections',
    persistence: { service: 'system', collection: 'navs' },
    toolbox: { groups: [] },
    propertySchemas: {},
    validationSchema: {},
    defaultData: { id: 'page-id', code: 'home', name: 'Home', title: 'Home', url: '/home', status: 'active', meta: { layout: { sections: [] } } }
  };

  beforeEach(async () => {
    const context = {
      appSource: signal(undefined),
      actions: signal([]),
      breadcrumbs: signal([]),
      page: signal(undefined),
      theme: signal({}),
      data: signal(new Map()),
      getPageMeta: () => undefined
    };
    const route = {
      snapshot: { paramMap: { get: () => null }, data: {} },
      data: of({}),
      parent: null
    };
    updatePage = vi.fn().mockResolvedValue(fixturePage);
    await TestBed.configureTestingModule({
      imports: [BuilderPageComponent],
      providers: [
        { provide: Router, useValue: { events: EMPTY, navigate: async () => true } },
        { provide: ActivatedRoute, useValue: route },
        { provide: HttpClient, useValue: {} },
        { provide: CacheService, useValue: { get: () => null, set: () => undefined } },
        { provide: ContextService, useValue: context },
        { provide: ValidationService, useValue: {
          isObjectValid: (data: Record<string, unknown>, schema: Record<string, unknown>) => {
            const required = Array.isArray(schema['required']) ? schema['required'] as string[] : [];
            return required.filter((key) => data[key] === undefined || data[key] === null || data[key] === '')
              .map((key) => ({ path: `$.${key}`, message: `${key} is required` }));
          }
        } },
        { provide: UxService, useValue: { reset: () => undefined } },
        { provide: ConstantService, useValue: { lists: new Map() } },
        { provide: NavService, useValue: {} },
        { provide: DataService, useValue: { update: updatePage } }
      ]
    }).compileComponents();
    component = TestBed.createComponent(BuilderPageComponent).componentInstance;
    component.metadata.set(metadata);
  });

  it('loads and serializes the complete fixture without inserting or dropping fields', () => {
    const source = structuredClone(fixturePage);
    component.metadata.set(metadata);
    const loaded = component.normalizeWorkspace(source);
    expect(loaded).toEqual(source);
    expect(JSON.stringify(loaded, null, 2)).toBe(JSON.stringify(source, null, 2));
    expect((loaded['meta'] as Record<string, unknown>)['actions']).toEqual([]);
    expect(loaded['id']).toBe(source['id']);
    expect(loaded['index']).toBe(source['index']);
  });

  it('selects a newly inserted component after a Canvas tool drop', () => {
    component.metadata.set(metadata);
    component.workspaceData.set({
      meta: { layout: { sections: [{ code: 'body', components: [] }] } }
    });

    component.onCanvasToolDropped({
      sectionCode: 'body',
      targetPath: 'meta.layout.sections.0.components',
      tool: { control: 'html', target: 'components', value: ['Added'] }
    });

    expect(component.selected()).toEqual({
      type: 'html',
      item: { control: 'html', value: ['Added'] },
      index: 0,
      path: 'meta.layout.sections.0.components.0'
    });
    expect(component.canvasSelection?.value).toEqual({ control: 'html', value: ['Added'] });
  });

  it('selects newly created metadata after a Canvas tool drop', () => {
    component.metadata.set(metadata);
    component.workspaceData.set({ meta: {} });

    component.onCanvasToolDropped({
      sectionCode: 'settings',
      targetPath: 'meta.settings',
      tool: { target: 'meta', code: 'settings', value: { enabled: true } }
    });

    expect(component.selected()).toEqual({
      type: 'settings',
      item: { enabled: true },
      index: -1,
      path: 'meta.settings'
    });
  });

  it('creates a missing configured collection from its canvas definition', () => {
    component.metadata.set({
      ...metadata,
      itemCollectionPath: 'navs',
      canvasSections: [{
        code: 'sections',
        title: 'Layout sections',
        path: 'meta.page.layout.sections',
        target: 'section',
        targets: ['sections', 'components'],
        optional: true
      }]
    });
    component.workspaceData.set({ meta: { page: { layout: { type: 'workspace' } } } });
    component.activeToolDrag.set({
      groupCode: 'page-structure',
      tool: { target: 'sections', value: { code: 'new-section', components: [] } }
    });

    expect(component.canvasDropListIds).toEqual(['oa-canvas-sections-section']);

    component.addConfiguredItem({
      target: 'sections',
      value: { code: 'new-section', components: [] }
    });

    expect(component.getBuilderPath(component.workspaceData(), 'meta.page.layout.sections')).toEqual([
      { code: 'new-section', components: [] }
    ]);
    expect(component.selected()?.path).toBe('meta.page.layout.sections.0');
  });

  it('shows collection selections without presenting an empty item form', () => {
    component.onCanvasSelection({
      code: 'collection-item',
      sectionCode: 'records',
      value: [{ code: 'home', title: 'Home' }],
      path: 'navs',
      index: -1
    });

    expect(component.propertiesType).toBe('collection');
    expect(component.propertiesData).toEqual({});
  });

  it('adds configured items with lossless defaults, and keeps selection valid after reorder', () => {
    component.metadata.set({
      ...metadata,
      canvasSections: [{ code: 'layout', title: 'Layout', path: 'meta.layout.sections', targets: ['sections', 'components'] }]
    });
    component.workspaceData.set(structuredClone(fixturePage));
    const initialCount = component.getBuilderPath(component.workspaceData(), 'meta.layout.sections') as unknown[];
    component.addConfiguredItem({ target: 'sections', value: { code: 'new-section', components: [{ control: 'html', value: [''] }] } });
    const sections = component.getBuilderPath(component.workspaceData(), 'meta.layout.sections') as Array<Record<string, unknown>>;
    expect(sections.length).toBe(initialCount.length + 1);
    expect(sections.at(-1)?.['components']).toEqual([{ control: 'html', value: [''] }]);
    expect(component.dirty()).toBe(true);
    const newCode = String(sections.at(-1)?.['code']);
    component.selectItem(sections.at(-1)!, `meta.layout.sections.${sections.length - 1}`, sections.length - 1);
    component.addConfiguredItem({ control: 'form', target: 'components' });
    const components = component.getBuilderPath(component.workspaceData(), `meta.layout.sections.${sections.length - 1}.components`) as Array<Record<string, unknown>>;
    expect(components.at(-1)).toEqual({ control: 'form' });
    expect(component.workspaceData()['id']).toBe(fixturePage['id']);
    component.selectItem(sections.at(-1)!, `meta.layout.sections.${sections.length - 1}`, sections.length - 1);
    component.moveSelection(-1);
    expect(component.selected()?.item['code']).toBe(newCode);
  });

  it('duplicates configured items with fresh IDs and keeps nested content', () => {
    component.metadata.set(metadata);
    const source = structuredClone(fixturePage);
    component.workspaceData.set(source);
    const sections = component.getBuilderPath(source, 'meta.layout.sections') as Array<Record<string, unknown>>;
    component.selectItem(sections[0], 'meta.layout.sections.0', 0);
    component.duplicateSelection();
    const updated = component.getBuilderPath(component.workspaceData(), 'meta.layout.sections') as Array<Record<string, unknown>>;
    expect(updated[1]['code']).not.toBe(updated[0]['code']);
    expect(updated[1]['components']).toEqual(sections[0]['components']);
    component.selectItem(updated[0], 'meta.layout.sections.0', 0);
    component.duplicateSelection();
    expect((component.getBuilderPath(component.workspaceData(), 'meta.layout.sections') as Array<Record<string, unknown>>)[1]['code'])
      .not.toBe(updated[1]['code']);
  });

  it('preserves unknown root, metadata, and control fields through an edit and save', async () => {
    component.metadata.set(metadata);
    const page = structuredClone(fixturePage);
    page['extension'] = { version: 7, enabled: true };
    const meta = page['meta'] as Record<string, unknown>;
    meta['actions'] = [{ code: 'keep-action', extra: 'metadata action' }];
    const sections = component.getBuilderPath(page, 'meta.layout.sections') as Array<Record<string, unknown>>;
    (sections[0]['components'] as Array<Record<string, unknown>>).push({ control: 'custom-chart', payload: { keep: true }, marker: 'untouched' });
    component.workspaceData.set(page);
    component.rememberWorkspaceAsSaved();
    component.updateWorkspaceValue('title', 'Edited page title');
    await component.saveDraft();

    expect(updatePage).toHaveBeenCalled();
    const saved = updatePage.mock.calls.at(-1)?.[1] as Record<string, unknown>;
    expect(saved['extension']).toEqual({ version: 7, enabled: true });
    expect((saved['meta'] as Record<string, unknown>)['actions']).toEqual(meta['actions']);
    const savedSections = component.getBuilderPath(saved, 'meta.layout.sections') as Array<Record<string, unknown>>;
    expect((savedSections[0]['components'] as Array<Record<string, unknown>>).at(-1))
      .toEqual({ control: 'custom-chart', payload: { keep: true }, marker: 'untouched' });
    expect(component.dirty()).toBe(false);
  });

  it('validates configured data before saving and keeps dirty state when persistence fails', async () => {
    component.metadata.set({ ...metadata, validationSchema: { required: ['status'] } });
    component.workspaceData.set(structuredClone(fixturePage));
    component.rememberWorkspaceAsSaved();
    component.updateWorkspaceValue('title', 'Unsaved title');
    updatePage.mockRejectedValue(new Error('offline'));
    await component.saveDraft();
    expect(component.dirty()).toBe(true);
    expect(component.loadError()).toContain('offline');

    const invalid = structuredClone(component.workspaceData());
    invalid['status'] = '';
    component.workspaceData.set(invalid);
    updatePage.mockClear();
    await component.saveDraft();
    expect(updatePage).not.toHaveBeenCalled();
    expect(component.loadError()).toContain('Not saved, fix the errors first.');
  });

  it('duplicates a selected block and regenerates ids for it and its descendants', () => {
    component.metadata.set(metadata);
    const blocks = [{
      code: 'hero-1', type: 'hero', title: 'Hero',
      components: [{ code: 'text-1', type: 'text', title: 'Intro' }]
    }];
    component.workspaceData.set({ title: 'Page', blocks });
    component.selectItem(blocks[0], 'blocks.0', 0);

    component.duplicateSelection();

    const result = component.workspaceData()['blocks'] as Array<Record<string, unknown>>;
    const copy = result[1];
    const nested = copy['components'] as Array<Record<string, unknown>>;
    expect(result.length).toBe(2);
    expect(copy['code']).not.toBe('hero-1');
    expect(nested[0]['code']).not.toBe('text-1');
    expect(component.selected()?.path).toBe('blocks.1');
    expect(component.dirty()).toBe(true);
  });

  it('reorders a cloned collection without mutating the previous workspace signal value', () => {
    const originalBlocks = [{ code: 'one' }, { code: 'two' }];
    const originalWorkspace = { title: 'Page', blocks: originalBlocks };
    component.workspaceData.set(originalWorkspace);
    const list = { data: originalBlocks };
    const event = {
      previousContainer: list,
      container: list,
      previousIndex: 0,
      currentIndex: 1,
      item: { data: { path: 'blocks.0', index: 0 } }
    };

    component.drop(event as never, 'blocks');

    expect(originalBlocks.map((item) => item.code)).toEqual(['one', 'two']);
    expect((component.workspaceData()['blocks'] as Array<{ code: string }>).map((item) => item.code))
      .toEqual(['two', 'one']);
  });

  it('keeps selection in place when moving beyond either end of its collection', () => {
    const items = [{ code: 'one' }, { code: 'two' }];
    component.workspaceData.set({ title: 'Page', blocks: items });
    component.selectItem(items[0], 'blocks.0', 0);
    component.moveSelection(-1);
    expect(component.selected()?.path).toBe('blocks.0');
    expect((component.workspaceData()['blocks'] as Array<{ code: string }>)[0].code).toBe('one');

    component.selectItem(items[1], 'blocks.1', 1);
    component.moveSelection(1);
    expect(component.selected()?.path).toBe('blocks.1');
    expect((component.workspaceData()['blocks'] as Array<{ code: string }>)[1].code).toBe('two');
  });

  it('closes the page builder directly without a discard prompt', () => {
    component.workspaceData.set({ title: 'Saved', blocks: [] });
    component.rememberWorkspaceAsSaved();
    component.updateWorkspaceValue('title', 'Unsaved');

    component.closeBuilder();

    expect(component.dirty()).toBe(true);
  });
});
