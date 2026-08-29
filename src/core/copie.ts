/**
 * Comparer une copie au message réel.
 *
 * Ce module vivait dans `core/story.ts`, où il était né. Il n'a pourtant rien
 * d'un module de récit : c'est la mesure d'une copie, et l'exercice de copie
 * suivie en a autant besoin que le mode histoire. L'y laisser aurait chargé
 * quatre-vingt-dix kilo-octets de prose dans le paquet d'un exercice qui n'en
 * lit pas une ligne.
 */

/** Une copie se juge en majuscules : la casse n'a aucun sens en morse. */
const normalise = (text: string): string => text.toUpperCase();

export type CopyMark =
  | { kind: 'ok'; char: string }
  | { kind: 'wrong'; char: string; typed: string }
  | { kind: 'missing'; char: string }
  | { kind: 'extra'; typed: string }
  /** Séparateur de mots, réinséré pour l'affichage : il ne compte pas. */
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

  // Les espaces ne comptent pas dans la note, mais une copie rendue d'un seul
  // bloc est illisible : on les replace là où le message les avait.
  const spaced: CopyMark[] = [];
  let letter = 0;
  const spacesBefore = new Map<number, number>();
  {
    let count = 0;
    for (const char of normalise(target)) {
      if (char === ' ') spacesBefore.set(count, (spacesBefore.get(count) ?? 0) + 1);
      else count += 1;
    }
  }
  for (const mark of path) {
    if (mark.kind !== 'extra') {
      for (let i = 0; i < (spacesBefore.get(letter) ?? 0); i += 1) spaced.push({ kind: 'space' });
      letter += 1;
    }
    spaced.push(mark);
  }
  for (let i = 0; i < (spacesBefore.get(letter) ?? 0); i += 1) spaced.push({ kind: 'space' });

  return {
    marks: spaced,
    correct,
    total: want.length,
    ratio: want.length === 0 ? 1 : correct / want.length,
    perfect: correct === want.length && path.length === want.length,
  };
}

