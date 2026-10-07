// Gera o zip do CODIGO-FONTE para envio ao revisor da AMO (Mozilla).
// Inclui apenas os arquivos-fonte e de build; exclui node_modules, dist,
// release, logs e a pasta .git. Nomes internos com "/" (exigencia do ZIP).
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

// Diretorios/arquivos a excluir da raiz.
const EXCLUDE_DIRS = new Set([
  "node_modules",
  "dist",
  "release",
  ".git",
]);
const EXCLUDE_FILE = (name) => name.endsWith(".log");

function crc32(buf) {
  if (typeof zlibCrc32 === "function") return zlibCrc32(buf) >>> 0;
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

function listFiles(baseDir) {
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const isDir = statSync(full).isDirectory();
      if (isDir) {
        if (EXCLUDE_DIRS.has(name)) continue;
        walk(full);
      } else {
        if (EXCLUDE_FILE(name)) continue;
        out.push(full);
      }
    }
  };
  walk(baseDir);
  return out.map((full) => ({
    full,
    entry: relative(baseDir, full).split(sep).join("/"),
  }));
}

function buildZip(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;

  const d = new Date();
  const time =
    (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date =
    ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();

  for (const { full, entry } of files) {
    const content = readFileSync(full);
    const crc = crc32(content);
    const compressed = deflateRawSync(content);
    const nameBuf = Buffer.from(entry, "utf-8");

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBuf, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(content.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);

    offset += local.length + nameBuf.length + compressed.length;
  }

  const localPart = Buffer.concat(locals);
  const centralPart = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralPart.length, 12);
  end.writeUInt32LE(localPart.length, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([localPart, centralPart, end]);
}

const zipPath = resolve(outDir, `json-path-viewer-source-v${version}.zip`);
if (existsSync(zipPath)) rmSync(zipPath);

const files = listFiles(root);
writeFileSync(zipPath, buildZip(files));

console.log(`Gerado: ${zipPath} (${files.length} arquivos)`);
for (const f of files) console.log(`  - ${f.entry}`);
