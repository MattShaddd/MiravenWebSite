(function(){
  'use strict';
  /* Android Chrome: при открытой клавиатуре и скрытии адресной строки над клавиатурой оставалась пустая полоса. Пусть клавиатура меняет размер страницы целиком, а не только видимой области */
  try{var vm=document.querySelector('meta[name=viewport]');if(vm&&!/interactive-widget/.test(vm.content))vm.setAttribute('content',vm.content+',interactive-widget=resizes-content')}catch(e){}
  /*@SHEET@*/
  /* Каталог Миравен. Исходник: catalog.src.js. Файл catalog.js собирается скриптом build.py (подтягивает вход и тему из miraven.js). */
  var API={part:'683137745982',rec:'1278450591'};
  // страницы переехали: главная теперь «/», каталог «/store». Загрузчик, вставленный в Тильду раньше, мог подставить старые /newmain и /newstore:
  // поправляем адрес и ссылки в уже вставленной разметке, чтобы не вести на 404
  if(/^\/newmain\/?$/.test(window.MV_HOME||''))window.MV_HOME='/';
  document.querySelectorAll('a[href^="/newmain"],a[href^="/newstore"]').forEach(function(a){a.setAttribute('href',a.getAttribute('href').replace(/^\/newmain/,'/').replace(/^\/newstore/,'/store'))});
  var HOME=window.MV_HOME||'/';
  var ORDER=['Открытки','Наборы открыток','Свечи','Наклейки на карты','Разное','Новинки','Распродажа'];
  var FGROUPS=['Фандом','Материал','Оборот','Формат'];
  var PAGE=24;
  var TOUCH=window.matchMedia&&matchMedia('(hover:none)').matches; /* на телефоне второе фото не показывается (нет наведения), поэтому и не грузим */
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse=window.matchMedia&&matchMedia('(pointer:coarse)').matches;
  var $=function(id){return document.getElementById(id)};
  var items=[],byUid={},parts={},fvals={},priceRange=[0,0];
  var S={cat:'all',q:'',sort:'def',f:{},min:null,max:null,stock:false,shown:PAGE};

  var PLUS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
  var CHECK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var X='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var CHEV_L='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
  var CHEV_R='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>';
  var SHARE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4M8 8l4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg>';
  var TRUCK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/></svg>';

  /* ---------- утилиты ---------- */
  function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function thumb(u,w){var m=/^https?:\/\/static\.tildacdn\.com\/(.+)\/([^\/]+)$/.exec(u||'');return m?'https://thb.tildacdn.com/'+m[1]+'/-/resize/'+(w||480)+'x/'+m[2]:u}
  function fmt(n){return Math.round(n).toLocaleString('ru-RU').replace(/ /g,' ')}
  function plural(n,f){var a=Math.abs(n)%100,b=a%10;return a>10&&a<20?f[2]:b>1&&b<5?f[1]:b===1?f[0]:f[2]}
  function pj(s,d){if(s&&typeof s==='object')return s;try{return JSON.parse(s)}catch(e){return d}}
  function num(s){return parseFloat(String(s==null?'':s).replace(/\s/g,'').replace(',','.'))||0}
  var toastT;function toast(t){var e=$('toast');if(!e)return;e.textContent=t;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){e.classList.remove('on')},2400)}
  function clean(html){
    var d=new DOMParser().parseFromString('<div>'+(html||'')+'</div>','text/html').body.firstChild,out=document.createElement('div'),ok={BR:1,P:1,B:1,STRONG:1,I:1,EM:1,UL:1,OL:1,LI:1};
    (function walk(s,t){s.childNodes.forEach(function(n){if(n.nodeType===3)t.appendChild(document.createTextNode(n.textContent));else if(n.nodeType===1){if(ok[n.tagName]){var e=document.createElement(n.tagName);t.appendChild(e);walk(n,e)}else walk(n,t)}})})(d,out);
    return out.innerHTML;
  }

  /* ---------- данные ---------- */
  function norm(p){
    var gal=(pj(p.gallery,[])||[]).map(function(g){return g.img}).filter(Boolean);
    var ids=pj(p.partuids,[])||[];
    var opts=(pj(p.json_options,[])||[]).filter(function(o){return o&&o.title&&o.values&&o.values.length});
    var eds=(p.editions||[]).filter(function(e){return e.uid}).map(function(e){return{raw:e,uid:String(e.uid),sku:e.sku,price:num(e.price),old:num(e.priceold),qty:e.quantity===''||e.quantity==null?null:parseInt(e.quantity,10),img:e.img}});
    if(!eds.length)eds=[{raw:p,uid:String(p.uid),sku:p.sku,price:num(p.price),old:num(p.priceold),qty:p.quantity===''||p.quantity==null?null:parseInt(p.quantity,10),img:gal[0]}];
    var title=String(p.title||''),m=/^(.*?)\s*"(.+)"\s*$/.exec(title.replace(/«|»/g,'"'));
    var chars={},cl=[];(p.characteristics||[]).forEach(function(c){if(c&&c.title&&c.value){chars[c.title]=c.value;cl.push(c)}});
    var live=eds.filter(function(e){return e.qty!==0}),base=(live.length?live:eds);
    var minE=base.reduce(function(a,e){return e.price<a.price?e:a},base[0]);
    var it={raw:p,uid:String(p.uid),title:title,t:m&&m[1]?m[1]:'',n:m?'«'+m[2]+'»':title,descr:p.descr||'',text:p.text||'',
      gal:gal,ids:ids,opts:opts,eds:eds,chars:chars,cl:cl,sold:!live.length,multi:eds.length>1,
      price:minE.price,old:minE.old,from:eds.length>1&&Math.min.apply(null,eds.map(function(e){return e.price}))!==Math.max.apply(null,eds.map(function(e){return e.price})),
      img:gal[0]||eds[0].img||'',img2:gal[1]||'',url:(p.url||'').replace(/^http:/,'https:')};
    it.search=(title+' '+it.descr+' '+Object.keys(chars).map(function(k){return chars[k]}).join(' ')+' '+it.text.replace(/<[^>]+>/g,' ')).toLowerCase();
    return it;
  }
  function loadAll(){
    var all=[],slice=1;
    return new Promise(function(res,rej){
      (function next(){
        fetch('https://store.tildacdn.com/api/getproductslist/?storepartuid='+API.part+'&recid='+API.rec+'&c='+Date.now()+'&getparts=true&getoptions=true&slice='+slice+'&size=100')
          .then(function(r){return r.json()}).then(function(d){
            (d.parts||[]).forEach(function(p){parts[p.uid]=p.title});
            all=all.concat(d.products||[]);
            if(d.nextslice&&slice<12){slice=d.nextslice;next()}else res(all);
          }).catch(rej);
      })();
    });
  }

  /* ---------- фильтрация ---------- */
  function partName(it){return (it.ids[0]&&parts[it.ids[0]])||''}
  function match(it,skip){
    if(S.cat!=='all'&&it.ids.indexOf(+S.cat)<0)return false;
    if(S.q&&it.search.indexOf(S.q)<0)return false;
    if(S.stock&&it.sold)return false;
    if(S.min!=null&&it.price<S.min)return false;
    if(S.max!=null&&it.price>S.max)return false;
    for(var t in S.f){if(t===skip)continue;var set=S.f[t];if(set&&set.length&&set.indexOf(it.chars[t])<0)return false}
    return true;
  }
  function list(){
    var L=items.filter(function(i){return match(i)});
    var so=function(f){L.sort(function(a,b){return (a.sold-b.sold)||f(a,b)})}; // распроданное всегда в конце
    if(S.sort==='pa')so(function(a,b){return a.price-b.price});
    else if(S.sort==='pd')so(function(a,b){return b.price-a.price});
    else if(S.sort==='az')so(function(a,b){return a.title.localeCompare(b.title,'ru')});
    return L;
  }
  function activeCount(){var n=S.stock?1:0;for(var t in S.f)n+=S.f[t].length;if(S.min!=null||S.max!=null)n++;return n}

  /* ---------- карточки ---------- */
  function badges(it){
    var b='';
    if(it.sold)b+='<span class="bdg">Нет в наличии</span>';
    else{
      if(it.old>it.price)b+='<span class="bdg sale">−'+Math.round((1-it.price/it.old)*100)+'%</span>';
      if(it.ids.some(function(id){return parts[id]==='Новинки'}))b+='<span class="bdg new">Новинка</span>';
    }
    return b?'<div class="pc-badges">'+b+'</div>':'';
  }
  /* состояние корзины Тильды */
  function cartProducts(){try{if(window.tcart&&window.tcart.products)return window.tcart.products;return JSON.parse(localStorage.getItem('tcart')||'{}').products||[]}catch(e){return[]}}
  function sameOpts(p,sel,it){
    if(!(sel&&it.opts.length))return true;
    var po=p.options||[];return it.opts.every(function(o){return po.some(function(x){return x.option===o.title&&x.variant===sel[o.title]})});
  }
  function findLine(it,ed,sel){
    var P=cartProducts();
    for(var i=0;i<P.length;i++){var p=P[i];if(String(p.lid)===String(it.uid)&&(ed.uid==null||String(p.uid)===String(ed.uid))&&sameOpts(p,sel,it))return{p:p,i:i}}
    return null;
  }
  function lineQty(it,ed,sel){var f=findLine(it,ed,sel);return f?(parseInt(f.p.quantity,10)||0):0}
  function itemQty(it){return MVProductCard.quantity(it)}
  function maxQty(ed){return ed.qty==null?99:Math.max(ed.qty,0)}
  function cartMinus(it,ed,sel){
    var f=findLine(it,ed,sel);if(!f||!window.tcart||!window.tcart.products)return;
    if((parseInt(f.p.quantity,10)||1)>1){f.p.quantity=(parseInt(f.p.quantity,10)||1)-1;f.p.amount=(parseFloat(f.p.price)||0)*f.p.quantity}
    else window.tcart.products.splice(f.i,1);
    var T=window.tcart,n=0,a=0;T.products.forEach(function(p){n+=parseInt(p.quantity,10)||0;a+=(parseFloat(p.price)||0)*(parseInt(p.quantity,10)||0)});
    T.total=n;T.prodamount=a;T.amount=a;
    ['tcart__updateTotalProductsinCartObj','tcart__saveLocalObj','tcart__reDrawProducts','tcart__reDrawCartIcon','tcart__reDrawTotal'].forEach(function(fn){try{if(typeof window[fn]==='function')window[fn]()}catch(e){}});
    updBadge();MVProductCard.refresh(); // счётчики: карточки каталога, шторка товара, плавающая корзина
  }
  var STP='<button type="button" data-s="m" aria-label="Убрать одну штуку">−</button><b></b><button type="button" data-s="p" aria-label="Добавить ещё одну штуку">+</button>';
  function cardBtn(it){
    return MVProductCard.control(it,esc,PLUS);
  }
  /* обратная связь на «−»: число прокручивается, над кнопкой всплывает «−1», телефон коротко вибрирует. Палец закрывает число, поэтому подсказка выше */
  function rollNum(b,down){
    if(reduce||!b.animate)return;
    b.animate([{transform:'translateY('+(down?'-55%':'55%')+')',opacity:0},{transform:'none',opacity:1}],{duration:260,easing:'cubic-bezier(.2,.8,.2,1)'});
  }
  function chip(card,text,anchor){
    if(navigator.vibrate)try{navigator.vibrate(8)}catch(e){}
    var ph=card.querySelector('.pc-ph');if(!ph)return;
    var old=ph.querySelector('.pc-chip');if(old)old.remove();
    var c=document.createElement('span');c.className='pc-chip';c.textContent=text;c.setAttribute('aria-hidden','true');ph.appendChild(c);
    if(reduce||!c.animate){setTimeout(function(){c.remove()},900);return}
    c.animate([{opacity:0,transform:'translateY(10px) scale(.85)'},{opacity:1,transform:'translateY(0) scale(1)',offset:.22},{opacity:1,transform:'translateY(-6px) scale(1)',offset:.72},{opacity:0,transform:'translateY(-16px) scale(.95)'}],{duration:1100,easing:'ease-out'}).onfinish=function(){c.remove()};
  }
  function paintCards(){
    try{document.querySelectorAll('.pc[data-uid]').forEach(function(c){
      var it=byUid[c.dataset.uid],el=c.querySelector('.add');if(!it||!el||it.sold)return;
      if(it.multi){var w=cardBtn(it),t=document.createElement('div');t.innerHTML=w;var sp=el.querySelector('span');if(sp)sp.textContent=t.querySelector('span').textContent;return}
      var q=itemQty(it);if(String(q)===el.dataset.q)return;
      var t2=document.createElement('div');t2.innerHTML=cardBtn(it);
      var was=parseInt(el.dataset.q,10)||0;
      if(q&&el.classList.contains('stp')){el.dataset.q=q;var nb=el.querySelector('b');nb.textContent=q;rollNum(nb,q<was);if(q<was)chip(c,'−'+(was-q),el)}
      else{el.replaceWith(t2.firstChild);if(!q&&was)chip(c,'Убрано из корзины',null)}
      var ne=c.querySelector('.add');if(ne&&ne.classList.contains('stp'))ne.classList.toggle('lim',q>=maxQty(it.eds[0]));
    })}catch(e){}
  }
  function card(it,k){
    return MVProductCard.markup(it,{layout:'grid',esc:esc,fmt:fmt,plus:PLUS,image:function(u){return thumb(u,520)},hover:!TOUCH,badges:badges(it),type:partName(it),index:k});
  }
  var grid=$('grid'),more=$('more'),curList=[];
  MVProductCard.watch(grid,paintCards);
  function renderGrid(){
    curList=list();
    $('resCount').textContent=curList.length+' '+plural(curList.length,['товар','товара','товаров']);
    if(!curList.length){
      grid.innerHTML='<div class="empty-state"><b>Ничего не нашлось</b><span>Попробуйте изменить запрос или сбросить фильтры</span><button class="btn btn-line" type="button" data-act="reset">Сбросить всё</button></div>';
      more.hidden=true;renderChips();updateFacets();return;
    }
    grid.innerHTML=curList.slice(0,S.shown).map(card).join('');
    more.hidden=curList.length<=S.shown;
    renderChips();updateFacets();
  }
  function showMore(){
    if(more.hidden)return;
    var from=S.shown;S.shown+=PAGE;
    grid.insertAdjacentHTML('beforeend',curList.slice(from,S.shown).map(function(it,k){return card(it,k)}).join(''));
    more.hidden=curList.length<=S.shown;
  }
  function resetShown(toTop){
    var pinned=mini&&mini.classList.contains('on'),mobile=window.matchMedia('(max-width:760px)').matches;
    // Cancel an earlier smooth scroll before the filtered grid shrinks/clamps
    // the scroll range. Otherwise iOS can rubber-band the whole document.
    if(pinned&&mobile)window.scrollTo({top:Math.max(0,window.scrollY),behavior:'instant'});
    S.shown=PAGE;renderGrid();
    if(pinned){var target=Math.max(bar.getBoundingClientRect().bottom+window.scrollY-topEl.offsetHeight+1,grid.getBoundingClientRect().top+window.scrollY-topEl.offsetHeight-mini.offsetHeight-12);window.scrollTo({top:toTop===true?0:Math.max(0,target),behavior:mobile||reduce?'instant':'smooth'})}
  }

  /* ---------- вкладки ---------- */
  var tabs=$('tabs'),pill=tabs.querySelector('.pill');
  document.querySelectorAll('.cat-mini').forEach(function(el){el.remove()});
  var mini=document.createElement('nav');mini.className='cat-mini';mini.setAttribute('aria-label','Быстрый выбор категории');mini.setAttribute('aria-hidden','true');mini.setAttribute('inert','');
  mini.innerHTML='<div class="wrap cat-mini-in"><div class="cat-mini-tools"></div><div class="tabs" role="group" aria-label="Категории"></div></div>';document.body.appendChild(mini);
  var miniTabs=mini.querySelector('.tabs'),miniTools=mini.querySelector('.cat-mini-tools');
  function eachTabs(fn){[tabs,mini].forEach(fn)}
  function movePill(b,instant){if(!b)return;if(instant)pill.style.transition='none';pill.style.width=b.offsetWidth+'px';pill.style.transform='translateX('+b.offsetLeft+'px)';if(instant){void pill.offsetWidth;pill.style.transition=''}}
  function pillInit(){var a=tabs.querySelector('[aria-pressed="true"]');if(a)movePill(a,true)}
  function buildTabs(){
    var cnt={all:items.length};items.forEach(function(i){i.ids.forEach(function(id){cnt[id]=(cnt[id]||0)+1})});
    var ids=Object.keys(parts).filter(function(id){return cnt[id]}).sort(function(a,b){var x=ORDER.indexOf(parts[a]),y=ORDER.indexOf(parts[b]);return (x<0?99:x)-(y<0?99:y)});
    var h='<button type="button" aria-pressed="true" data-cat="all">Все<span>'+cnt.all+'</span></button>';
    ids.forEach(function(id){h+='<button type="button" aria-pressed="false" data-cat="'+id+'">'+esc(parts[id])+'<span>'+cnt[id]+'</span></button>'});
    var categories=h;
    h+='<button type="button" class="tab-tool" data-tool="sort" aria-label="Сортировка" aria-haspopup="dialog"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 5v14M4.500 15.500L8 19l3.500-3.500M16 19V5M12.500 8.500L16 5l3.500 3.500"/></svg></button><button type="button" class="tab-tool" data-tool="filters" aria-label="Фильтры"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg><i class="tt-n" hidden>0</i></button>';
    tabs.querySelectorAll('button').forEach(function(x){x.remove()});tabs.insertAdjacentHTML('beforeend',h);miniTabs.innerHTML=categories;miniTools.innerHTML=h.slice(categories.length);pillInit();sortPaint();
  }
  /* в сжатой панели (одна строка с прокруткой) докручиваем плашки до активной категории */
  function revealActive(instant){
    var a=miniTabs.querySelector('[data-cat][aria-pressed="true"]');if(!a||miniTabs.scrollWidth<=miniTabs.clientWidth)return;
    miniTabs.scrollTo({left:Math.max(0,a.offsetLeft-miniTabs.offsetLeft-(miniTabs.clientWidth-a.offsetWidth)/2),behavior:instant||reduce?'auto':'smooth'});
  }
  function categoryClick(e){
    var b=e.target.closest('button');if(!b)return;
    if(b.dataset.tool==='sort'){sortOpen(true);return}
    if(b.dataset.tool==='filters'){openF(!fsOpen());return}
    if(b.getAttribute('aria-pressed')==='true')return;
    eachTabs(function(root){root.querySelectorAll('[data-cat]').forEach(function(x){x.setAttribute('aria-pressed',String(x.dataset.cat===b.dataset.cat))})});
    movePill(tabs.querySelector('[data-cat][aria-pressed="true"]'));revealActive(false);
    S.cat=b.dataset.cat;resetShown(!mini.contains(b));
  }
  eachTabs(function(root){root.addEventListener('click',categoryClick)});
  /* телефон: свайп влево/вправо по списку товаров переключает категорию */
  (function(){
    var mq=window.matchMedia('(max-width:760px)'),x0,y0,t0,ok=false,area=document.querySelector('.cat-layout');
    if(!area)return;
    area.addEventListener('touchstart',function(e){
      ok=mq.matches&&e.touches.length===1&&qv.hidden&&!e.target.closest('input,select,textarea,.filters,.sh,[data-qv]');
      if(ok){x0=e.touches[0].clientX;y0=e.touches[0].clientY;t0=Date.now()}
    },{passive:true});
    area.addEventListener('touchend',function(e){
      if(!ok)return;ok=false;
      var t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;
      if(Math.abs(dx)<70||Math.abs(dx)<Math.abs(dy)*1.6||Date.now()-t0>600)return;
      var L=[].slice.call(tabs.querySelectorAll('[data-cat]')),i=L.findIndex(function(b){return b.getAttribute('aria-pressed')==='true'}),n=i+(dx<0?1:-1);
      if(i<0||n<0||n>=L.length)return;
      L[n].click();
      if(!reduce&&grid.animate)grid.animate([{opacity:.2,transform:'translateX('+(dx<0?36:-36)+'px)'},{opacity:1,transform:'none'}],{duration:260,easing:'cubic-bezier(.2,.8,.2,1)'});
    },{passive:true});
    area.addEventListener('touchcancel',function(){ok=false},{passive:true});
  })();
  window.addEventListener('resize',pillInit);if(document.fonts)document.fonts.ready.then(pillInit);

  /* ---------- фильтры (боковая панель / шторка) ---------- */
  function buildFilters(){
    var titles={};items.forEach(function(i){for(var t in i.chars){(titles[t]=titles[t]||{})[i.chars[t]]=1}});
    var keys=FGROUPS.filter(function(t){return titles[t]}).concat(Object.keys(titles).filter(function(t){return FGROUPS.indexOf(t)<0}));
    var prices=items.map(function(i){return i.price}).filter(Boolean);priceRange=[Math.floor(Math.min.apply(null,prices)),Math.ceil(Math.max.apply(null,prices))];
    var h='<label class="f-sw"><span>Только в наличии</span><input type="checkbox" id="fstock"><i></i></label>';
    keys.forEach(function(t,gi){
      fvals[t]=Object.keys(titles[t]).sort(function(a,b){return a.localeCompare(b,'ru')});
      h+='<details class="f-group"'+(gi===0?' open':'')+' data-g="'+esc(t)+'"><summary>'+esc(t)+'</summary><div class="f-list">'+fvals[t].map(function(v){return '<label class="f-opt" data-v="'+esc(v)+'"><input type="checkbox" data-t="'+esc(t)+'" value="'+esc(v)+'"><span class="f-box">'+CHECK+'</span><span>'+esc(v)+'</span><small></small></label>'}).join('')+'</div></details>';
    });
    h+='<details class="f-group"><summary>Цена, ₽</summary><div class="f-price"><input type="number" inputmode="numeric" id="pmin" min="0" placeholder="от '+priceRange[0]+'" aria-label="Цена от"><input type="number" inputmode="numeric" id="pmax" min="0" placeholder="до '+priceRange[1]+'" aria-label="Цена до"></div></details>';
    $('fbody').innerHTML=h;
  }
  function updateFacets(){
    Object.keys(fvals).forEach(function(t){
      var cnt={};items.forEach(function(it){if(match(it,t)){var v=it.chars[t];if(v!=null)cnt[v]=(cnt[v]||0)+1}});
      $('fbody').querySelectorAll('.f-opt').forEach(function(l){
        var inp=l.querySelector('input');if(inp.dataset.t!==t)return;
        var n=cnt[inp.value]||0,on=(S.f[t]||[]).indexOf(inp.value)>-1;
        l.querySelector('small').textContent=n;l.classList.toggle('zero',!n&&!on);inp.checked=on;
      });
    });
    var n=activeCount(),fc=$('fcount');fc.textContent=n;fc.hidden=!n;eachTabs(function(root){var tn=root.querySelector('.tt-n');if(tn){tn.textContent=n;tn.hidden=!n}var ft=root.querySelector('[data-tool=filters]');if(ft)ft.classList.toggle('active',n>0)});
    $('fdone').textContent='Показать '+curList.length+' '+plural(curList.length,['товар','товара','товаров']);
    $('freset').disabled=!(n||S.q);
  }
  var fsheet=null;
  function fsOpen(){return !!(fsheet&&fsheet.isOpen)}
  function openF(on){
    var mob=window.matchMedia('(max-width:980px)').matches;
    if(!mob){ // на десктопе кнопка сворачивает боковую панель
      var lay=document.querySelector('.cat-layout'),off=lay.classList.toggle('nofilters');
      $('fbtn').setAttribute('aria-expanded',String(!off));
      return;
    }
    if(!fsheet){
      var home=$('filters'),fb=$('fbody'),ff=home.querySelector('.f-foot');
      fsheet=MV.sheet({title:'Фильтры',className:'sh-filters',body:fb,footer:ff,
        onOpen:function(a){a.setBody(fb);a.setFooter(ff);$('fbtn').setAttribute('aria-expanded','true')},
        onClose:function(){home.appendChild(fb);home.appendChild(ff);$('fbtn').setAttribute('aria-expanded','false')}});
    }
    if(on)fsheet.open();else fsheet.close();
  }
  $('fbtn').addEventListener('click',function(){openF(!fsOpen())});
  $('fdone').addEventListener('click',function(){openF(false)});
  $('fbody').addEventListener('change',function(e){
    var t=e.target;
    if(t.id==='fstock'){S.stock=t.checked;resetShown();return}
    if(t.dataset.t){var a=S.f[t.dataset.t]||(S.f[t.dataset.t]=[]),i=a.indexOf(t.value);if(t.checked&&i<0)a.push(t.value);if(!t.checked&&i>-1)a.splice(i,1);if(!a.length)delete S.f[t.dataset.t];resetShown()}
  });
  var pT;$('fbody').addEventListener('input',function(e){
    if(e.target.id!=='pmin'&&e.target.id!=='pmax')return;
    clearTimeout(pT);pT=setTimeout(function(){var a=$('pmin').value,b=$('pmax').value;S.min=a===''?null:+a;S.max=b===''?null:+b;resetShown()},350);
  });
  function resetAll(){S.f={};S.min=S.max=null;S.stock=false;S.q='';$('q').value='';$('pmin').value='';$('pmax').value='';var s=$('fstock');if(s)s.checked=false;resetShown()}
  $('freset').addEventListener('click',resetAll);
  function renderChips(){
    var h='';
    if(S.q)h+='<button class="chip" type="button" data-chip="q">«'+esc(S.q)+'»'+X+'</button>';
    if(S.stock)h+='<button class="chip" type="button" data-chip="stock">В наличии'+X+'</button>';
    for(var t in S.f)S.f[t].forEach(function(v){h+='<button class="chip" type="button" data-chip="f" data-t="'+esc(t)+'" data-v="'+esc(v)+'">'+esc(v)+X+'</button>'});
    if(S.min!=null||S.max!=null)h+='<button class="chip" type="button" data-chip="price">'+(S.min!=null?'от '+S.min:'')+(S.max!=null?' до '+S.max:'')+' ₽'+X+'</button>';
    if(h)h+='<button class="chip chip-clear" type="button" data-chip="all">Сбросить всё</button>';
    $('chips').innerHTML=h;
  }
  $('chips').addEventListener('click',function(e){
    var c=e.target.closest('[data-chip]');if(!c)return;
    var k=c.dataset.chip;
    if(k==='all'){resetAll();return}
    if(k==='q'){S.q='';$('q').value=''}
    if(k==='stock'){S.stock=false;$('fstock').checked=false}
    if(k==='price'){S.min=S.max=null;$('pmin').value='';$('pmax').value=''}
    if(k==='f'){var a=S.f[c.dataset.t];a.splice(a.indexOf(c.dataset.v),1);if(!a.length)delete S.f[c.dataset.t]}
    resetShown();
  });
  grid.addEventListener('click',function(e){var r=e.target.closest('[data-act="reset"]');if(r)resetAll()});

  /* поиск и сортировка */
  var qT;$('q').addEventListener('input',function(){clearTimeout(qT);var v=this.value.trim().toLowerCase();qT=setTimeout(function(){S.q=v;resetShown()},200)});
  $('q').addEventListener('keydown',function(e){if(e.key==='Escape'){this.value='';S.q='';resetShown()}});
  $('sort').addEventListener('change',function(){S.sort=this.value;sortPaint();resetShown()});
  more.addEventListener('click',showMore);
  if('IntersectionObserver' in window)new IntersectionObserver(function(en){if(en[0].isIntersecting)showMore()},{rootMargin:'700px 0px'}).observe($('sentinel'));

  /* ---------- корзина Тильды ---------- */
  var cartEl=$('cart');
  function updBadge(){var n=MVProductCard.totals().n;if(cartEl){cartEl.textContent=n;cartEl.style.display=n?'':'none'}paintCards()}
  function bump(){updBadge();if(!cartEl)return;cartEl.classList.remove('bump');void cartEl.offsetWidth;cartEl.classList.add('bump')}
  function hookCart(){updBadge()}
  function afterLoad(){hookCart();setTimeout(hookCart,600);setTimeout(updBadge,1500)}
  if(document.readyState==='complete')afterLoad();else window.addEventListener('load',afterLoad);
  function openCart(){if(window.tcart__openCart)tcart__openCart();else if(document.querySelector('.t706__carticon'))document.querySelector('.t706__carticon').click()}
  $('cartBtn').addEventListener('click',openCart);
  function fly(b){
    MVProductCard.feedback(b,bump);
  }
  function addToCart(it,ed,qty,sel,btn){
    var from=btn.getBoundingClientRect();
    var p=it.raw,Y={name:it.title,price:ed.price,img:ed.img||it.img,recid:API.rec,lid:it.uid,uid:ed.uid,url:it.url,quantity:qty||1,
      pack_label:p.pack_label,pack_m:p.pack_m,pack_x:p.pack_x,pack_y:p.pack_y,pack_z:p.pack_z,part_uids:it.ids.map(String),gen_uid:p.externalid||''};
    if(ed.sku)Y.sku=String(ed.sku);
    if(ed.qty>0)Y.inv=ed.qty;
    if(p.unit)Y.unit=p.unit;if(p.portion)Y.portion=p.portion;if(p.single)Y.single=p.single;
    if(sel&&it.opts.length)Y.options=it.opts.map(function(o){return{option:o.title,variant:sel[o.title]}});
    if(typeof window.tcart__addProduct!=='function'){MVProductCard.notify('Корзина ещё загружается, попробуйте через секунду');return false}
    var before=lineQty(it,ed,sel),max=maxQty(ed);
    if(before+(qty||1)>max&&max<99){
      toast(before>=max?(max===1?'Это единственный экземпляр, он уже в корзине':'В корзине уже все '+max+' шт. — больше нет в наличии'):'В наличии только '+max+' шт., в корзине уже '+before);
      return false;
    }
    var t6=document.querySelector('.t706');if(t6)t6.setAttribute('data-opencart-onorder','no');
    var oa=window.alert;window.alert=function(m){toast(String(m||'Не удалось добавить товар'))};
    try{tcart__addProduct(Y)}finally{window.alert=oa}
    if(cartProducts().length&&lineQty(it,ed,sel)<=before){toast('Больше нет в наличии');return false}
    fly(from);paintCards();MVProductCard.refresh();return true;
  }
  /* быстрое добавление с карточки */
  MVProductCard.bind(grid,{
    getItem:function(uid){return byUid[uid]},
    add:function(it,button){addToCart(it,it.eds[0],1,null,button)},
    open:function(it){openQV(it.uid)},
    after:function(){paintCards();updBadge()},
    link:'a[href^="#p-"]'
  });

  /* ---------- просмотрщик ---------- */
  var qv=$('qv'),cur=null,sel={},gi=0,pushed=false,lastFocus=null;
  function selEd(it){
    if(!it.opts.length)return it.eds[0];
    return it.eds.filter(function(e){return it.opts.every(function(o){return e.raw[o.title]===sel[o.title]})})[0]||it.eds[0];
  }
  function gallery(it){
    var u=[];it.gal.forEach(function(x){if(u.indexOf(x)<0)u.push(x)});
    it.eds.forEach(function(e){if(e.img&&u.indexOf(e.img)<0)u.push(e.img)});
    return u.length?u:[it.img].filter(Boolean);
  }
  function stockHtml(ed){
    if(ed.qty===0)return '<span class="qv-stock out">Нет в наличии</span>';
    if(ed.qty!=null&&ed.qty<=3)return '<span class="qv-stock low">Осталось '+ed.qty+' шт.</span>';
    return '<span class="qv-stock">В наличии</span>';
  }
  function related(it){
    var fd=it.chars['Фандом'],L=items.filter(function(x){return x!==it&&!x.sold&&(fd?x.chars['Фандом']===fd:x.ids.some(function(id){return it.ids.indexOf(id)>-1}))});
    if(L.length<4)L=L.concat(items.filter(function(x){return x!==it&&!x.sold&&L.indexOf(x)<0&&x.ids.some(function(id){return it.ids.indexOf(id)>-1})}));
    return L.slice(0,10);
  }
  function qvHtml(it){
    var urls=gallery(it),ed=selEd(it),idx=curList.indexOf(it);
    var crumb='<span>'+esc(partName(it)||'Каталог')+'</span>'+(it.chars['Фандом']?'<span>'+esc(it.chars['Фандом'])+'</span>':'')+(ed.sku?'<span>Арт. '+esc(ed.sku)+'</span>':'');
    var opts=it.opts.map(function(o){
      var vals=o.values.map(function(v){var any=it.eds.some(function(e){return e.raw[o.title]===v&&e.qty!==0});return '<button type="button" data-o="'+esc(o.title)+'" data-v="'+esc(v)+'" aria-pressed="'+(sel[o.title]===v)+'"'+(any?'':' disabled')+'>'+esc(v)+'</button>'}).join('');
      return '<div class="qv-opt"><b>'+esc(o.title)+'<span id="optv-'+it.opts.indexOf(o)+'">'+esc(sel[o.title]||'')+'</span></b><div class="qv-seg">'+vals+'</div></div>';
    }).join('');
    var rel=related(it);
    var descr=it.text?'<div class="qv-desc">'+clean(it.text)+'</div>':'';
    var chars=it.cl.length?'<div class="qv-h">Характеристики</div><dl class="qv-dl">'+it.cl.map(function(c){return '<dt>'+esc(c.title)+'</dt><dd>'+esc(c.value)+'</dd>'}).join('')+'</dl>':'';
    return '<i class="qv-grab" aria-hidden="true"></i><div class="qv-top">'+
        '<button class="qv-btn" type="button" data-qv="pp" aria-label="Предыдущий товар" title="Предыдущий товар (Shift+←)"'+(idx<1?' disabled':'')+'>'+CHEV_L+'</button>'+
        '<button class="qv-btn" type="button" data-qv="pn" aria-label="Следующий товар" title="Следующий товар (Shift+→)"'+(idx<0||idx>=curList.length-1?' disabled':'')+'>'+CHEV_R+'</button>'+
        '<button class="qv-btn" type="button" data-qv="share" aria-label="Поделиться" title="Скопировать ссылку">'+SHARE+'</button>'+
        '<button class="qv-btn" type="button" data-qv="x" aria-label="Закрыть" title="Закрыть (Esc)">'+X+'</button></div>'+
      '<div class="qv-gal"><div class="qv-stage"><div class="qv-slides" id="qvSlides">'+urls.map(function(u,k){return '<div class="qv-slide"><img src="'+esc(thumb(u,1100))+'" data-full="'+esc(u)+'" alt="'+esc(it.title)+(urls.length>1?', фото '+(k+1):'')+'" draggable="false"'+(k?' loading="lazy"':'')+' onerror="if(this.dataset.full&&this.src!==this.dataset.full)this.src=this.dataset.full"></div>'}).join('')+'</div>'+
          (urls.length>1?'<div class="qv-arrows"><button class="qv-btn qv-prev" type="button" data-qv="gp" aria-label="Предыдущее фото">'+CHEV_L+'</button><button class="qv-btn qv-next" type="button" data-qv="gn" aria-label="Следующее фото">'+CHEV_R+'</button></div><div class="qv-count" id="qvCount">1 / '+urls.length+'</div><div class="qv-dots" id="qvDots">'+urls.map(function(_,k){return '<i'+(k===0?' class="on"':'')+'></i>'}).join('')+'</div>':'')+
        '</div></div>'+
      '<div class="qv-info"><div class="qv-scroll qv-swap">'+
        '<div class="qv-crumb">'+crumb+'</div>'+
        '<div class="qv-head"><h2 class="qv-title" id="qvTitle">'+esc(it.n)+'</h2><div class="qv-priceRow" id="qvPrice"></div></div>'+
        (it.descr?'<p class="qv-sub qv-short">'+clean(it.descr).replace(/<br\s*\/?>/g,' · ')+'</p>':'')+
        opts+
        '<div class="qv-ship">'+TRUCK+'<span>Отправляю в течение 3 рабочих дней после оплаты: Почтой России, Ozon-доставкой или СДЭК.</span></div>'+
        descr+chars+
        (rel.length>2?'<div class="qv-rel"><div class="qv-h">Похожие товары</div><div class="qv-rel-track">'+rel.map(function(x){return '<button type="button" data-rel="'+x.uid+'"><span class="im"><img src="'+esc(thumb(x.img,260))+'" alt="" loading="lazy"></span><span>'+esc(x.n)+'</span><b>'+fmt(x.price)+' ₽</b></button>'}).join('')+'</div></div>':'')+
      '</div><div class="qv-foot">'+
        '<div class="qv-buy" id="qvBuy"></div>'+
      '</div></div>';
  }
  /* свечение кнопки покупки (по мотивам кнопки из Framer, но на лёгком 2D-канвасе): кайма светится и следует за курсором,
     внутри мерцают искры, по нажатию от места клика расходится вспышка. Без анимации при prefers-reduced-motion */
  var glow=(function(){
    var host=null,cv=null,ctx=null,raf=0,I=0,hover=false,boost=0,mx=0,my=0,pulses=[],sp=[],W=0,H=0,dpr=1,last=0;
    function pos(e){var r=host.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top}
    function pill(c,i){var h=H-2*i,r=h/2,x0=i,x1=W-i;c.beginPath();c.moveTo(x0+r,i);c.lineTo(x1-r,i);c.arc(x1-r,i+r,r,-Math.PI/2,Math.PI/2);c.lineTo(x0+r,i+h);c.arc(x0+r,i+r,r,Math.PI/2,Math.PI*1.5);c.closePath()}
    function size(){
      var r=host.getBoundingClientRect();if(!r.width||!r.height)return false;
      dpr=Math.min(window.devicePixelRatio||1,2);
      if(Math.abs(r.width-W)>.5||Math.abs(r.height-H)>.5){W=r.width;H=r.height;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);sp=[];for(var k=0;k<16;k++)sp.push({x:Math.random()*W,y:Math.random()*H,r:.5+Math.random()*1.1,ph:Math.random()*6.28,f:.5+Math.random()*.9,vx:(Math.random()-.5)*7,vy:(Math.random()-.5)*7})}
      return true;
    }
    function palette(){
      var inner=host.firstElementChild,bg=inner&&inner!==cv?getComputedStyle(inner).backgroundColor:'rgb(0,0,0)',m=bg.match(/[\d.]+/g)||[0,0,0];
      return (.299*m[0]+.587*m[1]+.114*m[2])/255>.5?{rim:'196,145,58',spark:'168,118,34'}:{rim:'255,236,200',spark:'255,255,255'};
    }
    function go(){if(!raf)raf=requestAnimationFrame(frame)}
    function frame(t){
      raf=0;if(!host||!host.isConnected||!cv||!size())return;
      var dt=Math.min(.05,(t-(last||t))/1000);last=t;
      var active=hover||t<boost;I+=((active?1:0)-I)*Math.min(1,dt*7);
      pulses=pulses.filter(function(p){return t-p.t<1000});
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
      if(host.querySelector('[disabled]')&&!host.querySelector('.qv-step')){I=0;pulses=[];last=0;return}
      var pal=palette(),pb=0;
      pulses.forEach(function(p){pb=Math.max(pb,Math.max(0,1-(t-p.t)/700))});
      // вспышка от места клика
      ctx.save();pill(ctx,0);ctx.clip();
      pulses.forEach(function(p){
        var k=(t-p.t)/900,r=Math.max(8,k*W*.9),g=ctx.createRadialGradient(p.x,p.y,r*.55,p.x,p.y,r*1.15);
        g.addColorStop(0,'rgba('+pal.rim+',0)');g.addColorStop(.7,'rgba('+pal.rim+','+(.38*(1-k))+')');g.addColorStop(1,'rgba('+pal.rim+',0)');
        ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
      });
      // искры
      sp.forEach(function(q){
        q.x+=q.vx*dt;q.y+=q.vy*dt;if(q.x<0)q.x+=W;if(q.x>W)q.x-=W;if(q.y<0)q.y+=H;if(q.y>H)q.y-=H;
        var a=I*(.5+.5*Math.sin(t/1000*q.f*3+q.ph))*.9;if(a<.02)return;
        ctx.fillStyle='rgba('+pal.spark+','+a+')';ctx.beginPath();ctx.arc(q.x,q.y,q.r,0,6.283);ctx.fill();
      });
      ctx.restore();
      // кайма: ярче рядом с курсором
      if(I>.01||pb>0){
        ctx.save();pill(ctx,1);
        var g2=ctx.createRadialGradient(mx,my,0,mx,my,W*.6);
        g2.addColorStop(0,'rgba('+pal.rim+','+Math.min(1,.95*I+pb)+')');g2.addColorStop(1,'rgba('+pal.rim+','+Math.min(1,.22*I+pb*.6)+')');
        ctx.lineWidth=1.5+pb*5;ctx.strokeStyle=g2;ctx.shadowColor='rgba('+pal.rim+','+Math.min(1,.7*I+pb*.5)+')';ctx.shadowBlur=10+pb*18;ctx.stroke();ctx.restore();
      }
      if(active||I>.01||pulses.length)go();else last=0;
    }
    function mount(el){
      if(reduce||!el)return;
      if(host!==el){
        host=el;cv=document.createElement('canvas');cv.className='mv-glow';cv.setAttribute('aria-hidden','true');ctx=cv.getContext('2d');W=H=0;I=0;hover=false;pulses=[];
        mx=0;my=0;
        el.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse'){hover=true;pos(e);go()}});
        el.addEventListener('pointermove',function(e){if(e.pointerType==='mouse'){pos(e);go()}});
        el.addEventListener('pointerleave',function(){hover=false;go()});
        el.addEventListener('pointerdown',function(e){pos(e);var t=performance.now();pulses.push({t:t,x:mx,y:my});boost=t+1100;go()});
      }
      if(!el.contains(cv))el.appendChild(cv);
      go();
    }
    return{mount:mount};
  })();
  /* кнопка покупки как у карточки в каталоге: «В корзину» → после нажатия степпер «− N +»: левая часть «−», вся остальная кнопка «+» (по одной штуке) */
  function paintAct(){
    var box=$('qvBuy');if(!box||!cur)return;
    var it=cur,ed=selEd(it),max=maxQty(ed),q=lineQty(it,ed,sel),sig=[it.uid,ed.uid,q,max].join('|');
    if(box.dataset.sig===sig)return;box.dataset.sig=sig;
    if(ed.qty===0)box.innerHTML='<button class="btn btn-ink qv-add" type="button" data-qv="add" disabled>Нет в наличии</button>';
    else if(q>0)box.innerHTML='<div class="qv-step" role="group" aria-label="В корзине: '+esc(it.title)+'"><button type="button" data-qv="qm" aria-label="Убрать одну штуку">−</button><button type="button" class="qv-stq" data-qv="qp" aria-label="Добавить ещё одну штуку, сейчас в корзине '+q+'"'+(q>=max?' disabled':'')+'><span><b>'+q+'</b> в корзине · '+fmt(ed.price*q)+' ₽</span><i aria-hidden="true">+</i></button></div>';
    else box.innerHTML='<button class="btn btn-ink qv-add" type="button" data-qv="add">'+PLUS+'<span>В корзину · '+fmt(ed.price)+' ₽</span></button>';
    try{glow.mount(box)}catch(e){} // украшение не должно ломать покупку
  }
  if(window.MVProductCard)MVProductCard.watch(qv,function(){if(cur&&!qv.hidden)paintAct()});
  function paintBuy(){
    var it=cur,ed=selEd(it);
    var off=ed.old>ed.price?Math.round((1-ed.price/ed.old)*100):0;
    $('qvPrice').innerHTML='<span class="qv-price">'+fmt(ed.price)+' ₽</span>'+(off?'<span class="qv-old">'+fmt(ed.old)+' ₽</span><span class="qv-off">−'+off+'%</span>':'')+stockHtml(ed);
    paintAct();
    it.opts.forEach(function(o,k){var e=$('optv-'+k);if(e)e.textContent=sel[o.title]||''});
  }
  function curIdx(){var s=$('qvSlides');return s?Math.round(s.scrollLeft/(s.clientWidth||1)):0}
  function slideTo(k,instant){
    var s=$('qvSlides');if(!s)return;var w=s.clientWidth;
    s.scrollTo({left:k*w,behavior:instant||reduce?'auto':'smooth'});
  }
  function syncGal(){
    var s=$('qvSlides');if(!s)return;var w=s.clientWidth||1,k=Math.round(s.scrollLeft/w),n=s.children.length;
    if(k===gi)return;gi=k;
    var c=$('qvCount');if(c)c.textContent=(k+1)+' / '+n;
    qv.querySelectorAll('#qvDots i').forEach(function(d,i){d.classList.toggle('on',i===k)});
    var gp=qv.querySelector('[data-qv="gp"]'),gn=qv.querySelector('[data-qv="gn"]');if(gp)gp.disabled=k<=0;if(gn)gn.disabled=k>=n-1;
  }
  function renderQV(it,keep){
    cur=it;
    if(!keep){sel={};var first=it.eds.filter(function(e){return e.qty!==0})[0]||it.eds[0];it.opts.forEach(function(o){sel[o.title]=first.raw[o.title]!=null?first.raw[o.title]:o.values[0]})}
    gi=0;
    qv.innerHTML='<div class="qv-box">'+qvHtml(it)+'</div>';
    var s=$('qvSlides');s.addEventListener('scroll',function(){cancelAnimationFrame(renderQV.r);renderQV.r=requestAnimationFrame(syncGal)},{passive:true});
    var ed=selEd(it),urls=gallery(it),k=Math.max(0,urls.indexOf(ed.img));if(k>0){slideTo(k,true);gi=-1;syncGal()}
    var gp=qv.querySelector('[data-qv="gp"]');if(gp)gp.disabled=k<=0;
    var gn=qv.querySelector('[data-qv="gn"]');if(gn&&k>=urls.length-1)gn.disabled=true;
    paintBuy();
  }
  function openQV(uid,fromPop){
    var it=byUid[uid];if(!it)return;
    var first=qv.hidden;
    if(first){lastFocus=document.activeElement;qv.hidden=false;document.documentElement.style.overflow='hidden';document.body.classList.add('qv-lock');requestAnimationFrame(function(){requestAnimationFrame(function(){qv.classList.add('on')})})}
    renderQV(it);
    var url='#p-'+uid;
    if(!fromPop){if(first){history.pushState({qv:1},'',url);pushed=true}else history.replaceState({qv:1},'',url)}
    qv.querySelector('.qv-box').scrollTop=0;
    qv.focus({preventScroll:true});
  }
  function hideQV(){
    if(qv.hidden)return;
    qv.classList.remove('on');document.documentElement.style.overflow='';document.body.classList.remove('qv-lock');
    setTimeout(function(){if(!qv.classList.contains('on')){qv.hidden=true;qv.innerHTML=''}},reduce?0:350);
    if(lastFocus&&lastFocus.focus)try{lastFocus.focus({preventScroll:true})}catch(e){}
  }
  function closeQV(){
    if(qv.hidden)return;
    if(pushed&&history.state&&history.state.qv){pushed=false;history.back()}
    else{if(/^#p-/.test(location.hash))history.replaceState(null,'',location.pathname+location.search);hideQV()}
  }
  window.addEventListener('popstate',function(){
    if(!qv.isConnected)return;
    var m=/^#p-(\d+)/.exec(location.hash);
    if(m&&byUid[m[1]]){pushed=false;openQV(m[1],true)}else hideQV();
  });
  function step(d){
    if(!cur)return;var i=curList.indexOf(cur)+d;if(i<0||i>=curList.length)return;
    openQV(curList[i].uid);
  }
  /* смена товара жестом/кнопкой на телефоне: старая карточка уезжает в сторону, новая приезжает с другой */
  var stepBusy=false;
  function stepAnim(d){
    if(!cur||stepBusy)return;var i=curList.indexOf(cur)+d;if(i<0||i>=curList.length)return;
    var box=qv.querySelector('.qv-box');
    if(reduce||!box||!box.animate||!window.matchMedia('(max-width:760px)').matches){step(d);return}
    stepBusy=true;
    var kids=function(){return [].slice.call(qv.querySelector('.qv-box').children).filter(function(k){return !k.classList.contains('qv-grab')&&!k.classList.contains('qv-top')})};
    var out=kids().map(function(k){return k.animate([{transform:'none',opacity:1},{transform:'translateX('+(-d*70)+'px)',opacity:0}],{duration:150,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'})});
    setTimeout(function(){
      step(d);
      kids().forEach(function(k){k.animate([{transform:'translateX('+(d*70)+'px)',opacity:0},{transform:'none',opacity:1}],{duration:300,easing:'cubic-bezier(.2,.8,.2,1)'})});
      stepBusy=false;
    },150);
  }
  qv.addEventListener('click',function(e){
    if(e.target===qv){closeQV();return}
    var r=e.target.closest('[data-rel]');if(r){openQV(r.dataset.rel);return}
    var o=e.target.closest('[data-o]');if(o&&!o.disabled){
      sel[o.dataset.o]=o.dataset.v;
      qv.querySelectorAll('[data-o="'+o.dataset.o+'"]').forEach(function(b){b.setAttribute('aria-pressed',String(b===o))});
      var ed=selEd(cur),k=gallery(cur).indexOf(ed.img);if(k>-1)slideTo(k);
      paintBuy();return;
    }
    var sl=e.target.closest('.qv-slide');if(sl){lbOpen(gallery(cur),curIdx(),sl);return}
    var a=e.target.closest('[data-qv]');if(!a)return;
    switch(a.dataset.qv){
      case 'x':closeQV();break;
      case 'pp':stepAnim(-1);break;
      case 'pn':stepAnim(1);break;
      case 'gp':slideTo(Math.max(0,curIdx()-1));break;
      case 'gn':slideTo(Math.min($('qvSlides').children.length-1,curIdx()+1));break;
      case 'qm':{var edm=selEd(cur);if(lineQty(cur,edm,sel)>0){cartMinus(cur,edm,sel);if(navigator.vibrate)try{navigator.vibrate(8)}catch(x){}}paintAct();break}
      case 'qp':{var edp=selEd(cur);if(edp.qty!==0)addToCart(cur,edp,1,sel,a);paintAct();break}
      case 'share':{
        var u=location.origin+location.pathname+'#p-'+cur.uid;
        if(navigator.share){navigator.share({title:cur.title+' — Миравен',url:u}).catch(function(){})}
        else if(navigator.clipboard){navigator.clipboard.writeText(u).then(function(){toast('Ссылка скопирована')},function(){toast(u)})}
        else toast(u);
        break;
      }
      case 'add':{
        var ed2=selEd(cur);if(ed2.qty===0)break;
        addToCart(cur,ed2,1,sel,a);paintAct();
        break;
      }
    }
  });
  document.addEventListener('keydown',function(e){
    if(qv.hidden||!qv.isConnected)return;
    if(e.key==='Escape'){closeQV();return}
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
      var d=e.key==='ArrowLeft'?-1:1;
      if(e.shiftKey)step(d);else{var n=$('qvSlides')?$('qvSlides').children.length:0;if(n>1)slideTo(Math.max(0,Math.min(n-1,curIdx()+d)))}
      e.preventDefault();return;
    }
    if(e.key==='Tab'){
      var f=[].slice.call(qv.querySelectorAll('button:not(:disabled),a[href],input,select')).filter(function(x){return x.offsetParent!==null});
      if(!f.length)return;var a=f[0],z=f[f.length-1];
      if(e.shiftKey&&document.activeElement===a){z.focus();e.preventDefault()}
      else if(!e.shiftKey&&document.activeElement===z){a.focus();e.preventDefault()}
    }
  });
  /* свайп вниз по фото закрывает на телефоне не нужен: есть крестик и системная «назад» */



  /* ---------- полноэкранный просмотр фото ---------- */
  var lb=null,lbS=1,lbX=0,lbY=0,lbPt={},lbPinch=0,lbStart=1,lbTap=0,lbDrag=null;
  function lbSlide(){return lb&&lb.querySelector('.lb-slides')}
  function lbIdx(){var s=lbSlide();return s?Math.round(s.scrollLeft/(s.clientWidth||1)):0}
  function lbImg(){var s=lbSlide();return s&&s.children[lbIdx()]&&s.children[lbIdx()].querySelector('img')}
  function lbApply(){var im=lbImg();if(!im)return;im.style.transform='translate('+lbX+'px,'+lbY+'px) scale('+lbS+')';lb.classList.toggle('zoomed',lbS>1.02)}
  function lbReset(){lbS=1;lbX=lbY=0;lbPt={};lbPinch=0;lbApply()}
  function lbClamp(){var im=lbImg();if(!im)return;var w=im.clientWidth*lbS,h=im.clientHeight*lbS,mx=Math.max(0,(w-lb.clientWidth)/2),my=Math.max(0,(h-lb.clientHeight)/2);lbX=Math.max(-mx,Math.min(mx,lbX));lbY=Math.max(-my,Math.min(my,lbY))}
  function lbZoomAt(cx,cy,to){
    var im=lbImg();if(!im)return;
    if(to<=1.02){lbReset();return}
    var r=im.getBoundingClientRect(),ox=cx-(r.left+r.width/2),oy=cy-(r.top+r.height/2),k=to/lbS;
    lbX=lbX-ox*(k-1);lbY=lbY-oy*(k-1);lbS=to;lbClamp();lbApply();
  }
  function lbCount(){var c=lb.querySelector('.lb-count'),n=lbSlide().children.length;c.textContent=n>1?(lbIdx()+1)+' / '+n:''}
  function lbOpen(urls,idx,trigger){
    if(!urls||!urls.length)return;
    if(window.MVImageViewer){
      MVImageViewer.open({items:urls.map(function(u){return{src:thumb(u,1600),full:u,alt:cur?cur.title:''}}),index:idx,from:trigger,onChange:function(k){var s=$('qvSlides');if(s)s.scrollTo({left:k*s.clientWidth,behavior:'auto'})}});
      return;
    }
    if(!lb){
      lb=document.createElement('div');lb.className='lb';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');lb.setAttribute('aria-label','Просмотр фото');lb.hidden=true;
      lb.innerHTML='<div class="lb-slides"></div><div class="lb-count"></div><button type="button" class="lb-x" data-lb="x" aria-label="Закрыть">'+X+'</button><button type="button" class="lb-nav lb-p" data-lb="p" aria-label="Предыдущее фото">'+CHEV_L+'</button><button type="button" class="lb-nav lb-n" data-lb="n" aria-label="Следующее фото">'+CHEV_R+'</button>';
      (document.querySelector('.site')||document.body).appendChild(lb);
      if(window.MV&&MV.swipeDismiss)MV.swipeDismiss({on:lb,box:function(){return lb.querySelector('.lb-slides')},enabled:function(){return lbS<=1.02},close:lbClose});
      var sl=lbSlide();
      sl.addEventListener('scroll',function(){cancelAnimationFrame(lb._r);lb._r=requestAnimationFrame(function(){lbCount();if(lbS!==1)lbReset()})},{passive:true});
      lb.addEventListener('click',function(e){
        var b=e.target.closest('[data-lb]');
        if(b){var d=b.dataset.lb;if(d==='x')lbClose();else{var s2=lbSlide(),k=lbIdx()+(d==='n'?1:-1);k=Math.max(0,Math.min(s2.children.length-1,k));s2.scrollTo({left:k*s2.clientWidth,behavior:reduce?'auto':'smooth'})}return}
        if(Date.now()-lbTap<350&&e.target.closest('img')){lbTap=0;return} // второй клик двойного — обработает dblclick
        lbTap=Date.now();
        if(!e.target.closest('img')&&lbS<=1.02)lbClose(); // клик по тёмному фону
      });
      lb.addEventListener('dblclick',function(e){if(!e.target.closest('img'))return;lbZoomAt(e.clientX,e.clientY,lbS>1.02?1:2.6)});
      lb.addEventListener('wheel',function(e){if(!e.target.closest('img'))return;e.preventDefault();var to=Math.max(1,Math.min(5,lbS*(e.deltaY<0?1.2:1/1.2)));lbZoomAt(e.clientX,e.clientY,to)},{passive:false});
      // перетаскивание и щипок
      lb.addEventListener('pointerdown',function(e){
        if(!e.target.closest('img'))return;lbPt[e.pointerId]={x:e.clientX,y:e.clientY};
        var ids=Object.keys(lbPt);
        if(ids.length===2){var a=lbPt[ids[0]],b=lbPt[ids[1]];lbPinch=Math.hypot(a.x-b.x,a.y-b.y);lbStart=lbS;lb.classList.add('pinch')}
        else if(lbS>1.02){lbDrag={x:e.clientX,y:e.clientY,ox:lbX,oy:lbY}}
        try{e.target.setPointerCapture(e.pointerId)}catch(x){}
        if(e.pointerType==='touch'&&!e.isPrimary)return;
        if(e.pointerType==='touch'&&Date.now()-lbTap<300&&ids.length===1){lbZoomAt(e.clientX,e.clientY,lbS>1.02?1:2.6);lbTap=0}else if(e.pointerType==='touch')lbTap=Date.now();
      });
      lb.addEventListener('pointermove',function(e){
        if(!lbPt[e.pointerId])return;lbPt[e.pointerId]={x:e.clientX,y:e.clientY};
        var ids=Object.keys(lbPt);
        if(ids.length===2&&lbPinch){var a=lbPt[ids[0]],b=lbPt[ids[1]],d=Math.hypot(a.x-b.x,a.y-b.y);lbS=Math.max(1,Math.min(5,lbStart*d/lbPinch));lbClamp();lbApply()}
        else if(lbDrag&&lbS>1.02){lbX=lbDrag.ox+(e.clientX-lbDrag.x);lbY=lbDrag.oy+(e.clientY-lbDrag.y);lbClamp();lbApply()}
      });
      var up=function(e){delete lbPt[e.pointerId];lbDrag=null;if(Object.keys(lbPt).length<2){lbPinch=0;lb.classList.remove('pinch')}if(lbS<1.05)lbReset()};
      lb.addEventListener('pointerup',up);lb.addEventListener('pointercancel',up);
    }
    var sc=lbSlide();
    sc.innerHTML=urls.map(function(u){return '<div class="lb-slide"><img src="'+esc(thumb(u,1600))+'" data-full="'+esc(u)+'" alt="" draggable="false" onerror="if(this.dataset.full&&this.src!==this.dataset.full)this.src=this.dataset.full"></div>'}).join('');
    lb.classList.toggle('single',urls.length<2);
    lb.hidden=false;lbReset();
    requestAnimationFrame(function(){sc.scrollLeft=idx*sc.clientWidth;lbCount();requestAnimationFrame(function(){lb.classList.add('on')})});
    lb._from=document.activeElement;
    setTimeout(function(){var x=lb.querySelector('.lb-x');x&&x.focus({preventScroll:true})},60);
  }
  function lbClose(){
    if(!lb||lb.hidden)return;
    var k=lbIdx();lb.classList.remove('on');
    setTimeout(function(){if(!lb.classList.contains('on')){lb.hidden=true;lbSlide().innerHTML='';lbReset()}},reduce?0:320);
    var s=$('qvSlides');if(s)s.scrollTo({left:k*s.clientWidth,behavior:'auto'});
    if(lb._from&&lb._from.focus)try{lb._from.focus({preventScroll:true})}catch(e){}
  }
  document.addEventListener('keydown',function(e){
    if(!lb||lb.hidden)return;
    if(e.key==='Escape'){e.stopImmediatePropagation();e.preventDefault();lbClose();return}
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.stopImmediatePropagation();e.preventDefault();var s=lbSlide(),k=Math.max(0,Math.min(s.children.length-1,lbIdx()+(e.key==='ArrowRight'?1:-1)));s.scrollTo({left:k*s.clientWidth,behavior:reduce?'auto':'smooth'})}
  },true);

  if(window.MV&&MV.swipeDismiss)MV.swipeDismiss({on:qv,box:function(){return qv.querySelector('.qv-box')},scroller:function(){return qv.querySelector('.qv-box')},handle:'.qv-top,.qv-grab',enabled:function(){return !qv.hidden},close:closeQV});
  /* ---------- свайп влево/вправо листает товары (телефон) ---------- */
  (function(){
    var tx=0,ty=0,on=false,stage=false,canPrev=false,canNext=false;
    qv.addEventListener('touchstart',function(e){
      var t=e.touches[0];tx=t.clientX;ty=t.clientY;
      on=e.touches.length===1&&!e.target.closest('.qv-rel-track,.qv-seg,.qv-step,input,select,.qv-top');
      stage=!!e.target.closest('.qv-stage');
      if(stage){var n=($('qvSlides')||{children:[]}).children.length,k=curIdx();canPrev=k===0;canNext=k>=n-1}
    },{passive:true});
    qv.addEventListener('touchend',function(e){
      if(!on||!cur)return;on=false;
      var t=e.changedTouches[0],dx=t.clientX-tx,dy=t.clientY-ty;
      if(Math.abs(dx)<70||Math.abs(dx)<Math.abs(dy)*1.6)return;
      var dir=dx<0?1:-1;
      if(stage)return; // галерея всегда листает только фотографии, в том числе на её краях
      stepAnim(dir);
    },{passive:true});
    qv.addEventListener('touchcancel',function(){on=false},{passive:true});
  })();

  /* ---------- сортировка шторкой («Расположить», телефон) ---------- */
  var SORTS=[['def','По умолчанию','Как расположили мы'],['pa','Сначала дешевле','По возрастанию цены'],['pd','Сначала дороже','По убыванию цены'],['az','По названию','От А до Я']];
  var sortSheet=null;
  function sortPaint(){
    var b=$('sortBtn');if(b)b.classList.toggle('active',S.sort!=='def');
    eachTabs(function(root){var st=root.querySelector('[data-tool=sort]');if(st)st.classList.toggle('active',S.sort!=='def')});
    $('sort').value=S.sort;
    document.querySelectorAll('.ssh-opt').forEach(function(o){o.setAttribute('aria-pressed',String(o.dataset.s===S.sort))});
  }
  function sortOpen(on){
    if(!on){if(sortSheet)sortSheet.close();return}
    if(!sortSheet){
      sortSheet=MV.sheet({title:'Расположить',className:'sh-sort',body:'<div class="ssh-list">'+SORTS.map(function(x){return '<button class="ssh-opt" type="button" data-s="'+x[0]+'" aria-pressed="false"><span><b>'+x[1]+'</b><small>'+x[2]+'</small></span><i class="ssh-radio"></i></button>'}).join('')+'</div>'});
      sortSheet.body.addEventListener('click',function(e){
        var o=e.target.closest('.ssh-opt');if(!o)return;
        S.sort=o.dataset.s;sortPaint();resetShown();setTimeout(function(){sortSheet.close()},180);
      });
    }
    sortPaint();sortSheet.open();
  }
  if($('sortBtn'))$('sortBtn').addEventListener('click',function(){sortOpen(true)});

  /* ---------- оболочка: шапка, меню, вход, тема ---------- */
  // Большая панель остаётся на месте; маленькая появляется отдельно без перестройки страницы.
  function showMini(on){
    if(mini.classList.contains('on')===on)return;
    mini.classList.toggle('on',on);mini.setAttribute('aria-hidden',String(!on));if(on){mini.removeAttribute('inert');revealActive(true)}else mini.setAttribute('inert','');
  }
  var topEl=document.querySelector('.top'),bar=$('catBar');
  window.MVViewportHeader.mount(topEl,true);
  var hdrNow=-1,hdrEdgeNow=-1;
  function hdr(){if(!topEl||!topEl.isConnected)return;var r=topEl.getBoundingClientRect();hdrNow=r.height;if(r.bottom!==hdrEdgeNow){hdrEdgeNow=r.bottom;document.documentElement.style.setProperty('--hdr',r.bottom+'px')}}
  var scrolledNow=null;
  function onScroll(){if(!topEl.isConnected)return;hdr();var sc=window.scrollY>8,show=bar&&bar.getBoundingClientRect().bottom<=hdrEdgeNow;if(sc!==scrolledNow){scrolledNow=sc;topEl.classList.toggle('scrolled',sc)}showMini(show)}
  var scrollFrame=0;window.addEventListener('scroll',function(){if(scrollFrame||!topEl.isConnected)return;scrollFrame=requestAnimationFrame(function(){scrollFrame=0;onScroll()})},{passive:true});window.addEventListener('resize',hdr);hdr();onScroll();
  /* шапка меняет высоту плавно (после класса scrolled), поэтому следим за её размером, а не измеряем один раз в момент переключения: иначе под шапкой оставалась щель */
  if(window.ResizeObserver&&topEl)new ResizeObserver(function(){hdr()}).observe(topEl,{box:'border-box'});
  if(topEl)topEl.addEventListener('transitionend',hdr);

  function searchOpen(on){
    bar.classList.toggle('searching',on);document.documentElement.classList.toggle('mv-searching',on);
    var q=$('q');
    if(on){setTimeout(function(){q.focus({preventScroll:true})},60);window.scrollTo({top:Math.max(0,bar.getBoundingClientRect().top+scrollY-topEl.offsetHeight-8),behavior:reduce?'auto':'smooth'})}
    else if(S.q){q.value='';S.q='';resetShown()}
  }
  $('searchBtn').addEventListener('click',function(){
    var mob=window.matchMedia('(max-width:760px)').matches;
    if(mob){searchOpen(!bar.classList.contains('searching'));return}
    $('q').focus({preventScroll:true});window.scrollTo({top:Math.max(0,bar.getBoundingClientRect().top+scrollY-topEl.offsetHeight-8),behavior:reduce?'auto':'smooth'});
  });
  if($('qx'))$('qx').addEventListener('click',function(){searchOpen(false)});
  document.querySelectorAll('.rv').forEach(function(el){el.classList.add('in')});

  /*@CARTSHEET@*/
  /*@FAB@*/
  /*@AUTH@*/
  /*@THEME@*/

  if(window.matchMedia('(max-width:760px)').matches)$('q').placeholder='Поиск';

  /* ---------- запуск ---------- */
  function skeleton(){var h='';for(var i=0;i<8;i++)h+='<div class="pc sk" style="--i:'+i+'"><div class="pc-ph"></div><i style="width:40%"></i><i style="width:75%"></i><i style="width:30%"></i></div>';grid.innerHTML=h}
  skeleton();
  loadAll().then(function(all){
    if(!grid.isConnected)return;
    items=all.map(norm);items.forEach(function(i){byUid[i.uid]=i});
    buildTabs();buildFilters();
    $('catSub').textContent=items.length+' '+plural(items.length,['товар','товара','товаров'])+': открытки, наборы, свечи и наклейки';
    renderGrid();
    if(window.matchMedia('(max-width:980px)').matches){var f=$('filters');f.classList.remove('open')}
    var m=/^#p-(\d+)/.exec(location.hash);if(m&&byUid[m[1]])openQV(m[1],true);
  }).catch(function(){
    grid.innerHTML='<div class="empty-state"><b>Не удалось загрузить каталог</b><span>Проверьте соединение и обновите страницу</span><button class="btn btn-ink" type="button" onclick="location.reload()">Обновить</button></div>';
  });
})();
