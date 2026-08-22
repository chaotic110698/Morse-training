/**
 * Bruit de fond de réception.
 *
 * Un récepteur ne laisse pas passer tout le spectre : son filtre de
 * télégraphie fait quelques centaines de hertz de large, centré sur la
 * tonalité d'écoute. Le bruit qu'on entend réellement n'est donc pas du bruit
 * blanc mais un « chhh » coloré autour de cette tonalité — d'où le passage par
 * deux filtres passe-bande en cascade, qui donnent des flancs plus francs qu'un
 * filtre seul.
 *
 * Le tampon est normalisé à une valeur efficace de 1, ce qui rend le niveau
 * calculable : le gain appliqué ensuite vaut exactement la valeur efficace
 * voulue pour le bruit. Sans cette normalisation, un rapport signal/bruit
 * affiché en décibels ne voudrait rien dire, puisque le filtrage retire une
 * part variable de l'énergie.
 */

/** Fréquence centrale du filtre, relative à la tonalité. */
const BAND_Q = 1.8;
/** Longueur du tampon avant bouclage, en secondes. */
const BUFFER_SECONDS = 4;
/** Durée du fondu enchaîné qui rend le bouclage inaudible, en secondes. */
const LOOP_FADE = 0.05;
/** Les crêtes d'un bruit gaussien sont bornées pour éviter toute saturation. */
const PEAK_LIMIT = 3.5;

export interface SnrPreset {
  id: string;
  label: string;
  db: number;
  hint: string;
}

/**
 * Conditions d'écoute, exprimées en rapport signal/bruit. Les valeurs sont
 * choisies pour couvrir l'éventail réel : à 30 dB le bruit n'est qu'une
 * ambiance, à 0 dB le signal a la même puissance que le bruit et la copie
 * demande une vraie attention.
 */
export const SNR_PRESETS: SnrPreset[] = [
  { id: 'excellentes', label: 'Excellentes', db: 30, hint: 'Le bruit est une simple ambiance.' },
  { id: 'bonnes', label: 'Bonnes', db: 20, hint: 'Bruit nettement audible, signal très net.' },
  { id: 'moyennes', label: 'Moyennes', db: 12, hint: 'Conditions ordinaires en ondes courtes.' },
  { id: 'difficiles', label: 'Difficiles', db: 6, hint: 'Il faut se concentrer pour suivre.' },
  { id: 'limite', label: 'À la limite', db: 0, hint: 'Signal et bruit à égalité : la copie devient un exercice.' },
];

export function presetForDb(db: number): SnrPreset {
  return (
    SNR_PRESETS.reduce((best, preset) =>
      Math.abs(preset.db - db) < Math.abs(best.db - db) ? preset : best,
    ) ?? (SNR_PRESETS[2] as SnrPreset)
  );
}

/**
 * Gain à appliquer au tampon de bruit pour obtenir le rapport demandé.
 *
 * Le signal est une sinusoïde d'amplitude crête `volume` ; sa valeur efficace
 * vaut donc `volume / racine(2)`. Le rapport signal/bruit en décibels valant
 * 20·log10(efficace du signal / efficace du bruit), on inverse la relation.
 */
export function noiseGainFor(volume: number, snrDb: number): number {
  const signalRms = Math.max(0, volume) / Math.SQRT2;
  return signalRms * Math.pow(10, -snrDb / 20);
}

type OfflineCtor = new (channels: number, length: number, sampleRate: number) => OfflineAudioContext;

function offlineCtor(): OfflineCtor | null {
  return (
    window.OfflineAudioContext ??
    (window as unknown as { webkitOfflineAudioContext?: OfflineCtor }).webkitOfflineAudioContext ??
    null
  );
}

export function bandNoiseSupported(): boolean {
  return offlineCtor() !== null;
}

/**
 * Fabrique un tampon de bruit de bande, bouclable sans à-coup et normalisé.
 * Le filtrage se fait dans un contexte hors ligne, ce qui permet de mesurer la
 * valeur efficace obtenue et de la ramener à 1.
 */
export async function createBandNoiseBuffer(
  sampleRate: number,
  frequency: number,
  seconds = BUFFER_SECONDS,
): Promise<AudioBuffer | null> {
  const Ctor = offlineCtor();
  if (!Ctor) return null;

  const length = Math.max(1024, Math.floor(sampleRate * seconds));
  const ctx = new Ctor(1, length, sampleRate);

  const white = ctx.createBuffer(1, length, sampleRate);
  const raw = white.getChannelData(0);
  for (let i = 0; i < length; i += 1) raw[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = white;
  const first = ctx.createBiquadFilter();
  first.type = 'bandpass';
  first.frequency.value = frequency;
  first.Q.value = BAND_Q;
  const second = ctx.createBiquadFilter();
  second.type = 'bandpass';
  second.frequency.value = frequency;
  second.Q.value = BAND_Q;

  source.connect(first);
  first.connect(second);
  second.connect(ctx.destination);
  source.start(0);

  const rendered = await ctx.startRendering();
  const filtered = rendered.getChannelData(0);

  // Normalisation à une valeur efficace de 1.
  let energy = 0;
  for (let i = 0; i < filtered.length; i += 1) energy += filtered[i] as number * (filtered[i] as number);
  const rms = Math.sqrt(energy / filtered.length) || 1;
  for (let i = 0; i < filtered.length; i += 1) {
    const value = (filtered[i] as number) / rms;
    filtered[i] = Math.max(-PEAK_LIMIT, Math.min(PEAK_LIMIT, value));
  }

  // Fondu enchaîné : la fin du tampon est mélangée à son début, et la zone
  // recopiée est retirée. La boucle devient continue, sans clic périodique.
  const fade = Math.min(Math.floor(sampleRate * LOOP_FADE), Math.floor(length / 4));
  const loopLength = length - fade;
  for (let i = 0; i < fade; i += 1) {
    const ratio = i / fade;
    filtered[i] = (filtered[i] as number) * ratio + (filtered[loopLength + i] as number) * (1 - ratio);
  }

  const loop = ctx.createBuffer(1, loopLength, sampleRate);
  loop.getChannelData(0).set(filtered.subarray(0, loopLength));
  return loop;
}
