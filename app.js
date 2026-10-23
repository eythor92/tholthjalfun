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
var MACHINES=[['bike','BikeErg'],['row','Róðravél'],['assault','Assault-hjól']];
var state=JSON.parse(JSON.stringify(window.TRACKER_DATA));
var data=state.example?makeExample():(state.data||{});
var app=document.getElementById('app');
var canEdit=false, saving=false, draft={}, names=null, pins=null, confirmClear=false, auth=null, loginErr='', loginWho='';
if(!state.coachPin)state.coachPin=pinHash('coach','1234');
var ui={view:'athlete',sel:state.athletes[0].id,filter:'all',pick:null,coachSession:'w1t1'};
try{var saved=JSON.parse(sessionStorage.getItem('tt-ui')||'null');if(saved){ui.view=saved.view||ui.view;ui.coachSession=saved.coachSession||ui.coachSession;if(saved.sel)ui.sel=saved.sel;}}catch(e){}
var h=location.hash.replace('#','');
if(h==='coach'||byId(h))loginWho=h;
try{var sa=JSON.parse(localStorage.getItem('tt-auth')||'null');if(sa&&validAuth(sa))setAuth(sa,false)}catch(e){}
if(canEdit){if(h==='coach')ui.view='coach';else if(h==='team')ui.view='team';else if(byId(h)){ui.view='athlete';ui.sel=h}}

function cyrb53(str){var h1=0xdeadbeef,h2=0x41c6ce57;for(var i=0,ch;i<str.length;i++){ch=str.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677)}h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return(h2>>>0).toString(16).padStart(8,'0')+(h1>>>0).toString(16).padStart(8,'0')}
function pinHash(who,pin){return cyrb53('thol|'+who+'|'+String(pin).trim())}
function storedHash(who){if(who==='coach')return state.coachPin;var a=byId(who);return a&&a.pin||null}
function validAuth(a){var sh=storedHash(a.who);return!!sh&&a.h===sh}
function setAuth(a,remember){auth=a;canEdit=a.who==='coach';if(!canEdit){ui.view='athlete';ui.sel=a.who}else if(ui.view!=='coach'&&ui.view!=='team'&&ui.view!=='athlete')ui.view='athlete';if(remember){try{localStorage.setItem('tt-auth',JSON.stringify(a))}catch(e){}}}
function logout(){auth=null;canEdit=false;loginErr='';try{localStorage.removeItem('tt-auth')}catch(e){}render();window.scrollTo(0,0)}

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
function fmtMin(n){return(Math.round(n*10)/10)+' mín'}
function total(s){if(!s)return null;var any=false,t=0;MACHINES.forEach(function(m){if(s[m[0]]!=null){any=true;t+=s[m[0]]}});return any?t:null}
function sign(n,fmt){if(n==null)return'—';var str=fmt?fmt(Math.abs(n)):Math.abs(n);return(n>0?'+':n<0?'−':'±')+str}
function cls(n,goodUp){if(!n)return'';return(n>0)===(goodUp!==false)?'up':'down'}
function hrMax(x){var m=0;SESSIONS.forEach(function(s){if(x[s.k]&&x[s.k].max>m)m=x[s.k].max});return m||null}
function countDone(x){return SESSIONS.filter(function(s){return x[s.k]}).length}
function persistUi(){try{sessionStorage.setItem('tt-ui',JSON.stringify({view:ui.view,coachSession:ui.coachSession,sel:ui.sel}))}catch(e){}}

