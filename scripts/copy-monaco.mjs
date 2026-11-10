/**
 * Copies Monaco's AMD distribution to /public so the editor loads from the
 * same origin. Runs automatically before `next dev` and `next build`.
 * The output directory is gitignored; node_modules is the single source.
 */
import { cp, mkdir, rm, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "node_modules/monaco-editor/min/vs");
const target = resolve(root, "public/monaco/vs");

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(source))) {
  console.error(
    "[monaco] node_modules/monaco-editor/min/vs tidak ditemukan. Jalankan npm install terlebih dahulu.",
  );
  process.exit(1);
}

await rm(target, { recursive: true, force: true });
await mkdir(dirname(target), { recursive: true });
await cp(source, target, { recursive: true });
console.log("[monaco] aset editor disalin ke public/monaco/vs");
