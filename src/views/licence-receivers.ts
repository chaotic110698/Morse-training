/**
 * Page « Récepteurs et émetteurs ».
 *
 * Les synoptiques : comment les briques du chapitre précédent s'assemblent.
 * Le calculateur de plan de fréquences donne la FI, le type d'hétérodynage et
 * surtout la fréquence image — que l'examen fait calculer et qu'on obtient
 * mal de tête, parce que sa formule dépend du sens du mélange.
 */

import { h, setChildren } from '../ui/dom.ts';
import { receiverPlan, sMeterDbm, sMeterMicrovolts } from '../core/radio-math.ts';
import { num } from '../ui/units.ts';
import type { View, ViewContext } from '../ui/router.ts';

const S_POINTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

interface Stage {
  name: string;
  role: string;
}

const RX_STAGES: Stage[] = [
  { name: 'Antenne', role: "Elle capte le signal voulu — et tous les autres." },
  { name: 'Filtre de bande', role: "Premier tri. Sa largeur définit la plage de fréquences reçue, et il rejette la fréquence image." },
  { name: 'Mélangeur', role: "Combine le signal reçu avec l’oscillateur local. En sortent une somme et une différence." },
  { name: 'Oscillateur local', role: "Fréquence variable : c’est lui qu’on règle en tournant le bouton d’accord." },
  { name: 'Étage FI', role: "Amplificateurs et filtres à fréquence fixe. C’est lui qui fait la sélectivité et la sensibilité du poste." },
  { name: 'Démodulateur', role: "Extrait le signal basse fréquence. Son type détermine les modulations que le poste sait recevoir." },
  { name: 'Amplificateur AF', role: "Amplifie la basse fréquence jusqu’au haut-parleur. Le potentiomètre y dose le volume." },
];

const TX_STAGES: Stage[] = [
  { name: 'Microphone ou manipulateur', role: "La source du message." },
  { name: 'Amplificateur BF', role: "Met le signal au niveau attendu par le modulateur." },
  { name: 'Modulateur', role: "Comprend nécessairement un oscillateur HF, et modifie la porteuse au rythme du message." },
  { name: 'Étages de puissance', role: "Amplifient jusqu’à la puissance d’émission voulue." },
  { name: 'Filtre passe-bas', role: "Obligatoire. Il bloque les harmoniques, donc les rayonnements non essentiels." },
  { name: 'Antenne', role: "Convertit le courant en onde." },
];

