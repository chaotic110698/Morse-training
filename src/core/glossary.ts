/**
 * Logique du lexique, sans DOM.
 *
 * Deux services : ranger les entrées dans un ordre alphabétique qui tienne
 * compte des accents, et repérer les termes du lexique dans un texte courant.
 *
 * Le repérage travaille sur une copie « pliée » du texte — minuscules, accents
 * retirés, apostrophes uniformisées — construite caractère par caractère pour
 * que les positions restent alignées sur l'original. C'est ce qui permet de
 * chercher « decibel » et de souligner « Décibels » sans décalage.
 *
 * Les définitions pèsent une dizaine de kilo-octets : elles ne sont chargées
 * qu'une fois la première page peinte, comme la banque de questions.
 */

import type { GlossaryEntry } from '../data/glossary.ts';

/** Correspondances accent → lettre nue, toutes de même longueur que la source. */
const FOLD: Record<string, string> = {
  à: 'a', á: 'a', â: 'a', ä: 'a', ã: 'a', å: 'a',
  ç: 'c',
  è: 'e', é: 'e', ê: 'e', ë: 'e',
  ì: 'i', í: 'i', î: 'i', ï: 'i',
  ñ: 'n',
  ò: 'o', ó: 'o', ô: 'o', ö: 'o', õ: 'o',
  ù: 'u', ú: 'u', û: 'u', ü: 'u',
  ý: 'y', ÿ: 'y',
  '’': "'", '‘': "'", '′': "'",
  ' ': ' ', ' ': ' ', '‑': '-',
};

/**
 * Met un texte sous forme comparable sans changer sa longueur. L'égalité des
 * longueurs est la propriété critique : le repérage s'en sert pour retrouver
 * dans le texte d'origine ce qu'il a trouvé dans la copie.
 */
export function fold(text: string): string {
  let out = '';
  for (const char of text) {
    const lower = char.toLowerCase();
    const source = lower.length === char.length ? lower : char;
    const mapped = FOLD[source];
    out += mapped !== undefined && mapped.length === source.length ? mapped : source;
  }
  return out;
}

