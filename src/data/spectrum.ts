/**
 * Gammes d'ondes et antennes de référence.
 *
 * Les gammes portent leur nom de leur longueur d'onde, et c'est cette logique
 * qui les rend faciles à retenir : les ondes hectométriques commencent à un
 * hectomètre, les décamétriques à un décamètre, et ainsi de suite. Chaque
 * gamme couvre une décade.
 */

export interface WaveRange {
  code: string;
  adjective: string;
  wavelength: string;
  frequency: string;
  /** Bornes en mégahertz, pour situer une fréquence. */
  fromMhz: number;
  toMhz: number;
}

export const WAVE_RANGES: WaveRange[] = [
  { code: 'VLF', adjective: 'myriamétriques', wavelength: 'plus de 10 km', frequency: 'moins de 30 kHz', fromMhz: 0, toMhz: 0.03 },
  { code: 'LF', adjective: 'kilométriques', wavelength: 'de 1 à 10 km', frequency: 'de 30 à 300 kHz', fromMhz: 0.03, toMhz: 0.3 },
  { code: 'MF', adjective: 'hectométriques', wavelength: 'de 100 m à 1 km', frequency: 'de 300 kHz à 3 MHz', fromMhz: 0.3, toMhz: 3 },
  { code: 'HF', adjective: 'décamétriques', wavelength: 'de 10 à 100 m', frequency: 'de 3 à 30 MHz', fromMhz: 3, toMhz: 30 },
  { code: 'VHF', adjective: 'métriques', wavelength: 'de 1 à 10 m', frequency: 'de 30 à 300 MHz', fromMhz: 30, toMhz: 300 },
  { code: 'UHF', adjective: 'décimétriques', wavelength: 'de 10 cm à 1 m', frequency: 'de 300 MHz à 3 GHz', fromMhz: 300, toMhz: 3000 },
  { code: 'SHF', adjective: 'centimétriques', wavelength: 'de 1 à 10 cm', frequency: 'de 3 à 30 GHz', fromMhz: 3000, toMhz: 30000 },
  { code: 'EHF', adjective: 'millimétriques', wavelength: 'de 1 mm à 1 cm', frequency: 'de 30 à 300 GHz', fromMhz: 30000, toMhz: 300000 },
];

/** Gamme d'ondes contenant cette fréquence. */
export function waveRangeFor(mhz: number): WaveRange | null {
  if (mhz <= 0) return null;
  return WAVE_RANGES.find((range) => mhz > range.fromMhz && mhz <= range.toMhz) ?? null;
}

export interface AntennaImpedance {
  geometry: string;
  ohms: number;
}

export interface AntennaType {
  id: string;
  name: string;
  alias?: string;
  /** Longueur du conducteur, exprimée en fraction de longueur d'onde. */
  length: string;
  impedances: AntennaImpedance[];
  description: string;
}

export const ANTENNA_TYPES: AntennaType[] = [
  {
    id: 'dipole',
    name: 'Doublet demi-onde',
    alias: 'dipôle',
    length: 'λ / 2 au total, soit λ / 4 par brin',
    impedances: [
      { geometry: 'Brins alignés', ohms: 73 },
      { geometry: 'Brins à 120°', ohms: 52 },
      { geometry: 'Brins à 90°', ohms: 36 },
    ],
    description:
      "L’antenne de base, à laquelle tout le reste se compare. Un fil d’une demi-longueur d’onde, alimenté en son milieu. Son impédance dépend de l’angle que forment les deux brins : plus ils se referment, plus elle baisse.",
  },
  {
    id: 'folded',
    name: 'Doublet replié',
    alias: 'trombone',
    length: 'λ au total de fil, pour une antenne longue de λ / 2',
    impedances: [{ geometry: 'Alimenté au milieu', ohms: 300 }],
    description:
      "Un dipôle dont les extrémités sont reliées par un second fil parallèle. La longueur de fil double, l’impédance est multipliée par quatre. C’est la seule antenne de la liste qu’il faut rallonger et non raccourcir.",
  },
  {
    id: 'groundplane',
    name: 'Quart d’onde vertical',
    alias: 'ground plane',
    length: 'λ / 4',
    impedances: [
      { geometry: 'Plan de sol perpendiculaire', ohms: 36 },
      { geometry: 'Radians à 120°', ohms: 52 },
    ],
    description:
      "Une moitié de dipôle, dont le second brin est reconstitué électriquement par un plan de sol : des radians, la terre, ou la carrosserie d’un véhicule. Sans ce plan de sol, elle ne fonctionne pas.",
  },
];
