---
name: pareja
description: Use al escribir o cambiar código delicado, donde un error cuesta dinero, seguridad o datos - pagos y facturación, autenticación, permisos y roles, borrado o migración de datos, cálculos con dinero, criptografía o secretos, sincronización. Desarrolla en pasos pequeños guiados por tests (un test en rojo, el código mínimo, verde) con la lista de tests aprobada antes de empezar.
---

# Pareja

Programación en pareja para el código donde un error sale caro. Tú escribes el código; el usuario aprueba **una sola vez** la lista de tests, que es la especificación. Adaptado de `/pair` de [hola-ai](https://github.com/nschurmann/hola-ai) (MIT, Nicolás Schurmann): allí se para tras cada test; aquí avanzas solo y paras únicamente en los casos de abajo, porque el usuario prefiere no tener que intervenir.

## 1. Revisa

- Parte de los criterios de aceptación (de la skill `historia` o del pedido). Si no los hay, escríbelos primero con `historia`.
- Compara el plan con el código actual; si algo ya no encaja, dilo antes de empezar.

## 2. Lista de tests (único punto de aprobación)

- A partir de los criterios, propón **la lista de tests: solo los nombres**, y dónde se prueba cada uno (endpoint, servicio, componente…). Prefiere el nivel más alto que sea práctico.
- Marca como **verificación manual** lo que no se puede probar bien (p. ej. lo visual).
- Pide la aprobación de la lista en un solo mensaje corto y espera. Si el usuario ya dijo que no lo esperes en esta tarea, muéstrala y sigue.

## 3. Ciclo, un test cada vez

1. Escribe el test.
2. Ejecútalo y **comprueba que falla** (rojo), y que falla por el motivo esperado.
3. Escribe el **código mínimo** para que pase. Nada que el test no pida.
4. Ejecuta los tests y comprueba que pasan (verde).

Repite con el siguiente test sin esperar. Al terminar, resume en una línea por test lo que hiciste (`archivo:línea`) y las decisiones que tomaste.

### Para y pregunta (aunque estés a mitad) si:

- Necesitas una decisión de diseño que no está en el plan.
- Quieres añadir algo que no se pidió, aunque parezca razonable.
- Para que un test pase habría que cambiar, saltar o borrar un test.
- Llevas dos intentos sin llegar a verde.
- Un paso pasa de ~50 líneas o toca más de 3 archivos: propón partirlo.

### Reglas de los tests

- El valor esperado sale del criterio de aceptación, **nunca calculado con la misma lógica que el código**.
- Prueba comportamiento por la interfaz pública, no detalles internos.

## 4. Comprueba

- Con todo en verde, repasa los criterios de **verificación manual** (si puedes comprobarlos tú, p. ej. abriendo la app, hazlo).
- Pide una revisión con contexto limpio (un subagente revisor o la skill de code review), no te revises tú mismo.
- Si algo se repite o quedó desordenado, refactoriza solo con los tests en verde y en un commit aparte de la funcionalidad.
- Si salió una decisión que aplica a todo el proyecto, propón una línea para el `CLAUDE.md`.

Los commits y PRs siguen el flujo normal del repo.
