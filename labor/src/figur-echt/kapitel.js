// Entwurf „Echte Figur“ (23.11.2026, Go Kai „Empfehlung“ zum Vorschlag „anatomischer + Kino“): Kopie von ../feinschliff/kapitel.js
// (Stand 22.11., = Kapitel 01 in Puls). Ablauf, Texte, Stationen, Lösen und Weiter-Hinweis unverändert. Neu:
//   • Figur aus echten Daten (figur.js + gl.js dieser Seite, assets/figur-echt.bin): Haut, Skelett, Gehirn mit Windungen, Muskeln
//     der Stationen, Nervenbahnen an echten Landmarken – der Leuchtpunkt folgt Rückenmark und Ischiasnerv (LINES aus den Daten)
//   • Umschalter in drei Stufen: „heute“ (Figur von Puls, ../feinschliff, zweite Zeichenfläche, erst beim ersten Umschalten gebaut),
//     „1“ = anatomisch echt (uKino 0), „1+2“ = mit Scan-Linie, Filmlicht und Röntgen-Lupe (uKino 1, weich überblendet)
// Adresse: ?stil=heute|echt|kino (Start, Standard kino) · ?abstand=1.6 · ?neigung=0 · ?text=bisher
// Ab hier der Kopf von „Feinschliff“:
// Ablauf, Texte, Lösen, Weiter-Hinweis unverändert. Neu:
//   • zwei Bühnen übereinander: „neu“ (figur.js + gl.js dieser Studie: geordnete Punkte, Kantenlicht, scharfe Punkte) und
//     „bisher“ (Figur plus unverändert aus ../figur-plus, wird erst beim ersten Umschalten gebaut); setStyle() blendet über
//   • Zeiger (PT): Maus oder Finger → Punkte in der Nähe werden größer und heller (uPtr im Shader)
//   • Klasse kf-fein an der Bühne = ruhigere Schrift und gestaffeltes Einblenden (fein.css); aus mit ?text=bisher
// Adresse: ?stil=bisher (Start mit der alten Figur) · ?abstand=1.6 (Punktabstand in Einheiten) · ?neigung=0 (Zeilen ohne Bogen)
//   · ?zeichen=ring (große Punkte als Ringe) · ?text=bisher
// Ab hier der Kopf von „Figur plus“:
// Entwurf „Figur plus“ (16.11.2026, Auftrag Kai): Kopie von ../kopf-fuss/kapitel.js (Stand 16.11.) mit neuer Figur –
// deutliche Körperkonturen, Gehirn an Station 01, Nervensystem statt der einen Lichtlinie; alles Partikel (figur.js, gl.js).
// Unterschiede zum Baustein: keine SVG-Lichtlinie (die Nerven sind Punkte und leuchten mit der Lichtspitze auf, uTip),
// SVG-Linien nur noch ohne WebGL (Gehirn + Nerven gepunktet), am Schluss zieht sich nichts zurück (keine Übergabe an Puls).
// Bei einer Übernahme in Puls: diese Dateien ersetzen den Baustein, und Form 0 in test-4/shapes.js braucht denselben Umriss.
// Ab hier der Kopf des Bausteins:
// Baustein „Von Kopf bis Fuß“ (Auftrag K, Go Kai 16.11.2026; seit 16.11. auch Kapitel 01 in Puls): die Fahrt von Kopf bis Fuß
// verschmilzt mit „Spannung lösen“. Genutzt von der Entwurfsseite (src/kopf-fuss/main.js) und von Puls (src/test-4/main.js).
// Alles ist Funktion des Scroll-Fortschritts u (Bildschirmhöhen seit Beginn der Bühne), weich nachgeführt (us):
//   KEYS → Blick (Blickpunkt, Maßstab, Anker) + Spitze der Lichtlinie; an jeder Station hält die Fahrt ~0,75 Höhen.
// Weiter-Hinweis (Go Kai 16.11. „A + B“): im Halt füllt sich der Ring wie ein Fortschrittsbalken, die Linie kriecht weiter,
// der Strich rechts füllt sich mit (A); wer ~3 s still steht, sieht die Pille „Weiter scrollen“, die zur nächsten Station gleitet (B).
// Partikel: gl.js (Körper-Shader aus Puls, eigene Bühne). Darüber gestochen scharf als SVG: Lichtlinie, Leuchtpunkt, Ringe,
// Verbindungslinie (PC). Lösen: Finger-/Maus-Pinsel wie Puls (Zeichenfläche, Rest ≤ 8 = gelöst) oder Tippen (Welle ab Tippstelle);
// wer weiterscrollt, löst die Stelle mit der Lichtlinie.
// Übergabe an Puls (Go Kai „nahtlos“): fitE() = Lage der Figur im Schlussbild, handK() 0→1 am Ende (eigene Bühne blendet aus,
// Puls zeigt dieselbe Figur und löst sie in die Bewegungslinien auf), sway()/breath()/calm() für gleichen Atem und gleiches Wiegen.
import { STATIONS, LINES as LINES_H, lineTo, BODY_SVG, CROWN, SOLE, SPLIT as SPLIT_H, BODY_W, BODY_H, nerveSvg, brainSvg } from '../figur-plus/figur.js';
import { finePoints } from '../feinschliff/figur.js';
import { glContext, createStage as fineStage } from '../feinschliff/gl.js';
import { echtPoints } from './figur.js';
import { createStage } from './gl.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const easeIO = (t) => t * t * (3 - 2 * t);
const fmt = (n) => n.toFixed(2);
// Kreisbogen um 0|0 mit Radius r, ab 12 Uhr im Uhrzeigersinn, Anteil k (0…1); voll = zwei Halbbögen
function arcD(r, k) {
  if (k <= 0.001) return '';
  if (k >= 0.999) return `M0 ${fmt(-r)}A${fmt(r)} ${fmt(r)} 0 1 1 0 ${fmt(r)}A${fmt(r)} ${fmt(r)} 0 1 1 0 ${fmt(-r)}`;
  const a = k * Math.PI * 2;
  return `M0 ${fmt(-r)}A${fmt(r)} ${fmt(r)} 0 ${k > 0.5 ? 1 : 0} 1 ${fmt(Math.sin(a) * r)} ${fmt(-Math.cos(a) * r)}`;
}

// ---------- Fahrplan: [u, Spitze der Lichtlinie (y), Blick] – Blick 'A' = ganze Figur (Start), 'E' = ganze Figur (Schluss), 0…3 = Station ----------
// Im Halt kriecht die Linie um CREEP weiter (gleichmäßig, damit jeder kleine Wischer sichtbar etwas bewegt)
const CREEP = [8, 8, 6, 4];
// Seit 18.11.2026 (Kai: „weniger scrollen oder wischen“) rund ein Drittel kürzer: Halt je Station 0,42 statt 0,75 Bildschirmhöhen,
// Fahrt dazwischen 0,5–0,58 statt 0,75–0,95, Schluss 0,74 statt 0,85 (vorher: U_LEN 8,2, --len 9,2).
export const KEYS = [
  [0.05, CROWN, 'A'],
  [0.55, STATIONS[0].tip, 0], [0.97, STATIONS[0].tip + CREEP[0], 0],
  [1.49, STATIONS[1].tip, 1], [1.91, STATIONS[1].tip + CREEP[1], 1],
  [2.49, STATIONS[2].tip, 2], [2.91, STATIONS[2].tip + CREEP[2], 2],
  [3.49, STATIONS[3].tip, 3], [3.91, STATIONS[3].tip + CREEP[3], 3],
  [4.41, SOLE, 'E'],
];
export const U_LEN = 5.15; // Ende der Bühne (Länge der Strecke = U_LEN + 1 Bildschirmhöhe, CSS .kf --len 6.15 in fein.css)
const ARR = STATIONS.map((_, i) => KEYS[1 + 2 * i][0]), LEAVE = STATIONS.map((_, i) => KEYS[2 + 2 * i][0]);
const stOn = (i, u) => u > ARR[i] - 0.3 && u < LEAVE[i] + 0.12;
// Text der Station (18.11., Go Kai „3“): erst, wenn die Fahrt fast angekommen ist – vorher stand er über der Figur, während sie noch fuhr
const txtOn = (i, u) => u > ARR[i] - 0.06 && u < LEAVE[i] + 0.12;
const U_END = KEYS[KEYS.length - 1][0];

