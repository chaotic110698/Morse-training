/**
 * Succès.
 *
 * Chaque succès se décrit par une valeur mesurée et un objectif, ce qui permet
 * d'afficher une barre de progression plutôt qu'un simple verrou. Les succès
 * sont évalués après chaque session et le déblocage est horodaté, de sorte
 * qu'un export JSON conserve l'historique.
 */

import type { Progress, StoryEpisodeRecord } from './progress.ts';
import {
  STORY_CATALOGUE,
  STORY_GENERATIONS,
  STORY_LORE,
  STORY_REQUIRED,
} from '../data/story-catalogue.ts';

export type AchievementTier = 'bronze' | 'argent' | 'or';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: AchievementTier;
  group: 'assiduite' | 'ecoute' | 'emission' | 'maitrise' | 'histoire';
  goal: number;
  /** Valeur atteinte, dans la même unité que `goal`. */
  value: (progress: Progress) => number;
  /** Mise en forme de la valeur, pour l'affichage. */
  format?: (value: number) => string;
}

const distinctModes = (progress: Progress): number =>
  new Set(progress.sessions.map((session) => session.mode)).size;

const bestSessionAccuracy = (progress: Progress, minAttempts: number): number => {
  let best = 0;
  for (const session of progress.sessions) {
    if (session.attempts < minAttempts) continue;
    best = Math.max(best, session.correct / session.attempts);
  }
  return best;
};

const bestCleanSpeed = (progress: Progress, minAccuracy: number, minAttempts: number): number => {
  let best = 0;
  for (const session of progress.sessions) {
    if (session.attempts < minAttempts) continue;
    if (session.correct / session.attempts < minAccuracy) continue;
    best = Math.max(best, session.charWpm);
  }
  return best;
};

const averageResponseMs = (progress: Progress): number => {
  let attempts = 0;
  let total = 0;
  for (const stat of Object.values(progress.chars)) {
    attempts += stat.attempts;
    total += stat.totalMs;
  }
  return attempts >= 100 ? total / attempts : Number.POSITIVE_INFINITY;
};

const hours = (ms: number): number => ms / 3_600_000;

/**
 * Le mode histoire compte ses épisodes menés à leur terme, jamais ceux qu'on a
 * seulement entamés. On passe par le catalogue plutôt que par les épisodes :
 * ceux-ci pèsent une centaine de kilo-octets de prose, chargés à la demande, et
 * les succès sont évalués au démarrage.
 */
const finished = (progress: Progress): StoryEpisodeRecord[] =>
  STORY_CATALOGUE.map((entry) => progress.story.episodes[entry.id]).filter(
    (record): record is StoryEpisodeRecord => record?.completed === true,
  );

/** Combien de générations comptent au moins un épisode terminé. */
const generationsTouched = (progress: Progress): number =>
  new Set(
    STORY_CATALOGUE.filter((entry) => progress.story.episodes[entry.id]?.completed).map(
      (entry) => entry.generation,
    ),
  ).size;

const cleared = (progress: Progress, optional: boolean): number =>
  STORY_CATALOGUE.filter(
    (entry) => entry.optional === optional && progress.story.episodes[entry.id]?.completed,
  ).length;

