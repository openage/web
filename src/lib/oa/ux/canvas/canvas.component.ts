import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CdkDrag, CdkDropList, CdkDragDrop } from '@angular/cdk/drag-drop';
import { ContextService } from '../../core/services/context.service';
import { IconComponent } from '../icon/icon.component';
import { BuilderToolbarItem } from '../builder/builder-metadata.model';

export interface CanvasSelection {
  code: string;
  sectionCode: string;
  groupCode?: string;
  value: unknown;
  path: string;
  index: number;
}

export interface CanvasToolDrop {
  sectionCode: string;
  targetPath: string;
  tool: BuilderToolbarItem;
}

export interface CanvasItemAction {
  action: 'move-up' | 'move-down' | 'duplicate' | 'delete';
  selection: Omit<CanvasSelection, 'value'> & { value: Record<string, unknown> };
}

interface CanvasSection {
  code: string;
  title: string;
  path: string;
  target?: string;
  targets?: string[];
  group?: string;
  optional?: boolean;
  itemType?: string;
  itemAction?: { label: string; url: string };
}

export interface ToolboxDrag {
  groupCode: string;
  tool: BuilderToolbarItem;
}

export interface CanvasItemDrop {
  event: CdkDragDrop<Record<string, unknown>[]>;
  targetPath: string;
}

@Component({
  selector: 'oa-canvas',
  standalone: true,
  imports: [CommonModule, CdkDrag, CdkDropList, IconComponent],
  templateUrl: './canvas.component.html'
})
export class CanvasComponent {
  private readonly context = inject(ContextService);

  @Input() value: unknown;
  @Input() options: Record<string, unknown> = {};
  @Input() selection: CanvasSelection | null = null;
  @Input() activeTool: ToolboxDrag | null = null;
  @Input() toolboxDropListIds: string[] = [];
  @Input() validationErrors: Array<{ path: string; message: string }> = [];
  @Input() loadError = '';

  @Output() readonly sectionSelected = new EventEmitter<CanvasSelection>();
  @Output() readonly toolDropped = new EventEmitter<CanvasToolDrop>();
  @Output() readonly itemDropped = new EventEmitter<CanvasItemDrop>();
  @Output() readonly itemAction = new EventEmitter<CanvasItemAction>();

  get className(): string {
    return typeof this.options['class'] === 'string' ? this.options['class'] : '';
  }

  get canvasSections(): CanvasSection[] {
    const sections = this.options['sections'];
    return Array.isArray(sections)
      ? sections.filter((section): section is CanvasSection =>
        !!section && typeof section === 'object' && !Array.isArray(section) &&
        typeof (section as Record<string, unknown>)['code'] === 'string' &&
        typeof (section as Record<string, unknown>)['path'] === 'string')
      : [{ code: 'workspace', title: 'Workspace', path: '', target: 'workspace' }];
  }

  get workspaceData(): Record<string, unknown> {
    const source = this.resolveDataSource();
    return source && typeof source === 'object' && !Array.isArray(source)
      ? source as Record<string, unknown>
      : {};
  }

  get title(): string {
    return String(this.options['title'] || 'Workspace');
  }

  get visibleSections(): CanvasSection[] {
    return this.canvasSections.filter((section) => this.sectionAvailable(section));
  }

  get canvasDropListIds(): string[] {
    return this.visibleSections.flatMap((section) => {
      const value = this.sectionValue(section);
      const collection = this.objectItems(value);
      const ids = Array.isArray(value)
        ? [this.sectionDropListId(section)]
        : [this.sectionDropZoneId(section)];
      collection.forEach((item, index) => {
        if (Array.isArray(item['components'])) {
          ids.push(this.sectionDropListId(section, `${section.path}.${index}.components`));
        }
      });
      return ids;
    });
  }

  sectionAvailable(section: CanvasSection): boolean {
    return !section.optional || this.sectionValue(section) !== undefined || this.isDropTargetAtPath(section, section.path);
  }

  sectionValue(section: CanvasSection): unknown {
    return this.getPathValue(this.workspaceData, section.path);
  }

  sectionDropListId(section: CanvasSection, path = ''): string {
    return `oa-canvas-${this.normalizeId(section.code)}${path ? `-${this.normalizeId(path)}` : ''}`;
  }

  sectionDropZoneId(section: CanvasSection): string {
    return `${this.sectionDropListId(section)}-section`;
  }

  isDropTarget(section: CanvasSection): boolean {
    const drag = this.activeTool;
    if (!drag) return false;
    const toolTargets = this.toolTargets(drag.tool, drag.groupCode);
    const sectionTargets = section.targets ?? (section.target ? [section.target] : [section.code]);
    return toolTargets.some((target) => {
      if (drag.tool.target === 'meta' && this.getPathValue(this.workspaceData, target) !== undefined) return false;
      const metadataPathMatches = target.startsWith('meta.') &&
        (section.path === target ||
          (!!section.path && target.startsWith(`${section.path}.`)) ||
          (!section.path && drag.tool.target === 'meta'));
      return sectionTargets.includes(target) ||
        metadataPathMatches;
    });
  }

  selectSection(section: CanvasSection): void {
    const value = this.sectionValue(section);
    this.emitSelection(section, value, section.path, -1);
  }

