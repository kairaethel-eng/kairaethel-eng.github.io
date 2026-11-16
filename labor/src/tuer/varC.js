// Entwurf „Tür“ · Variante C-kurz „Ein Schritt hindurch“ (16.11.2026): bildschirmgroße Tür hinter dem Text, feste Bühne.
// 1) Entstehen (hängt am Scrollen, knapp eine Bildschirmhöhe, keine Extra-Strecke): Staub sammelt sich zur Dachlinie, die Dachlinie klappt zum Türrahmen
//    herunter, das Blatt verdichtet sich. 2) Schritt (hängt an der Zeit, läuft einmal, ruhig: 6,4 s): Blatt schwingt nach innen auf, die Kamera
//    geht hindurch, der Rahmen wandert über den Bildrand. 3) Drinnen: warmer Boden-Schein und Lichtpunkte, gedämpft.
// Welt in Metern: Türöffnung 1 × 2,05, Boden y = 0, Türebene z = 0, z > 0 = drinnen. Eigene Zentralprojektion auf Canvas 2D.
import { TAU, OPEN, clamp01, smooth, easeInOut, easeSine, easeCalm, rng, leafPoints, LEAF_N, makeBatch } from './door.js';

const DW = 1, DH = 2.05, D0 = 4.2, ZEND = 1.4, EYE = 1.08;
// Zeiten in Sekunden seit dem Öffnen. 16.11. (Kai: „deutlich langsamere Animation, entspannt, Ruhe“): Schritt 1,75 s → 6,4 s,
// Blatt schwingt 2,8 s auf, die Kamera geht 5 s (der Rahmen verlässt das Bild nach rund 3,4 s); kein Schnellvorlauf mehr. Knöpfe ab T_GATE (Tür gut halb offen).
const T_SWING = 2.8, T_WALK0 = 1.4, T_WALK = 5.0, T_GATE = 1.8, T_DONE = 6.4, T_SETTLE = 3.6;
const FR_N = 9; // Rahmenpunkt: Dach x, y · Tür x, y · Versatz q · Helligkeit · Größe · 2 Zufallswerte

