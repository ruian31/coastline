import {test,expect} from '@playwright/test';
import * as THREE from 'three';
import {PNG} from 'pngjs';

test('棕榈完整羽状叶共用分区贴图，近远互斥且切档复用资源',async({page},info)=>{
 test.setTimeout(60000);await page.setViewportSize({width:844,height:390});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));const w=window as unknown as {palmObjects:THREE.Scene[];__THREE_DEVTOOLS__:EventTarget};w.palmObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.palmObjects.push((e as CustomEvent).detail));});
 await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('grass-verge'));
 const inspect=()=>page.evaluate(()=>{
  const scene=(window as unknown as {palmObjects:THREE.Scene[]}).palmObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'))!,root=scene.getObjectByName('Coastal landscape')!,group=root.getObjectByName('Wind moving palm fronds')!,meshes=group.children as THREE.InstancedMesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>[],material=meshes[0].material,map=material.map!,authors=meshes[0].userData.authoredInstances as THREE.Matrix4[],key=(a:ArrayLike<number>)=>Array.from(a,n=>n.toFixed(3)).join(','),authorKeys=new Set(authors.map(m=>key(m.elements))),seen=new Set<string>();let valid=true,duplicates=0,unknown=0;
  for(const mesh of meshes){const p=mesh.geometry.getAttribute('position'),n=mesh.geometry.getAttribute('normal'),uv=mesh.geometry.getAttribute('uv');for(let i=0;i<p.count;i++)if(![p.getX(i),p.getY(i),p.getZ(i)].every(Number.isFinite)||Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)>.001||uv.getX(i)<0||uv.getX(i)>1||uv.getY(i)<0||uv.getY(i)>1)valid=false;for(let i=0;i<mesh.count;i++){const k=key(mesh.instanceMatrix.array.slice(i*16,i*16+16));if(!authorKeys.has(k))unknown++;if(seen.has(k))duplicates++;seen.add(k);}}
  return{detail:root.userData.palmFronds,shared:meshes.every(m=>m.material===material),map:map.uuid,mips:map.mipmaps.length,regions:map.userData.alphaCoverage.regions.length,coverage:map.userData.alphaCoverage.coverage,manual:!map.generateMipmaps,space:map.colorSpace,alpha:material.alphaTest,centered:material.customProgramCacheKey().includes('plant-centered-alpha-v1'),rigid:material.userData.rigidTree,valid,duplicates,unknown,visible:seen.size,triangles:meshes.map(m=>m.geometry.getAttribute('position').count/3),sun:{...scene.userData.sunShadows}};
 });
 const initial=await inspect(),mobile=info.project.name.includes('mobile');expect(initial.detail.ready).toBe(true);expect(initial.detail.size).toBe(mobile?512:1024);expect(initial.mips).toBe(mobile?10:11);expect(initial.regions).toBe(4);expect(initial.coverage.every((n:number)=>n>.1&&n<.8)).toBe(true);expect(initial.triangles).toEqual(mobile?[625,345]:[801,441]);
 for(const state of ['field-verge','active-play','grass-verge']){
  await page.evaluate(async state=>{await window.__THREE_GAME_TEST_HOOKS__!.setState(state);window.__THREE_GAME_TEST_HOOKS__!.setPausedForScreenshot(true);},state);const current=await inspect();expect(current.shared&&current.manual&&current.centered&&current.rigid&&current.valid).toBe(true);expect(current.space).toBe('srgb');expect(current.alpha).toBe(.4);expect(current.duplicates+current.unknown).toBe(0);expect(current.visible).toBeGreaterThan(0);expect(current.map).toBe(initial.map);expect(current.sun.bakes).toBe(1);
 }
 await page.click('#menu-button');for(const quality of ['high','low']){await page.selectOption('#quality-select',quality);await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));expect((await inspect()).map).toBe(initial.map);}
 expect(errors).toEqual([]);
});

