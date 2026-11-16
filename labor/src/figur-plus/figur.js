// Entwurf „Figur plus“ (16.11.2026, Auftrag Kai): die Figur aus „Von Kopf bis Fuß“ mit deutlichen menschlichen Konturen,
// einem Gehirn im Kopf (Station 01) und einem Nervensystem, das aus dem Gehirn nach unten wächst – alles im Partikel-Stil.
// Koordinaten wie bisher: Grundriss 200 × 430, x nach rechts, y nach unten (Scheitel 11, Sohle 419), Körpermitte x = 100.
// Hier stehen: Umriss (eine Hälfte, gespiegelt), Körperlinien (Schlüsselbein, Rippenbogen …), Gehirn (Hälften mit Furchen,
// Kleinhirn), Nervenbahnen (Rückenmark, Armgeflecht, Zwischenrippennerven, Lenden-/Kreuzgeflecht, Ischias bis zu den Zehen),
// Stationen und die Punktwolke mit allen Angaben je Punkt. Puls und der Baustein src/kopf-fuss bleiben unberührt.
export const BODY_W = 200, BODY_H = 430;
export const CROWN = 11, SOLE = 419, SPLIT = 206; // SPLIT: hier teilt sich die Hauptbahn in beide Beine (Kreuzgeflecht)
const CX = 100;

// fester Zufall (gleiches Gehirn bei jedem Laden)
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

// Catmull-Rom durch Stützpunkte → feine Linie
function catmull(pts, steps = 8) {
  if (pts.length < 3) return pts.map((p) => p.slice());
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  out.push(pts[pts.length - 1].slice());
  return out;
}
// Linie mit laufender Länge
function measured(pts) {
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, len, total: len[len.length - 1] };
}
function atLen(m, s) {
  const { pts, len } = m;
  let lo = 0, hi = len.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (len[mid] <= s) lo = mid; else hi = mid; }
  const t = clamp((s - len[lo]) / Math.max(1e-6, len[hi] - len[lo]));
  const a = pts[lo], b = pts[hi];
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), b[0] - a[0], b[1] - a[1]];
}
// x an der Höhe y (Linie läuft in y nur in eine Richtung)
function xAt(pts, y) {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) return lerp(a[0], b[0], (y - a[1]) / (b[1] - a[1]));
  }
  return Math.abs(pts[0][1] - y) < Math.abs(pts[pts.length - 1][1] - y) ? pts[0][0] : pts[pts.length - 1][0];
}
const mirror = (pts) => pts.map((p) => [2 * CX - p[0], p[1]]);

// ---------- Umriss: rechte Hälfte von oben (Scheitel) bis in den Schritt, Abschnitte treffen sich an den Ecken ----------
// Maße nach dem Körper (1 cm ≈ 2,33 Einheiten bei 175 cm): Schulterbreite über die Deltamuskeln ~46 cm, Oberarm ~9 cm, Unterarm bis ~9 cm,
// Handgelenk ~5,5 cm, Hand 19 × 8,5 cm, Taille ~28 cm, Becken ~34 cm, Oberschenkel ~16 cm, Knie ~10 cm, Wade ~12 cm, Knöchel ~6,5 cm.
// Anatomische Grundstellung: Arme leicht abgespreizt, Handflächen nach vorn (Daumen außen), Füße nach vorn.
const HAND_C = [168.2, 214], HAND_T = 0.15; // Handgelenk-Mitte, Neigung der Hand (Bogenmaß, nach außen)
const hand = (hx, hy) => [HAND_C[0] + hx * Math.cos(HAND_T) + hy * Math.sin(HAND_T), HAND_C[1] - hx * Math.sin(HAND_T) + hy * Math.cos(HAND_T)]; // hx zum Daumen, hy zu den Fingerspitzen
const HAND = [[6.2, 0], [7.8, 3.6], [10, 7.4], [12.6, 11.4], [15, 15.6], [16.8, 19.6], [17.2, 22.4], [15.8, 23.6], [14, 21.6], [12, 18.6], [10.5, 17.6], [10.1, 20.4], [10.4, 26], [10.2, 33],
  [9.6, 38.4], [8.2, 40.6], [6.6, 40], [5.6, 37.4], [5.3, 40.6], [3.8, 43.4], [1.8, 43.2], [0.6, 40.4], [0.5, 38], [0.2, 39.6], [-1.2, 41.4], [-3, 41], [-4, 38.4], [-4.3, 34.8],
  [-4.7, 34.6], [-5.8, 35.8], [-7.4, 35.4], [-8.4, 33], [-8.8, 29], [-9, 22], [-8.8, 14], [-8, 7], [-6.8, 2.6], [-6.2, 0]].map((p) => hand(p[0], p[1]));
