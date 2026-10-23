import { TestBed } from '@angular/core/testing';
import { expect } from 'vitest';
import { ConstantService } from '../../core/services/constant.service';
import { PropertiesComponent } from './properties.component';

describe('PropertiesComponent typed form controls', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertiesComponent],
      providers: [{ provide: ConstantService, useValue: { lists: new Map(), icons: { get: () => undefined } } }]
    }).compileComponents();
  });

  it('emits a replacement value without mutating the input object', () => {
    const fixture = TestBed.createComponent(PropertiesComponent);
    const component = fixture.componentInstance;
    const original = { title: 'Before', config: { enabled: false } };
    const emitted: Record<string, unknown>[] = [];
    component.value = original;
    component.valueChange.subscribe((value) => emitted.push(value));

    component.setValue(component.value, 'config.enabled', true);

    expect(original.config.enabled).toBe(false);
    expect(emitted[0]['config']).toEqual({ enabled: true });
    expect(emitted[0]).not.toBe(original);
  });

  it('selects the form controls configured for the input type', () => {
    const fixture = TestBed.createComponent(PropertiesComponent);
    const component = fixture.componentInstance;
    component.value = { name: 'Application' };
    component.options = {
      types: {
        workspace: [{ key: 'name', label: 'Name', type: 'text', group: 'Identity' }],
        section: [{ key: 'code', label: 'Code', type: 'text' }]
      }
    };
    component.type = 'workspace';

    expect(component.properties).toEqual([
      { key: 'name', label: 'Name', type: 'text', group: 'Identity' }
    ]);

    component.type = 'section';
    expect(component.properties).toEqual([{ key: 'code', label: 'Code', type: 'text' }]);
  });

  it('renders configured attributes and emits the changed value', () => {
    const fixture = TestBed.createComponent(PropertiesComponent);
    const component = fixture.componentInstance;
    const original = { title: 'Home' };
    const emitted: Record<string, unknown>[] = [];
    component.value = original;
    component.options = {
      types: { page: [
        { key: 'title', label: 'Title', type: 'text' }
      ] }
    };
    component.type = 'page';
    component.valueChange.subscribe((value) => emitted.push(value));
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('#oa-property-title') as HTMLInputElement;
    input.value = 'Updated title';
    input.dispatchEvent(new Event('input'));

    expect(component.properties).toEqual([{ key: 'title', label: 'Title', type: 'text' }]);
    expect(emitted[0]).toEqual({ title: 'Updated title' });
    expect(original.title).toBe('Home');
  });

  it('renders object attributes when no type-specific controls are configured', () => {
    const fixture = TestBed.createComponent(PropertiesComponent);
    const component = fixture.componentInstance;
    component.value = { title: 'Home', published: false, rank: 2, settings: { compact: true } };
    component.type = 'unconfigured';
    fixture.detectChanges();

    expect(component.properties.map((property) => [property.key, property.type])).toEqual([
      ['title', 'text'],
      ['published', 'boolean'],
      ['rank', 'number'],
      ['settings', 'json']
    ]);
    expect(fixture.nativeElement.querySelector('#oa-property-title')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#oa-property-settings')).not.toBeNull();
  });

  it('respects an explicitly empty collection schema instead of using default fields', () => {
    const fixture = TestBed.createComponent(PropertiesComponent);
    const component = fixture.componentInstance;
    component.value = {};
    component.options = {
      types: {
        collection: [],
        default: [{ key: 'title', label: 'Title', type: 'text' }]
      }
    };
    component.type = 'collection';
    fixture.detectChanges();

    expect(component.properties).toEqual([]);
    expect(fixture.nativeElement.querySelector('.empty-hint')?.textContent).toContain('collection');
  });
});
