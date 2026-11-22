/* 夜市摊王 —— 静态数据
 * 价格参考中国普通城市夜市（2025-2026 年常见价位），单位：元。
 * ref  = 顾客心中的“正常价”，cost = 每份食材成本，prep = 出餐秒数（游戏内）
 */
window.NM = window.NM || {};

NM.FOODS = [
  {id:'chuan',   name:'羊肉串(5串)',  icon:'🍢', cat:'烧烤', ref:20, cost:9,   prep:2.6, tags:['spicy']},
  {id:'oyster',  name:'蒜蓉烤生蚝(3只)',icon:'🦪', cat:'烧烤', ref:18, cost:8,   prep:2.8, tags:[]},
  {id:'corn',    name:'烤玉米',       icon:'🌽', cat:'烧烤', ref:6,  cost:2,   prep:1.8, tags:[]},
  {id:'squid',   name:'铁板鱿鱼',     icon:'🦑', cat:'烧烤', ref:15, cost:6,   prep:2.6, tags:['spicy']},
  {id:'stinky',  name:'臭豆腐',       icon:'🧆', cat:'小吃', ref:10, cost:3.5, prep:2.0, tags:['indulgent']},
  {id:'coldnoodle',name:'烤冷面',     icon:'🌯', cat:'小吃', ref:8,  cost:2.5, prep:2.0, tags:[]},
  {id:'takoyaki',name:'章鱼小丸子',   icon:'🐙', cat:'小吃', ref:12, cost:4,   prep:2.2, tags:[]},
  {id:'chicken', name:'大鸡排',       icon:'🍗', cat:'小吃', ref:13, cost:5,   prep:2.4, tags:['indulgent']},
  {id:'potato',  name:'狼牙土豆',     icon:'🍟', cat:'小吃', ref:8,  cost:2,   prep:1.8, tags:['spicy']},
  {id:'jianbing',name:'煎饼果子',     icon:'🥞', cat:'主食', ref:8,  cost:3,   prep:2.2, tags:[]},
  {id:'roujiamo',name:'肉夹馍',       icon:'🥙', cat:'主食', ref:12, cost:5,   prep:1.8, tags:[]},
  {id:'malatang',name:'麻辣烫',       icon:'🍲', cat:'主食', ref:18, cost:7,   prep:3.0, tags:['spicy']},
  {id:'crayfish',name:'麻辣小龙虾(1斤)',icon:'🦞',cat:'主食', ref:68, cost:32,  prep:3.2, tags:['spicy']},
  {id:'milktea', name:'珍珠奶茶',     icon:'🧋', cat:'饮品', ref:10, cost:3,   prep:1.6, tags:['sweet']},
  {id:'lemon',   name:'手打柠檬茶',   icon:'🍋', cat:'饮品', ref:8,  cost:2,   prep:1.4, tags:[]},
  {id:'juice',   name:'鲜榨果汁',     icon:'🧃', cat:'饮品', ref:12, cost:4,   prep:1.6, tags:['healthy']},
  {id:'icejelly',name:'冰粉',         icon:'🍧', cat:'甜品', ref:6,  cost:1.5, prep:1.2, tags:['sweet']},
  {id:'tanghulu',name:'糖葫芦',       icon:'🍡', cat:'甜品', ref:8,  cost:3,   prep:1.2, tags:['sweet']},
  {id:'yogurt',  name:'炒酸奶',       icon:'🍨', cat:'甜品', ref:15, cost:5,   prep:2.0, tags:['sweet']},
  {id:'sweetpotato',name:'烤红薯',    icon:'🍠', cat:'甜品', ref:8,  cost:2.5, prep:1.4, tags:['sweet']},
];

/* 描述关键词 -> 卖点标签（mock 版“读懂描述”，以后由 AI 理解描述） */
NM.TAGS = {
  spicy:    {label:'香辣',   kw:['辣','麻','椒','香辣','火辣','孜然']},
  sweet:    {label:'香甜',   kw:['甜','糖','蜜','奶香','奶盖']},
  portion:  {label:'分量足', kw:['大份','分量','管饱','量大','加量','足量','超大','大块','加蛋','加肠']},
  fresh:    {label:'现做',   kw:['现做','现烤','现炸','现炒','新鲜','现开','现榨','现蘸','现切','现煮','炭火']},
  heritage: {label:'老味道', kw:['祖传','老字号','秘方','秘制','传统','老味道','正宗','十年','几十年','怀旧','老北京','老长沙','东北老']},
  trendy:   {label:'网红',   kw:['网红','打卡','爆款','拍照','出片','抖音','小红书','颜值','排队']},
  healthy:  {label:'健康',   kw:['健康','低脂','低卡','无添加','0添加','清爽','少油','解腻','养生','水果']},
  cheap:    {label:'实惠',   kw:['实惠','便宜','划算','学生','平价','良心','特价']},
  indulgent:{label:'过瘾',   kw:['芝士','爆浆','拉丝','酥','脆','外酥里嫩','多汁','焦香','爆汁']},
  hand:     {label:'手工',   kw:['手工','手作','手打','手搓','手抓','手擀']},
};

