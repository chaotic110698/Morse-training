/**
 * Niveau moyen — réglementation.
 *
 * Un cran au-dessus du facile : il ne suffit plus de reconnaître une règle, il
 * faut l'appliquer à un cas, ou distinguer deux notions voisines. Les
 * propositions fausses sont plausibles — ce sont souvent les bonnes réponses
 * d'une question voisine.
 *
 * Identifiants réservés : 100 à 199.
 */

import type { Question } from './quiz.ts';

export const MOYEN_REGLEMENTATION: Question[] = [
  // --- Le certificat et l'examen ---
  {
    id: 'R-CERT-100',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'certificat',
    prompt: 'Combien de classes de certificat d’opérateur sont aujourd’hui délivrées en France ?',
    choices: [
      'Une seule, d’équivalence CEPT',
      'Deux : une classe complète et une classe novice',
      'Trois, selon les bandes accessibles',
      'Deux : avec et sans épreuve de télégraphie',
    ],
    answer: 0,
    explain:
      'Une seule classe, reconnue au niveau européen. Les classes 1, 2 et 3 subsistent chez leurs titulaires mais ne sont plus délivrées.',
  },
  {
    id: 'R-CERT-101',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'certificat',
    prompt: 'Un candidat est reçu en technique mais échoue en réglementation. Que doit-il repasser ?',
    choices: [
      'La réglementation seule, s’il se représente dans l’année',
      'Les deux épreuves, quel que soit le délai',
      'La réglementation seule, sans condition de délai',
      'Les deux épreuves, sauf s’il se représente sous six mois',
    ],
    answer: 0,
    explain:
      'Le bénéfice d’une épreuve réussie est conservé un an. Passé ce délai, les deux épreuves sont à repasser.',
  },
  {
    id: 'R-CERT-102',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'certificat',
    prompt: 'Que permettait la classe 3, dite Novice, aujourd’hui disparue ?',
    choices: [
      'Dix watts sur la seule bande des 2 mètres',
      'Cent watts sur toutes les bandes VHF et UHF',
      'Toutes les bandes, mais en télégraphie seulement',
      'Les bandes décamétriques à puissance réduite',
    ],
    answer: 0,
    explain:
      'La classe 3 s’obtenait sans épreuve technique et se limitait à dix watts sur la bande des 2 mètres, avec six classes d’émission autorisées.',
  },
  {
    id: 'R-CERT-103',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'certificat',
    prompt: 'Que désigne le sigle HAREC ?',
    choices: [
      'Le certificat harmonisé de radioamateur reconnu dans les pays de la CEPT',
      'L’organisme européen qui délivre les indicatifs',
      'Le registre européen des stations répétitrices',
      'La procédure de contrôle des installations amateur',
    ],
    answer: 0,
    explain:
      'Le HAREC est le certificat harmonisé d’examen de radioamateur. Le certificat français en est l’équivalent, ce qui permet de trafiquer dans les pays qui appliquent la recommandation CEPT.',
  },
  {
    id: 'R-CERT-104',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'certificat',
    prompt: 'Qu’obtient-on immédiatement après avoir réussi les deux épreuves ?',
    choices: [
      'Le certificat, l’indicatif faisant l’objet d’une attribution distincte',
      'Le certificat et l’indicatif dans le même acte',
      'Une autorisation provisoire d’émettre de six mois',
      'Un numéro d’écouteur, l’indicatif venant après un an de pratique',
    ],
    answer: 0,
    explain:
      'Le certificat atteste des connaissances ; l’indicatif est attribué ensuite par l’ANFR, et c’est lui qui autorise à émettre.',
  },
  {
    id: 'R-CERT-105',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'certificat',
    prompt: 'À quoi correspondait l’ancienne classe 1, par rapport à la classe 2 ?',
    choices: [
      'Elle s’obtenait en passant en plus une épreuve de télégraphie',
      'Elle autorisait une puissance double',
      'Elle donnait seule accès aux bandes VHF',
      'Elle était réservée aux responsables de radio-clubs',
    ],
    answer: 0,
    explain:
      'La classe 1 ajoutait une épreuve de télégraphie, supprimée depuis. La CW reste autorisée sur toutes les bandes dès le premier jour, sans condition.',
  },
  {
    id: 'R-CERT-106',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'certificat',
    prompt: 'Quelles bandes et quelles classes d’émission le certificat actuel autorise-t-il ?',
    choices: [
      'Toutes les bandes amateur et toutes les classes d’émission, la puissance seule étant plafonnée',
      'Les bandes au-dessus de 30 MHz uniquement, sans limite de mode',
      'Toutes les bandes, mais seulement les six classes d’émission courantes',
      'Toutes les bandes en télégraphie, les décamétriques en téléphonie',
    ],
    answer: 0,
    explain:
      'Le certificat unique donne accès à tout le spectre amateur et à toutes les classes d’émission. Seule la puissance est plafonnée, et ce plafond dépend de la fréquence.',
  },
  {
    id: 'R-CERT-107',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'certificat',
    prompt: 'Un candidat maîtrise sûrement sept questions sur vingt et répond au hasard aux treize autres. Quelle note peut-il espérer en moyenne ?',
    choices: [
      'Environ 10,25 sur 20',
      'Environ 7 sur 20',
      'Environ 13 sur 20',
      'Environ 8,75 sur 20',
    ],
    answer: 0,
    explain:
      'Quatre propositions, donc un quart de point espéré par réponse au hasard : 7 + 13 × 0,25 = 10,25. Tout juste la moyenne — un calcul rassurant, pas confortable.',
  },

  // --- Le cadre réglementaire ---
  {
    id: 'R-CADRE-100',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'cadre',
    prompt: 'Quelle différence y a-t-il entre attribuer et assigner une fréquence ?',
    choices: [
      'On attribue une bande à un service, on assigne une fréquence à une station',
      'On attribue une fréquence à une station, on assigne une bande à un pays',
      'Les deux termes sont équivalents dans le Règlement',
      'On attribue à titre secondaire, on assigne à titre primaire',
    ],
    answer: 0,
    explain:
      'L’attribution vise un service dans une bande donnée ; l’assignation autorise une station précise à employer une fréquence. Les deux mots ne sont pas interchangeables.',
  },
  {
    id: 'R-CADRE-101',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'cadre',
    prompt: 'Quel est le rôle de l’IARU ?',
    choices: [
      'Représenter les radioamateurs et proposer des plans de bandes, sans pouvoir réglementaire',
      'Attribuer les indicatifs à l’échelle mondiale',
      'Édicter les conditions techniques applicables aux stations amateur',
      'Contrôler les brouillages entre pays',
    ],
    answer: 0,
    explain:
      'L’IARU est une fédération d’associations nationales. Ses plans de bandes sont des recommandations d’usage entre amateurs, respectées par courtoisie et non par obligation légale.',
  },
  {
    id: 'R-CADRE-102',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'cadre',
    prompt: 'Qu’ajoute la définition du service d’amateur par satellite à celle du service d’amateur ?',
    choices: [
      'L’emploi de stations spatiales placées sur des satellites de la Terre',
      'La possibilité de trafiquer avec des stations professionnelles',
      'L’autorisation de relayer des communications de tiers',
      'La dispense de tenue du journal de bord',
    ],
    answer: 0,
    explain:
      'Même objet, même esprit : c’est le service d’amateur utilisant des stations spatiales sur des satellites de la Terre. Les obligations de l’opérateur restent identiques.',
  },
  {
    id: 'R-CADRE-103',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'cadre',
    prompt: 'Qui établit le tableau national de répartition des bandes de fréquences ?',
    choices: [
      'L’ANFR, qui le tient à jour pour tous les services',
      'L’ARCEP, dans sa décision relative au service amateur',
      'Le ministère chargé des communications électroniques',
      'L’UIT, qui le transpose en droit national',
    ],
    answer: 0,
    explain:
      'Le tableau national est l’œuvre de l’ANFR — c’est un arrêté du Premier ministre qui lui donne force — et il répartit tout le spectre entre les affectataires. La décision de l’ARCEP, elle, ne traite que des conditions faites au service amateur.',
  },
  {
    id: 'R-CADRE-104',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'cadre',
    prompt: 'Dans quelle catégorie d’installations radioélectriques les stations d’amateur sont-elles classées ?',
    choices: [
      'La troisième catégorie',
      'La première catégorie',
      'La deuxième catégorie',
      'Elles ne relèvent d’aucune catégorie',
    ],
    answer: 0,
    explain:
      'Le code des postes et des communications électroniques range les installations du service amateur en troisième catégorie, celle des installations dont l’usage est soumis à autorisation individuelle.',
  },
  {
    id: 'R-CADRE-105',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'cadre',
    prompt: 'Un radioamateur peut-il faire la publicité d’un matériel sur les ondes ?',
    choices: [
      'Non : le service s’exerce sans intérêt pécuniaire',
      'Oui, s’il ne le vend pas lui-même',
      'Oui, sur les bandes au-dessus de 30 MHz',
      'Oui, à condition de citer plusieurs marques',
    ],
    answer: 0,
    explain:
      'Le cours l’illustre par un cas classique : commenter le contenu d’une revue technique est autorisé, en faire la publicité ne l’est pas.',
  },
  {
    id: 'R-CADRE-106',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'cadre',
    prompt: 'Quelle recommandation de la CEPT organise la libre circulation des opérateurs en Europe ?',
    choices: ['La T/R 61-01', 'La T/R 61-02', 'La CEPT 12-1241', 'La HAREC 2000'],
    answer: 0,
    explain:
      'La T/R 61-01 permet de trafiquer sans formalité dans un pays qui l’applique, pour un séjour de moins de trois mois. La T/R 61-02 traite, elle, du certificat HAREC.',
  },
  {
    id: 'R-CADRE-107',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'cadre',
    prompt: 'À quel titre les plans de bandes de l’IARU s’imposent-ils à un opérateur français ?',
    choices: [
      'Ils ne s’imposent pas : ce sont des usages, seule la décision de l’ARCEP fait droit',
      'Ils s’imposent au même titre que la décision de l’ARCEP',
      'Ils s’imposent uniquement pendant les concours',
      'Ils s’imposent aux stations répétitrices seulement',
    ],
    answer: 0,
    explain:
      'Les plans de bandes de l’IARU organisent la cohabitation des modes par courtoisie. Ce qui fait droit en France, ce sont le tableau national et la décision de l’ARCEP.',
  },
  // --- Classes d'émission ---
  {
    id: 'R-EMIS-100',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'emissions',
    prompt: 'À quel mode correspond la classe d’émission A3E ?',
    choices: [
      'La téléphonie en modulation d’amplitude, avec porteuse et deux bandes latérales',
      'La téléphonie en bande latérale unique',
      'La télégraphie modulée en amplitude',
      'Le fac-similé en modulation d’amplitude',
    ],
    answer: 0,
    explain:
      'A pour la modulation d’amplitude classique, 3 pour une voie analogique, E pour la voix : c’est l’AM historique, avec sa porteuse et ses deux bandes latérales.',
  },
  {
    id: 'R-EMIS-101',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'emissions',
    prompt: 'Que désigne la classe d’émission A2A ?',
    choices: [
      'De la télégraphie dont une sous-porteuse audible est manipulée, porteuse conservée',
      'De la télégraphie au manipulateur, porteuse coupée',
      'De la téléphonie à double bande latérale',
      'De la télégraphie automatique lue par une machine',
    ],
    answer: 0,
    explain:
      'Le 2 signale une sous-porteuse modulante. La porteuse reste présente, ce qui permet de recevoir cette émission sur un poste dépourvu d’oscillateur de battement.',
  },
  {
    id: 'R-EMIS-102',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'emissions',
    prompt: 'Quelle différence sépare les classes F3E et G3E ?',
    choices: [
      'F module la fréquence, G module la phase',
      'F transmet de la voix, G des données',
      'F occupe une bande double de celle de G',
      'F emploie une sous-porteuse, G n’en emploie pas',
    ],
    answer: 0,
    explain:
      'Les deux sont des modulations angulaires, si proches qu’on les confond souvent. En cas de doute sur la nature de la modulation, c’est le code F qui est retenu.',
  },
  {
    id: 'R-EMIS-103',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'emissions',
    prompt: 'La télévision à balayage lent se note J3C. Que dit le C final ?',
    choices: [
      'Qu’il s’agit de fac-similé, c’est-à-dire d’images fixes',
      'Qu’il s’agit de vidéo animée',
      'Qu’il s’agit de données numériques',
      'Qu’il s’agit d’une combinaison de plusieurs informations',
    ],
    answer: 0,
    explain:
      'Malgré son nom, la SSTV transmet des images fixes : c’est du fac-similé, code C, et non de la télévision, qui porterait le code F.',
  },
  {
    id: 'R-EMIS-104',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'emissions',
    prompt: 'Que décrit la classe d’émission F7W, employée par le D-Star ?',
    choices: [
      'Plusieurs voies numériques portant plusieurs types d’information, en modulation de fréquence',
      'Une voie numérique unique portant de la voix, en modulation de fréquence',
      'Plusieurs voies analogiques portant de la voix et des images',
      'Une voie analogique portant des données, en modulation de phase',
    ],
    answer: 0,
    explain:
      'F pour la modulation de fréquence, 7 pour plusieurs voies numériques, W pour la combinaison de plusieurs types d’information — voix et données transitent ensemble.',
  },
  {
    id: 'R-EMIS-105',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'emissions',
    prompt: 'Dans la notation complète 2K80J3E, que représente le groupe 2K80 ?',
    choices: [
      'La largeur de bande occupée, soit 2,80 kHz',
      'La puissance de l’émission, soit 2,80 kilowatts',
      'La fréquence de la sous-porteuse, soit 2 800 Hz',
      'Le numéro de classe attribué par l’UIT',
    ],
    answer: 0,
    explain:
      'La lettre de multiple tient lieu de virgule : 2K80 se lit 2,80 kHz. Ce préfixe facultatif précède les trois caractères de la classe proprement dite.',
  },
  {
    id: 'R-EMIS-106',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'emissions',
    prompt: 'Le PSK31 se note G2B. Que faut-il en conclure ?',
    choices: [
      'C’est un protocole, qui emploie une classe d’émission mais n’en est pas une',
      'C’est une classe d’émission réservée aux modes numériques',
      'C’est une émission analogique à sous-porteuse',
      'C’est une classe interdite aux radioamateurs',
    ],
    answer: 0,
    explain:
      'G pour la modulation de phase, 2 pour une voie numérique à sous-porteuse, B pour la télégraphie automatique. Le nom PSK31 désigne le protocole, pas la classe.',
  },
  {
    id: 'R-EMIS-107',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'emissions',
    prompt: 'Laquelle de ces classes d’émission ne figurait pas parmi les six autorisées à l’ancienne classe 3 ?',
    choices: ['A1B', 'A1A', 'F3E', 'J3E'],
    answer: 0,
    explain:
      'Les six classes ouvertes aux opérateurs Novice étaient A1A, A2A, A3E, F3E, G3E et J3E. La télégraphie automatique A1B n’en faisait pas partie.',
  },

  // --- Bandes, statuts et puissances ---
  {
    id: 'R-BANDE-100',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'bandes',
    prompt: 'Quelle puissance maximale un titulaire du certificat peut-il utiliser sur la bande des 20 mètres ?',
    choices: ['500 W', '120 W', '250 W', '1 000 W'],
    answer: 0,
    explain:
      'De 479 kHz à 28 MHz, la limite est de 500 W en sortie d’émetteur. Elle tombe à 250 W entre 28 et 30 MHz, puis à 120 W au-dessus de 30 MHz.',
  },
  {
    id: 'R-BANDE-101',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'bandes',
    prompt: 'Quelle puissance maximale est autorisée sur la bande des 10 mètres ?',
    choices: ['250 W', '500 W', '120 W', '100 W'],
    answer: 0,
    explain:
      'La bande des 10 mètres s’étend de 28 à 29,7 MHz, donc dans la tranche 28 à 30 MHz où la limite est de 250 W en sortie d’émetteur.',
  },
  {
    id: 'R-BANDE-102',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'bandes',
    prompt: 'Quelle puissance maximale est autorisée sur la bande des 60 mètres ?',
    choices: [
      '15 W en puissance isotrope rayonnée équivalente',
      '500 W en sortie d’émetteur',
      '1 W en puissance isotrope rayonnée équivalente',
      '250 W en sortie d’émetteur',
    ],
    answer: 0,
    explain:
      'Cette bande étroite fait exception : de 5,3515 à 5,3665 MHz, la limite est de 15 W PIRE — donc gain d’antenne compris, ce qui est bien plus restrictif.',
  },
  {
    id: 'R-BANDE-103',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'bandes',
    prompt: 'Quelle puissance est autorisée sur les bandes situées en dessous de 479 kHz ?',
    choices: [
      '1 W en puissance isotrope rayonnée équivalente',
      '15 W en puissance isotrope rayonnée équivalente',
      '500 W en sortie d’émetteur',
      '100 W en sortie d’émetteur',
    ],
    answer: 0,
    explain:
      'Les bandes des 2200 et 630 mètres sont plafonnées à 1 W PIRE. Sur ces longueurs d’onde, les antennes sont si inefficaces que le watt rayonné reste difficile à atteindre.',
  },
  {
    id: 'R-BANDE-104',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'bandes',
    prompt: 'Quelle est la largeur de la bande des 20 mètres ?',
    choices: ['350 kHz', '200 kHz', '450 kHz', '300 kHz'],
    answer: 0,
    explain:
      'De 14 000 à 14 350 kHz, soit 350 kHz. À titre de comparaison, le 40 mètres n’en fait que 200 et le 15 mètres 450.',
  },
  {
    id: 'R-BANDE-105',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'bandes',
    prompt: 'Quel segment de la bande des 70 centimètres est ouvert au service d’amateur par satellite ?',
    choices: [
      'De 435 à 438 MHz',
      'De 430 à 440 MHz',
      'De 430 à 432 MHz',
      'De 438 à 440 MHz',
    ],
    answer: 0,
    explain:
      'Le segment satellite est bien plus étroit que la bande : trois mégahertz sur dix. Confondre les deux est une erreur classique.',
  },
  {
    id: 'R-BANDE-106',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'bandes',
    prompt: 'Quel statut le service amateur détient-il sur la bande des 30 mètres ?',
    choices: [
      'Secondaire',
      'Primaire exclusif',
      'Primaire partagé',
      'Secondaire au sens international mais primaire au plan national',
    ],
    answer: 0,
    explain:
      'Le 30 mètres est une bande secondaire : il faut s’effacer devant les services primaires et n’attendre d’eux aucune protection. Le 20 et le 40 mètres, eux, sont primaires.',
  },
  {
    id: 'R-BANDE-107',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'bandes',
    prompt: 'Un opérateur veut émettre en télégraphie à 14 025 kHz. Est-ce conforme au plan de bandes ?',
    choices: [
      'Oui : ce segment est celui réservé à la télégraphie sur cette bande',
      'Non : la télégraphie commence à 14 100 kHz',
      'Non : cette fréquence est hors de la bande des 20 mètres',
      'Oui, mais uniquement pendant les concours',
    ],
    answer: 0,
    explain:
      'La portion basse de chaque bande revient à la télégraphie : de 14 000 à 14 070 kHz sur le 20 mètres. La fréquence proposée y tombe.',
  },
  // --- Le trafic et ses règles ---
  {
    id: 'R-TRAF-100',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'trafic',
    prompt:
      'Au cours d’une émission qui dure plus d’un quart d’heure sur la même fréquence, à quelle cadence l’indicatif doit-il être retransmis ?',
    choices: [
      'Toutes les quinze minutes',
      'Toutes les cinq minutes',
      'Toutes les dix minutes',
      'Une seule fois suffit, au début',
    ],
    answer: 0,
    explain:
      'L’indicatif se transmet au début et à la fin de toute période d’émission, toutes les quinze minutes au-delà d’un quart d’heure sur la même fréquence, et à chaque changement de fréquence.',
  },
  {
    id: 'R-TRAF-101',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'trafic',
    prompt: 'Un opérateur change de fréquence en cours de liaison. Que doit-il faire ?',
    choices: [
      'Retransmettre son indicatif au début de l’émission sur la nouvelle fréquence',
      'Rien de particulier, la liaison se poursuivant',
      'Consigner le changement au journal sans le transmettre',
      'Attendre quinze minutes avant de se réidentifier',
    ],
    answer: 0,
    explain:
      'Chaque changement de fréquence rouvre une période d’émission : l’indicatif doit être transmis à son début, comme au début de toute émission.',
  },
  {
    id: 'R-TRAF-102',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'trafic',
    prompt: 'Émettre et recevoir sur deux fréquences différentes est-il autorisé ?',
    choices: [
      'Oui, en split, en cross-band ou via un relais, dans la limite de ce que la classe autorise',
      'Non, sauf via une station répétitrice',
      'Oui, mais sur la même bande seulement',
      'Non, l’émission et la réception doivent partager la fréquence',
    ],
    answer: 0,
    explain:
      'Ce que le relais retransmet ensuite, et sur quelle bande, ne regarde pas l’opérateur : seule compte la conformité de sa propre émission.',
  },
  {
    id: 'R-TRAF-103',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'trafic',
    prompt: 'Lequel de ces sujets de conversation est autorisé sur les bandes amateur ?',
    choices: [
      'L’astronomie',
      'L’astrologie',
      'Les résultats sportifs commentés en direct',
      'Les petites annonces commerciales',
    ],
    answer: 0,
    explain:
      'Les pièges portent sur les mots eux-mêmes : l’astronomie est autorisée, l’astrologie non. La liste comprend aussi la radioélectricité, l’informatique, la météorologie, la réglementation et la vie associative.',
  },
  {
    id: 'R-TRAF-104',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'trafic',
    prompt: 'Le radioguidage est-il autorisé sur une station répétitrice ?',
    choices: [
      'Non, sauf occasionnellement pour une manifestation radioamateur',
      'Oui, sans restriction',
      'Non, en aucun cas',
      'Oui, à condition de le consigner au journal',
    ],
    answer: 0,
    explain:
      'Le radioguidage est autorisé en général, mais pas sur les relais — sauf de façon occasionnelle, à l’occasion d’une manifestation radioamateur.',
  },
  {
    id: 'R-TRAF-105',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'trafic',
    prompt: 'Que risque celui qui divulgue de mauvaise foi une correspondance interceptée ?',
    choices: [
      'Un an d’emprisonnement et 45 000 euros d’amende',
      'Six mois d’emprisonnement et 30 000 euros d’amende',
      'La suspension de son indicatif pour trois ans',
      'Une amende forfaitaire de 450 euros',
    ],
    answer: 0,
    explain:
      'C’est le code pénal qui s’applique, et non la réglementation des télécommunications : le secret des correspondances protège tout message émis par voie électronique.',
  },
  {
    id: 'R-TRAF-106',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'trafic',
    prompt: 'Sous quelle forme le journal de bord peut-il être tenu ?',
    choices: [
      'Sous toute forme, y compris informatique, la seule exigence étant la traçabilité',
      'Sur registre papier exclusivement, à pages numérotées',
      'Sous forme informatique exclusivement depuis 2012',
      'Sur un formulaire fourni par l’ANFR',
    ],
    answer: 0,
    explain:
      'Papier à pages numérotées et non détachables, fichier informatique, ou tout autre procédé adapté à un opérateur handicapé ou non-voyant : la forme est libre, la tenue ne l’est pas.',
  },
  {
    id: 'R-TRAF-107',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'trafic',
    prompt: 'Que peut transmettre une station répétitrice, au-delà de son indicatif ?',
    choices: [
      'Sa position, son fonctionnement et les conditions locales de propagation',
      'Tout message d’intérêt général pour les radioamateurs',
      'Les bulletins d’information de son association',
      'Rien d’autre que son indicatif',
    ],
    answer: 0,
    explain:
      'Une répétitrice ne doit pas non plus servir un usage personnel ni un groupe restreint, et doit disposer d’un dispositif d’arrêt d’urgence.',
  },

  // --- La station et l'indicatif ---
  {
    id: 'R-STAT-100',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'station',
    prompt: 'Un opérateur titulaire de l’indicatif F6GPX manœuvre la station du radio-club F6KGL. Que doit-il transmettre ?',
    choices: ['F6KGL/F6GPX', 'F6GPX/F6KGL', 'F6KGL seul', 'F6GPX seul'],
    answer: 0,
    explain:
      'L’indicatif du club vient d’abord, celui de l’opérateur ensuite. Le journal de bord du club porte alors l’indicatif de chaque utilisateur.',
  },
  {
    id: 'R-STAT-101',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'station',
    prompt: 'Combien de temps un indicatif spécial d’événement peut-il être utilisé ?',
    choices: [
      'Quinze jours non consécutifs au maximum, sur une période de six mois',
      'Trente jours consécutifs au maximum',
      'Un an, renouvelable une fois',
      'La durée de l’événement, sans limite fixée',
    ],
    answer: 0,
    explain:
      'La demande se dépose au moins vingt jours ouvrables à l’avance, et seul un opérateur titulaire d’un certificat HAREC peut la faire.',
  },
  {
    id: 'R-STAT-102',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'station',
    prompt: 'Quel préfixe porte un indicatif spécial délivré pour un événement en France continentale ?',
    choices: ['TM', 'TO', 'TX', 'FX'],
    answer: 0,
    explain:
      'TM en France continentale, TK en Corse, TO dans les départements et régions d’outre-mer, TX ailleurs en outre-mer, FX pour un événement lié à une station spatiale.',
  },
  {
    id: 'R-STAT-103',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'station',
    prompt: 'Quelle est la durée maximale de suspension administrative d’un indicatif ?',
    choices: ['Trois ans', 'Un an', 'Six mois', 'Cinq ans'],
    answer: 0,
    explain:
      'La suspension peut aller jusqu’à trois ans, ou la révocation être définitive. La décision revient à l’autorité qui a délivré l’indicatif, jamais à un particulier ni à une association.',
  },
  {
    id: 'R-STAT-104',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'station',
    prompt: 'Que risque celui qui utilise sciemment l’indicatif d’une autre station ?',
    choices: [
      'Un an d’emprisonnement',
      'Six mois d’emprisonnement',
      'Une simple amende administrative',
      'La confiscation du matériel seulement',
    ],
    answer: 0,
    explain:
      'Perturber au moyen d’une installation radioélectrique ou utiliser une fréquence hors des conditions prévues coûte six mois et 30 000 euros ; usurper un indicatif coûte un an.',
  },
  {
    id: 'R-STAT-105',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'station',
    prompt: 'Un tribunal peut-il retirer son indicatif à un opérateur condamné ?',
    choices: [
      'Non : le retrait est une décision administrative, le tribunal peut seulement confisquer le matériel',
      'Oui, à titre de peine complémentaire',
      'Oui, mais seulement en cas de récidive',
      'Non : seul le titulaire peut y renoncer',
    ],
    answer: 0,
    explain:
      'Les deux voies sont indépendantes. Le juge peut confisquer ou faire détruire le matériel ; suspendre ou révoquer l’indicatif relève de l’administration.',
  },
  {
    id: 'R-STAT-106',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'station',
    prompt: 'Que doit contenir la déclaration de puissance apparente rayonnée adressée à l’ANFR ?',
    choices: [
      'L’adresse de la station, ses coordonnées GPS et la PAR maximale par gamme de fréquences',
      'La liste des équipements détenus et leur numéro de série',
      'Le plan de l’installation et la hauteur des antennes',
      'Le journal de bord des douze derniers mois',
    ],
    answer: 0,
    explain:
      'Les coordonnées sont au format WGS84, et la PAR est déclarée pour les quatre gammes HF, VHF, UHF et SHF. Le matériel détenu n’a pas à être déclaré.',
  },
  {
    id: 'R-STAT-107',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'station',
    prompt: 'Un radioamateur construit lui-même son émetteur. Doit-il le faire marquer CE ?',
    choices: [
      'Non : les constructions personnelles échappent à cette exigence',
      'Oui, comme tout équipement radioélectrique',
      'Oui, sauf s’il reste en dessous de 10 watts',
      'Non, à condition de le déclarer à l’ANFR',
    ],
    answer: 0,
    explain:
      'Constructions personnelles, kits assemblés pour son usage et équipements modifiés ne sont pas considérés comme des équipements disponibles dans le commerce.',
  },

  // --- Brouillage et sécurité ---
  {
    id: 'R-SECU-100',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'securite',
    prompt: 'Qu’appelle-t-on intermodulation ?',
    choices: [
      'La production de fréquences parasites par mélange de plusieurs signaux dans un étage non linéaire',
      'Le transfert de la modulation d’un émetteur puissant sur un signal voisin',
      'La perturbation d’un appareil par conduction le long du secteur',
      'La saturation d’un récepteur par un signal trop fort',
    ],
    answer: 0,
    explain:
      'Deux signaux qui traversent ensemble un étage non linéaire engendrent des combinaisons de leurs fréquences, dont certaines peuvent tomber en pleine bande utile.',
  },
  {
    id: 'R-SECU-101',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'securite',
    prompt: 'Qu’appelle-t-on transmodulation ?',
    choices: [
      'Le report de la modulation d’un émetteur puissant sur le signal d’une autre station',
      'La création de fréquences somme et différence dans un mélangeur',
      'Le passage d’une classe d’émission à une autre en cours de liaison',
      'La conversion d’un signal modulé en amplitude vers la fréquence modulée',
    ],
    answer: 0,
    explain:
      'On entend alors la modulation de la station puissante superposée à celle qu’on écoute, sans que sa porteuse soit présente. C’est un défaut du récepteur, pas de l’émetteur.',
  },
  {
    id: 'R-SECU-102',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'securite',
    prompt: 'Que désigne le seuil de susceptibilité d’un appareil ?',
    choices: [
      'Le niveau de perturbation à partir duquel son fonctionnement se dégrade',
      'La puissance maximale qu’il peut émettre sans brouiller',
      'La tension d’alimentation minimale nécessaire à son fonctionnement',
      'Le niveau de signal en dessous duquel il ne reçoit plus rien',
    ],
    answer: 0,
    explain:
      'La susceptibilité est l’aptitude à être perturbé, l’immunité l’aptitude à y résister. Élever ce seuil s’appelle durcir l’appareil.',
  },
  {
    id: 'R-SECU-103',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'securite',
    prompt: 'En dessous de quelle tension une installation en milieu humide n’est-elle pas considérée comme dangereuse ?',
    choices: ['24 V', '50 V', '12 V', '36 V'],
    answer: 0,
    explain:
      'Trois seuils selon le milieu : 50 V au sec, 24 V en milieu humide ou à l’extérieur, 12 V en immersion.',
  },
  {
    id: 'R-SECU-104',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'securite',
    prompt: 'Quel remède convient à une perturbation qui se propage par conduction sur le câble secteur ?',
    choices: [
      'Un filtre secteur, éventuellement complété par une ferrite sur le câble',
      'Un blindage métallique autour de l’appareil perturbé',
      'Un éloignement de l’antenne d’émission',
      'Une mise à la terre de la carcasse seulement',
    ],
    answer: 0,
    explain:
      'On filtre ce qui se conduit et on blinde ce qui rayonne. Confondre les deux remèdes est le meilleur moyen de ne rien corriger.',
  },
  {
    id: 'R-SECU-105',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'securite',
    prompt: 'Comment disposer le câble coaxial de descente d’antenne pour réduire le risque de foudroiement ?',
    choices: [
      'En lui faisant faire des coudes francs',
      'En le tendant le plus droit possible',
      'En l’enroulant en bobine à la base du pylône',
      'En le doublant d’un conducteur de terre parallèle',
    ],
    answer: 0,
    explain:
      'La foudre cherche le chemin le plus court et le plus droit : un coude franc la décourage. En cas d’orage, il faut de toute façon cesser d’émettre et débrancher.',
  },
  {
    id: 'R-SECU-106',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'securite',
    prompt: 'Quel équipement est requis pour la personne qui reste au pied d’un pylône pendant une intervention ?',
    choices: [
      'Un casque',
      'Un harnais et une longe',
      'Des gants isolants',
      'Aucun équipement particulier',
    ],
    answer: 0,
    explain:
      'Baudrier ou harnais et longe à mousqueton pour qui grimpe, casque pour qui reste en bas, balisage si l’intervention empiète sur la voie publique.',
  },
  {
    id: 'R-SECU-107',
    exam: 'reglementation',
    level: 'moyen',
    topic: 'securite',
    prompt: 'Quel est le stade le plus grave de l’électrisation ?',
    choices: [
      'La fibrillation cardiaque',
      'La contraction locale des muscles',
      'La contraction des muscles respiratoires',
      'La brûlure au point de contact',
    ],
    answer: 0,
    explain:
      'La gravité augmente par paliers : contraction locale, puis contraction des muscles respiratoires avec risque d’asphyxie, puis fibrillation cardiaque pouvant entraîner le décès.',
  },
];

