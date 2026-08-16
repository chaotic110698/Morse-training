/**
 * Ossature de l'application : bandeau lateral, en-tete et zone de contenu.
 *
 * Sur ordinateur le bandeau reste ouvert en permanence, avec des sections
 * repliables. Sur telephone il devient un tiroir qui glisse par-dessus la page
 * et se referme des qu'on choisit une destination — meme balisage, meme code,
 * seule la mise en page change.
 */

import { h } from './dom.ts';
import { NAV_GROUPS, ROUTES } from '../views/routes.ts';
import type { RouteDefinition, ToastKind } from './router.ts';
import type { AppStore } from '../core/store.ts';
import type { Theme } from '../core/settings.ts';

const COLLAPSED_KEY = 'morse-training/nav-collapsed';

export interface Shell {
  outlet: HTMLElement;
  toast: (message: string, kind?: ToastKind) => void;
  setActiveRoute: (route: RouteDefinition) => void;
}

export function createShell(root: HTMLElement, store: AppStore): Shell {
  const outlet = h('div', { class: 'outlet' });
  const pageTitle = h('h1', { class: 'page__title' });
  const pageDescription = h('p', { class: 'page__description' });
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
      // Le repliage du menu n'est qu'un confort : on ignore l'echec.
    }
  }

  const nav = h('nav', { class: 'nav', attrs: { 'aria-label': 'Navigation principale' } });

  for (const group of NAV_GROUPS) {
    const routes = ROUTES.filter((route) => route.group === group.id);
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
      h('p', { text: 'Fonctionne hors ligne. Aucune donnee ne quitte votre appareil.' }),
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

  // --- Theme ---

  const media = window.matchMedia('(prefers-color-scheme: light)');
  const applyTheme = (): void => {
    const theme: Theme = store.settings.theme;
    const resolved = theme === 'auto' ? (media.matches ? 'light' : 'dark') : theme;
    document.documentElement.dataset['theme'] = resolved;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', resolved === 'light' ? '#f4f6f8' : '#0b1015');
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
      toast(`${achievement.icon}  Succes debloque : ${achievement.name}`, 'success');
    }
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
  };

  root.append(
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
      ),
      h(
        'main',
        { class: 'page', attrs: { id: 'contenu' } },
        h('div', { class: 'page__head' }, pageTitle, pageDescription),
        outlet,
      ),
    ),
    toasts,
  );

  return { outlet, toast, setActiveRoute };
}
