/**
 * Copia que se comporta como se o JSON real (com aspas, virgulas, chaves e
 * colchetes) estivesse por tras da tela, e a selecao do mouse recortasse esse
 * JSON real.
 *
 * Abordagem robusta: cada .jpv-row guarda seu valor JSON original (valueByRow).
 * Quando a selecao abrange nos da arvore, reconstruimos o JSON desses nos com
 * JSON.stringify (aspas, virgulas, aninhamento corretos) e, nas pontas, se a
 * selecao cortou uma linha simples no meio, truncamos para refletir o recorte.
 *
 * Quando a selecao e apenas texto solto (uma palavra, parte de um valor numa
 * unica linha), deixamos a copia nativa do navegador, fiel ao selecionado.
 */

import type { JsonValue } from "./viewer.js";

/** Serializa com indentacao de 2 espacos (formato JSON padrao). */
function serialize(value: JsonValue): string {
  return JSON.stringify(value, null, 2);
}

/** Extrai o texto da chave de uma linha (sem os dois-pontos). */
function keyOf(row: HTMLElement): string | null {
  const keyEl = row.querySelector<HTMLElement>(":scope > .jpv-key");
  return keyEl ? keyEl.textContent : null;
}

/** Linha e um container (objeto/array)? (tem toggle, nao e valor simples) */
function isContainerRow(row: HTMLElement): boolean {
  return row.querySelector(":scope > .jpv-children, :scope > .jpv-preview") !==
    null || row.querySelector(":scope > .jpv-bracket") !== null;
}

/**
 * Retorna, na ordem do documento, as linhas "raiz" da selecao: linhas tocadas
 * pela selecao cujo ancestral .jpv-row NAO esta tambem na selecao. Assim, ao
 * selecionar um pai e seus filhos, serializamos so o pai (uma vez).
 */
function selectionRoots(range: Range, root: HTMLElement): HTMLElement[] {
  const allRows = Array.from(
    root.querySelectorAll<HTMLElement>(".jpv-row"),
  ).filter((r) => !r.classList.contains("jpv-closing"));

  const inSel = allRows.filter(
    (r) => r.offsetParent !== null && range.intersectsNode(r),
  );
  if (inSel.length === 0) return [];

  const set = new Set(inSel);

  // No DOM, os filhos de um container ficam num <div.jpv-children> que e IRMAO
  // da row do container (nao filho dela). Entao, para saber se uma row e
  // descendente de outra tambem selecionada, subimos pelos .jpv-children e,
  // em cada um, verificamos o "dono" = a row imediatamente anterior (irmao).
  const isDescendantOfSelected = (row: HTMLElement): boolean => {
    let el: HTMLElement | null = row.parentElement;
    while (el && el !== root) {
      if (el.classList.contains("jpv-children")) {
        const owner = el.previousElementSibling;
        if (
          owner instanceof HTMLElement &&
          owner.classList.contains("jpv-row") &&
          set.has(owner)
        ) {
          return true;
        }
      }
      el = el.parentElement;
    }
    return false;
  };

  return inSel.filter((row) => !isDescendantOfSelected(row));
}

/** Texto selecionado de uma unica row (intersecao do range com a row). */
function selectedTextOfRow(range: Range, row: HTMLElement): string {
  const r = range.cloneRange();
  const rowRange = document.createRange();
  rowRange.selectNodeContents(row);
  if (r.compareBoundaryPoints(Range.START_TO_START, rowRange) < 0) {
    r.setStart(rowRange.startContainer, rowRange.startOffset);
  }
  if (r.compareBoundaryPoints(Range.END_TO_END, rowRange) > 0) {
    r.setEnd(rowRange.endContainer, rowRange.endOffset);
  }
  return r.toString();
}

/**
 * Recorte de uma linha de campo SIMPLES como se o JSON real estivesse por tras.
 *
 * `visible` e o texto da linha como aparece na tela, SEM indentacao: ex.
 * `email: "alefersilva58@gmail.com"` (a string ja vem com aspas na tela).
 * `key` e o nome da chave. `selected` e o trecho que a selecao cobriu (trim).
 *
 * O JSON canonico da linha e `"<key>": <restante>`, ou seja, visible + 2 aspas
 * ao redor do nome da chave. Mapeamos o inicio/fim do `selected` (posicoes no
 * texto visivel) para o canonico e devolvemos o recorte. Se a selecao cobre a
 * linha inteira, devolve o canonico completo.
 */
