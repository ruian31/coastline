import {test,expect} from '@playwright/test';
import * as THREE from 'three';
import {readFile} from 'node:fs/promises';
import {PNG} from 'pngjs';

test('植被根部和坡度覆盖实际绘制的路肩与地形',async({page})=>{
 await page.setViewportSize({width:844,height:390});
 await page.addInitScript(()=>{
  localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));
  const w=window as unknown as {rootObjects:unknown[];__THREE_DEVTOOLS__:EventTarget};w.rootObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.rootObjects.push((e as CustomEvent).detail));
 });
 await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('grass-verge'));
 const data=await page.evaluate(()=>{
  const scene=(window as unknown as {rootObjects:THREE.Scene[]}).rootObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'))!,land=scene.getObjectByName('Limestone headland and grassy interior') as THREE.Mesh,road=scene.getObjectByName('road-network')!,verges=road.children.filter(o=>o.name.startsWith('Graded ')) as THREE.Mesh[];
  const samples:{x:number;y:number;z:number;gx:number;gz:number;lift:number}[]=[],raised:typeof samples=[],plain:typeof samples=[];
  for(const name of ['Layered wind moving grass clusters',...Array.from({length:3},(_,i)=>'Photographed low coastal grass '+i)]){
   const mesh=scene.getObjectByName(name) as THREE.InstancedMesh,slope=mesh.geometry.getAttribute('instanceGroundSlope');
   for(let i=0;i<mesh.count;i++){const m=mesh.matrix.clone();mesh.getMatrixAt(i,m);const p={x:m.elements[12],y:m.elements[13],z:m.elements[14],gx:slope.getX(i),gz:slope.getY(i),lift:slope.getZ(i)};(p.lift>.01?raised:plain).push(p);}
  }
  samples.push(...raised.slice(0,12),...plain.slice(0,6));
  return{parts:[land,...verges].map(m=>({positions:Array.from(m.geometry.getAttribute('position').array as ArrayLike<number>),indices:Array.from(m.geometry.index!.array)})),verges:verges.length,samples,raised:raised.length};
 });
 expect(data.verges).toBe(4);expect(data.raised,'test must cover visible grass above raised shoulder geometry').toBeGreaterThan(0);
 const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),meshes=data.parts.map(part=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(part.positions,3));g.setIndex(part.indices);return new THREE.Mesh(g,material);}),ray=new THREE.Raycaster();
 const height=(x:number,z:number)=>{ray.set(new THREE.Vector3(x,120,z),new THREE.Vector3(0,-1,0));const hit=ray.intersectObjects(meshes)[0];expect(hit).toBeDefined();return hit.point.y;};
 await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('fern-verge'));
 const fernSamples=await page.evaluate(()=>{
  const scene=(window as unknown as {rootObjects:THREE.Scene[]}).rootObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'))!,samples:{x:number;y:number;z:number;gx:number;gz:number;lift:number}[]=[];let near=0;
  for(const detail of ['near','far'])for(let variant=0;variant<2;variant++){
   const mesh=scene.getObjectByName(`Curved photographed fern ${detail} ${variant}`) as THREE.InstancedMesh,slope=mesh.geometry.getAttribute('instanceGroundSlope');if(detail==='near')near+=mesh.count;
   for(let i=0;i<Math.min(mesh.count,4);i++){const m=mesh.matrix.clone();mesh.getMatrixAt(i,m);samples.push({x:m.elements[12],y:m.elements[13],z:m.elements[14],gx:slope.getX(i),gz:slope.getY(i),lift:slope.getZ(i)});}
  }return{near,samples};
 });
 expect(fernSamples.near,'include actual near fern geometry in the root check').toBeGreaterThan(0);
 for(const p of fernSamples.samples){
  expect(p.y+p.lift,'fern crown anchor follows the actual top surface; geometry supplies the burial').toBeCloseTo(height(p.x,p.z),3);
  expect(p.gx).toBeCloseTo((height(p.x+.15,p.z)-height(p.x-.15,p.z))/.3,2);expect(p.gz).toBeCloseTo((height(p.x,p.z+.15)-height(p.x,p.z-.15))/.3,2);
 }
 await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('field-verge'));
 const fieldSamples=await page.evaluate(()=>{
  const scene=(window as unknown as {rootObjects:THREE.Scene[]}).rootObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'))!,samples:{x:number;y:number;z:number;gx:number;gz:number;lift:number}[]=[];let near=0;
  for(const name of ['Dry inland patch grass clusters',...Array.from({length:3},(_,i)=>'Photographed dry inland grass '+i)]){
   const mesh=scene.getObjectByName(name) as THREE.InstancedMesh,slope=mesh.geometry.getAttribute('instanceGroundSlope');if(name.startsWith('Photographed'))near+=mesh.count;
   for(let i=0;i<Math.min(mesh.count,6);i++){const m=mesh.matrix.clone();mesh.getMatrixAt(i,m);samples.push({x:m.elements[12],y:m.elements[13],z:m.elements[14],gx:slope.getX(i),gz:slope.getY(i),lift:slope.getZ(i)});}
  }return{near,samples};
 });
 expect(fieldSamples.near,'check actual fine field grass on independently raycast soil').toBeGreaterThan(0);
 for(const p of fieldSamples.samples){expect(height(p.x,p.z)-(p.y+p.lift)).toBeCloseTo(.05,3);expect(p.gx).toBeCloseTo((height(p.x+.15,p.z)-height(p.x-.15,p.z))/.3,2);expect(p.gz).toBeCloseTo((height(p.x,p.z+.15)-height(p.x,p.z-.15))/.3,2);}
 for(const p of data.samples){
  expect(height(p.x,p.z)-(p.y+p.lift),'root is buried only 5cm below the visible top surface').toBeCloseTo(.05,3);
  expect(p.gx).toBeCloseTo((height(p.x+.15,p.z)-height(p.x-.15,p.z))/.3,2);
  expect(p.gz).toBeCloseTo((height(p.x,p.z+.15)-height(p.x,p.z-.15))/.3,2);
 }
 meshes.forEach(m=>m.geometry.dispose());material.dispose();
});

