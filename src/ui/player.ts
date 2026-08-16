/**
 * Lecture d'un texte en morse, avec ses sorties son, lumiere et vibration.
 *
 * Les trois sorties partent de la meme sequence d'elements : elles sont donc
 * coherentes par construction, et rien ne peut deriver entre l'oreille, la
 * diode et le vibreur.
 */

import { encodeChar } from '../core/morse.ts';
import { buildSequence, sequenceDuration, type TimedElement } from '../core/timing.ts';
import type { AppStore } from '../core/store.ts';
import type { SignalLamp } from './lamp.ts';

export interface PlayOptions {
  /** Surligne le caractere en cours de lecture. */
  onChar?: (charIndex: number, char: string | undefined) => void;
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

  /** Convertit un texte en sequence temporelle prete a jouer. */
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

  /** Joue un texte et resout a `true` si la lecture est allee au bout. */
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
    const handle = this.store.audio.play(elements, {
      onToneStart: (element) => {
        this.lamp?.on(element.kind ?? null);
        if (element.charIndex !== undefined && element.charIndex !== lastCharIndex) {
          lastCharIndex = element.charIndex;
          options.onChar?.(element.charIndex, element.char);
        }
      },
      onToneEnd: () => this.lamp?.off(),
    });

    // La vibration est confiee au systeme en une seule fois : l'ordonnancement
    // par l'OS est bien plus regulier qu'une serie d'appels depuis JavaScript.
    this.store.haptics.playSequence(elements);

    options.onStart?.(sequenceDuration(elements));
    const completed = await handle.finished;
    this.lamp?.off();
    if (!completed) this.store.haptics.cancel();
    options.onEnd?.(completed);
    // `unlocked` a faux signifie que le navigateur a refuse le contexte audio :
    // la lecture visuelle et haptique a tout de meme eu lieu.
    return completed && unlocked;
  }

  stop(): void {
    this.stopped = true;
    this.store.audio.stop();
    this.store.haptics.cancel();
    this.lamp?.off();
  }
}
