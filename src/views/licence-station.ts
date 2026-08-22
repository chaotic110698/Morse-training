/**
 * Page « La station et l'indicatif ».
 *
 * Tout ce qui touche à l'identité administrative de l'opérateur : la forme de
 * son indicatif, les suffixes qui disent d'où il émet, ce qu'il doit déclarer,
 * ce qu'il risque, et ce qu'il peut faire à l'étranger. La structure des
 * indicatifs français est détaillée ici plutôt que sur la page grand public
 * des indicatifs, parce que seul l'examen demande de connaître à quoi
 * correspond chaque chiffre.
 */

import { h } from '../ui/dom.ts';
import type { View, ViewContext } from '../ui/router.ts';

interface Suffix {
  code: string;
  spoken: string;
  meaning: string;
}

const SUFFIXES: Suffix[] = [
  { code: '/P', spoken: 'Portable', meaning: "Station transportable : construite pour être déplacée, mais qui ne fonctionne pas pendant son transport." },
  { code: '/M', spoken: 'Mobile', meaning: "Station destinée à être utilisée en mouvement, ou pendant des haltes en des points non déterminés. C’est aussi le suffixe à bord d’un aéronef." },
  { code: '/MM', spoken: 'Maritime Mobile', meaning: "À bord d’un navire en eaux internationales, au-delà de douze milles nautiques. La station relève alors de l’autorité du capitaine." },
];

interface Digit {
  digit: string;
  meaning: string;
}

const DIGITS: Digit[] = [
  { digit: '0', meaning: 'Opérateur de l’ancienne classe 3' },
  { digit: '1 et 4', meaning: 'Ancienne classe 2 — le 4 est attribué aux nouveaux opérateurs' },
  { digit: '5, 6 et 8', meaning: 'Ancienne classe 1, et radio-clubs' },
  { digit: '2, 3, 7 et 9', meaning: 'En réserve, à quelques anciens indicatifs près' },
];

interface Series {
  range: string;
  use: string;
}

const SERIES: Series[] = [
  { range: 'AA à ZZ et AAA à UZZZ', use: 'Indicatifs individuels' },
  { range: 'KAA à KZZ', use: 'Radio-clubs' },
  { range: 'VAA à VZZ', use: 'Ressortissants de l’Union européenne installés plus de trois mois en France' },
  { range: 'WAA à WZZ', use: 'Ressortissants hors Union européenne installés plus de trois mois en France' },
  { range: 'XAA à YZZ', use: 'En réserve' },
  { range: 'ZAA à ZZZ', use: 'Stations répétitrices — relais et balises' },
];