/* 顾客人群 */
NM.SEGMENTS = [
  {id:'student', name:'学生党',  faces:['🧑‍🎓','👦','👧'], budget:14, sens:1.6, w:3,
   likes:{cheap:1, portion:.8, spicy:.5, trendy:.4, sweet:.4}, cats:{小吃:1.1, 饮品:1, 甜品:.9, 主食:.8, 烧烤:.7}, looks:.6},
  {id:'office',  name:'上班族',  faces:['👨‍💼','👩‍💼'],      budget:28, sens:.9,  w:3,
   likes:{fresh:.8, portion:.5, healthy:.5, spicy:.3}, cats:{主食:1.2, 烧烤:1, 小吃:.9, 饮品:.8, 甜品:.6}, looks:.5},
  {id:'couple',  name:'小情侣',  faces:['👫','💑'],          budget:32, sens:.6,  w:2,
   likes:{trendy:1, sweet:.8, hand:.4}, cats:{饮品:1.2, 甜品:1.2, 小吃:1, 烧烤:.8, 主食:.6}, looks:1.6},
  {id:'foodie',  name:'吃货',    faces:['😋','🤤'],          budget:45, sens:.7,  w:2,
   likes:{spicy:.8, indulgent:.8, heritage:.6, portion:.6, fresh:.5}, cats:{烧烤:1.3, 小吃:1.1, 主食:1.1, 甜品:.8, 饮品:.6}, looks:.4},
  {id:'elder',   name:'大爷大妈',faces:['👴','👵'],          budget:16, sens:1.4, w:2,
   likes:{heritage:1, cheap:.8, healthy:.6, trendy:-.5}, cats:{主食:1.1, 甜品:1, 小吃:.9, 饮品:.6, 烧烤:.7}, looks:.5},
  {id:'tourist', name:'游客',    faces:['👱‍♀️','👨‍🦰','🙋‍♀️'], budget:38, sens:.7,  w:1.5,
   likes:{heritage:.8, trendy:.8, hand:.5}, cats:{小吃:1.2, 烧烤:1.1, 甜品:1, 主食:.9, 饮品:.8}, looks:1.2},
];

/* 技能卡 */
NM.CARDS = {
  shout:      {name:'吆喝叫卖', icon:'📣', dur:15, price:20,  desc:'15 秒内路过的人更容易被你喊过来。'},
  discount:   {name:'限时打折', icon:'🏷️', dur:20, price:30,  desc:'20 秒全场 8 折，学生和大爷大妈最吃这套。'},
  bogo:       {name:'第二份半价',icon:'✌️', dur:20, price:40,  desc:'20 秒内顾客都买两份，第二份半价。'},
  sample:     {name:'免费试吃', icon:'🥢', dur:0,  price:30,  desc:'马上拉来最多 5 个路人排队，消耗 3 份库存。'},
  influencer: {name:'网红探店', icon:'🤳', dur:30, price:120, desc:'网红来你家拍视频：30 秒人气暴涨，整条街客流增加，口碑上升。'},
  lightshow:  {name:'灯光秀',   icon:'✨', dur:25, price:50,  desc:'25 秒摊位闪闪发光，情侣和游客挪不开眼。'},
  poach:      {name:'截胡',     icon:'😈', dur:0,  price:60,  desc:'从排队最长的对手那里抢走 3 个顾客。'},
};

