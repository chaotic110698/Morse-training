/**
 * Moteur audio Web Audio.
 *
 * Deux principes gouvernent ce module :
 *
 * 1. Toute la séquence est programmée à l'avance sur l'horloge de
 *    l'AudioContext (`currentTime`), jamais avec `setTimeout`. Les timers
 *    JavaScript dérivent de plusieurs dizaines de millisecondes sur mobile,
 *    ce qui détruirait le rythme du morse ; l'horloge audio, elle, est
 *    échantillon-exacte.
 * 2. Chaque son est enveloppé par une rampe de montée et de descente de
 *    quelques millisecondes. Un créneau brut produit un « clic de manipulation »
 *    très désagréable et étale le spectre du signal.
 *
 * La synchronisation visuelle et haptique se fait par une boucle
 * `requestAnimationFrame` qui compare l'horloge audio aux instants programmés,
 * de sorte que la diode et le vibreur restent calés sur le son.
 */

import type { TimedElement } from './timing.ts';

export interface AudioSettings {
  /** Fréquence de la tonalité, en hertz. */
  frequency: number;
  /** Volume principal, de 0 à 1. */
  volume: number;
  /** Durée des rampes d'attaque et d'extinction, en millisecondes. */
  rampMs: number;
  /** Forme d'onde de la tonalité. */
  waveform: OscillatorType;
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  frequency: 650,
  volume: 0.35,
  rampMs: 5,
  waveform: 'sine',
};

export interface PlaybackHooks {
  /** Appelé au début de chaque son, calé sur l'horloge audio. */
  onToneStart?: (element: TimedElement, index: number) => void;
  /** Appele à la fin de chaque son. */
  onToneEnd?: (element: TimedElement, index: number) => void;
}

export interface PlaybackHandle {
  /** Résolue à `true` si la lecture est allée au bout, `false` si interrompue. */
  readonly finished: Promise<boolean>;
  /** Instant de début sur l'horloge audio, en secondes. */
  readonly startTime: number;
  /** Durée totale programmée, en secondes. */
  readonly duration: number;
  stop(): void;
}

type Transition = { time: number; index: number; start: boolean };

