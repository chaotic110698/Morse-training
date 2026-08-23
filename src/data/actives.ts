/**
 * Composants actifs : familles de diodes, montages de transistors, classes
 * d'amplification.
 *
 * Ces trois tables sont exactement ce que l'examen demande de restituer. Le
 * tableau des montages de transistors est le plus rentable du chapitre :
 * trois lignes, cinq colonnes, et une bonne moitié des questions du chapitre 6.
 */

export interface DiodeKind {
  name: string;
  symbol: string;
  use: string;
  detail: string;
}

export const DIODE_KINDS: DiodeKind[] = [
  {
    name: 'Diode de redressement',
    symbol: 'Triangle et barre',
    use: 'Transformer l’alternatif en continu',
    detail:
      "La diode de base. Chute de 0,7 V au silicium, 0,3 V au germanium. Son claquage en inverse est irréversible : elle est détruite.",
  },
  {
    name: 'Diode Zener',
    symbol: 'Cathode en Z',
    use: 'Stabiliser une tension',
    detail:
      "Montée en inverse. Au-delà de sa tension d’avalanche elle devient brusquement passante, comme la soupape d’une cocotte-minute, puis se rebloque. Son claquage est réversible.",
  },
  {
    name: 'Diode Varicap',
    symbol: 'Cathode doublée',
    use: 'Remplacer un condensateur variable',
    detail:
      "Montée en inverse. Sa capacité diminue quand la tension inverse augmente, la barrière de potentiel isolante s’élargissant comme le diélectrique d’un condensateur. C’est le cœur d’un VCO.",
  },
  {
    name: 'LED',
    symbol: 'Flèches sortantes',
    use: 'Émettre de la lumière',
    detail:
      "Chaque recombinaison électron-trou émet un photon. La couleur et la tension de seuil dépendent du semi-conducteur : 1,5 V en infrarouge, 2 V en rouge, 3,3 V en bleu. Une résistance limite le courant à environ 20 mA.",
  },
  {
    name: 'Diode PIN',
    symbol: 'Trois zones',
    use: 'Commuter de la haute fréquence',
    detail:
      "Une couche isolante entre les zones P et N ralentit sa réponse. Non alimentée, elle reste bloquée même si la tension HF dépasse 0,7 V — ce qu’une diode PN ne fait pas. Elle remplace les relais en commutation HF.",
  },
  {
    name: 'Diode Schottky',
    symbol: 'Cathode en S',
    use: 'Commuter très vite',
    detail:
      "Jonction entre un semi-conducteur et un métal, à la manière d’une galène. Seuil très bas, 0,25 V, et commutation très rapide — mais tension inverse limitée. On la trouve dans les mélangeurs en anneau.",
  },
];

export interface TransistorMounting {
  name: string;
  input: string;
  output: string;
  currentGain: string;
  voltageGain: string;
  inputZ: string;
  outputZ: string;
  phase: string;
  use: string;
}

export const TRANSISTOR_MOUNTINGS: TransistorMounting[] = [
  {
    name: 'Émetteur commun',
    input: 'Base',
    output: 'Collecteur',
    currentGain: 'β',
    voltageGain: 'Élevé',
    inputZ: 'Moyenne — une centaine d’ohms',
    outputZ: 'Élevée — quelques kilohms',
    phase: '180°',
    use: "Le montage le plus courant. Amplifie en courant comme en tension, et inverse le signal.",
  },
  {
    name: 'Collecteur commun',
    input: 'Base',
    output: 'Émetteur',
    currentGain: 'β + 1',
    voltageGain: 'Inférieur à 1',
    inputZ: 'Élevée — quelques kilohms',
    outputZ: 'Faible — quelques dizaines d’ohms',
    phase: 'Aucun',
    use: "L’émetteur suiveur. Amplificateur de courant, adaptateur d’impédance : haut-parleurs, ballasts d’alimentation.",
  },
  {
    name: 'Base commune',
    input: 'Émetteur',
    output: 'Collecteur',
    currentGain: 'Aucun',
    voltageGain: 'Élevé',
    inputZ: 'Basse — quelques dizaines d’ohms',
    outputZ: 'Très élevée — plusieurs kilohms',
    phase: 'Aucun',
    use: "Peu employé. Amplificateur de tension pur.",
  },
];

export interface AmpClass {
  name: string;
  bias: string;
  conduction: string;
  use: string;
  warning?: string;
}

export const AMP_CLASSES: AmpClass[] = [
  {
    name: 'Classe A',
    bias: 'Repos au centre de la plage',
    conduction: 'Toute la période',
    use: "Le montage le plus courant. Le signal ne sort jamais de la plage linéaire, donc aucune distorsion — mais un rendement médiocre.",
  },
  {
    name: 'Classe B',
    bias: 'Repos à la limite de la plage',
    conduction: 'Une alternance par transistor',
    use: "Deux transistors se partagent le travail, chacun amplifiant une alternance. Meilleur rendement, mais réglage délicat et transistors à apparier.",
  },
  {
    name: 'Classe AB',
    bias: 'Repos décalé, entre A et B',
    conduction: 'Un peu plus d’une alternance',
    use: "Le compromis des étages de puissance. Suivi d’un filtre passe-bas en émission, pour bloquer les harmoniques dues aux écrêtements.",
  },
  {
    name: 'Classe C',
    bias: 'Repos hors de la plage',
    conduction: 'Les crêtes seulement',
    use: "Seule une partie du signal est amplifiée, le circuit oscillant de sortie reconstituant le reste. Excellent rendement, forte distorsion harmonique — d’où son emploi en multiplicateur de fréquence.",
    warning: "À proscrire en AM et en BLU : ces modulations portent l’information dans l’amplitude, que la classe C détruit.",
  },
  {
    name: 'Classe D',
    bias: 'Commutation tout ou rien',
    conduction: 'Impulsions à largeur variable',
    use: "Rendement très élevé, employé en audio et en HF de forte puissance. Demande un filtrage important en sortie.",
  },
];

export interface Oscillator {
  code: string;
  name: string;
  control: string;
}

export const OSCILLATORS: Oscillator[] = [
  { code: 'VXO', name: 'Oscillateur à quartz', control: 'Fréquence fixe, définie par la taille de la lame' },
  { code: 'VFO', name: 'Oscillateur libre', control: 'Condensateur variable, commande mécanique' },
  { code: 'VCO', name: 'Oscillateur commandé en tension', control: 'Diode Varicap, commande par une tension' },
  { code: 'PLL', name: 'Boucle à verrouillage de phase', control: 'Synthèse : un VCO asservi à un quartz par un diviseur programmable' },
  { code: 'DDS', name: 'Synthèse numérique directe', control: 'Un calculateur produit l’échantillon, un convertisseur le restitue' },
];
