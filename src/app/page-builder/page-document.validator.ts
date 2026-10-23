export interface PageValidationResult {
  errors: string[];
  warnings: string[];
}

type JsonObject = Record<string, unknown>;

const knownControls = new Set(['html', 'form']);

function isObject(value: unknown): value is JsonObject {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function pageHtml(value: unknown): Array<{ path: string; html: string }> {
  if (!isObject(value) || !isObject(value['meta']) || !isObject(value['meta']['layout']) ||
    !Array.isArray(value['meta']['layout']['sections'])) return [];
  const fragments: Array<{ path: string; html: string }> = [];
  value['meta']['layout']['sections'].forEach((section, sectionIndex) => {
    if (!isObject(section) || !Array.isArray(section['components'])) return;
    section['components'].forEach((component, componentIndex) => {
      if (!isObject(component) || component['control'] !== 'html' || !Array.isArray(component['value'])) return;
      component['value'].forEach((html, valueIndex) => {
        if (typeof html === 'string') {
          fragments.push({
            path: `meta.layout.sections[${sectionIndex}].components[${componentIndex}].value[${valueIndex}]`,
            html
          });
        }
      });
    });
  });
  return fragments;
}

export function validatePage(input: unknown): PageValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!isObject(input)) return { errors: ['page: must be an object'], warnings };

  for (const key of ['code', 'name', 'url', 'status']) {
    if (!nonEmpty(input[key])) errors.push(`${key}: must be a non-empty string`);
  }

  const meta = input['meta'];
  const layout = isObject(meta) ? meta['layout'] : undefined;
  const sections = isObject(layout) ? layout['sections'] : undefined;
  if (!Array.isArray(sections)) {
    errors.push('meta.layout.sections: must be an array');
    return { errors, warnings };
  }
  if (sections.length === 0) warnings.push('meta.layout.sections: page has no sections');

  const sectionCodes = new Set<string>();
  sections.forEach((rawSection, sectionIndex) => {
    const path = `meta.layout.sections[${sectionIndex}]`;
    if (!isObject(rawSection)) {
      errors.push(`${path}: must be an object`);
      return;
    }
    const code = rawSection['code'];
    if (!nonEmpty(code)) errors.push(`${path}.code: must be a non-empty string`);
    else if (sectionCodes.has(code)) errors.push(`${path}.code: must be unique ("${code}" is duplicated)`);
    else sectionCodes.add(code);

    const components = rawSection['components'];
    if (!Array.isArray(components)) {
      errors.push(`${path}.components: must be an array`);
      return;
    }
    if (components.length === 0) warnings.push(`${path}.components: section has no components`);
    components.forEach((rawComponent, componentIndex) => {
      const componentPath = `${path}.components[${componentIndex}]`;
      if (!isObject(rawComponent)) {
        errors.push(`${componentPath}: must be an object`);
        return;
      }
      const control = rawComponent['control'];
      if (typeof control !== 'string') {
        errors.push(`${componentPath}.control: must be a string`);
        return;
      }
      if (!knownControls.has(control)) {
        warnings.push(`${componentPath}.control: unknown control "${control}" is preserved`);
        return;
      }
      if (control === 'html') {
        const fragments = rawComponent['value'];
        if (!Array.isArray(fragments) || fragments.some((fragment) => typeof fragment !== 'string')) {
          errors.push(`${componentPath}.value: must be an array of strings`);
        }
      } else {
        const options = rawComponent['options'];
        if (!isObject(options)) {
          errors.push(`${componentPath}.options: must be an object`);
          return;
        }
        const formSections = options['sections'];
        const fields = options['fields'];
        const actions = options['actions'];
        if (!Array.isArray(formSections)) errors.push(`${componentPath}.options.sections: must be an array`);
        if (!Array.isArray(fields)) errors.push(`${componentPath}.options.fields: must be an array`);
        if (!Array.isArray(actions)) errors.push(`${componentPath}.options.actions: must be an array`);
        const groups = new Set<string>();
        if (Array.isArray(formSections)) {
          formSections.forEach((section, index) => {
            const sectionPath = `${componentPath}.options.sections[${index}]`;
            if (!isObject(section) || !nonEmpty(section['code'])) {
              errors.push(`${sectionPath}.code: must be a non-empty string`);
            } else if (groups.has(section['code'])) {
              errors.push(`${sectionPath}.code: must be unique ("${section['code']}" is duplicated)`);
            } else groups.add(section['code']);
          });
        }
        if (Array.isArray(fields)) {
          fields.forEach((field, index) => {
            const fieldPath = `${componentPath}.options.fields[${index}]`;
            if (!isObject(field)) {
              errors.push(`${fieldPath}: must be an object`);
              return;
            }
            if (!nonEmpty(field['key'])) errors.push(`${fieldPath}.key: must be a non-empty string`);
            if (!nonEmpty(field['group']) || !groups.has(field['group'])) {
              errors.push(`${fieldPath}.group: must refer to an options.sections code`);
            }
          });
        }
        if (Array.isArray(actions)) {
          actions.forEach((action, index) => {
            const actionPath = `${componentPath}.options.actions[${index}]`;
            if (!isObject(action)) {
              errors.push(`${actionPath}: must be an object`);
              return;
            }
            if (!nonEmpty(action['code'])) errors.push(`${actionPath}.code: must be a non-empty string`);
            if (!nonEmpty(action['handler'])) errors.push(`${actionPath}.handler: must be a non-empty string`);
            if (!nonEmpty(action['group']) || !groups.has(action['group'])) {
              errors.push(`${actionPath}.group: must refer to an options.sections code`);
            }
            if (action['handler'] === 'service') {
              const config = action['config'];
              const target = isObject(config) ? config['target'] : undefined;
              if (!isObject(target)) {
                errors.push(`${actionPath}.config.target: is required for service actions`);
              } else {
                for (const key of ['service', 'collection', 'method']) {
                  if (!nonEmpty(target[key])) errors.push(`${actionPath}.config.target.${key}: must be a non-empty string`);
                }
              }
            }
          });
        }
        if (!isObject(rawComponent['value'])) errors.push(`${componentPath}.value: must be an object`);
      }
    });
  });

  const ids = new Map<string, string>();
  const htmlFragments = pageHtml(input);
  if (typeof DOMParser === 'undefined') return { errors, warnings };
  const parsedDocuments = htmlFragments.map(({ path, html }) => ({
    path,
    document: new DOMParser().parseFromString(html, 'text/html')
  }));
  for (const { path, document } of parsedDocuments) {
    if (document.querySelector('script')) warnings.push(`${path}: contains <script>, which the preview sanitizer removes`);
    for (const element of Array.from(document.querySelectorAll('*'))) {
      for (const attribute of Array.from(element.attributes)) {
        if (/^on/i.test(attribute.name)) {
          warnings.push(`${path}: contains inline ${attribute.name} handler, which the preview sanitizer removes`);
        }
        if (['href', 'src', 'xlink:href', 'formaction'].includes(attribute.name.toLowerCase()) &&
          /^\s*javascript:/i.test(attribute.value)) {
          warnings.push(`${path}: contains a javascript: URL, which the preview sanitizer removes`);
        }
      }
      const id = element.getAttribute('id');
      if (id) {
        if (ids.has(id)) warnings.push(`${path}: duplicate id="${id}" (also in ${ids.get(id)})`);
        else ids.set(id, path);
      }
    }
  }
  for (const { path, document } of parsedDocuments) {
    for (const link of Array.from(document.querySelectorAll('a[href^="#"]'))) {
      const target = link.getAttribute('href')?.slice(1);
      if (target && !ids.has(target)) warnings.push(`${path}: in-page link "#${target}" has no matching id`);
    }
  }
  return { errors, warnings: [...new Set(warnings)] };
}

export function pageHeadings(html: string): string[] {
  if (typeof DOMParser === 'undefined') return [];
  const document = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(document.querySelectorAll('h1, h2, h3'))
    .map((heading) => heading.textContent?.replace(/\s+/g, ' ').trim() || '')
    .filter(Boolean);
}
