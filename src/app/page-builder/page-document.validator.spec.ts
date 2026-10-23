import { pageHeadings, validatePage } from './page-document.validator';
import fixtureDocument from '../../testing/fixtures/home.page.json';

const fixturePage = fixtureDocument as Record<string, unknown>;

function cloneFixture(): Record<string, unknown> {
  return structuredClone(fixturePage);
}

function sectionsOf(page: Record<string, unknown>): Array<Record<string, unknown>> {
  return ((page['meta'] as Record<string, unknown>)['layout'] as Record<string, unknown>)['sections'] as Array<Record<string, unknown>>;
}

describe('Page document validation', () => {
  it('round-trips the supplied page fixture without changing the document', () => {
    const loaded = JSON.parse(JSON.stringify(fixturePage));
    expect(JSON.parse(JSON.stringify(loaded))).toEqual(fixturePage);
  });

  it('accepts the AppLegos home fixture without errors', () => {
    expect(validatePage(fixturePage).errors).toEqual([]);
  });

  it('reports root and section shape errors with paths', () => {
    expect(validatePage(null).errors).toContain('page: must be an object');
    const page = cloneFixture();
    page['code'] = '';
    page['name'] = 4;
    page['url'] = '';
    page['status'] = null;
    const sections = sectionsOf(page);
    sections[0]['code'] = '';
    sections[1]['code'] = 'duplicate';
    sections[2]['components'] = 'bad';
    sections[3]['code'] = 'duplicate';
    const errors = validatePage(page).errors.join('\n');
    expect(errors).toContain('code: must be a non-empty string');
    expect(errors).toContain('name: must be a non-empty string');
    expect(errors).toContain('meta.layout.sections[0].code');
    expect(errors).toContain('meta.layout.sections[2].components');
    expect(errors).toContain('meta.layout.sections[3].code: must be unique');
  });

  it('validates html components, controls, and form group references', () => {
    const page = cloneFixture();
    const sections = sectionsOf(page);
    sections[0]['components'] = [
      { control: 'html', value: ['<p>ok</p>', 1] },
      { control: 'form', options: { sections: [{ code: 'row' }, { code: 'row' }], fields: [{ group: 'missing', key: '' }], actions: [{ group: 'missing', handler: 'service' }] }, value: [] },
      { control: 'chart', source: 'keep me' },
      { value: [] }
    ];
    const result = validatePage(page);
    expect(result.errors.join('\n')).toContain('value: must be an array of strings');
    expect(result.errors.join('\n')).toContain('options.sections[1].code: must be unique');
    expect(result.errors.join('\n')).toContain('options.fields[0].key');
    expect(result.errors.join('\n')).toContain('options.fields[0].group');
    expect(result.errors.join('\n')).toContain('options.actions[0].config.target');
    expect(result.errors.join('\n')).toContain('.control: must be a string');
    expect(result.warnings.join('\n')).toContain('unknown control "chart"');
  });

  it('warns about unsafe markup, broken anchors, duplicate ids, empty sections, and empty pages', () => {
    const page = cloneFixture();
    const sections = sectionsOf(page);
    sections[0]['components'] = [{ control: 'html', value: [
      '<div id="repeat"><script>alert(1)</script><a href="#missing" onclick="go()">Go</a><a href="javascript:bad()">Bad</a></div>'
    ] }];
    sections[1]['components'] = [{ control: 'html', value: ['<div id="repeat"></div>'] }];
    sections[2]['components'] = [];
    const result = validatePage(page);
    expect(result.warnings.join('\n')).toContain('contains <script>');
    expect(result.warnings.join('\n')).toContain('inline onclick');
    expect(result.warnings.join('\n')).toContain('javascript: URL');
    expect(result.warnings.join('\n')).toContain('no matching id');
    expect(result.warnings.join('\n')).toContain('duplicate id="repeat"');
    expect(result.warnings.join('\n')).toContain('section has no components');
    page['meta'] = { layout: { sections: [] } };
    expect(validatePage(page).warnings).toContain('meta.layout.sections: page has no sections');
  });

  it('extracts semantic headings from HTML with the browser parser', () => {
    expect(pageHeadings('<h1>App <em>Legos</em></h1><h2>Second</h2><p>Not a heading</p>'))
      .toEqual(['App Legos', 'Second']);
  });
});
