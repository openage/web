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
    inject: jasmine.createSpy('inject').and.callFake((_template: string, rows: any[]) =>
      `<div class="custom-applications">${rows.map((row: any) => `<span>${row.name}</span>`).join('')}</div>`)
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
      template: { code: 'applications' }
    });

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(constantService.templates.get).toHaveBeenCalledWith('applications');
    expect(contentService.inject).toHaveBeenCalledWith(template, [{ name: 'Console' }]);
    expect(fixture.nativeElement.querySelector('.custom-applications')?.textContent).toContain('Console');
  });

  it('should show the configured skeleton while a context-bound value is loading', async () => {
    let resolveTemplate!: (value: string) => void;
    constantService.templates.get.and.callFake((code: string) => code.endsWith('.skeleton')
      ? Promise.resolve('<div>Loading applications</div>')
      : new Promise(resolve => { resolveTemplate = resolve; }));

    fixture.componentRef.setInput('value', 'applications');
    fixture.componentRef.setInput('options', {
      template: { code: 'applications' },
      fields: [{ key: 'name', label: 'Name' }]
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
      template: { code: 'applications' }
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(page.subscribe).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[aria-busy="true"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.custom-applications')?.textContent).toContain('Console');
  });

  it('should render rows as cards in the grid view', () => {
    fixture.componentRef.setInput('value', [{ name: 'Console' }]);
    fixture.componentRef.setInput('options', {
      view: 'grid',
      fields: [{ key: 'name', label: 'Name' }]
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.list-grid-card')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.list-grid-label')?.textContent).toContain('Name');
    expect(fixture.nativeElement.querySelector('.list-grid-field .name')?.textContent).toContain('Console');

    spyOn(component.changed, 'emit');
    component.onSubmit([]);
    expect(component.changed.emit).toHaveBeenCalledWith([{ name: 'Console' }]);
  });
});
