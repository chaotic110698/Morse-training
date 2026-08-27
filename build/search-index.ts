/**
 * Index de recherche des pages, construit au moment de la compilation.
 *
 * Le contenu des chapitres vit à l'intérieur de fonctions qui fabriquent du
 * DOM : pour le lire à l'exécution, il faudrait rendre les quarante pages —
 * donc instancier des lecteurs audio et des minuteurs — juste pour savoir
 * qu'un mot s'y trouve. On extrait donc le texte des sources une fois pour
 * toutes, à la compilation, et le site ne reçoit qu'un sac de mots.
 *
 * Les autres gisements — lexique, alphabet, abréviations, formulaire,
 * questions — sont déjà des données structurées : ils s'indexent à l'exécution,
 * sans passer par ici.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

const VIEWS = 'src/views';

/** Le module que le site importe ; il n'existe que dans la mémoire de Vite. */
export const VIRTUAL_ID = 'virtual:index-pages';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

export interface QuestionEntry {
  /** L'énoncé, tel qu'il est posé. */
  prompt: string;
  /** Le thème du programme, en clair. */
  topic: string;
  /** Le chapitre qui enseigne la notion vérifiée. */
  route: string;
}

export interface PageEntry {
  /** Chemin de la route, sans le dièse. */
  path: string;
  /** Titres de sections, dans l'ordre de la page. */
  headings: string[];
  /** Mots distincts du corps de la page, pliés et séparés par une espace. */
  words: string;
}

/**
 * Mots vides du français. Les garder gonflerait l'index d'un tiers sans
 * jamais départager deux pages : « dans » est sur les quarante.
 */
const STOP = new Set([
  'alors', 'apres', 'assez', 'attention', 'aucun', 'aucune', 'aussi',
  'autant', 'autre', 'autres', 'avait', 'avant', 'avec', 'avoir', 'beaucoup',
  'bien', 'cela', 'celle', 'celles', 'celui', 'cent', 'certains', 'ceux',
  'chaque', 'comme', 'comment', 'dans', 'depuis', 'deux', 'devient', 'doit',
  'donc', 'dont', 'elle', 'elles', 'encore', 'entre', 'etre', 'faire',
  'fait', 'faut', 'fois', 'font', 'grand', 'grande', 'ici', 'jamais',
  'juste', 'leur', 'leurs', 'lorsque', 'mais', 'meme', 'memes', 'moins',
  'nous', 'parce', 'pareil', 'partie', 'pendant', 'peut', 'peuvent', 'plus',
  'plutot', 'pour', 'pourquoi', 'pres', 'puis', 'quand', 'que', 'quel',
  'quelle', 'quelques', 'qui', 'quoi', 'rien', 'sans', 'sauf', 'selon',
  'sera', 'seul', 'seule', 'seulement', 'sinon', 'sont', 'sous', 'souvent',
  'suite', 'sur', 'tant', 'tous', 'tout', 'toute', 'toutes', 'tres', 'trois',
  'une', 'vers', 'veut', 'voici', 'voir', 'vont', 'votre', 'vous', 'des',
  'les', 'aux', 'est', 'son', 'ses', 'ces', 'cet', 'par', 'pas', 'ont', 'lui',
  'eux', 'ceci', 'car', 'ainsi', 'donne', 'donnent', 'ete'
]);

/** Accents retirés, minuscules : même pliage que le lexique. */
const FOLD: Record<string, string> = {
  à: 'a', á: 'a', â: 'a', ä: 'a', ã: 'a', å: 'a', ç: 'c',
  è: 'e', é: 'e', ê: 'e', ë: 'e', ì: 'i', í: 'i', î: 'i', ï: 'i', ñ: 'n',
  ò: 'o', ó: 'o', ô: 'o', ö: 'o', õ: 'o', ù: 'u', ú: 'u', û: 'u', ü: 'u',
  ý: 'y', ÿ: 'y', œ: 'oe', æ: 'ae',
};

function fold(text: string): string {
  let out = '';
  for (const char of text.toLowerCase()) out += FOLD[char] ?? char;
  return out;
}

/**
 * Rend les littéraux de chaîne d'un fichier TypeScript, commentaires exclus.
 *
 * Une expression régulière ne suffit pas : une apostrophe dans un commentaire
 * ouvrirait une chaîne fantôme et avalerait la moitié du fichier.
 */
