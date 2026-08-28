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
  | {
      kind: 'receive';
      text: string;
      from?: string;
      wpm?: number;
      sound?: Partial<EraSound>;
      /**
       * Ce qu'il faut savoir pour comprendre le message. Affiche apres la
       * comparaison seulement : avant, c'est la reponse qu'on donne.
       */
      note?: string;
      /** Le signal tombe de lui-meme, au milieu d'autre chose. */
      irruption?: Irruption;
    }
  /**
   * Un message à émettre, avec le retour vert et rouge.
   *
   * `limit` donne le temps d'antenne, en secondes, au-delà duquel un poste
   * clandestin se fait localiser. Le compte à rebours ne bloque rien — il
   * continue à monter une fois dépassé, et c'est bien pire.
   */
  | { kind: 'send'; text: string; to?: string; hint?: string; limit?: number }
  /** Le blanc : on cesse d'émettre et on écoute. Rien, puis quelque chose. */
  | { kind: 'silence'; seconds: number; text?: string }
  /** Ce qui s'est réellement passé, et la part inventée. */
  | { kind: 'epilogue'; text: string[] };

/**
 * Un signal qui arrive de lui-meme.
 *
 * Le joueur ne demande rien : il lit, et au bout de quelques secondes la bande
 * se met a porter quelque chose. C'est la seule facon de faire sentir ce
 * qu'est une veille — on n'appuie pas sur « Ecouter », on est la quand ca
 * tombe. Le signal tourne en boucle, comme tourne un appel de detresse, tant
 * qu'on ne s'est pas decide a le dechiffrer.
 */
export interface Irruption {
  /** Ce qu'on lit pendant que rien ne se passe encore. */
  text: string[];
  /** Secondes avant que le signal ne se fasse entendre. */
  after: number;
  /** Ce que dit le bouton qui apparait alors. */
  label?: string;
}

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
  /**
   * Le récepteur reste ouvert d'un bout à l'autre.
   *
   * Le souffle de la bande accompagne alors tout l'épisode au lieu de n'exister
   * que pendant les lectures. C'est ce qui fait une veille : on n'allume pas la
   * radio pour écouter un message, on est assis devant depuis des heures.
   */
  receiverOpen?: boolean;
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
    { rank: 1, given: 'Modéré', born: 1821 },
    { rank: 2, given: 'Claude', born: 1848 },
    { rank: 3, given: 'Modéré', born: 1878 },
    { rank: 4, given: 'Claude', born: 1911 },
    { rank: 5, given: 'Modéré', born: 1943 },
  ],
};

/**
 * Ce qu'un épisode peut demander de manipuler.
 *
 * Le clavier rend la frappe confortable, les palettes la rendent exigeante :
 * le joueur choisit. On peut donc se permettre une ou deux épreuves longues
 * par épisode, à condition que tout le reste soit fait de brèves — un échange
 * de service, un accusé de réception, une phrase de conversation.
 */
export const MAX_MESSAGE = 100;
export const SHORT_MESSAGE = 30;
export const MAX_LONG_PER_EPISODE = 2;

/** Le manipulateur, et l'année à partir de laquelle il existe. */
export const KEYER_ERAS: { kind: KeyerKind; from: number; label: string }[] = [
  { kind: 'droit', from: 1844, label: 'Manipulateur droit' },
  { kind: 'bug', from: 1904, label: 'Manipulateur semi-automatique' },
  { kind: 'electronique', from: 1940, label: 'Manipulateur électronique' },
  { kind: 'clavier', from: 1960, label: 'Manipulateur à clavier' },
];

/**
 * Génération I — Modéré Duguet, stationnaire devenu télégraphiste.
 *
 * Le fil de ces trois épisodes est le même : un homme dont le métier est de
 * transmettre sans comprendre, et à qui un alphabet nouveau donne, pour la
 * première fois de sa vie, le droit de lire ce qu’il fait passer — puis celui
 * de dire quelque chose à lui.
 */

const CE_QUE_DIEU_A_FAIT: Episode = {
  id: 'ce-que-dieu-a-fait',
  generation: 1,
  year: 1844,
  title: 'Ce que Dieu a fait',
  summary: 'Une nouvelle venue d’Amérique, un alphabet de points et de traits.',
  sound: { timbre: 'relais', snrDb: 22 },
  beats: [
    {
      kind: 'recit',
      text: [
        'Sur la tour, il n’y a rien à comprendre. C’est même la règle.',
        'Vous montez avant le jour, vous braquez la lunette sur la tour qui vous ' +
          'précède, et vous attendez. Quand ses bras bougent, vous reproduisez la ' +
          'même figure sur les vôtres, exactement, sans y penser. Cent quatre-vingt-douze ' +
          'positions, apprises par cœur. Ce qu’elles disent, personne ici ne le sait : ' +
          'le message est chiffré au départ et ne se lit qu’à l’arrivée.',
        'On vous paie pour être une charnière. Vous êtes bon à ce métier — le meilleur ' +
          'de la section, dit-on — et vous avez vingt-trois ans.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Ce soir de mai, votre père rentre avec un journal plié sous le bras et ne ' +
          'retire pas son manteau.',
        '« Un Américain a envoyé une phrase dans un fil de cuivre. Quarante lieues. ' +
          'Pas de tours, pas de temps clair, pas de jour. Une phrase entière, dans un ' +
          'fil, tout de suite. »',
        'Vous lui faites répéter deux fois. La seconde, il pose le journal sur la table ' +
          'et met le doigt dessus, comme si le papier pouvait s’envoler.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Sous l’article, le journal a fait graver l’alphabet. Vingt-six lettres, et ' +
          'devant chacune une petite suite de points et de traits.',
        'Vous le recopiez à la plume, lettre par lettre, en vous répétant que ce n’est ' +
          'pas si différent de vos cent quatre-vingt-douze positions. Puis vous ' +
          'comprenez la différence, et elle vous coupe le souffle : ce tableau-là est ' +
          'imprimé dans un journal. N’importe qui peut le lire.',
        'Pour la première fois de votre vie, la clef n’est pas au-dessus de vous.',
        'Il n’y a évidemment aucun appareil dans cette cuisine, et pas un pouce de fil ' +
          'à cent lieues. Alors vous faites ce que ferait n’importe qui devant une ' +
          'écriture qu’il ne sait pas encore lire : vous la sonnez. Le bout du ' +
          'porte-plume sur le bois, un coup sec pour le point, un coup tenu pour le ' +
          'trait. Le journal n’a imprimé que des signes ; c’est vous qui leur donnez ' +
          'une durée.',
      ],
    },
    {
      kind: 'receive',
      text: 'WHAT',
      from: 'le tableau du journal',
      wpm: 5,
      note:
        'La bande ne porte que le signal — c’est à vous d’y mettre les lettres. ' +
        'Cochez « lettre par lettre » pour avancer d’un caractère à la fois, ' +
        'ouvrez la table de déchiffrage, et écrivez ce que vous trouvez. ' +
        'AGN redit le dernier caractère quand vous hésitez. Personne ne vous ' +
        'chronomètre : en 1844, personne ne sait faire vite.',
    },
    {
      kind: 'recit',
      text: [
        'Quatre lettres. Il vous a fallu le temps de faire chauffer la soupe.',
        'Votre père regarde le mot que vous avez écrit et hausse les épaules : ce ' +
          'n’est pas du français. Vous ne savez pas ce que ça veut dire non plus. ' +
          'Cela ne change rien à ce que vous venez de faire, et vous êtes le seul des ' +
          'deux à le voir.',
      ],
    },
    {
      kind: 'receive',
      text: 'WHAT HATH GOD WROUGHT',
      from: 'le tableau du journal',
      wpm: 6,
      note: 'La phrase entière, celle du 24 mai. Vingt et un caractères.',
    },
    {
      kind: 'recit',
      text: [
        '« Ce que Dieu a fait. » C’est une jeune fille qui a choisi la phrase, dit ' +
          'l’article, et elle l’a prise dans la Bible.',
        'Vous ne parlez pas anglais. Vous venez de transmettre une phrase sans la ' +
          'comprendre — votre métier, exactement. À un détail près, et ce détail vous ' +
          'tient éveillé : cette fois, rien ne vous interdit d’apprendre.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Votre père, lui, a fini par retirer son manteau, et il n’est pas d’accord.',
        '« Cinq cents tours, Modéré. Soixante ans de travail. La France entière en ' +
          'quatre heures. Et tu voudrais que l’État confie ses secrets à un fil qu’on ' +
          'peut couper avec une pince, et écouter n’importe où entre deux villages ? »',
        'Il n’a pas tort. C’est même l’argument qui tiendra dix ans.',
      ],
    },
    {
      kind: 'silence',
      seconds: 10,
      text: 'La nuit tombe. Rien à relayer avant le jour.',
    },
    {
      kind: 'recit',
      text: [
        'Vous restez à la table avec le porte-plume et le tableau du journal.',
        'La première chose qu’on écrit dans un alphabet neuf, ce n’est jamais une ' +
          'phrase. C’est son nom. Deux lettres suffisent : celle de votre prénom, ' +
          'celle de votre père. Sur les lignes, on appelle ça une signature, et un ' +
          'homme n’en a qu’une dans sa vie.',
        'Il n’y a personne au bout, aucun fil, et pas même un appareil pour ' +
          'transformer vos coups en quoi que ce soit. Juste une table de cuisine, ' +
          'un porte-plume, et un homme de vingt-trois ans qui frappe son nom dans ' +
          'un alphabet que la France interdit encore.',
      ],
    },
    {
      kind: 'send',
      text: '{sine}',
      to: 'personne',
      hint:
        'Frappez-les sur le bois : un coup sec pour le point, un coup tenu pour ' +
        'le trait. Rien ne part nulle part. C’est la première chose que vous ' +
        'transmettez de votre plein gré.',
    },
    {
      kind: 'epilogue',
      text: [
        'Le message du 24 mai 1844 est authentique : Alfred Vail l’a reçu à Baltimore, ' +
          'envoyé de Washington par Samuel Morse. « What hath God wrought » vient du ' +
          'Livre des Nombres, et c’est Annie Ellsworth, fille du commissaire aux ' +
          'brevets, qui a choisi la phrase.',
        'Deux libertés ont été prises. Le code de 1844 était le morse américain, ' +
          'qui n’est pas celui d’aujourd’hui : le code international, que vous venez ' +
          'd’employer, a été mis au point en Europe quelques années plus tard. Et ' +
          'surtout, Modéré n’aurait rien entendu. Les premiers appareils imprimaient ' +
          'les signaux sur une bande de papier ; c’est en s’apercevant qu’ils ' +
          'déchiffraient plus vite au bruit du stylet que les opérateurs ont fini par ' +
          'lever les yeux de la bande. L’écoute est venue après — et c’est elle qui a ' +
          'gagné.',
        'Le télégraphe Chappe, lui, fonctionnait bien ainsi : des tours à bras ' +
          'articulés, un code que les stationnaires reproduisaient sans le comprendre, ' +
          'et un monopole d’État. La famille {nom} est inventée. Le métier, non.',
      ],
    },
  ],
};

