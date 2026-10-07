/**
 * Minimapa esquematico (estilo VS Code) desenhado em <canvas>.
 *
 * Em vez de miniaturizar o texto (pesado), desenha uma barrinha por linha
 * visivel: o recuo horizontal reflete a profundidade e a cor reflete o tipo
 * (chave, string, numero, etc.), usando as cores do tema atual. Um retangulo
 * translucido marca a parte visivel (viewport); clicar ou arrastar rola a
 * pagina ate o ponto correspondente.
 *
 * So aparece quando ha rolagem vertical (conteudo maior que a tela).
 */

import type { JsonNodeRef } from "./viewer.js";

const WIDTH = 72; // largura do minimapa em px (estreito)
const MAX_BARS = 4000; // limite de barras desenhadas (amostragem acima disso)

interface Bar {
  top: number; // posicao vertical relativa ao topo do documento (px)
  depth: number; // profundidade (para o recuo)
  colorVar: string; // CSS var da cor
}

export interface Minimap {
  refresh(): void;
  destroy(): void;
}

export function installMinimap(
  container: HTMLElement,
  nodes: JsonNodeRef[],
): Minimap {
  const canvas = document.createElement("canvas");
  canvas.className = "jpv-minimap";
  container.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  let bars: Bar[] = [];
  let maxDepth = 1;
  let docHeight = 1;
  let raf = 0;

  const cssVar = (name: string) =>
    getComputedStyle(container).getPropertyValue(name).trim() || "#888";

  const colorForRow = (row: HTMLElement): string => {
    if (row.querySelector(":scope > .jpv-string")) return "--jpv-string";
    if (row.querySelector(":scope > .jpv-number")) return "--jpv-number";
    if (row.querySelector(":scope > .jpv-boolean")) return "--jpv-boolean";
    if (row.querySelector(":scope > .jpv-null")) return "--jpv-null";
    if (row.querySelector(":scope > .jpv-key")) return "--jpv-key";
    return "--jpv-punct";
  };

  const collectBars = () => {
    bars = [];
    maxDepth = 1;
    for (const node of nodes) {
      const row = node.row;
      // Ignora linhas ocultas (dentro de blocos recolhidos).
      if (row.offsetParent === null) continue;
      const depth = Math.max(0, node.path.length - 1);
      if (depth > maxDepth) maxDepth = depth;
      bars.push({
        top: row.offsetTop,
        depth,
        colorVar: colorForRow(row),
      });
    }
    docHeight =
      document.documentElement.scrollHeight || window.innerHeight || 1;
  };

  const toolbarHeight = (): number => {
    const bar = container.querySelector<HTMLElement>(".jpv-toolbar");
    return bar ? bar.offsetHeight : 0;
  };

  const draw = () => {
    if (!ctx) return;
    const viewportH = window.innerHeight;
    const needsScroll = docHeight > viewportH + 4;
    canvas.style.display = needsScroll ? "block" : "none";
    if (!needsScroll) return;

    const tbH = toolbarHeight();
    const h = Math.max(1, viewportH - tbH); // area util (abaixo da toolbar)
    canvas.style.top = `${tbH}px`;

    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${h}px`;
    canvas.width = Math.round(WIDTH * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, WIDTH, h);

    const scale = h / docHeight; // px do doc -> px do minimapa
    const barH = Math.max(1, Math.min(3, scale * 16));
    const indentStep = (WIDTH - 16) / (maxDepth + 1);

    // Amostragem se houver barras demais.
    const step = bars.length > MAX_BARS ? Math.ceil(bars.length / MAX_BARS) : 1;

    // pre-resolve as cores usadas
    const cache: Record<string, string> = {};
    const resolve = (v: string) => {
      if (cache[v] === undefined) cache[v] = cssVar(v);
      return cache[v];
    };

    ctx.globalAlpha = 0.55;
    for (let i = 0; i < bars.length; i += step) {
      const b = bars[i];
      const y = b.top * scale;
      const x = 6 + b.depth * indentStep;
      const w = Math.max(6, (WIDTH - 12 - b.depth * indentStep) * 0.7);
      ctx.fillStyle = resolve(b.colorVar);
      ctx.fillRect(x, y, w, barH);
    }
    ctx.globalAlpha = 1;

    // Retangulo da viewport.
    const vpY = window.scrollY * scale;
    const vpH = viewportH * scale;
    ctx.fillStyle = resolve("--jpv-accent");
    ctx.globalAlpha = 0.18;
    ctx.fillRect(0, vpY, WIDTH, vpH);
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = resolve("--jpv-accent");
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, vpY + 0.5, WIDTH - 1, Math.max(2, vpH - 1));
    ctx.globalAlpha = 1;
  };

  const scheduleDraw = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      draw();
    });
  };

  const refresh = () => {
    collectBars();
    scheduleDraw();
  };

  // ----- Navegacao por clique/arraste -----
  const scrollToClientY = (clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    const ratio = (clientY - rect.top) / rect.height;
    const target = ratio * docHeight - window.innerHeight / 2;
    window.scrollTo({ top: Math.max(0, target), behavior: "auto" });
  };

  let dragging = false;
  const onDown = (e: MouseEvent) => {
    dragging = true;
    scrollToClientY(e.clientY);
    e.preventDefault();
  };
  const onMove = (e: MouseEvent) => {
    if (dragging) scrollToClientY(e.clientY);
  };
  const onUp = () => {
    dragging = false;
  };

  canvas.addEventListener("mousedown", onDown);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);

  const onScroll = () => scheduleDraw();
  const onResize = () => refresh();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);

  // Primeira renderizacao (apos layout).
  refresh();
  requestAnimationFrame(refresh);

  return {
    refresh,
    destroy() {
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      canvas.remove();
    },
  };
}
