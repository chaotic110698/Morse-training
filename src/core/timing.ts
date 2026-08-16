/**
 * Calcul des durees du code morse.
 *
 * Tout decoule d'une unite de temps : le point (dit). Les proportions sont
 * fixees par convention :
 *   - point            1 unite de son
 *   - trait            3 unites de son
 *   - silence intra-caractere  1 unite
 *   - silence inter-caractere  3 unites
 *   - silence inter-mot        7 unites
 *
 * La vitesse s'exprime en mots par minute (WPM), le mot etalon etant PARIS,
 * qui dure exactement 50 unites espace de mot inclus. Une unite vaut donc
 * 60 / (50 * WPM) seconde, soit 1200 / WPM millisecondes.
 */

export type ElementKind = 'dit' | 'dah';

/** Un evenement de la sequence : son (`on`) ou silence (`off`). */
export interface TimedElement {
  on: boolean;
  /** Duree en secondes. */
  duration: number;
  /** Renseigne pour les sons uniquement. */
  kind?: ElementKind;
  /** Caractere source, pour surligner la progression a l'ecran. */
  char?: string;
  /** Index du caractere source dans le texte emis. */
  charIndex?: number;
}

export interface TimingSettings {
  /** Vitesse des caracteres eux-memes, en WPM. */
  charWpm: number;
  /** Vitesse globale percue, en WPM. Inferieure a `charWpm` en Farnsworth. */
  effectiveWpm: number;
}

export interface ResolvedTiming {
  /** Duree d'une unite de son, en secondes. */
  unit: number;
  dit: number;
  dah: number;
  /** Silence entre deux elements d'un meme caractere. */
  intraChar: number;
  /** Silence entre deux caracteres, allonge en Farnsworth. */
  interChar: number;
  /** Silence entre deux mots, allonge en Farnsworth. */
  interWord: number;
  /** Vrai si les silences sont etires par rapport au standard. */
  farnsworth: boolean;
}

export const MIN_WPM = 5;
export const MAX_WPM = 60;

export function clampWpm(wpm: number): number {
  return Math.min(MAX_WPM, Math.max(MIN_WPM, Math.round(wpm)));
}

/**
 * Resout les durees a partir des reglages.
 *
 * En mode Farnsworth les caracteres sont emis a pleine vitesse (`charWpm`)
 * mais les silences entre caracteres et entre mots sont allonges pour ramener
 * la vitesse globale a `effectiveWpm`. C'est la cle de l'apprentissage : on
 * memorise le rythme sonore du caractere au lieu de compter les points, tout
 * en se laissant le temps de reconnaitre ce qu'on vient d'entendre.
 *
 * La repartition du temps supplementaire suit la formule de l'ARRL. Le mot
 * PARIS occupe 50 unites : 31 pour les sons et leurs silences internes,
 * 12 pour les quatre silences inter-caracteres, 7 pour le silence de mot.
 * Le retard total a inserer vaut donc 60/effectif - 37.2/caractere secondes,
 * reparti sur les 19 unites de silence restantes.
 */
export function resolveTiming(settings: TimingSettings): ResolvedTiming {
  const charWpm = clampWpm(settings.charWpm);
  const effectiveWpm = Math.min(charWpm, clampWpm(settings.effectiveWpm));
  const unit = 1.2 / charWpm;

  if (effectiveWpm >= charWpm) {
    return {
      unit,
      dit: unit,
      dah: unit * 3,
      intraChar: unit,
      interChar: unit * 3,
      interWord: unit * 7,
      farnsworth: false,
    };
  }

  const totalDelay = (60 * charWpm - 37.2 * effectiveWpm) / (charWpm * effectiveWpm);
  return {
    unit,
    dit: unit,
    dah: unit * 3,
    intraChar: unit,
    interChar: (3 * totalDelay) / 19,
    interWord: (7 * totalDelay) / 19,
    farnsworth: true,
  };
}

/**
 * Developpe un code morse en une suite d'elements sonores et de silences,
 * silences internes compris mais sans silence final.
 */
export function elementsForCode(
  code: string,
  timing: ResolvedTiming,
  char?: string,
  charIndex?: number,
): TimedElement[] {
  const out: TimedElement[] = [];
  [...code].forEach((symbol, index) => {
    if (index > 0) out.push({ on: false, duration: timing.intraChar });
    const kind: ElementKind = symbol === '.' ? 'dit' : 'dah';
    out.push({
      on: true,
      duration: kind === 'dit' ? timing.dit : timing.dah,
      kind,
      char,
      charIndex,
    });
  });
  return out;
}

/**
 * Developpe une suite de codes en sequence complete, en intercalant les
 * silences inter-caracteres. Un code vide represente un espace entre mots.
 */
export function buildSequence(
  tokens: Array<{ code: string; char?: string }>,
  timing: ResolvedTiming,
): TimedElement[] {
  const out: TimedElement[] = [];
  let previousWasChar = false;

  tokens.forEach((token, index) => {
    if (token.code === '') {
      // Le silence inter-caractere n'a pas encore ete pose : on emet
      // directement le silence de mot, plus long, a sa place.
      if (previousWasChar) out.push({ on: false, duration: timing.interWord });
      previousWasChar = false;
      return;
    }
    if (previousWasChar) out.push({ on: false, duration: timing.interChar });
    out.push(...elementsForCode(token.code, timing, token.char, index));
    previousWasChar = true;
  });

  return out;
}

/** Duree totale d'une sequence, en secondes. */
export function sequenceDuration(elements: TimedElement[]): number {
  return elements.reduce((total, element) => total + element.duration, 0);
}

/**
 * Convertit une sequence en motif pour l'API Vibration, qui attend des durees
 * en millisecondes alternant vibration et pause en commencant par une
 * vibration. Les silences de tete sont donc absorbes en pause initiale nulle.
 */
export function toVibrationPattern(elements: TimedElement[]): number[] {
  const pattern: number[] = [];
  let expectingOn = true;
  for (const element of elements) {
    const ms = Math.round(element.duration * 1000);
    if (element.on === expectingOn) {
      pattern.push(ms);
      expectingOn = !expectingOn;
    } else if (pattern.length === 0) {
      pattern.push(0, ms);
      expectingOn = true;
    } else {
      pattern[pattern.length - 1] = (pattern[pattern.length - 1] ?? 0) + ms;
    }
  }
  return pattern;
}
