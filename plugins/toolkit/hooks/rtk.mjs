#!/usr/bin/env node
// Hook PreToolUse (Bash): delega en `rtk hook claude` si RTK está instalado.
// Si no lo está (p. ej. un PC nuevo), no hace nada en vez de dar error.

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const input = readFileSync(0);
const r = spawnSync("rtk", ["hook", "claude"], { input, stdio: ["pipe", "inherit", "inherit"] });
if (r.error) process.exit(0);
process.exit(r.status ?? 0);
