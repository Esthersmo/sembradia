// Tarjetas para compartir (imagen PNG) una planta o un huerto con su plano.
// Se dibujan en un canvas con la paleta de la app y se abren con el menú de compartir del móvil;
// si el navegador no puede compartir archivos, la imagen se descarga.
const W = 1080, H = 1350;
const C = {bg: '#EFEBE2', card: '#FDFBF8', line: '#C9D0B0', carob: '#725C3A', green: '#5F7651', matcha: '#809671', ink: '#3D3121', muted: '#7A6A55', soft: '#E4E9D3'};
const URL_TXT = 'esthersmo.github.io/sembradia';

async function fonts() {
  try {
    await Promise.all(['700 64px "Bricolage Grotesque"', '400 34px "DM Sans"', '500 34px "DM Sans"', '600 48px Fraunces', 'italic 600 48px Fraunces'].map(f => document.fonts.load(f)));
  } catch (e) {}
}
const img = src => new Promise(ok => { if (!src) return ok(null); const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
// Recorta la foto para que llene el hueco sin deformarse
function cover(c, im, x, y, w, h, r) {
  c.save(); rr(c, x, y, w, h, r); c.clip();
  const s = Math.max(w / im.width, h / im.height), iw = im.width * s, ih = im.height * s;
  c.drawImage(im, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); c.restore();
}
// Texto en varias líneas; devuelve la y final
function wrap(c, txt, x, y, maxW, lh, maxLines = 2, align = 'left') {
  const words = String(txt).split(' '); let line = '', n = 0; c.textAlign = align;
  for (let i = 0; i < words.length; i++) {
    const t = line ? line + ' ' + words[i] : words[i];
    if (c.measureText(t).width > maxW && line) {
      if (++n === maxLines) { let l = line; while (c.measureText(l + '…').width > maxW && l) l = l.slice(0, -1); c.fillText(l + '…', x, y); return y + lh; }
      c.fillText(line, x, y); y += lh; line = words[i];
    } else line = t;
  }
  c.fillText(line, x, y); return y + lh;
}
function frame(c, h = H) {
  c.fillStyle = C.bg; c.fillRect(0, 0, W, h);
  c.fillStyle = C.card; c.strokeStyle = C.line; c.lineWidth = 3; rr(c, 50, 50, W - 100, h - 100, 44); c.fill(); c.stroke();
}
function footer(c, h = H) {
  const y = h - 110;
  c.strokeStyle = C.line; c.lineWidth = 2; c.beginPath(); c.moveTo(100, y - 50); c.lineTo(W - 100, y - 50); c.stroke();
  c.textAlign = 'left'; c.fillStyle = C.ink; c.font = '600 46px Fraunces'; c.fillText('Sembra', 100, y);
  const w = c.measureText('Sembra').width; c.fillStyle = C.matcha; c.font = 'italic 600 46px Fraunces'; c.fillText('día', 100 + w, y);
  c.textAlign = 'right'; c.fillStyle = C.muted; c.font = '400 28px "DM Sans"'; c.fillText(URL_TXT, W - 100, y - 4);
}
function noPhoto(c, x, y, w, h, r, letter, deco) {
  c.fillStyle = C.soft; rr(c, x, y, w, h, r); c.fill();
  if (deco) { const s = Math.min(w, h) * .7 / Math.max(deco.width, deco.height); c.drawImage(deco, x + (w - deco.width * s) / 2, y + (h - deco.height * s) / 2, deco.width * s, deco.height * s); return; }
  c.fillStyle = C.matcha; c.textAlign = 'center'; c.font = `700 ${Math.round(h * .45)}px "Bricolage Grotesque"`; c.fillText(letter, x + w / 2, y + h * .65);
}
function toBlob(cv) { return new Promise(ok => cv.toBlob(ok, 'image/png')); }

async function send(cv, name, title, text) {
  const blob = await toBlob(cv); const file = new File([blob], name, {type: 'image/png'});
  if (navigator.canShare && navigator.canShare({files: [file]})) {
    const go = async () => { try { await navigator.share({files: [file], title, text}); return 'shared'; } catch (e) { return e.name === 'AbortError' ? 'cancel' : 'blocked'; } };
    // El móvil solo deja enviar justo después de un toque; si preparar la imagen tardó, se pide otro toque
    if (navigator.userActivation && !navigator.userActivation.isActive) return {again: go};
    const r = await go(); if (r !== 'blocked') return r;
    return {again: go};
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000); return 'downloaded';
}
const slug = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'planta';

// d: {name, species, loc, sownTxt, ageTxt, photo:{src, caption}|null, care:[texto], deco}
export async function sharePlant(d) {
  await fonts();
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  frame(c);
  const [ph, deco] = await Promise.all([img(d.photo?.src), img(d.deco)]);
  const px = 100, py = 100, pw = W - 200, ph_ = 700;
  if (ph) cover(c, ph, px, py, pw, ph_, 30); else noPhoto(c, px, py, pw, ph_, 30, d.species[0], deco);
  if (ph && d.photo.caption) {
    c.font = '500 30px "DM Sans"'; const t = d.photo.caption, tw = c.measureText(t).width + 44;
    c.fillStyle = 'rgba(253,251,248,.92)'; rr(c, px + 24, py + ph_ - 78, tw, 54, 27); c.fill();
    c.fillStyle = C.ink; c.textAlign = 'left'; c.fillText(t, px + 46, py + ph_ - 41);
  }
  let y = py + ph_ + 90;
  c.fillStyle = C.green; c.font = '700 66px "Bricolage Grotesque"'; y = wrap(c, d.name, px, y, pw, 72, 2);
  c.fillStyle = C.muted; c.font = '400 34px "DM Sans"'; c.textAlign = 'left'; c.fillText(`${d.species} · ${d.loc}`, px, y - 8); y += 50;
  c.fillStyle = C.ink; c.font = '500 32px "DM Sans"'; c.fillText(`${d.sownTxt} · ${d.ageTxt}`, px, y); y += 48;
  c.fillStyle = C.muted; c.font = '400 30px "DM Sans"';
  for (const t of d.care.slice(0, 1)) y = wrap(c, t, px, y, pw, 40, 2);
  footer(c);
  return send(cv, `sembradia-${slug(d.name)}.png`, d.name, d.text || `${d.name} (${d.species[0].toLowerCase()+d.species.slice(1)}) en mi huerto · Sembradía`);
}

// Un huerto: su foto (si la hay) y su plano. d: {title, zone, n, photo:{src, date}|null, plan:{w, h, beds, plants}}
export async function shareGardenPlan(d) {
  await fonts();
  const ph = await img(d.photo?.src), PW = W - 200, phH = ph ? 640 : 0;
  const planH = Math.min(760, PW * d.plan.h / d.plan.w);
  const tY = ph ? 100 + phH + 95 : 180, planY = tY + 120;
  const HH = Math.max(H, planY + planH + 220);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = HH; const c = cv.getContext('2d');
  frame(c, HH);
  if (ph) {
    cover(c, ph, 100, 100, PW, phH, 30);
    c.font = '500 30px "DM Sans"'; const t = d.photo.date, tw = c.measureText(t).width + 44;
    c.fillStyle = 'rgba(253,251,248,.92)'; rr(c, 124, 100 + phH - 78, tw, 54, 27); c.fill();
    c.fillStyle = C.ink; c.textAlign = 'left'; c.fillText(t, 146, 100 + phH - 41);
  }
  c.textAlign = 'left'; c.fillStyle = C.green; c.font = '700 66px "Bricolage Grotesque"'; wrap(c, d.title, 100, tY, PW, 72, 1);
  c.fillStyle = C.muted; c.font = '400 34px "DM Sans"';
  c.fillText([`${d.plan.w} × ${d.plan.h} m`, d.n ? `${d.n} ${d.n === 1 ? 'planta' : 'plantas'}` : '', d.zone].filter(Boolean).join(' · '), 100, tY + 53);
  drawPlan(c, d.plan, 100, planY, PW, planH);
  footer(c, HH);
  return send(cv, `sembradia-${slug(d.title)}.png`, d.title, `${d.title} en Sembradía`);
}

// El plano del huerto a escala, con los mismos colores que en la app
const PC = {ground: '#E7E1D3', grid: 'rgba(114,92,58,.15)', soil: '#B79A72', soilEdge: '#8C7148', pot: '#C98E68', potEdge: '#9E6A4A', canopy: 'rgba(128,150,113,.28)', canopyEdge: 'rgba(95,118,81,.6)',
  ali: '#809671', aro: '#B3B792', fru: '#D2AB80', orn: '#D9B3A5', for: '#C8BE8E'};
export function drawPlan(c, g, x0, y0, w0, h0) {
  const s = Math.min(w0 / g.w, h0 / g.h), w = g.w * s, h = g.h * s, x = x0 + (w0 - w) / 2, y = y0;
  c.save(); rr(c, x, y, w, h, 20); c.fillStyle = PC.ground; c.fill(); c.clip();
  c.strokeStyle = PC.grid; c.lineWidth = 2; c.beginPath();
  for (let i = 1; i < g.w; i++) { c.moveTo(x + i * s, y); c.lineTo(x + i * s, y + h); }
  for (let i = 1; i < g.h; i++) { c.moveTo(x, y + i * s); c.lineTo(x + w, y + i * s); }
  c.stroke();
  for (const b of g.beds) {
    if (b.k === 'pot') { const r = Math.max(10, b.w * s / 2); c.beginPath(); c.arc(x + (b.x + b.w / 2) * s, y + (b.y + b.w / 2) * s, r, 0, 7); c.fillStyle = PC.pot; c.fill(); c.lineWidth = 3; c.strokeStyle = PC.potEdge; c.stroke(); }
    else {
      rr(c, x + b.x * s, y + b.y * s, b.w * s, b.h * s, 12); c.fillStyle = PC.soil; c.fill(); c.lineWidth = 3; c.strokeStyle = PC.soilEdge; c.stroke();
      c.fillStyle = 'rgba(46,38,24,.6)'; c.font = '600 22px "Bricolage Grotesque"'; c.textAlign = 'left';
      const tw = c.measureText(b.name).width; if (tw + 20 < b.w * s) { rr(c, x + b.x * s + 8, y + b.y * s + 8, tw + 16, 30, 8); c.fill(); c.fillStyle = '#F6F3EE'; c.fillText(b.name, x + b.x * s + 16, y + b.y * s + 31); }
    }
  }
  for (const p of g.plants) if (p.tree) { c.beginPath(); c.arc(x + p.x * s, y + p.y * s, p.r * s, 0, 7); c.fillStyle = PC.canopy; c.fill(); c.setLineDash([8, 6]); c.lineWidth = 2; c.strokeStyle = PC.canopyEdge; c.stroke(); c.setLineDash([]); }
  for (const p of g.plants) {
    const r = p.tree ? 28 : 22, cx = x + p.x * s, cy = y + p.y * s;
    c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fillStyle = PC[p.g] || PC.ali; c.fill(); c.lineWidth = 3; c.strokeStyle = 'rgba(46,38,24,.35)'; c.stroke();
    c.fillStyle = '#2E2618'; c.font = `700 ${p.tree ? 20 : 17}px "Bricolage Grotesque"`; c.textAlign = 'center'; c.fillText(p.ab, cx, cy + 6);
  }
  c.restore(); rr(c, x, y, w, h, 20); c.lineWidth = 2; c.strokeStyle = C.line; c.stroke();
}
