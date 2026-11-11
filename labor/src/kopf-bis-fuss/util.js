export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
export const NS = 'http://www.w3.org/2000/svg';
export function svgEl(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.append(e);
  return e;
}
// fester Zufall (gleiche Zeichnung bei jedem Besuch)
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// Kamera: Bildschirm = Einheit · s + o. Die Zeichnung bleibt Vektor (viewBox), also in jeder Größe gestochen scharf.
export function setCam(svg, c, W, H) {
  svg.setAttribute('viewBox', `${(-c.ox / c.s).toFixed(2)} ${(-c.oy / c.s).toFixed(2)} ${(W / c.s).toFixed(2)} ${(H / c.s).toFixed(2)}`);
  svg.style.setProperty('--u', (1 / c.s).toFixed(4) + 'px');
}
export const mixCam = (a, b, t) => ({ s: lerp(a.s, b.s, t), ox: lerp(a.ox, b.ox, t), oy: lerp(a.oy, b.oy, t) });
export const BAR = 48; // Höhe der Studien-Leiste unten
