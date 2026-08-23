/**
 * Page « Questionnaire ».
 *
 * Trois façons de se tester avec le même moteur : l'examen blanc, qui reproduit
 * le format et le chronomètre de l'épreuve réelle ; la série libre, qu'on règle
 * comme on veut ; la révision ciblée, qui repose sur ce qui a déjà été raté.
 *
 * La vue ne calcule rien. Elle tire une session, affiche, collecte des index de
 * réponse et demande la correction — tout le reste est dans `core/quiz.ts`, où
 * c'est vérifiable sans navigateur. Le seul état vraiment délicat est la série
 * en cours, sauvegardée dans `sessionStorage` pour survivre à un rechargement :
 * perdre un examen blanc à la vingtième question sur une fausse manœuvre serait
 * la meilleure façon de ne plus jamais s'en servir.
 */

import { h, section } from '../ui/dom.ts';
import { formatDuration, recordQuizRun, revisionWeight } from '../core/progress.ts';
import {
  availableCount,
  buildSession,
  formatMark,
  missedIds,
  restoreSession,
  scoreSession,
  serialiseSession,
  type QuizScore,
  type QuizSession,
  type SerialisedSession,
} from '../core/quiz.ts';
import {
  EXAM_LABELS,
  EXAM_RULES,
  EXAMS,
  LEVEL_INFO,
  LEVELS,
  QUESTIONS,
  QUIZ_TOPICS,
  topicById,
  type QuizExam,
  type QuizLevel,
} from '../data/quiz.ts';
import type { View, ViewContext } from '../ui/router.ts';

type Phase = 'setup' | 'running' | 'review';
type QuizMode = 'examen' | 'libre' | 'revision';
type ExamChoice = QuizExam | 'all';
type LevelChoice = QuizLevel | 'all';

interface ModeInfo {
  id: QuizMode;
  label: string;
  icon: string;
  description: string;
}

const MODES: ModeInfo[] = [
  {
    id: 'examen',
    label: 'Examen blanc',
    icon: '⏱️',
    description:
      'Vingt questions, le chronomètre de l’épreuve réelle, aucune correction avant la fin. On navigue librement entre les questions, comme le jour J.',
  },
  {
    id: 'libre',
    label: 'Série libre',
    icon: '🎯',
    description:
      'Vous choisissez l’épreuve, le niveau, les thèmes et le nombre de questions. Correction immédiate, explication après chaque réponse.',
  },
  {
    id: 'revision',
    label: 'Révision ciblée',
    icon: '🔁',
    description:
      'Le tirage privilégie ce que vous avez raté et ce que vous n’avez jamais vu. Plus vous vous entraînez, plus il devient précis.',
  },
];

const COUNTS = [5, 10, 20, 40];
const RUN_KEY = 'morse-quiz-run';
const RUN_FORMAT = 1;

