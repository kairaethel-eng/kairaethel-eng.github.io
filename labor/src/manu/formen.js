// Formen der Manuthera-Bühne (20.11.2026): Liege, Gestell und liegende Figur als geordnete Punktflächen (../shared/raster.js).
// Eine Quelle für die große Bühne (ideaA.js) und das kleine Leistungs-Motiv (test-4/services.js) – Kai im Arbeitsblatt: die Liege
// „noch detaillierter“, das kleine Motiv „deutlich nachbessern“. Schematisch, keine Herstellerzeichnung, keine technischen Maße.
// Jedes Teil: { r (Form), kind 0 Polster · 1 Gestell · 2 Figur · 3 Kante/Naht (Perlenlinie), seg 'UP' Kopf-/Brustteil · 'F' fest ·
//               'LO' Beckenteil · 'BB' Figur (zwischen den Teilen weich verteilt) · 'ARM' Arm (Schulter am Brustteil, Hand auf der Stütze) }
import * as RA from '../shared/raster.js';
import { rows as netzRows } from '../shared/netz.js';

export const PIV_U = -0.855, PIV_L = 0.0; // Gelenke zwischen den Liegeteilen (x)

// echt (21.11.2026): Teile aus assets/manu-figur.bin (tools/manu-figur.mjs) – echte Körperoberfläche aus BodyParts3D, schon in Bauchlage
//   im Raum der Liege; fehlt sie, bleibt die gerechnete Figur unten.
export function manuFormen(SPL, { figur = true, echt = null } = {}) {
  const SPF = SPL * 1.3, SPB = SPL * 0.78, P = [];
  const alt = figur && !(echt && echt['figur/koerper']); // gerechnete Figur (Rückfall): Liege in den Maßen bis 20.11.
  const add = (r, kind, seg, grp = kind) => P.push({ r, kind, seg, grp });
  // Polster: Quader + Naht als Perlenlinie rund um die Oberkante (macht die Kante scharf)
  const polster = (c, s, seg, loch = null) => {
    const top = c[1] + s[1] / 2, keep = loch ? (p, n) => !(n[1] > 0.5 && ((p[0] - loch[0]) / loch[2]) ** 2 + ((p[2] - loch[1]) / loch[3]) ** 2 < 1) : null;
    add(RA.box(c, s, SPL, keep ? { keep } : {}), 0, seg);
    const x0 = c[0] - s[0] / 2, x1 = c[0] + s[0] / 2, z0 = c[2] - s[2] / 2, z1 = c[2] + s[2] / 2, y = top + 0.004;
    for (const [a, b] of [[[x0, y, z0], [x1, y, z0]], [[x1, y, z0], [x1, y, z1]], [[x1, y, z1], [x0, y, z1]], [[x0, y, z1], [x0, y, z0]]]) add(RA.seg(a, b, SPL * 0.6), 3, seg, 9);
    if (loch) add(RA.line((t) => [loch[0] + Math.cos(t * 6.2831853) * loch[2], y, loch[1] + Math.sin(t * 6.2831853) * loch[3]], SPL * 0.6), 3, seg, 9);
  };
  // ---------- Liege ----------
  // 21.11.2026 (echte Figur, tools/manu-figur.mjs): Kopfteil länger (der Scheitel liegt auf), Brustteil schmaler – die Arme hängen
  // an den Schultern vorbei auf die Armstützen, wie bei der echten Liege
  polster(alt ? [-1.965, -0.08, 0] : [-2.03, -0.08, 0], [alt ? 0.57 : 0.7, 0.16, 0.62], 'UP', [-1.99, 0, 0.13, 0.085]); // Kopfteil mit Gesichtsöffnung
  polster([-1.255, -0.08, 0], [0.75, 0.16, alt ? 1.3 : 0.95], 'UP');
  polster([-0.43, -0.08, 0], [0.8, 0.16, 1.3], 'F');
  polster([0.5, -0.08, 0], [0.94, 0.16, 1.3], 'LO');
  polster([1.62, -0.08, 0], [1.22, 0.16, 1.3], 'LO');
  // Armstützen (21.11.: tiefer und länger – der Unterarm der echten Figur liegt vom Ellbogen bis zum Handgelenk auf), Träger zum Rahmen
  if (alt) for (const z of [-0.9, 0.9]) { polster([-1.5, -0.3, z], [0.5, 0.11, 0.3], 'F'); add(RA.cap([-1.5, -0.36, z * 0.93], [-1.5, -0.5, z * 0.7], 0.03, SPF), 1, 'F'); }
  else for (const z of [-0.86, 0.86]) { polster([-1.68, -0.555, z], [0.95, 0.11, 0.3], 'F'); add(RA.cap([-1.68, -0.6, z * 0.9], [-1.68, -0.27, z * 0.5], 0.03, SPF), 1, 'F'); }
  // Rahmen unter den Polstern
  add(RA.box([-1.6, -0.22, 0], [1.25, 0.06, 0.9], SPF), 1, 'UP');
  add(RA.box([-0.43, -0.22, 0], [0.7, 0.06, 0.9], SPF), 1, 'F');
  add(RA.box([1.1, -0.22, 0], [2.0, 0.06, 0.9], SPF), 1, 'LO');
  if (alt) for (const z of [-0.9, 0.9]) add(RA.box([-1.5, -0.33, z * 0.78], [0.06, 0.05, 0.42], SPF), 1, 'F');
  else for (const z of [-0.86, 0.86]) add(RA.box([-1.68, -0.27, z * 0.5], [0.08, 0.05, 0.1], SPF), 1, 'F'); // Halter am Rahmen
  // Bediengriffe am Fußende und seitlich am Beckenteil (Bügel)
  // Bediengriff am Fußende (21.11.: unter dem Beinteil – die Füße der echten Figur hängen über das Ende)
  if (alt) add(RA.tube([{ p: [2.2, -0.22, -0.36], r: 0.022 }, { p: [2.36, -0.22, -0.3], r: 0.022 }, { p: [2.4, -0.22, 0], r: 0.022 }, { p: [2.36, -0.22, 0.3], r: 0.022 }, { p: [2.2, -0.22, 0.36], r: 0.022 }], SPF * 0.8), 1, 'LO');
  else add(RA.tube([{ p: [1.92, -0.3, -0.36], r: 0.022 }, { p: [2.06, -0.33, -0.3], r: 0.022 }, { p: [2.1, -0.34, 0], r: 0.022 }, { p: [2.06, -0.33, 0.3], r: 0.022 }, { p: [1.92, -0.3, 0.36], r: 0.022 }], SPF * 0.8), 1, 'LO');
  for (const z of [-1, 1]) add(RA.tube([{ p: [0.9, -0.25, z * 0.46], r: 0.02 }, { p: [1.0, -0.3, z * 0.72], r: 0.02 }, { p: [1.3, -0.3, z * 0.74], r: 0.02 }, { p: [1.4, -0.25, z * 0.46], r: 0.02 }], SPF * 0.8), 1, 'LO');
  // Säule in zwei Stufen, Antrieb, Gelenkträger
  add(RA.box([0, -0.5, 0], [1.9, 0.3, 0.5], SPF), 1, 'F');
  add(RA.box([0, -0.84, 0], [0.78, 0.4, 0.4], SPF), 1, 'F');
  add(RA.box([0, -1.18, 0], [0.62, 0.3, 0.32], SPF), 1, 'F');
  for (const s of [-1, 1]) add(RA.tube([{ p: [s * 0.25, -1.26, 0.2], r: 0.035 }, { p: [s * 0.75, -0.62, 0.2], r: 0.028 }], SPF * 0.8), 1, 'F', 5); // Hubstreben
  // Fahrgestell: zwei Längsholme, Querholm, vier Rollen mit Gabel
  for (const z of [-0.5, 0.5]) add(RA.box([0, -1.38, z], [2.6, 0.07, 0.1], SPF), 1, 'F');
  add(RA.box([0, -1.38, 0], [0.34, 0.07, 1.0], SPF), 1, 'F');
  for (const x of [-1.25, 1.25]) for (const z of [-0.5, 0.5]) { add(RA.cyl([x, -1.5, z], 0.075, 0.07, SPF * 0.85, { axis: 'z' }), 1, 'F', 6); add(RA.box([x, -1.44, z], [0.05, 0.08, 0.12], SPF), 1, 'F', 6); }
  // umlaufender Fußbügel (Schaltleiste) als doppelte Perlenlinie
  const rr = (t, d) => { const a = t * 6.2831853, cx = 1.42 + d, cz = 0.72 + d, k = 4; return [Math.sign(Math.cos(a)) * Math.abs(Math.cos(a)) ** (2 / k) * cx, -1.47, Math.sign(Math.sin(a)) * Math.abs(Math.sin(a)) ** (2 / k) * cz]; };
  for (const d of [0, 0.035]) add(RA.line((t) => rr(t, d), SPL * 0.62, { n: 400 }), 3, 'F', 9);

  if (!figur) return { parts: P, SPF, SPB };
  if (echt && echt['figur/koerper']) {
    // Rumpf, Kopf und Beine verteilen sich weich auf die Liegeteile (BB); die Arme hängen an der Schulter (Brustteil) und liegen
    // mit dem Unterarm auf der festen Stütze (ARM). Zeilen quer zur Körperachse wie bei der Figur in Kapitel 01.
    add(netzRows(echt['figur/koerper'], SPB, { axis: 'x' }), 2, 'BB', 2);
    for (const id of ['figur/arm-l', 'figur/arm-r']) if (echt[id]) add(netzRows(echt[id], SPB, { axis: 'x' }), 2, 'ARM', 2);
    const w = echt['figur/wirbel'];
    return { parts: P, SPF, SPB, wirbel: w ? Array.from({ length: w.pos.length / 3 }, (_, i) => [w.pos[i * 3], w.pos[i * 3 + 1], w.pos[i * 3 + 2]]) : null };
  }
  // ---------- Liegende Figur (Bauchlage, Gesicht in der Gesichtsöffnung) – aus einem Guss ----------
  const fig = (r, seg = 'BB') => add(r, 2, seg, 2);
  fig(RA.ell([-1.99, 0.2, 0], [0.21, 0.17, 0.16], SPB, { axis: 'x' }));
  for (const s of [-1, 1]) fig(RA.ell([-1.99, 0.17, s * 0.158], [0.045, 0.06, 0.018], SPB * 0.8, { axis: 'y' })); // Ohren
  // Rumpf: Hals → Schultern → Brustkorb → Taille → Becken (ovale Schnitte entlang der Liege, weich verbunden)
  fig(RA.loft([
    { x: -1.84, y: 0.215, ry: 0.082, rz: 0.088 }, { x: -1.72, y: 0.225, ry: 0.092, rz: 0.11 }, { x: -1.62, y: 0.235, ry: 0.15, rz: 0.3 },
    { x: -1.5, y: 0.24, ry: 0.195, rz: 0.475 }, { x: -1.28, y: 0.235, ry: 0.215, rz: 0.45 }, { x: -1.0, y: 0.225, ry: 0.205, rz: 0.405 },
    { x: -0.7, y: 0.2, ry: 0.178, rz: 0.345 }, { x: -0.45, y: 0.19, ry: 0.172, rz: 0.335 }, { x: -0.2, y: 0.195, ry: 0.185, rz: 0.375 },
    { x: 0.05, y: 0.21, ry: 0.205, rz: 0.41 }, { x: 0.28, y: 0.225, ry: 0.215, rz: 0.4 }, { x: 0.46, y: 0.2, ry: 0.17, rz: 0.36 },
  ], SPB));
  for (const s of [-1, 1]) {
    fig(RA.ell([-1.22, 0.33, s * 0.2], [0.2, 0.1, 0.15], SPB, { axis: 'x' })); // Schulterblatt
    fig(RA.ell([0.3, 0.27, s * 0.17], [0.25, 0.15, 0.19], SPB, { axis: 'x' })); // Gesäß
    // Bein (Oberschenkel → Knie → Wade → Knöchel), Ferse und Fuß
    fig(RA.tube([{ p: [0.34, 0.165, s * 0.195], r: 0.15 }, { p: [0.8, 0.14, s * 0.2], r: 0.132 }, { p: [1.2, 0.115, s * 0.2], r: 0.098 }, { p: [1.45, 0.125, s * 0.195], r: 0.112 }, { p: [1.62, 0.115, s * 0.192], r: 0.1 }, { p: [1.86, 0.095, s * 0.185], r: 0.07 }, { p: [2.0, 0.09, s * 0.18], r: 0.056 }], SPB, { capA: false }));
    fig(RA.ell([2.04, 0.115, s * 0.18], [0.07, 0.06, 0.055], SPB, { axis: 'x' }));
    fig(RA.tube([{ p: [2.03, 0.09, s * 0.182], r: 0.055 }, { p: [2.13, 0.075, s * 0.19], r: 0.058, }, { p: [2.22, 0.035, s * 0.195], r: 0.04 }], SPB, { fl: 0.7, ref: [0, 0, 1] }));
    // Arm: Schulter → Ellbogen → Handgelenk, Hand mit Fingern auf der Armstütze
    fig(RA.tube([{ p: [-1.5, 0.22, s * 0.44], r: 0.094 }, { p: [-1.49, 0.07, s * 0.66], r: 0.078 }, { p: [-1.47, -0.11, s * 0.84], r: 0.066 }, { p: [-1.6, -0.165, s * 0.88], r: 0.056 }, { p: [-1.76, -0.18, s * 0.9], r: 0.046 }], SPB, { capA: false }), 'ARM');
    fig(RA.ell([-1.84, -0.19, s * 0.9], [0.075, 0.028, 0.055], SPB, { axis: 'x' }), 'ARM');
    for (let k = 0; k < 4; k++) fig(RA.cap([-1.9, -0.195, s * (0.862 + k * 0.026)], [-1.985 + Math.abs(k - 1.5) * 0.012, -0.205, s * (0.855 + k * 0.03)], 0.0125, SPB * 0.7), 'ARM');
    fig(RA.cap([-1.84, -0.195, s * 0.845], [-1.9, -0.205, s * 0.812], 0.014, SPB * 0.7), 'ARM');
  }
  return { parts: P, SPF, SPB };
}
