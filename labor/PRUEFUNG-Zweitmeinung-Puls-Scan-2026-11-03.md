# HOP „Puls · Scan“ – Gründliche Prüfung und Ideen (Stand 3.11.2026)

Geprüft: Livegang-Vorschau `labor/live/index.html` (Build vom 2./3.11.) im Container-Browser (Chromium/SwiftShader, kein echter Grafikchip) in 390 × 844 (Handy), 768 × 1024 (Tablet), 1440 × 900 (PC), 2560 × 1440 (großer Monitor), zusätzlich ohne WebGL, mit axe-core (WCAG 2.2 AA) und einem CPU-Profil des Seitenstarts. Nichts wurde verändert.

Kennzeichnung: **[B]** selbst geprüft/Quelle geöffnet · **[A]** abgeleitet · **[O]** offen.
Grenze: Flüssigkeit, Akku und Wärme auf einem echten iPhone kann ich hier nicht messen – das bleibt deine Prüfung.

---

## 0. Kurzfazit

Die Seite ist in ihrer Klasse ungewöhnlich: eine deutsche Physio-Einzelpraxis mit WebGL-Erzählung, ohne Tracker, mit Pause-Knopf, sauberer Überschriften-Struktur, Schema.org, Open Graph – die Recherche hat **keine** vergleichbare DACH-Praxis gefunden [B, 15 Suchen]. Das Design hat eine echte Handschrift (Bernstein auf warmem Petrol-Schwarz, Serif-Kursiv als Herz-Akzent, gestochene Partikel).

Drei Dinge halten sie noch vom „Knaller“ ab:

1. **Der Start blockiert.** Alle Punktwolken (Körper, 330 000 Wirbelsäulen-Punkte, Haus, Logo) werden synchron beim Laden gerechnet – ein einziger Lang-Task, bevor die Seite reagiert [B, Profil unten]. Auf schwachen Handys heißt das Sekunden dunkler Bildschirm.
2. **Es fehlt der Mensch.** Kein Foto, kein Gesicht, kein Raum – die ganze Wärme hängt an Partikeln. „Zuhause“ braucht ein Gesicht und echtes Licht (Porträt und Einblicke sind geplant, aber noch nicht da).
3. **Die Navigation spricht Poesie, nicht Patient.** „Dach“, „Achse“, „Tür“ sind schön, aber jemand mit Nackenschmerzen sucht „Leistungen“ und „Kontakt“.

Alles drei ist lösbar, ohne das Konzept anzutasten. Reihenfolge-Vorschlag am Ende (Abschnitt 9).

---

## 1. Was gut ist (und bleiben soll)

- **Konzept und Dramaturgie** 01 Spannung → 05 Tür erzählen Physiotherapie als Weg ins Haus; die Hausordnung als §-Kapitel ist ein eigenständiges Marken-Element. [B]
- **Barrierefreiheit über dem Standard:** Pause-Knopf (WCAG 2.2.2), `prefers-reduced-motion` mit Ruhemodus, Fokus-Ring in Bernstein, Überschriften in sauberer Reihenfolge (H1 → H2 → H3), alle Gruppen mit `role="group"` und Beschriftung, Canvas mit Alternativtext. axe findet auf dem PC **null** Fehler, am Handy nur Tippflächen (siehe 3.4). [B]
- **Datenschutz als Haltung:** keine externen Abrufe, keine Cookies, Maps nur als Link, Hinweis „keine Gesundheitsangaben“ an jedem Kontaktweg. Das ist besser als fast jede Praxis-Website (Medwest.Plus, prämiert, hat Marketing-Cookies). [B]
- **Mobile Bedienmuster** (Karten statt Kamerafahrt, Fortschritt „C1 ● ○ S1“, Wisch-Hinweise) sind durchdacht; der Termin-Knopf liegt am Handy im ersten Bildschirm. [B]
- **Großer Monitor (2560 px):** Schrift wächst mit, Layout bleibt proportional – geprüft. [B]
- **Rechtsseiten** im gleichen Stil, mit Inhaltsverzeichnis und Druckansicht. [B]

---

## 2. Befund nach Dringlichkeit

### 2.1 Muss (blockiert oder schadet)

**M1 · Startzeit: Punktwolken blockieren die Seite** [B]
- Messung im Container: PC ein Lang-Task von **6,8 s** vor dem ersten Bild, Handy mit 4-fach-CPU-Drossel **15,4 s** Blockade (First Paint zwar nach 0,5 s, aber die Seite reagiert erst danach auf Tippen/Scrollen). Der Container ist deutlich langsamer als ein iPhone; grob geschätzt 1–4 s auf einem drei Jahre alten Handy [A].
- CPU-Profil: ~70 % der Zeit in der Punkt-Verteilung mit Mindestabstand (`makeSlices`/`makeGrain`/`stipple`: Rasterzellen als **String-Schlüssel** in einer `Map`, bis zu 12 Versuche je Punkt) und in `MeshSurfaceSampler` (Binärsuche je Sample). [B]
- Empfehlung (Aufwand mittel, Wirkung groß):
  1. **Lazy:** Wirbelsäule (330 k Punkte) erst rechnen, wenn Kapitel 03 in Sichtweite kommt (IntersectionObserver mit großem `rootMargin`), Haus und Leistungs-Motive ebenso. Der Hero braucht nur die Körper-Wolke (64 k).
  2. **Nicht blockierend:** Erzeugung in Scheiben über `requestIdleCallback`/`setTimeout(0)` oder in einem **Web Worker** (Typed Arrays per `postMessage` transferieren; ein Worker passt auch in die Ein-Datei-Bauweise als Blob-URL).
  3. **Schneller Code:** Raster mit numerischen Schlüsseln (Int32-Index statt `"x,y,z"`-Strings) und vorab-allozierten `Float32Array`s; Versuche je Punkt begrenzen; am Handy weniger Punkte, dafür größere.
  4. Alternativ **vorberechnen** im Build (Punkte als Int16-Binärdaten eingebettet) – spart CPU, kostet Dateigröße (~2 MB für 330 k Punkte), daher nur für kleinere Wolken sinnvoll.
