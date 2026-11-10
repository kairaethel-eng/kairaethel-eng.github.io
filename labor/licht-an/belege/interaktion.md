# Strang INTERAKTION – „Die Seite bringt Sie in Bewegung“

Stand: 10.11.2026 · Recherche für das neue HOP-Projekt auf Basis von `labor/hausbesuch-puls.html`
Kennzeichnung: **[B]** = von einer geöffneten Quelle bzw. eigener Messung genau so gestützt · **[A]** = abgeleitet/plausibel · **[O]** = offen/nicht belegt.
Im Repository wurde nichts geändert. Messskripte liegen unter
`‹Scratchpad›/research/probe/`.

---

## 0. Ziel, Prüfung, ehrliches Ergebnis

**Hartes Ziel (für diesen Strang):** Fünf Interaktionen finden, die zusammen
(1) 0 Abrufe bei Dritten brauchen, (2) 0 System-Erlaubnisdialoge auslösen, (3) zusammen < 40 KB (gzip) zusätzliches Skript kosten,
(4) auf iPhone-Safari laufen und (5) keinen Pflegeaufwand erzeugen – und trotzdem „Bewegung“ und „Zuhause“ spürbar machen.

**Unabhängige Prüfungen, die ich tatsächlich ausgeführt habe:**

| Prüfung | Ergebnis | Kennz. |
|---|---|---|
| Sonnenstand lokal (SunCalc 2.1.4) für Schorndorf gegen U.S. Naval Observatory (API `aa.usno.navy.mil`) an 4 Tagen (10.11.2026, 21.12.2026, 20.3.2027, 21.6.2027) | Auf- und Untergang weichen ≤ 1 Minute ab (z. B. 10.11.: SunCalc 06:22:46 / 15:48:16 UTC, USNO 06:23 / 15:48) | [B] Messung |
| Gesetzliche Feiertage Baden-Württemberg lokal berechnet (Osterformel, 12 Feiertage) gegen `feiertage-api.de`, Jahre 2026–2035 | 10 von 10 Jahren identisch | [B] Messung |
| MediaPipe Pose Landmarker (tasks-vision 1.2.2, Modell „lite“) selbst gehostet, Chrome 153 headless, alle fremden Hosts per `--host-resolver-rules` gesperrt | läuft; 1 Pose, 33 Punkte + 33 Weltpunkte; **0 Fremdabrufe**; geladen: wasm 14,26 MB + Modell 5,64 MB + JS 0,15/0,33 MB (unkomprimiert) | [B] Messung |
| Dieselbe Probe, Geschwindigkeit ohne Grafikchip (Xeon 2,1 GHz, 4 Kerne, CPU-Delegate, Einzelbild-Modus) | ≈ 320 ms je Bild (≈ 3 Bilder/s) – **nicht** auf Handys übertragbar, zeigt aber: ohne GPU unbrauchbar | [B] Messung |
| Dateigrößen (npm-Paket/Modell-Server, gzip -9 selbst gerechnet) | wasm 14,60 MB → 4,12 MB gzip; `pose_landmarker_lite.task` 5,78 MB → 4,97 MB gzip; `full` 9,40 MB; `heavy` 30,66 MB; Hand 7,82 MB; `vision_bundle.mjs` 156 KB → 45 KB gzip; SunCalc `suncalc.cjs` 17,4 KB → 5,3 KB gzip (`index.js` 25,3 KB → 9,1 KB) | [B] Messung |

**Gegen das Ziel berichtet:** Vier der fünf empfohlenen Ideen erfüllen alle fünf Bedingungen laut Quellenlage (Atem-Moment, echtes Licht/Lebenszeichen, Gewebe-Spielzeug, Mitnehmen). „Klang auf Wunsch“ erfüllt sie ebenfalls, ist aber nur nach Antippen hörbar. **Nicht geprüft werden konnte** die Bildrate auf einem echten iPhone (kein Gerät, im Container nur SwiftShader/CPU) – jede Aussage zur iPhone-Leistung unten ist [A] oder [O]. Der „Spiegel-Moment“ (Kamera) verfehlt das Ziel klar (≈ 9–10 MB Zusatzlast, Kamera-Dialog) und ist deshalb nur als abgetrenntes Experiment mit Abbruchkriterium eingestuft.

---

## 1. Die Ideen im Einzelnen

