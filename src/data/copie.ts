/**
 * Les textes de la copie suivie.
 *
 * Trois principes ont commandé leur écriture.
 *
 * **Sans accents ni apostrophes.** Le morse français a bien un É — c'est
 * `··-··` — mais il n'appartient à aucun des ordres Koch du site, et
 * l'apostrophe n'existe tout simplement pas dans le code. Les textes sont donc
 * écrits comme le trafic international les aurait envoyés : en lettres nues.
 * C'est un peu rude à lire sur la page ; à l'oreille, cela ne s'entend pas.
 *
 * **Du sens, sauf dans les groupes.** Une phrase se copie mieux qu'une suite
 * de lettres parce que le cerveau devine la suite — et c'est précisément la
 * compétence qu'on veut : anticiper sans cesser d'écouter. Les groupes de cinq
 * caractères, eux, retirent toute anticipation possible, ce qui en fait le
 * meilleur juge et le plus ingrat.
 *
 * **Un contenu qui vaut d'être copié.** Les textes parlent de radio, de mer et
 * de télégraphe : à défaut d'apprendre le morse, on apprendra quelque chose.
 */

export interface CopyCorpus {
  id: string;
  label: string;
  hint: string;
  /** Vide pour les jeux engendrés à la volée. */
  texts: string[];
  /** Vrai si le jeu emploie des chiffres et de la ponctuation. */
  full?: boolean;
}

const PHRASES = [
  'LA STATION EMET SUR QUARANTE METRES DEPUIS CE MATIN',
  'LE VENT MONTE ET LA MER DEVIENT GROSSE AU LARGE',
  'NOUS AVONS BIEN RECU VOTRE MESSAGE DE CE MATIN',
  'LE PHARE TOURNE TOUTES LES QUINZE SECONDES PAR TEMPS CLAIR',
  'UN OPERATEUR PATIENT COPIE MIEUX QU UN OPERATEUR PRESSE',
  'LA PROPAGATION EST BONNE VERS LE NORD MAIS FAIBLE VERS LE SUD',
  'MERCI POUR LE CONTACT ET BONNE FIN DE SOIREE A VOUS',
  'LE POSTE CHAUFFE DEPUIS UNE HEURE ET LE SIGNAL EST STABLE',
  'JE VOUS RECOIS FAIBLEMENT MAIS LISIBLEMENT MALGRE LE BRUIT',
  'LA NUIT LES ONDES COURTES PORTENT BEAUCOUP PLUS LOIN',
  'NOTRE ANTENNE EST UN SIMPLE FIL TENDU ENTRE DEUX ARBRES',
  'LE TELEGRAPHISTE ECOUTE AVANT DE POSER LA MAIN SUR LE MANIP',
  'RIEN A SIGNALER SUR LA VEILLE DE CETTE NUIT',
  'LA BATTERIE FAIBLIT ET JE VAIS DEVOIR FERMER LA STATION',
  'ON RECONNAIT UN OPERATEUR A SA FRAPPE COMME A SA VOIX',
  'LE BROUILLARD EST TOMBE SUR LA RADE EN MOINS DE VINGT MINUTES',
  'VOTRE SIGNAL EST TRES FORT ET PARFAITEMENT LISIBLE ICI',
  'LES SILENCES COMPTENT AUTANT QUE LES SIGNES DANS UN MESSAGE',
  'LA LIGNE A ETE COUPEE PAR LA TEMPETE DE LA NUIT DERNIERE',
  'APPRENDRE A ECOUTER PREND PLUS DE TEMPS QU APPRENDRE A EMETTRE',
  'LE NAVIRE A QUITTE LE PORT AVEC LA MAREE DU SOIR',
  'PATIENCE ET REGULARITE VALENT MIEUX QUE DEUX HEURES LE DIMANCHE',
  'LE RELAIS DE LA COLLINE REPETE TOUT CE QUI PASSE PAR LA VALLEE',
  'BONNE RECEPTION ET MERCI DE VOTRE PATIENCE PENDANT LE TRAFIC',
];

