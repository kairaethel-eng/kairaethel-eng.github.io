# Puls · Scan – Prüfbericht und Ideen (3.11.2026)

Auftrag Kai: „maximal gründlich“ prüfen, was an Design, Aufbau, Struktur und Technik noch besser, moderner, innovativer und nutzerfreundlicher werden kann – bei gleichzeitiger Wärme des „Zuhauses“. Breite Recherche im Netz (Vorbilder, Bibliotheken, Skills, GitHub, Recht, Terminbuchung).

Kennzeichnung: **[B]** selbst geprüft bzw. in einer geöffneten Quelle genau so belegt · **[A]** abgeleitet/plausibel · **[O]** offen.
Regel bleibt: erst erörtern, dann „Go“. Dieser Bericht ändert nichts an der Seite.

---

## 0. Kurzfazit

- Die Seite ist technisch und gestalterisch schon auf einem Niveau, das deutsche Physio-Websites praktisch nie erreichen (keine deutsche Physio-Seite mit Award gefunden [O]; Physio-Seiten bei Awwwards liegen bei Community-Scores um 6,4 [B]). Keine Konsolenfehler, keine toten Anker, saubere Überschriften-Hierarchie, Landmarks, Fokus-Ringe überall, kein Querscrollen von 320 bis 2560 px [B].
- **Was noch fehlt, ist weniger Technik als Mensch:** kein Gesicht, keine Hände, keine echten Räume, kein „Über mich“, keine FAQ. Genau das macht aus einer beeindruckenden Inszenierung ein Zuhause. Die besten Vorbilder (Neko Health) legen Partikel **über echte Menschen**, nicht statt ihnen [B].
- **Vor dem Livegang** sind vier kleine Dinge zu fixen (Tippflächen, Kontrast gedimmter Karten, eine Beschriftungs-Kollision am Handy, doppelter Wisch-Hinweis) plus die bekannten Rechtsangaben und ein HWG-Risiko („Osteopathische Ansätze“).
- **Größter Nutzen-Hebel:** Kontakt/Zeiten/Termin ohne 14 Bildschirmhöhen Scrollen erreichbar machen („Tür“ als Blatt aus der Leiste) und ein Buchungslink. 64 % der Patienten haben schon auf einen Termin verzichtet, weil die Terminsuche zu schwierig war; 70 % finden Online-Terminbuchung hilfreich (Doctolib/YouGov 2026, n = 1.000) [B].
- Technik-Stack bleibt (three.js WebGL, GSAP, Lenis). WebGPU, Brotli-Tricks, Cursor-Effekte, Haptik lohnen nicht [B/A]. Lohnend: SplitText mit `aria:"auto"`, `text-wrap: pretty`, `prefers-contrast`, WebGL-Fallback-Poster, adaptive Qualität, 3D-Code als zweite eigene Datei nachladen.

---

## 1. Was geprüft wurde (und was nicht)

- Quellen: `labor/src/test-4/*`, `src/manu/ideaA.js`, Build `labor/live/index.html` (941 KB, **327 KB gzip** – GitHub Pages liefert gzip, kein Brotli [B, Header geprüft]), Rechtsseiten `live/impressum.html`, `live/datenschutz.html`.
- Gerendert mit Playwright/Chromium (SwiftShader, ohne Grafikkarte) in 1440×900, 2560×1440, 768×1024, 390×844, 320×568 und 1440×900 mit „Bewegung reduzieren“; je Kapitel Screenshots; axe-core 4.10 (WCAG 2.0/2.1/2.2 AA); Tastatur-Reihenfolge (28 Tab-Stopps); Überschriften, Landmarks, Anker, Tippflächen, Zeilenlängen, Schrift-Ladezustand, Speicher.
- **Grenzen:** SwiftShader ist 5–9 fps langsam, Kamerafahrten hängen nach – Bildfehler, die nur im Container auftreten, sind als [O] markiert. Kein echtes iPhone, keine Lighthouse-Performance-Zahlen (wären hier nicht aussagekräftig). Keine Google-Profil-Einsicht.
- Vier parallele Recherchen: Design-Vorbilder/Trends, Technik (three.js/GSAP/CSS/Lieferung/A11y), Praxis-Themen (Terminbuchung, Recht, SEO, Inhalte), Werkzeuge (Skills, MCP, CI, Bibliotheken, Assets). Quellen am Ende.
- Widerspruch notiert: Skill `hop-praxis` sagt „V10 bleibt live“; Repo seit 1.11. „V10 entfernt, Wurzel = Übergangsseite“ → Repo gilt (Vorschlag Skill-Pflege am Ende).

---

## 2. Was schon stark ist (ehrlich, ohne Schmeichelei)

