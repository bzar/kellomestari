export type Difficulty = 'aloittelija' | 'oppilas' | 'kisalli' | 'mestari';

export interface ClockTime {
  hours: number;   // 1–12 (aloittelija) or 1–24 (oppilas+)
  minutes: number; // 0,15,30,45 (aloittelija/oppilas) or multiples of 5 (kisalli+)
}

export type Format = 'analog' | 'digital' | 'text';

export interface ConversionExercise {
  type: 'conversion';
  time: ClockTime;
  questionFormat: Format;
  answerFormat: Format;
  choices: ClockTime[];
  correctIndex: number;
}

export interface DifferenceExercise {
  type: 'difference';
  time1: ClockTime;
  time2: ClockTime;
  choices: number[];   // durations in minutes
  correctIndex: number;
}

export interface AdditionExercise {
  type: 'addition';
  time: ClockTime;
  delta: number;        // minutes (positive = add, negative = subtract)
  choices: ClockTime[];
  correctIndex: number;
}

export interface MestariConversionExercise {
  type: 'mestari';
  variant: 'conversion';
  targetTime: ClockTime;
  targetFormat: Format;
  answerFormat: Format;
}

export interface MestariDifferenceExercise {
  type: 'mestari';
  variant: 'difference';
  time1: ClockTime;
  time2: ClockTime;
  correctMinutes: number;
}

export interface MestariAdditionExercise {
  type: 'mestari';
  variant: 'addition';
  baseTime: ClockTime;
  delta: number;
  answerFormat: Format;
}

export type MestariExercise =
  | MestariConversionExercise
  | MestariDifferenceExercise
  | MestariAdditionExercise;

export type Exercise =
  | ConversionExercise
  | DifferenceExercise
  | AdditionExercise
  | MestariExercise;

// ── Finnish spoken hour names (12h) ────────────────────
const HOURS_FI: Record<number, string> = {
   1: 'yksi',        2: 'kaksi',       3: 'kolme',
   4: 'neljä',       5: 'viisi',       6: 'kuusi',
   7: 'seitsemän',   8: 'kahdeksan',   9: 'yhdeksän',
  10: 'kymmenen',   11: 'yksitoista', 12: 'kaksitoista',
};

function to12h(h: number): number {
  const r = h % 12;
  return r === 0 ? 12 : r;
}

function nextHour(h: number): number {
  const r = to12h(h);
  return r === 12 ? 1 : r + 1;
}

export function toText(time: ClockTime): string {
  const h  = to12h(time.hours);
  const nh = nextHour(time.hours);
  switch (time.minutes) {
    case  0: return `kello ${HOURS_FI[h]}`;
    case  5: return `viisi yli\n${HOURS_FI[h]}`;
    case 10: return `kymmenen yli\n${HOURS_FI[h]}`;
    case 15: return `varttia yli\n${HOURS_FI[h]}`;
    case 20: return `kaksikymmentä yli\n${HOURS_FI[h]}`;
    case 25: return `viisi vaille\npuoli ${HOURS_FI[nh]}`;
    case 30: return `puoli ${HOURS_FI[nh]}`;
    case 35: return `viisi yli\npuoli ${HOURS_FI[nh]}`;
    case 40: return `kaksikymmentä vaille\n${HOURS_FI[nh]}`;
    case 45: return `varttia vaille\n${HOURS_FI[nh]}`;
    case 50: return `kymmenen vaille\n${HOURS_FI[nh]}`;
    case 55: return `viisi vaille\n${HOURS_FI[nh]}`;
    default: return `${time.hours}:${String(time.minutes).padStart(2, '0')}`;
  }
}

export function toDigital(time: ClockTime): string {
  return `${time.hours}:${String(time.minutes).padStart(2, '0')}`;
}

