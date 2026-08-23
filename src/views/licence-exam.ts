/**
 * Page « Le certificat d'opérateur ».
 *
 * Porte d'entrée de la section Licence : à quoi sert le certificat, comment se
 * déroule l'examen, ce qu'il faut faire avant et après. Tout le reste de la
 * section est du contenu de cours ; cette page-ci répond aux questions
 * pratiques qu'on se pose avant de décider de s'y mettre.
 */

import { h } from '../ui/dom.ts';
import type { View, ViewContext } from '../ui/router.ts';

interface Power {
  range: string;
  limit: string;
  note: string;
}

const POWERS: Power[] = [
  { range: 'En dessous de 479 kHz', limit: '1 W', note: 'PIRE — puissance isotrope rayonnée équivalente' },
  { range: 'De 479 kHz à 28 MHz', limit: '500 W', note: 'À la sortie de l’émetteur' },
  { range: 'De 5,3515 à 5,3665 MHz', limit: '15 W', note: 'PIRE — la bande 60 m fait exception' },
  { range: 'De 28 à 30 MHz', limit: '250 W', note: 'À la sortie de l’émetteur' },
  { range: 'Au-dessus de 30 MHz', limit: '120 W', note: 'À la sortie de l’émetteur' },
];

interface Trial {
  name: string;
  duration: string;
  questions: string;
  program: string;
}

const TRIALS: Trial[] = [
  {
    name: 'Réglementation',
    duration: '15 minutes',
    questions: '20 questions',
    program:
      'La réglementation des radiocommunications et les conditions de mise en œuvre des installations du service amateur, plus quelques connaissances techniques de base.',
  },
  {
    name: 'Technique',
    duration: '30 minutes',
    questions: '20 questions',
    program:
      'L’électricité et la radioélectricité : lois fondamentales, composants, circuits, propagation, antennes, lignes, schémas de postes et modulations.',
  },
];