- Nebenbefund: Das Skript liegt am Ende der 941-KB-Datei; der Browser muss alles parsen, bevor das Partikel-Skript startet. Besser: JS und Schriften als **eigene Dateien** (`<script defer>`, `<link rel=preload>`), dann kann GitHub Pages sie getrennt cachen und der Text steht sofort (siehe 2.3 P1).

**M2 · Ohne WebGL fehlt die Hälfte der Bühne** [B]
- Mit abgeschaltetem WebGL (alte Geräte, Energiesparmodus, **iOS Lockdown-Modus schaltet WebGL und Webfonts ab** [B, Analysen 2022: sevarg.net, 9to5mac]) bleibt die Seite lesbar – gut –, aber im Hero steht „Fahren Sie mit der Maus über den Körper“ vor leerem Raum, und der Spannungs-Messer zeigt „100“.
- Empfehlung: Beim Fehlschlag der Renderer-Erzeugung Klasse `html.no-gl` setzen → Hinweise und Messer ausblenden, statt der Figur eine ruhige SVG-Silhouette (gleiche Punktwolke als statisches SVG beim Build gerendert) und die Kapitel-Bühnen durch Standbilder (PNG/WebP der Szenen) ersetzen. Aufwand klein, verhindert den Eindruck „kaputt“.

**M3 · Impressum: „[Bitte ergänzen]“ steht zweimal öffentlich** [B] – bekannt, wartet auf deine Angaben (Behörde laut Urkunde, Berufshaftpflicht). Vor dem Go unverzichtbar.

**M4 · Tippflächen der Punkte-Navigation** [B]
- axe meldet am Handy 9 Verstöße gegen WCAG 2.5.8 (Zielgröße 24 px): die Punkte „C1 ● ○ ○ ○ ○ S1“ und „Tür ● ○ … Training“ sind 8 px groß; die unsichtbare Vergrößerung über `::before` reicht nicht, weil sich die Nachbarflächen überlappen.
- Empfehlung: Punkte-Knöpfe auf 24 × 24 px (sichtbar 8 px, Rest Rand) mit 8 px Abstand setzen; die Striche in der Kapsel werden dadurch nur unwesentlich breiter.

### 2.2 Sollte (wirkt unfertig, kostet Vertrauen oder Besucher)

**S1 · Navigation: Poesie + Nutzen** [A]
- Kapitel-Namen bleiben, aber mit zweiter Zeile im PC-Menü und im Handy-Klappmenü: „03 Achse · Wirbelsäule“, „04 Dach · Rundgang & Leistungen“, „05 Tür · Kontakt“. Zusätzlich im Menü einen direkten Eintrag **„Leistungen“** (springt zu `#allTitle`), weil das die häufigste Suchabsicht ist.

**S2 · Das Gesicht fehlt** [A]
- Kapitel 02 „Bewegung“ hat am PC rechts eine halbe Bildschirmbreite leer; genau dort gehört das Porträt hin (dein Entwurf 2 „Aus Punkten wird ein Mensch“ – Partikel verdichten sich zum Foto). Zusätzlich 2–3 Sätze Werdegang/Qualifikation (Manuelle Therapie-Zertifikat, CMD-Fortbildung, Jahre Erfahrung – ohne Heilsversprechen).
- „Einblicke“: 3–5 echte Fotos der Räume im Rundgang (Karte je Raum bekommt ein Foto, das bei Klick auf das Schild einblendet). Die Partikel bleiben die Bühne; das Foto ist der Beweis.

**S3 · Kontakt: `mailto:` allein reicht nicht** [A]
- Am PC ohne eingerichtetes Mailprogramm passiert bei „Termin anfragen“ nichts. Empfehlung: neben dem Knopf die Adresse als Text mit **„Kopieren“-Knopf**, und den `mailto:`-Link mit vorgefülltem Betreff **und Textkörper** („Name, Telefon für Rückruf, Wunschzeiten, Verordnung vorhanden: ja/nein“) – das ist die schlanke, backend-freie „Terminanfrage“.
- **vCard-Download** („Praxis im Telefon speichern“) als statische `.vcf`-Datei – 2 KB, keine Technik, sehr nützlich für Patienten, die zurückrufen wollen.
- **Öffnungsstatus** rein clientseitig aus den Zeiten berechnet („Heute geöffnet bis 19:30“) – kleine Geste, großer Alltagsnutzen.

**S4 · Leistungs-Etiketten sind Füllwörter** [A]
- „Modern“, „Sanft“, „Individuell“, „Aktiv“ sagen Patienten nichts. Ersetzen durch Nutzwert: „Kasse · Privat“, „Verordnung nötig“, „auch Selbstzahler“, „20–30 Min“. Dazu je Leistung eine Zeile „Wann sinnvoll?“ (Beispiele in Alltagssprache). HWG beachten: keine Erfolgsversprechen.

**S5 · Inhalte, die Patienten vor dem ersten Besuch suchen** [A, gestützt durch studiomeyer-Leitfaden]
- „Vor dem ersten Termin“: Was mitbringen (Verordnung, Handtuch, Versichertenkarte), Dauer, Zuzahlung, Absage-Regel (24 h), Parken, Bus, Barrierefreiheit der Praxis (Stufen? Aufzug?).
- Kurze FAQ (5–8 Fragen) – auch als `FAQPage`-Schema für Google.
- Bewertungen: 2–3 handverlesene Zitate als Text + Link zum Google-Profil (keine Google-Einbindung beim Laden; Rechte an Rezensionstexten sind unklar [O], daher kurz zitieren oder paraphrasieren).

