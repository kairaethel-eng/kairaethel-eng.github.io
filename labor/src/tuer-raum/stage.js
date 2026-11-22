// Bühne für den Entwurf „Tür · Raum“ (22.11.2026, Go Kai „a c“). Grundlage: ../tuer/buehne.js (Tür-Bühne „Hineingehen“ aus Puls, dort
// unverändert) – Tür entsteht aus Staub, geht auf Antippen auf, die Kamera geht hindurch. Neu:
//   · Der Türrahmen wird zum Bildschirmrand: sobald die Öffnung so groß wie das Bild ist, legen sich seine Punkte geordnet (gleicher
//     Abstand, zwei feine Linien) an den Rand; die Schwelle wird zur warmen Unterkante. Der Rahmen bleibt, solange man drin ist.
//   · Drinnen der Raum (raum.js): Bodenraster und vier Motive, Auftritt aus feinem Staub, Umsehen per Drehung um die Hochachse.
// Alles auf einer Zeichenfläche, ein Zeichenaufruf je Bild (glbatch.js).
import { TAU, OPEN, clamp01, smooth, easeInOut, easeSine, easeCalm, rng, leafPoints, LEAF_N } from '../tuer/door.js';
import { makeGLBatch } from './glbatch.js';
import { makeRoom } from './raum.js';

const DW = 1, DH = 2.05, D0 = 4.2, ZEND = 1.4, EYE = 1.08;
const FR_N = 9;
export const DOOR_PLAN = { open: [0.06, 0.5], walk: [0.26, 0.84], gate: 0.8, settle: [0.84, 1] };

