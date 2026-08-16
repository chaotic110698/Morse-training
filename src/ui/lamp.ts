/**
 * Diode temoin.
 *
 * Un ecran entier qui clignote est agressif et inutilisable plus de quelques
 * minutes. Une diode dediee, allumee exactement pendant la duree du son,
 * transmet la meme information : la longueur de la lueur distingue le point du
 * trait, sans agresser l'oeil ni empecher de lire le reste de la page.
 */

import { h } from './dom.ts';
import type { ElementKind } from '../core/timing.ts';

export class SignalLamp {
  readonly element: HTMLElement;
  private readonly bulb: HTMLElement;
  private readonly caption: HTMLElement;
  private enabled = true;

  constructor(label = 'Signal') {
    this.bulb = h('span', { class: 'lamp__bulb', attrs: { 'aria-hidden': 'true' } });
    this.caption = h('span', { class: 'lamp__caption', text: label });
    this.element = h(
      'div',
      {
        class: 'lamp',
        attrs: {
          role: 'status',
          'aria-live': 'off',
          'aria-label': 'Temoin visuel du signal morse',
        },
      },
      this.bulb,
      this.caption,
    );
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.element.classList.toggle('lamp--off', !enabled);
    if (!enabled) this.off();
  }

  /** Allume la diode. `kind` colore legerement le point et le trait. */
  on(kind: ElementKind | null = null): void {
    if (!this.enabled) return;
    this.bulb.classList.add('is-lit');
    if (kind) this.bulb.dataset['kind'] = kind;
    else delete this.bulb.dataset['kind'];
  }

  off(): void {
    this.bulb.classList.remove('is-lit');
    delete this.bulb.dataset['kind'];
  }

  setCaption(text: string): void {
    this.caption.textContent = text;
  }
}
