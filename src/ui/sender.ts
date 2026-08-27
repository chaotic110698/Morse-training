/**
 * L'outil d'émission du mode histoire.
 *
 * Il propose deux familles. Le **manipulateur à clavier** : on appuie sur une
 * lettre, la machine émet la lettre entière, parfaitement calibrée. Et les
 * **manipulateurs réels** du mode d'entraînement — droit, palettes, iambique —
 * où c'est la main qui fait le rythme et où le moteur décode ce qu'elle a
 * produit.
 *
 * Le choix est celui du joueur : le clavier pour suivre l'histoire sans buter
 * sur le geste, la palette pour que l'histoire coûte quelque chose. L'époque
 * dit ce qui existait, elle n'interdit rien.
 *
 * Le retour est le même dans tous les cas : le message reste lisible, ce qui
 * est juste passe au vert, une erreur s'inscrit en rouge et ne s'efface qu'en
 * émettant `HH`. Sur un manipulateur réel, les huit points effacent pour de
 * bon — c'est le vrai signal d'erreur, pas un bouton déguisé.
 */

import { h } from './dom.ts';
import { KeyPad } from './keypad.ts';
import { Keyer, type KeyerMode } from '../core/keyer.ts';
import { encodeChar, prettyCode } from '../core/morse.ts';
import {
  ERROR_SIGN,
  eraseSend,
  KEYER_ROWS,
  keySend,
  sendDone,
  sendMarks,
  startSend,
  type SendState,
} from '../core/story.ts';
import type { KeyerKind } from '../data/story.ts';
import type { AppStore } from '../core/store.ts';
import type { ToneVoice } from '../core/audio.ts';

/** Le mode d'émission choisi : le clavier, ou l'un des manipulateurs. */
export type SenderMode = 'clavier' | KeyerMode;

/**
 * Les modes proposés, et ce que chacun réclame de l'époque.
 *
 * Le semi-automatique n'a pas d'équivalent exact sur le site : le vrai « bug »
 * produisait les points tout seul et laissait les traits à la main. Les
 * palettes sans répétition en sont le plus proche parent disponible ici, et
 * c'est à ce titre qu'elles portent son année.
 */
const MODES: { mode: SenderMode; label: string; nom: string; era: KeyerKind }[] = [
  { mode: 'clavier', label: 'Clavier', nom: 'Manipulateur à clavier', era: 'clavier' },
  { mode: 'straight', label: 'Droit', nom: 'Manipulateur droit', era: 'droit' },
  { mode: 'paddle-single', label: 'Palettes', nom: 'Palettes — un élément par appui', era: 'bug' },
  { mode: 'iambic-a', label: 'Iambique A', nom: 'Palettes iambiques — mode A', era: 'electronique' },
  { mode: 'iambic-b', label: 'Iambique B', nom: 'Palettes iambiques — mode B', era: 'electronique' },
];

export interface SenderOptions {
  store: AppStore;
  /** Joue le code d'un caractère au clavier, ou le signal d'erreur. */
  play: (code: string) => void;
  /** Les manipulateurs que l'époque connaît. Les autres restent proposés. */
  available: KeyerKind[];
  year: number;
  /** Le grain de l'époque, que le retour local doit rendre sous la main. */
  voice: ToneVoice;
  /** Le manipulateur retenu au temps précédent, pour ne pas le rechoisir. */
  initialMode?: SenderMode;
  /** Signale le manipulateur retenu, afin que l'appelant s'en souvienne. */
  onMode?: (mode: SenderMode) => void;
  onChange?: (state: SendState) => void;
  /** Premier geste réel du joueur, pour démarrer un temps d'antenne. */
  onFirstKey?: () => void;
  onDone?: (state: SendState) => void;
}

export interface Sender {
  element: HTMLElement;
  load: (target: string) => void;
  state: () => SendState;
  destroy: () => void;
}

