/**
 * Le formulaire de l'examen.
 *
 * Toutes les formules exigibles, avec leurs variables et leurs unités. Les
 * unités sont la moitié du problème : une formule juste appliquée en farads
 * plutôt qu'en picofarads donne une réponse fausse, et c'est la première cause
 * d'erreur de l'épreuve technique. Chaque entrée porte donc explicitement les
 * unités attendues, et la variante simplifiée quand elle existe — celle qui
 * évite les puissances de dix sur une calculette de collège.
 */

export interface Formula {
  /** Expression principale, dans les unités du système international. */
  expression: string;
  /** Ce que la formule permet de trouver. */
  purpose: string;
  /** Variante en unités pratiques, quand le cours en propose une. */
  simplified?: string;
  /** Signification des lettres, dans l'ordre où elles apparaissent. */
  variables?: string;
  note?: string;
}

export interface FormulaGroup {
  id: string;
  chapter: string;
  title: string;
  /** Vrai pour l'épreuve de réglementation, faux pour la technique. */
  regulation?: boolean;
  formulas: Formula[];
}

export const FORMULA_GROUPS: FormulaGroup[] = [
  {
    id: 'ohm',
    chapter: 'Chapitre 1',
    title: 'Lois d’Ohm et de Joule',
    formulas: [
      { expression: 'U = R × I', purpose: 'Tension aux bornes d’une résistance', variables: 'U en volts, R en ohms, I en ampères' },
      { expression: 'P = U × I', purpose: 'Puissance dissipée', variables: 'P en watts' },
      { expression: 'P = U² / R', purpose: 'Puissance, à partir de la tension et de la résistance' },
      { expression: 'P = R × I²', purpose: 'Puissance, à partir de la résistance et du courant' },
      { expression: 'Q = I × t', purpose: 'Quantité d’électricité', variables: 'Q en coulombs, t en secondes' },
      { expression: 'W = P × t = U × Q', purpose: 'Énergie ou travail', variables: 'W en joules', note: '1 Wh = 3600 J' },
      { expression: 'R = ρ × L / S', purpose: 'Résistance d’un conducteur', variables: 'ρ en ohms-mètres, L en mètres, S en mètres carrés' },
      { expression: 'e = 66 / √f', purpose: 'Épaisseur de peau dans le cuivre', variables: 'e en microns, f en mégahertz' },
    ],
  },
  {
    id: 'groupements',
    chapter: 'Chapitre 1',
    title: 'Groupements de résistances',
    formulas: [
      { expression: 'Rt = R1 + R2 + …', purpose: 'Résistance équivalente en série', note: 'Toujours supérieure à la plus grande' },
      { expression: 'Rt = (R1 × R2) / (R1 + R2)', purpose: 'Résistance équivalente de deux résistances en parallèle', note: 'Produit sur somme — ne vaut que pour deux résistances' },
      { expression: '1 / Rt = 1/R1 + 1/R2 + …', purpose: 'Résistance équivalente en parallèle, cas général', note: 'Toujours inférieure à la plus petite' },
      { expression: 'UR1 = Ut × (R1 / Rt)', purpose: 'Répartition de la tension en série', note: 'Proportionnelle aux résistances' },
      { expression: 'IR1 = It × (Rt / R1)', purpose: 'Répartition de l’intensité en parallèle', note: 'Inversement proportionnelle aux résistances' },
    ],
  },
  {
    id: 'alternatif',
    chapter: 'Chapitre 2',
    title: 'Courant alternatif',
    formulas: [
      { expression: 't = 1 / f', purpose: 'Durée d’une période', variables: 't en secondes, f en hertz', simplified: 't(µs) = 1 / f(MHz)' },
      { expression: 'ω = 2π × f', purpose: 'Pulsation', variables: 'ω en radians par seconde' },
      { expression: 'Ueff = 0,707 × Umax', purpose: 'Valeur efficace d’un signal sinusoïdal', note: 'Seule valeur utilisable dans les lois d’Ohm et de Joule' },
      { expression: 'Umax = 1,414 × Ueff', purpose: 'Valeur crête' },
      { expression: 'Ucàc = 2 × Umax = 2,828 × Ueff', purpose: 'Valeur crête à crête' },
    ],
  },
  {
    id: 'composants',
    chapter: 'Chapitre 2',
    title: 'Bobines et condensateurs',
    formulas: [
      { expression: 'ZL = ω × L = 2π × f × L', purpose: 'Réactance d’une bobine', variables: 'ZL en ohms, L en henrys', simplified: 'Z(Ω) = 6,28 × f(MHz) × L(µH)' },
      { expression: 'ZC = 1 / (ω × C) = 1 / (2π × f × C)', purpose: 'Capacitance d’un condensateur', variables: 'C en farads', simplified: 'Z(Ω) = 159 / f(MHz) / C(nF)' },
      { expression: 'C = ε × S / e', purpose: 'Capacité d’un condensateur', variables: 'ε permittivité, S surface des lames, e épaisseur du diélectrique' },
      { expression: 'Q = C × U', purpose: 'Charge emmagasinée' },
      { expression: 'E = ½ × Q × U = ½ × C × U²', purpose: 'Énergie emmagasinée', variables: 'E en joules' },
      { expression: 'Lt = L1 + L2 + M', purpose: 'Bobines en série', note: 'M est la mutuelle induction, nulle si les bobines ne sont pas couplées' },
      { expression: 'Ct = C1 + C2 + …', purpose: 'Condensateurs en parallèle', note: 'L’inverse des résistances' },
      { expression: 'Ct = (C1 × C2) / (C1 + C2)', purpose: 'Condensateurs en série' },
      { expression: 'T = R × C', purpose: 'Constante de temps', variables: 'T en secondes', simplified: 'T(ms) = R(kΩ) × C(µF)', note: 'Charge complète après 5 T' },
      { expression: 'Z = √(R² + X²)', purpose: 'Impédance d’un composant réel', variables: 'X réactance ou capacitance' },
    ],
  },
  {
    id: 'transformateurs',
    chapter: 'Chapitre 3',
    title: 'Transformateurs et mesures',
    formulas: [
      { expression: 'N = ns / np', purpose: 'Rapport de transformation', note: 'Élévateur si N > 1' },
      { expression: 'Us = Up × N', purpose: 'Tension au secondaire' },
      { expression: 'Is = Ip / N', purpose: 'Intensité au secondaire' },
      { expression: 'Zs = Zp × N²', purpose: 'Transformation d’impédance', note: 'Le carré : l’erreur la plus fréquente' },
      { expression: 'η = Ps / Pp', purpose: 'Rendement', note: 'Toujours inférieur à 1' },
      { expression: 'Ri = (E − U) / I', purpose: 'Résistance interne d’une pile', variables: 'E force électromotrice, U tension aux bornes en charge' },
      { expression: 'E = (R + Ri) × I', purpose: 'Force électromotrice' },
      { expression: 'R = (Ut / Ig) − Ri', purpose: 'Résistance série d’un voltmètre', variables: 'Ig intensité de déviation maximale' },
      { expression: 'R = Ug / (It − Ig)', purpose: 'Shunt d’un ampèremètre' },
      { expression: 'Q = 1 / Ig', purpose: 'Qualité d’un voltmètre, en ohms par volt', note: 'Bon au-delà de 20 000 Ω/V' },
    ],
  },
  {
    id: 'decibels',
    chapter: 'Chapitre 4',
    title: 'Décibels',
    regulation: true,
    formulas: [
      { expression: 'G(dB) = 10 log (Ps / Pe)', purpose: 'Gain en puissance' },
      { expression: 'G(dB) = 20 log (Us / Ue)', purpose: 'Gain en tension', note: 'Le double du gain en puissance pour le même rapport' },
      { expression: 'dBW = dBm + 30 = dBµ + 60', purpose: 'Changer d’unité de référence' },
      { expression: 'rendement (%) = P utile × 100 / P consommée', purpose: 'Rendement' },
    ],
  },
  {
    id: 'circuits',
    chapter: 'Chapitre 4',
    title: 'Filtres et circuits accordés',
    formulas: [
      { expression: 'f = 1 / (2π × R × C)', purpose: 'Fréquence de coupure d’un circuit RC', simplified: 'f(Hz) = 159 / R(kΩ) / C(µF)' },
      { expression: 'f = R / (2π × L)', purpose: 'Fréquence de coupure d’un circuit RL' },
      { expression: 'f = 1 / (2π √(L × C))', purpose: 'Résonance — loi de Thomson', simplified: 'f(MHz) = 159 / √(L(µH) × C(pF))' },
      { expression: 'L = 1 / (4π² f² C)', purpose: 'Inductance pour une résonance donnée', simplified: 'L(µH) = 25 330 / f²(MHz) / C(pF)' },
      { expression: 'C = 1 / (4π² f² L)', purpose: 'Capacité pour une résonance donnée', simplified: 'C(pF) = 25 330 / f²(MHz) / L(µH)' },
      { expression: 'Z série = Z parallèle = R', purpose: 'Impédance à la résonance' },
      { expression: 'Z bouchon = L / (R × C)', purpose: 'Impédance d’un circuit bouchon à la résonance', simplified: 'Z(kΩ) = L(µH) / R(kΩ) / C(pF)' },
      { expression: 'Q = √(L / C) / R', purpose: 'Facteur de qualité', simplified: 'Q = √(L(µH) / C(pF)) / R(kΩ)' },
      { expression: 'B = f₀ / Q', purpose: 'Bande passante à −3 dB' },
      { expression: 'S(%) = B(−3 dB) × 100 / B(−60 dB)', purpose: 'Taux de sélectivité' },
      { expression: 'F = B(−60 dB) / B(−3 dB)', purpose: 'Facteur de forme', note: 'Approche 1 sans jamais l’atteindre' },
    ],
  },
  {
    id: 'transistors',
    chapter: 'Chapitres 6 à 8',
    title: 'Composants actifs',
    formulas: [
      { expression: 'Ic = β × Ib', purpose: 'Gain d’un transistor', note: 'β est un coefficient, pas un gain en décibels' },
      { expression: 'Ie = Ib + Ic', purpose: 'Courant d’émetteur' },
      { expression: 'pente = Id / Vg', purpose: 'Pente d’un FET ou d’un tube', note: 'On ne parle pas de gain pour ces composants' },
      { expression: 'f(MHz) = 5,7 / (2 × e(mm))', purpose: 'Fréquence propre d’une lame de quartz' },
      { expression: 'fmax = f1 + f2   ·   fmin = |f1 − f2|', purpose: 'Sorties d’un mélangeur' },
      { expression: 'f1 = (fmax − fmin) / 2   ·   f2 = fmax − f1', purpose: 'Entrées d’un mélangeur', note: 'Le sens inverse, et sa formule n’est pas symétrique' },
      { expression: 'G = − R2 / R1', purpose: 'Gain d’un ampli op en montage inverseur' },
      { expression: 'G = R2 / R1 + 1', purpose: 'Gain d’un ampli op en montage non inverseur' },
      { expression: 'TDH (%) = tension parasite × 100 / tension désirée', purpose: 'Taux de distorsion harmonique' },
      { expression: 'f Nyquist = f échantillonnage / 2', purpose: 'Limite de restitution d’un signal numérisé' },
    ],
  },
  {
    id: 'antennes',
    chapter: 'Chapitre 9',
    title: 'Propagation et antennes',
    regulation: true,
    formulas: [
      { expression: 'λ(m) = 300 / f(MHz)', purpose: 'Longueur d’onde', note: 'Et réciproquement f = 300 / λ' },
      { expression: 'L(m) = 150 / f(MHz)', purpose: 'Longueur théorique d’un doublet demi-onde', note: 'Raccourcir d’environ 5 % en pratique' },
      { expression: 'L(m) = 75 / f(MHz)', purpose: 'Longueur théorique d’une antenne quart d’onde' },
      { expression: 'PAR = P émetteur × rapport du gain', purpose: 'Puissance apparente rayonnée', note: 'Référence : le doublet. Avec l’antenne isotrope, on parle de PIRE' },
      { expression: 'gain(dBi) = gain(dBd) + 2,14', purpose: 'Changer de référence de gain' },
    ],
  },
  {
    id: 'lignes',
    chapter: 'Chapitre 10',
    title: 'Lignes de transmission',
    regulation: true,
    formulas: [
      { expression: 'Z = √(L / C)', purpose: 'Impédance caractéristique d’une ligne', variables: 'L et C par unité de longueur' },
      { expression: 'perte = longueur × affaiblissement linéique', purpose: 'Perte totale d’un câble', variables: 'affaiblissement en dB par mètre' },
      { expression: 'ROS = Z la plus forte / Z la plus faible', purpose: 'Rapport d’ondes stationnaires', note: 'Toujours supérieur ou égal à 1' },
      { expression: 'ρ = U réfléchie / U émise = √(P réfléchie / P émise)', purpose: 'Coefficient de réflexion', note: 'La racine carrée est le piège du chapitre' },
      { expression: 'ρ = (Vmax − Vmin) / (Vmax + Vmin)', purpose: 'Coefficient de réflexion, mesuré sur la ligne' },
      { expression: 'TOS (%) = 100 × ρ', purpose: 'Taux d’ondes stationnaires' },
      { expression: 'ROS = (1 + ρ) / (1 − ρ)   ·   ρ = (ROS − 1) / (ROS + 1)', purpose: 'Passer du ROS au coefficient de réflexion' },
      { expression: 'P réfléchie = P émise × ρ²', purpose: 'Puissance qui revient vers l’émetteur' },
      { expression: 'Zc = √(Ze × Zs)', purpose: 'Impédance d’une ligne quart d’onde d’adaptation' },
      { expression: 'Ze = Zs', purpose: 'Ligne demi-onde', note: 'Quelle que soit son impédance caractéristique' },
    ],
  },
  {
    id: 'synoptiques',
    chapter: 'Chapitre 11',
    title: 'Récepteurs',
    formulas: [
      { expression: 'FI = |HF − FO|', purpose: 'Fréquence intermédiaire', variables: 'HF fréquence reçue, FO oscillateur local' },
      { expression: 'Fim = |2 FO − HF|', purpose: 'Fréquence image', note: 'Elle atteint la FI par l’autre produit du mélangeur' },
      { expression: 'S9 = 50 µV sous 50 Ω = −73 dBm', purpose: 'Référence de l’échelle S', note: '6 dB par point S' },
      { expression: 'dynamique = 6 dB × nombre de bits', purpose: 'Dynamique d’un convertisseur' },
    ],
  },
  {
    id: 'modulations',
    chapter: 'Chapitre 12',
    title: 'Modulations',
    formulas: [
      { expression: 'K(%) = (A − a) / (A + a) × 100', purpose: 'Taux de modulation en AM', variables: 'A et a extrêmes de l’enveloppe' },
      { expression: 'bande occupée = 2 × excursion', purpose: 'Largeur d’un signal FM, approximation courante' },
      { expression: 'm = excursion / BF max', purpose: 'Indice de modulation en FM' },
      { expression: 'B = 2 (m + 1) × BF max', purpose: 'Règle de Carson', note: 'Plus juste que le simple doublement de l’excursion' },
      { expression: 'débit = bauds × valence', purpose: 'Débit binaire', variables: 'valence : nombre de bits par changement d’état' },
    ],
  },
  {
    id: 'reglementation',
    chapter: 'Réglementation',
    title: 'Limites à connaître',
    regulation: true,
    formulas: [
      { expression: '500 W · 250 W · 120 W', purpose: 'Puissances maximales', note: 'Sous 28 MHz · de 28 à 30 MHz · au-delà de 30 MHz' },
      { expression: '1 W PIRE · 15 W PIRE', purpose: 'Exceptions en puissance rayonnée', note: 'Bandes 2200 et 630 m · bande 60 m' },
      { expression: '6 · 12 · 20 kHz', purpose: 'Largeur de bande occupée maximale', note: 'Sous 28 MHz · de 28 à 144 MHz · de 144 à 225 MHz. Aucune limite au-delà' },
      { expression: 'atténuation ≥ 43 dB + 10 log(P)', purpose: 'Rayonnements non essentiels', note: 'Plafonds : −50 dBc sous 30 MHz, −70 dBc au-dessus' },
      { expression: '2,5 × la bande passante nécessaire', purpose: 'Frontière hors bande / non essentiel', note: 'Au minimum 10 kHz sous 30 MHz' },
      { expression: '5 W PAR', purpose: 'Seuil de déclaration d’une station fixe à l’ANFR' },
      { expression: '12 mètres', purpose: 'Hauteur au-delà de laquelle un pylône demande une déclaration préalable' },
      { expression: '50 V · 24 V · 12 V', purpose: 'Tensions non dangereuses', note: 'Milieu sec · humide ou extérieur · en immersion' },
      { expression: '15 minutes', purpose: 'Intervalle maximal entre deux identifications' },
      { expression: '1 an', purpose: 'Conservation du journal de bord après la dernière inscription' },
    ],
  },
];

