/**
 * Vocabulaire d'entraînement.
 *
 * Le trafic en morse ne ressemble pas à du texte courant : il est fait
 * d'abréviations, de codes Q et d'indicatifs. S'entraîner dessus est bien plus
 * utile que de copier des mots du dictionnaire, et c'est aussi une façon
 * d'entrer dans la culture du mode télégraphique.
 */

export interface VocabularyEntry {
  text: string;
  meaning: string;
}

export interface VocabularySet {
  id: string;
  label: string;
  description: string;
  entries: VocabularyEntry[];
}

/** Mots courts fréquents, pour passer du caractère isolé au mot. */
const COMMON_WORDS: VocabularyEntry[] = [
  { text: 'THE', meaning: 'Article défini anglais, le mot le plus fréquent en trafic' },
  { text: 'AND', meaning: 'Et' },
  { text: 'YOU', meaning: 'Vous' },
  { text: 'ARE', meaning: 'Êtes' },
  { text: 'NOT', meaning: 'Ne pas' },
  { text: 'FOR', meaning: 'Pour' },
  { text: 'WITH', meaning: 'Avec' },
  { text: 'THIS', meaning: 'Ceci' },
  { text: 'HAVE', meaning: 'Avoir' },
  { text: 'FROM', meaning: 'De, depuis' },
  { text: 'GOOD', meaning: 'Bon' },
  { text: 'TIME', meaning: 'Temps, heure' },
  { text: 'WORK', meaning: 'Travail, fonctionne' },
  { text: 'BEST', meaning: 'Meilleur' },
  { text: 'CALL', meaning: 'Appel, indicatif' },
  { text: 'BAND', meaning: 'Bande de fréquences' },
  { text: 'RADIO', meaning: 'Radio' },
  { text: 'SIGNAL', meaning: 'Signal' },
  { text: 'STATION', meaning: 'Station' },
  { text: 'ANTENNA', meaning: 'Antenne' },
];

/** Codes Q, langage international de la radiotélégraphie. */
const Q_CODES: VocabularyEntry[] = [
  { text: 'QTH', meaning: 'Ma position est / quelle est votre position ?' },
  { text: 'QRZ', meaning: 'Qui m’appelle ?' },
  { text: 'QSL', meaning: 'J’accuse réception / accusez réception' },
  { text: 'QSO', meaning: 'Contact, liaison radio' },
  { text: 'QRM', meaning: 'Brouillage par d’autres stations' },
  { text: 'QRN', meaning: 'Brouillage atmosphérique, parasites' },
  { text: 'QSB', meaning: 'Le signal s’évanouit (fading)' },
  { text: 'QRT', meaning: 'Je cesse l’émission' },
  { text: 'QRV', meaning: 'Je suis prêt' },
  { text: 'QRX', meaning: 'Attendez, je vous rappelle' },
  { text: 'QSY', meaning: 'Changez de fréquence' },
  { text: 'QRP', meaning: 'Faible puissance' },
  { text: 'QRO', meaning: 'Forte puissance' },
  { text: 'QRS', meaning: 'Transmettez plus lentement' },
  { text: 'QRQ', meaning: 'Transmettez plus vite' },
  { text: 'QTR', meaning: 'Heure exacte' },
];

/** Abréviations télégraphiques usuelles. */
const ABBREVIATIONS: VocabularyEntry[] = [
  { text: 'CQ', meaning: 'Appel général à toutes les stations' },
  { text: 'DE', meaning: 'De la part de (précède l’indicatif de l’émetteur)' },
  { text: 'K', meaning: 'À vous' },
  { text: 'R', meaning: 'Reçu' },
  { text: 'TU', meaning: 'Merci (thank you)' },
  { text: '73', meaning: 'Cordiales salutations' },
  { text: '88', meaning: 'Baisers, salutations affectueuses' },
  { text: 'OM', meaning: 'Old man, l’opérateur' },
  { text: 'YL', meaning: 'Young lady, opératrice' },
  { text: 'RST', meaning: 'Compte rendu d’écoute : lisibilité, force, tonalité' },
  { text: 'WX', meaning: 'Météo' },
  { text: 'PSE', meaning: 'S’il vous plaît (please)' },
  { text: 'TNX', meaning: 'Merci (thanks)' },
  { text: 'ES', meaning: 'Et' },
  { text: 'BK', meaning: 'Interruption, à vous immédiatement' },
  { text: 'AGN', meaning: 'De nouveau (again)' },
  { text: 'ANT', meaning: 'Antenne' },
  { text: 'RIG', meaning: 'Station, matériel' },
  { text: 'UR', meaning: 'Votre (your)' },
  { text: 'HR', meaning: 'Ici (here)' },
  { text: 'NW', meaning: 'Maintenant (now)' },
  { text: 'FB', meaning: 'Excellent (fine business)' },
  { text: 'CUL', meaning: 'À bientôt (see you later)' },
  { text: 'DX', meaning: 'Station lointaine' },
  { text: 'GM', meaning: 'Bonjour (good morning)' },
  { text: 'GE', meaning: 'Bonsoir (good evening)' },
];

