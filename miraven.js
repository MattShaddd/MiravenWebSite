/* Начало ранней темы. Выполняется до загрузки модулей и инициализации страницы. */
(function(){
  var saved=null;try{saved=localStorage.getItem('miraven-theme')}catch(e){}
  var hash=(location.hash||'').slice(1);if(hash==='dark'||hash==='beige')saved=hash;
  if(saved!=='dark'&&saved!=='beige')saved=null;
  var theme=saved||(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'beige');
  document.documentElement.setAttribute('data-mv-theme',theme);
  document.querySelectorAll('.site').forEach(function(site){site.setAttribute('data-theme',theme)});
})();
/* Конец ранней темы. */
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
/* Конец общего закрепления шапки iOS. */
(function(){
  function start(){
  /* Бесшовный переход главная → каталог. Тестовые адреса меняются здесь после запуска новой структуры URL. */
  (function(){
    if(window.MVRouter)return;
    try{history.scrollRestoration='manual'}catch(e){}
    var BASE='https://mattshaddd.github.io/MiravenWebSite/',HOME='/',CATALOG='/store',busy=false,currentPath=routePath(location.pathname);
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
  // Production Tilda loader historically fetched only miraven.js/miraven.css.
  // Keep the shared image viewer available even when its dedicated assets are omitted.
  (function(){
    var base='https://mattshaddd.github.io/MiravenWebSite/';
    if(!document.querySelector('link[data-mv-viewer-css]')){
      var link=document.createElement('link');link.rel='stylesheet';link.href=base+'image-viewer.css?v=2d7ca7a';link.setAttribute('data-mv-viewer-css','');document.head.appendChild(link);
    }
    if(!window.MVImageViewer&&!document.querySelector('script[data-mv-viewer-js]')){
      var script=document.createElement('script');script.src=base+'image-viewer.js?v=2d7ca7a';script.async=false;script.setAttribute('data-mv-viewer-js','');document.head.appendChild(script);
    }
  })();
  /* Android Chrome: при открытой клавиатуре и скрытии адресной строки над клавиатурой оставалась пустая полоса. Пусть клавиатура меняет размер страницы целиком, а не только видимой области */
  try{var vm=document.querySelector('meta[name=viewport]');if(vm&&!/interactive-widget/.test(vm.content))vm.setAttribute('content',vm.content+',interactive-widget=resizes-content')}catch(e){}
  var API={part:'683137745982',rec:'1278451251'};
  var ORDER=['Открытки','Наборы открыток','Свечи','Наклейки на карты','Разное','Новинки','Распродажа'];
  var items=[],parts={},cat='all',query='';
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var track=document.getElementById('products'),cart=document.getElementById('cart'),count=0,busy=false;
  var PLUS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',CHECK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  (function(){
    var hero=document.getElementById('hero'),cards=hero&&hero.querySelectorAll('.hero-card');
    if(!hero||!cards.length||reduce||(window.matchMedia&&matchMedia('(pointer: coarse)').matches))return;
    var px=0,py=0,active=null,raf=0;
    function draw(){
      for(var i=0;i<cards.length;i++){
        var card=cards[i],d=Number(card.getAttribute('data-depth'))||.5,r=card.getBoundingClientRect();
        var on=card===active;
        var dx=on?(px-(r.left+r.width/2))/Math.max(r.width/2,1):0;
        var dy=on?(py-(r.top+r.height/2))/Math.max(r.height/2,1):0;
        dx=Math.max(-1,Math.min(1,dx));dy=Math.max(-1,Math.min(1,dy));
        var ox=Number(card.dataset.x)||0,oy=Number(card.dataset.y)||0,orx=Number(card.dataset.rx)||0,ory=Number(card.dataset.ry)||0;
        var nx=dx*7*d,ny=dy*5*d,nrx=-dy*12*d,nry=dx*16*d;
        ox+=(nx-ox)*.1;oy+=(ny-oy)*.1;orx+=(nrx-orx)*.1;ory+=(nry-ory)*.1;
        card.dataset.x=ox;card.dataset.y=oy;card.dataset.rx=orx;card.dataset.ry=ory;
        card.style.setProperty('--mx',ox.toFixed(2)+'px');card.style.setProperty('--my',oy.toFixed(2)+'px');
        card.style.setProperty('--rx',orx.toFixed(2)+'deg');card.style.setProperty('--ry',ory.toFixed(2)+'deg');
      }
      raf=requestAnimationFrame(draw);
    }
    function move(e){
      px=e.clientX;py=e.clientY;var hit=null,best=Infinity;
      for(var i=0;i<cards.length;i++){
        var r=cards[i].getBoundingClientRect();
        if(px>=r.left&&px<=r.right&&py>=r.top&&py<=r.bottom){var q=Math.abs(px-(r.left+r.width/2))+Math.abs(py-(r.top+r.height/2));if(q<best){best=q;hit=cards[i]}}
      }
      if(active!==hit){if(active)active.classList.remove('is-hovered');active=hit;if(active)active.classList.add('is-hovered')}
      if(!raf)raf=requestAnimationFrame(draw);
    }
    function reset(){if(active)active.classList.remove('is-hovered');active=null}
    hero.addEventListener('pointermove',move,{passive:true});hero.addEventListener('pointerleave',reset,{passive:true});
  })();
  function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function thumb(u){var m=/^https?:\/\/static\.tildacdn\.com\/(.+)\/([^\/]+)$/.exec(u||'');return m?'https://thb.tildacdn.com/'+m[1]+'/-/resize/480x/'+m[2]:u}
  function fmt(n){return Math.round(n).toLocaleString('ru-RU').replace(/ /g,' ')}
  function norm(p){
    var g=[];try{g=JSON.parse(p.gallery||'[]')}catch(e){}
    var ids=[];try{ids=JSON.parse(p.partuids||'[]')}catch(e){}
    var m=/^(.*?)\s*"(.+)"\s*$/.exec(p.title.replace(/«|»/g,'"')),t=m&&m[1]?m[1]:'',n=m?'«'+m[2]+'»':p.title;
    var pr=parseFloat(p.price)||0,old=parseFloat(String(p.priceold||'').replace(',','.'))||0;
    var qty=p.quantity===''?null:parseInt(p.quantity,10);
    var multi=!!p.json_options||(String(p.editions||'').match(/'uid'/g)||[]).length>1;
    return{raw:p,uid:String(p.uid),t:t,n:n,title:p.title,price:pr,old:old,img:g[0]&&g[0].img||'',ids:ids,qty:qty,sold:qty===0,multi:multi,
      url:(p.url||'').replace(/^http:/,'https:'),part:(ids[0]&&parts[ids[0]])||'',search:(p.title+' '+(p.descr||'')).toLowerCase()};
  }
  function list(){return items.filter(function(i){return (cat==='all'||i.ids.indexOf(+cat)>-1)&&(!query||i.search.indexOf(query)>-1)})}
  function paintMainCard(i){MVProductCard.replace(track,i,esc,PLUS)}
  MVProductCard.watch(track,function(){items.forEach(paintMainCard);updBadge()});
  function cards(){
    var L=list();if(!L.length)return '<p class="empty">Ничего не нашлось. Попробуйте другой запрос.</p>';
    return L.map(function(i,k){
      return MVProductCard.markup(i,{layout:'rail',esc:esc,fmt:fmt,plus:PLUS,image:thumb,type:i.part,index:k});
    }).join('');
  }
  function render(){
    var old=track.querySelectorAll('.prod');
    if(!old.length||reduce){track.innerHTML=cards();track.scrollLeft=0;update();return}
    busy=true;
    old.forEach(function(el,k){el.style.setProperty('--i',Math.min(k,6));el.classList.add('out')});
    setTimeout(function(){track.innerHTML=cards();track.scrollLeft=0;busy=false;update()},260+Math.min(old.length,6)*25);
  }
  // стрелки и прогресс
  var prev=document.getElementById('prev'),next=document.getElementById('next'),prog=document.getElementById('prog');
  function update(){
    var max=track.scrollWidth-track.clientWidth,x=track.scrollLeft;
    prev.disabled=x<4;next.disabled=x>max-4;
    var vis=track.scrollWidth?track.clientWidth/track.scrollWidth:1;
    prog.style.width=(Math.min(1,vis)*100)+'%';
    prog.style.transform='translateX('+(max>0?(x/max)*((1/Math.min(1,vis))-1)*100:0)+'%)';
  }
  function step(dir){var c=track.querySelector('.prod');var w=c?c.getBoundingClientRect().width+16:220;track.scrollBy({left:dir*w*Math.max(1,Math.floor(track.clientWidth/w)-1),behavior:reduce?'auto':'smooth'})}
  prev.addEventListener('click',function(){step(-1)});next.addEventListener('click',function(){step(1)});
  track.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);
  track.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){step(1);e.preventDefault()}if(e.key==='ArrowLeft'){step(-1);e.preventDefault()}});
  // перетаскивание мышью
  var dx=null,sl=0,moved=false;
  track.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse'||e.target.closest('.add'))return;dx=e.clientX;sl=track.scrollLeft;moved=false});
  window.addEventListener('pointermove',function(e){if(dx===null)return;var d=e.clientX-dx;if(Math.abs(d)>4){moved=true;track.classList.add('drag')}if(moved)track.scrollLeft=sl-d});
  window.addEventListener('pointerup',function(){if(dx===null)return;dx=null;if(moved){track.classList.remove('drag');var c=track.querySelector('.prod'),w=c?c.getBoundingClientRect().width+16:220;track.scrollTo({left:Math.round(track.scrollLeft/w)*w,behavior:'smooth'})}});
  // корзина Тильды
  function updBadge(){var n=MVProductCard.totals().n;cart.textContent=n;cart.style.display=n?'':'none'}
  function bump(){updBadge();cart.classList.remove('bump');void cart.offsetWidth;cart.classList.add('bump')}
  function hookCart(){
    updBadge();
  }
  function afterLoad(){hookCart();setTimeout(hookCart,600);setTimeout(updBadge,1500)}
  if(document.readyState==='complete')afterLoad();else window.addEventListener('load',afterLoad);
  document.getElementById('cartBtn').addEventListener('click',function(){
    if(window.tcart__openCart)tcart__openCart();else if(document.querySelector('.t706__carticon'))document.querySelector('.t706__carticon').click();
  });
  function addToCart(i,b){
    var from=b.getBoundingClientRect();
    var p=i.raw,Y={name:i.title,price:i.price,img:i.img,recid:API.rec,lid:i.uid,uid:i.uid,url:i.url,quantity:1,
      pack_label:p.pack_label,pack_m:p.pack_m,pack_x:p.pack_x,pack_y:p.pack_y,pack_z:p.pack_z,part_uids:i.ids.map(String),gen_uid:p.externalid||''};
    if(p.sku)Y.sku=String(p.sku);
    if(i.qty>0)Y.inv=i.qty;
    if(p.unit)Y.unit=p.unit;if(p.portion)Y.portion=p.portion;if(p.single)Y.single=p.single;
    if(typeof window.tcart__addProduct!=='function'){MVProductCard.notify('Корзина ещё загружается, попробуйте через секунду');return false}
    var t6=document.querySelector('.t706');if(t6)t6.setAttribute('data-opencart-onorder','no');
    tcart__addProduct(Y);
    updBadge();
    MVProductCard.feedback(from,bump);return true;
  }
  MVProductCard.bind(track,{
    getItem:function(uid){return items.filter(function(x){return x.uid===uid})[0]},
    add:function(i,b){addToCart(i,b)},
    open:function(i){if(window.MV&&MV.viewProduct)MV.viewProduct(i.uid).catch(function(){location.href=i.url});else location.href=i.url},
    after:function(i){paintMainCard(i);updBadge()},
    link:'a[href*="#p-"]',
    capture:true,
    before:function(e){if(!moved)return true;e.preventDefault();e.stopPropagation();moved=false;return false}
  });
  // вкладки с бегущей плашкой
  var tabs=document.getElementById('tabs'),pill=tabs.querySelector('.pill');
  function movePill(b,instant){if(instant)pill.style.transition='none';pill.style.width=b.offsetWidth+'px';pill.style.transform='translateX('+(b.offsetLeft)+'px)';if(instant){void pill.offsetWidth;pill.style.transition=''}}
  tabs.addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b||busy||b.getAttribute('aria-pressed')==='true')return;
    tabs.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});
    movePill(b);b.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'});cat=b.dataset.cat;render();
  });
  function buildTabs(){
    var cnt={all:items.length};items.forEach(function(i){i.ids.forEach(function(id){cnt[id]=(cnt[id]||0)+1})});
    var ps=Object.keys(parts).filter(function(id){return cnt[id]}).sort(function(a,b){var x=ORDER.indexOf(parts[a]),y=ORDER.indexOf(parts[b]);return (x<0?99:x)-(y<0?99:y)});
    var h='<button aria-pressed="'+(cat==='all')+'" data-cat="all">Все<span>'+cnt.all+'</span></button>';
    ps.forEach(function(id){h+='<button aria-pressed="'+(cat===id)+'" data-cat="'+id+'">'+esc(parts[id])+'<span>'+cnt[id]+'</span></button>'});
    tabs.querySelectorAll('button').forEach(function(x){x.remove()});tabs.insertAdjacentHTML('beforeend',h);pillInit();
    var fc=document.getElementById('factCount'),fm=document.getElementById('factMin');
    if(fc)fc.textContent=cnt.all;
    var cid=Object.keys(parts).filter(function(k){return parts[k]==='Открытки'})[0];
    var cc=items.filter(function(i){return i.ids.indexOf(+cid)>-1&&!i.sold});
    if(fm&&cc.length)fm.textContent='от '+fmt(Math.min.apply(null,cc.map(function(i){return i.price})))+' ₽';
  }
  function load(){
    track.innerHTML='<p class="empty">Загружаем каталог…</p>';
    var all=[],slice=1;
    (function next(){
      fetch('https://store.tildacdn.com/api/getproductslist/?storepartuid='+API.part+'&recid='+API.rec+'&c='+Date.now()+'&getparts=true&getoptions=true&slice='+slice+'&size=100').then(function(r){return r.json()}).then(function(d){
        (d.parts||[]).forEach(function(p){parts[p.uid]=p.title});
        all=all.concat(d.products||[]);
        if(d.nextslice&&slice<10){slice=d.nextslice;next()}else{items=all.map(norm);buildTabs();render()}
      }).catch(function(){track.innerHTML='<p class="empty">Не удалось загрузить каталог. <a href="/store">Открыть каталог</a></p>'});
    })();
  }
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
      // прямая ссылка на окно: …/#login или …#signup
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
        if(window.MV&&MV.swipeDismiss)MV.swipeDismiss({on:cab,box:function(){return cab.querySelector('.cab-box')},scroller:function(){return cab.querySelector('.cab-body')},handle:'.cab-top,.cab-tabs',close:cabClose});
        cab.addEventListener('click',function(e){
          if(e.target===cab){cabClose();return}
          var a=e.target.closest('[data-cab]');if(!a)return;
          switch(a.dataset.cab){
            case 'x':cabClose();break;
            case 'tab':cs.tab=a.dataset.t;cabRender();break;
            case 'ord':{
              // раскрытие чисто на CSS (grid 0fr → 1fr): высота не измеряется скриптом, поэтому содержимое всегда открывается целиком
              var art=a.closest('.co'),on=!art.classList.contains('open');
              art.classList.toggle('open',on);a.setAttribute('aria-expanded',String(on));
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
  // КОНЕЦ ШТОРОК
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
  // ОБЩЕЕ УПРАВЛЕНИЕ ВЫПАДАЮЩИМИ СПИСКАМИ С КЛАВИАТУРЫ (адреса, страны у телефона, подсказки города): ↓ ↑ Enter Пробел Esc.
  // Тильда клавиатуру в этих списках не поддерживает, поэтому подключаем одну логику ко всем. Новый список добавляется строкой в CFG.
  (function(){
    function vis(list){var a=[];for(var i=0;i<list.length;i++)if(list[i].getClientRects().length)a.push(list[i]);return a}
    var CFG=[
      {name:'addr',trigger:'.tcart-select__selected',scope:'.tcart-select',
        open:function(sc){return sc.classList.contains('tcart-select_open')},
        items:function(sc){return vis(sc.querySelectorAll('.tcart-select__option:not(.tcart-select__option_unselectable):not(.tcart-select__option_disabled)'))},
        selected:'.tcart-select__option_selected',toggle:function(tr){tr.click()}},
      {name:'phone',trigger:'.t-input-phonemask__select',scope:'.t-input-phonemask__wrap',
        open:function(){var w=document.querySelector('.t-input-phonemask__options-wrap_open');return !!w&&w.getClientRects().length>0},
        items:function(){var w=document.querySelector('.t-input-phonemask__options-wrap_open');return w?vis(w.querySelectorAll('.t-input-phonemask__options-item')):[]},
        selected:'.t-input-phonemask__options-item_active',toggle:function(tr){tr.click()}},
      {name:'search',trigger:'input.searchbox-input',scope:'.searchbox-inner-wrapper',text:true,
        open:function(sc){var l=sc.querySelector('.searchbox-list');return !!l&&getComputedStyle(l).display!=='none'&&!!l.querySelector('.searchbox-list-item')},
        items:function(sc){return vis(sc.querySelectorAll('.searchbox-list-item'))},
        selected:'',toggle:function(){}}
    ];
    function clear(){var a=document.querySelectorAll('.mv-active');for(var i=0;i<a.length;i++)a[i].classList.remove('mv-active')}
    function move(cf,tr,sc,down){
      var items=cf.items(sc);if(!items.length)return;
      var cur=-1;for(var i=0;i<items.length;i++)if(items[i].classList.contains('mv-active')){cur=i;break}
      if(cur<0&&cf.selected){for(var j=0;j<items.length;j++)if(items[j].matches(cf.selected)){cur=j;break}}
      var next=cur<0?(down?0:items.length-1):Math.max(0,Math.min(items.length-1,cur+(down?1:-1)));
      clear();items[next].classList.add('mv-active');try{items[next].scrollIntoView({block:'nearest'})}catch(x){}
    }
    // (обработчик на window, чтобы сработать раньше «Esc закрывает окно» у шторок и корзины)
    // какой список обслуживать: сначала уже открытый (фокус мог уйти внутрь списка или на страницу), затем тот, чья кнопка в фокусе
    function find(t){
      var a=document.querySelector('.tcart-select_open');
      if(a)return{cf:CFG[0],tr:a.querySelector(CFG[0].trigger),sc:a};
      if(CFG[1].open())return{cf:CFG[1],tr:document.querySelector(CFG[1].trigger),sc:document};
      for(var i=0;i<CFG.length;i++){var tr=t.closest(CFG[i].trigger);if(tr)return{cf:CFG[i],tr:tr,sc:tr.closest(CFG[i].scope)||document}}
      return null;
    }
    window.addEventListener('keydown',function(e){
      var k=e.key;if(k!=='ArrowDown'&&k!=='ArrowUp'&&k!=='Enter'&&k!==' '&&k!=='Escape')return;
      if(e.altKey||e.ctrlKey||e.metaKey)return;
      var t=e.target&&e.target.closest?e.target:null;if(!t)return;
      var f=find(t);if(!f||!f.tr)return;
      var cf=f.cf,tr=f.tr,sc=f.sc,open=cf.open(sc),cur=document.querySelector('.mv-active');
      if(k==='Escape'){if(!open)return;e.preventDefault();e.stopImmediatePropagation();clear();cf.toggle(tr);return}
      if(k===' '&&(cf.text||t.matches('input,textarea')))return; // в поле ввода пробел — это текст
      if(k==='Enter'||k===' '){
        if(open&&cur){e.preventDefault();e.stopImmediatePropagation();cur.click();clear();return}
        if(!open&&!cf.text){e.preventDefault();cf.toggle(tr)}
        return;
      }
      // стрелки
      if(!open){if(cf.text)return;e.preventDefault();cf.toggle(tr);setTimeout(function(){move(cf,tr,tr.closest(cf.scope)||document,k==='ArrowDown')},80);return}
      e.preventDefault();e.stopImmediatePropagation();move(cf,tr,sc,k==='ArrowDown');
    },true);
    document.addEventListener('click',clear,true);
    // триггеры должны получать фокус с клавиатуры
    function prep(){
      var a=document.querySelectorAll('.tcart-select__selected:not([tabindex]),.t-input-phonemask__select:not([tabindex])');
      for(var i=0;i<a.length;i++){a[i].setAttribute('tabindex','0');a[i].setAttribute('role','combobox');a[i].setAttribute('aria-haspopup','listbox')}
    }
    if(window.MutationObserver){var q=0;new MutationObserver(function(){if(q)return;q=requestAnimationFrame(function(){q=0;prep()})}).observe(document.body,{childList:true,subtree:true})}
    prep();
  })();
  // тексты ошибок формы заказа приходят с английским «Error: » в начале: убираем и делаем первую букву заглавной
  (function(){
    if(!window.MutationObserver)return;
    function fix(){
      document.querySelectorAll('.t-form__errorbox-item').forEach(function(el){
        var t=el.textContent;
        if(!el.children.length&&/^\s*Error:\s*/i.test(t)){t=t.replace(/^\s*Error:\s*/i,'');el.textContent=t.charAt(0).toUpperCase()+t.slice(1)}
      });
    }
    var q=0;
    new MutationObserver(function(){if(q)return;q=requestAnimationFrame(function(){q=0;fix()})}).observe(document.body,{childList:true,subtree:true,characterData:true});
    fix();
  })();
  // КОНЕЦ КОРЗИНЫ В ШТОРКЕ
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
  // КОНЕЦ ПЛАВАЮЩЕЙ КОРЗИНЫ
  // поиск и мобильное меню
  var sf=document.getElementById('srch'),si=document.getElementById('srchIn');
  document.getElementById('searchBtn').addEventListener('click',function(){sf.hidden=false;si.focus();var c=document.getElementById('catalog');if(c)c.scrollIntoView({behavior:reduce?'auto':'smooth'})});
  function closeS(){sf.hidden=true;si.value='';if(query){query='';render()}}
  document.getElementById('srchX').addEventListener('click',closeS);
  sf.addEventListener('submit',function(e){e.preventDefault()});
  si.addEventListener('keydown',function(e){if(e.key==='Escape')closeS()});
  si.addEventListener('input',function(){query=si.value.trim().toLowerCase();render()});
  var mn=document.getElementById('mnav');
  document.getElementById('burger').addEventListener('click',function(){mn.hidden=!mn.hidden});
  mn.addEventListener('click',function(){mn.hidden=true});
  function pillInit(){var a=tabs.querySelector('[aria-pressed="true"]');if(a)movePill(a,true)}
  pillInit();load();window.addEventListener('resize',pillInit);if(document.fonts)document.fonts.ready.then(pillInit);

  // ПРОСМОТР ТОВАРА НА ГЛАВНОЙ
  // Карточка товара открывается шторкой прямо здесь (код шторки лежит в qv.js, подгружается заранее), без перехода в каталог.
  (function(){
    var MV=window.MV=window.MV||{},p=null,productHost=document.querySelector('.site');
    function base(){var i=document.querySelector('img[src*="logo-header.webp"]');return i?i.src.replace(/logo-header\.webp.*$/,''):''}
    function load(){
      if(!productHost.isConnected)return Promise.reject(new Error('inactive page'));
      if(p)return p;var b=base();if(!b)return Promise.reject(new Error('base'));
      var css=document.createElement('link');css.rel='stylesheet';css.href=b+'catalog.css?v=qv-close-1';document.head.appendChild(css);
      p=fetch(b+'qv.js',{cache:'no-cache'}).then(function(r){if(!r.ok)throw new Error('qv');return r.text()}).then(function(t){
        if(!productHost.isConnected)throw new Error('inactive page');
        var s=document.createElement('script');s.textContent=t;document.body.appendChild(s);if(!MV.qvOpen)throw new Error('qv init');
      }).catch(function(e){p=null;throw e});
      return p;
    }
    MV.viewProduct=function(uid){return load().then(function(){return MV.qvOpen(uid)})};
    function warm(){load().catch(function(){})}
    if('requestIdleCallback' in window)requestIdleCallback(function(){setTimeout(warm,1500)},{timeout:6000});else setTimeout(warm,4000);
    document.addEventListener('click',function(e){
      if(!productHost.isConnected||e.defaultPrevented)return;
      var a=e.target.closest&&e.target.closest('a[href*="#p-"]');if(!a||e.metaKey||e.ctrlKey||e.shiftKey||e.button)return;
      var m=/#p-(\d+)/.exec(a.getAttribute('href'));if(!m)return;
      e.preventDefault();
      MV.viewProduct(m[1]).catch(function(){location.href=a.href});
    });
  })();
  // КОНЕЦ ПРОСМОТРА ТОВАРА НА ГЛАВНОЙ
  // блеск лого: маска из самой картинки
  var shine=document.querySelector('.logo-shine');
  if(shine){var li=shine.querySelector('img');shine.style.setProperty('--logo','url("'+li.src+'")');if(!reduce)requestAnimationFrame(function(){shine.classList.add('go')})}

  // шапка и активный пункт меню
  var top=document.querySelector('.top');
  // на главной шапка скрыта вверху страницы и выезжает, когда пролистали героя
  var heroEl=document.querySelector('.hero');
  if(heroEl){top.classList.add('slide');document.documentElement.style.setProperty('--hdrh',top.offsetHeight+'px')}
  window.MVViewportHeader.mount(top,!heroEl);
  function onScroll(){
    if(!top.isConnected)return;
    top.classList.toggle('scrolled',window.scrollY>8);
    if(heroEl){var th=Math.max(140,heroEl.offsetHeight*.6);top.classList.toggle('show',window.scrollY>th)}
  }
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();
  var links=[].slice.call(document.querySelectorAll('.nav a'));
  if('IntersectionObserver' in window){
    var so=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){links.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+x.target.id)})}})},{rootMargin:'-45% 0px -50% 0px'});
    links.forEach(function(a){var t=document.querySelector(a.getAttribute('href'));if(t)so.observe(t)});
  }

  // появление при скролле: прячем только то, что ниже первого экрана
  var rvs=[].slice.call(document.querySelectorAll('.rv'));
  if(reduce||!('IntersectionObserver' in window)){rvs.forEach(function(el){el.classList.add('in')})}
  else{
    var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});
    rvs.forEach(function(el){if(el.getBoundingClientRect().top<innerHeight*.92)el.classList.add('in');else io.observe(el)});
  }

  // лёгкий параллакс фото автора
  var ap=document.getElementById('aboutPhoto');
  if(ap&&!reduce){var ticking=false;window.addEventListener('scroll',function(){if(ticking)return;ticking=true;requestAnimationFrame(function(){ticking=false;if(!ap.classList.contains('in'))return;var r=ap.getBoundingClientRect(),c=(r.top+r.height/2-innerHeight/2)/innerHeight;ap.style.transform='translateY('+(c*-28).toFixed(1)+'px)'})},{passive:true})}

  // компактный список отзывов: две карточки сначала, полный список по кнопке
  (function(){
    var list=document.getElementById('reviewsList'),more=document.getElementById('reviewsMore');if(!list||!more)return;
    more.addEventListener('click',function(){
      var open=list.classList.toggle('is-expanded');more.setAttribute('aria-expanded',String(open));more.textContent=open?'Свернуть отзывы':'Смотреть все отзывы';
      if(!open)document.getElementById('reviews').scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
    });
  })();

  // полный отзыв открывается тем же адаптивным окном MV.sheet, что и остальные модалки сайта
  (function(){
    var sheet=null,reviewHost=document.querySelector('.site');
    function photos(media){return[].slice.call(media.querySelectorAll('[data-review-photo]')).map(function(b){var img=b.querySelector('img');return{src:img.currentSrc||img.src,full:img.src,alt:img.alt}})}
    function openPhoto(button){
      var media=button.closest('.review-media');if(!media||!window.MVImageViewer)return;
      var buttons=[].slice.call(media.querySelectorAll('[data-review-photo]'));
      MVImageViewer.open({items:photos(media),index:buttons.indexOf(button),from:button});
    }
    function bindPhotos(root){
      root.querySelectorAll('[data-review-photo]').forEach(function(button){button.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();openPhoto(button)})});
    }
    function show(post){
      if(!sheet)sheet=MV.sheet({title:'Отзыв покупателя',className:'sh-review'});
      var copy=post.cloneNode(true);copy.classList.remove('rv','in','is-open');copy.classList.add('review-detail');copy.removeAttribute('style');var oldButton=copy.querySelector('.review-expand');if(oldButton)oldButton.remove();
      bindPhotos(copy);var name=((copy.querySelector('.review-author')||{}).textContent||'покупателя').trim();
      sheet.setTitle('Отзыв от «'+name+'»');sheet.setBody(copy);sheet.open();
    }
    document.addEventListener('click',function(e){if(!reviewHost.isConnected)return;var button=e.target.closest&&e.target.closest('[data-review-photo]');if(!button)return;e.preventDefault();e.stopImmediatePropagation();openPhoto(button)},true);
    document.querySelectorAll('.review-post').forEach(function(post){
      var openButton=document.createElement('button');openButton.type='button';openButton.className='review-expand';openButton.textContent='Читать отзыв';
      post.querySelector('.review-text').insertAdjacentElement('afterend',openButton);openButton.addEventListener('click',function(){show(post)});
      post.addEventListener('click',function(e){if(e.target.closest('a,button'))return;show(post)});
      bindPhotos(post);
    });
  })();

  // плавное раскрытие вопросов
  document.querySelectorAll('.faq details').forEach(function(d){
    var sum=d.querySelector('summary'),ans=d.querySelector('.ans');
    sum.addEventListener('click',function(e){
      if(reduce||!ans.animate)return;e.preventDefault();
      if(d.open){var h=ans.offsetHeight;ans.animate([{height:h+'px',opacity:1},{height:'0px',opacity:0}],{duration:320,easing:'cubic-bezier(.4,0,.2,1)'}).onfinish=function(){d.open=false}}
      else{d.open=true;var h2=ans.offsetHeight;ans.animate([{height:'0px',opacity:0},{height:h2+'px',opacity:1}],{duration:380,easing:'cubic-bezier(.2,.8,.2,1)'})}
    });
  });

  // плавный инерционный скролл колесом (тач и клавиатура остаются нативными)
  var smooth={on:false,y:0,t:0,raf:0};
  if(!reduce&&matchMedia('(pointer:fine)').matches){
    smooth.on=true;document.documentElement.classList.add('smooth');smooth.y=smooth.t=window.scrollY;
    function maxY(){return document.documentElement.scrollHeight-innerHeight}
    function loop(){smooth.y+=(smooth.t-smooth.y)*.12;if(Math.abs(smooth.t-smooth.y)<.5)smooth.y=smooth.t;window.scrollTo(0,smooth.y);smooth.raf=smooth.y!==smooth.t?requestAnimationFrame(loop):0}
    window.addEventListener('wheel',function(e){
      if(!track.isConnected)return;
      if(e.ctrlKey||e.defaultPrevented)return;
      if(Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
      if(e.target.closest&&e.target.closest('.track')&&e.shiftKey)return;
      // внутри окон (корзина, кабинет, шторки) колесо прокручивает их содержимое, а не страницу
      if(e.target.closest&&e.target.closest('.mv-cp,.t706__cartpage,.t706__cartwin,.sh,.cab,.qv,.lb,.tlk-authModal'))return;
      e.preventDefault();
      var d=e.deltaY*(e.deltaMode===1?32:e.deltaMode===2?innerHeight:1);
      if(!smooth.raf)smooth.y=window.scrollY,smooth.t=smooth.y;
      smooth.t=Math.max(0,Math.min(maxY(),smooth.t+d));
      if(!smooth.raf)smooth.raf=requestAnimationFrame(loop);
    },{passive:false});
    window.addEventListener('scroll',function(){if(!smooth.raf){smooth.y=smooth.t=window.scrollY}},{passive:true});
    smooth.to=function(y){smooth.y=window.scrollY;smooth.t=Math.max(0,Math.min(maxY(),y));if(!smooth.raf)smooth.raf=requestAnimationFrame(loop)};
  }
  document.addEventListener('click',function(e){
    if(!track.isConnected)return;var a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a)return;
    var id=a.getAttribute('href');if(id==='#'){e.preventDefault();smooth.on?smooth.to(0):window.scrollTo({top:0,behavior:reduce?'auto':'smooth'});return}
    var t=document.querySelector(id);if(!t)return;e.preventDefault();
    var y=t.getBoundingClientRect().top+window.scrollY-(top.offsetHeight-2);
    smooth.on?smooth.to(y):window.scrollTo({top:y,behavior:reduce?'auto':'smooth'});
  });



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
  }
  if(window.MVProductCard&&MVProductCard.totals)start();
  else fetch('https://mattshaddd.github.io/MiravenWebSite/product-card.js',{cache:'no-cache'})
    .then(function(r){if(!r.ok)throw new Error('product-card.js');return r.text()})
    .then(function(code){var s=document.createElement('script');s.textContent=code;document.head.appendChild(s);s.remove();start()})
    .catch(function(e){console.error('Не удалось загрузить общий модуль карточки товара',e)});
})();
