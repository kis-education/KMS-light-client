/*
 * EL FAMILY ROOM — lo que una familia MIRA.
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 *
 * ⛔⛔ ESTA PÁGINA SIGUE SIN DECIDIR NADA. Pide una llamada POR SU NOMBRE y pinta lo que el
 * servidor le devuelve. No filtra por colegio, no elige de quién son las filas y no manda un
 * identificador de persona: el servidor resuelve quién eres con el testigo y **recorta él**. Si
 * algún día alguien añade aquí un filtro «para que no se vea lo de otro», eso es el síntoma de
 * que el recorte se movió al sitio equivocado.
 *
 * ⛔ El testigo no se guarda: vive en memoria, en `app.js`, y muere con la pestaña (KAL-7).
 * ⛔ KIS-11: de aquí no sale ni un nombre ni un correo a ningún registro. Lo que se mide son
 *    tiempos y cuántas filas llegaron, nunca quiénes.
 */

const $ = (id) => document.getElementById(id);

/** Lo que se ofrece, en el orden en que se enseña. */
const SECCIONES = [
  { id: 'hijos',       titulo: 'Mis hijos',   ruta: 'portal.listMyChildren' },
  { id: 'facturas',    titulo: 'Facturas',    ruta: 'portal.listMyInvoices' },
  { id: 'documentos',  titulo: 'Documentos',  ruta: 'portal.listMyDocuments' },
  { id: 'solicitudes', titulo: 'Solicitudes', ruta: 'portal.listMyApplications' },
];

const texto = (v) => (v === null || v === undefined || v === '' ? '—' : String(v));

/** Escapa para no inyectar nada al pintar: lo que llega son datos, no HTML. */
function esc(v) {
  return texto(v).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** El dinero viene en CÉNTIMOS y aquí solo se divide y se formatea — no se calcula nada. */
function dinero(centimos, moneda) {
  const n = Number(centimos || 0) / 100;
  try { return n.toLocaleString(undefined, { style: 'currency', currency: moneda || 'EUR' }); }
  catch { return n.toFixed(2); }
}

function fecha(v) {
  const s = texto(v);
  if (s === '—') return s;
  // Las fechas llegan ISO o en formato americano; se pinta lo que haya sin inventar nada.
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString();
}

const PINTAN = {
  hijos: (filas) => tabla(['Nombre', 'Nacimiento', 'Nivel', 'Grupo'],
    filas.map((f) => [
      `${esc(f.first_name)} ${esc(f.last_name)}`, fecha(f.date_of_birth),
      esc(f.education_level), esc(f.group_name),
    ])),
  facturas: (filas, cfg) => tabla(['Número', 'Vence', 'Concepto', 'Importe', 'Estado'],
    filas.map((f) => [
      esc(f.document_number), fecha(f.due_date), esc(f.description),
      esc(dinero(f.total_cents, cfg && cfg.default_currency)), esc(f.status),
    ])),
  documentos: (filas) => tabla(['Documento', 'De', 'Estado', 'Emitido'],
    filas.map((f) => [esc(f.title), esc(f.child_name), esc(f.status), fecha(f.issued_at)])),
  solicitudes: (filas) => tabla(['Solicitante', 'Programa', 'Estado', 'Comienzo'],
    filas.map((f) => [
      `${esc(f.first_name)} ${esc(f.last_name)}`, esc(f.program_designation),
      esc(f.status_code), fecha(f.desired_start_date),
    ])),
};

function tabla(cabeceras, filas) {
  if (!filas.length) return '<p class="nota">No hay nada aquí todavía.</p>';
  return '<table><thead><tr>' + cabeceras.map((c) => `<th>${esc(c)}</th>`).join('')
    + '</tr></thead><tbody>'
    + filas.map((f) => '<tr>' + f.map((c) => `<td>${c}</td>`).join('') + '</tr>').join('')
    + '</tbody></table>';
}

/**
 * Abre la sala. `pedir(ruta)` lo da `app.js` y es lo ÚNICO que habla con el servidor: así esta
 * pieza no sabe ni dónde está el servidor ni cómo se acredita.
 */
export async function abrirLaSala(pedir, medir) {
  $('entrada').hidden = true;
  $('sala').hidden = false;

  $('pestanas').innerHTML = SECCIONES
    .map((s, i) => `<button type="button" class="pestana${i ? '' : ' activa'}" data-s="${s.id}">${esc(s.titulo)}</button>`)
    .join('');
  $('pestanas').addEventListener('click', (ev) => {
    const b = ev.target.closest('.pestana');
    if (!b) return;
    for (const x of $('pestanas').querySelectorAll('.pestana')) x.classList.toggle('activa', x === b);
    enseñar(b.dataset.s);
  });

  // La configuración del centro primero: de ahí sale la moneda con la que se pinta el dinero.
  let cfg = null;
  try { cfg = await pedir('portal.getTenantConfig'); } catch { cfg = null; }

  const cache = {};
  async function enseñar(id) {
    const sec = SECCIONES.find((s) => s.id === id);
    $('contenido').innerHTML = '<p class="nota">Cargando…</p>';
    if (!cache[id]) {
      const t0 = performance.now();
      try { cache[id] = await pedir(sec.ruta); }
      catch (e) {
        // ⛔ Se dice qué pasó y no se finge una sección vacía: «no hay facturas» y «no se pudieron
        //    pedir» son cosas distintas, y confundirlas es decirle a una familia que no debe nada.
        $('contenido').innerHTML = '<p class="malo">No se ha podido cargar esta sección. '
          + 'Vuelve a intentarlo en un momento.</p>';
        return;
      }
      medir(`${sec.titulo.toLowerCase()} (${(cache[id] || []).length} filas)`, performance.now() - t0);
    }
    const filas = Array.isArray(cache[id]) ? cache[id] : [];
    $('contenido').innerHTML = PINTAN[id](filas, cfg);
  }

  await enseñar('hijos');
}
