import {test,expect} from '@playwright/test';
import {PNG} from 'pngjs';
import type * as THREE from 'three';

test('完整叶灌丛保留分区mip，中心裁切与内陆覆盖同时编译',async({page},info)=>{
 await page.setViewportSize({width:844,height:390});
 await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));const w=window as unknown as {plantObjects:unknown[];plantClosedBitmaps:number[][];__THREE_DEVTOOLS__:EventTarget};w.plantObjects=[];w.plantClosedBitmaps=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.plantObjects.push((e as CustomEvent).detail));if(typeof ImageBitmap!=='undefined'){const close=ImageBitmap.prototype.close;ImageBitmap.prototype.close=function(this:ImageBitmap){w.plantClosedBitmaps.push([this.width,this.height]);close.call(this);};}});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('grass-verge'));
 const report=await page.evaluate(async()=>{
  const scene=(window as unknown as {plantObjects:THREE.Scene[]}).plantObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'))!,root=scene.getObjectByName('Coastal landscape')!,names=['Grey green coastal scrub near 0','Inland grey green scrub near 0'],meshes=names.map(n=>root.getObjectByName(n) as THREE.InstancedMesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>);
  for(const [i,mesh]of meshes.entries()){
   const m=mesh.material,compile=m.onBeforeCompile,key=m.customProgramCacheKey();m.onBeforeCompile=(shader,renderer)=>{compile(shader,renderer);m.userData.checkedFragment=shader.fragmentShader;};m.customProgramCacheKey=()=>key+'-qa-plant-'+i;m.needsUpdate=true;
  }
  await new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r())));
  const map=meshes[0].material.map!,proxy=(root.getObjectByName('Inland grey green scrub impostor 0') as typeof meshes[0]).material.map!;
  const renderer=(window as unknown as {plantObjects:(THREE.WebGLRenderer&{isWebGLRenderer:boolean})[]}).plantObjects.find(o=>o.isWebGLRenderer)!,gl=renderer.getContext(),linked=(renderer.info.programs??[]).map(p=>gl.getProgramParameter((p as unknown as {program:WebGLProgram}).program,gl.LINK_STATUS) as boolean);
  return{linked,closedBitmaps:(window as unknown as {plantClosedBitmaps:number[][]}).plantClosedBitmaps,shared:meshes[1].material.map===map,canvas:map.image instanceof HTMLCanvasElement,baseIsImage:map.mipmaps[0]===map.image,generateMipmaps:map.generateMipmaps,mips:(map.mipmaps as HTMLCanvasElement[]).map(m=>[m.width,m.height]),coverage:map.userData.alphaCoverage,colorSpace:map.colorSpace,proxySize:[(proxy.image as HTMLImageElement).width,(proxy.image as HTMLImageElement).height],materials:meshes.map(mesh=>{const m=mesh.material,fragment=m.userData.checkedFragment as string|undefined;return{callbackCalled:!!fragment,centered:fragment?.includes('alphaTest - fwidth( diffuseColor.a ) * .5'),range:fragment?.includes('float scrubCoverage=1.0-smoothstep('),key:m.customProgramCacheKey()};}),triangles:['near','far'].flatMap(lod=>[0,1].map(v=>(root.getObjectByName(`Grey green coastal scrub ${lod} ${v}`) as THREE.Mesh).geometry.index!.count/3))};
 });
 expect(report.shared&&report.canvas&&report.baseIsImage).toBe(true);expect(report.generateMipmaps).toBe(false);expect(report.colorSpace).toBe('srgb');expect(report.proxySize).toEqual([512,512]);expect(report.mips).toEqual(Array.from({length:11},(_,i)=>[1024/2**i,1024/2**i]));expect(report.coverage.regions).toEqual([[0,0,625,420],[0,420,625,604],...Array.from({length:16},(_,i)=>[640+i%3*80,Math.floor(i/3)*160,80,160])]);expect(report.coverage.averaging).toBe('linear-light alpha-weighted sRGB');expect(report.materials.every(m=>m.callbackCalled&&m.centered&&m.key.includes('plant-centered-alpha-v1'))).toBe(true);expect(report.materials.map(m=>m.range)).toEqual([false,true]);expect(report.triangles).toEqual([7232,6302,2129,1735]);expect(report.linked.length).toBeGreaterThan(0);expect(report.linked.every(Boolean)).toBe(true);expect(report.closedBitmaps.length).toBeLessThanOrEqual(2);if(info.project.name.includes('chrome'))expect(report.closedBitmaps).toEqual([[1024,1024],[1024,1024]]);expect(errors).toEqual([]);
});

