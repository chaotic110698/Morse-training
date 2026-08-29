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
import type { StoryMode } from './progress.ts';
import { STORY_CATALOGUE } from '../data/story-catalogue.ts';
import {
  EPISODES,
  KEYER_ERAS,
  MAX_LONG_PER_EPISODE,
  MAX_MESSAGE,
  SHORT_MESSAGE,
  type Beat,
  type Episode,
  type KeyerKind,
  type Lineage,
} from '../data/story.ts';

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
/**
 * Ce que le niveau autorise.
 *
 * Le mode histoire offre par défaut toutes les aides du site : une table de
 * déchiffrage dépliable, la réécoute à volonté, le ralentissement, la lecture
 * lettre par lettre et n'importe quel manipulateur. Aucun opérateur n'a jamais
 * eu tout cela, et c'est là-dessus que porte la difficulté — on retire des
 * béquilles, on ne pose pas de mur.
 *
 * L'échec ne bloque donc toujours pas : même sans avoir rien entendu, on écrit
 * ce qu'on veut, on compare, et l'épisode continue.
 */
export interface StoryRules {
  /**
   * Les manipulateurs que l'époque connaissait. La même liste dans les deux
   * niveaux : elle sert à marquer les anachronismes, ce qui est une
   * information et non une contrainte.
   */
  keyers: KeyerKind[];
  /** Vrai pour s'y tenir vraiment, au lieu de simplement les signaler. */
  restrictKeyers: boolean;
  /** La table de déchiffrage est-elle dépliable ? */
  table: boolean;
  /** La lecture caractère par caractère est-elle offerte ? */
  step: boolean;
  /** Peut-on demander plus lent ? */
  qrs: boolean;
  /**
   * Combien de fois on peut redemander le message, la première écoute mise à
   * part. Un opérateur qui répète trop se fait remarquer, et surtout perd le
   * fil du trafic.
   */
  repeats: number;
  /** Peut-on réécouter une fois la copie comparée ? */
  listenAfterCheck: boolean;
  /**
   * Le ruban du signal. Il montre le rythme, ce qu'aucun opérateur n'avait
   * sous les yeux : c'est une aide moderne, et elle tombe avec les autres.
   */
  trace: boolean;
}

/** Le nombre de répétitions accordées en conditions d'opérateur. */
export const OPERATOR_REPEATS = 2;

export function rulesFor(mode: StoryMode, year: number): StoryRules {
  if (mode !== 'operateur') {
    return {
      keyers: keyersFor(year),
      restrictKeyers: false,
      table: true,
      step: true,
      qrs: true,
      repeats: Number.POSITIVE_INFINITY,
      listenAfterCheck: true,
      trace: true,
    };
  }
  return {
    keyers: keyersFor(year),
    restrictKeyers: true,
    table: false,
    step: false,
    qrs: false,
    repeats: OPERATOR_REPEATS,
    // Une fois le corrigé sous les yeux, réécouter n'apprend plus rien : on
    // ne copie plus, on recopie.
    listenAfterCheck: false,
    trace: false,
  };
}

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

/**
 * Le clavier du manipulateur, rangée par rangée — et donc, exactement, ce
 * qu'un message à transmettre a le droit de contenir.
 *
 * La liste vit ici plutôt que dans l'interface parce qu'elle est un contrat :
 * un épisode qui demanderait un caractère absent du clavier serait injouable,
 * et le contrôle des données le refuse. Disposition française, chiffres en
 * tête comme sur un vrai poste.
 */
export const KEYER_ROWS = ['1234567890', 'AZERTYUIOP', 'QSDFGHJKLM', 'WXCVBN.'];

const KEYABLE = new Set(KEYER_ROWS.join(''));

/** Vrai si le manipulateur à clavier sait produire ce caractère. */
export function isKeyable(char: string): boolean {
  return char === ' ' || KEYABLE.has(char.toUpperCase());
}

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

// La comparaison de copie vit dans `core/copie.ts` : le mode histoire n'en
// est plus le seul client.
export { compareCopy, type CopyMark, type CopyResult } from './copie.ts';

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

    let longMessages = 0;
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
          problems.push(`Caractères non codables dans ${episode.id} : ${unknown.join(' ')}`);
        }
        // Un message à émettre doit être frappable : sinon l'épisode se bloque
        // sur un caractère que le clavier ne porte pas.
        if (beat.kind === 'send') {
          const absent = [...resolved.toUpperCase()].filter((char) => !isKeyable(char));
          if (absent.length > 0) {
            problems.push(`Caractères absents du clavier dans ${episode.id} : ${[...new Set(absent)].join(' ')}`);
          }
        }
        const size = resolved.trim().length;
        if (size > MAX_MESSAGE) {
          problems.push(`Message trop long dans ${episode.id} : ${size} caractères`);
        } else if (size > SHORT_MESSAGE) {
          longMessages += 1;
        }
      }
    }

    if (longMessages > MAX_LONG_PER_EPISODE) {
      problems.push(
        `Trop d’épreuves longues dans ${episode.id} : ${longMessages}. ` +
          'Le reste doit tenir en brèves.',
      );
    }

    // Le manipulateur à clavier n'existe pas avant 1960 ; l'épisode ne doit pas
    // demander ce que son époque ne peut pas fournir.
    if (keyersFor(episode.year).length === 0) {
      problems.push(`Aucun manipulateur disponible en ${episode.year} : ${episode.id}`);
    }
  }

  // Le catalogue recopie l'identifiant, la génération et le caractère
  // facultatif de chaque épisode, pour que les succès puissent les compter
  // sans charger cent kilo-octets de prose. C'est la seule recopie du dépôt :
  // elle se paie d'une vérification, sans quoi ajouter un épisode ferait
  // dériver les objectifs en silence.
  const catalogued = new Map(STORY_CATALOGUE.map((entry) => [entry.id, entry]));
  for (const episode of episodes) {
    const entry = catalogued.get(episode.id);
    if (!entry) {
      problems.push(`Absent du catalogue : ${episode.id} (voir data/story-catalogue.ts)`);
      continue;
    }
    catalogued.delete(episode.id);
    if (entry.generation !== episode.generation) {
      problems.push(
        `Catalogue : ${episode.id} est en génération ${entry.generation}, l’épisode dit ${episode.generation}`,
      );
    }
    if (entry.optional !== (episode.optional === true)) {
      problems.push(`Catalogue : ${episode.id} n’a pas le même caractère facultatif`);
    }
  }
  for (const orphan of catalogued.keys()) {
    problems.push(`Catalogue : ${orphan} ne correspond à aucun épisode`);
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
