/**
 * Page « Les modulations ».
 *
 * Le dernier chapitre du programme, et le plus proche du sujet de ce site :
 * la CW y est décrite pour ce qu'elle est, une modulation d'amplitude réduite
 * à sa plus simple expression. La répartition de puissance en AM est
 * calculée plutôt qu'affirmée, parce que c'est l'argument chiffré qui explique
 * pourquoi la BLU a remplacé l'AM et pourquoi la CW les bat toutes deux.
 */

import { h, setChildren } from '../ui/dom.ts';
import { amPowerShare, bitRate, fmBandwidth } from '../core/radio-math.ts';
import { num } from '../ui/units.ts';
import type { View, ViewContext } from '../ui/router.ts';

interface Modulation {
  code: string;
  name: string;
  altered: string;
  width: string;
  note: string;
}

const MODULATIONS: Modulation[] = [
  {
    code: 'A1A',
    name: 'CW — télégraphie',
    altered: 'Amplitude, tout ou rien',
    width: 'Une centaine de hertz',
    note: "La modulation d’amplitude réduite à sa plus simple expression : la porteuse est présente ou absente. Sa finesse spectrale explique qu’elle passe là où rien d’autre ne passe.",
  },
  {
    code: 'A3E',
    name: 'AM — modulation d’amplitude',
    altered: 'Amplitude',
    width: 'Deux fois la bande audio',
    note: "La plus simple à mettre en œuvre, et la première historiquement. Porteuse au centre, deux bandes latérales portant le même message. Presque abandonnée par les radioamateurs.",
  },
  {
    code: 'J3E',
    name: 'BLU — bande latérale unique',
    altered: 'Amplitude, porteuse et une bande supprimées',
    width: 'La bande audio, environ 2,4 kHz',
    note: "De l’AM dont on retire ce qui ne sert à rien. Le mode vocal standard en décamétriques.",
  },
  {
    code: 'F3E',
    name: 'FM — modulation de fréquence',
    altered: 'Fréquence',
    width: 'Deux fois l’excursion',
    note: "Insensible aux variations d’amplitude, donc aux parasites. Large, sans portée lointaine : le mode des relais VHF et UHF.",
  },
  {
    code: 'G3E',
    name: 'PM — modulation de phase',
    altered: 'Phase',
    width: 'Comparable à la FM',
    note: "Si proche de la FM que les démodulateurs sont les mêmes et que l’oreille ne fait pas la différence. Un ordinateur, si.",
  },
  {
    code: 'F2B / G2B',
    name: 'Modes numériques',
    altered: 'Fréquence ou phase, par sauts',
    width: 'De quelques dizaines de hertz à plusieurs kilohertz',
    note: "FSK saute entre deux fréquences, PSK entre deux phases ou davantage. La QAM combine amplitude et phase, jusqu’à 256 états.",
  },
];

