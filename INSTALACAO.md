# JSON Path Viewer — Instalação (Firefox)

Extensão interna para visualizar JSON de forma legível, com busca por caminho.

## 1. Instalar a extensão

1. Baixe o arquivo `.xpi` que foi enviado.
2. No Firefox, abra `about:addons` (ou Menu ≡ → Extensões e temas).
3. Clique na engrenagem ⚙ no topo.
4. Escolha **"Instalar Complemento a partir de Arquivo..."**.
5. Selecione o arquivo `.xpi` e confirme.

## 2. Ativar (passo obrigatório, uma vez só)

O Firefox tem um visualizador de JSON próprio que precisa ser desligado para
esta extensão funcionar:

1. Abra `about:config` na barra de endereços.
2. Clique em "Aceitar o risco e continuar".
3. Pesquise por: `devtools.jsonview.enabled`
4. Dê um duplo clique no valor para deixá-lo em **false**.
5. Feche a aba. (Pode reabrir a URL de JSON.)

## 3. Usar

Abra qualquer URL que retorne JSON. A extensão formata automaticamente.

Na barra de busca no topo:
- `objeto.campo` — encontra o campo dentro daquele caminho.
- `objeto..campo` — encontra em qualquer nível abaixo (o `..` = qualquer profundidade).
- `lista.campo` — encontra em todos os itens de uma lista.
- Texto simples (sem ponto) — busca por qualquer chave ou valor.

Use Enter / Shift+Enter (ou as setas) para navegar entre os resultados.

Outros recursos:
- **Copiar caminho**: segure **Alt** e clique num campo para copiar o caminho
  completo dele (ex.: `<root>.data.proponente.endereco.cidade`).
- **Tipos**: o botão "Tipos" na barra mostra/oculta o tipo de cada valor
  (string, number, boolean, null).
- **Temas**: o seletor na barra tem vários temas de IDE (Darcula, Dracula,
  Monokai, Solarized, One Dark, etc.).
- **Minimapa**: em JSONs grandes, aparece à direita; clique ou arraste para
  navegar.