const LA_LIGNE: Episode = {
  id: 'la-ligne',
  generation: 1,
  year: 1852,
  title: 'La ligne',
  summary: 'Le fil arrive en Bretagne, et il faut apprendre à s’en servir.',
  sound: { timbre: 'relais', snrDb: 18 },
  beats: [
    {
      kind: 'recit',
      text: [
        'Huit ans. Votre père avait raison plus longtemps qu’il ne le méritait : ' +
          'l’administration a tenu bon, puis elle a cédé, comme tout le monde.',
        'On vous envoie à l’ouest surveiller la pose. Vous quittez Paris avec une ' +
          'malle, une femme et un garçon de quatre ans qui s’appelle Claude. Vous ' +
          'ne remonterez pas.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'La Bretagne, c’est de la boue et des poteaux. On les plante tous les ' +
          'soixante pas, on tend le fil, on recommence. Les gens du bourg viennent ' +
          'regarder, restent une heure, et repartent sans avoir demandé à quoi ça ' +
          'sert. Un vieux vous dit que le vent dans le fil fait un bruit qu’il ' +
          'n’aime pas.',
        'Vous ne lui expliquez pas. Vous n’êtes pas sûr d’avoir les mots.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'L’appareil tient sur une table. Il n’a pas besoin du jour, ni du temps ' +
          'clair, ni d’une ligne de vue. Sur la tour, un brouillard d’octobre coûtait ' +
          'une journée entière ; ici il ne coûte rien.',
        'À l’autre bout de la section, un garçon de vingt ans manœuvre le même ' +
          'appareil. Célestin Aubry. Vous ne l’avez jamais vu.',
      ],
    },
    {
      kind: 'send',
      text: 'VVV DE {sine}',
      to: 'Célestin, à l’autre bout',
      hint:
        'Trois V, puis votre signature : c’est l’essai de ligne, et cela n’a pas ' +
        'changé depuis. On envoie quelque chose de facile à reconnaître, et on écoute.',
    },
    {
      kind: 'receive',
      text: 'R DE CA',
      from: 'CA',
      wpm: 8,
      note: 'R pour reçu. Deux lettres pour lui, deux pour vous : la ligne est ouverte.',
    },
    {
      kind: 'recit',
      text: [
        'Vous restez la main sur le manipulateur plus longtemps qu’il ne faudrait.',
        'Sur la tour, par temps clair, il fallait quatre minutes pour porter un mot ' +
          'jusqu’à la station suivante, et il fallait qu’on puisse la voir. Là, il a ' +
          'fallu le temps de lever le doigt. Vous avez fait le métier pendant onze ' +
          'ans et vous venez d’en changer en une seconde.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Le service, lui, ne s’émeut pas. Chaque soir, l’état de la section part ' +
          'vers Rennes, dans les termes exacts, sans un mot de plus.',
      ],
    },
    {
      kind: 'send',
      text: 'LIGNE OUVERTE RENNES BREST RIEN A SIGNALER DE {sine}',
      to: 'Rennes',
      hint:
        'Le rapport du soir. Cinquante caractères : la première fois que vous ' +
        'transmettez une phrase entière de votre main.',
    },
    {
      kind: 'recit',
      text: [
        'Trois jours plus tard, la ligne tombe.',
        'Pas de tempête, pas de foudre : un poteau à terre entre deux fermes, et le ' +
          'fil coupé net. On ne saura jamais si c’est une charrette, une hache, ou ' +
          'quelqu’un qui n’aimait pas le bruit du vent dedans.',
      ],
    },
    {
      kind: 'silence',
      seconds: 14,
      text: 'Le manipulateur ne rend plus rien. Le fil est mort.',
    },
    {
      kind: 'recit',
      text: [
        'Et le message doit partir quand même.',
        'Alors vous faites ce que vous savez faire depuis onze ans : vous montez à ' +
          'la tour, vous braquez la lunette, et vous passez la nouvelle par les bras ' +
          'de bois. Le vieux système répare le neuf. Personne ne le notera nulle part, ' +
          'et vous y pensez encore quarante ans plus tard.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Le fil est rétabli le lendemain à midi. L’essai revient, propre.',
        'Puis Célestin fait une chose qui n’est pas dans le règlement. La ligne est ' +
          'au service, uniquement au service — et il ajoute deux mots à lui, au bout ' +
          'de l’essai, là où personne ne regarde.',
      ],
    },
    {
      kind: 'receive',
      text: 'MD DE CA LIGNE BONNE ET VOUS CA VA',
      from: 'CA',
      wpm: 9,
      note: 'Quatre mots de service, et trois qui n’en sont pas.',
    },
    {
      kind: 'recit',
      text: [
        'Vous regardez la question écrite sur votre bande de papier.',
        'En onze ans de tour, personne ne vous a jamais demandé comment vous alliez ' +
          'par le télégraphe. C’était impossible : les bras ne disaient que ce que ' +
          'l’administration avait chiffré. Vous tenez là deux mots qui ne servent à ' +
          'rien, qui ne rapportent rien, et qui vous coûteraient votre place.',
        'Vous répondez.',
      ],
    },
    {
      kind: 'send',
      text: 'CA VA MERCI DE {sine}',
      to: 'CA',
      hint: 'Quatre mots. C’est peu. C’est la première conversation de votre vie.',
    },
    {
      kind: 'epilogue',
      text: [
        'La France a résisté au télégraphe électrique plus longtemps que ses voisins, ' +
          'précisément pour la raison qu’avance le père de Modéré : le réseau Chappe ' +
          'marchait, il était à l’État, et un fil se coupe. Les deux systèmes ont ' +
          'coexisté une dizaine d’années, le temps que les lignes électriques couvrent ' +
          'le pays.',
        'L’essai de ligne par une suite de V est réel et se pratique encore ' +
          'aujourd’hui : c’est la suite la plus reconnaissable du code. Les échanges ' +
          'personnels sur les lignes de service, eux, étaient interdits, ce qui ne les ' +
          'a jamais empêchés d’exister.',
        'Célestin Aubry est inventé, comme les {nom}. La boue, les poteaux tous les ' +
          'soixante pas et les coupures de fil ne le sont pas.',
      ],
    },
  ],
};

const LA_DERNIERE_TOUR: Episode = {
  id: 'la-derniere-tour',
  generation: 1,
  year: 1855,
  title: 'La dernière tour',
  summary: 'On ferme les tours. Et le premier télégramme d’un inconnu arrive.',
  sound: { timbre: 'relais', snrDb: 20 },
  beats: [
    {
      kind: 'recit',
      text: [
        'La circulaire tient en quatre lignes et met soixante ans par terre.',
        'Les stations du réseau aérien de la section sont supprimées. Le matériel ' +
          'sera démonté, les bras déposés, les bâtiments rendus. Les agents seront ' +
          'employés au service électrique ou remerciés.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'On vous charge de fermer les tours de votre section. C’est logique : vous ' +
          'les connaissez toutes, vous avez servi dans la moitié d’entre elles, et ' +
          'vous êtes celui qui a le mieux réussi le passage au fil.',
        'On ne vous demande pas si vous en avez envie. Personne n’y a pensé, et vous ' +
          'non plus.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'La dernière est celle où votre père a servi dix-neuf ans.',
        'Il est mort l’hiver d’avant, en tenant jusqu’au bout que le fil ne durerait ' +
          'pas. Vous montez seul. La corde des bras est raide de sel, la lunette est ' +
          'piquée, et le plancher grince exactement là où il grinçait.',
        'Vous levez les bras une dernière fois. Il n’y a personne pour recopier la ' +
          'figure : la tour suivante est déjà démontée. Vous le faites quand même, ' +
          'proprement, comme on vous l’a appris.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'En bas, il reste à l’annoncer par le fil. Dans les termes exacts, sans un ' +
          'mot de plus.',
      ],
    },
    {
      kind: 'send',
      text: 'STATION AERIENNE FERMEE CE JOUR SERVICE ASSURE PAR LA LIGNE DE {sine}',
      to: 'Rennes',
      hint:
        'Soixante-huit caractères pour enterrer un système qui a servi la France ' +
        'pendant soixante ans. Le service ne fait pas de phrases.',
    },
    {
      kind: 'silence',
      seconds: 12,
      text: 'Rennes accuse réception. Puis plus rien pendant une heure.',
    },
    {
      kind: 'recit',
      text: [
        'Puis l’appareil repart, et ce n’est pas du service.',
        'Depuis quatre ans, n’importe qui peut faire porter un télégramme. Il suffit ' +
          'de payer au guichet. Vous le saviez ; vous n’en aviez encore jamais reçu ' +
          'dans cette station perdue, où les gens s’écrivent des lettres et attendent ' +
          'huit jours.',
      ],
    },
    {
      kind: 'receive',
      text: 'POUR VEUVE LE GOFF AU BOURG LE PETIT EST NE CE MATIN TOUT VA BIEN',
      from: 'Rennes',
      wpm: 10,
      note:
        'Un télégramme privé. Il ne vous est pas destiné, et vous devez le lire ' +
        'entièrement pour pouvoir le porter.',
    },
    {
      kind: 'recit',
      text: [
        'Vous restez devant la bande sans bouger.',
        'Pendant onze ans sur les tours, vous avez fait passer des ordres, des ' +
          'nominations, peut-être des guerres, et vous n’en avez jamais lu un seul ' +
          'mot : la clef était ailleurs, et c’était la règle. Vous tenez là ' +
          'quatorze mots qu’une grand-mère attend, et vous êtes le premier à les ' +
          'connaître.',
        'Ce n’est pas le fil qui a tout changé. C’est ça.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Claude a sept ans. Il monte les marches quatre à quatre, s’assied sur le ' +
          'tabouret trop haut, et met la main sur le manipulateur avant que vous ' +
          'ayez pu dire non.',
        'Vous ne dites pas non.',
      ],
    },
    {
      kind: 'send',
      text: 'R DE {sine}',
      to: 'Rennes',
      hint: 'Reçu. On portera le télégramme au bourg avant la nuit.',
    },
    {
      kind: 'epilogue',
      text: [
        'Le réseau Chappe a été abandonné au milieu des années 1850, ligne par ligne, ' +
          'à mesure que le fil couvrait le pays. Les tours ont été vendues, démontées ' +
          'ou laissées à l’abandon ; il en reste quelques-unes, restaurées.',
        'La date qui compte pour ce chapitre est 1851 : la loi ouvre le télégraphe à ' +
          'la correspondance privée. Jusque-là, l’instrument appartenait à l’État et ' +
          'ne transportait que ses affaires. C’est ce jour-là que le télégraphe cesse ' +
          'd’être une machine de gouvernement pour devenir ce qu’il est resté — le ' +
          'moyen par lequel on apprend une naissance, une mort, un retard de train.',
        'Le stationnaire qui relayait sans comprendre est un fait, pas une image : ' +
          'le code Chappe était tenu secret et seuls les postes extrêmes le lisaient. ' +
          'Les {nom} sont inventés ; ce qu’ils font ne l’est pas.',
      ],
    },
  ],
};


/**
 * Génération II — Claude Duguet, né dans le fil.
 *
 * Modéré avait vu le monde changer ; Claude, lui, naît après. Le télégraphe
 * est pour lui ce que l'eau est au poisson, et son arc est l'inverse de celui
 * de son père : il ne découvre pas ce que le fil apporte, il découvre ce qu'il
 * coûte, et ce qui reste quand on le coupe.
 */

