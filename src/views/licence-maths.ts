/**
 * Page « Calculer sans se tromper ».
 *
 * Le chapitre préliminaire de l'épreuve de technique. Il ne contient aucune
 * question directe mais conditionne toutes les autres : une formule juste
 * appliquée avec le mauvais multiple donne une réponse fausse, et c'est de
 * loin la première cause d'erreur. D'où le convertisseur, qui montre le
 * déplacement de la virgule plutôt que de se contenter d'un résultat.
 */

import { h, setChildren } from '../ui/dom.ts';
import { MULTIPLES } from '../data/components.ts';
import type { View, ViewContext } from '../ui/router.ts';

interface Rule {
  operation: string;
  transform: string;
  example: string;
}

const RULES: Rule[] = [
  { operation: 'A = B + X', transform: 'X = A − B', example: "Ce qui s’ajoute d’un côté se retranche de l’autre." },
  { operation: 'A = B − X', transform: 'X = B − A', example: "Attention à l’ordre : l’inconnue étant soustraite, les rôles s’échangent." },
  { operation: 'A = B × X', transform: 'X = A / B', example: "Ce qui multiplie d’un côté divise de l’autre." },
  { operation: 'A = B / X', transform: 'X = B / A', example: "L’inconnue au dénominateur remonte, et A descend." },
  { operation: 'A = X²', transform: 'X = √A', example: "Le carré devient racine carrée." },
  { operation: 'A = √X', transform: 'X = A²', example: "Et réciproquement." },
];

const format = (value: number): string => {
  if (value === 0) return '0';
  const abs = Math.abs(value);
  if (abs >= 1e-4 && abs < 1e9) {
    return value.toLocaleString('fr-FR', { maximumSignificantDigits: 6 });
  }
  return value.toExponential(4).replace('e', ' × 10^').replace('+', '');
};

