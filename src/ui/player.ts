/**
 * Lecture d'un texte en morse, avec ses sorties son, lumière et vibration.
 *
 * Les trois sorties partent de la même séquence d'éléments : elles sont donc
 * cohérentes par construction, et rien ne peut dériver entre l'oreille, la
 * diode et le vibreur.
 */

import { encodeChar, isValidCode, normalizeMorseInput } from '../core/morse.ts';
import { buildSequence, sequenceDuration, type TimedElement } from '../core/timing.ts';
import type { AppStore } from '../core/store.ts';
import type { SignalLamp } from './lamp.ts';

export interface PlayOptions {
  /** Surligne le caractère en cours de lecture. */
  onChar?: (charIndex: number, char: string | undefined) => void;
  /**
   * Suit l'état du signal, calé sur l'horloge audio. Sert aux sorties qui ne
   * passent pas par le moteur audio : lampe torche, flash d'écran.
   */
  onSignal?: (on: boolean, element: TimedElement) => void;
  onStart?: (duration: number) => void;
  onEnd?: (completed: boolean) => void;
}

export class MorsePlayer {
  private readonly store: AppStore;
  private lamp: SignalLamp | null;
  private stopped = false;

  constructor(store: AppStore, lamp: SignalLamp | null = null) {
    this.store = store;
    this.lamp = lamp;
  }

  setLamp(lamp: SignalLamp | null): void {
    this.lamp = lamp;
  }

  get playing(): boolean {
    return this.store.audio.playing;
  }

  /** Convertit un texte en séquence temporelle prête à jouer. */
  buildElements(text: string): TimedElement[] {
    const timing = this.store.timing;
    const tokens = [...text.toUpperCase()].map((char) => {
      if (char === ' ') return { code: '', char: ' ' };
      return { code: encodeChar(char) ?? '', char };
    });
    return buildSequence(
      tokens.filter((token) => token.code !== '' || token.char === ' '),
      timing,
    );
  }

  /**
   * Convertit une notation morse écrite en séquence temporelle. Les caractères
   * sont séparés par des espaces et les mots par une barre oblique, ce qui
   * permet de jouer fidèlement une saisie manuelle, y compris un code qui ne
   * correspond à aucune lettre.
   */
  buildElementsFromMorse(morse: string): TimedElement[] {
    const timing = this.store.timing;
    const tokens: Array<{ code: string; char?: string }> = [];
    for (const chunk of normalizeMorseInput(morse).split(' ')) {
      if (chunk === '') continue;
      if (chunk === '/') {
        tokens.push({ code: '', char: ' ' });
        continue;
      }
      if (isValidCode(chunk)) tokens.push({ code: chunk });
    }
    return buildSequence(tokens, timing);
  }

  /** Joue un texte et résout à `true` si la lecture est allée au bout. */
  async play(text: string, options: PlayOptions = {}): Promise<boolean> {
    const elements = this.buildElements(text);
    if (elements.length === 0) return false;
    return this.playElements(elements, options);
  }

  async playElements(elements: TimedElement[], options: PlayOptions = {}): Promise<boolean> {
    this.stopped = false;
    const unlocked = await this.store.audio.unlock();
    if (this.stopped) return false;

    let lastCharIndex = -1;
    let lastSignalElement: TimedElement | null = null;
    const handle = this.store.audio.play(elements, {
      onToneStart: (element) => {
        this.lamp?.on(element.kind ?? null);
        lastSignalElement = element;
        options.onSignal?.(true, element);
        if (element.charIndex !== undefined && element.charIndex !== lastCharIndex) {
          lastCharIndex = element.charIndex;
          options.onChar?.(element.charIndex, element.char);
        }
      },
      onToneEnd: (element) => {
        this.lamp?.off();
        options.onSignal?.(false, element);
      },
    });

    // La vibration est confiée au système en une seule fois : l'ordonnancement
    // par l'OS est bien plus régulier qu'une série d'appels depuis JavaScript.
    this.store.haptics.playSequence(elements);

    options.onStart?.(sequenceDuration(elements));
    const completed = await handle.finished;
    this.lamp?.off();
    // Filet de sécurité : une lecture interrompue en plein signal doit laisser
    // toutes les sorties éteintes, pas seulement la diode.
    if (lastSignalElement) options.onSignal?.(false, lastSignalElement);
    if (!completed) this.store.haptics.cancel();
    options.onEnd?.(completed);
    // `unlocked` à faux signifie que le navigateur a refusé le contexte audio :
    // la lecture visuelle et haptique à tout de même eu lieu.
    return completed && unlocked;
  }

  stop(): void {
    this.stopped = true;
    this.store.audio.stop();
    this.store.haptics.cancel();
    this.lamp?.off();
  }
}
