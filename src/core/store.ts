/**
 * Etat applicatif partage : reglages, progression et services audio/haptique.
 *
 * Un simple modele d'abonnement suffit ici. Les vues s'abonnent pour se
 * redessiner quand les reglages changent, et l'enregistrement dans le stockage
 * local est temporise pour ne pas ecrire a chaque frappe.
 */

import { AudioEngine } from './audio.ts';
import { Haptics } from './haptics.ts';
import { resolveTiming, type ResolvedTiming } from './timing.ts';
import { DEFAULT_SETTINGS, type Settings } from './settings.ts';
import { emptyProgress, unlockAchievementsSafe, type Progress } from './progress-bridge.ts';
import { clearState, loadState, saveState } from './storage.ts';
import type { Achievement } from './achievements.ts';

type Listener = () => void;
type AchievementListener = (achievements: Achievement[]) => void;

export class AppStore {
  settings: Settings;
  progress: Progress;
  readonly audio: AudioEngine;
  readonly haptics: Haptics;

  private listeners = new Set<Listener>();
  private achievementListeners = new Set<AchievementListener>();
  private saveTimer = 0;

  constructor() {
    const loaded = loadState();
    this.settings = loaded.settings;
    this.progress = loaded.progress;
    this.audio = new AudioEngine({
      frequency: this.settings.frequency,
      volume: this.settings.volume,
      rampMs: this.settings.rampMs,
      waveform: this.settings.waveform,
    });
    this.haptics = new Haptics();
    this.haptics.setEnabled(this.settings.haptics);
  }

  get timing(): ResolvedTiming {
    return resolveTiming({
      charWpm: this.settings.charWpm,
      effectiveWpm: this.settings.effectiveWpm,
    });
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onAchievements(listener: AchievementListener): () => void {
    this.achievementListeners.add(listener);
    return () => this.achievementListeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }

  updateSettings(patch: Partial<Settings>): void {
    this.settings = { ...this.settings, ...patch };
    // La vitesse globale ne peut pas depasser la vitesse des caracteres.
    if (this.settings.effectiveWpm > this.settings.charWpm) {
      this.settings.effectiveWpm = this.settings.charWpm;
    }
    this.audio.updateSettings({
      frequency: this.settings.frequency,
      volume: this.settings.volume,
      rampMs: this.settings.rampMs,
      waveform: this.settings.waveform,
    });
    this.haptics.setEnabled(this.settings.haptics);
    this.scheduleSave();
    this.emit();
  }

  /** Applique une mutation a la progression puis verifie les succes. */
  mutateProgress(mutator: (progress: Progress) => void, options: { silent?: boolean } = {}): void {
    mutator(this.progress);
    const freshly = unlockAchievementsSafe(this.progress);
    this.scheduleSave();
    if (freshly.length > 0) {
      for (const listener of this.achievementListeners) listener(freshly);
    }
    if (!options.silent) this.emit();
  }

  /** Marque un evenement ponctuel, une seule fois. */
  raiseFlag(flag: string): void {
    if (this.progress.flags[flag]) return;
    this.mutateProgress((progress) => {
      progress.flags[flag] = Date.now();
    });
  }

  replaceState(settings: Settings, progress: Progress): void {
    this.settings = settings;
    this.progress = progress;
    this.audio.updateSettings({
      frequency: settings.frequency,
      volume: settings.volume,
      rampMs: settings.rampMs,
      waveform: settings.waveform,
    });
    this.haptics.setEnabled(settings.haptics);
    this.saveNow();
    this.emit();
  }

  resetProgress(): void {
    this.progress = emptyProgress();
    this.saveNow();
    this.emit();
  }

  resetSettings(): void {
    this.updateSettings({ ...DEFAULT_SETTINGS });
  }

  resetEverything(): void {
    clearState();
    this.settings = { ...DEFAULT_SETTINGS };
    this.progress = emptyProgress();
    this.audio.updateSettings(this.settings);
    this.haptics.setEnabled(this.settings.haptics);
    this.emit();
  }

  private scheduleSave(): void {
    if (this.saveTimer) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => this.saveNow(), 400);
  }

  saveNow(): void {
    if (this.saveTimer) window.clearTimeout(this.saveTimer);
    this.saveTimer = 0;
    saveState(this.settings, this.progress);
  }
}