- **Hero** sagt in einer Sekunde, was es ist, für wen und wo; Termin-Knopf oben rechts und im Hero; Spannungs-Messer als spielerische Einladung [B].
- **Kapitel 03 Achse** ist das Herzstück: Wirbelsäule gestochen, Nervenbahn ins Zielgebiet, Beschriftungen finden frei Platz, Silhouette glüht – fachlich und visuell glaubwürdig [B].
- **Kapitel 04** mit Röntgenblick, Rundgang ohne Scrollen, Manuthera-Bühne und Leistungs-Motiven ist genau das „Spotlight-Installation“-Muster, das prämierte Seiten nutzen (Iventions, CSSDA Oktober 2025) [B].
- **Barrierefreiheit** ist weit über Branchenstandard: „Bewegung anhalten“ als zentraler Schalter (WCAG 2.2.2), `prefers-reduced-motion`, Fokus sichtbar, `aria-pressed`, Vorlesetexte, Canvas mit `role="img"` [B].
- **Datenschutz:** keine Abrufe, keine Cookies, kein Banner – das ist ein echtes Alleinstellungsmerkmal gegenüber Wix/Doctolib-Seiten [B].
- **Rechtsseiten** im Puls-Stil, Inhaltsverzeichnis, Druck hell, sauber bis 320 px [B].

---

## 3. Befund – MUSS (vor Livegang)

| # | Befund | Beleg | Vorschlag |
|---|---|---|---|
| M1 | Impressum zeigt zweimal „[Bitte ergänzen]“ (Behörde laut Urkunde, Berufshaftpflicht) – öffentlich sichtbar | [B] `live/impressum.html` | Angaben von Kai; DL-InfoV § 2 I Nr. 11: Versicherer + räumlicher Geltungsbereich [A] |
| M2 | **Tippflächen der Abschnitts- und Raum-Punkte** (Handy/Tablet): 8×8 px, Abstand 8 px; die unsichtbare Vergrößerung per `::before` überlappt mit den Nachbarpunkten – axe „target-size“ (serious), 9 Elemente, bei 320/390/768 px | [B] axe + Messung | Punkte als Pille mit Beschriftung (C1 · C5 · Th · L4 · S1), mindestens 24 px Raster und 8 px Luft; oder die Punkte auf 12 px + 16 px Abstand (WCAG 2.5.8) |
| M3 | **Gedimmte Karten** (Handy/Tablet, Kapitel 03): nicht-aktive Karten laufen mit `opacity .55` (main.js 746) → Text 2,6:1 bzw. 3,7:1 statt 4,5:1; axe „color-contrast“ (serious), bis 14 Treffer auf Tablet | [B] | Nur den Rahmen dimmen, Text voll lassen; oder Deckkraft ≥ .8 |
| M4 | **Beschriftungs-Kollision Handy:** „Schienbein · Großzehe“ (Versorgungsbahn) liegt quer über dem Kartentitel „Lendenwirbelsäule“ (L4–L5); die Bahn-Beschriftung ist `position:fixed`, die Karte scrollt darunter | [B] Screenshot 390×844; auf iPhone prüfen | Am Handy die Bahn-Beschriftung in die Karte holen (Zeile „Versorgung: Schienbein · Großzehe“) oder nur zeigen, solange keine Karte im unteren Drittel steht |
| M5 | **HWG-Risiko „Osteopathische Ansätze“:** OLG Düsseldorf 8.9.2015 (I-20 U 236/13): Physiotherapeut ohne Heilpraktiker-Erlaubnis darf nicht mit Osteopathie werben; BVerwG 2019: keine sektorale HP-Erlaubnis Osteopathie | [A] Rechtsrecherche, Anwalt prüft (Kai, 1.11.) | Umbenennen in „Faszien- und Ganzkörperbehandlung“ o. ä., Zusatzqualifikation nennen; Beschreibungen „lindert“ → „kann unterstützen bei …“ (KG Berlin 3.12.2024: gesundheitsbezogene Werbung braucht gesicherte Erkenntnis, Beweislast beim Werbenden) |
| M6 | **Doppelter Hinweis Manuthera (Handy):** großer animierter Hinweis „Seitlich wischen“ plus Textzeile „Seitlich wischen zum Drehen“ direkt darunter | [B] | Textzeile am Handy entfernen (`.manu-hint` nur ≥ 921 px) |

---

## 4. Befund – SOLLTE (erste Wochen)

