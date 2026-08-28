/**
 * Page « Réglages ».
 *
 * Chaque réglage est accompagné d'une phrase qui dit à quoi il sert et quelle
 * valeur choisir : un trainer de morse expose forcément des notions techniques
 * (Farnsworth, mode iambique, unité de temps) qu'on ne peut pas deviner.
 */

import { h, field, setChildren } from '../ui/dom.ts';
import { createThemeOptions, createThemePicker } from '../ui/theme-picker.ts';
import { keepFocus, slider } from '../ui/controls.ts';
import { keyLabel, resolveCode } from '../ui/keys.ts';
import { MorsePlayer } from '../ui/player.ts';
import { SignalLamp } from '../ui/lamp.ts';
import { hapticsSupported } from '../core/haptics.ts';
import { bandNoiseSupported, presetForDb, SNR_PRESETS } from '../core/noise.ts';
import { KOCH_ORDERS, kochMaxLevel } from '../core/koch.ts';
import { buildSaveFile, downloadText, parseSaveFile, storageAvailable } from '../core/storage.ts';
import { DEFAULT_SETTINGS } from '../core/settings.ts';
import type { View, ViewContext } from '../ui/router.ts';

/**
 * Les catégories de réglages.
 *
 * Huit cartes à la file, c'était une liste où l'on descendait en cherchant.
 * Les onglets rangent la même chose par question posée : ce que j'entends, ce
 * que je manipule, ce que le site me renvoie, à quoi il ressemble, ce que
 * j'apprends, ce que je garde.
 *
 * L'ordre n'est pas alphabétique mais celui de la fréquence d'usage : la
 * vitesse se règle à chaque séance, les données une fois par an.
 */
const ONGLETS: { id: string; label: string; intro: string }[] = [
  {
    id: 'ecoute',
    label: 'Écoute',
    intro: 'La vitesse du code, le timbre de la note, et le bruit de bande.',
  },
  {
    id: 'manipulateur',
    label: 'Manipulateur',
    intro: 'Le type de manip, ses tolérances, et les touches qui le commandent.',
  },
  {
    id: 'retours',
    label: 'Retours',
    intro: 'Ce que le site fait voir, sentir et entendre quand vous agissez.',
  },
  {
    id: 'apparence',
    label: 'Apparence',
    intro: 'L’habit du site, la lumière de sa pièce, et sa police.',
  },
  {
    id: 'apprentissage',
    label: 'Apprentissage',
    intro: 'La méthode Koch, le seuil de passage et la longueur des séries.',
  },
  {
    id: 'donnees',
    label: 'Mes données',
    intro: 'Sauvegarde, import, mise à jour et remise à zéro.',
  },
];

const ONGLET_CLE = 'morse-training/reglages-onglet';

/**
 * Deux exemplaires de cette page coexistent : celle du menu et celle du
 * panneau. Sans identifiants distincts, `aria-controls` désignerait le mauvais
 * panneau et un lecteur d'écran annoncerait n'importe quoi.
 */
let compteurPanneau = 0;

type BindingKey = 'keyStraight' | 'keyDit' | 'keyDah';

