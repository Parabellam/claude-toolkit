# Calidad de código (todos los proyectos)
El plugin stive-toolkit ejecuta un quality gate (hook Stop) con typecheck, lint, Knip y clippy/fmt sobre los archivos cambiados. Si te bloquea, corrige la causa: nunca silencies con `any`, `@ts-ignore`, `eslint-disable`, `#[allow(...)]` ni bajando reglas.

Al escribir código:
- TypeScript siempre en modo estricto. No uses `any` (usa `unknown` y valida, p. ej. con Zod). Valida en los bordes: APIs, formularios y variables de entorno.
- No dejes código muerto: exports, archivos o dependencias sin usar. Si algo deja de usarse por tu cambio, bórralo.
- Rust: el código debe pasar `cargo fmt --check` y `cargo clippy --all-targets -- -D warnings`.

Al empezar a trabajar en un repo, si falta alguno de estos puntos, **avisa al usuario en una línea y propón añadirlo** (no lo instales sin su OK; en repos del empleo puede haber políticas propias):
- `tsconfig.json` con `"strict": true`.
- Knip como devDependency, con `knip.json` y script `"knip"`.
- Rust: `cargo-deny` (`deny.toml`) y `cargo nextest` para los tests.
- `renovate.json` para actualizar dependencias.
- CI que ejecute typecheck, lint, tests, build y Knip/clippy en cada PR, con branch protection en la rama principal (no se mergea con CI en rojo).
- En apps desplegadas a producción: Sentry para errores.
