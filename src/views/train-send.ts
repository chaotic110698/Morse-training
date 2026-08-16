/**
 * Exercice d'émission au manipulateur.
 *
 * L'opérateur produit lui-même le morse ; l'application décode ce qu'elle
 * reçoit et le compare à la consigne. Les deux écoles de manipulateur sont
 * disponibles à tout moment, en haut de la page, sans passer par les réglages :
 * beaucoup d'opérateurs pratiquent les deux et alternent selon l'humeur.
 */

import { h } from '../ui/dom.ts';
import { SignalLamp } from '../ui/lamp.ts';
import { MorsePlayer } from '../ui/player.ts';
import { KeyPad } from '../ui/keypad.ts';
import { SessionTracker } from '../ui/session.ts';
import { Keyer } from '../core/keyer.ts';
import { encodeChar, prettyCode } from '../core/morse.ts';
import { kochCharset } from '../core/koch.ts';
import { drawVocabulary } from '../data/vocabulary.ts';
import { formatPercent } from '../core/progress.ts';
import type { View, ViewContext } from '../ui/router.ts';
import type { ElementKind } from '../core/timing.ts';

type Drill = 'free' | 'chars' | 'words';

const DRILLS: Array<{ id: Drill; label: string; hint: string }> = [
  {
    id: 'free',
    label: 'Manipulation libre',
    hint: "Aucune consigne : émettez ce que vous voulez, l'application décode. Idéal pour se chauffer le poignet et régler sa vitesse.",
  },
  {
    id: 'chars',
    label: 'Caractères',
    hint: "Un caractère à émettre, tire de votre jeu Koch actuel. C'est l'exercice de base pour ancrer le geste.",
  },
  {
    id: 'words',
    label: 'Mots et abréviations',
    hint: "Un mot entier, avec ses silences inter-caractères. Beaucoup plus exigeant : le rythme d'ensemble compte autant que chaque signe.",
  },
];