export interface Mnemonic {
  title: string;
  content: string;
  detail: string;
}

/** Ce que le cours conseille d'écrire sur le brouillon avant l'épreuve. */
export const SCRATCHPAD: Mnemonic[] = [
  {
    title: 'La table des multiples',
    content: 'G  M  k  unité  m  µ  n  p',
    detail: "Un grand trait sous chaque symbole, et la virgule se déplace de trois rangs à chaque saut.",
  },
  {
    title: 'Les quatre triangles',
    content: 'U = R×I   ·   P = U×I   ·   P = R×I²   ·   U² = P×R',
    detail: "On cache l’inconnue du doigt : côte à côte elles se multiplient, l’une sur l’autre elles se divisent.",
  },
  {
    title: 'Les neuf rapports en décibels',
    content: '−20 −10 −6 −3 0 +3 +6 +10 +20 dB\n1/100  1/10  1/4  1/2  1  ×2  ×4  ×10  ×100',
    detail: "3 dB double, 10 dB multiplie par dix, et tout le reste s’en déduit. Les décibels s’additionnent.",
  },
  {
    title: 'Le code des couleurs',
    content: 'Ne Mangez Rien Ou Je Vous Battrai VIOlemment, Grand Boa',
    detail: "Noir 0, marron 1, rouge 2, orange 3, jaune 4, vert 5, bleu 6, violet 7, gris 8, blanc 9.",
  },
  {
    title: 'Les deux facteurs du sinus',
    content: '0,707 pour descendre   ·   1,414 pour monter',
    detail: "Efficace vers crête et retour. À convertir avant tout autre calcul.",
  },
  {
    title: 'Le facteur 159',
    content: '159 ≈ 1000 / 2π',
    detail: "Il permet de travailler en MHz, µH et pF sans manipuler de puissances de dix.",
  },
];