const HALF = [
  // Schädel, Ohr, Kiefer, Hals, Kapuzenmuskel, Deltamuskel, Arm außen bis zum Handgelenk (Speichenseite)
  [[100, 11], [106.4, 11.7], [112.2, 14.4], [116.2, 19], [118.2, 25], [118.4, 30.4], [117.6, 34], [118.8, 34.6], [120.8, 36.6], [121.2, 40.6], [120, 44.6], [117.8, 46.2], [117.2, 49.4], [115.6, 53.6], [112.8, 57.6], [110.6, 60.6],
    [110, 64], [110.4, 68], [112, 71.4], [116.4, 74.6], [123, 77.6], [130.6, 80.2], [136.6, 82.6], [141.2, 84.6], [146.4, 87.6], [150.8, 92.6], [153.8, 99.2], [155.4, 106.8], [156.2, 113], [156.9, 119.6], [158.8, 127], [161.5, 137], [163.6, 147], [165.1, 155],
    [167.6, 162], [169.8, 171], [170.9, 181], [171.7, 192], [172.7, 203], HAND[0]],
  // Hand: Daumenballen, Daumen, vier Fingerkuppen, Kleinfingerballen
  HAND,
  // Arm innen: Elle, Beuger, Ellenbogen innen, Bizeps bis zur Achselfalte
  [HAND[HAND.length - 1], [158.6, 204], [155.2, 192], [151.8, 180], [148.8, 170], [147.9, 163.4], [148.2, 157.4], [146.9, 150], [144.9, 140], [142.6, 131], [138.6, 122.6]],
  // Rumpf: breiter Rückenmuskel, Brustkorb, Taille, Beckenkamm, Rollhügel; Bein außen: Oberschenkel, Knie, Wadenbeinkopf, Wade, Außenknöchel, Fuß
  [[138.6, 122.6], [137.9, 132], [135.7, 144], [133.3, 156], [132, 166], [132.7, 174], [135.3, 183], [137.6, 194], [139.4, 206], [140, 216], [139.7, 236], [137.8, 258], [134.8, 280], [132.4, 296], [131.5, 306], [131.8, 314], [132.7, 320], [134.2, 338], [133, 356], [129.5, 376], [126.7, 390], [126.9, 398], [129.3, 404], [132.3, 410], [133.5, 414.8], [131.4, 418]],
  // Zehen (von der kleinen zur großen)
  [[131.4, 418], [129.6, 419], [127.8, 417.8], [125.8, 419.1], [123.8, 417.8], [121.6, 419.1], [119.4, 417.8], [116.8, 419.1], [114.6, 417.6], [111.6, 419.1], [108.8, 418]],
  // Fuß innen, Innenknöchel (höher als außen), Wade innen (tiefer und kräftiger als außen), Knie, Oberschenkel innen bis in den Schritt
  [[108.8, 418], [107.7, 414.4], [108.7, 409], [110.2, 402], [110.5, 395], [111.5, 388], [109.7, 374], [106.9, 356], [105.8, 338], [108.2, 321], [108.9, 312], [107.8, 304], [106.3, 294], [106.6, 284], [104.6, 268], [102.6, 250], [101.2, 236], [100, 229.4]],
];
const SEG = HALF.map((s) => catmull(s, 6));
const RIGHT = SEG.reduce((a, s, i) => a.concat(i ? s.slice(1) : s), []);
export const OUTLINE = RIGHT.concat(mirror(RIGHT).reverse().slice(1, -1)); // geschlossene Kontur
const f1 = (n) => n.toFixed(1);
const pathD = (pts, close) => pts.map((p, i) => `${i ? 'L' : 'M'}${f1(p[0])} ${f1(p[1])}`).join('') + (close ? 'Z' : '');
export const OUTLINE_D = pathD(OUTLINE, true);
export const BODY_SVG = `<path d="${OUTLINE_D}"/>`;
// Arm, Bein, Rumpf: Rand an der Höhe y (für Bahnen, die sicher im Körper liegen)
const armOut = (y) => xAt(SEG[0], y), armIn = (y) => xAt(SEG[2], y);
const sideOut = (y) => xAt(SEG[3], y), legIn = (y) => xAt(SEG[5], y);