// old = { points, stage } (nur die Studienseite: Figur plus für den Umschalter „bisher“; Puls gibt nichts mit → kein Umschalter),
// handover = true (Puls): am Schluss ziehen sich Gehirn und Nerven zurück, die Figur steht wieder als ruhiges Raster da und
// wird an Form 0 der Hauptbühne übergeben (cloud() liefert dafür dieselben Punkte).
export function initKopfFuss({ root, isPaused = () => false, reduced = false, data = null, stufe = null, handover = false, scrollTo = (y, smoothly) => window.scrollTo({ top: y, behavior: smoothly ? 'smooth' : 'auto' }) }) {
  const $ = (s, r = root) => r.querySelector(s);
  const $$ = (s, r = root) => [...r.querySelectorAll(s)];
  const finePointer = matchMedia('(pointer: fine)').matches;
  const still = () => reduced || isPaused(); // keine Fahrt (Figur bleibt ganz), Texte ohne Blenden
  let dirty = true, lastStill = null;

  // ---------- Elemente ----------
  const stage = $('.kf-sticky'), canvas = $('.kf-gl'), canvasOld = $('.kf-gl-alt'), svg = $('.kf-svg');
  const Q = new URLSearchParams(location.search);
  const TILT = Q.has('neigung') ? clamp(+Q.get('neigung') || 0, 0, 0.4) : 0.16; // Zeilen leicht von oben gesehen (Bögen)
  const RING = Q.get('zeichen') === 'ring' ? 1 : 0;
  const TEXT_FEIN = Q.get('text') !== 'bisher';
  // Vergleich Startfigur (25.11.2026, Kai: „irgendwas passt noch nicht“; Seite figur-wahl.html): ?start=b aufgeräumt (Muskel-Schimmer nur
  // an der aktiven Stelle, Tiefe im Rumpf, kleiner Startpunkt) · c dazu Boden und leicht gedreht · d dazu Auftritt mit Scan-Linie
  // 25.11. morgens (Kai: „C wegen Drehung gut … innere Strukturen zu wenig sichtbar, am Handy liegt der Finger auf der Lupe“):
  // e Glaskörper (Innenleben dauerhaft) · f halb Haut, halb Innenleben · g Haut und Innenleben im ruhigen Wechsel – alle auf Basis von C,
  // Lupe auch hier, am Handy steht sie über dem Finger
  const START = ['b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'].includes(Q.get('start')) ? Q.get('start') : '';
  const INNEN = 'efgijkl'.includes(START) && START !== '';
  // k (Kai 25.11. 11:21, mit Film eines Punkte-Gehirns): Start wie J; beim ersten Scrollen fährt der Blick ins Gehirn, die vier Texte
  // gehören dort zu vier Arealen (das Gehirn dreht sich von einem zum nächsten) – keine Fahrt den Körper hinunter
  const HIRN = START === 'k';
  const AREALE = [ // Name, Blickrichtung (Drehung um die Hochachse), Mitte im Gehirn (−1…1: rechts, oben, vorn), Radius (Anteil der Breite)
    ['Hören · Schläfenlappen', -1.15, [0.8, -0.32, 0.22], 0.34], ['Denken · Stirnlappen', -0.3, [0.3, 0.3, 0.8], 0.38],
    ['Bewegung · Scheitellappen', 0.75, [-0.4, 0.6, -0.05], 0.36], ['Gleichgewicht · Kleinhirn', 2.6, [-0.15, -0.72, -0.7], 0.34]];
  let HB = null; // Maße des Gehirns (nach dem Laden): Mitte, halbe Ausdehnung, Areale in Körpermaßen // j (Kai 25.11. 11:17): Übersicht nur feines Relief, Röntgenblick mit Innenleben erst beim Heranzoomen an die Station // i (Kai 25.11.: „H und E kombinieren“): feines Relief als halb durchsichtige Hülle über dem Innenleben
  // h (Kai: „auch das Äußere dürfte anatomischer sein“): feines Raster schon in der Übersicht + kräftiges Licht von vorn links (Relief)
  const VAR = { quiet: START ? 1 : 0, light: 'hijkl'.includes(START) && START ? 0.9 : START ? 0.5 : 0, dense: 'hijkl'.includes(START) && START ? 1 : 0, glass: START === 'i' ? 0.62 : START === 'j' || START === 'l' ? 0.82 : 0.9, zoomIn: START === 'j' || START === 'k' || START === 'l', shell: START === 'l' ? 1 : 0, ground: START && START !== 'b' ? 1 : 0, turn: START && START !== 'b' ? 0.3 : 0, scanIn: START === 'd' ? 1 : 0,
    inner: START === 'e' || START === 'f' || START === 'i' ? 1 : 0, half: START === 'f' ? 1 : 0, cycle: START === 'g', lens: INNEN ? 1 : 0, lift: INNEN ? 78 : 0 };
  if (START) document.documentElement.dataset.start = START;
  if (Q.has('start')) { // Umschalter für den Vergleich: bleibt unten im Bild, solange man mit ?start= auf der Seite ist
    const nav = document.createElement('nav'); nav.setAttribute('aria-label', 'Startfigur vergleichen');
    nav.style.cssText = 'position:fixed;z-index:60;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + .75rem);transform:translateX(-50%);display:flex;gap:.25rem;padding:.25rem;border-radius:2rem;background:rgba(10,22,27,.92);border:1px solid rgba(255,255,255,.18);font:600 .8125rem/1 system-ui,sans-serif';
    const NAMEN = { a: 'heute', b: 'ruhig', c: 'Boden, gedreht', d: 'Auftritt', e: 'Glaskörper', f: 'halb und halb', g: 'im Wechsel', h: 'feines Relief', i: 'Relief + innen', j: 'Relief, Röntgen nah', k: 'ins Gehirn', l: 'Muskelfigur' };
    [['a', 'A'], ['b', 'B'], ['c', 'C'], ['d', 'D'], ['e', 'E'], ['f', 'F'], ['g', 'G'], ['h', 'H'], ['i', 'I'], ['j', 'J'], ['k', 'K'], ['l', 'L']].forEach(([k, t]) => { const l = document.createElement('a'); l.href = `?start=${k}`; const on = (START || 'a') === k; l.textContent = on ? `${t} ${NAMEN[k]}` : t; l.style.cssText = `padding:.625rem .44rem;border-radius:2rem;text-decoration:none;white-space:nowrap;color:${on ? '#1B1206' : '#E4E3D8'};background:${on ? '#E8A33D' : 'transparent'}`; if (on) l.setAttribute('aria-current', 'true'); nav.appendChild(l); });
    document.body.appendChild(nav);
  }
  const shade = $('.kf-shade'), bodyG = $('.kf-bodyg'), heroEl = $('.kf-hero'), endEl = $('.kf-end'), wire = $('.kf-wire'), hand = $('.kf-hand');
  const lineEls = [0, 1, 2].map((i) => [$(`.kf-l${i}`), $(`.kf-l${i}g`)]);
  const lineG = $('.kf-lines');
  const arts = $$('.kf-st'), dos = arts.map((a) => $('.kf-do', a)), spots = $$('.kf-spot'), progBtns = $$('.kf-prog button');
  const nextBtn = $('.kf-next'), progEl = $('.kf-prog');
  let topMode = false; const TXT = { head: 0, txt: 0 }; // Handy im Stil „neu“: Unterkante der Überschriften / Oberkante der Texte
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, cls, parent) => { const e = document.createElementNS(NS, tag); if (cls) e.setAttribute('class', cls); parent.appendChild(e); return e; };
  $('.kf-shape').innerHTML = BODY_SVG;
  const dotPat = $('.kf-dots'), dotC = $('circle', dotPat); let dotK = 0;
  const rings = STATIONS.map(() => {
    // je Station eine Gruppe, die verschoben wird (Kreise bleiben bei 0|0): Chrome berechnet das Neuzeichnen verschobener
    // Strich-Kreise sonst zu klein, und beim Zoomen bleiben alte Bögen stehen
    const g = mk('g', '', $('.kf-rings'));
    const halo = mk('circle', 'kf-ring-halo', g), ring = mk('path', 'kf-ring', g), prog = mk('path', 'kf-ring-prog', g);
    return { g, ring, halo, prog };
  });
  const tips = [0, 1].map(() => { const g = mk('g', '', $('.kf-tips')); const glow = mk('circle', 'kf-tip-glow', g), halo = mk('circle', 'kf-tip-halo', g), dot = mk('circle', 'kf-tip', g); glow.setAttribute('r', START ? 0 : 9); halo.setAttribute('r', START ? 4.5 : 6); dot.setAttribute('r', 3.25); return g; });
  // ohne WebGL: Spannung als Leuchten (Bernstein) bzw. gelöst (Grün) über dem Punkt-Umriss
  const glows = STATIONS.map((St) => St.spots.map((sp) => {
    const g = $('.kf-glow');
    const hot = mk('ellipse', '', g), cool = mk('ellipse', '', g);
    [hot, cool].forEach((e) => { e.setAttribute('cx', sp[0]); e.setAttribute('cy', sp[1]); e.setAttribute('rx', sp[2] * 1.45); e.setAttribute('ry', sp[3] * 1.45); });
    hot.setAttribute('fill', 'url(#kfHot)'); cool.setAttribute('fill', 'url(#kfCool)');
    return { hot, cool };
  }));
  const HINT = finePointer ? 'Fahren Sie mit der Maus über die Stelle – oder scrollen Sie einfach weiter.' : 'Tippen oder streichen Sie über die Stelle – oder scrollen Sie einfach weiter.';
  dos.forEach((d) => { d.textContent = HINT; });

  // ---------- Maße und Blicke ----------
  let W = 0, H = 0, desk = true, dpr = 1;
  const V = {};
  function layout() {
    W = stage.clientWidth; H = stage.clientHeight; desk = W > 920;
    if (!W || !H) return;
    const topH = desk ? 84 : 70, figH = SOLE - CROWN;
    // k < 1: Figur kleiner, lo > .5: sie rückt im freien Raum nach unten (21.11.2026, Go Kai 1c: Schlussbild am Handy – Kopf frei unter der Überschrift)
    const full = (bottom, top = topH, k = 1, lo = 0.5) => {
      const s = Math.min((bottom - top) / figH, (desk ? W * 0.34 : W * 0.86) / BODY_W) * k;
      const ax = desk ? W * 0.23 : W / 2;
      const ay = top + ((bottom - top) - figH * s) * lo + (BODY_H / 2 - CROWN) * s;
      return { fx: 0, fy: 0, s, ax, ay };
    };
    // Handy: die Figur endet über dem jeweiligen Textblock (Start bzw. Schluss); ohne Fahrt über dem höchsten Stationstext
    const artTop = arts.reduce((m, a) => Math.min(m, a.offsetTop), H);
    const heroTop = heroEl.offsetTop, endTop = endEl.offsetTop;
    // Handy/Tablet im Stil „neu“ (18.11., Kai: „Überschriften nach oben, Animationen sowie Texte erst darunter“): jeder Textblock
    // füllt die Bühne – Überschrift oben, Text unten (fein.css) –, die Figur steht dazwischen. Gemessen wird deshalb zwischen
    // der Unterkante der Überschrift und der Oberkante des Textes.
    topMode = !desk && root.classList.contains('kf-fein');
    let stAy = H * 0.34;
    if (topMode) {
      const bot = (blk, sel) => { const e = $(sel, blk); return blk.offsetTop + e.offsetTop + e.offsetHeight; }, top = (blk, sel) => { const e = $(sel, blk); return blk.offsetTop + e.offsetTop; };
      const hBot = Math.max(...arts.map((a) => bot(a, 'h2'))), tTop = Math.min(...arts.map((a) => top(a, '.kf-txt')));
      TXT.head = hBot; TXT.txt = tTop;
      V.A = full(top(heroEl, '.kf-sub') - 16, bot(heroEl, 'h1') + 12);
      V.E = full(top(endEl, '.kf-txt') - 16, bot(endEl, 'h2') + 28, 0.88, 0.72);
      V.S = full(Math.min(tTop, top(heroEl, '.kf-sub'), top(endEl, '.kf-txt')) - 18, Math.max(hBot, bot(heroEl, 'h1'), bot(endEl, 'h2')) + 12);
      stAy = (hBot + tTop) / 2;
      if (progEl) progEl.style.top = `${Math.round(stAy)}px`;
    } else {
      if (progEl) progEl.style.top = '';
      V.A = desk ? full(H * 0.93) : full(heroTop - 18);
      V.E = desk ? V.A : full(endTop - 18);
      V.S = desk ? V.A : full(Math.min(heroTop, endTop, artTop) - 22);
    }
    const sRef = desk ? V.A.s : (H * 0.5) / figH; // Handy: Zoom unabhängig von der Texthöhe
    STATIONS.forEach((St, i) => {
      V[i] = { fx: St.c[0] - BODY_W / 2, fy: BODY_H / 2 - St.c[1], s: sRef * St.zoom[desk ? 1 : 0], ax: desk ? W * 0.23 : W / 2, ay: desk ? H * 0.5 : stAy };
    });
    if (HIRN && HB) { // Blick je Areal: Gehirn füllt die Bühne, das Areal steht in der Bildmitte
      const sB = Math.min((desk ? W * 0.34 : W * 0.74) / (2 * Math.max(HB.h[0], HB.h[2])), (desk ? H * 0.6 : (TXT.txt - TXT.head || H * 0.5) * 0.74) / (2 * HB.h[1]));
      HB.ar.forEach((A, i) => { const cw = Math.cos(A.yaw), sw = Math.sin(A.yaw), k = 0.12; // Areal nur halb zur Mitte gerückt: das ganze Gehirn bleibt im Bild
        V[i] = { fx: cw * (HB.c[0] + (A.p[0] - HB.c[0]) * k) + sw * (HB.c[2] + (A.p[2] - HB.c[2]) * k), fy: HB.c[1] + (A.p[1] - HB.c[1]) * k - HB.c[2] * TILT, s: sB, ax: V[i].ax, ay: V[i].ay, yaw: A.yaw }; });
      V.A.yaw = VAR.turn; V.S.yaw = 0; V.E.yaw = 0;
    }
    dpr = Math.min(devicePixelRatio || 1, 2);
    if (gl) {
      const cw = Math.round(W * dpr), ch = Math.round(H * dpr);
      if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
      if (stOld && (canvasOld.width !== cw || canvasOld.height !== ch)) { canvasOld.width = cw; canvasOld.height = ch; }
    }
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    dirty = true; lastTipKey = ''; lastOn = '';
  }
  // Texthöhen ändern sich nach dem ersten Layout noch (Schrift fertig geladen, Umschalter bisher/neu) → neu messen,
  // sonst steht die Figur am Handy in der Überschrift
  if (window.ResizeObserver) { const ro = new ResizeObserver(() => { H = 0; }); [heroEl, endEl, ...arts, ...$$('h1,h2,.kf-txt,.kf-sub', root)].forEach((e) => ro.observe(e)); }
  document.fonts?.ready.then(() => { H = 0; });
  const mixView = (a, b, t, dip = 0) => {
    const s = Math.exp(lerp(Math.log(a.s), Math.log(b.s), t)) * (1 - dip * Math.sin(Math.PI * t));
    return { fx: lerp(a.fx, b.fx, t), fy: lerp(a.fy, b.fy, t), s, ax: lerp(a.ax, b.ax, t), ay: lerp(a.ay, b.ay, t), yaw: lerp(a.yaw || 0, b.yaw || 0, t) };
  };
  function plan(u) {
    if (still()) { // keine Fahrt: Figur bleibt ganz, nur die Linie wächst mit dem Scrollen
      const k = KEYS.findIndex((x) => x[0] > u);
      let tip = SOLE;
      if (k === 0) tip = CROWN; else if (k > 0) { const a = KEYS[k - 1], b = KEYS[k]; tip = lerp(a[1], b[1], clamp((u - a[0]) / (b[0] - a[0]))); }
      return { tip, view: u < 0.5 ? V.A : u > U_END - 0.2 ? V.E : V.S };
    }
    if (u <= KEYS[0][0]) return { tip: KEYS[0][1], view: V[KEYS[0][2]] };
    for (let k = 0; k < KEYS.length - 1; k++) {
      const a = KEYS[k], b = KEYS[k + 1];
      if (u > b[0]) continue;
      const t = (u - a[0]) / (b[0] - a[0]), e = easeIO(t);
      const hold = a[2] === b[2], travel = typeof a[2] === 'number' && typeof b[2] === 'number' && !hold;
      return { tip: lerp(a[1], b[1], hold ? t : e), view: hold ? V[a[2]] : mixView(V[a[2]], V[b[2]], e, travel ? 0.14 : 0) };
    }
    const L = KEYS[KEYS.length - 1];
    return { tip: L[1], view: V[L[2]] };
  }

  // ---------- Partikel ----------
  // Zeichenfläche „Entspannung“ (wie Puls: 100 × 215 für den Grundriss 200 × 430, weiß = gelöst)
  const RW = 100, RH = 215;
  const relaxCv = document.createElement('canvas'); relaxCv.width = RW; relaxCv.height = RH;
  const rctx = relaxCv.getContext('2d', { willReadFrequently: true });
  rctx.fillStyle = '#000'; rctx.fillRect(0, 0, RW, RH);
  let relaxDirty = true, measureDirty = false;
  let gl = glContext(canvas), st = null, pts = null;
  // Punktabstand: in der Übersicht liegen die Haut-Punkte rund 2,8 (Handy 2,5) Bildpunkte auseinander (wie heute)
  const big = innerWidth > 920, figH0 = SOLE - CROWN;
  const sA0 = big ? Math.min((innerHeight * 0.93 - 84) / figH0, innerWidth * 0.34 / BODY_W) : Math.min((innerHeight * 0.6 - 88) / figH0, innerWidth * 0.86 / BODY_W);
  const SP = Q.has('abstand') ? clamp(+Q.get('abstand') || 1.6, 0.9, 4) : clamp((big ? 2.7 : 2.4) / Math.max(0.5, sA0), 1.15, 2.6);
  // Aufbau der Bühne erst, wenn die Daten da sind (Puls lädt sie nach dem Start – bis dahin bleibt die Zeichenfläche leer im Seitengrund)
  let echt = false, buildMs = 0;
  if (gl) { gl.clearColor(10 / 255, 22 / 255, 27 / 255, 1); gl.clear(gl.COLOR_BUFFER_BIT); }
  pts = finePoints({ sp: 3, dust: 0 }); // bis dahin (und ohne WebGL) nur zum Messen
  function build(d) {
    const t0 = performance.now();
    if (gl) try {
      if (d) { // echte Figur
        pts = echtPoints({ sp: SP, dust: big ? 26 : 14, data: d, detail: !!VAR.dense, hirn: HIRN, shell: !!VAR.shell });
        if (HIRN && pts.brain && pts.brain[0][0] < 1e8) {
          const B = pts.brain, c = B.map((r) => (r[0] + r[1]) / 2), h = B.map((r) => (r[1] - r[0]) / 2);
          HB = { c, h, ar: AREALE.map(([name, yaw, q, r]) => ({ name, yaw, p: q.map((v, k) => c[k] + v * h[k]), r: r * 2 * h[0] })) };
          arts.forEach((a, i) => { const k = $('.kicker', a); if (k && HB.ar[i]) k.innerHTML = `<i>0${i + 1}</i> ${HB.ar[i].name}`; });
          H = 0; // Blicke neu rechnen
        }
        st = createStage(gl, pts, relaxCv, document.documentElement.dataset.deep || '#3F86B5');
        echt = true; GEO.echt = { LINES: pts.lines, SPLIT: pts.split };
      } else { // Daten fehlen (oder ?figur=heute in Puls): die Figur von heute
        pts = finePoints({ sp: SP, dust: big ? 26 : 14 });
        st = fineStage(gl, pts, relaxCv, document.documentElement.dataset.deep);
      }
    } catch (e) { console.error(e); st = null; echt = false; if (d) return build(null); }
    buildMs = Math.round(performance.now() - t0);
    if (!st) pts = finePoints({ sp: 3, dust: 0 });
  }
  // Farbstufe (Puls, 22.11.2026): Körperfarbe aus html[data-deep], Wechsel auf der Vergleichsseite per Ereignis „hop-farbe“
  document.addEventListener('hop-farbe', () => { if (st) st.setDeep(document.documentElement.dataset.deep); });
  if (!gl) root.classList.add('kf-nogl');
  // Leuchtpunkt: echte Figur folgt Rückenmark → Ischias (aus den Daten), „heute“ wie gehabt
  const GEO = { heute: { LINES: LINES_H, SPLIT: SPLIT_H }, echt: { LINES: LINES_H, SPLIT: SPLIT_H } };
  // Stationen für den Shader (Mitte in Körper-Koordinaten, Radius)
  const STC = new Float32Array(STATIONS.flatMap((St) => [St.c[0] - BODY_W / 2, BODY_H / 2 - St.c[1], St.r]));
  // „heute“: Figur von Puls (../feinschliff), eigene Zeichenfläche darunter; erst beim ersten Umschalten gebaut (Startzeit, Speicher)
  let stOld = null, oldTried = false, ptsOld = null;
  function ensureOld() {
    if (stOld || oldTried || !gl || !canvasOld) return !!stOld;
    oldTried = true;
    try {
      const g = glContext(canvasOld);
      if (g) { ptsOld = finePoints({ sp: SP, dust: big ? 26 : 14 }); stOld = fineStage(g, ptsOld, relaxCv, document.documentElement.dataset.deep); H = 0; }
    } catch (e) { console.error(e); stOld = null; }
    return !!stOld;
  }
  // Stufe: heute | echt (1) | kino (1+2); mixK 1 = echte Figur sichtbar, 0 = heute; kinoK 0…1 weich
  const want0 = stufe || Q.get('stil');
  let mode = want0 === 'heute' || want0 === 'echt' ? want0 : 'kino', mixK = 1, kinoK = mode === 'kino' ? 1 : 0;
  function setStyle(v) {
    if (!gl || !echt) return false;
    if (v === 'heute' && !ensureOld()) return false;
    if (v !== 'heute' && mode === 'heute' && !still()) introTo(0.34, 1500); // die echte Figur sammelt sich beim Umschalten noch einmal
    mode = v; dirty = true; relaxDirty = true;
    root.classList.toggle('kf-fein', TEXT_FEIN);
    return true;
  }
  // Zeiger (Maus/Finger): Lage in Bildpunkten der Bühne, weich nachgeführt; k = Stärke 0…1
  const PT = { x: 0, y: 0, tx: 0, ty: 0, k: 0, want: 0, has: false }, PTR = new Float32Array([0, 0, 12, 0]);
  const point = (x, y) => { PT.tx = x; PT.ty = y; PT.want = 1; if (!PT.has || PT.k < 0.02) { PT.x = x; PT.y = y; PT.has = true; } dirty = true; };
  // Ohne WebGL: Gehirn und Nerven als gepunktete Linien (erscheinen mit der Lichtspitze), Hauptbahn wächst wie bisher
  let nerveEls = null, brainG = null;
  if (!gl) {
    const ng = $('.kf-nerves');
    nerveEls = nerveSvg().filter((n) => !n.main).map((n) => { const e = mk('path', 'kf-nerve', ng); e.setAttribute('d', n.d); e.setAttribute('opacity', 0); return { e, ry0: n.ry0, ry1: Math.min(n.ry1, n.ry0 + 16), o: '' }; });
    brainG = $('.kf-brain');
    brainSvg().forEach((d) => mk('path', '', brainG).setAttribute('d', d));
  }
  const CORD0 = [[100, 38], [100, SPLIT_H]]; // Hauptbahn ab dem Hirnstamm (ohne WebGL als Linie)

  // Messpunkte je Station: die Partikel selbst (nur was im Körper liegt zählt), Gewicht = ihre Spannung; je Texel zusammengefasst
  let SAMPLES = [];
  const buildSamples = () => { SAMPLES = STATIONS.map((_, si) => {
    const m = new Map();
    for (let i = 0; i < pts.st.length; i++) {
      if (pts.st[i] !== si || pts.heat[i] < 0.08) continue;
      const x = clamp(Math.floor((pts.pos[i * 3] + BODY_W / 2) / 2), 0, RW - 1), y = clamp(Math.floor((BODY_H / 2 - pts.pos[i * 3 + 1]) / 2), 0, RH - 1);
      const o = (y * RW + x) * 4; m.set(o, (m.get(o) || 0) + pts.heat[i]);
    }
    return [...m];
  }); };
  buildSamples();

  // ---------- Zustand ----------
  const S = {
    u: 0, us: 0, tip: CROWN, view: null, time: 0, breath: 0, calm: 0, intro: still() ? 1 : 0, sway: 0, cur: -1, hold: 0, idle: 0, lastU: -1,
    act: [0, 0, 0, 0], draw: [0, 0, 0, 0], auto: [0, 0, 0, 0], sol: [0, 0, 0, 0], done: [false, false, false, false], rest: [1, 1, 1, 1], ok: [false, false, false, false],
  };
  const relV = new Float32Array(4), actV = new Float32Array(4);

  // Spannung je Station messen (Rest 0…1); ≤ 0,08 = gelöst (Puls 16.11.: „Rest ≤ 8“). Weiß ab ~215 von 255 gilt als gelöst:
  // die 8-Bit-Fläche nähert sich 255 nur langsam, und im Shader ist die Stelle dort schon sichtbar ruhig.
  function measure() {
    const d = rctx.getImageData(0, 0, RW, RH).data;
    SAMPLES.forEach((list, i) => {
      let s = 0, w = 0;
      list.forEach(([o, k]) => { s += k * Math.max(0, 1 - d[o] / 215); w += k; });
      S.rest[i] = w ? s / w : 0;
      if (S.rest[i] <= 0.08) solve(i);
    });
  }
  function solve(i) {
    if (S.done[i]) return;
    S.done[i] = true; S.idle = Math.max(S.idle, 1.8); // gelöst: der Hinweis „Weiter“ kommt gleich danach
    const t0 = performance.now(), dur = still() ? 0 : 1100;
    const step = () => { S.sol[i] = dur ? easeIO(clamp((performance.now() - t0) / dur)) : 1; dirty = true; if (S.sol[i] < 1) requestAnimationFrame(step); };
    step();
    dos[i].textContent = 'Gelöst.'; dos[i].classList.add('ok');
  }

  // Pinsel: Bildschirm → Grundriss → Zeichenfläche (Radius in Bildpunkten, damit es sich bei jedem Zoom gleich anfühlt)
  let lastPaint = null;
  const toBody = (x, y, v) => [BODY_W / 2 + ((x - v.ax) / v.s + v.fx), BODY_H / 2 - ((v.ay - y) / v.s + v.fy)];
  function paint(x, y, rPx, alpha) {
    const v = S.view; if (!v) return;
    const [bx, by] = toBody(x, y, v);
    const px = bx / 2, py = by / 2, r = Math.max(2.5, rPx / v.s / 2);
    const steps = lastPaint ? Math.ceil(Math.hypot(px - lastPaint[0], py - lastPaint[1]) / Math.max(1, r * 0.35)) : 1;
    for (let s = 1; s <= Math.min(steps, 60); s++) {
      const cx = lastPaint ? lerp(lastPaint[0], px, s / steps) : px, cy = lastPaint ? lerp(lastPaint[1], py, s / steps) : py;
      const g = rctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(255,255,255,${alpha})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      rctx.fillStyle = g; rctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    lastPaint = [px, py];
    relaxDirty = true; measureDirty = true; dirty = true; S.idle = 0;
  }
  const ringPx = STATIONS.map(() => [0, 0, 0]);
  // Ring unter dem Zeiger (nur aktive, noch nicht gelöste Station)
  const ringAt = (x, y) => STATIONS.findIndex((St, i) => stOn(i, S.us) && !S.ok[i] && Math.hypot(x - ringPx[i][0], y - ringPx[i][1]) < ringPx[i][2] * 1.1);
  const local = (e) => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  // Maus: Überfahren löst (wie Puls), Hand-Kreis „lösen“ nur über der Stelle
  stage.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const [x, y] = local(e), i = ringAt(x, y);
    point(x, y);
    hand.classList.toggle('on', i >= 0 && finePointer);
    if (i < 0) { lastPaint = null; return; }
    hand.style.transform = `translate(${x}px,${y}px)`;
    paint(x, y, 42, 0.3);
  });
  stage.addEventListener('pointerleave', () => { hand.classList.remove('on'); lastPaint = null; PT.want = 0; });
  // Finger: die Punkte unter dem Finger antworten – auch beim Scrollen (nur zuhören, nichts aufhalten)
  const fingerAt = (e) => { if (e.touches.length) { const [x, y] = local(e.touches[0]); point(x, y - VAR.lift); } }; // e–g: Lupe steht über dem Finger
  stage.addEventListener('touchstart', fingerAt, { passive: true });
  stage.addEventListener('touchmove', fingerAt, { passive: true });
  const fingerOff = () => { PT.want = 0; };
  addEventListener('touchend', fingerOff, { passive: true }); addEventListener('touchcancel', fingerOff, { passive: true });
  // Finger: nur, wenn der Strich auf der markierten Stelle beginnt – senkrechtes Wischen scrollt trotzdem weiter
  let fingerOn = -1;
  spots.forEach((b, i) => b.addEventListener('touchstart', () => { fingerOn = i; lastPaint = null; }, { passive: true }));
  addEventListener('touchmove', (e) => { if (fingerOn < 0 || !e.touches.length) return; const [x, y] = local(e.touches[0]); paint(x, y, 54, 0.42); }, { passive: true });
  addEventListener('touchend', () => { fingerOn = -1; lastPaint = null; }, { passive: true });
  addEventListener('touchcancel', () => { fingerOn = -1; lastPaint = null; }, { passive: true });
  // Tippen / Klicken / Taste: eine Welle der Entspannung breitet sich ab der Tippstelle aus und löst die Stelle
  const ripples = [];
  spots.forEach((b, i) => b.addEventListener('click', (e) => {
    if (S.done[i]) return;
    const [x, y] = e.detail && (e.clientX || e.clientY) ? local(e) : [ringPx[i][0], ringPx[i][1]];
    const [bx, by] = toBody(x, y, S.view);
    ripples.push({ i, x: bx / 2, y: by / 2, t0: performance.now() });
  }));
  function rippleTick(now) {
    for (let k = ripples.length - 1; k >= 0; k--) {
      const r = ripples[k], St = STATIONS[r.i], t = clamp((now - r.t0) / (still() ? 1 : 850));
      const R = (St.r * 1.15 / 2) * (1 - (1 - t) * (1 - t));
      const g = rctx.createRadialGradient(r.x, r.y, R * 0.55, r.x, r.y, Math.max(1, R));
      g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      rctx.fillStyle = g; rctx.beginPath(); rctx.arc(r.x, r.y, Math.max(1, R), 0, Math.PI * 2); rctx.fill();
      rctx.fillStyle = 'rgba(255,255,255,.5)'; rctx.beginPath(); rctx.arc(r.x, r.y, R * 0.55, 0, Math.PI * 2); rctx.fill();
      relaxDirty = true; measureDirty = true; dirty = true;
      if (t >= 1) { ripples.splice(k, 1); solve(r.i); }
    }
  }
  setInterval(() => { if (measureDirty) { measureDirty = false; measure(); } }, 250);

  // Fortschritt: Strich anklicken → zur Station; Pille „Weiter“ → zur nächsten Station bzw. zum Schluss
  const trackTop = () => root.getBoundingClientRect().top + scrollY;
  const goU = (u) => scrollTo(trackTop() + u * H, !still());
  progBtns.forEach((b, i) => b.addEventListener('click', () => goU((ARR[i] + LEAVE[i]) / 2)));
  nextBtn?.addEventListener('click', () => {
    const i = STATIONS.findIndex((_, k) => S.us < LEAVE[k] - 0.02);
    goU(i < 0 || S.us > ARR[3] ? U_END + 0.1 : S.us < ARR[i] - 0.3 ? (ARR[i] + LEAVE[i]) / 2 : i < 3 ? (ARR[i + 1] + LEAVE[i + 1]) / 2 : U_END + 0.1);
    S.idle = -4; // nach dem Klick nicht gleich wieder zeigen
  });

  // ---------- Einflug ----------
  // „neu“: die Figur sammelt sich von Kopf bis Fuß (uIntro im Shader), ruhig in gut 3 s; „bisher“: Einflug aus der Tiefe wie gehabt
  let introRun = 0;
  function introTo(from, ms) {
    const id = ++introRun, t0 = performance.now(); S.intro = from;
    const f = () => { if (id !== introRun) return; const t = clamp((performance.now() - t0) / ms); S.intro = from + (1 - from) * (1 - Math.pow(1 - t, 2.4)); dirty = true; if (t < 1) requestAnimationFrame(f); else S.intro = 1; };
    requestAnimationFrame(f);
  }
  root.classList.toggle('kf-fein', TEXT_FEIN);
  let ready = false; const readyFns = [];
  const finish = (d) => {
    build(d); buildSamples();
    if (!echt) mode = 'heute';
    kinoK = mode === 'kino' ? 1 : 0;
    if (mode === 'heute' && echt) { if (ensureOld()) mixK = 0; else { mode = 'kino'; kinoK = 1; } }
    if (st && !still()) introTo(0, VAR.scanIn ? 4600 : 3200); else S.intro = 1;
    dirty = true; relaxDirty = true; H = 0; ready = true;
    readyFns.splice(0).forEach((f) => f());
  };
  // data: Objekt (schon geladen), Promise, oder Funktion, die erst mit WebGL lädt (Puls); null = Figur von heute
  { const d = typeof data === 'function' ? (gl ? data() : null) : data;
    if (d && typeof d.then === 'function') d.then(finish, (e) => { console.error(e); finish(null); }); else finish(d); }

  // ---------- Bild für Bild (vom Gastgeber aufgerufen) ----------
  let lastT = performance.now(), lastTipKey = '', lastOn = '', hk = 0, stageTop = 0, lastLineO = '';
  function update(now) {
    const dt = Math.min(0.1, Math.max(0, (now - lastT) / 1000)); lastT = now;
    const r = root.getBoundingClientRect();
    stageTop = r.top > 0 ? r.top : Math.min(0, r.bottom - (H || innerHeight)); // Lage der klebenden Bühne (für die Übergabe an Puls)
    if (r.bottom < -50 || r.top > innerHeight + 50) { // Bühne nicht im Bild: ruht
      hand.classList.remove('on');
      // liegt die Bühne über dem Fenster, ist sie fertig übergeben (18.11.: seit dem Kapitel-Auftakt grenzt Kapitel 02 nicht mehr
      // direkt an – nach einem Sprung blieb hk sonst bei 0 stehen und die Punktwolke der Seite unsichtbar)
      if (r.bottom < -50) { hk = 1; S.u = S.us = U_LEN; }
      return;
    }
    if (!H || stage.clientHeight !== H || stage.clientWidth !== W) layout();
    if (!H) return;
    const sl = still(), paused = isPaused();
    if (sl !== lastStill) { lastStill = sl; root.classList.toggle('kf-still', sl); dirty = true; lastOn = ''; }
    S.u = clamp(-r.top / H, 0, U_LEN);
    const prevUs = S.us;
    S.us = sl ? S.u : S.us + (S.u - S.us) * (1 - Math.exp(-dt * 4.2));
    if (Math.abs(S.us - S.u) < 1e-4) S.us = S.u;
    const u = S.us;
    if (!paused) { S.time += dt * (reduced ? 0.45 : 1); S.breath += dt * (reduced ? 0.45 : 1) * (1.15 - S.calm * 0.45); }
    S.calm += (smooth(U_END - 0.6, U_END, u) - S.calm) * Math.min(1, dt * 0.8);
    // still stehen (für die Pille „Weiter“): Zeit seit der letzten Scroll-Bewegung
    if (Math.abs(S.u - S.lastU) > 0.002) { S.idle = Math.min(S.idle, 0); S.lastU = S.u; }
    S.idle += dt;
    rippleTick(now);
    const P = plan(u); S.tip = P.tip; S.view = P.view;
    const v = P.view;
    // Stationen: aktiv, von der Linie gelöst, Zustand
    let cur = -1;
    STATIONS.forEach((St, i) => {
      const on = stOn(i, u);
      if (on) cur = i;
      S.act[i] += ((on ? 1 : 0) - S.act[i]) * (sl ? 1 : Math.min(1, dt * 3));
      S.draw[i] = on ? (sl ? 1 : Math.min(1, S.draw[i] + dt / 1.2)) : 0; // Ring legt sich in 1,2 s um die Stelle
      const t0 = St.tip + CREEP[i] + 2; // erst nach dem Kriechen im Halt
      S.auto[i] = smooth(t0, Math.max(t0 + 6, St.tip + Math.min(St.r * 0.9, SOLE - St.tip - 1)), S.tip);
      relV[i] = Math.max(S.auto[i], S.sol[i]); actV[i] = S.act[i];
      S.ok[i] = S.done[i] || S.auto[i] > 0.5;
    });
    S.cur = cur;
    // Am Ende der Strecke blendet die eigene Bühne aus (handK); das Nervensystem bleibt bis dahin stehen
    // (im Baustein zieht sich die Lichtlinie vorher zurück – für die Übergabe an Puls; hier gibt es keine Übergabe)
    hk = smooth(U_LEN - 0.35, U_LEN - 0.05, u);
    const lineK = handover ? 1 - smooth(U_LEN - 0.55, U_LEN - 0.22, u) : 1;
    // Wiegen + Atem (wie Puls), gleiche Werte für Partikel und SVG
    const sway = (sl ? 0 : Math.sin(S.time * 0.25) * (HIRN ? 0.07 : 0.12)) + (HIRN && HB ? (v.yaw || 0) : VAR.turn * (1 - smooth(0.02, 0.5, u))); S.sway = sway; // ?start=c|d: am Start leicht gedreht, dreht sich mit dem ersten Scrollen nach vorn
    const br = Math.sin(S.breath) * (1 + S.calm * 1.3), kx = 1 + br * 0.007, ky = 1 + br * 0.004, cx = kx * Math.cos(sway);
    const M = [v.s * cx, v.s * ky, v.ax - (BODY_W / 2 * cx + v.fx) * v.s, v.ay - (BODY_H / 2 * ky - v.fy) * v.s]; // Grundriss → Bildschirm
    const toS = (bx, by) => [M[0] * bx + M[2], M[1] * by + M[3]];
    // Partikel
    // Umschalter: die echte Figur liegt oben und blendet über „heute“ (beide deckend → echtes Überblenden); Stufe 1 ↔ 1+2 im Shader
    const mixWas = mixK, kinoWas = kinoK, mixTo = mode === 'heute' && echt ? 0 : 1, kinoTo = mode === 'kino' ? 1 : 0;
    if (mixK !== mixTo) { mixK = sl ? mixTo : mixTo > mixK ? Math.min(1, mixK + dt / 1.1) : Math.max(0, mixK - dt / 1.1); dirty = true; }
    if (kinoK !== kinoTo) { kinoK = sl ? kinoTo : kinoTo > kinoK ? Math.min(1, kinoK + dt / 1.4) : Math.max(0, kinoK - dt / 1.4); dirty = true; }
    const mixE = easeIO(mixK);
    canvas.style.opacity = hk > 0 || mixE < 1 ? fmt((1 - hk) * mixE) : '';
    if (stOld) { canvasOld.style.opacity = hk > 0 ? fmt(1 - hk) : ''; canvasOld.style.visibility = mixK < 1 ? 'visible' : 'hidden'; }
    // Zeiger weich nachführen (auch bei „angehalten“: direkte Antwort auf die Hand, keine eigene Bewegung)
    if (PT.has && (PT.k > 0.002 || PT.want)) {
      const f = 1 - Math.exp(-dt * 16);
      PT.x += (PT.tx - PT.x) * f; PT.y += (PT.ty - PT.y) * f;
      PT.k += (PT.want - PT.k) * (1 - Math.exp(-dt * (PT.want > PT.k ? 7 : 2.4)));
      if (!PT.want && PT.k < 0.002) PT.k = 0;
      dirty = true;
    }
    // Lupe (Stufe 1+2) etwas größer als die Antwort der Punkte heute
    { const [bx, by] = toBody(PT.x, PT.y, v); PTR[0] = bx - BODY_W / 2; PTR[1] = BODY_H / 2 - by; PTR[2] = Math.max(1, (desk ? 58 : 50) * (1 + 0.3 * kinoK) / v.s); PTR[3] = PT.k; }
    if (st && hk < 1 && (dirty || !paused || Math.abs(S.us - prevUs) > 1e-5 || mixWas !== mixK || kinoWas !== kinoK)) {
      if (relaxDirty) { st.upload(); if (stOld) stOld.upload(); }
      const common = { W, H, ax: v.ax, ay: v.ay, fx: v.fx, fy: v.fy, s: v.s, sway, time: S.time, breath: S.breath, calm: S.calm, alpha: 1, dpr, sp: SP, zoom: v.s / V.A.s, rel: relV, act: actV, tip: S.tip, pulse: sl ? 0 : 1, nerve: lineK, tilt: TILT, scroll: S.us, ring: 0, ptr: PTR };
      if (mixK > 0) st.draw({ ...common, intro: S.intro, spB: pts.spB || SP, kino: easeIO(kinoK), end: S.calm, stc: STC, quiet: VAR.quiet, light: VAR.light, ground: VAR.ground, scanIn: VAR.scanIn, half: VAR.half, lens: VAR.lens, dense: VAR.dense, glass: VAR.glass, shell: VAR.shell,
        inner: VAR.cycle ? (sl ? 0.6 : (() => { const ph = (S.time % 11) / 11; return smooth(0.18, 0.4, ph) - smooth(0.68, 0.9, ph); })()) : VAR.zoomIn ? smooth(1.12, 1.6, v.s / V.A.s) : VAR.inner,
        ...(HIRN && HB && cur >= 0 ? { area: [...HB.ar[cur].p, HB.ar[cur].r * 0.62], areaK: S.act[cur] * smooth(1.6, 2.4, v.s / V.A.s), hirn: smooth(1.6, 3, v.s / V.A.s) } : HIRN && HB ? { area: [0, 0, 0, 1], areaK: 0, hirn: smooth(1.6, 3, v.s / V.A.s) } : {}) });
      if (stOld && mixK < 1) stOld.draw({ ...common, intro: 1 });
      relaxDirty = false;
    }
    dirty = false;
    // SVG: Körpergruppe (Umriss ohne WebGL + Lichtlinie) mit derselben Abbildung
    bodyG.setAttribute('transform', `matrix(${M[0]} 0 0 ${M[1]} ${M[2]} ${M[3]})`);
    { const o = lineK > 0.999 ? '' : fmt(lineK); if (o !== lastLineO) { lastLineO = o; if (o) lineG.setAttribute('opacity', o); else lineG.removeAttribute('opacity'); } }
    if (!gl) { // Punktraster ohne WebGL: gleicher Abstand auf dem Bildschirm bei jedem Zoom (sonst wachsen die Punkte mit)
      const k = Math.round(V.A.s / v.s * 100) / 100;
      if (k !== dotK) { dotK = k; const w = 2.6 * k; dotPat.setAttribute('width', w); dotPat.setAttribute('height', w); dotC.setAttribute('cx', w / 2); dotC.setAttribute('cy', w / 2); dotC.setAttribute('r', 0.55 * k); }
      root.querySelector('.kf-body').setAttribute('opacity', fmt(1 - hk));
    }
    const tipKey = S.tip.toFixed(2);
    if (tipKey !== lastTipKey) {
      lastTipKey = tipKey;
      if (!gl) { // mit WebGL sind Gehirn und Nerven Partikel (gl.js, uTip)
        const a = lineTo(CORD0, Math.min(S.tip, SPLIT_H));
        lineEls[0].forEach((e) => e.setAttribute('d', a ? a.d : ''));
        [1, 2].forEach((k) => { const l = S.tip > SPLIT_H ? lineTo(LINES_H[k], S.tip) : null; lineEls[k].forEach((e) => e.setAttribute('d', l ? l.d : '')); });
        nerveEls.forEach((n) => { const o = fmt(smooth(n.ry0, n.ry1, S.tip)); if (o !== n.o) { n.o = o; n.e.setAttribute('opacity', o); } });
        brainG.setAttribute('opacity', fmt(smooth(12, 30, S.tip)));
      }
    }
    const tipPts = [], G = mixK > 0.5 ? GEO.echt : GEO.heute;
    if (S.tip > G.SPLIT) [1, 2].forEach((k) => { const l = lineTo(G.LINES[k], S.tip); if (l) tipPts.push(l.tip); });
    else { const l = lineTo(G.LINES[0], S.tip); tipPts.push(l ? l.tip : G.LINES[0][0]); }
    const full = S.tip >= SOLE - 0.3;
    tips.forEach((g, k) => {
      const p = tipPts[k];
      if (!p || full || (HIRN && u > 0.25)) { g.setAttribute('visibility', 'hidden'); return; }
      const [x, y] = toS(p[0], p[1]);
      g.setAttribute('visibility', 'visible'); g.setAttribute('transform', `translate(${fmt(x)} ${fmt(y)})`);
    });
    // Ringe (mit Fortschritt im Halt), Stellen, Striche rechts
    const onKey = [];
    STATIONS.forEach((St, i) => {
      let [x, y] = toS(St.c[0], St.c[1]), rr = St.r * v.s;
      if (HIRN && HB) { const A = HB.ar[i], cw = Math.cos(sway), sw = Math.sin(sway); x = v.ax + (cw * A.p[0] + sw * A.p[2] - v.fx) * v.s; y = v.ay - (A.p[1] - A.p[2] * TILT - v.fy) * v.s; rr = A.r * v.s; }
      ringPx[i][0] = x; ringPx[i][1] = y; ringPx[i][2] = rr;
      const on = stOn(i, u);
      const { g, ring, halo, prog } = rings[i];
      g.setAttribute('transform', `translate(${fmt(x)} ${fmt(y)})`);
      halo.setAttribute('r', fmt(rr));
      // A: Fortschritt im Halt – der äußere Bogen füllt sich mit jedem Wischer, voll = es geht weiter
      const hp = clamp((u - ARR[i]) / (LEAVE[i] - ARR[i]));
      // Ring (legt sich in 1,2 s um die Stelle) und Fortschritt als Bogen-Pfad ab 12 Uhr im Uhrzeigersinn – keine Strichmuster:
      // bewegte Kreise mit wechselnder Strichlänge ließen in Chrome alte Bögen stehen (Neuzeichnen zu klein berechnet)
      ring.setAttribute('d', arcD(rr, easeIO(S.draw[i])));
      prog.setAttribute('d', arcD(rr, hp));
      progBtns[i].style.setProperty('--p', fmt(clamp((u - (ARR[i] - 0.5)) / (LEAVE[i] - ARR[i] + 0.5))));
      onKey.push(`${on ? 1 : 0}${S.ok[i] ? 1 : 0}${txtOn(i, u) ? 1 : 0}`);
      const b = spots[i], d = Math.max(44, rr * 2);
      b.style.transform = `translate(${fmt(x - d / 2)}px,${fmt(y - d / 2)}px)`; b.style.width = b.style.height = `${fmt(d)}px`;
      if (!gl) glows[i].forEach((g) => { const rel = Math.max(relV[i], 1 - S.rest[i]); g.hot.setAttribute('opacity', fmt((1 - rel) * (0.45 + 0.55 * S.act[i]))); g.cool.setAttribute('opacity', fmt(rel * 0.9)); });
    });
    const key = onKey.join('') + cur;
    if (key !== lastOn) {
      lastOn = key;
      STATIONS.forEach((St, i) => {
        const on = stOn(i, u);
        [rings[i].ring, rings[i].halo, rings[i].prog].forEach((e) => { e.classList.toggle('on', on); e.classList.toggle('ok', S.ok[i]); });
        arts[i].classList.toggle('on', on && (sl || txtOn(i, u)));
        spots[i].classList.toggle('on', on && !S.done[i]); spots[i].tabIndex = on && !S.done[i] ? 0 : -1;
        progBtns[i].classList.toggle('on', i === cur); progBtns[i].classList.toggle('ok', S.ok[i]);
        if (on) progBtns[i].setAttribute('aria-current', 'step'); else progBtns[i].removeAttribute('aria-current');
      });
      wire.classList.toggle('ok', cur >= 0 && S.ok[cur]);
    }
    // B: Pille „Weiter“ – nach ~3 s Stillstand in einer Station (nach dem Lösen schon nach ~1,2 s)
    if (nextBtn) {
      const show = cur >= 0 && u > ARR[cur] - 0.05 && S.idle > 3;
      nextBtn.classList.toggle('on', show);
      // Handy: unter dem Ring, höchstens bis kurz über den Text; ohne Fahrt (ganze Figur) direkt über dem Text
      if (!desk && cur >= 0) { const tTop = (topMode ? TXT.txt : arts[cur].offsetTop || H) - 58, top = sl ? tTop : Math.min(ringPx[cur][1] + ringPx[cur][2] + 14, tTop); nextBtn.style.top = `${fmt(Math.max(80, top))}px`; } else nextBtn.style.top = '';
    }
    // Verbindungslinie (PC): vom Ring zur Eck-Klammer des Textes
    if (desk && cur >= 0) {
      const k = $('.kicker', arts[cur]).getBoundingClientRect(), sr = stage.getBoundingClientRect();
      const tx = k.left - sr.left - 30, ty = k.top - sr.top + k.height / 2;
      const [x, y, rr] = ringPx[cur], dx = tx - x, dy = ty - y, dl = Math.hypot(dx, dy) || 1;
      const sx = x + dx / dl * (rr + 10), sy = y + dy / dl * (rr + 10);
      const vis = dl > rr + 40 ? smooth(ARR[cur] - 0.15, ARR[cur] + 0.05, u) * (1 - smooth(LEAVE[cur] - 0.05, LEAVE[cur] + 0.1, u)) : 0;
      wire.setAttribute('x1', fmt(sx)); wire.setAttribute('y1', fmt(sy)); wire.setAttribute('x2', fmt(tx)); wire.setAttribute('y2', fmt(ty));
      wire.setAttribute('opacity', fmt(sl ? (vis > 0.5 ? 1 : 0) : vis));
    } else wire.setAttribute('opacity', '0');
    // Verlauf hinter dem Text (Handy): nur während der Stationen – Start und Schluss zeigen die ganze Figur über dem Text
    shade.classList.toggle('on', !sl && u > ARR[0] - 0.3 && u < LEAVE[3] + 0.3);
    // Start- und Schlusstext
    const heroA = sl ? (u < 0.15 ? 1 : 0) : 1 - smooth(0.03, 0.22, u); // fertig ausgeblendet, bevor der Text der ersten Station kommt (ab ARR − 0,3)
    heroEl.style.opacity = fmt(heroA); heroEl.style.visibility = heroA < 0.01 ? 'hidden' : '';
    endEl.classList.toggle('on', u > U_END - 0.3);
  }
  addEventListener('resize', () => { H = 0; });

  return {
    update,
    setStyle, style: () => mode, echt: () => echt,
    onReady: (f) => (ready ? f() : readyFns.push(f)), // Bühne steht (Daten geladen oder Rückfall) – Puls füllt dann Form 0
    cloud: () => (st ? { pts, sp: SP, tilt: TILT } : null), // für Form 0 der Hauptbühne (Puls): dieselben Punkte, derselbe Abstand
    pointer: () => PT, // Zeiger (Bildpunkte der Bühne, Stärke k) – Puls führt damit seine eigenen Bühnen
    state: () => ({ stil: mode, mix: +mixK.toFixed(2), kino: +kinoK.toFixed(2), echt, buildMs, sp: +SP.toFixed(2), ptr: +PT.k.toFixed(2), u: +S.u.toFixed(3), us: +S.us.toFixed(3), tip: +S.tip.toFixed(1), cur: S.cur, idle: +S.idle.toFixed(1), act: S.act.map((x) => +x.toFixed(2)), auto: S.auto.map((x) => +x.toFixed(2)), sol: S.sol.map((x) => +x.toFixed(2)), rest: S.rest.map((x) => +x.toFixed(2)), done: S.done.slice(), gl: !!st, n: pts.count, still: still(), handK: +hk.toFixed(2), view: S.view && { s: +S.view.s.toFixed(2), ax: Math.round(S.view.ax), ay: Math.round(S.view.ay) } }),
    go: (u) => scrollTo(trackTop() + u * H, false),
    ring: (i) => ringPx[i].map((x) => Math.round(x)),
    relax: () => relaxCv.toDataURL(), // Zeichenfläche „Entspannung“ als Bild (Prüfen)
    // Übergabe an Puls
    fitE: () => (V.E ? { ...V.E, ay: V.E.ay + stageTop, W, H } : null), // Schlussbild; wandert mit, wenn die Bühne am Ende wegscrollt
    handK: () => hk,
    sway: () => S.sway, breath: () => S.breath, calm: () => S.calm,
    gl: () => !!st,
  };
}
