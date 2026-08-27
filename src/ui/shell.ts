/**
 * Ossature de l'application : bandeau latéral, en-tête et zone de contenu.
 *
 * Sur ordinateur le bandeau reste ouvert en permanence, avec des sections
 * repliables. Sur téléphone il devient un tiroir qui glisse par-dessus la page
 * et se referme dès qu'on choisit une destination — même balisage, même code,
 * seule la mise en page change.
 */

import { h } from './dom.ts';
import { createSettingsPanel, type SettingsPanel } from './settings-panel.ts';
import { createGlossaryPanel, type GlossaryPanel } from './glossary-panel.ts';
import { createGlossaryMarker } from './glossary-mark.ts';
import { createSearchPanel, type SearchPanel } from './search-panel.ts';
import { createSavePanel, type SavePanel } from './save-panel.ts';
import { NAV_GROUPS, ROUTES } from '../views/routes.ts';
import { LICENCE_HUB, locate } from '../data/licence-syllabus.ts';
import type { RouteDefinition, ToastKind } from './router.ts';
import type { AppStore } from '../core/store.ts';
import { resolveThemeId, themeById } from '../data/themes.ts';
import type { Theme } from '../core/settings.ts';

const COLLAPSED_KEY = 'morse-training/nav-collapsed';

export interface Shell {
  outlet: HTMLElement;
  toast: (message: string, kind?: ToastKind) => void;
  setActiveRoute: (route: RouteDefinition) => void;
  /** Le panneau de réglages, monté par l'ossature et piloté par elle. */
  settingsPanel: SettingsPanel;
  /** Le lexique, disponible depuis n'importe quelle page. */
  glossaryPanel: GlossaryPanel;
  /** La recherche globale, ouverte par la loupe ou par Ctrl+K. */
  searchPanel: SearchPanel;
  /** La sauvegarde du récit, montrée seulement dans le mode histoire. */
  savePanel: SavePanel;
}

