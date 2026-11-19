// Tür-Bühne „Hineingehen“ (19.11.2026, Go Kai „3a“: „dass man wie in die Tür rein geht und dort dann erst die Buttons stehen“).
// Eigene klebende Bühne in Kapitel 05: oben die Überschrift, darunter groß die Tür – sonst nichts. Beim Weiterscrollen öffnet
// sie sich und die Kamera geht hindurch; das Tempo bestimmt der Finger (p 0 … 1 = Weg durch die Bühne). Drinnen: warmer
// Boden-Schein, ruhige Lichtpunkte, erst dort die Knöpfe (blendet main.js ein).
// Geometrie und Projektion stammen aus dem Entwurf varC.js (Welt in Metern: Türöffnung 1 × 2,05, Boden y = 0, Türebene z = 0,
// z > 0 = drinnen), gezeichnet wird über glbatch.js auf dem Grafikchip statt als Canvas-2D-Pfade.
import { TAU, OPEN, clamp01, smooth, easeInOut, easeSine, easeCalm, rng, leafPoints, LEAF_N } from './door.js';
import { makeGLBatch } from './glbatch.js';

const DW = 1, DH = 2.05, D0 = 4.2, ZEND = 1.4, EYE = 1.08;
const FR_N = 9; // Rahmenpunkt: Dach x, y · Tür x, y · Versatz q · Helligkeit · Größe · 2 Zufallswerte
// Fahrplan über p: Tür schwingt auf · Kamera geht · drinnen (Knöpfe ab GATE)
export const DOOR_PLAN = { open: [0.06, 0.5], walk: [0.26, 0.84], gate: 0.8, settle: [0.84, 1] };

