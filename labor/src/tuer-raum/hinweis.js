// Tipp-Hinweis an den antippbaren Dingen im Raum (Go Kai 23.11.2026: „a, mit einer kleinen Klick- oder Tipp-Animation auf die Elemente“).
// A: Terminbuch, Telefon und Fenster sind in Bernstein gezeichnet (raum.js, Art 4 mit o.edgeAll) – Bernstein heißt auf der Seite „Handlung“.
// Dazu hier: Kommt man ruhig an einer Richtung an, „tippt“ es zweimal sanft auf das Ding (Punkt drückt zweimal, zwei Ringe laufen aus);
// ist das Ding noch nicht benutzt, einmal nach TAP_AGAIN Sekunden erneut – danach Ruhe (keine Schleife). Beim Telefon sitzt der Hinweis
// genau auf dem Anrufbeantworter-Punkt (sonst pulsierten zwei Dinge im Bild). Antippen: das Ding leuchtet kurz auf (flash → raum.js).
// Lage lokal je Richtung (x, y, z wie raum.js); die Hinweise sind aria-hidden, Bedienung bleibt über Tastflächen/Wandschrift/Knöpfe.
import { GEO } from './raum.js';

const WZ = GEO.WALL - GEO.R;
export const TAP_AT = [[0.06, -0.07, 0.13], null, [-0.07, -0.36, 0.0], [0.28, -0.04, WZ + 0.04]];
const TAP_FIRST = 0.8, TAP_AGAIN = 7, FLASH_MS = 700;

export function makeTapHints({ host, hits, project }) {
  const els = TAP_AT.map((p) => {
    if (!p) return null;
    const d = document.createElement('span');
    d.className = 'tap-hint'; d.setAttribute('aria-hidden', 'true'); d.innerHTML = '<i></i><i></i><b></b>';
    host.appendChild(d);
    return d;
  });
  const used = [false, false, false, false], flashAt = [-1e9, -1e9, -1e9, -1e9], last = ['', '', '', ''];
  let at = -1, t = 0, plays = 0;
  hits.forEach((h) => h.addEventListener('click', () => { const k = +h.dataset.k; used[k] = true; flashAt[k] = performance.now(); }));
  const play = (el) => { el.classList.remove('is-tap'); void el.offsetWidth; el.classList.add('is-tap'); };
  return {
    // cam: Kamera wie raum.draw · s: { on (Raum sichtbar), k (Richtung, an der man ruhig angekommen ist, sonst −1), ang(k) (Winkel zur Richtung), still }
    frame(dt, cam, s) {
      if (s.k !== at) { at = s.k; t = 0; plays = 0; els.forEach((el) => el && el.classList.remove('is-tap')); }
      else if (at >= 0) t += dt;
      if (at >= 0 && els[at] && !used[at] && !s.still && ((plays === 0 && t > TAP_FIRST) || (plays === 1 && t > TAP_FIRST + TAP_AGAIN))) { play(els[at]); plays++; }
      els.forEach((el, k) => {
        if (!el) return;
        const a = s.on ? s.ang(k) : 9;
        let key = 'off';
        if (a < 0.5) { const p = project(k, TAP_AT[k][0], TAP_AT[k][1], TAP_AT[k][2], cam); if (p) key = `${p[0].toFixed(1)},${p[1].toFixed(1)},${(1 - Math.min(1, Math.max(0, (a - 0.08) / 0.3))).toFixed(2)}`; }
        if (key === last[k]) return; last[k] = key;
        if (key === 'off') { el.style.visibility = 'hidden'; return; }
        const [x, y, o] = key.split(',');
        el.style.transform = `translate(${x}px,${y}px)`; el.style.opacity = o; el.style.visibility = 'visible';
      });
    },
    // Aufleuchten nach dem Antippen: { k, v } für raum.js (v 0 … 1)
    flash() { const now = performance.now(); let k = -1, v = 0; flashAt.forEach((f, i) => { const x = 1 - (now - f) / FLASH_MS; if (x > v) { v = x; k = i; } }); return { k, v: Math.max(0, v) }; },
  };
}
