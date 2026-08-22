/**
 * Page « Le cadre réglementaire ».
 *
 * Trois niveaux de règles se superposent, et l'examen porte moins sur leur
 * contenu que sur la question « qui décide quoi ». La page est donc construite
 * autour des acteurs plutôt qu'autour des textes : c'est la répartition des
 * compétences qui est demandée, et c'est elle qu'on retient mal.
 */

import { h } from '../ui/dom.ts';
import type { View, ViewContext } from '../ui/router.ts';

interface Actor {
  short: string;
  name: string;
  scope: string;
  role: string;
}

const ACTORS: Actor[] = [
  {
    short: 'UIT',
    name: 'Union internationale des télécommunications',
    scope: 'Mondial',
    role: "Institution des Nations unies, siège à Genève. Sa branche radio, l’UIT-R, édite le Règlement des radiocommunications, traité ratifié par la France dont découlent toutes les règles nationales.",
  },
  {
    short: 'CMR',
    name: 'Conférence mondiale des radiocommunications',
    scope: 'Mondial',
    role: "Réunie tous les trois ou quatre ans pour mettre à jour le Règlement. Chaque pays y envoie ses représentants ; les radioamateurs n’y sont qu’observateurs, représentés par l’IARU.",
  },
  {
    short: 'CEPT',
    name: 'Conférence européenne des administrations des postes et télécommunications',
    scope: 'Européen',
    role: "Regroupe les régulateurs de quarante-six pays. Elle harmonise sans contraindre : ses recommandations organisent la libre circulation des opérateurs et l’équivalence des certificats.",
  },
  {
    short: 'ARCEP',
    name: 'Autorité de régulation des communications électroniques, des postes et de la distribution de la presse',
    scope: 'National',
    role: "Autorité indépendante. Elle assigne les fréquences aux utilisateurs et fixe leurs conditions techniques d’utilisation : c’est d’elle que viennent les bandes, les puissances et les classes d’émission autorisées.",
  },
  {
    short: 'Ministre',
    name: 'Ministre chargé des communications électroniques',
    scope: 'National',
    role: "Fixe les conditions d’obtention du certificat d’opérateur et les règles d’attribution des indicatifs. Il homologue aussi les décisions de l’ARCEP, sans quoi elles n’entrent pas en vigueur.",
  },
  {
    short: 'ANFR',
    name: 'Agence nationale des fréquences',
    scope: 'National',
    role: "Établissement public. Elle planifie et contrôle l’usage du spectre, édite le tableau national de répartition des bandes, organise l’examen, délivre certificats et indicatifs, et instruit les dossiers de brouillage.",
  },
];

interface Text {
  ref: string;
  name: string;
  content: string;
}

const TEXTS: Text[] = [
  {
    ref: 'RR, article S1',
    name: 'Définitions',
    content:
      "La disposition S1-56 définit le service amateur : un service de radiocommunication ayant pour objet l’instruction individuelle, l’intercommunication et les études techniques, effectué par des personnes dûment autorisées s’intéressant à la radioélectricité à titre purement personnel et sans intérêt pécuniaire.",
  },
  {
    ref: 'RR, article S25',
    name: 'Conditions d’exploitation',
    content:
      "L’indicatif est attribué par l’administration de chaque pays après vérification des aptitudes de l’opérateur ; les communications se font en langage clair ; le trafic pour le compte de tiers non radioamateurs est interdit, sauf urgence ou secours en cas de catastrophe.",
  },
  {
    ref: 'CPCE',
    name: 'Code des postes et des communications électroniques',
    content:
      "Le texte français de référence. Il classe les installations de radioamateurs dans la troisième catégorie de l’article D406-7, catégorie qui leur est exclusive, et pose que l’usage de fréquences pour émettre est soumis à autorisation administrative — une occupation privative du domaine public de l’État.",
  },
  {
    ref: 'Décision ARCEP 12-1241',
    name: 'Le texte qui régit l’activité',
    content:
      "Bandes, puissances, classes d’émission, obligations d’identification, journal de bord : c’est la décision de référence. Elle a été complétée par la décision 13-1515 pour la bande des 630 mètres et par la 19-1412 pour celle des 60 mètres.",
  },
  {
    ref: 'Arrêté du 21 septembre 2000',
    name: 'Certificat et indicatifs',
    content:
      "L’autre texte fondamental, plusieurs fois modifié : en 2009 pour l’attribution et le retrait des indicatifs, en 2012 pour supprimer l’épreuve de morse et le certificat novice, en 2021 pour supprimer le point négatif et actualiser le programme.",
  },
];

