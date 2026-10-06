(function(){
  'use strict';
  if(window.MVImageViewer)return;
  if(!document.querySelector('link[data-mv-viewer-css]')){
    var css=document.createElement('link');css.rel='stylesheet';css.href='https://mattshaddd.github.io/MiravenWebSite/image-viewer.css?v=shared-2';css.setAttribute('data-mv-viewer-css','');document.head.appendChild(css);
  }
  var root,track,count,prev,next,closeBtn,items=[],index=0,from=null,onChange=null,oldOverflow='',oldInert=false,site=null;
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var X='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var LEFT='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  var RIGHT='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function normalise(list){return(list||[]).map(function(x){return typeof x==='string'?{src:x,full:x,alt:''}:{src:x.src||'',full:x.full||x.src||'',alt:x.alt||''}}).filter(function(x){return x.src})}
  function current(){return Math.max(0,Math.min(items.length-1,Math.round(track.scrollLeft/(track.clientWidth||1))))}
  function paint(){index=current();count.textContent=items.length>1?(index+1)+' / '+items.length:'';prev.disabled=index===0;next.disabled=index===items.length-1;if(onChange)onChange(index)}
  function go(to,animate){index=Math.max(0,Math.min(items.length-1,to));track.scrollTo({left:index*track.clientWidth,behavior:animate&&!reduce?'smooth':'auto'});if(!animate||reduce)paint()}
  function make(){
    site=document.querySelector('.site');
    root=document.createElement('div');root.className='mv-viewer';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Просмотр фотографий');
    root.innerHTML='<div class="mv-viewer__track"></div><div class="mv-viewer__count" aria-live="polite"></div><button class="mv-viewer__close" type="button" aria-label="Закрыть просмотр">'+X+'</button><button class="mv-viewer__arrow mv-viewer__arrow--prev" type="button" aria-label="Предыдущая фотография">'+LEFT+'</button><button class="mv-viewer__arrow mv-viewer__arrow--next" type="button" aria-label="Следующая фотография">'+RIGHT+'</button>';
    document.body.appendChild(root);track=root.querySelector('.mv-viewer__track');count=root.querySelector('.mv-viewer__count');prev=root.querySelector('.mv-viewer__arrow--prev');next=root.querySelector('.mv-viewer__arrow--next');closeBtn=root.querySelector('.mv-viewer__close');
    closeBtn.addEventListener('click',shut);prev.addEventListener('click',function(){go(index-1,true)});next.addEventListener('click',function(){go(index+1,true)});
    var touchX=0,touchY=0;
    track.addEventListener('touchstart',function(e){var t=e.touches&&e.touches[0];if(t){touchX=t.clientX;touchY=t.clientY}},{passive:true});
    track.addEventListener('touchend',function(e){var t=e.changedTouches&&e.changedTouches[0];if(!t)return;var dx=t.clientX-touchX,dy=t.clientY-touchY;if(dy>84&&Math.abs(dy)>Math.abs(dx)*1.2){e.preventDefault();shut()}},{passive:false});
    track.addEventListener('scroll',function(){cancelAnimationFrame(root._sf);root._sf=requestAnimationFrame(paint)},{passive:true});
    root.addEventListener('click',function(e){if(e.target===root||e.target===track||e.target.classList.contains('mv-viewer__slide'))shut()});
    document.addEventListener('keydown',function(e){
      if(root.hidden)return;
      if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();shut()}else if(e.key==='ArrowLeft'){e.preventDefault();go(index-1,true)}else if(e.key==='ArrowRight'){e.preventDefault();go(index+1,true)}else if(e.key==='Tab'){
        var b=[].slice.call(root.querySelectorAll('button:not(:disabled)')).filter(function(x){return x.offsetParent!==null}),a=b[0],z=b[b.length-1];if(e.shiftKey&&document.activeElement===a){z.focus();e.preventDefault()}else if(!e.shiftKey&&document.activeElement===z){a.focus();e.preventDefault()}
      }
    },true);
  }
  function open(o){
    site=document.querySelector('.site');
    o=o||{};if(!root)make();items=normalise(o.items||o.images);if(!items.length)return;index=Math.max(0,Math.min(items.length-1,o.index||0));from=o.from||document.activeElement;onChange=typeof o.onChange==='function'?o.onChange:null;
    track.innerHTML=items.map(function(x){return'<div class="mv-viewer__slide"><img src="'+esc(x.src)+'" data-full="'+esc(x.full)+'" alt="'+esc(x.alt)+'" draggable="false"></div>'}).join('');
    track.querySelectorAll('img').forEach(function(img){img.addEventListener('error',function(){if(img.dataset.full&&img.src!==img.dataset.full)img.src=img.dataset.full},{once:true})});
    root.classList.toggle('mv-viewer--single',items.length<2);if(!root.classList.contains('mv-viewer--open')){oldOverflow=document.documentElement.style.overflow;oldInert=site?site.inert:false}document.documentElement.style.overflow='hidden';if(site)site.inert=true;
    root.hidden=false;root.getBoundingClientRect();root.classList.add('mv-viewer--open');requestAnimationFrame(function(){go(index,false)});closeBtn.focus({preventScroll:true});
  }
  function shut(){if(!root||root.hidden)return;root.classList.remove('mv-viewer--open');document.documentElement.style.overflow=oldOverflow;if(site)site.inert=oldInert;var restore=from;setTimeout(function(){if(!root.classList.contains('mv-viewer--open')){root.hidden=true;track.innerHTML=''}},reduce?0:220);if(restore&&restore.focus)try{restore.focus({preventScroll:true})}catch(e){}}
  window.MVImageViewer={open:open,close:shut};
})();

