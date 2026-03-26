<script lang="ts">
  import AnalogClock from './AnalogClock.svelte';
  import { toText, toDigital, formatDuration, type MestariExercise, type Format } from './times.js';

  interface Props {
    exercise: MestariExercise;
    onAnswer: (correct: boolean) => void;
    onNext: () => void;
  }
  let { exercise, onAnswer, onNext }: Props = $props();

  // ── Common state ───────────────────────────────────────────
  type AnswerState = 'waiting' | 'correct' | 'wrong';
  let answerState = $state<AnswerState>('waiting');
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  $effect(() => () => { if (timeoutId) clearTimeout(timeoutId); });

  // ── Time adjuster (conversion + addition) ──────────────────
  const answerFmt: Format = exercise.variant === 'difference' ? 'digital' : exercise.answerFormat;
  const uses12h = (f: Format) => f === 'analog' || f === 'text';
  const maxH = uses12h(answerFmt) ? 12 : 24;

  // Start away from the correct answer
  const correctH12 = (() => {
    if (exercise.variant === 'conversion') return exercise.targetTime.hours % 12 || 12;
    if (exercise.variant === 'addition') {
      const t = exercise.baseTime.hours * 60 + exercise.baseTime.minutes + exercise.delta;
      return Math.floor(t / 60) % 12 || 12;
    }
    return 1;
  })();
  let curH = $state(correctH12 === 12 ? 6 : 12);
  let curM = $state(0);

  // ── Duration adjuster (difference) ────────────────────────
  let curDH = $state(0);   // 0–3
  let curDM = $state(0);   // 0, 5, …, 55

  // ── Adjust functions ───────────────────────────────────────
  function adjH(d: number)  { if (answerState !== 'waiting') return; curH = ((curH - 1 + d + maxH) % maxH) + 1; }
  function adjM(d: number)  { if (answerState !== 'waiting') return; curM = ((curM + d) + 60) % 60; }
  function adjDH(d: number) { if (answerState !== 'waiting') return; curDH = ((curDH + d) + 4) % 4; }
  function adjDM(d: number) { if (answerState !== 'waiting') return; curDM = ((curDM + d) + 60) % 60; }

  // ── Correctness ────────────────────────────────────────────
  function checkCorrect(): boolean {
    if (exercise.variant === 'difference') {
      return curDH * 60 + curDM === exercise.correctMinutes;
    }
    const targetTime = exercise.variant === 'conversion'
      ? exercise.targetTime
      : (() => {
          const t = exercise.baseTime.hours * 60 + exercise.baseTime.minutes + exercise.delta;
          return { hours: Math.floor(t / 60), minutes: t % 60 };
        })();
    if (curM !== targetTime.minutes) return false;
    const h12 = (h: number) => h % 12 || 12;
    const tFmt: Format = exercise.variant === 'conversion' ? exercise.targetFormat : 'digital';
    if (uses12h(tFmt) || uses12h(answerFmt)) return h12(curH) === h12(targetTime.hours);
    return curH === targetTime.hours;
  }

  function submit() {
    if (answerState !== 'waiting') return;
    const ok = checkCorrect();
    onAnswer(ok);
    answerState = ok ? 'correct' : 'wrong';
    if (ok) timeoutId = setTimeout(onNext, 1600);
  }

  const STARS = [
    { tx: '-170px', ty: '-180px' }, { tx: '170px', ty: '-180px' },
    { tx: '-90px',  ty: '-260px' }, { tx:  '90px', ty: '-260px' },
    { tx: '-220px', ty:  '-80px' }, { tx: '220px', ty:  '-80px' },
    { tx:    '0px', ty: '-290px' },
  ];

  const dvh = typeof window !== 'undefined' ? window.innerHeight : 700;
  const clockSize       = Math.min(140, Math.max(100, Math.round(dvh * 0.17)));
  const targetClockSize = Math.min(200, Math.max(140, Math.round(dvh * 0.24)));
</script>

