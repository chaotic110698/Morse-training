/**
 * Manipulateur : transforme les appuis de l'utilisateur en éléments morse.
 *
 * Deux familles de manipulateurs coexistent chez les opérateurs, et les deux
 * sont proposées ici :
 *
 * - Le **manipulateur droit** (straight key) n'a qu'un contact. C'est la durée
 *   de l'appui qui distingue le point du trait, et c'est l'opérateur qui porte
 *   toute la responsabilité du rythme.
 * - Le **manipulateur double / iambique** (paddle) à deux contacts, un pour le
 *   point et un pour le trait. L'électronique génère des éléments parfaitement
 *   calibrés tant que la palette est tenue ; presser les deux simultanément
 *   (« squeeze ») alterne points et traits. Les modes A et B ne diffèrent que
 *   sur le relâchement : en mode B, un élément supplémentaire de la palette
 *   opposée est émis après un relâchement en squeeze.
 *
 * Les silences sont interprétés avec les seuils théoriques : moins de 2 unités
 * séparent deux éléments d'un même caractère, de 2 à 5 unités séparent deux
 * caractères, au-delà commence un nouveau mot.
 */

import { decodeChar } from './morse.ts';
import type { ElementKind, ResolvedTiming } from './timing.ts';

export type KeyerMode = 'straight' | 'iambic-a' | 'iambic-b';
export type PaddleSide = 'dit' | 'dah';

export interface KeyerOptions {
  mode: KeyerMode;
  /** Seuil de silence, en unités, au-delà duquel le caractère est terminé. */
  charGapUnits: number;
  /** Seuil de silence, en unités, au-delà duquel un mot est terminé. */
  wordGapUnits: number;
  /**
   * Ajuste la frontière point/trait sur la frappe réelle de l'opérateur au
   * lieu de la vitesse configurée. Indispensable au manipulateur droit, où personne ne frappe exactement à la vitesse annoncée.
   */
  adaptive: boolean;
}

export const DEFAULT_KEYER_OPTIONS: KeyerOptions = {
  mode: 'straight',
  charGapUnits: 2,
  wordGapUnits: 5,
  adaptive: true,
};

export interface KeyerCallbacks {
  /** Le contact se ferme : allumer son, diode et vibreur. */
  onKeyDown?: (kind: ElementKind | null) => void;
  /** Le contact s'ouvre. */
  onKeyUp?: () => void;
  /** Un élément vient d'être validé. `code` est le caractère en cours. */
  onElement?: (kind: ElementKind, code: string) => void;
  /** Un caractère est terminé. `char` vaut `null` si le code est inconnu. */
  onCharacter?: (code: string, char: string | null) => void;
  /** Une séparation de mot a été détectée. */
  onWord?: () => void;
}

const opposite = (side: PaddleSide): PaddleSide => (side === 'dit' ? 'dah' : 'dit');

export class Keyer {
  private options: KeyerOptions;
  private timing: ResolvedTiming;
  private callbacks: KeyerCallbacks;

  /** Code du caractère en cours de composition. */
  private buffer = '';
  /** Estimation courante de l'unité de l'opérateur, en secondes. */
  private unitEstimate: number;

  // Manipulateur droit
  private pressedAt = 0;
  private down = false;

  // Manipulateur iambique
  private heldDit = false;
  private heldDah = false;
  private iambicState: 'idle' | 'element' | 'space' = 'idle';
  private currentSide: PaddleSide = 'dit';
  private memory: PaddleSide | null = null;
  private squeezed = false;

  private elementTimer = 0;
  private charTimer = 0;
  private wordTimer = 0;

  constructor(timing: ResolvedTiming, options: Partial<KeyerOptions>, callbacks: KeyerCallbacks) {
    this.timing = timing;
    this.options = { ...DEFAULT_KEYER_OPTIONS, ...options };
    this.callbacks = callbacks;
    this.unitEstimate = timing.unit;
  }

