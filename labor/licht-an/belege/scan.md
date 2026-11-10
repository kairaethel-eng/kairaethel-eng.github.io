# Strang „Echter Scan“ – die echte Praxis fotorealistisch und kostenlos in die Website?

Stand: 10.11.2026 · Kennzeichnung: **B** = von mir geöffnete Quelle stützt es genau so (oder eigene Messung) · **A** = abgeleitet/plausibel · **O** = offen/nicht belegt.
Alle Quellen am 10.11.2026 abgerufen; Datum der Quelle steht dabei, soweit die Quelle eines nennt.

## Kurzantwort

Ja, technisch geht es kostenlos und ohne Fremdabrufe – und der Übergang „Partikel-Skizze → echter Raum“ ist kein Wunschdenken, sondern liegt als Beispiel-Code im offiziellen Spark-Paket vor. Ehrlich bleibt aber: (1) nichts davon wurde auf Kais iPhone gemessen, (2) die bequemste Aufnahme-App (Scaniverse) ist laut Nutzungsbedingungen nur für persönliche, nicht-kommerzielle Zwecke lizenziert, (3) Innenräume mit weißen Wänden, Spiegeln und Fenstern sind der schwierigste Fall für das Verfahren.

Empfehlung in drei Stufen, jede für sich abbrechbar:

1. **Probe-Scan eines Raums** (ein Abend, 0 €) – entscheidet, ob die Praxis als Splat überhaupt gut aussieht.
2. **Stufe „Echtfarben-Punkte“**: Aus dem Splat nur Mittelpunkte + Farbe nehmen und im **bestehenden** Punkt-Shader zeichnen. Kein neuer Renderer, ~1–2 MB je Raum, der gestochene Stil bleibt, der Raum ist trotzdem erkennbar „echt“.
3. **Stufe „Fenster in den echten Raum“**: Spark (MIT) erst auf Tipp nachladen, Splat wächst aus Punkten zur Fotorealität. ~1 MB Programm (gzip) + ~5–8 MB je Raum.

AR (Wirbelsäule „bei mir im Zimmer“): derzeit nicht lohnend – es fehlt ein Netz-Modell, der Nutzen für die Terminentscheidung ist nicht belegt.

---

## 1. Gaussian Splatting im Web – Stand November 2026

### Renderer

| Renderer | Stand / Reife | Lizenz | Technik | Urteil für HOP |
|---|---|---|---|---|
| **Spark** (World Labs) für three.js | Version 2.4.0 (package.json); aktiv, Beispiele, Doku | MIT | WebGL2, „98%+ WebGL2 support“, Sortierung im Worker; LoD + Streaming seit 2.0 | **Erste Wahl** – läuft im vorhandenen `THREE.WebGLRenderer`, braucht three ≥ 0.180 (Projekt nutzt 0.187) |
| mkkellogg/GaussianSplats3D | „no longer in active development“, Autor empfiehlt Spark | MIT (A) | WebGL, CPU-Sortierung | Nicht mehr nehmen |
| three.js selbst (r186) | Erster eigener Splat-Renderer, **WebGPU/TSL**, nur SH0, kein LoD/Streaming | MIT | `WebGPURenderer` (JS-Fallback für dessen WebGL-Backend) | Passt nicht: Seite nutzt `WebGLRenderer` + eigene GLSL-Shader |
| Spark Radix | 0.0.1, „experimental“ WebGPU | – | WebGPU, auf WebGL2 langsamer als Spark | Beobachten, nicht einsetzen |
| PlayCanvas Engine + SuperSplat | Ausgereift, SOG/Streamed SOG, WebGPU-Renderer seit 2026 | MIT | Eigene Engine | Zweite Engine neben three.js = doppeltes Gewicht; nur als Werkzeug (Editor/Konverter) nutzen |
| Babylon.js | Liest PLY, .splat, SPZ, SOG, glTF-KHR, Streamed SOG | Apache-2.0 (A) | WebGL2/WebGPU | Wie PlayCanvas: zweite Engine |
| Luma-Web | Kein aktueller Stand gefunden | – | – | **O** – nicht belegt, nicht verwenden |

Belege:
- **B** Spark README: „An advanced 3D Gaussian Splatting renderer for THREE.js“, „Portable: Works across almost all devices, targeting 98%+ WebGL2 support“, MIT, Import-Beispiel mit `spark/2.4.0`. https://raw.githubusercontent.com/sparkjsdev/spark/main/README.md · package.json: `"version": "2.4.0"`, `"license": "MIT"`, `peerDependencies: three >=0.180.0`. https://raw.githubusercontent.com/sparkjsdev/spark/main/package.json · LICENSE „The MIT License – Copyright © 2025 WORLD LABS TECHNOLOGIES, INC.“
- **B** Lokal: `labor/package.json` → `"three": "0.187.0"` (erfüllt die Spark-Anforderung).
- **B** GaussianSplats3D README: „this repo is no longer in active development … I recommend checking out Spark as an alternative“. https://raw.githubusercontent.com/mkkellogg/GaussianSplats3D/main/README.md
- **B** three.js r186: „a WebGPU and TSL implementation landing in r186“, „Color is SH0 only“, kein LoD/Streaming; „A plain JavaScript fallback covers the WebGL backend of WebGPURenderer.“ (radiancefields.com, Autorenzeile 10.8.2026, Sekundärquelle) https://radiancefields.com/three.js-merges-a-native-gaussian-splat-renderer-for-webgpu-in-r186
- **B** Spark Radix: „an experimental WebGPU renderer“, 0.0.1; „On WebGL2, the same page reports Spark as 1.09x faster.“ (29.10.2026, Sekundärquelle) https://radiancefields.com/spark-radix-brings-webgpu-splat-rendering-to-threejs
- **B** Spark 2.4.0 (20.10.2026, Sekundärquelle): liest SPZ v4, eigener Chunk-Fetcher für paged LoD. https://radiancefields.com/spark-2.4.0-reads-spz-v4-files-and-opens-paged-lod-to-custom-fetchers
- **B** Babylon.js-Doku: Formate, `splatBudget: "auto"` = 2,5 Mio. Desktop / 1,5 Mio. iOS / 1 Mio. übrige Mobilgeräte. https://doc.babylonjs.com/features/featuresDeepDive/mesh/gaussianSplatting
- **B** PlayCanvas-Lizenzen (engine, supersplat, splat-transform): MIT-Text „Copyright (c) 2011-2026 PlayCanvas Ltd.“ https://raw.githubusercontent.com/playcanvas/supersplat/main/LICENSE

