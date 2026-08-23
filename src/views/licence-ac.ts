/**
 * Page « Courant alternatif, bobines et condensateurs ».
 *
 * Le passage du continu à l'alternatif est le vrai saut du programme : les
 * lois d'Ohm et de Joule continuent de s'appliquer, mais seulement aux valeurs
 * efficaces, et deux composants nouveaux opposent une résistance qui dépend de
 * la fréquence. Les calculateurs séparent ces deux idées plutôt que de les
 * mélanger dans un formulaire unique.
 */

import { h, setChildren } from '../ui/dom.ts';
import {
  angularFrequency,
  capacitiveReactance,
  impedance,
  inductiveReactance,
  parallelCapacitance,
  peakFromRms,
  period,
  phaseAngle,
  rmsFromPeak,
  seriesCapacitance,
  timeConstant,
} from '../core/radio-math.ts';
import { formatOhms as ohms, formatSeconds as seconds, num } from '../ui/units.ts';
import type { View, ViewContext } from '../ui/router.ts';

export function licenceAcView(_context: ViewContext): View {
  // --- Valeurs d'un signal sinusoïdal ---

  const valuesOut = h('div', { class: 'converter__result' });
  const valueInput = h('input', {
    class: 'input', type: 'number', value: '10',
    attrs: { step: 'any', min: '0', 'aria-label': 'Valeur du signal' },
    on: { input: () => computeValues() },
  });
  const valueKind = h(
    'select',
    { class: 'select', attrs: { 'aria-label': 'Nature de la valeur' }, on: { change: () => computeValues() } },
    h('option', { value: 'rms', text: 'volts efficaces' }),
    h('option', { value: 'peak', text: 'volts crête' }),
    h('option', { value: 'pp', text: 'volts crête à crête' }),
  );

  const computeValues = (): void => {
    const raw = Number(valueInput.value);
    if (!Number.isFinite(raw) || raw <= 0) {
      setChildren(valuesOut, [h('span', { class: 'prose__note', text: 'Entrez une valeur positive.' })]);
      return;
    }
    const peak = valueKind.value === 'rms' ? peakFromRms(raw) : valueKind.value === 'pp' ? raw / 2 : raw;
    const rows: Array<[string, number, boolean]> = [
      ['Valeur efficace', rmsFromPeak(peak), valueKind.value === 'rms'],
      ['Valeur crête (maximale)', peak, valueKind.value === 'peak'],
      ['Valeur crête à crête', peak * 2, valueKind.value === 'pp'],
    ];
    setChildren(valuesOut, [
      ...rows.map(([label, value, given]) =>
        h('div', { class: `converter__line${given ? '' : ' converter__line--result'}` },
          h('span', { class: 'converter__label', text: given ? `${label} (donnée)` : label }),
          h('strong', { text: `${num(value)} V` }))),
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Valeur moyenne' }),
        h('strong', { text: '0 V' })),
      h('p', { class: 'field__hint' },
        "Sur un nombre entier de périodes, la valeur moyenne d’un signal sinusoïdal est nulle : les " +
        "alternances positives et négatives se compensent exactement."),
    ]);
  };

  computeValues();

  // --- Réactance ---

  const reactOut = h('div', { class: 'converter__result' });
  const reactFreq = h('input', {
    class: 'input', type: 'number', value: '8',
    attrs: { step: 'any', min: '0', 'aria-label': 'Fréquence en mégahertz' },
    on: { input: () => computeReactance() },
  });
  const reactValue = h('input', {
    class: 'input', type: 'number', value: '12.5',
    attrs: { step: 'any', min: '0', 'aria-label': 'Valeur du composant' },
    on: { input: () => computeReactance() },
  });
  const reactKind = h(
    'select',
    { class: 'select', attrs: { 'aria-label': 'Composant' }, on: { change: () => computeReactance() } },
    h('option', { value: 'L', text: 'µH — bobine' }),
    h('option', { value: 'C', text: 'pF — condensateur' }),
  );
  const reactSeries = h('input', {
    class: 'input', type: 'number', value: '0',
    attrs: { step: 'any', min: '0', 'aria-label': 'Résistance série en ohms' },
    on: { input: () => computeReactance() },
  });

  const computeReactance = (): void => {
    const mhz = Number(reactFreq.value);
    const raw = Number(reactValue.value);
    const resistance = Number(reactSeries.value);
    if (!Number.isFinite(mhz) || !Number.isFinite(raw) || mhz <= 0 || raw <= 0) {
      setChildren(reactOut, [h('span', { class: 'prose__note', text: 'Entrez une fréquence et une valeur.' })]);
      return;
    }
    const hz = mhz * 1e6;
    const isCoil = reactKind.value === 'L';
    const x = isCoil ? inductiveReactance(hz, raw * 1e-6) : capacitiveReactance(hz, raw * 1e-12);
    const signed = isCoil ? x : -x;
    const z = Number.isFinite(resistance) && resistance > 0 ? impedance(resistance, x) : x;
    setChildren(reactOut, [
      h('div', { class: 'converter__line converter__line--result' },
        h('span', { class: 'converter__label', text: isCoil ? 'Réactance XL' : 'Capacitance XC' }),
        h('strong', { text: ohms(x) })),
      Number.isFinite(resistance) && resistance > 0
        ? h('div', { class: 'converter__line' },
            h('span', { class: 'converter__label', text: 'Impédance Z = √(R² + X²)' }),
            h('strong', { text: ohms(z) }))
        : null,
      Number.isFinite(resistance) && resistance > 0
        ? h('div', { class: 'converter__line' },
            h('span', { class: 'converter__label', text: 'Déphasage' }),
            h('strong', { text: `${num(phaseAngle(signed, resistance), 3)} °` }))
        : null,
      h('p', { class: 'field__hint' },
        isCoil
          ? "Dans une bobine, l’impédance croît avec la fréquence et avec l’inductance. En courant continu, elle est nulle : la bobine est un simple fil. La tension y est en avance de 90° sur l’intensité."
          : "Dans un condensateur, l’impédance décroît quand la fréquence ou la capacité augmentent. En courant continu, elle est infinie : rien ne passe. La tension y est en retard de 90° sur l’intensité."),
    ]);
  };

  computeReactance();

  // --- Constante de temps ---

  const tauOut = h('div', { class: 'converter__result' });
  const resistorInput = h('input', {
    class: 'input', type: 'number', value: '200',
    attrs: { step: 'any', min: '0', 'aria-label': 'Résistance en kilohms' },
    on: { input: () => computeTau() },
  });
  const capacitorInput = h('input', {
    class: 'input', type: 'number', value: '5',
    attrs: { step: 'any', min: '0', 'aria-label': 'Capacité en microfarads' },
    on: { input: () => computeTau() },
  });

  const computeTau = (): void => {
    const kohms = Number(resistorInput.value);
    const uf = Number(capacitorInput.value);
    if (!Number.isFinite(kohms) || !Number.isFinite(uf) || kohms <= 0 || uf <= 0) {
      setChildren(tauOut, [h('span', { class: 'prose__note', text: 'Entrez une résistance et une capacité.' })]);
      return;
    }
    const tau = timeConstant(kohms * 1e3, uf * 1e-6);
    setChildren(tauOut, [
      h('div', { class: 'converter__line converter__line--result' },
        h('span', { class: 'converter__label', text: 'Constante de temps T = R × C' }),
        h('strong', { text: seconds(tau) })),
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Charge à 63 %' }),
        h('strong', { text: seconds(tau) })),
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Charge quasi complète — 5 T' }),
        h('strong', { text: seconds(tau * 5) })),
    ]);
  };

  computeTau();

  const element = h(
    'div',
    { class: 'stack' },

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__lead' },
        "En radio, les courants ne sont pas continus : ils changent de valeur en permanence et " +
        "recommencent périodiquement. Les lois d’Ohm et de Joule continuent de s’appliquer, mais à une " +
        "condition — et deux composants entrent en scène, dont la résistance dépend de la fréquence."),

      h('h2', { text: 'Le signal sinusoïdal' }),
      h('p', {},
        "Un courant est dit alternatif quand il change continuellement de valeur et que sa forme se " +
        "répète. Il peut être carré, triangulaire, en dents de scie — mais la sinusoïde est la forme la " +
        "plus régulière, et celle de la radio."),
      h('p', {},
        "Le temps d’un cycle complet s’appelle la ",
        h('strong', { text: 'période' }),
        ", composée de deux ",
        h('strong', { text: 'alternances' }),
        " — une positive, une négative. Le nombre de périodes par seconde est la fréquence, en hertz. " +
        "Période et fréquence sont inverses l’une de l’autre :"),
      h('p', { class: 'formula', text: 't(s) = 1 / f(Hz)     t(ms) = 1 / f(kHz)     t(µs) = 1 / f(MHz)' }),
      h('p', {},
        "La ",
        h('strong', { text: 'pulsation' }),
        " ω, ou vitesse angulaire, exprime la même chose en radians par seconde plutôt qu’en périodes " +
        "par seconde. Une période valant 2π radians :"),
      h('p', { class: 'formula', text: 'ω = 2π × f' }),
      h('p', { class: 'prose__note' },
        `Ainsi un signal de 10 MHz a une pulsation de ${num(angularFrequency(10e6) / 1e6, 4)} millions de ` +
        `radians par seconde, et une période de ${seconds(period(10e6))}. Fourier a démontré que tout ` +
        "signal périodique, quelle que soit sa forme, est une somme de sinusoïdes dont les fréquences " +
        "sont des multiples de la sienne : tout se ramène donc au cas sinusoïdal."),

      h('h2', { text: 'Quatre façons de mesurer un signal' }),
      h('p', {},
        "Ces notions ne s’appliquent qu’aux tensions et aux intensités — pas à la puissance, qui est un " +
        "produit, ni à la résistance, qui est constante par nature."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'La valeur maximale, ' }),
          "ou valeur crête : la plus grande valeur atteinte au cours d’une période."),
        h('li', {},
          h('strong', { text: 'La valeur efficace : ' }),
          "celle pour laquelle les lois d’Ohm et de Joule s’appliquent. C’est la seule utilisable dans " +
          "un calcul."),
        h('li', {},
          h('strong', { text: 'La valeur moyenne : ' }),
          "nulle sur un nombre entier de périodes. C’est pourtant elle que lit un galvanomètre."),
        h('li', {},
          h('strong', { text: 'La valeur crête à crête : ' }),
          "l’écart entre l’extrême positif et l’extrême négatif, soit le double de la valeur crête."),
      ),
      h('p', { class: 'formula', text: 'Umax = √2 × Ueff = 1,414 × Ueff          Ueff = Umax / √2 = 0,707 × Umax' }),
      h('p', { class: 'prose__note' },
        "Ces deux facteurs ne valent que pour un signal sinusoïdal, et méritent d’être notés sur le " +
        "brouillon : 1,414 pour monter, 0,707 pour descendre. La règle absolue du chapitre est de " +
        "convertir en valeurs efficaces ",
        h('em', { text: 'avant' }),
        " tout autre calcul."),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Convertir les valeurs d’un signal' }),
      h('div', { class: 'toolbar' }, valueInput, valueKind),
      valuesOut,
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', {},
        "Sur un oscilloscope, on lit la valeur crête à crête en comptant les divisions verticales, et la " +
        "période en comptant les divisions horizontales. Un signal occupant deux divisions à 5 V/div " +
        "fait 10 V crête à crête, donc 5 V crête, donc 3,53 V efficaces. S’il occupe deux divisions à " +
        "2 ms/div, sa période vaut 4 ms, donc sa fréquence 250 Hz."),
      h('p', { class: 'field__hint' },
        "Quand une composante continue se superpose à un signal sinusoïdal, la valeur efficace totale " +
        "vaut √(Ucont² + Ueff²). Les autres combinaisons dépassent le programme."),

      h('h2', { text: 'Deux composants, deux comportements opposés' }),
      h('p', {},
        "La ",
        h('strong', { text: 'bobine' }),
        " s’oppose à toute variation d’intensité. Le ",
        h('strong', { text: 'condensateur' }),
        " ne laisse passer que la composante alternative. Ni l’un ni l’autre ne consomme d’énergie : " +
        "ils l’emmagasinent et la restituent à l’identique."),
      h('p', {},
        "Leur opposition au courant se mesure en ohms, mais ce n’est pas une résistance puisqu’elle " +
        "dépend de la fréquence. On parle d’",
        h('strong', { text: 'impédance' }),
        " — plus précisément de ",
        h('strong', { text: 'réactance' }),
        " pour la bobine et de ",
        h('strong', { text: 'capacitance' }),
        " pour le condensateur."),
      h('p', { class: 'formula', text: 'ZL = ωL = 2πfL          ZC = 1 / ωC = 1 / 2πfC' }),
    ),

    h(
      'div',
      { class: 'compare' },
      h(
        'section',
        { class: 'compare__side' },
        h('h3', { class: 'compare__title', text: 'La bobine' }),
        h('ul', { class: 'compare__list' },
          h('li', {}, 'Unité : le ', h('strong', { text: 'henry' }), ' (H)'),
          h('li', {}, 'Impédance ', h('strong', { text: 'croissante' }), ' avec la fréquence'),
          h('li', {}, 'En continu : impédance ', h('strong', { text: 'nulle' }), ' — un simple fil'),
          h('li', {}, 'Tension ', h('strong', { text: 'en avance' }), ' de 90° sur l’intensité'),
          h('li', {}, 'En série : les inductances ', h('strong', { text: 's’additionnent' })),
          h('li', {}, 'Emmagasine l’énergie sous forme de ', h('strong', { text: 'champ magnétique' })),
        ),
      ),
      h(
        'section',
        { class: 'compare__side' },
        h('h3', { class: 'compare__title', text: 'Le condensateur' }),
        h('ul', { class: 'compare__list' },
          h('li', {}, 'Unité : le ', h('strong', { text: 'farad' }), ' (F)'),
          h('li', {}, 'Impédance ', h('strong', { text: 'décroissante' }), ' avec la fréquence'),
          h('li', {}, 'En continu : impédance ', h('strong', { text: 'infinie' }), ' — rien ne passe'),
          h('li', {}, 'Tension ', h('strong', { text: 'en retard' }), ' de 90° sur l’intensité'),
          h('li', {}, 'En ', h('strong', { text: 'parallèle' }), ' que les capacités s’additionnent'),
          h('li', {}, 'Emmagasine l’énergie sous forme de ', h('strong', { text: 'champ électrostatique' })),
        ),
      ),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Calculer une réactance' }),
      h('p', { class: 'card__hint' },
        "L’exemple chargé est celui du cours : une bobine de 12,5 µH à 8 MHz donne 628 Ω."),
      h('div', { class: 'toolbar' },
        reactFreq,
        h('span', { class: 'converter__label', text: 'MHz sur' }),
        reactValue,
        reactKind),
      h('div', { class: 'toolbar' },
        h('span', { class: 'converter__label', text: 'Résistance série (facultative)' }),
        reactSeries,
        h('span', { class: 'converter__label', text: 'Ω' })),
      reactOut,
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__note' },
        "Un raccourci de calcul circule et vaut d’être connu : le facteur ",
        h('strong', { text: '159' }),
        ", qui approche 1000 / 2π. Il permet de travailler directement en unités pratiques — mégahertz, " +
        "microhenrys, picofarads — sans manipuler les puissances de dix. L’écart avec le résultat exact " +
        "est de 0,1 %, et les réponses de l’examen sont de toute façon arrondies."),

      h('h2', { text: 'Grouper des bobines et des condensateurs' }),
      h('p', {},
        "C’est le piège le plus régulier du chapitre : pour les condensateurs, les formules sont ",
        h('strong', { text: 'inversées' }),
        " par rapport aux résistances."),
      h('p', { class: 'formula', text: 'Bobines en série : Lt = L1 + L2 + …' }),
      h('p', { class: 'formula', text: 'Condensateurs en parallèle : Ct = C1 + C2 + …' }),
      h('p', { class: 'formula', text: 'Condensateurs en série : Ct = (C1 × C2) / (C1 + C2)' }),
      h('p', {},
        "L’explication du parallèle est intuitive : mettre deux condensateurs côte à côte revient à " +
        "additionner les surfaces de leurs armatures, donc leurs capacités. En série, la tension se " +
        "répartit à l’inverse des capacités — le plus petit condensateur encaisse la tension la plus " +
        "élevée."),
      h('p', { class: 'field__hint' },
        `Deux condensateurs de 100 pF et 400 pF donnent ${num(parallelCapacitance([100, 400]))} pF en ` +
        `parallèle, mais seulement ${num(seriesCapacitance([100, 400]))} pF en série.`),
      h('p', { class: 'prose__note' },
        "Les bobines en série ne s’additionnent simplement que si elles ne sont pas couplées. Deux " +
        "bobines voisines partagent leur champ magnétique, et il faut alors ajouter ou retrancher leur " +
        "mutuelle induction. Pour l’éviter : les éloigner, les blinder, ou les disposer " +
        "perpendiculairement — ce qui ne marche que jusqu’à trois, une par axe de l’espace."),

      h('h2', { text: 'Ce qu’il y a dans un condensateur' }),
      h('p', {},
        "Deux armatures métalliques face à face, séparées par un isolant appelé ",
        h('strong', { text: 'diélectrique' }),
        ". Sa capacité augmente avec la surface en vis-à-vis et diminue avec l’épaisseur du diélectrique."),
      h('p', { class: 'formula', text: 'C(F) = ε × S(m²) / e(m)' }),
      h('p', {},
        "La permittivité ε dépend du matériau. Celle du vide sert de référence, à 8,84 pF/m ; la " +
        "permittivité relative des autres matériaux lui est comparée et vaut toujours plus de 1 — 2,1 " +
        "pour le téflon, 5 à 6 pour le mica, 10 et plus pour les céramiques."),
      h('p', {},
        "Au-delà d’une certaine tension, le diélectrique est percé : c’est le ",
        h('strong', { text: 'claquage' }),
        ", et le seuil dépend de la ",
        h('strong', { text: 'rigidité' }),
        " du matériau — 4 kV/mm pour l’air sec, 70 pour le mica. Un condensateur électrochimique est de " +
        "plus polarisé : le brancher à l’envers le fait chauffer, et parfois exploser."),
      h('p', { class: 'formula', text: 'Q(C) = C(F) × U(V)          E(J) = ½ × Q × U' }),

      h('h2', { text: 'Charge et décharge' }),
      h('p', {},
        "Un condensateur ne se charge pas instantanément. En série avec une résistance, sa charge suit " +
        "une courbe dont la rapidité est fixée par la ",
        h('strong', { text: 'constante de temps' }),
        "."),
      h('p', { class: 'formula', text: 'T(s) = R(Ω) × C(F)' }),
      h('p', {},
        "Au bout d’une constante de temps, le condensateur est chargé à 63 % ; puis 63 % de ce qui " +
        "reste à la suivante, et ainsi de suite. Après cinq constantes de temps, la charge est " +
        "pratiquement complète."),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Constante de temps' }),
      h('div', { class: 'toolbar' },
        resistorInput,
        h('span', { class: 'converter__label', text: 'kΩ ×' }),
        capacitorInput,
        h('span', { class: 'converter__label', text: 'µF' })),
      tauOut,
      h('p', { class: 'field__hint' },
        "La même progression par 63 % décrit l’effet de peau : dans la première épaisseur passe 63 % du " +
        "courant, puis 63 % du reste dans la suivante."),
    ),

    h(
      'section',
      { class: 'card card--accent' },
      h('h2', { class: 'card__title', text: 'À retenir de ce chapitre' }),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {}, "Convertir en valeurs efficaces avant tout calcul : 0,707 × la crête."),
        h('li', {}, "La bobine s’oppose à la fréquence, le condensateur la laisse passer."),
        h('li', {}, "En continu : bobine = fil, condensateur = coupure."),
        h('li', {}, "Les condensateurs s’additionnent en parallèle — l’inverse des résistances."),
        h('li', {}, "La tension est en avance sur l’intensité dans une bobine, en retard dans un condensateur."),
      ),
      h('p', { class: 'field__hint' },
        "Le moyen mnémotechnique le plus répandu pour le déphasage : dans une bobine, ",
        h('em', { text: 'la tension mène' }),
        " ; dans un condensateur, ",
        h('em', { text: 'le courant mène' }),
        "."),
    ),
  );

  return { element };
}
