/**
 * Page « Fréquences, puissances et statuts ».
 *
 * Les questions d'examen sur ce chapitre portent presque toutes sur trois
 * choses : les limites d'une bande, sa largeur et son statut. Le tableau est
 * donc l'objet principal de la page, et il calcule la largeur lui-même plutôt
 * que de la laisser à la charge du lecteur — l'erreur d'arithmétique sous
 * chronomètre est un piège classique, mieux vaut l'avoir vue une fois.
 */

import { h, setChildren } from '../ui/dom.ts';
import {
  BANDS,
  DOMAIN_LABELS,
  STATUS_LABELS,
  STATUS_NOTES,
  bandFor,
  bandWidth,
  statusFor,
} from '../data/bands.ts';
import type { Band, BandStatus } from '../data/bands.ts';
import type { View, ViewContext } from '../ui/router.ts';

const STATUSES: BandStatus[] = ['A', 'B', 'C', 'D'];

const formatKhz = (kHz: number): string =>
  kHz >= 1_000_000
    ? `${(kHz / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 3 })} GHz`
    : kHz >= 1000
      ? `${(kHz / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 4 })} MHz`
      : `${kHz.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} kHz`;

const formatWidth = (kHz: number): string =>
  kHz >= 1_000_000
    ? `${(kHz / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} GHz`
    : kHz >= 1000
      ? `${(kHz / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} MHz`
      : `${kHz.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} kHz`;

const statusCell = (band: Band): HTMLElement =>
  h(
    'td',
    {},
    ...band.segments.flatMap((segment, index) => [
      index > 0 ? h('br', {}) : null,
      h('span', { class: `status status--${segment.status.toLowerCase()}`, text: segment.status }),
      band.segments.length > 1
        ? h('span', { class: 'status__range', text: ` ${formatKhz(segment.from)} – ${formatKhz(segment.to)}` })
        : null,
    ].filter(Boolean) as HTMLElement[]),
  );

