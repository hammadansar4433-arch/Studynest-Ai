(()=>{
const root=document.getElementById('lab3d');if(!root)return;
const $=s=>root.querySelector(s);
let TH,R,sc,cam,mod,tick,grp,vals={},vis=false,paused=false,tm=0,last=0,hudTxt='',spin=false,raf=0;
const O={th:.8,ph:1.15,r:14,tg:[0,0,0]},PI=Math.PI;
const V=(x,y,z)=>new TH.Vector3(x,y,z);
const mt=(c,o)=>new TH.MeshStandardMaterial(Object.assign({color:c,roughness:.4,metalness:.1},o));
const ms=(g,m,p)=>{const o=new TH.Mesh(g,m);if(p)o.position.set(p[0],p[1],p[2]);return o};
const ball=(r,c,p,o)=>ms(new TH.SphereGeometry(r,28,20),mt(c,o),p);
const line=(pts,c,o)=>new TH.Line(new TH.BufferGeometry().setFromPoints(pts),new TH.LineBasicMaterial(Object.assign({color:c},o)));
function label(txt,col,s,p){const c=document.createElement('canvas');c.width=320;c.height=64;const x=c.getContext('2d');x.font='700 34px system-ui,sans-serif';x.fillStyle=col||'#fff';x.textAlign='center';x.textBaseline='middle';x.fillText(txt,160,32);const sp=new TH.Sprite(new TH.SpriteMaterial({map:new TH.CanvasTexture(c),transparent:true,depthTest:false}));s=s||1;sp.scale.set(2.5*s,.5*s,1);if(p)sp.position.set(p[0],p[1],p[2]);sp.renderOrder=9;return sp}
function stick(a,b,r,m,off){const d=b.clone().sub(a),l=d.length(),c=ms(new TH.CylinderGeometry(r,r,l,12),m);c.position.copy(a).add(b).multiplyScalar(.5);if(off)c.position.add(off);c.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());return c}
const f1=(n,d)=>(+n).toFixed(d==null?1:d);

/* ================= MODULES ================= */
const MODS=[];
/* ---- PHYSICS: projectile ---- */
MODS.push({s:'Physics',n:'Projectile motion',ic:'🎯',cam:[.9,1.25,17,[0,2.5,0]],
c:[{id:'v',l:'Launch speed (m/s)',min:5,max:60,st:1,v:25},{id:'a',l:'Angle (°)',min:5,max:85,st:1,v:45},{id:'g',l:'Gravity (m/s²)',min:1.6,max:25,st:.1,v:9.8}],
calc(v){const th=v.a*PI/180,vx=v.v*Math.cos(th),vy=v.v*Math.sin(th);return{vx,vy,T:2*vy/v.g,Rg:vx*2*vy/v.g,H:vy*vy/(2*v.g)}},
build(v,g){const q=this.calc(v),k=Math.min(16/Math.max(q.Rg,1),7/Math.max(q.H,1)),x0=-q.Rg*k/2;
g.add(new TH.GridHelper(20,20,0x2f6f62,0x1b3a33));
const pts=[];for(let i=0;i<=80;i++){const t=q.T*i/80;pts.push(V(x0+q.vx*t*k,(q.vy*t-.5*v.g*t*t)*k,0))}
g.add(line(pts,0x34d399));g.add(line([V(x0,.03,0),V(-x0,.03,0)],0xf5d9a0));
g.add(label('Range R = '+f1(q.Rg)+' m','#f5d9a0',1,[0,-.55,0]));g.add(label('Max height H = '+f1(q.H)+' m','#9be8d0',1,[x0+q.Rg*k/2,q.H*k+.7,0]));
g.add(ms(new TH.BoxGeometry(.7,.35,.5),mt(0x64748b),[x0,.17,0]));
const b=ball(.28,0xf5d9a0,[x0,.3,0],{emissive:0x7a5a10}),ar=new TH.ArrowHelper(V(1,0,0),V(0,0,0),2,0xfb7185,.5,.3);g.add(b,ar);
return t=>{const p=Math.min((t%5)/4,1),tt=p*q.T,x=q.vx*tt,y=Math.max(q.vy*tt-.5*v.g*tt*tt,0),vy=q.vy-v.g*tt,sp=Math.hypot(q.vx,vy);
b.position.set(x0+x*k,y*k+.28,0);ar.position.copy(b.position);ar.setDirection(V(q.vx,vy,0).normalize());ar.setLength(Math.max(sp*.09,.7),.5,.3);
return 't = '+f1(tt,2)+' s · x = '+f1(x)+' m · y = '+f1(y)+' m · speed = '+f1(sp)+' m/s'}},
info(v){const q=this.calc(v);return `<b>Time of flight</b><br>T = 2v sinθ / g = <b>${f1(q.T,2)} s</b><br><b>Maximum height</b><br>H = v² sin²θ / 2g = <b>${f1(q.H)} m</b><br><b>Range</b><br>R = v² sin2θ / g = <b>${f1(q.Rg)} m</b><br><span class="mu">Horizontal speed stays ${f1(q.vx)} m/s. Only vertical speed changes (red arrow). Try 30° and 60°: same range. 45° gives the maximum.</span>`},
q:v=>`Explain projectile motion for a ball launched at ${v.v} m/s at ${v.a}° with g=${v.g}. Derive time of flight, max height and range step by step with the numbers.`});
/* ---- PHYSICS: orbits ---- */
MODS.push({s:'Physics',n:'Orbits & Kepler',ic:'🪐',cam:[.5,1.0,19,[0,0,0]],
c:[{id:'e',l:'Eccentricity e',min:0,max:.9,st:.05,v:.5},{id:'s',l:'Time speed',min:1,max:5,st:.5,v:2}],
build(v,g){const a=7,e=v.e,b=a*Math.sqrt(1-e*e),N=24,dM=2*PI/10;
const kep=M=>{let E=M;for(let i=0;i<9;i++)E=M+e*Math.sin(E);return[a*(Math.cos(E)-e),b*Math.sin(E)]};
g.add(ball(.7,0xffc94a,[0,0,0],{emissive:0xff9d00}));g.add(new TH.PointLight(0xfff0c0,1.6,80));
const pts=[];for(let i=0;i<=160;i++){const E=i/160*2*PI;pts.push(V(a*(Math.cos(E)-e),0,b*Math.sin(E)))}g.add(line(pts,0x5eead4));
const mk=col=>{const geo=new TH.BufferGeometry();geo.setAttribute('position',new TH.BufferAttribute(new Float32Array((N+2)*3),3));const ix=[];for(let i=0;i<N;i++)ix.push(0,i+1,i+2);geo.setIndex(ix);const m=new TH.Mesh(geo,new TH.MeshBasicMaterial({color:col,transparent:true,opacity:.55,side:TH.DoubleSide}));g.add(m);return m};
const fill=(m,M0)=>{const p=m.geometry.attributes.position.array;for(let i=0;i<=N;i++){const c=kep(M0+dM*i/N);p[(i+1)*3]=c[0];p[(i+1)*3+1]=0;p[(i+1)*3+2]=c[1]}m.geometry.attributes.position.needsUpdate=true};
const w1=mk(0xf5d9a0),w2=mk(0x38bdf8);fill(w1,-dM/2);
g.add(label('Perihelion · fastest','#f5d9a0',.8,[a*(1-e),.9,0]));g.add(label('Aphelion · slowest','#9be8d0',.8,[-a*(1+e),.9,0]));
const pl=ball(.32,0x4aa8ff,[0,0,0],{emissive:0x0a3a7a});g.add(pl);
return t=>{const M=t*.5*v.s,c=kep(M);pl.position.set(c[0],0,c[1]);fill(w2,M-dM);const r=Math.hypot(c[0],c[1]);return 'distance = '+f1(r/a,2)+' a · speed = '+f1(Math.sqrt(2*a/r-1),2)+' × average'}},
info(v){const e=v.e;return `<b>Kepler's laws</b><ol><li>Orbit is an ellipse, Sun at one focus.</li><li>Equal areas in equal times: the gold and blue wedges always have the <b>same area</b>.</li><li>T² ∝ a³</li></ol>Speed ratio: v<sub>peri</sub> / v<sub>aph</sub> = (1+e)/(1−e) = <b>${f1((1+e)/(1-e),2)}</b><br><span class="mu">Slide e to 0 for a circle, where speed never changes.</span>`},
q:v=>`Explain Kepler's three laws using an orbit with eccentricity ${v.e}. Why does a planet move faster near the Sun? Give 3 board-style questions.`});
/* ---- CHEMISTRY: molecules ---- */
const CPK={H:[0xf8fafc,.3],C:[0x555b66,.52],O:[0xef4444,.48],N:[0x3b82f6,.5],B:[0xf0abab,.5],F:[0x84cc16,.42]};
const benz=(()=>{const a=[],b=[];for(let i=0;i<6;i++){const t=i*PI/3;a.push(['C',1.4*Math.cos(t),1.4*Math.sin(t),0])}for(let i=0;i<6;i++){const t=i*PI/3;a.push(['H',2.48*Math.cos(t),2.48*Math.sin(t),0]);b.push([i,(i+1)%6,i%2?1:2],[i,6+i,1])}return{a,b}})();
const MOL=[
{n:'Water H₂O',a:[['O',0,0,0],['H',.757,.586,0],['H',-.757,.586,0]],b:[[0,1,1],[0,2,1]],lp:[[0,-.55,.75],[0,-.55,-.75]],sh:'Bent (V-shaped)',an:'104.5°',hy:'sp³, 2 lone pairs',po:'Polar. Lone pairs push the H atoms closer than 109.5°.'},
{n:'Carbon dioxide CO₂',a:[['O',-1.16,0,0],['C',0,0,0],['O',1.16,0,0]],b:[[0,1,2],[1,2,2]],sh:'Linear',an:'180°',hy:'sp',po:'Non-polar. The two C=O dipoles cancel.'},
{n:'Methane CH₄',a:[['C',0,0,0],['H',.63,.63,.63],['H',-.63,-.63,.63],['H',-.63,.63,-.63],['H',.63,-.63,-.63]],b:[[0,1,1],[0,2,1],[0,3,1],[0,4,1]],sh:'Tetrahedral',an:'109.5°',hy:'sp³',po:'Non-polar, perfectly symmetrical.'},
{n:'Ammonia NH₃',a:[['N',0,0,0],['H',.94,-.38,0],['H',-.47,-.38,.81],['H',-.47,-.38,-.81]],b:[[0,1,1],[0,2,1],[0,3,1]],lp:[[0,.85,0]],sh:'Trigonal pyramidal',an:'107°',hy:'sp³, 1 lone pair',po:'Polar. The lone pair makes it a Lewis base.'},
{n:'Ethene C₂H₄',a:[['C',-.67,0,0],['C',.67,0,0],['H',-1.24,.93,0],['H',-1.24,-.93,0],['H',1.24,.93,0],['H',1.24,-.93,0]],b:[[0,1,2],[0,2,1],[0,3,1],[1,4,1],[1,5,1]],sh:'Trigonal planar at each C',an:'~120°',hy:'sp²',po:'Non-polar. C=C is one σ bond plus one π bond, so it cannot rotate.'},
{n:'Ethyne C₂H₂',a:[['C',-.6,0,0],['C',.6,0,0],['H',-1.66,0,0],['H',1.66,0,0]],b:[[0,1,3],[0,2,1],[1,3,1]],sh:'Linear',an:'180°',hy:'sp',po:'Non-polar. C≡C is one σ bond plus two π bonds.'},
{n:'Boron trifluoride BF₃',a:[['B',0,0,0],['F',1.31,0,0],['F',-.655,1.134,0],['F',-.655,-1.134,0]],b:[[0,1,1],[0,2,1],[0,3,1]],sh:'Trigonal planar',an:'120°',hy:'sp²',po:'Non-polar. Boron has only 6 electrons, so it accepts a pair (Lewis acid).'},
{n:'Benzene C₆H₆',a:benz.a,b:benz.b,sh:'Planar hexagon',an:'120°',hy:'sp²',po:'Non-polar. The π electrons are delocalised over the whole ring.'}];
MODS.push({s:'Chemistry',n:'Molecule shapes',ic:'🧪',cam:[.7,1.2,9,[0,0,0]],
c:[{id:'m',l:'Molecule',t:'s',o:MOL.map(m=>m.n),v:0},{id:'st',l:'Style',t:'s',o:['Ball and stick','Space-filling'],v:0},{id:'sp',l:'Auto-rotate',t:'c',v:1}],
build(v,g){const m=MOL[v.m],S=1.6,sf=v.st==1,P=m.a.map(a=>V(a[1]*S,a[2]*S,a[3]*S));spin=!!v.sp;
m.a.forEach((a,i)=>{const d=CPK[a[0]],o=ball(d[1]*S*(sf?2.3:1),d[0],[P[i].x,P[i].y,P[i].z]);g.add(o);if(!sf)g.add(label(a[0],'#fff',.55,[P[i].x,P[i].y+d[1]*S+.35,P[i].z]))});
if(!sf){const bm=mt(0xcbd5e1,{metalness:.3});m.b.forEach(b=>{const d=P[b[1]].clone().sub(P[b[0]]),p=V(-d.y,d.x,0);if(p.length()<.01)p.set(1,0,0);p.normalize();(b[2]==1?[0]:b[2]==2?[-.1,.1]:[-.2,0,.2]).forEach(o=>g.add(stick(P[b[0]],P[b[1]],.07,bm,p.clone().multiplyScalar(o))))});
(m.lp||[]).forEach(l=>{const o=ball(.42,0x93c5fd,[l[0]*S,l[1]*S,l[2]*S],{transparent:true,opacity:.45});o.scale.set(.8,1.3,.8);o.lookAt(0,0,0);g.add(o)})}},
info(v){const m=MOL[v.m];return `<b>${m.n}</b><br>Shape: <b>${m.sh}</b><br>Bond angle: <b>${m.an}</b><br>Hybridisation: <b>${m.hy}</b><br><span class="mu">${m.po}</span><br><span class="mu">Faint blue blobs are lone pairs. Drag to look at the molecule from every side.</span>`},
q:v=>`Explain the shape of ${MOL[v.m].n} using VSEPR theory and hybridisation. Include bond angle, polarity and 3 board-style questions.`});
/* ---- CHEMISTRY: atom ---- */
const EL='H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca'.split(' '),EN='Hydrogen Helium Lithium Beryllium Boron Carbon Nitrogen Oxygen Fluorine Neon Sodium Magnesium Aluminium Silicon Phosphorus Sulphur Chlorine Argon Potassium Calcium'.split(' '),MA=[1,4,7,9,11,12,14,16,19,20,23,24,27,28,31,32,35,40,39,40];
const shells=z=>{const s=[];for(const k of [2,8,8,2]){const n=Math.min(z,k);s.push(n);z-=n;if(z<=0)break}return s};
MODS.push({s:'Chemistry',n:'Atomic structure',ic:'⚛️',cam:[.6,1.15,16,[0,0,0]],
c:[{id:'z',l:'Atomic number Z',min:1,max:20,st:1,v:11}],
build(v,g){const z=v.z,sh=shells(z),A=MA[z-1],N=A-z,rn=.2*Math.cbrt(A)*1.15;let s=7;const rnd=()=>(s=s*16807%2147483647)/2147483647;
const pm=mt(0xef4444),nm=mt(0x94a3b8),gm=new TH.SphereGeometry(.2,14,10);
for(let i=0;i<A;i++){const u=rnd()*2-1,t=rnd()*2*PI,r=rn*Math.cbrt(rnd()),q=Math.sqrt(1-u*u);g.add(ms(gm,i<z?pm:nm,[r*q*Math.cos(t),r*u,r*q*Math.sin(t)]))}
const el=[];sh.forEach((n,i)=>{const r=2.2+i*1.15,gr=new TH.Group();gr.rotation.set(i*.55,i*.9,i*.3);gr.add(ms(new TH.TorusGeometry(r,.012,6,120),new TH.MeshBasicMaterial({color:0x5eead4,transparent:true,opacity:.5})));
for(let k=0;k<n;k++){const o=ball(.13,i==sh.length-1?0xfacc15:0x38bdf8,[0,0,0],{emissive:i==sh.length-1?0x8a6a00:0x0a3a7a});gr.add(o);el.push({o,r,ph:k/n*2*PI,w:1.5/Math.pow(r,.5)})}g.add(gr)});
return t=>{el.forEach(e=>{const a=e.ph+e.w*t;e.o.position.set(e.r*Math.cos(a),e.r*Math.sin(a),0)})}},
info(v){const z=v.z,sh=shells(z),val=sh[sh.length-1],N=MA[z-1]-z,gp=z==2?18:(val<=2?val:10+val),noble=val==8||z==2;
const beh=noble?'Outer shell full: stable noble gas, almost never reacts.':val<4?`Loses ${val} electron${val>1?'s':''} to form ${EL[z-1]}${val>1?val:''}<sup>+</sup>.`:val==4?'Shares 4 electrons (covalent bonding).':`Gains ${8-val} electron${8-val>1?'s':''} to form ${EL[z-1]}<sup>${8-val>1?8-val:''}−</sup>.`;
return `<b>${EN[z-1]} (${EL[z-1]})</b><br>Protons ${z} · Neutrons ${N} · Mass number ${MA[z-1]}<br>Electron arrangement: <b>${sh.join(', ')}</b><br>Valence electrons: <b>${val}</b> (yellow)<br>Period ${sh.length} · Group ${gp}<br><span class="mu">${beh}</span><br><span class="mu">Red = protons, grey = neutrons, blue/yellow = electrons.</span>`},
q:v=>`Explain the atomic structure of ${EN[v.z-1]} (Z=${v.z}): electron arrangement, valence electrons, group, period and how it forms bonds. Add 3 board-style questions.`});
/* ---- BIOLOGY: DNA ---- */
const BC={A:0xef4444,T:0x3b82f6,G:0xfacc15,C:0x22c55e},CP={A:'T',T:'A',G:'C',C:'G'};
const seq=n=>{let s=11,o='';for(let i=0;i<n;i++){s=s*16807%2147483647;o+='ATGC'[s%4]}return o};
MODS.push({s:'Biology',n:'DNA double helix',ic:'🧬',cam:[.9,1.35,17,[0,0,0]],
c:[{id:'n',l:'Base pairs',min:8,max:40,st:1,v:24},{id:'s',l:'Spin speed',min:0,max:3,st:.5,v:1}],
build(v,g){const n=v.n,q=seq(n),Rd=1.6,rise=.5,h=n*rise,b1=mt(0x8b5cf6),b2=mt(0x14b8a6),pg=new TH.SphereGeometry(.28,14,10),pts=[[],[]];
for(let i=0;i<n;i++){const th=i*PI/5,y=i*rise-h/2,x=Math.cos(th)*Rd,z=Math.sin(th)*Rd;
[[x,z,b1,q[i]],[-x,-z,b2,CP[q[i]]]].forEach((s,k)=>{const p=V(s[0],y,s[1]);g.add(ms(pg,s[2],[p.x,y,p.z]));pts[k].push(p);
const c=V(0,y,0),mid=p.clone().add(c).multiplyScalar(.5);g.add(stick(p,mid,.1,mt(BC[s[3]])));g.add(stick(mid,c,.1,mt(BC[CP[s[3]]])))})}
pts.forEach((a,k)=>{for(let i=1;i<a.length;i++)g.add(stick(a[i-1],a[i],.09,k?b2:b1))});
return(t)=>{g.rotation.y=t*v.s*.3}},
info(v){const q=seq(v.n),c=s=>[...s].map(x=>`<b style="color:#${BC[x].toString(16).padStart(6,'0')}">${x}</b>`).join('');return `<b>Strand 1:</b> ${c(q.slice(0,16))}…<br><b>Strand 2:</b> ${c([...q.slice(0,16)].map(x=>CP[x]).join(''))}…<br><br>Red A = blue T (<b>2</b> hydrogen bonds)<br>Yellow G = green C (<b>3</b> hydrogen bonds)<br><span class="mu">Purple and teal are the sugar-phosphate backbones. 10 base pairs make one full turn (3.4 nm). Strands run in opposite directions (antiparallel).</span>`},
q:v=>`Explain the structure of DNA: base pairing, hydrogen bonds, sugar-phosphate backbone, antiparallel strands. Add 3 board-style questions.`});
/* ---- MATHS: solids ---- */
const SOL=['Cylinder','Cone','Sphere','Cuboid','Square pyramid'];
MODS.push({s:'Maths',n:'Solids & volume',ic:'📐',cam:[.7,1.2,11,[0,0,0]],
c:[{id:'k',l:'Solid',t:'s',o:SOL,v:0},{id:'r',l:'Radius r',min:1,max:3,st:.1,v:2},{id:'h',l:'Height h',min:1,max:6,st:.1,v:4},{id:'cut',l:'Cross-section cut (%)',min:0,max:100,st:1,v:100}],
dim(v){const r=v.r,h=v.k==2?2*r:v.h,l=Math.hypot(r,h);return[r,h,l]},
build(v,g){const[r,h]=this.dim(v),pl=new TH.Plane(V(0,-1,0),-h/2+h*v.cut/100);
const G=[new TH.CylinderGeometry(r,r,h,48),new TH.CylinderGeometry(0,r,h,48),new TH.SphereGeometry(r,48,32),new TH.BoxGeometry(2*r,h,2*r),new TH.CylinderGeometry(0,r*Math.SQRT2,h,4)][v.k];if(v.k==4)G.rotateY(PI/4);
g.add(ms(G,mt(0x14b8a6,{transparent:true,opacity:.55,side:TH.DoubleSide,clippingPlanes:[pl]})));g.add(ms(G,new TH.MeshBasicMaterial({color:0xcffafe,wireframe:true,transparent:true,opacity:.22,clippingPlanes:[pl]})));
g.add(line([V(0,-h/2,0),V(r,-h/2,0)],0xfacc15),line([V(r*1.3,-h/2,0),V(r*1.3,h/2,0)],0xfb7185));
g.add(label('r','#facc15',.9,[r/2,-h/2-.35,0]),label('h','#fb7185',.9,[r*1.3+.4,0,0]));const gh=new TH.GridHelper(12,12,0x2f6f62,0x1b3a33);gh.position.y=-h/2-.01;g.add(gh)},
info(v){const[r,h,l]=this.dim(v),p=PI,k=v.k;const F=[['V = πr²h','CSA = 2πrh','TSA = 2πr(r + h)',p*r*r*h,2*p*r*h,2*p*r*(r+h)],['V = ⅓πr²h','CSA = πrl, l = √(r²+h²)','TSA = πr(r + l)',p*r*r*h/3,p*r*l,p*r*(r+l)],['V = ⁴⁄₃πr³','Surface area = 4πr²','',4/3*p*r**3,4*p*r*r,0],['V = l×w×h = 4r²h','Lateral = 2h(l+w) = 8rh','TSA = 2(lw+lh+wh)',4*r*r*h,8*r*h,8*r*r+8*r*h],['V = ⅓ × base × h','Lateral = ½ × perimeter × s','TSA = base + lateral',4*r*r*h/3,4*r*l,4*r*r+4*r*l]][k];
return `<b>${SOL[k]}</b> (r = ${f1(r)}, h = ${f1(h)})<br>${F[0]} = <b>${f1(F[3])}</b><br>${F[1]} = <b>${f1(F[4])}</b>${F[2]?`<br>${F[2]} = <b>${f1(F[5])}</b>`:''}<br><span class="mu">Drag the cut slider to slice the solid and look inside. Cuboid and pyramid use a square base of side 2r.</span>`},
q:v=>`Derive the volume and surface area formulas of a ${SOL[v.k]} and solve one numerical with r=${v.r}, h=${v.h}. Add 3 practice questions.`});
/* ---- MATHS: surfaces ---- */
const FN=[{n:'Paraboloid',e:'z = x² + y²',f:(x,y)=>x*x+y*y,d:3,h:.3},{n:'Saddle',e:'z = x² − y²',f:(x,y)=>x*x-y*y,d:3,h:.4},{n:'Ripple (sinc)',e:'z = sin(r) / r',f:(x,y)=>{const r=Math.hypot(x,y);return r<1e-6?1:Math.sin(r)/r},d:9,h:4},{n:'Egg box',e:'z = sin x · cos y',f:(x,y)=>Math.sin(x)*Math.cos(y),d:6,h:1.6},{n:'Gaussian bell',e:'z = e^−(x²+y²)',f:(x,y)=>Math.exp(-(x*x+y*y)),d:2.5,h:5}];
MODS.push({s:'Maths',n:'3D graphs & calculus',ic:'📈',cam:[.8,1.0,17,[0,1,0]],
c:[{id:'f',l:'Function',t:'s',o:FN.map(f=>f.n),v:0},{id:'x',l:'Point x (%)',min:-100,max:100,st:2,v:40},{id:'y',l:'Point y (%)',min:-100,max:100,st:2,v:30},{id:'w',l:'Wireframe',t:'c',v:0}],
pt(v){const F=FN[v.f],x=v.x/100*F.d,y=v.y/100*F.d,e=F.d*1e-3;return{F,x,y,z:F.f(x,y),fx:(F.f(x+e,y)-F.f(x-e,y))/(2*e),fy:(F.f(x,y+e)-F.f(x,y-e))/(2*e)}},
build(v,g){const p=this.pt(v),F=p.F,N=80,s=F.d/6,geo=new TH.PlaneGeometry(12,12,N,N);geo.rotateX(-PI/2);const P=geo.attributes.position,z=[];let lo=1e9,hi=-1e9;
for(let i=0;i<P.count;i++){const f=F.f(P.getX(i)*s,P.getZ(i)*s);z.push(f);lo=Math.min(lo,f);hi=Math.max(hi,f)}
const col=new Float32Array(P.count*3),c=new TH.Color();for(let i=0;i<P.count;i++){P.setY(i,z[i]*F.h);c.setHSL(.62*(1-(z[i]-lo)/(hi-lo||1)),.75,.5);col.set([c.r,c.g,c.b],i*3)}
geo.setAttribute('color',new TH.BufferAttribute(col,3));geo.computeVertexNormals();
g.add(ms(geo,mt(0xffffff,{vertexColors:true,side:TH.DoubleSide,roughness:.55})));if(v.w)g.add(ms(geo,new TH.MeshBasicMaterial({color:0x0b1512,wireframe:true,transparent:true,opacity:.3})));
const px=p.x/s,pz=p.y/s,py=p.z*F.h;g.add(ball(.2,0xffffff,[px,py,pz],{emissive:0xffffff}));
const tg=new TH.PlaneGeometry(3,3);tg.rotateX(-PI/2);const tp=ms(tg,new TH.MeshBasicMaterial({color:0xfacc15,transparent:true,opacity:.5,side:TH.DoubleSide}),[px,py,pz]);tp.quaternion.setFromUnitVectors(V(0,1,0),V(-F.h*p.fx*s,1,-F.h*p.fy*s).normalize());g.add(tp);
g.add(new TH.AxesHelper(7))},
info(v){const p=this.pt(v);return `<b>${p.F.n}:</b> ${p.F.e}<br>At (x, y) = (${f1(p.x,2)}, ${f1(p.y,2)})<br>z = <b>${f1(p.z,2)}</b><br>∂z/∂x = <b>${f1(p.fx,2)}</b> · ∂z/∂y = <b>${f1(p.fy,2)}</b><br><span class="mu">The yellow plane is the tangent plane at the white dot. Its tilt is set by the two partial derivatives (slopes along x and y). At a peak, valley or saddle centre it lies flat.</span>`},
q:v=>`Explain the graph of ${FN[v.f].e} in 3D and what partial derivatives mean. Compute ∂z/∂x and ∂z/∂y for it, and find its stationary points.`});

/* ---- PHYSICS: wave interference ---- */
MODS.push({s:'Physics',n:'Wave interference',ic:'🌊',cam:[.6,.95,19,[0,0,0]],
c:[{id:'l',l:'Wavelength λ',min:1,max:4,st:.1,v:2},{id:'d',l:'Source separation d',min:0,max:8,st:.2,v:4},{id:'a',l:'Amplitude',min:.2,max:1.2,st:.1,v:.6}],
build(v,g){const N=72,geo=new TH.PlaneGeometry(16,16,N,N);geo.rotateX(-PI/2);const P=geo.attributes.position,col=new Float32Array(P.count*3),k=2*PI/v.l,h=v.d/2,c=new TH.Color();geo.setAttribute('color',new TH.BufferAttribute(col,3));
g.add(ms(geo,mt(0xffffff,{vertexColors:true,side:TH.DoubleSide,roughness:.3,metalness:.2})));g.add(ball(.2,0xf5d9a0,[-h,.3,0],{emissive:0x7a5a10}));g.add(ball(.2,0xf5d9a0,[h,.3,0],{emissive:0x7a5a10}));
return t=>{const w=t*3;for(let i=0;i<P.count;i++){const x=P.getX(i),z=P.getZ(i),r1=Math.hypot(x+h,z)+.05,r2=Math.hypot(x-h,z)+.05,y=v.a*(Math.sin(k*r1-w)/Math.sqrt(1+r1*.5)+Math.sin(k*r2-w)/Math.sqrt(1+r2*.5))*1.4;P.setY(i,y);c.setHSL(.6-.3*Math.max(-1,Math.min(1,y/(v.a*1.6)))*.5-.15,.7,.45+y*.12);col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b}
P.needsUpdate=true;geo.attributes.color.needsUpdate=true;geo.computeVertexNormals();return 'Two coherent sources · λ = '+f1(v.l)+' · d = '+f1(v.d)}},
info(v){return `<b>Principle of superposition</b><br>Waves from two sources add together at every point.<br><b>Constructive</b> (big crests): path difference = <b>nλ</b><br><b>Destructive</b> (flat, quiet): path difference = <b>(n + ½)λ</b><br>Here λ = ${f1(v.l)} and d = ${f1(v.d)}, so up to about <b>${Math.floor(2*v.d/v.l)+1}</b> bright fringes can appear.<br><span class="mu">Set d = 0 and you get one bigger wave. Increase d and watch the nodal lines multiply. This is Young's double slit idea in 3D.</span>`},
q:v=>`Explain interference of waves using two sources with wavelength ${v.l} and separation ${v.d}. Constructive vs destructive interference, path difference, and 3 board-style questions.`});
/* ---- PHYSICS: pendulum ---- */
MODS.push({s:'Physics',n:'Pendulum & SHM',ic:'🕰️',cam:[.35,1.35,15,[0,-2.2,0]],
c:[{id:'L',l:'Length L (m)',min:.5,max:5,st:.1,v:2.5},{id:'a',l:'Release angle (°)',min:5,max:80,st:1,v:30},{id:'g',l:'Gravity g (m/s²)',min:1.6,max:25,st:.1,v:9.8}],
build(v,g){const K=1.5,L=v.L*K,top=[0,2,0];let th=v.a*PI/180,om=0;
g.add(ms(new TH.BoxGeometry(4,.3,.6),mt(0x64748b),[0,2.15,0]));g.add(ball(.14,0x94a3b8,[0,2,0]));
const arc=[];for(let i=-20;i<=20;i++){const a=v.a*PI/180*i/20;arc.push(V(L*Math.sin(a),2-L*Math.cos(a),0))}g.add(line(arc,0x5eead4,{transparent:true,opacity:.5}));
g.add(line([V(0,2,0),V(0,2-L,0)],0x475569,{transparent:true,opacity:.6}));
const bob=ball(.45,0xf5d9a0,[0,2-L,0],{emissive:0x7a5a10}),sg=new TH.BufferGeometry(),pa=new Float32Array(6);sg.setAttribute('position',new TH.BufferAttribute(pa,3));g.add(new TH.Line(sg,new TH.LineBasicMaterial({color:0xe2e8f0})),bob);
return(t,dt)=>{const n=Math.max(1,Math.ceil(dt/.004)),h=dt/n;for(let i=0;i<n;i++){om+=-(v.g/v.L)*Math.sin(th)*h;th+=om*h}
const x=L*Math.sin(th),y=2-L*Math.cos(th);bob.position.set(x,y,0);pa.set([0,2,0,x,y,0]);sg.attributes.position.needsUpdate=true;
const sp=v.L*om,hh=v.L*(1-Math.cos(th)),E=v.g*v.L*(1-Math.cos(v.a*PI/180)),pe=E?Math.min(1,v.g*hh/E):0;return 'angle = '+f1(th*180/PI)+'° · speed = '+f1(Math.abs(sp),2)+' m/s · PE '+Math.round(pe*100)+'% · KE '+Math.round((1-pe)*100)+'%'}},
info(v){const T=2*PI*Math.sqrt(v.L/v.g),T2=T*(1+Math.pow(v.a*PI/180,2)/16);return `<b>Time period</b><br>T = 2π√(L/g) = <b>${f1(T,2)} s</b><br>Frequency f = 1/T = <b>${f1(1/T,2)} Hz</b><br>For a ${v.a}° swing the true period is a little longer: <b>${f1(T2,2)} s</b><br><span class="mu">T does not depend on the mass or (for small angles) on the amplitude. Quadruple L to double T. At the bottom all energy is kinetic, at the ends all is potential (see PE and KE below the model).</span>`},
q:v=>`Explain simple harmonic motion using a simple pendulum with L=${v.L} m and g=${v.g}. Derive T = 2π√(L/g), and show energy conversion. Add 3 numericals.`});
/* ---- CHEMISTRY: ionic crystals ---- */
MODS.push({s:'Chemistry',n:'Ionic crystals',ic:'🧂',cam:[.7,1.1,14,[0,0,0]],
c:[{id:'t',l:'Crystal',t:'s',o:['NaCl (rock salt)','CsCl'],v:0},{id:'n',l:'Size (unit cells)',min:1,max:2,st:1,v:2},{id:'sp',l:'Spread ions apart (%)',min:0,max:100,st:5,v:35}],
build(v,g){const n=v.n,a=1.3+1.4*v.sp/100,rg=new TH.SphereGeometry(1,24,16),A=mt(0xa78bfa),B=mt(0x4ade80),pos=[],off=v.t==0?n*a/2:n*a/2;
if(v.t==0){for(let i=0;i<=n*2;i++)for(let j=0;j<=n*2;j++)for(let k=0;k<=n*2;k++)pos.push([i,j,k,(i+j+k)%2])}
else{for(let i=0;i<=n;i++)for(let j=0;j<=n;j++)for(let k=0;k<=n;k++)pos.push([i*2,j*2,k*2,0]);for(let i=0;i<n;i++)for(let j=0;j<n;j++)for(let k=0;k<n;k++)pos.push([i*2+1,j*2+1,k*2+1,1])}
const m=v.t==0?2*n:2*n,h=a/2,c=[off*0,0,0];pos.forEach(p=>{const o=ms(rg,p[3]?B:A,[p[0]*h-m*h/2,p[1]*h-m*h/2,p[2]*h-m*h/2]);o.scale.setScalar(p[3]?(v.t==0?.5:.46):(v.t==0?.32:.5));g.add(o)});
if(v.sp>=20&&v.t==0){const bm=mt(0x94a3b8);pos.forEach(p=>[[1,0,0],[0,1,0],[0,0,1]].forEach(d=>{if(p[0]+d[0]<=m&&p[1]+d[1]<=m&&p[2]+d[2]<=m)g.add(stick(V(p[0]*h-m*h/2,p[1]*h-m*h/2,p[2]*h-m*h/2),V((p[0]+d[0])*h-m*h/2,(p[1]+d[1])*h-m*h/2,(p[2]+d[2])*h-m*h/2),.03,bm))}))}},
info(v){return v.t==0?`<b>Sodium chloride, NaCl</b><br>Purple = Na⁺ (small), green = Cl⁻ (large)<br>Coordination number <b>6 : 6</b>: each ion touches 6 of the opposite charge.<br>Arrangement: face-centred cubic, 4 formula units per unit cell.<br><span class="mu">Ions alternate in all three directions, so attraction beats repulsion. This is why ionic solids have high melting points and are brittle: shifting a layer lines up like charges.</span>`:`<b>Caesium chloride, CsCl</b><br>Purple = Cs⁺, green = Cl⁻<br>Coordination number <b>8 : 8</b>: each ion sits at the centre of a cube of the opposite ion.<br>Simple cubic arrangement, 1 formula unit per unit cell.<br><span class="mu">The big Cs⁺ ion fits 8 neighbours, but small Na⁺ only fits 6, which is why NaCl has a different structure.</span>`},
q:v=>`Explain the crystal structure of ${v.t?'CsCl':'NaCl'}: coordination number, unit cell, and why ionic solids have high melting points. Add 3 board-style questions.`});
/* ---- BIOLOGY: animal cell ---- */
const ORG=['Show all','Nucleus','Mitochondria','Rough ER','Golgi body','Ribosomes','Lysosomes','Cell membrane'],
OI=['Click an organelle in the list to highlight it. Slide the cut to look inside.','<b>Nucleus</b>: control centre. Holds DNA (chromatin) inside a double membrane with pores. The nucleolus makes ribosomes.','<b>Mitochondria</b>: powerhouse. Aerobic respiration releases ATP. Double membrane, folded inner cristae, own DNA.','<b>Rough endoplasmic reticulum</b>: membrane folds studded with ribosomes. Makes proteins and sends them to the Golgi.','<b>Golgi body</b>: stack of flat sacs. Modifies, sorts and packs proteins into vesicles for export.','<b>Ribosomes</b>: tiny sites of protein synthesis (translation). Free in cytoplasm or attached to rough ER.','<b>Lysosomes</b>: sacs of digestive enzymes. Break down worn-out organelles and engulfed bacteria.','<b>Cell membrane</b>: phospholipid bilayer. Selectively permeable. Controls entry and exit of substances.'];
MODS.push({s:'Biology',n:'Animal cell',ic:'🔬',cam:[0,1.35,15,[0,0,0]],
c:[{id:'o',l:'Highlight organelle',t:'s',o:ORG,v:0},{id:'cut',l:'Cut open (%)',min:0,max:100,st:5,v:60}],
build(v,g){const pl=new TH.Plane(V(0,0,-1),5-5*v.cut/100),sel=v.o;let s=5;const rnd=()=>(s=s*16807%2147483647)/2147483647;
const M=(c,i,o)=>mt(c,Object.assign({clippingPlanes:[pl],side:TH.DoubleSide,transparent:sel&&sel!=i,opacity:sel&&sel!=i?.22:(o||1),emissive:sel==i?0x665500:0x000000},{}));
const mem=ms(new TH.SphereGeometry(5,48,32),M(0x93c5fd,7,.2));g.add(mem);if(sel==7)g.add(ms(new TH.SphereGeometry(5.03,32,20),new TH.MeshBasicMaterial({color:0xfacc15,wireframe:true,transparent:true,opacity:.25,clippingPlanes:[pl]})));
const nu=ms(new TH.SphereGeometry(1.5,32,24),M(0x8b5cf6,1,.8),[-.6,.3,-.4]);g.add(nu,ms(new TH.SphereGeometry(.5,20,16),M(0xf0abfc,1),[-.9,.5,-.4]));
[[2.4,1.6,-.8,.3],[1.5,-2.4,.4,1.2],[-2.6,-1.6,-.2,2.1],[.2,3,-1.5,.5],[-3,1.8,-.5,1.7],[2.8,-.4,-2,2.6]].forEach(p=>{const o=ms(new TH.SphereGeometry(.7,20,14),M(0xf97316,2),[p[0],p[1],p[2]]);o.scale.set(1.5,.7,.7);o.rotation.set(p[3],p[3]*1.3,p[3]*.6);g.add(o);const q=ms(new TH.SphereGeometry(.45,14,10),M(0xc2410c,2),[p[0],p[1],p[2]]);q.scale.set(1.5,.35,.35);q.rotation.copy(o.rotation);g.add(q)});
[1.9,2.25,2.6].forEach((r,i)=>{const t=ms(new TH.TorusGeometry(r,.13,10,48,PI*1.35),M(0x38bdf8,3),[-.6,.3,-.4]);t.rotation.set(.3+i*.35,-.5+i*.5,i*.6);g.add(t)});
for(let i=0;i<4;i++){const t=ms(new TH.TorusGeometry(.9-i*.08,.1,8,32,PI*1.2),M(0xf472b6,4),[2.4,-1.4+i*.28,-1.2]);t.rotation.set(PI/2,0,i*.15);g.add(t)}
const rb=new TH.SphereGeometry(.09,8,6);for(let i=0;i<70;i++){const u=rnd()*2-1,a=rnd()*2*PI,r=2+rnd()*2.6,q=Math.sqrt(1-u*u);g.add(ms(rb,M(0xfde047,5),[r*q*Math.cos(a),r*u,r*q*Math.sin(a)]))}
[[-2,-3,.6],[3.3,2.2,-1],[-3.4,.4,1.5],[1,-3.6,-1.4],[.8,2.9,2]].forEach(p=>g.add(ms(new TH.SphereGeometry(.34,14,10),M(0x84cc16,6),p)));
const LP=[null,[-.6,2.1,-.4],[2.4,2.6,-.8],[-1.3,2.4,-.4],[2.4,-.2,-1.2],[-2.5,2.4,0],[-2,-2.3,.6],[0,5.6,0]];if(sel&&LP[sel])g.add(label(ORG[sel],'#facc15',1,LP[sel]));spin=false},
info(v){return OI[v.o]+'<br><span class="mu">Mitochondria are orange, nucleus purple, ER blue, Golgi pink, ribosomes yellow, lysosomes green.</span>'},
q:v=>`Explain the structure and function of an animal cell${v.o?', focusing on the '+ORG[v.o]:''}. Give differences from a plant cell and 3 board-style questions.`});

/* ================= UI ================= */
const SUBJ=['Physics','Chemistry','Biology','Maths'],SI={Physics:'⚡',Chemistry:'🧪',Biology:'🧬',Maths:'📐'};
let cs=0,cm=0;try{const o=JSON.parse(localStorage.getItem('sn3d')||'{}');if(MODS[o.m])cm=o.m}catch(e){}cs=SUBJ.indexOf(MODS[cm].s);
const css=document.createElement('style');css.textContent=`.lab{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:14px;align-items:start}@media(max-width:820px){.lab{grid-template-columns:1fr}}
.stage{position:relative;border-radius:26px;overflow:hidden;background:radial-gradient(circle at 50% 35%,#13302a,#07110d);height:min(64vh,500px);min-height:330px;box-shadow:0 30px 60px -36px #052e2b;border:1px solid var(--ln)}
.stage canvas{width:100%;height:100%;display:block;touch-action:none;cursor:grab}.stage canvas:active{cursor:grabbing}
.hud{position:absolute;left:14px;right:14px;bottom:12px;color:#c9efe3;font:600 12px system-ui,sans-serif;pointer-events:none;text-shadow:0 1px 3px #000}
.hint{position:absolute;right:14px;top:12px;color:#7fb3a4;font:12px system-ui,sans-serif;pointer-events:none}
.msg3{position:absolute;inset:0;display:grid;place-items:center;text-align:center;color:#c9efe3;padding:20px}
.lc{display:block;margin:0 0 12px;font-size:14px;color:var(--mu)}.lc b{color:var(--tx)}.lc input[type=range]{width:100%;accent-color:var(--ac)}.lc select{width:100%;margin-top:4px}
#l-info{font-size:14px;line-height:1.6}#l-info ol{margin:4px 0}`;document.head.appendChild(css);
root.innerHTML=`<span class="eb">★ New · 3D Lab</span><h2>Study it <em>in 3D.</em></h2><p class="sub">Drag to rotate, scroll or pinch to zoom. Change the sliders and the model updates live: projectile motion, planetary orbits, molecule shapes, atoms, DNA, solids and 3D graphs.</p>
<div class="tabs" id="l-sj"></div><div class="tabs" id="l-md"></div>
<div class="lab"><div class="stage" id="l-st"><div class="hint">drag · scroll</div><div class="hud" id="l-hud"></div><div class="msg3" id="l-ms">Loading 3D engine…</div></div>
<div><div class="card" id="l-ct"></div><div class="card" id="l-in"></div>
<div class="row"><button class="b g s" id="l-pz">⏸ Pause</button><button class="b g s" id="l-rv">Reset view</button><button class="b s" id="l-ex">✨ Explain this</button><button class="b g s" id="l-qz">📝 Quiz me</button></div></div></div>`;
const info=()=>{$('#l-in').innerHTML=`<h3 style="margin-bottom:8px">${mod.ic} ${mod.n}</h3><div id="l-info">${mod.info(vals)}</div>`};
function tabs(){$('#l-sj').innerHTML=SUBJ.map((s,i)=>`<button class="b s ${i==cs?'':'g'}" data-s="${i}">${SI[s]} ${s}</button>`).join('');
$('#l-md').innerHTML=MODS.map((m,i)=>m.s==SUBJ[cs]?`<button class="b s ${i==cm?'':'g'}" data-m="${i}" style="${i==cm?'':'background:transparent;border:1px solid var(--ln)'}">${m.ic} ${m.n}</button>`:'').join('')}
function ctl(){$('#l-ct').innerHTML=mod.c.map(c=>c.t=='s'?`<label class="lc">${c.l}<select data-id="${c.id}">${c.o.map((o,i)=>`<option value="${i}" ${vals[c.id]==i?'selected':''}>${o}</option>`).join('')}</select></label>`:c.t=='c'?`<label class="lc"><input type="checkbox" data-id="${c.id}" ${vals[c.id]?'checked':''}> ${c.l}</label>`:`<label class="lc">${c.l}: <b id="v-${c.id}">${vals[c.id]}</b><input type="range" data-id="${c.id}" min="${c.min}" max="${c.max}" step="${c.st}" value="${vals[c.id]}"></label>`).join('')}
function clear(){if(!grp)return;grp.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){if(o.material.map)o.material.map.dispose();o.material.dispose()}});sc.remove(grp);grp=null}
function rebuild(){if(!TH)return;clear();grp=new TH.Group();sc.add(grp);spin=false;tick=mod.build(vals,grp)||null;info()}
function pick(i,keep){cm=i;mod=MODS[i];vals={};mod.c.forEach(c=>vals[c.id]=c.v);try{localStorage.setItem('sn3d',JSON.stringify({m:i}))}catch(e){}tabs();ctl();tm=0;if(TH){rebuild();view()}else info()}
function view(){const c=mod.cam;O.th=c[0];O.ph=c[1];O.r=c[2];O.tg=c[3]}
function setupCam(){const p=O.tg,s=Math.sin(O.ph);cam.position.set(p[0]+O.r*s*Math.sin(O.th),p[1]+O.r*Math.cos(O.ph),p[2]+O.r*s*Math.cos(O.th));cam.lookAt(p[0],p[1],p[2])}
function frame(now){raf=requestAnimationFrame(frame);if(!vis||!TH)return;const dt=Math.min((now-last)/1000,.1);last=now;if(!paused)tm+=dt;if(spin&&!paused)O.th+=dt*.35;
if(tick){const h=tick(tm,paused?0:dt);if(h!==hudTxt){hudTxt=h||'';$('#l-hud').textContent=hudTxt}}setupCam();R.render(sc,cam)}
function boot(){if(TH)return;const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
s.onload=()=>{try{TH=window.THREE;const cv=document.createElement('canvas');$('#l-st').prepend(cv);R=new TH.WebGLRenderer({canvas:cv,antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,2));R.localClippingEnabled=true;
sc=new TH.Scene();cam=new TH.PerspectiveCamera(45,1,.1,300);sc.add(new TH.AmbientLight(0xffffff,.6));const d=new TH.DirectionalLight(0xffffff,.9);d.position.set(6,10,7);sc.add(d);const d2=new TH.DirectionalLight(0x88ccff,.35);d2.position.set(-6,-4,-5);sc.add(d2);
const rs=()=>{const st=$('#l-st');R.setSize(st.clientWidth,st.clientHeight,false);cam.aspect=st.clientWidth/st.clientHeight;cam.updateProjectionMatrix()};new ResizeObserver(rs).observe($('#l-st'));rs();gestures(cv);
$('#l-ms').remove();rebuild();view();last=performance.now();raf=requestAnimationFrame(frame)}catch(e){fail()}};s.onerror=fail;document.head.appendChild(s)}
function fail(){const m=$('#l-ms');if(m)m.innerHTML='The 3D engine could not load.<br>Check your internet connection and refresh the page.'}
function gestures(cv){const P=new Map();let pd=0;cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);P.set(e.pointerId,[e.clientX,e.clientY]);spin=false});
cv.addEventListener('pointermove',e=>{if(!P.has(e.pointerId))return;const o=P.get(e.pointerId);if(P.size==1){O.th-=(e.clientX-o[0])*.008;O.ph=Math.max(.12,Math.min(PI-.12,O.ph-(e.clientY-o[1])*.008))}P.set(e.pointerId,[e.clientX,e.clientY]);
if(P.size==2){const[a,b]=[...P.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pd)O.r=Math.max(3,Math.min(60,O.r*pd/d));pd=d}});
const up=e=>{P.delete(e.pointerId);pd=0};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('wheel',e=>{e.preventDefault();O.r=Math.max(3,Math.min(60,O.r*Math.exp(e.deltaY*.001)))},{passive:false})}
let tq=0;const upd=e=>{const t=e.target,id=t.dataset.id;if(!id)return;vals[id]=t.type=='checkbox'?+t.checked:+t.value;const b=root.querySelector('#v-'+id);if(b)b.textContent=vals[id];cancelAnimationFrame(tq);tq=requestAnimationFrame(()=>{rebuild()})};
$('#l-ct').addEventListener('input',upd);$('#l-ct').addEventListener('change',upd);
root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
if(b.dataset.s!=null){cs=+b.dataset.s;pick(MODS.findIndex(m=>m.s==SUBJ[cs]))}else if(b.dataset.m!=null)pick(+b.dataset.m);
else if(b.id=='l-pz'){paused=!paused;b.textContent=paused?'▶ Play':'⏸ Pause'}else if(b.id=='l-rv')view();
else if(b.id=='l-ex'||b.id=='l-qz'){if(typeof ask!=='function')return;const q=mod.q(vals);ask(b.id=='l-qz'?'Make 3 practice MCQs with answers about: '+q:q);location.hash='#buddy'}});
pick(cm);
new IntersectionObserver(es=>{vis=es[0].isIntersecting;if(vis)boot()},{rootMargin:'300px'}).observe(root);
})();