### Formate und Größen

| Format | Was | Größe | Status |
|---|---|---|---|
| PLY (INRIA) | Rohformat, float32 | 62 Werte × 4 B = **248 B/Splat** mit SH3, 68 B mit SH0 (A, gerechnet) | Austausch/Bearbeiten |
| .splat (antimatter15) | ohne SH | 32 B/Splat (A) | veraltet |
| .ksplat | GaussianSplats3D-eigen | – | Projekt eingestellt |
| **SPZ** (Niantic, MIT) | quantisiert + gzip (v1–3) bzw. zstd (v4) | **gemessen 14,5–15,7 B/Splat (SH0), 22,7 B/Splat (SH3)** | Spark, Babylon, PlayCanvas, Scaniverse |
| **SOG** (PlayCanvas) | WebP-Texturen + meta.json | „~15–20× smaller than an equivalent PLY“ | PlayCanvas, Babylon, Spark liest es |
| RAD (Spark) | LoD-Baum, Streaming per HTTP-Range | – | nur Spark |
| glTF `KHR_gaussian_splatting` | Standard-Container | definiert **keine** Kompression | „Complete, Ratified by the Khronos Group“ |

Belege:
- **B (eigene Messung)** Kopfdaten dreier SPZ-Dateien aus den Spark-Beispielen ausgelesen (gzip-Header, Python):
  - `fireplace.spz` (Innenraum mit Kamin): 301 000 Splats, SH0, 4 377 719 B → 14,5 B/Splat
  - `painted_bedroom.spz` (Schlafzimmer): 500 000 Splats, SH0, 7 841 329 B → 15,7 B/Splat
  - `butterfly.spz`: 177 132 Splats, SH3, 4 025 604 B → 22,7 B/Splat
  Quellen: https://sparkjs.dev/assets/splats/fireplace.spz · https://storage.googleapis.com/forge-dev-public/painted_bedroom.spz · https://sparkjs.dev/assets/splats/butterfly.spz
- **B** SPZ README: „spz encoded splats are typically around 10x smaller than the corresponding .ply files“; v4 = ZSTD. https://raw.githubusercontent.com/nianticlabs/spz/main/README.md (Lizenz MIT, Copyright 2024 Niantic Labs)
- **B** SOG: verlustfreie WebP-Bilder + `meta.json`, „typically yielding files ~15–20× smaller than an equivalent PLY“, Quantisierung verlustbehaftet. https://developer.playcanvas.com/user-manual/gaussian-splatting/formats/sog/
- **B** KHR_gaussian_splatting README: „## Status – Complete, Ratified by the Khronos Group“; bekannte Implementierungen CesiumJS, Cesium Native, JSplat, 3dgs_ply2gltf; Kompression über eigene Erweiterungen. https://raw.githubusercontent.com/KhronosGroup/glTF/main/extensions/2.0/Khronos/KHR_gaussian_splatting/README.md (Ratifizierungsdatum steht nicht in der Datei → Datum **O**)
- **B** splat-transform (MIT, v3.10.3 per npm): liest PLY, SOG, SPZ, .splat, .ksplat …, schreibt PLY, SOG, Streamed SOG, SPZ, GLB, CSV, HTML-Viewer. https://raw.githubusercontent.com/playcanvas/splat-transform/main/README.md
- **O** Eigene SOG-Vergleichsmessung (SPZ → SOG) war geplant, die Ausführung des frisch installierten Konverters wurde in dieser Sitzung von der Rechteprüfung abgelehnt. Die SOG-Zahl stammt daher nur aus der PlayCanvas-Doku.

### Streaming / Detailstufen
- **B** Spark 2.0: LoD-Baum, feste Splat-Zahl je Bild („default 500K – 2.5M depending on your device type“), `.RAD` „enables streaming arbitrary chunks of splats via HTTP Range requests“, Vorab-Bau per `npm run build-lod` (braucht Rust), `lod: true` baut den Baum im Browser (1–3 s je 1 Mio. Splats). https://sparkjs.dev/docs/new-features-2.0/ · https://sparkjs.dev/docs/lod-getting-started/
- **B (eigene Messung)** GitHub Pages beantwortet Range-Anfragen: `curl -r 0-99 https://kairaethel-eng.github.io/labor/hausbesuch-puls.html` → `HTTP/2 206`, `accept-ranges: bytes`, `content-range: bytes 0-99/931101`. Streaming per RAD wäre also auf dem vorhandenen Hosting möglich.
- **A** Für einen einzelnen Praxisraum (300–500 Tsd. Splats, 5–8 MB) ist Streaming unnötig; LoD/RAD lohnt erst für „ganze Praxis in einer Datei“.