const LE_FIL_SOUS_ATLANTIQUE: Episode = {
  id: 'le-fil-sous-atlantique',
  generation: 2,
  year: 1869,
  title: 'Le fil sous l’Atlantique',
  summary: 'Un câble part de Brest vers l’Amérique, et un mot coûte une fortune.',
  sound: { timbre: 'relais', snrDb: 12 },
  beats: [
    {
      kind: 'recit',
      text: [
        'Vous avez vingt et un ans et vous n’avez jamais vu une tour fonctionner.',
        'Votre père en parle encore — les bras, la lunette, le brouillard d’octobre ' +
          'qui coûtait une journée — et vous l’écoutez comme on écoute une histoire ' +
          'de diligence. Pour vous, un message va d’un bout à l’autre du pays parce ' +
          'que c’est ainsi. Vous êtes de la première génération à qui personne n’a ' +
          'eu besoin d’expliquer le miracle.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Cet été-là, à Brest, on déroule un fil vers l’Amérique.',
        'Les Anglais l’ont fait il y a trois ans, après deux échecs et un câble qui ' +
          'n’avait tenu que trois semaines. Cette fois c’est une ligne française, et ' +
          'elle part de chez vous. Le navire qui la pose est le plus grand jamais ' +
          'construit ; il porte trois mille kilomètres de cuivre dans son ventre et ' +
          'il avance au pas d’un homme.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'On vous explique la difficulté, et elle n’a rien à voir avec ce que vous ' +
          'imaginiez.',
        'À cette longueur, le signal n’arrive pas : il transpire. Ce qui sort à ' +
          'l’autre bout est si faible qu’aucun appareil ordinaire ne le rend audible. ' +
          'On le lit à l’œil, sur un miroir suspendu à un fil de soie, qui renvoie ' +
          'une tache de lumière sur une règle graduée. Un opérateur passe ses ' +
          'journées à regarder une lueur trembler d’un côté ou de l’autre.',
        'Un point à gauche, un trait à droite. C’est le même alphabet, et personne ' +
          'ne l’entend.',
      ],
    },
    {
      kind: 'send',
      text: 'VVV DE {sine} PRET POUR ESSAI',
      to: 'Brest, la station du câble',
      hint: 'La ligne de terre, elle, marche comme d’habitude.',
    },
    {
      kind: 'receive',
      text: 'ESSAI RECU CABLE TIENT',
      from: 'Brest',
      wpm: 7,
      note:
        'Lent, et pour une fois ce n’est pas une politesse : à cette distance, ' +
        'personne ne sait faire autrement.',
    },
    {
      kind: 'recit',
      text: [
        'Puis on vous donne le tarif, et vous croyez à une erreur d’écriture.',
        'Un mot vers l’Amérique coûte davantage qu’une journée de votre salaire. Pas ' +
          'une phrase : un mot. On ne rédige donc pas, on ampute. Les articles sautent, ' +
          'les verbes aussi quand on peut, et il reste une langue sèche que les gens du ' +
          'métier lisent sans effort et qui paraît brutale à tous les autres.',
        'Tout ce que vous croyez savoir du style télégraphique vient de là. Ce n’est ' +
          'pas une mode, c’est une facture.',
      ],
    },
    {
      kind: 'send',
      text: 'CABLE OUVERT CE JOUR TARIF SEIZE FRANCS LE MOT DE {sine}',
      to: 'Rennes',
      hint:
        'Cinquante-six caractères. Sur la ligne de terre ils ne coûtent rien ; ' +
        'de l’autre côté du câble, ils vaudraient un mois de gages.',
    },
    {
      kind: 'recit',
      text: [
        'Votre père est venu. Il ne l’avait pas annoncé et il ne dit pas pourquoi.',
        'Il reste debout derrière vous, les mains dans le dos, pendant que vous ' +
          'travaillez. Il a quarante-huit ans et il en a passé onze sur des tours à ' +
          'lever des bras de bois vers l’horizon, par tous les temps, pour porter un ' +
          'mot à quatre minutes de là.',
        'Vous ne lui expliquez rien. Vous poussez le manipulateur vers lui.',
      ],
    },
    {
      kind: 'receive',
      text: 'BONNE NUIT DE BREST',
      from: 'Brest',
      wpm: 8,
      note: 'La station ferme. Rien d’important, et c’est justement le sujet.',
    },
    {
      kind: 'recit',
      text: [
        'Il n’y touche pas.',
        'Il regarde la bande sortir, il lit les quatre mots, et il hoche la tête ' +
          'comme devant un travail bien fait. Puis il remet son chapeau et rentre.',
        'Vous mettrez vingt ans à comprendre ce qu’il est venu voir : non pas ' +
          'l’Amérique, non pas le câble. Un homme assis qui reçoit, sans se lever, ' +
          'des nouvelles qui ne le concernent pas.',
      ],
    },
    {
      kind: 'epilogue',
      text: [
        'Le premier câble transatlantique durable est posé en 1866 par le Great ' +
          'Eastern, entre l’Irlande et Terre-Neuve. Deux tentatives avaient échoué, et ' +
          'un câble de 1858 n’avait tenu que quelques semaines. Un câble français ' +
          'reliant Brest à Saint-Pierre-et-Miquelon suit à la fin de la décennie.',
        'Le miroir n’est pas une image : le signal transatlantique était trop faible ' +
          'pour un appareil ordinaire, et se lisait à la déviation d’une tache de ' +
          'lumière sur une règle. Le prix par mot, lui, est la vraie raison du style ' +
          'télégraphique — la langue s’est resserrée parce qu’elle se payait au mot, ' +
          'et les abréviations que le morse emploie encore aujourd’hui en descendent ' +
          'en droite ligne.',
        'Les {nom} sont inventés. Le tarif, le miroir et le navire ne le sont pas.',
      ],
    },
  ],
};

const PARIS_COUPE: Episode = {
  id: 'paris-coupe',
  generation: 2,
  year: 1870,
  title: 'Paris coupé',
  summary: 'Une ville entière sans une seule ligne, et des oiseaux pour tout secours.',
  sound: { timbre: 'relais', snrDb: 9 },
  beats: [
    {
      kind: 'recit',
      text: [
        'La guerre est déclarée le 19 juillet, et le service manque de bras à Paris.',
        'On vous y envoie pour l’été. Vous avez vingt-deux ans, vous n’êtes jamais ' +
          'monté plus haut que Rennes, et votre mère vous fait promettre d’écrire.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Le 19 septembre, l’armée prussienne referme le cercle autour de la ville.',
        'Vous êtes dedans. Deux millions de personnes, et vous.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Les lignes tombent l’une après l’autre, et pas par accident : on les coupe.',
        'Un fil télégraphique se suit à pied. Il suffit de longer les poteaux jusqu’à ' +
          'trouver l’endroit, et de sectionner. Le nord d’abord, puis l’est, puis ' +
          'l’ouest. À la fin de la semaine, Paris n’a plus rien vers la province, ' +
          'sauf une chose à laquelle personne n’a encore pensé.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'On a immergé un câble dans le lit de la Seine, en aval, sous l’eau et sous ' +
          'leurs pieds.',
        'Il tient trois jours. Le trafic passe la nuit, en clair et vite, parce que ' +
          'personne ne sait combien de temps il reste. Vous êtes de garde quand vient ' +
          'votre tour.',
      ],
    },
    {
      kind: 'send',
      text: 'PARIS INVESTIE DEPUIS LE 19 VIVRES POUR QUATRE SEMAINES LES LIGNES DU NORD SONT',
      to: 'Tours, la délégation',
      hint:
        'Transmettez tant que ça passe. Vous n’aurez pas le temps de finir la ' +
        'phrase — ce n’est pas une figure de style.',
    },
    {
      kind: 'recit',
      text: [
        'Le manipulateur ne rend plus rien.',
        'Pas de craquement, pas de faiblesse progressive : la ligne était là, et ' +
          'elle n’y est plus. Ils ont trouvé le câble et l’ont relevé. Votre phrase ' +
          's’arrête sur « sont », et l’homme de Tours ne saura jamais ce que les ' +
          'lignes du nord étaient devenues.',
        'Vous restez la main dessus un long moment, comme votre grand-père autrefois, ' +
          'pour une raison exactement contraire.',
      ],
    },
    {
      kind: 'silence',
      seconds: 18,
      text: 'Plus une ligne. Deux millions de personnes, et pas un fil qui sorte.',
    },
    {
      kind: 'recit',
      text: [
        'Alors la ville se met à faire voler son courrier.',
        'On gonfle des ballons dans les gares désaffectées, on y met un homme, des ' +
          'sacs de lettres et des cages. Ils partent au petit jour, au hasard du vent. ' +
          'Une soixantaine s’en va pendant le siège ; certains atterrissent en ' +
          'Bretagne, un en Norvège, quelques-uns chez l’ennemi.',
        'Vous êtes télégraphiste dans une ville où le courrier part par le ciel.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Le retour, lui, tient dans une plume.',
        'Les ballons emportent des pigeons ; on les relâche de province avec, ' +
          'attachée à une penne, une pellicule photographique grande comme un ongle ' +
          'où l’on a réduit des milliers de dépêches. À Paris, on projette la ' +
          'pellicule à la lanterne sur un mur, et des employés recopient à la main ce ' +
          'qui s’affiche, ligne après ligne.',
        'C’est là qu’on vous met. Vous avez appris un métier où la distance ne compte ' +
          'pas, et vous passez l’hiver à recopier à la plume ce qu’un oiseau a porté.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Le réseau de la ville, lui, fonctionne parfaitement.',
        'Les fils entre les mairies, les forts et les gares n’ont pas bougé : ils ne ' +
          'sortent pas du cercle, donc personne ne les a coupés. Vous transmettez ' +
          'toute la journée, vite et bien, à l’intérieur d’une ville qui ne peut ' +
          'joindre personne.',
      ],
    },
    {
      kind: 'send',
      text: 'PAIN 300 GRAMMES DEMAIN DE {sine}',
      to: 'les mairies d’arrondissement',
      hint:
        'Quatre mots qui ne quitteront pas les fortifications. On écrit court ' +
        'par habitude, maintenant, même quand plus rien ne se paie au mot.',
    },
    {
      kind: 'recit',
      text: [
        'Le 4 janvier, un employé du bureau des pigeons vous cherche dans les couloirs.',
        'Une dépêche particulière porte votre nom. Les particuliers ont le droit ' +
          'd’écrire par pigeon : quelques mots, payés au mot, réduits à la pellicule ' +
          'avec le reste. Quelqu’un, à cinq cents kilomètres, a payé pour vous dire ' +
          'très peu de choses.',
      ],
    },
    {
      kind: 'receive',
      text: 'TOUS BIEN PORTANTS TA MERE PRIE TON PERE DIT TIENS BON',
      from: 'la pellicule',
      wpm: 9,
      note:
        'Dix mots. C’est ce que la place permettait, et c’est déjà beaucoup ' +
        'd’argent.',
    },
    {
      kind: 'recit',
      text: [
        'Dix mots pour un hiver.',
        'Votre père a passé sa vie à raccourcir des phrases pour économiser une ' +
          'ligne, et il a choisi celles-là. Vous les relisez toute la nuit en cherchant ' +
          'ce qu’il a supprimé.',
      ],
    },
    {
      kind: 'epilogue',
      text: [
        'Paris est investie du 19 septembre 1870 au 28 janvier 1871. Les lignes ' +
          'télégraphiques sont coupées méthodiquement, et un câble immergé dans la ' +
          'Seine, qui a permis quelques jours de trafic, est repéré puis relevé.',
        'Les ballons montés — une soixantaine pendant le siège — ont emporté du ' +
          'courrier, des voyageurs et des pigeons. Le retour se faisait par ces ' +
          'pigeons, porteurs de pellicules microphotographiques mises au point par ' +
          'Dagron : les dépêches y étaient réduites au point qu’une seule pellicule ' +
          'en contenait des milliers, et on les projetait à Paris pour les recopier. ' +
          'Des particuliers pouvaient y faire passer quelques mots, payés au mot.',
        'Le réseau intérieur de la ville continuait de fonctionner : c’est ce que ' +
          'l’épisode retient, et c’est ce qui rend la situation si étrange — des ' +
          'télégraphistes en parfait état de marche, dans une ville qui ne pouvait ' +
          'joindre personne. Claude {nom} est inventé. Le reste est arrivé.',
      ],
    },
  ],
};

const LA_DEMANDE: Episode = {
  id: 'la-demande',
  generation: 2,
  year: 1876,
  title: 'La demande',
  summary: 'Ce qu’on ose écrire sur une ligne de service, et ce qu’on n’ose pas.',
  optional: true,
  sound: { timbre: 'relais', snrDb: 20 },
  beats: [
    {
      kind: 'recit',
      text: [
        'Elle s’appelle Honorine et elle tient le bureau de poste de Landerneau.',
        'Vous ne l’avez vue que deux fois, aux réunions de service, et vous ' +
          'travaillez sur la même ligne depuis quatorze mois. Vous connaissez sa main ' +
          'mieux que son visage : elle envoie serré, très régulier, avec un T qu’elle ' +
          'tient un peu trop longtemps.',
        'Vous avez vingt-huit ans et vous n’avez rien osé.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Votre père, à qui personne n’a rien demandé, raconte à table l’histoire de ' +
          'Célestin Aubry, en 1852, qui lui avait glissé trois mots hors service au ' +
          'bout d’un essai de ligne.',
        '« Ça m’aurait coûté ma place », dit-il, content de lui. « Et ça ne m’a rien ' +
          'coûté du tout. »',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Le lendemain, l’essai de ligne du matin part comme les autres.',
        'Vous laissez passer trois secondes, et vous ajoutez ce qui n’a rien à faire ' +
          'sur un fil de l’administration.',
      ],
    },
    {
      kind: 'send',
      text: 'HR {sine} VOULEZ VOUS DE MOI',
      to: 'Landerneau',
      hint: 'Six mots. Vous avez compté trois fois s’il n’y avait pas moyen de faire plus court.',
    },
    {
      kind: 'silence',
      seconds: 20,
      text: 'La ligne ne rend rien pendant un temps très long.',
    },
    {
      kind: 'receive',
      text: 'R',
      from: 'Landerneau',
      wpm: 10,
      note: 'Un seul caractère. Dans le service, il veut dire : reçu.',
    },
    {
      kind: 'recit',
      text: [
        'Vous restez devant l’appareil sans savoir ce que vous venez de lire.',
        'Reçu. Accusé de réception. Le mot le plus neutre du métier, celui qu’on ' +
          'envoie deux cents fois par jour sans y penser, et qui ne veut strictement ' +
          'rien dire d’autre.',
        'Puis l’appareil repart.',
      ],
    },
    {
      kind: 'receive',
      text: 'OUI',
      from: 'Landerneau',
      wpm: 10,
    },
    {
      kind: 'recit',
      text: [
        'Modéré Duguet naîtra deux ans plus tard, et portera le prénom de son ' +
          'grand-père comme le veut l’usage.',
        'Sa mère lui apprendra le morse avant l’alphabet.',
      ],
    },
  ],
};

/**
 * Génération III — Modéré Duguet, celui qui entend ce qui n'est relié à rien.
 *
 * Son grand-père transmettait sans comprendre, son père a vu le fil se couper.
 * Lui voit disparaître le fil lui-même — et découvre que ce qui le remplace
 * n'appartient plus à personne : tout le monde entend tout, en même temps.
 */

