/**
 * Niveau difficile — deux notions à combiner, un calcul en deux temps, ou un
 * piège d'unité. Au-dessus du niveau de l'examen.
 *
 * Identifiants réservés : 200 à 299.
 */

import type { Question } from './quiz.ts';

export const DIFFICILE_REGLEMENTATION: Question[] = [
  {
    id: 'R-STAT-200',
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
];

export const DIFFICILE_TECHNIQUE: Question[] = [
  {
    id: 'T-CIRC-200',
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
];
