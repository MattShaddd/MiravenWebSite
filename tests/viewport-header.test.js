const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const home=fs.readFileSync(require.resolve('../miraven.js'),'utf8').replace(/\r\n/g,'\n');
const source=home.slice(home.indexOf('/* Начало общего закрепления'),home.indexOf('/* Конец общего закрепления'));
function harness(ios=true){
  const handlers={},styles={},classes=new Set(),frames=[],spacers=[];
  const mq={matches:true};
  const vp={scale:1,offsetTop:0,addEventListener(n,f){handlers[n]=f},removeEventListener(n){delete handlers[n]}};
  const top={isConnected:true,classList:{toggle(n,on){on?classes.add(n):classes.delete(n)},remove(n){classes.delete(n)}},style:{setProperty(n,v){styles[n]=v},removeProperty(n){delete styles[n]}},parentNode:{insertBefore(s){spacers.push(s)}},getBoundingClientRect(){return{height:59,bottom:59+parseFloat(styles['--mv-vtop']||0)}}};
  const root={};
  const rootClasses=new Set();
  const context={window:{visualViewport:vp,matchMedia:()=>mq,addEventListener(){},removeEventListener(){}},navigator:{userAgent:ios?'iPhone':'Android'},document:{createElement(){return{style:{},setAttribute(){},remove(){this.removed=true}}},documentElement:{classList:{toggle(n,on){on?rootClasses.add(n):rootClasses.delete(n)},remove(n){rootClasses.delete(n)}},style:{setProperty(n,v){root[n]=v}}}},requestAnimationFrame(f){frames.push(f);return frames.length},cancelAnimationFrame(){}};
  vm.runInNewContext(source,context);
  return{...context,top,classes,styles,spacers,root,rootClasses,vp,mq,handlers,flush(){frames.splice(0).forEach(f=>f())}};
}
const h=harness();h.window.MVViewportHeader.mount(h.top,true);
assert.ok(h.classes.has('mv-viewport-header'));assert.equal(h.spacers.length,1);
assert.ok(h.rootClasses.has('mv-ios-catalog'));
h.vp.offsetTop=34;h.handlers.scroll();h.flush();
assert.equal(h.styles['--mv-vtop'],'34px');assert.equal(h.root['--hdr'],'93px');
h.vp.scale=2;h.handlers.resize();h.flush();assert.equal(h.styles['--mv-vtop'],'0px');
h.window.MVViewportHeader.mount(null);assert.equal(h.spacers[0].removed,true);assert.equal(h.classes.size,0);
assert.equal(h.rootClasses.size,0);
const android=harness(false);android.window.MVViewportHeader.mount(android.top,true);assert.equal(android.classes.size,0);assert.equal(android.spacers.length,0);
assert.ok(fs.readFileSync(require.resolve('../catalog.js'),'utf8').includes(source));
console.log('viewport-header: ok');