/** Identifiant stable d'une entrée, utilisable en ancre ou en attribut. */
export function slugify(term: string): string {
  return fold(term)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Toutes les formes reconnues d'une entrée : terme canonique et alias. */
export function formsOf(entry: GlossaryEntry): string[] {
  return [entry.term, ...(entry.aliases ?? [])];
}

/** Première lettre d'affichage d'une entrée, accents repliés. */
export function initialOf(entry: GlossaryEntry): string {
  return (fold(entry.term)[0] ?? '#').toUpperCase();
}

export interface GlossaryMatch {
  start: number;
  end: number;
  entry: GlossaryEntry;
}

export interface GlossaryGroup {
  letter: string;
  entries: GlossaryEntry[];
}

/**
 * Mémoire des termes déjà signalés. Un `Set<string>` en est le cas courant,
 * mais les pages tiennent leur compte en identifiants plutôt qu'en termes : le
 * contrat est donc réduit aux deux opérations réellement nécessaires.
 */
export interface SeenTerms {
  has: (term: string) => boolean;
  add: (term: string) => void;
}

export interface GlossaryIndex {
  /** Les entrées par ordre alphabétique français. */
  entries: GlossaryEntry[];
  /** Retrouve une entrée par son terme, un de ses alias ou son identifiant. */
  find: (key: string) => GlossaryEntry | null;
  /** Les entrées dont une forme ou la définition contient la requête. */
  search: (query: string) => GlossaryEntry[];
  /** Les entrées regroupées par initiale, dans l'ordre alphabétique. */
  groups: (entries?: GlossaryEntry[]) => GlossaryGroup[];
  /** Repère les termes du lexique dans un texte. */
  match: (text: string, seen?: SeenTerms) => GlossaryMatch[];
  /** Repère les termes employés par une définition, la sienne exceptée. */
  matchDefinition: (entry: GlossaryEntry) => GlossaryMatch[];
}

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Formes qu'on ne repère jamais dans les textes, quoi qu'en dise le lexique.
 *
 * Le danger vient des sigles courts : plié en minuscules et sans accent, « PAR »
 * devient la préposition la plus employée du français, « TU » le pronom, « log »
 * le logarithme. Un sigle mal choisi souligne alors la moitié d'un chapitre. La
 * liste sert de garde-fou permanent ; les tests signalent tout terme qu'elle
 * intercepte, pour que la protection reste visible plutôt que silencieuse.
 */
const STOP_WORDS = new Set([
  'a', 'ai', 'au', 'aux', 'avec', 'car', 'ce', 'ces', 'dans', 'de', 'des', 'du',
  'elle', 'en', 'es', 'est', 'et', 'eu', 'il', 'ils', 'je', 'la', 'le', 'les',
  'lui', 'ma', 'mais', 'me', 'mes', 'moi', 'mon', 'ne', 'ni', 'nos', 'notre',
  'nous', 'on', 'ont', 'ou', 'par', 'pas', 'peu', 'plus', 'pour', 'que', 'qui',
  'sa', 'sans', 'se', 'ses', 'si', 'son', 'sont', 'sous', 'sur', 'ta', 'te',
  'tes', 'toi', 'ton', 'tous', 'tout', 'tu', 'un', 'une', 'vos', 'votre', 'vous',
  'y', 'log', 'or', 'note', 'mot', 'mots',
]);

/** Vrai si cette forme peut être soulignée dans un texte courant. */
export function isMarkable(form: string): boolean {
  return !STOP_WORDS.has(fold(form));
}

const collator = new Intl.Collator('fr', { sensitivity: 'base' });

/** Construit l'index de recherche et de repérage à partir des entrées. */
export function buildIndex(source: GlossaryEntry[]): GlossaryIndex {
  const entries = [...source].sort((a, b) => collator.compare(a.term, b.term));

  const byKey = new Map<string, GlossaryEntry>();
  for (const entry of source) {
    byKey.set(slugify(entry.term), entry);
    for (const form of formsOf(entry)) byKey.set(fold(form), entry);
  }

  /**
   * Les formes repérables dans les textes, les plus longues d'abord pour que
   * « modulation d'amplitude » l'emporte sur « modulation ».
   */
  const markable: { form: string; entry: GlossaryEntry }[] = [];
  for (const entry of source) {
    if (entry.mark === false) continue;
    for (const form of formsOf(entry)) {
      if (isMarkable(form)) markable.push({ form: fold(form), entry });
    }
  }
  markable.sort((a, b) => b.form.length - a.form.length || a.form.localeCompare(b.form));
  const markableByForm = new Map(markable.map(({ form, entry }) => [form, entry]));

  /**
   * Motif de repérage. Les bornes ne sont pas `\b` : un terme peut commencer ou
   * finir par une apostrophe, et `\b` se comporterait alors à l'envers. On exige
   * simplement de ne pas être collé à une lettre ou un chiffre.
   *
   * La borne de gauche est capturée plutôt que testée en arrière : Safari n'a
   * accepté les assertions rétrospectives qu'en 2023, et une exception ici
   * emporterait tout le module au chargement.
   */
  const pattern = markable.length
    ? new RegExp(
        `(^|[^a-z0-9])(${markable.map(({ form }) => escapeRegExp(form)).join('|')})(?![a-z0-9])`,
        'g',
      )
    : null;

  const find = (key: string): GlossaryEntry | null => {
    const trimmed = key.trim();
    return byKey.get(fold(trimmed)) ?? byKey.get(slugify(trimmed)) ?? null;
  };

  const search = (query: string): GlossaryEntry[] => {
    const needle = fold(query.trim());
    if (needle === '') return entries;
    const starts: GlossaryEntry[] = [];
    const contains: GlossaryEntry[] = [];
    for (const entry of entries) {
      const forms = formsOf(entry).map(fold);
      if (forms.some((form) => form.startsWith(needle))) starts.push(entry);
      else if (forms.some((form) => form.includes(needle)) || fold(entry.definition).includes(needle)) {
        contains.push(entry);
      }
    }
    return [...starts, ...contains];
  };

  const groups = (subset: GlossaryEntry[] = entries): GlossaryGroup[] => {
    const out: GlossaryGroup[] = [];
    for (const entry of subset) {
      const letter = initialOf(entry);
      const last = out[out.length - 1];
      if (last && last.letter === letter) last.entries.push(entry);
      else out.push({ letter, entries: [entry] });
    }
    return out;
  };

  /**
   * `seen` porte les termes déjà signalés ailleurs sur la page : on ne souligne
   * qu'une occurrence par terme et par page, sinon la lecture devient un champ
   * de mines.
   */
  const match = (text: string, seen?: SeenTerms): GlossaryMatch[] => {
    if (!pattern) return [];
    const folded = fold(text);
    const matches: GlossaryMatch[] = [];
    pattern.lastIndex = 0;
    let found: RegExpExecArray | null = pattern.exec(folded);
    while (found !== null) {
      const form = found[2] ?? '';
      const entry = markableByForm.get(form);
      if (entry && !seen?.has(entry.term)) {
        seen?.add(entry.term);
        const start = found.index + (found[1] ?? '').length;
        matches.push({ start, end: start + form.length, entry });
      }
      found = pattern.exec(folded);
    }
    return matches;
  };

  /**
   * Le terme défini est exclu d'office : une définition qui renverrait à
   * elle-même tournerait en rond, alors que citer ses voisines rend le lexique
   * navigable.
   */
  const matchDefinition = (entry: GlossaryEntry): GlossaryMatch[] =>
    match(entry.definition, new Set([entry.term]));

  return { entries, find, search, groups, match, matchDefinition };
}

let cache: GlossaryIndex | null = null;
let pending: Promise<GlossaryIndex> | null = null;

/**
 * Charge le lexique, une seule fois. Les appels concurrents — le repérage des
 * mots et l'ouverture du panneau peuvent se produire dans la même seconde —
 * partagent la même promesse plutôt que de déclencher deux téléchargements.
 */
export function loadGlossary(): Promise<GlossaryIndex> {
  if (cache) return Promise.resolve(cache);
  pending ??= import('../data/glossary.ts').then(({ GLOSSARY }) => {
    cache = buildIndex(GLOSSARY);
    pending = null;
    return cache;
  });
  return pending;
}

/** L'index s'il est déjà chargé, sans rien déclencher. */
export function glossaryIndex(): GlossaryIndex | null {
  return cache;
}

/** Contrôle d'intégrité des données, appelé par les tests. */
export function validateGlossary(source: GlossaryEntry[], routePaths?: string[]): string[] {
  const problems: string[] = [];
  const terms = new Set<string>();
  const forms = new Map<string, string>();
  for (const entry of source) {
    if (entry.term.trim() === '') problems.push('Terme vide.');
    if (terms.has(entry.term)) problems.push(`Terme en double : ${entry.term}`);
    terms.add(entry.term);
    if (entry.definition.trim().length < 20) problems.push(`Définition trop courte : ${entry.term}`);
    if (!/[.!?]$/.test(entry.definition.trim())) {
      problems.push(`Définition sans ponctuation finale : ${entry.term}`);
    }
    if (entry.definition.includes("'")) problems.push(`Apostrophe droite : ${entry.term}`);
    for (const form of formsOf(entry)) {
      if (entry.mark !== false && !isMarkable(form)) {
        problems.push(`Forme trop courante pour être repérée : ${form} (${entry.term})`);
      }
      const key = fold(form);
      const owner = forms.get(key);
      if (owner && owner !== entry.term) problems.push(`Forme « ${form} » partagée : ${owner} / ${entry.term}`);
      forms.set(key, entry.term);
    }
    if (entry.route && routePaths) {
      const path = entry.route.replace(/^#/, '');
      if (!routePaths.includes(path)) problems.push(`Route inconnue pour ${entry.term} : ${entry.route}`);
    }
  }
  for (const entry of source) {
    for (const reference of entry.see ?? []) {
      if (!terms.has(reference)) problems.push(`Renvoi inconnu depuis ${entry.term} : ${reference}`);
    }
    if ((entry.see ?? []).includes(entry.term)) problems.push(`Renvoi circulaire : ${entry.term}`);
  }
  return problems;
}
