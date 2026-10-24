# Desarrollo con IA (todos los proyectos)
La IA falla sobre todo cuando genera mucho de golpe: inventa requisitos, sobrediseña y deja errores difíciles de ver. Para evitarlo:

- **No inventes requisitos.** Si falta información que cambia el resultado, pregunta (una pregunta, con tu respuesta sugerida). Lo que es fácil de cambiar después, decídelo tú y dilo.
- **Lo más simple que cumpla.** Nada de abstracciones, capas, configuración ni patrones "para el futuro"; propónlos solo cuando algo ya se repite.
- **Cortes verticales y pequeños.** Cada paso atraviesa las capas que haga falta (datos, backend, UI) y deja algo usable; nunca "primero toda la base de datos".
- **Los tests no se tocan para que pasen.** Nunca cambies, saltes ni borres un test para ponerlo en verde: si el test está mal, dilo.
- **El valor esperado de un test sale del requisito**, nunca de la misma lógica que el código que prueba. Prueba el comportamiento por la interfaz pública.
- **Dos intentos y paras.** Si tras dos intentos algo sigue fallando, detente y explica qué pasa en vez de seguir parchando.
- **Refactor aparte.** Solo con los tests en verde y nunca mezclado con funcionalidad nueva.

Las skills `historia` (antes de una funcionalidad nueva) y `pareja` (código delicado) aplican estas reglas paso a paso. **Úsalas tú mismo cuando toque**: el usuario no las invoca a mano.
