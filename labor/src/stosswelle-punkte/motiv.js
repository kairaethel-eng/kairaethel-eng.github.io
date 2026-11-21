// Entwurf „Stoßwelle in Punkten“ (20.11.2026 nachts, Kai im Arbeitsblatt 4: „erst Stoßwelle als Entwurf … Trotz Punkten bitte sehr scharf
// und kenntlich bauen. Nicht verspielt weich. Sondern professionell kreativ“). Puls bleibt unberührt (dort weiter die Linien-Bühne).
// Bild: echtes Fersenbein mit Fuß und Unterschenkel von der Seite (BodyParts3D), die Achillessehne und die Sohlenplatte als straffe
// Perlenstränge, der Sehnenansatz an der Ferse in Bernstein; das Handstück liegt von hinten an, die Impulse laufen als scharfe Bögen
// ins Gewebe. Drei Stärken = drei Fassungen desselben Bilds (mehr Bögen, größere Reichweite). Schematisch, keine Wirkaussage.
import { T, meanOf } from '../test-4/services.js';
import { rows, bounds } from '../shared/netz.js';
import { tube, ell, line, cyl, V } from '../shared/raster.js';

export const STUFEN = [
  { id: 'sanft', name: 'Sanft', n: 3, txt: 'Sanft: wenige, leichte Impulse. So beginnt jede Behandlung, zum Herantasten.' },
  { id: 'mittel', name: 'Mittel', n: 5, txt: 'Mittel: mehr Impulse, etwas mehr Druck – angepasst an das, was Sie spüren.' },
  { id: 'kraeftig', name: 'Kräftig', n: 7, txt: 'Kräftig: dichte Impulsfolge für belastbares Gewebe, jederzeit zurücknehmbar.' },
];
const SEITE = [0, 0, 1, 0, 1, 0, -1, 0, 0]; // Fuß von der Seite: Zehen nach rechts (x), oben bleibt oben, Tiefe = quer durch den Fuß

