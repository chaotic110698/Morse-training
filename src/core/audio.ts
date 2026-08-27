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
import { createBandNoiseBuffer, noiseGainFor } from './noise.ts';

export interface AudioSettings {
  /** Bruit de fond de réception pendant les séances. */
  noiseEnabled: boolean;
  /** Rapport signal/bruit visé, en décibels. */
  noiseSnrDb: number;
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
  noiseEnabled: true,
  noiseSnrDb: 20,
  frequency: 650,
  volume: 0.35,
  rampMs: 5,
  waveform: 'sine',
};

/**
 * Le grain d'une époque.
 *
 * `pur` est la note propre d'un oscillateur à quartz — le son que tout le site
 * emploie. `etincelle` reproduit un émetteur à éclateur : une note sale,
 * hachée par la fréquence des décharges, telle qu'on l'entendait de 1900 aux
 * années 1920. `relais` évoque le télégraphe filaire, qui ne produisait aucune
 * note : deux claquements, un à la fermeture du circuit, un à l'ouverture.
 *
 * Le `relais` d'ici est une reconstitution et non une copie : le claquement est
 * posé sur une note tenue, alors qu'un vrai sondeur n'en avait pas. Sans elle,
 * il faudrait lire la durée au silence entre deux clics, ce que savaient faire
 * les opérateurs de 1860 et personne d'autre.
 */
