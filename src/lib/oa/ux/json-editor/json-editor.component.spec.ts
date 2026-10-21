import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ContextService } from '../../core/services/context.service';
import { DataService } from '../../core/services/data.service';
import { JsonEditorComponent } from './json-editor.component';

describe('JsonEditorComponent', () => {
  let component: JsonEditorComponent;
  let fixture: ComponentFixture<JsonEditorComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [JsonEditorComponent],
      providers: [
        { provide: ContextService, useValue: { data: signal(new Map()) } },
        { provide: DataService, useValue: {} }
      ]
    });
    await TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JsonEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits the parsed document as a replacement value', () => {
    const emitted: unknown[] = [];
    component.valueChange.subscribe((value) => emitted.push(value));
    component.value = { removeMe: true };
    const target = document.createElement('pre');
    target.innerText = '{"added":true}';
    const event = new Event('blur');
    Object.defineProperty(event, 'target', { value: target });

    component.onTextChange(event);

    expect(emitted).toEqual([{ added: true }]);
  });

  it('reports malformed JSON without emitting a value', () => {
    const emitted: unknown[] = [];
    component.valueChange.subscribe((value) => emitted.push(value));
    const target = document.createElement('pre');
    target.innerText = '{';
    const event = new Event('blur');
    Object.defineProperty(event, 'target', { value: target });

    component.onTextChange(event);

    expect(component.parseError).toContain('Invalid JSON:');
    expect(emitted).toEqual([]);
  });
});
