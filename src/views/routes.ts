/** Table des pages : sert à la fois au routeur et à la navigation latérale. */

import { homeView } from './home.ts';
import { principlesView } from './learn-principles.ts';
import { historyView } from './learn-history.ts';
import { alphabetView } from './learn-alphabet.ts';
import { phoneticView } from './learn-phonetic.ts';
import { listenView } from './train-listen.ts';
import { sendView } from './train-send.ts';
import { wordsView } from './train-words.ts';
import { readView } from './train-read.ts';
import { statsView } from './stats.ts';
import { achievementsView } from './achievements.ts';
import { settingsView } from './settings.ts';
import { translateView } from './translate.ts';
import { recordView } from './record.ts';
import type { RouteDefinition } from '../ui/router.ts';

export const NAV_GROUPS: Array<{ id: string; label: string }> = [
  { id: 'accueil', label: 'Accueil' },
  { id: 'apprendre', label: 'Apprendre' },
  { id: 'entrainement', label: 'S’entraîner' },
  { id: 'outils', label: 'Outils' },
  { id: 'progression', label: 'Progression' },
  { id: 'reglages', label: 'Réglages' },
];

export const ROUTES: RouteDefinition[] = [
  {
    path: '/',
    label: 'Accueil',
    title: 'Accueil',
    description: 'Point de départ et état de votre progression.',
    icon: '🏠',
    group: 'accueil',
    factory: homeView,
  },
  {
    path: '/apprendre/principes',
    label: 'Comprendre le morse',
    title: 'Comprendre le morse',
    description: "Les règles de durée, la vitesse, Farnsworth et Koch.",
    icon: '📐',
    group: 'apprendre',
    factory: principlesView,
  },
  {
    path: '/apprendre/histoire',
    label: 'Histoire',
    title: 'Histoire du morse',
    description: 'De 1794 à aujourd’hui, en dix jalons.',
    icon: '📜',
    group: 'apprendre',
    factory: historyView,
  },
  {
    path: '/apprendre/alphabet',
    label: 'Alphabet et lexique',
    title: 'Alphabet et lexique',
    description: 'Le code complet, écoutable ligne à ligne.',
    icon: '🔤',
    group: 'apprendre',
    factory: alphabetView,
  },
  {
    path: '/apprendre/alphabet-otan',
    label: 'Alphabet OTAN',
    title: 'Alphabet OTAN',
    description: 'Épeler à la voix : Alfa, Bravo, Charlie…',
    icon: '🗣️',
    group: 'apprendre',
    factory: phoneticView,
  },
  {
    path: '/entrainement/ecoute',
    label: 'Écoute (Koch)',
    title: 'Entraînement à l’écoute',
    description: 'Reconnaître les caractères au son, méthode Koch.',
    icon: '🎧',
    group: 'entrainement',
    factory: listenView,
  },
  {
    path: '/entrainement/emission',
    label: 'Émission',
    title: 'Entraînement à l’émission',
    description: 'Manipulateur droit ou palettes iambiques.',
    icon: '🔑',
    group: 'entrainement',
    factory: sendView,
  },
  {
    path: '/entrainement/mots',
    label: 'Mots et indicatifs',
    title: 'Mots, codes Q et indicatifs',
    description: 'Copier des groupes entiers, pas seulement des caractères.',
    icon: '📡',
    group: 'entrainement',
    factory: wordsView,
  },
  {
    path: '/entrainement/lecture',
    label: 'Lecture visuelle',
    title: 'Lecture visuelle',
    description: 'Réviser sans son, points et traits à l’écran.',
    icon: '👁️',
    group: 'entrainement',
    factory: readView,
  },
  {
    path: '/outils/traducteur',
    label: 'Traducteur',
    title: 'Traducteur texte et morse',
    description: 'Traduire dans les deux sens, écouter, et émettre en lumière.',
    icon: '🔁',
    group: 'outils',
    factory: translateView,
  },
  {
    path: '/outils/enregistreur',
    label: 'Enregistreur',
    title: 'Enregistreur d’émission',
    description: 'Capter sa frappe et l’exporter en audio et en texte.',
    icon: '🎙️',
    group: 'outils',
    factory: recordView,
  },
  {
    path: '/progression/statistiques',
    label: 'Statistiques',
    title: 'Statistiques',
    description: 'Précision par caractère, points faibles, historique.',
    icon: '📊',
    group: 'progression',
    factory: statsView,
  },
  {
    path: '/progression/succes',
    label: 'Succès',
    title: 'Succès',
    description: 'Vos paliers, et l’export de votre progression.',
    icon: '🏅',
    group: 'progression',
    factory: achievementsView,
  },
  {
    path: '/reglages',
    label: 'Réglages',
    title: 'Réglages',
    description: 'Vitesse, son, manipulateur, sorties, données.',
    icon: '⚙️',
    group: 'reglages',
    factory: settingsView,
  },
];
