// Plano del huerto: bancales y macetas a escala (en metros) y cada planta colocada en su sitio.
// Puede haber varios huertos (patio, azotea…), cada uno con sus medidas y su disposición.
// Las posiciones de las plantas se guardan en la propia planta (p.pos, con el huerto en p.pos.h) y el resto en hv.plan; las dos cosas se sincronizan.
import {store} from './store.js';

const KEY = 'hv.plan', NEAR = 1.2; // a esta distancia o menos (m) dos plantas se consideran juntas
const POTS = [[.1, '10 cm'], [.15, '15 cm'], [.2, '20 cm'], [.3, '30 cm'], [.5, '50 cm'], [.8, '80 cm · para árboles'], [1.2, '1,2 m · para árboles grandes']];
const CANOPY = 1.5; // radio de la copa de un frutal en el suelo (m)
const GCOL = {alimentario: 'ali', aromatica: 'aro', frutal: 'fru', ornamental: 'orn', forrajero: 'for'};
const num = n => String(+n.toFixed(1)).replace('.', ',');

export function initPlan(ctx) {
  // ctx: {plants(), savePlants(), SP, REL, esc, openPlant(id), toast(msg)}
  const {SP, REL, esc} = ctx;
  const el = id => document.getElementById(id);
  const box = el('planBox'), plan = el('plan'), svg = el('planLines');
  let all = load(), pl = current(), sel = null, drag = null;

  function load() {
    let v = null; try { v = JSON.parse(store.getItem(KEY) || 'null'); } catch (e) {}
    if (v && Array.isArray(v.list) && v.list.length) return v;
    // Antes había un solo huerto: pasa a ser el primero de la lista
    const one = {id: 'h1', name: 'Mi huerto', w: v?.w || 8, h: v?.h || 6, beds: Array.isArray(v?.beds) ? v.beds : []};
    return {cur: one.id, list: [one]};
  }
  function current() { return all.list.find(x => x.id === all.cur) || all.list[0]; }
  const save = () => { try { store.setItem(KEY, JSON.stringify(all)); } catch (e) {} };
  const plants = () => ctx.plants();
  // Mientras se escribe en un campo no se redibuja (la sincronización puede llegar a mitad y borraría lo escrito)
  const typing = root => { const a = document.activeElement; return a && a.tagName === 'INPUT' && root.contains(a); };
  // Las plantas colocadas antes de haber varios huertos son del primero
  const gardenOf = p => p.pos && (all.list.some(x => x.id === p.pos.h) ? p.pos.h : all.list[0].id);
  const placed = () => plants().filter(p => p.pos && gardenOf(p) === pl.id);
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const inside = (pos, b) => b.k === 'bed' ? pos.x >= b.x && pos.x <= b.x + b.w && pos.y >= b.y && pos.y <= b.y + b.h
    : dist(pos, {x: b.x + b.w / 2, y: b.y + b.w / 2}) <= b.w / 2 + .05;
  const holder = (p, g = pl) => p.pos && g.beds.find(b => inside(p.pos, b));
  // Un frutal en maceta tiene la copa a la medida de la maceta
  const canopy = (p, g = pl) => { const h = holder(p, g); return h && h.k === 'pot' ? Math.max(.35, h.w * .75) : CANOPY; };
  const badPair = (a, b) => REL[a.sp]?.bad.has(b.sp);
  const foes = () => { const out = [], ps = placed(); for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) if (dist(ps[i].pos, ps[j].pos) <= NEAR && badPair(ps[i], ps[j])) out.push([ps[i], ps[j]]); return out; };
  const ab = s => s.n.normalize('NFD').replace(/[̀-ͯ]/g, '').slice(0, 2).toUpperCase();

  // La cuadrícula de 1 m en píxeles enteros, para que no se pierdan líneas al redondear
  function gridSize() { const r = plan.getBoundingClientRect(); if (r.width) plan.style.backgroundSize = `${r.width / pl.w}px ${r.width / pl.w}px`; }
  try { new ResizeObserver(gridSize).observe(plan); } catch (e) {}
  function draw(keepInfo) {
    if (!box.open) return;
    const {w: W, h: H} = pl, pct = (v, t) => v / t * 100 + '%';
    plan.style.aspectRatio = `${W}/${H}`;
    gridSize();
    svg.setAttribute('viewBox', `0 0 ${W * 100} ${H * 100}`);
    const bad = foes(), badIds = new Set(bad.flat().map(p => p.id));
    let h = '';
    for (const b of pl.beds) h += `<div class="pi ${b.k}${sel === b.id ? ' sel' : ''}" data-pid="${esc(b.id)}" tabindex="0" role="button" aria-label="${esc(b.name)}" style="left:${pct(b.x, W)};top:${pct(b.y, H)};width:${pct(b.w, W)};height:${pct(b.k === 'pot' ? b.w : b.h, H)}"><span class="lbl">${esc(b.name)}</span></div>`;
    for (const p of placed()) {
      const s = SP[p.sp]; if (!s) continue;
      const g = GCOL[s.g] || 'ali', on = sel === p.id;
      if (s.tree) { const r = canopy(p); h += `<div class="canopy" style="left:${pct(p.pos.x - r, W)};top:${pct(p.pos.y - r, H)};width:${pct(r * 2, W)};height:${pct(r * 2, H)}"></div>`; }
      // Un ! rojo si tiene alguna tarea atrasada (las que salen en rojo en Recordatorios)
      const late = ctx.overdue?.(p)?.length;
      h += `<div class="pi pt g-${g}${s.tree ? ' tree' : ''}${on ? ' sel' : ''}${badIds.has(p.id) ? ' foe' : ''}" data-pid="${esc(p.id)}" tabindex="0" role="button" aria-label="${esc(p.name)}${late ? ' · tiene tareas atrasadas' : ''}" style="left:${pct(p.pos.x, W)};top:${pct(p.pos.y, H)}"><span class="dot">${ab(s)}${late ? '<span class="late" aria-hidden="true">!</span>' : ''}</span><span class="nm">${esc(p.name)}</span></div>`;
    }
    plan.querySelectorAll('.pi,.canopy').forEach(e => e.remove());
    plan.insertAdjacentHTML('beforeend', h);
    svg.innerHTML = bad.map(([a, b]) => `<line x1="${a.pos.x * 100}" y1="${a.pos.y * 100}" x2="${b.pos.x * 100}" y2="${b.pos.y * 100}" vector-effect="non-scaling-stroke"/>`).join('');
    el('planEmpty').hidden = !!(pl.beds.length || placed().length);
    drawTray(); if (keepInfo !== true) drawInfo();
    if (box.classList.contains('full')) requestAnimationFrame(() => fit());
  }
  function drawTray() {
    const un = plants().filter(p => !p.pos && SP[p.sp]);
    el('planTray').closest('.plan-card').hidden = !un.length; // Con todas colocadas, la caja «Sin colocar» desaparece
    el('planTray').innerHTML = un.length ? un.map(p => `<button type="button" class="g-${GCOL[SP[p.sp].g] || 'ali'}" data-place="${esc(p.id)}"><span class="dot">${ab(SP[p.sp])}</span>${esc(p.name)}</button>`).join('')
      : `<p class="note">Todas tus plantas están colocadas${all.list.length > 1 ? ' en tus huertos' : ' en el plano'}.</p>`;
  }
  function drawInfo() {
    const card = el('planInfo'), b = pl.beds.find(x => x.id === sel), p = plants().find(x => x.id === sel);
    if (b && typing(card)) return;
    if (b) {
      const kids = placed().filter(q => holder(q) === b);
      const opts = b.k === 'pot' ? POTS.map(([v, l]) => `<option value="${v}"${v === b.w ? ' selected' : ''}>${l}</option>`).join('')
        : '';
      card.innerHTML = `<p class="k">${b.k === 'pot' ? 'Maceta' : 'Bancal'}</p>
        <label class="pf">Nombre<input id="planName" maxlength="30" value="${esc(b.name)}"></label>
        ${b.k === 'pot' ? `<label class="pf">Tamaño<select id="planSize">${opts}</select></label>`
          : `<div class="pf"><span>Tamaño</span><span class="pf-size"><input id="planBW" inputmode="decimal" value="${num(b.w)}" aria-label="Ancho del bancal en metros"> × <input id="planBH" inputmode="decimal" value="${num(b.h)}" aria-label="Largo del bancal en metros"> m</span></div>`}
        <p class="sub kids">${kids.length ? 'Tiene ' + kids.map(q => esc(q.name)).join(', ') : (b.k === 'pot' ? 'Vacía' : 'Vacío') + '. Arrastra una planta dentro.'}</p>
        <div class="row rm"><button class="btn del" type="button" id="planRm">Quitar ${b.k === 'pot' ? 'maceta' : 'bancal'}</button></div>`;
      if (el('planSize')) ctx.enhance?.(el('planSize'));
      return;
    }
    if (!p || !p.pos) {
      card.innerHTML = `<p class="k">Plano</p><p class="sub">Toca una planta para ver dónde está y si tiene cerca alguna con la que se lleve mal. Toca un bancal o una maceta para cambiar su nombre o su tamaño.</p>`;
      return;
    }
    const s = SP[p.sp], r = REL[p.sp], near = placed().filter(q => q !== p && dist(p.pos, q.pos) <= NEAR);
    const bad = near.filter(q => r.bad.has(q.sp)), good = near.filter(q => r.good.has(q.sp)), h = holder(p);
    card.innerHTML = `<p class="k">${s.tree ? 'Frutal' : 'Planta'}</p><h3>${esc(p.name)}</h3>
      <p class="sub">${h ? `En ${esc(h.name)}` : 'En el suelo'}${s.tree && h?.k === 'pot' && h.w < .8 ? ' · un árbol necesita una maceta grande, de 80 cm o más' : ''}</p>
      ${(late => late?.length ? `<p class="alert">Atrasado: ${late.join(', ')}.</p>` : '')(ctx.overdue?.(p))}
      ${bad.length ? `<p class="alert">Tiene cerca ${bad.map(q => esc(q.name)).join(' y ')}, a menos de ${num(NEAR)} m, y no se llevan bien. Mejor separarlas.</p>` : ''}
      ${good.length ? `<p class="sub good">Buena compañía cerca: ${good.map(q => esc(q.name)).join(', ')}.</p>` : ''}
      ${s.tree ? `<p class="sub">El círculo de puntos es la copa: lo que pongas debajo tendrá sombra.</p>` : ''}
      ${all.list.length > 1 ? `<label class="pf">Pasar a otro huerto<select id="planMove"><option value="">Elige huerto</option>${all.list.filter(x => x !== pl).map(x => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('')}</select></label>` : ''}
      <div class="row"><button class="btn act" type="button" id="planOpen">Ver ficha</button><button class="btn" type="button" id="planOut">Sacar del plano</button></div>`;
    if (el('planMove')) ctx.enhance?.(el('planMove'));
  }

  // Arrastrar con el dedo o el ratón. Al mover un bancal o una maceta, sus plantas van con él.
  const at = e => { const r = plan.getBoundingClientRect(); return {x: (e.clientX - r.left) / r.width * pl.w, y: (e.clientY - r.top) / r.height * pl.h}; };
  plan.addEventListener('pointerdown', e => {
    const t = e.target.closest('.pi'); if (!t) { sel = null; draw(); return; }
    e.preventDefault(); // que no se seleccione texto al arrastrar
    const id = t.dataset.pid, b = pl.beds.find(x => x.id === id), p = plants().find(x => x.id === id);
    const o = b || p.pos, m = at(e);
    const kids = b ? placed().filter(q => holder(q) === b).map(q => ({q, dx: q.pos.x - b.x, dy: q.pos.y - b.y})) : [];
    drag = {o, b, kids, dx: m.x - o.x, dy: m.y - o.y, id: e.pointerId, moved: false};
    sel = id; plan.setPointerCapture(e.pointerId); draw();
  });
  plan.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const m = at(e), {o, b} = drag, w = b ? b.w : 0, h = b ? (b.k === 'pot' ? b.w : b.h) : 0;
    o.x = Math.max(0, Math.min(pl.w - w, Math.round((m.x - drag.dx) * 10) / 10));
    o.y = Math.max(0, Math.min(pl.h - h, Math.round((m.y - drag.dy) * 10) / 10));
    for (const k of drag.kids) k.q.pos = {x: +(o.x + k.dx).toFixed(2), y: +(o.y + k.dy).toFixed(2), h: pl.id};
    drag.moved = true; draw();
  });
  const end = () => { if (!drag) return; const {moved, b, kids} = drag; drag = null; if (moved) { if (b) save(); if (!b || kids.length) ctx.savePlants(); } draw(); };
  plan.addEventListener('pointerup', end); plan.addEventListener('pointercancel', end);
  plan.addEventListener('keydown', e => { const t = e.target.closest('.pi'); if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); sel = t.dataset.pid; draw(); plan.querySelector(`[data-pid="${CSS.escape(sel)}"]`)?.focus(); } });

  // Nueva pieza en un hueco libre arriba a la izquierda
  function free(w, h) {
    for (let y = .2; y + h <= pl.h; y += .5) for (let x = .2; x + w <= pl.w; x += .5)
      if (!pl.beds.some(b => x < b.x + b.w && x + w > b.x && y < b.y + (b.k === 'pot' ? b.w : b.h) && y + h > b.y)) return {x, y};
    return {x: 0, y: 0};
  }
  // Un sitio libre cerca del centro para la planta que se coloca, sin taparse con otras
  function spot() {
    const cx = pl.w / 2, cy = pl.h / 2, taken = placed().map(q => q.pos);
    for (let r = 0; r < Math.max(pl.w, pl.h); r += .6) for (let a = 0; a < 360; a += r ? 45 : 360) {
      const x = +(cx + r * Math.cos(a * Math.PI / 180)).toFixed(1), y = +(cy + r * Math.sin(a * Math.PI / 180)).toFixed(1);
      if (x >= .2 && y >= .2 && x <= pl.w - .2 && y <= pl.h - .2 && !taken.some(q => dist(q, {x, y}) < .5)) return {x, y, h: pl.id};
    }
    return {x: +cx.toFixed(1), y: +cy.toFixed(1), h: pl.id};
  }
  const nextName = (k, base) => { let n = pl.beds.filter(b => b.k === k).length + 1; while (pl.beds.some(b => b.name === `${base} ${n}`)) n++; return `${base} ${n}`; };
  el('planBed').addEventListener('click', () => { const {x, y} = free(2, 1); const b = {id: 'b' + Date.now(), k: 'bed', name: nextName('bed', 'Bancal'), x, y, w: 2, h: 1}; pl.beds.push(b); sel = b.id; save(); draw(); });
  el('planPot').addEventListener('click', () => { const {x, y} = free(.5, .5); const b = {id: 'm' + Date.now(), k: 'pot', name: nextName('pot', 'Maceta'), x, y, w: .5}; pl.beds.push(b); sel = b.id; save(); draw(); });
  el('planTray').addEventListener('click', e => {
    const t = e.target.closest('[data-place]'); if (!t) return;
    const p = plants().find(x => x.id === t.dataset.place); p.pos = spot(); sel = p.id; ctx.savePlants(); draw();
    ctx.toast(`${p.name} en el plano. Arrástrala a su sitio.`);
  });
  el('planInfo').addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.id === 'planOpen') ctx.openPlant(sel);
    if (t.id === 'planOut') { const p = plants().find(x => x.id === sel); delete p.pos; sel = null; ctx.savePlants(); draw(); }
    if (t.id === 'planRm') { const b = pl.beds.find(x => x.id === sel); pl.beds = pl.beds.filter(x => x !== b); sel = null; save(); draw(); ctx.toast(`Quitado del plano: ${b.name}`); }
  });
  el('planInfo').addEventListener('change', e => {
    if (e.target.id === 'planMove' && e.target.value) {
      const p = plants().find(x => x.id === sel), to = all.list.find(x => x.id === e.target.value);
      all.cur = to.id; pl = to; p.pos = spot(); save(); ctx.savePlants(); drawGardens(); draw();
      ctx.toast(`Movida a ${to.name}: ${p.name}`); return;
    }
    const b = pl.beds.find(x => x.id === sel); if (!b) return;
    if (e.target.id === 'planName') { b.name = e.target.value.trim().slice(0, 30) || b.name; save(); draw(true); }
    if (['planSize', 'planBW', 'planBH'].includes(e.target.id)) {
      // Medidas a mano: de 20 cm hasta lo que mida el huerto, en pasos de 10 cm
      const m = (v, max) => Math.max(.2, Math.min(max, Math.round((+String(v).replace(',', '.') || .2) * 10) / 10));
      if (b.k === 'pot') b.w = +e.target.value; else { b.w = m(el('planBW').value, pl.w); b.h = m(el('planBH').value, pl.h); }
      b.x = Math.min(b.x, Math.max(0, pl.w - b.w)); b.y = Math.min(b.y, Math.max(0, pl.h - (b.k === 'pot' ? b.w : b.h))); save(); draw(b.k === 'bed');
      if (b.k === 'bed') { el('planBW').value = num(b.w); el('planBH').value = num(b.h); }
    }
  });
  // Huertos: pestañas, nombre y medidas del que se está viendo
  const wIn = el('planW'), hIn = el('planH'), nIn = el('planGName');
  const drawSize = () => { const keep = document.activeElement; if (keep !== wIn) wIn.value = num(pl.w); if (keep !== hIn) hIn.value = num(pl.h); if (keep !== nIn) nIn.value = pl.name; el('planGRm').hidden = all.list.length < 2; };
  // Con varios huertos se elige en un desplegable; con uno solo basta el botón para añadir otro
  const gSel = el('planGSel'); ctx.enhance?.(gSel);
  function drawGardens() {
    gSel.innerHTML = all.list.map(x => `<option value="${esc(x.id)}"${x === pl ? ' selected' : ''}>${esc(x.name)}</option>`).join('');
    el('planGPick').hidden = all.list.length < 2; gSel._cselDraw?.();
    drawSize(); ctx.onGarden?.(pl);
  }
  // «Editar» abre nombre, medidas y «Quitar huerto»; «Listo» lo cierra
  const gBox = el('planGBox'), gEd = el('planGEdit');
  const editG = on => { gBox.hidden = !on; gEd.setAttribute('aria-pressed', on); gEd.setAttribute('aria-expanded', on); };
  gEd.addEventListener('click', () => editG(gBox.hidden));
  el('planGDone').addEventListener('click', () => editG(false));
  gSel.addEventListener('change', () => { all.cur = gSel.value; pl = current(); sel = null; save(); drawGardens(); draw(); });
  el('planGAdd').addEventListener('click', () => {
    let n = all.list.length + 1; while (all.list.some(x => x.name === `Huerto ${n}`)) n++;
    const g = {id: 'h' + Date.now(), name: `Huerto ${n}`, w: 4, h: 3, beds: []};
    all.list.push(g); all.cur = g.id; pl = g; sel = null; save(); drawGardens(); draw(); editG(true);
    nIn.focus(); nIn.select(); ctx.toast('Huerto nuevo: ponle nombre y medidas');
  });
  nIn.addEventListener('change', () => { pl.name = nIn.value.trim().slice(0, 30) || pl.name; save(); drawGardens(); });
  // Quitar un huerto en dos toques: el primero pide confirmación
  el('planGRm').addEventListener('click', e => {
    const b = e.currentTarget;
    if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = `¿Quitar ${pl.name}? Toca otra vez`; setTimeout(() => { delete b.dataset.sure; b.textContent = 'Quitar huerto'; }, 4000); return; }
    delete b.dataset.sure; b.textContent = 'Quitar huerto';
    const gone = pl; for (const p of plants()) if (p.pos && gardenOf(p) === gone.id) delete p.pos;
    all.list = all.list.filter(x => x !== gone); all.cur = all.list[0].id; pl = current(); sel = null;
    ctx.onRemoveGarden?.(gone.id, pl.id);
    save(); ctx.savePlants(); drawGardens(); draw(); editG(false); ctx.toast(`${gone.name} quitado. Sus plantas siguen en Mis plantas, sin colocar, y sus fotos pasan a ${pl.name}.`);
  });
  const setSize = () => { const c = v => Math.max(1, Math.min(60, Math.round((+String(v).replace(',', '.') || 1) * 10) / 10)); pl.w = c(wIn.value); pl.h = c(hIn.value); drawSize(); save(); draw(); };
  wIn.addEventListener('change', setSize); hIn.addEventListener('change', setSize);
  // Con el teclado abierto: la pantalla completa se ajusta a la parte que queda visible
  // y la casilla en la que se escribe se lleva al centro, para verla bien
  const vv = window.visualViewport;
  let kbTop = null, kbH = null, kbTimer = 0;
  // Solo se mueve si de verdad cambió lo visible (más de unos píxeles), y una sola vez por cambio, para que no tiemble
  function fitKeyboard() {
    // Se espera a que el teclado termine de abrirse antes de recolocar nada
    clearTimeout(kbTimer);
    kbTimer = setTimeout(() => {
      if (!vv) return;
      const body = box.querySelector('.plan-body');
      if (isFull()) {
        const t = Math.round(vv.offsetTop), h = Math.round(vv.height);
        if (kbTop === null || Math.abs(t - kbTop) > 4 || Math.abs(h - kbH) > 4) { kbTop = t; kbH = h; body.style.top = t + 'px'; body.style.height = h + 'px'; body.style.bottom = 'auto'; }
      } else if (kbTop !== null) { kbTop = kbH = null; body.style.top = body.style.height = body.style.bottom = ''; }
      const a = document.activeElement;
      if (a && a.tagName === 'INPUT' && box.contains(a)) {
        const r = a.getBoundingClientRect(), top = vv.offsetTop, bottom = top + vv.height;
        if (r.top < top + 8 || r.bottom > bottom - 8) a.scrollIntoView({block: 'center'});
      }
    }, 250);
  }
  vv?.addEventListener('resize', fitKeyboard);
  box.addEventListener('focusin', e => { if (e.target.tagName === 'INPUT') fitKeyboard(); });
  box.addEventListener('focusout', () => setTimeout(() => { if (!box.contains(document.activeElement)) fitKeyboard(); }, 100));
  // Al tocar un número se selecciona entero, para escribir el nuevo directamente
  box.addEventListener('focusin', e => { if (e.target.matches?.('#planW,#planH,#planBW,#planBH')) setTimeout(() => e.target.select(), 0); });
  box.addEventListener('toggle', () => draw());

  // Pantalla completa: el plano ocupa toda la pantalla; en Android además se gira a horizontal.
  // En iPhone no hay pantalla completa para webs, así que se amplía dentro de la app y se gira el móvil a mano.
  const fsBtn = el('planFull'), main = plan.parentElement;
  const isFull = () => box.classList.contains('full');
  function fit() {
    if (!isFull()) { plan.style.width = ''; return; }
    const r = main.getBoundingClientRect(), w = Math.floor(Math.min(r.width, r.height * pl.w / pl.h));
    if (Math.abs(w - parseFloat(plan.style.width || 0)) >= 2) { plan.style.width = w + 'px'; gridSize(); }
  }
  function setFull(on) {
    box.open = true; box.classList.toggle('full', on); document.documentElement.classList.toggle('plan-noscroll', on);
    fsBtn.textContent = on ? 'Salir' : 'Pantalla completa'; fsBtn.setAttribute('aria-pressed', on);
    if (on) {
      const req = box.requestFullscreen || box.webkitRequestFullscreen;
      try { Promise.resolve(req?.call(box)).then(() => screen.orientation?.lock?.('landscape')).catch(() => {}); } catch (e) {}
    } else if (document.fullscreenElement || document.webkitFullscreenElement) {
      try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) {}
    }
    const body = box.querySelector('.plan-body');
    if (!on) { body.style.top = body.style.height = body.style.bottom = ''; kbTop = kbH = null; }
    // Las ilustraciones del fondo de la app, también en pantalla completa
    let deco = box.querySelector('.plan-deco');
    if (on) { if (!deco) { deco = document.createElement('div'); deco.className = 'plan-deco'; deco.setAttribute('aria-hidden', 'true'); box.prepend(deco); } deco.innerHTML = document.getElementById('deco')?.innerHTML || ''; }
    else deco?.remove();
    draw(); requestAnimationFrame(fit);
  }
  fsBtn.addEventListener('click', () => setFull(!isFull()));
  const fsOff = () => { if (isFull() && !(document.fullscreenElement || document.webkitFullscreenElement)) setFull(false); };
  document.addEventListener('fullscreenchange', fsOff); document.addEventListener('webkitfullscreenchange', fsOff);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isFull()) setFull(false); });
  addEventListener('resize', () => requestAnimationFrame(fit));
  try { new ResizeObserver(() => fit()).observe(main); } catch (e) {}
  drawGardens();

  // Desde fuera: cuando cambian las plantas o llegan datos de otro dispositivo
  // El huerto que se está viendo, aunque aún no tenga nada dibujado
  const shot = g => { const ps = plants().filter(p => p.pos && gardenOf(p) === g.id && SP[p.sp]);
    return {name: g.name, w: g.w, h: g.h, n: ps.length, beds: g.beds.map(b => ({k: b.k, name: b.name, x: b.x, y: b.y, w: b.w, h: b.k === 'pot' ? b.w : b.h})),
      plants: ps.map(p => ({x: p.pos.x, y: p.pos.y, nm: p.name, sp: SP[p.sp].n, ab: ab(SP[p.sp]), g: GCOL[SP[p.sp].g] || 'ali', tree: !!SP[p.sp].tree, r: SP[p.sp].tree ? canopy(p, g) : 0}))}; };
  return {draw, current: () => shot(pl), reload() { all = load(); pl = current(); drawGardens(); if (sel && !pl.beds.some(b => b.id === sel) && !plants().some(p => p.id === sel)) sel = null; draw(); }};
}
