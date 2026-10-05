const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function element(){
  const classes=new Set(),children=new Map();
  return {style:{},hidden:true,scrollLeft:0,clientWidth:390,
    classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c),toggle(c,on){if(on)classes.add(c);else classes.delete(c)}},
    setAttribute(){},addEventListener(){},focus(){},getBoundingClientRect(){return{width:390,height:844}},
    querySelector(selector){if(!children.has(selector))children.set(selector,element());return children.get(selector)},
    querySelectorAll(){return[]},scrollTo({left}){this.scrollLeft=left}
  };
}
let site={inert:false};
const html={style:{overflow:''}};
const context={window:{matchMedia:()=>({matches:false})},document:{
  documentElement:html,head:{appendChild(){}},body:{appendChild(){}},
  querySelector(selector){return selector==='.site'?site:null},createElement:element,addEventListener(){}
},requestAnimationFrame:fn=>fn(),setTimeout:fn=>fn()};
vm.runInNewContext(fs.readFileSync(require.resolve('../image-viewer.js'),'utf8'),context);
const viewer=context.window.MVImageViewer;

// Duplicate open requests must not replace the original scroll-lock state.
viewer.open({items:['a.jpg','b.jpg']});
viewer.open({items:['a.jpg','b.jpg'],index:1});
viewer.close();
assert.equal(html.style.overflow,'');
assert.equal(site.inert,false);

// A viewer opened over a product dialog preserves that dialog's scroll lock.
html.style.overflow='hidden';
viewer.open({items:['a.jpg']});viewer.close();
assert.equal(html.style.overflow,'hidden');

// The module survives navigation, but must use the new page's background.
const oldSite=site;site={inert:false};html.style.overflow='';
viewer.open({items:['a.jpg']});
assert.equal(site.inert,true);
assert.equal(oldSite.inert,false);
viewer.close();assert.equal(site.inert,false);
console.log('image-viewer: ok');
