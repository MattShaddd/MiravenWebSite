/* Миравен: скрипт для страниц личного кабинета Тильды (/members/, заказы, адреса, профиль).
   Подключается одним блоком T123 на этих страницах (см. README). Сейчас делает одно: «Выйти» ведёт на сайт,
   а не на системную страницу входа Тильды. Выход тот же, что у Тильды: POST /api/logout/ и очистка localStorage. */
(function(){
  if(window.__mvMembers)return;window.__mvMembers=1;
  var HOME='/newmain';
  var ar=document.getElementById('allrecords'),pid=ar&&ar.getAttribute('data-tilda-project-id')||'';
  function ep(alt){
    var tm=window.tildaMembers||{},b=tm.endpoint||(typeof window.tma__getMembersEndpoint==='function'?window.tma__getMembersEndpoint():'https://members.tildaapi.'+(tm.rootZone||'com'));
    return alt?b.replace('https://members.tildaapi.','https://members2.tildacdn.'):b;
  }
  function profile(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}}
  var busy=false;
  function logout(){
    if(busy)return;busy=true;
    var k='tilda_members_profile'+pid,p=profile(k),fin=false;
    function done(){
      if(fin)return;fin=true;
      try{window.mauser={};localStorage.removeItem(k);localStorage.removeItem(k+'_timestamp')}catch(e){}
      location.replace(HOME);
    }
    if(!p||!p.token){done();return}
    var body=JSON.stringify({projectid:p.projectid||pid,token:p.token,tzoffset:new Date().getTimezoneOffset()});
    function send(alt){
      return fetch(ep(alt)+'/api/logout/',{method:'POST',headers:{'Content-Type':'application/json; charset=UTF-8'},body:body}).then(function(r){if(r.status>=500&&!alt)return send(true)});
    }
    send(false).catch(function(){return send(true)}).then(done,done);
    setTimeout(done,6000);
  }
  document.addEventListener('click',function(e){
    if(e.button>0||e.metaKey||e.ctrlKey||e.shiftKey)return;
    var a=e.target.closest&&e.target.closest('.tmst-main__card__link_secondary,.tlk-userbar__popup-logout,.tmst-main__card a,.tmst-main__card button');
    if(!a)return;
    if(!a.matches('.tlk-userbar__popup-logout')&&!/^\s*(Выйти|Выход)\s*$/i.test(a.textContent))return;
    e.preventDefault();e.stopImmediatePropagation();logout();
  },true);
})();
