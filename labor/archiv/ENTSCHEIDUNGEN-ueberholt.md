# Entscheidungen – überholte Abschnitte

Wörtlich ausgelagert am 24.11.2026 aus `ENTSCHEIDUNGEN.md` (Go Kai). Gilt nicht mehr für die laufende Seite; nur zum Nachschlagen.

## Figur plus: Körperkonturen, Gehirn, Nervensystem (Auftrag Kai 16.11.2026) – Entwurfsseite `figur-plus.html`, **Einbau in Puls offen**
- **Kai:** deutlich menschliche Konturen; an Station 01 (Kopf) ein Gehirn; die Linien nach unten als Nervensystem aus dem Gehirn; **alles im bekannten Partikel-Stil** (also keine gestochene SVG-Lichtlinie mehr für die Bahnen).
- Umgesetzt als eigene Entwurfsseite (Kopie des Bausteins in `src/figur-plus`), Puls und `src/kopf-fuss` unverändert. Ablauf, Texte, Lösen und Weiter-Hinweis bleiben wie in Kapitel 01.
- Gestaltung: Kontur als eigene Punktlinie, Körper innen durchsichtiger, sobald die Nerven wachsen; Gehirn warmweiß (hebt sich von Bernstein = Spannung ab), Nerven Bernstein; Impulse vom Gehirn nach außen ruhig (~6 s), nach Merkregel „ruhig vor schnell“.
- **Runde 2 (Kai 16.11.: „genau die Richtung … Konturen noch besser und anatomischer“):** Figur nach echten Körpermaßen in anatomischer Grundstellung (Handflächen nach vorn, Finger, Zehen) + Oberflächen-Anatomie als feine Linien, die zurücktreten, sobald die Nerven wachsen.
- Schematisch, keine Lehrtafel (Hinweis im Fuß der Seite). Figur neutral, ohne Gesicht.
- Verworfen: Gehirn/Nerven als SVG-Linien über den Partikeln (Kai will Partikel) – bleibt nur als Rückfall ohne WebGL (gepunktet).

## Tür: Knöpfe erst mit offener Partikel-Tür (Idee Kai 16.11.2026, Go für eine Entwurfsseite) – **Tendenz C, Einbau in Puls offen**
- **Kai 16.11.: „C finde ich toll, aber bitte deutlich langsamere Animation, es soll entspannt auf der Seite sein. Und Ruhe ausstrahlen.“** → C beruhigt: Schritt 6,4 s statt 1,75 s, weiche Kurven, kein Schnellvorlauf, Knöpfe langsam nacheinander. Merkregel für neue Bewegungen auf der Seite: ruhig vor schnell.
- Entwurfsseite `tuer.html` mit zwei Varianten, Puls unverändert: **A „Tür im Text“** (Tür an der Stelle der Knöpfe, Blatt aus Partikeln schwingt auf und zerfällt, Linien-Rahmen bleibt) und **C-kurz „Ein Schritt hindurch“** (Dachlinie wird Türrahmen, Kamera geht hindurch; hängt an der Zeit, keine Extra-Strecke).
- Verworfen: B als eigene Variante (reine Linien-Tür; ihr Rahmen steckt in A), C mit eigener Scroll-Strecke (zu viel Weg vor dem Termin-Knopf).
- Feste Regeln für beide: läuft einmal, Knöpfe spätestens ~1,8 s nach dem Öffnen sichtbar, wenn sie im Bild sind (die erste Regel „höchstens ~1,5 s bis zum Termin-Knopf“ ist mit Kais Wunsch nach Ruhe gelockert; „Termin“ in der Kopfleiste bleibt immer erreichbar), Seite bleibt dunkel (kein „Licht ja“), Knöpfe immer per Tastatur erreichbar, „anhalten/reduzieren“/ohne JS = sofort offen.
- Vorschlag in der Entwurfsseite: nur drei Knöpfe, „E-Mail-Adresse kopieren“ bei der Adresse.

