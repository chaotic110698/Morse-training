/**
 * Parcours de la formation à la licence.
 *
 * Une seule table décrit l'ordre de lecture des chapitres et leur regroupement.
 * Trois choses s'en servent et doivent rester d'accord : le hub qui les
 * présente, le fil d'Ariane qui situe la page ouverte, et les flèches qui
 * mènent au chapitre suivant. Décrire cet ordre ailleurs qu'ici — dans le menu,
 * dans chaque vue — reviendrait à le maintenir trois fois.
 *
 * Les chemins renvoient aux routes ; `validateSyllabus` vérifie qu'aucun ne
 * pointe dans le vide et qu'aucun chapitre n'est oublié.
 */

export interface SyllabusBlock {
  id: string;
  title: string;
  /** Ce que le bloc apporte, en une phrase, pour le hub. */
  intent: string;
  icon: string;
  /** Chemins des pages, dans l'ordre de lecture. */
  paths: string[];
}

export const SYLLABUS: SyllabusBlock[] = [
  {
    id: 'depart',
    title: 'Par où commencer',
    intent:
      'Ce que le certificat autorise, comment l’examen se déroule, et de quoi vérifier ses acquis à tout moment.',
    icon: '🎓',
    paths: ['/licence/examen', '/licence/questionnaire'],
  },
  {
    id: 'reglementation',
    title: 'Réglementation',
    intent:
      'La première épreuve : vingt questions en quinze minutes sur les textes, les bandes et les règles de trafic.',
    icon: '⚖️',
    paths: [
      '/licence/cadre',
      '/licence/emissions',
      '/licence/bandes',
      '/licence/trafic',
      '/licence/station',
      '/licence/securite',
    ],
  },
  {
    id: 'technique',
    title: 'Technique',
    intent:
      'La seconde épreuve : vingt questions en trente minutes, du calcul de base jusqu’aux schémas d’émetteurs.',
    icon: '🔌',
    paths: [
      '/licence/calcul',
      '/licence/ohm',
      '/licence/alternatif',
      '/licence/transformateurs',
      '/licence/circuits',
      '/licence/decibels',
      '/licence/diodes',
      '/licence/transistors',
      '/licence/etages',
      '/licence/numerique',
      '/licence/recepteurs',
      '/licence/modulations',
      '/licence/antennes',
    ],
  },
  {
    id: 'references',
    title: 'À garder sous la main',
    intent: 'Les formules exigibles, rassemblées et imprimables pour la veille de l’examen.',
    icon: '📄',
    paths: ['/licence/formulaire'],
  },
];

/** Chemin du hub, exclu du parcours puisqu'il le contient. */
export const LICENCE_HUB = '/licence';

/** Tous les chemins du parcours, dans l'ordre de lecture. */
export function syllabusPaths(): string[] {
  return SYLLABUS.flatMap((block) => block.paths);
}

export interface SyllabusPosition {
  block: SyllabusBlock;
  /** Rang du chapitre dans son bloc, à partir de 1. */
  rank: number;
  /** Rang dans le parcours entier, à partir de 1. */
  overall: number;
  total: number;
  previous: string | null;
  next: string | null;
}

/** Situe une page dans le parcours, ou `null` si elle n'en fait pas partie. */
export function locate(path: string): SyllabusPosition | null {
  const block = SYLLABUS.find((entry) => entry.paths.includes(path));
  if (!block) return null;
  const all = syllabusPaths();
  const overall = all.indexOf(path);
  return {
    block,
    rank: block.paths.indexOf(path) + 1,
    overall: overall + 1,
    total: all.length,
    previous: overall > 0 ? (all[overall - 1] as string) : null,
    next: overall < all.length - 1 ? (all[overall + 1] as string) : null,
  };
}

/**
 * Vérifie l'accord entre le parcours et les routes réellement déclarées.
 *
 * Ajouter un chapitre sans le placer dans un bloc le rendrait introuvable :
 * il n'apparaîtrait ni au menu, qui ne liste plus que le hub, ni dans le hub.
 * Ce contrôle est appelé par la suite de tests.
 */
export function validateSyllabus(routePaths: readonly string[]): string[] {
  const problems: string[] = [];
  const declared = new Set(routePaths);
  const listed = new Set<string>();

  for (const block of SYLLABUS) {
    for (const path of block.paths) {
      if (!declared.has(path)) problems.push(`le parcours renvoie vers ${path}, qui n’est pas une route`);
      if (listed.has(path)) problems.push(`${path} apparaît deux fois dans le parcours`);
      listed.add(path);
    }
  }

  for (const path of routePaths) {
    if (!path.startsWith('/licence/')) continue;
    if (!listed.has(path)) problems.push(`${path} est une page de licence absente du parcours`);
  }

  return problems;
}
