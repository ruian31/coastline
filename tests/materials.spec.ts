import {test,expect} from '@playwright/test';
import {PNG} from 'pngjs';
import type * as THREE from 'three';

test('实拍棕榈树皮共享表面纹理、正确读取A粗糙度并复用切档资源',async({page})=>{
 await page.setViewportSize({width:844,height:390});
 await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));const w=window as unknown as {barkObjects:unknown[];__THREE_DEVTOOLS__:EventTarget};w.barkObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.barkObjects.push((e as CustomEvent).detail));});
 const requests:string[]=[],errors:string[]=[];page.on('request',r=>{if(r.url().includes('/palm-bark-'))requests.push(r.url());});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('field-verge'));
 const inspect=()=>page.evaluate(()=>{
  const objects=(window as unknown as {barkObjects:unknown[]}).barkObjects,scene=objects.find(o=>(o as THREE.Scene).isScene&&(o as THREE.Scene).getObjectByName('Coastal landscape')) as THREE.Scene,renderer=objects.find(o=>(o as {isWebGLRenderer?:boolean}).isWebGLRenderer) as THREE.WebGLRenderer,root=scene.getObjectByName('Coastal landscape')!,mesh=root.getObjectByName('Curved palm trunks')!.children[0] as THREE.InstancedMesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>,material=mesh.material;
  const {uniforms,currentProgram}=renderer.properties.get(material) as {uniforms:Record<string,{value:THREE.Texture}>;currentProgram:{vertexShader:WebGLShader;fragmentShader:WebGLShader}},gl=renderer.getContext(),vertex=gl.getShaderSource(currentProgram.vertexShader)??'',fragment=gl.getShaderSource(currentProgram.fragmentShader)??'',uv=mesh.geometry.getAttribute('uv');
  // Pair actual coincident vertices independently of TubeGeometry's row layout.
  const positions=mesh.geometry.getAttribute('position'),normals=mesh.geometry.getAttribute('normal'),byPosition=new Map<string,number[]>();let seamPairs=0,maxSeamAngle=0;
  for(let i=0;i<positions.count;i++){const key=[positions.getX(i),positions.getY(i),positions.getZ(i)].map(v=>Math.round(v*1e5)).join(',');const same=byPosition.get(key)??[];for(const other of same){const a=[normals.getX(i),normals.getY(i),normals.getZ(i)],b=[normals.getX(other),normals.getY(other),normals.getZ(other)],dot=a.reduce((sum,v,c)=>sum+v*b[c],0)/(Math.hypot(...a)*Math.hypot(...b));maxSeamAngle=Math.max(maxSeamAngle,Math.acos(Math.min(1,Math.max(-1,dot)))*180/Math.PI);seamPairs++;}same.push(i);byPosition.set(key,same);}
  return{ready:root.userData.palmBark.ready,key:material.customProgramCacheKey(),shared:uniforms.normalMap.value===uniforms.roughnessMap.value&&uniforms.normalMap.value===material.normalMap,textures:[material.map!,material.normalMap!].map(t=>{const image=t.image as HTMLImageElement;return{id:t.uuid,size:[image.width,image.height],colorSpace:t.colorSpace,mips:t.generateMipmaps};}),alphaRoughness:fragment.includes('texelRoughness.a'),alignedPhase:['vMapUv+=barkPhase','vNormalMapUv+=barkPhase','vRoughnessMapUv+=barkPhase'].every(code=>vertex.includes(code)),uRange:Math.max(...Array.from({length:uv.count},(_,i)=>uv.getX(i))),vRange:Math.max(...Array.from({length:uv.count},(_,i)=>uv.getY(i))),triangles:mesh.geometry.index!.count/3,seamPairs,maxSeamAngle};
 });
 const initial=await inspect();expect(initial.ready&&initial.shared&&initial.alphaRoughness&&initial.alignedPhase).toBe(true);expect(initial.key).toContain('palm-photo-phase-v1');expect(initial.textures.map(t=>t.size)).toEqual([[512,1024],[512,1024]]);expect(initial.textures.map(t=>t.colorSpace)).toEqual(['srgb','']);expect(initial.textures.every(t=>t.mips)).toBe(true);expect(initial.uRange).toBe(2);expect(initial.vRange).toBeGreaterThan(5.9);expect(initial.vRange).toBeLessThan(6.2);expect(initial.triangles).toBeLessThanOrEqual(260);
 expect(initial.seamPairs).toBeGreaterThan(5);expect(initial.maxSeamAngle).toBeLessThan(.01);
 for(const tier of ['high','low','high','low']){await page.click('#menu-button');await page.selectOption('#quality-select',tier);await page.click('#resume-button');await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));const next=await inspect();expect(next.shared&&next.alphaRoughness&&next.alignedPhase).toBe(true);expect(next.textures.map(t=>t.id)).toEqual(initial.textures.map(t=>t.id));}
 expect(requests.filter(url=>url.endsWith('palm-bark-color.jpg'))).toHaveLength(1);expect(requests.filter(url=>url.endsWith('palm-bark-surface.webp'))).toHaveLength(1);expect(errors).toEqual([]);
});