function render(){
 var tabs=canEdit?[['athlete','Iðkendur'],['team','Hópurinn'],['coach','Skrá niðurstöður']]:[];
 if(auth&&!canEdit){ui.view='athlete';ui.sel=auth.who}
 var html='<header class="top"><svg class="ecg" viewBox="0 0 520 70" preserveAspectRatio="none" aria-hidden="true"><polyline fill="none" stroke="var(--pulse)" stroke-width="2.5" stroke-linejoin="round" points="0,44 90,44 104,44 112,30 120,44 150,44 160,58 172,6 184,64 194,44 236,44 250,36 262,44 330,44 340,58 352,6 364,64 374,44 416,44 430,36 442,44 520,44"/></svg><div class="wrap"><div class="toprow"><div class="eyebrow">Þjálfunarlota · 5 vikur</div>'+(auth?'<button class="logout" data-act="logout">'+(canEdit?'Þjálfari':esc(byId(auth.who).name))+' · Skrá út</button>':'')+'</div><h1>'+esc(state.project)+'</h1><nav class="tabs" role="tablist">';
 tabs.forEach(function(t){html+='<button class="tab" role="tab" data-act="view" data-v="'+t[0]+'" aria-selected="'+(ui.view===t[0])+'">'+t[1]+'</button>'});
 html+='</nav></div></header><main class="wrap">';
 if(!auth){app.innerHTML=html+loginView()+'</main>';var pi=document.getElementById('login-pin');if(pi&&loginWho)pi.focus();return}
 if(state.example&&canEdit&&ui.view!=='coach')html+='<div class="banner"><b>Dæmatölur.</b> Þessar tölur eru tilbúnar svo þú sjáir hvernig síðan virkar. Þær hverfa þegar niðurstöður eru vistaðar í fyrsta sinn.</div>';
 if(ui.view==='athlete')html+=athleteView();
 else if(ui.view==='team')html+=teamView();
 else html+=coachView();
 html+='</main>';
 app.innerHTML=html;
 if(ui.view==='athlete')drawChart();
}

function athleteView(){
 var a=byId(ui.sel)||state.athletes[0],x=data[a.id]||{};
 var html='';
 if(canEdit){html+='<div class="chips" role="group" aria-label="Veldu iðkanda">';
 state.athletes.forEach(function(b){html+='<button class="chip" data-act="sel" data-id="'+b.id+'" aria-pressed="'+(b.id===a.id)+'">'+esc(b.name)+'</button>'});
 html+='</div>';}
 var t1a=x.w1t1&&x.w1t1.min,t1b=x.w5t1&&x.w5t1.min,c1=total(x.w1t2),c5=total(x.w5t2);
 var d1=(t1a!=null&&t1b!=null)?t1b-t1a:null,d2=(c1!=null&&c5!=null)?c5-c1:null;
 html+='<section class="hero"><div><h2>'+esc(a.name)+'</h2><div class="sub">Próf í viku 1 borin saman við endurpróf í viku 5, auk allra æfinga þar á milli.</div></div><div class="stats">';
 html+=stat('Próf 1 · mínútur',d1!=null?'<span class="'+cls(d1)+'">'+sign(d1,fmtMin)+'</span>':(t1a!=null?'Mín '+t1a:'—'),t1a!=null?('Mín '+t1a+' · '+t1rpm(x.w1t1)+' rpm'+(t1b!=null?' → mín '+t1b+' · '+t1rpm(x.w5t1)+' rpm':' · endurpróf í viku 5')):'Ekki prófað enn');
 html+=stat('Próf 2 · samtals kal',d2!=null?'<span class="'+cls(d2)+'">'+sign(d2)+'</span>':(c1!=null?c1:'—'),c1!=null?(c1+(c5!=null?' → '+c5:' · endurpróf í viku 5')):'Ekki prófað enn');
 html+=stat('Æfingar kláraðar',countDone(x)+'<span style="font-size:.55em;color:var(--muted)"> / 10</span>','Próf og æfingar');
 html+='</div></section><div class="grid2">'+test1Card(x)+test2Card(x)+'</div>'+sessionsCard(x);
 return html;
}
function stat(k,v,s){return'<div class="stat"><div class="k">'+k+'</div><div class="v num">'+v+'</div><div class="s num">'+s+'</div></div>'}

