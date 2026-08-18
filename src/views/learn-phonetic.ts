/**
 * Page « Alphabet OTAN ».
 *
 * Référence, outil d'épellation et petit exercice réunis : l'alphabet
 * radiotéléphonique se retient en quelques séances, il n'appelle donc pas la
 * machinerie de progression du morse. Chaque lettre est aussi jouable en morse,
 * pour lier les deux alphabets plutôt que de les cloisonner.
 */

import { h, setChildren } from '../ui/dom.ts';
import { SignalLamp } from '../ui/lamp.ts';
import { MorsePlayer } from '../ui/player.ts';
import { encodeChar, prettyCode } from '../core/morse.ts';
import { elementsForCode } from '../core/timing.ts';
import {
  FRENCH_SPELLING,
  PHONETIC_ALL,
  PHONETIC_DIGITS,
  PHONETIC_LETTERS,
  spellPhonetic,
  type PhoneticEntry,
} from '../data/phonetic.ts';
import type { View, ViewContext } from '../ui/router.ts';

type Direction = 'symbol-to-word' | 'word-to-symbol';

const QUIZ_LENGTH = 20;

/** La synthèse vocale est un bonus : absente, la page reste complète. */
function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function speak(word: string): void {
  if (!speechAvailable()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

/** Tire `count` éléments distincts, en incluant toujours `required`. */
function pickChoices(pool: PhoneticEntry[], required: PhoneticEntry, count: number): PhoneticEntry[] {
  const others = pool.filter((entry) => entry.symbol !== required.symbol);
  const chosen: PhoneticEntry[] = [required];
  while (chosen.length < count && others.length > 0) {
    const index = Math.floor(Math.random() * others.length);
    const [entry] = others.splice(index, 1);
    if (entry) chosen.push(entry);
  }
  for (let i = chosen.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [chosen[i], chosen[j]] = [chosen[j] as PhoneticEntry, chosen[i] as PhoneticEntry];
  }
  return chosen;
}

export function phoneticView(context: ViewContext): View {
  const { store } = context;
  const lamp = new SignalLamp('Morse');
  const player = new MorsePlayer(store, lamp);

  // --- Table de référence ---

  const playMorse = (symbol: string): void => {
    const code = encodeChar(symbol);
    if (!code) return;
    player.stop();
    void player.playElements(elementsForCode(code, store.timing, symbol, 0));
  };

  const entryCard = (entry: PhoneticEntry): HTMLElement => {
    const code = encodeChar(entry.symbol) ?? '';
    return h(
      'li',
      { class: 'phonetic__item' },
      h('span', { class: 'phonetic__symbol', text: entry.symbol }),
      h(
        'div',
        { class: 'phonetic__body' },
        h('span', { class: 'phonetic__word', text: entry.word }),
        h('span', { class: 'phonetic__say', text: entry.say }),
      ),
      h(
        'div',
        { class: 'phonetic__actions' },
        h('button', {
          class: 'phonetic__code',
          type: 'button',
          text: prettyCode(code),
          title: `Écouter ${entry.symbol} en morse`,
          attrs: { 'aria-label': `Écouter ${entry.symbol} en morse` },
          on: { click: () => playMorse(entry.symbol) },
        }),
        speechAvailable()
          ? h('button', {
              class: 'phonetic__speak',
              type: 'button',
              text: '🔊',
              title: `Prononcer ${entry.word}`,
              attrs: { 'aria-label': `Prononcer ${entry.word}` },
              on: { click: () => speak(entry.word) },
            })
          : null,
      ),
      entry.note ? h('p', { class: 'phonetic__note', text: entry.note }) : null,
    );
  };

  const letterList = h('ul', { class: 'phonetic__grid' }, ...PHONETIC_LETTERS.map(entryCard));
  const digitList = h('ul', { class: 'phonetic__grid' }, ...PHONETIC_DIGITS.map(entryCard));

  // --- Épeler un texte ---

  const spellOutput = h('div', { class: 'phonetic__spelled' });
  const spellInput = h('input', {
    class: 'input',
    type: 'text',
    attrs: {
      placeholder: 'Un indicatif, un nom, une référence… par exemple F5ABC',
      'aria-label': 'Texte à épeler',
      autocapitalize: 'characters',
      autocomplete: 'off',
      spellcheck: 'false',
    },
    on: { input: () => renderSpelled() },
  });

  const renderSpelled = (): void => {
    const value = spellInput.value.trim();
    if (!value) {
      setChildren(spellOutput, [
        h('span', { class: 'phonetic__spelled-empty', text: 'L’épellation s’affichera ici.' }),
      ]);
      spellCopy.disabled = true;
      return;
    }
    const table = new Map(PHONETIC_ALL.map((entry) => [entry.symbol, entry]));
    setChildren(
      spellOutput,
      [...value.toUpperCase()].map((char) => {
        if (char === ' ') return h('span', { class: 'phonetic__spelled-gap', text: '/' });
        const entry = table.get(char);
        if (!entry) return h('span', { class: 'phonetic__spelled-unknown', text: char });
        return h(
          'span',
          { class: 'phonetic__spelled-word' },
          h('strong', { text: entry.word.slice(0, 1) }),
          entry.word.slice(1),
        );
      }),
    );
    spellCopy.disabled = false;
  };

  const spellCopy = h('button', {
    class: 'btn btn--small',
    type: 'button',
    text: 'Copier',
    disabled: true,
    on: {
      click: async () => {
        try {
          await navigator.clipboard.writeText(spellPhonetic(spellInput.value));
          context.toast('Épellation copiée.', 'success');
        } catch {
          context.toast('La copie automatique a été refusée par le navigateur.', 'error');
        }
      },
    },
  });

  // --- Exercice ---

  let direction: Direction = 'symbol-to-word';
  let includeDigits = false;
  let current: PhoneticEntry | null = null;
  let answered = false;
  let asked = 0;
  let correct = 0;

  const quizPrompt = h('div', { class: 'display display--read' });
  const quizChoices = h('div', { class: 'quiz-choices' });
  const quizScore = h('span', { class: 'progress__label' });
  const quizBar = h('div', { class: 'progress__fill' });
  const quizSummary = h('div', { class: 'summary' });

  const pool = (): PhoneticEntry[] => (includeDigits ? PHONETIC_ALL : PHONETIC_LETTERS);

  const renderScore = (): void => {
    quizBar.style.width = `${Math.min(1, asked / QUIZ_LENGTH) * 100}%`;
    quizScore.textContent = asked
      ? `${asked} / ${QUIZ_LENGTH} · ${Math.round((correct / asked) * 100)} %`
      : `Série de ${QUIZ_LENGTH} questions`;
  };

  const nextQuestion = (): void => {
    if (asked >= QUIZ_LENGTH) {
      finishQuiz();
      return;
    }
    const set = pool();
    let candidate = current;
    for (let attempt = 0; attempt < 5 && candidate === current; attempt += 1) {
      candidate = set[Math.floor(Math.random() * set.length)] ?? null;
    }
    current = candidate;
    answered = false;
    if (!current) return;

    quizPrompt.className = 'display display--read';
    setChildren(quizPrompt, [
      direction === 'symbol-to-word'
        ? h('span', { class: 'display__char', text: current.symbol })
        : h('span', { class: 'display__word', text: current.word }),
      h('p', {
        class: 'display__hint',
        text: direction === 'symbol-to-word' ? 'Quel mot d’épellation ?' : 'Quelle lettre ?',
      }),
    ]);

    const choices = pickChoices(set, current, 4);
    setChildren(
      quizChoices,
      choices.map((choice) =>
        h('button', {
          class: 'quiz-choices__item',
          type: 'button',
          text: direction === 'symbol-to-word' ? choice.word : choice.symbol,
          data: { symbol: choice.symbol },
          on: { click: () => answer(choice) },
        }),
      ),
    );
  };

  const answer = (choice: PhoneticEntry): void => {
    if (!current || answered) return;
    answered = true;
    const isRight = choice.symbol === current.symbol;
    asked += 1;
    if (isRight) correct += 1;

    for (const button of quizChoices.querySelectorAll<HTMLElement>('[data-symbol]')) {
      const symbol = button.dataset['symbol'];
      if (symbol === current.symbol) button.classList.add('is-ok');
      else if (symbol === choice.symbol) button.classList.add('is-error');
      button.setAttribute('disabled', '');
    }

    if (store.settings.uiSounds) store.audio.feedback(isRight ? 'ok' : 'error');
    store.haptics.feedback(isRight ? 'ok' : 'error');

    quizPrompt.className = `display display--read ${isRight ? 'display--ok' : 'display--error'}`;
    setChildren(quizPrompt, [
      h('span', { class: 'display__char', text: current.symbol }),
      h('span', { class: 'display__word', text: current.word }),
      h('p', { class: 'display__hint', text: current.say }),
    ]);
    if (!isRight) speak(current.word);

    renderScore();
    window.setTimeout(() => nextQuestion(), isRight ? 700 : 1400);
  };

  const finishQuiz = (): void => {
    current = null;
    setChildren(quizPrompt, [
      h('p', { class: 'display__hint', text: 'Série terminée.' }),
    ]);
    quizChoices.replaceChildren();
    setChildren(quizSummary, [
      h(
        'div',
        { class: 'summary__scores' },
        h('div', { class: 'metric' },
          h('span', { class: 'metric__value', text: `${Math.round((correct / Math.max(1, asked)) * 100)} %` }),
          h('span', { class: 'metric__label', text: 'Précision' })),
        h('div', { class: 'metric' },
          h('span', { class: 'metric__value', text: `${correct}/${asked}` }),
          h('span', { class: 'metric__label', text: 'Bonnes réponses' })),
      ),
      h('button', {
        class: 'btn btn--primary',
        type: 'button',
        text: 'Nouvelle série',
        on: { click: () => restartQuiz() },
      }),
    ]);
  };

  const restartQuiz = (): void => {
    asked = 0;
    correct = 0;
    current = null;
    quizSummary.replaceChildren();
    renderScore();
    nextQuestion();
  };

  const directionToggle = h(
    'div',
    { class: 'segmented', attrs: { role: 'group', 'aria-label': 'Sens de la question' } },
    ...(
      [
        ['symbol-to-word', 'Lettre → mot'],
        ['word-to-symbol', 'Mot → lettre'],
      ] as const
    ).map(([value, label]) =>
      h('button', {
        class: `segmented__item${direction === value ? ' is-active' : ''}`,
        type: 'button',
        text: label,
        data: { direction: value },
        on: {
          click: () => {
            direction = value;
            for (const button of directionToggle.querySelectorAll<HTMLElement>('[data-direction]')) {
              button.classList.toggle('is-active', button.dataset['direction'] === value);
            }
            restartQuiz();
          },
        },
      }),
    ),
  );

  const digitsToggle = h(
    'label',
    { class: 'switch' },
    h('input', {
      type: 'checkbox',
      on: {
        change: (event) => {
          includeDigits = (event.target as HTMLInputElement).checked;
          restartQuiz();
        },
      },
    }),
    h('span', { text: 'Inclure les chiffres' }),
  );

  renderSpelled();
  renderScore();
  nextQuestion();

  const element = h(
    'div',
    { class: 'stack' },

    h(
      'article',
      { class: 'prose prose--tight' },
      h('p', { class: 'prose__lead' },
        "Quand la voix passe mais reste ambiguë, on épelle. L’alphabet radiotéléphonique international " +
        "— appelé alphabet OTAN, ou alphabet OACI dans l’aviation — remplace chaque lettre par un mot " +
        "choisi pour rester reconnaissable dans le bruit et par des locuteurs de toutes langues. " +
        "Il complète le morse plutôt qu’il ne le remplace : le morse sert quand le signal est trop " +
        "faible pour la voix, l’épellation quand la voix passe."),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Épeler un texte' }),
      h('div', { class: 'toolbar' }, spellInput, spellCopy),
      spellOutput,
      h('p', { class: 'card__hint' },
        "Pratique pour dicter un indicatif ou une référence. La barre oblique marque une séparation de mots."),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Les vingt-six lettres' }),
      h('p', { class: 'card__hint' },
        "La prononciation est transcrite pour un lecteur francophone. Touchez le code morse pour " +
        (speechAvailable() ? "l’entendre, et le haut-parleur pour entendre le mot." : "l’entendre.")),
      letterList,
      h('div', { class: 'demo-row' }, lamp.element,
        h('p', { class: 'prose__note', text: 'La diode suit le morse joué depuis le tableau.' })),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Les chiffres' }),
      h('p', { class: 'card__hint' },
        "Quatre d’entre eux se prononcent volontairement de travers : la déformation les rend distincts " +
        "malgré une liaison médiocre."),
      digitList,
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'S’exercer' }),
      h('div', { class: 'toolbar' }, directionToggle, digitsToggle),
      h('div', { class: 'progress' }, quizBar, quizScore),
      quizPrompt,
      quizChoices,
      quizSummary,
    ),

    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'D’où vient cet alphabet' }),
      h('p', {},
        "Le besoin est né avec la radiotéléphonie militaire : à l’oreille et dans le bruit, B, D, P, T " +
        "et V se confondent, tout comme M et N ou F et S. Plusieurs alphabets se sont succédé, dont " +
        "le « Able Baker » anglo-américain de la Seconde Guerre mondiale, efficace mais taillé pour " +
        "des anglophones."),
      h('p', {},
        "L’alphabet actuel a été mis au point au début des années 1950 après des essais auprès de " +
        "locuteurs de nombreuses langues, pour que chaque mot reste reconnaissable quel que soit " +
        "l’accent. L’OACI l’a adopté dans sa forme définitive en 1956, et l’OTAN à sa suite — d’où le " +
        "nom sous lequel on le connaît, alors qu’il n’a rien de spécifiquement militaire."),
      h('p', {},
        "Deux graphies étonnent et ne doivent rien au hasard : « Alfa » plutôt qu’« Alpha », parce que " +
        "le groupe « ph » ne se lit pas /f/ dans toutes les langues, et « Juliett » avec deux t, pour " +
        "qu’un francophone ne laisse pas tomber la consonne finale."),

      h('h2', { text: 'Et l’épellation française' }),
      h('p', {},
        "En France, on épelle couramment au téléphone avec des prénoms. Cet usage n’a aucun statut " +
        "international et ne s’emploie pas en radio, mais il rend le même service dans la vie " +
        "quotidienne — et il est utile de ne pas confondre les deux."),
      h(
        'div',
        { class: 'phonetic__french' },
        ...FRENCH_SPELLING.map((entry) =>
          h('span', { class: 'phonetic__french-item' },
            h('strong', { text: entry.symbol }), ` ${entry.word}`),
        ),
      ),
    ),
  );

  return {
    element,
    destroy: () => {
      player.stop();
      if (speechAvailable()) window.speechSynthesis.cancel();
    },
  };
}
