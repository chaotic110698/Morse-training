/**
 * Simulateur de contact.
 *
 * Le site enseignait toutes les pièces d'un QSO — codes Q, abréviations,
 * indicatifs, procédure — et jamais leur assemblage. Or un contact n'est pas
 * la somme de ces pièces : c'est un protocole, avec un ordre et un moment pour
 * chaque chose, et c'est exactement ce qui bloque au premier vrai contact.
 *
 * Deux compétences alternent ici, et elles ne se ressemblent pas. **Copier**
 * ce qu'il envoie, comme partout ailleurs sur le site. Et **composer** ce
 * qu'on lui répond, ce qui n'existe nulle part ailleurs : savoir qu'on répond
 * à un appel par son indicatif, le sien, et rien d'autre, s'apprend.
 *
 * La composition est vérifiée par ce qu'elle contient et non mot à mot. Il y a
 * dix façons correctes de répondre à un appel ; en refuser neuf n'apprendrait
 * qu'à réciter.
 */

import { h, setChildren } from '../ui/dom.ts';
import { SignalLamp } from '../ui/lamp.ts';
import { MorsePlayer } from '../ui/player.ts';
import { createAnnonce } from '../ui/annonce.ts';
import { compareCopy } from '../core/copie.ts';
import { commitSession, formatPercent, recordAttempt } from '../core/progress.ts';
import {
  construireQso,
  CORRESPONDANTS,
  INDICATIF_PAR_DEFAUT,
  type Correspondant,
  type QsoTour,
} from '../data/qso.ts';
import type { View, ViewContext } from '../ui/router.ts';

/** Normalise une ligne saisie : majuscules, espaces uniques. */
const propre = (texte: string): string => texte.toUpperCase().replace(/\s+/g, ' ').trim();

