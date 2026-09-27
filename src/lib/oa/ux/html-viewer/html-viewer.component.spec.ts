import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HtmlViewerComponent } from './html-viewer.component';
import { ContextService } from '../../core/services/context.service';
import { ContentService } from '../../core/services/content.service';
import { ConstantService } from '../../core/services/constant.service';
import { DataService } from '../../core/services/data.service';

describe('HtmlViewerComponent', () => {
  let component: HtmlViewerComponent;
  let fixture: ComponentFixture<HtmlViewerComponent>;
  let contextData: WritableSignal<Map<string, any>>;
  const template = '{{#each items}}{{displayName}}{{/each}}';
  const constantService = {
    templates: { get: jasmine.createSpy('get') }
  };
  const contentService = {
    inject: jasmine.createSpy('inject').and.callFake((_template: string, value: any) =>
      value?.items?.map((item: any) => item.displayName).join(', ') || '')
  };

  beforeEach(async () => {
    contextData = signal(new Map<string, any>());
    constantService.templates.get.and.callFake(async (code: string) =>
      code.endsWith('.skeleton') ? '<p>Loading parties</p>' : template);

    await TestBed.configureTestingModule({
      imports: [HtmlViewerComponent],
      providers: [
        { provide: ContextService, useValue: { data: contextData } },
        { provide: ConstantService, useValue: constantService },
        { provide: ContentService, useValue: contentService },
        { provide: DataService, useValue: {} }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(HtmlViewerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render a keyed value when it arrives after initialization', async () => {
    fixture.componentRef.setInput('value', 'parties');
    fixture.componentRef.setInput('options', { template: { code: 'parties' } });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeTruthy();
    expect(constantService.templates.get).toHaveBeenCalledWith('parties.skeleton');
    await fixture.whenStable();

    expect(component.content).toBe('');
    expect(fixture.nativeElement.textContent).toContain('Loading parties');

    contextData.set(new Map([['parties', {
      items: [{ displayName: 'Open Age' }, { displayName: 'Jane Doe' }]
    }]]));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.content).toBe('Open Age, Jane Doe');
    expect(fixture.nativeElement.textContent).toContain('Open Age, Jane Doe');
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
  });

  it('should not generate a skeleton when the constant service has none', async () => {
    constantService.templates.get.and.callFake(async (code: string) =>
      code.endsWith('.skeleton') ? undefined : template);
    fixture.componentRef.setInput('value', 'parties');
    fixture.componentRef.setInput('options', { template: { code: 'parties' } });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.html-viewer-skeleton')).toBeNull();
  });
});