const TEXTES = [
  'LE MORSE NE SE LIT PAS IL S ENTEND UN OPERATEUR EXPERIMENTE NE COMPTE ' +
    'JAMAIS LES POINTS IL RECONNAIT LE RYTHME ENTIER DE LA LETTRE COMME ON ' +
    'RECONNAIT UN MOT PARLE SANS EN EPELER LES SONS',
  'PENDANT PRES DE CENT ANS LA FREQUENCE DE CINQ CENTS KILOHERTZ A ETE ' +
    'ECOUTEE EN PERMANENCE PAR TOUTES LES STATIONS DE BORD TROIS MINUTES DE ' +
    'SILENCE DEUX FOIS PAR HEURE PERMETTAIENT D ENTENDRE LES APPELS FAIBLES',
  'LES ONDES COURTES REBONDISSENT SUR LA HAUTE ATMOSPHERE LE JOUR ELLES ' +
    'PORTENT SUR QUELQUES CENTAINES DE KILOMETRES LA NUIT LA COUCHE BASSE ' +
    'DISPARAIT ET LE MEME EMETTEUR PEUT SE FAIRE ENTENDRE A L AUTRE BOUT DU MONDE',
  'LA MAIN DE CHAQUE OPERATEUR A SA MANIERE LA DUREE DES POINTS LA TENUE ' +
    'DES SILENCES LA FACON DE FINIR UN MOT FORMENT UNE SIGNATURE QUE LES ' +
    'ANCIENS RECONNAISSAIENT SANS AVOIR BESOIN DE L INDICATIF',
  'LE PREMIER MESSAGE PUBLIC A ETE ENVOYE ENTRE WASHINGTON ET BALTIMORE ' +
    'IL DEMANDAIT CE QUE DIEU A FAIT LA LIGNE MESURAIT SOIXANTE KILOMETRES ' +
    'ET LE MESSAGE A MIS QUELQUES SECONDES LA OU UN CHEVAL METTAIT UNE JOURNEE',
  'UN BON MANIPULATEUR SE REGLE COMME UN INSTRUMENT TROP DE JEU ET LES ' +
    'POINTS SE COLLENT PAS ASSEZ ET LE POIGNET FATIGUE EN DIX MINUTES ' +
    'CHAQUE OPERATEUR PASSE DU TEMPS A TROUVER SON REGLAGE ET N Y TOUCHE PLUS',
  'LE SILENCE RADIO N EST JAMAIS COMPLET IL RESTE LE SOUFFLE DU RECEPTEUR ' +
    'LES ORAGES LOINTAINS ET PARFOIS UNE PORTEUSE QUI TRAINE C EST SUR CE ' +
    'FOND QUE L OREILLE APPREND A DETACHER UN SIGNAL FAIBLE',
  'LA DERNIERE VEILLE COMMERCIALE EN MORSE S EST ACHEVEE A LA TOUTE FIN DU ' +
    'VINGTIEME SIECLE LES SATELLITES AVAIENT PRIS LA SUITE LE CODE RESTE ' +
    'POURTANT EMPLOYE CHAQUE JOUR PAR DES MILLIERS D AMATEURS DANS LE MONDE',
  'COPIER DERRIERE EST LA VRAIE COMPETENCE ON ECRIT UNE LETTRE PENDANT QUE ' +
    'LA SUIVANTE ARRIVE ET ON GARDE DEUX OU TROIS CARACTERES DANS LA TETE ' +
    'CELUI QUI S ARRETE SUR CE QU IL A MANQUE PERD TOUT LE RESTE',
  'UNE ANTENNE N A PAS BESOIN D ETRE COMPLIQUEE UN FIL DE LA BONNE LONGUEUR ' +
    'TENDU AUSSI HAUT QUE POSSIBLE ET LOIN DES MURS FAIT DEJA TRES BIEN ' +
    'L AFFAIRE LA HAUTEUR COMPTE PLUS QUE TOUT LE RESTE',
];

const TRAFIC = [
  'LA STATION EMET SUR 14 100 KHZ A 18 H 30 CHAQUE SOIR.',
  'VOTRE SIGNAL EST RECU 5 9 9 ICI, QRK 5, QSA 4.',
  'LE NAVIRE SE TROUVE PAR 48 DEGRES NORD ET 5 DEGRES OUEST.',
  'QSP POUR LA STATION 3 ? JE PEUX RELAYER VERS LE NORD.',
  'RENDEZ VOUS DEMAIN 7 030 KHZ A 20 H 00, MEME PUISSANCE.',
  'LE BULLETIN DE 12 H 00 ANNONCE VENT 6 A 7 ET MER FORTE.',
  'MESSAGE NUMERO 47, 12 MOTS, DEPOSE LE 3 A 9 H 15.',
  'QRU ? RIEN POUR VOUS. QRT A 23 H 00, BONNE NUIT.',
];

export const COPY_CORPORA: CopyCorpus[] = [
  {
    id: 'groupes',
    label: 'Groupes de cinq',
    hint:
      'Cinq caractères tirés de votre niveau actuel, sans aucun sens. Rien à deviner, ' +
      'rien à anticiper : c’est le juge le plus dur et le plus honnête de votre copie.',
    texts: [],
  },
  {
    id: 'phrases',
    label: 'Phrases',
    hint:
      'Des phrases courtes et sensées. Le contexte aide — et c’est voulu : anticiper la ' +
      'suite sans cesser d’écouter est exactement ce qu’on cherche à acquérir.',
    texts: PHRASES,
  },
  {
    id: 'textes',
    label: 'Textes suivis',
    hint:
      'Des passages d’une quarantaine de mots, sur la radio, la mer et le télégraphe. ' +
      'La difficulté n’est plus la lettre, c’est de tenir la distance sans décrocher.',
    texts: TEXTES,
  },
  {
    id: 'trafic',
    label: 'Chiffres et ponctuation',
    hint:
      'Des messages de service avec des nombres, des points et des virgules. Réservé à ' +
      'ceux qui ont le jeu complet : les chiffres arrivent tard dans l’ordre Koch, et ' +
      'ils se confondent volontiers entre eux.',
    texts: TRAFIC,
    full: true,
  },
];

export function corpusById(id: string): CopyCorpus {
  return COPY_CORPORA.find((corpus) => corpus.id === id) ?? (COPY_CORPORA[0] as CopyCorpus);
}
