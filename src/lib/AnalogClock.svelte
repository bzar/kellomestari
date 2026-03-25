<script lang="ts">
  interface Props {
    hours: number;
    minutes: number;
    size?: number;
  }
  let { hours, minutes, size = 150 }: Props = $props();

  // Clock angle convention: 0 = 12 o'clock, increases clockwise (degrees)
  function tip(length: number, clockAngle: number, cx: number, cy: number) {
    const rad = (clockAngle - 90) * Math.PI / 180;
    return { x: cx + length * Math.cos(rad), y: cy + length * Math.sin(rad) };
  }

  const c        = $derived(size / 2);
  const r        = $derived(c - 4);
  const minAngle = $derived(minutes * 6);
  const hrAngle  = $derived((hours % 12) * 30 + minutes * 0.5);
  const hrTip    = $derived(tip(r * 0.55, hrAngle,  c, c));
  const minTip   = $derived(tip(r * 0.80, minAngle, c, c));

  const ticks    = $derived(Array.from({ length: 12 }, (_, i) => i));
  const cardinals = $derived([[12, 0], [3, 90], [6, 180], [9, 270]] as [number, number][]);
</script>

<svg width={size} height={size} viewBox="0 0 {size} {size}" style="display:block;flex-shrink:0;max-width:100%;max-height:100%">
  <!-- Face -->
  <circle cx={c} cy={c} r={r} fill="#fffde7" stroke="#f9a825" stroke-width="3" />

  <!-- Tick marks -->
  {#each ticks as i}
    {@const ca  = i * 30}
    {@const rad = (ca - 90) * Math.PI / 180}
    {@const isMajor  = i % 3 === 0}
    {@const tickOuter = r - 2}
    {@const tickInner = r - (isMajor ? 15 : 7)}
    <line
      x1={c + tickInner * Math.cos(rad)} y1={c + tickInner * Math.sin(rad)}
      x2={c + tickOuter * Math.cos(rad)} y2={c + tickOuter * Math.sin(rad)}
      stroke={isMajor ? '#6a1b9a' : '#ffa000'}
      stroke-width={isMajor ? 3 : 1.5}
      stroke-linecap="round"
    />
  {/each}

  <!-- Numbers at 12, 3, 6, 9 -->
  {#each cardinals as [n, ca]}
    {@const rad = (ca - 90) * Math.PI / 180}
    {@const tr  = r - 22}
    <text
      x={c + tr * Math.cos(rad)}
      y={c + tr * Math.sin(rad)}
      text-anchor="middle"
      dominant-baseline="middle"
      font-size={size * 0.14}
      font-weight="bold"
      fill="#4a148c"
    >{n}</text>
  {/each}

  <!-- Hour hand -->
  <line
    x1={c} y1={c} x2={hrTip.x} y2={hrTip.y}
    stroke="#283593" stroke-width={Math.max(4, size * 0.048)} stroke-linecap="round"
  />

  <!-- Minute hand -->
  <line
    x1={c} y1={c} x2={minTip.x} y2={minTip.y}
    stroke="#0277bd" stroke-width={Math.max(3, size * 0.030)} stroke-linecap="round"
  />

  <!-- Centre dot -->
  <circle cx={c} cy={c} r={Math.max(5, size * 0.05)} fill="#283593" />
</svg>
