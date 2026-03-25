<script lang="ts">
  import AnalogClock from './AnalogClock.svelte';
  import {
    toText, toDigital, formatDuration, type ConversionExercise,
    type DifferenceExercise, type AdditionExercise, type ClockTime,
  } from './times.js';

  type MultiExercise = ConversionExercise | DifferenceExercise | AdditionExercise;

  interface Props {
    exercise: MultiExercise;
    onAnswer: (correct: boolean) => void;
    onNext: () => void;
  }
  let { exercise, onAnswer, onNext }: Props = $props();

  type AnswerState = 'waiting' | 'correct' | 'wrong';
  let answerState = $state<AnswerState>('waiting');
  let chosenIdx   = $state(-1);

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  $effect(() => () => { if (timeoutId) clearTimeout(timeoutId); });

  function choose(idx: number) {
    if (answerState !== 'waiting') return;
    chosenIdx = idx;
    const isCorrect = idx === exercise.correctIndex;
    onAnswer(isCorrect);
    if (isCorrect) {
      answerState = 'correct';
      timeoutId = setTimeout(onNext, 1600);
    } else {
      answerState = 'wrong';
    }
  }

  function btnClass(idx: number): string {
    if (answerState === 'waiting') return 'choice-btn';
    if (idx === exercise.correctIndex) return 'choice-btn reveal-correct';
    if (idx === chosenIdx)             return 'choice-btn wrong-chosen';
    return 'choice-btn dimmed';
  }

  function questionPrompt(): string {
    if (exercise.type === 'difference') return 'Kuinka pitkä aika kului?';
    if (exercise.type === 'addition')   return 'Mitä kello on nyt?';
    const { questionFormat: qf, answerFormat: af } = exercise as ConversionExercise;
    if (qf === 'analog')  return af === 'text' ? 'Mitä kello on?' : 'Mikä on digitaaliaika?';
    if (qf === 'digital') return af === 'text' ? 'Miten sanotaan ääneen?' : 'Löydä oikea kello';
    return af === 'analog' ? 'Löydä oikea kello' : 'Mikä on digitaaliaika?';
  }

  const STARS = [
    { tx: '-170px', ty: '-180px' }, { tx:  '170px', ty: '-180px' },
    { tx:  '-90px', ty: '-260px' }, { tx:   '90px', ty: '-260px' },
    { tx: '-220px', ty:  '-80px' }, { tx:  '220px', ty:  '-80px' },
    { tx:    '0px', ty: '-290px' },
  ];

  // Responsive clock sizes
  const dvh = typeof window !== 'undefined' ? window.innerHeight : 700;
  const questionClockSize = Math.min(220, Math.max(140, Math.round(dvh * 0.27)));
  const answerClockSize   = Math.min(108, Math.max(72,  Math.round(dvh * 0.15)));
  const btnHeight         = Math.min(148, Math.max(100, Math.round(dvh * 0.20)));
</script>