### (a) Bewegungserkennung im Browser – „Spiegel-Moment“ / Mitmach-Übung

**Was:** Kamera an → die Partikel-Figur im Empfang folgt der eigenen Bewegung (Arme heben, zur Seite neigen).

**Technik und Belege**
- **A1 [B]** MediaPipe Pose Landmarker liefert 33 Körperpunkte in 3D, zusätzlich Weltkoordinaten in Metern (Ursprung Hüftmitte); drei Modelle (lite/full/heavy), Eingänge 224×224 (Detektor) und 256×256 (Landmarker), float16. Quelle: https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker (abgerufen 10.11.2026, Seite ohne Datum).
- **A2 [B]** Web-Einbindung über npm `@mediapipe/tasks-vision` (Lizenz Apache-2.0, Version 1.2.2), wasm-Dateien und Modell können vom eigenen Server geladen werden; Live-Kamera = `runningMode: "VIDEO"` + `requestAnimationFrame`. Quellen: https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js · https://registry.npmjs.org/@mediapipe/tasks-vision/latest (10.11.2026).
- **A3 [B] (eigene Messung)** Selbst gehostet funktioniert es ohne jeden Fremdabruf (siehe Tabelle oben). Die offiziellen Beispiele laden wasm von `cdn.jsdelivr.net` und das Modell von `storage.googleapis.com` – das wäre ein Abruf bei Dritten und muss ersetzt werden.
- **A4 [B] (eigene Messung)** Zusatzlast für „lite“: wasm 4,12 MB (gzip) + Modell ≈ 5,0–5,8 MB + JS 45 KB ≈ **9–10 MB**. Zum Vergleich: die heutige `hausbesuch-puls.html` wiegt 931 KB (327 KB gzip über GitHub Pages).
- **A5 [B]** Browser-Voraussetzung laut Google: „Modern browser with WebAssembly support (Chrome, Edge, Safari, or Firefox…)“; keine Mindestversionen, kein Wort zu iOS. Quelle: https://developers.google.com/edge/mediapipe/solutions/setup_web (10.11.2026).
- **A6 [B]** Bildraten laut TensorFlow-Modell-Repository (Geräte iPhone 12 / Pixel 5, also etwa Stand 2021): MoveNet (TF.js, WebGL) iPhone 12: 51 (Lightning) / 43 (Thunder) Bilder/s, Pixel 5: 34 / 12. BlazePose mit TF.js-Laufzeit iPhone 12: 34 (lite) / 30 (full); **für die MediaPipe-Laufzeit steht beim iPhone 12 „N/A“** (nicht gemessen); Pixel 5 MediaPipe: 32 / 22. Quellen: https://github.com/tensorflow/tfjs-models/blob/master/pose-detection/src/movenet/README.md · https://github.com/tensorflow/tfjs-models/blob/master/pose-detection/src/blazepose_mediapipe/README.md (abgerufen 10.11.2026, undatiert).
- **A7 [B]** MediaPipe-Web auf iOS-Safari hat eine Fehlergeschichte: Issue-Suche im Repository `google-ai-edge/mediapipe` (Safari + iOS + tasks-vision) liefert 12 Treffer, u. a. #6142 (offen, 9.11.2025: GPU-Delegate des Image Segmenter liefert auf iOS-Safari falsche Kategorien), #5292 (tasks-vision in Web Workern auf iOS 17+), #4499 (WebGL-2-Kontext in WKWebView). Quelle: GitHub-Suche-API, 10.11.2026.
- **A8 [B]** `@tensorflow-models/pose-detection` (MoveNet) ist Apache-2.0, letzte Version 2.1.3 vom 29.8.2023; `@tensorflow/tfjs` 4.22.0 vom 21.10.2024 – also seit zwei Jahren ohne neue Version. Quelle: npm-Registry, 10.11.2026. → **[A]** MediaPipe Tasks ist die gepflegte Linie, MoveNet/TF.js die mit den besseren alten iPhone-Zahlen.
- **A9 [O]** Bildrate von MediaPipe Tasks (GPU-Delegate) auf aktuellen iPhones in Safari: keine Primärquelle gefunden, selbst nicht messbar.

