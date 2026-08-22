/**
 * Bandes radioamateur, telles qu'allouées en région 1 de l'Union
 * internationale des télécommunications — Europe, Afrique, Moyen-Orient et
 * Russie d'Europe.
 *
 * Chaque bande porte deux informations de nature différente. Son caractère
 * décrit ce qu'on y entend et sert aux pages de découverte. Ses segments
 * portent le statut réglementaire, qui décide des priorités vis-à-vis des
 * autres services et fait l'objet de questions d'examen : une bande n'a pas
 * toujours le même statut sur toute sa largeur, d'où le découpage.
 *
 * Ces plans varient d'un pays à l'autre et évoluent : ils donnent l'ordre de
 * grandeur et la logique d'ensemble, ils ne remplacent pas le texte en vigueur
 * publié par l'administration nationale, seul opposable.
 */

/**
 * Statut d'attribution, au sens du Règlement des radiocommunications.
 *
 * A — primaire, en général exclusif au service amateur.
 * B — primaire partagé à égalité de droits avec d'autres services primaires.
 * C — secondaire : ne pas brouiller les services primaires, et aucune
 *     protection à attendre de leur part.
 * D — secondaire au sens du RR, mais primaire au titre du tableau national.
 */
export type BandStatus = 'A' | 'B' | 'C' | 'D';

export interface BandSegment {
  from: number;
  to: number;
  status: BandStatus;
}

export interface Band {
  /** Nom d'usage, donné par la longueur d'onde. */
  name: string;
  /** Bornes en kilohertz, enveloppe de tous les segments. */
  from: number;
  to: number;
  /** Domaine spectral. */
  domain: 'LF' | 'MF' | 'HF' | 'VHF' | 'UHF' | 'SHF' | 'EHF';
  /** Découpage réglementaire ; une seule entrée quand le statut est uniforme. */
  segments: BandSegment[];
  /** Portion basse réservée à la télégraphie, en kilohertz. */
  cw?: [number, number];
  /** Portion ouverte au service d'amateur par satellite, en kilohertz. */
  satellite?: [number, number];
  /** Puissance maximale en watts PIRE, quand la bande y déroge. */
  eirpWatts?: number;
  character: string;
}

/** Raccourci : la grande majorité des bandes n'a qu'un seul statut. */
const uniform = (from: number, to: number, status: BandStatus): BandSegment[] => [{ from, to, status }];