<!-- ── Question ──────────────────────────────────────────── -->
<div class="question-card">
  {#if exercise.type === 'conversion'}
    {#if exercise.questionFormat === 'analog'}
      <AnalogClock hours={exercise.time.hours} minutes={exercise.time.minutes} size={questionClockSize} />
    {:else if exercise.questionFormat === 'digital'}
      <div class="digital-display">{toDigital(exercise.time)}</div>
    {:else}
      <div class="text-display">{toText(exercise.time)}</div>
    {/if}

  {:else if exercise.type === 'difference'}
    <div class="two-times">
      <div class="time-item">
        <div class="time-small-label">Alku</div>
        <div class="digital-display small">{toDigital(exercise.time1)}</div>
      </div>
      <div class="time-arrow">→</div>
      <div class="time-item">
        <div class="time-small-label">Loppu</div>
        <div class="digital-display small">{toDigital(exercise.time2)}</div>
      </div>
    </div>

  {:else}
    <!-- addition -->
    <div class="digital-display">{toDigital(exercise.time)}</div>
    <div class="delta-badge" class:add={exercise.delta > 0} class:sub={exercise.delta < 0}>
      {exercise.delta > 0 ? '+' : ''}{formatDuration(Math.abs(exercise.delta))}
    </div>
  {/if}

  <p class="prompt">{questionPrompt()}</p>
</div>

<!-- ── Choices ──────────────────────────────────────────────── -->
<div class="choices-grid" class:duration-grid={exercise.type === 'difference'}>
  {#each exercise.choices as choice, idx}
    <button
      class={btnClass(idx)}
      style="height:{exercise.type === 'difference' ? 'auto' : btnHeight + 'px'}"
      onclick={() => choose(idx)}
      disabled={answerState !== 'waiting'}
    >
      {#if exercise.type === 'difference'}
        <span class="btn-duration">{formatDuration(choice as number)}</span>
      {:else if exercise.type === 'addition'}
        <span class="btn-digital">{toDigital(choice as ClockTime)}</span>
      {:else if (exercise as ConversionExercise).answerFormat === 'analog'}
        <AnalogClock hours={(choice as ClockTime).hours} minutes={(choice as ClockTime).minutes} size={answerClockSize} />
      {:else if (exercise as ConversionExercise).answerFormat === 'digital'}
        <span class="btn-digital">{toDigital(choice as ClockTime)}</span>
      {:else}
        <span class="btn-text">{toText(choice as ClockTime)}</span>
      {/if}
    </button>
  {/each}
</div>

<!-- ── feedback Wrong --> ───
{#if answerState === 'wrong'}
  <div class="feedback-wrong">
    <span class="feedback-icon">😅</span>
    Ei ihan... Oikea vastaus on vihreänä!
    <button class="next-btn" onclick={onNext}>Seuraava →</button>
  </div>
{/if}

<!-- ── Correct overlay ─────────────────────────────────────── -->
{#if answerState === 'correct'}
  <div class="celebration-overlay">
    {#each STARS as { tx, ty }, i}
      <span class="star-burst" style="--tx:{tx};--ty:{ty};animation-delay:{i * 0.07}s">⭐</span>
    {/each}
    <div class="celebration-mark">✓</div>
    <div class="celebration-text">Oikein! 🌟</div>
  </div>
{/if}

<style>
  .question-card {
    background: white;
    border-radius: 24px;
    box-shadow: 0 6px 24px rgba(0,0,0,0.12);
    padding: clamp(12px, 1.8dvh, 24px) 20px clamp(8px, 1.2dvh, 16px);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(8px, 1.2dvh, 16px);
    width: 100%;
    max-width: 360px;
  }
  .digital-display {
    font-size: clamp(3.2rem, 8dvh, 5rem);
    font-weight: 900;
    color: #1565c0;
    letter-spacing: 2px;
    line-height: 1;
  }
  .digital-display.small { font-size: clamp(2rem, 5dvh, 3rem); }
  .text-display {
    font-size: clamp(1.6rem, 4dvh, 2.2rem);
    font-weight: 900;
    color: #4a148c;
    text-align: center;
    white-space: pre-line;
    line-height: 1.25;
  }
  .prompt {
    font-size: clamp(1rem, 2.2dvh, 1.3rem);
    font-weight: 700;
    color: #555;
    text-align: center;
    margin: 0;
  }

  /* Difference question */
  .two-times {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .time-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .time-small-label { font-size: 0.85rem; font-weight: 700; color: #8d6e63; }
  .time-arrow { font-size: 2rem; color: #8d6e63; }

  /* Addition delta badge */
  .delta-badge {
    font-size: clamp(1.4rem, 3.5dvh, 2rem);
    font-weight: 900;
    padding: 8px 20px;
    border-radius: 16px;
    letter-spacing: 1px;
  }
  .delta-badge.add { background: #e8f5e9; color: #2e7d32; }
  .delta-badge.sub { background: #fce4ec; color: #c62828; }

  /* Choices */
  .choices-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    width: 100%;
    max-width: 360px;
  }
  .duration-grid { grid-template-columns: 1fr 1fr; }

  .choice-btn {
    width: 100%;
    border-radius: 18px;
    border: 3px solid transparent;
    background: #5b9bd5;
    color: white;
    font-family: inherit;
    font-weight: 900;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.1s, box-shadow 0.1s;
    box-shadow: 0 4px 10px rgba(0,0,0,0.18);
    padding: 12px 8px;
  }
  .choice-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 8px 18px rgba(0,0,0,0.22); }
  .choice-btn:active:not(:disabled) { transform: scale(0.97); }
  .choice-btn.reveal-correct { background: #43a047; border-color: #1b5e20; animation: correctPulse 0.45s ease; }
  .choice-btn.wrong-chosen   { background: #e53935; border-color: #b71c1c; animation: shake 0.45s ease; }
  .choice-btn.dimmed         { background: #9e9e9e; opacity: 0.55; }

  .btn-digital {
    font-size: clamp(1.6rem, 4dvh, 2.4rem);
    font-weight: 900;
    letter-spacing: 1px;
  }
  .btn-text {
    font-size: clamp(0.95rem, 2.4dvh, 1.25rem);
    font-weight: 800;
    text-align: center;
    white-space: pre-line;
    line-height: 1.2;
    padding: 0 8px;
  }
  .btn-duration {
    font-size: clamp(1rem, 2.5dvh, 1.4rem);
    font-weight: 900;
    text-align: center;
  }

  /* Wrong feedback */
  .feedback-wrong {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fff3e0;
    border: 2px solid #ef6c00;
    border-radius: 16px;
    padding: 12px 16px;
    font-size: 1.1rem;
    font-weight: 700;
    color: #e65100;
    width: 100%;
    max-width: 360px;
    flex-wrap: wrap;
  }
  .feedback-icon { font-size: 1.6rem; }
  .next-btn {
    margin-left: auto;
    padding: 10px 22px;
    border-radius: 12px;
    border: none;
    background: #ef6c00;
    color: white;
    font-family: inherit;
    font-size: 1.1rem;
    font-weight: 900;
    cursor: pointer;
    transition: transform 0.1s;
  }
  .next-btn:hover { transform: scale(1.05); }

  /* Celebration overlay */
  .celebration-overlay {
    position: fixed;
    inset: 0;
    background: rgba(56, 174, 60, 0.92);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 100;
    animation: overlayIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  .celebration-mark {
    font-size: 7rem;
    color: white;
    font-weight: 900;
    line-height: 1;
    animation: bigBounce 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  }
  .celebration-text {
    font-size: 3.2rem;
    font-weight: 900;
    color: white;
    text-shadow: 2px 2px 10px rgba(0,0,0,0.25);
    margin-top: 12px;
    animation: bigBounce 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) 0.1s both;
  }
  .star-burst {
    position: absolute;
    font-size: 2.2rem;
    animation: starFly 1.3s ease-out forwards;
  }

  @keyframes overlayIn {
    from { opacity: 0; transform: scale(0.6); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes bigBounce {
    0%   { transform: scale(0) rotate(-15deg); }
    65%  { transform: scale(1.25) rotate(6deg); }
    100% { transform: scale(1) rotate(0deg); }
  }
  @keyframes starFly {
    0%   { transform: translate(0,0) scale(1); opacity: 1; }
    100% { transform: translate(var(--tx), var(--ty)) scale(0.3); opacity: 0; }
  }
  @keyframes correctPulse {
    0%, 100% { transform: scale(1); }
    50%       { transform: scale(1.06); }
  }
  @keyframes shake {
    0%,100% { transform: translateX(0) rotate(0deg); }
    15%     { transform: translateX(-7px) rotate(-2deg); }
    35%     { transform: translateX(7px) rotate(2deg); }
    55%     { transform: translateX(-5px) rotate(-1deg); }
    75%     { transform: translateX(5px) rotate(1deg); }
    90%     { transform: translateX(-2px); }
  }
</style>