### Leistung auf iPhones
- **B** Spark „Performance Tuning“: Faustregel „iPhone: 1-3 million splats“, „Android phone: 1-2 million“, „Computer: 1-5 million“; `antialias: false`; hoher `devicePixelRatio` kostet. https://sparkjs.dev/docs/performance/
- **B** Spark LoD-Vorgabe: „1M for Android, 1.5M for iOS, and 2.5M for desktop“. https://sparkjs.dev/docs/lod-getting-started/
- **B** Babylon.js nennt dieselben Größenordnungen (1,5 Mio. iOS). Quelle oben.
- **B** Agentur-Leitfaden (Utsubo, 9.6.2026, Sekundär/Marketing): Telefone „200K–500K splats“, „30–45 FPS“ auf modernen Telefonen, Warnung vor LCP-Einbruch. https://www.utsubo.com/blog/gaussian-splatting-landing-page
- **A** Ein Raum mit 300–500 Tsd. Splats liegt um Faktor 3–5 unter den Hersteller-Budgets; Spark-intern 16 B/Splat (B, „compact 16 bytes/splat encoding“) → 500 Tsd. Splats ≈ 8 MB Grafikspeicher.
- **O** Keine Messung auf einem echten iPhone. Im Container gibt es nur SwiftShader (kein Grafikchip) – nicht aussagekräftig. Offene Spark-Meldung zu iOS: #481 „[iOS / WebXR] RAD streaming hard-freezes …“ (11.10.2026, offen) – betrifft RAD-Streaming, ein Grund mehr, am Handy bei einer einzelnen SPZ-Datei zu bleiben. https://github.com/sparkjsdev/spark/issues?q=is%3Aissue+iOS
- **A** Risiko „zu viele WebGL-Kontexte“: Die Seite hat bereits mehrere Bühnen (Haupt, Manuthera, Motive). Spark hängt am **vorhandenen** Renderer (`new SparkRenderer({ renderer })`, B) – kein zusätzlicher Kontext nötig.

### Gewicht des Renderers (eigene Messung, B)
- `spark.module.js` 2.4.0: 2 997 944 B roh, **996 709 B gzip -9** (enthält WASM). https://sparkjs.dev/releases/spark/2.4.0/spark.module.js
- Zum Vergleich: `hausbesuch-puls.html` heute 931 101 B roh, **326 975 B** gzip-Übertragung von GitHub Pages (gemessen per `curl -H "Accept-Encoding: gzip"`).
- Folge: Spark darf **nicht** in die Start-Datei eingebettet werden (würde die Übertragung ~vervierfachen), sondern muss als eigene Datei erst auf Tipp geladen werden.

### WebGL2 gegen WebGPU
- **A** Für diese Seite WebGL2 (Spark): vorhandener Renderer, eigene GLSL-Shader, breiteste iPhone-Abdeckung. WebGPU-Wege (three r186, Radix) sind neu, SH0-only bzw. experimentell und verlangen einen Renderer-Wechsel der ganzen Seite.

---

## 2. Aufnahme und Training – kostenlos?

### iPhone-Apps

| App | Preis / Grenze für Splats | Verarbeitung | Export | Urteil |
|---|---|---|---|---|
| **Scaniverse Classic** | kostenlos, unbegrenzt | **auf dem Gerät** | PLY, SPZ | Technisch ideal – **Lizenzvorbehalt** (siehe unten) |
| Scaniverse (neu, Cloud) | Free: 20 000 Credits/Monat (~10 min Aufnahme); Plus 20 $/Monat; Pro 50 $/Monat; „Commercial rights“ erst ab Pro | Cloud | FBX, SPZ, PLY | Für die Website nicht kostenlos nutzbar |
| Polycam | Free-Plan ohne Splats; Basic 150 $/Jahr | Cloud | – | scheidet aus |
| KIRI Engine | 3DGS nur Pro, 79,99 $/Jahr | Cloud | – | scheidet aus |
| Luma 3D Capture | kostenlos, App wird nicht mehr weiterentwickelt (Hinweis „Sunset Genie“, v1.3.14) | Cloud (USA, A) | „NeRFs and Gaussian Splats“ | Abkündigungsrisiko, Praxisbilder in fremder Cloud |
| Scantic | Basis frei (Standardqualität), volle Qualität 29,99 €/Jahr oder 4,99 €/Scan | auf dem Gerät | PLY | nicht kostenlos in voller Qualität |
| Splatcatcher (früher Splatcam) | kostenlos | nur Aufnahme | COLMAP-Datensatz (Bilder + Posen + LiDAR-Punkte) | braucht iPhone **Pro** mit LiDAR, iOS 26+; gute Vorstufe für PC-Training |
| iPhone-Kamera (Video/Fotos) | 0 € | – | – | **lizenzsauberster Weg**, mit PC-Training |
| RealityScan Mobile | Splat-Export nicht belegt | – | – | **O** |

Belege:
- **B** App Store DE, Scaniverse: „Kostenlos“, keine In-App-Käufe gelistet; iOS/iPadOS 16.6+, A12 Bionic oder neuer; LiDAR keine Voraussetzung; Verarbeitung „direkt und ausschließlich auf deinem Gerät“; Splat-Export „PLY- oder SPZ-Format“; Version 5.2.9 vom 19. Okt. https://apps.apple.com/de/app/scaniverse-3d-scanner/id1541433223
- **B** Niantic-Preisseite: Free „20,000“ Credits, „Export assets as FBX, SPZ and PLY“, „On-device reconstruction (legacy version)“; Plus „$20 per month“, Pro „$50 per month“ mit „Commercial rights“; „Classic Scaniverse users: The familiar experience remains available, with free on-device processing“; „Are there any limits to on-device processing? No. You can continue using Classic Scaniverse to generate unlimited 3D Gaussian splats on your device.“; „For commercial rights, including resale, you must be on a Pro plan or Enterprise contract.“ https://www.nianticspatial.com/pricing
- **B** Niantic FAQ: „iOS: Supported. We recommend iPhone 13 or newer. Devices with LiDAR provide the best results.“; Classic „designed for individual use … small environments and personal projects“. https://www.nianticspatial.com/faq/scaniverse
- **B** Niantic Spatial Terms of Service („Last Modified: February 20, 2026“): App-Lizenz „solely for your own personal non-commercial purposes“; Kopfzeile: „THESE TERMS DO NOT GRANT YOU ANY RIGHTS TO ACCESS AND USE THE SERVICES FOR BUSINESS OR COMMERCIAL PURPOSES“; verboten: „use the Services, or any portion thereof, for any commercial purpose“; zugleich 6.1: „nothing in these Terms restricts any rights that you may have to use and exploit your User Content“ und 6.2: „you own all right, title and interest in and to all Output“; 6.3: wer Inhalte „available through the Services“ macht, räumt Niantic eine Lizenz u. a. zum Training von KI-Modellen ein. https://www.nianticspatial.com/terms
  → **A/O**: Ob ein mit Scaniverse Classic lokal erzeugter Splat auf einer Praxis-Website verwendet werden darf, ist nach diesen Texten **unklar** (Output gehört dem Nutzer, die App-Nutzung selbst ist aber nur nicht-kommerziell lizenziert; Abschnitt 20 „Residents of Germany“ nicht ausgewertet). Für einen privaten Probe-Scan unkritisch; für die Veröffentlichung sicherer: eigener Trainingsweg (unten) oder schriftliche Auskunft von Niantic.