**S6 · Wirbelsäule am Handy beim Hereinscrollen ein weißer Block** [O, am iPhone prüfen]
- Bei 390 px und 768 px zeigt der Übersichtsabstand die Wirbelsäule als geschlossene weiße Form (Punkte überlagern sich additiv); erst beim Heranfahren wird sie zur Struktur. Könnte ein SwiftShader-Effekt sein, ist physikalisch aber plausibel. Falls real: Punktgröße und Alpha mit dem Kameraabstand skalieren (`uPix` × Distanzfaktor) oder im Übersichtszustand nur jede 3. Schicht zeichnen.

**S7 · Hero-Reihenfolge am Handy** [A]
- Figur oben, Text erst nach 45 % Bildschirmhöhe. Funktioniert, aber der Kicker „HOP · Home of Physiotherapy · Schorndorf“ ist das Erste, was Google und ein eiliger Patient suchen. Option: Kicker über die Figur (oben links, neben dem Logo ist Platz) – kleine Änderung, viel Orientierung.

**S8 · Lokale Suche** [A]
- H1 „Spannung lösen.“ ist Marke, nicht Suchbegriff. Der Begriff „Physiotherapie Schorndorf“ sollte im ersten sichtbaren Text vorkommen (Hero-Untertitel: „Physiotherapie in Schorndorf mit Kompetenz und Herz.“). Beim Livegang: `robots.txt`, `sitemap.xml`, Google Unternehmensprofil auf die neue Adresse prüfen, `noindex` entfernen (ist im Live-Build vorgesehen).

### 2.3 Nice to have (Politur)

- **P1 · Dateiaufbau:** Fonts (4 WOFF2) und JS als eigene Dateien, HTML schrumpft auf ~60 KB → Text in < 1 s auch bei schlechtem Netz; der Rest lädt parallel. Die „eine Datei“-Idee war für die Vorschau sinnvoll, für den Livegang nicht nötig.
- **P2 · Font-Subsetting:** Archivo/Archivo Expanded/Libre Caslon auf Latin + „§ – ‹ › …“ reduzieren (glyphhanger oder pyftsubset) – spart geschätzt 40–60 % der Font-Bytes [A].
- **P3 · Skip-Link** „Zum Inhalt“ für Tastaturnutzer (51 Fokusstopps vor dem Hauptinhalt sind viel). [B]
- **P4 · `text-wrap: pretty`** für Fließtext, `balance` nur für Überschriften (ist schon drin).
- **P5 · Druckansicht der Startseite:** Kontakt + Zeiten + Hausordnung als sauberes Blatt (die Rechtsseiten haben das schon).
- **P6 · Hausordnung als PDF-Poster** zum Download/Aushang – kleines Markenstück für den Wartebereich.
- **P7 · Kapitelleiste PC** während der Hausordnung zeigt richtig „§ Hausordnung“ (umgesetzt, geprüft) – erledigt.

---

## 3. Ideen für den „Knaller“ – sortiert nach Wirkung je Aufwand

| # | Idee | Warum | Aufwand | Kosten |
|---|---|---|---|---|
| K1 | **Die Tür geht auf: Licht am Ende** – Kapitel 05 wechselt von Dunkel in warmes Off-White/Bernstein-Licht (die V10-Palette `--bg #F7F5EF`), Partikel werden zu Sonnenstaub. Dramaturgisch: draußen dunkel, drinnen Zuhause. | Löst den einzigen Schwachpunkt des Dark-Konzepts (Wärme) in der Erzählung selbst; Studienlage: Ältere lesen Kontaktdaten in Hell besser (NN/g, Chatrangsan 2023) [B] | mittel | 0 |
| K2 | **Hell/Dunkel-Umschalter** mit `prefers-color-scheme`, Übergang als View-Transition-Wipe | Dark-first ist 2026 Trend, aber Ältere bevorzugen Hell (Sethi 2022, Piepenbrock 2013) [B]; Wahl ist eine Nutzer-Einstellung → ohne Einwilligung speicherbar wie „Bewegung“ | mittel | 0 |
| K3 | **„Wo tut's weh?“ zurück auf der Partikel-Figur** – Hotspots existieren bereits in `shapes.js`; Klick auf Nacken/Schulter/Rücken/Knie springt zum passenden Wirbelsäulen-Abschnitt oder zur Leistung | Körper als Navigation ist das Muster der Awwwards-SOTD „Vibrant Wellness“ (2026) [B]; V10-Inhalt wird wiederverwendet | mittel | 0 |
| K4 | **Porträt aus Punkten** (Entwurf 2) + 3 Sätze Werdegang in Kapitel 02 | siehe S2 – größter Vertrauensgewinn | klein (Foto liegt bald vor) | 0 |
| K5 | **Stimme statt Text:** Kai liest die Hausordnung (30 s MP3, selbst gehostet, Play-Knopf) | „Herz“ hörbar; keine Drittanbieter; ungewöhnlich für Praxen | klein | 0 |
| K6 | **Tageslicht-Logik** aus dem „Hausbesuch“-Entwurf übernehmen: Bernstein-Ton und Partikel-Helligkeit folgen der Uhrzeit (Morgen kühler, Abend wärmer) | Wärme ohne Kitsch, 20 Zeilen Code | klein | 0 |
| K7 | **Echter Praxis-Scan als Gaussian Splat** (Scaniverse Classic → SPZ, on-device, kostenlos; three.js r186 bringt `SPZLoader` nativ [B]) – nur am PC, Handy behält das Partikel-Haus | Der Rundgang wird vom Schema zur Wirklichkeit; du planst den Scan ohnehin | groß | 0 |
| K8 | **„Vor dem ersten Termin“-Kapitel** mit Checkliste, Karte-Link, vCard, Kalender-Datei (`.ics` „Erinnerung: Verordnung mitbringen“) | Fürsorge = Zuhause; ersetzt die Pre-Visit-Mail, die ein Backend bräuchte | klein | 0 |
| K9 | **Übungs-Bibliothek „3 Minuten für den Nacken“** – kurze eigene Videos (WebM/MP4 selbst gehostet, kein YouTube) oder Partikel-Figur, die die Übung zeigt | Inhalt, der Patienten wiederkommen lässt; Google liebt es; HWG-konform ohne Versprechen | mittel–groß | 0 |
| K10 | **Öffnungsstatus live** + Feiertage BW clientseitig | Alltagsnutzen, 30 Zeilen | klein | 0 |
| K11 | **Leichte Sprache / Kurzfassung** als aufklappbarer Block je Kapitel („In einem Satz: …“) | Barrierefreiheit und Eile; passt zur Hausordnung „Der Mensch zuerst“ | klein | 0 |
| K12 | **Mikro-Rückkehr** „Willkommen zurück – zuletzt angesehen: L4–L5“ | nur mit Einwilligung (§ 25 TDDDG: nicht zwingend erforderlich) → eher lassen [A] | klein | 0 |

