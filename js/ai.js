/* 夜市摊王 —— AI 接口层
 *
 * 现在：全部用本地 mock（假数据模拟）。
 * 将来：把 NM.AI.config.mode 设为 'api' 并填 endpoint，每个函数会先调接口，失败时自动退回 mock。
 *
 * 接口约定（endpoint 收到 POST {task, payload}，返回 JSON）：
 *
 * 1. task:'night_appeal'  开市前，让 AI 扮演各类顾客给每家每道菜打分
 *    payload: {segments:[{id,name,budget,...}], stalls:[{id,name,rep,looks,menu:[{name,cat,price,ref,desc}]}], weekday}
 *    返回:    {appeal:{[stallId]:[{[segId]:number(-2~3)}, ...每道菜]}, quotes:{[stallId]:[{[segId]:string}]}}
 *    说明：实时人流每秒都在做决定，不适合逐个调大模型，所以开市前一次性算好“吸引力矩阵”，
 *          运行中再叠加价格、排队、技能卡等实时因素。
 *
 * 2. task:'rival_plan'    每晚开市前，AI 摊主决定明晚的菜单、价格、描述、备货、买卡
 *    payload: {rival:{id,name,persona,money,menu,cards}, lastNight:{...}, market:{player:{menu}, others:[...]}, night, weekday}
 *    返回:    {menu:[{food,price,desc,stock}], buyCards:{[cardId]:count}, note:string}
 *
 * 3. task:'reviews'       收摊后，AI 顾客写评价
 *    payload: {stall:{name,menu}, stats:{served,bySeg,avgWait,soldOut,...}}
 *    返回:    {reviews:[{seg:string,text:string}]}
 *
 * 注意：发布在 claude.ai 的页面不能请求外部网址；接 API 时需要把游戏部署到自己的网站（如 GitHub Pages）
 *       并通过自己的后端转发，不要把 API Key 写在前端。
 */
