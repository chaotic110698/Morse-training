/**
 * Copie suivie : un texte entier, à l'oreille, écrit au fil de l'eau.
 *
 * C'est la compétence finale du morse, et c'était le trou du site. L'écoute
 * Koch entraîne le caractère isolé, les mots entraînent le groupe, le mode
 * histoire fait copier de vrais messages — mais dix-huit fois seulement, et
 * sur des textes écrits d'avance.
 *
 * Ce que cet exercice ajoute tient en un mot : **la distance**. Copier
 * quarante mots demande d'écrire une lettre pendant que la suivante arrive et
 * de garder deux ou trois caractères dans la tête. Celui qui s'arrête sur ce
 * qu'il a manqué perd tout le reste, et c'est précisément ce qu'on vient
 * apprendre ici.
 *
 * La comparaison est celle du mode histoire — un alignement par distance
 * d'édition, pour qu'une lettre manquée au début ne fasse pas passer toute la
 * ligne pour fausse.
 */

import { h, setChildren, formatNumber } from '../ui/dom.ts';
import { SignalLamp } from '../ui/lamp.ts';
import { MorsePlayer } from '../ui/player.ts';
import { SessionTracker } from '../ui/session.ts';
import { createAnnonce } from '../ui/annonce.ts';
import { compareCopy, type CopyMark } from '../core/copie.ts';
import { COPY_CORPORA, corpusById } from '../data/copie.ts';
import { drawKochChars, kochCharset, kochMaxLevel } from '../core/koch.ts';
import { sequenceDuration } from '../core/timing.ts';
import { formatPercent } from '../core/progress.ts';
import type { View, ViewContext } from '../ui/router.ts';

/** Groupes de cinq caractères, tirés du niveau du joueur. */
function groupes(charset: string[], nombre: number): string {
  const tirage = drawKochChars(charset, nombre * 5, 1.6, { avoid: 1 });
  const mots: string[] = [];
  for (let index = 0; index < tirage.length; index += 5) {
    mots.push(tirage.slice(index, index + 5).join(''));
  }
  return mots.join(' ');
}

