export interface BuilderCanvasSectionMetadata {
  code: string;
  title: string;
  path: string;
  target?: string;
  group?: string;
  optional?: boolean;
  targets?: string[];
  itemType?: string;
  itemAction?: { label: string; url: string };
}

export interface BuilderToolMetadata extends BuilderToolbarItem {
  code: string;
  type: string;
  title: string;
  icon: string;
  category: string;
  description?: string;
  defaultProperties: Record<string, unknown>;
}

export interface BuilderToolbarItem {
  code?: string;
  target?: string;
  targets?: string[];
  control?: string;
  icon?: string;
  title?: string;
  label?: string;
  value?: unknown;
  options?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface BuilderToolbarGroup {
  code: string;
  title: string;
  icon?: string;
  tools: BuilderToolbarItem[];
}

export interface BuilderToolboxGroupMetadata extends BuilderToolbarGroup {
  tools: BuilderToolMetadata[];
}

export interface BuilderPropertyMetadata {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'json' | 'html' | 'style' | 'lookup';
  options?: string[];
  required?: boolean;
  description?: string;
  group?: string;
  [key: string]: unknown;
}

export interface BuilderMetadata {
  title: string;
  icon: string;
  itemCollectionPath: string;
  itemLabel: string;
  dataKey?: string;
  persistence?: { service: string; collection: string; idPath?: string };
  preview?: { layoutPath: string; componentsPath?: string };
  auxiliaryCollections?: Array<{ path: string; title: string }>;
  canvasSections?: BuilderCanvasSectionMetadata[];
  toolbox: { groups: BuilderToolboxGroupMetadata[] };
  propertySchemas: Record<string, BuilderPropertyMetadata[]>;
  validationSchema: Record<string, unknown>;
  defaultData: Record<string, unknown>;
}

export interface BuilderSelection {
  type: string;
  item: Record<string, unknown>;
  index: number;
  path: string;
}

export interface BuilderValidationError {
  path: string;
  message: string;
  suggestion?: string;
}
