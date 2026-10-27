(function(){
var SESSIONS=[
 {k:'w1t1',w:1,type:'t1',label:'Próf 1 · Hámarkspúls',short:'Próf 1',cls:'t'},
 {k:'w1t2',w:1,type:'t2',label:'Próf 2 · 3 × 10 mín kaloríur',short:'Próf 2',cls:'t'},
 {k:'w2tue',w:2,type:'tue',label:'Þriðjudagur',short:'Þri',cls:'h'},
 {k:'w2thu',w:2,type:'thu',label:'Fimmtudagur',short:'Fim',cls:'l'},
 {k:'w3tue',w:3,type:'tue',label:'Þriðjudagur',short:'Þri',cls:'h'},
 {k:'w3thu',w:3,type:'thu',label:'Fimmtudagur',short:'Fim',cls:'l'},
 {k:'w4tue',w:4,type:'tue',label:'Þriðjudagur',short:'Þri',cls:'h'},
 {k:'w4thu',w:4,type:'thu',label:'Fimmtudagur',short:'Fim',cls:'l'},
 {k:'w5t1',w:5,type:'t1',label:'Próf 1 · Hámarkspúls',short:'Próf 1',cls:'t'},
 {k:'w5t2',w:5,type:'t2',label:'Próf 2 · 3 × 10 mín kaloríur',short:'Próf 2',cls:'t'}
];
var HOME=[1,2,3,4].map(function(w){return{k:'w'+w+'h',w:w,type:'home',label:'Heimaæfing · valfrjálst',short:'Heima',cls:'l',tip:['30 mín','30–40 mín','35–45 mín','20–30 mín'][w-1]}});
function selfList(){var o=[];SESSIONS.forEach(function(s){o.push(s);if(s.type==='thu'||s.k==='w1t2'){var h=HOME.filter(function(q){return q.w===s.w})[0];if(h)o.push(h)}});return o}
function homeMins(x){return HOME.reduce(function(t,h){return t+((x[h.k]&&x[h.k].mins)||0)},0)}
function homeCard(x){
 var done=HOME.filter(function(h){return x[h.k]});if(!done.length)return'';
 var html='<section class="card home"><h3>Heimaæfingar</h3><p class="desc">Rólegar aukaæfingar í zone 2 (60–70%) sem byggja grunnþolið. '+done.length+' af 4 skráðar, samtals '+homeMins(x)+' mín.</p><div class="home-list">';
 HOME.forEach(function(h){var v=x[h.k];html+='<div class="home-row'+(v?' on':'')+'"><b>Vika '+h.w+'</b><span>'+(v?(v.mins!=null?v.mins+' mín':'✓')+(v.avg!=null?' · meðalpúls '+v.avg:'')+(v.what?' · '+esc(v.what):''):'<i>Ekki skráð</i>')+'</span></div>'});
 return html+'</div></section>';
}
var MACHINES=[['bike','BikeErg'],['row','Róðravél'],['assault','Assault-hjól']];
var DEVICES=[['bike','BikeErg'],['row','RowErg'],['assault','Assault Bike'],['ski','SkiErg'],['tread','Hlaupabretti'],['other','Annað þoltæki']];
var CFG=window.FIREBASE_CONFIG||null;
var COACH_EMAILS=(window.COACH_EMAILS||[]).map(function(e){return String(e).trim().toLowerCase()});
var state={project:'Þolþjálfun',athletes:[]};
var data={};
var app=document.getElementById('app');
var plan={g1:{},g2:{},g3:{},g4:{},week:{}},planFrom='g1',planDraft={},planGroup='g1',confirmCopy=false,share={open:false,fmt:'story',bg:'dark',file:null,busy:false},pwLoginErr='',showPw=false,pwErr='',pwMsg='',team=null,teamDoc=null,regroups={},newGroup='1',canEdit=false,saving=false,draft={},auth=null,loginErr='',booting=true,setupErr='',busy='',confirmDel=null,newNames='',renames={},copied=null;
var ui={view:'athlete',sel:null,filter:'all',pick:null,coachSession:'w1t1',egroup:'1',tgroup:'all',selfSession:null};
try{var saved=JSON.parse(sessionStorage.getItem('tt-ui')||'null');if(saved){ui.view=saved.view||ui.view;ui.coachSession=saved.coachSession||ui.coachSession;if(saved.sel)ui.sel=saved.sel;if(saved.agroup)ui.agroup=saved.agroup;}}catch(e){}
var db=null,fauth=null;
var GROUPS=[{id:1,name:'Hópur 1 · á staðnum',remote:false,short:'H1'},{id:2,name:'Hópur 2 · fjarþjálfun',remote:true,short:'F1'},{id:3,name:'Hópur 3 · framhald',remote:false,short:'H2'},{id:4,name:'Hópur 4 · framhald fjarþjálfun',remote:true,short:'F2'}];
var GTABS=[1,3,2,4];
function gshort(g){return GROUPS[gid(g)-1].short}
function gid(v){v=Number(v);return v>=1&&v<=4?v:1}
function isRemote(g){return gid(g)===2||gid(g)===4}
function groupOpts(sel,extra){var h='';GROUPS.forEach(function(g){h+='<option value="'+g.id+'"'+(String(sel)===String(g.id)?' selected':'')+'>'+(extra?'Í hóp '+g.id+g.name.slice(7):g.name)+'</option>'});return h}
var CODE_RE=/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;
function normCode(v){v=String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'');return v.length===8?v.slice(0,4)+'-'+v.slice(4):v}
function newCode(){var A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',b=new Uint32Array(8);crypto.getRandomValues(b);var c='';for(var i=0;i<8;i++){c+=A[b[i]%A.length];if(i===3)c+='-'}return c}
function sortAthletes(){state.athletes.sort(function(a,b){return(a.order||0)-(b.order||0)||String(a.name).localeCompare(String(b.name),'is')})}
function linkFor(code){return location.origin+location.pathname+'#'+code}
function fail(e){busy='';saving=false;render();toast('Ekki tókst að vista ('+((e&&e.code)||'villa')+'). Athugaðu netsambandið og reyndu aftur.')}

function boot(){
 var placeholder=!CFG||!CFG.apiKey||/SETTU|YOUR/i.test(CFG.apiKey);
 if(placeholder||!window.firebase){setupErr=!window.firebase?'Firebase-forritasafnið hlóðst ekki. Athugaðu netsambandið.':'Það á eftir að setja Firebase-stillingarnar inn í skrána <code>firebase-config.js</code>. Sjá leiðbeiningar í README.md.';booting=false;render();return}
 firebase.initializeApp(CFG);db=firebase.firestore();fauth=firebase.auth();
 db.collection('meta').doc('project').get().then(function(d){if(d.exists&&d.data().title){state.project=d.data().title;render()}}).catch(function(){});
 fauth.onAuthStateChanged(function(user){if(user)loadCoach(user);else if(!auth||auth.who==='coach'){auth=null;canEdit=false;tryStoredCode()}});
}
function isCoachEmail(u){return!!(u&&u.email&&COACH_EMAILS.indexOf(u.email.toLowerCase())>=0)}
function loadCoach(user){
 if(!isCoachEmail(user)){loginErr='Google-aðgangurinn '+user.email+' er ekki skráður sem þjálfari.';fauth.signOut();booting=false;render();return}
 busy='load';render();
 db.collection('athletes').get().then(function(snap){
  state.athletes=[];data={};
  snap.forEach(function(d){var v=d.data();state.athletes.push({id:d.id,name:v.name||'Iðkandi',order:v.order||0,group:gid(v.group)});data[d.id]=v.data||{}});
  sortAthletes();
  auth={who:'coach',email:user.email};canEdit=true;booting=false;busy='';loginErr='';pushTeam();loadPlan();
  if(!ui.sel||!byId(ui.sel))ui.sel=state.athletes.length?state.athletes[0].id:null;
  if(!state.athletes.length)ui.view='coach';
  if(location.hash==='#team')ui.view='team';
  render();
 }).catch(function(e){booting=false;busy='';auth=null;canEdit=false;loginErr='Gat ekki sótt gögnin ('+(e.code||e.message)+'). Athugaðu að netfangið þitt sé eins í firebase-config.js og í reglunum í Firebase.';fauth.signOut();render()});
}
function storedCode(){try{return localStorage.getItem('tt-code')}catch(e){return null}}
function hashCode(){var c=normCode(decodeURIComponent(location.hash.replace('#','')));return CODE_RE.test(c)?c:null}
function tryStoredCode(){var c=hashCode()||storedCode();if(c)openCode(c,true);else{booting=false;render()}}
function openCode(code,remember){
 code=normCode(code);
 if(!CODE_RE.test(code)){loginErr='Kóðinn er 8 stafir, t.d. K7PQ-4MXA.';booting=false;render();return}
 busy='code';render();
 db.collection('athletes').doc(code).get().then(function(d){busy='';booting=false;
  if(!d.exists){loginErr='Þessi kóði fannst ekki. Athugaðu hann eða talaðu við þjálfarann.';try{if(storedCode()===code)localStorage.removeItem('tt-code')}catch(e){}render();return}
  var v=d.data();state.athletes=[{id:code,name:v.name||'Iðkandi',group:gid(v.group)}];data={};data[code]=v.data||{};
  auth={who:code};canEdit=false;ui.view='week';ui.sel=code;loginErr='';team=null;
  loadPlan();teamDoc=null;db.collection('meta').doc('team').get().then(function(t){if(t.exists){teamDoc=t.data();if(auth&&!canEdit)render()}}).catch(function(){});
  if(remember){try{localStorage.setItem('tt-code',code)}catch(e){}}
  render();
 }).catch(function(){busy='';booting=false;loginErr='Ekki tókst að tengjast. Athugaðu netsambandið og reyndu aftur.';render()});
}
function pwLogin(){
 var em=document.getElementById('pw-email').value.trim(),pw=document.getElementById('pw-pass').value;
 if(!em||!pw){pwLoginErr='Skrifaðu netfang og lykilorð.';render();return}
 busy='code';pwLoginErr='';loginErr='';render();
 fauth.signInWithEmailAndPassword(em,pw).then(function(){busy=''}).catch(function(e){busy='';
  var c=e&&e.code;
  pwLoginErr=(c==='auth/invalid-credential'||c==='auth/wrong-password'||c==='auth/user-not-found'||c==='auth/invalid-login-credentials')?'Rangt netfang eða lykilorð. Ef þú hefur ekki sett lykilorð enn, gerðu það fyrst í tölvunni (Skrá niðurstöður → Innskráning í síma og iPad).':c==='auth/operation-not-allowed'?'Það á eftir að kveikja á Email/Password í Firebase (Authentication → Sign-in method).':c==='auth/too-many-requests'?'Of margar tilraunir. Bíddu í smá stund og reyndu aftur.':'Innskráning tókst ekki ('+c+').';
  render()});
}
function setPassword(){
 var a=document.getElementById('np1').value,b=document.getElementById('np2').value,u=fauth&&fauth.currentUser;
 pwErr='';pwMsg='';
 if(!u){return}
 if(a.length<8){pwErr='Lykilorðið þarf að vera minnst 8 stafir.';render();return}
 if(a!==b){pwErr='Lykilorðin eru ekki eins.';render();return}
 var has=(u.providerData||[]).some(function(p){return p.providerId==='password'});
 busy='save';render();
 var job=has?u.updatePassword(a):u.linkWithCredential(firebase.auth.EmailAuthProvider.credential(u.email,a));
 job.then(function(){busy='';pwMsg='Lykilorð vistað. Nú geturðu skráð þig inn í síma með '+u.email+' og þessu lykilorði.';render()}).catch(function(e){busy='';var c=e&&e.code;
  pwErr=c==='auth/requires-recent-login'?'Af öryggisástæðum: skráðu þig út og inn aftur með Google, og reyndu svo aftur.':c==='auth/operation-not-allowed'?'Kveiktu fyrst á Email/Password í Firebase: Authentication → Sign-in method → Add new provider → Email/Password → Enable.':c==='auth/weak-password'?'Lykilorðið er of veikt. Notaðu lengra lykilorð.':'Tókst ekki ('+c+').';render()});
}
function coachLogin(){
 var pr=new firebase.auth.GoogleAuthProvider();pr.setCustomParameters({prompt:'select_account'});
 fauth.signInWithPopup(pr).catch(function(e){
  if(e.code==='auth/popup-closed-by-user'||e.code==='auth/cancelled-popup-request')return;
  if(e.code==='auth/popup-blocked'||e.code==='auth/operation-not-supported-in-this-environment'){fauth.signInWithRedirect(pr);return}
  loginErr=e.code==='auth/unauthorized-domain'?'Þetta vefsvæði er ekki leyft í Firebase. Bættu því við undir Authentication → Settings → Authorized domains.':'Innskráning tókst ekki ('+e.code+').';render()});
}
function logout(){
 if(canEdit&&fauth)fauth.signOut();
 try{localStorage.removeItem('tt-code')}catch(e){}
 auth=null;canEdit=false;state.athletes=[];data={};draft={};loginErr='';team=null;ui.view='athlete';ui.selfSession=null;teamDoc=null;planDraft={};
 if(hashCode())history.replaceState(null,'',location.pathname);
 render();window.scrollTo(0,0);
}

function byId(id){for(var i=0;i<state.athletes.length;i++)if(state.athletes[i].id===id)return state.athletes[i];return null}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function makeExample(){
 var r=rng(7),d={};
 state.athletes.forEach(function(a){
  function R(lo,hi){return Math.round(lo+r()*(hi-lo))}
  var hm=R(176,198),m1=R(7,13),m5=m1+R(0,3),as=R(75,120),ro=R(150,190),bi=R(160,210),g=1+R(3,12)/100,x={};
  x.w1t1={max:hm-R(0,3),min:m1,rpm:rpmFor(m1),kcal:R(160,260)};
  x.w5t1={max:hm-R(0,2),min:m5,rpm:rpmFor(m5),kcal:R(180,290)};
  var st=R(112,126);x.w1t1.stages=curve(st,x.w1t1.max,m1);x.w5t1.stages=curve(st-R(3,8),x.w5t1.max,m5);
  x.w1t2={avg:R(148,165),max:hm-R(4,10),kcal:R(520,700),assault:as,row:ro,bike:bi};
  x.w5t2={avg:R(146,164),max:hm-R(4,10),kcal:R(540,730),assault:Math.round(as*g),row:Math.round(ro*(g-.02)),bike:Math.round(bi*(g+.01))};
  [2,3,4].forEach(function(w,j){
   if(r()>.1){x['w'+w+'tue']={avg:R(160,172),max:hm-R(2,9),kcal:R(380,520)};addZones(x['w'+w+'tue'],R(45,55),[R(10,18),R(10,18),R(20,28),R(30,38),R(5,12)])}
   if(r()>.1){x['w'+w+'thu']={avg:R(146,154)-j*R(1,3),max:R(160,170)-j*2,kcal:R(480,680)};addZones(x['w'+w+'thu'],R(55,65),[R(10,18),R(35,45),R(30,38),R(5,12),0])}
  });
  d[a.id]=x;
 });
 return d;
}
function fmtTime(s){if(s==null)return'—';var neg=s<0;s=Math.abs(Math.round(s));return(neg?'−':'')+Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function parseTime(v){v=String(v||'').trim();if(!v)return null;var h3=v.match(/^(\d+)[:.](\d{1,2})[:.](\d{1,2})$/);if(h3)return(+h3[1])*3600+(+h3[2])*60+(+h3[3]);var m=v.match(/^(\d+)[:.,](\d{1,2})$/);if(m)return(+m[1])*60+(+m[2]);if(/^\d+$/.test(v))return(+v)*60;return NaN}
function curve(start,end,n){var o=[];for(var i=0;i<n;i++){var f=n>1?i/(n-1):1;o.push(Math.round(start+(end-start)*Math.pow(f,.8)))}return o}
function addZones(v,mins,w){var sum=w.reduce(function(a,b){return a+b},0);for(var i=0;i<5;i++)v['z'+(i+1)]=Math.round(mins*60*w[i]/sum)}
var ZK=['z1','z2','z3','z4','z5'];
function hasZones(v){return!!v&&ZK.some(function(k){return v[k]!=null})}
function zoneSecs(v){return ZK.reduce(function(a,k){return a+(v[k]||0)},0)}
function fmtMinS(sec){return Math.round(sec/60)+' mín'}
function zoneBar(v,big){var tot=zoneSecs(v);if(!tot)return'';var h='<div class="zbar'+(big?' big':'')+'" role="img" aria-label="Tími í svæðum: '+ZK.map(function(k,i){return'svæði '+(i+1)+' '+Math.round((v[k]||0)/60)+' mín'}).join(', ')+'">';
 ZK.forEach(function(k,i){var sec=v[k]||0;if(!sec)return;var pc=sec/tot*100;h+='<i class="zc'+(i+1)+'" style="width:'+pc+'%">'+(pc>=11?'<span>'+Math.round(pc)+'%</span>':'')+'</i>'});
 return h+'</div>'}
var NSTEPS=20;
function rowStages(cur,dr){var arr=[];for(var i=0;i<NSTEPS;i++){var k='s'+(i+1),v;
  if(dr&&dr[k]!=null){var t=String(dr[k]).trim();v=t===''?null:Number(t)}else v=cur&&cur.stages&&cur.stages[i]!=null?cur.stages[i]:null;arr.push(v)}
 while(arr.length&&arr[arr.length-1]==null)arr.pop();return arr}
function nn(arr){return arr.filter(function(v){return v!=null&&!isNaN(v)})}
function doneText(arr){return arr.length?arr.length+' mín · '+rpmFor(arr.length)+' rpm':'—'}
function rpmFor(m){return m<=6?50+2*(m-1):60+(m-6)}
function t1rpm(v){return v&&v.min!=null?(v.rpm!=null?v.rpm:rpmFor(v.min)):null}
function tspeed(m){return(8+0.5*(m-1)).toFixed(1).replace('.',',')}
function t1lab(v){if(!v||v.min==null)return'';return v.dev==='tread'?tspeed(v.min)+' km/klst':t1rpm(v)+' rpm'}
function devName(k){var d=DEVICES.filter(function(q){return q[0]===k})[0];return d?d[1]:'Tæki'}
function pct(a,b){return a!=null&&b!=null&&a>0?Math.round((b-a)/a*1000)/10:null}
function fmtPct(v){return sign(v,function(q){return String(Math.round(q*10)/10).replace('.',',')+'%'})}
function fmtMin(n){return(Math.round(n*10)/10)+' mín'}
function total(s){if(!s)return null;if(s.parts&&s.parts.length){var pt=0,pa=false;s.parts.forEach(function(q){if(q&&q.c!=null){pa=true;pt+=q.c}});return pa?pt:null}var any=false,t=0;MACHINES.forEach(function(m){if(s[m[0]]!=null){any=true;t+=s[m[0]]}});return any?t:null}
function sign(n,fmt){if(n==null)return'—';var str=fmt?fmt(Math.abs(n)):Math.abs(n);return(n>0?'+':n<0?'−':'±')+str}
function cls(n,goodUp){if(!n)return'';return(n>0)===(goodUp!==false)?'up':'down'}
function hrMax(x){if(x&&x.hrmax)return x.hrmax;var m=0;SESSIONS.forEach(function(s){if(x[s.k]&&x[s.k].max>m)m=x[s.k].max});return m||null}
function testMax(x){var m=0;SESSIONS.forEach(function(s){if(x[s.k]&&x[s.k].max>m)m=x[s.k].max});return m||null}
function countDone(x){return SESSIONS.filter(function(s){return x[s.k]}).length}
function persistUi(){try{sessionStorage.setItem('tt-ui',JSON.stringify({view:ui.view,coachSession:ui.coachSession,sel:ui.sel,agroup:ui.agroup}))}catch(e){}}

function render(){
 if(share.open&&!auth)closeShare();
 var me=auth&&!canEdit?byId(auth.who):null,selfOK=!!(me&&isRemote(me.group));
 var tabs=canEdit?[['athlete','Iðkendur'],['team','Hóparnir'],['plan','Æfingaplan'],['coach','Skrá niðurstöður']]:auth?[['week','Vikan'],['hr','Púlstafla'],['athlete','Árangur'],['log','Æfingar']].concat(selfOK?[['self','Skrá<span class="t-wide"> æfingu</span>']]:[]):[];
 if(auth&&!canEdit){ui.sel=auth.who;if(!(ui.view==='week'||ui.view==='hr'||ui.view==='log'||ui.view==='athlete'||(ui.view==='self'&&selfOK)))ui.view='week'}
 if(canEdit&&/^(self|week|hr|log)$/.test(ui.view))ui.view='athlete';
 var html='<header class="top"><svg class="ecg" viewBox="0 0 520 70" preserveAspectRatio="none" aria-hidden="true"><polyline fill="none" stroke="var(--pulse)" stroke-width="2.5" stroke-linejoin="round" points="0,44 90,44 104,44 112,30 120,44 150,44 160,58 172,6 184,64 194,44 236,44 250,36 262,44 330,44 340,58 352,6 364,64 374,44 416,44 430,36 442,44 520,44"/></svg><div class="wrap"><div class="toprow"><div class="brand"><img class="brand-logo" src="logo-box800-white.png" alt="BOX800" width="533" height="309"><span class="eyebrow">Þjálfunarlota · 5 vikur</span></div>'+(auth?'<button class="logout" data-act="logout">'+(canEdit?'Þjálfari':esc(byId(auth.who).name))+' · Skrá út</button>':'')+'</div><h1>'+esc(state.project)+'</h1><nav class="tabs'+(tabs.length>=5?' many':'')+'" role="tablist">';
 tabs.forEach(function(t){html+='<button class="tab" role="tab" data-act="view" data-v="'+t[0]+'" aria-selected="'+(ui.view===t[0])+'">'+t[1]+'</button>'});
 html+='</nav></div></header><main class="wrap">';
 if(setupErr){app.innerHTML=html+'<section class="card login"><h3>Vantar uppsetningu</h3><p class="desc">'+setupErr+'</p></section></main>';return}
 if(booting||busy==='load'){app.innerHTML=html+'<div class="loading">Hleð…</div></main>';return}
 if(!auth){app.innerHTML=html+loginView()+'</main>';return}
 if(ui.view==='athlete')html+=athleteView();
 else if(ui.view==='team')html+=teamView();
 else if(ui.view==='self')html+=selfView();
 else if(ui.view==='week')html+=weekView();
 else if(ui.view==='hr')html+=hrView();
 else if(ui.view==='log')html+=logView();
 else if(ui.view==='plan'&&canEdit)html+=planView();
 else html+=coachView();
 html+='</main>';
 app.innerHTML=html;
 if(ui.view==='athlete'||ui.view==='log')drawChart();
 if(share.open&&(ui.view!=='athlete'||!auth))closeShare();
}

function athleteView(){
 if(!state.athletes.length)return'<section class="card"><h3>Engir iðkendur enn</h3><p class="desc">Bættu iðkendum við undir Skrá niðurstöður.</p></section>';
 var a=byId(ui.sel)||state.athletes[0],x=data[a.id]||{};
 team=teamFor(a);
 var html='';
 if(canEdit){var ag=ui.agroup||gid(a.group);
 html+='<div class="gtabs" role="tablist" aria-label="Veldu hóp">';
 GTABS.forEach(function(g){var n=inGroup(g).length;html+='<button class="gtab'+(GROUPS[g-1].remote?' remote':'')+'" role="tab" data-act="agroup" data-g="'+g+'" aria-selected="'+(g===ag)+'" title="'+esc(GROUPS[g-1].name)+'">'+GROUPS[g-1].short+' <small>'+n+'</small></button>'});
 html+='</div><div class="gtab-name">'+esc(GROUPS[ag-1].name)+'</div>';
 var gl=inGroup(ag);
 if(!gl.length)html+='<p class="desc">Engir iðkendur í þessum hópi.</p>';
 else{html+='<div class="chips" role="group" aria-label="Veldu iðkanda">';
 gl.forEach(function(b){html+='<button class="chip'+(isRemote(b.group)?' remote':'')+'" data-act="sel" data-id="'+b.id+'" aria-pressed="'+(b.id===a.id)+'">'+esc(b.name)+'</button>'});
 html+='</div>';}
 if(gid(a.group)!==ag){if(gl.length){a=gl[0];x=data[a.id]||{};ui.sel=a.id;team=teamFor(a)}else return html;}}
 var t1a=x.w1t1&&x.w1t1.min,t1b=x.w5t1&&x.w5t1.min,c1=total(x.w1t2),c5=total(x.w5t2);
 var d1=(t1a!=null&&t1b!=null)?t1b-t1a:null,d2=(c1!=null&&c5!=null)?c5-c1:null;
 html+=canEdit?weekCard(a)+hrCard(x,a)+guideCard(x,a):'';
 html+='<section class="hero"><div><h2>'+esc(a.name)+'</h2><div class="sub">Próf í viku 1 borin saman við endurpróf í viku 5, auk allra æfinga þar á milli.</div></div><div class="stats">';
 html+=stat('Próf 1 · mínútur',d1!=null?'<span class="'+cls(d1)+'">'+sign(d1,fmtMin)+'</span>':(t1a!=null?'Mín '+t1a:'—'),t1a!=null?('Mín '+t1a+' · '+t1lab(x.w1t1)+(t1b!=null?' → mín '+t1b+' · '+t1lab(x.w5t1):' · endurpróf í viku 5')):'Ekki prófað enn');
 html+=stat('Próf 2 · samtals kal',d2!=null?'<span class="'+cls(d2)+'">'+sign(d2)+'</span>':(c1!=null?c1:'—'),c1!=null?(c1+(c5!=null?' → '+c5:' · endurpróf í viku 5')):'Ekki prófað enn');
 html+=stat('Æfingar kláraðar',countDone(x)+'<span style="font-size:.55em;color:var(--muted)"> / 10</span>','Próf og æfingar');
 html+='</div></section>'+formCard(x)+shareBar(x)+vsCard(x)+'<div class="grid2">'+test1Card(x)+test2Card(x)+'</div>'+(canEdit?thuCard(x)+sessionsCard(x)+homeCard(x):'');
 return html;
}
function weekView(){
 var a=byId(auth.who);if(!a)return'';var wc=weekCard(a);
 return installCard()+(wc||'<section class="card"><h3>Æfingar vikunnar</h3><p class="desc">Þjálfarinn hefur ekki birt æfingar vikunnar enn.</p></section>');
}
function hrView(){var a=byId(auth.who);if(!a)return'';var x=data[a.id]||{};return hrCard(x,a)+guideCard(x,a)}
function logView(){var a=byId(auth.who);if(!a)return'';var x=data[a.id]||{};team=teamFor(a);return thuCard(x)+sessionsCard(x)+homeCard(x)}
function installCard(){
 var st=false;try{st=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){}
 if(st||canEdit)return'';var dis=false;try{dis=localStorage.getItem('tt-install')==='0'}catch(e){}if(dis)return'';
 var ua=navigator.userAgent||'',ios=/iPhone|iPad|iPod/.test(ua)||(/Macintosh/.test(ua)&&'ontouchend' in document),android=/Android/.test(ua);
 if(!ios&&!android)return'';
 var how=ios?(/CriOS|FxiOS|EdgiOS/.test(ua)?'Ýttu á <b>Deila</b> táknið <b>efst til hægri</b> í vefslóðarstikunni (ferningur með ör upp), skrunaðu niður og veldu <b>Bæta á heimaskjá</b>.':'Ýttu á <b>Deila</b> táknið neðst (ferningur með ör upp) og veldu <b>Bæta á heimaskjá</b> (Add to Home Screen).'):'Ýttu á <b>⋮</b> efst í Chrome og veldu <b>Setja upp forrit</b> eða <b>Bæta á heimaskjá</b>.';
 return'<section class="install"><div><b>Settu Þolþjálfun á heimaskjáinn</b><span>'+how+' Þá opnast síðan eins og app.</span></div><button class="btn ghost sm" data-act="install-x" aria-label="Loka">Loka</button></section>';
}
function hrCard(x,a){
 var hm=hrMax(x),tm=testMax(x),own=x.hrmax||null,mine=canEdit||(auth&&a&&auth.who===a.id);
 var html='<section class="card hrtab"><h3>Púlstaflan þín</h3>';
 var form=mine?'<div class="hr-form"><label class="f" for="hr-in">'+(own?'Hámarkspúlsinn þinn':'Hver er hámarkspúlsinn þinn núna?')+'<span class="fhint">Hæsti púls sem þú veist um, t.d. úr úrinu eða fyrra prófi. Má breyta hvenær sem er.</span><input id="hr-in" inputmode="numeric" maxlength="3" placeholder="t.d. 188" value="'+(own||'')+'"></label><button class="btn" data-act="hr-save"'+(saving?' disabled':'')+'>Vista</button></div>':'';
 if(!hm)return html+'<p class="desc">Hér sérðu hvaða púls (slög á mínútu) passar við hverja prósentu í æfingunum. Skráðu hámarkspúlsinn þinn hér fyrir neðan til að fá töfluna.</p>'+form+'</section>';
 var bands=[[60,65,'z-easy'],[65,70,'z-easy'],[70,75,'z-mid'],[75,80,'z-mid'],[80,85,'z-tempo'],[85,90,'z-tempo'],[90,null,'z-hot']];
 var src=own?'hámarkspúlsinn sem þú skráðir':'hæsta púls sem hefur verið skráður á prófi eða æfingu';
 html+='<p class="desc">Miðað við '+src+', <b class="num">'+hm+' bpm</b>. Notaðu töfluna þegar úrið sýnir bara slög en ekki %.</p><div class="hr-rows">';
 bands.forEach(function(b){var lo=Math.round(hm*b[0]/100),hi=b[1]?Math.round(hm*b[1]/100):null;
  html+='<div class="hr-row '+b[2]+'"><span class="hr-p num">'+b[0]+(b[1]?'–'+b[1]+'%':'%+')+'</span><span class="hr-b num">'+(hi?lo+'–'+hi:lo+'+')+' <small>bpm</small></span></div>'});
 html+='</div><div class="hr-row z-two"><span class="hr-p">Zone 2 <small>· 60–70%</small></span><span class="hr-b num">'+Math.round(hm*.6)+'–'+Math.round(hm*.7)+' <small>bpm</small></span></div><p class="trend">Ábending: taktu skjáskot af töflunni og hafðu hana við höndina á æfingu.'+(own&&tm&&tm>own?' Þú hefur náð <b class="num">'+tm+' bpm</b> á prófi eða æfingu. Ef það er réttari tala geturðu breytt hámarkspúlsinum hér fyrir neðan.':'')+'</p>';
 if(mine)html+='<details class="hr-edit"'+(own?'':' open')+'><summary>'+(own?'Breyta hámarkspúlsinum þínum ('+own+')':'Skrá hámarkspúlsinn þinn')+'</summary>'+form+'</details>';
 return html+'</section>';
}
function guideCard(x,a){
 if(!a||!isRemote(a.group))return'';
 var hm=hrMax(x),z2=hm?'<b class="num">'+Math.round(hm*.6)+'–'+Math.round(hm*.7)+' bpm</b>':'60–70% af hámarkspúlsinum þínum';
 function sec(t,sub,items){return'<div class="g-sec"><div class="g-h"><b>'+t+'</b><span>'+sub+'</span></div><ul>'+items.map(function(i){return'<li>'+i+'</li>'}).join('')+'</ul></div>'}
 return'<section class="card guide"><h3>Svona tekur þú æfingarnar</h3><p class="desc">Þrjár tegundir af æfingum, hver með sinn tilgang.</p>'+
  sec('Þriðjudagar','Hátt tempó',['Vinnuloturnar eru á háu álagi. Fylgdu prósentunum.','<b>Í hvíldinni</b> einbeitirðu þér að önduninni: djúpt inn um nefið og langt út um munninn, t.d. 2 sek inn og 4 sek út. Markmiðið er að ná púlsinum niður eins hratt og þú getur og vera tilbúin/n í næstu lotu.','Taktu eftir hve mörg slög púlsinn fellur í hvíldinni. Það eykst eftir því sem þolið verður betra.'])+
  sec('Fimmtudagar','Jafnt tempó',['Haltu jöfnum hraða innan hvers kafla. Það erfiðasta er að fara ekki of hratt, fyrstu mínúturnar eiga að vera þægilegar.','Þú átt að geta talað í stuttum setningum. Prófaðu að anda með nefinu fyrstu mínúturnar.','<b>Markmiðið er að fara hraðar en halda sama púlsi, frá viku til viku.</b>'])+
  sec('Heimaæfing','Zone 2 · valfrjálst',['Zone 2 er 60–70% af hámarkspúlsi. Hjá þér er það '+z2+'.','30–40 mín á jöfnum, rólegum hraða: ganga upp brekkur, hjól, skokk, róður eða skíði.','Andaðu með nefinu allan tímann. Ef þú getur það og spjallað um leið ertu á réttum stað. Þetta á að vera auðvelt, og það er einmitt málið.'])+
 '</section>';
}
function hrSave(){
 var a=byId(ui.sel);if(!a||!db)return;var el=document.getElementById('hr-in');if(!el)return;
 var raw=el.value.trim(),v=raw===''?null:parseInt(raw,10);
 if(v!=null&&(isNaN(v)||v<120||v>230)){toast('Skrifaðu hámarkspúls á bilinu 120–230, t.d. 188.');return}
 var FV=firebase.firestore.FieldValue,upd={updated:FV.serverTimestamp()};upd['data.hrmax']=v==null?FV.delete():v;
 saving=true;render();
 athleteRef(a.id).update(upd).then(function(){data[a.id]=data[a.id]||{};if(v==null)delete data[a.id].hrmax;else data[a.id].hrmax=v;saving=false;render();toast('Hámarkspúls vistaður.')}).catch(function(e){saving=false;render();toast(e&&e.code==='permission-denied'?'Ekki tókst að vista. Biddu þjálfarann að uppfæra reglurnar í Firebase.':'Ekki tókst að vista. Athugaðu netsambandið og reyndu aftur.')});
}
var THU_MIN={w2thu:30,w3thu:36,w4thu:36};
function kpm(k,v){return v&&v.mkcal!=null&&THU_MIN[k]?Math.round(v.mkcal/THU_MIN[k]*10)/10:null}
function sl(n){return n+' '+(n%10===1&&n%100!==11?'slagi':'slögum')}
function fmt1(n){return String(n).replace('.',',')}
function lastThu(x,before){var best=null;['w2thu','w3thu','w4thu'].forEach(function(k){if(before&&k>=before)return;var v=x[k];if(kpm(k,v)!=null)best={k:k,v:v,w:Number(k[1]),kpm:kpm(k,v)}});return best}
function beatBox(x,k){
 var p=lastThu(x,k);
 if(!p)return'<div class="beat"><b>🎯 Keppni við sjálfa/n þig</b><span>Skrifaðu niður kaloríurnar á tækinu eftir hvert sett og leggðu saman. Það er talan sem þú reynir að slá næsta fimmtudag.</span></div>';
 return'<div class="beat"><b>🎯 Talan til að slá</b><span>Vika '+p.w+': <b class="num">'+fmt1(p.kpm)+' kal/mín</b>'+(p.v.avg!=null?' á meðalpúls <b class="num">'+p.v.avg+'</b>':'')+'. Náðu fleiri kaloríum á mínútu án þess að púlsinn hækki.</span></div>';
}
function thuCard(x){
 var rows=['w2thu','w3thu','w4thu'].map(function(k){return{k:k,w:Number(k[1]),v:x[k],kpm:kpm(k,x[k])}}).filter(function(r){return r.kpm!=null});
 var html='<section class="card thu-card"><h3>Fimmtudagar · keppni við sjálfa/n þig</h3><p class="desc">Kaloríur á tækjum á mínútu og meðalpúls. Markmiðið er að fara hraðar en halda sama púlsi, frá viku til viku.</p>';
 if(!rows.length)return html+'<div class="empty">Engir fimmtudagar skráðir enn. Skráðu kaloríurnar á tækjunum eftir æfinguna.</div></section>';
 var mx=Math.max.apply(null,rows.map(function(r){return r.kpm}));
 rows.forEach(function(r,i){var pr=rows[i-1],d=pr?Math.round((r.kpm-pr.kpm)*10)/10:null;
  html+='<div class="cmp-row"><span class="lab">Vika '+r.w+'</span><div class="bar"><i class="'+(i===rows.length-1?'w5':'w1')+'" style="width:'+Math.max(30,r.kpm/mx*100)+'%"></i><span class="num">'+fmt1(r.kpm)+' kal/mín'+(r.v.avg!=null?' · púls '+r.v.avg:'')+'</span></div></div>'});
 if(rows.length>=2){var a=rows[0],b=rows[rows.length-1],dk=Math.round((b.kpm-a.kpm)*10)/10,dh=(a.v.avg!=null&&b.v.avg!=null)?b.v.avg-a.v.avg:null;
  var txt=dk>0&&(dh==null||dh<=2)?'Þú ferð <b class="num">'+fmt1(dk)+' kal/mín hraðar</b> en í viku '+a.w+(dh!=null?(dh<=0?' og púlsinn er '+(dh<0?'<b class="num">'+sl(-dh)+' lægri</b>':'sá sami'):' á nánast sama púlsi'):'')+'. Það er nákvæmlega markmiðið. Vel gert! 💪':
   dk>0?'Þú ferð <b class="num">'+fmt1(dk)+' kal/mín hraðar</b> en í viku '+a.w+', en púlsinn er líka '+sl(dh)+' hærri. Prófaðu að halda púlsinum niðri næst.':
   'Kaloríurnar á mínútu eru svipaðar eða færri en í viku '+a.w+'. Athugaðu að vika 4 er stigvaxandi, svo fyrsta settið er rólegra.';
  html+='<div class="trend">'+txt+'</div>'}
 return html+'</section>';
}
function stageDiff(a,b){var sa=a&&a.stages||[],sb=b&&b.stages||[],n=0,d=0;for(var i=0;i<Math.min(sa.length,sb.length);i++)if(sa[i]!=null&&sb[i]!=null){d+=sb[i]-sa[i];n++}return n>=2?Math.round(d/n):null}
function formCard(x){
 var a1=x.w1t1,b1=x.w5t1,c1=total(x.w1t2),c5=total(x.w5t2),sig=[];
 if(a1&&b1&&a1.min!=null&&b1.min!=null){var dm=b1.min-a1.min;sig.push({ok:dm>0,t:dm>0?'<b>'+dm+' '+(dm===1?'mínútu':'mínútum')+' lengra</b> í Prófi 1':dm===0?'Sama mínúta í Prófi 1':'Styttra í Prófi 1 en í viku 1'})}
 var sd=stageDiff(a1,b1);if(sd!=null)sig.push({ok:sd<0,t:sd<0?'<b>'+sl(-sd)+' lægri púls</b> á sama hraða':sd===0?'Sami púls á sama hraða':'Hærri púls á sama hraða'});
 var r1=recov(a1),r5=recov(b1);if(r1!=null&&r5!=null)sig.push({ok:r5>r1,t:r5>r1?'Púlsinn fellur <b>'+sl(r5-r1)+' hraðar</b> eftir átak':'Endurheimtin er svipuð eða hægari'});
 if(c1!=null&&c5!=null){var pc=pct(c1,c5);sig.push({ok:c5>c1,t:c5>c1?'<b>'+fmtPct(pc).replace('+','')+' fleiri kaloríur</b> í Prófi 2 (+'+(c5-c1)+' kal)':c5===c1?'Sami fjöldi kaloría í Prófi 2':'Færri kaloríur í Prófi 2'})}
 if(!sig.length)return'';
 var ok=sig.filter(function(q){return q.ok}).length,all=sig.length,head,sub;
 if(ok===all){head='Þolið þitt er orðið betra! 💪';sub=all>1?'Öll '+all+' merkin sýna betra þol. Frábær vinna síðustu vikur.':'Vel gert, vinnan síðustu vikur skilaði sér.'}
 else if(ok*2>=all){head='Þú ert á réttri leið! 👊';sub=ok+' af '+all+' merkjum sýna betra þol. Dagsformið hefur alltaf áhrif á próf, svo þetta er góð niðurstaða.'}
 else{head='Prófin sýna litla breytingu í þetta sinn';sub='Svefn, þreyta og dagsform hafa mikil áhrif á próf. Það sem skiptir máli er að þú mættir og kláraðir, og grunnurinn er kominn til að byggja á.'}
 return'<section class="card form-card"><div class="form-eyebrow">Niðurstaðan þín</div><h3>'+head+'</h3><ul class="form-list">'+sig.map(function(q){return'<li class="'+(q.ok?'f-ok':'f-no')+'"><span>'+(q.ok?'✓':'–')+'</span><div>'+q.t+'</div></li>'}).join('')+'</ul><p class="trend">'+sub+'</p></section>';
}
function vsCard(x){
 if(!team)return'';
 var rows=[],t1a=x.w1t1&&x.w1t1.min,t1b=x.w5t1&&x.w5t1.min,c1=total(x.w1t2),c5=total(x.w5t2);
 function add(label,you,grp,fmt,unit){if(grp==null&&you==null)return;rows.push({l:label,y:you,g:grp,f:fmt||function(v){return(Math.round(v*10)/10).toLocaleString('is-IS')},u:unit||''})}
 var rem=isRemote(byId(ui.sel)&&byId(ui.sel).group);
 if(rem){add('Bæting í Prófi 1',pct(t1a,t1b),team.p1,fmtPct,'');add('Bæting í Prófi 2',pct(c1,c5),team.p2,fmtPct,'')}
 else if(team.d1!=null||(t1a!=null&&t1b!=null))add('Bæting í Prófi 1',t1a!=null&&t1b!=null?t1b-t1a:null,team.d1,function(v){return sign(v,function(q){return(Math.round(q*10)/10).toLocaleString('is-IS')})},' mín');
 else add('Próf 1 · mínútur',t1a,tsess('w1t1')&&tsess('w1t1').min,null,' mín');
 if(rem){}else if(team.d2!=null||(c1!=null&&c5!=null))add('Bæting í Prófi 2',c1!=null&&c5!=null?c5-c1:null,team.d2,function(v){return sign(Math.round(v))},' kal');
 else add('Próf 2 · samtals kaloríur',c1,tsess('w1t2')&&tsess('w1t2').total,function(v){return Math.round(v)},' kal');
 add('Þriðjudagar · tími í svæði 4–5',zshare(x,'tue',['z4','z5']),team.tueHi,function(v){return Math.round(v)},'%');
 add('Fimmtudagar · tími í svæði 2–3',zshare(x,'thu',['z2','z3']),team.thuMid,function(v){return Math.round(v)},'%');
 add('Æfingar kláraðar',countDone(x),team.done,null,' / 10');
 rows=rows.filter(function(r){return r.g!=null});
 if(!rows.length)return'';
 var html='<section class="card vs"><h3>Þú og hópurinn</h3><p class="desc">Þínar tölur bornar saman við meðaltal hópsins þíns. Þú sérð ekki tölur annarra einstaklinga.</p><div class="vs-legend"><span><i class="sw" style="background:var(--pulse)"></i>Þú</span><span><i class="sw" style="background:var(--w1)"></i>Meðaltal hópsins</span></div><div class="vs-rows">';
 rows.forEach(function(r){var mx=Math.max(Math.abs(r.y||0),Math.abs(r.g||0))||1;
  function bar(v,c){return'<div class="vs-bar"><i class="'+c+'" style="width:'+(v!=null?Math.max(4,Math.max(0,v)/mx*100):0)+'%"></i><span class="num">'+(v!=null?r.f(v)+r.u:'—')+'</span></div>'}
  html+='<div class="vs-row"><div class="vs-l">'+r.l+'</div>'+bar(r.y,'you')+bar(r.g,'grp')+'</div>'});
 return html+'</div></section>';
}
// ---------- Share image ----------
function shareStats(x){
 var out=[],a1=x.w1t1,b1=x.w5t1,t1a=a1&&a1.min,t1b=b1&&b1.min,c1=total(x.w1t2),c5=total(x.w5t2);
 if(t1a!=null&&t1b!=null)out.push({label:'Próf 1 · Hámarkspúlspróf',value:sign(t1b-t1a,function(v){return v+' mín'}),sub:'Mínúta '+t1a+' → '+t1b+'  ·  '+(a1.dev==='tread'?tspeed(t1a)+' → '+tspeed(t1b)+' km/klst':t1rpm(a1)+' → '+t1rpm(b1)+' rpm')});
 else if(t1a!=null)out.push({label:'Próf 1 · Hámarkspúlspróf',value:t1a+' mín',sub:'Kláraði '+t1lab(a1)});
 if(c1!=null&&c5!=null)out.push({label:'Próf 2 · 3 × 10 mín',value:sign(c5-c1,function(v){return v+' kal'}),sub:c1+' → '+c5+' kaloríur samtals'});
 else if(c1!=null)out.push({label:'Próf 2 · 3 × 10 mín',value:c1+' kal',sub:x.w1t2.parts?partsNames(x.w1t2):'BikeErg, róðravél og Assault-hjól'});
 var sa=a1&&a1.stages||[],sb=b1&&b1.stages||[],n=0,d=0;for(var i=0;i<Math.min(sa.length,sb.length);i++)if(sa[i]!=null&&sb[i]!=null){d+=sb[i]-sa[i];n++}
 if(n>=2&&Math.round(d/n)<0)out.push({label:'Lægri púls á sömu ákefð',value:Math.round(-d/n)+' slög',sub:'hjartað slær hægar undir sama álagi'});
 var r1=recov(a1),r5=recov(b1);if(r1!=null&&r5!=null&&r5>r1)out.push({label:'Hraðari endurheimt',value:'+'+(r5-r1)+' slög',sub:'púlsinn fellur hraðar eftir átak'});
 var done=countDone(x);if(done)out.push({label:'Æfingar',value:done+' / 10',sub:done>=10?'allar kláraðar':'kláraðar'});
 return out.slice(0,4);
}
function shareBar(x){
 if(!shareStats(x).length)return'';
 return'<section class="share-bar"><div><b>Deildu árangrinum</b><span>Mynd fyrir Instagram, með eða án bakgrunns.</span></div><button class="btn" data-act="share-open">Búa til mynd</button></section>';
}
var LOGO=null;
function loadLogo(){if(LOGO)return LOGO;LOGO=new Promise(function(res){var im=new Image();im.onload=function(){res(im)};im.onerror=function(){res(null)};im.src='logo-box800-white.png'});return LOGO}
function fontsReady(){if(!document.fonts||!document.fonts.load)return Promise.resolve();return Promise.all(['700 100px "Barlow Condensed"','600 40px "Barlow"','500 40px "Barlow"'].map(function(f){return document.fonts.load(f).catch(function(){})}))}
var CF='"Barlow Condensed","Arial Narrow",sans-serif',BF='"Barlow",system-ui,sans-serif';
function fit(ctx,text,weight,fam,size,min,maxW){var sz=size;do{ctx.font=weight+' '+sz+'px '+fam;if(ctx.measureText(text).width<=maxW)break;sz-=2}while(sz>min);return sz}
function spaced(ctx,px){if('letterSpacing' in ctx)ctx.letterSpacing=px+'px'}
function drawShare(cv,x,name,project,logo,fmt,bg){
 var W=1080,H=fmt==='story'?1920:1080,S=fmt==='story';cv.width=W;cv.height=H;
 var c=cv.getContext('2d'),pad=S?90:72,clear=bg==='clear';
 c.clearRect(0,0,W,H);
 if(!clear){var g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1b2835');g.addColorStop(1,'#0b1117');c.fillStyle=g;c.fillRect(0,0,W,H);
  c.globalAlpha=.06;c.strokeStyle='#ffffff';c.lineWidth=2;for(var gy=S?760:470;gy<H-120;gy+=S?120:90){c.beginPath();c.moveTo(0,gy);c.lineTo(W,gy);c.stroke()}c.globalAlpha=1}
 function shadow(on){c.shadowColor=on&&clear?'rgba(0,0,0,.55)':'transparent';c.shadowBlur=on&&clear?18:0;c.shadowOffsetY=on&&clear?3:0}
 shadow(true);c.fillStyle='#ffffff';c.textBaseline='alphabetic';
 // top: logo + label
 var lh=S?96:72,top=S?100:66;
 if(logo){var lw=lh*logo.width/logo.height;c.drawImage(logo,pad,top,lw,lh)}
 c.textAlign='right';c.font='600 '+(S?34:28)+'px '+BF;spaced(c,S?6:5);c.globalAlpha=.8;c.fillText('ÞOLÞJÁLFUN',W-pad,top+lh*0.62);c.globalAlpha=1;spaced(c,0);
 // name
 c.textAlign='left';var ny=S?440:268,ns=fit(c,name,'700',CF,S?160:118,60,W-pad*2);c.font='700 '+ns+'px '+CF;c.fillText(name,pad,ny);
 var hasW5=!!(x.w5t1||x.w5t2);
 c.font='500 '+(S?44:34)+'px '+BF;c.globalAlpha=.82;c.fillText(hasW5?'5 vikna árangur':'Byrjunarpunktur · vika 1',pad,ny+(S?70:52));c.globalAlpha=1;
 // ecg
 var ey=S?620:388,amp=S?70:48;c.strokeStyle='#ff5a45';c.lineWidth=S?7:5;c.lineJoin='round';c.lineCap='round';c.beginPath();
 var pts=[[0,0],[.30,0],[.33,-.25],[.36,0],[.42,0],[.45,.35],[.49,-1],[.53,.6],[.56,0],[.66,0],[.69,-.2],[.72,0],[1,0]];
 pts.forEach(function(p,i){var px=p[0]*W,py=ey+p[1]*amp;if(i)c.lineTo(px,py);else c.moveTo(px,py)});c.stroke();
 // stats
 var st=shareStats(x);
 function block(o,bx,by,bw,big){
  c.fillStyle='#ff5a45';c.fillRect(bx,by,S?10:8,big*1.5);c.fillStyle='#ffffff';
  var tx=bx+(S?36:28);
  spaced(c,4);var ls=fit(c,o.label.toUpperCase(),'600',BF,Math.round(big*.2),12,bw-(tx-bx));c.font='600 '+ls+'px '+BF;c.globalAlpha=.78;c.fillText(o.label.toUpperCase(),tx,by+big*.2);c.globalAlpha=1;spaced(c,0);
  var vs=fit(c,o.value,'700',CF,big,40,bw-(tx-bx));c.font='700 '+vs+'px '+CF;c.fillText(o.value,tx,by+big*.2+vs*.95);
  var ss=fit(c,o.sub,'500',BF,Math.round(big*.25),16,bw-(tx-bx));c.font='500 '+ss+'px '+BF;c.globalAlpha=.88;c.fillText(o.sub,tx,by+big*.2+vs*.95+big*.5);c.globalAlpha=1;
 }
 if(S){var y0=760,y1=H-210,bh=Math.min(300,(y1-y0)/Math.max(st.length,1));st.forEach(function(o,i){block(o,pad,y0+i*bh,W-pad*2,Math.min(160,bh*.54))})}
 else{var cols=st.length>1?2:1,rows=Math.ceil(st.length/cols),gx=40,cw=(W-pad*2-gx*(cols-1))/cols,y0=470,rh=Math.min(270,(H-110-y0)/rows);
  st.forEach(function(o,i){block(o,pad+(i%cols)*(cw+gx),y0+Math.floor(i/cols)*rh,cw,Math.min(cols>1?110:150,rh*.5))})}
 // footer
 c.font='500 '+(S?36:28)+'px '+BF;c.globalAlpha=.7;c.textAlign='left';c.fillText(project,pad,H-(S?110:60));c.globalAlpha=1;
 shadow(false);
}
function slug(t){return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/þ/g,'th').replace(/ð/g,'d').replace(/æ/g,'ae').replace(/ö/g,'o').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function openShareModal(){
 var a=byId(ui.sel);if(!a)return;var x=data[a.id]||{};
 var m=document.getElementById('share-modal');
 if(!m){m=document.createElement('div');m.id='share-modal';m.className='share-modal';document.body.appendChild(m)}
 var touch=window.matchMedia&&matchMedia('(pointer:coarse)').matches;
 m.innerHTML='<div class="share-box" role="dialog" aria-modal="true" aria-label="Deildu árangrinum"><div class="share-head"><h3>Deildu árangrinum</h3><button class="share-x" data-sact="close" aria-label="Loka">✕</button></div>'+
  '<div class="share-opts"><div class="chips" role="group" aria-label="Stærð"><button class="chip sm" data-sact="fmt" data-v="story" aria-pressed="'+(share.fmt==='story')+'">Story 9:16</button><button class="chip sm" data-sact="fmt" data-v="square" aria-pressed="'+(share.fmt==='square')+'">Ferningur 1:1</button></div>'+
  '<div class="chips" role="group" aria-label="Bakgrunnur"><button class="chip sm" data-sact="bg" data-v="dark" aria-pressed="'+(share.bg==='dark')+'">Dökkur bakgrunnur</button><button class="chip sm" data-sact="bg" data-v="clear" aria-pressed="'+(share.bg==='clear')+'">Gegnsær</button></div></div>'+
  '<div class="share-prev'+(share.bg==='clear'?' checker':'')+'"><img id="share-img" alt="Mynd með árangri '+esc(a.name)+'"><span id="share-wait">Teikna…</span></div>'+
  '<div class="actions"><button class="btn" data-sact="save" id="share-save" disabled>'+(touch?'Vista eða deila':'Sækja mynd')+'</button></div>'+
  '<p class="desc">'+(share.bg==='clear'?'Gegnsæ mynd er til að setja ofan á þína eigin mynd, t.d. í Instagram story. ':'')+(touch?'Veldu „Vista mynd“ eða Instagram. Þú getur líka haldið fingri á myndinni.':'Myndin vistast sem PNG-skrá.')+'</p></div>';
 share.file=null;
 Promise.all([loadLogo(),fontsReady()]).then(function(r){
  var cv=document.createElement('canvas');drawShare(cv,x,a.name,state.project||'Þolþjálfun',r[0],share.fmt,share.bg);
  var img=document.getElementById('share-img');if(!img)return;img.src=cv.toDataURL('image/png');var w=document.getElementById('share-wait');if(w)w.remove();
  cv.toBlob(function(b){if(!b)return;share.file=new File([b],'tholthjalfun-'+slug(a.name)+'-'+share.fmt+(share.bg==='clear'?'-gegnsae':'')+'.png',{type:'image/png'});var sb=document.getElementById('share-save');if(sb)sb.disabled=false},'image/png');
 });
}
function closeShare(){share.open=false;var m=document.getElementById('share-modal');if(m)m.remove()}
function saveShare(){
 var f=share.file;if(!f)return;
 var touch=window.matchMedia&&matchMedia('(pointer:coarse)').matches;
 if(touch&&navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f]}).catch(function(){});return}
 var url=URL.createObjectURL(f),l=document.createElement('a');l.href=url;l.download=f.name;document.body.appendChild(l);l.click();l.remove();setTimeout(function(){URL.revokeObjectURL(url)},3000);
}
document.addEventListener('click',function(e){var el=e.target.closest&&e.target.closest('[data-sact]');var m=document.getElementById('share-modal');
 if(m&&e.target===m){closeShare();return}
 if(!el)return;var k=el.getAttribute('data-sact');
 if(k==='close')closeShare();else if(k==='fmt'){share.fmt=el.getAttribute('data-v');openShareModal()}else if(k==='bg'){share.bg=el.getAttribute('data-v');openShareModal()}else if(k==='save')saveShare()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&share.open)closeShare()});

