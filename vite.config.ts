import { defineConfig } from "vite";
import { resolve } from "node:path";
import { cpSync, copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const target = process.env.TARGET ?? "chrome";
const outDir = resolve(__dirname, `dist/${target}`);

/**
 * Gera o manifest.json apropriado para cada navegador.
 * Chrome e Firefox suportam Manifest V3, mas Firefox exige
 * a chave `browser_specific_settings` para publicacao.
 */
function buildManifest() {
  const base = JSON.parse(
    readFileSync(resolve(__dirname, "src/manifest.base.json"), "utf-8"),
  );

  if (target === "firefox") {
    base.browser_specific_settings = {
      gecko: {
        id: "json-path-viewer@conceito",
        // data_collection_permissions e suportado a partir do Firefox 140.
        strict_min_version: "140.0",
        // A extensao nao coleta nem transmite dados pessoais.
        data_collection_permissions: {
          required: ["none"],
        },
      },
    };
  }

  return base;
}

export default defineConfig({
  build: {
    outDir,
    emptyOutDir: true,
    target: "es2020",
    rollupOptions: {
      input: {
        content: resolve(__dirname, "src/content.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
  plugins: [
    {
      name: "emit-static-assets",
      closeBundle() {
        mkdirSync(outDir, { recursive: true });
        writeFileSync(
          resolve(outDir, "manifest.json"),
          JSON.stringify(buildManifest(), null, 2),
        );
        copyFileSync(
          resolve(__dirname, "src/viewer.css"),
          resolve(outDir, "viewer.css"),
        );
        cpSync(
          resolve(__dirname, "src/icons"),
          resolve(outDir, "icons"),
          { recursive: true },
        );
      },
    },
  ],
});
