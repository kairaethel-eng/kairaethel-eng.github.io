// Auftrag W (14.11.2026): Partikel-Darstellung der echten Wirbelsäule – liefert genau das Objekt, das Puls
// (src/test-4/main.js) von spineStippleGen bekommt: { makeSlicesGen, makeGrainGen, coreGeo, curves, levels, SC, CY }.
// Der Teil ab „Oberfläche → …“ ist eine wörtliche Kopie aus src/test-4/shapes.js (spineStippleGen, Stand 13.11.2026);
// anders ist nur die Eingabe: echte Netze statt der gerechneten Säule (shared/spine.js). Puls selbst bleibt unverändert.
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { ZONES, CURVE_W, DIFF } from '../test-4/shapes.js';
import { zoneOf, buildLevels } from '../shared/spine.js';

// Länge der gerechneten Säule (Einheiten von shared/spine.js): Puls rechnet Kameraabstände der Haltestellen (STOPS.d)
// in diesen Einheiten → für die echte Säule mit dScale umrechnen (gleiche Bildgröße je Abschnitt)
const LTOT_BISHER = buildLevels().reduce((s, l) => s + l.h + l.disc, 0);
import { runSync, every, poissonGrid, bounds } from '../shared/slice.js';
import { edgeOf } from './anatomie.js';

// Teile als ungeteilte Dreiecke mit Normale (geglättet) und Farbe (r = Zone, g = Art, b = Kante) – wie tag() in shapes.js
function* partsGen(M) {
  const out = [], p = new THREE.Vector3(), q = new THREE.Vector3();
  const next = {}; M.levels.forEach((L, i) => { next[L.id] = M.levels[i + 1]; });
  for (const part of Object.values(M.P)) {
    const disc = part.kind === 'disc', id = disc ? part.id.slice(1) : part.id;
    const zone = ZONES.indexOf(zoneOf(disc ? next[id].id : id)); // Bandscheibe: Zone des Wirbels darunter (wie shared/spine.js)
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(part.pos, 3)); g.setIndex(new THREE.BufferAttribute(part.idx, 1));
    g.computeVertexNormals();
    const ng = g.toNonIndexed(), P = ng.attributes.position.array, n = P.length / 3, col = new Float32Array(n * 3);
    // Kante je Ecke einmal je Punkt der Teil-Datei rechnen (Ecken teilen sich Punkte)
    const ev = new Float32Array(part.pos.length / 3);
    for (let i = 0; i < ev.length; i++) ev[i] = edgeOf(M, part, p.fromArray(part.pos, i * 3), q);
    for (let i = 0; i < n; i++) { col[i * 3] = zone; col[i * 3 + 1] = disc ? 1 : 0; col[i * 3 + 2] = ev[part.idx[i]]; }
    ng.setAttribute('color', new THREE.BufferAttribute(col, 3));
    out.push(ng);
    yield;
  }
  return out;
}

// Grobe Wolke für das Morph-Ziel „Wirbelsäule“ der Hauptbühne (wie spinePointsGen in shapes.js)
export function* echtPointsGen(M, N) {
  const geos = [];
  for (const part of Object.values(M.P)) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(part.pos, 3)); g.setIndex(new THREE.BufferAttribute(part.idx, 1));
    geos.push(g.toNonIndexed());
  }
  yield;
  let total = 0; geos.forEach((g) => (total += g.attributes.position.count));
  const arr = new Float32Array(total * 3); let o = 0;
  geos.forEach((g) => { arr.set(g.attributes.position.array, o); o += g.attributes.position.array.length; });
  const merged = new THREE.BufferGeometry(); merged.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  const sampler = new MeshSurfaceSampler(new THREE.Mesh(merged)).build();
  yield;
  const pos = new Float32Array(N * 3), v = new THREE.Vector3(), sc = 8.2 / M.Ltot, cy = M.Ltot / 2;
  for (let i = 0; i < N; i++) {
    if (!(i & 4095)) yield;
    sampler.sample(v);
    pos[i * 3] = v.x * sc; pos[i * 3 + 1] = (v.y - cy) * sc; pos[i * 3 + 2] = v.z * sc;
  }
  return { pos };
}

