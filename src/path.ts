/**
 * Utilitarios para trabalhar com "caminhos" (paths) dentro de um JSON.
 *
 * Um segmento do caminho de um NO pode ser:
 *  - uma chave de objeto (string), ex.: "proponente"
 *  - um indice de array (number), ex.: 0 em "telefone[0]"
 *
 * SINTAXE DE BUSCA POR CAMINHO
 * ----------------------------
 * A busca aceita a notacao com dois separadores:
 *
 *  "."  -> filho direto (consecutivo).
 *          proponente.atributos.pep  encontra pep filho direto de atributos,
 *          que e filho direto de proponente.
 *
 *  ".." -> descendente em qualquer nivel.
 *          proponente..pep  encontra qualquer pep em qualquer profundidade
 *          abaixo de proponente.
 *
 * Todo o padrao ainda casa em qualquer profundidade (match de sufixo): o
 * primeiro segmento nao precisa ser a raiz. E o ULTIMO segmento casa por
 * substring (parcial), entao "atributos.vlrSaldoDevedor" tambem encontra
 * "vlrSaldoDevedorCDC" e "vlrSaldoDevedorConsignado".
 *
 * ARRAYS: os indices sao transparentes para o "." Assim "avalistas.campo"
 * casa avalistas[0].campo, avalistas[1].campo, etc. (o indice e pulado).
 * Para um item especifico, use o indice explicito: "avalistas[0].campo".
 * Com ".." tambem casa nos descendentes de todos os itens da lista.
 *
 * Nao ha suporte a curingas (*) por decisao de escopo.
 */

export type PathSegment = string | number;

/** Um caminho absoluto de um no na arvore, ex.: ["proponente", "telefone", 0, "numero"]. */
export type NodePath = PathSegment[];

/** Como um segmento da BUSCA deve casar em relacao ao anterior. */
export type SegmentMode = "child" | "descendant";

/** Um segmento da BUSCA: o valor + o modo de casamento. */
export interface QuerySegment {
  value: PathSegment;
  mode: SegmentMode;
}

/** Padrao de busca por caminho ja parseado. */
export type PathQuery = QuerySegment[];

/**
 * Converte o texto digitado pelo usuario em um padrao de busca (PathQuery).
 *
 * Exemplos:
 *   "proponente.cidade"      -> [{cidade child após proponente child}]
 *   "proponente..pep"        -> [proponente(child), pep(descendant)]
 *   "telefone[0].numero"     -> [telefone, 0, numero] (todos child)
 *   "['chave.com.ponto']"    -> [chave.com.ponto]
 *
 * Retorna null quando a string nao representa um caminho valido
 * (nesse caso o chamador deve cair na busca simples por texto).
 */
