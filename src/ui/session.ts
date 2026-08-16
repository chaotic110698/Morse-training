/**
 * Suivi d'une série d'entraînement.
 *
 * Mutualise ce que les quatre exercices ont en commun : compter les réponses,
 * mesurer les temps, enregistrer la progression et fermer proprement la
 * session même si l'utilisateur quitte la page en cours de route.
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

  /** Temps de réponse moyen sur la série, en millisecondes. */
  get averageResponseMs(): number | null {
    if (this.entries.length === 0) return null;
    return this.entries.reduce((sum, entry) => sum + entry.responseMs, 0) / this.entries.length;
  }

  /**
   * Enregistre une réponse. `char` désigne l'élément travaillé : un caractère
   * en mode Koch, le mot entier dans les exercices de mots.
   */
  record(char: string, answer: string | null, correct: boolean, responseMs: number): void {
    this.entries.push({ char, answer, correct, responseMs });
    this.store.mutateProgress(
      (progress) => recordAttempt(progress, char, correct, responseMs),
      { silent: true },
    );
  }

  /** Compte des caractères émis au manipulateur, pour les succès d'émission. */
  countSent(amount = 1): void {
    this.store.mutateProgress(
      (progress) => {
        progress.totals.sent += amount;
      },
      { silent: true },
    );
  }

  /**
   * Clôture la série et l'ajoute à l'historique. Sans effet si elle est vide
   * ou déjà close, ce qui rend l'appel sur destruction de la vue inoffensif.
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
