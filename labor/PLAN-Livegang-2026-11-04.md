# Plan Livegang Puls · Scan – Stand 4.11.2026 (zusammengeführt aus Prüfbericht 3.11. und Zweitmeinung 3.11.)

Ersetzt `PLAN-Stufe1-2026-11-03.md` (Stufe 1 ist seit Commit 5a1c15b umgesetzt: Tippflächen, Kontrast, Versorgung in der Karte, Manuthera-Hinweis, `text-wrap:pretty`, `prefers-contrast`, Schild in `<main>`).
Kennzeichnung [B]/[A]/[O] wie gewohnt. Regel: erst erörtern, dann „Go“. Wurzel nie ohne Go; `labor/` darf auf `main`.

## Abgleich der beiden Prüfungen (Kurz)
- Beide fanden: Rechtsangaben, Tippflächen, Gesicht fehlt, Navigation poetisch, mailto allein, FAQ/erster Termin, WebGL-Fallback, Porträt-Reveal, Stimme, Tageslicht, Splat-Scan, Terminbuchung per Link, keine Chatbots/WhatsApp.
- Nur Zweitmeinung (übernommen): **Startzeit-Profil** (Lang-Task 6,8 s PC / 15,4 s Handy gedrosselt im Container [B dort]), **`html.no-gl`-Fallback mit Standbildern**, **Leistungen-Eintrag in der Leiste**, **Kopieren-Knopf + Mail-Vorlage + vCard**, **„Physiotherapie Schorndorf“ im Hero-Text**, **Leistungs-Etiketten ohne Füllwörter**, **Skip-Link**, **`.ics`-Erinnerung**, **„Die Tür geht auf“ (Kapitel 05 hell)**, Kicker über der Figur am Handy, weißer Wirbelsäulen-Block beim Hereinscrollen [O].
- Nur Prüfbericht (bleibt): adaptive Qualität nach Bildrate, `prefers-contrast`, Lazy-3D als zweite Datei, schema.org-Erweiterung, Verzeichnisse/Google-Profil, DSK-Papier zur Terminbuchung, HWG „Osteopathische Ansätze“, Kapitel-Titel/URL je Abschnitt, CI mit Lighthouse/axe.
- Zweitmeinung nicht übernommen: Font-Subsetting (Fonts sind bereits auf ~220 Glyphen subsettet [B]); `mediump`-Risiko (keine Präzisions-Angaben im Code, three.js-Standard `highp` [B]); `FAQPage`-Schema (Rich Results seit 7.5.2026 abgeschaltet [B]); Mikro-Rückkehr (TDDDG).

---

## Stufe 2 – vor dem Livegang

### A1 · Startzeit (M1 Zweitmeinung) – größter Posten, Opus
Ist: `main.js` rechnet beim Modulstart synchron `bodyPoints/spinePoints/housePoints/logoPoints` (Z. 73, N = 64 000), `spineStipple` (Z. 320/321: 330 000 Schichten + 165 000 Körnung), `praxisScan` (Z. 864: 85 000), Manuthera-Bühne (Z. 1208) und Leistungs-Motive (Z. 1221). Die Mindestabstands-Raster nutzen Text-Schlüssel in `Map` (`shapes.js` 236, `manu/stipple.js` 45) [B].
Schritte (Variante A, empfohlen zuerst):
1. **Lazy nach Kapitel:** Wirbelsäule (`spineStipple`-Körnung/Schichten) erst bauen, wenn `#achse` in `rootMargin: '150% 0px'` kommt; `praxisScan` bei `#dach`; Manuthera-Bühne und Leistungs-Motive bei `#manuthera`/`#allTitle` (IntersectionObserver ist vorhanden, Z. 1171/1365). Hero braucht nur die Körper-Wolke; `spinePoints/housePoints/logoPoints` (Morph-Ziele derselben 64 000 Punkte) bleiben beim Start, sind aber klein.
2. **Zeitscheiben:** die Lazy-Builds in Blöcken von ~8 ms über `requestIdleCallback` (Fallback `setTimeout(0)`) laufen lassen, Fortschritt im Kapitel nur als sanftes Einblenden – kein Lang-Task > 200 ms.
3. **Raster numerisch:** Schlüssel `gx + gy*W + gz*W*H` (Int32) statt Strings; Versuche je Punkt begrenzen; `Float32Array` vorab allozieren. Erwartung: 3–5× schneller [A].
Variante B (nur wenn A auf Kais iPhone noch > 1 s Blockade zeigt): `spineStipple` + `praxisScan` in einen Web Worker (eigener esbuild-Eintrag, als Blob-URL in die Ein-Datei eingebettet; Typed Arrays transferieren).
Messung vorher/nachher: Playwright mit `cpuThrottlingRate: 4`, längster Task per `PerformanceObserver('longtask')`, Zeit bis erste Reaktion auf Scroll. Ziel: längster Task < 200 ms, Seite reagiert < 1 s nach First Paint.

