// Same frozen camera, current geometry/material and authored transforms. The
// control restores full-prefix drawing with an aggregate sphere, not an old build.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {PNG} from 'pngjs';
import {chromium,devices} from 'playwright';
const label=process.env.FERN_LABEL??String(Date.now());assert.match(label,/^[a-z0-9-]+$/);const out=`artifacts/fern-culling-${label}`;await mkdir(out);
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']}),page=await browser.newPage({...devices['Pixel 7'],viewport:{width:844,height:390}}),errors=[],comparisons=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));window.fernObjects=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',e=>fernObjects.push(e.detail));});
try{
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:4191')+'/?test=1');
 for(const state of ['active-play','rock-back']){
  await page.evaluate(async state=>{const h=window.__THREE_GAME_TEST_HOOKS__;await h.setState(state);h.setPausedForScreenshot(true);h.setReducedMotion(true);document.querySelector('#app').style.visibility='hidden';document.querySelector('#game-canvas').style.visibility='visible';},state);
  const samples=[];
  for(const control of [false,true]){
   const sample=await page.evaluate(async control=>{
    const scene=fernObjects.find(o=>o.isScene&&o.getObjectByName('Scanned coastal ferns')),root=scene.getObjectByName('Scanned coastal ferns'),renderer=fernObjects.find(o=>o.isWebGLRenderer);
    if(!window.fernCullingControl){
     const sources=root.children.slice(),copies=sources.map(source=>{const matrices=source.userData.authoredInstances,copy=new source.constructor(source.geometry,source.material,matrices.length);matrices.forEach((m,i)=>copy.setMatrixAt(i,m));copy.instanceMatrix.needsUpdate=true;copy.computeBoundingSphere();copy.count=Math.max(1,Math.floor(matrices.length*.5));copy.visible=false;copy.receiveShadow=source.receiveShadow;root.add(copy);return copy;});window.fernCullingControl={sources,copies};
    }
    const {sources,copies}=window.fernCullingControl;sources.forEach(s=>s.visible=!control);copies.forEach(c=>c.visible=control);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    return {control,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,sourceCounts:sources.map(s=>s.count),fullPrefixCounts:copies.map(c=>c.count)};
   },control);samples.push(sample);await page.screenshot({path:`${out}/${state}-${control?'full-prefix':'culled'}.png`,scale:'css'});
  }
  const a=PNG.sync.read(await readFile(`${out}/${state}-culled.png`)),b=PNG.sync.read(await readFile(`${out}/${state}-full-prefix.png`));let changedPixels=0;for(let i=0;i<a.data.length;i+=4)if(Math.max(...[0,1,2].map(c=>Math.abs(a.data[i+c]-b.data[i+c])))>8)changedPixels++;
  comparisons.push({state,samples,savedTriangles:samples[1].triangles-samples[0].triangles,changedPixels});
  await page.evaluate(()=>{const {sources,copies}=window.fernCullingControl;sources.forEach(s=>s.visible=true);copies.forEach(c=>{c.removeFromParent();c.dispose();});delete window.fernCullingControl;});
 }
 const result={bundle:await page.locator('script[type=module][src]').getAttribute('src'),kind:'Frozen Android viewport on host GPU; same current geometry/material and authored full-prefix transforms, comparing per-instance culling with aggregate-sphere drawing; not phone FPS or an exact old-build comparison',comparisons,errors};await writeFile(`${out}/result.json`,JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify(result));assert.deepEqual(errors,[]);assert.ok(comparisons.some(c=>c.savedTriangles>0));assert.ok(comparisons.every(c=>c.savedTriangles>=0&&c.changedPixels===0),'per-instance culling must preserve visible canvas pixels');
}finally{await browser.close();}