export function licenceExamView(_context: ViewContext): View {
  const element = h(
    'div',
    { class: 'stack' },

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__lead' },
        "Écouter la radio est libre et ne demande rien à personne. Émettre demande une autorisation, " +
        "et cette autorisation s’obtient par un examen : le certificat d’opérateur du service amateur. " +
        "Il n’est pas hors de portée — le taux de réussite dépasse 80 % — mais il se prépare."),
      h('p', {},
        "Cette section rassemble ce qu’il faut savoir pour le passer. Elle commence ici, par les " +
        "questions pratiques : ce que le certificat autorise, comment l’examen se déroule, et ce qu’il " +
        "faut faire une fois reçu."),
    ),

    // --- Ce que le certificat autorise ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Un seul certificat, valable dans toute l’Europe' }),
      h('p', {},
        "Il n’existe aujourd’hui qu’une seule classe de certificat en France. Elle est reconnue " +
        "au niveau européen — c’est un équivalent ",
        h('strong', { text: 'CEPT' }),
        " — ce qui permet d’émettre sans démarche particulière depuis la plupart des pays européens, " +
        "en faisant précéder son indicatif du préfixe du pays visité."),
      h('p', {},
        "Deux classes anciennes subsistent chez leurs titulaires mais ne sont plus délivrées. La " +
        "classe 3, dite Novice, s’obtenait sans examen technique et se limitait à dix watts sur la " +
        "bande des 2 mètres. La classe 1 s’obtenait en passant une épreuve de télégraphie."),
      h('p', {},
        "Cette épreuve de morse a disparu, et c’est une bonne nouvelle mal comprise : elle n’a jamais " +
        "signifié que la télégraphie était abandonnée. La CW reste autorisée sur toutes les bandes dès " +
        "le premier jour, et reste le mode qui porte le plus loin avec le moins de puissance. Elle " +
        "n’est simplement plus une barrière à l’entrée — on l’apprend maintenant parce qu’on en a " +
        "envie, ce qui est une bien meilleure raison."),
      h('h3', { text: 'Les puissances autorisées' }),
      h('p', {},
        "Le certificat donne accès à toutes les bandes radioamateur et à toutes les classes " +
        "d’émission. Seule la puissance est plafonnée, et ce plafond dépend de la fréquence."),
    ),

    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        { class: 'data-table' },
        h('thead', {},
          h('tr', {},
            h('th', { attrs: { scope: 'col' }, text: 'Fréquences' }),
            h('th', { attrs: { scope: 'col' }, text: 'Puissance' }),
            h('th', { attrs: { scope: 'col' }, text: 'Mesurée comment' }))),
        h('tbody', {},
          ...POWERS.map((power) =>
            h('tr', {},
              h('th', { attrs: { scope: 'row' }, text: power.range }),
              h('td', { class: 'num', text: power.limit }),
              h('td', { text: power.note })))),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__note' },
        "La puissance isotrope rayonnée équivalente tient compte du gain de l’antenne : c’est ce qui " +
        "part réellement dans la direction privilégiée, pas ce que délivre le poste. Sur les bandes " +
        "les plus basses, c’est cette grandeur qui est plafonnée."),
    ),

    // --- Les deux épreuves ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Deux épreuves indépendantes' }),
      h('p', {},
        "L’examen se compose de deux épreuves, passées le même jour et sans pause entre elles. " +
        "Chacune est un questionnaire à choix multiple, avec une seule bonne réponse par question, " +
        "sur ordinateur."),
    ),

    h(
      'div',
      { class: 'exam-trials' },
      ...TRIALS.map((trial) =>
        h(
          'section',
          { class: 'exam-trial' },
          h('h3', { class: 'exam-trial__name', text: trial.name }),
          h('p', { class: 'exam-trial__meta' },
            h('strong', { text: trial.questions }),
            ' · ',
            h('strong', { text: trial.duration })),
          h('p', { class: 'exam-trial__program', text: trial.program }),
        ),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', {},
        "Il faut la moyenne à chacune des deux, soit ",
        h('strong', { text: '10 sur 20' }),
        ". Réussir l’une ne dispense pas de l’autre, mais le bénéfice d’une épreuve réussie est " +
        "conservé ",
        h('strong', { text: 'un an' }),
        " : un candidat reçu en technique et recalé en réglementation ne repasse que la " +
        "réglementation, à condition de le faire dans l’année."),

      h('h3', { text: 'Le barème récompense l’audace' }),
      h('p', {},
        "Une bonne réponse vaut un point. Une mauvaise réponse vaut zéro — et une question laissée " +
        "vide vaut zéro également. Il n’y a ",
        h('strong', { text: 'aucune pénalité' }),
        " pour une erreur."),
      h('p', {},
        "La conséquence est directe : ne laissez jamais une question sans réponse. Répondre au " +
        "hasard à quatre propositions rapporte en moyenne un quart de point, répondre après avoir " +
        "éliminé deux propositions absurdes en rapporte la moitié. Sept questions maîtrisées et " +
        "treize réponses au hasard donnent une espérance de 10,25 points — soit tout juste la " +
        "moyenne. Ce calcul est rassurant, pas confortable : visez plutôt treize réponses sûres, " +
        "pour ne pas jouer la licence à pile ou face."),
      h('p', { class: 'prose__note' },
        "Ce barème date de 2021. Avant, une bonne réponse valait trois points et une erreur en " +
        "retirait un, ce qui rendait le hasard coûteux. Les conseils de préparation plus anciens " +
        "que vous croiserez peuvent donc dire exactement l’inverse."),
    ),

    // --- Passer l'examen ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'S’inscrire et passer l’épreuve' }),
      h('p', {},
        "L’examen est organisé par l’",
        h('strong', { text: 'ANFR' }),
        ", l’Agence nationale des fréquences, dans des centres rattachés à ses services régionaux de " +
        "radiocommunications. Il n’y a ",
        h('strong', { text: 'aucun âge minimum' }),
        " et, depuis 2021, ",
        h('strong', { text: 'aucun frais' }),
        " : l’ancienne taxe de trente euros a été supprimée."),
      h('p', {},
        "On prend rendez-vous directement auprès du centre choisi. Comptez environ un mois entre " +
        "l’appel et la date, davantage si vous visez un jour précis. Le centre envoie ensuite une " +
        "convocation."),
      h('h3', { text: 'Le jour J' }),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'À apporter. ' }),
          "La convocation, une pièce d’identité, une calculette non programmable et un crayon. Le " +
          "brouillon est fourni sur place."),
        h('li', {},
          h('strong', { text: 'Les cinq premières minutes. ' }),
          "Avant de lancer le chronomètre, notez sur le brouillon ce que vous ne voulez pas avoir à " +
          "retrouver sous pression : les triangles de la loi d’Ohm, les rapports du transformateur, " +
          "la table des décibels, les multiples et sous-multiples, le code des couleurs. Vous les " +
          "aurez sous les yeux pendant toute l’épreuve."),
        h('li', {},
          h('strong', { text: 'Le déroulement. ' }),
          "C’est vous qui déclenchez le compte à rebours après avoir vérifié vos informations. La " +
          "réglementation vient d’abord, la technique ensuite, sans interruption."),
        h('li', {},
          h('strong', { text: 'Les résultats. ' }),
          "Ils ne s’affichent qu’à la fin des deux épreuves. Une réglementation qui s’est mal passée " +
          "ne doit donc pas gâcher la technique : vous n’en saurez rien avant d’avoir terminé."),
        h('li', {},
          h('strong', { text: 'En cas de problème. ' }),
          "Panne, question qui semble fausse : prévenez immédiatement le surveillant, lui seul peut " +
          "arrêter le décompte. Après la fin du temps, plus aucune contestation n’est recevable."),
      ),
      h('p', {},
        "En cas d’échec à une épreuve, il faut attendre ",
        h('strong', { text: 'deux mois' }),
        " avant de la repasser, et un mois avant de pouvoir seulement reprendre rendez-vous."),
      h('p', { class: 'prose__note' },
        "Un candidat dont le taux d’incapacité permanente atteint 70 % bénéficie d’épreuves adaptées " +
        "à son handicap et d’un temps triplé, soit quarante-cinq minutes en réglementation et une " +
        "heure trente en technique. L’examen peut alors se dérouler à son domicile."),
    ),

    // --- Après ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Après la réussite : deux documents, pas un' }),
      h('p', {},
        "C’est le point sur lequel beaucoup se trompent. Le ",
        h('strong', { text: 'certificat d’opérateur' }),
        " atteste que vous avez réussi l’examen ; l’ANFR vous l’envoie spontanément dans la semaine. " +
        "Il ne donne pas le droit d’émettre."),
      h('p', {},
        "Ce droit vient de la ",
        h('strong', { text: 'notification d’indicatif d’appel' }),
        ", qui se demande séparément et arrive par courrier. C’est elle, et elle seule, qui autorise " +
        "l’émission. Tant qu’elle n’est pas là, on écoute."),
      h('p', {},
        "La demande se fait en ligne sur le téléservice de l’ANFR, avec le numéro de certificat, un " +
        "scan de la pièce d’identité et un scan du certificat. L’indicatif apparaît souvent dans " +
        "l’annuaire en ligne avant que le courrier n’arrive — mais c’est le courrier qui fait foi."),
      h('p', {},
        "L’indicatif attribué dépend de l’adresse déclarée de la station : F pour la France " +
        "continentale, deux lettres pour la Corse et l’outre-mer. Sa structure et sa lecture sont " +
        "détaillées dans ",
        h('a', { href: '#/apprendre/communication', text: 'Communiquer en morse' }),
        "."),
    ),

    // --- Programme ---
    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Ce que couvre le programme' }),
      h('p', { class: 'card__hint' },
        "Les cours de cette section suivent ce découpage. Ils se lisent dans l’ordre, mais chaque " +
        "chapitre se tient seul."),
      h(
        'div',
        { class: 'syllabus' },
        h(
          'section',
          { class: 'syllabus__part' },
          h('h3', { class: 'syllabus__title', text: 'Réglementation' }),
          h(
            'ul',
            { class: 'syllabus__list' },
            h('li', { text: 'Classes d’émission et conditions techniques à respecter' }),
            h('li', { text: 'Bandes attribuées au service amateur et statut de chacune' }),
            h('li', { text: 'Épellation, code Q, déroulement d’un contact, contenu des messages' }),
            h('li', { text: 'Journal de bord, indicatifs, brouillages, usage à l’étranger' }),
            h('li', { text: 'Bases techniques : décibels, antennes, lignes, sécurité électrique' }),
          ),
        ),
        h(
          'section',
          { class: 'syllabus__part' },
          h('h3', { class: 'syllabus__title', text: 'Technique' }),
          h(
            'ul',
            { class: 'syllabus__list' },
            h('li', { text: 'Outils de calcul : transformation d’équations, puissances de dix' }),
            h('li', { text: 'Lois d’Ohm et de Joule, résistances, réseaux' }),
            h('li', { text: 'Courant alternatif, bobines, condensateurs, transformateurs' }),
            h('li', { text: 'Décibels, circuits accordés, loi de Thomson' }),
            h('li', { text: 'Diodes, transistors, amplificateurs, oscillateurs, mélangeurs' }),
            h('li', { text: 'Amplificateurs opérationnels et circuits logiques' }),
            h('li', { text: 'Propagation, antennes, lignes de transmission et adaptation' }),
            h('li', { text: 'Schémas d’émetteurs et de récepteurs, compatibilité électromagnétique' }),
            h('li', { text: 'Types de modulation, dont la manipulation par coupure de porteuse' }),
          ),
        ),
      ),
    ),

    // --- Se tester ---
    h(
      'section',
      { class: 'card card--accent' },
      h('h2', { class: 'card__title', text: 'Se tester' }),
      h('p', {},
        "Relire un chapitre donne l’impression de le savoir ; répondre à une question le prouve ou le " +
        "dément. Le questionnaire reprend le format officiel et propose un examen blanc chronométré, " +
        "des séries libres par thème, et une révision qui insiste sur ce que vous ratez."),
      h(
        'div',
        { class: 'actions' },
        h('a', { class: 'btn btn--primary', href: '#/licence/questionnaire', text: 'Ouvrir le questionnaire' }),
        h('a', { class: 'btn', href: '#/licence/formulaire', text: 'Le formulaire à imprimer' }),
      ),
    ),

    // --- Crédits ---
    h(
      'section',
      { class: 'card card--muted' },
      h('h2', { class: 'card__title', text: 'D’où vient ce contenu' }),
      h('p', {},
        "Les cours de cette section sont rédigés pour ce site, mais ils s’appuient sur un document " +
        "de référence : ",
        h('em', { text: 'Préparation au certificat d’opérateur du service amateur' }),
        ", par ",
        h('strong', { text: 'F6GPX' }),
        ", publié par le Radio-Club de la Haute Île (F5KFF / F6KGL) et mis à jour deux fois par an."),
      h('p', {},
        "C’est un travail considérable, offert librement sous licence ",
        h('a', {
          href: 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr',
          text: 'Creative Commons BY-NC-SA 4.0',
          attrs: { rel: 'noopener noreferrer', target: '_blank' },
        }),
        ". Si vous préparez sérieusement l’examen, allez le lire à la source : il est plus complet " +
        "que ce site ne le sera jamais, et il s’accompagne de près de cinq cents exercices corrigés."),
      h(
        'div',
        { class: 'actions' },
        h('a', {
          class: 'btn',
          href: 'https://f6kgl-f5kff.fr/formationf6gpx/',
          text: 'Le cours original et ses exercices',
          attrs: { rel: 'noopener noreferrer', target: '_blank' },
        }),
      ),
      h('p', { class: 'field__hint' },
        "Ce site n’est ni affilié au radio-club, ni à l’ANFR. Les informations réglementaires " +
        "peuvent changer : en cas de doute, les textes officiels et le centre d’examen font foi."),
    ),
  );

  return { element };
}
