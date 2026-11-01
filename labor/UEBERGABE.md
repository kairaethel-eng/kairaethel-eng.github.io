# Übergabe – Stand 1.11.2026 abends (Chat-Ende)

## Start-Prompt für einen neuen Chat (Claude Code, Repo kairaethel-eng.github.io)
> Lies `labor/CLAUDE.md`, `labor/UEBERGABE.md` und `labor/ENTSCHEIDUNGEN.md` (Branch `main`; der Arbeitszweig `claude/3d-cinematic-website-effects-htd2aa` steht auf demselben Stand). Wir verfeinern „Puls · Scan“. Hier meine Punkte: …

## Prüfung 1.11. abends (lokal auf Kais PC, portables Node im Scratchpad)
- Vollprüfung Puls · Scan (PC, Handy 375/320 px), Wurzelseiten, Live-Wix, Doku → Bericht `Desktop\Claude\claude hop v10\PRUEFBERICHT-Puls-Scan-2026-11-01.md`.
- Umgesetzt (Go): Motiv-Name Leistungen, Figur Hero Handy, Manuthera-Schild Tastatur, THREE.Timer; ENTSCHEIDUNGEN bereinigt (veraltete V10-/Wix-Zeilen, Manuthera-Widerspruch).
- Kais PC hat kein Node.js und keinen Klon; Bauen lokal nur mit portablem Node (Scratchpad) oder in der Cloud.

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
