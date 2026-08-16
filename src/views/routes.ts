/** Table des pages : sert a la fois au routeur et a la navigation laterale. */

import { homeView } from './home.ts';
import { principlesView } from './learn-principles.ts';
import { historyView } from './learn-history.ts';
import { alphabetView } from './learn-alphabet.ts';
import { listenView } from './train-listen.ts';
import { sendView } from './train-send.ts';
import { wordsView } from './train-words.ts';
import { readView } from './train-read.ts';
import { statsView } from './stats.ts';
import { achievementsView } from './achievements.ts';
import { settingsView } from './settings.ts';
import type { RouteDefinition } from '../ui/router.ts';

export const NAV_GROUPS: Array<{ id: string; label: string }> = [
  { id: 'accueil', label: 'Accueil' },
  { id: 'apprendre', label: 'Apprendre' },
  { id: 'entrainement', label: 'S’entrainer' },
  { id: 'progression', label: 'Progression' },
  { id: 'reglages', label: 'Reglages' },
];

export const ROUTES: RouteDefinition[] = [
  {
    path: '/',
    label: 'Accueil',
    title: 'Accueil',
    description: 'Point de depart et etat de votre progression.',
    icon: '🏠',
    group: 'accueil',
    factory: homeView,
  },
  {
    path: '/apprendre/principes',
    label: 'Comprendre le morse',
    title: 'Comprendre le morse',
    description: "Les regles de duree, la vitesse, Farnsworth et Koch.",
    icon: '📐',
    group: 'apprendre',
    factory: principlesView,
  },
  {
    path: '/apprendre/histoire',
    label: 'Histoire',
    title: 'Histoire du morse',
    description: 'De 1794 a aujourd’hui, en dix jalons.',
    icon: '📜',
    group: 'apprendre',
    factory: historyView,
  },
  {
    path: '/apprendre/alphabet',
    label: 'Alphabet et lexique',
    title: 'Alphabet et lexique',
    description: 'Le code complet, ecoutable ligne a ligne.',
    icon: '🔤',
    group: 'apprendre',
    factory: alphabetView,
  },
  {
    path: '/entrainement/ecoute',
    label: 'Ecoute (Koch)',
    title: 'Entrainement a l’ecoute',
    description: 'Reconnaitre les caracteres au son, methode Koch.',
    icon: '🎧',
    group: 'entrainement',
    factory: listenView,
  },
  {
    path: '/entrainement/emission',
    label: 'Emission',
    title: 'Entrainement a l’emission',
    description: 'Manipulateur droit ou palettes iambiques.',
    icon: '🔑',
    group: 'entrainement',
    factory: sendView,
  },
  {
    path: '/entrainement/mots',
    label: 'Mots et indicatifs',
    title: 'Mots, codes Q et indicatifs',
    description: 'Copier des groupes entiers, pas seulement des caracteres.',
    icon: '📡',
    group: 'entrainement',
    factory: wordsView,
  },
  {
    path: '/entrainement/lecture',
    label: 'Lecture visuelle',
    title: 'Lecture visuelle',
    description: 'Reviser sans son, points et traits a l’ecran.',
    icon: '👁️',
    group: 'entrainement',
    factory: readView,
  },
  {
    path: '/progression/statistiques',
    label: 'Statistiques',
    title: 'Statistiques',
    description: 'Precision par caractere, points faibles, historique.',
    icon: '📊',
    group: 'progression',
    factory: statsView,
  },
  {
    path: '/progression/succes',
    label: 'Succes',
    title: 'Succes',
    description: 'Vos paliers, et l’export de votre progression.',
    icon: '🏅',
    group: 'progression',
    factory: achievementsView,
  },
  {
    path: '/reglages',
    label: 'Reglages',
    title: 'Reglages',
    description: 'Vitesse, son, manipulateur, sorties, donnees.',
    icon: '⚙️',
    group: 'reglages',
    factory: settingsView,
  },
];
