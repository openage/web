import { describe, expect, it } from 'vitest';
import { ConditionValidatorService } from '../../services/condition-validator.service';
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
