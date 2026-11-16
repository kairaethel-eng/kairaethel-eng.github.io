// Entwurf „Tür“ · Variante A „Tür im Text“ (16.11.2026): Die Tür steht dort, wo die Knöpfe sind.
// Rahmen, Schwelle und Lichtschein sind CSS (scharf, bleiben stehen); das Blatt ist eine gestochene Punktmenge auf einer
// kleinen Canvas-Bühne, schwingt einmal nach innen auf (Band links) und zerfällt zu Staub. Danach schweben nur noch
// ein paar Lichtpunkte im Türrahmen. Zeitgesteuert, kein Scroll-Zwang.
import { TAU, OPEN, clamp01, easeOut, rng, leafPoints, LEAF_N, makeBatch } from './door.js';

const T_SWING = 1.3;   // s Aufschwingen (wie „offen.“ in der Überschrift)
const T_DUST = 0.95;   // s ab hier beginnt das Blatt zu zerfallen
const T_END = 2.9;     // s danach nur noch Lichtpunkte

export function initA({ root, isStill }) {
  const cv = root.querySelector('.dw-cv'), ctx = cv.getContext('2d'), batch = makeBatch(ctx);
  let W = 0, H = 0, PAD = 0, dpr = 1, leaf = null, motes = [];
  let state = 'closed'; // closed | opening | open
  let t = 0, amb = 0, seen = true, skip = false, dirty = true, held = false;

  function measure() {
    const r = root.getBoundingClientRect(), c = cv.getBoundingClientRect();
    const w = Math.round(r.width), h = Math.round(r.height);
    if (!w || !h || !c.width) return false; // Variante nicht sichtbar
    const d = Math.min(window.devicePixelRatio || 1, 2.5);
    if (w === W && h === H && d === dpr && leaf) return true;
    W = w; H = h; dpr = d; PAD = (c.width - r.width) / 2;
    cv.width = Math.round(c.width * dpr); cv.height = Math.round(c.height * dpr);
    leaf = leafPoints(W - 4, H - 3);
    const R = rng(21);
    motes = Array.from({ length: Math.round(18 + (W * H) / 5200) }, () => ({ x: R(), y: R(), sp: 0.012 + R() * 0.03, ph: R() * TAU, w: 0.5 + R() * 0.9, r: 0.7 + R() * 0.9, sw: 4 + R() * 9 }));
    dirty = true;
    return true;
  }

  function draw(now) {
    dirty = false;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W + PAD * 2, H + PAD * 2);
    ctx.globalCompositeOperation = 'lighter';
    const cx = PAD + W / 2, cy = PAD + H / 2, D = W * 2.6, lw = W - 4, lh = H - 3;
    if (state !== 'open' && leaf) {
      const k = state === 'closed' ? 0 : easeOut(t / T_SWING), ang = OPEN * k, ca = Math.cos(ang), sa = Math.sin(ang);
      const shade = 1 - 0.34 * k;
      for (let i = 0; i < leaf.length; i += LEAF_N) {
        const u = leaf[i], v = leaf[i + 1], r1 = leaf[i + 5], r2 = leaf[i + 6];
        let x = -lw / 2 + u * lw * ca, z = u * lw * sa, y = (0.5 - v) * lh + 1.5, a = leaf[i + 2] * shade, s = leaf[i + 3];
        if (state === 'opening') {
          // Zerfall: von der freien Kante zum Band hin, jeder Punkt mit eigenem Zeitpunkt
          const td = t - (T_DUST + (1 - u) * 0.4 + r1 * 0.4);
          if (td > 0) {
            const q = td / 1.15;
            if (q >= 1) continue;
            const e = q * q;
            x += (r2 - 0.5) * W * 0.5 * q + Math.sin(r1 * 40 + q * 5) * 5 * q;
            y -= (26 + 90 * r1) * e + 12 * q;
            z += W * 0.6 * q;
            a *= (1 - q) * (1 - q);
            s *= 1 - 0.35 * q;
          }
        }
        const p = D / (D + z);
        batch.put(cx + x * p, cy + y * p, s * p, a, leaf[i + 4]);
      }
    }
    if (amb > 0.01) {
      const tt = now / 1000;
      for (const m of motes) {
        const yy = (((m.y - tt * m.sp) % 1) + 1) % 1; // steigt langsam auf
        const edge = Math.min(1, yy * 6, (1 - yy) * 4);
        const a = amb * edge * (0.14 + 0.36 * (0.5 + 0.5 * Math.sin(tt * m.w + m.ph)));
        batch.put(PAD + 6 + m.x * (W - 12) + Math.sin(tt * 0.4 + m.ph) * m.sw, PAD + yy * H, m.r, a, 2);
      }
    }
    batch.flush();
  }

  function setOpen(k) { root.style.setProperty('--open', k.toFixed(3)); }

  const api = {
    get state() { return state; },
    get t() { return t; },
    reset() { state = 'closed'; t = 0; amb = 0; setOpen(0); dirty = true; },
    // instant = Endzustand ohne Bewegung („Bewegung anhalten/reduzieren“, Tastatur-Fokus auf einem Knopf)
    open(instant) {
      if (state === 'open' || (state === 'opening' && !instant)) return;
      if (instant) { state = 'open'; t = T_END; amb = 1; setOpen(1); dirty = true; } else { state = 'opening'; t = 0; }
    },
    // Prüfhilfe: an einer festen Stelle anhalten (Sekunden seit dem Öffnen), null = weiterlaufen
    hold(tt) { held = tt != null; if (held) { state = 'opening'; t = tt; } },
    tick(now, dt) {
      if (!measure() || !seen) return;
      if (state === 'opening') {
        if (!held) t += dt;
        setOpen(easeOut(t / T_SWING));
        amb = clamp01((t - 0.5) / 1.2);
        if (t >= T_END) { state = 'open'; amb = 1; }
        draw(now);
      } else if (state === 'open' && !isStill()) {
        skip = !skip; if (!skip) draw(now); // Lichtpunkte: jedes zweite Bild reicht
      } else if (dirty) draw(isStill() ? 0 : now);
    },
  };
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => { seen = es[0].isIntersecting; if (seen) dirty = true; }, { rootMargin: '25% 0px' }).observe(root);
  return api;
}
