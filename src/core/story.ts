/**
 * Moteur du mode histoire.
 *
 * Tout ce qui est ici est pur : pas de DOM, pas d'audio, pas d'horloge. Le
 * moteur dit ce qu'il faut afficher, ce qui est juste et ce qui ne l'est pas ;
 * l'interface se contente de le montrer. C'est ce qui permet de le déboguer
 * entièrement hors du navigateur, comme celui du questionnaire.
 *
 * Trois pièces le composent : l'interpolation des textes — le nom de la famille
 * n'étant pas arrêté, aucun récit ne l'écrit en clair —, la machine d'émission
 * avec son retour vert et rouge, et la comparaison indulgente de la copie.
 */

import { CHAR_TO_MORSE } from './morse.ts';
import { EPISODES, KEYER_ERAS, type Beat, type Episode, type KeyerKind, type Lineage } from '../data/story.ts';

// --- Interpolation ---

export interface StoryContext {
  /** Le membre de la lignée dont on suit la scène. */
  generation: number;
  lineage: Lineage;
}

/**
 * L'initiale d'un prénom, accent retiré.
 *
 * Le morse international ne connaît que vingt-six lettres, et les
 * télégraphistes signaient de lettres nues : Étienne signe `E`, pas `É`. La
 * règle est celle du métier, pas une commodité de code.
 */
