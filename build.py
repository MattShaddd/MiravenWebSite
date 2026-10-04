"""Сборка сайта Миравен.

  python build.py                 собрать catalog.html и catalog.js (их нужно коммитить) + готовые блоки T123 в dist/
  python build.py BASE            то же, логотипы берутся по адресу BASE (со слэшем на конце)

Что делает:
  1. catalog.html  = шапка + подвал из miraven.html + catalog.main.html
  2. catalog.js    = catalog.src.js + блоки «вход» и «тема» из miraven.js
  3. dist/miraven-tilda-T123.html   главная одним блоком (без загрузчика)
  4. dist/catalog-tilda-T123.html   каталог одним блоком (без загрузчика)
  5. dist/footer-tilda-T123.html    глобальный футер одним блоком (без загрузчика)
"""
import os, re, sys

here = os.path.dirname(os.path.abspath(__file__))
rd = lambda f: open(os.path.join(here, f), encoding='utf-8').read()
def wr(f, s):
    p = os.path.join(here, f); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8', newline='\n').write(s)

base = sys.argv[1] if len(sys.argv) > 1 else re.search(r"BASE='([^']+)'", rd('loader.html')).group(1)
home = re.search(r"HOME='([^']+)'", rd('loader-catalog.html')).group(1)

home_html = rd('miraven.html')
home_js = rd('miraven.js')

# ---------- catalog.html ----------
header = re.search(r'<header class="top wrap">.*?</header>', home_html, re.S).group(0)
header = re.sub(r'\s*<form class="srch".*?</form>', '', header, flags=re.S)
mnav = re.search(r'<nav class="mnav".*?</nav>', home_html, re.S).group(0)

def relink(s):
    s = s.replace('href="#catalog" class="on"', 'href="/newstore" class="on"')
    s = s.replace('href="#catalog"', 'href="/newstore"')
    for k in ('delivery', 'stores', 'about', 'reviews', 'faq'):
        s = s.replace('href="#%s"' % k, 'href="{{HOME}}#%s"' % k)
    s = s.replace('class="brand" href="#"', 'class="brand" href="{{HOME}}"')
    return s

# в шапке каталога только ссылки, которые имеют смысл на этой странице (разделов главной здесь нет)
header = re.sub(r'\s*<nav class="nav".*?</nav>', '', header, flags=re.S)
header = re.sub(r'\s*<button class="icon-btn burger".*?</button>', '', header, flags=re.S)
mnav = ''  # на странице каталога меню разделов не нужно

# в мобильном меню «Каталог» — текущая страница
catalog_html = '<div class="site">\n' + relink(header) + '\n' + relink(mnav) + '\n\n' + rd('catalog.main.html') + '\n</div>\n'
wr('catalog.html', catalog_html)

# ---------- catalog.js ----------
a = home_js.index('  // вход / регистрация'); b = home_js.index('  // поиск и мобильное меню')
auth = home_js[a:b]
t = home_js.index("  var site=document.querySelector('.site'),tbtn")
theme = home_js[t:home_js.rindex('})();')]
fa = home_js.index('  // ПЛАВАЮЩАЯ КОРЗИНА'); fb = home_js.index('  // КОНЕЦ ПЛАВАЮЩЕЙ КОРЗИНЫ')
fab = home_js[fa:fb]
sa = home_js.index('  // МОДАЛЬНЫЕ ШТОРКИ'); sb = home_js.index('  // КОНЕЦ ШТОРОК')
sheet = home_js[sa:sb]
ca = home_js.index('  // КОРЗИНА В ШТОРКЕ'); cb = home_js.index('  // КОНЕЦ КОРЗИНЫ В ШТОРКЕ')
cartsheet = home_js[ca:cb]
# вырезка «вход / регистрация» захватывает шторки, корзину и плавающие кнопки, а они вставляются отдельно: без вычитания всё попадало в каталог дважды
for blk in (sheet, cartsheet, fab):
    assert blk in auth
    auth = auth.replace(blk, '')
cjs = rd('catalog.src.js').replace('/*@CARTSHEET@*/', cartsheet).replace('/*@SHEET@*/', sheet).replace('/*@FAB@*/', fab).replace('/*@AUTH@*/', auth).replace('/*@THEME@*/', theme)
wr('catalog.js', cjs)

# ---------- qv.js: просмотр товара для главной (те же куски кода, что и в каталоге) ----------
src = rd('catalog.src.js')
def cut(a, z):
    i = src.index(a); j = src.index(z, i)
    return src[i:j]
