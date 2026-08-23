/**
 * Page « Amplificateurs, oscillateurs et mélangeurs ».
 *
 * Les trois fonctions qui, assemblées, font un poste : amplifier, produire une
 * fréquence, en combiner deux. Le calculateur de mélangeur fonctionne dans les
 * deux sens parce que l'examen pose les deux questions, et que la formule du
 * retour n'est pas celle qu'on devine.
 */

import { h, setChildren } from '../ui/dom.ts';
import { mixerInputs, mixerOutputs, quartzFrequency, quartzThickness } from '../core/radio-math.ts';
import { AMP_CLASSES, OSCILLATORS } from '../data/actives.ts';
import { num } from '../ui/units.ts';
import type { View, ViewContext } from '../ui/router.ts';

export function licenceStagesView(_context: ViewContext): View {
  // --- Mélangeur ---

  const mixOut = h('div', { class: 'converter__result' });
  const mixDirection = h(
    'select',
    { class: 'select', attrs: { 'aria-label': 'Sens du calcul' }, on: { change: () => computeMix() } },
    h('option', { value: 'forward', text: 'Deux entrées → deux sorties' }),
    h('option', { value: 'reverse', text: 'Deux sorties → deux entrées' }),
  );
  const mixA = h('input', {
    class: 'input', type: 'number', value: '5',
    attrs: { step: 'any', min: '0', 'aria-label': 'Première fréquence en mégahertz' },
    on: { input: () => computeMix() },
  });
  const mixB = h('input', {
    class: 'input', type: 'number', value: '8',
    attrs: { step: 'any', min: '0', 'aria-label': 'Seconde fréquence en mégahertz' },
    on: { input: () => computeMix() },
  });

  const computeMix = (): void => {
    const a = Number(mixA.value);
    const b = Number(mixB.value);
    if (![a, b].every(Number.isFinite) || a <= 0 || b <= 0) {
      setChildren(mixOut, [h('span', { class: 'prose__note', text: 'Entrez deux fréquences.' })]);
      return;
    }
    if (mixDirection.value === 'forward') {
      const { sum, difference } = mixerOutputs(a, b);
      setChildren(mixOut, [
        h('div', { class: 'converter__line converter__line--result' },
          h('span', { class: 'converter__label', text: 'Somme — f1 + f2' }),
          h('strong', { text: `${num(sum)} MHz` })),
        h('div', { class: 'converter__line converter__line--result' },
          h('span', { class: 'converter__label', text: 'Différence — f1 − f2' }),
          h('strong', { text: `${num(difference)} MHz` })),
        h('p', { class: 'field__hint' },
          "Les deux sortent du mélangeur en même temps. Un filtre en aval — un circuit bouchon accordé — " +
          "sélectionne celle qu’on veut garder."),
      ]);
      return;
    }
    const fmax = Math.max(a, b);
    const fmin = Math.min(a, b);
    const { sum: f1, difference: f2 } = mixerInputs(fmax, fmin);
    setChildren(mixOut, [
      h('div', { class: 'converter__line converter__line--result' },
        h('span', { class: 'converter__label', text: 'Première entrée — (fmax − fmin) / 2' }),
        h('strong', { text: `${num(f1)} MHz` })),
      h('div', { class: 'converter__line converter__line--result' },
        h('span', { class: 'converter__label', text: 'Seconde entrée — fmax − f1' }),
        h('strong', { text: `${num(f2)} MHz` })),
      h('p', { class: 'field__hint' },
        "La formule du retour n’est pas symétrique : la première entrée est la demi-différence des " +
        "sorties, la seconde le complément. C’est une question d’examen à part entière."),
    ]);
  };

  computeMix();

  // --- Quartz ---

  const quartzOut = h('div', { class: 'converter__result' });
  const quartzMode = h(
    'select',
    { class: 'select', attrs: { 'aria-label': 'Grandeur connue' }, on: { change: () => computeQuartz() } },
    h('option', { value: 'thickness', text: 'une épaisseur (mm)' }),
    h('option', { value: 'frequency', text: 'une fréquence (MHz)' }),
  );
  const quartzInput = h('input', {
    class: 'input', type: 'number', value: '0.3',
    attrs: { step: 'any', min: '0', 'aria-label': 'Valeur du quartz' },
    on: { input: () => computeQuartz() },
  });

  const computeQuartz = (): void => {
    const value = Number(quartzInput.value);
    if (!Number.isFinite(value) || value <= 0) {
      setChildren(quartzOut, [h('span', { class: 'prose__note', text: 'Entrez une valeur.' })]);
      return;
    }
    const fromThickness = quartzMode.value === 'thickness';
    setChildren(quartzOut, [
      h('div', { class: 'converter__line converter__line--result' },
        h('span', { class: 'converter__label', text: fromThickness ? 'Fréquence de résonance' : 'Épaisseur de la lame' }),
        h('strong', { text: fromThickness ? `${num(quartzFrequency(value))} MHz` : `${num(quartzThickness(value))} mm` })),
    ]);
  };

  computeQuartz();

  const element = h(
    'div',
    { class: 'stack' },

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__lead' },
        "Trois fonctions suffisent à construire un poste : amplifier un signal, produire une fréquence " +
        "stable, et combiner deux fréquences pour en obtenir une troisième. Tout le reste n’est " +
        "qu’assemblage, et c’est l’objet du chapitre suivant."),

      h('h2', { text: 'Les classes d’amplification' }),
      h('p', {},
        "Ce qui distingue les classes, c’est la tension de repos de l’étage en l’absence de signal, " +
        "comparée à sa plage de fonctionnement linéaire. Plus le repos est bas, meilleur est le " +
        "rendement — et plus grande est la distorsion."),
      h('p', {},
        "Ce compromis se chiffre. En ",
        h('strong', { text: 'classe A' }),
        ", le transistor conduit en permanence et dissipe autant qu’il transmet : le rendement " +
        "théorique plafonne à ",
        h('strong', { text: '50 %' }),
        ", et tombe bien plus bas en pratique. La ",
        h('strong', { text: 'classe B' }),
        " atteint ",
        h('strong', { text: '78 %' }),
        " puisque chaque transistor se repose une alternance sur deux, la classe C dépasse 80 %, et " +
        "la classe D, qui ne fait que commuter, s’en approche encore davantage."),
      h('p', { class: 'prose__note' },
        "Un amplificateur de 100 W en classe A consomme donc au moins 200 W et doit évacuer les cent " +
        "watts restants en chaleur. C’est ce qui explique la taille des radiateurs, et pourquoi les " +
        "étages de puissance travaillent en classe AB plutôt qu’en classe A."),
    ),

    h(
      'div',
      { class: 'lexicon' },
      ...AMP_CLASSES.map((klass) =>
        h(
          'details',
          { class: 'lexicon__group' },
          h('summary', { class: 'lexicon__summary' },
            h('span', { class: 'lexicon__title', text: klass.name }),
            h('span', { class: 'lexicon__count', text: klass.conduction })),
          h('p', { class: 'lexicon__description', text: `Repos : ${klass.bias}. ${klass.use}` }),
          klass.warning ? h('p', { class: 'field__hint is-warn', text: klass.warning }) : null,
        ),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__note' },
        "Le point à retenir absolument : la classe C est ",
        h('strong', { text: 'incompatible avec l’AM et la BLU' }),
        ", qui portent l’information dans l’amplitude — précisément ce que la classe C écrête. Elle " +
        "convient en revanche parfaitement à la CW et à la FM, où l’amplitude ne porte rien."),

      h('h3', { text: 'La résistance de charge' }),
      h('p', {},
        "En classe A, c’est elle qui convertit les variations de courant du collecteur en variations de " +
        "tension exploitables. Elle détermine la ",
        h('strong', { text: 'droite de charge' }),
        " de l’amplificateur, dont la pente est négative : quand le courant de base augmente, la tension " +
        "de sortie baisse — d’où le déphasage de 180° du montage en émetteur commun."),
      h('p', {},
        "Deux limites bornent le fonctionnement utile. La ",
        h('strong', { text: 'saturation' }),
        ", ou point de compression, au-delà de laquelle l’amplificateur n’est plus linéaire et ajoute de " +
        "la distorsion. Et la ",
        h('strong', { text: 'courbe de surchauffe' }),
        " donnée par le constructeur : au-delà, la chaleur dégagée détruit le transistor."),

      h('h3', { text: 'Relier les étages' }),
      h('p', {},
        "Un ",
        h('strong', { text: 'étage' }),
        " est un circuit qui remplit une fonction. Quatre manières de les enchaîner."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {}, h('strong', { text: 'En direct — ' }), "collecteur sur base. Peu employé, à cause des niveaux de tension."),
        h('li', {}, h('strong', { text: 'Par diodes — ' }), "en série, pour décaler les niveaux en continu."),
        h('li', {}, h('strong', { text: 'Par condensateur — ' }), "en série, il ne laisse passer que l’alternatif."),
        h('li', {}, h('strong', { text: 'Par transformateur — ' }), "en alternatif, quand il faut aussi adapter les impédances."),
      ),
      h('p', { class: 'field__hint' },
        "Un étage ",
        h('strong', { text: 'séparateur' }),
        " — ou tampon — s’intercale parfois pour adapter niveaux et impédances sans rien faire d’autre. " +
        "Il ne figure souvent pas sur les synoptiques, parce qu’il n’appartient pas à la logique de " +
        "l’ensemble."),

      h('h3', { text: 'L’amplificateur haute fréquence' }),
      h('p', {},
        "Deux composants le caractérisent, et leur rôle est le même vu de deux côtés : empêcher la haute " +
        "fréquence de remonter dans la ligne d’alimentation. Le ",
        h('strong', { text: 'condensateur de découplage' }),
        " la court-circuite vers la masse ; la ",
        h('strong', { text: 'bobine de choc' }),
        ", en série au point d’alimentation, lui barre la route — puisque son impédance croît avec la " +
        "fréquence."),
    ),

    // --- Oscillateurs ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Produire une fréquence' }),
      h('p', {},
        "Un oscillateur est un amplificateur dont on réinjecte une partie de la sortie sur l’entrée, ",
        h('strong', { text: 'en phase' }),
        ". Le circuit s’entretient alors lui-même sur sa fréquence d’accord."),
    ),

    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        { class: 'data-table' },
        h('thead', {}, h('tr', {},
          h('th', { attrs: { scope: 'col' }, text: 'Sigle' }),
          h('th', { attrs: { scope: 'col' }, text: 'Nom' }),
          h('th', { attrs: { scope: 'col' }, text: 'Comment la fréquence est fixée' }))),
        h('tbody', {}, ...OSCILLATORS.map((osc) =>
          h('tr', {},
            h('th', { attrs: { scope: 'row' }, class: 'mono', text: osc.code }),
            h('td', { text: osc.name }),
            h('td', { text: osc.control })))),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', {},
        "Trois facteurs dégradent la ",
        h('strong', { text: 'stabilité' }),
        " d’un oscillateur, et ce sont eux que l’examen interroge : les variations de la tension " +
        "d’alimentation, les variations de température des composants, et les défauts de blindage — le " +
        "fameux effet de main, où approcher la main du montage en change la fréquence."),

      h('h3', { text: 'Le quartz' }),
      h('p', {},
        "Une lame de silice taillée, coincée entre deux électrodes. Elle est ",
        h('strong', { text: 'piézoélectrique' }),
        " : une pression y fait apparaître des charges, et réciproquement une tension la déforme. Quand " +
        "la fréquence appliquée coïncide avec sa fréquence propre — liée à ses dimensions — elle entre " +
        "en résonance."),
      h('p', { class: 'formula', text: 'f(MHz) = 5,7 / (2 × e(mm))' }),
      h('p', { class: 'field__hint' },
        "Le 5,7 est la vitesse de propagation du son dans le quartz, en kilomètres par seconde. Le " +
        "facteur 2 vient du trajet aller-retour de l’onde dans l’épaisseur de la lame : elle résonne en " +
        "demi-onde, exactement comme un dipôle."),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Dimensionner un quartz' }),
      h('div', { class: 'toolbar' },
        h('span', { class: 'converter__label', text: 'À partir d’' }),
        quartzMode,
        quartzInput),
      quartzOut,
      h('p', { class: 'field__hint' },
        "Une lame de 0,3 mm résonne sur 9,5 MHz. Plus la lame est fine, plus la fréquence est haute — et " +
        "plus le quartz est fragile."),
    ),

    // --- Mélangeurs ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Multiplier et mélanger' }),
      h('p', {},
        "Un ",
        h('strong', { text: 'multiplicateur de fréquence' }),
        " est un amplificateur en classe C dont le filtre de sortie est accordé sur un harmonique de " +
        "l’entrée. Sa non-linéarité, qui serait un défaut ailleurs, est ici la raison d’être du montage. " +
        "On multiplie par 2, 3 ou 5 au maximum ; pour multiplier par 9, on met deux triplicateurs en " +
        "série. Toujours par un nombre entier."),
      h('p', { class: 'prose__note' },
        "Le spectre est modifié au passage. Un signal FM d’excursion 3 kHz ressort d’un doubleur avec " +
        "6 kHz d’excursion, et reste exploitable. Un signal AM ou BLU, lui, devient inexploitable : la " +
        "classe C n’amplifie que les crêtes."),
      h('p', {},
        "Un ",
        h('strong', { text: 'mélangeur' }),
        " est tout autre chose : c’est un multiplicateur de tension. Deux fréquences à l’entrée, et à la " +
        "sortie leur ",
        h('strong', { text: 'somme' }),

      h('p', {},
        "Le montage le plus répandu est le ",
        h('strong', { text: 'mélangeur en anneau' }),
        ", ou double équilibré : quatre diodes Schottky montées en boucle, entre deux transformateurs " +
        "à point milieu. Son intérêt est d’équilibrer les deux entrées, de sorte que ni le signal ni " +
        "l’oscillateur local ne se retrouvent en sortie — il ne reste que la somme et la différence, " +
        "ce qui simplifie beaucoup le filtrage qui suit."),
        " et leur ",
        h('strong', { text: 'différence' }),
        ". Elles ne s’additionnent pas — elles se multiplient, et c’est la distorsion quadratique du " +
        "circuit qui produit ce mélange."),
      h('p', { class: 'formula', text: 'sin(A) × sin(B) = ½ [sin(A + B) + sin(A − B)]' }),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Calculer un mélange' }),
      h('div', { class: 'toolbar' }, mixDirection),
      h('div', { class: 'toolbar' },
        mixA,
        h('span', { class: 'converter__label', text: 'MHz et' }),
        mixB,
        h('span', { class: 'converter__label', text: 'MHz' })),
      mixOut,
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', {},
        "Un mélangeur réel produit davantage que la somme et la différence. Il laisse aussi passer les " +
        "fréquences d’entrée et leurs harmoniques — distorsions harmoniques — ainsi que des combinaisons " +
        "du troisième ordre comme ",
        h('span', { class: 'mono', text: '2f1 − f2' }),
        ". Ce sont les mêmes produits d’intermodulation que ceux vus au chapitre du brouillage, et le " +
        "circuit bouchon de sortie ne suffit pas toujours à les éliminer."),
      h('p', {},
        "Pour aller plus loin : ",
        h('a', { href: '#/licence/securite', text: 'intermodulation et transmodulation' }),
        ", et ",
        h('a', { href: '#/licence/circuits', text: 'les circuits accordés' }),
        " qui servent de filtres de sortie."),
    ),

    h(
      'section',
      { class: 'card card--accent' },
      h('h2', { class: 'card__title', text: 'À retenir de ce chapitre' }),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {}, "Classe A linéaire et gourmande, classe C efficace et distordante — jamais en AM ni en BLU."),
        h('li', {}, "Découplage et bobine de choc empêchent la HF de remonter dans l’alimentation."),
        h('li', {}, "Un oscillateur réinjecte en phase ; sa stabilité tient à l’alimentation, à la température et au blindage."),
        h('li', {}, "Un multiplicateur donne un harmonique entier ; un mélangeur donne la somme et la différence."),
        h('li', {}, "Retour du mélangeur : f1 = (fmax − fmin) / 2, puis f2 = fmax − f1."),
      ),
    ),
  );

  return { element };
}