/**
 * Niveau moyen — technique.
 *
 * Un calcul en une étape, sur des valeurs choisies pour tomber juste, ou une
 * déduction à partir d'une loi connue. Chaque résultat numérique est recoupé
 * par le test `logic-bank`, qui le recalcule avec les fonctions de
 * `radio-math.ts` : aucune valeur de ce fichier n'a été posée de mémoire.
 */
export const MOYEN_TECHNIQUE: Question[] = [
  // --- Calculs et multiples ---
  {
    id: 'T-CALC-100',
    exam: 'technique',
    level: 'moyen',
    topic: 'calcul',
    prompt: 'À combien de nanofarads correspond une capacité de 2 200 pF ?',
    choices: ['2,2 nF', '22 nF', '0,22 nF', '220 nF'],
    answer: 0,
    explain: 'Mille picofarads font un nanofarad : 2 200 pF valent 2,2 nF, soit 0,0022 µF.',
  },
  {
    id: 'T-CALC-101',
    exam: 'technique',
    level: 'moyen',
    topic: 'calcul',
    prompt: 'À combien de picofarads correspond une capacité de 0,047 µF ?',
    choices: ['47 000 pF', '4 700 pF', '470 pF', '470 000 pF'],
    answer: 0,
    explain:
      'Un microfarad vaut un million de picofarads : 0,047 × 10⁶ = 47 000 pF, soit 47 nF. Cette conversion est la première cause d’erreur de l’épreuve.',
  },
  {
    id: 'T-CALC-102',
    exam: 'technique',
    level: 'moyen',
    topic: 'calcul',
    prompt: 'À partir de la relation U = R × I, quelle expression donne la résistance ?',
    choices: ['R = U / I', 'R = I / U', 'R = U × I', 'R = U − I'],
    answer: 0,
    explain:
      'Le produit se défait par une division : ce qui multipliait passe au dénominateur. Le triangle mnémotechnique U au sommet, R et I en bas donne les trois formes d’un coup d’œil.',
  },
  {
    id: 'T-CALC-103',
    exam: 'technique',
    level: 'moyen',
    topic: 'calcul',
    prompt: 'Combien font 1,5 kΩ et 470 Ω mis bout à bout, exprimés en kilohms ?',
    choices: ['1,97 kΩ', '1,52 kΩ', '19,7 kΩ', '6,2 kΩ'],
    answer: 0,
    explain:
      'Il faut ramener les deux valeurs à la même unité avant d’additionner : 1 500 + 470 = 1 970 Ω, soit 1,97 kΩ.',
  },
  {
    id: 'T-CALC-104',
    exam: 'technique',
    level: 'moyen',
    topic: 'calcul',
    prompt: 'À combien de mégahertz correspond une fréquence de 3 500 kHz ?',
    choices: ['3,5 MHz', '35 MHz', '0,35 MHz', '350 MHz'],
    answer: 0,
    explain: 'Mille kilohertz font un mégahertz : 3 500 kHz valent 3,5 MHz, la borne basse de la bande des 80 mètres.',
  },

  // --- Lois d'Ohm et de Joule ---
  {
    id: 'T-OHM-100',
    exam: 'technique',
    level: 'moyen',
    topic: 'ohm',
    prompt: 'Quel courant traverse une résistance de 6 Ω soumise à une tension de 12 V ?',
    choices: ['2 A', '0,5 A', '72 A', '18 A'],
    answer: 0,
    explain: 'I = U / R, soit 12 / 6 = 2 A.',
  },
  {
    id: 'T-OHM-101',
    exam: 'technique',
    level: 'moyen',
    topic: 'ohm',
    prompt: 'Quelle puissance dissipe une résistance de 10 Ω parcourue par 2 A ?',
    choices: ['40 W', '20 W', '5 W', '80 W'],
    answer: 0,
    explain: 'P = R × I², soit 10 × 4 = 40 W. Le courant intervient au carré : le doubler quadruple la puissance dissipée.',
  },
  {
    id: 'T-OHM-102',
    exam: 'technique',
    level: 'moyen',
    topic: 'ohm',
    prompt: 'Quelle puissance dissipe une résistance de 4 Ω sous une tension de 12 V ?',
    choices: ['36 W', '48 W', '3 W', '144 W'],
    answer: 0,
    explain: 'P = U² / R, soit 144 / 4 = 36 W.',
  },
  {
    id: 'T-OHM-103',
    exam: 'technique',
    level: 'moyen',
    topic: 'ohm',
    prompt: 'Trois résistances de 30 Ω sont montées en parallèle. Que vaut l’ensemble ?',
    choices: ['10 Ω', '90 Ω', '30 Ω', '15 Ω'],
    answer: 0,
    explain:
      'N résistances identiques en parallèle donnent leur valeur divisée par N : 30 / 3 = 10 Ω. Le résultat est toujours inférieur à la plus petite des résistances.',
  },
  {
    id: 'T-OHM-104',
    exam: 'technique',
    level: 'moyen',
    topic: 'ohm',
    prompt: 'Deux résistances de 1 kΩ en série sont alimentées sous 10 V. Quelle tension mesure-t-on à leur point commun ?',
    choices: ['5 V', '10 V', '2,5 V', '20 V'],
    answer: 0,
    explain:
      'Un pont diviseur partage la tension au prorata des résistances. Les deux étant égales, chacune en prend la moitié.',
  },

  // --- Courant alternatif ---
  {
    id: 'T-ALT-100',
    exam: 'technique',
    level: 'moyen',
    topic: 'alternatif',
    prompt: 'Quelle est la tension de crête d’une tension sinusoïdale de 230 V efficaces ?',
    choices: ['325 V', '230 V', '163 V', '460 V'],
    answer: 0,
    explain:
      'La valeur de crête vaut la valeur efficace multipliée par racine de deux : 230 × 1,414 = 325 V. Une alimentation doit tenir cette tension, pas seulement les 230 V affichés.',
  },
  {
    id: 'T-ALT-101',
    exam: 'technique',
    level: 'moyen',
    topic: 'alternatif',
    prompt: 'Quelle est la période d’un signal à 50 Hz ?',
    choices: ['20 ms', '50 ms', '2 ms', '100 ms'],
    answer: 0,
    explain: 'T = 1 / f, soit 1 / 50 = 0,02 seconde, c’est-à-dire 20 millisecondes.',
  },
  {
    id: 'T-ALT-102',
    exam: 'technique',
    level: 'moyen',
    topic: 'alternatif',
    prompt: 'Quelle est la réactance d’une bobine de 10 mH à la fréquence de 1 kHz ?',
    choices: ['Environ 63 Ω', 'Environ 16 Ω', 'Environ 159 Ω', 'Environ 6,3 Ω'],
    answer: 0,
    explain: 'XL = 2πfL, soit 6,283 × 1 000 × 0,01 = 62,8 Ω.',
  },
  {
    id: 'T-ALT-103',
    exam: 'technique',
    level: 'moyen',
    topic: 'alternatif',
    prompt: 'Quelle est la réactance d’un condensateur de 1 µF à la fréquence de 1 kHz ?',
    choices: ['Environ 159 Ω', 'Environ 63 Ω', 'Environ 1 000 Ω', 'Environ 16 Ω'],
    answer: 0,
    explain: 'XC = 1 / (2πfC), soit 1 / (6,283 × 1 000 × 10⁻⁶) = 159 Ω.',
  },
  {
    id: 'T-ALT-104',
    exam: 'technique',
    level: 'moyen',
    topic: 'alternatif',
    prompt: 'Que vaut la constante de temps d’un circuit formé d’une résistance de 10 kΩ et d’un condensateur de 10 µF ?',
    choices: ['0,1 s', '1 s', '10 ms', '100 s'],
    answer: 0,
    explain:
      'τ = R × C, soit 10 000 × 10⁻⁵ = 0,1 seconde. Le condensateur atteint 63 % de la tension appliquée au bout d’une constante de temps.',
  },

  // --- Transformateurs et mesures ---
  {
    id: 'T-XFO-100',
    exam: 'technique',
    level: 'moyen',
    topic: 'transformateurs',
    prompt: 'Un transformateur dont le primaire compte 1 000 spires et le secondaire 100 est alimenté sous 230 V. Quelle tension délivre-t-il ?',
    choices: ['23 V', '2 300 V', '230 V', '46 V'],
    answer: 0,
    explain: 'U2 = U1 × N2 / N1, soit 230 × 100 / 1 000 = 23 V. Le rapport de spires vaut un dixième, la tension aussi.',
  },
  {
    id: 'T-XFO-101',
    exam: 'technique',
    level: 'moyen',
    topic: 'transformateurs',
    prompt: 'Le secondaire d’un transformateur compte deux fois plus de spires que le primaire. Dans quel rapport les impédances sont-elles transformées ?',
    choices: [
      'Dans le rapport de quatre',
      'Dans le rapport de deux',
      'Dans le rapport de racine de deux',
      'Les impédances ne sont pas transformées',
    ],
    answer: 0,
    explain:
      'Les tensions suivent le rapport de spires, les intensités son inverse, et les impédances son carré. Deux au carré font quatre — c’est ce carré que l’examen vérifie le plus souvent.',
  },
  {
    id: 'T-XFO-102',
    exam: 'technique',
    level: 'moyen',
    topic: 'transformateurs',
    prompt: 'Dans un transformateur abaisseur de tension, que devient le courant disponible au secondaire ?',
    choices: [
      'Il augmente dans le même rapport que la tension diminue',
      'Il diminue dans le même rapport que la tension',
      'Il reste identique à celui du primaire',
      'Il diminue comme le carré du rapport de spires',
    ],
    answer: 0,
    explain:
      'La puissance se conserve, aux pertes près : ce que la tension perd, le courant le gagne. Un transformateur qui divise la tension par dix multiplie le courant disponible par dix.',
  },
  {
    id: 'T-XFO-103',
    exam: 'technique',
    level: 'moyen',
    topic: 'transformateurs',
    prompt: 'Pourquoi le noyau d’un transformateur de puissance est-il feuilleté ?',
    choices: [
      'Pour limiter les courants de Foucault et les pertes qu’ils entraînent',
      'Pour augmenter le rapport de transformation',
      'Pour faciliter le bobinage des enroulements',
      'Pour élargir la bande passante du transformateur',
    ],
    answer: 0,
    explain:
      'Les tôles isolées les unes des autres brisent les boucles de courant induites dans la masse du noyau. Ces courants ne serviraient qu’à chauffer le fer.',
  },

  // --- Filtres et circuits accordés ---
  {
    id: 'T-CIRC-100',
    exam: 'technique',
    level: 'moyen',
    topic: 'circuits',
    prompt: 'Quelle est la fréquence de résonance d’un circuit formé d’une bobine de 100 µH et d’un condensateur de 100 pF ?',
    choices: ['Environ 1,6 MHz', 'Environ 16 MHz', 'Environ 160 kHz', 'Environ 1,6 kHz'],
    answer: 0,
    explain:
      'La loi de Thomson donne f = 1 / (2π √(L × C)). Le produit vaut 10⁻¹⁴, sa racine 10⁻⁷, et l’inverse de 2π × 10⁻⁷ vaut 1,59 MHz.',
  },
  {
    id: 'T-CIRC-101',
    exam: 'technique',
    level: 'moyen',
    topic: 'circuits',
    prompt: 'Quelle est la bande passante d’un circuit accordé sur 7 MHz dont le coefficient de surtension vaut 100 ?',
    choices: ['70 kHz', '700 kHz', '7 kHz', '70 Hz'],
    answer: 0,
    explain: 'B = f / Q, soit 7 000 000 / 100 = 70 000 Hz. Plus le Q est élevé, plus la bande passante se resserre.',
  },
  {
    id: 'T-CIRC-102',
    exam: 'technique',
    level: 'moyen',
    topic: 'circuits',
    prompt: 'On double l’inductance d’un circuit accordé sans toucher à la capacité. Que devient la fréquence de résonance ?',
    choices: [
      'Elle est divisée par racine de deux',
      'Elle est divisée par deux',
      'Elle est multipliée par deux',
      'Elle ne change pas',
    ],
    answer: 0,
    explain:
      'L et C sont sous une racine carrée : doubler L multiplie la racine par 1,414, et la fréquence, qui en est l’inverse, se trouve divisée par autant.',
  },
  {
    id: 'T-CIRC-103',
    exam: 'technique',
    level: 'moyen',
    topic: 'circuits',
    prompt: 'Comment se comporte un circuit bouchon — bobine et condensateur en parallèle — à sa fréquence de résonance ?',
    choices: [
      'Son impédance est maximale',
      'Son impédance est nulle',
      'Il se comporte en court-circuit',
      'Son impédance devient purement inductive',
    ],
    answer: 0,
    explain:
      'En parallèle, l’impédance passe par un maximum à la résonance : le circuit bloque cette fréquence. En série, c’est l’inverse, l’impédance devient minimale.',
  },
  {
    id: 'T-CIRC-104',
    exam: 'technique',
    level: 'moyen',
    topic: 'circuits',
    prompt: 'Quel filtre place-t-on en sortie d’un émetteur pour bloquer les harmoniques ?',
    choices: [
      'Un filtre passe-bas',
      'Un filtre passe-haut',
      'Un filtre coupe-bande',
      'Un filtre passe-bande accordé sur l’harmonique deux',
    ],
    answer: 0,
    explain:
      'Les harmoniques sont des multiples de la fréquence utile, donc plus hautes qu’elle : un passe-bas coupé juste au-dessus de la bande de travail les élimine toutes d’un coup.',
  },
  // --- Diodes et alimentations ---
  {
    id: 'T-DIOD-100',
    exam: 'technique',
    level: 'moyen',
    topic: 'diodes',
    prompt: 'Combien de diodes compte un redresseur en pont ?',
    choices: ['Quatre', 'Deux', 'Une', 'Six'],
    answer: 0,
    explain:
      'Quatre diodes montées en pont, dont deux conduisent à chaque alternance : la chute de tension totale vaut donc deux fois celle d’une diode.',
  },
  {
    id: 'T-DIOD-101',
    exam: 'technique',
    level: 'moyen',
    topic: 'diodes',
    prompt: 'Un transformateur délivre 12 V efficaces à un redresseur en pont suivi d’un condensateur. Quelle tension continue obtient-on environ, chutes des diodes comprises ?',
    choices: ['Environ 15,6 V', 'Environ 12 V', 'Environ 17 V', 'Environ 10,6 V'],
    answer: 0,
    explain:
      'Le condensateur maintient la tension de crête, soit 12 × 1,414 = 17 V, dont il faut retrancher les deux chutes de 0,7 V des diodes conductrices : il reste 15,6 V.',
  },
  {
    id: 'T-DIOD-102',
    exam: 'technique',
    level: 'moyen',
    topic: 'diodes',
    prompt: 'Une diode Zener de 5,1 V est alimentée sous 12 V à travers une résistance. Quelle tension trouve-t-on à ses bornes ?',
    choices: ['5,1 V', '12 V', '6,9 V', '0,7 V'],
    answer: 0,
    explain:
      'C’est tout l’intérêt du montage : la Zener impose sa tension d’avalanche, et la résistance encaisse la différence. La tension de sortie ne dépend plus de l’entrée.',
  },
  {
    id: 'T-DIOD-103',
    exam: 'technique',
    level: 'moyen',
    topic: 'diodes',
    prompt: 'Quelle est la fréquence de l’ondulation après un redressement double alternance d’un secteur à 50 Hz ?',
    choices: ['100 Hz', '50 Hz', '25 Hz', '200 Hz'],
    answer: 0,
    explain:
      'Les deux alternances sont utilisées, donc deux bosses par période : l’ondulation apparaît au double de la fréquence du secteur, ce qui facilite d’autant le filtrage.',
  },

  // --- Transistors ---
  {
    id: 'T-TRAN-100',
    exam: 'technique',
    level: 'moyen',
    topic: 'transistors',
    prompt: 'Un transistor de gain 200 reçoit un courant de base de 20 µA. Quel courant circule dans son collecteur ?',
    choices: ['4 mA', '10 mA', '0,4 mA', '40 mA'],
    answer: 0,
    explain: 'Ic = Ib × β, soit 20 × 10⁻⁶ × 200 = 4 × 10⁻³ A, c’est-à-dire 4 mA.',
  },
  {
    id: 'T-TRAN-101',
    exam: 'technique',
    level: 'moyen',
    topic: 'transistors',
    prompt: 'Quelle relation lie les trois courants d’un transistor bipolaire ?',
    choices: [
      'Le courant d’émetteur est la somme des courants de base et de collecteur',
      'Le courant de base est la somme des deux autres',
      'Le courant de collecteur est la somme des deux autres',
      'Les trois courants sont égaux',
    ],
    answer: 0,
    explain:
      'Tout ce qui entre par la base et le collecteur ressort par l’émetteur : Ie = Ib + Ic. Comme Ib est très faible devant Ic, on confond souvent Ie et Ic.',
  },
  {
    id: 'T-TRAN-102',
    exam: 'technique',
    level: 'moyen',
    topic: 'transistors',
    prompt: 'Quel montage à transistor présente une impédance d’entrée élevée et une impédance de sortie faible ?',
    choices: [
      'Le collecteur commun',
      'L’émetteur commun',
      'La base commune',
      'Aucun des trois montages',
    ],
    answer: 0,
    explain:
      'C’est précisément ce qui en fait un adaptateur d’impédance : il présente une charge légère à l’étage précédent et attaque sans peine une charge basse, comme un haut-parleur.',
  },
  {
    id: 'T-TRAN-103',
    exam: 'technique',
    level: 'moyen',
    topic: 'transistors',
    prompt: 'Qu’est-ce qui commande un transistor à effet de champ ?',
    choices: [
      'Une tension appliquée sur sa grille',
      'Un courant injecté dans sa grille',
      'Un courant injecté dans sa source',
      'Une tension appliquée entre drain et source',
    ],
    answer: 0,
    explain:
      'C’est la différence fondamentale avec le bipolaire, commandé en courant : la grille d’un effet de champ ne consomme pratiquement rien, d’où une impédance d’entrée très élevée.',
  },

  // --- Amplis, oscillateurs et mélangeurs ---
  {
    id: 'T-ETAG-100',
    exam: 'technique',
    level: 'moyen',
    topic: 'etages',
    prompt: 'Un mélangeur reçoit 10 MHz et 9 MHz. Quelles fréquences trouve-t-on principalement à sa sortie ?',
    choices: ['1 MHz et 19 MHz', '9 MHz et 10 MHz', '90 MHz et 19 MHz', '0,9 MHz et 1,9 MHz'],
    answer: 0,
    explain:
      'La différence et la somme : 10 − 9 = 1 MHz, 10 + 9 = 19 MHz. Un filtre choisit ensuite celle qu’on veut garder.',
  },
  {
    id: 'T-ETAG-101',
    exam: 'technique',
    level: 'moyen',
    topic: 'etages',
    prompt: 'Quelle est la fréquence propre d’une lame de quartz de 1 mm d’épaisseur ?',
    choices: ['2,85 MHz', '5,7 MHz', '1,14 MHz', '11,4 MHz'],
    answer: 0,
    explain:
      'La formule du cours donne f(MHz) = 5,7 / (2 × e), soit 5,7 / 2 = 2,85 MHz. Plus la lame est mince, plus la fréquence est élevée — et plus le quartz est fragile.',
  },
  {
    id: 'T-ETAG-102',
    exam: 'technique',
    level: 'moyen',
    topic: 'etages',
    prompt: 'Quelle classe d’amplification emploie-t-on pour réaliser un multiplicateur de fréquence ?',
    choices: ['La classe C', 'La classe A', 'La classe AB', 'La classe D'],
    answer: 0,
    explain:
      'La classe C n’amplifie que les crêtes et engendre donc une forte distorsion harmonique. Un circuit accordé sur le multiple voulu n’a plus qu’à sélectionner l’harmonique désirée.',
  },
  {
    id: 'T-ETAG-103',
    exam: 'technique',
    level: 'moyen',
    topic: 'etages',
    prompt: 'Dans une boucle à verrouillage de phase, à quoi sert le diviseur programmable ?',
    choices: [
      'À choisir la fréquence de sortie, qui devient un multiple de la référence',
      'À abaisser la fréquence du quartz de référence',
      'À filtrer la tension de commande de l’oscillateur',
      'À stabiliser la tension d’alimentation du montage',
    ],
    answer: 0,
    explain:
      'La boucle asservit un oscillateur commandé en tension à un quartz. En divisant sa sortie par un facteur réglable avant la comparaison, on obtient autant de fréquences que de valeurs du diviseur.',
  },

  // --- Ampli op et logique ---
  {
    id: 'T-NUM-100',
    exam: 'technique',
    level: 'moyen',
    topic: 'numerique',
    prompt: 'Un amplificateur opérationnel est monté en inverseur avec 1 kΩ en entrée et 10 kΩ en contre-réaction. Quel est son gain ?',
    choices: ['−10', '−0,1', '−11', '−9'],
    answer: 0,
    explain:
      'Le gain d’un montage inverseur vaut −R2 / R1, soit −10 000 / 1 000 = −10. Le signe rappelle que la sortie est en opposition de phase avec l’entrée.',
  },
  {
    id: 'T-NUM-101',
    exam: 'technique',
    level: 'moyen',
    topic: 'numerique',
    prompt: 'Un amplificateur opérationnel est monté en non-inverseur avec 1 kΩ à la masse et 9 kΩ en contre-réaction. Quel est son gain ?',
    choices: ['10', '9', '−9', '0,9'],
    answer: 0,
    explain:
      'Le gain d’un montage non inverseur vaut R2 / R1 + 1, soit 9 + 1 = 10. Ce « plus un » est la différence avec le montage inverseur, et il se retient mal.',
  },
  {
    id: 'T-NUM-102',
    exam: 'technique',
    level: 'moyen',
    topic: 'numerique',
    prompt: 'Un signal est échantillonné à 8 kHz. Quelle est la fréquence maximale qu’il peut contenir sans repliement ?',
    choices: ['4 kHz', '8 kHz', '16 kHz', '2 kHz'],
    answer: 0,
    explain:
      'Le théorème de Shannon impose d’échantillonner à plus du double de la fréquence la plus élevée. La limite, dite fréquence de Nyquist, vaut donc la moitié de 8 kHz.',
  },
  {
    id: 'T-NUM-103',
    exam: 'technique',
    level: 'moyen',
    topic: 'numerique',
    prompt: 'Que vaut en décimal le nombre binaire 1011 ?',
    choices: ['11', '13', '9', '1 011'],
    answer: 0,
    explain: 'Les poids sont 8, 4, 2 et 1 : 8 + 0 + 2 + 1 = 11, ce qui s’écrit B en hexadécimal.',
  },

  // --- Récepteurs et émetteurs ---
  {
    id: 'T-RECE-100',
    exam: 'technique',
    level: 'moyen',
    topic: 'recepteurs',
    prompt: 'Un récepteur à fréquence intermédiaire de 9 MHz reçoit un signal à 14,2 MHz. Sur quelle fréquence son oscillateur local peut-il être réglé ?',
    choices: ['5,2 MHz', '9 MHz', '14,2 MHz', '4,8 MHz'],
    answer: 0,
    explain:
      'La différence entre le signal et l’oscillateur doit donner la fréquence intermédiaire : 14,2 − 9 = 5,2 MHz en montage infradyne. Un montage supradyne emploierait 23,2 MHz.',
  },
  {
    id: 'T-RECE-101',
    exam: 'technique',
    level: 'moyen',
    topic: 'recepteurs',
    prompt: 'À quelle tension correspond un signal S7 sur l’entrée 50 Ω d’un récepteur décamétrique ?',
    choices: ['12,5 µV', '25 µV', '50 µV', '6,25 µV'],
    answer: 0,
    explain:
      'S9 vaut 50 µV et chaque point S retire 6 dB, soit un facteur deux en tension : 50 à S9, 25 à S8, 12,5 à S7.',
  },
  {
    id: 'T-RECE-102',
    exam: 'technique',
    level: 'moyen',
    topic: 'recepteurs',
    prompt: 'À quelle tension correspond un signal annoncé « S9 plus 20 dB » ?',
    choices: ['500 µV', '100 µV', '250 µV', '5 000 µV'],
    answer: 0,
    explain:
      'Vingt décibels de tension correspondent à un facteur dix : 50 µV multipliés par dix font 500 µV. Attention, vingt décibels de puissance vaudraient un facteur cent.',
  },
  {
    id: 'T-RECE-103',
    exam: 'technique',
    level: 'moyen',
    topic: 'recepteurs',
    prompt: 'À quoi sert le filtre placé en tête d’un récepteur superhétérodyne, avant le mélangeur ?',
    choices: [
      'À rejeter la fréquence image avant qu’elle n’atteigne le mélangeur',
      'À définir la sélectivité finale du récepteur',
      'À corriger la réponse en fréquence de l’étage audio',
      'À protéger l’antenne des tensions statiques',
    ],
    answer: 0,
    explain:
      'Une fois passée dans le mélangeur, l’image devient indiscernable du signal utile : plus aucun filtre ne peut les séparer. Le tri doit donc avoir lieu avant.',
  },
  // --- Les modulations ---
  {
    id: 'T-MODU-100',
    exam: 'technique',
    level: 'moyen',
    topic: 'modulations',
    prompt: 'Un émetteur en modulation d’amplitude délivre 300 W au taux de modulation de 100 %. Quelle puissance part dans la porteuse ?',
    choices: ['200 W', '150 W', '100 W', '300 W'],
    answer: 0,
    explain:
      'À 100 % de modulation, la porteuse emporte les deux tiers de la puissance — et elle ne transporte aucune information. C’est l’argument chiffré en faveur de la bande latérale unique.',
  },
  {
    id: 'T-MODU-101',
    exam: 'technique',
    level: 'moyen',
    topic: 'modulations',
    prompt: 'Dans cette même émission de 300 W en modulation d’amplitude, quelle puissance emporte chaque bande latérale ?',
    choices: ['50 W', '100 W', '75 W', '150 W'],
    answer: 0,
    explain:
      'Le tiers restant se partage entre les deux bandes latérales, soit un sixième du total chacune : 300 / 6 = 50 W. Les deux portent le même message.',
  },
  {
    id: 'T-MODU-102',
    exam: 'technique',
    level: 'moyen',
    topic: 'modulations',
    prompt: 'Quelle bande occupe approximativement un signal modulé en fréquence dont l’excursion atteint 5 kHz ?',
    choices: ['10 kHz', '5 kHz', '2,5 kHz', '20 kHz'],
    answer: 0,
    explain:
      'La bande occupée vaut le double de l’excursion, celle-ci se produisant de part et d’autre de la fréquence centrale. La règle de Carson affine ce calcul en tenant compte de la fréquence audio.',
  },
  {
    id: 'T-MODU-103',
    exam: 'technique',
    level: 'moyen',
    topic: 'modulations',
    prompt: 'L’enveloppe d’un signal modulé en amplitude oscille entre 30 V et 10 V. Quel est le taux de modulation ?',
    choices: ['50 %', '33 %', '66 %', '20 %'],
    answer: 0,
    explain:
      'K = (A − a) / (A + a), soit 20 / 40 = 0,5, c’est-à-dire 50 %. Au-delà de 100 %, l’enveloppe s’écrête et l’émission occupe une bande bien plus large.',
  },
  {
    id: 'T-MODU-104',
    exam: 'technique',
    level: 'moyen',
    topic: 'modulations',
    prompt: 'Quel débit binaire obtient-on avec une transmission à 1 200 bauds dont le signal ne prend que deux états ?',
    choices: ['1 200 bit/s', '2 400 bit/s', '600 bit/s', '1 200 octets par seconde'],
    answer: 0,
    explain:
      'Le baud compte les changements d’état par seconde. Avec deux états, chaque changement porte un bit : les deux nombres coïncident. Avec quatre états, le débit doublerait.',
  },

  // --- Décibels et puissances ---
  {
    id: 'T-DB-100',
    exam: 'technique',
    level: 'moyen',
    topic: 'decibels',
    prompt: 'Un amplificateur de gain 3 dB reçoit 100 W à son entrée. Quelle puissance délivre-t-il ?',
    choices: ['200 W', '103 W', '300 W', '1 000 W'],
    answer: 0,
    explain:
      'Trois décibels doublent la puissance. Le gain en décibels s’ajoute quand les puissances se multiplient : 100 W × 2 = 200 W.',
  },
  {
    id: 'T-DB-101',
    exam: 'technique',
    level: 'moyen',
    topic: 'decibels',
    prompt: 'Un amplificateur de 10 dB est suivi d’un câble qui perd 3 dB. Quel est le gain de l’ensemble ?',
    choices: ['7 dB', '13 dB', '30 dB', '3,3 dB'],
    answer: 0,
    explain:
      'Les décibels s’additionnent algébriquement : 10 − 3 = 7 dB. En rapports de puissance, cela revient à multiplier par dix puis diviser par deux, soit un facteur cinq.',
  },
  {
    id: 'T-DB-102',
    exam: 'technique',
    level: 'moyen',
    topic: 'decibels',
    prompt: 'À quelle puissance correspondent 30 dBm ?',
    choices: ['1 W', '30 mW', '100 mW', '30 W'],
    answer: 0,
    explain:
      'Le dBm part du milliwatt. Trente décibels valent un facteur mille : 1 mW × 1 000 = 1 W. Un émetteur de 100 W afficherait 50 dBm.',
  },
  {
    id: 'T-DB-103',
    exam: 'technique',
    level: 'moyen',
    topic: 'decibels',
    prompt: 'De combien de décibels progresse un signal dont la tension double ?',
    choices: ['6 dB', '3 dB', '10 dB', '2 dB'],
    answer: 0,
    explain:
      'Doubler la tension quadruple la puissance, et quadrupler la puissance vaut 6 dB. C’est pourquoi un point de l’échelle S, qui double la tension, vaut bien 6 dB.',
  },

  // --- Antennes et lignes ---
  {
    id: 'T-ANT-100',
    exam: 'technique',
    level: 'moyen',
    topic: 'antennes',
    prompt: 'Quelle est la longueur d’onde correspondant à une fréquence de 145 MHz ?',
    choices: ['Environ 2,07 m', 'Environ 1,45 m', 'Environ 4,14 m', 'Environ 0,52 m'],
    answer: 0,
    explain:
      'λ = 300 / f(MHz), soit 300 / 145 = 2,07 mètre. C’est pourquoi cette bande est dite « des 2 mètres ».',
  },
  {
    id: 'T-ANT-101',
    exam: 'technique',
    level: 'moyen',
    topic: 'antennes',
    prompt: 'Quelle est la longueur théorique d’un doublet demi-onde taillé pour 14,2 MHz ?',
    choices: ['Environ 10,6 m', 'Environ 21,1 m', 'Environ 5,3 m', 'Environ 42,3 m'],
    answer: 0,
    explain:
      'La demi-onde vaut 150 / f(MHz), soit 150 / 14,2 = 10,56 mètres. En pratique on applique encore un coefficient de raccourcissement d’environ 0,95.',
  },
  {
    id: 'T-ANT-102',
    exam: 'technique',
    level: 'moyen',
    topic: 'antennes',
    prompt: 'Quelle est la longueur théorique d’une antenne quart d’onde pour 145 MHz ?',
    choices: ['Environ 52 cm', 'Environ 1,03 m', 'Environ 26 cm', 'Environ 2,07 m'],
    answer: 0,
    explain: 'Le quart d’onde vaut 75 / f(MHz), soit 75 / 145 = 0,517 mètre, c’est-à-dire environ 52 centimètres.',
  },
  {
    id: 'T-ANT-103',
    exam: 'technique',
    level: 'moyen',
    topic: 'antennes',
    prompt: 'Un émetteur de 10 W alimente une antenne de gain 6 dBi. Quelle est la puissance isotrope rayonnée équivalente ?',
    choices: ['40 W', '60 W', '20 W', '16 W'],
    answer: 0,
    explain:
      'Six décibels valent un facteur quatre en puissance : 10 × 4 = 40 W. Le gain exprimé en dBi conduit à une PIRE, en dBd à une PAR.',
  },
  {
    id: 'T-ANT-104',
    exam: 'technique',
    level: 'moyen',
    topic: 'antennes',
    prompt: 'Une antenne de 75 Ω est raccordée à une ligne de 50 Ω. Quel rapport d’ondes stationnaires en résulte ?',
    choices: ['1,5', '0,67', '2', '1,25'],
    answer: 0,
    explain:
      'Le ROS est le rapport de la plus forte impédance à la plus faible : 75 / 50 = 1,5. Il ne descend jamais en dessous de 1, quel que soit le sens du désaccord.',
  },
];