export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private playbackOsc: OscillatorNode | null = null;
  private playbackGain: GainNode | null = null;
  private sidetoneOsc: OscillatorNode | null = null;
  private sidetoneGain: GainNode | null = null;
  private activeHandle: PlaybackHandle | null = null;
  private rafId = 0;
  private settings: AudioSettings;

  constructor(settings: Partial<AudioSettings> = {}) {
    this.settings = { ...DEFAULT_AUDIO_SETTINGS, ...settings };
  }

  /** Vrai une fois le contexte créé et actif. */
  get ready(): boolean {
    return this.context?.state === 'running';
  }

  /** Horloge audio courante, en secondes. */
  get now(): number {
    return this.context?.currentTime ?? 0;
  }

  /**
   * Crée ou reprend le contexte audio. Doit impérativement être appelé depuis
   * un geste utilisateur : iOS et les politiques d'autoplay des navigateurs de
   * bureau refusent de démarrer un contexte autrement.
   */
  async unlock(): Promise<boolean> {
    if (!this.context) {
      const Ctor: typeof AudioContext =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return false;
      this.context = new Ctor({ latencyHint: 'interactive' });
      this.buildGraph();
    }
    if (this.context.state === 'suspended') {
      try {
        await this.context.resume();
      } catch {
        return false;
      }
    }
    return this.context.state === 'running';
  }

  updateSettings(partial: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...partial };
    if (!this.context || !this.master) return;
    const now = this.context.currentTime;
    this.master.gain.setTargetAtTime(this.settings.volume, now, 0.01);
    this.playbackOsc?.frequency.setTargetAtTime(this.settings.frequency, now, 0.01);
    this.sidetoneOsc?.frequency.setTargetAtTime(this.settings.frequency, now, 0.01);
    if (this.playbackOsc) this.playbackOsc.type = this.settings.waveform;
    if (this.sidetoneOsc) this.sidetoneOsc.type = this.settings.waveform;
  }

  private buildGraph(): void {
    const ctx = this.context;
    if (!ctx) return;

    this.master = ctx.createGain();
    this.master.gain.value = this.settings.volume;
    this.master.connect(ctx.destination);

    const makeVoice = (): [OscillatorNode, GainNode] => {
      const osc = ctx.createOscillator();
      osc.type = this.settings.waveform;
      osc.frequency.value = this.settings.frequency;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(this.master as GainNode);
      osc.start();
      return [osc, gain];
    };

    // Deux voix distinctes : la lecture programmée et le retour local du
    // manipulateur ne doivent jamais se couper l'une l'autre.
    [this.playbackOsc, this.playbackGain] = makeVoice();
    [this.sidetoneOsc, this.sidetoneGain] = makeVoice();
  }

  private get ramp(): number {
    return Math.max(0.001, this.settings.rampMs / 1000);
  }

  /**
   * Programme une séquence complète et renvoie une poignée permettant de
   * l'interrompre. Une seule lecture est active à la fois.
   */
  play(elements: TimedElement[], hooks: PlaybackHooks = {}): PlaybackHandle {
    this.stop();
    const ctx = this.context;
    const gain = this.playbackGain;
    if (!ctx || !gain) {
      return {
        finished: Promise.resolve(false),
        startTime: 0,
        duration: 0,
        stop() {},
      };
    }

    const ramp = this.ramp;
    // Petite marge pour laisser le temps au moteur de programmer les rampes.
    const start = ctx.currentTime + 0.06;
    let cursor = start;
    const transitions: Transition[] = [];

    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);

    elements.forEach((element, index) => {
      if (element.on) {
        // La rampe de descente est comprise dans la durée de l'élément, sinon
        // les sons déborderaient sur le silence et fausseraient le rythme.
        const hold = Math.max(0.002, element.duration - ramp);
        gain.gain.setValueAtTime(0, cursor);
        gain.gain.linearRampToValueAtTime(1, cursor + ramp);
        gain.gain.setValueAtTime(1, cursor + hold);
        gain.gain.linearRampToValueAtTime(0, cursor + hold + ramp);
        transitions.push({ time: cursor, index, start: true });
        transitions.push({ time: cursor + element.duration, index, start: false });
      }
      cursor += element.duration;
    });

    const duration = cursor - start;
    let settle: (completed: boolean) => void = () => {};
    const finished = new Promise<boolean>((resolve) => {
      settle = resolve;
    });

    let cancelled = false;
    let pointer = 0;
    const step = (): void => {
      if (cancelled) return;
      const t = ctx.currentTime;
      while (pointer < transitions.length) {
        const transition = transitions[pointer];
        if (!transition || transition.time > t) break;
        const element = elements[transition.index];
        if (element) {
          if (transition.start) hooks.onToneStart?.(element, transition.index);
          else hooks.onToneEnd?.(element, transition.index);
        }
        pointer += 1;
      }
      if (t >= cursor) {
        this.rafId = 0;
        this.activeHandle = null;
        settle(true);
        return;
      }
      this.rafId = requestAnimationFrame(step);
    };
    this.rafId = requestAnimationFrame(step);

    const handle: PlaybackHandle = {
      finished,
      startTime: start,
      duration,
      stop: () => {
        if (cancelled) return;
        cancelled = true;
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = 0;
        const at = ctx.currentTime;
        gain.gain.cancelScheduledValues(at);
        gain.gain.setValueAtTime(gain.gain.value, at);
        gain.gain.linearRampToValueAtTime(0, at + ramp);
        // Signale la fin du son en cours pour éteindre diode et vibreur.
        const current = transitions[Math.max(0, pointer - 1)];
        if (current?.start) {
          const element = elements[current.index];
          if (element) hooks.onToneEnd?.(element, current.index);
        }
        if (this.activeHandle === handle) this.activeHandle = null;
        settle(false);
      },
    };

    this.activeHandle = handle;
    return handle;
  }

  /** Interrompt la lecture en cours, s'il y en à une. */
  stop(): void {
    this.activeHandle?.stop();
  }

  /** Vrai si une séquence est en cours de lecture. */
  get playing(): boolean {
    return this.activeHandle !== null;
  }

  /** Allume le retour local du manipulateur. */
  startSidetone(): void {
    const ctx = this.context;
    const gain = this.sidetoneGain;
    if (!ctx || !gain) return;
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(1, now + this.ramp);
  }

  /** Coupe le retour local du manipulateur. */
  stopSidetone(): void {
    const ctx = this.context;
    const gain = this.sidetoneGain;
    if (!ctx || !gain) return;
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + this.ramp);
  }

  /**
   * Émet un son court hors séquence, pour les retours d'interface (bonne ou
   * mauvaise réponse). La hauteur est décalée pour ne pas être confondue avec
   * la tonalité d'entraînement.
   */
  feedback(kind: 'ok' | 'error'): void {
    const ctx = this.context;
    const master = this.master;
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(master);
    const now = ctx.currentTime;
    const [f1, f2] = kind === 'ok' ? [880, 1320] : [320, 200];
    osc.frequency.setValueAtTime(f1, now);
    osc.frequency.exponentialRampToValueAtTime(f2, now + 0.09);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  /** Libère les ressources audio. */
  dispose(): void {
    this.stop();
    this.playbackOsc?.stop();
    this.sidetoneOsc?.stop();
    void this.context?.close();
    this.context = null;
    this.master = null;
    this.playbackOsc = null;
    this.playbackGain = null;
    this.sidetoneOsc = null;
    this.sidetoneGain = null;
  }
}
