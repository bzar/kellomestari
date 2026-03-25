<script lang="ts">
  import {
    generateExercises,
    type Exercise, type Difficulty,
    type ConversionExercise, type DifferenceExercise, type AdditionExercise,
    type MestariExercise,
  } from './lib/times.js';
  import ExerciseView from './lib/Exercise.svelte';
  import MestariView  from './lib/MestariExercise.svelte';

  type Screen = 'start' | 'playing' | 'finished';

  let screen      = $state<Screen>('start');
  let exercises   = $state<Exercise[]>([]);
  let currentIdx  = $state(0);
  let score       = $state(0);
  let difficulty  = $state<Difficulty>('aloittelija');

  function start(diff: Difficulty) {
    difficulty = diff;
    exercises  = generateExercises(diff, 10);
    currentIdx = 0;
    score      = 0;
    screen     = 'playing';
  }

  function handleAnswer(correct: boolean) {
    if (correct) score++;
  }

  function handleNext() {
    if (currentIdx < exercises.length - 1) {
      currentIdx++;
    } else {
      screen = 'finished';
    }
  }

  function scoreEmoji(s: number) {
    if (s === 10) return '🏆';
    if (s >= 8)   return '🌟';
    if (s >= 6)   return '👍';
    if (s >= 4)   return '💪';
    return '📚';
  }

  function scoreMessage(s: number) {
    if (s === 10) return 'Täydellinen! Olet oikea Kellomestari!';
    if (s >= 8)   return 'Mahtavaa! Melkein täydellinen!';
    if (s >= 6)   return 'Hyvää työtä! Harjoittele vielä!';
    if (s >= 4)   return 'Hyvää yritystä! Kokeile uudelleen!';
    return 'Harjoittele lisää – siitä se opitaan!';
  }

  const LEVELS: { id: Difficulty; emoji: string; name: string; desc: string }[] = [
    { id: 'aloittelija', emoji: '🌱', name: 'Aloittelija', desc: 'Tunnit 1–12, tasaminuutit' },
    { id: 'oppilas',     emoji: '📚', name: 'Oppilas',     desc: 'Tunnit 1–24, haastavampi' },
    { id: 'kisalli',     emoji: '⚡', name: 'Kisälli',     desc: '5 min välein, aikavälit' },
    { id: 'mestari',     emoji: '🏆', name: 'Mestari',     desc: 'Aseta kello itse' },
  ];

  function isMestari(ex: Exercise): ex is MestariExercise {
    return ex.type === 'mestari';
  }
  function isMulti(ex: Exercise): ex is ConversionExercise | DifferenceExercise | AdditionExercise {
    return ex.type !== 'mestari';
  }
</script>

