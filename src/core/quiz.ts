/**
 * Moteur du questionnaire.
 *
 * Tout est ici : tirer une série, mélanger les propositions, corriger, et
 * vérifier la banque. Aucune fonction ne touche au DOM ni à l'horloge, et le
 * générateur aléatoire s'injecte — deux propriétés qui rendent le moteur
 * testable au caractère près, ce qui compte quand la banque atteindra plusieurs
 * centaines de questions et que personne ne pourra plus tout relire à l'œil.
 *
 * Trois principes de conception :
 *
 *   - une session ne contient jamais deux fois la même question, même si la
 *     banque contient un doublon ;
 *   - un vivier plus petit que demandé ne casse rien, il rend simplement une
 *     série plus courte, signalée par `short` ;
 *   - la position de la bonne réponse est mélangée à chaque tirage, et le
 *     mélange est mémorisé, jamais recalculé.
 */

import {
  CHOICE_COUNT,
  EXAMS,
  EXAM_PREFIX,
  idNumber,
  LEVEL_RANGES,
  LEVELS,
  MAX_MARK,
  PASS_RATIO,
  QUESTIONS,
  topicById,
  type Question,
  type QuizExam,
  type QuizLevel,
} from '../data/quiz.ts';

export type Rng = () => number;

/**
 * Générateur pseudo-aléatoire à graine.
 *
 * `Math.random` ne se rejoue pas : impossible de reproduire un tirage pour
 * comprendre un bug, ni d'écrire un test stable. Mulberry32 tient en cinq
 * lignes, passe les tests de dispersion usuels, et suffit très largement pour
 * mélanger des questions.
 */
export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mélange de Fisher-Yates, sur une copie. */
export function shuffle<T>(list: readonly T[], rng: Rng = Math.random): T[] {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    // Un générateur qui rendrait 1 sortirait du tableau : on borne.
    const k = j > i ? i : j < 0 ? 0 : j;
    [out[i], out[k]] = [out[k] as T, out[i] as T];
  }
  return out;
}

/**
 * Ordonne une liste au hasard en tenant compte d'un poids.
 *
 * Méthode des clés d'Efraimidis-Spirakis : une clé `aléa^(1/poids)` puis un tri
 * décroissant donne exactement un tirage sans remise proportionnel aux poids.
 * Un poids nul ou négatif renvoie la question en fin de liste sans jamais
 * l'exclure — c'est ce qu'on veut d'une révision : les questions maîtrisées
 * passent après, pas à la trappe.
 */
function weightedOrder<T>(list: readonly T[], rng: Rng, weight: (item: T) => number): T[] {
  return list
    .map((item) => {
      const w = weight(item);
      const draw = rng();
      const key = !Number.isFinite(w) || w <= 0 ? -1 : draw <= 0 ? 0 : draw ** (1 / w);
      return { item, key };
    })
    .sort((a, b) => b.key - a.key)
    .map((entry) => entry.item);
}

export interface QuizFilter {
  exam?: QuizExam | 'all';
  level?: QuizLevel | 'all';
  /** Thèmes retenus ; une liste vide vaut « tous ». */
  topics?: readonly string[];
  /** Restriction à des identifiants précis, pour rejouer ses erreurs. */
  ids?: readonly string[];
}

export interface ResolvedFilter {
  exam: QuizExam | 'all';
  level: QuizLevel | 'all';
  topics: string[];
  ids: string[];
}

export function resolveFilter(filter: QuizFilter = {}): ResolvedFilter {
  return {
    exam: filter.exam ?? 'all',
    level: filter.level ?? 'all',
    topics: [...new Set(filter.topics ?? [])],
    ids: [...new Set(filter.ids ?? [])],
  };
}

