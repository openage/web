import { Signal, WritableSignal } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import {
  BuilderMetadata,
  BuilderPropertyMetadata,
  BuilderSelection,
  BuilderTabMetadata,
  BuilderToolboxGroupMetadata,
  BuilderValidationError
} from './builder-metadata.model';

export interface BuilderController {
  readonly pageCode: Signal<string>;
  readonly workspaceType: Signal<string>;
  readonly appSource: Signal<string | undefined>;
  readonly workspaceData: WritableSignal<Record<string, unknown>>;
  readonly metadata: Signal<BuilderMetadata | null>;
  readonly currentTab: Signal<BuilderTabMetadata | null>;
  readonly rootItems: Signal<Record<string, unknown>[]>;
  readonly workspaceTitle: Signal<string>;
  readonly activeTab: Signal<string>;
  readonly selected: Signal<BuilderSelection | null>;
  readonly activeTool: Signal<import('./builder-metadata.model').BuilderToolbarItem | null>;
  readonly dropListIds: Signal<string[]>;
  readonly selectedLabel: Signal<string>;
  readonly dirty: Signal<boolean>;
  readonly saved: Signal<boolean>;
  readonly lastSavedAt: Signal<string>;
  readonly loading: WritableSignal<boolean>;
  readonly loadError: WritableSignal<string>;
  readonly propertyError: Signal<string>;
  readonly toolSearch: WritableSignal<string>;
  readonly toolDragInProgress: WritableSignal<boolean>;
  readonly toolboxCollapsed: WritableSignal<boolean>;
  readonly propertiesCollapsed: WritableSignal<boolean>;
  readonly darkMode: Signal<boolean>;
  readonly sourceEditorOpen: WritableSignal<boolean>;
  readonly sourceText: Signal<string>;
  readonly sourceError: Signal<string>;
  readonly validationErrors: Signal<BuilderValidationError[]>;
  readonly workspaceValid: Signal<boolean>;
  readonly rawJson: Signal<string>;
  readonly filteredToolGroups: Signal<BuilderToolboxGroupMetadata[]>;
  readonly propertyDefinitions: Signal<BuilderPropertyMetadata[]>;
  readonly flattenedItems: Signal<Array<{ item: Record<string, unknown>; path: string }>>;

  getBuilderPath(target: unknown, path: string): unknown;
  setBuilderPath(target: Record<string, unknown>, path: string, value: unknown): void;
  workspaceValue(path: string): unknown;
  workspaceJson(path: string): string;
  updateWorkspaceData(data: Record<string, unknown>): void;
  normalizeWorkspace(source: Record<string, unknown>): Record<string, unknown>;
  updateWorkspaceValue(path: string, value: unknown): void;
  updateWorkspaceJson(path: string, event: Event): void;
  selectWorkspace(): void;
  selectTab(code: string): void;
  toggleToolbox(): void;
  toggleProperties(): void;
  addToolFromClick(tool: BuilderToolboxGroupMetadata['items'][number]): void;
  addConfiguredItem(item: import('./builder-metadata.model').BuilderToolbarItem, targetPath?: string): void;
  hasValidationError(path: string): boolean;
  validationErrorForPath(path: string): string;
  schemaRequired(path: string): boolean;
  schemaMinLength(path: string): number | null;
  clearToolDrag(): void;
  startToolDrag(tool: import('./builder-metadata.model').BuilderToolbarItem): void;
  canDropToolAt(tool: import('./builder-metadata.model').BuilderToolbarItem, targetPath: string): boolean;
  isDropTarget(targetPath: string): boolean;
  componentTargetPath(): string | undefined;
  dropListId(path: string): string;
  saveDraft(): Promise<void>;
  validateWorkspace(): void;
  openSourceEditor(): void;
  closeSourceEditor(): void;
  toggleTheme(): void;
  closeBuilder(): void;
  selectItem(item: Record<string, unknown>, path: string, index: number): void;
  updateProperty(propertyPath: string, value: unknown): void;
  updateJsonProperty(propertyPath: string, event: Event): void;
  inputValue(propertyPath: string): string;
  moveSelection(delta: -1 | 1): void;
  removeSelection(): void;
  applySourceChanges(): void;
  updateSourceText(event: Event): void;
  trackByCode(index: number, item: Record<string, unknown>): string | number;
  childItems(item: Record<string, unknown>, key: 'sections' | 'components'): Record<string, unknown>[];
  itemsAt(path: string): Record<string, unknown>[];
  itemPath(parentPath: string, index: number): string;
  drop<T>(event: CdkDragDrop<T[]>, targetPath: string): void;
}
