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

// --- Composants actifs ---

/** Chute de tension directe d'une diode, en volts, selon son semi-conducteur. */
export const DIODE_DROPS = { silicium: 0.7, germanium: 0.3, schottky: 0.25 } as const;

export type RectifierKind = 'mono' | 'centre-tap' | 'bridge';

/** Nombre de diodes traversées par le courant, selon le montage redresseur. */
export function diodesInPath(kind: RectifierKind): number {
  return kind === 'bridge' ? 2 : 1;
}

/**
 * Tension continue en sortie d'un redressement suivi d'un condensateur.
 *
 * Le condensateur maintient la tension à la valeur crête, dont on retranche la
 * chute des diodes traversées. Le cours signale que les questions d'examen
 * ignorent souvent cette chute : d'où le paramètre, pour montrer les deux.
 */
export function rectifiedVoltage(rmsVolts: number, kind: RectifierKind, dropPerDiode: number = DIODE_DROPS.silicium): number {
  return Math.max(0, peakFromRms(rmsVolts) - diodesInPath(kind) * dropPerDiode);
}

/** Courant collecteur d'un transistor bipolaire : Ic = Ib × β. */
export function collectorCurrent(baseAmps: number, beta: number): number {
  return baseAmps * beta;
}

/** Fréquence propre d'une lame de quartz : f(MHz) = 5,7 / (2 × e(mm)). */
export function quartzFrequency(thicknessMm: number): number {
  return thicknessMm > 0 ? 5.7 / (2 * thicknessMm) : 0;
}

/** Épaisseur d'une lame de quartz pour une fréquence donnée, en millimètres. */
export function quartzThickness(mhz: number): number {
  return mhz > 0 ? 5.7 / (2 * mhz) : 0;
}

export interface MixerOutputs {
  sum: number;
  difference: number;
}

/** Fréquences produites par un mélangeur : la somme et la différence. */
export function mixerOutputs(f1: number, f2: number): MixerOutputs {
  return { sum: f1 + f2, difference: Math.abs(f1 - f2) };
}

/**
 * Fréquences d'entrée d'un mélangeur, à partir de ses deux sorties.
 *
 * Le sens inverse est une question d'examen à part entière, et sa formule
 * n'est pas symétrique : f1 est la demi-différence, f2 le complément.
 */
export function mixerInputs(fmax: number, fmin: number): MixerOutputs {
  const f1 = (fmax - fmin) / 2;
  return { sum: f1, difference: fmax - f1 };
}

/** Gain d'un amplificateur opérationnel en montage inverseur : G = −R2 / R1. */
export function invertingGain(r1: number, r2: number): number {
  return r1 > 0 ? -(r2 / r1) : 0;
}

/** Gain d'un amplificateur opérationnel en montage non inverseur : G = R2/R1 + 1. */
export function nonInvertingGain(r1: number, r2: number): number {
  return r1 > 0 ? r2 / r1 + 1 : 0;
}

/** Fréquence de Nyquist : la moitié de la fréquence d'échantillonnage. */
export function nyquistFrequency(sampleRate: number): number {
  return sampleRate / 2;
}

export type LogicGate = 'ET' | 'OU' | 'NON ET' | 'NON OU' | 'OU EXCLUSIF';

/** Sortie d'une porte logique à deux entrées. */
export function logicOutput(gate: LogicGate, a: boolean, b: boolean): boolean {
  switch (gate) {
    case 'ET':
      return a && b;
    case 'OU':
      return a || b;
    case 'NON ET':
      return !(a && b);
    case 'NON OU':
      return !(a || b);
    case 'OU EXCLUSIF':
      return a !== b;
  }
}

// --- Récepteurs et modulations ---

export type Heterodyne = 'infradyne' | 'supradyne';

export interface ReceiverPlan {
  /** Fréquence intermédiaire, en unité d'entrée. */
  intermediate: number;
  /** Infradyne si l'oscillateur est sous la fréquence reçue, supradyne sinon. */
  kind: Heterodyne;
  /** Fréquence image, celle que le mélange inverse ramène sur la FI. */
  image: number;
  /** Vrai si le spectre est retourné dans l'étage FI. */
  inverted: boolean;
}

/**
 * Plan de fréquences d'un récepteur superhétérodyne.
 *
 * On retient la différence des fréquences, cas de très loin le plus courant.
 * La fréquence image est celle qui, mélangée au même oscillateur, tombe elle
 * aussi sur la FI : c'est elle que le filtre d'entrée doit rejeter.
 */
export function receiverPlan(signal: number, oscillator: number): ReceiverPlan {
  const kind: Heterodyne = oscillator < signal ? 'infradyne' : 'supradyne';
  return {
    intermediate: Math.abs(signal - oscillator),
    kind,
    image: Math.abs(2 * oscillator - signal),
    // Retenir la différence retourne le spectre dès que l'oscillateur est au-dessus.
    inverted: kind === 'supradyne',
  };
}

/** Bande occupée par un signal modulé en fréquence : le double de l'excursion. */
export function fmBandwidth(deviation: number): number {
  return 2 * deviation;
}

export interface AmPowerShare {
  carrier: number;
  perSideband: number;
  sidebands: number;
}

/**
 * Répartition de la puissance d'une émission en modulation d'amplitude.
 *
 * À taux de modulation de 100 %, la porteuse — qui ne transporte rien — emporte
 * les deux tiers de la puissance, et chaque bande latérale un sixième. C'est
 * l'argument chiffré en faveur de la BLU.
 */
export function amPowerShare(totalWatts: number): AmPowerShare {
  const carrier = (totalWatts * 2) / 3;
  const sidebands = totalWatts - carrier;
  return { carrier, perSideband: sidebands / 2, sidebands };
}

/** Tension en microvolts sous 50 Ω correspondant à un point S, pour S ≤ 9. */
export function sMeterMicrovolts(sPoint: number): number {
  // S9 vaut 50 µV, et chaque point vaut 6 dB, soit un facteur 2 en tension.
  return 50 * 2 ** (sPoint - 9);
}

/** Puissance en dBm correspondant à un point S, S9 valant −73 dBm. */
export function sMeterDbm(sPoint: number): number {
  return -73 - 6 * (9 - sPoint);
}

/** Débit binaire : vitesse en bauds multipliée par la valence du signal. */
export function bitRate(bauds: number, states: number): number {
  return states > 1 ? bauds * Math.log2(states) : bauds;
}
