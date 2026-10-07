// Gera icones PNG (fundo escuro + chaves "{ }" em roxo/lilas) sem dependencias.
// Usa apenas os modulos nativos do Node (zlib para o PNG).
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Cores do tema escuro atual
const BG = [43, 43, 43]; // #2B2B2B fundo
const KEY = [176, 132, 235]; // #B084EB chaves (roxo/lilas)
const ACCENT = [0, 206, 200]; // #00CEC8 azul-esverdeado (dois pontos centrais)

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

// Desenha uma chave "{" (mirrored=false) ou "}" (mirrored=true) com tracos
// retos. Retorna uma funcao (x,y)->bool indicando se o pixel pertence ao glifo.
//
// Forma do "{":  gancho superior -> haste -> ponta central -> haste -> gancho
// inferior. O espelho troca o sentido horizontal.
function braceMask(size, mirrored) {
  const t = Math.max(2, Math.round(size * 0.07)); // espessura
  const top = size * 0.18;
  const bot = size * 0.82;
  const midY = size * 0.5;

  // Coordenadas base para a chave da esquerda ("{").
  const armX = size * 0.34; // ponta dos ganchos (mais a direita)
  const spineX = size * 0.26; // haste vertical
  const tipX = size * 0.18; // ponta central (mais a esquerda)

  const mx = (v) => (mirrored ? size - v : v);
  const gx = { arm: mx(armX), spine: mx(spineX), tip: mx(tipX) };

  return (x, y) => {
    // Haste vertical (duas metades, com folga no centro para a ponta).
    if (
      Math.abs(x - gx.spine) < t / 2 &&
      y > top &&
      y < bot &&
      Math.abs(y - midY) > t * 1.4
    ) {
      return true;
    }
    // Gancho superior e inferior (horizontais) entre a haste e o "arm".
    if (Math.abs(y - top) < t / 2 && between(x, gx.spine, gx.arm)) return true;
    if (Math.abs(y - bot) < t / 2 && between(x, gx.spine, gx.arm)) return true;
    // Ponta central apontando para fora (entre a haste e o "tip").
    if (Math.abs(y - midY) < t / 2 && between(x, gx.tip, gx.spine)) return true;
    return false;
  };
}

function between(v, a, b) {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return v >= lo && v <= hi;
}

function makePng(size) {
  const raw = Buffer.alloc(size * (1 + size * 3));
  const left = braceMask(size, false);
  const right = braceMask(size, true);
  const colonX = size * 0.5;
  const colonT = Math.max(2, Math.round(size * 0.045));

  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 3);
    raw[rowStart] = 0; // filtro "none"
    for (let x = 0; x < size; x++) {
      let color = BG;

      // dois pontos centrais (":") em azul-esverdeado
      const nearColonX = Math.abs(x - colonX) < colonT;
      const dot1 = nearColonX && Math.abs(y - size * 0.4) < colonT;
      const dot2 = nearColonX && Math.abs(y - size * 0.6) < colonT;
      if (dot1 || dot2) color = ACCENT;
      else if (left(x, y) || right(x, y)) color = KEY;

      const off = rowStart + 1 + x * 3;
      raw[off] = color[0];
      raw[off + 1] = color[1];
      raw[off + 2] = color[2];
    }
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = resolve(__dirname, "../src/icons");
mkdirSync(outDir, { recursive: true });
// 48 e 128 vao no manifest (dentro do pacote).
// 512 e gerado apenas para upload manual na pagina da loja (AMO/Chrome),
// nao e referenciado no manifest.
for (const size of [48, 128, 512]) {
  writeFileSync(resolve(outDir, `icon${size}.png`), makePng(size));
  console.log(`icon${size}.png gerado`);
}
