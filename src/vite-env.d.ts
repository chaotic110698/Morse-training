/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/** Date de construction, injectée par Vite (voir `define` dans vite.config.ts). */
declare const __BUILD_STAMP__: string;

/**
 * Index des pages et des énoncés, fabriqué à la compilation par
 * `build/search-index.ts`. Le module n'existe pas sur le disque : Vite le
 * produit à la demande, ce qui garantit qu'il ne peut pas être périmé.
 */
declare module 'virtual:index-pages' {
  export interface IndexedPage {
    path: string;
    headings: string[];
    words: string;
  }
  export interface IndexedQuestion {
    prompt: string;
    topic: string;
    route: string;
  }
  export const PAGES: IndexedPage[];
  export const QUESTIONS: IndexedQuestion[];
}
