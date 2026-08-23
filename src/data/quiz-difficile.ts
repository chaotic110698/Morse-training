/**
 * Niveau difficile — réglementation.
 *
 * Deux notions à combiner, une exception à repérer, ou un cas concret qui
 * croise deux règles. Au-dessus du niveau de l'examen : qui réussit ce niveau
 * n'a plus grand-chose à craindre le jour J.
 *
 * Identifiants réservés : 200 à 299.
 */

import type { Question } from './quiz.ts';

export const DIFFICILE_REGLEMENTATION: Question[] = [
  // --- Le certificat et l'examen ---
  {
    id: 'R-CERT-200',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'certificat',
    prompt: 'Un candidat a réussi la technique il y a treize mois et échoue aujourd’hui en réglementation. Que devra-t-il repasser la fois suivante ?',
    choices: [
      'Les deux épreuves : le bénéfice de la technique est perdu',
      'La réglementation seule, le bénéfice courant toujours',
      'La réglementation seule, à condition de se représenter sous un mois',
      'Rien : la technique suffit à valider le certificat',
    ],
    answer: 0,
    explain:
      'Le bénéfice d’une épreuve réussie dure un an. Passé ce délai il tombe, et l’échec du jour ne le prolonge pas : tout est à refaire.',
  },
  {
    id: 'R-CERT-201',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'certificat',
    prompt: 'Que possède exactement un titulaire du certificat qui n’a pas encore demandé d’indicatif ?',
    choices: [
      'Une attestation de connaissances, mais aucun droit d’émettre',
      'Le droit d’émettre en écoute seule',
      'Le droit d’émettre à puissance réduite',
      'Le droit d’émettre depuis un radio-club uniquement',
    ],
    answer: 0,
    explain:
      'Le certificat atteste des connaissances, l’indicatif autorise l’émission. Sans indicatif, l’usage d’une fréquence pour émettre reste sans autorisation administrative.',
  },
  {
    id: 'R-CERT-202',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'certificat',
    prompt: 'Quelle est la différence entre la recommandation CEPT T/R 61-01 et la T/R 61-02 ?',
    choices: [
      'La 61-01 organise la circulation des opérateurs, la 61-02 définit le programme du certificat',
      'La 61-01 définit le programme du certificat, la 61-02 organise la circulation',
      'La 61-01 vise les pays membres, la 61-02 les pays non membres',
      'La 61-01 vise la classe unique, la 61-02 la classe novice',
    ],
    answer: 0,
    explain:
      'La T/R 61-01 permet de trafiquer sans formalité moins de trois mois dans un pays qui l’applique. La T/R 61-02 définit le programme commun des certificats, le HAREC.',
  },
  {
    id: 'R-CERT-203',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'certificat',
    prompt: 'En quelle année l’épreuve de télégraphie a-t-elle disparu de l’examen français ?',
    choices: ['En 2012', 'En 2003', 'En 2021', 'En 2009'],
    answer: 0,
    explain:
      'La conférence mondiale de 2003 a levé l’obligation internationale ; la France l’a suivie en 2012, année où le certificat novice a également été supprimé. C’est en 2021 qu’est tombé le point négatif.',
  },
  {
    id: 'R-CERT-204',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'certificat',
    prompt: 'Un candidat maîtrise dix questions et parvient à éliminer deux propositions sur quatre pour les dix autres. Quelle note peut-il espérer ?',
    choices: ['15 sur 20', '12,5 sur 20', '17,5 sur 20', '10 sur 20'],
    answer: 0,
    explain:
      'Une chance sur deux sur les dix questions restantes, soit cinq points espérés : 10 + 5 = 15. Éliminer deux propositions vaut donc autant que maîtriser cinq questions de plus.',
  },
  {
    id: 'R-CERT-205',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'certificat',
    prompt: 'Que se passe-t-il pour un titulaire de l’ancienne classe 3 qui souhaite aujourd’hui accéder aux bandes décamétriques ?',
    choices: [
      'Il doit passer l’examen actuel : sa classe subsiste mais n’ouvre pas ces bandes',
      'Il obtient l’accès sur simple demande à l’ANFR',
      'Il obtient l’accès après une épreuve technique seule',
      'Il y a déjà accès depuis la suppression du certificat novice',
    ],
    answer: 0,
    explain:
      'La classe 3 subsiste chez ses titulaires, avec ses limites d’origine — dix watts sur la bande des 2 mètres. Elle n’est plus délivrée, et sa suppression n’a rien élargi.',
  },
  {
    id: 'R-CERT-206',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'certificat',
    prompt: 'Combien de bonnes réponses faut-il au total, sur les quarante questions des deux épreuves, pour obtenir le certificat ?',
    choices: [
      'Vingt, à condition d’en avoir au moins dix à chaque épreuve',
      'Vingt, réparties comme on veut',
      'Vingt-quatre au minimum',
      'Vingt-huit, soit quatorze par épreuve',
    ],
    answer: 0,
    explain:
      'Les épreuves ne se compensent pas : quinze bonnes réponses en technique et cinq en réglementation font bien vingt sur quarante, mais recalent le candidat.',
  },
  {
    id: 'R-CERT-207',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'certificat',
    prompt: 'Que signifie l’équivalence CEPT du certificat français ?',
    choices: [
      'Qu’il permet de trafiquer dans les pays appliquant la recommandation, sans démarche préalable',
      'Qu’il est délivré directement par la CEPT',
      'Qu’il dispense de demander un indicatif en France',
      'Qu’il autorise les puissances du pays le plus permissif',
    ],
    answer: 0,
    explain:
      'L’équivalence porte sur la reconnaissance du certificat, pas sur les conditions d’émission : limites de bande, puissances et classes autorisées restent celles du pays visité.',
  },

  // --- Le cadre réglementaire ---
  {
    id: 'R-CADRE-200',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'cadre',
    prompt: 'Une décision de l’ARCEP relative au service amateur entre-t-elle en vigueur dès sa publication ?',
    choices: [
      'Non : elle doit être homologuée par le ministre chargé des communications électroniques',
      'Oui, dès sa publication au Journal officiel',
      'Non : elle doit être validée par l’ANFR',
      'Oui, après avis conforme de l’UIT',
    ],
    answer: 0,
    explain:
      'L’ARCEP fixe les conditions, mais ses décisions n’ont force qu’une fois homologuées par le ministre. C’est un point que l’examen vérifie volontiers.',
  },
  {
    id: 'R-CADRE-201',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'cadre',
    prompt: 'Quel acte donne force au tableau national de répartition des bandes de fréquences ?',
    choices: [
      'Un arrêté du Premier ministre',
      'Une décision de l’ARCEP homologuée',
      'La publication par l’ANFR elle-même',
      'Le Règlement des radiocommunications',
    ],
    answer: 0,
    explain:
      'L’ANFR l’édite, un arrêté du Premier ministre lui donne force. L’attribution vient de cet arrêté, l’assignation vient de l’ARCEP : deux verbes, deux étapes, deux autorités.',
  },
  {
    id: 'R-CADRE-202',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'cadre',
    prompt: 'Comment le code des postes et des communications électroniques qualifie-t-il l’usage d’une fréquence pour émettre ?',
    choices: [
      'Une occupation privative du domaine public de l’État, soumise à autorisation',
      'Un droit d’usage attaché au certificat',
      'Une liberté publique encadrée par déclaration',
      'Un service d’intérêt général délégué aux associations',
    ],
    answer: 0,
    explain:
      'Le spectre appartient au domaine public de l’État. Émettre revient à l’occuper à titre privatif, ce qui explique que l’autorisation soit individuelle et révocable.',
  },
  {
    id: 'R-CADRE-203',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'cadre',
    prompt: 'La bande des 2 mètres s’arrête à 146 MHz en France et à 148 MHz aux États-Unis. Pourquoi ?',
    choices: [
      'Les deux pays appartiennent à des régions différentes de l’UIT',
      'Les États-Unis appliquent une dérogation nationale au Règlement',
      'La France a réduit sa bande pour un service prioritaire',
      'La différence porte sur le service amateur par satellite seulement',
    ],
    answer: 0,
    explain:
      'La France est en région 1, les États-Unis en région 2. Les attributions sont fixées région par région, et un opérateur en déplacement doit se renseigner sur les limites locales.',
  },
  {
    id: 'R-CADRE-204',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'cadre',
    prompt: 'À quelle cadence la conférence mondiale des radiocommunications met-elle à jour le Règlement ?',
    choices: [
      'Tous les trois ou quatre ans',
      'Chaque année',
      'Tous les dix ans',
      'À la demande d’un pays membre',
    ],
    answer: 0,
    explain:
      'Chaque pays y envoie ses représentants ; les radioamateurs n’y sont qu’observateurs, représentés par l’IARU. C’est la conférence de 2015 qui a attribué la bande des 60 mètres.',
  },
  {
    id: 'R-CADRE-205',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'cadre',
    prompt: 'Quel texte prime en cas de contradiction apparente entre le plan de bandes de l’IARU et la décision de l’ARCEP ?',
    choices: [
      'La décision de l’ARCEP, seule à valeur réglementaire en France',
      'Le plan de bandes de l’IARU, adopté au niveau international',
      'Le Règlement des radiocommunications, qui tranche les deux',
      'Le tableau national, qui reprend le plan de l’IARU',
    ],
    answer: 0,
    explain:
      'Les plans de bandes de l’IARU organisent la cohabitation des modes par courtoisie entre amateurs. Ils ne créent aucune obligation juridique.',
  },
  {
    id: 'R-CADRE-206',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'cadre',
    prompt: 'Que retient la définition du service amateur à propos de l’intérêt de l’opérateur pour la radioélectricité ?',
    choices: [
      'Qu’il s’y intéresse à titre purement personnel et sans intérêt pécuniaire',
      'Qu’il doit justifier d’une formation technique reconnue',
      'Qu’il doit appartenir à une association déclarée',
      'Qu’il peut en tirer un revenu accessoire',
    ],
    answer: 0,
    explain:
      'Ces deux qualificatifs sont dans le texte même. Ils excluent l’usage professionnel comme l’usage associatif organisé au bénéfice d’un groupe restreint.',
  },
  {
    id: 'R-CADRE-207',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'cadre',
    prompt: 'Quel organisme fixe les conditions d’obtention du certificat et les règles d’attribution des indicatifs ?',
    choices: [
      'Le ministre chargé des communications électroniques, par arrêté',
      'L’ANFR, par décision interne',
      'L’ARCEP, par décision homologuée',
      'La CEPT, par recommandation',
    ],
    answer: 0,
    explain:
      'L’arrêté ministériel pose les règles ; l’ANFR les applique en organisant l’examen et en délivrant certificats et indicatifs. Les deux rôles se distinguent.',
  },
  // --- Classes d'émission ---
  {
    id: 'R-EMIS-200',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'emissions',
    prompt: 'Que décrit exactement la notation complète 16K0F3E ?',
    choices: [
      'Une téléphonie en modulation de fréquence occupant 16 kHz',
      'Une téléphonie en modulation de fréquence occupant 160 kHz',
      'Une télégraphie en modulation de fréquence occupant 16 kHz',
      'Une téléphonie en modulation de fréquence à 16 voies',
    ],
    answer: 0,
    explain:
      'La lettre d’unité tient lieu de virgule : 16K0 se lit 16,0 kHz. Les trois derniers caractères donnent la classe, F3E, c’est-à-dire la FM des relais.',
  },
  {
    id: 'R-EMIS-201',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'emissions',
    prompt: 'Quelle largeur de bande maximale est autorisée sur la bande des 2 mètres ?',
    choices: ['20 kHz', '12 kHz', '6 kHz', 'Aucune limite'],
    answer: 0,
    explain:
      'Le plafond suit la fréquence : 6 kHz en dessous de 28 MHz, 12 kHz de 28 à 144 MHz, 20 kHz de 144 à 225 MHz, et plus aucune limite au-delà de 225 MHz.',
  },
  {
    id: 'R-EMIS-202',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'emissions',
    prompt: 'Une émission en modulation d’amplitude porte une modulante audio de 3 kHz. Est-elle admissible sur la bande des 40 mètres ?',
    choices: [
      'Oui : elle occupe 6 kHz, soit exactement le plafond en dessous de 28 MHz',
      'Non : elle occupe 6 kHz, au-delà du plafond de 3 kHz',
      'Oui : le plafond ne s’applique qu’au-dessus de 28 MHz',
      'Non : la modulation d’amplitude est interdite sur cette bande',
    ],
    answer: 0,
    explain:
      'L’AM occupe deux fois la fréquence modulante, soit 6 kHz pour 3 kHz d’audio. C’est le plafond exact des bandes situées sous 28 MHz : elle passe tout juste.',
  },
  {
    id: 'R-EMIS-203',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'emissions',
    prompt: 'Qu’est-ce qui distingue un rayonnement hors bande d’un rayonnement non essentiel ?',
    choices: [
      'Le hors-bande jouxte la bande nécessaire, le non essentiel s’en trouve nettement éloigné',
      'Le hors-bande est interdit, le non essentiel est toléré sans limite',
      'Le hors-bande vient de l’antenne, le non essentiel de l’alimentation',
      'Les deux termes désignent la même chose',
    ],
    answer: 0,
    explain:
      'Les deux forment les rayonnements non désirés. Le hors-bande déborde immédiatement de la largeur nécessaire ; le non essentiel — harmoniques, produits de mélange — tombe plus loin.',
  },
  {
    id: 'R-EMIS-204',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'emissions',
    prompt: 'Comment se calcule la limite entre le domaine hors bande et le domaine non essentiel ?',
    choices: [
      'À deux fois et demie la largeur de bande nécessaire, de part et d’autre de la porteuse',
      'À deux fois la largeur de bande nécessaire',
      'À dix kilohertz de chaque côté de la porteuse',
      'À la moitié de la largeur de bande autorisée',
    ],
    answer: 0,
    explain:
      'Deux fois et demie la largeur nécessaire : au-delà de cette borne, on quitte le domaine hors bande pour celui des rayonnements non essentiels, plus sévèrement limités.',
  },
  {
    id: 'R-EMIS-205',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'emissions',
    prompt: 'Quelle différence de sens y a-t-il entre le chiffre 7 en deuxième position et la lettre W en troisième ?',
    choices: [
      'Le 7 compte plusieurs voies numériques, le W annonce plusieurs types d’information',
      'Le 7 compte plusieurs voies analogiques, le W plusieurs voies numériques',
      'Les deux annoncent une combinaison de modulations',
      'Le 7 vise la vidéo, le W la voix et les données',
    ],
    answer: 0,
    explain:
      'Le deuxième caractère décrit le signal modulant, le troisième l’information transportée. F7W combine donc les deux : plusieurs voies numériques portant plusieurs types d’information.',
  },
  {
    id: 'R-EMIS-206',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'emissions',
    prompt: 'Qu’est-ce qui sépare une émission A2A d’une émission F2A ?',
    choices: [
      'La modulation de la porteuse : amplitude pour la première, fréquence pour la seconde',
      'La nature de l’information : auditive pour la première, automatique pour la seconde',
      'La présence d’une sous-porteuse dans la première seulement',
      'Le nombre de voies transmises',
    ],
    answer: 0,
    explain:
      'Les deux transmettent de la télégraphie auditive par sous-porteuse. Seul le premier caractère change : A module l’amplitude de la porteuse, F sa fréquence.',
  },
  {
    id: 'R-EMIS-207',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'emissions',
    prompt: 'Quel est le seul appareil de mesure dont la présence est imposée à une station d’amateur depuis 2012 ?',
    choices: [
      'Un indicateur de puissance',
      'Un indicateur d’ondes stationnaires',
      'Une charge non rayonnante',
      'Un filtre d’alimentation',
    ],
    answer: 0,
    explain:
      'Les trois autres étaient exigés avant 2012 et restent utiles, mais ne sont plus obligatoires. L’indicateur de puissance est intégré à tous les transceivers modernes.',
  },

  // --- Bandes, statuts et puissances ---
  {
    id: 'R-BANDE-200',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'bandes',
    prompt: 'Un opérateur émet à 5 360 kHz avec 100 W en sortie d’émetteur. Est-ce conforme ?',
    choices: [
      'Non : cette bande est plafonnée à 15 W de puissance isotrope rayonnée équivalente',
      'Oui : la limite en dessous de 28 MHz est de 500 W',
      'Non : cette fréquence est hors des bandes amateur',
      'Oui, à condition d’utiliser une antenne sans gain',
    ],
    answer: 0,
    explain:
      'La bande des 60 mètres fait exception : 15 W PIRE, donc gain d’antenne compris. Cent watts y sont largement hors limites, quelle que soit l’antenne.',
  },
  {
    id: 'R-BANDE-201',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'bandes',
    prompt: 'Quelle puissance maximale est autorisée à 29,6 MHz ?',
    choices: ['250 W', '500 W', '120 W', '15 W'],
    answer: 0,
    explain:
      'La fréquence tombe dans la tranche de 28 à 30 MHz, plafonnée à 250 W. En dessous de 28 MHz on aurait droit à 500 W, au-dessus de 30 MHz à 120 W seulement — et 15 W ne concernent que la bande des 60 mètres.',
  },
  {
    id: 'R-BANDE-202',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'bandes',
    prompt: 'Que signifie un statut noté secondaire au sens du Règlement mais primaire au titre du tableau national ?',
    choices: [
      'La France accorde localement une priorité que le Règlement international ne prévoit pas',
      'Le service amateur y est prioritaire dans le monde entier',
      'La bande n’est utilisable qu’en France',
      'Le statut change selon l’heure de la journée',
    ],
    answer: 0,
    explain:
      'Le tableau national peut être plus favorable que le Règlement sur le territoire français. Cette protection ne vaut évidemment pas au-delà des frontières.',
  },
  {
    id: 'R-BANDE-203',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'bandes',
    prompt: 'Un service primaire signale un brouillage causé par une station amateur opérant en statut secondaire. Que doit faire l’opérateur ?',
    choices: [
      'Cesser de brouiller, sans pouvoir invoquer d’antériorité',
      'Réduire sa puissance de moitié et poursuivre',
      'Saisir l’ANFR pour arbitrage avant toute modification',
      'Rien : les deux services ont les mêmes droits sur la bande',
    ],
    answer: 0,
    explain:
      'Un service secondaire ne doit pas brouiller les primaires et ne peut réclamer aucune protection contre eux. L’antériorité d’usage ne crée aucun droit.',
  },
  {
    id: 'R-BANDE-204',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'bandes',
    prompt: 'Quelle est la largeur cumulée des bandes des 30 et des 17 mètres ?',
    choices: ['150 kHz', '100 kHz', '250 kHz', '50 kHz'],
    answer: 0,
    explain:
      'Le 30 mètres va de 10 100 à 10 150 kHz, soit 50 kHz ; le 17 mètres de 18 068 à 18 168 kHz, soit 100 kHz. Ensemble, 150 kHz — moins que la seule bande des 20 mètres.',
  },
  {
    id: 'R-BANDE-205',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'bandes',
    prompt: 'Quelle portion de la bande des 2 mètres est ouverte au service d’amateur par satellite ?',
    choices: [
      'La bande entière, de 144 à 146 MHz',
      'De 145 à 146 MHz seulement',
      'De 144 à 144,5 MHz seulement',
      'Aucune : le satellite est réservé au 70 centimètres',
    ],
    answer: 0,
    explain:
      'Le 2 mètres fait exception : toute la bande est ouverte au satellite. Sur le 70 centimètres, le segment satellite se limite à 435 à 438 MHz sur les dix mégahertz de la bande.',
  },
  {
    id: 'R-BANDE-206',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'bandes',
    prompt: 'Quelles sont les limites de la bande des 6 mètres en France ?',
    choices: [
      'De 50 à 52 MHz',
      'De 50 à 54 MHz',
      'De 50 à 51 MHz',
      'De 52 à 54 MHz',
    ],
    answer: 0,
    explain:
      'De 50 à 52 MHz en région 1. La région 2 monte jusqu’à 54 MHz, ce qui explique la proposition voisine — même écart qu’entre les deux versions du 2 mètres.',
  },
  {
    id: 'R-BANDE-207',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'bandes',
    prompt: 'Sur la bande des 2200 mètres, la limite est de 1 W isotrope rayonné. Qu’est-ce que cela implique en pratique ?',
    choices: [
      'Le gain de l’antenne entre dans le calcul, mais ces antennes sont si peu efficaces que le watt est difficile à atteindre',
      'L’émetteur ne doit pas dépasser 1 W en sortie',
      'La puissance doit être mesurée à l’entrée de la ligne de transmission',
      'La limite ne s’applique qu’aux stations fixes déclarées',
    ],
    answer: 0,
    explain:
      'La PIRE tient compte du gain d’antenne. Sur 2 200 mètres, les antennes réalisables sont minuscules devant la longueur d’onde : le rendement y est de quelques pour mille.',
  },
  // --- Le trafic et ses règles ---
  {
    id: 'R-TRAF-200',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'trafic',
    prompt: 'Une liaison dure quarante minutes sans changement de fréquence. Combien de fois au minimum l’indicatif doit-il être transmis ?',
    choices: [
      'Quatre fois : au début, à la fin, et deux fois en cours de liaison',
      'Deux fois : au début et à la fin',
      'Trois fois : au début, au milieu et à la fin',
      'Cinq fois : toutes les dix minutes',
    ],
    answer: 0,
    explain:
      'Début et fin, plus une réidentification toutes les quinze minutes : les quinzièmes et trentièmes minutes s’ajoutent aux deux obligations d’encadrement.',
  },
  {
    id: 'R-TRAF-201',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'trafic',
    prompt: 'Un opérateur capte par hasard une communication du service maritime. Que peut-il en faire ?',
    choices: [
      'Rien : l’écoute est libre mais la divulgation est punie par le code pénal',
      'La relater sur les bandes amateur, l’écoute étant libre depuis 1990',
      'La signaler à l’ANFR, seule autorité habilitée à la recevoir',
      'La consigner à son journal de bord, sans autre usage',
    ],
    answer: 0,
    explain:
      'Écouter est libre, répéter ne l’est pas. Intercepter, détourner, utiliser ou divulguer de mauvaise foi une correspondance coûte un an d’emprisonnement et 45 000 euros.',
  },
  {
    id: 'R-TRAF-202',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'trafic',
    prompt: 'Un opérateur trafique en cross-band via un relais qui retransmet sur une bande à laquelle il n’a pas accès. Est-ce régulier ?',
    choices: [
      'Oui : seule sa propre émission doit être conforme à ce que sa classe autorise',
      'Non : il est responsable de tout ce que le relais retransmet',
      'Oui, à condition d’en informer le gestionnaire du relais',
      'Non : le cross-band est interdit en toutes circonstances',
    ],
    answer: 0,
    explain:
      'Ce que le relais retransmet ensuite, et sur quelle bande, ne regarde pas l’opérateur. Sa responsabilité s’arrête à sa propre émission.',
  },
  {
    id: 'R-TRAF-203',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'trafic',
    prompt: 'Pourquoi le code Q ne contrevient-il pas à l’obligation de langage clair ?',
    choices: [
      'C’est une convention publique, connue de tous et publiée en annexe d’un arrêté',
      'Il ne s’applique qu’à la télégraphie, exclue de cette obligation',
      'Il est expressément autorisé par dérogation du Règlement',
      'Il ne transmet aucune information au sens du Règlement',
    ],
    answer: 0,
    explain:
      'Coder, au sens du Règlement, c’est rendre un message incompréhensible à qui l’écoute — pas l’abréger. Une convention publiée n’obscurcit rien.',
  },
  {
    id: 'R-TRAF-204',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'trafic',
    prompt: 'Dans quel cas une station d’amateur peut-elle transmettre un message émanant d’une personne non radioamateur ?',
    choices: [
      'En situation d’urgence, ou pour les secours en cas de catastrophe',
      'Lorsque le message porte sur la radioélectricité',
      'Lorsque l’expéditeur est présent à la station',
      'Jamais, sans aucune exception',
    ],
    answer: 0,
    explain:
      'C’est la seule brèche à l’interdiction du trafic pour compte de tiers. Elle est étroite, et ne couvre pas la simple commodité.',
  },
  {
    id: 'R-TRAF-205',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'trafic',
    prompt: 'Un opérateur souhaite retransmettre en direct le commentaire d’une course cycliste sur un relais. Est-ce autorisé ?',
    choices: [
      'Non : le radioguidage sur relais n’est admis qu’à titre occasionnel, pour une manifestation radioamateur',
      'Oui : le radioguidage est autorisé sans restriction',
      'Oui, à condition de s’identifier toutes les cinq minutes',
      'Non : le radioguidage est interdit en toutes circonstances',
    ],
    answer: 0,
    explain:
      'Le radioguidage est autorisé en général, mais les relais y échappent — sauf de façon occasionnelle et pour une manifestation radioamateur, ce qu’une course cycliste n’est pas.',
  },
  {
    id: 'R-TRAF-206',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'trafic',
    prompt: 'Un journal de bord porte sa dernière inscription le 15 mars 2024. Jusqu’à quelle date faut-il le conserver ?',
    choices: [
      'Jusqu’au 15 mars 2025',
      'Jusqu’au 31 décembre 2024',
      'Jusqu’au 15 septembre 2024',
      'Jusqu’au 15 mars 2027',
    ],
    answer: 0,
    explain:
      'Le délai d’un an court à compter de la dernière inscription, et non de l’ouverture du journal ni de la fin de l’année civile.',
  },
  {
    id: 'R-TRAF-207',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'trafic',
    prompt: 'Pour quel usage le codage des transmissions est-il expressément admis ?',
    choices: [
      'Les signaux de commande envoyés aux satellites amateurs',
      'Les échanges entre stations d’un même radio-club',
      'Les communications de secours en cas de catastrophe',
      'Les transmissions numériques automatiques',
    ],
    answer: 0,
    explain:
      'La raison est pratique : il faut pouvoir faire taire immédiatement un satellite en cas de brouillage, sans que n’importe qui puisse en prendre le contrôle.',
  },

  // --- La station et l'indicatif ---
  {
    id: 'R-STAT-200',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'station',
    prompt:
      'Un radioamateur français titulaire de l’indicatif F4ABC trafique depuis la Belgique sous le régime CEPT. Quel indicatif annonce-t-il ?',
    choices: ['ON/F4ABC', 'F4ABC/ON', 'F4ABC/P', 'F4ABC, sans changement'],
    answer: 0,
    explain:
      'Le régime CEPT impose le préfixe du pays visité, suivi d’une barre de fraction puis de l’indicatif d’origine. La Belgique utilise ON, d’où ON/F4ABC.',
  },
  {
    id: 'R-STAT-201',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'station',
    prompt: 'Un Français émet depuis son véhicule en Belgique. Quelle forme complète prend son indicatif ?',
    choices: ['ON/F6ABC/M', 'F6ABC/ON/M', 'ON/F6ABC/P', 'F6ABC/M/ON'],
    answer: 0,
    explain:
      'L’ordre est logique : où l’on est, qui l’on est, comment l’on opère. Le préfixe du pays visité, puis l’indicatif d’origine, puis le suffixe de mobilité.',
  },
  {
    id: 'R-STAT-202',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'station',
    prompt: 'Un opérateur italien s’installe en France pour plus de trois mois. Que doit-il obtenir ?',
    choices: [
      'Un indicatif français temporaire à suffixe de la série V',
      'Un indicatif français à suffixe de la série W',
      'Rien : le régime CEPT couvre tout séjour en Europe',
      'Un indicatif français à suffixe de la série K',
    ],
    answer: 0,
    explain:
      'La série V est réservée aux ressortissants de l’Union européenne installés plus de trois mois, la série W à ceux venus d’ailleurs. La série K reste aux radio-clubs.',
  },
  {
    id: 'R-STAT-203',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'station',
    prompt: 'Un pylône de 10 mètres est installé sur le pignon d’une maison. Une formalité d’urbanisme est-elle nécessaire ?',
    choices: [
      'Oui : l’installation modifie l’aspect du bâtiment, même en dessous de 12 mètres',
      'Non : le seuil de 12 mètres n’est pas atteint',
      'Non : les pylônes sont dispensés en zone pavillonnaire',
      'Oui, mais seulement si la commune l’exige par délibération',
    ],
    answer: 0,
    explain:
      'Le seuil de 12 mètres vaut pour un pylône posé au sol. Fixer un support sur un bâtiment en modifie l’aspect extérieur, ce qui impose une déclaration quelle que soit la hauteur.',
  },
  {
    id: 'R-STAT-204',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'station',
    prompt: 'Une station fixe rayonne 4 W de PAR sur les bandes décamétriques et 8 W en VHF. Que doit déclarer son titulaire ?',
    choices: [
      'La station, puisque le seuil de 5 W est franchi sur au moins une gamme',
      'Rien : la moyenne des deux valeurs reste sous le seuil',
      'Uniquement la partie décamétrique de l’installation',
      'Rien : le seuil de 5 W ne concerne que les stations portables',
    ],
    answer: 0,
    explain:
      'La déclaration porte sur la PAR maximale utilisée dans chacune des quatre gammes HF, VHF, UHF et SHF. Dépasser 5 W sur une seule suffit à déclencher l’obligation.',
  },
  {
    id: 'R-STAT-205',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'station',
    prompt: 'Qui doit détenir un certificat HAREC pour qu’une station de radio-club puisse être exploitée ?',
    choices: [
      'Le titulaire de l’indicatif du club, sous la responsabilité duquel la station fonctionne',
      'Chaque personne qui manœuvre la station',
      'Le président de l’association',
      'Aucun : la station du club en dispense ses utilisateurs',
    ],
    answer: 0,
    explain:
      'Le titulaire de l’indicatif du club doit détenir le HAREC. N’importe quel opérateur titulaire d’un indicatif peut ensuite manœuvrer la station, en signant F6KGL/F6GPX.',
  },
  {
    id: 'R-STAT-206',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'station',
    prompt: 'Un opérateur est condamné à six mois d’emprisonnement pour brouillage. Son indicatif est-il retiré par le tribunal ?',
    choices: [
      'Non : seule l’autorité administrative peut le suspendre ou le révoquer',
      'Oui : le retrait accompagne automatiquement la condamnation',
      'Oui, si le tribunal le prononce en peine complémentaire',
      'Non : une condamnation pénale exclut toute sanction administrative',
    ],
    answer: 0,
    explain:
      'Les deux voies sont indépendantes et peuvent se cumuler. Le juge peut confisquer ou faire détruire le matériel ; suspendre l’indicatif relève de l’administration, jusqu’à trois ans.',
  },
  {
    id: 'R-STAT-207',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'station',
    prompt: 'À la suite d’une plainte pour brouillage, l’ANFR intervient et établit que le tort vient de l’installation perturbée. Qui paie les 450 euros ?',
    choices: [
      'Le responsable des désordres, donc le plaignant dans ce cas',
      'Le radioamateur mis en cause, en toutes circonstances',
      'L’ANFR, qui supporte le coût de ses expertises',
      'Les deux parties, à parts égales',
    ],
    answer: 0,
    explain:
      'L’intervention est facturée au responsable des désordres, quel qu’il soit. Ce n’est pas une amende mais une taxe, et elle peut donc retomber sur le plaignant.',
  },

  // --- Brouillage et sécurité ---
  {
    id: 'R-SECU-200',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'securite',
    prompt: 'Un récepteur restitue la modulation d’un émetteur puissant superposée à la station écoutée, sans que la porteuse de l’émetteur soit présente. De quoi s’agit-il ?',
    choices: [
      'D’une transmodulation',
      'D’une intermodulation',
      'D’un rayonnement non essentiel de l’émetteur',
      'D’un défaut de blindage de l’antenne',
    ],
    answer: 0,
    explain:
      'La transmodulation reporte la modulation d’un signal fort sur un autre, sans sa porteuse. C’est un défaut du récepteur saturé, pas de l’émetteur incriminé.',
  },
  {
    id: 'R-SECU-201',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'securite',
    prompt: 'Quelle est la différence entre l’immunité et la susceptibilité d’un appareil ?',
    choices: [
      'La susceptibilité est l’aptitude à être perturbé, l’immunité l’aptitude à y résister',
      'La susceptibilité concerne les perturbations conduites, l’immunité les rayonnées',
      'L’immunité se mesure en émission, la susceptibilité en réception',
      'Les deux termes sont synonymes dans le vocabulaire de la CEM',
    ],
    answer: 0,
    explain:
      'Ce sont deux façons opposées de décrire la même propriété. Élever le seuil de susceptibilité s’appelle durcir l’appareil.',
  },
  {
    id: 'R-SECU-202',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'securite',
    prompt: 'Une personne reliée au sol touche la carrosserie métallique d’un appareil dont l’isolation est défaillante. Quel type de contact est-ce ?',
    choices: [
      'Un contact indirect',
      'Un contact direct',
      'Un contact capacitif',
      'Une électrisation par arc',
    ],
    answer: 0,
    explain:
      'Le contact direct met la personne en présence de la phase elle-même. Le contact indirect passe par une masse métallique portée accidentellement à un potentiel dangereux.',
  },
  {
    id: 'R-SECU-203',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'securite',
    prompt: 'En dessous de quelle tension une installation immergée n’est-elle pas considérée comme dangereuse ?',
    choices: ['12 V', '24 V', '50 V', '6 V'],
    answer: 0,
    explain:
      'Trois seuils décroissants selon le milieu : 50 V au sec, 24 V en milieu humide ou à l’extérieur, 12 V en immersion. L’eau abaisse considérablement la résistance du corps.',
  },
  {
    id: 'R-SECU-204',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'securite',
    prompt: 'Pourquoi un fusible, même rapide, ne protège-t-il pas une personne aussi bien qu’un disjoncteur différentiel ?',
    choices: [
      'Il ne détecte pas la fuite de courant vers la terre, qui peut rester très inférieure à son calibre',
      'Il coupe trop lentement, quel que soit le courant',
      'Il ne protège que la phase, pas le neutre',
      'Il ne fonctionne qu’en courant continu',
    ],
    answer: 0,
    explain:
      'Un fusible protège le circuit contre les surintensités. Quelques dizaines de milliampères traversant un corps humain sont mortels sans jamais le faire fondre.',
  },
  {
    id: 'R-SECU-205',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'securite',
    prompt: 'Un téléviseur voisin est perturbé par une émission rayonnée directement captée par ses circuits internes. Quel remède convient ?',
    choices: [
      'Blinder l’appareil perturbé',
      'Installer un filtre sur son câble secteur',
      'Mettre l’antenne d’émission à la terre',
      'Réduire la largeur de bande de l’émission',
    ],
    answer: 0,
    explain:
      'On filtre ce qui se conduit et on blinde ce qui rayonne. Un filtre secteur ne peut rien contre une perturbation qui entre directement par les circuits.',
  },
  {
    id: 'R-SECU-206',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'securite',
    prompt: 'Un pylône métallique portant une antenne peut-il servir de paratonnerre au bâtiment ?',
    choices: [
      'Non : ni le pylône, ni l’antenne, ni le câble ne sont des paratonnerres',
      'Oui, s’il est relié à une prise de terre distincte',
      'Oui, si sa hauteur dépasse celle du bâtiment',
      'Oui, à condition d’y ajouter un parafoudre',
    ],
    answer: 0,
    explain:
      'Une antenne accumule des charges statiques et subit des courants induits, mais ne canalise pas la foudre. En cas d’orage, il faut cesser d’émettre et débrancher les câbles.',
  },
  {
    id: 'R-SECU-207',
    exam: 'reglementation',
    level: 'difficile',
    topic: 'securite',
    prompt: 'Laquelle de ces phrases emploie correctement le vocabulaire de l’accident électrique ?',
    choices: [
      'Il a été électrisé et s’en est sorti',
      'Il a été électrocuté et s’en est sorti',
      'Il a été électrolysé par le courant',
      'Il a subi une électrostatique du secteur',
    ],
    answer: 0,
    explain:
      'On est électrisé quand on survit, électrocuté quand on en meurt. Dire « j’ai été électrocuté » est donc, littéralement, impossible.',
  },
];