export function createShell(root: HTMLElement, store: AppStore): Shell {
  const outlet = h('div', { class: 'outlet' });
  const pageTitle = h('h1', { class: 'page__title' });
  const pageDescription = h('p', { class: 'page__description' });
  const breadcrumb = h('nav', { class: 'crumbs', attrs: { 'aria-label': 'Fil d’Ariane' } });
  const chapterNav = h('nav', { class: 'chapter-nav', attrs: { 'aria-label': 'Chapitre précédent et suivant' } });
  const toasts = h('div', { class: 'toasts', attrs: { 'aria-live': 'polite', 'aria-atomic': 'false' } });
  const navLinks = new Map<string, HTMLAnchorElement>();

  // --- Sections repliables ---

  const collapsed = new Set<string>(readCollapsed());

  function readCollapsed(): string[] {
    try {
      const raw = window.localStorage.getItem(COLLAPSED_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }

  function persistCollapsed(): void {
    try {
      window.localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...collapsed]));
    } catch {
      // Le repliage du menu n'est qu'un confort : on ignore l'échec.
    }
  }

  const nav = h('nav', { class: 'nav', attrs: { 'aria-label': 'Navigation principale' } });

  for (const group of NAV_GROUPS) {
    const routes = ROUTES.filter((route) => route.group === group.id && route.menu !== false);
    if (routes.length === 0) continue;

    const list = h(
      'ul',
      { class: 'nav__list' },
      ...routes.map((route) => {
        const link = h(
          'a',
          { class: 'nav__link', href: `#${route.path}` },
          h('span', { class: 'nav__icon', text: route.icon, attrs: { 'aria-hidden': 'true' } }),
          h('span', { class: 'nav__label', text: route.label }),
        );
        navLinks.set(route.path, link);
        return h('li', {}, link);
      }),
    );

    // Un groupe d'une seule page n'a pas de titre repliable : le lien suffit.
    if (routes.length === 1 && routes[0]?.label === group.label) {
      nav.append(h('div', { class: 'nav__group nav__group--flat' }, list));
      continue;
    }

    const toggle = h(
      'button',
      {
        class: 'nav__toggle',
        type: 'button',
        attrs: { 'aria-expanded': String(!collapsed.has(group.id)) },
      },
      h('span', { class: 'nav__toggle-label', text: group.label }),
      h('span', { class: 'nav__chevron', attrs: { 'aria-hidden': 'true' } }),
    );

    const section = h('div', { class: 'nav__group' }, toggle, list);
    if (collapsed.has(group.id)) section.classList.add('is-collapsed');

    toggle.addEventListener('click', () => {
      const isCollapsed = section.classList.toggle('is-collapsed');
      toggle.setAttribute('aria-expanded', String(!isCollapsed));
      if (isCollapsed) collapsed.add(group.id);
      else collapsed.delete(group.id);
      persistCollapsed();
    });

    nav.append(section);
  }

  // --- Tiroir mobile ---

  const overlay = h('div', { class: 'overlay', attrs: { hidden: 'true' } });
  const sidebar = h(
    'aside',
    { class: 'sidebar', id: 'sidebar' },
    h(
      'div',
      { class: 'sidebar__brand' },
      h('span', { class: 'sidebar__mark', attrs: { 'aria-hidden': 'true' }, text: '· –' }),
      h('span', { class: 'sidebar__name', text: 'Morse Training' }),
    ),
    nav,
    h(
      'div',
      { class: 'sidebar__footer' },
      h('p', { text: 'Fonctionne hors ligne. Aucune donnée ne quitte votre appareil.' }),
      h('p', { class: 'sidebar__version', text: `Version du ${__BUILD_STAMP__}` }),
    ),
  );

  const openDrawer = (): void => {
    document.body.classList.add('drawer-open');
    overlay.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
  };
  const closeDrawer = (): void => {
    document.body.classList.remove('drawer-open');
    overlay.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
  };

  const burger = h(
    'button',
    {
      class: 'burger',
      type: 'button',
      attrs: { 'aria-label': 'Ouvrir le menu', 'aria-controls': 'sidebar', 'aria-expanded': 'false' },
      on: {
        click: () => (document.body.classList.contains('drawer-open') ? closeDrawer() : openDrawer()),
      },
    },
    h('span', { class: 'burger__bars', attrs: { 'aria-hidden': 'true' } }),
  );

  overlay.addEventListener('click', closeDrawer);
  nav.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('a')) closeDrawer();
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeDrawer();
  });

  // --- Thème ---

  const media = window.matchMedia('(prefers-color-scheme: light)');

  /**
   * Traduit l'habit choisi en attributs sur la racine.
   *
   * Rien ici ne connaît un thème par son nom : on lit ses traits dans le
   * registre et on les estampille. Le style s'accroche ensuite aux traits, si
   * bien qu'un habit ajouté demain hérite de tout ce qui a été écrit pour sa
   * lumière ou pour ses empattements.
   */
  const applyTheme = (): void => {
    const chosen: Theme = store.settings.theme;
    const theme = themeById(
      resolveThemeId(chosen, store.settings.themeFollowsSystem, media.matches),
    );
    const root = document.documentElement;
    root.dataset['theme'] = theme.id;

    // Les empattements et le traitement des émojis vont ensemble : ils disent
    // la même chose, qu'on regarde une page d'une autre époque.
    const period = theme.period && store.settings.periodFont;
    if (period) root.dataset['font'] = 'periode';
    else delete root.dataset['font'];

    if (theme.light === 'aucune') delete root.dataset['lumiere'];
    else root.dataset['lumiere'] = theme.light;
    root.dataset['ambiance'] = store.settings.ambience;

    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.bar);
  };
  media.addEventListener('change', applyTheme);
  store.subscribe(applyTheme);
  applyTheme();

  // --- Messages ---

  const toast = (message: string, kind: ToastKind = 'info'): void => {
    const element = h('div', { class: `toast toast--${kind}`, attrs: { role: 'status' }, text: message });
    toasts.append(element);
    window.setTimeout(() => {
      element.classList.add('is-leaving');
      window.setTimeout(() => element.remove(), 300);
    }, 3800);
  };

  store.onAchievements((achievements) => {
    for (const achievement of achievements) {
      toast(`${achievement.icon}  Succès débloqué : ${achievement.name}`, 'success');
    }
  });

  // Le panneau réutilise la page Réglages, qui attend un contexte de vue. Le
  // routeur n'existe pas encore ici : naviguer par le fragment revient
  // exactement au même, puisque c'est ainsi que le routeur lui-même procède.
  const settingsPanel = createSettingsPanel(store, {
    store,
    toast,
    navigate: (path: string) => {
      window.location.hash = `#${path}`;
    },
  });

  // Le lexique s'ouvre par le bandeau ou par un mot repéré dans un texte ; le
  // repérage, lui, ne s'occupe que du contenu des pages, jamais de l'ossature.
  const glossaryPanel = createGlossaryPanel((path: string) => {
    window.location.hash = `#${path}`;
  });
  const marker = createGlossaryMarker(outlet, (key) => glossaryPanel.openAt(key));

  const savePanel = createSavePanel(store, toast);

  const searchPanel = createSearchPanel({
    navigate: (path: string) => {
      window.location.hash = `#${path}`;
    },
    openGlossary: (term: string) => glossaryPanel.openAt(term),
  });

  const setActiveRoute = (route: RouteDefinition): void => {
    for (const [path, link] of navLinks) {
      const active = path === route.path;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    pageTitle.textContent = route.title;
    pageDescription.textContent = route.description;
    settingsPanel.setRoute(route.path);
    savePanel.setVisible(route.path.startsWith('/histoire'));
    drawChapter(route.path);
    marker.refresh();
  };

  /**
   * Situe la page dans le parcours de la licence, en tête et en pied.
   *
   * Vingt-deux chapitres n'ont pas à porter ce code chacun de leur côté : la
   * position se déduit du chemin, et l'ossature est le seul endroit qui la
   * connaisse au moment où la page change.
   */
  const drawChapter = (path: string): void => {
    const position = locate(path);
    if (!position) {
      breadcrumb.replaceChildren();
      chapterNav.replaceChildren();
      breadcrumb.hidden = true;
      chapterNav.hidden = true;
      return;
    }
    breadcrumb.hidden = false;
    chapterNav.hidden = false;

    breadcrumb.replaceChildren(
      h('a', { class: 'crumbs__link', href: `#${LICENCE_HUB}`, text: 'Licence' }),
      h('span', { class: 'crumbs__sep', text: '›', attrs: { 'aria-hidden': 'true' } }),
      h('span', { class: 'crumbs__here', text: position.block.title }),
      h('span', { class: 'crumbs__rank', text: `${position.rank} sur ${position.block.paths.length}` }),
    );

    const link = (target: string | null, direction: 'prev' | 'next'): HTMLElement | null => {
      if (!target) return null;
      const route = ROUTES.find((candidate) => candidate.path === target);
      if (!route) return null;
      return h(
        'a',
        { class: `chapter-nav__link chapter-nav__link--${direction}`, href: `#${target}` },
        h('span', { class: 'chapter-nav__arrow', text: direction === 'prev' ? '←' : '→', attrs: { 'aria-hidden': 'true' } }),
        h(
          'span',
          { class: 'chapter-nav__body' },
          h('span', { class: 'chapter-nav__kind', text: direction === 'prev' ? 'Chapitre précédent' : 'Chapitre suivant' }),
          h('span', { class: 'chapter-nav__label', text: route.label }),
        ),
      );
    };

    chapterNav.replaceChildren(
      link(position.previous, 'prev') ?? h('span', { class: 'chapter-nav__filler' }),
      h('a', {
        class: 'chapter-nav__hub',
        href: `#${LICENCE_HUB}`,
        text: `${position.overall} / ${position.total}`,
        attrs: { 'aria-label': `Chapitre ${position.overall} sur ${position.total} — revenir au sommaire` },
      }),
      link(position.next, 'next') ?? h('span', { class: 'chapter-nav__filler' }),
    );
  };

  root.append(
    // La lumière de la pièce, posée avant tout le reste : elle ne réagit à
    // rien et n'intercepte rien, c'est un décor qui se contente d'être là.
    h('div', { class: 'ambiance', attrs: { 'aria-hidden': 'true' } },
      h('div', { class: 'ambiance__lueur' })),
    sidebar,
    overlay,
    h(
      'div',
      { class: 'main' },
      h(
        'header',
        { class: 'topbar' },
        burger,
        h('span', { class: 'topbar__brand', text: 'Morse Training' }),
        h('span', { class: 'topbar__spacer' }),
        savePanel.button,
        searchPanel.button,
        glossaryPanel.button,
        settingsPanel.button,
      ),
      h(
        'main',
        { class: 'page', attrs: { id: 'contenu' } },
        h('div', { class: 'page__head' }, breadcrumb, pageTitle, pageDescription),
        outlet,
        chapterNav,
      ),
    ),
    ...settingsPanel.nodes,
    ...glossaryPanel.nodes,
    ...searchPanel.nodes,
    ...savePanel.nodes,
    toasts,
  );

  return { outlet, toast, setActiveRoute, settingsPanel, glossaryPanel, searchPanel, savePanel };
}
