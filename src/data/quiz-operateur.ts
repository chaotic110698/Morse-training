/**
 * Niveau opérateur Radio — le ton de l'épreuve réelle : formulation sèche,
 * propositions voisines, aucune aide dans l'énoncé.
 *
 * Identifiants réservés : 300 à 399.
 */

import type { Question } from './quiz.ts';

export const OPERATEUR_REGLEMENTATION: Question[] = [];

export const OPERATEUR_TECHNIQUE: Question[] = [
  {
    id: 'T-RECE-300',
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