test('摄影低草可见、近远互斥，切换质量后保留原始摆放与资源',async({page},info)=>{
 await page.addInitScript(()=>{
  localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));
  const w=window as unknown as {grassObjects:unknown[];__THREE_DEVTOOLS__:EventTarget};w.grassObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.grassObjects.push((e as CustomEvent).detail));
 });
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('grass-verge'));
 const inspect=()=>page.evaluate(()=>{
  const scene=(window as unknown as {grassObjects:THREE.Scene[]}).grassObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'))!,root=scene.getObjectByName('Coastal landscape')!,far=root.getObjectByName('Layered wind moving grass clusters') as THREE.InstancedMesh;
  const near=[0,1,2].map(i=>root.getObjectByName('Photographed low coastal grass '+i) as THREE.InstancedMesh),original=far.userData.authoredInstances as THREE.Matrix4[];
  let slopesFinite=true;
  const key=(m:THREE.Matrix4)=>Array.from(new Float32Array(m.elements),v=>v.toFixed(3)).join(','),authored=new Set(original.map(key)),farKeys=new Set<string>(),nearKeys=new Set<string>(),unknown:string[]=[];let duplicates=0;
  for(const mesh of [far,...near])for(let i=0;i<mesh.count;i++){
   const m=mesh.matrix.clone();mesh.getMatrixAt(i,m);const k=key(m);if(!authored.has(k))unknown.push(k);if(farKeys.has(k)||nearKeys.has(k))duplicates++;(mesh===far?farKeys:nearKeys).add(k);
   if(mesh!==far){const slope=mesh.geometry.getAttribute('instanceGroundSlope');slopesFinite&&=[slope.getX(i),slope.getY(i),slope.getZ(i)].every(Number.isFinite);}
  }
  const material=near[0].material as THREE.MeshStandardMaterial,image=material.map!.image as {width:number;height:number};
  return{detail:root.userData.grassDetail,near:near.map(m=>m.count),far:far.count,duplicates,unknown,slopesFinite,texture:material.map!.uuid,dimensions:[image.width,image.height],alpha:material.alphaTest,doubleSided:material.side===2,shared:near.every(m=>(m.material as THREE.MeshStandardMaterial).map===material.map),triangles:near.map(m=>m.geometry.index!.count/3),grounded:near.every(m=>{m.geometry.computeBoundingBox();return Math.abs(m.geometry.boundingBox!.min.y)<.001;}),memory:window.__THREE_GAME_DIAGNOSTICS__!.renderer};
 });
 const low=await inspect(),limit=info.project.name.includes('mobile')?48:96;
 expect(low.detail.ready).toBe(true);expect(low.near.reduce((a,b)=>a+b,0)).toBeGreaterThan(0);expect(low.detail.selected).toBeLessThanOrEqual(limit);expect(low.detail.visible).toBe(low.near.reduce((a,b)=>a+b,0));
 expect(low.duplicates).toBe(0);expect(low.unknown).toEqual([]);expect(low.slopesFinite).toBe(true);expect(low.shared).toBe(true);expect(low.dimensions).toEqual([1024,1024]);expect(low.alpha).toBeGreaterThan(.4);expect(low.doubleSided).toBe(true);expect(low.grounded).toBe(true);expect(low.triangles.every(n=>n<350)).toBe(true);
 // Use the real settings control; all quality tiers must reuse the atlas and
 // retain disjoint near/far sets when the low-density prefix changes.
 for(const quality of ['high','low','high','low']){
  await page.click('#menu-button');await page.selectOption('#quality-select',quality);await page.click('#resume-button');
  await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
  const current=await inspect();expect(current.texture).toBe(low.texture);expect(current.detail.selected).toBeLessThanOrEqual(limit);expect(current.duplicates).toBe(0);expect(current.unknown).toEqual([]);expect(current.slopesFinite).toBe(true);
 }
 expect(errors).toEqual([]);
});