### A2 · Fallback ohne WebGL (M2 Zweitmeinung, S10 Prüfbericht) – Sonnet
- `main.js` 62: schlägt `new THREE.WebGLRenderer` fehl → `document.documentElement.classList.add('no-gl')`; ebenso wenn Manuthera-/Leistungs-Bühne fehlschlagen.
- CSS `html.no-gl`: `.meter`, `.hand`, Wisch-Hinweise, „Fahren Sie mit der Maus…“-Spans ausblenden; je Kapitel ein Standbild einblenden.
- Standbilder: einmal im Container gerendert (`tools/shot.cjs`), als WebP ~30–60 KB je Kapitel (Hero-Figur, Wirbelsäule, Haus, Manuthera), **als eigene Dateien** in `labor/live/` (eigene Domain, kein Drittanbieter) – nicht in die HTML eingebettet. Ein Satz: „Die bewegte Ansicht braucht einen aktuellen Browser.“
- iOS-Lockdown-Modus schaltet WebGL ab [B Zweitmeinung] → so sieht die Seite trotzdem fertig aus.

### A3 · Navigation: Poesie + Nutzen (S1 beide) – Sonnet
- `page.html` 15–21: je Eintrag `<small>` als zweite Zeile: „01 Spannung · Start“, „02 Bewegung · Über HOP“, „03 Achse · Wirbelsäule“, „04 Dach · Rundgang & Leistungen“, „§ Hausordnung“, „05 Tür · Kontakt & Termin“. Zusätzlich Eintrag **„Leistungen“** → `#allTitle` (häufigste Suchabsicht).
- CSS: PC zweizeilig klein (`font-size:.6875rem`, `--mute`), Handy-Klappmenü mit Untertitel; `chapNow` zeigt Titel + Untertitel. Kapitel-Erkennung in `tick()` (navIdx) um den Leistungen-Eintrag erweitern (aktiv, wenn `#allTitle` im Bild).

### A4 · Kontakt: Kopieren, Vorlage, vCard, Öffnungsstatus (S3 beide) – Sonnet
- „Termin anfragen“: `mailto:` mit `subject=Terminanfrage` und `body=` Vorlage (Name · Rückrufnummer · Wunschzeiten · Verordnung vorhanden ja/nein · Beschwerde bitte erst im Gespräch). Daneben Knopf **„E-Mail-Adresse kopieren“** (Clipboard-API, Rückmeldung „Kopiert“ per `role="status"`, Fallback: Adresse markieren).
- **vCard** `hop-physiotherapie.vcf` (Name, Praxis, Adresse, Telefon, E-Mail, URL, Zeiten als NOTE) als echte Datei in `labor/assets/` → Build kopiert sie neben `og.jpg`; Link „Praxis im Telefon speichern“ im Facts-Block. Keine Nutzerdaten, kein Datenschutz-Zusatz nötig [A].
- **Öffnungsstatus** rein clientseitig (`Date`, Mo–Fr 8:30–19:30, Feiertage BW als feste Liste 2026/2027): unter „Zeiten“ eine Zeile „Heute geöffnet bis 19:30“ / „Morgen ab 8:30“; ohne JS bleibt die Zeitenliste.
- Datenschutzerklärung: kein neuer Abschnitt nötig (keine Übertragung); Google Workspace als E-Mail-Verarbeiter ergänzen (offen seit 2.11.).

### A5 · Hero-Text mit Ort (S8 Zweitmeinung) – Sonnet
- `.hero-sub`: „Physiotherapie in Schorndorf mit Kompetenz und Herz.“ (H1 bleibt „Spannung lösen.“). Option S7 (Kicker über die Figur am Handy) nur nach Kais Blick auf das iPhone.

### A6 · Leistungs-Etiketten mit Nutzwert (S4 Zweitmeinung) – braucht Kais Angaben
- Statt „Modern/Sanft/Individuell/Aktiv“: „Kasse · Privat“, „Verordnung nötig“, „auch Selbstzahler“, „Zertifikat“. Vorschlagsliste je Leistung legt Claude vor, Kai bestätigt (HWG: keine Versprechen).

