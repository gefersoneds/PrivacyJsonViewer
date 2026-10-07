/**
 * Content script: detecta quando a pagina atual e um documento JSON puro
 * e substitui o conteudo por uma visualizacao interativa com busca por caminho.
 *
 * Estrategia de deteccao (sem depender de content-type, que o content script
 * nao acessa diretamente):
 *  - a pagina foi servida como texto cru dentro de um unico <pre> (comportamento
 *    padrao dos navegadores para application/json), ou o body inteiro e um texto
 *    que faz parse como JSON valido.
 */

import { renderJson } from "./viewer.js";
import { createSearchController } from "./search.js";
import { installCopyHandler } from "./copy.js";
import { installPathTooltip } from "./tooltip.js";
import { installThemeUI } from "./theme-ui.js";
import { installMinimap } from "./minimap.js";

/**
 * Tenta extrair o texto cru do JSON diretamente do DOM que o navegador montou.
 * Cobre os casos em que Chrome/Firefox exibem o JSON como texto num <pre>.
 */
function getRawJsonText(): string | null {
  const body = document.body;
  if (!body) return null;

  // Caso classico: JSON exibido dentro de um <pre> (Firefox e Chrome).
  const pres = body.querySelectorAll("pre");
  if (pres.length === 1) {
    const txt = pres[0].textContent;
    if (txt && txt.trim() !== "") return txt;
  }

  // Body praticamente sem elementos: usa o texto direto.
  if (body.children.length === 0) {
    return body.textContent;
  }

  // Ultimo recurso: se o body inteiro, como texto, parsear como JSON.
  const whole = body.innerText ?? body.textContent;
  return whole;
}

function tryParseJson(text: string): unknown | undefined {
  const trimmed = text.trim();
  if (trimmed === "") return undefined;
  const first = trimmed[0];
  // Evita parsear paginas HTML comuns; JSON top-level util comeca com { [ " ou digito.
  if (!/[\[{"\-\d]/.test(first) && !/^(true|false|null)$/.test(trimmed)) {
    return undefined;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}

function buildToolbar(
  onSearch: (q: string) => void,
  onNext: () => void,
  onPrev: () => void,
  onExpandAll: () => void,
  onCollapseAll: () => void,
  onToggleTypes: (active: boolean) => void,
  themeControl: HTMLElement,
) {
  const bar = document.createElement("div");
  bar.className = "jpv-toolbar";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "jpv-search-input";
  input.placeholder =
    "Buscar: objeto.campo | objeto..campo (.. = qualquer nivel) | texto";
  input.title =
    "'.' = filho direto (objeto.subobjeto.campo)\n" +
    "'..' = qualquer nivel abaixo (objeto..campo)\n" +
    "sem ponto = busca simples por texto";
  input.autocomplete = "off";
  input.spellcheck = false;

  const counter = document.createElement("span");
  counter.className = "jpv-counter";
  counter.textContent = "0 / 0";

  const prevBtn = document.createElement("button");
  prevBtn.className = "jpv-btn";
  prevBtn.textContent = "\u2191";
  prevBtn.title = "Resultado anterior";

  const nextBtn = document.createElement("button");
  nextBtn.className = "jpv-btn";
  nextBtn.textContent = "\u2193";
  nextBtn.title = "Proximo resultado";

  const expandBtn = document.createElement("button");
  expandBtn.className = "jpv-btn jpv-btn-text";
  expandBtn.textContent = "Expandir";

  const collapseBtn = document.createElement("button");
  collapseBtn.className = "jpv-btn jpv-btn-text";
  collapseBtn.textContent = "Recolher";

  const typesBtn = document.createElement("button");
  typesBtn.className = "jpv-btn jpv-btn-text";
  typesBtn.textContent = "Tipos";
  typesBtn.title = "Mostrar/ocultar o tipo de cada valor";

  bar.append(
    input,
    prevBtn,
    nextBtn,
    counter,
    expandBtn,
    collapseBtn,
    typesBtn,
    themeControl,
  );

  input.addEventListener("input", () => onSearch(input.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) onPrev();
      else onNext();
    }
  });
  prevBtn.addEventListener("click", onPrev);
  nextBtn.addEventListener("click", onNext);
  expandBtn.addEventListener("click", onExpandAll);
  collapseBtn.addEventListener("click", onCollapseAll);

  let typesActive = false;
  typesBtn.addEventListener("click", () => {
    typesActive = !typesActive;
    typesBtn.classList.toggle("jpv-btn-active", typesActive);
    onToggleTypes(typesActive);
  });

  return { bar, input, counter };
}

function mount(parsed: unknown): void {
  const { root, nodes, valueByRow } = renderJson(parsed as never);
  const search = createSearchController(nodes);
  installCopyHandler(root, valueByRow);

  const updateCounter = (counter: HTMLElement) => {
    counter.textContent = `${search.current()} / ${search.total()}`;
  };

  const setAllCollapsed = (collapsed: boolean) => {
    for (const node of nodes) {
      if (!node.toggle) continue;
      const isCollapsed = node.row.classList.contains("jpv-collapsed");
      if (isCollapsed !== collapsed) node.toggle.click();
    }
  };

  const container = document.createElement("div");
  container.className = "jpv-container";

  // Seletor de tema (presets + customizacao). Aplica o tema no container.
  const themeControl = installThemeUI(container);

  const { bar, input, counter } = buildToolbar(
    (q) => {
      search.run(q);
      updateCounter(counter);
    },
    () => {
      search.next();
      updateCounter(counter);
    },
    () => {
      search.prev();
      updateCounter(counter);
    },
    () => setAllCollapsed(false),
    () => setAllCollapsed(true),
    (active: boolean) => container.classList.toggle("jpv-show-types", active),
    themeControl,
  );

  container.append(bar, root);

  document.documentElement.classList.add("jpv-active");
  document.body.innerHTML = "";
  document.body.appendChild(container);

  // Instala o tooltip apos o container estar no DOM, anexando-o ao proprio
  // container para herdar as variaveis do tema (e nao ser removido ao limpar
  // o body). Antes era anexado ao body, o que quebrava no Firefox.
  installPathTooltip(root, container);

  // Minimapa esquematico (aparece so quando ha rolagem vertical).
  const minimap = installMinimap(container, nodes);

  // Recalcula o minimapa apos qualquer interacao que muda a altura da arvore
  // (expandir/recolher), com um pequeno atraso para o layout atualizar.
  let refreshTimer = 0;
  const scheduleMinimapRefresh = () => {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => minimap.refresh(), 30);
  };
  root.addEventListener("click", scheduleMinimapRefresh);
  // Tambem apos usar os botoes de expandir/recolher tudo da toolbar.
  bar.addEventListener("click", scheduleMinimapRefresh);

  // Ctrl+F (ou Cmd+F): em vez da busca nativa do navegador, foca a nossa barra
  // de busca e seleciona o texto atual (para digitar por cima).
  document.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && key === "f") {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });

  // Triplo-clique sobre um valor: seleciona o VALOR inteiro (todas as palavras).
  // Para strings, a selecao ja inclui as aspas, pois o .jpv-value as contem.
  root.addEventListener("click", (e) => {
    if (e.detail < 3) return; // so no triplo-clique
    const target = e.target as Element | null;
    const valueEl = target?.closest<HTMLElement>(".jpv-value");
    if (!valueEl || !root.contains(valueEl)) return;
    e.preventDefault();
    const sel = window.getSelection();
    if (!sel) return;
    const r = document.createRange();
    r.selectNodeContents(valueEl);
    sel.removeAllRanges();
    sel.addRange(r);
  });
}

