# Einzelne Dateien aus einem großen ZIP im Netz holen (HTTP-Teilabrufe über curl), ohne das ganze Archiv zu laden.
# Gebraucht für die feinen Anatomie-Netze (BodyParts3D 3.0, 522 MB; der ganze Download dauert im Cloud-Container ~20 min):
#   python3 -I tools/zipget.py https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/BodyParts3D_3.0_obj_95.zip <Zielordner> '^(FMA13075|FMA16202)\.obj$'
# Dritter Wert = Muster für den Dateinamen (ohne Ordner). Die FMA-Nummern stehen in parts_list_e.txt im selben Archiv-Ordner.
import sys, subprocess, zipfile, io, os, re
url, outdir, pattern = sys.argv[1], sys.argv[2], re.compile(sys.argv[3])
def head():
    out = subprocess.run(['curl', '-sSI', '-m', '60', url], capture_output=True, text=True).stdout
    return int(re.findall(r'(?i)content-length:\s*(\d+)', out)[-1])
class Remote(io.RawIOBase):
    B = 1 << 20
    def __init__(s): s.size = head(); s.pos = 0; s.cache = {}
    def seekable(s): return True
    def readable(s): return True
    def tell(s): return s.pos
    def seek(s, o, w=0): s.pos = o if w == 0 else s.pos + o if w == 1 else s.size + o; return s.pos
    def block(s, i):
        if i not in s.cache:
            a, b = i * s.B, min(s.size, (i + 1) * s.B) - 1
            for _ in range(4):
                r = subprocess.run(['curl', '-sS', '-m', '120', '-r', f'{a}-{b}', url], capture_output=True)
                if r.returncode == 0 and len(r.stdout) == b - a + 1: break
            else: raise IOError(f'Teilabruf {a}-{b} fehlgeschlagen')
            if len(s.cache) > 64: s.cache.pop(next(iter(s.cache)))
            s.cache[i] = r.stdout
        return s.cache[i]
    def read(s, n=-1):
        if n < 0: n = s.size - s.pos
        out = bytearray()
        while n > 0 and s.pos < s.size:
            i, o = divmod(s.pos, s.B); d = s.block(i)[o:o + n]
            out += d; s.pos += len(d); n -= len(d)
        return bytes(out)
z = zipfile.ZipFile(Remote())
names = z.namelist(); print(len(names), 'Einträge, z. B.', names[:3], file=sys.stderr)
os.makedirs(outdir, exist_ok=True)
for info in z.infolist():
    base = info.filename.replace(chr(92), '/').split('/')[-1]
    if not base or not pattern.search(base): continue
    with open(os.path.join(outdir, base), 'wb') as f: f.write(z.read(info))
    print(base, info.file_size)
