/**
 * Page « Diodes et alimentations ».
 *
 * Le premier composant actif, et le plus simple : il ne fait qu'une chose,
 * laisser passer dans un sens. Tout le chapitre en découle — le redressement,
 * la stabilisation, et les variantes de diodes qui exploitent chacune un effet
 * particulier de la jonction.
 */

import { h, setChildren } from '../ui/dom.ts';
import { DIODE_DROPS, diodesInPath, peakFromRms, rectifiedVoltage } from '../core/radio-math.ts';
import type { RectifierKind } from '../core/radio-math.ts';
import { DIODE_KINDS } from '../data/actives.ts';
import { num } from '../ui/units.ts';
import type { View, ViewContext } from '../ui/router.ts';

export function licenceDiodesView(_context: ViewContext): View {
  // --- Alimentation redressée ---

  const out = h('div', { class: 'converter__result' });
  const rmsInput = h('input', {
    class: 'input', type: 'number', value: '12',
    attrs: { step: 'any', min: '0', 'aria-label': 'Tension efficace du secondaire en volts' },
    on: { input: () => compute() },
  });
  const kindSelect = h(
    'select',
    { class: 'select', attrs: { 'aria-label': 'Montage redresseur' }, on: { change: () => compute() } },
    h('option', { value: 'bridge', text: 'Pont de diodes' }),
    h('option', { value: 'centre-tap', text: 'Transformateur à point milieu' }),
    h('option', { value: 'mono', text: 'Mono-alternance' }),
  );
  const materialSelect = h(
    'select',
    { class: 'select', attrs: { 'aria-label': 'Semi-conducteur' }, on: { change: () => compute() } },
    h('option', { value: 'silicium', text: 'Silicium — 0,7 V' }),
    h('option', { value: 'germanium', text: 'Germanium — 0,3 V' }),
    h('option', { value: 'schottky', text: 'Schottky — 0,25 V' }),
  );

  const compute = (): void => {
    const rms = Number(rmsInput.value);
    if (!Number.isFinite(rms) || rms <= 0) {
      setChildren(out, [h('span', { class: 'prose__note', text: 'Entrez une tension efficace.' })]);
      return;
    }
    const kind = kindSelect.value as RectifierKind;
    const drop = DIODE_DROPS[materialSelect.value as keyof typeof DIODE_DROPS];
    const peak = peakFromRms(rms);
    const diodes = diodesInPath(kind);
    setChildren(out, [
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Tension crête du secondaire' }),
        h('strong', { text: `${num(peak)} V` })),
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: `Chute dans ${diodes} diode${diodes > 1 ? 's' : ''}` }),
        h('strong', { text: `− ${num(diodes * drop)} V` })),
      h('div', { class: 'converter__line converter__line--result' },
        h('span', { class: 'converter__label', text: 'Tension continue en sortie' }),
        h('strong', { text: `${num(rectifiedVoltage(rms, kind, drop))} V` })),
      h('p', { class: 'field__hint' },
        kind === 'mono'
          ? "Une seule alternance est utilisée : le condensateur de filtrage doit être bien plus gros pour maintenir la tension entre deux crêtes."
          : kind === 'bridge'
            ? "Quatre diodes, deux traversées à chaque alternance : la chute est doublée, mais le transformateur est ordinaire et moins cher."
            : "Deux diodes seulement, donc une seule chute — au prix d’un transformateur à point milieu, plus cher et plus encombrant."),
      h('p', { class: 'field__hint' },
        `Les questions d’examen ignorent souvent la chute des diodes : la réponse attendue serait alors ` +
        `${num(peak)} V, la simple valeur crête.`),
    ]);
  };

  compute();

  const element = h(
    'div',
    { class: 'stack' },

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__lead' },
        "Une diode ne fait qu’une chose : laisser passer le courant dans un sens et le bloquer dans " +
        "l’autre. De cette dissymétrie découlent le redressement, la stabilisation, la détection, la " +
        "commutation — et l’essentiel de l’électronique."),

      h('h2', { text: 'La jonction PN' }),
      h('p', {},
        "Le silicium et le germanium purs sont de piètres conducteurs : leurs électrons sont tous liés. " +
        "En y introduisant des impuretés en quantité infime — de l’antimoine, de l’arsenic, du bore, du " +
        "gallium — on les ",
        h('strong', { text: 'dope' }),
        " et on les rend conducteurs."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'Dopage N ' }),
          "— on ajoute des électrons libres. N comme négatif, la charge de l’électron."),
        h('li', {},
          h('strong', { text: 'Dopage P ' }),
          "— on ajoute des trous, c’est-à-dire des manques d’électrons. P comme positif. Les trous sont " +
          "des particules fictives, qui se déplacent en sens inverse des électrons."),
      ),
      h('p', {},
        "La ",
        h('strong', { text: 'jonction' }),
        " est la frontière entre les deux zones. Au repos, les électrons de la zone N s’y recombinent " +
        "avec les trous de la zone P et forment une ",
        h('strong', { text: 'barrière de potentiel' }),
        " très résistante — plusieurs mégohms."),
      h('p', {},
        "Alimentée en ",
        h('strong', { text: 'sens inverse' }),
        " — N au plus, P au moins — la barrière s’élargit et la diode devient très résistante. Alimentée " +
        "en ",
        h('strong', { text: 'sens direct' }),
        ", les électrons franchissent la barrière dès que la tension de seuil est atteinte, et le courant " +
        "s’établit. Le courant circule de P vers N : l’anode au plus, la cathode au moins."),
      h('p', { class: 'formula', text: 'Seuil : 0,7 V au silicium — 0,3 V au germanium — 0,25 V pour une Schottky' }),
      h('p', { class: 'prose__note' },
        "Deux repères pour identifier la cathode : la barre du symbole — le K à l’envers — et une bague " +
        "de couleur sur le composant. Sur une diode de puissance, c’est le boîtier métallique qui est " +
        "relié à la cathode, avec un pas de vis pour la fixer sur un radiateur."),
      h('p', {},
        "Poussée assez loin en inverse, toute diode finit par céder : c’est la ",
        h('strong', { text: 'tension de claquage' }),
        ", ou tension d’avalanche. Sa résistance devient nulle. Ce claquage est destructeur pour une " +
        "diode de redressement, mais parfaitement réversible pour une diode Zener — c’est même son " +
        "principe de fonctionnement."),
      h('p', { class: 'field__hint' },
        "Une conséquence secondaire de la barrière de potentiel : sa largeur varie avec la tension " +
        "inverse, donc sa capacité aussi. C’est l’effet Varicap, que la diode du même nom exploite. " +
        "Et chaque recombinaison trou-électron émet un photon ou de la chaleur : c’est aussi de là que " +
        "vient le bruit d’un semi-conducteur."),

      h('h2', { text: 'La famille des diodes' }),
      h('p', {},
        "Six variantes suffisent au programme, chacune exploitant un effet particulier de la jonction."),
    ),

    h(
      'div',
      { class: 'lexicon' },
      ...DIODE_KINDS.map((diode) =>
        h(
          'details',
          { class: 'lexicon__group' },
          h('summary', { class: 'lexicon__summary' },
            h('span', { class: 'lexicon__title', text: diode.name }),
            h('span', { class: 'lexicon__count', text: diode.use })),
          h('p', { class: 'lexicon__description', text: diode.detail }),
          h('p', { class: 'field__hint', text: `Au schéma : ${diode.symbol}.` }),
        ),
      ),
    ),

    // --- Redressement ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Redresser l’alternatif' }),
      h('p', {},
        "Trois montages, du plus simple au plus employé. Tous se terminent par un condensateur " +
        "électrochimique de forte valeur, qui lisse la tension en la maintenant à la valeur crête entre " +
        "deux sommets de la sinusoïde."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'Mono-alternance — une diode. ' }),
          "Une seule alternance passe. Simple, mais le condensateur doit être bien plus gros."),
        h('li', {},
          h('strong', { text: 'Point milieu — deux diodes. ' }),
          "Chaque alternance emprunte une moitié du secondaire et sa diode. Une seule chute de tension, " +
          "mais un transformateur à point milieu, plus cher et plus encombrant."),
        h('li', {},
          h('strong', { text: 'Pont de Graëtz — quatre diodes. ' }),
          "Toutes dans le même sens, flèches vers le condensateur. À chaque alternance, deux diodes " +
          "opposées conduisent. Transformateur ordinaire, mais chute doublée."),
      ),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Tension d’une alimentation' }),
      h('div', { class: 'toolbar' },
        rmsInput,
        h('span', { class: 'converter__label', text: 'V efficaces au secondaire,' }),
        kindSelect,
        materialSelect),
      out,
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__note' },
        "Un détail qui compte pour le rendement : les diodes ne conduisent que pendant la « remise à " +
        "niveau » du condensateur, un intervalle très bref entre le moment où la sinusoïde rattrape la " +
        "tension du condensateur et son maximum. Le courant instantané y est donc bien supérieur au " +
        "courant moyen délivré."),

      h('h3', { text: 'Stabiliser et réguler' }),
      h('p', {},
        "Après le condensateur de filtrage vient un étage qui maintient la tension malgré les variations " +
        "de la charge — car la charge, vue de l’alimentation, est une résistance variable : les " +
        "équipements branchés consomment plus ou moins."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'Le stabilisateur ' }),
          "se monte ",
          h('strong', { text: 'en parallèle' }),
          " sur la charge. Une diode Zener suffit."),
        h('li', {},
          h('strong', { text: 'Le régulateur ' }),
          "se monte ",
          h('strong', { text: 'en série' }),
          " avec la charge, et a besoin d’une tension de référence stabilisée."),
      ),
      h('p', {},
        "Les deux se combinent en pratique : une Zener fournit la référence à un régulateur bâti autour " +
        "d’un transistor « ballast » monté en collecteur commun."),
    ),

    h(
      'section',
      { class: 'card card--accent' },
      h('h2', { class: 'card__title', text: 'À retenir de ce chapitre' }),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {}, "0,7 V au silicium, 0,3 V au germanium. Le pont en fait chuter deux, soit 1,4 V."),
        h('li', {}, "Le courant va de P vers N ; anode au plus, cathode au moins."),
        h('li', {}, "Zener et Varicap se montent toutes deux en inverse — mais l’une stabilise, l’autre accorde."),
        h('li', {}, "Le condensateur de filtrage maintient la tension à la valeur crête, pas à la valeur efficace."),
        h('li', {}, "Stabilisateur en parallèle, régulateur en série."),
      ),
    ),
  );

  return { element };
}