const TROIS_POINTS: Episode = {
  id: 'trois-points',
  generation: 3,
  year: 1901,
  title: 'Trois points',
  summary: 'Une lettre traverse l’Atlantique sans fil, et personne ne peut le prouver.',
  sound: { timbre: 'etincelle', snrDb: 2 },
  beats: [
    {
      kind: 'recit',
      text: [
        'Votre mère vous a appris le morse avant l’alphabet. Vous aviez quatre ans, ' +
          'elle tenait le bureau de Landerneau, et elle frappait votre prénom sur le ' +
          'bord de la table pour vous faire venir manger.',
        'À vingt-trois ans, vous êtes le troisième Duguet sur les lignes et vous n’avez ' +
          'jamais envisagé autre chose. Le fil est votre métier, votre maison et votre ' +
          'nom.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Depuis quelques années, des gens sérieux prétendent s’en passer.',
        'Ils font claquer une étincelle entre deux boules de laiton, et à cent mètres ' +
          'de là un appareil réagit. Sans fil. Le premier qui vous l’a raconté était ' +
          'ivre, et vous l’avez cru quand même, parce qu’il vous a montré le journal.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Le son n’a rien à voir avec ce que vous connaissez.',
        'Un manipulateur sur une ligne, c’est un claquement propre. Une étincelle, ' +
          'c’est un raclement — un bruit d’arrachement qui couvre la moitié de la ' +
          'bande et que les voisins entendent aussi bien que vous. Il n’y a plus de ' +
          'fil, donc il n’y a plus de destinataire : tout le monde reçoit tout.',
        'Vous mettrez dix ans à mesurer ce que cette phrase contient.',
      ],
    },
    {
      kind: 'receive',
      text: 'VVV DE FL',
      from: 'un poste de la côte',
      wpm: 10,
      sound: { snrDb: 5 },
      note:
        'Un essai à quelques milles, dans des conditions honnêtes. Retenez ce que ' +
        'ça donne : la suite ne ressemblera pas à ça.',
    },
    {
      kind: 'recit',
      text: [
        'Le 12 décembre, une dépêche traverse les bureaux et personne ne travaille ' +
          'de l’après-midi.',
        'Un Italien installé à Terre-Neuve annonce avoir reçu un signal parti de ' +
          'Cornouailles. Trois mille kilomètres. Pas de câble, pas de relais, rien ' +
          'entre les deux que l’Atlantique et la courbure de la Terre — dont tous les ' +
          'traités disent qu’elle rend la chose impossible.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Ce qu’il dit avoir reçu tient en une lettre.',
        'Pas une phrase, pas un mot : la lettre S. Trois points. Répétée pendant des ' +
          'heures depuis l’autre rive, dans l’espoir qu’un fragment passe.',
        'Il n’avait pas d’enregistreur. Une antenne tenue par un cerf-volant, un ' +
          'écouteur contre l’oreille, et son assistant à côté de lui. Il n’existe ' +
          'aucune trace de ce qu’il a entendu, sinon qu’il l’a dit.',
      ],
    },
    {
      kind: 'receive',
      text: 'S',
      from: 'l’autre rive, peut-être',
      wpm: 6,
      sound: { snrDb: 1 },
      note:
        'Trois points dans ce vacarme. Écoutez plusieurs fois si vous voulez. La ' +
        'question n’est pas de savoir ce que c’est — c’est de savoir si c’est là.',
    },
    {
      kind: 'recit',
      text: [
        'Et voilà le problème, celui que les savants soulèvent dès le lendemain.',
        'Une décharge atmosphérique, un contact qui frotte, un orage à trois cents ' +
          'kilomètres : tout cela fait des clics. Trois clics d’affilée dans une nuit ' +
          'd’hiver, ce n’est pas un événement rare, c’est un mardi.',
        'Un homme qui écoute pendant des heures en espérant trois points finit par ' +
          'les entendre. Ce n’est pas de la malhonnêteté, c’est de l’oreille — et ' +
          'vous, qui copiez depuis l’enfance, vous savez mieux que quiconque à quel ' +
          'point elle arrange ce qu’elle attend.',
      ],
    },
    {
      kind: 'receive',
      text: 'S',
      from: 'la bande, ou rien',
      wpm: 6,
      sound: { snrDb: 0 },
      note: 'Encore une fois. Notez ce que vous croyez avoir entendu, et rien de plus.',
    },
    {
      kind: 'recit',
      text: [
        'Au bureau, on se divise en deux camps le soir même, et vous n’êtes ni dans ' +
          'l’un ni dans l’autre.',
        'Les anciens haussent les épaules : sans trace écrite, ce n’est pas une ' +
          'expérience, c’est un témoignage. Les jeunes trouvent le doute mesquin. ' +
          'Vous, vous pensez à autre chose, et vous le gardez pour vous parce que ' +
          'ça n’a rien à voir avec la question posée.',
        'Si c’est vrai, alors le fil que votre arrière-grand-père a vu remplacer les ' +
          'tours vient d’être remplacé à son tour. Et vous avez vingt-trois ans.',
      ],
    },
    {
      kind: 'send',
      text: 'DE {sine} RIEN A SIGNALER CETTE NUIT',
      to: 'Rennes',
      hint: 'Le service continue, quoi qu’il arrive de l’autre côté de l’Atlantique.',
    },
    {
      kind: 'epilogue',
      text: [
        'Le 12 décembre 1901, Guglielmo Marconi annonce avoir reçu à Signal Hill, ' +
          'près de Saint-Jean de Terre-Neuve, la lettre S émise depuis Poldhu, en ' +
          'Cornouailles. L’antenne était portée par un cerf-volant, la réception se ' +
          'faisait à l’écouteur, et aucun appareil n’a rien enregistré : il n’existe ' +
          'de l’événement que le témoignage de Marconi et de son assistant Kemp.',
        'La contestation est immédiate et sérieuse. Les parasites atmosphériques ' +
          'produisent des clics ; une oreille qui guette trois points pendant des ' +
          'heures est mal placée pour jurer les avoir entendus ; et la théorie de ' +
          'l’époque n’expliquait pas comment une onde aurait suivi la courbure du ' +
          'globe. On sait aujourd’hui que la haute atmosphère la réfléchit, ce que ' +
          'personne ne soupçonnait alors, et que les conditions de décembre pouvaient ' +
          'le permettre. La plupart des historiens penchent pour l’authenticité sans ' +
          'pouvoir la démontrer.',
        'Le poste à étincelle est réel, et son bruit aussi : un émetteur crachait ' +
          'sur une large portion de la bande, ce qui rendait le partage impossible et ' +
          'conduira aux règlements internationaux. Les {nom} sont inventés.',
      ],
    },
  ],
};

const LA_MAIN: Episode = {
  id: 'la-main',
  generation: 3,
  year: 1909,
  title: 'La main',
  summary: 'On reconnaît un opérateur à sa frappe comme on reconnaît un pas dans l’escalier.',
  optional: true,
  sound: { timbre: 'relais', snrDb: 18 },
  beats: [
    {
      kind: 'recit',
      text: [
        'Il y a une chose que le métier n’enseigne pas et que tout le monde finit ' +
          'par savoir : deux opérateurs ne frappent jamais pareil.',
        'Les durées sont réglementées, les proportions apprises, et pourtant chacun ' +
          'a sa main. L’un tasse ses points, l’autre traîne sur les traits, un ' +
          'troisième laisse un souffle avant chaque mot comme s’il réfléchissait. On ' +
          'appelle ça la main, et au bout de deux ans sur la même ligne on reconnaît ' +
          'ses correspondants sans qu’ils se nomment, exactement comme un pas dans ' +
          'un escalier.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Ce mardi de novembre, Landerneau ouvre à sept heures et vous levez la tête ' +
          'avant d’avoir compris pourquoi.',
        'Ce n’est pas le titulaire. Celui-là attaque sec et va vite. Là, quelqu’un ' +
          'tient le T une fraction de trop, régulièrement, sur chaque T, depuis ' +
          'toujours.',
      ],
    },
    {
      kind: 'receive',
      text: 'BUREAU OUVERT DE LANDERNEAU',
      from: 'Landerneau',
      wpm: 12,
      note: 'Rien que du service. Écoutez la main, pas les mots.',
    },
    {
      kind: 'recit',
      text: [
        'Votre mère a soixante et un ans et n’a plus tenu un manipulateur depuis ' +
          'huit ans.',
        'Le titulaire est malade, on a cherché quelqu’un dans le bourg, et il se ' +
          'trouve qu’il y avait, au-dessus de l’épicerie, une vieille dame qui avait ' +
          'fait ça toute sa vie.',
      ],
    },
    {
      kind: 'send',
      text: 'HR {sine} BONJOUR MAMAN',
      to: 'Landerneau',
      hint: 'Sur une ligne de service. Comme votre père en 1876, et pour la même raison.',
    },
    {
      kind: 'receive',
      text: 'JE SAVAIS QUE TU RECONNAITRAIS',
      from: 'Landerneau',
      wpm: 12,
    },
    {
      kind: 'recit',
      text: [
        'Honorine Duguet tiendra le bureau onze jours, puis le titulaire reviendra ' +
          'et elle remontera chez elle.',
        'Elle meurt l’hiver suivant. Pendant des années, il vous arrivera de lever la ' +
          'tête au milieu d’un trafic ordinaire parce que quelqu’un, quelque part, ' +
          'aura tenu un T une fraction de trop.',
      ],
    },
  ],
};

