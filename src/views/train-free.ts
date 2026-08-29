/**
 * Série libre.
 *
 * L'écoute guidée impose son jeu de caractères — c'est le principe de la
 * méthode Koch — et sa longueur. Cette page fait l'inverse : on choisit les
 * caractères qu'on veut travailler, et la série ne s'arrête que sur commande.
 *
 * Elle sert à deux choses que la série guidée fait mal. Reprendre trois
 * caractères qui se confondent, sans avoir à traverser tout le jeu appris. Et
 * s'installer pour une longue écoute continue, en regardant les statistiques
 * se former en dessous.
 */

import { h, setChildren } from '../ui/dom.ts';
import { SignalLamp } from '../ui/lamp.ts';
import { MorsePlayer } from '../ui/player.ts';
import { SessionTracker } from '../ui/session.ts';
import { isSpaceKey, isTypingTarget } from '../ui/keys.ts';
import { encodeChar, prettyCode } from '../core/morse.ts';
import { drawChars, kochCharset, weakWeight, MASTERY_ATTEMPTS } from '../core/koch.ts';
import { charRecord } from '../core/training.ts';
import { formatDuration, formatPercent } from '../core/progress.ts';
import type { View, ViewContext } from '../ui/router.ts';

/** Tous les caractères que le site sait coder, dans l'ordre d'affichage. */
const ALL = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,?/='];

interface Preset {
  id: string;
  label: string;
  chars: (context: { koch: string[] }) => string[];
}

const PRESETS: Preset[] = [
  { id: 'koch', label: 'Mon niveau Koch', chars: ({ koch }) => koch },
  { id: 'letters', label: 'Lettres', chars: () => ALL.filter((c) => /[A-Z]/.test(c)) },
  { id: 'digits', label: 'Chiffres', chars: () => ALL.filter((c) => /[0-9]/.test(c)) },
  { id: 'punct', label: 'Ponctuation', chars: () => ALL.filter((c) => /[.,?/=]/.test(c)) },
  { id: 'all', label: 'Tout', chars: () => [...ALL] },
];

