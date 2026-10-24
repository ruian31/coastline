// Actual runtime fern geometry/material at authored placements. Camera and
// visibility are isolated for contact inspection; this is not a driving run.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {PNG} from 'pngjs';
import * as THREE from 'three';
import {chromium,devices} from 'playwright';
const label=process.env.FERN_LABEL??String(Date.now()),mobile=process.env.FERN_DEVICE==='mobile';assert.match(label,/^[a-z0-9-]+$/);const out=`artifacts/fern-contact-${label}`;await mkdir(out);
const size=mobile?{width:844,height:390}:{width:1280,height:720},browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']}),context=await browser.newContext({...mobile?devices['Pixel 7']:{},viewport:size,recordVideo:{dir:out,size}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));window.fernObjects=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',e=>fernObjects.push(e.detail));});
try{
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:4191')+'/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setState('fern-verge'));await page.screenshot({path:`${out}/normal-fern-verge.png`,scale:'css'});const normalRenderer=await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__.renderer);
 const data=await page.evaluate(()=>{
  const scene=fernObjects.find(s=>s.isScene&&s.getObjectByName('Coastal landscape')),root=scene.getObjectByName('Coastal landscape'),land=root.getObjectByName('Limestone headland and grassy interior'),legacy=root.getObjectByName('Curved coastal fern rosettes'),matrices=legacy.userData.authoredInstances,a=root.getObjectByName('Curved photographed fern near 0').userData.authoredInstances;
  return{parts:[land,...scene.getObjectByName('road-network').children.filter(o=>o.name.startsWith('Graded '))].map(m=>({positions:Array.from(m.geometry.getAttribute('position').array),indices:Array.from(m.geometry.index.array)})),matrices:matrices.map(m=>m.toArray()),variants:matrices.map(m=>a.includes(m)?0:1)};
 });
 const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),meshes=data.parts.map(p=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p.positions,3));g.setIndex(p.indices);return new THREE.Mesh(g,material);}),ray=new THREE.Raycaster();
 const height=(x,z,terrainOnly=false)=>{ray.set(new THREE.Vector3(x,120,z),new THREE.Vector3(0,-1,0));const hit=ray.intersectObjects(terrainOnly?[meshes[0]]:meshes)[0];assert.ok(hit);return hit.point.y;};
 const placements=data.matrices.slice(0,Math.floor(data.matrices.length*.6)).map((values,index)=>{const x=values[12],z=values[14],gx=(height(x+.15,z)-height(x-.15,z))/.3,gz=(height(x,z+.15)-height(x,z-.15))/.3,lift=height(x,z)-height(x,z,true);assert.ok(Math.abs(values[13]+lift-height(x,z))<.0001);return{index,variant:data.variants[index],values,slope:[gx,gz,lift],gradient:Math.hypot(gx,gz)};});
 const poses=[{name:'raised-verge',...placements.reduce((a,b)=>a.slope[2]>b.slope[2]?a:b)},{name:'steep-soil',...placements.reduce((a,b)=>a.gradient>b.gradient?a:b)}],views=[];
 assert.ok(poses[0].slope[2]>.01,'include an actual raised shoulder placement');
 await page.evaluate(()=>{
  const scene=fernObjects.find(s=>s.isScene&&s.getObjectByName('Coastal landscape')),ground=new Set([scene.getObjectByName('Limestone headland and grassy interior'),...scene.getObjectByName('road-network').children.filter(o=>o.name.startsWith('Graded '))]);window.fernContact={};
  scene.onBeforeRender=(_r,_s,camera)=>{const v=window.fernContact;if(!v.eye)return;scene.traverse(o=>{if(o.isMesh&&!ground.has(o)&&o!==v.preview)o.visible=false;});camera.position.fromArray(v.eye);camera.lookAt(...v.target);camera.updateMatrixWorld();};
  document.querySelector('#app').style.visibility='hidden';document.querySelector('#game-canvas').style.visibility='visible';
 });
 for(const pose of poses){
  await page.evaluate(pose=>{
   const scene=fernObjects.find(s=>s.isScene&&s.getObjectByName('Coastal landscape')),source=scene.getObjectByName(`Curved photographed fern near ${pose.variant}`),state=window.fernContact;
   if(state.preview){state.preview.geometry.dispose();state.preview.removeFromParent();}
   const geometry=source.geometry.clone(),attribute=geometry.getAttribute('instanceGroundSlope');geometry.setAttribute('instanceGroundSlope',new attribute.constructor(new Float32Array(pose.slope),3));const preview=new source.constructor(geometry,source.material,1);preview.setMatrixAt(0,source.matrix.clone().fromArray(pose.values));preview.instanceMatrix.needsUpdate=true;preview.frustumCulled=false;preview.receiveShadow=true;scene.add(preview);state.preview=preview;state.target=[pose.values[12],pose.values[13]+pose.slope[2]+.18,pose.values[14]];
  },pose);
  for(const [name,offset]of [['front',[1.8,.7,1.2]],['side',[-1.8,.65,.2]],['above',[.8,2.2,.6]]]){
   const x=pose.values[12]+offset[0],z=pose.values[14]+offset[2],eye=[x,Math.max(pose.values[13]+pose.slope[2]+offset[1],height(x,z)+.4),z];
   await page.evaluate(async eye=>{window.fernContact.eye=eye;window.__THREE_GAME_TEST_HOOKS__.setSceneTime(30);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));},eye);await page.screenshot({path:`${out}/${pose.name}-${name}.png`,scale:'css'});views.push({pose:pose.name,name,eye});
  }
 }
 const start=await page.evaluate(()=>{window.__THREE_GAME_TEST_HOOKS__.setPausedForScreenshot(false);return window.__THREE_GAME_DIAGNOSTICS__.elapsed;});await page.screenshot({path:`${out}/wind-before.png`,scale:'css'});await page.waitForTimeout(3000);await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setPausedForScreenshot(true));await page.screenshot({path:`${out}/wind-after.png`,scale:'css'});const end=await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__.elapsed),a=PNG.sync.read(await readFile(`${out}/wind-before.png`)),b=PNG.sync.read(await readFile(`${out}/wind-after.png`));let changedPixels=0;for(let i=0;i<a.data.length;i+=4)if(Math.max(...[0,1,2].map(c=>Math.abs(a.data[i+c]-b.data[i+c])))>12)changedPixels++;
 assert.ok(end-start>2.5);assert.ok(changedPixels>20,'isolated runtime leaf shader must actually move');assert.deepEqual(errors,[]);await writeFile(`${out}/result.json`,JSON.stringify({mobile,kind:'Isolated actual near fern on authored low-prefix placements; independent triangle raycasts choose raised/steep soil. Not a full driving screenshot or a proof of every botanical root.',normalRenderer,placements:placements.length,poses,views,motionSeconds:end-start,changedPixels,errors},null,2),{flag:'wx'});console.log(JSON.stringify({out,mobile,placements:placements.length,poses:poses.map(p=>({name:p.name,index:p.index,slope:p.slope})),motionSeconds:end-start,changedPixels,errors}));meshes.forEach(m=>m.geometry.dispose());material.dispose();const video=page.video();await context.close();await video.saveAs(`${out}/contact.webm`);
}catch(error){await writeFile(`${out}/failure.json`,JSON.stringify({error:String(error),errors},null,2),{flag:'wx'});throw error;}finally{await context.close();await browser.close();}
