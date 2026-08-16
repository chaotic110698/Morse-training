/**
 * Lecture visuelle : un code ecrit, une lettre a retrouver.
 *
 * Ce mode est volontairement present, mais il ne remplace pas l'ecoute. Il
 * rend service quand on ne peut pas mettre de son — en reunion, dans un train,
 * sans ecouteurs — et il convient a ceux qui memorisent mieux par l'oeil. Le
 * texte d'aide en bas de page dit clairement ses limites : la competence
 * visee, a terme, est auditive.
 */

import { h } from '../ui/dom.ts';
import { SessionTracker } from '../ui/session.ts';
import { isTypingTarget } from '../ui/keys.ts';
import { encodeChar, prettyCode } from '../core/morse.ts';
import { kochCharset, kochMaxLevel } from '../core/koch.ts';
import { formatPercent } from '../core/progress.ts';
import { MorsePlayer } from '../ui/player.ts';
import { SignalLamp } from '../ui/lamp.ts';
import type { View, ViewContext } from '../ui/router.ts';

type Direction = 'code-to-char' | 'char-to-code';

export function readView(context: ViewContext): View {
  const { store } = context;
  const lamp = new SignalLamp('Signal');
  const player = new MorsePlayer(store, lamp);

  let direction: Direction = 'code-to-char';
  let useFullSet = false;
  let current: string | null = null;
  let answerable = false;
  let shownAt = 0;
  let tracker = new SessionTracker(store, 'read', 20);
  let advanceTimer = 0;

  const charset = (): string[] =>
    useFullSet
      ? kochCharset(store.settings.kochOrder, kochMaxLevel(store.settings.kochOrder))
      : kochCharset(store.settings.kochOrder, store.progress.kochLevel);

  const display = h('div', { class: 'display display--read' });
  const grid = h('div', { class: 'answer-grid' });
  const progressBar = h('div', { class: 'progress__fill' });
  const progressLabel = h('span', { class: 'progress__label' });
  const summary = h('div', { class: 'summary' });

  const directionToggle = h(
    'div',
    { class: 'segmented', attrs: { role: 'group', 'aria-label': 'Sens de la question' } },
    h('button', {
      class: 'segmented__item is-active',
      type: 'button',
      text: 'Code → lettre',
      data: { direction: 'code-to-char' },
      on: { click: () => setDirection('code-to-char') },
    }),
    h('button', {
      class: 'segmented__item',
      type: 'button',
      text: 'Lettre → code',
      data: { direction: 'char-to-code' },
      on: { click: () => setDirection('char-to-code') },
    }),
  );

  const fullSetToggle = h(
    'label',
    { class: 'switch' },
    h('input', {
      type: 'checkbox',
      on: {
        change: (event) => {
          useFullSet = (event.target as HTMLInputElement).checked;
          renderGrid();
          nextQuestion();
        },
      },
    }),
    h('span', { text: 'Tout le jeu de caracteres' }),
  );

  const setDirection = (next: Direction): void => {
    direction = next;
    for (const button of directionToggle.querySelectorAll<HTMLElement>('[data-direction]')) {
      button.classList.toggle('is-active', button.dataset['direction'] === next);
    }
    renderGrid();
    nextQuestion();
  };

  const renderProgress = (): void => {
    const ratio = Math.min(1, tracker.count / tracker.target);
    progressBar.style.width = `${ratio * 100}%`;
    progressLabel.textContent = `${tracker.count} / ${tracker.target} · ${formatPercent(tracker.accuracy)}`;
  };

  const renderQuestion = (): void => {
    if (!current) return;
    display.className = 'display display--read';
    if (direction === 'code-to-char') {
      display.replaceChildren(
        h('span', { class: 'display__code display__code--big', text: prettyCode(encodeChar(current) ?? '') }),
        h('p', { class: 'display__hint', text: 'Quel caractere ?' }),
      );
    } else {
      display.replaceChildren(
        h('span', { class: 'display__char', text: current }),
        h('p', { class: 'display__hint', text: 'Quel code ?' }),
      );
    }
  };

  const renderGrid = (): void => {
    const set = charset();
    if (direction === 'code-to-char') {
      grid.replaceChildren(
        ...set.map((char) =>
          h('button', {
            class: 'answer-grid__key',
            type: 'button',
            text: char,
            data: { answer: char },
            on: { click: () => submit(char) },
          }),
        ),
      );
    } else {
      grid.replaceChildren(
        ...set.map((char) =>
          h('button', {
            class: 'answer-grid__key answer-grid__key--code',
            type: 'button',
            text: prettyCode(encodeChar(char) ?? ''),
            data: { answer: char },
            on: { click: () => submit(char) },
          }),
        ),
      );
    }
  };

  const nextQuestion = (): void => {
    window.clearTimeout(advanceTimer);
    if (tracker.finished) {
      finish();
      return;
    }
    const set = charset();
    let candidate = current;
    for (let attempt = 0; attempt < 5 && candidate === current; attempt += 1) {
      candidate = set[Math.floor(Math.random() * set.length)] ?? null;
    }
    current = candidate;
    answerable = true;
    shownAt = performance.now();
    renderQuestion();
  };

  const submit = (answer: string): void => {
    if (!current || !answerable) return;
    answerable = false;
    const expected = current;
    const correct = answer === expected;
    tracker.record(expected, answer, correct, performance.now() - shownAt);

    const button = grid.querySelector<HTMLElement>(`[data-answer="${CSS.escape(answer)}"]`);
    button?.classList.add(correct ? 'is-ok' : 'is-error');
    window.setTimeout(() => button?.classList.remove('is-ok', 'is-error'), 400);

    display.className = `display display--read ${correct ? 'display--ok' : 'display--error'}`;
    display.replaceChildren(
      h('span', { class: 'display__char', text: expected }),
      h('span', { class: 'display__code', text: prettyCode(encodeChar(expected) ?? '') }),
      h('p', { class: 'display__hint', text: correct ? 'Correct' : `Reponse : ${expected}` }),
    );

    if (store.settings.uiSounds) store.audio.feedback(correct ? 'ok' : 'error');
    store.haptics.feedback(correct ? 'ok' : 'error');

    // Le son du caractere est joue meme dans ce mode visuel : c'est le meilleur
    // moyen de faire glisser progressivement l'apprentissage vers l'oreille.
    if (!correct) void player.play(expected);

    renderProgress();
    advanceTimer = window.setTimeout(() => nextQuestion(), correct ? 400 : 900);
  };

  const finish = (): void => {
    tracker.commit(null);
    answerable = false;
    summary.replaceChildren(
      h(
        'div',
        { class: 'summary__scores' },
        h('div', { class: 'metric' },
          h('span', { class: 'metric__value', text: formatPercent(tracker.accuracy) }),
          h('span', { class: 'metric__label', text: 'Precision' })),
        h('div', { class: 'metric' },
          h('span', { class: 'metric__value', text: `${tracker.correct}/${tracker.count}` }),
          h('span', { class: 'metric__label', text: 'Bonnes reponses' })),
      ),
      h('button', {
        class: 'btn btn--primary',
        type: 'button',
        text: 'Nouvelle serie',
        on: {
          click: () => {
            tracker = new SessionTracker(store, 'read', 20);
            tracker.start();
            summary.replaceChildren();
            renderProgress();
            nextQuestion();
          },
        },
      }),
    );
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (direction !== 'code-to-char') return;
    if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
    const key = event.key.toUpperCase();
    if (key.length !== 1 || !charset().includes(key)) return;
    event.preventDefault();
    submit(key);
  };
  window.addEventListener('keydown', onKeyDown);

  const unsubscribe = store.subscribe(() => renderGrid());

  tracker.start();
  renderGrid();
  renderProgress();
  nextQuestion();

  const element = h(
    'div',
    { class: 'trainer' },
    h('div', { class: 'toolbar' }, directionToggle, fullSetToggle),
    h('div', { class: 'progress' }, progressBar, progressLabel),
    h('div', { class: 'trainer__stage' }, display, lamp.element),
    grid,
    summary,
    h(
      'details',
      { class: 'help' },
      h('summary', { text: 'A quoi sert vraiment ce mode' }),
      h('p', {},
        "La lecture visuelle est pratique : elle se fait sans son, partout, et elle rassure quand on " +
        "debute. Elle a pourtant une limite qu’il faut connaitre — savoir que A s’ecrit point-trait ne " +
        "permet pas de reconnaitre A a 20 mots par minute."),
      h('p', {},
        "Utilisez-la comme complement, pour reviser un caractere oublie ou vous occuper sans casque, " +
        "puis revenez au mode Ecoute. C’est la que se construit la competence reelle. Le son du caractere " +
        "est d’ailleurs joue automatiquement apres chaque erreur, pour amorcer le passage a l’oreille."),
    ),
  );

  return {
    element,
    destroy: () => {
      window.clearTimeout(advanceTimer);
      window.removeEventListener('keydown', onKeyDown);
      unsubscribe();
      player.stop();
      tracker.commit(null);
    },
  };
}
