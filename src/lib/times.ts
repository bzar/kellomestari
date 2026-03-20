export interface ClockTime {
  hours: number;   // 1–12
  minutes: number; // 0, 15, 30, 45
}

export type Format = 'analog' | 'digital' | 'text';

export interface Exercise {
  time: ClockTime;
  questionFormat: Format;
  answerFormat: Format;
  choices: ClockTime[];
  correctIndex: number;
}

const HOURS_FI: Record<number, string> = {
  1: 'yksi',      2: 'kaksi',      3: 'kolme',   4: 'neljä',
  5: 'viisi',     6: 'kuusi',      7: 'seitsemän', 8: 'kahdeksan',
  9: 'yhdeksän', 10: 'kymmenen',  11: 'yksitoista', 12: 'kaksitoista'
};

/** Finnish spoken form for a clock time. */
export function toText(time: ClockTime): string {
  const { hours, minutes } = time;
  const nextHour = hours === 12 ? 1 : hours + 1;
  switch (minutes) {
    case  0: return `kello ${HOURS_FI[hours]}`;
    case 15: return `varttia yli\n${HOURS_FI[hours]}`;
    case 30: return `puoli ${HOURS_FI[nextHour]}`;
    case 45: return `varttia vaille\n${HOURS_FI[nextHour]}`;
    default: return `${hours}:${String(minutes).padStart(2, '0')}`;
  }
}

export function toDigital(time: ClockTime): string {
  return `${time.hours}:${String(time.minutes).padStart(2, '0')}`;
}

export function timesEqual(a: ClockTime, b: ClockTime): boolean {
  return a.hours === b.hours && a.minutes === b.minutes;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const ALL_TIMES: ClockTime[] = [];
for (let h = 1; h <= 12; h++) {
  for (const m of [0, 15, 30, 45]) {
    ALL_TIMES.push({ hours: h, minutes: m });
  }
}

// All 6 format-pair combinations
const FORMAT_PAIRS: [Format, Format][] = [
  ['analog', 'text'], ['analog', 'digital'],
  ['text',   'analog'], ['text', 'digital'],
  ['digital','text'], ['digital', 'analog'],
];

export function generateExercises(count = 10): Exercise[] {
  const times = shuffle(ALL_TIMES).slice(0, count);
  // Repeat pairs list to cover 10 exercises with good variety
  const pairs = shuffle([...FORMAT_PAIRS, ...FORMAT_PAIRS]).slice(0, count);

  return times.map((time, i) => {
    const [questionFormat, answerFormat] = pairs[i];
    const wrongTimes = shuffle(ALL_TIMES.filter(t => !timesEqual(t, time))).slice(0, 3);
    const allChoices = shuffle([time, ...wrongTimes]);
    const correctIndex = allChoices.findIndex(t => timesEqual(t, time));
    return { time, questionFormat, answerFormat, choices: allChoices, correctIndex };
  });
}
