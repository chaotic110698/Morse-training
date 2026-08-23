/**
 * Multiples du système international et code des couleurs des composants.
 *
 * Deux tables que l'examen demande de savoir manipuler plutôt que réciter :
 * la première sert à toutes les conversions, la seconde à lire une résistance
 * ou un condensateur. Le cours conseille de recopier la table des multiples
 * sur le brouillon avant de lancer le chronomètre, ce qui en dit long sur son
 * usage réel.
 */

export interface Multiple {
  symbol: string;
  name: string;
  exponent: number;
}

/** Du giga au pico : les seuls multiples employés en radioamateur. */
export const MULTIPLES: Multiple[] = [
  { symbol: 'G', name: 'giga', exponent: 9 },
  { symbol: 'M', name: 'méga', exponent: 6 },
  { symbol: 'k', name: 'kilo', exponent: 3 },
  { symbol: '', name: 'unité', exponent: 0 },
  { symbol: 'm', name: 'milli', exponent: -3 },
  { symbol: 'µ', name: 'micro', exponent: -6 },
  { symbol: 'n', name: 'nano', exponent: -9 },
  { symbol: 'p', name: 'pico', exponent: -12 },
];

export interface ColourBand {
  name: string;
  /** Couleur d'affichage, ou dégradé pour l'or et l'argent. */
  css: string;
  /** Chiffre porté par la bague, null si la couleur ne code pas de chiffre. */
  digit: number | null;
  /** Puissance de dix de la bague multiplicatrice. */
  multiplier: number | null;
  /** Tolérance en pourcentage, quand la couleur en code une. */
  tolerance: number | null;
}

/**
 * Le code des couleurs, dans l'ordre du moyen mnémotechnique français :
 * « Ne Mangez Rien Ou Je Vous Battrai VIOlemment, Grand BOA ».
 */
export const COLOUR_BANDS: ColourBand[] = [
  { name: 'Noir', css: '#111418', digit: 0, multiplier: 0, tolerance: null },
  { name: 'Marron', css: '#7c4a17', digit: 1, multiplier: 1, tolerance: 1 },
  { name: 'Rouge', css: '#d02a2a', digit: 2, multiplier: 2, tolerance: 2 },
  { name: 'Orange', css: '#e06a12', digit: 3, multiplier: 3, tolerance: null },
  { name: 'Jaune', css: '#e5c020', digit: 4, multiplier: 4, tolerance: null },
  { name: 'Vert', css: '#2f9e44', digit: 5, multiplier: 5, tolerance: 0.5 },
  { name: 'Bleu', css: '#2b6cb0', digit: 6, multiplier: 6, tolerance: 0.25 },
  { name: 'Violet', css: '#7d4fbd', digit: 7, multiplier: 7, tolerance: 0.1 },
  { name: 'Gris', css: '#8b98a5', digit: 8, multiplier: 8, tolerance: null },
  { name: 'Blanc', css: '#e9eef4', digit: 9, multiplier: 9, tolerance: null },
  { name: 'Or', css: 'linear-gradient(135deg, #d4a017, #f5d76e)', digit: null, multiplier: -1, tolerance: 5 },
  { name: 'Argent', css: 'linear-gradient(135deg, #9aa3ad, #dfe5ea)', digit: null, multiplier: -2, tolerance: 10 },
];

/** Valeur en ohms codée par trois bagues, ou null si la combinaison est invalide. */
export function resistorValue(first: ColourBand, second: ColourBand, multiplier: ColourBand): number | null {
  if (first.digit === null || second.digit === null || multiplier.multiplier === null) return null;
  return (first.digit * 10 + second.digit) * 10 ** multiplier.multiplier;
}

export interface Resistivity {
  material: string;
  rho: number;
  kind: 'conducteur' | 'semi-conducteur' | 'isolant';
}

/** Résistivités à 20 °C, en ohms-mètres. */
export const RESISTIVITIES: Resistivity[] = [
  { material: 'Argent', rho: 1.6e-8, kind: 'conducteur' },
  { material: 'Cuivre écroui', rho: 1.8e-8, kind: 'conducteur' },
  { material: 'Or', rho: 2.2e-8, kind: 'conducteur' },
  { material: 'Aluminium', rho: 3e-8, kind: 'conducteur' },
  { material: 'Laiton', rho: 6e-8, kind: 'conducteur' },
  { material: 'Fer', rho: 1e-7, kind: 'conducteur' },
  { material: 'Constantan', rho: 4.9e-7, kind: 'conducteur' },
  { material: 'Nichrome', rho: 1.1e-6, kind: 'conducteur' },
  { material: 'Eau de mer', rho: 0.3, kind: 'semi-conducteur' },
  { material: 'Germanium', rho: 0.46, kind: 'semi-conducteur' },
  { material: 'Silicium', rho: 640, kind: 'semi-conducteur' },
  { material: 'Eau pure', rho: 2e5, kind: 'isolant' },
  { material: 'Air sec', rho: 1.13e9, kind: 'isolant' },
  { material: 'Porcelaine', rho: 1e11, kind: 'isolant' },
  { material: 'Polyéthylène', rho: 1e15, kind: 'isolant' },
  { material: 'Quartz', rho: 7e17, kind: 'isolant' },
  { material: 'Polystyrène', rho: 1e20, kind: 'isolant' },
];

export interface Cell {
  couple: string;
  volts: number;
  rechargeable: boolean;
}

/** Forces électromotrices des couples électrochimiques courants. */
export const CELLS: Cell[] = [
  { couple: 'Zinc-charbon', volts: 1.5, rechargeable: false },
  { couple: 'Alcaline', volts: 1.5, rechargeable: false },
  { couple: 'Cadmium-nickel', volts: 1.2, rechargeable: true },
  { couple: 'Nickel-hydrure métallique', volts: 1.2, rechargeable: true },
  { couple: 'Plomb-acide', volts: 2, rechargeable: true },
  { couple: 'Lithium-ion', volts: 3.6, rechargeable: true },
];
