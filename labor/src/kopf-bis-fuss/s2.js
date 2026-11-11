// Studie 2 „Lot“: Ein Senklot hängt durch die Seite – so beginnt eine Untersuchung der Statik.
// Das Lot ist der einzige Lichtpunkt; es pendelt beim Scrollen leicht nach und kommt zur Ruhe.
import { FIG, toPath } from './figure.js';
import { clamp, smooth, svgEl, setCam, mixCam, BAR } from './util.js';

export function s2(root, opt) {
  const stage = root.querySelector('.stage'), svg = stage.querySelector('.fig'), over = stage.querySelector('.over');
  const first = root.querySelector('.first'), lead = first.querySelector('.lead'), note = first.querySelector('.note');
  const win = root.querySelector('.window'), region = win.querySelector('.region');
  svg.textContent = ''; over.textContent = '';

  [FIG.front, FIG.back].forEach((L) => svgEl('path', { d: toPath(L), class: 'ln' }, svg));
  [FIG.arm, ...Object.values(FIG.detail)].forEach((L) => svgEl('path', { d: toPath(L), class: 'ln fine' }, svg));
  const acc = svgEl('g', { class: 'xray' }, svg);
  svgEl('path', { d: toPath(FIG.mandible), class: 'an amber' }, acc);
  FIG.vert.forEach((v) => v.lines.forEach((L) => svgEl('path', { d: toPath(L), class: 'an blue' }, acc)));
  const ring = {};
  for (const k of ['ear', 'shoulder', 'tmj', 'atlas']) ring[k] = svgEl('circle', { class: 'ring', cx: FIG.mark[k][0], cy: FIG.mark[k][1], r: 5 }, svg);

  // Überlagerung in Bildschirm-Pixeln: Schnur, Lot, Hinweislinien
  const glow = svgEl('radialGradient', { id: 'lotGlow' }, svgEl('defs', {}, over));
  svgEl('stop', { offset: 0, 'stop-color': '#E3A043', 'stop-opacity': 0.55 }, glow);
  svgEl('stop', { offset: 1, 'stop-color': '#E3A043', 'stop-opacity': 0 }, glow);
  const hook = svgEl('circle', { class: 'hook', r: 3 }, over);  // Aufhängung über dem Scheitel
  // Nummern wie auf einer Anatomie-Tafel: 1 Kiefergelenk, 2 Atlas (Liste steht unter der Überschrift)
  const nums = ['tmj', 'atlas'].map((k, i) => {
    const el = svgEl('g', { class: 'num' }, over);
    svgEl('circle', { r: 8.5 }, el); svgEl('text', { y: 3.6, 'text-anchor': 'middle' }, el).textContent = i + 1;
    return { k, el, li: region.querySelector(`[data-m="${k}"]`) };
  });
  const offs = svgEl('path', { class: 'offs' }, over);            // kleine Maßlinie: Abstand Lot ↔ Schulter
  const string = svgEl('line', { class: 'string' }, over);
  const bob = svgEl('g', { class: 'bob' }, over);
  svgEl('circle', { r: 46, fill: 'url(#lotGlow)' }, bob);
  svgEl('path', { d: 'M-2.5 -24h5v5h-5zM-9 -19h18l-3 22L0 26L-6 3z', class: 'bobshape' }, bob);

  let W = 0, H = 0, K0, K1, last = 0, lastScroll = scrollY, th = opt.reduced ? 0 : 0.03, om = 0, drop = opt.reduced ? 1 : 0, born = 0;
  function layout() {
    W = stage.clientWidth; H = stage.clientHeight;
    const usable = H - BAR, lb = lead.offsetTop + lead.offsetHeight;
    const s0 = Math.min(W / 330, (usable - lb - 52) / 430);
    K0 = { s: s0, ox: W - 14 - 258 * s0, oy: lb + 34 - 30 * s0 };
    first.style.setProperty('--ntop', K0.oy + 296 * s0 - lb + 'px');
    first.style.setProperty('--nw', Math.max(130, W - 14 - 138 * s0 - 36) + 'px');
    const s1 = s0 * 1.5;
    K1 = { s: s1, ox: W - 14 - 216 * s1, oy: 0.42 * H - 300 * s1 };
    win.style.setProperty('--rtop', K1.oy + 288 * s1 + 14 + 'px');
    win.style.setProperty('--rw', Math.max(130, W - 14 - 96 * s1 - 44) + 'px');
    over.setAttribute('viewBox', `0 0 ${W} ${H}`);
  }
  const ro = new ResizeObserver(layout); ro.observe(stage); ro.observe(lead);
  layout();

  function frame(t) {
    if (!born) born = t;
    const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
    const sy = scrollY, dy = sy - lastScroll; lastScroll = sy;
    const sr = stage.getBoundingClientRect(), wr = win.getBoundingClientRect();
    const raw = clamp((0.85 * H - wr.top) / (0.55 * H));
    const cp = opt.reduced ? +(raw > 0.5) : smooth(raw);
    const cam = mixCam(K0, K1, cp);
    setCam(svg, cam, W, H);
    const X = (p) => p[0] * cam.s + cam.ox, Y = (p) => p[1] * cam.s + cam.oy;

    // Pendel: Feder + Dämpfung, angestoßen vom Scrollen
    if (!opt.reduced) {
      om += (-14 * th - 2.2 * om) * dt + clamp(dy / H, -0.2, 0.2) * 0.35;
      th = clamp(th + om * dt, -0.045, 0.045);
      drop = clamp((t - born - 350) / 1700);
    }
    const lx = X(FIG.mark.ear), restY = Math.min(Y(FIG.mark.shoulder) - 27, H - BAR - 40);
    const e = 1 - Math.pow(1 - drop, 3), top0 = 10 * cam.s + cam.oy + 30, by = top0 + (restY - top0) * e;
    const ay = 10 * cam.s + cam.oy, len = Math.max(60, by - ay), bx = lx + Math.sin(th) * len;
    hook.setAttribute('cx', lx.toFixed(1)); hook.setAttribute('cy', ay.toFixed(1));
    string.setAttribute('x1', lx.toFixed(1)); string.setAttribute('y1', ay.toFixed(1)); string.setAttribute('x2', bx.toFixed(2)); string.setAttribute('y2', (by - 24).toFixed(2));
    bob.setAttribute('transform', `translate(${bx.toFixed(2)} ${by.toFixed(2)}) rotate(${(-th * 57.3).toFixed(2)})`);

    // Tastpunkte leuchten, wenn das Lot sie erreicht
    const done = drop >= 1;
    ring.ear.classList.toggle('on', by > Y(FIG.mark.ear));
    ring.shoulder.classList.toggle('on', done);
    note.classList.toggle('on', done);
    const sx = X(FIG.mark.shoulder), sY = Y(FIG.mark.shoulder);
    offs.setAttribute('d', `M${lx.toFixed(1)} ${sY.toFixed(1)}H${(sx - 5 * cam.s).toFixed(1)}M${lx.toFixed(1)} ${(sY - 4).toFixed(1)}v8`);
    offs.style.opacity = done ? 1 - cp : 0;
    acc.style.opacity = 0.34 + 0.66 * cp;
    ring.tmj.classList.toggle('on', raw > 0.62); ring.atlas.classList.toggle('on', raw > 0.74);
    region.style.opacity = smooth(clamp((raw - 0.55) / 0.4)) * clamp((wr.bottom - 0.66 * H) / (0.12 * H));
    nums.forEach((n) => {
      const m = FIG.mark[n.k], on = ring[n.k].classList.contains('on');
      n.el.setAttribute('transform', `translate(${(X(m) - 13 * cam.s).toFixed(1)} ${(Y(m) - 9 * cam.s).toFixed(1)})`);
      n.el.style.opacity = on ? 1 : 0; n.li.classList.toggle('on', on);
    });
  }
  return { frame, destroy() { ro.disconnect(); } };
}