function stat(k,v,s){return'<div class="stat"><div class="k">'+k+'</div><div class="v num">'+v+'</div><div class="s num">'+s+'</div></div>'}

function test1Card(x){
 var a=x.w1t1,b=x.w5t1;
 var html='<section class="card"><h3>Próf 1 · Hámarkspúls</h3><p class="desc">'+((a&&a.dev==='tread')||(b&&b.dev==='tread')?'Hlaupabretti, 1% halli. Byrjar á 8 km/klst og hraðinn eykst um 0,5 km/klst á mínútu':'Assault-hjól. Byrjar í 50 snúningum á mínútu og hækkar á hverri mínútu')+' þar til þú getur ekki meira. Því lengur, því betra.</p><p class="rpm-note"><b>Hvað er RPM?</b> Snúningar á mínútu: hve marga heila hringi pedalarnir fara á einni mínútu. Talan sést á skjá hjólsins. Hærra RPM þýðir að þú hjólar hraðar.</p>';
 if(!a&&!b)return html+'<div class="empty">Engar niðurstöður enn.</div></section>';
 var mx=Math.max(a&&a.min||0,b&&b.min||0)||1;
 html+='<div class="cmp">';
 [['Vika 1',a,'w1'],['Vika 5',b,'w5']].forEach(function(r){
  var t=r[1]&&r[1].min;
  html+='<div class="cmp-row"><span class="lab">'+r[0]+'</span><div class="bar">'+(t!=null?'<i class="'+r[2]+'" style="width:'+Math.max(18,t/mx*100)+'%"></i><span class="num">Mínúta '+t+' · '+t1lab(r[1])+'</span>':'<span class="num" style="color:var(--muted);font-weight:500">Endurpróf í viku 5</span>')+'</div></div>';
 });
 html+='</div>';
 if(a&&b&&a.min!=null&&b.min!=null){var dm=b.min-a.min;html+='<div class="trend">'+(dm>0?'Þú komst <b class="num">'+dm+' '+(dm===1?'mínútu':'mínútum')+' lengra</b> í viku 5 en í viku 1 ('+t1lab(a)+' → '+t1lab(b)+'). Þú þolir nú meira álag lengur, sem þýðir betra þol. Vel gert! 💪':dm===0?'Þú náðir sömu mínútu í báðum prófum. Skoðaðu líka púlsinn og endurheimtina: ef púlsinn er lægri á sama hraða er þolið samt orðið betra.':'Þú náðir ekki eins langt í viku 5. Dagsformið skiptir miklu í hámarksprófi (svefn, þreyta, næring), svo horfðu líka á púlsinn og endurheimtina.')+'</div>'}
 else if(a&&a.min!=null&&!b)html+='<div class="trend">Þetta er upphafspunkturinn þinn. Í viku 5 reynirðu að komast lengra.</div>';
 html+=stageBlock(a,b)+miniTable(a,b,true);
 var ra=recov(a),rb=recov(b);
 if(ra!=null||rb!=null)html+='<div class="trend">'+(ra!=null&&rb!=null?'Endurheimt: púlsinn féll um <b class="num">'+ra+'</b> slög á 1 mín í viku 1 og <b class="num">'+rb+'</b> í viku 5. '+(rb>ra?'Hraðari endurheimt þýðir betra þol.':''):'Endurheimt: púlsinn féll um <b class="num">'+(ra!=null?ra:rb)+'</b> slög fyrstu mínútuna eftir prófið. Því meira, því betra.')+'</div>';
 var hm=hrMax(x);
 if(hm){
  var z=[[50,60,'Z1'],[60,70,'Z2'],[70,80,'Z3'],[80,90,'Z4'],[90,100,'Z5']];
  html+='<div class="zones" aria-label="Púlssvæði">';
  z.forEach(function(q){html+='<div class="zone num"><b>'+q[2]+'</b>'+Math.round(hm*q[0]/100)+'–'+Math.round(hm*q[1]/100)+'</div>'});
  html+='</div><div class="trend">Þín púlssvæði miðað við hæsta skráða púls, <b class="num">'+hm+' bpm</b>.</div>';
 }
 return html+'</section>';
}
function stageBlock(a,b){
 var sa=a&&a.stages||[],sb=b&&b.stages||[];
 var n=Math.max(sa.length,sb.length);if(!n)return'';
 var all=nn(sa.concat(sb));if(all.length<4)return'';var lo=Math.floor((Math.min.apply(null,all)-5)/10)*10,hi=Math.ceil((Math.max.apply(null,all)+5)/10)*10;
 var W=360,H=210,pl=32,pr=12,top=12,bot=172;
 var X=function(i){return pl+(n>1?i/(n-1):.5)*(W-pl-pr)},Y=function(v){return bot-(v-lo)/(hi-lo)*(bot-top)};
 var svg='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Púls á hverju þrepi, vika 1 og vika 5">';
 var tick=(hi-lo)>60?20:10;
 for(var t=lo;t<=hi;t+=tick)svg+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(t)+'" y2="'+Y(t)+'" stroke="var(--line)"/><text x="'+(pl-5)+'" y="'+(Y(t)+4)+'" text-anchor="end" font-size="10" fill="var(--muted)">'+t+'</text>';
 var every=n>12?2:1;
 for(var i=0;i<n;i++)if(i%every===0||i===n-1)svg+='<text x="'+X(i)+'" y="'+(bot+16)+'" text-anchor="middle" font-size="10" fill="var(--muted)">'+rpmFor(i+1)+'</text>';
 svg+='<text x="'+((pl+W-pr)/2)+'" y="'+(H-4)+'" text-anchor="middle" font-size="10" fill="var(--muted)">snúningar á mínútu (rpm)</text>';
 [[sa,'var(--w1)'],[sb,'var(--pulse)']].forEach(function(q){var arr=q[0];if(!arr.length)return;
  var seg=[],segs=[];arr.forEach(function(v,i){if(v==null){if(seg.length)segs.push(seg);seg=[]}else seg.push(X(i)+','+Y(v))});if(seg.length)segs.push(seg);
  segs.forEach(function(g){svg+='<polyline fill="none" stroke="'+q[1]+'" stroke-width="2.5" stroke-linejoin="round" points="'+g.join(' ')+'"/>'});
  arr.forEach(function(v,i){if(v!=null)svg+='<circle cx="'+X(i)+'" cy="'+Y(v)+'" r="3" fill="'+q[1]+'"/>'});
  var L=arr.length-1;while(L>0&&arr[L]==null)L--;svg+='<text x="'+Math.min(X(L),W-pr-2)+'" y="'+(Y(arr[L])-8)+'" text-anchor="end" font-size="11" font-weight="700" fill="var(--ink)">'+arr[L]+'</text>';
 });
 svg+='</svg>';
 var html='<div class="stages"><div class="stages-head"><b>Púls á hverju þrepi</b><span class="legend" style="margin:0"><span><i class="sw" style="background:var(--w1)"></i>Vika 1</span><span><i class="sw" style="background:var(--pulse)"></i>Vika 5</span></span></div><div class="chartbox">'+svg+'</div>';
 var common=Math.min(sa.length,sb.length);
 var cnt=0,d=0;for(var j=0;j<common;j++)if(sa[j]!=null&&sb[j]!=null){d+=sb[j]-sa[j];cnt++}
 if(cnt>=2){d=Math.round(d/cnt);
  html+='<div class="trend">'+(d<0?'Púlsinn var að meðaltali <b class="num">'+(-d)+' slögum lægri</b> á sama hraða í viku 5. Lægri púls á sama álagi þýðir betra þol.':d>0?'Púlsinn var að meðaltali <b class="num">'+d+' slögum hærri</b> á sama hraða í viku 5.':'Púlsinn var nánast sá sami á sama hraða í báðum vikum.')+'</div>'}
 html+='<details class="stage-table"><summary>Sýna töflu</summary><div class="tablewrap" style="margin-top:8px"><table class="mini num" style="margin-top:0"><thead><tr><th>Mín.</th><th>RPM</th><th>Vika 1</th><th>Vika 5</th><th>Munur</th></tr></thead><tbody>';
 for(var k=0;k<n;k++){var va=sa[k],vb=sb[k];html+='<tr><td>'+(k+1)+'</td><td>'+rpmFor(k+1)+'</td><td>'+(va!=null?va:'—')+'</td><td>'+(vb!=null?vb:'—')+'</td><td>'+(va!=null&&vb!=null?sign(vb-va):'—')+'</td></tr>'}
 return html+'</tbody></table></div></details></div>';
}
function recov(v){return v&&v.max!=null&&v.rec!=null&&v.max>=v.rec?v.max-v.rec:null}
function miniTable(a,b,t1,t2){
 var rows=t2?[['Hámarkspúls','max',' bpm']]:[['Meðalpúls','avg',' bpm'],['Hámarkspúls','max',' bpm']];
 if(t1)rows.push(['Púls 1 mín eftir próf','rec',''],['Endurheimt (slög á 1 mín)',recov,'']);
 if(!t2&&!t1)rows.push(['Heildarkaloríur (Polar)','kcal','']);
 function g(o,r){return typeof r[1]==='function'?r[1](o):(o&&o[r[1]])}
 var html='<table class="mini num"><thead><tr><th></th><th>Vika 1</th><th>Vika 5</th><th>Breyting</th></tr></thead><tbody>';
 rows=rows.filter(function(r){return g(a,r)!=null||g(b,r)!=null});if(!rows.length)return'';
 rows.forEach(function(r){var va=g(a,r),vb=g(b,r),d=(va!=null&&vb!=null)?vb-va:null;
  html+='<tr><td>'+r[0]+'</td><td>'+(va!=null?va:'—')+'</td><td>'+(vb!=null?vb:'—')+'</td><td>'+sign(d)+'</td></tr>'});
 return html+'</tbody></table>';
}
function partsNames(v){var o=[];(v.parts||[]).forEach(function(q){if(q&&q.m){var n=devName(q.m);if(o.indexOf(n)<0)o.push(n)}});return o.join(', ')}
function test2Card(x){
 var a=x.w1t2,b=x.w5t2,pp=(a&&a.parts)||(b&&b.parts);
 var html='<section class="card"><h3>Próf 2 · 10 mín hámarkskaloríur</h3><p class="desc">'+(pp?'3 × 10 mín á tækjum að eigin vali: '+esc(partsNames(a&&a.parts?a:b))+'.':'BikeErg, róðravél og Assault-hjól.')+' Fleiri kaloríur, því betra.</p>';
 if(!a&&!b)return html+'<div class="empty">Engar niðurstöður enn.</div></section>';
 if(pp)[0,1,2].forEach(function(i){
  var pa=a&&a.parts&&a.parts[i],pb=b&&b.parts&&b.parts[i];if(!pa&&!pb)return;
  var va=pa&&pa.c,vb=pb&&pb.c,mx=Math.max(va||0,vb||0)||1,d=(va!=null&&vb!=null)?vb-va:null;
  var na=pa&&pa.m?devName(pa.m):'',nb=pb&&pb.m?devName(pb.m):'',nm=na&&nb&&na!==nb?na+' / '+nb:(na||nb);
  html+='<div class="machine"><div class="machine-head"><b>'+(i+1)+'. hluti · '+esc(nm)+'</b><span class="delta num '+cls(d)+'">'+(d!=null?sign(d)+' kal':'')+'</span></div>';
  [['Vika 1',va,'w1'],['Vika 5',vb,'w5']].forEach(function(r){
   html+='<div class="cmp-row"><span class="lab">'+r[0]+'</span><div class="bar">'+(r[1]!=null?'<i class="'+r[2]+'" style="width:'+Math.max(14,r[1]/mx*100)+'%"></i><span class="num">'+r[1]+' kal</span>':'<span class="num" style="color:var(--muted);font-weight:500">Endurpróf í viku 5</span>')+'</div></div>';
  });
  html+='</div>';
 });
 else MACHINES.forEach(function(m){
  var va=a&&a[m[0]],vb=b&&b[m[0]],mx=Math.max(va||0,vb||0)||1,d=(va!=null&&vb!=null)?vb-va:null;
  html+='<div class="machine"><div class="machine-head"><b>'+m[1]+'</b><span class="delta num '+cls(d)+'">'+(d!=null?sign(d)+' kal':'')+'</span></div>';
  [['Vika 1',va,'w1'],['Vika 5',vb,'w5']].forEach(function(r){
   html+='<div class="cmp-row"><span class="lab">'+r[0]+'</span><div class="bar">'+(r[1]!=null?'<i class="'+r[2]+'" style="width:'+Math.max(14,r[1]/mx*100)+'%"></i><span class="num">'+r[1]+' kal</span>':'<span class="num" style="color:var(--muted);font-weight:500">Endurpróf í viku 5</span>')+'</div></div>';
  });
  html+='</div>';
 });
 var ta=total(a),tb=total(b),tmx=Math.max(ta||0,tb||0)||1,td=(ta!=null&&tb!=null)?tb-ta:null;
 html+='<div class="machine total"><div class="machine-head"><b>Samtals á öllum tækjum</b><span class="delta num '+cls(td)+'">'+(td!=null?sign(td)+' kal':'')+'</span></div>';
 [['Vika 1',ta,'w1'],['Vika 5',tb,'w5']].forEach(function(r){
  html+='<div class="cmp-row"><span class="lab">'+r[0]+'</span><div class="bar">'+(r[1]!=null?'<i class="'+r[2]+'" style="width:'+Math.max(14,r[1]/tmx*100)+'%"></i><span class="num">'+r[1]+' kal</span>':'<span class="num" style="color:var(--muted);font-weight:500">Endurpróf í viku 5</span>')+'</div></div>';
 });
 html+='</div>';
 if(ta!=null&&tb!=null)html+='<div class="trend">'+(td>0?'Þú náðir <b class="num">'+td+' fleiri kaloríum</b> samtals í viku 5 ('+fmtPct(pct(ta,tb))+'). Meiri vinna á sama tíma þýðir betra þol. Vel gert! 💪':td===0?'Sami fjöldi kaloría í báðum prófum.':'Færri kaloríur í viku 5 en í viku 1. Dagsformið skiptir miklu, og byrjunarhraðinn hefur mikil áhrif á 10 mín prófi.')+'</div>';
 else if(ta!=null&&!b)html+='<div class="trend">Þetta er upphafspunkturinn þinn. Í viku 5 reynirðu að ná fleiri kaloríum.</div>';
 return html+miniTable(a,b,false,true)+'</section>';
}
function filtered(){return SESSIONS.filter(function(s){return ui.filter==='all'||(ui.filter==='tue'&&s.type==='tue')||(ui.filter==='thu'&&s.type==='thu')||(ui.filter==='test'&&(s.type==='t1'||s.type==='t2'))})}
function sessionsCard(x){
 var html='<section class="card"><div class="sess-head"><div><h3>Allar æfingar</h3><p class="desc" style="margin-bottom:0">Meðalpúls og hámarkspúls, með Polar-kaloríum fyrir neðan. Smelltu á æfingu til að sjá nánar.</p></div><div class="chips" role="group" aria-label="Sía æfingar">';
 [['all','Allt'],['tue','Þriðjudagar'],['thu','Fimmtudagar'],['test','Próf']].forEach(function(f){html+='<button class="chip sm" data-act="filter" data-f="'+f[0]+'" aria-pressed="'+(ui.filter===f[0])+'">'+f[1]+'</button>'});
 html+='</div></div><div class="legend"><span><i class="sw" style="background:var(--test)"></i>Próf</span><span><i class="sw" style="background:var(--pulse)"></i>Þriðjudagur</span><span><i class="sw" style="background:var(--long)"></i>Fimmtudagur</span><span><i class="sw" style="background:var(--muted)"></i>Meðalpúls (neðri tala)</span><span><i class="sw" style="border:2px solid var(--muted)"></i>Hámarkspúls (efri tala)</span>'+(team?'<span><i class="dash"></i>Meðalpúls hópsins</span>':'')+'</div><div class="chartbox" id="chart"></div>';
 var list=filtered().filter(function(s){return x[s.k]});
 if(ui.filter==='tue'||ui.filter==='thu'){
  if(list.length>=2){var f=x[list[0].k],l=x[list[list.length-1].k],d=l.avg-f.avg;
   html+='<div class="trend">Meðalpúls vika '+list[0].w+' → vika '+list[list.length-1].w+': <b class="num">'+f.avg+' → '+l.avg+' bpm</b> ('+sign(d)+'). '+(ui.filter==='thu'?'Á fimmtudögum er markmiðið jafn og lægri púls.':'Þriðjudagar eru erfiðu æfingarnar, svo hár púls er eðlilegur.')+'</div>';}
 }
 var pk=ui.pick&&x[ui.pick]?ui.pick:(list.length?list[list.length-1].k:null);
 if(pk){
  var s=SESSIONS.filter(function(q){return q.k===pk})[0],v=x[pk],hm=hrMax(x),prev=null;
  for(var i=SESSIONS.indexOf(s)-1;i>=0;i--){if(SESSIONS[i].type===s.type&&x[SESSIONS[i].k]){prev=SESSIONS[i];break}}
  html+='<div class="detail"><div class="t">Vika '+s.w+' · '+esc(s.label)+'</div>';
  if(s.type!=='t2')html+='<div class="m">Meðalpúls <b class="num">'+(v.avg!=null?v.avg:'—')+'</b>'+(hm&&v.avg?' <span class="num">('+Math.round(v.avg/hm*100)+'% af hámarki)</span>':'')+'</div>';
  html+='<div class="m">Hámarkspúls <b class="num">'+(v.max!=null?v.max:'—')+'</b></div>'+(s.type!=='t2'&&s.type!=='t1'?'<div class="m">Heildarkaloríur <b class="num">'+(v.kcal!=null?v.kcal:'—')+'</b></div>':'');
  if(s.type==='t1'&&v.min!=null)html+='<div class="m">Kláraði <b class="num">mín '+v.min+' · '+t1lab(v)+'</b></div>';
  if(s.type==='t1'&&recov(v)!=null)html+='<div class="m">Endurheimt <b class="num">'+recov(v)+' slög</b> á 1 mín</div>';
  if(s.type==='t2'&&total(v)!=null){if(v.parts)v.parts.forEach(function(q,i){if(q&&q.c!=null)html+='<div class="m">'+(i+1)+'. '+esc(devName(q.m))+' <b class="num">'+q.c+'</b></div>'});else MACHINES.forEach(function(m){if(v[m[0]]!=null)html+='<div class="m">'+m[1]+' <b class="num">'+v[m[0]]+'</b></div>'});html+='<div class="m">Samtals á tækjum <b class="num">'+total(v)+'</b></div>'}
  var ts=tsess(pk);
  if(ts&&(ts.avg!=null||ts.max!=null))html+='<div class="m team-line">Meðaltal hópsins: meðalpúls <b class="num">'+(ts.avg!=null?Math.round(ts.avg):'—')+'</b> · hámarkspúls <b class="num">'+(ts.max!=null?Math.round(ts.max):'—')+'</b>'+(ts.kcal!=null?' · kaloríur <b class="num">'+Math.round(ts.kcal)+'</b>':'')+'</div>';
  if(hasZones(v)){html+='<div class="zdetail"><div class="zlab">Þú</div>'+zoneBar(v,true)+(ts&&ts.zones?'<div class="zlab">Meðaltal hópsins</div>'+zoneBar(ts.zones):'')+'<div class="zlegend">'+ZK.map(function(k,i){return'<span><i class="sw zc'+(i+1)+'"></i>Svæði '+(i+1)+' <b class="num">'+Math.round((v[k]||0)/60)+' mín</b></span>'}).join('')+'</div></div>'}
  if(prev){var pv=x[prev.k];if(pv.avg!=null&&v.avg!=null)html+='<div class="m">Miðað við viku '+prev.w+': meðalpúls <b class="num">'+sign(v.avg-pv.avg)+'</b></div>'}
  html+='</div>';
 }
 html+=zonesOverview(x);
 return html+'</section>';
}
function zonesOverview(x){
 var list=filtered().filter(function(s){return hasZones(x[s.k])});
 if(!list.length)return'';
 var html='<div class="zones-over"><div class="stages-head"><b>Tími í svæðum</b><span class="zlegend" style="margin:0">'+ZK.map(function(k,i){return'<span><i class="sw zc'+(i+1)+'"></i>'+(i+1)+'</span>'}).join('')+'</span></div><div class="zrows">';
 list.forEach(function(s){var v=x[s.k];html+='<div class="zrow" data-act="pick" data-k="'+s.k+'"><span class="zl"><b>V'+s.w+'</b> <span style="color:'+color(s)+'">'+s.short+'</span></span>'+zoneBar(v)+'<span class="num zt">'+fmtMinS(zoneSecs(v))+'</span></div>'});
 html+='</div>';
 function share(type,zs){var t=0,z=0;SESSIONS.forEach(function(s){var v=x[s.k];if(s.type===type&&hasZones(v)){t+=zoneSecs(v);zs.forEach(function(k){z+=v[k]||0})}});return t?Math.round(z/t*100):null}
 var h45=share('tue',['z4','z5']),l23=share('thu',['z2','z3']);
 if(h45!=null||l23!=null)html+='<div class="trend">'+(h45!=null?'Á þriðjudögum varstu <b class="num">'+h45+'%</b> af tímanum í svæði 4–5. ':'')+(l23!=null?'Á fimmtudögum varstu <b class="num">'+l23+'%</b> af tímanum í svæði 2–3.':'')+'</div>';
 return html+'</div>';
}
var MINN=3;
function zshare(x,type,keys){var t=0,z=0;SESSIONS.forEach(function(s){var v=x[s.k];if(s.type===type&&hasZones(v)){t+=zoneSecs(v);keys.forEach(function(k){z+=v[k]||0})}});return t?Math.round(z/t*100):null}
function mean(arr,min){arr=arr.filter(function(v){return v!=null&&!isNaN(v)});if(arr.length<(min||MINN))return null;return Math.round(arr.reduce(function(a,b){return a+b},0)/arr.length*10)/10}
function computeTeam(list){
 var xs=(list||state.athletes).map(function(a){return data[a.id]||{}});
 var T={n:xs.length,sessions:{}};
 SESSIONS.forEach(function(s){var recs=xs.map(function(x){return x[s.k]}).filter(Boolean),o={n:recs.length};
  ['avg','max','kcal'].forEach(function(k){o[k]=mean(recs.map(function(r){return r[k]}))});
  var zr=recs.filter(hasZones);if(zr.length>=MINN){o.zones={};ZK.forEach(function(k){o.zones[k]=Math.round(mean(zr.map(function(r){return r[k]||0}),1))})}
  if(s.type==='t1')o.min=mean(recs.map(function(r){return r.min}));
  if(s.type==='t2'){MACHINES.forEach(function(m){o[m[0]]=mean(recs.map(function(r){return r[m[0]]}))});o.total=mean(recs.map(total))}
  T.sessions[s.k]=o});
 T.d1=mean(xs.map(function(x){return x.w1t1&&x.w5t1&&x.w1t1.min!=null&&x.w5t1.min!=null?x.w5t1.min-x.w1t1.min:null}));
 T.d2=mean(xs.map(function(x){var a=total(x.w1t2),b=total(x.w5t2);return a!=null&&b!=null?b-a:null}));
 T.p1=mean(xs.map(function(x){return pct(x.w1t1&&x.w1t1.min,x.w5t1&&x.w5t1.min)}));
 T.p2=mean(xs.map(function(x){return pct(total(x.w1t2),total(x.w5t2))}));
 T.tueHi=mean(xs.map(function(x){return zshare(x,'tue',['z4','z5'])}));
 T.thuMid=mean(xs.map(function(x){return zshare(x,'thu',['z2','z3'])}));
 T.done=mean(xs.map(countDone));
 return T;
}
function inGroup(g){return state.athletes.filter(function(a){return g==='all'||String(a.group||1)===String(g)})}
function pushTeam(){if(!canEdit||!db)return;var doc={all:computeTeam(state.athletes)};GROUPS.forEach(function(g){doc['g'+g.id]=computeTeam(inGroup(g.id))});db.collection('meta').doc('team').set(doc).catch(function(){})}
function teamFor(a){if(!a)return null;if(canEdit)return computeTeam(inGroup(gid(a.group)));if(!teamDoc)return null;return teamDoc['g'+gid(a.group)]||teamDoc.all||(teamDoc.sessions?teamDoc:null)}
function groupName(g){return GROUPS[gid(g)-1].name}
function tsess(k){return team&&team.sessions&&team.sessions[k]||null}
function color(s){return s.cls==='h'?'var(--pulse)':s.cls==='l'?'var(--long)':'var(--test)'}
function drawChart(){
 var box=document.getElementById('chart');if(!box)return;
 var x=data[ui.sel]||{},list=filtered();
 var W=Math.max(320,Math.round(box.clientWidth||700)),H=300,pl=34,pr=8,top=18,hb=168,kt=226,kb=270;
 var vals=[];list.forEach(function(s){var v=x[s.k];if(v){if(v.avg!=null)vals.push(v.avg);if(v.max!=null)vals.push(v.max);var ts=tsess(s.k);if(ts&&ts.avg!=null)vals.push(ts.avg)}});
 if(!vals.length){box.innerHTML='<div class="empty">Engar æfingar skráðar enn.</div>';return}
 var lo=Math.floor((Math.min.apply(null,vals)-8)/10)*10,hi=Math.ceil((Math.max.apply(null,vals)+6)/10)*10;
 var y=function(v){return hb-(v-lo)/(hi-lo)*(hb-top)};
 var step=(W-pl-pr)/list.length,cx=function(i){return pl+step*(i+.5)};
 var km=0;list.forEach(function(s){var v=x[s.k];if(v&&v.kcal>km)km=v.kcal});
 var pk=ui.pick&&x[ui.pick]?ui.pick:null;if(!pk){for(var j=list.length-1;j>=0;j--)if(x[list[j].k]){pk=list[j].k;break}}
 var tick=(hi-lo)>60?20:10,svg='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Púls og kaloríur á hverri æfingu">';
 list.forEach(function(s,i){if(s.k===pk)svg+='<rect x="'+(cx(i)-step/2+1)+'" y="4" width="'+(step-2)+'" height="'+(H-6)+'" rx="8" fill="var(--soft)"/>'});
 for(var t=lo;t<=hi;t+=tick){svg+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y(t)+'" y2="'+y(t)+'" stroke="var(--line)" stroke-width="1"/><text x="'+(pl-6)+'" y="'+(y(t)+4)+'" text-anchor="end" font-size="11" fill="var(--muted)">'+t+'</text>'}
 svg+='<text x="'+(pl-6)+'" y="'+(kt-6)+'" text-anchor="end" font-size="10" fill="var(--muted)">kcal</text>';
 var fs=step<34?10:12;
 list.forEach(function(s,i){
  var v=x[s.k],c=color(s),X=cx(i);
  var tsv=tsess(s.k);if(v&&tsv&&tsv.avg!=null){var tw=Math.min(step*.7,34);svg+='<line x1="'+(X-tw/2)+'" x2="'+(X+tw/2)+'" y1="'+y(tsv.avg)+'" y2="'+y(tsv.avg)+'" stroke="var(--muted)" stroke-width="2.5" stroke-dasharray="4 3" stroke-linecap="round"/>'}
  if(v){
   if(v.avg!=null&&v.max!=null)svg+='<line x1="'+X+'" x2="'+X+'" y1="'+y(v.avg)+'" y2="'+y(v.max)+'" stroke="'+c+'" stroke-width="3" stroke-linecap="round"/>';
   if(v.max!=null)svg+='<circle cx="'+X+'" cy="'+y(v.max)+'" r="5" fill="var(--surface)" stroke="'+c+'" stroke-width="2.5"/><text x="'+X+'" y="'+(y(v.max)-9)+'" text-anchor="middle" font-size="'+fs+'" font-weight="600" fill="var(--ink)">'+v.max+'</text>';
   if(v.avg!=null)svg+='<circle cx="'+X+'" cy="'+y(v.avg)+'" r="5.5" fill="'+c+'"/><text x="'+X+'" y="'+(y(v.avg)+18)+'" text-anchor="middle" font-size="'+fs+'" fill="var(--muted)">'+v.avg+'</text>';
   if(v.kcal!=null&&km){var bw=Math.min(step*.55,28),bh=Math.max(2,v.kcal/km*(kb-kt));svg+='<rect x="'+(X-bw/2)+'" y="'+(kb-bh)+'" width="'+bw+'" height="'+bh+'" rx="3" fill="'+c+'" opacity=".35"/>';if(step>=30)svg+='<text x="'+X+'" y="'+(kb-bh-4)+'" text-anchor="middle" font-size="10" fill="var(--muted)">'+v.kcal+'</text>'}
  }else{svg+='<text x="'+X+'" y="'+((top+hb)/2)+'" text-anchor="middle" font-size="11" fill="var(--muted)">—</text>'}
  svg+='<text x="'+X+'" y="'+(H-14)+'" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink)">V'+s.w+'</text><text x="'+X+'" y="'+(H-1)+'" text-anchor="middle" font-size="'+(step<40?9:11)+'" fill="'+c+'" font-weight="600">'+s.short+'</text>';
  svg+='<rect class="hit" data-act="pick" data-k="'+s.k+'" x="'+(X-step/2)+'" y="0" width="'+step+'" height="'+H+'" fill="transparent"/>';
 });
 box.innerHTML=svg+'</svg>';
}

