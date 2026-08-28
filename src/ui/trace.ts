/**
 * Le ruban du signal.
 *
 * Le papier avance de droite à gauche sous un repère fixe, et le signal s'y
 * inscrit pendant qu'il se joue — exactement le geste de l'encreur de 1844,
 * qui écrivait le trait tant que le manipulateur restait fermé.
 *
 * Ce n'est pas qu'un agrément. Le débutant entend un flux continu ; le ruban
 * lui montre le **rythme** qu'il est censé entendre, en train de se dérouler,
 * et la lettre s'inscrit sous son groupe quand le silence long confirme
 * qu'elle est finie. C'est aussi pourquoi il se coupe dans les réglages :
 * arrivé à un certain point, voir le rythme empêche de l'entendre.
 *
 * Derrière le signal, le souffle du récepteur : une houle très basse qui
 * vacille, sur laquelle le trait se détache. Purement décorative, celle-là —
 * elle s'arrête seule quand le système demande moins de mouvement, et se
 * coupe séparément dans les réglages.
 *
 * Le ruban ne connaît ni le texte ni la table des durées : il n'apprend
 * l'existence d'un signal qu'au moment où il commence, par le même
 * intermédiaire que la diode. Il montre donc ce qui a été joué, pas ce qui
 * était prévu, et ne peut pas dériver de l'oreille.
 */

import { h } from './dom.ts';
import type { TimedElement } from '../core/timing.ts';
import type { AppStore } from '../core/store.ts';
import type { MorsePlayer } from './player.ts';

/** Pixels par milliseconde. À 20 mots/minute, un point fait environ dix pixels. */
const PX_PAR_MS = 0.155;

/** Le repère « maintenant », en fraction de la largeur. */
const REPERE = 0.76;

const HAUTEUR = 84;

/** Ce qui reste à l'écran : au-delà, la marque est oubliée. */
const MEMOIRE_MS = 30_000;

interface Marque {
  debut: number;
  fin: number;
  groupe: number;
}

interface Groupe {
  rang: number;
  char: string;
  debut: number;
  fin: number;
  close: boolean;
}

const moinsDeMouvement = (): boolean => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

export class SignalTrace {
  readonly element: HTMLElement;
  private readonly toile: HTMLCanvasElement;
  private readonly pinceau: CanvasRenderingContext2D | null;
  private readonly vide: HTMLElement;

  private marques: Marque[] = [];
  private groupes: Groupe[] = [];
  private ouverte: Marque | null = null;
  private rangCourant = -1;

  private actif = false;
  private allume = true;
  private vagues = true;
  private boucle = 0;
  private minuteur = 0;
  private largeur = 0;
  private observateur: ResizeObserver | null = null;

  constructor(label = 'Ruban') {
    this.toile = h('canvas', { class: 'ruban__toile', attrs: { 'aria-hidden': 'true' } }) as HTMLCanvasElement;
    this.vide = h('p', {
      class: 'ruban__vide',
      text: 'Le signal s’inscrira ici pendant l’écoute.',
    });
    this.element = h(
      'div',
      {
        class: 'ruban',
        attrs: {
          role: 'img',
          'aria-label': `${label} : représentation visuelle du signal en cours`,
        },
      },
      this.toile,
      this.vide,
    );
    this.pinceau = this.toile.getContext('2d');

    if (typeof ResizeObserver !== 'undefined') {
      this.observateur = new ResizeObserver(() => this.dimensionne());
      this.observateur.observe(this.element);
    }
    // Un onglet en arrière-plan ne peint rien : la houle n'a aucune raison
    // d'y tourner, et les navigateurs mobiles comptent ces réveils.
    document.addEventListener('visibilitychange', this.onVisibilite);
    this.relance();
  }

  private onVisibilite = (): void => {
    if (document.visibilityState === 'visible') this.relance();
    else this.arreteBoucle();
  };

  /** Le réglage « ruban du signal ». Éteint, le composant disparaît vraiment. */
  setEnabled(allume: boolean): void {
    if (this.allume === allume) return;
    this.allume = allume;
    this.element.hidden = !allume;
    if (!allume) this.arreteBoucle();
    else this.relance();
  }

  /** Le réglage « souffle du récepteur ». */
  setWaves(vagues: boolean): void {
    if (this.vagues === vagues) return;
    this.vagues = vagues;
    this.relance();
  }

  /** Début d'une lecture : le papier repart vierge. */
  begin(): void {
    if (!this.element.isConnected) return;
    this.marques = [];
    this.groupes = [];
    this.ouverte = null;
    this.rangCourant = -1;
    this.actif = true;
    this.vide.hidden = true;
    this.dimensionne();
    this.relance();
  }

