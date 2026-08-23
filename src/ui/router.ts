/**
 * Routeur par fragment d'URL.
 *
 * Le fragment (`#/...`) évite toute configuration serveur : GitHub Pages sert
 * un seul `index.html` et le navigateur ne demande jamais de chemin qui
 * n'existe pas. Chaque page reste ainsi partageable par lien et le bouton
 * retour fonctionne normalement.
 */

import type { AppStore } from '../core/store.ts';

export type ToastKind = 'info' | 'success' | 'error';

export interface ViewContext {
  store: AppStore;
  navigate: (path: string) => void;
  toast: (message: string, kind?: ToastKind) => void;
}

export interface View {
  element: HTMLElement;
  /** Appele quand on quitte la page : arrêter le son, retirer les écouteurs. */
  destroy?: () => void;
}

export type ViewFactory = (context: ViewContext) => View;

export interface RouteDefinition {
  path: string;
  label: string;
  /** Titre complet, affiche en tête de page et dans l'onglet. */
  title: string;
  description: string;
  icon: string;
  group: string;
  /**
   * Faux pour les pages qui ne figurent pas au menu latéral. La section Licence
   * compte vingt-trois pages : les lister toutes rendrait le menu illisible,
   * elles sont donc atteintes depuis leur hub. Elles restent des routes à part
   * entière, partageables par lien et accessibles au clavier.
   */
  menu?: boolean;
  factory: ViewFactory;
}

export class Router {
  private readonly routes: RouteDefinition[];
  private readonly outlet: HTMLElement;
  private readonly context: ViewContext;
  private readonly onChange: (route: RouteDefinition) => void;
  private current: View | null = null;
  private currentPath = '';

  constructor(options: {
    routes: RouteDefinition[];
    outlet: HTMLElement;
    context: Omit<ViewContext, 'navigate'>;
    onChange: (route: RouteDefinition) => void;
  }) {
    this.routes = options.routes;
    this.outlet = options.outlet;
    this.onChange = options.onChange;
    this.context = { ...options.context, navigate: (path) => this.navigate(path) };
    window.addEventListener('hashchange', () => this.resolve());
  }

  start(): void {
    this.resolve();
  }

  navigate(path: string): void {
    const target = `#${path}`;
    if (window.location.hash === target) this.resolve();
    else window.location.hash = target;
  }

  get path(): string {
    return this.currentPath;
  }

  private resolve(): void {
    const raw = window.location.hash.replace(/^#/, '') || '/';
    const route = this.routes.find((candidate) => candidate.path === raw) ?? this.routes[0];
    if (!route) return;

    this.current?.destroy?.();
    this.current = null;
    this.outlet.replaceChildren();

    this.currentPath = route.path;
    const view = route.factory(this.context);
    this.current = view;
    this.outlet.append(view.element);
    // Le focus part en tête de page pour que la navigation au clavier et les
    // lecteurs d'écran suivent le changement de contenu.
    this.outlet.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
    document.title = `${route.title} — Morse Training`;
    this.onChange(route);
  }
}