qv_parts = [
    cut('  var API=', '  /* ---------- фильтрация ---------- */'),   # константы, утилиты, данные
    cut('  function partName', '  function match('),
    cut('  function cartProducts()', '  var STP='),                  # состояние корзины Тильды
    cut('  function fly(b){', '  /* быстрое добавление с карточки */'),  # добавление в корзину
    cut('  /* ---------- просмотрщик ---------- */', '  /* ---------- сортировка шторкой'),  # шторка товара, просмотр фото, свайпы
]
qv_pre = """(function(){
  'use strict';
  /* Автоматически собирается из catalog.src.js скриптом build.py (python build.py). Вручную не править. */
  window.MV=window.MV||{};
  // разметка шторки и подсказки (в каталоге она лежит в самой странице)
  (function(){
    var host=document.querySelector('.site')||document.body;
    if(!document.getElementById('qv')){var q=document.createElement('div');q.className='qv';q.id='qv';q.hidden=true;q.setAttribute('role','dialog');q.setAttribute('aria-modal','true');q.setAttribute('aria-label','Просмотр товара');q.tabIndex=-1;host.appendChild(q)}
    if(!document.getElementById('toast')){var t=document.createElement('div');t.className='toast';t.id='toast';t.setAttribute('role','status');t.setAttribute('aria-live','polite');host.appendChild(t)}
  })();
"""
qv_mid = """
  /* ---------- склейка с главной страницей ---------- */
  API.rec='1278451251'; // блок магазина на главной
  var curList=[];
  function paintCards(){}
  function updBadge(){}
  var cartEl=$('cart');
  function bump(){if(!cartEl)return;cartEl.classList.remove('bump');void cartEl.offsetWidth;cartEl.classList.add('bump')}
  function openCart(){if(window.tcart__openCart)tcart__openCart();else if(document.querySelector('.t706__carticon'))document.querySelector('.t706__carticon').click()}
"""
qv_post = """
  var loading=null;
  function ready(){
    if(loading)return loading;
    loading=loadAll().then(function(all){
      items=all.map(norm);items.forEach(function(i){byUid[i.uid]=i});curList=items.slice();
    }).catch(function(e){loading=null;throw e});
    return loading;
  }
  MV.qvReady=ready;
  MV.qvOpen=function(uid){return ready().then(function(){if(!byUid[uid])throw new Error('нет товара');openQV(String(uid))})};
  ready().catch(function(){});
})();
"""
# предобъявления нужны до кода, который их использует: curList и пр. кладём перед блоком корзины
qv_js = qv_pre + qv_parts[0] + qv_mid + ''.join(qv_parts[1:]) + qv_post
wr('qv.js', qv_js)


# ---------- members.css: стили кабинета и входа, действуют только на страницах Members ----------
SCOPE = ':where(html:has([class*="tmst-"], .tlk-form, .tlk-resources__wrap))'
def scope_selector(sel):
    sel = sel.strip()
    if sel in ('html',':root'): return SCOPE
    if sel == 'body': return SCOPE + ' body'
    return SCOPE + ' ' + sel
def scope_css(css):
    out = []; i = 0; n = len(css)
    while i < n:
        # пропускаем пробелы и комментарии
        if css[i].isspace(): out.append(css[i]); i += 1; continue
        if css.startswith('/*', i):
            j = css.index('*/', i) + 2; out.append(css[i:j]); i = j; continue
        if css.startswith('@import', i):
            m = re.compile(r'@import\s+url\("[^"]*"\)[^;]*;').match(css, i)
            j = m.end(); out.append(css[i:j]); i = j; continue
        j = css.index('{', i); head = css[i:j]; depth = 1; k = j + 1
        while depth:
            c = css[k]
            if c == '{': depth += 1
            elif c == '}': depth -= 1
            k += 1
        body = css[j+1:k-1]
        if head.strip().startswith('@'):
            out.append(head + '{' + scope_css(body) + '}')
        else:
            sels = [s for s in head.split(',') if s.strip()]
            out.append(', '.join(scope_selector(s) for s in sels) + '{' + body + '}')
        i = k
    return ''.join(out)
wr('members.css', scope_css(rd('members.src.css')))

# ---------- готовые блоки T123 ----------
def inline(css_files, html, js, extra_head=''):
    css = ''
    font = None
    for f in css_files:
        c = rd(f)
        m = re.search(r'@import url\("([^"]+)"\);\n?', c)
        if m: font = font or m.group(1); c = c.replace(m.group(0), '')
        css += c + '\n'
    return ('<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
            '<link rel="stylesheet" href="%s">\n<style>%s</style>\n\n%s\n\n<script>%s</script>\n') % (font, css, html, js)

wr('dist/miraven-tilda-T123.html', inline(['miraven.css'], home_html.replace('{{BASE}}', base), home_js))
cat_inline = inline(['miraven.css', 'catalog.css'], catalog_html.replace('{{BASE}}', base).replace('{{HOME}}', home), 'window.MV_HOME=%r;\n' % home + cjs)
wr('dist/catalog-tilda-T123.html', cat_inline)
wr('dist/footer-tilda-T123.html', inline(['footer.css'], rd('footer.html').replace('{{BASE}}', base), ''))
print('ok; logos from', base, '; home =', home)
