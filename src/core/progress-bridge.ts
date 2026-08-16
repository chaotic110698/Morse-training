/**
 * Petit pont entre la progression et les succès.
 *
 * Il existe uniquement pour éviter que `store.ts` n'importe deux modules qui
 * décrivent le même domaine, et pour offrir une variante non bloquante du
 * déblocage : une erreur dans le calcul d'un succès ne doit jamais empêcher
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