for(const failure of ['request','dimensions'])test('棕榈叶图失效恢复实体旧树冠并仍可驾驶 '+failure,async({page},info)=>{
 test.setTimeout(60000);await page.setViewportSize({width:844,height:390});
 if(failure==='request')await page.route('**/assets/environment/palm-fronds-*.webp',r=>r.abort());
 else{const image=new PNG({width:16,height:16});image.data.fill(255);await page.route('**/assets/environment/palm-fronds-*.webp',r=>r.fulfill({body:PNG.sync.write(image),contentType:'image/png'}));}
 await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));const w=window as unknown as {palmObjects:THREE.Scene[];__THREE_DEVTOOLS__:EventTarget};w.palmObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.palmObjects.push((e as CustomEvent).detail));});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('grass-verge'));
 const before=await page.evaluate(()=>{const root=(window as unknown as {palmObjects:THREE.Scene[]}).palmObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'))!.getObjectByName('Coastal landscape')!,meshes=root.getObjectByName('Wind moving palm fronds')!.children as THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>[];return{detail:root.userData.palmFronds,plain:meshes.every(m=>!m.material.map&&m.material.alphaTest===0),triangles:meshes.map(m=>m.geometry.getAttribute('position').count/3),position:window.__THREE_GAME_DIAGNOSTICS__!.player!.position!};});
 expect(before.detail.fallback&&before.plain).toBe(true);expect(before.triangles).toEqual(info.project.name.includes('mobile')?[1185,401]:[2673,729]);
 await page.keyboard.down('ArrowUp');try{await expect.poll(async()=>page.evaluate(start=>{const p=window.__THREE_GAME_DIAGNOSTICS__!.player!.position!;return Math.hypot(p.x-start.x,p.z-start.z);},before.position),{timeout:15000}).toBeGreaterThan(2);}finally{await page.keyboard.up('ArrowUp');}expect(errors).toEqual([]);
});

test('扫描海岸树共用材质与逐簇图集，近远LOD互斥且树根埋入真实坡面',async({page})=>{
 test.setTimeout(100000);await page.setViewportSize({width:844,height:390});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>{const w=window as unknown as {treeObjects:unknown[];__THREE_DEVTOOLS__:EventTarget};w.treeObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.treeObjects.push((e as CustomEvent).detail));localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));});
 await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('coastal-tree-near'));
 const snapshot=await page.evaluate(()=>{
  const objects=(window as unknown as {treeObjects:THREE.Scene[]}).treeObjects,scene=objects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'))!,root=scene.getObjectByName('Coastal landscape')!,group=root.getObjectByName('Wind-shaped coastal trees')!,near=group.children[0] as THREE.InstancedMesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>,far=group.children[1] as typeof near,material=near.material,map=material.map!,surface=material.normalMap!,terrain=root.getObjectByName('Limestone headland and grassy interior') as THREE.Mesh;
  const data=(g:THREE.BufferGeometry)=>({positions:Array.from(g.getAttribute('position').array),indices:Array.from(g.index!.array)}),matrices=near.userData.authoredInstances as THREE.Matrix4[],p=near.geometry.getAttribute('position'),feet:number[][]=[];
  for(const m of matrices)for(let i=0;i<p.count;i++)if(p.getY(i)<.08)feet.push(terrain.position.clone().fromBufferAttribute(p,i).applyMatrix4(m).toArray());
  const valid=group.children.every(o=>{const g=(o as THREE.Mesh).geometry,n=g.getAttribute('normal'),uv=g.getAttribute('uv');for(let i=0;i<n.count;i++){const length=Math.hypot(n.getX(i),n.getY(i),n.getZ(i));if(!Number.isFinite(length)||Math.abs(length-1)>.001||uv.getX(i)<0||uv.getX(i)>1||uv.getY(i)<0||uv.getY(i)>1)return false;}return true;});
  const renderer=(objects as unknown as {isWebGLRenderer?:boolean}[]).find(o=>o.isWebGLRenderer)! as unknown as THREE.WebGLRenderer,program=(renderer.properties.get(material) as {currentProgram:{program:WebGLProgram;fragmentShader:WebGLShader}}).currentProgram,gl=renderer.getContext(),fragment=gl.getShaderSource(program.fragmentShader)!;
  return{linked:gl.getProgramParameter(program.program,gl.LINK_STATUS),surfaceShader:fragment.includes('vRoughnessMapUv.x*2.0')&&fragment.includes('texelRoughness.a'),ready:root.userData.coastalTrees,shared:near.material===far.material,packed:surface===material.roughnessMap,mapSize:[(map.image as HTMLCanvasElement).width,(map.image as HTMLCanvasElement).height],surfaceSize:[(surface.image as HTMLImageElement).width,(surface.image as HTMLImageElement).height],mips:map.mipmaps.length,regions:map.userData.alphaCoverage.regions.length,rigid:material.userData.rigidTree,key:material.customProgramCacheKey(),old:!!root.getObjectByName('Stone pine trunks'),valid,feet,terrain:data(terrain.geometry),triangles:group.children.map(o=>(o as THREE.Mesh).geometry.index!.count/3),placements:matrices.map(m=>m.toArray())};
 });
 expect(snapshot.ready.ready).toBe(true);expect(snapshot.linked&&snapshot.surfaceShader).toBe(true);expect(snapshot.ready.rootSinks.every((s:number)=>s>0&&s<2)).toBe(true);expect(snapshot.shared&&snapshot.packed&&snapshot.valid&&snapshot.rigid).toBe(true);expect(snapshot.old).toBe(false);expect(snapshot.mapSize).toEqual([2048,2048]);expect(snapshot.surfaceSize).toEqual([512,256]);expect(snapshot.mips).toBe(12);expect(snapshot.regions).toBe(765);expect(snapshot.triangles).toEqual([5371,1431]);expect(snapshot.key).toContain('coastal-scanned-tree-three-view-v1');expect(snapshot.feet.length).toBeGreaterThan(100);
 // Broad phase over the actual triangle AABBs. Every foot is still raycast;
 // do not rescan the entire island for each of thousands of root vertices.
 const position=new THREE.Float32BufferAttribute(snapshot.terrain.positions,3),cells=new Map<string,number[]>(),meshes=new Map<string,THREE.Mesh>(),material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),ray=new THREE.Raycaster();let maxClearance=-Infinity,hits=0;
 for(let i=0;i<snapshot.terrain.indices.length;i+=3){const face=snapshot.terrain.indices.slice(i,i+3),xs=face.map(v=>position.getX(v)),zs=face.map(v=>position.getZ(v));for(let x=Math.floor(Math.min(...xs)/8);x<=Math.floor(Math.max(...xs)/8);x++)for(let z=Math.floor(Math.min(...zs)/8);z<=Math.floor(Math.max(...zs)/8);z++){const key=x+','+z,indices=cells.get(key)??[];indices.push(...face);cells.set(key,indices);}}
 for(const foot of snapshot.feet){const key=Math.floor(foot[0]/8)+','+Math.floor(foot[2]/8);let mesh=meshes.get(key);if(!mesh){mesh=new THREE.Mesh(new THREE.BufferGeometry().setAttribute('position',position).setIndex(cells.get(key)??[]),material);mesh.updateMatrixWorld(true);meshes.set(key,mesh);}ray.set(new THREE.Vector3(foot[0],150,foot[2]),new THREE.Vector3(0,-1,0));const hit=ray.intersectObject(mesh)[0];if(hit){hits++;maxClearance=Math.max(maxClearance,foot[1]-hit.point.y);}}
 expect(hits).toBe(snapshot.feet.length);expect(maxClearance).toBeLessThan(.002);expect(maxClearance).toBeGreaterThan(-.02);meshes.forEach(m=>m.geometry.dispose());material.dispose();
 for(const state of['coastal-tree-side','bank-inland','coastal-tree-near']){
  await page.evaluate(async state=>{await window.__THREE_GAME_TEST_HOOKS__!.setState(state);window.__THREE_GAME_TEST_HOOKS__!.setPausedForScreenshot(true);},state);
  const visible=await page.evaluate(()=>{const scene=(window as unknown as {treeObjects:THREE.Scene[]}).treeObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'))!,group=scene.getObjectByName('Wind-shaped coastal trees')!;return group.children.map(o=>{const m=o as THREE.InstancedMesh,matrix=m.matrix.clone();return Array.from({length:m.count},(_,i)=>{m.getMatrixAt(i,matrix);return matrix.toArray();});});});
  const identify=(matrix:number[])=>snapshot.placements.findIndex(m=>m.every((v,i)=>Math.abs(v-matrix[i])<.0001)),near=new Set(visible[0].map(identify)),far=new Set(visible[1].map(identify));
  expect(near.has(-1)||far.has(-1)).toBe(false);expect(near.size).toBe(visible[0].length);expect(far.size).toBe(visible[1].length);for(const index of near)expect(far.has(index)).toBe(false);expect(near.size+far.size).toBeGreaterThan(0);
 }
 expect(errors).toEqual([]);
});