function clipFieldLine(
  visible: string,
  key: string,
  selected: string,
  isSingle: boolean,
): string | null {
  if (selected === "") return null;
  const startVis = visible.indexOf(selected);
  if (startVis < 0) return null; // selecao nao e um trecho contiguo do visivel
  const endVis = startVis + selected.length;

  const keyLen = key.length; // nome da chave no visivel ocupa [0, keyLen)

  // Selecao inteiramente DENTRO da chave (nao alcanca o ": " nem o valor):
  //  - selecao de UMA linha so (isSingle): o usuario quer so a palavra, sem
  //    aspas (ex.: selecionar "email" -> "email"; "mail" -> "mail").
  //  - borda de uma selecao MULTI-LINHA comecando no meio da palavra: tambem
  //    e so o pedaco, sem aspas.
  //  - borda multi-linha comecando no INICIO da linha (startVis === 0): a aspa
  //    de abertura foi coberta e deve aparecer (ex.: "dataConsul).
  if (endVis <= keyLen && (isSingle || startVis > 0)) return selected;

  // Mapeia uma posicao do texto visivel para o canonico ("<key>" tem +1 antes
  // do nome e +1 depois). start: incluimos a aspa de abertura so se o corte
  // esta no inicio da chave (pos 0). end: incluimos a aspa de fechamento se o
  // corte passou do fim da chave.
  const mapStart = (v: number): number => {
    if (v === 0) return 0; // comeca na aspa de abertura
    if (v <= keyLen) return v + 1; // dentro da chave: pula a aspa de abertura
    return v + 2; // depois da chave: pulou as duas aspas
  };
  const mapEnd = (v: number): number => {
    if (v <= keyLen) return v + 1; // fim dentro/na borda da chave: +aspa aber.
    return v + 2; // fim depois da chave: +as duas aspas
  };

  // Canonico completo.
  const canonical = `"${key}"${visible.slice(keyLen)}`;
  const from = mapStart(startVis);
  const to = mapEnd(endVis);
  return canonical.slice(from, to);
}

/**
 * Instala o interceptador de copia. Retorna uma funcao para remove-lo.
 */
export function installCopyHandler(
  root: HTMLElement,
  valueByRow: WeakMap<HTMLElement, JsonValue>,
): () => void {
  const onCopy = (event: ClipboardEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }
    const range = selection.getRangeAt(0);
    if (!range.intersectsNode(root)) return;

    const roots = selectionRoots(range, root);
    if (roots.length === 0) return;

    // Selecao de UMA unica linha, contida apenas no texto da CHAVE
    // (ex.: duplo-clique no nome de um objeto/array): copia so a palavra, nao o
    // bloco. Vale tanto para campos simples quanto para containers.
    if (roots.length === 1) {
      const keyEl = roots[0].querySelector<HTMLElement>(":scope > .jpv-key");
      if (keyEl) {
        const keyText = keyEl.textContent ?? "";
        const keyRange = document.createRange();
        keyRange.selectNodeContents(keyEl);
        // A selecao esta inteiramente dentro do elemento da chave?
        const withinKey =
          range.compareBoundaryPoints(Range.START_TO_START, keyRange) >= 0 &&
          range.compareBoundaryPoints(Range.END_TO_END, keyRange) <= 0;
        if (withinKey) {
          const sel = selectedTextOfRow(range, roots[0]).trim();
          if (sel !== "" && keyText.includes(sel)) {
            event.clipboardData?.setData("text/plain", sel);
            event.preventDefault();
            return;
          }
        }
      }
    }

    const lastIdx = roots.length - 1;

    // Monta cada no raiz. Para campos SIMPLES nas PONTAS da selecao (primeira e
    // ultima linha), aplica o recorte do "JSON virtual" refletindo o quanto a
    // selecao cobriu. Containers e o miolo usam o JSON completo (JSON.stringify).
    const parts: string[] = [];
    for (let i = 0; i < roots.length; i++) {
      const row = roots[i];
      const isEdge = i === 0 || i === lastIdx;
      const key = keyOf(row);

      if (isEdge && !isContainerRow(row) && key !== null) {
        const visible = (row.textContent ?? "").trim();
        const sel = selectedTextOfRow(range, row).trim();
        if (sel !== "" && sel !== visible) {
          const clipped = clipFieldLine(visible, key, sel, roots.length === 1);
          if (clipped !== null) {
            parts.push(clipped);
            continue;
          }
        }
      }

      if (!valueByRow.has(row)) continue;
      const value = valueByRow.get(row) as JsonValue;
      const serialized = serialize(value);
      parts.push(key === null ? serialized : `"${key}": ${serialized}`);
    }
    if (parts.length === 0) return;

    const output = parts.length === 1 ? parts[0] : parts.join(",\n");
    event.clipboardData?.setData("text/plain", output);
    event.preventDefault();
  };

  document.addEventListener("copy", onCopy);
  return () => document.removeEventListener("copy", onCopy);
}
