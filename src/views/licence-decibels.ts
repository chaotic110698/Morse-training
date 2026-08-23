/**
 * Page « Décibels et puissances ».
 *
 * Le décibel est l'outil transversal de toute l'épreuve : il sert aux gains
 * d'antenne, aux pertes de câble, aux rayonnements non essentiels. L'examen
 * n'exige que neuf rapports, ce qui change tout — inutile de savoir calculer
 * un logarithme, il faut savoir reconnaître neuf valeurs et les additionner.
 * Le convertisseur le dit explicitement plutôt que de laisser croire qu'on
 * doit tout savoir calculer.
 */

import { h, setChildren } from '../ui/dom.ts';
import {
  DB_RATIOS,
  efficiency,
  isExamRatio,
  powerRatio,
  voltageRatio,
} from '../core/radio-math.ts';
import type { View, ViewContext } from '../ui/router.ts';

interface Unit {
  code: string;
  reference: string;
  usage: string;
}

const UNITS: Unit[] = [
  { code: 'dBW', reference: '1 watt', usage: "La puissance d’un émetteur." },
  { code: 'dBm', reference: '1 milliwatt', usage: "Les puissances faibles, comme un signal reçu sur une antenne." },
  { code: 'dBµ', reference: '1 microwatt', usage: "Les puissances très faibles." },
  { code: 'dBc', reference: 'la porteuse', usage: "L’atténuation des rayonnements non essentiels par rapport à l’émission utile." },
  { code: 'dBd', reference: 'le doublet demi-onde', usage: "Le gain d’une antenne, comparé au dipôle." },
  { code: 'dBi', reference: "l’antenne isotrope", usage: "Le gain d’une antenne, comparé au rayonneur idéal. Toujours 2,14 dB de plus qu’en dBd." },
];

const format = (value: number): string =>
  value.toLocaleString('fr-FR', { maximumFractionDigits: value < 10 ? 3 : 1 });

