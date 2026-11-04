# Übergabe – Stand 4.11.2026 (Stufe 2b; Livegang vorbereitet seit 2.11.)

## Start-Prompt für einen neuen Chat (Claude Code, Repo kairaethel-eng.github.io)
> Lies `labor/CLAUDE.md`, `labor/UEBERGABE.md`, `labor/ENTSCHEIDUNGEN.md` und `labor/LIVEGANG.md` (nur Branch `main`). Puls · Scan geht auf hopphysio.de live (GitHub Pages + Domain). Hier meine Punkte: …

## Stand 4.11.2026 abends – zwei Aufträge für neue Sessions (beide: Go Kai)
Auf `main` liegt alles bis Commit „Rundgang aus Augenhöhe – Machbarkeitstest“. Neue Session: `git pull`, dann `labor/CLAUDE.md` + diesen Abschnitt lesen. Veröffentlichen wie immer: nur `labor/` auf `main`.

**Auftrag 1 · Paket Handy Kapitel 03 → 04 (Opus)** – Quelle `src/test-4/main.js` (`PH`, `mobileCard`, `stopPose`, `updateAxis`, `roofEmblem`, `layout()` X[2]/X[3]), `style.css` (`.seg-cards`, `.seg-card`, ≤ 920 px). Nur Handy/Tablet, PC unverändert. Kais Beobachtungen (iPhone, 9 Bilder):
1. C1–C2: Die erste Karte läuft früh durch die Wirbelsäule (verdeckt sie). → Karten erst einblenden, wenn die Kamera am Abschnitt steht (ca. ab 60 % Bildhöhe), Wirbelsäule vorher frei.
2. Nächste Karte verdeckt den erklärten Bereich (Hals/Nerven). → Kamera/Wirbelsäule über dem Kartenanfang halten, Karte nur im unteren Bildteil, von unten einblenden.
3. Bild mit Wirbelsäule + Karte über den ganzen Bildschirm (C5–C6) passt – nicht anfassen.
4. Nach der letzten Karte wird die Wirbelsäule klein und liegt oben, darunter toter Bereich. → Am Ende groß, zentriert, ganz sichtbar (Kopf bis Kreuzbein), etwas stehen lassen, dann auflösen (Kais Highlight).
5. Das Haus entsteht nur im oberen Bildschirm. → Wirbelsäule löst sich nach oben auf, Haus aus der Bildmitte, größer (Handy-Skalierung/Position anpassen).
6. Toter Bereich unten bis der Text von Kapitel 04 kommt. → Text näher heranrücken oder Haus füllt den Raum.
Prüfen: 390×844, 390×664, 320×568 (iPhone-Safari-Leiste!), axe target-size/color-contrast/region = 0, keine Konsolenfehler. Kai gibt Erfolg per iPhone zurück.

