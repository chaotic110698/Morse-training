/**
 * Le choix de l'habit.
 *
 * La galerie se construit à partir du registre : ajouter un thème ne demande
 * de toucher ni à ce fichier ni aux vues qui l'emploient. Chaque vignette est
 * une miniature de l'interface peinte avec les couleurs du thème — un fond,
 * une surface, une ligne de texte et le voyant — parce qu'une pastille de
 * couleur ne dit pas ce que l'habit fera d'une page.
 *
 * Deux formes : la galerie complète pour la page des réglages, et une rangée
 * compacte pour le panneau d'accès rapide, où la place manque.
 */

import { field, h } from './dom.ts';
import { resolveThemeId, THEMES, themeById } from '../data/themes.ts';
import type { AppStore } from '../core/store.ts';

export interface ThemePickerOptions {
  store: AppStore;
  /** Rangée de vignettes sans texte, pour le panneau latéral. */
  compact?: boolean;
  /** Préfixe des clés de navigation au clavier, dans le panneau. */
  focusPrefix?: string;
}

/** La miniature : un fond, une surface, une ligne de texte, un voyant. */
function preview(swatch: readonly [string, string, string, string]): HTMLElement {
  const [bg, surface, accent, text] = swatch;
  return h(
    'span',
    { class: 'habit__apercu', attrs: { 'aria-hidden': 'true' }, style: { background: bg } },
    h(
      'span',
      { class: 'habit__carte', style: { background: surface } },
      h('span', { class: 'habit__ligne', style: { background: text } }),
      h('span', { class: 'habit__ligne habit__ligne--courte', style: { background: text } }),
    ),
    h('span', { class: 'habit__voyant', style: { background: accent } }),
  );
}

export function createThemePicker(options: ThemePickerOptions): HTMLElement {
  const { store, compact = false } = options;

  const entries: Array<{ id: string; name: string; blurb: string; swatch: readonly [string, string, string, string] }> = [
    {
      id: 'auto',
      name: 'Automatique',
      blurb: 'Suit la lumière du système : sombre le soir, clair le jour.',
      // La vignette de l'automatique emprunte les deux références, moitié-moitié.
      swatch: ['#0b1015', '#eef2f6', '#ffb545', '#93a3b3'],
    },
    ...THEMES.map((theme) => ({
      id: theme.id,
      name: theme.name,
      blurb: theme.blurb,
      swatch: theme.swatch as readonly [string, string, string, string],
    })),
  ];

  const chosen = store.settings.theme;
  // Quand on suit la lumière du système, l'habit appliqué n'est pas toujours
  // celui sur lequel on a cliqué. La galerie doit le dire, sans quoi le choix
  // paraît ignoré.
  const applied = resolveThemeId(
    chosen,
    store.settings.themeFollowsSystem,
    window.matchMedia('(prefers-color-scheme: light)').matches,
  );

  return h(
    'div',
    {
      class: `habits${compact ? ' habits--compact' : ''}`,
      attrs: { role: 'group', 'aria-label': 'Habit du site' },
    },
    ...entries.map((entry) =>
      h(
        'button',
        {
          class: `habit${entry.id !== chosen && entry.id === applied ? ' habit--appliquee' : ''}`,
          type: 'button',
          attrs: {
            'aria-pressed': String(entry.id === chosen),
            ...(compact ? { title: `${entry.name} — ${entry.blurb}` } : {}),
            ...(options.focusPrefix ? { 'data-focus-key': `${options.focusPrefix}-${entry.id}` } : {}),
          },
          on: { click: () => store.updateSettings({ theme: entry.id }) },
        },
        preview(entry.swatch),
        compact
          ? h('span', { class: 'habit__nom', text: entry.name })
          : h(
              'span',
              { class: 'habit__dit' },
              h('span', { class: 'habit__nom', text: entry.name }),
              h('span', {
                class: 'habit__quoi',
                text:
                  entry.id !== chosen && entry.id === applied
                    ? `Appliqué en ce moment : votre appareil est réglé en ${
                        themeById(applied).lightness
                      }.`
                    : entry.blurb,
              }),
            ),
      ),
    ),
  );
}

/**
 * Les deux réglages qui accompagnent l'habit. Ils ne s'affichent que lorsqu'ils
 * changent quelque chose : proposer « police d'époque » sous un habit qui n'en
 * a pas serait un interrupteur mort.
 */
export function createThemeOptions(store: AppStore): HTMLElement[] {
  const chosen = store.settings.theme;
  const theme = chosen === 'auto' ? null : themeById(chosen);
  const rows: HTMLElement[] = [];

  const toggle = (
    checked: boolean,
    label: string,
    onChange: (value: boolean) => void,
  ): HTMLElement =>
    h(
      'label',
      { class: 'switch' },
      h('input', {
        type: 'checkbox',
        attrs: { checked },
        on: {
          change: (event: Event) => onChange((event.target as HTMLInputElement).checked),
        },
      }),
      h('span', { text: label }),
    );

  if (theme?.twin) {
    const twin = themeById(theme.twin);
    rows.push(
      field(
        'Lumière',
        toggle(store.settings.themeFollowsSystem, 'Suivre la lumière du système', (value) =>
          store.updateSettings({ themeFollowsSystem: value }),
        ),
        `Bascule entre « ${theme.name} » et « ${twin.name} » selon que votre appareil est réglé en clair ou en sombre.`,
      ),
    );
  }

  if (theme?.period) {
    rows.push(
      field(
        'Police',
        toggle(store.settings.periodFont, 'Police d’époque', (value) =>
          store.updateSettings({ periodFont: value }),
        ),
        'Des empattements à la place de la police du système, et les émojis de la navigation perdent leur éclat. Rien à télécharger : l’empilement est celui de votre appareil.',
      ),
    );
  }

  return rows;
}
