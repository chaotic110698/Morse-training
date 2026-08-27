/** Réglages de l'application, persistés tels quels. */

import { isKnownTheme } from '../data/themes.ts';

export type Waveform = 'sine' | 'square' | 'triangle' | 'sawtooth';
/**
 * L'habit du site : « auto » suit la lumière du système, tout autre valeur est
 * un identifiant du registre des thèmes. Le type reste ouvert exprès — ajouter
 * un habit ne doit demander aucune retouche ici.
 */
export type Theme = 'auto' | string;
export type KochOrderId = 'lcwo' | 'classic' | 'alphabetical';
/**
 * La force de l'ambiance : la lumière de la pièce que déclare l'habit. Sans
 * effet sur les habits qui n'ont pas de source.
 */
export type Ambience = 'aucune' | 'discrete' | 'marquee';

export interface Settings {
  /** Vitesse des caractères, en mots par minute. */
  charWpm: number;
  /** Vitesse globale perçue ; inférieure à `charWpm` active le mode Farnsworth. */
  effectiveWpm: number;
  frequency: number;
  volume: number;
  rampMs: number;
  waveform: Waveform;

  /** Type de manipulateur pour les exercices d'émission. */
  keyerMode: 'straight' | 'paddle-single' | 'iambic-a' | 'iambic-b';
  /** Ajustement automatique de la frontière point/trait à la frappe réelle. */
  adaptiveKeying: boolean;
  /** Inverse les deux palettes, pour les gauchers. */
  swapPaddles: boolean;
  /**
   * Frappe sans contrainte de temps. Le décodage cesse d'être arbitré par un
   * chronomètre : dans les exercices guidés, chaque élément est comparé au code
   * attendu, si bien qu'une pause n'a plus aucune conséquence et que seule une
   * erreur réelle interrompt la saisie.
   */
  forgivingKeying: boolean;
  /** Code physique de la touche du manipulateur droit. */
  keyStraight: string;
  /** Code physique de la palette « point ». */
  keyDit: string;
  /** Code physique de la palette « trait ». */
  keyDah: string;

  /** Diode témoin synchronisée sur le son. */
  visualSignal: boolean;
  /** Retour haptique quand le matériel le permet. */
  haptics: boolean;
  /** Sons de confirmation et d'erreur de l'interface. */
  uiSounds: boolean;
  /** Bruit de fond de réception pendant les séances. */
  noiseEnabled: boolean;
  /** Rapport signal/bruit visé, en décibels. */
  noiseSnrDb: number;
  /**
   * Silence ajouté après le dernier signal, en unités. Il détache la fin de
   * l'émission de l'extinction de la sortie audio, dont beaucoup de casques
   * signalent l'arrivée par un craquement.
   */
  tailUnits: number;

  theme: Theme;
  /**
   * Suivre la lumière du système en basculant vers l'habit jumeau : « Papier
   * et encre » le jour, « Cabine de nuit » le soir. Sans effet sur un habit
   * qui n'a pas de jumeau.
   *
   * Au repos par défaut : sans cela, choisir un habit sombre sur un appareil
   * réglé en clair en applique aussitôt un autre, et le choix qu'on vient de
   * faire semble ignoré.
   */
  themeFollowsSystem: boolean;
  /** Employer les empattements des habits d'époque. */
  periodFont: boolean;
  /** Force de la lumière de la pièce. */
  ambience: Ambience;
  /**
   * Indicatif fictif adopté par l'opérateur. Sert d'exemple d'entraînement, il
   * n'a aucune valeur officielle et ne doit pas être émis sur l'air.
   */
  callsign: string;
  /** Ordre d'introduction des caractères en méthode Koch. */
  kochOrder: KochOrderId;
  /** Précision à atteindre pour débloquer le caractère suivant, de 0 à 1. */
  kochThreshold: number;
  /** Nombre de caractères tirés par série d'entraînement. */
  sessionLength: number;
  /**
   * Caractères retenus pour la série libre. Vide au départ : la page propose
   * alors le jeu du niveau Koch en cours, ce qui donne un point de départ
   * sensé sans rien imposer.
   */
  freeCharset: string;
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
  forgivingKeying: false,
  keyStraight: 'Space',
  keyDit: 'ArrowLeft',
  keyDah: 'ArrowRight',

  visualSignal: true,
  haptics: true,
  uiSounds: true,
  noiseEnabled: true,
  noiseSnrDb: 20,
  tailUnits: 3,

  theme: 'auto',
  themeFollowsSystem: false,
  periodFont: true,
  ambience: 'discrete',
  callsign: '',
  kochOrder: 'lcwo',
  kochThreshold: 0.9,
  sessionLength: 25,
  freeCharset: '',
};

const WAVEFORMS: Waveform[] = ['sine', 'square', 'triangle', 'sawtooth'];
const ORDERS: KochOrderId[] = ['lcwo', 'classic', 'alphabetical'];
const AMBIENCES: Ambience[] = ['aucune', 'discrete', 'marquee'];

const clamp = (value: number, min: number, max: number): number =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;

/**
 * Ramène des réglages arbitraires dans les bornes valides. Utilise au
 * chargement du stockage local et à l'import d'une sauvegarde, où les données
 * peuvent provenir d'une version antérieure ou avoir été éditées à la main.
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
    keyerMode: (['straight', 'paddle-single', 'iambic-a', 'iambic-b'] as const).includes(raw.keyerMode)
      ? raw.keyerMode
      : 'straight',
    // Un habit inconnu — supprimé depuis, ou jamais existé — retombe sur le
    // suivi du système plutôt que de laisser la racine sans palette.
    theme: raw.theme === 'auto' || isKnownTheme(raw.theme) ? raw.theme : 'auto',
    ambience: AMBIENCES.includes(raw.ambience) ? raw.ambience : 'discrete',
    kochOrder: ORDERS.includes(raw.kochOrder) ? raw.kochOrder : 'lcwo',
    kochThreshold: clamp(raw.kochThreshold, 0.6, 1),
    sessionLength: Math.round(clamp(raw.sessionLength, 5, 100)),
    noiseSnrDb: Math.round(clamp(raw.noiseSnrDb, 0, 40)),
    tailUnits: Math.round(clamp(raw.tailUnits, 0, 10)),
    callsign: String(raw.callsign ?? '').toUpperCase().replace(/[^A-Z0-9/]/g, '').slice(0, 12),
    // La sélection est une chaîne de caractères distincts, dans l'ordre où on
    // les affiche. On la nettoie comme le reste : une sauvegarde éditée à la
    // main ne doit pas pouvoir injecter un caractère que le site ne sait pas
    // coder.
    freeCharset: [...new Set(String(raw.freeCharset ?? '').toUpperCase())]
      .filter((char) => /[A-Z0-9.,?/=]/.test(char))
      .join(''),
  };
}
