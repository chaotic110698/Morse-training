/**
 * Page « Histoire du morse ».
 *
 * Le contenu est structuré en jalons pour rester lisible sur téléphone : une
 * frise verticale où chaque entrée tient en un paragraphe.
 */

import { h } from '../ui/dom.ts';
import type { View, ViewContext } from '../ui/router.ts';

interface Milestone {
  period: string;
  title: string;
  body: string[];
}

const MILESTONES: Milestone[] = [
  {
    period: '1794',
    title: 'Avant l’électricité, le télégraphe optique',
    body: [
      "Bien avant le fil, la France se couvre de tours à bras articulés : le télégraphe Chappe, " +
        "inauguré entre Paris et Lille en 1794. Un message traverse le pays en quelques heures au lieu " +
        "de plusieurs jours, à condition qu’il fasse jour et beau. L’idée d’un alphabet de signaux " +
        "transmis à distance est déjà là ; il ne manque que le support.",
    ],
  },
  {
    period: '1837 — 1838',
    title: 'Samuel Morse et Alfred Vail',
    body: [
      "Peintre de formation, Samuel F. B. Morse s’associe au mécanicien Alfred Vail pour développer un " +
        "télégraphe électrique. Vail joue un rôle considérable dans la mise au point du code lui-même. " +
        "Pour attribuer les signaux les plus courts aux lettres les plus fréquentes, l’équipe compte " +
        "simplement les caractères dans les casses d’un imprimeur local : le E, omniprésent, reçoit un " +
        "point unique.",
      "Ce premier code, dit morse américain, n’est pas celui qu’on apprend aujourd’hui. Il comportait " +
        "des silences à l’intérieur de certaines lettres et des traits de longueurs différentes, ce qui " +
        "le rendait difficile à transmettre par radio.",
    ],
  },
  {
    period: '24 mai 1844',
    title: '« What hath God wrought »',
    body: [
      "Morse transmet depuis le Capitole à Washington, vers Baltimore, la phrase restée célèbre " +
        "« What hath God wrought ». La ligne fonctionne, l’information se détache pour la première fois " +
        "du transport physique. En une génération, les câbles télégraphiques suivent les voies ferrées, " +
        "puis traversent l’Atlantique.",
    ],
  },
  {
    period: '1848 — 1865',
    title: 'La normalisation internationale',
    body: [
      "Friedrich Clemens Gerke simplifie le code pour les besoins allemands : durées régulières, " +
        "suppression des silences internes. Sa version, plus robuste, s’impose en Europe. La conférence " +
        "télégraphique internationale de Paris, en 1865, la retient comme standard : c’est le code morse " +
        "international, aussi appelé code continental, celui que ce site enseigne.",
    ],
  },
  {
    period: '1895 — 1910',
    title: 'Le morse prend l’air',
    body: [
      "Les premières liaisons sans fil de Marconi ne savent transmettre qu’une chose : la présence ou " +
        "l’absence d’une onde. Autrement dit, exactement ce dont le morse a besoin. Le code devient la " +
        "langue de la radio naissante, et la télégraphie sans fil équipe rapidement les navires.",
      "Il faut alors un signal de détresse universel. L’Allemagne adopte en 1905 une suite facile à " +
        "reconnaître et impossible à confondre, trois points, trois traits, trois points, émise d’un " +
        "seul tenant. La conférence radiotélégraphique internationale de Berlin l’adopte en 1906 et elle " +
        "entre en vigueur en 1908. Contrairement à la légende, SOS n’est l’abréviation de rien : les " +
        "lectures « Save Our Souls » ou « Save Our Ship » ont été inventées après coup.",
    ],
  },
  {
    period: '14 — 15 avril 1912',
    title: 'Le Titanic',
    body: [
      "Le naufrage du Titanic fait entrer la télégraphie sans fil dans l’histoire populaire. Les " +
        "opérateurs émettent d’abord l’ancien appel CQD, puis SOS. Le drame révèle surtout les lacunes " +
        "de l’époque : toutes les stations ne veillaient pas en permanence. Les conventions qui suivent " +
        "imposent une veille radio continue à bord des navires.",
    ],
  },
  {
    period: '1914 — 1945',
    title: 'Guerres, chiffrement et interception',
    body: [
      "Les deux guerres mondiales font du morse un outil stratégique. Les opérateurs militaires " +
        "transmettent des messages chiffres en groupes de cinq caractères — un exercice que ce site " +
        "propose toujours, car il ne laisse aucune prise à l’anticipation. Les services d’écoute " +
        "apprennent à reconnaître les opérateurs adverses à leur rythme de frappe, aussi personnel " +
        "qu’une signature.",
    ],
  },
  {
    period: '1997 — 1999',
    title: 'La fin de la veille maritime',
    body: [
      "Le système mondial de détresse et de sécurité en mer, fondé sur le satellite et la radio " +
        "numérique, remplace progressivement la veille en morse. La Marine nationale française cesse ses " +
        "émissions en morse en janvier 1997 par un dernier message reste célèbre. Le 1er février 1999, " +
        "le morse n’est plus le moyen international de détresse en mer. Un sièclé de service prend fin.",
    ],
  },
  {
    period: '2003',
    title: 'La licence radioamateur s’ouvre',
    body: [
      "Jusque-là, obtenir une licence radioamateur donnant accès aux bandes décamétriques supposait de " +
        "réussir une épreuve de morse. La conférence mondiale des radiocommunications de 2003 supprime " +
        "cette obligation au niveau international ; les pays l’abandonnent ensuite les uns après les " +
        "autres. Le morse cesse d’être un examen pour devenir un choix.",
    ],
  },
  {
    period: 'Aujourd’hui',
    title: 'Un code qui refuse de disparaître',
    body: [
      "La télégraphie, appelée CW par les radioamateurs, reste très pratiquée. Sa raison d’être est " +
        "technique autant que sentimentale : un signal morse occupe une bande passante minuscule et " +
        "reste déchiffrable là où la voix est complètement noyée dans le bruit. Quelques watts et un " +
        "bout de fil suffisent à traverser un océan.",
      "Le code survit aussi ailleurs : les balises de radionavigation aéronautique s’identifient encore " +
        "en morse, et des personnes privées de parole ont pu communiquer en clignant des yeux. Un " +
        "alphabet conçu pour des fils de cuivre du XIXe sièclé continue de servir, précisément parce " +
        "qu’il ne demande presque rien.",
    ],
  },
];