export function licenceMathsView(_context: ViewContext): View {
  // --- Convertisseur de multiples ---

  const output = h('div', { class: 'converter__result' });

  const valueInput = h('input', {
    class: 'input',
    type: 'number',
    value: '25',
    attrs: { step: 'any', 'aria-label': 'Valeur' },
    on: { input: () => convert() },
  });

  const fromSelect = h(
    'select',
    { class: 'select', attrs: { 'aria-label': 'Multiple de départ' }, on: { change: () => convert() } },
    ...MULTIPLES.map((m) => h('option', { value: String(m.exponent), text: m.symbol === '' ? 'unité' : `${m.symbol} — ${m.name}` })),
  );
  fromSelect.value = '3';

  const unitInput = h('input', {
    class: 'input decoder__unit',
    type: 'text',
    value: 'Ω',
    attrs: { maxlength: '3', 'aria-label': 'Unité', spellcheck: 'false' },
    on: { input: () => convert() },
  });

  const convert = (): void => {
    const raw = Number(valueInput.value);
    const from = Number(fromSelect.value);
    const unit = unitInput.value.trim();
    if (!Number.isFinite(raw)) {
      setChildren(output, [h('span', { class: 'prose__note', text: 'Entrez une valeur.' })]);
      return;
    }
    const base = raw * 10 ** from;
    setChildren(output, MULTIPLES.map((m) => {
      const converted = base / 10 ** m.exponent;
      const isSource = m.exponent === from;
      // On n'affiche que ce qui reste lisible : au-delà, la notation
      // scientifique remplacerait justement ce que le tableau doit montrer.
      const useful = converted !== 0 && Math.abs(converted) >= 1e-6 && Math.abs(converted) < 1e12;
      return h(
        'div',
        { class: `converter__line${isSource ? ' converter__line--result' : ''}${useful ? '' : ' is-dim'}` },
        h('span', { class: 'converter__label', text: m.symbol === '' ? 'unité' : `${m.symbol} — ${m.name}` }),
        h('strong', { text: `${format(converted)} ${m.symbol}${unit}` }),
      );
    }));
  };

  convert();

  const element = h(
    'div',
    { class: 'stack' },

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__lead' },
        "L’épreuve de technique ne pose aucune question sur ce chapitre. Elle en pose vingt qui en " +
        "dépendent. Une formule juste appliquée avec le mauvais multiple donne une réponse fausse, et " +
        "c’est de très loin la première cause d’échec — bien avant l’ignorance d’une notion."),

      h('h2', { text: 'Transformer une équation' }),
      h('p', {},
        "Une équation dit que ses deux membres ont la même valeur. Isoler l’inconnue consiste à faire " +
        "passer les autres termes de l’autre côté, en inversant leur opération."),
    ),

    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        { class: 'data-table' },
        h('thead', {}, h('tr', {},
          h('th', { attrs: { scope: 'col' }, text: 'Si' }),
          h('th', { attrs: { scope: 'col' }, text: 'Alors' }),
          h('th', { attrs: { scope: 'col' }, text: 'Pourquoi' }))),
        h('tbody', {}, ...RULES.map((rule) =>
          h('tr', {},
            h('th', { attrs: { scope: 'row' }, class: 'mono', text: rule.operation }),
            h('td', { class: 'mono', text: rule.transform }),
            h('td', { text: rule.example })))),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('h3', { text: 'L’ordre des opérations' }),
      h('p', {},
        "Puissances et racines d’abord, multiplications et divisions ensuite, additions et soustractions " +
        "en dernier. Les parenthèses renversent cet ordre : ce qu’elles contiennent se calcule avant tout."),
      h('p', {},
        "Dans ",
        h('span', { class: 'mono', text: 'A = B × C + D²' }),
        ", on calcule D², puis B × C, puis on additionne. Dans ",
        h('span', { class: 'mono', text: 'A = B × (C + D)²' }),
        ", on calcule C + D, on l’élève au carré, et on multiplie par B. Les crochets valent les " +
        "parenthèses et servent à la lisibilité."),
      h('p', { class: 'prose__note' },
        "Une notation à connaître : ",
        h('span', { class: 'mono', text: '√AB' }),
        " signifie ",
        h('span', { class: 'mono', text: '√(A × B)' }),
        ", alors que la racine de A multipliée par B s’écrit ",
        h('span', { class: 'mono', text: 'B√A' }),
        " pour lever l’ambiguïté."),

      h('h3', { text: 'Le produit en croix' }),
      h('p', {},
        "Quand deux rapports sont proportionnels — ",
        h('span', { class: 'mono', text: 'A / B = C / D' }),
        " — le théorème de Thalès donne aussi ",
        h('span', { class: 'mono', text: 'A / C = B / D' }),
        ". L’inconnue se calcule par le produit des valeurs de l’autre diagonale, divisé par la valeur " +
        "opposée."),
      h('p', { class: 'formula', text: 'D = B × C / A          C = A × D / B' }),
      h('p', {},
        "C’est l’outil le plus rentable du chapitre : les transformateurs, les groupements de résistances " +
        "et les rapports de spires se résolvent tous ainsi."),

      h('h2', { text: 'Les puissances de dix' }),
      h('p', {},
        "Les grandeurs de la radio couvrent une amplitude énorme : un condensateur se compte en " +
        "picofarads, une fréquence en mégahertz. Les multiples évitent d’écrire des files de zéros, et " +
        "ils vont ",
        h('strong', { text: 'de trois en trois' }),
        "."),
      h('p', {},
        "Passer d’un multiple à l’autre revient à déplacer la virgule de trois rangs : vers la gauche " +
        "pour monter d’un multiple, vers la droite pour descendre. Le tableau ci-dessous fait ce " +
        "déplacement sous vos yeux."),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Convertir un multiple' }),
      h('p', { class: 'card__hint' },
        "Le cours conseille de recopier cette table sur le brouillon pendant les cinq minutes qui " +
        "précèdent l’épreuve. C’est un bon conseil."),
      h('div', { class: 'toolbar' }, valueInput, fromSelect, unitInput),
      output,
    ),

    h(
      'article',
      { class: 'prose' },
      h('h3', { text: 'Calculer avec des puissances de dix' }),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'Additions et soustractions : ' }),
          "impossible sans ramener les deux valeurs au même multiple. C’est la règle la plus souvent " +
          "oubliée."),
        h('li', {},
          h('strong', { text: 'Multiplications : ' }),
          "les exposants s’additionnent. ",
          h('span', { class: 'mono', text: '10⁹ × 10⁶ = 10¹⁵' }),
          "."),
        h('li', {},
          h('strong', { text: 'Divisions : ' }),
          "les exposants se soustraient. Un exposant change de signe en passant de part et d’autre du " +
          "trait de fraction : ",
          h('span', { class: 'mono', text: '1 / 10³ = 10⁻³' }),
          "."),
        h('li', {},
          h('strong', { text: 'Carré : ' }),
          "l’exposant est multiplié par deux. ",
          h('span', { class: 'mono', text: '(10⁻³)² = 10⁻⁶' }),
          "."),
        h('li', {},
          h('strong', { text: 'Racine carrée : ' }),
          "l’exposant est divisé par deux, ce qui suppose qu’il soit pair. ",
          h('span', { class: 'mono', text: '√(10⁶) = 10³' }),
          "."),
      ),
      h('p', { class: 'prose__note' },
        "Rappel utile : ",
        h('span', { class: 'mono', text: '10⁰ = 1' }),
        ". Et les symboles des multiples s’écrivent en majuscule à partir du méga, en minuscule en " +
        "dessous — d’où la différence entre M pour méga et m pour milli, qui coûte douze ordres de " +
        "grandeur."),

      h('h2', { text: 'La calculette' }),
      h('p', {},
        "Une calculette de type collège suffit, et elle est autorisée à condition de ne pas être " +
        "programmable. Repérez avant l’épreuve les touches qui ne servent pas tous les jours."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {}, h('strong', { text: 'Exposant de dix ' }), '— marquée ×10ˣ, Exp ou E.'),
        h('li', {}, h('strong', { text: 'Inversion de signe ' }), '— marquée +/−, pour saisir les exposants négatifs.'),
        h('li', {}, h('strong', { text: 'Racine carrée, carré, inverse ' }), '— √, x², et 1/x.'),
        h('li', {}, h('strong', { text: 'π ' }), '— souvent en fonction seconde.'),
        h('li', {}, h('strong', { text: 'Logarithme décimal ' }), '— log, pour les décibels hors table.'),
        h('li', {}, h('strong', { text: 'Arc tangente ' }), '— tan⁻¹, pour les angles de déphasage.'),
      ),
      h('p', { class: 'field__hint' },
        "Beaucoup de ces fonctions se trouvent au-dessus de la touche plutôt que dessus, et demandent " +
        "un appui préalable sur la touche de seconde fonction. Le jour de l’épreuve n’est pas le moment " +
        "de le découvrir."),
    ),

    h(
      'section',
      { class: 'card card--accent' },
      h('h2', { class: 'card__title', text: 'Ce qu’il faut noter sur le brouillon' }),
      h('p', {},
        "Vous disposez d’environ cinq minutes avant de déclencher le chronomètre. Employez-les à écrire " +
        "ce que vous ne voulez pas avoir à retrouver sous pression."),
      h(
        'ol',
        { class: 'steps' },
        h('li', {}, "La table des multiples, du giga au pico, avec un grand trait sous chacun."),
        h('li', {}, "Les quatre triangles de la loi d’Ohm."),
        h('li', {}, "Les neuf rapports en décibels."),
        h('li', {}, "Le code des couleurs, si vous n’êtes pas sûr de le retenir."),
      ),
      h(
        'div',
        { class: 'actions' },
        h('a', { class: 'btn', href: '#/licence/ohm', text: 'Les triangles de la loi d’Ohm' }),
        h('a', { class: 'btn', href: '#/licence/decibels', text: 'Les neuf rapports' }),
      ),
    ),
  );

  return { element };
}