const MGY: Episode = {
  id: 'mgy',
  generation: 3,
  year: 1912,
  title: 'MGY',
  summary: 'La nuit du 14 avril, une routine qui se brise.',
  sound: { timbre: 'etincelle', snrDb: 6 },
  receiverOpen: true,
  beats: [
    {
      kind: 'recit',
      text: [
        'Onze ans que la lettre S a traversé l’Atlantique, et le monde ne s’en est ' +
          'pas remis.',
        'Les navires ont des postes, les côtes ont des stations, et vous avez ' +
          'trente-quatre ans. Vous avez quitté le fil pour la bande sans jamais vous ' +
          'poser la question : on vous a proposé, vous avez dit oui, votre père a ' +
          'trouvé ça imprudent.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Le métier a changé de nature et personne ne le dit encore à voix haute.',
        'Sur un fil, un message va d’un point à un autre. Ici, il part dans toutes ' +
          'les directions à la fois, et n’importe qui peut l’entendre. Les opérateurs ' +
          'se connaissent tous, se reconnaissent à la main, se saluent la nuit quand ' +
          'le trafic tombe. Il y a dans cette bande quelque chose qui ressemble à un ' +
          'village, et vous n’aviez jamais eu ça sur une ligne.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Vingt-trois heures quarante. Le trafic de la journée est écoulé : deux ' +
          'télégrammes de courtoisie, un relevé de position, et la liste de passagers ' +
          'que Cape Race réclamait depuis midi.',
        'Votre grand-père vous a appris à ne jamais couper la veille avant minuit. ' +
          'Il disait que la nuit, l’Atlantique porte loin, et qu’un poste qui se tait ' +
          'n’entend rien.',
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
      kind: 'receive',
      text: 'CQD DE MGY POSITION 41.44 N 50.24 W',
      from: 'MGY',
      wpm: 14,
      note: 'CQD est l’appel de détresse d’avant SOS. Les deux coexistent en 1912.',
      irruption: {
        after: 5,
        label: 'Décoder le signal',
        text: [
          'Vous vous levez pour vous dégourdir les jambes, et vous passez un coup de ' +
            'balai sous la table. Il y a trois semaines que vous vous dites qu’il ' +
            'faudrait le faire.',
          'Le grésillement du récepteur remplit la cabine. C’est un bruit qu’on cesse ' +
            'd’entendre au bout de quelques jours et qui manque terriblement quand il ' +
            's’arrête ; ce soir il est presque confortable. Vos pensées partent ' +
            'ailleurs — la liste de passagers, Cape Race, la lettre que vous n’avez ' +
            'toujours pas écrite.',
          'À vingt-trois heures cinquante, le grésillement change de nature.',
        ],
      },
    },
    {
      kind: 'recit',
      text: [
        'MGY. Vous connaissez l’indicatif : il est neuf, il est sur toutes les listes ' +
          'depuis une semaine. Le plus grand navire jamais construit vient de demander ' +
          'de l’aide à quatre cents milles de la côte.',
        'Et vous connaissez la main. Un garçon rapide, un peu sec sur les traits, qui ' +
          'a passé les trois derniers jours à écouler des télégrammes de passagers ' +
          'fortunés vers Cape Race, et qui s’en plaignait la nuit.',
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
      kind: 'recit',
      text: [
        'La bande se remplit d’un coup.',
        'Tout le monde a entendu, parce que tout le monde entend toujours tout. ' +
          'Dix postes appellent en même temps, se couvrent les uns les autres, et ' +
          'personne ne s’efface. Ce village dont vous étiez si fier est en train de ' +
          'se rendre inaudible au pire moment.',
        'Il faut répondre court. Très court. Chaque mot que vous ajoutez est un mot ' +
          'qu’un autre n’entend pas.',
      ],
    },
    {
      kind: 'send',
      text: 'MGY DE {sine} R COMING',
      to: 'MGY',
      hint: 'On accuse réception et on annonce qu’on fait route. Rien d’autre.',
    },
    {
      kind: 'silence',
      seconds: 20,
      text: 'Entre deux appels, il y a des trous. Personne ne sait ce qu’ils veulent dire.',
    },
    {
      kind: 'recit',
      text: [
        'À une heure quarante-cinq, la main de MGY faiblit.',
        'Ce n’est pas l’opérateur qui ralentit : c’est le courant. Les dynamos ' +
          'meurent avec le navire, et l’étincelle a besoin de puissance. Le signal ' +
          'devient mou, traînant, à peine formé.',
        'Vous avez copié des mains toute votre vie. C’est la première fois que vous ' +
          'entendez une machine mourir.',
      ],
    },
    {
      kind: 'receive',
      text: 'CQD SOS DE MGY',
      from: 'MGY',
      wpm: 9,
      sound: { snrDb: 0 },
      note: 'Ce qu’il en reste.',
    },
    {
      kind: 'recit',
      text: [
        'Puis plus rien, et le plus rien dure jusqu’au matin.',
        'Un navire à cinquante-huit milles a fait route et recueilli sept cent douze ' +
          'personnes. Un autre, beaucoup plus près, n’a rien entendu : son opérateur ' +
          'unique avait coupé sa veille pour la nuit et dormait à trente kilomètres ' +
          'du naufrage.',
        'Votre grand-père disait qu’un poste qui se tait n’entend rien. Il parlait ' +
          'd’un fil, dans une cuisine, en 1844.',
      ],
    },
    {
      kind: 'epilogue',
      text: [
        'Le Titanic a émis pendant environ deux heures dans la nuit du 14 au 15 avril ' +
          '1912, d’abord en CQD puis en SOS, sous l’indicatif MGY. Le Carpathia a fait ' +
          'route et recueilli les survivants. Le Californian, beaucoup plus proche, ' +
          'n’avait qu’un opérateur, qui avait cessé la veille pour la nuit.',
        'Deux conséquences directes, et ce sont elles qui comptent pour ce site. La ' +
          'veille radio permanente devient obligatoire sur les navires de commerce, ' +
          'avec plusieurs opérateurs quand il le faut. Et l’encombrement de la bande ' +
          'cette nuit-là — des dizaines de postes se couvrant les uns les autres — ' +
          'accélère la discipline du trafic : priorité absolue à la détresse, silence ' +
          'des autres, procédure courte. Tout ce que le morse a de sec vient de nuits ' +
          'comme celle-là.',
        'La famille {nom} est inventée. Les indicatifs, les positions, l’heure et la ' +
          'teneur des messages ne le sont pas.',
      ],
    },
  ],
};

const LA_TOUR_QUI_ECOUTE: Episode = {
  id: 'la-tour-qui-ecoute',
  generation: 3,
  year: 1917,
  title: 'La tour qui écoute',
  summary: 'Copier parfaitement un message dont on ne comprendra jamais un mot.',
  sound: { timbre: 'etincelle', snrDb: 4 },
  beats: [
    {
      kind: 'recit',
      text: [
        'On voulait la démolir en 1909. Elle avait vingt ans, son bail expirait, et ' +
          'Paris la trouvait laide.',
        'Ce qui l’a sauvée n’est pas son architecture : c’est qu’on avait posé une ' +
          'antenne dessus. Trois cents mètres de fer au milieu d’une capitale, c’est ' +
          'le plus beau support d’Europe, et l’armée l’a compris avant tout le monde.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Vous y êtes affecté en 1917, à trente-neuf ans, parce que vous copiez vite ' +
          'et proprement dans le bruit.',
        'La station n’émet presque pas. Elle écoute. Toute la journée, toute la nuit, ' +
          'des hommes en rangs devant des postes recopient ce que l’ennemi envoie à ' +
          'l’ennemi — et qui traverse la moitié de l’Europe parce que, sans fil, tout ' +
          'le monde entend tout.',
        'Votre arrière-grand-père relayait des figures dont la clef était ailleurs. ' +
          'Vous voilà à la même table, quatre-vingts ans plus tard.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'La consigne est absolue et vous la trouvez d’abord absurde : copier ce qui ' +
          'passe, exactement, sans rien corriger.',
        'Un message chiffré n’a pas de sens, donc pas de contexte, donc aucune ' +
          'possibilité de deviner. Sur du texte clair, une oreille exercée rattrape ' +
          'une lettre perdue sans même s’en apercevoir — et c’est précisément ce ' +
          'qu’il ne faut pas faire ici. Une lettre inventée peut coûter un déchiffrage.',
      ],
    },
    {
      kind: 'receive',
      text: 'GKQ WZ RMTLA HVBNE CXOP',
      from: 'la bande, quelque part à l’est',
      wpm: 15,
      note:
        'Rien de tout cela ne veut dire quoi que ce soit. Copiez ce que vous ' +
        'entendez, pas ce qui vous arrangerait.',
    },
    {
      kind: 'recit',
      text: [
        'Vous portez la feuille au bureau du chiffre, deux étages plus bas, et vous ' +
          'ne saurez jamais ce qu’elle contenait.',
        'Personne ne remonte vous le dire. Ce n’est pas du mépris, c’est la règle : ' +
          'un homme qui sait ce qu’il a copié copie moins bien la fois suivante.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Il y a une chose, pourtant, que le chiffre ne peut pas vous prendre.',
        'Vous ne comprenez pas les messages, mais vous connaissez les mains. Celui de ' +
          'Nauen frappe carré, celui de Bruxelles hésite avant les groupes, et un ' +
          'troisième, quelque part, tasse ses points exactement comme votre mère ' +
          'traînait ses traits. Vous savez quand un poste change d’opérateur. Vous ' +
          'savez quand un opérateur est fatigué.',
        'Vous le signalez une fois, et l’officier vous regarde comme si vous veniez ' +
          'de lui vendre une carte.',
      ],
    },
    {
      kind: 'receive',
      text: 'ZPQ44 LKMWE BVCXA RTNOU IHGFD SEQZL',
      from: 'le même poste, une main plus lente',
      wpm: 13,
      sound: { snrDb: 2 },
      note: 'Trente-six caractères sans un mot dedans. Il n’y a que la copie.',
    },
    {
      kind: 'recit',
      text: [
        'En novembre 1918, une station allemande demande les conditions de ' +
          'l’armistice en clair, sur la bande, à qui veut l’entendre.',
        'Vous êtes de garde. Vous copiez la demande d’un homme qui vous a fait ' +
          'travailler pendant deux ans sans que vous sachiez son nom, et vous ' +
          'comprenez chaque mot pour la première fois depuis dix-huit mois.',
      ],
    },
    {
      kind: 'send',
      text: 'RECU DE {sine} TRANSMIS AU COMMANDEMENT',
      to: 'le bureau du chiffre',
      hint: 'Le dernier message que vous porterez sans savoir. Il n’y en avait rien à savoir.',
    },
    {
      kind: 'recit',
      text: [
        'Claude a sept ans et il sait déjà son alphabet. Sa grand-mère n’aura pas eu ' +
          'le temps de le lui apprendre ; c’est vous qui vous en chargez, sur le bord ' +
          'de la table, exactement de la même façon.',
        'Vous lui tenez les T un peu trop longtemps sans même y penser.',
      ],
    },
    {
      kind: 'epilogue',
      text: [
        'La tour Eiffel devait être démontée à l’expiration de sa concession. ' +
          'L’antenne installée à son sommet, puis son usage militaire, l’ont sauvée : ' +
          'elle devient l’une des principales stations d’écoute françaises, et le ' +
          'renseignement obtenu par interception radio prend pendant la guerre une ' +
          'importance que personne n’avait prévue.',
        'La règle de copie littérale est réelle et vaut encore : sur du texte chiffré, ' +
          'l’opérateur ne doit rien reconstituer, parce qu’une lettre corrigée de bonne ' +
          'foi peut rendre un message indéchiffrable. Et la reconnaissance des ' +
          'opérateurs à leur frappe — la main — a bel et bien servi au renseignement : ' +
          'on suivait le déplacement d’une unité en suivant la main de son ' +
          'télégraphiste.',
        'Les {nom} sont inventés. Le métier qu’ils font, non.',
      ],
    },
  ],
};

/**
 * Génération IV — Claude Duguet, celui pour qui être entendu est le danger.
 *
 * Quatre générations ont cherché à porter plus loin : les bras de bois vers
 * l'horizon, le fil sous l'Atlantique, l'onde qui traverse sans support. Claude
 * hérite d'un métier dont toute l'histoire consiste à se faire entendre, et
 * passe la guerre à faire l'inverse.
 */

const LE_POSTE_A_GALENE: Episode = {
  id: 'le-poste-a-galene',
  generation: 4,
  year: 1927,
  title: 'Le poste à galène',
  summary: 'Un caillou, un fil de cuivre, et pour la première fois une voix.',
  optional: true,
  sound: { timbre: 'pur', snrDb: 14 },
  beats: [
    {
      kind: 'recit',
      text: [
        'Vous avez seize ans et votre père vous a mis un caillou dans la main.',
        'Un morceau de galène, gris, gras, qui ne ressemble à rien. Avec une bobine ' +
          'de fil enroulée sur un tube de carton, une aiguille qu’on promène sur le ' +
          'caillou jusqu’à trouver le point sensible, et un casque, cela fait un ' +
          'poste. Aucune pile. Rien qui consomme. L’onde elle-même fournit le peu ' +
          'd’énergie qu’il faut pour la rendre audible.',
        'Vous avez mis trois soirs à le monter et il tient dans une boîte à ' +
          'chaussures.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Ce qui sort du casque n’est pas ce que vous attendiez.',
        'Il y a bien du morse quelque part au fond, des stations qui se répondent, ' +
          'la respiration habituelle de la bande. Et par-dessus, quelqu’un parle. Un ' +
          'homme, à Paris, lit un bulletin d’une voix appliquée, et derrière lui un ' +
          'orchestre attend son tour.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Votre père écoute sans rien dire pendant un long moment, puis il repose le ' +
          'casque.',
        '« Mon grand-père faisait des signes avec des bras de bois. Mon père a passé ' +
          'un hiver à recopier ce qu’un pigeon avait porté. Moi j’ai copié pendant ' +
          'deux ans des lettres qui ne voulaient rien dire. »',
        'Il regarde la boîte à chaussures. « Et toi tu écoutes un monsieur lire le ' +
          'journal. »',
      ],
    },
    {
      kind: 'send',
      text: 'HR {sine} JE TENTAIS UN ESSAI',
      to: 'personne, comme en 1844',
      hint:
        'Le poste à galène ne sait que recevoir. Vous frappez quand même, sur le ' +
        'bord de la table, comme votre arrière-arrière-grand-père.',
    },
    {
      kind: 'recit',
      text: [
        'Il ne le dit pas ce soir-là, et vous ne le comprendrez que bien plus tard.',
        'Pendant quatre générations, savoir lire les points et les traits donnait ' +
          'accès à quelque chose dont les autres étaient exclus. Un homme dans une ' +
          'cuisine venait d’écouter Paris avec un caillou et trois mètres de fil.',
        'Le métier n’est pas encore mort. Mais quelqu’un vient de laisser la porte ' +
          'ouverte.',
      ],
    },
  ],
};

const CINQ_MINUTES: Episode = {
  id: 'cinq-minutes',
  generation: 4,
  year: 1943,
  title: 'Cinq minutes',
  summary: 'Émettre, c’est se faire entendre. C’est justement le problème.',
  sound: { timbre: 'pur', snrDb: 7 },
  beats: [
    {
      kind: 'recit',
      text: [
        'On vous appelle un pianiste, et vous n’avez jamais su qui avait trouvé le mot.',
        'Il est juste : les doigts, la régularité, le fait qu’on vous entende de loin ' +
          'et que ce soit tout le problème. Vous avez trente-deux ans, une valise de ' +
          'douze kilos, et une adresse qui change toutes les trois semaines.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'La valise contient un émetteur, un récepteur, un manipulateur et un jeu de ' +
          'quartz. Elle pèse le poids d’une valise de voyage, ce qui est exactement ' +
          'l’idée, et elle vous ferait fusiller si on l’ouvrait devant vous.',
        'Votre père a passé la guerre précédente dans une tour de fer, à copier ' +
          'l’ennemi en toute sécurité. Le métier n’a pas changé de gestes. Il a changé ' +
          'de conséquences.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Ils ont des camionnettes, et à l’intérieur un cadre qui tourne.',
        'Le principe est simple et vous le connaissez mieux qu’eux : une antenne ' +
          'orientable reçoit plus fort dans un axe que dans un autre. On tourne le ' +
          'cadre jusqu’au maximum, on note la direction, on recommence d’un autre ' +
          'point de la ville, et les deux droites se croisent sur un immeuble. Avec ' +
          'des appareils portatifs, ils remontent ensuite les étages.',
        'Tout ce qu’il faut pour cela, c’est que vous restiez en l’air.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'D’où la règle, que personne n’a jamais écrite et que tout le monde répète : ' +
          'cinq minutes.',
        'Au-delà, vous n’êtes plus un opérateur, vous êtes une adresse. On coupe, on ' +
          'démonte, on change de toit, et on reprend au prochain rendez-vous — heure ' +
          'fixée d’avance, fréquence fixée d’avance, parce qu’on ne peut pas se ' +
          'chercher sur une bande quand on n’a pas le droit d’appeler.',
      ],
    },
    {
      kind: 'send',
      text: 'DE {sine} QRV',
      to: 'Londres',
      hint: 'Le rendez-vous. Deux groupes, pas un de plus : on annonce qu’on est là.',
      limit: 300,
    },
    {
      kind: 'receive',
      text: 'R DE MP QRV',
      from: 'Londres',
      wpm: 18,
      note: 'Rapide. Là-bas, personne ne risque rien à aller vite.',
    },
    {
      kind: 'recit',
      text: [
        'Reste la chose que vous détestez faire et qui vous sauvera peut-être la vie.',
        'Dans chaque message, vous glissez une faute. Toujours la même, toujours au ' +
          'même endroit — un groupe de deux lettres qui ne veut rien dire, posé après ' +
          'le troisième mot. Londres le sait. Vous le savez. Personne d’autre.',
        'Si un jour ce groupe manque, cela signifie qu’un autre est assis à votre ' +
          'place, avec votre poste et vos quartz, et que Londres parle à la Gestapo.',
      ],
    },
    {
      kind: 'send',
      text: 'PARACHUTAGE RECU QX SIX COLIS DEUX HOMMES RAS DE {sine}',
      to: 'Londres',
      hint:
        'Cinquante-quatre caractères, et le QX après le troisième mot. Ce n’est ' +
        'pas une faute de frappe : c’est votre signature.',
      limit: 300,
    },
    {
      kind: 'silence',
      seconds: 16,
      text: 'Vous coupez. Dehors, une voiture roule au pas dans la rue.',
    },
    {
      kind: 'recit',
      text: [
        'Elle passe. Ce n’est probablement rien : il passe des voitures.',
        'Vous démontez quand même, l’antenne d’abord, le fil enroulé sur le bras, la ' +
          'valise refermée, et vous descendez par la cour. Vous serez ailleurs dans ' +
          'une heure. Vous avez fait ça onze fois cette année et vous n’avez jamais ' +
          'su si l’une d’elles avait servi à quelque chose.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'À la maison, votre femme a accouché en avril d’un garçon qu’on a appelé ' +
          'Modéré, comme son grand-père, comme le veut l’usage.',
        'Vous ne l’avez vu que deux fois. On ne dort pas où l’on émet, et on ne dort ' +
          'pas non plus où dort son fils.',
      ],
    },
    {
      kind: 'epilogue',
      text: [
        'Les opérateurs radio clandestins étaient surnommés pianistes. Leur poste ' +
          'tenait dans une valise, ils travaillaient sur des rendez-vous fixés à ' +
          'l’avance, et leur espérance de vie opérationnelle se comptait en mois.',
        'La goniométrie allemande fonctionnait comme décrit : relèvements croisés ' +
          'depuis plusieurs points, puis appareils portatifs pour finir l’immeuble. ' +
          'La consigne des cinq minutes est celle qu’on cite le plus souvent ; elle ' +
          'variait selon les réseaux et les époques.',
        'Les contrôles de sécurité sont réels : une erreur convenue, insérée à un ' +
          'endroit précis, prouvait que l’opérateur n’émettait pas sous la contrainte. ' +
          'Leur absence aurait dû faire cesser tout trafic. Elle a parfois été ' +
          'ignorée à Londres, avec des conséquences que l’on connaît — le cas ' +
          'néerlandais est le plus documenté. Les {nom} sont inventés ; ce dispositif ' +
          'ne l’est pas.',
      ],
    },
  ],
};

const LES_SANGLOTS_LONGS: Episode = {
  id: 'les-sanglots-longs',
  generation: 4,
  year: 1944,
  title: 'Les sanglots longs',
  summary: 'Des vers de Verlaine à la radio, et une nuit où tout le monde émet.',
  sound: { timbre: 'pur', snrDb: 6 },
  beats: [
    {
      kind: 'recit',
      text: [
        'Chaque soir, la radio de Londres lit une liste de phrases absurdes.',
        '« Jean a de longues moustaches. » « Le chat a neuf vies. » « La flèche ne ' +
          'percera pas. » Le speaker les énonce lentement, deux fois, sans les ' +
          'commenter, et personne au monde ne peut savoir laquelle veut dire quelque ' +
          'chose ni à qui.',
        'C’est l’exact contraire de votre métier. Aucun chiffre, aucune clef, aucun ' +
          'destinataire caché : on parle en clair devant l’ennemi, et l’ennemi ' +
          'n’apprend rien, parce que le sens n’est pas dans les mots.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Le 1er juin, la liste contient un vers.',
        '« Les sanglots longs des violons de l’automne. » Vous connaissez le poème ; ' +
          'tout le monde le connaît, on l’apprend à l’école. Ce soir-là il annonce ' +
          'quelque chose, et vous savez seulement qu’il faut se tenir prêt.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Le 5 au soir, la seconde moitié tombe.',
        '« Blessent mon cœur d’une langueur monotone. »',
        'Vous n’avez pas de poste à ce moment-là : vous êtes dans une cuisine, à ' +
          'sept kilomètres de votre valise, et vous mettez une heure et demie à la ' +
          'rejoindre à bicyclette.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Ce qui suit ne ressemble à rien de ce que vous avez connu.',
        'Depuis quatre ans, vous émettez cinq minutes et vous fuyez. Cette nuit-là, ' +
          'toute la France émet en même temps. La bande est pleine — pleine comme la ' +
          'nuit du naufrage dont votre père parlait, dix postes qui se couvrent, sauf ' +
          'que cette fois ils sont des centaines et qu’ils le font exprès.',
        'La goniométrie ne peut plus rien. On ne relève pas trois cents émetteurs.',
      ],
    },
    {
      kind: 'send',
      text: 'DE {sine} QX RECU MESSAGE PLAN VERT EXECUTE',
      to: 'Londres',
      hint:
        'Le QX à sa place, comme toujours. Et pour la première fois depuis 1940, ' +
        'aucune raison de compter les minutes.',
      limit: 600,
    },
    {
      kind: 'receive',
      text: 'R DE MP BONNE CHANCE OM',
      from: 'Londres',
      wpm: 20,
      note: 'OM, old man. Sur la bande, c’est ainsi qu’on se parle entre opérateurs.',
    },
    {
      kind: 'recit',
      text: [
        'Vous restez en l’air quarante minutes.',
        'Quarante. Vous n’avez pas dépassé cinq minutes depuis trois ans, et vous ' +
          'passez la nuit du 5 au 6 juin avec la main sur le manipulateur, à recevoir ' +
          'et à transmettre des ordres d’exécution, dans une bande saturée où ' +
          'personne ne cherche plus à se cacher.',
        'C’est la première fois de votre vie que vous faites le métier de votre père.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Au matin, la valise retourne sous le plancher et vous redevenez prudent.',
        'La guerre dure encore onze mois. Vous survivrez, ce qui n’était pas le plus ' +
          'probable, et vous ne le raconterez presque jamais — sauf une fois, très ' +
          'tard, à un garçon de dix-sept ans qui voudra savoir pourquoi son père ' +
          'sursaute quand une voiture ralentit dans la rue.',
      ],
    },
    {
      kind: 'epilogue',
      text: [
        'Les messages personnels de la radio de Londres sont authentiques : des ' +
          'phrases sans rapport apparent, lues en clair, dont seul le destinataire ' +
          'connaissait le sens. C’est un chiffrement parfait tant que la convention ' +
          'reste secrète, et il n’offre aucune prise à l’analyse.',
        'Les deux vers de Verlaine sont restés les plus célèbres. Leur rôle exact — ' +
          'à quel réseau ils s’adressaient, ce qu’ils déclenchaient précisément — est ' +
          'discuté par les historiens, et la version scolaire qui en fait le signal ' +
          'du débarquement pour la France entière est une simplification. Ils ont ' +
          'bien été diffusés, et quelque chose s’est bien déclenché.',
        'La saturation de la bande dans les heures du débarquement est réelle, et ' +
          'elle a effectivement mis la goniométrie hors d’état : on ne relève pas des ' +
          'centaines d’émetteurs simultanés. Les {nom} sont inventés.',
      ],
    },
  ],
};

/**
 * Génération V — Modéré Duguet, né en 1943, officier radio puis opérateur
 * de station côtière.
 *
 * C’est la génération qui assiste à la fin de son propre métier. Le fil des
 * quatre épisodes est celui-là : un homme qui apprend un savoir-faire dont
 * personne, lui compris, ne sait encore qu’il sera le dernier à l’exercer.
 * Rien de tragique là-dedans — ce qui remplace le morse en mer sauve plus de
 * vies que lui. C’est seulement la fin de quelque chose.
 */

const SEPT_KILOMETRES: Episode = {
  id: 'sept-kilometres',
  generation: 5,
  year: 1960,
  title: 'Sept kilomètres',
  summary: 'Pourquoi votre père sursaute quand une voiture ralentit dans la rue.',
  optional: true,
  sound: { timbre: 'pur', snrDb: 20 },
  beats: [
    {
      kind: 'recit',
      text: [
        'Vous avez dix-sept ans et vous avez remarqué la chose depuis longtemps.',
        'Quand une voiture ralentit devant la maison, votre père s’arrête. Pas ' +
          'longtemps — une seconde, peut-être deux. Il repose ce qu’il tient, il ' +
          'écoute, et il reprend. Il ne s’en aperçoit pas. Votre mère si, et elle ' +
          'ne dit rien.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Ce soir-là vous demandez.',
        'Il ne répond pas tout de suite. Il finit son verre, il regarde la fenêtre, ' +
          'et il vous dit de vous asseoir — ce qu’il n’a jamais fait pour vous parler.',
      ],
      speaker: '{prenom}',
    },
    {
      kind: 'recit',
      text: [
        '« Entre 1941 et 1944, j’ai porté une valise de douze kilos. »',
        '« Dedans : un émetteur, un récepteur, un manipulateur, des quartz. Je ' +
          'changeais d’adresse toutes les trois semaines. J’émettais cinq minutes, ' +
          'jamais plus, parce qu’au-delà on vous relève. »',
        '« Ils avaient des camionnettes avec un cadre qui tourne. Deux relevés, deux ' +
          'droites, et les droites se croisent sur un immeuble. Ensuite ils montent ' +
          'les étages avec des appareils portatifs. »',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Vous lui demandez comment on tient trois ans à ce régime.',
        '« On ne tient pas. On a de la chance, ou on n’en a pas. Ceux qui n’en ont ' +
          'pas eu, je ne les ai pour la plupart jamais rencontrés — on ne se voyait ' +
          'pas. Je connaissais leur main, pas leur visage. »',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Il vous raconte la nuit du 5 juin.',
        'Les vers de Verlaine, la bicyclette, sept kilomètres dans le noir pour ' +
          'rejoindre une valise cachée sous un plancher. Puis quarante minutes en ' +
          'l’air, quand il n’en avait jamais fait plus de cinq, parce que cette ' +
          'nuit-là la France entière émettait en même temps et qu’on ne relève pas ' +
          'trois cents postes.',
        '« C’est la seule fois où j’ai fait le métier de mon père. »',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Vous demandez ce que faisait son père.',
        'Il se lève, il ouvre un tiroir, et il pose sur la table un manipulateur ' +
          'droit à socle de laiton, lourd, dont le contact est usé jusqu’au creux.',
        '« Celui-ci a servi à ouvrir la ligne de Brest en 1855. Ton arrière-arrière-' +
          'grand-père s’appelait comme toi. Le sine de la famille se lit sur deux ' +
          'lettres et il n’a jamais changé de seconde lettre en cent seize ans. »',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Vous passez la soirée à apprendre les vingt-six lettres.',
        'Il vous prévient que ce sera long, que la reconnaissance à l’oreille n’a ' +
          'rien à voir avec le déchiffrage sur le papier, et qu’il ne faut jamais ' +
          'ralentir les caractères. Vous les tenez avant l’été.',
        'En septembre vous vous inscrivez à l’école des officiers radio. Personne ' +
          'dans la maison ne dit à voix haute que cela fait cinq.',
      ],
    },
  ],
};

const LE_QUART: Episode = {
  id: 'le-quart',
  generation: 5,
  year: 1965,
  title: 'Le quart',
  summary: 'Seul dans une cabine, à écouter une fréquence où il ne se passe rien.',
  sound: { timbre: 'pur', snrDb: 16 },
  beats: [
    {
      kind: 'recit',
      text: [
        'Le cargo fait cent trente-cinq mètres et vous êtes le seul à bord à savoir ' +
          'lire ce que la mer raconte autour de lui.',
        'La cabine radio tient dans quatre mètres carrés, sous la passerelle. Un ' +
          'récepteur principal, un récepteur de veille, un émetteur, une machine à ' +
          'écrire, un manipulateur, et une pendule dont le cadran porte deux secteurs ' +
          'peints en rouge.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Les deux secteurs rouges vont de la quinzième à la dix-huitième minute, et ' +
          'de la quarante-cinquième à la quarante-huitième.',
        'Vous y reviendrez. Pour l’instant il faut comprendre ce qu’est le 500.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Cinq cents kilohertz est la fréquence internationale de détresse et d’appel.',
        'Tous les navires du monde y veillent. On s’y appelle, puis on se déroute ' +
          'ailleurs pour la conversation, parce qu’il faut la laisser libre. Une ' +
          'fréquence encombrée ne sert à rien à celui qui coule.',
        'C’est une bande longue, qui contourne l’horizon et porte loin la nuit. Le ' +
          'métier tient en un mot : rester dessus.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Le second récepteur ne sert qu’à une chose : entendre douze traits.',
        'Douze traits de quatre secondes, séparés par une seconde. Aucun signal ' +
          'naturel ne ressemble à cela, et aucun trafic ordinaire non plus. Un ' +
          'appareil peut donc le reconnaître tout seul, et sonner une cloche dans la ' +
          'cabine du radio endormi.',
        'On appelle ça le signal d’alarme automatique. Il précède le SOS pour ' +
          'réveiller les navires dont l’opérateur n’est pas à son poste.',
      ],
    },
    {
      kind: 'receive',
      text: 'CQ DE FFU QTC 3 QSW 454 K',
      from: 'Une station côtière',
      wpm: 22,
      note: 'QTC 3 : trois télégrammes en attente. QSW 454 : je transmettrai sur 454 kHz.',
    },
    {
      kind: 'recit',
      text: [
        'Ceci est une liste de trafic, et c’est le pain quotidien.',
        'Quatre fois par jour, chaque station côtière appelle en aveugle et énumère ' +
          'les navires pour lesquels elle détient un message. On écoute la liste ; si ' +
          'son indicatif y figure, on répond et on va chercher. Sinon, on se tait.',
        'Ce jour-là votre indicatif n’y est pas. Vous accusez quand même : la station ' +
          'a demandé un accusé général.',
      ],
    },
    {
      kind: 'send',
      text: 'FFU DE {sine} R QRU',
      to: 'La station côtière',
      hint: 'R pour reçu, QRU pour rien à vous transmettre. Deux mots, cinq secondes.',
    },
    {
      kind: 'recit',
      text: [
        'Puis la pendule entre dans le premier secteur rouge.',
        'De la quinzième à la dix-huitième minute, plus personne n’a le droit ' +
          'd’émettre sur 500 kHz. Tout le monde se tait, et tout le monde écoute. ' +
          'Trois minutes, deux fois par heure, quarante-huit fois par jour, sur ' +
          'toutes les mers du globe en même temps.',
      ],
    },
    {
      kind: 'silence',
      seconds: 12,
      text: 'Période de silence. La bande est vide, et c’est exactement le but.',
    },
    {
      kind: 'recit',
      text: [
        'Il ne se passe rien, et il ne s’est rien passé la fois d’avant.',
        'C’est le service le plus étrange qu’un métier puisse demander : se taire à ' +
          'heure fixe pour que le plus faible des signaux ait une chance d’être ' +
          'entendu. Vous le ferez des milliers de fois. Il servira peut-être une.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Le reste du quart est du commerce.',
        'Le commandant veut prévenir l’armateur de l’heure d’arrivée ; un mécanicien ' +
          'veut annoncer une naissance ; le commissaire commande des vivres. Vous ' +
          'facturez au mot, vous inscrivez tout sur un registre, et vous transmettez.',
      ],
    },
    {
      kind: 'send',
      text: 'FFU DE {sine} QTC 1 ARRIVEE LE HAVRE LE 14 A 0600 TOUT VA BIEN A BORD',
      to: 'La station côtière',
      hint:
        'Le premier télégramme que vous facturez de votre vie. Douze mots, et une ' +
        'famille au Havre qui saura demain matin.',
    },
    {
      kind: 'receive',
      text: 'R QSL DE FFU 73 OM',
      from: 'La station côtière',
      wpm: 22,
      note: '73 : mes amitiés. On se les envoie depuis le siècle dernier.',
    },
    {
      kind: 'recit',
      text: [
        'Vous avez vingt-deux ans et vous venez de comprendre quelque chose.',
        'Votre arrière-grand-père signalait des trains sur une ligne fixe. Votre ' +
          'grand-père copiait l’ennemi dans une tour. Votre père émettait cinq ' +
          'minutes et fuyait. Vous, vous facturez au mot et vous vous taisez trois ' +
          'minutes deux fois par heure.',
        'Le geste est le même. C’est le seul métier de la famille où personne ne ' +
          'risque rien, et cela vous paraît un progrès considérable.',
      ],
    },
    {
      kind: 'epilogue',
      text: [
        'Les périodes de silence sur 500 kHz sont authentiques : de la quinzième à ' +
          'la dix-huitième minute et de la quarante-cinquième à la quarante-huitième ' +
          'de chaque heure, l’émission y était interdite pour laisser passer les ' +
          'appels de détresse. Les cadrans des pendules de cabine radio portaient ces ' +
          'secteurs peints en rouge.',
        'Le signal d’alarme automatique — douze traits de quatre secondes séparés ' +
          'par une seconde — existait bien, et déclenchait un avertisseur à bord des ' +
          'navires dont l’opérateur n’était pas de quart.',
        'Les listes de trafic, l’appel en aveugle des stations côtières et la ' +
          'facturation au mot sont exacts. Le navire et le voyage sont inventés, les ' +
          '{nom} aussi.',
      ],
    },
  ],
};

const LES_TROIS_MINUTES: Episode = {
  id: 'les-trois-minutes',
  generation: 5,
  year: 1972,
  title: 'Les trois minutes',
  summary: 'Sept ans de silences pour rien. Puis un, où il y a quelque chose.',
  sound: { timbre: 'pur', snrDb: 12 },
  beats: [
    {
      kind: 'recit',
      text: [
        'Sept ans. Vous ne comptez plus les périodes de silence.',
        'On vous a dit à l’école qu’il fallait les tenir religieusement, et vous les ' +
          'tenez, comme on continue à fermer une porte à clef dans un village où ' +
          'personne ne vole rien. La main s’arrête à la quinzième minute sans que la ' +
          'tête ait besoin d’y penser.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Cette nuit-là vous êtes au milieu de l’Atlantique nord, en février.',
        'La propagation est excellente — c’est l’hiver, il fait nuit, et les ondes ' +
          'longues contournent la terre. Vous entendez des stations que vous ' +
          'n’entendez jamais. Une pendule marque la quarante-cinquième minute.',
      ],
    },
    {
      kind: 'silence',
      seconds: 14,
      text: 'Vous levez la main du manipulateur. Trois minutes.',
    },
    {
      kind: 'receive',
      text: 'SOS SOS SOS DE FNRT FNRT FNRT',
      from: 'Très loin, très faible',
      wpm: 16,
      sound: { snrDb: 3 },
      note:
        'Le signal est au ras du bruit. Sans les trois minutes de silence, vous ne ' +
        'l’auriez pas entendu — et personne d’autre non plus.',
    },
    {
      kind: 'recit',
      text: [
        'Votre première réaction est de répondre. C’est la mauvaise.',
        'La règle est stricte et elle est bonne : celui qui entend un SOS ne répond ' +
          'pas tout de suite. Il écoute. Une station côtière ou un navire proche va ' +
          'prendre l’appel, et si trois navires répondent en même temps, personne ne ' +
          'comprend plus rien et le naufragé n’a plus de fréquence.',
        'Vous avez la main à dix centimètres du manipulateur et vous ne la posez pas.',
      ],
    },
    {
      kind: 'receive',
      text: 'SOS DE FNRT 4612 N 00840 W CALE AVANT ENVAHIE 11 A BORD',
      from: 'FNRT',
      wpm: 16,
      sound: { snrDb: 4 },
      note: 'Position, nature de l’avarie, nombre d’hommes. Dans cet ordre, toujours.',
    },
    {
      kind: 'silence',
      seconds: 10,
      text: 'Vous attendez qu’une station côtière prenne l’appel.',
    },
    {
      kind: 'recit',
      text: [
        'Personne ne répond.',
        'Vous relevez la position sur la carte : il est à quatre cents milles de la ' +
          'côte la plus proche, en pleine nuit, et son émetteur est manifestement sur ' +
          'batteries. Les stations côtières ne l’entendent pas. Les navires proches, ' +
          's’il y en a, ne l’entendent pas non plus.',
        'Vous l’entendez, vous, parce qu’il est trois heures quarante-six du matin en ' +
          'février et que la bande était vide.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'À partir de maintenant vous n’êtes plus un témoin.',
        'La procédure a un nom : le relais de détresse. Un navire qui a entendu un ' +
          'SOS auquel personne n’a répondu doit le retransmettre lui-même, avec la ' +
          'position, en indiquant clairement qu’il relaie et qu’il n’est pas le ' +
          'navire en détresse.',
        'Vous avez le droit d’écraser tout le trafic de la bande pour le faire. C’est ' +
          'même une obligation.',
      ],
    },
    {
      kind: 'send',
      text: 'SOS RELAY DE {sine} FNRT 4612 N 00840 W CALE AVANT ENVAHIE 11 A BORD',
      to: 'À tous',
      hint:
        'RELAY, pour que personne ne croie que c’est vous qui coulez. Puis sa ' +
        'position, mot pour mot, sans rien y ajouter.',
    },
    {
      kind: 'receive',
      text: 'R SOS RELAY QSL DE FFU QRT ALL',
      from: 'Une station côtière',
      wpm: 22,
      note: 'QRT ALL : que tout le monde cesse d’émettre. La bande vient d’être fermée.',
    },
    {
      kind: 'recit',
      text: [
        'Le reste ne vous appartient plus.',
        'La station côtière prend la direction des opérations, appelle les navires ' +
          'de la zone, déroute le plus proche. Vous continuez votre route, parce que ' +
          'vous êtes à onze heures de là et que vous ne serviriez à rien.',
        'On vous demande seulement de rester à l’écoute. Vous restez huit heures.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'À midi, un cargo norvégien récupère onze hommes dans un canot.',
        'Vous l’apprenez par une liste de trafic ordinaire, entre un avis de tempête ' +
          'et un télégramme commercial, et personne à bord de votre navire ne sait ' +
          'ce qui s’est passé cette nuit sauf le commandant, qui vous serre la main ' +
          'sans rien dire.',
        'Vous avez tenu peut-être quatre mille périodes de silence. Celle-là a servi.',
      ],
    },
    {
      kind: 'epilogue',
      text: [
        'La procédure de relais de détresse est authentique dans tous ses détails : ' +
          'ne pas répondre immédiatement, laisser une station mieux placée prendre ' +
          'l’appel, et relayer soi-même seulement si personne ne l’a fait — en ' +
          'signalant explicitement qu’on relaie.',
        'La propagation des ondes longues la nuit en hiver est réelle, et c’est bien ' +
          'elle qui rendait ces sauvetages à très longue distance possibles. Le ' +
          'silence imposé deux fois par heure existait précisément pour donner une ' +
          'chance aux signaux faibles.',
        'Le navire FNRT, son naufrage et le cargo norvégien sont inventés. Des ' +
          'sauvetages de ce type, déclenchés par un opérateur qui a entendu pendant ' +
          'une période de silence ce que personne d’autre n’entendait, il y en a eu ' +
          'beaucoup. Les {nom} restent inventés.',
      ],
    },
  ],
};

const NOTRE_DERNIER_CRI: Episode = {
  id: 'notre-dernier-cri',
  generation: 5,
  year: 1997,
  title: 'Notre dernier cri',
  summary: 'La dernière station côtière française ferme sa veille en morse.',
  sound: { timbre: 'pur', snrDb: 18 },
  beats: [
    {
      kind: 'recit',
      text: [
        'Vous avez cinquante-quatre ans et vous êtes à terre depuis 1981.',
        'Une station côtière, en Bretagne, face à l’ouest. Vous y faites le même ' +
          'métier que sur le cargo, de l’autre côté : c’est vous, maintenant, qui ' +
          'appelez en aveugle quatre fois par jour et qui énumérez les navires ayant ' +
          'du trafic en attente.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Ce qui arrive était annoncé depuis dix ans et vous l’avez vu venir.',
        'Un navire en détresse n’a plus besoin d’un opérateur qui sache le morse. Il ' +
          'a une balise qui, jetée à l’eau, émet toute seule vers un satellite en ' +
          'donnant sa position au mille près. Il a un appel sélectif numérique qui ' +
          'réveille les navires de la zone sans que personne ait à veiller une ' +
          'fréquence.',
        'Ce système sauve davantage de vies que le vôtre. Vous en êtes convaincu, et ' +
          'cela ne vous console pas.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'La date est fixée au 31 janvier.',
        'Le matin, tout est ordinaire. On transmet les avis de tempête, on prend les ' +
          'télégrammes des chalutiers, on répond aux essais. Un vendredi comme les ' +
          'autres, à ceci près que chacun sait quelle heure il est.',
      ],
    },
    {
      kind: 'receive',
      text: 'FFU DE FNGL QTC 1 QRV',
      from: 'Un chalutier',
      wpm: 20,
      note: 'Le trafic ordinaire, jusqu’au bout. Un télégramme à passer, et c’est tout.',
    },
    {
      kind: 'send',
      text: 'FNGL DE {sine} R QRV K',
      to: 'Le chalutier',
      hint: 'Comme les dix mille fois précédentes.',
    },
    {
      kind: 'recit',
      text: [
        'Le texte du dernier message a été écrit à plusieurs, la veille, et discuté.',
        'Certains voulaient quelque chose de sobre : la station cesse la veille ' +
          'radiotélégraphique, date, signature. D’autres trouvaient qu’après un ' +
          'siècle et demi on avait le droit d’une phrase.',
        'C’est la phrase qui l’a emporté.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'On ne l’adresse à personne en particulier.',
        'CQ : appel à tous. C’est le premier mot que vous avez appris, celui qu’on ' +
          'lance quand on ne sait pas qui écoute et qu’on espère que quelqu’un le ' +
          'fait. Il n’a jamais été aussi exact.',
      ],
    },
    {
      kind: 'send',
      text: 'CQ CQ CQ DE FFU APPEL A TOUS CECI EST NOTRE DERNIER CRI AVANT NOTRE SILENCE ETERNEL',
      to: 'À tous',
      hint:
        'Quatre-vingt-trois caractères. Prenez le temps que vous voulez : plus ' +
        'personne n’attend la fréquence.',
    },
    {
      kind: 'silence',
      seconds: 16,
      text: 'Vous levez la main. La salle est pleine et personne ne parle.',
    },
    {
      kind: 'receive',
      text: 'FFU DE FNGL 73 ET MERCI POUR TOUTES CES ANNEES',
      from: 'Le chalutier de ce matin',
      wpm: 20,
      note: 'Puis d’autres. Des navires, des stations étrangères, des amateurs.',
    },
    {
      kind: 'recit',
      text: [
        'Il en arrive pendant vingt minutes, et vous répondez à chacun.',
        'Des chalutiers, un pétrolier au large de Gibraltar, une station portugaise, ' +
          'et beaucoup d’amateurs qui n’avaient rien à faire là mais qui écoutaient ' +
          'depuis le matin. Certains signent avec des sines que vous connaissez ' +
          'depuis trente ans sans avoir jamais vu le visage qui va avec.',
      ],
    },
    {
      kind: 'send',
      text: 'DE FFU SK',
      to: 'À tous',
      hint:
        'SK. Fin de travail. Ce n’est pas au revoir et ce n’est pas une avarie : ' +
        'c’est la marque qu’on pose quand il n’y aura plus rien après.',
    },
    {
      kind: 'recit',
      text: [
        'Quelqu’un coupe l’émetteur et le bruit de fond de la salle change.',
        'On n’avait pas remarqué qu’il y avait un bruit. Un émetteur qui chauffe ' +
          'depuis des décennies fait une note très basse qu’on n’entend plus, et ' +
          'quand elle s’arrête la pièce paraît trop grande.',
        'Vous rentrez chez vous. Sur le buffet, il y a un manipulateur droit à socle ' +
          'de laiton dont le contact est usé jusqu’au creux.',
      ],
    },
    {
      kind: 'epilogue',
      text: [
        'La France a cessé la veille radiotélégraphique en morse sur ses stations ' +
          'côtières le 31 janvier 1997, deux ans avant l’échéance internationale. Le ' +
          'dernier message émis est resté célèbre, et il est rapporté sous une forme ' +
          'très proche de celle donnée ici : un appel à tous annonçant le dernier cri ' +
          'avant le silence éternel.',
        'Ce qui remplace le morse est le SMDSM, système mondial de détresse et de ' +
          'sécurité en mer : balises de détresse qui émettent vers un satellite, ' +
          'appel sélectif numérique, télex par satellite. Il ne demande aucune ' +
          'compétence particulière à l’équipage, ce qui est précisément l’argument, ' +
          'et il fonctionne quand plus personne n’est en état de manipuler.',
        'Les navires nommés ici, la salle et les hommes qui s’y trouvent sont ' +
          'inventés. Les {nom} aussi. Le silence, non.',
      ],
    },
  ],
};

const SK: Episode = {
  id: 'sk',
  generation: 5,
  year: 1999,
  title: 'SK',
  summary: 'Le 31 janvier 1999, le monde entier cesse d’écouter le 500.',
  sound: { timbre: 'pur', snrDb: 20 },
  beats: [
    {
      kind: 'recit',
      text: [
        'Deux ans plus tard, c’est au tour du reste du monde.',
        'Le 1er février 1999, le SMDSM devient obligatoire pour tous les navires de ' +
          'commerce. La veille sur 500 kHz cesse partout en même temps. La fréquence ' +
          'ne sera pas réattribuée : on la laisse vide, par égard, et parce qu’on ne ' +
          'sait pas quoi en faire.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Vous êtes à la retraite depuis un an et vous avez remonté un poste chez vous.',
        'Rien d’extraordinaire : un récepteur de surplus, une antenne longue tendue ' +
          'entre le pignon et un poteau, et le manipulateur de 1855, dont vous avez ' +
          'seulement refait le ressort. Vous avez passé la licence d’amateur à ' +
          'cinquante-trois ans, ce qui a beaucoup amusé l’examinateur.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Le dernier soir, vous écoutez le 500 pendant trois heures.',
        'Il n’y a presque plus rien. Quelques stations d’Europe de l’Est qui n’ont ' +
          'pas encore basculé, un cargo qui salue, de longs blancs. La bande se vide ' +
          'comme une gare le dimanche soir.',
      ],
    },
    {
      kind: 'silence',
      seconds: 18,
      text: 'Vingt-trois heures cinquante. Vous n’avez rien entendu depuis onze minutes.',
    },
    {
      kind: 'receive',
      text: 'CQ CQ DE UFN QRT SK',
      from: 'Quelque part à l’est',
      wpm: 18,
      sound: { snrDb: 6 },
      note: 'Une station qui s’en va. Elle ne dit pas au revoir, elle pose sa marque.',
    },
    {
      kind: 'recit',
      text: [
        'Puis plus rien du tout, et cette fois ce n’est pas une période de silence.',
        'Vous restez devant le poste sans bouger. Il y a un an et demi, vous auriez ' +
          'eu le devoir de relever ce que vous entendiez. Ce soir vous n’avez plus ' +
          'aucun devoir, et la fréquence la plus écoutée du monde pendant un siècle ' +
          'ne porte plus que le souffle de l’atmosphère.',
      ],
    },
    {
      kind: 'recit',
      text: [
        'Vous pensez à un homme de vingt-trois ans, en 1844, devant une table de cuisine.',
        'Il ne savait ni ce qu’il apprenait ni pourquoi. Il a écrit son nom dans un ' +
          'alphabet que la France interdisait encore, parce que la première chose ' +
          'qu’on écrit dans un alphabet neuf, ce n’est jamais une phrase : c’est son ' +
          'nom.',
        'Cent cinquante-cinq ans plus tard, la seconde lettre du sine n’a pas changé.',
      ],
    },
    {
      kind: 'send',
      text: 'CQ CQ CQ DE {sine} 1844 1999 CENT CINQUANTE CINQ ANS MERCI A TOUS SK',
      to: 'À personne, et à tout le monde',
      hint:
        'Le manipulateur de 1855, sur une fréquence que plus personne ne veille. ' +
        'Prenez tout votre temps — il n’y a plus d’horloge.',
      limit: 0,
    },
    {
      kind: 'silence',
      seconds: 20,
      text: 'Vous attendez une réponse que vous n’attendez pas vraiment.',
    },
    {
      kind: 'receive',
      text: 'R OM 73 SK',
      from: 'Quelqu’un',
      wpm: 18,
      sound: { snrDb: 5 },
      note:
        'Vous ne saurez jamais qui. Quelqu’un écoutait une fréquence morte, un ' +
        'dimanche soir, pour la même raison que vous.',
    },
    {
      kind: 'recit',
      text: [
        'Vous coupez, et vous remettez la housse sur le manipulateur.',
        'Il a ouvert la ligne de Brest, il a passé quatre-vingt-dix ans dans des ' +
          'tiroirs, il a servi une fois sous l’Occupation à un homme qui ne l’a jamais ' +
          'raconté, et il vient de faire sa dernière émission. Le contact est usé ' +
          'jusqu’au creux et il fonctionne parfaitement.',
        'Vous avez un fils. Il est ingénieur en réseaux, il trouve tout cela ' +
          'charmant, et il n’apprendra pas le morse. C’est très bien ainsi : le code ' +
          'a cessé d’être utile, et il s’est mis à être beau.',
      ],
    },
    {
      kind: 'epilogue',
      text: [
        'Le 1er février 1999, le SMDSM est devenu obligatoire pour les navires ' +
          'soumis à la convention SOLAS, et la veille radiotélégraphique sur 500 kHz ' +
          'a cessé. La fréquence n’a pas été réattribuée à un autre service.',
        'SK — parfois écrit VA — est le signal de fin de travail. Il se manipule ' +
          'd’un seul tenant, sans espace entre les deux lettres, et il ne veut pas ' +
          'dire au revoir : il veut dire qu’il n’y aura plus rien après. Les ' +
          'opérateurs s’en servent encore aujourd’hui, et l’usage veut qu’on dise ' +
          'd’un radioamateur mort qu’il est « silent key ».',
        'Le morse n’a pas disparu. Il est interdit nulle part, il ne coûte presque ' +
          'rien à mettre en œuvre, il passe là où la voix ne passe pas, et des ' +
          'dizaines de milliers de personnes le pratiquent par goût. Il a seulement ' +
          'cessé d’être obligatoire, ce qui est arrivé à la plupart des belles choses.',
        'Les {nom} sont inventés d’un bout à l’autre. Tout le reste — les lignes, les ' +
          'câbles, les tours, les naufrages, les silences et les dates — a eu lieu.',
      ],
    },
  ],
};

export const EPISODES: Episode[] = [
  CE_QUE_DIEU_A_FAIT,
  LA_LIGNE,
  LA_DERNIERE_TOUR,
  LE_FIL_SOUS_ATLANTIQUE,
  PARIS_COUPE,
  LA_DEMANDE,
  TROIS_POINTS,
  LA_MAIN,
  MGY,
  LA_TOUR_QUI_ECOUTE,
  LE_POSTE_A_GALENE,
  CINQ_MINUTES,
  LES_SANGLOTS_LONGS,
  SEPT_KILOMETRES,
  LE_QUART,
  LES_TROIS_MINUTES,
  NOTRE_DERNIER_CRI,
  SK,
];
