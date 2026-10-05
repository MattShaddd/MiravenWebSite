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

console.log('product-card: ok');
