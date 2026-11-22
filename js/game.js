/* 夜市摊王 —— 游戏主体 */
(function(){
'use strict';
const C=NM.CONST, AI=NM.AI;
const $=id=>document.getElementById(id);
const app=$('app');
const food=id=>NM.FOODS.find(f=>f.id===id);
const dname=p=>p.name||food(p.food).name;
const r1=n=>Math.round(n*10)/10;
const fmt=n=>{n=r1(n);return Number.isInteger(n)?String(n):n.toFixed(1)};
const yen=n=>{const a=Math.abs(r1(n));return (n<-0.04?'-¥':'¥')+(Number.isInteger(a)?a.toLocaleString('en-US'):a.toFixed(1))};
const pick=a=>a[Math.floor(Math.random()*a.length)];
const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function weighted(list,wf){let t=0;const ws=list.map(x=>{const w=Math.max(0,wf(x));t+=w;return w});let r=Math.random()*t;for(let i=0;i<list.length;i++){r-=ws[i];if(r<=0)return list[i]}return list[list.length-1]}
const SAVE_KEY='night-market-v1';

/* ================= 存档 ================= */
function newPlayer(){return{id:'me',name:'我的小摊',owner:'🧑‍🍳',awning:'blue',sign:'#FFE08A',mascot:'',decor:['bulbs'],owned:{bulbs:true},rep:3.0,
  menu:[{food:'chicken',name:'大鸡排',price:12,desc:'现炸 外酥里嫩 大份管饱'},{food:'milktea',name:'珍珠奶茶',price:9,desc:'手作珍珠 香甜不腻'}],
  stock:[18,18],cards:{shout:2,discount:2,influencer:1},up:{helper:0,slot:0}}}
function newRival(r){const o=JSON.parse(JSON.stringify(r));o.money=C.START_MONEY;o.stock=o.menu.map(()=>16);return o}
function newSave(keep){
  const p=newPlayer();
  if(keep){['name','owner','awning','sign','mascot','menu'].forEach(k=>p[k]=JSON.parse(JSON.stringify(keep[k])));p.stock=p.menu.map(()=>16)}
  return{season:(S&&keep?S.season+1:1),night:0,money:C.START_MONEY,player:p,rivals:NM.RIVALS.map(newRival),totals:{me:0,wang:0,jie:0,li:0},last:null,notes:{},seenTip:false};
}
let S=null,R=null,scene='title',muted=false,tab='menu',ED=null;
function load(){try{const j=localStorage.getItem(SAVE_KEY);if(j){S=JSON.parse(j);return true}}catch(e){}return false}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(S))}catch(e){}}
try{muted=localStorage.getItem('nm-muted')==='1'}catch(e){}

/* ================= 工具 ================= */
const looksOf=st=>(st.decor||[]).reduce((a,id)=>{const d=NM.DECOR.find(x=>x.id===id);return a+(d?d.looks:0)},0)+(st.mascot?.5:0);
const stockCost=st=>st.menu.reduce((a,p,j)=>a+(st.stock[j]||0)*food(p.food).cost,0);
const maxSlots=()=>3+S.player.up.slot;
const flowOf=n=>NM.WEEK_FLOW[Math.min(n,6)];
function suggestStock(st,j){
  const L=S.last&&S.last[st.id]&&S.last[st.id].products[j];
  const base=L&&L.food===st.menu[j].food?L.sold*1.2+3:15;
  return Math.max(5,Math.round(base*flowOf(S.night)/(S.night>0?flowOf(S.night-1):1)));
}
let AC=null;
function tone(f,d,type,v,when=0,f2){const t=AC.currentTime+when,o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0008,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d+.03)}
function sfx(n){if(muted)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();
  switch(n){case'tap':tone(520,.06,'triangle',.1);break;case'coin':tone(1318,.05,'square',.04);tone(1760,.12,'square',.04,.05);break;
  case'card':[523,659,784,1046].forEach((f,i)=>tone(f,.12,'triangle',.1,i*.05));break;case'rival':tone(330,.18,'sawtooth',.05);tone(262,.25,'sawtooth',.05,.12);break;
  case'err':tone(180,.12,'square',.05);break;case'buy':tone(880,.07,'triangle',.1);tone(1175,.1,'triangle',.1,.05);break;
  case'bell':[659,523].forEach((f,i)=>tone(f,.35,'sine',.1,i*.18));break;case'sad':tone(300,.25,'sine',.05,0,200);break;}}catch(e){}}
const vibe=ms=>{try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}};
function floatAt(el,text,cls=''){if(!el)return;const r=el.getBoundingClientRect(),a=app.getBoundingClientRect(),f=document.createElement('div');f.className='float '+cls;f.textContent=text;f.style.left=(r.left-a.left+r.width/2)+'px';f.style.top=(r.top-a.top+r.height*.45)+'px';$('fx').appendChild(f);setTimeout(()=>f.remove(),1150)}
let toastT=0;function toast(m,ms=1600){const t=$('toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),ms)}
function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id===id));scene=id}
function modal(h){$('modalCard').innerHTML=h;$('modal').classList.add('on')}
function closeModal(){$('modal').classList.remove('on')}
function openSheet(){$('sheet').classList.add('on');$('sheetMask').classList.add('on')}
function closeSheet(){$('sheet').classList.remove('on');$('sheetMask').classList.remove('on');ED=null}
$('sheetMask').onclick=closeSheet;

/* ================= 摊位渲染 ================= */
function stallHTML(st,o={}){
  const aw=NM.LOOK.awnings.find(a=>a.id===st.awning)||NM.LOOK.awnings[0];
  const ink=st.sign==='#2B2140'?'#FFF6E5':'#2A1D2E';
  const d=new Set(st.decor||[]);
  const cls=['stall',o.mini?'mini':'',o.mine?'mine':'',st.mascot?'has-mascot':'',...['lantern','balloon','plant','speaker','neon'].filter(k=>d.has(k)).map(k=>'has-'+k)].join(' ');
  const stock=o.stock;
  const goods=st.menu.map((p,j)=>`<div class="st-good ${stock&&!(stock[j]>0)?'out':''}" data-j="${j}">${food(p.food).icon}<span class="pr">¥${fmt(p.price)}</span></div>`).join('');
  const board=st.menu.length?st.menu.map((p,j)=>`<div data-j="${j}"><span>${esc(dname(p))}</span><span>¥${fmt(p.price)}</span></div>`).join(''):'<div class="empty">点这里加菜品</div>';
  return `<div class="${cls}" style="--aw-a:${aw.a};--aw-b:${aw.b};--sign:${st.sign};--sign-ink:${ink}">
  <div class="st-pole l"></div><div class="st-pole r"></div>
  <div class="st-sign" data-edit="name">${esc(st.name)}</div>
  <div class="st-awning" data-edit="awning"></div>
  <div class="st-lights ${d.has('led')?'led':''}"></div>
  <div class="st-back"><div class="st-owner" data-edit="owner">${st.owner}</div><div class="st-board" data-edit="menu">${board}</div></div>
  <div class="st-counter" data-edit="menu"><div class="st-goods">${goods}</div><div class="st-neon">好吃到哭</div></div>
  <span class="st-deco st-lan l">🏮</span><span class="st-deco st-lan r">🏮</span><span class="st-deco st-balloon">🎈</span>
  <span class="st-deco st-plant">🪴</span><span class="st-deco st-speaker">🔊</span><span class="st-deco st-mascot" data-edit="mascot">${st.mascot||''}</span>
  <div class="st-me">我</div><div class="st-fx"></div><div class="st-star">🤳</div></div>`;
}
function miniWrap(st,w,o={}){const k=w/300;return `<div class="wrap" style="width:${w}px;height:${Math.round(220*k)}px"><div style="transform:scale(${k});transform-origin:0 0;width:300px;height:220px">${stallHTML(st,{mini:true,...o})}</div></div>`}