function teamView(){
 var gl=[['all','Allir']].concat(GROUPS.map(function(g){return[String(g.id),g.name]})),pre='<div class="chips" role="group" aria-label="Veldu hóp">';
 gl.forEach(function(g){pre+='<button class="chip sm" data-act="tgroup" data-g="'+g[0]+'" aria-pressed="'+(ui.tgroup===g[0])+'">'+g[1]+'</button>'});pre+='</div>';
 var rows=inGroup(ui.tgroup).map(function(a){var x=data[a.id]||{};var t1a=x.w1t1&&x.w1t1.min,t1b=x.w5t1&&x.w5t1.min,c1=total(x.w1t2),c5=total(x.w5t2);
  return{a:a,x:x,d1:(t1a!=null&&t1b!=null)?t1b-t1a:null,d2:(c1!=null&&c5!=null)?c5-c1:null}});
 var avg=function(k){var v=rows.filter(function(r){return r[k]!=null});return v.length?v.reduce(function(s,r){return s+r[k]},0)/v.length:null};
 var a1=avg('d1'),a2=avg('d2'),done=rows.reduce(function(s,r){return s+countDone(r.x)},0);
 var html=pre+'<section class="stats">'+stat('Meðaltal hóps · Próf 1',a1!=null?'<span class="'+cls(a1)+'">'+sign(a1,fmtMin)+'</span>':'—',a1!=null?'Lengur í stigvaxandi prófinu':'Eftir endurpróf í viku 5');
 html+=stat('Meðaltal hóps · Próf 2',a2!=null?'<span class="'+cls(a2)+'">'+sign(Math.round(a2))+'</span>':'—',a2!=null?'Fleiri kaloríur í 3 × 10 mín':'Eftir endurpróf í viku 5');
 html+=stat('Skráðar æfingar',done+'<span style="font-size:.55em;color:var(--muted)"> / '+(rows.length*10)+'</span>',(ui.tgroup==='all'?'Allir iðkendur':gl.filter(function(g){return g[0]===ui.tgroup})[0][1])+', allar vikur')+'</section>';
 html+='<div class="grid2">'+board('Mesta bæting · Próf 1','Auka mínútur í stigvaxandi prófinu, frá viku 1 til viku 5.',rows,'d1',function(n){return sign(n,fmtMin)},'')+board('Mesta bæting · Próf 2','Auka kaloríur á öllum þremur tækjunum.',rows,'d2',function(n){return sign(n)},'long')+'</div>';
 html+='<section class="card"><h3>Mæting</h3><p class="desc">Einn punktur fyrir hverja æfingu, vikur 1 til 5.</p><div class="dots">';
 rows.forEach(function(r){html+='<div class="drow"><span class="bname" style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(r.a.name)+'</span><div class="dd">';
  SESSIONS.forEach(function(s){html+='<i class="'+s.cls+(r.x[s.k]?' on':'')+'" title="Vika '+s.w+' · '+esc(s.label)+'"></i>'});
  html+='</div><span class="num" style="color:var(--muted);text-align:right">'+countDone(r.x)+'/10</span></div>'});
 return html+'</div><div class="legend" style="margin-top:12px"><span><i class="sw" style="background:var(--test)"></i>Próf</span><span><i class="sw" style="background:var(--pulse)"></i>Þriðjudagur</span><span><i class="sw" style="background:var(--long)"></i>Fimmtudagur</span></div></section>';
}
function board(title,desc,rows,k,fmt,extra){
 var r=rows.slice().sort(function(a,b){if(a[k]==null)return 1;if(b[k]==null)return-1;return b[k]-a[k]});
 var mx=0;r.forEach(function(q){if(q[k]!=null&&Math.abs(q[k])>mx)mx=Math.abs(q[k])});
 var html='<section class="card"><h3>'+title+'</h3><p class="desc">'+desc+'</p>';
 if(!mx&&!r.some(function(q){return q[k]!=null}))return html+'<div class="empty">Birtist þegar niðurstöður úr viku 1 og viku 5 eru komnar.</div></section>';
 html+='<div class="board">';
 r.forEach(function(q,i){html+='<div class="brow" data-act="sel" data-id="'+q.a.id+'" data-go="1" role="button" tabindex="0"><span class="rank num">'+(q[k]!=null?i+1:'')+'</span><span class="bname">'+esc(q.a.name)+'</span><span class="btrack '+extra+'"><i style="width:'+(q[k]!=null&&mx?Math.max(3,Math.max(0,q[k])/mx*100):0)+'%"></i></span><span class="bv num '+cls(q[k])+'">'+(q[k]!=null?fmt(q[k]):'—')+'</span></div>'});
 return html+'</div></section>';
}

