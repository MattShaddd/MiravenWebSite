(function(){
  'use strict';
  if(window.MVImageViewer)return;
  var root,track,count,prev,next,closeBtn,items=[],index=0,from=null,onChange=null,oldOverflow='',site=null;
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
    o=o||{};if(!root)make();items=normalise(o.items||o.images);if(!items.length)return;index=Math.max(0,Math.min(items.length-1,o.index||0));from=o.from||document.activeElement;onChange=typeof o.onChange==='function'?o.onChange:null;
    track.innerHTML=items.map(function(x){return'<div class="mv-viewer__slide"><img src="'+esc(x.src)+'" data-full="'+esc(x.full)+'" alt="'+esc(x.alt)+'" draggable="false"></div>'}).join('');
    track.querySelectorAll('img').forEach(function(img){img.addEventListener('error',function(){if(img.dataset.full&&img.src!==img.dataset.full)img.src=img.dataset.full},{once:true})});
    root.classList.toggle('mv-viewer--single',items.length<2);oldOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';if(site)site.inert=true;
    root.hidden=false;root.getBoundingClientRect();root.classList.add('mv-viewer--open');requestAnimationFrame(function(){go(index,false)});closeBtn.focus({preventScroll:true});
  }
  function shut(){if(!root||root.hidden)return;root.classList.remove('mv-viewer--open');document.documentElement.style.overflow=oldOverflow;if(site)site.inert=false;var restore=from;setTimeout(function(){if(!root.classList.contains('mv-viewer--open')){root.hidden=true;track.innerHTML=''}},reduce?0:220);if(restore&&restore.focus)try{restore.focus({preventScroll:true})}catch(e){}}
  window.MVImageViewer={open:open,close:shut};
})();
