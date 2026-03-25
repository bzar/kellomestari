# Kellomestari 🕐

**Kellomestari** (Clock Master) is an interactive clock-reading educational game for Finnish children. Players practise reading analog clocks by completing 10 exercises that mix analog, digital, and Finnish text representations of time.

## Game Mechanics

1. **Start** – Click the start button to begin a 10-exercise session.
2. **Exercise** – Each round shows a time in one format and asks the player to pick the correct answer from 4 choices in a different format.
3. **Feedback** – A correct answer triggers a celebration animation; an incorrect answer reveals the correct answer highlighted in green.
4. **Results** – After 10 exercises the final score is shown with an emoji reaction and an encouraging message in Finnish.

### Question/Answer Format Combinations

| Question format | Answer format |
|-----------------|---------------|
| Analog clock    | Finnish text  |
| Analog clock    | Digital       |
| Finnish text    | Analog clock  |
| Finnish text    | Digital       |
| Digital         | Finnish text  |
| Digital         | Analog clock  |

Times cover every quarter hour across 12 hours (48 unique times in total).

## Tech Stack

| Layer        | Technology                        |
|--------------|-----------------------------------|
| Framework    | [Svelte 5](https://svelte.dev/)   |
| Build tool   | [Vite 6](https://vitejs.dev/)     |
| Language     | TypeScript 5                      |
| Graphics     | SVG (analog clock hands & face)   |
| Font         | [Nunito](https://fonts.google.com/specimen/Nunito) via Google Fonts |

## Project Structure

```
src/
├── App.svelte          # Root component – game state, scoring, screen routing
├── components/
│   ├── AnalogClock.svelte  # SVG analog clock renderer
│   └── Exercise.svelte     # Single exercise UI (question + 4 answer buttons)
├── lib/
│   └── times.ts        # Time conversion, Finnish text labels, exercise generation
├── app.css             # Global styles (warm gradient background, Nunito font)
└── main.ts             # Entry point
index.html              # Finnish lang attribute, Google Fonts preload
```

## Getting Started

```bash
npm install
npm run dev       # Start development server
```

### Other scripts

```bash
npm run build     # Production build → dist/
npm run preview   # Preview the production build locally
```

## Features

- 🇫🇮 Fully localised in Finnish (UI, time names, result messages)
- 🎉 Celebratory animations on correct answers
- 📱 Touch-friendly, large-button layout suitable for tablets
- 🎨 Warm, playful colour scheme designed for young learners