// ---------- Körperlinien (Oberflächen-Anatomie, fein): rechte Seite, wird gespiegelt; „mid“ = nur einmal ----------
// [Helligkeit, Punkte]: kräftig = Knochenpunkte und große Muskelränder, zart = Muskelteilungen. Die Linien treten zurück, sobald die Nerven wachsen.
const ring = (cx, cy, rx, ry, n = 14) => Array.from({ length: n + 1 }, (_, k) => [cx + Math.cos(k / n * 6.2832) * rx, cy + Math.sin(k / n * 6.2832) * ry]);
const H = (pts) => pts.map((p) => hand(p[0], p[1]));
const CREASE_R = [
  [0.6, [[115.6, 53.6], [112.4, 58.2], [107.6, 61.8], [103, 63.4], [100, 63.6]]],                        // Kiefer und Kinn
  [0.42, [[111.6, 56.6], [108.4, 64], [104.6, 72.6], [101.6, 80.4]]],                                    // Kopfwender
  [0.62, [[102.6, 81.6], [110, 81], [119, 82.2], [128, 84.4], [137, 86.4], [142, 86.2]]],                // Schlüsselbein
  [0.44, [[131, 87.6], [134.4, 96], [138, 105], [142.6, 113], [148.4, 119.6], [154.4, 122]]],            // Deltamuskel: vordere Rinne bis zum Ansatz
  [0.56, [[101.6, 113], [108, 118.6], [117, 120.4], [126, 117.8], [132.6, 111.6], [136.6, 104.6]]],      // großer Brustmuskel, Unterrand
  [0.5, [[101.4, 120], [106.6, 127], [114, 136], [122, 143.4], [129, 147]]],                             // Rippenbogen
  [0.36, [[114, 121.6], [116.6, 136], [117.4, 152], [116.4, 168], [112.6, 184], [107, 200]]],            // Rand des geraden Bauchmuskels
  [0.3, [[101, 133], [108, 132], [116.2, 134]]], [0.3, [[101, 146.6], [108.6, 145.6], [117, 147]]], [0.3, [[101, 160.6], [108.6, 160], [116.8, 161]]], // Zwischensehnen
  [0.28, [[135.4, 128], [130.6, 131.6]]], [0.28, [[134.6, 136.4], [129.6, 140]]], [0.28, [[133, 144.6], [128.2, 148]]], // Sägemuskel
  [0.56, [[136, 186], [127, 197], [116, 209.6], [106.4, 221.6], [101.4, 227.4]]],                        // Beckenkamm und Leiste
  [0.36, [[142.6, 126], [146.6, 134], [150.2, 144], [153.6, 153.6]]],                                    // Bizeps, innere Rinne
  [0.4, [[149.6, 158.8], [156, 160.6], [163, 158.6]]],                                                   // Ellenbeuge
  [0.3, [[162.6, 161], [165, 174], [167.6, 190], [169.8, 204]]],                                         // Oberarmspeichenmuskel
  [0.36, H([[-5.4, 0.6], [0, 1.6], [5.4, 0.4]])],                                                        // Handgelenk
  [0.4, H([[5.5, 37.4], [5.3, 30], [5.2, 23]])], [0.4, H([[0.5, 38], [0.4, 30], [0.4, 23]])], [0.4, H([[-4.3, 34.6], [-4.2, 28], [-4, 22.4]])], // Finger
  [0.38, H([[9.8, 17], [7.6, 12], [4.6, 7.4], [2, 3.6]])],                                               // Daumenballen
  [0.3, H([[9.4, 19.8], [4, 18.6], [-2, 19.6], [-8, 22]])],                                              // Handlinie
  [0.36, [[134.4, 191], [127, 214], [118, 244], [111.4, 272], [108.6, 294]]],                            // Schneidermuskel
  [0.3, [[131, 222], [129.4, 250], [126.4, 278], [124.6, 294]]],                                         // äußerer Schenkelmuskel
  [0.34, [[108.4, 282], [111.6, 290], [113.8, 298]]],                                                    // innerer Schenkelmuskel („Tropfen“)
  [0.56, ring(119.8, 303, 5.2, 6.2)],                                                                    // Kniescheibe
  [0.36, [[117, 309.4], [118.6, 316], [120, 318]]], [0.36, [[122.6, 309.4], [121.2, 316], [120, 318]]],  // Kniescheibenband
  [0.48, [[120, 318], [118.7, 340], [117.5, 364], [116.7, 386]]],                                        // Schienbeinkante
  [0.3, [[110.6, 328], [112.8, 346], [113.6, 364]]],                                                     // Wadenmuskel, innerer Rand
  [0.34, [[113, 396.6], [119, 399.6], [125, 399]]],                                                      // Sprunggelenk
  [0.3, [[127.8, 417.8], [127, 412.6]]], [0.3, [[123.8, 417.8], [123.4, 412]]], [0.3, [[119.4, 417.8], [119.4, 411.6]]], [0.3, [[114.6, 417.6], [115.2, 411.6]]], // Zehen
].map(([w, c]) => ({ w, pts: catmull(c, 6) }));
const CREASE_M = [[0.44, [[97.4, 81.6], [100, 83.4], [102.6, 81.6]]], [0.44, [[100, 85], [100, 116]]], [0.44, [[100, 121], [100, 171.6]]], [0.5, ring(100, 173.4, 1.5, 1.2, 10)]]
  .map(([w, c]) => ({ w, pts: c.length > 2 ? catmull(c, 4) : c }));
const CREASES = [...CREASE_R, ...CREASE_R.map((c) => ({ w: c.w, pts: mirror(c.pts) })), ...CREASE_M].map((c) => ({ ...measured(c.pts), w: c.w }));

