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
