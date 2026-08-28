/**
 * Ouvrir le tiroir de navigation au doigt.
 *
 * Sur téléphone, atteindre le menu demande de viser un bouton en haut à
 * gauche, ce qui est exactement le coin le plus difficile à atteindre d'une
 * main. Un glissement vers la droite l'ouvre, un glissement vers la gauche le
 * referme.
 *
 * Le geste est volontairement modeste : il ne suit pas le doigt, il se
 * contente de reconnaître une intention. Faire glisser le tiroir sous le
 * doigt demanderait de suivre la vitesse et de savoir annuler à mi-course,
 * pour un gain que la transition existante donne déjà.
 *
 * Ce qui est délicat n'est pas de reconnaître le geste, c'est de savoir
 * quand se taire :
 *
 *  - **Au doigt seulement.** À la souris, un glissement est une sélection de
 *    texte, et sur ordinateur le bandeau ne se referme jamais.
 *  - **Jamais depuis ce qui défile de côté.** La bande d'onglets, une table
 *    large, le décodage de l'émission : on remonte les ancêtres pour vérifier
 *    qu'aucun n'a de débordement horizontal, sinon le geste appartient à cet
 *    élément-là.
 *  - **Jamais depuis un manipulateur ni un curseur.** Ces deux-là prennent
 *    déjà le doigt et le gardent ; un glissement y est une frappe tenue ou un
 *    réglage, pas une navigation.
 *  - **Ouvrir depuis la moitié gauche seulement.** Le bord même de l'écran
 *    serait plus juste, mais c'est là que le navigateur place son propre geste
 *    de retour : on le laisse tranquille. Refermer, en revanche, marche de
 *    partout.
 */

export interface DrawerSwipeOptions {
  isOpen: () => boolean;
  open: () => void;
  close: () => void;
  /** Le réglage du joueur, relu à chaque geste. */
  enabled: () => boolean;
  /** Vrai quand le tiroir existe, c'est-à-dire sur écran étroit. */
  applicable: () => boolean;
}

/** Ce dont le doigt se sert déjà pour autre chose. */
const RESERVE = 'input, textarea, select, canvas, .keypad__key, .manip__touche, .slider';

/** Distance parcourue à partir de laquelle on tranche, en pixels. */
const SEUIL = 48;

/** Rapport horizontal / vertical au-delà duquel le geste est un glissement. */
const PENTE = 1.8;

/** Au-delà, ce n'est plus un geste mais une hésitation. */
const DUREE_MAX = 700;

function defileLateralement(depart: Element | null): boolean {
  let element: Element | null = depart;
  while (element && element !== document.body) {
    if (element.scrollWidth > element.clientWidth + 2) {
      const debordement = getComputedStyle(element).overflowX;
      if (debordement === 'auto' || debordement === 'scroll') return true;
    }
    element = element.parentElement;
  }
  return false;
}

export function attachDrawerSwipe(options: DrawerSwipeOptions): () => void {
  let depart: { x: number; y: number; temps: number; pointeur: number } | null = null;

  const oublie = (): void => {
    depart = null;
  };

  const onDown = (event: PointerEvent): void => {
    oublie();
    if (event.pointerType !== 'touch' || !event.isPrimary) return;
    if (!options.enabled() || !options.applicable()) return;

    const cible = event.target as Element | null;
    if (cible?.closest?.(RESERVE)) return;
    if (defileLateralement(cible)) return;
    // On n'ouvre que depuis la moitié gauche ; on referme de partout.
    if (!options.isOpen() && event.clientX > window.innerWidth / 2) return;

    depart = { x: event.clientX, y: event.clientY, temps: event.timeStamp, pointeur: event.pointerId };
  };

  const onMove = (event: PointerEvent): void => {
    if (!depart || event.pointerId !== depart.pointeur) return;
    if (event.timeStamp - depart.temps > DUREE_MAX) {
      oublie();
      return;
    }

    const dx = event.clientX - depart.x;
    const dy = event.clientY - depart.y;
    if (Math.abs(dx) < SEUIL) return;

    // Plus vertical qu'horizontal : c'est un défilement, et il ne redeviendra
    // pas un glissement en cours de route.
    if (Math.abs(dx) < Math.abs(dy) * PENTE) {
      oublie();
      return;
    }

    if (dx > 0 && !options.isOpen()) options.open();
    else if (dx < 0 && options.isOpen()) options.close();
    oublie();
  };

  // Les écouteurs sont passifs : on ne fait que reconnaître un geste, jamais
  // l'empêcher. Le défilement vertical reste donc parfaitement fluide.
  const passif: AddEventListenerOptions = { passive: true };
  window.addEventListener('pointerdown', onDown, passif);
  window.addEventListener('pointermove', onMove, passif);
  window.addEventListener('pointerup', oublie, passif);
  window.addEventListener('pointercancel', oublie, passif);

  return () => {
    window.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', oublie);
    window.removeEventListener('pointercancel', oublie);
  };
}