  /**
   * Une transition du signal, telle que la diode la reçoit.
   *
   * Le rang du caractère sert à grouper : un rang qui change ferme le groupe
   * précédent, et c'est ce groupe fermé — donc confirmé fini — qui reçoit sa
   * lettre sous le ruban.
   */
  mark(on: boolean, element: TimedElement): void {
    if (!this.allume || !this.element.isConnected) return;
    const maintenant = performance.now();

    if (on) {
      const rang = element.charIndex ?? this.rangCourant;
      if (rang !== this.rangCourant) {
        this.ferme(maintenant);
        this.rangCourant = rang;
        this.groupes.push({
          rang,
          char: element.char ?? '',
          debut: maintenant,
          fin: maintenant,
          close: false,
        });
      }
      this.ouverte = { debut: maintenant, fin: Number.POSITIVE_INFINITY, groupe: this.rangCourant };
      this.marques.push(this.ouverte);
      this.actif = true;
      this.vide.hidden = true;
      this.relance();
      return;
    }

    if (this.ouverte) {
      this.ouverte.fin = maintenant;
      this.ouverte = null;
    }
    const groupe = this.groupes[this.groupes.length - 1];
    if (groupe) groupe.fin = maintenant;
  }

  /** Fin de la lecture : le dernier groupe est confirmé, le papier s'arrête. */
  end(): void {
    const maintenant = performance.now();
    if (this.ouverte) {
      this.ouverte.fin = maintenant;
      this.ouverte = null;
    }
    this.ferme(maintenant);
    this.rangCourant = -1;
    // Le papier continue de défiler un instant : la dernière lettre doit avoir
    // le temps de passer sous le repère avant que tout ne s'arrête.
    window.setTimeout(() => {
      this.actif = false;
      this.relance();
    }, 1200);
  }

  destroy(): void {
    this.arreteBoucle();
    this.observateur?.disconnect();
    this.observateur = null;
    document.removeEventListener('visibilitychange', this.onVisibilite);
  }

  private ferme(maintenant: number): void {
    const groupe = this.groupes[this.groupes.length - 1];
    if (groupe && !groupe.close) {
      groupe.close = true;
      groupe.fin = Math.max(groupe.fin, maintenant);
    }
  }

  // --- Dessin --------------------------------------------------------------

  private dimensionne(): void {
    const largeur = this.element.clientWidth;
    if (largeur > 0) {
      const densite = Math.min(2, window.devicePixelRatio || 1);
      this.largeur = largeur;
      this.toile.width = Math.round(largeur * densite);
      this.toile.height = Math.round(HAUTEUR * densite);
      this.toile.style.height = `${HAUTEUR}px`;
      this.pinceau?.setTransform(densite, 0, 0, densite, 0, 0);
      this.dessine(performance.now());
    }
    // Le mode histoire déplace le même ruban d'un bloc de réception à l'autre,
    // et ne le pose pas du tout au niveau opérateur : c'est ici qu'on apprend
    // qu'il vient d'être détaché ou remis dans la page.
    this.relance();
  }

  /**
   * Décide si la boucle doit tourner, et à quelle cadence.
   *
   * Pendant une lecture, à pleine cadence : le ruban est alors une
   * information, au même titre que la diode. Au repos, seule la houle bouge —
   * vingt images par seconde y suffisent largement, et rien ne tourne si elle
   * est coupée ou si le système demande moins de mouvement.
   */
  private relance(): void {
    const doitTourner =
      this.allume &&
      this.element.isConnected &&
      document.visibilityState === 'visible' &&
      (this.actif || (this.vagues && !moinsDeMouvement()));

    if (!doitTourner) {
      this.arreteBoucle();
      this.dessine(performance.now());
      return;
    }
    if (this.boucle || this.minuteur) return;

    const pas = (maintenant: number): void => {
      this.boucle = 0;
      this.dessine(maintenant);
      if (!this.allume || document.visibilityState !== 'visible') return;
      if (this.actif) {
        this.boucle = requestAnimationFrame(pas);
        return;
      }
      if (!this.vagues || moinsDeMouvement()) return;
      // Au repos, seule la houle bouge : vingt images par seconde y suffisent,
      // et l'attente rend la main au navigateur au lieu de le tenir éveillé
      // soixante fois par seconde pour trois pixels d'ondulation.
      this.minuteur = window.setTimeout(() => {
        this.minuteur = 0;
        this.boucle = requestAnimationFrame(pas);
      }, 50);
    };
    this.boucle = requestAnimationFrame(pas);
  }

  private arreteBoucle(): void {
    if (this.boucle) cancelAnimationFrame(this.boucle);
    if (this.minuteur) window.clearTimeout(this.minuteur);
    this.boucle = 0;
    this.minuteur = 0;
  }

  private couleur(nom: string, repli: string): string {
    const valeur = getComputedStyle(this.element).getPropertyValue(nom).trim();
    return valeur === '' ? repli : valeur;
  }

