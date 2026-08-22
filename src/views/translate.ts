/**
 * Traducteur réversible texte <-> morse.
 *
 * Les deux champs sont liés : écrire dans l'un met l'autre à jour. La lecture
 * part toujours du champ que l'on vient de modifier, de sorte qu'une notation
 * morse saisie à la main est jouée telle quelle, même si elle ne correspond à
 * aucune lettre connue.
 */

import { h } from '../ui/dom.ts';
import { SignalLamp } from '../ui/lamp.ts';
import { MorsePlayer } from '../ui/player.ts';
import { decodeText, encodeText, normalizeMorseInput, prettyCode, encodeChar } from '../core/morse.ts';
import { Torch, torchPossiblySupported } from '../core/torch.ts';
import { sequenceDuration } from '../core/timing.ts';
import { downloadBlob, renderMorseToWav, slugify, wavExportSupported } from '../core/wav.ts';
import type { View, ViewContext } from '../ui/router.ts';

/** Au-delà de cette vitesse, la lampe d'un téléphone ne suit plus le rythme. */
const TORCH_MAX_WPM = 10;

export function translateView(context: ViewContext): View {
  const { store } = context;
  const lamp = new SignalLamp('Signal');
  const player = new MorsePlayer(store, lamp);
  const torch = new Torch();

  let source: 'text' | 'morse' = 'text';
  let syncing = false;
  let torchEnabled = false;
  /** L'appareil a confirmé l'allumage, par opposition à ne rien renseigner. */
  let torchVerified = false;
  let screenFlashEnabled = false;

  // --- Flash d'écran ---

  // Un voile plein écran, créé une seule fois et seulement s'il est demandé.
  // Il ne s'affiche que le temps d'une émission — sinon il masquerait la page —
  // et se referme au toucher, seule sortie possible quand l'écran entier
  // clignote.
  const flashLayer = h(
    'div',
    {
      class: 'flash-layer',
      attrs: { role: 'button', tabindex: '-1', 'aria-label': "Arrêter l’émission lumineuse" },
      on: { click: () => stop() },
    },
    h('span', { class: 'flash-layer__hint', text: 'Touchez l’écran pour arrêter' }),
  );

  const armFlash = (armed: boolean): void => {
    flashLayer.classList.toggle('is-armed', armed && screenFlashEnabled);
    if (!armed) flashLayer.classList.remove('is-lit');
  };

  // --- Champs ---

  const textArea = h('textarea', {
    class: 'input translate__field',
    attrs: {
      rows: 5,
      placeholder: 'Écrivez ici… par exemple : CQ DE F5ABC',
      'aria-label': 'Texte en clair',
      autocapitalize: 'characters',
      spellcheck: 'false',
    },
    on: {
      input: () => {
        if (syncing) return;
        source = 'text';
        syncing = true;
        morseArea.value = encodeText(textArea.value);
        syncing = false;
        refresh();
      },
    },
  });

  const morseArea = h('textarea', {
    class: 'input translate__field translate__field--mono',
    attrs: {
      rows: 5,
      placeholder: '… ou collez du morse : -.-. --.-  /  -.. .',
      'aria-label': 'Code morse',
      spellcheck: 'false',
    },
    on: {
      input: () => {
        if (syncing) return;
        source = 'morse';
        syncing = true;
        textArea.value = decodeText(normalizeMorseInput(morseArea.value));
        syncing = false;
        refresh();
      },
    },
  });

  // --- Bandeau de lecture ---

  const strip = h('div', { class: 'translate__strip' });
  const meta = h('p', { class: 'translate__meta' });

  const renderStrip = (activeIndex = -1): void => {
    const text = textArea.value.toUpperCase();
    if (!text.trim()) {
      strip.replaceChildren(h('span', { class: 'translate__strip-empty', text: 'Rien à lire pour le moment.' }));
      return;
    }
    strip.replaceChildren(
      ...[...text].map((char, index) =>
        h(
          'span',
          { class: `translate__unit${index === activeIndex ? ' is-active' : ''}` },
          h('span', { class: 'translate__unit-char', text: char === ' ' ? '␣' : char }),
          h('span', { class: 'translate__unit-code', text: char === ' ' ? '' : prettyCode(encodeChar(char) ?? '') }),
        ),
      ),
    );
  };

  const currentElements = () =>
    source === 'morse'
      ? player.buildElementsFromMorse(morseArea.value)
      : player.buildElements(textArea.value);

  const refresh = (): void => {
    renderStrip();
    const elements = currentElements();
    const seconds = sequenceDuration(elements);
    const unknown = [...textArea.value.toUpperCase()].filter(
      (char) => char !== ' ' && !encodeChar(char),
    );
    const uniqueUnknown = [...new Set(unknown)];
    meta.textContent = seconds
      ? `Durée à l’émission : ${seconds < 60 ? `${seconds.toFixed(1)} s` : `${Math.floor(seconds / 60)} min ${Math.round(seconds % 60)} s`}` +
        ` · ${store.settings.charWpm} WPM` +
        (uniqueUnknown.length > 0 ? ` · caractères sans code morse ignorés : ${uniqueUnknown.join(' ')}` : '')
      : '';
    playButton.disabled = elements.length === 0;
    exportButton.disabled = elements.length === 0 || !wavExportSupported();
  };

  // --- Lecture ---

  const playButton = h('button', {
    class: 'btn btn--primary btn--lg',
    type: 'button',
    text: 'Émettre',
    on: { click: () => (player.playing ? stop() : void play()) },
  });

  const stop = (): void => {
    player.stop();
    store.audio.stopNoise();
    torch.set(false);
    armFlash(false);
    playButton.textContent = 'Émettre';
    renderStrip();
  };

  const play = async (): Promise<void> => {
    const elements = currentElements();
    if (elements.length === 0) return;
    playButton.textContent = 'Arrêter';
    armFlash(true);
    void store.audio.startNoise();

    // Le son peut être refusé — session audio prise par la caméra, appareil en
    // silencieux. L'émission continue alors en lumière et en vibration, mais
    // l'utilisateur doit savoir pourquoi il n'entend rien.
    if (!(await store.audio.unlock())) {
      context.toast(
        "Le son n’a pas pu démarrer sur cet appareil. L’émission continue en lumière et en vibration.",
        'info',
      );
    }

    await player.playElements(elements, {
      onChar: (index) => renderStrip(index),
      onSignal: (on) => {
        if (torchEnabled) torch.set(on);
        if (screenFlashEnabled) flashLayer.classList.toggle('is-lit', on);
      },
      onEnd: () => {
        store.audio.stopNoise();
        torch.set(false);
        armFlash(false);
        playButton.textContent = 'Émettre';
        renderStrip();
      },
    });
  };

  // --- Sorties lumineuses ---

  const torchNote = h('p', { class: 'field__hint' });

  const torchTestButton = h('button', {
    class: 'btn btn--small',
    type: 'button',
    text: 'Tester la lampe',
    disabled: true,
    on: {
      click: async () => {
        torchTestButton.disabled = true;
        const result = await torch.selfTest(700);
        torchTestButton.disabled = false;
        if (!result.ok) {
          context.toast(result.message ?? 'Essai échoué.', 'error');
          renderTorchNote(result.message);
          return;
        }
        torchVerified = result.verified === true;
        // Ouvrir la caméra interrompt la session audio sur iOS : on la reprend
        // aussitôt, sans quoi l'émission suivante serait muette.
        await store.audio.unlock();
        context.toast(
          torchVerified
            ? 'La lampe a répondu : elle vient de rester allumée une seconde.'
            : "Demande envoyée sans erreur. Si rien ne s’est allumé, c’est que cet appareil ne pilote pas son flash depuis une page web.",
          torchVerified ? 'success' : 'info',
        );
        renderTorchNote();
      },
    },
  });

  // Une panne en cours d'émission doit se voir, pas disparaître dans un silence.
  torch.onFailure = (message) => {
    context.toast(message, 'error');
    torchEnabled = false;
    torchInput.checked = false;
    torchTestButton.disabled = true;
    torch.release();
    renderTorchNote(message);
  };
  const torchInput = h('input', {
    type: 'checkbox',
    attrs: { disabled: !torchPossiblySupported() },
    on: {
      change: async (event) => {
        const input = event.target as HTMLInputElement;
        if (!input.checked) {
          torchEnabled = false;
          torchTestButton.disabled = true;
          torch.release();
          renderTorchNote();
          return;
        }
        input.disabled = true;
        const result = await torch.acquire();
        input.disabled = false;
        if (!result.ok) {
          input.checked = false;
          torchEnabled = false;
          torchTestButton.disabled = true;
          context.toast(result.message ?? "La lampe n’a pas pu être activée.", 'error');
          renderTorchNote(result.message);
          return;
        }
        torchEnabled = true;
        torchTestButton.disabled = false;
        torchVerified = result.verified === true;
        // Ouvrir la caméra interrompt la session audio sur iOS : on la reprend
        // aussitôt, sans quoi l'émission suivante serait muette.
        await store.audio.unlock();
        context.toast(
          torchVerified
            ? 'Lampe prête : elle vient de clignoter une fois.'
            : "Lampe activée, mais cet appareil ne confirme rien : vérifiez de visu avec « Tester la lampe ».",
          torchVerified ? 'success' : 'info',
        );
        renderTorchNote();
        if (store.settings.charWpm > TORCH_MAX_WPM) {
          context.toast(
            `À ${store.settings.charWpm} WPM la lampe ne suivra pas. Descendez vers ${TORCH_MAX_WPM} WPM.`,
            'info',
          );
        }
      },
    },
  });

  const renderTorchNote = (failure?: string): void => {
    if (failure) {
      torchNote.textContent = failure;
      return;
    }
    if (!torchPossiblySupported()) {
      torchNote.textContent =
        "Ce navigateur ne permet pas de piloter la lampe. C’est notamment le cas de Safari sur iPhone et iPad : aucune interface web n’y donne accès au flash. Le flash d’écran ci-dessous reste disponible.";
      return;
    }
    torchNote.textContent = torchEnabled
      ? (torchVerified
          ? `Lampe confirmée par l’appareil. La caméra arrière reste ouverte tant que l’option est active. Au-delà de ${TORCH_MAX_WPM} mots par minute, la commutation du flash ne suit plus : baissez la vitesse pour un signal lisible.`
          : `Demande acceptée, mais cet appareil ne dit pas si la lampe s’est réellement allumée. Utilisez « Tester la lampe » et regardez le flash : c’est le seul verdict fiable. Au-delà de ${TORCH_MAX_WPM} mots par minute, la commutation ne suit plus.`)
      : `Passe par la caméra arrière, seul chemin qu’offre le web vers le flash : l’autorisation caméra sera demandée. À utiliser vers ${TORCH_MAX_WPM} mots par minute au plus.`;
  };

  const screenFlashInput = h('input', {
    type: 'checkbox',
    on: {
      change: (event) => {
        screenFlashEnabled = (event.target as HTMLInputElement).checked;
        if (screenFlashEnabled) document.body.append(flashLayer);
        else {
          flashLayer.classList.remove('is-lit');
          flashLayer.remove();
        }
      },
    },
  });

  // --- Actions annexes ---

  const copyButton = (getValue: () => string, label: string): HTMLElement =>
    h('button', {
      class: 'btn btn--ghost btn--small',
      type: 'button',
      text: 'Copier',
      attrs: { 'aria-label': `Copier ${label}` },
      on: {
        click: async () => {
          const value = getValue();
          if (!value) return;
          try {
            await navigator.clipboard.writeText(value);
            context.toast('Copie dans le presse-papiers.', 'success');
          } catch {
            context.toast("La copie automatique a été refusée par le navigateur.", 'error');
          }
        },
      },
    });

  // L'export peut reproduire l'ambiance de la séance ou rester net : un fichier
  // destiné à être réécouté gagne souvent à être propre, mais pas toujours.
  const exportNoiseToggle = h(
    'label',
    { class: 'switch' },
    h('input', { type: 'checkbox' }),
    h('span', { text: 'avec le bruit de fond' }),
  );

  const exportWithNoise = (): number | null => {
    const checked = (exportNoiseToggle.querySelector('input') as HTMLInputElement).checked;
    return checked ? store.settings.noiseSnrDb : null;
  };

  const exportButton = h('button', {
    class: 'btn',
    type: 'button',
    text: 'Télécharger en WAV',
    disabled: !wavExportSupported(),
    on: {
      click: async () => {
        const elements = currentElements();
        if (elements.length === 0) return;
        const previous = exportButton.textContent ?? 'Télécharger en WAV';
        exportButton.disabled = true;
        exportButton.textContent = 'Rendu en cours…';
        try {
          const blob = await renderMorseToWav(elements, {
            frequency: store.settings.frequency,
            volume: store.settings.volume,
            rampMs: store.settings.rampMs,
            waveform: store.settings.waveform,
            noiseSnrDb: exportWithNoise(),
          });
          downloadBlob(
            `morse-${slugify(textArea.value)}-${store.settings.charWpm}wpm.wav`,
            blob,
          );
          context.toast('Fichier audio téléchargé.', 'success');
        } catch (error) {
          context.toast(error instanceof Error ? error.message : 'Le rendu audio a échoué.', 'error');
        } finally {
          exportButton.textContent = previous;
          exportButton.disabled = false;
        }
      },
    },
  });

  const speedSlider = h('input', {
    class: 'slider',
    type: 'range',
    attrs: { min: 5, max: 40, value: store.settings.charWpm, 'aria-label': 'Vitesse' },
    on: {
      input: (event) => {
        const value = Number((event.target as HTMLInputElement).value);
        store.updateSettings({ charWpm: value, effectiveWpm: value });
      },
    },
  });

  const unsubscribe = store.subscribe(() => {
    speedSlider.value = String(store.settings.charWpm);
    lamp.setEnabled(store.settings.visualSignal);
    refresh();
  });

  renderTorchNote();
  refresh();

  const element = h(
    'div',
    { class: 'stack' },
    h(
      'article',
      { class: 'prose prose--tight' },
      h('p', { class: 'prose__lead' },
        "Traduisez dans les deux sens : écrivez du texte pour obtenir le morse, ou collez du morse pour " +
        "le relire en clair. Le résultat s’écoute, s’affiche sur la diode, et peut piloter la lampe du " +
        "téléphone pour émettre réellement en lumière."),
    ),

    h(
      'section',
      { class: 'card' },
      h(
        'div',
        { class: 'translate__grid' },
        h(
          'div',
          { class: 'translate__panel' },
          h('div', { class: 'translate__panel-head' },
            h('h2', { class: 'translate__panel-title', text: 'Texte' }),
            copyButton(() => textArea.value, 'le texte')),
          textArea,
        ),
        h(
          'div',
          { class: 'translate__panel' },
          h('div', { class: 'translate__panel-head' },
            h('h2', { class: 'translate__panel-title', text: 'Morse' }),
            copyButton(() => morseArea.value, 'le morse')),
          morseArea,
        ),
      ),
      h(
        'div',
        { class: 'actions translate__actions' },
        playButton,
        lamp.element,
        exportButton,
        exportNoiseToggle,
        h('button', {
          class: 'btn',
          type: 'button',
          text: 'Effacer',
          on: {
            click: () => {
              stop();
              textArea.value = '';
              morseArea.value = '';
              refresh();
            },
          },
        }),
      ),
      meta,
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Lecture en cours' }),
      strip,
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Vitesse' }),
      h('div', { class: 'slider-row' }, speedSlider,
        h('output', { class: 'slider__value', text: `${store.settings.charWpm} WPM` })),
      h('p', { class: 'field__hint' },
        "Ce curseur règle la vitesse des caractères et la vitesse globale ensemble, ce qui convient à " +
        "une émission réelle. Pour dissocier les deux, comme en apprentissage, passez par les réglages."),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Émettre en lumière' }),
      h('div', { class: 'field' },
        h('div', { class: 'field__label', text: 'Lampe torche' },),
        h('div', { class: 'field__control' },
          h('div', { class: 'actions' },
            h('label', { class: 'switch' }, torchInput, h('span', { text: 'Piloter le flash du téléphone' })),
            torchTestButton)),
        torchNote),
      h('div', { class: 'field' },
        h('div', { class: 'field__label', text: "Flash de l’écran" }),
        h('div', { class: 'field__control' },
          h('label', { class: 'switch' }, screenFlashInput,
            h('span', { text: "Utiliser l’écran comme lampe" }))),
        h('p', { class: 'field__hint' },
          "Solution de repli quand la lampe n’est pas pilotable, notamment sur iPhone. L’écran entier " +
          "s’allume au rythme du signal, mais seulement pendant l’émission : cocher la case ne change " +
          "rien à l’affichage. Touchez l’écran à tout moment pour arrêter. C’est efficace de nuit, mais " +
          "éprouvant pour l'œil et déconseillé aux personnes photosensibles ; à réserver à une émission " +
          "courte, à vitesse lente.")),
    ),

    h(
      'details',
      { class: 'help' },
      h('summary', { text: 'Notes sur la traduction' }),
      h('p', {},
        "Le morse ne distingue pas majuscules et minuscules : tout est ramène en majuscules. Les " +
        "caractères sans équivalent, comme les emoji, sont ignorés et signalés sous les champs."),
      h('p', {},
        "Dans le champ morse, un espace sépare deux caractères et une barre oblique sépare deux mots. " +
        "Les points typographiques et les tirets longs sont acceptés et convertis automatiquement, ce qui " +
        "permet de coller du morse recopié depuis à peu près n’importe quelle source."),
      h('p', {},
        "Un code inconnu tapé à la main sera quand même émis tel quel : le traducteur joue fidèlement ce " +
        "que vous avez écrit, il ne corrige pas."),
      h('p', {},
        "« Télécharger en WAV » produit un fichier audio de l’émission, à la vitesse et avec la tonalité " +
        "réglées. Le rendu se fait entièrement dans le navigateur, plus vite que le temps réel, et le " +
        "fichier s’ouvre partout sans codec particulier."),
    ),
  );

  return {
    element,
    destroy: () => {
      unsubscribe();
      player.stop();
      store.audio.stopNoise();
      torch.release();
      flashLayer.remove();
    },
  };
}
