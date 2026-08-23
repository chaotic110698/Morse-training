/**
 * Page « Brouillage et sécurité ».
 *
 * Deux sujets qui n'ont en commun que d'être les derniers du programme de
 * réglementation, et de porter sur ce qui entoure la station plutôt que sur
 * la station elle-même : ce qu'elle dérange, et ce qui peut blesser.
 */

import { h } from '../ui/dom.ts';
import type { View, ViewContext } from '../ui/router.ts';

interface Voltage {
  limit: string;
  environment: string;
}

const SAFE_VOLTAGES: Voltage[] = [
  { limit: '50 V', environment: 'Milieu sec' },
  { limit: '24 V', environment: 'Milieu humide ou extérieur' },
  { limit: '12 V', environment: 'En immersion' },
];

interface WireColour {
  colour: string;
  role: string;
  swatch: string;
  note: string;
}

const WIRE_COLOURS: WireColour[] = [
  { colour: 'Jaune-vert', role: 'Terre', swatch: 'linear-gradient(135deg, #f5d327 50%, #2f9e44 50%)', note: 'Conducteur de protection. Ne transporte aucun courant en fonctionnement normal.' },
  { colour: 'Bleu', role: 'Neutre', swatch: '#3b82f6', note: 'Retour du courant vers le réseau.' },
  { colour: 'Rouge, marron ou noir', role: 'Phase', swatch: 'linear-gradient(135deg, #dc2626 33%, #92400e 33% 66%, #1f2937 66%)', note: 'Le conducteur dangereux : c’est lui qui porte la tension.' },
];