**Struktur und Botschaft**
- S1 **Kapitelnamen sind poetisch, nicht orientierend.** Patienten suchen „Leistungen“, „Kontakt“, „Über mich“. In der Leiste (PC) und im Kapitel-Menü (Handy) je einen Untertitel ergänzen: „03 Achse · Wirbelsäule“, „04 Dach · Praxis & Leistungen“, „05 Tür · Termin & Kontakt“. Kostet nichts, hilft jedem Erstbesucher [A].
- S2 **Kontakt liegt 14 Bildschirmhöhen tief** (PC: Seitenhöhe 14.292 px) [B]. „Termin“ in der Leiste springt dorthin, aber durch drei schwere 3D-Kapitel. Vorschlag „**Tür immer griffbereit**“: der Termin-Knopf öffnet ein Blatt (PC rechts, Handy von unten) mit E-Mail, Telefon, Zeiten, „Jetzt geöffnet · bis 19:30“, Adresse/Maps-Link, später Buchungslink. Kapitel 05 bleibt als Ziel. Muster: Sticky-CTA ist bei Praxis-Seiten Standard (studiomeyer, NN/g: Zeiten direkt neben der Nummer) [B].
- S3 **Kein „Über mich“.** Bei einer Einzelpraxis ist der Mensch die Praxis. Im Facts-Block steht nur „Inhaber · Manuelle Therapie · CMD“. Vorschlag: eigener Halt in Kapitel 02 (rechts neben dem Zitat ist am PC viel Platz [B]) mit Porträt, 3–4 Zeilen Werdegang, Qualifikationen als Chips. Patienten achten zu 73,8 % auf Website-Vertrauen/Info (Socialwave 2021) [B].
- S4 **Keine FAQ / „Erster Besuch“.** Inhalte, die Patienten wirklich suchen (IFK, Praxismarketing-Checklisten 2026) [B]: Verordnung muss innerhalb 28 Tagen begonnen werden (KBV, Stand 1.1.2026) [B]; Zuzahlung ab 18: 10 % + 10 € je Verordnung (KKH) [B]; Kasse/Privat/Selbstzahler; „Mitbringen: Verordnung, Versichertenkarte, bequeme Kleidung, Handtuch, Befunde“; Absage bis 24 h vorher (BGH 12.5.2022, III ZR 78/21) [B]; Dauer einer Sitzung; Parken; Barrierefreiheit der Praxisräume (Stufen? Aufzug?). Als natives `<details>`-Akkordeon im Puls-Stil, FAQ-Rich-Snippets gibt es seit 7.5.2026 ohnehin nicht mehr [B].
- S5 **„Ihr erster Besuch in 4 Schritten“** (Hinge-Health-Muster) [B]: Anfrage → Rückruf mit Terminvorschlag → erster Termin (Befund, Verordnung) → Behandlung + Heimprogramm. Passt in Kapitel 05 über den Facts-Block.
- S6 **mailto als einziger Weg:** am PC ohne eingerichtetes Mailprogramm passiert beim Klick nichts [A]. Adresse steht zwar daneben – zusätzlich „Adresse kopieren“ (Clipboard-API, ohne Abruf) und einen vorbefüllten Betreff/Body („Terminanfrage – Name, Rückrufnummer, Wunschzeit, Verordnung ja/nein“) anbieten. Hinweis „keine Gesundheitsangaben“ bleibt.

**Visuell (Kai prüft auf iPhone/PC)**
- S7 **Figur im Hero bei 390×844:** Kopf steht hinter der Leiste, direkt unter „Spannung“ [B Container]. In ENTSCHEIDUNGEN steht „⚠ auf Kais iPhone prüfen“ – hier bestätigt sich das Risiko. Bei 320×568 (altes iPhone SE) liegt die Figur komplett über der Überschrift [B].
- S8 **Kapitel 04 am Handy/Tablet beim Einstieg:** Haus wird oben und links beschnitten (Dach fehlt), Überschrift erst weit unten [B Container, evtl. Timing → prüfen].
- S9 **Manuthera-Bühne am PC im Container:** statt der Liege erschien das große Haus-Drahtgitter [O – sehr wahrscheinlich SwiftShader-Nachhängen, am PC prüfen].
- S10 **Ohne WebGL** bleibt die Seite lesbar, aber Hero/Achse/Dach sind leere Flächen ohne Hinweis [B Code]. Vorschlag: je Kapitel ein statisches Poster (PNG/SVG aus der Seite gerendert, ~20–40 KB) als Fallback und ein Satz „Die 3D-Ansicht braucht einen aktuellen Browser“. Trend-Quellen 2026: „3D so bauen, dass es ohne WebGL funktioniert“ [B].

