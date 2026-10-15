# claude-toolkit

Mi configuración de Claude Code, portable a cualquier PC.

## Qué incluye

| Pieza | Qué hace |
|---|---|
| Plugin `stive-toolkit` | Reglas globales (idioma español, calidad de código, RTK) inyectadas en cada sesión |
| Quality gate (hook Stop) | Al terminar cada turno ejecuta typecheck, lint, Knip y clippy/fmt sobre los archivos cambiados. Bloquea solo si hay errores en lo que cambió Claude |
| Hook de RTK | Recorta la salida de los comandos para ahorrar tokens (si RTK está instalado) |
| `setup/install.*` | Instala RTK, graphify, superpowers, context7 y este plugin |

Los **conectores** y las **skills de claude.ai** no van aquí: viajan con tu cuenta al iniciar sesión.

## Instalar en un PC nuevo

Requisitos: Claude Code, Node.js, Git y acceso a este repo privado (por ejemplo, con `gh auth login`).

```powershell
git clone https://github.com/Parabellam/claude-toolkit.git
cd claude-toolkit
powershell -ExecutionPolicy Bypass -File setup\install.ps1
```

En macOS/Linux: `bash setup/install.sh`.

## Actualizar

1. Edita este repo (reglas en `plugins/toolkit/rules/`, hooks en `plugins/toolkit/hooks/`).
2. Sube la `version` en `plugins/toolkit/.claude-plugin/plugin.json` y en `.claude-plugin/marketplace.json`.
3. Haz push y, en cada PC: `claude plugin marketplace update stive` y luego `claude plugin update stive-toolkit@stive`.

## Desactivar el quality gate

- En un repo concreto: crea `.claude/no-quality-gate`.
- En todos: variable de entorno `CLAUDE_QUALITY_GATE=off`.
- Una regla concreta: renombra su `.md` en `rules/` a `.md.off`.

## Nota para el PC de la empresa

Algunas organizaciones bloquean los plugins o hooks personales con su configuración gestionada. Si no carga, revisa esa política antes de depurar.