export function licenceBandsView(_context: ViewContext): View {
  // --- Vérificateur de fréquence ---

  const verdict = h('div', { class: 'converter__result' });
  const freq = h('input', {
    class: 'input',
    type: 'number',
    value: '10125',
    attrs: { step: 'any', min: '0', 'aria-label': 'Fréquence en kilohertz' },
    on: { input: () => check() },
  });

  const check = (): void => {
    const kHz = Number(freq.value);
    if (!Number.isFinite(kHz) || kHz <= 0) {
      setChildren(verdict, [h('span', { class: 'prose__note', text: 'Entrez une fréquence en kilohertz.' })]);
      return;
    }
    const band = bandFor(kHz);
    const status = statusFor(kHz);
    setChildren(verdict, [
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Bande' }),
        band
          ? h('strong', { text: `${band.name} — ${DOMAIN_LABELS[band.domain]}` })
          : h('strong', { class: 'is-error', text: 'Hors des bandes radioamateur' })),
      band
        ? h('div', { class: 'converter__line' },
            h('span', { class: 'converter__label', text: 'Limites' }),
            h('strong', { text: `${formatKhz(band.from)} – ${formatKhz(band.to)}` }))
        : null,
      band
        ? h('div', { class: 'converter__line' },
            h('span', { class: 'converter__label', text: 'Largeur' }),
            h('strong', { text: formatWidth(bandWidth(band)) }))
        : null,
      status
        ? h('div', { class: 'converter__line' },
            h('span', { class: 'converter__label', text: 'Statut' }),
            h('strong', {},
              h('span', { class: `status status--${status.toLowerCase()}`, text: status }),
              ` ${STATUS_LABELS[status]}`))
        : null,
      band?.eirpWatts
        ? h('p', { class: 'field__hint', text: `Puissance limitée à ${band.eirpWatts} W PIRE sur cette bande.` })
        : null,
    ]);
  };

  check();

  const element = h(
    'div',
    { class: 'stack' },

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__lead' },
        "Le service amateur ne possède pas de bandes : il en occupe des tranches, souvent partagées avec " +
        "d’autres services, et à des conditions qui varient d’une tranche à l’autre. Savoir sur quelle " +
        "bande on est ne suffit donc pas — il faut savoir à quel titre on y est."),

      h('h2', { text: 'Trois régions dans le monde' }),
      h('p', {},
        "Le Règlement des radiocommunications découpe le globe en trois régions, et les attributions " +
        "diffèrent de l’une à l’autre. C’est la première chose à vérifier devant une question : une " +
        "limite de bande juste en région 2 peut être fausse en région 1."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'Région 1 — ' }),
          "Europe, Afrique, Proche-Orient et pays de l’ex-URSS. C’est celle de la France continentale, de " +
          "la Corse, de La Réunion et de Mayotte, et celle sur laquelle porte l’examen."),
        h('li', {},
          h('strong', { text: 'Région 2 — ' }),
          "les Amériques et le Pacifique Nord. La Guyane, la Martinique et la Guadeloupe y sont, ainsi " +
          "que Saint-Pierre-et-Miquelon, Saint-Martin et Saint-Barthélemy."),
        h('li', {},
          h('strong', { text: 'Région 3 — ' }),
          "le reste du monde : Asie hors Proche-Orient, Océanie et Pacifique Sud. La Nouvelle-Calédonie " +
          "et la Polynésie française y sont."),
      ),
      h('p', { class: 'prose__note' },
        "L’ARCEP n’est compétente qu’en métropole, dans les départements et régions d’outre-mer et dans " +
        "trois collectivités. Ailleurs, c’est un arrêté du 2 mars 2021 qui fixe les conditions."),

      h('h2', { text: 'Le statut d’une bande' }),
      h('p', {},
        "Quatre statuts existent, et ils décident des priorités face aux autres services. Retenir la " +
        "logique dispense d’apprendre la liste : la question est toujours « qui doit s’effacer devant " +
        "qui ? »."),
    ),

    h(
      'div',
      { class: 'statuses' },
      ...STATUSES.map((status) =>
        h(
          'section',
          { class: `status-card status-card--${status.toLowerCase()}` },
          h('header', { class: 'status-card__head' },
            h('span', { class: `status status--${status.toLowerCase()}`, text: status }),
            h('h3', { class: 'status-card__name', text: STATUS_LABELS[status] })),
          h('p', { class: 'status-card__note', text: STATUS_NOTES[status] }),
        ),
      ),
    ),

    // --- Vérificateur ---
    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Situer une fréquence' }),
      h('p', { class: 'card__hint' },
        "En kilohertz, comme dans les textes réglementaires. Essayez 10 125, puis 7 250 pour voir ce que " +
        "donne une fréquence hors bande."),
      h('div', { class: 'toolbar' },
        freq,
        h('span', { class: 'converter__label', text: 'kHz' })),
      verdict,
    ),

    // --- Tableau ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Les bandes de la région 1' }),
      h('p', {},
        "Vingt-cinq bandes, des ondes kilométriques au millimètre. L’examen porte surtout sur celles " +
        "d’en haut du tableau — limites, largeur, statut — et très peu sur les hyperfréquences."),
      h('p', { class: 'prose__note' },
        "Attention à la présentation des nombres : le séparateur de milliers et la virgule décimale se " +
        "ressemblent sous chronomètre, et les multiples changent d’une ligne à l’autre. C’est le piège " +
        "le plus fréquent de ce chapitre."),
    ),

    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        { class: 'data-table' },
        h('thead', {}, h('tr', {},
          h('th', { attrs: { scope: 'col' }, text: 'Bande' }),
          h('th', { attrs: { scope: 'col' }, text: 'Limites' }),
          h('th', { attrs: { scope: 'col' }, text: 'Largeur' }),
          h('th', { attrs: { scope: 'col' }, text: 'Statut' }),
          h('th', { attrs: { scope: 'col' }, text: 'Satellite' }))),
        h('tbody', {}, ...BANDS.map((band) =>
          h('tr', {},
            h('th', { attrs: { scope: 'row' }, text: band.name }),
            h('td', { class: 'num', text: `${formatKhz(band.from)} – ${formatKhz(band.to)}` }),
            h('td', { class: 'num', text: formatWidth(bandWidth(band)) }),
            statusCell(band),
            h('td', { class: 'num', text: band.satellite ? `${formatKhz(band.satellite[0])} – ${formatKhz(band.satellite[1])}` : '—' })))),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'field__hint' },
        "La bande des 1,35 mètre — 220 à 225 MHz — n’apparaît pas : elle n’est attribuée qu’en région 2. " +
        "Celle des 9 centimètres non plus, pour la même raison. Le service amateur compte vingt-sept " +
        "bandes dans le monde, vingt-cinq d’entre elles étant ouvertes en région 1."),

      h('h2', { text: 'Le service par satellite' }),
      h('p', {},
        "Le service d’amateur par satellite est toujours distingué du service d’amateur, même quand les " +
        "deux partagent une bande et son statut. Le trafic par satellite est possible sur toutes les " +
        "bandes à partir du 40 mètres — sauf sur le 30 mètres, le 6 mètres, le 1,35 mètre et le " +
        "2,4 millimètres — mais rarement sur la bande entière, et parfois dans un seul sens."),
      h('p', {},
        "Une règle particulière s’y applique : tout brouillage préjudiciable causé par un satellite " +
        "amateur doit pouvoir être éliminé immédiatement. C’est pourquoi le Règlement impose que des " +
        "stations terriennes de commande en nombre suffisant soient installées avant tout lancement."),

      h('h2', { text: 'Puissances autorisées' }),
      h('p', {},
        "La puissance maximale est mesurée ",
        h('strong', { text: 'en crête à la sortie de l’émetteur' }),
        " — plus précisément, la moyenne de la puissance fournie à la ligne d’alimentation de l’antenne " +
        "au cours d’un cycle de radiofréquence correspondant à l’amplitude maximale de l’enveloppe de " +
        "modulation. En AM et en BLU, c’est la puissance en pointe d’enveloppe, la PEP."),
    ),

    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        { class: 'data-table' },
        h('thead', {}, h('tr', {},
          h('th', { attrs: { scope: 'col' }, text: 'Certificat' }),
          h('th', { attrs: { scope: 'col' }, text: 'Bandes' }),
          h('th', { attrs: { scope: 'col' }, text: 'Puissance' }),
          h('th', { attrs: { scope: 'col' }, text: 'Classes d’émission' }))),
        h('tbody', {},
          h('tr', {},
            h('th', { attrs: { scope: 'row' }, text: 'Classe unique' }),
            h('td', { text: 'Toutes les bandes des services d’amateur et d’amateur par satellite' }),
            h('td', { class: 'num', text: '500 W sous 28 MHz · 250 W de 28 à 30 MHz · 120 W au-delà' }),
            h('td', { text: 'Toutes' })),
          h('tr', { class: 'is-dim' },
            h('th', { attrs: { scope: 'row' }, text: 'Classe 3 (ancienne)' }),
            h('td', { text: '144 à 146 MHz uniquement' }),
            h('td', { class: 'num', text: '10 W' }),
            h('td', { text: 'A1A, A2A, A3E, F3E, G3E, J3E' }))),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', {},
        "Trois bandes échappent à cette règle et voient leur puissance exprimée en ",
        h('strong', { text: 'PIRE' }),
        ", puissance isotrope rayonnée équivalente, qui tient compte du gain de l’antenne : ",
        h('strong', { text: '1 watt' }),
        " sur les bandes des 2200 et 630 mètres, ",
        h('strong', { text: '15 watts' }),
        " sur celle des 60 mètres. Partout ailleurs, la réglementation ne limite pas le gain des " +
        "antennes."),
      h('p', { class: 'prose__note' },
        "Depuis 1997, l’administration n’impose plus de portions de bande par classe d’émission. Cela ne " +
        "dispense pas de respecter les plans de bande définis par l’IARU : ce sont des accords entre " +
        "opérateurs, pas des textes réglementaires, mais s’en affranchir revient à brouiller ses " +
        "voisins."),

      h('h2', { text: 'Autour de la station' }),
      h('h3', { text: 'Exposition du public' }),
      h('p', {},
        "Un décret fixe les valeurs limites d’exposition du public aux champs électromagnétiques, en " +
        "volts par mètre selon la fréquence. La plus basse — 28 V/m entre 10 et 400 MHz — correspond à " +
        "une densité de puissance d’environ 2 W/m². Compte tenu des puissances autorisées et du fait que " +
        "les antennes visent l’horizon plutôt que le sol, une station amateur en reste normalement très " +
        "loin."),
      h('h3', { text: 'Servitudes de protection' }),
      h('p', {},
        "Autour de certains centres de réception de l’État existent une zone de protection et, à " +
        "l’intérieur, une zone de garde. Dans la zone de protection, il est interdit de produire des " +
        "perturbations incompatibles avec l’exploitation du centre ; dans la zone de garde, mettre en " +
        "service un matériel susceptible de perturber demande une autorisation ministérielle. Pour les " +
        "installations de première catégorie, la zone de garde ne peut excéder ",
        h('strong', { text: '1000 mètres' }),
        "."),
      h('p', { class: 'field__hint' },
        "Ces zones sont annexées au plan local d’urbanisme et consultables en mairie. Elles restent " +
        "valables pour tout trafic, y compris en portable et en mobile."),
    ),
  );

  return { element };
}
