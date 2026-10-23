import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ContextService } from '../../core/services/context.service';
import { DataService } from '../../core/services/data.service';
import { JsonEditorComponent } from './json-editor.component';
import { vi } from 'vitest';

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

  it('uses a textarea and parses valid JSON as the user types', () => {
    fixture.destroy();
    fixture = TestBed.createComponent(JsonEditorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('value', { title: 'Old' });
    fixture.detectChanges();

    const emitted: unknown[] = [];
    component.valueChange.subscribe((value) => emitted.push(value));

    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement | null;
    expect(textarea).not.toBeNull();
    const input = document.createElement('textarea');
    input.value = '{"title":"New"}';
    component.onTextChange({ target: input } as unknown as Event);

    expect(emitted).toEqual([{ title: 'New' }]);
    expect(component.parseError).toBe('');
  });

  it('keeps invalid source text visible without emitting a replacement value', () => {
    const emitted: unknown[] = [];
    component.valueChange.subscribe((value) => emitted.push(value));
    component.value = { title: 'Saved' };
    component.ngOnChanges();
    const input = document.createElement('textarea');
    input.value = '{';
    component.onTextChange({ target: input } as unknown as Event);

    expect(component.parseError).toContain('Invalid JSON:');
    expect(emitted).toEqual([]);
  });

  it('inserts two spaces for Tab while keeping the textarea editable', () => {
    const textarea = document.createElement('textarea');
    textarea.value = '{}';
    textarea.setSelectionRange(1, 1);
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    Object.defineProperty(event, 'target', { value: textarea });

    component.onKeydown(event);

    expect(event.defaultPrevented).toBe(true);
    expect(textarea.value).toBe('{  }');
    expect(textarea.selectionStart).toBe(3);
  });

  it('lets keyboard users leave the editor with Escape and Shift+Tab', () => {
    const textarea = document.createElement('textarea');
    const blur = vi.spyOn(textarea, 'blur');
    const escape = new KeyboardEvent('keydown', { key: 'Escape' });
    Object.defineProperty(escape, 'target', { value: textarea });
    component.onKeydown(escape);
    expect(blur).toHaveBeenCalledTimes(1);

    const shiftTab = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true });
    Object.defineProperty(shiftTab, 'target', { value: textarea });
    component.onKeydown(shiftTab);
    expect(shiftTab.defaultPrevented).toBe(false);
  });
});