/* ================= 标题 ================= */
function renderTitle(){
  const has=load();
  const demo=has?S:{player:newPlayer(),rivals:NM.RIVALS};
  $('tStalls').innerHTML=[demo.rivals[0],demo.rivals[1],demo.player,demo.rivals[2]].map(s=>miniWrap(s,84,{mine:s.id==='me'})).join('');
  const el=$('tActions');
  if(has){
    el.innerHTML=`<button class="btn" id="tGo">继续<small>第 ${S.season} 季，第 ${S.night+1} 晚（${NM.WEEK[Math.min(S.night,6)]}）</small></button><button class="btn quiet" id="tNew">重新开始</button>`;
    $('tGo').onclick=()=>{sfx('tap');S.night>=C.SEASON_NIGHTS?seasonEnd():goPrep()};
    $('tNew').onclick=()=>{modal(`<div class="em">🧹</div><h3>重新开始？</h3><p>当前赛季的进度会清空。</p><button class="btn" id="mY">清空重来</button><button class="btn quiet" id="mN">算了</button>`);$('mY').onclick=()=>{closeModal();S=newSave();save();goPrep()};$('mN').onclick=closeModal};
  }else{
    el.innerHTML=`<button class="btn" id="tNew">开始摆摊</button>`;
    $('tNew').onclick=()=>{sfx('tap');S=newSave();save();goPrep()};
  }
}

/* ================= 出摊准备 ================= */
function goPrep(){show('prep');renderPrep();
  if(!S.seenTip){S.seenTip=true;save();modal(`<div class="em">🏮</div><h3>欢迎来到夜市</h3><p>这条街有四个摊位：你和三家老摊主。<br>先在这里设计摊位、定好菜品和价格，再出摊抢顾客。出摊时可以打出技能卡。<br>一季 7 晚，总利润第一就是夜市摊王。</p><button class="btn" id="mOk">开始设计摊位</button>`);$('mOk').onclick=closeModal}}
function renderPrep(){
  const P=S.player;
  $('pNight').textContent=`第 ${S.night+1} 晚`;
  $('pSub').textContent=`${NM.WEEK[S.night]}，${flowOf(S.night)>1.1?'人会很多':flowOf(S.night)<.9?'人会少一些':'人流一般'}，第 ${S.season} 季`;
  $('pMoney').textContent=yen(S.money);
  $('pRep').textContent=`口碑 ★${P.rep.toFixed(1)}，颜值 ${fmt(looksOf(P))}`;
  renderStage();
  document.querySelectorAll('#pTabs .tab').forEach(t=>t.classList.toggle('on',t.dataset.tab===tab));
  const top=$('pPanel').scrollTop;
  $('pPanel').innerHTML={menu:menuPanel,stock:stockPanel,look:lookPanel,shop:shopPanel,rivals:rivalsPanel}[tab]();
  $('pPanel').scrollTop=top;
  const need=stockCost(P)+C.STALL_FEE;
  $('goSub').textContent=`摊位费 ${yen(C.STALL_FEE)} + 备货 ${yen(stockCost(P))}`;
  $('goBtn').disabled=false;
  if(tab==='look'){const n=$('lkName');if(n)n.oninput=()=>{P.name=n.value.trim()||'我的小摊';renderStage();save()}}
}
function renderStage(){$('pStall').innerHTML=stallHTML(S.player)}
$('pStall').addEventListener('click',e=>{
  const g=e.target.closest('[data-j]'),ed=e.target.closest('[data-edit]');
  const P=S.player;
  if(g&&g.closest('.st-goods,.st-board')){tab='menu';renderPrep();openEditor(+g.dataset.j);return}
  if(!ed)return;
  const k=ed.dataset.edit;sfx('tap');
  if(k==='awning'){const a=NM.LOOK.awnings,i=a.findIndex(x=>x.id===P.awning);P.awning=a[(i+1)%a.length].id;toast('雨棚：'+a[(i+1)%a.length].name,900)}
  else if(k==='owner'){const a=NM.LOOK.owners;P.owner=a[(a.indexOf(P.owner)+1)%a.length]}
  else if(k==='mascot'){const a=NM.LOOK.mascots,i=a.findIndex(x=>x.icon===P.mascot);P.mascot=a[(i+1)%a.length].icon}
  else if(k==='name'){openNameSheet();return}
  else if(k==='menu'){tab='menu';renderPrep();if(!P.menu.length)openEditor(-1);return}
  save();renderPrep();
});
$('pTabs').addEventListener('click',e=>{const t=e.target.closest('.tab');if(!t)return;tab=t.dataset.tab;sfx('tap');$('pPanel').scrollTop=0;renderPrep()});

