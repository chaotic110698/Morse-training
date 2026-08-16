/** Page d'accueil : point d'entree et etat des lieux en un coup d'oeil. */

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
    title: 'Ecoute — methode Koch',
    text: "L'exercice central. Deux caracteres pour commencer, a pleine vitesse, puis un de plus des que vous etes fiable.",
  },
  {
    path: '/entrainement/emission',
    icon: '🔑',
    title: 'Emission au manipulateur',
    text: 'Manipulateur droit ou palettes iambiques, au doigt sur telephone ou au clavier sur ordinateur.',
  },
  {
    path: '/entrainement/mots',
    icon: '📡',
    title: 'Mots, codes Q et indicatifs',
    text: 'Passer du caractere isole au groupe, avec le vrai vocabulaire du trafic telegraphique.',
  },
  {
    path: '/entrainement/lecture',
    icon: '👁️',
    title: 'Lecture visuelle',
    text: 'Sans son, pour reviser partout. Un complement, jamais un substitut a l’ecoute.',
  },
  {
    path: '/apprendre/principes',
    icon: '📐',
    title: 'Comprendre le morse',
    text: 'Les cinq regles de duree, la vitesse en mots par minute, Farnsworth et Koch expliques.',
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
    text: 'Lettres, chiffres, ponctuation, accents et signaux de procedure. Chaque ligne est ecoutable.',
  },
  {
    path: '/progression/statistiques',
    icon: '📊',
    title: 'Statistiques',
    text: 'Precision par caractere, points faibles du moment, historique des series.',
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
              ? `Vous travaillez ${charset.length} caracteres sur ${kochMaxLevel(settings.kochOrder)}, ` +
                `avec ${formatPercent(overallAccuracy(progress))} de precision sur ` +
                `${formatNumber(progress.totals.attempts)} reponses. Continuez la ou vous en etiez.`
              : "Ce site vous apprend a reconnaitre le morse a l'oreille, pas a dechiffrer des points et " +
                'des traits sur une feuille. La difference est enorme, et elle se joue des la premiere seance : ' +
                'on commence tout de suite a vitesse reelle, avec deux caracteres seulement.'),
          h(
            'div',
            { class: 'actions' },
            h('a', {
              class: 'btn btn--primary btn--lg',
              href: '#/entrainement/ecoute',
              text: started ? 'Reprendre l’entrainement' : 'Commencer maintenant',
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
              h('span', { class: 'metric__label', text: 'Precision' })),
            h('div', { class: 'metric metric--card' },
              h('span', { class: 'metric__value', text: `${progress.streak.current} j` }),
              h('span', { class: 'metric__label', text: 'Serie en cours' })),
            h('div', { class: 'metric metric--card' },
              h('span', { class: 'metric__value', text: formatDuration(progress.totals.trainingMs) }),
              h('span', { class: 'metric__label', text: 'Temps cumule' })),
            h('div', { class: 'metric metric--card' },
              h('span', { class: 'metric__value', text: `${unlocked}` }),
              h('span', { class: 'metric__label', text: 'Succes obtenus' })),
          )
        : h(
            'section',
            { class: 'card' },
            h('h2', { class: 'card__title', text: 'Par ou commencer' }),
            h(
              'ol',
              { class: 'steps' },
              h('li', {},
                h('strong', { text: 'Lisez les principes. ' }),
                'Dix minutes pour comprendre l’unite de temps, la vitesse en WPM et pourquoi il ne faut jamais ralentir les caracteres.'),
              h('li', {},
                h('strong', { text: 'Lancez une serie d’ecoute. ' }),
                'Deux caracteres, vingt-cinq questions. Repondez au son, sans reflechir.'),
              h('li', {},
                h('strong', { text: 'Recommencez demain. ' }),
                'Quinze minutes par jour battent deux heures le dimanche : la reconnaissance auditive se consolide entre les seances.'),
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
          "Tout tourne dans votre navigateur : aucun compte, aucun serveur, aucune donnee qui sort de " +
          "l’appareil. Une fois la page visitee, elle reste disponible sans reseau, et vous pouvez " +
          "l’installer sur l’ecran d’accueil de votre telephone comme une application. Votre progression " +
          "s’exporte en JSON depuis la page Succes ou les Reglages."),
      ),
    );
  };

  render();
  const unsubscribe = store.subscribe(render);

  return { element: container, destroy: unsubscribe };
}