/** Questions retenues par le filtre, dédoublonnées, dans l'ordre de la banque. */
export function filterPool(pool: readonly Question[], filter: QuizFilter = {}): Question[] {
  const resolved = resolveFilter(filter);
  const topics = new Set(resolved.topics);
  const ids = new Set(resolved.ids);
  const seen = new Set<string>();
  const out: Question[] = [];

  for (const question of pool) {
    if (!question || typeof question.id !== 'string') continue;
    if (seen.has(question.id)) continue;
    if (resolved.exam !== 'all' && question.exam !== resolved.exam) continue;
    if (resolved.level !== 'all' && question.level !== resolved.level) continue;
    if (topics.size > 0 && !topics.has(question.topic)) continue;
    if (ids.size > 0 && !ids.has(question.id)) continue;
    seen.add(question.id);
    out.push(question);
  }
  return out;
}

export interface QuizItem {
  question: Question;
  /** Les propositions dans l'ordre affiché. */
  choices: string[];
  /** Pour chaque position affichée, l'index d'origine dans la question. */
  order: number[];
  /** Position affichée de la bonne réponse. */
  answer: number;
}

export interface QuizSession {
  id: string;
  createdAt: number;
  items: QuizItem[];
  /** Nombre de questions demandées. */
  requested: number;
  /** Nombre de questions que le filtre rendait disponibles. */
  available: number;
  /** Vrai si le vivier ne suffisait pas : la série est plus courte. */
  short: boolean;
  filter: ResolvedFilter;
}

export interface SessionOptions extends QuizFilter {
  count: number;
  rng?: Rng;
  /** Mélanger les propositions de chaque question. Vrai par défaut. */
  shuffleChoices?: boolean;
  /** Répartir le tirage entre les thèmes plutôt que de tirer à plat. */
  spread?: boolean;
  /** Poids par question, pour orienter une révision. Un par défaut. */
  weight?: (question: Question) => number;
  now?: () => number;
}

function prepareItem(question: Question, rng: Rng, mix: boolean): QuizItem {
  const order = mix
    ? shuffle(question.choices.map((_, index) => index), rng)
    : question.choices.map((_, index) => index);
  return {
    question,
    order,
    choices: order.map((index) => question.choices[index] as string),
    answer: order.indexOf(question.answer),
  };
}

/**
 * Tire une série.
 *
 * Le tirage réparti (`spread`) prend une question par thème à tour de rôle
 * plutôt que de piocher à plat : sur vingt questions et vingt thèmes, un tirage
 * uniforme laisse régulièrement quatre questions du même chapitre et trois
 * chapitres absents. L'examen réel balaie le programme, l'entraînement doit
 * faire pareil.
 */
export function buildSession(pool: readonly Question[], options: SessionOptions): QuizSession {
  const rng = options.rng ?? Math.random;
  const now = options.now ?? Date.now;
  const mix = options.shuffleChoices !== false;
  const weight = options.weight ?? (() => 1);
  const filter = resolveFilter(options);
  const candidates = filterPool(pool, filter);

  const raw = Number(options.count);
  const requested = Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
  const count = Math.min(requested, candidates.length);

  let picked: Question[];
  if (count === 0) {
    picked = [];
  } else if (options.spread === false) {
    picked = weightedOrder(candidates, rng, weight).slice(0, count);
  } else {
    picked = spreadPick(candidates, count, rng, weight);
  }

  return {
    id: `quiz-${Math.floor(now())}-${Math.floor(rng() * 1e6)}`,
    createdAt: now(),
    items: shuffle(picked, rng).map((question) => prepareItem(question, rng, mix)),
    requested,
    available: candidates.length,
    short: count < requested,
    filter,
  };
}

/** Tirage réparti : un tour de table par thème, jusqu'à concurrence du nombre voulu. */
function spreadPick(
  candidates: readonly Question[],
  count: number,
  rng: Rng,
  weight: (question: Question) => number,
): Question[] {
  const byTopic = new Map<string, Question[]>();
  for (const question of candidates) {
    const list = byTopic.get(question.topic);
    if (list) list.push(question);
    else byTopic.set(question.topic, [question]);
  }

  const groups = [...byTopic.values()].map((list) => weightedOrder(list, rng, weight));
  const picked: Question[] = [];
  while (picked.length < count) {
    const live = groups.filter((group) => group.length > 0);
    if (live.length === 0) break;
    for (const group of shuffle(live, rng)) {
      if (picked.length >= count) break;
      const question = group.shift();
      if (question) picked.push(question);
    }
  }
  return picked;
}

