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
  let open = false;
  let full: View | null = null;
  let lastFocus: HTMLElement | null = null;

  const quick = h('div', { class: 'panel__quick' });
  const fullHost = h('div', { class: 'panel__full' });
  const title = h('h2', { class: 'panel__title', text: 'Réglages' });

  const closeButton = h('button', {
    class: 'panel__close',
    type: 'button',
    text: '✕',
    attrs: { 'aria-label': 'Fermer les réglages' },
    on: { click: () => close() },
  });

  const veil = h('div', { class: 'panel-veil', attrs: { hidden: 'true' } });

  const panel = h(
    'aside',
    {
      class: 'panel',
      id: 'panneau-reglages',
      attrs: {
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'panneau-reglages-titre',
        hidden: 'true',
      },
    },
    h('header', { class: 'panel__head' }, title, closeButton),
    h('div', { class: 'panel__body' }, quick, fullHost),
  );
  title.id = 'panneau-reglages-titre';

  const button = h('button', {
    class: 'topbar__gear',
    type: 'button',
    attrs: {
      'aria-label': 'Réglages',
      'aria-controls': 'panneau-reglages',
      'aria-expanded': 'false',
      title: 'Réglages',
    },
    on: { click: () => toggle() },
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
    if (pending || !open) return;
    pending = window.requestAnimationFrame(() => {
      pending = 0;
      if (open) keepFocus(quick, drawQuick);
    });
  };
  const unsubscribe = store.subscribe(scheduleQuick);

  // --- Ouverture et fermeture ---

  const focusable = (): HTMLElement[] =>
    [...panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )].filter((element) => !element.hasAttribute('disabled') && element.offsetParent !== null);

  const onKeydown = (event: KeyboardEvent): void => {
    if (!open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    // Le focus reste dans le panneau tant qu'il est ouvert : c'est ce qui
    // distingue un dialogue d'un simple bloc posé par-dessus.
    const items = focusable();
    if (items.length === 0) return;
    const first = items[0] as HTMLElement;
    const last = items[items.length - 1] as HTMLElement;
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !panel.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const doOpen = (): void => {
    if (open) return;
    open = true;
    lastFocus = document.activeElement as HTMLElement | null;
    panel.hidden = false;
    veil.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    document.body.classList.add('panel-open');
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
    window.requestAnimationFrame(() => {
      panel.classList.add('is-open');
      focusable()[0]?.focus();
    });
  };

  const close = (): void => {
    if (!open) return;
    open = false;
    panel.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('panel-open');
    veil.hidden = true;
    // On laisse l'animation se terminer avant de retirer le panneau du flux.
    window.setTimeout(() => {
      if (!open) panel.hidden = true;
    }, 220);
    lastFocus?.focus();
    lastFocus = null;
  };

  const toggle = (): void => (open ? close() : doOpen());

  veil.addEventListener('click', close);
  document.addEventListener('keydown', onKeydown);

  return {
    nodes: [veil, panel],
    button,
    open: doOpen,
    close,
    toggle,
    setRoute: (path: string) => {
      route = path;
      if (open) drawQuick();
    },
    destroy: () => {
      if (pending) window.cancelAnimationFrame(pending);
      document.removeEventListener('keydown', onKeydown);
      unsubscribe();
      full?.destroy?.();
      full = null;
    },
  };
}
