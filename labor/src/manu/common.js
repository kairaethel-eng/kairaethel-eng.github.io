// Gemeinsame Bausteine für die drei Manuthera-Entwürfe:
// Bühne je Canvas (rendert nur, wenn sichtbar), Punkt-Shader im Puls-Stil, Formen aus Punkten.
import * as THREE from 'three';

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isDesktop = () => innerWidth > 920;
export const C = (h) => new THREE.Color(h);

export const COL = {
  ink: 0x0A161B,
  bone: C('#D9DCD3'), boneHi: C('#F3EADA'), petrol: C('#4E7F93'), amber: C('#E59A2F'),
  blue: C('#5AA2D6'), green: C('#8BC34A'), grey: C('#8C979B'),
};

// Weiche, runde Punkte (additiv)
export const FRAG = /* glsl */`
  varying vec3 vCol; varying float vA;
  void main(){
    float d = length(gl_PointCoord - .5);
    float a = smoothstep(.5, .05, d);
    gl_FragColor = vec4(vCol, a * vA);
    #include <colorspace_fragment>
  }`;

export function stage(canvas, { fov = 30, onResize, transparent = false } = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: transparent, powerPreference: 'high-performance' }); }
  catch (e) { canvas.classList.add('no-gl'); return null; }
  renderer.setClearColor(COL.ink, transparent ? 0 : 1);
  const st = { renderer, canvas, scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(fov, 1, 0.1, 100), pix: 1, w: 0, h: 0, visible: false, aspect: 1 };
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (w === st.w && h === st.h) return;
    st.w = w; st.h = h; st.aspect = w / h;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isDesktop() ? 1.6 : 1.5));
    renderer.setSize(w, h, false);
    st.camera.aspect = w / h; st.camera.updateProjectionMatrix();
    st.pix = renderer.getPixelRatio() * (h / 700);
    onResize && onResize(st);
  };
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => { st.visible = e.isIntersecting; }, { rootMargin: '120px' }).observe(canvas);
  resize();
  return st;
}

// Projektion eines Weltpunkts auf Canvas-Pixel (für HTML-Beschriftungen)
const _v = new THREE.Vector3();
export function toScreen(st, p) {
  _v.copy(p).project(st.camera);
  return { x: (_v.x * 0.5 + 0.5) * st.w, y: (-_v.y * 0.5 + 0.5) * st.h, z: _v.z };
}

// Kamera per Ziehen drehen (horizontal); vertikales Scrollen auf dem Handy bleibt frei (touch-action: pan-y)
export function dragYaw(el, state, k = 0.006) {
  let x0 = null, id = null;
  el.addEventListener('pointerdown', (e) => { x0 = e.clientX; id = e.pointerId; state.dragging = true; state.lastUser = performance.now(); });
  addEventListener('pointermove', (e) => {
    if (x0 === null || e.pointerId !== id) return;
    state.yawTarget += (e.clientX - x0) * k; x0 = e.clientX; state.lastUser = performance.now();
  });
  const up = () => { x0 = null; state.dragging = false; };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
}

export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const damp = (cur, want, lambda, dt) => cur + (want - cur) * (1 - Math.exp(-lambda * dt));

// ---------- Punktformen ----------
// Gerundeter Quader: Oberfläche gleichmäßig, Kanten dichter (wirkt wie ein Scan)
export function boxPts(out, n, cx, cy, cz, lx, ly, lz, edge = 0.45, hole = null) {
  const areas = [ly * lz, ly * lz, lx * lz, lx * lz, lx * ly, lx * ly];
  const tot = areas.reduce((a, b) => a + b, 0);
  let made = 0, guard = 0;
  while (made < n && guard++ < n * 20) {
    let x, y, z;
    if (Math.random() < edge) {
      // auf einer der 12 Kanten
      const e = Math.floor(Math.random() * 12), t = Math.random() - 0.5, s1 = Math.random() < 0.5 ? -0.5 : 0.5, s2 = Math.random() < 0.5 ? -0.5 : 0.5;
      if (e < 4) { x = t * lx; y = s1 * ly; z = s2 * lz; }
      else if (e < 8) { x = s1 * lx; y = t * ly; z = s2 * lz; }
      else { x = s1 * lx; y = s2 * ly; z = t * lz; }
      if (e >= 4 && e < 8) { /* senkrechte Kanten sind kurz → seltener */ if (Math.random() > ly / Math.max(lx, lz) * 3) continue; }
    } else {
      let r = Math.random() * tot, f = 0;
      while (r > areas[f]) { r -= areas[f]; f++; }
      const u = Math.random() - 0.5, v = Math.random() - 0.5;
      if (f < 2) { x = (f ? 0.5 : -0.5) * lx; y = u * ly; z = v * lz; }
      else if (f < 4) { x = u * lx; y = (f === 3 ? 0.5 : -0.5) * ly; z = v * lz; }
      else { x = u * lx; y = v * ly; z = (f === 5 ? 0.5 : -0.5) * lz; }
    }
    if (hole && Math.hypot(x - hole.x, z - hole.z) < hole.r && y > 0) continue;
    out.push(cx + x, cy + y, cz + z);
    made++;
  }
  return made;
}

export function cylPts(out, n, ax, a0, a1, r, cxy, caps = 0.3) {
  // Zylinder entlang Achse ax ('x' | 'y' | 'z') von a0 bis a1, Mittelpunkt der Querschnittsfläche cxy=[u,v]
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    let rr = r, t = a0 + Math.random() * (a1 - a0);
    if (Math.random() < caps) { rr = r * Math.sqrt(Math.random()); t = Math.random() < 0.5 ? a0 : a1; }
    const u = cxy[0] + Math.cos(a) * rr, v = cxy[1] + Math.sin(a) * rr;
    if (ax === 'x') out.push(t, u, v); else if (ax === 'y') out.push(u, t, v); else out.push(u, v, t);
  }
}

export function ellPts(out, n, cx, cy, cz, rx, ry, rz) {
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    out.push(cx + Math.cos(a) * s * rx, cy + u * ry, cz + Math.sin(a) * s * rz);
  }
}