export function historyView(context: ViewContext): View {
  const { store } = context;

  const timeline = h(
    'ol',
    { class: 'timeline' },
    ...MILESTONES.map((milestone) =>
      h(
        'li',
        { class: 'timeline__item' },
        h('div', { class: 'timeline__period', text: milestone.period }),
        h(
          'div',
          { class: 'timeline__content' },
          h('h3', { class: 'timeline__title', text: milestone.title }),
          ...milestone.body.map((paragraph) => h('p', { text: paragraph })),
        ),
      ),
    ),
  );

  const endMarker = h('div', { class: 'timeline__end' },
    h('p', { class: 'prose__note', text: "Fin de la frise. Bonne lecture, et bon trafic." }));

  // Le succès « Historien » se débloque quand le bas de la frise a réellement
  // été atteint, pas à l'ouverture de la page.
  let observer: IntersectionObserver | null = null;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          store.raiseFlag('history-read');
          observer?.disconnect();
          observer = null;
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(endMarker);
  } else {
    store.raiseFlag('history-read');
  }

  const element = h(
    'article',
    { class: 'prose' },
    h('p', { class: 'prose__lead' },
      "Le morse n’est pas ne comme un jeu d’érudits : c’était l’infrastructure de communication la plus " +
      "rapide du monde, et elle l’est restée pendant plus d’un sièclé. Voici les jalons qui expliquent " +
      "pourquoi le code que vous apprenez a exactement cette forme."),
    timeline,
    endMarker,
  );

  return {
    element,
    destroy: () => {
      observer?.disconnect();
      observer = null;
    },
  };
}
