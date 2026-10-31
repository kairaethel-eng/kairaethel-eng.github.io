// Miniatur-Modell der Praxis (Grundriss aus V10, schematisch) mit abhebbarem Dach.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const S = 0.022;                       // Grundriss-Einheiten → Welt
const px = (x) => (x - 210) * S;       // Grundriss x → Welt x
const pz = (y) => (y - 140) * S;       // Grundriss y → Welt z

export const ROOMS = [
  { key: 'empfang', n: 'Empfang & Ankommen', d: 'Die Tür ist offen, der Weg ist kurz: Hier werden Sie mit Namen begrüßt, nicht mit Nummer aufgerufen. Jacke ablegen, durchatmen, ankommen.', r: [12, 12, 154, 126], floor: '#F2E8D6' },
  { key: 'warte', n: 'Wartebereich – unser Wohnzimmer', d: 'Eher Wohnzimmer als Wartezimmer: bequeme Sitze, Wasser und Kaffee, kurze Wartezeiten. Ein Ort, an dem niemand auf die Uhr schauen muss.', r: [12, 142, 154, 126], floor: '#EFE2CC' },
  { key: 'b1', n: 'Behandlungsraum 1', d: 'Ruhe und Tageslicht. Hier ist Zeit für Befund, Behandlung und alle Ihre Fragen, hinter geschlossener Tür und ohne Durchgangsverkehr.', r: [232, 12, 176, 80], floor: '#E7ECE4' },
  { key: 'b2', n: 'Behandlungsraum 2 · Manuthera', d: 'Hier steht die Loyer Manuthera, eine der modernsten Therapieliegen für mobilisierende Behandlungen der Wirbelsäule und großer Gelenke.', r: [232, 96, 176, 80], floor: '#E3EAEE' },
  { key: 'training', n: 'Trainingsfläche', d: 'Aktiv werden: Geräte, Übungen und Ihr persönliches Programm für zuhause. Angeleitet und begleitet, nicht allein gelassen.', r: [232, 180, 176, 88], floor: '#ECE8DC' },
];

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.72, metalness: 0, ...o });

function rbox(w, h, d, m, x, y, z, r = 0.04) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)), m);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

