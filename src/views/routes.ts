/** Table des pages : sert à la fois au routeur et à la navigation latérale. */

import { homeView } from './home.ts';
import { principlesView } from './learn-principles.ts';
import { historyView } from './learn-history.ts';
import { alphabetView } from './learn-alphabet.ts';
import { phoneticView } from './learn-phonetic.ts';
import { communicationView } from './learn-communication.ts';
import { radioView } from './learn-radio.ts';
import { licenceExamView } from './licence-exam.ts';
import { licenceFrameworkView } from './licence-framework.ts';
import { licenceEmissionsView } from './licence-emissions.ts';
import { licenceBandsView } from './licence-bands.ts';
import { licenceTrafficView } from './licence-traffic.ts';
import { licenceStationView } from './licence-station.ts';
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
  { id: 'licence', label: 'Licence' },
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
    path: '/apprendre/communication',
    label: 'Communiquer en morse',
    title: 'Communiquer en morse',
    description: 'Signaux de procédure, codes Q, abréviations et indicatifs.',
    icon: '💬',
    group: 'apprendre',
    factory: communicationView,
  },
  {
    path: '/apprendre/radio',
    label: 'Comprendre la radio',
    title: 'Comprendre la radio',
    description: 'Ondes, bandes, propagation et modes d’émission.',
    icon: '📻',
    group: 'apprendre',
    factory: radioView,
  },
  {
    path: '/licence/examen',
    label: 'Le certificat d’opérateur',
    title: 'Le certificat d’opérateur',
    description: 'Ce que la licence autorise, et comment se passe l’examen.',
    icon: '🎓',
    group: 'licence',
    factory: licenceExamView,
  },
  {
    path: '/licence/cadre',
    label: 'Le cadre réglementaire',
    title: 'Le cadre réglementaire',
    description: 'Qui décide quoi, du traité mondial à l’arrêté français.',
    icon: '⚖️',
    group: 'licence',
    factory: licenceFrameworkView,
  },
  {
    path: '/licence/emissions',
    label: 'Classes d’émission',
    title: 'Classes d’émission et conditions techniques',
    description: 'Les trois caractères, et ce que la station doit respecter.',
    icon: '📶',
    group: 'licence',
    factory: licenceEmissionsView,
  },
  {
    path: '/licence/bandes',
    label: 'Bandes et puissances',
    title: 'Fréquences, puissances et statuts',
    description: 'Les vingt-cinq bandes de la région 1, leur statut et leurs limites.',
    icon: '🎚️',
    group: 'licence',
    factory: licenceBandsView,
  },
  {
    path: '/licence/trafic',
    label: 'Le trafic et ses règles',
    title: 'Le trafic et ses règles',
    description: 'S’identifier, écouter, ce qu’on peut dire, et le journal de bord.',
    icon: '📋',
    group: 'licence',
    factory: licenceTrafficView,
  },
  {
    path: '/licence/station',
    label: 'La station et l’indicatif',
    title: 'La station et l’indicatif',
    description: 'Structure des indicatifs, déclarations, sanctions et trafic à l’étranger.',
    icon: '🪪',
    group: 'licence',
    factory: licenceStationView,
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
