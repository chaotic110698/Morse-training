/**
 * Table de déchiffrage.
 *
 * Une antisèche assumée : on ne demande pas au joueur de connaître l'alphabet
 * pour suivre une histoire. Les caractères qui ne servent pas à l'époque
 * restent éteints, et celui qu'on est en train d'entendre s'allume — c'est ce
 * qui fait passer la table du statut de tableau à celui d'instrument.
 */

import { h } from './dom.ts';
import { DIGITS, LETTERS, PUNCTUATION, prettyCode } from '../core/morse.ts';

export interface MorseTable {
  element: HTMLElement;
  /** Allume un caractère, ou éteint tout avec `null`. */
  highlight: (char: string | null) => void;
  /** Restreint la table aux caractères employés par le message. */
  limit: (chars: string) => void;
  /** Vrai si le joueur l'a dépliée au moins une fois. */
  consulted: () => boolean;
}

export function createMorseTable(): MorseTable {
  const cells = new Map<string, HTMLElement>();
  let opened = false;

  const grid = h('div', { class: 'table-morse__grille' });
  for (const source of [LETTERS, DIGITS, PUNCTUATION]) {
    for (const [char, code] of Object.entries(source)) {
      const cell = h(
        'div',
        { class: 'table-morse__case', data: { char } },
        h('span', { class: 'table-morse__lettre', text: char }),
        h('span', { class: 'table-morse__code', text: prettyCode(code) }),
      );
      cells.set(char, cell);
      grid.append(cell);
    }
  }

  const summary = h('summary', { class: 'table-morse__titre', text: 'Table de déchiffrage' });
  const details = h('details', { class: 'table-morse' }, summary, grid);
  details.addEventListener('toggle', () => {
    if (details.open) opened = true;
  });

  return {
    element: details,
    highlight: (char) => {
      for (const [key, cell] of cells) cell.classList.toggle('is-lit', key === char);
    },
    limit: (chars) => {
      const used = new Set([...chars.toUpperCase()].filter((char) => char !== ' '));
      for (const [key, cell] of cells) cell.classList.toggle('is-off', used.size > 0 && !used.has(key));
    },
    consulted: () => opened,
  };
}
