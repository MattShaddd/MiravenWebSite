/* Начало ранней темы. Выполняется до загрузки модулей и инициализации страницы. */
(function(){
  var saved=null;try{saved=localStorage.getItem('miraven-theme')}catch(e){}
  var hash=(location.hash||'').slice(1);if(hash==='dark'||hash==='beige')saved=hash;
  if(saved!=='dark'&&saved!=='beige')saved=null;
  var theme=saved||(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'beige');
  document.documentElement.setAttribute('data-mv-theme',theme);
  document.querySelectorAll('.site').forEach(function(site){site.setAttribute('data-theme',theme)});
})();

/* Начало общего закрепления шапки iOS. */
(function(){
  if(window.MVViewportHeader)return;
  var current=null;
  window.MVViewportHeader={mount:function(top,keepFlow){
    if(current)current();if(!top)return;
    var ios=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    if(!ios)return;
    var mq=window.matchMedia('(max-width:760px)'),vp=window.visualViewport,frame=0,spacer=null,ro=null,reserved=0;
    function sync(){
      frame=0;if(!top.isConnected){destroy();return}
      var active=mq.matches;
      top.classList.toggle('mv-viewport-header',active);
      document.documentElement.classList.toggle('mv-ios-catalog',active&&keepFlow);
      var offset=active&&vp&&Math.abs(vp.scale-1)<.01?Math.max(0,vp.offsetTop):0;
      top.style.setProperty('--mv-vtop',offset+'px');
      if(active&&keepFlow){
        if(!spacer){spacer=document.createElement('div');spacer.className='mv-header-space';spacer.setAttribute('aria-hidden','true');top.parentNode.insertBefore(spacer,top)}
        reserved=Math.max(reserved,top.getBoundingClientRect().height);spacer.style.height=reserved+'px';
      }else if(spacer){spacer.remove();spacer=null;reserved=0}
      if(keepFlow)document.documentElement.style.setProperty('--hdr',top.getBoundingClientRect().bottom+'px');
    }
    function schedule(){if(!frame)frame=requestAnimationFrame(sync)}
    function destroy(){
      if(frame)cancelAnimationFrame(frame);frame=0;
      window.removeEventListener('resize',schedule);window.removeEventListener('pageshow',schedule);
      if(vp){vp.removeEventListener('resize',schedule);vp.removeEventListener('scroll',schedule)}
      if(ro)ro.disconnect();if(spacer)spacer.remove();
      top.classList.remove('mv-viewport-header');top.style.removeProperty('--mv-vtop');
      document.documentElement.classList.remove('mv-ios-catalog');
      if(current===destroy)current=null;
    }
    current=destroy;
    window.addEventListener('resize',schedule,{passive:true});window.addEventListener('pageshow',schedule);
    if(vp){vp.addEventListener('resize',schedule,{passive:true});vp.addEventListener('scroll',schedule,{passive:true})}
    if(window.ResizeObserver){ro=new ResizeObserver(schedule);ro.observe(top,{box:'border-box'})}
    sync();
  }};
})();

