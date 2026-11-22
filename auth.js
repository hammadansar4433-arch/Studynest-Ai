(()=>{
const REQUIRED=true; // true = everyone must sign up or log in. false = they can skip and use the app without an account.
let user=null,mode='up',timer=0,pending=false;
const $=s=>document.querySelector(s),E=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const api=async(a,b)=>{const r=await fetch('/api/auth'+(b?'':'?a='+a),{method:b?'POST':'GET',headers:b?{'Content-Type':'application/json'}:{},body:b?JSON.stringify({a,...b}):undefined});return r.json()};
const css=document.createElement('style');css.textContent=`#au{position:fixed;inset:0;z-index:60;display:flex;padding:max(20px,env(safe-area-inset-top)) 16px 30px;overflow:auto;background:radial-gradient(700px 420px at 90% -5%,color-mix(in srgb,var(--ac) 25%,transparent),transparent),radial-gradient(600px 400px at -10% 100%,color-mix(in srgb,var(--gold) 18%,transparent),transparent),var(--bg)}#au[hidden]{display:none}
#au .wc{width:100%;max-width:430px;margin:auto}#au h2{margin:6px 0 4px;text-align:center}#au .tabs{justify-content:center;margin:14px 0}#au input{width:100%;margin-bottom:10px;padding:13px 14px}#au .b{width:100%;padding:13px;margin-top:4px}
#au .er{color:var(--wr);font-size:14px;min-height:20px;margin:4px 0}#au .nt{font-size:12px;color:var(--mu);margin-top:12px;text-align:center}#au .pw{position:relative}#au .pw button{position:absolute;right:6px;top:6px;width:auto;margin:0;padding:7px 11px;font-size:12px}
header .au{display:flex;gap:6px;flex:none}@media(max-width:759px){header{flex-wrap:wrap;gap:8px;padding:8px 10px}header .b.s{padding:6px 10px}}`;document.head.appendChild(css);
const ov=document.createElement('div');ov.id='au';ov.hidden=true;document.body.appendChild(ov);
function head(){const h=$('#au-h');if(!h)return;h.innerHTML=user?`<button class="b g s" data-au="acct">👤 ${E((user.name||user.email.split('@')[0]).slice(0,14))}</button>`:`<button class="b g s" data-au="in">Log in</button><button class="b s" data-au="up">Sign up</button>`}
function show(m){mode=m;ov.hidden=false;document.body.style.overflow='hidden';
if(m=='acct'){ov.innerHTML=`<div class="wc"><h2>Your <em>account</em></h2><p class="sub" style="margin:0 auto 14px">${E(user.email)}</p><p class="mu" style="text-align:center">Your tasks, progress and settings are saved to this account and follow you to any device.</p>
<button class="b" data-au="close">Back to StudyNest</button><button class="b g" data-au="out">Log out</button><button class="b g" data-au="del" style="color:var(--wr)">Delete my account</button><div class="er" id="au-er"></div></div>`;return}
const up=m=='up';ov.innerHTML=`<div class="wc"><div class="wart" style="margin:0 auto 6px">🎓</div><h2>${up?'Create your <em>account</em>':'Welcome <em>back</em>'}</h2><p class="sub" style="margin:0 auto">${up?'Sign up with your email to save your progress and open it on any device.':'Log in to get your saved progress.'}</p>
<div class="tabs"><button class="b s ${up?'':'g'}" data-au="up" style="width:auto">Sign up</button><button class="b s ${up?'g':''}" data-au="in" style="width:auto">Log in</button></div>
<input id="au-e" type="email" placeholder="Email address" autocomplete="email" inputmode="email"><div class="pw"><input id="au-p" type="password" placeholder="${up?'Password (8+ characters)':'Password'}" autocomplete="${up?'new-password':'current-password'}"><button class="b g s" type="button" data-au="eye">Show</button></div>
<div class="er" id="au-er"></div><button class="b" id="au-go" data-au="go">${up?'Create account':'Log in'}</button>${REQUIRED?'':'<button class="b g" data-au="close">Continue without an account</button>'}
<p class="nt">${up?'We store your email and planner data so it can sync between devices. Your password is stored scrambled (hashed), never as text.':''}</p></div>`;
setTimeout(()=>{const e=$('#au-e');if(e)e.focus()},50)}
function hide(){ov.hidden=true;document.body.style.overflow=''}
const msg=t=>{const e=$('#au-er');if(e)e.textContent=t||''};
async function go(){const email=$('#au-e').value.trim(),password=$('#au-p').value;if(!email||!password)return msg('Enter your email and password.');const b=$('#au-go');b.disabled=true;b.textContent='Please wait…';msg('');
try{const r=await api(mode=='up'?'signup':'login',{email,password,name:typeof S!=='undefined'?S.name:''});if(r.user){user=r.user;localStorage.setItem('sn_user',user.email);head();hide();await pull()}else{msg(r.msg||'Could not continue. Try again.');b.disabled=false;b.textContent=mode=='up'?'Create account':'Log in'}}
catch(e){msg('No internet connection. Please try again.');b.disabled=false;b.textContent=mode=='up'?'Create account':'Log in'}}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),hasLocal=()=>S.setup||(S.tasks&&S.tasks.length)||Object.keys(S.log||{}).length;
async function push(){pending=false;try{await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({a:'save',data:S}),keepalive:true})}catch(e){}}
window.cloudSave=()=>{if(!user)return;pending=true;clearTimeout(timer);timer=setTimeout(push,2500)};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&pending&&user)push()});
async function pull(){try{const r=await api('load',{}),d=r.data;
if(d&&Object.keys(d).length){if(same(d,S))return;if(!hasLocal()||confirm('Use the progress saved in your account on this device?\n\nOK = use my account data\nCancel = keep this device’s data and replace the account data')){Object.keys(S).forEach(k=>delete S[k]);Object.assign(S,DEF,d);save();$('#wz').hidden=true;renderAll();theme()}else push()}
else if(hasLocal())push()}catch(e){}}
ov.addEventListener('click',async e=>{const b=e.target.closest('[data-au]');if(!b)return;const a=b.dataset.au;
if(a=='up'||a=='in')show(a);else if(a=='go')go();else if(a=='close'){if(!REQUIRED||user)hide()}else if(a=='eye'){const p=$('#au-p');p.type=p.type=='password'?'text':'password';b.textContent=p.type=='password'?'Show':'Hide'}
else if(a=='out'){if(confirm('Log out? Your progress stays saved in your account.')){if(pending)await push();await api('logout',{});localStorage.removeItem('sn_user');localStorage.removeItem('studynest2');location.reload()}}
else if(a=='del'){if(confirm('Delete your account and all saved progress? This cannot be undone.')){await api('delete',{});localStorage.removeItem('sn_user');localStorage.removeItem('studynest2');location.reload()}}});
ov.addEventListener('keydown',e=>{if(e.key=='Enter'&&(mode=='up'||mode=='in'))go()});
document.addEventListener('click',e=>{const b=e.target.closest('header [data-au]');if(b)show(b.dataset.au)});
(async()=>{let r=null;try{r=await api('me')}catch(e){}
if(r&&r.error==='not_configured'){const h=$('#au-h');if(h)h.remove();return}
if(r&&r.user){user=r.user;localStorage.setItem('sn_user',user.email);head();pull()}
else if(!r&&localStorage.getItem('sn_user')){user={email:localStorage.getItem('sn_user')};head()}
else{head();if(REQUIRED)show('up')}})();
})();
