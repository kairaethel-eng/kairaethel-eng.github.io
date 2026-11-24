# HOP-Website (kairaethel-eng.github.io) – Einstieg für Claude

Dieses Repo ist die GitHub-Pages-Site von Kai Raethel (HOP – Home of Physiotherapy, Schorndorf).
Die vollständige Arbeitsanweisung liegt im Labor und wird hier eingebunden:

@labor/CLAUDE.md

## Nur für die Wurzel
- **Seit 24.11.2026 ist die Wurzel offline** (Kai: „Seite erst mal offline setzen, es gibt eine Live-Seite bei Wix“, Wahl „Startseite weg, Vorschau bleibt“): die drei Wurzel-Dateien sind entfernt, `robots.txt` sperrt alles, `.nojekyll` verhindert, dass GitHub die README als Startseite zeigt. Die Vorschau `/labor/live/` bleibt (noindex). Rückweg: Commit davor wiederherstellen.
- Die drei Wurzel-Dateien `index.html`, `impressum.html`, `datenschutz.html` werden **gebaut** (`labor/build.mjs`), nie von Hand geändert und **nie ohne ausdrückliches Go** von Kai ersetzt. Alles, was auf `main` landet, ist sofort öffentlich.
- Livegang Puls · Scan auf hopphysio.de: Plan, DNS-Ist-Zustand und Reihenfolge in `labor/LIVEGANG.md`. Die Wix-Website und die Domain-/E-Mail-Verwaltung bei Wix bleiben unberührt, bis Kai das Go gibt.
- Lokaler Klon: `C:\Users\Kai\Desktop\Claude\hop-site`, nur Branch `main`, Node LTS installiert. Bauen: `cd labor; npm ci; node build.mjs live`. Build-Ausgabe immer mit LF.
- Vor jeder Arbeit lesen: `labor/CLAUDE.md`, `labor/UEBERGABE.md`, `labor/ENTSCHEIDUNGEN.md`, `labor/LIVEGANG.md`. Danach pflegen, nicht nur bauen.
- Keine Zugangsdaten, keine Patientendaten, keine persönlichen Skills in diesem Repo.