interface StoredRun {
  v: number;
  mode: QuizMode;
  exam: ExamChoice;
  level: LevelChoice;
  immediate: boolean;
  index: number;
  answers: Array<number | null>;
  startedAt: number;
  deadline: number;
  session: SerialisedSession;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** Chronomètre lisible : « 12:03 », toujours deux chiffres pour les secondes. */
function clock(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${`${seconds % 60}`.padStart(2, '0')}`;
}

export function licenceQuizView(context: ViewContext): View {
  const { store } = context;

  // --- État ---
  let phase: Phase = 'setup';
  let mode: QuizMode = 'examen';
  let exam: ExamChoice = 'reglementation';
  let level: LevelChoice = 'all';
  let topics = new Set<string>();
  let count = 20;
  let immediate = true;

  let session: QuizSession | null = null;
  let answers: Array<number | null> = [];
  let index = 0;
  let revealed = false;
  let startedAt = 0;
  let deadline = 0;
  let confirmFinish = false;
  let confirmQuit = false;
  let score: QuizScore | null = null;
  let showAll = false;

  let ticker = 0;
  let timerLabel: HTMLElement | null = null;

  const root = h('div', { class: 'stack' });

  // --- Sauvegarde de la série en cours ---

  const storeRun = (): void => {
    if (!session) return;
    try {
      const payload: StoredRun = {
        v: RUN_FORMAT,
        mode,
        exam,
        level,
        immediate,
        index,
        answers,
        startedAt,
        deadline,
        session: serialiseSession(session),
      };
      window.sessionStorage.setItem(RUN_KEY, JSON.stringify(payload));
    } catch {
      // Stockage indisponible : la série continue, elle ne survivra simplement
      // pas à un rechargement.
    }
  };

  const forgetRun = (): void => {
    try {
      window.sessionStorage.removeItem(RUN_KEY);
    } catch {
      // Rien à faire.
    }
  };

  const readRun = (): StoredRun | null => {
    try {
      const raw = window.sessionStorage.getItem(RUN_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoredRun;
      if (!parsed || parsed.v !== RUN_FORMAT) return null;
      if (!Array.isArray(parsed.answers)) return null;
      if (parsed.deadline && parsed.deadline <= Date.now()) return null;
      if (!restoreSession(parsed.session, QUESTIONS)) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  // --- Réglage ---

  const currentFilter = () => ({
    exam,
    level,
    topics: [...topics],
  });

  /**
   * Le format de l'épreuve en cours de réglage. L'examen blanc porte toujours
   * sur une seule épreuve — le sélecteur ne propose pas « les deux » dans ce
   * mode — mais la valeur reste possible ailleurs, d'où ce repli explicite.
   */
  const rule = () => EXAM_RULES[exam === 'all' ? 'technique' : exam];

  /** Nombre de questions demandées : imposé en examen blanc, réglé sinon. */
  const askedCount = (): number => (mode === 'examen' ? rule().questions : count);

  const available = (): number => availableCount(QUESTIONS, currentFilter());

  const buildSetup = (): HTMLElement => {
    const availability = h('p', { class: 'field__hint' });
    const startButton = h('button', {
      class: 'btn btn--primary btn--wide',
      type: 'button',
      text: 'Commencer',
      on: { click: () => start() },
    });

    const chipsRow = h('div', { class: 'chips' });
    const formatLabel = h('p', { class: 'qcm-format' });
    const levelHint = h('p', { class: 'field__hint' });

    const refresh = (): void => {
      formatLabel.textContent = `${rule().questions} questions · ${rule().minutes} minutes`;
      const card = level === 'all' ? null : LEVEL_INFO[level];
      levelHint.replaceChildren(
        card
          ? h('strong', { text: `${card.icon} ${card.label} — ` })
          : document.createTextNode('Tous niveaux confondus, du plus direct au plus exigeant.'),
        card ? document.createTextNode(card.description) : document.createTextNode(''),
      );
      // Les niveaux se remplissent lot par lot : afficher le nombre disponible
      // évite de choisir un niveau qui ne tirerait que trois questions sans
      // qu'on comprenne pourquoi.
      for (const option of levelSelect.options) {
        const value = option.value as LevelChoice;
        const count = availableCount(QUESTIONS, { exam, level: value, topics: [...topics] });
        const label = value === 'all' ? 'Tous les niveaux' : LEVEL_INFO[value].label;
        option.textContent = `${label} (${count})`;
      }

      const total = available();
      const asked = askedCount();
      const drawn = Math.min(total, asked);
      availability.textContent = total === 0
        ? 'Aucune question ne correspond à ces réglages.'
        : drawn < asked
          ? `${total} question${total > 1 ? 's' : ''} disponible${total > 1 ? 's' : ''} : la série en comptera ${drawn} au lieu de ${asked}.`
          : `${total} question${total > 1 ? 's' : ''} disponible${total > 1 ? 's' : ''}, ${drawn} seront tirées.`;
      startButton.disabled = total === 0;
      for (const chip of chipsRow.querySelectorAll<HTMLElement>('.chip')) {
        const id = chip.dataset.topic ?? '';
        chip.classList.toggle('chip--on', id === '' ? topics.size === 0 : topics.has(id));
      }
    };

    const rebuildChips = (): void => {
      const pool = QUIZ_TOPICS.filter((topic) => exam === 'all' || topic.exam === exam);
      // Un thème sans question n'a pas à être proposé : le bouton mènerait à
      // une série vide sans que rien ne l'explique.
      const usable = pool.filter((topic) => availableCount(QUESTIONS, { exam, level, topics: [topic.id] }) > 0);
      for (const id of [...topics]) {
        if (!usable.some((topic) => topic.id === id)) topics.delete(id);
      }
      chipsRow.replaceChildren(
        h('button', {
          class: 'chip',
          type: 'button',
          text: 'Tous les thèmes',
          data: { topic: '' },
          on: {
            click: () => {
              topics.clear();
              refresh();
            },
          },
        }),
        ...usable.map((topic) =>
          h('button', {
            class: 'chip',
            type: 'button',
            text: `${topic.label} (${availableCount(QUESTIONS, { exam, level, topics: [topic.id] })})`,
            data: { topic: topic.id },
            on: {
              click: () => {
                if (topics.has(topic.id)) topics.delete(topic.id);
                else topics.add(topic.id);
                refresh();
              },
            },
          }),
        ),
      );
      refresh();
    };

    const examSelect = h(
      'select',
      {
        class: 'select',
        attrs: { 'aria-label': 'Épreuve' },
        on: {
          change: (event) => {
            exam = (event.target as HTMLSelectElement).value as ExamChoice;
            rebuildChips();
          },
        },
      },
      ...(mode === 'examen' ? [] : [h('option', { value: 'all', text: 'Les deux épreuves' })]),
      ...EXAMS.map((id) => h('option', { value: id, text: EXAM_LABELS[id] })),
    );
    examSelect.value = exam;

    const levelSelect = h(
      'select',
      {
        class: 'select',
        attrs: { 'aria-label': 'Niveau' },
        on: {
          change: (event) => {
            level = (event.target as HTMLSelectElement).value as LevelChoice;
            rebuildChips();
          },
        },
      },
      h('option', { value: 'all', text: 'Tous les niveaux' }),
      ...LEVELS.map((id) => h('option', { value: id, text: LEVEL_INFO[id].label })),
    );
    levelSelect.value = level;

    const countSelect = h(
      'select',
      {
        class: 'select',
        attrs: { 'aria-label': 'Nombre de questions' },
        on: {
          change: (event) => {
            count = Number((event.target as HTMLSelectElement).value) || 10;
            refresh();
          },
        },
      },
      ...COUNTS.map((value) => h('option', { value: String(value), text: `${value} questions` })),
    );
    countSelect.value = String(count);

    const immediateToggle = h(
      'label',
      { class: 'switch' },
      h('input', {
        type: 'checkbox',
        attrs: { checked: immediate },
        on: {
          change: (event) => {
            immediate = (event.target as HTMLInputElement).checked;
          },
        },
      }),
      h('span', { text: 'Corriger après chaque réponse' }),
    );

    rebuildChips();

    const resumable = readRun();

    return h(
      'div',
      { class: 'stack' },

      resumable
        ? h(
            'section',
            { class: 'card card--accent' },
            h('h2', { class: 'card__title', text: 'Une série est en cours' }),
            h('p', {},
              `${MODES.find((entry) => entry.id === resumable.mode)?.label ?? 'Série'} — question `,
              h('strong', { text: `${Math.min(resumable.index + 1, resumable.session.items.length)} sur ${resumable.session.items.length}` }),
              resumable.deadline ? `, il reste ${clock(resumable.deadline - Date.now())}.` : '.'),
            h(
              'div',
              { class: 'actions' },
              h('button', {
                class: 'btn btn--primary',
                type: 'button',
                text: 'Reprendre',
                on: { click: () => resume(resumable) },
              }),
              h('button', {
                class: 'btn',
                type: 'button',
                text: 'Abandonner',
                on: {
                  click: () => {
                    forgetRun();
                    showSetup();
                  },
                },
              }),
            ),
          )
        : null,

      h(
        'article',
        { class: 'prose prose--tight' },
        h('p', { class: 'prose__lead' },
          'Le cours se lit, l’examen se joue. Ces questions reprennent le format officiel — quatre ' +
          'propositions, une seule bonne réponse, aucune pénalité pour une erreur — et renvoient ' +
          'chacune vers la page à relire quand la réponse est fausse.'),
      ),

      h(
        'div',
        { class: 'qcm-modes' },
        ...MODES.map((entry) =>
          h(
            'button',
            {
              class: `qcm-mode${entry.id === mode ? ' qcm-mode--on' : ''}`,
              type: 'button',
              attrs: { 'aria-pressed': entry.id === mode },
              data: { mode: entry.id },
              on: {
                click: () => {
                  if (mode === entry.id) return;
                  mode = entry.id;
                  if (mode === 'examen') {
                    if (exam === 'all') exam = 'reglementation';
                    count = EXAM_RULES[exam].questions;
                  }
                  showSetup();
                },
              },
            },
            h('span', { class: 'qcm-mode__icon', text: entry.icon }),
            h('span', { class: 'qcm-mode__label', text: entry.label }),
            h('span', { class: 'qcm-mode__text', text: entry.description }),
          ),
        ),
      ),

      section(
        'Régler la série',
        h(
          'div',
          { class: 'qcm-settings' },
          h('div', { class: 'field' },
            h('div', { class: 'field__label', text: 'Épreuve' }),
            h('div', { class: 'field__control' }, examSelect)),
          h('div', { class: 'field' },
            h('div', { class: 'field__label', text: 'Niveau' }),
            h('div', { class: 'field__control' }, levelSelect)),
          mode === 'examen'
            ? h('div', { class: 'field' },
                h('div', { class: 'field__label', text: 'Format' }),
                h('div', { class: 'field__control' }, formatLabel))
            : h('div', { class: 'field' },
                h('div', { class: 'field__label', text: 'Longueur' }),
                h('div', { class: 'field__control' }, countSelect)),
          mode === 'libre'
            ? h('div', { class: 'field' },
                h('div', { class: 'field__label', text: 'Correction' }),
                h('div', { class: 'field__control' }, immediateToggle))
            : null,
        ),
        h('p', { class: 'card__hint', text: 'Thèmes' }),
        chipsRow,
        levelHint,
        availability,
        h('div', { class: 'actions' }, startButton),
      ),

      mode === 'revision'
        ? h(
            'article',
            { class: 'prose prose--tight' },
            h('p', { class: 'prose__note' },
              'La révision s’appuie sur vos réponses précédentes : une question ratée revient environ six ' +
              'fois plus souvent qu’une question sue, et une question jamais posée passe devant une ' +
              'question déjà maîtrisée. Sans historique, elle se comporte comme une série ordinaire.'),
          )
        : null,
    );
  };

  const showSetup = (): void => {
    phase = 'setup';
    stopTicker();
    root.replaceChildren(buildSetup());
  };

  // --- Déroulement ---

  const stopTicker = (): void => {
    if (ticker) window.clearInterval(ticker);
    ticker = 0;
  };

  const startTicker = (): void => {
    stopTicker();
    if (!deadline) return;
    ticker = window.setInterval(() => {
      const left = deadline - Date.now();
      if (timerLabel) {
        timerLabel.textContent = clock(left);
        timerLabel.classList.toggle('qcm-timer--low', left <= 60_000);
      }
      if (left <= 0) {
        stopTicker();
        finish(true);
      }
    }, 250);
  };

  const start = (): void => {
    const built = buildSession(QUESTIONS, {
      ...currentFilter(),
      count: askedCount(),
      weight: mode === 'revision'
        ? (question) => revisionWeight(store.progress, question.id, question.topic)
        : undefined,
    });
    if (built.items.length === 0) {
      context.toast('Aucune question ne correspond à ces réglages.', 'error');
      return;
    }
    session = built;
    answers = new Array(built.items.length).fill(null);
    index = 0;
    revealed = false;
    confirmFinish = false;
    confirmQuit = false;
    score = null;
    showAll = false;
    startedAt = Date.now();
    deadline = mode === 'examen' ? startedAt + rule().minutes * 60_000 : 0;
    timerLabel = deadline ? h('span', { class: 'qcm-timer', text: clock(deadline - startedAt) }) : null;
    phase = 'running';
    storeRun();
    startTicker();
    renderRun();
  };

  const resume = (stored: StoredRun): void => {
    const restored = restoreSession(stored.session, QUESTIONS);
    if (!restored) {
      forgetRun();
      context.toast('La série sauvegardée n’était plus lisible.', 'error');
      showSetup();
      return;
    }
    session = restored;
    mode = stored.mode;
    exam = stored.exam;
    level = stored.level;
    immediate = stored.immediate;
    answers = restored.items.map((_, position) => {
      const value = stored.answers[position];
      return typeof value === 'number' ? value : null;
    });
    index = Math.min(Math.max(0, stored.index), restored.items.length - 1);
    revealed = immediate && mode !== 'examen' && answers[index] !== null;
    confirmFinish = false;
    confirmQuit = false;
    score = null;
    showAll = false;
    startedAt = stored.startedAt || Date.now();
    deadline = stored.deadline || 0;
    timerLabel = deadline ? h('span', { class: 'qcm-timer', text: clock(deadline - Date.now()) }) : null;
    phase = 'running';
    startTicker();
    renderRun();
  };

  const select = (choice: number): void => {
    if (!session || phase !== 'running') return;
    if (revealed) return;
    answers[index] = choice;
    if (mode !== 'examen' && immediate) revealed = true;
    confirmFinish = false;
    storeRun();
    renderRun();
  };

  const go = (target: number): void => {
    if (!session) return;
    const bounded = Math.min(Math.max(0, target), session.items.length - 1);
    if (bounded === index) return;
    index = bounded;
    revealed = mode !== 'examen' && immediate && answers[index] !== null;
    confirmFinish = false;
    storeRun();
    renderRun();
  };

  const next = (): void => {
    if (!session) return;
    if (index >= session.items.length - 1) {
      finish(false);
      return;
    }
    go(index + 1);
  };

  const finish = (forced: boolean): void => {
    // Le chronomètre et le bouton peuvent conclure au même instant : sans ce
    // garde-fou, la série serait enregistrée deux fois.
    if (!session || phase !== 'running') return;
    stopTicker();
    const computed = scoreSession(session, answers);
    score = computed;
    phase = 'review';
    forgetRun();

    const durationMs = Math.max(0, Date.now() - startedAt);
    store.mutateProgress((progress) => {
      recordQuizRun(progress, {
        id: session?.id ?? `qcm-${Date.now()}`,
        mode,
        exam,
        level,
        durationMs,
        passed: computed.passed,
        answers: computed.results.map((result) => ({
          id: result.item.question.id,
          topic: result.item.question.topic,
          correct: result.correct,
        })),
      });
    });

    if (forced) context.toast('Temps écoulé — la copie est ramassée.', 'info');
    renderReview(durationMs);
  };

  const quit = (): void => {
    stopTicker();
    session = null;
    forgetRun();
    showSetup();
  };

  const renderRun = (): void => {
    if (!session) return;
    const item = session.items[index];
    if (!item) return;
    const given = answers[index];
    const topic = topicById(item.question.topic);
    const answered = answers.filter((value) => value !== null).length;
    const isExam = mode === 'examen';

    const head = h(
      'div',
      { class: 'qcm-head' },
      h('div', { class: 'qcm-head__left' },
        h('span', { class: 'qcm-step', text: `Question ${index + 1} / ${session.items.length}` }),
        h('span', { class: 'qcm-answered', text: `${answered} répondue${answered > 1 ? 's' : ''}` })),
      h('div', { class: 'qcm-head__right' },
        timerLabel,
        h('button', {
          class: confirmQuit ? 'btn btn--small btn--danger' : 'btn btn--small',
          type: 'button',
          text: confirmQuit ? 'Confirmer l’abandon' : 'Quitter',
          on: {
            click: () => {
              if (confirmQuit) quit();
              else {
                confirmQuit = true;
                renderRun();
              }
            },
          },
        })),
    );

    const bar = h('div', { class: 'qcm-bar' },
      h('div', { class: 'qcm-bar__fill', style: { width: `${((index + 1) / session.items.length) * 100}%` } }));

    const choices = h(
      'div',
      { class: 'qcm-choices', attrs: { role: 'group', 'aria-label': 'Propositions' } },
      ...item.choices.map((text, position) => {
        const chosen = given === position;
        const right = revealed && position === item.answer;
        const wrong = revealed && chosen && position !== item.answer;
        return h(
          'button',
          {
            class: `qcm-choice${chosen ? ' qcm-choice--on' : ''}${right ? ' qcm-choice--right' : ''}${wrong ? ' qcm-choice--wrong' : ''}`,
            type: 'button',
            disabled: revealed,
            attrs: { 'aria-pressed': chosen },
            data: { choice: position },
            on: { click: () => select(position) },
          },
          h('span', { class: 'qcm-choice__key', text: LETTERS[position] ?? '?' }),
          h('span', { class: 'qcm-choice__text', text }),
        );
      }),
    );

    const feedback = revealed
      ? h(
          'div',
          { class: `qcm-feedback ${given === item.answer ? 'qcm-feedback--ok' : 'qcm-feedback--ko'}`, attrs: { role: 'status' } },
          h('p', { class: 'qcm-feedback__verdict', text: given === item.answer ? 'Bonne réponse.' : 'Réponse fausse.' }),
          given !== item.answer
            ? h('p', { class: 'qcm-feedback__right' },
                'La bonne réponse était : ',
                h('strong', { text: item.choices[item.answer] ?? '' }))
            : null,
          h('p', { class: 'qcm-feedback__why', text: item.question.explain }),
          topic
            ? h('a', { class: 'btn btn--small', href: item.question.route ?? topic.route, text: `Relire : ${topic.label}` })
            : null,
        )
      : null;

    const unanswered = answers.filter((value) => value === null).length;
    const last = index === session.items.length - 1;

    const finishNow = (): void => {
      // Une copie incomplète se ramasse en deux temps : le bouton annonce
      // d'abord combien de questions restent vides, il ne conclut qu'ensuite.
      if (unanswered > 0 && !confirmFinish) {
        confirmFinish = true;
        renderRun();
        return;
      }
      finish(false);
    };

    const controls = h(
      'div',
      { class: 'qcm-controls' },
      isExam
        ? h('button', {
            class: 'btn',
            type: 'button',
            text: 'Précédente',
            disabled: index === 0,
            on: { click: () => go(index - 1) },
          })
        : null,
      // En examen blanc, la dernière question n'a pas de « suivante » : le
      // bouton de fin, présent depuis le début, suffit. Ailleurs le bouton
      // principal mène la série d'un bout à l'autre, et devient le bouton de
      // fin sur la dernière question.
      isExam && last
        ? null
        : h('button', {
            class: last && confirmFinish ? 'btn btn--danger' : 'btn btn--primary',
            type: 'button',
            text: last
              ? confirmFinish
                ? `Voir le résultat — ${unanswered} sans réponse`
                : 'Voir le résultat'
              : 'Suivante',
            disabled: !isExam && immediate && !revealed,
            on: { click: () => (last ? finishNow() : go(index + 1)) },
          }),
      isExam
        ? h('button', {
            class: confirmFinish ? 'btn btn--danger' : 'btn btn--primary',
            type: 'button',
            text: confirmFinish ? `Terminer avec ${unanswered} sans réponse` : 'Terminer et corriger',
            on: { click: finishNow },
          })
        : null,
    );

    const grid = isExam
      ? h(
          'div',
          { class: 'qcm-grid', attrs: { 'aria-label': 'Aller à une question' } },
          ...session.items.map((_, position) =>
            h('button', {
              class: `qcm-grid__cell${position === index ? ' qcm-grid__cell--on' : ''}${answers[position] !== null ? ' qcm-grid__cell--done' : ''}`,
              type: 'button',
              text: String(position + 1),
              attrs: { 'aria-label': `Question ${position + 1}` },
              on: { click: () => go(position) },
            }),
          ),
        )
      : null;

    root.replaceChildren(
      h(
        'div',
        { class: 'stack quiz' },
        head,
        bar,
        h(
          'section',
          { class: 'card qcm-card' },
          h(
            'div',
            { class: 'qcm-tags' },
            topic ? h('span', { class: 'qcm-tag', text: topic.label }) : null,
            h('span', { class: 'qcm-tag qcm-tag--level', text: LEVEL_INFO[item.question.level].label }),
          ),
          h('h2', { class: 'qcm-prompt', text: item.question.prompt }),
          choices,
          feedback,
          controls,
        ),
        grid,
        session.short
          ? h('p', { class: 'field__hint', text: `Le vivier ne contenait que ${session.items.length} question${session.items.length > 1 ? 's' : ''} pour ces réglages.` })
          : null,
        h('p', { class: 'field__hint prose--noprint', text: 'Au clavier : 1 à 4 pour répondre, Entrée pour continuer, flèches pour naviguer.' }),
      ),
    );

    // Sur un téléphone, la correction s'affiche sous la dernière proposition,
    // donc hors écran : sans ce recentrage, répondre semble ne rien faire.
    // `nearest` ne bouge pas la page quand le bloc est déjà visible.
    feedback?.scrollIntoView({ block: 'nearest' });
  };

  // --- Correction ---

  const renderReview = (durationMs: number): void => {
    if (!session || !score) return;
    const current = score;
    const wrong = current.results.filter((result) => !result.correct);
    const listed = showAll ? current.results : wrong;

    const verdict = current.passed ? 'Admis' : 'En dessous de la moyenne';

    root.replaceChildren(
      h(
        'div',
        { class: 'stack qcm-review' },

        h(
          'section',
          { class: `card qcm-result ${current.passed ? 'qcm-result--pass' : 'qcm-result--fail'}` },
          h('p', { class: 'qcm-result__mark', text: formatMark(current.mark) }),
          h('p', { class: 'qcm-result__verdict', text: verdict }),
          h('p', { class: 'qcm-result__detail' },
            `${current.correct} bonne${current.correct > 1 ? 's' : ''} réponse${current.correct > 1 ? 's' : ''}, ` +
            `${current.wrong} fausse${current.wrong > 1 ? 's' : ''}, ` +
            `${current.skipped} sans réponse, sur ${current.total} question${current.total > 1 ? 's' : ''} — ` +
            `en ${formatDuration(durationMs)}.`),
          current.total !== 20
            ? h('p', { class: 'qcm-result__scale', text: 'Note ramenée sur vingt, comme à l’examen.' })
            : null,
        ),

        current.byTopic.length > 0
          ? section(
              'Par thème',
              h(
                'ul',
                { class: 'qcm-topics' },
                ...current.byTopic.map((entry) => {
                  const topic = topicById(entry.key);
                  const ratio = entry.correct / entry.asked;
                  return h(
                    'li',
                    { class: 'qcm-topic' },
                    h('span', { class: 'qcm-topic__label', text: topic?.label ?? entry.key }),
                    h('span', { class: 'qcm-topic__bar' },
                      h('span', { class: 'qcm-topic__fill', style: { width: `${ratio * 100}%` } })),
                    h('span', { class: 'qcm-topic__score', text: `${entry.correct} / ${entry.asked}` }),
                    topic ? h('a', { class: 'qcm-topic__link', href: topic.route, text: 'Relire' }) : null,
                  );
                }),
              ),
            )
          : null,

        h(
          'div',
          { class: 'actions' },
          h('button', {
            class: 'btn btn--primary',
            type: 'button',
            text: 'Refaire une série',
            on: { click: () => start() },
          }),
          wrong.length > 0
            ? h('button', {
                class: 'btn',
                type: 'button',
                text: `Revoir mes ${wrong.length} erreur${wrong.length > 1 ? 's' : ''}`,
                on: { click: () => replayMistakes(missedIds(current)) },
              })
            : null,
          h('button', {
            class: 'btn',
            type: 'button',
            text: 'Changer de réglage',
            on: { click: () => showSetup() },
          }),
          wrong.length > 0
            ? h('button', {
                class: 'btn btn--ghost',
                type: 'button',
                text: showAll ? 'Ne montrer que les erreurs' : 'Revoir toutes les questions',
                on: {
                  click: () => {
                    showAll = !showAll;
                    renderReview(durationMs);
                  },
                },
              })
            : null,
        ),

        listed.length === 0
          ? h('p', { class: 'empty', text: 'Aucune erreur : rien à revoir.' })
          : h(
              'div',
              { class: 'stack' },
              ...listed.map((result) => {
                const topic = topicById(result.item.question.topic);
                return h(
                  'section',
                  { class: `card qcm-recap ${result.correct ? 'qcm-recap--ok' : 'qcm-recap--ko'}` },
                  h('p', { class: 'qcm-recap__prompt', text: result.item.question.prompt }),
                  h('p', { class: 'qcm-recap__line' },
                    h('span', { class: 'qcm-recap__key', text: 'Bonne réponse' }),
                    h('span', { text: result.item.choices[result.item.answer] ?? '' })),
                  result.given !== null && !result.correct
                    ? h('p', { class: 'qcm-recap__line qcm-recap__line--given' },
                        h('span', { class: 'qcm-recap__key', text: 'Votre réponse' }),
                        h('span', { text: result.item.choices[result.given] ?? '' }))
                    : null,
                  result.given === null
                    ? h('p', { class: 'qcm-recap__line qcm-recap__line--given' },
                        h('span', { class: 'qcm-recap__key', text: 'Votre réponse' }),
                        h('span', { text: 'laissée vide' }))
                    : null,
                  h('p', { class: 'qcm-recap__why', text: result.item.question.explain }),
                  topic
                    ? h('a', {
                        class: 'btn btn--small',
                        href: result.item.question.route ?? topic.route,
                        text: `Relire : ${topic.label}`,
                      })
                    : null,
                );
              }),
            ),
      ),
    );
  };

  const replayMistakes = (ids: string[]): void => {
    const built = buildSession(QUESTIONS, { ids, count: ids.length });
    if (built.items.length === 0) {
      context.toast('Rien à rejouer.', 'error');
      return;
    }
    session = built;
    answers = new Array(built.items.length).fill(null);
    index = 0;
    mode = 'libre';
    immediate = true;
    revealed = false;
    confirmFinish = false;
    confirmQuit = false;
    score = null;
    showAll = false;
    startedAt = Date.now();
    deadline = 0;
    timerLabel = null;
    phase = 'running';
    storeRun();
    renderRun();
  };

  // --- Clavier ---

  const onKey = (event: KeyboardEvent): void => {
    if (phase !== 'running' || !session) return;
    const target = event.target as HTMLElement | null;
    if (target && /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    const item = session.items[index];
    if (!item) return;

    const key = event.key.toLowerCase();
    const digit = Number(key);
    const letter = LETTERS.findIndex((entry) => entry.toLowerCase() === key);

    if (Number.isInteger(digit) && digit >= 1 && digit <= item.choices.length) {
      event.preventDefault();
      select(digit - 1);
    } else if (letter >= 0 && letter < item.choices.length) {
      event.preventDefault();
      select(letter);
    } else if (key === 'enter') {
      event.preventDefault();
      if (mode !== 'examen' && immediate && !revealed) return;
      next();
    } else if (key === 'arrowright') {
      event.preventDefault();
      if (index < session.items.length - 1) go(index + 1);
    } else if (key === 'arrowleft') {
      event.preventDefault();
      if (mode === 'examen' && index > 0) go(index - 1);
    }
  };

  document.addEventListener('keydown', onKey);
  showSetup();

  return {
    element: root,
    destroy: () => {
      stopTicker();
      document.removeEventListener('keydown', onKey);
      // La série reste en mémoire : quitter la page pour relire un chapitre ne
      // doit pas effacer un examen en cours.
    },
  };
}
