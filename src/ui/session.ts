/**
 * Suivi d'une serie d'entrainement.
 *
 * Mutualise ce que les quatre exercices ont en commun : compter les reponses,
 * mesurer les temps, enregistrer la progression et fermer proprement la
 * session meme si l'utilisateur quitte la page en cours de route.
 */

import { commitSession, recordAttempt, type SessionRecord, type TrainingMode } from '../core/progress.ts';
import type { AppStore } from '../core/store.ts';

export interface SessionResultEntry {
  char: string;
  answer: string | null;
  correct: boolean;
  responseMs: number;
}

export class SessionTracker {
  readonly mode: TrainingMode;
  readonly target: number;
  readonly entries: SessionResultEntry[] = [];

  private readonly store: AppStore;
  private startedAt = 0;
  private committed = false;

  constructor(store: AppStore, mode: TrainingMode, target: number) {
    this.store = store;
    this.mode = mode;
    this.target = target;
  }

  start(): void {
    this.startedAt = Date.now();
    this.entries.length = 0;
    this.committed = false;
  }

  get started(): boolean {
    return this.startedAt > 0;
  }

  get count(): number {
    return this.entries.length;
  }

  get correct(): number {
    return this.entries.filter((entry) => entry.correct).length;
  }

  get accuracy(): number | null {
    return this.entries.length === 0 ? null : this.correct / this.entries.length;
  }

  get elapsedMs(): number {
    return this.startedAt === 0 ? 0 : Date.now() - this.startedAt;
  }

  get finished(): boolean {
    return this.entries.length >= this.target;
  }

  /** Temps de reponse moyen sur la serie, en millisecondes. */
  get averageResponseMs(): number | null {
    if (this.entries.length === 0) return null;
    return this.entries.reduce((sum, entry) => sum + entry.responseMs, 0) / this.entries.length;
  }

  /**
   * Enregistre une reponse. `char` designe l'element travaille : un caractere
   * en mode Koch, le mot entier dans les exercices de mots.
   */
  record(char: string, answer: string | null, correct: boolean, responseMs: number): void {
    this.entries.push({ char, answer, correct, responseMs });
    this.store.mutateProgress(
      (progress) => recordAttempt(progress, char, correct, responseMs),
      { silent: true },
    );
  }

  /** Compte des caracteres emis au manipulateur, pour les succes d'emission. */
  countSent(amount = 1): void {
    this.store.mutateProgress(
      (progress) => {
        progress.totals.sent += amount;
      },
      { silent: true },
    );
  }

  /**
   * Cloture la serie et l'ajoute a l'historique. Sans effet si elle est vide
   * ou deja close, ce qui rend l'appel sur destruction de la vue inoffensif.
   */
  commit(kochLevel: number | null = null): SessionRecord | null {
    if (this.committed || this.entries.length === 0) return null;
    this.committed = true;
    const record: SessionRecord = {
      id: `${this.startedAt}-${this.mode}`,
      mode: this.mode,
      startedAt: this.startedAt,
      durationMs: this.elapsedMs,
      attempts: this.entries.length,
      correct: this.correct,
      charWpm: this.store.settings.charWpm,
      effectiveWpm: this.store.settings.effectiveWpm,
      kochLevel,
    };
    this.store.mutateProgress((progress) => commitSession(progress, record));
    this.store.saveNow();
    return record;
  }
}
