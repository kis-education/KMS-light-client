# KMS Light Client — la aplicación ligera de las familias

> **HOY ESTE REPOSITORIO CONTIENE UNA PRUEBA, NO UN PORTAL.** Lo que hay es la página con la que se
> entra y nada más: aquí no se ve ni un dato de nadie. Lo decidió así la decisión que lo funda —
> `kis-app/docs/kms/decisions/sys.md` → **DL-S93 ★★★★ ACOTACIÓN** (Diego, 2026-10-03): *«el primer
> paso es la prueba medida»*, no construir la aplicación.

## Qué es

Las familias y los clientes del colegio tendrán **su propia aplicación, ligera y aparte, servida
fuera de Apps Script**, y entrarán con **correo+contraseña o con su cuenta de Google**, sobre
**Identity Platform**. Esta es la página de entrar.

## ⛔⛔ La regla que lo gobierna todo: LA IDENTIDAD LA RESUELVE EL SERVIDOR

El proveedor acredita **una sola cosa**: *«quien presenta esto controla este buzón»*. **Quién es esa
persona en el colegio y qué puede ver lo decide el KMS**, por el camino de siempre
(`contactEmails` → `personal_id` → `rolesLog` → funcionalidades).

⇒ de esta página al servidor viaja **el testigo y nada más**, en `Authorization: Bearer`. **No se
manda** —ni se sabría— el identificador de la persona, ni el colegio, ni el rol. Un portal que
trajera consigo «soy la persona X del colegio Y» sería un portal donde basta editar una petición
para entrar en la ficha de otro niño: **eso** es lo que protegía DL-S93, y es lo único que sobrevive
al cambio de sitio.

**Y el servidor no se lo aceptaría aunque se mandara**: lo afirma, ejecutando la entrada de verdad,
`kis-app/scripts/servidor/la-familia-acredita-su-correo-y-el-servidor-decide.mjs`.

## Las otras cuatro reglas

1. **El testigo no se guarda en el navegador.** Vive en una variable de módulo y muere con la
   pestaña: ni `localStorage`, ni `sessionStorage`, ni galleta, ni URL (KAL-7). Que la sesión
   sobreviva a una recarga es **una decisión aparte y todavía no tomada**.
2. **Ni un permiso restringido de Google, por ninguna vía.** Entrar con la cuenta de Google pide
   `openid email profile` y nada más — ningún permiso de Workspace (DL-S93 §B). Si alguna vez
   pareciera que hace falta uno, **se para y se dice**.
3. **No se filtra si un correo existe.** El servidor manda **el mismo código** para «ese correo no
   es de nadie del colegio» y para «esa persona no tiene permiso», y esta página los dice igual. El
   mensaje de Identity Platform (`EMAIL_NOT_FOUND`, `INVALID_PASSWORD`) **no se enseña**: se
   clasifica y se contesta lo mismo.
4. **Esta página no registra ni un correo** (KIS-11). Lo que mide son tiempos y códigos.

## Cómo se pone en marcha

Es **estática**: ni compilación, ni `npm`, ni dependencias. Se sirve como fichero.

1. Rellenar `config.js` — los cuatro valores, **ninguno es un secreto** (la `apiKey` de Identity
   Platform identifica al proyecto y va en el navegador por diseño).
2. Encender la entrada en el servidor y declararle **el origen de esta página**
   (`KMS_FAMILIAS=1`, `KMS_FAMILIAS_PROYECTO=…`, `FAMILIAS_ORIGENES=https://…`).
   ⛔ El origen tiene que ser **`https` y sin puerto**: el criterio no admite otra cosa, y el
   testigo no viaja en claro.
3. Servirla desde cualquier sitio estático.

⚠️ **Mientras `config.js` esté vacía la página lo DICE** y no enseña el formulario, en vez de fallar
con un error de Google que no significa nada para quien lo lee.

## Lo que está medido, y lo que NO

| | |
|---|---|
| ✅ el navegador de verdad contra la entrada de verdad, con el preflight de CORS | **84-117 ms** el camino entero en local; **13-29 ms** la primera llamada ya acreditado |
| ✅ verificar un testigo en el servidor | **0,078 ms** |
| ✅ traer las claves públicas de Google | **8,3 ms** de mediana, y **una sola vez por hora** |
| ⛔ **el viaje real de entrar en Identity Platform** | **NO medido**: necesita el proyecto de Diego |
| ⛔ **el camino entero en producción** | **NO medido**; una ida y vuelta al servicio de datos cuesta **~600 ms** medidos, y ese es el coste real de entrar — no la verificación |

## Las tres preguntas que siguen abiertas

Son de Diego y están en `kis-app/docs/kms/pendiente-diego.md`: **qué servidor** tiene esta
aplicación · **qué pasa con las familias que hoy entran con Google** · si **el portal de dentro del
KMS** se retira o convive.

⛔ Y mientras se decide: **el portal de hoy, dentro del KMS, sigue funcionando igual.** Esto no lo
sustituye todavía.
