/**
 * Manipulateur à l'écran et raccourcis clavier.
 *
 * Le même composant sert sur mobile et sur ordinateur : les boutons tactiles
 * et les touches physiques déclenchent exactement les mêmes événements, si
 * bien qu'on peut passer de l'un à l'autre sans rien reconfigurer. Le choix
 * entre manipulateur droit et manipulateur double est disponible dans tous les
 * exercices, puisque les deux écoles ont chacune leurs adeptes.
 */

import { h } from './dom.ts';
import { keyLabel, isTypingTarget, matchesBinding, resolveCode, shouldPreventDefault } from './keys.ts';
import type { Keyer, PaddleSide } from '../core/keyer.ts';
import type { Settings } from '../core/settings.ts';

export interface KeyPadOptions {
  keyer: Keyer;
  getSettings: () => Settings;
  /** Appele avant tout appui, pour déverrouiller l'audio au premier geste. */
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

  /** Redessine les boutons après un changement de manipulateur ou de touches. */
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
   * `glyph` désigne la marque dessinée sur le bouton : un disque pour le
   * manipulateur droit et pour le point, une barre trois fois plus longue pour
   * le trait. Les proportions sont celles du code lui-même, ce qui rend le
   * bouton lisible sans légende.
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

    // `pointer*` couvre souris, tactile et stylet d'un seul jeu d'écouteurs.
    // La capture garantit qu'un doigt qui glisse hors du bouton libère quand
    // même le contact : sans elle, un manipulateur peut rester bloque en bas.
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
    // Empêche le menu contextuel sur appui long mobile.
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

  /** Applique l'inversion des palettes demandée par les gauchers. */
  private resolveSide(side: PaddleSide): PaddleSide {
    const settings = this.options.getSettings();
    if (settings.keyerMode === 'straight' || !settings.swapPaddles) return side;
    return side === 'dit' ? 'dah' : 'dit';
  }

  private attachKeyboard(): void {
    const onKeyDown = (event: KeyboardEvent): void => {
      // `begin` ignore un appui déjà en cours : la garde `repeat` n'est qu'une
      // optimisation, et le manipulateur reste correct sur les claviers qui ne
      // renseignent pas cet indicateur, comme certains claviers d'iPad.
      if (event.repeat || isTypingTarget(event.target)) return;
      const side = this.sideForEvent(event);
      if (!side) return;
      if (shouldPreventDefault(resolveCode(event))) event.preventDefault();
      this.begin(side);
    };
    const onKeyUp = (event: KeyboardEvent): void => {
      const side = this.sideForEvent(event);
      if (!side) return;
      if (shouldPreventDefault(resolveCode(event))) event.preventDefault();
      this.end(side);
    };
    // Un changement d'onglet laisserait le contact ferme : on relâche tout.
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

  private sideForEvent(event: KeyboardEvent): PaddleSide | null {
    const settings = this.options.getSettings();
    if (settings.keyerMode === 'straight') {
      return matchesBinding(event, settings.keyStraight) ? 'dit' : null;
    }
    if (matchesBinding(event, settings.keyDit)) return 'dit';
    if (matchesBinding(event, settings.keyDah)) return 'dah';
    return null;
  }

  /** Reflète visuellement l'état du contact, y compris quand il est généré. */
  setActive(side: PaddleSide | null): void {
    for (const [key, button] of this.buttons) button.classList.toggle('is-emitting', key === side);
  }

  destroy(): void {
    for (const side of [...this.pressed]) this.end(side);
    this.detachKeyboard?.();
    this.detachKeyboard = null;
  }
}