export const ACHIEVEMENTS: Achievement[] = [
  // --- Assiduité ---
  {
    id: 'first-session',
    name: 'Premier contact',
    description: 'Terminer une première série d’entraînement.',
    icon: '🎧',
    tier: 'bronze',
    group: 'assiduite',
    goal: 1,
    value: (p) => p.totals.sessions,
  },
  {
    id: 'sessions-10',
    name: 'Habitué du trafic',
    description: 'Terminer dix séries.',
    icon: '📻',
    tier: 'bronze',
    group: 'assiduite',
    goal: 10,
    value: (p) => p.totals.sessions,
  },
  {
    id: 'sessions-50',
    name: 'Opérateur régulier',
    description: 'Terminer cinquante séries.',
    icon: '🛰️',
    tier: 'argent',
    group: 'assiduite',
    goal: 50,
    value: (p) => p.totals.sessions,
  },
  {
    id: 'sessions-200',
    name: 'Vétéran des ondes',
    description: 'Terminer deux cents séries.',
    icon: '🏛️',
    tier: 'or',
    group: 'assiduite',
    goal: 200,
    value: (p) => p.totals.sessions,
  },
  {
    id: 'streak-3',
    name: 'Trois jours de suite',
    description: 'S’entraîner trois jours consécutifs.',
    icon: '🔥',
    tier: 'bronze',
    group: 'assiduite',
    goal: 3,
    value: (p) => p.streak.longest,
  },
  {
    id: 'streak-7',
    name: 'Semaine complète',
    description: 'S’entraîner sept jours consécutifs.',
    icon: '🗓️',
    tier: 'argent',
    group: 'assiduite',
    goal: 7,
    value: (p) => p.streak.longest,
  },
  {
    id: 'streak-30',
    name: 'Trente jours sans rupture',
    description: 'S’entraîner trente jours consécutifs.',
    icon: '💎',
    tier: 'or',
    group: 'assiduite',
    goal: 30,
    value: (p) => p.streak.longest,
  },
  {
    id: 'time-1h',
    name: 'Une heure au casque',
    description: 'Cumuler une heure d’entraînement.',
    icon: '⏱️',
    tier: 'bronze',
    group: 'assiduite',
    goal: 1,
    value: (p) => hours(p.totals.trainingMs),
    format: (v) => `${v.toFixed(1)} h`,
  },
  {
    id: 'time-10h',
    name: 'Dix heures au casque',
    description: 'Cumuler dix heures d’entraînement.',
    icon: '🕰️',
    tier: 'or',
    group: 'assiduite',
    goal: 10,
    value: (p) => hours(p.totals.trainingMs),
    format: (v) => `${v.toFixed(1)} h`,
  },
  {
    id: 'all-modes',
    name: 'Touche-à-tout',
    description: 'Utiliser les quatre modes d’entraînement.',
    icon: '🧭',
    tier: 'argent',
    group: 'assiduite',
    goal: 4,
    value: distinctModes,
  },

  // --- Écoute ---
  {
    id: 'copied-100',
    name: 'Premiers signaux',
    description: 'Reconnaître cent caractères.',
    icon: '✅',
    tier: 'bronze',
    group: 'ecoute',
    goal: 100,
    value: (p) => p.totals.correct,
  },
  {
    id: 'copied-1000',
    name: 'Mille signaux',
    description: 'Reconnaître mille caractères.',
    icon: '📈',
    tier: 'argent',
    group: 'ecoute',
    goal: 1000,
    value: (p) => p.totals.correct,
  },
  {
    id: 'copied-10000',
    name: 'Dix mille signaux',
    description: 'Reconnaître dix mille caractères.',
    icon: '🏆',
    tier: 'or',
    group: 'ecoute',
    goal: 10000,
    value: (p) => p.totals.correct,
  },
  {
    id: 'koch-10',
    name: 'Dix caractères',
    description: 'Atteindre le niveau 10 de la méthode Koch.',
    icon: '🔟',
    tier: 'bronze',
    group: 'ecoute',
    goal: 10,
    value: (p) => p.kochLevel,
  },
  {
    id: 'koch-26',
    name: 'Alphabet complet',
    description: 'Atteindre le niveau 26 de la méthode Koch.',
    icon: '🔤',
    tier: 'argent',
    group: 'ecoute',
    goal: 26,
    value: (p) => p.kochLevel,
  },
  {
    id: 'koch-40',
    name: 'Jeu complet',
    description: 'Atteindre le niveau 40 : lettres, chiffres et ponctuation.',
    icon: '🌐',
    tier: 'or',
    group: 'ecoute',
    goal: 40,
    value: (p) => p.kochLevel,
  },

  // --- Émission ---
  {
    id: 'sent-first',
    name: 'Première émission',
    description: 'Émettre un premier caractère au manipulateur.',
    icon: '🔑',
    tier: 'bronze',
    group: 'emission',
    goal: 1,
    value: (p) => p.totals.sent,
  },
  {
    id: 'sent-500',
    name: 'Manipulateur rodé',
    description: 'Émettre cinq cents caractères.',
    icon: '🤝',
    tier: 'argent',
    group: 'emission',
    goal: 500,
    value: (p) => p.totals.sent,
  },
  {
    id: 'sent-5000',
    name: 'Poignet d’acier',
    description: 'Émettre cinq mille caractères.',
    icon: '💪',
    tier: 'or',
    group: 'emission',
    goal: 5000,
    value: (p) => p.totals.sent,
  },
  {
    id: 'sos',
    name: 'Appel de détresse',
    description: 'Émettre le signal SOS d’un seul tenant.',
    icon: '🆘',
    tier: 'argent',
    group: 'emission',
    goal: 1,
    value: (p) => (p.flags['sos'] ? 1 : 0),
  },
  {
    id: 'cq',
    name: 'CQ CQ CQ',
    description: 'Lancer un appel général au manipulateur.',
    icon: '📡',
    tier: 'bronze',
    group: 'emission',
    goal: 1,
    value: (p) => (p.flags['cq'] ? 1 : 0),
  },

  // --- Maîtrise ---
  {
    id: 'perfect-session',
    name: 'Sans une faute',
    description: 'Terminer une série d’au moins vingt réponses sans erreur.',
    icon: '🎯',
    tier: 'argent',
    group: 'maitrise',
    goal: 1,
    value: (p) => (bestSessionAccuracy(p, 20) >= 1 ? 1 : 0),
  },
  {
    id: 'accuracy-95',
    name: 'Main sûre',
    description: 'Dépasser 95 % de précision globale sur au moins deux cents réponses.',
    icon: '🧠',
    tier: 'or',
    group: 'maitrise',
    goal: 1,
    value: (p) =>
      p.totals.attempts >= 200 && p.totals.correct / p.totals.attempts >= 0.95 ? 1 : 0,
  },
  {
    id: 'speed-15',
    name: '15 mots par minute',
    description: 'Réussir une série à 15 WPM avec au moins 90 % de précision.',
    icon: '🚴',
    tier: 'bronze',
    group: 'maitrise',
    goal: 15,
    value: (p) => bestCleanSpeed(p, 0.9, 20),
    format: (v) => `${Math.round(v)} WPM`,
  },
  {
    id: 'speed-20',
    name: '20 mots par minute',
    description: 'Réussir une série à 20 WPM avec au moins 90 % de précision.',
    icon: '🏍️',
    tier: 'argent',
    group: 'maitrise',
    goal: 20,
    value: (p) => bestCleanSpeed(p, 0.9, 20),
    format: (v) => `${Math.round(v)} WPM`,
  },
  {
    id: 'speed-25',
    name: '25 mots par minute',
    description: 'Réussir une série à 25 WPM avec au moins 90 % de précision.',
    icon: '🚀',
    tier: 'or',
    group: 'maitrise',
    goal: 25,
    value: (p) => bestCleanSpeed(p, 0.9, 20),
    format: (v) => `${Math.round(v)} WPM`,
  },
  {
    id: 'reflex',
    name: 'Réflexe',
    description: 'Descendre sous 1,2 s de temps de réponse moyen sur cent réponses.',
    icon: '⚡',
    tier: 'argent',
    group: 'maitrise',
    goal: 1,
    value: (p) => (averageResponseMs(p) <= 1200 ? 1 : 0),
  },
  {
    id: 'historian',
    name: 'Historien',
    description: 'Lire la page d’histoire du morse jusqu’au bout.',
    icon: '📜',
    tier: 'bronze',
    group: 'maitrise',
    goal: 1,
    value: (p) => (p.flags['history-read'] ? 1 : 0),
  },

  // --- Mode histoire ---
  {
    id: 'story-first',
    name: 'Premier quart',
    description: 'Mener un premier épisode du mode histoire à son terme.',
    icon: '📻',
    tier: 'bronze',
    group: 'histoire',
    goal: 1,
    value: (p) => finished(p).length,
  },
  {
    id: 'story-generations',
    name: 'La lignée',
    description: 'Terminer au moins un épisode de chacune des cinq générations.',
    icon: '🧬',
    tier: 'argent',
    group: 'histoire',
    goal: STORY_GENERATIONS,
    value: generationsTouched,
  },
  {
    id: 'story-lore',
    name: 'Entre les ondes',
    description: 'Terminer tous les épisodes facultatifs, ceux qui ne racontent que la famille.',
    icon: '📖',
    tier: 'argent',
    group: 'histoire',
    goal: STORY_LORE,
    value: (p) => cleared(p, true),
  },
  {
    id: 'story-all',
    name: 'Cent cinquante-cinq ans',
    description: 'Terminer tous les épisodes du récit, de 1844 à 1999.',
    icon: '🏛️',
    tier: 'or',
    group: 'histoire',
    goal: STORY_REQUIRED,
    value: (p) => cleared(p, false),
  },
  {
    id: 'story-no-table',
    name: 'De mémoire',
    description: 'Terminer un épisode sans jamais déplier la table de déchiffrage.',
    icon: '🧠',
    tier: 'argent',
    group: 'histoire',
    goal: 1,
    value: (p) => finished(p).filter((record) => record.withoutTable).length,
  },
  {
    id: 'story-clean-hand',
    name: 'Main sûre',
    description: 'Terminer un épisode sans une seule erreur de manipulation.',
    icon: '🤚',
    tier: 'argent',
    group: 'histoire',
    goal: 1,
    value: (p) => finished(p).filter((record) => record.errors === 0).length,
  },
  {
    id: 'story-operator',
    name: 'Conditions réelles',
    description: 'Terminer un épisode en niveau opérateur, sans les aides du site.',
    icon: '🎚️',
    tier: 'argent',
    group: 'histoire',
    goal: 1,
    value: (p) => finished(p).filter((record) => record.operatorClear).length,
  },
  {
    id: 'story-operator-5',
    name: 'Le métier',
    description: 'Terminer cinq épisodes en niveau opérateur.',
    icon: '⚓',
    tier: 'or',
    group: 'histoire',
    goal: 5,
    value: (p) => finished(p).filter((record) => record.operatorClear).length,
  },
  {
    id: 'story-perfect-copy',
    name: 'Copie parfaite',
    description: 'Relever un message du récit sans en manquer un seul caractère.',
    icon: '✍️',
    tier: 'or',
    group: 'histoire',
    goal: 1,
    value: (p) => finished(p).filter((record) => record.bestCopy >= 1).length,
  },
];

