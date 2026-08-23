/**
 * Calculs de radioélectricité du programme d'examen.
 *
 * Fonctions pures, sans dépendance au DOM : les pages les appellent, les tests
 * les vérifient. Elles suivent les conventions de l'examen, qui ne sont pas
 * toujours celles de la physique exacte — la longueur d'onde s'y calcule avec
 * 300 plutôt qu'avec la vitesse de la lumière, parce que l'épreuve se passe
 * avec une calculette simple et que l'écart est sans conséquence.
 */

export interface DbRatio {
  db: number;
  /** Rapport de puissance sortie / entrée. */
  ratio: number;
  label: string;
}

/**
 * Les neuf rapports à connaître par cœur pour l'épreuve de réglementation.
 *
 * Aucun autre n'est exigible : une question dont la réponse demanderait un
 * rapport absent de cette table porte forcément sur autre chose.
 */
export const DB_RATIOS: DbRatio[] = [
  { db: -20, ratio: 1 / 100, label: '1 / 100' },
  { db: -10, ratio: 1 / 10, label: '1 / 10' },
  { db: -6, ratio: 1 / 4, label: '1 / 4' },
  { db: -3, ratio: 1 / 2, label: '1 / 2' },
  { db: 0, ratio: 1, label: 'identique' },
  { db: 3, ratio: 2, label: '× 2' },
  { db: 6, ratio: 4, label: '× 4' },
  { db: 10, ratio: 10, label: '× 10' },
  { db: 20, ratio: 100, label: '× 100' },
];

/**
 * Rapport de puissance correspondant à un gain en décibels.
 *
 * La table prime sur le logarithme, et ce n'est pas une approximation par
 * paresse : 3 dB valent en toute rigueur un facteur 1,995, mais l'examen
 * enseigne et corrige avec un facteur 2. Un candidat qui vérifierait l'exemple
 * de son cours — 50 W, 8 dBd, 2 dB de perte — lirait ici 199,05 W au lieu des
 * 200 W attendus, et douterait du bon calcul. Hors de la table, on retombe sur
 * la formule exacte.
 */
export function powerRatio(db: number): number {
  return DB_RATIOS.find((entry) => entry.db === db)?.ratio ?? 10 ** (db / 10);
}

/** Gain en décibels correspondant à un rapport de puissance. */
export function powerDb(ratio: number): number {
  if (ratio <= 0) return Number.NEGATIVE_INFINITY;
  const known = DB_RATIOS.find((entry) => entry.ratio === ratio);
  return known ? known.db : 10 * Math.log10(ratio);
}

/**
 * Rapport de tension correspondant à un gain en décibels.
 *
 * Un rapport de tension vaut le double d'un rapport de puissance en décibels :
 * doubler la tension quadruple la puissance, donc 6 dB. On passe donc par la
 * table de puissance à moitié de gain, ce qui garde 6 dB → × 2 exact.
 */
export function voltageRatio(db: number): number {
  return powerRatio(db / 2);
}

/** Vrai si ce gain fait partie des neuf rapports exigibles. */
export function isExamRatio(db: number): boolean {
  return DB_RATIOS.some((entry) => entry.db === db);
}

/** Longueur d'onde en mètres, convention d'examen : 300 / f(MHz). */
export function examWavelength(mhz: number): number {
  return mhz > 0 ? 300 / mhz : 0;
}

/** Fréquence en mégahertz, convention d'examen : 300 / λ(m). */
export function examFrequency(metres: number): number {
  return metres > 0 ? 300 / metres : 0;
}

/** Coefficient de raccourcissement pratique d'un brin rayonnant. */
export const SHORTENING = 0.95;

/** Puissance apparente ou isotrope rayonnée, à partir d'un gain total en dB. */
export function radiatedPower(watts: number, totalGainDb: number): number {
  return watts * powerRatio(totalGainDb);
}

/** Affaiblissement total d'un câble, en décibels. */
export function cableLoss(metres: number, dbPerMetre: number): number {
  return metres * dbPerMetre;
}

/** Rendement en pourcentage : part de la puissance consommée qui est émise. */
export function efficiency(usefulWatts: number, consumedWatts: number): number {
  return consumedWatts > 0 ? (usefulWatts * 100) / consumedWatts : 0;
}

/** Coefficient de réflexion, à partir de deux tensions ou deux intensités. */
export function rhoFromAmplitudes(reflected: number, emitted: number): number {
  return emitted > 0 ? reflected / emitted : 0;
}

/**
 * Coefficient de réflexion, à partir de deux puissances.
 *
 * La racine carrée est le piège du chapitre : 5 W réfléchis sur 20 W émis
 * donnent 0,5 et non 0,25, parce que le coefficient porte sur des amplitudes.
 */
export function rhoFromPowers(reflected: number, emitted: number): number {
  return emitted > 0 ? Math.sqrt(reflected / emitted) : 0;
}

/** Taux d'ondes stationnaires, en pourcentage. */
export function swrPercent(rho: number): number {
  return 100 * rho;
}

