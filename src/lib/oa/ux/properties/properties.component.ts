import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { BuilderValidationError } from '../builder/builder-metadata.model';
import { ConstantService } from '../../core/services/constant.service';

interface PropertiesField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'json' | 'html' | 'style' | 'lookup';
  group?: string;
  options?: unknown;
  lookup?: string;
  required?: boolean;
  minLength?: number;
  description?: string;
  [key: string]: unknown;
}

interface PropertiesOptions {
  types?: Record<string, PropertiesField[]>;
  data?: Record<string, unknown>;
  lookups?: Record<string, unknown>;
  validationSchema?: Record<string, unknown>;
  validationErrors?: BuilderValidationError[];
  selectionPath?: string;
  [key: string]: unknown;
}

@Component({
  selector: 'oa-properties',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './properties.component.html'
})
export class PropertiesComponent {
  private readonly constants = inject(ConstantService);

  private currentValue: Record<string, unknown> = {};

  @Input() set value(value: Record<string, unknown> | null | undefined) {
    this.currentValue = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    this.refreshProperties();
  }
  get value(): Record<string, unknown> {
    return this.currentValue;
  }

  @Input() set type(value: string) {
    this.currentType = value;
    this.refreshProperties();
  }

  @Input() set options(value: PropertiesOptions | null | undefined) {
    this.currentOptions = value ?? {};
    this.refreshProperties();
  }
  @Output() readonly valueChange = new EventEmitter<Record<string, unknown>>();

  properties: PropertiesField[] = [];
  rawComponentError = '';
  private currentType = 'workspace';
  private currentOptions: PropertiesOptions = {};

  get className(): string {
    const value = this.currentOptions['class'];
    return typeof value === 'string' ? value : '';
  }

  get title(): string {
    return String(this.currentOptions['title'] || 'Properties');
  }

  get selectionType(): string {
    return this.currentType;
  }

  get hasPropertyFields(): boolean {
    return this.properties.length > 0;
  }

  jsonValue(value: unknown): string {
    return JSON.stringify(value ?? {}, null, 2) ?? '';
  }

  getGroups(): Array<{ name: string; properties: PropertiesField[] }> {
    const groups = new Map<string, PropertiesField[]>();
    for (const property of this.properties) {
      const name = property.group || 'General';
      const properties = groups.get(name) ?? [];
      properties.push(property);
      groups.set(name, properties);
    }
    return Array.from(groups, ([name, properties]) => ({ name, properties }));
  }

  getValue(object: unknown, path: string): unknown {
    if (!path || !object || typeof object !== 'object') return '';
    let value: unknown = object;
    for (const segment of this.pathSegments(path)) {
      if (!value || typeof value !== 'object') return '';
      value = Array.isArray(value)
        ? value[Number(segment)]
        : (value as Record<string, unknown>)[segment];
    }
    return value ?? '';
  }

  setValue(object: Record<string, unknown>, path: string, input: unknown): void {
    const segments = this.pathSegments(path);
    if (!segments.length) return;

    const updated = structuredClone(object);
    let value: Record<string, unknown> | unknown[] = updated;
    for (let index = 0; index < segments.length - 1; index++) {
      const segment = segments[index];
      const nextSegment = segments[index + 1];
      let child = this.readSegment(value, segment);
      if (!child || typeof child !== 'object') {
        child = /^\d+$/.test(nextSegment) ? [] : {};
        this.writeSegment(value, segment, child);
      }
      value = child as Record<string, unknown> | unknown[];
    }

    this.writeSegment(value, segments[segments.length - 1], input);
    this.valueChange.emit(updated);
    this.rawComponentError = '';
  }

