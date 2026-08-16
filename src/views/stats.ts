/**
 * Page « Statistiques ».
 *
 * L'objectif n'est pas d'accumuler des chiffres mais de répondre à une seule
 * question : sur quoi dois-je travailler maintenant ? D'où la carte de chaleur
 * par caractère, placée avant l'historique.
 */

import { h, svg, formatNumber, formatDate } from '../ui/dom.ts';
import {
  activityByDay,
  charAccuracy,
  charSpeed,
  formatDuration,
  formatPercent,
  MODE_LABELS,
  overallAccuracy,
  weakestChars,
} from '../core/progress.ts';
import { kochCharset, kochMaxLevel, getKochOrder } from '../core/koch.ts';
import { prettyCode, encodeChar } from '../core/morse.ts';
import type { View, ViewContext } from '../ui/router.ts';

/** Couleur d'une case de la carte de chaleur, du rouge au vert. */
function accuracyClass(accuracy: number | null): string {
  if (accuracy === null) return 'heat--none';
  if (accuracy >= 0.95) return 'heat--excellent';
  if (accuracy >= 0.85) return 'heat--good';
  if (accuracy >= 0.7) return 'heat--fair';
  return 'heat--poor';
}

export function statsView(context: ViewContext): View {
  const { store } = context;
  const container = h('div', { class: 'stack' });

  const render = (): void => {
    const { progress, settings } = store;
    const order = getKochOrder(settings.kochOrder);
    const charset = kochCharset(settings.kochOrder, progress.kochLevel);
    const weak = weakestChars(progress, charset, 5);
    const activity = activityByDay(progress, 30);
    const maxActivity = Math.max(1, ...activity.map((day) => day.count));

    const metrics = h(
      'div',
      { class: 'metrics' },
      h('div', { class: 'metric metric--card' },
        h('span', { class: 'metric__value', text: `${progress.kochLevel}/${kochMaxLevel(settings.kochOrder)}` }),
        h('span', { class: 'metric__label', text: 'Niveau Koch' })),
      h('div', { class: 'metric metric--card' },
        h('span', { class: 'metric__value', text: formatPercent(overallAccuracy(progress)) }),
        h('span', { class: 'metric__label', text: 'Précision globale' })),
      h('div', { class: 'metric metric--card' },
        h('span', { class: 'metric__value', text: formatNumber(progress.totals.attempts) }),
        h('span', { class: 'metric__label', text: 'Réponses' })),
      h('div', { class: 'metric metric--card' },
        h('span', { class: 'metric__value', text: formatNumber(progress.totals.sent) }),
        h('span', { class: 'metric__label', text: 'Caractères émis' })),
      h('div', { class: 'metric metric--card' },
        h('span', { class: 'metric__value', text: formatDuration(progress.totals.trainingMs) }),
        h('span', { class: 'metric__label', text: 'Temps cumulé' })),
      h('div', { class: 'metric metric--card' },
        h('span', { class: 'metric__value', text: `${progress.streak.current} j` }),
        h('span', { class: 'metric__label', text: `Série en cours (record ${progress.streak.longest})` })),
    );

    // --- Carte de chaleur ---
    const heatmap = h(
      'div',
      { class: 'heatmap' },
      ...charset.map((char) => {
        const accuracy = charAccuracy(progress, char);
        const speed = charSpeed(progress, char);
        const attempts = progress.chars[char]?.attempts ?? 0;
        return h(
          'div',
          {
            class: `heat ${accuracyClass(accuracy)}`,
            title:
              attempts === 0
                ? `${char} — jamais testé`
                : `${char} (${prettyCode(encodeChar(char) ?? '')}) — ${formatPercent(accuracy)} sur ${attempts} réponses` +
                  (speed ? `, ${(speed / 1000).toFixed(1)} s en moyenne` : ''),
          },
          h('span', { class: 'heat__char', text: char }),
          h('span', { class: 'heat__value', text: attempts === 0 ? '—' : formatPercent(accuracy) }),
        );
      }),
    );

    // --- Activité ---
    const barWidth = 100 / activity.length;
    const chart = svg(
      'svg',
      {
        class: 'chart',
        viewBox: '0 0 100 32',
        preserveAspectRatio: 'none',
        role: 'img',
        'aria-label': `Activité des trente derniers jours, ${progress.sessions.length} séries enregistrées`,
      },
      ...activity.map((day, index) => {
        const height = (day.count / maxActivity) * 28;
        return svg('rect', {
          x: index * barWidth + barWidth * 0.15,
          y: 30 - height,
          width: barWidth * 0.7,
          height: Math.max(day.count > 0 ? 1.2 : 0.4, height),
          rx: 0.6,
          class: day.count > 0 ? 'chart__bar' : 'chart__bar chart__bar--empty',
        });
      }),
    );

    // --- Historique ---
    const history = progress.sessions.slice(0, 15);
    const historyTable =
      history.length === 0
        ? h('p', { class: 'empty', text: "Aucune série enregistrée pour l'instant." })
        : h(
            'div',
            { class: 'table-wrap' },
            h(
              'table',
              { class: 'data-table' },
              h('thead', {},
                h('tr', {},
                  h('th', { attrs: { scope: 'col' }, text: 'Date' }),
                  h('th', { attrs: { scope: 'col' }, text: 'Exercice' }),
                  h('th', { attrs: { scope: 'col' }, text: 'Score' }),
                  h('th', { attrs: { scope: 'col' }, text: 'Précision' }),
                  h('th', { attrs: { scope: 'col' }, text: 'Vitesse' }))),
              h(
                'tbody',
                {},
                ...history.map((session) =>
                  h('tr', {},
                    h('td', { text: formatDate(session.startedAt) }),
                    h('td', { text: MODE_LABELS[session.mode] }),
                    h('td', { class: 'num', text: `${session.correct}/${session.attempts}` }),
                    h('td', { class: 'num', text: formatPercent(session.correct / Math.max(1, session.attempts)) }),
                    h('td', { class: 'num', text: `${session.charWpm} WPM` })),
                ),
              ),
            ),
          );

    container.replaceChildren(
      metrics,
      h(
        'section',
        { class: 'card' },
        h('h2', { class: 'card__title', text: 'Où en est chaque caractère' }),
        h('p', { class: 'card__hint' },
          `Les ${charset.length} caractères de votre niveau actuel, dans l'ordre ${order.label}. ` +
          'Survolez une case pour le détail.'),
        heatmap,
        weak.length > 0
          ? h('p', { class: 'card__hint' },
              'Vos points faibles du moment : ',
              ...weak.map((entry, index) =>
                h('strong', { text: `${index > 0 ? ', ' : ''}${entry.char} (${formatPercent(entry.accuracy)})` }),
              ),
              ". Le mode Écoute propose une option pour insister dessus.")
          : h('p', { class: 'card__hint', text: 'Pas encore assez de réponses pour dégager des points faibles.' }),
      ),
      h(
        'section',
        { class: 'card' },
        h('h2', { class: 'card__title', text: 'Activité des trente derniers jours' }),
        chart,
        h('p', { class: 'card__hint' },
          `${formatNumber(progress.totals.sessions)} séries au total, ` +
          `${formatDuration(progress.totals.trainingMs)} d'entraînement cumulé. ` +
          'La régularité pèse bien plus lourd que la durée de chaque séance.'),
      ),
      h(
        'section',
        { class: 'card' },
        h('h2', { class: 'card__title', text: 'Dernières séries' }),
        historyTable,
      ),
    );
  };

  render();
  const unsubscribe = store.subscribe(render);

  return { element: container, destroy: unsubscribe };
}
