/* Study Atlas app. All course content comes from COURSE (built from course.json). */
const C=COURSE,META=C.meta||{},UNIT=META.unitName||"Week",UNITU=UNIT.toUpperCase(),U1=UNIT[0];
const D=C.units,THEMES=C.themes||{},SEQ=C.seq||[],LISTS=C.lists||[],PAIRS=C.pairs||[],NUMS=C.nums||[],THREADS=C.threads||[],CONFUSE=C.confuse||[],FLAGS=C.flags||[],SORTS=C.sorts||[],TREES=C.trees||[],CALCS=C.calcs||[];
const XQ={hl:C.hl||[],num:C.num||[]},EXAM=Object.assign({count:20,minutes:30,desc:""},META.exam||{}),LAST=Math.max(...D.map(w=>w.n)),FIRST=Math.min(...D.map(w=>w.n));
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const KEY=META.storageKey||("study-atlas-"+(META.code||META.title||"course")).toLowerCase().replace(/[^a-z0-9]+/g,"-");
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return{}}};
const S=Object.assign({cards:{},qs:{},read:{},recall:{},notes:"",mocks:[]},load());
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const WK=n=>D.find(w=>w.n===n);
/* Slide PDFs sit next to this file, so links open them at the right page */
const SRC=C.sources||{},pdfName=n=>SRC[n]||SRC[String(n)]||"";
const pdfHref=(n,p)=>esc(encodeURI(pdfName(n))+(p&&/\.pdf$/i.test(pdfName(n))?`#page=${p}`:""));
const slideLink=(n,p,label)=>pdfName(n)?`<a class="ref" href="${pdfHref(n,p)}" target="_blank" rel="noopener" title="Open ${UNIT} ${n} source${p?" at page "+p:""}">${label||`${U1}${n} p${p}`}</a>`:(p?`<span class="mono">${label||`${U1}${n} p${p}`}</span>`:"");
const refLinks=s=>esc(s).replace(/[A-Z](\d+) p(\d+)/g,(m,n,p)=>pdfName(+n)?slideLink(+n,+p,m):m);
const tc=th=>`--tc:var(--${th})`;
const CARDS=[],QS=[];
D.forEach(w=>{w.cards.forEach((c,i)=>CARDS.push({id:`c${w.n}-${i}`,w:w.n,q:c[0],a:c[1]}));
w.mcq.forEach((q,i)=>QS.push({id:`q${w.n}-${i}`,w:w.n,stem:q[0],opts:q[1],ans:q[2],why:q[3],ref:q[4]}))});
const XSET={hl:[],num:[]};["hl","num"].forEach(k=>{const c={};(XQ[k]||[]).forEach(q=>{c[q[0]]=c[q[0]]||0;XSET[k].push({id:`${k}${q[0]}-${c[q[0]]++}`,w:q[0],stem:q[1],opts:q[2],ans:0,why:q[3],ref:q[4],set:k})})});
const ALLQ=QS.concat(XSET.hl,XSET.num);
const weekOptions=(all="All "+UNIT.toLowerCase()+"s")=>`<option value="0">${all}</option>`+D.map(w=>`<option value="${w.n}">${UNIT} ${w.n}: ${esc(w.short)}</option>`).join("");

/* Navigation */
const VIEWS=[["map","Mind map"],["guide","Study guide"],["cards","Flashcards"],["test","Practice test"],["drills","Drills"],["sheet","Cheat sheet"],["progress","Progress"]];
const rendered={};
function go(v){if(!VIEWS.some(x=>x[0]===v))v="map";
$$(".tabs button").forEach(b=>b.setAttribute("aria-selected",b.dataset.v===v));
$$(".view").forEach(e=>e.hidden=e.id!=="v-"+v);
try{history.replaceState(null,"","#"+v)}catch(e){}
if(v==="progress")renderProgress();
if(!rendered[v]){rendered[v]=1;({map:initMap,guide:renderGuide,cards:renderCards,test:renderTestHome,drills:renderDrills,sheet:renderSheet})[v]?.()}
if(v==="map")fit();}
$(".tabs").innerHTML=VIEWS.map(v=>`<button role="tab" data-v="${v[0]}">${v[1]}</button>`).join("");
$(".tabs").addEventListener("click",e=>{const b=e.target.closest("button");if(b)go(b.dataset.v)});
$("#theme").onclick=()=>{const r=document.documentElement,dark=r.dataset.theme?r.dataset.theme==="dark":matchMedia("(prefers-color-scheme:dark)").matches;r.dataset.theme=dark?"light":"dark";S.theme=r.dataset.theme;save()};
if(S.theme)document.documentElement.dataset.theme=S.theme;

