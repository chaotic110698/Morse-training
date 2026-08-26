/** Statistiques et progression, conservées localement dans le navigateur. */

export type TrainingMode = 'listen' | 'send' | 'words' | 'read';

export const MODE_LABELS: Record<TrainingMode, string> = {
  listen: 'Écoute',
  send: 'Émission',
  words: 'Mots et indicatifs',
  read: 'Lecture visuelle',
};

export interface CharStat {
  attempts: number;
  correct: number;
  /** Somme des temps de réponse, pour en tirer une moyenne. */
  totalMs: number;
  lastSeen: number;
}

export interface SessionRecord {
  id: string;
  mode: TrainingMode;
  startedAt: number;
  durationMs: number;
  attempts: number;
  correct: number;
  charWpm: number;
  effectiveWpm: number;
  kochLevel: number | null;
}

export interface Totals {
  sessions: number;
  attempts: number;
  correct: number;
  trainingMs: number;
  /** Caractères émis au manipulateur, tous exercices confondus. */
  sent: number;
}

export interface Streak {
  current: number;
  longest: number;
  /** Dernière journée d'entraînement, au format AAAA-MM-JJ local. */
  lastDay: string | null;
}

/** Statistiques du questionnaire de la licence, tenues à part du morse. */
export interface QuizQuestionStat {
  asked: number;
  correct: number;
  lastAt: number;
  /** Résultat de la dernière tentative : ce qui compte pour une révision. */
  lastOk: boolean;
}

export interface QuizTopicStat {
  asked: number;
  correct: number;
  lastAt: number;
}

export interface QuizRunRecord {
  id: string;
  at: number;
  /** `examen`, `libre` ou `revision` — laissé en texte libre, c'est du stockage. */
  mode: string;
  exam: string;
  level: string;
  asked: number;
  correct: number;
  durationMs: number;
  passed: boolean;
}

export interface QuizProgress {
  questions: Record<string, QuizQuestionStat>;
  topics: Record<string, QuizTopicStat>;
  /** Historique borné, du plus récent au plus ancien. */
  runs: QuizRunRecord[];
  /** Meilleure part de bonnes réponses par couple épreuve/niveau. */
  best: Record<string, number>;
}

/**
 * Mode histoire.
 *
 * Suivi séparé du reste : on n'y mesure pas une vitesse mais un avancement
 * dans un récit, et l'on doit pouvoir reprendre un épisode au temps où on
 * l'avait laissé.
 */
export interface StoryEpisodeRecord {
  /**
   * Marque-page, et non plus haut fait : c'est là qu'on reprendra. Il peut
   * donc reculer, quand on décide de rejouer un épisode depuis le début.
   */
  beat: number;
  completed: boolean;
  /** Erreurs de manipulation cumulées sur l'épisode. */
  errors: number;
  /** Part des caractères correctement copiés, du meilleur passage. */
  bestCopy: number;
  /** Vrai si l'épisode a été mené sans ouvrir la table de déchiffrage. */
  withoutTable: boolean;
  updatedAt: number;
}

export interface StoryProgress {
  episodes: Record<string, StoryEpisodeRecord>;
  /** Niveau de lecture : le récit d'abord, ou les conditions réelles. */
  mode: 'recit' | 'operateur';
}

export function emptyStoryProgress(): StoryProgress {
  return { episodes: {}, mode: 'recit' };
}

export function emptyEpisodeRecord(): StoryEpisodeRecord {
  return { beat: 0, completed: false, errors: 0, bestCopy: 0, withoutTable: true, updatedAt: 0 };
}

/**
 * Enregistre l'avancement d'un épisode. Ce qui est acquis ne se perd pas —
 * l'achèvement, la meilleure copie, la table consultée — mais la position, elle,
 * suit le joueur, y compris quand il revient en arrière.
 */
export function recordEpisode(
  progress: Progress,
  id: string,
  update: Partial<StoryEpisodeRecord>,
  now = Date.now(),
): void {
  const previous = progress.story.episodes[id] ?? emptyEpisodeRecord();
  progress.story.episodes[id] = {
    beat: update.beat ?? previous.beat,
    completed: previous.completed || (update.completed ?? false),
    errors: previous.errors + (update.errors ?? 0),
    bestCopy: Math.max(previous.bestCopy, update.bestCopy ?? 0),
    withoutTable: previous.withoutTable && (update.withoutTable ?? true),
    updatedAt: now,
  };
}

/** Nombre d'épisodes menés à leur terme. */
export function storyCompleted(progress: Progress): number {
  return Object.values(progress.story.episodes).filter((record) => record.completed).length;
}