**Vorbilder**
- Google „Move Mirror“ (Juli 2018, TensorFlow.js + PoseNet, Webcam → passende Bilder in Echtzeit; inzwischen abgeschaltet): https://experiments.withgoogle.com/move-mirror [B]
- Kemtai (digitale Physiotherapie mit Kamera, „Works on any device with a camera“, „Processing is done on the edge device, and video is not recorded“, **„FDA-listed and CE-marked medical device“**): https://kemtai.com/ (10.11.2026) [B]

**Datenschutz / Recht**
- Technisch bleibt alles im Gerät (A3). **[A]** Trotzdem nötig: eigener Knopf, Klartext („Die Kamera bleibt in Ihrem Gerät, es wird nichts gespeichert oder gesendet“), Abschnitt in der Datenschutzerklärung.
- **[A]** Eine Mitmach-Übung **mit Rückmeldung/Korrektur** rückt in die Nähe eines Medizinprodukts (Software mit Zweck Behandlung/Überwachung); dass ein Marktanbieter dafür CE-Kennzeichnung führt (Kemtai, [B]), ist ein Warnzeichen. Die MDR-Definition selbst konnte ich nicht öffnen (EUR-Lex lieferte leere Antwort) → **[O]**, an den Rechts-Strang.

**Aufwand:** hoch (Kamera-Ablauf, Zuordnung 33 Punkte → Partikel-Figur, Glättung, Rückfall ohne Kamera, Tests auf echtem iPhone).

**Urteil: SPÄTER – nur als abgetrenntes Experiment „Spiegel“ mit Abbruchkriterium** (auf Kais iPhone ≥ 24 Bilder/s bei laufender Partikel-Szene, sonst streichen; Laden erst nach Antippen; nie als Übung mit Bewertung). **Mitmach-Übung mit Korrektur: NEIN.**

---

### (b) Atem-geführter Moment

**Was:** Im Empfang „atmet“ das Haus/die Figur in ruhigem Takt (5 s ein, 5 s aus = 6 Atemzüge je Minute); wer mag, atmet 60–90 s mit; die Verspannungs-Punkte der Figur lösen sich im Ausatmen.

**Belege**
- **B1 [B]** Meta-Analyse, 223 Studien: freiwilliges langsames Atmen erhöht die vagal vermittelte Herzratenvariabilität während der Übung, direkt nach einer Sitzung und nach mehrwöchigem Üben; „low-tech and low-cost technique … with few adverse effects expected“. Laborde et al., Neurosci Biobehav Rev 2022;138:104711, https://pubmed.ncbi.nlm.nih.gov/35623448/ (Abstract über NCBI-E-Utilities gelesen).
- **B2 [B]** Meta-Analyse randomisierter Studien (12 Studien, 785 Erwachsene): Atemübungen senken selbstberichteten Stress, g = −0,35 [−0,55; −0,14]; Angst g = −0,32, depressive Symptome g = −0,40; „Most studies were deemed as being at moderate risk of bias“; Autoren warnen vor „miscalibration between hype and evidence“. Fincham et al., Sci Rep 2023;13:432, https://pubmed.ncbi.nlm.nih.gov/36624160/.
- **B3 [B]** Übersichtsarbeit: Resonanzfrequenz ≈ 0,1 Hz erhöht Herzschwingungen, vagale HRV und Baroreflex-Empfindlichkeit. Sevoz-Couche & Laborde, Neurosci Biobehav Rev 2022;135:104576, https://pubmed.ncbi.nlm.nih.gov/35167847/. → **[A]** 0,1 Hz = 6 Atemzüge je Minute (Rechnung).
- **B4 [B]** Systematische Übersicht (15 Studien, langsames Atmen < 10/min, gesunde Erwachsene): mehr HRV/respiratorische Sinusarrhythmie, mehr Entspannung/Wohlbefinden; Evidenz laut Autoren begrenzt. Zaccaro et al., Front Hum Neurosci 2018;12:353, https://www.frontiersin.org/journals/human-neuroscience/articles/10.3389/fnhum.2018.00353/full.
- **B5 [B]** RCT (1 Monat, 5 min täglich): ausatembetontes „cyclic sighing“ verbessert die Stimmung stärker als Achtsamkeitsmeditation (p < 0,05) und senkt die Atemfrequenz. Balban et al., Cell Rep Med 2023;4:100895, https://pubmed.ncbi.nlm.nih.gov/36630953/.
- **B6 [O]** Ob ein einzelner 60-Sekunden-Moment auf einer Website messbar beruhigt, ist nicht belegt – die Studien betreffen Sitzungen von Minuten bzw. wochenlanges Üben.

