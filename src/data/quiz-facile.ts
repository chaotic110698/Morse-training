/**
 * Niveau facile — réglementation.
 *
 * Ce niveau vérifie qu'une lecture est passée : une définition, une valeur à
 * citer, une règle à reconnaître. Les propositions fausses restent nettes,
 * jamais retorses — la difficulté viendra des niveaux suivants.
 *
 * Numérotation : les identifiants de 001 à 099 sont réservés au niveau facile,
 * de 100 à 199 au niveau moyen, de 200 à 299 au difficile, de 300 à 399 à
 * l'opérateur. `validateQuestions` vérifie cette correspondance, ce qui évite
 * qu'un lot renumérote par accident le lot précédent.
 */

import type { Question } from './quiz.ts';

export const FACILE_REGLEMENTATION: Question[] = [
  // --- Le certificat et l'examen ---
  {
    id: 'R-CERT-001',
    exam: 'reglementation',
    level: 'facile',
    topic: 'certificat',
    prompt: 'Quel organisme organise l’examen du certificat d’opérateur du service amateur en France ?',
    choices: [
      'L’ANFR, l’Agence nationale des fréquences',
      'L’ARCEP, l’Autorité de régulation des communications',
      'Le REF, Réseau des émetteurs français',
      'L’UIT, Union internationale des télécommunications',
    ],
    answer: 0,
    explain:
      'L’ANFR organise l’examen dans ses centres régionaux. L’ARCEP écrit la décision qui fixe les conditions d’utilisation, le REF est une association, et l’UIT travaille au niveau mondial.',
  },
  {
    id: 'R-CERT-002',
    exam: 'reglementation',
    level: 'facile',
    topic: 'certificat',
    prompt: 'De combien d’épreuves se compose l’examen du certificat d’opérateur ?',
    choices: [
      'Deux : réglementation et technique',
      'Une seule, portant sur les deux programmes',
      'Trois : réglementation, technique et télégraphie',
      'Deux : technique et télégraphie',
    ],
    answer: 0,
    explain:
      'Deux épreuves indépendantes, passées le même jour. L’épreuve de télégraphie a été supprimée en 2012 : la CW reste autorisée, elle n’est simplement plus une condition d’accès.',
  },
  {
    id: 'R-CERT-003',
    exam: 'reglementation',
    level: 'facile',
    topic: 'certificat',
    prompt: 'Combien de questions comporte chacune des deux épreuves de l’examen ?',
    choices: ['20 questions', '10 questions', '30 questions', '40 questions'],
    answer: 0,
    explain: 'Vingt questions à choix multiple par épreuve, avec une seule bonne réponse à chacune.',
  },
  {
    id: 'R-CERT-004',
    exam: 'reglementation',
    level: 'facile',
    topic: 'certificat',
    prompt: 'Quelle est la durée de l’épreuve de réglementation ?',
    choices: ['15 minutes', '30 minutes', '45 minutes', '20 minutes'],
    answer: 0,
    explain:
      'Quinze minutes pour la réglementation, trente pour la technique : celle-ci demande des calculs, l’autre porte sur des connaissances directes.',
  },
  {
    id: 'R-CERT-005',
    exam: 'reglementation',
    level: 'facile',
    topic: 'certificat',
    prompt: 'Quelle note faut-il obtenir à chaque épreuve pour être reçu ?',
    choices: [
      'La moyenne, soit 10 sur 20',
      '12 sur 20',
      '14 sur 20',
      'La moyenne des deux épreuves cumulées',
    ],
    answer: 0,
    explain:
      'Il faut la moyenne à chacune des deux épreuves séparément. Réussir l’une ne compense pas l’autre.',
  },
  {
    id: 'R-CERT-006',
    exam: 'reglementation',
    level: 'facile',
    topic: 'certificat',
    prompt: 'Que vaut une réponse fausse dans le barème en vigueur depuis 2021 ?',
    choices: [
      'Zéro point, sans pénalité',
      'Un point en moins',
      'Un demi-point en moins',
      'Trois points en moins',
    ],
    answer: 0,
    explain:
      'Une bonne réponse vaut un point, une erreur zéro, une question vide zéro également. Le point négatif a disparu en 2021 : il ne faut donc jamais laisser une question sans réponse.',
  },
  {
    id: 'R-CERT-007',
    exam: 'reglementation',
    level: 'facile',
    topic: 'certificat',
    prompt: 'Combien de temps le bénéfice d’une épreuve réussie est-il conservé ?',
    choices: ['Un an', 'Six mois', 'Trois ans', 'Il n’est pas conservé'],
    answer: 0,
    explain:
      'Un candidat reçu en technique et recalé en réglementation ne repasse que la réglementation, à condition de le faire dans l’année.',
  },
  {
    id: 'R-CERT-008',
    exam: 'reglementation',
    level: 'facile',
    topic: 'certificat',
    prompt: 'Quel âge minimum faut-il avoir pour se présenter à l’examen ?',
    choices: [
      'Aucun âge minimum n’est exigé',
      'Seize ans',
      'Dix-huit ans',
      'Quatorze ans, avec autorisation parentale',
    ],
    answer: 0,
    explain:
      'Il n’y a aucune condition d’âge, et depuis 2021 aucun frais : l’ancienne taxe de trente euros a été supprimée.',
  },

  // --- Le cadre réglementaire ---
  {
    id: 'R-CADRE-001',
    exam: 'reglementation',
    level: 'facile',
    topic: 'cadre',
    prompt: 'Quel organisme édite le Règlement des radiocommunications ?',
    choices: [
      'L’UIT, Union internationale des télécommunications',
      'La CEPT, conférence européenne des administrations',
      'L’ANFR, Agence nationale des fréquences',
      'L’IARU, union internationale des radioamateurs',
    ],
    answer: 0,
    explain:
      'Le Règlement est édité par la branche radio de l’UIT. Ce n’est pas une recommandation mais un traité, que la France a ratifié et dont découle tout le droit national.',
  },
  {
    id: 'R-CADRE-002',
    exam: 'reglementation',
    level: 'facile',
    topic: 'cadre',
    prompt: 'En combien de régions l’UIT découpe-t-elle le globe pour attribuer les fréquences ?',
    choices: ['Trois régions', 'Deux régions', 'Cinq régions', 'Une par continent'],
    answer: 0,
    explain:
      'Trois régions. La France appartient à la région 1, qui couvre l’Europe, l’Afrique, le Moyen-Orient et la Russie d’Europe. Les plans de bandes diffèrent d’une région à l’autre.',
  },
  {
    id: 'R-CADRE-003',
    exam: 'reglementation',
    level: 'facile',
    topic: 'cadre',
    prompt: 'À quelle région de l’UIT la France métropolitaine appartient-elle ?',
    choices: ['La région 1', 'La région 2', 'La région 3', 'La région 0'],
    answer: 0,
    explain:
      'Région 1 : Europe, Afrique, Moyen-Orient et Russie d’Europe. La région 2 couvre les Amériques, la région 3 l’Asie et l’Océanie.',
  },
  {
    id: 'R-CADRE-004',
    exam: 'reglementation',
    level: 'facile',
    topic: 'cadre',
    prompt: 'Quel est le rôle de l’ARCEP vis-à-vis du service amateur ?',
    choices: [
      'Elle assigne les fréquences et fixe leurs conditions techniques d’utilisation',
      'Elle organise l’examen et délivre les indicatifs',
      'Elle édite le Règlement des radiocommunications',
      'Elle représente les radioamateurs auprès de l’UIT',
    ],
    answer: 0,
    explain:
      'C’est de l’ARCEP que viennent les bandes, les puissances et les classes d’émission autorisées, par sa décision 12-1241. L’examen et les indicatifs relèvent de l’ANFR.',
  },
  {
    id: 'R-CADRE-005',
    exam: 'reglementation',
    level: 'facile',
    topic: 'cadre',
    prompt: 'Quelle est la mission de l’ANFR ?',
    choices: [
      'Planifier et contrôler l’usage du spectre, organiser l’examen et délivrer les indicatifs',
      'Fixer les conditions techniques d’utilisation des fréquences',
      'Représenter la France aux conférences mondiales des radiocommunications',
      'Homologuer les décisions du régulateur',
    ],
    answer: 0,
    explain:
      'L’ANFR est un établissement public. Elle édite le tableau national de répartition des bandes, organise l’examen, délivre certificats et indicatifs, et instruit les dossiers de brouillage.',
  },
  {
    id: 'R-CADRE-006',
    exam: 'reglementation',
    level: 'facile',
    topic: 'cadre',
    prompt: 'Selon le Règlement des radiocommunications, quel est l’objet du service amateur ?',
    choices: [
      'L’instruction individuelle, l’intercommunication et les études techniques',
      'La diffusion d’informations au public',
      'Les communications de secours en cas de catastrophe',
      'L’expérimentation commerciale de matériels radioélectriques',
    ],
    answer: 0,
    explain:
      'La définition ajoute que le service est exercé par des personnes dûment autorisées s’intéressant à la radioélectricité à titre purement personnel et sans intérêt pécuniaire.',
  },
  {
    id: 'R-CADRE-007',
    exam: 'reglementation',
    level: 'facile',
    topic: 'cadre',
    prompt: 'Une station d’amateur peut-elle être exploitée dans un but lucratif ?',
    choices: [
      'Non : l’activité est purement personnelle et sans intérêt pécuniaire',
      'Oui, à condition de le déclarer à l’ANFR',
      'Oui, pour les radio-clubs constitués en association',
      'Oui, tant que la puissance reste inférieure à 10 watts',
    ],
    answer: 0,
    explain:
      'C’est dans la définition même du service : sans intérêt pécuniaire. Toute activité commerciale, y compris la publicité pour un matériel, en est exclue.',
  },
  {
    id: 'R-CADRE-008',
    exam: 'reglementation',
    level: 'facile',
    topic: 'cadre',
    prompt: 'Que fait la CEPT en matière de radiocommunications ?',
    choices: [
      'Elle harmonise les pratiques européennes par des recommandations',
      'Elle impose ses décisions aux administrations nationales',
      'Elle attribue les indicatifs européens',
      'Elle contrôle les émissions depuis un centre unique',
    ],
    answer: 0,
    explain:
      'La CEPT regroupe les régulateurs de quarante-six pays. Elle harmonise sans contraindre : ses recommandations organisent la libre circulation des opérateurs et l’équivalence des certificats.',
  },

  // --- Classes d'émission ---
  {
    id: 'R-EMIS-001',
    exam: 'reglementation',
    level: 'facile',
    topic: 'emissions',
    prompt: 'De combien de caractères se compose une classe d’émission ?',
    choices: ['Trois', 'Deux', 'Quatre', 'Cinq'],
    answer: 0,
    explain:
      'Trois caractères signifiants : la modulation de la porteuse, la nature du signal modulant, le type d’information transmise. Une largeur de bande peut les précéder, sans en faire partie.',
  },
  {
    id: 'R-EMIS-002',
    exam: 'reglementation',
    level: 'facile',
    topic: 'emissions',
    prompt: 'Que désigne le premier caractère d’une classe d’émission ?',
    choices: [
      'La modulation de la porteuse principale',
      'La nature du signal modulant',
      'Le type d’information transmise',
      'La largeur de bande occupée',
    ],
    answer: 0,
    explain:
      'Premier caractère : la modulation. Deuxième : la nature du signal modulant. Troisième : le type d’information. On comprend une classe en partant de la fin.',
  },
  {
    id: 'R-EMIS-003',
    exam: 'reglementation',
    level: 'facile',
    topic: 'emissions',
    prompt: 'Que désigne le troisième caractère d’une classe d’émission ?',
    choices: [
      'Le type d’information transmise',
      'La modulation de la porteuse',
      'Le nombre de voies utilisées',
      'La puissance de l’émission',
    ],
    answer: 0,
    explain:
      'Le troisième caractère dit ce que l’émission transporte : A pour la télégraphie lue à l’oreille, E pour la voix, D pour des données, F pour la vidéo.',
  },
  {
    id: 'R-EMIS-004',
    exam: 'reglementation',
    level: 'facile',
    topic: 'emissions',
    prompt: 'À quel mode correspond la classe d’émission A1A ?',
    choices: [
      'La télégraphie au manipulateur, lue à l’oreille',
      'La téléphonie en modulation d’amplitude',
      'La télégraphie automatique lue par une machine',
      'La téléphonie en bande latérale unique',
    ],
    answer: 0,
    explain:
      'A pour la modulation d’amplitude, 1 pour une voie numérique sans sous-porteuse, A pour la télégraphie auditive. C’est la CW classique, celle qu’on apprend sur ce site.',
  },
  {
    id: 'R-EMIS-005',
    exam: 'reglementation',
    level: 'facile',
    topic: 'emissions',
    prompt: 'À quel mode correspond la classe d’émission J3E ?',
    choices: [
      'La téléphonie en bande latérale unique',
      'La téléphonie en modulation de fréquence',
      'La télévision à balayage lent',
      'La télégraphie automatique',
    ],
    answer: 0,
    explain:
      'J désigne la bande latérale unique à porteuse supprimée, 3 une voie analogique, E la téléphonie. C’est la BLU, mode vocal habituel en décamétriques.',
  },
  {
    id: 'R-EMIS-006',
    exam: 'reglementation',
    level: 'facile',
    topic: 'emissions',
    prompt: 'À quel mode correspond la classe d’émission F3E ?',
    choices: [
      'La téléphonie en modulation de fréquence',
      'La téléphonie en modulation d’amplitude',
      'Le fac-similé',
      'La télégraphie sur porteuse modulée en fréquence',
    ],
    answer: 0,
    explain: 'F pour la modulation de fréquence, 3 pour une voie analogique, E pour la voix : c’est la FM des relais VHF et UHF.',
  },
  {
    id: 'R-EMIS-007',
    exam: 'reglementation',
    level: 'facile',
    topic: 'emissions',
    prompt: 'Que transmet une émission de classe N0N ?',
    choices: [
      'Rien : une porteuse seule, non modulée',
      'De la télégraphie automatique',
      'Un signal numérique multivoie',
      'Une image fixe',
    ],
    answer: 0,
    explain:
      'N pour une porteuse non modulée, 0 pour l’absence de signal modulant, N pour l’absence d’information. C’est un réglage d’émetteur, ou une balise non modulée.',
  },
  {
    id: 'R-EMIS-008',
    exam: 'reglementation',
    level: 'facile',
    topic: 'emissions',
    prompt: 'Dans une classe d’émission, que signifie la lettre J en première position ?',
    choices: [
      'Bande latérale unique, porteuse supprimée',
      'Bande latérale unique, porteuse complète',
      'Modulation de fréquence',
      'Modulation de phase',
    ],
    answer: 0,
    explain:
      'J supprime la porteuse, H la conserve entière, R la réduit. Les trois sont des émissions à bande latérale unique.',
  },

  // --- Bandes, statuts et puissances ---
  {
    id: 'R-BANDE-001',
    exam: 'reglementation',
    level: 'facile',
    topic: 'bandes',
    prompt: 'À quelle gamme de fréquences correspond la bande des 20 mètres ?',
    choices: [
      'De 14,000 à 14,350 MHz',
      'De 7,000 à 7,200 MHz',
      'De 21,000 à 21,450 MHz',
      'De 28,000 à 29,700 MHz',
    ],
    answer: 0,
    explain:
      'La bande des 20 mètres s’étend de 14,000 à 14,350 MHz. C’est la bande du trafic lointain par excellence, ouverte presque tous les jours vers un point ou un autre du globe.',
  },
  {
    id: 'R-BANDE-002',
    exam: 'reglementation',
    level: 'facile',
    topic: 'bandes',
    prompt: 'À quelle gamme de fréquences correspond la bande des 40 mètres ?',
    choices: [
      'De 7,000 à 7,200 MHz',
      'De 3,500 à 3,800 MHz',
      'De 10,100 à 10,150 MHz',
      'De 14,000 à 14,350 MHz',
    ],
    answer: 0,
    explain:
      'De 7,000 à 7,200 MHz en région 1. Europe de jour, monde entier la nuit : c’est la bande à tout faire, ouverte à peu près en permanence.',
  },
  {
    id: 'R-BANDE-003',
    exam: 'reglementation',
    level: 'facile',
    topic: 'bandes',
    prompt: 'Quelles sont les limites de la bande des 2 mètres ?',
    choices: [
      'De 144 à 146 MHz',
      'De 140 à 145 MHz',
      'De 144 à 148 MHz',
      'De 145 à 147 MHz',
    ],
    answer: 0,
    explain:
      'De 144 à 146 MHz en région 1. La région 2 va jusqu’à 148 MHz, ce qui explique la proposition voisine : les plans de bande ne sont pas mondiaux.',
  },
  {
    id: 'R-BANDE-004',
    exam: 'reglementation',
    level: 'facile',
    topic: 'bandes',
    prompt: 'Quelles sont les limites de la bande des 70 centimètres ?',
    choices: [
      'De 430 à 440 MHz',
      'De 420 à 450 MHz',
      'De 435 à 438 MHz',
      'De 430 à 450 MHz',
    ],
    answer: 0,
    explain:
      'De 430 à 440 MHz en France. Le segment 435 à 438 MHz est celui du service amateur par satellite, qu’il ne faut pas confondre avec la bande entière.',
  },
  {
    id: 'R-BANDE-005',
    exam: 'reglementation',
    level: 'facile',
    topic: 'bandes',
    prompt: 'Sur quelle bande décamétrique la téléphonie est-elle interdite, au profit de la télégraphie et des modes numériques ?',
    choices: [
      'La bande des 30 mètres',
      'La bande des 17 mètres',
      'La bande des 12 mètres',
      'La bande des 15 mètres',
    ],
    answer: 0,
    explain:
      'De 10,100 à 10,150 MHz, la bande des 30 mètres est réservée à la télégraphie et aux modes numériques, et les concours y sont exclus. Une bande calme, idéale pour le morse.',
  },
  {
    id: 'R-BANDE-006',
    exam: 'reglementation',
    level: 'facile',
    topic: 'bandes',
    prompt: 'Quelle puissance maximale est autorisée au-dessus de 30 MHz ?',
    choices: ['120 W', '250 W', '500 W', '50 W'],
    answer: 0,
    explain:
      'Au-dessus de 30 MHz la limite est de 120 W en sortie d’émetteur, contre 250 W entre 28 et 30 MHz et 500 W en dessous de 28 MHz.',
  },
  {
    id: 'R-BANDE-007',
    exam: 'reglementation',
    level: 'facile',
    topic: 'bandes',
    prompt: 'Que signifie pour le service amateur un statut secondaire sur une bande ?',
    choices: [
      'Il ne doit pas brouiller les services primaires et ne peut réclamer aucune protection',
      'Il partage la bande à égalité de droits avec les autres services',
      'Il ne peut y émettre qu’en télégraphie',
      'Il n’y est autorisé que la nuit',
    ],
    answer: 0,
    explain:
      'Un service secondaire doit s’effacer devant les services primaires, sans pouvoir se plaindre des brouillages qu’il subit de leur part.',
  },
  {
    id: 'R-BANDE-008',
    exam: 'reglementation',
    level: 'facile',
    topic: 'bandes',
    prompt: 'À quelle gamme de fréquences correspond la bande des 80 mètres ?',
    choices: [
      'De 3,500 à 3,800 MHz',
      'De 1,810 à 1,850 MHz',
      'De 7,000 à 7,200 MHz',
      'De 5,3515 à 5,3665 MHz',
    ],
    answer: 0,
    explain:
      'De 3,500 à 3,800 MHz en région 1. Régionale de jour, européenne la nuit : c’est la bande des liaisons du soir.',
  },

  // --- Le trafic et ses règles ---
  {
    id: 'R-TRAF-001',
    exam: 'reglementation',
    level: 'facile',
    topic: 'trafic',
    prompt: 'À quels moments l’indicatif doit-il obligatoirement être transmis ?',
    choices: [
      'Au début et à la fin de toute période d’émission',
      'Uniquement au début de la liaison',
      'Uniquement à la fin de la liaison',
      'Seulement si le correspondant le demande',
    ],
    answer: 0,
    explain:
      'Au début et à la fin de chaque période d’émission, toutes les quinze minutes au-delà d’un quart d’heure sur la même fréquence, et à chaque changement de fréquence.',
  },
  {
    id: 'R-TRAF-002',
    exam: 'reglementation',
    level: 'facile',
    topic: 'trafic',
    prompt: 'Est-il permis de coder ses transmissions pour en obscurcir le sens ?',
    choices: [
      'Non : les communications se font en langage clair',
      'Oui, entre radioamateurs titulaires d’un indicatif',
      'Oui, à condition de déclarer le code à l’ANFR',
      'Oui, sur les bandes au-dessus de 30 MHz',
    ],
    answer: 0,
    explain:
      'Le langage clair est la règle. La seule exception concerne les signaux de commande envoyés aux satellites amateurs, pour pouvoir les faire taire immédiatement en cas de brouillage.',
  },
  {
    id: 'R-TRAF-003',
    exam: 'reglementation',
    level: 'facile',
    topic: 'trafic',
    prompt: 'Une station d’amateur peut-elle transmettre un message pour le compte d’une personne non radioamateur ?',
    choices: [
      'Non, sauf en cas d’urgence ou de secours en cas de catastrophe',
      'Oui, sans restriction',
      'Oui, si le message est transmis en langage clair',
      'Oui, à condition de le consigner au journal de bord',
    ],
    answer: 0,
    explain:
      'Le trafic pour le compte de tiers est interdit par le Règlement des radiocommunications. L’urgence et les secours en cas de catastrophe sont les seules exceptions.',
  },
  {
    id: 'R-TRAF-004',
    exam: 'reglementation',
    level: 'facile',
    topic: 'trafic',
    prompt: 'La tenue d’un journal de bord est-elle obligatoire ?',
    choices: [
      'Oui, et il doit être constamment à jour',
      'Non, c’est un simple usage',
      'Oui, mais seulement pour les radio-clubs',
      'Oui, mais seulement au-dessus de 100 watts',
    ],
    answer: 0,
    explain:
      'C’est une obligation. Le journal est le premier document regardé lors d’un contrôle, avec la déclaration de puissance, et il est présenté à toute réquisition des agents chargés du contrôle.',
  },
  {
    id: 'R-TRAF-005',
    exam: 'reglementation',
    level: 'facile',
    topic: 'trafic',
    prompt: 'Combien de temps le journal de bord doit-il être conservé ?',
    choices: [
      'Un an à compter de la dernière inscription',
      'Six mois à compter de la dernière inscription',
      'Trois ans à compter de son ouverture',
      'Il n’y a pas de durée imposée',
    ],
    answer: 0,
    explain:
      'Un an après la dernière ligne écrite. La forme est libre : papier à pages numérotées et non détachables, fichier informatique, ou tout procédé adapté à un opérateur handicapé.',
  },
  {
    id: 'R-TRAF-006',
    exam: 'reglementation',
    level: 'facile',
    topic: 'trafic',
    prompt: 'Laquelle de ces informations doit obligatoirement figurer au journal de bord ?',
    choices: [
      'La fréquence d’émission réellement employée',
      'Le rapport de signal reçu du correspondant',
      'Le type d’antenne utilisé',
      'Le nom et le prénom du correspondant',
    ],
    answer: 0,
    explain:
      'Le journal porte la date et l’heure, l’indicatif du correspondant, la fréquence — pas seulement la bande —, la classe d’émission, le lieu si la station est mobile ou portable, et l’opérateur pour un radio-club. Le rapport de signal est un usage, pas une obligation.',
  },
  {
    id: 'R-TRAF-007',
    exam: 'reglementation',
    level: 'facile',
    topic: 'trafic',
    prompt: 'En France, l’écoute des bandes radioélectriques est-elle libre ?',
    choices: [
      'Oui, depuis 1990',
      'Non, elle exige un récépissé',
      'Oui, mais seulement sur les bandes amateur',
      'Non, elle est réservée aux titulaires d’un indicatif',
    ],
    answer: 0,
    explain:
      'L’écoute est libre depuis 1990. Ce qui reste interdit, c’est de divulguer ce qu’on a capté : le secret des correspondances demeure entier.',
  },
  {
    id: 'R-TRAF-008',
    exam: 'reglementation',
    level: 'facile',
    topic: 'trafic',
    prompt: 'Que doit faire un opérateur avant d’émettre sur une fréquence ?',
    choices: [
      'Écouter pour s’assurer qu’il ne brouillera pas une liaison en cours',
      'Annoncer son indicatif trois fois',
      'Vérifier que la fréquence lui a été assignée',
      'Demander l’autorisation au relais le plus proche',
    ],
    answer: 0,
    explain:
      'Écouter avant d’émettre est la première des quatre obligations qui encadrent l’usage d’une fréquence. Les trois autres : ne pas occuper toujours la même fréquence, ne pas brouiller volontairement, ne pas réserver une station répétitrice à un groupe restreint.',
  },

  // --- La station et l'indicatif ---
  {
    id: 'R-STAT-001',
    exam: 'reglementation',
    level: 'facile',
    topic: 'station',
    prompt: 'Que détermine le préfixe d’un indicatif français ?',
    choices: [
      'Le territoire de l’adresse déclarée de la station',
      'La classe historique de l’opérateur',
      'L’ancienneté de l’opérateur',
      'La puissance autorisée',
    ],
    answer: 0,
    explain:
      'F pour la France continentale, deux lettres pour la Corse et l’outre-mer : TK en Corse, FG en Guadeloupe, FM en Martinique, FY en Guyane, FR à La Réunion.',
  },
  {
    id: 'R-STAT-002',
    exam: 'reglementation',
    level: 'facile',
    topic: 'station',
    prompt: 'Dans un indicatif français, que désigne le chiffre qui suit le préfixe ?',
    choices: [
      'La classe historique de l’opérateur',
      'La région d’émission',
      'Le nombre de lettres du suffixe',
      'L’année d’obtention du certificat',
    ],
    answer: 0,
    explain:
      'C’est une particularité française : ailleurs le chiffre désigne souvent une région. En France, 0 correspond à l’ancienne classe 3, 1 et 4 à l’ancienne classe 2, 5, 6 et 8 à l’ancienne classe 1 et aux radio-clubs.',
  },
  {
    id: 'R-STAT-003',
    exam: 'reglementation',
    level: 'facile',
    topic: 'station',
    prompt: 'À quoi correspond un suffixe commençant par la lettre K, comme dans F6KGL ?',
    choices: [
      'Un radio-club',
      'Une station répétitrice',
      'Un opérateur étranger installé en France',
      'Une station temporaire',
    ],
    answer: 0,
    explain:
      'La première lettre du suffixe dit à qui l’indicatif appartient : K pour les radio-clubs, Z pour les stations répétitrices, V et W pour les ressortissants étrangers installés en France.',
  },
  {
    id: 'R-STAT-004',
    exam: 'reglementation',
    level: 'facile',
    topic: 'station',
    prompt: 'À quoi correspond un suffixe commençant par la lettre Z ?',
    choices: [
      'Une station répétitrice, relais ou balise',
      'Un radio-club',
      'Une station en réserve',
      'Un indicatif spécial d’événement',
    ],
    answer: 0,
    explain: 'La série ZAA à ZZZ est réservée aux stations répétitrices : relais et balises.',
  },
  {
    id: 'R-STAT-005',
    exam: 'reglementation',
    level: 'facile',
    topic: 'station',
    prompt: 'Que signifie le suffixe /P ajouté à un indicatif ?',
    choices: [
      'Station portable : déplaçable, mais qui ne fonctionne pas pendant son transport',
      'Station en cours de contrôle par l’administration',
      'Station privée, hors radio-club',
      'Station à puissance réduite',
    ],
    answer: 0,
    explain:
      '/P pour portable, /M pour mobile — c’est-à-dire utilisée en mouvement, y compris à bord d’un aéronef —, /MM pour maritime mobile au-delà de douze milles nautiques.',
  },
  {
    id: 'R-STAT-006',
    exam: 'reglementation',
    level: 'facile',
    topic: 'station',
    prompt: 'Dans quel cas emploie-t-on le suffixe /MM ?',
    choices: [
      'À bord d’un navire en eaux internationales, au-delà de douze milles nautiques',
      'À bord de tout navire, quelle que soit sa position',
      'À bord d’un aéronef',
      'Pour une station mobile en montagne',
    ],
    answer: 0,
    explain:
      'Une station à bord d’un navire dans les eaux territoriales, sur un fleuve ou à quai est assimilée à une station mobile : c’est /M, pas /MM. La différence tient aux douze milles.',
  },
  {
    id: 'R-STAT-007',
    exam: 'reglementation',
    level: 'facile',
    topic: 'station',
    prompt: 'À partir de quelle puissance apparente rayonnée une installation fixe doit-elle être déclarée à l’ANFR ?',
    choices: ['5 watts', '10 watts', '50 watts', '100 watts'],
    answer: 0,
    explain:
      'Au-delà de 5 W de PAR, la déclaration est à faire dans les deux mois suivant l’installation. Les stations portables et mobiles ne sont pas concernées.',
  },
  {
    id: 'R-STAT-008',
    exam: 'reglementation',
    level: 'facile',
    topic: 'station',
    prompt: 'À partir de quelle hauteur un pylône impose-t-il une déclaration préalable d’urbanisme ?',
    choices: ['12 mètres', '4 mètres', '8 mètres', '20 mètres'],
    answer: 0,
    explain:
      'Douze mètres au-dessus du sol, antenne verticale comprise. Les antennes horizontales ou filaires ne sont soumises à aucune formalité.',
  },

  // --- Brouillage et sécurité ---
  {
    id: 'R-SECU-001',
    exam: 'reglementation',
    level: 'facile',
    topic: 'securite',
    prompt: 'Que désigne le sigle CEM ?',
    choices: [
      'La compatibilité électromagnétique',
      'Le contrôle des émissions modulées',
      'Le coefficient d’émission maximale',
      'La certification des équipements de mesure',
    ],
    answer: 0,
    explain:
      'La compatibilité électromagnétique est l’aptitude d’un appareil à fonctionner sans perturber son voisinage ni en être perturbé.',
  },
  {
    id: 'R-SECU-002',
    exam: 'reglementation',
    level: 'facile',
    topic: 'securite',
    prompt: 'Par quelles deux voies une perturbation électromagnétique se propage-t-elle ?',
    choices: [
      'Par conduction le long des câbles, et par rayonnement dans l’espace',
      'Par conduction et par convection',
      'Par réflexion et par réfraction',
      'Par induction et par capacité seulement',
    ],
    answer: 0,
    explain:
      'Une perturbation conduite emprunte les câbles, une perturbation rayonnée se propage dans l’espace. Le remède diffère : filtrer dans le premier cas, blinder dans le second.',
  },
  {
    id: 'R-SECU-003',
    exam: 'reglementation',
    level: 'facile',
    topic: 'securite',
    prompt: 'Quelle couleur de conducteur désigne la terre dans une installation électrique ?',
    choices: ['Jaune-vert', 'Bleu', 'Marron', 'Noir'],
    answer: 0,
    explain:
      'Jaune-vert pour la terre, bleu pour le neutre, rouge, marron ou noir pour la phase. Le conducteur de protection ne transporte aucun courant en fonctionnement normal.',
  },
  {
    id: 'R-SECU-004',
    exam: 'reglementation',
    level: 'facile',
    topic: 'securite',
    prompt: 'Quelle couleur de conducteur désigne le neutre ?',
    choices: ['Bleu', 'Jaune-vert', 'Rouge', 'Blanc'],
    answer: 0,
    explain: 'Le bleu désigne le neutre, retour du courant vers le réseau.',
  },
  {
    id: 'R-SECU-005',
    exam: 'reglementation',
    level: 'facile',
    topic: 'securite',
    prompt: 'En dessous de quelle tension alternative une installation en milieu sec n’est-elle pas considérée comme dangereuse ?',
    choices: ['50 V', '24 V', '12 V', '110 V'],
    answer: 0,
    explain:
      'Trois seuils : 50 V en milieu sec, 24 V en milieu humide ou à l’extérieur, 12 V en immersion. Au-dessus, il faut des compartiments fermés munis d’une coupure à l’ouverture.',
  },
  {
    id: 'R-SECU-006',
    exam: 'reglementation',
    level: 'facile',
    topic: 'securite',
    prompt: 'Quel dispositif protège le mieux des contacts indirects avec une masse métallique sous tension ?',
    choices: [
      'Le disjoncteur différentiel',
      'Le fusible rapide',
      'Le parafoudre',
      'Le filtre secteur',
    ],
    answer: 0,
    explain:
      'Le différentiel détecte la fuite de courant vers la terre, ce qu’un fusible ne fait pas : un fusible protège le circuit, pas la personne.',
  },
  {
    id: 'R-SECU-007',
    exam: 'reglementation',
    level: 'facile',
    topic: 'securite',
    prompt: 'Que ne faut-il jamais utiliser comme prise de terre ?',
    choices: [
      'Les canalisations d’eau, de gaz ou de chauffage central',
      'Un piquet de terre enfoncé dans le sol',
      'Une boucle de terre à fond de fouille',
      'Le conducteur de protection de l’installation',
    ],
    answer: 0,
    explain:
      'Les canalisations peuvent être remplacées par des tuyaux isolants, être coupées pour un entretien, ou propager un défaut jusque chez le voisin.',
  },
  {
    id: 'R-SECU-008',
    exam: 'reglementation',
    level: 'facile',
    topic: 'securite',
    prompt: 'Comment appelle-t-on l’accident électrique auquel la victime survit ?',
    choices: [
      'Une électrisation',
      'Une électrocution',
      'Une électrolyse',
      'Une électrostatique',
    ],
    answer: 0,
    explain:
      'On est électrisé quand on survit, électrocuté quand on en meurt. On ne peut donc pas dire « j’ai été électrocuté » : l’examen vérifie ce vocabulaire.',
  },
];

