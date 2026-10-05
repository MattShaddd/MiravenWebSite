(function(){
  'use strict';
  if(window.MVProductCard)return;
  if(!document.querySelector('link[data-mv-product-card-css]')){
    var css=document.createElement('link');css.rel='stylesheet';css.href='https://mattshaddd.github.io/MiravenWebSite/product-card.css?v=1';css.setAttribute('data-mv-product-card-css','');document.head.appendChild(css);
  }

  var STEPPER='<button type="button" data-s="m" aria-label="Убрать одну штуку">−</button><b></b><button type="button" data-s="p" aria-label="Добавить ещё одну штуку">+</button>';

  function products(){
    try{
      if(window.tcart&&Array.isArray(window.tcart.products))return window.tcart.products;
      var saved=JSON.parse(localStorage.getItem('tcart')||'{}');
      return Array.isArray(saved.products)?saved.products:[];
    }catch(e){return[]}
  }
  function quantity(item){
    var n=0;
    products().forEach(function(p){if(String(p.lid)===String(item.uid))n+=parseInt(p.quantity,10)||0});
    return n;
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
  window.MVProductCard={products:products,quantity:quantity,stock:stock,control:control,minus:minus,replace:replace,bind:bind,feedback:feedback};
})();
