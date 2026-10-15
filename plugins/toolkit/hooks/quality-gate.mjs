#!/usr/bin/env node
// Quality gate del plugin stive-toolkit para Claude Code (hook Stop).
// Al terminar cada turno, si hay archivos de código modificados en el repo git,
// ejecuta typecheck, lint, Knip (TS/JS) y clippy/fmt (Rust) SOLO si el proyecto
// ya los tiene instalados. Nunca descarga nada.
//
// - Errores en archivos que cambiaste  -> bloquea (exit 2) y Claude los corrige.
// - Errores solo en otros archivos     -> aviso para ti, no bloquea.
// - Segundo intento fallido seguido    -> aviso, no bloquea (evita bucles).
// - Sin cambios desde la última pasada -> no hace nada (caché).
//
// Desactivar: variable CLAUDE_QUALITY_GATE=off, o crear .claude/no-quality-gate en el repo.

import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";

const CODE_EXT = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs|astro|vue|svelte|rs)$/i;
const MAX_LINES = 60;
const CMD_TIMEOUT = 180_000;
const IS_WIN = process.platform === "win32";

const input = readStdin();
if (process.env.CLAUDE_QUALITY_GATE === "off") process.exit(0);

const cwd = input.cwd || process.cwd();
const root = sh("git rev-parse --show-toplevel", cwd).out.trim();
if (!root || !existsSync(root)) process.exit(0);
if (existsSync(join(root, ".claude", "no-quality-gate"))) process.exit(0);

const changed = changedFiles(root).filter((f) => CODE_EXT.test(f) && existsSync(join(root, f)));
if (changed.length === 0) process.exit(0);

// Caché: si los archivos cambiados no se han tocado desde la última pasada limpia, salir.
const cacheFile = join(tmpdir(), "claude-quality-gate", hash(root) + ".json");
const fingerprint = hash(changed.map((f) => f + ":" + statSync(join(root, f)).mtimeMs).join("|"));
if (readCache() === fingerprint) process.exit(0);

const changedAbs = changed.map((f) => resolve(root, f));
const projects = groupByProject(changedAbs);
const blocking = [];
const elsewhere = [];

for (const [dir, info] of projects) {
  const checks = info.kind === "rust" ? rustChecks(dir, info.files) : jsChecks(dir, info.files);
  for (const c of checks) {
    const r = sh(c.cmd, dir);
    if (r.ok) continue;
    const lines = r.out.split(/\r?\n/).filter((l) => l.trim());
    const mine = [];
    let header = null; // p. ej. "Unused exports (2)" en Knip
    for (const l of lines) {
      if (mentionsAny(l, info.files, dir)) {
        if (header) mine.push(header), (header = null);
        mine.push(l);
      } else if (/\(\d+\)\s*$/.test(l)) header = l;
    }
    if (mine.length > 0) blocking.push({ name: c.name, dir, lines: mine });
    else if (!c.onlyChanged) elsewhere.push({ name: c.name, dir, count: lines.length });
  }
}

if (blocking.length === 0) {
  writeCache(fingerprint);
  if (elsewhere.length > 0) {
    const msg = elsewhere.map((e) => `${e.name} (${rel(e.dir)})`).join(", ");
    out({ systemMessage: `Quality gate: tus cambios pasan, pero hay errores preexistentes fuera de ellos en: ${msg}.` });
  }
  process.exit(0);
}

const report = formatReport(blocking);
if (input.stop_hook_active) {
  // Ya hubo un intento de corrección en este turno: avisar sin volver a bloquear.
  out({ systemMessage: "Quality gate: siguen quedando errores tras el reintento.\n" + report });
  process.exit(0);
}
process.stderr.write(
  "Quality gate: hay errores en los archivos que modificaste. Corrígelos antes de terminar " +
    "(no desactives reglas ni uses any/@ts-ignore/#[allow] para silenciarlos).\n" + report + "\n",
);
process.exit(2);

// ---------- checks ----------

function jsChecks(dir, files) {
  const checks = [];
  const pkg = readJson(join(dir, "package.json")) || {};
  const scripts = pkg.scripts || {};
  const pm = packageManager(dir);

  const tcScript = ["typecheck", "type-check", "check-types", "tsc"].find((s) => scripts[s]);
  const tsc = findBin(dir, "tsc");
  if (tcScript) checks.push({ name: "typecheck", cmd: `${pm} run ${tcScript}` });
  else if (tsc && existsSync(join(dir, "tsconfig.json")))
    checks.push({ name: "typecheck", cmd: `${q(tsc)} --noEmit -p tsconfig.json --pretty false` });

  const biome = findBin(dir, "biome");
  const hasBiomeCfg = upFind(dir, ["biome.json", "biome.jsonc"]);
  const lintable = files.filter((f) => /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/i.test(f));
  if (biome && hasBiomeCfg && lintable.length)
    checks.push({
      name: "biome",
      onlyChanged: true,
      cmd: `${q(biome)} check --no-errors-on-unmatched --reporter=summary ${lintable.map(q).join(" ")}`,
    });
  else if (scripts.lint) checks.push({ name: "lint", cmd: `${pm} run lint` });
  else {
    const eslint = findBin(dir, "eslint");
    if (eslint && lintable.length && hasEslintConfig(dir))
      checks.push({ name: "eslint", onlyChanged: true, cmd: `${q(eslint)} --format unix ${lintable.map(q).join(" ")}` });
  }

  const knip = findBin(dir, "knip");
  if (knip) {
    const knipRoot = upFind(dir, ["knip.json", "knip.jsonc", ".knip.json", "knip.ts", "knip.config.ts"]) || root;
    checks.push({ name: "knip", cmd: `${q(knip)} --no-progress --reporter compact`, cwd: knipRoot });
  }
  return checks.map((c) => ({ ...c, cmd: c.cwd && c.cwd !== dir ? `cd ${IS_WIN ? "/d " : ""}${q(c.cwd)} && ${c.cmd}` : c.cmd }));
}

