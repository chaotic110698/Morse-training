/**
 * Page « Filtres et circuits accordés ».
 *
 * L'aboutissement de la première section technique : associer une résistance,
 * une bobine et un condensateur pour choisir une fréquence plutôt qu'une
 * autre. C'est ce qui rend la radio possible — et c'est aussi, en CW, ce qui
 * permet d'écouter une seule station dans une bande encombrée.
 */

import { h, setChildren } from '../ui/dom.ts';
import {
  bandwidth,
  qualityFactor,
  rcCutoff,
  resonantReactance,
  selectivity,
  tankImpedance,
  thomsonCapacitance,
  thomsonFrequency,
  thomsonInductance,
} from '../core/radio-math.ts';
import { formatHertz as hertz, formatOhms as ohms, num } from '../ui/units.ts';
import type { View, ViewContext } from '../ui/router.ts';

interface Filter {
  name: string;
  layout: string;
  effect: string;
}

const LC_FILTERS: Filter[] = [
  { name: 'Passe-bas', layout: 'Bobine en série, condensateur vers la masse', effect: "Laisse passer les fréquences basses, atténue les hautes. Le condensateur est en bas." },
  { name: 'Passe-haut', layout: 'Condensateur en série, bobine vers la masse', effect: "Laisse passer les fréquences hautes, atténue les basses. Le condensateur est en haut." },
  { name: 'Circuit série', layout: 'L et C en série dans la ligne', effect: "Impédance minimale à la résonance : le signal accordé passe, les autres sont bloqués. C’est un passe-bande." },
  { name: 'Circuit bouchon', layout: 'L et C en parallèle dans la ligne', effect: "Impédance maximale à la résonance : le signal accordé est bloqué, les autres passent. C’est un coupe-bande." },
];

