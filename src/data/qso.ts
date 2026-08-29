/**
 * Le simulateur de contact.
 *
 * Le site enseigne les codes Q, les abréviations, les indicatifs et la
 * procédure — chacun sur sa page, et jamais ensemble. Or un contact n'est pas
 * la somme de ces pièces : c'est un **protocole**, avec un ordre, des formules
 * attendues et un moment pour chaque chose. C'est ce que personne n'apprend en
 * copiant des lettres, et ce qui bloque au premier vrai contact.
 *
 * Le déroulé ci-dessous est celui d'un QSO court en morse, tel qu'il se
 * pratique réellement : un appel général, une réponse, un échange de report,
 * et une clôture. Rien n'y est inventé ; les abréviations sont celles du
 * trafic amateur international.
 */

export interface Correspondant {
  indicatif: string;
  nom: string;
  qth: string;
  /** Le report qu'il vous donne. */
  rst: string;
}

export const CORRESPONDANTS: Correspondant[] = [
  { indicatif: 'F5NQL', nom: 'MICHEL', qth: 'BREST', rst: '579' },
  { indicatif: 'ON4KST', nom: 'LUC', qth: 'GENT', rst: '599' },
  { indicatif: 'DL2AB', nom: 'HANS', qth: 'BONN', rst: '569' },
  { indicatif: 'G3XYZ', nom: 'PETER', qth: 'LEEDS', rst: '449' },
  { indicatif: 'EA7JK', nom: 'PABLO', qth: 'SEVILLA', rst: '589' },
  { indicatif: 'HB9CQ', nom: 'URS', qth: 'BERN', rst: '559' },
  { indicatif: 'SM5AB', nom: 'LARS', qth: 'UPPSALA', rst: '539' },
  { indicatif: 'I2KRT', nom: 'MARCO', qth: 'MILANO', rst: '599' },
  { indicatif: 'OK1DX', nom: 'JIRI', qth: 'PRAHA', rst: '569' },
  { indicatif: 'LA6TP', nom: 'ODD', qth: 'BERGEN', rst: '449' },
];

/** Ce qu'une ligne émise doit contenir pour être conforme. */
export interface Exigence {
  label: string;
  test: RegExp;
}

export type QsoTour =
  | { kind: 'recois'; texte: string; note: string }
  | { kind: 'emets'; consigne: string; exigences: Exigence[]; exemple: string };

const litteral = (mot: string, label: string): Exigence => ({
  label,
  test: new RegExp(`(^|\\s)${mot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`),
});

/**
 * Le déroulé d'un contact.
 *
 * Six tours : trois où l'on copie, trois où l'on compose. La composition est
 * vérifiée par ce qu'elle contient et non mot à mot — il y a dix façons
 * correctes de répondre à un appel, et refuser les neuf autres n'apprendrait
 * qu'à réciter.
 */
export function construireQso(moi: string, lui: Correspondant): QsoTour[] {
  return [
    {
      kind: 'recois',
      texte: `CQ CQ CQ DE ${lui.indicatif} ${lui.indicatif} ${lui.indicatif} PSE K`,
      note:
        'Un appel général. L’indicatif est répété trois fois parce que c’est la seule ' +
        'chose que l’autre doit absolument saisir. PSE K veut dire « à vous, je vous prie ».',
    },
    {
      kind: 'emets',
      consigne:
        'Répondez à son appel. Donnez d’abord son indicatif, puis le vôtre, et rendez-lui ' +
        'l’antenne. Rien d’autre : à ce stade il ne sait même pas encore que vous existez.',
      exigences: [
        litteral(lui.indicatif, 'son indicatif'),
        litteral(moi, 'votre indicatif'),
        litteral('K', 'l’invitation à transmettre (K)'),
      ],
      exemple: `${lui.indicatif} DE ${moi} K`,
    },
    {
      kind: 'recois',
      texte:
        `${moi} DE ${lui.indicatif} = GE OM = UR RST ${lui.rst} ${lui.rst} = ` +
        `QTH ${lui.qth} = OP ${lui.nom} = HW? ${moi} DE ${lui.indicatif} K`,
      note:
        'Le cœur du contact. Le signe = sépare les idées comme un point. UR RST est le report ' +
        'qu’il vous donne, QTH sa position, OP son prénom, et HW? demande « comment me recevez-vous ? ».',
    },
    {
      kind: 'emets',
      consigne:
        'À votre tour. Accusez réception, donnez-lui un report en trois chiffres, votre position ' +
        'et votre prénom, puis rendez l’antenne. Servez-vous des mêmes abréviations que lui.',
      exigences: [
        { label: 'un accusé de réception (R)', test: /(^|\s)R+(\s|$)/ },
        { label: 'un report RST en trois chiffres', test: /(^|\s)(RST\s+)?[1-5][1-9][1-9](\s|$)/ },
        { label: 'votre position (QTH)', test: /(^|\s)QTH\s+\S+/ },
        { label: 'votre prénom (OP)', test: /(^|\s)OP\s+\S+/ },
        litteral(lui.indicatif, 'son indicatif'),
        litteral(moi, 'votre indicatif'),
        litteral('K', 'l’invitation à transmettre (K)'),
      ],
      exemple: `${lui.indicatif} DE ${moi} = R FB ${lui.nom} = UR RST 599 599 = QTH PARIS = OP JEAN = HW? ${lui.indicatif} DE ${moi} K`,
    },
    {
      kind: 'recois',
      texte:
        `R FB = TKS FER RPRT = 73 ES CUL = ${moi} DE ${lui.indicatif} SK`,
      note:
        'Il conclut. TKS FER RPRT remercie pour le report, 73 sont les amitiés d’usage, ' +
        'CUL veut dire « à bientôt », et SK ferme le contact pour de bon.',
    },
    {
      kind: 'emets',
      consigne:
        'Concluez à votre tour : remerciez-le, envoyez vos amitiés, et fermez le contact. ' +
        'Court — un opérateur qui traîne à la clôture fait attendre tout le monde.',
      exigences: [
        { label: 'les amitiés d’usage (73)', test: /(^|\s)73(\s|$)/ },
        litteral(lui.indicatif, 'son indicatif'),
        litteral(moi, 'votre indicatif'),
        { label: 'la clôture (SK)', test: /(^|\s)SK(\s|$)/ },
      ],
      exemple: `${lui.indicatif} DE ${moi} = TKS ES 73 = ${lui.indicatif} DE ${moi} SK`,
    },
  ];
}

/** Indicatif de repli, quand le joueur n'en a pas choisi dans les réglages. */
export const INDICATIF_PAR_DEFAUT = 'F4ABC';