test('原野与路边共用摄影近草总限额，保留前缀、距离裁剪和独立属性',async({page},info)=>{
 await page.setViewportSize({width:844,height:390});
 await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));const w=window as unknown as {fieldObjects:unknown[];__THREE_DEVTOOLS__:EventTarget};w.fieldObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.fieldObjects.push((e as CustomEvent).detail));});
 const errors:string[]=[],requests:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/models/coastal_grass/')&&r.url().endsWith('.png'))requests.push(r.url());});
 await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('field-verge'));
 const inspect=()=>page.evaluate(async()=>{
  const scene=(window as unknown as {fieldObjects:THREE.Scene[]}).fieldObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'))!,root=scene.getObjectByName('Coastal landscape')!;
  scene.onAfterRender=(_renderer,_scene,camera)=>{scene.userData.fieldCamera=camera.position.toArray();};await new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r())));
  const camera=scene.userData.fieldCamera as number[],low=window.__THREE_GAME_DIAGNOSTICS__!.state!.renderTier==='low',nearMeshes=[0,1,2].map(i=>root.getObjectByName('Photographed dry inland grass '+i) as THREE.InstancedMesh),roadside=[0,1,2].map(i=>root.getObjectByName('Photographed low coastal grass '+i) as THREE.InstancedMesh),far=root.getObjectByName('Dry inland patch grass clusters') as THREE.InstancedMesh,authors=far.userData.authoredInstances as THREE.Matrix4[],limit=low?Math.floor(authors.length*.55):authors.length,key=(m:THREE.Matrix4)=>Array.from(new Float32Array(m.elements),v=>v.toFixed(3)).join(','),lookup=new Map(authors.map((m,i)=>[key(m),i])),seen=new Set<string>(),outside:number[]=[],unknown:string[]=[],farDistances:number[]=[];let duplicates=0,slopesFinite=true;
  for(const mesh of [far,...nearMeshes])for(let i=0;i<mesh.count;i++){
   const m=mesh.matrix.clone();mesh.getMatrixAt(i,m);const k=key(m),index=lookup.get(k);if(index===undefined)unknown.push(k);else if(index>=limit)outside.push(index);if(seen.has(k))duplicates++;seen.add(k);const slope=mesh.geometry.getAttribute('instanceGroundSlope');slopesFinite&&=[slope.getX(i),slope.getY(i),slope.getZ(i)].every(Number.isFinite);if(mesh===far)farDistances.push(Math.hypot(m.elements[12]-camera[0],m.elements[14]-camera[2]));
  }
  const material=nearMeshes[0].material as THREE.MeshStandardMaterial,roadMap=(roadside[0].material as THREE.MeshStandardMaterial).map;
  return{field:{...root.userData.fieldGrassDetail},road:{...root.userData.grassDetail},near:nearMeshes.reduce((n,m)=>n+m.count,0),roadNear:roadside.reduce((n,m)=>n+m.count,0),far:far.count,duplicates,outside,unknown,slopesFinite,texture:material.map!.uuid,shared:nearMeshes.every(m=>m.material===material)&&material.map===roadMap&&(far.material as THREE.MeshStandardMaterial).map===(root.getObjectByName('Layered wind moving grass clusters') as THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>).material.map,ownAttributes:nearMeshes.every((m,i)=>m.geometry.getAttribute('instanceGroundSlope')!==roadside[i].geometry.getAttribute('instanceGroundSlope')),maxFarDistance:Math.max(0,...farDistances),authors:authors.map(m=>m.toArray())};
 });
 const first=await inspect(),cap=info.project.name.includes('mobile')?48:96;expect(first.field.ready).toBe(true);expect(first.near).toBeGreaterThan(0);expect(first.far).toBeGreaterThan(0);expect(first.field.placements).toBeGreaterThan(1000);
 let roadVisible=0,fieldVisible=0;
 for(const quality of ['high','low','high','low']){
  await page.click('#menu-button');await page.selectOption('#quality-select',quality);await page.click('#resume-button');
  for(const state of ['grass-verge','field-verge','rock-back']){
   await page.evaluate(state=>window.__THREE_GAME_TEST_HOOKS__!.setState(state),state);const current=await inspect();roadVisible+=current.roadNear;fieldVisible+=current.near;
   expect(current.near+current.roadNear).toBeLessThanOrEqual(cap);expect(current.field.selected+current.road.selected).toBeLessThanOrEqual(cap);expect(current.field.visible).toBe(current.near);expect(current.road.visible).toBe(current.roadNear);expect(current.duplicates).toBe(0);expect(current.outside).toEqual([]);expect(current.unknown).toEqual([]);expect(current.slopesFinite).toBe(true);expect(current.shared).toBe(true);expect(current.ownAttributes).toBe(true);expect(current.texture).toBe(first.texture);expect(current.maxFarDistance).toBeLessThanOrEqual(current.field.range+.001);expect(current.authors).toEqual(first.authors);
  }
 }
 expect(roadVisible).toBeGreaterThan(0);expect(fieldVisible).toBeGreaterThan(0);expect(requests.length).toBe(1);expect(errors).toEqual([]);
});

for(const resource of ['grass.gltf','grass-color.png','invalid-atlas-size'])test('低草资源失效仍能开始和行驶，保留完整远景草 '+resource,async({page},info)=>{
 if(resource==='invalid-atlas-size'){const image=new PNG({width:16,height:16});image.data.fill(255);await page.route('**/assets/models/coastal_grass/grass-color.png',route=>route.fulfill({body:PNG.sync.write(image),contentType:'image/png'}));}else await page.route('**/assets/models/coastal_grass/'+resource,route=>route.abort());
 await page.addInitScript(()=>{const w=window as unknown as {grassObjects:unknown[];closedGrassBitmaps:number[][];__THREE_DEVTOOLS__:EventTarget};w.grassObjects=[];w.closedGrassBitmaps=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.grassObjects.push((e as CustomEvent).detail));if(typeof ImageBitmap!=='undefined'){const close=ImageBitmap.prototype.close;ImageBitmap.prototype.close=function(this:ImageBitmap){w.closedGrassBitmaps.push([this.width,this.height]);close.call(this);};}});
 await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('grass-verge'));
 const fallback=await page.evaluate(()=>{
  const scene=(window as unknown as {grassObjects:THREE.Scene[]}).grassObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'))!,root=scene.getObjectByName('Coastal landscape')!,far=root.getObjectByName('Layered wind moving grass clusters') as THREE.InstancedMesh;
  return{detail:root.userData.grassDetail,visible:far.count,near:Boolean(root.getObjectByName('Photographed low coastal grass 0')),running:window.__THREE_GAME_DIAGNOSTICS__!.state!.running};
 });
 expect(fallback.detail.fallback).toBe(true);expect(fallback.visible).toBeGreaterThan(0);expect(fallback.near).toBe(false);expect(fallback.running).toBe(true);
 await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('field-verge'));
 const fieldFallback=await page.evaluate(()=>{const scene=(window as unknown as {grassObjects:THREE.Scene[]}).grassObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'))!,root=scene.getObjectByName('Coastal landscape')!;return{fallback:root.userData.fieldGrassDetail.fallback,count:(root.getObjectByName('Dry inland patch grass clusters') as THREE.InstancedMesh).count,near:Boolean(root.getObjectByName('Photographed dry inland grass 0'))};});
 expect(fieldFallback.fallback).toBe(true);expect(fieldFallback.count).toBeGreaterThan(0);expect(fieldFallback.near).toBe(false);
 if(resource==='invalid-atlas-size'&&info.project.name.includes('chrome'))expect(await page.evaluate(()=>(window as unknown as {closedGrassBitmaps:number[][]}).closedGrassBitmaps.filter(size=>size[0]===16))).toEqual([[16,16]]);
 // This pose is 12m off-road: cruise intentionally requires returning first.
 await page.click('#menu-button');await page.click('#recover-button');await page.click('#auto-button');await expect.poll(async()=>page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__!.player!.speed),{timeout:10000}).toBeGreaterThan(2);
});

