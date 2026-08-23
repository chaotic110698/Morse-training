/**
 * Réglages communs aux exercices d'écoute.
 *
 * Deux longueurs de série sont proposées, et elles ne se distinguent pas que
 * par le nombre : la série longue élargit la rotation des caractères et y
 * glisse des répétitions immédiates. Ces choix appartiennent à l'entraînement,
 * pas à la méthode Koch, d'où ce module séparé.
 */

import type { CharRecord } from './koch.ts';
import type { Progress } from './progress.ts';

export interface SessionLength {
  value: number;
  label: string;
  note: string;
}

export const SESSION_LENGTHS: SessionLength[] = [
  {
    value: 25,
    label: '25 caractères',
    note: 'La série courte : de quoi mesurer sa progression sans y passer la soirée.',
  },
  {
    value: 50,
    label: '50 caractères',
    note: 'Les caractères tournent sur une fenêtre plus large, et quelques répétitions immédiates s’y glissent — deux fois la même lettre, le piège classique du trafic réel.',
  },
];

/** Vrai pour les séries qui méritent une rotation large et des pièges. */
export function longSession(length: number): boolean {
  return length >= 50;
}

/** Relevé d'un caractère, dans la forme attendue par le tirage pondéré. */
export function charRecord(progress: Progress, char: string): CharRecord | null {
  const stat = progress.chars[char];
  if (!stat || stat.attempts === 0) return null;
  return { attempts: stat.attempts, accuracy: stat.correct / stat.attempts };
}