function priceChips(p){
  const f=food(p.food),r=p.price/f.ref,out=[];
  out.push(`<span class="chip">参考价 ¥${fmt(f.ref)}</span>`);
  if(p.price<=f.cost)out.push('<span class="chip warn">亏本</span>');
  else out.push(`<span class="chip ${p.price-f.cost<1?'warn':'ok'}">每份赚 ¥${fmt(p.price-f.cost)}</span>`);
  if(r>1.3)out.push('<span class="chip warn">比行情贵很多</span>');else if(r>1.1)out.push('<span class="chip">略贵</span>');else if(r<.85)out.push('<span class="chip ok">很实惠</span>');
  return out.join('');
}
function tagChips(p){
  const tags=AI.productTags(p),desc=AI.parseTags(p.desc);
  if(!desc.length)return '<span class="chip warn">描述里还没有卖点</span>'+tags.map(t=>`<span class="chip">${NM.TAGS[t].label}</span>`).join('');
  return tags.map(t=>`<span class="chip">${NM.TAGS[t].label}</span>`).join('');
}
function menuPanel(){
  const P=S.player;
  let h='<div class="note">顾客会看菜名、价格、描述和摊位颜值来选。描述里的关键词（比如“现炸”“大份”“祖传”“网红”）会被识别成卖点，不同人群喜欢的卖点不一样。</div>';
  P.menu.forEach((p,j)=>{const f=food(p.food);
    h+=`<div class="prod" data-prod="${j}"><div class="ic">${f.icon}</div><div class="info"><div class="top"><span class="nm">${esc(dname(p))}</span><span class="pr">¥${fmt(p.price)}</span></div>
    <div class="desc">${p.desc?esc(p.desc):'<i>还没写描述</i>'}</div><div class="chips">${tagChips(p)}${priceChips(p)}</div></div></div>`});
  if(P.menu.length<maxSlots())h+=`<button class="prod add" data-prod="-1">＋ 添加菜品（${P.menu.length}/${maxSlots()}）</button>`;
  return h;
}
function stockPanel(){
  const P=S.player;
  let h=`<div class="note">食材当晚做完，剩下的只能扔掉。今晚${NM.WEEK[S.night]}，${flowOf(S.night)>1.1?'周末人多，多备点':'参考昨晚卖出量备货'}。</div>`;
  P.menu.forEach((p,j)=>{const f=food(p.food),n=P.stock[j]||0,L=S.last&&S.last.me&&S.last.me.products[j];
    h+=`<div class="row"><div class="ic">${f.icon}</div><div class="info"><div class="nm">${esc(dname(p))}</div><div class="ds">成本 ¥${fmt(f.cost)}/份${L&&L.food===p.food?`，昨晚卖 ${L.sold}/${L.stock}`:''}<br><button class="chip" data-sug="${j}" style="margin-top:4px">建议 ${suggestStock(P,j)} 份</button></div></div>
    <div class="stepper"><button data-st="${j}" data-d="-5" ${n<=0?'disabled':''}>−</button><span class="v num">${n}</span><button data-st="${j}" data-d="5">＋</button></div></div>`});
  const sc=stockCost(P),need=sc+C.STALL_FEE;
  h+=`<div class="total"><span>备货 ${yen(sc)} + 摊位费 ${yen(C.STALL_FEE)}</span><span class="${need>S.money?'neg':''}">${yen(need)}</span></div>`;
  return h;
}
function lookPanel(){
  const P=S.player;
  let h=`<div class="sec">摊名</div><input class="txt" id="lkName" maxlength="8" value="${esc(P.name)}" placeholder="给摊位起个名字">`;
  h+=`<div class="sec">雨棚</div><div class="swatches">${NM.LOOK.awnings.map(a=>`<button class="sw aw ${a.id===P.awning?'on':''}" style="--a:${a.a};--b:${a.b}" data-aw="${a.id}" aria-label="${a.name}"></button>`).join('')}</div>`;
  h+=`<div class="sec">招牌颜色</div><div class="swatches">${NM.LOOK.signs.map(c=>`<button class="sw ${c===P.sign?'on':''}" style="background:${c}" data-sign="${c}" aria-label="招牌颜色"></button>`).join('')}</div>`;
  h+=`<div class="sec">摊主</div><div class="swatches">${NM.LOOK.owners.map(o=>`<button class="sw ${o===P.owner?'on':''}" data-owner="${o}">${o}</button>`).join('')}</div>`;
  h+=`<div class="sec">吉祥物</div><div class="swatches">${NM.LOOK.mascots.map(m=>`<button class="sw ${m.icon===P.mascot?'on':''}" data-mascot="${m.icon}" aria-label="${m.name}">${m.icon||'✕'}</button>`).join('')}</div>`;
  h+=`<div class="sec">装饰</div><div class="note">装饰提升颜值，小情侣和游客最看重颜值。</div>`;
  NM.DECOR.filter(d=>d.id!=='bulbs').forEach(d=>{const own=P.owned[d.id],on=P.decor.includes(d.id);
    h+=`<div class="row"><div class="ic">${d.icon}</div><div class="info"><div class="nm">${d.name}</div><div class="ds">${d.desc}</div></div><div class="btns">${own?`<button class="buy ${on?'':'alt'}" data-dec="${d.id}">${on?'已摆上':'摆上'}</button>`:`<button class="buy" data-buydec="${d.id}" ${S.money<d.price?'disabled':''}>${yen(d.price)}</button>`}</div></div>`});
  return h;
}
function shopPanel(){
  const P=S.player;
  let h='<div class="sec">技能卡</div><div class="note">出摊时点卡片就能发动，每张用一次。</div>';
  for(const id in NM.CARDS){const c=NM.CARDS[id];
    h+=`<div class="row"><div class="ic">${c.icon}</div><div class="info"><div class="nm">${c.name}<span style="font-weight:400;opacity:.6">　持有 ${P.cards[id]||0}</span></div><div class="ds">${c.desc}</div></div><div class="btns"><button class="buy" data-card="${id}" ${S.money<c.price?'disabled':''}>${yen(c.price)}</button></div></div>`}
  h+='<div class="sec">升级</div>';
  NM.UPGRADES.forEach(u=>{const l=P.up[u.id],max=l>=u.costs.length;
    h+=`<div class="row"><div class="ic">${u.icon}</div><div class="info"><div class="nm">${u.name}${l?` Lv.${l}`:''}</div><div class="ds">${max?'已满级':u.desc(l)}</div></div><div class="btns">${max?'<span class="pill">满级</span>':`<button class="buy" data-up="${u.id}" ${S.money<u.costs[l]?'disabled':''}>${yen(u.costs[l])}</button>`}</div></div>`});
  return h;
}
function rivalsPanel(){
  let h='<div class="note">对手的菜单和价格是公开的。他们每晚会根据生意调整，下面是他们今晚的打算。</div>';
  S.rivals.forEach(r=>{
    const L=S.last&&S.last[r.id];
    h+=`<div class="rv">${miniWrap(r,120)}<div class="info"><div class="nm">${r.owner} ${esc(r.name)}　<span style="font-weight:400">★${r.rep.toFixed(1)}</span></div><div class="persona">${r.persona}</div>
    ${r.menu.map(p=>`<div>${food(p.food).icon} ${esc(dname(p))} <b>¥${fmt(p.price)}</b><br><span style="opacity:.6">${esc(p.desc)}</span></div>`).join('')}
    <div style="margin-top:4px;opacity:.75">${L?`昨晚利润 ${yen(L.profit)}。`:''}${S.notes[r.id]?`动向：${esc(S.notes[r.id])}`:''}</div></div></div>`});
  return h;
}
$('pPanel').addEventListener('click',e=>{
  const P=S.player,b=e.target.closest('button,.prod');if(!b||b.disabled)return;
  const ds=b.dataset;
  if(ds.prod!=null){sfx('tap');openEditor(+ds.prod);return}
  if(ds.st!=null){const j=+ds.st;P.stock[j]=clamp((P.stock[j]||0)+(+ds.d),0,200);sfx('tap')}
  else if(ds.sug!=null){const j=+ds.sug;P.stock[j]=suggestStock(P,j);sfx('tap')}
  else if(ds.aw){P.awning=ds.aw;sfx('tap')}
  else if(ds.sign){P.sign=ds.sign;sfx('tap')}
  else if(ds.owner){P.owner=ds.owner;sfx('tap')}
  else if(ds.mascot!=null){P.mascot=ds.mascot;sfx('tap')}
  else if(ds.dec){const i=P.decor.indexOf(ds.dec);if(i>=0)P.decor.splice(i,1);else P.decor.push(ds.dec);sfx('tap')}
  else if(ds.buydec){const d=NM.DECOR.find(x=>x.id===ds.buydec);if(!spend(d.price))return;P.owned[d.id]=true;P.decor.push(d.id);toast(`${d.icon} ${d.name} 摆上了`)}
  else if(ds.card){const c=NM.CARDS[ds.card];if(!spend(c.price))return;P.cards[ds.card]=(P.cards[ds.card]||0)+1;toast(`${c.icon} ${c.name} +1`)}
  else if(ds.up){const u=NM.UPGRADES.find(x=>x.id===ds.up);if(!spend(u.costs[P.up[u.id]]))return;P.up[u.id]++;toast(`${u.icon} ${u.name}，完成`)}
  else return;
  save();renderPrep();
});
function spend(n){if(S.money<n){sfx('err');toast('钱不够');return false}S.money-=n;sfx('buy');vibe(6);return true}

