(function(){
  'use strict';
    // МОДАЛЬНЫЕ ШТОРКИ (модуль MV.sheet)
  // Использование: var s=MV.sheet({title:'Заголовок', body:'<p>html</p>'|Node, footer:Node|'html', className:'my', onOpen:fn, onClose:fn});
  //   s.open(); s.close(); s.setTitle(t); s.setBody(x); s.setFooter(x); s.isOpen; s.el; s.body (контейнер содержимого)
  // На телефоне (до 980px) выезжает снизу, на широких экранах это центрированное окно. Esc, клик по подложке и крестик закрывают.
  (function(){
    var MV=window.MV=window.MV||{},stack=[],locks=0;
    var X='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    function put(box,x){if(x==null)return;box.innerHTML='';if(typeof x==='string')box.innerHTML=x;else box.appendChild(x)}
    MV.sheet=function(o){
      o=o||{};
      var el=document.createElement('div');el.className='sh'+(o.className?' '+o.className:'');el.hidden=true;
      el.innerHTML='<div class="sh-box" role="dialog" aria-modal="true"><i class="sh-grab"></i><div class="sh-head"><b class="sh-title"></b><button type="button" class="sh-x" aria-label="Закрыть">'+X+'</button></div><div class="sh-body"></div><div class="sh-foot" hidden></div></div>';
      (document.querySelector('.site')||document.body).appendChild(el);
      var box=el.querySelector('.sh-box'),body=el.querySelector('.sh-body'),foot=el.querySelector('.sh-foot'),title=el.querySelector('.sh-title'),from=null;
      var api={el:el,body:body,foot:foot,isOpen:false};
      api.setTitle=function(t){title.textContent=t||'';box.setAttribute('aria-label',t||'')};
      api.setBody=function(x){put(body,x)};
      api.setFooter=function(x){foot.hidden=x==null;put(foot,x)};
      api.open=function(){
        if(api.isOpen)return;api.isOpen=true;from=document.activeElement;
        el.hidden=false;stack.push(api);
        if(!locks++)document.documentElement.style.overflow='hidden';
        requestAnimationFrame(function(){requestAnimationFrame(function(){el.classList.add('on')})});
        setTimeout(function(){var f=box.querySelector('.sh-x');f&&f.focus({preventScroll:true})},60);
        if(o.onOpen)o.onOpen(api);
      };
      api.close=function(){
        if(!api.isOpen)return;api.isOpen=false;el.classList.remove('on');
        var i=stack.indexOf(api);if(i>-1)stack.splice(i,1);
        if(!--locks)document.documentElement.style.overflow='';
        setTimeout(function(){if(!api.isOpen)el.hidden=true},rm?0:420);
        if(from&&from.focus)try{from.focus({preventScroll:true})}catch(e){}
        if(o.onClose)o.onClose(api);
      };
      el.addEventListener('click',function(e){if(e.target===el||e.target.closest('.sh-x'))api.close()});
      api.setTitle(o.title);api.setBody(o.body);api.setFooter(o.footer);
      return api;
    };
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&stack.length){stack[stack.length-1].close()}});
  })();

  /* Каталог Миравен. Исходник: catalog.src.js. Файл catalog.js собирается скриптом build.py (подтягивает вход и тему из miraven.js). */
  var API={part:'683137745982',rec:'1278450591'};
  var HOME=window.MV_HOME||'/';
  var ORDER=['Открытки','Наборы открыток','Свечи','Наклейки на карты','Разное','Новинки','Распродажа'];
  var FGROUPS=['Фандом','Материал','Оборот','Формат'];
  var PAGE=24;
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
  function card(it,k){
    var btn=it.sold?'':'<button class="add" type="button" data-uid="'+it.uid+'" aria-label="'+(it.multi?'Выбрать вариант: ':'В корзину: ')+esc(it.title)+'">'+PLUS+'<span>'+(it.multi?'Выбрать':'В корзину')+'</span></button>';
    var price=it.sold?'<span class="soldtag">Нет в наличии</span>':(it.from?'от ':'')+fmt(it.price)+' ₽'+(it.old>it.price&&!it.from?'<s>'+fmt(it.old)+' ₽</s>':'');
    return '<article class="pc'+(it.sold?' sold':'')+'" style="--i:'+Math.min(k,11)+'" data-uid="'+it.uid+'"><div class="pc-ph">'+
      '<a class="pc-link" href="#p-'+it.uid+'" aria-label="'+esc(it.title)+'"></a>'+
      (it.img?'<img src="'+esc(thumb(it.img,520))+'" data-full="'+esc(it.img)+'" alt="'+esc(it.title)+'" loading="lazy" decoding="async" onerror="if(this.dataset.full&&this.src!==this.dataset.full)this.src=this.dataset.full">':'')+
      (it.img2&&!it.sold?'<img class="alt" src="'+esc(thumb(it.img2,520))+'" alt="" loading="lazy" decoding="async">':'')+
      badges(it)+btn+'</div><div class="pc-meta"><small>'+esc(it.t||partName(it))+'</small><h3><a href="#p-'+it.uid+'">'+esc(it.n)+'</a></h3></div><span class="price">'+price+'</span></article>';
  }
  var grid=$('grid'),more=$('more'),curList=[];
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
  function resetShown(){
    S.shown=PAGE;renderGrid();
    if(bar&&bar.classList.contains('stuck')){var lay=document.querySelector('.cat-layout');window.scrollTo({top:Math.max(0,lay.getBoundingClientRect().top+window.scrollY-topEl.offsetHeight-bar.offsetHeight-12),behavior:reduce?'auto':'smooth'})}
  }

  /* ---------- вкладки ---------- */
  var tabs=$('tabs'),pill=tabs.querySelector('.pill');
  function movePill(b,instant){if(!b)return;if(instant)pill.style.transition='none';pill.style.width=b.offsetWidth+'px';pill.style.transform='translateX('+b.offsetLeft+'px)';if(instant){void pill.offsetWidth;pill.style.transition=''}}
  function pillInit(){var a=tabs.querySelector('[aria-pressed="true"]');if(a)movePill(a,true)}
  function buildTabs(){
    var cnt={all:items.length};items.forEach(function(i){i.ids.forEach(function(id){cnt[id]=(cnt[id]||0)+1})});
    var ids=Object.keys(parts).filter(function(id){return cnt[id]}).sort(function(a,b){var x=ORDER.indexOf(parts[a]),y=ORDER.indexOf(parts[b]);return (x<0?99:x)-(y<0?99:y)});
    var h='<button type="button" aria-pressed="true" data-cat="all">Все<span>'+cnt.all+'</span></button>';
    ids.forEach(function(id){h+='<button type="button" aria-pressed="false" data-cat="'+id+'">'+esc(parts[id])+'<span>'+cnt[id]+'</span></button>'});
    h+='<button type="button" class="tab-tool" data-tool="sort" aria-label="Сортировка" aria-haspopup="dialog"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 5v14M4.500 15.500L8 19l3.500-3.500M16 19V5M12.500 8.500L16 5l3.500 3.500"/></svg></button><button type="button" class="tab-tool" data-tool="filters" aria-label="Фильтры"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg><i class="tt-n" hidden>0</i></button>';
    tabs.querySelectorAll('button').forEach(function(x){x.remove()});tabs.insertAdjacentHTML('beforeend',h);pillInit();sortPaint();
  }
  tabs.addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;
    if(b.dataset.tool==='sort'){sortOpen(true);return}
    if(b.dataset.tool==='filters'){openF(!fsOpen());return}
    if(b.getAttribute('aria-pressed')==='true')return;
    tabs.querySelectorAll('[data-cat]').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});
    movePill(b);b.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'});
    S.cat=b.dataset.cat;resetShown();
  });
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
    var n=activeCount(),fc=$('fcount');fc.textContent=n;fc.hidden=!n;var tn=tabs.querySelector('.tt-n');if(tn){tn.textContent=n;tn.hidden=!n}var ft=tabs.querySelector('[data-tool=filters]');if(ft)ft.classList.toggle('active',n>0);
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
        onOpen:function(){$('fbtn').setAttribute('aria-expanded','true')},
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
  function updBadge(){var n=0;try{n=(window.tcart&&window.tcart.total)|0;if(!n){var l=JSON.parse(localStorage.getItem('tcart')||'{}');n=l.total|0}}catch(e){}if(cartEl){cartEl.textContent=n;cartEl.style.display=n?'':'none'}}
  function bump(){updBadge();if(!cartEl)return;cartEl.classList.remove('bump');void cartEl.offsetWidth;cartEl.classList.add('bump')}
  function hookCart(){updBadge();if(window.tcart__reDrawCartIcon&&!window.tcart__reDrawCartIcon.__m){var o=window.tcart__reDrawCartIcon;window.tcart__reDrawCartIcon=function(){var r=o.apply(this,arguments);updBadge();return r};window.tcart__reDrawCartIcon.__m=1}}
  function afterLoad(){hookCart();setTimeout(hookCart,600);setTimeout(updBadge,1500)}
  if(document.readyState==='complete')afterLoad();else window.addEventListener('load',afterLoad);
  function openCart(){if(window.tcart__openCart)tcart__openCart();else if(document.querySelector('.t706__carticon'))document.querySelector('.t706__carticon').click()}
  $('cartBtn').addEventListener('click',openCart);
  function fly(b){
    if(!cartEl)return;var to=cartEl.getBoundingClientRect(),from=b.getBoundingClientRect();
    if(reduce||!document.body.animate){bump();return}
    var dot=document.createElement('i');dot.className='fly';dot.style.zIndex=200;document.body.appendChild(dot);
    var x0=from.left+from.width/2,y0=from.top+from.height/2,x1=to.left+to.width/2,y1=to.top+to.height/2,mx=(x0+x1)/2,my=Math.min(y0,y1)-120;
    var kf=[];for(var t=0;t<=1.0001;t+=.1){var a=(1-t)*(1-t),bb=2*(1-t)*t,c=t*t;kf.push({left:(a*x0+bb*mx+c*x1)+'px',top:(a*y0+bb*my+c*y1)+'px',transform:'scale('+(1-t*.55)+')',opacity:t>.9?.6:1})}
    dot.animate(kf,{duration:750,easing:'cubic-bezier(.3,.1,.3,1)'}).onfinish=function(){dot.remove();bump()};
  }
  function addToCart(it,ed,qty,sel,btn){
    var p=it.raw,Y={name:it.title,price:ed.price,img:ed.img||it.img,recid:API.rec,lid:it.uid,uid:ed.uid,url:it.url,quantity:qty||1,
      pack_label:p.pack_label,pack_m:p.pack_m,pack_x:p.pack_x,pack_y:p.pack_y,pack_z:p.pack_z,part_uids:it.ids.map(String),gen_uid:p.externalid||''};
    if(ed.sku)Y.sku=String(ed.sku);
    if(ed.qty>0)Y.inv=ed.qty;
    if(p.unit)Y.unit=p.unit;if(p.portion)Y.portion=p.portion;if(p.single)Y.single=p.single;
    if(sel&&it.opts.length)Y.options=it.opts.map(function(o){return{option:o.title,variant:sel[o.title]}});
    if(typeof window.tcart__addProduct!=='function'){toast('Корзина ещё загружается, попробуйте через секунду');return false}
    var t6=document.querySelector('.t706');if(t6)t6.setAttribute('data-opencart-onorder','no');
    tcart__addProduct(Y);fly(btn);return true;
  }
  /* быстрое добавление с карточки */
  grid.addEventListener('click',function(e){
    var b=e.target.closest('.add');if(b){
      e.preventDefault();var it=byUid[b.dataset.uid];if(!it)return;
      if(it.multi){openQV(it.uid);return}
      if(b.classList.contains('done'))return;
      if(addToCart(it,it.eds[0],1,null,b)){b.classList.add('done');b.innerHTML=CHECK+'<span>В корзине</span>';setTimeout(function(){b.classList.remove('done');b.innerHTML=PLUS+'<span>В корзину</span>'},2200)}
      return;
    }
    var a=e.target.closest('a[href^="#p-"]');
    if(a&&!(e.metaKey||e.ctrlKey||e.shiftKey||e.button)){e.preventDefault();openQV(a.getAttribute('href').slice(3))}
  });

  /* ---------- просмотрщик ---------- */
  var qv=$('qv'),cur=null,sel={},qty=1,gi=0,pushed=false,lastFocus=null;
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
    return '<div class="qv-top">'+
        '<span class="qv-pos">'+(idx>-1?(idx+1)+' / '+curList.length:'')+'</span>'+
        '<button class="qv-btn" type="button" data-qv="pp" aria-label="Предыдущий товар" title="Предыдущий товар (Shift+←)"'+(idx<1?' disabled':'')+'>'+CHEV_L+'</button>'+
        '<button class="qv-btn" type="button" data-qv="pn" aria-label="Следующий товар" title="Следующий товар (Shift+→)"'+(idx<0||idx>=curList.length-1?' disabled':'')+'>'+CHEV_R+'</button>'+
        '<button class="qv-btn" type="button" data-qv="share" aria-label="Поделиться" title="Скопировать ссылку">'+SHARE+'</button>'+
        '<button class="qv-btn" type="button" data-qv="x" aria-label="Закрыть" title="Закрыть (Esc)">'+X+'</button></div>'+
      '<div class="qv-gal"><div class="qv-thumbs">'+urls.map(function(u,k){return '<button type="button" data-g="'+k+'" aria-label="Фото '+(k+1)+'" aria-current="'+(k===0)+'"><img src="'+esc(thumb(u,140))+'" alt="" loading="lazy"></button>'}).join('')+'</div>'+
        '<div class="qv-stage"><div class="qv-slides" id="qvSlides">'+urls.map(function(u,k){return '<div class="qv-slide"><img src="'+esc(thumb(u,1100))+'" data-full="'+esc(u)+'" alt="'+esc(it.title)+(urls.length>1?', фото '+(k+1):'')+'" draggable="false"'+(k?' loading="lazy"':'')+' onerror="if(this.dataset.full&&this.src!==this.dataset.full)this.src=this.dataset.full"></div>'}).join('')+'</div>'+
          (urls.length>1?'<div class="qv-arrows"><button class="qv-btn qv-prev" type="button" data-qv="gp" aria-label="Предыдущее фото">'+CHEV_L+'</button><button class="qv-btn qv-next" type="button" data-qv="gn" aria-label="Следующее фото">'+CHEV_R+'</button></div><div class="qv-count" id="qvCount">1 / '+urls.length+'</div><div class="qv-dots" id="qvDots">'+urls.map(function(_,k){return '<i'+(k===0?' class="on"':'')+'></i>'}).join('')+'</div>':'')+
        '</div></div>'+
      '<div class="qv-info"><div class="qv-scroll qv-swap">'+
        '<div class="qv-crumb">'+crumb+'</div>'+
        '<div class="qv-head">'+(it.t?'<div class="qv-sub">'+esc(it.t)+'</div>':'')+'<h2 class="qv-title" id="qvTitle">'+esc(it.n)+'</h2><div class="qv-priceRow" id="qvPrice"></div></div>'+
        (it.descr?'<p class="qv-sub qv-short">'+clean(it.descr).replace(/<br\s*\/?>/g,' · ')+'</p>':'')+
        opts+
        '<div class="qv-ship">'+TRUCK+'<span>Отправляю в течение 3 рабочих дней после оплаты: Почтой России, Ozon-доставкой или СДЭК.</span></div>'+
        descr+chars+
        (rel.length>2?'<div class="qv-rel"><div class="qv-h">Похожие товары</div><div class="qv-rel-track">'+rel.map(function(x){return '<button type="button" data-rel="'+x.uid+'"><span class="im"><img src="'+esc(thumb(x.img,260))+'" alt="" loading="lazy"></span><span>'+esc(x.n)+'</span><b>'+fmt(x.price)+' ₽</b></button>'}).join('')+'</div></div>':'')+
      '</div><div class="qv-foot">'+
        '<div class="qv-buy"><div class="qv-qty"><button type="button" data-qv="qm" aria-label="Меньше">−</button><output id="qvQty">1</output><button type="button" data-qv="qp" aria-label="Больше">+</button></div><button class="btn btn-ink qv-add" type="button" data-qv="add" id="qvAdd"></button></div>'+
        '<button class="qv-gocart" type="button" data-qv="cart" id="qvGo" hidden>Товар в корзине. Открыть корзину →</button>'+
      '</div></div>';
  }
  function paintBuy(){
    var it=cur,ed=selEd(it);
    var off=ed.old>ed.price?Math.round((1-ed.price/ed.old)*100):0;
    $('qvPrice').innerHTML='<span class="qv-price">'+fmt(ed.price)+' ₽</span>'+(off?'<span class="qv-old">'+fmt(ed.old)+' ₽</span><span class="qv-off">−'+off+'%</span>':'')+stockHtml(ed);
    var max=ed.qty==null?99:Math.max(ed.qty,0);if(qty>max)qty=Math.max(1,max);
    $('qvQty').textContent=qty;
    var box=qv.querySelector('.qv-qty');box.children[0].disabled=qty<=1;box.children[2].disabled=qty>=max;
    var add=$('qvAdd');
    if(ed.qty===0){add.disabled=true;add.classList.remove('done');add.innerHTML='Нет в наличии'}
    else{add.disabled=false;add.classList.remove('done');add.innerHTML=PLUS+'<span>В корзину · '+fmt(ed.price*qty)+' ₽</span>'}
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
    qv.querySelectorAll('.qv-thumbs button').forEach(function(b,i){b.setAttribute('aria-current',String(i===k));if(i===k)b.scrollIntoView({block:'nearest',inline:'nearest'})});
    var c=$('qvCount');if(c)c.textContent=(k+1)+' / '+n;
    qv.querySelectorAll('#qvDots i').forEach(function(d,i){d.classList.toggle('on',i===k)});
    var gp=qv.querySelector('[data-qv="gp"]'),gn=qv.querySelector('[data-qv="gn"]');if(gp)gp.disabled=k<=0;if(gn)gn.disabled=k>=n-1;
  }
  function renderQV(it,keep){
    cur=it;
    if(!keep){sel={};var first=it.eds.filter(function(e){return e.qty!==0})[0]||it.eds[0];it.opts.forEach(function(o){sel[o.title]=first.raw[o.title]!=null?first.raw[o.title]:o.values[0]});qty=1}
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
    var cl=qv.querySelector('[data-qv="x"]');cl&&cl.focus({preventScroll:true});
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
    var m=/^#p-(\d+)/.exec(location.hash);
    if(m&&byUid[m[1]]){pushed=false;openQV(m[1],true)}else hideQV();
  });
  function step(d){
    if(!cur)return;var i=curList.indexOf(cur)+d;if(i<0||i>=curList.length)return;
    openQV(curList[i].uid);
  }
  qv.addEventListener('click',function(e){
    if(e.target===qv){closeQV();return}
    var r=e.target.closest('[data-rel]');if(r){openQV(r.dataset.rel);return}
    var g=e.target.closest('[data-g]');if(g){slideTo(+g.dataset.g);return}
    var o=e.target.closest('[data-o]');if(o&&!o.disabled){
      sel[o.dataset.o]=o.dataset.v;
      qv.querySelectorAll('[data-o="'+o.dataset.o+'"]').forEach(function(b){b.setAttribute('aria-pressed',String(b===o))});
      var ed=selEd(cur),k=gallery(cur).indexOf(ed.img);if(k>-1)slideTo(k);
      paintBuy();return;
    }
    var sl=e.target.closest('.qv-slide');if(sl){lbOpen(gallery(cur),curIdx());return}
    var a=e.target.closest('[data-qv]');if(!a)return;
    switch(a.dataset.qv){
      case 'x':closeQV();break;
      case 'pp':step(-1);break;
      case 'pn':step(1);break;
      case 'gp':slideTo(Math.max(0,curIdx()-1));break;
      case 'gn':slideTo(Math.min($('qvSlides').children.length-1,curIdx()+1));break;
      case 'qm':qty=Math.max(1,qty-1);paintBuy();break;
      case 'qp':qty++;paintBuy();break;
      case 'cart':openCart();break;
      case 'share':{
        var u=location.origin+location.pathname+'#p-'+cur.uid;
        if(navigator.share){navigator.share({title:cur.title+' — Миравен',url:u}).catch(function(){})}
        else if(navigator.clipboard){navigator.clipboard.writeText(u).then(function(){toast('Ссылка скопирована')},function(){toast(u)})}
        else toast(u);
        break;
      }
      case 'add':{
        var ed2=selEd(cur);if(ed2.qty===0)break;
        if(addToCart(cur,ed2,qty,sel,a)){
          a.classList.add('done');a.innerHTML=CHECK+'<span>Добавлено</span>';$('qvGo').hidden=false;
          clearTimeout(a._t);a._t=setTimeout(function(){if(cur)paintBuy()},2200);
        }
        break;
      }
    }
  });
  document.addEventListener('keydown',function(e){
    if(qv.hidden)return;
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
  function lbOpen(urls,idx){
    if(!urls||!urls.length)return;
    if(!lb){
      lb=document.createElement('div');lb.className='lb';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');lb.setAttribute('aria-label','Просмотр фото');lb.hidden=true;
      lb.innerHTML='<div class="lb-slides"></div><div class="lb-count"></div><button type="button" class="lb-x" data-lb="x" aria-label="Закрыть">'+X+'</button><button type="button" class="lb-nav lb-p" data-lb="p" aria-label="Предыдущее фото">'+CHEV_L+'</button><button type="button" class="lb-nav lb-n" data-lb="n" aria-label="Следующее фото">'+CHEV_R+'</button>';
      (document.querySelector('.site')||document.body).appendChild(lb);
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

  /* ---------- свайп влево/вправо листает товары (телефон) ---------- */
  (function(){
    var tx=0,ty=0,on=false,stage=false,canPrev=false,canNext=false;
    qv.addEventListener('touchstart',function(e){
      var t=e.touches[0];tx=t.clientX;ty=t.clientY;
      on=e.touches.length===1&&!e.target.closest('.qv-rel-track,.qv-seg,.qv-qty,input,select,.qv-top');
      stage=!!e.target.closest('.qv-stage');
      if(stage){var n=($('qvSlides')||{children:[]}).children.length,k=curIdx();canPrev=k===0;canNext=k>=n-1}
    },{passive:true});
    qv.addEventListener('touchend',function(e){
      if(!on||!cur)return;on=false;
      var t=e.changedTouches[0],dx=t.clientX-tx,dy=t.clientY-ty;
      if(Math.abs(dx)<70||Math.abs(dx)<Math.abs(dy)*1.6)return;
      var dir=dx<0?1:-1;
      if(stage&&((dir===1&&!canNext)||(dir===-1&&!canPrev)))return; // внутри галереи листаются фото
      step(dir);
    },{passive:true});
  })();

  /* ---------- сортировка шторкой («Расположить», телефон) ---------- */
  var SORTS=[['def','По умолчанию','Как расположили мы'],['pa','Сначала дешевле','По возрастанию цены'],['pd','Сначала дороже','По убыванию цены'],['az','По названию','От А до Я']];
  var sortSheet=null;
  function sortPaint(){
    var b=$('sortBtn');if(b)b.classList.toggle('active',S.sort!=='def');
    var st=tabs.querySelector('[data-tool=sort]');if(st)st.classList.toggle('active',S.sort!=='def');
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
  // плавное сжатие/разворот панели категорий (высота + перелёт каждой плашки)
  function setCompact(on){
    if(bar.classList.contains('compact')===on)return;
    var inner=bar.querySelector('.cat-bar-in'),btns=[].slice.call(tabs.children).filter(function(b){return b.tagName==='BUTTON'});
    var h0=inner.offsetHeight,r0=btns.map(function(b){return b.getBoundingClientRect()});
    bar.classList.toggle('compact',on);
    if(reduce||!inner.animate||!window.matchMedia('(max-width:760px)').matches)return;
    var h1=inner.offsetHeight;
    if(h0!==h1){inner.style.overflow='hidden';var a=inner.animate([{height:h0+'px'},{height:h1+'px'}],{duration:440,easing:'cubic-bezier(.2,.8,.2,1)'});a.onfinish=a.oncancel=function(){inner.style.overflow=''}}
    btns.forEach(function(b,i){
      var r1=b.getBoundingClientRect(),dx=r0[i].left-r1.left,dy=r0[i].top-r1.top;
      if(Math.abs(dx)>1||Math.abs(dy)>1)b.animate([{transform:'translate('+dx+'px,'+dy+'px)',opacity:Math.abs(dy)>60?0:1},{transform:'none',opacity:1}],{duration:480,easing:'cubic-bezier(.2,.8,.2,1)'});
    });
  }
  var topEl=document.querySelector('.top'),bar=$('catBar');
  function hdr(){var h=topEl?topEl.offsetHeight:68;document.documentElement.style.setProperty('--hdr',h+'px')}
  function onScroll(){topEl.classList.toggle('scrolled',window.scrollY>8);hdr();var sn=$('barSent');if(sn&&bar)setCompact(sn.getBoundingClientRect().top<=topEl.offsetHeight);if(bar){var r=bar.getBoundingClientRect();bar.classList.toggle('stuck',r.top<=(topEl.offsetHeight+1))}}
  window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',hdr);hdr();onScroll();
  var mn=$('mnav'),bg=$('burger');if(mn&&bg){bg.addEventListener('click',function(){mn.hidden=!mn.hidden});mn.addEventListener('click',function(){mn.hidden=true})}
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

    // КОРЗИНА В ШТОРКЕ
  // «Ваш заказ» открывается в нашей шторке (MV.sheet), а не отдельным окном Тильды: содержимое корзины (список, доставка, поля, оплата)
  // переносится в шторку, вся логика остаётся штатной. Поддерживаются оба режима блока: всплывающее окно и полноэкранная страница.
  (function(){
    var sh=null,content=null,home=null,empty=null,obs=null,pobs=null,cur=null;
    var MODES={
      page:{win:'.t706__cartpage',content:'.t706__cartpage-content',shown:'t706__cartpage_showed',products:'.t706__cartpage-products',close:'tcart__closeCartFullscreen'},
      win:{win:'.t706__cartwin',content:'.t706__cartwin-content',shown:'t706__cartwin_showed',products:'.t706__cartwin-products',close:'tcart__closeCart'}
    };
    function mode(){return window.tcart_fullscreen&&document.querySelector(MODES.page.win)?MODES.page:MODES.win}
    function isEmpty(){var t=window.tcart;return !(t&&t.products&&t.products.length)}
    function restore(){
      if(content&&home){home.appendChild(content)}
      if(obs){obs.disconnect();obs=null}
      if(pobs){pobs.disconnect();pobs=null}
      document.documentElement.classList.remove('mv-cartsheet');
    }
    function build(){
      if(sh||!window.MV||!MV.sheet)return !!sh;
      sh=MV.sheet({title:'Ваш заказ',className:'sh-cart',
        onClose:function(){
          var m=cur||mode(),w=document.querySelector(m.win),fn=window[m.close];
          if(w&&w.classList.contains(m.shown)&&typeof fn==='function'){try{fn()}catch(e){}}
          restore();
        }});
      empty=document.createElement('div');empty.className='cart-empty';
      empty.innerHTML='<b>Корзина пуста</b><span>Добавьте открытки из каталога, и они появятся здесь.</span><a class="btn btn-ink" href="/store">В каталог</a>';
      return true;
    }
    function show(){
      var m=mode(),w=document.querySelector(m.win);content=w&&w.querySelector(m.content);
      if(!content||!build())return;
      cur=m;home=content.parentNode;
      document.documentElement.classList.add('mv-cartsheet');
      sh.el.classList.toggle('sh-cart-page',m===MODES.page);
      sh.body.innerHTML='';sh.body.appendChild(empty);sh.body.appendChild(content);
      sh.el.classList.toggle('is-empty',isEmpty());
      if(!sh.isOpen)sh.open();
      // если Тильда сама закрыла корзину (например, после оформления), закрываем и шторку
      if(obs)obs.disconnect();
      obs=new MutationObserver(function(){if(!w.classList.contains(m.shown)&&sh.isOpen)sh.close()});
      obs.observe(w,{attributes:true,attributeFilter:['class']});
      // состав корзины меняется внутри: следим за пустотой
      var pr=content.querySelector(m.products);
      if(pobs)pobs.disconnect();
      if(pr){pobs=new MutationObserver(function(){sh.el.classList.toggle('is-empty',isEmpty())});pobs.observe(pr,{childList:true})}
    }
    function hook(){
      if(typeof window.tcart__openCart!=='function'||window.tcart__openCart.__mv)return false;
      var o=window.tcart__openCart,f=window.tcart__openCartFullscreen;
      if(typeof f==='function'&&!f.__mv){
        window.tcart__openCartFullscreen=function(){var r=f.apply(this,arguments);setTimeout(show,30);return r};
        window.tcart__openCartFullscreen.__mv=1;
      }
      window.tcart__openCart=function(){
        if(window.tcart_fullscreen&&typeof window.tcart__openCartFullscreen==='function'&&document.querySelector(MODES.page.win)){return window.tcart__openCartFullscreen()} // сразу страница заказа, без боковой панели
        var r=o.apply(this,arguments);setTimeout(show,30);return r;
      };
      window.tcart__openCart.__mv=1;return true;
    }
    if(!hook()){var n=0,t=setInterval(function(){if(hook()||++n>80)clearInterval(t)},150)}
    window.addEventListener('load',function(){hook();setTimeout(hook,800)});
  })();

    // ПЛАВАЮЩАЯ КОРЗИНА (телефон)
  (function(){
    var site=document.querySelector('.site');if(!site)return;
    var fab=document.createElement('button');fab.type='button';fab.className='fab';fab.setAttribute('aria-label','Открыть корзину');
    fab.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1.2 11.2a1 1 0 0 1-.8.8H7.200a1 1 0 0 1-.8-.8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg><span class="fab-sum"></span><i class="fab-n"></i>';
    site.appendChild(fab);
    var sf=document.createElement('button');sf.type='button';sf.className='sfab';sf.setAttribute('aria-label','Поиск');
    sf.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg><span>Поиск</span>';
    site.appendChild(sf);
    sf.addEventListener('click',function(){var b=document.getElementById('searchBtn');if(b)b.click()});
    var last='';
    function read(){var n=0,s=0;try{var t=window.tcart;if(!(t&&t.products)){t=JSON.parse(localStorage.getItem('tcart')||'{}')}n=+t.total||0;s=+t.prodamount||+t.amount||0}catch(e){}return{n:n,s:s}}
    function paint(){
      var d=read(),key=d.n+'|'+d.s;
      fab.classList.toggle('on',d.n>0);
      sf.classList.toggle('left',d.n>0); // есть товары: поиск уезжает влево, справа корзина
      if(key===last)return;
      var first=last==='';last=key;
      fab.querySelector('.fab-sum').textContent=Math.round(d.s).toLocaleString('ru-RU').replace(/ /g,' ')+' ₽';
      fab.querySelector('.fab-n').textContent=d.n;
      if(!first){fab.classList.remove('bump');void fab.offsetWidth;fab.classList.add('bump')}
    }
    fab.addEventListener('click',function(){if(window.tcart__openCart)tcart__openCart();else{var i=document.querySelector('.t706__carticon');i&&i.click()}});
    paint();setInterval(paint,700);
  })();

    // вход / регистрация: родной попап личного кабинета Тильды (Members), оформляем под сайт
  (function(){
    var ar=document.getElementById('allrecords'),pid=ar&&ar.getAttribute('data-tilda-project-id'),signed=false;
    try{signed=!!(pid&&JSON.parse(localStorage.getItem('tilda_members_profile'+pid)))}catch(e){}
    var accBtn=document.getElementById('accBtn');
    if(signed&&accBtn){accBtn.classList.add('signed');accBtn.title='Личный кабинет';accBtn.setAttribute('aria-label','Личный кабинет')}
    // ссылка вида /members/login: её перехватывает Тильда и открывает попап (без неё остаётся переход на страницу)
    var url='/members/login?redirecturl='+encodeURIComponent(location.pathname.replace(/^\//,'')+location.search);
    if(!signed)document.querySelectorAll('a[href="#openmembersbar"]').forEach(function(a){a.href=url});
    // ---- свой личный кабинет в окне (данные берём из API Тильды) ----
    var cab,cs={tab:'orders',orders:[],total:0,next:1,dash:null,busy:false,err:false,loaded:false};
    var ST={cancelled:['Отменён','bad'],canceled:['Отменён','bad'],completed:['Выполнен','ok'],done:['Выполнен','ok'],sent:['Отправлен','ok'],shipped:['Отправлен','ok'],paid:['Оплачен','ok'],processing:['В обработке','mid'],new:['Новый','mid'],pending:['Ожидает оплаты','mid']};
    function eh(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
    function dec(t){var x=document.createElement('textarea');x.innerHTML=t||'';return x.value}
    function rub(n){return Math.round(+n||0).toLocaleString('ru-RU').replace(/ /g,' ')+' ₽'}
    function dt(s){var m=/(\d{4})-(\d\d)-(\d\d)/.exec(s||'');return m?m[3]+'.'+m[2]+'.'+m[1]:''}
    function plr(n,f){var a=n%100,b=a%10;return a>10&&a<20?f[2]:b>1&&b<5?f[1]:b===1?f[0]:f[2]}
    function prof(){try{return JSON.parse(localStorage.getItem('tilda_members_profile'+pid))||{}}catch(e){return{}}}
    function pUrl(u){var m=/tproduct\/(\d+)/.exec(u||'');return m?'/store#p-'+m[1]:(u||'#')}
    var IC_X='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    var IC_CH='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
    function api(){return typeof window.tmst__fetchData==='function'}
    function cabHead(){
      var p=prof(),n=dec(p.name||'Покупатель'),ini=n.split(/\s+/).slice(0,2).map(function(w){return w.charAt(0)}).join('').toUpperCase()||'М';
      return '<div class="cab-top"><span class="cab-ava">'+eh(ini)+'</span><div class="cab-who"><b>'+eh(n)+'</b><span>'+eh(p.login||'')+'</span></div><button class="cab-x" type="button" data-cab="x" aria-label="Закрыть">'+IC_X+'</button></div>'
        +'<div class="cab-tabs" role="tablist"><button type="button" role="tab" data-cab="tab" data-t="orders">Заказы'+(cs.total?'<i>'+cs.total+'</i>':'')+'</button><button type="button" role="tab" data-cab="tab" data-t="bought">Покупки'+(cs.dash&&cs.dash.purchases_count?'<i>'+cs.dash.purchases_count+'</i>':'')+'</button><button type="button" role="tab" data-cab="tab" data-t="me">Профиль</button></div>';
    }
    function orderHtml(o,k){
      var s=ST[o.status&&o.status.name]||[o.status&&o.status.title||'Заказ','mid'];if(o.status&&o.status.title)s=[o.status.title,s[1]];
      var ps=o.products||[],th=ps.slice(0,3).map(function(p){return '<img src="'+eh(p.image)+'" alt="" loading="lazy">'}).join('')+(ps.length>3?'<span class="co-more">+'+(ps.length-3)+'</span>':'');
      var list=ps.map(function(p){
        var op=(p.options||[]).filter(function(x){return x.variant}).map(function(x){return eh(x.option)+': '+eh(x.variant)}).join(', ');
        return '<a class="co-p" href="'+eh(pUrl(p.url))+'"><img src="'+eh(p.image)+'" alt="" loading="lazy"><span><b>'+eh(dec(p.title))+'</b>'+(op?'<small>'+op+'</small>':'')+'</span></a>';
      }).join('');
      var ship=o.shipping&&o.shipping.name?'<div class="co-row"><span>Доставка</span><b>'+eh(o.shipping.name)+'</b></div>':'';
      return '<article class="co"><button class="co-head" type="button" data-cab="ord" aria-expanded="false"><span class="co-th">'+th+'</span><span class="co-main"><b>Заказ №&nbsp;'+eh(o.formsref)+'</b><small>'+dt(o.created)+' · '+o.products_count+'&nbsp;'+plr(o.products_count,['товар','товара','товаров'])+'</small></span><span class="co-side"><span class="st st-'+s[1]+'">'+eh(s[0])+'</span><b>'+rub(o.amount_total)+'</b></span><span class="co-chev">'+IC_CH+'</span></button><div class="co-body"><div class="co-in">'+list+ship+'<div class="co-row co-sum"><span>Итого</span><b>'+rub(o.amount_total)+'</b></div></div></div></article>';
    }
    function cabBody(){
      var t=cs.tab;
      if(t==='orders'){
        if(cs.err)return '<div class="cab-empty"><b>Не удалось загрузить заказы</b><span>Обновите страницу или откройте их на отдельной странице.</span><a class="btn btn-line" href="/members/orderlist">Мои заказы</a></div>';
        if(!cs.loaded)return '<div class="cab-load"><i></i></div>';
        if(!cs.orders.length)return '<div class="cab-empty"><b>Заказов пока нет</b><span>Выберите открытки в каталоге, и заказ появится здесь.</span><a class="btn btn-ink" href="/store">В каталог</a></div>';
        return cs.orders.map(orderHtml).join('')+(cs.orders.length<cs.total?'<button class="btn btn-line cab-more" type="button" data-cab="more">'+(cs.busy?'Загружаем…':'Показать ещё')+'</button>':'');
      }
      if(t==='bought'){
        var L=(cs.dash&&cs.dash.last_purchases)||[];
        if(!cs.loaded)return '<div class="cab-load"><i></i></div>';
        if(!L.length)return '<div class="cab-empty"><b>Покупок пока нет</b><span>Здесь появятся товары из ваших заказов.</span><a class="btn btn-ink" href="/store">В каталог</a></div>';
        return '<div class="cab-grid">'+L.map(function(p){return '<a class="cb" href="'+eh(pUrl(p.url))+'"><span class="cb-im"><img src="'+eh(p.image)+'" alt="" loading="lazy"></span><b>'+eh(dec(p.title))+'</b></a>'}).join('')+'</div>'+(cs.dash.purchases_count>L.length?'<p class="cab-note">Показаны последние покупки. Всего: '+cs.dash.purchases_count+'.</p>':'');
      }
      var p=prof(),phone=p.phone?String(p.phone).replace(/^\+?7(\d{3})(\d{3})(\d{2})(\d{2})$/,'+7 ($1) $2-$3-$4'):'';
      return '<dl class="cab-dl"><dt>Имя</dt><dd>'+eh(dec(p.name||'—'))+'</dd><dt>Эл. почта</dt><dd>'+eh(p.login||'—')+'</dd><dt>Телефон</dt><dd>'+eh(phone||'—')+'</dd></dl>'
        +'<div class="cab-links"><a class="btn btn-line" href="/members/profile">Редактировать профиль</a><a class="btn btn-line" href="/members/addresses">Мои адреса</a><button class="btn btn-ink" type="button" data-cab="out">Выйти из профиля</button></div>';
    }
    function cabRender(){
      if(!cab)return;
      var sc=cab.querySelector('.cab-body'),pos=sc?sc.scrollTop:0;
      cab.querySelector('.cab-box').innerHTML=cabHead()+'<div class="cab-body" role="tabpanel">'+cabBody()+'</div>';
      cab.querySelectorAll('[data-cab="tab"]').forEach(function(b){b.setAttribute('aria-selected',String(b.dataset.t===cs.tab))});
      var nb=cab.querySelector('.cab-body');if(nb)nb.scrollTop=pos;
    }
    function cabLoad(more){
      if(cs.busy)return;
      if(!api()){var tries=cabLoad.t=(cabLoad.t||0)+1;if(tries<40){setTimeout(function(){cabLoad(more)},150)}else{cs.err=true;cs.loaded=true;cabRender()}return}
      cs.busy=true;if(more)cabRender();
      var jobs=[window.tmst__fetchData('getorderslist',{body:{slice:more?cs.next:1,size:10}})];
      if(!cs.dash)jobs.push(window.tmst__fetchData('getdashboard'));
      Promise.all(jobs).then(function(r){
        var o=r[0]||{};cs.orders=more?cs.orders.concat(o.orders||[]):(o.orders||[]);cs.total=o.total||cs.orders.length;cs.next=o.nextslice||cs.next+1;
        if(r[1])cs.dash=r[1];cs.loaded=true;cs.err=false;cs.busy=false;cabRender();
      }).catch(function(){cs.busy=false;cs.loaded=true;cs.err=!cs.orders.length;cabRender()});
    }
    function cabOpen(){
      if(!cab){
        cab=document.createElement('div');cab.className='cab';cab.setAttribute('role','dialog');cab.setAttribute('aria-modal','true');cab.setAttribute('aria-label','Личный кабинет');cab.hidden=true;
        cab.innerHTML='<div class="cab-box"></div>';(document.querySelector('.site')||document.body).appendChild(cab);
        cab.addEventListener('click',function(e){
          if(e.target===cab){cabClose();return}
          var a=e.target.closest('[data-cab]');if(!a)return;
          switch(a.dataset.cab){
            case 'x':cabClose();break;
            case 'tab':cs.tab=a.dataset.t;cabRender();break;
            case 'ord':{var art=a.closest('.co'),on=!art.classList.contains('open');art.classList.toggle('open',on);a.setAttribute('aria-expanded',String(on));break}
            case 'more':cabLoad(true);break;
            case 'out':{
              var fin=false,after=function(){if(fin)return;fin=true;location.reload()};
              document.addEventListener('membersLogout',after,{once:true});
              if(typeof window.tma__userbar__sendLogout==='function'){try{window.tma__userbar__sendLogout();setTimeout(after,2500);a.disabled=true;a.textContent='Выходим…';break}catch(x){}}
              location.href='/members/login?exit=y';break;
            }
          }
        });
        document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!cab.hidden)cabClose()});
      }
      cab.hidden=false;document.documentElement.style.overflow='hidden';cabRender();
      requestAnimationFrame(function(){requestAnimationFrame(function(){cab.classList.add('on')})});
      if(!cs.loaded&&!cs.busy)cabLoad(false);
      setTimeout(function(){var x=cab.querySelector('.cab-x');x&&x.focus({preventScroll:true})},60);
    }
    function cabClose(){
      cab.classList.remove('on');document.documentElement.style.overflow='';
      setTimeout(function(){if(!cab.classList.contains('on'))cab.hidden=true},reduce?0:350);
      if(accBtn)try{accBtn.focus({preventScroll:true})}catch(e){}
    }
    // вошёл: иконка (и пункт мобильного меню) открывают наше окно, а не штатное меню Тильды
    if(signed){
      document.querySelectorAll('.acc-link').forEach(function(a){a.textContent='Личный кабинет'});
      document.addEventListener('click',function(e){
        var a=e.target.closest&&e.target.closest('#accBtn,.acc-link');if(!a)return;
        e.preventDefault();e.stopImmediatePropagation();cabOpen();
      },true);
    }

    var site=document.querySelector('.site'),CSS_URL='https://mattshaddd.github.io/MiravenWebSite/members.css';
    function vars(){
      var cs=getComputedStyle(site),g=function(n){return cs.getPropertyValue(n).trim()};
      return ':root{--m-bg:'+g('--white')+';--m-mist:'+g('--mist')+';--m-stone:'+g('--stone')+';--m-ink:'+g('--ink')+';--m-head:'+g('--head')+';--m-muted:'+g('--muted')+';--m-gold:'+g('--gold')+';--m-gold-text:'+g('--gold-text')+'}'
        +'html,body{background:transparent!important}.tlk-bg-filter,.tlk-bg-filter__bg{display:none!important}';
    }
    function skin(f){
      var d;try{d=f.contentDocument;if(!d||!d.head||!d.body||!d.body.firstChild)return false}catch(e){return false}
      var s=d.getElementById('miraven-skin');
      if(!s){
        var l=d.createElement('link');l.rel='stylesheet';l.href=CSS_URL+'?v='+Math.floor(Date.now()/60000);d.head.appendChild(l);
        s=d.createElement('style');s.id='miraven-skin';d.head.appendChild(s);
      }
      var v=vars();if(s.textContent!==v)s.textContent=v; // цвета всегда как у текущей темы сайта
      return true;
    }
    function watch(f){
      if(f.__mv)return;f.__mv=1;
      f.addEventListener('load',function(){skin(f)});
      var n=0,t=setInterval(function(){if(skin(f)||++n>40)clearInterval(t)},100);
    }
    function scan(){document.querySelectorAll('iframe.tlk-authModal-content').forEach(function(f){watch(f);skin(f)})}
    new MutationObserver(scan).observe(site,{attributes:true,attributeFilter:['data-theme']});
    new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});scan();
  })();
  // МОДАЛЬНЫЕ ШТОРКИ (модуль MV.sheet)
  // Использование: var s=MV.sheet({title:'Заголовок', body:'<p>html</p>'|Node, footer:Node|'html', className:'my', onOpen:fn, onClose:fn});
  //   s.open(); s.close(); s.setTitle(t); s.setBody(x); s.setFooter(x); s.isOpen; s.el; s.body (контейнер содержимого)
  // На телефоне (до 980px) выезжает снизу, на широких экранах это центрированное окно. Esc, клик по подложке и крестик закрывают.
  (function(){
    var MV=window.MV=window.MV||{},stack=[],locks=0;
    var X='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    function put(box,x){if(x==null)return;box.innerHTML='';if(typeof x==='string')box.innerHTML=x;else box.appendChild(x)}
    MV.sheet=function(o){
      o=o||{};
      var el=document.createElement('div');el.className='sh'+(o.className?' '+o.className:'');el.hidden=true;
      el.innerHTML='<div class="sh-box" role="dialog" aria-modal="true"><i class="sh-grab"></i><div class="sh-head"><b class="sh-title"></b><button type="button" class="sh-x" aria-label="Закрыть">'+X+'</button></div><div class="sh-body"></div><div class="sh-foot" hidden></div></div>';
      (document.querySelector('.site')||document.body).appendChild(el);
      var box=el.querySelector('.sh-box'),body=el.querySelector('.sh-body'),foot=el.querySelector('.sh-foot'),title=el.querySelector('.sh-title'),from=null;
      var api={el:el,body:body,foot:foot,isOpen:false};
      api.setTitle=function(t){title.textContent=t||'';box.setAttribute('aria-label',t||'')};
      api.setBody=function(x){put(body,x)};
      api.setFooter=function(x){foot.hidden=x==null;put(foot,x)};
      api.open=function(){
        if(api.isOpen)return;api.isOpen=true;from=document.activeElement;
        el.hidden=false;stack.push(api);
        if(!locks++)document.documentElement.style.overflow='hidden';
        requestAnimationFrame(function(){requestAnimationFrame(function(){el.classList.add('on')})});
        setTimeout(function(){var f=box.querySelector('.sh-x');f&&f.focus({preventScroll:true})},60);
        if(o.onOpen)o.onOpen(api);
      };
      api.close=function(){
        if(!api.isOpen)return;api.isOpen=false;el.classList.remove('on');
        var i=stack.indexOf(api);if(i>-1)stack.splice(i,1);
        if(!--locks)document.documentElement.style.overflow='';
        setTimeout(function(){if(!api.isOpen)el.hidden=true},rm?0:420);
        if(from&&from.focus)try{from.focus({preventScroll:true})}catch(e){}
        if(o.onClose)o.onClose(api);
      };
      el.addEventListener('click',function(e){if(e.target===el||e.target.closest('.sh-x'))api.close()});
      api.setTitle(o.title);api.setBody(o.body);api.setFooter(o.footer);
      return api;
    };
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&stack.length){stack[stack.length-1].close()}});
  })();
  // КОНЕЦ ШТОРОК
  // КОРЗИНА В ШТОРКЕ
  // «Ваш заказ» открывается в нашей шторке (MV.sheet), а не отдельным окном Тильды: содержимое корзины (список, доставка, поля, оплата)
  // переносится в шторку, вся логика остаётся штатной. Поддерживаются оба режима блока: всплывающее окно и полноэкранная страница.
  (function(){
    var sh=null,content=null,home=null,empty=null,obs=null,pobs=null,cur=null;
    var MODES={
      page:{win:'.t706__cartpage',content:'.t706__cartpage-content',shown:'t706__cartpage_showed',products:'.t706__cartpage-products',close:'tcart__closeCartFullscreen'},
      win:{win:'.t706__cartwin',content:'.t706__cartwin-content',shown:'t706__cartwin_showed',products:'.t706__cartwin-products',close:'tcart__closeCart'}
    };
    function mode(){return window.tcart_fullscreen&&document.querySelector(MODES.page.win)?MODES.page:MODES.win}
    function isEmpty(){var t=window.tcart;return !(t&&t.products&&t.products.length)}
    function restore(){
      if(content&&home){home.appendChild(content)}
      if(obs){obs.disconnect();obs=null}
      if(pobs){pobs.disconnect();pobs=null}
      document.documentElement.classList.remove('mv-cartsheet');
    }
    function build(){
      if(sh||!window.MV||!MV.sheet)return !!sh;
      sh=MV.sheet({title:'Ваш заказ',className:'sh-cart',
        onClose:function(){
          var m=cur||mode(),w=document.querySelector(m.win),fn=window[m.close];
          if(w&&w.classList.contains(m.shown)&&typeof fn==='function'){try{fn()}catch(e){}}
          restore();
        }});
      empty=document.createElement('div');empty.className='cart-empty';
      empty.innerHTML='<b>Корзина пуста</b><span>Добавьте открытки из каталога, и они появятся здесь.</span><a class="btn btn-ink" href="/store">В каталог</a>';
      return true;
    }
    function show(){
      var m=mode(),w=document.querySelector(m.win);content=w&&w.querySelector(m.content);
      if(!content||!build())return;
      cur=m;home=content.parentNode;
      document.documentElement.classList.add('mv-cartsheet');
      sh.el.classList.toggle('sh-cart-page',m===MODES.page);
      sh.body.innerHTML='';sh.body.appendChild(empty);sh.body.appendChild(content);
      sh.el.classList.toggle('is-empty',isEmpty());
      if(!sh.isOpen)sh.open();
      // если Тильда сама закрыла корзину (например, после оформления), закрываем и шторку
      if(obs)obs.disconnect();
      obs=new MutationObserver(function(){if(!w.classList.contains(m.shown)&&sh.isOpen)sh.close()});
      obs.observe(w,{attributes:true,attributeFilter:['class']});
      // состав корзины меняется внутри: следим за пустотой
      var pr=content.querySelector(m.products);
      if(pobs)pobs.disconnect();
      if(pr){pobs=new MutationObserver(function(){sh.el.classList.toggle('is-empty',isEmpty())});pobs.observe(pr,{childList:true})}
    }
    function hook(){
      if(typeof window.tcart__openCart!=='function'||window.tcart__openCart.__mv)return false;
      var o=window.tcart__openCart,f=window.tcart__openCartFullscreen;
      if(typeof f==='function'&&!f.__mv){
        window.tcart__openCartFullscreen=function(){var r=f.apply(this,arguments);setTimeout(show,30);return r};
        window.tcart__openCartFullscreen.__mv=1;
      }
      window.tcart__openCart=function(){
        if(window.tcart_fullscreen&&typeof window.tcart__openCartFullscreen==='function'&&document.querySelector(MODES.page.win)){return window.tcart__openCartFullscreen()} // сразу страница заказа, без боковой панели
        var r=o.apply(this,arguments);setTimeout(show,30);return r;
      };
      window.tcart__openCart.__mv=1;return true;
    }
    if(!hook()){var n=0,t=setInterval(function(){if(hook()||++n>80)clearInterval(t)},150)}
    window.addEventListener('load',function(){hook();setTimeout(hook,800)});
  })();
  // КОНЕЦ КОРЗИНЫ В ШТОРКЕ
  // ПЛАВАЮЩАЯ КОРЗИНА (телефон)
  (function(){
    var site=document.querySelector('.site');if(!site)return;
    var fab=document.createElement('button');fab.type='button';fab.className='fab';fab.setAttribute('aria-label','Открыть корзину');
    fab.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1.2 11.2a1 1 0 0 1-.8.8H7.200a1 1 0 0 1-.8-.8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg><span class="fab-sum"></span><i class="fab-n"></i>';
    site.appendChild(fab);
    var sf=document.createElement('button');sf.type='button';sf.className='sfab';sf.setAttribute('aria-label','Поиск');
    sf.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg><span>Поиск</span>';
    site.appendChild(sf);
    sf.addEventListener('click',function(){var b=document.getElementById('searchBtn');if(b)b.click()});
    var last='';
    function read(){var n=0,s=0;try{var t=window.tcart;if(!(t&&t.products)){t=JSON.parse(localStorage.getItem('tcart')||'{}')}n=+t.total||0;s=+t.prodamount||+t.amount||0}catch(e){}return{n:n,s:s}}
    function paint(){
      var d=read(),key=d.n+'|'+d.s;
      fab.classList.toggle('on',d.n>0);
      sf.classList.toggle('left',d.n>0); // есть товары: поиск уезжает влево, справа корзина
      if(key===last)return;
      var first=last==='';last=key;
      fab.querySelector('.fab-sum').textContent=Math.round(d.s).toLocaleString('ru-RU').replace(/ /g,' ')+' ₽';
      fab.querySelector('.fab-n').textContent=d.n;
      if(!first){fab.classList.remove('bump');void fab.offsetWidth;fab.classList.add('bump')}
    }
    fab.addEventListener('click',function(){if(window.tcart__openCart)tcart__openCart();else{var i=document.querySelector('.t706__carticon');i&&i.click()}});
    paint();setInterval(paint,700);
  })();
  // КОНЕЦ ПЛАВАЮЩЕЙ КОРЗИНЫ

    var site=document.querySelector('.site'),tbtn=document.getElementById('themeBtn');
  var mq=window.matchMedia?matchMedia('(prefers-color-scheme: dark)'):null,saved=null;
  try{saved=localStorage.getItem('miraven-theme')}catch(e){}
  var h=(location.hash||'').slice(1);if(h==='dark'||h==='beige')saved=h;
  function apply(t,anim){
    if(anim){site.classList.add('pal-anim');clearTimeout(apply.t);apply.t=setTimeout(function(){site.classList.remove('pal-anim')},600)}
    if(t==='dark')site.setAttribute('data-theme','dark');else site.removeAttribute('data-theme');
    document.documentElement.setAttribute('data-mv-theme',t==='dark'?'dark':'beige');
    tbtn.setAttribute('aria-pressed',String(t==='dark'));
    tbtn.setAttribute('aria-label',t==='dark'?'Светлая тема':'Тёмная тема');
    var bg=getComputedStyle(site).backgroundColor;document.body.style.background=bg;document.documentElement.style.background=bg;
  }
  function current(){return saved||(mq&&mq.matches?'dark':'beige')}
  apply(current(),false);
  if(mq){var onmq=function(){if(!saved)apply(current(),true)};mq.addEventListener?mq.addEventListener('change',onmq):mq.addListener(onmq)}
  tbtn.addEventListener('click',function(){
    saved=site.getAttribute('data-theme')==='dark'?'beige':'dark';
    try{localStorage.setItem('miraven-theme',saved)}catch(e){}
    apply(saved,true);
  });


  if(window.matchMedia('(max-width:760px)').matches)$('q').placeholder='Поиск';

  /* ---------- запуск ---------- */
  function skeleton(){var h='';for(var i=0;i<8;i++)h+='<div class="pc sk" style="--i:'+i+'"><div class="pc-ph"></div><i style="width:40%"></i><i style="width:75%"></i><i style="width:30%"></i></div>';grid.innerHTML=h}
  skeleton();
  loadAll().then(function(all){
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