export function freeView(context: ViewContext): View {
  const { store } = context;
  const lamp = new SignalLamp('Signal');
  const player = new MorsePlayer(store, lamp);

  let running = false;
  let current: string | null = null;
  let answerable = false;
  let questionReadyAt = 0;
  let advanceTimer = 0;
  let clockTimer = 0;
  let queue: string[] = [];
  let tracker = new SessionTracker(store, 'listen', 0);

  /** Sélection courante, dans l'ordre d'affichage. */
  const selection = new Set<string>(
    store.settings.freeCharset.length > 0
      ? [...store.settings.freeCharset]
      : kochCharset(store.settings.kochOrder, store.progress.kochLevel),
  );

  const chosen = (): string[] => ALL.filter((char) => selection.has(char));

  const persist = (): void => {
    store.updateSettings({ freeCharset: chosen().join('') });
  };

  // --- Éléments ---

  const picker = h('div', { class: 'picker' });
  const presetRow = h('div', { class: 'chips' });
  const pickerHint = h('p', { class: 'field__hint' });
  const display = h('div', { class: 'display' });
  const grid = h('div', { class: 'answer-grid' });
  const stats = h('div', { class: 'free-stats' });
  const perChar = h('div', { class: 'free-chars' });
  const actions = h('div', { class: 'actions' });

  const primaryButton = h('button', {
    class: 'btn btn--primary btn--lg',
    type: 'button',
    text: 'Commencer',
    on: { click: () => (running ? stop() : start()) },
  });

  const replayButton = h('button', {
    class: 'btn',
    type: 'button',
    text: 'Rejouer',
    disabled: true,
    on: { click: () => replay() },
  });

  const weakToggle = h(
    'label',
    { class: 'switch' },
    h('input', {
      type: 'checkbox',
      attrs: { checked: true },
      on: {
        change: (event) => {
          weighted = (event.target as HTMLInputElement).checked;
          renderPickerHint();
        },
      },
    }),
    h('span', { text: 'Insister sur mes points faibles' }),
  );
  let weighted = true;

  actions.append(primaryButton, replayButton, weakToggle);

  // --- Sélection des caractères ---

  const renderPicker = (): void => {
    const koch = kochCharset(store.settings.kochOrder, store.progress.kochLevel);
    presetRow.replaceChildren(
      ...PRESETS.map((preset) => {
        const chars = preset.chars({ koch });
        const active = chars.every((char) => selection.has(char)) && selection.size === chars.length;
        return h('button', {
          class: `chip${active ? ' chip--on' : ''}`,
          type: 'button',
          text: preset.label,
          disabled: running,
          data: { preset: preset.id },
          on: {
            click: () => {
              selection.clear();
              for (const char of chars) selection.add(char);
              persist();
              renderPicker();
              renderGrid();
            },
          },
        });
      }),
      h('button', {
        class: 'chip',
        type: 'button',
        text: 'Rien',
        disabled: running,
        data: { preset: 'none' },
        on: {
          click: () => {
            selection.clear();
            persist();
            renderPicker();
            renderGrid();
          },
        },
      }),
    );

    picker.replaceChildren(
      ...ALL.map((char) =>
        h('button', {
          class: `picker__char${selection.has(char) ? ' picker__char--on' : ''}`,
          type: 'button',
          text: char,
          disabled: running,
          data: { char },
          attrs: {
            'aria-pressed': selection.has(char),
            'aria-label': `${char}${selection.has(char) ? ' — retiré de la série' : ' — ajouté à la série'}`,
          },
          on: {
            click: () => {
              if (selection.has(char)) selection.delete(char);
              else selection.add(char);
              persist();
              renderPicker();
              renderGrid();
            },
          },
        }),
      ),
    );
    renderPickerHint();
    primaryButton.disabled = !running && selection.size < 2;
  };

  const renderPickerHint = (): void => {
    const count = selection.size;
    if (count < 2) {
      pickerHint.textContent = 'Choisissez au moins deux caractères : avec un seul, il n’y a rien à reconnaître.';
      return;
    }
    pickerHint.textContent = weighted
      ? `${count} caractères retenus. Le tirage insiste sur ceux que vous ratez ; un caractère n’est allégé ` +
        `qu’après ${MASTERY_ATTEMPTS} propositions, et continue ensuite d’apparaître de temps en temps.`
      : `${count} caractères retenus, tirés à parts égales.`;
  };

  // --- Grille de réponse ---

  const renderGrid = (): void => {
    setChildren(
      grid,
      chosen().map((char) =>
        h('button', {
          class: 'answer-grid__key',
          type: 'button',
          text: char,
          data: { char },
          disabled: !running,
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

  // --- Statistiques de la séance ---

  const renderStats = (): void => {
    const total = tracker.entries.length;
    if (total === 0) {
      stats.replaceChildren(
        h('p', { class: 'field__hint', text: 'Les statistiques apparaîtront dès la première réponse.' }),
      );
      perChar.replaceChildren();
      return;
    }

    const correct = tracker.entries.filter((entry) => entry.correct).length;
    const times = tracker.entries.filter((entry) => entry.responseMs > 0).map((entry) => entry.responseMs);
    const average = times.length > 0 ? times.reduce((sum, ms) => sum + ms, 0) / times.length : null;

    const tile = (label: string, value: string): HTMLElement =>
      h('div', { class: 'free-stat' },
        h('span', { class: 'free-stat__value', text: value }),
        h('span', { class: 'free-stat__label', text: label }));

    stats.replaceChildren(
      tile('Caractères', String(total)),
      tile('Précision', formatPercent(correct / total)),
      tile('Temps moyen', average === null ? '—' : `${(average / 1000).toFixed(2)} s`),
      tile('Durée', formatDuration(tracker.elapsedMs)),
    );

    // Le détail par caractère ne se lit que trié : les plus ratés d'abord,
    // puisque c'est ce qu'on vient chercher.
    const byChar = new Map<string, { asked: number; correct: number }>();
    for (const entry of tracker.entries) {
      const stat = byChar.get(entry.char) ?? { asked: 0, correct: 0 };
      stat.asked += 1;
      if (entry.correct) stat.correct += 1;
      byChar.set(entry.char, stat);
    }
    const rows = [...byChar.entries()]
      .map(([char, stat]) => ({ char, ...stat, ratio: stat.correct / stat.asked }))
      .sort((a, b) => a.ratio - b.ratio || b.asked - a.asked);

    perChar.replaceChildren(
      ...rows.map((row) =>
        h(
          'div',
          { class: `free-char${row.ratio === 1 ? ' free-char--clean' : ''}` },
          h('span', { class: 'free-char__key', text: row.char }),
          h('span', { class: 'free-char__bar' },
            h('span', { class: 'free-char__fill', style: { width: `${row.ratio * 100}%` } })),
          h('span', { class: 'free-char__score', text: `${row.correct}/${row.asked}` }),
        ),
      ),
    );
  };

  // --- Déroulement ---

  const refill = (): void => {
    const set = chosen();
    if (set.length === 0) return;
    const weights = weighted ? set.map((char) => weakWeight(charRecord(store.progress, char))) : undefined;
    // On tire par paquets plutôt qu'un à un : c'est ce qui permet à la fenêtre
    // d'évitement de faire son travail sur une suite, et non sur un seul coup.
    queue.push(...drawChars(set, 16, { weights, avoid: 3 }));
  };

  const start = (): void => {
    if (selection.size < 2) return;
    running = true;
    queue = [];
    tracker = new SessionTracker(store, 'listen', 0);
    tracker.start();
    void store.audio.startNoise();
    primaryButton.textContent = 'Arrêter';
    replayButton.disabled = false;
    renderPicker();
    renderGrid();
    renderStats();
    clockTimer = window.setInterval(renderStats, 1000);
    void nextQuestion();
  };

  const stop = (): void => {
    window.clearTimeout(advanceTimer);
    window.clearInterval(clockTimer);
    clockTimer = 0;
    player.stop();
    store.audio.stopNoise();
    running = false;
    current = null;
    answerable = false;
    primaryButton.textContent = 'Commencer';
    replayButton.disabled = true;
    // La séance rejoint l'historique comme n'importe quelle autre : elle a
    // duré, elle a compté des réponses, elle compte pour la série quotidienne.
    tracker.commit(null);
    renderPicker();
    renderGrid();
    renderDisplay();
    renderStats();
  };

  const nextQuestion = async (): Promise<void> => {
    if (!running) return;
    if (queue.length === 0) refill();
    current = queue.shift() ?? null;
    if (!current) return;
    answerable = true;
    renderDisplay();
    await player.play(current, {
      onSignal: (on) => {
        if (!on) questionReadyAt = performance.now();
      },
    });
  };

  const replay = (): void => {
    if (!running || !current) return;
    void player.play(current, {
      onSignal: (on) => {
        if (!on) questionReadyAt = performance.now();
      },
    });
  };

  const submit = (answer: string): void => {
    if (!running || !current || !answerable) return;
    answerable = false;
    const expected = current;
    const correct = answer === expected;
    const responseMs = questionReadyAt === 0 ? 0 : performance.now() - questionReadyAt;
    questionReadyAt = 0;

    tracker.record(expected, answer, correct, responseMs);
    flashKey(answer, correct);
    renderDisplay({ char: expected, correct, answer });
    renderStats();

    if (store.settings.uiSounds) store.audio.feedback(correct ? 'ok' : 'error');
    store.haptics.feedback(correct ? 'ok' : 'error');

    window.clearTimeout(advanceTimer);
    if (!correct) {
      // Réentendre le bon son juste après s'être trompé est ce qui corrige le
      // plus vite l'association.
      advanceTimer = window.setTimeout(() => {
        void player.play(expected, {
          onEnd: () => {
            advanceTimer = window.setTimeout(() => void nextQuestion(), 500);
          },
        });
      }, 450);
      return;
    }
    advanceTimer = window.setTimeout(() => void nextQuestion(), 450);
  };

  const renderDisplay = (state?: { char: string; correct: boolean; answer: string | null }): void => {
    if (!running) {
      display.className = 'display';
      setChildren(display, [
        h('p', { class: 'display__lead' },
          selection.size < 2
            ? 'Cochez les caractères à travailler.'
            : `Prêt : ${selection.size} caractères, sans limite de durée.`),
        h('p', { class: 'display__hint' },
          'La série ne s’arrête que lorsque vous le décidez. Les statistiques en dessous se mettent à ' +
          'jour à chaque réponse, et la séance rejoint votre historique à l’arrêt.'),
      ]);
      return;
    }
    if (state) {
      // Les mêmes classes que l'écoute guidée, et pour la même raison : c'est
      // `display--ok` et `display--error` qui colorent la lettre en vert ou en
      // rouge et déclenchent le hochement ou le refus. Et c'est bien le code
      // du caractère qu'on affiche, pas le caractère lui-même : `prettyCode`
      // attend des points et des traits, une lettre lui ressortirait comme un
      // signe unique.
      display.className = `display ${state.correct ? 'display--ok' : 'display--error'}`;
      setChildren(display, [
        h('span', { class: 'display__char', text: state.char }),
        h('span', { class: 'display__code', text: prettyCode(encodeChar(state.char) ?? '') }),
        h('p', { class: 'display__hint' },
          state.correct ? 'Bonne réponse.' : `Vous avez répondu ${state.answer ?? '—'}.`),
      ]);
      return;
    }
    display.className = 'display display--waiting';
    setChildren(display, [
      h('p', { class: 'display__lead', text: 'Écoutez…' }),
      h('p', { class: 'display__hint', text: 'Barre d’espace pour réentendre.' }),
    ]);
  };

  // --- Clavier ---

  const onKey = (event: KeyboardEvent): void => {
    if (isTypingTarget(event.target)) return;
    if (isSpaceKey(event)) {
      event.preventDefault();
      if (running) replay();
      else start();
      return;
    }
    if (!running || !answerable) return;
    const char = event.key.toUpperCase();
    if (selection.has(char)) {
      event.preventDefault();
      submit(char);
    }
  };
  window.addEventListener('keydown', onKey);

  renderPicker();
  renderGrid();
  renderDisplay();
  renderStats();

  const element = h(
    'div',
    { class: 'stack trainer' },
    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Ce que vous travaillez' }),
      presetRow,
      picker,
      pickerHint,
    ),
    h('div', { class: 'trainer__stage' }, display, lamp.element),
    grid,
    actions,
    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Cette séance' }),
      stats,
      perChar,
    ),
    h(
      'details',
      { class: 'help' },
      h('summary', { text: 'Quand se servir de ce mode' }),
      h('p', {},
        'La série guidée impose son jeu de caractères et sa longueur, ce qui est exactement ce qu’il ' +
        'faut pour progresser régulièrement. Ce mode-ci sert aux deux cas qu’elle traite mal.'),
      h('p', {},
        'Le premier : deux ou trois caractères se confondent — le S et le H, le U et le V — et vous ' +
        'voulez les reprendre seuls, sans traverser tout le reste. Cochez-les, et rien d’autre.'),
      h('p', {},
        'Le second : vous avez du temps devant vous et voulez écouter longtemps, en regardant les ' +
        'statistiques se former. Aucune barre de progression ne vient vous dire quand vous arrêter.'),
    ),
  );

  return {
    element,
    destroy: () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(advanceTimer);
      window.clearInterval(clockTimer);
      player.stop();
      store.audio.stopNoise();
      tracker.commit(null);
    },
  };
}
