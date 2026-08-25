/**
 * Panneau de réglages en superposition.
 *
 * Changer la vitesse au milieu d'une séance obligeait jusqu'ici à quitter la
 * page d'entraînement — donc à perdre la série en cours. Le panneau règle ce
 * défaut : il se pose par-dessus, la page dessous reste vivante, et sa session
 * continue.
 *
 * Il montre d'abord les réglages qui concernent la page ouverte, puis tous les
 * autres. L'ordre n'est pas cosmétique : pendant une écoute, la vitesse et le
 * son sont les seuls réglages qu'on veuille toucher, et les chercher parmi
 * huit sections est exactement ce qu'on ne peut pas faire d'une main.
 */

import { h } from './dom.ts';
import { createOverlay } from './overlay.ts';
import { keepFocus, slider } from './controls.ts';
import { bandNoiseSupported, presetForDb, SNR_PRESETS } from '../core/noise.ts';
import { settingsView } from '../views/settings.ts';
import type { AppStore } from '../core/store.ts';
import type { View, ViewContext } from './router.ts';
import type { Theme } from '../core/settings.ts';

export interface SettingsPanel {
  /** Les éléments à insérer dans la page : le voile puis le panneau. */
  nodes: HTMLElement[];
  button: HTMLButtonElement;
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Signale la page affichée, pour choisir les réglages mis en avant. */
  setRoute: (path: string) => void;
  destroy: () => void;
}

type ContextKind = 'audio' | 'keyer' | 'reading';

/**
 * Ce qu'on met en avant selon la page ouverte.
 *
 * L'écoute et les outils sonores appellent la vitesse et le son ; l'émission y
 * ajoute le manipulateur ; les pages de lecture n'ont besoin que du confort
 * d'affichage.
 */
function contextFor(path: string): ContextKind {
  if (path.startsWith('/entrainement/emission')) return 'keyer';
  if (path.startsWith('/entrainement') || path.startsWith('/outils')) return 'audio';
  return 'reading';
}

const CONTEXT_TITLES: Record<ContextKind, string> = {
  audio: 'Pour cette séance',
  keyer: 'Pour cette séance',
  reading: 'Pour cette page',
};

