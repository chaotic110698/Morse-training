/**
 * Page « Communiquer en morse ».
 *
 * Le code seul ne suffit pas à tenir un contact : le trafic télégraphique a son
 * vocabulaire, fait de signaux de procédure, de codes Q et d'abréviations,
 * hérité d'un siècle d'économie de temps sur des liaisons difficiles. Cette
 * page rassemble ce vocabulaire, et explique la seule chose qu'on épelle
 * toujours en entier : l'indicatif.
 */

import { h, setChildren } from '../ui/dom.ts';
import { SignalLamp } from '../ui/lamp.ts';
import { MorsePlayer } from '../ui/player.ts';
import { encodeText, PROSIGNS, prettyCode } from '../core/morse.ts';
import { elementsForCode } from '../core/timing.ts';
import { VOCABULARY_SETS } from '../data/vocabulary.ts';
import {
  CALLSIGN_COUNTRIES,
  CALLSIGN_MODIFIERS,
  generateCallsign,
  type GeneratedCallsign,
} from '../data/callsigns.ts';
import { spellPhonetic } from '../data/phonetic.ts';
import type { View, ViewContext } from '../ui/router.ts';

interface Entry {
  term: string;
  meaning: string;
  /** Code émis d'un seul tenant, pour les signaux de procédure. */
  solid?: string;
}

