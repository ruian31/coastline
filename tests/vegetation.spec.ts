import {test,expect} from '@playwright/test';
import type * as THREE from 'three';

test('车辆压力场共用GPU纹理，驾驶留下深浅压痕且切档暂停保持记录',async({page})=>{
 test.setTimeout(100000);await page.setViewportSize({width:844,height:390});
 await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));const w=window as unknown as {interactionObjects:unknown[];__THREE_DEVTOOLS__:EventTarget};w.interactionObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.interactionObjects.push((e as CustomEvent).detail));});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('bank-inland'));
 const inspect=()=>page.evaluate(()=>{
  const objects=(window as unknown as {interactionObjects:unknown[]}).interactionObjects,scene=objects.find(o=>(o as THREE.Scene).isScene&&(o as THREE.Scene).getObjectByName('Coastal landscape')) as THREE.Scene,renderer=objects.find(o=>(o as {isWebGLRenderer?:boolean}).isWebGLRenderer) as THREE.WebGLRenderer,root=scene.getObjectByName('Coastal landscape')!,gl=renderer.getContext();
  const names=['World anchored dry grass canopy','Photographed low coastal grass 0','Photographed dry inland grass 0','Grey green coastal scrub near 0','Inland grey green scrub near 0','Curved photographed fern near 0'];
  const properties=(m:THREE.Material)=>renderer.properties.get(m) as {uniforms:Record<string,{value:THREE.DataTexture|THREE.Vector3|number}>;currentProgram:{program:WebGLProgram;vertexShader:WebGLShader}};
  if(!root.userData.fineGrass.ready)throw Error('Fine grass must load in the shared pressure test');
  const materials=names.map(name=>{const mesh=root.getObjectByName(name) as THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>,p=properties(mesh.material),texture=p.uniforms.uPlantPressure.value as THREE.DataTexture;return{name,texture:texture.uuid,linked:gl.getProgramParameter(p.currentProgram.program,gl.LINK_STATUS) as boolean,bend:gl.getShaderSource(p.currentProgram.vertexShader)?.includes('coastBendPlant('),key:mesh.material.customProgramCacheKey()};});
  const canopy=root.getObjectByName(names[0]) as THREE.Mesh,uniforms=properties(canopy.material as THREE.Material).uniforms,texture=uniforms.uPlantPressure.value as THREE.DataTexture,data=texture.image.data as Uint8Array;let deep=0,soft=0;for(let i=0;i<data.length;i+=4){if(data[i]>204)deep++;else if(data[i]>16)soft++;}
  const trees=new Map<string,boolean>();root.traverse(o=>{const mesh=o as THREE.Mesh;if(mesh.isMesh&&!Array.isArray(mesh.material)&&mesh.material.userData.rigidTree){const p=properties(mesh.material);trees.set(mesh.material.uuid,Boolean(p.uniforms?.uPlantPressure));}});
  const car=uniforms.uPlantCar.value as THREE.Vector3;
  return{materials,deep,soft,texture:texture.uuid,version:texture.version,time:uniforms.uPlantTime.value,car:car.toArray(),position:window.__THREE_GAME_DIAGNOSTICS__!.player!.position!,diagnostics:{...root.userData.vegetationInteraction},trees:[...trees.values()]};
 });
 const first=await inspect();expect(new Set(first.materials.map(m=>m.texture)).size).toBe(1);expect(first.materials.every(m=>m.linked&&m.bend)).toBe(true);expect(first.deep).toBeGreaterThan(0);expect(first.soft).toBeGreaterThan(first.deep);expect(first.trees.length).toBeGreaterThanOrEqual(2);expect(first.trees.every(Boolean)).toBe(false);expect(first.trees.some(Boolean)).toBe(false);
 await page.keyboard.down('ArrowUp');try{await expect.poll(async()=>{const r=await inspect();return Math.hypot(r.position.x-first.position.x,r.position.z-first.position.z);},{timeout:20000}).toBeGreaterThan(4);}finally{await page.keyboard.up('ArrowUp');}
 const driven=await inspect();expect(driven.deep).toBeGreaterThan(first.deep);expect(driven.diagnostics.cachedCells).toBeGreaterThan(first.diagnostics.cachedCells);expect(driven.texture).toBe(first.texture);
 for(const quality of ['high','low']){await page.click('#menu-button');await page.selectOption('#quality-select',quality);await page.click('#resume-button');const r=await inspect();expect(r.texture).toBe(first.texture);expect(new Set(r.materials.map(m=>m.texture)).size).toBe(1);expect(r.deep).toBeGreaterThanOrEqual(driven.deep);}
 await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setPausedForScreenshot(true));await page.waitForTimeout(100);const paused=await inspect();await page.waitForTimeout(250);const frozen=await inspect();expect(frozen.version).toBe(paused.version);expect(frozen.time).toBe(paused.time);expect(frozen.car).toEqual(paused.car);expect(errors).toEqual([]);
});