// --- Sauvegarde d'une série en cours ------------------------------------

export interface SerialisedSession {
  v: number;
  id: string;
  createdAt: number;
  requested: number;
  available: number;
  short: boolean;
  filter: ResolvedFilter;
  items: Array<{ q: string; o: number[] }>;
}

export const SESSION_FORMAT = 1;

export function serialiseSession(session: QuizSession): SerialisedSession {
  return {
    v: SESSION_FORMAT,
    id: session.id,
    createdAt: session.createdAt,
    requested: session.requested,
    available: session.available,
    short: session.short,
    filter: session.filter,
    items: session.items.map((item) => ({ q: item.question.id, o: item.order })),
  };
}

/**
 * Relit une série sauvegardée.
 *
 * Rendue volontairement méfiante : la banque a pu changer entre-temps, le
 * stockage a pu être bricolé, le format a pu évoluer. Au moindre doute on rend
 * `null` et l'appelant repart d'un écran de réglage — jamais d'une série
 * incohérente qui planterait à la correction.
 */
export function restoreSession(data: unknown, pool: readonly Question[] = QUESTIONS): QuizSession | null {
  if (!data || typeof data !== 'object') return null;
  const raw = data as Partial<SerialisedSession>;
  if (raw.v !== SESSION_FORMAT) return null;
  if (typeof raw.id !== 'string' || !Array.isArray(raw.items)) return null;

  const index = new Map(pool.map((question) => [question.id, question]));
  const items: QuizItem[] = [];
  const seen = new Set<string>();

  for (const entry of raw.items) {
    if (!entry || typeof entry !== 'object') return null;
    const { q, o } = entry as { q?: unknown; o?: unknown };
    if (typeof q !== 'string' || seen.has(q)) return null;
    const question = index.get(q);
    if (!question) return null;
    if (!Array.isArray(o) || o.length !== question.choices.length) return null;
    const sorted = [...o].sort((a, b) => a - b);
    const permutation = sorted.every((value, position) => value === position);
    if (!permutation) return null;
    seen.add(q);
    const order = o as number[];
    items.push({
      question,
      order,
      choices: order.map((position) => question.choices[position] as string),
      answer: order.indexOf(question.answer),
    });
  }

  return {
    id: raw.id,
    createdAt: Number(raw.createdAt) || Date.now(),
    items,
    requested: Number(raw.requested) || items.length,
    available: Number(raw.available) || items.length,
    short: Boolean(raw.short),
    filter: resolveFilter(raw.filter ?? {}),
  };
}

// --- Correction ---------------------------------------------------------

/** Réponse donnée : position affichée, ou `null` pour une question laissée vide. */
export type QuizAnswers = ReadonlyArray<number | null | undefined>;

export interface QuizItemResult {
  item: QuizItem;
  /** Position affichée choisie par le candidat. */
  given: number | null;
  correct: boolean;
  skipped: boolean;
}

export interface QuizBreakdown {
  key: string;
  asked: number;
  correct: number;
}

export interface QuizScore {
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  /** Part de bonnes réponses, entre 0 et 1. */
  ratio: number;
  /** Note ramenée sur vingt, comme à l'examen. */
  mark: number;
  passed: boolean;
  byTopic: QuizBreakdown[];
  byLevel: QuizBreakdown[];
  results: QuizItemResult[];
}

export interface ScoreOptions {
  passRatio?: number;
  maxMark?: number;
}