/* Mind map */
const M={root:null,all:{},sel:null,recall:false,level:3,rev:{},T:{x:0,y:0,k:1},q:""};
const measureCtx=document.createElement("canvas").getContext("2d");
function textW(t,d){measureCtx.font=d===0?"700 16px 'Zilla Slab',Georgia,serif":d===1?"600 14px 'Source Sans 3','Segoe UI',sans-serif":`${d===2?600:500} 13px 'Source Sans 3','Segoe UI',sans-serif`;return measureCtx.measureText(t).width}
function buildTree(){
const mk=(t,d,depth,parent,id,w,th)=>{const n={id,t,d:d||"",depth,parent,w,th,c:[],open:false};M.all[id]=n;return n};
M.root=mk(META.code||META.title,META.subtitle||META.title||"",0,null,"r",0,Object.keys(THEMES)[0]||"t1");M.root.open=true;
D.forEach(w=>{const wn=mk(`${U1}${w.n}  ${w.short}`,w.idea,1,M.root,`w${w.n}`,w.n,w.th);M.root.c.push(wn);
w.map.forEach((t,i)=>{const tn=mk(t[0],t[1],2,wn,`w${w.n}t${i}`,w.n,w.th);wn.c.push(tn);
(t[2]||[]).forEach((l,j)=>tn.c.push(mk(l[0],l[1],3,tn,`w${w.n}t${i}l${j}`,w.n,w.th)))})});
const f=M.all["w"+FIRST];if(f)f.open=true;}
const NH=d=>d===0?44:d===1?34:28, GAPY=6, GAPX=44;
const hidden=n=>M.recall&&n.depth>=M.level&&!(n.id in M.rev);
const nodeW=n=>Math.max(hidden(n)?64:Math.ceil(textW(n.t,n.depth))+(n.c.length&&n.depth>0?44:22),40);
function spanH(n){if(!n.open||!n.c.length)return NH(n.depth);return Math.max(NH(n.depth),n.c.reduce((s,c)=>s+spanH(c)+GAPY,-GAPY))}
function place(n,x,top,side){const h=spanH(n);n.w0=nodeW(n);n.h0=NH(n.depth);n.cy=top+h/2;n.x0=side>0?x:x-n.w0;n.side=side;
if(n.open){let y=top;const inner=n.c.reduce((s,c)=>s+spanH(c)+GAPY,-GAPY);y=top+(h-inner)/2;n.c.forEach(c=>{place(c,side>0?n.x0+n.w0+GAPX:n.x0-GAPX,y,side);y+=spanH(c)+GAPY})}}
function layout(){const r=M.root,w=nodeW(r);r.w0=w;r.h0=44;r.x0=-w/2;r.cy=0;r.side=0;
const half=Math.ceil(r.c.length/2),R=r.c.slice(0,half),L=r.c.slice(half),total=a=>a.reduce((s,c)=>s+spanH(c)+14,-14);
let y=-total(R)/2;R.forEach(c=>{place(c,w/2+70,y,1);y+=spanH(c)+14});
y=-total(L)/2;L.forEach(c=>{place(c,-w/2-70,y,-1);y+=spanH(c)+14});}
function visible(n,o=[]){o.push(n);if(n.open)n.c.forEach(c=>visible(c,o));return o}
function drawMap(){layout();const ns=visible(M.root);let links="",nodes="";
ns.forEach(n=>{if(n.parent){const p=n.parent,x1=p.side===0?(n.side>0?p.x0+p.w0:p.x0):(n.side>0?p.x0+p.w0:p.x0),x2=n.side>0?n.x0:n.x0+n.w0,mx=(x1+x2)/2;
links+=`<path class="lk" style="${tc(n.th)}" d="M${x1} ${p.cy}C${mx} ${p.cy} ${mx} ${n.cy} ${x2} ${n.cy}"/>`}
const hid=hidden(n),st=S.recall[n.id],cls=["n",`d${n.depth}`,n.c.length?"":"leaf",M.sel===n?"sel":"",hid?"hid":"",M.recall&&!hid&&n.depth>=M.level&&st===1?"ok":"",M.recall&&!hid&&n.depth>=M.level&&st===0?"no":"",M.q&&matches(n)?"hit":""].join(" ");
const lbl=hid?"? ? ?":n.t,tx=n.depth===0?n.w0/2:11,anchor=n.depth===0?"middle":"start";
const badge=n.c.length&&n.depth>0?`<text class="badge" x="${n.w0-10}" y="${n.h0/2}" text-anchor="end">${n.open?"–":"+"+n.c.length}</text>`:"";
nodes+=`<g class="${cls}" data-id="${n.id}" tabindex="0" role="button" aria-label="${esc(hid?"Hidden node":n.t)}" style="${tc(n.th)}" transform="translate(${n.x0} ${n.cy-n.h0/2})"><rect width="${n.w0}" height="${n.h0}" rx="${n.depth<2?6:4}"/><text x="${tx}" y="${n.h0/2}" text-anchor="${anchor}">${esc(lbl)}</text>${badge}</g>`});
$("#vp").innerHTML=links+nodes;applyT();updateRecallCount();}
const matches=n=>{const q=M.q;return q&&(n.t.toLowerCase().includes(q)||n.d.toLowerCase().includes(q))};
function applyT(){const{x,y,k}=M.T;$("#vp").setAttribute("transform",`translate(${x} ${y}) scale(${k})`)}
function fit(){const svg=$("#mapsvg");if(!svg||!M.root)return;const r=svg.getBoundingClientRect();if(!r.width)return;layout();const ns=visible(M.root);
let a=1e9,b=-1e9,c=1e9,d=-1e9;ns.forEach(n=>{a=Math.min(a,n.x0);b=Math.max(b,n.x0+n.w0);c=Math.min(c,n.cy-n.h0/2);d=Math.max(d,n.cy+n.h0/2)});
const pad=64,raw=Math.min((r.width-40)/(b-a),(r.height-pad*2)/(d-c),1.05),k=Math.max(raw,r.width<620?.42:.6),tall=(d-c)*k>r.height-pad*2;M.T={k,x:r.width/2-(a+b)/2*k,y:tall?pad-c*k:r.height/2-(c+d)/2*k+8};applyT()}
function panel(n){const p=$("#panel");if(!n){p.classList.add("empty");p.innerHTML=`<h3>How to use the map</h3><ul class="tiplist"><li>Click a node to open it and read the detail.</li><li>Drag to move. Scroll or pinch to zoom.</li><li>Turn on Recall mode to hide the answers, say each one aloud, then reveal it.</li></ul>`;return}
p.classList.remove("empty");const path=[];for(let x=n;x;x=x.parent)path.unshift(x.t.replace(/\s\s/," "));
const hid=hidden(n),isTest=M.recall&&n.depth>=M.level;
p.innerHTML=`<div class="crumb">${esc(path.slice(1,-1).join(" / ")||"Course")}</div><h3>${esc(hid?"Hidden":n.t)}</h3>${n.d?`<p style="margin:0">${esc(n.d)}</p>`:n.c.length?`<p style="margin:0;color:var(--muted)">${n.c.length} branches. ${esc(n.c.slice(0,8).map(c=>hidden(c)?"?":c.t).join(", "))}</p>`:""}
${isTest&&!hid?`<div class="row"><button class="btn good" data-mark="1">I knew it</button><button class="btn bad" data-mark="0">I missed it</button></div>`:""}
${n.w?`<div class="row"><button class="btn" data-open="${n.w}">Open ${UNIT} ${n.w} guide</button>${slideLink(n.w,0,UNIT+" "+n.w+" source")}</div>`:""}`;
$$("[data-mark]",p).forEach(b=>b.onclick=()=>{S.recall[n.id]=+b.dataset.mark;save();drawMap();nextHidden(n)});
$$("[data-open]",p).forEach(b=>b.onclick=()=>openWeek(+b.dataset.open));}
function walk(n,o=[]){o.push(n);n.c.forEach(c=>walk(c,o));return o}
function nextHidden(cur){const nx=walk(M.root).find(n=>hidden(n));if(nx){const opened=!visible(M.root).includes(nx);for(let x=nx.parent;x;x=x.parent)x.open=true;M.sel=nx;panelHint(nx);drawMap();if(opened)fit()}else{M.sel=null;panel(cur);drawMap()}}
function panelHint(n){const p=$("#panel");p.classList.remove("empty");const par=n.parent.t.replace(/\s\s/," ");
const idx=n.parent.c.indexOf(n)+1;p.innerHTML=`<div class="crumb">Recall</div><h3>${esc(par)}</h3><p style="margin:0">Item ${idx} of ${n.parent.c.length}. Say it aloud, then reveal.</p><button class="btn primary" id="revealBtn">Reveal</button>`;
$("#revealBtn").onclick=()=>{M.rev[n.id]=1;drawMap();panel(n)};}
function clickNode(n){M.sel=n;if(hidden(n)){panelHint(n);drawMap();return}if(n.c.length&&n.depth>0)n.open=!n.open;panel(n);drawMap()}
function updateRecallCount(){const e=$("#recallCount");if(!e)return;const t=Object.values(M.all).filter(n=>n.depth>=M.level);e.textContent=M.recall?`${t.filter(n=>n.id in M.rev).length} of ${t.length} revealed`:""}
function setAll(open){Object.values(M.all).forEach(n=>{if(n.depth>0)n.open=open});drawMap();fit()}
function initMap(){buildTree();
const v=$("#v-map");v.innerHTML=`<div class="mapstage"><svg id="mapsvg" role="application" aria-label="Course mind map"><g id="vp"></g></svg>
<div class="tool"><input class="field" id="mapq" placeholder="Search the map" aria-label="Search the map"><button class="btn" id="mExp">Expand all</button><button class="btn" id="mCol">Collapse</button><button class="btn" id="mFit">Fit</button><button class="btn" id="mRec" aria-pressed="false">Recall mode</button><select class="field" id="mLvl" aria-label="What to hide" hidden style="width:auto"><option value="3">Hide details</option><option value="2">Hide topics too</option></select><button class="btn" id="mNew" hidden>Start again</button><span class="mono" id="recallCount"></span></div>
<div class="legend">${Object.entries(THEMES).map(([k,v])=>`<span><i style="background:var(--${k})"></i>${v[0]}</span>`).join("")}</div></div><aside class="panel empty" id="panel"></aside>`;
panel(null);$("#panel").classList.remove("empty");if(innerWidth<=900)$("#panel").classList.add("empty");
drawMap();
const svg=$("#mapsvg"),pts=new Map();let moved=false,start=null,pinch=0;
svg.addEventListener("pointerdown",e=>{pts.set(e.pointerId,[e.clientX,e.clientY]);moved=false;start=[e.clientX,e.clientY,M.T.x,M.T.y];if(pts.size===2){const[a,b]=[...pts.values()];pinch=Math.hypot(a[0]-b[0],a[1]-b[1])}});
svg.addEventListener("pointermove",e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,[e.clientX,e.clientY]);
if(pts.size===2){const[a,b]=[...pts.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);const r=svg.getBoundingClientRect();zoomAt((a[0]+b[0])/2-r.left,(a[1]+b[1])/2-r.top,d/pinch);pinch=d;moved=true;return}
const dx=e.clientX-start[0],dy=e.clientY-start[1];if(Math.abs(dx)+Math.abs(dy)>5){moved=true;svg.classList.add("drag");if(!svg.hasPointerCapture(e.pointerId))svg.setPointerCapture(e.pointerId)}
if(moved){M.T.x=start[2]+dx;M.T.y=start[3]+dy;applyT()}});
const up=e=>{pts.delete(e.pointerId);svg.classList.remove("drag");if(!moved&&e.type==="pointerup"){const g=e.target.closest&&e.target.closest(".n");if(g)clickNode(M.all[g.dataset.id])}};
svg.addEventListener("pointerup",up);svg.addEventListener("pointercancel",up);
const zoomAt=(x,y,f)=>{const k=Math.min(2.5,Math.max(.15,M.T.k*f)),r=k/M.T.k;M.T.x=x-(x-M.T.x)*r;M.T.y=y-(y-M.T.y)*r;M.T.k=k;applyT()};
svg.addEventListener("wheel",e=>{e.preventDefault();const r=svg.getBoundingClientRect();zoomAt(e.clientX-r.left,e.clientY-r.top,e.deltaY<0?1.12:.89)},{passive:false});
svg.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.closest(".n")){e.preventDefault();const id=e.target.closest(".n").dataset.id;clickNode(M.all[id]);$(`.n[data-id="${id}"]`)?.focus()}});
$("#mExp").onclick=()=>setAll(true);$("#mCol").onclick=()=>{setAll(false);M.sel=null};$("#mFit").onclick=fit;
$("#mRec").onclick=e=>{M.recall=!M.recall;e.target.setAttribute("aria-pressed",M.recall);$("#mLvl").hidden=$("#mNew").hidden=!M.recall;M.rev={};M.sel=null;
if(M.recall){Object.values(M.all).forEach(n=>{if(n.depth>0)n.open=false});nextHidden(M.root);fit()}else{drawMap();panel(null)}};
$("#mLvl").onchange=e=>{M.level=+e.target.value;M.rev={};Object.values(M.all).forEach(n=>{if(n.depth>0)n.open=false});nextHidden(M.root);fit()};
$("#mNew").onclick=()=>{M.rev={};Object.values(M.all).forEach(n=>{if(n.depth>0)n.open=false});nextHidden(M.root);fit()};
$("#mapq").oninput=e=>{M.q=e.target.value.trim().toLowerCase();if(M.q.length>1){Object.values(M.all).forEach(n=>{if(matches(n))for(let x=n.parent;x;x=x.parent)x.open=true})}else M.q="";drawMap();if(M.q)fit()};
addEventListener("resize",()=>{if(!$("#v-map").hidden)fit()});fit();}

