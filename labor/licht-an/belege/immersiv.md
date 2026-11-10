# Strang IMMERSIV – Stand der Kunst bei immersiven/3D-Websites 2025–2026

Stand: 10.11.2026 · Recherche für das neue Projekt auf Basis von `labor/hausbesuch-puls.html` (HOP – Home of Physiotherapy, Schorndorf)
Kennzeichnung: **B** = von einer von mir geöffneten Quelle genau so gestützt (oder selbst gemessen) · **A** = abgeleitet/plausibel · **O** = offen/nicht belegt.
Im Repository wurde nichts geändert. Mess-Skript und Rohdaten liegen im Scratchpad (Pfade in Abschnitt 2).

---

## 1. Kurzfazit

1. **Die Preisträger 2025/2026 sind fast alle 3D/WebGL-Seiten** – 9 von 10 Awwwards-„Sites of the Month“ Januar–Oktober 2026 tragen WebGL/Three.js-Schlagworte (B/A). Die Richtung von Kais Seite ist also genau die Richtung der Spitze.
2. **Ihre nachweisliche Schwäche ist immer dieselbe:** In der Awwwards-Entwicklerjury liegt „Accessibility“ bei allen 19 von mir geöffneten Preisträgern zwischen 6,0 und 7,6 (Mittel 6,89), „Animations/Transitions“ bei 7,8–9,6 (Mittel 8,57) (B). Meine eigene Labormessung an 13 Preisträgern: Median 5,66 MB Übertragung in 25 s am Handy-Bildschirm, 8 von 14 Seiten ohne JavaScript praktisch ohne Text, 12 von 14 laden sofort von Dritt-Hosts (B, Messgrenzen siehe 2.2).
3. **Kais heutige Testseite ist dort schon besser als alle gemessenen Preisträger:** 0,41 MB, 5 Anfragen, 1 Host, 4 187 Zeichen Text ohne JavaScript, „Bewegung reduzieren“ im Code (B, gleiche Messung). Der Abstand zur Spitze liegt **nicht** in Technikmenge, sondern in Regie: Kontinuität, Verzicht, eine menschliche Schicht, Ton, Belohnungen – und im sofortigen Weg zu Termin/Adresse.
4. **„Das Neue“ Ende 2026:** WebGPU ist in allen großen Browsern angekommen, der three.js-`WebGPURenderer` ist laut eigener Anleitung aber weiter „experimental“ und verlangt den Umbau aller eigenen GLSL-Materialien auf TSL (B). Gaussian Splats sind als glTF-Erweiterung ratifiziert und bei Lusion produktiv – aber nur als Hybrid für wenige Gegenstände (B). Für diese Seite trägt: Hybrid-Denken, Qualitätsstufen, Ton als Einladung, View Transitions. Mode (für diese Seite): WebGPU-Umbau, Voll-Splat-Szenen, visionOS-`<model>`, alles-im-Canvas-Oberflächen.

---

## 2. Methode und Grenzen

### 2.1 Quellen
- Preislisten und Jurywerte direkt von awwwards.com (Seiten einzeln geöffnet), FWA über die öffentliche Schnittstelle von thefwa.com, Webby-Kategorieseiten, CSSDA-WOTY-Seite.
- Fallstudien der Studios im Original: Lusion (Oryzo BTS Teil 1–3, blog.lusion.co), Bruno Simon (Awwwards-Fallstudie 11.03.2026), abeto (Igloo Inc, Awwwards 31.10.2024), Immersive Garden (Awwwards 04.03.2025).
- Kritik/Normen: Nielsen Norman Group (Scrolljacking 2023, Animation 2020, Ältere Nutzer 2019), W3C WCAG 2.2 (2.2.2, 2.3.3), Greenspector (2022), HTTP Archive Web Almanac 2025.
- Technikstand: three.js-Handbuch (WebGPURenderer), web.dev (WebGPU 25.11.2025), WebKit-Blog (Safari 26, 15.09.2025), caniuse-Rohdaten, Khronos-glTF-Register, MDN, Lenis-/detect-gpu-README.

### 2.2 Eigene Labormessung (externe Prüfung statt Selbsteinschätzung)
- Skript: `‹Scratchpad›/research/immersiv-messung/measure.cjs`
- Rohdaten: `‹Scratchpad›/research/immersiv-messung/messung.json` (14 Preisträger) und `‹Scratchpad›/research/immersiv-messung/hop.json` (Kais Testseite, öffentliche Testadresse).
- Aufbau: Playwright/Chromium im Container, Bildschirm 390×844 (iPhone-Kennung), 25 s nach Laden ohne Bedienung; gezählt über das DevTools-Protokoll: übertragene Bytes, Anfragen, Hosts; Suche nach `prefers-reduced-motion`, `AudioContext`, `navigator.gpu` in geladenen JS/CSS/HTML-Antworten; zweiter Lauf mit abgeschaltetem JavaScript (sichtbarer Text, Links, h1).
- **Grenzen (ehrlich):** kein Grafikchip (SwiftShader) → Seiten können eine andere Qualitätsstufe wählen oder WebGL verweigern; ein Lauf je Seite; keine Einwilligungs-Klicks; 25 s sind eine **Untergrenze** (Oryzo lag im Probelauf bei 7,04 MB, im Hauptlauf bei 4,60 MB – das Laden lief noch); die Textsuche belegt nur, dass der Begriff im Code vorkommt, nicht das Verhalten. Santioni Spirits lieferte in dieser Umgebung nur „Not Supported“ und ist für Gewicht nicht auswertbar. Keine Messung auf echtem iPhone/PC (fehlt: Gerät mit Grafikchip; es würde Bildraten und echte Ladezeiten liefern).

---

## 3. Die höchstausgezeichneten Seiten 2025–2026

### 3.1 Jahres- und Monatspreise

**Awwwards Jahrespreise (Gewinnerseite, ohne Jahreszahl im Text; die Monatsliste führt „Lando Norris“ als „Site of the Year 2025“)** (B)
- Site of the Year + Users' Choice: **Lando Norris** (OFF+BRAND) · Developer Site of the Year: **Messenger** (abeto) · E-Commerce: Scout Motors · Agency of the Year: **Immersive Garden** · Studio of the Year: Malvah · Independent of the Year: Louis Paquet.
  Quelle: https://www.awwwards.com/annual-awards/winners (geöffnet 10.11.2026)

