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
}

export const MAX_SESSION_HISTORY = 250;

export function emptyProgress(): Progress {
  return {
    kochLevel: 2,
    chars: {},
    sessions: [],
    totals: { sessions: 0, attempts: 0, correct: 0, trainingMs: 0, sent: 0 },
    streak: { current: 0, longest: 0, lastDay: null },
    achievements: {},
    flags: {},
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
