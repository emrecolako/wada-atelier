# Wada Atelier

A modern, responsive color atlas for Sanzo Wada's *Dictionary of Color Combinations*.

Wada Atelier turns the historical palette collection into a fast working interface for browsing, filtering, composing, and exporting color systems.

## Features

- Browse 348 Wada color combinations and 159 source colors.
- Search by color name, hex value, or combination number.
- Filter palettes by color count and mood.
- Inspect tone, temperature, energy, and related combinations.
- Copy individual colors, complete hex sets, or export-ready tokens.
- Export palettes as CSS variables, JSON, or Tailwind color config.
- Responsive interface designed for desktop and mobile workflows.

## Tech Stack

- React
- TypeScript
- Vite
- Lucide React
- `dictionary-of-colour-combinations`

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Data Source

Palette data comes from [`dictionary-of-colour-combinations`](https://github.com/mattdesl/dictionary-of-colour-combinations), an MIT-licensed dataset based on Sanzo Wada's *A Dictionary of Color Combinations*.

## License

This project is published as an interface and tool for exploring the Wada palette data. Check dependency licenses before redistributing bundled data or assets.