export function sendView(context: ViewContext): View {
  const { store } = context;
  const lamp = new SignalLamp('Manipulateur');
  const player = new MorsePlayer(store, lamp);

  let drill: Drill = 'chars';
  let target = '';
  let expectedIndex = 0;
  let started = false;
  let attemptErrors = 0;
  /** Portion du code du caractère courant déjà frappée, en frappe indulgente. */
  let progress = '';
  let promptStartedAt = 0;
  const recent: string[] = [];
  let tracker = new SessionTracker(store, 'send', store.settings.sessionLength);

  const forgiving = (): boolean => store.settings.forgivingKeying;

  // --- Interface ---

  const promptChar = h('span', { class: 'display__char' });
  const promptCode = h('span', { class: 'display__code' });
  const promptHint = h('p', { class: 'display__hint' });
  const display = h('div', { class: 'display' }, promptChar, promptCode, promptHint);

  const tape = h('div', { class: 'tape', attrs: { 'aria-live': 'polite' } });
  const buffer = h('span', { class: 'tape__buffer' });
  const progressBar = h('div', { class: 'progress__fill' });
  const progressLabel = h('span', { class: 'progress__label' });
  const summary = h('div', { class: 'summary' });

  // --- Manipulateur ---

  const keyer = new Keyer(
    store.timing,
    {
      mode: store.settings.keyerMode,
      adaptive: store.settings.adaptiveKeying,
    },
    {
      onKeyDown: (kind) => {
        void store.audio.unlock();
        store.audio.startSidetone();
        lamp.on(kind);
        if (kind) store.haptics.pulse((kind === 'dit' ? store.timing.dit : store.timing.dah) * 1000);
        else store.haptics.hold();
        keypad.setActive(kind ?? null);
      },
      onKeyUp: () => {
        store.audio.stopSidetone();
        lamp.off();
        if (keyer.mode === 'straight') store.haptics.release();
        keypad.setActive(null);
      },
      onElement: (_kind: ElementKind, code: string) => {
        buffer.textContent = prettyCode(code);
        if (forgiving() && drill !== 'free') handleProgress(code);
      },
      onCharacter: (code, char) => {
        buffer.textContent = '';
        handleCharacter(code, char);
      },
      onWord: () => {
        if (drill === 'free') appendTape(' ', 'space');
      },
    },
  );

  const keypad = new KeyPad({
    keyer,
    getSettings: () => store.settings,
    onFirstTouch: () => void store.audio.unlock(),
  });

  // --- Sélecteurs ---

  const modeSelect = h(
    'select',
    {
      class: 'select',
      attrs: { 'aria-label': 'Type de manipulateur' },
      on: {
        change: (event) => {
          const value = (event.target as HTMLSelectElement).value as typeof store.settings.keyerMode;
          store.updateSettings({ keyerMode: value });
        },
      },
    },
    h('option', { value: 'straight', text: 'Manipulateur droit (une touche)' }),
    h('option', { value: 'paddle-single', text: 'Palettes — un élément par appui' }),
    h('option', { value: 'iambic-a', text: 'Palettes iambiques — mode A' }),
    h('option', { value: 'iambic-b', text: 'Palettes iambiques — mode B' }),
  );

  const modeNote = h('p', { class: 'trainer__hint trainer__hint--mode' });

  const forgivingToggle = h(
    'label',
    { class: 'switch' },
    h('input', {
      type: 'checkbox',
      on: {
        change: (event) =>
          store.updateSettings({ forgivingKeying: (event.target as HTMLInputElement).checked }),
      },
    }),
    h('span', { text: 'Frappe indulgente' }),
  );

  const swapToggle = h(
    'label',
    { class: 'switch' },
    h('input', {
      type: 'checkbox',
      on: {
        change: (event) => store.updateSettings({ swapPaddles: (event.target as HTMLInputElement).checked }),
      },
    }),
    h('span', { text: 'Inverser les palettes' }),
  );

  const drillSelect = h(
    'div',
    { class: 'segmented', attrs: { role: 'group', 'aria-label': "Type d'exercice" } },
    ...DRILLS.map((entry) =>
      h('button', {
        class: 'segmented__item',
        type: 'button',
        text: entry.label,
        data: { drill: entry.id },
        on: { click: () => setDrill(entry.id) },
      }),
    ),
  );

  const nextButton = h('button', {
    class: 'btn btn--primary',
    type: 'button',
    text: 'Consigne suivante',
    on: { click: () => nextPrompt() },
  });

  const listenButton = h('button', {
    class: 'btn',
    type: 'button',
    text: 'Écouter le modèle',
    on: {
      click: () => {
        if (!target) return;
        player.stop();
        void player.play(target);
      },
    },
  });

  const clearButton = h('button', {
    class: 'btn btn--ghost',
    type: 'button',
    text: 'Effacer',
    on: {
      click: () => {
        keyer.reset();
        buffer.textContent = '';
        tape.replaceChildren();
        expectedIndex = 0;
        renderPrompt();
      },
    },
  });

  // --- Logique ---

  const setDrill = (next: Drill): void => {
    drill = next;
    for (const button of drillSelect.querySelectorAll<HTMLElement>('[data-drill]')) {
      button.classList.toggle('is-active', button.dataset['drill'] === next);
    }
    tracker.commit(null);
    tracker = new SessionTracker(store, 'send', store.settings.sessionLength);
    summary.replaceChildren();
    tape.replaceChildren();
    keyer.reset();
    started = false;
    syncFromSettings();
    nextPrompt();
  };

  const nextPrompt = (): void => {
    keyer.reset();
    buffer.textContent = '';
    tape.replaceChildren();
    expectedIndex = 0;
    attemptErrors = 0;
    promptStartedAt = 0;
    progress = '';

    if (drill === 'free') {
      target = '';
    } else if (drill === 'chars') {
      const charset = kochCharset(store.settings.kochOrder, store.progress.kochLevel);
      target = charset[Math.floor(Math.random() * charset.length)] ?? 'K';
    } else {
      target = drawVocabulary('abbreviations').text;
    }
    renderPrompt();
  };

  const renderPrompt = (): void => {
    display.className = 'display';
    if (drill === 'free') {
      promptChar.textContent = '';
      promptCode.textContent = '';
      promptHint.textContent = "Manipulez librement : ce que vous émettez s'affiche au fur et à mesure.";
      listenButton.disabled = true;
      nextButton.disabled = true;
      return;
    }
    listenButton.disabled = false;
    nextButton.disabled = false;
    promptChar.textContent = target;
    renderPromptCode(progress);
    const remaining = target.slice(expectedIndex);
    promptHint.textContent = remaining
      ? `À émettre : ${remaining}`
      : 'Consigne terminée.';
  };

  /**
   * Rend le code attendu élément par élément, ceux déjà frappés étant marqués.
   * En frappe indulgente c'est le seul repère de progression : il n'y a plus
   * de chronomètre pour signaler qu'un caractère est terminé.
   */
  const renderPromptCode = (keyed: string): void => {
    promptCode.replaceChildren(
      ...[...target].map((char, index) => {
        const code = encodeChar(char) ?? '';
        const done = index < expectedIndex;
        const current = index === expectedIndex;
        return h(
          'span',
          { class: 'prompt-code' },
          ...[...code].map((symbol, position) =>
            h('span', {
              class: `prompt-code__el${done || (current && position < keyed.length) ? ' is-keyed' : ''}`,
              text: symbol === '.' ? '·' : '–',
            }),
          ),
        );
      }),
    );
  };

  const appendTape = (text: string, kind: 'ok' | 'error' | 'space' | 'free'): void => {
    tape.append(h('span', { class: `tape__char tape__char--${kind}`, text: kind === 'space' ? '␣' : text }));
    tape.scrollLeft = tape.scrollWidth;
  };

  const beginTiming = (): void => {
    if (!started) {
      started = true;
      tracker.start();
    }
    if (promptStartedAt === 0) promptStartedAt = performance.now();
  };

  /** Consigne terminée : enregistre le résultat et enchaîne. */
  const finishPrompt = (): void => {
    const clean = attemptErrors === 0;
    const responseMs = promptStartedAt === 0 ? 0 : performance.now() - promptStartedAt;
    tracker.record(target, null, clean, responseMs);
    if (store.settings.uiSounds && clean) store.audio.feedback('ok');
    store.haptics.feedback(clean ? 'ok' : 'error');
    display.className = `display ${clean ? 'display--ok' : 'display--error'}`;
    promptHint.textContent = clean
      ? 'Émission conforme.'
      : `${attemptErrors} caractère(s) hors consigne. Réessayez ou passez au suivant.`;
    renderProgress();
    if (tracker.finished) finishSession();
    else window.setTimeout(() => nextPrompt(), 900);
  };

  /** Valide le caractère courant et passe au suivant. */
  const advance = (char: string | null, correct: boolean): void => {
    if (!correct) attemptErrors += 1;
    appendTape(char ?? '?', correct ? 'ok' : 'error');
    expectedIndex += 1;
    progress = '';
    if (store.settings.uiSounds && !correct) store.audio.feedback('error');
    if (expectedIndex >= target.length) finishPrompt();
    else renderPrompt();
  };

  /**
   * Frappe indulgente : chaque élément est confronté au code attendu.
   *
   * Tant que ce qui est frappé en constitue un début valide, il ne se passe
   * rien — l'opérateur peut prendre tout son temps entre deux éléments. Le
   * caractère est validé à l'instant où le code est complet, et seule une
   * divergence réelle interrompt la saisie.
   */
  const handleProgress = (code: string): void => {
    const char = target[expectedIndex];
    const expected = char ? encodeChar(char) : null;
    if (!char || !expected) return;
    beginTiming();

    if (code === expected) {
      keyer.clearBuffer();
      buffer.textContent = '';
      tracker.countSent();
      detectSpecials(code, char);
      advance(char, true);
      return;
    }

    if (expected.startsWith(code)) {
      progress = code;
      renderPromptCode(progress);
      promptHint.textContent = `À émettre : ${target.slice(expectedIndex)}`;
      return;
    }

    // Divergence : le seul cas qui arrête la saisie. Le caractère repart à
    // zéro pour être refrappé, sans faire avancer la consigne.
    keyer.clearBuffer();
    buffer.textContent = '';
    progress = '';
    attemptErrors += 1;
    if (store.settings.uiSounds) store.audio.feedback('error');
    store.haptics.feedback('error');
    appendTape('✗', 'error');
    renderPromptCode('');
    display.className = 'display display--error';
    promptHint.textContent = `Cet élément ne fait pas partie du code de ${char}. Reprenez ce caractère.`;
  };

  const handleCharacter = (code: string, char: string | null): void => {
    beginTiming();
    tracker.countSent();
    detectSpecials(code, char);

    if (drill === 'free') {
      appendTape(char ?? '?', char ? 'free' : 'error');
      if (!char) context.toast(`Code inconnu : ${prettyCode(code)}`, 'info');
      return;
    }

    const expected = target[expectedIndex];
    if (expected === undefined) return;
    advance(char, char === expected);
  };

  /**
   * Repère les signaux remarquables pour les succès correspondants. Le SOS
   * compte qu'il soit émis en un seul signal, comme le veut la procédure, ou
   * en trois lettres séparées, comme le fait naturellement un débutant.
   */
  const detectSpecials = (code: string, char: string | null): void => {
    recent.push(char ?? '?');
    if (recent.length > 4) recent.shift();

    const prosign = code === '...---...';
    if (prosign || recent.slice(-3).join('') === 'SOS') {
      const already = Boolean(store.progress.flags['sos']);
      store.raiseFlag('sos');
      if (!already) {
        context.toast(
          prosign ? 'SOS émis d’un seul tenant, dans les règles.' : 'SOS émis. Bien joue.',
          'success',
        );
      }
    }
    if (recent.slice(-2).join('') === 'CQ') store.raiseFlag('cq');
  };

  const renderProgress = (): void => {
    if (drill === 'free') {
      progressBar.style.width = '0%';
      progressLabel.textContent = 'Manipulation libre — aucune série en cours';
      return;
    }
    const ratio = Math.min(1, tracker.count / tracker.target);
    progressBar.style.width = `${ratio * 100}%`;
    progressLabel.textContent = `${tracker.count} / ${tracker.target} · ${formatPercent(tracker.accuracy)}`;
  };

  const finishSession = (): void => {
    const accuracy = tracker.accuracy;
    tracker.commit(null);
    summary.replaceChildren(
      h(
        'div',
        { class: 'summary__scores' },
        h('div', { class: 'metric' },
          h('span', { class: 'metric__value', text: formatPercent(accuracy) }),
          h('span', { class: 'metric__label', text: 'Consignes propres' })),
        h('div', { class: 'metric' },
          h('span', { class: 'metric__value', text: `${tracker.correct}/${tracker.count}` }),
          h('span', { class: 'metric__label', text: 'Sans erreur' })),
      ),
      h('button', {
        class: 'btn btn--primary',
        type: 'button',
        text: 'Nouvelle série',
        on: {
          click: () => {
            tracker = new SessionTracker(store, 'send', store.settings.sessionLength);
            started = false;
            summary.replaceChildren();
            renderProgress();
            nextPrompt();
          },
        },
      }),
    );
  };

  const syncFromSettings = (): void => {
    modeSelect.value = store.settings.keyerMode;
    (swapToggle.querySelector('input') as HTMLInputElement).checked = store.settings.swapPaddles;
    swapToggle.style.display = store.settings.keyerMode === 'straight' ? 'none' : '';
    (forgivingToggle.querySelector('input') as HTMLInputElement).checked = forgiving();
    keyer.setTiming(store.timing);
    keyer.setOptions({
      mode: store.settings.keyerMode,
      adaptive: store.settings.adaptiveKeying,
      // En manipulation libre il n'y a pas de consigne à confronter : le
      // découpage reste chronométré, simplement beaucoup plus tolérant.
      autoBreak: !forgiving() || drill === 'free',
      charGapUnits: forgiving() ? 4 : 2,
      wordGapUnits: forgiving() ? 9 : 5,
    });
    keypad.render();
    lamp.setEnabled(store.settings.visualSignal);
    modeNote.textContent = forgiving()
      ? drill === 'free'
        ? "Frappe indulgente : les silences sont interprétés bien plus largement, rien ne vous presse."
        : "Frappe indulgente : aucun délai imposé entre les éléments. Le caractère se valide dès que son code est complet, et seule une erreur interrompt la saisie."
      : "Frappe chronométrée : un silence de trois unités termine le caractère, comme en trafic réel.";
  };

  const unsubscribe = store.subscribe(syncFromSettings);
  syncFromSettings();
  setDrill('chars');
  renderProgress();

  const element = h(
    'div',
    { class: 'trainer' },
    h('div', { class: 'toolbar' }, modeSelect, swapToggle, forgivingToggle),
    modeNote,
    drillSelect,
    h('p', { class: 'trainer__hint', text: DRILLS.find((entry) => entry.id === drill)?.hint ?? '' }),
    h('div', { class: 'progress' }, progressBar, progressLabel),
    h('div', { class: 'trainer__stage' }, display, lamp.element),
    h('div', { class: 'tape-wrap' }, tape, buffer),
    keypad.element,
    h('div', { class: 'actions' }, nextButton, listenButton, clearButton),
    summary,
    h(
      'details',
      { class: 'help' },
      h('summary', { text: 'Manipulateur droit ou palettes ?' }),
      h('p', {},
        h('strong', { text: 'Le manipulateur droit ' }),
        "n’a qu’un contact : c’est la durée de l’appui qui distingue le point du trait, et tout le rythme " +
        "dépend de vous. C’est exigeant, très personnel — on reconnaît un opérateur à sa frappe — et c’est " +
        "la façon historique de manipuler."),
      h('p', {},
        h('strong', { text: 'Les palettes « un élément par appui » ' }),
        "ont les mêmes deux contacts, mais un appui ne donne qu'un seul élément, quelle que soit sa " +
        "durée. Sur un manipulateur réel, tenir la palette enchaîne les éléments : à 20 mots par " +
        "minute un point et son silence durent 120 ms, soit moins qu'un relâchement de touche, si " +
        "bien qu'on obtient trois points là où on en voulait un. Ce mode supprime le problème, au " +
        "clavier comme au doigt. Les appuis sont mis en file : vous pouvez frapper plus vite que la " +
        "vitesse réglée sans rien perdre."),
      h('p', {},
        h('strong', { text: 'Les palettes iambiques ' }),
        "ont deux contacts, un pour le point et un pour le trait. L’électronique génère les éléments à la " +
        "bonne durée tant que la palette est tenue, et presser les deux ensemble alterne points et traits. " +
        "Le mode B ajoute un élément supplémentaire après un relâchement en pince ; le mode A s’arrête net. " +
        "Si vous débutez aux palettes, restez en mode A."),
      h('p', {},
        "Sur téléphone et sur tablette, utilisez les boutons ci-dessus. Avec un clavier — y compris " +
        "celui d'un iPad — ils sont reliés aux touches indiquées sur chaque bouton, modifiables dans " +
        "les réglages."),
      h('p', {},
        h('strong', { text: 'La frappe indulgente ' }),
        "enlève toute contrainte de temps : chaque élément est comparé au code attendu, un début " +
        "valide vous laisse réfléchir aussi longtemps qu'il le faut, et seul un élément qui ne " +
        "correspond pas arrête la saisie. Le code attendu s'allume au fur et à mesure sous la " +
        "consigne. C'est le bon réglage pour apprendre le geste ; désactivez-le quand vous voulez " +
        "travailler le rythme, qui est ce qui compte en trafic réel."),
    ),
  );

  return {
    element,
    destroy: () => {
      unsubscribe();
      keypad.destroy();
      keyer.dispose();
      player.stop();
      store.audio.stopSidetone();
      store.haptics.release();
      tracker.commit(null);
    },
  };
}