<!-- ── Question card ──────────────────────────────────────── -->
<div class="target-card">
  {#if exercise.variant === 'difference'}
    <p class="target-label">Kuinka pitkä aika kului?</p>
    <div class="two-times">
      <div class="time-item">
        <div class="time-small-label">Alku</div>
        <div class="target-digital small">{toDigital(exercise.time1)}</div>
      </div>
      <div class="time-arrow">→</div>
      <div class="time-item">
        <div class="time-small-label">Loppu</div>
        <div class="target-digital small">{toDigital(exercise.time2)}</div>
      </div>
    </div>

  {:else if exercise.variant === 'addition'}
    <p class="target-label">Mitä kello on nyt?</p>
    <div class="target-digital">{toDigital(exercise.baseTime)}</div>
    <div class="delta-badge">
      {exercise.delta > 0 ? 'lisää' : 'vähennä'} {formatDuration(Math.abs(exercise.delta))}
    </div>

  {:else}
    <p class="target-label">Aseta kello osoittamaan:</p>
    {#if exercise.targetFormat === 'analog'}
      <AnalogClock hours={exercise.targetTime.hours} minutes={exercise.targetTime.minutes} size={targetClockSize} />
    {:else if exercise.targetFormat === 'digital'}
      <div class="target-digital">{toDigital(exercise.targetTime)}</div>
    {:else}
      <div class="target-text">{toText(exercise.targetTime)}</div>
    {/if}
  {/if}
</div>

<!-- ── Adjuster ────────────────────────────────────────────── -->
<div class="adjuster">
  {#if exercise.variant === 'difference'}
    <div class="adj-col">
      <button class="adj-btn" onclick={() => adjDH(1)}  disabled={answerState !== 'waiting'}>▲</button>
      <div class="adj-label">Tunnit</div>
      <button class="adj-btn" onclick={() => adjDH(-1)} disabled={answerState !== 'waiting'}>▼</button>
    </div>
    <div class="clock-display">
      <div class="cur-digital" class:correct={answerState === 'correct'} class:wrong={answerState === 'wrong'}>
        {curDH}:{String(curDM).padStart(2, '0')}
      </div>
    </div>
    <div class="adj-col">
      <button class="adj-btn" onclick={() => adjDM(5)}  disabled={answerState !== 'waiting'}>▲</button>
      <div class="adj-label">Minuutit</div>
      <button class="adj-btn" onclick={() => adjDM(-5)} disabled={answerState !== 'waiting'}>▼</button>
    </div>

  {:else}
    <div class="adj-col">
      <button class="adj-btn" onclick={() => adjH(1)}  disabled={answerState !== 'waiting'}>▲</button>
      <div class="adj-label">Tunnit</div>
      <button class="adj-btn" onclick={() => adjH(-1)} disabled={answerState !== 'waiting'}>▼</button>
    </div>
    <div class="clock-display">
      {#if answerFmt === 'analog'}
        <AnalogClock hours={curH} minutes={curM} size={clockSize} />
      {:else if answerFmt === 'digital'}
        <div class="cur-digital" class:correct={answerState === 'correct'} class:wrong={answerState === 'wrong'}>
          {toDigital({ hours: curH, minutes: curM })}
        </div>
      {:else}
        <div class="cur-text" class:correct={answerState === 'correct'} class:wrong={answerState === 'wrong'}>
          {toText({ hours: curH, minutes: curM })}
        </div>
      {/if}
    </div>
    <div class="adj-col">
      <button class="adj-btn" onclick={() => adjM(5)}  disabled={answerState !== 'waiting'}>▲</button>
      <div class="adj-label">Minuutit</div>
      <button class="adj-btn" onclick={() => adjM(-5)} disabled={answerState !== 'waiting'}>▼</button>
    </div>
  {/if}
</div>

{#if answerState === 'waiting'}
  <button class="submit-btn" onclick={submit}>Tarkista! ✓</button>
{:else if answerState === 'wrong'}
  <div class="feedback-wrong">
    <span class="feedback-icon">😅</span>
    {#if exercise.variant === 'difference'}
      Ei ihan… Oikea kesto on <strong>{formatDuration(exercise.correctMinutes)}</strong>
    {:else if exercise.variant === 'addition'}
      {@const t = exercise.baseTime.hours * 60 + exercise.baseTime.minutes + exercise.delta}
      Ei ihan… Oikea aika on <strong>{toDigital({ hours: Math.floor(t / 60), minutes: t % 60 })}</strong>
    {:else}
      Ei ihan… Oikea aika on <strong>{toDigital(exercise.targetTime)}</strong>
    {/if}
    <button class="next-btn" onclick={onNext}>Seuraava →</button>
  </div>
{/if}

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
  .target-card {
    background: white;
    border-radius: 24px;
    box-shadow: 0 6px 24px rgba(0,0,0,0.12);
    padding: clamp(12px, 1.8dvh, 20px) 20px clamp(8px, 1.2dvh, 14px);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(8px, 1.2dvh, 14px);
    width: 100%;
    max-width: 360px;
  }
  .target-label {
    font-size: 1.1rem;
    font-weight: 700;
    color: #555;
    text-align: center;
  }
  .target-digital {
    font-size: clamp(3rem, 8dvh, 5rem);
    font-weight: 900;
    color: #1565c0;
    letter-spacing: 2px;
    line-height: 1;
  }
  .target-digital.small { font-size: clamp(2rem, 5dvh, 3rem); }
  .target-text {
    font-size: clamp(1.6rem, 4dvh, 2.2rem);
    font-weight: 900;
    color: #4a148c;
    text-align: center;
    white-space: pre-line;
    line-height: 1.25;
  }

  /* Difference question */
  .two-times { display: flex; align-items: center; gap: 12px; }
  .time-item  { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .time-small-label { font-size: 0.85rem; font-weight: 700; color: #8d6e63; }
  .time-arrow { font-size: 2rem; color: #8d6e63; }

  /* Addition delta badge */
  .delta-badge {
    font-size: clamp(1.4rem, 3.5dvh, 2rem);
    font-weight: 900;
    padding: 8px 20px;
    border-radius: 16px;
    background: #fff3e0;
    color: #e65100;
  }

  .adjuster {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    max-width: 360px;
    justify-content: space-between;
  }
  .adj-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .adj-btn {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    border: none;
    background: #ef6c00;
    color: white;
    font-size: 1.5rem;
    font-weight: 900;
    cursor: pointer;
    box-shadow: 0 3px 8px rgba(0,0,0,0.2);
    transition: transform 0.1s;
    font-family: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .adj-btn:hover:not(:disabled) { transform: scale(1.08); }
  .adj-btn:active:not(:disabled) { transform: scale(0.94); }
  .adj-btn:disabled { background: #bdbdbd; cursor: default; }
  .adj-label {
    font-size: 0.75rem;
    font-weight: 700;
    color: #8d6e63;
    text-align: center;
  }
  .clock-display {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 0;
  }
  .cur-digital {
    font-size: 1.8rem;
    font-weight: 900;
    color: #283593;
    background: #e8eaf6;
    border-radius: 12px;
    padding: 4px 14px;
    letter-spacing: 1px;
    transition: background 0.3s;
  }
  .cur-text {
    font-size: clamp(1rem, 2.6dvh, 1.35rem);
    font-weight: 900;
    color: #4a148c;
    background: #f3e5f5;
    border-radius: 12px;
    padding: 8px 14px;
    text-align: center;
    white-space: pre-line;
    line-height: 1.3;
    transition: background 0.3s;
  }
  .cur-digital.correct, .cur-text.correct { background: #c8e6c9; color: #1b5e20; }
  .cur-digital.wrong,   .cur-text.wrong   { background: #ffcdd2; color: #b71c1c; }

  .submit-btn {
    padding: clamp(12px, 1.8dvh, 18px) 40px;
    font-size: 1.3rem;
    font-weight: 900;
    font-family: inherit;
    border-radius: 18px;
    border: none;
    background: #43a047;
    color: white;
    cursor: pointer;
    box-shadow: 0 5px 18px rgba(0,0,0,0.22);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .submit-btn:hover  { transform: translateY(-3px); box-shadow: 0 10px 26px rgba(0,0,0,0.28); }
  .submit-btn:active { transform: scale(0.96); }

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
  @media (max-height: 900px) {
    .feedback-wrong {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      max-width: none;
      border-radius: 16px 16px 0 0;
      border-bottom: none;
      z-index: 50;
      box-shadow: 0 -4px 16px rgba(0,0,0,0.15);
    }
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
</style>
