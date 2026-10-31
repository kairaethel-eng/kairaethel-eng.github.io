// Prozedurale Texturen (Canvas) – keine Bilddateien nötig.
import * as THREE from 'three';

const R = (a, b) => a + Math.random() * (b - a);
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c, rep = [1, 1], srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]);
  t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Eichendielen
export function woodFloor() {
  const [c, x] = canvas(1024, 1024);
  const plankW = 1024 / 6;
  for (let i = 0; i < 6; i++) {
    let y = -R(0, 400);
    while (y < 1024) {
      const len = R(380, 720), base = R(0, 1);
      const col = `hsl(${R(28, 34)}, ${R(32, 42)}%, ${R(54, 64)}%)`;
      x.fillStyle = col; x.fillRect(i * plankW, y, plankW, len);
      for (let g = 0; g < 70; g++) {
        x.strokeStyle = `rgba(${90 + base * 30},${60 + base * 20},${35},${R(0.03, 0.09)})`;
        x.lineWidth = R(0.5, 2.2);
        const gx = i * plankW + R(4, plankW - 4);
        x.beginPath(); x.moveTo(gx, y); x.bezierCurveTo(gx + R(-6, 6), y + len * 0.3, gx + R(-8, 8), y + len * 0.7, gx + R(-4, 4), y + len); x.stroke();
      }
      if (Math.random() < 0.35) { x.fillStyle = 'rgba(90,60,35,.18)'; x.beginPath(); x.ellipse(i * plankW + R(20, plankW - 20), y + R(40, len - 40), R(4, 9), R(8, 16), 0, 0, 6.3); x.fill(); }
      x.fillStyle = 'rgba(60,40,25,.35)'; x.fillRect(i * plankW, y + len - 2, plankW, 2);
      y += len;
    }
    x.fillStyle = 'rgba(60,40,25,.32)'; x.fillRect(i * plankW, 0, 2, 1024);
  }
  return tex(c, [3, 3]);
}

// Kalkputz / Leinen-Wand
export function plaster(hue = 38, light = 90) {
  const [c, x] = canvas(512, 512);
  x.fillStyle = `hsl(${hue}, 24%, ${light}%)`; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) {
    x.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '120,100,80'},${R(0.015, 0.05)})`;
    const s = R(1, 4); x.fillRect(R(0, 512), R(0, 512), s, s);
  }
  return tex(c, [4, 2]);
}

// Teppich mit ruhigem Muster
export function rug() {
  const [c, x] = canvas(512, 768);
  x.fillStyle = '#E9DFCB'; x.fillRect(0, 0, 512, 768);
  x.strokeStyle = '#9DAF93'; x.lineWidth = 18; x.strokeRect(28, 28, 456, 712);
  x.strokeStyle = '#D59A4E'; x.lineWidth = 4; x.strokeRect(58, 58, 396, 652);
  for (let r = 0; r < 7; r++) for (let k = 0; k < 4; k++) {
    x.fillStyle = (r + k) % 2 ? 'rgba(157,175,147,.5)' : 'rgba(213,154,78,.35)';
    x.beginPath(); x.arc(120 + k * 90, 130 + r * 85, 16, 0, Math.PI * 2); x.fill();
  }
  for (let i = 0; i < 20000; i++) { x.fillStyle = `rgba(80,60,40,${R(0.02, 0.06)})`; x.fillRect(R(0, 512), R(0, 768), 1, R(1, 3)); }
  return tex(c, [1, 1]);
}

// Abstraktes Bild für die Wand
export function art(seed = 0) {
  const [c, x] = canvas(512, 640);
  const pal = [['#EFE6D6', '#9DAF93', '#D59A4E', '#2F3E37'], ['#F2EBDD', '#C9B79C', '#6E8A7C', '#E3A857']][seed % 2];
  x.fillStyle = pal[0]; x.fillRect(0, 0, 512, 640);
  x.fillStyle = pal[1]; x.beginPath(); x.arc(200, 280, 150, 0, Math.PI * 2); x.fill();
  x.fillStyle = pal[2]; x.beginPath(); x.arc(330, 380, 110, 0, Math.PI * 2); x.fill();
  x.strokeStyle = pal[3]; x.lineWidth = 6; x.beginPath(); x.moveTo(60, 560); x.bezierCurveTo(200, 470, 320, 600, 460, 500); x.stroke();
  for (let i = 0; i < 6000; i++) { x.fillStyle = `rgba(0,0,0,${R(0.01, 0.04)})`; x.fillRect(R(0, 512), R(0, 640), 1, 1); }
  return tex(c, [1, 1]);
}

// Fußmatte „Willkommen“
export function doormat() {
  const [c, x] = canvas(512, 256);
  x.fillStyle = '#8A6A45'; x.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 26000; i++) { x.fillStyle = `rgba(${R(40, 90)},${R(30, 60)},${R(15, 35)},${R(0.15, 0.4)})`; x.fillRect(R(0, 512), R(0, 256), 1, R(2, 5)); }
  x.fillStyle = 'rgba(40,28,16,.85)';
  x.font = 'italic 300 86px Fraunces, Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('Willkommen', 256, 132);
  return tex(c, [1, 1]);
}

// Tischkarte am Empfang
export function card(text1, text2) {
  const [c, x] = canvas(512, 320);
  x.fillStyle = '#FBF7F0'; x.fillRect(0, 0, 512, 320);
  x.fillStyle = '#2F3E37'; x.textAlign = 'center';
  x.font = 'italic 300 54px Fraunces, Georgia, serif'; x.fillText(text1, 256, 140);
  x.font = '500 26px "Hanken Grotesk", Arial, sans-serif'; x.fillStyle = '#6E7F76'; x.fillText(text2, 256, 205);
  return tex(c, [1, 1]);
}

// Buchrücken-Farben
export const BOOK_COLORS = ['#7C8F7E', '#C9B79C', '#D59A4E', '#4F6B63', '#B5694A', '#E9DFCB', '#2F3E37', '#9DAF93', '#8E7A62'];