test('灰绿灌木近远互斥且遵守低档原始前缀，切档复用图集',async({page},info)=>{
 await page.addInitScript(()=>{
  localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));
  const w=window as unknown as {scrubObjects:unknown[];__THREE_DEVTOOLS__:EventTarget};w.scrubObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.scrubObjects.push((e as CustomEvent).detail));
 });
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('grass-verge'));
 const inspect=()=>page.evaluate(()=>{
  const scene=(window as unknown as {scrubObjects:THREE.Scene[]}).scrubObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'))!,root=scene.getObjectByName('Coastal landscape')!,original=root.getObjectByName('Fine leaf coastal maquis clusters') as THREE.InstancedMesh,placements=original.userData.authoredInstances as THREE.Matrix4[],key=(m:THREE.Matrix4)=>Array.from(new Float32Array(m.elements),v=>v.toFixed(3)).join(','),lookup=new Map(placements.map((m,i)=>[key(m),i]));
  const limit=window.__THREE_GAME_DIAGNOSTICS__!.state!.renderTier==='low'?Math.floor(placements.length*.65):placements.length,seen=new Set<string>(),unknown:string[]=[],outside:number[]=[],variants:number[]=[],textures=new Set<string>();let duplicates=0,near=0,slopeMissing=0;
  for(const detail of ['near','far','impostor'])for(let variant=0;variant<2;variant++){
   const mesh=root.getObjectByName(`Grey green coastal scrub ${detail} ${variant}`) as THREE.InstancedMesh,material=mesh.material as THREE.MeshStandardMaterial;variants.push(mesh.geometry.index!.count/3);textures.add(material.map!.uuid);if(detail==='near')near+=mesh.count;
   const slopes=mesh.geometry.getAttribute('instanceGroundSlope');if(!slopes||mesh.frustumCulled)slopeMissing++;
   for(let i=0;i<mesh.count;i++){const m=mesh.matrix.clone();mesh.getMatrixAt(i,m);const k=key(m),index=lookup.get(k);if(index===undefined)unknown.push(k);else if(index>=limit)outside.push(index);if(seen.has(k))duplicates++;seen.add(k);}
  }
  return{detail:root.userData.scrubDetail,originalVisible:original.visible,near,duplicates,unknown,outside,slopeMissing,variants,textures:[...textures]};
 });
 const first=await inspect(),cap=info.project.name.includes('mobile')?8:16;
 expect(first.detail.ready).toBe(true);expect(first.near).toBeGreaterThan(0);expect(first.near).toBe(first.detail.visible);expect(first.detail.selected).toBeLessThanOrEqual(cap);expect(first.originalVisible).toBe(false);expect(first.duplicates).toBe(0);expect(first.unknown).toEqual([]);expect(first.outside).toEqual([]);expect(first.slopeMissing).toBe(0);expect(first.textures).toHaveLength(2);expect(first.variants[0]).toBeGreaterThan(first.variants[2]);expect(first.variants[1]).toBeGreaterThan(first.variants[3]);expect(first.variants.slice(4)).toEqual([10,10]);
 for(const quality of ['high','low','high','low']){
  await page.click('#menu-button');await page.selectOption('#quality-select',quality);await page.click('#resume-button');await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
  const state=await inspect();expect(state.duplicates).toBe(0);expect(state.unknown).toEqual([]);expect(state.outside).toEqual([]);expect(state.detail.selected).toBeLessThanOrEqual(cap);expect(state.textures).toEqual(first.textures);
 }
 expect(errors).toEqual([]);
});

test('内陆灌丛共享近景预算、贴图与前缀，实际三层LOD互斥并贴地',async({page},info)=>{
 await page.setViewportSize({width:844,height:390});
 await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));const w=window as unknown as {scrubObjects:unknown[];__THREE_DEVTOOLS__:EventTarget};w.scrubObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.scrubObjects.push((e as CustomEvent).detail));});
 const errors:string[]=[],requests:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/coastal_rooibos/')&&r.url().endsWith('.png'))requests.push(r.url());});
 await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('field-verge'));
 const inspect=()=>page.evaluate(async()=>{
  const scene=(window as unknown as {scrubObjects:THREE.Scene[]}).scrubObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'))!,root=scene.getObjectByName('Coastal landscape')!,source=root.getObjectByName('Inland grey green maquis colonies') as THREE.InstancedMesh,authors=source.userData.authoredInstances as THREE.Matrix4[],low=window.__THREE_GAME_DIAGNOSTICS__!.state!.renderTier==='low',limit=low?Math.floor(authors.length*.65):authors.length;
  scene.onAfterRender=(_r,_s,c)=>{scene.userData.scrubCamera=c.position.toArray();};await new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r())));
  const camera=scene.userData.scrubCamera as number[],key=(m:THREE.Matrix4)=>Array.from(new Float32Array(m.elements),v=>v.toFixed(3)).join(','),lookup=new Map(authors.map((m,i)=>[key(m),i])),seen=new Set<string>(),unknown:string[]=[],outside:number[]=[],textures:string[]=[],wrongLod:number[]=[],samples:{x:number;y:number;z:number;gx:number;gz:number;lift:number}[]=[];let near=0,far=0,impostor=0,duplicates=0,maxDistance=0,ownAttributes=true,shared=true;
  for(const detail of ['near','far','impostor'])for(let variant=0;variant<2;variant++){
   const mesh=root.getObjectByName(`Inland grey green scrub ${detail} ${variant}`) as THREE.InstancedMesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>,road=root.getObjectByName(`Grey green coastal scrub ${detail} ${variant}`) as typeof mesh,slope=mesh.geometry.getAttribute('instanceGroundSlope');shared&&=mesh.material.map===road.material.map;ownAttributes&&=slope!==road.geometry.getAttribute('instanceGroundSlope');textures.push(mesh.material.map!.uuid);
   if(detail==='near')near+=mesh.count;else if(detail==='far')far+=mesh.count;else impostor+=mesh.count;
   for(let i=0;i<mesh.count;i++){const m=mesh.matrix.clone();mesh.getMatrixAt(i,m);const k=key(m),index=lookup.get(k);if(index===undefined)unknown.push(k);else if(index>=limit)outside.push(index);if(seen.has(k))duplicates++;seen.add(k);maxDistance=Math.max(maxDistance,Math.hypot(m.elements[12]-camera[0],m.elements[14]-camera[2]));const distance=Math.hypot(m.elements[12]-camera[0],m.elements[13]-camera[1],m.elements[14]-camera[2]),config=root.userData.fieldScrubDetail;if(detail==='near'&&distance>config.exitRange+.001||detail==='far'&&distance>config.impostorRange+6+.001||detail==='impostor'&&distance<config.impostorRange-6-.001)wrongLod.push(distance);if(samples.length<18)samples.push({x:m.elements[12],y:m.elements[13],z:m.elements[14],gx:slope.getX(i),gz:slope.getY(i),lift:slope.getZ(i)});}
  }
  const land=root.getObjectByName('Limestone headland and grassy interior') as THREE.Mesh,verges=scene.getObjectByName('road-network')!.children.filter(o=>o.name.startsWith('Graded ')) as THREE.Mesh[];
  return{road:{...root.userData.scrubDetail},field:{...root.userData.fieldScrubDetail},authors:authors.map(m=>m.toArray()),near,far,impostor,unknown,outside,duplicates,maxDistance,shared,ownAttributes,textures,wrongLod,samples,parts:[land,...verges].map(m=>({positions:Array.from(m.geometry.getAttribute('position').array as ArrayLike<number>),indices:Array.from(m.geometry.index!.array)}))};
 });
 const initial=await inspect(),cap=info.project.name.includes('mobile')?8:16;expect(initial.field.ready).toBe(true);expect(initial.field.placements).toBeGreaterThan(500);expect(initial.near).toBeGreaterThan(0);expect(initial.far+initial.impostor).toBeGreaterThan(0);
 const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),surfaces=initial.parts.map(p=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p.positions,3));g.setIndex(p.indices);return new THREE.Mesh(g,material);}),ray=new THREE.Raycaster(),height=(x:number,z:number)=>{ray.set(new THREE.Vector3(x,120,z),new THREE.Vector3(0,-1,0));const hit=ray.intersectObjects(surfaces)[0];expect(hit).toBeDefined();return hit.point.y;};
 for(const s of initial.samples){expect(height(s.x,s.z)-(s.y+s.lift)).toBeCloseTo(.04,3);expect(s.gx).toBeCloseTo((height(s.x+.15,s.z)-height(s.x-.15,s.z))/.3,2);expect(s.gz).toBeCloseTo((height(s.x,s.z+.15)-height(s.x,s.z-.15))/.3,2);}
 surfaces.forEach(m=>m.geometry.dispose());material.dispose();
 for(const quality of ['high','low','high','low']){
  await page.click('#menu-button');await page.selectOption('#quality-select',quality);await page.click('#resume-button');
  for(const state of ['field-verge','rock-back']){
   await page.evaluate(state=>window.__THREE_GAME_TEST_HOOKS__!.setState(state),state);const current=await inspect();expect(current.near+current.road.visible).toBeLessThanOrEqual(cap);expect(current.field.selected+current.road.selected).toBeLessThanOrEqual(cap);expect(current.field.visible).toBe(current.near);expect(current.unknown).toEqual([]);expect(current.outside).toEqual([]);expect(current.duplicates).toBe(0);expect(current.wrongLod).toEqual([]);expect(current.maxDistance).toBeLessThanOrEqual(current.field.range+.001);expect(current.shared&&current.ownAttributes).toBe(true);expect(current.textures).toEqual(initial.textures);expect(current.authors).toEqual(initial.authors);
  }
 }
 expect(requests).toHaveLength(2);expect(new Set(requests).size).toBe(2);expect(errors).toEqual([]);
});

