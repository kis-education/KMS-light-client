# KMS Light Client — el portal de las familias, fuera de Apps Script

Lo que se publica aquí es **la página compilada**. El fuente vive en `kis-app` (privado):
son **las mismas pantallas del portal del KMS** (`frontend/src/worlds/portal/`), compiladas aparte con
`npm run familias:build`. No hay una segunda versión de ninguna pantalla: lo único que cambia es por
dónde viajan las llamadas (al servicio de familias, `kms-familias`, en vez de a Apps Script).

Para publicar una versión nueva, desde `kis-app`:

```bash
node scripts/publicar-cliente-ligero.mjs <este repositorio>
# y después commit + push aquí
```

⛔ **Nadie lo publica solo, y por eso hay que acordarse.** Las pantallas son las MISMAS del portal del
KMS, así que **tocar una pantalla del portal cambia esto** — y mientras nadie recompile, la familia
sigue viendo la de antes **sin que falle nada**. Que se publique solo está pendiente de una decisión
(`kis-app docs/kms/pendiente-diego.md` `D250`).

**Y «¿está publicado ya tal cambio?» se contesta con una orden**, desde `kis-app`:

```bash
node scripts/ya-esta-vivo.mjs <rastro> --cliente-ligero
```

Lee la portada que sirven las Pages y sigue el `src=` que ella declara —el nombre del paquete lleva
huella y **cambia en cada compilación**, incluso sin tocar el fuente—. ⚠️ **El paquete está
MINIFICADO**: un nombre de función o de constante **no vale como rastro** y da un «no está» falso;
solo sobreviven los **literales de cadena** (el texto de un mensaje, una clave de texto, el nombre de
una ruta, la versión del frontal).

## ⛔⛔ La regla que lo gobierna todo: LA IDENTIDAD LA RESUELVE EL SERVIDOR

Identity Platform acredita **una sola cosa**: *«quien presenta esto controla este buzón»*. **Quién es
esa persona en el colegio y qué puede ver lo decide el servidor en cada llamada**, con la cadena de
identidad del KMS (`contactEmails` → persona → roles → funcionalidades). Del navegador viaja **el
testigo** (`Authorization: Bearer`) y el **nombre** de la llamada; nunca un identificador de persona,
ni el colegio, ni el rol.

## Las otras reglas

1. **El testigo no se guarda en el navegador** (ni `localStorage`, ni `sessionStorage`, ni galleta,
   ni URL — KAL-7). Vive en memoria y muere con la pestaña: **recargar pide entrar otra vez**. Que la
   sesión sobreviva a una recarga es una decisión aparte y todavía no tomada.
2. **Ni un permiso restringido de Google**: entrar con Google pide `openid email profile` y nada más
   (DL-S93 §B).
3. **No se filtra si un correo existe**: «no es de nadie del colegio» y «no tiene permiso» dicen lo
   mismo, y el mensaje de Identity Platform no se enseña.
4. **Las secciones que el servicio todavía no ofrece lo dicen** («no se pudo cargar»), no se fingen
   vacías.

## Configuración

`config.js` — cuatro valores, **ninguno es un secreto** (la `apiKey` de Identity Platform identifica
al proyecto y va en el navegador por diseño). No lo toca la publicación.
