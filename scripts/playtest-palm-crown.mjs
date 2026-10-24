// Inspect actual game geometry/materials from the side and above. Isolated
// model views supplement the normal driving views; they do not score a world.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,devices} from 'playwright';
import {PNG} from 'pngjs';
const label=process.env.PALM_LABEL;assert.match(label??'',/^[a-z0-9-]+$/);
const mobile=process.env.PALM_DEVICE==='mobile',out=`artifacts/palm-crown-${label}`;await mkdir(out);
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']}),context=await browser.newContext({...mobile?devices['Pixel 7']:{},viewport:mobile?{width:844,height:390}:{width:1024,height:768},recordVideo:{dir:out,size:mobile?{width:844,height:390}:{width:1024,height:768}}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));window.palmObjects=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',e=>palmObjects.push(e.detail));});
try{
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:4191')+'/?test=1');
 const bundle=await page.locator('script[type=module][src]').getAttribute('src'),world=[];
 for(const state of ['field-verge','grass-verge','cinematic']){
  await page.evaluate(async state=>{const h=window.__THREE_GAME_TEST_HOOKS__;await h.setState(state);h.setPausedForScreenshot(true);h.setReducedMotion(true);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));},state);
  await page.screenshot({path:`${out}/world-${state}.png`,scale:'css'});world.push({state,renderer:await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__.renderer)});
 }
 await page.addStyleTag({content:'#app :not(#game-canvas){visibility:hidden!important}'});
 const geometry=await page.evaluate(()=>{
  const scene=palmObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape')),renderer=palmObjects.find(o=>o.isWebGLRenderer),group=scene.getObjectByName('Wind moving palm fronds'),trunks=scene.getObjectByName('Curved palm trunks'),near=group.children[0],far=group.children[1],trunk=trunks.children[0];
  renderer.shadowMap.enabled=false;scene.children.forEach(o=>o.visible=Boolean(o.isLight));scene.background=near.material.color.clone().set(0x899295);
  const previews=[near,trunk].map(source=>{const mesh=new source.constructor(source.geometry,source.material,1),matrix=source.userData.authoredInstances[0].clone().identity();mesh.setMatrixAt(0,matrix);if(source.instanceColor)mesh.setColorAt(0,source.material.color.clone().set('#c6cca6'));mesh.instanceMatrix.needsUpdate=true;mesh.frustumCulled=false;scene.add(mesh);return mesh;});
  window.palmPreview={scene,renderer,near,far,trunk,previews,eye:[13,8,15]};scene.onBeforeRender=(_r,_s,camera)=>{camera.position.set(...palmPreview.eye);camera.lookAt(.65,6.6,0);camera.updateMatrixWorld();};
  const data=source=>{const g=source.geometry;g.computeBoundingBox();const p=g.getAttribute('position'),n=g.getAttribute('normal');return{triangles:g.index?g.index.count/3:p.count/3,bounds:{min:g.boundingBox.min.toArray(),max:g.boundingBox.max.toArray()},finite:Array.from(p.array).every(Number.isFinite)&&Array.from(n.array).every(Number.isFinite)};};
  return{near:data(near),far:data(far),trunk:data(trunk)};
 });
 for(const lod of ['near','far'])for(const [name,eye] of [['front',[13,8,15]],['side',[-16,7,2]],['back',[-9,8,-16]],['above',[4,22,3]]]){
  await page.evaluate(async({lod,eye})=>{palmPreview.eye=eye;palmPreview.previews[0].geometry=palmPreview[lod].geometry;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));},{lod,eye});
  await page.screenshot({path:`${out}/${lod}-${name}.png`,scale:'css'});
 }
 const distanceSamples=[];
 for(const distance of [130,250])for(const lod of ['near','far']){
  await page.evaluate(async({distance,lod})=>{palmPreview.eye=[.65,7.8,distance];palmPreview.previews[0].geometry=palmPreview[lod].geometry;palmPreview.previews[1].visible=false;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));},{distance,lod});
  const png=PNG.sync.read(await page.screenshot({path:`${out}/${lod}-distance-${distance}.png`,scale:'css'}));let pixels=0;
  for(let i=0;i<png.data.length;i+=4)if(Math.max(...[0,1,2].map(c=>Math.abs(png.data[i+c]-png.data[c])))>8)pixels++;
  distanceSamples.push({distance,lod,pixels});
 }
 await page.evaluate(async()=>{palmPreview.eye=[10,9,12];palmPreview.previews[0].geometry=palmPreview.near.geometry;palmPreview.previews[1].visible=true;window.__THREE_GAME_TEST_HOOKS__.setReducedMotion(false);window.__THREE_GAME_TEST_HOOKS__.setPausedForScreenshot(false);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
 const start=await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__.elapsed),before=PNG.sync.read(await page.screenshot({path:`${out}/wind-before.png`,scale:'css'}));await page.waitForTimeout(3200);const after=PNG.sync.read(await page.screenshot({path:`${out}/wind-after.png`,scale:'css'})),end=await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__.elapsed);
 let changed=0;for(let i=0;i<before.data.length;i+=4)if(Math.max(...[0,1,2].map(c=>Math.abs(before.data[i+c]-after.data[i+c])))>8)changed++;
 const result={bundle,mobile,geometry,world,distanceSamples,motionSeconds:end-start,changedPixels:changed,errors};await writeFile(`${out}/result.json`,JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify({out,...result}));
 assert.deepEqual(errors,[]);assert.ok(geometry.near.finite&&geometry.far.finite);assert.ok(end-start>2.5&&changed>20,'actual fronds must move with a fixed model camera');
}catch(error){await writeFile(`${out}/failure.json`,JSON.stringify({error:String(error),errors},null,2),{flag:'wx'});throw error;}finally{await context.close();await browser.close();}
