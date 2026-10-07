// Empacota cada build (dist/chrome e dist/firefox) em um .zip pronto para
// compartilhar / publicar.
//
// O zip e montado manualmente (sem dependencias externas) para garantir que os
// nomes internos usem "/" como separador. Isso e obrigatorio para o formato ZIP
// e exigido pelo validador da Mozilla (AMO), que rejeita "icons\icon128.png".
import { deflateRawSync, crc32 as zlibCrc32 } from "node:zlib";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { resolve, dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "release");
mkdirSync(outDir, { recursive: true });

const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8"));
const version = pkg.version ?? "0.0.0";

/** CRC-32 compativel com ZIP (usa o do zlib quando disponivel). */
function crc32(buf) {
  if (typeof zlibCrc32 === "function") return zlibCrc32(buf) >>> 0;
  // Fallback manual (Node < 20).
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

/** Lista recursivamente os arquivos de um diretorio, com caminho relativo. */
function listFiles(baseDir) {
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else out.push(full);
    }
  };
  walk(baseDir);
  return out.map((full) => ({
    full,
    // nome interno do zip SEMPRE com "/".
    entry: relative(baseDir, full).split(sep).join("/"),
  }));
}

/** Monta um Buffer .zip (metodo deflate) a partir de uma lista de arquivos. */
function buildZip(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;

  const toDosDateTime = (d) => {
    const time =
      (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    const date =
      ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    return { time, date };
  };
  const { time, date } = toDosDateTime(new Date());

  for (const { full, entry } of files) {
    const content = readFileSync(full);
    const crc = crc32(content);
    const compressed = deflateRawSync(content);
    const nameBuf = Buffer.from(entry, "utf-8");

    // Local file header
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); // signature
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0, 6); // flags
    local.writeUInt16LE(8, 8); // method: deflate
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28); // extra len
    locals.push(local, nameBuf, compressed);

    // Central directory header
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6); // version needed
    central.writeUInt16LE(0, 8); // flags
    central.writeUInt16LE(8, 10); // method
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(content.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30); // extra len
    central.writeUInt16LE(0, 32); // comment len
    central.writeUInt16LE(0, 34); // disk number
    central.writeUInt16LE(0, 36); // internal attrs
    central.writeUInt32LE(0, 38); // external attrs
    central.writeUInt32LE(offset, 42); // offset of local header
    centrals.push(central, nameBuf);

    offset += local.length + nameBuf.length + compressed.length;
  }

  const localPart = Buffer.concat(locals);
  const centralPart = Buffer.concat(centrals);

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4); // disk
  end.writeUInt16LE(0, 6); // disk with cd
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralPart.length, 12);
  end.writeUInt32LE(localPart.length, 16); // offset of central dir
  end.writeUInt16LE(0, 20); // comment len

  return Buffer.concat([localPart, centralPart, end]);
}

for (const target of ["chrome", "firefox"]) {
  const src = resolve(root, "dist", target);
  if (!existsSync(src)) {
    console.error(`Build ausente: ${src} (rode o build antes).`);
    process.exitCode = 1;
    continue;
  }

  const zipPath = resolve(outDir, `json-path-viewer-${target}-v${version}.zip`);
  if (existsSync(zipPath)) rmSync(zipPath);

  const files = listFiles(src);
  writeFileSync(zipPath, buildZip(files));

  console.log(`Gerado: ${zipPath} (${files.length} arquivos)`);
  for (const f of files) console.log(`  - ${f.entry}`);
}
