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

// Entwurf W (Go Kai 1–4, Punkt 3): Bauteile sichtbar trennen – jeder Wirbel und jede Bandscheibe wird entlang der eigenen
// Achse leicht gestaucht, so entsteht zwischen Wirbelkörper und Bandscheibe eine dunkle Fuge von je ~GAP cm (wie bei „bisher“)
const GAP = 0.08;
function gap(M, part, P) {
  let c, n, s = 1, shift = 0;
  if (part.kind === 'disc') { const D = M.disc[part.id.slice(1)]; c = D.c; n = D.F.n; s = Math.max(0.6, 1 - GAP / (D.t / 2)); }
  else {
    const L = M.levels.find((l) => l.id === part.id); n = L.F.n;
    if (L.id === 'S') { c = L.c; shift = -GAP; } else { c = L.c; s = Math.max(0.8, 1 - GAP / (L.h / 2)); }
  }
  for (let i = 0; i < P.length; i += 3) {
    const d = (P[i] - c.x) * n.x + (P[i + 1] - c.y) * n.y + (P[i + 2] - c.z) * n.z, m = shift - d * (1 - s);
    P[i] += n.x * m; P[i + 1] += n.y * m; P[i + 2] += n.z * m;
  }
}

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
    gap(M, part, P);
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
  // Entwurf W (Go Kai 14.11., B): Abtastung nur in einem Höhenband (Formkoordinaten) mit weichem Rand → Verdichtung der Handy-Nahansicht
  function* regionDist({ y0, y1, pad }) {
    const nF = P.length / 9, face = new Uint32Array(nF), cum = new Float64Array(nF);
    let k = 0, acc = 0;
    for (let f = 0; f < nF; f++) {
      if (!(f & 16383)) yield;
      const a = f * 9, yc = ((P[a + 1] + P[a + 4] + P[a + 7]) / 3 - CY) * SC;
      let wg = yc < y0 ? 1 - (y0 - yc) / pad : yc > y1 ? 1 - (yc - y1) / pad : 1;
      if (wg <= 0) continue;
      wg = wg * wg * (3 - 2 * wg);
      const ux = P[a + 3] - P[a], uy = P[a + 4] - P[a + 1], uz = P[a + 5] - P[a + 2], vx = P[a + 6] - P[a], vy = P[a + 7] - P[a + 1], vz = P[a + 8] - P[a + 2];
      acc += Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) * 0.5 * wg;
      face[k] = f; cum[k++] = acc;
    }
    return { face: face.subarray(0, k), cum: cum.subarray(0, k) };
  }
  function* makeSlicesGen(n, step = 0.042, band = 0.16, diff = false, region = null) {
    yield* axialGrid();
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), zone = new Float32Array(n), kind = new Float32Array(n), edge = new Float32Array(n);
    const RG = region ? yield* regionDist(region) : null;
    const dist = RG ? RG.cum : sampler.distribution, nF = dist.length, tot = dist[nF - 1];
    const tick = every(4096);
    let i = 0, tries = 0;
    while (i < n && tries++ < n * 12) {
      if (tick()) yield;
      const x = Math.random() * tot;
      let lo = 0, hi = nF - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (dist[mid] > x) hi = mid; else lo = mid + 1; }
      let u = Math.random(), w = Math.random();
      if (u + w > 1) { u = 1 - u; w = 1 - w; }
      const t = 1 - u - w, a = (RG ? RG.face[lo] : lo) * 9;
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
  // ---- Entwurf W (Go Kai 1–4, Punkt 2): echte Konturlinien ----
  // Jedes Dreieck wird mit den Schnittebenen geschnitten (dieselben Ebenen senkrecht zur Mittellinie wie axial()); die Punkte
  // liegen gleichmäßig auf den Schnittlinien → durchgehende Ringe auch auf der unebenen echten Form. Flächen, die fast parallel
  // zu den Ebenen liegen (Deck-/Grundplatten), schneiden nicht sauber → ausgelassen (dort bleibt die Fuge dunkel).
  // Gleiche Schnittstelle wie makeSlicesGen (n, step, band, diff, region); band wird nicht gebraucht.
  let AV = null;
  function* axialVerts() {
    if (AV) return;
    yield* axialGrid();
    const nv = P.length / 3, av = new Float32Array(nv);
    for (let v = 0; v < nv; v++) { if (!(v & 16383)) yield; av[v] = axialFast((P[v * 3 + 1] - CY) * SC, P[v * 3 + 2] * SC); }
    AV = av;
  }
  function* makeContoursGen(n, step = 0.032, band = 0.12, diff = true, region = null) {
    yield* axialVerts();
    const nF = P.length / 9;
    let cap = nF * 2, SI = new Int32Array(cap * 4), ST = new Float32Array(cap * 2), SW = new Float32Array(cap), ns = 0, W = 0;
    const tick = every(4096), e = [0, 1, 1, 2, 2, 0], hit = [0, 0, 0, 0], ht = [0, 0];
    const rw = (y) => { if (!region) return 1; const { y0, y1, pad } = region; let w = y < y0 ? 1 - (y0 - y) / pad : y > y1 ? 1 - (y - y1) / pad : 1; return w <= 0 ? 0 : w * w * (3 - 2 * w); };
    for (let f = 0; f < nF; f++) {
      if (tick()) yield;
      const v0 = f * 3, a0 = AV[v0], a1 = AV[v0 + 1], a2 = AV[v0 + 2];
      const lo = Math.min(a0, a1, a2), hi = Math.max(a0, a1, a2);
      const k0 = Math.ceil(lo / step - 0.5), k1 = Math.floor(hi / step - 0.5);
      if (k1 < k0) continue;
      // fast parallel zu den Ebenen? (A ändert sich über das Dreieck kaum im Verhältnis zu seiner Größe)
      const b = v0 * 3;
      const ex = Math.max(Math.hypot(P[b + 3] - P[b], P[b + 4] - P[b + 1], P[b + 5] - P[b + 2]), Math.hypot(P[b + 6] - P[b + 3], P[b + 7] - P[b + 4], P[b + 8] - P[b + 5]), Math.hypot(P[b] - P[b + 6], P[b + 1] - P[b + 7], P[b + 2] - P[b + 8])) * SC;
      if (hi - lo < 0.28 * ex) continue;
      if (Cc[b + 1] > 0.5) continue; // Bandscheiben: gefülltes Band (unten), keine Linien
      const av = [a0, a1, a2];
      const yMid = ((P[b + 1] + P[b + 4] + P[b + 7]) / 3 - CY) * SC, eMid = (Cc[b + 2] + Cc[b + 5] + Cc[b + 8]) / 3;
      let wt = rw(yMid);
      if (diff && eMid < -0.5) wt *= 0.6; // Bogen/Fortsätze lichter (Rangfolge, Punkt 4)
      if (wt <= 0) continue;
      for (let k = k0; k <= k1; k++) {
        const L = (k + 0.5) * step; let m = 0;
        for (let q = 0; q < 6 && m < 2; q += 2) {
          const i = e[q], j = e[q + 1], ai = av[i] - L, aj = av[j] - L;
          if ((ai < 0) !== (aj < 0)) { hit[m * 2] = v0 + i; hit[m * 2 + 1] = v0 + j; ht[m] = ai / (ai - aj); m++; }
        }
        if (m < 2) continue;
        let len = 0;
        for (let c = 0; c < 3; c++) {
          const p0 = P[hit[0] * 3 + c] + (P[hit[1] * 3 + c] - P[hit[0] * 3 + c]) * ht[0], p1 = P[hit[2] * 3 + c] + (P[hit[3] * 3 + c] - P[hit[2] * 3 + c]) * ht[1];
          len += (p1 - p0) * (p1 - p0);
        }
        len = Math.sqrt(len) * SC;
        if (ns >= cap) { cap *= 2; const a = new Int32Array(cap * 4); a.set(SI); SI = a; const t = new Float32Array(cap * 2); t.set(ST); ST = t; const w = new Float32Array(cap); w.set(SW); SW = w; }
        SI.set(hit, ns * 4); ST[ns * 2] = ht[0]; ST[ns * 2 + 1] = ht[1]; SW[ns] = len * wt; W += len * wt; ns++;
      }
    }
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), zone = new Float32Array(n), kind = new Float32Array(n), edge = new Float32Array(n);
    // Anteile wie „bisher“ (gemessen: 29 % Bandscheiben-Körnung, 19 % Plattenband): Bandscheiben als gefülltes Farbband,
    // Deck-/Grundplatten zusätzlich gekörnt (helles Band), der Rest als Konturlinien
    const nDisc = diff ? Math.round(n * 0.28) : 0, nPlate = diff ? Math.round(n * 0.14) : 0, nLine = n - nDisc - nPlate;
    const sp = W / nLine; let cnt = 0;
    const at = (arr, i, j, t, c) => arr[i * 3 + c] + (arr[j * 3 + c] - arr[i * 3 + c]) * t;
    for (let s2 = 0; s2 < ns && cnt < nLine; s2++) {
      if (!(s2 & 4095)) yield;
      const m = SW[s2] / sp, c2 = Math.floor(m + Math.random());
      if (!c2) continue;
      const i0 = SI[s2 * 4], j0 = SI[s2 * 4 + 1], i1 = SI[s2 * 4 + 2], j1 = SI[s2 * 4 + 3], t0 = ST[s2 * 2], t1 = ST[s2 * 2 + 1];
      for (let c = 0; c < c2 && cnt < nLine; c++) {
        const u = (c + 0.5 + (Math.random() - 0.5) * 0.5) / c2, o = cnt * 3;
        for (let d = 0; d < 3; d++) {
          const A0 = at(P, i0, j0, t0, d), A1 = at(P, i1, j1, t1, d);
          pos[o + d] = (A0 + (A1 - A0) * u - (d === 1 ? CY : 0)) * SC;
          const N0 = at(Nn, i0, j0, t0, d), N1 = at(Nn, i1, j1, t1, d); nor[o + d] = N0 + (N1 - N0) * u;
        }
        const nl = Math.hypot(nor[o], nor[o + 1], nor[o + 2]) || 1; nor[o] /= nl; nor[o + 1] /= nl; nor[o + 2] /= nl;
        const C = (d) => { const A0 = at(Cc, i0, j0, t0, d), A1 = at(Cc, i1, j1, t1, d); return A0 + (A1 - A0) * u; };
        zone[cnt] = Math.round(C(0)); kind[cnt] = C(1) > 0.5 ? 1 : 0; edge[cnt] = C(2); cnt++;
      }
    }
    // Körnung (Bandscheiben, Platten): flächengewichtet wie MeshSurfaceSampler, mit Höhenband-Gewicht für die Nahansicht
    const grain = function* (sel, m) {
      const fc = new Uint32Array(nF), cum = new Float64Array(nF); let k = 0, acc = 0;
      for (let f = 0; f < nF; f++) {
        if (tick()) yield;
        const b = f * 9; if (!sel(b)) continue;
        const w = rw(((P[b + 1] + P[b + 4] + P[b + 7]) / 3 - CY) * SC); if (w <= 0) continue;
        const ux = P[b + 3] - P[b], uy = P[b + 4] - P[b + 1], uz = P[b + 5] - P[b + 2], vx = P[b + 6] - P[b], vy = P[b + 7] - P[b + 1], vz = P[b + 8] - P[b + 2];
        acc += Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) * w; fc[k] = f; cum[k++] = acc;
      }
      if (!k) return;
      for (let j = 0; j < m && cnt < n; j++) {
        if (!(j & 4095)) yield;
        const x = Math.random() * acc; let lo = 0, hi = k - 1;
        while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] > x) hi = mid; else lo = mid + 1; }
        let u = Math.random(), w = Math.random(); if (u + w > 1) { u = 1 - u; w = 1 - w; }
        const t = 1 - u - w, b = fc[lo] * 9, o = cnt * 3;
        for (let d = 0; d < 3; d++) {
          pos[o + d] = (P[b + d] * u + P[b + 3 + d] * w + P[b + 6 + d] * t - (d === 1 ? CY : 0)) * SC;
          nor[o + d] = Nn[b + d] * u + Nn[b + 3 + d] * w + Nn[b + 6 + d] * t;
        }
        const nl = Math.hypot(nor[o], nor[o + 1], nor[o + 2]) || 1; nor[o] /= nl; nor[o + 1] /= nl; nor[o + 2] /= nl;
        zone[cnt] = Math.round(Cc[b] * u + Cc[b + 3] * w + Cc[b + 6] * t); kind[cnt] = Cc[b + 1] > 0.5 ? 1 : 0;
        edge[cnt] = Cc[b + 2] * u + Cc[b + 5] * w + Cc[b + 8] * t; cnt++;
      }
    };
    if (nDisc) yield* grain((b) => Cc[b + 1] > 0.5, nDisc);
    if (nPlate) yield* grain((b) => Cc[b + 1] < 0.5 && (Cc[b + 2] + Cc[b + 5] + Cc[b + 8]) / 3 > DIFF.plateE, nPlate);
    // mischen: die Nahansicht blendet über drawRange ein (Anfang zuerst) → alle Arten gleichmäßig verteilt
    for (let i = cnt - 1; i > 0; i--) {
      if (!(i & 16383)) yield;
      const j = (Math.random() * (i + 1)) | 0;
      for (let d = 0; d < 3; d++) { let t = pos[i * 3 + d]; pos[i * 3 + d] = pos[j * 3 + d]; pos[j * 3 + d] = t; t = nor[i * 3 + d]; nor[i * 3 + d] = nor[j * 3 + d]; nor[j * 3 + d] = t; }
      let t = zone[i]; zone[i] = zone[j]; zone[j] = t; t = kind[i]; kind[i] = kind[j]; kind[j] = t; t = edge[i]; edge[i] = edge[j]; edge[j] = t;
    }
    return { pos, nor, zone, kind, edge, count: cnt, spacing: step };
  }
  // Vergleich im Browser: ?linien=alt = Zufalls-Abtastung wie bisher
  const LINES_OLD = typeof location !== 'undefined' && /[?&]linien=alt\b/.test(location.search);
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
  const slicesGen = LINES_OLD ? makeSlicesGen : makeContoursGen;
  const makeGrain = (n) => runSync(makeGrainGen(n)), makeSlices = (...a) => runSync(slicesGen(...a));
  // Punkt 1: Breite der Wirbel im Verhältnis zur Säulenlänge, gerechnet ÷ echt → Faktor für die Nahansicht (gleiche Bildgröße)
  const RB = Object.fromEntries(buildLevels().map((l) => [l.id, l.R])), SCB = 8.2 / LTOT_BISHER;
  const zk = Object.fromEntries(M.out.map((l) => [l.id, RB[l.id] ? (RB[l.id] * SCB) / (l.R * SC) : 1]));
  return { grain: null, makeGrain, makeSlices, makeGrainGen, makeSlicesGen: slicesGen, coreGeo, curves, levels: sp.levels, SC, CY, echt: true, dScale: M.Ltot / LTOT_BISHER, zk };
}