export const BANDS: Band[] = [
  { name: '2200 m', from: 135.7, to: 137.8, domain: 'LF',
    segments: uniform(135.7, 137.8, 'C'), eirpWatts: 1,
    character: "Une bande minuscule et très difficile, où quelques dizaines de hertz suffisent à tout un pays d’opérateurs. Télégraphie et modes lents uniquement." },
  { name: '630 m', from: 472, to: 479, domain: 'MF',
    segments: uniform(472, 479, 'C'), eirpWatts: 1,
    character: "Sept kilohertz en tout. Portée surtout nocturne, antennes énormes ou très inefficaces : une bande d’expérimentateurs." },
  { name: '160 m', from: 1810, to: 1850, domain: 'MF', cw: [1810, 1838],
    segments: uniform(1810, 1850, 'A'),
    character: "La bande du soir et de l’hiver. Portée régionale de jour, continentale la nuit. Elle demande de grandes antennes et récompense la patience." },
  { name: '80 m', from: 3500, to: 3800, domain: 'HF', cw: [3500, 3580],
    segments: uniform(3500, 3800, 'B'),
    character: "Régionale de jour, nationale et européenne la nuit. C’est la bande des liaisons du soir et des réseaux entre amis." },
  { name: '60 m', from: 5351.5, to: 5366.5, domain: 'HF',
    segments: uniform(5351.5, 5366.5, 'C'), eirpWatts: 15,
    character: "Une bande étroite et récente, intermédiaire entre 80 et 40 mètres, souvent utilisable quand ni l’une ni l’autre ne passe." },
  { name: '40 m', from: 7000, to: 7200, domain: 'HF', cw: [7000, 7040], satellite: [7000, 7100],
    segments: uniform(7000, 7200, 'A'),
    character: "La bande à tout faire. Europe de jour, monde entier la nuit, ouverte à peu près en permanence quel que soit le cycle solaire. Le meilleur point de départ." },
  { name: '30 m', from: 10100, to: 10150, domain: 'HF', cw: [10100, 10150],
    segments: uniform(10100, 10150, 'C'),
    character: "Réservée à la télégraphie et aux modes numériques : ni voix, ni concours. Une bande calme, remarquablement stable, idéale pour le morse." },
  { name: '20 m', from: 14000, to: 14350, domain: 'HF', cw: [14000, 14070], satellite: [14000, 14250],
    segments: uniform(14000, 14350, 'A'),
    character: "La bande du trafic lointain par excellence. Ouverte presque tous les jours vers un point ou un autre du globe, c’est là qu’on entend le plus de pays." },
  { name: '17 m', from: 18068, to: 18168, domain: 'HF', cw: [18068, 18095], satellite: [18068, 18168],
    segments: uniform(18068, 18168, 'A'),
    character: "Étroite, sans concours autorisés, donc paisible. Elle se comporte comme une version plus calme du 20 mètres." },
  { name: '15 m', from: 21000, to: 21450, domain: 'HF', cw: [21000, 21070], satellite: [21000, 21450],
    segments: uniform(21000, 21450, 'A'),
    character: "Excellente quand l’activité solaire est forte, silencieuse quand elle est faible. Liaisons transcontinentales de jour." },
  { name: '12 m', from: 24890, to: 24990, domain: 'HF', cw: [24890, 24915], satellite: [24890, 24990],
    segments: uniform(24890, 24990, 'A'),
    character: "Comme le 10 mètres, mais plus étroite et sans concours. Ouverte surtout au sommet du cycle solaire." },
  { name: '10 m', from: 28000, to: 29700, domain: 'HF', cw: [28000, 28070], satellite: [28000, 29700],
    segments: uniform(28000, 29700, 'A'),
    character: "Spectaculaire au maximum solaire : quelques watts suffisent alors à traverser un océan. Presque muette au minimum." },
  { name: '6 m', from: 50000, to: 52000, domain: 'VHF',
    segments: uniform(50000, 52000, 'C'),
    character: "La « bande magique ». Habituellement locale, elle s’ouvre soudainement sur des milliers de kilomètres, quelques heures durant, par propagation sporadique." },
  { name: '2 m', from: 144000, to: 146000, domain: 'VHF', satellite: [144000, 146000],
    segments: uniform(144000, 146000, 'A'),
    character: "La bande locale par excellence : contacts directs à portée optique, relais, satellites. Le point d’entrée habituel des nouveaux licenciés, et la seule ouverte à l’ancienne classe 3." },
  { name: '70 cm', from: 430000, to: 440000, domain: 'UHF', satellite: [435000, 438000],
    segments: [{ from: 430000, to: 434000, status: 'C' }, { from: 434000, to: 440000, status: 'B' }],
    character: "Locale elle aussi, avec des antennes compactes. Beaucoup de relais, de liaisons numériques et d’expérimentation." },
  { name: '23 cm', from: 1240000, to: 1300000, domain: 'UHF', satellite: [1240000, 1300000],
    segments: uniform(1240000, 1300000, 'C'),
    character: "Hyperfréquences accessibles : antennes paraboliques de petite taille, réflexion sur la Lune, trafic par satellite. Le voisinage de Galileo y impose des précautions." },
  { name: '13 cm', from: 2300000, to: 2450000, domain: 'SHF', satellite: [2400000, 2450000],
    segments: uniform(2300000, 2450000, 'C'),
    character: "Partagée avec le Wi-Fi et les fours à micro-ondes. Trafic par satellite et expérimentation à courte distance." },
  { name: '6 cm', from: 5650000, to: 5850000, domain: 'SHF', satellite: [5650000, 5725000],
    segments: uniform(5650000, 5850000, 'C'),
    character: "Deux cents mégahertz de large : de quoi expérimenter des modes très larges, avec des antennes de quelques centimètres." },
  { name: '3 cm', from: 10000000, to: 10500000, domain: 'SHF', satellite: [10450000, 10500000],
    segments: [{ from: 10000000, to: 10450000, status: 'C' }, { from: 10450000, to: 10500000, status: 'D' }],
    character: "La bande des liaisons en visibilité directe à très grande distance, de sommet à sommet, avec de petites paraboles." },
  { name: '1,2 cm', from: 24000000, to: 24250000, domain: 'SHF', satellite: [24000000, 24050000],
    segments: [{ from: 24000000, to: 24050000, status: 'A' }, { from: 24050000, to: 24250000, status: 'C' }],
    character: "L’absorption par la vapeur d’eau devient sensible : la portée dépend de la météo autant que du matériel." },
  { name: '6 mm', from: 47000000, to: 47200000, domain: 'EHF', satellite: [47000000, 47200000],
    segments: uniform(47000000, 47200000, 'A'),
    character: "Domaine des constructeurs : rien ne s’achète tout fait, tout se fabrique." },
  { name: '4 mm', from: 76000000, to: 81500000, domain: 'EHF', satellite: [76000000, 81500000],
    segments: [
      { from: 76000000, to: 77500000, status: 'C' },
      { from: 77500000, to: 78000000, status: 'A' },
      { from: 78000000, to: 81500000, status: 'C' },
    ],
    character: "Voisine des radars anticollision automobiles, avec lesquels elle partage le spectre." },
  { name: '2,4 mm', from: 122250000, to: 123000000, domain: 'EHF',
    segments: uniform(122250000, 123000000, 'C'),
    character: "Aux confins des ondes millimétriques, à la frontière de l’optique." },
  { name: '2 mm', from: 134000000, to: 141000000, domain: 'EHF', satellite: [134000000, 141000000],
    segments: [{ from: 134000000, to: 136000000, status: 'A' }, { from: 136000000, to: 141000000, status: 'C' }],
    character: "Sept gigahertz de large, pour une poignée d’expérimentateurs dans le monde." },
  { name: '1,2 mm', from: 241000000, to: 250000000, domain: 'EHF', satellite: [241000000, 248000000],
    segments: [{ from: 241000000, to: 248000000, status: 'C' }, { from: 248000000, to: 250000000, status: 'A' }],
    character: "La dernière bande attribuée : au-delà, l’UIT n’attribue plus rien et l’on entre dans l’infrarouge lointain." },
];