export function initStage({ cv, glow, isStill, soft }) {
  const batch = makeGLBatch(cv, { soft });
  if (!batch) return null;
  const room = makeRoom();
  let VW = 0, VH = 0, dpr = 1, F = 1, px = 1, cx = 0, cy = 0, areaH = 0, roomSp = 0;
  let frame = null, ftg = null, leaf = null, floor = null, motes = null, sill = null, nBottom = 0;
  let f = 0, pS = 0, clock = 0, skip = false, lastKey = '', blank = true, walkNow = 0, borderNow = 0;

  function build(w, h, aH, desk) {
    const d = Math.min(window.devicePixelRatio || 1, desk ? 1.5 : 2);
    if (w === VW && h === VH && d === dpr && Math.abs(aH - areaH) < 2 && frame) return;
    VW = w; VH = h; dpr = d; areaH = aH;
    cv.width = Math.round(VW * dpr); cv.height = Math.round(VH * dpr);
    px = Math.min((aH * 0.86) / DH, (VW * (desk ? 0.3 : 0.66)) / DW);
    F = px * D0;
    const R = rng(11), gs = () => (R() + R() + R() - 1.5) / 1.5;
    const P = [], T = [], L = DH + DW / 2;
    const side = (sg, off, n, b, s) => {
      for (let i = 0; i < n; i++) {
        const t = (i + R()) / n, sl = t * L, halo = R() < 0.2, jt = halo ? 0.035 : 0.006;
        const dx = sl < DH ? sg * (0.5 + off) : sg * (0.5 - (sl - DH)), dy = sl < DH ? sl : DH + off;
        P.push(sg * (1 - t) * 1.02 + gs() * jt, 1.9 + 0.5 * t + off * 0.6 + gs() * jt, dx + gs() * jt, dy + gs() * jt, 1 - t, b * (halo ? 0.4 : 0.75 + 0.25 * R()), s * (halo ? 0.8 : 1), R(), R());
        T.push(sg, off > 0 ? 1 : 0, (i + 0.5) / n); // Ziel am Bildschirmrand: Seite, Linie (außen/innen), geordnete Lage
      }
    };
    const nF = Math.round((L * px) / 1.5);
    [-1, 1].forEach((sg) => { side(sg, 0, nF, 1, 1.15); side(sg, 0.06, Math.round(nF * 0.55), 0.5, 0.9); });
    frame = new Float32Array(P); ftg = new Float32Array(T);
    nBottom = Math.round(nF * 0.9);
    leaf = leafPoints(px * 0.976, px * (DH - 0.02), 5);
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

  // Lage am Bildschirmrand: Seite sg, Linie row, t 0 (unten) … 1 (oben Mitte); bd = [links, oben, rechts, unten]
  const onBorder = (sg, row, t, bd) => {
    const ins = row ? 5 : 0, L0 = bd[0] + ins, T0 = bd[1] + ins, R0 = bd[2] - ins, B0 = bd[3] - ins;
    const vert = B0 - T0, hor = (R0 - L0) / 2, s = t * (vert + hor);
    if (s < vert) return [sg < 0 ? L0 : R0, B0 - s];
    const m = s - vert; return [sg < 0 ? L0 + m : R0 - m, T0];
  };

  function draw(p, o) {
    cx = o.cx;
    cy = (o.areaTop + o.areaBot) / 2 + (DH / 2 - EYE) * px;
    const k = easeCalm((p - DOOR_PLAN.open[0]) / (DOOR_PLAN.open[1] - DOOR_PLAN.open[0]));
    const walk = easeSine((p - DOOR_PLAN.walk[0]) / (DOOR_PLAN.walk[1] - DOOR_PLAN.walk[0]));
    walkNow = walk;
    const zc = -D0 + (D0 + ZEND) * walk;
    const rIn = o.room ? o.room.rIn : 0, gone = 1 - smooth(0, 0.7, rIn); // Tür-Licht weicht dem Raum
    const G = 1 - 0.22 * smooth(DOOR_PLAN.settle[0], DOOR_PLAN.settle[1], p);
    const ang = OPEN * k, ca = Math.cos(ang), sa = Math.sin(ang);
    const bd = o.border;
    // Rahmen → Bildschirmrand: sobald die Öffnung so hoch ist wie das Bild (Verhältnis 0,95 … 1,7)
    const ratio = zc < -0.05 ? (DH * F) / -zc / (bd[3] - bd[1]) : 99;
    const bm = easeInOut(smooth(0.95, 1.7, ratio));
    borderNow = bm;
    const fadeY = o.fadeY - (o.fadeY + 80) * smooth(0.04, 0.3, walk); // die Überschrift bleibt zurück: Maske weicht
    let PX = 0, PY = 0, PS = 1;
    const proj = (x, y, z) => { const dp = z - zc; if (dp < 0.12) return 0; const q = F / dp; PX = cx + x * q; PY = cy - (y - EYE) * q; PS = Math.min(1.5, Math.max(0.55, q / px)); return smooth(0.3, 2.8, dp); };
    batch.begin(VW, VH, dpr, fadeY, o.room ? o.room.rect : null);
    // Rahmen
    const gth = smooth(0, 0.38, f), mor = clamp01((f - 0.35) / 0.65);
    for (let i = 0, j = 0; i < frame.length; i += FR_N, j += 3) {
      const sg = ftg[j], row = ftg[j + 1], [tx, ty] = onBorder(sg, row, ftg[j + 2], bd);
      const ta = row ? 0.16 : 0.42, ts = row ? 0.8 : 0.95;
      if (bm >= 0.999) { batch.put(tx, ty, ts, ta, 21); continue; }
      const q = frame[i + 4], r1 = frame[i + 7], r2 = frame[i + 8];
      const m = easeInOut(clamp01(mor * 1.4 - q * 0.4)), g1 = smooth(r1 * 0.5, 0.5 + r1 * 0.5, gth), sc = (1 - g1) * (1 - g1);
      const x = frame[i] + (frame[i + 2] - frame[i]) * m + (r1 - 0.5) * 1.6 * sc;
      const y = frame[i + 1] + (frame[i + 3] - frame[i + 1]) * m + (r2 - 0.5) * 1.1 * sc - 0.12 * Math.sin(m * Math.PI) * q;
      const nf = proj(x, y, (r2 - 0.5) * 2.4 * sc);
      if (!nf) { if (bm > 0.01) batch.put(tx, ty, ts, ta * bm, 21); continue; }
      const a0 = frame[i + 5] * g1 * nf * G * 0.95;
      if (bm <= 0.001) { batch.put(PX, PY, frame[i + 6] * PS, a0, 1); continue; }
      const cxp = Math.min(VW + 40, Math.max(-40, PX)), cyp = Math.min(VH + 40, Math.max(-40, PY));
      batch.put(cxp + (tx - cxp) * bm, cyp + (ty - cyp) * bm, frame[i + 6] * PS + (ts - frame[i + 6] * PS) * bm, a0 + (ta - a0) * bm, bm > 0.5 ? 21 : 1);
    }
    // Schwelle → warme Unterkante des Bilds
    if (bm > 0.001) {
      for (let i = 0; i < nBottom; i++) {
        const t = (i + 0.5) / nBottom, tx = bd[0] + (bd[2] - bd[0]) * t, ty = bd[3];
        let sx = tx, sy = ty;
        if (proj(-0.5 + t, 0.004, 0)) { sx = Math.min(VW + 40, Math.max(-40, PX)); sy = Math.min(VH + 40, Math.max(-40, PY)); }
        batch.put(sx + (tx - sx) * bm, sy + (ty - sy) * bm, 0.95, 0.42 * bm, 22);
      }
    }
    if (zc < 0.2) {
      const la = smooth(0.55, 1, f);
      if (la > 0.01) {
        const shade = (1 - 0.3 * k) * 0.82 * la * G * (1 - 0.65 * bm), lw = 0.976, lh = DH - 0.02;
        for (let i = 0; i < leaf.length; i += LEAF_N) {
          const u = leaf[i], r1 = leaf[i + 5];
          const nf = proj(-0.488 + u * lw * ca, 0.008 + leaf[i + 1] * lh, u * lw * sa + (r1 - 0.5) * 1.5 * (1 - la));
          if (nf) batch.put(PX, PY, leaf[i + 3] * PS, leaf[i + 2] * shade * nf, leaf[i + 4]);
        }
      }
      const sl = smooth(0.75, 1, f) * (1 - k) * G * (0.75 + 0.25 * Math.sin(clock * 1.05));
      if (sl > 0.01) for (let i = 0; i < sill.length; i += 3) { const nf = proj(sill[i], 0.004, sill[i + 1]); if (nf) batch.put(PX, PY, 1.05 * PS, sill[i + 2] * sl * nf, 2); }
    }
    if (k > 0.01 && gone > 0.01) {
      const kk = k * G * gone;
      for (let i = 0; i < floor.length; i += 4) {
        const z = floor[i + 1], nf = proj(floor[i], 0, z);
        if (nf) batch.put(PX, PY, floor[i + 3] * PS * 0.95, floor[i + 2] * kk * nf * (z < 0 ? 0.78 : 0.85), z < 0 ? 1 : 2);
      }
      const km = smooth(0.2, 1, k) * G * gone;
      for (let i = 0; i < motes.length; i += 6) {
        const ph = motes[i + 3], z = motes[i + 2];
        const nf = proj(motes[i] + 0.06 * Math.sin(clock * 0.21 + ph), motes[i + 1] + 0.05 * Math.cos(clock * 0.16 + ph * 2), z);
        if (nf) batch.put(PX, PY, motes[i + 5] * PS * 0.8, km * nf * (1 - z / 9.5) * (0.16 + 0.42 * (0.5 + 0.5 * Math.sin(clock * motes[i + 4] + ph))), 2);
      }
    }
    if (o.room && rIn > 0.001) room.draw(batch, { ...o.room, t: clock, dim: 1 });
    batch.flush(); blank = false;
    if (glow) glow.style.opacity = (k * G * (1 - 0.65 * smooth(0, 1, rIn))).toFixed(3);
  }

  return {
    get f() { return f; },
    get p() { return pS; },
    get walk() { return walkNow; },
    get border() { return borderNow; },
    get dead() { return batch.dead; },
    get points() { return batch.count; },
    get roomPoints() { return room.count; },
    // o wie ../tuer/buehne.js, dazu border [l, t, r, b] und room { rect, cx, cy, F, sp, rad, yaw, pitch, rIn, pulse, hh, mm } (oder null)
    frame(dt, o) {
      const still = isStill();
      build(o.w, o.h, o.areaBot - o.areaTop, o.desk);
      if (o.room) {
        if (!room.built || Math.abs(o.room.sp - roomSp) / roomSp > 0.12) { roomSp = o.room.sp; room.build(roomSp); lastKey = ''; }
        room.setHands(o.room.hh, o.room.mm);
      }
      if (!still) clock += dt;
      const kf = still ? 1 : 1 - Math.exp(-dt * 2.4);
      f += (o.fWant - f) * kf; if (Math.abs(o.fWant - f) < 0.002) f = o.fWant;
      pS += (o.pWant - pS) * kf; if (Math.abs(o.pWant - pS) < 0.0015) pS = o.pWant;
      const rm = o.room;
      const key = `${f.toFixed(3)}|${pS.toFixed(4)}|${Math.round(o.areaTop)}|${Math.round(o.cx)}|${Math.round(o.fadeY)}|${o.border.map(Math.round).join(',')}` +
        (rm ? `|${rm.yaw.toFixed(4)}|${rm.pitch.toFixed(4)}|${rm.rIn.toFixed(3)}|${rm.cx | 0}|${rm.cy | 0}|${rm.F | 0}|${rm.hh}:${rm.mm}|${rm.rect.map(Math.round).join(',')}` : '');
      const doorAlive = !still && (f > 0.75 || pS > 0.06) && (!rm || rm.rIn < 1);
      const alive = doorAlive || (!still && rm && rm.pulse);
      if (key === lastKey) { if (!alive) return; skip = !skip; if (skip) return; }
      lastKey = key;
      draw(pS, o);
    },
    clear() { if (!blank) { batch.clear(); blank = true; if (glow) glow.style.opacity = '0'; lastKey = ''; } },
    reset() { f = 0; pS = 0; lastKey = ''; },
  };
}