  selectItem(item: Record<string, unknown>, section: CanvasSection, path: string, index: number): void {
    this.emitSelection(section, item, path, index);
  }

  onDrop(event: CdkDragDrop<Record<string, unknown>[]>, section: CanvasSection, targetPath = section.path): void {
    const drag = event.item.data as ToolboxDrag | undefined;
    if (drag && typeof drag === 'object' && 'tool' in drag) {
      if (this.isDropTargetAtPath(section, targetPath)) {
        this.toolDropped.emit({ sectionCode: section.code, targetPath, tool: drag.tool });
      }
      return;
    }
    this.itemDropped.emit({ event, targetPath });
  }

  isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
  }

  isObject(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  objectItems(value: unknown): Record<string, unknown>[] {
    return Array.isArray(value)
      ? value.filter((item): item is Record<string, unknown> =>
        !!item && typeof item === 'object' && !Array.isArray(item))
      : [];
  }

  itemPath(parentPath: string, index: number): string {
    return parentPath ? `${parentPath}.${index}` : String(index);
  }

  childCollections(item: Record<string, unknown>): Array<{ key: string; items: Record<string, unknown>[] }> {
    return ['sections', 'components', 'items'].flatMap((key) => {
      const value = item[key];
      return Array.isArray(value) && value.every((child) =>
        !!child && typeof child === 'object' && !Array.isArray(child))
        ? [{ key, items: value as Record<string, unknown>[] }]
        : [];
    });
  }

  itemLabel(item: Record<string, unknown>, index: number): string {
    return String(item['title'] || item['label'] || item['name'] || item['code'] || `Item ${index + 1}`);
  }

  itemType(item: Record<string, unknown>, section?: CanvasSection): string {
    return String(item['control'] || item['type'] || section?.itemType || section?.target || 'Item');
  }

  itemActionUrl(item: Record<string, unknown>, action: CanvasSection['itemAction']): string {
    const code = item['code'];
    return action && typeof code === 'string' && code
      ? action.url.replaceAll('{code}', encodeURIComponent(code))
      : '';
  }

  isSelected(path: string): boolean {
    return this.selection?.path === path;
  }

  performItemAction(action: CanvasItemAction['action'], item: Record<string, unknown>, section: CanvasSection,
    path: string, index: number): void {
    this.sectionSelected.emit({
      code: this.selectionCode(section, item),
      sectionCode: section.code,
      groupCode: typeof section.group === 'string' ? section.group : undefined,
      value: item,
      path,
      index
    });
    this.itemAction.emit({
      action,
      selection: {
        code: this.selectionCode(section, item),
        sectionCode: section.code,
        groupCode: typeof section.group === 'string' ? section.group : undefined,
        value: item,
        path,
        index
      }
    });
  }

  validationError(path: string): string | undefined {
    return this.validationErrors.find((error) => error.path === path)?.message;
  }

  trackByCode(index: number, item: Record<string, unknown>): string | number {
    return String(item['code'] || index);
  }

  private resolveDataSource(): unknown {
    if (typeof this.value !== 'string') return this.value;
    const [source, ...path] = this.value.split('.');
    let value = this.context.data().get(source);
    for (const segment of path) {
      if (!value || typeof value !== 'object') return undefined;
      value = (value as Record<string, unknown>)[segment];
    }
    return value;
  }

  private getPathValue(source: Record<string, unknown>, path: string): unknown {
    if (!path) return source;
    let value: unknown = source;
    for (const segment of path.match(/[^.[\]]+|\[\d+\]/g) || []) {
      const key = segment.replace(/^\[|\]$/g, '');
      if (!value || typeof value !== 'object') return undefined;
      value = Array.isArray(value) ? value[Number(key)] : (value as Record<string, unknown>)[key];
    }
    return value;
  }

  private emitSelection(section: CanvasSection, value: unknown, path: string, index: number): void {
    this.sectionSelected.emit({
      code: this.selectionCode(section, value),
      sectionCode: section.code,
      groupCode: typeof section.group === 'string' ? section.group : undefined,
      value,
      path,
      index
    });
  }

  private selectionCode(section: CanvasSection, value: unknown): string {
    const selectedValue = this.isObject(value) ? value : undefined;
    return String(selectedValue?.['control'] || section.target || selectedValue?.['type'] || section.code);
  }

  private toolTargets(tool: BuilderToolbarItem, groupCode: string): string[] {
    if (Array.isArray(tool.targets) && tool.targets.length) return tool.targets;
    if (typeof tool.target === 'string' && tool.target !== 'meta') return [tool.target];
    if (tool.target === 'meta' && typeof tool.code === 'string') return [`meta.${tool.code}`];
    return groupCode ? [groupCode] : [];
  }

  isDropTargetAtPath(section: CanvasSection, path: string): boolean {
    const drag = this.activeTool;
    if (!drag) return false;
    const targets = this.toolTargets(drag.tool, drag.groupCode);
    if (path.endsWith('.components')) return targets.includes('components');
    if (path.endsWith('.sections')) return targets.includes('sections');
    return this.isDropTarget(section);
  }

  private normalizeId(value: string): string {
    return value.replace(/[^a-zA-Z0-9_-]/g, '-');
  }
}