function test1Card(x){
 var a=x.w1t1,b=x.w5t1;
 var html='<section class="card"><h3>Próf 1 · Hámarkspúls</h3><p class="desc">Assault-hjól. Byrjar í 50 snúningum á mínútu og hækkar á hverri mínútu þar til þú getur ekki meira. Því lengur, því betra.</p>';
 if(!a&&!b)return html+'<div class="empty">Engar niðurstöður enn.</div></section>';
 var mx=Math.max(a&&a.min||0,b&&b.min||0)||1;
 html+='<div class="cmp">';
 [['Vika 1',a,'w1'],['Vika 5',b,'w5']].forEach(function(r){
  var t=r[1]&&r[1].min;
  html+='<div class="cmp-row"><span class="lab">'+r[0]+'</span><div class="bar">'+(t!=null?'<i class="'+r[2]+'" style="width:'+Math.max(18,t/mx*100)+'%"></i><span class="num">Mínúta '+t+' · '+t1rpm(r[1])+' rpm</span>':'<span class="num" style="color:var(--muted);font-weight:500">Endurpróf í viku 5</span>')+'</div></div>';
 });
 html+='</div>'+stageBlock(a,b)+miniTable(a,b);
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
 var all=nn(sa.concat(sb));if(!all.length)return'';var lo=Math.floor((Math.min.apply(null,all)-5)/10)*10,hi=Math.ceil((Math.max.apply(null,all)+5)/10)*10;
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
function miniTable(a,b){
 var rows=[['Meðalpúls','avg',' bpm'],['Hámarkspúls','max',' bpm'],['Heildarkaloríur (Polar)','kcal','']];
 var html='<table class="mini num"><thead><tr><th></th><th>Vika 1</th><th>Vika 5</th><th>Breyting</th></tr></thead><tbody>';
 rows=rows.filter(function(r){return(a&&a[r[1]]!=null)||(b&&b[r[1]]!=null)});if(!rows.length)return'';
 rows.forEach(function(r){var va=a&&a[r[1]],vb=b&&b[r[1]],d=(va!=null&&vb!=null)?vb-va:null;
  html+='<tr><td>'+r[0]+'</td><td>'+(va!=null?va:'—')+'</td><td>'+(vb!=null?vb:'—')+'</td><td>'+sign(d)+'</td></tr>'});
 return html+'</tbody></table>';
}
function test2Card(x){
 var a=x.w1t2,b=x.w5t2;
 var html='<section class="card"><h3>Próf 2 · 10 mín hámarkskaloríur</h3><p class="desc">BikeErg, róðravél og Assault-hjól. Fleiri kaloríur, því betra.</p>';
 if(!a&&!b)return html+'<div class="empty">Engar niðurstöður enn.</div></section>';
 MACHINES.forEach(function(m){
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
 return html+miniTable(a,b)+'</section>';
}
function filtered(){return SESSIONS.filter(function(s){return ui.filter==='all'||(ui.filter==='tue'&&s.type==='tue')||(ui.filter==='thu'&&s.type==='thu')||(ui.filter==='test'&&(s.type==='t1'||s.type==='t2'))})}
function sessionsCard(x){
 var html='<section class="card"><div class="sess-head"><div><h3>Allar æfingar</h3><p class="desc" style="margin-bottom:0">Meðalpúls og hámarkspúls, með Polar-kaloríum fyrir neðan. Smelltu á æfingu til að sjá nánar.</p></div><div class="chips" role="group" aria-label="Sía æfingar">';
 [['all','Allt'],['tue','Þriðjudagar'],['thu','Fimmtudagar'],['test','Próf']].forEach(function(f){html+='<button class="chip sm" data-act="filter" data-f="'+f[0]+'" aria-pressed="'+(ui.filter===f[0])+'">'+f[1]+'</button>'});
 html+='</div></div><div class="legend"><span><i class="sw" style="background:var(--test)"></i>Próf</span><span><i class="sw" style="background:var(--pulse)"></i>Þriðjudagur</span><span><i class="sw" style="background:var(--long)"></i>Fimmtudagur</span><span><i class="sw" style="background:var(--muted)"></i>Meðalpúls (neðri tala)</span><span><i class="sw" style="border:2px solid var(--muted)"></i>Hámarkspúls (efri tala)</span></div><div class="chartbox" id="chart"></div>';
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
  html+='<div class="m">Meðalpúls <b class="num">'+(v.avg!=null?v.avg:'—')+'</b>'+(hm&&v.avg?' <span class="num">('+Math.round(v.avg/hm*100)+'% af hámarki)</span>':'')+'</div>';
  html+='<div class="m">Hámarkspúls <b class="num">'+(v.max!=null?v.max:'—')+'</b></div><div class="m">Kaloríur <b class="num">'+(v.kcal!=null?v.kcal:'—')+'</b></div>';
  if(s.type==='t1'&&v.min!=null)html+='<div class="m">Kláraði <b class="num">mín '+v.min+' · '+t1rpm(v)+' rpm</b></div>';
  if(s.type==='t2'&&total(v)!=null){MACHINES.forEach(function(m){if(v[m[0]]!=null)html+='<div class="m">'+m[1]+' <b class="num">'+v[m[0]]+'</b></div>'});html+='<div class="m">Samtals á tækjum <b class="num">'+total(v)+'</b></div>'}
  if(hasZones(v)){html+='<div class="zdetail">'+zoneBar(v,true)+'<div class="zlegend">'+ZK.map(function(k,i){return'<span><i class="sw zc'+(i+1)+'"></i>Svæði '+(i+1)+' <b class="num">'+Math.round((v[k]||0)/60)+' mín</b></span>'}).join('')+'</div></div>'}
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
function color(s){return s.cls==='h'?'var(--pulse)':s.cls==='l'?'var(--long)':'var(--test)'}
function drawChart(){
 var box=document.getElementById('chart');if(!box)return;
 var x=data[ui.sel]||{},list=filtered();
 var W=Math.max(320,Math.round(box.clientWidth||700)),H=300,pl=34,pr=8,top=18,hb=168,kt=226,kb=270;
 var vals=[];list.forEach(function(s){var v=x[s.k];if(v){if(v.avg!=null)vals.push(v.avg);if(v.max!=null)vals.push(v.max)}});
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
 var rows=state.athletes.map(function(a){var x=data[a.id]||{};var t1a=x.w1t1&&x.w1t1.min,t1b=x.w5t1&&x.w5t1.min,c1=total(x.w1t2),c5=total(x.w5t2);
  return{a:a,x:x,d1:(t1a!=null&&t1b!=null)?t1b-t1a:null,d2:(c1!=null&&c5!=null)?c5-c1:null}});
 var avg=function(k){var v=rows.filter(function(r){return r[k]!=null});return v.length?v.reduce(function(s,r){return s+r[k]},0)/v.length:null};
 var a1=avg('d1'),a2=avg('d2'),done=rows.reduce(function(s,r){return s+countDone(r.x)},0);
 var html='<section class="stats">'+stat('Meðaltal hóps · Próf 1',a1!=null?'<span class="'+cls(a1)+'">'+sign(a1,fmtMin)+'</span>':'—',a1!=null?'Lengur í stigvaxandi prófinu':'Eftir endurpróf í viku 5');
 html+=stat('Meðaltal hóps · Próf 2',a2!=null?'<span class="'+cls(a2)+'">'+sign(Math.round(a2))+'</span>':'—',a2!=null?'Fleiri kaloríur í 3 × 10 mín':'Eftir endurpróf í viku 5');
 html+=stat('Skráðar æfingar',done+'<span style="font-size:.55em;color:var(--muted)"> / '+(rows.length*10)+'</span>','Allir iðkendur, allar vikur')+'</section>';
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
 var html='<section class="card login"><h3>Opnaðu þínar niðurstöður</h3><p class="desc">Veldu nafnið þitt og sláðu inn PIN-númerið sem þjálfarinn gaf þér.</p><form id="login-form" class="login-form" autocomplete="off"><label class="f" for="login-who">Hver ert þú?<select id="login-who"><option value="">Veldu nafnið þitt</option>';
 state.athletes.forEach(function(a){html+='<option value="'+a.id+'"'+(loginWho===a.id?' selected':'')+'>'+esc(a.name)+'</option>'});
 html+='<option value="coach"'+(loginWho==='coach'?' selected':'')+'>Þjálfari</option></select></label><label class="f" for="login-pin">PIN-númer<input id="login-pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" placeholder="••••"></label><label class="remember" for="login-remember"><input id="login-remember" type="checkbox" checked> Muna eftir mér á þessu tæki</label><button class="btn" type="submit">Opna</button></form>'+(loginErr?'<p class="err" role="alert">'+esc(loginErr)+'</p>':'')+'</section>';
 return html;
}
function tryLogin(){
 var who=document.getElementById('login-who').value,pin=document.getElementById('login-pin').value.trim(),rem=document.getElementById('login-remember').checked;loginWho=who;
 if(!who){loginErr='Veldu nafnið þitt fyrst.';render();return}
 var sh=storedHash(who);
 if(!sh){loginErr='Ekkert PIN-númer hefur verið sett fyrir þig enn. Talaðu við þjálfarann.';render();return}
 if(pinHash(who,pin)!==sh){loginErr='Rangt PIN-númer. Talaðu við þjálfarann ef þú hefur gleymt því.';render();return}
 loginErr='';setAuth({who:who,h:sh},rem);render();window.scrollTo(0,0);
}

function coachView(){
 var s=SESSIONS.filter(function(q){return q.k===ui.coachSession})[0]||SESSIONS[0];
 var zf=[['z5','Svæði 5<small>mín:sek</small>'],['z4','Svæði 4<small>mín:sek</small>'],['z3','Svæði 3<small>mín:sek</small>'],['z2','Svæði 2<small>mín:sek</small>'],['z1','Svæði 1<small>mín:sek</small>']];
 var real=state.example?{}:(state.data||{});
 var fields;
 if(s.type==='t1'){fields=[];for(var si=1;si<=NSTEPS;si++)fields.push(['s'+si,si+'<small>'+rpmFor(si)+' rpm</small>']);fields.push(['max','Hámarkspúls'],['kcal','Polar kaloríur'])}
 else if(s.type==='t2'){fields=[['avg','Meðalpúls'],['max','Hámarkspúls']];MACHINES.forEach(function(m){fields.push([m[0],m[1]+' kal'])});fields.push(['kcal','Polar kaloríur'])}
 else fields=[['avg','Meðalpúls'],['max','Hámarkspúls'],['kcal','Kaloríur']];
 fields=fields.concat(zf);
 var html='';
 if(state.example)html+='<div class="banner"><b>Síðan sýnir dæmatölur núna.</b> Þær hverfa þegar þú vistar í fyrsta sinn. Þegar þú vistar sækist ný data.js skrá. Iðkendur sjá tölurnar ekki fyrr en sú skrá er komin á GitHub.</div>';
 html+='<section class="card"><div class="coach-top"><div><h3>Skrá niðurstöður</h3><p class="desc" style="margin-bottom:0">Veldu æfingu, sláðu inn tölur hvers iðkanda úr Polar og vistaðu. Skildu línu eftir auða ef einhver mætti ekki. Tími í svæðum er í sömu röð og hjá Polar (svæði 5 efst), skráður eins og Polar sýnir hann, t.d. 22:16 eða 00:22:16.'+(s.type==='t1'?' Í Prófi 1 er einn reitur fyrir hverja mínútu. Skrifaðu púlsinn fyrir hverja mínútu sem iðkandinn kláraði. Fjöldi útfylltra reita segir hvað hann kláraði margar mínútur og hvaða RPM, og hæsti púlsinn fer í hámarkspúls ef þú skrifar ekki annað.':'')+'</p></div><label class="f" for="c-session">Æfing<select id="c-session">';
 SESSIONS.forEach(function(q){var n=state.athletes.filter(function(a){return real[a.id]&&real[a.id][q.k]}).length;html+='<option value="'+q.k+'"'+(q.k===s.k?' selected':'')+'>Vika '+q.w+' · '+q.label+(n?' ('+n+' skráðir)':'')+'</option>'});
 html+='</select></label></div><div class="tablewrap"><table class="entry'+(s.type==='t1'?' steps':'')+'"><thead><tr><th>Iðkandi</th>';
 fields.forEach(function(f){html+='<th>'+f[1]+'</th>'});
 html+='</tr></thead><tbody>';
 state.athletes.forEach(function(a){
  var cur=(real[a.id]&&real[a.id][s.k])||{},dr=(draft[s.k]&&draft[s.k][a.id])||{};
  html+='<tr><td>'+esc(a.name)+(s.type==='t1'?'<small class="done num" id="done-'+s.k+'-'+a.id+'">'+doneText(rowStages(cur,dr))+'</small>':'')+'</td>';
  fields.forEach(function(f){var sm=/^s(\d+)$/.exec(f[0]);var v=dr[f[0]]!=null?dr[f[0]]:sm?(cur.stages&&cur.stages[sm[1]-1]!=null?cur.stages[sm[1]-1]:''):(cur[f[0]]!=null?(/^z[1-5]$/.test(f[0])?fmtTime(cur[f[0]]):cur[f[0]]):'');
   html+='<td><input id="in-'+s.k+'-'+a.id+'-'+f[0]+'" data-s="'+s.k+'" data-a="'+a.id+'" data-f="'+f[0]+'" inputmode="'+(/^z/.test(f[0])?'text':'numeric')+'"'+(sm?' class="step-in" maxlength="3"':/^z/.test(f[0])?' class="zone-in"':'')+' value="'+esc(v)+'" aria-label="'+esc(a.name)+' '+f[1].replace(/<[^>]+>/g,' ')+'"></td>'});
  html+='</tr>';
 });
 html+='</tbody></table></div><div class="actions"><button class="btn" data-act="save"'+(saving?' disabled':'')+'>'+(saving?'Vista…':'Vista æfingu')+'</button><span class="status">Sækir data.js með öllum æfingum sem hafa verið vistaðar.</span></div></section>';
 html+='<section class="card"><h3>Nöfn, PIN-númer og titill</h3><p class="desc">Breyttu nöfnum iðkenda og settu PIN-númer (4–8 tölustafir). Skildu PIN-reitinn eftir auðan til að halda núverandi númeri. PIN-númer eru falin eftir vistun, svo skrifaðu þau niður áður en þú sendir þau út.</p><label class="f" for="n-project">Titill verkefnis<input id="n-project" value="'+esc(names&&names.project!=null?names.project:state.project)+'"></label><div class="names">';
 state.athletes.forEach(function(a){var v=names&&names[a.id]!=null?names[a.id]:a.name,pv=pins&&pins[a.id]||'';html+='<div class="nameblock"><label for="n-'+a.id+'">'+a.id.replace('a','Iðkandi ')+'<input id="n-'+a.id+'" data-name="'+a.id+'" value="'+esc(v)+'"></label><label for="p-'+a.id+'">PIN · '+(a.pin?'<span class="up">skráð</span>':'<span class="down">ekki skráð</span>')+'<input id="p-'+a.id+'" data-pin="'+a.id+'" inputmode="numeric" maxlength="8" placeholder="Nýtt PIN" value="'+esc(pv)+'"></label></div>'});
 html+='<div class="nameblock"><label for="p-coach">PIN þjálfara (þitt)<input id="p-coach" data-pin="coach" inputmode="numeric" maxlength="8" placeholder="Nýtt PIN þjálfara" value="'+esc(pins&&pins.coach||'')+'"></label></div>';
 html+='</div><div class="actions"><button class="btn" data-act="save"'+(saving?' disabled':'')+'>'+(saving?'Vista…':'Vista nöfn')+'</button></div></section>';
 html+='<section class="card"><h3>Hlekkir fyrir hvern iðkanda</h3><p class="desc">Bættu merkinu aftan við hlekkinn á síðuna svo nafn iðkandans sé valið strax. Dæmi: …github.io/thol-tracker/<code>#a3</code></p><div class="links">';
 state.athletes.forEach(function(a){html+='<span>'+esc(a.name)+' <code>#'+a.id+'</code></span>'});
 html+='</div><p class="desc" style="margin-top:12px">Merkið velur nafnið á PIN-skjánum. Iðkendur sjá aðeins sína eigin síðu. Notaðu <code>#coach</code> fyrir þig.</p></section>';
 if(!state.example){html+='<section class="card"><h3>Byrja upp á nýtt</h3><p class="desc">Eyðir öllum vistuðum niðurstöðum. Nöfn og PIN-númer haldast.</p><button class="btn ghost" data-act="clear">'+(confirmClear?'Ýttu aftur til að eyða öllum niðurstöðum':'Eyða öllum niðurstöðum')+'</button></section>'}
 return html;
}

function toast(msg){var t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(function(){t.remove()},3500)}
function save(wipe){
 var nd=wipe||state.example?{}:JSON.parse(JSON.stringify(state.data||{})),bad=null;
 if(!wipe)Object.keys(draft).forEach(function(sk){Object.keys(draft[sk]).forEach(function(aid){
  var rec=Object.assign({},(nd[aid]&&nd[aid][sk])||{}),f=draft[sk][aid];
  var stepEdit=Object.keys(f).some(function(k){return/^s\d+$/.test(k)});
  if(stepEdit){var arr=rowStages(rec,f);if(arr.some(function(v){return v!=null&&(isNaN(v)||v<40||v>240)}))bad=byId(aid).name;
   else if(nn(arr).length){rec.stages=arr;rec.min=arr.length;rec.rpm=rpmFor(arr.length)}else{delete rec.stages;delete rec.min;delete rec.rpm}}
  Object.keys(f).forEach(function(k){if(k==='rpmManual'||k==='manual'||/^s\d+$/.test(k))return;var raw=String(f[k]).trim(),v;
   if(raw===''){delete rec[k];return}
   if(k==='stages'){var arr=raw.split(/[^0-9]+/).filter(Boolean).map(Number);if(!arr.length||arr.some(function(n){return n<40||n>240})){bad=byId(aid).name;return}rec.stages=arr;return}
   if(/^z[1-5]$/.test(k)){v=parseTime(raw);if(v==null||isNaN(v)){bad=byId(aid).name;return}rec[k]=v;return}
   v=Math.round(Number(raw.replace(',','.')));
   if(isNaN(v)){bad=byId(aid).name;return}rec[k]=v});
  if(/t1$/.test(sk)&&rec.min!=null&&rec.rpm==null)rec.rpm=rpmFor(rec.min);
  if(rec.stages&&rec.stages.length){if(rec.min==null)rec.min=rec.stages.length;if(rec.rpm==null)rec.rpm=rpmFor(rec.min);if(rec.max==null&&nn(rec.stages).length)rec.max=Math.max.apply(null,nn(rec.stages))}
  nd[aid]=nd[aid]||{};
  if(Object.keys(rec).length)nd[aid][sk]=rec;else delete nd[aid][sk];
 })});
 if(bad){toast('Athugaðu tölurnar hjá '+bad+'. Notaðu venjulegar tölur, t.d. 63.');return}
 var badPin=null;if(pins)Object.keys(pins).forEach(function(k){var v=String(pins[k]).trim();if(v&&!/^\d{4,8}$/.test(v))badPin=k==='coach'?'þjálfara':byId(k).name});
 if(badPin){toast('PIN-númerið fyrir '+badPin+' verður að vera 4 til 8 tölustafir.');return}
 var next={project:state.project,example:false,coachPin:state.coachPin,athletes:state.athletes.map(function(a){var o={id:a.id,name:a.name};if(a.pin)o.pin=a.pin;return o}),data:nd};
 if(pins){Object.keys(pins).forEach(function(k){var v=String(pins[k]).trim();if(!v)return;if(k==='coach')next.coachPin=pinHash('coach',v);else next.athletes.forEach(function(a){if(a.id===k)a.pin=pinHash(k,v)})})}
 if(names){if(names.project&&names.project.trim())next.project=names.project.trim();next.athletes.forEach(function(a){if(names[a.id]&&names[a.id].trim())a.name=names[a.id].trim()})}
 var text='// Gögn fyrir Þolþjálfun. Vistað '+new Date().toLocaleString('is-IS')+'\n// Settu þessa skrá í verkefnismöppuna, síðan commit og push.\nwindow.TRACKER_DATA = '+JSON.stringify(next,null,1)+';\n';
 try{
  var blob=new Blob([text],{type:'text/javascript'}),url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='data.js';document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url)},2000);
 }catch(e){toast('Ekki tókst að sækja skrána.');return}
 state=next;data=nd;draft={};names=null;pins=null;confirmClear=false;
 if(auth&&auth.who==='coach'&&auth.h!==state.coachPin){auth.h=state.coachPin;try{if(localStorage.getItem('tt-auth'))localStorage.setItem('tt-auth',JSON.stringify(auth))}catch(e){}}
 render();
 toast('data.js sótt. Settu hana í verkefnismöppuna, síðan commit og push.');
}

app.addEventListener('click',function(e){
 var el=e.target.closest('[data-act]');if(!el)return;var act=el.getAttribute('data-act');
 if(act==='view'){ui.view=el.getAttribute('data-v');ui.pick=null;persistUi();render();window.scrollTo(0,0)}
 else if(act==='sel'){ui.sel=el.getAttribute('data-id');ui.pick=null;if(el.getAttribute('data-go')){ui.view='athlete';window.scrollTo(0,0)}persistUi();render()}
 else if(act==='filter'){ui.filter=el.getAttribute('data-f');ui.pick=null;render()}
 else if(act==='pick'){ui.pick=el.getAttribute('data-k');var y=window.scrollY;render();window.scrollTo(0,y)}
 else if(act==='save')save(false);
 else if(act==='logout')logout();
 else if(act==='clear'){if(confirmClear)save(true);else{confirmClear=true;render()}}
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
 else if(t.dataset.name){names=names||{};names[t.dataset.name]=t.value}
 else if(t.dataset.pin){pins=pins||{};pins[t.dataset.pin]=t.value}
 else if(t.id==='n-project'){names=names||{};names.project=t.value}
});
app.addEventListener('submit',function(e){if(e.target.id==='login-form'){e.preventDefault();tryLogin()}});
app.addEventListener('change',function(e){if(e.target.id==='c-session'){ui.coachSession=e.target.value;persistUi();render()}});
window.addEventListener('hashchange',function(){var h=location.hash.replace('#','');if(!auth){if(h==='coach'||byId(h)){loginWho=h;render()}return}if(!canEdit)return;if(h==='team')ui.view='team';else if(h==='coach')ui.view='coach';else if(byId(h)){ui.view='athlete';ui.sel=h;ui.pick=null}render();window.scrollTo(0,0)});
var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){if(ui.view==='athlete')drawChart()},150)});

render();
})();