for(const resource of ['scrub.gltf','scrub-color.png','scrub-impostors.png','invalid-atlas-size'])test('灌木载入失败保留原景观并允许开始 '+resource,async({page},info)=>{
 await page.setViewportSize({width:844,height:390});
 if(resource==='invalid-atlas-size'){
  const image=new PNG({width:16,height:16});image.data.fill(255);
  await page.route('**/assets/models/coastal_rooibos/scrub-color.png',route=>route.fulfill({body:PNG.sync.write(image),contentType:'image/png'}));
 }else await page.route('**/assets/models/coastal_rooibos/'+resource,route=>route.abort());
 await page.addInitScript(()=>{const w=window as unknown as {scrubObjects:unknown[];closedScrubBitmaps:number[][];__THREE_DEVTOOLS__:EventTarget};w.scrubObjects=[];w.closedScrubBitmaps=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.scrubObjects.push((e as CustomEvent).detail));if(typeof ImageBitmap!=='undefined'){const close=ImageBitmap.prototype.close;ImageBitmap.prototype.close=function(this:ImageBitmap){w.closedScrubBitmaps.push([this.width,this.height]);close.call(this);};}});
 await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('scrub-field'));
 const result=await page.evaluate(async()=>{const scene=(window as unknown as {scrubObjects:THREE.Scene[]}).scrubObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'))!,root=scene.getObjectByName('Coastal landscape')!,old=root.getObjectByName('Fine leaf coastal maquis clusters') as THREE.InstancedMesh,field=root.getObjectByName('Inland grey green maquis colonies') as THREE.InstancedMesh;scene.onAfterRender=(_r,_s,c)=>{scene.userData.fallbackCamera=c.position.toArray();};await new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r())));const camera=scene.userData.fallbackCamera as number[];let maxDistance=0;for(let i=0;i<field.count;i++){const m=field.matrix.clone();field.getMatrixAt(i,m);maxDistance=Math.max(maxDistance,Math.hypot(m.elements[12]-camera[0],m.elements[14]-camera[2]));}return{closed:(window as unknown as {closedScrubBitmaps:number[][]}).closedScrubBitmaps,fallback:root.userData.scrubDetail.fallback,original:old.visible&&old.count>0,field:field.visible&&root.userData.fieldScrubDetail.fallback,count:field.count,maxDistance,range:root.userData.fieldScrubDetail.range,loaded:Boolean(root.getObjectByName('Grey green coastal scrub near 0')),running:window.__THREE_GAME_DIAGNOSTICS__!.state!.running};});
 expect(result.fallback&&result.original&&result.field&&result.running).toBe(true);expect(result.loaded).toBe(false);expect(result.count).toBeGreaterThan(0);expect(result.maxDistance).toBeLessThanOrEqual(result.range+.001);
 if(info.project.name.includes('chrome')&&resource==='scrub-impostors.png')expect(result.closed).toEqual([[1024,1024],[1024,1024]]);
 if(info.project.name.includes('chrome')&&resource==='invalid-atlas-size'){expect(result.closed.filter(size=>size[0]===16)).toEqual([[16,16]]);expect(result.closed.filter(size=>size[0]===1024)).toEqual([[1024,1024]]);}
});

