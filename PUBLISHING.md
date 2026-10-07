# Guia de publicação — JSON Path Viewer

Material e passo a passo para publicar a extensão na Chrome Web Store e no
Firefox Add-ons (AMO). Gere os pacotes com `npm run package` (arquivos em
`release/`).

---

## Textos prontos (para os formulários das lojas)

**Nome:** JSON Path Viewer

**Resumo (1 linha):** Visualize JSON no navegador com busca por caminho.

**Descrição:**

JSON Path Viewer formata automaticamente documentos JSON abertos no navegador:
identação, realce por tipo e nós recolhíveis. O diferencial é a busca por
caminho: digite `proponente.cidade` para encontrar exatamente o campo `cidade`
dentro de `proponente`, ignorando o mesmo nome em outros ramos. Também suporta
índices de array (`telefone[0].numero`) e casa em qualquer profundidade. Ao
copiar um bloco recolhido, o conteúdo completo em JSON válido vai para a área de
transferência. Inclui dois temas (escuro e claro).

**Categoria sugerida:** Ferramentas para desenvolvedores.

**Idioma principal:** Português (Brasil).

---

## Privacidade (importante para as duas lojas)

Esta extensão **não coleta, não transmite e não armazena dados do usuário em
servidores**. Todo processamento é local, no navegador. A única persistência é
a preferência de tema, guardada em `localStorage` no próprio dispositivo.

- Chrome: no painel de privacidade, marque que não há coleta de dados e
  justifique o uso da permissão de host (`<all_urls>`): necessária para
  detectar e renderizar respostas JSON em qualquer site que o usuário abrir.
- Firefox: pela política simplificada da Mozilla (2025), recursos locais e
  auto-evidentes têm consentimento implícito; ainda assim, descreva o uso.

Se preferir reduzir a permissão, veja a seção "Reduzir permissões" abaixo.

---

## Chrome Web Store

Requisitos confirmados na documentação oficial (Chrome for Developers):

- Conta de desenvolvedor: taxa **única de US$ 5**.
- **Ícone 128x128** (já incluído em `icons/icon128.png`).
- **Ao menos 1 screenshot 1280x800** (ou 640x400), até 5 no total.
- Pacote `.zip` do build (use `release/json-path-viewer-chrome-vX.Y.Z.zip`).

Passos:

1. Acesse o Chrome Web Store Developer Dashboard e pague a taxa única (uma vez
   por conta).
2. "New item" e envie o zip do Chrome.
3. Preencha a listagem: nome, descrição, categoria, idioma (textos acima).
4. Faça upload dos screenshots (1280x800). Dica: abra `exemplo.json` na
   extensão e capture a tela, nos dois temas.
5. Preencha o painel de privacidade (sem coleta de dados) e justifique
   `<all_urls>`.
6. Escolha a visibilidade: **Público**, **Não listado** (link direto) ou
   **Privado**. Para compartilhar só com o time, "Não listado" costuma bastar.
7. Envie para revisão (normalmente 1–3 dias úteis na primeira vez).

---

## Firefox Add-ons (AMO)

Requisitos confirmados (MDN / Extension Workshop):

- Toda extensão precisa ser **assinada pela Mozilla** para instalar no Firefox
  release/beta. A assinatura acontece na AMO, mesmo para distribuição própria.
- MV3 exige um **ID de extensão** — já configurado em
  `browser_specific_settings.gecko.id` (`json-path-viewer@conceito`).
- Conta na AMO é **gratuita**.
- Tamanho máximo do pacote: 200 MB (o nosso tem poucos KB).

Duas rotas de distribuição:

- **On this site (AMO):** publicado no catálogo público da Mozilla, passa por
  revisão.
- **On your own (autodistribuição):** a Mozilla apenas **assina** o `.xpi` e
  você distribui o arquivo. A assinatura costuma ser automática. Bom para uso
  interno/time.

Passos (autodistribuição, mais rápido para compartilhar):

1. Crie conta em addons.mozilla.org.
2. "Submit a New Add-on" e escolha **"On your own"**.
3. Envie `release/json-path-viewer-firefox-vX.Y.Z.zip`.
4. Baixe o `.xpi` assinado gerado pela Mozilla e compartilhe. Ele instala
   permanentemente (arrastar para o Firefox ou via "Instalar add-on a partir de
   arquivo").

> Sem assinatura, o Firefox só permite instalação **temporária** (some ao
> fechar) via `about:debugging`, ou instalação permanente apenas no Firefox
> Developer Edition/Nightly com `xpinstall.signatures.required=false`.

### Assinar pela linha de comando (opcional)

Alternativa ao painel: a ferramenta `web-ext` da Mozilla assina via API.

```
npm install --save-dev web-ext
# credenciais em https://addons.mozilla.org/developers/addon/api/key/
npx web-ext sign --source-dir dist/firefox --channel unlisted \
  --api-key SEU_JWT_ISSUER --api-secret SEU_JWT_SECRET
```

O `.xpi` assinado sai em `web-ext-artifacts/`.

---

## Reduzir permissões (opcional, recomendado antes de publicar público)

Hoje o content script roda em `<all_urls>`, o que é amplo e chama atenção na
revisão. Alternativas:

- Restringir `matches` a domínios específicos (ex.: só a API interna).
- Migrar para `activeTab` + injeção sob demanda (clique no ícone), evitando
  rodar em todos os sites automaticamente. Isso muda a UX (não é mais
  automático) e exige um service worker/action.

Se o objetivo for uso interno num domínio conhecido, restringir `matches` é o
caminho mais simples e reduz o atrito na revisão.

---

## Checklist antes de enviar

- [ ] Subir a versão em `package.json` (e ela reflete no manifest).
- [ ] `npm run package` gerou os dois zips em `release/`.
- [ ] Ícone 128x128 presente e legível.
- [ ] Screenshots 1280x800 capturados (tema escuro e claro).
- [ ] Descrição e privacidade revisadas.
- [ ] Decisão de visibilidade (público / não listado / privado).
- [ ] (Público) Considerar reduzir `<all_urls>`.
