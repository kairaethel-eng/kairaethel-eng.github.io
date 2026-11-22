// Raum hinter der Tür (Entwurf „Tür · Raum“, 22.11.2026, Go Kai „a c“): Man steht am Empfang und sieht sich in vier Richtungen um.
// Jede Richtung zeigt ein Punkt-Motiv im Stil von Figur und Wirbelsäule (geordnete Punkte aus ../shared/raster.js, Kantenlicht aus der
// Flächen-Normale, Rückseite verdeckt), dazu ein ruhiges Bodenraster, das sich beim Umsehen mitdreht:
//   0 vorne  · Empfang: Tresen, aufgeschlagenes Terminbuch mit Bernstein-Lesezeichen, HOP-Kreise an der Wand
//   1 rechts · Uhr über der Wartebank – die Zeiger zeigen die echte Uhrzeit (Europe/Berlin)
//   2 hinten · Blick zurück zur Tür: Ablage mit Telefon (ein Bernstein-Punkt blinkt: Anrufbeantworter) und Papieren
//   3 links  · Fenster zur Straße: Gehweg, parkendes Auto, P-Schild, Bushaltestelle, Laterne, Häuser gegenüber
// Welt in Metern: Auge im Ursprung, Boden y = −1,2; Motiv k steht in Blickrichtung k · 90° im Abstand R. Lokal: x rechts, y oben,
// z vom Betrachter weg (Vorderseiten zeigen nach −z). Kein Zufall im ruhenden Bild – nur der Auftritt (Staub) nutzt feste Streuwerte.
import { surf, disc, torus, tube, line, seg } from '../shared/raster.js';

export const STATIONS = 4;
const R = 2.4, FLOOR = -1.2, ST = 9, WALL = 3.2, CEIL = 1.45; // Raum: Wände im Abstand WALL vom Standort, Decke bei CEIL
const WZ = WALL - R; // Wand in lokalen Maßen (z) – Dinge an der Wand stehen knapp davor // Punkt: x y z · nx ny nz · w · Farbe · Art (0 Fläche/Linie · 1 draußen (nur im Fenster) · 2 Leuchtpunkt)
export const PITCH0 = -0.2; // Blick leicht nach unten
const EYE_UP = 0.35; // Augenhöhe über der Grundlage der Maße (Tresen, Ablage und Bücher von oben sehen statt streifend)

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const hash = (i) => { const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };

// Schrift als Punkte (Buchstaben für Schilder): Zeichen auf eine kleine Zeichenfläche, dann geordnetes Raster abtasten
function glyphPts(txt, h, sp) {
  const px = 64, cv = document.createElement('canvas'); cv.width = px * txt.length; cv.height = px;
  const c = cv.getContext('2d'); if (!c) return [];
  c.fillStyle = '#fff'; c.font = `700 ${px * 0.86}px Archivo, Arial, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(txt, cv.width / 2, px * 0.54);
  const d = c.getImageData(0, 0, cv.width, cv.height).data, out = [], step = (sp / h) * px;
  for (let r = 0, y = step / 2; y < px; y += step * 0.866, r++) for (let x = (r & 1 ? step : step / 2); x < cv.width; x += step) {
    if (d[(Math.floor(y) * cv.width + Math.floor(x)) * 4 + 3] > 128) out.push([(x - cv.width / 2) / px * h, (px / 2 - y) / px * h]);
  }
  return out;
}
// HOP-Logo A (Maße wie die Kopfleiste, Buchstaben wie ../test-4/ordnung.js): Kreise r, Abstand r · 142/66
function inLetter(d, x, y) {
  const ax = Math.abs(x), ay = Math.abs(y), T = 7.75 / 66;
  if (d === 0) return (Math.abs(ax - 21.5 / 66) <= T && ay <= 31 / 66) || (ay <= T && ax <= 21.5 / 66);
  if (d === 1) { const rx = 25.5 / 66, ry = 23.25 / 66; return Math.hypot(x / (rx + T), y / (ry + T)) <= 1 && Math.hypot(x / (rx - T), y / (ry - T)) >= 1; }
  const sx = -18.5 / 66, bx = 5 / 66, by = 7.5 / 66, br = 15.75 / 66, yt = 23.25 / 66, yb = -8.25 / 66;
  if (Math.abs(x - sx) <= T && ay <= 31 / 66) return true;
  if (x >= sx && x <= bx && (Math.abs(y - yt) <= T || Math.abs(y - yb) <= T)) return true;
  return x >= bx && Math.abs(Math.hypot(x - bx, y - by) - br) <= T;
}

export function makeRoom() {
  let S = [], walls = null, floor = null, hands = null, handsKey = '', win = null, sp = 0.025;
  // lokale Punkte → Welt (Richtung k)
  const place = (k, A) => {
    const th = (k * Math.PI) / 2, c = Math.cos(th), s = Math.sin(th), out = new Float32Array(A.length);
    for (let i = 0; i < A.length; i += ST) {
      const lx = A[i], ly = A[i + 1], lz = A[i + 2] + R, nx = A[i + 3], nz = A[i + 5];
      out[i] = lx * c + lz * s; out[i + 1] = ly; out[i + 2] = -lx * s + lz * c;
      out[i + 3] = nx * c + nz * s; out[i + 4] = A[i + 4]; out[i + 5] = -nx * s + nz * c;
      out[i + 6] = A[i + 6]; out[i + 7] = A[i + 7]; out[i + 8] = A[i + 8];
    }
    return out;
  };
  function build(spacing) {
    sp = spacing;
    const P = [[], [], [], []];
    const add = (k, g, col = 0, w = 1, kind = 0, flat = false) => { const A = g.pts; for (let i = 0; i < A.length; i += 7) P[k].push(A[i], A[i + 1], A[i + 2], flat ? 0 : A[i + 3], flat ? 0 : A[i + 4], flat ? 0 : A[i + 5], A[i + 6] * w, col, kind); };
    const pt = (k, x, y, z, col, w, kind = 0) => P[k].push(x, y, z, 0, 0, 0, w, col, kind);
    const poly = (k, ps, s, col, w, kind = 0) => { for (let i = 0; i < ps.length - 1; i++) add(k, seg(ps[i], ps[i + 1], s, { half: i > 0 }), col, w, kind); };
    const rect = (k, x0, y0, x1, y1, z, s, col, w, kind = 0) => poly(k, [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [x0, y0, z]], s, col, w, kind);
    // ebene Fläche als ruhige Füllung: geordnetes Raster (jede zweite Zeile versetzt), ohne Kantenlicht
    const plane = (k, o, U, V, w, s = sp * 1.5, col = 0) => {
      const lu = Math.hypot(...U), lv = Math.hypot(...V), nu = Math.max(1, Math.round(lu / s)), nv = Math.max(1, Math.round(lv / (s * 0.866)));
      for (let j = 1; j < nv; j++) for (let i = (j & 1 ? 0.5 : 1); i < nu; i++) { const a = i / nu, b = j / nv; pt(k, o[0] + U[0] * a + V[0] * b, o[1] + U[1] * a + V[1] * b, o[2] + U[2] * a + V[2] * b, col, w); }
    };
    // Quader als Punkt-Zeichnung: Kanten von Vorderseite und Deckfläche als helle Perlen, beide Flächen als feine Füllung.
    // (Ebene Flächen mit Kantenlicht wirkten am Handy wie Schraffur – Kanten zeichnen die Form, die Füllung gibt ihr Körper.)
    const outl = (k, c, sz, o = {}) => {
      const x0 = c[0] - sz[0] / 2, x1 = c[0] + sz[0] / 2, y0 = c[1] - sz[1] / 2, y1 = c[1] + sz[1] / 2, z0 = c[2] - sz[2] / 2, z1 = c[2] + sz[2] / 2, L = o.l ?? 1, ls = sp * 0.6;
      poly(k, [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z0]], ls, 0, L);
      if (o.top !== false) poly(k, [[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]], ls, 0, L * 0.75);
      if (o.ff !== 0 && sz[1] > sp * 2) plane(k, [x0, y0, z0], [sz[0], 0, 0], [0, sz[1], 0], o.ff ?? 0.2);
      if (o.top !== false && o.ft !== 0) plane(k, [x0, y1, z0], [sz[0], 0, 0], [0, 0, sz[2]], o.ft ?? 0.3, sp * 1.3);
    };

    // ---- 0 vorne · Empfang ----
    outl(0, [0, -0.72, 0.25], [1.5, 0.96, 0.5], { top: false, l: 0.75, ff: 0.17 });
    outl(0, [0, -0.215, 0.22], [1.64, 0.05, 0.62], { ft: 0.26 });
    for (const x of [-0.25, 0.25]) add(0, seg([x, FLOOR + 0.12, -0.002], [x, -0.26, -0.002], sp * 0.7), 0, 0.3); // Fugen der Front
    add(0, seg([-0.7, FLOOR + 0.07, -0.01], [0.7, FLOOR + 0.07, -0.01], sp * 0.8), 2, 0.75); // warmes Licht unter dem Tresen
    for (const sg of [-1, 1]) { // aufgeschlagenes Terminbuch: zwei leicht gewölbte Seiten am Rücken
      const S0 = (u, v) => [0.12 + sg * 0.25 * u, -0.188 + 0.028 * Math.sin(Math.PI * Math.min(1, u * 1.15)), 0.08 + 0.21 * v];
      add(0, surf(S0, sp * 0.85, { out: () => [0, 1, 0], core: false }), 0, 0.95);
      for (let j = 0; j < 5; j++) { const v = 0.2 + j * 0.15; add(0, line((t) => { const u = 0.16 + 0.66 * t; const p = S0(u, v); return [p[0], p[1] + 0.006, p[2]]; }, sp * 0.62), 0, 0.42); }
    }
    poly(0, [[0.12, -0.17, 0.1], [0.13, -0.19, -0.075], [0.14, -0.43, -0.088]], sp * 0.55, 1, 0.95); // Lesezeichen
    { // HOP-Kreise an der Wand hinter dem Tresen
      const r = 0.17, step = r * 142 / 66, dr = sp * 0.95, cols = [5, 3, 4];
      for (let d = 0; d < 3; d++) {
        const cx = (d - 1) * step, cy = 0.42, z = WZ - 0.02;
        for (let j = 0; (j + 0.5) * dr < r; j++) {
          const rr = (j + 0.5) * dr, n = Math.max(1, Math.round((2 * Math.PI * rr) / dr));
          for (let q = 0; q < n; q++) { const a = ((q + (j & 1 ? 0.5 : 0)) / n) * 2 * Math.PI, x = Math.cos(a) * rr, y = Math.sin(a) * rr; if (!inLetter(d, x / r, y / r)) pt(0, cx + x, cy + y, z, cols[d], 0.5); }
        }
        const ls = dr * 0.6, lim = Math.ceil((0.55 * r) / ls);
        for (let gy = -lim; gy <= lim; gy++) for (let gx = -lim; gx <= lim; gx++) { const x = (gx + (gy & 1 ? 0.5 : 0)) * ls, y = gy * ls * 0.866; if (inLetter(d, x / r, y / r)) pt(0, cx + x, cy + y, z - 0.002, 0, 0.95); }
        const rr = r + dr * 0.3, n = Math.round((2 * Math.PI * rr) / (dr * 0.75));
        for (let q = 0; q < n; q++) { const a = (q / n) * 2 * Math.PI; pt(0, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, z, 0, 0.42); }
      }
    }

    // ---- 1 rechts · Uhr über der Wartebank ----
    const CL = [0, 0.16, WZ - 0.04];
    add(1, torus(CL, 0.36, 0.026, sp * 0.8, { axis: 'z' }), 0, 1);
    add(1, disc([CL[0], CL[1], CL[2] + 0.02], 0.33, sp * 1.7, { axis: 'z', flip: true }), 0, 0.5);
    for (let h = 0; h < 12; h++) { const a = (h / 12) * 2 * Math.PI, r0 = h % 3 ? 0.275 : 0.235, s = Math.sin(a), c = Math.cos(a); add(1, seg([CL[0] + s * r0, CL[1] + c * r0, CL[2] - 0.004], [CL[0] + s * 0.31, CL[1] + c * 0.31, CL[2] - 0.004], sp * 0.5), 0, h % 3 ? 0.7 : 1, 0, true); }
    outl(1, [0, -0.68, 0.38], [1.3, 0.05, 0.42], { ft: 0.28 });
    for (const x of [-0.56, 0.56]) for (const z of [0.22, 0.54]) add(1, seg([x, -0.71, z], [x, FLOOR, z], sp * 0.9), 0, 0.6);
    add(1, seg([-0.56, -0.98, 0.22], [0.56, -0.98, 0.22], sp * 0.9), 0, 0.4); // Querstrebe

    // ---- 2 hinten · Ablage mit Telefon, daneben die Tür, durch die Sie gekommen sind ----
    // Tür (weiter hinten, Blatt nach innen offen) – durch sie sind Sie gekommen
    const DZ = WZ, DX = 0.62;
    rect(2, DX, FLOOR, DX + 0.92, 0.85, DZ, sp * 0.7, 0, 0.85);
    rect(2, DX + 0.05, FLOOR, DX + 0.87, 0.8, DZ + 0.05, sp * 0.85, 0, 0.35);
    { const a = 0.55, ex = DX + Math.cos(a) * 0.86, ez = DZ - Math.sin(a) * 0.86; // Blatt um das linke Band geschwenkt
      poly(2, [[DX, FLOOR + 0.01, DZ], [ex, FLOOR + 0.01, ez], [ex, 0.78, ez], [DX, 0.78, DZ]], sp * 0.8, 0, 0.4); }
    for (let gz = 0; gz < 6; gz++) for (let gx = 0; gx < 6; gx++) { const z = DZ - 0.08 - gz * 0.15, x = DX + 0.1 + gx * 0.14 + (gz & 1 ? 0.07 : 0); if (x < DX + 0.9) pt(2, x, FLOOR + 0.003, z, 2, 0.4 * (1 - gz / 6)); } // Licht fällt durch die Tür
    // Ablage mit Telefon und Papieren
    outl(2, [-0.3, -0.45, 0.2], [1.15, 0.04, 0.46], { ft: 0.24 });
    for (const x of [-0.82, 0.22]) for (const z of [0.0, 0.4]) add(2, seg([x, -0.47, z], [x, FLOOR, z], sp * 0.8), 0, z ? 0.4 : 0.65);
    outl(2, [-0.5, -0.38, 0.14], [0.36, 0.1, 0.28], { ff: 0.22, ft: 0.3 }); // Telefon
    add(2, tube([{ p: [-0.66, -0.31, 0.2], r: 0.032 }, { p: [-0.5, -0.3, 0.2], r: 0.021 }, { p: [-0.34, -0.31, 0.2], r: 0.032 }], sp * 0.7), 0, 0.95);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) pt(2, -0.56 + c * 0.045, -0.329, 0.04 + r * 0.03, 0, 0.6); // Tasten
    pt(2, -0.37, -0.36, 0.0, 1, 1, 2); // Anrufbeantworter
    outl(2, [0.0, -0.418, 0.18], [0.3, 0.024, 0.36], { ft: 0.34, ff: 0 }); // Papiere (Verordnung)
    for (let j = 0; j < 5; j++) add(2, seg([-0.1, -0.404, 0.06 + j * 0.06], [0.1 - (j % 2) * 0.05, -0.404, 0.06 + j * 0.06], sp * 0.6), 0, 0.45);

    // ---- 3 links · Fenster zur Straße ----
    rect(3, -0.72, -0.44, 0.72, 0.58, WZ, sp * 0.65, 0, 0.95);
    rect(3, -0.66, -0.38, 0.66, 0.52, WZ + 0.04, sp * 0.8, 0, 0.45);
    add(3, seg([0, -0.38, WZ + 0.02], [0, 0.52, WZ + 0.02], sp * 0.65), 0, 0.85);
    outl(3, [0, -0.47, WZ - 0.05], [1.62, 0.04, 0.2], { ft: 0.3 });
    for (let i = 0; i < 11; i++) { const x = -0.5 + i * 0.1; add(3, seg([x, -0.62, WZ - 0.03], [x, -1.02, WZ - 0.03], sp * 0.8), 0, 0.42); } // Heizkörper
    add(3, seg([-0.55, -0.62, WZ - 0.03], [0.55, -0.62, WZ - 0.03], sp * 0.8), 0, 0.35);
    // draußen (nur im Fenster zu sehen, Art 1)
    const o = (x, z) => [x, FLOOR, z];
    add(3, seg(o(-7, 3.2), o(7, 3.2), sp * 2.2), 0, 0.55, 1); // Bordstein
    add(3, seg(o(-7, 6.6), o(7, 6.6), sp * 2.6), 0, 0.45, 1);
    for (let i = -7; i < 7; i += 1.2) add(3, seg(o(i, 4.9), o(i + 0.6, 4.9), sp * 2.4), 0, 0.35, 1); // Mittellinie
    poly(3, [[-2.3, FLOOR + 0.3, 3.9], [-2.3, FLOOR + 0.62, 3.9], [-1.95, FLOOR + 0.66, 3.9], [-1.65, FLOOR + 1.02, 3.9], [-0.75, FLOOR + 1.02, 3.9], [-0.42, FLOOR + 0.66, 3.9], [0.15, FLOOR + 0.6, 3.9], [0.15, FLOOR + 0.3, 3.9]], sp * 1.6, 0, 0.6, 1); // parkendes Auto
    for (const x of [-1.85, -0.25]) { const n = 14; const ps = []; for (let q = 0; q <= n; q++) { const a = (q / n) * 2 * Math.PI; ps.push([x + Math.cos(a) * 0.2, FLOOR + 0.22 + Math.sin(a) * 0.2, 3.9]); } poly(3, ps, sp * 1.5, 0, 0.55, 1); }
    add(3, seg(o(1.0, 3.0), [1.0, FLOOR + 1.55, 3.0], sp * 1.4), 0, 0.5, 1); // P-Schild
    rect(3, 0.76, FLOOR + 1.55, 1.24, FLOOR + 2.03, 3.0, sp * 1.2, 4, 0.85, 1);
    glyphPts('P', 0.38, sp * 1.05).forEach(([x, y]) => pt(3, 1.0 + x, FLOOR + 1.79 + y, 2.99, 0, 0.95, 1));
    add(3, seg(o(-3.4, 6.9), [-3.4, FLOOR + 2.2, 6.9], sp * 1.8), 0, 0.45, 1); // Haltestelle gegenüber
    { const ps = []; for (let q = 0; q <= 24; q++) { const a = (q / 24) * 2 * Math.PI; ps.push([-3.4 + Math.cos(a) * 0.3, FLOOR + 2.5 + Math.sin(a) * 0.3, 6.9]); } poly(3, ps, sp * 1.6, 0, 0.75, 1); }
    glyphPts('H', 0.4, sp * 1.5).forEach(([x, y]) => pt(3, -3.4 + x, FLOOR + 2.5 + y, 6.89, 0, 0.8, 1));
    add(3, seg(o(2.6, 3.0), [2.6, FLOOR + 3.4, 3.0], sp * 1.4), 0, 0.45, 1); // Laterne
    add(3, seg([2.6, FLOOR + 3.4, 3.0], [2.15, FLOOR + 3.4, 3.0], sp * 1.4), 0, 0.45, 1);
    for (let q = 0; q < 7; q++) pt(3, 2.17 + (q % 2) * 0.03, FLOOR + 3.33 - Math.floor(q / 2) * 0.03, 3.0, 2, 0.9, 1);
    for (let q = 0; q < 9; q++) { const x = 1.75 + q * 0.09; pt(3, x, FLOOR + 0.003, 3.05 - Math.abs(q - 4) * 0.04, 2, 0.4, 1); }
    [[-6.2, 3.4, 9.5], [-2.2, 3.6, 10.2], [1.6, 3.2, 9.6], [5.4, 3.8, 10]].forEach(([x, w, z]) => { // Häuser gegenüber
      const h = 3.2, top = 1.6;
      poly(3, [[x - w / 2, FLOOR, z], [x - w / 2, FLOOR + h, z], [x, FLOOR + h + top, z], [x + w / 2, FLOOR + h, z], [x + w / 2, FLOOR, z]], sp * 3, 0, 0.32, 1);
      for (let j = 0; j < 2; j++) for (let q = 0; q < 2; q++) { const wx = x - w * 0.22 + q * w * 0.44, wy = FLOOR + 0.9 + j * 1.3; if ((x * 7 + j * 3 + q) % 3 > 1.2) for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) pt(3, wx - 0.12 + a * 0.12, wy + b * 0.14, z - 0.01, 2, 0.5, 1); }
    });
    { const z = WZ + 0.04; win = place(3, new Float32Array([-0.66, -0.38, z, 0, 0, 0, 0, 0, 0, 0.66, -0.38, z, 0, 0, 0, 0, 0, 0, 0.66, 0.52, z, 0, 0, 0, 0, 0, 0, -0.66, 0.52, z, 0, 0, 0, 0, 0, 0])); }

    S = P.map((A, k) => place(k, new Float32Array(A)));
    // Bodenraster: ruhig, warm, dreht sich beim Umsehen mit
    const F = [], g = 0.3;
    for (let gz = -14; gz <= 14; gz++) for (let gx = -14; gx <= 14; gx++) {
      const x = (gx + (gz & 1 ? 0.5 : 0)) * g, z = gz * g * 0.866, r = Math.hypot(x, z);
      const w = smooth(0.9, 1.6, r) * (1 - smooth(2.4, 3.6, r));
      if (w > 0.02 && Math.abs(x) < WALL - 0.15 && Math.abs(z) < WALL - 0.15) F.push(x, FLOOR, z, 0, 0, 0, w * 0.4, 2, 0);
    }
    floor = new Float32Array(F);
    // Wände: Fugen zum Boden und zur Decke, senkrechte Ecken – beim Umsehen ziehen sie ruhig vorbei
    const Wp = [], wl = (a, b, s, w) => { const g = seg(a, b, s); for (let i = 0; i < g.pts.length; i += 7) Wp.push(g.pts[i], g.pts[i + 1], g.pts[i + 2], 0, 0, 0, w, 0, 0); };
    for (const [ax, az, bx, bz] of [[-1, 1, 1, 1], [1, 1, 1, -1], [1, -1, -1, -1], [-1, -1, -1, 1]]) {
      wl([ax * WALL, FLOOR + 0.004, az * WALL], [bx * WALL, FLOOR + 0.004, bz * WALL], sp * 1.5, 0.34);
      wl([ax * WALL, CEIL, az * WALL], [bx * WALL, CEIL, bz * WALL], sp * 2.2, 0.16);
      wl([ax * WALL, FLOOR, az * WALL], [ax * WALL, CEIL, az * WALL], sp * 1.6, 0.3);
    }
    walls = new Float32Array(Wp);
    handsKey = '';
  }
  function setHands(hh, mm) {
    const key = `${hh}:${mm}`; if (key === handsKey) return; handsKey = key;
    const A = [], arm = (ang, len, w) => { const g = seg([0, 0.16, WZ - 0.07], [Math.sin(ang) * len, 0.16 + Math.cos(ang) * len, WZ - 0.07], sp * 0.5); for (let i = 0; i < g.pts.length; i += 7) A.push(g.pts[i], g.pts[i + 1], g.pts[i + 2], 0, 0, 0, w, 0, 0); };
    arm(((hh % 12) + mm / 60) / 12 * 2 * Math.PI, 0.17, 1);
    arm((mm / 60) * 2 * Math.PI, 0.26, 1);
    for (let q = 0; q < 6; q++) { const a = (q / 6) * 2 * Math.PI; A.push(Math.cos(a) * 0.014, 0.16 + Math.sin(a) * 0.014, WZ - 0.075, 0, 0, 0, 1, 1, 0); }
    A.push(0, 0.16, WZ - 0.075, 0, 0, 0, 1, 1, 0);
    hands = place(1, new Float32Array(A));
  }

  // o: yaw, pitch (Bogenmaß), cx, cy (Bildmitte des Motivs), F (Brennweite in Bildpunkten), rIn 0…1 (Auftritt aus Staub), t (Uhr der Seite),
  //    rad (Punktgröße), pulse (Leuchtpunkt darf blinken), dim (gesamte Helligkeit)
  function draw(batch, o) {
    const cy0 = Math.cos(o.yaw), sy0 = Math.sin(o.yaw), cp = Math.cos(o.pitch), sp0 = Math.sin(o.pitch);
    const F = o.F, rad = o.rad, dim = o.dim, rIn = o.rIn;
    let PX = 0, PY = 0, PZ = 0;
    // Welt → Kamera → Bild; liefert false hinter der Kamera
    const proj = (x, y, z) => {
      y -= EYE_UP; const xc = x * cy0 - z * sy0, zc0 = x * sy0 + z * cy0, yc = y * cp - zc0 * sp0, zc = y * sp0 + zc0 * cp;
      if (zc < 0.25) return false;
      PX = o.cx + (xc * F) / zc; PY = o.cy - (yc * F) / zc; PZ = zc; return true;
    };
    let quad = null;
    const dust = rIn < 0.999;
    const run = (A, kOff) => {
      for (let i = 0, idx = 0; i < A.length; i += ST, idx++) {
        let x = A[i], y = A[i + 1], z = A[i + 2], a = A[i + 6], sz = rad;
        const kind = A[i + 8];
        if (dust) { // Auftritt: feiner Staub sammelt sich (feste Streuwerte je Punkt, kleine Punkte, höchstens 60 % deckend)
          const h = hash(idx + kOff), e0 = Math.min(1, Math.max(0, (rIn * 1.4 - h * 0.4))), e = e0 * e0 * (3 - 2 * e0), q = (1 - e) * (1 - e) * 1.4;
          x += (hash(idx * 3 + 1 + kOff) - 0.5) * q; y += (hash(idx * 5 + 2 + kOff) - 0.5) * q * 0.7; z += (hash(idx * 7 + 3 + kOff) - 0.5) * q;
          a *= Math.min(e < 0.98 ? 0.6 : 1, 0.15 + e); sz *= 0.65 + 0.35 * e;
        }
        if (!proj(x, y, z)) continue;
        const nx = A[i + 3], ny = A[i + 4], nz = A[i + 5];
        if (nx || ny || nz) { // Fläche: Rückseite weg, Kantenlicht
          const yu = y - EYE_UP, vx = x * cy0 - z * sy0, vz0 = x * sy0 + z * cy0, vy = yu * cp - vz0 * sp0, vz = yu * sp0 + vz0 * cp;
          const nxc = nx * cy0 - nz * sy0, nz0 = nx * sy0 + nz * cy0, nyc = ny * cp - nz0 * sp0, nzc = ny * sp0 + nz0 * cp;
          const d = (nxc * vx + nyc * vy + nzc * vz) / Math.hypot(vx, vy, vz);
          if (d > 0.02) continue;
          const edge = 1 + d; a *= 0.26 + 0.8 * Math.pow(edge, 2.2);
        }
        if (kind === 1) { if (!quad || !inQuad(PX, PY, quad)) continue; a *= 0.75; }
        if (kind === 2) { a = o.pulse ? 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(o.t * 2.4)) : 1; sz = rad * 1.9; }
        const depth = Math.min(1.25, Math.max(0.55, R / PZ));
        batch.put(PX, PY, sz * (kind === 1 ? Math.max(0.6, depth) : depth), a * dim, A[i + 7] + 10);
      }
    };
    const yawN = ((o.yaw % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    run(floor, 9000);
    run(walls, 8000);
    for (let k = 0; k < STATIONS; k++) {
      let dd = Math.abs(yawN - (k * Math.PI) / 2); dd = Math.min(dd, 2 * Math.PI - dd);
      if (dd > 1.75) continue; // weit außerhalb des Blicks
      if (k === 3) { quad = []; for (let c = 0; c < 4; c++) { if (!proj(win[c * ST], win[c * ST + 1], win[c * ST + 2])) { quad = null; break; } quad.push(PX, PY); } }
      run(S[k], k * 100000);
      if (k === 1 && hands) run(hands, 77777);
    }
  }
  function inQuad(x, y, q) { // konvexes Viereck, Umlaufsinn beliebig
    let s = 0;
    for (let i = 0; i < 4; i++) { const ax = q[i * 2], ay = q[i * 2 + 1], bx = q[((i + 1) % 4) * 2], by = q[((i + 1) % 4) * 2 + 1], c = (bx - ax) * (y - ay) - (by - ay) * (x - ax); if (c !== 0) { if (s === 0) s = Math.sign(c); else if (Math.sign(c) !== s) return false; } }
    return true;
  }
  return {
    build, draw, setHands,
    get count() { return S.reduce((n, A) => n + A.length / ST, 0) + (floor ? (floor.length + walls.length) / ST : 0); },
    get built() { return !!floor; },
  };
}