function openNameSheet(){
  const P=S.player;
  $('sheet').innerHTML=`<h3>给摊位起名</h3><input class="txt" id="nmIn" maxlength="8" value="${esc(P.name)}"><div class="note">最多 8 个字，会写在招牌上。</div><div class="actions"><button class="btn" id="nmOk">好了</button></div>`;
  openSheet();
  $('nmOk').onclick=()=>{P.name=$('nmIn').value.trim()||'我的小摊';save();closeSheet();renderPrep()};
}
/* ---- 菜品编辑 ---- */
function openEditor(j){
  const P=S.player;
  if(j<0&&P.menu.length>=maxSlots()){toast('菜单满了，可以在商店加菜品位');return}
  let d;
  if(j<0){const used=new Set(P.menu.map(p=>p.food));const f=NM.FOODS.find(x=>!used.has(x.id));d={food:f.id,name:f.name.replace(/\(.*\)/,''),price:f.ref,desc:''}}
  else d={...P.menu[j]};
  ED={j,d,pick:j<0};renderEditor();openSheet();
}
function renderEditor(){
  const d=ED.d,P=S.player,used=new Set(P.menu.filter((_,i)=>i!==ED.j).map(p=>p.food));
  $('sheet').innerHTML=`<h3>${ED.j<0?'添加菜品':'编辑菜品'}</h3>
  <label>卖什么</label>${ED.pick?'':`<div class="row" style="background:#fff;border-radius:12px;padding:8px 10px;border:0"><div class="ic">${food(d.food).icon}</div><div class="info"><div class="nm">${food(d.food).name}</div><div class="ds">${food(d.food).cat}，参考价 ¥${fmt(food(d.food).ref)}，成本 ¥${fmt(food(d.food).cost)}</div></div><button class="buy alt" data-repick="1">换一个</button></div>`}<div class="foodgrid" ${ED.pick?'':'hidden'}>${NM.FOODS.map(x=>`<button class="food ${x.id===d.food?'on':''} ${used.has(x.id)?'used':''}" data-food="${x.id}"><b>${x.icon}</b>${x.name.replace(/\(.*\)/,'')}<br>¥${fmt(x.ref)}</button>`).join('')}</div>
  <label>菜名</label><input class="txt" id="edName" maxlength="10" value="${esc(d.name)}">
  <label>售价</label><div class="pricebox"><button data-dp="-0.5" aria-label="降价">−</button><div class="big num" id="edPrice">¥${fmt(d.price)}</div><button data-dp="0.5" aria-label="涨价">＋</button></div>
  <div class="chips" id="edPC"></div>
  <label>描述（顾客会看到）</label><textarea class="txt" id="edDesc" maxlength="30" placeholder="例如：现炸 外酥里嫩 大份管饱">${esc(d.desc)}</textarea>
  <div class="chips" id="edTags"></div>
  <div class="actions">${ED.j>=0&&P.menu.length>1?'<button class="btn quiet" id="edDel">删除</button>':''}<button class="btn" id="edSave">保存</button></div>`;
  edChips();
  $('edName').oninput=e=>{ED.d.name=e.target.value};
  $('edDesc').oninput=e=>{ED.d.desc=e.target.value;edChips()};
  $('edSave').onclick=()=>{
    const d=ED.d;d.name=(d.name||'').trim()||food(d.food).name.replace(/\(.*\)/,'');d.desc=(d.desc||'').trim();
    if(ED.j<0){P.menu.push(d);P.stock.push(15)}else{if(P.menu[ED.j].food!==d.food)P.stock[ED.j]=15;P.menu[ED.j]=d}
    sfx('buy');save();closeSheet();renderPrep();
  };
  const del=$('edDel');if(del)del.onclick=()=>{P.menu.splice(ED.j,1);P.stock.splice(ED.j,1);save();closeSheet();renderPrep()};
}
function edChips(){const p=ED.d;$('edPC').innerHTML=priceChips(p);$('edTags').innerHTML='<span style="font-size:12px;opacity:.6;margin-right:4px">顾客会注意到：</span>'+tagChips(p);$('edPrice').textContent='¥'+fmt(p.price)}
$('sheet').addEventListener('click',e=>{
  if(!ED)return;const b=e.target.closest('button');if(!b)return;
  if(b.dataset.food){const id=b.dataset.food;if(b.classList.contains('used')){toast('菜单里已经有了');return}
    const old=food(ED.d.food),f=food(id);
    if(!ED.d.name||ED.d.name===old.name.replace(/\(.*\)/,''))ED.d.name=f.name.replace(/\(.*\)/,'');
    ED.d.food=id;ED.d.price=f.ref;ED.pick=false;sfx('tap');
    const keepName=ED.d.name,keepDesc=ED.d.desc;renderEditor();ED.d.name=keepName;ED.d.desc=keepDesc;}
  else if(b.dataset.repick){ED.pick=true;renderEditor()}
  else if(b.dataset.dp){ED.d.price=clamp(r1(ED.d.price+(+b.dataset.dp)),1,199);sfx('tap');edChips()}
});

$('goBtn').onclick=()=>{
  const P=S.player;
  if(!P.menu.length){toast('先加一道菜');tab='menu';renderPrep();return}
  if(P.stock.reduce((a,b)=>a+b,0)<=0){toast('还没备货');tab='stock';renderPrep();return}
  const need=stockCost(P)+C.STALL_FEE;
  if(need>S.money){sfx('err');toast(`钱不够：需要 ${yen(need)}，少备点货`);tab='stock';renderPrep();return}
  startNight();
};

