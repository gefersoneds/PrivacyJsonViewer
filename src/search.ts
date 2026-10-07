/**
 * Mecanismo de busca sobre a arvore renderizada.
 *
 * Duas modalidades:
 *  1. Busca por caminho (path): quando o texto contem "." ou "[",
 *     ex.: "proponente.cidade" ou "telefone[0].numero".
 *     Faz match de sufixo em qualquer profundidade (via pathMatchesSuffix),
 *     encontrando exatamente o campo daquele caminho, mesmo que a chave
 *     apareca em outros ramos.
 *  2. Busca simples (fallback): quando nao parece um caminho,
 *     procura o texto em chaves e valores (case-insensitive).
 */

import { parsePathQuery, pathMatchesSuffix } from "./path.js";
import type { JsonNodeRef } from "./viewer.js";

export interface SearchController {
  /** Executa a busca e retorna a quantidade de resultados. */
  run(query: string): number;
  /** Move para o proximo resultado. */
  next(): void;
  /** Move para o resultado anterior. */
  prev(): void;
  /** Indice atual (1-based) ou 0 se nao ha resultados. */
  current(): number;
  /** Total de resultados. */
  total(): number;
  /** Limpa highlights e estado. */
  clear(): void;
}

const MATCH_CLASS = "jpv-match";
const ACTIVE_CLASS = "jpv-match-active";

export function createSearchController(nodes: JsonNodeRef[]): SearchController {
  let matches: JsonNodeRef[] = [];
  let activeIndex = -1;

  function clearHighlights(): void {
    for (const node of nodes) {
      node.row.classList.remove(MATCH_CLASS, ACTIVE_CLASS);
    }
  }

  /** Expande todos os ancestrais colapsados de uma row para torna-la visivel. */
  function revealRow(target: HTMLElement): void {
    let container: HTMLElement | null = target.parentElement;
    while (container) {
      if (container.classList.contains("jpv-children")) {
        // A row do container e o irmao anterior imediato.
        const parentRow = container.previousElementSibling as HTMLElement | null;
        if (parentRow && parentRow.classList.contains("jpv-collapsed")) {
          const toggle = parentRow.querySelector<HTMLElement>(".jpv-toggle");
          toggle?.click();
        }
      }
      container = container.parentElement;
    }
  }

  function setActive(index: number): void {
    if (matches.length === 0) return;
    if (activeIndex >= 0 && matches[activeIndex]) {
      matches[activeIndex].row.classList.remove(ACTIVE_CLASS);
    }
    activeIndex = (index + matches.length) % matches.length;
    const node = matches[activeIndex];
    node.row.classList.add(ACTIVE_CLASS);
    revealRow(node.row);
    node.row.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  function run(query: string): number {
    clearHighlights();
    matches = [];
    activeIndex = -1;

    const trimmed = query.trim();
    if (trimmed === "") return 0;

    const pathQuery = parsePathQuery(trimmed);

    if (pathQuery) {
      for (const node of nodes) {
        if (pathMatchesSuffix(pathQuery, node.path)) {
          matches.push(node);
        }
      }
    } else {
      const needle = trimmed.toLowerCase();
      for (const node of nodes) {
        const inKey = node.keyText.toLowerCase().includes(needle);
        const inValue = node.valueText.toLowerCase().includes(needle);
        if (inKey || inValue) matches.push(node);
      }
    }

    for (const node of matches) {
      node.row.classList.add(MATCH_CLASS);
    }

    if (matches.length > 0) setActive(0);
    return matches.length;
  }

  return {
    run,
    next: () => setActive(activeIndex + 1),
    prev: () => setActive(activeIndex - 1),
    current: () => (matches.length === 0 ? 0 : activeIndex + 1),
    total: () => matches.length,
    clear: () => {
      clearHighlights();
      matches = [];
      activeIndex = -1;
    },
  };
}
