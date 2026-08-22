/**
 * Page « Classes d'émission et conditions techniques ».
 *
 * Les trois caractères d'une classe d'émission sont un système, pas une liste
 * à apprendre : on décompose, on ne mémorise pas. D'où le décodeur, qui rend
 * la structure manipulable — taper A1A puis F3E fait comprendre en dix
 * secondes ce que trois tableaux mettent une page à expliquer.
 */

import { h, setChildren } from '../ui/dom.ts';
import {
  INFORMATIONS,
  KNOWN_EMISSIONS,
  MODULATIONS,
  NOVICE_EMISSIONS,
  SIGNALS,
  decodeEmission,
  maxBandwidthKhz,
} from '../data/emissions.ts';
import type { EmissionCode } from '../data/emissions.ts';
import type { View, ViewContext } from '../ui/router.ts';

const codeTable = (title: string, position: string, table: EmissionCode[]): HTMLElement =>
  h(
    'details',
    { class: 'lexicon__group' },
    h('summary', { class: 'lexicon__summary' },
      h('span', { class: 'lexicon__title', text: title }),
      h('span', { class: 'lexicon__count', text: position })),
    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        { class: 'data-table' },
        h('thead', {}, h('tr', {},
          h('th', { attrs: { scope: 'col' }, text: 'Code' }),
          h('th', { attrs: { scope: 'col' }, text: 'Signification' }))),
        h('tbody', {}, ...table.map((entry) =>
          h('tr', { class: entry.amateur ? '' : 'is-dim' },
            h('th', { attrs: { scope: 'row' }, class: 'mono', text: entry.code }),
            h('td', { text: entry.label })))),
      ),
    ),
    h('p', { class: 'field__hint' },
      "Les lignes estompées existent au Règlement mais ne sont pas employées par les radioamateurs."),
  );

