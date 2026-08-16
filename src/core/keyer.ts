/**
 * Manipulateur : transforme les appuis de l'utilisateur en elements morse.
 *
 * Deux familles de manipulateurs coexistent chez les operateurs, et les deux
 * sont proposees ici :
 *
 * - Le **manipulateur droit** (straight key) n'a qu'un contact. C'est la duree
 *   de l'appui qui distingue le point du trait, et c'est l'operateur qui porte
 *   toute la responsabilite du rythme.
 * - Le **manipulateur double / iambique** (paddle) a deux contacts, un pour le
 *   point et un pour le trait. L'electronique genere des elements parfaitement
 *   calibres tant que la palette est tenue ; presser les deux simultanement
 *   (« squeeze ») alterne points et traits. Les modes A et B ne different que
 *   sur le relachement : en mode B, un element supplementaire de la palette
 *   opposee est emis apres un relachement en squeeze.
 *
 * Les silences sont interpretes avec les seuils theoriques : moins de 2 unites
 * separent deux elements d'un meme caractere, de 2 a 5 unites separent deux
 * caracteres, au dela commence un nouveau mot.
 */

import { decodeChar } from './morse.ts';
import type { ElementKind, ResolvedTiming } from './timing.ts';

export type KeyerMode = 'straight' | 'iambic-a' | 'iambic-b';
export type PaddleSide = 'dit' | 'dah';

export interface KeyerOptions {
  mode: KeyerMode;
  /** Seuil de silence, en unites, au dela duquel le caractere est termine. */
  charGapUnits: number;
  /** Seuil de silence, en unites, au dela duquel un mot est termine. */
  wordGapUnits: number;
  /**
   * Ajuste la frontiere point/trait sur la frappe reelle de l'operateur au
   * lieu de la vitesse configuree. Indispensable au manipulateur droit, ou
   * personne ne frappe exactement a la vitesse annoncee.
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
  /** Un element vient d'etre valide. `code` est le caractere en cours. */
  onElement?: (kind: ElementKind, code: string) => void;
  /** Un caractere est termine. `char` vaut `null` si le code est inconnu. */
  onCharacter?: (code: string, char: string | null) => void;
  /** Une separation de mot a ete detectee. */
  onWord?: () => void;
}

const opposite = (side: PaddleSide): PaddleSide => (side === 'dit' ? 'dah' : 'dit');

export class Keyer {
  private options: KeyerOptions;
  private timing: ResolvedTiming;
  private callbacks: KeyerCallbacks;

  /** Code du caractere en cours de composition. */
  private buffer = '';
  /** Estimation courante de l'unite de l'operateur, en secondes. */
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

  /** Unite de reference utilisee pour classer les appuis, en secondes. */
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

  /** Remet le manipulateur a zero sans emettre d'evenement de caractere. */
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

  /** Termine immediatement le caractere en cours, s'il y en a un. */
  flush(): void {
    this.clearGapTimers();
    this.emitCharacter();
  }

  // --- Entrees ---------------------------------------------------------

  /**
   * Signale un appui. `side` vaut `dit` ou `dah` pour un manipulateur double ;
   * il est ignore en mode droit, ou un seul contact existe.
   */
  press(side: PaddleSide = 'dit'): void {
    if (this.options.mode === 'straight') this.pressStraight();
    else this.pressPaddle(side);
  }

  /** Signale un relachement. */
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
    // Un appui plus court qu'un dixieme d'unite est un rebond de contact ou
    // un effleurement involontaire : on l'ignore.
    if (duration < this.referenceUnit * 0.15) return;

    const kind: ElementKind = duration < this.referenceUnit * 2 ? 'dit' : 'dah';
    this.observeElement(duration, kind);
    this.pushElement(kind);
    this.startGapTimers();
  }

  /** Affine l'estimation de l'unite a partir de l'element qui vient d'etre frappe. */
  private observeElement(duration: number, kind: ElementKind): void {
    if (!this.options.adaptive) return;
    const observed = kind === 'dit' ? duration : duration / 3;
    const blended = this.unitEstimate * 0.75 + observed * 0.25;
    // Bornes larges autour de la vitesse configuree : elles evitent qu'une
    // frappe aberrante ne desregle durablement le decodage.
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
      // Memoire de palette : l'element oppose demande pendant l'element en
      // cours sera joue juste apres, meme si la palette est relachee entre-temps.
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

    // Mode B : un squeeze relache pendant l'element donne droit a un element
    // supplementaire de la palette opposee. C'est la seule difference avec le
    // mode A, et elle change beaucoup le ressenti a grande vitesse.
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

  // --- Composition des caracteres --------------------------------------

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
   * Programme un rendez-vous en corrigeant la derive : l'echeance est calculee
   * en temps absolu, si bien qu'un `setTimeout` en retard ne decale pas les
   * elements suivants.
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
