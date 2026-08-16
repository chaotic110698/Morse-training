/**
 * Vocabulaire d'entrainement.
 *
 * Le trafic en morse ne ressemble pas a du texte courant : il est fait
 * d'abreviations, de codes Q et d'indicatifs. S'entrainer dessus est bien plus
 * utile que de copier des mots du dictionnaire, et c'est aussi une facon
 * d'entrer dans la culture du mode telegraphique.
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

/** Mots courts frequents, pour passer du caractere isole au mot. */
const COMMON_WORDS: VocabularyEntry[] = [
  { text: 'THE', meaning: 'Article defini anglais, le mot le plus frequent en trafic' },
  { text: 'AND', meaning: 'Et' },
  { text: 'YOU', meaning: 'Vous' },
  { text: 'ARE', meaning: 'Etes' },
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
  { text: 'BAND', meaning: 'Bande de frequences' },
  { text: 'RADIO', meaning: 'Radio' },
  { text: 'SIGNAL', meaning: 'Signal' },
  { text: 'STATION', meaning: 'Station' },
  { text: 'ANTENNA', meaning: 'Antenne' },
];

/** Codes Q, langage international de la radiotelegraphie. */
const Q_CODES: VocabularyEntry[] = [
  { text: 'QTH', meaning: 'Ma position est / quelle est votre position ?' },
  { text: 'QRZ', meaning: 'Qui m’appelle ?' },
  { text: 'QSL', meaning: 'J’accuse reception / accusez reception' },
  { text: 'QSO', meaning: 'Contact, liaison radio' },
  { text: 'QRM', meaning: 'Brouillage par d’autres stations' },
  { text: 'QRN', meaning: 'Brouillage atmospherique, parasites' },
  { text: 'QSB', meaning: 'Le signal s’evanouit (fading)' },
  { text: 'QRT', meaning: 'Je cesse l’emission' },
  { text: 'QRV', meaning: 'Je suis pret' },
  { text: 'QRX', meaning: 'Attendez, je vous rappelle' },
  { text: 'QSY', meaning: 'Changez de frequence' },
  { text: 'QRP', meaning: 'Faible puissance' },
  { text: 'QRO', meaning: 'Forte puissance' },
  { text: 'QRS', meaning: 'Transmettez plus lentement' },
  { text: 'QRQ', meaning: 'Transmettez plus vite' },
  { text: 'QTR', meaning: 'Heure exacte' },
];

/** Abreviations telegraphiques usuelles. */
const ABBREVIATIONS: VocabularyEntry[] = [
  { text: 'CQ', meaning: 'Appel general a toutes les stations' },
  { text: 'DE', meaning: 'De la part de (precede l’indicatif de l’emetteur)' },
  { text: 'K', meaning: 'A vous' },
  { text: 'R', meaning: 'Recu' },
  { text: 'TU', meaning: 'Merci (thank you)' },
  { text: '73', meaning: 'Cordiales salutations' },
  { text: '88', meaning: 'Baisers, salutations affectueuses' },
  { text: 'OM', meaning: 'Old man, l’operateur' },
  { text: 'YL', meaning: 'Young lady, operatrice' },
  { text: 'RST', meaning: 'Compte rendu d’ecoute : lisibilite, force, tonalite' },
  { text: 'WX', meaning: 'Meteo' },
  { text: 'PSE', meaning: 'S’il vous plait (please)' },
  { text: 'TNX', meaning: 'Merci (thanks)' },
  { text: 'ES', meaning: 'Et' },
  { text: 'BK', meaning: 'Interruption, a vous immediatement' },
  { text: 'AGN', meaning: 'De nouveau (again)' },
  { text: 'ANT', meaning: 'Antenne' },
  { text: 'RIG', meaning: 'Station, materiel' },
  { text: 'UR', meaning: 'Votre (your)' },
  { text: 'HR', meaning: 'Ici (here)' },
  { text: 'NW', meaning: 'Maintenant (now)' },
  { text: 'FB', meaning: 'Excellent (fine business)' },
  { text: 'CUL', meaning: 'A bientot (see you later)' },
  { text: 'DX', meaning: 'Station lointaine' },
  { text: 'GM', meaning: 'Bonjour (good morning)' },
  { text: 'GE', meaning: 'Bonsoir (good evening)' },
];