**Technik und Leistung**
- S11 **Punktbudget PC:** 64.000 Partikel + 330.000 Schnittlinien-Punkte + 165.000 Körnung + 2.600 Rückenmark [B main.js 72/321/420]. Auf Notebooks mit integrierter Grafik könnte das ruckeln [O]. Vorschlag **adaptive Qualität**: in den ersten 2 s Bildzeit messen; unter ~40 fps DPR 1.6 → 1.2 und Körnung halbieren (ca. 30 Zeilen, kein Tracking).
- S12 **Lieferung:** 327 KB gzip ist auf 4G sekundär (~0,3–0,5 s), der Kostentreiber ist das Parsen von ~745 KB minifiziertem JS auf Mittelklasse-Handys [A]. Option ohne Drittanbieter: 3D-Code als **zweite Datei auf der eigenen Domain** per `import()` nach dem ersten Bild laden – Text steht sofort, Partikel folgen. Fonts sind bereits subsettet (~98 KB) [B]. Brotli: GitHub Pages liefert nur gzip, vorkomprimierte .br werden nicht verlässlich ausgeliefert → lohnt nicht [B].
- S13 **`prefers-contrast: more`** nicht berücksichtigt (Baseline widely): Text heller, Partikel dimmen – 5 Zeilen CSS [B].
- S14 **Kinetische Überschriften:** eigene Buchstaben-Spans; GSAP SplitText (seit 3.13 kostenlos inkl. aller Plugins, auch kommerziell [B]) setzt mit `aria:"auto"` automatisch `aria-label`/`aria-hidden` und splittet nach Font-Load neu (`autoSplit`) – weniger eigener Code, sicherer für Vorleseprogramme.
- S15 **Lenis:** `wheelMultiplier .6` + `lerp .055` ist bewusst ruhig (Kais Wunsch). Beobachten: manche Nutzer empfinden verlangsamtes Mausrad als „Scroll-Hijacking“ [A]. Touch bleibt nativ (`syncTouch:false`) – gut so [B].

**Sichtbarkeit und Daten**
- S16 **Lokal unsichtbar:** Suchen nach „Home of Physiotherapy Schorndorf“ / „hopphysio.de“ fanden die Praxis in keinem Verzeichnis (Das Örtliche, 11880, pflegesuche) [A]. Google-Unternehmensprofil-Status [O]. Vorschlag: Google-Unternehmensprofil (Terminlink dort hinterlegen), Apple Business Connect, Bing Places, Das Örtliche – alle kostenlos, Name/Adresse/Telefon überall identisch [B].
- S17 **schema.org erweitern:** `"@type": ["Physiotherapy","MedicalBusiness"]`, `geo`, `hasMap` (Maps-Link), `priceRange`, `sameAs` (Google-Profil); Google empfiehlt den spezifischsten LocalBusiness-Subtyp [B]. Mit dem Rich-Results-Test prüfen (kostenlos).
- S18 **One-Pager ohne Tiefenlinks:** Leistungen sind nicht einzeln verlinkbar/teilbar; Vorschlag `history.replaceState` + `document.title` je Kapitel (z. B. „Manuthera · HOP“), später 3–4 statische Unterseiten für die stärksten Leistungen (CMD, Manuthera, Stoßwelle, MT) im Puls-Stil ohne 3D – für Suchanfragen wie „CMD Schorndorf“ [A].
- S19 **Datenschutz:** GitHub Pages loggt IPs; Privacy Statement (27.4.2026) mit SCC + DPF, EuG 3.9.2025 bestätigt DPF [B/A] – § 1 der Datenschutzerklärung deckt das; Google Workspace als E-Mail-Verarbeiter ergänzen (offen seit 2.11.). WhatsApp: Bayerisches Ärzteblatt 5/2025: „nicht datenschutzkonform“ für Patientenkommunikation [B] → lieber nicht anbieten.
- S20 **BFSG:** Einzelpraxis ist als Kleinstunternehmen ausgenommen; reiner Link zu einer Fremd-Buchung löst keine Pflicht aus (Bundesfachstelle, BVKJ 6/2025) [B]. WCAG-Basics trotzdem halten – tun wir.

---

## 5. Befund – KANN (Feinschliff)

- K1 `text-wrap: pretty` für Fließtext (Chrome 117, Safari 26; Firefox ignoriert) – eine Zeile [B].
- K2 `@starting-style` + `transition-behavior: allow-discrete` für Hinweise/Blätter statt Klassen-Jonglage (Baseline 2024) [B].
- K3 **Scroll-driven Animations in CSS** (`animation-timeline: view()`, Safari ab 26.0, Baseline Newly) für Kapitel-Einblendungen und Fortschrittsbalken – läuft ohne Hauptthread; mit `@supports` und statischem Fallback. Kamerafahrten bleiben in JS [B].
- K4 **View Transitions** (same-document, Baseline Newly) für Raumwechsel im Rundgang und Panels in „Zuhause“ [B].
- K5 **Web-App-Manifest** (kein Service Worker): Name, Farben, Icon → „Zum Home-Bildschirm“ mit HOP-Icon; ohne Offline-Cache kein Risiko veralteter Inhalte [A].
- K6 Desktop-Leiste: Links 15 px hoch – WCAG 2.5.8 ist über die Abstands-Ausnahme erfüllt [B]; wer mag, `padding-block:.5rem`.
- K7 Kapitelleiste PC: während der Hausordnung ist „05 Tür“ markiert (bekannt, Kai entscheidet).
- K8 Anker `.manu-tag` liegt außerhalb der Landmarks (axe „region“, moderate) – in `<main>` verschieben [B].
- K9 Fußzeile mobil Rechtsseiten: „Zur Startseite“ fehlt in der oberen Leiste (nur PC) [B] – Logo verlinkt zwar, ein Textlink ist klarer.

