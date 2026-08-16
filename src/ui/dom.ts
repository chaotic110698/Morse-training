/**
 * Fabrique d'elements DOM.
 *
 * Le site n'utilise aucun framework : cette poignee de fonctions remplace le
 * JSX sans rien imposer, et surtout sans cycle de rendu qui viendrait
 * s'intercaler entre l'horloge audio et l'affichage.
 */

type Child = Node | string | number | null | undefined | false;

export interface ElementProps {
  class?: string;
  id?: string;
  text?: string;
  html?: string;
  title?: string;
  type?: string;
  value?: string;
  href?: string;
  disabled?: boolean;
  attrs?: Record<string, string | number | boolean | null>;
  data?: Record<string, string | number>;
  style?: Partial<CSSStyleDeclaration>;
  on?: Partial<{
    [K in keyof HTMLElementEventMap]: (event: HTMLElementEventMap[K]) => void;
  }>;
  /** Options passees a `addEventListener` pour tous les ecouteurs de `on`. */
  listenerOptions?: AddEventListenerOptions;
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ElementProps = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (props.class) element.className = props.class;
  if (props.id) element.id = props.id;
  if (props.title) element.title = props.title;
  if (props.text !== undefined) element.textContent = props.text;
  if (props.html !== undefined) element.innerHTML = props.html;
  if (props.type && 'type' in element) (element as HTMLInputElement).type = props.type;
  if (props.value !== undefined && 'value' in element) (element as HTMLInputElement).value = props.value;
  if (props.href && 'href' in element) (element as HTMLAnchorElement).href = props.href;
  if (props.disabled !== undefined && 'disabled' in element) {
    (element as HTMLButtonElement).disabled = props.disabled;
  }

  for (const [key, value] of Object.entries(props.attrs ?? {})) {
    if (value === null || value === false) element.removeAttribute(key);
    else element.setAttribute(key, value === true ? '' : String(value));
  }
  for (const [key, value] of Object.entries(props.data ?? {})) {
    element.dataset[key] = String(value);
  }
  if (props.style) Object.assign(element.style, props.style);
  for (const [event, handler] of Object.entries(props.on ?? {})) {
    element.addEventListener(event, handler as EventListener, props.listenerOptions);
  }

  append(element, children);
  return element;
}

export function append(parent: Node, children: Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    parent.appendChild(typeof child === 'object' ? child : document.createTextNode(String(child)));
  }
}

/**
 * Remplace le contenu d'un element en ignorant les enfants absents, ce que
 * `replaceChildren` ne sait pas faire : cela permet d'ecrire directement
 * `condition ? element : null` dans une liste d'enfants.
 */
export function setChildren(parent: Element, children: Child[]): void {
  clear(parent);
  append(parent, children);
}

export function clear(node: Node): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/** Element SVG, pour les icones et les graphiques de progression. */
export function svg(
  tag: string,
  attrs: Record<string, string | number> = {},
  ...children: Array<SVGElement | string>
): SVGElement {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, String(value));
  for (const child of children) {
    element.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return element;
}

/** Bloc titre + contenu, motif repete dans toutes les pages. */
export function section(title: string, ...children: Child[]): HTMLElement {
  return h('section', { class: 'card' }, h('h2', { class: 'card__title', text: title }), ...children);
}

/** Etiquette de reglage avec son controle. */
export function field(label: string, control: Node, hint?: string): HTMLElement {
  return h(
    'div',
    { class: 'field' },
    h('div', { class: 'field__label' }, label),
    h('div', { class: 'field__control' }, control),
    hint ? h('p', { class: 'field__hint', text: hint }) : null,
  );
}

/** Formate un nombre avec des espaces insecables comme separateurs de milliers. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value));
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(timestamp));
}
