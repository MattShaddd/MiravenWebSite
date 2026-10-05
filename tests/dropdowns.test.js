const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync('dropdowns.css','utf8');
for(const selector of ['.mv-dropdown','.mv-dropdown__item','.tcart-select__options','.tcart-select__option','.searchbox-list','.tlk-select-custom__options','[role="listbox"]','[role="option"]'])assert.ok(css.includes(selector),selector);
assert.ok(fs.readFileSync('members.css','utf8').includes(css),'Members includes the shared module');
assert.ok(fs.readFileSync('dist/catalog-tilda-T123.html','utf8').includes(css),'Catalog build includes the same module');
assert.ok(css.includes('var(--white,var(--m-bg'),'Shop and Members theme adapters');
console.log('dropdowns: ok');
