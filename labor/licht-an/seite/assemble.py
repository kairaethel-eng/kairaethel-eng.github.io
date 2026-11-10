# Baut die Konzept-Seite (Artifact-Fragment) aus body.html, style.css, hero.js, dec.js; Werte aus werte.json ersetzen {{PLATZHALTER}}.
import json,re,io,os,sys
d=os.path.dirname(os.path.abspath(__file__))
rd=lambda f: open(os.path.join(d,f),encoding='utf-8').read()
vals=json.load(open(os.path.join(d,'werte.json'),encoding='utf-8')) if os.path.exists(os.path.join(d,'werte.json')) else {}
body=rd('body2.html')
for k,v in vals.items(): body=body.replace('{{'+k+'}}',v)
left=re.findall(r'\{\{[A-Z_]+\}\}',body)
head='<title>HOP Licht an</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,100..900;1,62..125,100..900&family=Libre+Caslon+Text:ital@0;1&display=swap">\n<style>\n'+rd('style.css')+'</style>\n'
out=head+body+'\n<script>\n'+rd('hero.js')+'</script>\n<script>\n'+rd('dec.js')+'</script>\n'
open(os.path.join(d,'hop-licht-an.html'),'w',encoding='utf-8').write(out)
open(os.path.join(d,'test-full.html'),'w',encoding='utf-8').write('<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'+out+'</body></html>')
print('Bytes',len(out.encode()),'offene Platzhalter',sorted(set(left)))
