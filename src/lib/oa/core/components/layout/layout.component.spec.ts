import { describe, expect, it } from 'vitest';
import { ConditionValidatorService } from '../../services/condition-validator.service';
import { LayoutComponent } from './layout.component';
import {
  getSectionPopupButtonLabel,
  isSectionExpanded,
  sectionConditionMatches,
  toggleSection
} from './section-behavior';

describe('section behavior', () => {
  const validator = new ConditionValidatorService();

  it('matches conditions against page data', () => {
    const data = { party: { type: 'company' } };
    expect(sectionConditionMatches({ key: 'party.type', operator: '==', value: 'company' }, data, validator)).toBe(true);
    expect(sectionConditionMatches({ key: 'party.type', operator: '==', value: 'person' }, data, validator)).toBe(false);
  });

  it('supports boolean conditions and defaults to visible without a condition', () => {
    expect(sectionConditionMatches(undefined, {}, validator)).toBe(true);
    expect(sectionConditionMatches(false, {}, validator)).toBe(false);
  });

  it('defaults collapsible sections to expanded and toggles their state', () => {
    const section = { collapsible: true };

    expect(isSectionExpanded(section)).toBe(true);
    toggleSection(section);
    expect(isSectionExpanded(section)).toBe(false);
    toggleSection(section);
    expect(isSectionExpanded(section)).toBe(true);
  });

  it('honors collapsed defaults and uses configured popup button labels', () => {
    expect(isSectionExpanded({ collapsible: true, expanded: false })).toBe(false);
    expect(getSectionPopupButtonLabel({ buttonLabel: 'Edit classification' }, 'Classification')).toBe('Edit classification');
    expect(getSectionPopupButtonLabel(true, 'Classification')).toBe('Open Classification');
  });
});

describe('layout tab navigation', () => {
  it('moves focus and selects tabs with arrow and boundary keys', () => {
    const component = Object.create(LayoutComponent.prototype) as LayoutComponent;
    const selectedTabs: unknown[] = [];
    component.selectSection = (section: unknown) => selectedTabs.push(section);
    const tabs = [
      { code: 'viewer', selected: true },
      { code: 'editor', selected: false },
      { code: 'code', selected: false }
    ];
    const section = { code: 'builder-views', type: 'tabbed', sections: tabs };
    const tabList = document.createElement('div');
    const elements = tabs.map((tab, index) => {
      const element = document.createElement('div');
      element.id = `${tab.code}-tab`;
      element.setAttribute('role', 'tab');
      element.tabIndex = index === 0 ? 0 : -1;
      element.addEventListener('keydown', (event) =>
        component.onTabKeydown(event, section, tab)
      );
      tabList.appendChild(element);
      return element;
    });
    document.body.appendChild(tabList);

    elements[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(selectedTabs.at(-1)).toBe(tabs[1]);
    expect(document.activeElement).toBe(elements[1]);

    elements[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(selectedTabs.at(-1)).toBe(tabs[2]);
    expect(document.activeElement).toBe(elements[2]);

    elements[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(selectedTabs.at(-1)).toBe(tabs[0]);
    expect(document.activeElement).toBe(elements[0]);

    tabList.remove();
  });
});
