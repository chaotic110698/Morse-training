/**
 * Page « Le trafic et ses règles ».
 *
 * Ce que l'opérateur doit faire pendant qu'il émet : s'identifier, écouter
 * avant de parler, se tenir à ce qu'il a le droit de dire, et consigner.
 * L'épellation et le code Q relèvent du même chapitre réglementaire mais sont
 * déjà traités ailleurs sur le site : on renvoie plutôt que de dupliquer.
 */

import { h } from '../ui/dom.ts';
import type { View, ViewContext } from '../ui/router.ts';

interface LogField {
  field: string;
  detail: string;
}

const LOG_FIELDS: LogField[] = [
  { field: 'Date et heure', detail: "En temps universel ou en heure légale, mais toujours la même d’une ligne à l’autre." },
  { field: 'Indicatif', detail: "Celui du correspondant, ou celui du relais utilisé." },
  { field: 'Fréquence d’émission', detail: "La fréquence réellement employée, pas seulement la bande." },
  { field: 'Classe d’émission', detail: "A1A, J3E, F3E… selon le mode utilisé." },
  { field: 'Lieu d’émission', detail: "Le cas échéant seulement : en portable ou en mobile." },
  { field: 'Opérateur', detail: "Pour un radio-club : l’indicatif de qui manœuvre la station, et le nom des candidats en formation ayant fait un contact." },
];

