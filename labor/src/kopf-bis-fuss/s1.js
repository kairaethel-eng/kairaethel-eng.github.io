// Studie 1 „Zeichnung“: Die Figur zeichnet sich selbst – so weit gelesen wurde, so weit ist der Mensch gezeichnet.
import { FIG, toPath, measure, at } from './figure.js';
import { clamp, smooth, svgEl, setCam, mixCam, BAR } from './util.js';

export function s1(root, opt) {
  const stage = root.querySelector('.stage'), svg = stage.querySelector('.fig');
  const first = root.querySelector('.first'), h1 = first.querySelector('h1'), lead = first.querySelector('.lead');
  const win = root.querySelector('.window'), region = win.querySelector('.region');
  svg.textContent = '';

  // Linien, die der Stift von oben nach unten zieht (Vorder- und Rückseite, Oberarm)
  const top = FIG.arm.reduce((m, p, i) => (p[1] < FIG.arm[m][1] ? i : m), 0);
  const pen = [FIG.front, FIG.back, FIG.arm.slice(0, top + 1).reverse(), FIG.arm.slice(top)].map((L, i) => {
    const S = measure(L), my = []; let m = -1e9;
    for (const p of L) { m = Math.max(m, p[1]); my.push(m); }
    return { L, S, my, total: S[S.length - 1], el: svgEl('path', { d: toPath(L), class: i < 2 ? 'ln' : 'ln fine' }, svg) };
  });
  const lenAtY = (o, y) => {
    let lo = 0, hi = o.my.length - 1;
    if (y <= o.my[0]) return 0; if (y >= o.my[hi]) return o.total;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (o.my[m] < y) lo = m; else hi = m; }
    return o.S[lo] + (o.S[hi] - o.S[lo]) * ((y - o.my[lo]) / (o.my[hi] - o.my[lo] || 1));
  };
  // Einzelheiten erscheinen, sobald der Stift ihre Höhe erreicht
  const D = FIG.detail;
  const det = [[D.brow, 134], [D.eye, 152], [D.ear, 148], [D.earIn, 158], [D.nostril, 197], [D.jaw, 210], [D.scm, 216], [D.mouth, 229], [D.clav, 404]]
    .map(([L, y]) => ({ y, el: svgEl('path', { d: toPath(L), class: 'ln fine draw', pathLength: 1 }, svg) }));
  // Akzente der nächsten Region: Kiefer (Bernstein), Halswirbel (Blau)
  const acc = svgEl('g', { class: 'acc' }, svg);
  svgEl('path', { d: toPath(FIG.mandible), class: 'an amber draw', pathLength: 1, style: '--i:0' }, acc);
  FIG.vert.slice(0, 7).forEach((v, i) => v.lines.forEach((L) => svgEl('path', { d: toPath(L), class: 'an blue draw', pathLength: 1, style: `--i:${i + 2}` }, acc)));
  const tips = [0, 1].map(() => svgEl('circle', { class: 'tip', r: 2 }, svg));

  let W = 0, H = 0, K0, K1, intro = true, penY = 30, last = 0, lastScroll = -1, lastPen = -1, dirty = true;
  function layout() {
    W = stage.clientWidth; H = stage.clientHeight;
    const usable = H - BAR, hb = h1.offsetTop + h1.offsetHeight;
    let s0 = W / 300;
    for (let k = 0; k < 2; k++) {                       // Kopf zwischen Begrüßung und Leittext einpassen
      first.style.setProperty('--leadw', Math.max(140, W - 14 - 138 * s0 - 34) + 'px');
      s0 = Math.max(W / 300 * 0.78, Math.min(W / 300, (usable - hb - lead.offsetHeight - 78) / 262));
    }
    first.style.setProperty('--leadw', Math.max(140, W - 14 - 138 * s0 - 34) + 'px');
    first.style.setProperty('--gap', 262 * s0 + 14 + 'px');
    K0 = { s: s0, ox: W - 14 - 258 * s0, oy: hb + 14 - 30 * s0 };
    const s1 = s0 * 1.45;                               // Nahansicht Kiefer/Nacken
    K1 = { s: s1, ox: W - 14 - 216 * s1, oy: 0.44 * H - 300 * s1 };
    win.style.setProperty('--rtop', K1.oy + 288 * s1 + 14 + 'px');
    win.style.setProperty('--rw', Math.max(130, W - 14 - 96 * s1 - 44) + 'px');
    dirty = true;
  }
  const ro = new ResizeObserver(layout); ro.observe(stage); ro.observe(h1);
  layout();

  function frame(t) {
    const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
    const sy = scrollY;
    const wr = win.getBoundingClientRect();
    const raw = clamp((0.85 * H - wr.top) / (0.55 * H));
    const cp = opt.reduced ? +(raw > 0.5) : smooth(raw);
    const before = clamp(sy / Math.max(1, wr.top + sy - 0.85 * H));
    const target = 292 + 60 * before + 250 * cp;
    if (opt.reduced) penY = target;
    else {                                              // Stift: beim Ankommen ruhig (gut 2 s für den Kopf), beim Scrollen zügig hinterher
      const d = target - penY;
      if (penY > 288) intro = false;
      penY += clamp(d, -700 * dt, (intro ? 118 : Math.max(120, Math.abs(d) * 2.2)) * dt);
    }
    if (sy === lastScroll && Math.abs(penY - lastPen) < 0.01 && !dirty) return;
    lastScroll = sy; lastPen = penY; dirty = false;

    const cam = mixCam(K0, K1, cp);
    setCam(svg, cam, W, H);
    pen.forEach((o, i) => {
      const len = lenAtY(o, penY);
      o.el.style.strokeDasharray = `${len.toFixed(1)} ${(o.total + 20).toFixed(0)}`;
      o.el.style.visibility = len > 0.05 ? '' : 'hidden';
      if (i < 2) {
        const p = at(o.L, o.S, len), moving = Math.abs(target - penY) > 0.5 && len > 0 && len < o.total;
        tips[i].setAttribute('cx', p[0].toFixed(1)); tips[i].setAttribute('cy', p[1].toFixed(1)); tips[i].setAttribute('r', (2.3 / cam.s).toFixed(2));
        tips[i].style.opacity = moving ? 1 : 0;
      }
    });
    det.forEach((d) => d.el.classList.toggle('on', penY >= d.y));
    acc.classList.toggle('on', raw > 0.62);
    region.style.opacity = smooth(clamp((raw - 0.55) / 0.4)) * clamp((wr.bottom - 0.66 * H) / (0.12 * H));
  }
  return { frame, destroy() { ro.disconnect(); } };
}
