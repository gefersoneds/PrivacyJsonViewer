/**
 * Temas do JSON Path Viewer.
 *
 * Cada tema e um conjunto de cores aplicadas como CSS custom properties no
 * container (.jpv-container). O CSS usa var(--jpv-*), entao trocar de tema e
 * so reescrever essas variaveis inline.
 *
 * Os dois primeiros temas (Darcula e IntelliJ Light) reproduzem exatamente as
 * cores que ja existiam. Os demais sao presets comuns de IDEs. Ha ainda o modo
 * "custom", cujas cores o usuario define e ficam salvas no localStorage.
 */

/** Cores que compoem um tema. */
export interface ThemeColors {
  editorBg: string; // fundo da area do JSON
  uiBg: string; // fundo da toolbar/paineis
  text: string; // texto base
  key: string; // chaves
  string: string; // valores string
  number: string; // valores numericos
  boolean: string; // true/false
  null: string; // null
  punctuation: string; // brackets, virgulas, dois-pontos (estrutura)
  muted: string; // textos discretos (preview, contadores)
  border: string; // bordas/linhas-guia
  accent: string; // foco/realce
  match: string; // fundo de resultado de busca
  matchActive: string; // fundo do resultado ativo
  matchActiveText: string; // texto do resultado ativo
}

export interface ThemeDef {
  id: string;
  label: string;
  colors: ThemeColors;
}

