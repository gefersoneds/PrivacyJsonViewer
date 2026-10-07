/**
 * Renderiza um valor JSON como uma arvore interativa:
 *  - pretty-print com indentacao
 *  - highlight por tipo (chave, string, numero, boolean, null)
 *  - objetos e arrays recolhiveis
 *  - cada no guarda seu caminho absoluto (dataset.path) para a busca
 */

import { formatPath, type NodePath, type PathSegment } from "./path.js";

export interface JsonNodeRef {
  /** Elemento .jpv-row correspondente a esta chave/valor. */
  row: HTMLElement;
  /** Caminho absoluto ate este no. */
  path: NodePath;
  /** Texto da chave (ou indice) e do valor, para busca simples. */
  keyText: string;
  valueText: string;
  /** Elementos que contem o texto (para aplicar highlight de match). */
  keyEl: HTMLElement | null;
  valueEl: HTMLElement | null;
  /** Container recolhivel (quando o valor e objeto/array). */
  toggle: HTMLElement | null;
  children: HTMLElement | null;
}

export interface RenderResult {
  root: HTMLElement;
  /** Todos os nos indexados, na ordem de aparicao. */
  nodes: JsonNodeRef[];
  /**
   * Mapeia cada .jpv-row (par chave/valor) ao seu valor JSON original,
   * permitindo copiar o bloco completo mesmo quando recolhido.
   */
  valueByRow: WeakMap<HTMLElement, JsonValue>;
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

function el(tag: string, className?: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function valueKind(value: JsonValue): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

/**
 * Classifica um valor em um tipo "especifico" exibido no modo Tipos.
 * JSON nao distingue int/double; quando o parse ja perdeu a informacao
 * (ex.: "10.0" vira 10), nao da para afirmar que era double. Entao:
 *  - number com fracao ou expoente (certeza de real) -> "double"
 *  - demais numeros (inteiros ambiguos)              -> "number" (neutro)
 * Os demais tipos (string, boolean, null) seguem como estao.
 */
function specificType(value: JsonValue): string {
  if (typeof value !== "number") return valueKind(value);
  if (!Number.isFinite(value)) return "number";
  // So rotula "double" quando ha sinal inequivoco de ponto flutuante.
  return Number.isInteger(value) ? "number" : "double";
}

function renderPrimitive(value: JsonValue): HTMLElement {
  const kind = valueKind(value);
  // A classe define a COR (highlight por categoria); o data-type define o
  // rotulo EXIBIDO no modo Tipos, que para numeros e mais especifico.
  const span = el("span", `jpv-value jpv-${kind}`);
  span.dataset.type = specificType(value); // usado pelo modo "mostrar tipos"
  if (kind === "string") {
    span.textContent = JSON.stringify(value);
  } else {
    span.textContent = String(value);
  }
  return span;
}

export function renderJson(data: JsonValue): RenderResult {
  const nodes: JsonNodeRef[] = [];
  const valueByRow = new WeakMap<HTMLElement, JsonValue>();
  // collapse(bool) de cada linha de container, para o pai controlar os filhos.
  const collapseByRow = new WeakMap<HTMLElement, (collapsed: boolean) => void>();
  const root = el("div", "jpv-tree");

  /**
   * Renderiza uma entrada (par chave/valor) e seus filhos recursivamente.
   * `keyLabel` e o rotulo exibido; o segmento real do path ja vem
   * embutido em `path` (ultima posicao).
   */
  function build(
    parent: HTMLElement,
    keyLabel: string | null,
    value: JsonValue,
    path: NodePath,
  ): void {
    const row = el("div", "jpv-row");
    const kind = valueKind(value);
    const isContainer = kind === "object" || kind === "array";

    let keyEl: HTMLElement | null = null;
    let toggle: HTMLElement | null = null;
    let childrenEl: HTMLElement | null = null;

    if (isContainer) {
      toggle = el("span", "jpv-toggle", "\u25be"); // seta para baixo
      row.appendChild(toggle);
    } else {
      row.appendChild(el("span", "jpv-toggle jpv-toggle-empty", ""));
    }

    if (keyLabel !== null) {
      keyEl = el("span", "jpv-key", keyLabel);
      row.appendChild(keyEl);
      row.appendChild(el("span", "jpv-colon", ": "));
    }

    let valueEl: HTMLElement | null = null;

    if (isContainer) {
      const entries: [PathSegment, JsonValue, string][] =
        kind === "array"
          ? (value as JsonValue[]).map((v, idx) => [idx, v, String(idx)])
          : Object.entries(value as Record<string, JsonValue>).map(
              ([k, v]) => [k, v, k],
            );

      const openBracket = kind === "array" ? "[" : "{";
      const closeBracket = kind === "array" ? "]" : "}";

      const preview = el(
        "span",
        "jpv-preview",
        `${openBracket} ${entries.length} ${
          entries.length === 1 ? "item" : "itens"
        } ${closeBracket}`,
      );
      preview.style.display = "none";

      row.appendChild(el("span", "jpv-bracket", openBracket));
      row.appendChild(preview);

      childrenEl = el("div", "jpv-children");
      for (const [seg, childValue, label] of entries) {
        // Itens de array nao exibem rotulo (sem "0:", "1:"), ficando como JSON
        // puro. O indice segue no path para a busca (avalistas[0].campo).
        const childLabel = kind === "array" ? null : label;
        build(childrenEl, childLabel, childValue, [...path, seg]);
      }

      const closing = el("div", "jpv-row jpv-closing");
      closing.appendChild(el("span", "jpv-bracket", closeBracket));

      parent.appendChild(row);
      parent.appendChild(childrenEl);
      parent.appendChild(closing);

      const collapse = (collapsed: boolean) => {
        childrenEl!.style.display = collapsed ? "none" : "";
        closing.style.display = collapsed ? "none" : "";
        preview.style.display = collapsed ? "" : "none";
        toggle!.textContent = collapsed ? "\u25b8" : "\u25be"; // seta direita / baixo
        row.classList.toggle("jpv-collapsed", collapsed);
      };
      const toggleCollapsed = () =>
        collapse(!row.classList.contains("jpv-collapsed"));

      toggle!.addEventListener("click", toggleCollapsed);
      preview.addEventListener("click", () => collapse(false));
      collapseByRow.set(row, collapse);

      // Clicar na chave (ex.: "telefones") tambem expande/recolhe.
      if (keyEl) {
        keyEl.classList.add("jpv-key-toggle");
        keyEl.addEventListener("click", toggleCollapsed);
      }

      // Botao "expandir/recolher todos os filhos" (chevrons duplos), visivel
      // no hover, apenas quando ha filhos que tambem sao containers.
      const childContainerRows = () =>
        Array.from(
          childrenEl!.querySelectorAll<HTMLElement>(":scope > .jpv-row"),
        ).filter((r) => collapseByRow.has(r));

      if (childContainerRows().length > 0) {
        const bulk = el("span", "jpv-bulk", "\u23f7\u23f7"); // ⏷⏷
        bulk.title = "Expandir/recolher todos os itens";
        row.appendChild(bulk);

        const applyBulk = (e: Event) => {
          e.stopPropagation();
          const rows = childContainerRows();
          // Se a maioria esta recolhida, expande todos; senao, recolhe todos.
          const collapsedCount = rows.filter((r) =>
            r.classList.contains("jpv-collapsed"),
          ).length;
          const shouldCollapse = collapsedCount <= rows.length / 2;
          for (const r of rows) collapseByRow.get(r)!(shouldCollapse);
          // Garante que o proprio container esteja aberto para ver o efeito.
          if (row.classList.contains("jpv-collapsed")) collapse(false);
          bulk.textContent = shouldCollapse ? "\u23f5\u23f5" : "\u23f7\u23f7"; // ⏵⏵ / ⏷⏷
        };
        bulk.addEventListener("click", applyBulk);
      }
    } else {
      valueEl = renderPrimitive(value);
      row.appendChild(valueEl);
      parent.appendChild(row);
    }

    nodes.push({
      row,
      path,
      keyText: keyLabel ?? "",
      valueText: valueEl ? valueEl.textContent ?? "" : "",
      keyEl,
      valueEl,
      toggle,
      children: childrenEl,
    });

    valueByRow.set(row, value);
    row.dataset.path = formatPath(path);
  }

  build(root, null, data, []);
  return { root, nodes, valueByRow };
}
