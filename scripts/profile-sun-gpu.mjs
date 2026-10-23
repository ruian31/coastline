import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,devices} from 'playwright';

const label=process.env.SUN_LABEL??String(Date.now());assert.match(label,/^[a-z0-9-]+$/);
const dir=`artifacts/static-sun-gpu-${label}`;await mkdir(dir);
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']});
const context=await browser.newContext({...devices['Pixel 7'],viewport:{width:844,height:390}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));window.sunObjects=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',e=>window.sunObjects.push(e.detail));});
try{
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:4191')+'/?test=1');
 const samples=[];
 for(const state of['active-play','tree-shadow','rock-back']){
  await page.evaluate(async state=>{const h=window.__THREE_GAME_TEST_HOOKS__;await h.setState(state);h.setPausedForScreenshot(true);h.setReducedMotion(true);},state);
  for(const enabled of[false,true,false,true]){
   const result=await page.evaluate(async enabled=>{
    const renderer=window.sunObjects.find(o=>o.isWebGLRenderer),scene=window.sunObjects.find(o=>o.isScene&&o.userData.sunShadows),sun=scene.getObjectByName('Cached golden-hour world sun'),gl=renderer.getContext(),ext=gl.getExtension('EXT_disjoint_timer_query_webgl2');
    if(!ext)return{supported:false};
    sun.castShadow=enabled;renderer.shadowMap.enabled=enabled;
    const frames=number=>new Promise(resolve=>{let count=0;function tick(){if(++count<number)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});
    await frames(60);
    const original=renderer.render,pending=[],times=[];let issued=0,disjoint=false;
    renderer.render=function(scene,camera){
     if(issued>=120)return original.call(this,scene,camera);
     const query=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,query);
     try{return original.call(this,scene,camera);}finally{gl.endQuery(ext.TIME_ELAPSED_EXT);pending.push(query);issued++;}
    };
    try{
     for(let i=0;i<360&&times.length<120;i++){
      await frames(2);
      if(gl.getParameter(ext.GPU_DISJOINT_EXT)){disjoint=true;break;}
      while(pending.length&&gl.getQueryParameter(pending[0],gl.QUERY_RESULT_AVAILABLE)){
       const query=pending.shift();times.push(gl.getQueryParameter(query,gl.QUERY_RESULT)/1e6);gl.deleteQuery(query);
      }
     }
    }finally{renderer.render=original;for(const query of pending)gl.deleteQuery(query);}
    times.sort((a,b)=>a-b);
    return{supported:true,enabled,disjoint,count:times.length,gpuP50:times[Math.floor(times.length*.5)],gpuP95:times[Math.floor(times.length*.95)],mean:times.reduce((a,b)=>a+b,0)/times.length,draws:renderer.info.render.calls,triangles:renderer.info.render.triangles,textures:renderer.info.memory.textures};
   },enabled);
   samples.push({state,...result});console.log(JSON.stringify(samples.at(-1)));
   if(!result.supported)break;
   assert.equal(result.disjoint,false);assert.equal(result.count,120);
  }
 }
 assert.deepEqual(errors,[]);await writeFile(`${dir}/samples.json`,JSON.stringify({environment:'Desktop RTX4050 GPU timer, Android 844×390 low tier at DPR1; not phone hardware',samples,errors},null,2));
}finally{await context.close();await browser.close();}
