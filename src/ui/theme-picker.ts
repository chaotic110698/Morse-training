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
import { resolveThemeId, THEMES, themeById, type LightSource } from '../data/themes.ts';
import type { AppStore } from '../core/store.ts';
import type { Ambience } from '../core/settings.ts';

/** Ce que chaque source éclaire, dit en une phrase sous le réglage. */
const LIGHT_BLURB: Record<Exclude<LightSource, 'aucune'>, string> = {
  fenetre: 'Le jour entre par la gauche et dérive lentement, comme un ciel où passent des nuages.',
  bougie: 'Une flamme ne respire pas régulièrement : elle saute, et la lumière penche avec elle.',
  filament: 'L’ampoule est bien plus stable qu’une flamme, mais le réseau lui fait de loin en loin un petit creux.',
  tube: 'Un néon de bureau est parfaitement égal, sauf deux fois par minute.',
  neon: 'Deux enseignes de couleurs opposées, et l’une des deux bafouille par salves avant de se tenir tranquille.',
  phare: 'Quatorze secondes d’obscurité pour deux de lumière : le pinceau du phare traverse la pièce, puis plus rien.',
  orage: 'La pluie mange la lumière, et deux éclairs lointains passent coup sur coup — le second est toujours le plus fort.',
  aube: 'La seule qui ne se répète pas : la pièce part du gris-bleu d’avant le jour et se réchauffe pendant trois minutes, une fois.',
  braise: 'La seule qui éclaire par en dessous. Elle respire, et de loin en loin une bûche s’ouvre.',
  veilleuse: 'L’éclairage de veille ne bouge presque pas — c’est son métier — sauf le creux d’une charge qui s’enclenche, toutes les vingt secondes.',
  intensificateur: 'Un tube intensificateur grésille en permanence : un grain très fin, et les bords qui s’assombrissent.',
  frontale: 'La lampe est sur votre tête : elle dérive quand vous bougez, et papillote quand le contact est mauvais.',
  phosphore: 'Les lignes de balayage, et la barre de retour qui redescend l’écran toutes les sept secondes.',
  boreale: 'Les rideaux de l’aurore ondulent au-dessus de la station, sans jamais repasser deux fois au même endroit.',
  cadran: 'La lampe du cadran chauffe pendant vingt secondes en s’allumant, puis se tient, avec le souffle du secteur.',
};

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

  // Celui-ci vaut pour tous les habits, y compris les deux modernes : c'est le
  // mode histoire qui prête l'habit, pas l'habit qui l'appelle.
  rows.push(
    field(
      'Mode histoire',
      toggle(store.settings.storyTheme, 'Suivre l’époque de l’épisode', (value) =>
        store.updateSettings({ storyTheme: value }),
      ),
      'Chaque épisode s’ouvre dans l’habit de son année, comme il choisit déjà son grain sonore : le registre de papier en 1844, la cabine à la lampe en 1901, le poste de campagne en 1944. Votre habit vous est rendu en sortant.',
    ),
  );

  if (theme && theme.light !== 'aucune') {
    rows.push(
      field(
        'Ambiance',
        h(
          'div',
          { class: 'segmented', attrs: { role: 'group', 'aria-label': 'Force de l’ambiance' } },
          ...(
            [
              ['aucune', 'Aucune'],
              ['discrete', 'Discrète'],
              ['marquee', 'Marquée'],
            ] as Array<[Ambience, string]>
          ).map(([value, label]) =>
            h('button', {
              class: `segmented__item${store.settings.ambience === value ? ' is-active' : ''}`,
              type: 'button',
              text: label,
              on: { click: () => store.updateSettings({ ambience: value }) },
            }),
          ),
        ),
        `${LIGHT_BLURB[theme.light]} Le mouvement s’arrête de lui-même si votre appareil demande moins d’animation.`,
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