/** Rapport d'ondes stationnaires, à partir du coefficient de réflexion. */
export function vswrFromRho(rho: number): number {
  return rho < 1 ? (1 + rho) / (1 - rho) : Number.POSITIVE_INFINITY;
}

/** Coefficient de réflexion, à partir du rapport d'ondes stationnaires. */
export function rhoFromVswr(vswr: number): number {
  return vswr >= 1 ? (vswr - 1) / (vswr + 1) : 0;
}

/** Rapport d'ondes stationnaires entre deux impédances purement résistives. */
export function vswrFromImpedances(a: number, b: number): number {
  if (a <= 0 || b <= 0) return 0;
  return Math.max(a, b) / Math.min(a, b);
}

/** Impédance d'une ligne quart d'onde adaptant deux impédances. */
export function matchingLineImpedance(input: number, output: number): number {
  return input > 0 && output > 0 ? Math.sqrt(input * output) : 0;
}

/** Gain du doublet demi-onde par rapport à l'antenne isotrope, en décibels. */
export const DIPOLE_GAIN_DBI = 2.14;

// --- Électricité : lois d'Ohm et de Joule ---

export interface OhmValues {
  /** Tension en volts. */
  u?: number;
  /** Intensité en ampères. */
  i?: number;
  /** Résistance en ohms. */
  r?: number;
  /** Puissance en watts. */
  p?: number;
}

/**
 * Complète les quatre grandeurs à partir de deux d'entre elles.
 *
 * Les douze équations du programme sont exactement les six paires possibles,
 * résolues dans les deux sens. On les code par paire plutôt qu'une par une :
 * il n'y a que six cas, et chacun donne les deux grandeurs manquantes.
 */
export function solveOhm(known: OhmValues): OhmValues | null {
  const { u, i, r, p } = known;
  const has = (x: number | undefined): x is number => typeof x === 'number' && Number.isFinite(x);

  if (has(u) && has(i)) return { u, i, r: i === 0 ? undefined : u / i, p: u * i };
  if (has(u) && has(r)) return r === 0 ? null : { u, i: u / r, r, p: (u * u) / r };
  if (has(u) && has(p)) return u === 0 ? null : { u, i: p / u, r: p === 0 ? undefined : (u * u) / p, p };
  if (has(i) && has(r)) return { u: r * i, i, r, p: r * i * i };
  if (has(i) && has(p)) return i === 0 ? null : { u: p / i, i, r: p / (i * i), p };
  if (has(r) && has(p)) return r < 0 || p < 0 ? null : { u: Math.sqrt(p * r), i: r === 0 ? undefined : Math.sqrt(p / r), r, p };
  return null;
}

/** Résistance équivalente d'un groupement série. */
export function seriesResistance(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0);
}

/** Résistance équivalente d'un groupement parallèle. */
export function parallelResistance(values: number[]): number {
  const usable = values.filter((value) => value > 0);
  if (usable.length === 0) return 0;
  return 1 / usable.reduce((sum, value) => sum + 1 / value, 0);
}

/**
 * Capacité équivalente d'un groupement de condensateurs.
 *
 * Les formules sont inversées par rapport aux résistances : on additionne en
 * parallèle, on somme les inverses en série. C'est l'erreur la plus fréquente
 * du chapitre, d'où deux fonctions nommées explicitement.
 */
export function parallelCapacitance(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0);
}

export function seriesCapacitance(values: number[]): number {
  const usable = values.filter((value) => value > 0);
  if (usable.length === 0) return 0;
  return 1 / usable.reduce((sum, value) => sum + 1 / value, 0);
}

/** Résistance d'un conducteur, à partir de sa résistivité et de ses dimensions. */
export function resistivityToResistance(rhoOhmM: number, lengthM: number, sectionM2: number): number {
  return sectionM2 > 0 ? (rhoOhmM * lengthM) / sectionM2 : 0;
}

/** Épaisseur de peau d'un fil de cuivre, en microns. */
export function skinDepthMicrons(mhz: number): number {
  return mhz > 0 ? 66 / Math.sqrt(mhz) : 0;
}

// --- Courant alternatif ---

/** Racine de deux, rapport entre valeur crête et valeur efficace. */
export const SQRT2 = Math.SQRT2;

/** Valeur efficace d'un signal sinusoïdal, à partir de sa valeur crête. */
export function rmsFromPeak(peak: number): number {
  return peak / SQRT2;
}

/** Valeur crête d'un signal sinusoïdal, à partir de sa valeur efficace. */
export function peakFromRms(rms: number): number {
  return rms * SQRT2;
}

/** Pulsation en radians par seconde, à partir d'une fréquence en hertz. */
export function angularFrequency(hz: number): number {
  return 2 * Math.PI * hz;
}

/** Période en secondes, à partir d'une fréquence en hertz. */
export function period(hz: number): number {
  return hz > 0 ? 1 / hz : 0;
}

