(function(){
  var API={part:'683137745982',rec:'1278451251'};
  var ORDER=['Открытки','Наборы открыток','Свечи','Наклейки на карты','Разное','Новинки','Распродажа'];
  var items=[],parts={},cat='all',query='';
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var track=document.getElementById('products'),cart=document.getElementById('cart'),count=0,busy=false;
  var PLUS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',CHECK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
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
  function cards(){
    var L=list();if(!L.length)return '<p class="empty">Ничего не нашлось. Попробуйте другой запрос.</p>';
    return L.map(function(i,k){
      var btn=i.sold?'':'<button class="add" data-uid="'+i.uid+'" aria-label="'+(i.multi?'Выбрать вариант: ':'В корзину: ')+esc(i.title)+'">'+PLUS+'<span>'+(i.multi?'Выбрать':'В корзину')+'</span></button>';
      return '<article class="prod'+(i.sold?' soldout':'')+'" style="--i:'+Math.min(k,7)+'"><div class="photo">'+(i.img?'<img class="pimg" loading="lazy" decoding="async" src="'+esc(thumb(i.img))+'" data-full="'+esc(i.img)+'" alt="'+esc(i.title)+'" onerror="if(this.dataset.full&&this.src!==this.dataset.full)this.src=this.dataset.full">':'')+'<a class="plink" href="'+esc(i.url)+'" aria-label="'+esc(i.title)+'"></a>'+btn+'</div><div class="meta"><small>'+esc(i.t||i.part)+'</small><h3><a href="'+esc(i.url)+'">'+esc(i.n)+'</a></h3></div><span class="price">'+(i.sold?'<span class="soldtag">Нет в наличии</span>':fmt(i.price)+' ₽'+(i.old?'<s>'+fmt(i.old)+' ₽</s>':''))+'</span></article>';
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
  function updBadge(){var n=0;try{n=(window.tcart&&window.tcart.total)|0;if(!n){var l=JSON.parse(localStorage.getItem('tcart')||'{}');n=l.total|0}}catch(e){}cart.textContent=n;cart.style.display=n?'':'none'}
  function bump(){updBadge();cart.classList.remove('bump');void cart.offsetWidth;cart.classList.add('bump')}
  function hookCart(){
    updBadge();
    if(window.tcart__reDrawCartIcon&&!window.tcart__reDrawCartIcon.__m){var o=window.tcart__reDrawCartIcon;window.tcart__reDrawCartIcon=function(){var r=o.apply(this,arguments);updBadge();return r};window.tcart__reDrawCartIcon.__m=1}
  }
  function afterLoad(){hookCart();setTimeout(hookCart,600);setTimeout(updBadge,1500)}
  if(document.readyState==='complete')afterLoad();else window.addEventListener('load',afterLoad);
  document.getElementById('cartBtn').addEventListener('click',function(){
    if(window.tcart__openCart)tcart__openCart();else if(document.querySelector('.t706__carticon'))document.querySelector('.t706__carticon').click();
  });
  function addToCart(i,b){
    var p=i.raw,Y={name:i.title,price:i.price,img:i.img,recid:API.rec,lid:i.uid,uid:i.uid,url:i.url,quantity:1,
      pack_label:p.pack_label,pack_m:p.pack_m,pack_x:p.pack_x,pack_y:p.pack_y,pack_z:p.pack_z,part_uids:i.ids.map(String),gen_uid:p.externalid||''};
    if(p.sku)Y.sku=String(p.sku);
    if(i.qty>0)Y.inv=i.qty;
    if(p.unit)Y.unit=p.unit;if(p.portion)Y.portion=p.portion;if(p.single)Y.single=p.single;
    if(typeof window.tcart__addProduct!=='function'){location.href=i.url;return}
    var t6=document.querySelector('.t706');if(t6)t6.setAttribute('data-opencart-onorder','no');
    tcart__addProduct(Y);
    b.classList.add('done');b.innerHTML=CHECK+'<span>В корзине</span>';
    setTimeout(function(){b.classList.remove('done');b.innerHTML=PLUS+'<span>В корзину</span>'},2200);
    fly(b);
  }
  function fly(b){
    var to=cart.getBoundingClientRect(),from=b.getBoundingClientRect();
    if(reduce||!document.body.animate){bump();return}
    var dot=document.createElement('i');dot.className='fly';document.body.appendChild(dot);
    var x0=from.left+from.width/2,y0=from.top+from.height/2,x1=to.left+to.width/2,y1=to.top+to.height/2,mx=(x0+x1)/2,my=Math.min(y0,y1)-120;
    var kf=[];for(var t=0;t<=1.0001;t+=.1){var a=(1-t)*(1-t),bb=2*(1-t)*t,c=t*t;kf.push({left:(a*x0+bb*mx+c*x1)+'px',top:(a*y0+bb*my+c*y1)+'px',transform:'scale('+(1-t*.55)+')',opacity:t>.9?.6:1})}
    dot.animate(kf,{duration:750,easing:'cubic-bezier(.3,.1,.3,1)'}).onfinish=function(){dot.remove();bump()};
  }
  track.addEventListener('click',function(e){
    if(moved){e.preventDefault();e.stopPropagation();moved=false;return}
    var b=e.target.closest('.add');if(!b)return;
    e.preventDefault();
    var i=items.filter(function(x){return x.uid===b.dataset.uid})[0];if(!i)return;
    if(i.multi){location.href=i.url;return}
    if(b.classList.contains('done'))return;
    addToCart(i,b);
  },true);
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

  // блеск лого: маска из самой картинки
  var shine=document.querySelector('.logo-shine');
  if(shine){var li=shine.querySelector('img');shine.style.setProperty('--logo','url("'+li.src+'")');if(!reduce)requestAnimationFrame(function(){shine.classList.add('go')})}

  // шапка и активный пункт меню
  var top=document.querySelector('.top');
  // на главной шапка скрыта вверху страницы и выезжает, когда пролистали героя
  var heroEl=document.querySelector('.hero');
  if(heroEl){top.classList.add('slide');document.documentElement.style.setProperty('--hdrh',top.offsetHeight+'px')}
  function onScroll(){
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
      if(e.ctrlKey||e.defaultPrevented)return;
      if(Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
      if(e.target.closest&&e.target.closest('.track')&&e.shiftKey)return;
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
    var a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a)return;
    var id=a.getAttribute('href');if(id==='#'){e.preventDefault();smooth.on?smooth.to(0):window.scrollTo({top:0,behavior:reduce?'auto':'smooth'});return}
    var t=document.querySelector(id);if(!t)return;e.preventDefault();
    var y=t.getBoundingClientRect().top+window.scrollY-(top.offsetHeight-2);
    smooth.on?smooth.to(y):window.scrollTo({top:y,behavior:reduce?'auto':'smooth'});
  });



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
})();