export function buildHouse() {
  const g = new THREE.Group();
  const M = {
    slab: mat('#E3DCCB'), wall: mat('#FBF9F4', { roughness: 0.9 }), wood: mat('#BFA588', { roughness: 0.6 }),
    petrol: mat('#305869', { roughness: 0.8 }), sage: mat('#9DB48A'), blue: mat('#4F87AB', { roughness: 0.6 }),
    amber: mat('#C98A35', { roughness: 0.55 }), white: mat('#FFFFFF', { roughness: 0.5 }), dark: mat('#1C3038', { roughness: 0.5 }),
    leaf: mat('#5E8A35', { roughness: 0.9 }), rug: mat('#E9C998', { roughness: 1 }),
  };

  // Bodenplatte
  const slab = rbox(9.7, 0.32, 6.9, M.slab, 0, -0.32, 0.05, 0.08);
  g.add(slab);

  // Raumböden (anwählbar)
  const floors = ROOMS.map((r) => {
    const [x, y, w, h] = r.r;
    const m = mat(r.floor, { emissive: new THREE.Color('#C5811C'), emissiveIntensity: 0 });
    const f = new THREE.Mesh(new THREE.BoxGeometry(w * S, 0.05, h * S), m);
    f.position.set(px(x + w / 2), 0.025, pz(y + h / 2));
    f.receiveShadow = true;
    f.userData.room = r;
    g.add(f);
    return f;
  });
  // Flur
  const hall = new THREE.Mesh(new THREE.BoxGeometry(62 * S, 0.04, 256 * S), mat('#EDE8DC'));
  hall.position.set(px(199), 0.02, pz(140)); hall.receiveShadow = true; g.add(hall);
  const runner = rbox(26 * S, 0.012, 200 * S, M.rug, px(199), 0.04, pz(150), 0.005); g.add(runner);

  // Wände: Liste von Segmenten [x1,y1,x2,y2] im Grundriss
  const H = 0.82, T = 0.09;
  const walls = [
    [8, 8, 412, 8], [8, 8, 8, 272], [412, 8, 412, 272],
    [8, 272, 182, 272], [216, 272, 412, 272],               // Eingang 182–216
    [12, 140, 70, 140], [108, 140, 166, 140],               // Empfang | Warte (Durchgang)
    [166, 12, 166, 40], [166, 78, 166, 182], [166, 220, 166, 268],
    [232, 12, 232, 30], [232, 70, 232, 112], [232, 152, 232, 196], [232, 240, 232, 268],
    [232, 94, 408, 94], [232, 178, 408, 178],
  ];
  walls.forEach(([x1, y1, x2, y2]) => {
    const len = Math.hypot(x2 - x1, y2 - y1) * S + T;
    const horiz = y1 === y2;
    const w = new THREE.Mesh(new THREE.BoxGeometry(horiz ? len : T, H, horiz ? T : len), M.wall);
    w.position.set(px((x1 + x2) / 2), H / 2, pz((y1 + y2) / 2));
    w.castShadow = true; w.receiveShadow = true;
    g.add(w);
  });
  // Wandkronen in Petrol (wie eine Linie im Grundriss)
  walls.forEach(([x1, y1, x2, y2]) => {
    const len = Math.hypot(x2 - x1, y2 - y1) * S + T;
    const horiz = y1 === y2;
    const c = new THREE.Mesh(new THREE.BoxGeometry(horiz ? len : T + 0.004, 0.02, horiz ? T + 0.004 : len), M.petrol);
    c.position.set(px((x1 + x2) / 2), H + 0.01, pz((y1 + y2) / 2));
    g.add(c);
  });

  // --- Möbel ---
  const add = (m) => (g.add(m), m);
  // Empfang: Tresen (L-Form), Pflanze, runder Teppich
  add(rbox(1.5, 0.5, 0.36, M.wood, px(70), 0, pz(52)));
  add(rbox(0.36, 0.5, 0.9, M.wood, px(110), 0, pz(70)));
  add(rbox(1.56, 0.05, 0.42, M.white, px(70), 0.5, pz(52), 0.02));
  const rugE = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.012, 40), M.rug); rugE.position.set(px(80), 0.06, pz(106)); rugE.receiveShadow = true; g.add(rugE);
  plant(g, M, px(30), pz(30), 1);
  plant(g, M, px(150), pz(122), 0.8);

  // Wartebereich: Sofa, Sessel, Tisch, Pflanzen
  add(rbox(1.7, 0.22, 0.62, M.petrol, px(70), 0.04, pz(242)));
  add(rbox(1.7, 0.42, 0.16, M.petrol, px(70), 0.04, pz(256)));
  add(rbox(0.16, 0.34, 0.62, M.petrol, px(70) - 0.84, 0.04, pz(242)));
  add(rbox(0.16, 0.34, 0.62, M.petrol, px(70) + 0.84, 0.04, pz(242)));
  add(rbox(0.62, 0.24, 0.62, M.amber, px(140), 0.04, pz(200), 0.1));
  add(rbox(0.62, 0.42, 0.14, M.amber, px(140), 0.04, pz(222), 0.06));
  const table = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 36), M.wood); table.position.set(px(78), 0.32, pz(196)); table.castShadow = true; g.add(table);
  const tleg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.3, 16), M.dark); tleg.position.set(px(78), 0.15, pz(196)); g.add(tleg);
  plant(g, M, px(28), pz(160), 1.15);

  // Behandlung 1: Liege, Hocker, Schrank
  bench(g, M, px(320), pz(48), M.petrol);
  const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 24), M.dark); stool.position.set(px(270), 0.36, pz(70)); stool.castShadow = true; g.add(stool);
  const sleg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.32, 10), M.dark); sleg.position.set(px(270), 0.16, pz(70)); g.add(sleg);
  add(rbox(0.9, 0.62, 0.3, M.wood, px(372), 0, pz(22)));
  plant(g, M, px(398), pz(80), 0.7);

  // Behandlung 2: Manuthera (segmentierte, gekippte Liegefläche)
  const mt = new THREE.Group(); mt.position.set(px(320), 0, pz(136));
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.42, 24), M.dark); ped.position.y = 0.21; ped.castShadow = true; mt.add(ped);
  [[-0.62, 0.12], [0, 0], [0.6, -0.16]].forEach(([x, rz]) => {
    const seg = new THREE.Mesh(new RoundedBoxGeometry(0.58, 0.1, 0.6, 2, 0.04), M.blue);
    seg.position.set(x, 0.5 + Math.abs(rz) * 0.4, 0); seg.rotation.z = rz; seg.castShadow = true; mt.add(seg);
  });
  g.add(mt);
  add(rbox(0.9, 0.62, 0.3, M.wood, px(372), 0, pz(108)));

  // Training: Matten, Ball, Hanteln, Sprossenwand
  add(rbox(1.1, 0.04, 0.55, M.blue, px(290), 0.04, pz(236), 0.02));
  add(rbox(1.1, 0.04, 0.55, M.sage, px(290), 0.04, pz(206), 0.02));
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 20), M.amber); ball.position.set(px(360), 0.32, pz(236)); ball.castShadow = true; g.add(ball);
  for (let i = 0; i < 3; i++) {
    const db = new THREE.Group(); db.position.set(px(352) + i * 0.24, 0.1, pz(204));
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.34, 10), M.dark); bar.rotation.x = Math.PI / 2; db.add(bar);
    [-0.14, 0.14].forEach(z => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 18), M.petrol); w.rotation.x = Math.PI / 2; w.position.z = z; w.castShadow = true; db.add(w); });
    g.add(db);
  }
  for (let i = 0; i < 4; i++) {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.8, 8), M.wood);
    r.position.set(px(402), 0.4, pz(196) + i * 0.16); g.add(r);
  }
  for (let j = 0; j < 6; j++) {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.5, 8), M.wood);
    r.rotation.x = Math.PI / 2; r.position.set(px(402), 0.1 + j * 0.13, pz(196) + 0.24); g.add(r);
  }

  // Dach (Satteldach) mit grüner Kante – hebt sich beim Scrollen
  const roof = new THREE.Group();
  const rs = new THREE.Shape();
  const RW = 3.75, RH = 2.3;
  rs.moveTo(-RW, 0); rs.lineTo(0, RH); rs.lineTo(RW, 0); rs.lineTo(RW - 0.18, 0); rs.lineTo(0, RH - 0.2); rs.lineTo(-RW + 0.18, 0); rs.lineTo(-RW, 0);
  const rg = new THREE.ExtrudeGeometry(rs, { depth: 10.1, bevelEnabled: false });
  rg.rotateY(Math.PI / 2); rg.translate(-5.05, 0, 0);
  const roofMat = new THREE.MeshStandardMaterial({ color: '#305869', roughness: 0.6, transparent: true, opacity: 1 });
  const roofMesh = new THREE.Mesh(rg, roofMat); roofMesh.castShadow = true; roof.add(roofMesh);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(rg, 30), new THREE.LineBasicMaterial({ color: '#7FAF45', transparent: true }));
  roof.add(edges);
  roof.position.y = H + 0.02;
  roof.userData = { baseY: H + 0.02, mat: roofMat, edges: edges.material };
  g.add(roof);

  return { group: g, floors, roof, center: (r) => new THREE.Vector3(px(r[0] + r[2] / 2), 0, pz(r[1] + r[3] / 2)) };
}

