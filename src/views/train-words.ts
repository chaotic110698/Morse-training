/**
 * Exercice de copie de mots, abreviations, codes Q et indicatifs.
 *
 * Passer du caractere isole au groupe est la vraie difficulte du morse : il
 * faut retenir le debut pendant qu'arrive la suite. Les indicatifs et les
 * groupes aleatoires sont volontairement proposes, car ils interdisent toute
 * anticipation par le sens.
 */

import { h, setChildren } from '../ui/dom.ts';
import { SignalLamp } from '../ui/lamp.ts';
import { MorsePlayer } from '../ui/player.ts';
import { SessionTracker } from '../ui/session.ts';
import { drawVocabulary, VOCABULARY_SETS, type VocabularyEntry } from '../data/vocabulary.ts';
import { formatPercent } from '../core/progress.ts';
import { prettyCode, encodeChar } from '../core/morse.ts';
import type { View, ViewContext } from '../ui/router.ts';

export function wordsView(context: ViewContext): View {
  const { store } = context;
  const lamp = new SignalLamp('Signal');
  const player = new MorsePlayer(store, lamp);

  let setId = 'abbreviations';
  let entry: VocabularyEntry | null = null;
  let answered = false;
  let readyAt = 0;
  let tracker = new SessionTracker(store, 'words', 10);

  const display = h('div', { class: 'display display--word' });
  const progressBar = h('div', { class: 'progress__fill' });
  const progressLabel = h('span', { class: 'progress__label' });
  const summary = h('div', { class: 'summary' });

  const input = h('input', {
    class: 'input input--answer',
    type: 'text',
    attrs: {
      placeholder: 'Ce que vous avez copie',
      autocomplete: 'off',
      autocorrect: 'off',
      autocapitalize: 'characters',
      spellcheck: 'false',
      'aria-label': 'Votre reponse',
    },
    on: {
      keydown: (event) => {
        if ((event as KeyboardEvent).key === 'Enter') {
          event.preventDefault();
          if (answered) nextItem();
          else validate();
        }
      },
    },
  });

  const setSelect = h(
    'select',
    {
      class: 'select',
      attrs: { 'aria-label': "Jeu d'entrainement" },
      on: {
        change: (event) => {
          setId = (event.target as HTMLSelectElement).value;
          restart();
        },
      },
    },
    ...VOCABULARY_SETS.map((set) => h('option', { value: set.id, text: set.label })),
  );

  const setHint = h('p', { class: 'trainer__hint' });

  const playButton = h('button', {
    class: 'btn btn--primary',
    type: 'button',
    text: 'Ecouter',
    on: { click: () => playCurrent() },
  });

  const validateButton = h('button', {
    class: 'btn',
    type: 'button',
    text: 'Valider',
    on: { click: () => (answered ? nextItem() : validate()) },
  });

  const revealButton = h('button', {
    class: 'btn btn--ghost',
    type: 'button',
    text: 'Je donne ma langue au chat',
    on: { click: () => reveal() },
  });

  const renderHint = (): void => {
    const set = VOCABULARY_SETS.find((candidate) => candidate.id === setId);
    setHint.textContent = set?.description ?? '';
  };

  const renderProgress = (): void => {
    const ratio = Math.min(1, tracker.count / tracker.target);
    progressBar.style.width = `${ratio * 100}%`;
    progressLabel.textContent = `${tracker.count} / ${tracker.target} · ${formatPercent(tracker.accuracy)}`;
  };

  const renderIdle = (): void => {
    display.className = 'display display--word';
    display.replaceChildren(
      h('p', { class: 'display__hint', text: 'Ecoutez, puis saisissez ce que vous avez copie.' }),
    );
  };

  const playCurrent = (): void => {
    if (!entry) return;
    player.stop();
    void player.play(entry.text, {
      onEnd: () => {
        readyAt = performance.now();
        input.focus();
      },
    });
  };

  const nextItem = (): void => {
    if (tracker.finished) {
      finish();
      return;
    }
    answered = false;
    entry = drawVocabulary(setId);
    input.value = '';
    input.disabled = false;
    validateButton.textContent = 'Valider';
    revealButton.disabled = false;
    renderIdle();
    playCurrent();
  };

  const showResult = (correct: boolean): void => {
    if (!entry) return;
    display.className = `display display--word ${correct ? 'display--ok' : 'display--error'}`;
    setChildren(display, [
      h('span', { class: 'display__word', text: entry.text }),
      h(
        'span',
        { class: 'display__codes' },
        ...[...entry.text].map((char) =>
          h('span', { class: 'display__codes-item', text: prettyCode(encodeChar(char) ?? '') }),
        ),
      ),
      entry.meaning ? h('p', { class: 'display__meaning', text: entry.meaning }) : null,
    ]);
  };

  const validate = (): void => {
    if (!entry || answered) return;
    answered = true;
    const answer = input.value.trim().toUpperCase();
    const correct = answer === entry.text.toUpperCase();
    const responseMs = readyAt === 0 ? 0 : performance.now() - readyAt;
    readyAt = 0;

    tracker.record(entry.text, answer || null, correct, responseMs);
    if (store.settings.uiSounds) store.audio.feedback(correct ? 'ok' : 'error');
    store.haptics.feedback(correct ? 'ok' : 'error');
    showResult(correct);
    input.disabled = true;
    validateButton.textContent = tracker.finished ? 'Voir le bilan' : 'Suivant';
    revealButton.disabled = true;
    renderProgress();
  };

  const reveal = (): void => {
    if (!entry || answered) return;
    answered = true;
    tracker.record(entry.text, null, false, 0);
    showResult(false);
    input.disabled = true;
    validateButton.textContent = tracker.finished ? 'Voir le bilan' : 'Suivant';
    revealButton.disabled = true;
    renderProgress();
  };

  const finish = (): void => {
    tracker.commit(null);
    const misses = tracker.entries.filter((item) => !item.correct);
    summary.replaceChildren(
      h(
        'div',
        { class: 'summary__scores' },
        h('div', { class: 'metric' },
          h('span', { class: 'metric__value', text: formatPercent(tracker.accuracy) }),
          h('span', { class: 'metric__label', text: 'Precision' })),
        h('div', { class: 'metric' },
          h('span', { class: 'metric__value', text: `${tracker.correct}/${tracker.count}` }),
          h('span', { class: 'metric__label', text: 'Copies exactes' })),
      ),
      misses.length > 0
        ? h(
            'ul',
            { class: 'summary__list' },
            ...misses.map((item) =>
              h('li', {},
                h('strong', { text: item.char }),
                ' — vous avez ecrit ',
                h('em', { text: item.answer ?? 'rien' })),
            ),
          )
        : h('p', { class: 'summary__misses summary__misses--clean', text: 'Copie parfaite sur toute la serie.' }),
      h('button', {
        class: 'btn btn--primary',
        type: 'button',
        text: 'Nouvelle serie',
        on: { click: () => restart() },
      }),
    );
  };

  const restart = (): void => {
    tracker.commit(null);
    tracker = new SessionTracker(store, 'words', 10);
    tracker.start();
    summary.replaceChildren();
    renderHint();
    renderProgress();
    nextItem();
  };

  renderHint();
  tracker.start();
  renderProgress();
  entry = drawVocabulary(setId);
  renderIdle();

  const element = h(
    'div',
    { class: 'trainer' },
    h('div', { class: 'toolbar' }, setSelect),
    setHint,
    h('div', { class: 'progress' }, progressBar, progressLabel),
    h('div', { class: 'trainer__stage' }, display, lamp.element),
    input,
    h('div', { class: 'actions' }, playButton, validateButton, revealButton),
    summary,
    h(
      'details',
      { class: 'help' },
      h('summary', { text: 'Comment aborder les groupes' }),
      h('p', {},
        "N’essayez pas de tout retenir en tete : notez au fur et a mesure, comme le font les operateurs. " +
        "La copie sur papier, ou ici dans le champ de saisie, libere la memoire de travail pour ecouter " +
        "la suite."),
      h('p', {},
        "Si vous perdez un caractere, laissez-le tomber et continuez. Un operateur experimente perd des " +
        "caracteres en permanence ; ce qui compte est de ne pas perdre le fil apres."),
      h('p', {},
        "Les indicatifs et les groupes aleatoires sont les exercices les plus durs, et les plus formateurs : " +
        "aucun mot ne peut etre devine, chaque caractere doit etre reellement entendu."),
    ),
  );

  return {
    element,
    destroy: () => {
      player.stop();
      tracker.commit(null);
    },
  };
}
