/* Миравен: старые адреса карточек Тильды (/tproduct/<id>-слаг), уже попавшие в поисковики,
   ведут в каталог: /store#p-<id> (там карточка в оформлении сайта).
   Подключение: блок T123 на странице магазина (с отметкой «показывать на страницах товаров»)
   или Настройки сайта → Вставка кода → HEAD:
   <script src="https://mattshaddd.github.io/MiravenWebSite/tproduct-redirect.js"></script>
   Без defer: редирект должен сработать до отрисовки голой страницы Тильды. */
(function(){
  var m=/^\/tproduct\/(\d+)/.exec(location.pathname);
  if(!m)return;
  location.replace('/store#p-'+m[1]);
})();