## Willkommenszeile im Start (Go Kai 15.11.2026: „C … gleich umsetzen, Antwortzeile auch“) – umgesetzt
- **Gewählt: C** – über „Spannung lösen.“ steht klein in Bernstein-Kursiv „Kommen Sie erst einmal an.“ (Einladung statt Aufgabe, passt zu §2 „ankommen dürfen“). Verworfen: A „Bevor wir anfangen:“, B „Willkommen. Zuallererst:“, D Überschrift ersetzen.
- **Antwortzeile:** Ist die Spannung auf 0, wechselt die Zeile zu „Gut. Jetzt können wir anfangen.“ (bleibt danach stehen). Überschrift, Unterzeile und Knöpfe unverändert.

## Offen aus der Prüfung (1.11.2026)
- Anrufbeantworter einrichten (Ansage passend zur Website); Weg für Nachrichten per E-Mail (Telekom-SprachBox oder UniFi Talk) ⚠ prüfen. Später WhatsApp.
- Grundriss stimmt nicht mit der echten Praxis überein (Kai, 1.11.) → Raumaufteilung und Therapien je Raum erst mit dem echten Scan festlegen.
- Porträt-Fotos: kommen später.
- Für die echte Seite: Favicon, Link-Vorschau (Open Graph), Praxis-Angaben für Google (strukturierte Daten), Seitentitel/Beschreibung final.
- Vor Livegang entfernen: Hinweis „Schematischer Grundriss …“, „· schematisch“, „Testseite 4“ in der Fußzeile.
- Rechtlich (Fachperson): Fußzeile verlinkt die neuen Rechtsseiten (`recht-*.html`); dort und im Wurzel-Impressum stehen noch „[Bitte ergänzen]“ (Behörde laut Urkunde, Berufshaftpflicht) – **öffentlich sichtbar**, Angaben von Kai nötig. „Osteopathische Ansätze“ bleibt (Kai, 1.11.) – Fachperson prüft mit.
- ~~Kapitelleiste PC: während der Hausordnung ist „05 Tür“ markiert~~ Erledigt 2.11. (§-Eintrag in der PC-Leiste).
- Übergangsseite (Wurzel) bei 320 px: Knopftext „Termin per E-Mail anfragen“ bricht zweizeilig um – Kosmetik, Wurzel nur nach Go.
- Live-Wix-Seite hopphysio.de (1.11. geprüft): Banner „Telefon funktioniert noch nicht“, Tippfehler „Atomsphäre“, 15/19 Bilder ohne Alt-Text, Telefon dort ohne „nur Anrufbeantworter“ → Aussagen widersprechen der neuen Seite.

## Offen für die echte Website
- Inhalte aus V10 übernehmen: nur Porträt Kai und Einblicke (Kai 2.11.: Körperkarte weg), im Haus unterbringen.
- ~~„12 Therapieformen“ (V10) vs. 11 aufgeführte Leistungen klären.~~ Erledigt 2.11.: 12 Einträge (Thermische Behandlung + Reizstrom getrennt, Manuthera Highlight).
- Grundriss aus V10 ist schematisch – echte Raumaufteilung? Später echter 3D-Scan der Praxis (Handy-App, Export als PLY) → als Punktwolke im gleichen Stil einsetzbar (`src/test-4/praxis.js` liefert dieselbe Datenform).
- Zuordnung Therapien → Räume im Rundgang ist eine Annahme (B1: MT, CMD, Atlas-Axis, Osteopathie, Schmerz, Fango/Reizstrom, Stoßwelle · B2: Manuthera, MT · Training: KG, Sport, Schlingentisch) – Kai prüft.
- Flüssigkeit auf echten Handys messen (Testumgebung ohne Grafikkarte).
- Seiten tragen `noindex`; Veröffentlichung erst nach Freigabe. Keine externen Abrufe (Schriften und Bibliotheken eingebettet).
- **Livegang-Vorbereitung (2.11.2026, nach Hosting-Entscheidung):** Build-Ziel `live` (siehe `LIVEGANG.md`): Labor-Reste entfernt, Titel/Beschreibung, Canonical, Favicon (SVG inline), `apple-touch-icon.png`, Open Graph mit `og.jpg` (aus der Seite mit deren Schriften gezeichnet), schema.org `Physiotherapy` mit Adresse/Telefon/Zeiten. Vorschau `labor/live/` (noindex) → Kai prüft. E-Mail läuft laut DNS (MX) über Google Workspace → im Datenschutz ergänzen.