export interface Progress {
  kochLevel: number;
  chars: Record<string, CharStat>;
  /** Historique borne aux dernières sessions, du plus récent au plus ancien. */
  sessions: SessionRecord[];
  totals: Totals;
  streak: Streak;
  /** Identifiant du succès vers l'horodatage de déblocage. */
  achievements: Record<string, number>;
  /**
   * Événements ponctuels à mémoriser une fois pour toutes : premier SOS émis,
   * page d'histoire lue jusqu'au bout, etc. La valeur est l'horodatage.
   */
  flags: Record<string, number>;
  /** Questionnaire de la licence : suivi séparé, unités et enjeux différents. */
  quiz: QuizProgress;
  /** Mode histoire : avancement dans le récit, épisode par épisode. */
  story: StoryProgress;
}

export const MAX_SESSION_HISTORY = 250;
export const MAX_QUIZ_RUNS = 80;

export function emptyQuizProgress(): QuizProgress {
  return { questions: {}, topics: {}, runs: [], best: {} };
}

export function emptyProgress(): Progress {
  return {
    kochLevel: 2,
    chars: {},
    sessions: [],
    totals: { sessions: 0, attempts: 0, correct: 0, trainingMs: 0, sent: 0 },
    streak: { current: 0, longest: 0, lastDay: null },
    achievements: {},
    flags: {},
    quiz: emptyQuizProgress(),
    story: emptyStoryProgress(),
  };
}

/** Journée locale au format AAAA-MM-JJ, base des séries quotidiennes. */
export function dayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function previousDay(key: string): string {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
  date.setDate(date.getDate() - 1);
  return dayKey(date);
}

/** Enregistre une réponse sur un caractère donné. */
export function recordAttempt(
  progress: Progress,
  char: string,
  correct: boolean,
  responseMs: number,
): void {
  const stat = progress.chars[char] ?? { attempts: 0, correct: 0, totalMs: 0, lastSeen: 0 };
  stat.attempts += 1;
  if (correct) stat.correct += 1;
  stat.totalMs += Math.max(0, responseMs);
  stat.lastSeen = Date.now();
  progress.chars[char] = stat;
  progress.totals.attempts += 1;
  if (correct) progress.totals.correct += 1;
}

/** Précision sur un caractère, ou `null` s'il n'a jamais été testé. */
export function charAccuracy(progress: Progress, char: string): number | null {
  const stat = progress.chars[char];
  if (!stat || stat.attempts === 0) return null;
  return stat.correct / stat.attempts;
}

/** Temps de réponse moyen sur un caractère, en millisecondes. */
export function charSpeed(progress: Progress, char: string): number | null {
  const stat = progress.chars[char];
  if (!stat || stat.attempts === 0) return null;
  return stat.totalMs / stat.attempts;
}

export function overallAccuracy(progress: Progress): number | null {
  if (progress.totals.attempts === 0) return null;
  return progress.totals.correct / progress.totals.attempts;
}

/** Ajoute une session terminée et met à jour totaux et série quotidienne. */
export function commitSession(progress: Progress, record: SessionRecord): void {
  progress.sessions.unshift(record);
  if (progress.sessions.length > MAX_SESSION_HISTORY) {
    progress.sessions.length = MAX_SESSION_HISTORY;
  }
  progress.totals.sessions += 1;
  progress.totals.trainingMs += record.durationMs;
  touchStreak(progress);
}

/**
 * Met à jour la série de jours consécutifs. Deux sessions le même jour ne
 * comptent qu'une fois ; un jour saute remet le compteur à un.
 */
export function touchStreak(progress: Progress, today = dayKey()): void {
  const { streak } = progress;
  if (streak.lastDay === today) return;
  streak.current = streak.lastDay === previousDay(today) ? streak.current + 1 : 1;
  streak.longest = Math.max(streak.longest, streak.current);
  streak.lastDay = today;
}