/* ================= 夜市运营 ================= */
const POS_IDS=['wang','jie','me','li'];
function stallSrc(id){return id==='me'?S.player:S.rivals.find(r=>r.id===id)}
async function startNight(){
  const P=S.player;
  S.money-=stockCost(P)+C.STALL_FEE;
  S.rivals.forEach(r=>{r.money-=stockCost(r)+C.STALL_FEE});
  R={t:0,people:[],spawnT:.4,flowUntil:0,nextId:1,paused:false,ended:false,appeal:{},tacT:0,lbT:0,bannerT:0,lastOrderSaid:false,
    stalls:POS_IDS.map((id,i)=>{const src=stallSrc(id);return{
      id,src,i,mine:id==='me',name:src.name,owner:src.owner,
      menu:src.menu.map(p=>({...p,name:dname(p)})),stock:[...src.stock],stock0:[...src.stock],foodCost:stockCost(src),
      rep:src.rep,rep0:src.rep,decor:src.decor||[],looks:looksOf(src),effects:{},effUntil:{},
      queue:[],queueLen:0,serving:null,serveT:0,speed:id==='me'?[1,1.35,1.7][P.up.helper]:1,
      stats:{revenue:0,served:0,items:0,bySeg:{},walkedAway:0,sampled:0,products:src.menu.map(p=>({food:p.food,sold:0,stock:0,soldOutAt:null}))},
      fxSig:''}})};
  const ctx={segments:NM.SEGMENTS,weekday:NM.WEEK[S.night],
    stalls:R.stalls.map(s=>({id:s.id,name:s.name,rep:s.rep,looks:s.looks,menu:s.menu.map(p=>({food:p.food,name:p.name,price:p.price,desc:p.desc,cat:food(p.food).cat,ref:food(p.food).ref}))}))};
  R.appeal=(await AI.prepareNight(ctx)).appeal;
  buildMarket();
  show('market');
  layoutMarket();
  sfx('bell');banner(`<b>${NM.WEEK[S.night]}夜市，开张！</b>`,1600);
}
function buildMarket(){
  $('mNight').textContent=`第${S.night+1}晚`;
  document.querySelectorAll('.m-slot').forEach(sl=>{const s=R.stalls[+sl.dataset.pos];s.slot=sl;sl.innerHTML='';sl.onclick=()=>stallInfo(s)});
  $('mPeople').innerHTML='';
  renderCards();renderBoard();
}
let G={};
function layoutMarket(){
  if(!R)return;
  const stage=$('mStage'),sr=stage.getBoundingClientRect();
  const w=Math.min(200,(sr.width-28)/2);
  R.stalls.forEach(s=>{s.slot.innerHTML=miniWrap(s.src,w,{mine:s.mine,stock:s.stock});s.fxSig='';s.stockSig=''});
  const st=$('mStreet').getBoundingClientRect();
  const top=st.top-sr.top,bot=st.bottom-sr.top,h=bot-top;
  G={w:sr.width,top,bot,lanes:[top+h*.4,top+h*.5,top+h*.6]};
  R.stalls.forEach(s=>{const r=s.slot.getBoundingClientRect();s.cx=r.left-sr.left+r.width/2;s.side=s.i<2?'top':'bottom';s.qy=s.side==='top'?top+22:bot-22;s.qdir=s.i%2===0?1:-1;});
  R.stalls.forEach(s=>s.queue.forEach((p,k)=>{p.tx=spotX(s,k);p.ty=spotY(s,k)}));
}
window.addEventListener('resize',()=>{if(scene==='market')layoutMarket()});
const spotX=(s,k)=>s.cx+s.qdir*k*19;
const spotY=(s,k)=>s.qy+(k%2)*(s.side==='top'?5:-5);

function nightMin(){return C.OPEN_MIN+Math.min(1,R.t/C.NIGHT_LEN)*C.SPAN_MIN}
function clockTxt(){const m=Math.floor(nightMin()),h=Math.floor(m/60)%24;return String(h).padStart(2,'0')+':'+String(Math.floor(m%60/10)*10).padStart(2,'0')}
function peak(){const m=nightMin();return m<19*60?.75:m<21*60?1.25:m<22.5*60?1.05:.7}

function spawnPerson(){
  const seg=weighted(NM.SEGMENTS,s=>s.w),dir=Math.random()<.5?1:-1,lane=pick(G.lanes)+rand(-7,7);
  const p={id:R.nextId++,seg,face:pick(seg.faces),dir,x:dir>0?-20:G.w+20,y:lane,laneY:lane,speed:rand(34,52),state:'walk',target:-1,prod:-1,el:null,sayT:0,wait:0,patience:rand(13,20)};
  const el=document.createElement('div');el.className='cu'+(dir<0?' flip':'');el.innerHTML=`<span class="face">${p.face}</span>`;
  $('mPeople').appendChild(el);p.el=el;
  R.people.push(p);
  decide(p,null,true);
}
function decide(p,bonus,first){
  const res=AI.decideBuyer(p.seg.id,{appeal:R.appeal,stalls:R.stalls,bonus});
  if(res.stall>=0&&(!bonus||bonus[res.stall]!=null)){
    setTarget(p,res.stall,res.prod);
    const mine=R.stalls[res.stall].mine;
    if(Math.random()<(mine?.55:.22))say(p,res.reason,mine);
    return true;
  }
  if(first&&Math.random()<.12)say(p,res.reason,false);
  return false;
}
function setTarget(p,si,prod){
  if(p.target>=0){const q=R.stalls[p.target].queue,k=q.indexOf(p);if(k>=0){q.splice(k,1);reflow(R.stalls[p.target])}}
  p.target=si;p.prod=prod;p.state='walk';p.wait=0;
}
function say(p,text,mine){
  if(!text)return;
  let b=p.el.querySelector('.say');if(!b){b=document.createElement('div');b.className='say';p.el.appendChild(b)}
  b.className='say'+(mine?' mine':'');b.textContent=text;p.sayT=1.8;
}
function reflow(s){s.queue.forEach((q,k)=>{q.tx=spotX(s,k);q.ty=spotY(s,k);if(q.state==='queue')q.state='toQueue'})}
function leave(p,text,bad){
  if(p.target>=0){const s=R.stalls[p.target],k=s.queue.indexOf(p);if(k>=0){s.queue.splice(k,1);reflow(s)}if(s.serving===p)s.serving=null}
  p.state='leave';p.target=-1;if(text)say(p,text,false);
  if(bad)sfx('sad');
}