/* Guide */
let curWeek=1,clozeOn=false;
function openWeek(n){curWeek=n;go("guide");drawWeek()}
function renderGuide(){drawWeek()}
function drawWeek(){const v=$("#v-guide"),w=WK(curWeek);
v.innerHTML=`<div class="guide"><nav class="side" aria-label="${UNIT}s">${D.map(x=>`<button style="${tc(x.th)}" data-w="${x.n}" aria-current="${x.n===curWeek}" class="${S.read[x.n]?"done":""}"><span class="mono">${U1}${String(x.n).padStart(2,"0")}</span><span class="lbl">${esc(x.short)}</span></button>`).join("")}</nav>
<div class="gmain"><article class="gwrap ${clozeOn?"cloze":""}" id="gw" style="${tc(w.th)}"><header><div class="wk">${UNITU} ${w.n}${THEMES[w.th]?" · "+esc(THEMES[w.th][0].toUpperCase()):""}</div><h1>${esc(w.title)}</h1></header>
<p class="idea">${esc(w.idea)}</p>
<div class="row"><button class="btn" id="clozeBtn" aria-pressed="${clozeOn}">Hide key terms</button><button class="btn" data-go="cards">Flashcards (${w.cards.length})</button>${w.mcq.length?`<button class="btn" data-go="test">Practice questions (${w.mcq.length})</button>`:""}${slideLink(w.n,0,"Open "+UNIT+" "+w.n+" source")}<button class="btn ${S.read[w.n]?"good":""}" id="readBtn">${S.read[w.n]?"Read ✓":"Mark as read"}</button></div>
${w.sections.map(s=>`<section class="sec"><h2>${s.h}</h2>${s.b}</section>`).join("")}
${(w.traps||[]).length?`<section class="trap"><h2>Exam traps</h2><ul>${w.traps.map(t=>`<li>${esc(t)}</li>`).join("")}</ul></section>`:""}
<div class="row spread">${WK(w.n-1)?`<button class="btn" data-w="${w.n-1}">${UNIT} ${w.n-1}</button>`:"<span></span>"}${WK(w.n+1)?`<button class="btn primary" data-w="${w.n+1}">${UNIT} ${w.n+1}</button>`:""}</div></article></div></div>`;
$$("[data-w]",v).forEach(b=>b.onclick=()=>{curWeek=+b.dataset.w;drawWeek();$(".gmain").scrollTop=0});
$("#clozeBtn").onclick=()=>{clozeOn=!clozeOn;$("#gw").classList.toggle("cloze",clozeOn);$("#clozeBtn").setAttribute("aria-pressed",clozeOn);$$(".sec b.rev").forEach(b=>b.classList.remove("rev"))};
$("#readBtn").onclick=()=>{S.read[w.n]=!S.read[w.n];save();drawWeek()};
$$("[data-go]",v).forEach(b=>b.onclick=()=>{if(b.dataset.go==="cards"){fcWeek=w.n;rendered.cards=0;go("cards")}else{rendered.test=0;go("test");startRun(QS.filter(q=>q.w===w.n),"practice")}});
$("#gw").addEventListener("click",e=>{if(e.target.closest(".sec b")&&clozeOn)e.target.closest(".sec b").classList.toggle("rev")});
$$("[data-widget]",v).forEach(mountWidget);}

