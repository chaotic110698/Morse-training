/**
 * Page « Amplificateurs opérationnels et circuits logiques ».
 *
 * La partie la plus légère du programme technique — une seule question a été
 * recensée sur les portes logiques — mais celle qui explique ce qu'il y a
 * dans un poste moderne. La table de vérité est interactive : basculer les
 * deux entrées et voir la sortie suivre vaut mieux que mémoriser cinq tables.
 */

import { h, setChildren } from '../ui/dom.ts';
import { invertingGain, logicOutput, nonInvertingGain, nyquistFrequency } from '../core/radio-math.ts';
import type { LogicGate } from '../core/radio-math.ts';
import { formatHertz as hertz, num } from '../ui/units.ts';
import type { View, ViewContext } from '../ui/router.ts';

const GATES: Array<{ gate: LogicGate; symbol: string; boolean: string; rule: string }> = [
  { gate: 'ET', symbol: '&', boolean: 'multiplication', rule: 'La sortie est à 1 seulement si les deux entrées sont à 1.' },
  { gate: 'OU', symbol: '≥1', boolean: 'addition', rule: 'La sortie est à 1 dès qu’une entrée est à 1.' },
  { gate: 'NON ET', symbol: '&̄', boolean: 'multiplication complémentée', rule: 'L’inverse du ET : à 0 seulement si les deux entrées sont à 1.' },
  { gate: 'NON OU', symbol: '≥̄1', boolean: 'addition complémentée', rule: 'L’inverse du OU : à 1 seulement si les deux entrées sont à 0.' },
  { gate: 'OU EXCLUSIF', symbol: '=1', boolean: '⊕', rule: 'La sortie est à 1 si une entrée et une seule est à 1.' },
];

const BINARY = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