  updateProperty(property: PropertiesField, event: Event): void {
    const target = event.target;
    if (property.type === 'boolean' && target instanceof HTMLInputElement) {
      this.setValue(this.currentValue, property.key, target.checked);
      return;
    }
    if (property.type === 'json' && target instanceof HTMLTextAreaElement) {
      try {
        this.setValue(this.currentValue, property.key, JSON.parse(target.value) as unknown);
      } catch (error) {
        this.rawComponentError = error instanceof Error ? error.message : 'Invalid JSON.';
      }
      return;
    }
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
      this.setValue(this.currentValue, property.key,
        property.type === 'number' && target.value !== '' ? Number(target.value) : target.value);
    }
  }

  getLookup(key: string): unknown[] {
    const lookup = this.currentOptions.lookups?.[key];
    if (Array.isArray(lookup)) return lookup;
    const dataLookups = this.currentOptions.data?.['lookups'];
    const configured = dataLookups && typeof dataLookups === 'object'
      ? (dataLookups as Record<string, unknown>)[key]
      : undefined;
    if (Array.isArray(configured)) return configured;
    const list = this.constants.lists.get(key);
    if (Array.isArray(list)) return list;
    if (list && typeof list === 'object') {
      const entries = (list as Record<string, unknown>)['items'] ?? (list as Record<string, unknown>)['data'];
      return Array.isArray(entries) ? entries : [];
    }
    return [];
  }

  lookupKey(property: PropertiesField): string | undefined {
    if (property.lookup) return property.lookup;
    const options = property.options && typeof property.options === 'object'
      ? property.options as Record<string, unknown>
      : undefined;
    const data = options?.['data'] as Record<string, unknown> | undefined;
    const config = data?.['config'] as Record<string, unknown> | undefined;
    return typeof config?.['lookup'] === 'string' ? config['lookup'] : undefined;
  }

  selectOptions(property: PropertiesField): unknown[] {
    const lookup = this.lookupKey(property);
    if (lookup) return this.getLookup(lookup);
    return Array.isArray(property.options) ? property.options : [];
  }

  fieldRequired(property: PropertiesField): boolean {
    return !!property.required || this.fieldSchema(property)?.['required'] === true ||
      this.isSchemaRequired(property.key);
  }

  fieldMinLength(property: PropertiesField): number | null {
    const descriptorValue = property.minLength;
    const schemaValue = this.fieldSchema(property)?.['minLength'];
    return typeof descriptorValue === 'number' ? descriptorValue :
      typeof schemaValue === 'number' ? schemaValue : null;
  }

  hasValidationError(property: PropertiesField): boolean {
    const path = this.validationPath(property);
    return (this.currentOptions.validationErrors || []).some((error) => error.path === path);
  }

  validationError(property: PropertiesField): string {
    const path = this.validationPath(property);
    return (this.currentOptions.validationErrors || []).find((error) => error.path === path)?.message || '';
  }

  displayValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    return typeof value === 'object' ? JSON.stringify(value, null, 2) ?? '' : String(value);
  }

  optionValue(option: unknown): string {
    if (option && typeof option === 'object') {
      const item = option as Record<string, unknown>;
      return this.displayValue(item['value'] ?? item['code'] ?? item['id'] ?? option);
    }
    return this.displayValue(option);
  }

  optionLabel(option: unknown): string {
    if (option && typeof option === 'object') {
      const item = option as Record<string, unknown>;
      return this.displayValue(item['title'] ?? item['label'] ?? item['name'] ?? item['value'] ?? item['code']);
    }
    return this.displayValue(option);
  }

  private refreshProperties(): void {
    const configured = this.currentOptions.types?.[this.currentType] ??
      this.currentOptions.types?.['default'];
    this.properties = configured ?? this.inferProperties(this.currentValue);
  }

  private inferProperties(value: Record<string, unknown>): PropertiesField[] {
    return Object.entries(value).map(([key, current]) => ({
      key,
      label: key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase()),
      type: typeof current === 'boolean' ? 'boolean'
        : typeof current === 'number' ? 'number'
          : current !== null && typeof current === 'object' ? 'json'
            : 'text'
    }));
  }

  private fieldSchema(property: PropertiesField): Record<string, unknown> | undefined {
    let schema: Record<string, unknown> | undefined = this.currentOptions.validationSchema;
    const selectedPath = String(this.currentOptions['selectionPath'] || '');
    for (const segment of this.pathSegments(selectedPath)) {
      if (/^\d+$/.test(segment)) {
        schema = schema?.['items'] as Record<string, unknown> | undefined;
      } else {
        const properties = schema?.['properties'] as Record<string, Record<string, unknown>> | undefined;
        schema = properties?.[segment];
      }
    }
    for (const segment of this.pathSegments(property.key)) {
      const properties = schema?.['properties'] as Record<string, Record<string, unknown>> | undefined;
      schema = properties?.[segment];
    }
    return schema;
  }

  private isSchemaRequired(key: string): boolean {
    let schema: Record<string, unknown> | undefined = this.currentOptions.validationSchema;
    const path = this.pathSegments(
      [String(this.currentOptions['selectionPath'] || ''), key].filter(Boolean).join('.')
    );
    for (const segment of path) {
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

  private validationPath(property: PropertiesField): string {
    const base = String(this.currentOptions['selectionPath'] || '').replace(/\.(\d+)(?=\.|$)/g, '[$1]');
    return `$.${[base, property.key].filter(Boolean).join('.')}`.replace(/\.(\d+)(?=\.|$)/g, '[$1]');
  }

  private pathSegments(path: string): string[] {
    return path.match(/[^.[\]]+|\[\d+\]/g)?.map((segment) => segment.replace(/^\[|\]$/g, '')) ?? [];
  }

  private readSegment(object: Record<string, unknown> | unknown[], segment: string): unknown {
    return Array.isArray(object) ? object[Number(segment)] : object[segment];
  }

  private writeSegment(object: Record<string, unknown> | unknown[], segment: string, value: unknown): void {
    if (Array.isArray(object)) object[Number(segment)] = value;
    else object[segment] = value;
  }
}
