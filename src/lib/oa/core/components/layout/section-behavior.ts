import { ConditionValidatorService } from '../../services/condition-validator.service';

export function sectionConditionMatches(
    condition: any,
    data: any,
    validator: ConditionValidatorService
): boolean {
    if (condition === undefined || condition === null) {
        return true;
    }
    if (typeof condition === 'boolean') {
        return condition;
    }
    return !!validator.check(data, condition);
}

export function isSectionExpanded(section: any): boolean {
    return !section?.collapsible || section.expanded !== false;
}

export function toggleSection(section: any): void {
    if (section?.collapsible) {
        section.expanded = !isSectionExpanded(section);
    }
}

export function getSectionPopupButtonLabel(popup: any, title: string): string {
    if (typeof popup === 'string') {
        return popup;
    }
    return popup?.buttonLabel || `Open ${title || 'section'}`;
}