export function licenceEmissionsView(_context: ViewContext): View {
  // --- Décodeur de classe d'émission ---

  const output = h('div', { class: 'decoder__output' });

  const input = h('input', {
    class: 'input decoder__input',
    type: 'text',
    value: 'A1A',
    attrs: { maxlength: '3', 'aria-label': 'Classe d’émission', spellcheck: 'false', autocapitalize: 'characters' },
    on: { input: () => decode() },
  });

  const row = (position: string, code: string, label: string, known: boolean): HTMLElement =>
    h(
      'div',
      { class: `decoder__row${known ? '' : ' decoder__row--unknown'}` },
      h('span', { class: 'decoder__position', text: position }),
      h('span', { class: 'decoder__char', text: code || '—' }),
      h('span', { class: 'decoder__label', text: label }),
    );

  const decode = (): void => {
    const raw = input.value.trim().toUpperCase();
    if (raw !== input.value) input.value = raw;
    if (raw === '') {
      setChildren(output, [h('p', { class: 'prose__note', text: 'Entrez une classe, par exemple A1A.' })]);
      return;
    }
    const parts = decodeEmission(raw);
    const known = KNOWN_EMISSIONS.find((entry) => entry.code === raw);
    setChildren(output, [
      row('1 · Modulation de la porteuse', raw[0] ?? '', parts.modulation?.label ?? 'Caractère inconnu', parts.modulation !== null),
      row('2 · Signal modulant', raw[1] ?? '', parts.signal?.label ?? (raw.length > 1 ? 'Caractère inconnu' : 'Non renseigné'), parts.signal !== null),
      row('3 · Information transmise', raw[2] ?? '', parts.information?.label ?? (raw.length > 2 ? 'Caractère inconnu' : 'Non renseigné'), parts.information !== null),
      known
        ? h('p', { class: 'decoder__known' },
            h('strong', { text: known.name }),
            ' — ',
            known.comment)
        : null,
      NOVICE_EMISSIONS.includes(raw)
        ? h('p', { class: 'field__hint', text: 'Fait partie des six classes qui étaient autorisées aux opérateurs de classe 3.' })
        : null,
    ]);
  };

  decode();

  // --- Calculateur de largeur de bande ---

  const bandwidthOut = h('span', { class: 'converter__value' });
  const bandwidthInput = h('input', {
    class: 'input',
    type: 'number',
    value: '14',
    attrs: { step: 'any', min: '0', 'aria-label': 'Fréquence en mégahertz' },
    on: { input: () => computeBandwidth() },
  });

  const computeBandwidth = (): void => {
    const mhz = Number(bandwidthInput.value);
    if (!Number.isFinite(mhz) || mhz <= 0) {
      bandwidthOut.textContent = 'Entrez une fréquence.';
      return;
    }
    const limit = maxBandwidthKhz(mhz * 1000);
    bandwidthOut.textContent = limit === null
      ? 'Aucune limite fixée au-delà de 225 MHz'
      : `${limit} kHz au maximum`;
  };

  computeBandwidth();

  const element = h(
    'div',
    { class: 'stack' },

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__lead' },
        "Une classe d’émission décrit une manière d’occuper le spectre en trois caractères. Ce n’est pas " +
        "une nomenclature à apprendre par cœur : c’est un système à trois axes, et il suffit de le " +
        "comprendre une fois pour lire n’importe quelle classe, y compris celles qu’on n’a jamais " +
        "rencontrées."),

      h('h2', { text: 'Trois caractères, trois questions' }),
      h('p', {},
        "Le premier caractère répond à ",
        h('em', { text: 'comment la porteuse est-elle modulée ?' }),
        " Le deuxième à ",
        h('em', { text: 'quelle est la nature du signal qui la module ?' }),
        " Le troisième à ",
        h('em', { text: 'quelle information est transmise ?' }),
        ""),
      h('p', {},
        "Le piège est que l’ordre d’écriture n’est pas l’ordre de raisonnement. Pour ",
        h('strong', { text: 'construire' }),
        " une classe, on part de la fin : l’information d’abord, la modulation ensuite, la nature du " +
        "signal en dernier. Pour la ",
        h('strong', { text: 'lire' }),
        ", on prend les caractères dans l’ordre. Le décodeur ci-dessous fait la seconde opération ; " +
        "s’entraîner à faire la première de tête est ce qui rapporte des points."),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Décoder une classe d’émission' }),
      h('p', { class: 'card__hint' },
        "Tapez trois caractères. Essayez A1A, puis J3E, puis F7W — ou une combinaison inventée, pour " +
        "voir qu’elle se lit tout aussi bien."),
      h('div', { class: 'toolbar' }, input),
      output,
      h(
        'div',
        { class: 'chips' },
        ...['A1A', 'A2A', 'F2A', 'J3E', 'F3E', 'G2B', 'N0N'].map((code) =>
          h('button', {
            class: 'chip',
            type: 'button',
            text: code,
            on: {
              click: () => {
                input.value = code;
                decode();
              },
            },
          }),
        ),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Les trois tables' }),
      h('p', {},
        "Elles sont longues, mais la moitié de leurs entrées ne concerne pas les radioamateurs. Ce qui " +
        "s’apprend, c’est la logique de chaque colonne, pas la liste."),
    ),

    h(
      'div',
      { class: 'lexicon' },
      codeTable('Modulation de la porteuse', '1ᵉʳ caractère', MODULATIONS),
      codeTable('Nature du signal modulant', '2ᵉ caractère', SIGNALS),
      codeTable('Type d’information transmise', '3ᵉ caractère', INFORMATIONS),
    ),

    h(
      'section',
      { class: 'card card--muted' },
      h('h2', { class: 'card__title', text: 'La logique des codes' }),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'Modulation. ' }),
          "On commence par l’amplitude seule (A, puis B et C pour ses variantes), on continue par " +
          "l’amplitude combinée à l’angulaire (D), puis l’angulaire seule (F pour la fréquence, G pour la " +
          "phase). Viennent ensuite les trois bandes latérales uniques (H complète, J supprimée, " +
          "R réduite), enfin les trains d’impulsions. Les lettres O et I ne sont jamais employées, pour " +
          "éviter la confusion avec les chiffres 0 et 1."),
        h('li', {},
          h('strong', { text: 'Signal modulant. ' }),
          "Une seule voie numérique d’abord (1 sans sous-porteuse, 2 avec), puis analogique (3) ; même " +
          "ordre pour plusieurs voies (7 numérique, 8 analogique), et 9 pour la combinaison. Le 0 " +
          "signifie qu’il n’y a pas de signal modulant. Les chiffres 4, 5 et 6 ne servent pas."),
        h('li', {},
          h('strong', { text: 'Information. ' }),
          "Un moyen mnémotechnique circule, à partir des initiales : Auditif, Bécane, Copie, Données, " +
          "Écoute, France Télévision, No info, Wet suit."),
      ),
      h('p', { class: 'field__hint' },
        "Un détail qui déroute : en télégraphie, l’information est dite numérique — codée 1 ou 2 — parce " +
        "que le trait dure exactement trois fois le point. C’est une grandeur quantifiée, pas une " +
        "grandeur continue, même si l’oreille l’entend comme un son."),
    ),

    // --- Exemples ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Les classes qu’on rencontre vraiment' }),
      h('p', {},
        "Une douzaine suffit à couvrir l’essentiel du trafic. Les quatre premières concernent la " +
        "télégraphie, et méritent d’être distinguées les unes des autres."),
    ),

    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        { class: 'data-table' },
        h('thead', {}, h('tr', {},
          h('th', { attrs: { scope: 'col' }, text: 'Classe' }),
          h('th', { attrs: { scope: 'col' }, text: 'Nom courant' }),
          h('th', { attrs: { scope: 'col' }, text: 'Ce que c’est' }))),
        h('tbody', {}, ...KNOWN_EMISSIONS.map((entry) =>
          h('tr', {},
            h('th', { attrs: { scope: 'row' }, class: 'mono', text: entry.code }),
            h('td', { text: entry.name }),
            h('td', { text: entry.comment })))),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__note' },
        "Depuis mars 2013, toutes les classes d’émission sont autorisées, à condition de respecter la " +
        "largeur de bande. Auparavant, combiner plusieurs modulations ou transmettre données et voix " +
        "ensemble demandait une autorisation individuelle. Les opérateurs de l’ancienne classe 3 " +
        "restaient limités à six classes — A1A, A2A, A3E, F3E, G3E et J3E — c’est-à-dire à la " +
        "télégraphie et à la téléphonie, à l’exclusion de tout mode numérique."),

      h('h2', { text: 'Ce que la station doit respecter' }),
      h('h3', { text: 'Un seul appareil obligatoire' }),
      h('p', {},
        "Depuis la décision de 2012, le seul matériel imposé est un ",
        h('strong', { text: 'indicateur de puissance' }),
        ", intégré à tous les transceivers modernes. Auparavant, il fallait aussi un indicateur d’ondes " +
        "stationnaires, une charge non rayonnante et un filtre d’alimentation — équipements toujours " +
        "utiles, mais qui ne sont plus exigés."),

      h('h3', { text: 'La largeur de bande occupée' }),
      h('p', {},
        "Elle doit rester à l’intérieur de la bande attribuée, et ne pas dépasser un plafond qui dépend " +
        "de la fréquence."),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Largeur de bande autorisée' }),
      h('div', { class: 'toolbar' },
        bandwidthInput,
        h('span', { class: 'converter__label', text: 'MHz' })),
      h('p', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Largeur maximale' }),
        bandwidthOut),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {}, h('strong', { text: '6 kHz ' }), 'en dessous de 28 MHz'),
        h('li', {}, h('strong', { text: '12 kHz ' }), 'de 28 à 144 MHz — donc sur les bandes des 10 et 6 mètres'),
        h('li', {}, h('strong', { text: '20 kHz ' }), 'de 144 à 225 MHz'),
        h('li', {}, h('strong', { text: 'Aucune limite ' }), 'au-delà de 225 MHz'),
      ),
      h('p', { class: 'field__hint' },
        "« Aucune limite » ne veut pas dire « aucune retenue » : le Règlement demande de réduire la " +
        "largeur occupée autant que les considérations techniques le permettent. C’est un principe " +
        "général, valable sur toutes les bandes."),
    ),

    h(
      'article',
      { class: 'prose' },
      h('h3', { text: 'Les rayonnements non essentiels' }),
      h('p', {},
        "Un émetteur ne produit jamais un signal parfaitement propre. On distingue deux sortes de " +
        "saletés, et les confondre coûte des points."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'Les émissions hors bande ' }),
          "sont les débordements immédiatement adjacents au signal utile — ce que les opérateurs " +
          "appellent des moustaches, ou des splatters."),
        h('li', {},
          h('strong', { text: 'Les rayonnements non essentiels ' }),
          "sont tout le reste : harmoniques, produits parasites, rayonnements éloignés de la fréquence " +
          "de travail."),
      ),
      h('p', {},
        "La frontière entre les deux se situe à ",
        h('strong', { text: 'deux fois et demie la largeur de bande nécessaire' }),
        " de part et d’autre de la fréquence centrale, sans jamais descendre en dessous de 10 kHz sous " +
        "30 MHz, ni de 62,5 kHz entre 30 MHz et 1 GHz."),
      h('p', {},
        "Le niveau toléré pour les rayonnements non essentiels suit une formule, exprimée par rapport à " +
        "la puissance de l’émission utile :"),
      h('p', { class: 'formula', text: 'atténuation ≥ 43 dB + 10 log(P)' }),
      h('p', {},
        "où P est la puissance de l’émetteur en watts. Le Règlement retient la valeur la moins " +
        "contraignante entre cette formule et deux plafonds : ",
        h('strong', { text: '−50 dBc' }),
        " en dessous de 30 MHz, ",
        h('strong', { text: '−70 dBc' }),
        " au-dessus. Au-dessus de 30 MHz, où la puissance est limitée à 120 W, la formule donne environ " +
        "−64 dBc — c’est donc elle qui s’applique."),
      h('p', { class: 'prose__note' },
        "Le suffixe c de « dBc » signifie « par rapport à la porteuse ». Les décibels et leurs variantes " +
        "sont repris en détail dans le chapitre des bases techniques."),

      h('h3', { text: 'Ce qui repart dans le secteur' }),
      h('p', {},
        "Un émetteur pollue aussi par sa prise de courant. La norme CISPR 11 classe le matériel " +
        "radioamateur en groupe 2, classe B — matériel d’émission à usage domestique — et limite les " +
        "perturbations réinjectées dans le réseau électrique à 0,63 mV entre 0,5 et 5 MHz, et 1 mV entre " +
        "5 et 30 MHz. La norme EN 301 783 fixe, elle, les caractéristiques que doivent respecter les " +
        "équipements radioamateurs mis sur le marché."),
    ),
  );

  return { element };
}
