import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pluralize'
})
export class PluralizePipe implements PipeTransform {

  // /**
  // * Returns the plural of an English word.
  // *
  // * @export
  // * @param {string} word
  // * @param {number} [amount]
  // * @returns {string}
  // */
  plural(word: string, value?: number): string {
    if (value !== undefined && value === 1) {
      return word;
    }
    const plural: { [key: string]: string } = {
      '(quiz)$': '$1zes',
      '^(ox)$': '$1en',
      '([m|l])ouse$': '$1ice',
      '(matr|vert|ind)ix|ex$': '$1ices',
      '(x|ch|ss|sh)$': '$1es',
      '([^aeiouy]|qu)y$': '$1ies',
      '(hive)$': '$1s',
      '(?:([^f])fe|([lr])f)$': '$1$2ves',
      '(shea|lea|loa|thie)f$': '$1ves',
      'sis$': 'ses',
      '([ti])um$': '$1a',
      '(tomat|potat|ech|her|vet)o$': '$1oes',
      '(bu)s$': '$1ses',
      '(alias)$': '$1es',
      '(octop)us$': '$1i',
      '(ax|test)is$': '$1es',
      '(us)$': '$1es',
      '([^s]+)$': '$1s'
    };
    const irregular: { [key: string]: string } = {
      move: 'moves',
      foot: 'feet',
      goose: 'geese',
      sex: 'sexes',
      child: 'children',
      man: 'men',
      tooth: 'teeth',
      person: 'people'
    };
    const uncountable: string[] = [
      'sheep',
      'fish',
      'deer',
      'moose',
      'series',
      'species',
      'money',
      'rice',
      'information',
      'equipment',
      'bison',
      'cod',
      'offspring',
      'pike',
      'salmon',
      'shrimp',
      'swine',
      'trout',
      'aircraft',
      'hovercraft',
      'spacecraft',
      'sugar',
      'tuna',
      'you',
      'wood'
    ];
    // save some time in the case that singular and plural are the same
    if (uncountable.indexOf(word.toLowerCase()) >= 0) {
      return word;
    }
    // check for irregular forms
    // eslint-disable-next-line guard-for-in
    for (const w in irregular) {
      const pattern = new RegExp(`${w}$`, 'i');
      const replace = irregular[w];
      if (pattern.test(word)) {
        return word.replace(pattern, replace);
      }
    }
    // check for matches using regular expressions
    // eslint-disable-next-line guard-for-in
    for (const reg in plural) {
      const pattern = new RegExp(reg, 'i');
      if (pattern.test(word)) {
        return word.replace(pattern, plural[reg]);
      }
    }
    return word;
  }

  transform(value: any, args?: any): any {
    const count = args && args[0] ? args[0] : 2;
    return this.plural(value, count);
  }

}
