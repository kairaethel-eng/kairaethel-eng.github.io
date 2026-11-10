/* Entscheidungs-Liste: Auswahl je Frage → Kurzantwort („Go: 1A 2B …“) zum Kopieren in den Chat. Auswahl bleibt nur in diesem Browser gemerkt. */
(function () {
  var form = document.getElementById('dec'), out = document.getElementById('antwort'), btn = document.getElementById('kopieren'), st = document.getElementById('kopiert');
  if (!form || !out) return;
  var KEY = 'hop-konzept-auswahl';
  function read() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } }
  function write(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* ohne Speicher geht es auch */ } }
  function state() { var v = {}; form.querySelectorAll('input[type=radio]:checked').forEach(function (i) { v[i.name] = i.value; }); form.querySelectorAll('fieldset[data-multi]').forEach(function (f) { var s = ''; f.querySelectorAll('input[type=checkbox]:checked').forEach(function (i) { s += i.value; }); if (s) v['q' + f.getAttribute('data-nr')] = s; }); return v; }
  function show() {
    var v = state(), parts = [];
    form.querySelectorAll('fieldset[data-nr]').forEach(function (f) { var n = f.getAttribute('data-nr'); if (v['q' + n]) parts.push(n + v['q' + n]); });
    out.textContent = parts.length ? 'Go: ' + parts.join(' ') : 'Noch nichts gewählt';
    if (st) st.textContent = '';
  }
  var saved = read();
  Object.keys(saved).forEach(function (k) { var i = form.querySelector('input[type=radio][name="' + k + '"][value="' + saved[k] + '"]'); if (i) { i.checked = true; return; } String(saved[k]).split('').forEach(function (ch) { var c = form.querySelector('input[type=checkbox][name="' + k + '"][value="' + ch + '"]'); if (c) c.checked = true; }); });
  form.addEventListener('change', function () { write(state()); show(); });
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  if (btn) btn.addEventListener('click', function () {
    var t = out.textContent;
    var done = function () { if (st) st.textContent = 'Kopiert. Füge die Zeile in den Chat ein.'; };
    var fallback = function () { var r = document.createRange(); r.selectNodeContents(out); var s = getSelection(); s.removeAllRanges(); s.addRange(r); if (st) st.textContent = 'Markiert – bitte kopieren (Strg+C bzw. Kopieren).'; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, fallback); else fallback();
  });
  show();
})();