Nicht empfohlen: KI-Chatbot, WhatsApp als Kontaktweg (LfD Niedersachsen: Gesundheitsdaten über WhatsApp unzulässig [A]), Google-Review-Widgets, Rezept-Upload ohne EU-Anbieter mit AVV.

---

## 4. Inspiration aus der Recherche (Muster, nicht kopieren)

Alle Quellen geöffnet [B], Details im Anhang A.

- **Vibrant Wellness** (Awwwards SOTD + Webby 2026): 3D-Körper als *Navigation* – Region anklicken, Kapitel zoomt hinein. Lehre für HOP: Figur im Hero klickbar machen (K3). Accessibility-Wertung dort nur 7,2 → HOP kann besser sein.
- **Until Labs** (basement.studio, 2025): Healthcare-Marke „warm statt Sci-Fi“ – Off-White, warmes Orange, weiches Korn, Splat-Optik, Mono-Zahlen als Scroll-Anker. Der nächste Verwandte von Puls · Scan; zeigt, dass Dunkel + Bernstein + Korn als „warm“ gelesen wird.
- **Maxima Therapy** (SOTD 2026): GSAP + Lenis + Lottie, illustriert, verspielte 404 und Karte des Einzugsgebiets – „Herz“ über Spielerei statt Stockfotos.
- **Chu Vision Institute** (WebAward 2025 Best Healthcare): Patient ist Held, Arzt ist Guide; ein metaphorischer Animations-Kniff (unscharf → scharf). Für HOP: „Punkte finden zusammen“ ist dieser Kniff.
- **Dynamic Clinic** (Moskau): Typografie aus der Leitidee „Bewegung“ abgeleitet (gekippte Versalien), eigenes Fotoshooting mit dem Körper.
- **Rheinblick Physio** (Düsseldorf): das deutsche „Standard gut“ – Buchen-Knopf, Barrierefreiheitsseite, GKV/PKV-Hinweis. Zeigt, was deutsche Patienten erwarten; HOP sollte diese Grundlagen abdecken (S3, S5) und darüber hinaus gehen.
- **Medwest.Plus** (Tirol, Awwwards HM): Beleg, dass eine dunkle Physio-Seite im DACH-Raum prämiert wurde.

Trends 2026 mit Bezug: Dark-first als Designentscheidung, warme Charcoal-Töne statt Schwarz, Korn/Noise als Wärme, CSS-Scroll-Animationen (Safari seit 9/2025, Firefox noch Flag → GSAP bleibt Hauptmotor), View Transitions (Interop 2026), Gaussian Splats „von Forschung zu Produktion“, kinetische Typografie sparsam, „human-made“ gegen KI-Einheitslook.

---

## 5. Praxis-Funktionen: Was auf GitHub Pages realistisch ist

| Funktion | Realistisch ohne Backend? | Empfehlung |
|---|---|---|
| Online-Terminbuchung | nur als Link auf externes Tool | Erst wenn Optica/Doctolib o. ä. genutzt wird; Link statt iframe (kein Tracker, keine BFSG-Falle). Doctolib ab ~139 €/Monat [B] – teuer für eine Einzelpraxis. |
| Terminanfrage | ja (`mailto:` mit Vorlage) | S3 |
| Rezept-Upload | nein (Gesundheitsdaten) | „Zum Termin mitbringen“; später EU-Anbieter mit AVV |
| Anamnesebogen | als PDF-Download ja | „10 Minuten früher kommen“ oder ausgefüllt mitbringen |
| Übungsvideos | ja (selbst gehostet) | K9 |
| Bewertungen | als Textzitate ja | S5 |
| vCard, `.ics`, Öffnungsstatus, Web Share | ja | S3, K8, K10 |
| PWA / „Zum Home-Bildschirm“ | ja (Manifest) | optional; `apple-touch-icon` ist schon da |
| Mehrsprachig | ja | später; DE + EN-Kurzprofil reicht |
| Newsletter / WhatsApp | nein / nur Link | Datenschutz erst ergänzen |
| BFSG | Einzelpraxis formal ausgenommen (Kleinstunternehmen) [B, Ecovis] | trotzdem WCAG-Niveau halten + freiwillige Erklärung zur Barrierefreiheit (Rheinblick macht es) |

---

## 6. Werkzeuge, Skills und Plugins (alle kostenlos, geprüft [B] soweit vermerkt)

Minimal-Set, das ich empfehle:

