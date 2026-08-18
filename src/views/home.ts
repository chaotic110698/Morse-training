/** Page d'accueil : point d'entrée et état des lieux en un coup d'œil. */

import { h, formatNumber } from '../ui/dom.ts';
import { formatDuration, formatPercent, overallAccuracy } from '../core/progress.ts';
import { kochCharset, kochMaxLevel } from '../core/koch.ts';
import { evaluateAchievements } from '../core/achievements.ts';
import type { View, ViewContext } from '../ui/router.ts';

interface Shortcut {
  path: string;
  icon: string;
  title: string;
  text: string;
}

const SHORTCUTS: Shortcut[] = [
  {
    path: '/entrainement/ecoute',
    icon: '🎧',
    title: 'Écoute — méthode Koch',
    text: "L'exercice central. Deux caractères pour commencer, à pleine vitesse, puis un de plus dès que vous êtes fiable.",
  },
  {
    path: '/entrainement/emission',
    icon: '🔑',
    title: 'Émission au manipulateur',
    text: 'Manipulateur droit ou palettes iambiques, au doigt sur téléphone ou au clavier sur ordinateur.',
  },
  {
    path: '/entrainement/mots',
    icon: '📡',
    title: 'Mots, codes Q et indicatifs',
    text: 'Passer du caractère isolé au groupe, avec le vrai vocabulaire du trafic télégraphique.',
  },
  {
    path: '/entrainement/lecture',
    icon: '👁️',
    title: 'Lecture visuelle',
    text: 'Sans son, pour réviser partout. Un complément, jamais un substitut à l’écoute.',
  },
  {
    path: '/outils/traducteur',
    icon: '🔁',
    title: 'Traducteur texte et morse',
    text: "Traduire dans les deux sens, écouter le résultat, et émettre en lumière avec la lampe du téléphone.",
  },
  {
    path: '/outils/enregistreur',
    icon: '🎙️',
    title: 'Enregistreur d’émission',
    text: "Manipuler librement et récupérer sa frappe en fichier audio et en texte, sans note ni consigne.",
  },
  {
    path: '/apprendre/principes',
    icon: '📐',
    title: 'Comprendre le morse',
    text: 'Les cinq règles de durée, la vitesse en mots par minute, Farnsworth et Koch expliqués.',
  },
  {
    path: '/apprendre/alphabet-otan',
    icon: '🗣️',
    title: 'Alphabet OTAN',
    text: "Alfa, Bravo, Charlie… l’épellation à la voix, avec un outil pour dicter et un exercice.",
  },
  {
    path: '/apprendre/histoire',
    icon: '📜',
    title: 'Histoire du morse',
    text: 'De Chappe au GMDSS : pourquoi le code a exactement cette forme, et pourquoi il survit.',
  },
  {
    path: '/apprendre/alphabet',
    icon: '🔤',
    title: 'Alphabet et lexique',
    text: 'Lettres, chiffres, ponctuation, accents et signaux de procédure. Chaque ligne est écoutable.',
  },
  {
    path: '/progression/statistiques',
    icon: '📊',
    title: 'Statistiques',
    text: 'Précision par caractère, points faibles du moment, historique des séries.',
  },
];

