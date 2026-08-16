/** Reglages de l'application, persistes tels quels. */

export type Waveform = 'sine' | 'square' | 'triangle' | 'sawtooth';
export type Theme = 'auto' | 'dark' | 'light';
export type KochOrderId = 'lcwo' | 'classic' | 'alphabetical';

export interface Settings {
  /** Vitesse des caracteres, en mots par minute. */
  charWpm: number;
  /** Vitesse globale percue ; inferieure a `charWpm` active le mode Farnsworth. */
  effectiveWpm: number;
  frequency: number;
  volume: number;
  rampMs: number;
  waveform: Waveform;

  /** Type de manipulateur pour les exercices d'emission. */
  keyerMode: 'straight' | 'iambic-a' | 'iambic-b';
  /** Ajustement automatique de la frontiere point/trait a la frappe reelle. */
  adaptiveKeying: boolean;
  /** Inverse les deux palettes, pour les gauchers. */
  swapPaddles: boolean;
  /** Code physique de la touche du manipulateur droit. */
  keyStraight: string;
  /** Code physique de la palette « point ». */
  keyDit: string;
  /** Code physique de la palette « trait ». */
  keyDah: string;

  /** Diode temoin synchronisee sur le son. */
  visualSignal: boolean;
  /** Retour haptique quand le materiel le permet. */
  haptics: boolean;
  /** Sons de confirmation et d'erreur de l'interface. */
  uiSounds: boolean;

  theme: Theme;
  /** Ordre d'introduction des caracteres en methode Koch. */
  kochOrder: KochOrderId;
  /** Precision a atteindre pour debloquer le caractere suivant, de 0 a 1. */
  kochThreshold: number;
  /** Nombre de caracteres tires par serie d'entrainement. */
  sessionLength: number;
}

export const DEFAULT_SETTINGS: Settings = {
  charWpm: 20,
  effectiveWpm: 10,
  frequency: 650,
  volume: 0.35,
  rampMs: 5,
  waveform: 'sine',

  keyerMode: 'straight',
  adaptiveKeying: true,
  swapPaddles: false,
  keyStraight: 'Space',
  keyDit: 'ArrowLeft',
  keyDah: 'ArrowRight',

  visualSignal: true,
  haptics: true,
  uiSounds: true,

  theme: 'auto',
  kochOrder: 'lcwo',
  kochThreshold: 0.9,
  sessionLength: 25,
};

const WAVEFORMS: Waveform[] = ['sine', 'square', 'triangle', 'sawtooth'];
const THEMES: Theme[] = ['auto', 'dark', 'light'];
const ORDERS: KochOrderId[] = ['lcwo', 'classic', 'alphabetical'];

const clamp = (value: number, min: number, max: number): number =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;

/**
 * Ramene des reglages arbitraires dans les bornes valides. Utilise au
 * chargement du stockage local et a l'import d'une sauvegarde, ou les donnees
 * peuvent provenir d'une version anterieure ou avoir ete editees a la main.
 */
export function normalizeSettings(input: Partial<Settings> | null | undefined): Settings {
  const raw = { ...DEFAULT_SETTINGS, ...(input ?? {}) };
  const charWpm = Math.round(clamp(raw.charWpm, 5, 60));
  return {
    ...raw,
    charWpm,
    effectiveWpm: Math.round(clamp(raw.effectiveWpm, 5, charWpm)),
    frequency: Math.round(clamp(raw.frequency, 300, 1200)),
    volume: clamp(raw.volume, 0, 1),
    rampMs: Math.round(clamp(raw.rampMs, 1, 20)),
    waveform: WAVEFORMS.includes(raw.waveform) ? raw.waveform : 'sine',
    keyerMode: (['straight', 'iambic-a', 'iambic-b'] as const).includes(raw.keyerMode)
      ? raw.keyerMode
      : 'straight',
    theme: THEMES.includes(raw.theme) ? raw.theme : 'auto',
    kochOrder: ORDERS.includes(raw.kochOrder) ? raw.kochOrder : 'lcwo',
    kochThreshold: clamp(raw.kochThreshold, 0.6, 1),
    sessionLength: Math.round(clamp(raw.sessionLength, 5, 100)),
  };
}