  get mode(): KeyerMode {
    return this.options.mode;
  }

  get currentCode(): string {
    return this.buffer;
  }

  /** Unité de référence utilisée pour classer les appuis, en secondes. */
  get referenceUnit(): number {
    return this.options.adaptive ? this.unitEstimate : this.timing.unit;
  }

  setTiming(timing: ResolvedTiming): void {
    this.timing = timing;
    this.unitEstimate = timing.unit;
  }

  setOptions(options: Partial<KeyerOptions>): void {
    const previousMode = this.options.mode;
    this.options = { ...this.options, ...options };
    if (options.mode && options.mode !== previousMode) this.reset();
  }

  /** Remet le manipulateur à zéro sans émettre d'événement de caractère. */
  reset(): void {
    this.clearTimers();
    if (this.down || this.iambicState === 'element') this.callbacks.onKeyUp?.();
    this.buffer = '';
    this.down = false;
    this.heldDit = false;
    this.heldDah = false;
    this.iambicState = 'idle';
    this.memory = null;
    this.squeezed = false;
    this.unitEstimate = this.timing.unit;
  }

  /** Termine immédiatement le caractère en cours, s'il y en à un. */
  flush(): void {
    this.clearGapTimers();
    this.emitCharacter();
  }

  // --- Entrées ---------------------------------------------------------

  /**
   * Signale un appui. `side` vaut `dit` ou `dah` pour un manipulateur double ;
   * il est ignoré en mode droit, où un seul contact existe.
   */
  press(side: PaddleSide = 'dit'): void {
    if (this.options.mode === 'straight') this.pressStraight();
    else this.pressPaddle(side);
  }

  /** Signale un relâchement. */
  release(side: PaddleSide = 'dit'): void {
    if (this.options.mode === 'straight') this.releaseStraight();
    else this.releasePaddle(side);
  }

  // --- Manipulateur droit ----------------------------------------------

  private pressStraight(): void {
    if (this.down) return;
    this.down = true;
    this.pressedAt = performance.now();
    this.clearGapTimers();
    this.callbacks.onKeyDown?.(null);
  }

  private releaseStraight(): void {
    if (!this.down) return;
    this.down = false;
    this.callbacks.onKeyUp?.();

    const duration = (performance.now() - this.pressedAt) / 1000;
    // Un appui plus court qu'un dixième d'unité est un rebond de contact ou
    // un effleurement involontaire : on l'ignore.
    if (duration < this.referenceUnit * 0.15) return;

    const kind: ElementKind = duration < this.referenceUnit * 2 ? 'dit' : 'dah';
    this.observeElement(duration, kind);
    this.pushElement(kind);
    this.startGapTimers();
  }

  /** Affine l'estimation de l'unité à partir de l'élément qui vient d'être frappe. */
  private observeElement(duration: number, kind: ElementKind): void {
    if (!this.options.adaptive) return;
    const observed = kind === 'dit' ? duration : duration / 3;
    const blended = this.unitEstimate * 0.75 + observed * 0.25;
    // Bornes larges autour de la vitesse configurée : elles évitent qu'une
    // frappe aberrante ne dérègle durablement le décodage.
    const min = this.timing.unit / 3;
    const max = this.timing.unit * 3;
    this.unitEstimate = Math.min(max, Math.max(min, blended));
  }

  // --- Manipulateur iambique -------------------------------------------

  private pressPaddle(side: PaddleSide): void {
    if (side === 'dit') this.heldDit = true;
    else this.heldDah = true;
    if (this.heldDit && this.heldDah) this.squeezed = true;

    this.clearGapTimers();

    if (this.iambicState === 'idle') {
      this.startIambicElement(side);
    } else if (side !== this.currentSide) {
      // Mémoire de palette : l'élément opposé demande pendant l'élément en
      // cours sera joue juste après, même si la palette est relâchée entre-temps.
      this.memory = side;
    }
  }

