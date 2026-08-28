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
/**
 * Ce qui se passe entre deux pages. Le glissement dit le sens : on entre par
 * la droite en descendant dans le site, par la gauche en remontant.
 */
export type PageMotion = 'aucun' | 'fondu' | 'glissement';

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
  /**
   * Le ruban : le signal dessiné pendant qu'il se joue, comme l'encreur de
   * 1844. Il montre le rythme — ce qui aide à apprendre, et ce qu'on voudra
   * retirer une fois qu'on n'en a plus besoin.
   */
  signalTrace: boolean;
  /**
   * Le souffle du récepteur derrière le ruban : une houle très basse qui
   * vacille, sur laquelle le signal se détache. Purement visuel.
   */
  signalWaves: boolean;
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
  /** La transition d'une page à l'autre. */
  pageMotion: PageMotion;
  /**
   * Ouvrir chaque épisode du mode histoire dans l'habit de son époque, comme
   * il choisit déjà son grain sonore. L'emprunt est rendu en sortant.
   */
  storyTheme: boolean;
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
  signalTrace: true,
  signalWaves: true,
  haptics: true,
  uiSounds: true,
  noiseEnabled: true,
  noiseSnrDb: 20,
  tailUnits: 3,

  theme: 'auto',
  themeFollowsSystem: false,
  periodFont: true,
  ambience: 'discrete',
  pageMotion: 'glissement',
  storyTheme: true,
  callsign: '',
  kochOrder: 'lcwo',
  kochThreshold: 0.9,
  sessionLength: 25,
  freeCharset: '',
};

const WAVEFORMS: Waveform[] = ['sine', 'square', 'triangle', 'sawtooth'];
const ORDERS: KochOrderId[] = ['lcwo', 'classic', 'alphabetical'];
const AMBIENCES: Ambience[] = ['aucune', 'discrete', 'marquee'];
const PAGE_MOTIONS: PageMotion[] = ['aucun', 'fondu', 'glissement'];

const clamp = (value: number, min: number, max: number): number =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;

/** Les réglages dont la valeur est le nom d'une touche du clavier. */
const KEY_BINDINGS = ['keyStraight', 'keyDit', 'keyDah'] as const;

/**
 * Ramène chaque champ au type attendu, avant tout contrôle de bornes.
 *
 * Les nombres et les listes fermées étaient vérifiés un par un ; les booléens
 * et les noms de touches, non — ils passaient tels quels depuis le fichier
 * importé. Un `haptics: 3` restait un 3, et une touche à `null` éteignait le
 * manipulateur en silence, `matchesBinding` comparant par identité sans jamais
 * lever.
 *
 * Le modèle est pris dans les valeurs par défaut plutôt qu'écrit à la main :
 * un booléen ajouté demain sera couvert sans qu'on ait à y penser.
 */
function typed(raw: Settings): Settings {
  const out = raw as unknown as Record<string, unknown>;
  for (const [key, fallback] of Object.entries(DEFAULT_SETTINGS)) {
    if (typeof fallback === 'boolean' && typeof out[key] !== 'boolean') out[key] = fallback;
  }
  for (const key of KEY_BINDINGS) {
    const value = out[key];
    // Un code de touche est court et sans espace : « Space », « ArrowLeft ».
    const usable = typeof value === 'string' && value.trim() !== '' && value.length <= 40;
    if (!usable) out[key] = DEFAULT_SETTINGS[key];
  }
  return raw;
}

/**
 * Ramène des réglages arbitraires dans les bornes valides. Utilise au
 * chargement du stockage local et à l'import d'une sauvegarde, où les données
 * peuvent provenir d'une version antérieure ou avoir été éditées à la main.
 */
export function normalizeSettings(input: Partial<Settings> | null | undefined): Settings {
  const raw = typed({ ...DEFAULT_SETTINGS, ...(input ?? {}) });
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
    pageMotion: PAGE_MOTIONS.includes(raw.pageMotion) ? raw.pageMotion : 'glissement',
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