/* Widgets: generic, data-driven. Use in section HTML as <div data-widget='sort:0'></div>, 'tree:0', 'calc:0' or 'notes'. */
function mountWidget(el){const[k,i]=el.dataset.widget.split(":");el.className="widget";const f={sort:wSort,tree:wTree,calc:wCalc,notes:wNotes}[k];const d={sort:SORTS,tree:TREES,calc:CALCS}[k];
if(!f||(d&&!d[+i||0])){el.remove();return}f(el,d?d[+i||0]:null)}
function wSort(el,X){let items=shuffle(X.items),i=0,ok=0;const draw=()=>{if(i>=items.length){el.innerHTML=`<h4>${esc(X.t)}</h4><p class="result">${ok} of ${items.length} correct.</p><div class="row"><button class="btn primary" id="again">Go again</button></div>`;$("#again",el).onclick=()=>{items=shuffle(X.items);i=0;ok=0;draw()};return}
el.innerHTML=`<h4>${esc(X.t)}</h4><div class="scorebar"><i style="width:${i/items.length*100}%"></i></div><p style="margin:0;font-weight:600">${esc(items[i][0])}</p><div class="row">${X.cats.map((c,s)=>`<button class="btn" data-s="${s}">${esc(c)}</button>`).join("")}</div><div class="mono">${i+1} of ${items.length} · ${ok} right</div>${items[i][2]&&false?"":""}`;
$$("[data-s]",el).forEach(b=>b.onclick=()=>{const right=+b.dataset.s===items[i][1];if(right)ok++;b.classList.add(right?"good":"bad");$$("[data-s]",el).forEach(x=>{x.disabled=true;if(+x.dataset.s===items[i][1])x.classList.add("good")});setTimeout(()=>{i++;draw()},right?450:1300)})};draw()}
function wTree(el,X){let s=X.start,path=[];const tone={good:"res-green",warn:"res-amber",bad:"res-red"};const draw=()=>{const n=X.nodes[s];if(!n){const m=(X.ends||{})[s]||[s,"warn",""];el.innerHTML=`<h4>${esc(X.t)}</h4><p class="bigscore ${tone[m[1]]||""}" style="font-size:2rem;margin:0">${esc(m[0])}</p>${m[2]?`<p style="margin:0">${esc(m[2])}</p>`:""}<div class="pathlist">Path: ${esc(path.join(" → "))}</div><div class="row"><button class="btn primary" id="rs">Start again</button></div>`;$("#rs",el).onclick=()=>{s=X.start;path=[];draw()};return}
el.innerHTML=`<h4>${esc(X.t)}</h4><div class="mono">${esc(s)} · ${esc(n[0])}</div><p style="margin:0;font-weight:600">${esc(n[1])}</p><div class="row"><button class="btn" id="y">Yes</button><button class="btn" id="n">No</button></div><div class="pathlist">${path.length?"Path: "+esc(path.join(" → ")):esc(X.intro||"Pick an example and answer each test.")}</div>`;
$("#y",el).onclick=()=>{path.push(s+" yes");s=n[2];draw()};$("#n",el).onclick=()=>{path.push(s+" no");s=n[3];draw()}};draw()}
function wCalc(el,X){const ids=X.inputs.map(x=>x.id);let fn;try{fn=new Function(...ids,"fmt","return "+X.out)}catch(e){el.remove();return}
const fmt=(v,d=2)=>Number(v).toLocaleString(undefined,{maximumFractionDigits:d});
el.innerHTML=`<h4>${esc(X.t)}</h4>${X.intro?`<p style="margin:0;font-size:.92rem">${esc(X.intro)}</p>`:""}${X.inputs.map(x=>x.type==="number"?`<label>${esc(x.label)}<input type="number" class="field" data-k="${x.id}" value="${x.value}" ${x.min!=null?`min="${x.min}"`:""} ${x.step?`step="${x.step}"`:""}></label>`:`<label>${esc(x.label)}: <span data-v="${x.id}"></span>${esc(x.unit||"")}<input type="range" data-k="${x.id}" min="${x.min}" max="${x.max}" step="${x.step||1}" value="${x.value}"></label>`).join("")}<p class="result" id="cr" style="margin:0"></p>${X.note?`<p class="mono" style="margin:0;color:var(--muted)">${esc(X.note)}</p>`:""}`;
const f=()=>{const v=ids.map(k=>+$(`[data-k="${k}"]`,el).value||0);ids.forEach((k,j)=>{const s=$(`[data-v="${k}"]`,el);if(s)s.textContent=v[j]});let r;try{r=fn(...v,fmt)}catch(e){r="Check the inputs."}$("#cr",el).textContent=r};$$("[data-k]",el).forEach(i=>i.oninput=f);f()}
function wNotes(el){el.innerHTML=`<h4>Your notes</h4><textarea class="field" id="notes" rows="6" aria-label="Your notes" placeholder="Anything you want to remember">${esc(S.notes)}</textarea><div class="mono" style="color:var(--muted)">Saved in this browser.</div>`;$("#notes",el).oninput=e=>{S.notes=e.target.value;save()}}

