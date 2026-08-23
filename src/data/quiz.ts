/**
 * Banque de questions de l'examen — modèle de données.
 *
 * Le questionnaire est séparé en trois fichiers : ce module décrit la forme
 * d'une question et les repères communs (épreuves, niveaux, thèmes), le moteur
 * `core/quiz.ts` tire les sessions et les corrige, la vue affiche. Rien ici ne
 * dépend du DOM : la banque se relit et se vérifie hors navigateur.
 *
 * Les questions sont rédigées pour ce site. Elles s'appuient sur le programme
 * officiel — qui n'appartient à personne — et renvoient chacune vers la page
 * de cours correspondante, de sorte qu'une erreur mène toujours quelque part.
 */

import { FACILE_REGLEMENTATION, FACILE_TECHNIQUE } from './quiz-facile.ts';
import { MOYEN_REGLEMENTATION, MOYEN_TECHNIQUE } from './quiz-moyen.ts';
import { DIFFICILE_REGLEMENTATION, DIFFICILE_TECHNIQUE } from './quiz-difficile.ts';
import { OPERATEUR_REGLEMENTATION, OPERATEUR_TECHNIQUE } from './quiz-operateur.ts';

export type QuizExam = 'reglementation' | 'technique';
export type QuizLevel = 'facile' | 'moyen' | 'difficile' | 'operateur';

export const EXAMS: readonly QuizExam[] = ['reglementation', 'technique'];
export const LEVELS: readonly QuizLevel[] = ['facile', 'moyen', 'difficile', 'operateur'];

export const EXAM_LABELS: Record<QuizExam, string> = {
  reglementation: 'Réglementation',
  technique: 'Technique',
};

/** Première lettre des identifiants : elle doit s'accorder avec l'épreuve. */
export const EXAM_PREFIX: Record<QuizExam, string> = {
  reglementation: 'R',
  technique: 'T',
};

export interface ExamRule {
  /** Nombre de questions de l'épreuve réelle. */
  questions: number;
  /** Durée de l'épreuve réelle, en minutes. */
  minutes: number;
}

/** Le format officiel : vingt questions, et la moyenne à chaque épreuve. */
export const EXAM_RULES: Record<QuizExam, ExamRule> = {
  reglementation: { questions: 20, minutes: 15 },
  technique: { questions: 20, minutes: 30 },
};

/** Une bonne réponse vaut un point, une erreur ne coûte rien, la moyenne suffit. */
export const PASS_RATIO = 0.5;
export const MAX_MARK = 20;

export interface LevelInfo {
  id: QuizLevel;
  label: string;
  icon: string;
  description: string;
}

export const LEVEL_INFO: Record<QuizLevel, LevelInfo> = {
  facile: {
    id: 'facile',
    label: 'Facile',
    icon: '🌱',
    description:
      'Une définition, une valeur à citer, une règle à reconnaître. De quoi vérifier qu’une lecture est passée.',
  },
  moyen: {
    id: 'moyen',
    label: 'Moyen',
    icon: '🌿',
    description:
      'Un raisonnement ou un calcul en une étape. Les propositions fausses sont plausibles, pas absurdes.',
  },
  difficile: {
    id: 'difficile',
    label: 'Difficile',
    icon: '🌳',
    description:
      'Deux notions à combiner, un calcul en deux temps, ou un piège d’unité. Au-dessus du niveau de l’examen.',
  },
  operateur: {
    id: 'operateur',
    label: 'Opérateur Radio',
    icon: '📡',
    description:
      'Le ton de l’épreuve réelle : formulation sèche, propositions voisines, aucune aide dans l’énoncé.',
  },
};

export interface QuizTopic {
  id: string;
  /** Segment central des identifiants de question, en majuscules. */
  code: string;
  label: string;
  exam: QuizExam;
  /** Page de cours à relire en cas d'erreur. */
  route: string;
}