test('近远草保留完整mip与干草颜色，实际GPU程序包含风动和覆盖渐隐',async({page})=>{
 await page.setViewportSize({width:844,height:390});
 await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));const w=window as unknown as {grassMaterialObjects:unknown[];__THREE_DEVTOOLS__:EventTarget};w.grassMaterialObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.grassMaterialObjects.push((e as CustomEvent).detail));});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('field-verge'));
 const report=await page.evaluate(()=>{
  const observed=(window as unknown as {grassMaterialObjects:unknown[]}).grassMaterialObjects,scene=observed.find(o=>(o as THREE.Scene).isScene&&(o as THREE.Scene).getObjectByName('Coastal landscape')) as THREE.Scene,renderer=observed.find(o=>(o as {isWebGLRenderer?:boolean}).isWebGLRenderer) as THREE.WebGLRenderer,root=scene.getObjectByName('Coastal landscape')!,gl=renderer.getContext();
  return[['Photographed dry inland grass 0','Photographed low coastal grass 0'],['Dry inland patch grass clusters','Layered wind moving grass clusters']].map(([name,road])=>{
   const mesh=root.getObjectByName(name) as THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>,m=mesh.material,map=m.map!,p=(renderer.properties.get(m) as {currentProgram?:{program:WebGLProgram;vertexShader:WebGLShader;fragmentShader:WebGLShader}}).currentProgram,vertex=p?gl.getShaderSource(p.vertexShader)??'':'',fragment=p?gl.getShaderSource(p.fragmentShader)??'':'';
   return{shared:map===(root.getObjectByName(road) as typeof mesh).material.map,canvas:map.image instanceof HTMLCanvasElement,allCanvas:(map.mipmaps as HTMLCanvasElement[]).every(m=>m instanceof HTMLCanvasElement),mips:(map.mipmaps as HTMLCanvasElement[]).map(m=>[m.width,m.height]),generateMipmaps:map.generateMipmaps,flipY:map.flipY,coverage:map.userData.alphaCoverage,linked:p?gl.getProgramParameter(p.program,gl.LINK_STATUS) as boolean:false,wind:vertex.includes('uSceneryTime'),ground:vertex.includes('instanceGroundSlope'),centered:fragment.includes('alphaTest - fwidth( diffuseColor.a ) * .5'),dry:fragment.includes('float dryGrassValue'),fade:fragment.includes('float fieldCoverage'),alphaMultiplication:fragment.includes('diffuseColor.a*=1.0-smoothstep(')};
  });
 });
 for(const [i,r]of report.entries()){const size=i===0?1024:256;expect(r.shared&&r.canvas&&r.allCanvas&&r.linked&&r.wind&&r.ground&&r.centered&&r.dry).toBe(true);expect(r.generateMipmaps).toBe(false);expect(r.mips).toEqual(Array.from({length:i===0?11:9},(_,i)=>[size/2**i,size/2**i]));expect(r.coverage.regions).toEqual([[0,0,size,size]]);expect(r.coverage.threshold).toBe(i===0?.43:.46);expect(r.coverage.averaging).toBe('linear-light alpha-weighted sRGB');expect(r.fade).toBe(i===1);expect(r.alphaMultiplication).toBe(false);}
 expect(report.map(r=>r.flipY)).toEqual([false,true]);expect(errors).toEqual([]);
});

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
 expect(result.key).toContain('coastal-dry-field-rock-v8');expect(result.shoulders).toBe(6);expect(new Set(result.textures.map(t=>t.id)).size).toBe(8);
 for(const texture of result.textures){expect([texture.width,texture.height]).toEqual([1024,1024]);expect(texture.colorSpace).toBe(texture.role.endsWith('Color')?'srgb':'');expect(texture.mipmaps).toBe(true);}
 for(const file of ['ground-surface.webp','sand-surface.webp','meadow-color.webp','meadow-surface.webp'])expect(requests.filter(r=>r===file).length).toBe(1);
 for(const file of ['ground-normal.jpg','ground-roughness.jpg','sand-normal.jpg','sand-roughness.jpg','field-color.jpg','field-surface.webp'])expect(requests).not.toContain(file);
 expect(errors).toEqual([]);
});

const region=(buffer:Buffer,box:[number,number,number,number])=>{
 const png=PNG.sync.read(buffer),sum=[0,0,0];let count=0;
 for(let y=box[1];y<box[3];y++)for(let x=box[0];x<box[2];x++){const index=(y*png.width+x)*4;for(let c=0;c<3;c++)sum[c]+=png.data[index+c];count++;}
 return sum.map(value=>value/count);
};

test('手机离路环顾的连续帧保留蓝色车漆',async({page},info)=>{
 test.skip(!info.project.name.includes('mobile'),'复查横屏手机首次出现的部分车身缺失');
 await page.setViewportSize({width:844,height:390});await page.addInitScript(()=>localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true})));
 await page.goto('/?test=1');await page.evaluate(async()=>{const h=window.__THREE_GAME_TEST_HOOKS__!;await h.setState('field-verge');h.setPausedForScreenshot(true);h.setReducedMotion(true);});
 await page.mouse.move(844*.85,390*.43);await page.mouse.down();await page.mouse.move(844*.85-Math.PI/.005,390*.43,{steps:50});await page.mouse.up();await page.waitForTimeout(700);
 for(let frame=0;frame<4;frame++){
  const png=PNG.sync.read(await page.screenshot({scale:'css'}));let cyan=0,total=0;
  // Hood inside the actual fixed 844×390 reverse driving camera.
  for(let y=200;y<224;y++)for(let x=392;x<444;x++){const i=(y*png.width+x)*4,r=png.data[i],g=png.data[i+1],b=png.data[i+2];if(g-r>8&&b-r>8)cyan++;total++;}
  expect(cyan/total,'hood paint must cover the soil in every captured frame').toBeGreaterThan(.3);await page.waitForTimeout(100);
 }
});

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
