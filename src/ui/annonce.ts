/**
 * Ce que le site dit à voix haute.
 *
 * Quelqu'un qui apprend le morse **à l'oreille** est exactement le public qui
 * peut être aveugle, et le site était à deux attributs de lui être utilisable :
 * le signal se joue, la grille de réponse est faite de vrais boutons, mais le
 * verdict n'était nulle part annoncé. Il ne vivait que dans une couleur et un
 * texte reconstruit à chaque réponse, que rien ne signalait.
 *
 * Cette région le dit. Elle est invisible et ne sert qu'aux lecteurs d'écran ;
 * ce qu'elle contient est écrit pour être **entendu**, pas lu — on y met une
 * phrase, jamais le code en points et traits, qu'une synthèse vocale prononce
 * comme une suite de ponctuation.
 */

import { h } from './dom.ts';

export interface Annonce {
  element: HTMLElement;
  /** Fait annoncer une phrase. Deux fois la même est répétée. */
  dire: (texte: string) => void;
  destroy: () => void;
}

export function createAnnonce(label = 'Retour de l’exercice'): Annonce {
  const element = h('p', {
    class: 'sr-only',
    attrs: { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true', 'aria-label': label },
  });

  let minuteur = 0;

  return {
    element,
    dire: (texte: string) => {
      // Une région dont le contenu ne change pas n'est pas relue : deux fautes
      // de suite sur le même caractère passeraient sous silence. On vide, puis
      // on écrit au tour suivant, ce qui compte pour un changement.
      window.clearTimeout(minuteur);
      element.textContent = '';
      minuteur = window.setTimeout(() => {
        element.textContent = texte;
      }, 60);
    },
    destroy: () => window.clearTimeout(minuteur),
  };
}
