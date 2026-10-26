// Exercise actual late TextureLoader completions after Scenery.dispose().
// Uses the local Vite source entry, not a production performance measurement.
import {chromium} from 'playwright';
import {mkdir,readFile,writeFile,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const label=process.env.SCENERY_LIFECYCLE_LABEL??'m52',origin=process.env.SCENERY_SOURCE_URL??'http://127.0.0.1:5188';
assert.match(label,/^[a-z0-9-]+$/);assert.ok(['127.0.0.1','localhost'].includes(new URL(origin).hostname));
const out=`artifacts/scenery-lifecycle-${label}`,harness=`work/scenery-lifecycle-${label}.html`;
await mkdir(out,{recursive:true});await mkdir('work',{recursive:true});
await writeFile(harness,`<!doctype html><script type="module">
import * as THREE from 'three';
import {createScenery} from '/src/world/Scenery.ts';
const completions=[],load=THREE.TextureLoader.prototype.load;
THREE.TextureLoader.prototype.load=function(url,onLoad,onProgress,onError){return load.call(this,url,texture=>{
 if(/palm-bark-|coastal-field-v1-|meadow-surface/.test(url))completions.push(url);
 onLoad?.(texture);
},onProgress,onError);};
const scene=new THREE.Scene(),scenery=createScenery(scene,true),terrain=scene.getObjectByName('Limestone headland and grassy interior');
const shader={uniforms:{},vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader};
terrain.material.onBeforeCompile(shader,null);
window.lifecycleProbe={dispose:()=>scenery.dispose(),ready:scenery.ready,scene,available:shader.uniforms.uFieldAvailable,completions};
</script>`);
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage(),errors=[],held=[];
let release;const gate=new Promise(resolve=>release=resolve);
page.on('pageerror',e=>errors.push(e.message));
await page.route(url=>/\/(palm-bark-color\.jpg|palm-bark-surface\.webp|coastal-field-v1-512\.webp|meadow-surface\.webp)$/.test(url.pathname),async route=>{held.push(new URL(route.request().url()).pathname);await gate;await route.continue();});
try{
 // These intentionally held images also delay the document's load event.
 await page.goto(origin+'/'+harness,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>Boolean(window.lifecycleProbe));
 const deadline=Date.now()+10000;while(held.length<4&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,50));
 assert.equal(held.length,4,'hold both bark and field images before disposal');
 const before=await page.evaluate(()=>({available:window.lifecycleProbe.available.value,children:window.lifecycleProbe.scene.children.length}));
 assert.equal(before.available,0);assert.ok(before.children>0);
 await page.evaluate(()=>window.lifecycleProbe.dispose());release();
 const after=await page.evaluate(async()=>{
  const p=window.lifecycleProbe;await Promise.race([p.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('Disposed scenery readiness did not settle')),10000))]);
  const deadline=performance.now()+5000;while(p.completions.length<4&&performance.now()<deadline)await new Promise(resolve=>setTimeout(resolve,20));
  return{available:p.available.value,children:p.scene.children.length,readySettled:true,completed:p.completions.length};
 });
 await page.waitForTimeout(200);assert.deepEqual(after,{available:0,children:0,readySettled:true,completed:4});assert.deepEqual(errors,[]);
 const sources={};for(const file of ['src/world/Scenery.ts','src/world/GroundMaterial.ts'])sources[file]=createHash('sha256').update(await readFile(file)).digest('hex');
 await writeFile(out+'/result.json',JSON.stringify({environment:'Local Vite source in Chrome; no renderer created. Actual delayed TextureLoader responses and all scenery readiness promises.',held,before,after,sources,errors},null,2));console.log({held:held.length,before,after,errors});
}catch(error){await writeFile(out+'/failure.json',JSON.stringify({message:error.message,held,errors},null,2));throw error;}
finally{release();await browser.close();await unlink(harness);}
