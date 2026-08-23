/**
 * Page « Licence ».
 *
 * Le hub de la formation. Le reste du site parle de morse ; cette section parle
 * du certificat d'opérateur, et les vingt-trois pages qu'elle contient ne
 * peuvent pas cohabiter dans un menu latéral sans le rendre illisible. Elles
 * vivent donc ici, groupées dans l'ordre où on les lit, avec le nombre de
 * questions disponibles et le résultat obtenu quand il y en a un.
 */

import { h } from '../ui/dom.ts';
import { SYLLABUS } from '../data/licence-syllabus.ts';
import { ROUTES } from './routes.ts';
import { EXAM_LABELS, EXAMS, QUESTIONS } from '../data/quiz.ts';
import { poolStats } from '../core/quiz.ts';
import { formatPercent } from '../core/progress.ts';
import type { View, ViewContext } from '../ui/router.ts';

const routeFor = (path: string) => ROUTES.find((route) => route.path === path);

export function licenceHubView(context: ViewContext): View {
  const { store } = context;
  const stats = poolStats(QUESTIONS);
  const quiz = store.progress.quiz;
  const runs = quiz?.runs ?? [];

  /** Meilleur résultat obtenu sur une épreuve, toutes séries confondues. */
  const bestFor = (exam: string): number | null => {
    const scores = Object.entries(quiz?.best ?? {})
      .filter(([key]) => key.startsWith(`${exam}|`))
      .map(([, ratio]) => ratio);
    return scores.length > 0 ? Math.max(...scores) : null;
  };

  const element = h(
    'div',
    { class: 'stack' },

    h(
      'article',
      { class: 'prose prose--tight' },
      h('p', { class: 'prose__lead' },
        'Émettre demande une autorisation, et cette autorisation s’obtient par un examen. Cette section ' +
        'rassemble le cours complet des deux épreuves, les calculateurs qui vont avec, et un ' +
        'questionnaire de ',
        h('strong', { text: `${stats.total} questions` }),
        ' pour se tester. Le reste du site reste consacré au morse — qui, lui, ne s’examine plus.'),
    ),

    // --- Reprendre ---
    runs.length > 0
      ? h(
          'section',
          { class: 'card card--accent' },
          h('h2', { class: 'card__title', text: 'Où vous en êtes' }),
          h(
            'div',
            { class: 'hub-scores' },
            ...EXAMS.map((exam) => {
              const best = bestFor(exam);
              return h(
                'div',
                { class: 'hub-score' },
                h('span', { class: 'hub-score__label', text: EXAM_LABELS[exam] }),
                h('span', {
                  class: `hub-score__value${best !== null && best >= 0.5 ? ' hub-score__value--pass' : ''}`,
                  text: best === null ? '—' : formatPercent(best),
                }),
                h('span', {
                  class: 'hub-score__note',
                  text: best === null
                    ? 'jamais tenté'
                    : best >= 0.5
                      ? 'meilleure série au-dessus de la moyenne'
                      : 'meilleure série sous la moyenne',
                }),
              );
            }),
          ),
          h('p', { class: 'card__hint' },
            `${runs.length} série${runs.length > 1 ? 's' : ''} déjà passée${runs.length > 1 ? 's' : ''}. ` +
            'La révision ciblée réinterroge en priorité ce que vous avez raté.'),
          h(
            'div',
            { class: 'actions' },
            h('a', { class: 'btn btn--primary', href: '#/licence/questionnaire', text: 'Reprendre le questionnaire' }),
          ),
        )
      : null,

    // --- Les blocs du parcours ---
    ...SYLLABUS.map((block) =>
      h(
        'section',
        { class: 'card' },
        h(
          'div',
          { class: 'hub-block__head' },
          h('span', { class: 'hub-block__icon', text: block.icon, attrs: { 'aria-hidden': 'true' } }),
          h(
            'div',
            {},
            h('h2', { class: 'card__title', text: block.title }),
            h('p', { class: 'card__hint', text: block.intent }),
          ),
        ),
        h(
          'ol',
          { class: 'hub-list' },
          ...block.paths.map((path, index) => {
            const route = routeFor(path);
            if (!route) return null;
            return h(
              'li',
              { class: 'hub-item' },
              h(
                'a',
                { class: 'hub-link', href: `#${path}` },
                h('span', { class: 'hub-link__rank', text: String(index + 1) }),
                h('span', { class: 'hub-link__icon', text: route.icon, attrs: { 'aria-hidden': 'true' } }),
                h(
                  'span',
                  { class: 'hub-link__body' },
                  h('span', { class: 'hub-link__label', text: route.label }),
                  h('span', { class: 'hub-link__note', text: route.description }),
                ),
              ),
            );
          }),
        ),
      ),
    ),

    h(
      'section',
      { class: 'card card--muted' },
      h('h2', { class: 'card__title', text: 'Comment aborder cette section' }),
      h('p', {},
        'Les chapitres se lisent dans l’ordre — chacun renvoie au suivant en bas de page — mais chacun ' +
        'se tient seul. Une lecture ne suffit pas : le questionnaire dit en quelques minutes ce qu’une ' +
        'relecture ne dit jamais, et chaque erreur renvoie vers le chapitre à revoir.'),
      h('p', { class: 'field__hint' },
        'Ce site n’est ni affilié au radio-club de la Haute Île, ni à l’ANFR. Les informations ' +
        'réglementaires peuvent changer : en cas de doute, les textes officiels font foi.'),
    ),
  );

  return { element };
}
