// Auftrag K „Von Kopf bis Fuß“ (16.11.2026): Geometrie der Figur – alles in Grundriss-Koordinaten des Puls-Körpers
// (BODY_W 200 × BODY_H 430, x nach rechts, y nach unten, wie drawBody in ../test-4/shapes.js).
// Hier stehen: die vier Stationen (Ring, Zoom, Spannungszonen), die Bahn der Lichtlinie, der SVG-Umriss für „ohne WebGL“
// und die Zuordnung Partikel → Station (Spannung je Punkt). Puls selbst bleibt unberührt (shapes.js nur gelesen).
// Körper-Grundriss und Punktwolke: Kopie aus ../test-4/shapes.js (Stand 16.11.2026, drawBody + bodyPoints ohne HOTSPOTS) –
// als Kopie statt Import, weil shapes.js three.js mitzieht (Seite sonst ~260 KB Skript statt ~15 KB). Puls bleibt unberührt.
export const BODY_W = 200, BODY_H = 430, BODY_SCALE = 8.2 / 430;
const rand = Math.random;

function drawBody(ctx, s) {
  ctx.save(); ctx.scale(s, s);
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.ellipse(100, 36, 19, 25, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(91, 54); ctx.lineTo(90, 80); ctx.lineTo(110, 80); ctx.lineTo(109, 54); ctx.closePath(); ctx.fill();
  // Rumpf
  ctx.beginPath();
  ctx.moveTo(90, 76);
  ctx.quadraticCurveTo(66, 80, 58, 92);
  ctx.quadraticCurveTo(54, 120, 62, 150);
  ctx.quadraticCurveTo(68, 176, 68, 196);
  ctx.quadraticCurveTo(62, 214, 64, 232);
  ctx.lineTo(136, 232);
  ctx.quadraticCurveTo(138, 214, 132, 196);
  ctx.quadraticCurveTo(132, 176, 138, 150);
  ctx.quadraticCurveTo(146, 120, 142, 92);
  ctx.quadraticCurveTo(134, 80, 110, 76);
  ctx.closePath(); ctx.fill();
  // Arme
  const limb = (pts, w0, w1) => {
    for (let i = 0; i < pts.length - 1; i++) {
      ctx.lineWidth = w0 + (w1 - w0) * (i / (pts.length - 1));
      ctx.beginPath(); ctx.moveTo(...pts[i]); ctx.lineTo(...pts[i + 1]); ctx.stroke();
    }
  };
  limb([[60, 96], [50, 130], [45, 162], [41, 196], [37, 226]], 20, 13);
  limb([[140, 96], [150, 130], [155, 162], [159, 196], [163, 226]], 20, 13);
  ctx.beginPath(); ctx.ellipse(36, 238, 8, 13, 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(164, 238, 8, 13, -0.15, 0, Math.PI * 2); ctx.fill();
  // Beine
  limb([[83, 228], [81, 270], [80, 318], [78, 360], [77, 400]], 32, 18);
  limb([[117, 228], [119, 270], [120, 318], [122, 360], [123, 400]], 32, 18);
  ctx.beginPath(); ctx.ellipse(74, 412, 15, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(126, 412, 15, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function bodyPoints(N) {
  const S = 2, W = BODY_W * S, H = BODY_H * S;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  drawBody(ctx, S);
  const data = ctx.getImageData(0, 0, W, H).data;
  // Maske und Zeilen-Spannweiten einmal vorab (A1: statt je Punkt nach links/rechts zu suchen)
  const mask = new Uint8Array(W * H), runL = new Int16Array(W * H), runR = new Int16Array(W * H);
  for (let i = 0; i < W * H; i++) mask[i] = data[i * 4 + 3] > 128 ? 1 : 0;
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
  // Zeilen-Spannweiten für Tiefe (runde Volumen)
  const spanAt = (x, y) => [runL[y * W + x], runR[y * W + x]];
  const pos = new Float32Array(N * 3);
  let i = 0, guard = 0;
  while (i < N && guard++ < N * 60) {
    const x = (rand() * W) | 0, y = (rand() * H) | 0;
    if (!inside(x, y)) continue;
    const edge = !inside(x - 3, y) || !inside(x + 3, y) || !inside(x, y - 3) || !inside(x, y + 3);
    if (!edge && rand() < 0.42) continue; // Kanten etwas dichter
    const [l, r] = spanAt(x, y);
    const c = (l + r) / 2, hw = Math.max(1, (r - l) / 2);
    const u = (x - c) / hw;
    const depth = Math.sqrt(Math.max(0, 1 - u * u)) * hw * 0.62 / S;
    const bx = x / S, by = y / S;
    pos[i * 3] = (bx - BODY_W / 2) * BODY_SCALE;
    pos[i * 3 + 1] = (BODY_H / 2 - by) * BODY_SCALE;
    pos[i * 3 + 2] = (rand() < 0.5 ? -1 : 1) * depth * BODY_SCALE * (edge ? rand() : 0.7 + rand() * 0.3);
    i++;
  }
  return { pos };
}

// Stationen: c = Ringmitte, r = Ringradius, tip = Lage der Linienspitze beim Halt (y), zoom = [Handy, PC],
// spots = Spannungszonen [x, y, rx, ry] (Gauß wie HOTSPOTS in Puls)
export const STATIONS = [
  { key: 'kopf', name: 'Kopf', c: [100, 36], r: 33, tip: 36, zoom: [3.5, 2.9], spots: [[100, 37, 21, 27]] },
  { key: 'nacken', name: 'Nacken & Schultern', c: [100, 88], r: 46, tip: 88, zoom: [2.25, 2.25], spots: [[100, 76, 13, 15], [72, 94, 19, 15], [128, 94, 19, 15]] },
  { key: 'huefte', name: 'Hüfte', c: [100, 226], r: 42, tip: 226, zoom: [2.05, 2.05], spots: [[100, 220, 24, 14], [80, 232, 17, 17], [120, 232, 17, 17]] },
  { key: 'fuesse', name: 'Füße', c: [100, 395], r: 40, tip: 404, zoom: [2.25, 2.2], spots: [[75, 409, 16, 11], [125, 409, 16, 11]] },
];
export const CROWN = 11, SOLE = 419, SPLIT = 228;

// ---------- Lichtlinie: Scheitel → Wirbelsäule → Becken, dort zwei Beine bis zu den Fußspitzen ----------
// Catmull-Rom durch Stützpunkte, dann gleichmäßig nach y abgetastet (y steigt überall → Spitze = y-Wert)
function catmull(pts, steps = 10) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
const SPINE = catmull([[100, CROWN], [100, 36], [100, 60], [100, 84], [99.6, 130], [100.4, 180], [100, SPLIT]]);
const LEG = (sx) => catmull([[100, SPLIT], [100 + sx * 9, 237], [100 + sx * 16, 252], [100 + sx * 18.6, 272], [100 + sx * 20, 318], [100 + sx * 22, 360], [100 + sx * 23, 398], [100 + sx * 24.5, 410], [100 + sx * 26, SOLE]]);
export const LINES = [SPINE, LEG(-1), LEG(1)];

// Teilpfad bis zur Höhe y (Spitze); liefert d-String und Spitzenpunkt
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

// ---------- Umriss für „ohne WebGL“ (gleiche Formen wie drawBody, als SVG) ----------
function limbSvg(pts, w0, w1) {
  let s = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const w = w0 + (w1 - w0) * (i / (pts.length - 1));
    s += `<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${pts[i + 1][0]}" y2="${pts[i + 1][1]}" stroke-width="${w}"/>`;
  }
  return s;
}
export const BODY_SVG = [
  '<ellipse cx="100" cy="36" rx="19" ry="25"/>',
  '<path d="M91 54L90 80L110 80L109 54Z"/>',
  '<path d="M90 76Q66 80 58 92Q54 120 62 150Q68 176 68 196Q62 214 64 232L136 232Q138 214 132 196Q132 176 138 150Q146 120 142 92Q134 80 110 76Z"/>',
  '<g stroke="#fff" stroke-linecap="round" fill="none">',
  limbSvg([[60, 96], [50, 130], [45, 162], [41, 196], [37, 226]], 20, 13),
  limbSvg([[140, 96], [150, 130], [155, 162], [159, 196], [163, 226]], 20, 13),
  limbSvg([[83, 228], [81, 270], [80, 318], [78, 360], [77, 400]], 32, 18),
  limbSvg([[117, 228], [119, 270], [120, 318], [122, 360], [123, 400]], 32, 18),
  '</g>',
  '<ellipse cx="36" cy="238" rx="8" ry="13" transform="rotate(8.6 36 238)"/>',
  '<ellipse cx="164" cy="238" rx="8" ry="13" transform="rotate(-8.6 164 238)"/>',
  '<ellipse cx="74" cy="412" rx="15" ry="7"/>',
  '<ellipse cx="126" cy="412" rx="15" ry="7"/>',
].join('');

// Spannung an einer Stelle des Grundrisses (x, y nach unten): stärkste Zone, ihre Station und Mitte (auch Puls nutzt das für Form 0)
export function stationHeat(bx, by) {
  let h = 0, st = -1, sp = null;
  STATIONS.forEach((S, si) => S.spots.forEach((z) => {
    const ex = (bx - z[0]) / z[2], ey = (by - z[1]) / z[3], k = Math.exp(-(ex * ex + ey * ey) * 0.9);
    if (k > h) { h = k; st = si; sp = z; }
  }));
  return h < 0.04 ? { h: 0, st: -1, sp: null } : { h, st, sp };
}

// ---------- Partikel: Körper-Wolke aus Puls, je Punkt Station + Spannung + Zonenmitte ----------
// Ausgabe in Grundriss-Einheiten mit Ursprung in der Körpermitte, y nach oben (wie die Wolke in Puls, nur ohne BODY_SCALE)
export function figurePoints(n) {
  const b = bodyPoints(n);
  const pos = new Float32Array(n * 3), st = new Float32Array(n), heat = new Float32Array(n), ctr = new Float32Array(n * 2), rnd = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const x = b.pos[i * 3] / BODY_SCALE, y = b.pos[i * 3 + 1] / BODY_SCALE, z = b.pos[i * 3 + 2] / BODY_SCALE;
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    const { h: best, st: bs, sp: bc } = stationHeat(x + BODY_W / 2, BODY_H / 2 - y);
    st[i] = bs; heat[i] = best;
    ctr[i * 2] = bc ? bc[0] - BODY_W / 2 : 0; ctr[i * 2 + 1] = bc ? BODY_H / 2 - bc[1] : 0;
  }
  for (let i = 0; i < rnd.length; i++) rnd[i] = Math.random();
  return { pos, st, heat, ctr, rnd };
}
