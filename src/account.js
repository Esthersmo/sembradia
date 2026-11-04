// Ventana «Mi cuenta»: entrar con el correo y un código, ver el estado de la sincronización, salir o borrar la cuenta.
import {TURNSTILE_SITE_KEY} from './cloud-config.js';
import {listLinks, deleteLink, linkUrl} from './links.js';
import {cloudOn, initCloud, onCloud, currentUser, setMergeAsker, setOnLogin, googleEnabled, signInGoogle, sendCode, verifyCode, syncNow, signOut, deleteAccount} from './cloud.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
let links = null, linksOpen = false, linksErr = false;
let step = 'email', email = '', busy = false, msg = '', st = {state: 'off'}, ask = null, google = null, captcha = null;

// Captcha de Cloudflare Turnstile: casi siempre invisible; solo pide un clic si sospecha de un robot
let tsLoad = null;
function turnstile() {
  tsLoad = tsLoad || new Promise((ok, ko) => {
    const sc = document.createElement('script');
    sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    sc.async = true; sc.onload = () => ok(window.turnstile); sc.onerror = () => { tsLoad = null; ko(new Error('captcha')); };
    document.head.append(sc);
  });
  return tsLoad;
}
async function mountCaptcha() {
  const el = document.getElementById('acctCaptcha');
  if (!el) return;
  captcha = null;
  try {
    const ts = await turnstile();
    if (!el.isConnected) return;
    ts.render(el, {sitekey: TURNSTILE_SITE_KEY, language: 'es', appearance: 'interaction-only', callback: t => { captcha = t; }, 'expired-callback': () => { captcha = null; }});
  } catch (e) {}
}

function errText(e) {
  const m = (e?.message || String(e)).toLowerCase();
  if (m.includes('captcha')) return 'Se está comprobando que no eres un robot. Espera un momento y vuelve a pulsar.';
  if (m.includes('rate limit') || m.includes('security purposes')) return 'Has pedido varios códigos seguidos. Espera un poco y vuelve a intentarlo.';
  if (m.includes('expired') || m.includes('invalid') || m.includes('token')) return 'El código no es correcto o ha caducado. Revísalo o pide otro.';
  if (m.includes('email')) return 'Revisa que el correo esté bien escrito.';
  if (navigator.onLine === false || m.includes('fetch')) return 'No hay conexión. Inténtalo cuando vuelvas a tener internet.';
  return 'Algo ha fallado. Vuelve a intentarlo en un momento.';
}
function when(d) {
  if (!d) return '';
  const s = Math.round((Date.now() - d) / 1000);
  if (s < 60) return 'hace un momento';
  if (s < 3600) return `hace ${Math.round(s / 60)} min`;
  return `a las ${d.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}`;
}
function statusLine() {
  return {
    syncing: 'Sincronizando…',
    ok: `Todo guardado en la nube ${when(st.at)}.`,
    offline: 'Sin conexión. Tus cambios se guardan en este dispositivo y se subirán al volver internet.',
    error: {
      fotos: 'No se han podido subir tus fotos nuevas: cada cuenta guarda como mucho 500 fotos. Borra alguna foto antigua y se sincronizará sola.',
      huerto: 'Tu huerto ha llegado al tamaño máximo que se guarda en la nube. Borra plantas que ya no tengas y se sincronizará solo.',
    }[st.limite] || 'No se ha podido sincronizar. Se volverá a intentar en un momento.',
    idle: 'Conectando…',
  }[st.state] || '';
}

// Enlaces que se han compartido: copiar o borrar (al borrarlo, el enlace deja de funcionar)
function linksHtml() {
  if (linksErr) return '<p class="tip">No se han podido cargar. Vuelve a intentarlo con conexión.</p>';
  if (!links) return '<p class="tip">Cargando…</p>';
  if (!links.length) return '<p class="tip">Aún no has compartido nada con un enlace. Usa «Compartir» en la ficha de una planta o en las fotos de un huerto.</p>';
  const f = d => new Date(d).toLocaleDateString('es-ES', {day: 'numeric', month: 'short', year: 'numeric'});
  return `<p class="tip">Quien tenga el enlace ve lo que había al compartirlo. Si lo borras, deja de funcionar.</p><ul class="lklist">${links.map(l => `<li><div><b>${esc(l.titulo)}</b><small>${({huerto: 'Huerto', cosecha: 'Cosecha', cosechas: 'Cosechas del año'})[l.tipo] || 'Planta'} · ${f(l.creado)}</small></div>
    <button class="btn" type="button" data-lkcopy="${esc(l.id)}">Copiar</button><button class="btn warn" type="button" data-lkdel="${esc(l.id)}">Borrar</button></li>`).join('')}</ul>`;
}

