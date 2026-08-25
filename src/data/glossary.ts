/**
 * Lexique du site.
 *
 * Tout terme technique employé quelque part sur ce site doit pouvoir être
 * élucidé sans quitter la page où on l'a rencontré. Le lexique sert deux
 * usages : la consultation directe, par ordre alphabétique, et le clic sur un
 * mot repéré dans un texte.
 *
 * Le champ `mark` gouverne le second. Certains termes du lexique sont aussi des
 * mots français ordinaires — « unité », « phase », « gain », « note » — et les
 * souligner à chaque apparition transformerait la lecture en champ de mines.
 * Ceux-là restent consultables, mais ne sont pas repérés automatiquement.
 */

export interface GlossaryEntry {
  /** Forme canonique, telle qu'affichée dans le lexique. */
  term: string;
  /** Autres formes reconnues dans les textes : pluriels, sigles, synonymes. */
  aliases?: string[];
  definition: string;
  /** Renvois vers d'autres entrées, par leur terme canonique. */
  see?: string[];
  /** Page du site qui traite le sujet en détail. */
  route?: string;
  /**
   * Faux pour les termes qu'il ne faut pas repérer automatiquement dans les
   * textes, parce que le mot est trop courant en français.
   */
  mark?: boolean;
}

export const GLOSSARY: GlossaryEntry[] = [
  // --- Le morse et son trafic ---
  {
    term: 'Point',
    aliases: ['points'],
    definition:
      'Le plus court des deux signaux du morse. Sa durée définit l’unité de temps dont tout le reste découle.',
    see: ['Trait', 'Unité'],
    route: '#/apprendre/principes',
    mark: false,
  },
  {
    term: 'Trait',
    aliases: ['traits'],
    definition: 'Le signal long du morse : trois fois la durée d’un point, ni plus ni moins.',
    see: ['Point', 'Unité'],
    route: '#/apprendre/principes',
    mark: false,
  },
  {
    term: 'Unité',
    aliases: ['unités'],
    definition:
      'La durée d’un point, dont tout le code se déduit : le trait en vaut trois, le silence entre deux signaux un, entre deux caractères trois, entre deux mots sept.',
    route: '#/apprendre/principes',
    mark: false,
  },
  {
    term: 'WPM',
    aliases: ['mots par minute'],
    definition:
      'Mots par minute. La vitesse se mesure sur le mot étalon PARIS, choisi parce qu’il dure exactement cinquante unités.',
    see: ['Unité', 'Farnsworth'],
    route: '#/apprendre/principes',
  },
  {
    term: 'Farnsworth',
    definition:
      'Méthode qui allonge les silences entre caractères sans ralentir les caractères eux-mêmes. Elle laisse le temps de reconnaître sans habituer l’oreille à un rythme lent.',
    see: ['WPM', 'Koch'],
    route: '#/entrainement/ecoute',
  },
  {
    term: 'Koch',
    definition:
      'Méthode d’apprentissage qui démarre à deux caractères, à pleine vitesse, et en ajoute un dès que la reconnaissance est fiable. On n’accélère jamais : on élargit.',
    see: ['Farnsworth'],
    route: '#/entrainement/ecoute',
  },
  {
    term: 'CW',
    definition:
      'De l’anglais « continuous wave ». La télégraphie par coupure de porteuse, mode le plus économe en puissance et en largeur de bande.',
    see: ['Porteuse', 'A1A'],
    route: '#/apprendre/principes',
  },
  {
    term: 'Prosigne',
    aliases: ['prosignes'],
    definition:
      'Groupe de lettres émis sans séparation, qui vaut pour un signe de ponctuation ou une commande : AR pour la fin de message, SK pour la fin de contact.',
    route: '#/apprendre/communication',
  },
  {
    term: 'Indicatif',
    aliases: ['indicatifs'],
    definition:
      'Identifiant unique d’une station dans le monde entier : un préfixe attribué au pays, un chiffre, puis un suffixe de deux à quatre lettres.',
    see: ['Préfixe', 'Suffixe'],
    route: '#/licence/station',
  },
  {
    term: 'Préfixe',
    aliases: ['préfixes'],
    definition:
      'Début de l’indicatif, attribué au pays par l’UIT. En France, F pour le continent, deux lettres pour la Corse et l’outre-mer.',
    see: ['Indicatif'],
    route: '#/licence/station',
  },
  {
    term: 'Suffixe',
    aliases: ['suffixes'],
    definition:
      'Fin de l’indicatif. Sa première lettre dit à qui il appartient : K pour un radio-club, Z pour une station répétitrice.',
    see: ['Indicatif'],
    route: '#/licence/station',
  },
  {
    term: 'Code Q',
    aliases: ['codes Q'],
    definition:
      'Abréviations internationales en trois lettres commençant par Q. QRM signale un brouillage, QSY un changement de fréquence, QRZ demande qui appelle.',
    route: '#/apprendre/communication',
  },
  {
    term: 'QSO',
    definition: 'Un contact radio établi entre deux stations. Le mot vient du code Q.',
    see: ['Code Q'],
    route: '#/apprendre/communication',
  },
  {
    term: 'Manipulateur',
    aliases: ['manipulateurs'],
    definition:
      'L’organe qui coupe et rétablit la porteuse. Droit, il ne fait qu’ouvrir et fermer ; à palettes, il engendre lui-même points et traits.',
    see: ['Iambique'],
    route: '#/entrainement/emission',
  },
  {
    term: 'Iambique',
    definition:
      'Mode de manipulateur à deux palettes où le maintien simultané des deux produit une alternance de points et de traits.',
    see: ['Manipulateur'],
    route: '#/entrainement/emission',
  },
  {
    term: 'Radioamateur',
    aliases: ['radioamateurs', 'radio-amateur', 'radio-amateurs'],
    definition:
      'Personne autorisée à émettre à titre personnel et sans intérêt pécuniaire, pour son instruction, l’intercommunication et des études techniques.',
    route: '#/licence/cadre',
  },

  // --- Grandeurs électriques ---
  {
    term: 'Tension',
    definition:
      'Différence de potentiel entre deux points, mesurée en volts. C’est elle qui pousse le courant à travers un circuit.',
    see: ['Courant', 'Loi d’Ohm'],
    route: '#/licence/ohm',
    mark: false,
  },
  {
    term: 'Courant',
    definition: 'Débit de charges électriques, mesuré en ampères.',
    see: ['Tension', 'Loi d’Ohm'],
    route: '#/licence/ohm',
    mark: false,
  },
  {
    term: 'Résistance',
    aliases: ['résistances'],
    definition:
      'Opposition au passage du courant, mesurée en ohms. Elle transforme en chaleur l’énergie qu’elle dissipe.',
    see: ['Loi d’Ohm', 'Impédance'],
    route: '#/licence/ohm',
  },
  {
    term: 'Loi d’Ohm',
    definition:
      'La relation fondamentale : la tension est le produit de la résistance par le courant, U = R × I.',
    see: ['Loi de Joule'],
    route: '#/licence/ohm',
  },
  {
    term: 'Loi de Joule',
    definition:
      'La puissance dissipée vaut le produit de la tension par le courant, P = U × I. Elle s’écrit aussi P = R × I² ou P = U² / R.',
    see: ['Loi d’Ohm'],
    route: '#/licence/ohm',
  },
  {
    term: 'Impédance',
    aliases: ['impédances'],
    definition:
      'Opposition totale au passage d’un courant alternatif : la résistance et les réactances composées, non additionnées.',
    see: ['Réactance', 'Résistance'],
    route: '#/licence/alternatif',
  },
  {
    term: 'Réactance',
    aliases: ['réactances'],
    definition:
      'Opposition d’une bobine ou d’un condensateur au courant alternatif. Elle dépend de la fréquence, à l’inverse d’une résistance.',
    see: ['Impédance', 'Inductance', 'Capacité'],
    route: '#/licence/alternatif',
  },
  {
    term: 'Capacité',
    aliases: ['capacités'],
    definition:
      'Aptitude d’un condensateur à emmagasiner des charges, mesurée en farads. Il bloque le continu et laisse passer la haute fréquence.',
    see: ['Condensateur', 'Réactance'],
    route: '#/licence/alternatif',
  },
  {
    term: 'Inductance',
    aliases: ['inductances'],
    definition:
      'Aptitude d’une bobine à s’opposer aux variations de courant, mesurée en henrys. Elle laisse passer le continu et freine la haute fréquence.',
    see: ['Bobine', 'Réactance'],
    route: '#/licence/alternatif',
  },
  {
    term: 'Valeur efficace',
    definition:
      'Valeur d’un courant alternatif qui produirait le même échauffement qu’un continu de même valeur. Pour une sinusoïde, la crête divisée par racine de deux.',
    route: '#/licence/alternatif',
  },
  {
    term: 'Constante de temps',
    definition:
      'Durée au bout de laquelle un condensateur atteint 63 % de la tension appliquée à travers une résistance : le produit R × C.',
    route: '#/licence/alternatif',
  },
  {
    term: 'Décibel',
    aliases: ['décibels', 'dB'],
    definition:
      'Unité logarithmique de rapport. Trois décibels doublent une puissance, dix la multiplient par dix, et les gains d’une chaîne s’additionnent au lieu de se multiplier.',
    route: '#/licence/decibels',
  },
  {
    term: 'Rendement',
    definition:
      'Part de la puissance consommée qui ressort utile. Un amplificateur en classe A plafonne à 50 % : le reste part en chaleur.',
    route: '#/licence/etages',
    mark: false,
  },

  // --- Composants ---
  {
    term: 'Résistor',
    aliases: ['résistors'],
    definition:
      'Le composant, à distinguer de la résistance qui est la grandeur. Sa valeur se lit sur des anneaux colorés et sa puissance admissible se choisit avec autant de soin que sa valeur.',
    see: ['Résistance'],
    route: '#/licence/circuits',
  },
  {
    term: 'Condensateur',
    aliases: ['condensateurs'],
    definition:
      'Deux armatures séparées par un isolant. Il stocke des charges, bloque le continu et laisse d’autant mieux passer l’alternatif que la fréquence est haute.',
    see: ['Capacité', 'Réactance'],
    route: '#/licence/alternatif',
  },
  {
    term: 'Bobine',
    aliases: ['bobines', 'self', 'selfs'],
    definition:
      'Un fil enroulé, qui s’oppose aux variations du courant qui le traverse. Comportement inverse de celui du condensateur : transparente au continu, opaque au très haute fréquence.',
    see: ['Inductance', 'Réactance'],
    route: '#/licence/alternatif',
  },
  {
    term: 'Circuit accordé',
    aliases: ['circuits accordés', 'circuit résonnant', 'circuit bouchon'],
    definition:
      'Association d’une bobine et d’un condensateur qui privilégie une fréquence, dite de résonance. C’est la brique de base de tout filtre et de tout oscillateur.',
    see: ['Facteur de qualité', 'Résonance'],
    route: '#/licence/circuits',
  },
  {
    term: 'Résonance',
    definition:
      'Fréquence à laquelle les réactances d’une bobine et d’un condensateur se compensent exactement. Le circuit y présente son maximum — ou son minimum — d’impédance.',
    see: ['Circuit accordé', 'Réactance'],
    route: '#/licence/circuits',
    mark: false,
  },
  {
    term: 'Facteur de qualité',
    aliases: ['coefficient de qualité', 'facteur Q'],
    definition:
      'Rapport entre la fréquence de résonance et la largeur de bande d’un circuit accordé. Un Q élevé signifie un circuit sélectif, mais aussi difficile à régler.',
    see: ['Circuit accordé', 'Sélectivité'],
    route: '#/licence/circuits',
  },
  {
    term: 'Diode',
    aliases: ['diodes'],
    definition:
      'Composant qui ne laisse passer le courant que dans un sens. Base du redressement, de la détection et, sous d’autres formes, de la régulation ou de l’accord.',
    route: '#/licence/diodes',
  },
  {
    term: 'Diode Zener',
    aliases: ['zener'],
    definition:
      'Diode conçue pour travailler en inverse à une tension précise, qu’elle maintient constante. Elle sert de référence dans les régulateurs simples.',
    see: ['Diode'],
    route: '#/licence/diodes',
  },
  {
    term: 'Redressement',
    definition:
      'Transformation d’un courant alternatif en courant unidirectionnel, à l’aide de diodes. Suivi d’un filtrage, il donne la tension continue d’une alimentation.',
    see: ['Diode'],
    route: '#/licence/diodes',
  },
  {
    term: 'Transistor',
    aliases: ['transistors'],
    definition:
      'Composant à trois électrodes dans lequel un petit signal en commande un grand. Il amplifie, commute et oscille : toute l’électronique active en découle.',
    see: ['Amplificateur'],
    route: '#/licence/transistors',
  },
  {
    term: 'Amplificateur',
    aliases: ['amplificateurs', 'ampli', 'amplis'],
    definition:
      'Étage qui restitue un signal de plus forte puissance, au prix d’une alimentation. Sa classe de fonctionnement fixe son rendement et sa linéarité.',
    see: ['Rendement', 'Classe A'],
    route: '#/licence/etages',
  },
  {
    term: 'Classe A',
    definition:
      'Amplification où le composant conduit pendant la totalité de la période. Linéarité irréprochable, rendement médiocre : 50 % au mieux.',
    see: ['Amplificateur', 'Rendement'],
    route: '#/licence/etages',
  },
  {
    term: 'Classe C',
    definition:
      'Amplification où le composant ne conduit que sur une fraction de la période. Rendement élevé mais forte distorsion : réservée aux signaux à enveloppe constante, comme la télégraphie ou la FM.',
    see: ['Amplificateur', 'Rendement'],
    route: '#/licence/etages',
  },
  {
    term: 'Quartz',
    definition:
      'Lame de cristal qui vibre à une fréquence extrêmement stable. Il sert de référence aux oscillateurs et de filtre très sélectif dans les récepteurs.',
    see: ['Oscillateur'],
    route: '#/licence/recepteurs',
  },
  {
    term: 'Transformateur',
    aliases: ['transformateurs'],
    definition:
      'Deux bobinages couplés par un noyau. Il modifie tension et courant dans le rapport des spires, transforme les impédances dans le carré de ce rapport, et isole galvaniquement.',
    route: '#/licence/transformateurs',
  },
  {
    term: 'Fusible',
    aliases: ['fusibles'],
    definition:
      'Maillon volontairement faible d’un circuit d’alimentation. On le choisit juste au-dessus du courant normal, jamais « plus gros pour qu’il tienne ».',
    route: '#/licence/securite',
  },

  // --- Émission et modulation ---
  {
    term: 'Porteuse',
    aliases: ['porteuses'],
    definition:
      'Signal haute fréquence pur, sans information, que la modulation vient ensuite altérer pour transporter un message.',
    see: ['Modulation'],
    route: '#/licence/modulations',
  },
  {
    term: 'Modulation',
    aliases: ['modulations', 'moduler', 'modulé', 'modulée'],
    definition:
      'Action de faire varier une caractéristique de la porteuse — amplitude, fréquence ou phase — au rythme du signal à transmettre.',
    see: ['Porteuse', 'Classe d’émission'],
    route: '#/licence/modulations',
  },
  {
    term: 'Modulation d’amplitude',
    aliases: ['AM'],
    definition:
      'L’amplitude de la porteuse suit le signal. Deux bandes latérales encadrent une porteuse qui, à elle seule, consomme les deux tiers de la puissance sans rien transporter.',
    see: ['Bande latérale unique', 'Bande latérale'],
    route: '#/licence/modulations',
  },
  {
    term: 'Bande latérale',
    aliases: ['bandes latérales'],
    definition:
      'Portion du spectre créée de part et d’autre de la porteuse par la modulation. Les deux bandes latérales d’une AM portent la même information, en double.',
    see: ['Modulation d’amplitude', 'Bande latérale unique'],
    route: '#/licence/modulations',
  },
  {
    term: 'Bande latérale unique',
    aliases: ['BLU', 'SSB'],
    definition:
      'Modulation d’amplitude dont on a supprimé la porteuse et une bande latérale. Même message dans la moitié de la largeur, et toute la puissance dans l’information.',
    see: ['Modulation d’amplitude', 'Bande latérale'],
    route: '#/licence/modulations',
  },
  {
    term: 'Modulation de fréquence',
    aliases: ['FM'],
    definition:
      'La fréquence de la porteuse suit le signal, son amplitude ne bouge pas. Insensible aux parasites d’amplitude, mais large : c’est le mode des relais VHF.',
    see: ['Excursion', 'Modulation'],
    route: '#/licence/modulations',
  },
  {
    term: 'Excursion',
    definition:
      'Écart maximal de fréquence imposé à la porteuse en modulation de fréquence. Trop d’excursion élargit le signal et déborde sur les voisins.',
    see: ['Modulation de fréquence'],
    route: '#/licence/modulations',
  },
  {
    term: 'A1A',
    definition:
      'Classe d’émission de la télégraphie manuelle : porteuse modulée en tout ou rien, sans sous-porteuse, transmettant de l’information télégraphique destinée à l’oreille.',
    see: ['Classe d’émission', 'CW'],
    route: '#/licence/emissions',
  },
  {
    term: 'Classe d’émission',
    aliases: ['classes d’émission'],
    definition:
      'Code de trois caractères normalisé par l’UIT qui décrit une émission : nature de la modulation, nature du signal modulant, type d’information. La télégraphie manuelle est A1A.',
    see: ['UIT', 'Modulation'],
    route: '#/licence/emissions',
  },
  {
    term: 'Harmonique',
    aliases: ['harmoniques'],
    definition:
      'Multiple entier de la fréquence émise, produit par tout étage non linéaire. Rayonnées, les harmoniques brouillent d’autres services : un filtre passe-bas les arrête.',
    see: ['Rayonnement non essentiel'],
    route: '#/licence/emissions',
  },
  {
    term: 'Rayonnement non essentiel',
    aliases: ['rayonnements non essentiels'],
    definition:
      'Toute énergie émise hors de la bande nécessaire : harmoniques, produits de mélange, oscillations parasites. La réglementation en fixe les limites.',
    see: ['Harmonique', 'Largeur de bande'],
    route: '#/licence/emissions',
  },
  {
    term: 'Largeur de bande',
    definition:
      'Portion de spectre réellement occupée par une émission. La télégraphie tient dans quelques centaines de hertz, la BLU dans environ 2,7 kHz, la FM large dans plusieurs dizaines.',
    see: ['Classe d’émission'],
    route: '#/licence/emissions',
    mark: false,
  },
  {
    term: 'Intermodulation',
    definition:
      'Mélange indésirable de deux signaux dans un étage non linéaire, qui engendre des fréquences somme et différence. Elle salit le spectre en émission et fabrique de faux signaux en réception.',
    see: ['Mélangeur'],
    route: '#/licence/emissions',
  },
  {
    term: 'Compatibilité électromagnétique',
    aliases: ['CEM'],
    definition:
      'Aptitude d’un équipement à fonctionner sans perturber les autres ni être perturbé par eux. Elle encadre aussi bien l’émetteur radioamateur que le téléviseur du voisin.',
    see: ['Rayonnement non essentiel'],
    route: '#/licence/emissions',
  },

  // --- Réception ---
  {
    term: 'Superhétérodyne',
    definition:
      'Architecture de récepteur qui ramène toute émission reçue à une fréquence intermédiaire fixe, où l’on peut soigner filtrage et amplification une fois pour toutes.',
    see: ['Fréquence intermédiaire', 'Mélangeur', 'Oscillateur local'],
    route: '#/licence/recepteurs',
  },
  {
    term: 'Mélangeur',
    aliases: ['mélangeurs'],
    definition:
      'Étage qui combine le signal reçu et l’oscillateur local pour produire leurs fréquences somme et différence. C’est lui qui fabrique la fréquence intermédiaire.',
    see: ['Superhétérodyne', 'Oscillateur local'],
    route: '#/licence/recepteurs',
  },
  {
    term: 'Oscillateur',
    aliases: ['oscillateurs'],
    definition:
      'Amplificateur qui se réinjecte à lui-même une partie de sa sortie, et entretient ainsi un signal. Sa stabilité fait toute la qualité d’un émetteur.',
    see: ['Quartz', 'Oscillateur local'],
    route: '#/licence/recepteurs',
  },
  {
    term: 'Oscillateur local',
    aliases: ['OL'],
    definition:
      'Oscillateur accordable d’un récepteur superhétérodyne. C’est en le déplaçant qu’on change de fréquence de réception.',
    see: ['Superhétérodyne', 'Mélangeur'],
    route: '#/licence/recepteurs',
  },
  {
    term: 'Fréquence intermédiaire',
    aliases: ['FI'],
    definition:
      'Fréquence fixe à laquelle un superhétérodyne traite tous les signaux reçus, quelle que soit la fréquence d’origine.',
    see: ['Superhétérodyne', 'Fréquence image'],
    route: '#/licence/recepteurs',
  },
  {
    term: 'Fréquence image',
    definition:
      'Fréquence parasite qui, mélangée à l’oscillateur local, donne la même fréquence intermédiaire que le signal voulu. Elle se situe à deux fois la FI du signal et se combat par un filtrage d’entrée.',
    see: ['Fréquence intermédiaire', 'Superhétérodyne'],
    route: '#/licence/recepteurs',
  },
  {
    term: 'Sélectivité',
    definition:
      'Aptitude d’un récepteur à isoler la station voulue de ses voisines. Elle se mesure par la largeur du filtre et par son facteur de forme.',
    see: ['Facteur de qualité', 'Sensibilité'],
    route: '#/licence/recepteurs',
  },
  {
    term: 'Sensibilité',
    definition:
      'Plus petit signal qu’un récepteur peut restituer de façon exploitable. Au-delà d’un certain point, c’est le bruit, et non l’amplification, qui fixe la limite.',
    see: ['Sélectivité'],
    route: '#/licence/recepteurs',
    mark: false,
  },
  {
    term: 'Oscillateur de battement',
    aliases: ['BFO'],
    definition:
      'Oscillateur ajouté en réception pour rendre audibles la télégraphie et la BLU, qui ne contiennent aucune porteuse à détecter.',
    see: ['Bande latérale unique', 'CW'],
    route: '#/licence/recepteurs',
  },
  {
    term: 'Boucle à verrouillage de phase',
    aliases: ['PLL'],
    definition:
      'Montage qui asservit un oscillateur variable sur une référence à quartz. Il donne la souplesse d’un VFO avec la stabilité d’un quartz.',
    see: ['Oscillateur', 'Quartz'],
    route: '#/licence/numerique',
  },

  // --- Antennes et lignes ---
  {
    term: 'Antenne',
    aliases: ['antennes'],
    definition:
      'Organe qui échange l’énergie entre une ligne et l’espace. Le même élément émet et reçoit avec les mêmes propriétés : c’est le principe de réciprocité.',
    see: ['Dipôle', 'Gain d’antenne'],
    route: '#/licence/antennes',
  },
  {
    term: 'Dipôle',
    aliases: ['dipôles', 'doublet', 'doublets'],
    definition:
      'Antenne de base : deux brins d’un quart d’onde chacun, alimentés au centre. Environ 73 ohms au point d’alimentation, rayonnement maximal perpendiculaire au fil.',
    see: ['Antenne', 'Quart d’onde'],
    route: '#/licence/antennes',
  },
  {
    term: 'Quart d’onde',
    definition:
      'Longueur égale au quart de la longueur d’onde. Dimension de référence des antennes et des lignes : c’est là que les impédances se retournent.',
    see: ['Longueur d’onde', 'Dipôle'],
    route: '#/licence/antennes',
  },
  {
    term: 'Longueur d’onde',
    definition:
      'Distance parcourue par l’onde pendant une période. Dans le vide, 300 divisé par la fréquence en mégahertz donne des mètres.',
    see: ['Quart d’onde'],
    route: '#/licence/antennes',
  },
  {
    term: 'Gain d’antenne',
    aliases: ['dBi', 'dBd'],
    definition:
      'Concentration du rayonnement dans une direction, au détriment des autres. Une antenne ne crée pas de puissance : elle la répartit. Le gain se compte en dBi par rapport à l’isotrope, ou en dBd par rapport au dipôle — 2,15 dB d’écart.',
    see: ['Antenne', 'Décibel', 'PIRE'],
    route: '#/licence/antennes',
  },
  {
    term: 'Rapport d’ondes stationnaires',
    aliases: ['ROS', 'TOS'],
    definition:
      'Mesure de la désadaptation entre la ligne et l’antenne. Un ROS de 1 signifie que toute la puissance part ; au-delà, une part revient vers l’émetteur.',
    see: ['Adaptation d’impédance', 'Ligne coaxiale'],
    route: '#/licence/antennes',
  },
  {
    term: 'Adaptation d’impédance',
    definition:
      'Égalisation des impédances de deux étages pour transférer le maximum de puissance. Sans elle, une partie de l’énergie est renvoyée à l’expéditeur.',
    see: ['Impédance', 'Rapport d’ondes stationnaires'],
    route: '#/licence/antennes',
  },
  {
    term: 'Ligne coaxiale',
    aliases: ['coaxial', 'coaxiaux', 'câble coaxial'],
    definition:
      'Câble dont l’âme est entourée d’une tresse de blindage. Il transporte la haute fréquence sans rayonner, avec une impédance caractéristique fixée par sa géométrie — 50 ohms en radioamateur.',
    see: ['Impédance', 'Rapport d’ondes stationnaires'],
    route: '#/licence/antennes',
  },
  {
    term: 'Balun',
    aliases: ['baluns'],
    definition:
      'Transformateur qui relie une ligne asymétrique, comme le coaxial, à une antenne symétrique, comme le dipôle. Sans lui, la tresse rayonne et le diagramme se déforme.',
    see: ['Ligne coaxiale', 'Dipôle'],
    route: '#/licence/antennes',
  },
  {
    term: 'Polarisation',
    definition:
      'Orientation du champ électrique rayonné : horizontale, verticale ou circulaire. Deux antennes de polarisations croisées perdent une vingtaine de décibels.',
    see: ['Antenne'],
    route: '#/licence/antennes',
    mark: false,
  },
  {
    term: 'PIRE',
    aliases: ['puissance isotrope rayonnée équivalente'],
    definition:
      'Puissance qu’il faudrait fournir à une antenne isotrope pour obtenir le même champ que l’installation réelle. Elle combine la puissance de l’émetteur, les pertes et le gain d’antenne.',
    see: ['PAR', 'Gain d’antenne'],
    route: '#/licence/antennes',
  },
  {
    term: 'PAR',
    aliases: ['puissance apparente rayonnée'],
    definition:
      'Même idée que la PIRE, mais référencée au dipôle demi-onde au lieu de l’isotrope. L’écart entre les deux vaut toujours 2,15 dB.',
    see: ['PIRE', 'Gain d’antenne'],
    route: '#/licence/antennes',
    mark: false,
  },
  {
    term: 'Propagation',
    definition:
      'Trajet suivi par l’onde entre deux stations : onde de sol, vue directe, ou réflexion sur l’ionosphère. Elle décide de qui l’on entend, et quand.',
    see: ['Ionosphère'],
    route: '#/licence/bandes',
  },
  {
    term: 'Ionosphère',
    definition:
      'Couches ionisées de la haute atmosphère qui réfléchissent les ondes décamétriques et rendent possibles les liaisons intercontinentales. Son état suit le soleil, le jour et le cycle solaire.',
    see: ['Propagation'],
    route: '#/licence/bandes',
  },
  {
    term: 'Fading',
    aliases: ['évanouissement', 'QSB'],
    definition:
      'Variation lente de la force d’un signal, due aux trajets multiples dans l’ionosphère. En télégraphie, on l’annonce par le code Q QSB.',
    see: ['Propagation', 'Code Q'],
    route: '#/licence/bandes',
  },

  // --- Réglementation et licence ---
  {
    term: 'ANFR',
    aliases: ['Agence nationale des fréquences'],
    definition:
      'Agence nationale des fréquences : elle organise l’examen, délivre les indicatifs et instruit les cas de brouillage en France.',
    see: ['ARCEP', 'Indicatif'],
    route: '#/licence/cadre',
  },
  {
    term: 'ARCEP',
    definition:
      'Autorité de régulation des communications électroniques : elle fixe le cadre réglementaire du service amateur, que l’ANFR met en œuvre.',
    see: ['ANFR'],
    route: '#/licence/cadre',
  },
  {
    term: 'UIT',
    aliases: ['Union internationale des télécommunications', 'ITU'],
    definition:
      'Institution des Nations unies qui répartit le spectre entre services et découpe le monde en trois régions. La France appartient à la région 1.',
    see: ['Service amateur', 'Classe d’émission'],
    route: '#/licence/cadre',
  },
  {
    term: 'HAREC',
    definition:
      'Certificat européen d’examen harmonisé. Il permet de faire reconnaître sa licence dans les pays qui ont adopté la recommandation CEPT.',
    see: ['CEPT'],
    route: '#/licence/cadre',
  },
  {
    term: 'CEPT',
    definition:
      'Conférence européenne des administrations des postes et télécommunications. Ses recommandations autorisent le radioamateur licencié à trafiquer en voyage sans démarche préalable.',
    see: ['HAREC'],
    route: '#/licence/cadre',
  },
  {
    term: 'Service amateur',
    definition:
      'Service de radiocommunication défini par l’UIT, à but d’instruction individuelle, d’intercommunication et d’études techniques, sans intérêt pécuniaire.',
    see: ['UIT', 'Radioamateur'],
    route: '#/licence/cadre',
  },
  {
    term: 'Statut primaire',
    aliases: ['service primaire'],
    definition:
      'Statut d’un service protégé contre les brouillages des autres. Sur les bandes où le service amateur est primaire, il n’a pas à céder le passage.',
    see: ['Statut secondaire'],
    route: '#/licence/bandes',
  },
  {
    term: 'Statut secondaire',
    aliases: ['service secondaire'],
    definition:
      'Statut d’un service qui ne doit pas brouiller les services primaires et ne peut réclamer de protection contre eux. Le service amateur est secondaire sur plusieurs bandes.',
    see: ['Statut primaire'],
    route: '#/licence/bandes',
  },
  {
    term: 'Journal de trafic',
    aliases: ['carnet de trafic'],
    definition:
      'Registre des liaisons effectuées : date, heure UTC, indicatif, bande, mode, report. Il n’est plus obligatoire en France, mais reste la mémoire de la station.',
    see: ['QSO', 'Indicatif'],
    route: '#/licence/trafic',
  },
  {
    term: 'Carte QSL',
    aliases: ['QSL'],
    definition:
      'Carte confirmant une liaison, échangée entre opérateurs. Elle sert de preuve pour les diplômes et reste une tradition vivante du service amateur.',
    see: ['QSO'],
    route: '#/licence/trafic',
  },
  {
    term: 'Relais',
    definition:
      'Station automatique qui réémet en temps réel ce qu’elle reçoit, sur une fréquence décalée, pour étendre la portée en VHF et UHF.',
    see: ['Modulation de fréquence'],
    route: '#/licence/trafic',
    mark: false,
  },
  {
    term: 'Temps universel coordonné',
    aliases: ['UTC'],
    definition:
      'Référence horaire unique du trafic international. On la note dans le journal pour éviter toute ambiguïté entre fuseaux et heures d’été.',
    see: ['Journal de trafic'],
    route: '#/licence/trafic',
  },
  {
    term: 'Débit d’absorption spécifique',
    aliases: ['DAS'],
    definition:
      'Puissance absorbée par unité de masse de tissu vivant. C’est la grandeur qui fonde les distances de sécurité à respecter autour d’une antenne.',
    see: ['Antenne'],
    route: '#/licence/securite',
  },
];
