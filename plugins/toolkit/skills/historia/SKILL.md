---
name: historia
description: Use antes de escribir código para una funcionalidad nueva o un cambio de producto que no sea un arreglo pequeño (más de un archivo, o con comportamiento visible para el usuario). Convierte el pedido en una historia con 2-3 criterios de aceptación, un mini plan y lo que queda fuera de alcance, para construir solo lo pedido.
---

# Historia

Antes de construir algo nuevo, deja claro **qué** se va a construir. Adaptado de `/story` de [hola-ai](https://github.com/nschurmann/hola-ai) (MIT, Nicolás Schurmann), con una diferencia: el usuario prefiere que avances solo, así que solo te detienes si de verdad falta algo.

## Pasos

1. **Lee el pedido y el contexto**: el código actual, el `CLAUDE.md`/`AGENTS.md` del repo y, si existe, la especificación del producto.
2. **Decisiones caras de cambiar.** Si es un producto o módulo nuevo, comprueba si aplica alguna: multi-empresa (multi-tenant), modelo de roles o permisos, offline/sincronización, varios idiomas o monedas. Si aplica y no está decidida, pregunta.
3. **Criterios de aceptación.** 2-3 en formato Dado/Cuando/Entonces. Describen *qué* ve u obtiene el usuario, nunca *cómo* se implementa.
4. **Si necesita más de 3 criterios, es demasiado grande.** Pártela en historias más pequeñas, cada una usable por sí sola (cortes verticales, nunca por capas), y empieza por la más pequeña que funcione de punta a punta.
5. **Mini plan.** Máximo 5 puntos, sin código: cómo atraviesa las capas con lo mínimo que cumple los criterios.
6. **Sigue.**
   - Si falta información que cambia el resultado o hay una decisión cara sin tomar → pregunta y espera.
   - Si no → muestra el bloque en tu respuesta y continúa con la implementación sin esperar. Si el código toca algo delicado (ver la skill `pareja`), sigue con ella.

## Reglas

- **No inventes requisitos.** Lo que no se pidió va en "Fuera de alcance".
- **Lo más simple que cumpla los criterios.** Patrones o refactors solo como sugerencia, y solo si hay una señal concreta en el código (algo que ya se repite).
- Los criterios son la base de los tests: cada uno debe poder comprobarse.

## Formato

```markdown
## Historia
Como <actor>, quiero <acción>, para <beneficio>.

## Criterios de aceptación
- [ ] Dado <contexto>, cuando <acción>, entonces <resultado>.

## Plan
- ...

## Fuera de alcance
- <lo que no entra, para que no se cuele>
```