test('卷曲蕨叶共用原摄影贴图，近远互斥并保留低档摆放前缀',async({page},info)=>{
 if(info.project.name.includes('mobile'))await page.setViewportSize({width:844,height:390});
 await page.addInitScript(()=>{
  localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));
  const w=window as unknown as {fernObjects:unknown[];__THREE_DEVTOOLS__:EventTarget};w.fernObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.fernObjects.push((e as CustomEvent).detail));
 });
 const requests:string[]=[],errors:string[]=[];page.on('request',r=>{if(r.url().includes('/models/fern_02/textures/'))requests.push(r.url());});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('fern-verge'));
 const inspect=()=>page.evaluate(()=>{
  const scene=(window as unknown as {fernObjects:THREE.Scene[]}).fernObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'))!,root=scene.getObjectByName('Coastal landscape')!,original=root.getObjectByName('Curved coastal fern rosettes') as THREE.InstancedMesh,placements=original.userData.authoredInstances as THREE.Matrix4[];
  const key=(m:THREE.Matrix4)=>Array.from(new Float32Array(m.elements),v=>v.toFixed(3)).join(','),lookup=new Map(placements.map((m,i)=>[key(m),i])),seen=new Set<string>(),outside:number[]=[],unknown:string[]=[],triangles:number[]=[],textureKeys:string[]=[];let duplicates=0,near=0,slopesFinite=true,shared=true;
  const imported=scene.getObjectByName('Scanned coastal ferns')!.children[0] as THREE.InstancedMesh,template=imported.material as THREE.MeshStandardMaterial,limit=window.__THREE_GAME_DIAGNOSTICS__!.state!.renderTier==='low'?Math.floor(placements.length*.6):placements.length;
  for(const detail of ['near','far'])for(let variant=0;variant<2;variant++){
   const mesh=root.getObjectByName(`Curved photographed fern ${detail} ${variant}`) as THREE.InstancedMesh,material=mesh.material as THREE.MeshStandardMaterial,slope=mesh.geometry.getAttribute('instanceGroundSlope');triangles.push(mesh.geometry.index!.count/3);if(detail==='near')near+=mesh.count;
   shared&&=material.map===template.map&&material.normalMap===template.normalMap&&material.roughnessMap===template.roughnessMap;textureKeys.push(material.map!.uuid);mesh.geometry.computeBoundingBox();if(Math.abs(mesh.geometry.boundingBox!.min.y+.075)>.0001)slopesFinite=false;
   for(let i=0;i<mesh.count;i++){const m=mesh.matrix.clone();mesh.getMatrixAt(i,m);const k=key(m),index=lookup.get(k);if(index===undefined)unknown.push(k);else if(index>=limit)outside.push(index);if(seen.has(k))duplicates++;seen.add(k);slopesFinite&&=[slope.getX(i),slope.getY(i),slope.getZ(i)].every(Number.isFinite);}
  }
  return{detail:root.userData.fernDetail,originalVisible:original.visible,near,duplicates,outside,unknown,triangles,shared,slopesFinite,textureKeys};
 });
 const first=await inspect();expect(first.detail.ready).toBe(true);expect(first.originalVisible).toBe(false);expect(first.near).toBeGreaterThan(0);expect(first.detail.visible).toBe(first.near);expect(first.triangles).toEqual([784,816,198,197]);
 for(const quality of ['high','low','high','low']){
  await page.click('#menu-button');await page.selectOption('#quality-select',quality);await page.click('#resume-button');await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));const current=await inspect();
  expect(current.near).toBeLessThanOrEqual(info.project.name.includes('mobile')?8:16);expect(current.detail.visible).toBe(current.near);expect(current.shared).toBe(true);expect(current.slopesFinite).toBe(true);expect(current.duplicates).toBe(0);expect(current.outside).toEqual([]);expect(current.unknown).toEqual([]);expect(current.textureKeys).toEqual(first.textureKeys);
 }
 expect(requests.length).toBe(3);expect(new Set(requests).size).toBe(3);expect(errors).toEqual([]);
});

test('原实拍蕨叶按视锥逐株剔除，切档保留全部原始摆放',async({page},info)=>{
 const fixture=JSON.parse(await readFile(new URL('./fixtures/imported-fern-placements.json',import.meta.url),'utf8')).platforms[info.project.name.includes('mobile')?'mobile':'desktop'];
 await page.setViewportSize({width:844,height:390});await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));const w=window as unknown as {fernObjects:unknown[];__THREE_DEVTOOLS__:EventTarget};w.fernObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.fernObjects.push((e as CustomEvent).detail));});
 await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('fern-verge'));
 const inspect=()=>page.evaluate(()=>{
  const root=(window as unknown as {fernObjects:THREE.Scene[]}).fernObjects.find(o=>o.isScene&&o.getObjectByName('Scanned coastal ferns'))!.getObjectByName('Scanned coastal ferns')!,low=window.__THREE_GAME_DIAGNOSTICS__!.state!.renderTier==='low';
  return root.children.map(o=>{const m=o as THREE.InstancedMesh,authored=m.userData.authoredInstances as THREE.Matrix4[],key=(v:THREE.Matrix4)=>Array.from(new Float32Array(v.elements),n=>n.toFixed(3)).join(','),lookup=new Map(authored.map((v,i)=>[key(v),i])),indices:(number|undefined)[]=[];for(let i=0;i<m.count;i++){const v=m.matrix.clone();m.getMatrixAt(i,v);indices.push(lookup.get(key(v)));}return{name:m.name,frustumCulled:m.frustumCulled,matrices:authored.map(v=>v.toArray()),indices,limit:low?Math.floor(authored.length*.5):authored.length};});
 });
 const before=await inspect();expect(before.some(m=>m.indices.length<m.limit)).toBe(true);
 for(const expected of fixture.batches){const actual=before.find(m=>m.name===expected.name)!;expect(actual.matrices.length).toBe(expected.matrices.length);for(let i=0;i<expected.matrices.length;i++)for(let j=0;j<16;j++)expect(actual.matrices[i][j],expected.name+' original transform').toBeCloseTo(expected.matrices[i][j],4);}
 for(const quality of ['high','low','high','low']){
  await page.click('#menu-button');await page.selectOption('#quality-select',quality);await page.click('#resume-button');await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
  for(const m of await inspect()){expect(m.frustumCulled).toBe(false);expect(m.indices.length).toBeLessThanOrEqual(m.limit);expect(m.indices.every(i=>i!==undefined&&i<m.limit)).toBe(true);expect(new Set(m.indices).size).toBe(m.indices.length);expect(m.matrices).toEqual(before.find(v=>v.name===m.name)!.matrices);}
 }
 await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('active-play'));expect((await inspect()).reduce((n,m)=>n+m.indices.length,0),'old photographic plants still appear in their original roadside section').toBeGreaterThan(0);
});