export function licenceReceiversView(_context: ViewContext): View {
  // --- Plan de fréquences ---

  const out = h('div', { class: 'converter__result' });
  const hfInput = h('input', {
    class: 'input', type: 'number', value: '14',
    attrs: { step: 'any', min: '0', 'aria-label': 'Fréquence à recevoir en mégahertz' },
    on: { input: () => compute() },
  });
  const foInput = h('input', {
    class: 'input', type: 'number', value: '5',
    attrs: { step: 'any', min: '0', 'aria-label': 'Fréquence de l’oscillateur local en mégahertz' },
    on: { input: () => compute() },
  });

  const compute = (): void => {
    const hf = Number(hfInput.value);
    const fo = Number(foInput.value);
    if (![hf, fo].every(Number.isFinite) || hf <= 0 || fo <= 0) {
      setChildren(out, [h('span', { class: 'prose__note', text: 'Entrez deux fréquences.' })]);
      return;
    }
    const plan = receiverPlan(hf, fo);
    setChildren(out, [
      h('div', { class: 'converter__line converter__line--result' },
        h('span', { class: 'converter__label', text: 'Fréquence intermédiaire — |HF − FO|' }),
        h('strong', { text: `${num(plan.intermediate)} MHz` })),
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Type de mélange' }),
        h('strong', { text: plan.kind === 'infradyne' ? 'Infradyne — FO sous HF' : 'Supradyne — FO au-dessus de HF' })),
      h('div', { class: 'converter__line converter__line--result' },
        h('span', { class: 'converter__label', text: 'Fréquence image — |2 FO − HF|' }),
        h('strong', { text: `${num(plan.image)} MHz` })),
      h('div', { class: 'converter__line' },
        h('span', { class: 'converter__label', text: 'Spectre dans l’étage FI' }),
        h('strong', { text: plan.inverted ? 'Inversé — repli spectral' : 'À l’endroit' })),
      h('p', { class: 'field__hint' },
        `Si le filtre d’entrée laisse passer ${num(plan.image)} MHz, ce signal se mélangera au même ` +
        `oscillateur et tombera lui aussi sur ${num(plan.intermediate)} MHz. Les deux seront alors ` +
        "impossibles à séparer : c’est tout l’enjeu du filtre de bande."),
    ]);
  };

  compute();

  const element = h(
    'div',
    { class: 'stack' },

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__lead' },
        "Un synoptique, c’est un poste vu de loin : des rectangles reliés par des flèches, chacun " +
        "remplissant une des fonctions du chapitre précédent. Deux règles de lecture, et tout devient " +
        "simple — un récepteur se lit de l’antenne vers le haut-parleur, un émetteur du microphone vers " +
        "l’antenne."),

      h('h2', { text: 'Le récepteur sans conversion' }),
      h('p', {},
        "Le plus simple : une série d’amplificateurs HF accordés sur la fréquence à recevoir, un " +
        "démodulateur, un amplificateur basse fréquence, un haut-parleur. Quand il faut changer de " +
        "fréquence, tous les étages HF doivent s’accorder ensemble — généralement par un axe mécanique " +
        "commun."),
      h('p', {},
        "C’est précisément sa limite : avec plusieurs étages accordés, l’accord devient très difficile à " +
        "tenir sur toute une bande. D’où l’invention du superhétérodyne."),

      h('h2', { text: 'Le récepteur superhétérodyne' }),
      h('p', {},
        "L’idée est de ne plus déplacer les filtres, mais de déplacer le signal. On mélange la fréquence " +
        "à recevoir avec celle d’un ",
        h('strong', { text: 'oscillateur local' }),
        " variable, de manière à la transposer sur une ",
        h('strong', { text: 'fréquence intermédiaire' }),
        " fixe. Tous les filtres délicats travaillent alors toujours à la même fréquence, et peuvent être " +
        "optimisés une fois pour toutes."),
      h('p', { class: 'formula', text: 'FI = |HF − FO|' }),
      h('p', {},
        "Le vocabulaire suit la position de l’oscillateur. S’il est ",
        h('strong', { text: 'sous' }),
        " la fréquence reçue, le récepteur est ",
        h('strong', { text: 'infradyne' }),
        " ; s’il est ",
        h('strong', { text: 'au-dessus' }),
        ", il est ",
        h('strong', { text: 'supradyne' }),
        ". Dans ce second cas, le spectre est retourné dans l’étage FI — c’est le repli spectral, qu’il " +
        "faut compenser à la démodulation."),
      h('p', {},
        "C’est l’étage FI qui donne au poste ses deux qualités : la ",
        h('strong', { text: 'sélectivité' }),
        ", c’est-à-dire sa capacité à isoler une station de sa voisine, et la ",
        h('strong', { text: 'sensibilité' }),
        ", c’est-à-dire le plus faible signal qu’il sait sortir du bruit."),
    ),

    h(
      'div',
      { class: 'chain' },
      ...RX_STAGES.map((stage, index) =>
        h(
          'section',
          { class: 'chain__stage' },
          h('span', { class: 'chain__number', text: String(index + 1) }),
          h('div', { class: 'chain__body' },
            h('h3', { class: 'chain__name', text: stage.name }),
            h('p', { class: 'chain__role', text: stage.role })),
        ),
      ),
    ),

    // --- Les trois commandes qui ne figurent pas sur le schéma ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Trois circuits qui ne se voient pas sur le schéma' }),
      h('p', {},
        "La chaîne ci-dessus suffit à recevoir, mais pas à écouter confortablement. Trois circuits " +
        "s’y ajoutent, dont l’examen demande la fonction."),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'L’oscillateur de battement, ou BFO. ' }),
          "Une émission en télégraphie ou en bande latérale unique ne porte aucune porteuse : le " +
          "démodulateur n’en tirerait rien. Le BFO en fournit une localement, et c’est son battement " +
          "avec le signal reçu qui produit la note audible. Le décaler de quelques centaines de hertz " +
          "change la tonalité entendue, pas la fréquence reçue."),
        h('li', {},
          h('strong', { text: 'La commande automatique de gain, ou CAG. ' }),
          "Elle mesure le niveau en sortie de l’étage à fréquence intermédiaire et rétroagit sur le " +
          "gain de cet étage, de façon que le haut-parleur délivre un niveau à peu près constant, " +
          "qu’on écoute une station locale ou lointaine. C’est elle qui alimente le S-mètre."),
        h('li', {},
          h('strong', { text: 'Le silencieux, ou squelch. ' }),
          "Il coupe l’amplificateur basse fréquence tant qu’aucun signal ne dépasse un seuil réglable, " +
          "ce qui évite d’écouter le souffle en permanence. Très employé en FM, il n’a guère de sens " +
          "en bande latérale unique, où le bruit de fond fait partie de l’écoute."),
      ),
      h('p', { class: 'prose__note' },
        "Ne pas les confondre : la CAG ajuste un gain, le silencieux coupe un son, le BFO fabrique une " +
        "porteuse. Trois fonctions distinctes, trois circuits distincts."),
    ),

    // --- Fréquence image ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'La fréquence image' }),
      h('p', {},
        "Le défaut congénital du superhétérodyne. Un mélangeur produit toujours ",
        h('strong', { text: 'deux' }),
        " fréquences, la somme et la différence — mais on n’en garde qu’une pour faire la FI. Il existe " +
        "donc une autre fréquence d’entrée qui, par le produit qu’on rejette, tombe elle aussi " +
        "exactement sur la FI. C’est la ",
        h('strong', { text: 'fréquence image' }),
        "."),
      h('p', {},
        "Dans l’exemple du cours, on reçoit 14 MHz avec un oscillateur à 5 MHz, et l’on retient la " +
        "différence : 14 − 5 = 9 MHz. Mais un signal à 4 MHz mélangé au même oscillateur donne, par la " +
        h('em', { text: 'somme' }),
        " cette fois, 4 + 5 = 9 MHz lui aussi."),
      h('p', { class: 'formula', text: 'F image = |2 × FO − HF| = |2 × FI ∓ HF|' }),
      h('p', {},
        "Une fois les deux signaux dans l’étage FI, rien ne peut plus les séparer. Le seul remède est en " +
        "amont : un filtre d’entrée assez sélectif pour rejeter l’image. C’est pourquoi les récepteurs à " +
        "large couverture emploient un ",
        h('strong', { text: 'double changement de fréquence' }),
        " — une première FI très haute, souvent au-delà de 100 MHz, qui rejette l’image très loin et " +
        "facilite le filtrage d’entrée, puis une seconde vers 500 kHz où les filtres étroits sont " +
        "abordables."),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Plan de fréquences d’un récepteur' }),
      h('p', { class: 'card__hint' },
        "L’exemple chargé est celui du cours : recevoir 14 MHz avec un oscillateur à 5 MHz donne une FI " +
        "de 9 MHz — et une image à 4 MHz."),
      h('div', { class: 'toolbar' },
        h('span', { class: 'converter__label', text: 'Recevoir' }),
        hfInput,
        h('span', { class: 'converter__label', text: 'MHz avec un oscillateur à' }),
        foInput,
        h('span', { class: 'converter__label', text: 'MHz' })),
      out,
    ),

    // --- Sensibilité ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Mesurer un signal : l’échelle S' }),
      h('p', {},
        "La force d’un signal reçu s’exprime en points S. Le repère absolu est ",
        h('strong', { text: 'S9 = 50 µV sous 50 Ω' }),
        ", soit 50 picowatts, soit −73 dBm. Chaque point vaut ",
        h('strong', { text: '6 dB' }),
        ", donc un facteur deux en tension et quatre en puissance."),
    ),

    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        { class: 'data-table' },
        h('thead', {}, h('tr', {},
          h('th', { attrs: { scope: 'col' }, text: 'Point S' }),
          ...S_POINTS.map((s) => h('th', { class: 'num', attrs: { scope: 'col' }, text: `S${s}` })))),
        h('tbody', {},
          h('tr', {},
            h('th', { attrs: { scope: 'row' }, text: 'Tension (µV)' }),
            ...S_POINTS.map((s) => h('td', { class: 'num', text: num(sMeterMicrovolts(s), 2) }))),
          h('tr', {},
            h('th', { attrs: { scope: 'row' }, text: 'Puissance (dBm)' }),
            ...S_POINTS.map((s) => h('td', { class: 'num', text: String(sMeterDbm(s)) }))),
          h('tr', {},
            h('th', { attrs: { scope: 'row' }, text: 'Écart à S9 (dB)' }),
            ...S_POINTS.map((s) => h('td', { class: 'num', text: String(-6 * (9 - s)) })))),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__note' },
        "Au-delà de S9, on compte en décibels : « S9 plus 20 » signifie vingt décibels au-dessus de S9, " +
        "soit 500 µV. Un récepteur moderne descend couramment à S0 ou S1. Cela dit, l’étalonnage des " +
        "S-mètres est souvent fantaisiste et ne suit guère cette norme — un report de force de signal " +
        "reste une indication, pas une mesure."),
      h('p', {},
        "Pour gagner en sensibilité, chaque étage doit générer le moins de bruit possible et rester le " +
        "plus linéaire possible. C’est pourquoi on trouve des FET en tête de récepteur : ils ne " +
        "recombinent pas de trous et d’électrons, donc ils bruissent moins."),
      h('p', { class: 'field__hint' },
        "Une figure de mérite complète la sensibilité : le ",
        h('strong', { text: 'point d’interception du troisième ordre' }),
        " (IP3), exprimé en dBm. Il situe le croisement théorique entre la courbe du signal utile et " +
        "celle des produits d’intermodulation, qui montent trois fois plus vite. Plus il est élevé, " +
        "mieux le récepteur encaisse un voisin puissant."),

      h('h2', { text: 'Le traitement numérique' }),
      h('p', {},
        "Les postes récents intègrent un étage ",
        h('strong', { text: 'DSP' }),
        ", placé avant l’amplificateur basse fréquence — ou mieux, avant le démodulateur. Le signal est " +
        "numérisé, filtré par des algorithmes, puis reconverti en analogique."),
      h('p', {},
        "Le nombre de bits de codage détermine la ",
        h('strong', { text: 'dynamique' }),
        " du circuit, à raison de ",
        h('strong', { text: '6 dB par bit' }),
        " : c’est l’écart entre le signal le plus fort avant saturation et le plus faible discernable."),
      h('p', {},
        "Un cran plus loin, le récepteur ",
        h('strong', { text: 'SDR' }),
        " combine conversion directe et traitement numérique, à l’aide d’un mélangeur à double sortie — " +
        "I et Q, phase et quadrature. Deux séries d’échantillons déphasées de 90° suffisent alors, ce qui " +
        "demande beaucoup moins de calcul qu’une transformée de Fourier et monte bien plus haut en " +
        "fréquence."),
    ),

    // --- Émetteur ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'L’émetteur' }),
      h('p', {},
        "Le chemin inverse, du microphone — ou du manipulateur — vers l’antenne. Deux éléments sont " +
        "obligatoires et tombent régulièrement à l’examen : le modulateur comprend ",
        h('strong', { text: 'nécessairement un oscillateur HF' }),
        ", et la sortie comporte ",
        h('strong', { text: 'obligatoirement un filtre passe-bas' }),
        " anti-harmonique."),
    ),

    h(
      'div',
      { class: 'chain' },
      ...TX_STAGES.map((stage, index) =>
        h(
          'section',
          { class: 'chain__stage' },
          h('span', { class: 'chain__number', text: String(index + 1) }),
          h('div', { class: 'chain__body' },
            h('h3', { class: 'chain__name', text: stage.name }),
            h('p', { class: 'chain__role', text: stage.role })),
        ),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', {},
        "Réunir un émetteur et un récepteur dans un même coffret donne un ",
        h('strong', { text: 'transceiver' }),
        ". Certains éléments deviennent alors communs : l’oscillateur local — de sorte que la fréquence " +
        "de réception suive celle d’émission — et la prise d’antenne. D’où la nécessité d’un système de " +
        "commutation : relais électromécaniques, ou diodes PIN pour la haute fréquence."),
      h('p', { class: 'field__hint' },
        "Pour que l’astuce fonctionne, la fréquence en sortie du modulateur doit être égale à la FI du " +
        "récepteur. C’est une contrainte de conception, et la raison pour laquelle un transceiver a un " +
        "plan de fréquences unique."),
      h('p', {},
        "La suite logique de ce chapitre : ",
        h('a', { href: '#/licence/modulations', text: 'ce que le modulateur fait exactement à la porteuse' }),
        "."),
    ),
  );

  return { element };
}