| Zweck | Werkzeug | Installation |
|---|---|---|
| Performance, Core Web Vitals, Lighthouse, A11y, SEO in einem Audit | **addyosmani/web-quality-skills** | `/plugin marketplace add addyosmani/web-quality-skills` → `/plugin install web-quality-skills@addy-web-quality-skills` |
| Echter Chrome mit Trace und Lighthouse | **Chrome DevTools MCP** (Google, offiziell im Claude-Marketplace) | `/plugin install chrome-devtools-mcp@claude-plugins-official`; Flags `--no-usage-statistics --no-performance-crux` (Datenschutz) |
| GSAP richtig einsetzen (ScrollTrigger, SplitText – seit 2025 alles frei) | **greensock/gsap-skills** (offiziell) | `/plugin marketplace add greensock/gsap-skills` |
| three.js-Regeln für Vanilla (Disposal, Partikel, Mobile) | **emalorenzo/three-agent-skills** | `npx add-skill emalorenzo/three-agent-skills --skill three-best-practices` |
| Aktuelle Doku three.js/GSAP/Lenis | **Context7 MCP** | `npx ctx7 setup --claude` (gratis Key) |
| Barrierefreiheit automatisiert | `@axe-core/playwright` + `pa11y` in `tools/shot.cjs` | npm |
| Visuelle Regression (Vorher/Nachher-Bilder automatisch vergleichen) | Playwright `toHaveScreenshot()` | eingebaut |
| Deutsche Texte, Sie/Du-Check, Typografie | **bndkts/copycraft** (sehr neu, SKILL.md vorher lesen) | `/plugin marketplace add bndkts/copycraft` |
| Favicons/OG-Bilder in allen Größen | **alonw0/web-asset-generator** | `/plugin marketplace add alonw0/web-asset-generator` |
| Font-Subsetting | **glyphhanger** (Node + fonttools) | `npm i -g glyphhanger`, in `build.mjs` einbauen |
| SEO/Schema (LocalBusiness, FAQ) | **AgriciDaniel/claude-seo** (umfangreich) | `/plugin marketplace add AgriciDaniel/claude-seo` |

Bereits vorhanden in deiner Umgebung: `frontend-design`, `website-design` (web-review, web-design-system; UXKIN-Suche wäre kostenpflichtig), `superpowers`, `code-review`.

3D und Bilder (für K4, K7, Einblicke):
- **Praxis-Scan:** Scaniverse Classic (iPhone, kostenlos, rechnet **auf dem Gerät**, exportiert SPZ/PLY) – datenschutzfreundlichste Wahl [B]. Polycam exportiert Splats nur bezahlt, KIRI Splats nur Pro [B]. Vor dem Scan: Unterlagen, Bildschirme, Namen abdecken.
- **Wiedergabe:** three.js r186 `SPZLoader` [B] oder **Spark** (`@sparkjsdev/spark`, MIT) [B].
- **Anatomie-Modelle:** Z-Anatomy (CC BY-SA, Share-Alike beachten) [B]; Meshy Free (CC BY) für Requisiten.
- **Bilder lokal statt Cloud:** SD Forge auf deiner RTX 2070 Super (8 GB reicht für SDXL) – nichts verlässt den PC [B]. Google AI Studio nur ohne Personenfotos.
- **Claude Design** (claude.ai/design, im Abo) als Ideengeber für Layout-Varianten [A].

---

## 7. Technik-Empfehlungen (Plattform, Build, Qualität)

Quellen im Anhang B; alle Angaben aus geöffneten Quellen [B], sofern nicht anders markiert.

**Renderer und Partikel**
- **Bei `WebGLRenderer` bleiben.** three.js r187 (30.10.2026) ist aktuell; der `WebGPURenderer` unterstützt **keine** `ShaderMaterial`/eigenen GLSL-Shader – deine fünf Shader müssten auf TSL portiert werden, ohne sichtbaren Gewinn bei Punktwolken. WebGPU gibt es auf iPhone erst ab iOS 26, der WebGL-Pfad müsste ohnehin bleiben. [B]
- **DPR-Deckel ist richtig** (1,6 PC / 1,4 Handy im Code [B]); PlayCanvas und three.js-Forum empfehlen ≤ 2 und gerätabhängig. Ergänzung: **adaptives Budget** – fps messen, bei < 45 fps Partikelzahl und DPR halbieren. iOS cappt auf 60 fps, im Stromsparmodus auf **30 fps** (Lenis-README) → 30 fps als Handy-Ziel akzeptieren, Rendering bei Scroll-Stillstand drosseln (hast du schon: „jedes 2. Bild“). [B/A]
- **Shader-Präzision iOS:** `mediump` ist auf iPhone echtes fp16 → schwarze Szenen/Artefakte (Fall iPhone 14 mini im three.js-Forum). Positions-/Datentextur-Pfade (`curveTex`, `periTex`, `relaxTex`) explizit `highp`, nur Farbe/Alpha `mediump`. Auf dem PC fällt das nie auf – deshalb am iPhone prüfen. [B]
- **Loop pausieren** bei `document.hidden` (hast du) und zusätzlich bei off-screen Canvas (Manuthera hat IntersectionObserver, Hauptbühne läuft immer) [B Quelltext]. Chrome empfiehlt `contentvisibilityautostatechange`.
- `<canvas>` zählt **nicht** als LCP-Element → Googles LCP misst deinen größten Textblock; die Canvas-Initialisierung belastet INP (Tasks > 50 ms) → Init nach First Paint in `requestIdleCallback` (siehe M1). [B]
- OffscreenCanvas mit WebGL im Worker: Safari ab 17 voll; für eine Einzelseite eher Overhead – Worker nur für die **Geometrie-Berechnung** (M1), nicht fürs Rendern. [B/A]
- Open-Source-Vorbild mit gleichem Stack: Codrops „Cinematic 3D Scroll Experiences with GSAP“ (11/2025, MIT) – https://github.com/JosephASG/codrops-cinematic-scroll-animations [B]

