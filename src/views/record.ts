/**
 * Enregistreur d'émission.
 *
 * Cet outil ne juge rien et ne propose aucune consigne : il capte la frappe et
 * la restitue, en texte et en audio. Les manipulateurs sont exactement ceux de
 * l'exercice d'émission — le même moteur est réutilisé — de sorte qu'un
 * réglage acquis à l'entraînement s'y retrouve à l'identique.
 *
 * L'audio n'est pas capté au micro mais reconstruit à partir des instants de
 * fermeture et d'ouverture du contact. Le fichier obtenu porte donc le rythme
 * réel de l'opérateur, imperfections comprises, sur une tonalité pure et sans
 * le moindre bruit de fond.
 */

import { h, formatNumber } from '../ui/dom.ts';
import { SignalLamp } from '../ui/lamp.ts';
import { KeyPad } from '../ui/keypad.ts';
import { Keyer } from '../core/keyer.ts';
import { prettyCode } from '../core/morse.ts';
import { downloadBlob, renderMorseToWav, slugify, wavExportSupported } from '../core/wav.ts';
import { downloadText } from '../core/storage.ts';
import type { TimedElement } from '../core/timing.ts';
import type { View, ViewContext } from '../ui/router.ts';

/** Un basculement du contact : instant, et état atteint. */
interface Mark {
  at: number;
  on: boolean;
}

const MODE_LABELS: Record<string, string> = {
  straight: 'Manipulateur droit',
  'paddle-single': 'Palettes, un élément par appui',
  'iambic-a': 'Palettes iambiques, mode A',
  'iambic-b': 'Palettes iambiques, mode B',
};