function initial(name: string): string {
  return (name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')[0] ?? '').toUpperCase();
}

/** Le sine d'une génération : initiale du prénom, puis initiale du nom. */
export function sineOf(lineage: Lineage, generation: number): string {
  const member = lineage.generations.find((entry) => entry.rank === generation);
  if (!member) return initial(lineage.letter);
  return `${initial(member.given)}${initial(lineage.letter)}`;
}

const TOKENS = ['nom', 'prenom', 'sine', 'annee'] as const;
export type Token = (typeof TOKENS)[number];

/**
 * Remplace les jetons d'un texte. Un jeton inconnu est laissé tel quel plutôt
 * qu'effacé : une accolade oubliée doit se voir, pas disparaître.
 */
export function interpolate(text: string, context: StoryContext, year?: number): string {
  const member = context.lineage.generations.find((entry) => entry.rank === context.generation);
  const values: Record<Token, string> = {
    nom: context.lineage.surname,
    prenom: member?.given ?? '',
    sine: sineOf(context.lineage, context.generation),
    annee: year === undefined ? '' : String(year),
  };
  return text.replace(/\{([a-z]+)\}/g, (whole, name: string) =>
    (TOKENS as readonly string[]).includes(name) ? values[name as Token] : whole,
  );
}

/** Les jetons employés par un texte, connus ou non. */
export function tokensOf(text: string): string[] {
  return [...text.matchAll(/\{([a-z]+)\}/g)].map((match) => match[1] as string);
}

// --- Manipulateurs d'époque ---

/** Les manipulateurs qui existent à cette date. */
export function keyersFor(year: number): KeyerKind[] {
  return KEYER_ERAS.filter((era) => year >= era.from).map((era) => era.kind);
}

// --- Émission ---

export type MarkStatus = 'done' | 'wrong' | 'next' | 'todo' | 'space';

export interface SendMark {
  /** Le caractère attendu, ou celui qui a été frappé par erreur. */
  char: string;
  status: MarkStatus;
}

export interface SendState {
  /** Le message attendu, en majuscules. */
  target: string;
  /** Position du prochain caractère à émettre. */
  cursor: number;
  /** Le caractère frappé à tort, qui reste affiché jusqu'à l'effacement. */
  wrong: string | null;
  /** Nombre total d'erreurs commises, pour le bilan. */
  errors: number;
}

/** Le signal d'erreur réel : huit points. */
export const ERROR_SIGN = '........';

const normalise = (text: string): string => text.toUpperCase();

/** Avance le curseur au prochain caractère réellement manipulable. */
function skipSpaces(target: string, from: number): number {
  let index = from;
  while (index < target.length && target[index] === ' ') index += 1;
  return index;
}

export function startSend(target: string): SendState {
  const text = normalise(target);
  return { target: text, cursor: skipSpaces(text, 0), wrong: null, errors: 0 };
}

/**
 * Frappe un caractère.
 *
 * Une erreur ne fait pas reculer : elle se pose sur la position courante et y
 * reste, visible, jusqu'à ce qu'on l'efface. Tant qu'elle est là, le
 * manipulateur ne prend plus rien — c'est ce qui oblige à se corriger au lieu
 * de continuer par-dessus, exactement comme sur une vraie ligne.
 */
export function keySend(state: SendState, char: string): SendState {
  if (state.wrong !== null) return state;
  if (state.cursor >= state.target.length) return state;
  const typed = normalise(char);
  const expected = state.target[state.cursor];
  if (typed !== expected) {
    return { ...state, wrong: typed, errors: state.errors + 1 };
  }
  return { ...state, cursor: skipSpaces(state.target, state.cursor + 1) };
}

/**
 * Efface : d'abord l'erreur en attente, sinon le dernier caractère émis. Dans
 * les deux cas l'interface émet `HH`, les huit points du signal d'erreur.
 */
export function eraseSend(state: SendState): SendState {
  if (state.wrong !== null) return { ...state, wrong: null };
  if (state.cursor === 0) return state;
  let cursor = state.cursor - 1;
  while (cursor > 0 && state.target[cursor] === ' ') cursor -= 1;
  return { ...state, cursor };
}

export function sendDone(state: SendState): boolean {
  return state.wrong === null && state.cursor >= state.target.length;
}

/** L'état de chaque caractère, tel que l'interface doit le peindre. */
export function sendMarks(state: SendState): SendMark[] {
  const marks: SendMark[] = [];
  for (const [index, char] of [...state.target].entries()) {
    if (char === ' ') {
      marks.push({ char: ' ', status: 'space' });
      continue;
    }
    if (index === state.cursor && state.wrong !== null) {
      marks.push({ char: state.wrong, status: 'wrong' });
    } else if (index < state.cursor) {
      marks.push({ char, status: 'done' });
    } else if (index === state.cursor) {
      marks.push({ char, status: 'next' });
    } else {
      marks.push({ char, status: 'todo' });
    }
  }
  return marks;
}

// --- Copie ---

export type CopyMark =
  | { kind: 'ok'; char: string }
  | { kind: 'wrong'; char: string; typed: string }
  | { kind: 'missing'; char: string }
  | { kind: 'extra'; typed: string }
  | { kind: 'space' };

export interface CopyResult {
  marks: CopyMark[];
  correct: number;
  total: number;
  ratio: number;
  perfect: boolean;
}

const letters = (text: string): string[] => [...normalise(text).replace(/\s+/g, '')];

/**
 * Compare une copie au message réel, avec indulgence.
 *
 * L'alignement compte : une lettre manquée au début décalerait tout le reste et
 * afficherait une ligne entièrement fausse alors qu'une seule l'est. On aligne
 * donc les deux chaînes — plus long qu'une comparaison position par position,
 * mais c'est la différence entre « vous avez tout raté » et « il vous manque
 * un E ».
 *
 * Les espaces sont ignorés : le découpage en mots n'est pas ce qu'on évalue.
 */
export function compareCopy(typed: string, target: string): CopyResult {
  const want = letters(target);
  const got = letters(typed);

  // Distance d'édition, puis remontée du chemin.
  const rows = want.length + 1;
  const cols = got.length + 1;
  const cost = new Uint16Array(rows * cols);
  for (let i = 0; i < rows; i += 1) cost[i * cols] = i;
  for (let j = 0; j < cols; j += 1) cost[j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const same = want[i - 1] === got[j - 1];
      cost[i * cols + j] = Math.min(
        (cost[(i - 1) * cols + j] as number) + 1,
        (cost[i * cols + (j - 1)] as number) + 1,
        (cost[(i - 1) * cols + (j - 1)] as number) + (same ? 0 : 1),
      );
    }
  }

  const path: CopyMark[] = [];
  let i = want.length;
  let j = got.length;
  let correct = 0;
  while (i > 0 || j > 0) {
    const here = cost[i * cols + j] as number;
    if (i > 0 && j > 0) {
      const diagonal = cost[(i - 1) * cols + (j - 1)] as number;
      const same = want[i - 1] === got[j - 1];
      if (here === diagonal + (same ? 0 : 1)) {
        const char = want[i - 1] as string;
        if (same) { path.push({ kind: 'ok', char }); correct += 1; }
        else path.push({ kind: 'wrong', char, typed: got[j - 1] as string });
        i -= 1; j -= 1;
        continue;
      }
    }
    if (i > 0 && here === (cost[(i - 1) * cols + j] as number) + 1) {
      path.push({ kind: 'missing', char: want[i - 1] as string });
      i -= 1;
      continue;
    }
    path.push({ kind: 'extra', typed: got[j - 1] as string });
    j -= 1;
  }
  path.reverse();

  return {
    marks: path,
    correct,
    total: want.length,
    ratio: want.length === 0 ? 1 : correct / want.length,
    perfect: correct === want.length && path.length === want.length,
  };
}

// --- Parcours d'un épisode ---

export function episodeById(id: string): Episode | null {
  return EPISODES.find((episode) => episode.id === id) ?? null;
}

