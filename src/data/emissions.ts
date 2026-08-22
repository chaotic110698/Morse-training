/**
 * Classes d'émission, telles que définies par l'appendice A1 du Règlement des
 * radiocommunications.
 *
 * Trois caractères désignent une émission : la manière dont la porteuse est
 * modulée, la nature du signal qui la module, le type d'information transmise.
 * L'ordre d'écriture n'est pas l'ordre de lecture — on comprend une classe en
 * partant de la fin — ce qui justifie de traiter les trois axes séparément
 * plutôt que de tenir une liste des combinaisons rencontrées.
 */

export interface EmissionCode {
  code: string;
  label: string;
  /** Faux pour les codes que les radioamateurs n'emploient pas. */
  amateur: boolean;
}

/** Premier caractère : modulation de la porteuse principale. */
export const MODULATIONS: EmissionCode[] = [
  { code: 'N', label: 'Porteuse non modulée', amateur: true },
  { code: 'A', label: 'Amplitude, double bande latérale', amateur: true },
  { code: 'B', label: 'Amplitude, bandes latérales indépendantes', amateur: false },
  { code: 'C', label: 'Amplitude, bande latérale résiduelle', amateur: false },
  { code: 'D', label: 'Amplitude et modulation angulaire combinées', amateur: true },
  { code: 'F', label: 'Angulaire — modulation de fréquence', amateur: true },
  { code: 'G', label: 'Angulaire — modulation de phase', amateur: true },
  { code: 'H', label: 'Bande latérale unique, porteuse complète', amateur: true },
  { code: 'J', label: 'Bande latérale unique, porteuse supprimée', amateur: true },
  { code: 'R', label: 'Bande latérale unique, porteuse réduite', amateur: true },
  { code: 'K', label: 'Train d’impulsions, modulation d’amplitude', amateur: false },
  { code: 'L', label: 'Train d’impulsions, modulation de largeur', amateur: false },
  { code: 'M', label: 'Train d’impulsions, modulation de position', amateur: false },
  { code: 'P', label: 'Train d’impulsions non modulé', amateur: false },
  { code: 'Q', label: 'Train d’impulsions, modulation angulaire', amateur: false },
  { code: 'V', label: 'Train d’impulsions, combinaison des précédents', amateur: false },
  { code: 'W', label: 'Combinaison de plusieurs modulations', amateur: true },
  { code: 'X', label: 'Autres cas', amateur: false },
];

/** Deuxième caractère : nature du signal modulant. */
export const SIGNALS: EmissionCode[] = [
  { code: '0', label: 'Pas de signal modulant', amateur: true },
  { code: '1', label: 'Une voie numérique, sans sous-porteuse modulante', amateur: true },
  { code: '2', label: 'Une voie numérique, avec sous-porteuse modulante', amateur: true },
  { code: '3', label: 'Une voie analogique', amateur: true },
  { code: '7', label: 'Plusieurs voies numériques', amateur: true },
  { code: '8', label: 'Plusieurs voies analogiques', amateur: false },
  { code: '9', label: 'Voies numériques et analogiques combinées', amateur: true },
  { code: 'X', label: 'Autres cas', amateur: false },
];

/** Troisième caractère : type d'information transmise. */
export const INFORMATIONS: EmissionCode[] = [
  { code: 'N', label: 'Aucune information', amateur: true },
  { code: 'A', label: 'Télégraphie auditive — lue à l’oreille', amateur: true },
  { code: 'B', label: 'Télégraphie automatique — lue par une machine', amateur: true },
  { code: 'C', label: 'Fac-similé — image fixe', amateur: true },
  { code: 'D', label: 'Transmission de données', amateur: true },
  { code: 'E', label: 'Téléphonie — la voix', amateur: true },
  { code: 'F', label: 'Télévision — vidéo', amateur: true },
  { code: 'W', label: 'Combinaison de plusieurs types d’information', amateur: true },
  { code: 'X', label: 'Autres cas', amateur: false },
];

