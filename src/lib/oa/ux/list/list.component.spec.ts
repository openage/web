import { signal, WritableSignal } from '@angular/core';
import { Location } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { ListComponent } from './list.component';
import { ContextService } from '../../core/services/context.service';
import { TransformService } from '../../core/services/transform.service';
import { StringService } from '../../core/services';
import { ContentService } from '../../core/services/content.service';
import { NavService } from '../../core/services/nav.service';
import { ConstantService } from '../../core/services/constant.service';

describe('ListComponent', () => {
  let component: ListComponent;
  let fixture: ComponentFixture<ListComponent>;
  let contextData: WritableSignal<Map<string, any>>;
  const template = '<div class="custom-applications">{{name}}</div>';
  const constantService = {
    templates: { get: jasmine.createSpy('get') }
  };
  const contentService = {
    inject: jasmine.createSpy('inject').and.callFake((_template: string, data: any) =>
      `<div class="custom-applications">${Array.isArray(data)
        ? data.map((row: any) => `<span>${row.name}</span>`).join('')
        : data.name}</div>`)
  };

  beforeEach(async () => {
    contextData = signal(new Map<string, any>());
    constantService.templates.get.calls.reset();
    contentService.inject.calls.reset();
    constantService.templates.get.and.callFake(async (code: string) =>
      code.endsWith('.skeleton') ? '<div>Loading applications</div>' : template);

    await TestBed.configureTestingModule({
      imports: [ListComponent],
      providers: [
        { provide: ContextService, useValue: { data: contextData, hasPermission: () => true } },
        { provide: Router, useValue: { navigateByUrl: jasmine.createSpy('navigateByUrl') } },
        { provide: Location, useValue: { path: () => '/console/applications' } },
        { provide: TransformService, useValue: { apply: (rows: any[]) => rows } },
        { provide: StringService, useValue: { inject: (_value: any) => _value } },
        { provide: ContentService, useValue: contentService },
        { provide: NavService, useValue: { goto: jasmine.createSpy('goto') } },
        { provide: ConstantService, useValue: constantService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render rows with the configured HTML template', async () => {
    fixture.componentRef.setInput('value', [{ name: 'Console' }]);
    fixture.componentRef.setInput('options', {
      view: 'template',
      template: { code: 'applications' }
    });

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(constantService.templates.get).toHaveBeenCalledWith('applications');
    expect(contentService.inject).toHaveBeenCalledWith(template, [{ name: 'Console' }]);
    expect(fixture.nativeElement.querySelector('.custom-applications')?.textContent).toContain('Console');
  });

  it('should render the built-in table when no template is configured', () => {
    fixture.componentRef.setInput('value', [{ name: 'Console' }]);
    fixture.componentRef.setInput('options', {
      view: 'table',
      fields: [{ key: 'name', label: 'Name' }]
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.list-table .header')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.list-table .data-row .name')?.textContent).toContain('Console');
    expect(fixture.nativeElement.querySelector('.custom-applications')).toBeNull();
  });

  it('should show the configured skeleton while a context-bound value is loading', async () => {
    let resolveTemplate!: (value: string) => void;
    constantService.templates.get.and.callFake((code: string) => code.endsWith('.skeleton')
      ? Promise.resolve('<div>Loading applications</div>')
      : new Promise(resolve => { resolveTemplate = resolve; }));

    fixture.componentRef.setInput('value', 'applications');
    fixture.componentRef.setInput('options', {
      view: 'template',
      template: { code: 'applications' },
    });
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[aria-busy="true"]')?.textContent).toContain('Loading applications');

    resolveTemplate(template);
    contextData.set(new Map([['applications', [{ name: 'Console' }]]]));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.custom-applications')?.textContent).toContain('Console');
  });

  it('should finish loading when a subscribable page emits its updated state', async () => {
    let emitPage!: (page: any) => void;
    const page = {
      items: [] as any[],
      subscribe: (callback: (value: any) => void) => {
        emitPage = callback;
      }
    };
    fixture.componentRef.setInput('value', page);
    fixture.componentRef.setInput('options', {
      view: 'template',
      template: { code: 'applications' }
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[aria-busy="true"]')).toBeTruthy();

    page.items = [{ name: 'Console' }];
    emitPage(page);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[aria-busy="true"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.custom-applications')?.textContent).toContain('Console');
  });

  it('should render page items when the page resolved before the list subscribed', async () => {
    const page = {
      items: [{ name: 'Console' }],
      limit: 1,
      count: 1,
      subscribe: jasmine.createSpy('subscribe')
    };
    fixture.componentRef.setInput('value', page);
    fixture.componentRef.setInput('options', {
      view: 'template',
      template: { code: 'applications' }
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(page.subscribe).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[aria-busy="true"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.custom-applications')?.textContent).toContain('Console');
  });

  it('should render a table without configured actions', () => {
    fixture.componentRef.setInput('value', [{ name: 'Console' }]);
    fixture.componentRef.setInput('options', {
      view: 'table',
      fields: [{ key: 'name', label: 'Name' }]
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.list-table .header .name')?.textContent).toContain('Name');
    expect(fixture.nativeElement.querySelector('.list-table .data-row .name')?.textContent).toContain('Console');
    expect(fixture.nativeElement.querySelector('.actions')).toBeNull();

    spyOn(component.changed, 'emit');
    component.onSubmit([]);
    expect(component.changed.emit).toHaveBeenCalledWith([{ name: 'Console' }]);
  });

  it('should render the complete list from a template without fields', async () => {
    fixture.componentRef.setInput('value', [{ name: 'Console' }]);
    fixture.componentRef.setInput('options', {
      view: 'template',
      template: { code: 'applications' }
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.list-template .custom-applications')?.textContent)
      .toContain('Console');
    expect(fixture.nativeElement.querySelector('.list-table')).toBeNull();
  });

  it('should render input and HTML table fields', () => {
    const row = { name: 'Console', description: '<strong>Applications</strong>' };
    fixture.componentRef.setInput('value', [row]);
    fixture.componentRef.setInput('options', {
      view: 'table',
      fields: [
        { key: 'name', label: 'Name', control: 'input' },
        { key: 'description', label: 'Description', control: 'html' }
      ]
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('oa-text-input')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.description strong')?.textContent).toBe('Applications');
    component.setFieldValue(component.cols[0], row, 'Updated');
    expect(row.name).toBe('Updated');
  });

  it('should report template mode when the skeleton asset is missing', async () => {
    constantService.templates.get.and.callFake(async (code: string) =>
      code.endsWith('.skeleton') ? '' : template);
    fixture.componentRef.setInput('value', [{ name: 'Console' }]);
    fixture.componentRef.setInput('options', {
      view: 'template',
      template: { code: 'applications' }
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent)
      .toContain('Unable to load list template');
  });
});