for(const file of ['palm-bark-color.jpg','palm-bark-surface.webp'])test('树皮贴图失败保留完整树干且仍能开始巡航 '+file,async({page})=>{
 await page.setViewportSize({width:844,height:390});await page.route('**/'+file,route=>route.abort());
 await page.addInitScript(()=>{const w=window as unknown as {barkObjects:unknown[];__THREE_DEVTOOLS__:EventTarget};w.barkObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.barkObjects.push((e as CustomEvent).detail));});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/?test=1');await page.click('#start-auto');
 await expect.poll(()=>page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__!.player!.speed)).toBeGreaterThan(2);
 const result=await page.evaluate(()=>{const scene=(window as unknown as {barkObjects:THREE.Scene[]}).barkObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'))!,root=scene.getObjectByName('Coastal landscape')!,mesh=root.getObjectByName('Curved palm trunks')!.children[0] as THREE.InstancedMesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>;return{bark:root.userData.palmBark,plain:!mesh.material.map&&!mesh.material.normalMap&&!mesh.material.roughnessMap,geometry:mesh.geometry.index!.count/3};});
 expect(result.bark).toEqual({ready:false,fallback:true});expect(result.plain).toBe(true);expect(result.geometry).toBeGreaterThan(100);expect(errors).toEqual([]);
});

test('干草地、海砂与岩岸共用八张实际GPU表面纹理',async({page})=>{
 await page.setViewportSize({width:844,height:390});
 await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));const w=window as unknown as {surfaceObjects:unknown[];__THREE_DEVTOOLS__:EventTarget};w.surfaceObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.surfaceObjects.push((e as CustomEvent).detail));});
 const requests:string[]=[],errors:string[]=[];page.on('request',r=>{if(r.url().includes('/assets/environment/'))requests.push(new URL(r.url()).pathname.split('/').at(-1)!);});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('field-verge'));
 const result=await page.evaluate(()=>{
  const objects=(window as unknown as {surfaceObjects:unknown[]}).surfaceObjects,scene=objects.find(o=>(o as THREE.Scene).isScene&&(o as THREE.Scene).getObjectByName('Coastal landscape')) as THREE.Scene,renderer=objects.find(o=>(o as {isWebGLRenderer?:boolean}).isWebGLRenderer) as THREE.WebGLRenderer,root=scene.getObjectByName('Coastal landscape')!,ground=(root.getObjectByName('Limestone headland and grassy interior') as THREE.Mesh<THREE.BufferGeometry,THREE.Material>).material;
  // Inspect the uniforms of the program actually prepared by WebGLRenderer;
  // unreferenced files in public/ must not count as integrated PBR surfaces.
  const {uniforms}=renderer.properties.get(ground) as {uniforms:Record<string,{value:THREE.Texture}>},roles=['GroundColor','GroundSurface','SandColor','SandSurface','FieldColor','FieldSurface','RockColor','RockSurface'];
  return{key:ground.customProgramCacheKey(),textures:roles.map(role=>{const texture=uniforms['u'+role].value,image=texture.image as HTMLImageElement;return{role,id:texture.uuid,width:image.width,height:image.height,colorSpace:texture.colorSpace,src:image.currentSrc,mipmaps:texture.generateMipmaps};}),shoulders:scene.getObjectByName('road-network')!.children.filter(o=>(o as THREE.Mesh).material===ground).length};
 });
 expect(result.key).toContain('coastal-dry-field-rock-v6');expect(result.shoulders).toBe(6);expect(new Set(result.textures.map(t=>t.id)).size).toBe(8);
 for(const texture of result.textures){expect([texture.width,texture.height]).toEqual([1024,1024]);expect(texture.colorSpace).toBe(texture.role.endsWith('Color')?'srgb':'');expect(texture.mipmaps).toBe(true);}
 for(const file of ['ground-surface.webp','sand-surface.webp','field-color.jpg','field-surface.webp'])expect(requests.filter(r=>r===file).length).toBe(1);
 for(const file of ['ground-normal.jpg','ground-roughness.jpg','sand-normal.jpg','sand-roughness.jpg'])expect(requests).not.toContain(file);
 expect(errors).toEqual([]);
});

const region=(buffer:Buffer,box:[number,number,number,number])=>{
 const png=PNG.sync.read(buffer),sum=[0,0,0];let count=0;
 for(let y=box[1];y<box[3];y++)for(let x=box[0];x<box[2];x++){const index=(y*png.width+x)*4;for(let c=0;c<3;c++)sum[c]+=png.data[index+c];count++;}
 return sum.map(value=>value/count);
};

test('冷加载后车漆与沥青保持各自材质',async({page},info)=>{
 test.skip(!info.project.name.includes('mobile'),'保护曾出现异常的手机构图');
 await page.setViewportSize({width:390,height:664});await page.goto('/?test=1');
 const capture=async(name:string)=>{
  await page.evaluate(async state=>{const hooks=window.__THREE_GAME_TEST_HOOKS__!;hooks.setPausedForScreenshot(false);await hooks.setState(state);hooks.setPausedForScreenshot(true);hooks.setReducedMotion(true);await document.fonts.ready;await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));},name);
  return page.screenshot({scale:'css'});
 };
 const [red,green,blue]=region(await capture('tunnel'),[174,407,210,437]);
 expect(green-red,'cyan paint must not disappear into gray asphalt').toBeGreaterThan(10);
 expect(blue).toBeGreaterThan(110);
 const road=region(await capture('sport'),[165,260,215,290]);
 expect(road.reduce((sum,value)=>sum+value,0)/3,'asphalt must not become pale terrain').toBeLessThan(155);
});