**Awwwards Sites of the Month 2026** (B) – Quelle: https://www.awwwards.com/websites/sites_of_the_month/
Jan Bruno's Portfolio (Bruno Simon) · Feb The Renaissance Edition (Shopify Design) · Mär GQ & AP The Extraordinary Lab (Immersive Garden) · Apr Oryzo AI (Lusion) · Mai Floema (Bürocratik) · Jun Son Daven (The First The Last) · Jul Lama Lama · Aug ERA Residence (The First The Last) · Sep Why Zero (Sindhur Dutta/Zero) · Okt Santioni Spirits (Active Theory).
2025 u. a.: Jan Immersive Garden website · Apr Navigate (Resn) · Jun Montfort (Immersive Garden) · Jul Tracing Art (Resn) · Aug Cartier Watches & Wonders 2025 (Immersive Garden) · Sep Terminal Industries (REJOUICE) · Okt Ponpon Mania (Patrick Heng) · Dez MindMarket (Louis Paquet).

**Webby Awards 2026 (30. Verleihung)** (B)
- Best Visual Design – Aesthetic: Webby Winner **Igloo Inc** (Bureaux), People's Voice **The Renaissance Edition** (Shopify). Quelle: https://winners.webbyawards.com/winners/websites-and-mobile-sites/features-design/best-visual-design-aesthetic
- Best User Experience: Webby Winner **Pentagram Archive** (AREA 17 & Pentagram), People's Voice The Wildlife Society (Chariot). Quelle: https://winners.webbyawards.com/winners/websites-and-mobile-sites/features-design/best-user-experience
  Bemerkenswert: Der UX-Preis ging an ein Archiv, nicht an eine 3D-Seite (A).