export function initAccount({refresh, toast}) {
  if (!cloudOn) return;
  const btn = document.getElementById('acctBtn'), dlg = document.getElementById('acct'), body = document.getElementById('acctIn');
  btn.hidden = false;

  function draw() {
    const u = currentUser();
    // Cabecera (título, correo y estado) y ajustes fijos (aspecto, avisos y zona) van aparte del cuerpo, que se repinta
    document.getElementById('acctHd').innerHTML = `<div class="hd"><h2 id="acctTitle">Mi cuenta</h2>${ask ? '' : '<button class="x" type="button" id="acctClose" aria-label="Cerrar">×</button>'}</div>`
      + (u && !ask ? `<p class="who">${esc(u.email)}</p><p class="sync ${st.state}" role="status">${statusLine()}</p>` : '');
    document.getElementById('acctSet').hidden = !!ask;
    let h = '';
    if (ask) {
      const pl = n => `${n} ${n === 1 ? 'planta' : 'plantas'}`;
      h += `<p>En este dispositivo tienes <strong>${pl(ask.nl)}</strong> y en tu cuenta hay <strong>${pl(ask.nr)}</strong>. ¿Qué quieres hacer?</p>
        <div class="acform"><button class="btn primary" type="button" data-merge="cuenta">Quedarme solo con las de mi cuenta</button>
        <button class="btn" type="button" data-merge="juntar">Juntar las de aquí con las de mi cuenta</button></div>
        <p class="tip">Si eliges la cuenta, las plantas que hay ahora en este dispositivo se quitan y se cambian por las de tu cuenta.</p>`;
    } else if (u) {
      h += `<p class="tip">Tus plantas, riegos, fotos y tu zona se guardan en tu cuenta y aparecen en cualquier móvil u ordenador donde entres con este correo.</p>
        <div class="acts"><button class="btn" type="button" id="acctSync"${st.state === 'syncing' ? ' disabled' : ''}>Sincronizar ahora</button>
        <button class="btn" type="button" id="acctOut">Cerrar sesión</button></div>
        <details class="aclinks" id="acctLinks"${linksOpen ? ' open' : ''}><summary>Enlaces compartidos${links ? ` <small>${links.length}</small>` : ''}</summary>${linksHtml()}</details>
        <p class="tip"><a href="privacidad.html" target="_blank" rel="noopener">Política de privacidad</a></p>
        <details class="danger"><summary>Borrar mi cuenta</summary>
          <p class="tip">Se borran de la nube tu huerto y tus fotos, y no se puede deshacer. Lo que hay en este dispositivo se queda.</p>
          <button class="btn warn" type="button" id="acctDel">Borrar mi cuenta para siempre</button></details>`;
    } else if (step === 'email') {
      h += `<p>Entra con tu correo para guardar tu huerto en la nube y tenerlo en todos tus dispositivos. Si es la primera vez, la cuenta se crea sola.</p>
        <form id="acctForm" class="acform"><label for="acctEmail">Correo electrónico</label>
        <input id="acctEmail" type="email" autocomplete="email" inputmode="email" required value="${esc(email)}" placeholder="tu@correo.com">
        ${TURNSTILE_SITE_KEY ? '<div id="acctCaptcha" class="captcha"></div>' : ''}
        <button class="btn primary" ${busy ? 'disabled' : ''}>${busy ? 'Enviando…' : 'Enviarme un código'}</button></form>
        ${google ? `<p class="or">o</p><button class="btn gbtn" type="button" id="acctGoogle"><svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Entrar con Google</button>` : ''}
        <p class="tip">Sin contraseñas: cada vez que entres recibirás un código en el correo. Al entrar aceptas la <a href="privacidad.html" target="_blank" rel="noopener">política de privacidad</a>.</p>`;
    } else {
      h += `<p>Se ha enviado un código a <strong>${esc(email)}</strong>. Escríbelo aquí:</p>
        <form id="acctForm" class="acform"><label for="acctCode">Código</label>
        <input id="acctCode" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,10}" maxlength="10" required placeholder="123456">
        <button class="btn primary" ${busy ? 'disabled' : ''}>${busy ? 'Entrando…' : 'Entrar'}</button></form>
        <p class="tip">Si no lo ves, mira en la carpeta de correo no deseado (spam). <button class="lnk" type="button" id="acctBack">Cambiar de correo o pedir otro código</button></p>`;
    }
    if (msg) h += `<p class="acmsg" role="alert">${esc(msg)}</p>`;
    body.innerHTML = h;
    if (TURNSTILE_SITE_KEY && !u && !ask && step === 'email') mountCaptcha();
  }
  function open() {
    msg = ''; links = null; if (linksOpen && currentUser()) loadLinks();
    if (google === null) googleEnabled().then(g => { google = g; const i = document.getElementById('acctEmail'); if (i) email = i.value; if (dlg.open) draw(); });
    draw(); try { dlg.showModal(); } catch (e) { dlg.setAttribute('open', ''); } }

  btn.addEventListener('click', open);
  setOnLogin(() => toast('¡Dentro! Tu huerto ya se guarda en tu cuenta'));
  setMergeAsker((nl, nr) => new Promise(res => { ask = {nl, nr, res}; busy = false; if (!dlg.open) open(); else draw(); }));
  async function loadLinks() { linksErr = false; try { links = await listLinks(); } catch (e) { linksErr = true; } if (dlg.open) draw(); }
  // Al repintar, el «open» del nuevo <details> también lanza «toggle»: solo cuenta si cambia de verdad
  dlg.addEventListener('toggle', e => { if (e.target.id !== 'acctLinks' || e.target.open === linksOpen) return; linksOpen = e.target.open; if (linksOpen && !links) loadLinks(); }, true);
  dlg.addEventListener('click', async e => {
    const mg = e.target.closest('[data-merge]');
    if (mg && ask) { const r = ask.res; ask = null; draw(); r(mg.dataset.merge); return; }
    if (ask) return; // Hay que elegir antes de cerrar
    if (e.target === dlg || e.target.closest('#acctClose')) { dlg.close(); return; }
    if (e.target.closest('#acctGoogle')) { try { await signInGoogle(); } catch (err) { msg = errText(err); draw(); } return; }
    if (e.target.closest('#acctBack')) { step = 'email'; msg = ''; draw(); return; }
    if (e.target.closest('#acctSync')) { syncNow(); return; }
    const lc = e.target.closest('[data-lkcopy]');
    if (lc) { try { await navigator.clipboard.writeText(linkUrl(lc.dataset.lkcopy)); toast('Enlace copiado'); } catch (err) { toast('No se pudo copiar'); } return; }
    const ld = e.target.closest('[data-lkdel]');
    if (ld) {
      if (!ld.dataset.sure) { ld.dataset.sure = '1'; ld.textContent = '¿Seguro?'; setTimeout(() => { if (ld.isConnected) { delete ld.dataset.sure; ld.textContent = 'Borrar'; } }, 4000); return; }
      ld.disabled = true;
      try { await deleteLink(ld.dataset.lkdel); links = links.filter(l => l.id !== ld.dataset.lkdel); toast('Enlace borrado'); } catch (err) { toast('No se pudo borrar. Vuelve a intentarlo.'); }
      draw(); return;
    }
    if (e.target.closest('#acctOut')) { await signOut(); toast('Has cerrado sesión. Tus plantas siguen en este dispositivo.'); draw(); return; }
    if (e.target.closest('#acctDel')) {
      if (!confirm('¿Seguro que quieres borrar tu cuenta y todo lo guardado en la nube?')) return;
      try { await deleteAccount(); toast('Cuenta borrada'); dlg.close(); } catch (err) { msg = errText(err); draw(); }
    }
  });
  dlg.addEventListener('cancel', e => { if (ask) e.preventDefault(); });
  dlg.addEventListener('submit', async e => {
    e.preventDefault(); if (busy) return;
    const code = document.getElementById('acctCode')?.value.trim();
    if (step === 'email') email = document.getElementById('acctEmail').value.trim();
    const tok = captcha; // Se lee antes de repintar, que crea un captcha nuevo
    busy = true; msg = ''; draw();
    try {
      if (step === 'email') {
        if (TURNSTILE_SITE_KEY && !tok) throw new Error('captcha-pending');
        await sendCode(email, tok); step = 'code';
      } else {
        await verifyCode(email, code);
        step = 'email'; toast('¡Dentro! Tu huerto ya se guarda en tu cuenta');
      }
    } catch (err) { msg = errText(err); }
    busy = false; draw();
    (document.getElementById('acctCode') || document.getElementById('acctEmail'))?.focus();
  });

  onCloud((s, u) => { st = s; btn.classList.toggle('on', !!u); btn.title = u ? `Mi cuenta: ${u.email}` : 'Mi cuenta'; if (dlg.open) draw(); });
  initCloud(refresh).catch(e => console.warn('Cuenta', e));
}
