/**
 * Tooltip discreto que mostra o caminho completo do campo sob o mouse.
 *
 * Comportamento:
 *  - so aparece quando o cursor esta sobre a PALAVRA (a chave .jpv-key ou o
 *    valor .jpv-value), nao sobre a linha inteira;
 *  - so aparece depois de o cursor permanecer 1 segundo parado sobre a palavra;
 *  - some ao sair da palavra;
 *  - Alt+clique sobre a palavra copia o caminho do campo para o clipboard.
 *
 * Cada .jpv-row guarda seu caminho em dataset.path (ex.:
 * "data.perfilDasPessoas.proponente.endereco.complemento"). Exibimos esse
 * caminho prefixado por "<root>", posicionado proximo ao cursor.
 */

const HOVER_DELAY_MS = 1000;
const OFFSET_Y = 22;

export function installPathTooltip(
  root: HTMLElement,
  host: HTMLElement,
): () => void {
  const tip = document.createElement("div");
  tip.className = "jpv-path-tip";
  tip.style.display = "none";
  host.appendChild(tip);

  let timer: number | null = null;
  let lastX = 0;
  let lastY = 0;
  let flashTimer: number | null = null;

  const clearTimer = () => {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
  };

  const hide = () => {
    clearTimer();
    tip.style.display = "none";
  };

  // Retorna a .jpv-row associada apenas quando o alvo e a palavra (chave/valor).
  const wordRowFrom = (target: EventTarget | null): HTMLElement | null => {
    if (!(target instanceof Element)) return null;
    const word = target.closest<HTMLElement>(".jpv-key, .jpv-value");
    if (!word) return null;
    const row = word.closest<HTMLElement>(".jpv-row");
    if (!row || row.classList.contains("jpv-closing")) return null;
    if (!root.contains(row)) return null;
    return row;
  };

  const place = (x: number, y: number) => {
    const maxX = window.innerWidth - tip.offsetWidth - 8;
    const left = Math.max(8, Math.min(x, maxX));
    let top = y - OFFSET_Y - tip.offsetHeight;
    if (top < 4) top = y + OFFSET_Y; // se nao cabe acima, mostra abaixo
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  };

  const pathTextOf = (row: HTMLElement): string => {
    const path = row.dataset.path ?? "";
    return path === "" ? "<root>" : `<root>.${path}`;
  };

  const showFor = (row: HTMLElement) => {
    tip.textContent = pathTextOf(row);
    tip.style.display = "";
    place(lastX, lastY);
  };

  // Alt+clique sobre a palavra copia o caminho do campo.
  const onClick = (e: MouseEvent) => {
    if (!e.altKey) return;
    const row = wordRowFrom(e.target);
    if (!row) return;
    e.preventDefault();
    e.stopPropagation();
    const text = pathTextOf(row);
    void navigator.clipboard?.writeText(text).catch(() => {
      /* clipboard indisponivel: ignora */
    });
    // Feedback visual rapido no tooltip.
    if (flashTimer !== null) window.clearTimeout(flashTimer);
    clearTimer();
    tip.textContent = "Caminho copiado!";
    tip.style.display = "";
    place(lastX, lastY);
    flashTimer = window.setTimeout(() => {
      tip.style.display = "none";
      flashTimer = null;
    }, 900);
  };

  const onMove = (e: MouseEvent) => {
    lastX = e.clientX;
    lastY = e.clientY;

    const row = wordRowFrom(e.target);

    if (!row) {
      // Fora de qualquer palavra (espaco vazio da linha, brackets, etc.): esconde.
      hide();
      return;
    }

    // Sobre uma palavra: se o tooltip ja esta visivel, apenas acompanha o cursor.
    if (tip.style.display !== "none") {
      place(lastX, lastY);
      return;
    }

    // Ainda nao visivel: (re)inicia a contagem de 2s a cada movimento sobre a palavra.
    clearTimer();
    timer = window.setTimeout(() => {
      // Confirma que o cursor ainda esta sobre uma palavra valida.
      const stillRow = wordRowFrom(document.elementFromPoint(lastX, lastY));
      if (stillRow) showFor(stillRow);
    }, HOVER_DELAY_MS);
  };

  const onLeave = () => hide();

  root.addEventListener("mousemove", onMove);
  root.addEventListener("mouseleave", onLeave);
  root.addEventListener("click", onClick, true); // captura: antes do toggle

  return () => {
    root.removeEventListener("mousemove", onMove);
    root.removeEventListener("mouseleave", onLeave);
    root.removeEventListener("click", onClick, true);
    clearTimer();
    tip.remove();
  };
}
