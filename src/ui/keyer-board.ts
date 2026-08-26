/**
 * Manipulateur à clavier.
 *
 * On appuie sur une lettre, la machine émet la lettre entière, parfaitement
 * calibrée. Ce n'est pas un exercice de manipulation — c'est ce qui permet de
 * suivre une histoire sans buter sur le geste, et de laisser le choix : le
 * clavier pour le confort, les palettes pour l'exigence.
 *
 * Le retour est le même quel que soit le manipulateur : le message reste
 * lisible, ce qui est juste passe au vert, une erreur s'inscrit en rouge et ne
 * s'efface qu'en émettant `HH`.
 */

import { h } from './dom.ts';
import { encodeChar, prettyCode } from '../core/morse.ts';
import { ERROR_SIGN, eraseSend, keySend, sendDone, sendMarks, startSend, type SendState } from '../core/story.ts';

/** Disposition française : c'est le clavier que les gens ont sous les doigts. */
const ROWS = ['AZERTYUIOP', 'QSDFGHJKLM', 'WXCVBN'];

export interface KeyerBoardOptions {
  /** Joue le code d'un caractère, ou le signal d'erreur. */
  play: (code: string) => void;
  /** Appelé après chaque geste, pour suivre l'avancement. */
  onChange?: (state: SendState) => void;
  onDone?: (state: SendState) => void;
}

export interface KeyerBoard {
  element: HTMLElement;
  /** Charge un nouveau message à transmettre. */
  load: (target: string) => void;
  state: () => SendState;
  destroy: () => void;
}

export function createKeyerBoard(options: KeyerBoardOptions): KeyerBoard {
  let state = startSend('');

  const message = h('p', {
    class: 'manip__message',
    attrs: { 'aria-label': 'Message à transmettre', role: 'status' },
  });
  const keys = h('div', { class: 'manip__clavier' });
  const keyByChar = new Map<string, HTMLButtonElement>();

  const draw = (): void => {
    message.replaceChildren(
      ...sendMarks(state).map((mark) =>
        mark.status === 'space'
          ? h('span', { class: 'manip__space' })
          : h('span', { class: `manip__char is-${mark.status}`, text: mark.char }),
      ),
    );
  };

  const flash = (char: string): void => {
    const key = keyByChar.get(char);
    if (!key) return;
    key.classList.add('is-down');
    window.setTimeout(() => key.classList.remove('is-down'), 120);
  };

  const press = (char: string): void => {
    if (sendDone(state)) return;
    const code = encodeChar(char);
    if (code) options.play(code);
    flash(char);
    state = keySend(state, char);
    draw();
    options.onChange?.(state);
    if (sendDone(state)) options.onDone?.(state);
  };

  const erase = (): void => {
    // Le signal d'erreur part même quand il n'y a rien à effacer : sur une
    // vraie ligne, HH s'entend d'abord et se comprend ensuite.
    options.play(ERROR_SIGN);
    state = eraseSend(state);
    draw();
    options.onChange?.(state);
  };

  for (const row of ROWS) {
    const line = h('div', { class: 'manip__rangee' });
    for (const char of row) {
      const key = h(
        'button',
        {
          class: 'manip__touche',
          type: 'button',
          data: { char },
          attrs: { 'aria-label': `Émettre ${char}` },
          on: { click: () => press(char) },
        },
        h('span', { class: 'manip__lettre', text: char }),
        h('span', { class: 'manip__code', text: prettyCode(encodeChar(char) ?? '') }),
      ) as HTMLButtonElement;
      keyByChar.set(char, key);
      line.append(key);
    }
    keys.append(line);
  }

  const actions = h(
    'div',
    { class: 'manip__rangee manip__rangee--actions' },
    h(
      'button',
      {
        class: 'manip__touche manip__touche--large manip__touche--effacer',
        type: 'button',
        attrs: { 'aria-label': 'Effacer en émettant le signal d’erreur' },
        on: { click: erase },
      },
      h('span', { class: 'manip__lettre', text: 'Effacer' }),
      h('span', { class: 'manip__code', text: `${prettyCode(ERROR_SIGN)}  HH` }),
    ),
  );
  keys.append(actions);

  const element = h('div', { class: 'manip' }, message, keys);

  const onKeydown = (event: KeyboardEvent): void => {
    if (!element.isConnected) return;
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === 'Backspace') {
      event.preventDefault();
      erase();
      return;
    }
    const char = event.key.toUpperCase();
    if (char.length !== 1 || !keyByChar.has(char)) return;
    event.preventDefault();
    press(char);
  };
  document.addEventListener('keydown', onKeydown);

  return {
    element,
    load: (target: string) => {
      state = startSend(target);
      draw();
      options.onChange?.(state);
    },
    state: () => state,
    destroy: () => document.removeEventListener('keydown', onKeydown),
  };
}