/** Caractères les plus fragiles, du plus rate au moins rate. */
export function weakestChars(
  progress: Progress,
  charset: string[],
  limit = 5,
  minAttempts = 3,
): Array<{ char: string; accuracy: number; attempts: number }> {
  return charset
    .map((char) => ({ char, stat: progress.chars[char] }))
    .filter((entry): entry is { char: string; stat: CharStat } =>
      Boolean(entry.stat && entry.stat.attempts >= minAttempts))
    .map(({ char, stat }) => ({
      char,
      accuracy: stat.correct / stat.attempts,
      attempts: stat.attempts,
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);
}

/** Nombre de sessions par jour sur les `days` derniers jours, du plus ancien au plus récent. */
export function activityByDay(progress: Progress, days = 30): Array<{ day: string; count: number }> {
  const counts = new Map<string, number>();
  for (const session of progress.sessions) {
    const key = dayKey(new Date(session.startedAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const out: Array<{ day: string; count: number }> = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - (days - 1));
  for (let i = 0; i < days; i += 1) {
    const key = dayKey(cursor);
    out.push({ day: key, count: counts.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}


// --- Questionnaire de la licence ----------------------------------------

export interface QuizRunInput {
  id: string;
  mode: string;
  exam: string;
  level: string;
  durationMs: number;
  passed: boolean;
  answers: Array<{ id: string; topic: string; correct: boolean }>;
}

/**
 * Enregistre une série terminée.
 *
 * Les réponses au questionnaire n'alimentent pas les compteurs du morse : une
 * bonne réponse à une question de réglementation n'est pas un caractère copié,
 * et la mélanger fausserait aussi bien la précision affichée que les succès.
 * Seule la série quotidienne est touchée — réviser reste s'entraîner.
 */
export function recordQuizRun(progress: Progress, run: QuizRunInput): void {
  const quiz = (progress.quiz ??= emptyQuizProgress());
  const at = Date.now();
  let correct = 0;

  for (const answer of run.answers) {
    if (answer.correct) correct += 1;

    const question = quiz.questions[answer.id] ?? { asked: 0, correct: 0, lastAt: 0, lastOk: false };
    question.asked += 1;
    if (answer.correct) question.correct += 1;
    question.lastAt = at;
    question.lastOk = answer.correct;
    quiz.questions[answer.id] = question;

    const topic = quiz.topics[answer.topic] ?? { asked: 0, correct: 0, lastAt: 0 };
    topic.asked += 1;
    if (answer.correct) topic.correct += 1;
    topic.lastAt = at;
    quiz.topics[answer.topic] = topic;
  }

  quiz.runs.unshift({
    id: run.id,
    at,
    mode: run.mode,
    exam: run.exam,
    level: run.level,
    asked: run.answers.length,
    correct,
    durationMs: Math.max(0, run.durationMs),
    passed: run.passed,
  });
  if (quiz.runs.length > MAX_QUIZ_RUNS) quiz.runs.length = MAX_QUIZ_RUNS;

  if (run.answers.length > 0) {
    const key = `${run.exam}|${run.level}`;
    const ratio = correct / run.answers.length;
    if (ratio > (quiz.best[key] ?? 0)) quiz.best[key] = ratio;
  }

  touchStreak(progress);
}

/**
 * Poids d'une question dans une révision.
 *
 * Une question jamais vue mérite d'être vue ; une question ratée la dernière
 * fois mérite de revenir vite ; une question sue depuis longtemps ne disparaît
 * pas pour autant, elle passe simplement après.
 */
export function revisionWeight(progress: Progress, questionId: string, topic: string): number {
  const quiz = progress.quiz ?? emptyQuizProgress();
  const stat = quiz.questions[questionId];
  if (!stat || stat.asked === 0) return 3;

  const accuracy = stat.correct / stat.asked;
  let weight = stat.lastOk ? 1 : 6;
  if (accuracy < 0.5) weight *= 2;
  else if (accuracy >= 0.8 && stat.lastOk) weight *= 0.4;

  // Un thème globalement fragile tire toutes ses questions vers le haut.
  const topicStat = quiz.topics[topic];
  if (topicStat && topicStat.asked >= 5 && topicStat.correct / topicStat.asked < 0.6) weight *= 1.5;

  return weight;
}

/** Part de bonnes réponses sur tout l'historique du questionnaire. */
export function quizAccuracy(progress: Progress): number | null {
  const quiz = progress.quiz ?? emptyQuizProgress();
  let asked = 0;
  let correct = 0;
  for (const stat of Object.values(quiz.topics)) {
    asked += stat.asked;
    correct += stat.correct;
  }
  return asked === 0 ? null : correct / asked;
}

/** Questions à retravailler en priorité : ratées la dernière fois, ou jamais vues. */
export function quizWeakTopics(
  progress: Progress,
  limit = 5,
  minAsked = 3,
): Array<{ topic: string; accuracy: number; asked: number }> {
  const quiz = progress.quiz ?? emptyQuizProgress();
  return Object.entries(quiz.topics)
    .filter(([, stat]) => stat.asked >= minAsked)
    .map(([topic, stat]) => ({ topic, accuracy: stat.correct / stat.asked, asked: stat.asked }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours} h ${`${minutes}`.padStart(2, '0')}`;
  if (minutes > 0) return `${minutes} min`;
  return `${Math.round(ms / 1000)} s`;
}

export function formatPercent(value: number | null): string {
  if (value === null) return '—';
  return `${Math.round(value * 100)} %`;
}
