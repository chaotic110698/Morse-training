/**
 * Le mode histoire.
 *
 * Un sommaire par générations, puis un lecteur qui déroule l'épisode temps par
 * temps. Le récit se lit, le morse se manipule : c'est la seule façon d'avoir
 * beaucoup d'histoire sans rendre la séance épuisante.
 *
 * On joue épisode par épisode, quand on veut, et l'on reprend au temps où l'on
 * s'est arrêté — rien n'oblige à suivre l'ordre du récit.
 */

import { h, setChildren } from '../ui/dom.ts';
import { createKeyerBoard } from '../ui/keyer-board.ts';
import { createMorseTable } from '../ui/morse-table.ts';
import { MorsePlayer } from '../ui/player.ts';
import { buildSequence, elementsForCode, resolveTiming } from '../core/timing.ts';
import { compactCode, encodeChar } from '../core/morse.ts';
import { recordEpisode } from '../core/progress.ts';
import {
  beatText,
  compareCopy,
  episodeProgress,
  interpolate,
  keyersFor,
  sineOf,
  type StoryContext,
} from '../core/story.ts';
import { EPISODES, KEYER_ERAS, LINEAGE, type Beat, type Episode } from '../data/story.ts';
import type { View, ViewContext } from '../ui/router.ts';

const GENERATION_NAMES = ['I', 'II', 'III', 'IV', 'V'];

/**
 * Vitesse à laquelle le manipulateur à clavier rend les lettres. Elle ne
 * dépend pas de l'époque : ce n'est pas une épreuve de copie, c'est le retour
 * sonore de sa propre frappe.
 */
const SEND_WPM = 18;

