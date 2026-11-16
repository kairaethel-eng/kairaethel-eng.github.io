// Entwurf „Tür“ (16.11.2026, Go Kai): gemeinsame Bausteine der beiden Varianten – Rechenhelfer, das Türblatt als
// gestochene Punktmenge (Umriss, zwei Kassetten, Körnung, Griff, Bänder) und ein Sammel-Zeichner für Canvas 2D.
// Bewusst ohne WebGL: läuft überall gleich, auch im Container und bei „ohne WebGL“.

export const TAU = Math.PI * 2;
export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const easeOut = (x) => 1 - Math.pow(1 - clamp01(x), 3.4); // nahe an cubic-bezier(.2,.9,.25,1) der Überschrift „offen.“
export const easeInOut = (x) => { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
// ruhige Kurven (16.11., Kai: „deutlich langsamer, entspannt“): weich anfahren, weich ankommen, kein Ruck in der Mitte
export const easeSine = (x) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(x));
export const easeCalm = (x) => 1 - Math.pow(1 - easeSine(x), 1.5); // wie easeSine, kommt etwas früher an und läuft lang aus
export const OPEN = (84 * Math.PI) / 180; // Öffnungswinkel wie „offen.“ (rotateY −84°)

// Zufall mit festem Startwert: jede Ladung zeigt dieselbe Tür
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Türblatt für eine Darstellung von pxW × pxH Bildpunkten. Je Punkt 7 Werte:
// u (0 = Band/Scharnier … 1 = Schloss-Seite), v (0 = Boden … 1 = oben), Helligkeit, Größe, Farbe (0 hell, 1 Bernstein), 2 Zufallswerte
export const LEAF_N = 7;
export function leafPoints(pxW, pxH, seed = 7) {
  const R = rng(seed), P = [];
  const add = (u, v, b, s, c = 0) => P.push(u, v, b, s, c, R(), R());
  const line = (u0, v0, u1, v1, step, b, s, c = 0, jit = 0.7) => {
    const len = Math.hypot((u1 - u0) * pxW, (v1 - v0) * pxH), n = Math.max(1, Math.round(len / step));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      add(u0 + (u1 - u0) * t + ((R() - 0.5) * jit) / pxW, v0 + (v1 - v0) * t + ((R() - 0.5) * jit) / pxH, b * (0.72 + 0.28 * R()), s, c);
    }
  };
  const rect = (u0, v0, u1, v1, step, b, s) => { line(u0, v0, u1, v0, step, b, s); line(u1, v0, u1, v1, step, b, s); line(u1, v1, u0, v1, step, b, s); line(u0, v1, u0, v0, step, b, s); };
  // Umriss
  rect(0, 0, 1, 1, 2.0, 1, 1.05);
  // zwei Kassetten: Rand in Bildpunkten überall gleich, Querfries bei 44 % der Höhe
  const mu = 0.15, mv = (mu * pxW) / pxH, rail = 0.44, in1 = 5 / pxW, in2 = 5 / pxH;
  const panels = [[mu, mv, 1 - mu, rail - mv * 0.5], [mu, rail + mv * 0.5, 1 - mu, 1 - mv]];
  panels.forEach(([u0, v0, u1, v1]) => {
    rect(u0, v0, u1, v1, 2.5, 0.78, 0.95);
    rect(u0 + in1, v0 + in2, u1 - in1, v1 - in2, 3.4, 0.42, 0.8);
  });
  // Körnung: gewürfeltes Raster, in den Kassetten etwas heller (wirkt leicht vertieft)
  const g = 6.6, nx = Math.max(1, Math.round(pxW / g)), ny = Math.max(1, Math.round(pxH / g));
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    if (R() > 0.82) continue;
    const u = (i + 0.15 + R() * 0.7) / nx, v = (j + 0.15 + R() * 0.7) / ny;
    const inP = panels.some(([u0, v0, u1, v1]) => u > u0 && u < u1 && v > v0 && v < v1);
    add(u, v, (inP ? 0.3 : 0.2) + R() * 0.22, 0.62 + R() * 0.3);
  }
  // Griff (Bernstein): Rosette, Drücker zum Band hin, Schlüsselloch
  const hu = 1 - mu * 0.5, hv = rail + 0.02, rr = 4.6;
  for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; add(hu + (Math.cos(a) * rr) / pxW, hv + (Math.sin(a) * rr) / pxH, 1, 1.1, 1); }
  line(hu, hv, hu - 17 / pxW, hv, 1.7, 1, 1.25, 1, 0.4);
  line(hu, hv - 11 / pxH, hu, hv - 15 / pxH, 1.6, 0.9, 1, 1, 0.3);
  // drei Bänder an der Scharnier-Seite
  [0.14, 0.5, 0.86].forEach((v) => line(0.012, v - 6 / pxH, 0.012, v + 6 / pxH, 1.8, 0.75, 1.1, 1, 0.3));
  return new Float32Array(P);
}

// Sammel-Zeichner: Punkte nach Farbe und Deckkraft-Stufe bündeln, je Bündel ein Pfad (wenige Füllaufrufe je Bild)
const COLS = ['237,232,220', '224,154,53', '255,211,150'];
const LV = 8;
export function makeBatch(ctx) {
  const B = COLS.map(() => Array.from({ length: LV }, () => []));
  return {
    put(x, y, r, a, c) {
      if (a <= 0.02 || r <= 0.05) return;
      B[c][Math.min(LV - 1, (a * LV) | 0)].push(x, y, r);
    },
    flush() {
      for (let c = 0; c < COLS.length; c++) for (let l = 0; l < LV; l++) {
        const q = B[c][l];
        if (!q.length) continue;
        ctx.fillStyle = `rgba(${COLS[c]},${((l + 0.6) / LV).toFixed(3)})`;
        ctx.beginPath();
        for (let i = 0; i < q.length; i += 3) {
          const x = q[i], y = q[i + 1], r = q[i + 2];
          if (r < 0.8) ctx.rect(x - r, y - r, r * 2, r * 2); else { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }
        }
        ctx.fill();
        q.length = 0;
      }
    },
  };
}
