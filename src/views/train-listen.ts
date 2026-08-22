/**
 * Exercice d'écoute, méthode Koch.
 *
 * Un caractère est émis, l'opérateur le reconnaît. Le jeu de caractères
 * s'élargit au fur et à mesure, sans jamais ralentir : c'est le principe même
 * de la méthode. La grille de réponse n'affiche que les caractères appris, ce
 * qui la rend utilisable au doigt sur téléphone comme au clavier sur
 * ordinateur.
 */

import { h, formatNumber, setChildren } from '../ui/dom.ts';
import { SignalLamp } from '../ui/lamp.ts';
import { MorsePlayer } from '../ui/player.ts';
import { SessionTracker } from '../ui/session.ts';
import { isSpaceKey, isTypingTarget } from '../ui/keys.ts';
import { prettyCode, encodeChar } from '../core/morse.ts';
import { drawKochChars, drawWeakestFirst, kochCharset, kochMaxLevel, getKochOrder } from '../core/koch.ts';
import { charAccuracy, formatPercent } from '../core/progress.ts';
import type { View, ViewContext } from '../ui/router.ts';

type Phase = 'idle' | 'running' | 'summary';

/** Trie un jeu de caractères pour une grille facile à parcourir des yeux. */
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

  // --- Éléments d'interface ---

  const levelBadge = h('span', { class: 'badge badge--accent' });

  /**
   * Réglage du niveau à portée de main. Quelqu'un qui connaît déjà une partie
   * du code n'a aucune raison de repartir de deux caractères, et aller le
   * chercher dans les réglages n'est pas évident quand on découvre la page.
   */
  const stepLevel = (delta: number): void => {
    const max = kochMaxLevel(store.settings.kochOrder);
    store.mutateProgress((progress) => {
      progress.kochLevel = Math.min(max, Math.max(2, progress.kochLevel + delta));
    });
  };

  const levelStepper = h(
    'div',
    { class: 'stepper', attrs: { role: 'group', 'aria-label': 'Nombre de caractères travaillés' } },
    h('button', {
      class: 'stepper__btn',
      type: 'button',
      text: '−',
      attrs: { 'aria-label': 'Retirer un caractère' },
      on: { click: () => stepLevel(-1) },
    }),
    h('button', {
      class: 'stepper__btn',
      type: 'button',
      text: '+',
      attrs: { 'aria-label': 'Ajouter un caractère' },
      on: { click: () => stepLevel(1) },
    }),
  );
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
    text: 'Commencer la série',
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
      ? `${store.settings.charWpm} WPM caractères · ${store.settings.effectiveWpm} WPM global`
      : `${store.settings.charWpm} WPM`;

    charsetStrip.replaceChildren(
      ...charset().map((char, index, all) =>
        h('span', {
          class: `charset__char${index === all.length - 1 ? ' charset__char--new' : ''}`,
          text: char,
          title: index === all.length - 1 ? 'Dernier caractère introduit' : undefined,
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
        : `Série de ${store.settings.sessionLength} caractères`;
  };

  const renderDisplay = (state?: { char: string; correct: boolean; answer: string | null }): void => {
    if (phase === 'idle') {
      const set = charset();
      const max = kochMaxLevel(store.settings.kochOrder);
      display.className = 'display';
      setChildren(display, [
        h('p', { class: 'display__lead' },
          `Vous travaillez ${set.length} caractère${set.length > 1 ? 's' : ''} sur ${max} : `,
          h('strong', { text: set.join(' ') }),
          '.'),
        h('p', { class: 'display__hint' },
          set.length <= 3
            ? `C’est volontaire, et c’est tout l’intérêt de la méthode Koch : on démarre à deux caractères ` +
              `à pleine vitesse plutôt qu’à l’alphabet entier au ralenti. Un caractère de plus se débloque ` +
              `dès que vous dépassez ${Math.round(store.settings.kochThreshold * 100)} % sur une série complète de ` +
              `${store.settings.sessionLength}. Si vous connaissez déjà une partie du code, montez le niveau avec le bouton + ci-dessus.`
            : `Un caractère de plus se débloque dès que vous dépassez ${Math.round(store.settings.kochThreshold * 100)} % ` +
              `sur une série complète. Écoutez, répondez au clavier ou en touchant la grille.`),
      ]);
      return;
    }
    if (!state) {
      display.className = 'display display--waiting';
      display.replaceChildren(
        h('span', { class: 'display__char display__char--hidden', text: '?' }),
        h('p', { class: 'display__hint', text: 'À vous.' }),
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
            ? `Vous avez répondu ${state.answer}`
            : 'Pas de réponse',
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

  // --- Déroulement de la série ---

  const startSession = (): void => {
    const set = charset();
    tracker = new SessionTracker(store, 'listen', store.settings.sessionLength);
    tracker.start();
    queue = reviewMode
      ? drawWeakestFirst(set, store.settings.sessionLength, (char) => charAccuracy(store.progress, char))
      : drawKochChars(set, store.settings.sessionLength);
    phase = 'running';
    // Le bruit de bande accompagne la série entière : il campe l'ambiance et
    // maintient la sortie audio active, ce qui supprime le craquement
    // d'extinction entre deux caractères.
    void store.audio.startNoise();
    summary.replaceChildren();
    primaryButton.textContent = 'Arrêter';
    replayButton.disabled = false;
    renderProgress();
    void nextQuestion();
  };

  const stopSession = (): void => {
    window.clearTimeout(advanceTimer);
    player.stop();
    store.audio.stopNoise();
    phase = 'idle';
    current = null;
    answerable = false;
    primaryButton.textContent = 'Commencer la série';
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
      // Le chronomètre part à l'extinction du dernier signal, et non à la fin
      // de la séquence : le silence de fin ne doit pas être compté comme du
      // temps de réflexion, ni permettre de répondre avant son démarrage.
      onSignal: (on) => {
        if (!on) questionReadyAt = performance.now();
      },
    });
  };

  const replay = (): void => {
    if (phase !== 'running' || !current) return;
    void player.play(current, {
      onSignal: (on) => {
        if (!on) questionReadyAt = performance.now();
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

    // Sur erreur, on rejoue le caractère attendu : réentendre le bon son juste
    // après s'être trompé est ce qui corrige le plus vite l'association.
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
    store.audio.stopNoise();
    phase = 'summary';
    current = null;
    answerable = false;
    primaryButton.textContent = 'Nouvelle série';
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
          h('span', { class: 'metric__label', text: 'Précision' })),
        h('div', { class: 'metric' },
          h('span', { class: 'metric__value', text: `${tracker.correct}/${tracker.count}` }),
          h('span', { class: 'metric__label', text: 'Réponses justes' })),
        h('div', { class: 'metric' },
          h('span', {
            class: 'metric__value',
            text: tracker.averageResponseMs === null
              ? '—'
              : `${(tracker.averageResponseMs / 1000).toFixed(1)} s`,
          }),
          h('span', { class: 'metric__label', text: 'Temps de réaction' })),
      ),
      missList.length > 0
        ? h(
            'p',
            { class: 'summary__misses' },
            'À retravailler : ',
            ...missList.map(([char, count], index) =>
              h('span', { class: 'summary__miss' }, `${index > 0 ? ', ' : ''}${char}`,
                h('sup', { text: `×${count}` })),
            ),
          )
        : h('p', { class: 'summary__misses summary__misses--clean', text: 'Aucune erreur. Série parfaite.' }),
      canLevelUp && nextChar
        ? h(
            'div',
            { class: 'levelup' },
            h('p', {},
              `Vous dépassez le seuil de ${Math.round(store.settings.kochThreshold * 100)} %. `,
              h('strong', { text: `Le caractère suivant est ${nextChar} (${prettyCode(encodeChar(nextChar) ?? '')}).` })),
            h('button', {
              class: 'btn btn--primary',
              type: 'button',
              text: `Débloquer ${nextChar}`,
              on: {
                click: () => {
                  store.mutateProgress((progress) => {
                    progress.kochLevel = Math.min(maxLevel, progress.kochLevel + 1);
                  });
                  context.toast(`Nouveau caractère : ${nextChar}`, 'success');
                  renderHeader();
                  renderGrid();
                  summary.replaceChildren();
                },
              },
            }),
          )
        : accuracy < store.settings.kochThreshold
          ? h('p', { class: 'levelup levelup--hold' },
              `Il faut ${Math.round(store.settings.kochThreshold * 100)} % pour ajouter un caractère. ` +
              'Refaites une série : la régularité compte plus que la performance ponctuelle.')
          : null,
    ]);
  };

  // --- Clavier physique ---

  const onKeyDown = (event: KeyboardEvent): void => {
    if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
    if (isSpaceKey(event)) {
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
      h('div', { class: 'badges' }, levelBadge, levelStepper, speedBadge),
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
        "Répondez au son, pas au raisonnement. Si vous vous surprenez à compter les points, c’est que la " +
        "vitesse des caractères est trop basse : montez-la à 18 ou 20 WPM et compensez en baissant la " +
        "vitesse globale dans les réglages."),
      h('p', {},
        "Une erreur n’est pas grave : le caractère attendu est rejoué juste après, et c’est précisément " +
        "ce réentendre-après-erreur qui fait progresser. Enchaînez des séries courtes plutôt qu’une " +
        "seule longue."),
      h('p', {},
        `Raccourcis : la barre d’espace rejoue le caractère en cours, ou lance la série. ` +
        `Vous avez déjà répondu ${formatNumber(store.progress.totals.attempts)} fois depuis le début.`),
    ),
  );

  return {
    element,
    destroy: () => {
      window.clearTimeout(advanceTimer);
      window.removeEventListener('keydown', onKeyDown);
      unsubscribe();
      player.stop();
      store.audio.stopNoise();
      tracker.commit(level());
    },
  };
}
