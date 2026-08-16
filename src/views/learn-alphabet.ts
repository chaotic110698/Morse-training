/**
 * Page « Alphabet et lexique ».
 *
 * Référence complète du code, écoutable ligne à ligne. Le tableau est un outil
 * de consultation : c'est en écoutant, pas en lisant, qu'on apprend le morse,
 * d'où le bouton de lecture sur chaque entrée.
 */

import { h } from '../ui/dom.ts';
import { SignalLamp } from '../ui/lamp.ts';
import { MorsePlayer } from '../ui/player.ts';
import { DIGITS, EXTENDED, LETTERS, PROSIGNS, PUNCTUATION, prettyCode, spokenCode } from '../core/morse.ts';
import { elementsForCode } from '../core/timing.ts';
import type { View, ViewContext } from '../ui/router.ts';

interface Entry {
  label: string;
  code: string;
  note?: string;
}

interface Group {
  id: string;
  title: string;
  description: string;
  entries: Entry[];
}

const toEntries = (table: Record<string, string>): Entry[] =>
  Object.entries(table).map(([label, code]) => ({ label, code }));

const GROUPS: Group[] = [
  {
    id: 'letters',
    title: 'Lettres',
    description: "Les vingt-six lettres latines. C'est ici que commence tout apprentissage.",
    entries: toEntries(LETTERS),
  },
  {
    id: 'digits',
    title: 'Chiffres',
    description:
      "Tous longs de cinq éléments, construits par symétrie : le 1 commence par un point et finit par quatre traits, le 9 fait l'inverse.",
    entries: toEntries(DIGITS),
  },
  {
    id: 'punctuation',
    title: 'Ponctuation et signes',
    description:
      "Plus longs et moins fréquents. En trafic réel, seuls quelques-uns servent vraiment : le point, la virgule, le point d'interrogation et la barre oblique.",
    entries: toEntries(PUNCTUATION),
  },
  {
    id: 'prosigns',
    title: 'Signaux de procédure',
    description:
      "Émis d'un seul tenant, sans silence interne : ce sont des signaux à part entière, pas des suites de lettres.",
    entries: PROSIGNS.map((prosign) => ({
      label: prosign.name,
      code: prosign.code,
      note: prosign.meaning,
    })),
  },
  {
    id: 'extended',
    title: 'Caractères accentués',
    description:
      "Normalises par l'Union internationale des télécommunications mais très peu utilisés en pratique. Ils ne font pas partie des jeux d'entraînement.",
    entries: toEntries(EXTENDED),
  },
];

export function alphabetView(context: ViewContext): View {
  const { store } = context;
  const lamp = new SignalLamp('Lecture');
  const player = new MorsePlayer(store, lamp);

  let filter = '';
  let showSpoken = true;
  const container = h('div', { class: 'lexicon' });

  const playEntry = (entry: Entry): void => {
    player.stop();
    // Les prosignes n'ont pas de silence inter-caractère : on développe donc
    // le code d'un bloc plutôt que de passer par la traduction d'un texte.
    const elements = elementsForCode(entry.code, store.timing, entry.label, 0);
    void player.playElements(elements);
  };

  const render = (): void => {
    const needle = filter.trim().toUpperCase();
    const blocks: HTMLElement[] = [];

    for (const group of GROUPS) {
      const entries = group.entries.filter(
        (entry) =>
          needle === '' ||
          entry.label.includes(needle) ||
          entry.code.includes(needle) ||
          (entry.note ?? '').toUpperCase().includes(needle),
      );
      if (entries.length === 0) continue;

      blocks.push(
        h(
          'section',
          { class: 'lexicon__group' },
          h('h2', { class: 'lexicon__title', text: group.title }),
          h('p', { class: 'lexicon__description', text: group.description }),
          h(
            'ul',
            { class: 'lexicon__grid' },
            ...entries.map((entry) =>
              h(
                'li',
                {},
                h(
                  'button',
                  {
                    class: 'lexicon__card',
                    type: 'button',
                    attrs: { 'aria-label': `Écouter ${entry.label}` },
                    on: { click: () => playEntry(entry) },
                  },
                  h('span', { class: 'lexicon__char', text: entry.label }),
                  h('span', { class: 'lexicon__code', text: prettyCode(entry.code) }),
                  showSpoken
                    ? h('span', { class: 'lexicon__spoken', text: spokenCode(entry.code) })
                    : null,
                  entry.note ? h('span', { class: 'lexicon__note', text: entry.note }) : null,
                ),
              ),
            ),
          ),
        ),
      );
    }

    if (blocks.length === 0) {
      blocks.push(h('p', { class: 'empty', text: `Aucun résultat pour « ${filter} ».` }));
    }
    container.replaceChildren(...blocks);
  };

  const search = h('input', {
    class: 'input',
    type: 'search',
    attrs: { placeholder: 'Filtrer : une lettre, un code, un sens…', 'aria-label': 'Filtrer le lexique' },
    on: {
      input: (event) => {
        filter = (event.target as HTMLInputElement).value;
        render();
      },
    },
  });

  const spokenToggle = h(
    'label',
    { class: 'switch' },
    h('input', {
      type: 'checkbox',
      attrs: { checked: true },
      on: {
        change: (event) => {
          showSpoken = (event.target as HTMLInputElement).checked;
          render();
        },
      },
    }),
    h('span', { text: 'Afficher le rythme parlé' }),
  );

  render();

  const element = h(
    'div',
    { class: 'stack' },
    h(
      'article',
      { class: 'prose prose--tight' },
      h('p', { class: 'prose__lead' },
        "Le code complet, écoutable d’un clic. Utilisez cette page comme une référence : pour apprendre, " +
        "passez par le mode Écoute, qui vous fait reconnaître les caractères au son plutôt que de les " +
        "mémoriser sous forme de points et de traits."),
    ),
    h('div', { class: 'toolbar' }, search, spokenToggle, lamp.element),
    container,
  );

  return {
    element,
    destroy: () => player.stop(),
  };
}
