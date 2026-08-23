/**
 * Page « Transistors ».
 *
 * Le tableau des trois montages est le plus rentable du chapitre : cinq
 * caractéristiques à connaître pour chacun, et une bonne moitié des questions.
 * Il est donc présenté en fiches sur mobile et en tableau sur écran large,
 * plutôt qu'en tableau seul illisible sur téléphone.
 */

import { h, setChildren } from '../ui/dom.ts';
import { collectorCurrent } from '../core/radio-math.ts';
import { TRANSISTOR_MOUNTINGS } from '../data/actives.ts';
import { num } from '../ui/units.ts';
import type { View, ViewContext } from '../ui/router.ts';

const amps = (value: number): string => {
  if (value >= 1) return `${num(value)} A`;
  if (value >= 1e-3) return `${num(value * 1e3)} mA`;
  return `${num(value * 1e6)} µA`;
};

export function licenceTransistorsView(_context: ViewContext): View {
  // --- Gain d'un transistor ---

  const out = h('div', { class: 'converter__result' });

  const field = (initial: string, label: string): HTMLInputElement =>
    h('input', {
      class: 'input',
      type: 'number',
      value: initial,
      attrs: { step: 'any', min: '0', 'aria-label': label, placeholder: '—' },
      on: { input: () => compute() },
    });

  const ibField = field('500', 'Courant de base en microampères');
  const betaField = field('80', 'Gain bêta');
  const icField = field('', 'Courant collecteur en milliampères');

  const read = (input: HTMLInputElement): number | null =>
    input.value.trim() === '' ? null : Number(input.value);

  const compute = (): void => {
    const ib = read(ibField);
    const beta = read(betaField);
    const ic = read(icField);
    const given = [ib, beta, ic].filter((v) => v !== null && Number.isFinite(v)).length;
    if (given !== 2) {
      setChildren(out, [h('span', { class: 'prose__note', text: 'Renseignez exactement deux valeurs sur trois.' })]);
      return;
    }
    let label: string;
    let value: string;
    if (ic === null && ib !== null && beta !== null) {
      label = 'Courant collecteur Ic = Ib × β';
      value = amps(collectorCurrent(ib * 1e-6, beta));
    } else if (ib === null && ic !== null && beta !== null) {
      label = 'Courant de base Ib = Ic / β';
      value = beta > 0 ? amps((ic * 1e-3) / beta) : '—';
    } else if (beta === null && ib !== null && ic !== null) {
      label = 'Gain β = Ic / Ib';
      value = ib > 0 ? num((ic * 1e-3) / (ib * 1e-6)) : '—';
    } else {
      setChildren(out, [h('span', { class: 'prose__note', text: 'Renseignez exactement deux valeurs sur trois.' })]);
      return;
    }
    setChildren(out, [
      h('div', { class: 'converter__line converter__line--result' },
        h('span', { class: 'converter__label', text: label }),
        h('strong', { text: value })),
      h('p', { class: 'field__hint' },
        "Le gain β est un simple coefficient multiplicateur, à ne surtout pas confondre avec un gain en " +
        "décibels. Le constructeur le note aussi hFE, et le donne toujours en courant continu à 20 °C."),
    ]);
  };

  compute();

  const element = h(
    'div',
    { class: 'stack' },

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__lead' },
        "Un transistor, c’est deux diodes tête-bêche — d’où son autre nom de transistor bipolaire, ou à " +
        "jonction. Un faible courant de base commande un fort courant de collecteur : c’est toute " +
        "l’amplification, et c’est ce qui a remplacé les tubes."),

      h('h2', { text: 'NPN ou PNP' }),
      h('p', {},
        "Trois électrodes. L’",
        h('strong', { text: 'émetteur' }),
        ", repéré par la flèche, fortement dopé. La ",
        h('strong', { text: 'base' }),
        ", un trait vertical, très mince et faiblement dopée en polarité inverse. Le ",
        h('strong', { text: 'collecteur' }),
        ", sans repère, dopé comme l’émetteur mais moins."),
      h('p', { class: 'prose__note' },
        "Le moyen mnémotechnique qui règle la lecture des schémas : quand la flèche ",
        h('strong', { text: 'PéNètre' }),
        ", c’est un PNP ; quand elle ",
        h('strong', { text: 'Ne PéNètre pas' }),
        ", c’est un NPN. Les NPN sont de loin les plus courants."),
      h('p', {},
        "La première lettre du type donne la polarité de l’émetteur : ",
        h('strong', { text: 'N' }),
        "PN, l’émetteur au moins ; ",
        h('strong', { text: 'P' }),
        "NP, l’émetteur au plus. Le collecteur va à la polarité inverse, la base à une tension " +
        "intermédiaire."),

      h('h2', { text: 'Le gain' }),
      h('p', {},
        "Le courant de collecteur est directement proportionnel au courant de base, quelle que soit la " +
        "tension appliquée au collecteur."),
      h('p', { class: 'formula', text: 'Ic = Ib × β' }),
      h('p', {},
        "Deux comportements du gain méritent d’être retenus, car ils expliquent des questions d’examen. " +
        "Il ",
        h('strong', { text: 'augmente avec la température' }),
        " — d’où le risque d’emballement thermique, un cercle vicieux où le transistor chauffe, amplifie " +
        "davantage, et chauffe encore plus. Et il ",
        h('strong', { text: 'diminue quand la fréquence monte' }),
        "."),
      h('p', {},
        "La ",
        h('strong', { text: 'fréquence de coupure' }),
        " d’un transistor est celle où son gain tombe à 70 % de sa valeur en continu — soit une " +
        "atténuation de 3 dB, puisqu’il s’agit d’un rapport d’intensité."),
    ),

    h(
      'section',
      { class: 'card' },
      h('h2', { class: 'card__title', text: 'Calculer un gain' }),
      h('p', { class: 'card__hint' },
        "Renseignez deux valeurs, la troisième se déduit. L’exemple chargé — 500 µA sur un transistor de " +
        "gain 80 — donne 40 mA."),
      h(
        'div',
        { class: 'ohm-fields' },
        h('label', { class: 'ohm-field' }, h('span', { text: 'Ib (µA)' }), ibField),
        h('label', { class: 'ohm-field' }, h('span', { text: 'β' }), betaField),
        h('label', { class: 'ohm-field' }, h('span', { text: 'Ic (mA)' }), icField),
      ),
      out,
    ),

    // --- Les trois montages ---
    h(
      'article',
      { class: 'prose' },
      h('h2', { text: 'Les trois montages' }),
      h('p', {},
        "L’électrode dite « commune » est celle reliée à une tension fixe, et qui ne porte ni l’entrée ni " +
        "la sortie du signal. Trois montages en découlent, aux caractéristiques bien distinctes. C’est " +
        "le tableau le plus rentable du chapitre."),
    ),

    h(
      'div',
      { class: 'mountings' },
      ...TRANSISTOR_MOUNTINGS.map((mount) =>
        h(
          'section',
          { class: 'mounting' },
          h('h3', { class: 'mounting__name', text: mount.name }),
          h('p', { class: 'mounting__use', text: mount.use }),
          h(
            'dl',
            { class: 'mounting__specs' },
            ...[
              ['Entrée', mount.input],
              ['Sortie', mount.output],
              ['Gain en courant', mount.currentGain],
              ['Gain en tension', mount.voltageGain],
              ['Impédance d’entrée', mount.inputZ],
              ['Impédance de sortie', mount.outputZ],
              ['Déphasage', mount.phase],
            ].flatMap(([term, value]) => [
              h('dt', { text: term as string }),
              h('dd', { text: value as string }),
            ]),
          ),
        ),
      ),
    ),

    h(
      'article',
      { class: 'prose' },
      h('p', { class: 'prose__note' },
        "Trois repères pour ne pas les confondre. Le collecteur commun se reconnaît à sa sortie sur " +
        "l’émetteur — d’où son autre nom, émetteur suiveur. La base commune se reconnaît à son entrée " +
        "sur l’émetteur plutôt que sur la base. Et seul l’émetteur commun inverse le signal."),
      h('p', {},
        "Un dernier cas : monté en ",
        h('strong', { text: 'commutateur' }),
        ", le transistor fonctionne en « bloqué-saturé » selon qu’un courant de base est présent ou non. " +
        "Les notions de gain et d’impédance n’y ont plus de sens."),

      h('h2', { text: 'Le transistor à effet de champ' }),
      h('p', {},
        "Le FET s’apparente davantage à un tube qu’à un transistor bipolaire. Son vocabulaire change : " +
        "l’entrée est la ",
        h('strong', { text: 'source' }),
        ", la sortie le ",
        h('strong', { text: 'drain' }),
        ", et la commande la ",
        h('strong', { text: 'porte' }),
        " — ou grille, par référence aux tubes."),
      h('p', {},
        "On ne parle plus de gain mais de ",
        h('strong', { text: 'pente' }),
        " : le rapport du courant de drain sur la tension de porte."),
      h('p', { class: 'formula', text: 'pente = Id / Vg' }),
      h(
        'ul',
        { class: 'prose__list' },
        h('li', {},
          h('strong', { text: 'J-FET — porte à jonction. ' }),
          "Un barreau semi-conducteur de type N, le canal, entouré d’une bague de type P. Quand la " +
          "tension inverse sur la porte augmente, la barrière s’élargit, le canal se rétrécit et le " +
          "courant diminue. Sa tension de commande est ",
          h('strong', { text: 'négative' }),
          " par rapport au canal."),
        h('li', {},
          h('strong', { text: 'MOS-FET — porte isolée. ' }),
          "La porte est séparée du substrat par une fine couche d’oxyde de silicium — d’où son nom, " +
          "Metal Oxyde Semiconductor. Sa tension de commande est ",
          h('strong', { text: 'positive' }),
          " par rapport à la source. Certains ont deux portes, la seconde réglant la pente."),
      ),
      h('p', { class: 'prose__note' },
        "L’avantage décisif du FET : son impédance d’entrée est très grande, et il ",
        h('strong', { text: 'génère beaucoup moins de bruit' }),
        " qu’un bipolaire, puisqu’il n’y a pas de recombinaison trou-électron. C’est pourquoi on le " +
        "trouve en tête des récepteurs. Sa puissance admissible reste en revanche faible."),
      h('p', { class: 'field__hint' },
        "Dans le même registre : les transistors bipolaires au germanium font moins de bruit que ceux au " +
        "silicium, et les FET à l’arséniure de gallium moins encore."),

      h('h2', { text: 'Les tubes' }),
      h('p', {},
        "Ils n’ont pas disparu des amplificateurs de puissance. Une cathode chauffée émet des électrons, " +
        "attirés par l’anode — la plaque — portée à haute tension. Entre les deux, une ",
        h('strong', { text: 'grille' }),
        " module ce flux : c’est la triode. En ajoutant une grille écran on obtient une tétrode, puis une " +
        "pentode avec une grille suppresseuse."),
      h('p', { class: 'field__hint' },
        "Les tubes se caractérisent par une pente, comme les FET, et non par un gain. Leur haute tension " +
        "d’alimentation justifie les précautions de sécurité vues au chapitre réglementation : " +
        "compartiments fermés et coupure à l’ouverture."),
    ),
  );

  return { element };
}