export function initC({ cv, glow, isStill }) {
  const ctx = cv.getContext('2d'), batch = makeBatch(ctx);
  let VW = 0, CH = 0, dpr = 1, F = 1, px = 1, cx = 0, cy = 0;
  let frame = null, leaf = null, floor = null, motes = null, sill = null;
  let state = 'form'; // form | step | done
  let f = 0, T = 0, clock = 0, skip = false, dirty = true, lastG = -1, lastTop = 0, lastBot = 0, held = false;

  function build() {
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return false; // Variante nicht sichtbar
    const d = Math.min(window.devicePixelRatio || 1, 2), vh = window.innerHeight;
    if (w === VW && h === CH && d === dpr && frame) return true;
    VW = w; CH = h; dpr = d; cx = VW / 2;
    cv.width = Math.round(VW * dpr); cv.height = Math.round(CH * dpr);
    F = Math.min((0.56 * vh * D0) / DH, 0.58 * VW * D0);
    px = F / D0; // Bildpunkte je Meter, solange die Kamera draußen steht
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
    dirty = true;
    return true;
  }

  function draw(titleTop, actBottom, vh) {
    dirty = false;
    // Beim Entstehen kommt die Tür mit dem Kapitel von unten herauf (gehört sichtbar zu Kapitel 05, liegt nicht über dem
    // Text davor); wenn der Schritt beginnt (Überschrift bei 66 % der Fensterhöhe), steht sie in der Bildmitte.
    cy = state === 'form' ? Math.max(vh * 0.52, titleTop - vh * 0.14) : vh * 0.52;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, VW, CH);
    ctx.globalCompositeOperation = 'lighter';
    const k = state === 'form' ? 0 : state === 'done' ? 1 : easeCalm(T / T_SWING); // Tür offen 0 … 1
    const walk = state === 'form' ? 0 : state === 'done' ? 1 : easeSine((T - T_WALK0) / T_WALK);
    const zc = -D0 + (D0 + ZEND) * walk;
    // nach dem Schritt gedämpft; verschwindet, wenn das Kapitel wieder nach unten aus dem Bild geht oder die Knöpfe oben hinaus sind
    const amb = 1 - 0.42 * smooth(T_DONE - 0.4, T_DONE + T_SETTLE, T);
    const G = state === 'form' ? 1 : amb * (0.3 + 0.7 * smooth(-0.1 * vh, 0.3 * vh, actBottom)) * smooth(vh * 1.3, vh * 0.95, titleTop) * smooth(-1.2 * vh, -0.5 * vh, actBottom);
    lastG = G; lastTop = titleTop; lastBot = actBottom;
    const ang = OPEN * k, ca = Math.cos(ang), sa = Math.sin(ang);
    let PX = 0, PY = 0, PS = 1; // Ergebnis der Projektion (Bildpunkt, Größenfaktor); Rückgabe = Ausblenden kurz vor der Kamera
    const proj = (x, y, z) => { const dp = z - zc; if (dp < 0.12) return 0; const p = F / dp; PX = cx + x * p; PY = cy - (y - EYE) * p; PS = Math.min(1.7, Math.max(0.55, p / px)); return smooth(0.2, 1.7, dp); }; // löst sich früh und weich auf, statt an der Kamera vorbeizuschießen
    if (zc < 0.2) {
      // Rahmen: sammeln (f 0 … .35), herunterklappen (f .35 … 1)
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
    batch.flush();
    if (glow) glow.style.opacity = (k * G * (state === 'form' ? 0 : 1)).toFixed(3);
  }

  const api = {
    get state() { return state; },
    get f() { return f; },
    get T() { return T; },
    // Knöpfe dürfen erscheinen (die Tür ist auf, die Kamera auf der Schwelle)
    gate() { return state === 'done' || (state === 'step' && T >= T_GATE); },
    reset() { state = 'form'; f = 0; T = 0; dirty = true; },
    finish() { state = 'done'; f = 1; T = T_DONE + T_SETTLE + 1; dirty = true; }, // Endzustand ohne Bewegung
    // titleTop/actTop/actBottom: Lage von Überschrift und Knöpfen im Fenster (px)
    tick(dt, titleTop, actTop, actBottom) {
      if (!build()) return;
      const vh = window.innerHeight, still = isStill();
      if (!still) clock += dt;
      if (state === 'form') {
        // Entstehen über knapp eine Bildschirmhöhe Scrollweg (Richtwert der Seite seit 16.11.), weich nachgeführt
        const want = smooth(vh * 1.5, vh * 0.62, titleTop), f0 = f;
        f += (want - f) * (1 - Math.exp(-dt * 3.5));
        if (Math.abs(want - f) < 0.002) f = want;
        if (f > 0.985 && want >= 1) { state = 'step'; f = 1; T = 0; }
        if (f !== f0 || dirty || (f > 0.75 && !still)) draw(titleTop, actBottom, vh); // ab f > .75 pulsiert der Lichtspalt
      } else if (held) {
        draw(titleTop, actBottom, vh);
      } else if (state === 'step') {
        T += dt; // ein Tempo, kein Schnellvorlauf – wer weiterscrollt, bekommt die Knöpfe ab T_GATE trotzdem
        if (T >= T_DONE) state = 'done';
        draw(titleTop, actBottom, vh);
      } else {
        T += dt;
        const vis = titleTop < vh * 1.3 && actBottom > -vh * 1.2;
        if (!vis) { if (lastG > 0) draw(titleTop, actBottom, vh); return; } // einmal leeren, dann ruht die Bühne
        if (still) { if (dirty || titleTop !== lastTop || actBottom !== lastBot) draw(titleTop, actBottom, vh); return; }
        skip = !skip; if (!skip || T < T_DONE + T_SETTLE + 0.2) draw(titleTop, actBottom, vh); // Ruhezustand: jedes zweite Bild
      }
    },
    redraw() { dirty = true; },
    // Prüfhilfe: Schritt an einer festen Stelle anhalten (Sekunden seit dem Öffnen), null = weiterlaufen
    hold(t) { held = t != null; if (held) { state = t >= T_DONE ? 'done' : 'step'; f = 1; T = t; dirty = true; } },
  };
  return api;
}