---

## 6. Ideen für mehr Wärme („Zuhause“) – nach Wirkung sortiert

Alle kostenlos, alle ohne Drittabrufe. Kai entscheidet visuell; ich würde 1–3 zuerst bauen.

1. **Aus Partikeln wird ein Mensch.** Kais Porträt (kommt „diese Tage“) in Kapitel 02 rechts neben dem Zitat: beim Scrollen verdichten sich Partikel zum Gesicht, dann blendet das echte Foto durch (Entwurf 2 aus `portrait.html`). Dazu ein Foto der Hände bei der Arbeit. Vorbild Neko Health (14islands, Lovie Gold, FWA): „moving point clouds on top of people – um die Technik zu vermenschlichen“ [B]. Das ist der eine Baustein, der aus „beeindruckend“ „vertraut“ macht.
2. **Echte Räume im Rundgang.** Beim „Betreten“ eines Raums entwickelt sich aus dem Scan ein echtes Foto (Röntgenblick → Foto, Überblendung 1 s). Fotos: warm, Tageslicht, keine Personen (Datenschutz). Später ersetzbar durch den echten 3D-Scan (siehe 8).
3. **Licht als Wärmequelle.** Der Hintergrund #0A161B ist kühl-blaugrün. Warme Dark-Paletten (Amber auf Charcoal/Obsidian, „never pure black, always warm“) sind das Muster prämierter dunkler Seiten [A/B]. Test für Kai: Hintergrund minimal wärmer (z. B. Richtung #0C1416), ein warmer Lichtsaum hinter Hero-Text und CTA, beim Betreten des Hauses leuchten die Fenster bernstein. Fließtext ist schon warmes Off-White (#EDE8DC) – richtig so.
4. **Abendlicht nach Uhrzeit.** Bernstein-Anteil steigt gegen Feierabend; dazu in der Leiste/Tür „Jetzt geöffnet · bis 19:30“ bzw. „Morgen ab 8:30“ (20 Zeilen JS, nur `Date`, kein Tracking). Vorbild localghost.dev (Sunrise/Day/Sunset/Night mit `color-mix(in oklch)`, 2026) [B]. Wärme + Nutzen in einem.
5. **Handschrift.** Kais Unterschrift als SVG-Linie, die sich unter dem Zitat zeichnet (`stroke-dashoffset`, 0 Bytes Bibliothek); dazu `rough-notation` (3,8 KB gz, MIT) für einen handgezeichneten Kringel um „Zuhause“ [B]. Bei „Bewegung reduzieren“ statisch.
6. **Stimme.** 20 Sekunden Begrüßung von Kai, eigener Play-Knopf (opt-in, nie Autoplay, an den Bewegungsschalter gekoppelt). Eigene MP3 im Repo, kein Abruf. Sound-Design-Regel 2025: „every sound should serve a purpose“, Auto-Mute + sichtbarer Schalter [B].
7. **Begrüßung nach Tageszeit** im Hero-Kicker („Guten Morgen, Schorndorf.“) – Micro-Copy, 5 Zeilen.
8. **Hausordnung als Haustür-Schild**: § 1–5 zusätzlich als „Schild“ an der Tür im 3D-Haus (klick → Kapitel) – verbindet Haus und Werte.

