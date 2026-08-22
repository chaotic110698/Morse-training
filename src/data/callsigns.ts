/**
 * Indicatifs d'appel : structure, préfixes nationaux et génération d'exemples.
 *
 * Un indicatif identifie une station de façon unique dans le monde entier. Sa
 * structure suit partout le même schéma — un préfixe attribué au pays par
 * l'Union internationale des télécommunications, un chiffre, puis un suffixe de
 * une à quatre lettres — mais chaque administration l'applique à sa manière.
 */

export interface CallsignCountry {
  id: string;
  country: string;
  /** Préfixes utilisés pour la génération d'exemples. */
  prefixes: string[];
  /** Longueurs de suffixe possibles. */
  suffix: [number, number];
  note: string;
}

export const CALLSIGN_COUNTRIES: CallsignCountry[] = [
  {
    id: 'fr',
    country: 'France',
    prefixes: ['F1', 'F4', 'F5', 'F6', 'F8'],
    suffix: [2, 3],
    note:
      "Un F, un chiffre, puis deux ou trois lettres. Le chiffre garde la trace de l’ancienneté et de la classe historique de la licence : F5, F6 et F8 sont les plus anciennes, F4 celles délivrées aujourd’hui. Les stations temporaires d’un événement utilisent TM.",
  },
  {
    id: 'fr-om',
    country: 'France d’outre-mer et Corse',
    prefixes: ['FG', 'FH', 'FK', 'FM', 'FO', 'FP', 'FR', 'FS', 'FW', 'FY', 'TK'],
    suffix: [2, 3],
    note:
      "Chaque territoire a son préfixe : FG en Guadeloupe, FM en Martinique, FR à La Réunion, FY en Guyane, FK en Nouvelle-Calédonie, FO en Polynésie, FH à Mayotte, FP à Saint-Pierre-et-Miquelon, FS à Saint-Martin, FW à Wallis-et-Futuna, et TK en Corse. Ces préfixes sont très recherchés par les chasseurs de contacts lointains.",
  },
  {
    id: 'be',
    country: 'Belgique',
    prefixes: ['ON', 'OO', 'OP', 'OR', 'OS', 'OT'],
    suffix: [2, 3],
    note: "ON est le préfixe courant ; les autres séries en O servent aux stations spéciales et aux classes particulières.",
  },
  {
    id: 'ch',
    country: 'Suisse',
    prefixes: ['HB9', 'HB3'],
    suffix: [2, 3],
    note: "HB9 pour la licence complète, HB3 pour la licence d’entrée. HB0 désigne le Liechtenstein, pays voisin mais distinct.",
  },
  {
    id: 'de',
    country: 'Allemagne',
    prefixes: ['DL', 'DK', 'DJ', 'DG', 'DO', 'DB'],
    suffix: [2, 3],
    note: "Les séries en D se répartissent entre classes et époques : DL, DK et DJ sont historiques, DO correspond à la classe d’entrée.",
  },
  {
    id: 'gb',
    country: 'Royaume-Uni',
    prefixes: ['G', 'M', '2E'],
    suffix: [2, 3],
    note:
      "Une lettre s’insère après le préfixe pour désigner la nation : GM en Écosse, GW au pays de Galles, GI en Irlande du Nord, GD à l’île de Man, GJ à Jersey, GU à Guernesey. Un simple G ou M correspond à l’Angleterre.",
  },
  {
    id: 'es',
    country: 'Espagne',
    prefixes: ['EA', 'EB', 'EC'],
    suffix: [2, 3],
    note: "Le chiffre indique la région : EA1 dans le nord-ouest, EA3 en Catalogne, EA8 aux Canaries, EA9 à Ceuta et Melilla.",
  },
  {
    id: 'it',
    country: 'Italie',
    prefixes: ['I', 'IK', 'IZ', 'IW'],
    suffix: [2, 3],
    note: "Le chiffre situe la région ; IS désigne la Sardaigne et IT la Sicile, considérées comme des entités séparées en trafic.",
  },
  {
    id: 'us',
    country: 'États-Unis',
    prefixes: ['K', 'N', 'W', 'AA', 'KC', 'KD', 'WB'],
    suffix: [1, 3],
    note:
      "Le chiffre est le district d’appel, hérité d’un découpage géographique. Les indicatifs les plus courts — une lettre, un chiffre, une lettre — sont les plus prisés et se transmettent d’opérateur à opérateur.",
  },
  {
    id: 'ca',
    country: 'Canada',
    prefixes: ['VE', 'VA', 'VO', 'VY'],
    suffix: [2, 3],
    note: "Le chiffre désigne la province : VE2 au Québec, VE3 en Ontario, VE7 en Colombie-Britannique.",
  },
  {
    id: 'jp',
    country: 'Japon',
    prefixes: ['JA', 'JE', 'JF', 'JH', 'JR', '7K'],
    suffix: [2, 3],
    note: "Le Japon compte l’une des plus grandes populations de radioamateurs au monde, d’où la multiplication des séries en J.",
  },
  {
    id: 'au',
    country: 'Australie',
    prefixes: ['VK'],
    suffix: [2, 3],
    note: "Le chiffre désigne l’État : VK2 en Nouvelle-Galles du Sud, VK6 en Australie-Occidentale, VK0 pour les territoires antarctiques et insulaires.",
  },
  {
    id: 'br',
    country: 'Brésil',
    prefixes: ['PY', 'PU', 'PP', 'PT'],
    suffix: [2, 3],
    note: "PY pour la classe complète, PU pour la classe d’entrée. Le chiffre correspond à la région.",
  },
];

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)] as T;

export interface GeneratedCallsign {
  callsign: string;
  prefix: string;
  digit: string;
  suffix: string;
  country: string;
}

/**
 * Fabrique un indicatif plausible pour le pays demandé, sans chercher à savoir
 * s'il est réellement attribué : c'est un exemple, pas une identité.
 */
export function generateCallsign(countryId?: string): GeneratedCallsign {
  const entry =
    CALLSIGN_COUNTRIES.find((candidate) => candidate.id === countryId) ?? pick(CALLSIGN_COUNTRIES);
  const raw = pick(entry.prefixes);

  // Certains préfixes portent déjà leur chiffre, comme HB9 ou F5 ; les autres
  // en reçoivent un tiré au sort.
  const embedded = raw.match(/^([A-Z0-9]*?)(\d)$/);
  const prefix = embedded ? (embedded[1] as string) : raw;
  const digit = embedded ? (embedded[2] as string) : `${Math.floor(Math.random() * 10)}`;

  const [min, max] = entry.suffix;
  const length = min + Math.floor(Math.random() * (max - min + 1));
  let suffix = '';
  for (let i = 0; i < length; i += 1) suffix += pick([...LETTERS]);

  return { callsign: `${prefix}${digit}${suffix}`, prefix, digit, suffix, country: entry.country };
}

/** Suffixes de situation, ajoutés à l'indicatif par une barre oblique. */
export const CALLSIGN_MODIFIERS: Array<{ suffix: string; meaning: string }> = [
  { suffix: '/P', meaning: 'Portable : station transportée et installée ailleurs qu’au domicile.' },
  { suffix: '/M', meaning: 'Mobile : station en mouvement, typiquement en véhicule.' },
  { suffix: '/MM', meaning: 'Mobile maritime : à bord d’un navire.' },
  { suffix: '/AM', meaning: 'Mobile aéronautique : à bord d’un aéronef.' },
  { suffix: '/QRP', meaning: 'Faible puissance, généralement cinq watts ou moins.' },
];
