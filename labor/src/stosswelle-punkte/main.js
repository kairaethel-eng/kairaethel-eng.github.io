// Entwurf „Stoßwelle in Punkten“ (20.11.2026 nachts): dieselbe Motiv-Bühne wie die Leistungen in Puls, hier groß und ohne Wiegen.
import { motifStageGen } from '../test-4/services.js';
import { decode } from '../wirbel-echt/anatomie.js';
import { runSliced } from '../shared/slice.js';
import { pointer } from '../shared/zeiger.js';
import { MOTIVE, STUFEN } from './motiv.js';

const $ = (s) => document.querySelector(s);
const modes = $('#modes'), read = $('#read'), warte = $('#warte');
const btns = STUFEN.map((s, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = s.name; b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false'); modes.appendChild(b); return b; });
read.textContent = STUFEN[0].txt;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

fetch(HOP_ASSETS + 'motive-anatomie.bin').then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
  .then((buf) => { const A = {}; for (const q of decode(new Uint8Array(buf)).parts) A[q.id] = q; return runSliced(motifStageGen($('#gl'), { anat: A, sp: innerWidth > 920 ? 0.026 : 0.032, sway: reduced ? 0 : 0.1, cam: { y: 0.55, d: 5.2, look: 0.02 } }, MOTIVE)); })
  .then((m) => {
    if (!m) { warte.textContent = 'Auf diesem Gerät lässt sich die Grafik nicht zeichnen.'; return; }
    warte.hidden = true; window.__sw = m;
    btns.forEach((b, i) => b.addEventListener('click', () => { m.show(i); btns.forEach((x, j) => x.setAttribute('aria-pressed', j === i ? 'true' : 'false')); read.textContent = STUFEN[i].txt; }));
    let last = performance.now();
    const frame = (now) => { const dt = Math.min(0.1, (now - last) / 1000); last = now; pointer.update(dt); if (m.st.visible && !document.hidden) { m.update(0, dt); m.st.renderer.render(m.st.scene, m.st.camera); } requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
  })
  .catch(() => { warte.textContent = 'Die Grafik konnte nicht geladen werden (die Seite braucht die Datei „motive-anatomie.bin“ – bitte über die Testadresse öffnen).'; });
