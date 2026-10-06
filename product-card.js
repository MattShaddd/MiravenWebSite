(function(){
  'use strict';
  if(window.MVProductCard&&window.MVProductCard.version===4)return;
  var css=document.querySelector('link[data-mv-product-card-css]');
  if(!css){css=document.createElement('link');css.rel='stylesheet';css.setAttribute('data-mv-product-card-css','');document.head.appendChild(css)}
  css.href='https://mattshaddd.github.io/MiravenWebSite/product-card.css?v=4';

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

/* Лёгкий наклон фото карточки товара в сторону мыши (только мышь, без reduce-motion) */
(function(){
  if(window.MVTilt)return;window.MVTilt=1;
  if(!window.matchMedia||!matchMedia('(hover:hover) and (pointer:fine)').matches||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  var cur=null,MAX=6;
  function reset(el){if(el){el.style.removeProperty('--rx');el.style.removeProperty('--ry')}}
  document.addEventListener('pointermove',function(e){
    var ph=e.target&&e.target.closest?e.target.closest('.prod .photo'):null;
    if(cur&&cur!==ph){reset(cur);cur=null}
    if(!ph)return;
    cur=ph;
    var r=ph.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    ph.style.setProperty('--ry',(x*MAX*2).toFixed(2)+'deg');
    ph.style.setProperty('--rx',(-y*MAX*2).toFixed(2)+'deg');
  },{passive:true});
  document.addEventListener('pointerleave',function(){reset(cur);cur=null});
})();