export function licenceFrameworkView(_context: ViewContext): View {
  const element = h(
    'div',
    { class: 'stack' },

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__lead' },
        "Personne ne possède le spectre radioélectrique. Il est partagé, et ce partage se négocie à trois " +
        "niveaux qui s’emboîtent : un traité mondial, une harmonisation européenne, et le droit français " +
        "qui les applique. L’examen ne demande pas de connaître ces textes par cœur — il demande de savoir " +
        "qui décide quoi."),

      h('h2', { text: 'Trois niveaux, une seule logique' }),
      h('p', {},
        "Au sommet, l’",
        h('strong', { text: 'Union internationale des télécommunications' }),
        " édite le Règlement des radiocommunications. Ce n’est pas une recommandation : c’est un traité " +
        "que la France a ratifié, et dont découle tout le reste. Il découpe le globe en trois régions, " +
        "attribue les bandes service par service, et définit jusqu’au vocabulaire employé."),
      h('p', {},
        "Au milieu, la ",
        h('strong', { text: 'CEPT' }),
        " harmonise les pratiques européennes. Elle ne contraint pas : ses recommandations sont des " +
        "incitations que chaque pays adopte ou non. Deux d’entre elles comptent pour un opérateur — la " +
        "T/R 61-01, qui permet de trafiquer moins de trois mois dans un pays membre sans aucune formalité, " +
        "et la T/R 61-02, qui définit le programme commun des certificats, le HAREC."),
      h('p', {},
        "En bas, le droit français applique tout cela. Le ",
        h('strong', { text: 'Code des postes et des communications électroniques' }),
        " pose le principe — émettre demande une autorisation — et renvoie à deux textes d’application " +
        "qui, eux, décrivent concrètement l’activité."),

      h('h2', { text: 'Qui décide quoi' }),
      h('p', {},
        "C’est la question réellement posée à l’examen, et la source d’erreur la plus fréquente. Trois " +
        "autorités se partagent le sujet, et leurs domaines ne se recouvrent pas."),
    ),

    h(
      'div',
      { class: 'actors' },
      ...ACTORS.map((actor) =>
        h(
          'section',
          { class: 'actor' },
          h('header', { class: 'actor__head' },
            h('span', { class: 'actor__short', text: actor.short }),
            h('span', { class: 'actor__scope', text: actor.scope })),
          h('h3', { class: 'actor__name', text: actor.name }),
          h('p', { class: 'actor__role', text: actor.role }),
        ),
      ),
    ),

    h(
      'section',
      { class: 'card card--accent' },
      h('h2', { class: 'card__title', text: 'À retenir : la répartition des compétences' }),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'L’ARCEP ' }),
          "fixe les conditions d’exploitation et attribue les bandes."),
        h('li', {},
          h('strong', { text: 'Le ministre ' }),
          "chargé des communications électroniques fixe les conditions de l’examen."),
        h('li', {},
          h('strong', { text: 'L’ANFR ' }),
          "organise l’examen, délivre et retire les indicatifs, gère le dossier administratif et instruit " +
          "les brouillages."),
      ),
      h('p', { class: 'field__hint' },
        "Autre point de vigilance : le tableau national de répartition des bandes de fréquences est édité " +
        "par l’ANFR, mais c’est un arrêté du Premier ministre qui lui donne force. L’attribution vient de " +
        "cet arrêté, l’assignation vient de l’ARCEP — deux verbes, deux étapes, deux autorités."),
    ),

    // --- Textes ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Les textes à connaître' }),
      h('p', {},
        "Cinq références suffisent. Les deux premières sont internationales, les trois autres françaises."),
    ),

    h(
      'div',
      { class: 'lexicon' },
      ...TEXTS.map((text) =>
        h(
          'details',
          { class: 'lexicon__group' },
          h('summary', { class: 'lexicon__summary' },
            h('span', { class: 'lexicon__title', text: text.name }),
            h('span', { class: 'lexicon__count', text: text.ref })),
          h('p', { class: 'lexicon__description', text: text.content }),
        ),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Ce que le service amateur a le droit d’être' }),
      h('p', {},
        "La définition du Règlement mérite d’être lue lentement, parce qu’elle décide de tout le reste. " +
        "Le service amateur a pour objet ",
        h('em', { text: 'l’instruction individuelle, l’intercommunication et les études techniques' }),
        ", exercées ",
        h('em', { text: 'à titre uniquement personnel et sans intérêt pécuniaire' }),
        "."),
      h('p', {},
        "Trois conséquences en découlent, et elles reviennent constamment. Aucune activité commerciale " +
        "n’est possible sur les bandes amateur. Aucun message ne peut être transmis pour le compte d’un " +
        "tiers non radioamateur, sauf urgence ou secours en cas de catastrophe. Et le contenu des " +
        "échanges doit rester en rapport avec l’objet du service — la technique, l’expérimentation, et " +
        "des remarques d’un caractère purement personnel."),
      h('p', {},
        "L’Union internationale attend d’ailleurs quelque chose des radioamateurs. Sa résolution 646 et " +
        "sa disposition S25-9A invitent les administrations à leur permettre de se préparer aux " +
        "communications de secours : des réseaux souples, rapides à déployer, indépendants de toute " +
        "infrastructure. C’est la contrepartie du spectre qui leur est confié."),

      h('h2', { text: 'Un mot d’histoire' }),
      h('p', {},
        "Deux conférences mondiales méritent d’être retenues. Celle de 2003 a supprimé l’obligation de " +
        "connaître le morse pour émettre en dessous de 30 MHz — c’est de là que vient la disparition de " +
        "l’épreuve française, neuf ans plus tard. Celle de 2015 a attribué la bande des 60 mètres au " +
        "service amateur."),
      h('p', {},
        "Pour le reste, l’",
        h('a', { href: '#/apprendre/histoire', text: 'histoire du morse' }),
        " raconte comment on en est arrivé là, et n’est pas au programme de l’examen."),
    ),
  );

  return { element };
}
