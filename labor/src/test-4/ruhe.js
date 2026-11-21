// „Text ruhig“ (Studie textruhe.html, 21.11.2026, Go Kai „A“): Leuchtpunkt-Knöpfe (.lp-btn) klappen die Textteile (.lp-x)
// ihres Bereichs (data-lp-for → .lp-zone) am Ort auf. Wirkt nur mit html.ruhe; ohne die Klasse steht alles offen (style.css).
// Es pulsiert höchstens ein Punkt: der oberste sichtbare, der noch nie geöffnet wurde. Auf der Studienseite (html.studie-ruhe)
// zusätzlich der Umschalter „bisher / ruhig“ unten links.
export function initRuhe() {
  const root = document.documentElement;
  const btns = [...document.querySelectorAll('.lp-btn')];
  if (!btns.length) return;
  const zone = (b) => document.getElementById(b.dataset.lpFor);
  const on = () => root.classList.contains('ruhe');
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