**Web-Plattform-Features (Support-Stand caniuse 10/2026)**
| Feature | Support | Nutzen für HOP |
|---|---|---|
| CSS Scroll-driven Animations | Chrome 115, Firefox 159, Safari/iOS 26; 88 % | Handy-Karten-Modus: Fortschritt, Einblenden ohne JS; Fallback GSAP |
| View Transitions (same-document) | Chrome 111, Firefox 144, Safari 18; 93 % | Hell/Dunkel-Wipe (K2), Kartenwechsel |
| `@starting-style` | Chrome 117, Firefox 129, Safari 17.5 | Einblenden von Popover/Menü |
| `content-visibility: auto` | Baseline seit 9/2025 | Off-Screen-Karten/Leistungsliste; **nicht** auf die Canvas-Bühne |
| `text-wrap: pretty` | Safari ab 26, Firefox fehlt | Fließtext, harmloses Enhancement |
| Popover API | Safari 17+ | Kapitel-Menü am Handy ohne Fokusfallen |
| `prefers-reduced-transparency` | iOS **nicht** | optional |
| Speculation Rules | Safari/Firefox nicht | irrelevant (Einzelseite) |

**Bibliotheken**
- **GSAP 3.13 ist komplett kostenlos** inkl. SplitText, MorphSVG, ScrollSmoother (seit 29.4.2025, Webflow-Sponsoring) – deine „lebenden Überschriften“ könnten SplitText nutzen statt Eigenbau. Lizenz ist die GSAP „Standard License“, nicht MIT [B/O].
- **Lenis** MIT, v1.3.27, aktiv; `syncTouch` instabil auf iOS < 16. Alternative: ScrollSmoother (jetzt frei) oder nativ scrollen (0 KB). [B]
- **Meiden:** Theatre.js (Entwicklung privat, letzter Push 8/2024), Spline (Self-Hosting nur Enterprise, Standard lädt von Spline-Servern → DSGVO). [B]
- **Rive** (MIT, WASM selbst hostbar) und **dotLottie-web** (MIT) sind datenschutztauglich, falls du je Vektor-Animationen willst. [B]
- **Gaussian Splats:** Spark (World Labs, MIT, WebGL2, lädt SPZ/SOG, „schnell auch auf schwachen Mobilgeräten“) ist die Empfehlung; GaussianSplats3D wird nicht mehr entwickelt und bräuchte COOP/COEP-Header, die GitHub Pages nicht setzen kann. Dateigrößen: Roh-PLY 50–800 MB, SPZ 10–12× kleiner → ein Praxisraum realistisch **5–20 MB**, daher nur per Klick „3D laden“ mit Posterbild, nie in die HTML eingebettet. Nachbearbeitung kostenlos im Browser mit SuperSplat (PlayCanvas). [B/A]
- **glTF-Modelle:** Meshopt (+ KTX2) statt Draco – schnellerer Decode auf Handy-CPUs; `gltf-transform` CLI (MIT). Z-Anatomy-Skelett ist CC BY-SA mit Herkunft BodyParts3D (CC BY-SA 2.1 JP) → beide nennen; das abgeleitete Modell bleibt Share-Alike. [B]

**Qualitätssicherung auf GitHub Pages (kostenlos)**
- GitHub Actions für öffentliche Repos frei: `treosh/lighthouse-ci-action` (v12) mit `staticDistDir` + Budgets, `pa11y-ci` mit axe-Runner (findet ~⅓ der Barrieren automatisch – Rest bleibt Handarbeit), `@axe-core/playwright`, `html-validate`, `size-limit`. Playwright-Visual-Tests brauchen einen deterministischen Canvas (feste Seed/Zeit) oder Maskierung. [B/A]
- **Fonts:** `pyftsubset … --unicodes="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201E,U+20AC,U+2026" --layout-features='*' --flavor=woff2`; Variable-Achsen mit `varLib.instancer` beschneiden (z. B. `wght=400:800`). Bei eingebetteten Fonts ist `font-display: swap` wirkungslos → `optional`/`block`. [B/A]
- **Bilder** (für Einblicke/Porträt): AVIF → WebP → JPEG per `<picture>`, 20-px-Blur-Platzhalter; AVIF ab iOS 16. [B/A]

**Funktionen ohne Server, DSGVO**
- **Kontaktformular: keines.** Formspree (US), Web3Forms (Indien, Serverstandort unklar) und Netlify Forms (US) sind für eine Praxis nicht empfehlenswert; Cloudflare Workers wären vertretbar (DPF, nur Weiterleitung), bleiben aber US-Anbieter. `mailto:` + Vorlage + vCard ist die saubere Lösung (S3). [B/A]
- **Terminbuchung per Link**, nie als iframe: TIMIFY (München) hat einen **kostenlosen Classic-Tarif** mit Buchungsprofil; Terminland ab 14,90 €, eTermin ~19 €, Doctolib ~139 €/Monat; samedi/dubidoc auf Anfrage. Prüfpunkte: AVV, Serverstandort DE/EU, keine Besuchsgründe abfragen (Art. 9, § 203 StGB). [B]
- **Karte:** reiner Link (hast du) ist einwilligungsfrei; Google-Maps-Screenshot ist urheberrechtlich heikel. Wenn ein Kartenbild gewünscht ist: statisch gerendertes OSM-Bild mit „© OpenStreetMap contributors“ + Link auf die Lizenz, keine Leaflet-Tiles (IP-Übertragung). [B/A]
- **`.ics` und `.vcf` als echte Dateien** ausliefern, nicht als `data:`-URI (Safari lädt die sonst nicht); GitHub Pages setzt die MIME-Typen korrekt. [B]
- **PWA:** iOS 26 öffnet Home-Bildschirm-Seiten standardmäßig als Web-App; Manifest + Icons reichen, kein Service Worker nötig. [B]
- **WhatsApp:** Gericht sprach Schadensersatz wegen Patientendaten per WhatsApp zu; höchstens Link für Terminorganisation mit Hinweis „keine Gesundheitsdaten“. [B/A]