**Vorbilder:** eXHALeR (Browser-Atemtaktgeber mit Phasen Ein/Halten/Aus, Ton wahlweise): https://xhalr.com/ [B]. Apple Watch „Atmen“ und Calm sind bekannte Muster, wurden aber nicht geöffnet → [O].

**Technik:** reine Zeitfunktion im vorhandenen Shader (Uniform), kein Zusatzpaket; damit das Display nicht abdunkelt, Screen Wake Lock (Safari 16.4, auf iOS vollständig ab 18.4; Chrome 84) – **[B]** MDN browser-compat-data `api/WakeLock.json`, 10.11.2026. Bei „Bewegung reduzieren“ nur Helligkeit statt Größe ändern [A].

**Datenschutz:** nichts. **HWG [A]:** als Einladung formulieren („Ein Moment zum Durchatmen“), keine Wirkversprechen (kein „senkt Blutdruck/Stress“).

**Aufwand:** klein. **Urteil: JA** – beste Verbindung aus Evidenz, Markenpassung (Ankommen im Haus) und Null-Risiko.

---

### (c) Haptik im Web

- **C1 [B]** `navigator.vibrate`: Chrome/Android ab 32, seit Chrome 60 nur nach Nutzergeste; Safari (macOS und iOS): nicht unterstützt; Firefox Desktop entfernt (129), Firefox Android: „Vibration is disabled“. Quelle: MDN browser-compat-data `api/Navigator.json` (10.11.2026); MDN-Seite: https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API (zuletzt geändert 11.4.2024, „Limited availability“).
- **C2 [B]** iOS-Umweg über `<input type="checkbox" switch>` (Schalter aus Safari 17.4, https://webkit.org/blog/15063/webkit-features-in-safari-17-4/, 5.3.2024): WebKit hat schon Anfang 2025 die Haptik an eine Nutzeraktivierung gebunden (Bug 285120 „haptic feedback … should require user activation“, gemeldet 23.12.2024, behoben 3.1.2025, https://bugs.webkit.org/show_bug.cgi?id=285120).
- **C3 [B]** Die verbreitete Bibliothek `ios-haptics` schreibt in ihrer README: „please note this only works on ios 17.4 to 26.4, as apple patched it in ios 26.5“ (https://unpkg.com/ios-haptics@3.1.1/README.md; npm-Stand 3.3.0 vom 25.10.2026). Ein Nutzerbericht bestätigt: „Since updating to iOS 26.5, nothing works anymore“ (21.5.2026, https://openstagecontrol.discourse.group/t/haptics-support-on-sliders-and-buttons/4255). Ein weiterer Bericht (Flarum-Forum) war nicht ladbar.
- **C4 [O]** Ob ein echter, direkt angetippter Schalter auf iOS 26.5+ noch „tickt“, ist nicht belegt.

**Urteil: Android – SPÄTER/klein** (10–20 ms Tick, wenn sich ein Knoten löst oder ein Wirbel einrastet; drei Zeilen Code, reine Zugabe). **iPhone – NEIN** (Stand 11/2026 kein verlässlicher Weg; Hack ist geschlossen).

---

### (d) Neigen/Bewegen des Geräts

- **D1 [B]** `DeviceOrientationEvent.requestPermission()` braucht eine Nutzergeste (transient activation), sonst `NotAllowedError`; nur in sicherem Kontext; Rückgabe „granted“/„denied“. Quelle: https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static (zuletzt geändert 4.8.2026).
- **D2 [B]** Unterstützung: iOS-Safari ab 14.5 (laut browser-compat-data; WebKit nennt die Pflicht bereits für Safari 13: https://webkit.org/blog/9674/new-webkit-features-in-safari-13/), Chrome ab 152, Firefox nein. Quelle: MDN browser-compat-data `api/DeviceOrientationEvent.json` (10.11.2026). In Chrome meldete die Methode 2023 nur den Bestand, ohne Dialog (Intent to Ship, 13.10.2023, https://groups.google.com/a/chromium.org/g/blink-dev/c/jy6QmMeV9gY); ob Chrome 152 einen Dialog zeigt: **[O]**.
- **[A]** Auf dem iPhone heißt das: erst Knopf, dann System-Dialog „Zugriff auf Bewegung und Ausrichtung“. Für ein Haus, das freundlich empfangen soll, ist ein Systemdialog an der Tür ein Bruch.

**Urteil: SPÄTER** – höchstens als freiwilliger Knopf „Mit dem Handy umsehen“ innerhalb des Rundgangs; Standard bleibt Ziehen/Scrollen.

---

### (e) Ton

- **E1 [B]** Autoplay-Regel: Medien mit Ton starten nur, wenn stumm, nach Nutzerinteraktion, auf Freigabeliste oder per Permissions-Policy; Web Audio außerhalb einer Nutzereingabe unterliegt denselben Regeln. Quelle: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay (zuletzt geändert 10.9.2026).
- **E2 [B]** Chrome: „Muted autoplay is always allowed“; ein vor einer Geste erzeugter `AudioContext` startet „suspended“ und muss nach der Geste mit `resume()` geweckt werden (Web Audio seit Chrome 71 erfasst). Quelle: https://developer.chrome.com/blog/autoplay.
- **E3 [B]** iPhone: Web Audio schweigt, wenn der Stummschalter an ist; Standard-Sitzungstyp ist „ambient“; mit `navigator.audioSession.type = "playback"` (seit iOS 17) ließe sich das umgehen. Quelle: WebKit-Bug 237322, Kommentar vom 25.9.2024, https://bugs.webkit.org/show_bug.cgi?id=237322.
- **[A]** Für HOP ist genau das Standardverhalten richtig: Ton nur nach eigenem Knopf („Klang an“), erzeugte Töne (Oszillator + Rauschen, keine Dateien, keine Lizenzfragen), Stummschalter wird respektiert, kein `playback`-Trick. Sinnvoll gekoppelt an den Atem-Moment (leiser Ton steigt/fällt) und an „Spannung lösen“.
- **[O]** Vorbilder für zurückhaltende Klanggestaltung auf Praxis-/Gesundheitsseiten: keine belastbare Quelle geöffnet (Preisträger-Seiten sind skriptlastig und per Abruf nicht prüfbar).

**Aufwand:** klein bis mittel (gutes Klangbild braucht Feinarbeit). **Urteil: JA, klein – aus per Voreinstellung, nur als Begleitung des Atem-Moments.**

---

### (f) Tageszeit, Jahreszeit, Sonnenstand – „echtes Licht in Schorndorf“

- **F1 [B]** SunCalc: BSD-2-Clause-Lizenztext im Repository (https://raw.githubusercontent.com/mourner/suncalc/master/LICENSE), Version 2.1.4, ohne Abhängigkeiten, berechnet Sonnen-/Mondstand, Dämmerungsphasen, Mondphase für Ort und Zeit (README im npm-Paket). Größe 5,3 KB (gzip, `suncalc.cjs`) – eigene Messung.
- **F2 [B] (eigene Messung)** Für Schorndorf (48,805° N, 9,527° O) stimmen Auf-/Untergang an vier Prüftagen auf ≤ 1 Minute mit dem U.S. Naval Observatory überein (zweite Gegenprobe `api.sunrise-sunset.org`: ≤ 40 s).
- **F3 [B]** Open-Meteo: die kostenlose Schnittstelle ist nur für nicht-kommerzielle Nutzung erlaubt („You may only use the free API services for non-commercial purposes“; Tabelle: Free API – Commercial use ❌); Protokolle mit IP-Adressen/Koordinaten werden bis 90 Tage gehalten. Quelle: https://open-meteo.com/en/terms (10.11.2026). → **[A]** Eine Praxis-Website ist Werbung für ein Gewerbe/einen freien Beruf → nicht zulässig.
- **F4 [B]** Bright Sky (DWD-Daten als JSON): kostenlos, ohne Schlüssel, „free-to-use for all purposes“, von einer Einzelperson betrieben; keine Datenschutzangaben auf der Seite. Quelle: https://brightsky.dev/ (10.11.2026). DWD-Daten: Weiterverwendung unter CC BY 4.0 mit Quellenvermerk, https://www.dwd.de/DE/service/rechtliche_hinweise/rechtliche_hinweise_node.html.
- **[A]** Jeder Wetterabruf aus dem Browser überträgt die IP-Adresse der Besucher an einen Dritten → widerspricht der Randbedingung „keine Abrufe bei Dritten ohne Einwilligung“. Umweg ohne Besucher-Abruf: geplanter GitHub-Actions-Lauf schreibt `wetter.json` ins Repository – möglich, aber neue Pflegestelle und Fehlerquelle.

**Was daraus wird:** Fensterlicht und Himmel des Partikel-Hauses folgen dem echten Sonnenstand am Praxisort (immer Zeitzone Europe/Berlin, nicht die des Besuchers); in der Dämmerung brennt Licht; Jahreszeit färbt Staub/Garten leicht.

**Urteil: Sonnenstand/Jahreszeit JA** (5 KB, keine Pflege, geprüft). **Wetter NEIN** (Open-Meteo unzulässig, sonst Drittabruf oder Pflegeaufwand).

---

### (g) KI im Gerät

- **G1 [B]** Chrome Prompt API: im Web ab Chrome 148; Voraussetzungen „At least 22 GB of free space“, „Strictly more than 4 GB of VRAM“ bzw. „16 GB of RAM or more and 4 CPU cores or more“; „Chrome for Android, iOS, and ChromeOS on non-Chromebook Plus devices are not yet supported.“ Quelle: https://developer.chrome.com/docs/ai/prompt-api (zuletzt aktualisiert 21.10.2026). browser-compat-data: `LanguageModel` Chrome 148, Chrome Android nein, Safari nein, Firefox nein.
- **G2 [B]** WebLLM: kleinstes gängiges Modell SmolLM2-360M (q4f16) braucht 376 MB Grafikspeicher, Llama-3.2-1B (q4f16) 879 MB, Phi-3.5-mini 3,67 GB. Quelle: https://github.com/mlc-ai/web-llm/blob/main/src/config.ts (10.11.2026). WebGPU: Safari ab 26, Chrome Android ab 121 (browser-compat-data `api/GPU.json`; https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/, 9.6.2025).
- **[A]** Auf dem Hauptgerät iPhone gibt es die Chrome-KI gar nicht; WebLLM hieße Hunderte MB Download für ein kleines Modell, das auf Deutsch zu Gesundheitsfragen unzuverlässig antwortet – bei einer Heilberufs-Seite ein Haftungs- und HWG-Risiko.

**Urteil: NEIN.**

---

### (h) „Spielzeuge“ mit Lerneffekt

- **H1 [B]** Technische Basis ist auf iPhone-Safari vorhanden: WebGL 2 ab Safari 15, Rendern in Halb-Gleitkomma-Texturen (`EXT_color_buffer_half_float`) ab Safari 14, Gleitkomma (`EXT_color_buffer_float`) ab Safari 15; WebGPU ab Safari 26. Quelle: MDN browser-compat-data (10.11.2026).
- **H2 [B]** three.js liefert fertige Muster: `webgl_gpgpu_water`, `webgl_gpgpu_birds`, `physics_ammo_cloth`, `physics_ammo_rope`, `webgpu_compute_cloth` (Liste https://github.com/mrdoob/three.js/blob/dev/examples/files.json, 10.11.2026).
- **[A]** Für ein Faszien-/Gewebenetz mit 1 000–3 000 Knoten reicht eine Feder-Masse-Rechnung (Verlet) auf der CPU; kein GPGPU nötig, kein Zusatzpaket. Die vorhandene Figur „Spannung lösen“ ist bereits so ein Spielzeug – das Netz wäre die Vertiefung: Ziehen an einer Stelle bewegt entfernte Stellen („alles hängt zusammen“).
- **[A]** „Nervensignal verfolgen“ passt in die vorhandene Wirbelsäule (Wurzel antippen → Impuls läuft in Arm/Bein) – Lerneffekt hoch, aber mehr Inhaltspflege (Dermatome korrekt darstellen). „Haltung der Figur verändern“ ist fachlich heikel (es gibt nicht „die richtige Haltung“) → nur mit Botschaft „die nächste Haltung ist die beste“.

**Urteil: Gewebe-Netz JA (eines, gut gemacht) · Nervensignal SPÄTER · Haltungs-Regler NEIN/zurückstellen.**

---

### (i) Mitnehmen

- **I1 [B]** Web Share: `navigator.share` in Safari ab 12.1 (iOS gleich), Chrome Android ab 61, Chrome Desktop ab 128, Firefox Desktop nur hinter Schalter; braucht Nutzergeste und HTTPS. Teilbare Dateitypen laut MDN u. a. `image/png`, `application/pdf`, `text/plain` – **`text/vcard` und `text/calendar` stehen nicht auf der Liste**. Quellen: MDN browser-compat-data; https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share (16.7.2026).
- **I2 [B]** Apple-Wallet-Pass: braucht Pass-Type-ID im Apple-Developer-Konto, Signaturzertifikat und eine PKCS#7-Signatur über das Manifest. Quelle: https://developer.apple.com/documentation/walletpasses/building-a-pass (JSON-Fassung gelesen, 10.11.2026). → **[A]** Ohne Server müsste der private Schlüssel in der Seite liegen – ausgeschlossen; das Entwicklerprogramm ist kostenpflichtig (Preis nicht aus geöffneter Quelle belegt → [O]).
- **I3 [B]** Dateizuordnung: in `mime-db` ist `.ics` → `text/calendar`, `.vcf` → `text/x-vcard` (https://github.com/jshttp/mime-db). **[O]** ob GitHub Pages genau diese Tabelle nutzt und wie iOS-Safari eine `.vcf` von GitHub Pages behandelt – auf dem Gerät testen.
- **I4 [B]** iOS/iPadOS 26: „By default, every website added to the Home Screen opens as a web app“; Manifest und Service Worker bleiben wirksam (https://webkit.org/blog/16993/…, 9.6.2025). Speicher ist ohne Zusage nicht dauerhaft („best-effort“), Löschung nach Nichtnutzung möglich (https://webkit.org/blog/14403/updates-to-storage-policy/, 10.8.2023).
- **I5 [B]** § 25 TDDDG: Speichern im Endgerät nur mit Einwilligung, außer wenn „unbedingt erforderlich …, damit der Anbieter eines digitalen Dienstes einen vom Nutzer ausdrücklich gewünschten digitalen Dienst zur Verfügung stellen kann“ (https://www.gesetze-im-internet.de/ttdsg/__25.html). → **[A]** Offline-Speicher/Service Worker nur nach ausdrücklichem Knopf; kein stilles „Willkommen zurück“.
- **[A]** Kalenderdatei: Die Seite kennt den gebuchten Termin nicht (Buchung läuft im Optica-Rahmen). Eine `.ics` ginge nur aus selbst eingetipptem Datum; Blob-Downloads auf iOS sind fehleranfällig (ältere Berichte, kein aktueller Beleg → [O]).

**Was ohne Server geht:** Kontaktkarte als statische `.vcf`; „Teilen“-Knopf (Adresse/Link); eine **Karte fürs Handy** als Bild (PNG aus Canvas: Adresse, Telefon, Parken, „Bitte mitbringen“, Platz für den Termin) über Web Share bzw. Download.

**Urteil: Kontaktkarte + Teilen + Bildkarte JA (klein) · .ics SPÄTER · Web-App/Offline SPÄTER (wenig Nutzen für eine Praxis-Seite) · Wallet NEIN.**

---

### (j) Lebenszeichen ohne Pflegeaufwand

- **J1 [B] (eigene Messung)** Feiertage BW lassen sich mit ~15 Zeilen lokal berechnen; 2026–2035 identisch mit `feiertage-api.de` (Gründonnerstag/Reformationstag dort nur als schulfrei vermerkt und ausgenommen).
- **[A]** Öffnungsstatus („Regulär geöffnet bis 19 Uhr“ / „Wir sind morgen ab 8 Uhr wieder da“) aus festen Zeiten + Feiertagen, immer in Europe/Berlin (`Intl.DateTimeFormat`), mit einer einzigen optionalen Zeile für Praxisurlaub. Wortwahl „regulär“, weil ein Einzelinhaber auch einmal unplanmäßig fehlt.
- **[A]** Weitere Zeichen aus derselben Rechnung, alle lokal: Licht in den Fenstern nur während der Öffnungszeit; Dämmerung/Nacht am Haus (f); Jahreszeit; Mondphase am Nachthimmel (SunCalc); Gruß nach Tageszeit; „Heute ist Feiertag – das Haus ruht“.
- **[O]** „Nächster freier Termin“ wäre das stärkste Lebenszeichen, braucht aber eine Optica-Schnittstelle – nicht geprüft, vermutlich nicht ohne Server/Drittabruf.

**Urteil: JA** (zusammen mit f eine einzige kleine „Jetzt in Schorndorf“-Funktion).

---

## 2. Schluss: die fünf besten – und was bewusst wegbleibt

| Rang | Idee | Wirkung | Marke | Machbarkeit iPhone | Rechts-/Datenrisiko | Zusatzlast |
|---|---|---|---|---|---|---|
| 1 | **Atem-Moment** im Empfang (6/min, Figur/Haus atmen mit) | hoch | Ankommen, Ruhe, Bewegung | sicher (nur Zeitfunktion) | keins (keine Heilversprechen) | ≈ 0 KB |
| 2 | **Jetzt in Schorndorf**: echtes Licht (SunCalc) + Öffnungsstatus + Feiertage | hoch („die Seite lebt“ wird wahr) | Zuhause, Licht im Fenster | sicher | keins (alles lokal) | ≈ 6 KB gzip |
| 3 | **Gewebe-Netz** zum Ziehen (ein Spielzeug mit Aha-Effekt) | mittel–hoch | Bewegung, Handarbeit | wahrscheinlich (CPU-Federn; auf Gerät prüfen) | keins | wenige KB eigener Code |
| 4 | **Mitnehmen**: Kontaktkarte, Teilen, Bildkarte fürs Handy | mittel (Nutzwert) | Gastfreundschaft | sicher (Share ab Safari 12.1) | keins | wenige KB |
| 5 | **Klang auf Wunsch** (erzeugt, aus per Voreinstellung, an Atem gekoppelt) | mittel | Wärme | sicher (nach Antippen; Stummschalter gilt) | keins | wenige KB |

Zielabgleich: alle fünf ohne Fremdabruf, ohne Systemdialog, zusammen deutlich unter 40 KB – **laut Quellen und Messung erfüllt; die iPhone-Leistung von Rang 3 ist ungeprüft**.

**Bewusst weggelassen**
- **KI im Gerät** – auf iPhone nicht verfügbar bzw. Hunderte MB; Haftungsrisiko.
- **Wetter** – Open-Meteo für eine Praxis nicht erlaubt; sonst Drittabruf.
- **Wallet-Pass** – braucht Signatur mit Apple-Zertifikat, also Server und Entwicklerkonto.
- **Haptik auf dem iPhone** – Umweg seit iOS 26.5 geschlossen.
- **Neigen als Standard** – Systemdialog an der Haustür.
- **Mitmach-Übung mit Korrektur per Kamera** – Medizinprodukt-Nähe, hoher Aufwand.
- **Spiegel-Moment** – nicht verworfen, aber aus dem Kern genommen: ≈ 9–10 MB, Kamera-Dialog, iPhone-Bildrate unbelegt → Experiment mit Abbruchkriterium.

## 3. Was fehlte (kein Fake)

- Kein echtes iPhone/Android-Gerät: Bildraten (Pose, Gewebe-Netz), Verhalten von `.vcf`/`.ics`, Wake Lock, Stummschalter nicht am Gerät geprüft.
- PubMed-Webseiten verlangten Cookies → Abstracts über die offizielle NCBI-Schnittstelle gelesen (gleicher Inhalt); Volltexte von Laborde 2022 und Sevoz-Couche 2022 (Elsevier) nicht geöffnet.
- nature.com leitete auf eine Anmeldeseite um → Fincham 2023 nur als PubMed-Abstract.
- EUR-Lex (MDR-Text) lieferte eine leere Antwort → Medizinprodukt-Frage offen.
- discuss.flarum.org nicht ladbar (zweiter Bericht zu iOS 26.5).
- Apple-Entwicklerprogramm: Preis nicht aus geöffneter Quelle belegt.
- Vorbilder für Klanggestaltung und Atem-Momente auf Preisträger-Seiten sind skriptlastig und per Textabruf nicht prüfbar.

## 4. Nebenbefund für die anderen Stränge

- **[B]** GitHub Pages: „not intended for or allowed to be used as a free web-hosting service to run your online business, e-commerce site, or any other website that is primarily directed at either facilitating commercial transactions or providing commercial software as a service (SaaS)“; weiche Grenze 100 GB/Monat, Seite ≤ 1 GB. Quelle: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits (10.11.2026). Ob eine Praxis-Infoseite darunter fällt, ist Auslegung → **[O]**, beim Livegang klären.