function stringsOf(source: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < source.length) {
    const char = source[i] as string;
    if (char === '/' && source[i + 1] === '/') {
      const end = source.indexOf('\n', i);
      i = end === -1 ? source.length : end + 1;
      continue;
    }
    if (char === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end === -1 ? source.length : end + 2;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      let j = i + 1;
      let text = '';
      while (j < source.length) {
        const inner = source[j] as string;
        if (inner === '\\') { text += source[j + 1] ?? ''; j += 2; continue; }
        if (inner === char) break;
        text += inner;
        j += 1;
      }
      out.push(text);
      i = j + 1;
      continue;
    }
    i += 1;
  }
  return out;
}

/**
 * Écarte ce qui n'est pas de la prose : noms de classes, chemins, identifiants,
 * balises, tracés SVG. Le test de l'index vérifie qu'aucun mot attendu ne
 * disparaît par ce filtre.
 */
function isProse(text: string): boolean {
  // Les interpolations partent d'abord : sans cela, « statut-${x} » passerait
  // pour une phrase, alors que c'est un nom de classe fabriqué.
  const trimmed = text.replace(/\$\{[^}]*\}/g, ' ').trim();
  if (trimmed.length < 3) return false;
  if (/^[#/]|^\.{1,2}\/|\.(ts|js|css|json|svg|png)$/.test(trimmed)) return false;
  if (/^https?:|^data:|^[Mm][\s\d]/.test(trimmed)) return false;
  if (!/[A-Za-zÀ-ÿ]/.test(trimmed)) return false;
  // Noms de classes, identifiants, attributs, balises : minuscules et tirets.
  // Le test porte sur chaque mot, car les listes de classes en contiennent
  // plusieurs — « btn btn--primary » passerait sinon pour une phrase.
  // Le tiret final est toléré : un nom de classe amputé de son interpolation
  // se termine souvent par « -- ».
  const identifier = /^[a-z][a-z0-9]*([-_]{1,2}[a-z0-9]+)*[-_]{0,2}$/;
  if (trimmed.split(/\s+/).every((token) => identifier.test(token))) return false;
  return true;
}

const HEADING_PATTERNS = [
  /\bsection\(\s*'((?:[^'\\]|\\.)*)'/g,
  /h\(\s*'h[23]'\s*,\s*\{[^}]*text:\s*'((?:[^'\\]|\\.)*)'/g,
  /class:\s*'card__title'[^}]*text:\s*'((?:[^'\\]|\\.)*)'/g,
];

function headingsOf(source: string): string[] {
  const found: string[] = [];
  for (const pattern of HEADING_PATTERNS) {
    pattern.lastIndex = 0;
    let match = pattern.exec(source);
    while (match !== null) {
      const title = (match[1] ?? '').trim();
      if (title.length >= 3 && !found.includes(title)) found.push(title);
      match = pattern.exec(source);
    }
  }
  return found;
}

function wordsOf(strings: string[]): string {
  const seen = new Set<string>();
  for (const text of strings) {
    // Dans un gabarit, `${…}` contient du code, pas du texte.
    // L'apostrophe sépare : « d'écoute » donne « ecoute », pas « decoute ».
    for (const word of fold(text.replace(/\$\{[^}]*\}/g, ' ')).split(/[^a-z0-9]+/)) {
      if (word.length < 3 || word.length > 24) continue;
      if (/^\d+$/.test(word)) continue;
      if (STOP.has(word)) continue;
      seen.add(word);
    }
  }
  return [...seen].sort().join(' ');
}