- **B** Polycam-Preise: Free „GLTF only“, Basic „$150/year“ mit „Unlimited object captures and Gaussian splats“. https://poly.cam/pricing · PlayCanvas-Doku: „Polycam's free plan does not include Gaussian splats“. https://developer.playcanvas.com/user-manual/gaussian-splatting/creating/recommended-tools
- **B** KIRI: „Industry Leading Gaussian Splatting (3DGS Scan with Mesh)“ nur unter Pro, „USD79.99 Billed Yearly“. https://www.kiriengine.app/pricing
- **B** Luma 3D Capture, App Store DE: „Kostenlos“, v1.3.14 „14. Jan.“, Hinweis „We've officially Sunset Genie since January 1, 2026“, iOS 16+. https://apps.apple.com/de/app/luma-3d-capture/id1615849914 („nicht mehr weiterentwickelt“ = A aus Sekundärquellen)
- **B** Scantic (digitalproduction.com, 20.8.2026): Verarbeitung auf dem Gerät, PLY-Export, höhere Qualität „€29.99 per year“ oder „€4.99 per individual scan“, iOS 17+, A12+. https://digitalproduction.com/2026/08/20/gaussian-splats-on-the-iphone/
- **B** Splatcatcher/Splatcam, App Store: „Free“, „Requires an iPhone Pro model with the LiDAR scanner (iPhone 12 Pro or later Pro / Pro Max)“, iOS 26.0+, Export als COLMAP-Datensatz, nennt LichtFeld Studio und Postshot, v1.3.1 vom 17. Okt. https://apps.apple.com/app/id6759800588

**LiDAR nötig?** Nein (B, App Store/Niantic). LiDAR hilft bei strukturlosen Flächen (Niantic: „Devices with LiDAR provide the best results“, B); konkrete Erfolgsquoten ohne/mit LiDAR fand ich nur in einem Blog ohne Methode → **O**.

### Lokales Training auf dem PC (RTX 2070 Super, 8 GB)

| Werkzeug | Lizenz / Preis | Braucht | 8 GB? | Urteil |
|---|---|---|---|---|
| **Spirula Studio** | GPLv3, Windows-Binärdatei gratis | nur Fotos/Video (SfM, Frame-Extraktion, KI-Maskierung eingebaut), Vulkan | „trains 10M full-SH Gaussians in 8 GB VRAM“ | **Empfehlung**; Risiko: „maintained almost entirely by one person“ |
| **Brush** | Apache-2.0 | COLMAP- oder Nerfstudio-Datensatz (Posen extern), AMD/Nvidia/Intel | VRAM-Bedarf nicht dokumentiert (O) | gute Ausweichlösung mit Splatcatcher oder COLMAP |
| LichtFeld Studio | GPLv3; fertige Windows-Binärdateien nur über bezahltes Portal, Quellbau frei | COLMAP-Datensatz, Nvidia ab RTX 20 (CC 7.5), Treiber 570+/CUDA 12.8 | RTX 2070 Super erfüllt die GPU-Klasse | frei nur mit Selbstbau |
| Postshot | Free = „Non-commercial use“, kein Radiance-Field-Export; Export + kommerziell erst ab „Indie“ | Nvidia ab RTX 2060 | – | scheidet für „kostenlos“ aus; Preise auf der Seite nicht auslesbar (O) |
| nerfstudio / gsplat | Apache-2.0 | Python/CUDA + COLMAP | gsplat: „up to 4x less training memory footprint“ | für Kai zu viel Einrichtung |
| INRIA-Original | nur nicht-kommerziell | – | 24 GB für Paper-Qualität | scheidet aus |
| Apple SHARP (1 Foto → Splat) | Modell nur „Research Purposes“, „does not include any commercial exploitation“ | – | – | **darf für die Praxis-Website nicht genutzt werden** |