/** Chiffres et groupes chiffres, souvent le point faible des debutants. */
const NUMBERS: VocabularyEntry[] = [
  { text: '599', meaning: 'Report parfait en telegraphie' },
  { text: '579', meaning: 'Report d’ecoute courant' },
  { text: '73', meaning: 'Cordiales salutations' },
  { text: '2025', meaning: 'Groupe de quatre chiffres' },
  { text: '144', meaning: 'Bande 2 metres, en MHz' },
  { text: '1200', meaning: 'Heure UTC' },
  { text: '3573', meaning: 'Frequence en kHz' },
  { text: '14060', meaning: 'Frequence QRP en kHz' },
];

/** Prefixes reels utilises pour fabriquer des indicatifs plausibles. */
const CALLSIGN_PREFIXES = [
  'F', 'F5', 'F6', 'F8', 'TM', 'ON', 'HB9', 'DL', 'DK', 'G', 'M0', 'GW',
  'EA', 'EA3', 'I', 'IK2', 'PA', 'PA3', 'OK1', 'SP', 'SM', 'LA', 'OH',
  'K', 'W1', 'N2', 'KC4', 'VE3', 'VK2', 'JA1', 'ZL1', 'PY2', 'LU', 'VU2',
];

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)] as T;

/**
 * Fabrique un indicatif plausible. Les indicatifs sont le contenu le plus
 * difficile a copier : ils melangent lettres et chiffres sans redondance
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

/** Fabrique un groupe aleatoire de lettres et de chiffres. */
export function randomGroup(length = 5): string {
  const alphabet = `${LETTERS}0123456789`;
  let out = '';
  for (let i = 0; i < length; i += 1) out += pick([...alphabet]);
  return out;
}

export const VOCABULARY_SETS: VocabularySet[] = [
  {
    id: 'abbreviations',
    label: 'Abreviations',
    description: "Le vocabulaire de base d'un contact en telegraphie.",
    entries: ABBREVIATIONS,
  },
  {
    id: 'qcodes',
    label: 'Codes Q',
    description: 'Le langage international de la radiotelegraphie, en trois lettres.',
    entries: Q_CODES,
  },
  {
    id: 'words',
    label: 'Mots courants',
    description: 'Mots courts frequents, pour apprendre a copier des groupes de lettres.',
    entries: COMMON_WORDS,
  },
  {
    id: 'numbers',
    label: 'Chiffres',
    description: "Reports, frequences et heures : la ou la plupart des operateurs trebuchent.",
    entries: NUMBERS,
  },
  {
    id: 'callsigns',
    label: 'Indicatifs',
    description: 'Indicatifs generes a la volee. Aucun contexte pour deviner : la copie doit etre exacte.',
    entries: [],
  },
  {
    id: 'groups',
    label: 'Groupes aleatoires',
    description: "L'exercice le plus exigeant : cinq caracteres sans aucune logique.",
    entries: [],
  },
];

/** Tire un item du jeu demande, en generant a la volee si necessaire. */
export function drawVocabulary(setId: string): VocabularyEntry {
  if (setId === 'callsigns') {
    return { text: randomCallsign(), meaning: 'Indicatif genere aleatoirement' };
  }
  if (setId === 'groups') {
    return { text: randomGroup(5), meaning: 'Groupe aleatoire de cinq caracteres' };
  }
  const set = VOCABULARY_SETS.find((candidate) => candidate.id === setId);
  const entries = set?.entries ?? COMMON_WORDS;
  return pick(entries.length > 0 ? entries : COMMON_WORDS);
}