/** Chiffres et groupes chiffres, souvent le point faible des débutants. */
const NUMBERS: VocabularyEntry[] = [
  { text: '599', meaning: 'Report parfait en télégraphie' },
  { text: '579', meaning: 'Report d’écoute courant' },
  { text: '73', meaning: 'Cordiales salutations' },
  { text: '2025', meaning: 'Groupe de quatre chiffres' },
  { text: '144', meaning: 'Bande 2 mètrès, en MHz' },
  { text: '1200', meaning: 'Heure UTC' },
  { text: '3573', meaning: 'Fréquence en kHz' },
  { text: '14060', meaning: 'Fréquence QRP en kHz' },
];

/** Préfixes réels utilisés pour fabriquer des indicatifs plausibles. */
const CALLSIGN_PREFIXES = [
  'F', 'F5', 'F6', 'F8', 'TM', 'ON', 'HB9', 'DL', 'DK', 'G', 'M0', 'GW',
  'EA', 'EA3', 'I', 'IK2', 'PA', 'PA3', 'OK1', 'SP', 'SM', 'LA', 'OH',
  'K', 'W1', 'N2', 'KC4', 'VE3', 'VK2', 'JA1', 'ZL1', 'PY2', 'LU', 'VU2',
];

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)] as T;

/**
 * Fabrique un indicatif plausible. Les indicatifs sont le contenu le plus
 * difficile à copier : ils mélangent lettres et chiffres sans redondance
 * linguistique, donc aucune anticipation n'est possible.
 */
export function randomCallsign(): string {
  const prefix = pick(CALLSIGN_PREFIXES);
  const digit = /\d/.test(prefix) ? '' : `${Math.floor(Math.random() * 10)}`;
  const suffixLength = 1 + Math.floor(Math.random() * 3);
  let suffix = '';
  for (let i = 0; i < suffixLength; i += 1) suffix += pick([...LETTERS]);
  return `${prefix}${digit}${suffix}`;
}

/** Fabrique un groupe aléatoire de lettres et de chiffres. */
export function randomGroup(length = 5): string {
  const alphabet = `${LETTERS}0123456789`;
  let out = '';
  for (let i = 0; i < length; i += 1) out += pick([...alphabet]);
  return out;
}

export const VOCABULARY_SETS: VocabularySet[] = [
  {
    id: 'abbreviations',
    label: 'Abréviations',
    description: "Le vocabulaire de base d'un contact en télégraphie.",
    entries: ABBREVIATIONS,
  },
  {
    id: 'qcodes',
    label: 'Codes Q',
    description: 'Le langage international de la radiotélégraphie, en trois lettres.',
    entries: Q_CODES,
  },
  {
    id: 'words',
    label: 'Mots courants',
    description: 'Mots courts fréquents, pour apprendre à copier des groupes de lettres.',
    entries: COMMON_WORDS,
  },
  {
    id: 'numbers',
    label: 'Chiffres',
    description: "Reports, fréquences et heures : là où la plupart des opérateurs trébuchent.",
    entries: NUMBERS,
  },
  {
    id: 'callsigns',
    label: 'Indicatifs',
    description: 'Indicatifs générés à la volée. Aucun contexte pour deviner : la copie doit être exacte.',
    entries: [],
  },
  {
    id: 'groups',
    label: 'Groupes aléatoires',
    description: "L'exercice le plus exigeant : cinq caractères sans aucune logique.",
    entries: [],
  },
];

/** Tire un item du jeu demande, en générant à la volée si nécessaire. */
export function drawVocabulary(setId: string): VocabularyEntry {
  if (setId === 'callsigns') {
    return { text: randomCallsign(), meaning: 'Indicatif généré aléatoirement' };
  }
  if (setId === 'groups') {
    return { text: randomGroup(5), meaning: 'Groupe aléatoire de cinq caractères' };
  }
  const set = VOCABULARY_SETS.find((candidate) => candidate.id === setId);
  const entries = set?.entries ?? COMMON_WORDS;
  return pick(entries.length > 0 ? entries : COMMON_WORDS);
}