**Auftrag 2 · Ego-Rundgang: Tür, Logo, Barrierefreiheit (Sonnet)** – Quelle `src/ego/{main.js,style.css,page.html}`, Build `node build.mjs ego` → `rundgang-ego.html` (https://kairaethel-eng.github.io/labor/rundgang-ego.html). Kais Rückmeldung: Fahrt „super geil“, Handy-Ansicht gut, kein Schwindel.
1. Tür: Start ca. 1,5 m weiter zurück (STOPS[0].at y≈320 → ≈360), Tür ganz sichtbar, kurze Pause, dann Aufgehen.
2. Logo-Schild **rechts neben der Tür** an der Außenwand, Augenhöhe: HOP-Kreise (Grün #7FAF45, Petrol #3C7189, Blau #3F86B5, Buchstaben H O P) als Punkt-/Linien-Umriss in eigener Gruppe (später gegen 3D-Scan austauschbar).
3. Ältere/sehschwächere Besucher: Lesezeit im Autoplay nach Textlänge (ca. 6–8 s statt 4,2 s), Kartentext ≥ 18 px mit mehr Kontrast, Schalter „Ohne Fahrt“ (Sprung mit kurzem Überblenden; automatisch bei „Bewegung reduzieren“ – das gibt es schon). Tempo „Ruhig“ (−40 %) und „Größere Punkte“ nur bei Bedarf.
Prüfen: 390 und 1440 px, Autoplay bis Ende, keine Konsolenfehler.

## Stand 4.11.2026 spät – Stufe 2b umgesetzt (Go: A3, A4, A5, A7; A6 nur Vorschlag)
Details `ENTSCHEIDUNGEN.md` → „Stufe 2b“. Auf `main` nur `labor/`.
- A3 Navigation zweizeilig (Untertitel), A4 Kontakt (mailto-Vorlage, E-Mail kopieren, vCard `hop-physiotherapie.vcf`, Öffnungsstatus), A5 Hero-Untertitel mit Ort, A7 Skip-Link. A6 Etiketten-Tabelle liegt nur in ENTSCHEIDUNGEN (Kai bestätigt). Stufe-1-Plan (gelöscht, Git-Verlauf) gelöscht.
- **Offen:** A6 Kais Bestätigung · A8 rechtlich (Kai) · A9 iPhone-Prüfung · Datenschutz: Google Workspace als E-Mail-Verarbeiter ergänzen · Wurzel erst nach Kais Go (`LIVEGANG.md`).

## Stand 4.11.2026 abends – Stufe 2a umgesetzt (Go: A1, A2, K1)
Commit auf Arbeitszweig `claude/hop-website-design-review-lwh3ps`, **noch nicht auf `main`** (Testadresse zeigt es erst danach). Messwerte und Details: `ENTSCHEIDUNGEN.md` → „Stufe 2a“.
- **A1 Startzeit:** Kapitel-Bühnen werden erst bei Annäherung gebaut (Wirbelsäule, Praxis, Manuthera, Motive), in Zeitscheiben ≤ 8 ms; Raster mit Zahlen-Schlüsseln (Praxis 6× schneller); kein erzwungenes Layout mehr im Start-Skript. Sichtprüfung intern: Wirbelsäule, Haus, Manuthera, Motive unverändert.
- **A2 ohne WebGL:** `html.no-gl`, Standbilder `assets/still-{hero,achse,dach,manu}.webp` (27–57 KB, Build kopiert nach `live/`), Satz „Die bewegte Ansicht braucht einen aktuellen Browser.“; geprüft mit `--disable-webgl` (390/1440), keine Konsolenfehler.
- **K1 „Die Tür geht auf“:** nur mit `?licht=1` – Hausordnung (letzte 60 %) blendet in Off-White, Kapitel 05/Leiste/Fuß hell, Sonnenstaub. Ohne Parameter unverändert. **Kai vergleicht** (keine Entscheidung getroffen).
- Mitgebaut (gemeinsame Module): `zuhause.html`, `manuthera.html`, `portrait.html` – ohne Fehler geprüft. Wurzel nicht angefasst.

**Kai prüft (iPhone + PC, nach Veröffentlichung auf main)**
1. Seite öffnen und sofort scrollen: reagiert sie gleich? Kapitel 03/04 und Manuthera-Liege erscheinen rechtzeitig (sanftes Einblenden)?
2. iPhone mit Lockdown-Modus (oder Chrome ohne Hardwarebeschleunigung): Standbilder + Satz statt Partikel?
3. `…/labor/live/?licht=1` gegen `…/labor/live/`: Übergang Hausordnung → Tür, Lesbarkeit Kontakt.

**Offen**
- [O] Direkter Sprung (Menü) zur Manuthera: Aufbau wartet hinter Wirbelsäule und Praxis (gedrosselt im Test ~8 s); auf echten Geräten am iPhone prüfen, sonst Variante B (Worker).
- [B] Rest-Lang-Tasks kommen vom Browser selbst (HTML/Schriften parsen, erstes Layout): schon ohne JS 320 ms bei CPU ×4.

## Stand 4.11.2026 – offene Punkte (Kai arbeitet sie später ab)
Erledigt 3./4.11. (Details `ENTSCHEIDUNGEN.md`): Stufe 1 aus Stufe-1-Plan (gelöscht, Git-Verlauf) (axe target-size/color-contrast/region = 0 bei 320/390/768/1440), ärztlicher Hinweis „immer zuerst ärztlich abklären“ (alle Labor-Seiten), Spannung bis 0 mit „Entspannt.“ + ruhigem Atem, Wisch-Hinweis Manuthera erst nach echtem Wischen weg, Vergleichsseiten test-1–3 gelöscht (Git-Verlauf bis 54d7812). Kais Sichtprüfung 3.11.: Stufe 1 passt.

**Kai prüft am iPhone**
1. Körper ganz freistreichen → Anzeige 0 und „Entspannt.“? Ruhiger Atem gefällt?
2. Manuthera-Liege: erscheint „Seitlich wischen“ jetzt (nach ~1,5 s)?

**Claude prüft (auf Zuruf)**
3. PC, Raum 04 im Rundgang: Schild „Manuthera ↓“ liegt seit Stufe 1 in `<main>` (Stapelebene von `main`, z-index 2) – sitzt es noch richtig über den Raumschildern?

**Braucht Kai / Fachleute**
4. Impressum: zuständige Behörde laut Erlaubnisurkunde, Berufshaftpflicht (Name + Sitz).
5. Heilmittelwerbegesetz: Formulierungen wie „Osteopathische Ansätze“ anwaltlich prüfen lassen.
6. `PLAN-Livegang-2026-11-04.md` (andere Sitzung, Entwurf) lesen und Go/Änderungen geben.

**Hinweise**
- „· schematisch“ fehlt am Handy seit Stufe 1 (doppelter Hinweis entfernt); passt zu „Labor-Hinweise vor Livegang entfernen“ (unten).
- Nur **eine** Sitzung gleichzeitig an `labor/` arbeiten lassen (am 4.11. zweimal fremde Commits zusammengeführt).
- Arbeitszweig `claude/hop-website-design-review-lwh3ps` ist seit Stufe 2a (4.11. abends) **vor** `main` – erst nach Kais Go auf `main` bringen, dann löschbar.
- Skill `hop-praxis` aktualisiert (Standard-Hinweis, Stand 4.11.) – als `.skill`-Datei an Kai geliefert.

## Zweitmeinung 3.11. (Cloud-Session, Fable 5.1)
- Unabhängige zweite Prüfung mit CPU-Profil des Seitenstarts, Test ohne WebGL, axe-core und Recherche (Vorbilder, Technik, Skills): `labor/PRUEFUNG-Zweitmeinung-Puls-Scan-2026-11-03.md`. Neu gegenüber dem Prüfbericht vom selben Tag: Start-Blocker durch synchrone Punktwolken-Berechnung (M1, Lazy/Worker), Fallback ohne WebGL inkl. iOS-Lockdown-Modus (M2), `mailto:`-Schwäche am PC (S3), Navigations-Untertitel aus Patientensicht (S1), Idee „Die Tür geht auf“ (K1), Werkzeug-Liste (Abschnitt 6).

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
- Gründliche Prüfung (Render 320–2560 px, axe, Tastatur) plus Netz-Recherche: `labor/PRUEFBERICHT-IDEEN-Puls-Scan-2026-11-03.md`. Umsetzungsplan Stufe 1 (Muss-Punkte vor Livegang, **umgesetzt 3.11.**): `labor/PLAN-Stufe1-2026-11-03.md`. Empfehlung: Stufe 1 in neuer Session mit Sonnet, nur CLAUDE.md + Plan lesen.
