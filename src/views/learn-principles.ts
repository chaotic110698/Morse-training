/** Page « Comprendre le morse » : les règles qui gouvernent le code. */

import { h } from '../ui/dom.ts';
import { SignalLamp } from '../ui/lamp.ts';
import { MorsePlayer } from '../ui/player.ts';
import { resolveTiming } from '../core/timing.ts';
import type { View, ViewContext } from '../ui/router.ts';

export function principlesView(context: ViewContext): View {
  const { store } = context;
  const lamp = new SignalLamp('Démonstration');
  const player = new MorsePlayer(store, lamp);

  const timingTable = h('tbody');
  const speedNote = h('p', { class: 'prose__note' });

  const refreshTiming = (): void => {
    const timing = resolveTiming({
      charWpm: store.settings.charWpm,
      effectiveWpm: store.settings.effectiveWpm,
    });
    const ms = (seconds: number): string => `${Math.round(seconds * 1000)} ms`;
    const rows: Array<[string, string, string]> = [
      ['Point (dit)', '1 unité', ms(timing.dit)],
      ['Trait (dah)', '3 unités', ms(timing.dah)],
      ['Silence entre deux éléments', '1 unité', ms(timing.intraChar)],
      ['Silence entre deux caractères', '3 unités', ms(timing.interChar)],
      ['Silence entre deux mots', '7 unités', ms(timing.interWord)],
    ];
    timingTable.replaceChildren(
      ...rows.map(([label, theory, value]) =>
        h(
          'tr',
          {},
          h('th', { attrs: { scope: 'row' }, text: label }),
          h('td', { text: theory }),
          h('td', { class: 'num', text: value }),
        ),
      ),
    );
    speedNote.textContent = timing.farnsworth
      ? `Vos réglages actuels : caractères à ${store.settings.charWpm} WPM, vitesse globale ${store.settings.effectiveWpm} WPM. Les silences sont donc étirés (mode Farnsworth), ce qui explique que les deux dernières lignes dépassent la proportion théorique.`
      : `Vos réglages actuels : ${store.settings.charWpm} WPM, sans étirement des silences. Les durées suivent exactement les proportions théoriques.`;
  };

  refreshTiming();
  const unsubscribe = store.subscribe(refreshTiming);

  const demoButton = h('button', {
    class: 'btn btn--primary',
    type: 'button',
    text: 'Écouter PARIS',
    on: {
      click: () => {
        if (player.playing) {
          player.stop();
          demoButton.textContent = 'Écouter PARIS';
          return;
        }
        demoButton.textContent = 'Arrêter';
        void player.play('PARIS', {
          onEnd: () => {
            demoButton.textContent = 'Écouter PARIS';
          },
        });
      },
    },
  });

  const element = h(
    'article',
    { class: 'prose' },
    h('p', { class: 'prose__lead' },
      "Le code morse ne repose que sur deux signes et sur une règle de durée. Tout le reste " +
      "— la vitesse, les méthodes d'apprentissage, les manipulateurs — découle de cette base " +
      "d'une simplicité remarquable."),

    h('h2', { text: 'Deux signes, et rien d’autre' }),
    h('p', {},
      "Le morse encode chaque caractère par une suite de deux signaux seulement : un signal court, le ",
      h('strong', { text: 'point' }),
      ", que les opérateurs prononcent « ti » (dit en anglais), et un signal long, le ",
      h('strong', { text: 'trait' }),
      ", prononcé « taa » (dah). Le E est un point unique, le T un trait unique : ce sont les deux lettres " +
      "les plus fréquentes en anglais, et ce n’est pas un hasard. Samuel Morse et Alfred Vail ont compté " +
      "les caractères dans la casse d’un imprimeur pour attribuer les codes les plus courts aux lettres " +
      "les plus utilisées. Le morse est, dès l’origine, un code de compression."),

    h('h2', { text: 'Une seule unité de temps' }),
    h('p', {},
      "Tout le code se mesure en multiples d’une unité unique : la durée d’un point. Les cinq règles " +
      "suivantes suffisent à décrire intégralement le rythme du morse, et elles n’ont jamais changé depuis " +
      "la normalisation internationale."),
    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        { class: 'data-table' },
        h(
          'thead',
          {},
          h(
            'tr',
            {},
            h('th', { attrs: { scope: 'col' }, text: 'Élément' }),
            h('th', { attrs: { scope: 'col' }, text: 'Durée théorique' }),
            h('th', { attrs: { scope: 'col' }, text: 'À vos réglages' }),
          ),
        ),
        timingTable,
      ),
    ),
    speedNote,

    h('h2', { text: 'La vitesse : mots par minute' }),
    h('p', {},
      "La vitesse s’exprime en mots par minute (WPM). Comme les mots n’ont pas tous la même longueur, " +
      "on a choisi un mot étalon : ",
      h('strong', { text: 'PARIS' }),
      ", qui dure exactement 50 unités, espace de mot compris. Émettre PARIS vingt fois en une minute, " +
      "c’est donc émettre à 20 WPM. On en tire une formule qu’il suffit de retenir :"),
    h('p', { class: 'formula', text: 'durée d’une unité (ms) = 1200 / vitesse en WPM' }),
    h('p', {},
      "À 20 WPM, une unité vaut 60 millisecondes : un point dure 60 ms, un trait 180 ms. À 5 WPM elle " +
      "vaut 240 ms. La vitesse change tout : un caractère émis lentement et le même émis vite ne sont pas " +
      "perçus par le cerveau comme le même objet."),
    h('div', { class: 'demo-row' }, demoButton, lamp.element),

    h('h2', { text: 'Farnsworth : la bonne façon de ralentir' }),
    h('p', {},
      "L’erreur classique du débutant est de ralentir les caractères pour se donner le temps de compter " +
      "les points. C’est un piège : on apprend alors à compter, pas à reconnaître, et il faut tout " +
      "réapprendre pour dépasser 10 WPM. Le mur est bien connu des opérateurs."),
    h('p', {},
      "La méthode ",
      h('strong', { text: 'Farnsworth' }),
      " résout le problème. Les caractères sont émis à pleine vitesse — leur rythme sonore est donc " +
      "d’emblée le bon — mais les silences entre caractères et entre mots sont allongés pour laisser le " +
      "temps de reconnaître ce qu’on vient d’entendre. On progresse ensuite en raccourcissant les " +
      "silences, sans jamais toucher aux caractères eux-mêmes."),
    h('p', { class: 'prose__callout' },
      "En pratique : réglez la vitesse des caractères à 18 ou 20 WPM dès le premier jour, et la vitesse " +
      "globale à 5 ou 8 WPM. Ne baissez jamais la première ; ne montez la seconde que lorsque vous êtes " +
      "à l’aise."),

    h('h2', { text: 'Koch : deux caractères à la fois' }),
    h('p', {},
      "Dans les années 1930, le psychologue allemand Ludwig Koch à montre qu’on apprend beaucoup plus " +
      "vite en commençant avec deux caractères seulement, à la vitesse cible, puis en ajoutant un " +
      "caractère dès que la reconnaissance devient fiable — le seuil usuel est de 90 % de réussite. " +
      "La progression se fait par élargissement du vocabulaire, jamais par accélération."),
    h('p', {},
      "C’est ce que fait le mode Écoute de ce site. L’ordre d’introduction des caractères n’est pas " +
      "alphabétique : il commence par des sons très différents les uns des autres (K et M, par exemple) " +
      "pour éviter les confusions précoces."),

    h('h2', { text: 'Trois erreurs à éviter' }),
    h(
      'ul',
      { class: 'prose__list' },
      h('li', {},
        h('strong', { text: 'Apprendre par le tableau visuel. ' }),
        "Mémoriser que A s’écrit « point trait » crée un détour mental : entendre, traduire en points, " +
        "puis chercher la lettre. Les opérateurs rapides n’ont pas ce détour, ils reconnaissent un son."),
      h('li', {},
        h('strong', { text: 'Compter les éléments. ' }),
        "Ça marche jusqu’à 10 WPM, et plus jamais ensuite. Mieux vaut se tromper vite que compter juste."),
      h('li', {},
        h('strong', { text: 'S’entraîner longtemps et rarement. ' }),
        "Quinze minutes par jour valent mieux que deux heures le dimanche. La reconnaissance auditive se " +
        "consolide pendant le sommeil, pas pendant l’effort."),
    ),

    h('h2', { text: 'Où est le lexique ?' }),
    h('p', {},
      "La page ",
      h('a', { href: '#/apprendre/alphabet', text: 'Alphabet et lexique' }),
      " reprend l’intégralité du code : lettres, chiffres, ponctuation, caractères accentués et signaux " +
      "de procédure. Chaque ligne est écoutable d’un clic. Servez-vous-en comme d’une référence, pas " +
      "comme d’un support d’apprentissage : c’est à l’oreille que le morse s’acquiert."),
  );

  return {
    element,
    destroy: () => {
      unsubscribe();
      player.stop();
    },
  };
}
