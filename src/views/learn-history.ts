/**
 * Page « Histoire du morse ».
 *
 * Le contenu est structure en jalons pour rester lisible sur telephone : une
 * frise verticale ou chaque entree tient en un paragraphe.
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
    title: 'Avant l’electricite, le telegraphe optique',
    body: [
      "Bien avant le fil, la France se couvre de tours a bras articules : le telegraphe Chappe, " +
        "inaugure entre Paris et Lille en 1794. Un message traverse le pays en quelques heures au lieu " +
        "de plusieurs jours, a condition qu’il fasse jour et beau. L’idee d’un alphabet de signaux " +
        "transmis a distance est deja la ; il ne manque que le support.",
    ],
  },
  {
    period: '1837 — 1838',
    title: 'Samuel Morse et Alfred Vail',
    body: [
      "Peintre de formation, Samuel F. B. Morse s’associe au mecanicien Alfred Vail pour developper un " +
        "telegraphe electrique. Vail joue un role considerable dans la mise au point du code lui-meme. " +
        "Pour attribuer les signaux les plus courts aux lettres les plus frequentes, l’equipe compte " +
        "simplement les caracteres dans les casses d’un imprimeur local : le E, omnipresent, recoit un " +
        "point unique.",
      "Ce premier code, dit morse americain, n’est pas celui qu’on apprend aujourd’hui. Il comportait " +
        "des silences a l’interieur de certaines lettres et des traits de longueurs differentes, ce qui " +
        "le rendait difficile a transmettre par radio.",
    ],
  },
  {
    period: '24 mai 1844',
    title: '« What hath God wrought »',
    body: [
      "Morse transmet depuis le Capitole a Washington, vers Baltimore, la phrase restee celebre " +
        "« What hath God wrought ». La ligne fonctionne, l’information se detache pour la premiere fois " +
        "du transport physique. En une generation, les cables telegraphiques suivent les voies ferrees, " +
        "puis traversent l’Atlantique.",
    ],
  },
  {
    period: '1848 — 1865',
    title: 'La normalisation internationale',
    body: [
      "Friedrich Clemens Gerke simplifie le code pour les besoins allemands : durees regulieres, " +
        "suppression des silences internes. Sa version, plus robuste, s’impose en Europe. La conference " +
        "telegraphique internationale de Paris, en 1865, la retient comme standard : c’est le code morse " +
        "international, aussi appele code continental, celui que ce site enseigne.",
    ],
  },
  {
    period: '1895 — 1910',
    title: 'Le morse prend l’air',
    body: [
      "Les premieres liaisons sans fil de Marconi ne savent transmettre qu’une chose : la presence ou " +
        "l’absence d’une onde. Autrement dit, exactement ce dont le morse a besoin. Le code devient la " +
        "langue de la radio naissante, et la telegraphie sans fil equipe rapidement les navires.",
      "Il faut alors un signal de detresse universel. L’Allemagne adopte en 1905 une suite facile a " +
        "reconnaitre et impossible a confondre, trois points, trois traits, trois points, emise d’un " +
        "seul tenant. La conference radiotelegraphique internationale de Berlin l’adopte en 1906 et elle " +
        "entre en vigueur en 1908. Contrairement a la legende, SOS n’est l’abreviation de rien : les " +
        "lectures « Save Our Souls » ou « Save Our Ship » ont ete inventees apres coup.",
    ],
  },
  {
    period: '14 — 15 avril 1912',
    title: 'Le Titanic',
    body: [
      "Le naufrage du Titanic fait entrer la telegraphie sans fil dans l’histoire populaire. Les " +
        "operateurs emettent d’abord l’ancien appel CQD, puis SOS. Le drame revele surtout les lacunes " +
        "de l’epoque : toutes les stations ne veillaient pas en permanence. Les conventions qui suivent " +
        "imposent une veille radio continue a bord des navires.",
    ],
  },
  {
    period: '1914 — 1945',
    title: 'Guerres, chiffrement et interception',
    body: [
      "Les deux guerres mondiales font du morse un outil strategique. Les operateurs militaires " +
        "transmettent des messages chiffres en groupes de cinq caracteres — un exercice que ce site " +
        "propose toujours, car il ne laisse aucune prise a l’anticipation. Les services d’ecoute " +
        "apprennent a reconnaitre les operateurs adverses a leur rythme de frappe, aussi personnel " +
        "qu’une signature.",
    ],
  },
  {
    period: '1997 — 1999',
    title: 'La fin de la veille maritime',
    body: [
      "Le systeme mondial de detresse et de securite en mer, fonde sur le satellite et la radio " +
        "numerique, remplace progressivement la veille en morse. La Marine nationale francaise cesse ses " +
        "emissions en morse en janvier 1997 par un dernier message reste celebre. Le 1er fevrier 1999, " +
        "le morse n’est plus le moyen international de detresse en mer. Un siecle de service prend fin.",
    ],
  },
  {
    period: '2003',
    title: 'La licence radioamateur s’ouvre',
    body: [
      "Jusque-la, obtenir une licence radioamateur donnant acces aux bandes decametriques supposait de " +
        "reussir une epreuve de morse. La conference mondiale des radiocommunications de 2003 supprime " +
        "cette obligation au niveau international ; les pays l’abandonnent ensuite les uns apres les " +
        "autres. Le morse cesse d’etre un examen pour devenir un choix.",
    ],
  },
  {
    period: 'Aujourd’hui',
    title: 'Un code qui refuse de disparaitre',
    body: [
      "La telegraphie, appelee CW par les radioamateurs, reste tres pratiquee. Sa raison d’etre est " +
        "technique autant que sentimentale : un signal morse occupe une bande passante minuscule et " +
        "reste dechiffrable la ou la voix est completement noyee dans le bruit. Quelques watts et un " +
        "bout de fil suffisent a traverser un ocean.",
      "Le code survit aussi ailleurs : les balises de radionavigation aeronautique s’identifient encore " +
        "en morse, et des personnes privees de parole ont pu communiquer en clignant des yeux. Un " +
        "alphabet concu pour des fils de cuivre du XIXe siecle continue de servir, precisement parce " +
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

  // Le succes « Historien » se debloque quand le bas de la frise a reellement
  // ete atteint, pas a l'ouverture de la page.
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
      "Le morse n’est pas ne comme un jeu d’erudits : c’etait l’infrastructure de communication la plus " +
      "rapide du monde, et elle l’est restee pendant plus d’un siecle. Voici les jalons qui expliquent " +
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