/** Considera "renderizavel" apenas objetos e arrays. */
function mountIfObject(parsed: unknown): boolean {
  if (parsed === null || typeof parsed !== "object") return false;
  mount(parsed);
  return true;
}

/**
 * Tentativa 1: ler o texto que o navegador ja exibiu no DOM.
 * Funciona quando a pagina foi renderizada como texto/JSON puro.
 */
function tryFromDom(): boolean {
  const raw = getRawJsonText();
  if (raw === null) return false;
  const parsed = tryParseJson(raw);
  if (parsed === undefined) return false;
  return mountIfObject(parsed);
}

/**
 * Tentativa 2 (fallback): buscar a propria URL e confirmar via Content-Type
 * que a resposta e JSON. Cobre APIs que o navegador nao renderiza como texto
 * simples ou casos em que o DOM ficou diferente do esperado.
 */
async function tryFromFetch(): Promise<void> {
  // Evita paginas que sao claramente HTML (SPA, sites comuns).
  const ct0 = document.contentType?.toLowerCase() ?? "";
  const looksHtml = ct0.includes("text/html");
  if (looksHtml) return;

  try {
    const res = await fetch(location.href, {
      credentials: "include",
      headers: { Accept: "application/json, */*" },
    });
    const ct = (res.headers.get("content-type") ?? "").toLowerCase();
    const isJsonCt =
      ct.includes("application/json") || /application\/[\w.+-]*\+json/.test(ct);

    const text = await res.text();

    // Se o header diz JSON, confia; senao, tenta parsear mesmo assim.
    if (isJsonCt) {
      try {
        mountIfObject(JSON.parse(text));
        return;
      } catch {
        return;
      }
    }
    const parsed = tryParseJson(text);
    if (parsed !== undefined) mountIfObject(parsed);
  } catch {
    // fetch bloqueado (CORS/permissao) ou rede: desiste silenciosamente.
  }
}

function init(): void {
  // 1) tenta pelo DOM ja renderizado
  if (tryFromDom()) return;
  // 2) fallback: confirma pelo Content-Type via fetch
  void tryFromFetch();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
