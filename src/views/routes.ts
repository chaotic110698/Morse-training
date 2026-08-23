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
import { licenceDecibelsView } from './licence-decibels.ts';
import { licenceAntennasView } from './licence-antennas.ts';
import { licenceSafetyView } from './licence-safety.ts';
import { licenceMathsView } from './licence-maths.ts';
import { licenceOhmView } from './licence-ohm.ts';
import { licenceAcView } from './licence-ac.ts';
import { licenceTransformersView } from './licence-transformers.ts';
import { licenceCircuitsView } from './licence-circuits.ts';
import { licenceDiodesView } from './licence-diodes.ts';
import { licenceTransistorsView } from './licence-transistors.ts';
import { licenceStagesView } from './licence-stages.ts';
import { licenceDigitalView } from './licence-digital.ts';
import { licenceReceiversView } from './licence-receivers.ts';
import { licenceModulationsView } from './licence-modulations.ts';
import { licenceFormularyView } from './licence-formulary.ts';
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
    path: '/licence/decibels',
    label: 'Décibels et puissances',
    title: 'Décibels et puissances',
    description: 'Les neuf rapports, les unités de référence, le rendement.',
    icon: '🧮',
    group: 'licence',
    factory: licenceDecibelsView,
  },
  {
    path: '/licence/antennes',
    label: 'Antennes et lignes',
    title: 'Antennes et lignes de transmission',
    description: 'Dimensionner, calculer une PAR, mesurer des ondes stationnaires.',
    icon: '🗼',
    group: 'licence',
    factory: licenceAntennasView,
  },
  {
    path: '/licence/securite',
    label: 'Brouillage et sécurité',
    title: 'Brouillage et sécurité',
    description: 'Compatibilité électromagnétique, protection des personnes, foudre.',
    icon: '⚡',
    group: 'licence',
    factory: licenceSafetyView,
  },
  {
    path: '/licence/calcul',
    label: 'Calculer sans se tromper',
    title: 'Calculer sans se tromper',
    description: 'Transformer une équation, manier les multiples, préparer son brouillon.',
    icon: '🔢',
    group: 'licence',
    factory: licenceMathsView,
  },
  {
    path: '/licence/ohm',
    label: 'Lois d’Ohm et de Joule',
    title: 'Lois d’Ohm et de Joule',
    description: 'Quatre grandeurs, douze équations, le code des couleurs et les groupements.',
    icon: '🔌',
    group: 'licence',
    factory: licenceOhmView,
  },
  {
    path: '/licence/alternatif',
    label: 'Courant alternatif',
    title: 'Courant alternatif, bobines et condensateurs',
    description: 'Valeurs efficaces, réactance, capacitance et constante de temps.',
    icon: '〰️',
    group: 'licence',
    factory: licenceAcView,
  },
  {
    path: '/licence/transformateurs',
    label: 'Transformateurs et mesures',
    title: 'Transformateurs, piles et mesures',
    description: 'Rapport de spires, piles, galvanomètre et instruments de mesure.',
    icon: '🔋',
    group: 'licence',
    factory: licenceTransformersView,
  },
  {
    path: '/licence/circuits',
    label: 'Filtres et circuits accordés',
    title: 'Filtres et circuits accordés',
    description: 'Fréquence de coupure, loi de Thomson, facteur Q et bande passante.',
    icon: '🎛️',
    group: 'licence',
    factory: licenceCircuitsView,
  },
  {
    path: '/licence/diodes',
    label: 'Diodes et alimentations',
    title: 'Diodes et alimentations',
    description: 'La jonction PN, les familles de diodes, redresser et stabiliser.',
    icon: '▶️',
    group: 'licence',
    factory: licenceDiodesView,
  },
  {
    path: '/licence/transistors',
    label: 'Transistors',
    title: 'Transistors',
    description: 'NPN et PNP, le gain, les trois montages, FET et tubes.',
    icon: '🧩',
    group: 'licence',
    factory: licenceTransistorsView,
  },
  {
    path: '/licence/etages',
    label: 'Amplis et mélangeurs',
    title: 'Amplificateurs, oscillateurs et mélangeurs',
    description: 'Classes d’amplification, oscillateurs, quartz, multiplicateurs et mélange.',
    icon: '📢',
    group: 'licence',
    factory: licenceStagesView,
  },
  {
    path: '/licence/numerique',
    label: 'Ampli op et logique',
    title: 'Amplificateurs opérationnels et circuits logiques',
    description: 'Contre-réaction, portes logiques, binaire et numérisation.',
    icon: '🔣',
    group: 'licence',
    factory: licenceDigitalView,
  },
  {
    path: '/licence/recepteurs',
    label: 'Récepteurs et émetteurs',
    title: 'Récepteurs et émetteurs',
    description: 'Synoptiques, superhétérodyne, fréquence image et échelle S.',
    icon: '📺',
    group: 'licence',
    factory: licenceReceiversView,
  },
  {
    path: '/licence/modulations',
    label: 'Les modulations',
    title: 'Les modulations',
    description: 'AM, BLU, FM, modes numériques — et la CW pour ce qu’elle est.',
    icon: '🌊',
    group: 'licence',
    factory: licenceModulationsView,
  },
  {
    path: '/licence/formulaire',
    label: 'Formulaire',
    title: 'Formulaire',
    description: 'Toutes les formules exigibles, filtrables et imprimables.',
    icon: '📄',
    group: 'licence',
    factory: licenceFormularyView,
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