export function licenceTrafficView(_context: ViewContext): View {
  const element = h(
    'div',
    { class: 'stack' },

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__lead' },
        "Une fois l’indicatif obtenu, l’essentiel de la réglementation tient en quelques gestes : se " +
        "nommer régulièrement, écouter avant d’émettre, rester dans le sujet, et tenir un journal. Rien " +
        "de compliqué — mais ce sont précisément ces points que l’examen vérifie."),

      h('h2', { text: 'S’identifier' }),
      h('p', {},
        "Le Règlement demande que les stations d’amateur transmettent leur indicatif ",
        h('em', { text: 'à de courts intervalles' }),
        ". La décision de l’ARCEP précise ce que cela veut dire, et ces trois cas se retiennent tels " +
        "quels."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'Au début et à la fin ' }),
          "de toute période d’émission."),
        h('li', {},
          h('strong', { text: 'Toutes les quinze minutes ' }),
          "au cours de toute émission qui dure plus de quinze minutes sur une même fréquence."),
        h('li', {},
          h('strong', { text: 'À chaque changement de fréquence, ' }),
          "au début de la période d’émission sur la nouvelle fréquence."),
      ),
      h('p', { class: 'prose__note' },
        "Cette obligation vaut pour tous les types de stations, sans exception : relais, balises et " +
        "satellites doivent s’identifier comme les autres."),

      h('h2', { text: 'Avant d’appuyer sur le manipulateur' }),
      h('p', {},
        "Quatre obligations encadrent l’usage d’une fréquence, et elles disent toutes la même chose sous " +
        "des formes différentes : la fréquence n’appartient à personne."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          "S’assurer au préalable que ses émissions ne brouilleront pas celles d’autres radioamateurs " +
          "déjà en cours. Autrement dit : ",
          h('strong', { text: 'écouter avant d’émettre' }),
          ", toujours."),
        h('li', {}, "Ne pas utiliser la même fréquence en permanence."),
        h('li', {}, "Ne pas brouiller volontairement des émissions en cours."),
        h('li', {},
          "Ne pas installer une station répétitrice, ni utiliser une classe d’émission, pour un usage " +
          "personnel ou au bénéfice d’un groupe restreint."),
      ),
      h('p', {},
        "Émettre et recevoir sur deux fréquences différentes est autorisé — en ",
        h('em', { text: 'split' }),
        " sur la même bande, en ",
        h('em', { text: 'cross-band' }),
        " sur deux bandes, ou via un relais ou un transpondeur — à condition que l’opérateur reste dans " +
        "ce que sa classe l’autorise à faire. Ce que le relais retransmet ensuite, et sur quelle bande, " +
        "ne le regarde pas."),

      h('h2', { text: 'Ce qu’on a le droit de dire' }),
      h('p', {},
        "Le contenu des échanges est encadré par trois règles du Règlement, reprises telles quelles en " +
        "droit français."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'Rester dans l’objet du service. ' }),
          "Les transmissions se limitent à des communications en rapport avec l’objet du service " +
          "amateur, et à des remarques d’un caractère purement personnel."),
        h('li', {},
          h('strong', { text: 'Ne pas coder. ' }),
          "Les communications se font en ",
          h('strong', { text: 'langage clair' }),
          " : il est interdit de coder ses transmissions pour en obscurcir le sens. La seule exception " +
          "concerne les signaux de commande envoyés aux satellites amateurs, précisément pour pouvoir " +
          "les faire taire immédiatement en cas de brouillage."),
        h('li', {},
          h('strong', { text: 'Pas de trafic pour des tiers. ' }),
          "Une station amateur ne transmet pas de communications venant de, ou destinées à, des " +
          "personnes non radioamateurs — sauf en situation d’urgence ou pour les secours en cas de " +
          "catastrophe."),
      ),
      h('p', { class: 'prose__note' },
        "Le code Q et les abréviations du trafic ne contredisent pas cette règle : ce sont des " +
        "conventions publiques, connues de tous et publiées en annexe d’un arrêté. Coder, au sens du " +
        "Règlement, c’est rendre un message incompréhensible à qui l’écoute — pas l’abréger."),
      h('p', {},
        "Sur le fond des conversations, un ancien guide donnait une liste que les questions d’examen " +
        "reprennent encore : radioélectricité, informatique, astronomie et météorologie, contenu d’une " +
        "revue technique sans en faire la publicité, réglementation, vie associative, adresse et " +
        "téléphone personnels — les siens, pas ceux d’un tiers — et radioguidage."),
      h('p', { class: 'prose__note' },
        "Les pièges portent sur les mots eux-mêmes. L’astronomie est autorisée, l’astrologie ne l’est " +
        "pas. Le radioguidage est autorisé, mais interdit sur les relais sauf occasionnellement pour une " +
        "manifestation radioamateur."),

      h('h2', { text: 'Écouter est libre, répéter ne l’est pas' }),
      h('p', {},
        "Depuis 1990, l’écoute de toutes les bandes est libre en France. Le ",
        h('strong', { text: 'secret des correspondances' }),
        " reste entier pour autant : ce qu’on capte, volontairement ou par hasard, ne se divulgue pas. " +
        "Le code pénal punit d’un an d’emprisonnement et de 45 000 euros d’amende le fait, commis de " +
        "mauvaise foi, d’intercepter, détourner, utiliser ou divulguer des correspondances émises par " +
        "voie électronique."),
      h('p', { class: 'field__hint' },
        "C’est le seul endroit du programme où le code pénal s’invite. Il vaut la peine de le retenir : " +
        "la question « l’écoute est-elle libre ? » appelle un oui, celle sur ce qu’on peut en faire " +
        "appelle un non."),
    ),

    // --- Journal de bord ---
    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Le journal de bord' }),
      h('p', { class: 'card__hint' },
        "Aussi appelé carnet de trafic. Sa tenue est une obligation, pas un usage : c’est le premier " +
        "document regardé lors d’un contrôle, avec la déclaration de puissance."),
      h(
        'div',
        { class: 'table-wrap' },
        h(
          'table',
          { class: 'data-table' },
          h('thead', {}, h('tr', {},
            h('th', { attrs: { scope: 'col' }, text: 'À consigner' }),
            h('th', { attrs: { scope: 'col' }, text: 'Précision' }))),
          h('tbody', {}, ...LOG_FIELDS.map((entry) =>
            h('tr', {},
              h('th', { attrs: { scope: 'row' }, text: entry.field }),
              h('td', { text: entry.detail })))),
        ),
      ),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {}, "Il doit être ", h('strong', { text: 'constamment à jour' }), "."),
        h('li', {}, "Il est présenté à toute réquisition des fonctionnaires chargés du contrôle."),
        h('li', {},
          "Il se conserve ",
          h('strong', { text: 'un an' }),
          " à compter de la dernière inscription."),
      ),
      h('p', { class: 'field__hint' },
        "La forme est libre : papier à pages numérotées et non détachables, fichier informatique, ou " +
        "tout autre procédé adapté pour un opérateur handicapé ou non-voyant."),
    ),

    // --- Renvois ---
    h(
      'section',
      { class: 'card card--muted' },
      h('h2', { class: 'card__title', text: 'Le reste du chapitre est ailleurs sur ce site' }),
      h('p', {},
        "La table d’épellation internationale et les abréviations en code Q font partie du même chapitre " +
        "réglementaire, en annexe de l’arrêté du 21 septembre 2000. Elles sont déjà traitées ici, avec " +
        "de quoi les écouter et s’exercer."),
      h(
        'div',
        { class: 'actions' },
        h('a', { class: 'btn', href: '#/apprendre/alphabet-otan', text: 'Alphabet OTAN' }),
        h('a', { class: 'btn', href: '#/apprendre/communication', text: 'Codes Q et abréviations' }),
        h('a', { class: 'btn', href: '#/entrainement/mots', text: 'S’entraîner dessus' }),
      ),
      h('p', { class: 'field__hint' },
        "L’épellation s’apprend vite et sert dès le premier contact. Les codes Q demandent plus de " +
        "temps : quelques-uns suffisent pour trafiquer, l’examen en attend une quinzaine."),
    ),
  );

  return { element };
}
