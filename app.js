/*
 * LA FAMILIA ACREDITA SU CORREO — y el servidor decide.
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 *
 * QUÉ HACE, en una frase: pide el correo y la contraseña (o la cuenta de Google), consigue de
 * Identity Platform un **testigo** que acredita «quien presenta esto controla este buzón», y se lo
 * presenta al servidor para que **ÉL** diga si esa persona puede entrar.
 *
 * ⛔⛔ LO QUE ESTA PÁGINA NO HACE, Y ES LO IMPORTANTE (DL-S93 ★★★★ ACOTACIÓN): **no decide nada.**
 * No sabe quién es esa persona en el colegio, ni de qué colegio es, ni qué rol tiene, ni qué puede
 * ver — y **no se lo manda al servidor**, porque el servidor no se lo aceptaría. Lo único que
 * viaja es el testigo, en `Authorization: Bearer`. Un portal que además trajera consigo «soy la
 * persona X del colegio Y» sería un portal donde basta editar una petición para entrar en la ficha
 * de otro niño: eso es lo que DL-S93 protegía, y es lo único que sobrevive al cambio de sitio.
 *
 * ⛔ EL TESTIGO NO SE GUARDA EN NINGÚN SITIO DEL NAVEGADOR. Vive en una variable de este módulo y
 * muere con la pestaña: ni `localStorage`, ni `sessionStorage`, ni una galleta, ni la URL (KAL-7).
 * Que la sesión sobreviva a una recarga es una decisión aparte y todavía no tomada — y hacerlo mal
 * aquí es exactamente cómo se filtra un testigo.
 *
 * ⛔ KIS-11: esta página no registra ni un correo. Lo que se mide son TIEMPOS y CÓDIGOS.
 */

const $ = (id) => document.getElementById(id);
const CFG = window.KAL || {};
const IDP = 'https://identitytoolkit.googleapis.com/v1/accounts:';

/** El testigo. En memoria y solo aquí. */
let testigo = null;

const medido = {};
function medir(nombre, ms) {
  medido[nombre] = Math.round(ms);
  $('medidas').innerHTML = Object.entries(medido)
    .map(([k, v]) => `<dt>${k}</dt><dd>${v} ms</dd>`).join('');
}

function contar(clase, titulo, cuerpo) {
  const p = $('parte');
  p.hidden = false;
  p.className = 'parte ' + clase;
  p.innerHTML = `<h2>${titulo}</h2>${cuerpo}`;
}

/**
 * Lo que la familia LEE para cada código. ⛔ UN SOLO SITIO lo decide, y los textos salen de aquí:
 * el servidor manda un CÓDIGO, nunca una frase (una frase se traduce y se reescribe; un código no).
 *
 * ⛔ Y `SIN_ACCESO` dice lo MISMO para «ese correo no es de nadie del colegio» y para «esa persona
 * no tiene permiso» **porque el servidor manda el mismo código a propósito**: distinguirlos aquí
 * sería imposible, y es justo lo que impide que esta página sea un oráculo de qué buzones son de
 * una familia del colegio.
 */
const TEXTOS = {
  SIN_ACCESO: 'Has acreditado tu correo, pero ese correo no tiene acceso al portal de familias. '
            + 'Si crees que debería tenerlo, escribe al colegio.',
  TESTIGO_CADUCADO: 'La sesión ha caducado. Vuelve a entrar.',
  CORREO_SIN_ACREDITAR: 'Tienes que confirmar tu correo antes de entrar. Busca el mensaje de '
            + 'confirmación en tu buzón.',
  TESTIGO_NO_VALIDO: 'No se ha podido validar la sesión. Vuelve a entrar.',
  NO_COMPROBABLE: 'No se ha podido comprobar tu acceso ahora mismo. Inténtalo en un momento.',
  ORIGEN_NO_DECLARADO: 'Esta página no está autorizada a preguntar al servidor.',
};

/** Pide algo a Identity Platform. Devuelve su `idToken`. */
async function aIdentityPlatform(metodo, cuerpo) {
  const r = await fetch(IDP + metodo + '?key=' + encodeURIComponent(CFG.apiKey), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(Object.assign({ returnSecureToken: true }, cuerpo)),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.idToken) {
    // ⛔ El mensaje de Google se mira para CLASIFICAR y no se enseña: dice cosas como
    // `EMAIL_NOT_FOUND`, que le contaría a cualquiera qué correos tienen cuenta.
    const e = new Error('IDP');
    e.google = String((j.error && j.error.message) || r.status);
    throw e;
  }
  return j.idToken;
}

/**
 * LA SEGUNDA MITAD: presentarle el testigo al servidor. ⛔ El cuerpo va VACÍO — no porque dé igual,
 * sino porque es la forma de que no quepa la duda de quién decide.
 */