/* Flashcards */
let fcWeek=0,fcQ=[],fcFlip=false;
const BOX=id=>S.cards[id]||0;
function fcBuild(){const pool=CARDS.filter(c=>!fcWeek||c.w===fcWeek);fcQ=shuffle(pool.filter(c=>BOX(c.id)<3)).sort((a,b)=>BOX(a.id)-BOX(b.id));fcFlip=false}
function renderCards(){fcBuild();drawCards()}
function drawCards(){const v=$("#v-cards"),pool=CARDS.filter(c=>!fcWeek||c.w===fcWeek),ret=pool.filter(c=>BOX(c.id)>=3).length,learn=pool.filter(c=>BOX(c.id)>0&&BOX(c.id)<3).length,c=fcQ[0];
v.innerHTML=`<div class="wrap"><div><h1 class="page">Flashcards</h1><p class="lede">Answer in your head, then flip. A card retires after you get it right three times, like a credit leaving the registry.</p></div>
<div class="fc-stage"><select class="field" id="fcw" aria-label="Choose ${UNIT.toLowerCase()}">${weekOptions()}</select><div class="stat"><div><b>${pool.length-ret-learn}</b><span>New</span></div><div><b>${learn}</b><span>Learning</span></div><div><b>${ret}</b><span>Retired</span></div></div>
${c?`<button class="fc" id="fc" style="${tc(WK(c.w).th)}"><span class="wk">${UNITU} ${c.w}</span><span class="q">${esc(c.q)}</span>${fcFlip?`<span class="a">${esc(c.a)}</span>`:""}<span class="hint">${fcFlip?"":"Click or press Space to flip"}</span></button>
<div class="row" id="fcBtns" ${fcFlip?"":"hidden"}><button class="btn bad" id="fcA">Again (1)</button><button class="btn good" id="fcG">Got it (2)</button>${slideLink(c.w,0,UNIT+" "+c.w+" source")}</div>`:`<div class="box"><h4>All cards retired here</h4><p>Choose another ${UNIT.toLowerCase()}, or put these back in the deck.</p><button class="btn primary" id="fcR">Reset this deck</button></div>`}</div></div>`;
$("#fcw").value=fcWeek;$("#fcw").onchange=e=>{fcWeek=+e.target.value;fcBuild();drawCards()};
if(c){$("#fc").onclick=()=>{fcFlip=!fcFlip;drawCards()};$("#fcA").onclick=()=>rate(0);$("#fcG").onclick=()=>rate(1)}else $("#fcR").onclick=()=>{pool.forEach(x=>delete S.cards[x.id]);save();fcBuild();drawCards()}}
function rate(g){const c=fcQ.shift();S.cards[c.id]=g?BOX(c.id)+1:Math.max(0,BOX(c.id)-1);save();if(!g||S.cards[c.id]<3)fcQ.splice(Math.min(fcQ.length,g?12:4),0,c);fcFlip=false;drawCards()}
addEventListener("keydown",e=>{if($("#v-cards").hidden||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.key===" "&&fcQ[0]){e.preventDefault();fcFlip=!fcFlip;drawCards()}if(fcFlip&&e.key==="1")rate(0);if(fcFlip&&e.key==="2")rate(1)});

