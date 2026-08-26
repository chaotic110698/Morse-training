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
 * Génération III — l’épisode d’amorce, sur lequel le moteur a été mis au point.
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


export const EPISODES: Episode[] = [
  CE_QUE_DIEU_A_FAIT,
  LA_LIGNE,
  LA_DERNIERE_TOUR,
  MGY,
];