export function licenceModulationsView(_context: ViewContext): View {
  // --- Répartition de puissance en AM ---

  const amOut = h('div', { class: 'converter__result' });
  const amInput = h('input', {
    class: 'input', type: 'number', value: '150',
    attrs: { step: 'any', min: '0', 'aria-label': 'Puissance émise en watts' },
    on: { input: () => computeAm() },
  });

  const computeAm = (): void => {
    const watts = Number(amInput.value);
    if (!Number.isFinite(watts) || watts <= 0) {
      setChildren(amOut, [h('span', { class: 'prose__note', text: 'Entrez une puissance.' })]);
      return;
    }
    const share = amPowerShare(watts);
    setChildren(amOut, [
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Porteuse — qui ne transporte rien' }),
        h('strong', { text: `${num(share.carrier)} W` })),
      h('div', { class: 'converter__line converter__line--result' },
        h('span', { class: 'converter__label', text: 'Chaque bande latérale' }),
        h('strong', { text: `${num(share.perSideband)} W` })),
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Total utile — les deux bandes' }),
        h('strong', { text: `${num(share.sidebands)} W` })),
      h('p', { class: 'field__hint' },
        `Les deux tiers de la puissance partent dans une porteuse qui ne dit rien, et le message est ` +
        `émis deux fois. En BLU, ces ${num(share.perSideband)} W deviendraient ${num(watts)} W dans ` +
        "l’unique bande conservée — soit 6 dB de mieux, à puissance d’émetteur égale."),
    ]);
  };

  computeAm();

  // --- Excursion FM ---

  const fmOut = h('strong', {});
  const fmInput = h('input', {
    class: 'input', type: 'number', value: '3',
    attrs: { step: 'any', min: '0', 'aria-label': 'Excursion en kilohertz' },
    on: { input: () => computeFm() },
  });

  const computeFm = (): void => {
    const khz = Number(fmInput.value);
    fmOut.textContent = Number.isFinite(khz) && khz > 0 ? `${num(fmBandwidth(khz))} kHz` : '—';
  };

  computeFm();

  // --- Débit binaire ---

  const rateOut = h('strong', {});
  const baudInput = h('input', {
    class: 'input', type: 'number', value: '1200',
    attrs: { step: 'any', min: '0', 'aria-label': 'Vitesse en bauds' },
    on: { input: () => computeRate() },
  });
  const statesSelect = h(
    'select',
    { class: 'select', attrs: { 'aria-label': 'Nombre d’états' }, on: { change: () => computeRate() } },
    h('option', { value: '2', text: '2 états — 2-PSK' }),
    h('option', { value: '4', text: '4 états — 4-PSK' }),
    h('option', { value: '16', text: '16 états — 16-QAM' }),
    h('option', { value: '256', text: '256 états — 256-QAM' }),
  );

  const computeRate = (): void => {
    const bauds = Number(baudInput.value);
    const states = Number(statesSelect.value);
    rateOut.textContent = Number.isFinite(bauds) && bauds > 0 ? `${num(bitRate(bauds, states))} bit/s` : '—';
  };

  computeRate();

  const element = h(
    'div',
    { class: 'stack' },

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__lead' },
        "Une porteuse seule ne transporte rien : c’est une sinusoïde qui se répète indéfiniment. Pour " +
        "y loger un message, il faut en modifier quelque chose — et une sinusoïde n’a que trois " +
        "grandeurs à offrir : son amplitude, sa fréquence, sa phase. Toutes les modulations qui existent " +
        "sortent de ces trois cases."),

      h('h2', { text: 'Trois grandeurs, trois familles' }),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'Moduler l’amplitude ' }),
          "donne l’AM, la BLU — et la CW, qui n’en est que le cas extrême."),
        h('li', {},
          h('strong', { text: 'Moduler la fréquence ou la phase ' }),
          "donne les modulations dites angulaires : FM et PM."),
        h('li', {},
          h('strong', { text: 'Combiner les deux ' }),
          "donne la QAM, qui multiplie le nombre d’états possibles."),
      ),
      h('p', { class: 'prose__note' },
        "Deux représentations servent à les décrire, et l’examen les distingue. L’",
        h('strong', { text: 'oscillogramme' }),
        " montre la tension en fonction du temps, ce qu’afficherait un oscilloscope. Le ",
        h('strong', { text: 'spectrogramme' }),
        " montre l’amplitude en fonction de la fréquence, ce qu’afficherait un analyseur de spectre."),
    ),

    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        { class: 'data-table' },
        h('thead', {}, h('tr', {},
          h('th', { attrs: { scope: 'col' }, text: 'Classe' }),
          h('th', { attrs: { scope: 'col' }, text: 'Mode' }),
          h('th', { attrs: { scope: 'col' }, text: 'Ce qui est modifié' }),
          h('th', { attrs: { scope: 'col' }, text: 'Largeur occupée' }))),
        h('tbody', {}, ...MODULATIONS.map((mod) =>
          h('tr', {},
            h('th', { attrs: { scope: 'row' }, class: 'mono', text: mod.code }),
            h('td', { text: mod.name }),
            h('td', { text: mod.altered }),
            h('td', { text: mod.width })))),
      ),
    ),

    h(
      'div',
      { class: 'lexicon' },
      ...MODULATIONS.map((mod) =>
        h(
          'details',
          { class: 'lexicon__group' },
          h('summary', { class: 'lexicon__summary' },
            h('span', { class: 'lexicon__title', text: mod.name }),
            h('span', { class: 'lexicon__count', text: mod.code })),
          h('p', { class: 'lexicon__description', text: mod.note }),
        ),
      ),
    ),

    // --- AM ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'La modulation d’amplitude' }),
      h('p', {},
        "Le niveau de haute fréquence suit celui de la basse fréquence : le message dessine une " +
        "enveloppe autour de la porteuse. Vue en fréquence, l’opération est un mélange — moduler, c’est " +
        "multiplier. On retrouve donc trois raies : la porteuse au centre, et deux ",
        h('strong', { text: 'bandes latérales' }),
        " à HF + BF et HF − BF."),
      h('p', {},
        "Or ces deux bandes portent exactement le même message, et la porteuse n’en porte aucun. Le " +
        "calcul de la répartition de puissance est l’argument décisif du chapitre."),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Où part la puissance en AM' }),
      h('p', { class: 'card__hint' },
        "À taux de modulation de 100 %, le meilleur cas possible."),
      h('div', { class: 'toolbar' },
        amInput,
        h('span', { class: 'converter__label', text: 'W émis' })),
      amOut,
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', {},
        "D’où la ",
        h('strong', { text: 'bande latérale unique' }),
        " : on supprime la porteuse, qui ne dit rien, et l’une des deux bandes, qui répète l’autre. " +
        "Toute la puissance part alors dans le seul signal utile, et la largeur occupée est divisée par " +
        "deux."),
      h('p', {},
        "Deux variantes selon la bande conservée. En ",
        h('strong', { text: 'BLS' }),
        " — bande latérale supérieure — le spectre audio est simplement translaté vers le haut. En ",
        h('strong', { text: 'BLI' }),
        ", il est ",
        h('strong', { text: 'inversé' }),
        " : il faut le retourner à la démodulation, faute de quoi le signal reste incompréhensible. " +
        "L’usage veut qu’on emploie la BLI en dessous de 10 MHz et la BLS au-dessus."),
      h('p', { class: 'prose__note' },
        "La BLU se produit avec un ",
        h('strong', { text: 'mélangeur équilibré' }),
        ", qui génère les deux bandes sans la porteuse, suivi d’un ",
        h('strong', { text: 'filtre à quartz' }),
        " qui ne garde que celle qu’on veut. Ce filtre doit être remarquablement raide : il faut " +
        "atténuer de 60 dB un signal distant de 400 Hz seulement."),
      h('p', { class: 'field__hint' },
        "Le ",
        h('strong', { text: 'générateur deux tons' }),
        " sert à vérifier la linéarité d’un émetteur BLU : deux signaux audio de même amplitude " +
        "produisent une enveloppe caractéristique, dont toute déformation trahit un écrêtement."),

      h('h2', { text: 'La modulation de fréquence' }),
      h('p', {},
        "Ici, c’est le nombre de périodes par unité de temps qui varie au rythme du message. L’",
        h('strong', { text: 'excursion' }),
        " — ou swing — est l’écart entre la fréquence centrale et une des deux extrêmes. La bande " +
        "occupée en est le double."),
      h('p', { class: 'formula', text: 'bande occupée = 2 × excursion' }),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Bande occupée en FM' }),
      h('div', { class: 'toolbar' },
        h('span', { class: 'converter__label', text: 'Excursion de' }),
        fmInput,
        h('span', { class: 'converter__label', text: 'kHz →' }),
        fmOut),
      h('p', { class: 'field__hint' },
        "Rappel du chapitre des multiplicateurs : un doubleur de fréquence double aussi l’excursion. Un " +
        "signal FM y survit, un signal AM ou BLU non."),
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', {},
        "La FM et la PM se démodulent par un ",
        h('strong', { text: 'discriminateur' }),
        ", qui transforme les variations de fréquence en variations de tension. Trois montages " +
        "existent : le détecteur de pente, qui exploite le flanc d’un filtre désaccordé ; le " +
        "discriminateur de Travis, plus linéaire, avec deux circuits accordés sur les extrêmes " +
        "d’excursion ; et le Foster-Seeley, qui exploite un déphasage."),
      h('p', { class: 'prose__note' },
        "Une propriété de la FM qui vaut d’être connue : quand deux signaux arrivent ensemble sur un " +
        "démodulateur FM, ",
        h('strong', { text: 'seul le plus fort est démodulé' }),
        ". En AM et en BLU, les deux ressortent mêlés. C’est l’effet de capture, et c’est ce qui rend " +
        "les relais FM si confortables — et si impitoyables."),
    ),

    // --- CW ---
    h(
      'article',
      { class: 'prose prose--tight' },
      h('h2', { text: 'La manipulation par coupure de porteuse' }),
      h('p', {},
        "La CW, pour ",
        h('em', { text: 'continuous waves' }),
        " — ondes entretenues. Le nom vient des années 1910, quand les émetteurs sont passés de " +
        "l’éclateur, qui produisait une onde amortie étalée sur toute une gamme, à l’oscillateur, qui " +
        "produit une onde pure et continue. C’est cette pureté qui a rendu la radio praticable."),
      h('p', {},
        "Techniquement, la CW est ",
        h('strong', { text: 'une modulation d’amplitude réduite à sa plus simple expression' }),
        " : la porteuse est présente ou absente, sans état intermédiaire. C’est une modulation numérique " +
        "à deux états, et elle est la plus ancienne de toutes."),
      h('p', {},
        "Cette simplicité a une conséquence spectrale décisive. Une centaine de hertz suffit à porter le " +
        "signal, contre 2400 pour la voix en BLU. Le récepteur peut donc filtrer vingt fois plus " +
        "étroitement — et un filtre vingt fois plus étroit laisse entrer vingt fois moins de bruit. " +
        "C’est là, et pas ailleurs, que se joue la légendaire portée de la télégraphie."),

      h('h3', { text: 'Où couper' }),
      h('p', {},
        "La manipulation peut s’effectuer en rompant l’alimentation d’un étage — oscillateur, FI, " +
        "amplificateur final — ou la liaison entre deux étages. Le choix n’est pas neutre, et l’examen " +
        "interroge ses conséquences."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'Couper l’oscillateur ' }),
          "dégrade sa stabilité au moment du redémarrage : on entend des ",
          h('strong', { text: 'piaulements' }),
          " — la note glisse au lieu d’attaquer nette."),
        h('li', {},
          h('strong', { text: 'Couper entre deux étages ' }),
          "provoque de brusques variations d’impédance de charge : on entend des ",
          h('strong', { text: 'claquements' }),
          " — des clics de manipulation qui s’étalent de part et d’autre de la fréquence."),
      ),
      h('p', { class: 'prose__note' },
        "C’est pourquoi une bonne station de CW soigne la forme des fronts de manipulation : une attaque " +
        "et une extinction trop raides élargissent le spectre bien au-delà des cent hertz théoriques, et " +
        "vont brouiller les voisins."),
      h('p', {},
        "La CW se démodule exactement comme la BLU : le signal est un simple battement, rendu audible " +
        "par un oscillateur local. C’est aussi pour cela qu’un poste BLU reçoit la télégraphie sans rien " +
        "de plus."),
      h(
        'div',
        { class: 'actions' },
        h('a', { class: 'btn btn--primary', href: '#/entrainement/ecoute', text: 'S’entraîner à la copier' }),
        h('a', { class: 'btn', href: '#/apprendre/principes', text: 'Les règles de durée du code' }),
      ),
    ),

    // --- Numérique ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Les modes numériques' }),
      h('p', {},
        "Ils n’échappent pas à la classification : ils modulent eux aussi l’amplitude, la fréquence ou " +
        "la phase — simplement par sauts entre états discrets."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {}, h('strong', { text: 'FSK — ' }), "la fréquence saute entre deux valeurs. Transmettre en AFSK sur un émetteur BLU revient exactement à moduler en FSK."),
        h('li', {}, h('strong', { text: 'PSK — ' }), "la phase saute entre deux états (0 et π), quatre, ou davantage."),
        h('li', {}, h('strong', { text: 'QAM — ' }), "amplitude et phase combinées, jusqu’à 256 états. Débit élevé, mais sensible aux parasites et à l’évanouissement."),
      ),
      h('p', {},
        "Deux grandeurs à ne pas confondre. La vitesse en ",
        h('strong', { text: 'bauds' }),
        " compte les changements d’état par seconde — c’est elle qui détermine la bande occupée. Le ",
        h('strong', { text: 'débit binaire' }),
        " compte les bits transmis, et dépend en plus du nombre d’états possibles, la ",
        h('strong', { text: 'valence' }),
        "."),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Bauds et bits par seconde' }),
      h('div', { class: 'toolbar' },
        baudInput,
        h('span', { class: 'converter__label', text: 'bauds à' }),
        statesSelect,
        h('span', { class: 'converter__label', text: '→' }),
        rateOut),
      h('p', { class: 'field__hint' },
        "Avec deux états, un baud vaut un bit et les deux chiffres se confondent — d’où la confusion " +
        "fréquente. Avec 256 états, chaque changement porte huit bits."),
    ),

    h(
      'section',
      { class: 'card card--accent' },
      h('h2', { class: 'card__title', text: 'Le programme technique est terminé' }),
      h('p', {},
        "Du rappel d’algèbre aux modulations, vous avez parcouru les treize chapitres de la seconde " +
        "épreuve. Ajoutés aux six pages de réglementation, c’est l’ensemble du certificat d’opérateur."),
      h(
        'div',
        { class: 'actions' },
        h('a', { class: 'btn', href: '#/licence/examen', text: 'Revoir le déroulement de l’examen' }),
        h('a', { class: 'btn', href: '#/licence/recepteurs', text: 'Revoir les synoptiques' }),
      ),
    ),
  );

  return { element };
}
