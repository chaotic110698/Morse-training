/**
 * L'écran nu.
 *
 * Une page d'entraînement porte, autour de l'exercice, tout ce qui sert à le
 * régler : le niveau, la vitesse, la longueur de série, l'aide. Utile avant de
 * commencer, encombrant pendant. Au niveau 26 sur un téléphone, la page mesure
 * mille cent trente pixels de haut pour une fenêtre de huit cent quarante : on
 * défile en pleine série, et les touches se retrouvent au milieu de l'écran,
 * là où le pouce n'arrive pas.
 *
 * Le mode focus ne fabrique pas un second exercice : il **déplace** les
 * éléments existants — l'écran de verdict, la diode, la grille — dans une
 * couche qui occupe la fenêtre, puis les remet à leur place en sortant. Les
 * fonctions de rendu des vues continuent d'écrire dans les mêmes nœuds sans
 * rien savoir de tout cela.
 *
 * Le nombre de colonnes n'est pas choisi à la main. On cherche celui qui rend
 * la plus grande touche à peu près carrée dans la place disponible, ce qui
 * donne quatre colonnes à dix caractères, cinq à vingt-six, six à quarante et
 * un — et se recalcule tout seul quand le niveau change ou qu'on tourne le
 * téléphone.
 */

import { h } from './dom.ts';

export interface FocusPieces {
  /**
   * La scène de la vue — l'écran de verdict et la diode réunis. On la déplace
   * d'un bloc plutôt que pièce par pièce : c'est elle qui porte le « +1 » de
   * `ui/envol.ts`, et le séparer de son hôte le ferait monter derrière la
   * couche, sur la page qu'on ne voit plus.
   */
  scene: HTMLElement;
  /** La grille de réponse. */
  pave: HTMLElement;
  /**
   * Montré au centre tant qu'il n'y a rien à répondre. Facultatif : une page
   * qui démarre d'elle-même n'a pas de bouton de lancement à déplacer.
   */
  principal?: HTMLElement;
}

export interface FocusOptions {
  pieces: FocusPieces;
  /**
   * Ce qu'affiche le fil. `part` à null — une série sans fin — masque le rail
   * et ne laisse que le texte.
   */
  progression: () => { part: number | null; texte: string };
  /** Vrai tant qu'il y a quelque chose à répondre. */
  enCours: () => boolean;
  /** Un appui sur l'écran de verdict. */
  rejouer: () => void;
  /**
   * Largeur minimale d'une touche, en pixels. Une grille de codes en demande
   * bien plus qu'une grille de lettres, et la lecture visuelle passe de l'une
   * à l'autre : c'est donc une fonction, relue à chaque calcul.
   */
  largeurMin?: () => number;
}

export interface Focus {
  /** À poser dans la rangée d'actions de la vue. */
  bouton: HTMLElement;
  /** À rappeler quand la progression, la phase ou la grille changent. */
  rafraichit: () => void;
  destroy: () => void;
}

/** Bornes de la touche : en dessous on ne vise plus, au-dessus on fait des dalles. */
const ECART = 8;
const PLAFOND = 96;
const HAUTEUR_MIN = 34;
/** En dessous, on ne vise plus une touche : on la cherche. */
const CONFORTABLE = 44;
/** Ce que le pavé prend de la fenêtre, au repos et au plus large. */
const PART_BASSE = 0.5;
const PART_HAUTE = 0.62;

/**
 * Le meilleur découpage en colonnes pour `nombre` touches dans une boîte.
 * On note chaque candidat par son plus petit côté, moins une pénalité
 * d'allongement : une touche large et plate se vise moins bien qu'un carré de
 * même surface.
 */