test('扫描树加载失败仍保留原树并能继续驾驶',async({page})=>{
 test.setTimeout(60000);await page.setViewportSize({width:844,height:390});
 await page.route('**/assets/models/coastal_tree/tree.bin',route=>route.abort());
 await page.addInitScript(()=>{const w=window as unknown as {treeObjects:THREE.Scene[];__THREE_DEVTOOLS__:EventTarget};w.treeObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.treeObjects.push((e as CustomEvent).detail));});
 await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('bank-inland'));
 const result=await page.evaluate(()=>{const scene=(window as unknown as {treeObjects:THREE.Scene[]}).treeObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'))!,root=scene.getObjectByName('Coastal landscape')!;return{...root.userData.coastalTrees,old:!!root.getObjectByName('Stone pine trunks'),scanned:!!root.getObjectByName('Wind-shaped coastal trees')};});
 expect(result.fallback&&result.old).toBe(true);expect(result.scanned).toBe(false);const start=await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__!.player!.position!);
 await page.keyboard.down('ArrowUp');try{await expect.poll(async()=>page.evaluate(start=>{const p=window.__THREE_GAME_DIAGNOSTICS__!.player!.position!;return Math.hypot(p.x-start.x,p.z-start.z);},start),{timeout:15000}).toBeGreaterThan(3);}finally{await page.keyboard.up('ArrowUp');}
});
