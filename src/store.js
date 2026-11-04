// Almacén clave-valor sobre IndexedDB con caché en memoria.
// La app lee de forma síncrona (como con localStorage) y las escrituras se guardan en segundo plano.
const DB_NAME = 'huerta-viva', STORE = 'kv';
const cache = new Map();
let db = null;

const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

export function openDB() {
  const r = indexedDB.open(DB_NAME, 1);
  r.onupgradeneeded = () => r.result.createObjectStore(STORE);
  return req(r);
}

export async function initStore() {
  try {
    db = await openDB();
    const t = db.transaction(STORE, 'readonly').objectStore(STORE);
    const [keys, vals] = await Promise.all([req(t.getAllKeys()), req(t.getAll())]);
    keys.forEach((k, i) => cache.set(k, vals[i]));
    // Primera vez: trae lo que hubiera guardado el prototipo en localStorage
    if (!cache.size) {
      try {
        for (const k of Object.keys(localStorage)) if (k.startsWith('hv.')) store.setItem(k, localStorage.getItem(k));
      } catch (e) {}
    }
    // Pide al navegador que no borre los datos si falta espacio
    navigator.storage?.persist?.().catch(() => {});
  } catch (e) {
    db = null; // Sin IndexedDB: se usa localStorage como antes
  }
}

// Avisos de cambios (los usa la sincronización con la nube)
const listeners = new Set();
export const onStoreChange = fn => listeners.add(fn);
const errFns = new Set();
export const onStoreError = fn => errFns.add(fn);

export const store = {
  getItem(k) {
    if (db) return cache.has(k) ? cache.get(k) : null;
    try { return localStorage.getItem(k); } catch (e) { return null; }
  },
  setItem(k, v) {
    v = String(v);
    if (db) {
      cache.set(k, v);
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(v, k);
      // Si el navegador se queda sin espacio, la escritura se cancela: se avisa para que la app lo diga
      tx.onabort = () => errFns.forEach(fn => fn(k, tx.error));
    } else localStorage.setItem(k, v);
    listeners.forEach(fn => fn(k));
  },
};
