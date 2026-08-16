/**
 * Calcul des durées du code morse.
 *
 * Tout découle d'une unité de temps : le point (dit). Les proportions sont
 * fixées par convention :
 *   - point            1 unité de son
 *   - trait            3 unités de son
 *   - silence intra-caractère  1 unité
 *   - silence inter-caractère  3 unités
 *   - silence inter-mot        7 unités
 *
 * La vitesse s'exprime en mots par minute (WPM), le mot étalon étant PARIS,
 * qui dure exactement 50 unités espace de mot inclus. Une unité vaut donc
 * 60 / (50 * WPM) seconde, soit 1200 / WPM millisecondes.
 */

export type ElementKind = 'dit' | 'dah';

/** Un événement de la séquence : son (`on`) ou silence (`off`). */
export interface TimedElement {
  on: boolean;
  /** Durée en secondes. */
  duration: number;
  /** Renseigne pour les sons uniquement. */
  kind?: ElementKind;
  /** Caractère source, pour surligner la progression à l'écran. */
  char?: string;
  /** Index du caractère source dans le texte émis. */
  charIndex?: number;
}

export interface TimingSettings {
  /** Vitesse des caractères eux-mêmes, en WPM. */
  charWpm: number;
  /** Vitesse globale perçue, en WPM. Inférieure à `charWpm` en Farnsworth. */
  effectiveWpm: number;
}

export interface ResolvedTiming {
  /** Durée d'une unité de son, en secondes. */
  unit: number;
  dit: number;
  dah: number;
  /** Silence entre deux éléments d'un même caractère. */
  intraChar: number;
  /** Silence entre deux caractères, allongé en Farnsworth. */
  interChar: number;
  /** Silence entre deux mots, allongé en Farnsworth. */
  interWord: number;
  /** Vrai si les silences sont étirés par rapport au standard. */
  farnsworth: boolean;
}

export const MIN_WPM = 5;
export const MAX_WPM = 60;

export function clampWpm(wpm: number): number {
  return Math.min(MAX_WPM, Math.max(MIN_WPM, Math.round(wpm)));
}

/**
 * Résout les durées à partir des réglages.
 *
 * En mode Farnsworth les caractères sont émis à pleine vitesse (`charWpm`)
 * mais les silences entre caractères et entre mots sont allongés pour ramener
 * la vitesse globale à `effectiveWpm`. C'est la clé de l'apprentissage : on
 * mémorise le rythme sonore du caractère au lieu de compter les points, tout
 * en se laissant le temps de reconnaître ce qu'on vient d'entendre.
 *
 * La répartition du temps supplémentaire suit la formule de l'ARRL. Le mot
 * PARIS occupe 50 unités : 31 pour les sons et leurs silences internes,
 * 12 pour les quatre silences inter-caractères, 7 pour le silence de mot.
 * Le retard total à insérer vaut donc 60/effectif - 37.2/caractère secondes,
 * réparti sur les 19 unités de silence restantes.
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
 * Développe un code morse en une suite d'éléments sonores et de silences,
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
 * Développe une suite de codes en séquence complète, en intercalant les
 * silences inter-caractères. Un code vide représente un espace entre mots.
 */
export function buildSequence(
  tokens: Array<{ code: string; char?: string }>,
  timing: ResolvedTiming,
): TimedElement[] {
  const out: TimedElement[] = [];
  let previousWasChar = false;

  tokens.forEach((token, index) => {
    if (token.code === '') {
      // Le silence inter-caractère n'a pas encore été posé : on émet
      // directement le silence de mot, plus long, à sa place.
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

/** Durée totale d'une séquence, en secondes. */
export function sequenceDuration(elements: TimedElement[]): number {
  return elements.reduce((total, element) => total + element.duration, 0);
}

/**
 * Convertit une séquence en motif pour l'API Vibration, qui attend des durées
 * en millisecondes alternant vibration et pause en commençant par une
 * vibration. Les silences de tête sont donc absorbés en pause initiale nulle.
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
