import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, Input, inject, signal } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { BuilderController } from '../builder/builder-controller.model';
import { BuilderToolbarGroup, BuilderToolbarItem, BuilderToolboxGroupMetadata } from '../builder/builder-metadata.model';

@Component({
  selector: 'oa-toolbox',
  standalone: true,
  imports: [CommonModule, DragDropModule, IconComponent],
  templateUrl: './toolbox.component.html'
})
export class ToolboxComponent {
  @Input({ required: true }) builder!: BuilderController;
  @Input() options: Record<string, unknown> = {};
  @Input() value: unknown;

  readonly collapsedGroups = signal(new Set<string>());

  get sectionSelected(): boolean {
    const selection = this.builder.selected();
    return !!selection && (selection.type === 'section' ||
      /(?:^|\.)sections\.\d+(?:\.|$)/.test(selection.path));
  }

  get emptyToolsMessage(): string {
    if (this.builder.toolSearch().trim()) return 'No tools match this search.';
    return this.sectionSelected ? 'No tools are configured for this section.' : 'No tools match this search.';
  }

  get toolGroups(): BuilderToolbarGroup[] {
    if (Array.isArray(this.value)) {
      return this.value.filter((group): group is BuilderToolbarGroup =>
        !!group && typeof group === 'object' && Array.isArray((group as BuilderToolbarGroup).items)
      );
    }
    const groups = this.options['groups'];
    if (Array.isArray(groups)) return groups as BuilderToolbarGroup[];
    return this.builder.metadata()?.toolbox.groups ?? [];
  }

  get filteredToolGroups(): BuilderToolbarGroup[] {
    const query = this.builder.toolSearch().trim().toLowerCase();
    const allowedControls = Array.isArray(this.value) ? undefined : this.builder.currentTab()?.allowedControls;
    const selection = this.builder.selected();
    return this.toolGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((tool) => {
          const control = this.itemControl(tool);
          const target = tool.target;
          const exactCollectionTarget = !!target && !['meta', 'components', 'sections'].includes(target);
          const collectionAvailable = !exactCollectionTarget ||
            this.builder.dropListIds().includes(this.builder.dropListId(target!));
          const requiresSection = (tool.targets || (tool.target ? [tool.target] : [])).includes('components');
          const hasComponentTarget = !requiresSection || !!this.builder.componentTargetPath();
          const targetsSelection = collectionAvailable && hasComponentTarget && (!selection || (this.sectionSelected
            ? this.itemTargetsSelectedSection(tool)
            : this.itemTargetsSelectedComponent(tool, selection.item, selection.path)));
          const allowed = !allowedControls || allowedControls.includes(control) ||
            (!!tool.target && allowedControls.includes(tool.code || tool.target));
          const label = tool.title || tool.label || tool.code || control;
          return targetsSelection && allowed &&
            (!query || `${label} ${control} ${group.title}`.toLowerCase().includes(query));
        })
      }))
      .filter((group) => group.items.length > 0);
  }

  groupExpanded(title: string): boolean {
    if (this.builder.toolSearch().trim()) return true;
    const selection = this.builder.selected();
    const group = this.filteredToolGroups.find((candidate) => candidate.title === title);
    if (selection && group?.items.some((item) => this.itemTargetsSelectedSection(item))) return true;
    return !this.collapsedGroups().has(title);
  }

  toggleGroup(title: string): void {
    this.collapsedGroups.update((collapsed) => {
      const next = new Set(collapsed);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  get className(): string {
    return typeof this.options['class'] === 'string' ? this.options['class'] : '';
  }

  onDragStarted(tool: BuilderToolbarItem): void {
    this.builder.startToolDrag(tool);
  }

  onDragEnded(): void {
    this.builder.clearToolDrag();
  }

  itemControl(item: BuilderToolbarItem): string {
    return item.control || item.code || '';
  }

  itemLabel(item: BuilderToolbarItem): string {
    return item.label || item.title || item.code || item.control || 'Add item';
  }

  itemTitle(item: BuilderToolbarItem): string {
    return typeof item['description'] === 'string' ? item['description'] : this.itemLabel(item);
  }

  private itemTargetsSelectedSection(item: BuilderToolbarItem): boolean {
    const targets = item.targets ?? (item.target ? [item.target] : []);
    return targets.some((target) => target === 'components' || target === 'sections');
  }

  private itemTargetsSelectedComponent(item: BuilderToolbarItem, selected: Record<string, unknown>, path: string): boolean {
    const targets = item.targets ?? (item.target ? [item.target] : []);
    const control = typeof selected['control'] === 'string' ? selected['control'] : '';
    const collection = path.replace(/\.\d+(?:\..*)?$/, '');
    return targets.some((target) => target === 'components'
      ? !!this.builder.componentTargetPath()
      : target === collection || (!!control && target === control));
  }

  addItem(item: BuilderToolbarItem): void {
    if (this.builder.toolDragInProgress()) return;
    if (item.target || item.targets?.includes('components') || item.control) {
      this.builder.addConfiguredItem(item);
      return;
    }
    this.builder.addToolFromClick(item as BuilderToolboxGroupMetadata['items'][number]);
  }
}