function loginView(){
 var html='<section class="card login"><h3>Opnaðu þínar niðurstöður</h3><p class="desc">Sláðu inn kóðann sem þjálfarinn gaf þér.</p><form id="login-form" class="login-form" autocomplete="off"><label class="f" for="login-code">Kóðinn þinn<input id="login-code" class="code-in" autocapitalize="characters" autocorrect="off" spellcheck="false" maxlength="9" placeholder="XXXX-XXXX"></label><label class="remember" for="login-remember"><input id="login-remember" type="checkbox" checked> Muna eftir mér á þessu tæki</label><button class="btn" type="submit"'+(busy?' disabled':'')+'>'+(busy==='code'?'Opna…':'Opna')+'</button></form>'+(loginErr?'<p class="err" role="alert">'+esc(loginErr)+'</p>':'')+'</section>';
 html+='<div class="coach-login"><button class="btn ghost" data-act="coach-login">Þjálfari? Skráðu þig inn með Google</button>'+
  (showPw?'<form id="pw-form" class="pw-form" autocomplete="on"><label class="f" for="pw-email">Netfang þjálfara<input id="pw-email" type="email" autocomplete="username" value="'+esc(COACH_EMAILS[0]||'')+'"></label><label class="f" for="pw-pass">Lykilorð<input id="pw-pass" type="password" autocomplete="current-password"></label><button class="btn" type="submit"'+(busy?' disabled':'')+'>Skrá inn</button>'+(pwLoginErr?'<p class="err" role="alert" style="margin:0">'+esc(pwLoginErr)+'</p>':'')+'</form>':'<button class="linkbtn" data-act="show-pw">Í síma? Skráðu þig inn með lykilorði</button>')+'</div>';
 return html;
}
function tryLogin(){var c=document.getElementById('login-code').value,rem=document.getElementById('login-remember').checked;loginErr='';openCode(c,rem)}

