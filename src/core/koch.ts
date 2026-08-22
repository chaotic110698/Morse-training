/**
 * Méthode Koch.
 *
 * Ludwig Koch, psychologue allemand, a montré dans les années 1930 que
 * l'apprentissage du morse est bien plus rapide si l'on commence tout de suite
 * à la vitesse cible avec deux caractères seulement, puis qu'on en ajoute un
 * dès que la reconnaissance est fiable. La méthode inverse l'intuition : on
 * n'accélère jamais, on élargit. L'oreille apprend un rythme sonore, pas une
 * suite de points à compter.
 */

import type { KochOrderId } from './settings.ts';

export interface KochOrder {
  id: KochOrderId;
  label: string;
  description: string;
  sequence: string[];
}

/**
 * Ordre de LCWO, le plus répandu aujourd'hui. Il alterne tôt des caractères
 * sonorement très différents pour éviter les confusions précoces.
 */
const LCWO = 'KMURESNAPTLWI.JZ=FOY,VG5/Q92H38B?47C1D60X';

/** Ordre historique attribué à Koch, encore utilisé par plusieurs logiciels. */
const CLASSIC = 'KMRSUAPTLOWI.NJEF0Y,VG5/Q9ZH38B?427C1D6X';

/** Ordre alphabétique puis numérique, pour ceux qui préfèrent une progression familière. */
const ALPHABETICAL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,?/=';

export const KOCH_ORDERS: KochOrder[] = [
  {
    id: 'lcwo',
    label: 'LCWO (recommandé)',
    description:
      "L’ordre le plus utilisé aujourd’hui. Les premiers caractères sont choisis pour sonner très différemment les uns des autres.",
    sequence: [...LCWO],
  },
  {
    id: 'classic',
    label: 'Koch historique',
    description: "L’ordre d’origine des travaux de Ludwig Koch, repris par de nombreux logiciels.",
    sequence: [...CLASSIC],
  },
  {
    id: 'alphabetical',
    label: 'Alphabétique',
    description:
      "De A à Z puis les chiffres. Moins efficace à l’oreille, mais rassurant quand on débute.",
    sequence: [...ALPHABETICAL],
  },
];

export function getKochOrder(id: KochOrderId): KochOrder {
  return KOCH_ORDERS.find((order) => order.id === id) ?? (KOCH_ORDERS[0] as KochOrder);
}

/** Nombre minimal de caractères travaillés simultanément. */
export const KOCH_MIN_LEVEL = 2;

export function kochMaxLevel(id: KochOrderId): number {
  return getKochOrder(id).sequence.length;
}

/** Jeu de caractères actif pour un niveau donne. */
export function kochCharset(id: KochOrderId, level: number): string[] {
  const order = getKochOrder(id);
  const bounded = Math.min(order.sequence.length, Math.max(KOCH_MIN_LEVEL, Math.round(level)));
  return order.sequence.slice(0, bounded);
}

/** Dernier caractère introduit au niveau donne. */
export function kochNewestChar(id: KochOrderId, level: number): string | null {
  const charset = kochCharset(id, level);
  return charset[charset.length - 1] ?? null;
}

/**
 * Tire un caractère au hasard selon des poids, en excluant éventuellement un
 * caractère. L'exclusion sert à interdire deux tirages identiques d'affilée :
 * une répétition immédiate n'apprend rien et fausse le ressenti de difficulté.
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
  // Filet de sécurité contre les arrondis flottants.
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
 * Tire une suite de caractères. Le dernier caractère introduit est
 * surreprésenté : c'est celui qui n'est pas encore acquis, et le tirage
 * uniforme le noierait dans les caractères déjà maîtrisés.
 */
export function drawKochChars(charset: string[], count: number, newestWeight = 2.5): string[] {
  const newest = charset[charset.length - 1];
  const weights = charset.map((char) => (char === newest && charset.length > 2 ? newestWeight : 1));
  return drawWith(charset, count, weights);
}

/**
 * Tire des caractères en privilégiant ceux que l'opérateur rate le plus.
 * Le poids croît quand la précision baisse, et un caractère jamais testé est
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
