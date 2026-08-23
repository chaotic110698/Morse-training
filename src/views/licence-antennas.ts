/**
 * Page « Antennes et lignes de transmission ».
 *
 * Le chapitre le plus calculatoire de l'épreuve de réglementation, et celui
 * qui rapporte le plus : longueur d'un brin, puissance rayonnée, ondes
 * stationnaires. Trois calculateurs plutôt qu'un seul, parce que ce sont trois
 * raisonnements distincts — et celui de la PAR est présenté comme une chaîne,
 * puisque c'est ainsi que la question est posée : un câble, une antenne, une
 * puissance, et le résultat au bout.
 */

import { h, setChildren } from '../ui/dom.ts';
import {
  DIPOLE_GAIN_DBI,
  SHORTENING,
  cableLoss,
  examWavelength,
  matchingLineImpedance,
  powerRatio,
  rhoFromAmplitudes,
  rhoFromPowers,
  swrPercent,
  vswrFromImpedances,
  vswrFromRho,
} from '../core/radio-math.ts';
import { ANTENNA_TYPES, WAVE_RANGES, waveRangeFor } from '../data/spectrum.ts';
import type { View, ViewContext } from '../ui/router.ts';

const num = (value: number, digits = 2): string =>
  value.toLocaleString('fr-FR', { maximumFractionDigits: digits });

const metres = (value: number): string =>
  value >= 1 ? `${num(value)} m` : `${num(value * 100, 1)} cm`;

