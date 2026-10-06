/* Миравен: общий скрипт для ВСЕХ страниц сайта.
   Подключается один раз в Тильде: Настройки сайта → Вставка кода → «HTML-код для вставки внутрь HEAD»:
   <script src="https://mattshaddd.github.io/MiravenWebSite/site-common.js" defer></script>
   Делает две вещи: рано выставляет тему (чтобы страницы Тильды без нашего кода тоже следовали теме) и показывает баннер cookies. */
(function(){
  if(window.__mvCommon)return;window.__mvCommon=1;
  var root=document.documentElement;

  /* ---------- тема: сохранённая → системная (та же логика, что в miraven.js) ---------- */
  function theme(){
    var s=null;try{s=localStorage.getItem('miraven-theme')}catch(e){}
    var h=(location.hash||'').slice(1);if(h==='dark'||h==='beige')s=h;
    if(s!=='dark'&&s!=='beige')s=window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'beige';
    return s;
  }
  function applyTheme(){
    var t=theme();root.setAttribute('data-mv-theme',t);
    var a=document.querySelectorAll('.site');for(var i=0;i<a.length;i++)a[i].setAttribute('data-theme',t);
    return t;
  }
  applyTheme();
  window.MVTheme={apply:applyTheme,current:theme};

  /* ---------- cookies ---------- */
  if(window.top!==window)return; // во вложенных окнах (вход Тильды) баннер не нужен
  var KEY='miraven-cookies',POLICY='/politika';
  function read(){try{return JSON.parse(localStorage.getItem(KEY))}catch(e){return null}}
  function save(v){
    var d={v:v,t:Date.now()};
    try{localStorage.setItem(KEY,JSON.stringify(d))}catch(e){}
    try{document.cookie='mv_cookies='+v+'; max-age='+(180*86400)+'; path=/; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'')}catch(e){}
    try{window.dispatchEvent(new CustomEvent('mv-cookies',{detail:d}))}catch(e){}
  }
  window.MVCookies={get:function(){var d=read();return d&&d.v||null},allowed:function(){var d=read();return !!d&&d.v==='all'},reset:function(){try{localStorage.removeItem(KEY)}catch(e){}show()}};

  var CSS='#mv-cookie{position:fixed;left:16px;bottom:16px;z-index:2147482000;width:min(440px,calc(100vw - 32px));box-sizing:border-box;padding:18px 20px;border:1px solid #DDD2C0;border-radius:20px;background:#F6F1E8;color:#2B2330;font:14px/1.55 "Golos Text","Segoe UI",Roboto,Arial,sans-serif;opacity:0;transform:translateY(12px);transition:opacity .35s ease,transform .45s cubic-bezier(.2,.8,.2,1)}'
    +'#mv-cookie.on{opacity:1;transform:none}'
    +'#mv-cookie[data-t="dark"]{background:#131519;border-color:#24262C;color:#EFE9DF}'
    +'#mv-cookie p{margin:0 0 14px;color:inherit}'
    +'#mv-cookie a{color:#8A6118;text-decoration:underline;text-underline-offset:3px}'
    +'#mv-cookie[data-t="dark"] a{color:#D8AD5E}'
    +'#mv-cookie .mvc-b{display:flex;flex-wrap:wrap;gap:8px}'
    +'#mv-cookie button{flex:1 1 auto;height:42px;padding:0 18px;border:0;border-radius:999px;font:500 14px "Golos Text","Segoe UI",Roboto,Arial,sans-serif;cursor:pointer;transition:background .2s,box-shadow .2s}'
    +'#mv-cookie .mvc-ok{background:#2B2330;color:#F6F1E8}'
    +'#mv-cookie[data-t="dark"] .mvc-ok{background:#EFE9DF;color:#0C0D10}'
    +'#mv-cookie .mvc-no{background:transparent;color:inherit;box-shadow:inset 0 0 0 1px #DDD2C0}'
    +'#mv-cookie[data-t="dark"] .mvc-no{box-shadow:inset 0 0 0 1px #24262C}'
    +'#mv-cookie .mvc-no:hover{box-shadow:inset 0 0 0 1px currentColor}'
    +'#mv-cookie button:focus-visible{outline:2px solid #C4913A;outline-offset:2px}'
    +'@media (max-width:600px){#mv-cookie{left:10px;right:10px;bottom:10px;width:auto;padding:16px}#mv-cookie button{flex:1 1 100%}}'
    +'@media (prefers-reduced-motion:reduce){#mv-cookie{transition:none}}';

  var el=null;
  function show(){
    if(el||!document.body)return;
    if(!document.getElementById('mv-cookie-css')){var st=document.createElement('style');st.id='mv-cookie-css';st.textContent=CSS;document.head.appendChild(st)}
    el=document.createElement('div');el.id='mv-cookie';el.setAttribute('role','dialog');el.setAttribute('aria-label','Использование cookies');el.setAttribute('data-t',theme());
    el.innerHTML='<p>Мы используем cookies: они нужны, чтобы работали корзина, вход и тема сайта, а ещё помогают нам понимать, что улучшить. Подробнее в <a href="'+POLICY+'">политике конфиденциальности</a>.</p>'
      +'<div class="mvc-b"><button type="button" class="mvc-ok" data-c="all">Принять</button><button type="button" class="mvc-no" data-c="necessary">Только необходимые</button></div>';
    el.addEventListener('click',function(e){
      var b=e.target.closest&&e.target.closest('[data-c]');if(!b)return;
      save(b.getAttribute('data-c'));el.classList.remove('on');var x=el;el=null;setTimeout(function(){if(x.parentNode)x.parentNode.removeChild(x)},500);
    });
    document.body.appendChild(el);
    requestAnimationFrame(function(){requestAnimationFrame(function(){if(el)el.classList.add('on')})});
  }
  function init(){if(!read())setTimeout(show,600)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
