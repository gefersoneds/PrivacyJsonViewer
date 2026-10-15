# JSON Path Viewer

Extensão de navegador (Chrome e Firefox, Manifest V3) que exibe documentos JSON
de forma legível — pretty-print, realce por tipo e nós recolhíveis — com um
diferencial: **busca por caminho (path)**.

## O diferencial: busca por caminho

Além da busca simples por texto, você pode qualificar o caminho de um campo:

- `proponente.cidade` → encontra o campo `cidade` que está dentro de
  `proponente`, ignorando o `cidade` de `avalista`.
- `proponente.endereco.telefone[0].numero` → navega objeto → objeto → array
  (índice 0) → objeto → chave `numero`.

Regras:

- Match em **qualquer profundidade** (match de sufixo). `proponente.cidade`
  também encontra `dados.cliente.proponente.cidade`.
- Índices de array com `[n]`. Chaves com ponto no nome podem usar `['a.b']`.
- **Sem curingas** (por decisão de escopo).
- Se o texto digitado não parecer um caminho (sem `.` nem `[]`), a busca cai no
  modo simples: procura o termo em chaves e valores.

Use Enter / Shift+Enter (ou as setas da barra) para pular entre os resultados.
Os pais colapsados de um resultado são expandidos automaticamente.

## Temas

A barra tem um seletor com vários temas claros e escuros, inspirados em paletas
comuns de IDEs e editores. A escolha é persistida em `localStorage`.

## Estrutura

- `src/path.ts` — parser de caminho e matcher de sufixo.
- `src/viewer.ts` — renderiza a árvore JSON, atribuindo o path absoluto a cada nó.
- `src/search.ts` — busca (path + fallback), navegação e highlight.
- `src/content.ts` — content script: detecta JSON e monta a UI.
- `src/viewer.css` — estilos.
- `src/manifest.base.json` — manifest base (o de cada navegador é gerado no build).

## Build

Requer Node.js.

```
npm install
npm run build:chrome    # gera dist/chrome
npm run build:firefox   # gera dist/firefox
npm run typecheck       # checagem de tipos
```

## Como carregar

**Chrome:** `chrome://extensions` → ativar "Modo do desenvolvedor" →
"Carregar sem compactação" → selecionar a pasta `dist/chrome`.

**Firefox:** `about:debugging#/runtime/this-firefox` → "Carregar extensão
temporária" → selecionar o arquivo `dist/firefox/manifest.json`.

Depois abra qualquer URL que retorne JSON puro.

> Ícones são opcionais. Para publicar nas lojas, adicione `icons` ao
> `manifest.base.json` e os arquivos correspondentes.
