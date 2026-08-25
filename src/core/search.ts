/**
 * Recherche globale.
 *
 * Quarante pages, quatre cent quarante-neuf questions, quatre-vingt-dix-sept
 * définitions, quatre-vingts formules : passé une certaine taille, aucune
 * arborescence ne remplace une barre de recherche. Surtout sur téléphone, où
 * fouiller un menu déroulant coûte plus cher que taper trois lettres.
 *
 * Le classement est volontairement lisible plutôt que savant : un mot trouvé
 * dans un titre vaut mieux qu'un mot trouvé dans le corps, un titre de page
 * mieux qu'un titre de section, et une correspondance en début de mot mieux
 * qu'au milieu. Aucune pondération statistique — sur un corpus de cette taille,
 * elle produirait surtout des surprises.
 */

import { fold } from './glossary.ts';
import { ROUTES } from '../views/routes.ts';
import { PROSIGNS } from './morse.ts';
import { FORMULA_GROUPS } from '../data/formulas.ts';
import { VOCABULARY_SETS } from '../data/vocabulary.ts';
import { loadGlossary } from './glossary.ts';

export type SearchKind = 'page' | 'section' | 'lexique' | 'formule' | 'code' | 'question';

/** Ce qui se passe quand on choisit un résultat. */
export type SearchTarget =
  | { type: 'route'; path: string; anchor?: string }
  | { type: 'glossaire'; term: string };

export interface SearchEntry {
  kind: SearchKind;
  /** Ce qui s'affiche en gras. */
  label: string;
  /** La ligne de contexte, sous le titre. */
  detail: string;
  /** Matière supplémentaire à fouiller, jamais affichée. */
  body?: string;
  target: SearchTarget;
}

export interface SearchHit extends SearchEntry {
  score: number;
}

export const KIND_LABELS: Record<SearchKind, string> = {
  page: 'Pages',
  section: 'Sections',
  lexique: 'Lexique',
  formule: 'Formulaire',
  code: 'Codes et abréviations',
  question: 'Questions d’examen',
};

/** Ordre d'affichage des groupes, et départage à score égal. */
const KIND_ORDER: SearchKind[] = ['page', 'section', 'lexique', 'code', 'formule', 'question'];

/** Poids de base par famille : à égalité de mots trouvés, une page l'emporte. */
const KIND_WEIGHT: Record<SearchKind, number> = {
  page: 6, section: 5, lexique: 4, code: 3, formule: 2, question: 0,
};

/** Au-delà, la liste ne se lit plus : elle se fait défiler. */
export const MAX_RESULTS = 24;
/** Les questions n'illustrent que le sujet ; trois suffisent à le montrer. */
const MAX_QUESTIONS = 3;

const routeTitle = (path: string): string =>
  ROUTES.find((route) => route.path === path)?.title ?? path;

/**
 * Découpe une requête en mots pliés. Même découpage que l'index, apostrophe
 * comprise : « loi d'ohm » cherche « loi » et « ohm ».
 */
export function terms(query: string): string[] {
  return fold(query)
    .split(/[^a-z0-9]+/)
    // Les lettres isolées sont les élisions du français — le « d » de
    // « loi d'Ohm ». Les exiger ne ferait que rendre la requête introuvable.
    .filter((word) => word.length > 1);
}

/**
 * Score d'un mot dans un texte. Zéro s'il est absent ; sinon d'autant plus
 * élevé qu'il commence tôt et qu'il commence un mot.
 */
function scoreIn(haystack: string, term: string): number {
  const at = haystack.indexOf(term);
  if (at < 0) return 0;
  if (at === 0) return haystack.length === term.length ? 12 : 8;
  return /[a-z0-9]/.test(haystack[at - 1] ?? '') ? 1 : 5;
}

interface Prepared extends SearchEntry {
  foldedLabel: string;
  foldedDetail: string;
  foldedBody: string;
}

export interface SearchIndex {
  entries: SearchEntry[];
  query: (text: string) => SearchHit[];
}