function step(dt){
  if(scene!=='market'||!R||R.ended)return;
  R.t+=dt;
  // 刷人
  if(R.t<C.NIGHT_LEN*.92){
    R.spawnT-=dt;
    if(R.spawnT<=0){spawnPerson();R.spawnT=.6/(flowOf(S.night)*peak()*(R.t<R.flowUntil?1.35:1))*rand(.6,1.4)}
  }else if(!R.lastOrderSaid){R.lastOrderSaid=true;banner('<b>快收摊了</b><br>不再来新客人',1500)}
  // 技能效果到期
  for(const s of R.stalls)for(const k in s.effUntil)if(R.t>=s.effUntil[k]){delete s.effUntil[k];delete s.effects[k]}
  // 排队人数（含正在走来的）
  for(const s of R.stalls)s.queueLen=s.queue.length;
  for(const p of R.people)if(p.state==='walk'&&p.target>=0)R.stalls[p.target].queueLen++;
  // 人
  for(let i=R.people.length-1;i>=0;i--){
    const p=R.people[i];
    if(p.sayT>0){p.sayT-=dt;if(p.sayT<=0){const b=p.el.querySelector('.say');if(b)b.remove()}}
    if(p.state==='walk'){
      if(p.target>=0){
        const s=R.stalls[p.target],dx=s.cx-p.x;
        if(Math.abs(dx)<4){
          if(s.queue.length>=C.MAX_QUEUE){s.stats.walkedAway++;p.target=-1;say(p,'排太长了…');}
          else{s.queue.push(p);p.state='toQueue';p.tx=spotX(s,s.queue.length-1);p.ty=spotY(s,s.queue.length-1)}
        }else{const d=Math.sign(dx);if(d!==p.dir){p.dir=d;p.el.classList.toggle('flip',d<0)}p.x+=d*p.speed*1.15*dt;p.y+=(p.laneY-p.y)*Math.min(1,dt*3)}
      }else{p.x+=p.dir*p.speed*dt;p.y+=(p.laneY-p.y)*Math.min(1,dt*3)}
    }else if(p.state==='toQueue'||p.state==='queue'){
      const dx=p.tx-p.x,dy=p.ty-p.y,dist=Math.hypot(dx,dy);
      if(dist>1.5){const v=Math.min(dist,80*dt);p.x+=dx/dist*v;p.y+=dy/dist*v}else p.state='queue';
      const s=R.stalls[p.target];
      if(s&&s.serving!==p){p.wait+=dt;if(p.wait>p.patience){s.stats.walkedAway++;s.rep=Math.max(1,s.rep-.03);leave(p,'等太久了',s.mine)}}
    }else if(p.state==='leave'){
      const dy=p.laneY-p.y;p.y+=dy*Math.min(1,dt*4);p.x+=p.dir*p.speed*1.1*dt;
    }
    if(p.x<-40||p.x>G.w+40){p.el.remove();R.people.splice(i,1);continue}
    p.el.style.transform=`translate(${(p.x-13).toFixed(1)}px,${(p.y-13).toFixed(1)}px)`;
  }
  // 出餐
  for(const s of R.stalls){
    if(!s.serving&&s.queue.length&&s.queue[0].state==='queue'){
      const p=s.queue[0];s.serving=p;s.serveT=food(s.menu[p.prod].food).prep*.8/s.speed;
    }
    if(s.serving){s.serveT-=dt;if(s.serveT<=0)sell(s,s.serving)}
  }
  // AI 出卡
  R.tacT-=dt;
  if(R.tacT<=0){R.tacT=1;
    const maxQ=Math.max(...R.stalls.map(s=>s.queue.length));
    R.stalls.forEach((s,i)=>{if(s.mine)return;const c=AI.rivalTactic(s.src,{t:R.t,queueLen:s.queue.length,maxRivalQueue:maxQ});
      if(c&&!(NM.CARDS[c].dur&&s.effects[c]))useCard(i,c)});
  }
  if(R.bannerT>0){R.bannerT-=dt;if(R.bannerT<=0)$('mBanner').classList.remove('on')}
  if(R.t>=C.NIGHT_LEN){endNight();return}
  render(dt);
}
function sell(s,p){
  let j=p.prod;
  if(!(s.stock[j]>0)){
    const row=R.appeal[s.id]||[];let bj=-1,bu=-1e9;
    s.menu.forEach((m,k)=>{if(s.stock[k]>0){const u=(row[k]?row[k][p.seg.id]:0)-m.price/food(m.food).ref;if(u>bu){bu=u;bj=k}}});
    if(bj<0||Math.random()<.4){s.serving=null;leave(p,'卖完了…',s.mine);s.stats.soldOutAny=true;return}
    j=bj;
  }
  const m=s.menu[j],f=food(m.food);
  const disc=s.effects.discount?.8:1;
  const want=Math.random()<({couple:.5,foodie:.35,office:.15,tourist:.25}[p.seg.id]||.05)?2:1;
  const bogo=!!s.effects.bogo;
  const qty=Math.min(s.stock[j],bogo?Math.max(2,want):want);
  const pay=m.price*disc*(bogo&&qty>=2?qty-.5:qty);
  s.stock[j]-=qty;
  const ps=s.stats.products[j];ps.sold+=qty;
  if(s.stock[j]<=0&&ps.soldOutAt==null)ps.soldOutAt=R.t/C.NIGHT_LEN;
  s.stats.revenue+=pay;s.stats.served++;s.stats.items+=qty;s.stats.bySeg[p.seg.id]=(s.stats.bySeg[p.seg.id]||0)+1;
  const value=f.ref*qty/pay;
  const sat=clamp(.3+(value-1)*1.1-p.wait/30,-1,1.2);
  s.rep=clamp(s.rep+sat*.012,1,5);
  floatAt(s.slot,(qty>1?f.icon+'×'+qty+' ':'')+'+¥'+fmt(pay),s.mine?'mine':'');
  if(s.mine){sfx('coin');vibe(5)}
  s.serving=null;
  const k=s.queue.indexOf(p);if(k>=0){s.queue.splice(k,1);reflow(s)}
  p.state='leave';p.target=-1;
  // 顺手加购一份饮品/甜品
  const addJ=s.menu.findIndex((x,k)=>k!==j&&s.stock[k]>0&&['饮品','甜品'].includes(food(x.food).cat)&&food(x.food).cat!==f.cat);
  if(addJ>=0&&Math.random()<.3){const x=s.menu[addJ],ap=x.price*disc;s.stock[addJ]--;const xs=s.stats.products[addJ];xs.sold++;if(s.stock[addJ]<=0&&xs.soldOutAt==null)xs.soldOutAt=R.t/C.NIGHT_LEN;s.stats.revenue+=ap;s.stats.items++;setTimeout(()=>floatAt(s.slot,food(x.food).icon+' +¥'+fmt(ap),s.mine?'mine':''),250)}
  const bag=document.createElement('span');bag.className='bag';bag.textContent=f.icon;p.el.appendChild(bag);
  if(s.mine&&Math.random()<.25)say(p,pick(['好吃！','值了','下次还来','香！']),true);
}

