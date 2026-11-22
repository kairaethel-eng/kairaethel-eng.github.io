// Entwurf „Haus mit Staub“ (21.11.2026): die Entwurfsseite „Licht im Fenster“ unverändert, dazu der Staub beim Raumwechsel.
import '../haus-licht/main.js';
import { initStaub } from './staub.js';

const staub = initStaub({ house: document.getElementById('house'), rooms: document.getElementById('rooms'), isPaused: () => document.documentElement.classList.contains('paused') });
window.__staub = staub;
// Hinweis, dass dies der Entwurf ist (Vergleich: haus-licht.html ohne Staub)
const n = document.createElement('p');
n.className = 'staub-note';
n.innerHTML = 'Entwurf vom 21.11.2026: Die Linien sind unverändert. Wechselt der Raum, zieht das Licht als feiner Staub hinüber. <a href="haus-licht.html">Zum Vergleich ohne Staub</a>';
document.querySelector('main')?.prepend(n);