export function createSettingsPanel(store: AppStore, context: ViewContext): SettingsPanel {
  let route = '/';
  let full: View | null = null;

  const quick = h('div', { class: 'panel__quick' });
  const fullHost = h('div', { class: 'panel__full' });

  const overlay = createOverlay({
    id: 'panneau-reglages',
    title: 'Réglages',
    onOpen: () => {
      drawQuick();
      // La page complète des réglages n'est construite qu'à la première
      // ouverture : elle instancie un lecteur audio et une diode témoin, qu'il
      // serait absurde de tenir prêts en permanence.
      if (!full) {
        full = settingsView(context);
        fullHost.replaceChildren(
          h('h3', { class: 'panel__section', text: 'Tous les réglages' }),
          full.element,
        );
      }
      button.setAttribute('aria-expanded', 'true');
    },
    onClose: () => button.setAttribute('aria-expanded', 'false'),
  });
  overlay.body.append(quick, fullHost);

  const button = h('button', {
    class: 'topbar__action topbar__gear',
    type: 'button',
    attrs: {
      'aria-label': 'Réglages',
      'aria-controls': 'panneau-reglages',
      'aria-expanded': 'false',
      title: 'Réglages',
    },
    on: {
      click: () => {
        overlay.toggle();
        button.setAttribute('aria-expanded', String(overlay.isOpen()));
      },
    },
  }) as HTMLButtonElement;
  button.append(h('span', { class: 'topbar__gear-icon', text: '⚙', attrs: { 'aria-hidden': 'true' } }));

  // --- Réglages mis en avant ---

  const drawQuick = (): void => {
    const s = store.settings;
    const timing = store.timing;
    const kind = contextFor(route);
    const blocks: HTMLElement[] = [];

    const row = (label: string, control: Node, hint?: string): HTMLElement =>
      h(
        'div',
        { class: 'panel__row' },
        h('span', { class: 'panel__label', text: label }),
        control,
        hint ? h('p', { class: 'panel__hint', text: hint }) : null,
      );

    // Les pages de cours ont elles aussi des exemples à écouter : la tonalité et
    // le volume y servent, même si la vitesse n'y change rien.
    const soundRows = (): HTMLElement[] => [
      row(
        'Tonalité',
        slider({
          min: 300,
          max: 1200,
          step: 10,
          value: s.frequency,
          format: (value) => String(value),
          unit: 'Hz',
          id: 'quick-frequency',
          label: 'Tonalité, en hertz',
          onInput: (value) => store.updateSettings({ frequency: value }),
        }),
      ),
      row(
        'Volume',
        slider({
          min: 0,
          max: 100,
          value: Math.round(s.volume * 100),
          format: (value) => String(value),
          unit: '%',
          id: 'quick-volume',
          label: 'Volume, en pourcentage',
          onInput: (value) => store.updateSettings({ volume: value / 100 }),
        }),
      ),
    ];

    if (kind === 'audio' || kind === 'keyer') {
      blocks.push(
        row(
          'Vitesse des caractères',
          slider({
            min: 5,
            max: 40,
            value: s.charWpm,
            format: (value) => String(value),
            unit: 'WPM',
            id: 'quick-charWpm',
            label: 'Vitesse des caractères, en mots par minute',
            onInput: (value) => store.updateSettings({ charWpm: value }),
          }),
          `Une unité vaut ${Math.round(timing.unit * 1000)} ms.`,
        ),
        row(
          'Vitesse globale',
          slider({
            min: 5,
            max: 40,
            value: s.effectiveWpm,
            format: (value) => String(value),
            unit: 'WPM',
            id: 'quick-effectiveWpm',
            label: 'Vitesse globale, en mots par minute',
            onInput: (value) => store.updateSettings({ effectiveWpm: value }),
          }),
          timing.farnsworth
            ? `Silences étirés : ${Math.round(timing.interChar * 1000)} ms entre deux caractères.`
            : 'Aucun étirement des silences.',
        ),
        ...soundRows(),
      );

      if (bandNoiseSupported()) {
        blocks.push(
          row(
            'Bruit de fond',
            h(
              'div',
              { class: 'panel__inline' },
              h(
                'label',
                { class: 'switch' },
                h('input', {
                  type: 'checkbox',
                  attrs: { checked: s.noiseEnabled, 'data-focus-key': 'quick-noise' },
                  on: {
                    change: (event) =>
                      store.updateSettings({ noiseEnabled: (event.target as HTMLInputElement).checked }),
                  },
                }),
                h('span', { text: s.noiseEnabled ? 'Actif' : 'Coupé' }),
              ),
              s.noiseEnabled
                ? h(
                    'div',
                    { class: 'segmented' },
                    ...SNR_PRESETS.map((preset) =>
                      h('button', {
                        class: `segmented__item${presetForDb(s.noiseSnrDb).id === preset.id ? ' is-active' : ''}`,
                        type: 'button',
                        text: preset.label,
                        attrs: { 'data-focus-key': `quick-snr-${preset.id}` },
                        on: { click: () => store.updateSettings({ noiseSnrDb: preset.db }) },
                      }),
                    ),
                  )
                : null,
            ),
          ),
        );
      }
    }

    if (kind === 'keyer') {
      blocks.push(
        row(
          'Frappe indulgente',
          h(
            'label',
            { class: 'switch' },
            h('input', {
              type: 'checkbox',
              attrs: { checked: s.forgivingKeying, 'data-focus-key': 'quick-forgiving' },
              on: {
                change: (event) =>
                  store.updateSettings({ forgivingKeying: (event.target as HTMLInputElement).checked }),
              },
            }),
            h('span', { text: s.forgivingKeying ? 'Sans contrainte de temps' : 'Chronométrée' }),
          ),
        ),
      );
    }

    // L'apparence est utile partout, mais elle passe en premier sur les pages
    // qui se lisent, où c'est le seul réglage qui change quelque chose.
    const themeControl = row(
      'Thème',
      h(
        'div',
        { class: 'segmented' },
        ...(
          [
            ['auto', 'Automatique'],
            ['dark', 'Sombre'],
            ['light', 'Clair'],
          ] as Array<[Theme, string]>
        ).map(([value, label]) =>
          h('button', {
            class: `segmented__item${s.theme === value ? ' is-active' : ''}`,
            type: 'button',
            text: label,
            attrs: { 'data-focus-key': `quick-theme-${value}` },
            on: { click: () => store.updateSettings({ theme: value }) },
          }),
        ),
      ),
    );
    if (kind === 'reading') blocks.push(themeControl, ...soundRows());
    else blocks.push(themeControl);

    quick.replaceChildren(
      h('h3', { class: 'panel__section', text: CONTEXT_TITLES[kind] }),
      ...blocks,
    );
  };

  // Même différé que la page Réglages, et pour les mêmes raisons.
  let pending = 0;
  const scheduleQuick = (): void => {
    if (pending || !overlay.isOpen()) return;
    pending = window.requestAnimationFrame(() => {
      pending = 0;
      if (overlay.isOpen()) keepFocus(quick, drawQuick);
    });
  };
  const unsubscribe = store.subscribe(scheduleQuick);

  return {
    nodes: overlay.nodes,
    button,
    open: overlay.open,
    close: overlay.close,
    toggle: overlay.toggle,
    setRoute: (path: string) => {
      route = path;
      if (overlay.isOpen()) drawQuick();
    },
    destroy: () => {
      if (pending) window.cancelAnimationFrame(pending);
      overlay.destroy();
      unsubscribe();
      full?.destroy?.();
      full = null;
    },
  };
}