/* ---- 技能卡 ---- */
function useCard(si,cid){
  const s=R.stalls[si],c=NM.CARDS[cid];
  if(!(s.src.cards[cid]>0))return false;
  s.src.cards[cid]--;
  if(c.dur>0){s.effects[cid]=true;s.effUntil[cid]=R.t+c.dur}
  const walkers=()=>R.people.filter(p=>p.state==='walk'&&p.target<0);
  const redecide=(bonus,frac)=>{for(const p of walkers())if(Math.random()<frac)decide(p,{[si]:bonus})};
  let extra='';
  switch(cid){
    case 'shout':redecide(s.decor.includes('speaker')?1.3:.9,1);break;
    case 'discount':redecide(.3,.7);break;
    case 'bogo':redecide(.3,.7);break;
    case 'lightshow':redecide(.4,.7);break;
    case 'influencer':s.rep=Math.min(5,s.rep+.15);R.flowUntil=R.t+c.dur;redecide(1.2,1);break;
    case 'sample':{
      const ws=walkers().sort((a,b)=>Math.abs(a.x-s.cx)-Math.abs(b.x-s.cx)).slice(0,5);
      ws.forEach(p=>{const row=R.appeal[s.id]||[];let bj=0,bu=-1e9;s.menu.forEach((m,k)=>{const u=row[k]?row[k][p.seg.id]:0;if(s.stock[k]>0&&u>bu){bu=u;bj=k}});setTarget(p,si,bj);say(p,'免费尝尝？',s.mine)});
      let left=3;while(left>0){let k=s.stock.indexOf(Math.max(...s.stock));if(s.stock[k]<=0)break;s.stock[k]--;left--;s.stats.sampled++}
      extra=`，拉来 ${ws.length} 人`;break;}
    case 'poach':{
      const v=R.stalls.filter(x=>x!==s).sort((a,b)=>b.queue.length-a.queue.length)[0];
      const take=v?v.queue.filter(p=>p!==v.serving).slice(-3):[];
      take.forEach(p=>{const row=R.appeal[s.id]||[];let bj=0,bu=-1e9;s.menu.forEach((m,k)=>{const u=row[k]?row[k][p.seg.id]:0;if(s.stock[k]>0&&u>bu){bu=u;bj=k}});setTarget(p,si,bj);p.state='walk';say(p,'那边更好？',s.mine)});
      extra=take.length?`，从${v.name}抢走 ${take.length} 人`:'，但没抢到人';break;}
  }
  banner(`${s.owner} ${esc(s.name)} 发动<br><b>${c.icon} ${c.name}</b>${extra}`,1800);
  if(s.mine){sfx('card');vibe(15)}else sfx('rival');
  renderCards();
  return true;
}
function banner(html,ms){const b=$('mBanner');b.innerHTML=html;b.classList.add('on');R.bannerT=ms/1000}
function renderCards(){
  const P=S.player,ids=Object.keys(NM.CARDS).filter(id=>(P.cards[id]||0)>0||(R&&R.stalls[2].effects[id]));
  $('mCards').innerHTML=ids.length?ids.map(id=>{const c=NM.CARDS[id],act=R&&R.stalls[2].effects[id];
    return `<button class="kard ${act?'active':''}" data-k="${id}" ${act||!(P.cards[id]>0)?'disabled':''}><span class="i">${c.icon}</span><span class="n">${c.name}</span>${P.cards[id]>0?`<span class="c">${P.cards[id]}</span>`:''}${act?'<span class="tm"></span>':''}</button>`}).join('')
    :'<div class="kard empty">没有技能卡了，收摊后去商店买</div>';
}
$('mCards').addEventListener('click',e=>{const b=e.target.closest('.kard');if(!b||b.disabled||!R||R.paused)return;if(!useCard(2,b.dataset.k))sfx('err')});
function stallInfo(s){
  if(!R)return;
  toast(s.mine?`剩余：${s.menu.map((m,j)=>`${food(m.food).icon}${s.stock[j]}`).join('  ')}`:`${s.name}：${s.menu.map(m=>`${food(m.food).icon}¥${fmt(m.price*(s.effects.discount?.8:1))}`).join('  ')}`,2200);
}

function render(){
  $('mClock').textContent=clockTxt();
  $('mBar').style.width=(Math.min(1,R.t/C.NIGHT_LEN)*100)+'%';
  for(const s of R.stalls){
    const sig=Object.keys(s.effects).sort().join(',');
    if(sig!==s.fxSig){s.fxSig=sig;const el=s.slot.querySelector('.stall');
      el.classList.toggle('eff-influencer',!!s.effects.influencer);el.classList.toggle('eff-lightshow',!!s.effects.lightshow);
      el.querySelector('.st-fx').innerHTML=(s.effects.discount?'<span class="sale">8折</span>':'')+(s.effects.bogo?'<span class="sale">半价</span>':'')+(s.effects.shout?'<span>📣</span>':'')+(s.effects.lightshow?'<span>✨</span>':'');
      if(s.mine)renderCards();}
    const ss=s.stock.map(n=>n>0?1:0).join('');
    if(ss!==s.stockSig){s.stockSig=ss;s.slot.querySelectorAll('.st-good').forEach((g,j)=>g.classList.toggle('out',!(s.stock[j]>0)))}
  }
  const me=R.stalls[2];
  $('mCards').querySelectorAll('.kard.active').forEach(k=>{const u=me.effUntil[k.dataset.k];const tm=k.querySelector('.tm');if(tm&&u)tm.textContent=Math.ceil(u-R.t)+'秒'});
  R.lbT-=1/60;if(R.lbT<=0){R.lbT=.3;renderBoard()}
}
function renderBoard(){
  const arr=[...R.stalls].sort((a,b)=>b.stats.revenue-a.stats.revenue);
  $('mBoard').innerHTML=arr.map((s,k)=>`<div class="lb ${s.mine?'me':''}"><span class="o">${s.owner}</span><div class="t"><div class="n">${k+1}. ${esc(s.name)}</div><div class="v num">${yen(s.stats.revenue)}</div></div></div>`).join('');
}

let last=0;
function loop(ts){requestAnimationFrame(loop);const dt=Math.min(.05,(ts-last)/1000||0);last=ts;if(scene==='market'&&R&&!R.paused&&!R.ended)step(dt)}
requestAnimationFrame(loop);

function pause(){
  if(!R||scene!=='market'||R.ended)return;R.paused=true;
  modal(`<div class="em">⏸</div><h3>暂停</h3><p>第 ${S.night+1} 晚，${clockTxt()}</p><button class="btn" id="mRes">继续</button><button class="btn quiet" id="mSnd">${muted?'打开音效':'关闭音效'}</button><button class="btn quiet" id="mQuit">放弃今晚，回到准备</button>`);
  $('mRes').onclick=()=>{closeModal();R.paused=false};
  $('mSnd').onclick=()=>{muted=!muted;try{localStorage.setItem('nm-muted',muted?'1':'0')}catch(e){}$('mSnd').textContent=muted?'打开音效':'关闭音效'};
  $('mQuit').onclick=()=>{closeModal();R=null;load();goPrep()};
}
$('pauseBtn').onclick=pause;
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});

