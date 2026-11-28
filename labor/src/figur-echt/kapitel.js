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
import { createStage, glContextTiefe } from './gl.js';
import { startWahl } from './daten.js';

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
export let KEYS = [
  [0.05, CROWN, 'A'],
  [0.55, STATIONS[0].tip, 0], [0.97, STATIONS[0].tip + CREEP[0], 0],
  [1.49, STATIONS[1].tip, 1], [1.91, STATIONS[1].tip + CREEP[1], 1],
  [2.49, STATIONS[2].tip, 2], [2.91, STATIONS[2].tip + CREEP[2], 2],
  [3.49, STATIONS[3].tip, 3], [3.91, STATIONS[3].tip + CREEP[3], 3],
  [4.41, SOLE, 'E'],
];
export let U_LEN = 5.15; // Ende der Bühne (Länge der Strecke = U_LEN + 1 Bildschirmhöhe, CSS .kf --len 6.15 in fein.css)
let ARR = STATIONS.map((_, i) => KEYS[1 + 2 * i][0]), LEAVE = STATIONS.map((_, i) => KEYS[2 + 2 * i][0]);
// Fahrplan „ins Gehirn“ (Fassungen K und M, 25.11.2026 abends – Kai: „viele Scrolls mit wenig sichtbarem Effekt“): rund ein Viertel kürzer,
// und kein Halt steht mehr still – im Halt (Blick i → 'h' + i) dreht sich das Gehirn schon ein Stück zum nächsten Areal und kommt etwas
// näher, jeder Wischer bewegt also sichtbar etwas. Die Lichtspitze bleibt unter dem Hirnstamm stehen und läuft erst am Schluss,
// wenn der Blick zurückfährt, durch den ganzen Körper: das Nervensystem wächst vom Gehirn bis in die Füße (Schlussbild).
const TIP_H = 52;
const KEYS_HIRN = [
  [0.04, CROWN, 'A'],
  [0.46, TIP_H, 0], [0.80, TIP_H, 'h0'],
  [1.16, TIP_H, 1], [1.50, TIP_H, 'h1'],
  [1.86, TIP_H, 2], [2.20, TIP_H, 'h2'],
  [2.56, TIP_H, 3], [2.90, TIP_H, 'h3'],
  // Fahrt am Rückenmark (25.11.2026 nachts, Kai: „von der Gehirn-Ansicht das Nervensystem/Rückenmark runter scrollen“, „die Figur seitlich“):
  // der Blick schwenkt ins Profil und gleitet am Rückenmark hinunter (R1 Hals und Brust, R2 Lende); die Nerven wachsen mit der Lichtspitze
  // aus dem Rückenmark. Dann die ganze Figur von der Seite ('E') – dort entsteht über die Zeit der Leitsatz (S.txt, siehe update).
  [3.34, 176, 'R1'], [3.76, 276, 'R2'],
  [4.18, SOLE, 'E'], [4.5, SOLE, 'E'],
];
// Fassung „Segmente“ (?seg=1, 27.11.2026 – Kai: „das Kapitel ‚Jedes Segment erzählt etwas anderes‘ mit in die Startfigur integriert“):
// die Fahrt am Rückenmark hält an den sechs Abschnitten von Kapitel 03. Blick 'G' + i = Ankunft, 'g' + i = Ende des Halts (ein Stück
// weitergedreht und näher – kein Halt steht still). Die Lichtspitze steht je Halt auf der Höhe des Abschnitts (Grundriss).
const SEG_BY = [55, 70, 94, 128, 176, 194], SEG_U0 = 3.3, SEG_DU = 0.56, SEG_HALT = 0.3;
const KEYS_SEG = [...KEYS_HIRN.slice(0, 9), ...SEG_BY.flatMap((by, i) => [[SEG_U0 + i * SEG_DU, by, 'G' + i], [SEG_U0 + i * SEG_DU + SEG_HALT, by + 4, 'g' + i]]), [6.82, SOLE, 'E'], [7.14, SOLE, 'E']];
const U_LEN_SEG = 7.59;
// Texte: Abschnitt, Name, Überschrift (das Versorgungsgebiet aus Kapitel 03), „Typisch“ wörtlich aus Kapitel 03
const SEG_TXT = [
  ['C1–C2', 'Atlas und Axis', 'Hinterkopf und Nacken.', 'Vom Nacken aufsteigender Spannungskopfschmerz, Schwindelgefühl, eingeschränktes Kopfdrehen.'],
  ['C5–C6', 'Halswirbelsäule', 'Armaußenseite bis in den Daumen.', 'Ausstrahlung über die Armaußenseite bis in den Daumen, Kribbeln, Schwächegefühl beim Beugen.'],
  ['Th1–Th6', 'Brustwirbelsäule', 'Brustkorb und Zwischenrippen.', 'Blockaden mit atemabhängigem Stechen, Schmerz zwischen den Schulterblättern, „Rippenklemme“.'],
  ['Th7–Th12', 'Untere Brustwirbelsäule', 'Rippenbogen und Bauchwand.', 'Gürtelförmig ausstrahlender Schmerz am Rippenbogen, Steifigkeit am Übergang zur Lendenwirbelsäule (Th12/L1).'],
  ['L4–L5', 'Lendenwirbelsäule', 'Schienbein bis zur Großzehe.', 'Bandscheiben-Region: Ausstrahlung ins Bein, Kribbeln am Schienbein, Fußheber-Schwäche.'],
  ['S1 · ISG', 'Kreuzbein &amp; Becken', 'Wade, Ferse, Fußaußenrand.', 'Ausstrahlung über die Beinrückseite bis zur Ferse, tiefsitzender einseitiger Kreuzschmerz.']];
// Bildausschnitt je Abschnitt (von der Wurzel bis ins Versorgungsgebiet): Mitte (Grundriss-Höhe), Spanne, Drehung, Versatz zur Brust, Breite
const SEG_RAHMEN = [[58, 56, 1.5, 4, 44], [150, 190, 1.3, 10, 74], [100, 80, 1.44, 12, 66], [126, 80, 1.28, 12, 66], [296, 268, 1.34, 6, 74], [296, 268, 1.74, 0, 74]];
// Fassung „Tafel“ (?seg=2, Konzept 2 „Wo tut es weh?“, Go Kai 27.11.2026, 20:34: „dann go 2“): nach dem Gehirn steht die Figur im Profil
// als Tafel da – Wirbelsäule sichtbar, alle Bahnen als feine Linien. Sechs Stellen am Körper sind antippbar; die Farbe läuft von dort
// den Nerv hinauf bis zu ihrem Abschnitt der Wirbelsäule, der Blick fährt heran, die Erklärung öffnet sich. Ein Halt ('T' → 't').
const TF_U0 = 3.4, TF_U1 = 4.05;
const KEYS_TAFEL = [...KEYS_HIRN.slice(0, 9), [TF_U0, SOLE, 'T'], [TF_U1, SOLE, 't'], [4.5, SOLE, 'E'], [4.82, SOLE, 'E']];
const U_LEN_TAFEL = 5.27;
// Stelle am Körper, Abschnitt, Name, Nerven, Typisch, Leistungen – Texte wörtlich aus Kapitel 03
const TF_TXT = [
  ['Hinterkopf', 'C1–C2', 'Atlas und Axis', 'Nn. suboccipitales und N. occipitalis major versorgen Hinterkopf und tiefe Nackenmuskulatur.', 'Vom Nacken aufsteigender Spannungskopfschmerz, Schwindelgefühl, eingeschränktes Kopfdrehen.', ['Atlas-Axis-Therapie', 'Manuelle Therapie', 'Fango']],
  ['Daumen', 'C5–C6', 'Halswirbelsäule', 'Wurzeln u. a. für Bizeps und Schulterheber, Gefühl außen am Arm bis zum Daumen.', 'Ausstrahlung über die Armaußenseite bis in den Daumen, Kribbeln, Schwächegefühl beim Beugen.', ['Manuelle Therapie', 'Schlingentisch', 'Krankengymnastik']],
  ['Brustkorb', 'Th1–Th6', 'Brustwirbelsäule', 'Interkostalnerven der oberen Rippen versorgen Brustkorbwand und Zwischenrippenmuskeln.', 'Blockaden mit atemabhängigem Stechen, Schmerz zwischen den Schulterblättern, „Rippenklemme“.', ['Manuelle Therapie', 'Lojer Manuthera', 'Fango']],
  ['Rippenbogen', 'Th7–Th12', 'Untere Brustwirbelsäule', 'Untere Zwischenrippennerven und Nerven der Bauchwand. Th10 versorgt die Haut etwa auf Nabelhöhe.', 'Gürtelförmig ausstrahlender Schmerz am Rippenbogen, Steifigkeit am Übergang zur Lendenwirbelsäule (Th12/L1).', ['Manuelle Therapie', 'Krankengymnastik', 'Fango']],
  ['Schienbein', 'L4–L5', 'Lendenwirbelsäule', 'Wurzeln Richtung N. ischiadicus. L5 hebt den Fuß, Gefühl am Schienbein bis zur Großzehe.', 'Bandscheiben-Region: Ausstrahlung ins Bein, Kribbeln am Schienbein, Fußheber-Schwäche.', ['Schlingentisch', 'Schmerztherapie', 'Krankengymnastik']],
  ['Ferse', 'S1 · ISG', 'Kreuzbein &amp; Becken', 'S1-Wurzel für Wade, Fußaußenrand und Achillessehnenreflex. Das Iliosakralgelenk verbindet Becken und Wirbelsäule.', 'Ausstrahlung über die Beinrückseite bis zur Ferse, tiefsitzender einseitiger Kreuzschmerz.', ['Manuelle Therapie / ISG', 'Sport-Physiotherapie', 'Stoßwelle']]];