/* Practice test */
let R=null,tick=null;
const XINFO={hl:["Highlighted text only","Questions only on what the source materials emphasise: bold, coloured or highlighted text."],num:["Numbers only","Every figure, date, threshold, price and calculation result in the materials."]};
const xWeeks=k=>`<option value="0">All ${UNIT.toLowerCase()}s, mixed</option>`+D.filter(w=>XSET[k].some(q=>q.w===w.n)).map(w=>`<option value="${w.n}">${UNIT} ${w.n}: ${esc(w.short)} (${XSET[k].filter(q=>q.w===w.n).length})</option>`).join("");
const xBox=k=>{const L=XSET[k],ok=L.filter(q=>S.qs[q.id]===1).length;return`<div class="box"><h4>${XINFO[k][0]}</h4><p>${XINFO[k][1]} ${L.length} questions; ${ok} answered right so far.</p><div class="row"><select class="field" id="x${k}W" aria-label="Choose ${UNIT.toLowerCase()}">${xWeeks(k)}</select><select class="field" id="x${k}N" aria-label="How many"><option value="20">20</option><option value="50">50</option><option value="0">All</option></select></div><div class="row"><button class="btn primary" data-xs="${k}" data-m="all">Start</button><button class="btn" data-xs="${k}" data-m="new" ${L.some(q=>S.qs[q.id]!==1)?"":"disabled"}>Only ones not yet right</button></div></div>`};
function renderTestHome(){clearInterval(tick);const missed=ALLQ.filter(q=>S.qs[q.id]===0).length,v=$("#v-test");
v.innerHTML=`<div class="wrap"><div><h1 class="page">Practice test</h1><p class="lede">${esc(EXAM.desc||"Mixed questions from every "+UNIT.toLowerCase()+".")}</p></div>
<div class="wgrid"><div class="box"><h4>Mock exam</h4><p>${EXAM.count} random questions with a ${EXAM.minutes}-minute clock. No feedback until you submit.</p><button class="btn primary" id="tMock">Start mock</button></div>
<div class="box"><h4>By ${UNIT.toLowerCase()}</h4><p>Instant feedback and an explanation after each question.</p><div class="row"><select class="field" id="tW" aria-label="Choose ${UNIT.toLowerCase()}">${weekOptions("All "+UNIT.toLowerCase()+"s, mixed")}</select><button class="btn" id="tPrac">Start</button></div></div>
<div class="box"><h4>Fix mistakes</h4><p>${missed} question${missed===1?"":"s"} you got wrong last time.</p><button class="btn" id="tMiss" ${missed?"":"disabled"}>Redo missed</button></div></div>
${XSET.hl.length+XSET.num.length?`<div><h3>Focused sets</h3><p class="lede">Instant feedback, with a link to the slide after each answer.</p></div><div class="wgrid">${XSET.hl.length?xBox("hl"):""}${XSET.num.length?xBox("num"):""}</div>`:""}
${S.mocks.length?`<div><h3>Past mocks</h3><p class="mono">${S.mocks.slice(-10).map(m=>`${m}/${EXAM.count}`).join("   ")}</p></div>`:""}</div>`;
$("#tMock").onclick=()=>{const wks=shuffle(D.filter(w=>w.mcq.length)).map(w=>w.n);let picks=[];wks.forEach(w=>picks.push(shuffle(QS.filter(q=>q.w===w))[0]));const rest=shuffle(QS.filter(q=>!picks.includes(q)));picks=picks.concat(rest).slice(0,EXAM.count);startRun(shuffle(picks),"mock")};
$("#tPrac").onclick=()=>{const w=+$("#tW").value;startRun(shuffle(QS.filter(q=>!w||q.w===w)).slice(0,w?99:20),"practice")};
$("#tMiss").onclick=()=>startRun(shuffle(ALLQ.filter(q=>S.qs[q.id]===0)),"practice");
$$("[data-xs]",v).forEach(b=>b.onclick=()=>{const k=b.dataset.xs,w=+$(`#x${k}W`).value,n=+$(`#x${k}N`).value;let L=XSET[k].filter(q=>!w||q.w===w);if(b.dataset.m==="new")L=L.filter(q=>S.qs[q.id]!==1);L=shuffle(L);startRun(n?L.slice(0,n):L,"practice")});}
function startRun(list,mode){R={list:list.map(q=>({q,order:shuffle([0,1,2,3]),pick:null,flag:false})),i:0,mode,done:false,end:Date.now()+EXAM.minutes*6e4};clearInterval(tick);if(mode==="mock")tick=setInterval(()=>{const t=$("#timer");if(!t)return;const s=Math.max(0,Math.round((R.end-Date.now())/1000));t.textContent=`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;if(!s)submit()},1000);drawRun()}
function drawRun(){const v=$("#v-test"),it=R.list[R.i],q=it.q,show=R.done||(R.mode==="practice"&&it.pick!==null),L="ABCD";
const nav=R.list.map((x,i)=>{const cls=[i===R.i?"cur":"",R.done?(x.pick===x.q.ans?"right":"wrong"):x.pick!==null?"ans":"",x.flag?"flag":""].join(" ");return`<button class="${cls}" data-i="${i}" aria-label="Question ${i+1}">${i+1}</button>`}).join("");
const correct=R.list.filter(x=>x.pick===x.q.ans).length;
v.innerHTML=`<div class="wrap"><div class="row spread"><button class="btn" id="quit">Back to test menu</button>${R.mode==="mock"&&!R.done?`<span class="timer" id="timer">${String(EXAM.minutes).padStart(2,"0")}:00</span>`:""}${R.done?`<span class="bigscore">${correct}/${R.list.length}</span>`:""}</div>
${R.list.length<=30?`<div class="qnav">${nav}</div>`:`<div class="mono">Question ${R.i+1} of ${R.list.length}</div>`}
<div class="q-card" style="${tc(WK(q.w).th)}"><div class="wk">${UNITU} ${q.w}${q.set?` · ${q.set==="hl"?"HIGHLIGHTS":"NUMBERS"}`:""}</div><div class="stem">${esc(q.stem)}</div>
${it.order.map((o,i)=>{let c="";if(show){if(o===q.ans)c="right";else if(o===it.pick)c="wrong"}else if(o===it.pick)c="pick";return`<button class="opt ${c}" data-o="${o}"><span class="k">${L[i]}</span><span>${esc(q.opts[o])}</span></button>`}).join("")}
${show?`<div class="why">${esc(q.why)} ${q.ref?`<span class="mono">Source: ${refLinks(q.ref)}</span>`:""}</div>`:""}
<div class="row spread"><button class="btn" id="prev" ${R.i?"":"disabled"}>Previous</button>${R.mode==="mock"&&!R.done?`<button class="btn" id="flag" aria-pressed="${it.flag}">Flag</button>`:""}${R.i<R.list.length-1?`<button class="btn primary" id="next">Next</button>`:!R.done&&R.mode==="mock"?`<button class="btn primary" id="sub">Submit test</button>`:`<button class="btn primary" id="fin">Finish</button>`}</div></div></div>`;
$("#quit").onclick=()=>{R=null;renderTestHome()};
if(!show)$$(".opt",v).forEach(b=>b.onclick=()=>{it.pick=+b.dataset.o;if(R.mode==="practice"){S.qs[q.id]=it.pick===q.ans?1:0;save()}drawRun()});
$$("[data-i]",v).forEach(b=>b.onclick=()=>{R.i=+b.dataset.i;drawRun()});
$("#prev").onclick=()=>{R.i--;drawRun()};
$("#next")&&($("#next").onclick=()=>{R.i++;drawRun()});$("#flag")&&($("#flag").onclick=()=>{it.flag=!it.flag;drawRun()});$("#sub")&&($("#sub").onclick=submit);
$("#fin")&&($("#fin").onclick=()=>{R=null;renderTestHome()});}
function submit(){clearInterval(tick);R.done=true;R.list.forEach(x=>S.qs[x.q.id]=x.pick===x.q.ans?1:0);S.mocks.push(R.list.filter(x=>x.pick===x.q.ans).length);save();R.i=0;drawRun()}

/* Drills */
const DR=[["order","Put in order",SEQ.length],["lists","Name them all",LISTS.length],["match","Match pairs",PAIRS.length>=6],["sort","Sort it",SORTS.length],["tree","Decision trees",TREES.length],["calc","Calculators",CALCS.length]].filter(d=>d[2]);
let drTab=(DR[0]||[])[0];
function renderDrills(){const v=$("#v-drills");v.innerHTML=`<div class="wrap"><div><h1 class="page">Drills</h1><p class="lede">Short active-recall exercises. Pull the answer from memory first, since that is what makes it stick.</p></div><div class="pills" role="tablist">${DR.map(d=>`<button class="btn" data-d="${d[0]}" aria-pressed="${d[0]===drTab}">${d[1]}</button>`).join("")}</div><div id="drill">${DR.length?"":"<p>No drills for this course.</p>"}</div></div>`;
$$("[data-d]",v).forEach(b=>b.onclick=()=>{drTab=b.dataset.d;renderDrills()});
const e=$("#drill");if(!drTab)return;({order:dOrder,lists:dLists,match:dMatch,sort:()=>wrapW(e,SORTS.map((x,i)=>"sort:"+i)),tree:()=>wrapW(e,TREES.map((x,i)=>"tree:"+i)),calc:()=>wrapW(e,CALCS.map((x,i)=>"calc:"+i))})[drTab](e)}
function wrapW(e,ks){e.innerHTML=ks.map(k=>`<div data-widget="${k}"></div>`).join("");$$("[data-widget]",e).forEach(mountWidget)}
let oI=0;
function dOrder(e){const s=SEQ[oI];let pool=shuffle(s.i.map((t,i)=>({t,i}))),ans=[],checked=false;
const draw=()=>{e.innerHTML=`<div class="row" style="margin-bottom:12px"><select class="field" id="oS" aria-label="Choose sequence">${SEQ.map((x,i)=>`<option value="${i}">W${x.w}: ${esc(x.t)}</option>`).join("")}</select></div>
<div class="two"><div><h4 style="margin-bottom:6px">Tap in the right order</h4><div class="orderbox">${pool.map((p,i)=>`<button class="chip" data-p="${i}">${esc(p.t)}</button>`).join("")||`<span class="mono">All placed</span>`}</div></div>
<div><h4 style="margin-bottom:6px">Your order</h4><div class="orderbox">${ans.map((p,i)=>`<button class="chip ${checked?(p.i===i?"right":"wrong"):""}" data-a="${i}">${i+1}. ${esc(p.t)}</button>`).join("")}</div></div></div>
<div class="row"><button class="btn primary" id="oC" ${pool.length?"disabled":""}>Check</button><button class="btn" id="oN">Next sequence</button>${checked?`<span class="result">${ans.filter((p,i)=>p.i===i).length} of ${ans.length} in place</span>`:""}</div>`;
$("#oS").value=oI;$("#oS").onchange=x=>{oI=+x.target.value;dOrder(e)};
$$("[data-p]",e).forEach(b=>b.onclick=()=>{ans.push(pool.splice(+b.dataset.p,1)[0]);checked=false;draw()});
$$("[data-a]",e).forEach(b=>b.onclick=()=>{pool.push(ans.splice(+b.dataset.a,1)[0]);checked=false;draw()});
$("#oC").onclick=()=>{checked=true;draw()};$("#oN").onclick=()=>{oI=(oI+1)%SEQ.length;dOrder(e)}};draw()}
let lI=0;
function dLists(e){const s=LISTS[lI],got=new Set;let gave=false;
const draw=()=>{const left=s.i.length-got.size;e.innerHTML=`<div class="row" style="margin-bottom:12px"><select class="field" id="lS" aria-label="Choose list">${LISTS.map((x,i)=>`<option value="${i}">W${x.w}: ${esc(x.t)} (${x.i.length})</option>`).join("")}</select></div>
<div class="box" style="display:flex;flex-direction:column;gap:10px"><h4>${esc(s.t)}: name all ${s.i.length}</h4><div class="found">${s.i.map((x,i)=>got.has(i)?`<span class="tag">${esc(x[0])}</span>`:gave?`<span class="tag miss">${esc(x[0])}</span>`:`<span class="tag blank">?</span>`).join("")}</div>
<form id="lF" class="row"><input class="field" id="lI" autocomplete="off" placeholder="Type one and press Enter" aria-label="Your answer" style="flex:1"><button class="btn primary">Add</button></form>
<div class="row"><button class="btn" id="lG">Show the rest</button><button class="btn" id="lN">Next list</button><span class="mono">${left?left+" left":"All found"}</span></div></div>`;
$("#lS").value=lI;$("#lS").onchange=x=>{lI=+x.target.value;dLists(e)};
$("#lF").onsubmit=x=>{x.preventDefault();const v=$("#lI").value.toLowerCase();if(v)s.i.forEach((it,i)=>{if(!got.has(i)&&new RegExp(it[1],"i").test(v))got.add(i)});draw();$("#lI").focus()};
$("#lG").onclick=()=>{gave=true;draw()};$("#lN").onclick=()=>{lI=(lI+1)%LISTS.length;dLists(e)}};draw()}
function dMatch(e){const set=shuffle(PAIRS).slice(0,6),L=shuffle(set),Rr=shuffle(set);let sel=null,done=new Set,miss=0,t0=Date.now();
const draw=()=>{e.innerHTML=done.size===6?`<div class="box"><h4>Round complete</h4><p>${miss} wrong attempt${miss===1?"":"s"} in ${Math.round((Date.now()-t0)/1000)} seconds.</p><button class="btn primary" id="mA">New round</button></div>`:`<p class="mono">${done.size} of 6 matched · ${miss} wrong</p><div class="match"><div>${L.map(p=>`<button class="chip ${done.has(p[0])?"off":""} ${sel===p[0]?"sel":""}" data-l="${esc(p[0])}" ${done.has(p[0])?"disabled":""}>${esc(p[0])}</button>`).join("")}</div><div>${Rr.map(p=>`<button class="chip ${done.has(p[0])?"off":""}" data-r="${esc(p[0])}" ${done.has(p[0])?"disabled":""}>${esc(p[1])}</button>`).join("")}</div></div>`;
if(done.size===6){$("#mA").onclick=()=>dMatch(e);return}
$$("[data-l]",e).forEach(b=>b.onclick=()=>{sel=b.dataset.l;draw()});
$$("[data-r]",e).forEach(b=>b.onclick=()=>{if(!sel)return;if(b.dataset.r===sel){done.add(sel);sel=null;draw()}else{miss++;b.classList.add("wrong");sel=null;setTimeout(draw,500)}})};draw()}

/* Cheat sheet */
function renderSheet(){const v=$("#v-sheet");v.innerHTML=`<div class="wrap"><div><h1 class="page">Cheat sheet</h1><p class="lede">Everything that tends to blur together, on one page.</p></div>
${NUMS.length?`<section><div class="row spread" style="margin-bottom:8px"><h2>Numbers to memorise</h2><button class="btn" id="covBtn" aria-pressed="false">Cover the answers</button></div><div class="scroll" id="nums"><table class="t"><tr><th>Fact</th><th>Value</th><th>${UNIT}</th></tr>${NUMS.map(n=>`<tr><td>${esc(n[0])}</td><td class="cover"><b>${esc(n[1])}</b></td><td class="mono">${U1}${n[2]}</td></tr>`).join("")}</table></div></section>`:""}
${CONFUSE.length?`<section><h2 style="margin-bottom:8px">Easily confused pairs</h2><div class="wgrid">${CONFUSE.map(c=>`<div class="box"><h4>${esc(c[0])}</h4><p style="margin:0">${esc(c[1])}</p></div>`).join("")}</div></section>`:""}
${THREADS.length?`<section><h2 style="margin-bottom:4px">Threads across the ${UNIT.toLowerCase()}s</h2>${THREADS.map(t=>`<div class="thread"><b>${esc(t.t)}</b><div><div class="row" style="margin-bottom:3px">${t.w.filter(WK).map(w=>`<button class="wchip" style="${tc(WK(w).th)}" data-w="${w}">${U1}${w}</button>`).join("")}</div>${esc(t.d)}</div></div>`).join("")}</section>`:""}
${FLAGS.length?`<section><h2 style="margin-bottom:4px">Source errors and clashes</h2><p class="lede" style="margin-bottom:6px">Spots where the materials look wrong or disagree with each other. The materials' own wording is often what gets marked, so learn it and know the correction.</p>${FLAGS.map(f=>`<div class="flag"><span class="mono">${refLinks(f.w)}</span><div><p>${esc(f.s)}</p><p class="fix">${esc(f.f)}</p></div></div>`).join("")}</section>`:""}
${META.mode==="topic"?`<section><div class="warn">${esc(META.sourceNote||"Built from a topic name and public sources, not from your own course materials. Check anything important against your syllabus.")}</div></section>`:""}</div>`;
$("#covBtn")&&($("#covBtn").onclick=e=>{const on=$("#nums").classList.toggle("covered");e.target.setAttribute("aria-pressed",on);$$(".cover.rev").forEach(c=>c.classList.remove("rev"))});
$("#nums")&&$("#nums").addEventListener("click",e=>{const c=e.target.closest(".cover");if(c)c.classList.toggle("rev")});
$$("[data-w]",v).forEach(b=>b.onclick=()=>openWeek(+b.dataset.w));}

/* Progress */
function renderProgress(){const v=$("#v-progress"),rows=D.map(w=>{const cs=CARDS.filter(c=>c.w===w.n),ret=cs.filter(c=>BOX(c.id)>=3).length,qs=QS.filter(q=>q.w===w.n),seen=qs.filter(q=>q.id in S.qs),ok=seen.filter(q=>S.qs[q.id]===1).length,score=Math.round((ret/(cs.length||1))*50+(qs.length?ok/qs.length:0)*50);return{w,cs,ret,qs,seen,ok,score}});
const totRet=rows.reduce((s,r)=>s+r.ret,0),totOk=rows.reduce((s,r)=>s+r.ok,0),totSeen=rows.reduce((s,r)=>s+r.seen.length,0),weak=rows.filter(r=>r.w.mcq.length).sort((a,b)=>a.score-b.score).slice(0,3);
v.innerHTML=`<div class="wrap"><div><h1 class="page">Progress</h1><p class="lede">Saved in this browser only. Clearing site data removes it.</p></div>
<div class="stat"><div><b>${totRet}/${CARDS.length}</b><span>Cards retired</span></div><div><b>${totSeen?Math.round(totOk/totSeen*100)+"%":"–"}</b><span>Question accuracy</span></div><div><b>${S.mocks.length?Math.max(...S.mocks)+"/"+EXAM.count:"–"}</b><span>Best mock</span></div></div>
<div class="box"><h4>Start here next</h4><p style="margin:0 0 8px">Your three lowest ${UNIT.toLowerCase()}s:</p><div class="row">${weak.map(r=>`<button class="btn" data-w="${r.w.n}">${UNIT} ${r.w.n}: ${esc(r.w.short)}</button>`).join("")}</div></div>
<div>${rows.map(r=>`<div class="prow" style="${tc(r.w.th)}"><span class="mono">${U1}${String(r.w.n).padStart(2,"0")}</span><div class="scorebar"><i style="width:${r.score}%;background:var(--tc)"></i></div><span class="mono">${r.score}%</span><span class="sub">${esc(r.w.short)} · ${r.ret}/${r.cs.length} cards · ${r.ok}/${r.qs.length} questions right</span></div>`).join("")}</div>
<div class="row"><button class="btn" id="exp">Export progress</button><label class="btn" style="cursor:pointer">Import progress<input type="file" id="imp" accept=".json,application/json" hidden></label><button class="btn" id="rs1">Reset all progress</button><span id="rsC"></span></div></div>`;
$$("[data-w]",v).forEach(b=>b.onclick=()=>openWeek(+b.dataset.w));
$("#exp").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(S)],{type:"application/json"}));a.download=KEY+"-progress.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1e3)};
$("#imp").onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{try{const o=JSON.parse(t);Object.keys(S).forEach(k=>delete S[k]);Object.assign(S,{cards:{},qs:{},read:{},recall:{},notes:"",mocks:[]},o);save();fcBuild();renderProgress()}catch(err){$("#rsC").textContent="That file isn't a progress export."}})};
$("#rs1").onclick=()=>{$("#rsC").innerHTML=`<span class="row"><span>Erase everything?</span><button class="btn bad" id="rs2">Yes, erase</button></span>`;$("#rs2").onclick=()=>{Object.assign(S,{cards:{},qs:{},read:{},recall:{},mocks:[]});save();fcBuild();renderProgress()}};}

go((location.hash||"#map").slice(1));