export function scoreSession(
  session: QuizSession,
  answers: QuizAnswers,
  options: ScoreOptions = {},
): QuizScore {
  const passRatio = options.passRatio ?? PASS_RATIO;
  const maxMark = options.maxMark ?? MAX_MARK;

  const results: QuizItemResult[] = session.items.map((item, index) => {
    const raw = answers[index];
    const given = typeof raw === 'number' && Number.isInteger(raw) && raw >= 0 && raw < item.choices.length
      ? raw
      : null;
    return { item, given, correct: given !== null && given === item.answer, skipped: given === null };
  });

  const total = results.length;
  const correct = results.filter((result) => result.correct).length;
  const skipped = results.filter((result) => result.skipped).length;
  const ratio = total === 0 ? 0 : correct / total;

  const tally = (key: (result: QuizItemResult) => string): QuizBreakdown[] => {
    const map = new Map<string, QuizBreakdown>();
    for (const result of results) {
      const id = key(result);
      const entry = map.get(id) ?? { key: id, asked: 0, correct: 0 };
      entry.asked += 1;
      if (result.correct) entry.correct += 1;
      map.set(id, entry);
    }
    return [...map.values()];
  };

  return {
    total,
    correct,
    wrong: total - correct - skipped,
    skipped,
    ratio,
    mark: ratio * maxMark,
    passed: total > 0 && ratio >= passRatio,
    byTopic: tally((result) => result.item.question.topic).sort((a, b) => a.correct / a.asked - b.correct / b.asked),
    byLevel: tally((result) => result.item.question.level)
      .sort((a, b) => LEVELS.indexOf(a.key as QuizLevel) - LEVELS.indexOf(b.key as QuizLevel)),
    results,
  };
}

/** Identifiants ratés ou laissés vides : de quoi enchaîner sur une révision. */
export function missedIds(score: QuizScore): string[] {
  return score.results.filter((result) => !result.correct).map((result) => result.item.question.id);
}