export function recordView(context: ViewContext): View {
  const { store } = context;
  const lamp = new SignalLamp('Manipulateur');

  let recording = false;
  let marks: Mark[] = [];
  let text = '';
  let morse = '';
  let pendingWord = false;

  // --- Interface ---

  const statusBadge = h('span', { class: 'badge' });
  const durationBadge = h('span', { class: 'badge' });
  const elementsBadge = h('span', { class: 'badge' });
  const timeline = h('div', { class: 'timeline-strip' });
  const textOut = h('div', { class: 'record__text', attrs: { 'aria-live': 'polite' } });
  const morseOut = h('div', { class: 'record__morse' });
  const buffer = h('span', { class: 'tape__buffer' });

  /** Convertit les basculements en séquence jouable et exportable. */
  const toElements = (): TimedElement[] => {
    const out: TimedElement[] = [];
    for (let index = 0; index + 1 < marks.length; index += 1) {
      const current = marks[index];
      const next = marks[index + 1];
      if (!current || !next) continue;
      const duration = (next.at - current.at) / 1000;
      if (duration > 0) out.push({ on: current.on, duration });
    }
    return out;
  };

  const totalSeconds = (): number => {
    if (marks.length < 2) return 0;
    const first = marks[0];
    const last = marks[marks.length - 1];
    return first && last ? (last.at - first.at) / 1000 : 0;
  };

  const renderStatus = (): void => {
    statusBadge.textContent = recording ? 'Enregistrement en cours' : 'À l’arrêt';
    statusBadge.classList.toggle('badge--accent', recording);
    const seconds = totalSeconds();
    durationBadge.textContent = seconds
      ? `${seconds < 60 ? `${seconds.toFixed(1)} s` : `${Math.floor(seconds / 60)} min ${Math.round(seconds % 60)} s`}`
      : '—';
    const signals = marks.filter((mark) => mark.on).length;
    elementsBadge.textContent = `${formatNumber(signals)} élément${signals > 1 ? 's' : ''}`;

    const hasContent = marks.length > 1;
    wavButton.disabled = !hasContent || !wavExportSupported();
    textButton.disabled = text.trim() === '' && morse.trim() === '';
    copyButton.disabled = textButton.disabled;
    clearButton.disabled = !hasContent && text === '';
  };

  /**
   * Frise du rythme : chaque signal est un trait dont la largeur est sa durée
   * réelle. On voit d'un coup d'œil si les points sont réguliers et si les
   * silences sont tenus, ce qu'aucun texte décodé ne montre.
   */
  const renderTimeline = (): void => {
    const elements = toElements();
    if (elements.length === 0) {
      timeline.replaceChildren(
        h('span', { class: 'timeline-strip__empty', text: 'Le rythme de votre frappe s’affichera ici.' }),
      );
      return;
    }
    const total = elements.reduce((sum, element) => sum + element.duration, 0) || 1;
    // On ne garde que la fin quand l'enregistrement est long : la frise resterait
    // illisible en comprimant plusieurs minutes sur une ligne.
    const window = 12;
    let kept = elements;
    if (total > window) {
      let acc = 0;
      const tail: TimedElement[] = [];
      for (let i = elements.length - 1; i >= 0 && acc < window; i -= 1) {
        const element = elements[i];
        if (!element) continue;
        tail.unshift(element);
        acc += element.duration;
      }
      kept = tail;
    }
    const span = kept.reduce((sum, element) => sum + element.duration, 0) || 1;
    timeline.replaceChildren(
      ...kept.map((element) =>
        h('span', {
          class: `timeline-strip__cell${element.on ? ' is-on' : ''}`,
          style: { flexGrow: `${Math.max(0.02, element.duration / span)}` },
        }),
      ),
    );
  };

  const renderOutput = (): void => {
    textOut.textContent = text || '—';
    morseOut.textContent = morse.trim() || '—';
    renderTimeline();
    renderStatus();
  };

  // --- Manipulateur ---

  const keyer = new Keyer(
    store.timing,
    { mode: store.settings.keyerMode, adaptive: store.settings.adaptiveKeying, autoBreak: true },
    {
      onKeyDown: (kind) => {
        if (!recording) return;
        marks.push({ at: performance.now(), on: true });
        void store.audio.unlock();
        store.audio.startSidetone();
        lamp.on(kind);
        if (kind) store.haptics.pulse((kind === 'dit' ? store.timing.dit : store.timing.dah) * 1000);
        else store.haptics.hold();
      },
      onKeyUp: () => {
        if (!recording) return;
        marks.push({ at: performance.now(), on: false });
        store.audio.stopSidetone();
        lamp.off();
        if (keyer.mode === 'straight') store.haptics.release();
        renderStatus();
      },
      onElement: (_kind, code) => {
        buffer.textContent = prettyCode(code);
      },
      onCharacter: (code, char) => {
        buffer.textContent = '';
        if (!recording) return;
        if (pendingWord) {
          text += ' ';
          morse += '/ ';
          pendingWord = false;
        }
        text += char ?? '?';
        morse += `${code} `;
        renderOutput();
      },
      onWord: () => {
        if (recording && text !== '') pendingWord = true;
      },
    },
  );

  const keypad = new KeyPad({
    keyer,
    getSettings: () => store.settings,
    onFirstTouch: () => void store.audio.unlock(),
  });

  // --- Commandes ---

  const recordButton = h('button', {
    class: 'btn btn--primary btn--lg',
    type: 'button',
    text: 'Démarrer l’enregistrement',
    on: { click: () => (recording ? stopRecording() : startRecording()) },
  });

  const clearButton = h('button', {
    class: 'btn btn--ghost',
    type: 'button',
    text: 'Effacer',
    on: { click: () => reset() },
  });

  const exportNoiseToggle = h(
    'label',
    { class: 'switch' },
    h('input', { type: 'checkbox' }),
    h('span', { text: 'avec le bruit de fond' }),
  );

  const wavButton = h('button', {
    class: 'btn',
    type: 'button',
    text: 'Exporter en WAV',
    disabled: true,
    on: {
      click: async () => {
        const elements = toElements();
        if (elements.length === 0) return;
        const previous = wavButton.textContent ?? 'Exporter en WAV';
        wavButton.disabled = true;
        wavButton.textContent = 'Rendu en cours…';
        try {
          const blob = await renderMorseToWav(elements, {
            frequency: store.settings.frequency,
            volume: store.settings.volume,
            rampMs: store.settings.rampMs,
            waveform: store.settings.waveform,
            noiseSnrDb: (exportNoiseToggle.querySelector('input') as HTMLInputElement).checked
              ? store.settings.noiseSnrDb
              : null,
          });
          downloadBlob(`morse-frappe-${slugify(text || 'enregistrement')}.wav`, blob);
          context.toast('Enregistrement audio téléchargé.', 'success');
        } catch (error) {
          context.toast(error instanceof Error ? error.message : 'Le rendu audio a échoué.', 'error');
        } finally {
          wavButton.textContent = previous;
          wavButton.disabled = false;
        }
      },
    },
  });

  const transcript = (): string => {
    const seconds = totalSeconds();
    const stamp = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date());
    return [
      'Enregistrement — Morse Training',
      `Date : ${stamp}`,
      `Manipulateur : ${MODE_LABELS[store.settings.keyerMode] ?? store.settings.keyerMode}`,
      `Vitesse de référence : ${store.settings.charWpm} WPM`,
      `Durée : ${seconds.toFixed(1)} s — ${marks.filter((mark) => mark.on).length} éléments`,
      '',
      'Texte',
      text || '(rien de décodé)',
      '',
      'Morse',
      morse.trim() || '(rien de décodé)',
      '',
    ].join('\n');
  };

  const textButton = h('button', {
    class: 'btn',
    type: 'button',
    text: 'Exporter en texte',
    disabled: true,
    on: {
      click: () => {
        downloadText(`morse-frappe-${slugify(text || 'enregistrement')}.txt`, transcript(), 'text/plain');
        context.toast('Transcription téléchargée.', 'success');
      },
    },
  });

  const copyButton = h('button', {
    class: 'btn btn--ghost',
    type: 'button',
    text: 'Copier',
    disabled: true,
    on: {
      click: async () => {
        try {
          await navigator.clipboard.writeText(transcript());
          context.toast('Transcription copiée.', 'success');
        } catch {
          context.toast('La copie automatique a été refusée par le navigateur.', 'error');
        }
      },
    },
  });

  const modeSelect = h(
    'select',
    {
      class: 'select',
      attrs: { 'aria-label': 'Type de manipulateur' },
      on: {
        change: (event) =>
          store.updateSettings({
            keyerMode: (event.target as HTMLSelectElement).value as typeof store.settings.keyerMode,
          }),
      },
    },
    h('option', { value: 'straight', text: 'Manipulateur droit (une touche)' }),
    h('option', { value: 'paddle-single', text: 'Palettes — un élément par appui' }),
    h('option', { value: 'iambic-a', text: 'Palettes iambiques — mode A' }),
    h('option', { value: 'iambic-b', text: 'Palettes iambiques — mode B' }),
  );

  const swapToggle = h(
    'label',
    { class: 'switch' },
    h('input', {
      type: 'checkbox',
      on: { change: (event) => store.updateSettings({ swapPaddles: (event.target as HTMLInputElement).checked }) },
    }),
    h('span', { text: 'Inverser les palettes' }),
  );

  // --- Cycle d'enregistrement ---

  const reset = (): void => {
    keyer.reset();
    marks = [];
    text = '';
    morse = '';
    pendingWord = false;
    buffer.textContent = '';
    renderOutput();
  };

  const startRecording = (): void => {
    reset();
    recording = true;
    void store.audio.unlock();
    void store.audio.startNoise();
    recordButton.textContent = 'Arrêter l’enregistrement';
    renderOutput();
  };

  const stopRecording = (): void => {
    // Ferme le caractère en cours : sans cela, les derniers éléments frappés
    // resteraient dans le tampon et n'apparaîtraient pas dans la transcription.
    keyer.flush();
    recording = false;
    store.audio.stopSidetone();
    store.audio.stopNoise();
    store.haptics.release();
    lamp.off();
    recordButton.textContent = 'Démarrer l’enregistrement';
    renderOutput();
  };

  const syncFromSettings = (): void => {
    modeSelect.value = store.settings.keyerMode;
    (swapToggle.querySelector('input') as HTMLInputElement).checked = store.settings.swapPaddles;
    swapToggle.style.display = store.settings.keyerMode === 'straight' ? 'none' : '';
    keyer.setTiming(store.timing);
    keyer.setOptions({
      mode: store.settings.keyerMode,
      adaptive: store.settings.adaptiveKeying,
      autoBreak: true,
    });
    keypad.render();
    lamp.setEnabled(store.settings.visualSignal);
  };

  const unsubscribe = store.subscribe(syncFromSettings);
  syncFromSettings();
  renderOutput();

  const element = h(
    'div',
    { class: 'trainer' },
    h(
      'article',
      { class: 'prose prose--tight' },
      h('p', { class: 'prose__lead' },
        "Manipulez : l’outil ne fait qu’enregistrer. Il restitue ce que vous avez émis en texte et en " +
        "morse, et produit un fichier audio au rythme exact de votre frappe. Aucune consigne, aucune " +
        "note, rien à réussir."),
    ),
    h('div', { class: 'toolbar' }, modeSelect, swapToggle),
    h('div', { class: 'badges' }, statusBadge, durationBadge, elementsBadge),
    h('div', { class: 'trainer__stage' },
      h('div', { class: 'record__panel' },
        h('h2', { class: 'record__label', text: 'Texte décodé' }),
        textOut,
        h('h2', { class: 'record__label', text: 'Morse' }),
        morseOut),
      lamp.element),
    h('div', { class: 'tape-wrap' }, timeline, buffer),
    keypad.element,
    h('div', { class: 'actions' }, recordButton, clearButton),
    h('div', { class: 'actions' }, wavButton, exportNoiseToggle, textButton, copyButton),
    h(
      'details',
      { class: 'help' },
      h('summary', { text: 'Ce que fait exactement cet outil' }),
      h('p', {},
        "L’audio n’est pas capté au micro : il est reconstruit à partir des instants où votre contact " +
        "s’est fermé et ouvert. Le fichier porte donc votre rythme réel, imperfections comprises, mais " +
        "sur une tonalité pure et sans le moindre bruit de fond. La tonalité, le volume et la douceur " +
        "d’attaque sont ceux de vos réglages."),
      h('p', {},
        "Les manipulateurs sont les mêmes que dans l’exercice d’émission, et le réglage est partagé : " +
        "changer de mode ici le change aussi là-bas. Le décodage en texte utilise les seuils de silence " +
        "habituels ; un rythme irrégulier donnera donc une transcription approximative, ce qui est " +
        "précisément l’information utile."),
      h('p', {},
        "La frise sous le manipulateur montre la durée réelle de chaque signal et de chaque silence. " +
        "C’est le meilleur moyen de voir si vos points sont réguliers et si vous tenez vos silences, " +
        "ce qu’un texte décodé ne révèle jamais."),
    ),
  );

  return {
    element,
    destroy: () => {
      unsubscribe();
      keypad.destroy();
      keyer.dispose();
      store.audio.stopSidetone();
      store.audio.stopNoise();
      store.haptics.release();
    },
  };
}
