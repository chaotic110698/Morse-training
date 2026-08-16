/**
 * Manipulateur a l'ecran et raccourcis clavier.
 *
 * Le meme composant sert sur mobile et sur ordinateur : les boutons tactiles
 * et les touches physiques declenchent exactement les memes evenements, si
 * bien qu'on peut passer de l'un a l'autre sans rien reconfigurer. Le choix
 * entre manipulateur droit et manipulateur double est disponible dans tous les
 * exercices, puisque les deux ecoles ont chacune leurs adeptes.
 */

import { h } from './dom.ts';
import { keyLabel, isTypingTarget, shouldPreventDefault } from './keys.ts';
import type { Keyer, PaddleSide } from '../core/keyer.ts';
import type { Settings } from '../core/settings.ts';

export interface KeyPadOptions {
  keyer: Keyer;
  getSettings: () => Settings;
  /** Appele avant tout appui, pour deverrouiller l'audio au premier geste. */
  onFirstTouch?: () => void;
}

export class KeyPad {
  readonly element: HTMLElement;
  private readonly options: KeyPadOptions;
  private readonly buttons = new Map<PaddleSide, HTMLButtonElement>();
  private readonly pressed = new Set<PaddleSide>();
  private detachKeyboard: (() => void) | null = null;

  constructor(options: KeyPadOptions) {
    this.options = options;
    this.element = h('div', { class: 'keypad' });
    this.render();
    this.attachKeyboard();
  }

  /** Redessine les boutons apres un changement de manipulateur ou de touches. */
  render(): void {
    const settings = this.options.getSettings();
    const straight = settings.keyerMode === 'straight';
    this.buttons.clear();
    this.element.replaceChildren();
    this.element.classList.toggle('keypad--straight', straight);

    if (straight) {
      this.element.append(
        this.makeButton('dit', 'Manipulateur', keyLabel(settings.keyStraight), 'knob'),
      );
    } else {
      const sides: PaddleSide[] = settings.swapPaddles ? ['dah', 'dit'] : ['dit', 'dah'];
      for (const side of sides) {
        this.element.append(
          this.makeButton(
            side,
            side === 'dit' ? 'Point' : 'Trait',
            keyLabel(side === 'dit' ? settings.keyDit : settings.keyDah),
            side,
          ),
        );
      }
    }
  }

  /**
   * `glyph` designe la marque dessinee sur le bouton : un disque pour le
   * manipulateur droit et pour le point, une barre trois fois plus longue pour
   * le trait. Les proportions sont celles du code lui-meme, ce qui rend le
   * bouton lisible sans legende.
   */
  private makeButton(
    side: PaddleSide,
    label: string,
    hint: string,
    glyph: 'knob' | 'dit' | 'dah',
  ): HTMLButtonElement {
    const button = h(
      'button',
      {
        class: `keypad__key keypad__key--${glyph}`,
        type: 'button',
        attrs: { 'aria-label': `${label} (${hint})` },
      },
      h('span', { class: `keypad__glyph keypad__glyph--${glyph}`, attrs: { 'aria-hidden': 'true' } }),
      h('span', { class: 'keypad__label', text: label }),
      h('span', { class: 'keypad__hint', text: hint }),
    );

    // `pointer*` couvre souris, tactile et stylet d'un seul jeu d'ecouteurs.
    // La capture garantit qu'un doigt qui glisse hors du bouton libere quand
    // meme le contact : sans elle, un manipulateur peut rester bloque en bas.
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      this.begin(side);
    });
    const end = (event: PointerEvent): void => {
      if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId);
      this.end(side);
    };
    button.addEventListener('pointerup', end);
    button.addEventListener('pointercancel', end);
    // Empeche le menu contextuel sur appui long mobile.
    button.addEventListener('contextmenu', (event) => event.preventDefault());

    this.buttons.set(side, button);
    return button;
  }

  private begin(side: PaddleSide): void {
    if (this.pressed.has(side)) return;
    this.pressed.add(side);
    this.options.onFirstTouch?.();
    this.buttons.get(side)?.classList.add('is-active');
    this.options.keyer.press(this.resolveSide(side));
  }

  private end(side: PaddleSide): void {
    if (!this.pressed.delete(side)) return;
    this.buttons.get(side)?.classList.remove('is-active');
    this.options.keyer.release(this.resolveSide(side));
  }

  /** Applique l'inversion des palettes demandee par les gauchers. */
  private resolveSide(side: PaddleSide): PaddleSide {
    const settings = this.options.getSettings();
    if (settings.keyerMode === 'straight' || !settings.swapPaddles) return side;
    return side === 'dit' ? 'dah' : 'dit';
  }

  private attachKeyboard(): void {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.repeat || isTypingTarget(event.target)) return;
      const side = this.sideForCode(event.code);
      if (!side) return;
      if (shouldPreventDefault(event.code)) event.preventDefault();
      this.begin(side);
    };
    const onKeyUp = (event: KeyboardEvent): void => {
      const side = this.sideForCode(event.code);
      if (!side) return;
      if (shouldPreventDefault(event.code)) event.preventDefault();
      this.end(side);
    };
    // Un changement d'onglet laisserait le contact ferme : on relache tout.
    const onBlur = (): void => {
      for (const side of [...this.pressed]) this.end(side);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onBlur);

    this.detachKeyboard = () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onBlur);
    };
  }

  private sideForCode(code: string): PaddleSide | null {
    const settings = this.options.getSettings();
    if (settings.keyerMode === 'straight') return code === settings.keyStraight ? 'dit' : null;
    if (code === settings.keyDit) return 'dit';
    if (code === settings.keyDah) return 'dah';
    return null;
  }

  /** Reflete visuellement l'etat du contact, y compris quand il est genere. */
  setActive(side: PaddleSide | null): void {
    for (const [key, button] of this.buttons) button.classList.toggle('is-emitting', key === side);
  }

  destroy(): void {
    for (const side of [...this.pressed]) this.end(side);
    this.detachKeyboard?.();
    this.detachKeyboard = null;
  }
}
