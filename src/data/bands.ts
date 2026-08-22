/**
 * Bandes radioamateur, telles qu'allouées en région 1 de l'Union
 * internationale des télécommunications — Europe, Afrique, Moyen-Orient et
 * Russie d'Europe.
 *
 * Ces plans varient d'un pays à l'autre et évoluent : ils donnent l'ordre de
 * grandeur et la logique d'ensemble, ils ne remplacent pas le texte en vigueur
 * publié par l'administration nationale, seul opposable.
 */

export interface Band {
  /** Nom d'usage, donné par la longueur d'onde. */
  name: string;
  /** Bornes en kilohertz. */
  from: number;
  to: number;
  /** Domaine spectral. */
  domain: 'LF' | 'MF' | 'HF' | 'VHF' | 'UHF';
  /** Portion basse réservée à la télégraphie, en kilohertz. */
  cw?: [number, number];
  character: string;
}

export const BANDS: Band[] = [
  { name: '2200 m', from: 135.7, to: 137.8, domain: 'LF',
    character: "Une bande minuscule et très difficile, où quelques dizaines de hertz suffisent à tout un pays d’opérateurs. Télégraphie et modes lents uniquement." },
  { name: '630 m', from: 472, to: 479, domain: 'MF',
    character: "Sept kilohertz en tout. Portée surtout nocturne, antennes énormes ou très inefficaces : une bande d’expérimentateurs." },
  { name: '160 m', from: 1810, to: 1850, domain: 'MF', cw: [1810, 1838],
    character: "La bande du soir et de l’hiver. Portée régionale de jour, continentale la nuit. Elle demande de grandes antennes et récompense la patience." },
  { name: '80 m', from: 3500, to: 3800, domain: 'HF', cw: [3500, 3580],
    character: "Régionale de jour, nationale et européenne la nuit. C’est la bande des liaisons du soir et des réseaux entre amis." },
  { name: '60 m', from: 5351.5, to: 5366.5, domain: 'HF',
    character: "Une bande étroite et récente, intermédiaire entre 80 et 40 mètres, souvent utilisable quand ni l’une ni l’autre ne passe." },
  { name: '40 m', from: 7000, to: 7200, domain: 'HF', cw: [7000, 7040],
    character: "La bande à tout faire. Europe de jour, monde entier la nuit, ouverte à peu près en permanence quel que soit le cycle solaire. Le meilleur point de départ." },
  { name: '30 m', from: 10100, to: 10150, domain: 'HF', cw: [10100, 10150],
    character: "Réservée à la télégraphie et aux modes numériques : ni voix, ni concours. Une bande calme, remarquablement stable, idéale pour le morse." },
  { name: '20 m', from: 14000, to: 14350, domain: 'HF', cw: [14000, 14070],
    character: "La bande du trafic lointain par excellence. Ouverte presque tous les jours vers un point ou un autre du globe, c’est là qu’on entend le plus de pays." },
  { name: '17 m', from: 18068, to: 18168, domain: 'HF', cw: [18068, 18095],
    character: "Étroite, sans concours autorisés, donc paisible. Elle se comporte comme une version plus calme du 20 mètres." },
  { name: '15 m', from: 21000, to: 21450, domain: 'HF', cw: [21000, 21070],
    character: "Excellente quand l’activité solaire est forte, silencieuse quand elle est faible. Liaisons transcontinentales de jour." },
  { name: '12 m', from: 24890, to: 24990, domain: 'HF', cw: [24890, 24915],
    character: "Comme le 10 mètres, mais plus étroite et sans concours. Ouverte surtout au sommet du cycle solaire." },
  { name: '10 m', from: 28000, to: 29700, domain: 'HF', cw: [28000, 28070],
    character: "Spectaculaire au maximum solaire : quelques watts suffisent alors à traverser un océan. Presque muette au minimum." },
  { name: '6 m', from: 50000, to: 52000, domain: 'VHF',
    character: "La « bande magique ». Habituellement locale, elle s’ouvre soudainement sur des milliers de kilomètres, quelques heures durant, par propagation sporadique." },
  { name: '2 m', from: 144000, to: 146000, domain: 'VHF',
    character: "La bande locale par excellence : contacts directs à portée optique, relais, satellites. Le point d’entrée habituel des nouveaux licenciés." },
  { name: '70 cm', from: 430000, to: 440000, domain: 'UHF',
    character: "Locale elle aussi, avec des antennes compactes. Beaucoup de relais, de liaisons numériques et d’expérimentation." },
  { name: '23 cm', from: 1240000, to: 1300000, domain: 'UHF',
    character: "Hyperfréquences accessibles : antennes paraboliques de petite taille, réflexion sur la Lune, trafic par satellite." },
];

export const DOMAIN_LABELS: Record<Band['domain'], string> = {
  LF: 'Basses fréquences',
  MF: 'Moyennes fréquences',
  HF: 'Décamétriques',
  VHF: 'Très hautes fréquences',
  UHF: 'Ultra hautes fréquences',
};

/** Longueur d'onde en mètres, à partir d'une fréquence en kilohertz. */
export function wavelength(kHz: number): number {
  return kHz > 0 ? 299792.458 / kHz : 0;
}

/** Bande radioamateur contenant cette fréquence, s'il y en a une. */
export function bandFor(kHz: number): Band | null {
  return BANDS.find((band) => kHz >= band.from && kHz <= band.to) ?? null;
}

/** Vrai si la fréquence tombe dans la portion télégraphie de sa bande. */
export function isCwSegment(kHz: number): boolean {
  const band = bandFor(kHz);
  if (!band?.cw) return false;
  return kHz >= band.cw[0] && kHz <= band.cw[1];
}