// ---------- Gehirn (Ansicht von vorn): zwei Hälften mit Furchen, darunter Kleinhirn; Hirnstamm gehört zur Hauptbahn ----------
const HEMI_R = (() => {
  // Rand mit kleinen Buckeln (Windungen), seitlich die Furche über dem Schläfenlappen
  const m = measured(catmull([[100.7, 14.4], [104.6, 13.3], [109, 14.2], [112.8, 17.2], [115, 21.8], [116, 27], [115.7, 31.4], [114.7, 34.8], [114.9, 37.8], [113.3, 40.6], [110, 41.7], [107, 40.5], [104.6, 38.5], [102.5, 37.6], [100.7, 36.8]], 10));
  return m.pts.map((p, i) => {
    const a = m.pts[Math.max(0, i - 1)], b = m.pts[Math.min(m.pts.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const k = 0.42 * (Math.abs(Math.sin(m.len[i] * 1.32)) - 0.45) * sstep(0, 2.4, Math.min(m.len[i], m.total - m.len[i]));
    return [p[0] + (b[1] - a[1]) / l * k, p[1] - (b[0] - a[0]) / l * k];
  });
})();
const inPoly = (poly, x, y) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
};
const CEREB = { c: [106.2, 43.4], rx: 5.8, ry: 3.9 };
const inCereb = (x, y) => { const ex = (x - CEREB.c[0]) / CEREB.rx, ey = (y - CEREB.c[1]) / CEREB.ry; return ex * ex + ey * ey < 1; };
// Furchen: gewundene Linien, die Abstand voneinander halten (wachsen von zufälligen Startpunkten in beide Richtungen)
function sulci(seed) {
  const r = rng(seed), STEP = 0.3, MIN = 1.72, cell = 1.2, grid = new Map(), lines = [];
  const key = (x, y) => Math.floor(x / cell) * 1000 + Math.floor(y / cell);
  const near = (x, y, d, skip) => {
    const gx = Math.floor(x / cell), gy = Math.floor(y / cell), n = Math.ceil(d / cell);
    for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
      const l = grid.get((gx + i) * 1000 + gy + j); if (!l) continue;
      for (const p of l) if (p[2] !== skip && Math.hypot(p[0] - x, p[1] - y) < d) return true;
    }
    return false;
  };
  const edge = measured(HEMI_R);
  const distEdge = (x, y) => { let m = 99; for (const p of edge.pts) m = Math.min(m, Math.hypot(p[0] - x, p[1] - y)); return Math.min(m, x - 100.7); };
  for (let tries = 0; tries < 2600 && lines.length < 70; tries++) {
    const x = 101 + r() * 15, y = 14 + r() * 28;
    if (!inPoly(HEMI_R, x, y) || distEdge(x, y) < 1.2 || near(x, y, MIN, -1)) continue;
    const id = lines.length, a0 = r() * Math.PI * 2, arms = [];
    for (const dir of [0, Math.PI]) {
      let th = a0 + dir, cv = (r() - 0.5) * 0.3, qx = x, qy = y; const pts = [];
      for (let s = 0; s < 64; s++) {
        cv = clamp(cv + (r() - 0.5) * 0.15, -0.27, 0.27); th += cv;
        qx += Math.cos(th) * STEP; qy += Math.sin(th) * STEP;
        if (!inPoly(HEMI_R, qx, qy) || distEdge(qx, qy) < 0.25 || near(qx, qy, MIN * 0.86, id)) break;
        // eigene Linie nicht kreuzen
        if (pts.length > 14 && pts.slice(0, -12).some((p) => Math.hypot(p[0] - qx, p[1] - qy) < MIN * 0.8)) break;
        pts.push([qx, qy]);
      }
      arms.push(pts);
    }
    const line = arms[0].reverse().concat([[x, y]], arms[1]);
    if (line.length * STEP < 2.6) continue;
    if (arms[0].length > 12 && arms[1].length > 12 && arms[0].slice(0, -10).some((p) => arms[1].slice(10).some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < MIN * 0.8))) continue;
    line.forEach((p) => { const k = key(p[0], p[1]); (grid.get(k) || grid.set(k, []).get(k)).push([p[0], p[1], id]); });
    lines.push(line);
  }
  // Abstand zur nächsten Furche (für die Dichte der Windungen)
  const dist = (x, y) => {
    let m = 3; const gx = Math.floor(x / cell), gy = Math.floor(y / cell);
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
      const l = grid.get((gx + i) * 1000 + gy + j); if (!l) continue;
      for (const p of l) m = Math.min(m, Math.hypot(p[0] - x, p[1] - y));
    }
    return m;
  };
  return { lines, dist };
}
let BRAIN = null;
function brain() { // erst beim ersten Gebrauch (Startzeit)
  if (!BRAIN) BRAIN = { r: sulci(20261116), l: sulci(7341) };
  return BRAIN;
}
export const inBrain = (x, y) => { if (y > 48 || y < 13) return false; const mx = x < CX ? 2 * CX - x : x; return inPoly(HEMI_R, mx, y) || inCereb(mx, y); };
// für „ohne WebGL“: Gehirn als Linien (Rand + Furchen + Kleinhirn)
export function brainSvg() {
  const B = brain(), out = [];
  const hemi = HEMI_R.concat([HEMI_R[0]]);
  out.push(pathD(hemi), pathD(mirror(hemi)));
  B.r.lines.forEach((l) => out.push(pathD(l)));
  B.l.lines.forEach((l) => out.push(pathD(mirror(l))));
  for (const s of [1, -1]) for (let k = 0; k < 4; k++) {
    const y = 42.6 + k * 1.25, w = Math.sqrt(Math.max(0, 1 - ((y - CEREB.c[1]) / CEREB.ry) ** 2)) * CEREB.rx;
    out.push(`M${f1(CX + s * (CEREB.c[0] - CX - w))} ${f1(y)}L${f1(CX + s * (CEREB.c[0] - CX + w))} ${f1(y)}`);
  }
  return out;
}

// ---------- Nervensystem ----------
// Jede Bahn: Punkte, Dicke r (Zahl oder Funktion der Höhe y), „main“ = Hauptbahn (leuchtet genau mit der Höhe der Lichtspitze auf).
// Zweige starten an ihrer Mutterbahn: ry0 = Spitzenhöhe, bei der der Zweig beginnt, d0 = Weg vom Gehirn bis dorthin (für die Impulse).
const cordR = (y) => (y < 58
  ? lerp(1.7, 1.45, sstep(50, 58, y)) + 0.7 * Math.exp(-(((y - 43.6) / 3.2) ** 2))                      // Hirnstamm mit Brücke
  : 1.34 + 0.4 * Math.exp(-(((y - 73) / 9) ** 2)) + 0.34 * Math.exp(-(((y - 158) / 9) ** 2))) * (1 - 0.72 * sstep(164, 176, y)); // Hals- und Lendenanschwellung, Kegel
