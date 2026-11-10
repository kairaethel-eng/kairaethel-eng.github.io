# Lichtprobe „Licht malt den Raum“ – Wegwerf-Entwurf (10.11.2026)

Zweck: die tragende Behauptung des Konzepts `../KONZEPT.md` belegen – die Partikel-Praxis kann warm werden, ohne hell zu werden und ohne den Punkte-Stil aufzugeben. **Kein Produktcode.** Die bestehende Seite `labor/hausbesuch-puls.html` und ihre Quellen sind unverändert; die Probe ist ein Aufsatz auf eine Kopie von `labor/src/fusion/`.

## Was die Probe zeigt
- Lampen als Lichtquellen (Pendelleuchten, Stehleuchte, Deckenstrahler, Türlaterne) mit weichem Abfall, je Raum wirksam.
- Sonne durch Fenster: Sonnenrichtung aus der Tageszeit; je Punkt wird im Shader geprüft, ob der Strahl zur Sonne durch ein Fenster des eigenen Raums geht (weiche Kante). Fenster sind frei gewählt, weil der Grundriss schematisch ist; Annahme: Haustür zeigt nach Süden (`HOUSE_AZ` in `light.js`).
- Neue Punkt-Schicht „Flächen“ (Dielen, Wände, Vorplatz, Glas, Rahmen): erscheint nur, wo Licht hinfällt. PC 240 000, Handy 55 000 Punkte.
- Raster und Scan-Zeilen treten auf rund ein Fünftel zurück, Kanten bleiben.
- Abends leuchten die Fenster von außen, nachts schläft das Haus (nur Laterne und eine gedimmte Leuchte).
- Staub leuchtet im Sonnenstrahl, Dampf über der Tasse am Tresen, Lampen-Schein.
- Tageszeit: `?zeit=morgen|mittag|golden|abend|nacht|jetzt` (Standard `jetzt` = echter Sonnenstand über Schorndorf, lokal berechnet in `sun.js`, kein Netzabruf) und eine kleine Umschaltleiste (am Handy ein Knopf „Licht · …“ oben links, der aufklappt). `?licht=0` zeigt das unveränderte Aussehen. `?kosten=1` ersetzt die Lichtrechnung je Punkt durch einen festen Wert – nur zum Messen, was eingebackenes Licht kosten würde.
- „Bewegung anhalten“ und „Bewegung reduzieren“ werden beachtet (Staub und Dampf stehen).

## Dateien
- `light.js` – Licht-Zustand, GLSL-Baustein `houseLight(p, n, room)`, Flächen-Punkte, Lampen-Schein, Lichtbahnen, Dampf, Umschaltleiste.
- `sun.js` – Sonnenstand (Höhe, Azimut) aus Datum und Ort.
- `lichtprobe.patch` – Änderungen an `scene.js`, `main.js`, `figure.js`, `spine.js`, `page.html`, `style.css` gegenüber `labor/src/fusion/` (Stand Commit f5663a0).

## Nachbauen (ändert das Repository nicht, wenn es in einer Kopie geschieht)
```bash
cp -r labor /tmp/lichtprobe && cd /tmp/lichtprobe
cp <repo>/labor/licht-an/probe/light.js <repo>/labor/licht-an/probe/sun.js src/fusion/
patch -p2 < <repo>/labor/licht-an/probe/lichtprobe.patch
npm ci && node build.mjs fusion      # erzeugt hausbesuch-puls.html in der Kopie
```

## Bekannte Grenzen der Probe
- Fensterlagen und Himmelsrichtung sind Annahmen; der echte Grundriss fehlt.
- Am Handy liegt im Empfang die Pendelleuchte über dem Tresen außerhalb des Bildausschnitts; eine zusätzliche Hängeleuchte beim Teppich bringt eine Lichtquelle ins Bild. Die Kamera wurde nicht neu eingerichtet – das gehört zum Bau.
- Glasflächen wirken aus der Nähe noch körnig; Schatten der Möbel fehlen.
- Im Container gibt es keinen Grafikchip: Die Kosten sind nur als Vergleich vorher/nachher gemessen (`../BELEGE.md`), nicht als Bildrate am iPhone.
- Mittags wirkt der Raum neutraler als abends – gewollt („dunkel bleibt“), aber Geschmackssache.
- Die Probe rechnet das Licht in jedem Bild für jeden Punkt neu. Das ist bequem zum Ausprobieren, aber teuer (ohne Grafikchip −45 % Bilder je Sekunde). Für den Bau ist vorgesehen, das Licht beim Erzeugen der Punkte einzubacken und nur den aktuellen Raum zu zeichnen.
- Das Konzept sieht innen ein festes Lichtdrehbuch vor; die frei umschaltbare Tageszeit der Probe dient nur dem Vergleich.
- Private Vorschau der gebauten Probe: https://claude.ai/artifact/XsMLHYfwsSfixGGoPtFu47
