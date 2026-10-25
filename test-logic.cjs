const fs=require('fs'),vm=require('vm'),assert=require('assert');
const file=process.argv[2]||'work/topic-workflow/project/选题灵感库.html';
const src=fs.readFileSync(file,'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const backing=new Map();
function boot(){
 const els=new Map();
 const el=id=>{if(!els.has(id))els.set(id,{value:'',textContent:'',innerHTML:'',listeners:{},classList:{add(){},remove(){},toggle(){}},addEventListener(k,f){this.listeners[k]=f;},setAttribute(){}});return els.get(id);};
 const ctx={console,URL,Date,Math,JSON,String,setTimeout(){return 0},clearTimeout(){},setInterval(){return 0},clearInterval(){},localStorage:{getItem:k=>backing.get(k)||null,setItem:(k,v)=>backing.set(k,v)},document:{getElementById:el,querySelector:el,querySelectorAll:()=>[],activeElement:{tagName:'BODY'},addEventListener(){}}};
 vm.createContext(ctx);vm.runInContext(src,ctx);return {ctx,el};
}
const {ctx,el}=boot();
function add(title,url,cat='职场'){el('in-title').value=title;el('in-url').value=url;el('in-cat').value=cat;ctx.validateAndAdd();}
add('','https://example.com/a');assert.equal(ctx.USER_CARDS.length,0);
add('test','javascript:alert(1)');assert.equal(ctx.USER_CARDS.length,0);
add('test','https://');assert.equal(ctx.USER_CARDS.length,0);
add('test','https://example.com/a');assert.equal(ctx.USER_CARDS.length,1);
add('test','https://example.com/a');assert.equal(ctx.USER_CARDS.length,1);
assert.equal(boot().ctx.USER_CARDS.length,1);
add('<img src=x onerror=alert(1)>','https://example.com/b');assert(!el('wall').innerHTML.includes('<img src=x'));
assert(el('wall').innerHTML.includes('&lt;img'));
console.log('PASS: empty/invalid/duplicate inputs, storage reinitialization, escaped rendering (VM DOM simulation).');
const expected=ctx.wallData().length;
const totalCount=el('filters').innerHTML.match(/data-cat="全部"[^>]*>全部 <span class="cnt">(\d+)/);
assert(totalCount&&Number(totalCount[1])===expected,`filter total count: expected ${expected}, actual ${totalCount?.[1]}`);
console.log('PASS: filter counts include user cards.');
ctx.state.filter='生活';ctx.renderFilters();
assert(/class="filter on" data-cat="生活"[^>]*aria-selected="true"/.test(el('filters').innerHTML));
if(typeof ctx.toggleSaveIdea==='function'){
 ctx.state.filter='全部';ctx.state.current=ctx.makeCombo();ctx.toggleSaveIdea();
 assert.equal(ctx.SAVED_IDEAS.length,1);assert.equal(boot().ctx.SAVED_IDEAS.length,1);
 const first=el('wall').innerHTML.split('</article>')[0];assert(first.includes('词库灵感'));assert(!first.includes('href='));
 ctx.toggleSaveIdea();assert.equal(ctx.SAVED_IDEAS.length,0);
 ctx.toggleSaveIdea();assert.equal(ctx.SAVED_IDEAS.length,1);
 el('wall').listeners.click({target:{closest:()=>({getAttribute:()=>ctx.state.current.text})}});
 assert.equal(ctx.SAVED_IDEAS.length,0);assert.equal(boot().ctx.SAVED_IDEAS.length,0);
 console.log('PASS: favorite/cancel, no duplicate, storage reinitialization, no fake source link; filter state preserved (VM DOM simulation).');
}
