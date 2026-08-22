/**
 * Page « Comprendre la radio ».
 *
 * Les bases physiques et pratiques, dans l'ordre où elles servent : ce qu'est
 * une onde, où elle va, quelles bandes existent et à quoi chacune sert, ce que
 * contient une station, et ce qu'on a le droit d'en faire. Le morse n'a de sens
 * qu'une fois ce contexte posé — c'est un mode d'émission, pas une fin.
 */

import { h, setChildren } from '../ui/dom.ts';
import { BANDS, DOMAIN_LABELS, bandFor, isCwSegment, wavelength } from '../data/bands.ts';
import type { View, ViewContext } from '../ui/router.ts';

const formatKhz = (kHz: number): string =>
  kHz >= 1000
    ? `${(kHz / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 3 })} MHz`
    : `${kHz.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} kHz`;

// Trois chiffres significatifs : « 21,3 m » dit ce que « 21 m » cache, à savoir
// que la longueur d'onde ne coïncide pas avec le nom de la bande.
const formatMetres = (m: number): string => {
  if (m < 1) return `${(m * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} cm`;
  const digits = m >= 100 ? 0 : m >= 10 ? 1 : 2;
  return `${m.toLocaleString('fr-FR', { maximumFractionDigits: digits })} m`;
};

export function radioView(_context: ViewContext): View {
  // --- Convertisseur fréquence / longueur d'onde ---

  const result = h('div', { class: 'converter__result' });
  const unitSelect = h(
    'select',
    { class: 'select', attrs: { 'aria-label': 'Unité' }, on: { change: () => convert() } },
    h('option', { value: '1', text: 'kHz' }),
    h('option', { value: '1000', text: 'MHz', attrs: { selected: true } }),
  );
  const freqInput = h('input', {
    class: 'input',
    type: 'number',
    value: '14.060',
    attrs: { step: 'any', min: '0', 'aria-label': 'Fréquence' },
    on: { input: () => convert() },
  });

  const convert = (): void => {
    const value = Number(freqInput.value) * Number(unitSelect.value);
    if (!Number.isFinite(value) || value <= 0) {
      setChildren(result, [h('span', { class: 'prose__note', text: 'Entrez une fréquence.' })]);
      return;
    }
    const band = bandFor(value);
    setChildren(result, [
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Longueur d’onde' }),
        h('strong', { text: formatMetres(wavelength(value)) })),
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Bande radioamateur' }),
        band
          ? h('strong', { text: `${band.name} — ${DOMAIN_LABELS[band.domain]}` })
          : h('span', { class: 'prose__note', text: 'Hors des bandes radioamateur' })),
      band && isCwSegment(value)
        ? h('p', { class: 'field__hint', text: 'Cette fréquence tombe dans la portion réservée à la télégraphie.' })
        : null,
      band ? h('p', { class: 'field__hint', text: band.character }) : null,
    ]);
  };

  convert();

  // --- Tableau des bandes ---

  // Page de découverte : on s'arrête au 23 cm. Au-delà, les bandes
  // millimétriques n'apprennent rien à qui débute et noient les autres. Le
  // tableau exhaustif, avec les statuts, est sur la page Licence.
  const bandRows = BANDS.filter((band) => band.domain !== 'SHF' && band.domain !== 'EHF').map((band) =>
    h(
      'tr',
      {},
      h('th', { attrs: { scope: 'row' }, text: band.name }),
      h('td', { class: 'num', text: `${formatKhz(band.from)} – ${formatKhz(band.to)}` }),
      h('td', { text: DOMAIN_LABELS[band.domain] }),
      h('td', { class: 'num', text: band.cw ? `${formatKhz(band.cw[0])} – ${formatKhz(band.cw[1])}` : '—' }),
    ),
  );

  const element = h(
    'div',
    { class: 'stack' },

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__lead' },
        "Le morse est un mode d’émission, pas une fin en soi. Il prend son sens une fois qu’on sait ce " +
        "qu’on émet, où cela va, et pourquoi une même station s’entend à mille kilomètres le soir et " +
        "reste muette à midi. Voici les bases, dans l’ordre où elles servent."),

      h('h2', { text: 'Ce qu’est une onde radio' }),
      h('p', {},
        "Un courant qui oscille dans un conducteur rayonne autour de lui un champ électromagnétique qui " +
        "se propage à la vitesse de la lumière. Ce qui caractérise une onde, c’est le nombre " +
        "d’oscillations par seconde : sa ",
        h('strong', { text: 'fréquence' }),
        ", mesurée en hertz. Mille hertz font un kilohertz, un million un mégahertz."),
      h('p', {},
        "À cette fréquence correspond une ",
        h('strong', { text: 'longueur d’onde' }),
        " : la distance parcourue par l’onde pendant une oscillation. Les deux sont inséparables, et une " +
        "division suffit à passer de l’une à l’autre."),
      h('p', { class: 'formula', text: 'longueur d’onde (m) ≈ 300 / fréquence (MHz)' }),
      h('p', {},
        "C’est pourquoi les radioamateurs désignent leurs bandes par une longueur d’onde plutôt que par " +
        "une fréquence : « le 40 mètres » se comprend partout, et dit quelque chose de concret sur la " +
        "taille de l’antenne qu’il faudra. Une antenne efficace mesure typiquement une fraction simple de " +
        "la longueur d’onde — la moitié, le quart — ce qui explique qu’une antenne de 2 mètres tienne sur " +
        "un talkie tandis qu’une antenne de 160 mètres occupe un jardin entier."),

      h('h2', { text: 'Où vont les ondes' }),
      h('p', {},
        "Trois chemins coexistent, et c’est la fréquence qui décide lequel domine."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'L’onde de sol. ' }),
          "Elle suit la courbure du terrain sur quelques dizaines à quelques centaines de kilomètres. " +
          "D’autant plus loin que la fréquence est basse : c’est ce qui fait vivre les grandes ondes."),
        h('li', {},
          h('strong', { text: 'L’onde d’espace. ' }),
          "Elle monte vers le ciel, se réfléchit sur l’ionosphère et retombe à des milliers de kilomètres. " +
          "C’est le mécanisme des liaisons intercontinentales en décamétriques, et il ne fonctionne que " +
          "dans une certaine plage de fréquences."),
        h('li', {},
          h('strong', { text: 'La propagation directe. ' }),
          "Au-delà d’une trentaine de mégahertz, l’ionosphère ne renvoie plus rien : l’onde file en ligne " +
          "droite et s’arrête à l’horizon. D’où les relais placés en hauteur, en VHF et en UHF."),
      ),

      h('h2', { text: 'L’ionosphère, ce miroir capricieux' }),
      h('p', {},
        "Le rayonnement solaire arrache des électrons aux hautes couches de l’atmosphère, entre 60 et " +
        "400 kilomètres d’altitude. Ces couches ionisées se comportent comme un miroir pour les ondes " +
        "décamétriques — un miroir dont la hauteur, la densité et l’altitude changent en permanence."),
      h('p', {},
        "De jour, une couche basse absorbe les fréquences les plus basses : le 80 mètres devient régional. " +
        "La nuit, cette couche disparaît et la même bande porte à des milliers de kilomètres. À l’inverse, " +
        "les bandes hautes comme le 15 ou le 10 mètres ont besoin d’une ionisation forte, donc de soleil : " +
        "elles s’ouvrent le jour et se referment au crépuscule."),
      h('p', {},
        "Par-dessus ce rythme quotidien se superpose le ",
        h('strong', { text: 'cycle solaire' }),
        ", d’environ onze ans. À son maximum, les bandes hautes s’ouvrent sur le monde entier avec quelques " +
        "watts ; à son minimum, elles restent silencieuses des mois durant et le trafic se replie sur les " +
        "bandes basses. Un opérateur en morse en tire un avantage réel : un signal télégraphique reste " +
        "lisible bien plus bas dans le bruit qu’une voix, donc il passe encore quand la voix ne passe plus."),

      h('h2', { text: 'Les grands domaines de fréquences' }),
      h('p', {},
        "Le spectre est découpé en domaines dont chacun a son comportement. Les radioamateurs disposent " +
        "de petites tranches réparties dans plusieurs d’entre eux, jamais de domaines entiers."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {}, h('strong', { text: 'Basses et moyennes fréquences, jusqu’à 3 MHz. ' }),
          "Onde de sol, grandes distances la nuit, antennes gigantesques. Radiodiffusion en ondes longues et moyennes, radionavigation."),
        h('li', {}, h('strong', { text: 'Décamétriques, de 3 à 30 MHz. ' }),
          "Le domaine des liaisons mondiales sans aucune infrastructure. C’est là que se joue l’essentiel du trafic radioamateur lointain."),
        h('li', {}, h('strong', { text: 'Très hautes fréquences, de 30 à 300 MHz. ' }),
          "Portée optique, qualité sonore excellente, antennes compactes. Radio FM, aviation, relais locaux."),
        h('li', {}, h('strong', { text: 'Ultra hautes fréquences, au-delà de 300 MHz. ' }),
          "Portée courte, très large capacité. Téléphonie mobile, télévision, réseaux sans fil, satellites."),
      ),

      h('h2', { text: 'Les modes d’émission' }),
      h('p', {},
        "Une porteuse seule ne transmet rien : il faut la moduler. Chaque manière de le faire a son coût " +
        "en largeur de bande et sa résistance au bruit, et le rapport entre les deux explique tout."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {}, h('strong', { text: 'CW, la télégraphie. ' }),
          "On coupe et rétablit la porteuse : c’est le morse. Une centaine de hertz de largeur suffit, " +
          "contre plusieurs milliers pour la voix, et le récepteur peut donc filtrer d’autant plus " +
          "étroitement. C’est le mode qui passe le plus loin avec le moins de puissance."),
        h('li', {}, h('strong', { text: 'SSB, la bande latérale unique. ' }),
          "La voix, débarrassée de sa porteuse et d’une de ses deux bandes latérales pour économiser " +
          "puissance et largeur. Le mode vocal habituel en décamétriques."),
        h('li', {}, h('strong', { text: 'FM, la modulation de fréquence. ' }),
          "Excellente qualité sonore, mais large et sans portée lointaine. Réservée en pratique aux VHF et UHF, avec les relais."),
        h('li', {}, h('strong', { text: 'Les modes numériques. ' }),
          "Des protocoles récents extraient un message de signaux enfouis très loin sous le bruit, au prix " +
          "d’échanges lents et automatisés. Redoutablement efficaces, mais l’ordinateur y remplace l’opérateur."),
      ),

      h('h2', { text: 'De quoi se compose une station' }),
      h('p', {},
        "Un ",
        h('strong', { text: 'émetteur-récepteur' }),
        " produit et démodule le signal. Une ",
        h('strong', { text: 'ligne de transmission' }),
        " — le câble coaxial — l’achemine jusqu’à l’",
        h('strong', { text: 'antenne' }),
        ", qui seule convertit un courant en onde. De ces trois éléments, l’antenne est de très loin le " +
        "plus déterminant : une antenne médiocre gâche n’importe quel poste, tandis qu’une bonne antenne " +
        "sauve un poste modeste."),
      h('p', {},
        "Quand l’antenne n’est pas accordée sur la fréquence, une partie de la puissance revient vers " +
        "l’émetteur au lieu de partir. On mesure ce retour par le ",
        h('strong', { text: 'rapport d’ondes stationnaires' }),
        " : 1 signifie que tout part, 3 qu’une part appréciable revient, et au-delà l’émetteur se protège " +
        "en réduisant sa puissance. Une boîte d’accord masque le désaccord vu de l’émetteur, sans pour " +
        "autant améliorer l’antenne elle-même."),
      h('p', {},
        "La ",
        h('strong', { text: 'puissance' }),
        " compte moins qu’on ne l’imagine. Doubler la puissance ne gagne que trois décibels, à peine " +
        "perceptible ; améliorer l’antenne en gagne bien davantage. C’est ce qui rend le trafic en faible " +
        "puissance — le QRP, cinq watts ou moins — parfaitement praticable, surtout en morse."),

      h('h2', { text: 'Écouter, puis émettre' }),
      h('p', {},
        "En France comme presque partout, ",
        h('strong', { text: 'écouter est entièrement libre' }),
        " : un récepteur suffit, aucune formalité. C’est de loin la meilleure façon de commencer, et un " +
        "récepteur d’occasion ou un récepteur logiciel accessible en ligne permet d’entendre du morse réel " +
        "dès ce soir, sans rien acheter."),
      h('p', {},
        h('strong', { text: 'Émettre demande une licence' }),
        ", délivrée après un examen portant sur la technique et la réglementation, et qui donne droit à un " +
        "indicatif personnel. Cette obligation n’est pas une formalité administrative : un émetteur mal " +
        "employé brouille des services dont dépendent d’autres personnes, et l’examen existe pour cela."),
      h('p', {},
        "Un contact typique tient en peu de choses : on appelle — « CQ CQ CQ de F5ABC » — ou l’on répond à " +
        "un appel ; on échange les indicatifs, un compte rendu d’écoute, souvent le prénom et la localité ; " +
        "on remercie et l’on rend la fréquence. Le vocabulaire de cet échange est réuni dans ",
        h('a', { href: '#/apprendre/communication', text: 'Communiquer en morse' }),
        "."),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Fréquence et longueur d’onde' }),
      h('div', { class: 'toolbar' }, freqInput, unitSelect),
      result,
      h('p', { class: 'card__hint' },
        "Essayez 7,030 MHz — le cœur de la télégraphie sur 40 mètres — ou 145,500 MHz, la fréquence " +
        "d’appel en 2 mètres."),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Les bandes radioamateur' }),
      h('p', { class: 'card__hint' },
        "Allocations de la région 1 de l’Union internationale des télécommunications — Europe, Afrique et " +
        "Moyen-Orient. Elles varient d’un pays à l’autre et évoluent : ce tableau donne la logique " +
        "d’ensemble, il ne remplace pas le texte en vigueur publié par l’administration nationale, seul " +
        "opposable."),
      h(
        'div',
        { class: 'table-wrap' },
        h(
          'table',
          { class: 'data-table' },
          h('thead', {},
            h('tr', {},
              h('th', { attrs: { scope: 'col' }, text: 'Bande' }),
              h('th', { attrs: { scope: 'col' }, text: 'Fréquences' }),
              h('th', { attrs: { scope: 'col' }, text: 'Domaine' }),
              h('th', { attrs: { scope: 'col' }, text: 'Portion télégraphie' }))),
          h('tbody', {}, ...bandRows),
        ),
      ),
      h('p', { class: 'card__hint' },
        "La télégraphie occupe toujours le bas de bande, par convention internationale. C’est là qu’il " +
        "faut écouter pour entendre du morse, et là qu’on s’installe pour en émettre."),
      h('p', { class: 'field__hint' },
        "Ce tableau s’arrête au 23 centimètres. Le service amateur dispose aussi de neuf bandes " +
        "millimétriques au-delà, réservées en pratique aux expérimentateurs ; elles figurent, avec le " +
        "statut réglementaire de chaque bande, dans ",
        h('a', { href: '#/licence/bandes', text: 'Bandes et puissances' }),
        "."),
    ),

    h(
      'details',
      { class: 'help' },
      h('summary', { text: 'Par où commencer concrètement' }),
      h('p', {},
        "Écoutez avant tout. Des récepteurs pilotables à distance donnent accès, depuis un navigateur, à " +
        "de vraies antennes réparties dans le monde : on y entend du morse réel à toute heure, avec son " +
        "bruit, ses évanouissements et ses opérateurs plus ou moins réguliers. C’est le meilleur " +
        "complément à l’entraînement de ce site."),
      h('p', {},
        "Repérez-vous ensuite dans les bas de bande : 7,000 à 7,040 MHz le soir, 14,000 à 14,070 MHz en " +
        "journée. Reconnaître un indicatif au passage est déjà une victoire, et c’est exactement ce que " +
        "les exercices Mots et indicatifs préparent."),
      h('p', {},
        "Renseignez-vous enfin auprès d’un club : la préparation à l’examen s’y fait en groupe, on y " +
        "essaie du matériel qu’on n’achèterait pas à l’aveugle, et la télégraphie s’y transmet encore " +
        "d’opérateur à opérateur."),
    ),
  );

  return { element };
}
