/**
 * Persistance locale.
 *
 * Tout tient dans le `localStorage` du navigateur : aucun compte, aucun
 * serveur, aucune donnée qui sort de l'appareil. En contrepartie la
 * progression est liée au navigateur, d'où l'export et l'import JSON qui
 * permettent de la sauvegarder ou de la transférer sur un autre appareil.
 */

import { DEFAULT_SETTINGS, normalizeSettings, type Settings } from './settings.ts';
import {
  emptyProgress,
  emptyQuizProgress,
  emptyStoryProgress,
  MAX_QUIZ_RUNS,
  MAX_SESSION_HISTORY,
  type Progress,
  type QuizProgress,
  type StoryProgress,
} from './progress.ts';
import { KOCH_ORDERS, kochMaxLevel } from './koch.ts';

const STORAGE_KEY = 'morse-training';
export const SCHEMA_VERSION = 3;

export interface SaveFile {
  app: 'morse-training';
  version: number;
  exportedAt: string;
  settings: Settings;
  progress: Progress;
}

interface Persisted {
  version: number;
  settings: Partial<Settings>;
  progress: Partial<Progress>;
}

/** Vrai si le stockage local est utilisable (navigation privée, quotas, etc.). */
export function storageAvailable(): boolean {
  try {
    const probe = '__morse_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}


/**
 * Remet le questionnaire en forme.
 *
 * Ce bloc est apparu après coup : une sauvegarde antérieure n'en contient pas,
 * et une sauvegarde bricolée peut contenir n'importe quoi. On reconstruit donc
 * champ par champ plutôt que de faire confiance à la structure lue.
 */
function normalizeQuiz(input: Partial<QuizProgress> | null | undefined): QuizProgress {
  const base = emptyQuizProgress();
  if (!input || typeof input !== 'object') return base;

  const count = (value: unknown): number => Math.max(0, Math.floor(Number(value) || 0));

  for (const [id, raw] of Object.entries(input.questions ?? {})) {
    if (!raw || typeof raw !== 'object') continue;
    const asked = count(raw.asked);
    base.questions[id] = {
      asked,
      correct: Math.min(asked, count(raw.correct)),
      lastAt: count(raw.lastAt),
      lastOk: Boolean(raw.lastOk),
    };
  }
  for (const [id, raw] of Object.entries(input.topics ?? {})) {
    if (!raw || typeof raw !== 'object') continue;
    const asked = count(raw.asked);
    base.topics[id] = { asked, correct: Math.min(asked, count(raw.correct)), lastAt: count(raw.lastAt) };
  }
  base.runs = Array.isArray(input.runs)
    ? input.runs.filter((run) => run && typeof run === 'object').slice(0, MAX_QUIZ_RUNS)
    : [];
  for (const [key, value] of Object.entries(input.best ?? {})) {
    const ratio = Number(value);
    if (Number.isFinite(ratio)) base.best[key] = Math.min(1, Math.max(0, ratio));
  }
  return base;
}

/**
 * Remet le mode histoire en forme. Même prudence que pour le questionnaire :
 * une sauvegarde antérieure n'a pas ce bloc, et le récit doit repartir de zéro
 * plutôt que de faire confiance à ce qu'on lit.
 */
function normalizeStory(input: Partial<StoryProgress> | null | undefined): StoryProgress {
  const base = emptyStoryProgress();
  if (!input || typeof input !== 'object') return base;

  const count = (value: unknown): number => Math.max(0, Math.floor(Number(value) || 0));
  for (const [id, raw] of Object.entries(input.episodes ?? {})) {
    if (!raw || typeof raw !== 'object') continue;
    base.episodes[id] = {
      beat: count(raw.beat),
      completed: Boolean(raw.completed),
      errors: count(raw.errors),
      bestCopy: Math.min(1, Math.max(0, Number(raw.bestCopy) || 0)),
      withoutTable: raw.withoutTable !== false,
      mode: raw.mode === 'operateur' ? 'operateur' : 'recit',
      operatorClear: raw.operatorClear === true,
      updatedAt: count(raw.updatedAt),
    };
  }
  base.mode = input.mode === 'operateur' ? 'operateur' : 'recit';
  return base;
}

/**
 * Un compteur relu depuis un fichier : entier, fini, jamais négatif.
 *
 * `Number(x) || 0` ne suffit pas — il laisse passer l'infini, et JSON.stringify
 * écrit `null` pour NaN comme pour l'infini, si bien qu'une sauvegarde peut
 * très bien contenir l'un ou l'autre sans avoir été trafiquée.
 */
function counter(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** Un objet nu : ni tableau, ni chaîne, ni nombre — que l'on peut étaler. */
function plainObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Le niveau le plus haut qu'un ordre de Koch permette. Sert de plafond : sans
 * lui, une sauvegarde abîmée affichait « Niveau 1000000000 / 41 ».
 */
const MAX_KOCH = Math.max(...KOCH_ORDERS.map((order) => kochMaxLevel(order.id)));

function normalizeProgress(input: Partial<Progress> | null | undefined): Progress {
  const base = emptyProgress();
  if (!input || typeof input !== 'object') return base;

  const chars: Progress['chars'] = {};
  for (const [char, raw] of Object.entries(input.chars ?? {})) {
    if (!raw || typeof raw !== 'object') continue;
    const attempts = Math.max(0, Math.floor(Number(raw.attempts) || 0));
    chars[char] = {
      attempts,
      correct: Math.min(attempts, Math.max(0, Math.floor(Number(raw.correct) || 0))),
      totalMs: Math.max(0, Number(raw.totalMs) || 0),
      lastSeen: Number(raw.lastSeen) || 0,
    };
  }

  const sessions = Array.isArray(input.sessions)
    ? input.sessions.filter((session) => session && typeof session === 'object').slice(0, MAX_SESSION_HISTORY)
    : [];

  // Les compteurs étaient étalés tels quels : un fichier portant
  // `attempts: "beaucoup"` donnait une progression dont les statistiques se
  // calculaient sur une chaîne, et l'affichage sortait NaN.
  const rawTotals = plainObject(input.totals);
  const attempts = counter(rawTotals['attempts']);
  const totals: Progress['totals'] = {
    sessions: counter(rawTotals['sessions']),
    attempts,
    // On ne peut pas avoir répondu juste plus souvent qu'on n'a répondu.
    correct: Math.min(attempts, counter(rawTotals['correct'])),
    trainingMs: counter(rawTotals['trainingMs']),
    sent: counter(rawTotals['sent']),
  };

  const rawStreak = plainObject(input.streak);
  const current = counter(rawStreak['current']);
  const streak: Progress['streak'] = {
    current,
    // Le record ne peut pas être plus bas que la série en cours.
    longest: Math.max(current, counter(rawStreak['longest'])),
    lastDay: typeof rawStreak['lastDay'] === 'string' ? rawStreak['lastDay'] : null,
  };

  const level = Number(input.kochLevel);
  return {
    kochLevel: Number.isFinite(level)
      ? Math.min(MAX_KOCH, Math.max(2, Math.floor(level)))
      : base.kochLevel,
    chars,
    sessions,
    totals,
    streak,
    achievements: { ...plainObject(input.achievements) } as Progress['achievements'],
    flags: { ...plainObject(input.flags) } as Progress['flags'],
    quiz: normalizeQuiz(input.quiz),
    story: normalizeStory(input.story),
  };
}

export function loadState(): { settings: Settings; progress: Progress } {
  if (!storageAvailable()) {
    return { settings: { ...DEFAULT_SETTINGS }, progress: emptyProgress() };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { settings: { ...DEFAULT_SETTINGS }, progress: emptyProgress() };
    const parsed = JSON.parse(raw) as Persisted;
    return {
      settings: normalizeSettings(parsed.settings),
      progress: normalizeProgress(parsed.progress),
    };
  } catch {
    // Données corrompues : on repart proprement plutôt que de bloquer le site.
    return { settings: { ...DEFAULT_SETTINGS }, progress: emptyProgress() };
  }
}

export function saveState(settings: Settings, progress: Progress): boolean {
  if (!storageAvailable()) return false;
  try {
    const payload: Persisted = { version: SCHEMA_VERSION, settings, progress };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function clearState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Rien à faire : l'appelant réinitialise déjà l'état en mémoire.
  }
}

export function buildSaveFile(settings: Settings, progress: Progress): SaveFile {
  return {
    app: 'morse-training',
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    progress,
  };
}

export interface ImportResult {
  ok: boolean;
  message: string;
  settings?: Settings;
  progress?: Progress;
}

/** Relit un fichier d'export et le valide avant de le proposer à l'application. */
export function parseSaveFile(text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, message: "Le fichier n’est pas du JSON valide." };
  }
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, message: 'Le fichier est vide ou mal formé.' };
  }
  const file = parsed as Partial<SaveFile>;
  if (file.app !== 'morse-training') {
    return { ok: false, message: "Ce fichier ne provient pas de Morse Training." };
  }
  if (typeof file.version !== 'number' || file.version > SCHEMA_VERSION) {
    return {
      ok: false,
      message: "Ce fichier a été créé par une version plus récente de l’application.",
    };
  }
  return {
    ok: true,
    message: 'Sauvegarde importée.',
    settings: normalizeSettings(file.settings),
    progress: normalizeProgress(file.progress),
  };
}

/** Déclenche le téléchargement d'un fichier texte côté navigateur. */
export function downloadText(filename: string, text: string, mime = 'application/json'): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  // Laisse au navigateur le temps de démarrer le téléchargement.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