### A7 · Skip-Link (P3 Zweitmeinung) – Sonnet
- Erster Link im `<body>`: „Zum Inhalt“ → `#start`, sichtbar nur bei Fokus (Puls-Stil, Bernstein).

### A8 · Rechtlich (M1 Prüfbericht / M3 Zweitmeinung) – Kai
- Behörde laut Urkunde, Berufshaftpflicht; Anwalt: „Osteopathische Ansätze“ (OLG Düsseldorf 2015 [A]) und „lindert“-Formulierungen.

### A9 · Am iPhone prüfen (Kai) – kein Code
- Figur/Kopf unter der Leiste (390×844), Kapitel-04-Einstieg beschnitten, Manuthera-Bühne am PC, weißer Wirbelsäulen-Block beim Hereinscrollen [O]. Erst danach entscheiden, ob Punktgröße mit Kameraabstand skaliert wird.

### A10 · Doku
- `ENTSCHEIDUNGEN.md` Zeile „Stufe 2 (Go …)“; `UEBERGABE.md` aktualisieren; `PLAN-Stufe1-2026-11-03.md` löschen (erledigt, Verlauf in Git).

---

## Stufe 3 – kurz nach dem Livegang
- Porträt aus Punkten + 3 Sätze Werdegang in Kapitel 02 (sobald Foto da) · Einblicke-Fotos je Raum im Rundgang · „Vor dem ersten Termin“ + FAQ (`<details>`), `.ics` „Erinnerung: Verordnung mitbringen“ · Google-Unternehmensprofil, Apple/Bing, Verzeichnisse · schema.org `["Physiotherapy","MedicalBusiness"]`, `geo`, `hasMap`, `sameAs` · Web-App-Manifest · CI (html-validate, Playwright+axe, Lighthouse-Action mit Budgets) · adaptive Qualität nach Bildrate · Dateien trennen (JS/Fonts eigene Dateien auf eigener Domain; „eine Datei“ war für die Vorschau, nicht für den Livegang nötig) – **Kai entscheidet**, weil es die bisherige Ein-Datei-Regel ändert.

## Stufe 4 – Ausbau (Kai entscheidet nach Sichtprüfung)
- **K1 „Die Tür geht auf“:** Kapitel 05 blendet von Dunkel in warmes Off-White/Bernstein-Licht (V10-Palette `--bg #F7F5EF`, `--txt #1C3038`), Partikel werden zu warmem Sonnenstaub, Leiste passt sich an. Als **Vergleich per URL-Parameter** `?licht=1` im selben Build (kein zweiter Build), damit Kai beide Zustände auf Handy und PC nebeneinander sehen kann. Alternativen zum Vergleich: K2 Hell/Dunkel-Umschalter (gespeichert wie „Bewegung“), K6 Abendlicht nach Uhrzeit. Empfehlung: K1 zuerst, weil es die Wärme in der Erzählung löst (draußen dunkel, drinnen Zuhause) und Kontaktdaten in Hell besser lesbar sind [B Zweitmeinung].
- Körper als Navigation („Wo tut's weh?“, Hotspots in `shapes.js` vorhanden) · Stimme (Hausordnung gelesen, MP3 eigen, opt-in) · Leichte Sprache „In einem Satz“ je Kapitel · Übungs-Bibliothek · Splat-Scan am PC (Scaniverse-Lizenz klären) · Unterseiten für Top-Leistungen.

## Verifikation (je Stufe)
1. `node build.mjs test-4 && node build.mjs live`; `git diff --stat origin/main..HEAD -- . ':(exclude)labor'` leer.
2. Playwright/axe (Scratchpad `tools/audit.cjs`) in 320/390/768/1440: 0 Treffer target-size, color-contrast, region; keine Konsolenfehler; kein Querscrollen.
3. A1: Lang-Task vorher/nachher mit `cpuThrottlingRate: 4` protokollieren (in ENTSCHEIDUNGEN eintragen).
4. A2: Lauf mit `--disable-webgl` (Playwright `args`): Standbilder sichtbar, keine Hinweise, Messer weg.
5. A4: vCard in iPhone-Kontakte importierbar (Kai), Clipboard-Knopf meldet „Kopiert“.
6. Kai prüft Vorschau `labor/live/` auf iPhone und PC; dann Go für Wurzel (`LIVE_ROOT=1`) laut LIVEGANG.md.
