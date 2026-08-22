/**
 * Alphabet radiotéléphonique international, dit « alphabet OTAN ».
 *
 * Son nom officiel est l'alphabet d'épellation radiotéléphonique
 * international ; l'OACI l'a adopté pour l'aviation civile et l'OTAN pour les
 * usages militaires, d'où les deux appellations courantes. Il complète le morse
 * plutôt qu'il ne le remplace : le morse sert quand le signal est trop faible
 * pour la voix, l'épellation quand la voix passe mais reste ambiguë.
 *
 * La prononciation donnée ici est transcrite pour un lecteur francophone, ce
 * qui est plus utile que la transcription anglaise officielle : « CHAR-lee »
 * n'aide personne en France, « TCHAR-li » si.
 */

export interface PhoneticEntry {
  /** Lettre ou chiffre représenté. */
  symbol: string;
  /** Mot d'épellation. */
  word: string;
  /** Prononciation transcrite pour un francophone. */
  say: string;
  /** Remarque, lorsque le mot a une particularité. */
  note?: string;
}

export const PHONETIC_LETTERS: PhoneticEntry[] = [
  { symbol: 'A', word: 'Alfa', say: 'AL-fa', note: "Écrit « Alfa » et non « Alpha » : le groupe « ph » ne se lit pas /f/ dans toutes les langues." },
  { symbol: 'B', word: 'Bravo', say: 'BRA-vo' },
  { symbol: 'C', word: 'Charlie', say: 'TCHAR-li' },
  { symbol: 'D', word: 'Delta', say: 'DEL-ta' },
  { symbol: 'E', word: 'Echo', say: 'ÈK-o' },
  { symbol: 'F', word: 'Foxtrot', say: 'FOKS-trot' },
  { symbol: 'G', word: 'Golf', say: 'GOLF' },
  { symbol: 'H', word: 'Hotel', say: 'ho-TÈL' },
  { symbol: 'I', word: 'India', say: 'IN-di-a' },
  { symbol: 'J', word: 'Juliett', say: 'DJOU-li-ÈTT', note: "Deux « t » à dessein, pour qu’un francophone ne laisse pas tomber le t final." },
  { symbol: 'K', word: 'Kilo', say: 'KI-lo' },
  { symbol: 'L', word: 'Lima', say: 'LI-ma' },
  { symbol: 'M', word: 'Mike', say: 'MAÏK' },
  { symbol: 'N', word: 'November', say: 'no-VÈM-beur' },
  { symbol: 'O', word: 'Oscar', say: 'OSS-kar' },
  { symbol: 'P', word: 'Papa', say: 'pa-PA', note: "L’accent tombe sur la seconde syllabe." },
  { symbol: 'Q', word: 'Quebec', say: 'ké-BÈK' },
  { symbol: 'R', word: 'Romeo', say: 'RO-mi-o' },
  { symbol: 'S', word: 'Sierra', say: 'si-È-ra' },
  { symbol: 'T', word: 'Tango', say: 'TANG-go' },
  { symbol: 'U', word: 'Uniform', say: 'YOU-ni-form' },
  { symbol: 'V', word: 'Victor', say: 'VIK-tor' },
  { symbol: 'W', word: 'Whiskey', say: 'OUISS-ki' },
  { symbol: 'X', word: 'X-ray', say: 'ÈKS-RÉ' },
  { symbol: 'Y', word: 'Yankee', say: 'YANG-ki' },
  { symbol: 'Z', word: 'Zulu', say: 'ZOU-lou' },
];

/**
 * Chiffres. Quatre d'entre eux se prononcent volontairement de travers : la
 * déformation les rend distincts malgré une liaison radio médiocre. « Nine »
 * devient « niner » pour ne pas être confondu avec l'allemand « nein », et
 * « five » devient « fife » parce que le v final se perd dans le bruit.
 */
export const PHONETIC_DIGITS: PhoneticEntry[] = [
  { symbol: '0', word: 'Zero', say: 'ZI-RO' },
  { symbol: '1', word: 'One', say: 'OUANN' },
  { symbol: '2', word: 'Two', say: 'TOU' },
  { symbol: '3', word: 'Three', say: 'TRI', note: "Prononcé « tri » et non « thri » : le th anglais n’est pas universel." },
  { symbol: '4', word: 'Four', say: 'FO-eur' },
  { symbol: '5', word: 'Five', say: 'FAÏF', note: "Le v final disparaît dans le bruit : on le remplace par un f." },
  { symbol: '6', word: 'Six', say: 'SIKS' },
  { symbol: '7', word: 'Seven', say: 'SÈV-en' },
  { symbol: '8', word: 'Eight', say: 'ÈÏT' },
  { symbol: '9', word: 'Nine', say: 'NAÏ-neur', note: "Allongé en « niner » pour ne pas être confondu avec l’allemand « nein »." },
];

/**
 * Épellation française usuelle au téléphone. Sans statut officiel
 * international, elle reste d'un usage courant en France pour dicter un nom ou
 * une référence, et n'a rien à voir avec l'alphabet radio.
 */
export const FRENCH_SPELLING: Array<{ symbol: string; word: string }> = [
  { symbol: 'A', word: 'Anatole' }, { symbol: 'B', word: 'Berthe' },
  { symbol: 'C', word: 'Célestin' }, { symbol: 'D', word: 'Désiré' },
  { symbol: 'E', word: 'Eugène' }, { symbol: 'F', word: 'François' },
  { symbol: 'G', word: 'Gaston' }, { symbol: 'H', word: 'Henri' },
  { symbol: 'I', word: 'Irma' }, { symbol: 'J', word: 'Joseph' },
  { symbol: 'K', word: 'Kléber' }, { symbol: 'L', word: 'Louis' },
  { symbol: 'M', word: 'Marcel' }, { symbol: 'N', word: 'Nicolas' },
  { symbol: 'O', word: 'Oscar' }, { symbol: 'P', word: 'Pierre' },
  { symbol: 'Q', word: 'Quintal' }, { symbol: 'R', word: 'Raoul' },
  { symbol: 'S', word: 'Suzanne' }, { symbol: 'T', word: 'Thérèse' },
  { symbol: 'U', word: 'Ursule' }, { symbol: 'V', word: 'Victor' },
  { symbol: 'W', word: 'William' }, { symbol: 'X', word: 'Xavier' },
  { symbol: 'Y', word: 'Yvonne' }, { symbol: 'Z', word: 'Zoé' },
];

export const PHONETIC_ALL: PhoneticEntry[] = [...PHONETIC_LETTERS, ...PHONETIC_DIGITS];

/** Épelle un texte avec l'alphabet radio, en ignorant ce qui n'est pas codable. */
export function spellPhonetic(text: string): string {
  const table = new Map(PHONETIC_ALL.map((entry) => [entry.symbol, entry.word]));
  return [...text.toUpperCase()]
    .map((char) => (char === ' ' ? '/' : table.get(char)))
    .filter((word): word is string => Boolean(word))
    .join(' ');
}
