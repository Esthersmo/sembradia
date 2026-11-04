// El tiempo real de la zona del huerto, de Open-Meteo (gratis y sin clave).
// Se guarda en el dispositivo (hv.wx) para funcionar sin conexión y se renueva cada pocas horas.
import {store} from './store.js';

const KEY = 'hv.wx', MAX_AGE = 3 * 3600e3;
export const RAIN_MM = 5;   // A partir de aquí la lluvia cuenta como un riego para las plantas de fuera
export const FROST_C = 2;   // Mínima a partir de la que hay riesgo de helada
export const HEAT_C = 35;   // Máxima a partir de la que hay calor fuerte

// Capitales de provincia, para quien no ha puesto código postal
const CAP = {
  almeria: [36.84, -2.46], cadiz: [36.53, -6.29], cordoba: [37.88, -4.78], granada: [37.18, -3.6], huelva: [37.26, -6.95], jaen: [37.78, -3.79],
  malaga: [36.72, -4.42], sevilla: [37.39, -5.98], huesca: [42.14, -0.41], teruel: [40.34, -1.11], zaragoza: [41.65, -0.88], asturias: [43.36, -5.85],
  baleares: [39.57, 2.65], laspalmas: [28.12, -15.43], tenerife: [28.47, -16.25], cantabria: [43.46, -3.81], albacete: [38.99, -1.86], ciudadreal: [38.99, -3.93],
  cuenca: [40.07, -2.14], guadalajara: [40.63, -3.17], toledo: [39.86, -4.02], avila: [40.66, -4.7], burgos: [42.34, -3.7], leon: [42.6, -5.57],
  palencia: [42.01, -4.53], salamanca: [40.97, -5.66], segovia: [40.95, -4.12], soria: [41.76, -2.46], valladolid: [41.65, -4.72], zamora: [41.5, -5.75],
  barcelona: [41.39, 2.17], girona: [41.98, 2.82], lleida: [41.62, 0.62], tarragona: [41.12, 1.25], alicante: [38.35, -0.48], castellon: [39.99, -0.05],
  valencia: [39.47, -0.38], badajoz: [38.88, -6.97], caceres: [39.48, -6.37], coruna: [43.36, -8.41], lugo: [43.01, -7.56], ourense: [42.34, -7.86],
  pontevedra: [42.43, -8.65], rioja: [42.47, -2.45], madrid: [40.42, -3.7], murcia: [37.99, -1.13], navarra: [42.81, -1.64], alava: [42.85, -2.67],
  bizkaia: [43.26, -2.93], gipuzkoa: [43.32, -1.98], ceuta: [35.89, -5.32], melilla: [35.29, -2.94],
};
export const capital = zone => CAP[zone] || CAP.sevilla;

export function loadWx() { try { return JSON.parse(store.getItem(KEY) || 'null'); } catch (e) { return null; } }
const near = (a, b) => a && b && Math.abs(a[0] - b[0]) < .01 && Math.abs(a[1] - b[1]) < .01;
export const isFresh = (wx, ll) => !!wx && near(wx.ll, ll) && Date.now() - wx.at < MAX_AGE;

export async function fetchWx(ll, alt) {
  const q = new URLSearchParams({
    latitude: ll[0], longitude: ll[1], timezone: 'auto', past_days: 3, forecast_days: 7,
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum',
  });
  if (alt != null) q.set('elevation', alt);
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?${q}`);
  if (!r.ok) throw new Error('tiempo');
  const d = (await r.json()).daily;
  const wx = {at: Date.now(), ll, days: d.time.map((t, i) => ({date: t, code: d.weather_code[i], max: d.temperature_2m_max[i], min: d.temperature_2m_min[i], rain: d.precipitation_sum[i] || 0}))};
  try { store.setItem(KEY, JSON.stringify(wx)); } catch (e) {}
  return wx;
}

// Último día con lluvia de verdad después de la fecha dada (y hasta hoy)
export function rainSince(wx, after, today) {
  let r = null;
  for (const d of wx?.days || []) if (d.date > after && d.date <= today && d.rain >= RAIN_MM) r = d;
  return r;
}
// Lluvia prevista en los dos próximos días
export function rainSoon(wx, today) {
  return (wx?.days || []).find(d => d.date > today && d.date <= plus(today, 2) && d.rain >= RAIN_MM) || null;
}
// Hoy cae algo de lluvia o hay chubascos, pero menos de lo que cuenta como riego
export function rainLite(wx, today) {
  const d = (wx?.days || []).find(x => x.date === today);
  return d && d.rain < RAIN_MM && (d.rain >= 0.5 || (d.code >= 80 && d.code <= 82)) ? d : null;
}
export const hotNow = (wx, today) => (wx?.days || []).some(d => d.date >= today && d.date <= plus(today, 1) && d.max >= HEAT_C);
export const coldest = (wx, today) => pick(wx, today, 3, (a, b) => a.min < b.min);
export const hottest = (wx, today) => pick(wx, today, 3, (a, b) => a.max > b.max);
export const next = (wx, today, n = 7) => (wx?.days || []).filter(d => d.date >= today).slice(0, n);

function pick(wx, today, n, better) {
  let r = null;
  for (const d of (wx?.days || []).filter(d => d.date >= today && d.date <= plus(today, n))) if (!r || better(d, r)) r = d;
  return r;
}
function plus(day, n) { const d = new Date(day + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

// Códigos WMO del tiempo → icono y texto
export function sky(code) {
  if (code === 0) return ['☀️', 'Despejado'];
  if (code <= 2) return ['🌤️', 'Poco nuboso'];
  if (code === 3) return ['☁️', 'Nublado'];
  if (code <= 48) return ['🌫️', 'Niebla'];
  if (code <= 57) return ['🌦️', 'Llovizna'];
  if (code <= 67) return ['🌧️', 'Lluvia'];
  if (code <= 77) return ['❄️', 'Nieve'];
  if (code <= 82) return ['🌦️', 'Chubascos'];
  if (code <= 86) return ['❄️', 'Nieve'];
  return ['⛈️', 'Tormenta'];
}
