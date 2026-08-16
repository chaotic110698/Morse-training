/**
 * Petit pont entre la progression et les succes.
 *
 * Il existe uniquement pour eviter que `store.ts` n'importe deux modules qui
 * decrivent le meme domaine, et pour offrir une variante non bloquante du
 * deblocage : une erreur dans le calcul d'un succes ne doit jamais empecher
 * l'enregistrement d'une session.
 */

import { unlockAchievements, type Achievement } from './achievements.ts';

export { emptyProgress } from './progress.ts';
export type { Progress } from './progress.ts';

export function unlockAchievementsSafe(progress: Parameters<typeof unlockAchievements>[0]): Achievement[] {
  try {
    return unlockAchievements(progress);
  } catch {
    return [];
  }
}
