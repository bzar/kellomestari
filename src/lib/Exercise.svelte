<script lang="ts">
  import AnalogClock from './AnalogClock.svelte';
  import { toText, toDigital, type Exercise } from './times.js';

  interface Props {
    exercise: Exercise;
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

  function questionPrompt(qf: string, af: string): string {
    if (qf === 'analog')  return af === 'text' ? 'Mitä kello on?' : 'Mikä on digitaaliaika?';
    if (qf === 'digital') return af === 'text' ? 'Miten sanotaan ääneen?' : 'Löydä oikea kello';
    // qf === 'text'
    return af === 'analog' ? 'Löydä oikea kello' : 'Mikä on digitaaliaika?';
  }

  // Stars for celebration burst — different (tx, ty) offsets
  const STARS = [
    { tx: '-170px', ty: '-180px' }, { tx:  '170px', ty: '-180px' },
    { tx:  '-90px', ty: '-260px' }, { tx:   '90px', ty: '-260px' },
    { tx: '-220px', ty:  '-80px' }, { tx:  '220px', ty:  '-80px' },
    { tx:    '0px', ty: '-290px' },
  ];
</script>

<!-- ── Question ─────────────────────────────────────────── -->
<div class="question-card">
  {#if exercise.questionFormat === 'analog'}
    <AnalogClock hours={exercise.time.hours} minutes={exercise.time.minutes} size={220} />
  {:else if exercise.questionFormat === 'digital'}
    <div class="digital-display">{toDigital(exercise.time)}</div>
  {:else}
    <div class="text-display">{toText(exercise.time)}</div>
  {/if}

  <p class="prompt">{questionPrompt(exercise.questionFormat, exercise.answerFormat)}</p>
</div>

<!-- ── Choices ────────────────────────────────────────────── -->
<div class="choices-grid">
  {#each exercise.choices as choice, idx}
    <button class={btnClass(idx)} onclick={() => choose(idx)} disabled={answerState !== 'waiting'}>
      {#if exercise.answerFormat === 'analog'}
        <AnalogClock hours={choice.hours} minutes={choice.minutes} size={108} />
      {:else if exercise.answerFormat === 'digital'}
        <span class="btn-digital">{toDigital(choice)}</span>
      {:else}
        <span class="btn-text">{toText(choice)}</span>
      {/if}
    </button>
  {/each}
</div>

<!-- ── Wrong-answer feedback ──────────────────────────────── -->
{#if answerState === 'wrong'}
  <div class="feedback-wrong">
    <span class="feedback-icon">😅</span>
    Ei ihan... Oikea vastaus on vihreänä!
    <button class="next-btn" onclick={onNext}>Seuraava →</button>
  </div>
{/if}

<!-- ── Correct celebration overlay ───────────────────────── -->
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
  /* ── Question card ────────────────────────────────────── */
  .question-card {
    background: white;
    border-radius: 24px;
    box-shadow: 0 6px 24px rgba(0,0,0,0.12);
    padding: 24px 20px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    width: 100%;
    max-width: 360px;
  }
  .digital-display {
    font-size: 5rem;
    font-weight: 900;
    color: #1565c0;
    letter-spacing: 2px;
    line-height: 1;
  }
  .text-display {
    font-size: 2.2rem;
    font-weight: 900;
    color: #4a148c;
    text-align: center;
    white-space: pre-line;
    line-height: 1.25;
  }
  .prompt {
    font-size: 1.3rem;
    font-weight: 700;
    color: #555;
    text-align: center;
  }

  /* ── Answer buttons ───────────────────────────────────── */
  .choices-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    width: 100%;
    max-width: 360px;
  }
  .choice-btn {
    height: 148px;
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
  }
  .choice-btn:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 8px 18px rgba(0,0,0,0.22);
  }
  .choice-btn:active:not(:disabled) { transform: scale(0.97); }

  .choice-btn.reveal-correct {
    background: #43a047;
    border-color: #1b5e20;
    animation: correctPulse 0.45s ease;
  }
  .choice-btn.wrong-chosen {
    background: #e53935;
    border-color: #b71c1c;
    animation: shake 0.45s ease;
  }
  .choice-btn.dimmed {
    background: #9e9e9e;
    opacity: 0.55;
  }

  .btn-digital {
    font-size: 2.4rem;
    font-weight: 900;
    letter-spacing: 1px;
  }
  .btn-text {
    font-size: 1.25rem;
    font-weight: 800;
    text-align: center;
    white-space: pre-line;
    line-height: 1.2;
    padding: 0 8px;
  }

  /* ── Wrong feedback bar ───────────────────────────────── */
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

  /* ── Celebration overlay ──────────────────────────────── */
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

  /* ── Keyframes ────────────────────────────────────────── */
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
