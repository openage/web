import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expect } from 'vitest';
import { ContextService } from '../../core/services/context.service';
import { ConstantService } from '../../core/services/constant.service';
import { CanvasComponent } from './canvas.component';

describe('CanvasComponent context data and selection', () => {
  const workspace = {
    navs: [{ code: 'home', title: 'Home' }],
    meta: { layout: { sections: [{ code: 'hero', components: [{ control: 'html', value: ['Hello'] }] }] } }
  };
  const context = { data: signal(new Map([['application', workspace]])) };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CanvasComponent],
      providers: [
        { provide: ContextService, useValue: context },
        { provide: ConstantService, useValue: { lists: new Map(), icons: { get: () => undefined } } }
      ]
    }).compileComponents();
  });

  it('resolves its root object from the configured context data key', () => {
    const fixture = TestBed.createComponent(CanvasComponent);
    const canvas = fixture.componentInstance;
    canvas.value = 'application';
    canvas.options = { sections: [{ code: 'pages', path: 'navs', target: 'application-nav' }] };

    expect(canvas.workspaceData).toBe(workspace);
    expect(canvas.sectionValue(canvas.canvasSections[0])).toEqual(workspace.navs);
    expect(canvas.canvasDropListIds).toEqual(['oa-canvas-pages']);
  });

  it('emits the configured target code, selected object, and workspace path', () => {
    const fixture = TestBed.createComponent(CanvasComponent);
    const canvas = fixture.componentInstance;
    canvas.value = 'application';
    canvas.options = { sections: [{ code: 'pages', path: 'navs', target: 'application-nav' }] };
    const selected: unknown[] = [];
    canvas.sectionSelected.subscribe((value) => selected.push(value));

    canvas.selectItem(workspace.navs[0], canvas.canvasSections[0], 'navs.0', 0);

    expect(selected).toEqual([{
      code: 'application-nav',
      sectionCode: 'pages',
      value: workspace.navs[0],
      path: 'navs.0',
      index: 0
    }]);
  });

  it('emits the complete value when an array section is selected', () => {
    const fixture = TestBed.createComponent(CanvasComponent);
    const canvas = fixture.componentInstance;
    const section = { code: 'pages', title: 'Pages', path: 'navs', group: 'navigation' };
    canvas.value = 'application';
    canvas.options = { sections: [section] };
    const selected: unknown[] = [];
    canvas.sectionSelected.subscribe((value) => selected.push(value));
    fixture.detectChanges();

    const heading = fixture.nativeElement.querySelector('.canvas-section-heading') as HTMLButtonElement;
    heading.click();

    expect(selected).toEqual([{
      code: 'pages',
      sectionCode: 'pages',
      groupCode: 'navigation',
      value: workspace.navs,
      path: 'navs',
      index: -1
    }]);
  });

  it('highlights only sections that accept the dragged tool targets', () => {
    const fixture = TestBed.createComponent(CanvasComponent);
    const canvas = fixture.componentInstance;
    const sections = [
      { code: 'pages', title: 'Pages', path: 'navs', targets: ['navs'] },
      { code: 'services', title: 'Services', path: 'services', targets: ['services'] }
    ];
    canvas.value = 'application';
    canvas.options = { sections };
    canvas.activeTool = { groupCode: 'navigation', tool: { target: 'navs', title: 'Add page' } };

    expect(canvas.isDropTarget(sections[0])).toBe(true);
    expect(canvas.isDropTarget(sections[1])).toBe(false);
  });

  it('exposes optional object sections only while a compatible tool is being dragged', () => {
    const fixture = TestBed.createComponent(CanvasComponent);
    const canvas = fixture.componentInstance;
    const section = { code: 'settings', title: 'Settings', path: 'meta.settings', target: 'settings', optional: true };
    canvas.value = { meta: {} };
    canvas.options = { sections: [section] };

    expect(canvas.visibleSections).toEqual([]);
    expect(canvas.canvasDropListIds).toEqual([]);

    canvas.activeTool = {
      groupCode: 'structure',
      tool: { target: 'meta', code: 'settings', value: { enabled: true } }
    };

    expect(canvas.visibleSections).toEqual([section]);
    expect(canvas.canvasDropListIds).toEqual(['oa-canvas-settings-section']);
    expect(canvas.isDropTarget(section)).toBe(true);

    const dropped: unknown[] = [];
    canvas.toolDropped.subscribe((value) => dropped.push(value));
    canvas.onDrop({
      item: {
        data: {
          groupCode: 'structure',
          tool: { target: 'meta', code: 'settings', value: { enabled: true } }
        }
      }
    } as never, section);

    expect(dropped).toEqual([{
      sectionCode: 'settings',
      targetPath: 'meta.settings',
      tool: { target: 'meta', code: 'settings', value: { enabled: true } }
    }]);
  });

  it('does not advertise a metadata tool as a drop target when its path already exists', () => {
    const fixture = TestBed.createComponent(CanvasComponent);
    const canvas = fixture.componentInstance;
    const section = { code: 'settings', title: 'Settings', path: 'meta.settings', target: 'settings' };
    canvas.value = { meta: { settings: { enabled: false } } };
    canvas.options = { sections: [section] };
    canvas.activeTool = {
      groupCode: 'structure',
      tool: { target: 'meta', code: 'settings', value: { enabled: true } }
    };

    expect(canvas.isDropTarget(section)).toBe(false);
  });

  it('allows the workspace root to receive a missing metadata tool path', () => {
    const canvas = TestBed.createComponent(CanvasComponent).componentInstance;
    const root = { code: 'application', title: 'Application', path: '', target: 'workspace' };
    canvas.value = { meta: {} };
    canvas.options = { sections: [root] };
    canvas.activeTool = {
      groupCode: 'page-structure',
      tool: { target: 'meta', code: 'auth', value: { providers: [] } }
    };

    expect(canvas.isDropTargetAtPath(root, '')).toBe(true);
    expect(canvas.canvasDropListIds).toEqual(['oa-canvas-application-section']);
  });

  it('only highlights a collection section when the tool targets that collection', () => {
    const canvas = TestBed.createComponent(CanvasComponent).componentInstance;
    const section = {
      code: 'sections',
      title: 'Layout sections',
      path: 'meta.page.layout.sections',
      targets: ['sections', 'components'],
      optional: true
    };
    canvas.value = { meta: { page: { layout: {} } } };
    canvas.options = { sections: [section] };
    canvas.activeTool = { groupCode: 'layout', tool: { target: 'components', control: 'html' } };

    expect(canvas.sectionAvailable(section)).toBe(false);
    expect(canvas.isDropTargetAtPath(section, section.path)).toBe(false);
    expect(canvas.isDropTargetAtPath(section, 'meta.page.layout.sections.0.components')).toBe(true);

    canvas.activeTool = { groupCode: 'layout', tool: { target: 'sections', value: { code: 'new-section' } } };
    expect(canvas.sectionAvailable(section)).toBe(true);
    expect(canvas.isDropTargetAtPath(section, section.path)).toBe(true);
  });

  it('renders and highlights an empty components collection as a drop target', () => {
    const fixture = TestBed.createComponent(CanvasComponent);
    const canvas = fixture.componentInstance;
    canvas.value = { navs: [{ code: 'home', title: 'Home', components: [] }] };
    canvas.options = { sections: [{ code: 'pages', path: 'navs', targets: ['navs'] }] };
    canvas.activeTool = { groupCode: 'layout', tool: { target: 'components', control: 'html' } };
    fixture.detectChanges();

    expect(canvas.canvasDropListIds).toEqual([
      'oa-canvas-pages',
      'oa-canvas-pages-navs-0-components'
    ]);
    expect(fixture.nativeElement.querySelector('.canvas-child-list.drop-target')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.canvas-child-list .canvas-empty')).not.toBeNull();

    const dropped: unknown[] = [];
    canvas.toolDropped.subscribe((value) => dropped.push(value));
    canvas.onDrop({
      item: { data: { groupCode: 'layout', tool: { target: 'components', control: 'html' } } }
    } as never, canvas.canvasSections[0], 'navs.0.components');

    expect(dropped).toEqual([{
      sectionCode: 'pages',
      targetPath: 'navs.0.components',
      tool: { target: 'components', control: 'html' }
    }]);
  });

  it('uses the configured section item type when an item has no control or type', () => {
    const canvas = TestBed.createComponent(CanvasComponent).componentInstance;

    expect(canvas.itemType({ code: 'system' }, { code: 'services', title: 'Services', path: 'services', itemType: 'Service' }))
      .toBe('Service');
  });

  it('builds a nested page tree from parent references and hierarchical page codes', () => {
    const canvas = TestBed.createComponent(CanvasComponent).componentInstance;
    const pages = [
      { id: 'root', code: 'console.pages', title: 'Pages' },
      { id: 'details', code: 'console.pages.details', title: 'Page details' },
      { id: 'home', code: 'home', title: 'Home' },
      { id: 'tools', code: 'tools', title: 'Tools', parentId: 'home' }
    ];
    canvas.value = { navs: pages };
    canvas.options = { sections: [{ code: 'pages', title: 'Pages', path: 'navs' }] };

    const rows = canvas.pageTreeRows(pages);
    expect(rows.map((row) => [row.item['code'], row.depth, row.index])).toEqual([
      ['console.pages', 0, 0],
      ['console.pages.details', 1, 1],
      ['home', 0, 2],
      ['tools', 1, 3]
    ]);
    expect(rows[0].hasChildren).toBe(true);
    expect(canvas.pageTreeRowVisible(rows[1], rows)).toBe(true);

    canvas.togglePageNode(rows[0]);

    expect(canvas.isPageExpanded(rows[0])).toBe(false);
    expect(canvas.pageTreeRowVisible(rows[1], rows)).toBe(false);
    expect(pages[1]['code']).toBe('console.pages.details');
  });

  it('renders the page hierarchy as expandable tree rows', () => {
    const fixture = TestBed.createComponent(CanvasComponent);
    const canvas = fixture.componentInstance;
    const pages = [
      { code: 'console.pages', title: 'Pages' },
      { code: 'console.pages.details', title: 'Page details' },
      { code: 'home', title: 'Home' }
    ];
    canvas.value = { navs: pages };
    canvas.options = { sections: [{ code: 'pages', title: 'Pages', path: 'navs' }] };
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('.canvas-page-node[aria-level="1"]') as HTMLElement;
    expect(root.querySelector('.page-tree-toggle')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.canvas-page-node').length).toBe(3);
    expect(root.querySelector('.page-node-actions button[aria-label="Duplicate page"]')).not.toBeNull();

    (root.querySelector('.page-tree-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.canvas-page-node').length).toBe(2);
    expect(fixture.nativeElement.querySelector('.canvas-page-node[aria-level="2"]')).toBeNull();
  });
});