function coachView(){
 var s=SESSIONS.filter(function(q){return q.k===ui.coachSession})[0]||SESSIONS[0];
 var zf=[['z5','Svæði 5<small>mín:sek</small>'],['z4','Svæði 4<small>mín:sek</small>'],['z3','Svæði 3<small>mín:sek</small>'],['z2','Svæði 2<small>mín:sek</small>'],['z1','Svæði 1<small>mín:sek</small>']];
 var real=data;
 var fields;
 if(s.type==='t1'){fields=[];for(var si=1;si<=NSTEPS;si++)fields.push(['s'+si,si+'<small>'+rpmFor(si)+' rpm</small>']);fields.push(['max','Hámarkspúls'],['rec','Púls 1 mín<small>eftir próf</small>'])}
 else if(s.type==='t2'){fields=[['max','Hámarkspúls']];MACHINES.forEach(function(m){fields.push([m[0],m[1]+' kal'])})}
 else fields=[['avg','Meðalpúls'],['max','Hámarkspúls'],['kcal','Heildarkal.<small>úr Polar</small>']].concat(s.type==='thu'?[['mkcal','Kal á tækjum<small>öll sett samtals</small>']]:[]);
 var zon=!!ui.zones;try{if(ui.zones==null)zon=localStorage.getItem('tt-zones')==='1'}catch(e){}
 if(zon)fields=fields.concat(zf);
 var html='';
 if(!state.athletes.length)html+='<div class="banner"><b>Byrjaðu á að bæta við iðkendum</b> neðar á síðunni. Hver iðkandi fær sinn eigin kóða sem þú sendir honum.</div>';
 html+='<section class="card"><div class="coach-top"><div><h3>Skrá niðurstöður</h3><p class="desc" style="margin-bottom:0">Veldu æfingu, sláðu inn tölur hvers iðkanda úr Polar og vistaðu. Skildu línu eftir auða ef einhver mætti ekki.'+(zon?' Tími í svæðum er í sömu röð og hjá Polar (svæði 5 efst), skráður eins og Polar sýnir hann, t.d. 22:16.':'')+(s.type==='t1'?' Í Prófi 1 er einn reitur fyrir hverja mínútu. Skrifaðu púlsinn fyrir hverja mínútu sem iðkandinn kláraði. Fjöldi útfylltra reita segir hvað hann kláraði margar mínútur og hvaða RPM, og hæsti púlsinn fer í hámarkspúls ef þú skrifar ekki annað. „Púls 1 mín“ er púlsinn 60 sekúndum eftir að iðkandinn hætti.':'')+'</p></div><div class="coach-sel"><label class="remember zone-toggle" for="c-zones"><input id="c-zones" type="checkbox"'+(zon?' checked':'')+'> Skrá tíma í púlssvæðum</label><label class="f" for="c-group">Hópur<select id="c-group">'+groupOpts(ui.egroup)+'<option value="all"'+(ui.egroup==='all'?' selected':'')+'>Allir</option></select></label><label class="f" for="c-session">Æfing<select id="c-session">';
 var elist=inGroup(ui.egroup);
 SESSIONS.forEach(function(q){var n=elist.filter(function(a){return real[a.id]&&real[a.id][q.k]}).length;html+='<option value="'+q.k+'"'+(q.k===s.k?' selected':'')+'>Vika '+q.w+' · '+q.label+(n?' ('+n+' skráðir)':'')+'</option>'});
 html+='</select></label></div></div>'+(ui.egroup!=='all'&&isRemote(ui.egroup)?'<p class="desc" style="margin-top:12px">Iðkendur í þessum hópi skrá sjálfir. Hér geturðu leiðrétt tölurnar þeirra.</p>':'')+'<div class="tablewrap"><table class="entry'+(s.type==='t1'?' steps':'')+'"><thead><tr><th>Iðkandi</th>';
 fields.forEach(function(f){html+='<th>'+f[1]+'</th>'});
 html+='</tr></thead><tbody>';
 elist.forEach(function(a){
  var cur=(real[a.id]&&real[a.id][s.k])||{},dr=(draft[s.k]&&draft[s.k][a.id])||{};
  html+='<tr><td>'+esc(a.name)+(s.type==='t1'?'<small class="done num" id="done-'+s.k+'-'+a.id+'">'+doneText(rowStages(cur,dr))+'</small>':'')+'</td>';
  fields.forEach(function(f){var sm=/^s(\d+)$/.exec(f[0]);var v=dr[f[0]]!=null?dr[f[0]]:sm?(cur.stages&&cur.stages[sm[1]-1]!=null?cur.stages[sm[1]-1]:''):(cur[f[0]]!=null?(/^z[1-5]$/.test(f[0])?fmtTime(cur[f[0]]):cur[f[0]]):'');
   html+='<td><input id="in-'+s.k+'-'+a.id+'-'+f[0]+'" data-s="'+s.k+'" data-a="'+a.id+'" data-f="'+f[0]+'" inputmode="'+(/^z/.test(f[0])?'text':'numeric')+'"'+(sm?' class="step-in" maxlength="3"':/^z/.test(f[0])?' class="zone-in"':'')+' value="'+esc(v)+'" aria-label="'+esc(a.name)+' '+f[1].replace(/<[^>]+>/g,' ')+'"></td>'});
  html+='</tr>';
 });
 html+='</tbody></table></div><div class="actions"><button class="btn" data-act="save"'+(saving?' disabled':'')+'>'+(saving?'Vista…':'Vista æfingu')+'</button><span class="status">Vistast beint. Iðkendur sjá tölurnar strax.</span></div></section>';
 html+='<section class="card"><h3>Iðkendur og kóðar</h3><p class="desc">Sendu hverjum iðkanda kóðann sinn eða hlekkinn. Kóðinn opnar aðeins hans eigin síðu. Ef kóði fer á flakk býrðu til nýjan og sá gamli hættir að virka.</p>';
 var kg=ui.kgroup||'all',klist=kg==='all'?state.athletes:inGroup(kg);
 html+='<div class="gtabs" role="tablist" aria-label="Sía eftir hópi">';
 GTABS.forEach(function(g){html+='<button class="gtab'+(GROUPS[g-1].remote?' remote':'')+'" role="tab" data-act="kgroup" data-g="'+g+'" aria-selected="'+(String(kg)===String(g))+'" title="'+esc(GROUPS[g-1].name)+'">'+GROUPS[g-1].short+' <small>'+inGroup(g).length+'</small></button>'});
 html+='<button class="gtab" role="tab" data-act="kgroup" data-g="all" aria-selected="'+(kg==='all')+'">Allir <small>'+state.athletes.length+'</small></button></div>';
 if(kg!=='all')html+='<div class="gtab-name">'+esc(GROUPS[kg-1].name)+'</div>';
 if(state.athletes.length&&!klist.length)html+='<p class="desc">Engir iðkendur í þessum hópi enn. Bættu þeim við hér fyrir neðan.</p>';
 if(klist.length){
  html+='<div class="tablewrap"><table class="entry codes"><thead><tr><th>Nafn</th><th>Hópur</th><th>Kóði</th><th></th></tr></thead><tbody>';
  klist.forEach(function(a){var nv=renames[a.id]!=null?renames[a.id]:a.name;
   html+='<tr><td><input id="rn-'+a.id+'" data-rename="'+a.id+'" value="'+esc(nv)+'" aria-label="Nafn"></td><td><select id="rg-'+a.id+'" data-regroup="'+a.id+'" aria-label="Hópur">'+groupOpts(regroups[a.id]||gid(a.group))+'</select></td><td class="code num">'+a.id+'</td><td class="row-actions"><button class="btn ghost sm" data-act="copy" data-id="'+a.id+'">'+(copied===a.id?'Afritað ✓':'Afrita hlekk')+'</button><button class="btn ghost sm" data-act="regen" data-id="'+a.id+'">Nýr kóði</button><button class="btn ghost sm danger" data-act="remove" data-id="'+a.id+'">'+(confirmDel===a.id?'Ýttu aftur til að eyða':'Fjarlægja')+'</button></td></tr>'});
  html+='</tbody></table></div><div class="actions"><button class="btn" data-act="save-names"'+(busy?' disabled':'')+'>Vista breytingar</button></div>';
 }
 html+='<div class="add-athletes"><label class="f" for="new-names">Bæta við iðkendum<textarea id="new-names" rows="4" placeholder="Eitt nafn í hverja línu">'+esc(newNames)+'</textarea></label><div class="actions" style="margin-top:8px"><select id="new-group" aria-label="Hópur nýrra iðkenda">'+groupOpts(newGroup,'Í ')+'</select><button class="btn" data-act="add-athletes"'+(busy?' disabled':'')+'>Bæta við</button></div></div></section>';
 var cu=fauth&&fauth.currentUser,hasPw=cu&&(cu.providerData||[]).some(function(p){return p.providerId==='password'});
 html+='<section class="card"><h3>Innskráning í síma og iPad</h3><p class="desc">Google-innskráning virkar ekki alltaf í símum. Settu lykilorð hér og notaðu svo <b>Í síma? Skráðu þig inn með lykilorði</b> á innskráningarskjánum, með netfanginu '+esc(cu&&cu.email||'')+'.'+(hasPw?' <span class="up">Lykilorð er þegar sett.</span> Þú getur breytt því hér.':'')+'</p><div class="self-grid"><label class="f" for="np1">'+(hasPw?'Nýtt lykilorð':'Lykilorð')+'<input id="np1" type="password" autocomplete="new-password"></label><label class="f" for="np2">Aftur<input id="np2" type="password" autocomplete="new-password"></label></div><div class="actions"><button class="btn" data-act="set-pw"'+(busy?' disabled':'')+'>Vista lykilorð</button></div>'+(pwErr?'<p class="err">'+esc(pwErr)+'</p>':'')+(pwMsg?'<p class="ok">'+esc(pwMsg)+'</p>':'')+'</section>';
 html+='<section class="card"><h3>Titill og afrit</h3><p class="desc">Titillinn birtist efst á síðunni hjá öllum.</p><label class="f" for="n-project">Titill verkefnis<input id="n-project" value="'+esc(renames.__title!=null?renames.__title:state.project)+'"></label><div class="actions"><button class="btn" data-act="save-title"'+(busy?' disabled':'')+'>Vista titil</button><button class="btn ghost" data-act="backup">Sækja afrit (JSON)</button></div><p class="desc" style="margin-top:10px">Afritið er skrá með öllum gögnum. Gott að sækja það í lok hverrar viku.</p></section>';
 return html;
}

