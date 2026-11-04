// Página de solo lectura de un enlace compartido (ver.html?c=código).
// Muestra la copia fija guardada al compartir: no cambia aunque después cambie la planta o el huerto.
import './styles.css';
import {SUPABASE_URL, SUPABASE_KEY} from './cloud-config.js';
import {drawPlan} from './share.js';

const el = document.getElementById('ver');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const DAY = 864e5, parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const fdate = (d, y = true) => parse(d).toLocaleDateString('es-ES', y ? {day: 'numeric', month: 'short', year: 'numeric'} : {day: 'numeric', month: 'short'});
const days = (a, b) => Math.max(0, Math.round((parse(b) - parse(a)) / DAY));
const ageTxt = n => n === 0 ? 'Hoy' : n >= 365 ? (y => `${y} ${y === '1' ? 'año' : 'años'}`)((n / 365).toFixed(1).replace('.0', '').replace('.', ',')) : `${n} ${n === 1 ? 'día' : 'días'}`;
const ivTxt = d => d >= 365 && d % 365 === 0 ? (d === 365 ? 'cada año' : `cada ${d / 365} años`) : `cada ${d} días`;
const ACT = {riego: 'Riego', abono: 'Abonado', sustrato: 'Sustrato', poda: 'Poda'};
// Solo rutas de fotos con la forma que crea la app
const pic = p => /^[0-9a-f-]{36}\/[A-Za-z0-9_-]{20,40}\/\d{1,2}\.jpg$/.test(p || '') ? `${SUPABASE_URL}/storage/v1/object/public/compartidas/${p}` : '';
const isoDay = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '');

function fail(t) { el.innerHTML = `<p class="vmsg">${t}</p>`; }

