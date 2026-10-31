// Das Haus: Fassade mit Haustür, offener Wohn- und Praxisbereich, Garten.
// Maßstab in Metern. Vorne (Straße) = +z, Haustür bei z = 0. Osten = +x, Westen = −x.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import * as T from './textures.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const H = 3.1; // Raumhöhe
const R = (a, b) => a + Math.random() * (b - a);

export function buildHouse(scene) {
  const out = { windows: [], lamps: [], hotspots: {}, sway: [], curtains: [], glow: [] };
  const M = {
    floor: new THREE.MeshStandardMaterial({ map: T.woodFloor(), roughness: 0.55, metalness: 0 }),
    wall: new THREE.MeshStandardMaterial({ map: T.plaster(38, 91), roughness: 0.95 }),
    facade: new THREE.MeshStandardMaterial({ map: T.plaster(34, 86), roughness: 0.95 }),
    ceiling: new THREE.MeshStandardMaterial({ color: '#F4EFE6', roughness: 1 }),
    oak: new THREE.MeshStandardMaterial({ color: '#B98A5A', roughness: 0.55 }),
    oakDark: new THREE.MeshStandardMaterial({ color: '#7A5638', roughness: 0.6 }),
    sage: new THREE.MeshStandardMaterial({ color: '#8FA58A', roughness: 0.9 }),
    honey: new THREE.MeshStandardMaterial({ color: '#D9A35A', roughness: 0.85 }),
    linen: new THREE.MeshStandardMaterial({ color: '#EDE5D6', roughness: 0.95 }),
    moss: new THREE.MeshStandardMaterial({ color: '#3D5246', roughness: 0.85 }),
    white: new THREE.MeshStandardMaterial({ color: '#FAF7F1', roughness: 0.6 }),
    ceramic: new THREE.MeshStandardMaterial({ color: '#F4EEE4', roughness: 0.25 }),
    brass: new THREE.MeshStandardMaterial({ color: '#C9A35B', roughness: 0.3, metalness: 0.9 }),
    black: new THREE.MeshStandardMaterial({ color: '#2A2A28', roughness: 0.45, metalness: 0.3 }),
    leaf: new THREE.MeshStandardMaterial({ color: '#5E7F4E', roughness: 0.8, side: THREE.DoubleSide }),
    leaf2: new THREE.MeshStandardMaterial({ color: '#79985F', roughness: 0.8, side: THREE.DoubleSide }),
    terracotta: new THREE.MeshStandardMaterial({ color: '#B88563', roughness: 0.9 }),
    glass: new THREE.MeshStandardMaterial({ color: '#DDE9EE', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.12, depthWrite: false }),
    grass: new THREE.MeshStandardMaterial({ color: '#7E9A63', roughness: 1 }),
    stone: new THREE.MeshStandardMaterial({ color: '#CFC6B6', roughness: 0.9 }),
    rope: new THREE.MeshStandardMaterial({ color: '#E8DCC4', roughness: 0.9 }),
    steel: new THREE.MeshStandardMaterial({ color: '#B9BEC0', roughness: 0.3, metalness: 0.8 }),
  };
  out.M = M;
  const g = new THREE.Group(); scene.add(g);
  const add = (mesh, cast = true, recv = true) => { mesh.castShadow = cast; mesh.receiveShadow = recv; g.add(mesh); return mesh; };
  const box = (w, h, d, m, x, y, z, r = 0.02) => add(new THREE.Mesh(r ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d), m)).translateX(x).translateY(y).translateZ(z);
  const cyl = (r1, r2, h, m, x, y, z, seg = 24) => add(new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m)).translateX(x).translateY(y).translateZ(z);

  // ---------- Boden, Decke, Außen ----------
  const floor = add(new THREE.Mesh(new THREE.PlaneGeometry(18, 12), M.floor), false, true);
  floor.rotation.x = -Math.PI / 2; floor.position.set(2, 0, -6);
  const ceil = add(new THREE.Mesh(new THREE.PlaneGeometry(18, 12), M.ceiling), false, true);
  ceil.rotation.x = Math.PI / 2; ceil.position.set(2, H, -6);
  for (let i = 0; i < 6; i++) box(18, 0.18, 0.16, M.oak, 2, H - 0.09, -1.2 - i * 2, 0.01); // Deckenbalken
  const ground = add(new THREE.Mesh(new THREE.PlaneGeometry(120, 120), M.grass), false, true);
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02;
  const path = add(new THREE.Mesh(new THREE.PlaneGeometry(1.6, 7), M.stone), false, true);
  path.rotation.x = -Math.PI / 2; path.position.set(0, -0.005, 3.6);
  const deck = box(8, 0.12, 4, M.oakDark, 8, 0.04, -14.1, 0.01); // Terrasse

  // ---------- Wände mit Öffnungen ----------
  // Wand entlang x (bei z) mit Löchern [x0,x1,y0,y1]
  function wallX(z, x0, x1, holes, m, thick = 0.22) {
    const cuts = [x0, ...holes.flatMap((h) => [h[0], h[1]]), x1].sort((a, b) => a - b);
    // massive Abschnitte zwischen Löchern
    let xs = [x0]; holes.sort((a, b) => a[0] - b[0]).forEach((h) => { xs.push(h[0], h[1]); }); xs.push(x1);
    for (let i = 0; i < xs.length; i += 2) if (xs[i + 1] - xs[i] > 0.01) box(xs[i + 1] - xs[i], H, thick, m, (xs[i] + xs[i + 1]) / 2, H / 2, z, 0);
    holes.forEach(([a, b, y0, y1]) => {
      if (y0 > 0.01) box(b - a, y0, thick, m, (a + b) / 2, y0 / 2, z, 0);
      box(b - a, H - y1, thick, m, (a + b) / 2, y1 + (H - y1) / 2, z, 0);
    });
    return cuts;
  }
  function wallZ(x, z0, z1, holes, m, thick = 0.22) {
    let zs = [z0]; holes.sort((a, b) => a[0] - b[0]).forEach((h) => zs.push(h[0], h[1])); zs.push(z1);
    for (let i = 0; i < zs.length; i += 2) if (zs[i + 1] - zs[i] > 0.01) box(thick, H, zs[i + 1] - zs[i], m, x, H / 2, (zs[i] + zs[i + 1]) / 2, 0);
    holes.forEach(([a, b, y0, y1]) => {
      if (y0 > 0.01) box(thick, y0, b - a, m, x, y0 / 2, (a + b) / 2, 0);
      box(thick, H - y1, b - a, m, x, y1 + (H - y1) / 2, (a + b) / 2, 0);
    });
  }
  // Fensterrahmen + Glas; normal = Richtung nach außen
  function windowFrame(cx, cy, cz, w, h, axis, normal, mullions = 1) {
    const fr = new THREE.Group(); g.add(fr);
    const t = 0.07, d = 0.12;
    const bar = (bw, bh, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(axis === 'x' ? bw : d, bh, axis === 'x' ? d : bw), M.oak); m.position.set(axis === 'x' ? cx + x : cx, cy + y, axis === 'x' ? cz : cz + x); m.castShadow = true; fr.add(m); };
    bar(w, t, 0, h / 2); bar(w, t, 0, -h / 2); bar(t, h, -w / 2, 0); bar(t, h, w / 2, 0);
    for (let i = 1; i <= mullions; i++) bar(t * 0.7, h, -w / 2 + (w * i) / (mullions + 1), 0);
    bar(w, t * 0.7, 0, h * 0.12);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.glass);
    glass.position.set(cx, cy, cz); if (axis === 'z') glass.rotation.y = Math.PI / 2;
    fr.add(glass);
    // Fensterbank innen
    const sill = new THREE.Mesh(new THREE.BoxGeometry(axis === 'x' ? w + 0.2 : 0.28, 0.05, axis === 'x' ? 0.28 : w + 0.2), M.oak);
    sill.position.set(axis === 'x' ? cx : cx - normal * 0.12, cy - h / 2 - 0.02, axis === 'x' ? cz - normal * 0.12 : cz); sill.receiveShadow = true; fr.add(sill);
    out.windows.push({ c: new THREE.Vector3(cx, cy, cz), w, h, axis, normal });
    return fr;
  }

  // Fassade vorne (z = 0): Haustür, Wohnzimmerfenster, Trainingsfenster
  wallX(0, -7, 11, [[-0.6, 0.6, 0, 2.25], [-5.4, -2.6, 0.85, 2.45], [5.2, 9.2, 0.85, 2.45]], M.facade);
  windowFrame(-4, 1.65, 0, 2.8, 1.6, 'x', 1, 2);
  windowFrame(7.2, 1.65, 0, 4, 1.6, 'x', 1, 3);
  // links (Westen, x = −7): großes Wohnzimmerfenster
  wallZ(-7, -12, 0, [[-7.8, -2.6, 0.45, 2.65]], M.wall);
  windowFrame(-7, 1.55, -5.2, 5.2, 2.2, 'z', -1, 3);
  // hinten (z = −12): Fenster Behandlung, Gartentür Training
  wallX(-12, -7, 11, [[-0.6, 2.6, 0.85, 2.45], [5.6, 9.8, 0, 2.6]], M.wall);
  windowFrame(1, 1.65, -12, 3.2, 1.6, 'x', -1, 1);
  windowFrame(7.7, 1.3, -12, 4.2, 2.6, 'x', -1, 2);
  // rechts (Osten, x = 11)
  wallZ(11, -12, 0, [[-9, -4.4, 0.85, 2.45]], M.wall);
  windowFrame(11, 1.65, -6.7, 4.6, 1.6, 'z', 1, 2);
  // Dach (Satteldach) außen
  const roofMat = new THREE.MeshStandardMaterial({ color: '#5E4A3D', roughness: 0.9 });
  [1, -1].forEach((s) => { const r = add(new THREE.Mesh(new THREE.BoxGeometry(19, 0.18, 7.4), roofMat)); r.position.set(2, H + 1.55, -6 + s * 3.25); r.rotation.x = s * 0.5; });
  [0, -12].forEach((z) => { const sh = new THREE.Shape(); sh.moveTo(-6.4, 0); sh.lineTo(0, 3.2); sh.lineTo(6.4, 0); const gg = new THREE.ShapeGeometry(sh); const m = add(new THREE.Mesh(gg, M.facade)); m.rotation.y = Math.PI / 2; m.position.set(z === 0 ? -7 : 11, H, -6); });

  // ---------- Haustür (Drehpunkt links) ----------
  const doorPivot = new THREE.Group(); doorPivot.position.set(-0.58, 0, 0.02); g.add(doorPivot);
  const doorLeaf = new THREE.Mesh(new RoundedBoxGeometry(1.16, 2.22, 0.07, 2, 0.02), M.oakDark);
  doorLeaf.position.set(0.58, 1.11, 0); doorLeaf.castShadow = true; doorPivot.add(doorLeaf);
  for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.012), M.oak); p.position.set(0.58, 0.45 + i * 0.66, 0.04); doorPivot.add(p); }
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), M.brass); knob.position.set(1.02, 1.05, 0.08); doorPivot.add(knob);
  out.door = doorPivot;
  // Türrahmen, Stufe, Hausnummer, Lampe, Pflanzen, Matte
  box(1.42, 0.1, 0.3, M.oak, 0, 2.3, 0.05, 0.01); box(0.1, 2.3, 0.3, M.oak, -0.66, 1.15, 0.05, 0.01); box(0.1, 2.3, 0.3, M.oak, 0.66, 1.15, 0.05, 0.01);
  box(1.9, 0.12, 0.8, M.stone, 0, 0.06, 0.45, 0.02);
  const mat = add(new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), new THREE.MeshStandardMaterial({ map: T.doormat(), roughness: 1 })), false, true);
  mat.rotation.x = -Math.PI / 2; mat.position.set(0, 0.125, 0.5);
  const lanternGlow = new THREE.MeshStandardMaterial({ color: '#FFE2B0', emissive: new THREE.Color('#FFB866'), emissiveIntensity: 0 });
  box(0.16, 0.28, 0.16, M.black, 1.05, 2.0, 0.18, 0.01); box(0.11, 0.2, 0.11, lanternGlow, 1.05, 2.0, 0.18, 0.005);
  out.glow.push({ m: lanternGlow, k: 2.2 });
  const lantern = new THREE.PointLight('#FFB866', 0, 6, 1.8); lantern.position.set(1.05, 2.0, 0.6); g.add(lantern); out.lamps.push({ l: lantern, k: 6 });
  plant(-1.3, 0.12, 0.5, 1.1, 'olive'); plant(1.4, 0.12, 0.6, 0.9, 'olive');
  // Hecke und Bäume
  for (let i = 0; i < 16; i++) { const x = -9 + i * 0.95; if (Math.abs(x) < 2.6) continue; const s = R(0.45, 0.75); const b = add(new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), M.leaf)); b.position.set(x, s * 0.6, 3.2 + R(-0.2, 0.2)); }
  [[-12, -6], [16, -4], [14, -18], [2, -20], [-10, -18], [8, -22]].forEach(([x, z]) => tree(x, z, R(0.9, 1.3)));

  // ---------- Empfang (rechts der Tür) ----------
  box(2.1, 1.05, 0.62, M.oak, 2.6, 0.525, -2.3, 0.03);
  box(2.2, 0.05, 0.72, M.white, 2.6, 1.08, -2.3, 0.02);
  box(0.62, 1.05, 1.4, M.oak, 3.36, 0.525, -1.6, 0.03);
  // Teetasse mit Untertasse (Dampf kommt in main.js)
  cyl(0.11, 0.11, 0.012, M.ceramic, 2.0, 1.112, -2.2, 32);
  cyl(0.05, 0.04, 0.085, M.ceramic, 2.0, 1.16, -2.2, 24);
  const teaTop = cyl(0.046, 0.046, 0.004, new THREE.MeshStandardMaterial({ color: '#B87A3A', roughness: 0.2 }), 2.0, 1.2, -2.2);
  out.teaPos = new THREE.Vector3(2.0, 1.21, -2.2);
  // Teekanne
  const pot = add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 16), M.ceramic)); pot.scale.set(1, 0.8, 1); pot.position.set(2.42, 1.2, -2.3);
  cyl(0.02, 0.03, 0.14, M.ceramic, 2.57, 1.24, -2.3).rotation.z = -0.9;
  // Tischkarte
  const cardMesh = add(new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.21), new THREE.MeshStandardMaterial({ map: T.card('Willkommen', 'schön, dass Sie da sind'), roughness: 0.8 })));
  cardMesh.position.set(2.9, 1.2, -2.05); cardMesh.rotation.set(-0.25, -0.35, 0);
  // Vase mit Blumen
  cyl(0.05, 0.06, 0.22, M.ceramic, 3.3, 1.2, -2.35);
  for (let i = 0; i < 7; i++) { const st = add(new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.35, 4), M.leaf)); st.position.set(3.3 + R(-0.03, 0.03), 1.42, -2.35 + R(-0.03, 0.03)); st.rotation.set(R(-0.3, 0.3), 0, R(-0.3, 0.3)); const fl = add(new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshStandardMaterial({ color: ['#F2C14E', '#F4E3C3', '#E9A178'][i % 3] }))); fl.position.copy(st.position).add(new THREE.Vector3(Math.sin(st.rotation.z) * -0.17, 0.17, Math.sin(st.rotation.x) * 0.17)); }
  pendant(2.6, -2.3, 1.95);
  // Garderobe
  cyl(0.025, 0.025, 1.8, M.oakDark, -1.1, 0.9, -0.5); cyl(0.18, 0.2, 0.03, M.oakDark, -1.1, 0.015, -0.5);
  const scarf = add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 8, 20, Math.PI * 1.3), M.honey)); scarf.position.set(-1.1, 1.55, -0.42); scarf.rotation.set(0, 0, Math.PI * 1.15);

  // ---------- Wohnzimmer (links) ----------
  const rugMesh = add(new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.6), new THREE.MeshStandardMaterial({ map: T.rug(), roughness: 1 })), false, true);
  rugMesh.rotation.x = -Math.PI / 2; rugMesh.position.set(-4.2, 0.006, -4.6);
  sofa(-5.9, -4.6, Math.PI / 2, M.sage);
  armchair(-2.6, -5.9, -Math.PI * 0.72, M.honey);
  // Couchtisch rund mit Büchern und Tasse
  cyl(0.45, 0.45, 0.05, M.oak, -4.0, 0.42, -4.6, 40); cyl(0.05, 0.08, 0.4, M.oakDark, -4.0, 0.2, -4.6);
  [['#9DAF93', 0.03], ['#D59A4E', 0.025]].forEach(([c, h], i) => box(0.32, h, 0.22, new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }), -4.1, 0.46 + i * 0.028, -4.5, 0.004));
  cyl(0.04, 0.035, 0.09, M.ceramic, -3.75, 0.49, -4.75);
  // Bücherregal an der Front
  box(2.4, 2.2, 0.36, M.oak, -4.6, 1.1, -0.35, 0.02);
  for (let r = 0; r < 4; r++) {
    box(2.3, 0.03, 0.32, M.oakDark, -4.6, 0.32 + r * 0.52, -0.38, 0.005);
    let x = -5.7;
    while (x < -3.6) {
      const w = R(0.03, 0.07), h = R(0.26, 0.4);
      if (Math.random() < 0.12) { x += 0.15; continue; }
      const b = box(w, h, R(0.18, 0.24), new THREE.MeshStandardMaterial({ color: T.BOOK_COLORS[(Math.random() * T.BOOK_COLORS.length) | 0], roughness: 0.85 }), x, 0.34 + r * 0.52 + h / 2, -0.4, 0.004);
      if (Math.random() < 0.1) b.rotation.z = 0.15;
      x += w + 0.005;
    }
  }
  floorLamp(-6.2, -2.4);
  plant(-6.3, 0, -7.6, 1.6, 'monstera');
  plant(-2.4, 0, -1.0, 1.0, 'fern');
  // Vorhänge am großen Westfenster
  [-7.3, -3.1].forEach((z) => { const cg = new THREE.PlaneGeometry(1.1, 2.6, 24, 18); const cm = new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ color: '#F6F0E4', roughness: 1, transparent: true, opacity: 0.72, side: THREE.DoubleSide })); cm.position.set(-6.75, 1.55, z); cm.rotation.y = Math.PI / 2; cm.castShadow = false; g.add(cm); out.curtains.push({ mesh: cm, base: cg.attributes.position.array.slice() }); });
  art_(-6.88, 1.75, -1.4, 'z', 0);

  // Raumteiler: offenes Regal zwischen Wohnzimmer und Behandlung
  for (let i = 0; i < 4; i++) box(0.05, 2.2, 0.4, M.oak, -6.6 + i * 1.6, 1.1, -8.4, 0.01);
  for (let r = 0; r < 4; r++) box(4.85, 0.04, 0.4, M.oak, -4.2, 0.2 + r * 0.62, -8.4, 0.01);
  [[-5.6, 0.86], [-3.9, 1.48], [-2.6, 0.86]].forEach(([x, y]) => plant(x, y - 0.22, -8.4, 0.35, 'small'));
  cyl(0.09, 0.07, 0.2, M.terracotta, -4.6, 0.32, -8.4);

  // ---------- Behandlungsraum (Mitte hinten) ----------
  bench(0.8, -9.6);
  const towel = add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 20), M.white)); towel.rotation.z = Math.PI / 2; towel.position.set(0.2, 0.78, -9.6);
  // Hocker
  cyl(0.2, 0.2, 0.08, M.moss, -0.6, 0.55, -8.9, 28); cyl(0.025, 0.025, 0.5, M.steel, -0.6, 0.28, -8.9); cyl(0.22, 0.22, 0.03, M.steel, -0.6, 0.03, -8.9, 5);
  // Wagen mit Fango (warm leuchtend) und Stoßwellengerät
  box(0.6, 0.04, 0.45, M.white, 2.6, 0.8, -10.9, 0.01); box(0.6, 0.04, 0.45, M.white, 2.6, 0.35, -10.9, 0.01);
  [[2.32, -11.1], [2.88, -11.1], [2.32, -10.7], [2.88, -10.7]].forEach(([x, z]) => cyl(0.012, 0.012, 0.8, M.steel, x, 0.4, z, 8));
  const fango = new THREE.MeshStandardMaterial({ color: '#8A5A3A', roughness: 0.9, emissive: new THREE.Color('#E07B39'), emissiveIntensity: 0.25 });
  box(0.36, 0.05, 0.26, fango, 2.5, 0.85, -10.9, 0.02); out.glow.push({ m: fango, k: 0.0, base: 0.25 });
  box(0.18, 0.12, 0.14, M.white, 2.8, 0.88, -10.95, 0.02); cyl(0.02, 0.03, 0.22, M.moss, 2.8, 0.98, -10.8).rotation.x = 0.6;
  out.hotspots.fango = new THREE.Vector3(2.5, 1.0, -10.9);
  out.hotspots.stosswelle = new THREE.Vector3(2.82, 1.08, -10.85);
  // Manuthera (segmentierte Spezialliege)
  const mt = new THREE.Group(); mt.position.set(-1.7, 0, -10.6); mt.rotation.y = 0.35; g.add(mt);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.5, 24), M.black); ped.position.y = 0.25; ped.castShadow = true; mt.add(ped);
  [[-0.62, 0.14], [0, 0], [0.6, -0.18]].forEach(([x, rz]) => { const s = new THREE.Mesh(new RoundedBoxGeometry(0.58, 0.1, 0.62, 2, 0.04), M.moss); s.position.set(x, 0.62 + Math.abs(rz) * 0.4, 0); s.rotation.z = rz; s.castShadow = true; mt.add(s); });
  out.hotspots.manuthera = new THREE.Vector3(-1.7, 1.0, -10.6);
  art_(0.9, 1.8, -11.88, 'x', 1);
  plant(-0.4, 0, -11.5, 1.2, 'fern');
  pendant(0.8, -9.6, 2.1);
  out.hotspots.manuelle = new THREE.Vector3(0.9, 1.0, -9.6);

  // ---------- Trainingsraum (rechts hinten) ----------
  [[6.0, -7.6, M.sage], [7.0, -7.6, new THREE.MeshStandardMaterial({ color: '#C9B79C', roughness: 0.95 })]].forEach(([x, z, m]) => box(0.62, 0.02, 1.8, m, x, 0.012, z, 0.005));
  const ball = add(new THREE.Mesh(new THREE.SphereGeometry(0.33, 40, 28), new THREE.MeshStandardMaterial({ color: '#D9A35A', roughness: 0.45 }))); ball.position.set(8.4, 0.33, -6.2);
  out.hotspots.kg = new THREE.Vector3(6.5, 0.5, -7.6);
  out.hotspots.sport = new THREE.Vector3(8.4, 0.85, -6.2);
  // Hantelablage
  box(0.9, 0.5, 0.3, M.oak, 9.8, 0.25, -4.4, 0.02);
  for (let i = 0; i < 4; i++) { const y = 0.55, x = 9.5 + i * 0.2; const bar = add(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.26, 8), M.steel)); bar.rotation.x = Math.PI / 2; bar.position.set(x, y, -4.4); [-0.11, 0.11].forEach((dz) => { const w = add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 16), M.moss)); w.rotation.x = Math.PI / 2; w.position.set(x, y, -4.4 + dz); }); }
  // Sprossenwand
  for (let i = 0; i < 2; i++) box(0.06, 2.5, 0.08, M.oak, 10.82, 1.25, -10.2 + i * 0.9, 0.01);
  for (let j = 0; j < 12; j++) { const r = add(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.9, 10), M.oak)); r.rotation.x = Math.PI / 2; r.position.set(10.8, 0.15 + j * 0.2, -9.75); }
  // Spiegel
  box(1.4, 2.0, 0.03, new THREE.MeshStandardMaterial({ color: '#DCE3E2', roughness: 0.05, metalness: 0.9 }), 10.86, 1.2, -2.9, 0.01).rotation.y = Math.PI / 2;
  // Schlingentisch: Rahmen mit Seilen und Schlingen über einer Liege
  const sx = 5.6, sz = -10.2;
  [[-1, -0.5], [1, -0.5], [-1, 0.5], [1, 0.5]].forEach(([a, b]) => box(0.05, 2.3, 0.05, M.steel, sx + a, 1.15, sz + b, 0.01));
  box(2.05, 0.05, 0.05, M.steel, sx, 2.3, sz - 0.5, 0.01); box(2.05, 0.05, 0.05, M.steel, sx, 2.3, sz + 0.5, 0.01);
  for (let i = 0; i < 5; i++) box(0.04, 0.04, 1.05, M.steel, sx - 0.9 + i * 0.45, 2.3, sz, 0.005);
  box(1.9, 0.1, 0.6, M.linen, sx, 0.62, sz, 0.04); [[-0.85, -0.25], [0.85, -0.25], [-0.85, 0.25], [0.85, 0.25]].forEach(([a, b]) => cyl(0.03, 0.03, 0.58, M.steel, sx + a, 0.29, sz + b, 8));
  [-0.6, 0, 0.6].forEach((dx, i) => {
    const y0 = 2.28, y1 = 0.95 + (i === 1 ? 0.05 : 0);
    [-0.14, 0.14].forEach((dz) => { const len = y0 - y1; const rp = add(new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, len, 6), M.rope)); rp.position.set(sx + dx, y1 + len / 2, sz + dz); });
    const sl = add(new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.035, 8, 20, Math.PI), M.honey)); sl.position.set(sx + dx, y1 + 0.02, sz); sl.rotation.set(0, Math.PI / 2, Math.PI);
    out.sway.push(sl);
  });
  out.hotspots.schlinge = new THREE.Vector3(sx, 1.4, sz);
  plant(10.3, 0, -11.4, 1.4, 'monstera');
  pendant(7, -7.4, 2.15);

  // Halbhohe Wand zwischen Behandlung und Training (mit Pflanzen)
  box(0.18, 1.1, 3.6, M.wall, 4.1, 0.55, -9.6, 0.01); box(0.3, 0.05, 3.7, M.oak, 4.1, 1.12, -9.6, 0.01);
  [[-10.8], [-9.6], [-8.4]].forEach(([z]) => plant(4.1, 1.14, z, 0.4, 'small'));

  // ---------- Garten hinten ----------
  const bench2 = new THREE.Group(); bench2.position.set(8.6, 0.1, -15); g.add(bench2);
  const seat = new THREE.Mesh(new RoundedBoxGeometry(1.6, 0.06, 0.45, 2, 0.02), M.oak); seat.position.y = 0.45; seat.castShadow = true; bench2.add(seat);
  const back = new THREE.Mesh(new RoundedBoxGeometry(1.6, 0.4, 0.05, 2, 0.02), M.oak); back.position.set(0, 0.72, -0.2); back.rotation.x = -0.15; bench2.add(back);
  [-0.7, 0.7].forEach((x) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.4), M.oakDark); l.position.set(x, 0.22, 0); bench2.add(l); });
  plant(6.2, 0.1, -13.2, 1.0, 'olive'); plant(10.0, 0.1, -13.4, 0.8, 'fern');
  // Lichterkette auf der Terrasse
  for (let i = 0; i < 14; i++) { const t = i / 13, x = 4.4 + t * 7.2, y = 2.75 - Math.sin(t * Math.PI) * 0.35; const bm = new THREE.MeshStandardMaterial({ color: '#FFE7B8', emissive: new THREE.Color('#FFC46B'), emissiveIntensity: 0 }); const b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), bm); b.position.set(x, y, -12.6); g.add(b); out.glow.push({ m: bm, k: 3.5 }); }

  // ---------- Bausteine ----------
  function plant(x, y, z, s, kind) {
    const pg = new THREE.Group(); pg.position.set(x, y, z); g.add(pg);
    const potH = kind === 'small' ? 0.16 : 0.32 * Math.min(1, s);
    const pt = new THREE.Mesh(new THREE.CylinderGeometry(potH * 0.62, potH * 0.48, potH, 24), kind === 'olive' ? M.stone : M.terracotta); pt.position.y = potH / 2; pt.castShadow = true; pg.add(pt);
    const leafShape = new THREE.Shape(); leafShape.moveTo(0, 0); leafShape.bezierCurveTo(0.5, 0.25, 0.5, 0.85, 0, 1.15); leafShape.bezierCurveTo(-0.5, 0.85, -0.5, 0.25, 0, 0);
    const lg = new THREE.ShapeGeometry(leafShape, 6);
    const n = kind === 'monstera' ? 16 : kind === 'olive' ? 70 : kind === 'small' ? 14 : 34;
    const crown = new THREE.Group(); crown.position.y = potH; pg.add(crown);
    if (kind === 'olive') { const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * s, 0.045 * s, 1.0 * s, 8), M.oakDark); tr.position.y = 0.5 * s; tr.castShadow = true; crown.add(tr); }
    for (let i = 0; i < n; i++) {
      const lf = new THREE.Mesh(lg, Math.random() < 0.5 ? M.leaf : M.leaf2);
      lf.castShadow = true;
      const a = Math.random() * Math.PI * 2;
      let ls, hy, rr;
      if (kind === 'monstera') { ls = R(0.28, 0.42) * s; hy = R(0.3, 1.0) * s; rr = R(0.05, 0.35) * s; }
      else if (kind === 'olive') { ls = R(0.05, 0.08) * s; hy = R(0.85, 1.35) * s; rr = R(0, 0.3) * s; }
      else if (kind === 'small') { ls = R(0.08, 0.14) * s * 2; hy = R(0.02, 0.12); rr = R(0, 0.06); }
      else { ls = R(0.18, 0.3) * s; hy = R(0.1, 0.55) * s; rr = R(0, 0.12) * s; }
      lf.scale.set(ls * (kind === 'olive' ? 0.45 : 0.8), ls, ls);
      lf.position.set(Math.cos(a) * rr, hy, Math.sin(a) * rr);
      lf.rotation.set(R(-1.2, -0.2), a + Math.PI / 2, R(-0.4, 0.4));
      crown.add(lf);
    }
    out.sway.push(crown);
  }
  function tree(x, z, s) {
    const tr = add(new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.18 * s, 3 * s, 10), M.oakDark)); tr.position.set(x, 1.5 * s, z);
    for (let i = 0; i < 5; i++) { const c = add(new THREE.Mesh(new THREE.IcosahedronGeometry(R(1.1, 1.6) * s, 1), i % 2 ? M.leaf : M.leaf2)); c.position.set(x + R(-0.8, 0.8) * s, (3 + R(0, 1.4)) * s, z + R(-0.8, 0.8) * s); }
  }
  function sofa(x, z, ry, m) {
    const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = ry; g.add(s);
    const p = (w, h, d, px, py, pz, r = 0.08) => { const mm = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), m); mm.position.set(px, py, pz); mm.castShadow = mm.receiveShadow = true; s.add(mm); };
    p(2.3, 0.42, 0.95, 0, 0.21, 0); p(2.3, 0.55, 0.22, 0, 0.6, -0.38); p(0.22, 0.6, 0.95, -1.08, 0.36, 0); p(0.22, 0.6, 0.95, 1.08, 0.36, 0);
    p(0.95, 0.14, 0.72, -0.5, 0.48, 0.08, 0.06); p(0.95, 0.14, 0.72, 0.5, 0.48, 0.08, 0.06);
    const pillow = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.38, 0.12, 3, 0.06), M.honey); pillow.position.set(-0.7, 0.72, -0.2); pillow.rotation.set(-0.2, 0.2, 0.1); pillow.castShadow = true; s.add(pillow);
    const blanket = new THREE.Mesh(new RoundedBoxGeometry(0.6, 0.05, 0.85, 2, 0.02), M.linen); blanket.position.set(0.75, 0.57, 0.05); blanket.castShadow = true; s.add(blanket);
  }
  function armchair(x, z, ry, m) {
    const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = ry; g.add(s);
    const p = (w, h, d, px, py, pz) => { const mm = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, 0.08), m); mm.position.set(px, py, pz); mm.castShadow = mm.receiveShadow = true; s.add(mm); };
    p(0.9, 0.4, 0.85, 0, 0.32, 0); p(0.9, 0.6, 0.18, 0, 0.75, -0.34); p(0.16, 0.5, 0.8, -0.42, 0.55, 0); p(0.16, 0.5, 0.8, 0.42, 0.55, 0);
    [[-0.35, -0.3], [0.35, -0.3], [-0.35, 0.3], [0.35, 0.3]].forEach(([a, b]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.14, 8), M.oakDark); l.position.set(a, 0.07, b); s.add(l); });
  }
  function bench(x, z) {
    const s = new THREE.Group(); s.position.set(x, 0, z); g.add(s);
    const top = new THREE.Mesh(new RoundedBoxGeometry(2.0, 0.12, 0.7, 3, 0.05), M.moss); top.position.y = 0.68; top.castShadow = top.receiveShadow = true; s.add(top);
    const head = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.06, 0.4, 2, 0.03), M.white); head.position.set(-0.75, 0.77, 0); s.add(head);
    const frame = new THREE.Mesh(new RoundedBoxGeometry(1.7, 0.08, 0.5, 2, 0.02), M.oak); frame.position.y = 0.56; s.add(frame);
    [[-0.8, -0.24], [0.8, -0.24], [-0.8, 0.24], [0.8, 0.24]].forEach(([a, b]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.56, 0.06), M.oak); l.position.set(a, 0.28, b); l.castShadow = true; s.add(l); });
  }
  function pendant(x, z, y) {
    cyl(0.006, 0.006, H - y, M.black, x, y + (H - y) / 2, z, 6);
    const shadeMat = new THREE.MeshStandardMaterial({ color: '#E9DFCB', roughness: 0.8, side: THREE.DoubleSide, emissive: new THREE.Color('#FFC27A'), emissiveIntensity: 0 });
    const sh = add(new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.28, 32, 1, true), shadeMat), true, false); sh.position.set(x, y, z);
    const bulbM = new THREE.MeshStandardMaterial({ color: '#FFF3DA', emissive: new THREE.Color('#FFD08A'), emissiveIntensity: 0 });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), bulbM); bulb.position.set(x, y - 0.12, z); g.add(bulb);
    out.glow.push({ m: shadeMat, k: 0.6 }, { m: bulbM, k: 4 });
    const l = new THREE.PointLight('#FFC27A', 0, 7, 1.6); l.position.set(x, y - 0.25, z); g.add(l); out.lamps.push({ l, k: 5 });
  }
  function floorLamp(x, z) {
    cyl(0.16, 0.18, 0.03, M.black, x, 0.015, z); cyl(0.012, 0.012, 1.55, M.black, x, 0.78, z, 8);
    const shadeMat = new THREE.MeshStandardMaterial({ color: '#EFE6D6', roughness: 0.85, side: THREE.DoubleSide, emissive: new THREE.Color('#FFC27A'), emissiveIntensity: 0 });
    const sh = add(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.24, 0.3, 28, 1, true), shadeMat), true, false); sh.position.set(x, 1.62, z);
    out.glow.push({ m: shadeMat, k: 1.1 });
    const l = new THREE.PointLight('#FFC27A', 0, 6, 1.6); l.position.set(x, 1.55, z); g.add(l); out.lamps.push({ l, k: 4.5 });
  }
  function art_(x, y, z, axis, seed) {
    const fr = add(new THREE.Mesh(new RoundedBoxGeometry(0.86, 1.06, 0.04, 2, 0.01), M.oak));
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.92), new THREE.MeshStandardMaterial({ map: T.art(seed), roughness: 0.9 }));
    fr.position.set(x, y, z); pic.position.set(x, y, z);
    if (axis === 'z') { fr.rotation.y = Math.PI / 2; pic.rotation.y = Math.PI / 2; pic.position.x += 0.025; }
    else pic.position.z += 0.025;
    g.add(pic);
  }
  // Leistung: statische Teile je Material zu wenigen Objekten zusammenfassen (weniger Zeichenaufrufe)
  const keep = new Set(out.curtains.map((c) => c.mesh).concat(out.sway.filter((o) => o.isMesh)));
  g.children.filter((c) => c.isGroup && c !== doorPivot).forEach((sub) => mergeByMaterial(sub, keep));
  mergeByMaterial(g, keep);
  out.group = g;
  return out;
}

function mergeByMaterial(parent, keep) {
  const buckets = new Map();
  [...parent.children].forEach((c) => {
    if (!c.isMesh || keep.has(c)) return;
    c.updateMatrix();
    const geo = (c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone()).applyMatrix4(c.matrix);
    Object.keys(geo.attributes).forEach((k) => { if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k); });
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    geo.clearGroups();
    const key = c.material.uuid + (c.castShadow ? 'c' : '') + (c.receiveShadow ? 'r' : '');
    if (!buckets.has(key)) buckets.set(key, { mat: c.material, geos: [], cast: c.castShadow, recv: c.receiveShadow });
    buckets.get(key).geos.push(geo);
    parent.remove(c);
  });
  buckets.forEach(({ mat, geos, cast, recv }) => {
    const m = new THREE.Mesh(mergeGeometries(geos), mat);
    m.castShadow = cast; m.receiveShadow = recv; parent.add(m);
  });
}