(function(){
  'use strict';
  if(window.MVProductCard&&window.MVProductCard.version===4)return;
  var css=document.querySelector('link[data-mv-product-card-css]');
  if(!css){css=document.createElement('link');css.rel='stylesheet';css.setAttribute('data-mv-product-card-css','');document.head.appendChild(css)}
  css.href='https://mattshaddd.github.io/MiravenWebSite/product-card.css?v=3';

  var STEPPER='<button type="button" data-s="m" aria-label="Убрать одну штуку">−</button><b></b><button type="button" data-s="p" aria-label="Добавить ещё одну штуку">+</button>';
  var watchers=[];
  function watch(root,update){watchers.push({root:root,update:update})}
  function refresh(){watchers=watchers.filter(function(w){return w.root.isConnected});watchers.forEach(function(w){w.update()});if(window.MVFloatingCart)window.MVFloatingCart.refresh()}
  var notice,noticeTimer;
  function notify(text){
    if(!notice){notice=document.createElement('div');notice.className='mv-cart-notice';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');document.body.appendChild(notice)}
    notice.textContent=text;notice.classList.add('on');clearTimeout(noticeTimer);noticeTimer=setTimeout(function(){notice.classList.remove('on')},2800);
  }

  function products(){
    try{
      if(window.tcart&&Array.isArray(window.tcart.products))return window.tcart.products.filter(activeProduct);
      var saved=JSON.parse(localStorage.getItem('tcart')||'{}');
      return Array.isArray(saved.products)?saved.products.filter(activeProduct):[];
    }catch(e){return[]}
  }
  function activeProduct(p){return p&&p.deleted!=='yes'&&(parseInt(p.quantity,10)||0)>0}
  var refreshQueued=false;
  function changed(){if(refreshQueued)return;refreshQueued=true;Promise.resolve().then(function(){refreshQueued=false;refresh()})}
  // Tilda can load after us. Wrap notifications, not its quantity/remove logic.
  function hookCart(){
    ['tcart__addProduct','tcart__reDrawCartIcon','tcart__saveLocalObj','tcart__product__minus','tcart__product__plus','tcart__product__del','tcart__product__updateQuantity'].forEach(function(name){
      var original=window[name];if(typeof original!=='function'||original.__mvCardSync)return;
      var wrapped=function(){var result=original.apply(this,arguments);changed();return result};
      wrapped.__mvCardSync=true;window[name]=wrapped;
    });
  }
  function quantity(item){
    var n=0;
    products().forEach(function(p){if(String(p.lid)===String(item.uid))n+=parseInt(p.quantity,10)||0});
    return n;
  }
  function totals(){
    var n=0,s=0;products().forEach(function(p){var q=Math.max(0,parseInt(p.quantity,10)||0);n+=q;s+=(parseFloat(p.price)||0)*q});
    return{n:n,s:s};
  }
  function stock(item){
    var q=item&&item.eds&&item.eds[0]?item.eds[0].qty:item.qty;
    return q==null?99:Math.max(parseInt(q,10)||0,0);
  }
  function control(item,esc,plus){
    if(item.sold)return '';
    var q=quantity(item),title=esc(item.title),icon=plus||'';
    if(item.multi)return '<button class="add" type="button" data-uid="'+item.uid+'" data-q="'+q+'" aria-label="Выбрать вариант: '+title+'">'+icon+'<span>'+(q?'Выбрать · '+q+' в корзине':'Выбрать')+'</span></button>';
    if(q)return '<div class="add stp'+(q>=stock(item)?' lim':'')+'" data-uid="'+item.uid+'" data-q="'+q+'" role="group" aria-label="В корзине: '+title+'">'+STEPPER.replace('<b></b>','<b>'+q+'</b>')+'</div>';
    return '<button class="add" type="button" data-uid="'+item.uid+'" data-q="0" aria-label="В корзину: '+title+'">'+icon+'<span>В корзину</span></button>';
  }
  function markup(item,o){
    var rail=o.layout==='rail',esc=o.esc,cls=rail?'prod':'pc',photo=rail?'photo':'pc-ph',meta=rail?'meta':'pc-meta',link=rail?'plink':'pc-link';
    var href=o.href||'#p-'+item.uid,src=o.image(item.img),price=item.sold?'<span class="soldtag">Нет в наличии</span>':(item.from?'от ':'')+o.fmt(item.price)+' ₽'+(item.old>item.price&&!item.from?'<s>'+o.fmt(item.old)+' ₽</s>':'');
    var images=item.img?'<img'+(rail?' class="pimg"':'')+' loading="lazy" decoding="async" src="'+esc(src)+'" data-full="'+esc(item.img)+'" alt="'+esc(item.title)+'" onerror="if(this.dataset.full&&this.src!==this.dataset.full)this.src=this.dataset.full">':'';
    if(o.hover&&item.img2&&!item.sold)images+='<img class="alt" src="'+esc(o.image(item.img2))+'" alt="" loading="lazy" decoding="async">';
    return '<article class="'+cls+' mv-product-card'+(item.sold?(rail?' soldout':' sold'):'')+'" data-uid="'+item.uid+'" style="--i:'+Math.min(o.index||0,rail?7:11)+'"><div class="'+photo+'">'+images+'<a class="'+link+'" href="'+esc(href)+'" aria-label="'+esc(item.title)+'"></a>'+(o.badges||'')+control(item,esc,o.plus)+'</div><div class="'+meta+'"><small>'+esc(item.t||o.type||'')+'</small><h3><a href="'+esc(href)+'">'+esc(item.n||item.title)+'</a></h3></div><span class="price">'+price+'</span></article>';
  }
  function syncCart(){
    if(!window.tcart)return;
    var n=0,a=0;
    (window.tcart.products||[]).forEach(function(p){var q=parseInt(p.quantity,10)||0;n+=q;a+=(parseFloat(p.price)||0)*q});
    window.tcart.total=n;window.tcart.prodamount=a;window.tcart.amount=a;
    ['tcart__updateTotalProductsinCartObj','tcart__saveLocalObj','tcart__reDrawProducts','tcart__reDrawCartIcon','tcart__reDrawTotal'].forEach(function(fn){try{if(typeof window[fn]==='function')window[fn]()}catch(e){}});
  }
  function minus(item){
    if(!window.tcart||!Array.isArray(window.tcart.products))return false;
    var list=window.tcart.products,line=-1;
    for(var i=0;i<list.length;i++)if(String(list[i].lid)===String(item.uid)){line=i;break}
    if(line<0)return false;
    var p=list[line],q=parseInt(p.quantity,10)||1;
    if(q>1){p.quantity=q-1;p.amount=(parseFloat(p.price)||0)*p.quantity}else list.splice(line,1);
    syncCart();
    return true;
  }
  function replace(root,item,esc,plus){
    var card=root.querySelector('[data-uid="'+item.uid+'"]'),old=card&&card.querySelector('.add');
    if(!old)return;
    if(old.dataset.q===String(quantity(item)))return;
    var box=document.createElement('div');box.innerHTML=control(item,esc,plus);
    if(box.firstChild)old.replaceWith(box.firstChild);
  }
  function bind(root,options){
    root.addEventListener('click',function(e){
      if(options.before&&options.before(e)===false)return;
      var step=e.target.closest('.stp button');
      if(step&&root.contains(step)){
        e.preventDefault();
        var stepItem=options.getItem(step.closest('.stp').dataset.uid);if(!stepItem)return;
        if(step.dataset.s==='m')minus(stepItem);else options.add(stepItem,step);
        options.after(stepItem,step.dataset.s);
        return;
      }
      var button=e.target.closest('.add');
      if(button&&root.contains(button)){
        e.preventDefault();if(button.classList.contains('stp'))return;
        var item=options.getItem(button.dataset.uid);if(!item)return;
        if(item.multi)options.open(item);else options.add(item,button);
        options.after(item,'add');
        return;
      }
      var link=e.target.closest(options.link||'[data-product-link]');
      if(link&&root.contains(link)&&!(e.metaKey||e.ctrlKey||e.shiftKey||e.button)){
        e.preventDefault();var linked=options.getItem(link.closest('[data-uid]').dataset.uid);if(linked)options.open(linked);
      }
    },options.capture===true);
  }

  // Capture the button before Tilda replaces it with the quantity control.
  function feedback(from,done){
    if(navigator.vibrate)try{navigator.vibrate(8)}catch(e){}
    if(window.MVFloatingCart)window.MVFloatingCart.refresh();
    var reduced=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduced||!document.body.animate){if(done)done();return}
    requestAnimationFrame(function(){
      var floating=document.querySelector('.fab.on'),target=floating&&floating.getBoundingClientRect().width?floating:document.getElementById('cartBtn');
      if(!target||!from||!from.width||!from.height){if(done)done();return}
      var to=target.getBoundingClientRect();if(!to.width||!to.height){if(done)done();return}
      var dot=document.createElement('i');dot.className='fly';dot.style.zIndex=200;
      var x=from.left+from.width/2,y=from.top+from.height/2,dx=to.left+to.width/2-x,dy=to.top+to.height/2-y;
      dot.style.left=x+'px';dot.style.top=y+'px';document.body.appendChild(dot);
      var frames=[];for(var t=0;t<=1.0001;t+=.1){var yy=dy*t-4*100*t*(1-t);frames.push({transform:'translate('+dx*t+'px,'+yy+'px) scale('+(1-t*.55)+')',opacity:t>.9?.6:1})}
      var animation=dot.animate(frames,{duration:750,easing:'cubic-bezier(.3,.1,.3,1)'});
      animation.onfinish=function(){dot.remove();if(done)done()};animation.oncancel=function(){dot.remove()};
    });
  }
  window.MVProductCard={version:4,products:products,totals:totals,quantity:quantity,stock:stock,control:control,markup:markup,minus:minus,replace:replace,bind:bind,feedback:feedback,watch:watch,refresh:refresh,notify:notify};
  hookCart();
  if(window.MVProductCartTimer)clearInterval(window.MVProductCartTimer);
  var lastCart='';
  window.MVProductCartTimer=setInterval(function(){hookCart();var next=JSON.stringify(products());if(next!==lastCart){lastCart=next;changed()}},700);
})();

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
  /* Бесшовный переход главная → каталог. Тестовые адреса меняются здесь после запуска новой структуры URL. */
  (function(){
    if(window.MVRouter)return;
    try{history.scrollRestoration='manual'}catch(e){}
    var BASE='https://mattshaddd.github.io/MiravenWebSite/',HOME='/newmain',CATALOG='/newstore',busy=false,currentPath=routePath(location.pathname);
    function get(f){return fetch(BASE+f,{cache:'no-cache'}).then(function(r){if(!r.ok)throw Error(f);return r.text()})}
    function styles(css){var s=document.querySelector('style[data-mv-route-css]');if(!s){s=document.createElement('style');s.setAttribute('data-mv-route-css','');document.head.appendChild(s)}s.textContent=css}
    function run(code){var s=document.createElement('script');s.textContent=code;document.body.appendChild(s);s.remove()}
    function go(url,replace){if(busy)return Promise.resolve();busy=true;var root=document.getElementById('miraven-root');if(!root){busy=false;return Promise.reject()}
      var catalog=routePath(url.split('#')[0])===routePath(CATALOG);
      return Promise.all(catalog?[get('miraven.css'),get('catalog.css'),get('image-viewer.css'),get('catalog.html'),get('image-viewer.js'),get('catalog.js'),get('product-card.css')]:[get('miraven.css'),get('image-viewer.css'),get('miraven.html'),get('image-viewer.js'),get('miraven.js'),get('product-card.css')]).then(function(a){
        document.querySelectorAll('.cat-mini').forEach(function(el){el.remove()});
        var swap=function(){currentPath=routePath(url.split('#')[0]);document.documentElement.dataset.mvRoute=catalog?'catalog':'home';if(replace)history.replaceState({mvRoute:1},'',url);else history.pushState({mvRoute:1},'',url);styles((catalog?a[0]+'\n'+a[1]+'\n'+a[2]:a[0]+'\n'+a[1])+'\n'+a[a.length-1]);root.innerHTML=(catalog?a[3]:a[2]).split('{{BASE}}').join(BASE).split('{{HOME}}').join(HOME);window.scrollTo(0,0);document.documentElement.scrollTop=0;document.body.scrollTop=0;run(catalog?a[4]+'\n'+a[5]:a[3]+'\n'+a[4]);window.scrollTo(0,0);requestAnimationFrame(function(){window.scrollTo(0,0);document.documentElement.scrollTop=0;document.body.scrollTop=0});busy=false};
        if(document.startViewTransition)document.startViewTransition(swap);else swap();
      }).catch(function(){busy=false});
    }
    window.MVRouter={go:go};
    function routePath(p){return (p||'/').replace(/\/+$/,'')||'/'}
    document.addEventListener('click',function(e){if(e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button)return;var a=e.target.closest&&e.target.closest('a[href]');if(!a||a.target==='_blank'||a.hasAttribute('download'))return;var u=new URL(a.href,location.href),p=routePath(u.pathname);if(u.origin!==location.origin||(p!==routePath(CATALOG)&&p!==routePath(HOME)))return;if(p===currentPath||p===routePath(CATALOG)&&/^#p-\d+/.test(u.hash))return;e.preventDefault();e.stopImmediatePropagation();go(p+(p===routePath(CATALOG)?u.hash:''),false)},true);
    window.addEventListener('popstate',function(){var p=routePath(location.pathname);if(p===currentPath)return;if(p===routePath(CATALOG)||p===routePath(HOME))go(p+(p===routePath(CATALOG)?location.hash:''),true)});
  })();

})();
(function(){
  'use strict';
  /* Android Chrome: при открытой клавиатуре и скрытии адресной строки над клавиатурой оставалась пустая полоса. Пусть клавиатура меняет размер страницы целиком, а не только видимой области */
  try{var vm=document.querySelector('meta[name=viewport]');if(vm&&!/interactive-widget/.test(vm.content))vm.setAttribute('content',vm.content+',interactive-widget=resizes-content')}catch(e){}
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
      MV.swipeDismiss({on:el,box:box,scroller:body,handle:'.sh-head,.sh-grab',expand:true,close:api.close});
      return api;
    };
    /* закрытие жестом (телефон): шторку тянут вниз, фон гаснет вслед за пальцем, дальше она уезжает сама.
       o.on: оверлей, o.box: двигаемый элемент (или функция), o.scroller: прокручиваемый блок (тянуть можно, пока он наверху),
       o.handle: селектор зоны, откуда тянуть можно всегда, o.close: закрыть, o.enabled: можно ли сейчас */
    MV.swipeDismiss=function(o){
      var el=o.on,st=null,small=window.matchMedia&&matchMedia('(max-width:760px)');
      function get(v){return typeof v==='function'?v():v}
      function scrolledUp(t,b){
        for(var n=t;n&&n!==b.parentNode;n=n.parentNode){
          if(n.nodeType!==1)continue;
          if(n.scrollTop>1){var oy=getComputedStyle(n).overflowY;if(oy==='auto'||oy==='scroll'||n===get(o.scroller))return true}
        }
        return false;
      }
      function clear(b,keepOp){b.style.transition='';b.style.transform='';b.style.height='';b.style.maxHeight='';el.style.transition='';if(!keepOp)el.style.opacity=''}
      // окно вытянуто на весь экран (за полоску вверх): сбрасываем, когда оно закрыто любым способом
      if(o.expand&&window.MutationObserver)new MutationObserver(function(){
        var b=get(o.box);if(b&&b.classList.contains('mv-full')&&(el.hidden||getComputedStyle(el).display==='none'))b.classList.remove('mv-full');
      }).observe(el,{attributes:true,attributeFilter:['hidden','class','style']});
      function fullH(){return Math.round(window.innerHeight-10)}
      function expand(b){
        b.style.transition='height .36s cubic-bezier(.2,.8,.2,1)';b.style.maxHeight='none';b.style.height=fullH()+'px';
        setTimeout(function(){b.classList.add('mv-full');b.style.transition='';b.style.height='';b.style.maxHeight=''},380);
      }
      function collapse(b){
        var from=b.offsetHeight;b.classList.remove('mv-full');b.style.height='';b.style.maxHeight='';
        var to=b.offsetHeight;b.style.maxHeight='none';b.style.height=from+'px';void b.offsetHeight;
        b.style.transition='height .34s cubic-bezier(.2,.8,.2,1)';b.style.height=to+'px';
        setTimeout(function(){b.style.transition='';b.style.height='';b.style.maxHeight=''},360);
      }
      el.addEventListener('touchstart',function(e){
        st=null;var b=get(o.box),t=e.target;
        if(!small||!small.matches||!b||e.touches.length!==1||(o.enabled&&!o.enabled()))return;
        if(!b.contains(t)||(t.closest&&t.closest('input,select,textarea,.searchbox-list,.qv-seg,.qv-rel-track,[data-noswipe]')))return;
        var q=e.touches[0],r=b.getBoundingClientRect();
        var grab=!!o.expand&&((t.closest&&!!t.closest('.sh-grab'))||q.clientY-r.top<38);
        if(!grab&&!(o.handle&&t.closest&&t.closest(o.handle))&&scrolledUp(t,b))return;
        st={x:q.clientX,y:q.clientY,t:Date.now(),b:b,dy:0,drag:false,mode:'',grab:grab,full:b.classList.contains('mv-full'),op:el.style.opacity,h:r.height||600};
      },{passive:true});
      el.addEventListener('touchmove',function(e){
        if(!st)return;var q=e.touches[0],dx=q.clientX-st.x,dy=q.clientY-st.y;
        if(!st.drag){
          if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>8){st=null;return}
          if(dy<-8){if(st.grab&&o.expand&&!st.full){st.drag=true;st.mode='up';st.b.style.transition='none';st.b.style.maxHeight='none'}else{st=null;return}}
          else if(dy>8){st.drag=true;st.mode='down';st.b.style.transition='none';el.style.transition='none'}
          else return;
        }
        if(e.cancelable)e.preventDefault();
        if(st.mode==='up'){
          var up=Math.max(0,-dy-8),hh=Math.min(st.h+up,fullH());st.dy=-up;
          st.b.style.height=hh+'px';return;
        }
        var y=Math.max(0,dy-8);st.dy=y;
        st.b.style.transform='translateY('+y+'px)';
        el.style.opacity=String(Math.max(.25,1-y/(st.h*.9)));
      },{passive:false});
      function end(){
        if(!st)return;var s=st;st=null;if(!s.drag)return;
        var dt=Math.max(1,Date.now()-s.t),b=s.b;
        if(s.mode==='up'){
          var vu=-s.dy/dt;
          if(-s.dy>46||vu>.45)expand(b);
          else{b.style.transition='height .3s cubic-bezier(.2,.8,.2,1)';b.style.height=s.h+'px';setTimeout(function(){b.style.transition='';b.style.height='';b.style.maxHeight=''},320)}
          return;
        }
        var v=s.dy/dt,dismiss=s.dy>Math.min(140,s.h*.3)||(v>.6&&s.dy>40);
        // вытянутое на весь экран окно сначала возвращается к обычному размеру, и только сильный рывок закрывает его совсем
        if(s.full&&dismiss&&!(s.dy>s.h*.5||v>1.1)){
          b.style.transition='transform .3s cubic-bezier(.2,.9,.25,1)';el.style.transition='opacity .3s';b.style.transform='translateY(0)';el.style.opacity=s.op||'1';
          setTimeout(function(){b.style.transition='';b.style.transform='';el.style.transition='';el.style.opacity=s.op;collapse(b)},300);
          return;
        }
        if(dismiss){
          var rest=Math.max(s.h-s.dy,0),dur=Math.max(.16,Math.min(.34,rest/Math.max(v,.9)/1000+.12));
          b.style.transition='transform '+dur+'s cubic-bezier(.3,0,.8,.6)';el.style.transition='opacity '+dur+'s linear';
          b.style.transform='translateY(100%)';el.style.opacity='0';
          setTimeout(function(){
            o.close();
            setTimeout(function(){b.classList.remove('mv-full');clear(b,true);el.style.opacity=s.op},650);
          },dur*1000);
        }else{
          b.style.transition='transform .38s cubic-bezier(.2,.9,.25,1)';el.style.transition='opacity .3s';
          b.style.transform='translateY(0)';el.style.opacity=s.op||'1';
          setTimeout(function(){b.style.transition='';b.style.transform='';el.style.transition='';el.style.opacity=s.op},400);
        }
      }
      el.addEventListener('touchend',end,{passive:true});el.addEventListener('touchcancel',end,{passive:true});
    };
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&stack.length){stack[stack.length-1].close()}});
  })();

  /* Каталог Миравен. Исходник: catalog.src.js. Файл catalog.js собирается скриптом build.py (подтягивает вход и тему из miraven.js). */
  var API={part:'683137745982',rec:'1278450591'};
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
  /* кнопка покупки как у карточки в каталоге: «В корзину» → после нажатия степпер «− N +»: левая часть «−», вся остальная кнопка «+» (по одной штуке) */
  function paintAct(){
    var box=$('qvBuy');if(!box||!cur)return;
    var it=cur,ed=selEd(it),max=maxQty(ed),q=lineQty(it,ed,sel),sig=[it.uid,ed.uid,q,max].join('|');
    if(box.dataset.sig===sig)return;box.dataset.sig=sig;
    if(ed.qty===0)box.innerHTML='<button class="btn btn-ink qv-add" type="button" data-qv="add" disabled>Нет в наличии</button>';
    else if(q>0)box.innerHTML='<div class="qv-step" role="group" aria-label="В корзине: '+esc(it.title)+'"><button type="button" data-qv="qm" aria-label="Убрать одну штуку">−</button><button type="button" class="qv-stq" data-qv="qp" aria-label="Добавить ещё одну штуку, сейчас в корзине '+q+'"'+(q>=max?' disabled':'')+'><span><b>'+q+'</b> в корзине · '+fmt(ed.price*q)+' ₽</span><i aria-hidden="true">+</i></button></div>';
    else box.innerHTML='<button class="btn btn-ink qv-add" type="button" data-qv="add">'+PLUS+'<span>В корзину · '+fmt(ed.price)+' ₽</span></button>';
    var go=$('qvGo');if(go)go.hidden=!q;
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
  // Корзина Тильды оформляется как шторка (стили в miraven.css, тот же вид, что у MV.sheet). Содержимое остаётся внутри блока Тильды:
  // её скрипты ищут поля, доставку и оплату внутри своих контейнеров, поэтому логика остаётся штатной.
  (function(){
    function prep(){
      // режим «окно»: крестик в шапку шторки
      var top=document.querySelector('.t706__cartwin-top'),cl=document.querySelector('.t706__cartwin-close');
      if(top&&cl&&cl.parentNode!==top)top.appendChild(cl);
      // режим «страница»: оборачиваем шапку и содержимое в коробку шторки (остаются внутри .t706__cartpage)
      var pg=document.querySelector('.t706__cartpage');
      if(pg&&!pg.querySelector('.mv-cp')){
        var tp=pg.querySelector('.t706__cartpage-top'),ct=pg.querySelector('.t706__cartpage-content');
        if(tp&&ct){
          var box=document.createElement('div');box.className='mv-cp';
          var gr=document.createElement('div');gr.className='mv-grab';gr.setAttribute('aria-hidden','true');box.appendChild(gr);
          pg.insertBefore(box,tp);box.appendChild(tp);box.appendChild(ct);
          pg.addEventListener('click',function(e){if(e.target===pg){var x=pg.querySelector('.t706__cartpage-close');x&&x.click()}}); // клик по подложке закрывает
          if(window.MV&&MV.swipeDismiss)MV.swipeDismiss({on:pg,box:box,scroller:box,handle:'.t706__cartpage-top',expand:true,close:function(){var x=pg.querySelector('.t706__cartpage-close');x&&x.click()}});
        }
      }
    }
    // сразу страница заказа, без боковой панели Тильды
    function hook(){
      if(typeof window.tcart__openCart!=='function'||window.tcart__openCart.__mv)return false;
      var o=window.tcart__openCart;
      window.tcart__openCart=function(){
        if(window.tcart_fullscreen&&typeof window.tcart__openCartFullscreen==='function'&&document.querySelector('.t706__cartpage')){prep();return window.tcart__openCartFullscreen()}
        return o.apply(this,arguments);
      };
      window.tcart__openCart.__mv=1;return true;
    }
    // ---- анимации по контексту: появление кнопки промокода, ошибок, списков, полей, смена количества и суммы ----
    (function(){
      var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;if(rm)return;
      var seen=new WeakMap(),ready=false;
      var APPEAR='.t-input-group,.t-inputpromocode__btn,.t-form__errorbox-middle,.t706__auth,.t-radio__wrapper-delivery,.t-radio__wrapper-payment,#addresses-wrapper,.searchbox-list';
      function vis(e){return !!(e.offsetWidth||e.offsetHeight||(e.getClientRects&&e.getClientRects().length))}
      function play(e,c){e.classList.remove(c);void e.offsetWidth;e.classList.add(c);setTimeout(function(){e.classList.remove(c)},800)}
      function check(e){
        if(!e.matches||!e.matches(APPEAR))return;
        var v=vis(e),was=seen.get(e);seen.set(e,v);
        if(ready&&v&&was===false)play(e,e.classList.contains('t-inputpromocode__btn')?'mv-pop':'mv-in');
      }
      function bumpText(e,c){play(e,c)}
      function attach(){
        var pg=document.querySelector('.t706__cartpage');if(!pg||pg.__mvAnim)return false;pg.__mvAnim=1;
        pg.querySelectorAll(APPEAR).forEach(function(e){seen.set(e,vis(e))});
        new MutationObserver(function(ms){
          ms.forEach(function(m){
            var t=m.target;
            if(m.type==='attributes'){check(t);return}
            if(m.type==='characterData'){t=t.parentElement;if(!t)return}
            if(!ready)return;
            // текст ошибки появился
            var er=t.closest&&t.closest('.t-input-error');
            if(er&&er.textContent.trim()){play(er,'mv-shake');return}
            // количество и суммы
            var q=t.closest&&t.closest('.t706__product-quantity,.t706__cartwin-totalamount,.t706__cartwin-prodamount,.t706__cartwin-prodamount-price,.t706__cartwin-totalamount-info_value');
            if(q){play(q,'mv-bump');return}
            if(m.type==='childList'){
              m.addedNodes.forEach(function(n){
                if(n.nodeType!==1)return;
                if(n.parentElement&&n.parentElement.matches('.searchbox-list,.t-input-group,#customdelivery,#addresses-wrapper,.t-input-block')&&!n.matches('input,svg,style,script,.t706__search-icon'))play(n,'mv-in');
                n.querySelectorAll&&n.querySelectorAll(APPEAR).forEach(function(x){seen.set(x,vis(x))});
              });
            }
          });
        }).observe(pg,{attributes:true,attributeFilter:['style','class','hidden'],childList:true,subtree:true,characterData:true});
        // при открытии окна строки списка появляются по очереди
        var wasShown=false;
        new MutationObserver(function(){
          var now=pg.classList.contains('t706__cartpage_showed');
          if(now===wasShown)return; // реагируем только на открытие/закрытие, а не на свои же классы
          wasShown=now;
          if(now){pg.classList.add('mv-opening');ready=false;setTimeout(function(){ready=true},900);setTimeout(function(){pg.classList.remove('mv-opening')},1000)}
          else ready=false;
        }).observe(pg,{attributes:true,attributeFilter:['class']});
        return true;
      }
      if(!attach()){var n=0,t=setInterval(function(){if(attach()||++n>80)clearInterval(t)},200)}
    })();
    // ---- сумма рядом с кнопкой: пользователь видит, на что соглашается ----
    (function(){
      var tmr=null;
      function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
      function tick(){
        var pg=document.querySelector('.t706__cartpage');
        if(!pg||!pg.classList.contains('t706__cartpage_showed')){return}
        var sub=pg.querySelector('.t-form__submit');if(!sub)return;
        var bar=sub.querySelector('.mv-sum');
        if(!bar){bar=document.createElement('div');bar.className='mv-sum';sub.insertBefore(bar,sub.firstChild)}
        var tot=pg.querySelector('.t706__cartwin-totalamount'),cur=pg.querySelector('.t706__cartwin-prodamount-currency'),
            amount=tot?tot.textContent.replace(/\s*р\.?\s*$/i,'').trim():'';
        var chk=pg.querySelector('input[name="tildadelivery-type"]:checked'),line='';
        if(chk){var lb=chk.closest('label'),nm=lb&&lb.querySelector('.delivery-checkbox-label'),pr=lb&&lb.querySelector('.delivery-minimum-price');
          line='Доставка: '+(nm?nm.textContent.trim():'')+(pr?' · '+pr.textContent.replace(/^[\s,]+/,'').trim():'')}
        var html='<span><b>Итого</b>'+(line?'<small>'+esc(line)+'</small>':'')+'</span><b class="mv-sum-v">'+esc(amount)+' р.</b>';
        if(bar._h!==html){bar._h=html;bar.innerHTML=html}
      }
      function loop(){clearInterval(tmr);tmr=setInterval(tick,350);tick()}
      window.addEventListener('hashchange',loop);
      var n=0,t=setInterval(function(){var pg=document.querySelector('.t706__cartpage');if(pg||++n>60){clearInterval(t);if(pg)new MutationObserver(function(){if(pg.classList.contains('t706__cartpage_showed'))loop();else clearInterval(tmr)}).observe(pg,{attributes:true,attributeFilter:['class']})}},300);
    })();
    // форма заказа всегда раскрыта: в нашей шторке один столбец на любом экране (двухшаговый режим Тильды для телефона не нужен,
    // иначе при смене размера окна часть полей оставалась скрытой)
    var fobs=null;
    function showForm(){
      var pb=document.querySelector('.t706__cartpage .t-inputpromocode__btn');if(pb&&/^\s*Activate\s*$/i.test(pb.textContent))pb.textContent='Применить';
      var pg=document.querySelector('.t706__cartpage');
      if(!pg||!pg.classList.contains('t706__cartpage_showed'))return;
      var f=pg.querySelector('.t706__cartpage-form'),ow=pg.querySelector('.t706__cartpage-open-form-wrap');
      if(f&&(f.style.display==='none'||f.style.opacity==='0')){f.style.display='block';f.style.opacity='1';f.style.transform='none'}
      if(ow&&ow.style.display!=='none')ow.style.display='none';
      if(f&&!fobs&&window.MutationObserver){fobs=new MutationObserver(function(){showForm()});fobs.observe(f,{attributes:true,attributeFilter:['style']})}
    }
    window.addEventListener('resize',function(){showForm();setTimeout(showForm,300)});
    window.addEventListener('hashchange',function(){setTimeout(showForm,100)});
    var obs0=null;
    (function watch(){
      var pg=document.querySelector('.t706__cartpage');
      if(!pg){setTimeout(watch,500);return}
      new MutationObserver(function(){setTimeout(showForm,0);setTimeout(showForm,400)}).observe(pg,{attributes:true,attributeFilter:['class']});
    })();
    prep();if(!hook()){var n=0,t=setInterval(function(){prep();if(hook()||++n>80)clearInterval(t)},150)}
    window.addEventListener('load',function(){prep();hook();setTimeout(function(){prep();hook()},1200)});
  })();
  // Подтверждение заказа: Тильда подставляет сохранённые данные (адрес, ФИО, телефон) и сразу уводит на оплату.
  // Перед отправкой показываем сводку «Проверьте заказ», где можно поправить данные или подтвердить.
  (function(){
    var confirmed=false,csh=null;
    function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
    function val(f,n){var i=f.querySelector('[name="'+n+'"]');return i?String(i.value||'').trim():''}
    function complete(f){
      var ok=true,radios={};
      f.querySelectorAll('.js-tilda-rule').forEach(function(i){
        if(i.type==='radio'){radios[i.name]=radios[i.name]||i.checked;return}
        if(i.type==='checkbox'){if(!i.checked)ok=false;return}
        if(i.type==='hidden'&&!i.value)ok=false;
        else if(!String(i.value||'').trim()&&i.name!=='Промокод'&&!/comment|promo|Промокод/i.test(i.name))ok=false;
      });
      for(var k in radios)if(!radios[k])ok=false;
      return ok;
    }
    function summary(f){
      var rows=[],sel=f.querySelector('input[name="tildadelivery-type"]:checked'),dl='';
      if(sel){var lb=sel.closest('label'),t=lb&&lb.innerText.replace(/\s+/g,' ').trim();dl=t||''}
      var who=val(f,'tildadelivery-userinitials')||val(f,'Имя')||val(f,'Name');
      var addr=[val(f,'tildadelivery-city'),val(f,'tildadelivery-street'),val(f,'tildadelivery-house'),val(f,'tildadelivery-aptoffice'),val(f,'tildadelivery-pickup-name'),val(f,'tildadelivery-pickup-address')].filter(Boolean).join(', ');
      if(dl)rows.push(['Доставка',dl]);
      if(addr)rows.push(['Куда',addr]);
      if(who)rows.push(['Получатель',who]);
      var ph=val(f,'Phone')||val(f,'tildaspec-phone-part[]');if(ph)rows.push(['Телефон',ph]);
      var em=val(f,'Email');if(em)rows.push(['Эл. почта',em]);
      var cm=val(f,'tildadelivery-comment');if(cm)rows.push(['Комментарий',cm]);
      var tot=document.querySelector('.t706__cartwin-totalamount, .t706__cartpage-totals .t706__cartwin-totalamount');
      var items=(window.tcart&&window.tcart.products||[]).map(function(p){return esc(p.name)+(p.quantity>1?' × '+p.quantity:'')}).join('<br>');
      return '<dl class="cf-dl">'+rows.map(function(r){return '<dt>'+r[0]+'</dt><dd>'+esc(r[1])+'</dd>'}).join('')+(items?'<dt>Товары</dt><dd>'+items+'</dd>':'')+(tot?'<dt>Итого</dt><dd><b>'+esc(tot.innerText.trim())+' р.</b></dd>':'')+'</dl>';
    }
    function ask(btn,f){
      if(!window.MV||!MV.sheet){return false}
      if(!csh){
        csh=MV.sheet({title:'Проверьте заказ',className:'sh-confirm',
          footer:'<button type="button" class="btn btn-line" data-cf="back">Изменить</button><button type="button" class="btn btn-ink" data-cf="ok">Подтвердить</button>'});
        csh.el.addEventListener('click',function(e){
          var b=e.target.closest('[data-cf]');if(!b)return;
          if(b.dataset.cf==='back'){csh.close();return}
          if(b.dataset.cf==='ok'){csh.close();confirmed=true;setTimeout(function(){csh._btn&&csh._btn.click()},60)}
        });
      }
      csh._btn=btn;csh.setBody(summary(f));csh.open();return true;
    }
    function gate(e){
      var btn=e.target&&e.target.closest&&e.target.closest('.t706 .t-form__submit .t-submit, .t706 button[type=submit].t-submit');
      if(!btn)return;
      if(confirmed){confirmed=false;return}
      var f=btn.closest('form');if(!f||!complete(f))return; // поля не заполнены: пусть Тильда сама покажет ошибки
      if(ask(btn,f)){e.preventDefault();e.stopImmediatePropagation()}
    }
    document.addEventListener('click',gate,true);
  })();

    // ПЛАВАЮЩАЯ КОРЗИНА (телефон)
  (function(){
    var site=document.querySelector('.site');if(!site)return;
    if(window.MVFloatingCart)window.MVFloatingCart.destroy();
    var fab=document.createElement('button');fab.type='button';fab.className='fab';fab.setAttribute('aria-label','Открыть корзину');
    fab.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1.2 11.2a1 1 0 0 1-.8.8H7.200a1 1 0 0 1-.8-.8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg><span class="fab-sum"></span><i class="fab-n"></i>';
    document.body.appendChild(fab);
    var sf=document.createElement('button');sf.type='button';sf.className='sfab';sf.setAttribute('aria-label','Поиск');
    sf.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg><span>Поиск</span>';
    document.body.appendChild(sf);
    sf.addEventListener('click',function(){var b=document.getElementById('searchBtn');if(b)b.click()});
    var last='';
    function read(){return MVProductCard.totals()}
    function paint(){
      var d=read(),key=d.n+'|'+d.s;
      var badge=document.getElementById('cart');if(badge){badge.textContent=d.n;badge.style.display=d.n?'':'none'}
      fab.classList.toggle('on',d.n>0);
      sf.classList.toggle('left',d.n>0); // есть товары: поиск уезжает влево, справа корзина
      if(key===last)return;
      var first=last==='';last=key;
      fab.querySelector('.fab-sum').textContent=Math.round(d.s).toLocaleString('ru-RU').replace(/ /g,' ')+' ₽';
      fab.querySelector('.fab-n').textContent=d.n;
      if(!first){fab.classList.remove('bump');void fab.offsetWidth;fab.classList.add('bump')}
    }
    fab.addEventListener('click',function(){if(window.tcart__openCart)tcart__openCart();else{var i=document.querySelector('.t706__carticon');i&&i.click()}});
    paint();var timer=setInterval(paint,700);
    window.MVFloatingCart={refresh:paint,destroy:function(){clearInterval(timer);fab.remove();sf.remove()}};
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
    // ---- свои окна входа, регистрации и восстановления пароля (вместо страниц Тильды /members/login и /members/signup) ----
    // Говорим напрямую с API Members, как штатная форма: /api/login/, /api/getprofile/, /api/registration/, /api/recoverpassword/.
    // Капчу (регистрация, восстановление, иногда вход) показывает сама Тильда в iframe, мы только принимаем её ответ.
    var auth=(function(){
      var sh=null,busy=false,EYE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>';
      var TITLE={login:'Вход',signup:'Регистрация',recover:'Восстановление пароля'};
      function ep(alt){
        var tm=window.tildaMembers||{},b=tm.endpoint||(typeof window.tma__getMembersEndpoint==='function'?window.tma__getMembersEndpoint():'https://members.tildaapi.'+(tm.rootZone||'com'));
        return alt?b.replace('https://members.tildaapi.','https://members2.tildacdn.'):b;
      }
      function req(path,data,alt){
        var c=window.AbortController?new AbortController():null,tm=setTimeout(function(){if(c)c.abort()},30000);
        return fetch(ep(alt)+path,{method:'POST',headers:{'Content-Type':'application/json; charset=UTF-8'},body:JSON.stringify(data),signal:c?c.signal:undefined}).then(function(r){
          clearTimeout(tm);if(r.status>=500&&!alt)return req(path,data,true);return r.json();
        }).catch(function(e){clearTimeout(tm);if(!alt)return req(path,data,true);throw e});
      }
      function captcha(cb){
        var ov=document.createElement('div'),nm='mvcap'+Date.now(),lang=(window.tildaMembers&&tildaMembers.userLang)||'RU';
        ov.className='mv-cap';
        ov.innerHTML='<button type="button" class="mv-cap-x" aria-label="Закрыть">'+IC_X+'</button><iframe name="'+nm+'" title="Проверка"></iframe><form method="post" target="'+nm+'" action="'+ep()+'/api/getcaptcha/"><input type="hidden" name="lang" value="'+eh(lang)+'"><input type="hidden" name="projectid" value="'+eh(pid)+'"></form>';
        document.body.appendChild(ov);
        function end(v){window.removeEventListener('message',on);ov.remove();cb(v)}
        function on(e){
          if(!/^https:\/\/members2?\.tilda(api|cdn)\./.test(e.origin)||typeof e.data!=='string'||!e.data)return;
          try{ov.querySelector('iframe').contentWindow.postMessage('tilda-reset','*')}catch(x){}
          end(e.data);
        }
        window.addEventListener('message',on);
        ov.querySelector('.mv-cap-x').addEventListener('click',function(){end(null)});
        ov.querySelector('form').submit();
      }
      function getProfile(token){
        return req('/api/getprofile/',{projectid:pid,token:token,tzoffset:new Date().getTimezoneOffset()}).then(function(j){
          if(!j||j.status!=='ok'||typeof j.data!=='object')throw new Error('profile');
          var k='tilda_members_profile'+pid;j.data.token=token;j.data.projectid=pid;
          localStorage.setItem(k,JSON.stringify(j.data));localStorage.setItem(k+'_timestamp',Math.floor(Date.now()/1000));
        });
      }
      // сообщения об ошибках API (коды те же, что в словаре Тильды)
      function why(kind,j){
        var c=String(j&&j.code||''),m;
        if(kind==='login'){
          if(/so_quickly/.test(c))m='Слишком частые попытки входа. Подождите немного.';
          else if(/disabled|not_active/.test(c))m='Профиль заблокирован. Обратитесь к владельцу сайта.';
          else if(/blocked/.test(c))m='Вход временно закрыт из-за множества неудачных попыток. Повторите через '+(j.hours?j.hours+' ч.':(j.minutes||'несколько')+' мин.');
          else if(/wrong_auth/.test(c))m='Ошибка входа. Обновите страницу и попробуйте снова.';
          else if(c)m='Неверная почта или пароль.';
          if(m&&j&&j.attemptsleft>0)m+=' Осталось попыток: '+j.attemptsleft+'.';
        }else if(kind==='signup'){
          if(/already_exist/.test(c))m='Эта почта уже зарегистрирована. Попробуйте войти.';
          else if(/registration_off/.test(c))m='Регистрация сейчас закрыта.';
          else if(/password_short/.test(c))m='Пароль слишком короткий: минимум 5 символов.';
          else if(/password_long/.test(c))m='Пароль слишком длинный: максимум 72 символа.';
          else if(/wrong_email/.test(c))m='Проверьте адрес почты.';
          else if(/captcha/.test(c))m='Проверка не пройдена. Попробуйте ещё раз.';
          else if(/wrong_auth/.test(c))m='Ошибка. Обновите страницу и попробуйте снова.';
        }else{
          if(/empty_data/.test(c))m='Такая почта не найдена.';
          else if(/timeout/.test(c))m='Пароль уже восстанавливали меньше 5 минут назад. Попробуйте чуть позже.';
          else if(/captcha/.test(c))m='Проверка не пройдена. Попробуйте ещё раз.';
          else if(/wrong_auth/.test(c))m='Ошибка. Обновите страницу и попробуйте снова.';
        }
        return m||'Не получилось. Проверьте данные и попробуйте ещё раз.';
      }
      var NET='Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.';
      function fld(label,name,type,ph,ac){
        var pw=type==='password';
        return '<label class="au-f"><span>'+label+'</span><span class="au-in"><input class="au-i" name="'+name+'" type="'+type+'" placeholder="'+ph+'" autocomplete="'+ac+'"'+(type==='email'?' inputmode="email" autocapitalize="none" spellcheck="false"':'')+'>'+(pw?'<button type="button" class="au-eye" data-au="eye" aria-label="Показать пароль">'+EYE+'</button>':'')+'</span><em class="au-e" role="alert"></em></label>';
      }
      function lnk(a,t){return '<button type="button" data-au="'+a+'">'+t+'</button>'}
      function view(m){
        sh.setTitle(TITLE[m]);
        var h='<form class="au-form" data-m="'+m+'" novalidate>';
        if(m==='login')h+=fld('Эл. почта','login','email','Введите эл. почту','username')+fld('Пароль','password','password','Введите пароль','current-password');
        else if(m==='signup')h+=fld('Имя','name','text','Как к вам обращаться','name')+fld('Эл. почта','login','email','Введите эл. почту','username')+fld('Пароль','password','password','Придумайте пароль (от 5 символов)','new-password');
        else h+='<p class="au-lead">Укажите почту, с которой вы регистрировались. Мы отправим письмо с временным паролем.</p>'+fld('Эл. почта','login','email','Введите эл. почту','username');
        h+='<div class="au-err" role="alert"></div><button type="submit" class="btn btn-ink au-go">'+(m==='login'?'Войти':m==='signup'?'Создать профиль':'Отправить письмо')+'</button></form><div class="au-links">';
        h+=m==='login'?lnk('signup','Зарегистрироваться')+lnk('recover','Забыли пароль?'):m==='signup'?lnk('login','Уже есть профиль? Войти'):lnk('login','Вернуться ко входу');
        sh.setBody(h+'</div>');
      }
      function fail(form,msg){var e=form.querySelector('.au-err');e.textContent=msg||''}
      function bad(form,name,msg){var f=form.elements[name].closest('.au-f');f.classList.add('bad');f.querySelector('.au-e').textContent=msg}
      function lock(form,on){busy=on;var b=form.querySelector('.au-go');b.disabled=on;b.classList.toggle('load',on)}
      function check(form,m){
        var v={},ok=true,x;
        form.querySelectorAll('.au-f').forEach(function(f){f.classList.remove('bad');f.querySelector('.au-e').textContent=''});
        fail(form,'');
        for(var i=0;i<form.elements.length;i++){x=form.elements[i];if(x.name)v[x.name]=x.name==='password'?x.value:x.value.trim()}
        if('name' in v&&(v.name.length<2||v.name.length>100)){bad(form,'name',v.name.length<2?'Введите имя (от 2 символов)':'Имя слишком длинное');ok=false}
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.login)||v.login.length>150){bad(form,'login',v.login?'Проверьте адрес почты':'Введите почту');ok=false}
        if('password' in v){
          if(!v.password){bad(form,'password','Введите пароль');ok=false}
          else if(m==='signup'&&v.password.length<5){bad(form,'password','Минимум 5 символов');ok=false}
          else if(v.password.length>72){bad(form,'password','Максимум 72 символа');ok=false}
        }
        if(!ok){var f=form.querySelector('.au-f.bad input');if(f)f.focus()}
        return ok?v:null;
      }
      function finish(){
        try{if(/^#(login|signup|register)$/.test(location.hash))history.replaceState(null,'',location.pathname+location.search)}catch(e){}
        location.reload();
      }
      function login(form,v,rkey){
        var d={login:v.login,password:v.password,projectid:pid,pageurl:location.href};if(rkey)d.rkey=rkey;
        return req('/api/login/',d).then(function(j){
          if(j&&j.status==='ok'&&j.data&&typeof j.data==='object')return getProfile(j.data.token).then(finish);
          if(j&&j.code==='need_captcha')return captcha(function(k){if(!k){lock(form,false);return}login(form,v,k).catch(function(){lock(form,false);fail(form,NET)})});
          lock(form,false);fail(form,why('login',j));
        });
      }
      function submit(form){
        if(busy)return;var m=form.dataset.m,v=check(form,m);if(!v)return;
        lock(form,true);
        var bye=function(){lock(form,false);fail(form,NET)};
        if(m==='login'){login(form,v).catch(bye);return}
        captcha(function(k){
          if(!k){lock(form,false);return}
          if(m==='signup'){
            var d={name:v.name,login:v.login,password:v.password,projectid:pid,rkey:k};
            req('/api/registration/',d).then(function(j){
              if(j&&j.status==='ok'&&typeof j.data==='object')return login(form,v);
              lock(form,false);fail(form,why('signup',j));
            }).catch(bye);
          }else{
            req('/api/recoverpassword/',{login:v.login,projectid:pid,rkey:k}).then(function(j){
              lock(form,false);
              if(j&&j.status==='ok'){sh.setBody('<p class="au-ok">Мы отправили письмо с временным паролем на <b>'+eh(v.login)+'</b>. Войдите с ним, а потом смените пароль в профиле. Если письма нет, загляните в «Спам».</p><div class="au-links">'+lnk('login','Вернуться ко входу')+'</div>')}
              else fail(form,why('recover',j));
            }).catch(bye);
          }
        });
      }
      function open(m){
        if(!window.MV||!MV.sheet)return false;
        if(!sh){
          sh=MV.sheet({className:'sh-auth'});
          sh.el.addEventListener('click',function(e){
            var a=e.target.closest&&e.target.closest('[data-au]');if(!a)return;
            var t=a.dataset.au;
            if(t==='eye'){var i=a.parentNode.querySelector('input'),on=i.type==='password';i.type=on?'text':'password';a.setAttribute('aria-label',on?'Скрыть пароль':'Показать пароль');a.classList.toggle('on',on)}
            else if(!busy)view(t);
          });
          sh.el.addEventListener('submit',function(e){e.preventDefault();submit(e.target)});
        }
        view(m||'login');sh.open();
        if(window.matchMedia&&matchMedia('(hover:hover)').matches)setTimeout(function(){var i=sh.body.querySelector('input');if(i)i.focus({preventScroll:true})},140);
        return true;
      }
      return {open:open};
    })();
    window.MV=window.MV||{};MV.auth=auth;
    if(!signed){
      // иконка профиля, пункты «Войти» и любые ссылки на страницы Тильды открывают наше окно
      document.addEventListener('click',function(e){
        if(e.defaultPrevented||e.button>0||e.metaKey||e.ctrlKey||e.shiftKey||!window.MV||!MV.sheet)return;
        var a=e.target.closest&&e.target.closest('#accBtn,.acc-link,a[href="#openmembersbar"],a[href*="/members/login"],a[href*="/members/signup"]');
        if(!a)return;var h=a.getAttribute('href')||'';if(/exit=y/.test(h))return;
        e.preventDefault();e.stopImmediatePropagation();auth.open(/signup/.test(h)?'signup':'login');
      },true);
      // прямая ссылка на окно: …/newmain#login или …#signup
      var hashAuth=function(){var m=/^#(login|signup|register)$/.exec(location.hash);if(m)auth.open(m[1]==='login'?'login':'signup')};
      window.addEventListener('hashchange',hashAuth);setTimeout(hashAuth,0);
    }
    // ---- свой личный кабинет в окне (данные берём из API Тильды) ----
    var cab,cs={tab:'orders',orders:[],total:0,next:1,dash:null,busy:false,err:false,loaded:false};
    var ST={cancelled:['Отменён','bad'],canceled:['Отменён','bad'],completed:['Выполнен','ok'],done:['Выполнен','ok'],sent:['Отправлен','ok'],shipped:['Отправлен','ok'],paid:['Оплачен','ok'],processing:['В обработке','mid'],new:['Новый','mid'],pending:['Ожидает оплаты','mid']};
    function eh(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
    function dec(t){var x=document.createElement('textarea');x.innerHTML=t||'';return x.value}
    function rub(n){return Math.round(+n||0).toLocaleString('ru-RU').replace(/ /g,' ')+' ₽'}
    function dt(s){var m=/(\d{4})-(\d\d)-(\d\d)/.exec(s||'');return m?m[3]+'.'+m[2]+'.'+m[1]:''}
    function plr(n,f){var a=n%100,b=a%10;return a>10&&a<20?f[2]:b>1&&b<5?f[1]:b===1?f[0]:f[2]}
    function prof(){try{return JSON.parse(localStorage.getItem('tilda_members_profile'+pid))||{}}catch(e){return{}}}
    function pUrl(u){var m=/tproduct\/(\d+)/.exec(u||'');return m?'/newstore#p-'+m[1]:(u||'#')}
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
        if(!cs.orders.length)return '<div class="cab-empty"><b>Заказов пока нет</b><span>Выберите открытки в каталоге, и заказ появится здесь.</span><a class="btn btn-ink" href="/newstore">В каталог</a></div>';
        return cs.orders.map(orderHtml).join('')+(cs.orders.length<cs.total?'<button class="btn btn-line cab-more" type="button" data-cab="more">'+(cs.busy?'Загружаем…':'Показать ещё')+'</button>':'');
      }
      if(t==='bought'){
        var L=(cs.dash&&cs.dash.last_purchases)||[];
        if(!cs.loaded)return '<div class="cab-load"><i></i></div>';
        if(!L.length)return '<div class="cab-empty"><b>Покупок пока нет</b><span>Здесь появятся товары из ваших заказов.</span><a class="btn btn-ink" href="/newstore">В каталог</a></div>';
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
        if(window.MV&&MV.swipeDismiss)MV.swipeDismiss({on:cab,box:function(){return cab.querySelector('.cab-box')},scroller:function(){return cab.querySelector('.cab-body')},handle:'.cab-top,.cab-tabs',close:cabClose});
        cab.addEventListener('click',function(e){
          if(e.target===cab){cabClose();return}
          var a=e.target.closest('[data-cab]');if(!a)return;
          switch(a.dataset.cab){
            case 'x':cabClose();break;
            case 'tab':cs.tab=a.dataset.t;cabRender();break;
            case 'ord':{
              var art=a.closest('.co'),bd=art.querySelector('.co-body'),on=!art.classList.contains('open');
              art.classList.toggle('open',on);a.setAttribute('aria-expanded',String(on));
              if(on){bd.style.maxHeight=bd.scrollHeight+'px';clearTimeout(bd._t);bd._t=setTimeout(function(){if(art.classList.contains('open'))bd.style.maxHeight='none'},450)}
              else{bd.style.maxHeight=bd.scrollHeight+'px';void bd.offsetHeight;bd.style.maxHeight='0px';clearTimeout(bd._t)}
              break}
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
      // в окне заказа «Вы авторизованы как …» ведёт в наш кабинет, а не на стандартную страницу Тильды
      document.addEventListener('click',function(e){
        var a=e.target.closest&&e.target.closest('.t706__auth a[href*="/members"]');
        if(!a||/exit=y/.test(a.getAttribute('href')||''))return;
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
  // КОНЕЦ ШТОРОК
  // КОНЕЦ КОРЗИНЫ В ШТОРКЕ
  // КОНЕЦ ПЛАВАЮЩЕЙ КОРЗИНЫ

    var site=document.querySelector('.site'),tbtn=document.getElementById('themeBtn');
  var mq=window.matchMedia?matchMedia('(prefers-color-scheme: dark)'):null,saved=null;
  try{saved=localStorage.getItem('miraven-theme')}catch(e){}
  var h=(location.hash||'').slice(1);if(h==='dark'||h==='beige')saved=h;
  if(saved!=='dark'&&saved!=='beige')saved=null;
  function apply(t,anim){
    if(!site.isConnected)return;
    // One repaint, not colour/shadow interpolation on every node for 450 ms.
    var root=document.documentElement;root.classList.add('mv-theme-change');
    if(apply.frame)cancelAnimationFrame(apply.frame);
    site.setAttribute('data-theme',t);
    document.documentElement.setAttribute('data-mv-theme',t==='dark'?'dark':'beige');
    tbtn.setAttribute('aria-pressed',String(t==='dark'));
    tbtn.setAttribute('aria-label',t==='dark'?'Светлая тема':'Тёмная тема');
    apply.frame=requestAnimationFrame(function(){apply.frame=requestAnimationFrame(function(){root.classList.remove('mv-theme-change');apply.frame=0})});
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
