// Labor · Manuthera – drei Entwürfe auf einer Seite. Jede Bühne rendert nur, solange sie sichtbar ist.
import { initA, MODES } from './ideaA.js';
import { initB } from './ideaB.js';
import { initC, MODES_C } from './ideaC.js';

const $ = (s) => document.querySelector(s);
const stages = [];

// ---------- A ----------
const btnA = [...document.querySelectorAll('#modesA button')];
const readA = $('#readA');
const A = initA($('#glA'), {
  onMode(i) {
    btnA.forEach((b, j) => { b.classList.toggle('is-on', j === i); b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); b.querySelector('i').style.width = '0'; });
    readA.textContent = MODES[i].txt;
  },
  onAmount(a) { const b = btnA.find((x) => x.classList.contains('is-on')); if (b) b.querySelector('i').style.width = (a * 100).toFixed(1) + '%'; },
});
if (A) { stages.push(A); btnA.forEach((b, i) => b.addEventListener('click', () => A.select(i, true))); }
else readA.textContent = MODES[0].txt;

// ---------- B ----------
const slider = $('#zugB'), out = $('#zugOut');
const B = initB($('#glB'), {
  slider,
  labels: [{ el: $('#tagDisc'), kind: 'disc' }, { el: $('#tagRoot'), kind: 'root' }],
  onAmount(T) { const v = Math.round(T * 100); out.textContent = v + ' %'; slider.style.setProperty('--p', v + '%'); },
});
if (B) stages.push(B);

// ---------- C ----------
const btnC = [...document.querySelectorAll('#modesC button')];
const planeC = $('#planeC');
const Cc = initC($('#glC'), {
  onMode(i) {
    btnC.forEach((b, j) => { b.classList.toggle('is-on', j === i); b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
    planeC.textContent = MODES_C[i].name + ' · ' + MODES_C[i].plane;
  },
});
if (Cc) { stages.push(Cc); btnC.forEach((b, i) => b.addEventListener('click', () => Cc.select(i, true))); }

// ---------- Takt ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
  const t = now / 1000;
  for (const s of stages) {
    if (!s.st.visible) continue;
    s.update(t, dt);
    s.st.renderer.render(s.st.scene, s.st.camera);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