function plant(g, M, x, z, s) {
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.11 * s, 0.08 * s, 0.2 * s, 18), M.white);
  pot.position.set(x, 0.1 * s, z); pot.castShadow = true; g.add(pot);
  const leaves = new THREE.Group();
  [[0, 0.36, 0, 0.17], [0.09, 0.3, 0.05, 0.12], [-0.08, 0.29, -0.04, 0.12], [0.02, 0.48, -0.03, 0.11]].forEach(([a, b, c, r]) => {
    const l = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 1), M.leaf);
    l.position.set(a * s, b * s, c * s); l.castShadow = true; leaves.add(l);
  });
  leaves.position.set(x, 0, z); g.add(leaves);
}

function bench(g, M, x, z, cushion) {
  const top = new THREE.Mesh(new RoundedBoxGeometry(1.9, 0.12, 0.66, 2, 0.05), cushion);
  top.position.set(x, 0.5, z); top.castShadow = true; top.receiveShadow = true; g.add(top);
  const head = new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.06, 0.4, 2, 0.03), M.white);
  head.position.set(x - 0.72, 0.58, z); g.add(head);
  [[-0.8, -0.24], [0.8, -0.24], [-0.8, 0.24], [0.8, 0.24]].forEach(([a, b]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.46, 10), M.dark);
    leg.position.set(x + a, 0.23, z + b); leg.castShadow = true; g.add(leg);
  });
}
