const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const head={appendChild(){}};
global.window=global;
global.document={
  querySelector(){return null},
  createElement(){return{setAttribute(){},remove(){}}},
  head
};
global.localStorage={getItem(){return null}};

vm.runInThisContext(fs.readFileSync(require.resolve('../product-card.js'),'utf8'));
const card=window.MVProductCard;
const item={uid:'42',title:'Открытка',sold:false,multi:false,qty:5};
const esc=value=>value;

assert.match(card.control(item,esc,'<svg></svg>'),/<button class="add"/);
window.tcart={products:[{lid:'42',quantity:2,price:150}],total:2};
assert.match(card.control(item,esc,'<svg></svg>'),/class="add stp/);
assert.match(card.control(item,esc,'<svg></svg>'),/<b>2<\/b>/);
assert.equal(card.minus(item),true);
assert.equal(window.tcart.products[0].quantity,1);
assert.equal(window.tcart.total,1);
assert.equal(window.tcart.amount,150);
const rendering={esc,fmt:String,image:src=>src,plus:'<svg></svg>',type:'Открытка'};
for(const layout of ['rail','grid']){
  const html=card.markup({...item,price:150,img:'photo.jpg'}, {...rendering,layout});
  assert.match(html,/href="#p-42"/);
  assert.match(html,/data-uid="42"/);
  assert.match(html,/class="add stp/);
  assert.match(html,/<b>1<\/b>/);
  assert.equal((html.match(/class="add /g)||[]).length,1);
}
let refreshed=0;
const active={isConnected:true};
card.watch(active,()=>refreshed++);
card.watch({isConnected:false},()=>{throw new Error('detached page refreshed')});
card.refresh();assert.equal(refreshed,1);
active.isConnected=false;card.refresh();assert.equal(refreshed,1);

// First add can detach the source button and the desktop floating cart is hidden.
// Feedback must use the captured rectangle and fall back to a rendered target.
global.navigator={vibrate(){}};
global.matchMedia=()=>({matches:false});
global.requestAnimationFrame=callback=>callback();
let frames,dot,finished=0;
document.querySelector=()=>({getBoundingClientRect:()=>({width:0,height:0})});
document.getElementById=()=>({getBoundingClientRect:()=>({left:500,top:50,width:44,height:44})});
document.body={animate(){},appendChild(){}};
document.createElement=()=>dot={style:{},remove(){},animate(value){frames=value;return this}};
card.feedback({left:10,top:20,width:40,height:40},()=>finished++);
assert.equal(dot.style.left,'30px');
assert.equal(dot.style.top,'40px');
assert.match(frames.at(-1).transform,/translate\(491\.999|translate\(492px/);
dot.onfinish();
assert.equal(finished,1);

// Reduced motion still gives completion feedback without a flight.
frames=null;
global.matchMedia=()=>({matches:true});
card.feedback({left:10,top:20,width:40,height:40},()=>finished++);
assert.equal(frames,null);
assert.equal(finished,2);

console.log('product-card: ok');
