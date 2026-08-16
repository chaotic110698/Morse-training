/**
 * Methode Koch.
 *
 * Ludwig Koch, psychologue allemand, a montre dans les annees 1930 que
 * l'apprentissage du morse est bien plus rapide si l'on commence tout de suite
 * a la vitesse cible avec deux caracteres seulement, puis qu'on en ajoute un
 * des que la reconnaissance est fiable. La methode inverse l'intuition : on
 * n'accelere jamais, on elargit. L'oreille apprend un rythme sonore, pas une
 * suite de points a compter.
 */

import type { KochOrderId } from './settings.ts';

export interface KochOrder {
  id: KochOrderId;
  label: string;
  description: string;
  sequence: string[];
}

/**
 * Ordre de LCWO, le plus repandu aujourd'hui. Il alterne tot des caracteres
 * sonorement tres differents pour eviter les confusions precoces.
 */
const LCWO = 'KMURESNAPTLWI.JZ=FOY,VG5/Q92H38B?47C1D60X';

/** Ordre historique attribue a Koch, encore utilise par plusieurs logiciels. */
const CLASSIC = 'KMRSUAPTLOWI.NJEF0Y,VG5/Q9ZH38B?427C1D6X';

/** Ordre alphabetique puis numerique, pour ceux qui preferent une progression familiere. */
const ALPHABETICAL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,?/=';

export const KOCH_ORDERS: KochOrder[] = [
  {
    id: 'lcwo',
    label: 'LCWO (recommande)',
    description:
      "L'ordre le plus utilise aujourd'hui. Les premiers caracteres sont choisis pour sonner tres differemment les uns des autres.",
    sequence: [...LCWO],
  },
  {
    id: 'classic',
    label: 'Koch historique',
    description: "L'ordre d'origine des travaux de Ludwig Koch, repris par de nombreux logiciels.",
    sequence: [...CLASSIC],
  },
  {
    id: 'alphabetical',
    label: 'Alphabetique',
    description:
      "De A a Z puis les chiffres. Moins efficace a l'oreille, mais rassurant quand on debute.",
    sequence: [...ALPHABETICAL],
  },
];

export function getKochOrder(id: KochOrderId): KochOrder {
  return KOCH_ORDERS.find((order) => order.id === id) ?? (KOCH_ORDERS[0] as KochOrder);
}

/** Nombre minimal de caracteres travailles simultanement. */
export const KOCH_MIN_LEVEL = 2;

export function kochMaxLevel(id: KochOrderId): number {
  return getKochOrder(id).sequence.length;
}

/** Jeu de caracteres actif pour un niveau donne. */
export function kochCharset(id: KochOrderId, level: number): string[] {
  const order = getKochOrder(id);
  const bounded = Math.min(order.sequence.length, Math.max(KOCH_MIN_LEVEL, Math.round(level)));
  return order.sequence.slice(0, bounded);
}

/** Dernier caractere introduit au niveau donne. */
export function kochNewestChar(id: KochOrderId, level: number): string | null {
  const charset = kochCharset(id, level);
  return charset[charset.length - 1] ?? null;
}

/**
 * Tire un caractere au hasard selon des poids, en excluant eventuellement un
 * caractere. L'exclusion sert a interdire deux tirages identiques d'affilee :
 * une repetition immediate n'apprend rien et fausse le ressenti de difficulte.
 */
function weightedPick(charset: string[], weights: number[], exclude: string | null): string {
  let total = 0;
  for (let index = 0; index < charset.length; index += 1) {
    if (charset[index] === exclude) continue;
    total += weights[index] as number;
  }
  if (total <= 0) return charset[0] as string;

  let ticket = Math.random() * total;
  let last = charset[0] as string;
  for (let index = 0; index < charset.length; index += 1) {
    const char = charset[index] as string;
    if (char === exclude) continue;
    last = char;
    ticket -= weights[index] as number;
    if (ticket <= 0) return char;
  }
  // Filet de securite contre les arrondis flottants.
  return last;
}

function drawWith(charset: string[], count: number, weights: number[]): string[] {
  if (charset.length === 0) return [];
  const out: string[] = [];
  let previous: string | null = null;
  for (let index = 0; index < count; index += 1) {
    const char = weightedPick(charset, weights, charset.length > 1 ? previous : null);
    out.push(char);
    previous = char;
  }
  return out;
}

/**
 * Tire une suite de caracteres. Le dernier caractere introduit est
 * surrepresente : c'est celui qui n'est pas encore acquis, et le tirage
 * uniforme le noierait dans les caracteres deja maitrises.
 */
export function drawKochChars(charset: string[], count: number, newestWeight = 2.5): string[] {
  const newest = charset[charset.length - 1];
  const weights = charset.map((char) => (char === newest && charset.length > 2 ? newestWeight : 1));
  return drawWith(charset, count, weights);
}

/**
 * Tire des caracteres en privilegiant ceux que l'operateur rate le plus.
 * Le poids croit quand la precision baisse, et un caractere jamais teste est
 * traite comme moyennement fragile pour qu'il apparaisse rapidement.
 */
export function drawWeakestFirst(
  charset: string[],
  count: number,
  accuracyOf: (char: string) => number | null,
): string[] {
  const weights = charset.map((char) => {
    const accuracy = accuracyOf(char);
    if (accuracy === null) return 2;
    return 1 + (1 - accuracy) * 4;
  });
  return drawWith(charset, count, weights);
}