export function parsePathQuery(input: string): PathQuery | null {
  const query = input.trim();
  if (query === "") return null;

  // So faz sentido como busca estruturada se tiver "." ou "[".
  if (!/[.[]/.test(query)) return null;

  const segments: PathQuery = [];
  let i = 0;
  const len = query.length;
  // O modo a aplicar no PROXIMO segmento lido. O primeiro e sempre "child".
  let pendingMode: SegmentMode = "child";

  const pushSegment = (value: PathSegment) => {
    segments.push({ value, mode: pendingMode });
    pendingMode = "child";
  };

  while (i < len) {
    const ch = query[i];

    if (ch === ".") {
      // Conta a sequencia de pontos: 2+ => descendente.
      let dots = 0;
      while (i < len && query[i] === ".") {
        dots++;
        i++;
      }
      if (dots >= 2) pendingMode = "descendant";
      continue;
    }

    if (ch === "[") {
      const close = query.indexOf("]", i);
      if (close === -1) return null;
      const raw = query.slice(i + 1, close).trim();
      i = close + 1;

      // Indice numerico: [0]
      if (/^\d+$/.test(raw)) {
        pushSegment(Number.parseInt(raw, 10));
        continue;
      }
      // Chave entre aspas: ['algo'] ou ["algo"]
      const quoted = raw.match(/^(['"])(.*)\1$/);
      if (quoted) {
        pushSegment(quoted[2]);
        continue;
      }
      return null;
    }

    // Le uma chave "nua" ate o proximo separador.
    let key = "";
    while (i < len && query[i] !== "." && query[i] !== "[") {
      key += query[i];
      i++;
    }
    key = key.trim();
    if (key === "") return null;
    pushSegment(key);
  }

  return segments.length > 0 ? segments : null;
}

/** Compara dois segmentos de forma case-insensitive para strings (exato). */
function segmentsEqual(a: PathSegment, b: PathSegment): boolean {
  if (typeof a === "number" || typeof b === "number") {
    return a === b;
  }
  return a.toLowerCase() === b.toLowerCase();
}

/**
 * Match parcial (substring) para strings; exato para indices numericos.
 * Usado apenas no ultimo segmento da busca.
 */
function segmentMatchesPartial(query: PathSegment, target: PathSegment): boolean {
  if (typeof query === "number" || typeof target === "number") {
    return query === target;
  }
  return target.toLowerCase().includes(query.toLowerCase());
}

/** Aplica a regra de casamento de um segmento da busca contra um segmento real. */
function matchOne(seg: QuerySegment, target: PathSegment, isLast: boolean): boolean {
  return isLast
    ? segmentMatchesPartial(seg.value, target)
    : segmentsEqual(seg.value, target);
}

/**
 * Retorna true se o padrao `query` casa dentro de `nodePath`.
 *
 * Regras:
 *  - segmento "child": deve ocupar a posicao imediatamente seguinte a do
 *    segmento anterior (consecutivo);
 *  - segmento "descendant" (apos ".."): pode aparecer em qualquer posicao
 *    mais adiante (um ou mais niveis no meio);
 *  - o padrao inteiro deve terminar exatamente no fim de nodePath, de modo que
 *    o match aponte para o campo desejado;
 *  - o ultimo segmento casa por substring; os demais, exato.
 *
 * Implementado com backtracking (o padrao costuma ter poucos segmentos).
 */
export function pathMatchesSuffix(query: PathQuery, nodePath: NodePath): boolean {
  if (query.length === 0 || query.length > nodePath.length) return false;

  const lastQ = query.length - 1;

  // Indices de array sao "transparentes" para segmentos child que sao chaves de
  // texto: "avalistas.campo" pula o indice e casa avalistas.0.campo,
  // avalistas.1.campo, etc. Um segmento numerico explicito ([0]) nao pula.
  const isArrayIndex = (p: number) => typeof nodePath[p] === "number";

  const solve = (qi: number, pi: number): boolean => {
    if (qi === query.length) {
      // consumiu todo o padrao: so vale se tambem chegou ao fim do caminho.
      return pi === nodePath.length;
    }
    if (pi >= nodePath.length) return false;

    const seg = query[qi];
    const isLast = qi === lastQ;
    const segIsNumeric = typeof seg.value === "number";

    if (seg.mode === "child") {
      // Permite pular zero ou mais indices de array antes de casar,
      // exceto quando o proprio segmento da query e um indice explicito.
      let p = pi;
      if (!segIsNumeric) {
        while (p < nodePath.length && isArrayIndex(p) && !matchOne(seg, nodePath[p], isLast)) {
          p++;
        }
      }
      if (p >= nodePath.length) return false;
      if (!matchOne(seg, nodePath[p], isLast)) return false;
      return solve(qi + 1, p + 1);
    }

    // descendant: tenta casar este segmento em pi, pi+1, ...
    for (let p = pi; p < nodePath.length; p++) {
      if (matchOne(seg, nodePath[p], isLast) && solve(qi + 1, p + 1)) {
        return true;
      }
    }
    return false;
  };

  // O primeiro segmento pode comecar em qualquer posicao (match de sufixo /
  // qualquer profundidade), respeitando seu proprio modo.
  const first = query[0];
  const firstIsLast = lastQ === 0;
  for (let start = 0; start < nodePath.length; start++) {
    if (matchOne(first, nodePath[start], firstIsLast) && solve(1, start + 1)) {
      return true;
    }
  }
  return false;
}

/** Serializa um caminho para exibicao, ex.: proponente.telefone[0].numero */
export function formatPath(path: NodePath): string {
  let out = "";
  for (const seg of path) {
    if (typeof seg === "number") {
      out += `[${seg}]`;
    } else if (out === "") {
      out += seg;
    } else {
      out += `.${seg}`;
    }
  }
  return out;
}