export function settingsView(context: ViewContext): View {
  const { store } = context;
  const lamp = new SignalLamp('Essai');
  const player = new MorsePlayer(store, lamp);
  const container = h('div', { class: 'stack' });

  let capturing: BindingKey | null = null;

  const captureButton = (key: BindingKey, label: string): HTMLElement => {
    const button = h('button', {
      class: 'btn btn--key',
      type: 'button',
      text: keyLabel(store.settings[key]),
      attrs: { 'aria-label': `${label} : ${keyLabel(store.settings[key])}. Cliquez pour changer.` },
      on: {
        click: () => {
          capturing = key;
          button.textContent = 'Appuyez sur une touche…';
          button.classList.add('is-capturing');
        },
      },
    });
    return button;
  };

  const onCaptureKey = (event: KeyboardEvent): void => {
    if (!capturing) return;
    event.preventDefault();
    event.stopPropagation();
    const code = resolveCode(event);
    if (code !== 'Escape') store.updateSettings({ [capturing]: code });
    capturing = null;
    render();
  };
  window.addEventListener('keydown', onCaptureKey, true);

  const exportSave = (): void => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadText(
      `morse-training-${stamp}.json`,
      JSON.stringify(buildSaveFile(store.settings, store.progress), null, 2),
    );
    context.toast('Sauvegarde exportée.', 'success');
  };

  const importInput = h('input', {
    type: 'file',
    attrs: {
      accept: 'application/json,.json',
      hidden: 'true',
      'aria-label': 'Choisir un fichier de sauvegarde à importer',
    },
    on: {
      change: (event) => {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          const result = parseSaveFile(String(reader.result ?? ''));
          if (!result.ok || !result.settings || !result.progress) {
            context.toast(result.message, 'error');
            return;
          }
          store.replaceState(result.settings, result.progress);
          context.toast('Sauvegarde importée.', 'success');
        });
        reader.readAsText(file);
        input.value = '';
      },
    },
  });

  // Le redessin attend la frame suivante. Deux raisons : quitter un champ
  // déclenche sa validation, donc une mise à jour, donc ce redessin — remplacer
  // le contenu au milieu du traitement du « blur » fait échouer le navigateur.

  const uid = `reglages-${(compteurPanneau += 1)}`;

  const ongletEnregistre = (): string => {
    try {
      const brut = window.localStorage.getItem(ONGLET_CLE);
      return ONGLETS.some((o) => o.id === brut) ? (brut as string) : 'ecoute';
    } catch {
      return 'ecoute';
    }
  };

  let onglet = ongletEnregistre();

  /*
   * La bande est construite une fois pour toutes, et seul le panneau est
   * redessiné.
   *
   * Ce n'est pas qu'une économie : une page de réglages se redessine à chaque
   * mouvement de curseur, et un trait recréé à chaque fois repartirait de zéro
   * au lieu de glisser. Ce qui ne dépend pas des réglages ne doit pas dépendre
   * du dessin.
   */
  const trait = h('span', { class: 'reglages__trait', attrs: { 'aria-hidden': 'true' } });

  const panneau = h('div', {
    class: 'reglages__panneau',
    attrs: {
      role: 'tabpanel',
      id: `${uid}-panneau`,
      tabindex: '0',
    },
  });

  const boutons = new Map<string, HTMLButtonElement>();

  /**
   * Le trait suit l'onglet ouvert au lieu de sauter d'un point à l'autre. Il
   * se replace après chaque changement, et quand la largeur de la fenêtre
   * change : les libellés n'ont alors plus la même place.
   */
  const placeTrait = (): void => {
    const actif = boutons.get(onglet);
    if (!actif) return;
    trait.style.width = `${actif.offsetWidth}px`;
    trait.style.transform = `translateX(${actif.offsetLeft}px)`;
  };

  const choisir = (id: string): void => {
    if (id === onglet) return;
    onglet = id;
    try {
      window.localStorage.setItem(ONGLET_CLE, id);
    } catch {
      // Le dernier onglet ouvert n'est qu'un confort : on ignore l'échec.
    }
    draw();
    const bouton = boutons.get(id);
    bouton?.focus();
    // Sur téléphone la bande défile : l'onglet choisi doit être visible.
    bouton?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };

  /** Flèches, Origine et Fin, comme le veut le motif ARIA des onglets. */
  const auClavier = (event: KeyboardEvent, id: string): void => {
    const rang = ONGLETS.findIndex((o) => o.id === id);
    let cible = -1;
    if (event.key === 'ArrowRight') cible = (rang + 1) % ONGLETS.length;
    else if (event.key === 'ArrowLeft') cible = (rang - 1 + ONGLETS.length) % ONGLETS.length;
    else if (event.key === 'Home') cible = 0;
    else if (event.key === 'End') cible = ONGLETS.length - 1;
    if (cible < 0) return;
    event.preventDefault();
    choisir(ONGLETS[cible]?.id ?? 'ecoute');
  };

  const bande = h(
    'div',
    {
      class: 'reglages__bande',
      attrs: { role: 'tablist', 'aria-label': 'Catégories de réglages' },
    },
    ...ONGLETS.map((o) => {
      const bouton = h('button', {
        class: 'reglages__onglet',
        type: 'button',
        text: o.label,
        data: { focusKey: `onglet-${o.id}` },
        attrs: {
          role: 'tab',
          id: `${uid}-onglet-${o.id}`,
          'aria-controls': `${uid}-panneau`,
          'aria-selected': 'false',
          // Un seul onglet dans l'ordre de tabulation : on entre dans la bande
          // par celui qui est ouvert, et on circule aux flèches.
          tabindex: '-1',
        },
        on: {
          click: () => choisir(o.id),
          keydown: (event) => auClavier(event, o.id),
        },
      }) as HTMLButtonElement;
      boutons.set(o.id, bouton);
      return bouton;
    }),
    trait,
  );

  container.append(bande, panneau);

  const dessineOnglets = (cartes: Record<string, Array<() => HTMLElement>>): void => {
    const actif = ONGLETS.find((o) => o.id === onglet) ?? (ONGLETS[0] as (typeof ONGLETS)[number]);

    for (const [id, bouton] of boutons) {
      const choisi = id === actif.id;
      bouton.setAttribute('aria-selected', String(choisi));
      bouton.tabIndex = choisi ? 0 : -1;
    }
    panneau.setAttribute('aria-labelledby', `${uid}-onglet-${actif.id}`);

    setChildren(panneau, [
      h('p', { class: 'reglages__intro', text: actif.intro }),
      ...(cartes[actif.id] ?? []).map((fabrique) => fabrique()),
    ]);

    placeTrait();
  };

  /*
   * Le trait ne peut pas se placer au premier dessin : la vue n'est pas encore
   * dans le document, et un bouton hors du document n'a aucune largeur. On
   * observe donc la bande — ce qui règle du même coup le redimensionnement de
   * la fenêtre, qui change la place des libellés.
   */
  const observateur =
    typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => placeTrait());
  observateur?.observe(bande);
  const surRedimensionnement = (): void => placeTrait();
  if (!observateur) window.addEventListener('resize', surRedimensionnement);

  // Et pendant qu'on glisse un curseur, les dizaines d'appels se regroupent en
  // un seul dessin.
  let pending = 0;
  const render = (): void => {
    if (pending) return;
    pending = window.requestAnimationFrame(() => {
      pending = 0;
      keepFocus(container, draw);
    });
  };

  const draw = (): void => {
    const s = store.settings;
    const timing = store.timing;
    const paddleMode = s.keyerMode !== 'straight';

    // --- Vitesse ---
    const carteVitesse = (): HTMLElement =>
      h(
        'section',
        { class: 'card' },
        h('h2', { class: 'card__title', text: 'Vitesse' }),
        field(
          'Vitesse des caractères',
          slider({
            min: 5,
            max: 40,
            value: s.charWpm,
            format: (value) => String(value),
            unit: 'WPM',
            id: 'charWpm',
            label: 'Vitesse des caractères, en mots par minute',
            onInput: (value) => store.updateSettings({ charWpm: value }),
          }),
          `La vitesse à laquelle chaque caractère est émis. Une unité vaut actuellement ${Math.round(timing.unit * 1000)} ms. ` +
            'Réglez-la à 18 ou 20 WPM dès le début et ne la baissez plus : c’est la clef pour ne pas apprendre à compter les points.',
        ),
        field(
          'Vitesse globale (Farnsworth)',
          slider({
            min: 5,
            max: 40,
            value: s.effectiveWpm,
            format: (value) => String(value),
            unit: 'WPM',
            id: 'effectiveWpm',
            label: 'Vitesse globale, en mots par minute',
            onInput: (value) => store.updateSettings({ effectiveWpm: value }),
          }),
          timing.farnsworth
            ? `Les silences sont étirés : ${Math.round(timing.interChar * 1000)} ms entre deux caractères au lieu de ${Math.round(timing.unit * 3000)} ms. C’est ce réglage qu’on augmente pour progresser.`
            : 'Égale à la vitesse des caractères : aucun étirement des silences. Baissez-la pour vous laisser plus de temps entre les caractères.',
        ),
        h(
          'div',
          { class: 'demo-row' },
          h('button', {
            class: 'btn',
            type: 'button',
            text: 'Écouter un exemple',
            on: {
              click: () => {
                player.stop();
                void player.play('CQ DE F5ABC');
              },
            },
          }),
          lamp.element,
        ),
      );

    // --- Son ---
    const carteSon = (): HTMLElement =>
      h(
        'section',
        { class: 'card' },
        h('h2', { class: 'card__title', text: 'Son' }),
        field(
          'Tonalité',
          slider({
            min: 300,
            max: 1200,
            step: 10,
            value: s.frequency,
            format: (value) => String(value),
            unit: 'Hz',
            id: 'frequency',
            label: 'Tonalité, en hertz',
            onInput: (value) => store.updateSettings({ frequency: value }),
          }),
          'La plupart des opérateurs se placent entre 550 et 750 Hz. Une tonalité trop aiguë fatigue vite ; une tonalité trop grave se confond avec le bruit de fond.',
        ),
        field(
          'Volume',
          slider({
            min: 0,
            max: 100,
            value: Math.round(s.volume * 100),
            format: (value) => String(value),
            unit: '%',
            id: 'volume',
            label: 'Volume, en pourcentage',
            onInput: (value) => store.updateSettings({ volume: value / 100 }),
          }),
        ),
        field(
          'Douceur de l’attaque',
          slider({
            min: 1,
            max: 20,
            value: s.rampMs,
            format: (value) => String(value),
            unit: 'ms',
            id: 'rampMs',
            label: 'Douceur de l’attaque, en millisecondes',
            onInput: (value) => store.updateSettings({ rampMs: value }),
          }),
          'Durée de la montée et de la descente du son. En dessous de 3 ms apparaissent les « clics de manipulation », désagréables à l’oreille et mal vus en trafic réel.',
        ),
        field(
          'Forme d’onde',
          h(
            'select',
            {
              class: 'select',
              on: {
                change: (event) =>
                  store.updateSettings({
                    waveform: (event.target as HTMLSelectElement).value as typeof s.waveform,
                  }),
              },
            },
            ...(
              [
                ['sine', 'Sinusoïde — pure, la plus proche d’un récepteur radio'],
                ['triangle', 'Triangle — légèrement plus présente'],
                ['square', 'Carrée — dure, très perçante'],
                ['sawtooth', 'Dent de scie — riche en harmoniques'],
              ] as const
            ).map(([value, label]) =>
              h('option', { value, text: label, attrs: { selected: s.waveform === value } }),
            ),
          ),
        ),
        field(
          'Silence de fin',
          slider({
            min: 0,
            max: 10,
            value: s.tailUnits,
            format: (value) => String(value),
            unit: 'unités',
            id: 'tailUnits',
            label: 'Silence de fin, en unités',
            onInput: (value) => store.updateSettings({ tailUnits: value }),
          }),
          `Silence ajouté après le dernier signal, soit ${Math.round(s.tailUnits * timing.unit * 1000)} ms à la vitesse actuelle. Il détache la fin de l’émission de l’extinction de la sortie audio, que beaucoup de casques — surtout en Bluetooth — signalent par un léger craquement qu’on prend alors pour un élément du code.`,
        ),
        h('p', { class: 'field__hint' },
          'Sur iPhone et iPad, le son du navigateur suit le bouton silencieux physique. Si vous n’entendez rien, vérifiez-le avant tout le reste.'),
      );

    // --- Bruit de fond ---
    const carteBruit = (): HTMLElement =>
      h(
        'section',
        { class: 'card' },
        h('h2', { class: 'card__title', text: 'Bruit de fond' }),
        field(
          'Bruit de réception',
          h(
            'label',
            { class: 'switch' },
            h('input', {
              type: 'checkbox',
              attrs: { checked: s.noiseEnabled, disabled: !bandNoiseSupported() },
              on: {
                change: (event) =>
                  store.updateSettings({ noiseEnabled: (event.target as HTMLInputElement).checked }),
              },
            }),
            h('span', { text: 'Un fond de bande pendant les séances' }),
          ),
          bandNoiseSupported()
            ? "Un récepteur ne laisse passer qu’une bande étroite autour de la tonalité : le bruit qu’on entend en trafic réel n’est pas du bruit blanc mais un souffle coloré, dans lequel les signaux se détachent. Il démarre avec une série d’entraînement ou un enregistrement et s’arrête avec elle. Accessoirement, il maintient la sortie audio active et supprime le craquement d’extinction entre deux caractères."
            : "Ce navigateur ne sait pas fabriquer le bruit filtré : la génération hors ligne lui manque.",
        ),
        field(
          'Conditions d’écoute',
          h(
            'div',
            { class: 'segmented segmented--wrap', attrs: { role: 'group', 'aria-label': 'Conditions d’écoute' } },
            ...SNR_PRESETS.map((preset) =>
              h('button', {
                class: `segmented__item${presetForDb(s.noiseSnrDb).id === preset.id ? ' is-active' : ''}`,
                type: 'button',
                text: preset.label,
                title: `${preset.db} dB — ${preset.hint}`,
                on: { click: () => store.updateSettings({ noiseSnrDb: preset.db }) },
              }),
            ),
          ),
          `Rapport signal sur bruit : ${s.noiseSnrDb} dB. ${presetForDb(s.noiseSnrDb).hint} Copier dans le bruit est la compétence qui compte vraiment sur l’air ; descendre d’un cran quand la copie devient facile vaut mieux que d’accélérer.`,
        ),
      );

    // --- Manipulateur ---
    const carteManipulateur = (): HTMLElement =>
      h(
        'section',
        { class: 'card' },
        field(
          'Type de manipulateur',
          h(
            'select',
            {
              class: 'select',
              on: {
                change: (event) =>
                  store.updateSettings({
                    keyerMode: (event.target as HTMLSelectElement).value as typeof s.keyerMode,
                  }),
              },
            },
            ...(
              [
                ['straight', 'Manipulateur droit — une seule touche'],
                ['paddle-single', 'Palettes — un élément par appui'],
                ['iambic-a', 'Palettes iambiques — mode A'],
                ['iambic-b', 'Palettes iambiques — mode B'],
              ] as const
            ).map(([value, label]) =>
              h('option', { value, text: label, attrs: { selected: s.keyerMode === value } }),
            ),
          ),
          "Au manipulateur droit, la durée de l’appui distingue le point du trait. Aux palettes, une touche donne les points, l’autre les traits, et l’électronique cale les durées. « Un élément par appui » ne répète rien tant que la touche reste enfoncée : c’est le réglage à choisir si les éléments partent en rafale avant que vous ayez le temps de relâcher. Les modes iambiques enchaînent au maintien, comme un vrai manipulateur ; le mode B ajoute un élément après un relâchement en pince, commencez donc par le mode A.",
        ),
        field(
          s.keyerMode === 'straight' ? 'Touche du manipulateur' : 'Touche des points',
          captureButton(s.keyerMode === 'straight' ? 'keyStraight' : 'keyDit', 'Touche'),
          'Cliquez sur le bouton puis appuyez sur la touche voulue. Échap annule.',
        ),
        paddleMode
          ? field('Touche des traits', captureButton('keyDah', 'Touche des traits'))
          : null,
        paddleMode
          ? field(
              'Inverser les palettes',
              h(
                'label',
                { class: 'switch' },
                h('input', {
                  type: 'checkbox',
                  attrs: { checked: s.swapPaddles },
                  on: {
                    change: (event) =>
                      store.updateSettings({ swapPaddles: (event.target as HTMLInputElement).checked }),
                  },
                }),
                h('span', { text: 'Points à droite, traits à gauche' }),
              ),
              'Pour les gauchers, ou simplement par habitude inverse.',
            )
          : null,
        field(
          'Frappe indulgente',
          h(
            'label',
            { class: 'switch' },
            h('input', {
              type: 'checkbox',
              attrs: { checked: s.forgivingKeying },
              on: {
                change: (event) =>
                  store.updateSettings({ forgivingKeying: (event.target as HTMLInputElement).checked }),
              },
            }),
            h('span', { text: "Aucune contrainte de temps entre les éléments" }),
          ),
          "Dans les exercices guidés, le décodage cesse d’être arbitré par un chronomètre : chaque élément est comparé au code attendu. Un début valide vous laisse tout le temps voulu, le caractère se valide dès que son code est complet, et seule une erreur réelle interrompt la saisie. En manipulation libre, les silences sont simplement interprétés bien plus largement.",
        ),
        field(
          'Seuil adaptatif',
          h(
            'label',
            { class: 'switch' },
            h('input', {
              type: 'checkbox',
              attrs: { checked: s.adaptiveKeying },
              on: {
                change: (event) =>
                  store.updateSettings({ adaptiveKeying: (event.target as HTMLInputElement).checked }),
              },
            }),
            h('span', { text: 'Suivre ma vitesse réelle de frappe' }),
          ),
          'Le décodeur ajuste la frontière entre point et trait sur votre frappe plutôt que sur la vitesse annoncée. À laisser activé au manipulateur droit ; sans effet aux palettes, où les durées sont générées.',
        ),
      );

    // --- Sorties ---
    const carteRetours = (): HTMLElement =>
      h(
        'section',
        { class: 'card' },
        field(
          'Diode témoin',
          h(
            'label',
            { class: 'switch' },
            h('input', {
              type: 'checkbox',
              attrs: { checked: s.visualSignal },
              on: {
                change: (event) =>
                  store.updateSettings({ visualSignal: (event.target as HTMLInputElement).checked }),
              },
            }),
            h('span', { text: 'Allumer une diode pendant chaque signal' }),
          ),
          'La diode reste allumée exactement le temps du signal : une lueur brève pour un point, trois fois plus longue pour un trait. Aucun clignotement plein écran, qui serait épuisant et risque pour les personnes photosensibles.',
        ),
        field(
          'Ruban du signal',
          h(
            'label',
            { class: 'switch' },
            h('input', {
              type: 'checkbox',
              attrs: { checked: s.signalTrace },
              on: {
                change: (event) =>
                  store.updateSettings({ signalTrace: (event.target as HTMLInputElement).checked }),
              },
            }),
            h('span', { text: 'Dessiner le signal pendant qu’il se joue' }),
          ),
          'Le papier avance sous un repère fixe et le signal s’y inscrit, comme sur l’encreur de 1844 ; la lettre apparaît sous son groupe une fois le silence long passé. Il montre le rythme, ce qui aide beaucoup au début — et gêne ensuite, quand il s’agit justement de l’entendre sans le voir.',
        ),
        field(
          'Souffle du récepteur',
          h(
            'label',
            { class: 'switch' },
            h('input', {
              type: 'checkbox',
              attrs: { checked: s.signalWaves, disabled: !s.signalTrace },
              on: {
                change: (event) =>
                  store.updateSettings({ signalWaves: (event.target as HTMLInputElement).checked }),
              },
            }),
            h('span', { text: 'Une houle très basse derrière le ruban' }),
          ),
          'Le bruit de fond de la réception, dessiné : une ondulation de deux ou trois pixels sur laquelle le signal se détache. Purement visuelle — elle ne s’entend pas, et n’a rien à voir avec le bruit de bande, qui se règle dans l’onglet Écoute. Elle s’arrête d’elle-même si votre système demande moins d’animation.',
        ),
        field(
          'Retour haptique',
          h(
            'label',
            { class: 'switch' },
            h('input', {
              type: 'checkbox',
              attrs: { checked: s.haptics, disabled: !hapticsSupported() },
              on: {
                change: (event) =>
                  store.updateSettings({ haptics: (event.target as HTMLInputElement).checked }),
              },
            }),
            h('span', { text: 'Vibrer au rythme du morse' }),
          ),
          hapticsSupported()
            ? 'Le motif complet est confié au système d’un seul coup, ce qui donne un rythme bien plus régulier qu’une suite d’appels. Au manipulateur droit, la vibration dure exactement le temps de l’appui.'
            : 'Votre navigateur n’expose pas l’API Vibration. C’est le cas de Safari sur iPhone et iPad : aucune interface web ne permet d’y piloter le moteur haptique. Sur Android avec Chrome ou Firefox, la fonction est disponible.',
        ),
        field(
          'Sons de l’interface',
          h(
            'label',
            { class: 'switch' },
            h('input', {
              type: 'checkbox',
              attrs: { checked: s.uiSounds },
              on: {
                change: (event) =>
                  store.updateSettings({ uiSounds: (event.target as HTMLInputElement).checked }),
              },
            }),
            h('span', { text: 'Confirmation et erreur' }),
          ),
        ),
        field(
          'D’une page à l’autre',
          h(
            'select',
            {
              class: 'select',
              on: {
                change: (event) =>
                  store.updateSettings({
                    pageMotion: (event.target as HTMLSelectElement).value as typeof s.pageMotion,
                  }),
              },
            },
            ...(
              [
                ['glissement', 'Glissement — la page entre par le côté, dans le sens du parcours'],
                ['fondu', 'Fondu — un enchaînement court, presque invisible'],
                ['aucun', 'Aucune — la page est remplacée d’un seul coup'],
              ] as const
            ).map(([value, label]) =>
              h('option', { value, text: label, attrs: { selected: s.pageMotion === value } }),
            ),
          ),
          'Le glissement dit le sens : on entre par la droite en descendant dans le site, par la gauche en remontant. Les trois restent sous les trois cents millisecondes — au-delà, une transition qu’on traverse cent fois par séance devient une attente. Si votre système demande moins d’animation, aucune n’est jouée.',
        ),
      );

    // --- Apprentissage ---
    const carteApprentissage = (): HTMLElement =>
      h(
        'section',
        { class: 'card' },
        field(
          'Ordre d’introduction des caractères',
          h(
            'select',
            {
              class: 'select',
              on: {
                change: (event) =>
                  store.updateSettings({
                    kochOrder: (event.target as HTMLSelectElement).value as typeof s.kochOrder,
                  }),
              },
            },
            ...KOCH_ORDERS.map((order) =>
              h('option', { value: order.id, text: order.label, attrs: { selected: s.kochOrder === order.id } }),
            ),
          ),
          KOCH_ORDERS.find((order) => order.id === s.kochOrder)?.description ?? '',
        ),
        field(
          'Seuil pour débloquer un caractère',
          slider({
            min: 60,
            max: 100,
            step: 5,
            value: Math.round(s.kochThreshold * 100),
            format: (value) => String(value),
            unit: '%',
            id: 'kochThreshold',
            label: 'Précision à atteindre, en pourcentage',
            onInput: (value) => store.updateSettings({ kochThreshold: value / 100 }),
          }),
          'Précision à atteindre sur une série avant d’ajouter le caractère suivant. Le seuil classique est 90 %.',
        ),
        field(
          'Longueur d’une série',
          slider({
            min: 10,
            max: 60,
            step: 5,
            value: s.sessionLength,
            format: (value) => String(value),
            unit: 'caractères',
            id: 'sessionLength',
            label: 'Longueur de série, en caractères',
            onInput: (value) => store.updateSettings({ sessionLength: value }),
          }),
          'Des séries courtes et répétées valent mieux qu’une séance interminable.',
        ),
        field(
          'Niveau Koch',
          h(
            'div',
            { class: 'inline-controls' },
            h('button', {
              class: 'btn',
              type: 'button',
              text: '−',
              attrs: { 'aria-label': 'Retirer un caractère' },
              on: {
                click: () =>
                  store.mutateProgress((progress) => {
                    progress.kochLevel = Math.max(2, progress.kochLevel - 1);
                  }),
              },
            }),
            h('span', { class: 'inline-controls__value', text: `${store.progress.kochLevel} / ${kochMaxLevel(s.kochOrder)}` }),
            h('button', {
              class: 'btn',
              type: 'button',
              text: '+',
              attrs: { 'aria-label': 'Ajouter un caractère' },
              on: {
                click: () =>
                  store.mutateProgress((progress) => {
                    progress.kochLevel = Math.min(kochMaxLevel(s.kochOrder), progress.kochLevel + 1);
                  }),
              },
            }),
          ),
          'Le niveau monte normalement tout seul à la fin d’une série réussie. Ce réglage sert à reprendre plus haut si vous connaissez déjà une partie du code.',
        ),
      );

    // --- Apparence ---
    const carteApparence = (): HTMLElement =>
      h(
        'section',
        { class: 'card' },
        field(
          'Habit',
          createThemePicker({ store }),
          'Chaque habit est une palette complète : couleurs, ombres, angles et police. Cinq d’entre eux portent des années, et le mode histoire s’en sert pour ouvrir chaque épisode dans l’habit de son époque ; les autres sont des lieux sans date. Ceux qui déclarent une source de lumière l’allument dans la pièce : une fenêtre, une bougie, un phare, un orage.',
        ),
        ...createThemeOptions(store),
      );

    // --- Données ---
    const carteDonnees = (): HTMLElement =>
      h(
        'section',
        { class: 'card' },
        h('p', { class: 'field__hint' },
          `Version installée : ${__BUILD_STAMP__}. « Forcer la mise à jour » vide le cache hors ligne et recharge le site, ` +
          "à utiliser si une correction annoncée ne semble pas appliquée. Votre progression n’est pas touchée."),
        h('p', { class: 'card__hint' },
          storageAvailable()
            ? 'Réglages et progression sont enregistrés dans ce navigateur uniquement. Rien n’est envoyé sur un serveur, il n’y à ni compte ni suivi.'
            : 'Le stockage local est indisponible (navigation privée ?). Votre progression sera perdue en fermant l’onglet ; pensez à exporter.'),
        h(
          'div',
          { class: 'actions' },
          h('button', { class: 'btn btn--primary', type: 'button', text: 'Exporter en JSON', on: { click: exportSave } }),
          h('button', {
            class: 'btn',
            type: 'button',
            text: 'Importer',
            on: { click: () => importInput.click() },
          }),
          importInput,
          h('button', {
            class: 'btn btn--ghost',
            type: 'button',
            text: 'Réglages par défaut',
            on: {
              click: () => {
                store.updateSettings({ ...DEFAULT_SETTINGS });
                context.toast('Réglages remis à zéro.', 'info');
                render();
              },
            },
          }),
          h('button', {
            class: 'btn',
            type: 'button',
            text: 'Forcer la mise à jour',
            on: {
              click: async () => {
                store.saveNow();
                // Dernier recours quand le service worker s'obstine à servir
                // une version périmée : on le désinscrit, on vide les caches,
                // puis on recharge. La progression est déjà écrite sur disque.
                try {
                  const registrations = (await navigator.serviceWorker?.getRegistrations?.()) ?? [];
                  await Promise.all(registrations.map((registration) => registration.unregister()));
                  if ('caches' in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map((key) => caches.delete(key)));
                  }
                } catch {
                  // Même si le nettoyage échoue, le rechargement peut suffire.
                }
                window.location.reload();
              },
            },
          }),
          h('button', {
            class: 'btn btn--danger',
            type: 'button',
            text: 'Effacer ma progression',
            on: {
              click: () => {
                if (!window.confirm('Effacer définitivement statistiques, niveau et succès ? Cette action est irréversible.')) return;
                store.resetProgress();
                context.toast('Progression effacée.', 'info');
              },
            },
          }),
        ),
      );

    const CARTES: Record<string, Array<() => HTMLElement>> = {
      ecoute: [carteVitesse, carteSon, carteBruit],
      manipulateur: [carteManipulateur],
      retours: [carteRetours],
      apparence: [carteApparence],
      apprentissage: [carteApprentissage],
      donnees: [carteDonnees],
    };

    dessineOnglets(CARTES);
  };

  draw();
  const unsubscribe = store.subscribe(render);

  return {
    element: container,
    destroy: () => {
      if (pending) window.cancelAnimationFrame(pending);
      window.removeEventListener('keydown', onCaptureKey, true);
      observateur?.disconnect();
      window.removeEventListener('resize', surRedimensionnement);
      unsubscribe();
      player.stop();
    },
  };
}