export const ACHIEVEMENT_GROUPS: Array<{ id: Achievement['group']; label: string }> = [
  { id: 'assiduite', label: 'Assiduité' },
  { id: 'ecoute', label: 'Écoute' },
  { id: 'emission', label: 'Émission' },
  { id: 'maitrise', label: 'Maîtrise' },
  { id: 'histoire', label: 'Mode histoire' },
];

export interface AchievementStatus {
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt: number | null;
  value: number;
  ratio: number;
}

export function evaluateAchievements(progress: Progress): AchievementStatus[] {
  return ACHIEVEMENTS.map((achievement) => {
    const value = achievement.value(progress);
    const unlockedAt = progress.achievements[achievement.id] ?? null;
    return {
      achievement,
      unlocked: unlockedAt !== null,
      unlockedAt,
      value,
      ratio: Math.max(0, Math.min(1, value / achievement.goal)),
    };
  });
}

/**
 * Débloqué les succès atteints et renvoie ceux qui viennent de l'être, pour
 * que l'interface puisse les annoncer.
 */
export function unlockAchievements(progress: Progress): Achievement[] {
  const now = Date.now();
  const freshly: Achievement[] = [];
  for (const achievement of ACHIEVEMENTS) {
    if (progress.achievements[achievement.id]) continue;
    if (achievement.value(progress) >= achievement.goal) {
      progress.achievements[achievement.id] = now;
      freshly.push(achievement);
    }
  }
  return freshly;
}

export function formatAchievementValue(status: AchievementStatus): string {
  const { achievement, value } = status;
  if (achievement.format) return achievement.format(value);
  if (achievement.goal === 1) return status.unlocked ? 'Obtenu' : 'À obtenir';
  return `${Math.min(Math.floor(value), achievement.goal)} / ${achievement.goal}`;
}