  private releasePaddle(side: PaddleSide): void {
    if (side === 'dit') this.heldDit = false;
    else this.heldDah = false;
    if (this.iambicState === 'idle' && !this.heldDit && !this.heldDah) this.startGapTimers();
  }

  private startIambicElement(side: PaddleSide): void {
    this.currentSide = side;
    this.iambicState = 'element';
    this.squeezed = this.heldDit && this.heldDah;
    const duration = side === 'dit' ? this.timing.dit : this.timing.dah;
    this.callbacks.onKeyDown?.(side);
    this.scheduleAbsolute(duration, () => this.endIambicElement());
  }

  private endIambicElement(): void {
    this.callbacks.onKeyUp?.();
    this.pushElement(this.currentSide);
    this.iambicState = 'space';

    // Mode B : un squeeze relâche pendant l'élément donne droit à un élément
    // supplémentaire de la palette opposée. C'est la seule différence avec le
    // mode A, et elle change beaucoup le ressenti à grande vitesse.
    if (
      this.options.mode === 'iambic-b' &&
      this.squeezed &&
      !this.heldDit &&
      !this.heldDah &&
      this.memory === null
    ) {
      this.memory = opposite(this.currentSide);
    }

    this.scheduleAbsolute(this.timing.intraChar, () => this.afterIambicSpace());
  }

  private afterIambicSpace(): void {
    const next = this.chooseNextSide();
    if (next) {
      this.memory = null;
      this.startIambicElement(next);
      return;
    }
    this.iambicState = 'idle';
    this.squeezed = false;
    this.startGapTimers();
  }

  private chooseNextSide(): PaddleSide | null {
    if (this.heldDit && this.heldDah) return opposite(this.currentSide);
    if (this.memory) return this.memory;
    if (this.heldDit) return 'dit';
    if (this.heldDah) return 'dah';
    return null;
  }

  // --- Composition des caractères --------------------------------------

  private pushElement(kind: ElementKind): void {
    this.buffer += kind === 'dit' ? '.' : '-';
    this.callbacks.onElement?.(kind, this.buffer);
  }

  private emitCharacter(): void {
    if (!this.buffer) return;
    const code = this.buffer;
    this.buffer = '';
    this.callbacks.onCharacter?.(code, decodeChar(code));
  }

  private startGapTimers(): void {
    this.clearGapTimers();
    const unit = this.referenceUnit * 1000;
    this.charTimer = window.setTimeout(() => {
      this.charTimer = 0;
      this.emitCharacter();
    }, unit * this.options.charGapUnits);
    this.wordTimer = window.setTimeout(() => {
      this.wordTimer = 0;
      this.callbacks.onWord?.();
    }, unit * this.options.wordGapUnits);
  }

  /**
   * Programme un rendez-vous en corrigeant la dérive : l'échéance est calculée
   * en temps absolu, si bien qu'un `setTimeout` en retard ne décalé pas les
   * éléments suivants.
   */
  private scheduleAbsolute(seconds: number, action: () => void): void {
    const deadline = performance.now() + seconds * 1000;
    const tick = (): void => {
      const remaining = deadline - performance.now();
      if (remaining <= 1) {
        this.elementTimer = 0;
        action();
        return;
      }
      this.elementTimer = window.setTimeout(tick, Math.min(remaining, remaining - 1));
    };
    this.elementTimer = window.setTimeout(tick, Math.max(0, seconds * 1000 - 1));
  }

  private clearGapTimers(): void {
    if (this.charTimer) window.clearTimeout(this.charTimer);
    if (this.wordTimer) window.clearTimeout(this.wordTimer);
    this.charTimer = 0;
    this.wordTimer = 0;
  }

  private clearTimers(): void {
    this.clearGapTimers();
    if (this.elementTimer) window.clearTimeout(this.elementTimer);
    this.elementTimer = 0;
  }

  dispose(): void {
    this.clearTimers();
  }
}
