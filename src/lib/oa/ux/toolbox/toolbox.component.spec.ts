import { expect } from 'vitest';
import { ToolboxComponent } from './toolbox.component';
import { BuilderToolbarGroup, BuilderToolbarItem } from '../builder/builder-metadata.model';

describe('ToolboxComponent configured groups', () => {
  const firstTool: BuilderToolbarItem = { code: 'page', title: 'Add page' };
  const secondTool: BuilderToolbarItem = { code: 'service', title: 'Add service' };
  const groups: BuilderToolbarGroup[] = [
    { code: 'navigation', title: 'Navigation', tools: [firstTool] },
    { code: 'services', title: 'Services', tools: [secondTool] }
  ];

  it('selects and places the group matching the input value first', () => {
    const toolbox = new ToolboxComponent();
    toolbox.options = { groups };
    toolbox.value = 'services';

    expect(toolbox.filteredToolGroups.map((group) => group.code)).toEqual(['services', 'navigation']);
    expect(toolbox.groupSelected(toolbox.filteredToolGroups[0])).toBe(true);
    expect(toolbox.groupExpanded(toolbox.filteredToolGroups[0], 0)).toBe(true);
  });

  it('emits only the tool object when dragging starts', () => {
    const toolbox = new ToolboxComponent();
    const emitted: BuilderToolbarItem[] = [];
    toolbox.toolDragStart.subscribe((tool) => emitted.push(tool));

    toolbox.onDragStarted(firstTool);

    expect(emitted).toEqual([firstTool]);
  });

  it('emits only the tool object when selected', () => {
    const toolbox = new ToolboxComponent();
    const emitted: BuilderToolbarItem[] = [];
    toolbox.toolSelected.subscribe((tool) => emitted.push(tool));

    toolbox.selectTool(secondTool);

    expect(emitted).toEqual([secondTool]);
  });

  it('filters tool names across groups without matching group names', () => {
    const toolbox = new ToolboxComponent();
    toolbox.options = { groups };
    toolbox.search.set('service');

    expect(toolbox.filteredToolGroups.map((group) => group.code)).toEqual(['services']);
    expect(toolbox.filteredToolGroups[0].tools).toEqual([secondTool]);

    toolbox.search.set('navigation');
    expect(toolbox.filteredToolGroups).toEqual([]);
  });
});
