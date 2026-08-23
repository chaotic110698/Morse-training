/**
 * Page « Transformateurs, piles et mesures ».
 *
 * Trois sujets réunis par leur position dans le programme, et par le fait
 * qu'ils reposent tous sur ce qui précède : le transformateur est un cas de
 * bobines couplées, les instruments de mesure sont des groupements de
 * résistances autour d'un galvanomètre. Le calculateur de transformateur
 * expose le carré des impédances, qui est ce que l'examen vérifie vraiment.
 */

import { h, setChildren } from '../ui/dom.ts';
import { efficiency, transformer } from '../core/radio-math.ts';
import { CELLS } from '../data/components.ts';
import { formatOhms as ohms, num } from '../ui/units.ts';
import type { View, ViewContext } from '../ui/router.ts';

export function licenceTransformersView(_context: ViewContext): View {
  // --- Transformateur ---

  const out = h('div', { class: 'converter__result' });

  const numeric = (initial: string, label: string): HTMLInputElement =>
    h('input', {
      class: 'input',
      type: 'number',
      value: initial,
      attrs: { step: 'any', min: '0', 'aria-label': label },
      on: { input: () => compute() },
    });

  const np = numeric('80', 'Spires au primaire');
  const ns = numeric('40', 'Spires au secondaire');
  const up = numeric('200', 'Tension au primaire en volts');
  const ip = numeric('1', 'Intensité au primaire en ampères');
  const zs = numeric('200', 'Charge au secondaire en ohms');

  const compute = (): void => {
    const result = transformer(Number(np.value), Number(ns.value), Number(up.value), Number(ip.value), Number(zs.value));
    if (!result) {
      setChildren(out, [h('span', { class: 'prose__note', text: 'Renseignez les nombres de spires.' })]);
      return;
    }
    const raising = result.n > 1;
    setChildren(out, [
      h('div', { class: 'converter__line converter__line--result' },
        h('span', { class: 'converter__label', text: 'Rapport de transformation N = ns / np' }),
        h('strong', { text: num(result.n) })),
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Tension au secondaire — × N' }),
        h('strong', { text: `${num(result.secondaryVoltage)} V` })),
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Intensité au secondaire — ÷ N' }),
        h('strong', { text: `${num(result.secondaryCurrent)} A` })),
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Impédance vue du primaire — ÷ N²' }),
        h('strong', { text: ohms(result.primaryImpedance) })),
      h('p', { class: 'field__hint' },
        result.n === 1
          ? "Rapport de 1 : c’est un transformateur d’isolement. Il ne change ni la tension ni l’impédance, il sépare électriquement les deux circuits."
          : raising
            ? "N supérieur à 1 : transformateur élévateur. Il monte la tension et abaisse l’intensité."
            : "N inférieur à 1 : transformateur abaisseur. Il baisse la tension et monte l’intensité."),
    ]);
  };

  compute();

  // --- Qualité d'un voltmètre ---

  const qualityOut = h('div', { class: 'converter__result' });
  const igInput = h('input', {
    class: 'input', type: 'number', value: '20',
    attrs: { step: 'any', min: '0', 'aria-label': 'Intensité de déviation maximale en microampères' },
    on: { input: () => computeQuality() },
  });
  const rangeInput = h('input', {
    class: 'input', type: 'number', value: '10',
    attrs: { step: 'any', min: '0', 'aria-label': 'Calibre en volts' },
    on: { input: () => computeQuality() },
  });
  const riInput = h('input', {
    class: 'input', type: 'number', value: '10',
    attrs: { step: 'any', min: '0', 'aria-label': 'Résistance interne en ohms' },
    on: { input: () => computeQuality() },
  });

  const computeQuality = (): void => {
    const ig = Number(igInput.value) * 1e-6;
    const range = Number(rangeInput.value);
    const ri = Number(riInput.value);
    if (![ig, range, ri].every(Number.isFinite) || ig <= 0 || range <= 0) {
      setChildren(qualityOut, [h('span', { class: 'prose__note', text: 'Complétez les trois champs.' })]);
      return;
    }
    const quality = 1 / ig;
    const total = range / ig;
    const series = total - ri;
    setChildren(qualityOut, [
      h('div', { class: 'converter__line converter__line--result' },
        h('span', { class: 'converter__label', text: 'Qualité Q = 1 / Ig' }),
        h('strong', { text: `${num(quality / 1000)} kΩ/V` })),
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Résistance à monter en série' }),
        h('strong', { text: ohms(series) })),
      h('p', { class: 'field__hint' },
        quality >= 20000
          ? "Au-delà de 20 000 Ω/V, l’appareil est considéré comme bon : il perturbe peu le circuit qu’il mesure."
          : "En dessous de 20 000 Ω/V, l’appareil consomme trop et fausse la mesure du circuit sur lequel il est branché."),
    ]);
  };

  computeQuality();

  const element = h(
    'div',
    { class: 'stack' },

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__lead' },
        "Trois sujets qui ne demandent aucune notion nouvelle : le transformateur n’est qu’un cas de " +
        "bobines couplées, et les instruments de mesure sont des groupements de résistances autour d’un " +
        "seul composant sensible. Tout se déduit des deux chapitres précédents."),

      h('h2', { text: 'Le transformateur' }),
      h('p', {},
        "Deux enroulements au moins, bobinés autour d’un même circuit magnétique. La puissance appliquée " +
        "au ",
        h('strong', { text: 'primaire' }),
        " se retrouve au ",
        h('strong', { text: 'secondaire' }),
        ". Il ne transforme que des courants alternatifs — un courant continu ne produit aucun flux " +
        "variable, donc rien ne passe."),
      h('p', {},
        "Le circuit magnétique change avec la fréquence : un empilement de tôles minces en basse " +
        "fréquence, de la ferrite en haute fréquence, et rien du tout — de l’air — aux fréquences les " +
        "plus élevées."),
      h('p', {},
        "Tout part du ",
        h('strong', { text: 'rapport de transformation' }),
        " :"),
      h('p', { class: 'formula', text: 'N = ns / np' }),
      h('p', {},
        "Les tensions suivent ce rapport, les intensités son inverse, et les impédances ",
        h('strong', { text: 'son carré' }),
        ". C’est ce carré que l’examen vérifie le plus souvent, et qu’on oublie le plus facilement."),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Calculer un transformateur' }),
      h('p', { class: 'card__hint' },
        "L’exemple chargé est celui du cours : 80 spires au primaire, 40 au secondaire, une charge de " +
        "200 Ω — l’impédance vue du primaire vaut 800 Ω."),
      h(
        'div',
        { class: 'ohm-fields' },
        h('label', { class: 'ohm-field' }, h('span', { text: 'np (spires)' }), np),
        h('label', { class: 'ohm-field' }, h('span', { text: 'ns (spires)' }), ns),
        h('label', { class: 'ohm-field' }, h('span', { text: 'Up (V)' }), up),
        h('label', { class: 'ohm-field' }, h('span', { text: 'Ip (A)' }), ip),
        h('label', { class: 'ohm-field' }, h('span', { text: 'Zs (Ω)' }), zs),
      ),
      out,
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__note' },
        "La puissance disponible au secondaire s’exprime en ",
        h('strong', { text: 'volt-ampères' }),
        " et non en watts : c’est une puissance disponible, pas une puissance consommée. La nuance " +
        "revient dans les questions."),

      h('h3', { text: 'Le transformateur réel' }),
      h('p', {},
        "Un transformateur parfait aurait un rendement de 100 %. En pratique, 80 % est courant pour un " +
        "transformateur d’alimentation, et le rendement est optimal à la puissance conseillée par le " +
        "constructeur — moins bon en dessous comme au-dessus."),
      h('p', {},
        "Les pertes viennent surtout des ",
        h('strong', { text: 'courants de Foucault' }),
        " : le flux alternatif induit un courant non seulement dans le secondaire mais aussi dans la " +
        "tôle du circuit magnétique, qui chauffe. On les limite en feuilletant le circuit et en " +
        "vernissant chaque tôle. Ces pertes croissent avec le ",
        h('strong', { text: 'carré de la fréquence' }),
        ", ce qui explique que les tôles s’amincissent quand la fréquence monte, puis cèdent la place à " +
        "la ferrite."),
      h('p', { class: 'field__hint' },
        `Un transformateur qui délivre 30 W pour 50 W consommés a un rendement de ` +
        `${num(efficiency(30, 50))} %. En usage normal, le rendement pèse plus sur l’intensité que sur ` +
        "la tension ; près de la puissance maximale admise, la tension du secondaire peut chuter de 5 %."),
      h('p', {},
        "Deux cas particuliers. L’",
        h('strong', { text: 'autotransformateur' }),
        " a primaire et secondaire bobinés sur le même enroulement : il n’assure pas d’isolation " +
        "galvanique. Le ",
        h('strong', { text: 'transformateur d’isolement' }),
        " a autant de spires des deux côtés — N = 1 — et ne sert qu’à séparer électriquement les deux " +
        "circuits."),
    ),

    // --- Piles ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Piles et accumulateurs' }),
      h('p', {},
        "Des réserves de courant continu, qui accumulent l’électricité par réaction chimique. La " +
        "différence tient en un mot : seul l’",
        h('strong', { text: 'accumulateur' }),
        " est rechargeable. Une pile est toujours une source ; un accumulateur est une source ou une " +
        "charge selon qu’on le décharge ou qu’on le recharge."),
      h('p', {},
        "Trois caractéristiques la décrivent : sa ",
        h('strong', { text: 'force électromotrice' }),
        " — la tension à vide, déterminée par le couple électrochimique — sa ",
        h('strong', { text: 'résistance interne' }),
        ", et sa ",
        h('strong', { text: 'capacité' }),
        " en ampères-heures."),
    ),

    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        { class: 'data-table' },
        h('thead', {}, h('tr', {},
          h('th', { attrs: { scope: 'col' }, text: 'Couple' }),
          h('th', { attrs: { scope: 'col' }, text: 'Tension par élément' }),
          h('th', { attrs: { scope: 'col' }, text: 'Rechargeable' }))),
        h('tbody', {}, ...CELLS.map((cell) =>
          h('tr', {},
            h('th', { attrs: { scope: 'row' }, text: cell.couple }),
            h('td', { class: 'num', text: `${num(cell.volts)} V` }),
            h('td', { text: cell.rechargeable ? 'Oui — accumulateur' : 'Non — pile' })))),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'field__hint' },
        "Sur un schéma, l’électrode positive est le trait le plus long, la négative le trait court et " +
        "gras. Attention à ne pas confondre avec le condensateur électrochimique, où la carcasse — le " +
        "grand trait en U — est reliée au négatif."),

      h('h2', { text: 'Mesurer' }),
      h('p', {},
        "Tout part du ",
        h('strong', { text: 'galvanomètre' }),
        " à cadre mobile : un aimant fixe, une bobine montée sur un cadre que le champ fait tourner " +
        "contre un ressort, et une aiguille. Il ne mesure qu’une intensité, et une intensité faible — " +
        "de l’ordre du milliampère ou moins."),
      h('p', {},
        "Deux caractéristiques le définissent : son ",
        h('strong', { text: 'intensité de déviation maximale' }),
        " (Ig) et sa ",
        h('strong', { text: 'résistance interne' }),
        " (Ri). Tout le reste s’obtient en lui adjoignant une résistance."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'Voltmètre : ' }),
          "une résistance ",
          h('strong', { text: 'en série' }),
          ", qui absorbe la tension que le galvanomètre ne peut pas encaisser. Le voltmètre se branche " +
          "en dérivation sur le circuit."),
        h('li', {},
          h('strong', { text: 'Ampèremètre : ' }),
          "une résistance ",
          h('strong', { text: 'en parallèle' }),
          " — un shunt — qui dérive l’excès de courant. L’ampèremètre s’insère dans le circuit."),
        h('li', {},
          h('strong', { text: 'Ohmmètre : ' }),
          "un ampèremètre et une pile. La graduation est inversée, car une résistance nulle laisse " +
          "passer le courant maximal : le zéro est du côté de la pleine déviation, et l’infini du côté " +
          "où les valeurs se serrent."),
        h('li', {},
          h('strong', { text: 'Wattmètre : ' }),
          "un voltmètre gradué en puissance sous une impédance donnée. Comme P = U²/R, le milieu du " +
          "cadran ne représente pas la moitié de la puissance de calibre mais son quart."),
      ),
      h('p', { class: 'prose__note' },
        "Un galvanomètre ne lit que des valeurs moyennes — nulles en alternatif. Pour lire des valeurs " +
        "efficaces ou crête, il faut redresser le signal avec une diode en série et adapter l’échelle."),

      h('h3', { text: 'La qualité d’un voltmètre' }),
      h('p', {},
        "Brancher un voltmètre ne doit pas perturber le circuit mesuré. Sa qualité se mesure en ohms " +
        "par volt : la résistance totale divisée par le calibre. Elle ne dépend que de la sensibilité du " +
        "galvanomètre, et reste donc la même quel que soit le calibre choisi."),
      h('p', { class: 'formula', text: 'Q(Ω/V) = R totale / calibre = 1 / Ig' }),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Dimensionner un voltmètre' }),
      h('div', { class: 'toolbar' },
        h('span', { class: 'converter__label', text: 'Galvanomètre de' }),
        igInput,
        h('span', { class: 'converter__label', text: 'µA,' }),
        riInput,
        h('span', { class: 'converter__label', text: 'Ω internes, calibré sur' }),
        rangeInput,
        h('span', { class: 'converter__label', text: 'V' })),
      qualityOut,
      h('p', { class: 'field__hint' },
        "Un bon voltmètre atteint au moins 20 000 Ω/V, ce qui correspond à un galvanomètre de 50 µA. " +
        "Pour un ampèremètre, c’est la résistance interne qui compte : plus elle est faible, mieux " +
        "c’est. Cette notion a perdu de son actualité — un voltmètre numérique présente une résistance " +
        "constante et très élevée, souvent 100 MΩ."),
    ),

    // --- Transducteurs ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Microphones, haut-parleurs et relais' }),
      h('p', {},
        "Les basses fréquences couvrent de 0 à 20 000 Hz ; l’oreille humaine entend de 100 à 15 000 Hz ; " +
        "et 300 à 3000 Hz suffisent largement à comprendre une voix en téléphonie. C’est pourquoi les " +
        "filtres des postes de trafic s’arrêtent là."),
      h('p', {},
        "Le microphone et le haut-parleur sont des ",
        h('strong', { text: 'transducteurs' }),
        " : ils convertissent l’acoustique en électrique et réciproquement. Les principaux types de " +
        "microphones, par impédance décroissante : l’électret, assimilable à un condensateur polarisé " +
        "dont l’épaisseur du diélectrique varie ; le céramique, piézoélectrique ; puis les modèles " +
        "dynamiques, à bobine mobile, de faible impédance."),
      h('p', {},
        "Un ",
        h('strong', { text: 'relais électromécanique' }),
        " est une bobine qui, parcourue par un courant, attire une palette et ferme un contact. C’est " +
        "l’ancêtre du commutateur, et il sert encore à basculer une antenne de la réception vers " +
        "l’émission."),
    ),

    h(
      'section',
      { class: 'card card--accent' },
      h('h2', { class: 'card__title', text: 'À retenir de ce chapitre' }),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {}, "N = ns / np. Tensions × N, intensités ÷ N, impédances ÷ N²."),
        h('li', {}, "Un transformateur ne transforme que de l’alternatif."),
        h('li', {}, "Les pertes par courants de Foucault croissent avec le carré de la fréquence."),
        h('li', {}, "Voltmètre : résistance en série, branché en dérivation. Ampèremètre : shunt en parallèle, inséré dans le circuit."),
        h('li', {}, "Q = 1 / Ig, et un bon voltmètre dépasse 20 000 Ω/V."),
      ),
    ),
  );

  return { element };
}
