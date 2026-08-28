/**
 * Page d'accueil.
 *
 * Elle ne répète pas le menu. Le bandeau latéral porte déjà les vingt pages du
 * site, et les seize raccourcis qui vivaient ici n'étaient qu'un second menu,
 * plus long et moins fiable — il fallait penser à l'y ajouter. L'accueil dit
 * donc trois choses, et rien d'autre : ce qu'est ce site, où vous en êtes, et
 * par où reprendre.
 */

import { h } from '../ui/dom.ts';
import { formatDuration, formatPercent, overallAccuracy } from '../core/progress.ts';
import { evaluateAchievements } from '../core/achievements.ts';
import { encodeChar } from '../core/morse.ts';
import type { View, ViewContext } from '../ui/router.ts';

/**
 * L'appel général, en haut de la page.
 *
 * `CQ` est ce qu'un opérateur envoie quand il ne s'adresse à personne en
 * particulier : « à tous ceux qui écoutent ». C'est l'invitation même, et
 * c'est aussi ce que fait ce site. La ligne n'est pas une décoration : les
 * largeurs et les instants sont ceux du vrai code, à quinze mots par minute,
 * si bien que la lumière parcourt un authentique message.
 */
const APPEL = 'CQ';
/** Durée d'une unité, en millisecondes. Ces valeurs sont reprises telles quelles dans `components.css`. */
const UNITE_MS = 90;
/** Longueur du cycle : l'appel, puis le silence avant qu'il ne reparte. */
const CYCLE_MS = 6000;
/** Largeur d'une unité, en pixels. */
const UNITE_PX = 7;

function ligneDAppel(): HTMLElement {
  const segments: { on: boolean; unites: number }[] = [];
  const lettres = [...APPEL];

  lettres.forEach((lettre, rang) => {
    const code = encodeChar(lettre) ?? '';
    [...code].forEach((signe, position) => {
      if (position > 0) segments.push({ on: false, unites: 1 });
      segments.push({ on: true, unites: signe === '-' ? 3 : 1 });
    });
    if (rang < lettres.length - 1) segments.push({ on: false, unites: 3 });
  });

  let curseur = 0;
  const marques = segments.map((segment) => {
    const debut = curseur;
    curseur += segment.unites;
    if (!segment.on) {
      return h('span', { class: 'appel__silence', style: { width: `${segment.unites * UNITE_PX}px` } });
    }
    return h('span', {
      class: `appel__signe appel__signe--${segment.unites === 3 ? 'long' : 'court'}`,
      style: {
        width: `${segment.unites * UNITE_PX}px`,
        animationDelay: `${debut * UNITE_MS}ms`,
        animationDuration: `${CYCLE_MS}ms`,
      },
    });
  });

  return h('div', { class: 'appel', attrs: { 'aria-hidden': 'true' } }, ...marques);
}

export function homeView(context: ViewContext): View {
  const { store } = context;
  const container = h('div', { class: 'stack' });

  const render = (): void => {
    const { progress } = store;
    const started = progress.totals.sessions > 0;
    const unlocked = evaluateAchievements(progress).filter((status) => status.unlocked).length;

    /** Une mesure du bandeau de progression : un chiffre, un mot. */
    const mesure = (valeur: string, libelle: string): HTMLElement =>
      h('span', { class: 'bilan__item' },
        h('b', { class: 'bilan__valeur', text: valeur }),
        h('span', { class: 'bilan__libelle', text: libelle }));

    container.replaceChildren(
      h(
        'div',
        { class: 'hero' },
        h(
          'div',
          { class: 'hero__body' },
          ligneDAppel(),
          h('p', { class: 'appel__legende' },
            h('strong', { text: 'CQ' }),
            ' — l’appel général : à tous ceux qui écoutent.'),
          h('h2', { class: 'hero__title', text: started ? 'Reprenons' : 'Apprendre le morse, vraiment' }),
          h('p', { class: 'hero__text' },
            'Pendant cent cinquante ans, le morse s’est appris à l’oreille, dans les écoles de ' +
            'télégraphistes, avec un instructeur en face. Ce site est là pour que cet apprentissage ne ' +
            'dépende plus de personne : la méthode Koch complète, les exercices, le manipulateur et le ' +
            'cours, gratuitement, dans un navigateur.'),
          h('p', { class: 'hero__text' },
            'Aucun compte, aucun serveur, rien qui sorte de votre appareil — et tout fonctionne hors ' +
            'ligne, une fois la page visitée.'),
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
            'a',
            { class: 'bilan', href: '#/progression/statistiques' },
            mesure(String(progress.kochLevel), 'niveau'),
            mesure(formatPercent(overallAccuracy(progress)), 'précision'),
            mesure(`${progress.streak.current} j`, 'de suite'),
            mesure(formatDuration(progress.totals.trainingMs), 'cumulées'),
            mesure(String(unlocked), 'succès'),
            h('span', { class: 'bilan__suite', text: 'Tout voir →' }),
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
        'p',
        { class: 'accueil__pied' },
        'Le site s’installe sur l’écran d’accueil d’un téléphone comme une application, et votre ' +
        'progression s’exporte en JSON depuis les réglages. Tout le reste est dans le menu.',
      ),
    );
  };

  render();
  const unsubscribe = store.subscribe(render);

  return { element: container, destroy: unsubscribe };
}