<!-- ── Start screen ───────────────────────────────────────── -->
{#if screen === 'start'}
  <div class="screen start-screen">
    <div class="title-emoji">⏰</div>
    <h1>Kellomestari</h1>
    <p class="subtitle">Opitaan lukemaan kelloa!</p>
    <p class="level-prompt">Valitse taso:</p>
    <div class="level-grid">
      {#each LEVELS as lvl}
        <button class="level-btn" onclick={() => start(lvl.id)}>
          <span class="level-emoji">{lvl.emoji}</span>
          <span class="level-name">{lvl.name}</span>
          <span class="level-desc">{lvl.desc}</span>
        </button>
      {/each}
    </div>
  </div>

<!-- ── Game screen ────────────────────────────────────────── -->
{:else if screen === 'playing'}
  <div class="screen game-screen">
    <div class="top-bar">
      <div class="progress-dots">
        {#each exercises as _, i}
          <span
            class="dot"
            class:done={i < currentIdx}
            class:active={i === currentIdx}
          ></span>
        {/each}
      </div>
      <div class="score-badge">⭐ {score}</div>
    </div>

    <div class="question-label">Tehtävä {currentIdx + 1} / {exercises.length}</div>

    {#key currentIdx}
      {#if isMestari(exercises[currentIdx])}
        <MestariView
          exercise={exercises[currentIdx] as MestariExercise}
          onAnswer={handleAnswer}
          onNext={handleNext}
        />
      {:else}
        <ExerciseView
          exercise={exercises[currentIdx] as ConversionExercise | DifferenceExercise | AdditionExercise}
          onAnswer={handleAnswer}
          onNext={handleNext}
        />
      {/if}
    {/key}
  </div>

<!-- ── Results screen ─────────────────────────────────────── -->
{:else}
  <div class="screen finish-screen">
    <div class="result-emoji">{scoreEmoji(score)}</div>
    <h2>Peli ohi!</h2>
    <div class="score-display">{score} / 10</div>
    <p class="score-msg">{scoreMessage(score)}</p>
    <button class="big-btn" onclick={() => (screen = 'start')}>Pelaa uudelleen! 🔄</button>
  </div>
{/if}

<style>
  /* ── Shared ──────────────────────────────────────────────── */
  .screen {
    height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: clamp(12px, 2dvh, 24px) 16px;
    gap: clamp(10px, 1.8dvh, 20px);
    overflow: hidden;
  }

  /* ── Start screen ────────────────────────────────────────── */
  .start-screen { gap: clamp(8px, 1.4dvh, 14px); }
  .title-emoji {
    font-size: clamp(3rem, 8dvh, 5rem);
    animation: wobble 2s ease-in-out infinite;
  }
  h1 {
    font-size: clamp(2.2rem, 6dvh, 3.2rem);
    font-weight: 900;
    color: #d84315;
    text-shadow: 2px 2px 0 #ff8f00;
    margin: 0;
  }
  .subtitle {
    font-size: clamp(1.1rem, 2.8dvh, 1.4rem);
    font-weight: 700;
    color: #5d4037;
    text-align: center;
    margin: 0;
  }
  .level-prompt {
    font-size: clamp(0.9rem, 2dvh, 1.1rem);
    font-weight: 700;
    color: #795548;
    margin: 0;
  }
  .level-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(8px, 1.4dvh, 12px);
    width: 100%;
    max-width: 360px;
  }
  .level-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: clamp(10px, 1.8dvh, 16px) 12px;
    border-radius: 18px;
    border: none;
    background: #ef6c00;
    color: white;
    font-family: inherit;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .level-btn:hover  { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.26); }
  .level-btn:active { transform: scale(0.96); }
  .level-emoji { font-size: clamp(1.6rem, 4dvh, 2.2rem); }
  .level-name  { font-size: clamp(1rem, 2.5dvh, 1.2rem); font-weight: 900; }
  .level-desc  { font-size: clamp(0.65rem, 1.5dvh, 0.8rem); font-weight: 600; text-align: center; opacity: 0.9; }

  /* ── Game screen ─────────────────────────────────────────── */
  .game-screen {
    justify-content: flex-start;
    padding-top: clamp(10px, 1.5dvh, 16px);
    gap: clamp(8px, 1.4dvh, 16px);
  }
  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 360px;
  }
  .progress-dots { display: flex; gap: 6px; align-items: center; }
  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #bcaaa4;
    transition: background 0.3s, transform 0.3s;
  }
  .dot.done   { background: #66bb6a; }
  .dot.active { background: #ffa726; transform: scale(1.4); }
  .score-badge {
    font-size: 1.3rem;
    font-weight: 900;
    color: #5d4037;
    background: #fff9c4;
    border-radius: 20px;
    padding: 4px 14px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  }
  .question-label {
    font-size: clamp(0.85rem, 1.8dvh, 1rem);
    font-weight: 700;
    color: #8d6e63;
    text-align: center;
  }

  /* ── Results screen ──────────────────────────────────────────────────── */
  .finish-screen { gap: clamp(10px, 1.8dvh, 16px); }
  .result-emoji  { font-size: clamp(4rem, 10dvh, 7rem); animation: bigBounce 0.7s cubic-bezier(0.68,-0.55,0.27,1.55); }
  h2 { font-size: clamp(1.8rem, 5dvh, 2.4rem); font-weight: 900; color: #d84315; margin: 0; }
  .score-display {
    font-size: clamp(3rem, 8dvh, 4.5rem);
    font-weight: 900;
    color: #1565c0;
    background: white;
    border-radius: 24px;
    padding: clamp(12px, 2dvh, 16px) 40px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.14);
  }
  .score-msg {
    font-size: clamp(1.1rem, 2.8dvh, 1.4rem);
    font-weight: 700;
    color: #4e342e;
    text-align: center;
    max-width: 300px;
    margin: 0;
  }

  /* ── Shared button ───────────────────────────────────────────────────── */
  .big-btn {
    padding: clamp(14px, 2.5dvh, 18px) 44px;
    font-size: clamp(1.2rem, 3dvh, 1.5rem);
    font-weight: 900;
    font-family: inherit;
    border-radius: 20px;
    border: none;
    background: #ef6c00;
    color: white;
    cursor: pointer;
    box-shadow: 0 5px 18px rgba(0,0,0,0.22);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .big-btn:hover  { transform: translateY(-3px); box-shadow: 0 10px 26px rgba(0,0,0,0.28); }
  .big-btn:active { transform: scale(0.96); }

  @keyframes wobble {
    0%,100% { transform: rotate(-8deg) scale(1); }
    50%     { transform: rotate(8deg)  scale(1.05); }
  }
  @keyframes bigBounce {
    0%   { transform: scale(0); }
    65%  { transform: scale(1.3); }
    100% { transform: scale(1); }
  }
</style>
