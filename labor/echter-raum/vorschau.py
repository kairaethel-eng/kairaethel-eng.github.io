# Software-Vorschau eines SPZ: Punkte als kleine Scheiben, Tiefenpuffer. Aufruf: soft.py scan.spz out.png px,py,pz tx,ty,tz [fov] [upx,upy,upz]
import sys,gzip,struct
import numpy as np
from PIL import Image
d=gzip.open(sys.argv[1],'rb').read()
n=struct.unpack('<I',d[8:12])[0]; fb=d[13]
b=np.frombuffer(d,dtype=np.uint8,count=n*9,offset=16).reshape(n,3,3).astype(np.int32)
v=b[:,:,0]|(b[:,:,1]<<8)|(b[:,:,2]<<16); P=(np.where(v&0x800000,v-0x1000000,v)/float(1<<fb))
A=np.frombuffer(d,dtype=np.uint8,count=n,offset=16+n*9)/255.
C=np.frombuffer(d,dtype=np.uint8,count=n*3,offset=16+n*10).reshape(n,3).astype(np.float32)
C=np.clip(((C/255.-0.5)/0.15)*0.2820948+0.5,0,1)
Sc=np.exp(np.frombuffer(d,dtype=np.uint8,count=n*3,offset=16+n*13).reshape(n,3)/16.-10.).max(1)
def render(out,p,t,fov=70,up=(0,1,0),W=900,H=600):
    p=np.array(p,float);t=np.array(t,float);up=np.array(up,float)
    f=t-p;f/=np.linalg.norm(f);r=np.cross(f,up);r/=np.linalg.norm(r);u=np.cross(r,f)
    q=P-p;x=q@r;y=q@u;z=q@f
    k=(z>0.1)&(A>0.25)&(Sc<1.0)
    fl=H/2/np.tan(np.radians(fov)/2)
    sx=(W/2+x[k]/z[k]*fl);sy=(H/2-y[k]/z[k]*fl);zz=z[k];cc=C[k];rad=np.clip(Sc[k]/zz*fl*1.2,0.6,6)
    o=np.argsort(-zz)
    img=np.zeros((H,W,3),np.float32)
    sx=sx[o];sy=sy[o];cc=cc[o];rad=rad[o]
    for R in range(0,7):
        m=(rad>=R-0.4) if R else np.ones(len(rad),bool)
        for dx in range(-R,R+1):
            for dy in range(-R,R+1):
                if max(abs(dx),abs(dy))!=R or dx*dx+dy*dy>R*R+1: continue
                X=np.round(sx[m]+dx).astype(int);Y=np.round(sy[m]+dy).astype(int)
                ok=(X>=0)&(X<W)&(Y>=0)&(Y<H)
                img[Y[ok],X[ok]]=cc[m][ok]
    Image.fromarray((img*255).astype(np.uint8)).save(out)
if __name__=='__main__':
    a=sys.argv
    render(a[2],[float(s) for s in a[3].split(',')],[float(s) for s in a[4].split(',')],float(a[5]) if len(a)>5 else 70,[float(s) for s in a[6].split(',')] if len(a)>6 else (0,1,0))
