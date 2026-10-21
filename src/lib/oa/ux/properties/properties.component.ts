import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { BuilderValidationError } from '../builder/builder-metadata.model';
import { ConstantService } from '../../core/services/constant.service';
import { BuilderController } from '../builder/builder-controller.model';

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
  schema?: Record<string, PropertiesField[] | { groups: string[] }>;
  data?: Record<string, unknown>;
  lookups?: Record<string, unknown>;
  validationSchema?: Record<string, unknown>;
  validationErrors?: BuilderValidationError[];
  selectionPath?: string;
  [key: string]: unknown;
}

interface PropertyTarget {
  target: string;
  properties?: PropertiesField[];
  groups?: string[];
}

interface PropertyGroupDefinition {
  title?: string;
  properties: PropertiesField[];
}

@Component({
  selector: 'oa-properties',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './properties.component.html'
})
export class PropertiesComponent {
  private readonly constants = inject(ConstantService);
  @Input({ required: true }) builder!: BuilderController;
  @Input() data: Record<string, unknown> = {};
  @Input() set value(value: unknown) {
    this.hasRegistry = Array.isArray(value);
    this.registry = this.hasRegistry ? value as Array<{ target: string; properties: PropertiesField[] }> : [];
    this.refreshProperties();
  }

  @Input() set type(value: string) {
    this.currentType = value;
    this.refreshProperties();
  }

  @Input() set options(value: PropertiesOptions | null | undefined) {
    this.currentOptions = value ?? {};
    this.refreshProperties();
  }

  @Output() readonly dataChange = new EventEmitter<Record<string, unknown>>();

  properties: PropertiesField[] = [];
  private currentType = 'workspace';
  private currentOptions: PropertiesOptions = {};
  private registry: PropertyTarget[] = [];
  private hasRegistry = false;

  get optionsValue(): PropertiesOptions {
    return this.currentOptions;
  }

  get className(): string {
    const value = this.currentOptions['class'];
    return typeof value === 'string' ? value : '';
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
    const segments = this.pathSegments(path);
    let value: unknown = object;
    for (const segment of segments) {
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

    let value: Record<string, unknown> | unknown[] = object;
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

    const finalSegment = segments[segments.length - 1];
    this.writeSegment(value, finalSegment, this.parseJsonInput(input));
    this.dataChange.emit(this.data);
  }

  getLookup(key: string): unknown[] {
    const lookup = this.currentOptions.lookups?.[key];
    if (Array.isArray(lookup)) return lookup;
    const dataLookups = (this.currentOptions['data'] as Record<string, unknown> | undefined)?.['lookups'];
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
    const base = String(this.currentOptions['selectionPath'] || '').replace(/\.(\d+)(?=\.|$)/g, '[$1]');
    const path = `$.${[base, property.key].filter(Boolean).join('.')}`.replace(/\.(\d+)(?=\.|$)/g, '[$1]');
    return (this.currentOptions.validationErrors || []).some((error) => error.path === path);
  }

  validationError(property: PropertiesField): string {
    const base = String(this.currentOptions['selectionPath'] || '').replace(/\.(\d+)(?=\.|$)/g, '[$1]');
    const path = `$.${[base, property.key].filter(Boolean).join('.')}`.replace(/\.(\d+)(?=\.|$)/g, '[$1]');
    return (this.currentOptions.validationErrors || []).find((error) => error.path === path)?.message || '';
  }

  displayValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
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
    if (this.hasRegistry) {
      const target = this.registry.find((entry) => entry.target === this.currentType) ||
        this.registry.find((entry) => entry.target === 'section' && this.currentType !== 'workspace') ||
        this.registry.find((entry) => entry.target === 'item' && this.currentType !== 'workspace') ||
        this.registry.find((entry) => entry.target === 'default');
      this.properties = target ? this.resolveTargetProperties(target) : [];
      return;
    }
    const definitions = this.currentOptions.schema;
    const definition = definitions?.[this.currentType] ??
      (this.currentType !== 'workspace' ? definitions?.['section'] : undefined) ??
      definitions?.['item'] ?? definitions?.['workspace'];
    this.properties = Array.isArray(definition) ? definition : this.resolvePropertyGroups(definition?.groups || []);
  }

  private resolveTargetProperties(target: PropertyTarget): PropertiesField[] {
    const direct = Array.isArray(target.properties) ? target.properties : [];
    return [...this.resolvePropertyGroups(target.groups || []), ...direct];
  }

  private resolvePropertyGroups(groups: string[]): PropertiesField[] {
    const propertyData = this.currentOptions.data?.['properties'];
    const definitions = propertyData && typeof propertyData === 'object' && !Array.isArray(propertyData)
      ? propertyData as Record<string, PropertyGroupDefinition | PropertiesField[]>
      : {};
    return groups.flatMap((name) => {
      const definition = definitions[name];
      if (Array.isArray(definition)) return definition.map((property) => ({ ...property, group: property.group || name }));
      if (!definition || !Array.isArray(definition.properties)) return [];
      return definition.properties.map((property) => ({
        ...property,
        group: property.group || definition.title || name
      }));
    });
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

  private pathSegments(path: string): string[] {
    return path.match(/[^.[\]]+|\[\d+\]/g)?.map((segment) => segment.replace(/^\[|\]$/g, '')) ?? [];
  }

  private readSegment(object: Record<string, unknown> | unknown[], segment: string): unknown {
    return Array.isArray(object)
      ? object[Number(segment)]
      : object[segment];
  }

  private writeSegment(object: Record<string, unknown> | unknown[], segment: string, value: unknown): void {
    if (Array.isArray(object)) {
      object[Number(segment)] = value;
    } else {
      object[segment] = value;
    }
  }

  private parseJsonInput(value: unknown): unknown {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return value;
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return value;
    }
  }
}
