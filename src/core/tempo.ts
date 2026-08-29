/**
 * La montée en vitesse.
 *
 * La méthode Koch tient en une phrase qu'on répète partout sur ce site : ne
 * jamais ralentir les caractères, raccourcir les silences. Le site permettait
 * les deux réglages et ne proposait jamais de franchir le pas — quelqu'un
 * pouvait rester à dix mots par minute pendant six mois sans savoir qu'il
 * était prêt, ce qui est exactement le mur que la méthode existe pour éviter.
 *
 * Ce module regarde l'historique et répond à une seule question : le réglage
 * actuel est-il devenu trop facile ? Il ne décide rien — c'est le joueur qui
 * accepte le pas, ou le remet à plus tard.
 *
 * **Ce qui compte comme une preuve.** Trois séries d'affilée, à la même
 * vitesse, toutes au-dessus de quatre-vingt-dix pour cent et d'une moyenne
 * d'au moins quatre-vingt-quinze. La condition est volontairement difficile :
 * chaque caractère débloqué fait remonter la difficulté, si bien qu'enchaîner
 * trois séries excellentes signifie que ce n'est plus le nombre de caractères
 * qui limite, mais le tempo.
 */

import type { Progress, SessionRecord, TrainingMode } from './progress.ts';

/** Séries consécutives à réussir avant qu'un pas soit proposé. */
export const SERIES_AVANT_PAS = 3;

/** Chacune doit dépasser ce taux. */
export const SEUIL_SERIE = 0.9;

/** Et leur moyenne, celui-ci. */
export const SEUIL_MOYENNE = 0.95;

/** En deçà, une série est trop courte pour prouver quoi que ce soit. */
const MINIMUM_REPONSES = 15;

/** Le pas, en mots par minute. */
const PAS_WPM = 2;

/**
 * Au-delà, on cesse de proposer.
 *
 * Trente-cinq mots par minute est déjà le domaine des opérateurs confirmés ;
 * plus haut, on sait ce qu'on fait et on va le régler soi-même.
 */
export const PLAFOND_WPM = 35;

/** Un pas remis à plus tard ne revient pas avant une semaine. */
const REPORT_MS = 7 * 24 * 60 * 60 * 1000;

export interface PasDeVitesse {
  /**
   * `farnsworth` : les caractères gardent leur rythme, les silences se
   * resserrent. `reelle` : tout accélère, y compris les caractères — c'est le
   * vrai changement de vitesse, et il n'arrive qu'une fois l'écart refermé.
   */
  kind: 'farnsworth' | 'reelle';
  charWpm: number;
  effectiveWpm: number;
}

export interface TempoSettings {
  charWpm: number;
  effectiveWpm: number;
}

/** La clé sous laquelle un report est mémorisé, dans les drapeaux du joueur. */
export function cleReport(pas: PasDeVitesse): string {
  return `tempo:${pas.charWpm}/${pas.effectiveWpm}`;
}

function seriesRecentes(progress: Progress, mode: TrainingMode): SessionRecord[] {
  return progress.sessions
    .filter((session) => session.mode === mode && session.attempts >= MINIMUM_REPONSES)
    .slice(0, SERIES_AVANT_PAS);
}

/**
 * Le pas à proposer, ou `null` s'il n'y a rien à proposer.
 *
 * Les trois séries examinées sont les trois dernières **dans l'ordre**, pas
 * les trois dernières qui arrangent : si l'une d'elles a été jouée à une autre
 * vitesse, la preuve ne tient pas et l'on repart de zéro. Sans cela, monter
 * puis redescendre d'un cran suffirait à faire ressortir une preuve périmée.
 */
export function prochainPas(
  settings: TempoSettings,
  progress: Progress,
  mode: TrainingMode = 'listen',
  now = Date.now(),
): PasDeVitesse | null {
  const dernieres = seriesRecentes(progress, mode);
  if (dernieres.length < SERIES_AVANT_PAS) return null;

  const memeVitesse = dernieres.every(
    (session) =>
      session.charWpm === settings.charWpm && session.effectiveWpm === settings.effectiveWpm,
  );
  if (!memeVitesse) return null;

  const taux = dernieres.map((session) => session.correct / session.attempts);
  if (taux.some((valeur) => valeur < SEUIL_SERIE)) return null;
  const moyenne = taux.reduce((somme, valeur) => somme + valeur, 0) / taux.length;
  if (moyenne < SEUIL_MOYENNE) return null;

  const pas: PasDeVitesse =
    settings.effectiveWpm < settings.charWpm
      ? {
          kind: 'farnsworth',
          charWpm: settings.charWpm,
          effectiveWpm: Math.min(settings.charWpm, settings.effectiveWpm + PAS_WPM),
        }
      : {
          kind: 'reelle',
          charWpm: Math.min(PLAFOND_WPM, settings.charWpm + PAS_WPM),
          effectiveWpm: Math.min(PLAFOND_WPM, settings.charWpm + PAS_WPM),
        };

  // Rien à proposer si le pas ne change rien : au plafond, ou déjà au bout de
  // l'écart Farnsworth avec un pas nul.
  if (pas.charWpm === settings.charWpm && pas.effectiveWpm === settings.effectiveWpm) return null;

  const reporte = progress.flags[cleReport(pas)] ?? 0;
  if (reporte > now - REPORT_MS) return null;

  return pas;
}