export interface KnownEmission {
  code: string;
  name: string;
  comment: string;
}

/** Les classes qu'un opérateur rencontre réellement sur l'air. */
export const KNOWN_EMISSIONS: KnownEmission[] = [
  { code: 'A1A', name: 'Télégraphie au manipulateur',
    comment: "La CW classique : on coupe et rétablit la porteuse à la main. C’est le morse de ce site." },
  { code: 'A1B', name: 'Télégraphie automatique',
    comment: "Le même signal, mais produit et lu par une machine plutôt que par un opérateur." },
  { code: 'A2A', name: 'Télégraphie modulée en amplitude',
    comment: "La porteuse reste présente et c’est une sous-porteuse audible qui est manipulée. Se reçoit sur un poste sans oscillateur de battement." },
  { code: 'F2A', name: 'Télégraphie sur porteuse modulée en fréquence',
    comment: "La CW telle qu’un récepteur FM la restitue : la sous-porteuse rend la tonalité audible." },
  { code: 'A3E', name: 'Téléphonie en modulation d’amplitude',
    comment: "L’AM historique, avec sa porteuse et ses deux bandes latérales." },
  { code: 'J3E', name: 'Téléphonie en bande latérale unique',
    comment: "La BLU, mode vocal habituel en décamétriques. Ni porteuse, ni bande latérale de trop." },
  { code: 'F3E', name: 'Téléphonie en modulation de fréquence',
    comment: "La FM des relais VHF et UHF." },
  { code: 'G3E', name: 'Téléphonie en modulation de phase',
    comment: "Si proche de la FM qu’on les confond souvent. En cas de doute sur la modulation, le code F est retenu." },
  { code: 'G2B', name: 'Modes numériques à sous-porteuse',
    comment: "Le PSK31 par exemple : ce n’est pas une classe d’émission, mais un protocole qui en utilise une." },
  { code: 'J3C', name: 'Images fixes en bande latérale unique',
    comment: "La SSTV : malgré son nom, elle transmet des images fixes, donc du fac-similé et non de la vidéo." },
  { code: 'F7W', name: 'Voix et données numériques simultanées',
    comment: "Le D-Star et ses semblables : plusieurs voies numériques portant plusieurs types d’information." },
  { code: 'N0N', name: 'Porteuse seule',
    comment: "Aucune information transmise : un réglage d’émetteur, ou une balise non modulée." },
];

/** Les six classes autorisées aux opérateurs de l'ancienne classe 3. */
export const NOVICE_EMISSIONS = ['A1A', 'A2A', 'A3E', 'F3E', 'G3E', 'J3E'];

export interface DecodedEmission {
  modulation: EmissionCode | null;
  signal: EmissionCode | null;
  information: EmissionCode | null;
}

const findCode = (table: EmissionCode[], char: string | undefined): EmissionCode | null =>
  char === undefined ? null : table.find((entry) => entry.code === char) ?? null;

/** Décompose une classe d'émission en ses trois caractères signifiants. */
export function decodeEmission(raw: string): DecodedEmission {
  const code = raw.trim().toUpperCase();
  return {
    modulation: code.length > 0 ? findCode(MODULATIONS, code[0]) : null,
    signal: code.length > 1 ? findCode(SIGNALS, code[1]) : null,
    information: code.length > 2 ? findCode(INFORMATIONS, code[2]) : null,
  };
}

/**
 * Largeur de bande occupée maximale, en kilohertz, à une fréquence donnée.
 *
 * Renvoie null au-delà de 225 MHz, où aucune limite n'est fixée — ce qui
 * n'autorise pas pour autant à s'étaler : le RR demande de réduire la largeur
 * autant que les considérations techniques le permettent.
 */
export function maxBandwidthKhz(kHz: number): number | null {
  if (kHz < 28_000) return 6;
  if (kHz < 144_000) return 12;
  if (kHz < 225_000) return 20;
  return null;
}