**Barrierefreiheit und Recht**
- **BFSG:** Kleinstunternehmen (< 10 Beschäftigte **und** ≤ 2 Mio € Umsatz) sind für Dienstleistungen befreit; IFK bestätigt für Physio-Praxen. Erfasst wäre nur eine eigene Online-Buchung/Verkauf; eine verlinkte Plattform verantwortet der Betreiber. Befreiung kurz dokumentieren, WCAG 2.2 AA trotzdem halten. [B]
- **WCAG 2.2 neu:** 2.5.8 Zielgröße ≥ 24 px (M4), 2.4.11 Fokus nicht verdeckt (fixe Leiste beachten!), 2.5.7 Ziehen muss Alternative haben (hast du: Knöpfe neben Wischen), 3.2.6 Hilfe konsistent. [B]
- **Canvas für Screenreader:** dekorative Bühne `aria-hidden` (hast du), Manuthera `role=img` (hast du), Reduced-Motion im JS abfragen (hast du). Sauber. [B]

---

## 8. Messwerte (Container, kein echtes Gerät)

| Wert | PC 1440 × 900 | Handy 390 × 844, 4× CPU-Drossel |
|---|---|---|
| HTML (eine Datei) | 941 KB, gzip 325 KB | gleich |
| DOM-Knoten | 890 | 890 |
| Längster Lang-Task beim Start | 6 800 ms | 15 440 ms |
| First Contentful Paint | 7,1 s (nach dem Task) | 0,5 s (vor dem Task) |
| JS-Heap nach Start | 78 MB | 111 MB |
| axe (WCAG 2.2 AA + Best Practice) | 1 Hinweis (Region) | 1 Hinweis + 9 × Zielgröße |
| Fokussierbare Elemente | 51 | 45 |

Partikel am PC: 64 000 (Hauptwolke) + 330 000 (Wirbelsäule) + ~2 600 Nerven + ~7 000 Leistungs-Motive + Manuthera-Bühne; am Handy 26 000 + 85 000 + … [B aus Quelltext].

---

## 9. Vorgeschlagene Reihenfolge

1. **Vor dem Livegang (Pflicht):** M3 Rechtsangaben · M1 Startzeit (mindestens Lazy + Worker für die Wirbelsäule) · M2 Fallback ohne WebGL · M4 Tippflächen · S1 Navigations-Untertitel · S3 Kontakt (Kopieren, Vorlage, vCard) · S8 „Physiotherapie Schorndorf“ im Hero-Text.
2. **Kurz nach dem Livegang:** K4 Porträt + Werdegang · Einblicke-Fotos im Rundgang · S5 „Vor dem ersten Termin“ + FAQ · K10 Öffnungsstatus · P1 Dateien trennen.
3. **Ausbau:** K1 „Die Tür geht auf“ oder K2 Umschalter (eines von beiden zuerst testen) · K3 Körper als Navigation · K5 Stimme · K7 Splat-Scan am PC · K9 Übungen.

Jeder Punkt ist einzeln umsetzbar; ich würde vor jeder Stufe wie gewohnt einen Entwurf zeigen und auf dein „Go“ warten.

---

## 10. Offen

- Echte Handy-Messung (Flüssigkeit, Wärme, Akku) – nur auf deinem iPhone möglich.
- S6 (weiße Wirbelsäule beim Hereinscrollen) auf dem iPhone prüfen.
- Rechte an Google-Rezensionstexten [O].
- Lockdown-Modus-Verhalten (WebGL/Fonts aus) beruht auf Analysen von 2022; aktueller Stand nicht offiziell dokumentiert [O].

---

## Anhang A – Quellen der Inspirations-Recherche

- Vibrant Wellness: https://www.awwwards.com/sites/vibrant-wellness · https://vibrant.noomoagency.com/
- Until Labs: https://basement.studio/post/until-giving-cryopreservation-its-true-identity · https://www.untillabs.com/
- Maxima Therapy: https://www.awwwards.com/sites/maxima-therapy
- Medwest.Plus: https://www.awwwards.com/sites/medwest-plus
- Dynamic Clinic: https://www.designnominees.com/sites/dynamic-clinic
- Chu Vision Institute: https://www.studio3marketing.com/s3-feed/2025-best-healthcare-provider-website-chu-vision-institute
- Georgy Dillon PT: https://www.designrush.com/best-designs/websites/georgy-dillon-pt-website-design
- 101 Physio: https://www.awwwards.com/sites/101-physio
- Rheinblick Physio: https://www.rheinblick-physio.de
- Everlab: https://webflow.com/made-in-webflow/website/everlab-qa
- DataArt 3D-Körper-Case: https://www.dataart.com/clients/case-studies/medtech-case-study
- Trends: https://line25.com/articles/web-design-trends-2026/ · https://fireart.studio/blog/the-best-web-design-trends/ · https://www.digidop.com/blog/5-web-design-trends-2025/index.md · https://www.drweb.de/css-scroll-animationen-ohne-javascript/ · https://studiomeyer.io/de/blog/web-design-for-doctors.md
- Dark Mode und Alter: https://www.nngroup.com/articles/dark-mode/ · https://scholars.bentley.edu/etd_all/1 · https://so03.tci-thaijo.org/index.php/JMMS/article/view/261810 · https://arxiv.org/abs/2409.10841
- BFSG: https://ecovis-kso.com/blog/praxis-webseite-barrierefrei-gestalten-so-erfuellen-sie-die-bfsg-pflicht-ab-juni-2025/
- Doctolib-Preise: https://www.giga.de/tech/was-kostet-doctolib-diese-preise-und-tarife-gibt-es-aktuell--01KPN5Y6VMKWGMSGVS4BDCZ046
- WhatsApp in Praxen: https://www.aerztezeitung.de/Wirtschaft/WhatsApp-fuer-Aerzte-dienstlich-ab-sofort-tabu-229529.html
- Lockdown-Modus: https://www.sevarg.net/2022/07/20/ios16-lockdown-mode-browser-analysis/ · https://9to5mac.com/2022/07/25/lockdown-mode-ios-16-restricts-web-browsing/

## Anhang B – Quellen der Technik-Recherche

