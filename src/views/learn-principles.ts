/** Page « Comprendre le morse » : les regles qui gouvernent le code. */

import { h } from '../ui/dom.ts';
import { SignalLamp } from '../ui/lamp.ts';
import { MorsePlayer } from '../ui/player.ts';
import { resolveTiming } from '../core/timing.ts';
import type { View, ViewContext } from '../ui/router.ts';

export function principlesView(context: ViewContext): View {
  const { store } = context;
  const lamp = new SignalLamp('Demonstration');
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
      ['Point (dit)', '1 unite', ms(timing.dit)],
      ['Trait (dah)', '3 unites', ms(timing.dah)],
      ['Silence entre deux elements', '1 unite', ms(timing.intraChar)],
      ['Silence entre deux caracteres', '3 unites', ms(timing.interChar)],
      ['Silence entre deux mots', '7 unites', ms(timing.interWord)],
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
      ? `Vos reglages actuels : caracteres a ${store.settings.charWpm} WPM, vitesse globale ${store.settings.effectiveWpm} WPM. Les silences sont donc etires (mode Farnsworth), ce qui explique que les deux dernieres lignes depassent la proportion theorique.`
      : `Vos reglages actuels : ${store.settings.charWpm} WPM, sans etirement des silences. Les durees suivent exactement les proportions theoriques.`;
  };

  refreshTiming();
  const unsubscribe = store.subscribe(refreshTiming);

  const demoButton = h('button', {
    class: 'btn btn--primary',
    type: 'button',
    text: 'Ecouter PARIS',
    on: {
      click: () => {
        if (player.playing) {
          player.stop();
          demoButton.textContent = 'Ecouter PARIS';
          return;
        }
        demoButton.textContent = 'Arreter';
        void player.play('PARIS', {
          onEnd: () => {
            demoButton.textContent = 'Ecouter PARIS';
          },
        });
      },
    },
  });

  const element = h(
    'article',
    { class: 'prose' },
    h('p', { class: 'prose__lead' },
      "Le code morse ne repose que sur deux signes et sur une regle de duree. Tout le reste " +
      "— la vitesse, les methodes d'apprentissage, les manipulateurs — decoule de cette base " +
      "d'une simplicite remarquable."),

    h('h2', { text: 'Deux signes, et rien d’autre' }),
    h('p', {},
      "Le morse encode chaque caractere par une suite de deux signaux seulement : un signal court, le ",
      h('strong', { text: 'point' }),
      ", que les operateurs prononcent « ti » (dit en anglais), et un signal long, le ",
      h('strong', { text: 'trait' }),
      ", prononce « taa » (dah). Le E est un point unique, le T un trait unique : ce sont les deux lettres " +
      "les plus frequentes en anglais, et ce n’est pas un hasard. Samuel Morse et Alfred Vail ont compte " +
      "les caracteres dans la casse d’un imprimeur pour attribuer les codes les plus courts aux lettres " +
      "les plus utilisees. Le morse est, des l’origine, un code de compression."),

    h('h2', { text: 'Une seule unite de temps' }),
    h('p', {},
      "Tout le code se mesure en multiples d’une unite unique : la duree d’un point. Les cinq regles " +
      "suivantes suffisent a decrire integralement le rythme du morse, et elles n’ont jamais change depuis " +
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
            h('th', { attrs: { scope: 'col' }, text: 'Element' }),
            h('th', { attrs: { scope: 'col' }, text: 'Duree theorique' }),
            h('th', { attrs: { scope: 'col' }, text: 'A vos reglages' }),
          ),
        ),
        timingTable,
      ),
    ),
    speedNote,

    h('h2', { text: 'La vitesse : mots par minute' }),
    h('p', {},
      "La vitesse s’exprime en mots par minute (WPM). Comme les mots n’ont pas tous la meme longueur, " +
      "on a choisi un mot etalon : ",
      h('strong', { text: 'PARIS' }),
      ", qui dure exactement 50 unites, espace de mot compris. Emettre PARIS vingt fois en une minute, " +
      "c’est donc emettre a 20 WPM. On en tire une formule qu’il suffit de retenir :"),
    h('p', { class: 'formula', text: 'duree d’une unite (ms) = 1200 / vitesse en WPM' }),
    h('p', {},
      "A 20 WPM, une unite vaut 60 millisecondes : un point dure 60 ms, un trait 180 ms. A 5 WPM elle " +
      "vaut 240 ms. La vitesse change tout : un caractere emis lentement et le meme emis vite ne sont pas " +
      "percus par le cerveau comme le meme objet."),
    h('div', { class: 'demo-row' }, demoButton, lamp.element),

    h('h2', { text: 'Farnsworth : la bonne facon de ralentir' }),
    h('p', {},
      "L’erreur classique du debutant est de ralentir les caracteres pour se donner le temps de compter " +
      "les points. C’est un piege : on apprend alors a compter, pas a reconnaitre, et il faut tout " +
      "reapprendre pour depasser 10 WPM. Le mur est bien connu des operateurs."),
    h('p', {},
      "La methode ",
      h('strong', { text: 'Farnsworth' }),
      " resout le probleme. Les caracteres sont emis a pleine vitesse — leur rythme sonore est donc " +
      "d’emblee le bon — mais les silences entre caracteres et entre mots sont allonges pour laisser le " +
      "temps de reconnaitre ce qu’on vient d’entendre. On progresse ensuite en raccourcissant les " +
      "silences, sans jamais toucher aux caracteres eux-memes."),
    h('p', { class: 'prose__callout' },
      "En pratique : reglez la vitesse des caracteres a 18 ou 20 WPM des le premier jour, et la vitesse " +
      "globale a 5 ou 8 WPM. Ne baissez jamais la premiere ; ne montez la seconde que lorsque vous etes " +
      "a l’aise."),

    h('h2', { text: 'Koch : deux caracteres a la fois' }),
    h('p', {},
      "Dans les annees 1930, le psychologue allemand Ludwig Koch a montre qu’on apprend beaucoup plus " +
      "vite en commencant avec deux caracteres seulement, a la vitesse cible, puis en ajoutant un " +
      "caractere des que la reconnaissance devient fiable — le seuil usuel est de 90 % de reussite. " +
      "La progression se fait par elargissement du vocabulaire, jamais par acceleration."),
    h('p', {},
      "C’est ce que fait le mode Ecoute de ce site. L’ordre d’introduction des caracteres n’est pas " +
      "alphabetique : il commence par des sons tres differents les uns des autres (K et M, par exemple) " +
      "pour eviter les confusions precoces."),

    h('h2', { text: 'Trois erreurs a eviter' }),
    h(
      'ul',
      { class: 'prose__list' },
      h('li', {},
        h('strong', { text: 'Apprendre par le tableau visuel. ' }),
        "Memoriser que A s’ecrit « point trait » cree un detour mental : entendre, traduire en points, " +
        "puis chercher la lettre. Les operateurs rapides n’ont pas ce detour, ils reconnaissent un son."),
      h('li', {},
        h('strong', { text: 'Compter les elements. ' }),
        "Ca marche jusqu’a 10 WPM, et plus jamais ensuite. Mieux vaut se tromper vite que compter juste."),
      h('li', {},
        h('strong', { text: 'S’entrainer longtemps et rarement. ' }),
        "Quinze minutes par jour valent mieux que deux heures le dimanche. La reconnaissance auditive se " +
        "consolide pendant le sommeil, pas pendant l’effort."),
    ),

    h('h2', { text: 'Ou est le lexique ?' }),
    h('p', {},
      "La page ",
      h('a', { href: '#/apprendre/alphabet', text: 'Alphabet et lexique' }),
      " reprend l’integralite du code : lettres, chiffres, ponctuation, caracteres accentues et signaux " +
      "de procedure. Chaque ligne est ecoutable d’un clic. Servez-vous-en comme d’une reference, pas " +
      "comme d’un support d’apprentissage : c’est a l’oreille que le morse s’acquiert."),
  );

  return {
    element,
    destroy: () => {
      unsubscribe();
      player.stop();
    },
  };
}