function rustChecks() {
  return [
    { name: "cargo fmt", cmd: "cargo fmt --check" },
    { name: "clippy", cmd: "cargo clippy --quiet --all-targets --message-format short -- -D warnings" },
  ];
}

// ---------- helpers ----------

function groupByProject(files) {
  const map = new Map();
  for (const f of files) {
    const kind = f.toLowerCase().endsWith(".rs") ? "rust" : "js";
    const marker = kind === "rust" ? "Cargo.toml" : "package.json";
    let d = dirname(f);
    while (!existsSync(join(d, marker)) && isInside(d, root) && d !== root) d = dirname(d);
    if (!existsSync(join(d, marker))) continue;
    if (!map.has(d)) map.set(d, { kind, files: [] });
    map.get(d).files.push(f);
  }
  return map;
}

function mentionsAny(line, files, dir) {
  const l = line.replace(/\\/g, "/").toLowerCase();
  return files.some((f) => {
    const a = relative(dir, f).replace(/\\/g, "/").toLowerCase();
    const b = relative(root, f).replace(/\\/g, "/").toLowerCase();
    return l.includes(a) || l.includes(b);
  });
}

function formatReport(items) {
  const lines = [];
  for (const b of items) {
    lines.push(`[${b.name}] ${rel(b.dir) || "."}`);
    lines.push(...b.lines.map((l) => "  " + l.trim()));
  }
  if (lines.length > MAX_LINES) {
    const rest = lines.length - MAX_LINES;
    return lines.slice(0, MAX_LINES).join("\n") + `\n  ... y ${rest} líneas más`;
  }
  return lines.join("\n");
}

function changedFiles(dir) {
  const r = sh("git status --porcelain --untracked-files=all", dir);
  return r.out
    .split(/\r?\n/)
    .filter((l) => l.length > 3 && !l.startsWith(" D") && !l.startsWith("D "))
    .map((l) => {
      let p = l.slice(3);
      if (p.includes(" -> ")) p = p.split(" -> ").pop();
      return p.replace(/^"|"$/g, "");
    });
}

function packageManager(dir) {
  const has = (cmd) => sh(IS_WIN ? `where ${cmd}` : `command -v ${cmd}`, dir).ok;
  if (upFind(dir, ["pnpm-lock.yaml"])) return has("pnpm") ? "pnpm" : "npx --no-install pnpm";
  if (upFind(dir, ["bun.lock", "bun.lockb"]) && has("bun")) return "bun";
  if (upFind(dir, ["yarn.lock"]) && has("yarn")) return "yarn";
  return "npm";
}

function findBin(dir, name) {
  let d = dir;
  while (true) {
    for (const n of IS_WIN ? [name + ".cmd", name] : [name]) {
      const p = join(d, "node_modules", ".bin", n);
      if (existsSync(p)) return p;
    }
    if (d === root || !isInside(d, root)) return null;
    d = dirname(d);
  }
}

function upFind(dir, names) {
  let d = dir;
  while (true) {
    if (names.some((n) => existsSync(join(d, n)))) return d;
    if (d === root || !isInside(d, root)) return null;
    d = dirname(d);
  }
}

function hasEslintConfig(dir) {
  return !!upFind(dir, [
    "eslint.config.js", "eslint.config.mjs", "eslint.config.cjs", "eslint.config.ts",
    ".eslintrc", ".eslintrc.js", ".eslintrc.cjs", ".eslintrc.json",
  ]);
}

function sh(cmd, dir) {
  try {
    const out = execSync(cmd, { cwd: dir, stdio: ["ignore", "pipe", "pipe"], timeout: CMD_TIMEOUT, encoding: "utf8", env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" } });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: `${e.stdout || ""}\n${e.stderr || ""}` };
  }
}

function isInside(child, parent) {
  const r = relative(parent, child);
  return r === "" || (!r.startsWith("..") && !r.includes(":"));
}

function rel(d) {
  return relative(root, d).split(sep).join("/");
}

function q(s) {
  return /[\s&()^]/.test(s) ? `"${s}"` : s;
}

function hash(s) {
  return createHash("sha1").update(s).digest("hex").slice(0, 16);
}

function readJson(p) {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function readCache() {
  try {
    return readFileSync(cacheFile, "utf8");
  } catch {
    return null;
  }
}

function writeCache(v) {
  try {
    mkdirSync(dirname(cacheFile), { recursive: true });
    writeFileSync(cacheFile, v);
  } catch {}
}

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, "utf8") || "{}");
  } catch {
    return {};
  }
}

function out(obj) {
  process.stdout.write(JSON.stringify(obj));
}