export function licenceSafetyView(_context: ViewContext): View {
  const element = h(
    'div',
    { class: 'stack' },

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__lead' },
        "Une station n’est jamais seule. Elle rayonne dans un voisinage qui contient d’autres appareils, " +
        "et elle manipule des tensions qui peuvent tuer. Ce dernier chapitre du programme de " +
        "réglementation traite de ces deux voisinages : l’électromagnétique et le physique."),

      h('h2', { text: 'La compatibilité électromagnétique' }),
      h('p', {},
        "La directive européenne la définit comme l’aptitude d’un équipement à fonctionner correctement " +
        "dans son environnement électromagnétique ",
        h('em', { text: 'sans produire lui-même de perturbations intolérables pour les autres' }),
        ". Deux faces, donc : ne pas déranger, et ne pas être dérangé."),
      h('p', {},
        "Quatre termes structurent le sujet, et l’examen les distingue précisément."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'Émission. ' }),
          "On parle d’émission quand l’appareil est la source des perturbations."),
        h('li', {},
          h('strong', { text: 'Susceptibilité. ' }),
          "On parle de susceptibilité quand il en est la victime."),
        h('li', {},
          h('strong', { text: 'Immunité. ' }),
          "Le niveau de perturbation qu’un appareil supporte sans broncher. Au-delà, son ",
          h('strong', { text: 'seuil de susceptibilité' }),
          " est atteint."),
        h('li', {},
          h('strong', { text: 'Durcissement. ' }),
          "L’ensemble des mesures prises pour relever ce niveau d’immunité."),
      ),
      h('p', {},
        "Une perturbation est ",
        h('strong', { text: 'conduite' }),
        " quand elle voyage par des conducteurs — fils, câbles, pistes de circuit imprimé — et ",
        h('strong', { text: 'rayonnée' }),
        " quand elle se propage dans l’espace par un champ électromagnétique. La distinction commande le " +
        "remède."),

      h('h2', { text: 'Ce qu’on fait contre le brouillage' }),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'Filtrer l’alimentation secteur. ' }),
          "C’est la première précaution : le secteur relie la station à tout le voisinage."),
        h('li', {},
          h('strong', { text: 'Blinder, ' }),
          "en particulier les étages de puissance. Le métal réfléchit le champ électromagnétique, qui " +
          "reste confiné dans le boîtier."),
        h('li', {},
          h('strong', { text: 'Filtrer selon le sens du problème. ' }),
          "Un filtre passe-bas à la sortie de l’émetteur bloque les harmoniques indésirables. Un filtre " +
          "passe-haut dans la ligne coaxiale d’un téléviseur le protège des émissions VHF. Un filtre " +
          "passe-bande centré sur la bande de trafic peut s’insérer dans la ligne de réception."),
        h('li', {},
          h('strong', { text: 'Soigner les découplages, ' }),
          "qui empêchent la haute fréquence de remonter par la ligne d’alimentation."),
        h('li', {},
          h('strong', { text: 'Vérifier la masse. ' }),
          "Un défaut de masse de l’émetteur est souvent à l’origine des brouillages."),
      ),
      h('p', { class: 'prose__note' },
        "Le passage des lignes de transmission vers les antennes est une source fréquente de problèmes " +
        "quand elles longent d’autres câbles — secteur, téléphone, télévision. À puissance égale, la FM " +
        "provoque moins de perturbations que les autres modes."),
      h('p', {},
        "Un brouillage peut entrer par trois portes : l’alimentation secteur, le circuit d’entrée du " +
        "récepteur perturbé, ou directement ses circuits internes par couplage ou rayonnement. Ce " +
        "dernier cas est le plus difficile à traiter."),

      h('h2', { text: 'Intermodulation et transmodulation' }),
      h('p', {},
        "Deux défauts distincts, souvent confondus, et tous deux dus à un manque de linéarité."),
      h('p', {},
        "L’",
        h('strong', { text: 'intermodulation' }),
        " naît du mélange de deux fréquences dans un étage non linéaire, aussi bien à la sortie d’un " +
        "émetteur qu’à l’entrée d’un récepteur. Avec deux fréquences A et B en entrée, on retrouve en " +
        "sortie leur somme et leur différence, leurs harmoniques, et des mélanges plus complexes."),
      h('p', { class: 'formula', text: '2B − A     et     2A − B     — les produits du troisième ordre' }),
      h('p', {},
        "Ces produits du troisième ordre sont d’autant plus difficiles à éliminer que A et B sont " +
        "voisines : ils tombent alors juste à côté des fréquences utiles, là où aucun filtre ne peut les " +
        "séparer."),
      h('p', {},
        "La ",
        h('strong', { text: 'transmodulation' }),
        " est autre chose. Un signal puissant sur une fréquence voisine sature l’étage d’entrée du " +
        "récepteur, qui perd sa linéarité. Ce signal indésirable module alors celui qu’on veut recevoir : " +
        "on entend les deux modulations superposées. Le signal parasite n’est pas reçu à sa fréquence — " +
        "il contamine celle qu’on écoute."),
    ),

    // --- Sécurité électrique ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'La sécurité des personnes' }),
      h('p', {},
        "La haute fréquence peut être dangereuse, particulièrement en SHF et EHF : on ne passe jamais " +
        "devant une parabole en émission. Les tensions présentes sur une antenne pendant l’émission sont " +
        "elles aussi importantes."),
      h('p', {},
        "Le courant continu, ou à 50 Hz, est d’autant plus dangereux que la tension est élevée. Les " +
        "normes retiennent trois seuils en dessous desquels une tension n’est pas considérée comme " +
        "dangereuse."),
    ),

    h(
      'div',
      { class: 'voltages' },
      ...SAFE_VOLTAGES.map((entry) =>
        h(
          'section',
          { class: 'voltage' },
          h('span', { class: 'voltage__limit', text: entry.limit }),
          h('span', { class: 'voltage__env', text: entry.environment }),
        ),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', {},
        "Au-dessus, il faut des compartiments fermés munis d’un système de coupure à l’ouverture — " +
        "précaution essentielle sur les alimentations haute tension des amplificateurs à tubes."),

      h('h3', { text: 'Le code des couleurs' }),
    ),

    h(
      'div',
      { class: 'wires' },
      ...WIRE_COLOURS.map((wire) =>
        h(
          'section',
          { class: 'wire' },
          h('span', { class: 'wire__swatch', attrs: { style: `background: ${wire.swatch}`, 'aria-hidden': 'true' } }),
          h('div', { class: 'wire__body' },
            h('span', { class: 'wire__role', text: wire.role }),
            h('span', { class: 'wire__colour', text: wire.colour }),
            h('p', { class: 'wire__note', text: wire.note })),
        ),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('h3', { text: 'Les risques et les protections' }),
      h('p', {},
        "Le courant provoque des brûlures et l’",
        h('strong', { text: 'électrisation' }),
        ", dont la gravité augmente par paliers : contraction locale des muscles, puis contraction des " +
        "muscles respiratoires avec risque d’asphyxie, puis fibrillation cardiaque pouvant entraîner le " +
        "décès."),
      h('p', { class: 'prose__note' },
        "Le vocabulaire compte, et l’examen le vérifie : on est ",
        h('em', { text: 'électrisé' }),
        " quand on survit, ",
        h('em', { text: 'électrocuté' }),
        " quand on en meurt. On ne peut donc pas dire « j’ai été électrocuté »."),
      h('p', {},
        "Le danger apparaît en ",
        h('strong', { text: 'contact direct' }),
        " — la personne touche la phase et le neutre, la terre ou le sol — ou en ",
        h('strong', { text: 'contact indirect' }),
        " : elle touche, en étant reliée au sol, la carrosserie métallique d’un appareil dont " +
        "l’isolation est défaillante."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          "Mettre à la terre toutes les parties métalliques susceptibles d’être portées " +
          "accidentellement à un potentiel dangereux."),
        h('li', {},
          "Ne ",
          h('strong', { text: 'jamais' }),
          " utiliser comme prise de terre les canalisations d’eau, de gaz ou de chauffage central."),
        h('li', {},
          "Préférer les ",
          h('strong', { text: 'disjoncteurs différentiels' }),
          " aux simples fusibles, même rapides : ils détectent la fuite de courant vers la terre, ce " +
          "qu’un fusible ne fait pas."),
      ),

      h('h3', { text: 'Travailler en hauteur' }),
      h('p', {},
        "La construction et l’entretien des antennes et de leurs supports imposent leurs propres règles : " +
        "baudrier ou harnais et longe à mousqueton pour qui grimpe, casque pour qui reste au pied du " +
        "pylône, balisage lorsque l’intervention empiète sur la voie publique."),

      h('h3', { text: 'La foudre' }),
      h('p', {},
        "Par temps orageux, une antenne accumule des charges statiques et devient le siège de courants " +
        "induits à chaque éclair. Trois précautions valent d’être retenues."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          "La foudre cherche le chemin le plus court et le plus droit : disposer le câble coaxial en ",
          h('strong', { text: 'coudes francs' }),
          " réduit le risque de foudroiement."),
        h('li', {},
          "Si le bâtiment porte un paratonnerre, un parafoudre relié au plus court à l’antenne peut être " +
          "monté."),
        h('li', {},
          "En cas d’orage, cesser d’émettre et débrancher les câbles. Une antenne n’est pas un " +
          "paratonnerre, pas plus que le pylône qui la porte ni le câble qui l’alimente."),
      ),
    ),

    h(
      'section',
      { class: 'card card--accent' },
      h('h2', { class: 'card__title', text: 'La réglementation est terminée' }),
      h('p', {},
        "Vous avez parcouru l’ensemble du programme de la première épreuve : le cadre, les classes " +
        "d’émission, les bandes, le trafic, la station, et ces bases techniques. C’est la partie la plus " +
        "rapide à acquérir des deux, et celle qui se révise le mieux en relisant."),
      h(
        'div',
        { class: 'actions' },
        h('a', { class: 'btn', href: '#/licence/examen', text: 'Revoir le déroulement de l’examen' }),
        h('a', { class: 'btn', href: '#/licence/cadre', text: 'Reprendre au début' }),
      ),
    ),
  );

  return { element };
}
