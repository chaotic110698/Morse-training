/**
 * Page « Succès ».
 *
 * Les succès sont un ressort d'assiduité, pas une monnaie : ils récompensent
 * la régularité et les paliers réellement significatifs en télégraphie
 * (vitesse propre, alphabet complet, première émission), et jamais le simple
 * fait de cliquer.
 */

import { h, formatDate } from '../ui/dom.ts';
import {
  ACHIEVEMENT_GROUPS,
  evaluateAchievements,
  formatAchievementValue,
} from '../core/achievements.ts';
import { buildSaveFile, downloadText, parseSaveFile } from '../core/storage.ts';
import type { View, ViewContext } from '../ui/router.ts';

export function achievementsView(context: ViewContext): View {
  const { store } = context;
  const container = h('div', { class: 'stack' });

  const exportSave = (): void => {
    const file = buildSaveFile(store.settings, store.progress);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadText(`morse-training-${stamp}.json`, JSON.stringify(file, null, 2));
    context.toast('Sauvegarde exportée.', 'success');
  };

  const importInput = h('input', {
    type: 'file',
    attrs: {
      accept: 'application/json,.json',
      hidden: 'true',
      'aria-label': 'Choisir un fichier de sauvegarde à importer',
    },
    on: {
      change: (event) => {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          const result = parseSaveFile(String(reader.result ?? ''));
          if (!result.ok || !result.settings || !result.progress) {
            context.toast(result.message, 'error');
            return;
          }
          store.replaceState(result.settings, result.progress);
          context.toast('Sauvegarde importée.', 'success');
        });
        reader.readAsText(file);
        input.value = '';
      },
    },
  });

  const render = (): void => {
    const statuses = evaluateAchievements(store.progress);
    const unlocked = statuses.filter((status) => status.unlocked).length;

    const groups = ACHIEVEMENT_GROUPS.map((group) => {
      const entries = statuses.filter((status) => status.achievement.group === group.id);
      return h(
        'section',
        { class: 'card' },
        h('h2', { class: 'card__title', text: group.label }),
        h(
          'div',
          { class: 'achievements' },
          ...entries.map((status) =>
            h(
              'article',
              {
                class: `achievement achievement--${status.achievement.tier}${status.unlocked ? ' is-unlocked' : ''}`,
              },
              h('span', { class: 'achievement__icon', text: status.achievement.icon, attrs: { 'aria-hidden': 'true' } }),
              h(
                'div',
                { class: 'achievement__body' },
                h('h3', { class: 'achievement__name', text: status.achievement.name }),
                h('p', { class: 'achievement__description', text: status.achievement.description }),
                h(
                  'div',
                  { class: 'achievement__meter' },
                  h('div', {
                    class: 'achievement__meter-fill',
                    style: { width: `${status.ratio * 100}%` },
                  }),
                ),
                h(
                  'p',
                  { class: 'achievement__status' },
                  formatAchievementValue(status),
                  status.unlockedAt
                    ? h('span', { class: 'achievement__date', text: ` · obtenu le ${formatDate(status.unlockedAt)}` })
                    : null,
                ),
              ),
            ),
          ),
        ),
      );
    });

    container.replaceChildren(
      h(
        'div',
        { class: 'hero hero--compact' },
        h('div', {},
          h('h2', { class: 'hero__title', text: `${unlocked} succès sur ${statuses.length}` }),
          h('p', { class: 'hero__text' },
            "Tout est stocké dans ce navigateur uniquement. Exportez un fichier JSON pour conserver votre " +
            "progression ou la transférer sur un autre appareil.")),
        h(
          'div',
          { class: 'actions' },
          h('button', { class: 'btn btn--primary', type: 'button', text: 'Exporter en JSON', on: { click: exportSave } }),
          h('button', {
            class: 'btn',
            type: 'button',
            text: 'Importer une sauvegarde',
            on: { click: () => importInput.click() },
          }),
          importInput,
        ),
      ),
      ...groups,
    );
  };

  render();
  const unsubscribe = store.subscribe(render);

  return { element: container, destroy: unsubscribe };
}
