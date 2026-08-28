/**
 * L'onde d'un appui.
 *
 * Un cercle qui s'ouvre depuis le point exact où l'on a touché, et s'efface.
 * Sur téléphone, c'est la seule confirmation visible d'un appui : le doigt
 * cache la touche, il ne cache pas le cercle qui s'en échappe.
 *
 * Un seul écouteur pour tout le site, posé sur la racine. Les touches ne
 * savent pas qu'elles ont une onde — aucune vue n'est à modifier, et une
 * touche ajoutée demain l'aura sans qu'on écrive une ligne. L'élément qui
 * porte l'animation est créé au premier appui puis recyclé : une touche de
 * manipulateur enfoncée deux cents fois dans une séance ne crée pas deux
 * cents nœuds.
 */

const CIBLES = '.keypad__key, .manip__touche, .answer-grid__key, .btn';

/** Rayon de départ du cercle, en pixels. Doit valoir la moitié de sa taille
 *  dans `motion.css` : c'est lui qui sert à calculer la portée. */
const RAYON = 7;

function ondeDe(cible: HTMLElement): HTMLElement {
  const existante = cible.querySelector<HTMLElement>(':scope > .onde');
  if (existante) return existante;

  const onde = document.createElement('span');
  onde.className = 'onde';
  onde.setAttribute('aria-hidden', 'true');
  // Hors du flux : la touche est une grille ou une boîte flexible, et un
  // enfant en position absolue n'y compte ni comme élément ni dans l'écart.
  onde.addEventListener('animationend', () => onde.classList.remove('is-running'));
  cible.append(onde);
  return onde;
}

export function attachRipples(root: HTMLElement): () => void {
  const onPointerDown = (event: PointerEvent): void => {
    // Bouton secondaire de souris : c'est un menu contextuel, pas un appui.
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const cible = (event.target as Element | null)?.closest?.(CIBLES);
    if (!(cible instanceof HTMLElement)) return;
    if (cible instanceof HTMLButtonElement && cible.disabled) return;

    const boite = cible.getBoundingClientRect();
    if (boite.width === 0 || boite.height === 0) return;
    const x = event.clientX - boite.left;
    const y = event.clientY - boite.top;

    // Le cercle doit atteindre le coin le plus éloigné, sinon l'onde s'arrête
    // avant le bord et l'effet paraît tronqué sur une touche large.
    const portee = Math.hypot(Math.max(x, boite.width - x), Math.max(y, boite.height - y)) / RAYON;

    const onde = ondeDe(cible);
    onde.style.left = `${x}px`;
    onde.style.top = `${y}px`;
    onde.style.setProperty('--onde-portee', portee.toFixed(2));

    // Relancer une animation demande de la retirer, de forcer le calcul du
    // style, puis de la remettre : sans la lecture intermédiaire, le
    // navigateur regroupe les deux changements et rien ne se rejoue.
    onde.classList.remove('is-running');
    void onde.offsetWidth;
    onde.classList.add('is-running');
  };

  root.addEventListener('pointerdown', onPointerDown);
  return () => root.removeEventListener('pointerdown', onPointerDown);
}