export const DOMAIN_LABELS: Record<Band['domain'], string> = {
  LF: 'Basses fréquences',
  MF: 'Moyennes fréquences',
  HF: 'Décamétriques',
  VHF: 'Très hautes fréquences',
  UHF: 'Ultra hautes fréquences',
  SHF: 'Fréquences supra-hautes',
  EHF: 'Fréquences extrêmement hautes',
};

export const STATUS_LABELS: Record<BandStatus, string> = {
  A: 'Primaire',
  B: 'Primaire partagé',
  C: 'Secondaire',
  D: 'Secondaire, primaire au plan national',
};

export const STATUS_NOTES: Record<BandStatus, string> = {
  A: "Attribution à titre primaire, en règle générale exclusive au service amateur. C’est le statut le plus protecteur.",
  B: "Attribution à titre primaire, partagée à égalité de droits avec d’autres services primaires : ne pas les brouiller, et n’attendre d’eux aucune protection. Quatre bandes seulement ont ce statut.",
  C: "Attribution à titre secondaire : ne pas brouiller les services primaires, et n’attendre d’eux aucune protection. En revanche, protection contre les autres services secondaires.",
  D: "Secondaire au sens du Règlement des radiocommunications, mais primaire au titre du tableau national. Le service étranger de radiolocalisation reste prioritaire.",
};

/** Longueur d'onde en mètres, à partir d'une fréquence en kilohertz. */
export function wavelength(kHz: number): number {
  return kHz > 0 ? 299792.458 / kHz : 0;
}

/** Bande radioamateur contenant cette fréquence, s'il y en a une. */
export function bandFor(kHz: number): Band | null {
  return BANDS.find((band) => kHz >= band.from && kHz <= band.to) ?? null;
}

/** Statut réglementaire à cette fréquence précise, s'il y en a un. */
export function statusFor(kHz: number): BandStatus | null {
  const band = bandFor(kHz);
  return band?.segments.find((s) => kHz >= s.from && kHz <= s.to)?.status ?? null;
}

/** Vrai si la fréquence tombe dans la portion télégraphie de sa bande. */
export function isCwSegment(kHz: number): boolean {
  const band = bandFor(kHz);
  if (!band?.cw) return false;
  return kHz >= band.cw[0] && kHz <= band.cw[1];
}

/** Largeur d'une bande, en kilohertz. */
export function bandWidth(band: Band): number {
  return band.to - band.from;
}
