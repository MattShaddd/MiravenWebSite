"""Собирает финальный блок T123 одним файлом: dist/miraven-tilda-T123.html

Запуск:  python build.py [BASE]
BASE: адрес, где лежат логотипы. По умолчанию берётся из loader.html (GitHub Pages).
Можно указать ссылку на папку с логотипами в Тильде (со слэшем на конце).
"""
import os, re, sys

here = os.path.dirname(os.path.abspath(__file__))
rd = lambda f: open(os.path.join(here, f), encoding='utf-8').read()

base = sys.argv[1] if len(sys.argv) > 1 else re.search(r"BASE='([^']+)'", rd('loader.html')).group(1)
css = rd('miraven.css')
font = re.search(r'@import url\("([^"]+)"\);\n?', css)
css = css.replace(font.group(0), '')
html = rd('miraven.html').replace('{{BASE}}', base)
js = rd('miraven.js')

out = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    '<link rel="stylesheet" href="%s">\n<style>%s</style>\n\n%s\n\n<script>%s</script>\n'
) % (font.group(1), css, html, js)

os.makedirs(os.path.join(here, 'dist'), exist_ok=True)
open(os.path.join(here, 'dist', 'miraven-tilda-T123.html'), 'w', encoding='utf-8').write(out)
print('dist/miraven-tilda-T123.html', len(out), 'bytes; logos from', base)