/**
 * Niveau facile — technique.
 *
 * Même exigence que pour la réglementation : une valeur, une définition, une
 * loi à reconnaître. Les calculs éventuels tiennent en une opération et sur
 * des nombres ronds ; les applications numériques sérieuses arrivent au niveau
 * suivant.
 */
export const FACILE_TECHNIQUE: Question[] = [
  // --- Calculs et multiples ---
  {
    id: 'T-CALC-001',
    exam: 'technique',
    level: 'facile',
    topic: 'calcul',
    prompt: 'Que vaut le préfixe « kilo » en puissance de dix ?',
    choices: ['10³', '10⁶', '10⁻³', '10⁹'],
    answer: 0,
    explain:
      'Kilo vaut mille, soit 10³. Méga vaut 10⁶, giga 10⁹, tandis que milli, micro, nano et pico valent respectivement 10⁻³, 10⁻⁶, 10⁻⁹ et 10⁻¹².',
  },
  {
    id: 'T-CALC-002',
    exam: 'technique',
    level: 'facile',
    topic: 'calcul',
    prompt: 'Quel multiple le symbole µ désigne-t-il ?',
    choices: ['Micro, soit 10⁻⁶', 'Milli, soit 10⁻³', 'Méga, soit 10⁶', 'Nano, soit 10⁻⁹'],
    answer: 0,
    explain:
      'Le µ vaut 10⁻⁶. Attention à la casse des symboles voisins : le m minuscule est milli, 10⁻³, tandis que le M majuscule est méga, 10⁶ — un facteur mille milliards entre les deux.',
  },
  {
    id: 'T-CALC-003',
    exam: 'technique',
    level: 'facile',
    topic: 'calcul',
    prompt: 'À combien de picofarads correspond une capacité de 1 nF ?',
    choices: ['1 000 pF', '100 pF', '10 pF', '1 000 000 pF'],
    answer: 0,
    explain: 'Le nano vaut mille fois le pico : 1 nF = 1 000 pF = 0,001 µF.',
  },
  {
    id: 'T-CALC-004',
    exam: 'technique',
    level: 'facile',
    topic: 'calcul',
    prompt: 'Combien de hertz représente une fréquence de 7 MHz ?',
    choices: ['7 000 000 Hz', '7 000 Hz', '700 000 Hz', '70 000 000 Hz'],
    answer: 0,
    explain: 'Le méga vaut un million : 7 MHz font 7 000 000 Hz, soit 7 000 kHz.',
  },

  // --- Lois d'Ohm et de Joule ---
  {
    id: 'T-OHM-001',
    exam: 'technique',
    level: 'facile',
    topic: 'ohm',
    prompt: 'Une résistance de 100 Ω est parcourue par un courant de 0,5 A. Quelle tension mesure-t-on à ses bornes ?',
    choices: ['50 V', '200 V', '5 V', '0,005 V'],
    answer: 0,
    explain: 'La loi d’Ohm donne U = R × I, soit 100 × 0,5 = 50 V.',
  },
  {
    id: 'T-OHM-002',
    exam: 'technique',
    level: 'facile',
    topic: 'ohm',
    prompt: 'Quelle expression donne la puissance dissipée par un composant ?',
    choices: ['P = U × I', 'P = U + I', 'P = U / I', 'P = I / U'],
    answer: 0,
    explain:
      'La loi de Joule : la puissance est le produit de la tension par le courant. En combinant avec la loi d’Ohm, elle s’écrit aussi P = R × I² ou P = U² / R.',
  },
  {
    id: 'T-OHM-003',
    exam: 'technique',
    level: 'facile',
    topic: 'ohm',
    prompt: 'Comment se calcule la résistance équivalente à deux résistances en série ?',
    choices: [
      'En additionnant leurs valeurs',
      'En divisant leur produit par leur somme',
      'En prenant la plus petite des deux',
      'En additionnant leurs inverses',
    ],
    answer: 0,
    explain:
      'En série, les résistances s’additionnent. En parallèle, c’est le produit divisé par la somme, et le résultat est toujours inférieur à la plus petite.',
  },
  {
    id: 'T-OHM-004',
    exam: 'technique',
    level: 'facile',
    topic: 'ohm',
    prompt: 'Deux résistances de 100 Ω sont montées en parallèle. Que vaut la résistance équivalente ?',
    choices: ['50 Ω', '200 Ω', '100 Ω', '25 Ω'],
    answer: 0,
    explain:
      'Deux résistances identiques en parallèle donnent la moitié de leur valeur : le produit sur la somme, soit 10 000 / 200 = 50 Ω.',
  },
  {
    id: 'T-OHM-005',
    exam: 'technique',
    level: 'facile',
    topic: 'ohm',
    prompt: 'Quelle bague de couleur code le chiffre 0 sur une résistance ?',
    choices: ['Noir', 'Marron', 'Blanc', 'Gris'],
    answer: 0,
    explain:
      'Le noir vaut 0, le marron 1, le rouge 2, et ainsi de suite jusqu’au blanc qui vaut 9. Le moyen mnémotechnique commence par « Ne Mangez Rien ».',
  },

  // --- Courant alternatif ---
  {
    id: 'T-ALT-001',
    exam: 'technique',
    level: 'facile',
    topic: 'alternatif',
    prompt: 'Quelle est la relation entre la période et la fréquence d’un signal ?',
    choices: [
      'La période est l’inverse de la fréquence',
      'La période est le double de la fréquence',
      'La période est égale à la fréquence',
      'La période est la racine carrée de la fréquence',
    ],
    answer: 0,
    explain: 'T = 1 / f. Un signal à 1 000 Hz a une période d’une milliseconde.',
  },
  {
    id: 'T-ALT-002',
    exam: 'technique',
    level: 'facile',
    topic: 'alternatif',
    prompt: 'Comment se comporte une bobine lorsque la fréquence augmente ?',
    choices: [
      'Sa réactance augmente',
      'Sa réactance diminue',
      'Sa réactance ne change pas',
      'Elle devient un court-circuit',
    ],
    answer: 0,
    explain:
      'La réactance inductive vaut 2πfL : elle croît avec la fréquence. La bobine laisse donc passer le continu et freine la haute fréquence, à l’inverse du condensateur.',
  },
  {
    id: 'T-ALT-003',
    exam: 'technique',
    level: 'facile',
    topic: 'alternatif',
    prompt: 'Comment se comporte un condensateur lorsque la fréquence augmente ?',
    choices: [
      'Sa réactance diminue',
      'Sa réactance augmente',
      'Sa réactance reste constante',
      'Il devient un circuit ouvert',
    ],
    answer: 0,
    explain:
      'La réactance capacitive vaut 1 / (2πfC) : elle diminue quand la fréquence monte. Un condensateur bloque le continu et laisse passer la haute fréquence.',
  },
  {
    id: 'T-ALT-004',
    exam: 'technique',
    level: 'facile',
    topic: 'alternatif',
    prompt: 'Dans quelle unité s’exprime une inductance ?',
    choices: ['Le henry', 'Le farad', 'Le hertz', 'Le siemens'],
    answer: 0,
    explain:
      'L’inductance se mesure en henrys, la capacité en farads, la fréquence en hertz. Le siemens mesure une conductance, inverse de la résistance.',
  },

  // --- Transformateurs et mesures ---
  {
    id: 'T-XFO-001',
    exam: 'technique',
    level: 'facile',
    topic: 'transformateurs',
    prompt: 'De quoi dépend le rapport des tensions d’un transformateur ?',
    choices: [
      'Du rapport du nombre de spires entre secondaire et primaire',
      'Du diamètre du fil employé',
      'De la section du noyau seulement',
      'De la fréquence appliquée',
    ],
    answer: 0,
    explain:
      'U2 / U1 = N2 / N1. Les courants suivent la relation inverse, et les impédances varient comme le carré du rapport de spires.',
  },
  {
    id: 'T-XFO-002',
    exam: 'technique',
    level: 'facile',
    topic: 'transformateurs',
    prompt: 'Un transformateur peut-il fonctionner en courant continu ?',
    choices: [
      'Non : il lui faut un courant variable pour induire une tension',
      'Oui, avec le même rapport de transformation',
      'Oui, mais seulement en abaisseur',
      'Oui, si le noyau est feuilleté',
    ],
    answer: 0,
    explain:
      'C’est la variation du flux magnétique qui induit la tension au secondaire. Un courant continu produit un flux constant, donc aucune tension induite.',
  },
  {
    id: 'T-XFO-003',
    exam: 'technique',
    level: 'facile',
    topic: 'transformateurs',
    prompt: 'Comment se branche un ampèremètre dans un circuit ?',
    choices: [
      'En série, pour être traversé par le courant à mesurer',
      'En parallèle sur le composant à mesurer',
      'Entre la phase et la terre',
      'En parallèle sur la source',
    ],
    answer: 0,
    explain:
      'L’ampèremètre se place en série et présente une résistance très faible. Le voltmètre, lui, se branche en parallèle et présente une résistance très élevée.',
  },
  {
    id: 'T-XFO-004',
    exam: 'technique',
    level: 'facile',
    topic: 'transformateurs',
    prompt: 'Quelle qualité attend-on d’un voltmètre ?',
    choices: [
      'Une résistance interne très élevée',
      'Une résistance interne très faible',
      'Une capacité d’entrée élevée',
      'Une inductance série importante',
    ],
    answer: 0,
    explain:
      'Branché en parallèle, un voltmètre ne doit dériver qu’un courant négligeable : sa résistance interne doit être très grande devant celle du circuit mesuré.',
  },

  // --- Filtres et circuits accordés ---
  {
    id: 'T-CIRC-001',
    exam: 'technique',
    level: 'facile',
    topic: 'circuits',
    prompt: 'Quels composants entrent dans la loi de Thomson ?',
    choices: [
      'Une inductance et une capacité',
      'Une résistance et une capacité',
      'Une résistance et une inductance',
      'Deux capacités',
    ],
    answer: 0,
    explain:
      'La loi de Thomson donne la fréquence de résonance d’un circuit LC : f = 1 / (2π √(L × C)). Ni la résistance ni la tension n’y figurent.',
  },
  {
    id: 'T-CIRC-002',
    exam: 'technique',
    level: 'facile',
    topic: 'circuits',
    prompt: 'Que laisse passer un filtre passe-bas ?',
    choices: [
      'Les fréquences inférieures à sa fréquence de coupure',
      'Les fréquences supérieures à sa fréquence de coupure',
      'Une bande étroite autour de sa fréquence centrale',
      'Toutes les fréquences sauf une bande étroite',
    ],
    answer: 0,
    explain:
      'Un passe-bas laisse passer le bas du spectre et atténue le haut. C’est le filtre placé en sortie d’émetteur pour bloquer les harmoniques.',
  },
  {
    id: 'T-CIRC-003',
    exam: 'technique',
    level: 'facile',
    topic: 'circuits',
    prompt: 'Que mesure le coefficient de surtension Q d’un circuit accordé ?',
    choices: [
      'Sa sélectivité, c’est-à-dire son aptitude à trier les fréquences',
      'Sa puissance maximale admissible',
      'Son rendement énergétique',
      'Sa tenue en tension',
    ],
    answer: 0,
    explain:
      'Plus le Q est élevé, plus la bande passante est étroite autour de la résonance : le circuit sépare mieux deux fréquences voisines.',
  },
  {
    id: 'T-CIRC-004',
    exam: 'technique',
    level: 'facile',
    topic: 'circuits',
    prompt: 'À la résonance d’un circuit LC, que valent les deux réactances ?',
    choices: [
      'Elles sont égales et s’annulent mutuellement',
      'La réactance inductive est nulle',
      'La réactance capacitive est maximale',
      'Elles sont toutes deux nulles',
    ],
    answer: 0,
    explain:
      'À la résonance, réactance inductive et réactance capacitive sont égales. Comme elles sont de signes opposés, elles se compensent et le circuit se comporte en résistance pure.',
  },

  // --- Diodes et alimentations ---
  {
    id: 'T-DIOD-001',
    exam: 'technique',
    level: 'facile',
    topic: 'diodes',
    prompt: 'Quelle est la tension de seuil d’une diode de redressement au silicium ?',
    choices: ['0,7 V', '0,3 V', '1,4 V', '0,1 V'],
    answer: 0,
    explain:
      'Environ 0,7 V au silicium, contre 0,3 V au germanium et 0,25 V pour une Schottky. Cette chute se retranche de la tension redressée.',
  },
  {
    id: 'T-DIOD-002',
    exam: 'technique',
    level: 'facile',
    topic: 'diodes',
    prompt: 'À quoi sert une diode Zener ?',
    choices: [
      'À stabiliser une tension',
      'À redresser un courant alternatif',
      'À remplacer un condensateur variable',
      'À commuter de la haute fréquence',
    ],
    answer: 0,
    explain:
      'Montée en inverse, la Zener devient brusquement passante au-delà de sa tension d’avalanche, puis se rebloque : son claquage est réversible, ce qui en fait un régulateur.',
  },
  {
    id: 'T-DIOD-003',
    exam: 'technique',
    level: 'facile',
    topic: 'diodes',
    prompt: 'Quelle diode se comporte comme un condensateur commandé par une tension ?',
    choices: [
      'La diode Varicap',
      'La diode Zener',
      'La diode Schottky',
      'La diode PIN',
    ],
    answer: 0,
    explain:
      'Montée en inverse, la Varicap voit sa capacité diminuer quand la tension inverse augmente. C’est le cœur d’un oscillateur commandé en tension.',
  },
  {
    id: 'T-DIOD-004',
    exam: 'technique',
    level: 'facile',
    topic: 'diodes',
    prompt: 'À quoi sert le condensateur placé après un redresseur dans une alimentation ?',
    choices: [
      'À filtrer, en lissant la tension redressée',
      'À élever la tension de sortie',
      'À protéger contre les surintensités',
      'À bloquer la composante continue',
    ],
    answer: 0,
    explain:
      'Le condensateur se charge aux crêtes et se décharge dans la charge entre deux alternances : il réduit l’ondulation résiduelle.',
  },

  // --- Transistors ---
  {
    id: 'T-TRAN-001',
    exam: 'technique',
    level: 'facile',
    topic: 'transistors',
    prompt: 'Quelles sont les trois électrodes d’un transistor bipolaire ?',
    choices: [
      'La base, le collecteur et l’émetteur',
      'La grille, le drain et la source',
      'L’anode, la cathode et la grille',
      'L’entrée, la sortie et la masse',
    ],
    answer: 0,
    explain:
      'Base, collecteur et émetteur pour le bipolaire. Grille, drain et source désignent les électrodes d’un transistor à effet de champ.',
  },
  {
    id: 'T-TRAN-002',
    exam: 'technique',
    level: 'facile',
    topic: 'transistors',
    prompt: 'Que représente le coefficient β d’un transistor bipolaire ?',
    choices: [
      'Son gain en courant',
      'Son gain en tension',
      'Sa puissance dissipable',
      'Sa fréquence de coupure',
    ],
    answer: 0,
    explain:
      'Le β, ou gain en courant, est le rapport du courant de collecteur au courant de base. Un faible courant de base commande un courant de collecteur bien plus important.',
  },
  {
    id: 'T-TRAN-003',
    exam: 'technique',
    level: 'facile',
    topic: 'transistors',
    prompt: 'Quel montage à transistor inverse le signal de 180 degrés ?',
    choices: [
      'L’émetteur commun',
      'Le collecteur commun',
      'La base commune',
      'Aucun montage n’inverse le signal',
    ],
    answer: 0,
    explain:
      'L’émetteur commun amplifie en courant comme en tension et inverse le signal. Le collecteur commun et la base commune ne déphasent pas.',
  },
  {
    id: 'T-TRAN-004',
    exam: 'technique',
    level: 'facile',
    topic: 'transistors',
    prompt: 'Quel autre nom porte le montage en collecteur commun ?',
    choices: [
      'L’émetteur suiveur',
      'Le montage cascode',
      'Le montage différentiel',
      'Le montage push-pull',
    ],
    answer: 0,
    explain:
      'Son gain en tension est inférieur à 1 et sa sortie suit l’entrée : c’est un amplificateur de courant, employé comme adaptateur d’impédance.',
  },

  // --- Amplis, oscillateurs et mélangeurs ---
  {
    id: 'T-ETAG-001',
    exam: 'technique',
    level: 'facile',
    topic: 'etages',
    prompt: 'Dans quelle classe d’amplification le transistor conduit-il pendant toute la période du signal ?',
    choices: ['La classe A', 'La classe B', 'La classe C', 'La classe D'],
    answer: 0,
    explain:
      'En classe A, le point de repos est au centre de la plage : le signal ne sort jamais du domaine linéaire, donc aucune distorsion, mais un rendement médiocre.',
  },
  {
    id: 'T-ETAG-002',
    exam: 'technique',
    level: 'facile',
    topic: 'etages',
    prompt: 'Quelle classe d’amplification est à proscrire pour amplifier un signal en BLU ?',
    choices: ['La classe C', 'La classe A', 'La classe AB', 'La classe B'],
    answer: 0,
    explain:
      'La classe C n’amplifie que les crêtes et détruit l’information portée par l’amplitude. Elle convient à la CW et à la FM, jamais à l’AM ni à la BLU.',
  },
  {
    id: 'T-ETAG-003',
    exam: 'technique',
    level: 'facile',
    topic: 'etages',
    prompt: 'Que produit un mélangeur alimenté par deux fréquences ?',
    choices: [
      'Leur somme et leur différence',
      'Leur produit uniquement',
      'Leur moyenne',
      'La plus élevée des deux',
    ],
    answer: 0,
    explain:
      'Un mélangeur délivre principalement la somme et la différence des deux fréquences appliquées. C’est le principe du changement de fréquence.',
  },
  {
    id: 'T-ETAG-004',
    exam: 'technique',
    level: 'facile',
    topic: 'etages',
    prompt: 'Quel avantage un oscillateur à quartz présente-t-il sur un oscillateur à circuit LC ?',
    choices: [
      'Une bien meilleure stabilité en fréquence',
      'Une fréquence facilement réglable',
      'Une puissance de sortie plus élevée',
      'Un encombrement plus faible',
    ],
    answer: 0,
    explain:
      'Le quartz doit sa stabilité à ses propriétés mécaniques. En contrepartie sa fréquence est fixe, définie par l’épaisseur de la lame taillée.',
  },

  // --- Ampli op et logique ---
  {
    id: 'T-NUM-001',
    exam: 'technique',
    level: 'facile',
    topic: 'numerique',
    prompt: 'Quelle caractéristique attend-on des entrées d’un amplificateur opérationnel ?',
    choices: [
      'Une impédance d’entrée très élevée',
      'Une impédance d’entrée très faible',
      'Une tension de sortie nulle au repos',
      'Un gain en boucle ouverte proche de 1',
    ],
    answer: 0,
    explain:
      'L’ampli op idéal a une impédance d’entrée infinie, une impédance de sortie nulle et un gain en boucle ouverte très élevé. La contre-réaction fixe ensuite le gain réel.',
  },
  {
    id: 'T-NUM-002',
    exam: 'technique',
    level: 'facile',
    topic: 'numerique',
    prompt: 'Quand la sortie d’une porte ET vaut-elle 1 ?',
    choices: [
      'Seulement lorsque toutes ses entrées valent 1',
      'Dès qu’une de ses entrées vaut 1',
      'Lorsque ses entrées sont différentes',
      'Lorsque toutes ses entrées valent 0',
    ],
    answer: 0,
    explain:
      'La porte ET exige toutes ses entrées à 1. La porte OU se contente d’une seule, et la porte OU EXCLUSIF demande des entrées différentes.',
  },
  {
    id: 'T-NUM-003',
    exam: 'technique',
    level: 'facile',
    topic: 'numerique',
    prompt: 'Quand la sortie d’une porte OU EXCLUSIF vaut-elle 1 ?',
    choices: [
      'Lorsque ses deux entrées sont différentes',
      'Lorsque ses deux entrées sont identiques',
      'Lorsque ses deux entrées valent 1',
      'Lorsque ses deux entrées valent 0',
    ],
    answer: 0,
    explain:
      'Le OU EXCLUSIF détecte la différence : 0 et 1 donnent 1, tandis que 0 et 0, comme 1 et 1, donnent 0. C’est un comparateur d’un bit.',
  },
  {
    id: 'T-NUM-004',
    exam: 'technique',
    level: 'facile',
    topic: 'numerique',
    prompt: 'Combien de valeurs différentes un mot de quatre bits peut-il représenter ?',
    choices: ['16', '8', '4', '32'],
    answer: 0,
    explain:
      'Deux puissance quatre, soit 16 valeurs, de 0 à 15. C’est exactement ce que code un chiffre hexadécimal, de 0 à F.',
  },

  // --- Récepteurs et émetteurs ---
  {
    id: 'T-RECE-001',
    exam: 'technique',
    level: 'facile',
    topic: 'recepteurs',
    prompt: 'Quel étage d’un récepteur superhétérodyne produit la fréquence intermédiaire ?',
    choices: [
      'Le mélangeur, associé à l’oscillateur local',
      'L’amplificateur haute fréquence',
      'Le détecteur',
      'L’amplificateur basse fréquence',
    ],
    answer: 0,
    explain:
      'Le mélangeur combine le signal reçu et l’oscillateur local ; leur différence donne la fréquence intermédiaire, amplifiée et filtrée à une fréquence fixe.',
  },
  {
    id: 'T-RECE-002',
    exam: 'technique',
    level: 'facile',
    topic: 'recepteurs',
    prompt: 'Pourquoi un récepteur superhétérodyne travaille-t-il à fréquence intermédiaire fixe ?',
    choices: [
      'Pour que le filtrage et l’amplification restent optimaux quelle que soit la fréquence reçue',
      'Pour réduire la consommation du récepteur',
      'Pour supprimer la fréquence image',
      'Pour éviter d’utiliser un oscillateur local',
    ],
    answer: 0,
    explain:
      'Un filtre très sélectif est difficile à rendre accordable. En ramenant toujours le signal à la même fréquence, on peut le tailler une fois pour toutes.',
  },
  {
    id: 'T-RECE-003',
    exam: 'technique',
    level: 'facile',
    topic: 'recepteurs',
    prompt: 'À combien de décibels un point de l’échelle S correspond-il ?',
    choices: ['6 dB', '3 dB', '10 dB', '20 dB'],
    answer: 0,
    explain:
      'Un point S vaut 6 dB, soit un facteur deux en tension. S9 correspond à 50 microvolts sur 50 ohms en décamétriques.',
  },
  {
    id: 'T-RECE-004',
    exam: 'technique',
    level: 'facile',
    topic: 'recepteurs',
    prompt: 'À quoi sert l’étage final d’un émetteur ?',
    choices: [
      'À porter le signal au niveau de puissance voulu avant l’antenne',
      'À produire la fréquence de travail',
      'À moduler la porteuse',
      'À filtrer la fréquence image',
    ],
    answer: 0,
    explain:
      'L’étage final, ou étage de puissance, amplifie le signal déjà modulé. Il est suivi d’un filtre passe-bas qui bloque les harmoniques avant l’antenne.',
  },

  // --- Les modulations ---
  {
    id: 'T-MODU-001',
    exam: 'technique',
    level: 'facile',
    topic: 'modulations',
    prompt: 'Quelles sont les trois grandeurs d’une sinusoïde sur lesquelles une modulation peut agir ?',
    choices: [
      'L’amplitude, la fréquence et la phase',
      'La tension, le courant et la puissance',
      'L’amplitude, la période et la vitesse',
      'La fréquence, la longueur d’onde et la puissance',
    ],
    answer: 0,
    explain:
      'Toutes les modulations sortent de ces trois cases : l’amplitude donne l’AM et la BLU, la fréquence et la phase donnent les modulations angulaires, et leur combinaison donne la QAM.',
  },
  {
    id: 'T-MODU-002',
    exam: 'technique',
    level: 'facile',
    topic: 'modulations',
    prompt: 'Que trouve-t-on dans le spectre d’une émission en modulation d’amplitude ?',
    choices: [
      'La porteuse et deux bandes latérales',
      'La porteuse seule',
      'Une seule bande latérale',
      'Deux porteuses et une bande latérale',
    ],
    answer: 0,
    explain:
      'Moduler, c’est multiplier : on retrouve la porteuse au centre et deux bandes latérales, à HF plus BF et HF moins BF. Les deux portent le même message.',
  },
  {
    id: 'T-MODU-003',
    exam: 'technique',
    level: 'facile',
    topic: 'modulations',
    prompt: 'Quel est l’avantage principal de la bande latérale unique sur la modulation d’amplitude ?',
    choices: [
      'Toute la puissance sert à transmettre l’information, dans une bande deux fois plus étroite',
      'Elle est moins sensible aux parasites impulsionnels',
      'Elle se démodule sans oscillateur local',
      'Elle permet une plus grande puissance de sortie',
    ],
    answer: 0,
    explain:
      'La BLU supprime la porteuse, qui ne portait aucune information, et l’une des deux bandes latérales, qui faisait doublon. Le gain est considérable en puissance comme en encombrement.',
  },
  {
    id: 'T-MODU-004',
    exam: 'technique',
    level: 'facile',
    topic: 'modulations',
    prompt: 'Quelle modulation est la moins sensible aux parasites d’amplitude ?',
    choices: [
      'La modulation de fréquence',
      'La modulation d’amplitude',
      'La bande latérale unique',
      'La télégraphie par coupure de porteuse',
    ],
    answer: 0,
    explain:
      'En FM, l’information est portée par la fréquence : le récepteur peut écrêter l’amplitude sans rien perdre, ce qui élimine la plupart des parasites.',
  },

  // --- Décibels et puissances ---
  {
    id: 'T-DB-001',
    exam: 'technique',
    level: 'facile',
    topic: 'decibels',
    prompt: 'À quel rapport de puissance correspond un gain de 3 dB ?',
    choices: ['Le double', 'Le triple', 'Dix fois plus', 'Trois fois moins'],
    answer: 0,
    explain:
      'Trois décibels doublent la puissance, 10 dB la multiplient par dix, et 0 dB correspond à un rapport de 1, c’est-à-dire à aucun changement.',
  },
  {
    id: 'T-DB-002',
    exam: 'technique',
    level: 'facile',
    topic: 'decibels',
    prompt: 'À quel rapport de puissance correspond une atténuation de 10 dB ?',
    choices: [
      'Un dixième de la puissance',
      'La moitié de la puissance',
      'Un centième de la puissance',
      'Un quart de la puissance',
    ],
    answer: 0,
    explain:
      'Le signe négatif inverse le rapport : plus 10 dB multiplient par dix, moins 10 dB divisent par dix. Moins 20 dB divisent par cent.',
  },
  {
    id: 'T-DB-003',
    exam: 'technique',
    level: 'facile',
    topic: 'decibels',
    prompt: 'Quelle puissance sert de référence à l’échelle des dBm ?',
    choices: ['1 milliwatt', '1 watt', '1 microwatt', '1 kilowatt'],
    answer: 0,
    explain:
      'Le dBm se réfère au milliwatt : 0 dBm valent 1 mW, 30 dBm valent 1 W. Le dBW, lui, se réfère au watt.',
  },
  {
    id: 'T-DB-004',
    exam: 'technique',
    level: 'facile',
    topic: 'decibels',
    prompt: 'Comment se combinent les gains et les pertes successifs d’une chaîne, exprimés en décibels ?',
    choices: [
      'Ils s’additionnent algébriquement',
      'Ils se multiplient entre eux',
      'On retient le plus grand',
      'On en fait la moyenne',
    ],
    answer: 0,
    explain:
      'C’est tout l’intérêt du décibel : il transforme des multiplications en additions. Un ampli de 10 dB suivi d’un câble perdant 2 dB donne 8 dB.',
  },

  // --- Antennes et lignes ---
  {
    id: 'T-ANT-001',
    exam: 'technique',
    level: 'facile',
    topic: 'antennes',
    prompt: 'Quelle formule donne la longueur d’onde en mètres à partir de la fréquence en mégahertz ?',
    choices: [
      'λ = 300 / f',
      'λ = 150 / f',
      'λ = 75 / f',
      'λ = f / 300',
    ],
    answer: 0,
    explain:
      'La lumière parcourt 300 000 km par seconde, soit 300 mètres par microseconde. À 3 MHz, la longueur d’onde vaut 100 mètres.',
  },
  {
    id: 'T-ANT-002',
    exam: 'technique',
    level: 'facile',
    topic: 'antennes',
    prompt: 'Quelle est l’impédance d’un doublet demi-onde dont les brins sont alignés ?',
    choices: ['73 Ω', '50 Ω', '300 Ω', '36 Ω'],
    answer: 0,
    explain:
      'Environ 73 ohms. Elle descend à 52 ohms si les brins forment un angle de 120 degrés, et à 36 ohms s’ils sont à 90 degrés.',
  },
  {
    id: 'T-ANT-003',
    exam: 'technique',
    level: 'facile',
    topic: 'antennes',
    prompt: 'De quoi une antenne quart d’onde verticale a-t-elle besoin pour fonctionner ?',
    choices: [
      'D’un plan de sol, radians ou masse métallique',
      'D’un accord en longueur sur la demi-onde',
      'D’une alimentation par ligne symétrique',
      'D’un second brin vertical',
    ],
    answer: 0,
    explain:
      'C’est une moitié de dipôle : le second brin est reconstitué électriquement par un plan de sol — des radians, la terre, ou la carrosserie d’un véhicule.',
  },
  {
    id: 'T-ANT-004',
    exam: 'technique',
    level: 'facile',
    topic: 'antennes',
    prompt: 'Que vaut le rapport d’ondes stationnaires lorsque la charge est parfaitement adaptée à la ligne ?',
    choices: ['1', '0', 'L’infini', '50'],
    answer: 0,
    explain:
      'Un ROS de 1 signifie qu’aucune énergie ne revient vers l’émetteur. Plus il s’élève, plus la part réfléchie est importante.',
  },
];