- three.js Releases: https://github.com/mrdoob/three.js/releases · WebGPU-Migration: https://www.utsubo.com/blog/webgpu-threejs-migration-guide · 100 Tipps: https://www.utsubo.com/blog/threejs-best-practices-100-tips · caniuse WebGPU: https://caniuse.com/webgpu
- DPR/iOS: https://discourse.threejs.org/t/low-fps-on-ios-mobile-with-pixel-ration-set-as-window-devicepixelratio/4963 · https://developer.playcanvas.com/user-manual/optimization/runtime-devicepixelratio/
- Präzision iOS: https://discourse.threejs.org/t/precision-highp-float-mediump-on-ios14-iphone14/23847 · https://github.com/mrdoob/three.js/issues/14570
- Hintergrund-Loop: https://developer.chrome.com/docs/modern-web-guidance/guides/performance/efficient-background-processing · LCP: https://web.dev/articles/lcp · OffscreenCanvas: https://caniuse.com/offscreencanvas
- Codrops-Beispiel: https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/ · https://github.com/JosephASG/codrops-cinematic-scroll-animations
- CSS: https://caniuse.com/mdn-css_properties_animation-timeline · https://caniuse.com/view-transitions · https://caniuse.com/mdn-css_at-rules_starting-style · https://web-platform-dx.github.io/web-features-explorer/features/content-visibility · https://caniuse.com/css-text-wrap-balance · https://web.dev/blog/web-platform-09-2025
- GSAP frei: https://gsap.com/blog/3-13/ · Lenis: https://github.com/darkroomengineering/lenis · Theatre.js: https://github.com/theatre-js/theatre · Spline Self-Host: https://docs.spline.design/exporting-your-scene/web/exporting-as-self-hosted-project · Rive: https://github.com/rive-app/rive-wasm · dotLottie: https://github.com/LottieFiles/dotlottie-web
- Splats: https://sparkjs.dev/docs/overview/ · https://github.com/mkkellogg/GaussianSplats3D · https://scaniverse.com/news/spz-gaussian-splat-open-source-file-format · https://blog.playcanvas.com/compressing-gaussian-splats/ · https://scaniverse.com/news/creating-splats-which-app-to-choose · https://www.realityscan.com/license
- glTF: https://gltf-transform.dev/modules/extensions/classes/EXTMeshoptCompression · Z-Anatomy: https://github.com/Z-Anatomy/Models-of-human-anatomy · BodyParts3D: https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/README_e.html
- CI: https://github.com/marketplace/actions/lighthouse-ci-action · https://accessibility.civicactions.com/posts/automated-accessibility-testing-leveraging-github-actions-and-pa11y-ci-with-axe · Fonts: https://clagnut.com/blog/2418 · https://www.npmjs.com/package/glyphhanger
- Formulare: https://formbricks.com/vs-formspree · https://docs.web3forms.com/getting-started/faq · https://www.netlify.com/pricing/ · https://www.cloudflare.com/trust-hub/gdpr/ · https://www.e-recht24.de/dsg/13002-google-forms.html · https://www.it-recht-kanzlei.de/kontaktformular-datenschutzgrundverordnung-dsgvo.html
- Terminbuchung: https://www.timify.com/de-de/pricing/ · https://www.terminland.de/preise/ · https://trusted.de/etermin-kosten · https://simplybook.me/de/pricing · https://www.samedi.com/ · https://www.dubidoc.de/ · https://cal.com/pricing · https://medizinio.de/digitalisierung/online-terminkalender-arztpraxis
- Karte: https://www.dr-datenschutz.de/wie-kann-google-maps-dsgvo-konform-eingebunden-werden/ · https://community.openstreetmap.org/t/das-einbinden-einer-openstreetmap-karte-und-der-datenschutz-dsgvo/83128 · https://osmfoundation.org/wiki/Attribution
- WhatsApp: https://borncity.com/news/whatsapp-in-arztpraxis-verboten-gericht-verurteilt-zu-schadensersatz/ · PWA iOS 26: https://mjtsai.com/blog/?p=49472 · .ics: https://kiwix.lema.org/stackoverflow.com_en_all_2023-11/questions/15439922/data-uri-for-ical-does-not-work-on-android-or-iphone
- BFSG: https://www.zdh.de/ueber-uns/fachbereich-organisation-und-recht/praxis-recht-/-leitfaeden/praxis-recht-barrierefreiheit-von-webseiten/ · https://ohn.haendlerbund.de/recht/rechtsfragen/kleinstunternehmen-bfsg-ausnahme · https://ifk.de/node/16896 · WCAG 2.2: https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/ · Canvas-A11y: https://quorumlanguage.com/tutorials/accessibility/accessibleGraphicsWebGL.html

## Anhang C – Quellen der Werkzeug-Recherche

- https://github.com/anthropics/claude-plugins-official · https://github.com/anthropics/skills
- https://github.com/addyosmani/web-quality-skills · https://github.com/vercel-labs/agent-skills · https://github.com/greensock/gsap-skills · https://github.com/emalorenzo/three-agent-skills · https://github.com/freshtechbro/claudedesignskills
- https://github.com/ChromeDevTools/chrome-devtools-mcp · https://github.com/microsoft/playwright-mcp · https://github.com/danielsogl/lighthouse-mcp-server · https://github.com/upstash/context7 · https://code.claude.com/docs/en/chrome
- https://github.com/bndkts/copycraft · https://github.com/alonw0/web-asset-generator · https://github.com/zachleat/glyphhanger · https://github.com/AgriciDaniel/claude-seo · https://github.com/diffusionstudio/lottie
- https://www.nianticspatial.com/products/capture · https://radiancefields.com/platforms/scaniverse · https://poly.cam/pricing · https://www.kiriengine.app/pricing · https://github.com/mrdoob/three.js/releases/tag/r186 · https://github.com/sparkjsdev/spark
- https://github.com/Z-Anatomy/Models-of-human-anatomy · https://www.meshy.ai/pricing · https://github.com/lllyasviel/stable-diffusion-webui-forge · https://aistudio.google.com/docs/terms
