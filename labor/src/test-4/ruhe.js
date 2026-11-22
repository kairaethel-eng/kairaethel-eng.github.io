// „Text ruhig“ (21.11.2026, Go Kai „A“; seit 22.11. Standard, Leuchtpille mit Vorschau und Staub-Auftritt): Knöpfe (.lp-btn) klappen die Textteile (.lp-x)
// ihres Bereichs (data-lp-for → .lp-zone) am Ort auf. Wirkt nur mit html.ruhe; ohne die Klasse steht alles offen (style.css).
// Es pulsiert höchstens ein Punkt: der oberste sichtbare, der noch nie geöffnet wurde. Auf der Studienseite (html.studie-ruhe)
// zusätzlich der Umschalter „bisher / ruhig“ unten links.
export function initRuhe() {
  const root = document.documentElement;
  const btns = [...document.querySelectorAll('.lp-btn')];
  if (!btns.length) return;
  const zone = (b) => document.getElementById(b.dataset.lpFor);
  const on = () => root.classList.contains('ruhe');
  // Vorschau (22.11.2026): die erste Zeile des verborgenen Texts läuft über der Pille aus (aus dem Inhalt gebildet, nie doppelt gepflegt)
  const say = (el) => (el.matches('ul,ol') ? [...el.children].map((li) => li.textContent.trim()).join(' · ')
    : el.querySelector('dd') ? el.querySelector('dd').firstChild.textContent.trim() : el.textContent.replace(/\s+/g, ' ').trim());
  btns.forEach((b) => {
    const z = zone(b);
    let parts = [...z.querySelectorAll('.lp-x')].filter((el) => !el.matches('.dd-note,.vc,.sw-dev-line'));
    if (parts.length > 1 && z.firstChild === parts[0]) parts = parts.slice(1); // Teil vor dem Kernsatz: nicht als Vorschau
    const t = document.createElement('span'); t.className = 'lp-tease'; t.setAttribute('aria-hidden', 'true');
    t.textContent = parts.map(say).filter(Boolean).join(' · ').slice(0, 160);
    b.prepend(t);
  });
  // Auftritt (22.11.2026): beim ersten Hereinkommen sammelt sich feiner Staub zur Kugel – einmal je Knopf und Seitenaufruf
  const calm = () => root.classList.contains('paused') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dust = (b) => {
    const pill = b.querySelector('.lp-pill'), orb = b.querySelector('.lp-orb');
    if (!pill || !orb || !pill.animate || calm()) { b.classList.remove('lp-pre'); return; }
    const o = orb.getBoundingClientRect(), p = pill.getBoundingClientRect();
    const cx = o.left - p.left + o.width / 2, cy = o.top - p.top + o.height / 2, N = 14;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2, r = 44 + (i % 3) * 16; // gleichmäßig verteilt, kein Zufall
      const d = document.createElement('i'); d.className = 'lp-dust'; d.style.left = cx + 'px'; d.style.top = cy + 'px'; pill.append(d);
      d.animate([
        { transform: `translate(${(Math.cos(a) * r * 1.7).toFixed(1)}px, ${(Math.sin(a) * r * 0.6).toFixed(1)}px)`, opacity: 0 },
        { opacity: 0.6, offset: 0.3 },
        { transform: 'translate(0px, 0px)', opacity: 0.6, offset: 0.88 },
        { transform: 'translate(0px, 0px)', opacity: 0 },
      ], { duration: 1250, delay: (i % 7) * 40, easing: 'cubic-bezier(.3,.1,.2,1)', fill: 'both' }).finished.then(() => d.remove(), () => d.remove());
    }
    setTimeout(() => { b.classList.remove('lp-pre'); b.classList.add('lp-pop'); }, 1180);
  };
  const vis = new Set();
  const pick = () => {
    let best = null, bt = Infinity;
    if (on()) vis.forEach((b) => { if (b.classList.contains('seen')) return; const t = b.getBoundingClientRect().top; if (t < bt) { bt = t; best = b; } });
    btns.forEach((b) => b.classList.toggle('is-pulse', b === best));
  };
  const sync = () => { btns.forEach((b) => b.setAttribute('aria-expanded', String(!on() || zone(b).classList.contains('is-open')))); pick(); };
  btns.forEach((b) => b.addEventListener('click', () => {
    const z = zone(b), open = !z.classList.contains('is-open');
    z.classList.toggle('is-open', open);
    b.setAttribute('aria-expanded', String(open));
    b.classList.add('seen');
    pick();
  }));
  if ('IntersectionObserver' in window && !calm()) {
    btns.forEach((b) => b.classList.add('lp-pre'));
    const io0 = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io0.unobserve(e.target); dust(e.target); } }), { rootMargin: '0px 0px -12% 0px', threshold: 0.9 });
    btns.forEach((b) => io0.observe(b));
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => { es.forEach((e) => (e.isIntersecting ? vis.add(e.target) : vis.delete(e.target))); pick(); }, { rootMargin: '-8% 0px -8% 0px' });
    btns.forEach((b) => io.observe(b));
  }
  sync();
  if (!root.classList.contains('studie-ruhe')) return;
  const sw = document.createElement('div');
  sw.className = 'vsw-ruhe'; sw.setAttribute('role', 'group'); sw.setAttribute('aria-label', 'Studie: Textmenge vergleichen');
  sw.innerHTML = '<b aria-hidden="true">Text</b><button type="button" data-v="0">bisher</button><button type="button" data-v="1">ruhig</button>';
  const set = (v) => { root.classList.toggle('ruhe', v); sw.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(+x.dataset.v === +v))); sync(); };
  sw.addEventListener('click', (e) => { const x = e.target.closest('button'); if (x) set(x.dataset.v === '1'); });
  document.body.append(sw);
  // nur zeigen, wo es etwas zu vergleichen gibt (Leuchtpunkt oder Rundgang-Hinweis im Bild) – sonst läge er unten links über Text
  if ('IntersectionObserver' in window) {
    const near = new Set();
    const io2 = new IntersectionObserver((es) => { es.forEach((e) => (e.isIntersecting ? near.add(e.target) : near.delete(e.target))); sw.classList.toggle('is-away', !near.size); }, { rootMargin: '-40% 0px -40% 0px' }); // erst, wenn der Block die Bildmitte erreicht
    [...btns.map((b) => zone(b).closest('.manu,.sw-inner,.sw-more,.door-inner') || zone(b)), document.getElementById('lhHint')].filter(Boolean).forEach((t) => io2.observe(t));
    sw.classList.add('is-away');
  }
  set(new URLSearchParams(location.search).get('text') !== 'bisher');
}
