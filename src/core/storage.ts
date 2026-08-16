/**
 * Persistance locale.
 *
 * Tout tient dans le `localStorage` du navigateur : aucun compte, aucun
 * serveur, aucune donnee qui sort de l'appareil. En contrepartie la
 * progression est liee au navigateur, d'ou l'export et l'import JSON qui
 * permettent de la sauvegarder ou de la transferer sur un autre appareil.
 */

import { DEFAULT_SETTINGS, normalizeSettings, type Settings } from './settings.ts';
import { emptyProgress, MAX_SESSION_HISTORY, type Progress } from './progress.ts';

const STORAGE_KEY = 'morse-training';
export const SCHEMA_VERSION = 1;

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

/** Vrai si le stockage local est utilisable (navigation privee, quotas, etc.). */
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

  return {
    kochLevel: Math.max(2, Math.floor(Number(input.kochLevel) || base.kochLevel)),
    chars,
    sessions,
    totals: { ...base.totals, ...(input.totals ?? {}) },
    streak: { ...base.streak, ...(input.streak ?? {}) },
    achievements: { ...(input.achievements ?? {}) },
    flags: { ...(input.flags ?? {}) },
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
    // Donnees corrompues : on repart proprement plutot que de bloquer le site.
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
    // Rien a faire : l'appelant reinitialise deja l'etat en memoire.
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

/** Relit un fichier d'export et le valide avant de le proposer a l'application. */
export function parseSaveFile(text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, message: "Le fichier n'est pas du JSON valide." };
  }
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, message: 'Le fichier est vide ou mal forme.' };
  }
  const file = parsed as Partial<SaveFile>;
  if (file.app !== 'morse-training') {
    return { ok: false, message: "Ce fichier ne provient pas de Morse Training." };
  }
  if (typeof file.version !== 'number' || file.version > SCHEMA_VERSION) {
    return {
      ok: false,
      message: "Ce fichier a ete cree par une version plus recente de l'application.",
    };
  }
  return {
    ok: true,
    message: 'Sauvegarde importee.',
    settings: normalizeSettings(file.settings),
    progress: normalizeProgress(file.progress),
  };
}

/** Declenche le telechargement d'un fichier texte cote navigateur. */
export function downloadText(filename: string, text: string, mime = 'application/json'): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  // Laisse au navigateur le temps de demarrer le telechargement.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