for(const resource of ['coastal_ferns/ferns.gltf','fern_02/fern_02_browser.gltf'])test('蕨叶载入失败保留原植物并能继续驾驶 '+resource,async({page})=>{
 await page.route('**/assets/models/'+resource,route=>route.abort());await page.addInitScript(()=>{const w=window as unknown as {fernObjects:unknown[];__THREE_DEVTOOLS__:EventTarget};w.fernObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.fernObjects.push((e as CustomEvent).detail));});
 await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('grass-verge'));
 const result=await page.evaluate(()=>{const root=(window as unknown as {fernObjects:THREE.Scene[]}).fernObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'))!.getObjectByName('Coastal landscape')!,old=root.getObjectByName('Curved coastal fern rosettes') as THREE.InstancedMesh;return{detail:root.userData.fernDetail,visible:old.visible,count:old.count,newMesh:Boolean(root.getObjectByName('Curved photographed fern near 0'))};});
 expect(result.detail.fallback).toBe(true);expect(result.visible).toBe(true);expect(result.count).toBeGreaterThan(0);expect(result.newMesh).toBe(false);
 await page.click('#menu-button');await page.click('#recover-button');await page.click('#auto-button');await expect.poll(async()=>page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__!.player!.speed),{timeout:10000}).toBeGreaterThan(2);
});

test('树木根部落在实际绘制的地形网格上',async({page})=>{
 await page.addInitScript(()=>{
  const globals=window as unknown as {__coastScenes:unknown[];__THREE_DEVTOOLS__:EventTarget};
  globals.__coastScenes=[];globals.__THREE_DEVTOOLS__=new EventTarget();
  globals.__THREE_DEVTOOLS__.addEventListener('observe',event=>globals.__coastScenes.push((event as CustomEvent).detail));
 });
 await page.goto('/?test=1');if(await page.locator('#landscape-prompt').isVisible())await page.click('#portrait-continue');await page.click('#start-button');
 const snapshot=await page.evaluate(()=>{
  const globals=window as unknown as {__coastScenes:THREE.Scene[]};
  const scene=globals.__coastScenes.find(s=>s.isScene&&s.getObjectByName('Coastal landscape'))!;
  const terrain=scene.getObjectByName('Limestone headland and grassy interior') as THREE.Mesh;
  const feet:number[][]=[];
  for(const name of ['Curved palm trunks','Stone pine trunks'])scene.getObjectByName(name)!.traverse(object=>{
   const mesh=object as THREE.InstancedMesh;if(!mesh.isInstancedMesh)return;
   const placements=mesh.userData.authoredInstances as THREE.Matrix4[];const matrix=mesh.matrix.clone();
   for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);if(!placements.some(m=>m.elements.every((v,k)=>Math.abs(v-matrix.elements[k])<.001)))throw Error('visible instance lost its authored transform');}
   for(const m of placements)feet.push([m.elements[12],m.elements[13],m.elements[14]]);
  });
  return{positions:Array.from(terrain.geometry.getAttribute('position').array as ArrayLike<number>),indices:Array.from(terrain.geometry.index!.array),feet:feet.filter((_,i)=>i%Math.ceil(feet.length/20)===0)};
 });
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(snapshot.positions,3));geometry.setIndex(snapshot.indices);
 const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),terrain=new THREE.Mesh(geometry,material),ray=new THREE.Raycaster();terrain.updateMatrixWorld(true);
 expect(snapshot.feet.length).toBeGreaterThan(10);
 for(const [x,y,z]of snapshot.feet){ray.set(new THREE.Vector3(x,150,z),new THREE.Vector3(0,-1,0));const hit=ray.intersectObject(terrain)[0];expect(hit,'tree must have terrain below it').toBeDefined();expect(Math.abs(y-hit.point.y),'root must touch the rendered surface').toBeLessThan(.03);}
 geometry.dispose();material.dispose();
});

test('实体岩岸背部埋入实际地形，礁石基座深入海面',async({page})=>{
 await page.addInitScript(()=>{
  const globals=window as unknown as {__coastScenes:unknown[];__THREE_DEVTOOLS__:EventTarget};globals.__coastScenes=[];globals.__THREE_DEVTOOLS__=new EventTarget();globals.__THREE_DEVTOOLS__.addEventListener('observe',event=>globals.__coastScenes.push((event as CustomEvent).detail));
 });
 await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('rock-side'));
 const snapshot=await page.evaluate(()=>{
  const scene=(window as unknown as {__coastScenes:THREE.Scene[]}).__coastScenes.find(s=>s.isScene&&s.getObjectByName('Coastal landscape'))!;
  const meshData=(mesh:THREE.Mesh)=>{const p=mesh.geometry.getAttribute('position');return{positions:Array.from({length:p.count},(_,i)=>[p.getX(i),p.getY(i),p.getZ(i)]).flat(),indices:Array.from(mesh.geometry.index!.array)};};
  const terrain=scene.getObjectByName('Limestone headland and grassy interior') as THREE.Mesh,root=scene.getObjectByName('Eroded sandstone headland')!;
  const cliffs=root.children.filter(group=>group.name.startsWith('sandstone-cut-'));
  return{terrain:meshData(terrain),parts:cliffs[0].children.map(mesh=>meshData(mesh as THREE.Mesh)),matrices:cliffs.map(group=>group.matrixWorld.toArray()),reefs:root.children.filter(group=>group.name.startsWith('Intertidal rock shelf')).map(group=>{
   let min=Infinity;group.traverse(o=>{const mesh=o as THREE.Mesh;if(!mesh.isMesh)return;const p=mesh.geometry.getAttribute('position');for(let i=0;i<p.count;i++)min=Math.min(min,p.getY(i)*group.scale.y+group.position.y);});return min;
  })};
 });
 expect(snapshot.matrices).toHaveLength(4);expect(snapshot.parts).toHaveLength(2);expect(snapshot.reefs).toHaveLength(2);for(const bottom of snapshot.reefs)expect(bottom).toBeLessThan(-5);
 const resources:THREE.BufferGeometry[]=[],material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
 const geometry=(data:typeof snapshot.terrain)=>{expect(data.positions.length%3).toBe(0);expect(data.positions.every(Number.isFinite)).toBe(true);expect(data.indices.every(index=>index>=0&&index<data.positions.length/3)).toBe(true);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(data.positions,3));g.setIndex(data.indices);resources.push(g);return g;};
 const terrain=new THREE.Mesh(geometry(snapshot.terrain),material),parts=snapshot.parts.map(geometry),ray=new THREE.Raycaster();terrain.updateMatrixWorld(true);
 for(const matrix of snapshot.matrices){const group=new THREE.Group();for(const part of parts)group.add(new THREE.Mesh(part,material));group.matrixAutoUpdate=false;group.matrix.fromArray(matrix);group.updateMatrixWorld(true);let contacts=0;
  for(const x of[-35,-20,0,20,35])for(const z of[-13,-17]){
   const p=new THREE.Vector3(x,0,z).applyMatrix4(group.matrixWorld);ray.set(new THREE.Vector3(p.x,120,p.z),new THREE.Vector3(0,-1,0));const rock=ray.intersectObject(group),land=ray.intersectObject(terrain)[0];if(rock.length<2)continue;
   expect(land).toBeDefined();const bottom=Math.min(...rock.map(hit=>hit.point.y));expect(bottom,'rock backing intersects solid land instead of hovering above it').toBeLessThan(land.point.y-.2);contacts++;
  }
  expect(contacts).toBeGreaterThanOrEqual(6);
 }
 resources.forEach(g=>g.dispose());material.dispose();
});