export function createSender(options: SenderOptions): Sender {
  const { store } = options;
  let state = startSend('');
  let mode: SenderMode = options.initialMode ?? 'clavier';
  let touched = false;

  const firstGesture = (): void => {
    if (touched) return;
    touched = true;
    options.onFirstKey?.();
  };

  const message = h('p', {
    class: 'manip__message',
    attrs: { 'aria-label': 'Message à transmettre', role: 'status' },
  });
  const readout = h('p', { class: 'manip__code-lu', attrs: { 'aria-live': 'off' } });
  const stage = h('div', { class: 'manip__scene' });
  const keys = h('div', { class: 'manip__clavier' });
  const keyByChar = new Map<string, HTMLButtonElement>();

  /**
   * Les caractères sont groupés par mot. Sans cela, le retour à la ligne tombe
   * entre deux lettres et coupe « QUATRE » en « QU » et « ATRE ».
   */
  const draw = (): void => {
    const groups: HTMLElement[] = [];
    let word = h('span', { class: 'manip__mot' });
    for (const mark of sendMarks(state)) {
      if (mark.status === 'space') {
        groups.push(word, h('span', { class: 'manip__space' }));
        word = h('span', { class: 'manip__mot' });
        continue;
      }
      word.append(h('span', { class: `manip__char is-${mark.status}`, text: mark.char }));
    }
    groups.push(word);
    message.replaceChildren(...groups);
  };

  const settle = (): void => {
    draw();
    options.onChange?.(state);
    if (sendDone(state)) options.onDone?.(state);
  };

  /** Fait entrer un caractère, d'où qu'il vienne. */
  const intake = (char: string): void => {
    if (sendDone(state)) return;
    firstGesture();
    state = keySend(state, char);
    settle();
  };

  const erase = (): void => {
    firstGesture();
    state = eraseSend(state);
    settle();
  };

  // --- Manipulateur à clavier ---

  const flash = (char: string): void => {
    const key = keyByChar.get(char);
    if (!key) return;
    key.classList.add('is-down');
    window.setTimeout(() => key.classList.remove('is-down'), 120);
  };

  const typeChar = (char: string): void => {
    if (sendDone(state)) return;
    const code = encodeChar(char);
    if (code) options.play(code);
    flash(char);
    intake(char);
  };

  for (const row of KEYER_ROWS) {
    const line = h('div', { class: 'manip__rangee' });
    for (const char of row) {
      const key = h(
        'button',
        {
          class: 'manip__touche',
          type: 'button',
          data: { char },
          attrs: { 'aria-label': `Émettre ${char}` },
          on: { click: () => typeChar(char) },
        },
        h('span', { class: 'manip__lettre', text: char }),
        h('span', { class: 'manip__code', text: prettyCode(encodeChar(char) ?? '') }),
      ) as HTMLButtonElement;
      keyByChar.set(char, key);
      line.append(key);
    }
    keys.append(line);
  }

  // --- Manipulateur réel ---

  /**
   * Le manipulateur travaille à la vitesse d'entraînement du joueur, pas à
   * celle de l'épisode : c'est sa main qui frappe, et elle a l'habitude qu'elle
   * a. Le décodage lui rend ce qu'elle a produit, sans indulgence.
   */
  /**
   * Le pupitre n'existe que lorsqu'un manipulateur réel est en main.
   *
   * Il pose ses écouteurs sur la fenêtre entière : le laisser en place pendant
   * qu'on frappe au clavier ferait du `Z` de « ZUT » un appui de palette.
   */
  let keypad: KeyPad | null = null;
  let padMode: KeyerMode = 'straight';

  const keyer = new Keyer(
    store.timing,
    { mode: 'straight', adaptive: store.settings.adaptiveKeying },
    {
      onKeyDown: (kind) => {
        void store.audio.unlock();
        store.audio.startSidetone();
        if (kind) store.haptics.pulse((kind === 'dit' ? store.timing.dit : store.timing.dah) * 1000);
        else store.haptics.hold();
        keypad?.setActive(kind ?? null);
      },
      onKeyUp: () => {
        store.audio.stopSidetone();
        if (keyer.mode === 'straight') store.haptics.release();
        keypad?.setActive(null);
      },
      onElement: (_kind, code) => {
        readout.textContent = prettyCode(code);
      },
      onCharacter: (code, char) => {
        readout.textContent = '';
        // Huit points sur une vraie clef : c'est le signal d'erreur, et il
        // efface pour de bon. Aucun bouton n'est déguisé en procédure.
        if (code === ERROR_SIGN) {
          erase();
          return;
        }
        // Un code qui ne correspond à rien reste une faute, et doit se voir :
        // l'effacer en douce apprendrait au joueur que sa main est meilleure
        // qu'elle n'est.
        intake(char ?? '?');
      },
    },
  );

  /**
   * Le pupitre lit le manipulateur dans les réglages du site. On lui présente
   * donc ceux-ci, le manipulateur de l'histoire substitué : sans quoi il
   * dessinerait les palettes du mode d'entraînement pendant qu'on frappe au
   * droit, et inverserait les côtés au mauvais moment.
   */
  const showPad = (next: KeyerMode): HTMLElement => {
    padMode = next;
    keypad ??= new KeyPad({
      keyer,
      getSettings: () => ({ ...store.settings, keyerMode: padMode }),
      onFirstTouch: () => {
        void store.audio.unlock();
        firstGesture();
      },
    });
    keypad.render();
    return keypad.element;
  };

  const hidePad = (): void => {
    keypad?.destroy();
    keypad = null;
  };

  // --- Choix du mode ---

  const chips = h('div', { class: 'segmented segmented--wrap manip__choix' });

  const setMode = (next: SenderMode, silent = false): void => {
    mode = next;
    keyer.reset();
    readout.textContent = '';
    // Le code lu ne concerne que la main : au clavier, la lettre part entière
    // et la ligne resterait vide à occuper de la place.
    readout.hidden = next === 'clavier';
    store.audio.stopSidetone();
    if (next === 'clavier') {
      hidePad();
      stage.replaceChildren(keys);
    } else {
      keyer.setTiming(store.timing);
      keyer.setOptions({ mode: next, adaptive: store.settings.adaptiveKeying });
      store.audio.setSidetoneVoice(options.voice);
      stage.replaceChildren(showPad(next));
    }
    for (const chip of chips.children) {
      chip.setAttribute('aria-pressed', String(chip.getAttribute('data-mode') === next));
    }
    if (!silent) options.onMode?.(next);
  };

  for (const entry of MODES) {
    const existed = options.available.includes(entry.era);
    chips.append(
      h('button', {
        class: `segmented__item manip__mode${existed ? '' : ' is-anachronique'}`,
        type: 'button',
        text: entry.label,
        data: { mode: entry.mode },
        attrs: {
          'aria-pressed': String(entry.mode === mode),
          title: existed
            ? `${entry.nom} — en service en ${options.year}`
            : `${entry.nom} — n’existe pas encore en ${options.year}, à vous de voir`,
        },
        on: { click: () => setMode(entry.mode) },
      }),
    );
  }

  /**
   * Ce que l'époque connaît, écrit noir sur blanc.
   *
   * L'infobulle des pastilles dit la même chose, mais elle ne se survole pas
   * sur un téléphone : la mention doit tenir dans la page.
   */
  const known = MODES.filter((entry) => options.available.includes(entry.era));
  const missing = MODES.length - known.length;
  const legend = h('p', {
    class: 'manip__epoque',
    text:
      missing === 0
        ? `En ${options.year}, ces manipulateurs existent tous.`
        : `En ${options.year} : ${known.map((entry) => entry.label.toLowerCase()).join(', ')}.` +
          ` Les autres (∗) ne sont pas encore nés — libre à vous.`,
  });

  const eraseButton = h(
    'button',
    {
      class: 'btn btn--ghost manip__effacer',
      type: 'button',
      attrs: { 'aria-label': 'Effacer en émettant le signal d’erreur' },
      on: {
        click: () => {
          options.play(ERROR_SIGN);
          erase();
        },
      },
    },
    h('span', { text: 'Effacer' }),
    h('span', { class: 'manip__code', text: `${prettyCode(ERROR_SIGN)}  HH` }),
  );

  const element = h(
    'div',
    { class: 'manip' },
    message,
    chips,
    legend,
    // Le code en cours de frappe se lit juste au-dessus de la clef : c'est là
    // que se porte l'œil quand c'est la main qui travaille.
    readout,
    stage,
    h('div', { class: 'manip__pied' }, eraseButton),
  );

  setMode(mode, true);

  // Le clavier physique ne sert qu'au manipulateur à clavier : sur une palette,
  // les touches appartiennent au KeyPad, qui pose ses propres écouteurs.
  const onKeydown = (event: KeyboardEvent): void => {
    if (mode !== 'clavier' || !element.isConnected) return;
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === 'Backspace') {
      event.preventDefault();
      options.play(ERROR_SIGN);
      erase();
      return;
    }
    const char = event.key.toUpperCase();
    if (char.length !== 1 || !keyByChar.has(char)) return;
    event.preventDefault();
    typeChar(char);
  };
  document.addEventListener('keydown', onKeydown);

  return {
    element,
    load: (target: string) => {
      state = startSend(target);
      touched = false;
      keyer.reset();
      readout.textContent = '';
      draw();
      options.onChange?.(state);
    },
    state: () => state,
    destroy: () => {
      document.removeEventListener('keydown', onKeydown);
      store.audio.stopSidetone();
      // Le grain appartient à l'épisode : le reste du site retrouve sa note.
      store.audio.setSidetoneVoice('pur');
      hidePad();
      keyer.dispose();
    },
  };
}