export function licenceDigitalView(_context: ViewContext): View {
  // --- Gain d'un amplificateur opérationnel ---

  const gainOut = h('div', { class: 'converter__result' });
  const r1Input = h('input', {
    class: 'input', type: 'number', value: '5000',
    attrs: { step: 'any', min: '0', 'aria-label': 'Résistance d’entrée R1 en ohms' },
    on: { input: () => computeGain() },
  });
  const r2Input = h('input', {
    class: 'input', type: 'number', value: '25000',
    attrs: { step: 'any', min: '0', 'aria-label': 'Résistance de contre-réaction R2 en ohms' },
    on: { input: () => computeGain() },
  });
  const ueInput = h('input', {
    class: 'input', type: 'number', value: '0.5',
    attrs: { step: 'any', 'aria-label': 'Tension d’entrée en volts' },
    on: { input: () => computeGain() },
  });
  const mountSelect = h(
    'select',
    { class: 'select', attrs: { 'aria-label': 'Montage' }, on: { change: () => computeGain() } },
    h('option', { value: 'inverting', text: 'Inverseur' }),
    h('option', { value: 'non-inverting', text: 'Non inverseur' }),
  );

  const computeGain = (): void => {
    const r1 = Number(r1Input.value);
    const r2 = Number(r2Input.value);
    const ue = Number(ueInput.value);
    if (![r1, r2].every(Number.isFinite) || r1 <= 0 || r2 <= 0) {
      setChildren(gainOut, [h('span', { class: 'prose__note', text: 'Entrez deux résistances positives.' })]);
      return;
    }
    const inverting = mountSelect.value === 'inverting';
    const gain = inverting ? invertingGain(r1, r2) : nonInvertingGain(r1, r2);
    setChildren(gainOut, [
      h('div', { class: 'converter__line converter__line--result' },
        h('span', { class: 'converter__label', text: inverting ? 'Gain G = − R2 / R1' : 'Gain G = R2 / R1 + 1' }),
        h('strong', { text: num(gain) })),
      Number.isFinite(ue)
        ? h('div', { class: 'converter__line' },
            h('span', { class: 'converter__label', text: `${num(ue)} V en entrée donnent` }),
            h('strong', { text: `${num(ue * gain)} V` }))
        : null,
      h('p', { class: 'field__hint' },
        inverting
          ? "Le gain est négatif : le signal ressort inversé. Il n’y a aucun gain en intensité — le même courant traverse R1 et R2."
          : "Le gain est positif et toujours supérieur à 1 : le signal garde sa phase. Seul le montage inverseur est explicitement au programme, mais des questions portent sur celui-ci."),
    ]);
  };

  computeGain();

  // --- Table de vérité interactive ---

  let inputA = false;
  let inputB = false;
  const truthOut = h('div', { class: 'truth' });

  const renderTruth = (): void => {
    setChildren(truthOut, GATES.map((entry) => {
      const on = logicOutput(entry.gate, inputA, inputB);
      return h(
        'div',
        { class: `gate${on ? ' is-on' : ''}` },
        h('span', { class: 'gate__name', text: entry.gate }),
        h('span', { class: 'gate__symbol', text: entry.symbol }),
        h('span', { class: 'gate__output', text: on ? '1' : '0' }),
      );
    }));
  };

  const toggle = (label: string, get: () => boolean, set: (value: boolean) => void): HTMLElement => {
    const button = h('button', {
      class: 'toggle-bit',
      type: 'button',
      attrs: { 'aria-pressed': 'false', 'aria-label': `Entrée ${label}` },
      on: {
        click: () => {
          set(!get());
          button.textContent = `${label} = ${get() ? '1' : '0'}`;
          button.classList.toggle('is-on', get());
          button.setAttribute('aria-pressed', get() ? 'true' : 'false');
          renderTruth();
        },
      },
      text: `${label} = 0`,
    });
    return button;
  };

  renderTruth();

  // --- Nyquist ---

  const nyquistOut = h('strong', {});
  const sampleInput = h('input', {
    class: 'input', type: 'number', value: '48',
    attrs: { step: 'any', min: '0', 'aria-label': 'Fréquence d’échantillonnage en kilohertz' },
    on: { input: () => computeNyquist() },
  });

  const computeNyquist = (): void => {
    const khz = Number(sampleInput.value);
    nyquistOut.textContent = Number.isFinite(khz) && khz > 0 ? hertz(nyquistFrequency(khz * 1000)) : '—';
  };

  computeNyquist();

  const element = h(
    'div',
    { class: 'stack' },

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__lead' },
        "Deux familles de circuits intégrés se partagent l’intérieur d’un poste moderne : les " +
        "amplificateurs opérationnels côté analogique, les portes logiques côté commandes et affichage. " +
        "L’examen les effleure — une seule question sur les portes a été recensée — mais elles " +
        "expliquent ce qu’on trouve sous le capot."),

      h('h2', { text: 'L’amplificateur opérationnel' }),
      h('p', {},
        "Un triangle dont la pointe est la sortie, et deux entrées : une normale, marquée +, et une " +
        "inverseuse, marquée −. Trois caractéristiques idéales le définissent, et tout le reste en " +
        "découle."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'Impédance d’entrée infinie ' }),
          "— aucun courant n’entre par les entrées."),
        h('li', {},
          h('strong', { text: 'Impédance de sortie nulle ' }),
          "— en pratique très faible."),
        h('li', {},
          h('strong', { text: 'Gain en tension infini ' }),
          "— la moindre différence entre les deux entrées envoie la sortie contre l’une des tensions " +
          "d’alimentation."),
      ),
      h('p', {},
        "Un gain infini serait inutilisable tel quel. C’est la ",
        h('strong', { text: 'contre-réaction' }),
        " — une résistance R2 ramenant la sortie sur l’entrée inverseuse — qui le dompte. Le système se " +
        "stabilise alors avec les deux entrées au même potentiel, et le gain ne dépend plus que du " +
        "rapport des deux résistances."),
      h('p', { class: 'formula', text: 'Montage inverseur : G = − R2 / R1' }),
      h('p', { class: 'formula', text: 'Montage non inverseur : G = R2 / R1 + 1' }),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Gain d’un montage à ampli op' }),
      h('div', { class: 'toolbar' }, mountSelect),
      h(
        'div',
        { class: 'ohm-fields' },
        h('label', { class: 'ohm-field' }, h('span', { text: 'R1 (Ω)' }), r1Input),
        h('label', { class: 'ohm-field' }, h('span', { text: 'R2 (Ω)' }), r2Input),
        h('label', { class: 'ohm-field' }, h('span', { text: 'Ue (V)' }), ueInput),
      ),
      gainOut,
      h('p', { class: 'field__hint' },
        "Le gain est ici un coefficient multiplicateur avec inversion de phase, à ne pas exprimer en " +
        "décibels. Attention au double signe négatif : −0,5 V amplifiés par un gain de −5 donnent " +
        "+2,5 V."),
    ),

    // --- Logique ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Les portes logiques' }),
      h('p', {},
        "Des opérateurs binaires : ils ne connaissent que deux états. En logique TTL, le 1 correspond à " +
        "une tension proche de 5 V et le 0 à 0 V. Leur algèbre est celle de Boole, où le ET est une " +
        "multiplication et le OU une addition."),
      h('p', {},
        "Basculez les deux entrées ci-dessous : les cinq portes réagissent en même temps, ce qui rend " +
        "leurs différences plus lisibles que cinq tables séparées."),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Les cinq portes en même temps' }),
      h(
        'div',
        { class: 'toolbar' },
        toggle('A', () => inputA, (v) => { inputA = v; }),
        toggle('B', () => inputB, (v) => { inputB = v; }),
      ),
      truthOut,
      h(
        'ul',
        { class: 'prose__list' },
        ...GATES.map((entry) =>
          h('li', {}, h('strong', { text: `${entry.gate} — ` }), entry.rule)),
      ),
      h('p', { class: 'field__hint' },
        "Au schéma, le ET a le bord gauche droit et le droit arrondi ; le OU a le bord gauche arrondi et " +
        "le bout pointu ; le OU EXCLUSIF ajoute un second arrondi. Un petit rond sur une entrée ou sur " +
        "la sortie en inverse la logique."),
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', {},
        "Deux montages classiques méritent d’être connus. Le ",
        h('strong', { text: 'trigger de Schmitt' }),
        " évite l’auto-oscillation d’une porte quand la tension d’entrée traîne entre 0 et 5 V : sa " +
        "tension de basculement de 0 vers 1 est supérieure à celle de 1 vers 0, ce qui crée un " +
        "hystérésis franc. Associé à un condensateur et une résistance, il devient un générateur de " +
        "signaux carrés."),
      h('p', {},
        "La ",
        h('strong', { text: 'bascule R/S' }),
        " — Reset et Set — mémorise la dernière commande reçue sur ses deux sorties complémentaires. " +
        "C’est l’ancêtre de la cellule mémoire, aujourd’hui remplacée par un condensateur couplé à un " +
        "MOS-FET."),

      h('h2', { text: 'Binaire et hexadécimal' }),
      h('p', {},
        "Un ",
        h('strong', { text: 'bit' }),
        " ne prend que deux valeurs. Huit bits font un ",
        h('strong', { text: 'octet' }),
        ", et chaque demi-octet se code commodément en hexadécimal — base 16, où les valeurs 10 à 15 " +
        "s’écrivent A à F."),
      h('p', { class: 'field__hint' },
        "Attention au piège : un kilo-octet vaut 1024 octets, soit 2¹⁰, et non 1000."),
    ),

    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        { class: 'data-table' },
        h('thead', {}, h('tr', {},
          h('th', { attrs: { scope: 'col' }, text: 'Décimal' }),
          ...BINARY.map((n) => h('th', { class: 'num', attrs: { scope: 'col' }, text: String(n) })))),
        h('tbody', {},
          h('tr', {},
            h('th', { attrs: { scope: 'row' }, text: 'Binaire' }),
            ...BINARY.map((n) => h('td', { class: 'num mono', text: n.toString(2).padStart(4, '0') }))),
          h('tr', {},
            h('th', { attrs: { scope: 'row' }, text: 'Hexadécimal' }),
            ...BINARY.map((n) => h('td', { class: 'num mono', text: n.toString(16).toUpperCase() })))),
      ),
    ),

    // --- Numérisation ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Numériser un signal' }),
      h('p', {},
        "Un convertisseur analogique-numérique prélève un échantillon de la tension à intervalle fixe. " +
        "Deux grandeurs le caractérisent : la ",
        h('strong', { text: 'fréquence d’échantillonnage' }),
        ", qui dit à quelle cadence, et la ",
        h('strong', { text: 'quantification' }),
        ", qui dit avec combien de valeurs possibles."),
      h('p', {},
        "Le théorème de Shannon-Nyquist pose la limite : on ne peut restituer fidèlement qu’un signal " +
        "dont la fréquence reste sous la moitié de la fréquence d’échantillonnage."),
      h('p', { class: 'formula', text: 'f Nyquist = f échantillonnage / 2' }),
      h('p', {},
        "Au-delà, les fréquences se replient et produisent des ",
        h('strong', { text: 'alias' }),
        " : des signaux parasites qui n’existent pas dans l’original. D’où le filtre passe-bas placé " +
        "avant tout convertisseur."),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Fréquence de Nyquist' }),
      h('div', { class: 'toolbar' },
        h('span', { class: 'converter__label', text: 'Échantillonnage à' }),
        sampleInput,
        h('span', { class: 'converter__label', text: 'kHz →' }),
        nyquistOut),
      h('p', { class: 'field__hint' },
        "C’est ce théorème qui fixe les 44,1 kHz du disque compact : il fallait pouvoir restituer " +
        "jusqu’à 20 kHz, la limite de l’oreille."),
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__note' },
        "Deux sigles reviennent en transmission de données. Le ",
        h('strong', { text: 'CRC' }),
        " — contrôle de redondance cyclique — vérifie que tous les bits sont arrivés intacts. En " +
        "liaison bilatérale, l’",
        h('strong', { text: 'ARQ' }),
        " permet de redemander ce qui manque ; en diffusion vers plusieurs stations qui n’émettent pas, " +
        "le ",
        h('strong', { text: 'FEC' }),
        " ajoute des bits de contrôle permettant la correction automatique, sans retour."),
      h('p', {},
        "Une émission de données porte la lettre D en troisième caractère de sa classe d’émission — " +
        "voyez ",
        h('a', { href: '#/licence/emissions', text: 'le décodeur de classes' }),
        "."),
    ),

    h(
      'section',
      { class: 'card card--accent' },
      h('h2', { class: 'card__title', text: 'La section des composants actifs est terminée' }),
      h('p', {},
        "Diodes, transistors, amplificateurs, oscillateurs, mélangeurs, circuits intégrés : vous avez " +
        "toutes les briques. Il reste à voir comment on les assemble en un récepteur et en un émetteur, " +
        "et ce qu’on fait exactement de la porteuse."),
      h(
        'div',
        { class: 'actions' },
        h('a', { class: 'btn', href: '#/licence/diodes', text: 'Revoir les diodes' }),
        h('a', { class: 'btn', href: '#/licence/transistors', text: 'Revoir les transistors' }),
      ),
    ),
  );

  return { element };
}
