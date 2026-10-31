// Labor · Porträt: drei Ideen mit derselben Bildquelle (Beispiel-Büste, später Kais Foto).
import { renderPhoto } from './bust.js';
import { initOne, initTwo, initThree } from './demos.js';

const $ = (s) => document.querySelector(s);
const img = renderPhoto(480, 600);
const stages = [];
if (img) {
  const one = initOne($('#gl1'), img); if (one) stages.push(one);
  const prog = $('#prog2');
  const two = initTwo($('#gl2'), img, $('#scrolly2'), { onProgress: (p) => { prog.style.width = (p * 100).toFixed(1) + '%'; } }); if (two) stages.push(two);
}
const three = initThree($('#gl3')); if (three) stages.push(three);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
  for (const s of stages) { if (!s.st.visible) continue; s.update(now / 1000, dt); s.st.renderer.render(s.st.scene, s.st.camera); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