export function disposition(
  nombre: number,
  largeur: number,
  hauteur: number,
  largeurMin: number,
  plafond = PLAFOND,
): { colonnes: number; largeurTouche: number; hauteurTouche: number } {
  let mieux: { colonnes: number; largeurTouche: number; hauteurTouche: number; note: number } | null = null;
  for (let colonnes = 1; colonnes <= Math.max(1, nombre); colonnes += 1) {
    const lignes = Math.ceil(nombre / colonnes);
    const l = (largeur - (colonnes - 1) * ECART) / colonnes;
    const ht = (hauteur - (lignes - 1) * ECART) / lignes;
    if (l < largeurMin || ht < HAUTEUR_MIN) continue;
    const largeurTouche = Math.min(l, plafond * 1.15);
    const hauteurTouche = Math.min(ht, plafond);
    const note = Math.min(largeurTouche, hauteurTouche) - Math.abs(largeurTouche - hauteurTouche) * 0.35;
    if (!mieux || note > mieux.note) mieux = { colonnes, largeurTouche, hauteurTouche, note };
  }
  if (mieux) return { colonnes: mieux.colonnes, largeurTouche: mieux.largeurTouche, hauteurTouche: mieux.hauteurTouche };
  // Aucun découpage ne tient : on remplit au plus serré plutôt que de ne rien rendre.
  const colonnes = Math.max(1, Math.floor(largeur / largeurMin));
  const lignes = Math.ceil(nombre / colonnes);
  return {
    colonnes,
    largeurTouche: (largeur - (colonnes - 1) * ECART) / colonnes,
    hauteurTouche: Math.max(HAUTEUR_MIN, (hauteur - (lignes - 1) * ECART) / lignes),
  };
}

