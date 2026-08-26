/**
 * Le mode histoire : types, lignée et épisodes.
 *
 * Le récit suit une famille de télégraphistes de 1844 à 1999, de père en fils.
 * Les situations et les messages sont historiques ; la famille est inventée.
 * Chaque épisode se termine sur un épilogue qui sépare les deux — le site sert
 * à apprendre, et laisser confondre le fait et la fiction serait une faute.
 *
 * Le nom de la famille n'est pas encore arrêté. Les textes ne l'écrivent donc
 * jamais en clair : ils portent des jetons — `{nom}`, `{prenom}`, `{sine}` —
 * que le moteur remplace au moment de l'affichage. Changer de patronyme ne
 * demandera pas de relire une ligne de récit.
 */

/** Les manipulateurs, dans l'ordre où l'histoire les a vus apparaître. */
export type KeyerKind = 'droit' | 'bug' | 'electronique' | 'clavier';

/** Le timbre d'une époque. Un poste à étincelle ne sonne pas comme un quartz. */
export type Timbre = 'relais' | 'etincelle' | 'pur';

export interface EraSound {
  timbre: Timbre;
  /** Rapport signal sur bruit, en décibels. Plus il est bas, plus ça gratte. */
  snrDb: number;
}

/**
 * Un temps du récit. Un épisode en aligne plusieurs dizaines : c'est ce qui
 * permet d'avoir beaucoup d'histoire autour de très peu de morse, seul dosage
 * qui rende une longue scène tenable.
 */
export type Beat =
  /** Narration ou dialogue affiché en clair. Coût pour le joueur : la lecture. */
  | { kind: 'recit'; text: string[]; speaker?: string }
  /** Un message à copier. C'est un des rares moments réellement coûteux. */
  | { kind: 'receive'; text: string; from?: string; wpm?: number; sound?: Partial<EraSound>; note?: string }
  /** Un message à émettre, avec le retour vert et rouge. */
  | { kind: 'send'; text: string; to?: string; hint?: string }
  /** Le blanc : on cesse d'émettre et on écoute. Rien, puis quelque chose. */
  | { kind: 'silence'; seconds: number; text?: string }
  /** Ce qui s'est réellement passé, et la part inventée. */
  | { kind: 'epilogue'; text: string[] };

export interface Episode {
  id: string;
  /** Rang de la génération, de 1 à 5. */
  generation: number;
  /** Année où la scène se passe, qui commande les manipulateurs disponibles. */
  year: number;
  title: string;
  /** Une ligne de sommaire, affichée dans l'arbre. */
  summary: string;
  /** Vrai pour les épisodes « Entre les ondes » : du récit, aucun enjeu. */
  optional?: boolean;
  sound: EraSound;
  beats: Beat[];
}

/** Un membre de la lignée. Le sine est l'initiale du prénom suivie de celle du nom. */
export interface Generation {
  rank: number;
  given: string;
  born: number;
}

export interface Lineage {
  surname: string;
  /** Initiale du patronyme : la seconde lettre du sine, constante sur cinq générations. */
  letter: string;
  generations: Generation[];
}

/**
 * Lignée provisoire, le temps que le nom soit arrêté.
 *
 * Les prénoms suivent l'usage : l'aîné portait celui du grand-père, si bien que
 * la première lettre du sine alterne au lieu de dériver — c'est la signature de
 * la lignée, et non un hasard.
 */
export const LINEAGE: Lineage = {
  surname: 'Duguet',
  letter: 'D',
  generations: [
    { rank: 1, given: 'Prosper', born: 1821 },
    { rank: 2, given: 'Étienne', born: 1848 },
    { rank: 3, given: 'Prosper', born: 1878 },
    { rank: 4, given: 'Étienne', born: 1911 },
    { rank: 5, given: 'Yann', born: 1943 },
  ],
};

/** Le manipulateur, et l'année à partir de laquelle il existe. */
export const KEYER_ERAS: { kind: KeyerKind; from: number; label: string }[] = [
  { kind: 'droit', from: 1844, label: 'Manipulateur droit' },
  { kind: 'bug', from: 1904, label: 'Manipulateur semi-automatique' },
  { kind: 'electronique', from: 1940, label: 'Manipulateur électronique' },
  { kind: 'clavier', from: 1960, label: 'Manipulateur à clavier' },
];

/**
 * Épisode d'amorce. Il n'y en a qu'un : le moteur se débogue sur une scène
 * complète, les treize autres s'écrivent ensuite génération par génération.
 */
const MGY: Episode = {
  id: 'mgy',
  generation: 3,
  year: 1912,
  title: 'MGY',
  summary: 'La nuit du 14 avril, une routine qui se brise.',
  sound: { timbre: 'etincelle', snrDb: 6 },
  beats: [
    {
      kind: 'recit',
      text: [
        'Vingt-trois heures quarante. Le trafic de la journée est écoulé : deux ' +
          'télégrammes de courtoisie, un relevé de position, et la liste de passagers ' +
          'que Cape Race réclamait depuis midi.',
        'Votre père vous a appris à ne jamais couper la veille avant minuit. Il disait ' +
          'que la nuit, l’Atlantique porte loin, et qu’un poste qui se tait n’entend rien.',
      ],
    },
    {
      kind: 'send',
      text: 'DE {sine} QRU',
      to: 'Cape Race',
      hint: 'Rien à signaler : on annonce la fin du trafic et on garde l’écoute.',
    },
    {
      kind: 'silence',
      seconds: 12,
      text: 'La bande ne porte plus que le souffle de l’Atlantique.',
    },
    {
      kind: 'recit',
      text: [
        'À vingt-trois heures cinquante, le grésillement change de nature.',
      ],
    },
    {
      kind: 'receive',
      text: 'CQD DE MGY POSITION 41.44 N 50.24 W',
      from: 'MGY',
      wpm: 14,
      note: 'CQD est l’appel de détresse d’avant SOS. Les deux coexistent en 1912.',
    },
    {
      kind: 'recit',
      text: [
        'MGY. Vous connaissez l’indicatif : il est neuf, il est sur toutes les listes ' +
          'depuis une semaine. Le plus grand navire jamais construit vient de demander ' +
          'de l’aide à quatre cents milles de la côte.',
      ],
    },
    {
      kind: 'receive',
      text: 'SOS SOS DE MGY WE HAVE STRUCK ICEBERG',
      from: 'MGY',
      wpm: 16,
      sound: { snrDb: 3 },
    },
    {
      kind: 'send',
      text: 'MGY DE {sine} R COMING',
      to: 'MGY',
      hint: 'On accuse réception et on annonce qu’on fait route. Rien d’autre : la bande est encombrée.',
    },
    {
      kind: 'epilogue',
      text: [
        'Le Titanic a émis pendant environ deux heures, d’abord en CQD puis en SOS. ' +
          'Le Carpathia, à cinquante-huit milles, a fait route et recueilli sept cent ' +
          'douze personnes. Le Californian, beaucoup plus proche, avait coupé sa veille ' +
          'pour la nuit : son opérateur dormait.',
        'La famille {nom} est inventée. Les indicatifs, les positions et la teneur des ' +
          'messages ne le sont pas.',
      ],
    },
  ],
};

export const EPISODES: Episode[] = [MGY];
