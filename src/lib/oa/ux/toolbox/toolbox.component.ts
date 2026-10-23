import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { BuilderToolbarGroup, BuilderToolbarItem } from '../builder/builder-metadata.model';

export interface ToolboxDrag {
  groupCode: string;
  tool: BuilderToolbarItem;
}

@Component({
  selector: 'oa-toolbox',
  standalone: true,
  imports: [CommonModule, DragDropModule, IconComponent],
  templateUrl: './toolbox.component.html'
})
export class ToolboxComponent {
  @Input() options: Record<string, unknown> = {};
  @Input() value = '';
  @Input() connectedTo: string[] = [];
  @Input() disabled = false;
  @Input() workspaceType = 'Workspace';

  @Output() readonly toolDragStart = new EventEmitter<BuilderToolbarItem>();
  @Output() readonly toolDragEnd = new EventEmitter<void>();
  @Output() readonly toolSelected = new EventEmitter<BuilderToolbarItem>();

  readonly collapsedGroups = signal(new Set<string>());
  readonly search = signal('');

  get toolGroups(): BuilderToolbarGroup[] {
    const configured = this.options['groups'];
    if (!Array.isArray(configured)) return [];
    return configured.filter((group): group is BuilderToolbarGroup =>
      !!group && typeof group === 'object' &&
      typeof (group as Record<string, unknown>)['code'] === 'string' &&
      !!((group as Record<string, unknown>)['code'] as string).trim() &&
      typeof (group as Record<string, unknown>)['title'] === 'string' &&
      !!((group as Record<string, unknown>)['title'] as string).trim() &&
      Array.isArray((group as Record<string, unknown>)['tools'])
    );
  }

  get filteredToolGroups(): BuilderToolbarGroup[] {
    const query = this.search().trim().toLowerCase();
    return this.toolGroups
      .map((group) => ({
        ...group,
        tools: group.tools.filter((tool) => !query ||
          `${tool.title || ''} ${tool.label || ''} ${tool.code || ''} ${tool.control || ''}`.toLowerCase().includes(query))
      }))
      .filter((group) => group.tools.length > 0)
      .sort((left, right) => Number(right.code === this.value) - Number(left.code === this.value));
  }

  get className(): string {
    return typeof this.options['class'] === 'string' ? this.options['class'] : '';
  }

  get emptyToolsMessage(): string {
    return this.search().trim() ? 'No tools match this search.' : 'No tools are configured for this section.';
  }

  groupCode(group: BuilderToolbarGroup, index: number): string {
    return group.code || `group-${index}`;
  }

  groupSelected(group: BuilderToolbarGroup): boolean {
    return group.code === this.value;
  }

  groupExpanded(group: BuilderToolbarGroup, index: number): boolean {
    if (this.search().trim() || this.groupSelected(group)) return true;
    return !this.collapsedGroups().has(this.groupCode(group, index));
  }

  toggleGroup(group: BuilderToolbarGroup, index: number): void {
    const code = this.groupCode(group, index);
    this.collapsedGroups.update((collapsed) => {
      const next = new Set(collapsed);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  onDragStarted(tool: BuilderToolbarItem): void {
    this.toolDragStart.emit(tool);
  }

  onDragEnded(): void {
    this.toolDragEnd.emit();
  }

  selectTool(tool: BuilderToolbarItem): void {
    this.toolSelected.emit(tool);
  }

  itemLabel(item: BuilderToolbarItem): string {
    return item.label || item.title || item.code || item.control || 'Add item';
  }

  itemTitle(item: BuilderToolbarItem): string {
    return typeof item['description'] === 'string' ? item['description'] : this.itemLabel(item);
  }

}