// Ort der Stelle im Körper (x seitlich, y hoch, z nach vorn; die dem Betrachter zugewandte Seite) · Wirbel des Abschnitts (Grundriss-Höhe von … bis)
const TF_ORT = [[0, 180, -17], [-76, -14, 19], [-11, 117, 17], [-23, 76, 12], [-24, -146, 7], [-15, -199, -9]];
// Nahblick je Abschnitt (Kamerafahrt, 27.11. nachts): Mitte (Grundriss-Höhe), Spanne im Bild, Drehung, Versatz zur Brust – die Kamera fährt mit der
// Farbe den Nerv hinauf und landet hier, die Wirbel des Abschnitts stehen groß im Bild
const NAH = [[55, 42, 1.1, 4], [68, 42, 1.1, 4], [93, 64, 1.12, 5], [131, 64, 1.12, 5], [177, 60, 1.1, 6], [187, 56, 1.1, 6]];
// Auftritt der Wirbelsäule (Kai 27.11.: „die toll gebaute Wirbelsäule … mehr in den Vordergrund“): bevor die Stellen erscheinen, baut sie sich groß von
// oben nach unten auf und dreht ins Profil, dann leuchten die vier Abschnitte nacheinander (Name, Zusatz, Grundriss-Höhe von/bis). Zeiten in Sekunden.
const AUF_ABS = [['Halswirbelsäule', '7 Wirbel', 45, 74], ['Brustwirbelsäule', '12 Wirbel', 74, 151], ['Lendenwirbelsäule', '5 Wirbel', 151, 186], ['Kreuzbein', '', 186, 204]];
const AUF_BAU0 = 0.5, AUF_BAU1 = 3.1, AUF_ABS0 = 3.2, AUF_ABSD = 0.5, AUF_HALT = 5.5, AUF_ENDE = 6.5;
const WIRBEL_BY = [[49, 57], [65, 73], [74, 112], [112, 151], [170, 186], [186, 195]];
const U_LEN_HIRN = 4.95; // CSS --len setzt initKopfFuss selbst (U_LEN + 1)
const SATZ_SEK = 3.9, SATZ_FLUG = 0.82, SATZ_AB = 0.26; // Leitsatz: Dauer des Ablaufs · Anteil, in dem die Punkte fliegen und schreiben (danach blendet die echte Schrift ein) · Beginn so viele Bildschirmhöhen vor der Ankunft im Schlussbild
let ON_VOR = 0.3; // so früh vor der Ankunft gilt die Station als aktiv (ins Gehirn: 0,22 – die Fahrten sind kürzer)
const stOn = (i, u) => u > ARR[i] - ON_VOR && u < LEAVE[i] + 0.12;
// Text der Station (18.11., Go Kai „3“): erst, wenn die Fahrt fast angekommen ist – vorher stand er über der Figur, während sie noch fuhr
const txtOn = (i, u) => u > ARR[i] - 0.06 && u < LEAVE[i] + 0.12;
let U_END = KEYS[KEYS.length - 1][0];

