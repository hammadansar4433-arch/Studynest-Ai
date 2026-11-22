(()=>{
const root=document.getElementById('calc');if(!root)return;
const PI=Math.PI;let deg=true,inv=false,mem=0,ans=0,fresh=false,hist=[];
try{hist=JSON.parse(localStorage.getItem('sn_calc')||'[]');if(hist.length)ans=hist[0][2]}catch(e){}
const fact=n=>{if(n<0||n%1)throw'Factorial needs a whole number ≥ 0';if(n>170)throw'Number too large';let r=1;for(let i=2;i<=n;i++)r*=i;return r};
const T=(f,x)=>f(deg?x*PI/180:x),I=r=>deg?r*180/PI:r;
const F={sin:x=>T(Math.sin,x),cos:x=>T(Math.cos,x),tan:x=>{if(deg?Math.abs(x%180)===90:Math.abs(Math.cos(x))<1e-14)throw'tan is undefined here';return T(Math.tan,x)},
asin:x=>{if(Math.abs(x)>1)throw'asin needs −1 ≤ x ≤ 1';return I(Math.asin(x))},acos:x=>{if(Math.abs(x)>1)throw'acos needs −1 ≤ x ≤ 1';return I(Math.acos(x))},atan:x=>I(Math.atan(x)),
sinh:Math.sinh,cosh:Math.cosh,tanh:Math.tanh,ln:x=>{if(x<=0)throw'ln needs x > 0';return Math.log(x)},log:x=>{if(x<=0)throw'log needs x > 0';return Math.log10(x)},
sqrt:x=>{if(x<0)throw'Square root of a negative number';return Math.sqrt(x)},cbrt:Math.cbrt,abs:Math.abs,exp:Math.exp,fact,
npr:(n,r)=>fact(n)/fact(n-r),ncr:(n,r)=>fact(n)/(fact(r)*fact(n-r))};
function calc(src){let s=src.replace(/×/g,'*').replace(/÷/g,'/').replace(/[−–]/g,'-').replace(/π/g,'pi').replace(/√/g,'sqrt').replace(/\s+/g,'').toLowerCase(),i=0,o=0;
for(const c of s){if(c=='(')o++;else if(c==')')o--}if(o>0)s+=')'.repeat(o);
const E=m=>{throw m};
function expr(){let v=term();while(s[i]=='+'||s[i]=='-'){const c=s[i++],r=term();v=c=='+'?v+r:v-r}return v}
function term(){let v=unary();for(;;){const c=s[i];if(c=='*'||c=='/'){i++;const r=unary();if(c=='/'&&r===0)E('Cannot divide by zero');v=c=='*'?v*r:v/r}else if(c&&(c=='('||/[a-z0-9.]/.test(c)))v*=unary();else break}return v}
function unary(){if(s[i]=='-'){i++;return-unary()}if(s[i]=='+'){i++;return unary()}return power()}
function power(){const b=post();if(s[i]=='^'){i++;const e=unary();const r=Math.pow(b,e);if(!isFinite(r))E('Math error');return r}return b}
function post(){let v=atom();for(;;){if(s[i]=='!'){i++;v=fact(v)}else if(s[i]=='%'){i++;v/=100}else break}return v}
function atom(){const c=s[i];if(c=='('){i++;const v=expr();if(s[i]!=')')E('Missing )');i++;return v}
let m=/^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/.exec(s.slice(i));if(m){i+=m[0].length;return parseFloat(m[0])}
m=/^[a-z]+/.exec(s.slice(i));if(m){const id=m[0];i+=id.length;if(id=='pi')return PI;if(id=='e')return Math.E;if(id=='ans')return ans;if(id=='mem')return mem;
const f=F[id];if(!f)E('Unknown word: '+id);const a=[];if(s[i]=='('){i++;if(s[i]!=')'){a.push(expr());while(s[i]==','){i++;a.push(expr())}}if(s[i]!=')')E('Missing )');i++}else a.push(power());
const r=f(...a);if(typeof r!=='number'||!isFinite(r))E('Math error');return r}
E(i>=s.length?'Expression is incomplete':'Unexpected “'+c+'”')}
const v=expr();if(i<s.length)E('Unexpected “'+s[i]+'”');return v}
function fmt(v){if(Math.abs(v)<1e-12)return'0';const a=Math.abs(v);if(a>=1e12||a<1e-6)return v.toExponential(8).replace(/\.?0+e/,'e').replace('e+','×10^').replace('e-','×10^−');return String(parseFloat(v.toPrecision(12)))}

const css=document.createElement('style');css.textContent=`.cwrap{max-width:430px;margin:0 auto}.cscr{background:linear-gradient(135deg,#052e2b,#0f766e);color:#fff;border-radius:24px;padding:14px 16px 12px;margin-bottom:12px;box-shadow:0 24px 50px -30px #052e2b}
.cscr input{width:100%;background:transparent;border:0;color:#fff;font:500 22px "Segoe UI",system-ui,sans-serif;padding:4px 0;outline:0;text-align:right}.cscr input::placeholder{color:#ffffff66}
#c-out{text-align:right;font:700 clamp(30px,9vw,42px)/1.2 Georgia,serif;min-height:1.2em;overflow-wrap:anywhere;color:#f5d9a0}#c-out.err{font:600 15px system-ui;color:#fecaca;padding:10px 0}
.cst{display:flex;gap:8px;font:600 12px system-ui;opacity:.85;min-height:16px}.cst span{background:#ffffff26;border-radius:99px;padding:2px 9px}
.cg{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.cg button{padding:13px 0;border-radius:14px;border:1px solid var(--ln);background:var(--sf);color:var(--tx);font:600 16px system-ui,sans-serif;cursor:pointer;transition:transform .08s}
.cg button:active{transform:scale(.94)}.cg .fn{background:var(--ac2);color:var(--ac);font-size:14px}.cg .op{background:var(--bg);color:var(--ac);font-size:20px}.cg .on{background:var(--ac);color:#fff}.cg .eq{background:linear-gradient(135deg,#0f766e,#14958a);color:#fff;border:0;font-size:22px}
.chs{max-height:180px;overflow:auto}.chs div{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid var(--ln);cursor:pointer;font-size:14px}.chs div:first-child{border-top:0}.chs b{color:var(--ac);white-space:nowrap}`;document.head.appendChild(css);
const K=()=>[['2nd','','fn'+(inv?' on':''),'inv'],[deg?'DEG':'RAD','','fn on','deg'],['M+','','fn','m+'],['M−','','fn','m-'],['MR','mem','fn'],
[inv?'sin⁻¹':'sin',inv?'asin(':'sin(','fn'],[inv?'cos⁻¹':'cos',inv?'acos(':'cos(','fn'],[inv?'tan⁻¹':'tan',inv?'atan(':'tan(','fn'],['(','(','op'],[')',')','op'],
[inv?'eˣ':'ln',inv?'exp(':'ln(','fn'],[inv?'10ˣ':'log',inv?'10^(':'log(','fn'],[inv?'∛':'√',inv?'cbrt(':'√(','fn'],[inv?'x³':'x²',inv?'^3':'^2','fn'],[inv?'nCr':'xʸ',inv?'ncr(':'^','fn'],
['7','7'],['8','8'],['9','9'],['⌫','','op','del'],['AC','','op','ac'],
['4','4'],['5','5'],['6','6'],['×','×','op'],['÷','÷','op'],
['1','1'],['2','2'],['3','3'],['+','+','op'],['−','−','op'],
['0','0'],['.','.'],['π','π','fn'],['e','e','fn'],['=','','eq','eq'],
['Ans','ans','fn'],['n!','!','fn'],['1/x','^(−1)','fn'],['%','%','fn'],['EE','e','fn']];
root.innerHTML=`<span class="eb">★ New · Calculator</span><h2>Scientific <em>calculator.</em></h2><p class="sub">Trigonometry in degrees or radians, logs, powers, roots, factorials, combinations and memory. Works offline, and you can type with your keyboard.</p>
<div class="cwrap"><div class="cscr"><div class="cst" id="c-st"></div><input id="c-in" inputmode="none" autocomplete="off" spellcheck="false" placeholder="0" aria-label="Expression"><div id="c-out"></div></div><div class="cg" id="c-g"></div>
<div class="card" style="margin-top:14px"><div class="row sp"><h3 style="margin:0">History</h3><span><button class="b g s" id="c-cp">Copy result</button> <button class="b g s" id="c-ch">Clear</button></span></div><div class="chs" id="c-h"></div></div></div>`;
const $=s=>root.querySelector(s),inp=$('#c-in'),out=$('#c-out');
function grid(){$('#c-g').innerHTML=K().map((k,i)=>`<button class="${k[2]||''}" data-i="${i}">${k[0]}</button>`).join('');$('#c-st').innerHTML=(deg?'<span>DEG</span>':'<span>RAD</span>')+(mem?'<span>M</span>':'')+(inv?'<span>2nd</span>':'')}
function hl(){$('#c-h').innerHTML=hist.length?hist.map((h,i)=>`<div data-h="${i}"><span>${h[0].replace(/</g,'&lt;')}</span><b>= ${h[1]}</b></div>`).join(''):'<p class="mu" style="margin:6px 0">Your calculations appear here. Tap one to reuse it.</p>'}
let cur=null;function prev(){out.classList.remove('err');cur=null;if(!inp.value.trim()){out.textContent='';return}try{cur=calc(inp.value);out.textContent='= '+fmt(cur)}catch(e){out.textContent=''}}
function ins(t){if(fresh){fresh=false;if(!/^[+\-×÷^%!−]/.test(t)&&t!=='^2'&&t!=='^3'&&!t.startsWith('^'))inp.value='';else if(!inp.value.startsWith('Ans'))inp.value='Ans'}const a=inp.selectionStart??inp.value.length,b=inp.selectionEnd??a;inp.value=inp.value.slice(0,a)+t+inp.value.slice(b);const p=a+t.length;try{inp.setSelectionRange(p,p)}catch(e){}prev()}
function eq(){if(!inp.value.trim())return;try{const v=calc(inp.value);ans=v;cur=v;hist.unshift([inp.value,fmt(v),v]);hist=hist.slice(0,25);try{localStorage.setItem('sn_calc',JSON.stringify(hist))}catch(e){}out.classList.remove('err');out.textContent=fmt(v);fresh=true;hl()}catch(e){out.classList.add('err');out.textContent=typeof e=='string'?e:'Check the expression'}}
function act(a){if(a=='inv'){inv=!inv;grid()}else if(a=='deg'){deg=!deg;grid();prev()}else if(a=='ac'){inp.value='';out.textContent='';fresh=false}else if(a=='del'){if(fresh){inp.value='';fresh=false}else{const p=inp.selectionStart??inp.value.length;if(p>0){inp.value=inp.value.slice(0,p-1)+inp.value.slice(inp.selectionEnd??p);try{inp.setSelectionRange(p-1,p-1)}catch(e){}}}prev()}else if(a=='eq')eq();
else if(a=='m+'||a=='m-'){try{const v=cur!=null?cur:calc(inp.value||'0');mem+=a=='m+'?v:-v;grid()}catch(e){}}}
$('#c-g').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const k=K()[+b.dataset.i];if(k[3])act(k[3]);else ins(k[1])});
inp.addEventListener('input',()=>{fresh=false;prev()});inp.addEventListener('keydown',e=>{if(e.key=='Enter'){e.preventDefault();eq()}});
$('#c-h').addEventListener('click',e=>{const d=e.target.closest('[data-h]');if(!d)return;const h=hist[+d.dataset.h];inp.value=h[0];fresh=false;prev()});
$('#c-ch').onclick=()=>{hist=[];try{localStorage.removeItem('sn_calc')}catch(e){}hl()};
$('#c-cp').onclick=()=>{const t=cur!=null?String(parseFloat(cur.toPrecision(12))):out.textContent.replace('= ','');if(t)navigator.clipboard?.writeText(t)};
grid();hl();
})();
