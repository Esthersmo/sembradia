import { precacheAndRoute, createHandlerBoundToURL, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';

self.skipWaiting();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
// Los enlaces compartidos (ver.html?id=…) se abren desde la copia guardada: sin conexión sale «No hay conexión» y no el error del navegador
registerRoute(({ request, url }) => request.mode === 'navigate' && url.pathname.endsWith('/ver.html'), createHandlerBoundToURL('ver.html'));
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html'), { denylist: [/privacidad\.html$/, /ver\.html/] }));
// Códigos postales: se descargan la primera vez que se usan
registerRoute(({ url }) => url.pathname.endsWith('/cp.json'), new StaleWhileRevalidate({ cacheName: 'cp' }));
// Tipografías de Google: disponibles sin conexión después de la primera visita
registerRoute(({ url }) => url.origin === 'https://fonts.googleapis.com', new StaleWhileRevalidate({ cacheName: 'fonts-css' }));
registerRoute(({ url }) => url.origin === 'https://fonts.gstatic.com', new CacheFirst({ cacheName: 'fonts' }));

// ---- Avisos diarios con la app cerrada (Chrome en Android con la app instalada) ----
const todayIso = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
function kv() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('huerta-viva', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
const get = (db, k) => new Promise(res => { const r = db.transaction('kv').objectStore('kv').get(k); r.onsuccess = () => res(r.result ?? null); r.onerror = () => res(null); });
const put = (db, k, v) => new Promise(res => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = res; t.onerror = res; });

async function dailyCheck() {
  const db = await kv();
  const t = todayIso();
  if (await get(db, 'hv.notified') === t) return;
  const items = JSON.parse((await get(db, 'hv.sched')) || '[]').filter(x => x.date <= t).map(x => x.text);
  if (!items.length) return;
  await put(db, 'hv.notified', t);
  const shown = items.slice(0, 3).join(', ');
  await self.registration.showNotification('Sembradía · tareas de hoy', {
    body: items.length > 3 ? `${shown} y ${items.length - 3} más` : shown,
    tag: 'hv-daily', icon: 'icons/icon-192.png', badge: 'icons/badge-96.png',
  });
}
self.addEventListener('periodicsync', e => { if (e.tag === 'hv-daily') e.waitUntil(dailyCheck()); });

// Avisos que manda el servidor (iPhone y cualquier navegador, con la app cerrada)
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) {}
  e.waitUntil((async () => {
    try { await put(await kv(), 'hv.notified', d.date || todayIso()); } catch (err) {}
    await self.registration.showNotification(d.title || 'Sembradía', {
      body: d.body || '', tag: 'hv-daily', icon: 'icons/icon-192.png', badge: 'icons/badge-96.png',
    });
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL('./?tab=rem', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const c = list[0];
    if (c) { c.navigate(url).catch(() => {}); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