/**
 * Niveau difficile — technique.
 *
 * Un calcul en deux temps, une conversion imbriquée, ou un piège d'unité. Les
 * résultats numériques sont tous recoupés par `logic-bank`, qui les recalcule
 * avec les fonctions de `radio-math.ts`.
 */
export const DIFFICILE_TECHNIQUE: Question[] = [
  // --- Calculs et multiples ---
  {
    id: 'T-CALC-200',
    exam: 'technique',
    level: 'difficile',
    topic: 'calcul',
    prompt: 'À combien de microfarads correspond une capacité de 0,00047 F ?',
    choices: ['470 µF', '47 µF', '4 700 µF', '0,47 µF'],
    answer: 0,
    explain:
      'Un farad vaut un million de microfarads : 0,00047 × 10⁶ = 470 µF. Le farad est une unité énorme, jamais employée telle quelle en électronique.',
  },
  {
    id: 'T-CALC-201',
    exam: 'technique',
    level: 'difficile',
    topic: 'calcul',
    prompt: 'À combien d’ohms correspond une résistance de 2,2 MΩ ?',
    choices: ['2 200 000 Ω', '220 000 Ω', '22 000 000 Ω', '2 200 Ω'],
    answer: 0,
    explain: 'Le méga vaut un million : 2,2 × 10⁶ = 2 200 000 Ω, ou 2 200 kΩ.',
  },
  {
    id: 'T-CALC-202',
    exam: 'technique',
    level: 'difficile',
    topic: 'calcul',
    prompt: 'En partant de f = 1 / (2π √(L × C)), quelle expression donne la capacité ?',
    choices: [
      'C = 1 / (4π² f² L)',
      'C = 1 / (2π f L)',
      'C = 4π² f² L',
      'C = L / (2π f)',
    ],
    answer: 0,
    explain:
      'On élève au carré pour supprimer la racine, ce qui fait apparaître 4π² f² = 1 / (L × C), puis on isole C. Le carré sur la fréquence est ce qu’on oublie le plus souvent.',
  },
  {
    id: 'T-CALC-203',
    exam: 'technique',
    level: 'difficile',
    topic: 'calcul',
    prompt: 'Entre quelles valeurs se situe une résistance marquée 4 700 Ω à 5 % de tolérance ?',
    choices: [
      'De 4 465 à 4 935 Ω',
      'De 4 695 à 4 705 Ω',
      'De 4 230 à 5 170 Ω',
      'De 4 500 à 4 900 Ω',
    ],
    answer: 0,
    explain:
      'Cinq pour cent de 4 700 font 235 ohms, à retrancher puis à ajouter. La bague de tolérance est dorée pour 5 %, argentée pour 10 %.',
  },

  // --- Lois d'Ohm et de Joule ---
  {
    id: 'T-OHM-200',
    exam: 'technique',
    level: 'difficile',
    topic: 'ohm',
    prompt: 'Une résistance de 1 kΩ et une de 3 kΩ sont en série sous 12 V. Quelle tension relève-t-on aux bornes de la seconde ?',
    choices: ['9 V', '3 V', '6 V', '12 V'],
    answer: 0,
    explain:
      'Le courant vaut 12 / 4 000 = 3 mA, et la tension aux bornes du 3 kΩ vaut 3 000 × 0,003 = 9 V. Chaque résistance prend la tension au prorata de sa valeur.',
  },
  {
    id: 'T-OHM-201',
    exam: 'technique',
    level: 'difficile',
    topic: 'ohm',
    prompt: 'Une pile de force électromotrice 9 V ne délivre plus que 8,5 V à ses bornes en débitant 0,5 A. Quelle est sa résistance interne ?',
    choices: ['1 Ω', '0,5 Ω', '17 Ω', '2 Ω'],
    answer: 0,
    explain:
      'La chute interne vaut 9 − 8,5 = 0,5 V pour 0,5 A, soit une résistance de 1 ohm. C’est elle qui limite le courant qu’une pile peut fournir.',
  },
  {
    id: 'T-OHM-202',
    exam: 'technique',
    level: 'difficile',
    topic: 'ohm',
    prompt: 'Deux résistances de 100 Ω en série sont mises en parallèle sur une troisième de 200 Ω. Que vaut l’ensemble ?',
    choices: ['100 Ω', '400 Ω', '50 Ω', '200 Ω'],
    answer: 0,
    explain:
      'Les deux premières donnent 200 Ω en série. Deux fois 200 Ω en parallèle donnent la moitié, soit 100 Ω. Il faut résoudre dans l’ordre, du plus profond au plus superficiel.',
  },
  {
    id: 'T-OHM-203',
    exam: 'technique',
    level: 'difficile',
    topic: 'ohm',
    prompt: 'Quelle puissance totale consomme un pont diviseur formé de 1 kΩ et 3 kΩ en série sous 12 V ?',
    choices: ['36 mW', '144 mW', '12 mW', '3 mW'],
    answer: 0,
    explain:
      'Le courant vaut 3 mA, et la puissance P = U × I = 12 × 0,003 = 0,036 W. Un pont diviseur consomme en permanence, même à vide.',
  },
  {
    id: 'T-OHM-204',
    exam: 'technique',
    level: 'difficile',
    topic: 'ohm',
    prompt: 'Quelle résistance dissipe exactement 1 W lorsqu’elle est soumise à 10 V ?',
    choices: ['100 Ω', '10 Ω', '1 000 Ω', '0,1 Ω'],
    answer: 0,
    explain:
      'De P = U² / R on tire R = U² / P, soit 100 / 1 = 100 Ω. Le courant vaut alors 0,1 A, ce que confirme P = U × I.',
  },

  // --- Courant alternatif ---
  {
    id: 'T-ALT-200',
    exam: 'technique',
    level: 'difficile',
    topic: 'alternatif',
    prompt: 'Un circuit série comporte 30 Ω de résistance et 40 Ω de réactance inductive. Quelle est son impédance ?',
    choices: ['50 Ω', '70 Ω', '10 Ω', '35 Ω'],
    answer: 0,
    explain:
      'Résistance et réactance ne s’additionnent pas : elles se composent par le théorème de Pythagore. La racine de 900 + 1 600 vaut 50 ohms.',
  },
  {
    id: 'T-ALT-201',
    exam: 'technique',
    level: 'difficile',
    topic: 'alternatif',
    prompt: 'Dans ce même circuit de 30 Ω résistifs et 40 Ω réactifs, quel est le déphasage entre tension et courant ?',
    choices: ['Environ 53°', 'Environ 37°', 'Environ 45°', 'Environ 90°'],
    answer: 0,
    explain:
      'La tangente de l’angle vaut X / R, soit 40 / 30 = 1,333, dont l’arc tangente donne 53,1 degrés. Le courant est en retard, la réactance étant inductive.',
  },
  {
    id: 'T-ALT-202',
    exam: 'technique',
    level: 'difficile',
    topic: 'alternatif',
    prompt: 'Deux condensateurs de 100 nF sont montés en série. Que vaut la capacité équivalente ?',
    choices: ['50 nF', '200 nF', '100 nF', '10 nF'],
    answer: 0,
    explain:
      'Les condensateurs suivent la règle inverse des résistances : ils s’additionnent en parallèle et se composent par produit sur somme en série.',
  },
  {
    id: 'T-ALT-203',
    exam: 'technique',
    level: 'difficile',
    topic: 'alternatif',
    prompt: 'Quelle tension crête à crête correspond à 230 V efficaces ?',
    choices: ['Environ 650 V', 'Environ 325 V', 'Environ 460 V', 'Environ 163 V'],
    answer: 0,
    explain:
      'La crête vaut 230 × 1,414 = 325 V, et la crête à crête en fait le double, soit 650 V. Confondre les deux fait choisir un condensateur deux fois trop faible.',
  },
  {
    id: 'T-ALT-204',
    exam: 'technique',
    level: 'difficile',
    topic: 'alternatif',
    prompt: 'Quelle est la réactance d’un condensateur de 100 pF à 14 MHz ?',
    choices: ['Environ 114 Ω', 'Environ 1 140 Ω', 'Environ 11 Ω', 'Environ 8 800 Ω'],
    answer: 0,
    explain:
      'XC = 1 / (2πfC), soit 1 / (6,283 × 14 × 10⁶ × 10⁻¹⁰) = 114 ohms. Le piège est de laisser les picofarads dans le calcul.',
  },

  // --- Transformateurs et mesures ---
  {
    id: 'T-XFO-200',
    exam: 'technique',
    level: 'difficile',
    topic: 'transformateurs',
    prompt: 'Un transformateur au rapport de spires 10 pour 1 alimente une charge de 8 Ω. Quelle impédance présente-t-il à son primaire ?',
    choices: ['800 Ω', '80 Ω', '8 000 Ω', '0,08 Ω'],
    answer: 0,
    explain:
      'Les impédances suivent le carré du rapport de spires : 8 × 100 = 800 ohms. C’est ainsi qu’on adapte un étage de sortie à un haut-parleur.',
  },
  {
    id: 'T-XFO-201',
    exam: 'technique',
    level: 'difficile',
    topic: 'transformateurs',
    prompt: 'Un transformateur 230 V vers 12 V débite 5 A au secondaire. Quel courant absorbe-t-il au primaire, pertes négligées ?',
    choices: ['Environ 0,26 A', 'Environ 5 A', 'Environ 96 A', 'Environ 2,6 A'],
    answer: 0,
    explain:
      'La puissance se conserve : 12 × 5 = 60 W, donc 60 / 230 = 0,26 A au primaire. Les courants suivent l’inverse du rapport des tensions.',
  },
  {
    id: 'T-XFO-202',
    exam: 'technique',
    level: 'difficile',
    topic: 'transformateurs',
    prompt: 'Un amplificateur consomme 100 W sur son alimentation et délivre 40 W à l’antenne. Quel est son rendement ?',
    choices: ['40 %', '60 %', '250 %', '4 %'],
    answer: 0,
    explain:
      'Le rendement est le rapport de la puissance utile à la puissance consommée : 40 / 100 = 40 %. Les 60 W restants partent en chaleur.',
  },
  {
    id: 'T-XFO-203',
    exam: 'technique',
    level: 'difficile',
    topic: 'transformateurs',
    prompt: 'Quel rapport de spires faut-il pour adapter une charge de 200 Ω à une source de 50 Ω ?',
    choices: ['1 pour 2', '1 pour 4', '2 pour 1', '1 pour 200'],
    answer: 0,
    explain:
      'Le rapport d’impédances vaut 4, et le rapport de spires en est la racine carrée, soit 2. Le secondaire compte donc deux fois plus de spires que le primaire.',
  },
  // --- Filtres et circuits accordés ---
  {
    id: 'T-CIRC-200',
    exam: 'technique',
    level: 'difficile',
    topic: 'circuits',
    prompt:
      'Dans un circuit accordé, on divise la capacité par quatre sans toucher à l’inductance. Que devient la fréquence de résonance ?',
    choices: [
      'Elle double',
      'Elle est divisée par deux',
      'Elle est multipliée par quatre',
      'Elle ne change pas',
    ],
    answer: 0,
    explain:
      'La loi de Thomson place L et C sous une racine carrée : diviser C par quatre divise le produit L × C par quatre, donc sa racine par deux, et la fréquence — qui en est l’inverse — double.',
  },
  {
    id: 'T-CIRC-201',
    exam: 'technique',
    level: 'difficile',
    topic: 'circuits',
    prompt: 'Quelle capacité faut-il associer à une bobine de 2 µH pour résonner à 7 MHz ?',
    choices: ['Environ 260 pF', 'Environ 26 pF', 'Environ 2,6 nF', 'Environ 130 pF'],
    answer: 0,
    explain:
      'De C = 1 / (4π² f² L) on tire 1 / (39,48 × 4,9 × 10¹³ × 2 × 10⁻⁶), soit 2,58 × 10⁻¹⁰ farad, c’est-à-dire 258 picofarads.',
  },
  {
    id: 'T-CIRC-202',
    exam: 'technique',
    level: 'difficile',
    topic: 'circuits',
    prompt: 'Quelle est la bande passante d’un circuit accordé sur 14 MHz dont le coefficient de surtension vaut 50 ?',
    choices: ['280 kHz', '28 kHz', '700 kHz', '2,8 MHz'],
    answer: 0,
    explain:
      'B = f / Q, soit 14 000 000 / 50 = 280 000 Hz. Un Q deux fois plus faible qu’à 7 MHz sur un circuit deux fois plus haut en fréquence quadruple la bande passante.',
  },
  {
    id: 'T-CIRC-203',
    exam: 'technique',
    level: 'difficile',
    topic: 'circuits',
    prompt: 'Comment se comporte un circuit série formé d’une bobine et d’un condensateur à sa fréquence de résonance ?',
    choices: [
      'Son impédance est minimale et se réduit à sa résistance propre',
      'Son impédance est maximale',
      'Il se comporte en circuit ouvert',
      'Son impédance devient purement capacitive',
    ],
    answer: 0,
    explain:
      'Les deux réactances s’annulent, ne laissant que la résistance des conducteurs. En parallèle, c’est l’inverse : l’impédance passe par un maximum.',
  },
  {
    id: 'T-CIRC-204',
    exam: 'technique',
    level: 'difficile',
    topic: 'circuits',
    prompt: 'Un filtre présente une bande passante de 3 kHz à −3 dB et de 12 kHz à −60 dB. Quel est son facteur de forme ?',
    choices: ['4', '0,25', '9', '15'],
    answer: 0,
    explain:
      'Le facteur de forme est le rapport de la bande à −60 dB sur celle à −3 dB : 12 / 3 = 4. Plus il est proche de 1, plus les flancs du filtre sont raides.',
  },

  // --- Diodes et alimentations ---
  {
    id: 'T-DIOD-200',
    exam: 'technique',
    level: 'difficile',
    topic: 'diodes',
    prompt: 'Une diode Zener de 5,1 V doit être traversée par 20 mA sous une alimentation de 12 V. Quelle résistance série faut-il ?',
    choices: ['345 Ω', '255 Ω', '600 Ω', '150 Ω'],
    answer: 0,
    explain:
      'La résistance encaisse la différence : 12 − 5,1 = 6,9 V, sous 20 mA, soit 6,9 / 0,02 = 345 ohms. Elle doit aussi supporter 0,14 W.',
  },
  {
    id: 'T-DIOD-201',
    exam: 'technique',
    level: 'difficile',
    topic: 'diodes',
    prompt: 'Un redressement simple alternance suivi d’un condensateur est alimenté en 12 V efficaces. Quelle tension continue obtient-on ?',
    choices: ['Environ 16,3 V', 'Environ 15,6 V', 'Environ 12 V', 'Environ 17 V'],
    answer: 0,
    explain:
      'Une seule diode conduit, donc une seule chute de 0,7 V à retrancher de la crête : 16,97 − 0,7 = 16,3 V. Un pont en retrancherait deux et donnerait 15,6 V.',
  },
  {
    id: 'T-DIOD-202',
    exam: 'technique',
    level: 'difficile',
    topic: 'diodes',
    prompt: 'Quelle tension inverse une diode doit-elle supporter dans un redresseur simple alternance suivi d’un condensateur ?',
    choices: [
      'Le double de la tension de crête',
      'La tension de crête',
      'La tension efficace',
      'La moitié de la tension de crête',
    ],
    answer: 0,
    explain:
      'Pendant l’alternance bloquée, la diode voit la tension de crête du transformateur d’un côté et celle du condensateur chargé de l’autre : les deux s’ajoutent.',
  },
  {
    id: 'T-DIOD-203',
    exam: 'technique',
    level: 'difficile',
    topic: 'diodes',
    prompt: 'Quel écart de tension de seuil sépare une diode au germanium d’une diode au silicium ?',
    choices: ['0,4 V', '0,7 V', '0,25 V', '1 V'],
    answer: 0,
    explain:
      'Le silicium conduit à partir de 0,7 V, le germanium dès 0,3 V : 0,4 V d’écart. Ce seuil plus bas explique l’emploi du germanium dans les détecteurs de faible signal.',
  },

  // --- Transistors ---
  {
    id: 'T-TRAN-200',
    exam: 'technique',
    level: 'difficile',
    topic: 'transistors',
    prompt: 'Un transistor de gain 100 doit conduire 10 mA au collecteur. Quel courant de base faut-il lui fournir ?',
    choices: ['100 µA', '1 mA', '10 µA', '1 A'],
    answer: 0,
    explain:
      'Ib = Ic / β, soit 10 × 10⁻³ / 100 = 10⁻⁴ A, c’est-à-dire 100 microampères. Un microampère de trop suffit à saturer un étage mal réglé.',
  },
  {
    id: 'T-TRAN-201',
    exam: 'technique',
    level: 'difficile',
    topic: 'transistors',
    prompt: 'Un transistor conduit 5 mA au collecteur pour 50 µA de base. Quel courant sort de son émetteur ?',
    choices: ['5,05 mA', '4,95 mA', '5 mA', '5,5 mA'],
    answer: 0,
    explain:
      'Ie = Ib + Ic, soit 0,05 + 5 = 5,05 mA. L’écart avec Ic est si faible qu’on confond souvent les deux, mais l’examen vérifie la relation exacte.',
  },
  {
    id: 'T-TRAN-202',
    exam: 'technique',
    level: 'difficile',
    topic: 'transistors',
    prompt: 'Un transistor présente 6 V entre collecteur et émetteur en conduisant 100 mA. Quelle puissance dissipe-t-il ?',
    choices: ['0,6 W', '6 W', '0,06 W', '60 W'],
    answer: 0,
    explain:
      'P = Vce × Ic, soit 6 × 0,1 = 0,6 W. C’est cette puissance qu’il faut évacuer par le radiateur, et elle est maximale à mi-conduction.',
  },
  {
    id: 'T-TRAN-203',
    exam: 'technique',
    level: 'difficile',
    topic: 'transistors',
    prompt: 'Dans un montage émetteur commun à résistance d’émetteur découplée, de quoi dépend principalement le gain en tension ?',
    choices: [
      'Du rapport entre la résistance de collecteur et celle d’émetteur',
      'Du seul gain en courant du transistor',
      'De la tension d’alimentation',
      'De la valeur du condensateur de liaison',
    ],
    answer: 0,
    explain:
      'Ce rapport rend le gain presque indépendant du transistor employé, donc reproductible d’un exemplaire à l’autre — c’est tout l’intérêt de la contre-réaction.',
  },

  // --- Amplis, oscillateurs et mélangeurs ---
  {
    id: 'T-ETAG-200',
    exam: 'technique',
    level: 'difficile',
    topic: 'etages',
    prompt: 'Un mélangeur délivre 30 MHz et 20 MHz. Quelles fréquences lui sont appliquées ?',
    choices: ['5 MHz et 25 MHz', '10 MHz et 20 MHz', '15 MHz et 15 MHz', '20 MHz et 30 MHz'],
    answer: 0,
    explain:
      'La demi-différence des sorties donne la plus basse des entrées : (30 − 20) / 2 = 5 MHz. L’autre s’obtient en retranchant : 30 − 5 = 25 MHz.',
  },
  {
    id: 'T-ETAG-201',
    exam: 'technique',
    level: 'difficile',
    topic: 'etages',
    prompt: 'Quelle est l’épaisseur d’une lame de quartz taillée pour 5 MHz ?',
    choices: ['0,57 mm', '1,14 mm', '5,7 mm', '0,285 mm'],
    answer: 0,
    explain:
      'De f = 5,7 / (2 e) on tire e = 5,7 / (2 f), soit 5,7 / 10 = 0,57 mm. Au-delà de quelques dizaines de mégahertz, la lame devient trop fragile et l’on travaille en harmonique.',
  },
  {
    id: 'T-ETAG-202',
    exam: 'technique',
    level: 'difficile',
    topic: 'etages',
    prompt: 'Quel est le rendement théorique maximal d’un amplificateur en classe A ?',
    choices: ['50 %', '78 %', '100 %', '25 %'],
    answer: 0,
    explain:
      'La moitié de la puissance consommée part en chaleur, même sans signal : le transistor conduit en permanence. La classe B monte à 78 %, la classe D bien au-delà.',
  },
  {
    id: 'T-ETAG-203',
    exam: 'technique',
    level: 'difficile',
    topic: 'etages',
    prompt: 'Quelles conditions un montage doit-il remplir pour osciller de façon entretenue ?',
    choices: [
      'Un gain de boucle au moins égal à 1 et un déphasage total nul',
      'Un gain de boucle inférieur à 1 et un déphasage de 180 degrés',
      'Un gain infini et une contre-réaction totale',
      'Un déphasage de 90 degrés et un gain unitaire',
    ],
    answer: 0,
    explain:
      'Il faut que le signal réinjecté arrive en phase et au moins aussi fort qu’il est parti. En dessous, l’oscillation s’éteint ; bien au-dessus, elle s’écrête.',
  },
  // --- Ampli op et logique ---
  {
    id: 'T-NUM-200',
    exam: 'technique',
    level: 'difficile',
    topic: 'numerique',
    prompt: 'Quelle résistance de contre-réaction donne un gain de −47 à un montage inverseur dont l’entrée est chargée par 1 kΩ ?',
    choices: ['47 kΩ', '4,7 kΩ', '470 kΩ', '48 kΩ'],
    answer: 0,
    explain:
      'Le gain vaut −R2 / R1 : pour −47 avec R1 à 1 kΩ, il faut R2 à 47 kΩ. En montage non inverseur, il aurait fallu 46 kΩ à cause du plus un.',
  },
  {
    id: 'T-NUM-201',
    exam: 'technique',
    level: 'difficile',
    topic: 'numerique',
    prompt: 'Que vaut en décimal le nombre hexadécimal A5 ?',
    choices: ['165', '155', '105', '1 605'],
    answer: 0,
    explain:
      'A vaut 10 et pèse seize : 10 × 16 = 160, plus 5 unités, soit 165. En binaire, cela s’écrit 1010 0101 — chaque chiffre hexadécimal valant quatre bits.',
  },
  {
    id: 'T-NUM-202',
    exam: 'technique',
    level: 'difficile',
    topic: 'numerique',
    prompt: 'Quel débit brut produit un signal échantillonné à 44,1 kHz et codé sur 16 bits, sur une seule voie ?',
    choices: ['705,6 kbit/s', '44,1 kbit/s', '2,8 Mbit/s', '352,8 kbit/s'],
    answer: 0,
    explain:
      'Chaque échantillon pèse 16 bits, et il en passe 44 100 par seconde : 44 100 × 16 = 705 600 bit/s. Une deuxième voie doublerait ce chiffre.',
  },
  {
    id: 'T-NUM-203',
    exam: 'technique',
    level: 'difficile',
    topic: 'numerique',
    prompt: 'Que vaut la sortie d’une porte NON ET dont les deux entrées sont à 1 ?',
    choices: ['0', '1', 'Indéterminée', 'Elle recopie une des entrées'],
    answer: 0,
    explain:
      'La porte ET donnerait 1 ; le NON inverse ce résultat. La NON ET est la seule porte qui suffise à reconstruire toutes les autres.',
  },

  // --- Récepteurs et émetteurs ---
  {
    id: 'T-RECE-200',
    exam: 'technique',
    level: 'difficile',
    topic: 'recepteurs',
    prompt: 'Un récepteur reçoit 7 MHz avec un oscillateur local à 16 MHz. Quelle est la fréquence image ?',
    choices: ['25 MHz', '9 MHz', '23 MHz', '2 MHz'],
    answer: 0,
    explain:
      'La fréquence intermédiaire vaut 16 − 7 = 9 MHz. L’image donne la même FI par l’autre produit du mélangeur : 25 − 16 = 9 MHz. Le montage est supradyne, l’image est au-dessus.',
  },
  {
    id: 'T-RECE-201',
    exam: 'technique',
    level: 'difficile',
    topic: 'recepteurs',
    prompt: 'À quelle tension correspond un signal annoncé « S9 plus 40 dB » ?',
    choices: ['5 000 µV', '500 µV', '2 000 µV', '50 000 µV'],
    answer: 0,
    explain:
      'Quarante décibels de tension valent un facteur cent : 50 µV multipliés par cent donnent 5 000 µV, soit 5 millivolts. C’est un signal très puissant.',
  },
  {
    id: 'T-RECE-202',
    exam: 'technique',
    level: 'difficile',
    topic: 'recepteurs',
    prompt: 'À quelle puissance en dBm correspond un signal S3, sachant que S9 vaut −73 dBm ?',
    choices: ['−109 dBm', '−91 dBm', '−97 dBm', '−127 dBm'],
    answer: 0,
    explain:
      'Six points S séparent S3 de S9, à 6 dB chacun, soit 36 dB à retrancher : −73 − 36 = −109 dBm.',
  },
  {
    id: 'T-RECE-203',
    exam: 'technique',
    level: 'difficile',
    topic: 'recepteurs',
    prompt: 'Pourquoi certains récepteurs emploient-ils deux changements de fréquence successifs ?',
    choices: [
      'Une première FI élevée éloigne la fréquence image, une seconde plus basse permet un filtrage étroit',
      'Pour doubler le gain sans risque d’accrochage',
      'Pour recevoir deux bandes simultanément',
      'Pour supprimer le besoin d’un oscillateur local stable',
    ],
    answer: 0,
    explain:
      'Les deux exigences sont contradictoires : plus la FI est haute, plus l’image est loin et facile à rejeter ; plus elle est basse, plus un filtre étroit est réalisable. Deux conversions permettent les deux.',
  },

  // --- Les modulations ---
  {
    id: 'T-MODU-200',
    exam: 'technique',
    level: 'difficile',
    topic: 'modulations',
    prompt: 'Quelle bande occupe, selon la règle de Carson, un signal FM d’excursion 5 kHz modulé par une audio de 3 kHz ?',
    choices: ['16 kHz', '10 kHz', '8 kHz', '30 kHz'],
    answer: 0,
    explain:
      'La règle de Carson donne 2 × (excursion + fréquence audio maximale), soit 2 × (5 + 3) = 16 kHz. Le simple doublement de l’excursion, qui donnerait 10 kHz, néglige les bandes latérales.',
  },
  {
    id: 'T-MODU-201',
    exam: 'technique',
    level: 'difficile',
    topic: 'modulations',
    prompt: 'Quel est l’indice de modulation d’un signal FM d’excursion 5 kHz modulé par une audio de 3 kHz ?',
    choices: ['Environ 1,7', 'Environ 0,6', 'Environ 8', 'Environ 15'],
    answer: 0,
    explain:
      'L’indice est le rapport de l’excursion à la fréquence audio maximale : 5 / 3 = 1,67. Il gouverne le nombre de bandes latérales significatives.',
  },
  {
    id: 'T-MODU-202',
    exam: 'technique',
    level: 'difficile',
    topic: 'modulations',
    prompt: 'Un signal utile de 10 V est accompagné d’une harmonique parasite de 0,1 V. Quel est le taux de distorsion ?',
    choices: ['1 %', '10 %', '0,1 %', '100 %'],
    answer: 0,
    explain: 'Le taux est le rapport du parasite à l’utile : 0,1 / 10 = 0,01, soit 1 %.',
  },
  {
    id: 'T-MODU-203',
    exam: 'technique',
    level: 'difficile',
    topic: 'modulations',
    prompt: 'Quel débit binaire obtient-on à 1 200 bauds avec un signal à quatre états ?',
    choices: ['2 400 bit/s', '1 200 bit/s', '4 800 bit/s', '600 bit/s'],
    answer: 0,
    explain:
      'Quatre états permettent de coder deux bits par changement : 1 200 × 2 = 2 400 bit/s. Avec seize états, chaque changement porterait quatre bits.',
  },
  {
    id: 'T-MODU-204',
    exam: 'technique',
    level: 'difficile',
    topic: 'modulations',
    prompt: 'Pourquoi une émission en bande latérale unique de 100 W porte-t-elle plus loin qu’une AM de 100 W ?',
    choices: [
      'Parce que la totalité de sa puissance sert au message, contre un sixième pour l’AM',
      'Parce qu’elle occupe une bande deux fois plus large',
      'Parce qu’elle est moins sensible aux parasites d’amplitude',
      'Parce qu’elle se propage mieux par réflexion ionosphérique',
    ],
    answer: 0,
    explain:
      'En AM à pleine modulation, la porteuse prend les deux tiers et chaque bande latérale un sixième. La BLU concentre tout dans l’unique bande utile.',
  },

  // --- Décibels et puissances ---
  {
    id: 'T-DB-200',
    exam: 'technique',
    level: 'difficile',
    topic: 'decibels',
    prompt: 'Un émetteur de 50 W alimente, à travers un câble perdant 2 dB, une antenne de gain 8 dBd. Quelle est la puissance apparente rayonnée ?',
    choices: ['200 W', '400 W', '100 W', '250 W'],
    answer: 0,
    explain:
      'Les décibels s’additionnent : 8 − 2 = 6 dB de gain net, soit un facteur quatre. Cinquante watts deviennent 200 W de PAR.',
  },
  {
    id: 'T-DB-201',
    exam: 'technique',
    level: 'difficile',
    topic: 'decibels',
    prompt: 'Que faut-il ajouter à un gain exprimé en dBd pour l’exprimer en dBi ?',
    choices: ['2,14 dB', '3 dB', '6 dB', 'Rien : les deux échelles coïncident'],
    answer: 0,
    explain:
      'Le doublet lui-même a un gain de 2,14 dB sur l’antenne isotrope : c’est l’écart constant entre les deux échelles. Une antenne de 8 dBd affiche donc 10,14 dBi.',
  },
  {
    id: 'T-DB-202',
    exam: 'technique',
    level: 'difficile',
    topic: 'decibels',
    prompt: 'Quelle perte totale présentent 20 mètres d’un câble affaiblissant 0,1 dB par mètre ?',
    choices: ['2 dB', '0,2 dB', '20 dB', '5 dB'],
    answer: 0,
    explain:
      'L’affaiblissement linéique est proportionnel à la longueur : 20 × 0,1 = 2 dB. Deux décibels perdus, c’est déjà plus d’un tiers de la puissance.',
  },
  {
    id: 'T-DB-203',
    exam: 'technique',
    level: 'difficile',
    topic: 'decibels',
    prompt: 'Quelle fraction de la puissance subsiste après une atténuation de 6 dB ?',
    choices: ['Un quart', 'La moitié', 'Un dixième', 'Un huitième'],
    answer: 0,
    explain:
      'Moins 3 dB divisent par deux, moins 6 dB par quatre. En tension, en revanche, 6 dB correspondent à un facteur deux seulement.',
  },

  // --- Antennes et lignes ---
  {
    id: 'T-ANT-200',
    exam: 'technique',
    level: 'difficile',
    topic: 'antennes',
    prompt: 'Quelle longueur donner à un doublet demi-onde pour 7,1 MHz, coefficient de raccourcissement de 0,95 compris ?',
    choices: ['Environ 20,1 m', 'Environ 21,1 m', 'Environ 10,1 m', 'Environ 42,3 m'],
    answer: 0,
    explain:
      'La demi-onde théorique vaut 150 / 7,1 = 21,1 mètres, dont 95 % font 20,07 mètres. Le brin réel est toujours un peu plus court que la théorie.',
  },
  {
    id: 'T-ANT-201',
    exam: 'technique',
    level: 'difficile',
    topic: 'antennes',
    prompt: 'Quelle impédance caractéristique doit avoir une ligne quart d’onde adaptant 50 Ω à 200 Ω ?',
    choices: ['100 Ω', '125 Ω', '150 Ω', '250 Ω'],
    answer: 0,
    explain:
      'L’impédance d’adaptation est la moyenne géométrique des deux : racine de 50 × 200 = racine de 10 000 = 100 ohms. Ce n’est pas la moyenne arithmétique, qui donnerait 125.',
  },
  {
    id: 'T-ANT-202',
    exam: 'technique',
    level: 'difficile',
    topic: 'antennes',
    prompt: 'Un rapport d’ondes stationnaires de 2 s’établit sur une ligne alimentée par 100 W. Quelle puissance revient vers l’émetteur ?',
    choices: ['Environ 11 W', 'Environ 50 W', 'Environ 33 W', 'Environ 25 W'],
    answer: 0,
    explain:
      'Le coefficient de réflexion vaut (2 − 1) / (2 + 1) = 0,333, et la puissance réfléchie son carré : 100 × 0,111 = 11,1 W. Le reste atteint bien l’antenne.',
  },
  {
    id: 'T-ANT-203',
    exam: 'technique',
    level: 'difficile',
    topic: 'antennes',
    prompt: 'Un coefficient de réflexion de 0,2 correspond à quel taux d’ondes stationnaires exprimé en pourcentage ?',
    choices: ['20 %', '2 %', '40 %', '80 %'],
    answer: 0,
    explain:
      'Le TOS en pourcentage est simplement cent fois le coefficient de réflexion. Ne pas le confondre avec le ROS, qui vaut ici 1,5 et n’a pas d’unité.',
  },
  {
    id: 'T-ANT-204',
    exam: 'technique',
    level: 'difficile',
    topic: 'antennes',
    prompt: 'Une antenne annoncée à 10 dBd affiche quel gain en dBi ?',
    choices: ['12,14 dBi', '7,86 dBi', '10 dBi', '20 dBi'],
    answer: 0,
    explain:
      'On ajoute les 2,14 dB qui séparent le doublet de l’isotrope. Les constructeurs préfèrent souvent les dBi, plus flatteurs de deux décibels.',
  },
];