export type ToneVoice = 'pur' | 'etincelle' | 'relais';

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
  /** Rugosité de l'éclateur : un gain que module une basse fréquence. */
  private roughGain: GainNode | null = null;
  private roughDepth: GainNode | null = null;
  private roughOsc: OscillatorNode | null = null;
  /** Bruit court, pour le claquement du relais. */
  private clickBuffer: AudioBuffer | null = null;
  private voice: ToneVoice = 'pur';
  private activeHandle: PlaybackHandle | null = null;
  private noiseGain: GainNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  /** Fréquence pour laquelle le tampon a été filtré, pour ne le refaire qu'utile. */
  private noiseBufferFrequency = 0;
  private noiseWanted = false;
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
    // iOS ajoute un état « interrupted », non normalisé, dans lequel bascule le
    // contexte dès qu'une autre source prend la session audio — l'ouverture de
    // la caméra pour la torche, par exemple. On tente donc la reprise dès que
    // l'état n'est pas « running », et non seulement sur « suspended ».
    if (this.context.state !== 'running') {
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
    this.applyNoiseLevel();
    // Le filtrage dépend de la tonalité : changer celle-ci périme le tampon.
    if (this.noiseBufferFrequency !== this.settings.frequency) {
      this.noiseBuffer = null;
      if (this.noiseWanted) void this.startNoise();
    }
  }

  /** Niveau courant du bruit, déduit du volume et du rapport signal/bruit. */
  private applyNoiseLevel(): void {
    const ctx = this.context;
    if (!ctx || !this.noiseGain) return;
    const target =
      this.noiseWanted && this.settings.noiseEnabled
        ? noiseGainFor(this.settings.volume, this.settings.noiseSnrDb)
        : 0;
    this.noiseGain.gain.setTargetAtTime(target, ctx.currentTime, 0.05);
  }

  /** Vrai si le bruit de fond est en train de jouer. */
  get noiseRunning(): boolean {
    return this.noiseSource !== null;
  }

  /**
   * Démarre le bruit de fond. Il monte en une fraction de seconde, et reste
   * ensuite continu : c'est aussi ce qui empêche l'appareil de couper sa sortie
   * entre deux caractères, coupure dont beaucoup de casques signalent la fin
   * par un craquement.
   */
  async startNoise(): Promise<void> {
    this.noiseWanted = true;
    if (!this.settings.noiseEnabled) return;
    if (!(await this.unlock())) return;
    const ctx = this.context;
    if (!ctx || !this.noiseGain) return;

    if (!this.noiseBuffer || this.noiseBufferFrequency !== this.settings.frequency) {
      const buffer = await createBandNoiseBuffer(ctx.sampleRate, this.settings.frequency);
      if (!buffer) return;
      this.noiseBuffer = buffer;
      this.noiseBufferFrequency = this.settings.frequency;
    }
    // Une reprise pendant la génération du tampon a pu tout annuler.
    if (!this.noiseWanted) return;

    this.stopNoiseSource();
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;
    source.connect(this.noiseGain);
    source.start();
    this.noiseSource = source;
    this.applyNoiseLevel();
  }

  /** Coupe le bruit de fond, avec une descente douce. */
  stopNoise(): void {
    this.noiseWanted = false;
    const ctx = this.context;
    if (!ctx || !this.noiseGain) {
      this.stopNoiseSource();
      return;
    }
    this.noiseGain.gain.cancelScheduledValues(ctx.currentTime);
    this.noiseGain.gain.setValueAtTime(this.noiseGain.gain.value, ctx.currentTime);
    this.noiseGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
    const source = this.noiseSource;
    this.noiseSource = null;
    if (source) window.setTimeout(() => source.stop(), 400);
  }

  private stopNoiseSource(): void {
    try {
      this.noiseSource?.stop();
    } catch {
      // Une source déjà arrêtée lève : sans conséquence.
    }
    this.noiseSource = null;
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

    // La lecture traverse un étage de rugosité, transparent au repos. Une
    // basse fréquence vient moduler son gain pour l'éclateur ; à profondeur
    // nulle, le signal passe intact.
    this.roughGain = ctx.createGain();
    this.roughGain.gain.value = 1;
    this.playbackGain.disconnect();
    this.playbackGain.connect(this.roughGain);
    this.roughGain.connect(this.master);

    this.roughDepth = ctx.createGain();
    this.roughDepth.gain.value = 0;
    this.roughDepth.connect(this.roughGain.gain);

    this.roughOsc = ctx.createOscillator();
    this.roughOsc.type = 'square';
    this.roughOsc.frequency.value = 120;
    this.roughOsc.connect(this.roughDepth);
    this.roughOsc.start();

    // Le bruit a sa propre voie, réglée indépendamment des tonalités.
    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.value = 0;
    this.noiseGain.connect(ctx.destination);
  }

  private get ramp(): number {
    // Le relais claque : sa montée est franche quoi qu'on ait réglé, sinon le
    // claquement se noie dans une attaque douce et ne s'entend plus.
    if (this.voice === 'relais') return 0.0015;
    return Math.max(0.001, this.settings.rampMs / 1000);
  }

  /** Règle le grain de la voix de lecture avant de programmer une séquence. */
  private applyVoice(voice: ToneVoice): void {
    this.voice = voice;
    const ctx = this.context;
    const osc = this.playbackOsc;
    const depth = this.roughDepth;
    if (!ctx || !osc || !depth) return;
    const now = ctx.currentTime;

    if (voice === 'etincelle') {
      osc.type = 'sawtooth';
      // Un éclateur émet un train d'étincelles : la note existe, mais elle est
      // hachée à la cadence des décharges. C'est ce hachage qu'on entend, et
      // c'est lui qui rend le son reconnaissable entre mille.
      this.roughOsc?.frequency.setValueAtTime(140, now);
      depth.gain.setTargetAtTime(0.45, now, 0.02);
      return;
    }

    osc.type = voice === 'relais' ? 'sine' : this.settings.waveform;
    depth.gain.setTargetAtTime(0, now, 0.02);
  }

  /**
   * Le claquement du relais : une bouffée de bruit très courte, posée à
   * l'ouverture et à la fermeture du circuit.
   */
  private scheduleClick(at: number): void {
    const ctx = this.context;
    const master = this.master;
    if (!ctx || !master) return;

    if (!this.clickBuffer) {
      const frames = Math.max(1, Math.round(ctx.sampleRate * 0.006));
      const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < frames; i += 1) {
        // Une décroissance rapide : c'est ce qui fait un clic plutôt qu'un souffle.
        data[i] = (Math.random() * 2 - 1) * (1 - i / frames) ** 3;
      }
      this.clickBuffer = buffer;
    }

    const source = ctx.createBufferSource();
    source.buffer = this.clickBuffer;
    const gain = ctx.createGain();
    gain.gain.value = this.settings.volume * 0.5;
    source.connect(gain);
    gain.connect(master);
    source.start(at);
  }

  /**
   * Programme une séquence complète et renvoie une poignée permettant de
   * l'interrompre. Une seule lecture est active à la fois.
   */
  play(elements: TimedElement[], hooks: PlaybackHooks = {}, voice: ToneVoice = 'pur'): PlaybackHandle {
    this.stop();
    this.applyVoice(voice);
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
        if (voice === 'relais') {
          this.scheduleClick(cursor);
          this.scheduleClick(cursor + hold);
        }
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
    this.stopNoiseSource();
    this.noiseWanted = false;
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
