export type WorkspaceMode = 'viewer' | 'editor' | 'code' | 'summary' | 'wysiwyg' | 'structure' | 'json' | 'config';

export interface BuilderSectionMetadata {
  code: string;
  title: string;
  type: string;
  enabled?: boolean;
}

export interface BuilderCanvasSectionMetadata {
  code: string;
  title: string;
  path: string;
  group?: string;
  optional?: boolean;
  targets?: string[];
}

export interface BuilderTabMetadata {
  code: string;
  title: string;
  icon: string;
  sections: BuilderSectionMetadata[];
  type?: string;
  value?: string;
  items?: BuilderTabMetadata[];
  allowedControls?: string[];
  workspaceMode?: WorkspaceMode;
  workspacePath?: string;
  sectionCode?: string;
}

export interface BuilderToolMetadata extends BuilderToolbarItem {
  code: string;
  type: string;
  title: string;
  icon: string;
  category: string;
  description?: string;
  defaultProperties: Record<string, unknown>;
  allowedDropTargets: string[];
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
  title: string;
  icon?: string;
  items: BuilderToolbarItem[];
}

export interface BuilderToolboxGroupMetadata extends BuilderToolbarGroup {
  code: string;
  items: BuilderToolMetadata[];
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
  workspaceType: string;
  title: string;
  icon: string;
  itemCollectionPath: string;
  itemLabel: string;
  auxiliaryCollections?: Array<{ path: string; title: string }>;
  actions: BuilderTabMetadata[];
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
