// Studie 3 „Striche“: Die Zeichnung besteht aus einzelnen feinen Federstrichen. Zur nächsten Region lösen sie sich
// und bilden sich neu („verstreuen und neu bilden“ aus Puls – aber als Vektorstriche, gestochen scharf).
import { FIG, measure, at, SILHOUETTE, inside } from './figure.js';
import { clamp, smooth, lerp, svgEl, rng } from './util.js';

const CREAM = [240, 232, 216], AMBER = [227, 160, 67], BLUE = [143, 187, 208];

export function s3(root, opt) {
  const stage = root.querySelector('.stage'), svg = stage.querySelector('.plate'), tafel = stage.querySelector('.tafel');
  const next = root.querySelector('.next');
  svg.textContent = '';
  const paths = [CREAM, AMBER, BLUE].map(() => svgEl('path', { class: 'st' }, svg));
  let W = 0, H = 0, S = [], p = 0, q = opt.reduced ? 1 : 0, born = 0, last = 0, lastP = -1, lastQ = -1;

  // Bild aus Strichen: Linien werden in kurze Striche zerlegt, Schatten als Schraffur
  function drawing(box, lines, shade, bodies) {
    const r = rng(7 + lines.length), pad = 14;
    const sc = Math.min((W - 2 * pad) / (box[2] - box[0]), (H - 2 * pad - 20) / (box[3] - box[1]));
    const ox = (W - (box[2] - box[0]) * sc) / 2 - box[0] * sc, oy = pad + 12 - box[1] * sc;
    const out = [];
    for (const [L, col, step = 7] of lines) {
      const M = measure(L), tot = M[M.length - 1], su = step / sc;
      for (let d = su / 2; d < tot; d += su) {
        const [x, y, a] = at(L, M, d);
        if (y < box[1] - 4 || y > box[3] + 4 || x < box[0] - 4 || x > box[2] + 4) continue;
        out.push({ x: x * sc + ox + (r() - 0.5) * 0.5, y: y * sc + oy + (r() - 0.5) * 0.5, a: a + (r() - 0.5) * 0.06, l: step * (0.58 + 0.14 * r()), c: col || 0, k: 0 });
      }
    }
    const ang = -0.92, dx = Math.cos(ang), dy = Math.sin(ang), R = Math.hypot(W, H);
    for (let v = -R; v < R; v += 3.7) for (let u = -R; u < R; u += 7) {
      const px = W / 2 + u * dx - v * dy + (r() - 0.5) * 2, py = H / 2 + u * dy + v * dx + (r() - 0.5) * 2;
      const x = (px - ox) / sc, y = (py - oy) / sc;
      if (y < box[1] || y > box[3] || x < box[0] || x > box[2]) continue;
      let s = 0, col = 0;
      for (const b of bodies) if (inside(b, x, y)) { s = 0.85; col = 2; }
      if (!s && inside(SILHOUETTE, x, y)) for (const [bx, by, br, bs, y0 = 0] of shade) if (y > y0) s = Math.max(s, bs * clamp(1 - Math.hypot(x - bx, y - by) / br));
      if (r() < s) out.push({ x: px, y: py, a: ang + (r() - 0.5) * 0.07, l: 3.6 + 1.2 * r(), c: col, k: 1 });
    }
    return out;
  }

  function build() {
    W = stage.clientWidth; H = stage.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const D = FIG.detail, r = rng(41);
    const A = drawing([22, 28, 262, 300],
      [[FIG.front], [FIG.back], ...Object.entries(D).filter(([n]) => n !== 'clav').map(([n, L]) => [L, 0, /lid|cornea|iris|nostril|ala/.test(n) ? 3 : 5])],
      [[150, 308, 46, 1.25, 273], [219, 238, 22, 0.85]], []);
    const V = FIG.vert.slice(0, 7);
    const B = drawing([48, 126, 236, 338],
      [[FIG.front.filter((q) => q[1] > 201)], [FIG.back.filter((q) => q[1] > 140)], [D.ear, 0, 6], [D.earAnti, 0, 6], [D.earTragus, 0, 5], [D.scm, 0, 7], [FIG.mandible, 1, 5], ...FIG.skull.map((L) => [L, 2, 5]), ...FIG.teeth.map((L) => [L, 2, 3.4]), ...V.flatMap((v) => v.lines.map((L) => [L, 2, 4.2]))],
      [[150, 300, 44, 0.7]], V.filter((_, i) => i > 0).map((v) => v.lines[0]));
    // Paare bilden: Umriss zu Umriss, Schraffur zu Schraffur, Rest schrumpft oder wächst an Ort und Stelle
    const shuf = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const Ac = shuf(A.filter((s) => !s.k)), Ah = shuf(A.filter((s) => s.k)), Bc = shuf(B.filter((s) => !s.k)), Bh = shuf(B.filter((s) => s.k));
    const pairs = [];
    const take = (a, b) => { while (a.length && b.length) pairs.push([a.pop(), b.pop()]); };
    take(Ac, Bc); take(Ah, Bh); take(Ac, Bh); take(Ah, Bc);
    for (const a of [...Ac, ...Ah]) pairs.push([a, { ...a, x: a.x + (r() - 0.5) * 60, y: a.y + 30 + r() * 40, l: 0 }]);
    for (const b of [...Bc, ...Bh]) pairs.push([{ ...b, x: b.x + (r() - 0.5) * 60, y: b.y - 30 - r() * 40, l: 0, c: 0 }, b]);
    S = pairs.map(([a, b]) => {
      const th = r() * 6.283, m = 18 + r() * 60;
      let da = b.a - a.a; da -= Math.round(da / Math.PI) * Math.PI;   // Striche haben keine Richtung → kürzeste Drehung
      return { a, b, da, c: b.c, del: 0.34 * clamp(a.y / H) + 0.06 * r(), nx: Math.cos(th) * m, ny: Math.sin(th) * m * 0.7 + 26, spin: (r() - 0.5) * 2.6,
        ix: (r() - 0.5) * W * 1.1, iy: -40 - r() * H * 0.7, ia: (r() - 0.5) * 5, idel: 0.45 * r() };
    });
    lastP = -1; root.dataset.n = S.length;
  }
  const ro = new ResizeObserver(build); ro.observe(stage);
  build();

  function frame(t) {
    if (!born) born = t;
    const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
    const vh = innerHeight, nr = next.getBoundingClientRect();
    const raw = clamp((0.98 * vh - nr.top) / (0.5 * vh));
    if (opt.reduced) p = +(raw > 0.5); else { p += (raw - p) * (1 - Math.exp(-dt / 0.1)); if (Math.abs(raw - p) < 0.0005) p = raw; }
    if (!opt.reduced) q = clamp((t - born - 250) / 2100);
    if (p === lastP && q === lastQ) return;
    lastP = p; lastQ = q;
    const d = ['', '', ''];
    for (const s of S) {
      const e = smooth(clamp((p - s.del) / 0.6)), w = Math.sin(Math.PI * e);
      let x = lerp(s.a.x, s.b.x, e) + s.nx * w, y = lerp(s.a.y, s.b.y, e) + s.ny * w, a = s.a.a + s.da * e + s.spin * w;
      const l = lerp(s.a.l, s.b.l, e);
      if (q < 1) { const i = 1 - smooth(clamp((q - s.idel) / 0.55)), i2 = i * i; x += s.ix * i2; y += s.iy * i2; a += s.ia * i; }
      if (l < 0.3) continue;
      const cx = Math.cos(a) * l, cy = Math.sin(a) * l;
      d[s.c] += `M${(x - cx).toFixed(1)} ${(y - cy).toFixed(1)}L${(x + cx).toFixed(1)} ${(y + cy).toFixed(1)}`;
    }
    const k = smooth(clamp((p - 0.45) / 0.5));
    paths.forEach((el, i) => {
      el.setAttribute('d', d[i]);
      const c = [CREAM, AMBER, BLUE][i].map((v, j) => Math.round(lerp(CREAM[j], v, k)));
      el.style.stroke = `rgb(${c})`;
    });
    tafel.textContent = p > 0.5 ? 'Kiefer und Nacken' : 'Kopf';
    tafel.style.opacity = Math.abs(p - 0.5) * 2 > 0.6 ? 1 : 0;
  }
  return { frame, destroy() { ro.disconnect(); } };
}