/** Vrai pour les temps qui demandent quelque chose au joueur. */
export function isInteractive(beat: Beat): boolean {
  return beat.kind === 'receive' || beat.kind === 'send';
}

/** Le texte d'un temps, jetons remplacés. */
export function beatText(beat: Beat, context: StoryContext, year?: number): string[] {
  switch (beat.kind) {
    case 'recit':
    case 'epilogue':
      return beat.text.map((line) => interpolate(line, context, year));
    case 'silence':
      return beat.text ? [interpolate(beat.text, context, year)] : [];
    case 'receive':
    case 'send':
      return [interpolate(beat.text, context, year)];
  }
}

/** Combien de temps interactifs compte un épisode, et où l'on en est. */
export function episodeProgress(episode: Episode, beat: number): { done: number; total: number } {
  const total = episode.beats.filter(isInteractive).length;
  const done = episode.beats.slice(0, beat).filter(isInteractive).length;
  return { done, total };
}

// --- Contrôle des données ---

const encodable = (text: string): string[] =>
  [...normalise(text)].filter((char) => char !== ' ' && !CHAR_TO_MORSE[char]);

/** Vérifie que les épisodes tiennent debout. Appelé par les tests. */
export function validateStory(episodes: Episode[] = EPISODES, lineage?: Lineage): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const episode of episodes) {
    if (seen.has(episode.id)) problems.push(`Épisode en double : ${episode.id}`);
    seen.add(episode.id);
    if (!/^[a-z0-9-]+$/.test(episode.id)) problems.push(`Identifiant illisible : ${episode.id}`);
    if (episode.beats.length === 0) problems.push(`Épisode vide : ${episode.id}`);
    if (episode.generation < 1 || episode.generation > 5) {
      problems.push(`Génération hors bornes : ${episode.id}`);
    }
    if (episode.year < 1844 || episode.year > 1999) {
      problems.push(`Année hors du récit : ${episode.id} (${episode.year})`);
    }

    const last = episode.beats[episode.beats.length - 1];
    if (!episode.optional && last?.kind !== 'epilogue') {
      problems.push(`Sans épilogue : ${episode.id}`);
    }
    if (!episode.optional && !episode.beats.some(isInteractive)) {
      problems.push(`Aucun temps interactif : ${episode.id}`);
    }

    for (const beat of episode.beats) {
      const texts =
        beat.kind === 'recit' || beat.kind === 'epilogue'
          ? beat.text
          : beat.kind === 'silence'
            ? (beat.text ? [beat.text] : [])
            : [beat.text];

      for (const text of texts) {
        if (text.trim() === '') problems.push(`Texte vide dans ${episode.id}`);
        if (text.includes("'")) problems.push(`Apostrophe droite dans ${episode.id} : ${text.slice(0, 40)}`);
        for (const token of tokensOf(text)) {
          if (!(TOKENS as readonly string[]).includes(token)) {
            problems.push(`Jeton inconnu dans ${episode.id} : {${token}}`);
          }
        }
      }

      if (beat.kind === 'receive' || beat.kind === 'send') {
        const resolved = lineage
          ? interpolate(beat.text, { generation: episode.generation, lineage }, episode.year)
          : beat.text.replace(/\{[a-z]+\}/g, 'XX');
        const unknown = encodable(resolved);
        if (unknown.length > 0) {
          problems.push(`Caractères non manipulables dans ${episode.id} : ${unknown.join(' ')}`);
        }
        if (resolved.replace(/\s+/g, '').length > 60) {
          problems.push(`Message trop long pour être copié dans ${episode.id} : ${resolved.length} caractères`);
        }
      }
    }

    // Le manipulateur à clavier n'existe pas avant 1960 ; l'épisode ne doit pas
    // demander ce que son époque ne peut pas fournir.
    if (keyersFor(episode.year).length === 0) {
      problems.push(`Aucun manipulateur disponible en ${episode.year} : ${episode.id}`);
    }
  }

  if (lineage) {
    const ranks = lineage.generations.map((entry) => entry.rank);
    if (new Set(ranks).size !== ranks.length) problems.push('Générations en double dans la lignée.');
    for (const member of lineage.generations) {
      if (member.given.trim() === '') problems.push(`Prénom vide, génération ${member.rank}`);
      const sine = sineOf(lineage, member.rank);
      if (!/^[A-Z]{2}$/.test(sine)) problems.push(`Sine mal formé, génération ${member.rank} : ${sine}`);
      for (const char of sine) {
        if (!CHAR_TO_MORSE[char]) problems.push(`Sine non manipulable : ${sine}`);
      }
    }
    for (const episode of episodes) {
      if (!lineage.generations.some((entry) => entry.rank === episode.generation)) {
        problems.push(`Génération absente de la lignée : ${episode.id}`);
      }
    }
  }

  return problems;
}