function athleteRef(id){return db.collection('athletes').doc(id)}
// ---------- Æfingaplan ----------
function loadPlan(){if(!db)return;db.collection('meta').doc('plan').get().then(function(d){if(d.exists){var v=d.data();plan={g1:v.g1||{},g2:v.g2||{},g3:v.g3||{},g4:v.g4||{},week:v.week||{}};render()}}).catch(function(){})}
function planItem(group,k){var g=plan['g'+gid(group)]||{};return g[k]||null}
function isHead(t){return t.length>2&&t===t.toUpperCase()&&/[A-ZÁÐÉÍÓÚÝÞÆÖ]/.test(t)&&!/^[•~]/.test(t)&&!/@/.test(t)}
function fx(s){return esc(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')}
function fmtLines(lines,inBody){var body=!!inBody;return lines.map(function(l){var t=l.trim();if(!t)return'';
 if(isHead(t.replace(/\*\*/g,''))){body=true;return'<div class="ft-h">'+esc(t.replace(/\*\*/g,''))+'</div>'}
 if(/^~/.test(t))return'<div class="ft-note">'+fx(t.slice(1).trim())+'</div>';
 if(/^•\s?/.test(t))return'<div class="ft-li">'+fx(t.replace(/^•\s?/,''))+'</div>';
 var whole=/^\*\*([^*]+)\*\*$/.exec(t),sb=whole?' ft-strong':'';if(whole)t=whole[1];
 if(!body)return'<div class="ft-p'+sb+'">'+fx(t)+'</div>';
 var m=t.match(/^(.*?)\s*@\s*(.+)$/),cls='ft-row'+sb+(/90\+|90–|MAX|85–9/i.test(t)?' hot':'')+(/hvíld/i.test(t)?' rest':'');
 if(m)return'<div class="'+cls+'"><span>'+fx(m[1])+'</span><b>@ '+fx(m[2])+'</b></div>';
 return'<div class="'+cls+'"><span>'+fx(t)+'</span></div>'}).join('')}
function fmtText(t){return'<div class="ft">'+fmtLines(String(t).split('\n'))+'</div>'}
function fmtCompact(t){
 var blocks=[],cur={h:null,lines:[]};String(t).split('\n').forEach(function(l){var x=l.trim();if(x&&x===x.toUpperCase()&&/[A-ZÁÐÉÍÓÚÝÞÆÖ]/.test(x)&&!/^•/.test(x)){blocks.push(cur);cur={h:x,lines:[]}}else cur.lines.push(l)});blocks.push(cur);
 var main=blocks.filter(function(b){return b.h&&/^(AÐALÆFING|PRÓF)/.test(b.h)})[0];
 if(!main||blocks.length<3)return fmtText(t);
 var head=blocks[0].lines,rest=blocks.slice(1).filter(function(b){return b!==main});
 return'<div class="ft">'+fmtLines(head)+'<div class="ft-h">'+esc(main.h)+'</div>'+fmtLines(main.lines,true)+'</div><details class="ft-more"><summary>Upphitun, teygjur og cooldown</summary><div class="ft">'+rest.map(function(b){return(b.h?'<div class="ft-h">'+esc(b.h)+'</div>':'')+fmtLines(b.lines,true)}).join('')+'</div></details>';
}
var BOX_PLAN={"inhouse": {"w1t1": {"title": "Próf 1 · Hámarkspúlspróf", "text": "Mælum hámarkspúls og hve lengi þú endist.\n\nUPPHITUN\n3 mín @ 60–65%\n3 mín @ 65–70%\n3 mín @ 70–75%\n2 mín @ 75–80%\n~Allir saman, svo hitar hvert holl aftur upp rétt fyrir prófið\n\nTEYGJUFLÆÐI\nSpiderman + reach\nDúfan\nVindmyllur\nBolvindur\n\nPRÓF · ASSAULT BIKE\nMín 1–6: 50 → 60 rpm (+2 rpm á mín)\nMín 7+: +1 rpm á mín (61, 62, 63 …)\nLokið: 2–3 rpm undir í 5+ sek\n1 mín @ hvíld → skrá púls\n~RPM = snúningar á mínútu: hve marga hringi pedalarnir fara á einni mínútu. Sést á skjá hjólsins.\n\nSKIPULAG\n3 holl: Próf · Skrá · Upphitun\nUmferð 1: A próf · B skrá · C upphitun\nUmferð 2: C próf · A skrá · B upphitun\nUmferð 3: B próf · C skrá · A cooldown\n\nSKRÁSETJARI SKRÁIR\nPúls í lok hverrar mín\nSíðasta kláraða mín og rpm\nHámarkspúls\nPúls 1 mín eftir\n\nCOOLDOWN\n5 mín mjög rólegt tæki\n\n~Prófið er valfrjálst og aðeins fyrir þá sem geta örugglega tekið hámarkspróf."}, "w1t2": {"title": "Próf 2 · 3 × 10 mín MAX kal", "text": "Eins margar kaloríur og þú getur á hverju tæki.\n\nUPPHITUN\n3 mín @ 60–65%\n3 mín @ 65–70%\n3 mín @ 70–75%\n~Eitt tæki í hverri línu, sama röð og í prófinu\n\nTEYGJUFLÆÐI\nSpiderman + reach\nDúfan\nVindmyllur\nBolvindur\n\nPRÓF\n10 mín MAX kal · tæki 1\n20 sek @ hvíld (skipta um tæki)\n10 mín MAX kal · tæki 2\n20 sek @ hvíld (skipta um tæki)\n10 mín MAX kal · tæki 3\n~Bara 20 sek á milli tækja, svo púlsinn nær ekki að falla. Hafðu næsta tæki tilbúið (sæti og fótstig stillt).\n\nHÓPAR\nA: BikeErg → RowErg → Assault\nB: RowErg → Assault → BikeErg\nC: Assault → BikeErg → RowErg\n~Sami hópur í viku 1 og viku 5!\n\nCOOLDOWN\n3 mín rólegt tæki\n\nHEIMAVINNA · VALFRJÁLST\n30 mín @ 60–70% (zone 2)\n~Ganga upp brekkur, hjól, skokk, róður, skíði eða sund. Andaðu með nefinu og haltu jöfnum hraða.\n~Um helgina eða á mánudag. Gott að byrja rólega eftir prófin.\n\n~Skráðu kaloríur á hverju tæki. Ekki byrja of hratt, fyrstu 2 mínúturnar kosta mest í lokin."}, "w2tue": {"title": "Púlsbylgjur · 3 × 7 mín", "text": "6 mín á 90+%\n\nUPPHITUN\n3 mín @ 60–65%\n3 mín @ 65–70%\n3 mín @ 70–75%\n2 mín @ 75–80%\n2 mín @ 80–85%\n2 mín @ 80–85%\n~Skipta um tæki eftir hverja línu\n\nTEYGJUFLÆÐI\nSpiderman + reach\nDúfan\nVindmyllur\nBolvindur\n\nAÐALÆFING · 3 × 7 MÍN\n1 mín @ 75–80%\n2 mín @ 80–85%\n1 mín @ 90+%\n2 mín @ 80–85%\n1 mín @ 90+%\n2–3 mín @ hvíld (skipta um tæki)\n~Fókus á öndun og að lækka púlsinn\n~Eitt sett á hverju tæki\n\nCOOLDOWN\n3 mín rólegt tæki"}, "w2thu": {"title": "Jafnt þol · 2 × 15 mín", "text": "30 mín: fyrri umferð 75–80%, seinni 80–85%. Aldrei yfir 85%.\n\nUPPHITUN\n3 mín @ 70–75%\n3 mín @ 70–75%\n3 mín @ 70–75%\n2 mín @ 75–80%\n2 mín @ 75–80%\n2 mín @ 75–80%\n~Skipta um tæki eftir hverja línu\n\nTEYGJUFLÆÐI\nSpiderman + reach\nDúfan\nVindmyllur\nBolvindur\n\nAÐALÆFING · 2 × 15 MÍN\n5 mín tæki 1 @ 75–80%\n5 mín tæki 2 @ 75–80%\n5 mín tæki 3 @ 75–80%\n2 mín @ hvíld\n5 mín tæki 1 @ 80–85%\n5 mín tæki 2 @ 80–85%\n5 mín tæki 3 @ 80–85%\n~20 sek skipting á milli tækja\n~🎯 Skrifaðu niður kaloríurnar á tækinu eftir hvert sett og leggðu saman. Reyndu að slá síðasta fimmtudag á sama púlsi.\n\nCOOLDOWN\n3 mín rólegt tæki\n\nHEIMAVINNA · VALFRJÁLST\n30–40 mín @ 60–70% (zone 2)\n~Ganga upp brekkur, hjól, skokk, róður, skíði eða sund. Andaðu með nefinu og haltu jöfnum hraða.\n~Um helgina eða á mánudag, ekki daginn fyrir þriðjudagsæfinguna ef þú ert þreytt/ur."}, "w3tue": {"title": "Stýrðir intervalar · 6 × 5 mín", "text": "12 mín á 90+%\n\nUPPHITUN\n3 mín @ 60–65%\n3 mín @ 65–70%\n3 mín @ 70–75%\n2 mín @ 75–80%\n2 mín @ 80–85%\n2 mín @ 80–85%\n~Skipta um tæki eftir hverja línu\n\nTEYGJUFLÆÐI\nSpiderman + reach\nDúfan\nVindmyllur\nBolvindur\n\nAÐALÆFING · 6 × 5 MÍN\n1 mín @ 75–80%\n1 mín @ 80–85%\n1 mín @ 90–92%\n1 mín @ 85–90%\n1 mín @ 90+%\n2–3 mín @ hvíld (skipta um tæki)\n~Fókus á öndun og að lækka púlsinn\n~Tvö sett á hverju tæki\n\nCOOLDOWN\n3 mín rólegt tæki"}, "w3thu": {"title": "Lengri þollotur · 2 × 18 mín", "text": "36 mín: fyrri umferð 75–80%, seinni 80–85%. Endað á finisher.\n\nUPPHITUN\n3 mín @ 70–75%\n3 mín @ 70–75%\n3 mín @ 70–75%\n2 mín @ 75–80%\n2 mín @ 75–80%\n2 mín @ 75–80%\n~Skipta um tæki eftir hverja línu\n\nTEYGJUFLÆÐI\nSpiderman + reach\nDúfan\nVindmyllur\nBolvindur\n\nAÐALÆFING · 2 × 18 MÍN\n6 mín tæki 1 @ 75–80%\n6 mín tæki 2 @ 75–80%\n6 mín tæki 3 @ 75–80%\n2 mín @ hvíld\n6 mín tæki 1 @ 80–85%\n6 mín tæki 2 @ 80–85%\n6 mín tæki 3 @ 80–85%\n~20 sek skipting á milli tækja\n~🎯 Skrifaðu niður kaloríurnar á tækinu eftir hvert sett og leggðu saman. Reyndu að slá síðasta fimmtudag á sama púlsi.\n\nFINISHER · 3 × 90 SEK\n30 sek @ MAX · Assault Bike\n30 sek air squat\n30 sek @ hvíld\n~Í squat og hvíld: andaðu og náðu púlsinum niður\n\nCOOLDOWN\n3 mín rólegt tæki\n\nHEIMAVINNA · VALFRJÁLST\n35–45 mín @ 60–70% (zone 2)\n~Ganga upp brekkur, hjól, skokk, róður, skíði eða sund. Andaðu með nefinu og haltu jöfnum hraða.\n~Um helgina eða á mánudag. Þessi æfing byggir grunnþolið mest."}, "w4tue": {"title": "Lengri intervalar · 3 × 10 mín", "text": "18 mín á 90+% · erfiðasta æfingin\n\nUPPHITUN\n3 mín @ 60–65%\n3 mín @ 65–70%\n3 mín @ 70–75%\n2 mín @ 75–80%\n2 mín @ 80–85%\n2 mín @ 80–85%\n~Skipta um tæki eftir hverja línu\n\nTEYGJUFLÆÐI\nSpiderman + reach\nDúfan\nVindmyllur\nBolvindur\n\nAÐALÆFING · 3 × 10 MÍN\n1 mín @ 75–80%\n1 mín @ 80–85%\n3 mín @ 90+%\n1 mín @ 75–80%\n1 mín @ 80–85%\n3 mín @ 90+%\n2–3 mín @ hvíld (skipta um tæki)\n~Fókus á öndun og að lækka púlsinn\n~Eitt sett á hverju tæki\n\nCOOLDOWN\n3 mín rólegt tæki"}, "w4thu": {"title": "Stigvaxandi púls · 9 × 4 mín", "text": "36 mín þar sem álagið eykst á þriggja lotu fresti.\n\nUPPHITUN\n3 mín @ 70–75%\n3 mín @ 70–75%\n3 mín @ 70–75%\n2 mín @ 75–80%\n2 mín @ 75–80%\n2 mín @ 75–80%\n~Skipta um tæki eftir hverja línu\n\nTEYGJUFLÆÐI\nSpiderman + reach\nDúfan\nVindmyllur\nBolvindur\n\nAÐALÆFING · 9 × 4 MÍN\nLotur 1–3: 4 mín @ 75–80%\nLotur 4–6: 4 mín @ 80–85%\nLotur 7–9: 4 mín @ 85–88%\n~20 sek skipting á milli tækja\n~Þrjár lotur á hverju tæki\n~🎯 Skrifaðu niður kaloríurnar á tækinu eftir hvert sett og leggðu saman. Reyndu að slá síðasta fimmtudag á sama púlsi.\n\nCOOLDOWN\n3 mín rólegt tæki\n\nHEIMAVINNA · VALFRJÁLST\n20–30 mín @ 60–70% (zone 2)\n~Ganga upp brekkur, hjól, skokk, róður, skíði eða sund. Andaðu með nefinu og haltu jöfnum hraða.\n~Mjög rólegt. Prófin eru í næstu viku, svo ekki meira en þetta."}, "w5t1": {"title": "Próf 1 · Hámarkspúlspróf", "text": "Endurpróf. Nákvæmlega eins og í viku 1.\n\nUPPHITUN\n3 mín @ 60–65%\n3 mín @ 65–70%\n3 mín @ 70–75%\n2 mín @ 75–80%\n~Allir saman, svo hitar hvert holl aftur upp rétt fyrir prófið\n\nTEYGJUFLÆÐI\nSpiderman + reach\nDúfan\nVindmyllur\nBolvindur\n\nPRÓF · ASSAULT BIKE\nMín 1–6: 50 → 60 rpm (+2 rpm á mín)\nMín 7+: +1 rpm á mín (61, 62, 63 …)\nLokið: 2–3 rpm undir í 5+ sek\n1 mín @ hvíld → skrá púls\n~RPM = snúningar á mínútu: hve marga hringi pedalarnir fara á einni mínútu. Sést á skjá hjólsins.\n\nSKIPULAG\n3 holl: Próf · Skrá · Upphitun\nUmferð 1: A próf · B skrá · C upphitun\nUmferð 2: C próf · A skrá · B upphitun\nUmferð 3: B próf · C skrá · A cooldown\n\nSKRÁSETJARI SKRÁIR\nPúls í lok hverrar mín\nSíðasta kláraða mín og rpm\nHámarkspúls\nPúls 1 mín eftir\n\nCOOLDOWN\n5 mín mjög rólegt tæki\n\n~Prófið er valfrjálst og aðeins fyrir þá sem geta örugglega tekið hámarkspróf."}, "w5t2": {"title": "Próf 2 · 3 × 10 mín MAX kal", "text": "Endurpróf. Sami hópur, sama röð og í viku 1.\n\nUPPHITUN\n3 mín @ 60–65%\n3 mín @ 65–70%\n3 mín @ 70–75%\n~Eitt tæki í hverri línu, sama röð og í prófinu\n\nTEYGJUFLÆÐI\nSpiderman + reach\nDúfan\nVindmyllur\nBolvindur\n\nPRÓF\n10 mín MAX kal · tæki 1\n20 sek @ hvíld (skipta um tæki)\n10 mín MAX kal · tæki 2\n20 sek @ hvíld (skipta um tæki)\n10 mín MAX kal · tæki 3\n~Bara 20 sek á milli tækja, svo púlsinn nær ekki að falla. Hafðu næsta tæki tilbúið (sæti og fótstig stillt).\n\nHÓPAR\nA: BikeErg → RowErg → Assault\nB: RowErg → Assault → BikeErg\nC: Assault → BikeErg → RowErg\n~Sami hópur í viku 1 og viku 5!\n\nCOOLDOWN\n3 mín rólegt tæki\n\n~Skráðu kaloríur á hverju tæki. Ekki byrja of hratt, fyrstu 2 mínúturnar kosta mest í lokin."}}, "remote": {"w1t1": {"title": "Próf 1 · Hámarkspúlspróf", "text": "Mælum hámarkspúls og hve lengi þú endist.\n\nUPPHITUN\n3 mín @ 60–65%\n3 mín @ 65–70%\n3 mín @ 70–75%\n2 mín @ 75–80%\n\nTEYGJUFLÆÐI\nSpiderman + reach\nDúfan\nVindmyllur\nBolvindur\n\nPRÓF · ASSAULT BIKE\nMín 1–6: 50 → 60 rpm (+2 rpm á mín)\nMín 7+: +1 rpm á mín (61, 62, 63 …)\nLokið: 2–3 rpm undir í 5+ sek\n1 mín @ hvíld → skrá púls\n~RPM = snúningar á mínútu: hve marga hringi pedalarnir fara á einni mínútu. Sést á skjá hjólsins.\n\nSKIPULAG\nFáðu félaga til að skrá, eða lestu af úrinu\n\nSKRÁNING\nPúls í lok hverrar mín\nSíðasta kláraða mín og rpm\nHámarkspúls\nPúls 1 mín eftir\n\nCOOLDOWN\n5 mín mjög rólegt tæki\n\n~Prófið er valfrjálst og aðeins fyrir þá sem geta örugglega tekið hámarkspróf."}, "w1t2": {"title": "Próf 2 · 3 × 10 mín MAX kal", "text": "Eins margar kaloríur og þú getur á hverju tæki.\n\nUPPHITUN\n3 mín @ 60–65%\n3 mín @ 65–70%\n3 mín @ 70–75%\n\nTEYGJUFLÆÐI\nSpiderman + reach\nDúfan\nVindmyllur\nBolvindur\n\nPRÓF\n10 mín MAX kal · tæki 1\n20 sek @ hvíld (skipta um tæki)\n10 mín MAX kal · tæki 2\n20 sek @ hvíld (skipta um tæki)\n10 mín MAX kal · tæki 3\n~Bara 20 sek á milli tækja, svo púlsinn nær ekki að falla. Hafðu næsta tæki tilbúið (sæti og fótstig stillt).\n\nTÆKI\n1, 2 eða 3 tæki að eigin vali: BikeErg, RowErg, Assault, SkiErg eða hlaupabretti\nBara eitt tæki? Notaðu það í öll þrjú skiptin\nSkráðu kaloríurnar sem tækið sýnir\n~Sömu tæki í sömu röð í viku 1 og viku 5\n\nCOOLDOWN\n3 mín rólegt tæki\n\nHEIMAVINNA · VALFRJÁLST\n30 mín @ 60–70% (zone 2)\n~Ganga upp brekkur, hjól, skokk, róður, skíði eða sund. Andaðu með nefinu og haltu jöfnum hraða.\n~Um helgina eða á mánudag. Gott að byrja rólega eftir prófin.\n\n~Skráðu kaloríur á hverju tæki. Ekki byrja of hratt, fyrstu 2 mínúturnar kosta mest í lokin."}, "w2tue": {"title": "Púlsbylgjur · 3 × 7 mín", "text": "6 mín á 90+%\nFjarþjálfun: notaðu 1, 2 eða 3 þoltæki að eigin vali (t.d. BikeErg, RowErg, Assault, SkiErg eða hlaupabretti). Ef þú notar bara eitt tæki sleppirðu tækjaskiptunum.\n\nUPPHITUN\n3 mín @ 60–65%\n3 mín @ 65–70%\n3 mín @ 70–75%\n2 mín @ 75–80%\n2 mín @ 80–85%\n2 mín @ 80–85%\n\nTEYGJUFLÆÐI\nSpiderman + reach\nDúfan\nVindmyllur\nBolvindur\n\nAÐALÆFING · 3 × 7 MÍN\n1 mín @ 75–80%\n2 mín @ 80–85%\n1 mín @ 90+%\n2 mín @ 80–85%\n1 mín @ 90+%\n2–3 mín @ hvíld (skipta um tæki)\n~Fókus á öndun og að lækka púlsinn\n~Eitt sett á hverju tæki\n~Í hvíldinni: andaðu djúpt inn um nefið og langt út. Náðu púlsinum niður og vertu tilbúin/n í næstu lotu.\n\nCOOLDOWN\n3 mín rólegt tæki"}, "w2thu": {"title": "Jafnt þol · 2 × 15 mín", "text": "30 mín: fyrri umferð 75–80%, seinni 80–85%. Aldrei yfir 85%.\nFjarþjálfun: notaðu 1, 2 eða 3 þoltæki að eigin vali (t.d. BikeErg, RowErg, Assault, SkiErg eða hlaupabretti). Ef þú notar bara eitt tæki sleppirðu tækjaskiptunum.\n\nUPPHITUN\n3 mín @ 70–75%\n3 mín @ 70–75%\n3 mín @ 70–75%\n2 mín @ 75–80%\n2 mín @ 75–80%\n2 mín @ 75–80%\n\nTEYGJUFLÆÐI\nSpiderman + reach\nDúfan\nVindmyllur\nBolvindur\n\nAÐALÆFING · 2 × 15 MÍN\n5 mín tæki 1 @ 75–80%\n5 mín tæki 2 @ 75–80%\n5 mín tæki 3 @ 75–80%\n2 mín @ hvíld\n5 mín tæki 1 @ 80–85%\n5 mín tæki 2 @ 80–85%\n5 mín tæki 3 @ 80–85%\n~20 sek skipting á milli tækja\n~🎯 Skrifaðu niður kaloríurnar á tækinu eftir hvert sett og leggðu saman. Reyndu að slá síðasta fimmtudag á sama púlsi.\n~Haltu jöfnum hraða innan hvers kafla og byrjaðu rólega. Markmiðið er að fara hraðar en halda sama púlsi, frá viku til viku.\n\nCOOLDOWN\n3 mín rólegt tæki\n\nHEIMAVINNA · VALFRJÁLST\n30–40 mín @ 60–70% (zone 2)\n~Ganga upp brekkur, hjól, skokk, róður, skíði eða sund. Andaðu með nefinu og haltu jöfnum hraða.\n~Um helgina eða á mánudag, ekki daginn fyrir þriðjudagsæfinguna ef þú ert þreytt/ur."}, "w3tue": {"title": "Stýrðir intervalar · 6 × 5 mín", "text": "12 mín á 90+%\nFjarþjálfun: notaðu 1, 2 eða 3 þoltæki að eigin vali (t.d. BikeErg, RowErg, Assault, SkiErg eða hlaupabretti). Ef þú notar bara eitt tæki sleppirðu tækjaskiptunum.\n\nUPPHITUN\n3 mín @ 60–65%\n3 mín @ 65–70%\n3 mín @ 70–75%\n2 mín @ 75–80%\n2 mín @ 80–85%\n2 mín @ 80–85%\n\nTEYGJUFLÆÐI\nSpiderman + reach\nDúfan\nVindmyllur\nBolvindur\n\nAÐALÆFING · 6 × 5 MÍN\n1 mín @ 75–80%\n1 mín @ 80–85%\n1 mín @ 90–92%\n1 mín @ 85–90%\n1 mín @ 90+%\n2–3 mín @ hvíld (skipta um tæki)\n~Fókus á öndun og að lækka púlsinn\n~Tvö sett á hverju tæki\n~Í hvíldinni: andaðu djúpt inn um nefið og langt út. Náðu púlsinum niður og vertu tilbúin/n í næstu lotu.\n\nCOOLDOWN\n3 mín rólegt tæki"}, "w3thu": {"title": "Lengri þollotur · 2 × 18 mín", "text": "36 mín: fyrri umferð 75–80%, seinni 80–85%. Endað á finisher.\nFjarþjálfun: notaðu 1, 2 eða 3 þoltæki að eigin vali (t.d. BikeErg, RowErg, Assault, SkiErg eða hlaupabretti). Ef þú notar bara eitt tæki sleppirðu tækjaskiptunum.\n\nUPPHITUN\n3 mín @ 70–75%\n3 mín @ 70–75%\n3 mín @ 70–75%\n2 mín @ 75–80%\n2 mín @ 75–80%\n2 mín @ 75–80%\n\nTEYGJUFLÆÐI\nSpiderman + reach\nDúfan\nVindmyllur\nBolvindur\n\nAÐALÆFING · 2 × 18 MÍN\n6 mín tæki 1 @ 75–80%\n6 mín tæki 2 @ 75–80%\n6 mín tæki 3 @ 75–80%\n2 mín @ hvíld\n6 mín tæki 1 @ 80–85%\n6 mín tæki 2 @ 80–85%\n6 mín tæki 3 @ 80–85%\n~20 sek skipting á milli tækja\n~🎯 Skrifaðu niður kaloríurnar á tækinu eftir hvert sett og leggðu saman. Reyndu að slá síðasta fimmtudag á sama púlsi.\n~Haltu jöfnum hraða innan hvers kafla og byrjaðu rólega. Markmiðið er að fara hraðar en halda sama púlsi, frá viku til viku.\n\nFINISHER · 3 × 90 SEK\n30 sek @ MAX · Assault Bike\n30 sek air squat\n30 sek @ hvíld\n~Í squat og hvíld: andaðu og náðu púlsinum niður\n\nCOOLDOWN\n3 mín rólegt tæki\n\nHEIMAVINNA · VALFRJÁLST\n35–45 mín @ 60–70% (zone 2)\n~Ganga upp brekkur, hjól, skokk, róður, skíði eða sund. Andaðu með nefinu og haltu jöfnum hraða.\n~Um helgina eða á mánudag. Þessi æfing byggir grunnþolið mest."}, "w4tue": {"title": "Lengri intervalar · 3 × 10 mín", "text": "18 mín á 90+% · erfiðasta æfingin\nFjarþjálfun: notaðu 1, 2 eða 3 þoltæki að eigin vali (t.d. BikeErg, RowErg, Assault, SkiErg eða hlaupabretti). Ef þú notar bara eitt tæki sleppirðu tækjaskiptunum.\n\nUPPHITUN\n3 mín @ 60–65%\n3 mín @ 65–70%\n3 mín @ 70–75%\n2 mín @ 75–80%\n2 mín @ 80–85%\n2 mín @ 80–85%\n\nTEYGJUFLÆÐI\nSpiderman + reach\nDúfan\nVindmyllur\nBolvindur\n\nAÐALÆFING · 3 × 10 MÍN\n1 mín @ 75–80%\n1 mín @ 80–85%\n3 mín @ 90+%\n1 mín @ 75–80%\n1 mín @ 80–85%\n3 mín @ 90+%\n2–3 mín @ hvíld (skipta um tæki)\n~Fókus á öndun og að lækka púlsinn\n~Eitt sett á hverju tæki\n~Í hvíldinni: andaðu djúpt inn um nefið og langt út. Náðu púlsinum niður og vertu tilbúin/n í næstu lotu.\n\nCOOLDOWN\n3 mín rólegt tæki"}, "w4thu": {"title": "Stigvaxandi púls · 9 × 4 mín", "text": "36 mín þar sem álagið eykst á þriggja lotu fresti.\nFjarþjálfun: notaðu 1, 2 eða 3 þoltæki að eigin vali (t.d. BikeErg, RowErg, Assault, SkiErg eða hlaupabretti). Ef þú notar bara eitt tæki sleppirðu tækjaskiptunum.\n\nUPPHITUN\n3 mín @ 70–75%\n3 mín @ 70–75%\n3 mín @ 70–75%\n2 mín @ 75–80%\n2 mín @ 75–80%\n2 mín @ 75–80%\n\nTEYGJUFLÆÐI\nSpiderman + reach\nDúfan\nVindmyllur\nBolvindur\n\nAÐALÆFING · 9 × 4 MÍN\nLotur 1–3: 4 mín @ 75–80%\nLotur 4–6: 4 mín @ 80–85%\nLotur 7–9: 4 mín @ 85–88%\n~20 sek skipting á milli tækja\n~Þrjár lotur á hverju tæki\n~🎯 Skrifaðu niður kaloríurnar á tækinu eftir hvert sett og leggðu saman. Reyndu að slá síðasta fimmtudag á sama púlsi.\n~Haltu jöfnum hraða innan hvers kafla og byrjaðu rólega. Markmiðið er að fara hraðar en halda sama púlsi, frá viku til viku.\n\nCOOLDOWN\n3 mín rólegt tæki\n\nHEIMAVINNA · VALFRJÁLST\n20–30 mín @ 60–70% (zone 2)\n~Ganga upp brekkur, hjól, skokk, róður, skíði eða sund. Andaðu með nefinu og haltu jöfnum hraða.\n~Mjög rólegt. Prófin eru í næstu viku, svo ekki meira en þetta."}, "w5t1": {"title": "Próf 1 · Hámarkspúlspróf", "text": "Endurpróf. Nákvæmlega eins og í viku 1.\n\nUPPHITUN\n3 mín @ 60–65%\n3 mín @ 65–70%\n3 mín @ 70–75%\n2 mín @ 75–80%\n\nTEYGJUFLÆÐI\nSpiderman + reach\nDúfan\nVindmyllur\nBolvindur\n\nPRÓF · ASSAULT BIKE\nMín 1–6: 50 → 60 rpm (+2 rpm á mín)\nMín 7+: +1 rpm á mín (61, 62, 63 …)\nLokið: 2–3 rpm undir í 5+ sek\n1 mín @ hvíld → skrá púls\n~RPM = snúningar á mínútu: hve marga hringi pedalarnir fara á einni mínútu. Sést á skjá hjólsins.\n\nSKIPULAG\nFáðu félaga til að skrá, eða lestu af úrinu\n\nSKRÁNING\nPúls í lok hverrar mín\nSíðasta kláraða mín og rpm\nHámarkspúls\nPúls 1 mín eftir\n\nCOOLDOWN\n5 mín mjög rólegt tæki\n\n~Prófið er valfrjálst og aðeins fyrir þá sem geta örugglega tekið hámarkspróf."}, "w5t2": {"title": "Próf 2 · 3 × 10 mín MAX kal", "text": "Endurpróf. Sami hópur, sama röð og í viku 1.\n\nUPPHITUN\n3 mín @ 60–65%\n3 mín @ 65–70%\n3 mín @ 70–75%\n\nTEYGJUFLÆÐI\nSpiderman + reach\nDúfan\nVindmyllur\nBolvindur\n\nPRÓF\n10 mín MAX kal · tæki 1\n20 sek @ hvíld (skipta um tæki)\n10 mín MAX kal · tæki 2\n20 sek @ hvíld (skipta um tæki)\n10 mín MAX kal · tæki 3\n~Bara 20 sek á milli tækja, svo púlsinn nær ekki að falla. Hafðu næsta tæki tilbúið (sæti og fótstig stillt).\n\nTÆKI\n1, 2 eða 3 tæki að eigin vali: BikeErg, RowErg, Assault, SkiErg eða hlaupabretti\nBara eitt tæki? Notaðu það í öll þrjú skiptin\nSkráðu kaloríurnar sem tækið sýnir\n~Sömu tæki í sömu röð í viku 1 og viku 5\n\nCOOLDOWN\n3 mín rólegt tæki\n\n~Skráðu kaloríur á hverju tæki. Ekki byrja of hratt, fyrstu 2 mínúturnar kosta mest í lokin."}}};
function boxPlan(g,k){var src=BOX_PLAN[isRemote(Number(String(g).slice(1)))?'remote':'inhouse'];return src[k]||null}
var confirmFill=false;
var TEST_TEXT={t1:'Upphitun 5–10 mín rólega.\nAssault-hjól: 1. mín 50 rpm, svo +2 rpm á mínútu upp í 60 rpm, eftir það +1 rpm á mínútu.\nHaltu RPM eins lengi og þú getur. Prófinu lýkur þegar þú dettur 2–3 rpm undir í meira en 5 sek.\nHvíldu í 1 mín eftir prófið og skráðu púlsinn.',t2:'Upphitun 10 mín.\n10 mín hámarkskaloríur á BikeErg, róðravél og Assault-hjóli.\nAðeins 20 sek hvíld á milli tækja.\nSama röð og sama hvíld á milli tækja í viku 1 og viku 5.'};
function weekCard(a){
 if(!a)return'';var g='g'+gid(a.group),w=plan.week&&plan.week[g];if(!w)return'';
 var items=SESSIONS.filter(function(s){return s.w===Number(w)});
 var html='',any=false;
 items.forEach(function(s){var it=planItem(a.group,s.k)||{};if(!it.text&&!it.title&&!it.img)return;any=true;
  html+='<div class="wk-item"><div class="wk-tag" style="background:'+color(s)+'">'+esc(s.short)+'</div><div class="wk-body"><b>'+esc(it.title||s.label)+'</b>'+(it.text?fmtCompact(it.text):'')+(THU_MIN[s.k]?beatBox(data[a.id]||{},s.k):'')+imgTag(g,s.k,it.img,'wk-img')+'</div></div>'});
 if(!any)return'';
 return'<section class="card week-card"><div class="eyebrow-dark">Æfingar vikunnar · Vika '+w+'</div>'+html+'</section>';
}
var IMG={},imgBusy=null;
function imgKey(g,k){return'img-'+g+'-'+k}
function imgTag(g,k,ver,cls){
 if(!ver)return'';var key=imgKey(g,k),c=IMG[key];
 if(!c||c.v!==ver){if(!c||!c.loading){IMG[key]={v:ver,loading:true};db.collection('meta').doc(key).get().then(function(d){IMG[key]={v:ver,src:d.exists?d.data().data:null};render()}).catch(function(){IMG[key]={v:ver,src:null}})}return'<div class="'+cls+' img-wait">Hleð mynd…</div>'}
 if(!c.src)return'';
 return'<button class="'+cls+'" data-act="img-open" data-key="'+key+'" aria-label="Opna mynd"><img src="'+c.src+'" alt="Mynd með æfingunni"></button>';
}
function shrinkImage(file){return new Promise(function(res,rej){
 var url=URL.createObjectURL(file),im=new Image();
 im.onload=function(){URL.revokeObjectURL(url);var max=1600,w=im.naturalWidth,h=im.naturalHeight,sc=Math.min(1,max/Math.max(w,h));
  var cv=document.createElement('canvas');cv.width=Math.round(w*sc);cv.height=Math.round(h*sc);var c=cv.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,cv.width,cv.height);c.drawImage(im,0,0,cv.width,cv.height);
  var q=.82,d=cv.toDataURL('image/jpeg',q);
  while(d.length>900000&&q>.35){q-=.1;d=cv.toDataURL('image/jpeg',q)}
  if(d.length>900000){var cv2=document.createElement('canvas');cv2.width=Math.round(cv.width*.7);cv2.height=Math.round(cv.height*.7);cv2.getContext('2d').drawImage(cv,0,0,cv2.width,cv2.height);d=cv2.toDataURL('image/jpeg',.7)}
  res(d)};
 im.onerror=function(){URL.revokeObjectURL(url);rej(new Error('img'))};im.src=url})}
function uploadPlanImage(g,k,file){
 if(!file)return;if(!/^image\//.test(file.type)&&!/\.(heic|heif)$/i.test(file.name)){toast('Veldu myndaskrá (JPG eða PNG).');return}
 imgBusy=g+k;render();
 shrinkImage(file).then(function(d){
  var ver=Date.now(),key=imgKey(g,k);
  return db.collection('meta').doc(key).set({data:d,updated:ver}).then(function(){
   var upd={};upd[g]={};upd[g][k]={img:ver};
   return db.collection('meta').doc('plan').set(upd,{merge:true})}).then(function(){
   plan[g]=plan[g]||{};plan[g][k]=plan[g][k]||{};plan[g][k].img=ver;IMG[key]={v:ver,src:d};imgBusy=null;render();toast('Mynd vistuð.')})
 }).catch(function(e){imgBusy=null;render();toast(e&&e.message==='img'?'Gat ekki lesið myndina. Prófaðu JPG eða PNG.':'Ekki tókst að vista myndina.')});
}
function removePlanImage(g,k){
 var key=imgKey(g,k),FV=firebase.firestore.FieldValue,upd={};upd[g+'.'+k+'.img']=FV.delete();
 imgBusy=g+k;render();
 db.collection('meta').doc('plan').update(upd).then(function(){return db.collection('meta').doc(key).delete()}).then(function(){if(plan[g]&&plan[g][k])delete plan[g][k].img;delete IMG[key];imgBusy=null;render();toast('Mynd fjarlægð.')}).catch(fail);
}
function openLightbox(key){var c=IMG[key];if(!c||!c.src)return;var m=document.createElement('div');m.className='lightbox';m.innerHTML='<img src="'+c.src+'" alt="Mynd"><p>Haltu fingri á myndinni til að vista hana.</p><button class="share-x" aria-label="Loka">✕</button>';m.addEventListener('click',function(){m.remove()});document.body.appendChild(m)}
function planVal(g,k,f){var d=planDraft[g]&&planDraft[g][k];if(d&&d[f]!=null)return d[f];var it=(plan[g]||{})[k];return it&&it[f]!=null?it[f]:''}
function planView(){
 var g=planGroup,dirty=Object.keys(planDraft).length>0;
 var html='<section class="card"><h3>Æfingaplan</h3><p class="desc">Skrifaðu æfingarnar fyrir hvern hóp. Veldu svo hvaða viku á að birta. Iðkendur í hópnum sjá æfingar vikunnar efst á síðunni sinni. Til að feitletra skrifarðu <code>**orð**</code>, eða <code>**heila línu**</code>.</p>';
 html+='<div class="chips" role="group" aria-label="Hópur">'+GROUPS.map(function(G){return'<button class="chip" data-act="plan-group" data-g="g'+G.id+'" aria-pressed="'+(g==='g'+G.id)+'">'+G.name+'</button>'}).join('')+'</div>';
 var wv=planDraft.__week&&planDraft.__week[g]!=null?planDraft.__week[g]:(plan.week&&plan.week[g])||0;
 html+='<div class="plan-pub"><label class="f" for="plan-week">Birta hjá iðkendum<select id="plan-week" data-g="'+g+'"><option value="0"'+(Number(wv)===0?' selected':'')+'>Ekkert birt</option>';
 for(var w=1;w<=5;w++)html+='<option value="'+w+'"'+(Number(wv)===w?' selected':'')+'>Vika '+w+'</option>';
 var others=GROUPS.filter(function(G){return'g'+G.id!==g});if(!others.some(function(G){return'g'+G.id===planFrom}))planFrom='g'+others[0].id;
 html+='</select></label><div class="plan-copy"><label class="f" for="plan-from">Afrita æfingar úr<select id="plan-from">'+others.map(function(G){return'<option value="g'+G.id+'"'+(planFrom==='g'+G.id?' selected':'')+'>'+G.name+'</option>'}).join('')+'</select></label><button class="btn ghost sm" data-act="plan-copy">'+(confirmCopy?'Ýttu aftur til að skrifa yfir':'Afrita')+'</button></div></div><div class="plan-fill-all"><button class="btn sm" data-act="plan-boxfill">'+(confirmFill?'Ýttu aftur til að skrifa yfir allt':'Setja inn BOX800 planið')+'</button><span class="status">Fyllir allar 10 æfingarnar í þessum hópi'+(isRemote(Number(g.slice(1)))?' (útgáfa fyrir fjarþjálfun)':'')+'. Smelltu svo á Vista.</span></div></section>';
 for(var wk=1;wk<=5;wk++){
  var pub=Number(wv)===wk;
  html+='<section class="card plan-week'+(pub?' is-pub':'')+'"><div class="plan-wh"><h3>Vika '+wk+'</h3>'+(pub?'<span class="pub-pill">Birt</span>':'')+'</div><div class="plan-grid">';
  SESSIONS.filter(function(s){return s.w===wk}).forEach(function(s){
   var bxp=boxPlan(g,s.k),ph=bxp?bxp.text:'Dæmi: Upphitun 10 mín. 5 × 4 mín á 85–90% af hámarkspúls, 2 mín hvíld. Niðurlag 5 mín.';
   html+='<div class="plan-item"><div class="plan-lab"><i class="sw" style="background:'+color(s)+'"></i>'+esc(s.label)+'</div><input id="pl-'+g+'-'+s.k+'-title" data-plan="'+g+'|'+s.k+'|title" placeholder="Titill, t.d. Intervalar 5 × 4 mín" value="'+esc(planVal(g,s.k,'title'))+'"><textarea id="pl-'+g+'-'+s.k+'-text" data-plan="'+g+'|'+s.k+'|text" rows="5" placeholder="'+esc(ph)+'">'+esc(planVal(g,s.k,'text'))+'</textarea>'+(s.type==='t1'||s.type==='t2'?'<button class="linkbtn" data-act="plan-fill" data-k="'+s.k+'" data-t="'+s.type+'">Nota lýsingu prófsins</button>':'')+planImgCtl(g,s.k)+'</div>'});
  html+='</div></section>';
 }
 html+='<div class="plan-save"><button class="btn" data-act="plan-save"'+(busy?' disabled':'')+'>Vista æfingaplan</button><span class="status">'+(dirty?'Óvistaðar breytingar':'Allt vistað')+'</span></div>';
 return html;
}
function planImgCtl(g,k){
 var it=(plan[g]||{})[k]||{},busyHere=imgBusy===g+k;
 if(busyHere)return'<div class="img-ctl"><span class="status">Vista mynd…</span></div>';
 if(it.img)return'<div class="img-ctl has">'+imgTag(g,k,it.img,'plan-thumb')+'<button class="linkbtn danger-link" data-act="img-remove" data-g="'+g+'" data-k="'+k+'">Fjarlægja mynd</button></div>';
 return'<div class="img-ctl"><label class="img-add" for="img-'+g+'-'+k+'"><input id="img-'+g+'-'+k+'" type="file" accept="image/*" data-img="'+g+'|'+k+'" hidden>+ Bæta við mynd'+(/t\d$/.test(k)?' (t.d. skorblað)':'')+'</label></div>';
}
function planSetDraft(g,k,f,v){planDraft[g]=planDraft[g]||{};planDraft[g][k]=planDraft[g][k]||{};planDraft[g][k][f]=v;var st=document.querySelector('.plan-save .status');if(st)st.textContent='Óvistaðar breytingar'}
function planSave(){
 var next={week:Object.assign({},plan.week||{})};GROUPS.forEach(function(G){next['g'+G.id]=JSON.parse(JSON.stringify(plan['g'+G.id]||{}))});
 GROUPS.map(function(G){return'g'+G.id}).forEach(function(g){var d=planDraft[g]||{};Object.keys(d).forEach(function(k){var it=next[g][k]||{};Object.keys(d[k]).forEach(function(f){var v=String(d[k][f]).trim();if(v)it[f]=v;else delete it[f]});if(Object.keys(it).length)next[g][k]=it;else delete next[g][k]})});
 if(planDraft.__week)Object.keys(planDraft.__week).forEach(function(g){next.week[g]=Number(planDraft.__week[g])||0});
 busy='save';render();
 db.collection('meta').doc('plan').set(next).then(function(){plan=next;planDraft={};busy='';render();toast('Æfingaplan vistað.')}).catch(fail);
}

function minFor(rpm){return rpm<=60?Math.floor((rpm-50)/2)+1:rpm-54}
function selfFields(s){
 if(s.type==='t1'&&selfDev(s)==='tread')return[['min','Síðasta heila mínúta','Mín 1 = 8 km/klst, mín 2 = 8,5, mín 3 = 9 …'],['max','Hámarkspúls'],['rec','Púls 1 mín eftir próf (valfrjálst)','Púlsinn nákvæmlega 60 sekúndum eftir að þú hættir. Hvíldu þessa mínútu.']];
 if(s.type==='t1')return[['rpm','Síðasta RPM sem þú kláraðir'],['max','Hámarkspúls'],['rec','Púls 1 mín eftir próf (valfrjálst)','Púlsinn nákvæmlega 60 sekúndum eftir að þú hættir. Hvíldu þessa mínútu.']];
 if(s.type==='t2')return[['max','Hámarkspúls','Hæsti púls í prófinu, úr úrinu.']];
 if(s.type==='thu')return[['avg','Meðalpúls','Úr úrinu, fyrir alla æfinguna.'],['max','Hámarkspúls','Hæsti púls á æfingunni.'],['kcal','Heildarkaloríur úr úrinu','Allar kaloríur fyrir æfinguna í heild, eins og úrið sýnir.'],['mkcal','Kaloríur á tækjum (öll sett samtals)','Kaloríurnar sem tækið sýndi eftir hvert sett, lagðar saman. Þetta er talan sem þú reynir að slá næsta fimmtudag.']];
 if(s.type==='home')return[['mins','Mínútur','Hve lengi æfingin var.'],['avg','Meðalpúls (valfrjálst)','Úr úrinu, ef þú varst með það.'],['kcal','Kaloríur (valfrjálst)','Úr úrinu, ef þú varst með það.']];
 var f=[['avg','Meðalpúls','Úr úrinu, fyrir alla æfinguna.'],['max','Hámarkspúls','Hæsti púls á æfingunni.'],['kcal','Heildarkaloríur úr úrinu','Allar kaloríur fyrir æfinguna í heild, eins og úrið sýnir (Polar, Garmin, Apple Watch o.fl.).']];
 return f;
}
function selfDev(s){return'assault'}
function partsUi(cur){
 var pp=cur.parts||[],html='<div class="parts">';
 [0,1,2].forEach(function(i){var q=pp[i]||{},m=q.m||(i>0&&pp[0]&&pp[0].m)||'';
  html+='<div class="part"><b>'+(i+1)+'. hluti · 10 mín</b><div class="self-grid"><label class="f" for="me-m'+i+'">Tæki<select id="me-m'+i+'"><option value="">Veldu tæki…</option>'+DEVICES.map(function(d){return'<option value="'+d[0]+'"'+(d[0]===m?' selected':'')+'>'+d[1]+'</option>'}).join('')+'</select></label><label class="f" for="me-c'+i+'">Kaloríur<input id="me-c'+i+'" inputmode="numeric" value="'+(q.c!=null?q.c:'')+'"></label></div></div>'});
 return html+'</div>';
}
function selfView(){
 var a=byId(auth.who),x=data[a.id]||{};
 var s=selfList().filter(function(q){return q.k===ui.selfSession})[0];
 if(!s){s=SESSIONS.filter(function(q){return!x[q.k]})[0]||SESSIONS[SESSIONS.length-1];ui.selfSession=s.k}
 var cur=x[s.k]||{};
 var html='<section class="card self"><h3>Skrá æfingu</h3><p class="desc">Veldu æfinguna og skráðu tölurnar úr úrinu þínu eftir æfinguna. Þú getur alltaf leiðrétt þær seinna.</p>';
 html+='<label class="f" for="me-session">Æfing<select id="me-session">';
 selfList().forEach(function(q){html+='<option value="'+q.k+'"'+(q.k===s.k?' selected':'')+'>Vika '+q.w+' · '+q.label+(x[q.k]?' ✓':'')+'</option>'});
 html+='</select></label>';
 var pw=planItem(a.group,s.k);if(pw&&(pw.text||pw.img))html+='<div class="plan-show"><b>'+esc(pw.title||s.label)+'</b>'+(pw.text?fmtCompact(pw.text):'')+imgTag('g'+gid(a.group),s.k,pw.img,'wk-img')+'</div>';
 if(s.type==='t1')html+='<p class="hint">Próf 1 er á Assault Bike: 1. mín 50 rpm, svo +2 á mínútu upp í 60 rpm, eftir það +1 á mínútu. Skráðu síðasta RPM sem þú kláraðir heila mínútu á.<br><b>RPM</b> = snúningar á mínútu, þ.e. hve marga heila hringi pedalarnir fara á einni mínútu. Talan sést á skjá hjólsins.</p>';
 if(s.type==='home')html+='<p class="hint">Róleg aukaæfing, '+s.tip+' í zone 2 (60–70% af hámarkspúls): ganga upp brekkur, hjól, skokk, skíði, sund eða þoltæki. Þú átt að geta andað með nefinu og spjallað allan tímann. Hún telst ekki með í æfingunum 10 en sést á síðunni þinni.</p>';
 if(s.type==='t2')html+='<p class="hint">3 × 10 mín á 1, 2 eða 3 tækjum að eigin vali. Ef þú hefur bara eitt tæki velurðu það í öllum þremur hlutunum. Skráðu kaloríurnar sem tækið sýnir eftir 10 mín. Notaðu sömu tæki í sömu röð í viku 5.</p>';
 html+='<div class="self-grid">';
 selfFields(s).forEach(function(f){var v=cur[f[0]]!=null?cur[f[0]]:'';html+='<label class="f" for="me-'+f[0]+'">'+f[1]+(f[2]?'<span class="fhint">'+f[2]+'</span>':'')+'<input id="me-'+f[0]+'" inputmode="numeric" value="'+esc(v)+'"></label>'});
 if(s.type==='home')html+='<label class="f" for="me-what">Hvað gerðirðu? (valfrjálst)<input id="me-what" maxlength="60" placeholder="t.d. ganga upp Esjuna" value="'+esc(cur.what||'')+'"></label>';
 html+='</div>';
 if(s.type==='t2')html+=partsUi(cur);
 if(s.type==='t1'&&selfDev(s)!=='tread')html+='<p class="trend" id="me-t1">'+(cur.rpm!=null&&cur.dev!=='tread'?'= '+minFor(cur.rpm)+' mínútur':'')+'</p>';
 if(s.type!=='home'){
html+='<details class="self-zones"'+(hasZones(cur)?' open':'')+'><summary>Sýna meira: tími í púlssvæðum (valfrjálst)</summary><div class="self-grid">';
 [5,4,3,2,1].forEach(function(i){var k='z'+i,v=cur[k]!=null?fmtTime(cur[k]):'';html+='<label class="f" for="me-'+k+'">Svæði '+i+' · mín:sek<input id="me-'+k+'" placeholder="0:00" value="'+esc(v)+'"></label>'});
 html+='</div></details>';
 }
 html+='<div class="actions"><button class="btn" data-act="self-save"'+(saving?' disabled':'')+'>'+(saving?'Vista…':'Vista')+'</button>'+(x[s.k]?'<button class="btn ghost" data-act="self-clear">'+(confirmDel==='self'?'Ýttu aftur til að eyða':'Eyða þessari skráningu')+'</button>':'')+'</div></section>';
 return html;
}
function selfSave(clear){
 var a=byId(auth.who);if(!a||!isRemote(a.group)||!db)return;
 var s=selfList().filter(function(q){return q.k===ui.selfSession})[0];if(!s)return;
 var rec=JSON.parse(JSON.stringify((data[a.id]||{})[s.k]||{})),bad=null;
 if(!clear){
  selfFields(s).concat([['z1'],['z2'],['z3'],['z4'],['z5']]).forEach(function(f){var el=document.getElementById('me-'+f[0]);if(!el)return;var raw=el.value.trim(),v;
   if(raw===''){delete rec[f[0]];return}
   v=/^z/.test(f[0])?parseTime(raw):Math.round(Number(raw.replace(',','.')));
   if(v==null||isNaN(v)||v<0){bad=f[1]||'svæði';return}
   if((f[0]==='max'||f[0]==='avg'||f[0]==='rec')&&(v<40||v>240)){bad=f[1];return}
   if(f[0]==='rpm'&&(v<50||v>90)){bad=f[1];return}
   if(f[0]==='min'&&(v<1||v>40)){bad=f[1];return}
   if(f[0]==='mins'&&(v<5||v>300)){bad=f[1];return}
   rec[f[0]]=v});
  if(bad){toast('Athugaðu reitinn „'+bad.replace(/ ·.*/,'')+'“. Notaðu tölur, t.d. 163, og tíma eins og 22:16.');return}
  if(s.type==='t1'){delete rec.dev;if(rec.rpm!=null)rec.min=minFor(rec.rpm);else delete rec.min;delete rec.stages}
  if(s.type==='t2'){var parts=[],pbad=false;[0,1,2].forEach(function(i){var me=document.getElementById('me-m'+i),ce=document.getElementById('me-c'+i);if(!me||!ce)return;var raw=ce.value.trim();if(raw===''&&!me.value){parts.push(null);return}var c=raw===''?null:Math.round(Number(raw.replace(',','.')));if(c!=null&&(isNaN(c)||c<0||c>999)){pbad=true;return}if(c!=null&&!me.value){pbad='m';return}parts.push({m:me.value||null,c:c})});
   if(pbad){toast(pbad==='m'?'Veldu tæki fyrir hvern hluta sem þú skráir kaloríur á.':'Athugaðu kaloríurnar. Notaðu tölur, t.d. 150.');return}
   while(parts.length&&!parts[parts.length-1])parts.pop();parts=parts.map(function(q){return q||{m:null,c:null}});
   if(parts.length)rec.parts=parts;else delete rec.parts;MACHINES.forEach(function(m){delete rec[m[0]]})}
  if(s.type==='home'){var we=document.getElementById('me-what'),wv=we?we.value.trim().slice(0,60):'';if(wv)rec.what=wv;else delete rec.what;if(rec.mins==null){toast('Skráðu hve margar mínútur æfingin var.');return}}
  if(!Object.keys(rec).length){toast('Skráðu að minnsta kosti eina tölu.');return}
 }
 var FV=firebase.firestore.FieldValue,upd={updated:FV.serverTimestamp()};upd['data.'+s.k]=clear?FV.delete():rec;
 saving=true;confirmDel=null;render();
 athleteRef(a.id).update(upd).then(function(){data[a.id]=data[a.id]||{};if(clear)delete data[a.id][s.k];else data[a.id][s.k]=rec;saving=false;render();toast(clear?'Skráningu eytt.':'Vistað. Vel gert!')}).catch(function(e){saving=false;render();toast(e&&e.code==='permission-denied'?'Þú hefur ekki leyfi til að skrá. Talaðu við þjálfarann.':'Ekki tókst að vista. Athugaðu netsambandið og reyndu aftur.')});
}
function addAthletes(){
 var list=newNames.split(/\n+/).map(function(n){return n.trim()}).filter(Boolean);
 if(!list.length){toast('Skrifaðu nöfn, eitt í hverja línu.');return}
 var batch=db.batch(),base=state.athletes.reduce(function(m,a){return Math.max(m,a.order||0)},0),added=[];
 list.forEach(function(n,i){var c=newCode();while(byId(c)||added.some(function(x){return x.id===c}))c=newCode();var o=base+i+1,g=gid(newGroup);batch.set(athleteRef(c),{name:n,order:o,group:g,data:{}});added.push({id:c,name:n,order:o,group:g})});
 busy='save';render();
 batch.commit().then(function(){added.forEach(function(a){state.athletes.push(a);data[a.id]={}});pushTeam();newNames='';busy='';if(!ui.sel)ui.sel=added[0].id;render();toast(added.length===1?'Iðkanda bætt við.':added.length+' iðkendum bætt við.')}).catch(fail);
}
function saveNames(){
 var batch=db.batch(),n=0;
 state.athletes.forEach(function(a){var upd={},v=renames[a.id],g=regroups[a.id];if(v!=null&&v.trim()&&v.trim()!==a.name)upd.name=v.trim();if(g&&Number(g)!==(a.group||1))upd.group=Number(g);if(Object.keys(upd).length){batch.update(athleteRef(a.id),upd);n++}});
 if(!n){toast('Engar breytingar til að vista.');return}
 busy='save';render();
 batch.commit().then(function(){state.athletes.forEach(function(a){var v=renames[a.id],g=regroups[a.id];if(v!=null&&v.trim())a.name=v.trim();if(g)a.group=Number(g);delete renames[a.id];delete regroups[a.id]});pushTeam();busy='';render();toast('Breytingar vistaðar.')}).catch(fail);
}
function saveTitle(){
 var t=(renames.__title||'').trim();if(!t){toast('Skrifaðu titil.');return}
 busy='save';render();
 db.collection('meta').doc('project').set({title:t},{merge:true}).then(function(){state.project=t;delete renames.__title;busy='';render();toast('Titill vistaður.')}).catch(fail);
}
function regenCode(id){
 var a=byId(id);if(!a)return;var c=newCode();while(byId(c))c=newCode();
 var batch=db.batch();batch.set(athleteRef(c),{name:a.name,order:a.order||0,group:a.group||1,data:data[id]||{}});batch.delete(athleteRef(id));
 busy='save';render();
 batch.commit().then(function(){data[c]=data[id]||{};delete data[id];a.id=c;if(ui.sel===id)ui.sel=c;Object.keys(draft).forEach(function(sk){if(draft[sk][id]){draft[sk][c]=draft[sk][id];delete draft[sk][id]}});busy='';render();toast('Nýr kóði fyrir '+a.name+': '+c+'. Gamli kóðinn virkar ekki lengur.')}).catch(fail);
}
function removeAthlete(id){
 if(confirmDel!==id){confirmDel=id;render();return}
 confirmDel=null;var a=byId(id);busy='save';render();
 athleteRef(id).delete().then(function(){state.athletes=state.athletes.filter(function(x){return x.id!==id});delete data[id];pushTeam();if(ui.sel===id)ui.sel=state.athletes.length?state.athletes[0].id:null;busy='';render();toast((a?a.name:'Iðkandi')+' fjarlægður.')}).catch(fail);
}
function copyLink(id){
 var url=linkFor(id);
 function done(){copied=id;render();setTimeout(function(){if(copied===id){copied=null;render()}},2000)}
 if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(done,function(){prompt('Afritaðu hlekkinn:',url)})}else prompt('Afritaðu hlekkinn:',url);
}
function backup(){
 var out={project:state.project,saved:new Date().toISOString(),athletes:state.athletes.map(function(a){return{code:a.id,name:a.name,order:a.order||0,group:a.group||1,data:data[a.id]||{}}})};
 var blob=new Blob([JSON.stringify(out,null,1)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download='tholthjalfun-afrit-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url)},2000);
}

function toast(msg){document.querySelectorAll('.toast').forEach(function(x){x.remove()});var t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(function(){t.remove()},3500)}
function save(){
 if(!canEdit||!db)return;
 var bad=null,changes={};
 Object.keys(draft).forEach(function(sk){Object.keys(draft[sk]).forEach(function(aid){
  if(!byId(aid))return;
  var rec=JSON.parse(JSON.stringify((data[aid]&&data[aid][sk])||{})),f=draft[sk][aid];
  var stepEdit=Object.keys(f).some(function(k){return/^s\d+$/.test(k)});
  if(stepEdit){var arr=rowStages(rec,f);if(arr.some(function(v){return v!=null&&(isNaN(v)||v<40||v>240)}))bad=byId(aid).name;
   else if(nn(arr).length){rec.stages=arr;rec.min=arr.length;rec.rpm=rpmFor(arr.length)}else{delete rec.stages;delete rec.min;delete rec.rpm}}
  Object.keys(f).forEach(function(k){if(k==='rpmManual'||k==='manual'||/^s\d+$/.test(k))return;var raw=String(f[k]).trim(),v;
   if(raw===''){delete rec[k];return}
   if(/^z[1-5]$/.test(k)){v=parseTime(raw);if(v==null||isNaN(v)){bad=byId(aid).name;return}rec[k]=v;return}
   v=Math.round(Number(raw.replace(',','.')));
   if(isNaN(v)){bad=byId(aid).name;return}rec[k]=v});
  if(/t1$/.test(sk)&&rec.min!=null&&rec.rpm==null)rec.rpm=rpmFor(rec.min);
  if(rec.stages&&rec.stages.length&&rec.max==null&&nn(rec.stages).length)rec.max=Math.max.apply(null,nn(rec.stages));
  changes[aid]=changes[aid]||{};changes[aid][sk]=Object.keys(rec).length?rec:null;
 })});
 if(bad){toast('Athugaðu tölurnar hjá '+bad+'. Notaðu venjulegar tölur, t.d. 163, og tíma eins og 22:16.');return}
 var ids=Object.keys(changes);if(!ids.length){toast('Engar breytingar til að vista.');return}
 var batch=db.batch(),FV=firebase.firestore.FieldValue;
 ids.forEach(function(aid){var upd={};Object.keys(changes[aid]).forEach(function(sk){upd['data.'+sk]=changes[aid][sk]===null?FV.delete():changes[aid][sk]});upd.updated=FV.serverTimestamp();batch.update(athleteRef(aid),upd)});
 saving=true;render();
 batch.commit().then(function(){
  ids.forEach(function(aid){data[aid]=data[aid]||{};Object.keys(changes[aid]).forEach(function(sk){if(changes[aid][sk]===null)delete data[aid][sk];else data[aid][sk]=changes[aid][sk]})});
  draft={};saving=false;pushTeam();render();toast('Vistað. Iðkendur sjá þetta strax.');
 }).catch(fail);
}

app.addEventListener('click',function(e){
 var el=e.target.closest('[data-act]');if(!el)return;var act=el.getAttribute('data-act');
 if(act==='view'){ui.view=el.getAttribute('data-v');ui.pick=null;persistUi();render();window.scrollTo(0,0)}
 else if(act==='install-x'){try{localStorage.setItem('tt-install','0')}catch(e){}render()}
 else if(act==='kgroup'){var kv=el.getAttribute('data-g');ui.kgroup=kv==='all'?'all':Number(kv);if(kv!=='all')newGroup=kv;render()}
 else if(act==='agroup'){ui.agroup=Number(el.getAttribute('data-g'));var fl=inGroup(ui.agroup);if(fl.length)ui.sel=fl[0].id;persistUi();render()}
 else if(act==='sel'){ui.sel=el.getAttribute('data-id');var sa=byId(ui.sel);if(sa)ui.agroup=gid(sa.group);ui.pick=null;if(el.getAttribute('data-go')){ui.view='athlete';window.scrollTo(0,0)}persistUi();render()}
 else if(act==='filter'){ui.filter=el.getAttribute('data-f');ui.pick=null;render()}
 else if(act==='pick'){ui.pick=el.getAttribute('data-k');var y=window.scrollY;render();window.scrollTo(0,y)}
 else if(act==='save')save();
 else if(act==='logout')logout();
 else if(act==='coach-login')coachLogin();
 else if(act==='show-pw'){showPw=true;loginErr='';render();var pe=document.getElementById('pw-pass');if(pe)pe.focus()}
 else if(act==='set-pw')setPassword();
 else if(act==='share-open'){share.open=true;openShareModal()}
 else if(act==='plan-group'){planGroup=el.getAttribute('data-g');confirmCopy=false;confirmFill=false;render()}
 else if(act==='plan-save')planSave();
 else if(act==='img-open')openLightbox(el.getAttribute('data-key'));
 else if(act==='img-remove'){var rk=el.getAttribute('data-g')+'|'+el.getAttribute('data-k');if(confirmDel!=='img'+rk){confirmDel='img'+rk;el.textContent='Ýttu aftur til að fjarlægja';return}confirmDel=null;removePlanImage(el.getAttribute('data-g'),el.getAttribute('data-k'))}
 else if(act==='plan-fill'){var k=el.getAttribute('data-k'),bx=boxPlan(planGroup,k),ta=document.getElementById('pl-'+planGroup+'-'+k+'-text');if(ta&&bx){ta.value=bx.text;planSetDraft(planGroup,k,'text',bx.text)}var ti=document.getElementById('pl-'+planGroup+'-'+k+'-title');if(ti&&bx&&!ti.value){ti.value=bx.title;planSetDraft(planGroup,k,'title',bx.title)}}
 else if(act==='plan-boxfill'){if(!confirmFill){confirmFill=true;render()}else{confirmFill=false;SESSIONS.forEach(function(s){var bx=boxPlan(planGroup,s.k);if(bx){planSetDraft(planGroup,s.k,'title',bx.title);planSetDraft(planGroup,s.k,'text',bx.text)}});render();toast('BOX800 planið sett inn. Smelltu á Vista æfingaplan.')}}
 else if(act==='plan-copy'){if(!confirmCopy){confirmCopy=true;render()}else{confirmCopy=false;SESSIONS.forEach(function(s){['title','text'].forEach(function(f){planSetDraft(planGroup,s.k,f,planVal(planFrom,s.k,f))})});render();toast('Afritað úr '+groupName(Number(planFrom.slice(1)))+'. Smelltu á Vista æfingaplan.')}}
 else if(act==='add-athletes')addAthletes();
 else if(act==='save-names')saveNames();
 else if(act==='save-title')saveTitle();
 else if(act==='regen')regenCode(el.getAttribute('data-id'));
 else if(act==='remove')removeAthlete(el.getAttribute('data-id'));
 else if(act==='copy')copyLink(el.getAttribute('data-id'));
 else if(act==='backup')backup();
 else if(act==='tgroup'){ui.tgroup=el.getAttribute('data-g');render()}
 else if(act==='self-save')selfSave(false);
 else if(act==='hr-save')hrSave();

 else if(act==='self-clear'){if(confirmDel==='self')selfSave(true);else{confirmDel='self';render();return}}
 if(act!=='remove'&&act!=='self-clear'&&act!=='img-remove'&&confirmDel){confirmDel=null;render()}
});
app.addEventListener('keydown',function(e){if((e.key==='Enter'||e.key===' ')&&e.target.classList.contains('brow')){e.preventDefault();e.target.click()}});
app.addEventListener('input',function(e){var t=e.target;
 if(t.dataset.s){var dd=draft[t.dataset.s]=draft[t.dataset.s]||{};var da=dd[t.dataset.a]=dd[t.dataset.a]||{};da[t.dataset.f]=t.value;
  if(/t1$/.test(t.dataset.s)){
   var man=da.manual=da.manual||{};
   if(['min','max','rpm'].indexOf(t.dataset.f)>=0){man[t.dataset.f]=t.value.trim()!=='';t.classList.remove('auto')}
   if(/^s\d+$/.test(t.dataset.f)){var row=[];for(var q=1;q<=NSTEPS;q++){var ie=document.getElementById('in-'+t.dataset.s+'-'+t.dataset.a+'-s'+q);row.push(ie&&ie.value.trim()!==''?Number(ie.value):null)}
    while(row.length&&row[row.length-1]==null)row.pop();
    var dc=document.getElementById('done-'+t.dataset.s+'-'+t.dataset.a);if(dc)dc.textContent=doneText(row);
    if(!man.max){var good=nn(row).filter(function(n){return n>=40&&n<=240}),mi=document.getElementById('in-'+t.dataset.s+'-'+t.dataset.a+'-max'),mv=good.length?String(Math.max.apply(null,good)):'';if(mi){mi.value=mv;mi.classList.toggle('auto',!!mv)}da.max=mv}}
   if(t.dataset.f==='stages'){var arr=t.value.split(/[^0-9]+/).filter(Boolean).map(Number).filter(function(n){return n>=40&&n<=240});
    function put(f,val){if(man[f]||(f==='rpm'&&da.rpmManual))return;var el=document.getElementById('in-'+t.dataset.s+'-'+t.dataset.a+'-'+f);var sv=val==null?'':String(val);if(el){el.value=sv;el.classList.toggle('auto',!!sv)}da[f]=sv}
    put('min',arr.length||null);put('rpm',arr.length?rpmFor(arr.length):null);put('max',arr.length?Math.max.apply(null,arr):null)}
   if(t.dataset.f==='rpm')da.rpmManual=t.value.trim()!=='';
   if(t.dataset.f==='min'&&!da.rpmManual){var ri=document.getElementById('in-'+t.dataset.s+'-'+t.dataset.a+'-rpm'),mn=parseInt(t.value,10);
    var rv=mn>0?String(rpmFor(mn)):'';if(ri){ri.value=rv;ri.classList.toggle('auto',!!rv)}da.rpm=rv}}}
 else if(t.dataset.rename){renames[t.dataset.rename]=t.value}
 else if(t.id==='new-names'){newNames=t.value}
 else if(t.id==='n-project'){renames.__title=t.value}
 else if(t.dataset.plan){var pp=t.dataset.plan.split('|');planSetDraft(pp[0],pp[1],pp[2],t.value)}
 else if(t.id==='me-rpm'){var o=document.getElementById('me-t1'),r=parseInt(t.value,10);if(o)o.textContent=r>=50&&r<=90?'= '+minFor(r)+' mínútur':''}
 else if(t.id==='login-code'){var pos=t.value.length;var nv=normCode(t.value);if(nv.replace('-','').length===8&&nv!==t.value)t.value=nv}
});
app.addEventListener('submit',function(e){if(e.target.id==='login-form'){e.preventDefault();tryLogin()}else if(e.target.id==='pw-form'){e.preventDefault();pwLogin()}});
app.addEventListener('change',function(e){var t=e.target;
 if(t.dataset&&t.dataset.img){var ip=t.dataset.img.split('|');uploadPlanImage(ip[0],ip[1],t.files&&t.files[0]);return}
 if(t.id==='c-session'){ui.coachSession=t.value;persistUi();render()}
 else if(t.id==='c-group'){ui.egroup=t.value;render()}
 else if(t.id==='plan-week'){planDraft.__week=planDraft.__week||{};planDraft.__week[t.dataset.g]=t.value;var st=document.querySelector('.plan-save .status');if(st)st.textContent='Óvistaðar breytingar'}
 else if(t.id==='plan-from'){planFrom=t.value;confirmCopy=false;render()}
 else if(t.id==='c-zones'){ui.zones=t.checked;try{localStorage.setItem('tt-zones',t.checked?'1':'0')}catch(e){}render()}
 else if(t.id==='me-session'){ui.selfSession=t.value;ui.selfDev=null;render()}
 else if(t.id==='new-group'){newGroup=t.value}
 else if(t.dataset.regroup){regroups[t.dataset.regroup]=t.value}});
window.addEventListener('hashchange',function(){if(!db)return;var c=hashCode();if(!auth&&c){openCode(c,true);return}if(canEdit&&location.hash==='#team'){ui.view='team';render();window.scrollTo(0,0)}});
window.addEventListener('beforeunload',function(e){if(canEdit&&Object.keys(draft).some(function(k){return Object.keys(draft[k]).length})){e.preventDefault();e.returnValue=''}});
var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){if(ui.view==='athlete')drawChart()},150)});

render();
boot();
})();