const NERVES = [];
function add(pts, r, o = {}) {
  const m = measured(o.raw ? pts : catmull(pts, 6));
  const n = { ...m, r, main: !!o.main, parent: o.parent ?? -1, w: o.w ?? clamp((typeof r === 'number' ? r : 1.4) / 1.4) };
  if (n.main) { n.ry0 = m.pts[0][1]; n.rate = 0; n.d0 = o.d0 ?? 0; } else {
    const P = NERVES[n.parent], a = m.pts[0];
    let best = 0, bd = 1e9;
    P.pts.forEach((p, i) => { const d = Math.hypot(p[0] - a[0], p[1] - a[1]); if (d < bd) { bd = d; best = i; } });
    n.ry0 = P.main ? P.pts[best][1] : P.ry0 + P.len[best] * P.rate;
    n.d0 = P.d0 + P.len[best];
    n.rate = Math.min(1, (SOLE - 6 - n.ry0) / Math.max(1, m.total)); // spätestens kurz vor der Sohle ganz da
  }
  NERVES.push(n);
  return NERVES.length - 1;
}
{
  // Hauptbahn: Hirnstamm → Rückenmark → Kegel (endet auf Höhe L1/L2), darunter der Endfaden bis zum Kreuzbein
  const down = (y0, y1) => Array.from({ length: Math.round(y1 - y0) + 1 }, (_, k) => [CX, y0 + k]);
  const cord = add(down(38, 176), cordR, { main: true, raw: true, w: 1 });
  add(down(174, 218), 0.34, { main: true, raw: true, d0: 136, w: 0.4 }); // Endfaden
  for (const s of [1, -1]) {
    const X = (x) => CX + s * (x - CX), P = (pts) => pts.map((p) => [X(p[0]), p[1]]);
    // Hals: Nerv zur Schulter
    add(P([[101.3, 60], [105.6, 68.4], [112.4, 78], [122, 83], [132.6, 87]]), 0.34, { parent: cord });
    // Armgeflecht C5–Th1 → drei Armnerven bis in die Finger
    const hub = [130.6, 93.6];
    const roots = [66, 70, 74, 78, 82].map((y, i) => add(P([[101.4, y], [111, y + 4.6 - i * 0.5], [122, 89 + (i - 2) * 0.7], hub]), 0.46, { parent: cord }));
    const arm = (f, entry, tail) => {
      const pts = [hub, entry];
      for (let y = 113; y <= 209; y += 12) pts.push([lerp(y < 123 ? 138.6 : armIn(y), armOut(y), f), y]);
      return add(P(pts.concat(tail.map((p) => hand(p[0], p[1])))), 0.5, { parent: roots[2] });
    };
    arm(0.78, [143.6, 101], [[5.2, 0], [8.6, 6], [12.4, 13.4], [15, 19.4]]);                       // Speichennerv → Daumenrücken
    const med = arm(0.5, [142, 103.4], [[0.6, 0], [1.2, 6], [1.6, 12]]);                             // Mittelnerv → Handteller
    const uln = arm(0.22, [140.4, 105.6], [[-4.2, 0], [-4.8, 7], [-5, 14]]);                         // Ellennerv
    [[[6, 15], [11.4, 17], [14.2, 20.6]], [[4.6, 22], [7.4, 31], [8, 38]], [[2.6, 24], [3, 33], [2.9, 40.6]]].forEach((t) => add(P([hand(1.6, 12), ...t.map((p) => hand(p[0], p[1]))]), 0.3, { parent: med }));
    [[[-2.6, 23], [-2, 31], [-1.9, 38.6]], [[-6, 22], [-6.6, 28], [-6.6, 33]]].forEach((t) => add(P([hand(-5, 14), ...t.map((p) => hand(p[0], p[1]))]), 0.3, { parent: uln }));
    // Zwischenrippennerven Th1–Th12: obere bis zur Flanke, untere im Bogen zum Bauch
    for (let i = 0; i < 12; i++) {
      const y = 86 + i * 7, k = i < 6 ? 1 : 1 - (i - 6) * 0.05;
      const xe = (yy) => Math.min(sideOut(yy) - 4.6, 136.4);
      const pts = i < 6
        ? [[101.4, y], [110, y + 2.4], [121, y + 6.8], [129.6, y + 12.2], [xe(y + 18), y + 18]]
        : [[101.4, y], [110, y + 2.8], [120, y + 7.6], [Math.min(127.6, xe(y + 14)), y + 14], [Math.min(128.6, xe(y + 21 * k) - 0.6), y + 21 * k], [125, y + 28 * k]];
      add(P(pts), 0.32, { parent: cord });
    }
    // Pferdeschweif: Wurzeln L1–S3 laufen vom Kegel nach unten zu ihren Austritten
    const exits = [[102.6, 172], [103.1, 180], [103.5, 188], [103.8, 196], [103.9, 203], [103.6, 209], [103, 214], [102.3, 218.4]];
    const strands = exits.map((e, i) => (i ? add(P([[100.3, 168 + i * 0.6], [100.9 + i * 0.12, (170 + e[1]) / 2], e]), 0.26, { parent: cord }) : cord));
    // Lendengeflecht
    add(P([exits[0], [113.6, 180], [124.6, 186.4], [130.4, 195.6]]), 0.3, { parent: cord });                                                     // zur Leiste
    add(P([exits[1], [113, 191], [125, 203], [lerp(legIn(224), sideOut(224), 0.85), 224], [lerp(legIn(246), sideOut(246), 0.86), 246], [lerp(legIn(266), sideOut(266), 0.84), 266]]), 0.32, { parent: strands[1] }); // seitlicher Hautnerv
    const fem = add(P([exits[2], [109, 205], [115.6, 219], [lerp(legIn(236), sideOut(236), 0.6), 236], [lerp(legIn(254), sideOut(254), 0.62), 254], [lerp(legIn(272), sideOut(272), 0.62), 272], [lerp(legIn(286), sideOut(286), 0.6), 286]]), 0.62, { parent: strands[2] }); // Oberschenkelnerv
    add(P([[lerp(legIn(258), sideOut(258), 0.62), 258], [lerp(legIn(276), sideOut(276), 0.4), 276], [lerp(legIn(296), sideOut(296), 0.2), 296], [lerp(legIn(312), sideOut(312), 0.17), 312], [lerp(legIn(340), sideOut(340), 0.18), 340], [lerp(legIn(366), sideOut(366), 0.2), 366], [lerp(legIn(388), sideOut(388), 0.22), 388]]), 0.3, { parent: fem }); // Hautnerv innen bis zum Knöchel
    add(P([exits[3], [106.4, 208], [108.4, 226], [lerp(legIn(246), sideOut(246), 0.17), 246], [lerp(legIn(266), sideOut(266), 0.16), 266]]), 0.32, { parent: strands[3] }); // Hüftlochnerv
    // Kreuzgeflecht → Ischias → Schienbeinnerv bis in die Zehen (Hauptbahn je Bein, y steigt überall)
    const hip = [110.8, 224.4];
    const leg = [[100, SPLIT], [103, 213], [106.6, 219], hip, [114.6, 233]];
    for (const y of [246, 264, 282, 300, 318, 338, 358, 378]) leg.push([lerp(legIn(y), sideOut(y), 0.47), y]);
    leg.push([119, 394], [119.4, 404], [120.6, 412], [121.6, SOLE]);
    const sci = add(P(leg), (y) => (y < 290 ? 0.95 : 0.66) * (1 - 0.4 * sstep(392, 419, y)), { main: true, d0: 174, w: 0.8 });
    [4, 5, 6, 7].forEach((i) => add(P([exits[i], [107, (exits[i][1] + hip[1]) / 2 + 1.6], hip]), 0.36, { parent: strands[i] }));
    // Wadenbeinnerv: zweigt über der Kniekehle ab, läuft außen bis zum Fußrücken
    const py = (y, f) => [lerp(legIn(y), sideOut(y), f), y];
    add(P([py(288, 0.47), py(298, 0.66), py(310, 0.83), py(326, 0.84), py(350, 0.8), py(374, 0.78), py(392, 0.76), [126.6, 403], [129.6, 412.6]]), 0.46, { parent: sci });
    // Zehen
    add(P([[119.4, 404], [115, 411], [111.8, 416]]), 0.28, { parent: sci });
    add(P([[120.6, 412], [125.4, 415], [128.8, 417]]), 0.28, { parent: sci });
  }
}
export const NERVE_LIST = NERVES;
// Bahnen der Leuchtpunkte: Mitte (Scheitel → SPLIT), dann je Bein die Hauptbahn (wie LINES im Baustein „Von Kopf bis Fuß“)
const MAIN_LEGS = NERVES.filter((n) => n.main && n.pts[0][1] === SPLIT);
export const LINES = [[[100, CROWN], [100, SPLIT]], MAIN_LEGS[0].pts, MAIN_LEGS[1].pts];
export function lineTo(pts, y) {
  if (y <= pts[0][1]) return null;
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`, tip = pts[0];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if (b[1] <= y) { d += `L${b[0].toFixed(2)} ${b[1].toFixed(2)}`; tip = b; continue; }
    const t = (y - a[1]) / Math.max(1e-6, b[1] - a[1]);
    tip = [a[0] + (b[0] - a[0]) * t, y];
    d += `L${tip[0].toFixed(2)} ${tip[1].toFixed(2)}`;
    break;
  }
  return { d, tip };
}
// für „ohne WebGL“: jede Bahn als Linie + Spitzenhöhe, ab der sie erscheint
export const nerveSvg = () => NERVES.map((n) => ({ d: pathD(n.pts), ry0: n.ry0, ry1: n.main ? n.pts[n.pts.length - 1][1] : n.ry0 + n.total * n.rate, main: n.main, w: n.w }));

// ---------- Stationen (Ring, Zoom, Spannungszonen) – Höhen wie im Baustein „Von Kopf bis Fuß“ ----------
export const STATIONS = [
  { key: 'kopf', name: 'Kopf', c: [100, 37], r: 34, tip: 36, zoom: [3.5, 2.9], spots: [[100, 37, 21, 27]] },
  { key: 'nacken', name: 'Nacken & Schultern', c: [100, 88], r: 46, tip: 88, zoom: [2.25, 2.25], spots: [[100, 74, 13, 15], [124, 88, 21, 13], [76, 88, 21, 13]] },
  { key: 'huefte', name: 'Hüfte', c: [100, 222], r: 44, tip: 226, zoom: [2.05, 2.05], spots: [[100, 214, 24, 14], [122, 226, 17, 18], [78, 226, 17, 18]] },
  { key: 'fuesse', name: 'Füße', c: [100, 395], r: 40, tip: 404, zoom: [2.25, 2.2], spots: [[120.6, 408, 17, 12], [79.4, 408, 17, 12]] },
];
export function stationHeat(bx, by) {
  let h = 0, st = -1, sp = null;
  STATIONS.forEach((S, si) => S.spots.forEach((z) => {
    const ex = (bx - z[0]) / z[2], ey = (by - z[1]) / z[3], k = Math.exp(-(ex * ex + ey * ey) * 0.9);
    if (k > h) { h = k; st = si; sp = z; }
  }));
  return h < 0.04 ? { h: 0, st: -1, sp: null } : { h, st, sp };
}

// ---------- Punktwolke ----------
// Art je Punkt (nfo.x): 0 Körper (nfo.y = liegt im Gehirn, nfo.w = Randnähe) · 1 Kontur/Körperlinie (nfo.w = Helligkeit) ·
// 2 Gehirn (nfo.y = Spitzenhöhe, ab der es leuchtet, nfo.w = Höhe der Windung) · 3 Nerv (nfo.y = Spitzenhöhe, nfo.z = Weg vom Gehirn, nfo.w = Dicke)
// Lage in Grundriss-Einheiten, Ursprung Körpermitte, y nach oben (wie figurePoints im Baustein).
export function figurePoints(n, { nBrain = Math.round(n * 0.2), nNerve = Math.round(n * 0.36), nEdge = Math.round(n * 0.11), nCrease = Math.round(n * 0.12) } = {}) {
  const rand = Math.random;
  const T = n + nEdge + nCrease + nBrain + nNerve;
  const pos = new Float32Array(T * 3), st = new Float32Array(T).fill(-1), heat = new Float32Array(T), ctr = new Float32Array(T * 2), rnd = new Float32Array(T * 4), nfo = new Float32Array(T * 4);
  let i = 0;
  const put = (bx, by, z, kind, a, b, c) => {
    pos[i * 3] = bx - BODY_W / 2; pos[i * 3 + 1] = BODY_H / 2 - by; pos[i * 3 + 2] = z;
    nfo[i * 4] = kind; nfo[i * 4 + 1] = a; nfo[i * 4 + 2] = b; nfo[i * 4 + 3] = c;
    i++;
  };
  // Körper: Maske aus dem Umriss, Tiefe aus der Zeilenbreite (runde Volumen), Rand dichter
  const S = 2, W = BODY_W * S, H = BODY_H * S;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.scale(S, S); ctx.fillStyle = '#fff'; ctx.beginPath();
  OUTLINE.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill();
  // Tonwert (Rot-Kanal): entlang der Körperlinien weiche Rinnen – dort fallen weniger Punkte, die Muskeln treten als Flächen hervor
  ctx.globalCompositeOperation = 'source-atop'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [lw, al] of [[6.4, 0.2], [3.6, 0.26], [1.8, 0.3]]) CREASES.forEach((c) => {
    ctx.strokeStyle = `rgba(0,0,0,${(al * (0.5 + c.w)).toFixed(3)})`; ctx.lineWidth = lw; ctx.beginPath();
    c.pts.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
  });
  const data = ctx.getImageData(0, 0, W, H).data;
  const mask = new Uint8Array(W * H), runL = new Int16Array(W * H), runR = new Int16Array(W * H);
  for (let k = 0; k < W * H; k++) mask[k] = data[k * 4 + 3] > 128 ? 1 : 0;
  for (let y = 0; y < H; y++) {
    const o = y * W;
    for (let x = 0; x < W; x++) {
      if (!mask[o + x]) continue;
      let r = x; while (r + 1 < W && mask[o + r + 1]) r++;
      for (let k = x; k <= r; k++) { runL[o + k] = x; runR[o + k] = r; }
      x = r;
    }
  }
  const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H && mask[y * W + x] === 1;
  const depthAt = (x, y) => { // x, y in Masken-Bildpunkten
    const l = runL[y * W + x], r = runR[y * W + x], c = (l + r) / 2, hw = Math.max(1, (r - l) / 2), u = (x - c) / hw;
    return Math.sqrt(Math.max(0, 1 - u * u)) * hw * 0.62 / S;
  };
  let guard = 0;
  while (i < n && guard++ < n * 60) {
    const x = (rand() * W) | 0, y = (rand() * H) | 0;
    if (!inside(x, y)) continue;
    const e1 = !inside(x - 2, y) || !inside(x + 2, y) || !inside(x, y - 2) || !inside(x, y + 2);
    const e2 = e1 || !inside(x - 5, y) || !inside(x + 5, y) || !inside(x, y - 5) || !inside(x, y + 5);
    if (!e2 && rand() < 0.5) continue; // Rand dichter: die Kontur trägt die Figur
    if (rand() * 255 > data[(y * W + x) * 4]) continue; // Rinnen dunkler
    const bx = (x + rand()) / S, by = (y + rand()) / S, d = depthAt(x, y); // innerhalb des Bildpunkts gestreut (kein Raster in der Nahansicht)
    const z = (rand() < 0.5 ? -1 : 1) * d * (e1 ? rand() : 0.7 + rand() * 0.3);
    const h = stationHeat(bx, by), k = i;
    put(bx, by, z, 0, inBrain(bx, by) ? 1 : 0, 0, e1 ? 1 : e2 ? 0.55 : 0);
    st[k] = h.st; heat[k] = h.h;
    ctr[k * 2] = h.sp ? h.sp[0] - BODY_W / 2 : 0; ctr[k * 2 + 1] = h.sp ? BODY_H / 2 - h.sp[1] : 0;
  }
  while (i < n) put(100, 200, 0, 0, 0, 0, 0);
  // Kontur: Punkte genau auf dem Umriss (gestochen), gleichmäßig nach Länge
  const ol = measured(OUTLINE.concat([OUTLINE[0]]));
  for (let k = 0; k < nEdge; k++) {
    const p = atLen(ol, rand() * ol.total), nl = Math.hypot(p[2], p[3]) || 1, o = (rand() - 0.5) * 0.7;
    put(p[0] - p[3] / nl * o, p[1] + p[2] / nl * o, (rand() - 0.5) * 1.2, 1, 0, 0, 1);
  }
  // Körperlinien: vorn auf der Oberfläche (wandern beim Wiegen leicht mit)
  const cl = CREASES.reduce((a, c) => a + c.total, 0);
  CREASES.forEach((c, ci) => {
    const cnt = ci === CREASES.length - 1 ? nCrease - CREASES.slice(0, -1).reduce((a, q) => a + Math.round(nCrease * q.total / cl), 0) : Math.round(nCrease * c.total / cl);
    for (let k = 0; k < cnt; k++) {
      const s = rand() * c.total, p = atLen(c, s), e = Math.min(s, c.total - s) / c.total; // zu den Enden hin auslaufend
      const mx = clamp(Math.round(p[0] * S), 0, W - 1), my = clamp(Math.round(p[1] * S), 0, H - 1);
      put(p[0] + (rand() - 0.5) * 0.36, p[1] + (rand() - 0.5) * 0.36, inside(mx, my) ? depthAt(mx, my) * 0.92 : 0, 1, 0, 0, c.w * (0.55 + 0.45 * sstep(0, 0.16, e)));
    }
  });
  // Gehirn: Windungen gefüllt, Furchen frei; leuchtet vom Scheitel aus auf
  const B = brain();
  const dome = (x, y) => Math.sqrt(Math.max(0, 1 - ((x - CX) / 16.4) ** 2 - ((y - 28) / 15.4) ** 2)) * 8.5;
  const ryB = (x, y) => CROWN + 1.5 + Math.hypot(x - CX, (y - 13) * 0.9) / 31 * 20;
  const nOut = Math.round(nBrain * 0.1), nCer = Math.round(nBrain * 0.09), nFill = nBrain - nOut - nCer;
  const hm = measured(HEMI_R);
  for (let k = 0; k < nOut; k++) {
    const sgn = k & 1 ? 1 : -1, p = atLen(hm, rand() * hm.total), x = CX + sgn * (p[0] - CX) + (rand() - 0.5) * 0.3, y = p[1] + (rand() - 0.5) * 0.3;
    put(x, y, (rand() - 0.5) * 2, 2, ryB(x, y), 0, 0.7);
  }
  for (let k = 0, g = 0; k < nCer && g < nCer * 40; g++) { // Kleinhirn: feine waagrechte Blätter
    const sgn = rand() < 0.5 ? 1 : -1, x = CEREB.c[0] + (rand() * 2 - 1) * CEREB.rx, y = CEREB.c[1] + (rand() * 2 - 1) * CEREB.ry;
    if (!inCereb(x, y) || inPoly(HEMI_R, x, y) || x < 101.2) continue;
    const band = Math.abs(((y - 42.6 + 0.08 * (x - CX)) / 1.25 % 1 + 1) % 1 - 0.5); // 0 = Mitte des Blatts
    if (band > 0.3) continue;
    const X = CX + sgn * (x - CX);
    put(X, y, (rand() - 0.5) * 6, 2, ryB(X, y) + 3, 0, 0.5 + 0.4 * (1 - band / 0.3)); k++;
  }
  for (let k = 0, g = 0; k < nFill && g < nFill * 40; g++) {
    const left = rand() < 0.5, x = 100.7 + rand() * 15.4, y = 13.2 + rand() * 28.6;
    if (!inPoly(HEMI_R, x, y)) continue;
    const d = (left ? B.l : B.r).dist(x, y);
    if (d < 0.3 || (d < 0.72 && rand() > sstep(0.26, 0.72, d))) continue;
    const X = left ? 2 * CX - x : x, dz = dome(X, y);
    put(X, y, (rand() * 2 - 1) * dz, 2, ryB(X, y), 0, 0.35 + 0.65 * sstep(0.3, 1.0, d)); k++;
  }
  while (i < n + nEdge + nCrease + nBrain) put(CX, 28, 0, 2, 20, 0, -0.6); // Rest unsichtbar
  // Nerven: Punkte entlang der Bahnen, Dichte nach Dicke
  const weight = (N) => { let s = 0; for (let k = 1; k < N.pts.length; k++) { const y = (N.pts[k][1] + N.pts[k - 1][1]) / 2, r = typeof N.r === 'number' ? N.r : N.r(y); s += (N.len[k] - N.len[k - 1]) * (0.28 + r * r * 0.9 + r * 0.5); } return s; };
  const ws = NERVES.map(weight), wt = ws.reduce((a, b) => a + b, 0);
  const end = T;
  NERVES.forEach((N, ni) => {
    const cnt = ni === NERVES.length - 1 ? end - i : Math.min(end - i, Math.round(nNerve * ws[ni] / wt));
    const rmax = typeof N.r === 'number' ? N.r : 3;
    for (let k = 0, g = 0; k < cnt && g < cnt * 30; g++) {
      const s = rand() * N.total, p = atLen(N, s), r = typeof N.r === 'number' ? N.r : N.r(p[1]);
      const dens = 0.28 + r * r * 0.9 + r * 0.5, dmax = 0.28 + rmax * rmax * 0.9 + rmax * 0.5;
      if (typeof N.r !== 'number' && rand() > dens / dmax) continue; // dicke Stellen dichter
      const nl = Math.hypot(p[2], p[3]) || 1, o = (rand() + rand() - 1) * r;
      const ry = N.main ? p[1] : N.ry0 + s * N.rate;
      put(p[0] - p[3] / nl * o, p[1] + p[2] / nl * o, (rand() + rand() - 1) * r, 3, ry, N.d0 + s, N.w); k++;
    }
  });
  while (i < T) put(CX, 100, 0, 3, 100, 60, 0.3);
  for (let k = 0; k < rnd.length; k++) rnd[k] = rand();
  return { pos, st, heat, ctr, rnd, nfo, count: T, nBody: n };
}
