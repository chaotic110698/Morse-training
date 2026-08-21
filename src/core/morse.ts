/**
 * Tables du code morse international et conversions texte <-> morse.
 *
 * Le morse est noté ici avec deux caractères ASCII : `.` pour le point (dit)
 * et `-` pour le trait (dah). Les prosignes (signaux de procédure) sont des
 * suites de lettres émises sans espace inter-caractère ; ils sont déclarés à
 * part car ils n'ont pas de représentation textuelle d'un seul caractère.
 */

export type MorseCode = string;

export interface Prosign {
  /** Notation usuelle, ex. "AR". */
  name: string;
  /** Notation avec surlignage conventionnel, ex. "AR" barre. */
  code: MorseCode;
  meaning: string;
}

/** Lettres de l'alphabet latin. */
export const LETTERS: Record<string, MorseCode> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
  G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
  M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
};

/** Chiffres. */
export const DIGITS: Record<string, MorseCode> = {
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
};

/** Ponctuation et signes usuels en radiotélégraphie. */
export const PUNCTUATION: Record<string, MorseCode> = {
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
  '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
  ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
  '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
};

/**
 * Caractères accentués et étrangers normalisés par l'UIT. Ils sont fournis
 * pour le lexique mais restent hors des jeux d'entraînement par défaut :
 * on ne les rencontre pratiquement jamais en trafic radioamateur.
 */
export const EXTENDED: Record<string, MorseCode> = {
  'À': '.--.-', 'Ä': '.-.-', 'Å': '.--.-', 'Ç': '-.-..', 'È': '.-..-',
  'É': '..-..', 'Ñ': '--.--', 'Ö': '---.', 'Ü': '..--',
};

/** Signaux de procédure, émis d'un seul tenant sans espace interne. */
export const PROSIGNS: Prosign[] = [
  { name: 'AR', code: '.-.-.', meaning: "Fin de message" },
  { name: 'AS', code: '.-...', meaning: "Patientez" },
  { name: 'BT', code: '-...-', meaning: "Séparateur de paragraphe" },
  { name: 'KN', code: '-.--.', meaning: "À vous seulement" },
  { name: 'SK', code: '...-.-', meaning: "Fin de contact" },
  { name: 'CT', code: '-.-.-', meaning: "Début de transmission" },
  { name: 'SOS', code: '...---...', meaning: "Détresse" },
  { name: 'HH', code: '........', meaning: "Erreur, je recommence" },
];

/** Table complète caractère -> morse (accents inclus). */
export const CHAR_TO_MORSE: Record<string, MorseCode> = {
  ...LETTERS,
  ...DIGITS,
  ...PUNCTUATION,
  ...EXTENDED,
};

/**
 * Table inverse morse -> caractère. Deux caractères partagent parfois le même
 * code (`À` et `Å` valent tous deux `.--.-`) : la première clé rencontrée
 * gagne, ce qui privilégie les caractères les plus courants déclarés en amont.
 */
export const MORSE_TO_CHAR: Record<MorseCode, string> = (() => {
  const table: Record<MorseCode, string> = {};
  for (const [char, code] of Object.entries(CHAR_TO_MORSE)) {
    if (!(code in table)) table[code] = char;
  }
  return table;
})();

/** Normalise un caractère saisi pour la comparaison (majuscule, sans espace). */
export function normalizeChar(input: string): string {
  return input.trim().toUpperCase();
}

/** Renvoie le code morse d'un caractère, ou `null` s'il n'est pas codable. */
export function encodeChar(char: string): MorseCode | null {
  return CHAR_TO_MORSE[normalizeChar(char)] ?? null;
}

/** Renvoie le caractère correspondant à un code morse, ou `null`. */
export function decodeChar(code: MorseCode): string | null {
  return MORSE_TO_CHAR[code] ?? null;
}

/**
 * Encode un texte complet. Les caractères inconnus sont ignorés, les espaces
 * multiples sont réduits à un seul séparateur de mot (`/`).
 */
export function encodeText(text: string): string {
  return text
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      [...word]
        .map((c) => CHAR_TO_MORSE[c])
        .filter((code): code is string => Boolean(code))
        .join(' '),
    )
    .filter(Boolean)
    .join(' / ');
}

/** Décode une chaîne morse où les caractères sont séparés par des espaces. */
export function decodeText(morse: string): string {
  return morse
    .trim()
    .split(/\s*\/\s*|\s{3,}/)
    .map((word) =>
      word
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((code) => MORSE_TO_CHAR[code] ?? '?')
        .join(''),
    )
    .join(' ');
}

/**
 * Nettoie une saisie morse libre. L'utilisateur peut coller du texte venant de
 * n'importe où : points typographiques, tirets longs, séparateurs de mots
 * variés, retours à la ligne. Tout est ramène à la notation ASCII interne,
 * avec un espace entre caractères et ` / ` entre mots.
 */
export function normalizeMorseInput(input: string): string {
  return input
    .replace(/[·•‧∙]/g, '.')
    .replace(/[–—−‒_]/g, '-')
    .replace(/[|¦]/g, '/')
    .replace(/\s*\/+\s*/g, ' / ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Indique si une chaîne ne contient que des points et des traits. */
export function isValidCode(code: string): boolean {
  return /^[.-]+$/.test(code);
}

/**
 * Rend un code morse lisible à l'œil avec des symboles typographiques plus
 * larges que le point et le tiret ASCII, qui sont peu lisibles en petit corps.
 */
export function prettyCode(code: MorseCode): string {
  return [...code].map((c) => (c === '.' ? '·' : '–')).join(' ');
}

/**
 * Variante compacte, sans séparateur entre les signes : l'écartement est confié
 * à la typographie. Indispensable dans un bouton étroit, où l'espace fine de
 * `prettyCode` reste sécable et coupe le code en deux lignes.
 */
export function compactCode(code: MorseCode): string {
  return [...code].map((c) => (c === '.' ? '\u00b7' : '\u2013')).join('');
}

/** Nom parlé d'un code, utile pour la lecture à voix haute et l'accessibilité. */
export function spokenCode(code: MorseCode): string {
  return [...code].map((c) => (c === '.' ? 'ti' : 'taa')).join('-');
}
