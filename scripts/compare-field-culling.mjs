// Compare the same field before/after broad-phase culling and prefix uploads.
// Both builds must contain the same scenery, materials and LOD budgets.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {PNG} from 'pngjs';
import {chromium,devices} from '@playwright/test';

const label=process.env.FIELD_LABEL??String(Date.now());assert.match(label,/^[a-z0-9-]+$/);
const out=`artifacts/field-culling-${label}`;await mkdir(out);
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']}),samples=[],errors=[];
try{
 for(const [variant,url] of [['before',process.env.FIELD_BEFORE_URL??'http://127.0.0.1:4192'],['cells',process.env.TEST_BASE_URL??'http://127.0.0.1:4191']]){
  const context=await browser.newContext({...devices['Pixel 7'],viewport:{width:844,height:390}}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));window.fieldObjects=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',e=>fieldObjects.push(e.detail));});
  try{
   await page.goto(url+'/?test=1');const bundle=await page.locator('script[type=module][src]').getAttribute('src');
   for(const state of ['grass-verge','field-verge','rock-back','cinematic','tree-shadow']){
    const sample=await page.evaluate(async state=>{
     const h=window.__THREE_GAME_TEST_HOOKS__;await h.setState(state);h.setSceneTime(30);h.setReducedMotion(true);
     document.querySelector('#app').style.visibility='hidden';document.querySelector('#game-canvas').style.visibility='visible';await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r))));
     const renderer=fieldObjects.find(o=>o.isWebGLRenderer),scene=fieldObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape')),root=scene.getObjectByName('Coastal landscape');
     return{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,field:{...root.userData.fieldGrassDetail},road:{...root.userData.grassDetail}};
    },state);
    await page.screenshot({path:`${out}/${variant}-${state}.png`,scale:'css'});samples.push({variant,state,bundle,...sample});
   }
  }finally{await context.close();}
 }
 const comparisons=[];
 for(const state of ['grass-verge','field-verge','rock-back','cinematic','tree-shadow']){
  const before=PNG.sync.read(await readFile(`${out}/before-${state}.png`)),after=PNG.sync.read(await readFile(`${out}/cells-${state}.png`));let changedPixels=0,differentPixels=0,maxChannelDelta=0;
  assert.equal(before.width,after.width);assert.equal(before.height,after.height);
  for(let i=0;i<before.data.length;i+=4){const delta=Math.max(...[0,1,2].map(c=>Math.abs(before.data[i+c]-after.data[i+c])));if(delta>8)changedPixels++;if(delta>0)differentPixels++;maxChannelDelta=Math.max(maxChannelDelta,delta);}
  comparisons.push({state,changedPixels,differentPixels,maxChannelDelta});
 }
 await writeFile(`${out}/result.json`,JSON.stringify({kind:'Frozen actual Android landscape views on host GPU; identical authoring and materials, before/after 32m-cell broad phase and visible-prefix buffer uploads. Not phone FPS.',samples,comparisons,errors},null,2),{flag:'wx'});console.log(JSON.stringify({out,samples,comparisons,errors}));
 assert.deepEqual(errors,[]);assert.ok(comparisons.every(c=>c.changedPixels===0&&c.maxChannelDelta<=1));
 for(const s of samples.filter(s=>s.variant==='before')){const other=samples.find(v=>v.variant==='cells'&&v.state===s.state);assert.equal(other.calls,s.calls);assert.equal(other.triangles,s.triangles);}
}finally{await browser.close();}
