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
  /** Horodatage du dernier passage. Zéro si le caractère n'a jamais été vu. */
  lastSeen: number;
}

/**
 * L'oubli.
 *
 * Un caractère su et jamais revu se perd, et le jour où il revient on ne le
 * reconnaît plus. Le poids d'un caractère monte donc avec le temps écoulé
 * depuis son dernier passage : au bout de trois jours il compte double, au
 * bout de neuf il compte quadruple.
 *
 * Le plafond n'est pas une précaution technique. Sans lui, un caractère laissé
 * de côté un an écraserait toute la série à son retour, et l'on ne travaillerait
 * plus que lui.
 */
const OUBLI_JOURS = 3;
const OUBLI_MAX = 3;
const JOUR_MS = 24 * 60 * 60 * 1000;

export function facteurOubli(record: CharRecord | null, now = Date.now()): number {
  if (!record || record.lastSeen <= 0) return 1;
  const jours = Math.max(0, (now - record.lastSeen) / JOUR_MS);
  return 1 + Math.min(OUBLI_MAX, jours / OUBLI_JOURS);
}

/**
 * Le rappel.
 *
 * Pondérer ne suffit pas. Sur quarante caractères et une série de vingt-cinq,
 * la plupart ne sortent tout simplement pas : une lettre maîtrisée peut rester
 * des semaines sans revenir, quel que soit son poids. Au-delà de ce silence,
 * elle entre donc **d'office** dans la série suivante — c'est une garantie, pas
 * une probabilité.
 */
export const RAPPEL_JOURS = 10;

/** Part maximale d'une série que les rappels peuvent occuper. */
const RAPPEL_PART = 1 / 3;

/**
 * Les caractères à faire revenir d'office, du plus anciennement vu au moins
 * ancien. Un caractère jamais rencontré n'en fait pas partie : il n'y a rien à
 * y rappeler, et le tirage le sert déjà en premier.
 */
export function charsARappeler(
  charset: string[],
  recordOf: (char: string) => CharRecord | null,
  count: number,
  now = Date.now(),
): string[] {
  const limite = now - RAPPEL_JOURS * JOUR_MS;
  const oublies = charset
    .map((char) => ({ char, record: recordOf(char) }))
    .filter((entry) => entry.record !== null && entry.record.lastSeen > 0 && entry.record.lastSeen < limite)
    .sort((a, b) => (a.record as CharRecord).lastSeen - (b.record as CharRecord).lastSeen)
    .map((entry) => entry.char);

  return oublies.slice(0, Math.max(1, Math.floor(count * RAPPEL_PART)));
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
  /**
   * Caractères à faire figurer coûte que coûte. Ils sont substitués après le
   * tirage, à des positions qui ne créent pas de doublon involontaire : la
   * longueur de la série ne change pas, et l'espacement reste celui du tirage.
   */
  forced?: string[];
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

  placeRappels(out, options.forced ?? [], rng);

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
 * Impose les rappels dans une série déjà tirée.
 *
 * On ne les ajoute pas, on les substitue : la série garde sa longueur, et le
 * caractère remplacé était de toute façon un caractère de plus au hasard. Les
 * positions retenues évitent de coller deux fois le même signe, ce que le
 * tirage lui-même s'interdit.
 */
function placeRappels(out: string[], forced: string[], rng: () => number): void {
  if (forced.length === 0 || out.length === 0) return;

  /*
   * Les positions à ne pas écraser. Elle contient d'emblée celles où un rappel
   * figure déjà naturellement — sans quoi la substitution du second rappel peut
   * tomber sur le premier et le faire disparaître. Le défaut s'est produit
   * trois fois sur mille tirages, ce qui est exactement le genre de chose qu'un
   * essai attrape et qu'un regard ne voit pas.
   */
  const proteges = new Set<number>();
  const aPlacer: string[] = [];

  for (const char of forced.slice(0, out.length)) {
    const deja = out.indexOf(char);
    if (deja >= 0) proteges.add(deja);
    else aPlacer.push(char);
  }

  for (const char of aPlacer) {
    let guard = 0;
    while (guard < out.length * 4) {
      guard += 1;
      const at = Math.floor(rng() * out.length);
      if (proteges.has(at)) continue;
      // Le tirage s'interdit déjà les doublons collés : la substitution ne
      // doit pas en introduire.
      if (out[at - 1] === char || out[at + 1] === char) continue;
      out[at] = char;
      proteges.add(at);
      break;
    }
  }
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
export function weakWeight(record: CharRecord | null, now = Date.now()): number {
  if (!record || record.attempts === 0) return 2;
  const struggle = 1 - Math.min(1, Math.max(0, record.accuracy));
  const base =
    record.attempts < MASTERY_ATTEMPTS
      ? 1 + struggle * 4
      : MASTERED_WEIGHT + struggle * (5 - MASTERED_WEIGHT);
  // Le temps écoulé multiplie la difficulté ressentie : c'est le même
  // caractère, mais on ne l'a plus en main.
  return base * facteurOubli(record, now);
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
  const now = Date.now();
  return drawChars(charset, count, {
    ...options,
    weights: charset.map((char) => weakWeight(recordOf(char), now)),
    forced: options.forced ?? charsARappeler(charset, recordOf, count, now),
  });
}
