/**
 * Succes.
 *
 * Chaque succes se decrit par une valeur mesuree et un objectif, ce qui permet
 * d'afficher une barre de progression plutot qu'un simple verrou. Les succes
 * sont evalues apres chaque session et le deblocage est horodate, de sorte
 * qu'un export JSON conserve l'historique.
 */

import type { Progress } from './progress.ts';

export type AchievementTier = 'bronze' | 'argent' | 'or';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: AchievementTier;
  group: 'assiduite' | 'ecoute' | 'emission' | 'maitrise';
  goal: number;
  /** Valeur atteinte, dans la meme unite que `goal`. */
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

export const ACHIEVEMENTS: Achievement[] = [
  // --- Assiduite ---
  {
    id: 'first-session',
    name: 'Premier contact',
    description: 'Terminer une premiere serie d’entrainement.',
    icon: '🎧',
    tier: 'bronze',
    group: 'assiduite',
    goal: 1,
    value: (p) => p.totals.sessions,
  },
  {
    id: 'sessions-10',
    name: 'Habitue du trafic',
    description: 'Terminer dix series.',
    icon: '📻',
    tier: 'bronze',
    group: 'assiduite',
    goal: 10,
    value: (p) => p.totals.sessions,
  },
  {
    id: 'sessions-50',
    name: 'Operateur regulier',
    description: 'Terminer cinquante series.',
    icon: '🛰️',
    tier: 'argent',
    group: 'assiduite',
    goal: 50,
    value: (p) => p.totals.sessions,
  },
  {
    id: 'sessions-200',
    name: 'Veteran des ondes',
    description: 'Terminer deux cents series.',
    icon: '🏛️',
    tier: 'or',
    group: 'assiduite',
    goal: 200,
    value: (p) => p.totals.sessions,
  },
  {
    id: 'streak-3',
    name: 'Trois jours de suite',
    description: 'S’entrainer trois jours consecutifs.',
    icon: '🔥',
    tier: 'bronze',
    group: 'assiduite',
    goal: 3,
    value: (p) => p.streak.longest,
  },
  {
    id: 'streak-7',
    name: 'Semaine complete',
    description: 'S’entrainer sept jours consecutifs.',
    icon: '🗓️',
    tier: 'argent',
    group: 'assiduite',
    goal: 7,
    value: (p) => p.streak.longest,
  },
  {
    id: 'streak-30',
    name: 'Trente jours sans rupture',
    description: 'S’entrainer trente jours consecutifs.',
    icon: '💎',
    tier: 'or',
    group: 'assiduite',
    goal: 30,
    value: (p) => p.streak.longest,
  },
  {
    id: 'time-1h',
    name: 'Une heure au casque',
    description: 'Cumuler une heure d’entrainement.',
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
    description: 'Cumuler dix heures d’entrainement.',
    icon: '🕰️',
    tier: 'or',
    group: 'assiduite',
    goal: 10,
    value: (p) => hours(p.totals.trainingMs),
    format: (v) => `${v.toFixed(1)} h`,
  },
  {
    id: 'all-modes',
    name: 'Touche-a-tout',
    description: 'Utiliser les quatre modes d’entrainement.',
    icon: '🧭',
    tier: 'argent',
    group: 'assiduite',
    goal: 4,
    value: distinctModes,
  },

  // --- Ecoute ---
  {
    id: 'copied-100',
    name: 'Premiers signaux',
    description: 'Reconnaitre cent caracteres.',
    icon: '✅',
    tier: 'bronze',
    group: 'ecoute',
    goal: 100,
    value: (p) => p.totals.correct,
  },
  {
    id: 'copied-1000',
    name: 'Mille signaux',
    description: 'Reconnaitre mille caracteres.',
    icon: '📈',
    tier: 'argent',
    group: 'ecoute',
    goal: 1000,
    value: (p) => p.totals.correct,
  },
  {
    id: 'copied-10000',
    name: 'Dix mille signaux',
    description: 'Reconnaitre dix mille caracteres.',
    icon: '🏆',
    tier: 'or',
    group: 'ecoute',
    goal: 10000,
    value: (p) => p.totals.correct,
  },
  {
    id: 'koch-10',
    name: 'Dix caracteres',
    description: 'Atteindre le niveau 10 de la methode Koch.',
    icon: '🔟',
    tier: 'bronze',
    group: 'ecoute',
    goal: 10,
    value: (p) => p.kochLevel,
  },
  {
    id: 'koch-26',
    name: 'Alphabet complet',
    description: 'Atteindre le niveau 26 de la methode Koch.',
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

  // --- Emission ---
  {
    id: 'sent-first',
    name: 'Premiere emission',
    description: 'Emettre un premier caractere au manipulateur.',
    icon: '🔑',
    tier: 'bronze',
    group: 'emission',
    goal: 1,
    value: (p) => p.totals.sent,
  },
  {
    id: 'sent-500',
    name: 'Manipulateur rode',
    description: 'Emettre cinq cents caracteres.',
    icon: '🤝',
    tier: 'argent',
    group: 'emission',
    goal: 500,
    value: (p) => p.totals.sent,
  },
  {
    id: 'sent-5000',
    name: 'Poignet d’acier',
    description: 'Emettre cinq mille caracteres.',
    icon: '💪',
    tier: 'or',
    group: 'emission',
    goal: 5000,
    value: (p) => p.totals.sent,
  },
  {
    id: 'sos',
    name: 'Appel de detresse',
    description: 'Emettre le signal SOS d’un seul tenant.',
    icon: '🆘',
    tier: 'argent',
    group: 'emission',
    goal: 1,
    value: (p) => (p.flags['sos'] ? 1 : 0),
  },
  {
    id: 'cq',
    name: 'CQ CQ CQ',
    description: 'Lancer un appel general au manipulateur.',
    icon: '📡',
    tier: 'bronze',
    group: 'emission',
    goal: 1,
    value: (p) => (p.flags['cq'] ? 1 : 0),
  },

  // --- Maitrise ---
  {
    id: 'perfect-session',
    name: 'Sans une faute',
    description: 'Terminer une serie d’au moins vingt reponses sans erreur.',
    icon: '🎯',
    tier: 'argent',
    group: 'maitrise',
    goal: 1,
    value: (p) => (bestSessionAccuracy(p, 20) >= 1 ? 1 : 0),
  },
  {
    id: 'accuracy-95',
    name: 'Main sure',
    description: 'Depasser 95 % de precision globale sur au moins deux cents reponses.',
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
    description: 'Reussir une serie a 15 WPM avec au moins 90 % de precision.',
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
    description: 'Reussir une serie a 20 WPM avec au moins 90 % de precision.',
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
    description: 'Reussir une serie a 25 WPM avec au moins 90 % de precision.',
    icon: '🚀',
    tier: 'or',
    group: 'maitrise',
    goal: 25,
    value: (p) => bestCleanSpeed(p, 0.9, 20),
    format: (v) => `${Math.round(v)} WPM`,
  },
  {
    id: 'reflex',
    name: 'Reflexe',
    description: 'Descendre sous 1,2 s de temps de reponse moyen sur cent reponses.',
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
];

export const ACHIEVEMENT_GROUPS: Array<{ id: Achievement['group']; label: string }> = [
  { id: 'assiduite', label: 'Assiduite' },
  { id: 'ecoute', label: 'Ecoute' },
  { id: 'emission', label: 'Emission' },
  { id: 'maitrise', label: 'Maitrise' },
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
 * Debloque les succes atteints et renvoie ceux qui viennent de l'etre, pour
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
  if (achievement.goal === 1) return status.unlocked ? 'Obtenu' : 'A obtenir';
  return `${Math.min(Math.floor(value), achievement.goal)} / ${achievement.goal}`;
}