/* ================= 收摊结算 ================= */
async function endNight(){
  R.ended=true;
  const res=R.stalls.map(s=>{
    const st=s.stats,profit=st.revenue-s.foodCost-C.STALL_FEE;
    const waste=s.stock.reduce((a,n,j)=>a+n,0),wasteCost=s.stock.reduce((a,n,j)=>a+n*food(s.menu[j].food).cost,0);
    st.products.forEach((p,j)=>p.stock=s.stock0[j]);
    s.src.rep=r1(s.rep*100)/100;
    if(s.mine)S.money+=st.revenue;else s.src.money+=st.revenue;
    S.totals[s.id]=(S.totals[s.id]||0)+profit;
    return{id:s.id,name:s.name,owner:s.owner,mine:s.mine,revenue:st.revenue,foodCost:s.foodCost,profit,served:st.served,items:st.items,waste,wasteCost,rep0:s.rep0,rep:s.rep,walked:st.walkedAway,products:st.products,menu:s.menu,stats:st};
  });
  S.last={};res.forEach(r=>S.last[r.id]={profit:r.profit,revenue:r.revenue,products:r.products});
  const me=res.find(r=>r.mine);
  const reviews=await AI.reviews({name:me.name,menu:me.menu},me.stats);
  const nightNo=S.night;
  S.night++;
  S.notes={};
  if(S.night<C.SEASON_NIGHTS){
    for(const r of S.rivals){
      const plan=await AI.rivalPlan(r,{lastNight:S.last[r.id],market:{player:S.player.menu},night:S.night,weekday:NM.WEEK[S.night],nextFlow:flowOf(S.night)/flowOf(nightNo)});
      r.menu=plan.menu.map(p=>({food:p.food,price:p.price,desc:p.desc,name:p.name}));r.stock=plan.menu.map(p=>p.stock);
      for(const c in (plan.buyCards||{})){r.cards[c]=(r.cards[c]||0)+plan.buyCards[c];r.money-=NM.CARDS[c].price*plan.buyCards[c]}
      S.notes[r.id]=plan.note;
    }
  }
  S.player.rep=r1(S.player.rep*100)/100;
  save();
  $('mPeople').innerHTML='';$('fx').innerHTML='';
  showResult(res,reviews,nightNo);
}
function showResult(res,reviews,nightNo){
  const sorted=[...res].sort((a,b)=>b.profit-a.profit),medal=['🥇','🥈','🥉','4️⃣'];
  const me=res.find(r=>r.mine),rank=sorted.indexOf(me)+1;
  let h=`<div class="r-title">第 ${nightNo+1} 晚 收摊</div><div class="r-sub">${NM.WEEK[nightNo]}，你今晚排第 ${rank}</div>`;
  h+=`<div class="r-card"><h4>今晚排名（按利润）</h4>${sorted.map((r,k)=>`<div class="rk-row ${r.mine?'me':''}"><span class="m">${medal[k]}</span><span class="o">${r.owner}</span><div class="info"><div class="nm">${esc(r.name)}</div><div class="ds">营业额 ${yen(r.revenue)}，卖出 ${r.items} 份，口碑 ★${r.rep0.toFixed(1)}→${r.rep.toFixed(1)}</div></div><span class="p ${r.profit<0?'neg':''}">${yen(r.profit)}</span></div>`).join('')}</div>`;
  h+=`<div class="r-card"><h4>我的账本</h4>
    <div class="ln"><span>营业额（${me.served} 位顾客）</span><span>${yen(me.revenue)}</span></div>
    <div class="ln minus"><span>备货成本</span><span>-${yen(me.foodCost)}</span></div>
    <div class="ln minus"><span>摊位费</span><span>-${yen(C.STALL_FEE)}</span></div>
    <div class="ln tot"><span>今晚利润</span><span class="${me.profit<0?'neg':''}">${yen(me.profit)}</span></div>
    <div style="margin-top:8px;font-size:13px;line-height:1.7">${me.menu.map((m,j)=>{const p=me.products[j];return `${food(m.food).icon} ${esc(m.name)}：卖出 ${p.sold}/${p.stock}${p.soldOutAt!=null?`，<b style="color:#B3392F">${clockAt(p.soldOutAt)} 卖光</b>`:''}`}).join('<br>')}
    ${me.waste?`<br>剩下 ${me.waste} 份扔掉了（${yen(me.wasteCost)}）`:''}${me.walked?`<br>${me.walked} 位顾客排队太久走了`:''}</div></div>`;
  if(reviews.length)h+=`<div class="r-card"><h4>顾客评价</h4>${reviews.map(r=>`<div class="review"><b>${esc(r.seg)}</b>${esc(r.text)}</div>`).join('')}</div>`;
  if(Object.keys(S.notes).length)h+=`<div class="r-card"><h4>对手动向</h4>${S.rivals.map(r=>`<div class="ln"><span>${r.owner} ${esc(r.name)}</span><span style="text-align:right;max-width:60%">${esc(S.notes[r.id])}</span></div>`).join('')}</div>`;
  const tot=Object.entries(S.totals).sort((a,b)=>b[1]-a[1]);
  h+=`<div class="r-card"><h4>本季累计利润</h4>${tot.map(([id,v],k)=>{const s=stallSrc(id);return `<div class="ln" ${id==='me'?'style="font-weight:800"':''}><span>${k+1}. ${s.owner} ${esc(s.name)}</span><span class="${v<0?'neg':''}">${yen(v)}</span></div>`}).join('')}
    <div class="ln"><span>手头现金</span><span>${yen(S.money)}</span></div></div>`;
  $('rScroll').innerHTML=h;$('rScroll').scrollTop=0;
  const btn=$('rBtn');
  if(S.night>=C.SEASON_NIGHTS){btn.textContent='赛季结算';btn.onclick=seasonEnd}
  else{btn.textContent='准备下一晚';btn.onclick=()=>{sfx('tap');R=null;tab='stock';goPrep()}}
  show('result');sfx('bell');
}
function clockAt(f){const m=C.OPEN_MIN+f*C.SPAN_MIN,h=Math.floor(m/60)%24;return String(h).padStart(2,'0')+':'+String(Math.floor(m%60)).padStart(2,'0')}
function seasonEnd(){
  const tot=Object.entries(S.totals).sort((a,b)=>b[1]-a[1]);
  const rank=tot.findIndex(t=>t[0]==='me')+1;
  const title=['👑 夜市摊王','🔥 人气摊主','🙂 小有名气','💪 明年再战'][rank-1];
  let h=`<div class="r-title">第 ${S.season} 季结束</div><div class="r-sub">七个晚上，总利润排名</div>
  <div class="r-card" style="text-align:center"><div style="font-size:54px">${['🏆','🥈','🥉','🌱'][rank-1]}</div><div style="font-family:var(--display);font-size:28px;margin:4px 0">${title}</div><div style="font-size:13px;opacity:.7">总利润 ${yen(S.totals.me)}，手头现金 ${yen(S.money)}</div></div>
  <div class="r-card"><h4>最终排名</h4>${tot.map(([id,v],k)=>{const s=stallSrc(id);return `<div class="rk-row ${id==='me'?'me':''}"><span class="m">${['🥇','🥈','🥉','4️⃣'][k]}</span><span class="o">${s.owner}</span><div class="info"><div class="nm">${esc(s.name)}</div></div><span class="p ${v<0?'neg':''}">${yen(v)}</span></div>`}).join('')}</div>`;
  $('rScroll').innerHTML=h;show('result');sfx('bell');
  const btn=$('rBtn');btn.textContent='开始新赛季（保留摊位外观和菜单）';
  btn.onclick=()=>{S=newSave(S.player);save();tab='menu';goPrep()};
}

/* ================= 启动 ================= */
$('modal').addEventListener('click',e=>{if(e.target.id==='modal'&&scene!=='market')closeModal()});
document.addEventListener('gesturestart',e=>e.preventDefault());
renderTitle();
window.__nm={get S(){return S},get R(){return R},step,useCard,startNight,goPrep};
})();