export function licenceAntennasView(_context: ViewContext): View {
  // --- Calculateur de longueur d'antenne ---

  const lengths = h('div', { class: 'converter__result' });
  const freqInput = h('input', {
    class: 'input',
    type: 'number',
    value: '150',
    attrs: { step: 'any', min: '0', 'aria-label': 'Fréquence en mégahertz' },
    on: { input: () => computeLengths() },
  });

  const computeLengths = (): void => {
    const mhz = Number(freqInput.value);
    if (!Number.isFinite(mhz) || mhz <= 0) {
      setChildren(lengths, [h('span', { class: 'prose__note', text: 'Entrez une fréquence.' })]);
      return;
    }
    const lambda = examWavelength(mhz);
    const range = waveRangeFor(mhz);
    setChildren(lengths, [
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Longueur d’onde λ' }),
        h('strong', { text: metres(lambda) })),
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Doublet demi-onde — λ / 2' }),
        h('strong', { text: metres(lambda / 2) })),
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Quart d’onde — λ / 4' }),
        h('strong', { text: metres(lambda / 4) })),
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Quart d’onde raccourci de 5 %' }),
        h('strong', { text: metres((lambda / 4) * SHORTENING) })),
      range
        ? h('p', { class: 'field__hint', text: `Gamme ${range.code} — ondes ${range.adjective}.` })
        : null,
    ]);
  };

  computeLengths();

  // --- Chaîne PAR / PIRE ---

  const parResult = h('div', { class: 'converter__result' });
  const txPower = h('input', {
    class: 'input', type: 'number', value: '50',
    attrs: { step: 'any', min: '0', 'aria-label': 'Puissance de l’émetteur en watts' },
    on: { input: () => computePar() },
  });
  const cableLength = h('input', {
    class: 'input', type: 'number', value: '20',
    attrs: { step: 'any', min: '0', 'aria-label': 'Longueur du câble en mètres' },
    on: { input: () => computePar() },
  });
  const cableAtten = h('input', {
    class: 'input', type: 'number', value: '0.1',
    attrs: { step: 'any', min: '0', 'aria-label': 'Affaiblissement linéique en décibels par mètre' },
    on: { input: () => computePar() },
  });
  const antennaGain = h('input', {
    class: 'input', type: 'number', value: '8',
    attrs: { step: 'any', 'aria-label': 'Gain de l’antenne en décibels' },
    on: { input: () => computePar() },
  });
  const gainUnit = h(
    'select',
    { class: 'select', attrs: { 'aria-label': 'Référence du gain' }, on: { change: () => computePar() } },
    h('option', { value: 'dBd', text: 'dBd — PAR' }),
    h('option', { value: 'dBi', text: 'dBi — PIRE' }),
  );

  const computePar = (): void => {
    const watts = Number(txPower.value);
    const loss = cableLoss(Number(cableLength.value), Number(cableAtten.value));
    const gain = Number(antennaGain.value);
    if (![watts, loss, gain].every(Number.isFinite) || watts <= 0) {
      setChildren(parResult, [h('span', { class: 'prose__note', text: 'Complétez les quatre champs.' })]);
      return;
    }
    const total = gain - loss;
    const radiated = watts * powerRatio(total);
    const isEirp = gainUnit.value === 'dBi';
    setChildren(parResult, [
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Perte dans le câble' }),
        h('strong', { text: `− ${num(loss)} dB` })),
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Gain total de l’ensemble' }),
        h('strong', { text: `${total >= 0 ? '+' : ''}${num(total)} ${gainUnit.value}` })),
      h('div', { class: 'converter__line converter__line--result' },
        h('span', { class: 'converter__label', text: isEirp ? 'PIRE' : 'PAR' }),
        h('strong', { text: `${num(radiated, 1)} W` })),
      h('p', { class: 'field__hint' },
        isEirp
          ? "La puissance isotrope rayonnée équivalente prend pour référence l’antenne isotrope. C’est elle qui est plafonnée sur les bandes des 2200, 630 et 60 mètres."
          : "La puissance apparente rayonnée prend pour référence le doublet. C’est elle qu’il faut déclarer à l’ANFR au-delà de 5 watts."),
    ]);
  };

  computePar();

  // --- Ondes stationnaires ---

  const swrResult = h('div', { class: 'converter__result' });
  const swrMode = h(
    'select',
    { class: 'select', attrs: { 'aria-label': 'Mode de calcul' }, on: { change: () => computeSwr() } },
    h('option', { value: 'voltage', text: 'Deux tensions' }),
    h('option', { value: 'power', text: 'Deux puissances' }),
    h('option', { value: 'impedance', text: 'Deux impédances' }),
  );
  const swrA = h('input', {
    class: 'input', type: 'number', value: '5',
    attrs: { step: 'any', min: '0', 'aria-label': 'Première valeur' },
    on: { input: () => computeSwr() },
  });
  const swrB = h('input', {
    class: 'input', type: 'number', value: '20',
    attrs: { step: 'any', min: '0', 'aria-label': 'Seconde valeur' },
    on: { input: () => computeSwr() },
  });
  const swrLabels = h('div', { class: 'converter__label' });

  const computeSwr = (): void => {
    const a = Number(swrA.value);
    const b = Number(swrB.value);
    const mode = swrMode.value;
    swrLabels.textContent = mode === 'impedance'
      ? 'Impédance de la charge (Ω) et impédance de la ligne (Ω)'
      : mode === 'power'
        ? 'Puissance réfléchie (W) et puissance émise (W)'
        : 'Tension réfléchie (V) et tension émise (V)';

    if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) {
      setChildren(swrResult, [h('span', { class: 'prose__note', text: 'Entrez deux valeurs positives.' })]);
      return;
    }

    if (mode === 'impedance') {
      const vswr = vswrFromImpedances(a, b);
      setChildren(swrResult, [
        h('div', { class: 'converter__line converter__line--result' },
          h('span', { class: 'converter__label', text: 'ROS' }),
          h('strong', { text: `${num(vswr)} / 1` })),
        h('p', { class: 'field__hint', text: 'Le rapport se calcule toujours avec la plus forte impédance au numérateur, pour rester supérieur à 1.' }),
      ]);
      return;
    }

    const rho = mode === 'power' ? rhoFromPowers(a, b) : rhoFromAmplitudes(a, b);
    setChildren(swrResult, [
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Coefficient de réflexion ρ' }),
        h('strong', { text: num(rho, 3) })),
      h('div', { class: 'converter__line converter__line--result' },
        h('span', { class: 'converter__label', text: 'TOS' }),
        h('strong', { text: `${num(swrPercent(rho), 1)} %` })),
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'ROS équivalent' }),
        h('strong', { text: rho < 1 ? `${num(vswrFromRho(rho))} / 1` : 'infini' })),
      mode === 'power'
        ? h('p', { class: 'field__hint', text: 'Avec des puissances, le coefficient passe par une racine carrée : 5 W réfléchis sur 20 W émis donnent 0,5 et non 0,25.' })
        : null,
    ]);
  };

  computeSwr();

  const element = h(
    'div',
    { class: 'stack' },

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__lead' },
        "L’antenne est le seul élément d’une station qui convertisse un courant en onde. C’est aussi le " +
        "plus déterminant, et celui sur lequel l’épreuve de réglementation pose le plus de calculs. Ils " +
        "sont tous simples, à condition de connaître trois formules et les neuf rapports en décibels."),

      h('h2', { text: 'Longueur d’onde et fréquence' }),
      h('p', {},
        "Tout part de là. L’examen retient une approximation commode, avec 300 au lieu de la vitesse " +
        "exacte de la lumière :"),
      h('p', { class: 'formula', text: 'λ(m) = 300 / f(MHz)     et     f(MHz) = 300 / λ(m)' }),
      h('p', {},
        "Ces deux formules se calculent de tête et servent partout. Un dipôle de 50 mètres résonne sur " +
        "une longueur d’onde de 100 mètres, donc sur 3 MHz. Une antenne quart d’onde pour 150 MHz mesure " +
        "un quart de 2 mètres, soit 50 centimètres."),

      h('h2', { text: 'Les huit gammes d’ondes' }),
      h('p', {},
        "Chaque gamme couvre une décade, et son nom vient de sa longueur d’onde : les ondes " +
        "hectométriques commencent à un hectomètre, les décamétriques à un décamètre. Il faut connaître " +
        "les initiales, l’adjectif et les bornes — l’ANFR demande d’ailleurs de déclarer sa puissance " +
        "par gamme."),
      h('p', { class: 'prose__note' },
        "Les bornes sont exclusives en bas et inclusives en haut : 3 MHz appartient encore aux ondes " +
        "hectométriques, et les décamétriques commencent juste au-dessus. La même règle vaut à chaque " +
        "frontière."),
    ),

    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        { class: 'data-table' },
        h('thead', {}, h('tr', {},
          h('th', { attrs: { scope: 'col' }, text: 'Gamme' }),
          h('th', { attrs: { scope: 'col' }, text: 'Ondes' }),
          h('th', { attrs: { scope: 'col' }, text: 'Longueurs d’onde' }),
          h('th', { attrs: { scope: 'col' }, text: 'Fréquences' }))),
        h('tbody', {}, ...WAVE_RANGES.map((range) =>
          h('tr', {},
            h('th', { attrs: { scope: 'row' }, class: 'mono', text: range.code }),
            h('td', { text: range.adjective }),
            h('td', { class: 'num', text: range.wavelength }),
            h('td', { class: 'num', text: range.frequency })))),
      ),
    ),

    // --- Calculateur de longueurs ---
    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Dimensionner une antenne' }),
      h('div', { class: 'toolbar' },
        freqInput,
        h('span', { class: 'converter__label', text: 'MHz' })),
      lengths,
      h('p', { class: 'field__hint' },
        "En pratique, un brin rayonnant se raccourcit d’environ 5 % par rapport à la longueur théorique, " +
        "proportion qui varie selon le matériau. Ce coefficient vaut pour le dipôle et le quart d’onde. " +
        "Le doublet replié fait exception : il faut au contraire le rallonger."),
    ),

    // --- Types d'antennes ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Les antennes de référence' }),
      h('p', {},
        "Trois formes suffisent au programme, et ce qu’on retient d’elles est surtout leur impédance au " +
        "point d’alimentation — qui dépend de leur géométrie."),
    ),

    h(
      'div',
      { class: 'antennas' },
      ...ANTENNA_TYPES.map((antenna) =>
        h(
          'section',
          { class: 'antenna' },
          h('h3', { class: 'antenna__name' },
            antenna.name,
            antenna.alias ? h('span', { class: 'antenna__alias', text: ` — ${antenna.alias}` }) : null),
          h('p', { class: 'antenna__length', text: antenna.length }),
          h('p', { class: 'antenna__description', text: antenna.description }),
          h(
            'ul',
            { class: 'antenna__impedances' },
            ...antenna.impedances.map((z) =>
              h('li', {},
                h('span', { class: 'antenna__geometry', text: z.geometry }),
                h('span', { class: 'antenna__ohms', text: `${z.ohms} Ω` })),
            ),
          ),
        ),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__note' },
        "Un brin plus court que le quart d’onde reste utilisable : on le rallonge électriquement par une " +
        "bobine, placée à la base ou au milieu, ou par une capacité terminale au sommet. L’antenne ainsi " +
        "raccourcie présente une impédance plus faible à la résonance."),

      h('h2', { text: 'Directivité et gain' }),
      h('p', {},
        "Le diagramme de rayonnement d’un doublet ressemble à un tore traversé par le dipôle : le " +
        "rayonnement est maximal perpendiculairement aux brins, et nul dans leur prolongement. Ajouter " +
        "des ",
        h('strong', { text: 'éléments parasites' }),
        " près du brin rayonnant déforme ce lobe et concentre l’énergie dans une direction : c’est " +
        "l’antenne Yagi."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          "Les ",
          h('strong', { text: 'directeurs' }),
          " sont plus courts que le dipôle et se placent devant."),
        h('li', {},
          "Les ",
          h('strong', { text: 'réflecteurs' }),
          " sont plus longs et se placent derrière."),
        h('li', {},
          "Plus il y a d’éléments, plus le gain augmente — et plus l’impédance du brin rayonnant " +
          "diminue. Le gain dépend aussi de l’espacement entre éléments."),
      ),
      h('p', {},
        "Le gain se mesure dans la direction de rayonnement maximal, et se compare à une référence : le " +
        "doublet, et l’on parle de ",
        h('strong', { text: 'dBd' }),
        ", ou l’antenne isotrope — un point idéal rayonnant uniformément dans toutes les directions — et " +
        "l’on parle de ",
        h('strong', { text: 'dBi' }),
        ". Le doublet lui-même a un gain de ",
        h('strong', { text: `${DIPOLE_GAIN_DBI} dB` }),
        " par rapport à l’isotrope : c’est l’écart constant entre les deux échelles."),
      h('p', {},
        "Deux autres grandeurs décrivent une antenne directive. L’",
        h('strong', { text: 'angle d’ouverture' }),
        " est l’écart angulaire entre les directions où la puissance rayonnée tombe à la moitié, " +
        "c’est-à-dire à −3 dB, de la puissance maximale. Le ",
        h('strong', { text: 'gain avant/arrière' }),
        " est le rapport entre la puissance rayonnée vers l’avant et celle rayonnée à 180°, exprimé en " +
        "décibels."),
      h('p', { class: 'prose__note' },
        "Les caractéristiques d’une antenne — impédance et gain — sont identiques à l’émission et à la " +
        "réception. Selon la position du brin rayonnant, l’onde est polarisée verticalement ou " +
        "horizontalement ; des polarisations circulaires sont également possibles."),
    ),

    // --- PAR / PIRE ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Ce qui part réellement dans l’air' }),
      h('p', {},
        "La ",
        h('strong', { text: 'puissance apparente rayonnée' }),
        " est la puissance qui alimente l’antenne, multipliée par le rapport correspondant à son gain en " +
        "dBd. C’est la puissance qu’il faudrait appliquer à un dipôle pour rayonner autant dans la " +
        "direction la plus favorable. Avec un gain en dBi, on parle de ",
        h('strong', { text: 'puissance isotrope rayonnée équivalente' }),
        "."),
      h('p', {},
        "La question d’examen la pose comme une chaîne : un émetteur, un câble qui perd, une antenne qui " +
        "gagne. On additionne les décibels, on convertit en rapport, on multiplie."),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Calculer une PAR ou une PIRE' }),
      h('div', { class: 'toolbar' },
        txPower,
        h('span', { class: 'converter__label', text: 'W dans' }),
        cableLength,
        h('span', { class: 'converter__label', text: 'm de câble à' }),
        cableAtten,
        h('span', { class: 'converter__label', text: 'dB/m' })),
      h('div', { class: 'toolbar' },
        h('span', { class: 'converter__label', text: 'Antenne de' }),
        antennaGain,
        gainUnit),
      parResult,
    ),

    // --- Lignes ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'La ligne de transmission' }),
      h('p', {},
        "Le câble qui relie l’émetteur à l’antenne peut être ",
        h('strong', { text: 'asymétrique' }),
        " — le coaxial — ou ",
        h('strong', { text: 'symétrique' }),
        " — le twin-lead, ou échelle à grenouille. Son rôle est de transférer l’énergie, et ce transfert " +
        "est maximal quand la résistance de charge égale la résistance interne du générateur."),
      h('p', {},
        "Deux caractéristiques la décrivent, et il ne faut pas les confondre."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'L’affaiblissement linéique, ' }),
          "en décibels par mètre. Il est proportionnel à la longueur et augmente avec la fréquence. Vingt " +
          "mètres d’un câble à 0,1 dB/m perdent 2 dB."),
        h('li', {},
          h('strong', { text: 'L’impédance caractéristique, ' }),
          "en ohms, qui dépend des dimensions du câble et de son diélectrique. Elle n’a aucun rapport " +
          "avec l’affaiblissement. Un signal ressort identique à ce qu’il était à l’entrée — pertes " +
          "déduites — à condition que la sortie soit chargée sur cette même impédance."),
      ),

      h('h2', { text: 'Ondes stationnaires' }),
      h('p', {},
        "Quand la ligne et la charge n’ont pas la même impédance, une partie de l’énergie revient vers " +
        "l’émetteur et des ondes stationnaires apparaissent. Deux grandeurs mesurent ce désaccord, et " +
        "l’examen les distingue soigneusement."),
      h('p', { class: 'formula', text: 'ρ = U réfléchie / U émise = I réfléchi / I émis = √(P réfléchie / P émise)' }),
      h('p', { class: 'formula', text: 'TOS (%) = 100 × ρ          ROS = Z la plus forte / Z la plus faible' }),
      h('p', {},
        "Le piège est la racine carrée. Avec des tensions, 5 V réfléchis sur 20 V émis donnent ρ = 0,25 " +
        "et un TOS de 25 %. Avec des puissances, 5 W sur 20 W donnent ρ = √0,25 = 0,5, soit un TOS de " +
        "50 %. Les mêmes chiffres, deux résultats différents."),
      h('p', {},
        "Les deux grandeurs se convertissent l’une dans l’autre, mais le calcul demande une calculette :"),
      h('p', { class: 'formula', text: 'ROS = (1 + ρ) / (1 − ρ)          ρ = (ROS − 1) / (ROS + 1)' }),
      h('p', { class: 'prose__note' },
        "Le programme officiel ne cite que le ROS, mais des questions portent sur les deux. Une troisième " +
        "grandeur circule et prête à confusion : le taux de puissance réfléchie, qui vaut simplement " +
        "P réfléchie / P émise × 100 — sans racine."),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Calculer un TOS ou un ROS' }),
      h('div', { class: 'toolbar' }, swrMode, swrA, swrB),
      swrLabels,
      swrResult,
    ),

    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Adapter les impédances' }),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'La boîte de couplage ' }),
          "— ou boîte d’accord — s’insère entre l’émetteur et la ligne. Elle masque le désaccord vu de " +
          "l’émetteur, sans pour autant améliorer l’antenne."),
        h('li', {},
          h('strong', { text: 'Le balun ' }),
          "se place entre la ligne et l’antenne. Il assure le passage du symétrique à l’asymétrique, et " +
          "adapte les impédances si son rapport diffère de 1/1."),
        h('li', {},
          h('strong', { text: 'La ligne quart d’onde ' }),
          "est un morceau de câble dont l’impédance est la moyenne géométrique des deux impédances à " +
          "raccorder."),
      ),
      h('p', { class: 'formula', text: 'Z ligne = √(Z entrée × Z sortie)' }),
    ),

    h(
      'section',
      { class: 'card card--muted' },
      h('h2', { class: 'card__title', text: 'Adapter deux impédances' }),
      h('p', { class: 'card__hint' },
        "Par exemple 25 Ω vers 100 Ω : la ligne quart d’onde doit faire 50 Ω."),
      h(
        'div',
        { class: 'toolbar' },
        ...(() => {
          const out = h('strong', {});
          const a = h('input', {
            class: 'input', type: 'number', value: '25',
            attrs: { step: 'any', min: '0', 'aria-label': 'Impédance d’entrée' },
            on: { input: () => update() },
          });
          const b = h('input', {
            class: 'input', type: 'number', value: '100',
            attrs: { step: 'any', min: '0', 'aria-label': 'Impédance de sortie' },
            on: { input: () => update() },
          });
          const update = (): void => {
            const value = matchingLineImpedance(Number(a.value), Number(b.value));
            out.textContent = value > 0 ? `${num(value)} Ω` : '—';
          };
          update();
          return [
            a,
            h('span', { class: 'converter__label', text: 'Ω vers' }),
            b,
            h('span', { class: 'converter__label', text: 'Ω →' }),
            out,
          ];
        })(),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__note' },
        "Les paraboles, utilisées en SHF et au-delà, réfléchissent les ondes vers un foyer où se trouve " +
        "l’antenne proprement dite — généralement un doublet. La distance entre le foyer et la parabole " +
        "est la focale F ; le rapport D/F, avec D le diamètre, détermine l’angle d’illumination et la " +
        "concavité du réflecteur."),
      h('p', {},
        "Pour situer une fréquence dans le plan de bandes plutôt que dans les gammes d’ondes, voyez ",
        h('a', { href: '#/licence/bandes', text: 'Bandes et puissances' }),
        ". La formule exacte de la longueur d’onde, avec la vraie vitesse de la lumière, est employée " +
        "par le convertisseur de ",
        h('a', { href: '#/apprendre/radio', text: 'Comprendre la radio' }),
        " — l’écart avec l’approximation à 300 reste sous 0,07 %."),
    ),
  );

  return { element };
}
