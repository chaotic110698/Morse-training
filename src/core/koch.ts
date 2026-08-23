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

/**
 * Nombre de propositions à partir duquel on accepte de juger un caractère.
 *
 * Sans ce seuil, deux réussites d'affilée suffisaient à faire passer une lettre
 * pour acquise et à la reléguer : le E, tiré trois fois et reconnu trois fois,
 * disparaissait presque de la série alors qu'on ne l'avait quasiment pas
 * travaillé. Vingt propositions donnent une mesure qui vaut quelque chose.
 */
export const MASTERY_ATTEMPTS = 20;

/**
 * Poids plancher d'un caractère maîtrisé.
 *
 * Il n'est jamais nul : une lettre sue doit continuer à passer de temps en
 * temps, faute de quoi on la perd — et le jour où elle revient, on ne la
 * reconnaît plus.
 */
export const MASTERED_WEIGHT = 0.25;

export interface CharRecord {
  attempts: number;
  /** Part de bonnes réponses, entre 0 et 1. */
  accuracy: number;
}

export interface DrawOptions {
  /** Poids par caractère, dans l'ordre du jeu. Un par défaut. */
  weights?: number[];
  /**
   * Nombre de caractères récents à ne pas retirer. La valeur est ramenée à ce
   * que le jeu permet : sur deux caractères, on ne peut éviter que le dernier.
   */
  avoid?: number;
  /**
   * Répétitions immédiates volontaires. Deux fois la même lettre est un piège
   * classique en trafic réel : l'oreille entend un seul signal plus long, ou
   * confond avec un autre caractère. Il faut l'avoir rencontré pour le passer.
   */
  traps?: number;
  rng?: () => number;
}

/** Tire un caractère selon des poids, en excluant une liste. */
function weightedPick(
  charset: string[],
  weights: number[],
  excluded: ReadonlySet<string>,
  rng: () => number,
): string {
  let total = 0;
  for (let index = 0; index < charset.length; index += 1) {
    if (excluded.has(charset[index] as string)) continue;
    total += weights[index] as number;
  }
  // Tous les candidats écartés ou de poids nul : on relâche la contrainte
  // plutôt que de rendre toujours le même caractère.
  if (total <= 0) return charset[Math.floor(rng() * charset.length)] ?? (charset[0] as string);

  let ticket = rng() * total;
  let last = charset[0] as string;
  for (let index = 0; index < charset.length; index += 1) {
    const char = charset[index] as string;
    if (excluded.has(char)) continue;
    last = char;
    ticket -= weights[index] as number;
    if (ticket <= 0) return char;
  }
  // Filet de sécurité contre les arrondis flottants.
  return last;
}

/**
 * Tire une suite de caractères.
 *
 * Le tirage évite de reprendre un caractère vu récemment — une répétition
 * rapprochée n'apprend rien et fausse le ressenti de difficulté — puis place
 * les pièges demandés en doublant certains tirages.
 */
export function drawChars(charset: string[], count: number, options: DrawOptions = {}): string[] {
  if (charset.length === 0 || count <= 0) return [];
  const rng = options.rng ?? Math.random;
  const weights = options.weights ?? charset.map(() => 1);
  // On ne peut pas écarter plus de la moitié du jeu sans tourner en rond.
  const avoid = Math.max(0, Math.min(options.avoid ?? 1, Math.floor(charset.length / 2)));
  const traps = Math.max(0, Math.min(options.traps ?? 0, Math.floor(count / 2)));

  const out: string[] = [];
  const recent: string[] = [];
  while (out.length < count) {
    const char = weightedPick(charset, weights, new Set(recent), rng);
    out.push(char);
    recent.push(char);
    while (recent.length > avoid) recent.shift();
  }

  if (traps === 0) return out;

  // Les pièges se posent après coup : on choisit des positions distinctes et
  // on y recopie le caractère précédent, ce qui crée le doublon voulu sans
  // changer la longueur de la série.
  const positions = new Set<number>();
  let guard = 0;
  while (positions.size < traps && guard < count * 4) {
    guard += 1;
    const at = 1 + Math.floor(rng() * (count - 1));
    // Deux pièges collés donneraient un triplé, qui n'est plus un piège mais
    // une bizarrerie : on laisse au moins une position entre eux.
    if (positions.has(at) || positions.has(at - 1) || positions.has(at + 1)) continue;
    positions.add(at);
  }
  for (const at of positions) out[at] = out[at - 1] as string;
  return out;
}

/**
 * Tire une suite de caractères. Le dernier caractère introduit est
 * surreprésenté : c'est celui qui n'est pas encore acquis, et le tirage
 * uniforme le noierait dans les caractères déjà maîtrisés.
 */
export function drawKochChars(
  charset: string[],
  count: number,
  newestWeight = 2.5,
  options: DrawOptions = {},
): string[] {
  const newest = charset[charset.length - 1];
  const weights = charset.map((char) => (char === newest && charset.length > 2 ? newestWeight : 1));
  return drawChars(charset, count, { ...options, weights });
}

/**
 * Poids d'un caractère quand on insiste sur ses points faibles.
 *
 * Trois régimes. Un caractère jamais entendu passe devant, pour être jugé.
 * En dessous du seuil de maîtrise, on ne conclut rien de bon : le poids ne
 * descend jamais sous un, il ne fait que monter si le caractère est raté.
 * Au-delà du seuil seulement, la réussite allège — sans jamais faire taire.
 */
export function weakWeight(record: CharRecord | null): number {
  if (!record || record.attempts === 0) return 2;
  const struggle = 1 - Math.min(1, Math.max(0, record.accuracy));
  if (record.attempts < MASTERY_ATTEMPTS) return 1 + struggle * 4;
  return MASTERED_WEIGHT + struggle * (5 - MASTERED_WEIGHT);
}

/**
 * Tire des caractères en privilégiant ceux que l'opérateur rate le plus.
 */
export function drawWeakestFirst(
  charset: string[],
  count: number,
  recordOf: (char: string) => CharRecord | null,
  options: DrawOptions = {},
): string[] {
  return drawChars(charset, count, { ...options, weights: charset.map((char) => weakWeight(recordOf(char))) });
}
