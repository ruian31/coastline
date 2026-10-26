// Isolated source factory: instrument real TextureLoader objects, including
// textures rejected before they are ever uploaded to a renderer.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {PNG} from 'pngjs';
const label=process.env.DISPOSAL_LABEL;assert.match(label??'',/^[a-z0-9-]+$/);const out=`artifacts/scrub-disposal-${label}`;await mkdir(out);
const html=`<!doctype html><link rel="icon" href="data:,"><script type="module">
import * as THREE from 'three';import {createScenery} from '/src/world/Scenery.ts';
const loaded=[],disposed=[],load=THREE.TextureLoader.prototype.load,dispose=THREE.Texture.prototype.dispose;
THREE.TextureLoader.prototype.load=function(url,...args){const texture=load.call(this,url,...args);if(url.includes('/coastal_searsia/scrub-impostor')||url.includes('/coastal_rooibos/scrub-impostor'))loaded.push({texture,url});return texture;};
THREE.Texture.prototype.dispose=function(){disposed.push(this.uuid);return dispose.call(this);};
window.probe=async early=>{const scene=new THREE.Scene(),scenery=createScenery(scene,true);if(early){while(loaded.length<2)await new Promise(r=>setTimeout(r,5));scenery.dispose();}await scenery.ready;const root=scene.getObjectByName('Coastal landscape'),detail={...root?.userData.scrubDetail},snapshot=()=>loaded.map(o=>({asset:o.url.split('/').at(-2),file:o.url.split('/').at(-1),decoded:Boolean(o.texture.image),count:disposed.filter(id=>id===o.texture.uuid).length})),before=snapshot();if(!early)scenery.dispose();return{detail,asset:root?.userData.scrubAsset,before,after:snapshot()};};window.probeReady=true;
</script>`;
await writeFile('work/scrub-disposal-probe.html',html);
const browser=await chromium.launch({channel:'chrome'}),samples=[];
try{for(const mode of ['ready','invalid-normal','failed-color','early-dispose']){
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(mode==='invalid-normal'){const png=new PNG({width:16,height:16});png.data.fill(255);await page.route('**/coastal_searsia/scrub-impostor-normals.png',route=>route.fulfill({body:PNG.sync.write(png),contentType:'image/png'}));}
 if(mode==='failed-color')await page.route('**/coastal_searsia/scrub-impostors.png',route=>route.abort());
 if(mode==='early-dispose')await page.route('**/coastal_searsia/scrub-impostor-normals.png',async route=>{await new Promise(r=>setTimeout(r,150));await route.continue();});
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:5188')+'/work/scrub-disposal-probe.html');await page.waitForFunction(()=>window.probeReady);const sample={mode,...await page.evaluate(early=>window.probe(early),mode==='early-dispose'),errors};samples.push(sample);await page.close();
 assert.deepEqual(errors,[]);assert.equal(sample.after.length,mode==='failed-color'?4:2);assert.ok(sample.after.every(o=>o.count===(o.decoded?1:0)));
 // An image request that failed never acquired decoded/GPU storage. Its local
 // loader Texture is unreachable, rather than an owned resource to release.
 if(mode==='ready')assert.ok(sample.before.every(o=>o.count===0));if(mode==='failed-color'){assert.equal(sample.asset.id,'rooibos');assert.equal(sample.detail.ready,true);assert.equal(sample.before.find(o=>o.asset==='coastal_searsia'&&o.file==='scrub-impostor-normals.png').count,1);}if(mode==='invalid-normal')assert.equal(sample.before.find(o=>o.file==='scrub-impostor-normals.png').count,1);
}await writeFile(out+'/result.json',JSON.stringify({method:'Actual source createScenery, loaded Texture identities and dispose events; no renderer or FPS measurement',samples},null,2),{flag:'wx'});console.log(JSON.stringify({out,samples}));}catch(error){await writeFile(out+'/failure.json',JSON.stringify({error:String(error),samples},null,2),{flag:'wx'});throw error;}finally{await browser.close();}