export function communicationView(context: ViewContext): View {
  const { store } = context;
  const lamp = new SignalLamp('Lecture');
  const player = new MorsePlayer(store, lamp);

  const play = (entry: Entry): void => {
    player.stop();
    if (entry.solid) {
      // Un signal de procédure n'a pas de silence interne : on développe son
      // code d'un bloc au lieu de passer par la traduction d'un texte.
      void player.playElements(elementsForCode(entry.solid, store.timing, entry.term, 0));
      return;
    }
    void player.play(entry.term);
  };

  const entryRow = (entry: Entry): HTMLElement =>
    h(
      'li',
      { class: 'phrasebook__item' },
      h(
        'button',
        {
          class: 'phrasebook__play',
          type: 'button',
          attrs: { 'aria-label': `Écouter ${entry.term}` },
          on: { click: () => play(entry) },
        },
        h('span', { class: 'phrasebook__term', text: entry.term }),
        h('span', {
          class: 'phrasebook__code',
          text: entry.solid ? prettyCode(entry.solid) : encodeText(entry.term),
        }),
      ),
      h('span', { class: 'phrasebook__meaning', text: entry.meaning }),
    );

  const section = (
    id: string,
    title: string,
    description: string,
    entries: Entry[],
    open: boolean,
  ): HTMLElement =>
    h(
      'details',
      { class: 'lexicon__group', attrs: { open } },
      h(
        'summary',
        { class: 'lexicon__summary' },
        h('span', { class: 'lexicon__title', text: title }),
        h('span', { class: 'lexicon__count', text: `${entries.length}` }),
      ),
      h('p', { class: 'lexicon__description', text: description }),
      h('ul', { class: 'phrasebook', data: { section: id } }, ...entries.map(entryRow)),
    );

  const fromSet = (id: string): Entry[] =>
    (VOCABULARY_SETS.find((set) => set.id === id)?.entries ?? []).map((entry) => ({
      term: entry.text,
      meaning: entry.meaning,
    }));

  // --- Générateur d'indicatifs ---

  let generated: GeneratedCallsign = generateCallsign('fr');
  const sample = h('div', { class: 'callsign' });

  const countrySelect = h(
    'select',
    {
      class: 'select',
      attrs: { 'aria-label': 'Pays' },
      on: { change: () => regenerate() },
    },
    h('option', { value: '', text: 'Au hasard dans le monde' }),
    ...CALLSIGN_COUNTRIES.map((entry) => h('option', { value: entry.id, text: entry.country })),
  );

  const renderSample = (): void => {
    const note = CALLSIGN_COUNTRIES.find((entry) => entry.country === generated.country)?.note ?? '';
    setChildren(sample, [
      h(
        'div',
        { class: 'callsign__parts' },
        h('span', { class: 'callsign__part callsign__part--prefix' },
          h('strong', { text: generated.prefix }),
          h('small', { text: 'préfixe' })),
        h('span', { class: 'callsign__part callsign__part--digit' },
          h('strong', { text: generated.digit }),
          h('small', { text: 'chiffre' })),
        h('span', { class: 'callsign__part callsign__part--suffix' },
          h('strong', { text: generated.suffix }),
          h('small', { text: 'suffixe' })),
      ),
      h('p', { class: 'callsign__country', text: generated.country }),
      h('p', { class: 'callsign__spelled', text: spellPhonetic(generated.callsign) }),
      h('p', { class: 'callsign__code', text: encodeText(generated.callsign) }),
      note ? h('p', { class: 'field__hint', text: note }) : null,
    ]);
  };

  const regenerate = (): void => {
    generated = generateCallsign(countrySelect.value || undefined);
    renderSample();
  };

  const ownCallsign = h('p', { class: 'callsign__own' });

  const renderOwn = (): void => {
    const current = store.settings.callsign;
    setChildren(ownCallsign, current
      ? [
          'Votre indicatif d’essai : ',
          h('strong', { text: current }),
          ' — ',
          h('span', { class: 'callsign__own-spelled', text: spellPhonetic(current) }),
        ]
      : [h('span', { class: 'prose__note', text: 'Aucun indicatif d’essai adopté pour l’instant.' })]);
    forgetButton.disabled = current === '';
  };

  const forgetButton = h('button', {
    class: 'btn btn--ghost btn--small',
    type: 'button',
    text: 'Oublier',
    on: {
      click: () => {
        store.updateSettings({ callsign: '' });
        renderOwn();
        context.toast('Indicatif d’essai oublié.', 'info');
      },
    },
  });

  const unsubscribe = store.subscribe(renderOwn);
  renderSample();
  renderOwn();

  const element = h(
    'div',
    { class: 'stack' },

    h(
      'article',
      { class: 'prose prose--tight' },
      h('p', { class: 'prose__lead' },
        "Connaître le code ne suffit pas à tenir un contact. Le trafic télégraphique a son vocabulaire, " +
        "hérité d’un siècle passé à économiser du temps sur des liaisons difficiles : des signaux de " +
        "procédure qui ponctuent l’échange, des codes en trois lettres qui remplacent des phrases " +
        "entières, et des abréviations qui suppriment tout ce dont on peut se passer."),
      h('p', {},
        "Tout s’abrège, sauf une chose : l’indicatif, qui s’émet toujours en entier. C’est lui qui " +
        "identifie la station, et sa forme raconte d’où elle émet."),
    ),

    h('div', { class: 'toolbar' }, lamp.element,
      h('p', { class: 'prose__note', text: 'Touchez une entrée pour l’entendre en morse.' })),

    h(
      'div',
      { class: 'lexicon' },
      section(
        'prosigns',
        'Signaux de procédure',
        "Émis d’un seul tenant, sans silence interne : ce sont des signaux à part entière, pas des suites de lettres. Ils ponctuent l’échange comme le feraient une ponctuation et des règles de politesse.",
        PROSIGNS.map((prosign) => ({ term: prosign.name, meaning: prosign.meaning, solid: prosign.code })),
        true,
      ),
      section(
        'qcodes',
        'Codes Q',
        "Trois lettres qui remplacent une phrase, et qui fonctionnent quelle que soit la langue des deux opérateurs. Suivis d’un point d’interrogation ils posent la question, seuls ils y répondent : « QTH ? » demande la position, « QTH Paris » la donne.",
        fromSet('qcodes'),
        false,
      ),
      section(
        'abbrev',
        'Abréviations du trafic',
        "Le vocabulaire courant d’un contact. À la main et à vingt mots par minute, chaque lettre économisée compte : on écrit TNX plutôt que THANKS et UR plutôt que YOUR, et tout le monde s’y retrouve.",
        fromSet('abbreviations'),
        false,
      ),
      section(
        'words',
        'Mots courants',
        "Des mots courts fréquents, utiles pour passer du caractère isolé au groupe. Le mode d’entraînement Mots et indicatifs les tire au sort.",
        fromSet('words'),
        false,
      ),
    ),

    // --- Indicatifs ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Les indicatifs d’appel' }),
      h('p', {},
        "Un indicatif identifie une station de façon unique dans le monde entier. Il n’est pas choisi : " +
        "il est attribué par l’administration du pays, à partir d’un bloc de préfixes que l’Union " +
        "internationale des télécommunications lui a alloué. Entendre un indicatif, c’est donc savoir " +
        "immédiatement d’où l’on est appelé."),
      h('p', {},
        "La structure est partout la même : un ",
        h('strong', { text: 'préfixe' }),
        " qui désigne le pays, un ",
        h('strong', { text: 'chiffre' }),
        " qui précise la région ou la classe de licence selon les pays, et un ",
        h('strong', { text: 'suffixe' }),
        " de une à quatre lettres propre à l’opérateur. F5ABC se lit ainsi : F pour la France, 5 pour " +
        "une licence ancienne, ABC pour l’opérateur."),
      h('p', {},
        "En France, le chiffre garde la trace de l’histoire des licences : F5, F6 et F8 correspondent aux " +
        "plus anciennes, F4 à celles délivrées aujourd’hui. Les stations temporaires montées pour un " +
        "événement utilisent TM, et chaque territoire d’outre-mer a son propre préfixe — FR à La Réunion, " +
        "FY en Guyane, FK en Nouvelle-Calédonie — très recherché de ceux qui collectionnent les contacts " +
        "lointains."),
      h('p', {},
        "L’indicatif s’épelle toujours avec l’alphabet radiotéléphonique à la voix, et s’émet lettre par " +
        "lettre en morse, sans abréviation. C’est la seule partie d’un contact qu’on ne raccourcit " +
        "jamais : une erreur sur un indicatif rend le contact invalide."),

      h('h3', { text: 'Les suffixes de situation' }),
      h('p', {},
        "Une barre oblique suivie d’une ou deux lettres précise les conditions d’émission. On les entend " +
        "constamment, et ils font partie de l’indicatif au moment où ils sont utilisés."),
      h(
        'ul',
        { class: 'prose__list' },
        ...CALLSIGN_MODIFIERS.map((modifier) =>
          h('li', {}, h('strong', { text: modifier.suffix }), ' — ', modifier.meaning),
        ),
      ),
      h('p', {},
        "Un opérateur qui émet depuis un autre pays place au contraire le préfixe local devant le sien : " +
        "un Français en Allemagne signe DL/F5ABC. L’ordre a du sens — on annonce d’abord d’où l’on émet, " +
        "ensuite qui l’on est."),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Générateur d’indicatifs' }),
      h('p', { class: 'card__hint' },
        "Des exemples plausibles, pour s’habituer à la forme des indicatifs et s’entraîner à les copier. " +
        "Ces indicatifs ne sont attribués à personne : ce sont des exemples, pas des identités."),
      h('div', { class: 'toolbar' }, countrySelect,
        h('button', { class: 'btn', type: 'button', text: 'Tirer un indicatif', on: { click: () => regenerate() } })),
      sample,
      h(
        'div',
        { class: 'actions' },
        h('button', {
          class: 'btn',
          type: 'button',
          text: 'Écouter en morse',
          on: {
            click: () => {
              player.stop();
              void player.play(generated.callsign);
            },
          },
        }),
        h('button', {
          class: 'btn btn--primary',
          type: 'button',
          text: 'Adopter comme indicatif d’essai',
          on: {
            click: () => {
              store.updateSettings({ callsign: generated.callsign });
              context.toast(`${generated.callsign} adopté comme indicatif d’essai.`, 'success');
            },
          },
        }),
      ),
      h('div', { class: 'callsign__own-row' }, ownCallsign, forgetButton),
      h('p', { class: 'field__hint' },
        "L’indicatif adopté est tiré plus souvent que les autres dans le jeu « Indicatifs » du mode " +
        "Mots et indicatifs : on copie d’abord correctement le sien. Il reste fictif et ne doit jamais " +
        "être émis sur l’air — seule une licence donne le droit d’émettre, et l’indicatif qui va avec."),
    ),
  );

  return {
    element,
    destroy: () => {
      unsubscribe();
      player.stop();
    },
  };
}