test('离岸岩岛具有闭合厚度和海下基座，三种山脊保持绘制预算',async({page},info)=>{
 const fixture=JSON.parse(await readFile(new URL('./fixtures/environment-placements.json',import.meta.url),'utf8')),baseline=fixture.platforms[info.project.name.includes('mobile')?'mobile':'desktop'];
 await page.addInitScript(()=>{const w=window as unknown as {coastObjects:unknown[];__THREE_DEVTOOLS__:EventTarget};w.coastObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.coastObjects.push((e as CustomEvent).detail));});
 await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('tree-shadow'));
 const variants=await page.evaluate(()=>{
  const scene=(window as unknown as {coastObjects:THREE.Scene[]}).coastObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'))!;
  return[0,1,2].map(variant=>{const mesh=scene.getObjectByName(`Weathered offshore rock ridge ${variant}`) as THREE.InstancedMesh,p=mesh.geometry.getAttribute('position');return{positions:Array.from({length:p.count},(_,i)=>[p.getX(i),p.getY(i),p.getZ(i)]),indices:Array.from(mesh.geometry.index!.array),matrices:(mesh.userData.authoredInstances as THREE.Matrix4[]).map(m=>m.toArray())};});
 });
 expect(new Set(variants.map(v=>JSON.stringify(v.positions))).size).toBe(3);let instances=0,triangles=0;
 for(const variant of variants){
  const vertices=variant.positions.map(p=>new THREE.Vector3(...p)),edges=new Map<string,{count:number;balance:number}>();let volume=0;
  for(let i=0;i<variant.indices.length;i+=3){
   const [a,b,c]=variant.indices.slice(i,i+3),normal=vertices[b].clone().sub(vertices[a]).cross(vertices[c].clone().sub(vertices[a]));expect(normal.lengthSq()).toBeGreaterThan(1e-10);volume+=vertices[a].dot(vertices[b].clone().cross(vertices[c]))/6;
   for(const [u,v]of[[a,b],[b,c],[c,a]]){const key=[Math.min(u,v),Math.max(u,v)].join(','),edge=edges.get(key)??{count:0,balance:0};edge.count++;edge.balance+=u<v?1:-1;edges.set(key,edge);}
  }
  for(const edge of edges.values()){expect(edge.count).toBe(2);expect(edge.balance).toBe(0);}expect(volume).toBeGreaterThan(.2);
  for(const values of variant.matrices){const matrix=new THREE.Matrix4().fromArray(values),points=vertices.map(p=>p.clone().applyMatrix4(matrix));expect(points.every(p=>[p.x,p.y,p.z].every(Number.isFinite))).toBe(true);expect(Math.min(...points.map(p=>p.y))).toBeLessThan(-10);expect(Math.max(...points.map(p=>p.y))).toBeGreaterThan(1);instances++;}
  triangles+=variant.indices.length/3*variant.matrices.length;
 }
 expect(instances).toBe(20);expect(triangles).toBeLessThanOrEqual(10560);
 const placement=await page.evaluate((names:string[])=>{
  const scene=(window as unknown as {coastObjects:THREE.Scene[]}).coastObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'))!,batches:Record<string,number[][]>={},islands:number[][]=[];
  for(let variant=0;variant<3;variant++){const mesh=scene.getObjectByName(`Weathered offshore rock ridge ${variant}`) as THREE.InstancedMesh;(mesh.userData.authoredInstances as THREE.Matrix4[]).forEach((matrix,index)=>{islands[index*3+variant]=matrix.toArray();});}
  for(const name of names){
   if(name==='Hazy offshore islets'){batches[name]=islands;continue;}
   const object=scene.getObjectByName(name)!,mesh=(object as THREE.InstancedMesh).isInstancedMesh?object:object.children.find(child=>child.name==='Visible detailed trees')!;
   batches[name]=(mesh.userData.authoredInstances as THREE.Matrix4[]).map(m=>m.toArray());
  }
  return{batches};
 },Object.keys(baseline.batches));
 // Shadow framing follows current crown geometry; compare placement directly.
 // Cache stability and actual receiving surfaces have dedicated sun checks.
 for(const name of Object.keys(baseline.batches)){
  const expected=baseline.batches[name];expect(placement.batches[name].length,name+' count').toBe(expected.count);
  for(const sample of expected.samples)for(let i=0;i<16;i++)expect(placement.batches[name][sample.index][i],name+' original transform '+sample.index).toBeCloseTo(sample.matrix[i],4);
 }
});