/** Réactance d'une bobine en ohms : ZL = 2πfL. */
export function inductiveReactance(hz: number, henry: number): number {
  return angularFrequency(hz) * henry;
}

/** Capacitance d'un condensateur en ohms : ZC = 1 / 2πfC. */
export function capacitiveReactance(hz: number, farad: number): number {
  const denominator = angularFrequency(hz) * farad;
  return denominator > 0 ? 1 / denominator : Number.POSITIVE_INFINITY;
}

/** Impédance d'un composant réel : Z = √(R² + X²). */
export function impedance(resistance: number, reactance: number): number {
  return Math.hypot(resistance, reactance);
}

/** Angle de déphasage en degrés, à partir de la réactance et de la résistance. */
export function phaseAngle(reactance: number, resistance: number): number {
  return resistance === 0 ? (reactance >= 0 ? 90 : -90) : (Math.atan(reactance / resistance) * 180) / Math.PI;
}

/** Constante de temps d'un circuit RC, en secondes. */
export function timeConstant(ohms: number, farads: number): number {
  return ohms * farads;
}

/** Énergie emmagasinée dans un condensateur, en joules. */
export function capacitorEnergy(coulombs: number, volts: number): number {
  return 0.5 * coulombs * volts;
}

// --- Transformateurs ---

export interface TransformerRatios {
  /** Rapport de transformation N = ns / np. */
  n: number;
  secondaryVoltage: number;
  secondaryCurrent: number;
  /** Impédance ramenée au primaire, pour une charge donnée au secondaire. */
  primaryImpedance: number;
}

/**
 * Grandeurs d'un transformateur parfait.
 *
 * Les tensions suivent le rapport de spires, les intensités l'inverse, et les
 * impédances son carré — c'est ce carré que l'examen vérifie le plus souvent.
 */
export function transformer(
  primaryTurns: number,
  secondaryTurns: number,
  primaryVoltage: number,
  primaryCurrent: number,
  secondaryLoad: number,
): TransformerRatios | null {
  if (primaryTurns <= 0 || secondaryTurns <= 0) return null;
  const n = secondaryTurns / primaryTurns;
  return {
    n,
    secondaryVoltage: primaryVoltage * n,
    secondaryCurrent: n === 0 ? 0 : primaryCurrent / n,
    primaryImpedance: secondaryLoad / (n * n),
  };
}

// --- Circuits accordés ---

/** Fréquence de coupure d'un circuit RC, en hertz : f = 1 / 2πRC. */
export function rcCutoff(ohms: number, farads: number): number {
  const denominator = angularFrequency(1) * ohms * farads;
  return denominator > 0 ? 1 / denominator : 0;
}

/** Fréquence de coupure d'un circuit RL, en hertz : f = R / 2πL. */
export function rlCutoff(ohms: number, henry: number): number {
  return henry > 0 ? ohms / (angularFrequency(1) * henry) : 0;
}

/** Fréquence de résonance, loi de Thomson : f = 1 / 2π√(LC). */
export function thomsonFrequency(henry: number, farad: number): number {
  const product = henry * farad;
  return product > 0 ? 1 / (angularFrequency(1) * Math.sqrt(product)) : 0;
}

/** Inductance donnant cette résonance avec cette capacité : L = 1 / 4π²f²C. */
export function thomsonInductance(hz: number, farad: number): number {
  const denominator = 4 * Math.PI ** 2 * hz ** 2 * farad;
  return denominator > 0 ? 1 / denominator : 0;
}

/** Capacité donnant cette résonance avec cette inductance : C = 1 / 4π²f²L. */
export function thomsonCapacitance(hz: number, henry: number): number {
  const denominator = 4 * Math.PI ** 2 * hz ** 2 * henry;
  return denominator > 0 ? 1 / denominator : 0;
}

/** Réactance commune à la résonance : XL = XC = √(L / C). */
export function resonantReactance(henry: number, farad: number): number {
  return farad > 0 ? Math.sqrt(henry / farad) : 0;
}

/** Facteur de qualité d'un circuit accordé : Q = √(L / C) / R. */
export function qualityFactor(henry: number, farad: number, ohms: number): number {
  return ohms > 0 ? resonantReactance(henry, farad) / ohms : 0;
}

/** Impédance d'un circuit bouchon à la résonance : Z = L / (R × C). */
export function tankImpedance(henry: number, farad: number, ohms: number): number {
  const denominator = ohms * farad;
  return denominator > 0 ? henry / denominator : 0;
}

/** Bande passante à −3 dB d'un circuit accordé : B = f0 / Q. */
export function bandwidth(resonanceHz: number, q: number): number {
  return q > 0 ? resonanceHz / q : 0;
}

/** Taux de sélectivité en pourcentage, à partir des deux largeurs de bande. */
export function selectivity(bandwidth3dB: number, bandwidth60dB: number): number {
  return bandwidth60dB > 0 ? (bandwidth3dB * 100) / bandwidth60dB : 0;
}