export function licenceDecibelsView(_context: ViewContext): View {
  // --- Convertisseur décibels ---

  const result = h('div', { class: 'converter__result' });
  const dbInput = h('input', {
    class: 'input',
    type: 'number',
    value: '6',
    attrs: { step: 'any', 'aria-label': 'Gain en décibels' },
    on: { input: () => convert() },
  });
  const powerInput = h('input', {
    class: 'input',
    type: 'number',
    value: '15',
    attrs: { step: 'any', min: '0', 'aria-label': 'Puissance d’entrée en watts' },
    on: { input: () => convert() },
  });

  const convert = (): void => {
    const db = Number(dbInput.value);
    const watts = Number(powerInput.value);
    if (!Number.isFinite(db)) {
      setChildren(result, [h('span', { class: 'prose__note', text: 'Entrez un gain en décibels.' })]);
      return;
    }
    const ratio = powerRatio(db);
    setChildren(result, [
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Rapport de puissance' }),
        h('strong', { text: ratio >= 1 ? `× ${format(ratio)}` : `1 / ${format(1 / ratio)}` })),
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Rapport de tension' }),
        h('strong', { text: `× ${format(voltageRatio(db))}` })),
      Number.isFinite(watts) && watts > 0
        ? h('div', { class: 'converter__line' },
            h('span', { class: 'converter__label', text: `${format(watts)} W deviennent` }),
            h('strong', { text: `${format(watts * ratio)} W` }))
        : null,
      isExamRatio(db)
        ? h('p', { class: 'field__hint', text: 'Ce rapport fait partie des neuf à connaître par cœur.' })
        : h('p', { class: 'field__hint is-warn' },
            "Ce rapport ne fait pas partie des neuf exigibles : à l’examen, une question ne peut pas " +
            "reposer dessus. Si votre calcul y aboutit, c’est probablement qu’il faut le poursuivre."),
    ]);
  };

  convert();

  // --- Rendement ---

  const yieldOut = h('strong', {});
  const usefulInput = h('input', {
    class: 'input',
    type: 'number',
    value: '30',
    attrs: { step: 'any', min: '0', 'aria-label': 'Puissance utile en watts' },
    on: { input: () => computeYield() },
  });
  const consumedInput = h('input', {
    class: 'input',
    type: 'number',
    value: '50',
    attrs: { step: 'any', min: '0', 'aria-label': 'Puissance consommée en watts' },
    on: { input: () => computeYield() },
  });
  const lostOut = h('span', { class: 'field__hint' });

  const computeYield = (): void => {
    const useful = Number(usefulInput.value);
    const consumed = Number(consumedInput.value);
    if (!Number.isFinite(useful) || !Number.isFinite(consumed) || consumed <= 0) {
      yieldOut.textContent = '—';
      lostOut.textContent = 'Entrez deux puissances.';
      return;
    }
    const value = efficiency(useful, consumed);
    yieldOut.textContent = `${format(value)} %`;
    lostOut.textContent = useful > consumed
      ? "La puissance utile ne peut pas dépasser la puissance consommée : le rendement est toujours inférieur à 100 %."
      : `${format(consumed - useful)} W sont dissipés en chaleur.`;
  };

  computeYield();

  const element = h(
    'div',
    { class: 'stack' },

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__lead' },
        "Le décibel exprime un rapport entre deux grandeurs de même nature. Il traverse tout le " +
        "programme — gains d’antenne, pertes de câble, rayonnements parasites — et c’est la seule " +
        "notion mathématique que l’épreuve de réglementation exige vraiment."),
      h('p', {},
        "Bonne nouvelle : elle n’en exige que neuf valeurs. Aucun logarithme à calculer, aucune " +
        "calculette à sortir. Neuf rapports à reconnaître, et une règle d’addition."),

      h('h2', { text: 'Les neuf rapports à connaître' }),
    ),

    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        { class: 'data-table' },
        h('thead', {}, h('tr', {},
          h('th', { attrs: { scope: 'col' }, text: 'Gain' }),
          ...DB_RATIOS.map((entry) => h('th', { class: 'num', attrs: { scope: 'col' }, text: `${entry.db > 0 ? '+' : ''}${entry.db} dB` })))),
        h('tbody', {}, h('tr', {},
          h('th', { attrs: { scope: 'row' }, text: 'Rapport' }),
          ...DB_RATIOS.map((entry) => h('td', { class: 'num', text: entry.label })))),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', {},
        "La structure se retient d’elle-même : ",
        h('strong', { text: '3 dB double' }),
        ", ",
        h('strong', { text: '10 dB multiplie par dix' }),
        ", et le reste s’en déduit. 6 dB, c’est deux fois 3 dB, donc deux fois le double : quatre. " +
        "20 dB, c’est deux fois 10 dB, donc cent. Un signe moins renverse le rapport : −6 dB divise " +
        "par quatre."),
      h('p', {},
        "La règle qui rend tout cela utile : ",
        h('strong', { text: 'les décibels s’additionnent' }),
        ". Une antenne de 8 dB au bout d’un câble qui perd 2 dB donne un ensemble de 6 dB — donc un " +
        "rapport de quatre. C’est exactement ce que l’examen fait calculer."),
      h('p', { class: 'prose__note' },
        "Attention au piège des tensions. Un rapport exprimé en tension vaut le double, en décibels, du " +
        "même rapport exprimé en puissance : doubler la tension quadruple la puissance, soit 6 dB. Un " +
        "gain de 12 dB appliqué à 10 V donne donc 40 V, pas 160."),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Convertir un gain' }),
      h('div', { class: 'toolbar' },
        dbInput,
        h('span', { class: 'converter__label', text: 'dB appliqués à' }),
        powerInput,
        h('span', { class: 'converter__label', text: 'W' })),
      result,
      h(
        'div',
        { class: 'chips' },
        ...DB_RATIOS.map((entry) =>
          h('button', {
            class: 'chip',
            type: 'button',
            text: `${entry.db > 0 ? '+' : ''}${entry.db}`,
            on: {
              click: () => {
                dbInput.value = String(entry.db);
                convert();
              },
            },
          }),
        ),
      ),
    ),

    // --- Unités de référence ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'À quoi le décibel se compare' }),
      h('p', {},
        "Un décibel seul ne veut rien dire : il faut savoir par rapport à quoi. Un suffixe le précise, " +
        "et l’examen joue sur ces suffixes."),
    ),

    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        { class: 'data-table' },
        h('thead', {}, h('tr', {},
          h('th', { attrs: { scope: 'col' }, text: 'Unité' }),
          h('th', { attrs: { scope: 'col' }, text: 'Référence' }),
          h('th', { attrs: { scope: 'col' }, text: 'Emploi' }))),
        h('tbody', {}, ...UNITS.map((unit) =>
          h('tr', {},
            h('th', { attrs: { scope: 'row' }, class: 'mono', text: unit.code }),
            h('td', { text: unit.reference }),
            h('td', { text: unit.usage })))),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', {},
        "Passer de l’une à l’autre est une simple addition, puisque chaque saut vaut un facteur mille, " +
        "soit 30 dB :"),
      h('p', { class: 'formula', text: 'dBW = dBm + 30 = dBµ + 60' }),
      h('p', {},
        "Ainsi −43 dBW valent −13 dBm, soit +17 dBµ. Et 4 watts valent 6 dBW, parce que 4 est un " +
        "rapport de 6 dB par rapport à 1 watt."),
      h('p', { class: 'prose__note' },
        "Un exemple typique d’examen : un émetteur de 4 W dont les émissions non désirées sont atténuées " +
        "de 26 dBc. Leur puissance vaut 6 dBW − 26 dB = −20 dBW, soit un centième de watt. Traduit en " +
        "milliwatts : −20 dBW font +10 dBm, donc 10 mW."),

      h('h2', { text: 'Puissance crête et rendement' }),
      h('p', {},
        "En modulation d’amplitude comme en bande latérale unique, la puissance varie au cours du temps. " +
        "On la mesure alors sur les pointes : c’est la ",
        h('strong', { text: 'puissance de pointe de l’enveloppe' }),
        ", ou PEP. C’est elle que la réglementation plafonne."),
      h('p', {},
        "Le ",
        h('strong', { text: 'rendement' }),
        " mesure la qualité du transfert : la part de la puissance consommée qui ressort effectivement. " +
        "Il s’exprime en pourcentage et reste toujours inférieur à 100 % — le reste part en chaleur."),
      h('p', { class: 'formula', text: 'rendement (%) = puissance utile × 100 / puissance consommée' }),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Calculer un rendement' }),
      h('div', { class: 'toolbar' },
        usefulInput,
        h('span', { class: 'converter__label', text: 'W utiles sur' }),
        consumedInput,
        h('span', { class: 'converter__label', text: 'W consommés' })),
      h('p', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Rendement' }),
        yieldOut),
      lostOut,
    ),

    h(
      'section',
      { class: 'card card--accent' },
      h('h2', { class: 'card__title', text: 'Ce qui rapporte des points' }),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {}, "Les neuf rapports, sus par cœur et dans les deux sens."),
        h('li', {}, "Les décibels s’additionnent ; les rapports se multiplient."),
        h('li', {}, "Un rapport de tension vaut le double en décibels d’un rapport de puissance."),
        h('li', {}, "dBW = dBm + 30 = dBµ + 60, et le dipôle vaut 2,14 dB de plus en dBi qu’en dBd."),
        h('li', {}, "Le rendement ne dépasse jamais 100 %, et la différence part en chaleur."),
      ),
      h('p', { class: 'field__hint' },
        "Notez ces cinq lignes sur le brouillon pendant les cinq minutes précédant l’épreuve. Elles " +
        "servent aussi bien en réglementation qu’en technique."),
    ),
  );

  return { element };
}