export function licenceStationView(_context: ViewContext): View {
  const element = h(
    'div',
    { class: 'stack' },

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__lead' },
        "L’indicatif n’est pas un pseudonyme : c’est une identité administrative, attribuée par l’État, " +
        "qui reste sa propriété et ne se transmet pas. Sa forme dit d’où l’on émet et, en France, à " +
        "quelle époque on a passé son examen."),

      h('h2', { text: 'La structure d’un indicatif français' }),
      h('p', {},
        "Le ",
        h('strong', { text: 'préfixe' }),
        " est déterminé par l’adresse déclarée de la station. C’est la lettre F pour la France " +
        "continentale ; deux lettres pour la Corse et l’outre-mer — TK en Corse, FG en Guadeloupe, FM en " +
        "Martinique, FY en Guyane, FR à La Réunion, FH à Mayotte, FK en Nouvelle-Calédonie, FO en " +
        "Polynésie, FP à Saint-Pierre-et-Miquelon, FJ à Saint-Barthélemy, FS à Saint-Martin, FT aux " +
        "Terres australes, FW à Wallis-et-Futuna."),
      h('p', {},
        "Vient ensuite un ",
        h('strong', { text: 'chiffre' }),
        ", qui indique la classe historique de l’opérateur. C’est une particularité française : ailleurs, " +
        "le chiffre désigne souvent une région."),
    ),

    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        { class: 'data-table' },
        h('thead', {}, h('tr', {},
          h('th', { attrs: { scope: 'col' }, text: 'Chiffre' }),
          h('th', { attrs: { scope: 'col' }, text: 'Ce qu’il désigne' }))),
        h('tbody', {}, ...DIGITS.map((entry) =>
          h('tr', {},
            h('th', { attrs: { scope: 'row' }, class: 'mono', text: entry.digit }),
            h('td', { text: entry.meaning })))),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', {},
        "Enfin le ",
        h('strong', { text: 'suffixe' }),
        ", de deux à quatre lettres, propre à chaque station. Les séries ne sont pas attribuées au " +
        "hasard : la première lettre dit à qui l’indicatif appartient."),
    ),

    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        { class: 'data-table' },
        h('thead', {}, h('tr', {},
          h('th', { attrs: { scope: 'col' }, text: 'Série' }),
          h('th', { attrs: { scope: 'col' }, text: 'Attribuée à' }))),
        h('tbody', {}, ...SERIES.map((entry) =>
          h('tr', {},
            h('th', { attrs: { scope: 'row' }, class: 'mono', text: entry.range }),
            h('td', { text: entry.use })))),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__note' },
        "Dans l’outre-mer et en Corse, seule la série à deux lettres est attribuée aux individuels. " +
        "Ainsi F4VAA désigne un ressortissant européen installé en France, FY5KA un radio-club de " +
        "Guyane, TK0AA un opérateur corse de l’ancienne classe 3."),
      h('p', {},
        "Les indicatifs à suffixe de deux lettres devenus disponibles ne sont pas réattribués, sauf " +
        "nécessité constatée par l’administration. La taxe annuelle, longtemps de 46 euros, a été " +
        "supprimée par la loi de finances pour 2019."),

      h('h2', { text: 'Dire d’où l’on émet' }),
      h('p', {},
        "Depuis l’adresse déclarée, l’indicatif s’emploie nu. Ailleurs, un suffixe s’y ajoute. L’ANFR " +
        "doit d’ailleurs être informée de tout changement d’adresse dans les deux mois, et depuis 2021 " +
        "deux adresses peuvent lui être déclarées : celle du domicile et celle de la station."),
    ),

    h(
      'div',
      { class: 'phrasebook-plain' },
      ...SUFFIXES.map((suffix) =>
        h(
          'section',
          { class: 'suffix' },
          h('span', { class: 'suffix__code', text: suffix.code }),
          h('span', { class: 'suffix__spoken', text: suffix.spoken }),
          h('p', { class: 'suffix__meaning', text: suffix.meaning }),
        ),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', {},
        "Le suffixe s’émet tel quel en télégraphie, et se dit en clair en téléphonie : F5ABC/M à la clé " +
        "devient « Foxtrot Cinq Alfa Bravo Charlie Mobile » au micro."),
      h('p', { class: 'prose__note' },
        "Une station à bord d’un navire dans les eaux territoriales, sur un fleuve ou à quai est " +
        "assimilée à une station mobile : c’est /M, pas /MM. La différence tient aux douze milles."),
      h('p', {},
        "Émettre depuis un autre territoire français que le sien n’est pas réglementé. L’usage — hérité " +
        "de textes abrogés — veut qu’on place devant son indicatif le préfixe du lieu, et qu’on ajoute " +
        "éventuellement le numéro de département : FM/F0ABC/P, ou F0ABC/P75. Ce n’est pas une " +
        "obligation, mais cela aide les correspondants à pointer leurs antennes."),

      h('h2', { text: 'Radio-clubs et stations automatiques' }),
      h('p', {},
        "La station d’un radio-club s’exploite sous la responsabilité du titulaire de son indicatif, qui " +
        "doit détenir un certificat HAREC. N’importe quel opérateur titulaire d’un indicatif peut la " +
        "manœuvrer, en émettant l’indicatif du club suivi du sien : F6KGL/F6GPX. Le journal de bord du " +
        "club porte alors l’indicatif de chaque utilisateur."),
      h('p', {},
        "Une ",
        h('strong', { text: 'station répétitrice' }),
        " — balise ou relais — peut être établie sur un autre site que celui de son responsable. Elle ne " +
        "doit pas servir un usage personnel ou un groupe restreint, ne transmet que son indicatif et des " +
        "informations sur sa position, son fonctionnement et les conditions locales de propagation, et " +
        "doit disposer d’un dispositif d’arrêt d’urgence."),

      h('h2', { text: 'Ce qu’il faut déclarer' }),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'La puissance apparente rayonnée. ' }),
          "Toute installation fixe dont la PAR dépasse ",
          h('strong', { text: '5 watts' }),
          " est soumise à déclaration auprès de l’ANFR, dans les deux mois suivant l’installation. La " +
          "déclaration comprend l’adresse de la station, ses coordonnées GPS au format WGS84, et la PAR " +
          "maximale utilisée dans les quatre gammes HF, VHF, UHF et SHF. Les stations portables et " +
          "mobiles ne sont pas concernées."),
        h('li', {},
          h('strong', { text: 'Le matériel, non. ' }),
          "Les équipements détenus n’ont pas à être déclarés — seulement la puissance rayonnée."),
        h('li', {},
          h('strong', { text: 'Un pylône de plus de 12 mètres. ' }),
          "Une déclaration préalable d’urbanisme est nécessaire au-delà de cette hauteur, mesurée au-" +
          "dessus du sol, antenne verticale comprise. Les antennes horizontales ou filaires ne sont " +
          "soumises à aucune formalité. Installer un pylône sur le pignon d’une maison modifie l’aspect " +
          "du bâtiment, ce qui impose une déclaration même en dessous de 12 mètres."),
      ),
      h('p', { class: 'field__hint' },
        "En trafic portable, aucune déclaration d’urbanisme n’est à prévoir : les installations " +
        "temporaires de moins de trois mois en sont dispensées. Près d’un monument classé ou dans un " +
        "site patrimonial remarquable, l’avis de l’Architecte des bâtiments de France s’ajoute à la " +
        "procédure."),

      h('h3', { text: 'Le droit à l’antenne' }),
      h('p', {},
        "Une loi de 1966 le reconnaît : le propriétaire d’un immeuble ne peut s’opposer, ",
        h('em', { text: 'sans motif sérieux et légitime' }),
        ", à l’installation, au remplacement ou à l’entretien des antennes nécessaires au bon " +
        "fonctionnement d’une station du service amateur. Elle s’applique aux propriétaires comme aux " +
        "locataires. En contrepartie, le bénéficiaire est responsable des travaux et des conséquences de " +
        "la présence de l’antenne."),

      h('h3', { text: 'Le matériel construit soi-même' }),
      h('p', {},
        "Les équipements radioélectriques doivent normalement faire l’objet d’une évaluation de " +
        "conformité, matérialisée par le marquage CE. Cette exigence ne s’applique pas aux constructions " +
        "personnelles des radioamateurs, ni aux kits qu’ils assemblent pour leur usage, ni aux " +
        "équipements qu’ils modifient : ces réalisations ne sont pas considérées comme des équipements " +
        "disponibles dans le commerce."),
      h('p', { class: 'prose__note' },
        "Connecter sa station à un réseau ouvert au public — Internet — reste interdit à ce jour. Le " +
        "texte qui l’autoriserait a été préparé mais n’est jamais paru."),

      h('h2', { text: 'Sanctions' }),
      h('p', {},
        "Deux voies existent, et elles sont indépendantes."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'Administrative. ' }),
          "En cas de manquement à la réglementation ou d’usurpation d’indicatif, l’indicatif peut être " +
          "suspendu pour ",
          h('strong', { text: 'trois ans au maximum' }),
          " ou révoqué définitivement. La décision est prise par l’autorité qui a délivré l’indicatif, " +
          "de sa propre initiative ou sur proposition de l’ANFR, de l’ARCEP ou d’un ministère — jamais à " +
          "la demande directe d’un particulier ou d’une association."),
        h('li', {},
          h('strong', { text: 'Pénale. ' }),
          "Perturber au moyen d’une installation radioélectrique, ou utiliser une fréquence hors des " +
          "conditions prévues, est puni de six mois d’emprisonnement et de 30 000 euros d’amende. " +
          "Utiliser sciemment l’indicatif d’une autre station est puni d’un an d’emprisonnement. Le " +
          "tribunal peut confisquer ou faire détruire le matériel, mais ",
          h('strong', { text: 'ne peut pas retirer l’indicatif' }),
          " : c’est une décision administrative."),
      ),
      h('p', { class: 'field__hint' },
        "En cas de plainte pour brouillage, l’ANFR intervient en expert pour déterminer si le tort vient " +
        "de la station ou de l’installation perturbée. L’intervention coûte 450 euros, à la charge du " +
        "responsable des désordres. Ce n’est pas une amende mais une taxe."),

      h('h2', { text: 'Émettre à l’étranger' }),
      h('p', {},
        "La recommandation CEPT T/R 61-01 organise la libre circulation : un opérateur titulaire d’un " +
        "certificat de classe unique peut trafiquer dans un pays qui l’applique, pour un séjour de ",
        h('strong', { text: 'moins de trois mois' }),
        ", sans aucune formalité."),
      h('p', {},
        "L’indicatif employé est alors formé du préfixe du pays visité, d’une barre de fraction, de " +
        "l’indicatif français, et du suffixe /P ou /M. Un Français émettant depuis son véhicule en " +
        "Belgique signe ",
        h('strong', { text: 'ON/F6ABC/M' }),
        ". L’ordre est logique : on annonce d’abord où l’on est, ensuite qui l’on est."),
      h('p', {},
        "La réciproque vaut en France : un Italien en vacances à Paris signe F/I9AAA/P. Au-delà de trois " +
        "mois, un indicatif temporaire français doit être demandé, avec un suffixe de la série V ou W " +
        "selon le pays d’origine."),
      h('p', { class: 'prose__note' },
        "La CEPT compte quarante-six pays membres. Huit pays non membres appliquent aussi la T/R 61-01 " +
        "— dont l’Australie, le Canada, les États-Unis, Israël, la Nouvelle-Zélande et l’Afrique du Sud " +
        "— et la France a signé des accords bilatéraux avec cinq autres : Brésil, Côte d’Ivoire, Japon, " +
        "Kenya et Thaïlande. La licence CEPT Novice, elle, n’a jamais été applicable en France."),
      h('p', {},
        "Avant tout trafic à l’étranger, il faut se renseigner sur les conditions locales : les limites " +
        "de bande, les puissances et les classes autorisées varient. Quelques pays, de plus en plus " +
        "rares, continuent d’exiger la connaissance du morse pour accéder aux bandes en dessous de " +
        "30 MHz."),
    ),

    h(
      'section',
      { class: 'card card--muted' },
      h('h2', { class: 'card__title', text: 'Indicatifs spéciaux et annuaire' }),
      h('p', {},
        "Pour un événement, un indicatif spécial peut être délivré sur demande motivée, pour ",
        h('strong', { text: 'quinze jours non consécutifs au maximum' }),
        " sur une période de six mois. Son préfixe est TM en France continentale, TK en Corse, TO dans " +
        "les DROM, TX ailleurs en outre-mer, FX pour un événement lié à une station spatiale. La demande " +
        "se dépose au moins vingt jours ouvrables à l’avance, et seul un opérateur HAREC peut la faire. " +
        "L’adresse de la station étant fixée dès la demande, l’exploitation en portable ou en mobile est " +
        "interdite."),
      h('p', {},
        "L’ANFR publie un annuaire des radioamateurs : nom, prénom, indicatif et adresse. Chacun peut " +
        "s’opposer à y figurer, à l’exception de son indicatif. Un titulaire qui ne souhaite plus " +
        "utiliser le sien peut en demander la suspension volontaire ; après dix ans, l’indicatif peut " +
        "être réattribué."),
      h(
        'div',
        { class: 'actions' },
        h('a', { class: 'btn', href: '#/apprendre/communication', text: 'Générateur d’indicatifs d’essai' }),
      ),
    ),
  );

  return { element };
}
