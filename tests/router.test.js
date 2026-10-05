const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../miraven.js'),'utf8').replace(/\r\n/g,'\n');
const router=source.slice(source.indexOf('  /* Бесшовный переход'),source.indexOf('  // Production Tilda loader'));
const listeners={},requests=[];
const location={pathname:'/newmain',hash:'',href:'https://miraven.ru/newmain',origin:'https://miraven.ru'};
const context={URL,location,history:{},document:{
  addEventListener(name,fn){listeners[name]=fn},
  getElementById(){return{}},
},fetch(url){requests.push(url);return Promise.resolve({ok:false})}};
context.window={addEventListener(name,fn){listeners[name]=fn}};
vm.runInNewContext(router,context);
function click(href,extra={}){
  let prevented=false;
  listeners.click({target:{closest:()=>({href,target:'',hasAttribute:()=>false})},preventDefault(){prevented=true},stopImmediatePropagation(){},...extra});
  return prevented;
}

// Product history must be handled by the product viewer, not rebuild the page.
location.hash='#p-42';listeners.popstate();
assert.equal(requests.length,0);
assert.equal(click('https://miraven.ru/newstore#p-42'),false);
assert.equal(click('https://miraven.ru/newmain#reviews'),false);
assert.equal(click('https://miraven.ru/newstore',{ctrlKey:true}),false);
assert.equal(click('https://miraven.ru/newstore'),true);
assert.equal(requests.length,7);
assert.ok(requests.some(url=>url.endsWith('product-card.css')));

// A directly opened catalog gets exactly the same route implementation.
assert.ok(fs.readFileSync(require.resolve('../catalog.js'),'utf8').replace(/\r\n/g,'\n').includes(router));
console.log('router: ok');
