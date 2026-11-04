// Avisos de riego y cuidados.
// La app guarda en el dispositivo la lista de próximas tareas (hv.sched) para que el
// service worker pueda avisar también con la app cerrada donde el navegador lo permite.
import { registerSW } from 'virtual:pwa-register';
import { store, onStoreChange } from './store.js';
import { cloudOn, client, currentUser, onCloud, onBeforeSignOut } from './cloud.js';
import { SUPABASE_URL } from './cloud-config.js';

const todayIso = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
let swReg = null, installEvt = null, pushOn = false, pushTimer = null;

export function dueToday(sched) {
  const t = todayIso();
  return sched.filter(x => x.date <= t).map(x => x.text);
}

export function summary(items) {
  if (!items.length) return '';
  const shown = items.slice(0, 3).join(', ');
  return items.length > 3 ? `${shown} y ${items.length - 3} más` : shown;
}

export function updateSchedule(items) {
  store.setItem('hv.sched', JSON.stringify(items));
  maybeNotify();
}

async function maybeNotify() {
  if (!swReg || !('Notification' in window) || Notification.permission !== 'granted') return;
  if (store.getItem('hv.notified') === todayIso()) return;
  // Si este dispositivo recibe los avisos del servidor, el de las 9:00 ya llega: no se manda otro al abrir la app
  if (store.getItem('hv.pushon') === '1') return;
  const items = dueToday(JSON.parse(store.getItem('hv.sched') || '[]'));
  if (!items.length) return;
  store.setItem('hv.notified', todayIso());
  swReg.showNotification('Sembradía · tareas de hoy', {
    body: summary(items), tag: 'hv-daily', icon: 'icons/icon-192.png', badge: 'icons/badge-96.png',
  });
}

async function registerPeriodic() {
  try {
    if (!swReg || !('periodicSync' in swReg)) return;
    const st = await navigator.permissions.query({ name: 'periodic-background-sync' });
    if (st.state === 'granted') await swReg.periodicSync.register('hv-daily', { minInterval: 12 * 3600e3 });
  } catch (e) {}
}

// ---- Avisos desde el servidor: llegan aunque la app esté cerrada (también en el iPhone). Necesitan cuenta ----
const canPush = () => cloudOn && swReg && 'PushManager' in window && 'Notification' in window && Notification.permission === 'granted';
const b64 = s => { const p = '='.repeat((4 - s.length % 4) % 4), r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, c => c.charCodeAt(0)); };
async function savePush(sub) {
  const c = await client();
  const sched = JSON.parse(store.getItem('hv.sched') || '[]');
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid';
  const {error} = await c.from('avisos').upsert({endpoint: sub.endpoint, sub: sub.toJSON(), sched, tz, updated_at: new Date().toISOString()}, {onConflict: 'endpoint'});
  if (error) throw error;
  // Los demás dispositivos de la misma cuenta se quedan con la misma lista: una tarea hecha aquí deja de avisar allí
  await c.from('avisos').update({sched}).eq('user_id', currentUser().id).neq('endpoint', sub.endpoint);
}
export async function enablePush() {
  if (!canPush() || !currentUser()) { pushOn = false; drawBox(); return; }
  try {
    let sub = await swReg.pushManager.getSubscription();
    if (!sub) {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/avisos`);
      const {publicKey} = await r.json();
      sub = await swReg.pushManager.subscribe({userVisibleOnly: true, applicationServerKey: b64(publicKey)});
    }
    await savePush(sub);
    pushOn = true; store.setItem('hv.pushon', '1');
  } catch (e) { console.warn('Avisos del servidor', e); pushOn = false; store.setItem('hv.pushon', '0'); }
  drawBox();
}
// Cada vez que cambian las próximas tareas, el servidor se queda con la lista nueva
// (aunque aquí no estén activados, se actualiza la lista de los otros dispositivos de la cuenta)
function schedChanged() {
  if (!cloudOn || !currentUser()) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    try {
      const sub = pushOn ? await swReg.pushManager.getSubscription() : null;
      if (sub) await savePush(sub);
      else await (await client()).from('avisos').update({sched: JSON.parse(store.getItem('hv.sched') || '[]')}).eq('user_id', currentUser().id);
    } catch (e) {}
  }, 3000);
}
async function disablePush() {
  try { const sub = await swReg?.pushManager.getSubscription(); if (sub) { const c = await client(); await c.from('avisos').delete().eq('endpoint', sub.endpoint); } } catch (e) {}
  pushOn = false; store.setItem('hv.pushon', '0');
}

const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function drawBox() {
  const box = document.getElementById('avisos');
  if (!box) return;
  const canNotify = 'Notification' in window && 'serviceWorker' in navigator;
  const perm = canNotify ? Notification.permission : 'unsupported';
  let txt, btns = '';
  if (perm === 'granted' && pushOn) txt = 'Avisos activados: cada mañana llegará un aviso con los riegos y cuidados del día, aunque tengas la app cerrada.';
  else if (perm === 'granted' && cloudOn && !currentUser()) txt = 'Avisos activados mientras usas la app. Para recibirlos también con la app cerrada, entra en tu cuenta con el botón de arriba.';
  else if (perm === 'granted') txt = 'Avisos activados: cada día llegará un aviso con los riegos y cuidados que toquen.';
  else if (perm === 'denied') txt = 'Los avisos están bloqueados. Puedes permitirlos en los ajustes del navegador para esta página.';
  else if (!canNotify && isIOS() && !standalone()) txt = 'Para recibir avisos en el iPhone, añade la app a tu pantalla de inicio desde el botón Compartir.';
  else if (!canNotify) txt = 'Este navegador no permite avisos.';
  else { txt = 'Recibe un aviso con los riegos y cuidados de cada día.'; btns += '<button class="btn act" data-notif>Activar avisos</button>'; }
  if (installEvt && !standalone()) btns += '<button class="btn primary" data-install>Instalar la app</button>';
  box.innerHTML = `<p>${txt}</p>${btns ? `<div class="avisos-btns">${btns}</div>` : ''}`;
}

export function setupNotify() {
  swReg = null;
  if ('serviceWorker' in navigator) {
    registerSW({
      immediate: true,
      onRegisteredSW(_url, reg) { swReg = reg || null; registerPeriodic(); maybeNotify(); if (currentUser()) enablePush(); },
    });
  }
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; drawBox(); });
  addEventListener('appinstalled', () => { installEvt = null; drawBox(); });
  document.addEventListener('click', async e => {
    if (e.target.closest('[data-notif]')) {
      await Notification.requestPermission();
      drawBox(); registerPeriodic(); maybeNotify(); enablePush();
    } else if (e.target.closest('[data-install]') && installEvt) {
      installEvt.prompt(); await installEvt.userChoice; installEvt = null; drawBox();
    }
  });
  onStoreChange(k => { if (k === 'hv.sched') schedChanged(); });
  // Al entrar en la cuenta se activan los avisos del servidor; al salir se quitan
  let was = null;
  onCloud((_s, u) => { const id = u?.id || null; if (id === was) return; was = id; if (id) enablePush(); else { pushOn = false; store.setItem('hv.pushon', '0'); drawBox(); } });
  onBeforeSignOut(disablePush);
  drawBox();
}
