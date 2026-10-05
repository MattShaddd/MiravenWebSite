const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const home=fs.readFileSync(require.resolve('../miraven.js'),'utf8').replace(/\r\n/g,'\n');
const boot=home.slice(home.indexOf('/* Начало ранней темы.'),home.indexOf('/* Конец ранней темы. */'));
function run(saved,dark,hash='',blocked=false){
  const values={};
  vm.runInNewContext(boot,{localStorage:{getItem(){if(blocked)throw Error('blocked');return saved}},location:{hash},window:{matchMedia:()=>({matches:dark})},document:{documentElement:{setAttribute(k,v){values.root=v}},querySelectorAll(){return[{setAttribute(k,v){values.site=v}}]}}});
  assert.equal(values.root,values.site);return values.root;
}
assert.equal(run('dark',false),'dark');
assert.equal(run('beige',true),'beige');
assert.equal(run(null,true),'dark');
assert.equal(run(null,false),'beige');
assert.equal(run('invalid',true),'dark');
assert.equal(run(null,true,'',true),'dark');
assert.equal(run('beige',false,'#dark'),'dark');
const catalog=fs.readFileSync(require.resolve('../catalog.js'),'utf8');
assert.ok(catalog.startsWith(boot));
assert.ok(home.indexOf(boot)<home.indexOf('function start()'));
const css=fs.readFileSync(require.resolve('../miraven.css'),'utf8');
assert.ok(!css.includes('.site.pal-anim *'));
assert.match(css,/html\.mv-theme-change \*/);
assert.ok(!home.includes('getComputedStyle(site).backgroundColor'));
console.log('theme: ok');
