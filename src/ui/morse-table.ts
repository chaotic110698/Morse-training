/**
 * Table de déchiffrage.
 *
 * Une antisèche assumée : on ne demande pas au joueur de connaître l'alphabet
 * pour suivre une histoire. Chaque case s'écoute d'une touche, ce qui fait
 * passer la table du statut de tableau à celui d'instrument.
 *
 * Elle n'indique jamais la lettre en cours de réception : ce serait donner la
 * réponse à l'exercice qu'elle est censée servir. On y cherche, on n'y lit pas.
 */

import { h } from './dom.ts';
import { DIGITS, LETTERS, PUNCTUATION, prettyCode } from '../core/morse.ts';

export interface MorseTableOptions {
  /** Appelé quand on touche une case : la table devient un instrument. */
  onPick?: (char: string, code: string) => void;
}

export interface MorseTable {
  element: HTMLElement;
  /** Allume un caractère, ou éteint tout avec `null`. */
  highlight: (char: string | null) => void;
  /**
   * Restreint la table aux familles employées par l'épisode. Jamais aux
   * caractères d'un message : ce serait désigner la réponse.
   */
  limit: (chars: string) => void;
  /** Vrai si le joueur l'a dépliée au moins une fois. */
  consulted: () => boolean;
}

export function createMorseTable(options: MorseTableOptions = {}): MorseTable {
  const cells = new Map<string, HTMLElement>();
  let opened = false;

  const grid = h('div', { class: 'table-morse__grille' });
  for (const source of [LETTERS, DIGITS, PUNCTUATION]) {
    for (const [char, code] of Object.entries(source)) {
      const cell = h(
        'button',
        {
          class: 'table-morse__case',
          type: 'button',
          data: { char },
          attrs: { 'aria-label': `Écouter ${char}` },
          on: { click: () => options.onPick?.(char, code) },
        },
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
      if (used.size === 0) {
        for (const cell of cells.values()) cell.classList.remove('is-off');
        return;
      }
      // Les lettres restent toutes visibles : c'est parmi elles qu'on cherche.
      // Les chiffres et la ponctuation ne s'allument que si l'épisode en
      // emploie, ce qui évite quinze cases de bruit dans une scène de 1844.
      const digits = [...used].some((char) => /[0-9]/.test(char));
      for (const [key, cell] of cells) {
        const keep = /[A-Z]/.test(key) || (/[0-9]/.test(key) ? digits : used.has(key));
        cell.classList.toggle('is-off', !keep);
      }
    },
    consulted: () => opened,
  };
}
