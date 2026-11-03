# Übergabe – Stand 2.11.2026 (Livegang vorbereitet)

## Start-Prompt für einen neuen Chat (Claude Code, Repo kairaethel-eng.github.io)
> Lies `labor/CLAUDE.md`, `labor/UEBERGABE.md`, `labor/ENTSCHEIDUNGEN.md` und `labor/LIVEGANG.md` (nur Branch `main`). Puls · Scan geht auf hopphysio.de live (GitHub Pages + Domain). Hier meine Punkte: …

## Livegang (2.11.2026)
- Entscheidung Kai: **GitHub Pages mit Domain hopphysio.de**, Wix-Website wird abgelöst, Domain/E-Mail (Google Workspace) bleiben bei Wix. Plan, DNS-Ist-Zustand, Reihenfolge: `LIVEGANG.md`.
- Gebaut: `node build.mjs live` → Vorschau `labor/live/` (https://kairaethel-eng.github.io/labor/live/, noindex). Wurzel-Build `LIVE_ROOT=1 node build.mjs live` erst nach Go.
- Noch nötig vor dem Go: Kais Prüfung der Vorschau, Rechtsangaben (Behörde, Haftpflicht, Google Workspace im Datenschutz), Inhaltsfragen (siehe LIVEGANG.md „Reihenfolge“).

## Prüfung 1.11. abends (lokal auf Kais PC, portables Node im Scratchpad)
- Vollprüfung Puls · Scan (PC, Handy 375/320 px), Wurzelseiten, Live-Wix, Doku → Bericht `Desktop\Claude\claude hop v10\PRUEFBERICHT-Puls-Scan-2026-11-01.md`.
- Umgesetzt (Go): Motiv-Name Leistungen, Figur Hero Handy, Manuthera-Schild Tastatur, THREE.Timer; ENTSCHEIDUNGEN bereinigt (veraltete V10-/Wix-Zeilen, Manuthera-Widerspruch).
- Seit 2.11.2026: **Node.js LTS (v26) installiert, fester Klon `C:\Users\Kai\Desktop\Claude\hop-site`** (nur `main`). Bauen: `cd labor; npm ci; node build.mjs live`. Vorher nur portables Node im Scratchpad.

## Was gilt jetzt
- **V10 ist entfernt** (1.11., Kais Auftrag). Sicherung: ZIP bei Kai + Git-Verlauf bis Commit dd917c6.
- **Startadresse** https://kairaethel-eng.github.io/ = Übergangsseite (Quelle `src/start`, Build `node build.mjs start`), noindex, ohne Animation.
- **/impressum.html, /datenschutz.html** = neue Texte aus `src/recht` (Build `start-ds`, `start-imp`; ohne Labor-Hinweis, Links auf die Wurzel). Labor-Fassungen `recht-*.html` mit Labor-Hinweis.
- **Arbeitsstand Puls · Scan:** https://kairaethel-eng.github.io/labor/test-4-puls-scan.html (unverlinkt, noindex). Branch = `main` (gleicher Commit).
- Wix (hopphysio.de) nutzt Kais eigene Konfiguration, nicht dieses Repo.

## Am 1.11. erledigt (Details in ENTSCHEIDUNGEN.md)
- Prüfung von Puls · Scan + Korrekturen (Raumkarte PC, Kapitel-Menü Handy, Vorlesetexte, Figur, Tippflächen, Leiste schmale Handys, Speicherung nur nach Klick).
- Kais Antworten eingebaut: Zeiten, Abrechnung, antippbarer Kontakt, Telefon „nur Anrufbeantworter“, ich-Form, Wirbelsäule „Schichten“, Werbeaussagen entschärft.
- Klickbares kenntlich (Herzschlag Termin, Scan über Knopf-Gruppen, „+“ bei Leistungen, Wisch-Hinweise).
- Impressum/Datenschutz neu (GitHub Pages, keine Cookies, LfDI neue Adresse).

## Wartet auf Kai
- Behörde laut Erlaubnisurkunde, Berufshaftpflicht (Name + Sitz), E-Mail-Anbieter → in Impressum/Datenschutz eintragen, dann `start-ds`/`start-imp` + `recht-*` neu bauen.
- Visuelles Feedback zu Puls · Scan (iPhone + PC), Herzschlag-Stärke ok?
- Porträt-Fotos; echter 3D-Scan der Praxis (Grundriss stimmt nicht).
- Anrufbeantworter einrichten (Backlog-Projekt „anrufbeantworter-praxis“).

## Offen / später
- V10-Inhalte übernehmen (Körperkarte „Wo tut's weh?“, Einblicke), Leistungs-Motive prüfen, Flüssigkeit auf echten Handys.
- Vor Livegang: Labor-Hinweise entfernen („Schematischer Grundriss“, „· schematisch“, „Testseite 4“), Favicon, Link-Vorschau, strukturierte Praxis-Angaben, Hosting-Entscheidung, Fachperson für Rechtstexte.

## So schickt Kai Verbesserungen am sparsamsten
- **Eine** Nachricht, Bilder zugeschnitten, durchnummeriert: „Bild 1 (PC): … · Bild 2 (Handy): …“, am Ende „Go“.

## Prüfbericht und Plan (3.11.2026)
- Gründliche Prüfung (Render 320–2560 px, axe, Tastatur) plus Netz-Recherche: `labor/PRUEFBERICHT-IDEEN-Puls-Scan-2026-11-03.md`. Umsetzungsplan Stufe 1 (Muss-Punkte vor Livegang, wartet auf Kais Go): `labor/PLAN-Stufe1-2026-11-03.md`. Empfehlung: Stufe 1 in neuer Session mit Sonnet, nur CLAUDE.md + Plan lesen.
