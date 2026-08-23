/**
 * Niveau moyen — un raisonnement ou un calcul en une étape.
 *
 * Identifiants réservés : 100 à 199.
 */

import type { Question } from './quiz.ts';

export const MOYEN_REGLEMENTATION: Question[] = [
  {
    id: 'R-TRAF-100',
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
    id: 'R-BANDE-100',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'bandes',
    prompt: 'Quelle puissance maximale un titulaire du certificat peut-il utiliser sur la bande des 20 mètres ?',
    choices: ['500 W', '120 W', '250 W', '1 000 W'],
    answer: 0,
    explain:
      'De 479 kHz à 28 MHz, la limite est de 500 W en sortie d’émetteur. Elle tombe à 250 W entre 28 et 30 MHz, puis à 120 W au-dessus de 30 MHz.',
  },
];

export const MOYEN_TECHNIQUE: Question[] = [
  {
    id: 'T-DB-100',
    exam: 'technique',
    level: 'moyen',
    topic: 'decibels',
    prompt: 'Un amplificateur de gain 3 dB reçoit 100 W à son entrée. Quelle puissance délivre-t-il ?',
    choices: ['200 W', '103 W', '300 W', '1 000 W'],
    answer: 0,
    explain:
      'Trois décibels doublent la puissance. Le gain en décibels s’ajoute quand les puissances se multiplient : 100 W × 2 = 200 W.',
  },
];