## Porträt (31.10.2026, Entwürfe mit Beispiel-Büste)
- `portrait.html` (Quellen `src/portrait`): 1 „Spannung lösen“ (Stich, Foto erscheint unter Maus/Finger, heilt langsam zu), 2 „Aus Punkten wird ein Mensch“ (Scroll: Wolke → Gesicht → Foto mit leichter Tiefe), 3 „Echter 3D-Scan“ (gestochene Punktwolke in Echtfarben, dreht). Platzhalter-Büste wird im Browser gerendert (keine echte Person). Kais Foto kommt am 1.11.; für 2 zusätzlich Tiefenbild (kostenlos erzeugbar), für 3 Scan per iPhone-App.

## Design 2 „Zuhause“ – Haus als Startmenü (31.10.2026, Entwurf)
- `zuhause.html` (Quellen `src/zuhause`): ein Bildschirm, kein Scrollen. Gestochenes Partikel-Haus mit Einrichtung (gleiche Daten wie Puls · Scan) ist die Navigation; 7 Orte als Schilder + Raum-Leiste: 00 Tür (Termin & Kontakt), 01 Empfang (Willkommen), 02 Wohnzimmer (Hausordnung), 03 Behandlung 1 (Leistungen), 04 Behandlung 2 (Manuthera, mit Liegen-Bühne), 05 Training (Bewegung), 06 Dach (Wirbelsäule, Abschnitte als Reiter).
- **1.11.:** „Dach = Wirbelsäule“ ersetzt durch **Wirbelsäulen-Modell** auf Ständer in Behandlung 1 (Ort 04): Panel zeigt drehbare gestochene Wirbelsäule (gleiche Geometrie wie Kapitel 03), Abschnitt-Knöpfe C1–S1 lassen den Abschnitt am Modell leuchten. Reihenfolge: 00 Tür · 01 Empfang · 02 Wohnzimmer · 03 Behandlung 1 · 04 Wirbelsäule · 05 Behandlung 2 · 06 Training.
- Klick → Kamera fliegt hinein, Dach hebt sich, Wände vor der Kamera lösen sich auf (Puppenhaus-Blick); Inhalt als Panel rechts (PC) bzw. Blatt von unten (Handy); ‹ › / Pfeiltasten / Esc; Räume per Link direkt erreichbar (#manuthera usw.); „Klassische Ansicht“ verlinkt Puls · Scan. Texte aus Puls · Scan übernommen.
- Offen: Kai vergleicht mit Puls · Scan; Wirbelsäule dort nur als Karten (3D-Scan in der klassischen Ansicht); Porträt später als eigener Ort möglich.

## Zweites Konzept: „Hausbesuch“ (31.10.2026, nur PC)
- Auf Kais Wunsch frei entworfen, ohne V10-Vorlage: filmischer Rundgang durch ein warmes Haus (Haustür → Empfang mit Tee → Wohnzimmer → Behandlung → Training → Garten). Licht folgt der echten Tageszeit des Besuchers (umschaltbar: Morgen/Mittag/Abend/Nacht). Lichtpunkte im Raum öffnen die Therapien. Danach klassische Infoseiten (FAQ, Kontakt).
- Datei: `hausbesuch.html` (Quellen `src/haus`). Eigene Schriften: Fraunces + Hanken Grotesk (OFL, eingebettet).
- Offen: Kai vergleicht mit Puls · Scan; FAQ-Texte sind Beispieltexte und müssen geprüft werden.
