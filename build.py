"""Сборка сайта Миравен.

  python build.py                 собрать catalog.html и catalog.js (их нужно коммитить) + готовые блоки T123 в dist/
  python build.py BASE            то же, логотипы берутся по адресу BASE (со слэшем на конце)

Что делает:
  1. catalog.html  = шапка + подвал из miraven.html + catalog.main.html
  2. catalog.js    = catalog.src.js + блоки «вход» и «тема» из miraven.js
  3. dist/miraven-tilda-T123.html   главная одним блоком (без загрузчика)
  4. dist/catalog-tilda-T123.html   каталог одним блоком (без загрузчика)
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
footer = re.search(r'<footer class="foot">.*?</footer>', home_html, re.S).group(0)

def relink(s):
    s = s.replace('href="#catalog" class="on"', 'href="/store" class="on"')
    s = s.replace('href="#catalog"', 'href="/store"')
    for k in ('delivery', 'stores', 'about', 'reviews', 'faq'):
        s = s.replace('href="#%s"' % k, 'href="{{HOME}}#%s"' % k)
    s = s.replace('class="brand" href="#"', 'class="brand" href="{{HOME}}"')
    return s

# в мобильном меню «Каталог» — текущая страница
catalog_html = '<div class="site">\n' + relink(header) + '\n' + relink(mnav) + '\n\n' + rd('catalog.main.html') + '\n' + relink(footer) + '\n</div>\n'
wr('catalog.html', catalog_html)

# ---------- catalog.js ----------
a = home_js.index('  // вход / регистрация'); b = home_js.index('  // поиск и мобильное меню')
auth = home_js[a:b]
t = home_js.index("  var site=document.querySelector('.site'),tbtn")
theme = home_js[t:home_js.rindex('})();')]
cjs = rd('catalog.src.js').replace('/*@AUTH@*/', auth).replace('/*@THEME@*/', theme)
wr('catalog.js', cjs)

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
print('ok; logos from', base, '; home =', home)
