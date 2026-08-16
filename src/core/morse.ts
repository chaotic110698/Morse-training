/**
 * Tables du code morse international et conversions texte <-> morse.
 *
 * Le morse est note ici avec deux caracteres ASCII : `.` pour le point (dit)
 * et `-` pour le trait (dah). Les prosignes (signaux de procedure) sont des
 * suites de lettres emises sans espace inter-caractere ; ils sont declares a
 * part car ils n'ont pas de representation textuelle d'un seul caractere.
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

/** Ponctuation et signes usuels en radiotelegraphie. */
export const PUNCTUATION: Record<string, MorseCode> = {
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
  '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
  ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
  '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
};

/**
 * Caracteres accentues et etrangers normalises par l'UIT. Ils sont fournis
 * pour le lexique mais restent hors des jeux d'entrainement par defaut :
 * on ne les rencontre pratiquement jamais en trafic radioamateur.
 */
export const EXTENDED: Record<string, MorseCode> = {
  'À': '.--.-', 'Ä': '.-.-', 'Å': '.--.-', 'Ç': '-.-..', 'È': '.-..-',
  'É': '..-..', 'Ñ': '--.--', 'Ö': '---.', 'Ü': '..--',
};

/** Signaux de procedure, emis d'un seul tenant sans espace interne. */
export const PROSIGNS: Prosign[] = [
  { name: 'AR', code: '.-.-.', meaning: "Fin de message" },
  { name: 'AS', code: '.-...', meaning: "Patientez" },
  { name: 'BT', code: '-...-', meaning: "Separateur de paragraphe" },
  { name: 'KN', code: '-.--.', meaning: "A vous seulement" },
  { name: 'SK', code: '...-.-', meaning: "Fin de contact" },
  { name: 'CT', code: '-.-.-', meaning: "Debut de transmission" },
  { name: 'SOS', code: '...---...', meaning: "Detresse" },
  { name: 'HH', code: '........', meaning: "Erreur, je recommence" },
];

/** Table complete caractere -> morse (accents inclus). */
export const CHAR_TO_MORSE: Record<string, MorseCode> = {
  ...LETTERS,
  ...DIGITS,
  ...PUNCTUATION,
  ...EXTENDED,
};

/**
 * Table inverse morse -> caractere. Deux caracteres partagent parfois le meme
 * code (`À` et `Å` valent tous deux `.--.-`) : la premiere cle rencontree
 * gagne, ce qui privilegie les caracteres les plus courants declares en amont.
 */
export const MORSE_TO_CHAR: Record<MorseCode, string> = (() => {
  const table: Record<MorseCode, string> = {};
  for (const [char, code] of Object.entries(CHAR_TO_MORSE)) {
    if (!(code in table)) table[code] = char;
  }
  return table;
})();

/** Normalise un caractere saisi pour la comparaison (majuscule, sans espace). */
export function normalizeChar(input: string): string {
  return input.trim().toUpperCase();
}

/** Renvoie le code morse d'un caractere, ou `null` s'il n'est pas codable. */
export function encodeChar(char: string): MorseCode | null {
  return CHAR_TO_MORSE[normalizeChar(char)] ?? null;
}

/** Renvoie le caractere correspondant a un code morse, ou `null`. */
export function decodeChar(code: MorseCode): string | null {
  return MORSE_TO_CHAR[code] ?? null;
}

/**
 * Encode un texte complet. Les caracteres inconnus sont ignores, les espaces
 * multiples sont reduits a un seul separateur de mot (`/`).
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

/** Decode une chaine morse ou les caracteres sont separes par des espaces. */
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

/** Indique si une chaine ne contient que des points et des traits. */
export function isValidCode(code: string): boolean {
  return /^[.-]+$/.test(code);
}

/**
 * Rend un code morse lisible a l'oeil avec des symboles typographiques plus
 * larges que le point et le tiret ASCII, qui sont peu lisibles en petit corps.
 */
export function prettyCode(code: MorseCode): string {
  return [...code].map((c) => (c === '.' ? '·' : '–')).join(' ');
}

/** Nom parle d'un code, utile pour la lecture a voix haute et l'accessibilite. */
export function spokenCode(code: MorseCode): string {
  return [...code].map((c) => (c === '.' ? 'ti' : 'taa')).join('-');
}
