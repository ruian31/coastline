import {test,expect} from '@playwright/test';
import * as THREE from 'three';
import {readFile} from 'node:fs/promises';

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
  const land=root.getObjectByName('Limestone headland and grassy interior') as THREE.Mesh,geometry=land.geometry as THREE.PlaneGeometry,n=geometry.parameters.widthSegments,p=geometry.getAttribute('position');
  const height=(x:number,z:number)=>{const gx=Math.max(0,Math.min(n,(x+530)/1060*n)),gz=Math.max(0,Math.min(n,(z+470)/940*n)),ix=Math.min(n-1,Math.floor(gx)),iz=Math.min(n-1,Math.floor(gz)),u=gx-ix,v=gz-iz,a=iz*(n+1)+ix,b=a+n+1,d=a+1,c=b+1;return u+v<=1?p.getY(a)*(1-u-v)+p.getY(d)*u+p.getY(b)*v:p.getY(d)*(1-v)+p.getY(b)*(1-u)+p.getY(c)*(u+v-1);};
  let slopeError=0;
  const key=(m:THREE.Matrix4)=>Array.from(new Float32Array(m.elements),v=>v.toFixed(3)).join(','),authored=new Set(original.map(key)),farKeys=new Set<string>(),nearKeys=new Set<string>(),unknown:string[]=[];let duplicates=0;
  for(const mesh of [far,...near])for(let i=0;i<mesh.count;i++){
   const m=mesh.matrix.clone();mesh.getMatrixAt(i,m);const k=key(m);if(!authored.has(k))unknown.push(k);if(farKeys.has(k)||nearKeys.has(k))duplicates++;(mesh===far?farKeys:nearKeys).add(k);
   if(mesh!==far){const slope=mesh.geometry.getAttribute('instanceGroundSlope'),x=m.elements[12],z=m.elements[14];slopeError=Math.max(slopeError,Math.abs(slope.getX(i)-(height(x+.15,z)-height(x-.15,z))/.3),Math.abs(slope.getY(i)-(height(x,z+.15)-height(x,z-.15))/.3));}
  }
  const material=near[0].material as THREE.MeshStandardMaterial,image=material.map!.image as {width:number;height:number};
  return{detail:root.userData.grassDetail,near:near.map(m=>m.count),far:far.count,duplicates,unknown,slopeError,texture:material.map!.uuid,dimensions:[image.width,image.height],alpha:material.alphaTest,doubleSided:material.side===2,shared:near.every(m=>(m.material as THREE.MeshStandardMaterial).map===material.map),triangles:near.map(m=>m.geometry.index!.count/3),grounded:near.every(m=>{m.geometry.computeBoundingBox();return Math.abs(m.geometry.boundingBox!.min.y)<.001;}),memory:window.__THREE_GAME_DIAGNOSTICS__!.renderer};
 });
 const low=await inspect(),limit=info.project.name.includes('mobile')?48:96;
 expect(low.detail.ready).toBe(true);expect(low.near.reduce((a,b)=>a+b,0)).toBeGreaterThan(0);expect(low.detail.selected).toBeLessThanOrEqual(limit);expect(low.detail.visible).toBe(low.near.reduce((a,b)=>a+b,0));
 expect(low.duplicates).toBe(0);expect(low.unknown).toEqual([]);expect(low.slopeError).toBeLessThan(.001);expect(low.shared).toBe(true);expect(low.dimensions).toEqual([1024,1024]);expect(low.alpha).toBeGreaterThan(.4);expect(low.doubleSided).toBe(true);expect(low.grounded).toBe(true);expect(low.triangles.every(n=>n<350)).toBe(true);
 // Use the real settings control; all quality tiers must reuse the atlas and
 // retain disjoint near/far sets when the low-density prefix changes.
 for(const quality of ['high','low','high','low']){
  await page.click('#menu-button');await page.selectOption('#quality-select',quality);await page.click('#resume-button');
  await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
  const current=await inspect();expect(current.texture).toBe(low.texture);expect(current.detail.selected).toBeLessThanOrEqual(limit);expect(current.duplicates).toBe(0);expect(current.unknown).toEqual([]);expect(current.slopeError).toBeLessThan(.001);
 }
 expect(errors).toEqual([]);
});

test('低草资源失效仍能开始和行驶，保留完整远景草',async({page})=>{
 await page.route('**/assets/models/coastal_grass/grass.gltf',route=>route.abort());
 await page.addInitScript(()=>{const w=window as unknown as {grassObjects:unknown[];__THREE_DEVTOOLS__:EventTarget};w.grassObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.grassObjects.push((e as CustomEvent).detail));});
 await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('grass-verge'));
 const fallback=await page.evaluate(()=>{
  const scene=(window as unknown as {grassObjects:THREE.Scene[]}).grassObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'))!,root=scene.getObjectByName('Coastal landscape')!,far=root.getObjectByName('Layered wind moving grass clusters') as THREE.InstancedMesh;
  return{detail:root.userData.grassDetail,visible:far.count,near:Boolean(root.getObjectByName('Photographed low coastal grass 0')),running:window.__THREE_GAME_DIAGNOSTICS__!.state!.running};
 });
 expect(fallback.detail.fallback).toBe(true);expect(fallback.visible).toBeGreaterThan(0);expect(fallback.near).toBe(false);expect(fallback.running).toBe(true);
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

for(const resource of ['scrub.gltf','scrub-impostors.png'])test('灌木载入失败保留原景观并允许开始 '+resource,async({page})=>{
 await page.route('**/assets/models/coastal_scrub/'+resource,route=>route.abort());
 await page.addInitScript(()=>{const w=window as unknown as {scrubObjects:unknown[];__THREE_DEVTOOLS__:EventTarget};w.scrubObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.scrubObjects.push((e as CustomEvent).detail));});
 await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('grass-verge'));
 const result=await page.evaluate(()=>{const scene=(window as unknown as {scrubObjects:THREE.Scene[]}).scrubObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'))!,root=scene.getObjectByName('Coastal landscape')!,old=root.getObjectByName('Fine leaf coastal maquis clusters') as THREE.InstancedMesh;return{fallback:root.userData.scrubDetail.fallback,original:old.visible&&old.count>0,loaded:Boolean(root.getObjectByName('Grey green coastal scrub near 0')),running:window.__THREE_GAME_DIAGNOSTICS__!.state!.running};});
 expect(result).toEqual({fallback:true,original:true,loaded:false,running:true});
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