Belege:
- **B** Spirula Studio README: GPLv3-Badge, „from raw photo/video to splat to textured mesh – in one self-contained binary. No Python/PyTorch, no separate COLMAP install. Runs on NVIDIA, AMD, Intel, and Apple GPUs via Vulkan, trains 10M full-SH Gaussians in 8 GB VRAM“, „Built-in lightning-fast SfM, AI masking, frame extraction from videos“, Binärdateien auf der Releases-Seite, deutsche Oberfläche (8.8.2026), „maintained almost entirely by one person“. https://raw.githubusercontent.com/harry7557558/spirula-studio/master/README.md (Exportformat nicht ausdrücklich genannt → Splat-PLY = A)
- **B** Brush README: „works on a wide range of systems: macOS/windows/linux, AMD/Nvidia/Intel cards“, „Brush takes in COLMAP data or datasets in the Nerfstudio format“, Maskierung über Ordner „masks“; LICENSE Apache-2.0. https://raw.githubusercontent.com/ArthurBrussee/brush/main/README.md
- **B** LichtFeld Studio: GPLv3, Nvidia „compute capability 7.5 or newer“ (RTX 20-Serie aufwärts), Treiber 570+, Export PLY/SOG/SPZ/HTML; Windows-Binärdateien über bezahltes Portal. https://github.com/MrNeRF/LichtFeld-Studio
- **B** Postshot: Free = „Non-commercial use“, Radiance-Field-Export (PLY, SPZ) erst unter Indie. https://www.jawset.com/shop/pricing · Systemanforderung „GeForce RTX 2060 … or higher“. https://www.jawset.com/
- **B** PlayCanvas „Recommended Tools“ (Tabelle mit Lizenzen; „Postshot's free plan is for non-commercial use and cannot export splats“; „LichtFeld Studio … The installer is paid“; INRIA „24 GB of VRAM“). https://developer.playcanvas.com/user-manual/gaussian-splatting/creating/recommended-tools
- **B** gsplat-Doku: „up to 4x less training memory footprint“, „up to 15% less training time“. https://docs.gsplat.studio/main/ · Lizenz Apache-2.0 (LICENSE im Repo).
- **B** Apple ml-sharp `LICENSE_MODEL`: „exclusively for Research Purposes … does not include any commercial exploitation, product development or use in any commercial product or service“. https://raw.githubusercontent.com/apple/ml-sharp/main/LICENSE_MODEL
- **B** INRIA-Lizenz: „THE USER CANNOT USE, EXPLOIT OR DISTRIBUTE THE SOFTWARE FOR COMMERCIAL PURPOSES“. https://raw.githubusercontent.com/graphdeco-inria/gaussian-splatting/main/LICENSE.md

### Nachbearbeiten / Zuschneiden
- **B** SuperSplat Editor: „free and open source tool for inspecting, editing, optimizing and publishing 3D Gaussian Splats … runs in the browser, so there's nothing to download or install“, https://superspl.at/editor (MIT). https://raw.githubusercontent.com/playcanvas/supersplat/main/README.md
- **A** Bearbeitung läuft lokal im Browser; trotzdem ist superspl.at eine fremde Seite – wer ganz sicher gehen will, baut den Editor lokal (`npm run develop`, B laut README) oder nutzt die Editierfunktionen von Spirula Studio (B: „Editing features for 3DGS models“, 23.9.2026).
- **B** Konvertieren ohne Installation: „SuperSplat Convert — a browser-based frontend to splat-transform“ (https://superspl.at/convert); sonst `npm install -g @playcanvas/splat-transform`.

---

## 3. Innenräume – Probleme, Aufnahme-Tipps, Recht

### Bekannte Probleme
- **B** Spiegel: Standard-3DGS „struggles with accurately modeling physical reflections, particularly in mirrors“ (Mirror-3DGS, arXiv 2404.01168, 1.4.2024, rev. 11.12.2024). https://arxiv.org/abs/2404.01168
- **B** „Floater“ in Innenräumen: „nearly transparent, disconnected elements that drift in space away from the actual surface“ (TIDI-GS, arXiv 2601.09291, 14.1.2026). https://arxiv.org/abs/2601.09291
- **B** Schwenk-Aufnahmen vom Fleck: „rotation-dominant motion and narrow baseline make accurate camera pose and 3D point estimation challenging … especially in textureless indoor scenes“ (LighthouseGS, arXiv 2507.06109, 8.7.2025/11.2.2026). https://arxiv.org/abs/2507.06109
- **B** PlayCanvas-Aufnahmeleitfaden: „Mirrors, glass, and chrome can create false features and artifacts.“; „People, vehicles, or wind-blown foliage create ghosting artifacts.“; Räume 200–500+ Fotos; 70–80 % Überlappung; „identical exposure“; weiches, gleichfarbiges Licht; Video mind. 4K, Belichtung gesperrt. https://developer.playcanvas.com/user-manual/gaussian-splatting/creating/taking-photos/
- **A** Weiße Wände, enge Räume, wechselndes Licht: folgen aus den drei Quellen oben (wenig Merkmale → schlechte Posen; kurze Grundlinie; unterschiedliche Belichtung → Flecken). Quantitative Angaben dazu fand ich nur in Blogs → **O**.

### Aufnahme-Tipps für die Praxis (A, aus den Quellen abgeleitet)
1. Abends oder bei bedecktem Himmel, alle Lampen an, Rollos/Vorhänge zu → gleichmäßiges, **warmes** Licht ohne Fenster-Überstrahlung (zahlt zugleich auf „Zuhause“ ein).
2. Spiegel abhängen oder abdecken; Bildschirme aus; glänzende Chromteile nicht in den Mittelpunkt.
3. Nicht vom Fleck schwenken: seitlich gehen, Kamera zur Raummitte bzw. zur gegenüberliegenden Wand, drei Höhen (Hüfte, Brust, über Kopf), Ecken und Decke/Boden mitnehmen; je Raum 2–3 Minuten ruhiges 4K-Video oder 200–300 Fotos.
4. Belichtung/Fokus sperren (AE/AF-Sperre), kein HDR-Wechsel, kein Ultraweitwinkel-Wechsel mitten im Lauf.
5. Kahle Wände: Möbel, Pflanzen, Bilder, Türrahmen immer mit im Bild halten.
6. Niemand im Raum, nichts bewegen; Tür offen lassen, wenn Räume zusammenhängen sollen.
7. Lieber je Raum ein eigener Scan (kleiner, einzeln ladbar, einzeln wiederholbar).

### Datenschutz / Urheberrecht
- **B** Personen: „Bildnisse dürfen nur mit Einwilligung des Abgebildeten verbreitet oder öffentlich zur Schau gestellt werden.“ (§ 22 KunstUrhG) https://www.gesetze-im-internet.de/kunsturhg/__22.html → **A**: nur leere Praxis scannen; Spiegelungen (auch von Kai selbst), Fotos von Personen an der Wand prüfen.
- **B** Kunst/Poster: § 57 UrhG erlaubt Werke nur als „unwesentliches Beiwerk neben dem eigentlichen Gegenstand“. https://www.gesetze-im-internet.de/urhg/__57.html · § 59 UrhG (Panoramafreiheit) gilt nur für Werke „bleibend an öffentlichen Wegen, Straßen oder Plätzen“, bei Bauwerken „nur auf die äußere Ansicht“ → greift im Innenraum nicht. https://www.gesetze-im-internet.de/urhg/__59.html · Geschützt sind u. a. „Werke der bildenden Künste … der angewandten Kunst“ und Lichtbildwerke (§ 2 UrhG). https://www.gesetze-im-internet.de/urhg/__2.html
  → **A**: Ein Splat ist frei begehbar; ein Bild an der Wand kann der Besucher formatfüllend ansehen – ob das noch „unwesentliches Beiwerk“ ist, ist zweifelhaft. Auffällige Kunst/Fotodrucke vor dem Scan abhängen, im Editor herausschneiden oder Erlaubnis einholen. Keine Rechtsberatung.
- **A** Unterlagen: Terminbuch, Rezepte, Namensschilder, Urkunden mit Namen, Bildschirme, Post, Schlüsselkasten vor dem Scan wegräumen – ein Splat mit 4K-Ausgangsbildern kann Schrift lesbar wiedergeben. Fensterblick (Nachbarn, Kennzeichen) durch geschlossene Rollos vermeiden.
- **A** Datenfluss: Aufnahme mit iPhone-Kamera + Training auf dem eigenen PC = keine Weitergabe an Dritte. Scaniverse Classic rechnet laut App Store auf dem Gerät (B); **nicht** in die Scaniverse-Karte hochladen (ToS 6.3: Lizenz inkl. KI-Training, B). Luma/Polycam/neues Scaniverse = Cloud.
- **A** Auslieferung: Splat-Datei und Spark liegen auf der eigenen Domain → kein Abruf bei Dritten, keine Einwilligung nötig.

---

## 4. Gestalterisch – passt das zum Partikel-Stil? Ist der Übergang belegt?

**Ja, belegt durch Code der offiziellen Spark-Beispiele (B):**
- „Splat Reveal Effects“ (Magic, Spread, Unroll, Twister, Rain): Der Shader-Baustein setzt die Splat-Größe von Punktgröße auf Originalgröße, z. B. `scales = mix(vec3(.002), scales, pow(effectResult.w, 12.))` bzw. `mix(scales, vec3(0.002), smoothstep(...))`, und blendet Farbe von Grau zur Originalfarbe (`mix(vec4(.3), rgba, …)`). Genau das ist „Punktwolke → fotorealistischer Raum“. https://sparkjs.dev/examples/#splat-reveal-effects (Quelltext: https://sparkjs.dev/examples/splat-reveal-effects/index.html)
- „Splat Transitions“ (Spherical, Explosion, Flow, **Morph**): Splats schrumpfen auf 20 % (`small = scales*.2`), fliegen und wachsen in einer anderen Szene wieder auf. https://sparkjs.dev/examples/#splat-transitions (https://sparkjs.dev/examples/splat-transitions/effects/morph.js)
- „Splat Dissolve Effects“, „Particle Animation“, „Particle Simulation“, „Interactive Holes“ (nutzt das Schlafzimmer `painted-bedroom.spz`), „Dynamic Lighting“ (nutzt den Innenraum `fireplace.spz`). https://sparkjs.dev/examples/
- **B** Grundlage: Spark ist „Fully dynamic: each splat can be transformed and edited for animation“, mit „Shader graph system to dynamically create/edit splats on the GPU“ (Dyno, wird zu GLSL). https://sparkjs.dev/docs/overview/
- **B** Spark lädt auch „plain x/y/z/r/g/b point clouds“ als PLY. https://sparkjs.dev/docs/loading-splats/

**Was nicht belegt ist (O):**
- Eine veröffentlichte Website (Praxis, Hotel o. Ä.), die genau „Partikel-Skizze → warm beleuchteter echter Raum“ beim Scrollen zeigt, habe ich nicht gefunden; der Agentur-Leitfaden nennt keine Beispiel-Adressen.
- Ob der Übergang auf einem iPhone bei 300–500 Tsd. Splats flüssig läuft, ist nicht gemessen.

**Gestalterische Einschätzung (A):**
- Splats und die „gestochenen“ Punkte der Seite sind verwandt: Ein Splat **ist** ein Punkt mit Farbe, Größe und Ausrichtung. Mit kleiner Größe wirkt der Scan wie die vorhandene Punktwolke – nur in echten Farben. Der Stilbruch ist kleiner als bei einem Foto oder Video.
- Die Wärme kommt aus dem Scan-Licht (Abend, Lampen) – das ist der eigentliche Gewinn für „Zuhause“: Die dunkle Bernstein-Welt bekommt an einer Stelle echtes Holz, echten Stoff, echtes Lampenlicht.
- Dosierung: ein „Blick durchs Fenster“ je Raum (Knopf „So sieht es wirklich aus“), nicht die ganze Seite fotorealistisch – sonst geht die eigene Handschrift verloren.

---

## 5. Alternativen mit weniger Risiko

| Variante | Größe je Raum | Qualität / Wirkung | Aufwand | Risiko |
|---|---|---|---|---|
| **A. Echtfarben-Punktwolke aus dem Splat** (Mittelpunkte + Grundfarbe, im vorhandenen Punkt-Shader) | 100–150 Tsd. Punkte × 9 B (xyz int16 + rgb8) ≈ **0,9–1,4 MB** (A, gerechnet) | bleibt „gestochen“, Raum klar erkennbar, bewegt sich mit der Kamera | 1 Build-Skript + Shader-Farbe je Punkt | **sehr gering** – kein neuer Renderer, läuft überall, wo die Seite heute läuft |
| B. Spark-Splat auf Tipp | ~1 MB Programm + 5–8 MB | fotorealistisch, begehbar | mittel | iPhone-Leistung ungemessen, Abhängigkeit von Spark |
| C. 360°-Kugelpanorama | 1–3 MB (JPEG/WebP 4–8K, A) | scharf, aber starr (kein Parallax), „Makler-Look“ | gering, aber iPhone kann kein Kugelpanorama ohne Zusatz-App/Kamera (A) | Stilbruch zum Partikel-Look |
| D. Foto + Tiefenkarte (Parallaxe) | 0,3–0,8 MB (A) | hübscher Kipp-Effekt, nur ±10–15° | gering; Tiefenkarte z. B. Depth-Anything-V2-**Small** (Apache-2.0, B) lokal | Kanten-Artefakte; Base/Large-Modelle sind CC-BY-NC (B) → nicht nehmen |
| E. Photogrammetrie-Netz (GLB) | 10–40 MB (A) | weiße Wände/Glas löchrig | mittel | für Innenräume die schwächste Wahl |
| F. LiDAR-Punktwolke (PLY/LAS) | wie A | gröber, nur mit Pro-iPhone | gering | A ist gleichwertig und braucht kein LiDAR |

Belege/Hinweise:
- **B** Farbe eines Splats aus der Datei: `SH2RGB(sh) = sh * C0 + 0.5`, `C0 = 0.28209479177387814` (INRIA `utils/sh_utils.py`). https://raw.githubusercontent.com/graphdeco-inria/gaussian-splatting/main/utils/sh_utils.py → Variante A braucht nur diese Formel und die Positionen; die Formel ist Mathematik, die INRIA-Software selbst wird nicht benutzt (A).
- **B** Depth Anything V2: „Depth-Anything-V2-Small model is under the Apache-2.0 license. Depth-Anything-V2-Base/Large/Giant models are under the CC-BY-NC-4.0 license.“ https://raw.githubusercontent.com/DepthAnything/Depth-Anything-V2/main/README.md
- **A** Variante A und B teilen sich denselben Scan: A ist die sichere Grundstufe (läuft sofort, auch am Handy), B die Kür für PC und neuere iPhones – ein Scan, zwei Darstellungen, Übergang A → B möglich (Punkte stehen an derselben Stelle).

---

## 6. AR – Wirbelsäule oder Liege „bei mir im Zimmer“

- **B** model-viewer 4.4.0, Apache-2.0; `ar-modes`: „webxr“, „scene-viewer“ (Android), „quick-look“ (iOS); ohne `ios-src` wird „a USDZ on the fly“ erzeugt, „animations are not yet supported“. https://modelviewer.dev/data/docs.json · https://raw.githubusercontent.com/google/model-viewer/master/packages/model-viewer/package.json
- **B (eigene Messung)** `model-viewer.min.js` 4.4.0: 1 069 272 B roh, 288 582 B gzip. https://cdn.jsdelivr.net/npm/@google/model-viewer@4.4.0/dist/model-viewer.min.js
- **B** Safari 27.0 (WebKit-Blog, 17.9.2026): „the HTML `<model>` element is now also available in Safari on iOS, iPadOS, and macOS“; Beispiele mit USDZ und GLB; behoben: „`<a rel="ar">` elements wrapping `<model>` elements to correctly enter ARQL“. https://webkit.org/blog/18325/webkit-features-for-safari-27-0/
- **B** WWDC26 Sitzung 215: „Wrap the model in an [a] tag with rel="ar" … on iOS and iPadOS, your customers get a full AR Quick Look experience“; Bild als Rückfall im `<model>`. https://developer.apple.com/videos/play/wwdc2026/215/
- **A** Günstigster Weg wäre also ohne Bibliothek: `<a rel="ar" href="wirbelsaeule.usdz">` (iPhone) + model-viewer nur für Android. **Aber:** AR Quick Look zeigt Netze (USDZ), keine Punktwolken und keine Splats. Die Wirbelsäule und die Manuthera-Liege der Seite sind prozedurale Punktwolken – ein Netz-Modell gibt es nicht und müsste neu gebaut oder (Liege) gescannt werden; bei der Liege kämen Hersteller-Design/Marke dazu (O).
- **Urteil (A): jetzt nicht.** Hoher Erstellungsaufwand, eigener Stil geht verloren (graues Netz statt Partikel), kein Beleg, dass AR bei einer Praxis-Website Termine bringt. Wenn überhaupt: später ein einzelnes, bewusst schlichtes Modell (LWS-Segment) als „Zum Anfassen“-Zugabe.

---

## 7. Empfehlung – konkreter, kostenloser Ablauf für Kai

### Hartes Ziel (prüfbar)
„Ein echter Praxisraum ist in der Seite zu sehen, **ohne** dass Start-Gewicht und Start-Zeit der Seite steigen; Zusatzlast nur auf Tipp: Stufe A ≤ 1,5 MB, Stufe B ≤ 1 MB Programm + ≤ 8 MB je Raum; auf Kais iPhone ≥ 30 Bilder/s in Stufe A und ≥ 25 in Stufe B; kein Abruf bei Dritten; kein Mensch, kein Name, kein fremdes Kunstwerk im Scan.“

**Unabhängige Prüfung:** Dateigrößen per `ls`/Netzwerk-Tab; Bildrate mit `tools/frames.cjs` (PC-Vergleich vorher/nachher) **und** auf dem echten iPhone (Safari-Web-Inspector oder eingeblendeter Zähler); Fremdabrufe per Netzwerk-Protokoll (0 Anfragen an andere Hosts); Inhalt per Sichtprüfung des Splats im Editor durch Kai. Stand heute: **nichts davon gemessen** – nur die Vorbedingungen (Lizenz, Größen pro Splat, Range-Fähigkeit des Hostings, Renderer-Gewicht).

### Ablauf
**Schritt 0 – Probe (1 Abend, 0 €):** Behandlungsraum 2 (Manuthera, das Aushängeschild) abends bei Lampenlicht, Rollos zu, Spiegel/Unterlagen weg. 2–3 min 4K-Video mit gesperrter Belichtung, seitlich gehend, drei Höhen.
- Schnelltest der Machbarkeit: derselbe Raum zusätzlich mit Scaniverse Classic auf dem iPhone (Splat nach ~1 min sichtbar, nur zum Ansehen – nicht veröffentlichen, nicht hochladen).

**Schritt 1 – Training am PC:** Spirula Studio (Windows-Binärdatei, GPLv3) → Video hineinziehen → Bilder, Posen, Training in einem Programm; Personen-/Störmasken über die eingebaute Maskierung. Ziel: 300–500 Tsd. Splats (Obergrenze im Training setzen), Export als PLY. Ausweichweg: COLMAP + Brush.

**Schritt 2 – Zuschneiden:** SuperSplat Editor (Browser) oder Spirula-Editor: alles außerhalb des Raums und Floater entfernen, Bilder/Schrift prüfen und ggf. herausschneiden, Ausrichtung/Maßstab setzen. Export SPZ (SH0 genügt: 14,5–15,7 B/Splat gemessen → 300 Tsd. ≈ 4,4 MB, 500 Tsd. ≈ 7,8 MB).

**Schritt 3 – Stufe A in die neue Seite:** Build-Skript liest die PLY (Position, `f_dc` → Farbe per SH2RGB), dünnt auf 100–150 Tsd. Punkte aus, schreibt eine kleine Binärdatei; der vorhandene Punkt-Shader bekommt ein Farb-Attribut. Raum erscheint als Echtfarben-Punktbild, wenn man im Rundgang den Raum betritt (Laden bei Annäherung, wie heute `whenNear`).

**Schritt 4 – Stufe B (nur wenn A überzeugt):** Knopf „So sieht es wirklich aus“ → lädt `spark.module.js` (eigene Datei, same-origin) + `raum.spz`; `SplatMesh` in die vorhandene Szene, Einblenden mit einem Dyno-Baustein nach dem Muster der Reveal-Beispiele (Größe von Punkt → Original). „Bewegung reduzieren“ → nur Überblenden. Ohne WebGL / schwaches Gerät → es bleibt bei Stufe A bzw. Standbild.

**Zielgröße je Raum:** 300–500 Tsd. Splats, SH0, SPZ 4,5–8 MB; nie mehr als ein Raum gleichzeitig im Speicher; am Handy erst auf Tipp, mit Größenangabe am Knopf („ca. 6 MB“).

**Am Handy realistisch (A):** Stufe A sicher. Stufe B ist nach Hersteller-Budgets (1–3 Mio. Splats iPhone) mit 300–500 Tsd. Splats weit im grünen Bereich – aber ungemessen, und die Seite rendert daneben schon eigene Partikel. Deshalb: während Stufe B die übrige Szene anhalten (wie heute beim Ego-Dialog).

### Ehrliche Risiken
1. **Aussehen:** Weiße Wände/Fenster/Chrom können fleckig oder neblig werden; dann bleibt nur Stufe A (verzeiht mehr, weil Punkte statt Flächen) oder ein Neu-Scan. Erst der Probe-Scan zeigt es.
2. **Lizenz Scaniverse:** für die Veröffentlichung ungeklärt (ToS: persönliche, nicht-kommerzielle Nutzung; „Commercial rights“ erst Pro 50 $/Monat). Deshalb Trainingsweg über eigene Kamera + freie Software.
3. **Ein-Personen-Projekte:** Spirula Studio (ein Maintainer), Spark (Firma World Labs; MIT-Lizenz bleibt, Pflege nicht garantiert). Gegenmittel: PLY als Archiv aufbewahren, SPZ/SOG sind offene Formate, Stufe A hängt an keinem fremden Renderer.
4. **Pflege:** Jede Umgestaltung eines Raums macht den Scan alt. Neu-Scan ≈ 1 Abend je Raum.
5. **Gewicht/Erwartung:** 5–8 MB je Raum sind im Mobilfunk spürbar → nur auf Tipp, nie automatisch.
6. **Recht:** Kunst an den Wänden, Namen, Personen (siehe 3); keine Rechtsberatung.
7. **GitHub Pages:** Seite ≤ 1 GB, weiche Grenze 100 GB/Monat (B) – 4 Räume × 8 MB sind unkritisch. https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

### Was von Kai gebraucht wird
- Welches iPhone (Modell, iOS)? Pro mit LiDAR würde Splatcatcher + Brush als zweiten Weg öffnen.
- Ein Abend in der leeren Praxis; Entscheidung, welche Räume (Vorschlag: zuerst Behandlung 2).
- Sichtprüfung des Probe-Splats: „Sieht das nach meiner Praxis aus – und warm?“
- Entscheidung zu Bildern/Kunst an den Wänden (abhängen, herausschneiden, Erlaubnis).
- Go/No-Go je Stufe (A, dann B).

---

## Fehlender Zugang / nicht Geprüftes
- GitHub-API (Sterne, letzter Commit, Releases) in dieser Sitzung gesperrt → Aktivität nur über README/package.json und Sekundärquellen belegt.
- `https://www.nianticspatial.com/faq/scaniverse-classic` → 404; die Aussagen zu Classic stammen von der Preisseite und dem App Store.
- Postshot-Preise: Seite zeigt ohne JavaScript „€0.00“ für alle Pläne → Preise **O**.
- SOG-Vergleichsmessung nicht ausgeführt (Ausführung des Konverters abgelehnt).
- Kein echtes iPhone, kein Grafikchip im Container → keine Leistungs- oder Bildqualitätsmessung.
- SuperSplat-Handbuchseite lieferte leeren Inhalt; Aussagen aus dem README.
- Meldung „AMD übernimmt World Labs“ nur als Suchtreffer gesehen, nicht geöffnet/bestätigt → **O**.