/** Note affichable : « 14 / 20 », avec une décimale seulement si nécessaire. */
export function formatMark(mark: number, maxMark = MAX_MARK): string {
  const rounded = Math.round(mark * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toLocaleString('fr-FR');
  return `${text} / ${maxMark}`;
}

// --- Vérification de la banque ------------------------------------------

export interface QuizIssue {
  id: string;
  problem: string;
}

const ID_PATTERN = /^[RT]-[A-Z0-9]+-\d{3}$/;

/** Comparaison souple : accents, casse et espaces multiples ne comptent pas. */
function normalise(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const CATCH_ALL = /(toutes ces reponses|aucune de ces reponses|toutes les reponses|aucune des reponses)/;

/**
 * Relit la banque entière.
 *
 * C'est le filet de sécurité de la suite : les questions arrivent par lots de
 * cinquante, personne ne relira les quatre cents à la main, et une seule
 * mauvaise valeur d'`answer` suffirait à enseigner une erreur. Chaque règle ici
 * correspond à une faute réellement possible en saisie.
 */
export function validateQuestions(
  pool: readonly Question[],
  options: { routes?: readonly string[] } = {},
): QuizIssue[] {
  const issues: QuizIssue[] = [];
  const seen = new Set<string>();
  const routes = options.routes ? new Set(options.routes) : null;
  const prompts = new Map<string, string>();

  for (const question of pool) {
    const id = typeof question?.id === 'string' && question.id ? question.id : '(sans identifiant)';
    const fail = (problem: string): void => void issues.push({ id, problem });

    if (!question || typeof question !== 'object') {
      fail('entrée vide');
      continue;
    }
    if (seen.has(id)) fail('identifiant en double');
    seen.add(id);
    if (!ID_PATTERN.test(id)) fail(`identifiant hors format (attendu R-THEME-001) : ${id}`);

    if (!EXAMS.includes(question.exam)) fail(`épreuve inconnue : ${String(question.exam)}`);
    if (!LEVELS.includes(question.level)) {
      fail(`niveau inconnu : ${String(question.level)}`);
    } else {
      // Chaque niveau a sa plage de numéros : c'est ce qui empêche un lot
      // rédigé plus tard d'écraser silencieusement un identifiant déjà pris.
      const range = LEVEL_RANGES[question.level];
      const number = idNumber(id);
      if (number !== null && (number < range[0] || number > range[1])) {
        fail(`numéro ${number} hors de la plage ${range[0]}-${range[1]} du niveau ${question.level}`);
      }
    }

    const topic = topicById(question.topic);
    if (!topic) {
      fail(`thème inconnu : ${String(question.topic)}`);
    } else {
      if (topic.exam !== question.exam) {
        fail(`le thème « ${topic.label} » appartient à l’autre épreuve`);
      }
      const expected = `${EXAM_PREFIX[question.exam] ?? '?'}-${topic.code}-`;
      if (!id.startsWith(expected)) fail(`l’identifiant devrait commencer par ${expected}`);
    }

    const route = question.route ?? topic?.route;
    if (routes && route && !routes.has(route)) fail(`renvoi vers une page inexistante : ${route}`);

    if (typeof question.prompt !== 'string' || question.prompt.trim().length < 12) {
      fail('énoncé absent ou trop court');
    } else {
      const key = normalise(question.prompt);
      const twin = prompts.get(key);
      if (twin) fail(`énoncé identique à ${twin}`);
      else prompts.set(key, id);
    }
    if (typeof question.explain !== 'string' || question.explain.trim().length < 12) {
      fail('explication absente ou trop courte');
    }

    if (!Array.isArray(question.choices) || question.choices.length !== CHOICE_COUNT) {
      fail(`${Array.isArray(question.choices) ? question.choices.length : 0} propositions au lieu de ${CHOICE_COUNT}`);
      continue;
    }
    const normalised = new Set<string>();
    for (const choice of question.choices) {
      if (typeof choice !== 'string' || choice.trim() === '') {
        fail('proposition vide');
        continue;
      }
      if (choice !== choice.trim()) fail(`proposition entourée d’espaces : « ${choice} »`);
      const key = normalise(choice);
      if (normalised.has(key)) fail(`propositions équivalentes : « ${choice} »`);
      normalised.add(key);
      if (CATCH_ALL.test(key)) fail('proposition fourre-tout : l’examen n’en pose pas');
    }

    if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer >= question.choices.length) {
      fail(`index de réponse hors des propositions : ${String(question.answer)}`);
    }

    for (const [field, value] of Object.entries({
      énoncé: question.prompt,
      explication: question.explain,
      propositions: Array.isArray(question.choices) ? question.choices.join(' ') : '',
    })) {
      if (typeof value !== 'string') continue;
      if (value.includes("'")) fail(`apostrophe droite dans l’${field}`);
      if (/ {2,}/.test(value)) fail(`espaces multiples dans l’${field}`);
    }
  }

  return issues;
}

export interface PoolStats {
  total: number;
  byExam: Record<string, number>;
  byLevel: Record<string, number>;
  byTopic: Record<string, number>;
  /** Nombre de questions pour chaque couple épreuve/niveau. */
  byCell: Record<string, number>;
}

/** Photographie de la banque : sert à l'écran de réglage et aux tests de volume. */
export function poolStats(pool: readonly Question[]): PoolStats {
  const stats: PoolStats = { total: 0, byExam: {}, byLevel: {}, byTopic: {}, byCell: {} };
  const bump = (bucket: Record<string, number>, key: string): void => {
    bucket[key] = (bucket[key] ?? 0) + 1;
  };
  for (const question of pool) {
    stats.total += 1;
    bump(stats.byExam, question.exam);
    bump(stats.byLevel, question.level);
    bump(stats.byTopic, question.topic);
    bump(stats.byCell, `${question.exam}|${question.level}`);
  }
  return stats;
}

/** Nombre de questions disponibles pour un filtre donné. */
export function availableCount(pool: readonly Question[], filter: QuizFilter): number {
  return filterPool(pool, filter).length;
}