export function homeView(context: ViewContext): View {
  const { store } = context;
  const container = h('div', { class: 'stack' });

  const render = (): void => {
    const { progress, settings } = store;
    const started = progress.totals.sessions > 0;
    const charset = kochCharset(settings.kochOrder, progress.kochLevel);
    const unlocked = evaluateAchievements(progress).filter((status) => status.unlocked).length;

    container.replaceChildren(
      h(
        'div',
        { class: 'hero' },
        h('div', { class: 'hero__body' },
          h('h2', { class: 'hero__title', text: started ? 'Reprenons' : 'Apprendre le morse, vraiment' }),
          h('p', { class: 'hero__text' },
            started
              ? `Vous travaillez ${charset.length} caractères sur ${kochMaxLevel(settings.kochOrder)}, ` +
                `avec ${formatPercent(overallAccuracy(progress))} de précision sur ` +
                `${formatNumber(progress.totals.attempts)} réponses. Continuez là où vous en étiez.`
              : "Ce site vous apprend à reconnaître le morse à l'oreille, pas à déchiffrer des points et " +
                'des traits sur une feuille. La différence est énorme, et elle se joue dès la première séance : ' +
                'on commence tout de suite à vitesse réelle, avec deux caractères seulement.'),
          h(
            'div',
            { class: 'actions' },
            h('a', {
              class: 'btn btn--primary btn--lg',
              href: '#/entrainement/ecoute',
              text: started ? 'Reprendre l’entraînement' : 'Commencer maintenant',
            }),
            h('a', {
              class: 'btn',
              href: '#/apprendre/principes',
              text: started ? 'Revoir les principes' : 'Comprendre d’abord',
            }),
          ),
        ),
      ),

      started
        ? h(
            'div',
            { class: 'metrics' },
            h('div', { class: 'metric metric--card' },
              h('span', { class: 'metric__value', text: `${progress.kochLevel}` }),
              h('span', { class: 'metric__label', text: 'Niveau Koch' })),
            h('div', { class: 'metric metric--card' },
              h('span', { class: 'metric__value', text: formatPercent(overallAccuracy(progress)) }),
              h('span', { class: 'metric__label', text: 'Précision' })),
            h('div', { class: 'metric metric--card' },
              h('span', { class: 'metric__value', text: `${progress.streak.current} j` }),
              h('span', { class: 'metric__label', text: 'Série en cours' })),
            h('div', { class: 'metric metric--card' },
              h('span', { class: 'metric__value', text: formatDuration(progress.totals.trainingMs) }),
              h('span', { class: 'metric__label', text: 'Temps cumulé' })),
            h('div', { class: 'metric metric--card' },
              h('span', { class: 'metric__value', text: `${unlocked}` }),
              h('span', { class: 'metric__label', text: 'Succès obtenus' })),
          )
        : h(
            'section',
            { class: 'card' },
            h('h2', { class: 'card__title', text: 'Par où commencer' }),
            h(
              'ol',
              { class: 'steps' },
              h('li', {},
                h('strong', { text: 'Lisez les principes. ' }),
                'Dix minutes pour comprendre l’unité de temps, la vitesse en WPM et pourquoi il ne faut jamais ralentir les caractères.'),
              h('li', {},
                h('strong', { text: 'Lancez une série d’écoute. ' }),
                'Deux caractères, vingt-cinq questions. Répondez au son, sans réfléchir.'),
              h('li', {},
                h('strong', { text: 'Recommencez demain. ' }),
                'Quinze minutes par jour battent deux heures le dimanche : la reconnaissance auditive se consolide entre les séances.'),
            ),
          ),

      h(
        'div',
        { class: 'shortcuts' },
        ...SHORTCUTS.map((shortcut) =>
          h(
            'a',
            { class: 'shortcut', href: `#${shortcut.path}` },
            h('span', { class: 'shortcut__icon', text: shortcut.icon, attrs: { 'aria-hidden': 'true' } }),
            h('span', { class: 'shortcut__title', text: shortcut.title }),
            h('span', { class: 'shortcut__text', text: shortcut.text }),
          ),
        ),
      ),

      h(
        'section',
        { class: 'card card--muted' },
        h('h2', { class: 'card__title', text: 'Ce site fonctionne hors ligne' }),
        h('p', {},
          "Tout tourne dans votre navigateur : aucun compte, aucun serveur, aucune donnée qui sort de " +
          "l’appareil. Une fois la page visitée, elle reste disponible sans réseau, et vous pouvez " +
          "l’installer sur l’écran d’accueil de votre téléphone comme une application. Votre progression " +
          "s’exporte en JSON depuis la page Succès ou les Réglages."),
      ),
    );
  };

  render();
  const unsubscribe = store.subscribe(render);

  return { element: container, destroy: unsubscribe };
}
