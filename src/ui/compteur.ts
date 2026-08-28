/**
 * Les nombres qui montent.
 *
 * Un chiffre qui saute de quarante à quarante-cinq n'est pas lu : il est déjà
 * remplacé quand l'œil arrive. Le même chiffre qui monte en quatre cents
 * millisecondes se regarde monter, et c'est cette demi-seconde qui fait qu'on
 * sait qu'on a progressé.
 *
 * L'animation est annulée si le système demande moins de mouvement, et si
 * l'élément quitte le document : une vue détruite ne doit pas continuer
 * d'écrire dans un nœud que plus personne ne regarde.
 */

const encours = new WeakMap<HTMLElement, number>();

const moinsDeMouvement = (): boolean => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

export interface MonteeOptions {
  /** Valeur de départ. Zéro par défaut : un bilan se découvre. */
  from?: number;
  /** Mise en forme du nombre à chaque pas. Par défaut, l'entier brut. */
  format?: (value: number) => string;
  /** Durée totale, en millisecondes. */
  ms?: number;
}

/** Arrête une montée en cours sur cet élément, sans toucher au texte affiché. */
export function arreteMontee(element: HTMLElement): void {
  const id = encours.get(element);
  if (id !== undefined) {
    cancelAnimationFrame(id);
    encours.delete(element);
  }
}

/**
 * Fait monter le texte de l'élément jusqu'à `to`.
 *
 * La valeur finale est écrite immédiatement quand on demande moins de
 * mouvement : rien ne se perd, seul le trajet disparaît.
 */
export function monte(element: HTMLElement, to: number, options: MonteeOptions = {}): void {
  const { from = 0, ms = 480 } = options;
  const format = options.format ?? ((value: number) => String(Math.round(value)));

  arreteMontee(element);

  if (moinsDeMouvement() || ms <= 0 || from === to) {
    element.textContent = format(to);
    return;
  }

  const debut = performance.now();
  const pas = (maintenant: number): void => {
    // La vue a pu être démontée pendant la montée.
    if (!element.isConnected) {
      encours.delete(element);
      return;
    }
    const avancement = Math.min(1, (maintenant - debut) / ms);
    const douceur = 1 - (1 - avancement) ** 3;
    element.textContent = format(from + (to - from) * douceur);
    if (avancement < 1) encours.set(element, requestAnimationFrame(pas));
    else encours.delete(element);
  };

  element.textContent = format(from);
  encours.set(element, requestAnimationFrame(pas));
}