export function initDoorStage({ cv, glow, isStill }) {
  const batch = makeGLBatch(cv);
  if (!batch) return null;
  let VW = 0, VH = 0, dpr = 1, F = 1, px = 1, cx = 0, cy = 0, areaH = 0;
  let frame = null, leaf = null, floor = null, motes = null, sill = null;
  let f = 0, pS = 0, clock = 0, skip = false, lastKey = '', blank = true;

  function build(w, h, aH, desk) {
    const d = Math.min(window.devicePixelRatio || 1, desk ? 1.5 : 2);
    if (w === VW && h === VH && d === dpr && Math.abs(aH - areaH) < 2 && frame) return;
    VW = w; VH = h; dpr = d; areaH = aH;
    cv.width = Math.round(VW * dpr); cv.height = Math.round(VH * dpr);
    px = Math.min((aH * 0.86) / DH, (VW * (desk ? 0.3 : 0.66)) / DW); // Bildpunkte je Meter, solange die Kamera draußen steht
    F = px * D0;
    const R = rng(11), gs = () => (R() + R() + R() - 1.5) / 1.5;
    // Rahmen: je Seite ein Weg Boden → Ecke → Sturzmitte; derselbe Punkt liegt vorher auf der Dachlinie (Traufe → First)
    const P = [], L = DH + DW / 2;
    const side = (sg, off, n, b, s) => {
      for (let i = 0; i < n; i++) {
        const t = (i + R()) / n, sl = t * L, halo = R() < 0.2, jt = halo ? 0.035 : 0.006;
        const dx = sl < DH ? sg * (0.5 + off) : sg * (0.5 - (sl - DH)), dy = sl < DH ? sl : DH + off;
        P.push(sg * (1 - t) * 1.02 + gs() * jt, 1.9 + 0.5 * t + off * 0.6 + gs() * jt, dx + gs() * jt, dy + gs() * jt, 1 - t, b * (halo ? 0.4 : 0.75 + 0.25 * R()), s * (halo ? 0.8 : 1), R(), R());
      }
    };
    const nF = Math.round((L * px) / 1.5);
    [-1, 1].forEach((sg) => { side(sg, 0, nF, 1, 1.15); side(sg, 0.06, Math.round(nF * 0.55), 0.5, 0.9); });
    frame = new Float32Array(P);
    leaf = leafPoints(px * 0.976, px * (DH - 0.02), 5);
    // Boden-Licht: drinnen (z > 0) ein Kegel, der sich weitet; draußen (z < 0) der Schein, der aus der Tür fällt
    const Q = [];
    const nIn = Math.round(Math.min(1700, 700 + VW * 0.9)), nOut = Math.round(nIn * 0.3);
    for (let i = 0; i < nIn; i++) { const z = 0.06 + 7.4 * Math.pow(R(), 1.5), xl = 0.5 + 0.42 * z; Q.push((R() * 2 - 1) * xl * Math.sqrt(R() * 0.6 + 0.4), z, Math.pow(1 - z / 7.5, 1.25) * (0.35 + 0.65 * R()), 0.85 + R() * 0.5); }
    for (let i = 0; i < nOut; i++) { const z = -2.4 * Math.pow(R(), 1.3), xl = 0.48 - 0.3 * z; Q.push((R() * 2 - 1) * xl, z, Math.pow(1 + z / 2.4, 1.5) * 0.8 * (0.4 + 0.6 * R()), 0.9 + R() * 0.4); }
    floor = new Float32Array(Q);
    const M = [];
    for (let i = 0; i < 230; i++) M.push((R() * 2 - 1) * 2.6, 0.15 + R() * 2.4, 0.4 + R() * 8.2, R() * TAU, 0.3 + R() * 0.55, 0.8 + R() * 0.9);
    motes = new Float32Array(M);
    const S = [];
    for (let i = 0; i < 110; i++) S.push(-0.49 + 0.98 * R(), (R() - 0.5) * 0.03, 0.7 + 0.3 * R());
    sill = new Float32Array(S);
    lastKey = '';
  }

  function draw(p, cxNow, areaTop, areaBot, fadeY) {
    cx = cxNow;
    // Tür mittig in der freien Fläche; cy = Bildhöhe der Augen (Fluchtpunkt der Fahrt)
    cy = (areaTop + areaBot) / 2 + (DH / 2 - EYE) * px;
    const k = easeCalm((p - DOOR_PLAN.open[0]) / (DOOR_PLAN.open[1] - DOOR_PLAN.open[0])); // Tür offen 0 … 1
    const walk = easeSine((p - DOOR_PLAN.walk[0]) / (DOOR_PLAN.walk[1] - DOOR_PLAN.walk[0]));
    const zc = -D0 + (D0 + ZEND) * walk;
    const G = 1 - 0.22 * smooth(DOOR_PLAN.settle[0], DOOR_PLAN.settle[1], p); // drinnen gedämpft: die Knöpfe stehen davor
    const ang = OPEN * k, ca = Math.cos(ang), sa = Math.sin(ang);
    let PX = 0, PY = 0, PS = 1;
    const proj = (x, y, z) => { const dp = z - zc; if (dp < 0.12) return 0; const q = F / dp; PX = cx + x * q; PY = cy - (y - EYE) * q; PS = Math.min(1.5, Math.max(0.55, q / px)); return smooth(0.3, 2.8, dp); }; // löst sich früh und weich auf, während man näher kommt – kein heller Rahmen, der am Bildrand abreißt
    batch.begin(VW, VH, dpr, fadeY);
    if (zc < 0.2) {
      // Rahmen: sammeln (f 0 … .35), von der Dachlinie zum Türrahmen herunterklappen (f .35 … 1)
      const gth = smooth(0, 0.38, f), mor = clamp01((f - 0.35) / 0.65);
      for (let i = 0; i < frame.length; i += FR_N) {
        const q = frame[i + 4], r1 = frame[i + 7], r2 = frame[i + 8];
        const m = easeInOut(clamp01(mor * 1.4 - q * 0.4)), g1 = smooth(r1 * 0.5, 0.5 + r1 * 0.5, gth), sc = (1 - g1) * (1 - g1);
        const x = frame[i] + (frame[i + 2] - frame[i]) * m + (r1 - 0.5) * 1.6 * sc;
        const y = frame[i + 1] + (frame[i + 3] - frame[i + 1]) * m + (r2 - 0.5) * 1.1 * sc - 0.12 * Math.sin(m * Math.PI) * q;
        const nf = proj(x, y, (r2 - 0.5) * 2.4 * sc);
        if (nf) batch.put(PX, PY, frame[i + 6] * PS, frame[i + 5] * g1 * nf * G * 0.95, 1);
      }
      // Blatt: verdichtet sich aus der Tiefe, schwingt um das linke Band nach innen
      const la = smooth(0.55, 1, f);
      if (la > 0.01) {
        const shade = (1 - 0.3 * k) * 0.82 * la * G, lw = 0.976, lh = DH - 0.02;
        for (let i = 0; i < leaf.length; i += LEAF_N) {
          const u = leaf[i], r1 = leaf[i + 5];
          const nf = proj(-0.488 + u * lw * ca, 0.008 + leaf[i + 1] * lh, u * lw * sa + (r1 - 0.5) * 1.5 * (1 - la));
          if (nf) batch.put(PX, PY, leaf[i + 3] * PS, leaf[i + 2] * shade * nf, leaf[i + 4]);
        }
      }
      // Lichtspalt unter der geschlossenen Tür
      const sl = smooth(0.75, 1, f) * (1 - k) * G * (0.75 + 0.25 * Math.sin(clock * 1.05));
      if (sl > 0.01) for (let i = 0; i < sill.length; i += 3) { const nf = proj(sill[i], 0.004, sill[i + 1]); if (nf) batch.put(PX, PY, 1.05 * PS, sill[i + 2] * sl * nf, 2); }
    }
    if (k > 0.01) {
      // Boden-Licht und Lichtpunkte im Raum
      const kk = k * G;
      for (let i = 0; i < floor.length; i += 4) {
        const z = floor[i + 1], nf = proj(floor[i], 0, z);
        if (nf) batch.put(PX, PY, floor[i + 3] * PS * 0.95, floor[i + 2] * kk * nf * (z < 0 ? 0.78 : 0.85), z < 0 ? 1 : 2);
      }
      const km = smooth(0.2, 1, k) * G;
      for (let i = 0; i < motes.length; i += 6) {
        const ph = motes[i + 3], z = motes[i + 2];
        const nf = proj(motes[i] + 0.06 * Math.sin(clock * 0.21 + ph), motes[i + 1] + 0.05 * Math.cos(clock * 0.16 + ph * 2), z);
        if (nf) batch.put(PX, PY, motes[i + 5] * PS * 0.8, km * nf * (1 - z / 9.5) * (0.16 + 0.42 * (0.5 + 0.5 * Math.sin(clock * motes[i + 4] + ph))), 2);
      }
    }
    batch.flush(); blank = false;
    if (glow) glow.style.opacity = (k * G).toFixed(3);
  }

  return {
    get f() { return f; },
    get p() { return pS; },
    get dead() { return batch.dead; },
    get points() { return batch.count; },
    // o: w, h Fenster · desk · cx Mitte der Tür · areaTop/areaBot freie Fläche unter der Überschrift · fadeY Unterkante der
    //    Überschrift · fWant 0 … 1 (Tür entsteht, während die Bühne hereinkommt) · pWant 0 … 1 (Weg durch die Bühne)
    frame(dt, o) {
      const still = isStill();
      build(o.w, o.h, o.areaBot - o.areaTop, o.desk);
      if (!still) clock += dt;
      const kf = still ? 1 : 1 - Math.exp(-dt * 2.4); // ruhig nachführen: auch ein kräftiger Wisch geht nicht schneller als rund eine Sekunde hindurch
      f += (o.fWant - f) * kf; if (Math.abs(o.fWant - f) < 0.002) f = o.fWant;
      pS += (o.pWant - pS) * kf; if (Math.abs(o.pWant - pS) < 0.0015) pS = o.pWant;
      // nur zeichnen, wenn sich etwas ändert: Lage, Fahrt – oder das Eigenleben (Lichtspalt, Lichtpunkte), dann jedes zweite Bild
      const key = `${f.toFixed(3)}|${pS.toFixed(4)}|${Math.round(o.areaTop)}|${Math.round(o.cx)}|${Math.round(o.fadeY)}`;
      const alive = !still && (f > 0.75 || pS > 0.06);
      if (key === lastKey) { if (!alive) return; skip = !skip; if (skip) return; }
      lastKey = key;
      draw(pS, o.cx, o.areaTop, o.areaBot, o.fadeY);
    },
    clear() { if (!blank) { batch.clear(); blank = true; if (glow) glow.style.opacity = '0'; lastKey = ''; } },
    reset() { f = 0; pS = 0; lastKey = ''; },
  };
}
