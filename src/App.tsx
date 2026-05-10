import {
  Check,
  Copy,
  Search,
  Shuffle,
  SlidersHorizontal,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import rawColors from 'dictionary-of-colour-combinations';

type RawColor = (typeof rawColors)[number];

type WadaColor = RawColor & {
  index: number;
  slug: string;
  luminance: number;
  chroma: number;
  hue: number;
  textColor: string;
};

type PaletteSize = 'all' | '2' | '3' | '4';
type MoodFilter = 'all' | 'quiet' | 'warm' | 'cool' | 'deep' | 'vivid';
type ExportMode = 'css' | 'json' | 'tailwind';

type PaletteEntry = {
  id: number;
  colors: WadaColor[];
  tone: string;
  mood: MoodFilter;
  energy: string;
  temperature: string;
  summary: string;
  score: number;
  searchText: string;
};

const colors = rawColors.map((color, index): WadaColor => {
  const luminance = relativeLuminance(color.rgb);
  const hue = rgbToHue(color.rgb);

  return {
    ...color,
    index: index + 1,
    slug: slugify(color.name),
    luminance,
    chroma: Math.hypot(color.lab[1], color.lab[2]),
    hue,
    textColor: luminance > 0.47 ? '#171512' : '#fffaf0',
  };
});

const palettes = createPalettes(colors);
const initialPalette = palettes.find((palette) => palette.id === 286) ?? palettes[0];

const sizeOptions: Array<{ label: string; value: PaletteSize }> = [
  { label: 'All', value: 'all' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4', value: '4' },
];

const moodOptions: Array<{ label: string; value: MoodFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Quiet', value: 'quiet' },
  { label: 'Warm', value: 'warm' },
  { label: 'Cool', value: 'cool' },
  { label: 'Deep', value: 'deep' },
  { label: 'Vivid', value: 'vivid' },
];

const exportOptions: Array<{ label: string; value: ExportMode }> = [
  { label: 'CSS', value: 'css' },
  { label: 'JSON', value: 'json' },
  { label: 'Tailwind', value: 'tailwind' },
];

export function App() {
  const [query, setQuery] = useState('');
  const [sizeFilter, setSizeFilter] = useState<PaletteSize>('all');
  const [moodFilter, setMoodFilter] = useState<MoodFilter>('all');
  const [selectedId, setSelectedId] = useState(initialPalette.id);
  const [exportMode, setExportMode] = useState<ExportMode>('css');
  const [copied, setCopied] = useState<string | null>(null);

  const filteredPalettes = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return palettes
      .filter((palette) => {
        const matchesSize =
          sizeFilter === 'all' || palette.colors.length === Number(sizeFilter);
        const matchesMood = moodFilter === 'all' || palette.mood === moodFilter;
        const matchesQuery =
          normalized.length === 0 || palette.searchText.includes(normalized);

        return matchesSize && matchesMood && matchesQuery;
      })
      .sort((a, b) => b.score - a.score);
  }, [moodFilter, query, sizeFilter]);

  const selectedPalette =
    palettes.find((palette) => palette.id === selectedId) ?? filteredPalettes[0] ?? palettes[0];

  const relatedPalettes = useMemo(() => {
    const selectedColorNames = new Set(selectedPalette.colors.map((color) => color.name));

    return palettes
      .filter((palette) => palette.id !== selectedPalette.id)
      .map((palette) => ({
        palette,
        overlap: palette.colors.filter((color) => selectedColorNames.has(color.name)).length,
      }))
      .filter((item) => item.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap || b.palette.score - a.palette.score)
      .slice(0, 5)
      .map((item) => item.palette);
  }, [selectedPalette]);

  const exportValue = useMemo(
    () => formatPaletteExport(selectedPalette, exportMode),
    [exportMode, selectedPalette],
  );

  useEffect(() => {
    if (filteredPalettes.length > 0 && !filteredPalettes.some((palette) => palette.id === selectedId)) {
      setSelectedId(filteredPalettes[0].id);
    }
  }, [filteredPalettes, selectedId]);

  useEffect(() => {
    if (!copied) return;

    const timeout = window.setTimeout(() => setCopied(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const rootStyle = {
    '--accent': selectedPalette.colors[0]?.hex,
    '--accent-two': selectedPalette.colors[1]?.hex ?? selectedPalette.colors[0]?.hex,
    '--accent-three': selectedPalette.colors[2]?.hex ?? selectedPalette.colors[0]?.hex,
    '--accent-four': selectedPalette.colors[3]?.hex ?? selectedPalette.colors[0]?.hex,
    '--selected-ink': selectedPalette.colors[0]?.textColor,
  } as React.CSSProperties;

  function copyValue(value: string, label: string) {
    void navigator.clipboard.writeText(value);
    setCopied(label);
  }

  function chooseRandomPalette() {
    const source = filteredPalettes.length > 0 ? filteredPalettes : palettes;
    const next = source[Math.floor(Math.random() * source.length)];
    setSelectedId(next.id);
  }

  return (
    <main className="app" style={rootStyle}>
      <header className="topbar" aria-label="Application header">
        <a className="brand" href="#" aria-label="Wada Atelier home">
          <span>
            <strong>Wada Atelier</strong>
            <small>Sanzo Wada color atlas.</small>
          </span>
        </a>

        <div className="header-actions" aria-label="Collection summary">
          <span>{palettes.length} combinations</span>
          <span>{colors.length} colors</span>
          <button className="text-button primary" type="button" onClick={chooseRandomPalette}>
            <Shuffle size={16} />
            Random palette
          </button>
        </div>
      </header>

      <section className="workbench" aria-label="Color atelier">
        <aside className="library" aria-label="Palette library">
          <div className="library-head">
            <div>
              <p className="kicker">Collection</p>
              <h1>Compose with Wada’s historical color systems.</h1>
              <p className="lede">
                Search the full 1930s dictionary, filter by mood, and copy production-ready color tokens.
              </p>
            </div>
          </div>

          <label className="search-box">
            <Search size={17} />
            <input
              name="palette-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search color, hex, or number"
              aria-label="Search palettes"
            />
          </label>

          <div className="filter-block" aria-label="Palette filters">
            <div className="filter-row">
              <SlidersHorizontal size={16} />
              <span>Colors</span>
              <SegmentedControl
                value={sizeFilter}
                options={sizeOptions}
                onChange={setSizeFilter}
              />
            </div>

            <SegmentedControl
              value={moodFilter}
              options={moodOptions}
              onChange={setMoodFilter}
              wide
            />
          </div>

          <div className="result-count">
            <span>{filteredPalettes.length} palettes</span>
            <span>Sorted by presence.</span>
          </div>

          <div className="palette-list" role="listbox" aria-label="Filtered palettes">
            {filteredPalettes.map((palette) => (
              <button
                className={`palette-row ${palette.id === selectedPalette.id ? 'active' : ''}`}
                type="button"
                key={palette.id}
                onClick={() => setSelectedId(palette.id)}
                role="option"
                aria-selected={palette.id === selectedPalette.id}
              >
                <span className="row-number">#{palette.id}</span>
                <span className="row-swatches" aria-hidden="true">
                  {palette.colors.map((color) => (
                    <span key={color.slug} style={{ backgroundColor: color.hex }} />
                  ))}
                </span>
                <span className="row-copy">
                  <strong>{palette.temperature}</strong>
                  <small>{palette.energy}</small>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="stage" aria-label={`Combination ${selectedPalette.id}`}>
          <div className="stage-header">
            <div>
              <p className="kicker">Combination #{selectedPalette.id}</p>
              <h2>{selectedPalette.summary}</h2>
              <p className="stage-note">
                {selectedPalette.tone} tone, {selectedPalette.temperature.toLowerCase()} temperature,
                and {selectedPalette.energy.toLowerCase()} energy.
              </p>
            </div>
            <div className="stage-actions">
              <button
                className="text-button"
                type="button"
                onClick={() => copyValue(selectedPalette.colors.map((color) => color.hex).join(', '), 'Hex set')}
              >
                <Copy size={16} />
                Copy
              </button>
              <button
                className="icon-button"
                type="button"
                onClick={chooseRandomPalette}
                aria-label="Choose a random palette"
                title="Random palette"
              >
                <Shuffle size={17} />
              </button>
            </div>
          </div>

          <div className={`composition composition-${selectedPalette.colors.length}`}>
            {selectedPalette.colors.map((color, index) => (
              <button
                className="composition-panel"
                type="button"
                key={color.slug}
                style={{
                  backgroundColor: color.hex,
                  color: color.textColor,
                  '--panel-index': index,
                } as React.CSSProperties}
                onClick={() => copyValue(color.hex, color.name)}
                title={`Copy ${color.hex}`}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{color.name}</strong>
              </button>
            ))}
          </div>

          <ul className="chips" aria-label="Palette colors" role="list">
            {selectedPalette.colors.map((color) => (
              <li key={color.slug}>
                <button
                  className="color-chip"
                  type="button"
                  onClick={() => copyValue(color.hex, color.name)}
                  title={`Copy ${color.hex}`}
                >
                  <span
                    className="chip-swatch"
                    style={{ backgroundColor: color.hex }}
                    aria-hidden="true"
                  />
                  <span>
                    <strong>{color.name}</strong>
                    <small>{color.hex.toUpperCase()}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="detail-grid" aria-label="Palette inspector">
            <section className="detail-section">
              <div className="section-title">
                <span>Profile</span>
                <span>#{selectedPalette.id}</span>
              </div>
              <dl className="profile-grid">
                <div>
                  <dt>Tone</dt>
                  <dd>{selectedPalette.tone}</dd>
                </div>
                <div>
                  <dt>Temperature</dt>
                  <dd>{selectedPalette.temperature}</dd>
                </div>
                <div>
                  <dt>Energy</dt>
                  <dd>{selectedPalette.energy}</dd>
                </div>
                <div>
                  <dt>Format</dt>
                  <dd>{selectedPalette.colors.length} colors</dd>
                </div>
              </dl>
            </section>

            <section className="detail-section export-panel">
              <div className="section-title">
                <span>Export</span>
                <span>Tokens</span>
              </div>
              <SegmentedControl
                value={exportMode}
                options={exportOptions}
                onChange={setExportMode}
                wide
              />
              <pre className="export-box">{exportValue}</pre>
              <button
                className="text-button full"
                type="button"
                onClick={() => copyValue(exportValue, `${exportMode.toUpperCase()} export`)}
              >
                <Copy size={16} />
                Copy export
              </button>
            </section>

            <section className="detail-section">
              <div className="section-title">
                <span>Adjacent</span>
                <span>Shared colors</span>
              </div>
              <div className="related-list">
                {relatedPalettes.map((palette) => (
                  <button
                    type="button"
                    key={palette.id}
                    className="related-item"
                    onClick={() => setSelectedId(palette.id)}
                  >
                    <span>#{palette.id}</span>
                    <span className="mini-swatches" aria-hidden="true">
                      {palette.colors.map((color) => (
                        <i key={color.slug} style={{ backgroundColor: color.hex }} />
                      ))}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </section>
      </section>

      <div className={`toast ${copied ? 'show' : ''}`} role="status" aria-live="polite">
        <Check size={16} />
        <span>{copied ? `${copied} copied` : 'Copied'}</span>
      </div>
    </main>
  );
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  wide = false,
}: {
  value: T;
  options: Array<{ label: string; value: T }>;
  onChange: (value: T) => void;
  wide?: boolean;
}) {
  return (
    <div className={`segmented ${wide ? 'wide' : ''}`}>
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          className={option.value === value ? 'selected' : ''}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function createPalettes(sourceColors: WadaColor[]) {
  const map = sourceColors.reduce((paletteMap, color) => {
    color.combinations.forEach((id) => {
      const list = paletteMap.get(id) ?? [];
      list.push(color);
      paletteMap.set(id, list);
    });
    return paletteMap;
  }, new Map<number, WadaColor[]>());

  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([id, paletteColors]): PaletteEntry => {
      const lightness = average(paletteColors.map((color) => color.lab[0]));
      const chroma = average(paletteColors.map((color) => color.chroma));
      const luminanceSpread =
        Math.max(...paletteColors.map((color) => color.luminance)) -
        Math.min(...paletteColors.map((color) => color.luminance));
      const hueSpread = circularSpread(paletteColors.map((color) => color.hue));
      const warmCount = paletteColors.filter((color) => isWarmHue(color.hue)).length;
      const coolCount = paletteColors.filter((color) => isCoolHue(color.hue)).length;
      const temperature =
        warmCount >= paletteColors.length - 1
          ? 'Warm'
          : coolCount >= paletteColors.length - 1
            ? 'Cool'
            : 'Balanced';
      const tone = lightness < 43 ? 'Deep' : lightness > 68 ? 'Airy' : 'Balanced';
      const mood = chooseMood({ chroma, lightness, temperature, hueSpread });
      const energy = chroma > 45 || hueSpread > 170 ? 'Vivid' : chroma < 25 ? 'Quiet' : 'Measured';
      const summary = [
        paletteColors[0]?.name,
        paletteColors[1]?.name,
        paletteColors.length > 2 ? `${paletteColors.length - 2} more` : undefined,
      ]
        .filter(Boolean)
        .join(' / ');

      return {
        id,
        colors: paletteColors,
        tone,
        mood,
        energy,
        temperature,
        summary,
        score: chroma * 1.1 + hueSpread * 0.35 + luminanceSpread * 55 + paletteColors.length * 8,
        searchText: [
          id,
          `#${id}`,
          tone,
          mood,
          energy,
          temperature,
          ...paletteColors.flatMap((color) => [color.name, color.hex, color.index]),
        ]
          .join(' ')
          .toLowerCase(),
      };
    });
}

function chooseMood({
  chroma,
  lightness,
  temperature,
  hueSpread,
}: {
  chroma: number;
  lightness: number;
  temperature: string;
  hueSpread: number;
}): MoodFilter {
  if (lightness < 42) return 'deep';
  if (chroma > 48 || hueSpread > 175) return 'vivid';
  if (temperature === 'Warm') return 'warm';
  if (temperature === 'Cool') return 'cool';
  return 'quiet';
}

function formatPaletteExport(palette: PaletteEntry, mode: ExportMode) {
  const entries = palette.colors.map((color, index) => ({
    name: color.name,
    hex: color.hex,
    rgb: color.rgb,
    cmyk: color.cmyk,
    lab: color.lab.map((value) => Number(value.toFixed(2))),
    token: `wada-${palette.id}-${index + 1}`,
  }));

  if (mode === 'json') {
    return JSON.stringify({ id: palette.id, colors: entries }, null, 2);
  }

  if (mode === 'tailwind') {
    return `colors: {
  wada${palette.id}: {
${entries.map((entry, index) => `    ${index + 1}: '${entry.hex}'`).join(',\n')}
  }
}`;
  }

  return `:root {
${entries.map((entry, index) => `  --wada-${palette.id}-${index + 1}: ${entry.hex};`).join('\n')}
}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function relativeLuminance(rgb: [number, number, number]) {
  const [r, g, b] = rgb.map((value) => {
    const channel = value / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function rgbToHue([r, g, b]: [number, number, number]) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  if (delta === 0) return 0;

  let hue = 0;
  if (max === red) hue = ((green - blue) / delta) % 6;
  if (max === green) hue = (blue - red) / delta + 2;
  if (max === blue) hue = (red - green) / delta + 4;

  return Math.round(hue * 60 + (hue < 0 ? 360 : 0));
}

function circularSpread(hues: number[]) {
  if (hues.length < 2) return 0;

  const sorted = [...hues].sort((a, b) => a - b);
  const gaps = sorted.map((hue, index) => {
    const next = sorted[(index + 1) % sorted.length];
    return index === sorted.length - 1 ? 360 - hue + sorted[0] : next - hue;
  });

  return 360 - Math.max(...gaps);
}

function isWarmHue(hue: number) {
  return hue <= 70 || hue >= 330;
}

function isCoolHue(hue: number) {
  return hue >= 145 && hue <= 285;
}