export function* echtStippleGen(M) {
  const parts = yield* partsGen(M);
  const SC = 8.2 / M.Ltot, CY = M.Ltot / 2;
  const sp = { curve: M.curve, levels: M.out };
  let total = 0; parts.forEach((g) => (total += g.attributes.position.count));
  const P = new Float32Array(total * 3), Nn = new Float32Array(total * 3), Cc = new Float32Array(total * 3);
  let o = 0;
  parts.forEach((g) => { P.set(g.attributes.position.array, o); Nn.set(g.attributes.normal.array, o); Cc.set(g.attributes.color.array, o); o += g.attributes.position.array.length; });
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(P, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(Nn, 3));
  merged.setAttribute('color', new THREE.BufferAttribute(Cc, 3));
  yield;
  // ---- ab hier wörtlich aus src/test-4/shapes.js (spineStippleGen) ----
  // Oberfläche → gleichmäßiger Mindestabstand (Poisson-artig, Raster-Hash) – Stil „Körnung“
  let area = 0; const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < P.length; i += 9) { a.fromArray(P, i); b.fromArray(P, i + 3); c.fromArray(P, i + 6); area += b.sub(a).cross(c.sub(a)).length() / 2; }
  yield;
  const sampler = new MeshSurfaceSampler(new THREE.Mesh(merged)).build();
  yield;
  const box = bounds(P);
  function* makeGrainGen(n) {
    const r = Math.sqrt(area / n) * 0.78, r2 = r * r;
    const grid = poissonGrid(box.min, box.max, r, n);
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), zone = new Float32Array(n), kind = new Float32Array(n);
    const v = new THREE.Vector3(), nv = new THREE.Vector3(), col = new THREE.Color();
    const tick = every(512);
    let i = 0, tries = 0, miss = 0;
    while (i < n && tries++ < n * 5 && miss < 400) {
      if (tick()) yield;
      sampler.sample(v, nv, col);
      if (!grid.free(v.x, v.y, v.z, r2)) { miss++; continue; }
      miss = 0;
      grid.add(v.x, v.y, v.z);
      pos[i * 3] = v.x * SC; pos[i * 3 + 1] = (v.y - CY) * SC; pos[i * 3 + 2] = v.z * SC;
      nor[i * 3] = nv.x; nor[i * 3 + 1] = nv.y; nor[i * 3 + 2] = nv.z; zone[i] = col.r; kind[i] = col.g; i++;
    }
    return { pos: pos.slice(0, i * 3), nor: nor.slice(0, i * 3), zone: zone.slice(0, i), kind: kind.slice(0, i), count: i, spacing: r * SC };
  }
  const NT = 1024, cyT = new Float32Array(NT), czT = new Float32Array(NT), tyT = new Float32Array(NT), tzT = new Float32Array(NT);
  const LC = sp.curve.getLength() * SC;
  for (let j = 0; j < NT; j++) {
    const u = j / (NT - 1), q = sp.curve.getPointAt(u), tg = sp.curve.getTangentAt(u).negate();
    cyT[j] = (q.y - CY) * SC; czT[j] = q.z * SC; tyT[j] = tg.y; tzT[j] = tg.z;
  }
  yield;
  const axT = [0, 1];
  const axial = (y, z) => {
    let sv = cyT[0] - y, ty = 1, tz = 0;
    for (let it = 0; it < 3; it++) {
      const fj = Math.min(NT - 1.001, Math.max(0, sv / LC * (NT - 1))), j = fj | 0, w = fj - j;
      const cy = cyT[j] + (cyT[j + 1] - cyT[j]) * w, cz = czT[j] + (czT[j + 1] - czT[j]) * w;
      ty = tyT[j] + (tyT[j + 1] - tyT[j]) * w; tz = tzT[j] + (tzT[j + 1] - tzT[j]) * w;
      const tl = Math.hypot(ty, tz); ty /= tl; tz /= tl;
      sv -= (y - cy) * ty + (z - cz) * tz;
    }
    axT[0] = ty; axT[1] = tz;
    return -sv;
  };
  const GY = 512, GZ = 128;
  const gy0 = (box.min[1] - CY) * SC - 0.05, gy1 = (box.max[1] - CY) * SC + 0.05, gz0 = box.min[2] * SC - 0.05, gz1 = box.max[2] * SC + 0.05;
  const gdy = (gy1 - gy0) / (GY - 1), gdz = (gz1 - gz0) / (GZ - 1);
  let AG = null;
  function* axialGrid() {
    if (AG) return;
    const g = new Float32Array(GY * GZ);
    for (let r = 0; r < GY; r++) { for (let c = 0; c < GZ; c++) g[r * GZ + c] = axial(gy0 + r * gdy, gz0 + c * gdz); if (!(r & 63)) yield; }
    AG = g;
  }
  const axialFast = (y, z) => {
    const fy = Math.min(GY - 1.001, Math.max(0, (y - gy0) / gdy)), fz = Math.min(GZ - 1.001, Math.max(0, (z - gz0) / gdz));
    const r = fy | 0, c = fz | 0, wy = fy - r, wz = fz - c, k = r * GZ + c;
    const a0 = AG[k] + (AG[k + 1] - AG[k]) * wz, a1 = AG[k + GZ] + (AG[k + GZ + 1] - AG[k + GZ]) * wz;
    return a0 + (a1 - a0) * wy;
  };
  function* makeSlicesGen(n, step = 0.042, band = 0.16, diff = false) {
    yield* axialGrid();
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), zone = new Float32Array(n), kind = new Float32Array(n), edge = new Float32Array(n);
    const dist = sampler.distribution, nF = dist.length, tot = dist[nF - 1];
    const tick = every(4096);
    let i = 0, tries = 0;
    while (i < n && tries++ < n * 12) {
      if (tick()) yield;
      const x = Math.random() * tot;
      let lo = 0, hi = nF - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (dist[mid] > x) hi = mid; else lo = mid + 1; }
      let u = Math.random(), w = Math.random();
      if (u + w > 1) { u = 1 - u; w = 1 - w; }
      const t = 1 - u - w, a = lo * 9;
      const y = (P[a + 1] * u + P[a + 4] * w + P[a + 7] * t - CY) * SC, z = (P[a + 2] * u + P[a + 5] * w + P[a + 8] * t) * SC;
      let A = axialFast(y, z);
      const f = A / step - Math.floor(A / step);
      const k = Cc[a + 1] * u + Cc[a + 4] * w + Cc[a + 7] * t, e = Cc[a + 2] * u + Cc[a + 5] * w + Cc[a + 8] * t;
      let free = false;
      if (diff && e < -1.5) continue;
      if (diff && k > 0.5) { if (Math.random() > DIFF.disc) continue; free = true; }
      else if (diff && e > DIFF.plateE) { if (Math.random() > DIFF.plate) continue; free = true; }
      else {
        if (Math.abs(f - 0.5) > band / 2) continue;
        if (diff && e < 0 && Math.random() > DIFF.proc) continue;
      }
      if (!free) A = axial(y, z);
      const sh = free ? 0 : ((Math.floor(A / step) + 0.5) * step - A) * 0.75;
      pos[i * 3] = (P[a] * u + P[a + 3] * w + P[a + 6] * t) * SC; pos[i * 3 + 1] = y + axT[0] * sh; pos[i * 3 + 2] = z + axT[1] * sh;
      edge[i] = e;
      const nx = Nn[a] * u + Nn[a + 3] * w + Nn[a + 6] * t, ny = Nn[a + 1] * u + Nn[a + 4] * w + Nn[a + 7] * t, nz = Nn[a + 2] * u + Nn[a + 5] * w + Nn[a + 8] * t, nl = Math.hypot(nx, ny, nz) || 1;
      nor[i * 3] = nx / nl; nor[i * 3 + 1] = ny / nl; nor[i * 3 + 2] = nz / nl;
      zone[i] = Cc[a] * u + Cc[a + 3] * w + Cc[a + 6] * t; kind[i] = k; i++;
    }
    return { pos, nor, zone, kind, edge, count: i, spacing: step };
  }
  const core = new Float32Array(P.length);
  for (let i = 0; i < P.length; i += 3) { core[i] = P[i] * SC; core[i + 1] = (P[i + 1] - CY) * SC; core[i + 2] = P[i + 2] * SC; }
  const coreGeo = new THREE.BufferGeometry();
  coreGeo.setAttribute('position', new THREE.BufferAttribute(core, 3));
  coreGeo.setAttribute('normal', new THREE.BufferAttribute(Nn, 3));
  yield;
  // ---- Ende der Kopie; Nerven: Rückenmark durch den gemessenen Kanal, Wurzeln durch die Zwischenwirbellöcher (anatomie.js) ----
  const toShape = (p) => [p.x * SC, (p.y - CY) * SC, p.z * SC];
  const cordC = new THREE.CatmullRomCurve3(M.canal, false, 'centripetal');
  const cordPts = []; for (let i = 0; i < CURVE_W; i++) cordPts.push(cordC.getPointAt(i / (CURVE_W - 1)));
  const curves = [{ pts: cordPts.map(toShape), zone: -1, start: 0, kind: 1 }];
  M.roots.forEach((rc) => {
    const p0 = rc.curve.getPoint(0);
    let best = 0, bd = 1e9; cordPts.forEach((q, i) => { const d = q.distanceToSquared(p0); if (d < bd) { bd = d; best = i; } });
    const pts = []; for (let i = 0; i < CURVE_W; i++) pts.push(toShape(rc.curve.getPoint(i / (CURVE_W - 1))));
    curves.push({ pts, zone: ZONES.indexOf(rc.zone), start: best / (CURVE_W - 1), kind: 2, side: rc.side, id: rc.id });
  });
  const makeGrain = (n) => runSync(makeGrainGen(n)), makeSlices = (...a) => runSync(makeSlicesGen(...a));
  return { grain: null, makeGrain, makeSlices, makeGrainGen, makeSlicesGen, coreGeo, curves, levels: sp.levels, SC, CY, echt: true, dScale: M.Ltot / LTOT_BISHER };
}
