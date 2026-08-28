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

/**
 * Charge la vue d'une route, à la demande.
 *
 * Les pages ne sont pas dans le paquet principal : chacune arrive quand on y
 * va. La table des routes, elle, reste entièrement statique — c'est elle qui
 * peuple le menu latéral, et il serait absurde de télécharger vingt-trois
 * pages pour afficher vingt-trois libellés.
 */
export type ViewLoader = () => Promise<ViewFactory>;

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
  load: ViewLoader;
}

export class Router {
  private readonly routes: RouteDefinition[];
  private readonly outlet: HTMLElement;
  private readonly context: ViewContext;
  private readonly onChange: (route: RouteDefinition) => void;
  private current: View | null = null;
  private currentPath = '';
  /**
   * Le numéro de la navigation en cours. Une page se charge maintenant de
   * façon asynchrone : sans ce compteur, un module lent monterait sa vue
   * par-dessus celle d'une navigation plus récente.
   */
  private generation = 0;
  /**
   * Le rang de la page dans la table des routes — c'est-à-dire l'ordre du
   * menu, le seul ordre que le site déclare. Il donne son sens au glissement :
   * on descend dans le site, ou on en remonte.
   */
  private rang = -1;
  private sens = 1;
  private readonly moinsDeMouvement = window.matchMedia('(prefers-reduced-motion: reduce)');

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

    const token = (this.generation += 1);

    const rang = this.routes.indexOf(route);
    this.sens = this.rang < 0 || rang >= this.rang ? 1 : -1;
    this.rang = rang;

    // Le titre et le menu suivent immédiatement : ils se lisent dans la table
    // des routes, qui n'a rien à charger. Seul le contenu attend son module.
    this.currentPath = route.path;
    document.title = `${route.title} — Morse Training`;
    this.onChange(route);

    void route.load().then(
      (factory) => {
        if (token !== this.generation) return;
        this.mount(factory(this.context));
      },
      (error: unknown) => {
        if (token !== this.generation) return;
        this.mount(this.unreachable(route, error));
      },
    );
  }

  /**
   * Remplace la page affichée.
   *
   * L'ancienne vue n'est démontée qu'ici, une fois la nouvelle prête : monter
   * dans l'autre ordre laisserait la zone vide pendant le chargement du
   * module. Quand celui-ci est déjà en cache — c'est le cas dès la seconde
   * visite, et dès la première une fois le service worker installé — la
   * promesse se résout dans la microtâche suivante et le remplacement est
   * imperceptible.
   */
  private mount(view: View): void {
    // La page qui s'en va est celle de la vue courante, et non le premier
    // enfant : pendant une transition, le premier enfant est la *précédente*
    // sortante, encore là pour deux cents millisecondes. Les confondre laissait
    // la vraie page en place et en abandonnait une par navigation rapide.
    const sortante = this.current?.element ?? null;
    this.current?.destroy?.();
    this.current = view;

    const mode = this.context.store.settings.pageMotion;
    const anime =
      mode !== 'aucun' &&
      sortante !== null &&
      sortante.isConnected &&
      !this.moinsDeMouvement.matches;

    if (!anime) {
      this.outlet.replaceChildren(view.element);
    } else {
      // Tout ce qui reste d'une transition précédente s'en va maintenant : la
      // zone ne contient jamais que la sortante et l'entrante.
      for (const reste of [...this.outlet.children]) {
        if (reste !== sortante) reste.remove();
      }

      this.outlet.dataset['transition'] = mode;
      this.outlet.style.setProperty('--sens', String(this.sens));
      sortante.classList.add('outlet__sortante');
      view.element.classList.add('outlet__entrante');
      this.outlet.append(view.element);

      const retirer = (): void => {
        sortante.remove();
        view.element.classList.remove('outlet__entrante');
      };
      sortante.addEventListener('animationend', retirer, { once: true });
      // Filet : une animation peut ne jamais se terminer si l'onglet passe en
      // arrière-plan pendant la transition, et la sortante resterait alors
      // posée par-dessus la page en position absolue.
      window.setTimeout(retirer, 500);
    }

    // Le focus part en tête de page pour que la navigation au clavier et les
    // lecteurs d'écran suivent le changement de contenu.
    this.outlet.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }

  /**
   * Ce qu'on affiche quand le module d'une page n'a pas pu être téléchargé :
   * hors ligne avant que le service worker ait tout mis en cache, ou après un
   * déploiement qui a renommé les fichiers sous les pieds d'un onglet ouvert.
   *
   * Recharger règle le second cas, et c'est la seule chose utile à proposer.
   */
  private unreachable(route: RouteDefinition, error: unknown): View {
    console.error(`Page « ${route.title} » indisponible :`, error);
    const element = document.createElement('div');
    element.className = 'card';
    const titre = document.createElement('h2');
    titre.className = 'card__title';
    titre.textContent = 'Cette page n’a pas pu être chargée';
    const texte = document.createElement('p');
    texte.textContent =
      'Le site est hors ligne et cette page n’avait pas encore été mise en cache, ' +
      'ou une nouvelle version a été déployée pendant que cet onglet était ouvert. ' +
      'Recharger devrait suffire.';
    const bouton = document.createElement('button');
    bouton.className = 'btn btn--primary';
    bouton.type = 'button';
    bouton.textContent = 'Recharger';
    bouton.addEventListener('click', () => window.location.reload());
    element.append(titre, texte, bouton);
    return { element };
  }
}
