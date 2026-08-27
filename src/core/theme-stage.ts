/**
 * L'habit emprunté.
 *
 * Le mode histoire ouvre chaque épisode dans l'habit de son époque, au même
 * titre qu'il choisit son grain sonore. Mais ce n'est pas un choix du joueur :
 * c'est un emprunt, le temps d'un épisode, et il doit être rendu en sortant
 * sans jamais toucher aux réglages enregistrés.
 *
 * D'où ce petit registre à part, plutôt qu'un réglage de plus : la coquille le
 * consulte en peignant la page, le mode histoire y dépose et y reprend son
 * habit, et personne d'autre n'a besoin d'en entendre parler.
 */

let borrowed: string | null = null;
const listeners = new Set<() => void>();

/** L'habit emprunté, ou `null` si l'on porte le sien. */
export function borrowedTheme(): string | null {
  return borrowed;
}

/**
 * Emprunte un habit, ou le rend en passant `null`. Sans effet si c'est déjà
 * celui qu'on porte : on ne réveille pas la coquille pour rien.
 */
export function borrowTheme(id: string | null): void {
  if (borrowed === id) return;
  borrowed = id;
  for (const listener of listeners) listener();
}

export function onBorrowedTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
