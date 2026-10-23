import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,devices} from 'playwright';

const label=process.env.SUN_LABEL??String(Date.now()),mobile=process.env.SUN_DEVICE!=='desktop';assert.match(label,/^[a-z0-9-]+$/);
const dir=`artifacts/static-sun-${label}`;await mkdir(dir);
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']});
const context=await browser.newContext(mobile?{...devices['Pixel 7'],viewport:{width:844,height:390}}:{viewport:{width:1280,height:720}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));window.sunObjects=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',e=>window.sunObjects.push(e.detail));});
try{
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:5188')+'/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setState('active-play'));
 const before=await page.evaluate(()=>{const scene=window.sunObjects.find(o=>o.isScene&&o.userData.sunShadows),sun=scene.getObjectByName('Cached golden-hour world sun');window.sunDraws=0;scene.onBeforeRender=(_r,_s,camera)=>{window.sunCamera=camera;};scene.traverse(o=>{if(o.isMesh){const previous=o.onBeforeShadow;o.onBeforeShadow=(...args)=>{window.sunDraws++;previous.apply(o,args);};}});return{...scene.userData.sunShadows,map:sun.shadow.map.texture.uuid,matrix:sun.shadow.matrix.elements.slice(),directLights:scene.children.filter(o=>o.isDirectionalLight).length};});
 assert.ok(before.ready&&before.bakes===1&&before.bakeDraws>20);
 assert.equal(before.directLights,1,'one sun must supply all direct light at every tier');
 await page.evaluate(()=>new Promise(resolve=>{let frames=0;function tick(){if(++frames<200)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);}));
 const after=await page.evaluate(()=>{const scene=window.sunObjects.find(o=>o.isScene&&o.userData.sunShadows),sun=scene.getObjectByName('Cached golden-hour world sun');return{draws:window.sunDraws,map:sun.shadow.map.texture.uuid,matrix:sun.shadow.matrix.elements.slice(),bakes:scene.userData.sunShadows.bakes};});
 assert.equal(after.draws,0);assert.equal(after.map,before.map);assert.deepEqual(after.matrix,before.matrix);assert.equal(after.bakes,1);
 await page.addStyleTag({content:'body.qa-car-only #app :not(#game-canvas){visibility:hidden!important}'});
 const receivers=[];
 for(const state of['active-play','town','tree-shadow','building-shadow','tunnel-exit','rock-back','cockpit']){
  await page.evaluate(async state=>{const h=window.__THREE_GAME_TEST_HOOKS__;await h.setState(state);h.setPausedForScreenshot(true);h.setReducedMotion(true);},state);
  await page.screenshot({path:`${dir}/${state}.png`});
  let offscreenCaster=null;
  if(state==='tree-shadow'){
   offscreenCaster=await page.evaluate(()=>{
    const scene=window.sunObjects.find(o=>o.isScene&&o.userData.sunShadows),tree=scene.getObjectByName('Sheltered stone pine boughs').children.find(o=>o.name==='Visible detailed trees'),matrix=tree.userData.authoredInstances[20].clone().premultiply(tree.matrixWorld);
    tree.geometry.computeBoundingBox();const box=tree.geometry.boundingBox,corners=[];
    for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z])corners.push(tree.position.clone().set(x,y,z).applyMatrix4(matrix).project(window.sunCamera));
    return{name:tree.name,instance:20,outside:corners.every(p=>p.x<-1)||corners.every(p=>p.x>1)||corners.every(p=>p.y<-1)||corners.every(p=>p.y>1)||corners.every(p=>p.z>1),clip:corners.map(p=>p.toArray())};
   });
   assert.ok(offscreenCaster.outside,'the tree whose shadow crosses the car must be outside the viewing frustum');
  }
  await page.evaluate(()=>{
   const scene=window.sunObjects.find(o=>o.isScene&&o.userData.sunShadows),sun=scene.getObjectByName('Cached golden-hour world sun'),car=scene.getObjectByName('convertible-'+window.__THREE_GAME_DIAGNOSTICS__.state.car);
   window.sunIsolation={scene,sun,background:scene.background,intensity:sun.shadow.intensity,visibility:scene.children.map(o=>[o,o.visible])};
   scene.children.forEach(o=>o.visible=Boolean(o===car||o.isLight));scene.background=null;document.body.classList.add('qa-car-only');
  });
  const images=[];
  try{
   for(const [i,kind]of['lit','unshadowed'].entries()){
    await page.evaluate(i=>window.sunIsolation.sun.shadow.intensity=i===0?1:0,i);
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    images.push(PNG.sync.read(await page.screenshot({path:`${dir}/${state}-car-${kind}.png`,scale:'css'})));
   }
  }finally{await page.evaluate(()=>{const{scene,sun,background,intensity,visibility}=window.sunIsolation;sun.shadow.intensity=intensity;scene.background=background;visibility.forEach(([o,v])=>o.visible=v);document.body.classList.remove('qa-car-only');delete window.sunIsolation;});}
  let compared=0,changed=0,difference=0;const pixels=images.map(i=>i.data);
  for(let i=0;i<pixels[0].length;i+=4){if(Math.max(...pixels[0].subarray(i,i+3),...pixels[1].subarray(i,i+3))<20)continue;compared++;const d=Math.max(...[0,1,2].map(c=>Math.abs(pixels[0][i+c]-pixels[1][i+c])));difference+=d;if(d>8)changed++;}
  receivers.push({state,compared,changed,fraction:changed/compared,meanDifference:difference/compared,offscreenCaster});console.log(JSON.stringify(receivers.at(-1)));
 }
 await writeFile(`${dir}/receivers.json`,JSON.stringify(receivers,null,2));
 for(const state of ['tree-shadow','building-shadow','rock-back'])assert.ok(receivers.some(r=>r.state===state&&r.compared>100&&r.fraction>.03&&r.changed>50),state+' car-only rendering must receive the cached world shadow');
 await page.click('#menu-button');const tiers=[];
 for(const tier of['high','low','high','low']){
  await page.selectOption('#quality-select',tier);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r)))));
  await page.evaluate(()=>document.body.classList.add('qa-car-only'));
  try{await page.screenshot({path:`${dir}/quality-${tier}-${tiers.length}.png`});}finally{await page.evaluate(()=>document.body.classList.remove('qa-car-only'));}
  tiers.push(await page.evaluate(()=>{const scene=window.sunObjects.find(o=>o.isScene&&o.userData.sunShadows),sun=scene.getObjectByName('Cached golden-hour world sun');const renderer=window.sunObjects.find(o=>o.isWebGLRenderer),paint=scene.getObjectByName('convertible-'+window.__THREE_GAME_DIAGNOSTICS__.state.car).getObjectByName('vehicle-paint').material;return{...scene.userData.sunShadows,map:sun.shadow.map.texture.uuid,matrix:sun.shadow.matrix.elements.slice(),textures:renderer.info.memory.textures,draws:window.sunDraws,hasLocalShader:Boolean(renderer.properties.get(paint).currentProgram.getUniforms().map.coastLocalMap)};}));
 }
 for(const t of tiers){assert.equal(t.map,before.map);assert.deepEqual(t.matrix,before.matrix);assert.equal(t.bakes,1);assert.equal(t.bakeDraws,before.bakeDraws);if(t.mode==='cached-world'){assert.equal(t.localDraws,0);assert.equal(t.hasLocalShader,false);}else{assert.ok(t.localDraws>0&&t.localTriangles>0);assert.equal(t.hasLocalShader,true);}}
 assert.equal(tiers[1].textures,tiers[3].textures,'quality toggles must not keep allocating shadow maps');assert.ok(tiers[0].draws>0,'high tier keeps dynamic vehicle shadows');assert.deepEqual(errors,[]);
 await writeFile(`${dir}/summary.json`,JSON.stringify({mobile,before,after,receivers,tiers,errors},null,2));console.log(JSON.stringify({dir,mobile,bakeDraws:before.bakeDraws,lowFrames:200,lowShadowDraws:after.draws,receivers:receivers.filter(r=>r.fraction>.03).map(r=>r.state),textures:tiers.map(t=>t.textures),errors}));
}finally{await context.close();await browser.close();}