/** Temas pre-definidos. Darcula e IntelliJ Light = cores atuais (inalteradas). */
export const THEMES: ThemeDef[] = [
  {
    id: "darcula",
    label: "Darcula (IntelliJ)",
    colors: {
      editorBg: "#2b2b2b",
      uiBg: "#3c3f41",
      text: "#d4d4d4",
      key: "#b084eb",
      string: "#00cec8",
      number: "#6897bb",
      boolean: "#6a9955",
      null: "#6a9955",
      punctuation: "#d4d4d4",
      muted: "#808080",
      border: "#313335",
      accent: "#4b6eaf",
      match: "rgba(50, 89, 61, 0.55)",
      matchActive: "#214283",
      matchActiveText: "#ffffff",
    },
  },
  {
    id: "intellij-light",
    label: "IntelliJ Light",
    colors: {
      editorBg: "#ffffff",
      uiBg: "#f2f2f2",
      text: "#080808",
      key: "#0033b3",
      string: "#067d17",
      number: "#1750eb",
      boolean: "#0033b3",
      null: "#0033b3",
      punctuation: "#080808",
      muted: "#8c8c8c",
      border: "#d1d1d1",
      accent: "#3574f0",
      match: "rgba(255, 226, 143, 0.75)",
      matchActive: "#a6d2ff",
      matchActiveText: "#080808",
    },
  },
  {
    id: "dracula",
    label: "Dracula",
    colors: {
      editorBg: "#282a36",
      uiBg: "#21222c",
      text: "#f8f8f2",
      key: "#bd93f9",
      string: "#f1fa8c",
      number: "#bd93f9",
      boolean: "#ff79c6",
      null: "#ff79c6",
      punctuation: "#f8f8f2",
      muted: "#6272a4",
      border: "#44475a",
      accent: "#bd93f9",
      match: "rgba(80, 250, 123, 0.25)",
      matchActive: "#44475a",
      matchActiveText: "#f8f8f2",
    },
  },
  {
    id: "monokai",
    label: "Monokai",
    colors: {
      editorBg: "#272822",
      uiBg: "#1e1f1c",
      text: "#f8f8f2",
      key: "#a6e22e",
      string: "#e6db74",
      number: "#ae81ff",
      boolean: "#ae81ff",
      null: "#ae81ff",
      punctuation: "#f8f8f2",
      muted: "#75715e",
      border: "#3b3c35",
      accent: "#66d9ef",
      match: "rgba(102, 217, 239, 0.22)",
      matchActive: "#49483e",
      matchActiveText: "#f8f8f2",
    },
  },
  {
    id: "solarized-dark",
    label: "Solarized Dark",
    colors: {
      editorBg: "#002b36",
      uiBg: "#073642",
      text: "#93a1a1",
      key: "#268bd2",
      string: "#2aa198",
      number: "#d33682",
      boolean: "#b58900",
      null: "#b58900",
      punctuation: "#93a1a1",
      muted: "#586e75",
      border: "#0b3a46",
      accent: "#268bd2",
      match: "rgba(181, 137, 0, 0.25)",
      matchActive: "#094f5e",
      matchActiveText: "#fdf6e3",
    },
  },
  {
    id: "solarized-light",
    label: "Solarized Light",
    colors: {
      editorBg: "#fdf6e3",
      uiBg: "#eee8d5",
      text: "#586e75",
      key: "#268bd2",
      string: "#2aa198",
      number: "#d33682",
      boolean: "#b58900",
      null: "#b58900",
      punctuation: "#586e75",
      muted: "#93a1a1",
      border: "#ddd6c1",
      accent: "#268bd2",
      match: "rgba(181, 137, 0, 0.28)",
      matchActive: "#d7cfb8",
      matchActiveText: "#586e75",
    },
  },
  {
    id: "one-dark",
    label: "One Dark",
    colors: {
      editorBg: "#282c34",
      uiBg: "#21252b",
      text: "#abb2bf",
      key: "#e06c75",
      string: "#98c379",
      number: "#d19a66",
      boolean: "#56b6c2",
      null: "#56b6c2",
      punctuation: "#abb2bf",
      muted: "#5c6370",
      border: "#3b4048",
      accent: "#61afef",
      match: "rgba(97, 175, 239, 0.22)",
      matchActive: "#3e4451",
      matchActiveText: "#ffffff",
    },
  },
  {
    id: "github-light",
    label: "GitHub Light",
    colors: {
      editorBg: "#ffffff",
      uiBg: "#f6f8fa",
      text: "#24292f",
      key: "#0550ae",
      string: "#0a3069",
      number: "#0550ae",
      boolean: "#cf222e",
      null: "#cf222e",
      punctuation: "#24292f",
      muted: "#6e7781",
      border: "#d0d7de",
      accent: "#0969da",
      match: "rgba(255, 223, 93, 0.6)",
      matchActive: "#b6e3ff",
      matchActiveText: "#24292f",
    },
  },
  {
    id: "nord",
    label: "Nord",
    colors: {
      editorBg: "#2e3440",
      uiBg: "#272c36",
      text: "#d8dee9",
      key: "#88c0d0",
      string: "#a3be8c",
      number: "#b48ead",
      boolean: "#81a1c1",
      null: "#81a1c1",
      punctuation: "#d8dee9",
      muted: "#616e88",
      border: "#3b4252",
      accent: "#88c0d0",
      match: "rgba(136, 192, 208, 0.22)",
      matchActive: "#434c5e",
      matchActiveText: "#eceff4",
    },
  },
  {
    id: "tokyo-night",
    label: "Tokyo Night",
    colors: {
      editorBg: "#1a1b26",
      uiBg: "#16161e",
      text: "#a9b1d6",
      key: "#7aa2f7",
      string: "#9ece6a",
      number: "#ff9e64",
      boolean: "#bb9af7",
      null: "#bb9af7",
      punctuation: "#a9b1d6",
      muted: "#565f89",
      border: "#2a2e42",
      accent: "#7aa2f7",
      match: "rgba(122, 162, 247, 0.22)",
      matchActive: "#283457",
      matchActiveText: "#c0caf5",
    },
  },
  {
    id: "night-owl",
    label: "Night Owl",
    colors: {
      editorBg: "#011627",
      uiBg: "#010e1a",
      text: "#d6deeb",
      key: "#7fdbca",
      string: "#ecc48d",
      number: "#f78c6c",
      boolean: "#c792ea",
      null: "#c792ea",
      punctuation: "#d6deeb",
      muted: "#637777",
      border: "#122d42",
      accent: "#82aaff",
      match: "rgba(130, 170, 255, 0.22)",
      matchActive: "#1d3b53",
      matchActiveText: "#ffffff",
    },
  },
  {
    id: "gruvbox-dark",
    label: "Gruvbox Dark",
    colors: {
      editorBg: "#282828",
      uiBg: "#1d2021",
      text: "#ebdbb2",
      key: "#8ec07c",
      string: "#b8bb26",
      number: "#d3869b",
      boolean: "#fe8019",
      null: "#fe8019",
      punctuation: "#ebdbb2",
      muted: "#928374",
      border: "#3c3836",
      accent: "#83a598",
      match: "rgba(131, 165, 152, 0.25)",
      matchActive: "#504945",
      matchActiveText: "#fbf1c7",
    },
  },
  {
    id: "one-light",
    label: "One Light",
    colors: {
      editorBg: "#fafafa",
      uiBg: "#eaeaeb",
      text: "#383a42",
      key: "#e45649",
      string: "#50a14f",
      number: "#986801",
      boolean: "#0184bc",
      null: "#0184bc",
      punctuation: "#383a42",
      muted: "#a0a1a7",
      border: "#d4d4d6",
      accent: "#4078f2",
      match: "rgba(64, 120, 242, 0.18)",
      matchActive: "#d0d8f0",
      matchActiveText: "#383a42",
    },
  },
  {
    id: "gruvbox-light",
    label: "Gruvbox Light",
    colors: {
      editorBg: "#fbf1c7",
      uiBg: "#f2e5bc",
      text: "#3c3836",
      key: "#427b58",
      string: "#79740e",
      number: "#8f3f71",
      boolean: "#af3a03",
      null: "#af3a03",
      punctuation: "#3c3836",
      muted: "#928374",
      border: "#e5d5a8",
      accent: "#076678",
      match: "rgba(7, 102, 120, 0.2)",
      matchActive: "#ebdbb2",
      matchActiveText: "#3c3836",
    },
  },
];