export function licenceCircuitsView(_context: ViewContext): View {
  // --- Fréquence de coupure RC ---

  const rcOut = h('div', { class: 'converter__result' });
  const rcR = h('input', {
    class: 'input', type: 'number', value: '200',
    attrs: { step: 'any', min: '0', 'aria-label': 'Résistance en ohms' },
    on: { input: () => computeRc() },
  });
  const rcC = h('input', {
    class: 'input', type: 'number', value: '5',
    attrs: { step: 'any', min: '0', 'aria-label': 'Capacité en microfarads' },
    on: { input: () => computeRc() },
  });

  const computeRc = (): void => {
    const r = Number(rcR.value);
    const c = Number(rcC.value);
    if (![r, c].every(Number.isFinite) || r <= 0 || c <= 0) {
      setChildren(rcOut, [h('span', { class: 'prose__note', text: 'Entrez une résistance et une capacité.' })]);
      return;
    }
    const f = rcCutoff(r, c * 1e-6);
    setChildren(rcOut, [
      h('div', { class: 'converter__line converter__line--result' },
        h('span', { class: 'converter__label', text: 'Fréquence de coupure' }),
        h('strong', { text: hertz(f) })),
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'À une octave au-delà — atténuation 6 dB' }),
        h('strong', { text: hertz(f * 2) })),
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'À deux octaves — atténuation 12 dB' }),
        h('strong', { text: hertz(f * 4) })),
    ]);
  };

  computeRc();

  // --- Thomson ---

  const lcOut = h('div', { class: 'converter__result' });
  const lcUnknown = h(
    'select',
    { class: 'select', attrs: { 'aria-label': 'Grandeur à calculer' }, on: { change: () => computeLc() } },
    h('option', { value: 'f', text: 'la fréquence' }),
    h('option', { value: 'L', text: 'l’inductance' }),
    h('option', { value: 'C', text: 'la capacité' }),
  );
  const lcL = h('input', {
    class: 'input', type: 'number', value: '32',
    attrs: { step: 'any', min: '0', 'aria-label': 'Inductance en microhenrys' },
    on: { input: () => computeLc() },
  });
  const lcC = h('input', {
    class: 'input', type: 'number', value: '200',
    attrs: { step: 'any', min: '0', 'aria-label': 'Capacité en picofarads' },
    on: { input: () => computeLc() },
  });
  const lcF = h('input', {
    class: 'input', type: 'number', value: '2',
    attrs: { step: 'any', min: '0', 'aria-label': 'Fréquence en mégahertz' },
    on: { input: () => computeLc() },
  });
  const lcR = h('input', {
    class: 'input', type: 'number', value: '20',
    attrs: { step: 'any', min: '0', 'aria-label': 'Résistance série en ohms' },
    on: { input: () => computeLc() },
  });

  const computeLc = (): void => {
    const target = lcUnknown.value;
    const l = Number(lcL.value) * 1e-6;
    const c = Number(lcC.value) * 1e-12;
    const fGiven = Number(lcF.value) * 1e6;
    const r = Number(lcR.value);

    lcL.disabled = target === 'L';
    lcC.disabled = target === 'C';
    lcF.disabled = target === 'f';

    let f = fGiven;
    let inductance = l;
    let capacitance = c;
    if (target === 'f') {
      f = thomsonFrequency(l, c);
      lcF.value = f > 0 ? String(Number((f / 1e6).toPrecision(5))) : '';
    } else if (target === 'L') {
      inductance = thomsonInductance(fGiven, c);
      lcL.value = inductance > 0 ? String(Number((inductance * 1e6).toPrecision(5))) : '';
    } else {
      capacitance = thomsonCapacitance(fGiven, l);
      lcC.value = capacitance > 0 ? String(Number((capacitance * 1e12).toPrecision(5))) : '';
    }

    if (!(f > 0 && inductance > 0 && capacitance > 0)) {
      setChildren(lcOut, [h('span', { class: 'prose__note', text: 'Complétez les deux valeurs connues.' })]);
      return;
    }

    const x = resonantReactance(inductance, capacitance);
    const q = qualityFactor(inductance, capacitance, r);
    setChildren(lcOut, [
      h('div', { class: 'converter__line converter__line--result' },
        h('span', { class: 'converter__label', text: 'Fréquence de résonance' }),
        h('strong', { text: hertz(f) })),
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Réactance à la résonance — XL = XC' }),
        h('strong', { text: ohms(x) })),
      r > 0
        ? h('div', { class: 'converter__line' },
            h('span', { class: 'converter__label', text: 'Facteur de qualité Q' }),
            h('strong', { text: num(q) }))
        : null,
      r > 0
        ? h('div', { class: 'converter__line' },
            h('span', { class: 'converter__label', text: 'Bande passante à −3 dB' }),
            h('strong', { text: hertz(bandwidth(f, q)) }))
        : null,
      r > 0
        ? h('div', { class: 'converter__line' },
            h('span', { class: 'converter__label', text: 'Impédance du circuit bouchon' }),
            h('strong', { text: ohms(tankImpedance(inductance, capacitance, r)) }))
        : null,
    ]);
  };

  computeLc();

  const element = h(
    'div',
    { class: 'stack' },

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__lead' },
        "Associer une résistance, une bobine et un condensateur permet de choisir une fréquence plutôt " +
        "qu’une autre. C’est ce qui rend la radio possible : sans filtre, un récepteur entendrait tout " +
        "le spectre en même temps. En télégraphie, c’est aussi ce qui permet d’isoler une station au " +
        "milieu d’une bande encombrée."),

      h('h2', { text: 'Filtres RC : la coupure' }),
      h('p', {},
        "Une résistance et un condensateur suffisent à faire un filtre. À la ",
        h('strong', { text: 'fréquence de coupure' }),
        ", l’impédance du condensateur devient égale à la résistance :"),
      h('p', { class: 'formula', text: 'f = 1 / (2π × R × C)' }),
      h('p', {},
        "Selon la place des composants, le filtre laisse passer les fréquences supérieures ou " +
        "inférieures. Un moyen mnémotechnique tient toute la distinction : ",
        h('strong', { text: 'dans un filtre passe-bas, le condensateur est en bas' }),
        " ; dans un passe-haut, il est en haut. Encore faut-il que la masse soit dessinée en bas du " +
        "schéma, ce qui est l’usage."),
      h('p', {},
        "Les circuits RL font l’inverse, la bobine se comportant à l’opposé du condensateur. Leur " +
        "fréquence de coupure vaut ",
        h('span', { class: 'mono', text: 'f = R / (2πL)' }),
        "."),

      h('h3', { text: 'Ce qu’un filtre atténue' }),
      h('p', {},
        "Deux chiffres suffisent, et ils reviennent constamment."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: '3 dB à la fréquence de coupure. ' }),
          "La puissance y est divisée par deux. C’est la définition même de la coupure."),
        h('li', {},
          h('strong', { text: '6 dB par octave au-delà. ' }),
          "Une octave est un doublement de fréquence. Deux octaves valent donc 12 dB, trois octaves " +
          "18 dB."),
      ),
      h('p', { class: 'prose__note' },
        "Vocabulaire à ne pas confondre : l’",
        h('strong', { text: 'octave supérieure' }),
        " est le double de la fréquence, la deuxième octave son quadruple, la troisième son octuple — " +
        "des puissances de deux, pas les harmoniques 2, 3 et 4. La ",
        h('strong', { text: 'décade' }),
        " supérieure, elle, est la fréquence multipliée par dix."),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Fréquence de coupure d’un filtre RC' }),
      h('div', { class: 'toolbar' },
        rcR,
        h('span', { class: 'converter__label', text: 'Ω ×' }),
        rcC,
        h('span', { class: 'converter__label', text: 'µF' })),
      rcOut,
    ),

    // --- Thomson ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Circuits LC : la résonance' }),
      h('p', {},
        "Remplacer la résistance par une bobine change tout. Un circuit LC ne se contente pas de " +
        "couper : il ",
        h('strong', { text: 'résonne' }),
        ". À une fréquence précise, la réactance de la bobine égale exactement celle du condensateur, et " +
        "les deux s’annulent."),
      h('p', { class: 'formula', text: 'f = 1 / (2π √(L × C))     —     loi de Thomson' }),
      h('p', {},
        "L’énergie fait alors des allers-retours entre les deux composants : le condensateur se vide " +
        "dans la bobine, qui crée un champ magnétique, puis restitue ce champ en rechargeant le " +
        "condensateur en sens inverse. Sans résistance, l’oscillation serait éternelle."),
      h('p', {},
        "La formule s’inverse pour dimensionner un composant à partir de l’autre :"),
      h('p', { class: 'formula', text: 'L = 1 / (4π² f² C)          C = 1 / (4π² f² L)' }),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Circuit accordé' }),
      h('p', { class: 'card__hint' },
        "Choisissez la grandeur à calculer ; les deux autres restent modifiables. L’exemple chargé — " +
        "32 µH et 200 pF — donne les 2 MHz du cours."),
      h('div', { class: 'toolbar' },
        h('span', { class: 'converter__label', text: 'Calculer' }),
        lcUnknown),
      h(
        'div',
        { class: 'ohm-fields' },
        h('label', { class: 'ohm-field' }, h('span', { text: 'L (µH)' }), lcL),
        h('label', { class: 'ohm-field' }, h('span', { text: 'C (pF)' }), lcC),
        h('label', { class: 'ohm-field' }, h('span', { text: 'f (MHz)' }), lcF),
        h('label', { class: 'ohm-field' }, h('span', { text: 'R (Ω)' }), lcR),
      ),
      lcOut,
    ),

    // --- Les quatre montages ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Les quatre montages' }),
      h('p', {},
        "Selon la place de la bobine et du condensateur, le même couple de composants donne quatre " +
        "filtres différents."),
    ),

    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        { class: 'data-table' },
        h('thead', {}, h('tr', {},
          h('th', { attrs: { scope: 'col' }, text: 'Montage' }),
          h('th', { attrs: { scope: 'col' }, text: 'Disposition' }),
          h('th', { attrs: { scope: 'col' }, text: 'Effet' }))),
        h('tbody', {}, ...LC_FILTERS.map((filter) =>
          h('tr', {},
            h('th', { attrs: { scope: 'row' }, text: filter.name }),
            h('td', { text: filter.layout }),
            h('td', { text: filter.effect })))),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__note' },
        "Le ",
        h('strong', { text: 'circuit bouchon' }),
        " porte bien son nom : à la résonance, son impédance est maximale et il bouche le passage. Le " +
        "circuit série fait l’inverse — impédance minimale, le signal accordé y file. C’est " +
        "contre-intuitif la première fois, et c’est une question d’examen classique."),

      h('h2', { text: 'Le facteur de qualité' }),
      h('p', {},
        "Aucun circuit n’est parfait : la résistance du fil de la bobine dissipe une partie de " +
        "l’énergie, et l’oscillation s’amortit. Le ",
        h('strong', { text: 'facteur Q' }),
        " mesure cette qualité."),
      h('p', { class: 'formula', text: 'Q = √(L / C) / R' }),
      h('p', {},
        "Plus Q est élevé, plus le circuit est sélectif et moins il s’amortit. Q décide directement de " +
        "la ",
        h('strong', { text: 'bande passante' }),
        " du circuit, mesurée à −3 dB de part et d’autre de la résonance :"),
      h('p', { class: 'formula', text: 'B = f₀ / Q' }),
      h('p', {},
        "C’est cette relation qui fait toute la différence en télégraphie. Un filtre à Q élevé ne laisse " +
        "passer que quelques centaines de hertz autour du signal, et le reste de la bande disparaît. " +
        "C’est exactement ce que permet la CW, et pas la voix."),
      h('p', {},
        "Q porte un autre nom dans un circuit bouchon : ",
        h('strong', { text: 'coefficient de surtension' }),
        ". La tension aux bornes du circuit à la résonance peut en effet dépasser largement celle " +
        "appliquée à l’entrée. Dans un circuit série, Q est le rapport entre la tension aux bornes du " +
        "condensateur et celle aux bornes de l’ensemble."),
    ),

    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        { class: 'data-table' },
        h('thead', {}, h('tr', {},
          h('th', { attrs: { scope: 'col' }, text: 'Circuit' }),
          h('th', { attrs: { scope: 'col' }, text: 'Impédance à la résonance' }),
          h('th', { attrs: { scope: 'col' }, text: 'Facteur Q' }))),
        h('tbody', {},
          h('tr', {},
            h('th', { attrs: { scope: 'row' }, text: 'Série' }),
            h('td', { class: 'mono', text: 'Z = R' }),
            h('td', { class: 'mono', text: 'Q = X / R' })),
          h('tr', {},
            h('th', { attrs: { scope: 'row' }, text: 'Bouchon' }),
            h('td', { class: 'mono', text: 'Z = L / (R × C)' }),
            h('td', { class: 'mono', text: 'Q = Z / X' })),
          h('tr', {},
            h('th', { attrs: { scope: 'row' }, text: 'Parallèle' }),
            h('td', { class: 'mono', text: 'Z = R' }),
            h('td', { class: 'mono', text: 'Q = R / X' }))),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'field__hint' },
        "Avec X = √(L / C), la réactance commune à la résonance. Les trois formules de Q se ramènent " +
        "d’ailleurs toutes à √(L/C)/R pour les circuits série et bouchon."),

      h('h3', { text: 'Sélectivité et facteur de forme' }),
      h('p', {},
        "Quand plusieurs cellules sont associées, la courbe de réponse ne se décrit plus par Q seul. On " +
        "compare alors la largeur à −3 dB et celle à −60 dB, dite réjection ultime."),
      h('p', { class: 'formula', text: 'S(%) = B × 100 / δf(−60 dB)          F = 100 / S' }),
      h('p', {},
        "Plus la sélectivité approche 100 %, plus les flancs du filtre sont raides et plus le facteur de " +
        "forme F approche 1 — sans jamais l’atteindre."),
      h('p', { class: 'field__hint' },
        `Une bande passante de 5 kHz pour une réjection ultime de 25 kHz donne une sélectivité de ` +
        `${num(selectivity(5, 25))} % et un facteur de forme de ${num(100 / selectivity(5, 25))}. Un ` +
        "circuit RLC à une seule cellule, dont la courbe suit une gaussienne, atteint péniblement un " +
        "facteur de forme de 1000."),

      h('h2', { text: 'Deux filtres nommés d’après leur forme' }),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'Le filtre en pi ' }),
          "— deux condensateurs variables encadrant une bobine, comme la lettre П. C’est un passe-bas " +
          "anti-harmonique du second ordre, donc 12 dB par octave, dont les impédances d’entrée et de " +
          "sortie diffèrent. On le trouve dans les boîtes de couplage, où il adapte l’ensemble " +
          "câble-antenne à la sortie de l’émetteur."),
        h('li', {},
          h('strong', { text: 'Le filtre en T ' }),
          "— une bobine encadrée par deux condensateurs. C’est un passe-haut du second ordre."),
      ),
      h('p', { class: 'prose__note' },
        "Un dernier instrument mérite d’être connu : l’",
        h('strong', { text: 'ondemètre à absorption' }),
        ", un simple circuit LC couplé au signal à mesurer. Quand on fait varier son condensateur, la " +
        "tension marque un pic net — le « dip » — qui indique l’accord. Le ",
        h('strong', { text: 'grid-dip' }),
        " fait la même chose avec son propre oscillateur, sans avoir besoin que le circuit mesuré " +
        "produise de la puissance."),
    ),

    h(
      'section',
      { class: 'card card--accent' },
      h('h2', { class: 'card__title', text: 'La première section technique est terminée' }),
      h('p', {},
        "Vous avez couvert l’algèbre, les lois d’Ohm et de Joule, le courant alternatif, les " +
        "transformateurs et les circuits accordés. C’est la moitié la plus mathématique du programme, et " +
        "celle sur laquelle tout le reste s’appuie."),
      h(
        'div',
        { class: 'actions' },
        h('a', { class: 'btn', href: '#/licence/ohm', text: 'Revoir les lois d’Ohm' }),
        h('a', { class: 'btn', href: '#/licence/decibels', text: 'Revoir les décibels' }),
      ),
    ),
  );

  return { element };
}
