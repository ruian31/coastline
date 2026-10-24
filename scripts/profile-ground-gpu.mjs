// Frozen, actual terrain views; run the committed and candidate URLs separately.
// GPU timers measure this host's renderer, never physical phone performance.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,devices} from 'playwright';

const label=process.env.GROUND_LABEL;assert.match(label??'',/^[a-z0-9-]+$/);
const states=(process.env.GROUND_STATES??'grass-verge,tunnel-exit,shore-side').split(',');assert.ok(states.length>0&&states.every(state=>/^[a-z0-9-]+$/.test(state)));
const out=`artifacts/ground-gpu-${label}`;await mkdir(out);
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']});
const page=await browser.newPage({...devices['Pixel 7'],viewport:{width:844,height:390}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(()=>{
 localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));
 window.groundObjects=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',e=>groundObjects.push(e.detail));
});
try{
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:4191')+'/?test=1');
 const bundle=await page.locator('script[type=module][src]').getAttribute('src'),samples=[];
 for(const state of states){
  await page.evaluate(async state=>{const h=window.__THREE_GAME_TEST_HOOKS__;await h.setState(state);h.setPausedForScreenshot(true);h.setReducedMotion(true);},state);
  const sample=await page.evaluate(async()=>{
   const renderer=groundObjects.find(o=>o.isWebGLRenderer),gl=renderer.getContext(),ext=gl.getExtension('EXT_disjoint_timer_query_webgl2');
   if(!ext)return {supported:false};
   const frames=n=>new Promise(resolve=>{let i=0;function tick(){if(++i<n)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});await frames(60);
   const original=renderer.render,pending=[],times=[];let issued=0,disjoint=false;
   renderer.render=function(scene,camera){
    if(issued>=90)return original.call(this,scene,camera);
    const q=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,q);
    try{return original.call(this,scene,camera);}finally{gl.endQuery(ext.TIME_ELAPSED_EXT);pending.push(q);issued++;}
   };
   try{
    for(let i=0;i<270&&times.length<90;i++){
     await frames(2);if(gl.getParameter(ext.GPU_DISJOINT_EXT)){disjoint=true;break;}
     while(pending.length&&gl.getQueryParameter(pending[0],gl.QUERY_RESULT_AVAILABLE)){const q=pending.shift();times.push(gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6);gl.deleteQuery(q);}
    }
   }finally{renderer.render=original;pending.forEach(q=>gl.deleteQuery(q));}
   times.sort((a,b)=>a-b);const debug=gl.getExtension('WEBGL_debug_renderer_info');
   return {supported:true,disjoint,count:times.length,gpuP50:times[Math.floor(times.length*.5)],gpuP95:times[Math.floor(times.length*.95)],mean:times.reduce((a,b)=>a+b,0)/times.length,renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),diagnostics:window.__THREE_GAME_DIAGNOSTICS__.renderer};
  });
  samples.push({state,...sample});console.log(JSON.stringify(samples.at(-1)));
  assert.equal(sample.supported,true,'GPU timers required for this comparison');assert.equal(sample.disjoint,false);assert.equal(sample.count,90);
 }
 assert.deepEqual(errors,[]);await writeFile(`${out}/result.json`,JSON.stringify({bundle,environment:'RTX4050 hardware GPU timer; Android 844×390 low tier; frozen actual views; not phone hardware',samples,errors},null,2),{flag:'wx'});
}finally{await browser.close();}
