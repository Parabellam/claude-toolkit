#!/usr/bin/env node
// Hook SessionStart: inyecta las reglas de ../rules/*.md como contexto de la sesión,
// igual que si estuvieran en el CLAUDE.md global.
// Desactivar una regla: borrar o renombrar su .md (p. ej. a .md.off).

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rulesDir = join(dirname(fileURLToPath(import.meta.url)), "..", "rules");
const rules = readdirSync(rulesDir)
  .filter((f) => f.endsWith(".md"))
  .sort()
  .map((f) => readFileSync(join(rulesDir, f), "utf8").trim());

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext:
        "Instrucciones globales del usuario (plugin stive-toolkit). Síguelas como si estuvieran en su CLAUDE.md:\n\n" +
        rules.join("\n\n"),
    },
  }),
);