function gallery(fotos, start, cap) {
  const ok = fotos.filter(f => pic(f.p));
  if (!ok.length) return '';
  return `<section class="vcard"><h2 class="vh">Fotos <small>${ok.length}</small></h2>
    <figure class="vbig"><img id="vBig" src="${pic(ok[ok.length - 1].p)}" alt=""><figcaption id="vCap">${esc(cap(ok[ok.length - 1]))}</figcaption></figure>
    ${ok.length > 1 ? `<div class="vthumbs">${ok.map((f, i) => `<button type="button" data-i="${i}" aria-pressed="${i === ok.length - 1}" aria-label="${esc(cap(f))}"><img src="${pic(f.p)}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
  </section>`;
}
function wireGallery(fotos, cap) {
  const ok = fotos.filter(f => pic(f.p));
  el.querySelector('.vthumbs')?.addEventListener('click', e => {
    const b = e.target.closest('[data-i]'); if (!b) return; const f = ok[+b.dataset.i];
    document.getElementById('vBig').src = pic(f.p); document.getElementById('vCap').textContent = cap(f);
    el.querySelectorAll('.vthumbs [data-i]').forEach(x => x.setAttribute('aria-pressed', x === b));
  });
}

function plant(d, creado) {
  const at = isoDay(d.at) ? d.at : creado.slice(0, 10), sown = isoDay(d.sown) ? d.sown : at, fotos = d.fotos || [];
  const cap = f => isoDay(f.date) ? `Día ${days(sown, f.date)} · ${fdate(f.date)}` : '';
  const last = fotos.filter(f => pic(f.p)).pop();
  const thumb = last ? `<img src="${pic(last.p)}" alt="">` : d.ilu && /^[a-z]+$/.test(d.sp) ? `<img class="ilu" src="ilus/${d.sp}.webp" alt="">` : `<span>${esc((d.species || '?')[0])}</span>`;
  const care = (d.care || []).filter(c => ACT[c.a] && c.iv > 0);
  el.innerHTML = `<section class="vcard vhero"><div class="vhd"><div class="vth">${thumb}</div><div><h1 class="vname">${esc(d.name)}</h1><p class="vsub">${esc(d.species)}${d.group ? ` · ${esc(d.group)}` : ''}</p></div></div>
    <div class="tstats" style="--n:3"><div><span>Ubicación</span><b>${d.loc === 'interior' ? 'Interior' : 'Exterior'}</b></div><div><span>${d.tree ? 'Plantación' : 'Siembra'}</span><b>${fdate(sown, false)}</b></div><div><span>Edad</span><b>${ageTxt(days(sown, at))}</b></div></div></section>
    ${care.length ? `<section class="vcard"><h2 class="vh">Cuidados</h2><ul class="vcare">${care.map(c => `<li><b>${ACT[c.a]}</b><span>${ivTxt(c.iv)}${isoDay(c.last) ? ` · la última vez, el ${fdate(c.last, false)}` : ''}</span></li>`).join('')}</ul>${d.harv ? `<p class="vnote">Cosechado en ${at.slice(0, 4)}: <b>${esc(d.harv)}</b></p>` : ''}</section>` : ''}
    ${gallery(fotos, sown, cap)}
    <p class="vwhen">Compartido el ${fdate(at)}. Es una copia: se ve tal como estaba ese día.</p>`;
  wireGallery(fotos, cap);
}

function garden(d, creado) {
  const at = isoDay(d.at) ? d.at : creado.slice(0, 10), g = d.plan || {}, fotos = d.fotos || [];
  const cap = f => isoDay(f.date) ? fdate(f.date) : '';
  const ps = Array.isArray(g.plants) ? g.plants : [];
  const okPlan = g.w > 0 && g.h > 0 && g.w <= 200 && g.h <= 200 && Array.isArray(g.beds);
  el.innerHTML = `<section class="vcard vhero"><h1 class="vname">${esc(d.name)}</h1>
    <p class="vsub">${[okPlan ? `${g.w} × ${g.h} m` : '', ps.length ? `${ps.length} ${ps.length === 1 ? 'planta' : 'plantas'}` : '', d.zone ? esc(d.zone) : ''].filter(Boolean).join(' · ')}</p>
    ${okPlan ? '<canvas class="vplan" id="vPlan"></canvas>' : ''}
    ${ps.length ? `<ul class="vlegend">${ps.filter(p => p.nm).map(p => `<li><i class="g-${esc(p.g)}">${esc(p.ab)}</i>${esc(p.nm)}${p.sp && p.sp !== p.nm ? ` <small>${esc(p.sp)}</small>` : ''}</li>`).join('')}</ul>` : ''}</section>
    ${gallery(fotos, null, cap)}
    <p class="vwhen">Compartido el ${fdate(at)}. Es una copia: se ve tal como estaba ese día.</p>`;
  if (okPlan) {
    const cv = document.getElementById('vPlan'), W = 1000, H = Math.round(Math.min(1000, W * g.h / g.w));
    cv.width = W; cv.height = H; const c = cv.getContext('2d');
    const draw = () => { c.clearRect(0, 0, W, H); drawPlan(c, {beds: [], plants: [], ...g}, 0, 0, W, H); };
    draw(); document.fonts?.ready.then(draw);
  }
  wireGallery(fotos, cap);
}

function harvest(d, creado) {
  const at = isoDay(d.at) ? d.at : creado.slice(0, 10), fotos = d.fotos || [];
  const cap = f => isoDay(f.date) ? fdate(f.date) : '';
  const first = fotos.filter(f => pic(f.p))[0];
  const thumb = first ? `<img src="${pic(first.p)}" alt="">` : d.ilu && /^[a-z]+$/.test(d.sp) ? `<img class="ilu" src="ilus/${d.sp}.webp" alt="">` : `<span>${esc((d.species || d.name || '?')[0])}</span>`;
  el.innerHTML = `<section class="vcard vhero"><div class="vhd"><div class="vth">${thumb}</div><div><h1 class="vname">${esc(d.name)}</h1><p class="vsub">Cosecha${d.species && d.species !== d.name ? ` · ${esc(d.species)}` : ''}</p></div></div>
    <div class="tstats" style="--n:2"><div><span>Cantidad</span><b>${esc(d.qty || '—')}</b></div><div><span>Fecha</span><b>${isoDay(d.d) ? fdate(d.d) : '—'}</b></div></div></section>
    ${d.o ? `<section class="vcard"><h2 class="vh">Observaciones</h2><p class="vobs">${esc(d.o).replace(/\n/g, '<br>')}</p></section>` : ''}
    ${gallery(fotos, null, cap)}
    <p class="vwhen">Compartido el ${fdate(at)}. Es una copia: se ve tal como estaba ese día.</p>`;
  wireGallery(fotos, cap);
}

function harvests(d, creado) {
  const at = isoDay(d.at) ? d.at : creado.slice(0, 10), fotos = d.fotos || [], list = Array.isArray(d.list) ? d.list : [], tot = Array.isArray(d.tot) ? d.tot : [];
  const cap = f => [f.n, isoDay(f.date) ? fdate(f.date) : ''].filter(Boolean).join(' · ');
  el.innerHTML = `<section class="vcard vhero"><h1 class="vname">Cosechas de ${esc(d.year)}</h1><p class="vsub">${list.length} ${list.length === 1 ? 'cosecha' : 'cosechas'}</p>
    ${tot.length ? `<ul class="vcare">${tot.map(t => `<li><b>${esc(t.n)}</b><span>${esc(t.t)}</span></li>`).join('')}</ul>` : ''}</section>
    ${list.length ? `<section class="vcard"><h2 class="vh">Cada cosecha</h2><ul class="vharv">${list.map(x => `<li><div><b>${esc(x.n)}</b><span>${isoDay(x.d) ? fdate(x.d) : ''}</span></div><span class="q">${esc(x.qty)}</span>${x.o ? `<p>${esc(x.o)}</p>` : ''}</li>`).join('')}</ul></section>` : ''}
    ${gallery(fotos, null, cap)}
    <p class="vwhen">Compartido el ${fdate(at)}. Es una copia: se ve tal como estaba ese día.</p>`;
  wireGallery(fotos, cap);
}

async function main() {
  const id = new URLSearchParams(location.search).get('c');
  if (!id || !/^[A-Za-z0-9_-]{20,40}$/.test(id)) return fail('Este enlace no es correcto. Pide a quien te lo mandó que lo vuelva a compartir.');
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/ver_compartido`, {method: 'POST', headers: {apikey: SUPABASE_KEY, 'Content-Type': 'application/json'}, body: JSON.stringify({p_id: id})});
    if (!r.ok) throw new Error(r.status);
    const [row] = await r.json();
    if (!row) return fail('Este enlace ya no existe: quien lo compartió lo ha borrado.');
    document.title = `${row.titulo} · Sembradía`;
    (row.tipo === 'huerto' ? garden : row.tipo === 'cosecha' ? harvest : row.tipo === 'cosechas' ? harvests : plant)(row.data || {}, row.creado || '');
  } catch (e) { fail(navigator.onLine === false ? 'No hay conexión. Ábrelo cuando vuelvas a tener internet.' : 'No se ha podido abrir. Vuelve a intentarlo en un momento.'); }
}
main();