  private dessine(maintenant: number): void {
    const pinceau = this.pinceau;
    if (!pinceau || this.largeur <= 0) return;

    const L = this.largeur;
    const H = HAUTEUR;
    const repere = Math.round(L * REPERE);
    const ligne = Math.round(H * 0.52) + 0.5;

    pinceau.clearRect(0, 0, L, H);

    const accent = this.couleur('--accent', '#ffb545');
    const bordure = this.couleur('--border', '#26313d');
    const sourd = this.couleur('--text-faint', '#8e9aa8');

    // Le souffle du récepteur : une houle très basse qui vacille. Elle est
    // figée — dessinée une fois, sans le temps — quand on demande moins de
    // mouvement, et absente si le réglage la coupe.
    if (this.vagues) {
      const t = moinsDeMouvement() ? 0 : maintenant;
      pinceau.save();
      pinceau.globalAlpha = 0.16 + 0.06 * Math.sin(t / 1900);
      pinceau.strokeStyle = sourd;
      pinceau.lineWidth = 1;
      pinceau.beginPath();
      for (let x = 0; x <= L; x += 3) {
        const phase = x * 0.055 + t * 0.0016;
        const y =
          ligne +
          (Math.sin(phase) * 1.6 + Math.sin(phase * 2.3 + 1.7) * 1.1 + Math.sin(phase * 4.7 + 0.4) * 0.6) * 1.5;
        if (x === 0) pinceau.moveTo(x, y);
        else pinceau.lineTo(x, y);
      }
      pinceau.stroke();
      pinceau.restore();
    }

    // La ligne du papier.
    pinceau.strokeStyle = bordure;
    pinceau.lineWidth = 1;
    pinceau.beginPath();
    pinceau.moveTo(0, ligne);
    pinceau.lineTo(L, ligne);
    pinceau.stroke();

    // Le repère fixe : c'est « maintenant ».
    pinceau.save();
    pinceau.globalAlpha = 0.45;
    pinceau.strokeStyle = sourd;
    pinceau.beginPath();
    pinceau.moveTo(repere + 0.5, 10);
    pinceau.lineTo(repere + 0.5, H - 10);
    pinceau.stroke();
    pinceau.restore();

    const x = (t: number): number => repere - (maintenant - t) * PX_PAR_MS;

    // Les traits inscrits.
    pinceau.fillStyle = accent;
    const hauteurTrait = 15;
    const hautTrait = ligne - hauteurTrait - 1;
    for (const marque of this.marques) {
      const fin = Math.min(marque.fin, maintenant);
      const x0 = x(marque.debut);
      const x1 = x(fin);
      if (x1 < -30 || x0 > L) continue;
      const largeur = Math.max(2, x1 - x0);
      pinceau.beginPath();
      if (typeof pinceau.roundRect === 'function') pinceau.roundRect(x0, hautTrait, largeur, hauteurTrait, 2);
      else pinceau.rect(x0, hautTrait, largeur, hauteurTrait);
      pinceau.fill();
    }

    // Les lettres, sous leur groupe, une fois le groupe confirmé fini.
    pinceau.fillStyle = sourd;
    pinceau.font = '500 13px ui-monospace, SFMono-Regular, Menlo, monospace';
    pinceau.textAlign = 'center';
    pinceau.textBaseline = 'top';
    for (const groupe of this.groupes) {
      if (!groupe.close || groupe.char === '' || groupe.char === ' ') continue;
      const centre = (x(groupe.debut) + x(groupe.fin)) / 2;
      if (centre < -30 || centre > L + 30) continue;
      pinceau.fillText(groupe.char, centre, ligne + 8);
    }

    this.oublie(maintenant);
  }

  /** Les marques sorties de l'écran depuis longtemps ne servent plus à rien. */
  private oublie(maintenant: number): void {
    const limite = maintenant - MEMOIRE_MS;
    if (this.marques.length > 0 && (this.marques[0] as Marque).debut < limite) {
      this.marques = this.marques.filter((marque) => marque.fin > limite);
      this.groupes = this.groupes.filter((groupe) => groupe.fin > limite);
    }
  }
}

/**
 * Le ruban prêt à poser : créé, branché au lecteur, et tenu à jour des deux
 * réglages qui le concernent. Les vues d'écoute n'ont plus qu'à placer
 * `trace.element` où elles veulent et appeler `destroy` en partant.
 */
export function createSignalTrace(
  store: AppStore,
  player: MorsePlayer,
  label = 'Ruban',
): { trace: SignalTrace; destroy: () => void } {
  const trace = new SignalTrace(label);
  const applique = (): void => {
    trace.setEnabled(store.settings.signalTrace);
    trace.setWaves(store.settings.signalWaves);
  };
  applique();
  const unsubscribe = store.subscribe(applique);
  player.setTrace(trace);

  return {
    trace,
    destroy: () => {
      unsubscribe();
      player.setTrace(null);
      trace.destroy();
    },
  };
}
