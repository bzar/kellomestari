<script lang="ts">
  import { generateExercises, type Exercise } from './lib/times.js';
  import ExerciseView from './lib/Exercise.svelte';

  type Screen = 'start' | 'playing' | 'finished';

  let screen      = $state<Screen>('start');
  let exercises   = $state<Exercise[]>([]);
  let currentIdx  = $state(0);
  let score       = $state(0);

  function start() {
    exercises  = generateExercises(10);
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
</script>

<!-- ── Start screen ───────────────────────────────────────── -->
{#if screen === 'start'}
  <div class="screen start-screen">
    <div class="title-emoji">⏰</div>
    <h1>Kellomestari</h1>
    <p class="subtitle">Opitaan lukemaan kelloa!</p>
    <p class="subtitle small">10 tehtävää odottaa sinua.</p>
    <button class="big-btn" onclick={start}>Aloita peli! 🎮</button>
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
      <ExerciseView
        exercise={exercises[currentIdx]}
        onAnswer={handleAnswer}
        onNext={handleNext}
      />
    {/key}
  </div>

<!-- ── Results screen ─────────────────────────────────────── -->
{:else}
  <div class="screen finish-screen">
    <div class="result-emoji">{scoreEmoji(score)}</div>
    <h2>Peli ohi!</h2>
    <div class="score-display">{score} / 10</div>
    <p class="score-msg">{scoreMessage(score)}</p>
    <button class="big-btn" onclick={start}>Pelaa uudelleen! 🔄</button>
  </div>
{/if}

<style>
  /* ── Shared layout ───────────────────────────────────────── */
  .screen {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    gap: 20px;
  }

  /* ── Start screen ────────────────────────────────────────── */
  .start-screen { gap: 12px; }
  .title-emoji {
    font-size: 5rem;
    animation: wobble 2s ease-in-out infinite;
  }
  h1 {
    font-size: 3.2rem;
    font-weight: 900;
    color: #d84315;
    text-shadow: 2px 2px 0 #ff8f00;
    margin: 0;
  }
  .subtitle {
    font-size: 1.4rem;
    font-weight: 700;
    color: #5d4037;
    text-align: center;
    margin: 0;
  }
  .subtitle.small { font-size: 1.1rem; color: #795548; }

  /* ── Game screen ─────────────────────────────────────────── */
  .game-screen { justify-content: flex-start; padding-top: 16px; gap: 16px; }

  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 360px;
  }
  .progress-dots {
    display: flex;
    gap: 6px;
    align-items: center;
  }
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
    font-size: 1rem;
    font-weight: 700;
    color: #8d6e63;
    text-align: center;
  }

  /* ── Results screen ──────────────────────────────────────── */
  .finish-screen { gap: 16px; }
  .result-emoji  { font-size: 7rem; animation: bigBounce 0.7s cubic-bezier(0.68,-0.55,0.27,1.55); }
  h2 { font-size: 2.4rem; font-weight: 900; color: #d84315; margin: 0; }
  .score-display {
    font-size: 4.5rem;
    font-weight: 900;
    color: #1565c0;
    background: white;
    border-radius: 24px;
    padding: 16px 40px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.14);
  }
  .score-msg {
    font-size: 1.4rem;
    font-weight: 700;
    color: #4e342e;
    text-align: center;
    max-width: 300px;
    margin: 0;
  }

  /* ── Shared button ───────────────────────────────────────── */
  .big-btn {
    padding: 18px 44px;
    font-size: 1.5rem;
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

  /* ── Keyframes ───────────────────────────────────────────── */
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