export const DEFAULT_THEME_ID = "darcula";

const SELECTED_KEY = "jpv-theme-id";
const LEGACY_KEY = "jpv-theme"; // compat: "dark" | "light" das versoes antigas

export function getThemeById(id: string): ThemeDef | undefined {
  return THEMES.find((t) => t.id === id);
}

/** Le o id do tema selecionado (com compatibilidade com a versao antiga). */
export function readSelectedThemeId(): string {
  try {
    const id = localStorage.getItem(SELECTED_KEY);
    if (id) return id;
    // Compatibilidade: converte o antigo "dark"/"light".
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy === "light") return "intellij-light";
    if (legacy === "dark") return "darcula";
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME_ID;
}

export function storeSelectedThemeId(id: string): void {
  try {
    localStorage.setItem(SELECTED_KEY, id);
  } catch {
    /* ignore */
  }
}

/** Mapeia ThemeColors -> nomes das CSS custom properties. */
const VAR_MAP: Record<keyof ThemeColors, string> = {
  editorBg: "--jpv-editor-bg",
  uiBg: "--jpv-ui-bg",
  text: "--jpv-text",
  key: "--jpv-key",
  string: "--jpv-string",
  number: "--jpv-number",
  boolean: "--jpv-boolean",
  null: "--jpv-null",
  punctuation: "--jpv-punct",
  muted: "--jpv-muted",
  border: "--jpv-border",
  accent: "--jpv-accent",
  match: "--jpv-match",
  matchActive: "--jpv-match-active",
  matchActiveText: "--jpv-match-active-text",
};

/** Converte "#rrggbb" em "rgba(r,g,b,alpha)". Se nao for hex, retorna a cor. */
function withAlpha(color: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return color;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** True se a cor de fundo e escura (para ajustar a visibilidade das guias). */
function isDarkBg(color: string): boolean {
  const m = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return true;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  // Luminancia relativa aproximada.
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.5;
}

/** Aplica um conjunto de cores ao container via CSS custom properties. */
export function applyColors(container: HTMLElement, colors: ThemeColors): void {
  for (const k of Object.keys(VAR_MAP) as (keyof ThemeColors)[]) {
    container.style.setProperty(VAR_MAP[k], colors[k]);
  }
  // Derivados usados pela UI (input e botoes) a partir das cores base.
  container.style.setProperty("--jpv-input-bg", colors.editorBg);
  container.style.setProperty("--jpv-input-border", colors.border);
  container.style.setProperty("--jpv-btn-bg", colors.uiBg);
  container.style.setProperty("--jpv-btn-bg-hover", colors.border);
  container.style.setProperty("--jpv-btn-border", colors.border);
  // Linha-guia de indentacao: cor "muted" translucida. Nos temas escuros usa
  // uma opacidade um pouco maior (mais clara/visivel); nos claros, mais suave.
  const guideAlpha = isDarkBg(colors.editorBg) ? 0.6 : 0.4;
  container.style.setProperty("--jpv-guide", withAlpha(colors.muted, guideAlpha));
}
