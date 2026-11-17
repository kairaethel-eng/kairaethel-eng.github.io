// Zeiger für alle Partikel-Bühnen (17.11.2026, Go Kai: Ideen aus der Studie „Feinschliff“ auf die ganze Website):
// Punkte unter Maus oder Finger werden etwas größer und warmweiß. Hier nur die Lage im Fenster, weich nachgeführt;
// jede Bühne rechnet sie in ihre eigene Zeichenfläche um (ndc()) und gibt sie als uPtr an ihren Shader.
// Finger: die Punkte antworten auch beim Scrollen (nur zuhören, nichts aufhalten) und klingen nach dem Loslassen aus.
const P = { x: 0, y: 0, tx: 0, ty: 0, k: 0, want: 0, has: false, on: false };
function at(x, y) { P.tx = x; P.ty = y; P.want = 1; if (!P.has || P.k < 0.02) { P.x = x; P.y = y; P.has = true; } }
function listen() {
  if (P.on) return; P.on = true;
  addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') at(e.clientX, e.clientY); }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { P.want = 0; });
  const finger = (e) => { if (e.touches.length) at(e.touches[0].clientX, e.touches[0].clientY); };
  addEventListener('touchstart', finger, { passive: true }); addEventListener('touchmove', finger, { passive: true });
  const off = () => { P.want = 0; };
  addEventListener('touchend', off, { passive: true }); addEventListener('touchcancel', off, { passive: true });
}
export const pointer = {
  // einmal je Bild (dt in Sekunden); true = es gibt etwas zu zeichnen
  update(dt) {
    listen();
    if (!P.has || (P.k <= 0 && !P.want)) return false;
    const f = 1 - Math.exp(-dt * 16);
    P.x += (P.tx - P.x) * f; P.y += (P.ty - P.y) * f;
    P.k += (P.want - P.k) * (1 - Math.exp(-dt * (P.want > P.k ? 7 : 2.4)));
    if (!P.want && P.k < 0.002) P.k = 0;
    return true;
  },
  k: () => P.k,
  // Lage in der Zeichenfläche: x, y −1…1 (y oben = 1), Radius in halben Höhen, Stärke; rect = getBoundingClientRect()
  ndc(rect, out, radiusPx = 56) {
    const w = rect.width || 1, h = rect.height || 1;
    out[0] = (P.x - rect.left) / w * 2 - 1; out[1] = 1 - (P.y - rect.top) / h * 2; out[2] = radiusPx / (h / 2); out[3] = P.k;
    return out;
  },
};
// GLSL: am Ende des Vertex-Shaders einsetzen. Erwartet uniform vec4 uPtr; uniform float uAsp (Breite/Höhe) und gl_Position.
export const PTR_GLSL = /* glsl */`
  float ptrK(){
    vec2 q = (gl_Position.xy / gl_Position.w - uPtr.xy) * vec2(uAsp, 1.);
    return uPtr.w * exp(-dot(q, q) / (uPtr.z * uPtr.z));
  }`;