function szene(n) {
  return (sp, A) => {
    const fu = A['bein/fuss'], ti = A['bein/tibia'], fi = A['bein/fibula'], bf = bounds(fu), S = 0.086;
    // Fersenhöcker: hinterste Punkte des Fußes (Ansatz der Achillessehne)
    const hk = meanOf(fu, (p) => p[2] < bf.lo[2] + 1.0), c = [bf.mid[0], bf.lo[1] + 9.5, bf.lo[2] + 5.8];
    const tr = (p) => [(p[2] - c[2]) * S, (p[1] - c[1]) * S, -(p[0] - c[0]) * S];
    const H = tr(hk), o = { M: SEITE, c, s: S, axis: 'y' };
    const hoch = { ...o, w: (p) => 1 - 0.95 * Math.min(1, Math.max(0, (p[1] - 0.6) / 0.75)), clip: (p) => p[1] < 1.4 };
    const ansatz = (q) => (Math.hypot(q[0] - H[0], q[1] - H[1]) < 0.17 ? 1 : 0); // Sehnenansatz in Bernstein
    const parts = [T(rows(fu, sp, o), ansatz, 0), T(rows(ti, sp, hoch), 0, 0), T(rows(fi, sp, hoch), 0, 0)];
    // Achillessehne: vom Fersenhöcker straff nach oben, neun Stränge, oben breiter und lichter
    const top = [H[0] + 0.12, 1.36, 0];
    for (let j = -4; j <= 4; j++) parts.push(T(line((t) => { const e = t * t * (3 - 2 * t); return [H[0] + 0.012 + (top[0] - H[0]) * e + Math.sin(Math.PI * t) * -0.035, H[1] + 0.05 + (top[1] - H[1] - 0.05) * t, j * (0.016 + 0.014 * t)]; }, sp * 0.62, { half: !!(j & 1), w: (t) => (1 - 0.8 * t * t) * (1 - Math.abs(j) * 0.07) }), (q) => (q[1] < H[1] + 0.2 ? 1 : 2), 0));
    // Sohlenplatte: vom Fersenbein nach vorn zu den Zehengrundgelenken, sieben Stränge
    const y0 = (bf.lo[1] - c[1]) * S;
    for (let j = -3; j <= 3; j++) parts.push(T(line((t) => [H[0] + 0.2 + t * 0.92, y0 + 0.035 + Math.sin(Math.PI * t) * 0.085 - t * 0.012, j * (0.02 + 0.02 * t)], sp * 0.62, { half: !!(j & 1), w: (t) => 0.75 - 0.35 * t }), 2, 0));
    // Haut: eine feine Kontur hinter Wade und Ferse und unter der Sohle (zwei Stränge)
    for (const d of [0, 0.022]) parts.push(T(line((t) => {
      const P = [[H[0] + 0.03, 1.36], [H[0] - 0.085, 0.72], [H[0] - 0.115, H[1] + 0.2], [H[0] - 0.16, H[1] - 0.02], [H[0] - 0.1, y0 - 0.04], [H[0] + 0.25, y0 - 0.075], [H[0] + 0.8, y0 - 0.03], [H[0] + 1.2, y0 - 0.06]];
      const f = t * (P.length - 1), i = Math.min(P.length - 2, Math.floor(f)), u = f - i, p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      const cr = (k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u * u + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u * u * u);
      return [cr(0) - d * 0.7, cr(1) - d * 0.4, 0];
    }, sp * 0.6, { n: 300, w: (t) => (d ? 0.3 : 0.6) * Math.min(1, t * 6) * Math.min(1, (1 - t) * 5) }), 4, 0));
    // Handstück: von hinten unten an den Sehnenansatz gesetzt – Griff, Kopf, Ringe, Kabel
    const dir = V.norm([-0.82, -0.3, 0]), K = [H[0] - 0.19, H[1] + 0.03, 0], at = (s) => V.add(K, V.mul(dir, s));
    parts.push(T(ell(at(0.07), [0.085, 0.085, 0.085], sp, { axis: 'y' }), 1, 0, 0, { grp: 7 }));
    parts.push(T(tube([{ p: at(0.14), r: 0.07 }, { p: at(0.26), r: 0.1 }, { p: at(0.56), r: 0.105 }, { p: at(0.76), r: 0.09 }, { p: at(0.86), r: 0.06 }], sp), 0, 0, 0, { grp: 7 }));
    for (const s of [0.32, 0.4, 0.48]) parts.push(T(line((t) => { const a = t * 6.2831853, u = [-dir[1], dir[0], 0]; return V.add(at(s), V.add(V.mul(u, Math.cos(a) * 0.112), [0, 0, Math.sin(a) * 0.112])); }, sp * 0.6), 4, 0));
    parts.push(T(line((t) => { const b = at(0.86); return [b[0] - t * 0.3, b[1] - t * t * 0.42 + Math.sin(t * 3.1) * 0.05, 0]; }, sp * 0.62, { w: (t) => 1 - 0.85 * t }), 4, 0));
    // Impulse: scharfe Bögen vom Kopf ins Gewebe, drei Stränge je Bogen, nach außen lichter; das Licht läuft von innen nach außen
    const a0 = Math.atan2(-dir[1], -dir[0]);
    for (let i = 0; i < n; i++) for (const z of [-0.035, 0, 0.035]) parts.push(T(line((t) => { const a = a0 - 0.95 + t * 1.9, r = 0.15 + i * 0.12; return [K[0] + Math.cos(a) * r, K[1] + Math.sin(a) * r, z]; }, sp * 0.58, { half: z === 0, w: (t) => (1 - i * 0.07) * Math.sin(Math.PI * t) ** 0.4 * (z ? 0.75 : 1) }), 1, 2, i / 7));
    return parts;
  };
}
export const MOTIVE = STUFEN.map((s) => ({ name: s.name, se: 1.0, parts: () => [], echt: szene(s.n) }));