export function createFocus(options: FocusOptions): Focus {
  const { pieces } = options;


  /* Chaque pièce laisse un jalon derrière elle : c'est ce qui permet de la
     remettre exactement où elle était, et non à la fin de son parent. */
  const jalons = new Map<HTMLElement, Comment>();

  const rail = h('span', { class: 'focus__plein' });
  const piste = h('span', { class: 'focus__rail' }, rail);
  const compte = h('span', { class: 'focus__compte' });
  const sortie = h('button', {
    class: 'focus__sortie',
    type: 'button',
    text: '×',
    attrs: { 'aria-label': 'Quitter le mode focus' },
    on: { click: () => quitte() },
  });

  const hote = h('div', { class: 'focus__pave' });
  const centre = h('div', { class: 'focus__centre' });

  const couche = h(
    'div',
    { class: 'focus', attrs: { role: 'region', 'aria-label': 'Mode focus' } },
    h('div', { class: 'focus__fil' }, sortie, piste, compte),
    hote,
    centre,
  );

  const bouton = h('button', {
    class: 'btn',
    type: 'button',
    text: 'Focus',
    attrs: { 'aria-pressed': 'false', title: 'Ne garder que l’écran, la diode et les touches' },
    on: { click: () => (actif ? quitte() : entre()) },
  });

  let actif = false;
  let observateur: ResizeObserver | null = null;

  const deplace = (element: HTMLElement, vers: HTMLElement, avant: Node | null = null): void => {
    const jalon = document.createComment('focus');
    element.parentNode?.insertBefore(jalon, element);
    jalons.set(element, jalon);
    vers.insertBefore(element, avant);
  };

  const rend = (element: HTMLElement): void => {
    const jalon = jalons.get(element);
    // Sans jalon, la pièce n'avait pas de domicile : elle n'existe que pour le
    // focus, et sortir revient à la retirer.
    if (!jalon) {
      element.remove();
      return;
    }
    jalon.parentNode?.insertBefore(element, jalon);
    jalon.remove();
    jalons.delete(element);
  };

  /**
   * Recalcule le pavé. Appelé au redimensionnement et à chaque rafraîchissement.
   *
   * La moitié basse est une intention, pas une contrainte : une grille de codes
   * sur un téléphone ne tient pas en cinq rangées, et l'y forcer donnerait des
   * touches de trente-huit pixels qu'on ne vise plus. Quand la touche tomberait
   * sous le confortable, le pavé prend jusqu'à soixante-deux pour cent — c'est
   * l'écran de verdict qui cède, il a de la place à perdre.
   *
   * Le calcul part de la largeur, qui ne dépend pas de la part prise : deux
   * passes au plus, et le résultat ne peut pas osciller.
   */
  const dispose = (): void => {
    if (!actif) return;
    const touches = pieces.pave.children.length;
    if (touches === 0) return;
    const style = getComputedStyle(hote);
    const largeur = hote.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const marges = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const fenetre = couche.clientHeight;
    if (largeur < 40 || fenetre < 200) return;

    const largeurMin = options.largeurMin?.() ?? 52;
    let d = disposition(touches, largeur, PART_BASSE * fenetre - marges, largeurMin);
    let part = PART_BASSE;
    if (d.hauteurTouche < CONFORTABLE) {
      const large = disposition(touches, largeur, PART_HAUTE * fenetre - marges, largeurMin);
      const lignes = Math.ceil(touches / large.colonnes);
      const voulu = lignes * large.hauteurTouche + (lignes - 1) * ECART + marges;
      part = Math.min(PART_HAUTE, Math.max(PART_BASSE, voulu / fenetre));
      d = disposition(touches, largeur, part * fenetre - marges, largeurMin);
    }
    hote.style.setProperty('--focus-part', `${(part * 100).toFixed(2)}%`);
    pieces.pave.style.setProperty('--focus-colonnes', String(d.colonnes));
    pieces.pave.style.setProperty('--focus-hauteur', `${Math.floor(d.hauteurTouche)}px`);
    pieces.pave.style.setProperty('--focus-largeur', `${Math.round(d.largeurTouche)}px`);
  };

  const rafraichit = (): void => {
    if (!actif) return;
    const p = options.progression();
    piste.hidden = p.part === null;
    if (p.part !== null) rail.style.width = `${Math.round(Math.min(1, Math.max(0, p.part)) * 100)}%`;
    compte.textContent = p.texte;
    // Tant qu'il n'y a rien à répondre, la moitié basse porte le bouton qui
    // lance la série plutôt qu'une grille inerte.
    const marche = options.enCours();
    hote.hidden = !marche;
    centre.hidden = marche || !pieces.principal;
    if (pieces.principal) {
      if (marche && pieces.principal.parentElement === centre) rend(pieces.principal);
      if (!marche && pieces.principal.parentElement !== centre) deplace(pieces.principal, centre);
    }
    dispose();
  };

  /* Toucher l'écran plutôt qu'un bouton : la cible fait la moitié de la page. */
  const rejoue = (): void => options.rejouer();

  const surTouche = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && actif) {
      event.preventDefault();
      quitte();
    }
  };

  function entre(): void {
    if (actif) return;
    actif = true;
    document.body.append(couche);
    deplace(pieces.scene, couche, hote);
    pieces.scene.classList.add('trainer__stage--focus');
    pieces.scene.title = 'Toucher pour réentendre';
    pieces.scene.addEventListener('click', rejoue);
    deplace(pieces.pave, hote);
    pieces.pave.classList.add('answer-grid--focus');
    document.documentElement.dataset.focus = 'on';
    const app = document.getElementById('app');
    if (app) app.inert = true;
    bouton.setAttribute('aria-pressed', 'true');
    bouton.textContent = 'Quitter le focus';
    window.addEventListener('keydown', surTouche);
    observateur = new ResizeObserver(() => dispose());
    observateur.observe(hote);
    rafraichit();
  }

  function quitte(): void {
    if (!actif) return;
    actif = false;
    observateur?.disconnect();
    observateur = null;
    window.removeEventListener('keydown', surTouche);
    pieces.scene.classList.remove('trainer__stage--focus');
    pieces.scene.removeAttribute('title');
    pieces.scene.removeEventListener('click', rejoue);
    pieces.pave.classList.remove('answer-grid--focus');
    hote.style.removeProperty('--focus-part');
    for (const propriete of ['--focus-colonnes', '--focus-hauteur', '--focus-largeur']) {
      pieces.pave.style.removeProperty(propriete);
    }
    // Dans l'ordre inverse n'a pas d'importance : chaque jalon sait où aller.
    for (const element of [pieces.scene, pieces.pave, pieces.principal]) {
      if (element) rend(element);
    }
    couche.remove();
    delete document.documentElement.dataset.focus;
    const app = document.getElementById('app');
    if (app) app.inert = false;
    bouton.setAttribute('aria-pressed', 'false');
    bouton.textContent = 'Focus';
  }

  return {
    bouton,
    rafraichit,
    destroy: () => quitte(),
  };
}