export function copieView(context: ViewContext): View {
  const { store } = context;
  const lamp = new SignalLamp('Signal');
  const player = new MorsePlayer(store, lamp);
  const annonce = createAnnonce();

  let corpusId = COPY_CORPORA[0]?.id ?? 'groupes';
  let texte = '';
  let ecoutes = 0;
  let compare = false;
  /** Durée de lecture du texte courant, pour situer le temps par caractère. */
  let dureeMs = 0;

  const charset = (): string[] =>
    kochCharset(store.settings.kochOrder, Math.min(store.progress.kochLevel, kochMaxLevel(store.settings.kochOrder)));

  // --- Éléments -----------------------------------------------------------

  const corpusSelect = h(
    'select',
    {
      class: 'select',
      attrs: { 'aria-label': 'Type de texte' },
      on: {
        change: (event) => {
          corpusId = (event.target as HTMLSelectElement).value;
          nouveauTexte();
        },
      },
    },
    ...COPY_CORPORA.map((corpus) =>
      h('option', { value: corpus.id, text: corpus.label, attrs: { selected: corpus.id === corpusId } }),
    ),
  ) as HTMLSelectElement;

  const corpusHint = h('p', { class: 'trainer__hint' });
  const etat = h('p', { class: 'copie__etat', attrs: { 'aria-live': 'polite' } });
  const notes = h('textarea', {
    class: 'input copie__notes',
    attrs: {
      placeholder: 'Écrivez ici, au fil de l’écoute…',
      spellcheck: 'false',
      autocapitalize: 'characters',
      autocomplete: 'off',
      rows: '4',
      'aria-label': 'Votre copie',
    },
  }) as HTMLTextAreaElement;
  const verdict = h('div', { class: 'copie__verdict' });

  const listenButton = h('button', {
    class: 'btn btn--primary btn--lg',
    type: 'button',
    text: 'Écouter',
    on: { click: () => void ecouter() },
  }) as HTMLButtonElement;

  const compareButton = h('button', {
    class: 'btn',
    type: 'button',
    text: 'Comparer',
    disabled: true,
    on: { click: () => comparer() },
  }) as HTMLButtonElement;

  const nextButton = h('button', {
    class: 'btn btn--ghost',
    type: 'button',
    text: 'Texte suivant',
    on: { click: () => nouveauTexte() },
  }) as HTMLButtonElement;

  // --- Déroulement --------------------------------------------------------

  const nouveauTexte = (): void => {
    player.stop();
    store.audio.stopNoise();
    const corpus = corpusById(corpusId);
    if (corpus.texts.length === 0) {
      texte = groupes(charset(), 5);
    } else {
      texte = corpus.texts[Math.floor(Math.random() * corpus.texts.length)] ?? '';
    }
    dureeMs = sequenceDuration(player.buildElements(texte)) * 1000;
    ecoutes = 0;
    compare = false;
    notes.value = '';
    verdict.replaceChildren();
    corpusHint.textContent = corpus.hint;
    refresh();
    notes.focus();
  };

  const refresh = (): void => {
    listenButton.textContent = ecoutes === 0 ? 'Écouter' : 'Réécouter';
    compareButton.disabled = ecoutes === 0 || compare;
    compareButton.classList.toggle('btn--primary', ecoutes > 0 && !compare);
    const mots = texte.replace(/\s+/g, ' ').trim().split(' ').length;
    const secondes = Math.round(dureeMs / 1000);
    const duree = secondes >= 90 ? `${Math.round(secondes / 60)} min` : `${secondes} s`;
    etat.textContent = compare
      ? 'Comparé. Passez au texte suivant quand vous voulez.'
      : ecoutes === 0
        ? `${mots} groupes, environ ${duree} à votre vitesse. Écoutez et écrivez en même temps : ` +
          'ne vous arrêtez jamais sur ce que vous avez manqué.'
        : `Écoute n° ${ecoutes}. Réécoutez autant que nécessaire — mais essayez de descendre à une seule.`;
  };

  const ecouter = async (): Promise<void> => {
    if (compare) return;
    player.stop();
    ecoutes += 1;
    refresh();
    void store.audio.startNoise();
    notes.focus();
    await player.play(texte);
    store.audio.stopNoise();
  };

  /**
   * Enregistre ce que la copie apprend sur chaque caractère.
   *
   * Une substitution est exactement une confusion — c'est même la meilleure
   * source qui soit, puisqu'elle survient en conditions réelles et non sur un
   * caractère isolé. Le temps par caractère est celui de la lecture, faute de
   * mieux : en copie suivie il n'existe pas de temps de réaction, et laisser
   * zéro fausserait la moyenne affichée dans les statistiques.
   */
  const enregistrer = (marks: CopyMark[], total: number): void => {
    const tracker = new SessionTracker(store, 'copie', total);
    tracker.start();
    const parCaractere = total > 0 ? dureeMs / total : 0;
    for (const mark of marks) {
      if (mark.kind === 'ok') tracker.record(mark.char, mark.char, true, parCaractere);
      else if (mark.kind === 'wrong') tracker.record(mark.char, mark.typed, false, parCaractere);
      else if (mark.kind === 'missing') tracker.record(mark.char, null, false, parCaractere);
    }
    tracker.commit(null);
  };

  const comparer = (): void => {
    if (compare || ecoutes === 0) return;
    compare = true;
    player.stop();
    store.audio.stopNoise();

    const resultat = compareCopy(notes.value, texte);
    const vitesse = store.settings.effectiveWpm;

    setChildren(verdict, [
      h('h3', { class: 'copie__titre', text: 'Ce qui a été envoyé' }),
      h(
        'p',
        { class: 'copie__diff' },
        ...resultat.marks.map((mark) => {
          if (mark.kind === 'ok') return h('span', { class: 'is-ok', text: mark.char });
          if (mark.kind === 'wrong') {
            return h('span', {
              class: 'is-ko',
              text: mark.char,
              title: `Vous avez écrit ${mark.typed}`,
            });
          }
          if (mark.kind === 'missing') return h('span', { class: 'is-manque', text: mark.char });
          if (mark.kind === 'space') return h('span', { class: 'copie__espace' });
          return h('span', { class: 'is-trop', text: mark.typed });
        }),
      ),
      h(
        'div',
        { class: 'summary__scores' },
        h('div', { class: 'metric' },
          h('span', { class: 'metric__value', text: formatPercent(resultat.ratio) }),
          h('span', { class: 'metric__label', text: 'Caractères justes' })),
        h('div', { class: 'metric' },
          h('span', { class: 'metric__value', text: `${resultat.correct}/${resultat.total}` }),
          h('span', { class: 'metric__label', text: 'Sur le message' })),
        h('div', { class: 'metric' },
          h('span', { class: 'metric__value', text: `${ecoutes}` }),
          h('span', { class: 'metric__label', text: ecoutes > 1 ? 'écoutes' : 'écoute' })),
        h('div', { class: 'metric' },
          h('span', { class: 'metric__value', text: `${vitesse}` }),
          h('span', { class: 'metric__label', text: 'mots/min' })),
      ),
      h('p', { class: 'card__hint' },
        resultat.perfect
          ? `Copie parfaite en ${ecoutes} écoute${ecoutes > 1 ? 's' : ''}. ` +
            'Si c’était facile, montez d’un cran la vitesse globale dans les réglages.'
          : 'Le vert est juste, le rouge est faux, le souligné vous a échappé et le barré est en trop. ' +
            'Les caractères qui reviennent en rouge sont ceux à travailler — la page Statistiques ' +
            'garde la trace de ce que vous confondez.'),
    ]);

    enregistrer(resultat.marks, resultat.total);
    annonce.dire(
      `Copie comparée : ${resultat.correct} caractères justes sur ${resultat.total}, ` +
      `soit ${formatPercent(resultat.ratio)}.`,
    );
    refresh();
  };

  // --- Assemblage ---------------------------------------------------------

  const element = h(
    'div',
    { class: 'trainer' },
    annonce.element,
    h('div', { class: 'toolbar' }, corpusSelect, lamp.element),
    corpusHint,
    etat,
    h('label', { class: 'copie__label', text: 'Votre copie' }),
    notes,
    h('div', { class: 'actions' }, listenButton, compareButton, nextButton),
    verdict,
    h(
      'details',
      { class: 'help' },
      h('summary', { text: 'Comment travailler ce mode' }),
      h('p', {},
        'Écrivez pendant que ça passe, jamais après. Gardez deux ou trois caractères de retard : ' +
        'c’est inconfortable au début et c’est exactement la compétence à acquérir. Une lettre ' +
        'manquée est une lettre manquée — laissez un trou et continuez.'),
      h('p', {},
        'Commencez par les groupes de cinq, qui ne se devinent pas, puis passez aux phrases quand ' +
        'la lettre isolée ne vous coûte plus rien. Les textes suivis viennent en dernier : leur ' +
        'difficulté n’est plus le code, c’est de tenir quarante mots sans décrocher.'),
      h('p', {},
        `Vous avez copié ${formatNumber(store.progress.totals.attempts)} caractères depuis le début, ` +
        'tous exercices confondus.'),
    ),
  );

  nouveauTexte();
  const unsubscribe = store.subscribe(() => {
    lamp.setEnabled(store.settings.visualSignal);
  });
  lamp.setEnabled(store.settings.visualSignal);

  return {
    element,
    destroy: () => {
      unsubscribe();
      annonce.destroy();
      player.stop();
      store.audio.stopNoise();
    },
  };
}
