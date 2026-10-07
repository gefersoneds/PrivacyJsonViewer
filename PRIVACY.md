# Política de Privacidade — JSON Path Viewer

Última atualização: 15 de setembro de 2026

## Resumo

O JSON Path Viewer **não coleta, não armazena e não transmite dados pessoais**.
Toda a operação acontece localmente, dentro do seu navegador. A extensão não
possui servidores, não usa serviços de análise (analytics) e não compartilha
informações com terceiros.

## Que dados a extensão acessa

A extensão precisa ler o conteúdo das páginas que você abre para identificar e
formatar documentos JSON. Esse processamento é **inteiramente local**:

- O conteúdo JSON é lido e renderizado no próprio navegador.
- Nenhum conteúdo de página é enviado para fora do seu dispositivo.

Para detectar corretamente respostas JSON servidas por APIs, a extensão pode
fazer uma requisição (`fetch`) à **mesma URL que você já abriu**, reutilizando a
sessão do navegador. Essa requisição é feita ao próprio servidor de origem da
página — a extensão não envia esse conteúdo a nenhum outro destino.

## Que dados a extensão armazena

- **Preferência de tema** (claro/escuro): guardada localmente via
  `localStorage`, apenas no seu dispositivo. Não é sincronizada nem enviada a
  lugar algum.

Nenhum outro dado é armazenado.

## Permissões

- **Acesso às páginas visitadas (`<all_urls>`)**: necessário para que a extensão
  possa detectar e formatar documentos JSON em qualquer endereço que você abrir.
  Esse acesso é usado exclusivamente para renderizar o JSON na tela.

## Dados pessoais

A extensão não solicita, não coleta e não processa informações de identificação
pessoal (nome, e-mail, credenciais, etc.). Se um documento JSON exibido contiver
dados pessoais, eles permanecem apenas na tela do seu navegador, exatamente como
o servidor de origem os entregou.

## Alterações nesta política

Caso esta política mude, a nova versão será publicada junto com a extensão.

## Contato

Para dúvidas sobre privacidade, entre em contato pelo canal indicado na página
da extensão na loja.

---

# Privacy Policy — JSON Path Viewer (English)

Last updated: September 15, 2026

## Summary

JSON Path Viewer **does not collect, store, or transmit any personal data**. All
processing happens locally within your browser. The extension has no servers,
uses no analytics, and shares no information with third parties.

## Data the extension accesses

The extension reads the content of pages you open in order to detect and format
JSON documents. This processing is **entirely local**:

- JSON content is read and rendered within your browser.
- No page content is sent off your device.

To reliably detect JSON responses served by APIs, the extension may issue a
`fetch` request to the **same URL you already opened**, reusing the browser
session. This request goes to the page's own origin server — the extension does
not send that content anywhere else.

## Data the extension stores

- **Theme preference** (light/dark): stored locally via `localStorage`, on your
  device only. It is never synced or transmitted.

No other data is stored.

## Permissions

- **Access to visited pages (`<all_urls>`)**: required so the extension can
  detect and format JSON documents at any address you open. This access is used
  solely to render JSON on screen.

## Personal data

The extension does not request, collect, or process personally identifiable
information. If a displayed JSON document contains personal data, it stays only
on your browser screen, exactly as delivered by the origin server.

## Changes to this policy

If this policy changes, the updated version will be published with the extension.

## Contact

For privacy questions, use the contact channel listed on the extension's store
page.
