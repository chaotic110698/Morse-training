/**
 * Page « Lois d'Ohm et de Joule ».
 *
 * Le socle de toute l'épreuve de technique. Deux lois, quatre grandeurs, douze
 * équations — mais on n'apprend pas douze équations : on apprend à en déduire
 * deux à partir de deux autres, ce que le solveur rend tangible. Le décodeur
 * de couleurs suit la même intention : le code s'apprend en le manipulant, pas
 * en le récitant.
 */

import { h, setChildren } from '../ui/dom.ts';
import {
  parallelResistance,
  resistivityToResistance,
  seriesResistance,
  skinDepthMicrons,
  solveOhm,
} from '../core/radio-math.ts';
import { COLOUR_BANDS, RESISTIVITIES, resistorValue } from '../data/components.ts';
import type { ColourBand } from '../data/components.ts';
import { formatOhms as ohms, num } from '../ui/units.ts';
import type { View, ViewContext } from '../ui/router.ts';

export function licenceOhmView(_context: ViewContext): View {
  // --- Solveur des quatre grandeurs ---

  const solverOut = h('div', { class: 'converter__result' });

  const field = (label: string, unit: string, initial: string): HTMLInputElement => {
    const input = h('input', {
      class: 'input',
      type: 'number',
      value: initial,
      attrs: { step: 'any', 'aria-label': `${label} en ${unit}`, placeholder: '—' },
      on: { input: () => solve() },
    });
    return input;
  };

  const uField = field('Tension', 'volts', '');
  const iField = field('Intensité', 'ampères', '0.1');
  const rField = field('Résistance', 'ohms', '1500');
  const pField = field('Puissance', 'watts', '');

  const read = (input: HTMLInputElement): number | undefined =>
    input.value.trim() === '' ? undefined : Number(input.value);

  const solve = (): void => {
    const given = { u: read(uField), i: read(iField), r: read(rField), p: read(pField) };
    const count = Object.values(given).filter((v) => v !== undefined && Number.isFinite(v)).length;
    if (count < 2) {
      setChildren(solverOut, [h('span', { class: 'prose__note', text: 'Renseignez deux grandeurs, les deux autres se déduisent.' })]);
      return;
    }
    if (count > 2) {
      setChildren(solverOut, [h('span', { class: 'prose__note is-warn', text: 'Deux grandeurs suffisent — videz les champs en trop.' })]);
      return;
    }
    const result = solveOhm(given);
    if (!result) {
      setChildren(solverOut, [h('span', { class: 'prose__note is-warn', text: 'Ces deux valeurs ne permettent pas de conclure.' })]);
      return;
    }
    const rows: Array<[string, number | undefined, string]> = [
      ['Tension U', result.u, 'V'],
      ['Intensité I', result.i, 'A'],
      ['Résistance R', result.r, 'Ω'],
      ['Puissance P', result.p, 'W'],
    ];
    setChildren(solverOut, rows.map(([label, value, unit]) => {
      const wasGiven = given[label.slice(-1).toLowerCase() as keyof typeof given] !== undefined;
      return h(
        'div',
        { class: `converter__line${wasGiven ? '' : ' converter__line--result'}` },
        h('span', { class: 'converter__label', text: wasGiven ? `${label} (donnée)` : label }),
        h('strong', { text: value === undefined || !Number.isFinite(value) ? 'indéterminée' : `${num(value)} ${unit}` }),
      );
    }));
  };

  solve();

  // --- Décodeur de code des couleurs ---

  const withDigits = COLOUR_BANDS.filter((band) => band.digit !== null);
  const withMultiplier = COLOUR_BANDS.filter((band) => band.multiplier !== null);

  const colourValue = h('div', { class: 'resistor__value' });
  const resistorBands = h('div', { class: 'resistor__bands' });

  const bandSelect = (options: ColourBand[], initial: string, label: string): HTMLSelectElement =>
    h(
      'select',
      { class: 'select', attrs: { 'aria-label': label }, on: { change: () => decodeColours() } },
      ...options.map((band) => h('option', { value: band.name, text: band.name, attrs: initial === band.name ? { selected: true } : {} })),
    );

  const band1 = bandSelect(withDigits, 'Marron', 'Première bague');
  const band2 = bandSelect(withDigits, 'Noir', 'Deuxième bague');
  const band3 = bandSelect(withMultiplier, 'Rouge', 'Troisième bague');

  const findBand = (name: string): ColourBand =>
    COLOUR_BANDS.find((band) => band.name === name) ?? COLOUR_BANDS[0]!;

  const decodeColours = (): void => {
    const a = findBand(band1.value);
    const b = findBand(band2.value);
    const c = findBand(band3.value);
    setChildren(resistorBands, [a, b, c].map((band) =>
      h('span', { class: 'resistor__band', attrs: { style: `background: ${band.css}`, title: band.name } })));
    const value = resistorValue(a, b, c);
    setChildren(colourValue, [
      h('strong', { text: value === null ? '—' : ohms(value) }),
      h('span', { class: 'resistor__detail', text: value === null ? 'Combinaison impossible' : `${a.digit}${b.digit} suivi de ${c.multiplier} zéro${(c.multiplier ?? 0) > 1 ? 's' : ''}` }),
    ]);
  };

  decodeColours();

  // --- Groupements ---

  const groupOut = h('div', { class: 'converter__result' });
  const groupMode = h(
    'select',
    { class: 'select', attrs: { 'aria-label': 'Type de groupement' }, on: { change: () => computeGroup() } },
    h('option', { value: 'series', text: 'En série' }),
    h('option', { value: 'parallel', text: 'En parallèle' }),
  );
  const groupValues = h('input', {
    class: 'input',
    type: 'text',
    value: '100, 220, 470',
    attrs: { 'aria-label': 'Valeurs des résistances en ohms', spellcheck: 'false' },
    on: { input: () => computeGroup() },
  });

  const computeGroup = (): void => {
    const values = groupValues.value
      .split(/[,;\s]+/)
      .map((part) => Number(part.replace(',', '.')))
      .filter((value) => Number.isFinite(value) && value > 0);
    if (values.length === 0) {
      setChildren(groupOut, [h('span', { class: 'prose__note', text: 'Entrez des valeurs séparées par des virgules.' })]);
      return;
    }
    const isSeries = groupMode.value === 'series';
    const total = isSeries ? seriesResistance(values) : parallelResistance(values);
    const largest = Math.max(...values);
    const smallest = Math.min(...values);
    setChildren(groupOut, [
      h('div', { class: 'converter__line converter__line--result' },
        h('span', { class: 'converter__label', text: `${values.length} résistance${values.length > 1 ? 's' : ''}` }),
        h('strong', { text: ohms(total) })),
      h('p', { class: 'field__hint' },
        isSeries
          ? `Toujours supérieure à la plus grande du groupement (${ohms(largest)}). La tension et la puissance se répartissent au prorata des résistances ; l’intensité est la même partout.`
          : `Toujours inférieure à la plus petite du groupement (${ohms(smallest)}). L’intensité et la puissance se répartissent à l’inverse des résistances ; la tension est la même partout.`),
    ]);
  };

  computeGroup();

  const element = h(
    'div',
    { class: 'stack' },

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__lead' },
        "Quatre grandeurs, deux lois. Tout le reste de l’électricité en découle, et la moitié des " +
        "questions de l’épreuve de technique s’y ramène. Si vous ne deviez retenir qu’une page de ce " +
        "cours, ce serait celle-ci."),

      h('h2', { text: 'Les quatre grandeurs' }),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'L’intensité (I), en ampères. ' }),
          "Le débit : une quantité d’électricité par seconde. Elle se mesure en un point, en insérant " +
          "l’ampèremètre dans le circuit — comme un compteur d’eau."),
        h('li', {},
          h('strong', { text: 'La tension (U), en volts. ' }),
          "La différence de potentiel entre deux points. Elle se mesure entre deux points, en branchant " +
          "le voltmètre en dérivation — comme une différence de pression."),
        h('li', {},
          h('strong', { text: 'La résistance (R), en ohms. ' }),
          "L’opposition au passage du courant — comme un rétrécissement du tuyau."),
        h('li', {},
          h('strong', { text: 'La puissance (P), en watts. ' }),
          "Ce qui est dissipé, en chaleur dans le cas d’une résistance : les frottements du passage des " +
          "électrons."),
      ),
      h('p', { class: 'prose__note' },
        "Un point de vocabulaire : la tension produite par une source s’appelle force électromotrice et " +
        "se note E ; la chute de tension aux bornes d’une charge s’appelle différence de potentiel. Le U " +
        "vient de l’allemand ",
        h('em', { text: 'Unterschied' }),
        ", la langue de Georg Ohm."),

      h('h2', { text: 'Les deux lois, et les douze équations' }),
      h('p', { class: 'formula', text: 'Loi d’Ohm : U = R × I          Loi de Joule : P = U × I' }),
      h('p', {},
        "En substituant l’une dans l’autre, on obtient douze équations — trois pour chacune des quatre " +
        "grandeurs. Il ne sert à rien de les apprendre : deux données suffisent toujours à trouver les " +
        "deux autres, et c’est cette manipulation qu’il faut savoir faire."),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Deux grandeurs, les deux autres suivent' }),
      h('p', { class: 'card__hint' },
        "Renseignez exactement deux champs et laissez les autres vides. L’exemple chargé — 1500 Ω " +
        "parcourus par 0,1 A — donne 150 V et 15 W."),
      h(
        'div',
        { class: 'ohm-fields' },
        h('label', { class: 'ohm-field' }, h('span', { text: 'U (V)' }), uField),
        h('label', { class: 'ohm-field' }, h('span', { text: 'I (A)' }), iField),
        h('label', { class: 'ohm-field' }, h('span', { text: 'R (Ω)' }), rField),
        h('label', { class: 'ohm-field' }, h('span', { text: 'P (W)' }), pField),
      ),
      solverOut,
      h(
        'div',
        { class: 'actions' },
        h('button', {
          class: 'btn btn--ghost btn--small',
          type: 'button',
          text: 'Vider',
          on: {
            click: () => {
              for (const input of [uField, iField, rField, pField]) input.value = '';
              solve();
            },
          },
        }),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('h3', { text: 'Les quatre triangles' }),
      h('p', {},
        "La méthode que recommande tout formateur : quatre triangles, où l’on cache du doigt " +
        "l’inconnue pour lire la formule. Quand les deux données restantes sont côte à côte en bas, " +
        "elles se multiplient ; quand l’une est au-dessus de l’autre, elles se divisent."),
    ),

    h(
      'div',
      { class: 'triangles' },
      ...[
        { top: 'U', left: 'R', right: 'I' },
        { top: 'P', left: 'U', right: 'I' },
        { top: 'P', left: 'R', right: 'I²' },
        { top: 'U²', left: 'P', right: 'R' },
      ].map((tri) =>
        h(
          'div',
          { class: 'triangle' },
          h('span', { class: 'triangle__top', text: tri.top }),
          h('span', { class: 'triangle__bottom' },
            h('span', { text: tri.left }),
            h('span', { class: 'triangle__times', text: '×' }),
            h('span', { text: tri.right })),
        ),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'field__hint' },
        "Le dernier triangle demande une attention particulière : l’inconnue y est au carré, donc le " +
        "résultat passe par une racine. U² = P × R donne U = √(P × R)."),

      h('h2', { text: 'Charge, énergie et travail' }),
      h('p', {},
        "Trois unités complètent le tableau, et l’examen les distingue soigneusement."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'Le coulomb (C) ' }),
          "mesure une quantité d’électricité, notée Q. Un ampère vaut un coulomb par seconde : ",
          h('span', { class: 'mono', text: 'Q = I × t' }),
          "."),
        h('li', {},
          h('strong', { text: 'Le joule (J) ' }),
          "mesure une énergie. Un watt vaut un joule par seconde : ",
          h('span', { class: 'mono', text: 'W = P × t' }),
          "."),
        h('li', {},
          h('strong', { text: 'Le wattheure (Wh) ' }),
          "mesure la même chose autrement : ",
          h('span', { class: 'mono', text: '1 Wh = 3600 J' }),
          "."),
      ),
      h('p', { class: 'prose__note' },
        "Le travail se note W mais se mesure en joules — à ne pas confondre avec le W du watt. La notion " +
        "de travail ne dit rien de la durée : déplacer dix tonnes de sable à la brouette ou à la " +
        "pelleteuse demande le même travail, seule la puissance change."),

      h('h2', { text: 'Résistivité et dimensions' }),
      h('p', {},
        "La résistance d’un conducteur dépend de sa nature — sa résistivité ρ — mais aussi de sa forme : " +
        "proportionnelle à sa longueur, inversement proportionnelle à sa section."),
      h('p', { class: 'formula', text: 'R(Ω) = ρ(Ωm) × L(m) / S(m²)' }),
      h('p', { class: 'prose__note' },
        "Piège classique : diamètre et section ne varient pas ensemble. Doubler le diamètre quadruple " +
        "la section, donc divise la résistance par quatre. La relation est ",
        h('span', { class: 'mono', text: 'S = π × D² / 4 ≈ 0,785 × D²' }),
        "."),
    ),

    h(
      'section',
      { class: 'card card--muted' },
      h('h2', { class: 'card__title', text: 'Quelques résistivités à 20 °C' }),
      h(
        'div',
        { class: 'table-wrap' },
        h(
          'table',
          { class: 'data-table' },
          h('thead', {}, h('tr', {},
            h('th', { attrs: { scope: 'col' }, text: 'Matériau' }),
            h('th', { attrs: { scope: 'col' }, text: 'ρ (Ω·m)' }),
            h('th', { attrs: { scope: 'col' }, text: 'Nature' }))),
          h('tbody', {}, ...RESISTIVITIES.map((entry) =>
            h('tr', {},
              h('th', { attrs: { scope: 'row' }, text: entry.material }),
              h('td', { class: 'num mono', text: entry.rho.toExponential(1).replace('e', ' × 10^').replace('+', '') }),
              h('td', { text: entry.kind })))),
        ),
      ),
      h('p', { class: 'field__hint' },
        "En dessous de 10⁻⁶ Ω·m, on parle de conducteur ; au-delà de 10⁶, d’isolant ; entre les deux, de " +
        "semi-conducteur. La résistivité d’un conducteur augmente avec la température — coefficient " +
        "positif — tandis que celle d’un isolant diminue."),
    ),

    h(
      'article',
      { class: 'prose' },
      h('h3', { text: 'L’effet de peau' }),
      h('p', {},
        "Au-delà de 20 kHz, le courant ne circule plus qu’à la surface des conducteurs. L’épaisseur de " +
        "cette peau, dans du cuivre, s’estime simplement :"),
      h('p', { class: 'formula', text: 'e(µm) = 66 / √f(MHz)' }),
      h('p', {},
        "À 1 MHz, la peau fait 66 µm ; à 30 MHz, 12 µm ; à 1 GHz, 2 µm. D’où l’usage, en haute " +
        "fréquence, de câbles multibrins plutôt que monobrin — la surface disponible augmente, donc la " +
        "résistance diminue — et de fils argentés ou émaillés, l’oxydation rendant souvent un métal " +
        "isolant."),
      h('p', { class: 'field__hint' },
        `À 150 MHz, la peau mesure ${skinDepthMicrons(150).toFixed(0)} µm. La densité de courant dans un ` +
        "fil de cuivre ne doit pas dépasser 5 A/mm²."),
    ),

    // --- Code des couleurs ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Le code des couleurs' }),
      h('p', {},
        "La valeur d’une résistance à fils est rarement écrite en chiffres. Trois bagues au minimum la " +
        "codent : les deux premières donnent les deux premiers chiffres, la troisième le nombre de " +
        "zéros. Une quatrième bague, souvent décalée, indique la tolérance — elle n’est pas au programme, " +
        "mais elle est dessinée dans les questions."),
      h('p', { class: 'prose__note' },
        "Le moyen mnémotechnique français, dont chaque initiale donne celle de la couleur : ",
        h('em', { text: 'Ne Mangez Rien Ou Je Vous Battrai VIOlemment, Grand Boa' }),
        " — noir, marron, rouge, orange, jaune, vert, bleu, violet, gris, blanc."),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Lire une résistance' }),
      h('div', { class: 'resistor' },
        h('div', { class: 'resistor__body' }, resistorBands),
        colourValue),
      h('div', { class: 'toolbar' }, band1, band2, band3),
      h('p', { class: 'field__hint' },
        "Les bagues ne sont pas centrées : elles se situent d’un côté du composant, ce qui indique le " +
        "sens de lecture. Le même code sert aussi aux condensateurs, où l’unité de base est le picofarad."),
    ),

    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        { class: 'data-table' },
        h('thead', {}, h('tr', {},
          h('th', { attrs: { scope: 'col' }, text: 'Couleur' }),
          h('th', { attrs: { scope: 'col' }, text: 'Chiffre' }),
          h('th', { attrs: { scope: 'col' }, text: 'Multiplicateur' }),
          h('th', { attrs: { scope: 'col' }, text: 'Tolérance' }))),
        h('tbody', {}, ...COLOUR_BANDS.map((band) =>
          h('tr', {},
            h('th', { attrs: { scope: 'row' } },
              h('span', { class: 'swatch', attrs: { style: `background: ${band.css}`, 'aria-hidden': 'true' } }),
              band.name),
            h('td', { class: 'num', text: band.digit === null ? '—' : String(band.digit) }),
            h('td', { class: 'num', text: band.multiplier === null ? '—' : `10^${band.multiplier}` }),
            h('td', { class: 'num', text: band.tolerance === null ? '—' : `± ${band.tolerance} %` })))),
      ),
    ),

    // --- Groupements ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Groupements de résistances' }),
      h('p', {},
        "Deux montages, et deux comportements opposés qu’il faut savoir retrouver sans les apprendre."),
      h('p', { class: 'formula', text: 'Série : Rt = R1 + R2 + …          Parallèle : Rt = (R1 × R2) / (R1 + R2)' }),
      h('p', {},
        "La formule du parallèle se retient par « les Pieds sur le Sol » — ",
        h('strong', { text: 'P' }),
        "roduit ",
        h('strong', { text: 's' }),
        "ur ",
        h('strong', { text: 'S' }),
        "omme — mais elle ne vaut que pour deux résistances. Au-delà, il faut l’inverse de la somme des " +
        "inverses."),
      h('p', { class: 'formula', text: 'Rt = 1 / (1/R1 + 1/R2 + 1/R3 + …)' }),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Calculer un groupement' }),
      h('div', { class: 'toolbar' }, groupMode, groupValues),
      groupOut,
    ),

    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        { class: 'data-table' },
        h('thead', {}, h('tr', {},
          h('th', { attrs: { scope: 'col' }, text: '' }),
          h('th', { attrs: { scope: 'col' }, text: 'En série' }),
          h('th', { attrs: { scope: 'col' }, text: 'En parallèle' }))),
        h('tbody', {},
          h('tr', {},
            h('th', { attrs: { scope: 'row' }, text: 'Résistance' }),
            h('td', { text: 'Somme — supérieure à la plus grande' }),
            h('td', { text: 'Produit sur somme — inférieure à la plus petite' })),
          h('tr', {},
            h('th', { attrs: { scope: 'row' }, text: 'Intensité' }),
            h('td', { text: 'Constante dans tout le circuit' }),
            h('td', { text: 'Inversement proportionnelle aux résistances' })),
          h('tr', {},
            h('th', { attrs: { scope: 'row' }, text: 'Tension' }),
            h('td', { text: 'Proportionnelle aux résistances' }),
            h('td', { text: 'Constante aux bornes de chacune' })),
          h('tr', {},
            h('th', { attrs: { scope: 'row' }, text: 'Puissance' }),
            h('td', { text: 'Proportionnelle aux résistances' }),
            h('td', { text: 'Inversement proportionnelle aux résistances' })),
          h('tr', {},
            h('th', { attrs: { scope: 'row' }, text: 'n résistances égales' }),
            h('td', { class: 'mono', text: 'Rt = R × n' }),
            h('td', { class: 'mono', text: 'Rt = R / n' }))),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__note' },
        "Une manière de vérifier son raisonnement : dans les deux répartitions au prorata — la tension " +
        "en série, l’intensité en parallèle — le numérateur est toujours inférieur au dénominateur. Si " +
        "votre fraction dépasse 1, elle est à l’envers."),
      h('p', {},
        "Ces répartitions découlent des ",
        h('strong', { text: 'lois de Kirchhoff' }),
        " : la somme algébrique des courants entrant dans un nœud est nulle, et la somme algébrique des " +
        "tensions sur une maille l’est aussi. Autrement dit, il sort d’un nœud autant de courant qu’il " +
        "n’y entre, et la tension du générateur est intégralement absorbée par les charges de la maille."),
      h('p', {},
        `Un exemple de dimensionnement : trois résistances de 100, 220 et 470 Ω donnent ` +
        `${ohms(seriesResistance([100, 220, 470]))} en série et ${ohms(parallelResistance([100, 220, 470]))} ` +
        `en parallèle. Un fil de cuivre d’un mètre et de 2 mm² de section, dont la résistivité vaut ` +
        `1,8 × 10⁻⁸ Ω·m, présente ${ohms(resistivityToResistance(1.8e-8, 1, 2e-6))} — autant dire rien, ` +
        `et c’est bien l’intérêt du cuivre.`),
    ),
  );

  return { element };
}
