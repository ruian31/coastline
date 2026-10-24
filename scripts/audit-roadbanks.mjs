// Read the actual shipped triangles, then independently raycast road-to-hill
// cross-sections. This measures the terrain; it does not score visual quality.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,devices} from 'playwright';
import {createServer} from 'vite';
import * as THREE from 'three';
const label=process.env.BANK_LABEL;assert.match(label??'',/^[a-z0-9-]+$/);const out=`artifacts/roadbanks-${label}`;await mkdir(out);
const server=await createServer({server:{middlewareMode:true},appType:'custom'}),{coast}=await server.ssrLoadModule('/src/world/roads.ts'),{scanSurface}=await server.ssrLoadModule('/src/world/SurfaceHeight.ts');
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']});
try{for(const mobile of [false,true]){
 const page=await browser.newPage({...mobile?devices['Pixel 7']:{},viewport:mobile?{width:844,height:390}:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));window.bankObjects=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',e=>bankObjects.push(e.detail));});
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:5190')+'/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setState('field-verge'));
 const parts=await page.evaluate(()=>{const scene=bankObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape')),land=scene.getObjectByName('Limestone headland and grassy interior'),children=scene.getObjectByName('road-network').children,verges=children.filter(o=>o.name.startsWith('Graded ')),asphalt=children.filter(o=>o.material?.customProgramCacheKey().includes('coast-dry-asphalt-v1'));return[land,...verges,...asphalt].map((m,i)=>({name:asphalt.includes(m)?'Asphalt '+i:m.name,positions:Array.from(m.geometry.getAttribute('position').array),indices:Array.from(m.geometry.index.array)}));});
 if(process.env.BANK_VIEW==='1'){await page.evaluate(async()=>{const h=window.__THREE_GAME_TEST_HOOKS__;await h.setState('bank-inland');h.setPausedForScreenshot(true);h.setReducedMotion(true);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});await page.screenshot({path:`${out}/${mobile?'mobile':'desktop'}-bank.png`,scale:'css'});}
 const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),meshes=parts.map(p=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p.positions,3));g.setIndex(p.indices);const m=new THREE.Mesh(g,material);m.name=p.name;return m;}),ray=new THREE.Raycaster(),sections=[];
 for(const t of [.12,.18,.37,.54,.71,.84,.92]){
  const road=coast.sample(t),points=[];
  for(let inland=0;inland<=80;inland+=2){const p=road.position.clone().addScaledVector(road.right,-inland);ray.set(new THREE.Vector3(p.x,200,p.z),new THREE.Vector3(0,-1,0));const land=ray.intersectObject(meshes[0])[0],surface=ray.intersectObjects(meshes.filter(m=>!m.name.startsWith('Asphalt')))[0];assert.ok(land&&surface);points.push({inland,x:p.x,z:p.z,land:land.point.y,surface:surface.point.y,roadHeight:road.position.y,source:surface.object.name});}
  sections.push({t,points,landRiseAt30:points[15].land-points[5].land,landRiseAt60:points[30].land-points[5].land});
 }
 const sampled=scanSurface([meshes[0].geometry]),roadSamples=[];
 for(const m of meshes.filter(m=>m.name.startsWith('Asphalt'))){const p=m.geometry.getAttribute('position'),index=m.geometry.index.array,check=(x,y,z)=>{const land=sampled.height(x,z);assert.ok(land!==undefined);roadSamples.push({x,z,asphalt:y,land,incursion:land-y});};for(let i=0;i<p.count;i++)check(p.getX(i),p.getY(i),p.getZ(i));for(let i=0;i<index.length;i+=3){const [a,b,c]=[index[i],index[i+1],index[i+2]];check((p.getX(a)+p.getX(b)+p.getX(c))/3,(p.getY(a)+p.getY(b)+p.getY(c))/3,(p.getZ(a)+p.getZ(b)+p.getZ(c))/3);}}
 roadSamples.sort((a,b)=>b.incursion-a.incursion);const worst=roadSamples.slice(0,20);let rayError=0;
 for(const p of worst){ray.set(new THREE.Vector3(p.x,200,p.z),new THREE.Vector3(0,-1,0));rayError=Math.max(rayError,Math.abs(ray.intersectObject(meshes[0])[0].point.y-p.land));}
 const roadClearance={samples:roadSamples.length,maxIncursion:roadSamples[0].incursion,violations:roadSamples.filter(p=>p.incursion>.03).length,independentRayError:rayError,worst};
 const result={mobile,bundle:await page.locator('script[type=module][src]').getAttribute('src'),scope:'Underlying terrain and four graded shoulders only; separate tunnel roof, scanned cliffs, buildings and boulders are excluded',terrain:{vertices:parts[0].positions.length/3,triangles:parts[0].indices.length/3},sections,roadClearance,errors};await writeFile(`${out}/${mobile?'mobile':'desktop'}.json`,JSON.stringify(result,null,2),{flag:'wx'});
 console.log(JSON.stringify({mobile,bundle:result.bundle,terrain:result.terrain,sections:sections.map(s=>({t:s.t,landRiseAt30:s.landRiseAt30,landRiseAt60:s.landRiseAt60})),roadClearance:{...roadClearance,worst:worst.slice(0,1)},errors}));assert.deepEqual(errors,[]);assert.ok(rayError<.0001);if(process.env.BANK_ASSERT_ROAD==='1')assert.equal(roadClearance.violations,0,'terrain must not emerge through actual asphalt');meshes.forEach(m=>m.geometry.dispose());material.dispose();await page.close();
}}finally{await browser.close();await server.close();}
