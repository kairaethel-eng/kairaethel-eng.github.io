# Übergabe – Stand 1.11.2026 (Chat-Wechsel)

## Start-Prompt für einen neuen Chat (Claude Code, Repo kairaethel-eng.github.io)
> Lies `labor/CLAUDE.md`, `labor/UEBERGABE.md` und `labor/ENTSCHEIDUNGEN.md` im Branch `claude/3d-cinematic-website-effects-htd2aa`. Wir verfeinern die Testseite „Puls · Scan“. Hier meine Punkte (Screenshots + Liste): …

## Richtung
- **Favorit: Puls · Scan** (`test-4-puls-scan.html`). Design 2 „Zuhause“ (`zuhause.html`) bleibt als Vergleich; Kai findet Puls · Scan schöner, Ideen aus „Zuhause“ (Schilder im Haus) sind übernommen.
- Testadresse (öffentlich, noindex): https://kairaethel-eng.github.io/labor/ · Live-Seite V10 unverändert (außer Schreibweise „Lojer“, 31.10.).

## Puls · Scan – was fertig ist
- 01 Spannung (Partikel-Körper, Verspannungen lösen) · 02 Bewegung · 03 Achse (Scan, Kamerafahrt, Nerven, Versorgungsbahn; Beschriftungen jetzt auf einen Blick, Kapitel 440vh) · 04 Dach · § Hausordnung · 05 Tür.
- **Kapitel 04:** Haus + Einrichtung „gestochen“ (Möbel mit Kern, Scan-Linien), Röntgenblick von oben mit Schildern (Nummer · Raum · Untertitel, „00 Tür“ → Kontakt), Raum 04 als Bernstein-Knopf „Manuthera ▶ in Bewegung ansehen“; Rundgang **ohne Scrollen** (Raum-Knöpfe zweispaltig, ‹ ›, Pfeiltasten, Wischen, „Rundgang starten“); Wirbelsäulen-Modell steht in Behandlung 1.
- **Manuthera-Bühne** nach dem Rundgang (Lojer Manuthera 242, Traktion/Flexion/Seitneigung/Rotation, ziehen dreht).
- **Leistungen:** Haus ausgeblendet, Partikel-Motiv je Leistung (`services.js`).
- Größen wachsen auf großen Monitoren mit (rem), mehr Kontrast; „Bewegung anhalten“ gilt seitenübergreifend, Hinweis „Fortsetzen“ beim Laden.

## Weitere Labor-Seiten
- `zuhause.html` – Design 2 (Haus als Startmenü, 7 Orte inkl. Wirbelsäulen-Modell).
- `recht-impressum.html`, `recht-datenschutz.html` – Entwürfe im Puls-Stil, Texte wörtlich von der Live-Seite.
- `portrait.html` – 3 Porträt-Ideen mit Beispiel-Büste (1 Spannung lösen, 2 Aus Punkten wird ein Mensch, 3 Echter 3D-Scan).
- `manuthera.html` – Archiv der drei Manuthera-Entwürfe (A gewählt).

## Nächste Schritte
- **Porträt:** Kai schickt Fotos → in `src/portrait/bust.js` `renderPhoto` durch Foto ersetzen (Datenform { w, h, rgba, depth, canvas }); Kai wählt 1/2/3; danach Einbau in Puls · Scan.
- Kai prüft Leistungs-Motive einzeln (welche anpassen?).
- Rechtsseiten: Berufshaftpflicht eintragen, Hosting-Abschnitt passend machen, § 3/§ 5 nur bei Nutzung, Fachperson prüfen.

## Offen / später
- V10-Inhalte übernehmen: Körperkarte „Wo tut's weh?“, Porträt, Einblicke.
- „12 Therapieformen“ (V10) vs. 11 Leistungen klären; Zuordnung Therapien → Räume prüfen.
- Wirbelsäulen-Stil festlegen (Schichten oder Körnung), dann Umschalter entfernen.
- Echter 3D-Scan der Praxis (Handy-App, PLY) → `praxis.js`. Datenschutz: keine Patienten/Unterlagen im Bild.
- Flüssigkeit auf echten Handys messen (Testumgebung ohne Grafikkarte).
- Vor echter Veröffentlichung: Hosting-Entscheidung (Wix vs. GitHub Pages + Domain), Rechtstexte final.
- Private Claude-Vorschau (Artifact) ist älter als die Testadresse – Testadresse ist maßgeblich.

## So schickt Kai Verbesserungen am sparsamsten
- **Eine** Nachricht, Bilder **zugeschnitten** auf die betroffene Stelle.
- Bilder durchnummerieren, kurze Liste: „Bild 1 (PC): … · Bild 2 (Handy): …“.
- Pro Punkt: Gerät, Kapitel, Wunsch in einem Satz. Am Ende „Go“.