**FWA** (B): thefwa.com ist 2026 neu gestartet („Genesis launch collection“). Die öffentliche Schnittstelle (https://thefwa.com/api/winners?per=60&page=1, abgerufen 10.11.2026) zeigt 30 Einträge mit Datum 2026, davon 23 „legacy“ (von der alten FWA übernommen), 6 „judged“, 1 „golden ticket“ – und **keinen** Jahrespreis (`year: 0`). Ein „FWA of the Year 2025“ ist dort nicht ausgewiesen (O). Enthalten u. a.: Oryzo AI (Lusion), Santioni Spirits (Active Theory, Plan8), The Renaissance Edition (Shopify Design), Explore Primland (Outpost u. a.), illoca (Unseen Studio), Lacoste Ace Breaker und No Mercy Michel (Merci-Michel), Dream with AI (Hello Monday/DEPT), IVRESS SPIN A TALE (Utsubo).

**CSS Design Awards – Website of the Year 2025** (B für die Nominierten, O für den Sieger): 17 Nominierte, u. a. Bruno's Portfolio (Jurywert 8,84), Charles Leclerc, Dropbox Brand, Lacoste Members Experience, The Monolith Project, KOKUYO Curiosity is Life. Die Seite nennt keinen Sieger. Quelle: https://www.cssdesignawards.com/woty2025/

**Lovie Awards 2026 (16.)**: Startseite der Gewinner geöffnet, die Website-Kategorien waren darüber nicht abrufbar (O). Quelle: https://winners.lovieawards.com/

### 3.2 Fünfzehn exemplarische Seiten (alle Awwwards-Seiten einzeln geöffnet; Jurywerte = Awwwards)

| # | Seite · URL | Studio | Auszeichnung (Datum SOTD) | Gesamt | Usab. | Dev: Access. | Dev: Anim. | Dev: WPO |
|---|---|---|---|---|---|---|---|---|
| 1 | Lando Norris · https://landonorris.com/ | OFF+BRAND | Site of the Year 2025 (17.11.2025) | 8,18 | 7,90 | 7,00 | 8,60 | 7,60 |
| 2 | Messenger · https://messenger.abeto.co/ | abeto | Developer Site of the Year 2025 (10.11.2025) | 7,92 | 7,46 | 7,60 | 9,00 | 8,80 |
| 3 | Igloo Inc · https://www.igloo.inc/ | abeto + Bureaux | Awwwards 2024; Webby 2026 Aesthetic (23.07.2024) | 7,92 | 7,50 | 6,60 | 9,60 | 8,00 |
| 4 | Bruno's Portfolio · https://bruno-simon.com/ | Bruno Simon | SOTM Jan 2026 (21.01.2026) | 8,11 | 7,83 | 6,60 | 8,60 | 8,20 |
| 5 | The Renaissance Edition · https://www.shopify.com/editions/winter2026 | Shopify Design | SOTM Feb 2026 (09.02.2026); Webby People's Voice | 7,92 | 7,51 | 7,00 | – | 8,40 |
| 6 | GQ & AP The Extraordinary Lab · https://www.gq.com/sponsored/story/the-extraordinary-lab | Immersive Garden | SOTM Mär 2026 (26.03.2026) | 7,74 | 7,24 | 6,00 | 8,60 | 7,40 |
| 7 | Oryzo AI · https://oryzo.ai/ | Lusion | SOTM Apr 2026 (13.04.2026); FWA | 7,86 | 7,51 | 7,00 | 8,60 | 8,60 |
| 8 | Floema · https://www.floema.com/en | Bürocratik | SOTM Mai 2026 (13.05.2026) | 7,65 | 7,38 | 7,00 | 8,20 | 7,60 |
| 9 | Son Daven · https://sondaven.com/en | The First The Last | SOTM Jun 2026 (05.06.2026) | 7,62 | 7,16 | 7,40 | 8,20 | 8,00 |
| 10 | ERA Residence · https://www.era-residence.com/ | The First The Last | SOTM Aug 2026 (31.08.2026) | 7,61 | 7,30 | 7,20 | 8,00 | 7,00 |
| 11 | Why Zero · https://why.zero.university/ | Zero / Sindhur Dutta | SOTM Sep 2026 (07.09.2026) | 7,73 | 7,46 | 6,60 | – | 8,00 |
| 12 | Santioni Spirits · https://santionispirits.com/ | Active Theory + Plan8 | SOTM Okt 2026 (05.10.2026); FWA | 8,09 | 7,54 | 6,60 | 9,40 | 7,00 |
| 13 | Immersive Garden website · https://immersive-g.com/ | Immersive Garden | SOTM Jan 2025 (07.01.2025) | 8,00 | 7,51 | 6,60 | – | 8,00 |
| 14 | Tracing Art · https://www.getty.edu/tracingart/ | Resn (für Getty) | SOTM Jul 2025 (22.07.2025) | 7,68 | 7,25 | 7,40 | – | 7,80 |
| 15 | Ponpon Mania · https://ponpon-mania.com/ | Patrick Heng, Justine Soulié | SOTM Okt 2025 (22.10.2025) | 7,64 | 7,12 | 7,20 | – | 8,20 |

Weitere geöffnet: Cartier Watches & Wonders 2025 (Immersive Garden/60fps, 18.08.2025: Usab. 7,17, Access. 6,80), Terminal Industries (REJOUICE, 03.09.2025: Access. 7,00, Anim. 8,80), MindMarket (Louis Paquet, 29.12.2025: Access. 6,80, Anim. 8,00), Lama Lama (20.07.2026: Access. 6,60, Anim. 7,80).
„–“ = Wert in meiner Abfrage nicht ausgelesen. Hinweis: Die Werte wurden über das Abruf-Werkzeug aus den Awwwards-Seiten gelesen; die Zuordnung folgt der Reihenfolge auf der Seite (Prüfer bitte stichprobenhaft gegenlesen).

**Auswertung über alle 19 geöffneten Preisträger** (B = Zahlen aus den Seiten, Rechnung von mir):
- Gesamt 7,51–8,18 (Mittel 7,81) · Usability 7,12–7,90 (Mittel 7,42) · Dev-Accessibility **6,00–7,60 (Mittel 6,89, 14 von 19 ≤ 7,0)** · Dev-WPO 7,0–8,8 (Mittel 7,89) · Dev-Animations 7,8–9,6 (Mittel 8,57, n = 13).
- Bei allen 13 Seiten mit beiden Werten liegt Accessibility unter Animations, um 0,8 bis 3,0 Punkte (Igloo Inc: 9,60 gegen 6,60).
- Awwwards gewichtet Design 40 %, Usability 30 %, Kreativität 20 %, Inhalt 10 %; ≥ 18 Juroren, die 3 entferntesten Wertungen fallen weg; Developer Award ab > 7 (B, https://www.awwwards.com/about-evaluation/).

---

## 4. Was den Stand der Kunst ausmacht – übertragbare Verfahren

### 4.1 Darstellung
- **Hybrid statt Reinform (Lusion, Oryzo):** Echtzeit-PBR erreichte die gewünschte Bildqualität nicht, Bildfolgen/Video waren nicht interaktiv; die ganze Szene als Gaussian Splat (rund 900 000 Splats) zeigte Fehler in feinen Details. Lösung: Splats **nur** für Requisiten und Tisch-Spiegelungen – 78 233 Splats am PC, 44 683 am Handy –, der Rest als vereinfachte Geometrie mit gerenderten Texturen; ein Shader verzerrt die Texturbelegung so, dass die mittleren 50 % der Fläche etwa 90 % der Texturdetails bekommen, weil die Kamera dort verweilt (B, https://blog.lusion.co/oryzo-bts-part-2-7-3d-design-and-motion-graphics, 02.04.2026).
- **Stilisierung mit einfachen Bausteinen (Bruno Simon):** jedes Grashalm = ein Dreieck (rund 78 400), Laub = zur Kamera gedrehte Flächen mit SDF-Textur, Instancing, Frustum-Culling, Palettentextur statt Vertexfarben, Texturen ETC1S/UASTC, Modelle Draco; Shader in TSL, „runs on WebGPU when available“ (B, https://www.awwwards.com/brunos-portfolio-case-study.html, 11.03.2026).
- **Partikel und Volumen (abeto, Igloo Inc):** Partikelsimulation, die zu Formen je Link zusammenfließt, Farbe nach Geschwindigkeit, Leuchten im Übergang; VDB-Volumendaten in ein browserfreundliches Format gewandelt und komprimiert; prozedurales Eiskristall-Wachstum; Übergänge aus chromatischer Aberration, Verschiebung und Frost; eigene Werkzeuge zum Live-Bearbeiten von Shadern (B, https://awwwards.com/igloo-inc-case-study.html, 31.10.2024).
- **Nachbearbeitung:** three.js führt für den neuen Renderer Bloom (auch selektiv), Tiefenschärfe, SSGI als Beispiele (B, https://threejs.org/examples/files.json: `webgpu_postprocessing_bloom_selective`, `webgpu_postprocessing_dof`, `webgpu_postprocessing_ssgi`). Bruno Simon schaltet Tiefenschärfe und Wasser-Unschärfe am Handy ab (B).
- **Werkzeugkette Immersive Garden:** three.js + Nuxt, Texturen serverseitig KTX-komprimiert und nach Kanälen gepackt, Export automatisiert mit gltf-transform, Ziel „high level of realism while minimizing GPU load and memory usage“ (B, https://www.awwwards.com/case-study-immersive-gardens-new-website.html, 04.03.2025).

### 4.2 Bewegung
- **Kontinuität ist das eigentliche Qualitätsmerkmal:** „visual consistency matters a lot more than individual flashy moments“; Szenenwechsel sollten „as seamless as possible“ sein, auch zwischen sehr verschiedenen Layouts – das habe das Projekt deutlich schwerer gemacht, vor allem responsiv (B, Lusion Teil 1, https://blog.lusion.co/oryzo-bts-part-1-7-concept-and-creative-direction, 30.03.2026). Vier Leitprinzipien: „A realistic image. The product at the centre. Seamless transitions. Humour.“ (B, Teil 3).
- **Lineare Scroll-Kamerafahrt** auf einer Kamerabahn (Oryzo: „linear scrolling web experience“, B). Immersive Garden: GSAP für Animation, Lenis für Scroll-Effekte (B).
- **Physik, wo sie Bedeutung trägt:** Bruno Simons Fahrzeug ist physikgetrieben; Lusion simuliert Verpackung/Zerreißen vorab in Houdini (Vellum) statt von Hand zu animieren (B).
- **Zurückgenommene Bewegung für Produktseiten:** Lusion musste „dramatic motion, big visual moments“ bewusst zurückdrehen: „The goal was not to overwhelm the user“ (B, Teil 1).

### 4.3 Interaktion und „Spielzeuge“
- Kleine Belohnungen: Wer in Oryzos Mikroskop-Ansicht schnell zieht/schüttelt, lässt ein Bärtierchen erscheinen; wer lange bleibt, sieht winzige Figuren (B, Teil 2/3). Immersive Garden: versteckter „Backstage“-Bereich und „Subtle animations … that reward user exploration“ (B). Bruno Simon: Erfolge, Rundenzeiten, gemeinsame Zähler (B).
- Oberfläche im WebGL (Igloo): Glitches und Text-Scramble über SDF-Textur statt HTML (B) – Kehrseite siehe 5.2.

### 4.4 Ton
- Bruno Simon: drei Musikstücke (CC0), Umgebungsgeräusche, **räumlich verortete** Objektklänge, ein einziger Klick-Klang mit variierter Abspielrate (B). Igloo: Klang auf die Partikelbewegung synchronisiert, „playful and satisfying“ (B). Santioni: Sound von Plan8, Awwwards-Schlagwort „Sound-Audio“ (B).
- Browser-Regel: Ein `AudioContext` startet ohne Nutzergeste „suspended“ und muss nach einer Geste mit `resume()` fortgesetzt werden (B, https://developer.chrome.com/blog/autoplay). Ton ist damit technisch ohnehin **Opt-in** (A).
- Eigene Messung: In 12 von 14 Seiten kommt Audio-Code vor (B, Textsuche).

### 4.5 Ladeablauf
- Igloo: Intro in Echtzeit statt Video (hält die Dateigröße klein und geht nahtlos in die Seite über), eigene Geometrie-Exporter, Texturen laden und Shader übersetzen **während des Ladens und im Hintergrund** (B).
- Messung der ersten 25 s (Handy-Bildschirm, B): Messenger 3,40 MB · Oryzo 4,60 MB (Probelauf 7,04) · Bruno 5,05 · Why Zero 5,66 · Lando Norris 6,96 · Lusion 8,70 · Igloo 14,67 · Floema 17,72 · Immersive Garden 21,08 · GQ/AP 36,04 (inkl. Werbetechnik, 74 Hosts) · leichter: Tracing Art 1,92, Ponpon Mania 1,95, Renaissance Edition 2,24. **Median der 13 auswertbaren Seiten: 5,66 MB.** Vergleich: mittlere mobile Seite laut HTTP Archive 2 164 KB, 90. Perzentil 8 337 KB (B, Juli 2025, https://almanac.httparchive.org/en/2025/page-weight).

### 4.6 Navigation
- Immersive Garden: „intuitive, one-click access navigation system“, 3D-Ziffern als Anker (B). NN/g: sichtbare, mitlaufende Navigation ist der „escape hatch“ aus Scroll-Strecken (B).
- Lusion-Seitenstruktur bewusst konventionell: „hero shot, key benefit, usage, specs, reviews, comparisons, purchase. Nothing unusual.“ (B, Teil 3) – die Innovation liegt in der Ausführung, nicht im Aufbau.

### 4.7 Handy
- Eigene Stufe statt Verkleinerung: Bruno Simon „automatically switches to a lower quality preset“ (kein DoF, kleinere Schattenkarten) (B); Lusion 44 683 statt 78 233 Splats (B); abeto misst während der Entwicklung und passt für schwache Geräte an (B).
- Lenis: auf Safari auf 60 Bilder/s begrenzt, im Stromsparmodus 30; `syncTouch` auf iOS < 16 instabil (B, https://github.com/darkroomengineering/lenis README).
- NN/g: „Scrolljacking Is Worse on Mobile“ (B).

### 4.8 Barrierefreiheit / „Bewegung reduzieren“
- In den vier geöffneten Studio-Fallstudien (Bruno Simon, Igloo, Immersive Garden, Lusion Teil 1–3) kommt Barrierefreiheit **nicht vor** (B, jeweils geprüft).
- Eigene Messung (B): `prefers-reduced-motion` kommt im geladenen Code bei 6 von 14 Seiten vor (Lando Norris, Why Zero, Renaissance Edition, Floema, GQ/AP, lusion.co), bei 8 nicht (Messenger, Oryzo, Igloo, Bruno, Immersive Garden, Ponpon Mania, Tracing Art; Santioni lieferte nur „Not Supported“).
- Positivbeispiel Technik: Lenis achtet die Einstellung standardmäßig (`respectReducedMotion: true`: Glättung aus, Sprünge sofort) und läuft „on native scroll“, sodass `position: sticky`, Ankerlinks und Bedienhilfen weiter funktionieren (B).
- Positivbeispiel Inhalt: Oryzo liefert ohne JavaScript 5 491 Zeichen Text, 22 Links, eine h1; lusion.co 2 165 Zeichen; Immersive Garden 3 230 (B, Messung) – die besten Studios bauen das 3D als Schicht **über** echtes HTML (A).

---

## 5. Was diese Seiten nachweislich schlecht machen

### 5.1 Belege
1. **Jurywerte der Preisvergabe selbst** (B): Accessibility ist bei allen 19 Preisträgern der schwächste oder einer der schwächsten Entwicklerwerte (6,0–7,6), Usability liegt durchweg unter dem Gesamtwert-Niveau der Gestaltung (Mittel 7,42).
2. **Gewicht** (B, Messung): Median 5,66 MB in 25 s, Spitzen 14,7–21,1 MB ohne Werbetechnik.
3. **Inhalt nur im Canvas** (B, Messung): Messenger, Igloo Inc und Bruno's Portfolio haben auch **mit** JavaScript 0 Zeichen lesbaren DOM-Text; ohne JavaScript bleiben 8 von 14 Seiten praktisch leer (≤ 560 Zeichen). Für Vorleseprogramme, Suche und Übersetzung ist dort nichts greifbar (A).
4. **Harte Geräte-Schranke** (B, Messung in dieser Umgebung): Santioni Spirits zeigte statt der Seite nur „Not Supported“.
5. **Dritt-Abrufe ohne Einwilligung** (B, Messung ohne Klick): 12 von 14 Seiten sprechen beim ersten Laden fremde Hosts an (Google Analytics/Tag Manager, Google Fonts, Typekit, Cloudflare Insights, unpkg, Vimeo, Facebook …); nur igloo.inc und getty.edu blieben beim eigenen Anbieter. Für eine deutsche Praxis nicht übertragbar (A).
6. **Scroll-Hijacking** (B, NN/g, Sara Paul, 06.08.2023, https://www.nngroup.com/articles/scrolljacking-101/): „The majority of our study participants were at least mildly disoriented by scrolljacking“; „Task-Oriented Users Were Highly Annoyed“; „Scrolljacking Is Worse on Mobile“; am schlechtesten: veränderte Scroll-Rate/-Richtung plus Lesetext; „we advise against including important content inside of a scrolljack section“; Fazit: „can do more harm than good“.
7. **Bewegung** (B): WCAG 2.2.2 (Stufe A) verlangt für Bewegtes, das automatisch startet, länger als fünf Sekunden läuft und neben anderem Inhalt steht, einen Mechanismus zum Anhalten/Ausblenden (https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html). WCAG 2.3.3 (AAA): durch Interaktion ausgelöste Bewegung muss abschaltbar sein; scroll-ausgelöste Bewegung kann Schwindel, Übelkeit, Kopfschmerz auslösen (https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html). NN/g: Animation müsse „unobtrusive, brief, and subtle“ sein; „gratuitous animations distract and annoy the user“ (Page Laubheimer, 12.01.2020, https://www.nngroup.com/articles/animation-purpose-ux/).
8. **Ältere Fachquelle zur Vergabe** (B, schwächer, 05.10.2022): Greenspector fand bei Awwwards-Nominierten u. a. > 12 MB und > 400 Anfragen (betterup.com) und stellt fest, dass der Usability-Wert trotz rund 40 Barrierefreiheits- und 30 Kontrastfehlern hoch blieb (https://greenspector.com/en/resources/blog/analysis_sites_nominated_mobile_excellence_awwwards/). Universität Warschau (LBM UW, 31.01.2025): Awwwards-Seiten seien „often criticized for their low level of functionality and usability“ – die Blog-Zusammenfassung nennt aber keine Zahlen (B für das Zitat, O für die Stärke des Befunds; https://blog.lbm.uw.edu.pl/?p=501).

### 5.2 Folgerungen für eine Praxis-Website (Menschen oft 50+, Ziel: Adresse/Termin)
- **Der schnelle Weg darf nie durch die Reise führen** (A aus 6): Termin, Telefon, Adresse, Öffnungszeiten gehören in den ersten Bildschirm und in eine mitlaufende Leiste; die Reise ist das Angebot, nicht die Schranke. NN/g zu älteren Nutzern: sie machen mehr Fehler, kleine Bedienelemente und helle, kontrastarme Schrift sind Hürden; die Fähigkeit, Websites zu bedienen, nimmt zwischen 25 und 60 um 0,8 % pro Jahr ab (B, Lexie Kane, 08.09.2019, https://www.nngroup.com/articles/usability-for-senior-citizens/).
- **Kein wichtiger Text nur in einer Scroll-Strecke oder nur im Canvas** (A aus 3, 6).
- **Echtes Scrollen behalten**: Kamera folgt dem Scrollen, das Scrollen wird nicht umgebogen (A aus 6; technisch belegt durch Lenis „runs on native scroll“).
- **Anhalten und reduzierte Fassung sind Pflichtteile, keine Zugabe** (A aus 7) – auf Kais Seite bereits vorhanden (`#motionBtn`, `hop-motion`, B aus Projektanleitung/Messung).
- **Keine Dritt-Hosts, keine Geräte-Schranke** (A aus 4, 5): ohne WebGL Standbilder statt „Not Supported“ – auf Kais Seiten bereits so angelegt.

---

## 6. Was Ende 2026 als „das Neue“ gilt – Mode oder tragfähig?

| Entwicklung | Beleg | Einschätzung für diese Seite |
|---|---|---|
| **WebGPU** | Seit 25.11.2025 „supported in major browsers“: Chrome/Edge ab 113 (Windows, macOS, ChromeOS), Android ab Chrome 121 (Android 12+, Qualcomm/ARM), Firefox 141 (Windows) / 145 (macOS ARM), Safari 26 (macOS/iOS/iPadOS/visionOS 26) (B, https://web.dev/blog/webgpu-supported-major-browsers). iOS-Safari vor 26: nein (B, caniuse-Rohdaten). WebKit: „WebGPU supersedes WebGL … and is preferred for new sites“ (B, https://webkit.org/blog/17333/webkit-features-in-safari-26-0/, 15.09.2025). | **Trägt langfristig, jetzt nicht der Hebel.** three.js: `WebGPURenderer` fällt automatisch auf WebGL 2 zurück, aber `ShaderMaterial`/`RawShaderMaterial`/`onBeforeCompile` und `EffectComposer` werden nicht unterstützt und müssen auf TSL portiert werden; der Renderer sei „still in an experimental state“; `WebGLRenderer` bleibe „the recommended choice for pure WebGL 2 applications“ (B, https://threejs.org/manual/pages/webgpurenderer.html). Kais Quellen nutzen GLSL-`ShaderMaterial` (B, 17 Treffer allein in `src/fusion`, three 0.187) → Umbau = Neuschreiben aller Shader, sichtbarer Gewinn für Punktwolken unklar (A/O). |
| **Gaussian Splats** | `KHR_gaussian_splatting`: „Complete, Ratified by the Khronos Group“ (B, https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_gaussian_splatting, abgerufen 10.11.2026); three.js-Beispiel `webgpu_gaussian_splat` (B); Lusion produktiv im Hybrid (B). | **Trägt als Zutat, nicht als Bühne.** Lusions Lehre: Voll-Szene mit 900 000 Splats war schlechter als 78 233 gezielte. Für HOP nur als Experiment sinnvoll (ein echter Gegenstand/Raum), sonst Stilbruch und Megabytes (A). |
| **KI-erzeugte 3D-Inhalte** | Lusion: Midjourney nur für frühe Bildideen; ein einziges Osterei-Modell über Nano Banana Pro → Hunyuan 3D → Nacharbeit in ZBrush; „None of the illustrations on the site were AI assisted“; KI nur, um Entscheidungen zu beschleunigen, nicht zu ersetzen (B, Teil 2/3). | **Werkzeug, kein Merkmal.** Als Skizzenhilfe tragfähig; als sichtbarer Stil Mode – die Spitze setzt bewusst Handgemachtes dagegen (A). |
| **Räumliches Web / visionOS** | HTML-`<model>` „Now on visionOS“ (B, WebKit 15.09.2025). | **Mode für diese Zielgruppe** (iPhone/PC); kein Nutzen ohne Vision Pro (A). |
| **Echtzeit-Simulation (GPGPU)** | three.js-Beispiele `webgpu_compute_particles`, `…_fluid`, `webgpu_tsl_compute_attractors_particles` (B); Igloo-Partikel/Fluid, Bruno-Physik (B). | **Trägt, wenn die Simulation die Aussage ist** (Spannung löst sich) – nicht als Dekoration (A). Rechen-Shader brauchen WebGPU; in WebGL 2 nur über Umwege (A). |
| **CSS-Plattform statt JS** | Scroll-gesteuerte Animationen in Safari 26 (B, WebKit); Seitenübergänge zwischen Dokumenten per `@view-transition { navigation: auto }` (gleiche Herkunft nötig; Chrome/Edge 126+, Safari/iOS 18.2+, Firefox nur teilweise) (B, MDN + caniuse). | **Trägt und ist billig:** filmische Übergänge zu Unterseiten ohne Framework, auf statischem Hosting (A). |
| **Alles im Canvas (UI in WebGL)** | Igloo (B). | **Mode mit hohem Preis:** 0 Zeichen DOM-Text (B, Messung). Für eine Praxis ausgeschlossen (A). |

Zur Verbreitung: 9 der 10 Awwwards-Monatssieger Jan–Okt 2026 tragen WebGL/3D/Three.js-Schlagworte (Ausnahme: ERA Residence) (B für die Schlagworte je Seite, A für die Zählung). Zahlen aus Agentur-Blogs („61 % der SOTD im 1. Quartal 2026 sind 3D“) habe ich nicht gegen Awwwards-Daten prüfen können (O).

---

## 7. Empfehlungen – Verfahren, die die dunkle Partikel-Praxis auf Preisträger-Niveau heben

Reihenfolge nach Wirkung. Aufwand: klein (Tage) · mittel (1–2 Wochen) · groß (mehrere Wochen). Alle kostenlos umsetzbar, soweit nicht anders vermerkt.

**E1 – Zwei Wege durchs Haus: „Gleich zum Termin“ und „Kommen Sie herein“.**
Erster Bildschirm und mitlaufende Leiste mit Termin, Telefon, Adresse; die Reise bleibt freiwillig, kein Inhalt existiert nur in ihr.
Beleg: NN/g Scrolljacking (aufgabenorientierte Nutzer „highly annoyed“, mitlaufende Navigation als Ausweg); Oryzo liefert allen Text als HTML (Messung). Beispiel: https://oryzo.ai/
Aufwand klein · Risiko gering (Gestaltung der Leiste darf die Bühne nicht erschlagen).

**E2 – Kontinuität als oberstes Gestaltungsgesetz.**
Eine Welt, eine Kamera, kein harter Schnitt: Jeder Abschnitt (auch Leistungen, Hausordnung, Kontakt) bleibt im selben Haus, Übergänge sind Wege. Das ist bei Kais Rundgang im Kern schon angelegt und sollte der Maßstab für jede neue Idee sein.
Beleg: Lusion – „visual consistency matters a lot more than individual flashy moments“, „Seamless transitions“ als eines von vier Prinzipien. Beispiel: https://oryzo.ai/ · https://www.igloo.inc/
Aufwand mittel · Risiko: responsiv am schwersten (sagt Lusion selbst).

**E3 – Verzicht als System.**
Eine Schriftfamilie, vier Farbwerte (dunkel, Bernstein, ein warmer heller Ton, eine Signalfarbe), wenige UI-Formen; laut wird nur, was Bedeutung trägt.
Beleg: Lusion Teil 3 – rund 99 % der Schrift in einer Familie, vier Farben, „Most of the UX work on Oryzo came down to deciding what not to do.“ Beispiel: https://oryzo.ai/
Aufwand klein · Risiko gering.

**E4 – Eine menschliche, handgemachte Schicht über der Partikelwelt (Wärme).**
Handschrift, Handzeichnung, echte Stimme, ein echtes Foto – als Gegengewicht zur Technik. Genau das hält den „Zuhause“-Charakter.
Beleg: Lusion – „we wanted a layer that felt more obviously handmade“, alle Illustrationen von Hand in Procreate; Heldenszene bewusst „warm, calm“ und „lived in“. Beispiel: https://oryzo.ai/
Aufwand klein–mittel (braucht Material von Kai) · Risiko: Heilmittelwerberecht bei Fotos/Aussagen → anderer Strang (O).

**E5 – Ton als Einladung: aus, bis man ihn anschaltet; dann räumlich und an Handlungen gebunden.**
Tür, Schritte, Atem der Figur, das „Lösen“ einer Spannung; ein Klang pro Geste, räumlich verortet; Schalter sichtbar, Zustand gemerkt, bei „Bewegung anhalten“ still.
Beleg: Bruno Simon (verortete Klänge, ein Klick-Klang mit variierter Rate, Musik CC0), Igloo (Klang folgt Partikeln), Santioni (Plan8); Browser erzwingen Nutzergeste. Beispiel: https://bruno-simon.com/ · https://santionispirits.com/
Aufwand mittel · Risiko: Störfaktor im Wartezimmer/Büro, Dateigewicht (Ziel wenige 100 KB), Rechte (nur selbst aufgenommene oder CC0-Klänge).

**E6 – Gerätestufen per eigener Bildzeit-Messung.**
Drei Stufen (Handy sparsam / Handy stark / PC) mit festen Punktzahlen und Effekten; Einstufung durch gemessene Bildzeiten in den ersten Sekunden, nicht durch Geräteerkennung aus dem Netz.
Beleg: Bruno Simon (automatische niedrigere Stufe am Handy), Lusion (44 683 statt 78 233 Splats). Warnung: `@pmndrs/detect-gpu` lädt seine Vergleichsdaten standardmäßig von unpkg.com (B, README) – Oryzo und Lando Norris sprachen in der Messung unpkg.com an (B; Zusammenhang A). Beispiel: https://bruno-simon.com/
Aufwand klein–mittel · Risiko gering; baut auf der vorhandenen Akkuregel auf.

**E7 – Filmische Nachbearbeitung, aber nur auf der PC-Stufe und nur dosiert.**
Selektives Leuchten auf Bernstein-Punkten, sehr weiche Tiefenschärfe auf dem Blickziel, feines Korn gegen Farbstufen im Dunkel.
Beleg: three.js-Beispiele (selektives Bloom, DoF), Bruno Simon schaltet DoF am Handy ab; Immersive Garden nutzte Rauschen gegen Streifen in Verläufen (älteres Projekt, Suchergebnis – O). Beispiel: https://immersive-g.com/ · https://threejs.org/examples/#webgpu_postprocessing_bloom_selective
Aufwand mittel · Risiko: Lesbarkeit von Text über leuchtender Bühne, Bildrate; am PC messen, am Handy weglassen.

**E8 – Eine echte Simulation dort, wo sie die Botschaft ist: „Spannung lösen“.**
Die Berührung der Figur als kleines physikalisches System (Punkte mit Federn/Trägheit, die sich entspannen), statt abgespielter Animation; ein einziges solches Spielzeug, sehr gut gemacht.
Beleg: Igloo (Partikel bilden Formen, reagieren mit Klang), Bruno Simon (Physik als Kern), three.js-Rechenbeispiele. Beispiel: https://www.igloo.inc/ · https://threejs.org/examples/#webgpu_compute_particles
Aufwand groß · Risiko hoch am iPhone (Rechenlast; in WebGL 2 nur über Texturen/Transform Feedback), deshalb mit Messung gegen den heutigen Stand absichern.

**E9 – Zwei bis drei Belohnungen mit Sinn.**
Kleine Entdeckungen, die zur Praxis passen (z. B. längeres Verweilen am Empfang lässt die Figur einmal durchatmen; die Tür „klopft“ zurück) – nie Voraussetzung für Information.
Beleg: Oryzo (Bärtierchen beim Schütteln, Figuren beim Verweilen), Immersive Garden („reward user exploration“, Backstage). Beispiel: https://oryzo.ai/ · https://immersive-g.com/
Aufwand klein–mittel · Risiko: Spielerei; auf höchstens drei begrenzen.

**E10 – Seitenübergänge mit View Transitions.**
Impressum, Datenschutz, künftige Leistungs-Unterseiten gleiten statt zu springen – reines CSS, ohne Framework, auf GitHub Pages.
Beleg: MDN `@view-transition` (gleiche Herkunft), caniuse (Chrome/Edge 126+, Safari/iOS 18.2+; Firefox teilweise → dort einfach normaler Seitenwechsel). Beispiel für gepflegte Seitenwechsel: https://www.shopify.com/editions/winter2026
Aufwand klein · Risiko gering; mit „Bewegung reduzieren“ abschalten.

**E11 – Hybrid-Experiment (optional): ein echter Gegenstand im Partikelhaus.**
Ein einziges reales Stück (z. B. die Eingangstür oder die Manuthera-Liege) als kleiner Splat oder gerenderte Textur, der Rest bleibt Punktwolke – der Moment „das gibt es wirklich“.
Beleg: Lusion-Hybrid (Splats nur für Requisiten; LichtFeld Studio kostenlos, Postshot kostenpflichtig). Beispiel: https://oryzo.ai/
Aufwand groß · Risiko hoch: Megabytes, Stilbruch, Aufnahmeaufwand; erst nach einer Machbarkeitsprobe entscheiden (Details: Strang Technik/Splats).

**E12 – Nicht tun: WebGPU-Umbau, Oberfläche im Canvas, Scroll umbiegen, Geräte aussperren.**
Beleg: three.js-Handbuch (experimentell, GLSL-Materialien nicht unterstützt), Messung (0 Zeichen Text bei Igloo/Messenger/Bruno; „Not Supported“ bei Santioni), NN/g. Neue Shader aber so schreiben, dass ein späterer Wechsel möglich bleibt (A).
Aufwand: gespart.

---

## 8. Hartes Ziel und unabhängige Prüfung

**Ziel (aus diesem Strang):** Die neue Seite erreicht bei Bewegung/Übergängen das Niveau der Preisträger **und schlägt alle 13 gemessenen Preisträger gleichzeitig** in den Punkten, in denen diese nachweislich schwach sind:

| Messgröße | Preisträger (gemessen/Jury) | Heute `hausbesuch-puls.html` (gemessen) | Ziel neue Seite |
|---|---|---|---|
| Übertragung erste 25 s, Handy-Bildschirm | Median 5,66 MB (1,92–36,04) | 0,41 MB, 5 Anfragen | ≤ 1,5 MB inkl. Ton |
| Text ohne JavaScript | 8 von 14 praktisch leer | 4 187 Zeichen, 20 Links, 1 h1 | 100 % der Inhalte |
| Dritt-Hosts beim Laden | 12 von 14 mit Dritt-Hosts | 0 | 0 |
| „Bewegung reduzieren“ im Code | 6 von 14 | ja | ja + Anhalten (WCAG 2.2.2) |
| Awwwards Dev-Accessibility | 6,0–7,6 | – | Maßstab ≥ 8 (nur als Vergleichsgröße) |
| Weg zu Termin/Telefon/Adresse | – | – | ohne Scrollen sichtbar, 1 Tipp |
| Core Web Vitals | – | – | LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1 (B, https://web.dev/articles/vitals) |

**Prüfung:** dasselbe Mess-Skript (`measure.cjs`) gegen die neue Seite; axe/Lighthouse (`labor/tools/audit.cjs`); Bildraten-Vergleich zweier Builds (`labor/tools/frames.cjs`); echtes iPhone und PC durch Kai. Eine unabhängige Fachjury (Awwwards/CSSDA/FWA-Einreichung) wäre die härteste Prüfung – Einreichungskosten und -bedingungen habe ich nicht geprüft (O; Kostenregel beachten).

**Ehrlicher Stand gegen das Ziel:** Bei Gewicht, Text, Dritt-Hosts und reduzierter Bewegung liegt die heutige Seite bereits über den Preisträgern (gemessen). Nicht gemessen und damit offen: Bildrate auf echten Geräten, Wirkung auf Menschen 50+, Qualität der Bewegung im Vergleich (dafür fehlt ein Jury-/Nutzertest).

---

## 9. Tragende Aussagen (für die Gegenprüfung)

| id | Aussage | Kennz. | Quelle (Datum) |
|---|---|---|---|
| I3 | Awwwards-Entwicklerjury: Accessibility 6,0–7,6 (Mittel 6,89) bei 19 Preisträgern; bei allen 13 mit beiden Werten unter Animations (7,8–9,6, Mittel 8,57). | B | 19 awwwards.com/sites/…-Seiten (2024–2026), Liste in 3.2 |
| I4 | Eigene Messung: Median 5,66 MB/25 s (13 Seiten); 8 von 14 ohne JS ≤ 560 Zeichen Text; 12 von 14 mit Dritt-Hosts; 6 von 14 mit `prefers-reduced-motion`; Kais Seite 0,41 MB, 5 Anfragen, 4 187 Zeichen. | B | messung.json, hop.json (10.11.2026) |
| I5 | Lusion Oryzo: 900 000-Splat-Szene verworfen; Hybrid mit 78 233 (PC) / 44 683 (Handy) Splats nur für Requisiten und Spiegelungen. | B | https://blog.lusion.co/oryzo-bts-part-2-7-3d-design-and-motion-graphics (02.04.2026) |
| I6 | Lusion: Kontinuität vor Einzeleffekt; eine Schriftfamilie (~99 %), vier Farben; „deciding what not to do“; Illustrationen von Hand. | B | https://blog.lusion.co/oryzo-bts-part-1-7-concept-and-creative-direction (30.03.2026), https://blog.lusion.co/oryzo-bts-part-3-7-website-ux-ui-and-illustrations (21.04.2026) |
| I7 | NN/g: Mehrheit durch Scrolljacking desorientiert; am Handy schlimmer; aufgabenorientierte Nutzer sehr verärgert; kein wichtiger Inhalt in Scroll-Strecken; mitlaufende Navigation als Ausweg. | B | https://www.nngroup.com/articles/scrolljacking-101/ (06.08.2023) |
| I8 | three.js: `WebGPURenderer` mit automatischem WebGL-2-Rückfall, aber ohne `ShaderMaterial`/`EffectComposer`, „still in an experimental state“; `WebGLRenderer` empfohlen für reine WebGL-2-Anwendungen. | B | https://threejs.org/manual/pages/webgpurenderer.html (abgerufen 10.11.2026) |
| I10 | Bruno Simon: TSL → WebGPU wenn verfügbar; Handy automatisch niedrigere Stufe (kein DoF/Wasser-Blur); räumliche Klänge; Code MIT, Musik CC0. | B | https://www.awwwards.com/brunos-portfolio-case-study.html (11.03.2026) |
| I12 | WCAG 2.2.2 (A): Bewegtes > 5 s, automatisch, parallel → Mechanismus zum Anhalten; 2.3.3 (AAA): Interaktions-Animation abschaltbar. | B | w3.org/WAI/WCAG22/Understanding/… |
| I13 | `AudioContext` startet ohne Nutzergeste „suspended“ → Ton ist faktisch Opt-in. | B | https://developer.chrome.com/blog/autoplay |
| I18 | Lenis läuft auf nativem Scrollen und achtet `prefers-reduced-motion` standardmäßig; Safari 60 Bilder/s, Stromsparmodus 30. | B | https://github.com/darkroomengineering/lenis (README, abgerufen 10.11.2026) |

---

## 10. Fehlende Zugänge und offene Fragen

**Nicht erreichbar / nicht gefunden**
- Codrops (tympanus.net): HTTP 403 für Artikel und Feed (u. a. „Lusion: Where Digital Craft Meets Ambitious Experimentation“, 13.04.2026); web.archive.org über den Proxy nicht erreichbar. Hätte weitere Fallstudien mit Technikdetails geliefert.
- Lusion Oryzo BTS Teil 4–7 (WebGL/three.js-Tricks) waren am 10.11.2026 auf blog.lusion.co nicht veröffentlicht (nur 3 Beiträge) – dort stünde die eigentliche Splat-/Übergangstechnik.
- Keine Fallstudie zu Lando Norris (OFF+BRAND), Messenger (abeto) und Santioni Spirits (Active Theory) gefunden.
- Lovie Awards: Website-Kategorien nicht abrufbar; CSSDA WOTY 2025: Sieger auf der Seite nicht genannt; FWA: kein Jahrespreis im neuen System.
- Awwwards-Seiten ließen sich nur über das Abruf-Werkzeug lesen (curl über den Proxy brach ab) – Jurywerte daher nicht im Rohtext gegengeprüft.
- Kein Gerät mit Grafikchip, kein echtes iPhone: keine Bildraten, keine realen Ladezeiten, keine Aussage über Stufenwahl der Preisträger.
- Die Preisträger selbst habe ich nicht „durchgespielt“ (SwiftShader zu langsam, Santioni blockiert): Aussagen über Bewegung/Übergänge stützen sich auf Fallstudien und Jurywerte, nicht auf eigene Anschauung.

**Offene Fragen**
1. Bringt selektives Leuchten/Tiefenschärfe der Punktwolke sichtbar mehr, oder verliert der „gestochene“ Stil dadurch? (Probe-Build + Kais Blick.)
2. Trägt eine echte Simulation für „Spannung lösen“ am iPhone bei stabiler Bildrate? (Messung mit `frames.cjs` gegen heutigen Stand.)
3. Will Kai Ton überhaupt – und gibt es eigene Aufnahmen aus der Praxis?
4. Soll die Seite bei Preisen eingereicht werden (Kosten, Aufwand) oder genügt der Messvergleich als Maßstab?
5. Wie reagieren Menschen 50+ auf die Reise, wenn der schnelle Weg daneben liegt? (Kleiner Test mit 5 Personen wäre die eigentliche Prüfung.)

---

## 11. Quellen (alle am 10.11.2026 geöffnet)

Preise
- https://www.awwwards.com/annual-awards/winners
- https://www.awwwards.com/websites/sites_of_the_month/
- https://www.awwwards.com/about-evaluation/
- Awwwards-Einzelseiten: /sites/lando-norris · /sites/messenger · /sites/oryzo-ai · /sites/brunos-portfolio · /sites/gq-ap-the-extraordinary-lab · /sites/santioni-spirits · /sites/igloo-inc · /sites/floema · /sites/era-residence · /sites/son-daven · /sites/lama-lama-2 · /sites/why-zero · /sites/tracing-art · /sites/ponpon-mania · /sites/cartier-watches-wonders-2025 · /sites/the-renaissance-edition · /sites/immersive-garden-website · /sites/mindmarket · /sites/terminal-industries (jeweils https://www.awwwards.com/…)
- https://thefwa.com/ und https://thefwa.com/api/winners?per=60&page=1
- https://winners.webbyawards.com/winners/websites-and-mobile-sites/features-design/best-visual-design-aesthetic
- https://winners.webbyawards.com/winners/websites-and-mobile-sites/features-design/best-user-experience
- https://www.cssdesignawards.com/woty2025/ · https://www.cssdesignawards.com/woty2025/sites/brunos-portfolio
- https://winners.lovieawards.com/

Fallstudien
- https://blog.lusion.co/oryzo-bts-part-1-7-concept-and-creative-direction (30.03.2026, aktualisiert 21.04.2026)
- https://blog.lusion.co/oryzo-bts-part-2-7-3d-design-and-motion-graphics (02.04.2026)
- https://blog.lusion.co/oryzo-bts-part-3-7-website-ux-ui-and-illustrations (21.04.2026)
- https://www.awwwards.com/brunos-portfolio-case-study.html (11.03.2026) · https://github.com/brunosimon/folio-2025
- https://awwwards.com/igloo-inc-case-study.html (31.10.2024)
- https://www.awwwards.com/case-study-immersive-gardens-new-website.html (04.03.2025)

Kritik, Normen, Vergleichswerte
- https://www.nngroup.com/articles/scrolljacking-101/ (06.08.2023)
- https://www.nngroup.com/articles/animation-purpose-ux/ (12.01.2020)
- https://www.nngroup.com/articles/usability-for-senior-citizens/ (08.09.2019)
- https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html
- https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
- https://web.dev/articles/prefers-reduced-motion · https://web.dev/articles/vitals (31.10.2024)
- https://greenspector.com/en/resources/blog/analysis_sites_nominated_mobile_excellence_awwwards/ (05.10.2022)
- https://blog.lbm.uw.edu.pl/?p=501 (31.01.2025)
- https://almanac.httparchive.org/en/2025/page-weight (15.01.2026, Daten Juli 2025)

Technikstand
- https://threejs.org/manual/pages/webgpurenderer.html · https://threejs.org/examples/files.json
- https://web.dev/blog/webgpu-supported-major-browsers (25.11.2025)
- https://webkit.org/blog/17333/webkit-features-in-safari-26-0/ (15.09.2025)
- https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/webgpu.json · …/cross-document-view-transitions.json · …/view-transitions.json
- https://developer.mozilla.org/en-US/docs/Web/CSS/@view-transition
- https://raw.githubusercontent.com/KhronosGroup/glTF/main/extensions/2.0/Khronos/KHR_gaussian_splatting/README.md
- https://developer.chrome.com/blog/autoplay
- https://github.com/darkroomengineering/lenis (README) · https://github.com/pmndrs/detect-gpu (README)
- https://gsap.com/pricing/ („GSAP is now 100% free for all users, thanks to Webflow's support“; Lizenztext dort nicht genannt – O)
- https://www.theatrejs.com/ (Animationswerkzeug für three.js; Lizenz auf der Seite nicht genannt – O)

Eigene Messung
- Skript und Rohdaten: siehe 2.2. Gemessen am 10.11.2026: landonorris.com, messenger.abeto.co, oryzo.ai, igloo.inc, bruno-simon.com, santionispirits.com, immersive-g.com, why.zero.university, ponpon-mania.com, shopify.com/editions/winter2026, getty.edu/tracingart, floema.com/en, gq.com/sponsored/story/the-extraordinary-lab, lusion.co, kairaethel-eng.github.io/labor/hausbesuch-puls.html.