export const QUIZ_TOPICS: QuizTopic[] = [
  // --- Réglementation ---
  { id: 'certificat', code: 'CERT', label: 'Le certificat et l’examen', exam: 'reglementation', route: '#/licence/examen' },
  { id: 'cadre', code: 'CADRE', label: 'Le cadre réglementaire', exam: 'reglementation', route: '#/licence/cadre' },
  { id: 'emissions', code: 'EMIS', label: 'Classes d’émission', exam: 'reglementation', route: '#/licence/emissions' },
  { id: 'bandes', code: 'BANDE', label: 'Bandes, statuts et puissances', exam: 'reglementation', route: '#/licence/bandes' },
  { id: 'trafic', code: 'TRAF', label: 'Le trafic et ses règles', exam: 'reglementation', route: '#/licence/trafic' },
  { id: 'station', code: 'STAT', label: 'La station et l’indicatif', exam: 'reglementation', route: '#/licence/station' },
  { id: 'securite', code: 'SECU', label: 'Brouillage et sécurité', exam: 'reglementation', route: '#/licence/securite' },

  // --- Technique ---
  { id: 'calcul', code: 'CALC', label: 'Calculs et multiples', exam: 'technique', route: '#/licence/calcul' },
  { id: 'ohm', code: 'OHM', label: 'Lois d’Ohm et de Joule', exam: 'technique', route: '#/licence/ohm' },
  { id: 'alternatif', code: 'ALT', label: 'Courant alternatif', exam: 'technique', route: '#/licence/alternatif' },
  { id: 'transformateurs', code: 'XFO', label: 'Transformateurs et mesures', exam: 'technique', route: '#/licence/transformateurs' },
  { id: 'circuits', code: 'CIRC', label: 'Filtres et circuits accordés', exam: 'technique', route: '#/licence/circuits' },
  { id: 'diodes', code: 'DIOD', label: 'Diodes et alimentations', exam: 'technique', route: '#/licence/diodes' },
  { id: 'transistors', code: 'TRAN', label: 'Transistors', exam: 'technique', route: '#/licence/transistors' },
  { id: 'etages', code: 'ETAG', label: 'Amplis, oscillateurs et mélangeurs', exam: 'technique', route: '#/licence/etages' },
  { id: 'numerique', code: 'NUM', label: 'Ampli op et logique', exam: 'technique', route: '#/licence/numerique' },
  { id: 'recepteurs', code: 'RECE', label: 'Récepteurs et émetteurs', exam: 'technique', route: '#/licence/recepteurs' },
  { id: 'modulations', code: 'MODU', label: 'Les modulations', exam: 'technique', route: '#/licence/modulations' },
  { id: 'decibels', code: 'DB', label: 'Décibels et puissances', exam: 'technique', route: '#/licence/decibels' },
  { id: 'antennes', code: 'ANT', label: 'Antennes et lignes', exam: 'technique', route: '#/licence/antennes' },
];

const TOPIC_INDEX = new Map(QUIZ_TOPICS.map((topic) => [topic.id, topic]));

export function topicById(id: string): QuizTopic | undefined {
  return TOPIC_INDEX.get(id);
}

export function topicsOf(exam: QuizExam): QuizTopic[] {
  return QUIZ_TOPICS.filter((topic) => topic.exam === exam);
}

/** Quatre propositions, une seule bonne : le format de l'épreuve réelle. */
export const CHOICE_COUNT = 4;

export interface Question {
  /** `R-CADRE-001` : lettre de l'épreuve, code du thème, numéro. */
  id: string;
  exam: QuizExam;
  level: QuizLevel;
  topic: string;
  prompt: string;
  choices: string[];
  /** Index de la bonne réponse dans `choices`, avant tout mélange. */
  answer: number;
  /** Pourquoi c'est celle-là — affiché à la correction, jamais avant. */
  explain: string;
  /** Renvoi vers une autre page que celle du thème, quand c'est plus utile. */
  route?: string;
}

/**
 * Plages de numéros réservées à chaque niveau.
 *
 * Les lots de questions sont écrits niveau par niveau, à des mois d'écart. Sans
 * cloisonnement, le lot suivant renumérote fatalement par-dessus le précédent —
 * et deux questions différentes portant le même identifiant fausseraient le
 * suivi de révision sans que rien ne le signale. `validateQuestions` fait
 * respecter cette table.
 */
export const LEVEL_RANGES: Record<QuizLevel, [number, number]> = {
  facile: [1, 99],
  moyen: [100, 199],
  difficile: [200, 299],
  operateur: [300, 399],
};

/** Numéro porté par un identifiant, ou `null` s'il est illisible. */
export function idNumber(id: string): number | null {
  const match = /-(\d{3})$/.exec(id);
  return match ? Number(match[1]) : null;
}

/**
 * Le vivier complet.
 *
 * Il est découpé par niveau : chaque lot vit dans son fichier, ce qui garde des
 * fichiers relisibles et fait correspondre l'organisation du code à celle de la
 * rédaction. L'ordre n'a aucune importance — le tirage mélange, et le moteur
 * dédoublonne.
 */
export const QUESTIONS: Question[] = [
  ...FACILE_REGLEMENTATION,
  ...FACILE_TECHNIQUE,
  ...MOYEN_REGLEMENTATION,
  ...MOYEN_TECHNIQUE,
  ...DIFFICILE_REGLEMENTATION,
  ...DIFFICILE_TECHNIQUE,
  ...OPERATEUR_REGLEMENTATION,
  ...OPERATEUR_TECHNIQUE,
];
