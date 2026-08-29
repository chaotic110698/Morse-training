/**
 * Le point marqué : un « +1 » vert qui monte quand la réponse est juste, un
 * « −1 » rouge quand elle est fausse.
 *
 * Le son et la vibration disent déjà le verdict, la couleur de la lettre
 * aussi ; ce signe-ci ajoute la seule chose qu'aucun des trois ne dit, à
 * savoir que la réponse a été comptée. Il monte de vingt-deux pixels en sept
 * cents millisecondes, dans un coin où il ne recouvre rien, et disparaît.
 *
 * Une seule marque par hôte, recyclée d'une réponse à l'autre : la relancer
 * demande de retirer la classe, de forcer un recalcul de mise en page, puis de
 * la remettre — sans quoi le navigateur regroupe les deux changements et
 * l'animation ne repart pas.
 */

import { h } from './dom.ts';

const CLASSE = 'envol';

/**
 * `hote` doit être positionné : `.trainer__stage` l'est dans `components.css`,
 * et c'est lui qu'on passe partout.
 */
export function envol(hote: HTMLElement, juste: boolean): void {
  let marque = hote.querySelector<HTMLElement>(`:scope > .${CLASSE}`);
  if (!marque) {
    // Décoratif, et redondant avec la région d'annonce : rien à lire ici.
    marque = h('span', { class: CLASSE, attrs: { 'aria-hidden': 'true' } });
    hote.append(marque);
  }
  marque.classList.remove(`${CLASSE}--part`);
  void marque.offsetWidth;
  marque.textContent = juste ? '+1' : '−1';
  marque.classList.toggle(`${CLASSE}--ko`, !juste);
  marque.classList.add(`${CLASSE}--part`);
}
