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
  let screenFlashEnabled = false;

  // --- Flash d'écran ---

  // Un voile plein écran, créé une seule fois et seulement s'il est demandé :
  // il porte un avertissement, car un clignotement rapide plein écran est
  // pénible et déconseillé aux personnes photosensibles.
  const flashLayer = h('div', { class: 'flash-layer', attrs: { 'aria-hidden': 'true' } });

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
      ? `Durée à l'émission : ${seconds < 60 ? `${seconds.toFixed(1)} s` : `${Math.floor(seconds / 60)} min ${Math.round(seconds % 60)} s`}` +
        ` · ${store.settings.charWpm} WPM` +
        (uniqueUnknown.length > 0 ? ` · caractères sans code morse ignorés : ${uniqueUnknown.join(' ')}` : '')
      : '';
    playButton.disabled = elements.length === 0;
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
    torch.set(false);
    flashLayer.classList.remove('is-lit');
    playButton.textContent = 'Émettre';
    renderStrip();
  };

  const play = async (): Promise<void> => {
    const elements = currentElements();
    if (elements.length === 0) return;
    playButton.textContent = 'Arrêter';

    await player.playElements(elements, {
      onChar: (index) => renderStrip(index),
      onSignal: (on) => {
        if (torchEnabled) torch.set(on);
        if (screenFlashEnabled) flashLayer.classList.toggle('is-lit', on);
      },
      onEnd: () => {
        torch.set(false);
        flashLayer.classList.remove('is-lit');
        playButton.textContent = 'Émettre';
        renderStrip();
      },
    });
  };

  // --- Sorties lumineuses ---

  const torchNote = h('p', { class: 'field__hint' });
  const torchInput = h('input', {
    type: 'checkbox',
    attrs: { disabled: !torchPossiblySupported() },
    on: {
      change: async (event) => {
        const input = event.target as HTMLInputElement;
        if (!input.checked) {
          torchEnabled = false;
          torch.release();
          renderTorchNote();
          return;
        }
        const result = await torch.acquire();
        if (!result.ok) {
          input.checked = false;
          torchEnabled = false;
          context.toast(result.message ?? "La lampe n'a pas pu être activée.", 'error');
          renderTorchNote(result.message);
          return;
        }
        torchEnabled = true;
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
        "Ce navigateur ne permet pas de piloter la lampe. C'est notamment le cas de Safari sur iPhone et iPad : aucune interface web n'y donne accès au flash. Le flash d'écran ci-dessous reste disponible.";
      return;
    }
    torchNote.textContent = torchEnabled
      ? `Lampe prête. La caméra arrière reste ouverte tant que l'option est active. Au-delà de ${TORCH_MAX_WPM} mots par minute, la commutation du flash ne suit plus : baissez la vitesse pour un signal lisible.`
      : `Passe par la caméra arrière, seul chemin qu'offre le web vers le flash : l'autorisation caméra sera demandée. À utiliser vers ${TORCH_MAX_WPM} mots par minute au plus.`;
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
        "le relire en clair. Le résultat s'écoute, s'affiche sur la diode, et peut piloter la lampe du " +
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
          h('label', { class: 'switch' }, torchInput, h('span', { text: 'Piloter le flash du téléphone' }))),
        torchNote),
      h('div', { class: 'field' },
        h('div', { class: 'field__label', text: "Flash de l'écran" }),
        h('div', { class: 'field__control' },
          h('label', { class: 'switch' }, screenFlashInput,
            h('span', { text: "Utiliser l'écran comme lampe" }))),
        h('p', { class: 'field__hint' },
          "Solution de repli quand la lampe n'est pas pilotable, notamment sur iPhone. L'écran entier " +
          "s'allume au rythme du signal : c'est efficace de nuit, mais éprouvant pour l'œil et " +
          "déconseillé aux personnes photosensibles. À réserver à une émission courte, à vitesse lente.")),
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
        "permet de coller du morse recopié depuis à peu près n'importe quelle source."),
      h('p', {},
        "Un code inconnu tape à la main sera quand même émis tel quel : le traducteur joue fidèlement ce " +
        "que vous avez écrit, il ne corrige pas."),
    ),
  );

  return {
    element,
    destroy: () => {
      unsubscribe();
      player.stop();
      torch.release();
      flashLayer.remove();
    },
  };
}