export function qsoView(context: ViewContext): View {
  const { store } = context;
  const lamp = new SignalLamp('Signal');
  const player = new MorsePlayer(store, lamp);
  const annonce = createAnnonce();

  let lui: Correspondant = CORRESPONDANTS[0] as Correspondant;
  let moi = INDICATIF_PAR_DEFAUT;
  let tours: QsoTour[] = [];
  let rang = 0;
  let ecoute = false;
  /** Caractères copiés justes / total, sur les tours de réception. */
  let copies = { justes: 0, total: 0 };
  /** Exigences satisfaites / total, sur les tours d'émission. */
  let protocole = { justes: 0, total: 0 };
  let debut = 0;

  // --- Éléments -----------------------------------------------------------

  const entete = h('div', { class: 'qso__entete' });
  const fil = h('div', { class: 'qso__fil' });
  const scene = h('div', { class: 'qso__scene' });
  const bilan = h('div', { class: 'qso__bilan' });

  // --- Déroulement --------------------------------------------------------

  const nouveauContact = (): void => {
    player.stop();
    store.audio.stopNoise();
    lui = CORRESPONDANTS[Math.floor(Math.random() * CORRESPONDANTS.length)] as Correspondant;
    moi = store.settings.callsign.trim() || INDICATIF_PAR_DEFAUT;
    tours = construireQso(moi, lui);
    rang = 0;
    copies = { justes: 0, total: 0 };
    protocole = { justes: 0, total: 0 };
    debut = Date.now();
    bilan.replaceChildren();
    fil.replaceChildren();
    dessineEntete();
    dessineTour();
  };

  const dessineEntete = (): void => {
    setChildren(entete, [
      h('span', { class: 'badge badge--accent', text: moi }),
      h('span', { class: 'qso__contre', text: '⇄', attrs: { 'aria-hidden': 'true' } }),
      // Son indicatif reste caché tant qu'on ne l'a pas copié : c'est la
      // première chose qu'un contact vous demande, et l'afficher d'avance
      // retirerait au premier tour tout ce qu'il a d'utile.
      h('span', { class: 'badge', text: rang === 0 ? '?' : lui.indicatif }),
      h('span', {
        class: 'qso__etape',
        text: rang < tours.length ? `Tour ${rang + 1} sur ${tours.length}` : 'Contact terminé',
      }),
    ]);
  };

  /** Ajoute une ligne au journal du contact, comme un carnet de trafic. */
  const journal = (sens: 'recu' | 'emis', texte: string): void => {
    fil.append(
      h(
        'p',
        { class: `qso__ligne qso__ligne--${sens}` },
        h('span', { class: 'qso__sens', text: sens === 'recu' ? 'reçu' : 'émis' }),
        h('span', { class: 'qso__texte', text: texte }),
      ),
    );
  };

  const suivant = (): void => {
    rang += 1;
    dessineEntete();
    if (rang >= tours.length) {
      terminer();
      return;
    }
    dessineTour();
  };

  const dessineTour = (): void => {
    const tour = tours[rang];
    if (!tour) return;
    if (tour.kind === 'recois') dessineReception(tour);
    else dessineEmission(tour);
  };

  // --- Réception ----------------------------------------------------------

  const dessineReception = (tour: Extract<QsoTour, { kind: 'recois' }>): void => {
    const notes = h('textarea', {
      class: 'input copie__notes',
      attrs: {
        placeholder: 'Copiez ici, pendant qu’il transmet…',
        spellcheck: 'false',
        autocapitalize: 'characters',
        autocomplete: 'off',
        rows: '3',
        'aria-label': 'Votre copie',
      },
    }) as HTMLTextAreaElement;
    const verdict = h('div', { class: 'copie__verdict' });

    const ecouterButton = h('button', {
      class: 'btn btn--primary btn--lg',
      type: 'button',
      text: 'Écouter',
      on: {
        click: async () => {
          if (ecoute) return;
          ecoute = true;
          ecouterButton.textContent = 'Réécouter';
          notes.focus();
          void store.audio.startNoise();
          await player.play(tour.texte);
          store.audio.stopNoise();
          ecoute = false;
          compareButton.disabled = false;
        },
      },
    }) as HTMLButtonElement;

    const compareButton = h('button', {
      class: 'btn',
      type: 'button',
      text: 'Comparer',
      disabled: true,
      on: {
        click: () => {
          const resultat = compareCopy(notes.value, tour.texte);
          copies.justes += resultat.correct;
          copies.total += resultat.total;

          const parCaractere = 0;
          store.mutateProgress((progress) => {
            for (const mark of resultat.marks) {
              if (mark.kind === 'ok') recordAttempt(progress, mark.char, true, parCaractere, mark.char);
              else if (mark.kind === 'wrong') recordAttempt(progress, mark.char, false, parCaractere, mark.typed);
              else if (mark.kind === 'missing') recordAttempt(progress, mark.char, false, parCaractere, null);
            }
          }, { silent: true });

          setChildren(verdict, [
            h('h3', { class: 'copie__titre', text: 'Ce qu’il a envoyé' }),
            h('p', { class: 'copie__diff' }, ...resultat.marks.map((mark) => {
              if (mark.kind === 'ok') return h('span', { class: 'is-ok', text: mark.char });
              if (mark.kind === 'wrong') return h('span', { class: 'is-ko', text: mark.char, title: `Vous avez écrit ${mark.typed}` });
              if (mark.kind === 'missing') return h('span', { class: 'is-manque', text: mark.char });
              if (mark.kind === 'space') return h('span', { class: 'copie__espace' });
              return h('span', { class: 'is-trop', text: mark.typed });
            })),
            h('p', { class: 'card__hint', text: tour.note }),
            h('div', { class: 'actions' },
              h('button', { class: 'btn btn--primary', type: 'button', text: 'À vous', on: { click: () => { journal('recu', tour.texte); suivant(); } } })),
          ]);
          annonce.dire(`${resultat.correct} caractères justes sur ${resultat.total}.`);
          compareButton.disabled = true;
          ecouterButton.disabled = true;
        },
      },
    }) as HTMLButtonElement;

    setChildren(scene, [
      h('p', { class: 'qso__consigne' },
        h('strong', { text: 'Il transmet. ' }),
        'Écoutez et copiez au fil de l’eau — vous n’aurez pas le texte sous les yeux.'),
      notes,
      h('div', { class: 'actions' }, ecouterButton, compareButton),
      verdict,
    ]);
    notes.focus();
  };

  // --- Émission -----------------------------------------------------------

  const dessineEmission = (tour: Extract<QsoTour, { kind: 'emets' }>): void => {
    const saisie = h('input', {
      class: 'input qso__saisie',
      type: 'text',
      attrs: {
        placeholder: 'Composez votre ligne…',
        spellcheck: 'false',
        autocapitalize: 'characters',
        autocomplete: 'off',
        'aria-label': 'Votre ligne',
      },
    }) as HTMLInputElement;
    const verdict = h('div', { class: 'copie__verdict' });

    const envoyer = (): void => {
      const ligne = propre(saisie.value);
      const manques = tour.exigences.filter((exigence) => !exigence.test.test(ligne));
      const justes = tour.exigences.length - manques.length;
      protocole.justes += justes;
      protocole.total += tour.exigences.length;

      setChildren(verdict, [
        h('h3', { class: 'copie__titre', text: manques.length === 0 ? 'Conforme' : 'Il manque quelque chose' }),
        manques.length === 0
          ? h('p', { class: 'qso__ok', text: 'Tout y est. Votre ligne part sur l’air.' })
          : h(
              'ul',
              { class: 'liste-manques' },
              ...manques.map((manque) => h('li', { text: manque.label })),
            ),
        h('p', { class: 'card__hint' },
          'Une façon de le dire : ',
          h('code', { class: 'qso__exemple', text: tour.exemple })),
        h('div', { class: 'actions' },
          h('button', {
            class: 'btn',
            type: 'button',
            text: 'Écouter ce que vous avez émis',
            on: { click: () => void player.play(ligne || tour.exemple) },
          }),
          h('button', {
            class: 'btn btn--primary',
            type: 'button',
            text: 'Continuer',
            on: { click: () => { journal('emis', ligne || '—'); suivant(); } },
          })),
      ]);
      annonce.dire(
        manques.length === 0
          ? 'Ligne conforme.'
          : `Il manque ${manques.length} élément${manques.length > 1 ? 's' : ''} : ${manques.map((m) => m.label).join(', ')}.`,
      );
      envoyerButton.disabled = true;
      saisie.disabled = true;
    };

    const envoyerButton = h('button', {
      class: 'btn btn--primary btn--lg',
      type: 'button',
      text: 'Émettre',
      on: { click: envoyer },
    }) as HTMLButtonElement;

    saisie.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !envoyerButton.disabled) envoyer();
    });

    setChildren(scene, [
      h('p', { class: 'qso__consigne' },
        h('strong', { text: 'À vous. ' }),
        tour.consigne),
      saisie,
      h('div', { class: 'actions' }, envoyerButton),
      verdict,
    ]);
    saisie.focus();
  };

  // --- Fin ----------------------------------------------------------------

  const terminer = (): void => {
    scene.replaceChildren();
    const copieRatio = copies.total === 0 ? 0 : copies.justes / copies.total;
    const protoRatio = protocole.total === 0 ? 0 : protocole.justes / protocole.total;

    store.mutateProgress((progress) => {
      commitSession(progress, {
        id: `${debut}-qso`,
        mode: 'qso',
        startedAt: debut,
        durationMs: Date.now() - debut,
        attempts: copies.total,
        correct: copies.justes,
        charWpm: store.settings.charWpm,
        effectiveWpm: store.settings.effectiveWpm,
        kochLevel: null,
      });
    });
    store.saveNow();

    setChildren(bilan, [
      h('h2', { class: 'card__title', text: `Contact terminé avec ${lui.indicatif}` }),
      h(
        'div',
        { class: 'summary__scores' },
        h('div', { class: 'metric' },
          h('span', { class: 'metric__value', text: formatPercent(copieRatio) }),
          h('span', { class: 'metric__label', text: 'Copie' })),
        h('div', { class: 'metric' },
          h('span', { class: 'metric__value', text: formatPercent(protoRatio) }),
          h('span', { class: 'metric__label', text: 'Protocole' })),
        h('div', { class: 'metric' },
          h('span', { class: 'metric__value', text: `${copies.justes}/${copies.total}` }),
          h('span', { class: 'metric__label', text: 'Caractères copiés' })),
      ),
      h('p', { class: 'card__hint' },
        protoRatio === 1
          ? `Protocole irréprochable. ${lui.nom} n’a rien eu à vous redemander.`
          : 'Le protocole s’apprend en le refaisant : les mêmes formules reviennent à chaque contact, ' +
            'et au bout de dix QSO elles sortent toutes seules.'),
      h('div', { class: 'actions' },
        h('button', { class: 'btn btn--primary btn--lg', type: 'button', text: 'Nouveau contact', on: { click: nouveauContact } })),
    ]);
    annonce.dire(
      `Contact terminé. Copie ${formatPercent(copieRatio)}, protocole ${formatPercent(protoRatio)}.`,
    );
  };

  // --- Assemblage ---------------------------------------------------------

  const element = h(
    'div',
    { class: 'trainer' },
    annonce.element,
    h('div', { class: 'toolbar' }, entete, lamp.element),
    scene,
    bilan,
    fil,
    h(
      'details',
      { class: 'help' },
      h('summary', { text: 'Ce qu’est un QSO, et pourquoi il a cette forme' }),
      h('p', {},
        'Un contact suit toujours le même squelette : appel, réponse, échange de report, clôture. ' +
        'Cette rigidité n’est pas une politesse — elle rend le contact possible quand le signal est ' +
        'mauvais, parce que chacun sait à l’avance ce que l’autre va dire et n’a plus qu’à en ' +
        'reconnaître les fragments.'),
      h('p', {},
        'Le report RST donne trois chiffres : la lisibilité de 1 à 5, la force de 1 à 9, et la ' +
        'tonalité de 1 à 9. 599 est le report standard, 339 une réception difficile mais exploitable. ' +
        'Le détail est dans ',
        h('a', { href: '#/apprendre/communication', text: 'Communiquer en morse' }),
        '.'),
      h('p', {},
        'Votre indicatif se règle dans les réglages ; à défaut, le site en emploie un fictif. ' +
        'Aucun de ces indicatifs ne doit être émis sur l’air : ils servent d’exemple.'),
    ),
  );

  nouveauContact();

  return {
    element,
    destroy: () => {
      annonce.destroy();
      player.stop();
      store.audio.stopNoise();
    },
  };
}
