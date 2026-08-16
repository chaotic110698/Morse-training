/**
 * Exercice d'ecoute, methode Koch.
 *
 * Un caractere est emis, l'operateur le reconnait. Le jeu de caracteres
 * s'elargit au fur et a mesure, sans jamais ralentir : c'est le principe meme
 * de la methode. La grille de reponse n'affiche que les caracteres appris, ce
 * qui la rend utilisable au doigt sur telephone comme au clavier sur
 * ordinateur.
 */

import { h, formatNumber, setChildren } from '../ui/dom.ts';
import { SignalLamp } from '../ui/lamp.ts';
import { MorsePlayer } from '../ui/player.ts';
import { SessionTracker } from '../ui/session.ts';
import { isTypingTarget } from '../ui/keys.ts';
import { prettyCode, encodeChar } from '../core/morse.ts';
import { drawKochChars, drawWeakestFirst, kochCharset, kochMaxLevel, getKochOrder } from '../core/koch.ts';
import { charAccuracy, formatPercent } from '../core/progress.ts';
import type { View, ViewContext } from '../ui/router.ts';

type Phase = 'idle' | 'running' | 'summary';

/** Trie un jeu de caracteres pour une grille facile a parcourir des yeux. */
function displayOrder(charset: string[]): string[] {
  const rank = (char: string): number => {
    if (/[A-Z]/.test(char)) return 0;
    if (/[0-9]/.test(char)) return 1;
    return 2;
  };
  return [...charset].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

export function listenView(context: ViewContext): View {
  const { store } = context;
  const lamp = new SignalLamp('Signal');
  const player = new MorsePlayer(store, lamp);

  let phase: Phase = 'idle';
  let queue: string[] = [];
  let current: string | null = null;
  let answerable = false;
  let questionReadyAt = 0;
  let reviewMode = false;
  let tracker = new SessionTracker(store, 'listen', store.settings.sessionLength);
  let advanceTimer = 0;

  const level = (): number => Math.min(store.progress.kochLevel, kochMaxLevel(store.settings.kochOrder));
  const charset = (): string[] => kochCharset(store.settings.kochOrder, level());

  // --- Elements d'interface ---

  const levelBadge = h('span', { class: 'badge badge--accent' });
  const speedBadge = h('span', { class: 'badge' });
  const charsetStrip = h('div', { class: 'charset' });
  const progressBar = h('div', { class: 'progress__fill' });
  const progressLabel = h('span', { class: 'progress__label' });
  const display = h('div', { class: 'display' });
  const grid = h('div', { class: 'answer-grid' });
  const actions = h('div', { class: 'actions' });
  const summary = h('div', { class: 'summary' });

  const primaryButton = h('button', {
    class: 'btn btn--primary btn--lg',
    type: 'button',
    text: 'Commencer la serie',
    on: { click: () => (phase === 'running' ? stopSession() : startSession()) },
  });

  const replayButton = h('button', {
    class: 'btn',
    type: 'button',
    text: 'Rejouer',
    disabled: true,
    on: { click: () => replay() },
  });

  const reviewToggle = h(
    'label',
    { class: 'switch' },
    h('input', {
      type: 'checkbox',
      on: {
        change: (event) => {
          reviewMode = (event.target as HTMLInputElement).checked;
          if (phase === 'idle') renderDisplay();
        },
      },
    }),
    h('span', { text: 'Insister sur mes points faibles' }),
  );

  actions.append(primaryButton, replayButton, reviewToggle);

  // --- Rendu ---

  const renderHeader = (): void => {
    const order = getKochOrder(store.settings.kochOrder);
    levelBadge.textContent = `Niveau ${level()} / ${order.sequence.length}`;
    speedBadge.textContent = store.timing.farnsworth
      ? `${store.settings.charWpm} WPM caracteres · ${store.settings.effectiveWpm} WPM global`
      : `${store.settings.charWpm} WPM`;

    charsetStrip.replaceChildren(
      ...charset().map((char, index, all) =>
        h('span', {
          class: `charset__char${index === all.length - 1 ? ' charset__char--new' : ''}`,
          text: char,
          title: index === all.length - 1 ? 'Dernier caractere introduit' : undefined,
        }),
      ),
    );
  };

  const renderProgress = (): void => {
    const ratio = tracker.target === 0 ? 0 : Math.min(1, tracker.count / tracker.target);
    progressBar.style.width = `${ratio * 100}%`;
    progressLabel.textContent =
      phase === 'running'
        ? `${tracker.count} / ${tracker.target} · ${formatPercent(tracker.accuracy)}`
        : `Serie de ${store.settings.sessionLength} caracteres`;
  };

  const renderDisplay = (state?: { char: string; correct: boolean; answer: string | null }): void => {
    if (phase === 'idle') {
      display.className = 'display';
      display.replaceChildren(
        h('p', { class: 'display__hint' },
          `Vous travaillez ${charset().length} caracteres. Ecoutez, repondez au clavier ou en touchant la grille.`),
      );
      return;
    }
    if (!state) {
      display.className = 'display display--waiting';
      display.replaceChildren(
        h('span', { class: 'display__char display__char--hidden', text: '?' }),
        h('p', { class: 'display__hint', text: 'A vous.' }),
      );
      return;
    }
    display.className = `display ${state.correct ? 'display--ok' : 'display--error'}`;
    display.replaceChildren(
      h('span', { class: 'display__char', text: state.char }),
      h('span', { class: 'display__code', text: prettyCode(encodeChar(state.char) ?? '') }),
      h('p', {
        class: 'display__hint',
        text: state.correct
          ? 'Correct'
          : state.answer
            ? `Vous avez repondu ${state.answer}`
            : 'Pas de reponse',
      }),
    );
  };

  const renderGrid = (): void => {
    grid.replaceChildren(
      ...displayOrder(charset()).map((char) =>
        h('button', {
          class: 'answer-grid__key',
          type: 'button',
          text: char,
          data: { char },
          on: { click: () => submit(char) },
        }),
      ),
    );
  };

  const flashKey = (char: string, ok: boolean): void => {
    const button = grid.querySelector<HTMLElement>(`[data-char="${CSS.escape(char)}"]`);
    if (!button) return;
    const className = ok ? 'is-ok' : 'is-error';
    button.classList.add(className);
    window.setTimeout(() => button.classList.remove(className), 400);
  };

  // --- Deroulement de la serie ---

  const startSession = (): void => {
    const set = charset();
    tracker = new SessionTracker(store, 'listen', store.settings.sessionLength);
    tracker.start();
    queue = reviewMode
      ? drawWeakestFirst(set, store.settings.sessionLength, (char) => charAccuracy(store.progress, char))
      : drawKochChars(set, store.settings.sessionLength);
    phase = 'running';
    summary.replaceChildren();
    primaryButton.textContent = 'Arreter';
    replayButton.disabled = false;
    renderProgress();
    void nextQuestion();
  };

  const stopSession = (): void => {
    window.clearTimeout(advanceTimer);
    player.stop();
    phase = 'idle';
    current = null;
    answerable = false;
    primaryButton.textContent = 'Commencer la serie';
    replayButton.disabled = true;
    const record = tracker.commit(level());
    renderProgress();
    renderDisplay();
    if (record) renderSummary();
  };

  const nextQuestion = async (): Promise<void> => {
    if (phase !== 'running') return;
    if (queue.length === 0) {
      finishSession();
      return;
    }
    current = queue.shift() ?? null;
    if (!current) return;
    answerable = true;
    renderDisplay();
    await player.play(current, {
      onEnd: () => {
        // Le chronometre part a la fin du son : on mesure le temps de
        // reconnaissance, pas la duree du caractere.
        questionReadyAt = performance.now();
      },
    });
  };

  const replay = (): void => {
    if (phase !== 'running' || !current) return;
    void player.play(current, {
      onEnd: () => {
        questionReadyAt = performance.now();
      },
    });
  };

  const submit = (answer: string): void => {
    if (phase !== 'running' || !current || !answerable) return;
    answerable = false;
    const expected = current;
    const correct = answer === expected;
    const responseMs = questionReadyAt === 0 ? 0 : performance.now() - questionReadyAt;
    questionReadyAt = 0;

    tracker.record(expected, answer, correct, responseMs);
    flashKey(answer, correct);
    renderDisplay({ char: expected, correct, answer });
    renderProgress();

    if (store.settings.uiSounds) store.audio.feedback(correct ? 'ok' : 'error');
    store.haptics.feedback(correct ? 'ok' : 'error');

    // Sur erreur, on rejoue le caractere attendu : reentendre le bon son juste
    // apres s'etre trompe est ce qui corrige le plus vite l'association.
    if (!correct) {
      window.clearTimeout(advanceTimer);
      advanceTimer = window.setTimeout(() => {
        void player.play(expected, {
          onEnd: () => {
            advanceTimer = window.setTimeout(() => void nextQuestion(), 500);
          },
        });
      }, 450);
      return;
    }

    window.clearTimeout(advanceTimer);
    advanceTimer = window.setTimeout(() => void nextQuestion(), 450);
  };

  const finishSession = (): void => {
    phase = 'summary';
    current = null;
    answerable = false;
    primaryButton.textContent = 'Nouvelle serie';
    replayButton.disabled = true;
    tracker.commit(level());
    renderProgress();
    renderDisplay();
    renderSummary();
  };

  const renderSummary = (): void => {
    const accuracy = tracker.accuracy;
    if (accuracy === null) {
      summary.replaceChildren();
      return;
    }
    const order = getKochOrder(store.settings.kochOrder);
    const maxLevel = order.sequence.length;
    const canLevelUp = accuracy >= store.settings.kochThreshold && level() < maxLevel;
    const nextChar = order.sequence[level()] ?? null;

    const misses = new Map<string, number>();
    for (const entry of tracker.entries) {
      if (!entry.correct) misses.set(entry.char, (misses.get(entry.char) ?? 0) + 1);
    }
    const missList = [...misses.entries()].sort((a, b) => b[1] - a[1]);

    setChildren(summary, [
      h(
        'div',
        { class: 'summary__scores' },
        h('div', { class: 'metric' },
          h('span', { class: 'metric__value', text: formatPercent(accuracy) }),
          h('span', { class: 'metric__label', text: 'Precision' })),
        h('div', { class: 'metric' },
          h('span', { class: 'metric__value', text: `${tracker.correct}/${tracker.count}` }),
          h('span', { class: 'metric__label', text: 'Reponses justes' })),
        h('div', { class: 'metric' },
          h('span', {
            class: 'metric__value',
            text: tracker.averageResponseMs === null
              ? '—'
              : `${(tracker.averageResponseMs / 1000).toFixed(1)} s`,
          }),
          h('span', { class: 'metric__label', text: 'Temps de reaction' })),
      ),
      missList.length > 0
        ? h(
            'p',
            { class: 'summary__misses' },
            'A retravailler : ',
            ...missList.map(([char, count], index) =>
              h('span', { class: 'summary__miss' }, `${index > 0 ? ', ' : ''}${char}`,
                h('sup', { text: `×${count}` })),
            ),
          )
        : h('p', { class: 'summary__misses summary__misses--clean', text: 'Aucune erreur. Serie parfaite.' }),
      canLevelUp && nextChar
        ? h(
            'div',
            { class: 'levelup' },
            h('p', {},
              `Vous depassez le seuil de ${Math.round(store.settings.kochThreshold * 100)} %. `,
              h('strong', { text: `Le caractere suivant est ${nextChar} (${prettyCode(encodeChar(nextChar) ?? '')}).` })),
            h('button', {
              class: 'btn btn--primary',
              type: 'button',
              text: `Debloquer ${nextChar}`,
              on: {
                click: () => {
                  store.mutateProgress((progress) => {
                    progress.kochLevel = Math.min(maxLevel, progress.kochLevel + 1);
                  });
                  context.toast(`Nouveau caractere : ${nextChar}`, 'success');
                  renderHeader();
                  renderGrid();
                  summary.replaceChildren();
                },
              },
            }),
          )
        : accuracy < store.settings.kochThreshold
          ? h('p', { class: 'levelup levelup--hold' },
              `Il faut ${Math.round(store.settings.kochThreshold * 100)} % pour ajouter un caractere. ` +
              'Refaites une serie : la regularite compte plus que la performance ponctuelle.')
          : null,
    ]);
  };

  // --- Clavier physique ---

  const onKeyDown = (event: KeyboardEvent): void => {
    if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.code === 'Space') {
      event.preventDefault();
      if (phase === 'running') replay();
      else primaryButton.click();
      return;
    }
    if (phase !== 'running') return;
    const key = event.key.toUpperCase();
    if (key.length !== 1) return;
    if (!charset().includes(key)) return;
    event.preventDefault();
    submit(key);
  };
  window.addEventListener('keydown', onKeyDown);

  const unsubscribe = store.subscribe(() => {
    renderHeader();
    renderGrid();
    if (phase === 'idle') renderDisplay();
  });

  renderHeader();
  renderGrid();
  renderProgress();
  renderDisplay();

  const element = h(
    'div',
    { class: 'trainer' },
    h(
      'div',
      { class: 'trainer__header' },
      h('div', { class: 'badges' }, levelBadge, speedBadge),
      charsetStrip,
    ),
    h('div', { class: 'progress' }, progressBar, progressLabel),
    h('div', { class: 'trainer__stage' }, display, lamp.element),
    grid,
    actions,
    summary,
    h(
      'details',
      { class: 'help' },
      h('summary', { text: 'Comment travailler ce mode' }),
      h('p', {},
        "Repondez au son, pas au raisonnement. Si vous vous surprenez a compter les points, c’est que la " +
        "vitesse des caracteres est trop basse : montez-la a 18 ou 20 WPM et compensez en baissant la " +
        "vitesse globale dans les reglages."),
      h('p', {},
        "Une erreur n’est pas grave : le caractere attendu est rejoue juste apres, et c’est precisement " +
        "ce reentendre-apres-erreur qui fait progresser. Enchainez des series courtes plutot qu’une " +
        "seule longue."),
      h('p', {},
        `Raccourcis : la barre d’espace rejoue le caractere en cours, ou lance la serie. ` +
        `Vous avez deja repondu ${formatNumber(store.progress.totals.attempts)} fois depuis le debut.`),
    ),
  );

  return {
    element,
    destroy: () => {
      window.clearTimeout(advanceTimer);
      window.removeEventListener('keydown', onKeyDown);
      unsubscribe();
      player.stop();
      tracker.commit(level());
    },
  };
}
