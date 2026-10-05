const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(require.resolve('../catalog.src.js'),'utf8');
const fn=src.slice(src.indexOf('  function resetShown('),src.indexOf('  /* ---------- вкладки'));
function check(mobile,toTop){
  const calls=[];
  const context={S:{},PAGE:24,reduce:false,mini:{classList:{contains:()=>true},offsetHeight:51},bar:{getBoundingClientRect:()=>({bottom:200})},topEl:{offsetHeight:55},grid:{getBoundingClientRect:()=>({top:230})},window:{scrollY:500,matchMedia:()=>({matches:mobile}),scrollTo(o){calls.push({...o})}},renderGrid(){calls.push('render');context.window.scrollY=100}};
  vm.runInNewContext(fn,context);context.resetShown(toTop);return calls;
}
assert.deepEqual(check(true,false),[{top:500,behavior:'instant'},'render',{top:246,behavior:'instant'}]);
assert.deepEqual(check(true,true),[{top:500,behavior:'instant'},'render',{top:0,behavior:'instant'}]);
assert.deepEqual(check(false,false),['render',{top:246,behavior:'smooth'}]);
console.log('category-scroll: ok');