(function(){
const NM = window.NM;
const AI = NM.AI = {config:{mode:'mock', endpoint:''}};

async function callAPI(task, payload){
  if(AI.config.mode!=='api' || !AI.config.endpoint) throw new Error('mock');
  const res = await fetch(AI.config.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({task,payload})});
  if(!res.ok) throw new Error('HTTP '+res.status);
  return res.json();
}

const food = id => NM.FOODS.find(f=>f.id===id);
const seg  = id => NM.SEGMENTS.find(s=>s.id===id);
const rnd  = (a,b)=>a+Math.random()*(b-a);
const gumbel = ()=>-Math.log(-Math.log(Math.random()*0.9999+0.00005));

/* ---------- 描述 -> 卖点标签（mock 版“读懂描述”） ---------- */
AI.parseTags = function(text){
  const t=(text||'').toLowerCase(), out=[];
  for(const k in NM.TAGS){ if(NM.TAGS[k].kw.some(w=>t.includes(w))) out.push(k); }
  return out;
};
AI.productTags = function(p){
  const f=food(p.food); const set=new Set([...(f.tags||[]), ...AI.parseTags(p.desc)]);
  return [...set];
};

/* ---------- 1. 开市前：吸引力矩阵 ---------- */
function mockAppeal(stalls){
  const appeal={};
  for(const st of stalls){
    appeal[st.id]=st.menu.map(p=>{
      const f=food(p.food), tags=AI.productTags(p).slice(0,4), descTags=AI.parseTags(p.desc);
      const row={};
      for(const s of NM.SEGMENTS){
        let u=(s.cats[f.cat]||.8);
        for(const tg of tags) u+=(s.likes[tg]||0)*.55;
        if(!p.desc||p.desc.trim().length<4) u-=.25; else if(descTags.length>=2) u+=.1;
        row[s.id]=u;
      }
      return row;
    });
  }
  return {appeal};
}
AI.prepareNight = async function(ctx){
  try{ const r=await callAPI('night_appeal',ctx); if(r&&r.appeal) return r; }catch(e){}
  return mockAppeal(ctx.stalls);
};

/* ---------- 实时：一个顾客选哪家、买什么（同步，基于矩阵 + 实时因素） ----------
 * live: {appeal, stalls:[{id,menu,stock[],rep,looks,queueLen,effects:{}, decor:[]}], bonus:{stallIdx:number}}
 * 返回 {stall:i, prod:j, reason} ；不买时 stall=-1
 */
AI.decideBuyer = function(segId, live){
  const s=seg(segId);
  let best={stall:-1,prod:-1,u:3.1+gumbel()*.5,why:'none'};
  let anyAffordable=false;
  live.stalls.forEach((st,i)=>{
    const rowSet=live.appeal[st.id]; if(!rowSet) return;
    let bp=-1,bu=-1e9,bwhy='',bprice=0;
    st.menu.forEach((p,j)=>{
      if(!(st.stock[j]>0)) return;
      const f=food(p.food);
      const eff=p.price*(st.effects.discount?0.8:1);
      if(eff<=s.budget) anyAffordable=true;
      let u=rowSet[j]?rowSet[j][segId]:0, why='taste', r=eff/f.ref;
      let pt = r>1 ? -s.sens*(r-1)*2.6 : s.sens*(1-r)*1.3;
      if(eff>s.budget) pt-=(eff-s.budget)/s.budget*3;
      if(st.effects.bogo) pt+=.35*(s.sens>1?1:.6);
      if(pt>.35) why='cheap';
      u+=pt;
      const tags=AI.productTags(p);
      if(tags.includes('heritage')&&(s.likes.heritage||0)>.5) why=why==='cheap'?why:'heritage';
      if(tags.includes('trendy')&&(s.likes.trendy||0)>.5) why='trendy';
      if(u>bu){bu=u;bp=j;bwhy=why;bprice=eff}
    });
    if(bp<0) return;
    let looks=st.looks+(st.effects.lightshow?4:0);
    let deco=0; (st.decor||[]).forEach(d=>{const D=NM.DECOR.find(x=>x.id===d); if(D&&D.likes&&D.likes[segId]) deco+=D.likes[segId];});
    let u=bu+st.rep*.28+looks*.12*s.looks+deco;
    if(st.effects.shout) u+=.7*(st.decor.includes('speaker')?1.8:1);
    if(st.effects.influencer){u+=1.1; if(bwhy!=='cheap') bwhy='influencer';}
    if(st.effects.lightshow&&s.looks>1) bwhy='looks';
    u+=(live.bonus&&live.bonus[i])||0;
    u-=st.queueLen*.2 + (st.queueLen>=NM.CONST.MAX_QUEUE?3:0);
    u+=gumbel()*.5;
    if(u>best.u) best={stall:i,prod:bp,u,why:bwhy,price:bprice};
  });
  return {stall:best.stall, prod:best.prod, reason:reasonText(best, live, anyAffordable)};
};
function reasonText(b, live, anyAffordable){
  if(b.stall<0) return anyAffordable ? ['随便逛逛','先看看','吃过饭了','再转转'][Math.floor(Math.random()*4)] : '都有点贵…';
  const p=live.stalls[b.stall].menu[b.prod], f=food(p.food), short=(p.name||f.name).slice(0,5);
  switch(b.why){
    case 'cheap': return `${short}才¥${fmt(b.price)}，划算`;
    case 'trendy': return '网红款，去打卡！';
    case 'influencer': return '刚刷到这家！';
    case 'heritage': return '老味道，就认这家';
    case 'looks': return '这家摊子好好看';
    default: return ['闻着好香','想吃'+short,'就这家了','看着不错'][Math.floor(Math.random()*4)];
  }
}
const fmt=n=>Number.isInteger(n)?String(n):n.toFixed(1);

/* ---------- 2. AI 摊主：每晚的经营计划 ---------- */
function mockRivalPlan(r, ctx){
  const last=ctx.lastNight||{}, flow=ctx.nextFlow||1, notes=[];
  const playerMenu=(ctx.market&&ctx.market.player)||[];
  const menu=r.menu.map((p,j)=>{
    const f=food(p.food), L=(last.products||[])[j]||{};
    let price=p.price;
    if(L.soldOutAt!=null && L.soldOutAt<.8){ price+= (Math.random()<.5?.5:1); notes.push(`${f.name}卖断货，涨价`); }
    else if(L.stock && L.sold/L.stock<.45){ price-= (Math.random()<.5?.5:1); notes.push(`${f.name}卖不动，降价`); }
    if(r.style==='price'){
      const rival=playerMenu.find(x=>food(x.food).cat===f.cat);
      if(rival && rival.price<=price){ price=rival.price-(Math.random()<.5?.5:1); notes.push(`跟玩家打价格战：${f.name}`); }
    }
    if(r.style==='trendy' && Math.random()<.3) price+=.5;
    price=Math.max(Math.ceil(f.cost*1.25*2)/2, Math.min(f.ref*1.6, price));
    price=Math.round(price*2)/2;
    const base=L.sold!=null ? L.sold*1.15+3 : 14;
    const stock=Math.max(6, Math.round(base*flow));
    return {...p, price, stock};
  });
  const buy={};
  const pref={price:['discount','bogo','shout'], trendy:['influencer','lightshow','shout'], classic:['sample','shout','poach']}[r.style];
  let money=r.money;
  const owned=Object.values(r.cards||{}).reduce((a,b)=>a+b,0);
  if(owned<4){ for(const c of pref){ const cost=NM.CARDS[c].price; if(money-cost>400){ buy[c]=(buy[c]||0)+1; money-=cost; break; } } }
  return {menu, buyCards:buy, note:notes[0]||'照常出摊'};
}
AI.rivalPlan = async function(r, ctx){
  try{ const res=await callAPI('rival_plan',{rival:r,...ctx}); if(res&&res.menu) return res; }catch(e){}
  return mockRivalPlan(r, ctx);
};

/* ---------- AI 摊主：运营中出技能卡（同步、轻量） ---------- */
AI.rivalTactic = function(r, live){
  const owned=Object.keys(r.cards).filter(k=>r.cards[k]>0);
  if(!owned.length) return null;
  const t=live.t/NM.CONST.NIGHT_LEN;
  if(t<.08||t>.9) return null;
  const myQ=live.queueLen, maxQ=live.maxRivalQueue;
  let chance=.06;
  if(myQ<=1) chance+=.08;
  if(r.style==='trendy'&&t>.25&&t<.6) chance+=.06;
  if(Math.random()>chance) return null;
  if(owned.includes('poach') && maxQ>=4) return 'poach';
  const order={price:['discount','bogo','shout','sample'], trendy:['influencer','lightshow','shout','bogo'], classic:['sample','shout','discount','poach']}[r.style];
  return order.find(c=>owned.includes(c)&&c!=='poach') || owned[0];
};

/* ---------- 3. 顾客评价 ---------- */
function mockReviews(st, stats){
  const out=[], segs=Object.entries(stats.bySeg||{}).sort((a,b)=>b[1]-a[1]);
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  st.menu.forEach((p,j)=>{
    const f=food(p.food), r=p.price/f.ref, name=p.name||f.name;
    const s=segs.length?seg(pick(segs.slice(0,3))[0]):NM.SEGMENTS[0];
    if(!stats.products[j]||!stats.products[j].sold) return;
    if(r<=.85) out.push({seg:s.name, text:`${name}才¥${fmt(p.price)}，良心价，下次还来`});
    else if(r>=1.3) out.push({seg:s.name, text:`${name}好吃是好吃，¥${fmt(p.price)}有点贵`});
    else out.push({seg:s.name, text:pick([`${name}味道不错`,`${name}正常发挥，挺香的`,`冲着“${(p.desc||'').slice(0,8)}”来的，没失望`])});
  });
  if(stats.walkedAway>=3) out.push({seg:'路人', text:`排队太久了，等不及走了（${stats.walkedAway} 人）`});
  if(stats.soldOutAny) out.push({seg:'吃货', text:'来晚了，想吃的卖完了！'});
  return out.slice(0,3);
}
AI.reviews = async function(st, stats){
  try{ const r=await callAPI('reviews',{stall:st,stats}); if(r&&r.reviews) return r.reviews; }catch(e){}
  return mockReviews(st, stats);
};
})();