export function buildSearchIndex(entries: SearchEntry[]): SearchIndex {
  const prepared: Prepared[] = entries.map((entry) => ({
    ...entry,
    foldedLabel: fold(entry.label),
    foldedDetail: fold(entry.detail),
    foldedBody: entry.body ?? '',
  }));

  const query = (text: string): SearchHit[] => {
    const wanted = terms(text);
    if (wanted.length === 0) return [];

    const hits: SearchHit[] = [];
    for (const entry of prepared) {
      let score = 0;
      let complete = true;
      for (const term of wanted) {
        // Le corps compte peu : il dit que la page parle du sujet, pas qu'elle
        // le traite. Un titre, lui, l'annonce.
        // Le corps est une liste de mots : on n'y accepte qu'un début de mot,
        // sinon « PIRE » se trouverait au milieu de « soupirer ».
        const found =
          scoreIn(entry.foldedLabel, term) * 4 +
          scoreIn(entry.foldedDetail, term) * 2 +
          (scoreIn(entry.foldedBody, term) >= 5 ? 2 : 0);
        if (found === 0) { complete = false; break; }
        score += found;
      }
      // Tous les mots doivent être présents : une recherche à deux mots qui
      // rendrait les résultats de chacun serait pire qu'inutile.
      if (!complete) continue;
      hits.push({ ...entry, score: score + KIND_WEIGHT[entry.kind] });
    }

    hits.sort(
      (a, b) =>
        b.score - a.score ||
        KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) ||
        a.label.localeCompare(b.label, 'fr'),
    );

    let questions = 0;
    const kept: SearchHit[] = [];
    for (const hit of hits) {
      if (hit.kind === 'question') {
        if (questions >= MAX_QUESTIONS) continue;
        questions += 1;
      }
      kept.push(hit);
      if (kept.length >= MAX_RESULTS) break;
    }
    return kept;
  };

  return { entries, query };
}

/** Les entrées disponibles sans rien charger : pages, codes, formules. */
export function staticEntries(): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const route of ROUTES) {
    entries.push({
      kind: 'page',
      label: route.title,
      detail: route.description,
      target: { type: 'route', path: route.path },
    });
  }

  for (const prosign of PROSIGNS) {
    entries.push({
      kind: 'code',
      label: prosign.name,
      detail: `Signal de procédure — ${prosign.meaning}`,
      target: { type: 'route', path: '/apprendre/communication' },
    });
  }

  for (const set of VOCABULARY_SETS) {
    for (const entry of set.entries) {
      entries.push({
        kind: 'code',
        label: entry.text,
        detail: `${set.label} — ${entry.meaning}`,
        target: { type: 'route', path: '/apprendre/communication' },
      });
    }
  }

  for (const group of FORMULA_GROUPS) {
    for (const formula of group.formulas) {
      entries.push({
        kind: 'formule',
        label: formula.expression,
        detail: `${formula.purpose} — ${group.title}`,
        body: fold([formula.simplified, formula.variables, formula.note].filter(Boolean).join(' ')),
        target: { type: 'route', path: '/licence/formulaire' },
      });
    }
  }

  return entries;
}

let cache: SearchIndex | null = null;
let pending: Promise<SearchIndex> | null = null;

/**
 * Charge tout ce qui manque et compose l'index. Le contenu des pages et les
 * énoncés viennent d'un module fabriqué à la compilation, les définitions du
 * lexique de leur module habituel : rien de tout cela ne pèse sur le démarrage.
 */
export function loadSearchIndex(): Promise<SearchIndex> {
  if (cache) return Promise.resolve(cache);
  pending ??= Promise.all([import('virtual:index-pages'), loadGlossary()]).then(
    ([{ PAGES, QUESTIONS }, glossary]) => {
      const entries = staticEntries();

      const byPath = new Map(entries.filter((e) => e.kind === 'page').map((e) => [
        (e.target as { path: string }).path,
        e,
      ]));

      for (const page of PAGES) {
        const entry = byPath.get(page.path);
        if (entry) entry.body = page.words;
        for (const heading of page.headings) {
          entries.push({
            kind: 'section',
            label: heading,
            detail: routeTitle(page.path),
            target: { type: 'route', path: page.path, anchor: heading },
          });
        }
      }

      for (const term of glossary.entries) {
        entries.push({
          kind: 'lexique',
          label: term.term,
          detail: term.definition,
          body: fold((term.aliases ?? []).join(' ')),
          target: { type: 'glossaire', term: term.term },
        });
      }

      for (const question of QUESTIONS) {
        entries.push({
          kind: 'question',
          label: question.prompt,
          detail: question.topic,
          target: { type: 'route', path: question.route },
        });
      }

      cache = buildSearchIndex(entries);
      pending = null;
      return cache;
    },
  );
  return pending;
}

/** L'index s'il est déjà là, sans rien déclencher. */
export function searchIndex(): SearchIndex | null {
  return cache;
}