export function timesEqual(a: ClockTime, b: ClockTime): boolean {
  return a.hours === b.hours && a.minutes === b.minutes;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} t`;
  return `${h} t ${m} min`;
}

// ── Internal helpers ─────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getPool(difficulty: Difficulty): ClockTime[] {
  const maxH = difficulty === 'aloittelija' ? 12 : 24;
  const mins = (difficulty === 'aloittelija' || difficulty === 'oppilas')
    ? [0, 15, 30, 45]
    : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const pool: ClockTime[] = [];
  for (let h = 1; h <= maxH; h++)
    for (const m of mins)
      pool.push({ hours: h, minutes: m });
  return pool;
}

/** For hours > 12, analog is ambiguous → only digital/text. */
function validFormats(time: ClockTime): Format[] {
  return time.hours > 12 ? ['digital', 'text'] : ['analog', 'digital', 'text'];
}

function randomPair(time: ClockTime): [Format, Format] {
  const fmts = validFormats(time);
  const q = fmts[Math.floor(Math.random() * fmts.length)];
  const rest = fmts.filter(f => f !== q);
  const a = rest[Math.floor(Math.random() * rest.length)];
  return [q, a];
}

function randomChoices(correct: ClockTime, pool: ClockTime[]): ClockTime[] {
  const wrong = shuffle(pool.filter(t => !timesEqual(t, correct))).slice(0, 3);
  return shuffle([correct, ...wrong]);
}

/** Oppilas: every wrong choice shares hours OR minutes with correct. */
function halfCorrectChoices(correct: ClockTime, pool: ClockTime[]): ClockTime[] {
  const sameH = pool.filter(t => t.hours === correct.hours && t.minutes !== correct.minutes);
  const sameM = pool.filter(t => t.minutes === correct.minutes && t.hours !== correct.hours);
  let candidates = shuffle([...sameH, ...sameM]);
  if (candidates.length < 3) {
    const extra = shuffle(pool.filter(t => !timesEqual(t, correct) && !candidates.some(c => timesEqual(c, t))));
    candidates = [...candidates, ...extra];
  }
  return shuffle([correct, ...candidates.slice(0, 3)]);
}

// ── Interval generators exercise ──────────────

function clockToMin(t: ClockTime): number {
  return t.hours * 60 + t.minutes;
}

function generateDifference(pool: ClockTime[]): DifferenceExercise {
  const p = pool.filter(t => t.hours >= 1 && t.hours <= 23);
  let time1!: ClockTime, time2!: ClockTime, diff = 0;
  for (let att = 0; att < 200; att++) {
    const [a, b] = shuffle(p).slice(0, 2);
    const ma = clockToMin(a), mb = clockToMin(b);
    const d = Math.abs(mb - ma);
    if (d >= 5 && d <= 180) {
      [time1, time2] = ma < mb ? [a, b] : [b, a];
      diff = d;
      break;
    }
  }
  const distractors: number[] = [];
  const offsets = shuffle([-30, -25, -20, -15, -10, -5, 5, 10, 15, 20, 25, 30]);
  for (const off of offsets) {
    const d = diff + off;
    if (d > 0 && d <= 180 && d !== diff && !distractors.includes(d)) {
      distractors.push(d);
      if (distractors.length === 3) break;
    }
  }
  const choices = shuffle([diff, ...distractors]);
  return { type: 'difference', time1, time2, choices, correctIndex: choices.indexOf(diff) };
}

function generateAddition(pool: ClockTime[]): AdditionExercise {
  const p = pool.filter(t => t.hours >= 1 && t.hours <= 23);
  const deltas = [-60, -45, -30, -25, -20, -15, 15, 20, 25, 30, 45, 60];
  let time!: ClockTime, delta!: number, correct!: ClockTime;
  for (let att = 0; att < 200; att++) {
    const t = p[Math.floor(Math.random() * p.length)];
    const d = deltas[Math.floor(Math.random() * deltas.length)];
    const total = clockToMin(t) + d;
    if (total >= 60 && total < 1440) {
      time = t;
      delta = d;
      correct = { hours: Math.floor(total / 60), minutes: total % 60 };
      break;
    }
  }
  const wrong: ClockTime[] = [];
  const offsets = shuffle([-30, -25, -20, -15, -10, -5, 5, 10, 15, 20, 25, 30]);
  for (const off of offsets) {
    const total = clockToMin(correct) + off;
    if (total >= 60 && total < 1440) {
      const candidate = { hours: Math.floor(total / 60), minutes: total % 60 };
      if (!timesEqual(candidate, correct) && !wrong.some(w => timesEqual(w, candidate))) {
        wrong.push(candidate);
        if (wrong.length === 3) break;
      }
    }
  }
  const choices = shuffle([correct, ...wrong]);
  return {
    type: 'addition', time, delta, choices,
    correctIndex: choices.findIndex(c => timesEqual(c, correct)),
  };
}

// ── Public API ───────────────────────────────────────────────

export function generateExercises(difficulty: Difficulty, count = 10): Exercise[] {
  const pool = getPool(difficulty);

  if (difficulty === 'mestari') {
    const allFormats: Format[] = ['analog', 'digital', 'text'];
    return Array.from({ length: count }, () => {
      const r = Math.random();
      if (r < 0.25) {
        const d = generateDifference(pool);
        const correctMinutes = d.choices[d.correctIndex];
        return { type: 'mestari', variant: 'difference', time1: d.time1, time2: d.time2, correctMinutes } satisfies MestariDifferenceExercise;
      }
      if (r < 0.5) {
        const a = generateAddition(pool);
        const answerFormat = allFormats[Math.floor(Math.random() * 3)];
        return { type: 'mestari', variant: 'addition', baseTime: a.time, delta: a.delta, answerFormat } satisfies MestariAdditionExercise;
      }
      const time = pool[Math.floor(Math.random() * pool.length)];
      const targetFormat = allFormats[Math.floor(Math.random() * 3)];
      const rest = allFormats.filter(f => f !== targetFormat);
      const answerFormat = rest[Math.floor(Math.random() * rest.length)];
      return { type: 'mestari', variant: 'conversion', targetTime: time, targetFormat, answerFormat } satisfies MestariConversionExercise;
    });
  }

  return Array.from({ length: count }, () => {
    if (difficulty === 'kisalli') {
      const r = Math.random();
      if (r < 0.2) return generateDifference(pool);
      if (r < 0.4) return generateAddition(pool);
    }
    const time = pool[Math.floor(Math.random() * pool.length)];
    const [qf, af] = randomPair(time);
    const choices = (difficulty === 'oppilas' || difficulty === 'kisalli')
      ? halfCorrectChoices(time, pool)
      : randomChoices(time, pool);
    return {
      type: 'conversion', time, questionFormat: qf, answerFormat: af,
      choices, correctIndex: choices.findIndex(c => timesEqual(c, time)),
    } satisfies ConversionExercise;
  });
}
