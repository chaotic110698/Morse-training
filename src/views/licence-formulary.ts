/**
 * Page « Formulaire ».
 *
 * L'annexe du cours, rendue utilisable : filtrable, repliable, et surtout
 * imprimable. Un formulaire sert à être relu la veille et recopié le jour J —
 * d'où la feuille de brouillon en tête, et une feuille de style d'impression
 * qui sort le tout sur deux pages sans le bandeau de navigation.
 */

import { h } from '../ui/dom.ts';
import { FORMULA_GROUPS, SCRATCHPAD } from '../data/formulas.ts';
import type { View, ViewContext } from '../ui/router.ts';

type Scope = 'all' | 'regulation' | 'technique';

const normalise = (value: string): string =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function licenceFormularyView(_context: ViewContext): View {
  let needle = '';
  let scope: Scope = 'all';
  let expanded = false;

  const container = h('div', { class: 'lexicon' });
  const count = h('p', { class: 'field__hint' });

  const total = FORMULA_GROUPS.reduce((sum, group) => sum + group.formulas.length, 0);

  const render = (): void => {
    const query = normalise(needle.trim());
    let shown = 0;
    const blocks: HTMLElement[] = [];

    for (const group of FORMULA_GROUPS) {
      if (scope === 'regulation' && !group.regulation) continue;
      if (scope === 'technique' && group.regulation) continue;

      const matches = group.formulas.filter((formula) =>
        query === '' ||
        normalise(`${formula.expression} ${formula.purpose} ${formula.simplified ?? ''} ${formula.variables ?? ''} ${formula.note ?? ''} ${group.title}`).includes(query));
      if (matches.length === 0) continue;
      shown += matches.length;

      blocks.push(
        h(
          'details',
          {
            class: 'lexicon__group',
            // Un filtre actif ouvre tout : masquer un résultat trouvé n'aurait
            // aucun sens. Le bouton « tout déplier » sert à l'impression.
            attrs: { open: query !== '' || expanded },
          },
          h('summary', { class: 'lexicon__summary' },
            h('span', { class: 'lexicon__title', text: group.title }),
            h('span', { class: 'lexicon__count', text: `${group.chapter} · ${matches.length}` })),
          h(
            'ul',
            { class: 'formulary' },
            ...matches.map((formula) =>
              h(
                'li',
                { class: 'formulary__entry' },
                h('p', { class: 'formulary__purpose', text: formula.purpose }),
                h('p', { class: 'formulary__expression', text: formula.expression }),
                formula.simplified
                  ? h('p', { class: 'formulary__simplified' },
                      h('span', { class: 'formulary__tag', text: 'simplifiée' }),
                      formula.simplified)
                  : null,
                formula.variables ? h('p', { class: 'formulary__variables', text: formula.variables }) : null,
                formula.note ? h('p', { class: 'formulary__note', text: formula.note }) : null,
              ),
            ),
          ),
        ),
      );
    }

    if (blocks.length === 0) {
      blocks.push(h('p', { class: 'empty', text: `Aucune formule pour « ${needle} ».` }));
    }
    container.replaceChildren(...blocks);
    count.textContent = query === '' && scope === 'all'
      ? `${total} formules au total.`
      : `${shown} formule${shown > 1 ? 's' : ''} sur ${total}.`;
  };

  const search = h('input', {
    class: 'input',
    type: 'search',
    attrs: { placeholder: 'Filtrer : un nom, une lettre, une unité…', 'aria-label': 'Filtrer le formulaire' },
    on: {
      input: (event) => {
        needle = (event.target as HTMLInputElement).value;
        render();
      },
    },
  });

  const scopeSelect = h(
    'select',
    {
      class: 'select',
      attrs: { 'aria-label': 'Épreuve' },
      on: {
        change: (event) => {
          scope = (event.target as HTMLSelectElement).value as Scope;
          render();
        },
      },
    },
    h('option', { value: 'all', text: 'Les deux épreuves' }),
    h('option', { value: 'regulation', text: 'Réglementation' }),
    h('option', { value: 'technique', text: 'Technique' }),
  );

  const expandButton = h('button', {
    class: 'btn btn--small',
    type: 'button',
    text: 'Tout déplier',
    on: {
      click: () => {
        expanded = !expanded;
        expandButton.textContent = expanded ? 'Tout replier' : 'Tout déplier';
        render();
      },
    },
  });

  render();

  const element = h(
    'div',
    { class: 'stack' },

    h(
      'article',
      { class: 'prose prose--tight' },
      h('p', { class: 'prose__lead' },
        "Toutes les formules exigibles, en un seul endroit. Les unités comptent autant que les " +
        "formules : une expression juste appliquée en farads plutôt qu’en picofarads donne une réponse " +
        "fausse, et c’est la première cause d’erreur de l’épreuve technique. Chaque entrée porte donc " +
        "ses unités, et sa variante simplifiée quand le cours en propose une."),
      h('p', { class: 'prose__note prose--noprint' },
        "Cette page s’imprime proprement : dépliez tout, puis imprimez. Le bandeau de navigation et les " +
        "commandes disparaissent, il ne reste que le formulaire."),
    ),

    // --- Brouillon ---
    h(
      'section',
      { class: 'card card--accent' },
      h('h2', { class: 'card__title', text: 'À recopier sur le brouillon' }),
      h('p', { class: 'card__hint' },
        "Vous disposez d’environ cinq minutes avant de déclencher le chronomètre. Ces six blocs sont " +
        "ceux qui servent le plus, et ceux qu’on cherche le plus mal sous pression."),
      h(
        'div',
        { class: 'scratchpad' },
        ...SCRATCHPAD.map((entry) =>
          h(
            'section',
            { class: 'scratch' },
            h('h3', { class: 'scratch__title', text: entry.title }),
            h('p', { class: 'scratch__content', text: entry.content }),
            h('p', { class: 'scratch__detail', text: entry.detail }),
          ),
        ),
      ),
    ),

    h('div', { class: 'toolbar prose--noprint' }, search, scopeSelect, expandButton),
    count,
    container,

    h(
      'section',
      { class: 'card card--muted prose--noprint' },
      h('h2', { class: 'card__title', text: 'Les calculateurs correspondants' }),
      h('p', {},
        "Chaque formule de ce tableau a son calculateur dans le cours, avec l’exemple chiffré qui " +
        "l’accompagne. Réviser une formule sans la manipuler ne suffit généralement pas."),
      h(
        'div',
        { class: 'actions' },
        h('a', { class: 'btn', href: '#/licence/ohm', text: 'Loi d’Ohm' }),
        h('a', { class: 'btn', href: '#/licence/alternatif', text: 'Réactances' }),
        h('a', { class: 'btn', href: '#/licence/circuits', text: 'Thomson et Q' }),
        h('a', { class: 'btn', href: '#/licence/antennes', text: 'Antennes et TOS' }),
        h('a', { class: 'btn', href: '#/licence/decibels', text: 'Décibels' }),
        h('a', { class: 'btn', href: '#/licence/recepteurs', text: 'Fréquence image' }),
      ),
    ),
  );

  return { element };
}