/** Associe chaque route au fichier de vue qui la fabrique. */
function routeFiles(root: string): Map<string, string> {
  const routes = readFileSync(join(root, VIEWS, 'routes.ts'), 'utf8');

  // Les vues encore importées statiquement — l'accueil, et ce qu'on y ajoutera.
  const imports = new Map<string, string>();
  const importPattern = /import\s*\{\s*([A-Za-z0-9_]+)\s*\}\s*from\s*'\.\/([^']+)'/g;
  let match = importPattern.exec(routes);
  while (match !== null) {
    imports.set(match[1] as string, match[2] as string);
    match = importPattern.exec(routes);
  }

  // Chaque route déclare son chargeur sous l'une des deux formes :
  //   load: () => import('./x.ts').then((m) => m.xView)
  //   load: () => Promise.resolve(xView)
  const out = new Map<string, string>();
  // Le corps du chargeur peut tenir sur plusieurs lignes : un formateur
  // automatique coupera la ligne dès qu'elle dépasse la largeur retenue.
  const entryPattern = /path:\s*'([^']+)'[\s\S]*?load:\s*\(\)\s*=>\s*([\s\S]*?),\n/g;
  match = entryPattern.exec(routes);
  while (match !== null) {
    const path = match[1] as string;
    const loader = match[2] as string;
    const dynamic = /import\('\.\/([^']+)'\)/.exec(loader);
    if (dynamic) out.set(path, dynamic[1] as string);
    else {
      const eager = /Promise\.resolve\(\s*([A-Za-z0-9_]+)\s*\)/.exec(loader);
      const file = eager ? imports.get(eager[1] as string) : undefined;
      if (file) out.set(path, file);
    }
    match = entryPattern.exec(routes);
  }

  // Ce relevé est fait à la construction, en lisant du texte : une refonte de
  // `routes.ts` peut le rendre aveugle sans qu'aucun test ne s'en aperçoive —
  // c'est arrivé le jour où les vues sont passées en chargement différé. On
  // compte donc les routes déclarées et on refuse de construire un index qui
  // en aurait perdu en chemin, plutôt que de livrer une recherche à moitié
  // vide.
  const declared = (routes.match(/^\s*path:\s*'/gm) ?? []).length;
  if (declared === 0 || out.size < declared) {
    throw new Error(
      `Index des pages : ${out.size} route(s) reconnue(s) sur ${declared} déclarée(s) dans routes.ts. ` +
        'Le relevé des chargeurs ne correspond plus à la forme du fichier.',
    );
  }
  return out;
}

export function buildPageIndex(root = process.cwd()): PageEntry[] {
  const files = routeFiles(root);
  const known = new Set(readdirSync(join(root, VIEWS)));
  const entries: PageEntry[] = [];
  for (const [path, file] of files) {
    if (!known.has(file)) continue;
    const source = readFileSync(join(root, VIEWS, file), 'utf8');
    entries.push({
      path,
      headings: headingsOf(source),
      words: wordsOf(stringsOf(source).filter(isProse)),
    });
  }
  return entries;
}

/** Valeur d'un champ « nom: '…' » dans un bloc, quelle que soit la guillemet. */
function field(block: string, name: string): string | null {
  const match = new RegExp(`\\b${name}:\\s*(?:\\n\\s*)?(['"])((?:[^'"\\\\]|\\\\.)*)\\1`).exec(block);
  return match ? (match[2] ?? '').replace(/\\(.)/g, '$1') : null;
}

/**
 * Les énoncés des quatre cent quarante-neuf questions.
 *
 * Ils sont relevés ici plutôt que chargés à l'exécution : les questions
 * complètes pèsent soixante kilo-octets compressés, que personne n'a envie de
 * télécharger pour taper trois lettres dans une barre de recherche.
 */
export function buildQuestionIndex(root = process.cwd()): QuestionEntry[] {
  const topics = new Map<string, { label: string; route: string }>();
  const quiz = readFileSync(join(root, 'src/data/quiz.ts'), 'utf8');
  // Chaque thème tient sur une ligne : la lire entière évite qu'une expression
  // gourmande n'aille chercher le « route » d'un thème deux lignes plus bas.
  for (const line of quiz.split('\n')) {
    const id = field(line, 'id');
    const label = field(line, 'label');
    const route = field(line, 'route');
    if (id && label && route) topics.set(id, { label, route: route.replace(/^#/, '') });
  }

  const out: QuestionEntry[] = [];
  for (const file of readdirSync(join(root, 'src/data')).filter((name) => /^quiz-.*\.ts$/.test(name))) {
    const source = readFileSync(join(root, 'src/data', file), 'utf8');
    for (const block of source.split(/\n  \{\n/).slice(1)) {
      const prompt = field(block, 'prompt');
      const key = field(block, 'topic');
      if (!prompt || !key) continue;
      const known = topics.get(key);
      out.push({
        prompt,
        topic: known?.label ?? key,
        route: (field(block, 'route') ?? known?.route ?? '/licence/questionnaire').replace(/^#/, ''),
      });
    }
  }
  return out;
}

export function searchIndexPlugin(root = process.cwd()): Plugin {
  return {
    name: 'morse-index-pages',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_ID) return null;
      return [
        `export const PAGES = ${JSON.stringify(buildPageIndex(root))};`,
        `export const QUESTIONS = ${JSON.stringify(buildQuestionIndex(root))};`,
        '',
      ].join('\n');
    },
    configureServer(server) {
      // En développement, modifier une page doit rafraîchir son index.
      server.watcher.on('change', (file) => {
        if (!file.includes(`${VIEWS.replace('/', '\\')}`) && !file.includes(VIEWS)) return;
        const module = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (module) server.moduleGraph.invalidateModule(module);
      });
    },
  };
}