/* 摊位外观（免费）与装饰（付费，提升颜值） */
NM.LOOK = {
  awnings: [
    {id:'red',   name:'红白条', a:'#D8433A', b:'#FFF3E0'},
    {id:'blue',  name:'蓝白条', a:'#2F6FD0', b:'#F2F6FF'},
    {id:'green', name:'绿白条', a:'#2E9E6A', b:'#F0FFF6'},
    {id:'yellow',name:'黄黑条', a:'#F2B807', b:'#2B2B2B'},
    {id:'pink',  name:'粉白条', a:'#F06BA8', b:'#FFF0F7'},
    {id:'purple',name:'紫金条', a:'#7B4BD6', b:'#FFD66B'},
  ],
  signs: ['#FFE08A','#FFFFFF','#FF8FB1','#8EE3D8','#2B2140'],
  owners: ['🧑‍🍳','👩‍🍳','👨‍🍳','🧔','👩‍🦱','🧑‍🦰'],
  mascots: [{id:'none',icon:'',name:'不要'},{id:'cat',icon:'🐱',name:'猫'},{id:'panda',icon:'🐼',name:'熊猫'},{id:'fox',icon:'🦊',name:'狐狸'},{id:'frog',icon:'🐸',name:'青蛙'}],
};
NM.DECOR = [
  {id:'bulbs',  icon:'💡', name:'暖黄灯泡串', looks:1, price:0,   desc:'默认就有'},
  {id:'led',    icon:'🌈', name:'彩色 LED 灯带', looks:2, price:120, desc:'颜值 +2，年轻人喜欢'},
  {id:'lantern',icon:'🏮', name:'红灯笼',     looks:1.5, price:80, desc:'颜值 +1.5，大爷大妈和游客喜欢', likes:{elder:.4, tourist:.4}},
  {id:'neon',   icon:'🪩', name:'霓虹灯牌',   looks:2.5, price:200, desc:'颜值 +2.5，远处就能看见'},
  {id:'balloon',icon:'🎈', name:'气球',       looks:1, price:50,  desc:'颜值 +1，小情侣喜欢', likes:{couple:.3}},
  {id:'plant',  icon:'🪴', name:'绿植',       looks:.8, price:60,  desc:'颜值 +0.8，看着干净'},
  {id:'speaker',icon:'🔊', name:'小音箱',     looks:.5, price:150, desc:'“吆喝叫卖”效果翻倍'},
];
NM.UPGRADES = [
  {id:'helper', icon:'🧑‍🤝‍🧑', name:'雇帮手', costs:[300,800], desc:l=>['出餐速度 +35%','出餐速度 +70%'][l]},
  {id:'slot',   icon:'📋', name:'多一个菜品位', costs:[400], desc:()=>'菜单从 3 个增加到 4 个'},
];

/* 三家 AI 对手（初始设定；之后每晚由 AI.rivalPlan 调整） */
NM.RIVALS = [
  {id:'wang', name:'王姐烧烤', owner:'👩‍🍳', awning:'red', sign:'#FFE08A', mascot:'', decor:['bulbs','lantern'], rep:3.2,
   persona:'价格杀手，爱打价格战，看到别人便宜就跟着降价。', style:'price',
   menu:[{food:'chuan',  price:18, desc:'新疆羊肉 炭火现烤 大块管饱 孜然香辣'},
         {food:'oyster', price:16, desc:'现开生蚝 蒜蓉秘制 鲜嫩多汁'},
         {food:'lemon',  price:6,  desc:'解辣神器 手打现做 冰爽'}],
   cards:{discount:2, shout:2, bogo:1}},
  {id:'jie',  name:'阿杰的茶', owner:'🧑', awning:'pink', sign:'#8EE3D8', mascot:'🐼', decor:['bulbs','led','balloon'], rep:3.0,
   persona:'网红路线，舍得花钱做营销，价格偏高。', style:'trendy',
   menu:[{food:'milktea', price:13, desc:'手作珍珠 网红爆款 拍照超出片'},
         {food:'yogurt',  price:16, desc:'小红书同款 现炒酸奶 低脂水果'},
         {food:'icejelly',price:7,  desc:'手搓冰粉 清爽解腻'}],
   cards:{influencer:2, lightshow:1, shout:1}},
  {id:'li',   name:'老李臭豆腐', owner:'👴', awning:'yellow', sign:'#FFFFFF', mascot:'', decor:['bulbs','lantern'], rep:3.5,
   persona:'三十年老摊，靠口碑和实惠，不爱折腾。', style:'classic',
   menu:[{food:'stinky',    price:10, desc:'祖传秘方 三十年老字号 外酥里嫩 香辣'},
         {food:'coldnoodle',price:8,  desc:'东北老味道 分量足 加蛋加肠'},
         {food:'tanghulu',  price:7,  desc:'老北京手工现蘸 酸甜'}],
   cards:{sample:2, shout:2, poach:1}},
];

NM.WEEK = ['周一','周二','周三','周四','周五','周六','周日'];
NM.WEEK_FLOW = [0.8, 0.85, 0.9, 0.95, 1.2, 1.35, 1.15];
NM.CONST = {
  NIGHT_LEN: 100,         // 一晚的真实秒数（18:00–24:00）
  OPEN_MIN: 18*60, SPAN_MIN: 6*60,
  STALL_FEE: 80,          // 每晚摊位费
  START_MONEY: 1000,
  SEASON_NIGHTS: 7,
  MAX_QUEUE: 6,
  WASTE_SALVAGE: 0,       // 剩余食材无法回收
};