// old = { points, stage } (nur die Studienseite: Figur plus für den Umschalter „bisher“; Puls gibt nichts mit → kein Umschalter),
// handover = true (Puls): am Schluss ziehen sich Gehirn und Nerven zurück, die Figur steht wieder als ruhiges Raster da und
// wird an Form 0 der Hauptbühne übergeben (cloud() liefert dafür dieselben Punkte).
export function initKopfFuss({ root, isPaused = () => false, reduced = false, data = null, stufe = null, handover = false, start = '', fus = null, scrollTo = (y, smoothly) => window.scrollTo({ top: y, behavior: smoothly ? 'smooth' : 'auto' }) }) {
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
  const START = startWahl(start); // Hauptseite seit 26.11.2026: M ohne Schalter (Kai), ?start=a zeigt die Figur bis dahin
  const INNEN = 'efgijklm'.includes(START) && START !== '';
  // k (Kai 25.11. 11:21, mit Film eines Punkte-Gehirns): Start wie J; beim ersten Scrollen fährt der Blick ins Gehirn, die vier Texte
  // gehören dort zu vier Arealen (das Gehirn dreht sich von einem zum nächsten) – keine Fahrt den Körper hinunter
  // m (Kai 25.11. abends: „die Hauptfigur darf gerne L sein … danach sollte es in das nun gebaute Gehirn K übergehen“): Muskelfigur außen,
  // Fahrt ins Gehirn wie K; am Schluss fährt der Blick zurück und zeigt das ganze Nervensystem (Übergang zu Kapitel 02)
  const HIRN = START === 'k' || START === 'm';
  const YAW_E = 0.9; // Schlussbild von K, M: die ganze Figur von der Seite (halbes Profil)
  const SEGM = HIRN && Q.get('seg') === '1'; // Entwurf: Kapitel 03 in der Startfigur (sechs Halte auf der Fahrt am Rückenmark)
  const TAFEL = HIRN && Q.get('seg') === '2'; // Entwurf Konzept 2: Tafel „Wo tut es weh?“
  // Entwurf „Fusion“ (?seg=3, Kai 28.11.2026: „03 zieht hinter das Gehirn“): der Gastgeber hängt Kapitel 03 (fus.mitte) zwischen zwei Strecken
  // in dieses Kapitel. Fahrplan und Länge bleiben die von Weg M; die Fahrt hält am Blick 'R1' (Profil am Rückenmark), solange Kapitel 03
  // darüber läuft, und geht danach weiter (Lende → ganze Figur → Leitsatz). Die Bühne blendet aus, solange Kapitel 03 sie verdeckt (hkF).
  const FUS = HIRN && Q.get('seg') === '3' && !!(fus && fus.mitte), FUS_UA = KEYS_HIRN[9][0], FUS_REST = 0.6; // FUS_REST: Kapitel 03 steht noch so hoch im Bild (Anteil), wenn die Fahrt weitergeht
  if (HIRN) { KEYS = KEYS_HIRN; U_LEN = U_LEN_HIRN; ARR = STATIONS.map((_, i) => KEYS[1 + 2 * i][0]); LEAVE = STATIONS.map((_, i) => KEYS[2 + 2 * i][0]); U_END = KEYS[KEYS.length - 1][0]; ON_VOR = 0.22; if (SEGM) { KEYS = KEYS_SEG; U_LEN = U_LEN_SEG; U_END = KEYS[KEYS.length - 1][0]; } if (TAFEL) { KEYS = KEYS_TAFEL; U_LEN = U_LEN_TAFEL; U_END = KEYS[KEYS.length - 1][0]; } root.style.setProperty('--len', (U_LEN + 1).toFixed(2)); if (FUS) { root.style.setProperty('--bahn-a', FUS_UA.toFixed(2)); root.style.setProperty('--bahn-b', (U_LEN - FUS_UA + 1 - FUS_REST).toFixed(2)); } }
  const AREALE = [ // Name, Blickrichtung (Drehung um die Hochachse), Mitte im Gehirn (−1…1: rechts, oben, vorn), Radius (Anteil der Breite)
    ['Hören · Schläfenlappen', -1.15, [0.8, -0.32, 0.22], 0.34, 2, 1], ['Denken · Stirnlappen', -0.3, [0.3, 0.3, 0.8], 0.38, 0, 1], // dazu: Hirnlappen (Kennung in figur.js) und Seite
    ['Bewegung · Zentralregion', 0.75, [-0.4, 0.6, -0.05], 0.36, 1, 0], ['Gleichgewicht · Kleinhirn', 2.6, [-0.15, -0.72, -0.7], 0.34, 5, 0]];
  let HB = null; // Maße des Gehirns (nach dem Laden): Mitte, halbe Ausdehnung, Areale in Körpermaßen // j (Kai 25.11. 11:17): Übersicht nur feines Relief, Röntgenblick mit Innenleben erst beim Heranzoomen an die Station // i (Kai 25.11.: „H und E kombinieren“): feines Relief als halb durchsichtige Hülle über dem Innenleben
  // h (Kai: „auch das Äußere dürfte anatomischer sein“): feines Raster schon in der Übersicht + kräftiges Licht von vorn links (Relief)
  const VAR = { quiet: START ? 1 : 0, light: 'hijklm'.includes(START) && START ? 0.9 : START ? 0.5 : 0, dense: 'hijklm'.includes(START) && START ? 1 : 0, glass: START === 'i' ? 0.62 : START === 'j' ? 0.82 : START === 'l' || START === 'm' ? 0.7 : 0.9, zoomIn: 'jklm'.includes(START) && START !== '', shell: START === 'l' || START === 'm' ? 1 : 0, ground: START && START !== 'b' ? 1 : 0, turn: START && START !== 'b' ? 0.3 : 0, scanIn: START === 'd' ? 1 : 0,
    inner: START === 'e' || START === 'f' || START === 'i' ? 1 : 0, half: START === 'f' ? 1 : 0, cycle: START === 'g', lens: INNEN ? 1 : 0, lift: INNEN ? 78 : 0 };
  const SCHARF = Q.get('scharf') === '0' ? 0 : 1; // Probe: Gehirn nach dem Rezept des Rückenmarks (reine Farbe, keine weißen Lichter)
  const BUNT = Q.get('bunt') === '1' ? 1 : 0; // ?bunt=1 (Kai 27.11.2026): die Aquarell-Farben auf der ganzen Seite – hier: Muskelfigur in Pigmenten, Gehirn „Bedeutung“
  // Stil des Gehirns (Kai 26.11.2026: „kräftiger, klarer, auffallender“): A hell auf dunkel ist Standard; ?hirn=alt|b|c zum Vergleich
  const HSTIL = HIRN ? ({ alt: 0, a: 1, b: 2, c: 3, 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 9: 12, 10: 13, 11: 14 }[Q.get('hirn')] ?? (BUNT ? 13 : 1)) : 0, RAUM_H = [1, 0.38, 0.5, 0.38, 0.2, 0.08, 0.85, 0.5, 0.1, 0.06, 0.05, 0.12, 0.12, 0.12, 0.12][HSTIL];
  // Stil 10 „Laterne“ (?hirn=7, Kai 27.11.2026): EIN Licht im Körper. LAMPE = sein Ort (folgt dem Ziel über die Zeit, rund 1,2 s), s = sein Weg am Rückenmark
  const TF = { sel: -1, auto: false, k: 0, seen: [], t: 0, demo: false, in: false, at: 0, aufOk: false, ak: 0, lauf: false, auf: [999, 0, 0, 0], von: null, aus: null, letzt: null, nah: null, cam: null }; const SEG = { r: [0, 0, 0, 0, 0, 0], a: [0, 0, 0, 0, 0, 0], f: new Float32Array(24), k: [0, 0, -1, 0], y: [0, 0], cur: -1, band: 0 }; const LAMPE = { p: null, s: -99, cum: null }; const MAL = { r: [0, 0, 0, 0], hi: -1, von: -1, nach: -1, lr: 0, lp: null, f: new Float32Array(16) }; // Aquarell 13, 14: wie weit die Farbe je Halt gelaufen ist
  let welT0 = -99, welCur = -1; const KERN = +Q.get('kern') || 1; // Lichtwelle (Stil 8, 9): läuft einmal, wenn ein Areal aktiv wird // RAUM_H: so viel Raumlicht bleibt im Gehirn-Blick
  let raumWar = 1;
  const raum = (k) => { k = Math.round(k * 50) / 50; if (k === raumWar) return; raumWar = k; if (k >= 1) document.documentElement.style.removeProperty('--fx-hirn'); else document.documentElement.style.setProperty('--fx-hirn', String(k)); };
  // C: weicher Lichtschein um das Gehirn – ein Ring in Gehirngröße über der Zeichenfläche (hellt nur auf), nur im Gehirn-Blick eingeschaltet
  const SCHEIN = { 3: '120,180,240', 4: '60,200,255', 5: '150,110,255', 8: '40,150,230' }[HSTIL], schein = SCHEIN ? document.createElement('div') : null; let scheinAn = false;
  if (schein) { schein.setAttribute('aria-hidden', 'true'); schein.style.cssText = 'position:absolute;left:0;top:0;z-index:0;display:none;pointer-events:none;border-radius:50%;mix-blend-mode:screen;background:radial-gradient(closest-side,rgba(120,180,240,0) 40%,rgba(120,180,240,.1) 55%,rgba(120,180,240,.17) 66%,rgba(120,180,240,.1) 78%,rgba(120,180,240,.03) 90%,rgba(120,180,240,0))'.replace(/120,180,240/g, SCHEIN); canvas.after(schein); }
  if ((Q.has('hirn') || BUNT) && HIRN && !SEGM && !TAFEL) { // Umschalter Gehirn-Stil: nur solange ?hirn= oder ?bunt=1 in der Adresse steht
    const nav = document.createElement('nav'); nav.setAttribute('aria-label', 'Gehirn vergleichen');
    nav.style.cssText = 'position:fixed;z-index:60;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + .75rem);transform:translateX(-50%);display:flex;gap:.25rem;padding:.25rem;border-radius:2rem;background:rgba(10,22,27,.92);border:1px solid rgba(255,255,255,.18);font:600 .8125rem/1 system-ui,sans-serif;max-width:calc(100vw - 1rem);overflow-x:auto;scrollbar-width:none';
    [['alt', 'Bisher', 0], ['a', 'A hell', 1], ['10', '10 Bedeutung', 13], ['11', '11 Farbe läuft', 14], ['9', '9 Pigment fein', 12], ['8', '8 Aquarell', 11], ['7', '7 Laterne', 10], ['1', '1 Neon', 4], ['5', '5 Tiefsee', 8], ['6', '6 Kintsugi', 9], ['2', '2 Gold + Violett', 5], ['3', '3 Warm', 6], ['4', '4 Echt', 7]].forEach(([k, t, i]) => { const l = document.createElement('a'); const q = new URLSearchParams(location.search); q.set('hirn', k); l.href = '?' + q.toString(); const on = HSTIL === i; l.textContent = t; l.style.cssText = `padding:.625rem .7rem;border-radius:2rem;text-decoration:none;white-space:nowrap;color:${on ? '#1B1206' : '#E4E3D8'};background:${on ? '#E8A33D' : 'transparent'}`; if (on) l.setAttribute('aria-current', 'true'); nav.appendChild(l); });
    { const l = document.createElement('a'), q = new URLSearchParams(location.search); if (BUNT) q.delete('bunt'); else q.set('bunt', '1'); if (!q.has('hirn')) q.set('hirn', '10'); l.href = '?' + q.toString(); l.textContent = BUNT ? 'Ganze Seite bunt: an' : 'Ganze Seite bunt: aus'; // ?bunt=1 dazuschalten (Figur, Kapitel 02, Wirbelsäule, Übergänge)
      l.style.cssText = `padding:.625rem .7rem;border-radius:2rem;text-decoration:none;white-space:nowrap;color:${BUNT ? '#1B1206' : '#E4E3D8'};background:${BUNT ? '#8BC34A' : 'transparent'};box-shadow:inset 0 0 0 1px rgba(228,227,216,.35)`; nav.insertBefore(l, nav.firstChild); }
    document.body.appendChild(nav);
  }
  if (START) document.documentElement.dataset.start = START;
  if (Q.has('start')) { // Umschalter für den Vergleich: bleibt unten im Bild, solange man mit ?start= auf der Seite ist
    const nav = document.createElement('nav'); nav.setAttribute('aria-label', 'Startfigur vergleichen');
    nav.style.cssText = 'position:fixed;z-index:60;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + .75rem);transform:translateX(-50%);display:flex;gap:.25rem;padding:.25rem;border-radius:2rem;background:rgba(10,22,27,.92);border:1px solid rgba(255,255,255,.18);font:600 .8125rem/1 system-ui,sans-serif;max-width:calc(100vw - 1rem);overflow-x:auto;scrollbar-width:none';
    const NAMEN = { a: 'bis 26.11.', b: 'ruhig', c: 'Boden, gedreht', d: 'Auftritt', e: 'Glaskörper', f: 'halb und halb', g: 'im Wechsel', h: 'feines Relief', i: 'Relief + innen', j: 'Relief, Röntgen nah', k: 'ins Gehirn', l: 'Muskelfigur', m: 'Muskeln + Gehirn' };
    [['a', 'A'], ['b', 'B'], ['c', 'C'], ['d', 'D'], ['e', 'E'], ['f', 'F'], ['g', 'G'], ['h', 'H'], ['i', 'I'], ['j', 'J'], ['k', 'K'], ['l', 'L'], ['m', 'M']].forEach(([k, t]) => { const l = document.createElement('a'); l.href = `?start=${k}`; const on = (START || 'a') === k; l.textContent = on ? `${t} ${NAMEN[k]}` : t; l.style.cssText = `padding:.625rem .44rem;border-radius:2rem;text-decoration:none;white-space:nowrap;color:${on ? '#1B1206' : '#E4E3D8'};background:${on ? '#E8A33D' : 'transparent'}`; if (on) l.setAttribute('aria-current', 'true'); nav.appendChild(l); });
    document.body.appendChild(nav);
    nav.scrollLeft = nav.scrollWidth; // die neuesten Fassungen stehen rechts
  }
  const shade = $('.kf-shade'), bodyG = $('.kf-bodyg'), heroEl = $('.kf-hero'), endEl = $('.kf-end'), wire = $('.kf-wire'), hand = $('.kf-hand');
  const lineEls = [0, 1, 2].map((i) => [$(`.kf-l${i}`), $(`.kf-l${i}g`)]);
  const lineG = $('.kf-lines');
  const arts = $$('.kf-st'), dos = arts.map((a) => $('.kf-do', a)), spots = $$('.kf-spot'), progBtns = $$('.kf-prog button');
  const nextBtn = $('.kf-next'), progEl = $('.kf-prog');
  // Fassung „Segmente“: sechs Textblöcke wie die vier der Areale (gleiche Klassen, gleiche Blenden), hinter dem vierten eingefügt
  const sArts = SEGM ? SEG_TXT.map((T, i) => { const a = document.createElement('article'); a.className = 'kf-st kf-sg'; a.setAttribute('aria-labelledby', 'kf-g' + i);
    a.innerHTML = `<p class="kicker"><i>${T[0]}</i> ${T[1]}</p><h2 id="kf-g${i}">${T[2]}</h2><p class="kf-txt">Typisch: ${T[3]}</p><p class="kf-sg-note">Vereinfachte Orientierung, ersetzt keine ärztliche Diagnose.</p>`; return a; }) : [];
  if (sArts.length) arts[arts.length - 1].after(...sArts);
  // Fassung „Tafel“: ein Textblock (Überschrift, Hinweis, sechs Knöpfe), sechs Leuchtpunkte an der Figur, eine Karte für die Erklärung
  let tArt = null, tKarte = null, tSpots = [], tAbs = [];
  const tfZu = () => { if (TF.sel >= 0 && !TF.auto && TF.letzt && TF.k > 0.001) { TF.aus = TF.letzt; TF.k = 1; } TF.sel = -1; TF.auto = false; if (tKarte) tKarte.classList.remove('on'); tSpots.forEach((b) => b.setAttribute('aria-pressed', 'false')); dirty = true; };
  const tfWahl = (i, auto = false) => {
    if (!auto && TF.sel === i && !TF.auto) { tfZu(); return; }
    TF.sel = i; TF.auto = auto; TF.demo = true; dirty = true;
    tSpots.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i && !auto)));
    if (auto) return;
    TF.seen[i] = true;
    const T = TF_TXT[i];
    tKarte.innerHTML = `<button type="button" class="kf-tk-x" aria-label="Erklärung schließen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button><p class="kf-tk-no"><i>${T[1]}</i> ${T[2]}</p><dl><dt>Typisch</dt><dd>${T[4]}</dd><dt>Nerven</dt><dd>${T[3]}</dd></dl><ul class="chips">${T[5].map((c) => `<li>${c}</li>`).join('')}</ul><p class="kf-sg-note">Vereinfachte Orientierung, ersetzt keine ärztliche Diagnose. Bitte lassen Sie Beschwerden immer zuerst ärztlich abklären – bei Taubheit oder Lähmungszeichen umgehend.</p>`;
    $('.kf-tk-x', tKarte).addEventListener('click', () => { const b = tSpots[i]; tfZu(); if (b) b.focus({ preventScroll: true }); });
    // Kamerafahrt: von dort, wo der Blick gerade steht, mit der Farbe den Nerv hinauf; Ziel ist der Nahblick auf die Wirbel des Abschnitts
    // (am Handy zwischen Kopfleiste und Karte, am PC wie die übrigen Halte). Die Karte kommt, wenn die Kamera landet.
    TF.von = TF.k > 0.01 && TF.letzt ? { ...TF.letzt } : null; TF.k = 0; TF.cam = null; TF.p = 0; SEG.r[i] = 0; // die Farbe startet neu am Ort (auch wenn das Beispiel diesen Abschnitt schon gefärbt hat)
    { const top = desk ? 0 : 92, bot = desk ? H : tKarte.offsetTop || H * 0.55; TF.nah = V.nahBlick ? V.nahBlick(i, desk ? H * 0.78 : (bot - top) * 0.9, desk ? H * 0.52 : (top + bot) / 2) : null; }
    tKarte.classList.toggle('on', !TF.nah);
  };
  if (TAFEL) {
    tArt = document.createElement('article'); tArt.className = 'kf-st kf-tf'; tArt.setAttribute('aria-labelledby', 'kf-tf-h');
    tArt.innerHTML = `<p class="kicker"><i>05</i> Ursache · Wirbelsäule</p><h2 id="kf-tf-h">Jedes Segment erzählt etwas.</h2><p class="kf-txt">Tippen Sie auf eine Stelle, die Sie kennen. Die Farbe folgt dem Nerv bis zu seinem Ursprung an der Wirbelsäule.</p><div class="kf-tf-wahl" role="group" aria-label="Stelle wählen">${TF_TXT.map((T, i) => `<button type="button" data-tf="${i}">${T[0]}</button>`).join('')}</div>`;
    arts[arts.length - 1].after(tArt);
    $$('[data-tf]', tArt).forEach((b) => b.addEventListener('click', () => tfWahl(+b.dataset.tf)));
    tKarte = document.createElement('aside'); tKarte.className = 'kf-tk'; tKarte.setAttribute('aria-live', 'polite'); tKarte.setAttribute('aria-label', 'Erklärung zum Abschnitt'); stage.append(tKarte);
    tSpots = TF_TXT.map((T, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'kf-tp' + (i === 0 || i === 5 ? ' li' : ''); b.setAttribute('aria-label', `${T[0]}: Weg des Nervs zeigen`); b.setAttribute('aria-pressed', 'false'); b.tabIndex = -1;
      b.innerHTML = `<i></i><span>${T[0]}</span>`; b.addEventListener('click', () => tfWahl(i)); stage.append(b); return b; });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && TF.sel >= 0 && !TF.auto) tfZu(); });
    tAbs = AUF_ABS.map((A) => { const e = document.createElement('span'); e.className = 'kf-ta'; e.setAttribute('aria-hidden', 'true'); e.innerHTML = `<b>${A[0]}</b>${A[1] ? `<em>${A[1]}</em>` : ''}`; stage.append(e); return e; });
  }
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
  dos.forEach((d) => { d.textContent = HIRN ? '' : HINT; }); // ins Gehirn: keine Spannungs-Stellen, also auch kein Hinweis zum Lösen

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
      const sB = Math.min((desk ? W * 0.41 : W * 0.86) / (2 * Math.max(HB.h[0], HB.h[2])), (desk ? H * 0.74 : (TXT.txt - TXT.head || H * 0.5) * 0.8) / (2 * HB.h[1])); // 25.11. mittags (Kai: „noch viel Platz“): größer
      const blick = (A, yaw, s, o) => { const cw = Math.cos(yaw), sw = Math.sin(yaw), k = 0.12; // Areal nur ein Stück zur Mitte gerückt: das ganze Gehirn bleibt im Bild
        return { fx: cw * (HB.c[0] + (A.p[0] - HB.c[0]) * k) + sw * (HB.c[2] + (A.p[2] - HB.c[2]) * k), fy: HB.c[1] + (A.p[1] - HB.c[1]) * k - HB.c[2] * TILT, s, ax: o.ax, ay: o.ay, yaw }; };
      HB.ar.forEach((A, i) => { const o = V[i], nx = HB.ar[i + 1] ? HB.ar[i + 1].yaw : A.yaw + 1.4;
        V[i] = blick(A, A.yaw, sB, o);
        V['h' + i] = blick(A, A.yaw + (nx - A.yaw) * 0.22, sB * 1.05, o); }); // Ende des Halts: schon ein Stück weitergedreht, etwas näher
      // Am PC sind V.A, V.S und V.E dasselbe Objekt – eigene Kopien, sonst überschreibt die letzte Drehung die erste (so stand die Figur
      // von M am PC beim Start von vorn statt leicht gedreht wie in L; Kai 25.11. nachts: „die Figur hätte ich gerne seitlich wieder gesehen“)
      V.A = { ...V.A, yaw: VAR.turn }; V.S = { ...V.S, yaw: 0 }; V.E = { ...V.E, yaw: YAW_E };
      // Fahrt am Rückenmark: Blick von der Seite (yaw), Mitte auf dem Rückenmark in der Grundriss-Höhe by, um vor Einheiten zur Brust hin
      const mk = pts.mark || [];
      if (mk.length > 1) {
        const markAt = (y) => { let k = 1; while (k < mk.length - 1 && mk[k][1] > y) k++; const A = mk[k - 1], B = mk[k], f = clamp((A[1] - y) / Math.max(1e-9, A[1] - B[1])); return [A[0] + (B[0] - A[0]) * f, A[2] + (B[2] - A[2]) * f]; };
        const seite = (by, yaw, s, vor) => { const y = BODY_H / 2 - by, q = markAt(y); return { fx: Math.cos(yaw) * q[0] + Math.sin(yaw) * (q[1] + vor), fy: y - q[1] * TILT, s, ax: V[3].ax, ay: desk ? H * 0.52 : H * 0.5, yaw }; };
        const sR = desk ? Math.min(H * 0.84 / 132, W * 0.38 / 64) : Math.min(H * 0.76 / 132, W * 0.94 / 66);
        V.R1 = seite(114, 1.5, sR, 9); V.R2 = seite(212, 1.36, sR * 0.6, 6);
        if (SEGM) { // je Abschnitt ein Bildausschnitt von der Wurzel bis ins Versorgungsgebiet: Mitte (Grundriss-Höhe), Spanne, Drehung, Versatz zur Brust
          const hA = desk ? H * 0.8 : (TXT.txt - TXT.head || H * 0.5) * 0.94, wA = desk ? W * 0.4 : W * 0.94, ay = desk ? H * 0.52 : stAy;
          SEG_RAHMEN.forEach(([mid, span, yw, vor, breit], i) => {
            const s = Math.min(hA / span, wA / breit);
            V['G' + i] = { ...seite(mid, yw, s, vor), ay }; V['g' + i] = { ...seite(mid + span * 0.025, yw + 0.08, s * 1.05, vor), ay }; });
        }
        if (TAFEL && tArt) { // ganze Figur im Profil zwischen Überschrift und Text des Tafel-Blocks; Nahblick je Abschnitt (nahBlick) und Auftritt (aufBlick)
          const h2 = $('h2', tArt), tx = $('.kf-txt', tArt), top = desk ? 0 : tArt.offsetTop + h2.offsetTop + h2.offsetHeight + 8, bot = desk ? H : tArt.offsetTop + tx.offsetTop - 10;
          const sT = Math.min((desk ? H * 0.86 : Math.max(120, bot - top)) / 414, (desk ? W * 0.4 : W * 0.9) / 112), ay = desk ? H * 0.52 : (top + bot) / 2, wA = desk ? W * 0.4 : W * 0.94;
          V.T = { fx: Math.sin(1.32) * 2, fy: -1, s: sT, ax: V[3].ax, ay, yaw: 1.32 }; V.t = { ...V.T, fx: Math.sin(1.42) * 2, s: sT * 1.03, yaw: 1.42 };
          V.mark = markAt;
          V.nahBlick = (i, hA, ay2) => { const [mid, span, yw, vor] = NAH[i], y = BODY_H / 2 - mid, q = markAt(y); return { ...seite(mid, yw, Math.min(hA / span, wA / (span * 0.86), 2.3 / ((pts.hirn && pts.hirn.wSp) || 0.4)), vor), ay: ay2, P: [q[0], y, q[1] + vor] }; }; // nie näher, als das Raster trägt (Punkt höchstens rund 3,4 Bildpunkte: sonst zeigt der Rand Stufen)
          // Auftritt: die ganze Wirbelsäule groß (am Handy von der Überschrift bis zum unteren Rand – der Hinweistext kommt erst danach)
          const aTop = desk ? H * 0.07 : top, aBot = desk ? H * 0.93 : H - 30, sA = Math.min((aBot - aTop) / 172, wA / 64);
          V.aufBlick = (yaw) => ({ ...seite(124, yaw, sA, 8), ay: (aTop + aBot) / 2 });
        }
      } else { V.R1 = V.E; V.R2 = V.E; }
      if (TAFEL && !V.T) { V.T = V.E; V.t = V.E; }
      if (SEGM && !V.G0) for (let i = 0; i < 6; i++) { V['G' + i] = V.E; V['g' + i] = V.E; }
    } else if (HIRN) { // ohne feine Daten (kein Grafikchip, Laden misslungen): die Halte der Strecke brauchen trotzdem einen Blick – sonst bricht die Fahrt ab
      STATIONS.forEach((_, i) => { V['h' + i] = V[i]; }); V.R1 = V.E; V.R2 = V.E; if (SEGM) for (let i = 0; i < 6; i++) { V['G' + i] = V.E; V['g' + i] = V.E; } if (TAFEL) { V.T = V.E; V.t = V.E; }
    }
    dpr = Math.min(devicePixelRatio || 1, 2);
    if (gl) {
      const cw = Math.round(W * dpr), ch = Math.round(H * dpr);
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw; canvas.height = ch;
        // 25.11.2026 (Kai: „beim ersten Aufrufen kurz der alte dunkle Hintergrund“): eine neu bemessene Zeichenfläche ist schwarz, bis
        // etwas gezeichnet wird – solange die Figur noch lädt, sofort im Seitengrund füllen (sonst steht dort ein dunkleres Feld)
        if (!st) { gl.viewport(0, 0, cw, ch); gl.clearColor(10 / 255, 22 / 255, 27 / 255, 1); gl.clear(gl.COLOR_BUFFER_BIT); }
      }
      if (stOld && (canvasOld.width !== cw || canvasOld.height !== ch)) { canvasOld.width = cw; canvasOld.height = ch; }
    }
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    dirty = true; lastTipKey = ''; lastOn = '';
    satzMessen();
  }
  // ---------- Leitsatz aus Punkten (K, M – 25.11.2026 nachts, Kai: „dann mit einer tollen Animation den Leitspruch bildet“) ----------
  // Die Nerven-Perlen schreiben die Überschrift des Schlussbilds. Gemessen wird die echte Schrift: jedes Zeichen steht dort, wo der Browser
  // es setzt (Range), und wird in derselben Schrift auf eine Zeichenfläche gemalt; ein geordnetes Raster (gleicher Abstand, jede zweite
  // Zeile versetzt) liest daraus die Punkte. Am Ende legt sich die echte Überschrift (HTML) deckungsgleich darüber – gelesen wird Schrift,
  // keine Punkte. Die Hauptbühne nimmt dieselben Punkte als Form 0 (satz()) und löst sie in die Linien von Kapitel 02.
  const SATZ = { n: 0, pts: null, dot: 2, E: null, key: '' }, satzFns = [], endH2 = $('h2', endEl);
  if (HIRN && endH2) { endH2.style.transition = 'none'; endH2.style.transform = 'none'; } // die Überschrift blendet hier über den Ablauf ein (update), ohne Versatz
  function satzMessen() {
    if (!HIRN || !HB || !st || !st.nerven || !endH2 || !pts.nerv || !V.E) return;
    const sr = stage.getBoundingClientRect(), hr = endH2.getBoundingClientRect();
    if (!hr.width || !hr.height) return;
    const key = [W, H, hr.left - sr.left, hr.top - sr.top, hr.width, hr.height, V.E.s, V.E.ax, V.E.ay, document.fonts ? document.fonts.status : ''].map((x) => (typeof x === 'number' ? x.toFixed(2) : x)).join('|');
    if (key === SATZ.key) return;
    const K = 2, pad = 4, cv = document.createElement('canvas'); cv.width = Math.ceil((hr.width + pad * 2) * K); cv.height = Math.ceil((hr.height + pad * 2) * K);
    const cx = cv.getContext('2d', { willReadFrequently: true }); if (!cx) return;
    cx.scale(K, K); cx.textBaseline = 'alphabetic';
    const tw = document.createTreeWalker(endH2, NodeFilter.SHOW_TEXT), rg = document.createRange(), rgb = (c) => (c.match(/[\d.]+/g) || [228, 227, 216]).slice(0, 3).map((x) => +x / 255);
    let fs = 0, c0 = null, c1 = null;
    for (let nd = tw.nextNode(); nd; nd = tw.nextNode()) {
      const el = nd.parentElement, cs = getComputedStyle(el), em = !!el.closest('em');
      cx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const m = cx.measureText('Hg'), asc = m.fontBoundingBoxAscent || m.actualBoundingBoxAscent;
      fs = Math.max(fs, parseFloat(cs.fontSize)); if (em) c1 = c1 || rgb(cs.color); else c0 = c0 || rgb(cs.color);
      cx.fillStyle = em ? '#f00' : '#0f0'; // Kennfarbe: Rot = Hervorhebung (Bernstein), Grün = Schrift
      for (let i = 0; i < nd.data.length; i++) { if (/\s/.test(nd.data[i])) continue; rg.setStart(nd, i); rg.setEnd(nd, i + 1); const q = rg.getClientRects()[0]; if (!q || !q.width) continue; cx.fillText(nd.data[i], q.left - hr.left + pad, q.top - hr.top + pad + asc); }
    }
    const img = cx.getImageData(0, 0, cv.width, cv.height).data, lh = parseFloat(getComputedStyle(endH2).lineHeight) || fs, Nb = pts.nerv[1] - pts.nerv[0];
    let g = clamp(fs / 24, 1.9, 2.6), T = [];
    for (let vers = 0; vers < 4; vers++) { // Raster: Punktabstand g, Zeilen im Abstand g·0,866, jede zweite versetzt; nie mehr Ziele als Perlen
      T = [];
      for (let j = 0, y = pad + g / 2; y < hr.height + pad; j++, y += g * 0.866) for (let x = pad + (j & 1 ? g / 2 : 0); x < hr.width + pad; x += g) {
        const o = (Math.round(y * K) * cv.width + Math.round(x * K)) * 4; if (img[o + 3] < 128) continue;
        T.push([hr.left - sr.left + x - pad, hr.top - sr.top + y - pad, img[o] > img[o + 1] ? 2 : 1, Math.floor((y - pad) / lh)]);
      }
      if (T.length <= Nb) break; g *= Math.sqrt(T.length / Nb) * 1.02;
    }
    const Nt = T.length; if (!Nt || Nt > Nb) return;
    T.sort((a, b) => a[3] - b[3] || a[0] - b[0] || a[1] - b[1]); // Lesereihenfolge: Zeile, dann von links nach rechts
    // Perlen von oben nach unten (Kopf zuerst) auf die Ziele in Lesereihenfolge: die Bahnen des Halses schreiben den Anfang, die der Beine
    // das Ende. Mehrere Perlen teilen sich ein Ziel – die erste bleibt als Punkt der Schrift, die anderen vergehen beim Ankommen.
    const n0 = pts.nerv[0], ord = Array.from({ length: Nb }, (_, i) => i).sort((a, b) => pts.pos[(n0 + b) * 3 + 1] - pts.pos[(n0 + a) * 3 + 1]), to = new Float32Array(Nb * 4);
    ord.forEach((bi, r) => { const t = Math.min(Nt - 1, Math.floor(r * Nt / Nb)), q = T[t];
      to[bi * 4] = q[0]; to[bi * 4 + 1] = q[1]; to[bi * 4 + 2] = (t / Nt) * 0.86 + pts.rnd[(n0 + bi) * 4 + 2] * 0.14; to[bi * 4 + 3] = r === Math.ceil(t * Nb / Nt) ? q[2] : 0; });
    st.setTargets(to, g * 0.78, c0, c1);
    const P = new Float32Array(Nt * 3); T.forEach((q, i) => { P[i * 3] = q[0]; P[i * 3 + 1] = q[1]; P[i * 3 + 2] = q[2]; });
    SATZ.n = Nt; SATZ.pts = P; SATZ.dot = g * 0.78; SATZ.E = { ...V.E }; SATZ.key = key;
    satzFns.forEach((f) => f());
  }
  // Texthöhen ändern sich nach dem ersten Layout noch (Schrift fertig geladen, Umschalter bisher/neu) → neu messen,
  // sonst steht die Figur am Handy in der Überschrift
  if (window.ResizeObserver) { const ro = new ResizeObserver(() => { H = 0; }); [heroEl, endEl, ...arts, ...$$('h1,h2,.kf-txt,.kf-sub', root)].forEach((e) => ro.observe(e)); }
  document.fonts?.ready.then(() => { H = 0; });
  const mixView = (a, b, t, dip = 0) => {
    const s = Math.exp(lerp(Math.log(a.s), Math.log(b.s), t)) * (1 - dip * Math.sin(Math.PI * t));
    // Fahrt mit starkem Zoom (Fassungen j, k, l – Kai 25.11.: „am PC abgeschnitten“): das Ziel bleibt während der ganzen Fahrt im Bild –
    // sein Ort am Bildschirm wandert gerade von dort, wo es im weiten Blick liegt, zum Anker des nahen Blicks
    if (VAR.zoomIn && Math.abs(Math.log(b.s / a.s)) > 0.5) {
      const near = b.s > a.s ? b : a, far = b.s > a.s ? a : b, k = b.s > a.s ? t : 1 - t;
      const x0 = far.ax + (near.fx - far.fx) * far.s, y0 = far.ay - (near.fy - far.fy) * far.s;
      const ax = lerp(a.ax, b.ax, t), ay = lerp(a.ay, b.ay, t), px = lerp(x0, near.ax, k), py = lerp(y0, near.ay, k);
      return { fx: near.fx - (px - ax) / s, fy: near.fy + (py - ay) / s, s, ax, ay, yaw: lerp(a.yaw || 0, b.yaw || 0, t) };
    }
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
      if (HIRN && V['h0']) { const drift = b[2] === 'h' + a[2] || String(b[2])[0] === 'g' || b[2] === 't', dreh = typeof b[2] === 'number' && String(a[2])[0] === 'h'; // Halt mit Bewegung · Drehung zum nächsten Areal
        // Fahrt am Rückenmark: ohne Halt durch R1 und R2 (anfahren nach dem Kleinhirn, gleiten, ausrollen im Schlussbild)
        const r = b[2] === 'R1' ? t * t * (2 - t) : b[2] === 'R2' ? t : a[2] === 'R2' ? 1 - (1 - t) * (1 - t) * (1 + t) : -1;
        if (r >= 0) return { tip: lerp(a[1], b[1], r), view: mixView(V[a[2]], V[b[2]], r) };
        return { tip: lerp(a[1], b[1], e), view: drift ? mixView(V[a[2]], V[b[2]], t) : mixView(V[a[2]], V[b[2]], e, dreh ? 0.05 : 0) }; }
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
  let gl = (HIRN ? glContextTiefe : glContext)(canvas), st = null, pts = null;
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
        pts = echtPoints({ sp: SP, dust: big ? 26 : 14, data: d, detail: !!VAR.dense, hirn: HIRN, shell: !!VAR.shell, wirbel: TAFEL, wirbelSp: innerWidth >= 600 ? 0.34 : 0.4, hirnSp: HSTIL === 10 ? (+Q.get('korn') || (big ? 0.52 : 0.7)) : HSTIL >= 12 && (+Q.get('korn') || !big) ? (+Q.get('korn') || Math.min(0.29, Math.max(0.2, 132 / innerWidth))) : big ? (innerWidth >= 1700 ? 0.22 : 0.25) : 0.33, areale: AREALE.map((a) => [a[4], a[5]]), ruhig: HIRN });
        if (HIRN && d.parts.some((q) => q.kind === 'brain2')) document.querySelectorAll('[data-quelle-hirn]').forEach((e) => { e.hidden = false; }); // Namensnennung der Gehirn-Quelle (CC BY-SA 3.0) – nur, wenn sie gezeigt wird
        if (HIRN && pts.brain && pts.brain[0][0] < 1e8) {
          const B = pts.brain, c = B.map((r) => (r[0] + r[1]) / 2), h = B.map((r) => (r[1] - r[0]) / 2);
          HB = { c, h, ar: AREALE.map(([name, yaw, q, r, lobe, side]) => { const L = pts.lobes && pts.lobes[lobe] && pts.lobes[lobe][side]; return { name, yaw, lobe: L ? lobe : -1, p: L && (L[0] || L[1] || L[2]) ? L.slice() : q.map((v, k) => c[k] + v * h[k]), r: r * 2 * h[0] * (L ? 0.5 : 1) }; }) };
          arts.forEach((a, i) => { const k = $('.kicker', a); if (k && HB.ar[i]) k.innerHTML = `<i>0${i + 1}</i> ${HB.ar[i].name}`; if (progBtns[i] && HB.ar[i]) progBtns[i].setAttribute('aria-label', `0${i + 1} ${HB.ar[i].name.replace(' · ', ', ')}`); });
          if (progEl) progEl.setAttribute('aria-label', 'Vier Areale im Gehirn');
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
    txt: 0, txtWant: -1, weg: 0, // K, M: der Leitsatz entsteht (0…1 über die Zeit) · er löst sich in die Linien von Kapitel 02
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
    const [x, y] = local(e), i = HIRN ? -1 : ringAt(x, y);
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
  const yVonU = (u) => (!FUS || u <= FUS_UA ? u * H : (u + 1 - FUS_REST) * H + fus.mitte.offsetHeight); // Fusion: hinter Kapitel 03 liegt die Strecke um dessen Höhe tiefer
  const goU = (u) => (FUS && u > FUS_UA && S.u <= FUS_UA ? scrollTo(fus.mitte.getBoundingClientRect().top + scrollY, !still()) : scrollTo(trackTop() + yVonU(u), !still())); // Fusion: „Weiter“ nach dem Gehirn führt zu Kapitel 03, nicht darüber hinweg
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
  let lastT = performance.now(), lastTipKey = '', lastOn = '', hk = 0, stageTop = 0, lastLineO = '', hkF = 0, fusTeil = 0, fusNah = false, fusAus = false, fusMaske = '';
  function update(now) {
    const dt = Math.min(0.1, Math.max(0, (now - lastT) / 1000)); lastT = now;
    const r = root.getBoundingClientRect();
    stageTop = r.top > 0 ? r.top : Math.min(0, r.bottom - (H || innerHeight)); // Lage der klebenden Bühne (für die Übergabe an Puls)
    if (r.bottom < -50 || r.top > innerHeight + 50) { // Bühne nicht im Bild: ruht
      hand.classList.remove('on'); raum(1); if (scheinAn) { schein.style.display = 'none'; scheinAn = false; }
      // liegt die Bühne über dem Fenster, ist sie fertig übergeben (18.11.: seit dem Kapitel-Auftakt grenzt Kapitel 02 nicht mehr
      // direkt an – nach einem Sprung blieb hk sonst bei 0 stehen und die Punktwolke der Seite unsichtbar)
      if (r.bottom < -50) { hk = 1; S.u = S.us = U_LEN; S.txt = S.txtWant = 1; S.weg = 1; }
      if (FUS) { hkF = 0; fusNah = false; fusTeil = r.bottom < -50 ? 2 : 0; }
      return;
    }
    if (!H || stage.clientHeight !== H || stage.clientWidth !== W) layout();
    if (!H) return;
    const sl = still(), paused = isPaused();
    if (sl !== lastStill) { lastStill = sl; root.classList.toggle('kf-still', sl); dirty = true; lastOn = ''; }
    S.u = clamp(-r.top / H, 0, U_LEN);
    if (FUS) { // zwei Strecken: bis Kapitel 03 hereinkommt · Halt, solange es darüber läuft · weiter, sobald sein Ende die Bildmitte verlässt
      const rM = fus.mitte.getBoundingClientRect(), b0 = H * FUS_REST;
      S.u = rM.top >= H ? clamp(-r.top / H, 0, FUS_UA) : rM.bottom > b0 ? FUS_UA : clamp(FUS_UA + (b0 - rM.bottom) / H, FUS_UA, U_LEN);
      hkF = smooth(H * 0.96, H * 0.45, rM.top) * (1 - smooth(H * 0.95, H * 0.6, rM.bottom));
      // weiche Kante an Kapitel 03: die Bühne ist nur über seiner Oberkante bzw. unter seiner Unterkante sichtbar – sein Text steht nie auf der Figur
      { const w = H * 0.12, mk = rM.top > 0 && rM.top < H ? `linear-gradient(to bottom,#000 ${Math.round(Math.max(0, rM.top - w))}px,transparent ${Math.round(rM.top)}px)` : rM.bottom > -w * 2.5 && rM.bottom < H ? `linear-gradient(to bottom,transparent ${Math.round(Math.max(0, rM.bottom))}px,#000 ${Math.round(Math.max(0, rM.bottom) + w * 2.5)}px)` : '';
        if (mk !== fusMaske) { fusMaske = mk; stage.style.webkitMaskImage = mk; stage.style.maskImage = mk; } }
      fusTeil = rM.bottom < b0 ? 2 : rM.top < H ? 1 : 0; fusNah = rM.top < H * 1.5;
      const aus = hkF > 0.985;
      if (aus !== fusAus) { fusAus = aus; stage.style.visibility = aus ? 'hidden' : ''; dirty = true; }
      stage.style.opacity = hkF > 0 ? fmt(1 - hkF) : '';
      if (aus) { S.us = S.u; hand.classList.remove('on'); raum(1); if (scheinAn) { schein.style.display = 'none'; scheinAn = false; } return; } // ganz verdeckt: die Bühne ruht
    }
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
    let v = P.view;
    let tfDrin = false, tfLauf = false;
    if (TAFEL) {
      const sg = pts && pts.seg, kann = !!(HB && gl && V.aufBlick) && !sl && !paused;
      tfDrin = u > TF_U0 - 0.12 && u < TF_U1 + 0.14;
      // Auftritt: läuft über die Zeit, sobald man von oben ankommt (einmal je Ankunft; von unten kommend und ohne Bewegung steht gleich die Tafel)
      if (u < TF_U0 - 0.45) { TF.aufOk = false; TF.at = 0; } else if (u > TF_U1 || (tfDrin && !kann)) TF.aufOk = true;
      tfLauf = kann && !TF.aufOk;
      if (tfLauf && tfDrin) { TF.at += dt; if (TF.at >= AUF_ENDE) { TF.aufOk = true; tfLauf = false; } } else if (!tfDrin) TF.at = 0;
      TF.ak = tfLauf && tfDrin ? smooth(0, 0.9, TF.at) * (1 - smooth(AUF_HALT, AUF_ENDE, TF.at)) : Math.max(0, TF.ak - dt / 0.5);
      if (TF.ak > 0.001 && V.aufBlick) v = mixView(v, V.aufBlick(lerp(0.42, 1.32, easeIO(clamp((TF.at - 0.3) / 3)))), TF.ak);
      TF.lauf = tfLauf; TF.auf[0] = tfLauf ? lerp(36, 212, clamp((TF.at - AUF_BAU0) / (AUF_BAU1 - AUF_BAU0))) : 999; TF.auf[1] = tfLauf ? 1 : 0; TF.auf[2] = TF.ak;
      // Kamerafahrt: nach dem Antippen fährt der Blick mit der Farbfront den Nerv hinauf (Ort der Front aus pts.segWeg, weich nachgeführt), wird
      // dabei näher und landet im Nahblick an den Wirbeln; beim Schließen gleitet er von dort zurück zur Tafel
      if (TF.sel >= 0 && !TF.auto && TF.nah) {
        const i = TF.sel, L = sg ? sg[i][1] + 8 : 1, p = sg ? clamp(SEG.r[i] / L) : 1, N = TF.nah, Wg = pts && pts.segWeg ? pts.segWeg[i] : null;
        let C = N.P;
        if (Wg && Wg.length > 1 && sg) { const dF = sg[i][0] + sg[i][1] + 4 - SEG.r[i];
          let k = 1; while (k < Wg.length - 1 && Wg[k][0] < dF) k++;
          const A = Wg[k - 1], B = Wg[k], f = clamp((dF - A[0]) / Math.max(1e-6, B[0] - A[0])), Z = [1, 2, 3].map((j) => A[j] + (B[j] - A[j]) * f);
          TF.cam = TF.cam && !sl && !paused ? TF.cam.map((c, j) => c + (Z[j] - c) * (1 - Math.exp(-dt * 5))) : Z;
          const e2 = smooth(0.62, 1, p); C = TF.cam.map((c, j) => lerp(c, N.P[j], e2)); }
        const yw = lerp(1.32, N.yaw, smooth(0.4, 1, p)), ya = yw + (S.rock || 0), sP = Math.exp(lerp(Math.log(V.T.s * 2.6), Math.log(N.s), easeIO(p)));
        const ziel = { fx: Math.cos(ya) * C[0] + Math.sin(ya) * C[2], fy: C[1] - C[2] * TILT, s: sP, ax: N.ax, ay: lerp(desk ? N.ay : H * 0.5, N.ay, smooth(0.5, 1, p)), yaw: yw };
        TF.k = sl || paused ? 1 : Math.min(1, TF.k + dt / 0.9);
        v = mixView(TF.von || v, ziel, easeIO(TF.k)); TF.letzt = v; TF.p = p;
        if (p > 0.6 && !tKarte.classList.contains('on')) tKarte.classList.add('on');
      } else if (TF.k > 0.001 && TF.aus) { TF.k = sl || paused ? 0 : Math.max(0, TF.k - dt); v = mixView(v, TF.aus, easeIO(TF.k)); TF.letzt = v; } else TF.k = 0;
      TF.auf[3] = V.T ? 1 : 0; // auf der Tafel steht die Wirbelsäule immer deckend und plastisch da (leuchtend war sie in der Übersicht nur ein weißer Schatten) // deckend: im Auftritt immer, sonst sobald der Blick deutlich näher ist als die Tafel
      S.view = v;
    }
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
    // Fassung „Segmente“: aktiver Abschnitt, Farbfront je Abschnitt (läuft über die Zeit von der Wurzel in das Versorgungsgebiet, in rund
    // 2,4 s; beim Zurückscrollen zieht sie sich schnell zurück), die übrigen Bahnen treten im Halt zurück
    let sgCur = -1;
    if (SEGM) {
      let hi = -1; for (let i = 0; i < 6; i++) { const a0 = SEG_U0 + i * SEG_DU; if (u > a0 - 0.06) hi = i; if (u > a0 - 0.16 && u < a0 + SEG_HALT + 0.1) sgCur = i; }
      const zone = smooth(SEG_U0 - 0.3, SEG_U0 - 0.06, u) * (1 - smooth(SEG_U0 + 5 * SEG_DU + SEG_HALT + 0.05, SEG_U0 + 5 * SEG_DU + SEG_HALT + 0.36, u)), sg = pts && pts.seg;
      for (let i = 0; i < 6 && sg; i++) { const L = sg[i][1] + 8, an = i <= hi;
        SEG.r[i] = sl || paused ? (an ? L : 0) : clamp(SEG.r[i] + dt * (an ? Math.max(46, L / 2.4) : -L / 0.5), 0, L);
        SEG.a[i] = sl || paused ? (i === sgCur ? 1 : 0) : SEG.a[i] + ((i === sgCur ? 1 : 0) - SEG.a[i]) * Math.min(1, dt * 4);
        SEG.f[i * 4] = sg[i][0]; SEG.f[i * 4 + 1] = SEG.r[i]; SEG.f[i * 4 + 2] = SEG.a[i]; SEG.f[i * 4 + 3] = sg[i][1]; }
      if (sgCur >= 0) SEG.cur = sgCur;
      SEG.band = sl || paused ? (sgCur >= 0 ? 1 : 0) : SEG.band + ((sgCur >= 0 ? 1 : 0) - SEG.band) * Math.min(1, dt * 4);
      SEG.k = [1, zone, Math.max(0, SEG.cur), SEG.band]; SEG.y = [[47, 60], [65, 75], [76, 108], [108, 143], [0, 0], [0, 0]][Math.max(0, SEG.cur)];
      sArts.forEach((a, i) => a.classList.toggle('on', i === sgCur && (sl || u > SEG_U0 + i * SEG_DU - 0.08)));
    }
    if (TAFEL) {
      const drin = tfDrin, sg = pts && pts.seg;
      if (!drin) { if (TF.sel >= 0) tfZu(); TF.t = 0; TF.demo = false; }
      else if (!TF.demo && TF.sel < 0 && TF.aufOk && u > TF_U0 - 0.03 && sg && !sl) { TF.t += dt; if (TF.t > 1.5) tfWahl(1, true); } // niemand tippt: ein Beispiel läuft von selbst (Daumen → C5–C6)
      TF.in = drin;
      const zone = Math.max(TF.ak, smooth(TF_U0 - 0.32, TF_U0 - 0.04, u) * (1 - smooth(TF_U1 + 0.04, TF_U1 + 0.3, u)));
      let band = 0;
      for (let i = 0; i < 6 && sg; i++) { const L = sg[i][1] + 8, an = i === TF.sel;
        SEG.r[i] = sl || paused ? (an ? L : 0) : clamp(SEG.r[i] + dt * (an ? (TF.auto ? Math.max(60, L / 2.2) : L / clamp(L / 60, 1.8, 3.2)) : -L / 0.35), 0, L); // angetippt: Fahrt von 1,8 bis 3,2 s je nach Länge der Bahn
        SEG.a[i] = sl || paused ? (an ? 1 : 0) : SEG.a[i] + ((an ? 1 : 0) - SEG.a[i]) * Math.min(1, dt * 4);
        if (an) band = smooth(0.78, 1, SEG.r[i] / L);
        SEG.f[i * 4] = sg[i][0]; SEG.f[i * 4 + 1] = SEG.r[i]; SEG.f[i * 4 + 2] = SEG.a[i]; SEG.f[i * 4 + 3] = sg[i][1]; }
      if (TF.sel >= 0) SEG.cur = TF.sel;
      SEG.band = TF.sel >= 0 ? band : Math.max(0, SEG.band - dt * 3);
      SEG.k = [2, zone, Math.max(0, SEG.cur), SEG.band]; SEG.y = WIRBEL_BY[Math.max(0, SEG.cur)];
      if (tfLauf && TF.sel < 0) { // Auftritt: die vier Abschnitte leuchten nacheinander einmal auf (warmes Weiß, uSegK.z = -1)
        const f = (TF.at - AUF_ABS0) / AUF_ABSD, j = Math.floor(f), q = f - j;
        SEG.band = j >= 0 && j < 4 ? smooth(0, 0.25, q) * (1 - smooth(0.7, 1, q)) : 0; if (j >= 0 && j < 4) SEG.y = AUF_ABS[j].slice(2);
        SEG.k = [2, zone, -1, SEG.band]; }
      tArt.classList.toggle('kf-tf-auf', tfLauf);
      tArt.classList.toggle('on', drin && (sl || u > TF_U0 - 0.08) && !(TF.sel >= 0 && !TF.auto));
      { const ohne = !(HB && gl); if (tArt.classList.contains('kf-tf-ohne') !== ohne) { tArt.classList.toggle('kf-tf-ohne', ohne); H = 0; } } root.classList.toggle('kf-tf-offen', TF.sel >= 0 && !TF.auto); // ohne Grafikchip gibt es keine Leuchtpunkte: dann wählen die Knöpfe im Textblock
      sgCur = drin && !tfLauf ? 9 : -1; // Verlauf hinter dem Text auch hier (nicht im Auftritt: der Hinweistext kommt erst danach)
    }
    // Am Ende der Strecke blendet die eigene Bühne aus (handK); das Nervensystem bleibt bis dahin stehen
    // (im Baustein zieht sich die Lichtlinie vorher zurück – für die Übergabe an Puls; hier gibt es keine Übergabe)
    hk = smooth(U_LEN - 0.35, U_LEN - 0.05, u);
    const lineK = handover && !(HIRN && HB) ? 1 - smooth(U_LEN - 0.55, U_LEN - 0.22, u) : 1; // ins Gehirn: das Nervensystem bleibt stehen und wird übergeben
    // Fahrt am Rückenmark (K, M): Haut und Muskeln stehen als Glas im Profil, kein Röntgenblick – die Nerven wachsen mit der Lichtspitze
    const fahrt = HIRN && HB ? smooth(LEAVE[3] + 0.04, LEAVE[3] + 0.3, u) : 0;
    // Leitsatz (K, M): Auslöser kurz vor der Ankunft im Schlussbild, der Ablauf läuft über die Zeit; zurück, wenn man wieder hinauf scrollt.
    // Weiter unten (weg) löst sich der Satz in die Linien von Kapitel 02 (Hauptbühne) – die echte Schrift weicht dann den Punkten.
    if (HIRN && HB && SATZ.n) {
      const ab = KEYS[KEYS.length - 2][0] - SATZ_AB, was = S.txt, los = smooth(U_LEN - 0.16, U_LEN - 0.04, u);
      if (S.txtWant < 0) { S.txtWant = u > ab ? 1 : 0; S.txt = S.txtWant; } else if (u > ab) S.txtWant = 1; else if (u < ab - 0.1) S.txtWant = 0;
      S.txt = sl ? S.txtWant : S.txtWant > S.txt ? Math.min(1, S.txt + dt / SATZ_SEK) : S.txtWant < S.txt ? Math.max(0, S.txt - dt / (SATZ_SEK * 0.55)) : S.txt;
      if (los > 0.3) S.weg = 1; else if (los < 0.12) S.weg = 0;
      if (was !== S.txt) dirty = true;
    }
    const nsK = HIRN && HB ? smooth(LEAVE[3] + 0.02, LEAVE[3] + 0.2, u) : 0; // Schlussbild „Nervensystem“
    // Gehirn-Blick (A–C): das Raumlicht tritt zurück, damit das Gehirn hell auf dunklem Grund steht; auf der Fahrt hinunter kommt es wieder
    if (HSTIL) raum(HB && gl ? 1 - (1 - RAUM_H) * smooth(1.6, 3, v.s / V.A.s) * (1 - fahrt) * (1 - hk) : 1);
    // Wiegen + Atem (wie Puls), gleiche Werte für Partikel und SVG
    const rock = sl ? 0 : Math.sin(S.time * 0.25) * (HIRN ? 0.07 + 0.11 * smooth(1.6, 3, v.s / V.A.s) : 0.12); S.rock = rock;
    const sway = rock + (HIRN && HB ? (v.yaw || 0) : VAR.turn * (1 - smooth(0.02, 0.5, u))); S.sway = sway; // ?start=c|d: am Start leicht gedreht, dreht sich mit dem ersten Scrollen nach vorn
    const br = Math.sin(S.breath) * (1 + S.calm * 1.3), kx = 1 + br * 0.007, ky = 1 + br * 0.004, cx = kx * Math.cos(sway);
    const M = [v.s * cx, v.s * ky, v.ax - (BODY_W / 2 * cx + v.fx) * v.s, v.ay - (BODY_H / 2 * ky - v.fy) * v.s]; // Grundriss → Bildschirm
    if (TAFEL && tSpots.length) { // Leuchtpunkte: Ort im Körper → Bildschirm (wie die Zeichenfläche: Drehung um die Hochachse, leichte Aufsicht)
      const zeig = TF.in && TF.aufOk && !!(HB && gl) && u > TF_U0 - 0.06, nahAn = TF.sel >= 0 && !TF.auto && TF.k > 0.15, cs = Math.cos(sway), sn = Math.sin(sway), kTop = tKarte.classList.contains('on') && !desk ? tKarte.offsetTop : 1e9;
      let puls = TF.sel >= 0 && !TF.auto ? -1 : TF_TXT.findIndex((_, i) => !TF.seen[i] && !(TF.auto && i === TF.sel));
      tSpots.forEach((b, i) => { const O = TF_ORT[i], x = v.ax + (cs * O[0] + sn * O[2] - v.fx) * v.s, y = v.ay - (O[1] - O[2] * TILT - v.fy) * v.s;
        const an = zeig && !(nahAn && (i !== TF.sel || TF.p > 0.55)) && x > 16 && x < W - 16 && y > 70 && y < Math.min(H - 16, kTop - 18);
        if (an) b.style.transform = `translate(${fmt(x)}px,${fmt(y)}px)`;
        b.classList.toggle('on', an); b.classList.toggle('is-pulse', an && i === puls); b.classList.toggle('is-on', an && i === TF.sel); b.tabIndex = an ? 0 : -1; });
      // Auftritt: Name des Abschnitts rechts neben den Wirbelkörpern, bleibt stehen, bis die Figur dazukommt
      tAbs.forEach((e, j) => { const an = TF.lauf && tfDrin && TF.at > AUF_ABS0 + j * AUF_ABSD + 0.1 && TF.at < AUF_HALT && !!V.mark;
        if (an) { const A = AUF_ABS[j], Y = BODY_H / 2 - (A[2] + A[3]) / 2, q = V.mark(Y), Z = q[1] + 16; e.style.transform = `translate(${fmt(Math.min(W - 14 - e.offsetWidth, v.ax + (cs * q[0] + sn * Z - v.fx) * v.s + 14))}px,${fmt(v.ay - (Y - Z * TILT - v.fy) * v.s)}px)`; }
        e.classList.toggle('on', an); });
    }
    if (schein) { // Lage wie die Ringe der Areale: Mitte des Gehirns, Größe aus seiner Ausdehnung
      const k = HB && gl ? smooth(2.2, 3, v.s / V.A.s) * (1 - fahrt) : 0;
      if (k > 0.01) { const cw = Math.cos(sway), sw = Math.sin(sway), c = HB.c, h = HB.h, x = v.ax + (cw * c[0] + sw * c[2] - v.fx) * v.s, y = v.ay - (c[1] - c[2] * TILT - v.fy) * v.s, rx = Math.max(h[0], h[2]) * v.s * 2, ry = h[1] * v.s * 2.2;
        const s = schein.style; s.width = `${fmt(rx * 2)}px`; s.height = `${fmt(ry * 2)}px`; s.transform = `translate(${fmt(x - rx)}px,${fmt(y - ry)}px)`; s.opacity = fmt(k); if (!scheinAn) { s.display = 'block'; scheinAn = true; }
      } else if (scheinAn) { schein.style.display = 'none'; scheinAn = false; }
    }
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
      const common = { seg: SEGM || TAFEL ? SEG.f : null, segK: SEGM || TAFEL ? SEG.k : null, segY: SEGM || TAFEL ? SEG.y : null, auf: TAFEL ? TF.auf : null, bunt: BUNT, scharf: SCHARF, lasur: +Q.get('lasur') || 1, W, H, ax: v.ax, ay: v.ay, fx: v.fx, fy: v.fy, s: v.s, sway, time: S.time, breath: S.breath, calm: S.calm, alpha: 1, dpr, sp: SP, zoom: v.s / V.A.s, rel: relV, act: actV, tip: S.tip, pulse: sl ? 0 : 1, nerve: lineK, tilt: TILT, scroll: S.us, ring: 0, ptr: PTR };
      if (cur !== welCur) { welCur = cur; if (cur >= 0) welT0 = S.time + 0.35; }
      let lampe = null;
      if (HSTIL === 10 && HB) {
        // Ziel: im Gehirn-Blick ein Stück unter der Rinde des Areals (zuletzt aktives bleibt, bis das nächste dran ist); auf der Fahrt
        // die Stelle des Rückenmarks in Bildmitte. Das Licht folgt dem Ziel über die Zeit – der Weg führt quer durch das Innere.
        const mk = pts.mark || [];
        if (!LAMPE.cum && mk.length > 1) { LAMPE.cum = [0]; for (let k = 1; k < mk.length; k++) LAMPE.cum.push(LAMPE.cum[k - 1] + Math.hypot(mk[k][0] - mk[k - 1][0], mk[k][1] - mk[k - 1][1], mk[k][2] - mk[k - 1][2])); }
        if (cur >= 0) LAMPE.ar = cur;
        const A = HB.ar[LAMPE.ar === undefined ? 0 : LAMPE.ar];
        let T = [0, 1, 2].map((k) => A.p[k] + (HB.c[k] - A.p[k]) * 0.3), sT = -99;
        if (fahrt > 0.02 && LAMPE.cum) { const y = Math.min(mk[0][1], v.fy + mk[0][2] * TILT); let k = 1; while (k < mk.length - 1 && mk[k][1] > y) k++;
          const P = mk[k - 1], B = mk[k], f = clamp((P[1] - y) / Math.max(1e-9, P[1] - B[1])); T = [0, 1, 2].map((c) => P[c] + (B[c] - P[c]) * f); sT = LAMPE.cum[k - 1] + (LAMPE.cum[k] - LAMPE.cum[k - 1]) * f; }
        if (!LAMPE.p || sl || paused) { LAMPE.p = T.slice(); LAMPE.s = sT; }
        else { const k = 1 - Math.exp(-dt * (fahrt > 0.02 ? 7 : 3.2)); for (let c = 0; c < 3; c++) LAMPE.p[c] += (T[c] - LAMPE.p[c]) * k; LAMPE.s = sT < -50 ? -99 : LAMPE.s < -50 ? Math.min(sT, 0) : LAMPE.s + (sT - LAMPE.s) * k; }
        lampe = [...LAMPE.p, 1];
      }
      let mal = null, lauf = null;
      if (HSTIL >= 13 && HB && pts.hirn) {
        // Die Farbe läuft über die Zeit: je Halt wächst der Radius der Front von der Mitte seines Areals (0,7 Gehirnradien je Sekunde),
        // beim Zurückscrollen zieht sie sich schneller zurück. Was gemalt ist, bleibt – nach vier Halten ist das Gehirn bunt.
        const R = pts.hirn.r, zoomK = v.s / V.A.s;
        if (cur >= 0) MAL.hi = cur; else if (fahrt > 0.5) MAL.hi = 3; else if (zoomK < 1.3 && nsK < 0.01) { MAL.hi = -1; MAL.von = MAL.nach = -1; MAL.lr = 0; }
        for (let i = 0; i < 4; i++) { const an = i <= MAL.hi; MAL.r[i] = sl || paused ? (an ? 3 * R : 0) : clamp(MAL.r[i] + (an ? 0.7 : -2.2) * dt * R, 0, 3 * R);
          const P = HB.ar[i].p; MAL.f[i * 4] = P[0]; MAL.f[i * 4 + 1] = P[1]; MAL.f[i * 4 + 2] = P[2]; MAL.f[i * 4 + 3] = MAL.r[i]; }
        if (cur >= 0 && cur !== MAL.nach) { MAL.von = MAL.nach; MAL.nach = cur; MAL.lr = 0; MAL.lp = HB.ar[cur].p; }
        else if (MAL.nach < 0 && MAL.hi === 3) { MAL.nach = 3; MAL.lp = HB.ar[3].p; }
        MAL.lr = sl || paused ? 3 * R : Math.min(3 * R, MAL.lr + 0.7 * dt * R);
        mal = MAL.f; lauf = [MAL.von, MAL.nach, MAL.nach < 0 ? 0 : MAL.lr];
      }
      if (mixK > 0) st.draw({ ...common, lampe, lampeS: LAMPE.s, mal, lauf, laufP: MAL.lp, welle: sl || paused ? 99 : S.time - welT0, intro: S.intro, spB: pts.spB || SP, kino: easeIO(kinoK), end: S.calm, stc: STC, quiet: VAR.quiet, light: VAR.light, ground: VAR.ground, scanIn: VAR.scanIn, half: VAR.half, lens: VAR.lens, dense: VAR.dense, glass: VAR.glass, shell: VAR.shell,
        inner: VAR.cycle ? (sl ? 0.6 : (() => { const ph = (S.time % 11) / 11; return smooth(0.18, 0.4, ph) - smooth(0.68, 0.9, ph); })()) : VAR.zoomIn ? smooth(1.12, 1.6, v.s / V.A.s) * (1 - fahrt) : VAR.inner,
        ...(HIRN && HB && cur >= 0 ? { solid: 1, hstil: HSTIL, kern: KERN, ns: nsK, areaI: cur, lobe: HB.ar[cur].lobe, area: [...HB.ar[cur].p, HB.ar[cur].r * 0.62], areaK: S.act[cur] * smooth(1.6, 2.4, v.s / V.A.s), hirn: smooth(1.6, 3, v.s / V.A.s) * (1 - fahrt), txt: SATZ.n ? Math.min(1, S.txt / SATZ_FLUG) : 0 } : HIRN && HB ? { solid: 1, hstil: HSTIL, kern: KERN, ns: nsK, area: [0, 0, 0, 1], areaK: 0, hirn: smooth(1.6, 3, v.s / V.A.s) * (1 - fahrt), txt: SATZ.n ? Math.min(1, S.txt / SATZ_FLUG) : 0 } : {}) });
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
        spots[i].classList.toggle('on', on && !S.done[i] && !HIRN); spots[i].tabIndex = on && !S.done[i] && !HIRN ? 0 : -1;
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
      if (!desk && cur >= 0) { const tTop = (topMode ? TXT.txt : arts[cur].offsetTop || H) - 58, top = sl || HIRN ? tTop : Math.min(ringPx[cur][1] + ringPx[cur][2] + 14, tTop); nextBtn.style.top = `${fmt(Math.max(80, top))}px`; } else nextBtn.style.top = '';
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
    shade.classList.toggle('on', !sl && ((u > ARR[0] - ON_VOR && u < LEAVE[3] + 0.3) || sgCur >= 0));
    // Start- und Schlusstext
    const heroA = sl ? (u < 0.15 ? 1 : 0) : 1 - smooth(0.03, 0.22, u); // fertig ausgeblendet, bevor der Text der ersten Station kommt (ab ARR − 0,3)
    heroEl.style.opacity = fmt(heroA); heroEl.style.visibility = heroA < 0.01 ? 'hidden' : '';
    if (HIRN && HB && SATZ.n) { // erst schreiben die Punkte den Satz, dann legt sich die echte Schrift darüber; Unterzeile und Knöpfe folgen
      endH2.style.opacity = fmt(smooth(SATZ_FLUG + 0.02, 1, S.txt));
      endEl.classList.toggle('on', S.txt > SATZ_FLUG + 0.02 && !S.weg);
    } else { if (HIRN && endH2 && endH2.style.opacity) endH2.style.opacity = ''; endEl.classList.toggle('on', u > (HIRN ? KEYS[KEYS.length - 2][0] - 0.14 : U_END - 0.3)); }
  }
  addEventListener('resize', () => { H = 0; });

  return {
    update,
    setStyle, style: () => mode, echt: () => echt,
    onReady: (f) => (ready ? f() : readyFns.push(f)), // Bühne steht (Daten geladen oder Rückfall) – Puls füllt dann Form 0
    cloud: () => (st ? { pts, sp: SP, tilt: TILT } : null), // für Form 0 der Hauptbühne (Puls): dieselben Punkte, derselbe Abstand
    pointer: () => PT, // Zeiger (Bildpunkte der Bühne, Stärke k) – Puls führt damit seine eigenen Bühnen
    state: () => ({ stil: mode, mix: +mixK.toFixed(2), kino: +kinoK.toFixed(2), echt, buildMs, sp: +SP.toFixed(2), ptr: +PT.k.toFixed(2), u: +S.u.toFixed(3), us: +S.us.toFixed(3), tip: +S.tip.toFixed(1), cur: S.cur, idle: +S.idle.toFixed(1), act: S.act.map((x) => +x.toFixed(2)), auto: S.auto.map((x) => +x.toFixed(2)), sol: S.sol.map((x) => +x.toFixed(2)), rest: S.rest.map((x) => +x.toFixed(2)), done: S.done.slice(), gl: !!st, n: pts.count, still: still(), handK: +hk.toFixed(2), txt: +S.txt.toFixed(2), satz: SATZ.n, view: S.view && { s: +S.view.s.toFixed(2), ax: Math.round(S.view.ax), ay: Math.round(S.view.ay) } }),
    go: (u) => scrollTo(trackTop() + yVonU(u), false),
    tafel: () => TF, // Prüfhilfe: Zustand der Tafel (Auftritt, Kamerafahrt)
    ring: (i) => ringPx[i].map((x) => Math.round(x)),
    plan: () => ({ hirn: HIRN, arr: ARR.slice(), leave: LEAVE.slice(), end: U_END }), // für den Prüfstand: Halte je Fassung
    relax: () => relaxCv.toDataURL(), // Zeichenfläche „Entspannung“ als Bild (Prüfen)
    // Übergabe an Puls
    fitE: () => (V.E ? { ...V.E, ay: V.E.ay + stageTop, W, H } : null), // Schlussbild; wandert mit, wenn die Bühne am Ende wegscrollt
    handK: () => Math.max(hk, hkF), fus: () => (FUS ? { teil: fusTeil, zu: hkF, nah: fusNah } : null), // Fusion: teil 0 vor, 1 in, 2 nach Kapitel 03 · zu = so weit ist die Bühne ausgeblendet · nah = Kapitel 03 kommt gleich
    // K, M: Form 0 der Hauptbühne ist der Leitsatz – er steht still (kein Wiegen, kein Atem), sonst läge er nicht auf der echten Schrift
    sway: () => (SATZ.n ? 0 : S.sway), breath: () => (SATZ.n ? 0 : S.breath), calm: () => S.calm,
    satz: () => (SATZ.n ? SATZ : null), onSatz: (f) => { satzFns.push(f); if (SATZ.n) f(); }, // Punkte des Leitsatzes (Bildpunkte der Bühne, Art) + Blick E, neu nach jedem Vermessen
    los: () => (HIRN && HB && SATZ.n ? smooth(U_LEN - 0.16, U_LEN - 0.04, S.us) : -1), // Auslöser für den Formwechsel Satz → Linien (statt der Lage von Kapitel 02)
    gl: () => !!st,
  };
}
