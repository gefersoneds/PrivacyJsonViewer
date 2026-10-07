/**
 * UI de temas: um seletor (dropdown) com os temas pre-definidos.
 * Aplica o tema no container e persiste a escolha no localStorage.
 */

import {
  THEMES,
  applyColors,
  getThemeById,
  readSelectedThemeId,
  storeSelectedThemeId,
  DEFAULT_THEME_ID,
} from "./themes.js";

export function installThemeUI(container: HTMLElement): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "jpv-theme-wrap";

  const select = document.createElement("select");
  select.className = "jpv-theme-select";
  select.title = "Tema";

  for (const t of THEMES) {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.label;
    select.appendChild(opt);
  }

  wrap.appendChild(select);

  const applyById = (id: string) => {
    const t = getThemeById(id) ?? getThemeById(DEFAULT_THEME_ID)!;
    applyColors(container, t.colors);
  };

  let selectedId = readSelectedThemeId();
  if (!getThemeById(selectedId)) selectedId = DEFAULT_THEME_ID;
  select.value = selectedId;
  applyById(selectedId);

  select.addEventListener("change", () => {
    selectedId = select.value;
    storeSelectedThemeId(selectedId);
    applyById(selectedId);
  });

  return wrap;
}