export function storyView(context: ViewContext): View {
  const { store } = context;
  const root = h('div', { class: 'stack' });
  const player = new MorsePlayer(store);
  let table = createMorseTable();
  let board: ReturnType<typeof createKeyerBoard> | null = null;

  const storyContext = (episode: Episode): StoryContext => ({
    generation: episode.generation,
    lineage: LINEAGE,
  });

  /** La vitesse d'un épisode, indépendante des réglages d'entraînement. */
  const timingAt = (wpm: number) =>
    resolveTiming({ charWpm: wpm, effectiveWpm: Math.max(5, Math.round(wpm * 0.75)) });

  /** Joue un code brut : un caractère émis au manipulateur, ou le signal HH. */
  const playCode = (code: string, wpm: number): void => {
    const elements = elementsForCode(code, timingAt(wpm));
    if (elements.length > 0) void player.playElements(elements);
  };

  /** Joue un texte à la vitesse de l'épisode, sans toucher aux réglages du site. */
  const playAt = async (
    text: string,
    wpm: number,
    onChar?: (index: number, char: string | undefined) => void,
  ): Promise<boolean> => {
    const timing = timingAt(wpm);
    const tokens = [...text.toUpperCase()].map((char) =>
      char === ' ' ? { code: '', char: ' ' } : { code: encodeChar(char) ?? '', char },
    );
    const elements = buildSequence(
      tokens.filter((token) => token.code !== '' || token.char === ' '),
      timing,
    );
    if (elements.length === 0) return false;
    return player.playElements(elements, { onChar: onChar ?? undefined });
  };

  // --- Sommaire ---

  const drawHub = (): void => {
    const blocks: HTMLElement[] = [];
    for (const rank of [1, 2, 3, 4, 5]) {
      const member = LINEAGE.generations.find((entry) => entry.rank === rank);
      const episodes = EPISODES.filter((episode) => episode.generation === rank);
      if (!member) continue;

      const cards = episodes.map((episode) => {
        const record = store.progress.story.episodes[episode.id];
        const { total } = episodeProgress(episode, 0);
        const done = record?.completed === true;
        const started = (record?.beat ?? 0) > 0 && !done;
        const action = done ? 'Rejouer' : started ? 'Reprendre' : 'Commencer';
        return h(
          'button',
          {
            class: `recit-carte${done ? ' is-done' : ''}${episode.optional ? ' recit-carte--lore' : ''}`,
            type: 'button',
            attrs: { 'aria-label': `${action} : ${episode.title}, ${episode.year}` },
            on: { click: () => openEpisode(episode) },
          },
          h(
            'span',
            { class: 'recit-carte__tete' },
            h('span', { class: 'recit-carte__annee', text: String(episode.year) }),
            done
              ? h('span', { class: 'recit-carte__etat', text: 'terminé' })
              : started
                ? h('span', { class: 'recit-carte__etat', text: 'en cours' })
                : null,
          ),
          h('span', { class: 'recit-carte__titre', text: episode.title }),
          h('span', { class: 'recit-carte__resume', text: episode.summary }),
          h(
            'span',
            { class: 'recit-carte__pied' },
            h('span', {
              class: 'recit-carte__mesure',
              text: episode.optional ? 'Entre les ondes' : `${total} passage${total > 1 ? 's' : ''} en morse`,
            }),
            h('span', { class: 'recit-carte__action', text: `${action} →` }),
          ),
        );
      });

      blocks.push(
        h(
          'section',
          { class: 'recit-gen' },
          h(
            'header',
            { class: 'recit-gen__tete' },
            h('span', { class: 'recit-gen__rang', text: GENERATION_NAMES[rank - 1] ?? String(rank) }),
            h(
              'span',
              { class: 'recit-gen__qui' },
              h('span', { class: 'recit-gen__nom', text: `${member.given} ${LINEAGE.surname}` }),
              h('span', {
                class: 'recit-gen__detail',
                text: `né en ${member.born} · sine ${sineOf(LINEAGE, rank)}`,
              }),
            ),
          ),
          cards.length > 0
            ? h('div', { class: 'recit-gen__liste' }, ...cards)
            : h('p', { class: 'empty', text: 'Épisodes à écrire.' }),
        ),
      );
    }

    setChildren(root, [
      h(
        'section',
        { class: 'card card--accent' },
        h('h2', { class: 'card__title', text: 'Cinq générations, une signature' }),
        h('p', { class: 'prose__lead' },
          'De 1844 à 1999, les ', h('strong', { text: LINEAGE.surname }),
          ' ont transmis le même métier de père en fils. Les situations et les ' +
            'messages sont historiques ; la famille est inventée, et chaque épisode ' +
            'dit à la fin ce qui est vrai.'),
      ),
      ...blocks,
    ]);
  };

  // --- Lecteur d'épisode ---

  /**
   * Ouvre un épisode. On reprend là où l'on s'est arrêté — sauf s'il est
   * terminé, auquel cas il n'y a plus rien à reprendre : on le rejoue.
   */
  const openEpisode = (episode: Episode, fromStart = false): void => {
    const ctx = storyContext(episode);
    const record = store.progress.story.episodes[episode.id];
    const resume = record && !record.completed ? record.beat : 0;
    let index = fromStart ? 0 : Math.min(resume, episode.beats.length - 1);
    let errors = 0;
    let bestCopy = record?.bestCopy ?? 0;

    table = createMorseTable({ onPick: (_, code) => playCode(code, SEND_WPM) });
    const stage = h('div', { class: 'recit-scene' });
    const trail = h('div', { class: 'recit-fil' });
    const meter = h('p', { class: 'recit-mesure' });

    const persist = (extra: Partial<{ completed: boolean }> = {}): void => {
      recordEpisode(store.progress, episode.id, {
        beat: index,
        errors,
        bestCopy,
        withoutTable: !table.consulted(),
        ...extra,
      });
      errors = 0;
      store.saveNow();
    };

    const stop = (): void => {
      player.stop();
      board?.destroy();
      board = null;
    };

    const back = (): void => {
      stop();
      persist();
      drawHub();
    };

    const advance = (): void => {
      stop();
      if (index < episode.beats.length - 1) {
        index += 1;
        persist();
        drawBeat();
      } else {
        persist({ completed: true });
        drawHub();
      }
    };

    /** Les temps déjà passés restent lisibles au-dessus : le récit ne s'efface pas. */
    const drawTrail = (): void => {
      const lines: HTMLElement[] = [];
      for (const beat of episode.beats.slice(0, index)) {
        if (beat.kind === 'recit' || beat.kind === 'epilogue') {
          for (const line of beatText(beat, ctx, episode.year)) {
            lines.push(h('p', { class: 'recit-fil__ligne', text: line }));
          }
        } else if (beat.kind === 'receive' || beat.kind === 'send') {
          lines.push(
            h('p', { class: 'recit-fil__morse' },
              h('span', { class: 'recit-fil__sens', text: beat.kind === 'send' ? 'émis' : 'reçu' }),
              h('span', { class: 'mono', text: beatText(beat, ctx, episode.year)[0] ?? '' })),
          );
        }
      }
      setChildren(trail, lines.slice(-8));
    };

    const drawBeat = (): void => {
      const beat = episode.beats[index];
      if (!beat) return;
      drawTrail();
      const { done, total } = episodeProgress(episode, index);
      meter.textContent = total > 0 ? `Passage ${Math.min(done + 1, total)} sur ${total}` : '';
      setChildren(stage, [renderBeat(beat)]);
    };

    const renderBeat = (beat: Beat): HTMLElement => {
      const lines = beatText(beat, ctx, episode.year);

      if (beat.kind === 'recit' || beat.kind === 'epilogue') {
        return h(
          'div',
          { class: `recit-bloc${beat.kind === 'epilogue' ? ' recit-bloc--epilogue' : ''}` },
          beat.kind === 'epilogue'
            ? h('h2', { class: 'card__title', text: 'Ce qui s’est réellement passé' })
            : null,
          ...lines.map((line) => h('p', { class: 'recit-texte', text: line })),
          h('button', {
            class: 'btn btn--primary',
            type: 'button',
            text: index < episode.beats.length - 1 ? 'Continuer' : 'Terminer l’épisode',
            on: { click: advance },
          }),
        );
      }

      if (beat.kind === 'silence') {
        return h(
          'div',
          { class: 'recit-bloc recit-silence' },
          h('p', { class: 'recit-texte', text: lines[0] ?? 'Rien. Puis rien encore.' }),
          h('p', { class: 'recit-silence__note', text: 'On cesse d’émettre. On écoute.' }),
          h('button', { class: 'btn btn--primary', type: 'button', text: 'Continuer', on: { click: advance } }),
        );
      }

      if (beat.kind === 'receive') return renderReceive(beat, lines[0] ?? '');
      return renderSend(beat, lines[0] ?? '');
    };

    // --- Réception ---

    const renderReceive = (beat: Extract<Beat, { kind: 'receive' }>, text: string): HTMLElement => {
      let wpm = beat.wpm ?? 12;
      let step = 0;

      const tape = h('p', {
        class: 'recit-bande',
        attrs: { 'aria-label': 'Signal reçu, en points et traits' },
      });
      const notes = h('textarea', {
        class: 'input recit-notes',
        attrs: { placeholder: 'Écrivez ici ce que vous copiez…', spellcheck: 'false', rows: '3' },
      }) as HTMLTextAreaElement;
      const verdict = h('p', { class: 'recit-verdict', attrs: { 'aria-live': 'polite' } });
      const suivant = h('button', {
        class: 'btn btn--primary',
        type: 'button',
        text: 'Continuer',
        disabled: true,
        on: { click: advance },
      }) as HTMLButtonElement;

      /**
       * La bande porte le signal, jamais la lettre : c'est au joueur de
       * déchiffrer. Afficher le texte reviendrait à donner la réponse de
       * l'exercice au moment de le poser.
       */
      const showTape = (upTo: number): void => {
        setChildren(
          tape,
          [...text].slice(0, upTo).map((char, position) =>
            char === ' '
              ? h('span', { class: 'recit-bande__mot' })
              : h('span', {
                  class: `recit-bande__signe${position === upTo - 1 ? ' is-now' : ''}`,
                  // Serré, pas espacé : c'est l'écart entre deux caractères qui
                  // doit se voir, pas celui entre deux signes du même.
                  text: compactCode(encodeChar(char) ?? ''),
                }),
          ),
        );
      };

      const listen = async (): Promise<void> => {
        player.stop();
        step = 0;
        showTape(0);
        await playAt(text, wpm, (position) => {
          step = position + 1;
          showTape(step);
        });
      };

      const oneMore = async (): Promise<void> => {
        // Arrivé au bout, on s'y arrête : repartir de zéro effacerait tout ce
        // que le joueur vient de relever. Pour réentendre, il y a AGN.
        if (step >= text.length) return;
        const char = text[step] as string;
        step += 1;
        showTape(step);
        if (char !== ' ') await playAt(char, wpm);
      };

      const wpmLabel = h('output', { class: 'recit-tempo__valeur', text: `${wpm} WPM` });

      const controls = h(
        'div',
        { class: 'recit-controles' },
        h('button', { class: 'btn btn--primary', type: 'button', text: 'Écouter', on: { click: () => void listen() } }),
        h('button', { class: 'btn', type: 'button', text: 'Lettre suivante', on: { click: () => void oneMore() } }),
        h('button', {
          class: 'btn btn--code',
          type: 'button',
          title: 'Transmettez plus lentement',
          text: 'QRS',
          on: {
            click: () => {
              wpm = Math.max(5, wpm - 3);
              wpmLabel.textContent = `${wpm} WPM`;
            },
          },
        }),
        h('button', {
          class: 'btn btn--code',
          type: 'button',
          title: 'Répétez',
          text: 'AGN',
          on: { click: () => void listen() },
        }),
        wpmLabel,
      );

      const check = (): void => {
        const result = compareCopy(notes.value, text);
        bestCopy = Math.max(bestCopy, result.ratio);
        setChildren(verdict, [
          ...result.marks.map((mark) => {
            if (mark.kind === 'ok') return h('span', { class: 'is-ok', text: mark.char });
            if (mark.kind === 'wrong') return h('span', { class: 'is-ko', text: mark.char });
            if (mark.kind === 'missing') return h('span', { class: 'is-manque', text: mark.char });
            if (mark.kind === 'space') return h('span', { class: 'recit-verdict__espace' });
            return h('span', { class: 'is-trop', text: mark.typed });
          }),
          h('span', { class: 'recit-verdict__compte', text: ` ${result.correct} sur ${result.total}` }),
        ]);
        suivant.disabled = false;
      };

      return h(
        'div',
        { class: 'recit-bloc recit-recevoir' },
        h('p', { class: 'recit-source' },
          h('span', { class: 'recit-source__quoi', text: 'À déchiffrer' }),
          beat.from ? h('span', { class: 'recit-source__qui', text: beat.from }) : null),
        tape,
        controls,
        table.element,
        h('label', { class: 'recit-notes__label', text: 'Vos notes' }),
        notes,
        h(
          'div',
          { class: 'recit-controles' },
          h('button', { class: 'btn', type: 'button', text: 'Comparer', on: { click: check } }),
          suivant,
        ),
        verdict,
        beat.note ? h('p', { class: 'card__hint', text: beat.note }) : null,
      );
    };

    // --- Émission ---

    const renderSend = (beat: Extract<Beat, { kind: 'send' }>, text: string): HTMLElement => {
      board?.destroy();
      const suivant = h('button', {
        class: 'btn btn--primary',
        type: 'button',
        text: 'Continuer',
        disabled: true,
        on: { click: advance },
      }) as HTMLButtonElement;

      board = createKeyerBoard({
        play: (code) => playCode(code, SEND_WPM),
        onChange: (state) => { errors = state.errors; },
        onDone: () => { suivant.disabled = false; },
      });
      board.load(text);

      const available = keyersFor(episode.year);
      const eras = KEYER_ERAS.map((era) =>
        h('span', {
          class: `recit-manip${available.includes(era.kind) ? '' : ' is-off'}`,
          text: era.label,
          title: available.includes(era.kind) ? `Disponible depuis ${era.from}` : `N’existe pas encore en ${episode.year}`,
        }),
      );

      return h(
        'div',
        { class: 'recit-bloc recit-emettre' },
        h('p', { class: 'recit-source' },
          h('span', { class: 'recit-source__quoi', text: 'À transmettre' }),
          beat.to ? h('span', { class: 'recit-source__qui', text: beat.to }) : null),
        beat.hint ? h('p', { class: 'card__hint', text: beat.hint }) : null,
        board.element,
        h('div', { class: 'recit-manips' }, ...eras),
        h('div', { class: 'recit-controles' }, suivant),
      );
    };

    const restart = (): void => {
      stop();
      index = 0;
      persist();
      drawBeat();
      root.scrollIntoView({ block: 'start' });
    };

    setChildren(root, [
      h(
        'div',
        { class: 'recit-entete' },
        h('button', { class: 'btn btn--ghost', type: 'button', text: '← Sommaire', on: { click: back } }),
        h('button', {
          class: 'btn btn--ghost',
          type: 'button',
          text: 'Depuis le début',
          attrs: { title: 'Reprendre l’épisode à son premier temps' },
          on: { click: restart },
        }),
        h('span', { class: 'recit-entete__annee', text: String(episode.year) }),
        h('span', {
          class: 'recit-entete__qui',
          text: `${interpolate('{prenom} {nom}', ctx)} · sine ${sineOf(LINEAGE, episode.generation)}`,
        }),
      ),
      h('h2', { class: 'recit-titre', text: episode.title }),
      meter,
      trail,
      stage,
    ]);
    drawBeat();
  };

  drawHub();

  return {
    element: root,
    destroy: () => {
      player.stop();
      board?.destroy();
    },
  };
}
