  /* PRELOADER:BEGIN (генерируется build.py из preloader.snippet.js: правьте его, не загрузчики) */
  // Экран загрузки: логотип и тонкая полоса, которая плавно заполняется по мере загрузки файлов сайта.
  var PL=(function(){
    var theme=null;try{theme=localStorage.getItem('miraven-theme')}catch(e){}
    var hh=(location.hash||'').slice(1);if(hh==='dark'||hh==='beige')theme=hh;
    if(theme!=='dark'&&theme!=='beige')theme=window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'beige';
    var st=document.createElement('style');
    st.textContent='#mv-pre{position:fixed;inset:0;z-index:2147483600;display:grid;place-items:center;background:#F6F1E8;transition:opacity .55s ease,visibility 0s .55s}'
      +'#mv-pre[data-t="dark"]{background:#15131A}'
      +'#mv-pre.off{opacity:0;visibility:hidden;pointer-events:none}'
      +'#mv-pre .in{display:grid;justify-items:center;gap:26px;transform:translateY(-4%)}'
      +'#mv-pre img{display:block;width:min(160px,42vw);height:auto;animation:mvpIn .8s cubic-bezier(.2,.8,.2,1) both,mvpB 3.4s ease-in-out .8s infinite}'
      +'#mv-pre .bar{width:min(168px,46vw);height:3px;border-radius:3px;background:rgba(196,145,58,.22);overflow:hidden}'
      +'#mv-pre .bar i{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,#B8832F,#E6B966);transform-origin:0 50%;transform:scaleX(0)}'
      +'@keyframes mvpIn{from{opacity:0;transform:translateY(8px) scale(.96)}to{opacity:1;transform:none}}'
      +'@keyframes mvpB{50%{transform:translateY(-3px) scale(1.025)}}'
      +'@media (prefers-reduced-motion:reduce){#mv-pre img{animation:none}#mv-pre{transition:none}}';
    document.head.appendChild(st);
    var el=document.createElement('div');el.id='mv-pre';el.setAttribute('data-t',theme);el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.setAttribute('aria-label','Загрузка');
    el.innerHTML='<div class="in"><img alt="" width="160" height="140" src="data:image/webp;base64,{{LOGO}}"><div class="bar"><i></i></div></div>';
    document.body.appendChild(el);
    var html=document.documentElement,prevOv=html.style.overflow;html.style.overflow='hidden';
    var bar=el.querySelector('.bar i'),MIN=600,t0=performance.now(),total=1,got=0,real=0,shown=0,finishing=false,gone=false;
    function leave(){
      if(gone)return;gone=true;html.style.overflow=prevOv;el.classList.add('off');el.setAttribute('aria-busy','false');
      setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);if(st.parentNode)st.parentNode.removeChild(st)},900);
    }
    function loop(now){
      if(gone)return;
      var spent=now-t0,target=finishing?1:Math.max(real,Math.min(.86,1-Math.exp(-spent/1600)));
      shown+=(target-shown)*(finishing?.14:.06);
      bar.style.transform='scaleX('+shown.toFixed(4)+')';
      if(finishing&&shown>.995&&spent>=MIN){bar.style.transform='scaleX(1)';setTimeout(leave,140);return}
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    setTimeout(function(){finishing=true;setTimeout(leave,1200)},15000); // страховка: экран загрузки не должен висеть вечно
    return{
      total:function(n){total=Math.max(1,n)},
      tick:function(){got++;real=Math.min(.8,got/total*.8)},
      done:function(){
        real=.9;
        var go=function(){requestAnimationFrame(function(){requestAnimationFrame(function(){finishing=true})})};
        if(document.fonts&&document.fonts.ready){var fin=false,f=function(){if(!fin){fin=true;go()}};document.fonts.ready.then(f,f);setTimeout(f,1500)}else go();
        setTimeout(function(){finishing=true;setTimeout(leave,1500)},3500); // если вкладка в фоне и кадры не рисуются, закрываем по таймеру
      },
      fail:function(){finishing=true;leave()}
    };
  })();
  /* PRELOADER:END */