(function(){
  'use strict';
  /* Автоматически собирается из catalog.src.js скриптом build.py (python build.py). Вручную не править. */
  window.MV=window.MV||{};
  // разметка шторки и подсказки (в каталоге она лежит в самой странице)
  (function(){
    var host=document.querySelector('.site')||document.body;
    if(!document.getElementById('qv')){var q=document.createElement('div');q.className='qv';q.id='qv';q.hidden=true;q.setAttribute('role','dialog');q.setAttribute('aria-modal','true');q.setAttribute('aria-label','Просмотр товара');q.tabIndex=-1;host.appendChild(q)}
    if(!document.getElementById('toast')){var t=document.createElement('div');t.className='toast';t.id='toast';t.setAttribute('role','status');t.setAttribute('aria-live','polite');host.appendChild(t)}
  })();
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


  /* ---------- склейка с главной страницей ---------- */
  API.rec='1278451251'; // блок магазина на главной
  var curList=[];
  function paintCards(){MVProductCard.refresh()}
  function updBadge(){}
  var cartEl=$('cart');
  function bump(){if(!cartEl)return;cartEl.classList.remove('bump');void cartEl.offsetWidth;cartEl.classList.add('bump')}
  function openCart(){if(window.tcart__openCart)tcart__openCart();else if(document.querySelector('.t706__carticon'))document.querySelector('.t706__carticon').click()}
  function partName(it){return (it.ids[0]&&parts[it.ids[0]])||''}
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
        '<span class="qv-pos">'+(idx>-1?(idx+1)+' / '+curList.length:'')+'</span>'+
        '<button class="qv-btn" type="button" data-qv="pp" aria-label="Предыдущий товар" title="Предыдущий товар (Shift+←)"'+(idx<1?' disabled':'')+'>'+CHEV_L+'</button>'+
        '<button class="qv-btn" type="button" data-qv="pn" aria-label="Следующий товар" title="Следующий товар (Shift+→)"'+(idx<0||idx>=curList.length-1?' disabled':'')+'>'+CHEV_R+'</button>'+
        '<button class="qv-btn" type="button" data-qv="share" aria-label="Поделиться" title="Скопировать ссылку">'+SHARE+'</button>'+
        '<button class="qv-btn" type="button" data-qv="x" aria-label="Закрыть" title="Закрыть (Esc)">'+X+'</button></div>'+
      '<div class="qv-gal"><div class="qv-stage"><div class="qv-slides" id="qvSlides">'+urls.map(function(u,k){return '<div class="qv-slide"><img src="'+esc(thumb(u,1100))+'" data-full="'+esc(u)+'" alt="'+esc(it.title)+(urls.length>1?', фото '+(k+1):'')+'" draggable="false"'+(k?' loading="lazy"':'')+' onerror="if(this.dataset.full&&this.src!==this.dataset.full)this.src=this.dataset.full"></div>'}).join('')+'</div>'+
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
        '<div class="qv-buy" id="qvBuy"></div>'+
        '<button class="qv-gocart" type="button" data-qv="cart" id="qvGo" hidden>Товар в корзине. Открыть корзину →</button>'+
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
    var go=$('qvGo');if(go)go.hidden=!q;
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


  var loading=null;
  function ready(){
    if(loading)return loading;
    loading=loadAll().then(function(all){
      items=all.map(norm);items.forEach(function(i){byUid[i.uid]=i});curList=items.slice();
    }).catch(function(e){loading=null;throw e});
    return loading;
  }
  MV.qvReady=ready;
  MV.qvOpen=function(uid){return ready().then(function(){if(!byUid[uid])throw new Error('нет товара');openQV(String(uid))})};
  ready().catch(function(){});
})();
