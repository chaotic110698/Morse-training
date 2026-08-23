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
 * Le vivier.
 *
 * Ces premières questions servent à faire tourner le moteur ; le volume vient
 * ensuite, niveau par niveau. L'ordre du fichier n'a aucune importance, le
 * tirage mélange, et `validateQuestions` vérifie la cohérence de l'ensemble.
 */
export const QUESTIONS: Question[] = [
  {
    id: 'R-CERT-001',
    exam: 'reglementation',
    level: 'facile',
    topic: 'certificat',
    prompt: 'Quel organisme organise l’examen du certificat d’opérateur du service amateur en France ?',
    choices: [
      'L’ANFR, l’Agence nationale des fréquences',
      'L’ARCEP, l’Autorité de régulation des communications',
      'Le REF, Réseau des émetteurs français',
      'L’UIT, Union internationale des télécommunications',
    ],
    answer: 0,
    explain:
      'L’ANFR organise l’examen dans ses centres régionaux. L’ARCEP écrit la décision qui fixe les conditions d’utilisation, le REF est une association, et l’UIT travaille au niveau mondial.',
  },
  {
    id: 'R-TRAF-001',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'trafic',
    prompt:
      'Au cours d’une émission qui dure plus d’un quart d’heure sur la même fréquence, à quelle cadence l’indicatif doit-il être retransmis ?',
    choices: [
      'Toutes les quinze minutes',
      'Toutes les cinq minutes',
      'Toutes les dix minutes',
      'Une seule fois suffit, au début',
    ],
    answer: 0,
    explain:
      'L’indicatif se transmet au début et à la fin de toute période d’émission, toutes les quinze minutes au-delà d’un quart d’heure sur la même fréquence, et à chaque changement de fréquence.',
  },
  {
    id: 'R-BANDE-001',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'bandes',
    prompt: 'Quelle puissance maximale un titulaire du certificat peut-il utiliser sur la bande des 20 mètres ?',
    choices: ['500 W', '120 W', '250 W', '1 000 W'],
    answer: 0,
    explain:
      'De 479 kHz à 28 MHz, la limite est de 500 W en sortie d’émetteur. Elle tombe à 250 W entre 28 et 30 MHz, puis à 120 W au-dessus de 30 MHz.',
  },
  {
    id: 'R-STAT-001',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'station',
    prompt:
      'Un radioamateur français titulaire de l’indicatif F4ABC trafique depuis la Belgique sous le régime CEPT. Quel indicatif annonce-t-il ?',
    choices: ['ON/F4ABC', 'F4ABC/ON', 'F4ABC/P', 'F4ABC, sans changement'],
    answer: 0,
    explain:
      'Le régime CEPT impose le préfixe du pays visité, suivi d’une barre de fraction puis de l’indicatif d’origine. La Belgique utilise ON, d’où ON/F4ABC.',
  },
  {
    id: 'T-OHM-001',
    exam: 'technique',
    level: 'facile',
    topic: 'ohm',
    prompt: 'Une résistance de 100 Ω est parcourue par un courant de 0,5 A. Quelle tension mesure-t-on à ses bornes ?',
    choices: ['50 V', '200 V', '5 V', '0,005 V'],
    answer: 0,
    explain: 'La loi d’Ohm donne U = R × I, soit 100 × 0,5 = 50 V.',
  },
  {
    id: 'T-DB-001',
    exam: 'technique',
    level: 'moyen',
    topic: 'decibels',
    prompt: 'Un amplificateur de gain 3 dB reçoit 100 W à son entrée. Quelle puissance délivre-t-il ?',
    choices: ['200 W', '103 W', '300 W', '1 000 W'],
    answer: 0,
    explain:
      'Trois décibels doublent la puissance. Le gain en décibels s’ajoute quand les puissances se multiplient : 100 W × 2 = 200 W.',
  },
  {
    id: 'T-CIRC-001',
    exam: 'technique',
    level: 'difficile',
    topic: 'circuits',
    prompt:
      'Dans un circuit accordé, on divise la capacité par quatre sans toucher à l’inductance. Que devient la fréquence de résonance ?',
    choices: [
      'Elle double',
      'Elle est divisée par deux',
      'Elle est multipliée par quatre',
      'Elle ne change pas',
    ],
    answer: 0,
    explain:
      'La loi de Thomson place L et C sous une racine carrée : diviser C par quatre divise le produit L × C par quatre, donc sa racine par deux, et la fréquence — qui en est l’inverse — double.',
  },
  {
    id: 'T-RECE-001',
    exam: 'technique',
    level: 'operateur',
    topic: 'recepteurs',
    prompt:
      'Un récepteur superhétérodyne reçoit un signal à 14 MHz avec un oscillateur local réglé sur 5 MHz. Quelle est la fréquence image ?',
    choices: ['4 MHz', '19 MHz', '9 MHz', '24 MHz'],
    answer: 0,
    explain:
      'La fréquence intermédiaire vaut 14 − 5 = 9 MHz. L’image est la fréquence qui donne la même FI par l’autre produit du mélangeur : 4 + 5 = 9 MHz. Elle vaut donc 4 MHz.',
  },
];