**Große Option (später, Kai-Entscheidung):** „Tageslicht“-Modus – helle, warme Variante (Off-White #F7F5EF aus dem HOP-Design-System) für den Tag, Puls bei Nacht. Awwwards prämiert 2026 auch helle Health-Seiten (Institute of Health, Creme + Charcoal, WebGL) [B]. Aufwand hoch (Partikel-Farben, Scrims), darum erst nach dem Livegang testen.

---

## 7. Ideen für mehr Nutzen (Patientensicht)

1. **Tür-Blatt aus der Leiste** (S2) – wichtigster Hebel.
2. **Online-Terminbuchung per Link** (kein Widget): DSK-Positionspapier 16.6.2025 [B]: Auftragsverarbeitung zulässig, keine Einwilligung nötig, aber Information in der Datenschutzerklärung mit Nennung des Dienstleisters, nur nötige Daten, Telefon-Alternative. **Erst Optica Viva prüfen** (Leistungsbeschreibung nennt „Online-Terminbuchungen“ [B], Buchungslink/Kosten [O]) – Termine landen dann direkt im Kalender. Sonst deutsche Anbieter per Link: eTermin 19–29 €, Terminland 14,90–29,90 €, Timify Classic 0 € (Serverstandort unklar), meetergo Free 0 € (Nürnberg) [B]. Doctolib ab ~139 € mit Kontomodell und Dauerkritik → nein. Kostenpflichtiges nur nach Kais Freigabe.
3. **Beschwerde-Einstieg.** Kai hat die Körperkarte am 2.11. gestrichen – trotzdem der Hinweis: Hinge Health führt über Beschwerden („Rücken, Knie, Schulter …“), nicht über Methoden [B]. Leichte Variante ohne Karte: 6 Chips im Hero („Nacken · Rücken · Kiefer · Knie · Ferse · Schulter“) springen zum passenden Abschnitt/zur Leistung.
4. **FAQ + „Erster Besuch“** (S4/S5).
5. **Bewertungen:** Link „Bewertungen auf Google“ (kein Widget, keine Drittskripte); 2–3 wörtliche Auszüge nur mit Einwilligung und ohne Heilversprechen (HWG § 11) [B/A].
6. **Selbstzahler-Preise:** Preisverzeichnis in der Praxis ist Pflicht (§ 12 PAngV), auf der Website empfohlen [B]; USt bei Leistungen ohne Verordnung beachten [A].
7. **Heimprogramm/Übungen:** später kurze eigene Videos (keine YouTube-Einbettung; wenn, dann nur Link). Patienten wünschen „mehr Zeit“ und „Transparenz über Abläufe“ (Doctolib 2026) [B].
8. **KI-Chat auf der Seite: nein.** Nur 27 % wollen Chat mit dem Praxisteam; KI akzeptiert für Termine (72 %), nicht für Symptome; EU-AI-Act-Risiko [B]. Ein Telefon-/Terminassistent wäre das Thema, nicht die Website.

---

## 8. Technik – lohnt / lohnt nicht / später

| Thema | Urteil | Begründung |
|---|---|---|
| three.js WebGPURenderer / TSL | **nicht jetzt** | Handbuch: weiterhin „experimental“; `ShaderMaterial` nicht unterstützt → alle Partikel-Shader müssten nach TSL; Fallback-Bundle 792 → 1.155 KB; Firefox Android/Linux fehlen [B]. Vorbereitung: Shader in eigene Dateien isolieren. |
| GSAP SplitText, Observer, `gsap.matchMedia()` | **lohnt** | seit 3.13 komplett kostenlos; `aria:"auto"`, `autoSplit`; Observer für Wheel/Touch-Steuerung des Rundgangs [B] |
| Lenis behalten, ScrollSmoother nein | **lohnt** | Lenis MIT, `respectReducedMotion` Standard; ScrollSmoother bringt iOS-Jitter-Probleme und `position:fixed`-Zwänge [B] |
| CSS scroll-driven, `@starting-style`, `text-wrap: pretty`, `prefers-contrast` | **lohnt (progressiv)** | Safari seit 26.0; mit `@supports` [B] |
| View Transitions im Rundgang | **später** | Baseline Newly [B] |
| Lazy-3D als zweite eigene Datei | **lohnt** | First Paint vor dem Parsen von 745 KB JS; kein Drittanbieter [A] |
| Brotli, Speculation Rules | **nein** | Pages liefert nur gzip; One-Pager ohne Navigationen [B/A] |
| Service Worker/PWA | **später, nur Manifest jetzt** | Cache-Risiko bei Testseiten [A] |
| Cursor-Effekte, Vibration API | **nein** | Touch-irrelevant, A11y-Risiko; WebKit implementiert Vibration nie [B] |
| Sound | **nur opt-in, klein** | Web Audio ohne Bibliothek reicht [B] |
| Echter 3D-Scan der Praxis (Gaussian Splatting) | **machbar, später** | three.js 0.187 hat `SPLATLoader`; **Spark** (World Labs, MIT, „fast even on low-powered mobile“) liest PLY/SPZ/SOG; Handy-Scan 1–3 Mio. Splats → SPZ ≈ 25 MB, SOG kleiner; **nur als nachgeladene Datei aus dem eigenen Repo**, nie in die Single-File [B/A]. Scaniverse: Export PLY/SPZ kostenlos, **kommerzielle Rechte erst im Pro-Plan (50 $/Monat)** [B] → vor Nutzung klären; Polycam-Splat-Export nur bezahlt [B]. Keine Personen im Scan. |
| Adaptive Qualität (DPR/Punkte nach gemessener Bildrate) | **lohnt** | Don McCurdy-Budget für Mobil: < 100.000 Vertices [B]; wir liegen auf dem Handy bei ~160.000 Punkten [B] |
| WebGL-Fallback-Poster + `<noscript>` | **lohnt** | s. S10 |

---

## 9. Werkzeuge für Kais lokales Claude Code (alle kostenlos, alle geprüft [B])

**Skills/Plugins** (Marketplace bzw. `npx skills add …`):
- `ChromeDevTools/chrome-devtools-mcp` (54,7k ★, Apache-2.0, v1.12.0 22.10.2026): Performance-Trace mit LCP/CLS/INP-Insights, Lighthouse-A11y/SEO, CPU-/Netz-Drossel, Screenshots – **der wichtigste** für three.js/GSAP-Messung auf dem echten PC.
- `microsoft/playwright-mcp` (39,1k ★): A11y-Snapshots, Klicks, Screenshots je Viewport.
- `addyosmani/web-quality-skills` (3,0k ★, MIT): performance, core-web-vitals, accessibility (WCAG 2.2), seo, best-practices, Orchestrator `web-quality-audit`.
- `AccessLint/skills` (MIT): scan/inspect/audit/fix/diff – Fokusreihenfolge, Zoom/Reflow, WCAG-EM.
- `greensock/gsap-skills` (17,8k ★, offiziell): scrolltrigger, plugins, performance.
- `vercel-labs/agent-skills` → `web-design-guidelines` (33,5k ★): 100+ Regeln (ARIA, Fokus, reduced-motion, Dark Mode, Touch).
- `coreyhaines31/marketingskills` → `copywriting`, `copy-editing` (58,3k ★): für FAQ/„Erster Besuch“-Texte.
- `AgriciDaniel/claude-seo` (26,2k ★): `/seo audit URL` inkl. Local SEO und Schema.
- three.js: `CloudAI-X/threejs-skills` (3,9k ★, r186) oder `OpenAEC-Foundation/Three.js-Claude-Skill-Package` (24 Skills).
- Bereits aktiv: `obra/superpowers`, `website-design` (review-page, landing-page), `frontend-design`. UXKIN-Suche nur mit Bezahlplan (kein Free-Plan) [B] – nicht nötig.

**CI im Repo (GitHub Actions, für öffentliche Repos unbegrenzt kostenlos):** `npm run build` → `html-validate` → Playwright mit `@axe-core/playwright` (Handy + PC + reduced-motion) → `treosh/lighthouse-ci-action` mit Budgets (Performance ≥ 90, A11y = 100). Ergebnis: jede Änderung wird automatisch gegen Barrierefreiheit und Leistung geprüft – bevor Kai sie auf dem Handy sieht.

**Bilder/Assets kostenlos:** lokal FLUX.1 schnell (Apache-2.0) oder Z-Image Turbo in ComfyUI auf der RTX 2070 Super (8 GB, FP8/GGUF) [A/B]; Gemini-App nur für Einzelbilder (Free-Limits) [B]. Für Puls lieber **echte Fotos** – warm, Tageslicht, ruhig.

---

## 10. Vorschlag Reihenfolge

**Stufe 1 – vor Livegang (1–2 Sitzungen, Sonnet reicht für M2/M3/M4/M6):** M1–M6, S7 (Figur iPhone), S13, K1, K8; Datenschutz um Google Workspace ergänzen; Anwalt: HWG-Formulierungen + Osteopathie.
**Stufe 2 – erste Wochen (Opus für Neues):** Tür-Blatt (S2), Kapitel-Untertitel (S1), Porträt-Reveal (Idee 1) sobald Foto da, „Über mich“ (S3), FAQ + „Erster Besuch“ (S4/S5), mailto-Komfort (S6), WebGL-Poster (S10), adaptive Qualität (S11), schema.org (S17), Google-Profil/Verzeichnisse (S16), Buchungslink nach Viva-Klärung, CI (Abschnitt 9), Manifest (K5).
**Stufe 3 – später:** Raumfotos (Idee 2), Licht/Abendlicht (3/4), Unterschrift/rough-notation (5), Stimme (6), Lazy-3D (S12), Unterseiten (S18), 3D-Scan, Tageslicht-Modus.

**Kosten:** alles in Stufe 1–3 kostenlos, außer: Terminbuchungs-Dienst (0–30 €/Monat je nach Anbieter) und ggf. Scaniverse Pro für kommerzielle Scan-Rechte (50 $/Monat) – beides nur nach Kais Freigabe.

---

## 11. Offen / Nächster Schritt

- **Kai:** Welche Muss-Punkte „Go“? Figur-Position und Kapitel-04-Einstieg auf dem iPhone ansehen (S7/S8), Manuthera am PC (S9). Entscheidung zu Idee 1–3 und zum Tür-Blatt. Rechtsangaben (M1). Viva-Terminbuchung nachsehen.
- **Skill-Pflege (Vorschlag):** `hop-praxis` → `references/website-v10.md`: „V10 entfernt (1.11.), Wurzel = Übergangsseite; Puls · Scan geht auf hopphysio.de live (GitHub Pages + Domain, 2.11.); Prüfbericht/Ideen 3.11. in `labor/PRUEFBERICHT-IDEEN-Puls-Scan-2026-11-03.md`“ – übernehmen?
- **Backlog-Kandidaten:** Tageslicht-Modus, 3D-Scan der Praxis (Scaniverse-Lizenz klären), Unterseiten für Leistungen, Audio-Begrüßung.

---

## Quellen (Auswahl, alle am 3.11.2026 geöffnet oder in Suchergebnissen gesehen)

Design/Vorbilder: 14islands.com/neko · sanity.io/projects/neko · hingehealth.com · physiosolutions.co.uk · ouraring.com · instrument.com/work/oura-smart-ring · awwwards.com/sites/institute-of-health · awwwards.com/sites/101-physio · lovable.dev/guides/dark-mode-website-examples-guide · localghost.dev/blog/time-based-background-colour-transitions-with-temporal-and-css-color-mix/ · blog.readymag.com/sound-on-the-web/ · hontran.dev/blog/best-award-winning-websites-2026 · studiomeyer.io/de/blog/web-design-for-doctors · studiomeyer.io/de/blog/webdesign-trends-2026 · line25.com/articles/web-design-trends-2026/
Patienten: media.doctolib.com/image/upload/mkg/file/digital-health-report-2026.pdf · praktischarzt.de/magazin/umfrage-darauf-achten-patienten-bei-der-arztsuche/ · nngroup.com/articles/healthcare-customer-journeys/
Technik: threejs.org/manual/pages/webgpurenderer.html · web.dev/blog/webgpu-supported-major-browsers · utsubo.com/blog/webgpu-threejs-migration-guide · gsap.com/blog/3-13/ · gsap.com/community/standard-license/ · gsap.com/docs/v3/Plugins/SplitText/ · github.com/darkroomengineering/lenis · webkit.org/blog/17333/webkit-features-in-safari-26-0/ · github.com/mdn/browser-compat-data · web.dev/articles/font-best-practices · github.com/community/community/discussions/21655 · w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html · w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html · w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html · threejs.org/docs/pages/SPLATLoader.html · github.com/sparkjsdev/spark · github.com/nianticlabs/spz · blog.playcanvas.com/playcanvas-adopts-sogs-for-20x-3dgs-compression · radiancefields.com/platforms/scaniverse · poly.cam/pricing
Praxis/Recht: datenschutzkonferenz-online.de (DSK-Positionspapier Terminverwaltung 16.6.2025) · zm-online.de (Doctolib/CNIL 1.4.2025) · gesetze-im-internet.de (HWG §§ 3, 11; DDG § 5; BFSG §§ 2, 3; PAngV § 12) · aekno.de Rheinisches Ärzteblatt 4/2025 · bayerisches-aerzteblatt.de 5/2025 · baden-wuerttemberg.datenschutz.de FAQ Arztpraxis · bundesfachstelle-barrierefreiheit.de FAQ · bvkj.de BFSG-Info 6/2025 · docs.github.com (Pages, Privacy Statement 27.4.2026) · developers.google.com (FAQ-Rich-Results-Ende 7.5.2026; LocalBusiness) · schema.org/Physiotherapy · support.google.com/business/answer/6218037 · kbv.de/html/heilmittel.php · kkh.de/leistungen/heilmittel · etl-rechtsanwaelte.de 2.6.2025 · anwaltverein.de 22.1.2024 · ifk.de Praxisgründungs-ABC · etermin.net · terminland.de/preise · timify.com/de-de/pricing · meetergo.com · cal.com/pricing
Werkzeuge: github.com/anthropics/skills · github.com/ChromeDevTools/chrome-devtools-mcp · github.com/microsoft/playwright-mcp · github.com/addyosmani/web-quality-skills · github.com/AccessLint/skills · github.com/greensock/gsap-skills · github.com/vercel-labs/agent-skills · github.com/coreyhaines31/marketingskills · github.com/AgriciDaniel/claude-seo · github.com/CloudAI-X/threejs-skills · github.com/OneRedOak/claude-code-workflows · github.com/GoogleChrome/lighthouse-ci · github.com/treosh/lighthouse-ci-action · github.com/html-validate/html-validate · github.com/rough-stuff/rough-notation · github.com/uxkin/agent
