/*
 * LA CONFIGURACIÓN DE ESTA PÁGINA — tres valores, y NINGUNO es un secreto.
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ La `apiKey` de Identity Platform **no es una credencial**: identifica al proyecto y va en el
 * navegador por diseño (quien la tenga no puede entrar en ninguna cuenta). Lo que protege las
 * cuentas es la contraseña y, del lado del colegio, que `contactEmails` no reconozca el correo.
 *
 * ⛔ VACÍA A PROPÓSITO. Rellenarla es el paso de Diego: hasta entonces la página lo DICE en vez de
 * fallar con un error de Google que no significa nada para quien lo lee.
 */
window.KAL = {
  // El identificador del proyecto de Google donde vive Identity Platform.
  proyecto: 'kis-app-dfec6',
  // La clave de navegador (Identity Platform → «Proveedores» → el fragmento de código).
  apiKey: 'AIzaSyC-XnO49n2qlYlOffYy77AUZ_9UsAOC0IA',
  // El identificador de cliente OAuth de tipo «Aplicación web», para entrar con Google.
  // ⛔ Pide SOLO `openid email profile`. Ni un permiso de Workspace: DL-S93 §B prohíbe los
  // RESTRINGIDOS, y entrar con Google NO necesita ninguno.
  googleClientId: '402626947179-4lk792hfipm41b54hmi7bcbr7sdfm5m5.apps.googleusercontent.com',
  // La dirección del servidor que verifica el testigo y decide. Mientras esté vacía, la página
  // acredita el correo y lo dice, pero NO pregunta a nadie si esa persona puede entrar.
  //
  // ⛔ VA EL SERVICIO «SOLO FAMILIAS» (`kms-familias`), NO `kms-data-api`: ése NO está abierto a
  // internet —hace falta identificarse ante Google para preguntarle— así que el navegador de una
  // familia no puede llamarlo, y abrirlo expondría sus 51 verbos. El de familias monta UNA ruta.
  servidor: 'https://kms-familias-oi2gtytjlq-no.a.run.app',
};