async function preguntarleAlServidor() {
  if (!CFG.servidor) {
    contar('', 'Correo acreditado', '<p>Identity Platform ha acreditado tu correo. Todavía no hay '
      + 'servidor declarado, así que <strong>nadie ha decidido</strong> si esa persona puede entrar '
      + '(<code>config.js</code> → <code>servidor</code>).</p>');
    return;
  }
  const t0 = performance.now();
  let r = null, j = null;
  try {
    r = await fetch(CFG.servidor.replace(/\/+$/, '') + '/familias/entrar', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + testigo },   // ⛔ en la cabecera, NUNCA en la URL
      body: '',                                          // ⛔ vacío: el servidor no lo mira
    });
    j = await r.json().catch(() => null);
  } catch (e) {
    medir('primera llamada ya acreditado', performance.now() - t0);
    contar('malo', 'No se ha podido preguntar', '<p>' + TEXTOS.NO_COMPROBABLE + '</p>');
    return;
  }
  medir('primera llamada ya acreditado', performance.now() - t0);

  if (j && j.ok && j.puede) {
    contar('bien', 'Puedes entrar', '<p>El servidor ha resuelto quién eres en el colegio y te '
      + 'reconoce como familia. <br><small>Aquí es donde empezaría el portal.</small></p>');
    return;
  }
  const code = (j && j.code) || 'NO_COMPROBABLE';
  contar('malo', 'No puedes entrar',
    `<p>${TEXTOS[code] || TEXTOS.NO_COMPROBABLE}</p><p><small>código: <code>${code}</code></small></p>`);
}

/** El camino entero, medido: acreditar · preguntar. */
async function entrar(comoAcredita, nombreDeLaMedida) {
  $('parte').hidden = true;
  $('entrar').disabled = true;
  try {
    const t0 = performance.now();
    testigo = await comoAcredita();
    medir(nombreDeLaMedida, performance.now() - t0);
    await preguntarleAlServidor();
  } catch (e) {
    if (e && e.google) {
      // ⛔ Un fallo de Identity Platform se dice SIN su texto: `EMAIL_NOT_FOUND` e
      // `INVALID_PASSWORD` son el mismo mensaje para quien entra, o el formulario se convierte en
      // un oráculo de qué correos tienen cuenta.
      contar('malo', 'No se ha podido entrar',
        '<p>El correo o la contraseña no son correctos.</p>');
    } else {
      contar('malo', 'No se ha podido entrar', '<p>' + TEXTOS.NO_COMPROBABLE + '</p>');
    }
  } finally {
    $('entrar').disabled = false;
  }
}

// ── correo + contraseña ─────────────────────────────────────────────────────────────────────────
$('forma').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const correo = $('correo').value.trim();
  const clave = $('clave').value;
  entrar(() => aIdentityPlatform('signInWithPassword', { email: correo, password: clave }),
         'acreditar el correo (contraseña)');
});

// ── la cuenta de Google ─────────────────────────────────────────────────────────────────────────
//
// ⛔ PIDE SOLO LA IDENTIDAD. El flujo de testigo de Google Identity Services pide `openid email
// profile` y nada más: ni un permiso de Workspace, ni Drive, ni Calendar. DL-S93 §B prohíbe los
// RESTRINGIDOS por las DOS vías, y entrar con Google no necesita ninguno — si algún día pareciera
// que hace falta uno, se PARA y se dice.
window.alEntrarConGoogle = (respuesta) => {
  entrar(() => aIdentityPlatform('signInWithIdp', {
    requestUri: window.location.origin,
    postBody: 'id_token=' + encodeURIComponent(respuesta.credential) + '&providerId=google.com',
  }), 'acreditar el correo (Google)');
};

function pintarElBotonDeGoogle() {
  if (!CFG.googleClientId || !(window.google && window.google.accounts && window.google.accounts.id)) {
    $('google-no').hidden = false;
    return;
  }
  window.google.accounts.id.initialize({
    client_id: CFG.googleClientId,
    callback: window.alEntrarConGoogle,
  });
  window.google.accounts.id.renderButton($('google'),
    { theme: 'outline', size: 'large', width: 320, locale: 'es', text: 'signin_with' });
}

// ── arranque ────────────────────────────────────────────────────────────────────────────────────
if (!CFG.proyecto || !CFG.apiKey) {
  $('sin-configurar').hidden = false;
  $('forma').hidden = true;
  $('google-no').hidden = false;
} else {
  // GIS carga con `defer`, así que puede no estar todavía: se espera a la carga y, si ya está, se
  // pinta ya. ⛔ Sin él, el camino de correo+contraseña sigue funcionando entero.
  if (window.google && window.google.accounts) pintarElBotonDeGoogle();
  else window.addEventListener('load', pintarElBotonDeGoogle, { once: true });
}
