/**
 * Page « Reglages ».
 *
 * Chaque reglage est accompagne d'une phrase qui dit a quoi il sert et quelle
 * valeur choisir : un trainer de morse expose forcement des notions techniques
 * (Farnsworth, mode iambique, unite de temps) qu'on ne peut pas deviner.
 */

import { h, field } from '../ui/dom.ts';
import { keyLabel } from '../ui/keys.ts';
import { MorsePlayer } from '../ui/player.ts';
import { SignalLamp } from '../ui/lamp.ts';
import { hapticsSupported } from '../core/haptics.ts';
import { KOCH_ORDERS, kochMaxLevel } from '../core/koch.ts';
import { buildSaveFile, downloadText, parseSaveFile, storageAvailable } from '../core/storage.ts';
import { DEFAULT_SETTINGS } from '../core/settings.ts';
import type { View, ViewContext } from '../ui/router.ts';

type BindingKey = 'keyStraight' | 'keyDit' | 'keyDah';

export function settingsView(context: ViewContext): View {
  const { store } = context;
  const lamp = new SignalLamp('Essai');
  const player = new MorsePlayer(store, lamp);
  const container = h('div', { class: 'stack' });

  let capturing: BindingKey | null = null;

  /** Curseur numerique avec sa valeur affichee, motif repete partout ici. */
  const slider = (
    options: {
      min: number;
      max: number;
      step?: number;
      value: number;
      format: (value: number) => string;
      onInput: (value: number) => void;
    },
  ): HTMLElement => {
    const output = h('output', { class: 'slider__value', text: options.format(options.value) });
    const input = h('input', {
      class: 'slider',
      type: 'range',
      attrs: {
        min: options.min,
        max: options.max,
        step: options.step ?? 1,
        value: options.value,
      },
      on: {
        input: (event) => {
          const value = Number((event.target as HTMLInputElement).value);
          output.textContent = options.format(value);
          options.onInput(value);
        },
      },
    });
    return h('div', { class: 'slider-row' }, input, output);
  };

  const captureButton = (key: BindingKey, label: string): HTMLElement => {
    const button = h('button', {
      class: 'btn btn--key',
      type: 'button',
      text: keyLabel(store.settings[key]),
      attrs: { 'aria-label': `${label} : ${keyLabel(store.settings[key])}. Cliquez pour changer.` },
      on: {
        click: () => {
          capturing = key;
          button.textContent = 'Appuyez sur une touche…';
          button.classList.add('is-capturing');
        },
      },
    });
    return button;
  };

  const onCaptureKey = (event: KeyboardEvent): void => {
    if (!capturing) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.code !== 'Escape') store.updateSettings({ [capturing]: event.code });
    capturing = null;
    render();
  };
  window.addEventListener('keydown', onCaptureKey, true);

  const exportSave = (): void => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadText(
      `morse-training-${stamp}.json`,
      JSON.stringify(buildSaveFile(store.settings, store.progress), null, 2),
    );
    context.toast('Sauvegarde exportee.', 'success');
  };

  const importInput = h('input', {
    type: 'file',
    attrs: { accept: 'application/json,.json', hidden: 'true' },
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
          context.toast('Sauvegarde importee.', 'success');
        });
        reader.readAsText(file);
        input.value = '';
      },
    },
  });

  const render = (): void => {
    const s = store.settings;
    const timing = store.timing;
    const paddleMode = s.keyerMode !== 'straight';

    container.replaceChildren(
      // --- Vitesse ---
      h(
        'section',
        { class: 'card' },
        h('h2', { class: 'card__title', text: 'Vitesse' }),
        field(
          'Vitesse des caracteres',
          slider({
            min: 5,
            max: 40,
            value: s.charWpm,
            format: (value) => `${value} WPM`,
            onInput: (value) => store.updateSettings({ charWpm: value }),
          }),
          `La vitesse a laquelle chaque caractere est emis. Une unite vaut actuellement ${Math.round(timing.unit * 1000)} ms. ` +
            'Reglez-la a 18 ou 20 WPM des le debut et ne la baissez plus : c’est la clef pour ne pas apprendre a compter les points.',
        ),
        field(
          'Vitesse globale (Farnsworth)',
          slider({
            min: 5,
            max: 40,
            value: s.effectiveWpm,
            format: (value) => `${value} WPM`,
            onInput: (value) => store.updateSettings({ effectiveWpm: value }),
          }),
          timing.farnsworth
            ? `Les silences sont etires : ${Math.round(timing.interChar * 1000)} ms entre deux caracteres au lieu de ${Math.round(timing.unit * 3000)} ms. C’est ce reglage qu’on augmente pour progresser.`
            : 'Egale a la vitesse des caracteres : aucun etirement des silences. Baissez-la pour vous laisser plus de temps entre les caracteres.',
        ),
        h(
          'div',
          { class: 'demo-row' },
          h('button', {
            class: 'btn',
            type: 'button',
            text: 'Ecouter un exemple',
            on: {
              click: () => {
                player.stop();
                void player.play('CQ DE F5ABC');
              },
            },
          }),
          lamp.element,
        ),
      ),

      // --- Son ---
      h(
        'section',
        { class: 'card' },
        h('h2', { class: 'card__title', text: 'Son' }),
        field(
          'Tonalite',
          slider({
            min: 300,
            max: 1200,
            step: 10,
            value: s.frequency,
            format: (value) => `${value} Hz`,
            onInput: (value) => store.updateSettings({ frequency: value }),
          }),
          'La plupart des operateurs se placent entre 550 et 750 Hz. Une tonalite trop aigue fatigue vite ; une tonalite trop grave se confond avec le bruit de fond.',
        ),
        field(
          'Volume',
          slider({
            min: 0,
            max: 100,
            value: Math.round(s.volume * 100),
            format: (value) => `${value} %`,
            onInput: (value) => store.updateSettings({ volume: value / 100 }),
          }),
        ),
        field(
          'Douceur de l’attaque',
          slider({
            min: 1,
            max: 20,
            value: s.rampMs,
            format: (value) => `${value} ms`,
            onInput: (value) => store.updateSettings({ rampMs: value }),
          }),
          'Duree de la montee et de la descente du son. En dessous de 3 ms apparaissent les « clics de manipulation », desagreables a l’oreille et mal vus en trafic reel.',
        ),
        field(
          'Forme d’onde',
          h(
            'select',
            {
              class: 'select',
              on: {
                change: (event) =>
                  store.updateSettings({
                    waveform: (event.target as HTMLSelectElement).value as typeof s.waveform,
                  }),
              },
            },
            ...(
              [
                ['sine', 'Sinusoide — pure, la plus proche d’un recepteur radio'],
                ['triangle', 'Triangle — legerement plus presente'],
                ['square', 'Carree — dure, tres percante'],
                ['sawtooth', 'Dent de scie — riche en harmoniques'],
              ] as const
            ).map(([value, label]) =>
              h('option', { value, text: label, attrs: { selected: s.waveform === value } }),
            ),
          ),
        ),
        h('p', { class: 'field__hint' },
          'Sur iPhone et iPad, le son du navigateur suit le bouton silencieux physique. Si vous n’entendez rien, verifiez-le avant tout le reste.'),
      ),

      // --- Manipulateur ---
      h(
        'section',
        { class: 'card' },
        h('h2', { class: 'card__title', text: 'Manipulateur' }),
        field(
          'Type de manipulateur',
          h(
            'select',
            {
              class: 'select',
              on: {
                change: (event) =>
                  store.updateSettings({
                    keyerMode: (event.target as HTMLSelectElement).value as typeof s.keyerMode,
                  }),
              },
            },
            ...(
              [
                ['straight', 'Manipulateur droit — une seule touche'],
                ['iambic-a', 'Palettes iambiques — mode A'],
                ['iambic-b', 'Palettes iambiques — mode B'],
              ] as const
            ).map(([value, label]) =>
              h('option', { value, text: label, attrs: { selected: s.keyerMode === value } }),
            ),
          ),
          'Au manipulateur droit, la duree de l’appui distingue le point du trait. Aux palettes, une touche donne les points, l’autre les traits, et l’electronique cale les durees. Le mode B ajoute un element apres un relachement en pince ; commencez par le mode A.',
        ),
        field(
          s.keyerMode === 'straight' ? 'Touche du manipulateur' : 'Touche des points',
          captureButton(s.keyerMode === 'straight' ? 'keyStraight' : 'keyDit', 'Touche'),
          'Cliquez sur le bouton puis appuyez sur la touche voulue. Echap annule.',
        ),
        paddleMode
          ? field('Touche des traits', captureButton('keyDah', 'Touche des traits'))
          : null,
        paddleMode
          ? field(
              'Inverser les palettes',
              h(
                'label',
                { class: 'switch' },
                h('input', {
                  type: 'checkbox',
                  attrs: { checked: s.swapPaddles },
                  on: {
                    change: (event) =>
                      store.updateSettings({ swapPaddles: (event.target as HTMLInputElement).checked }),
                  },
                }),
                h('span', { text: 'Points a droite, traits a gauche' }),
              ),
              'Pour les gauchers, ou simplement par habitude inverse.',
            )
          : null,
        field(
          'Seuil adaptatif',
          h(
            'label',
            { class: 'switch' },
            h('input', {
              type: 'checkbox',
              attrs: { checked: s.adaptiveKeying },
              on: {
                change: (event) =>
                  store.updateSettings({ adaptiveKeying: (event.target as HTMLInputElement).checked }),
              },
            }),
            h('span', { text: 'Suivre ma vitesse reelle de frappe' }),
          ),
          'Le decodeur ajuste la frontiere entre point et trait sur votre frappe plutot que sur la vitesse annoncee. A laisser active au manipulateur droit ; sans effet aux palettes, ou les durees sont generees.',
        ),
      ),

      // --- Sorties ---
      h(
        'section',
        { class: 'card' },
        h('h2', { class: 'card__title', text: 'Sorties visuelle et haptique' }),
        field(
          'Diode temoin',
          h(
            'label',
            { class: 'switch' },
            h('input', {
              type: 'checkbox',
              attrs: { checked: s.visualSignal },
              on: {
                change: (event) =>
                  store.updateSettings({ visualSignal: (event.target as HTMLInputElement).checked }),
              },
            }),
            h('span', { text: 'Allumer une diode pendant chaque signal' }),
          ),
          'La diode reste allumee exactement le temps du signal : une lueur breve pour un point, trois fois plus longue pour un trait. Aucun clignotement plein ecran, qui serait epuisant et risque pour les personnes photosensibles.',
        ),
        field(
          'Retour haptique',
          h(
            'label',
            { class: 'switch' },
            h('input', {
              type: 'checkbox',
              attrs: { checked: s.haptics, disabled: !hapticsSupported() },
              on: {
                change: (event) =>
                  store.updateSettings({ haptics: (event.target as HTMLInputElement).checked }),
              },
            }),
            h('span', { text: 'Vibrer au rythme du morse' }),
          ),
          hapticsSupported()
            ? 'Le motif complet est confie au systeme d’un seul coup, ce qui donne un rythme bien plus regulier qu’une suite d’appels. Au manipulateur droit, la vibration dure exactement le temps de l’appui.'
            : 'Votre navigateur n’expose pas l’API Vibration. C’est le cas de Safari sur iPhone et iPad : aucune interface web ne permet d’y piloter le moteur haptique. Sur Android avec Chrome ou Firefox, la fonction est disponible.',
        ),
        field(
          'Sons de l’interface',
          h(
            'label',
            { class: 'switch' },
            h('input', {
              type: 'checkbox',
              attrs: { checked: s.uiSounds },
              on: {
                change: (event) =>
                  store.updateSettings({ uiSounds: (event.target as HTMLInputElement).checked }),
              },
            }),
            h('span', { text: 'Confirmation et erreur' }),
          ),
        ),
      ),

      // --- Apprentissage ---
      h(
        'section',
        { class: 'card' },
        h('h2', { class: 'card__title', text: 'Apprentissage' }),
        field(
          'Ordre d’introduction des caracteres',
          h(
            'select',
            {
              class: 'select',
              on: {
                change: (event) =>
                  store.updateSettings({
                    kochOrder: (event.target as HTMLSelectElement).value as typeof s.kochOrder,
                  }),
              },
            },
            ...KOCH_ORDERS.map((order) =>
              h('option', { value: order.id, text: order.label, attrs: { selected: s.kochOrder === order.id } }),
            ),
          ),
          KOCH_ORDERS.find((order) => order.id === s.kochOrder)?.description ?? '',
        ),
        field(
          'Seuil pour debloquer un caractere',
          slider({
            min: 60,
            max: 100,
            step: 5,
            value: Math.round(s.kochThreshold * 100),
            format: (value) => `${value} %`,
            onInput: (value) => store.updateSettings({ kochThreshold: value / 100 }),
          }),
          'Precision a atteindre sur une serie avant d’ajouter le caractere suivant. Le seuil classique est 90 %.',
        ),
        field(
          'Longueur d’une serie',
          slider({
            min: 10,
            max: 60,
            step: 5,
            value: s.sessionLength,
            format: (value) => `${value} caracteres`,
            onInput: (value) => store.updateSettings({ sessionLength: value }),
          }),
          'Des series courtes et repetees valent mieux qu’une seance interminable.',
        ),
        field(
          'Niveau Koch',
          h(
            'div',
            { class: 'inline-controls' },
            h('button', {
              class: 'btn',
              type: 'button',
              text: '−',
              attrs: { 'aria-label': 'Retirer un caractere' },
              on: {
                click: () =>
                  store.mutateProgress((progress) => {
                    progress.kochLevel = Math.max(2, progress.kochLevel - 1);
                  }),
              },
            }),
            h('span', { class: 'inline-controls__value', text: `${store.progress.kochLevel} / ${kochMaxLevel(s.kochOrder)}` }),
            h('button', {
              class: 'btn',
              type: 'button',
              text: '+',
              attrs: { 'aria-label': 'Ajouter un caractere' },
              on: {
                click: () =>
                  store.mutateProgress((progress) => {
                    progress.kochLevel = Math.min(kochMaxLevel(s.kochOrder), progress.kochLevel + 1);
                  }),
              },
            }),
          ),
          'Le niveau monte normalement tout seul a la fin d’une serie reussie. Ce reglage sert a reprendre plus haut si vous connaissez deja une partie du code.',
        ),
      ),

      // --- Apparence ---
      h(
        'section',
        { class: 'card' },
        h('h2', { class: 'card__title', text: 'Apparence' }),
        field(
          'Theme',
          h(
            'div',
            { class: 'segmented', attrs: { role: 'group', 'aria-label': 'Theme' } },
            ...(
              [
                ['auto', 'Systeme'],
                ['dark', 'Sombre'],
                ['light', 'Clair'],
              ] as const
            ).map(([value, label]) =>
              h('button', {
                class: `segmented__item${s.theme === value ? ' is-active' : ''}`,
                type: 'button',
                text: label,
                on: { click: () => store.updateSettings({ theme: value }) },
              }),
            ),
          ),
        ),
      ),

      // --- Donnees ---
      h(
        'section',
        { class: 'card' },
        h('h2', { class: 'card__title', text: 'Mes donnees' }),
        h('p', { class: 'card__hint' },
          storageAvailable()
            ? 'Reglages et progression sont enregistres dans ce navigateur uniquement. Rien n’est envoye sur un serveur, il n’y a ni compte ni suivi.'
            : 'Le stockage local est indisponible (navigation privee ?). Votre progression sera perdue en fermant l’onglet ; pensez a exporter.'),
        h(
          'div',
          { class: 'actions' },
          h('button', { class: 'btn btn--primary', type: 'button', text: 'Exporter en JSON', on: { click: exportSave } }),
          h('button', {
            class: 'btn',
            type: 'button',
            text: 'Importer',
            on: { click: () => importInput.click() },
          }),
          importInput,
          h('button', {
            class: 'btn btn--ghost',
            type: 'button',
            text: 'Reglages par defaut',
            on: {
              click: () => {
                store.updateSettings({ ...DEFAULT_SETTINGS });
                context.toast('Reglages remis a zero.', 'info');
                render();
              },
            },
          }),
          h('button', {
            class: 'btn btn--danger',
            type: 'button',
            text: 'Effacer ma progression',
            on: {
              click: () => {
                if (!window.confirm('Effacer definitivement statistiques, niveau et succes ? Cette action est irreversible.')) return;
                store.resetProgress();
                context.toast('Progression effacee.', 'info');
              },
            },
          }),
        ),
      ),
    );
  };

  render();
  const unsubscribe = store.subscribe(render);

  return {
    element: container,
    destroy: () => {
      window.removeEventListener('keydown', onCaptureKey, true);
      unsubscribe();
      player.stop();
    },
  };
}
