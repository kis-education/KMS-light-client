/*
 * EL SERVICE WORKER DE LOS AVISOS (CLI 106, DL-S154) — solo enseña la notificación y abre el portal.
 *
 * ⛔ NO guarda nada en caché y NO intercepta ninguna petición: no hay `fetch` aquí. Su único trabajo es
 *    recibir un aviso cifrado del servicio de push (lo descifra el propio navegador), pintarlo y, al
 *    pulsarlo, abrir el portal.
 * ⛔ Lo que llega es `{t, b, u}`: título, cuerpo y el enlace al portal. Un enlace que no sea de ESTE
 *    sitio no se abre: se abre el portal (el alcance de este service worker).
 * ★ CLI 158 — EL GLOBITO DEL ICONO: si el aviso trae `n` (entero ≥ 0, las comunicaciones pendientes de
 *    esa persona, calculadas por el KMS con el MISMO criterio que la pantalla), se pone en el icono
 *    (`setAppBadge`; 0 ⇒ `clearAppBadge`). Sin `n`, el globito NO se toca. Un fallo del globito NUNCA
 *    impide enseñar la notificación.
 * ★ CLI 158 — `silent: false` explícito: el aviso pide sonar (Diego: llega al iPhone y no suena).
 * ⛔ Sin datos, o con datos que no se entienden, se enseña un aviso genérico: el navegador exige
 *    enseñar algo por cada aviso recibido (`userVisibleOnly`), y uno vacío lo castigaría.
 */
self.addEventListener('install', () => { self.skipWaiting() })
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()) })

function enlaceDelPortal(u) {
  const alcance = self.registration.scope
  try {
    const url = new URL(String(u || ''), alcance)
    return url.href.indexOf(alcance) === 0 ? url.href : alcance
  } catch (_) {
    return alcance
  }
}

/** ★ CLI 158 — pone o quita el globito del icono con `n`; sin `n` válido no hace nada. Nunca rechaza. */
function ponerElGlobito(n) {
  try {
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 0) return Promise.resolve()
    const nav = self.navigator
    if (!nav || typeof nav.setAppBadge !== 'function') return Promise.resolve()
    const p = n === 0 && typeof nav.clearAppBadge === 'function' ? nav.clearAppBadge() : nav.setAppBadge(n)
    return Promise.resolve(p).catch(() => undefined)
  } catch (_) {
    return Promise.resolve()
  }
}

self.addEventListener('push', (e) => {
  let d = {}
  try { d = e.data ? e.data.json() : {} } catch (_) { d = {} }
  if (!d || typeof d !== 'object') d = {}
  const titulo = String(d.t || 'Kaleide').slice(0, 120)
  const cuerpo = String(d.b || '').slice(0, 300)
  e.waitUntil(Promise.all([
    self.registration.showNotification(titulo, {
      body: cuerpo,
      icon: 'icono-192.png',
      badge: 'icono-192.png',
      silent: false,
      data: { url: enlaceDelPortal(d.u) },
    }),
    ponerElGlobito(d.n),
  ]))
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = (e.notification.data && e.notification.data.url) || self.registration.scope
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
    for (const v of ventanas) {
      if (v.url.indexOf(self.registration.scope) === 0 && 'focus' in v) return v.focus()
    }
    return self.clients.openWindow ? self.clients.openWindow(url) : undefined
  }))
})
