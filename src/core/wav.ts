/**
 * Rendu d'une séquence morse en fichier audio WAV.
 *
 * Le rendu se fait dans un `OfflineAudioContext` : le même graphe que la
 * lecture en direct — oscillateur, enveloppe d'attaque, volume — mais calculé
 * plus vite que le temps réel et sans passer par la carte son. Le résultat est
 * encodé en PCM 16 bits, format qu'ouvre n'importe quel lecteur sans dépendre
 * d'un codec.
 */

import { sequenceDuration, type TimedElement } from './timing.ts';
import { createBandNoiseBuffer, noiseGainFor } from './noise.ts';

export interface RenderOptions {
  frequency: number;
  volume: number;
  /** Durée des rampes d'attaque et d'extinction, en millisecondes. */
  rampMs: number;
  waveform: OscillatorType;
  sampleRate?: number;
  /** Silence ajouté en fin de fichier, en secondes. */
  tail?: number;
  /**
   * Rapport signal/bruit à appliquer, en décibels. Absent, le fichier ne
   * contient que la tonalité, sans aucun fond.
   */
  noiseSnrDb?: number | null;
}

/** Durée maximale rendue, garde-fou contre une saisie démesurée. */
export const MAX_RENDER_SECONDS = 15 * 60;

type OfflineCtor = new (channels: number, length: number, sampleRate: number) => OfflineAudioContext;

function offlineContext(length: number, sampleRate: number): OfflineAudioContext | null {
  const Ctor: OfflineCtor | undefined =
    window.OfflineAudioContext ??
    (window as unknown as { webkitOfflineAudioContext?: OfflineCtor }).webkitOfflineAudioContext;
  if (!Ctor) return null;
  return new Ctor(1, length, sampleRate);
}

/** Vrai si le navigateur sait produire un fichier audio hors ligne. */
export function wavExportSupported(): boolean {
  return Boolean(
    window.OfflineAudioContext ??
      (window as unknown as { webkitOfflineAudioContext?: unknown }).webkitOfflineAudioContext,
  );
}

export async function renderMorseToWav(
  elements: TimedElement[],
  options: RenderOptions,
): Promise<Blob> {
  const sampleRate = options.sampleRate ?? 44100;
  const tail = options.tail ?? 0.25;
  const duration = Math.min(MAX_RENDER_SECONDS, sequenceDuration(elements) + tail);
  if (duration <= 0) throw new Error('Séquence vide');

  const ctx = offlineContext(Math.ceil(duration * sampleRate), sampleRate);
  if (!ctx) throw new Error("Ce navigateur ne sait pas produire de fichier audio.");

  const oscillator = ctx.createOscillator();
  oscillator.type = options.waveform;
  oscillator.frequency.value = options.frequency;

  const envelope = ctx.createGain();
  envelope.gain.value = 0;
  const master = ctx.createGain();
  master.gain.value = Math.max(0.0001, options.volume);

  oscillator.connect(envelope);
  envelope.connect(master);
  master.connect(ctx.destination);

  // Mêmes rampes qu'à la lecture : sans elles, chaque son claque et le fichier
  // exporté sonnerait plus dur que ce qu'on entend dans le navigateur.
  const ramp = Math.max(0.001, options.rampMs / 1000);
  let cursor = 0;
  for (const element of elements) {
    if (element.on) {
      const hold = Math.max(0.002, element.duration - ramp);
      envelope.gain.setValueAtTime(0, cursor);
      envelope.gain.linearRampToValueAtTime(1, cursor + ramp);
      envelope.gain.setValueAtTime(1, cursor + hold);
      envelope.gain.linearRampToValueAtTime(0, cursor + hold + ramp);
    }
    cursor += element.duration;
  }

  // Le bruit est mélangé avant la sortie, au même niveau qu'à l'écoute : le
  // tampon est normalisé à une valeur efficace de 1, donc le gain vaut
  // directement la valeur efficace visée.
  if (typeof options.noiseSnrDb === 'number') {
    const noiseBuffer = await createBandNoiseBuffer(sampleRate, options.frequency);
    if (noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = noiseGainFor(options.volume, options.noiseSnrDb);
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(0);
      noise.stop(duration);
    }
  }

  oscillator.start(0);
  oscillator.stop(duration);
  const buffer = await ctx.startRendering();
  return encodeWav(buffer);
}

/** Encode un tampon audio mono en WAV PCM 16 bits. */
export function encodeWav(buffer: AudioBuffer): Blob {
  const samples = buffer.getChannelData(0);
  const bytes = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(bytes);

  const writeText = (offset: number, text: string): void => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeText(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true); // taille du bloc fmt
  view.setUint16(20, 1, true); // PCM entier
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * 2, true); // octets par seconde
  view.setUint16(32, 2, true); // alignement de bloc
  view.setUint16(34, 16, true); // bits par échantillon
  writeText(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i] as number));
    // -32768 et 32767 ne sont pas symétriques : on borne côté positif pour
    // éviter un repliage sur les crêtes.
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }
  return new Blob([bytes], { type: 'audio/wav' });
}

/** Déclenche le téléchargement d'un blob côté navigateur. */
export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Nom de fichier lisible et sans caractère problématique. */
export function slugify(text: string, max = 28): string {
  const slug = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max);
  return slug || 'morse';
}
