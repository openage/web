import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormComponent } from './form.component';
import { ContextService } from '../../core/services/context.service';
import { DataService } from '../../core/services/data.service';
import { UxService } from '../../core/services/ux.service';

describe('FormComponent', () => {
  let component: FormComponent;
  let fixture: ComponentFixture<FormComponent>;
  const contextService = {
    getPageMeta: jasmine.createSpy('getPageMeta').and.returnValue({}),
    data: () => new Map<string, any>()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormComponent],
      providers: [
        { provide: ContextService, useValue: contextService },
        { provide: DataService, useValue: {} },
        { provide: UxService, useValue: {} }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should not throw when a referenced form value is missing from context data', () => {
    component.value = 'missing-form-value';
    expect(() => component.ngOnInit()).not.toThrow();
  });

  it('should place fields only in their configured sections', () => {
    component.fields = [
      { key: 'displayName', group: 'general-sec', value: 'Open Age' } as any,
      { key: 'segment', section: 'meta-sec', value: 'enterprise' } as any
    ];

    const content = component.initSection({
      class: 'form',
      sections: [
        { code: 'general-sec' },
        { code: 'meta-sec' }
      ]
    });

    expect(content.fields).toEqual([]);
    expect(content.sections[0].fields.map((field: any) => field.key)).toEqual(['displayName']);
    expect(content.sections[1].fields.map((field: any) => field.key)).toEqual(['segment']);
  });
});
