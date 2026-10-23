import {test,expect} from '@playwright/test';
import type * as THREE from 'three';

test.beforeEach(async({page})=>{
 await page.addInitScript(()=>{const w=window as unknown as {shoreObjects:unknown[];__THREE_DEVTOOLS__:EventTarget};w.shoreObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.shoreObjects.push((e as CustomEvent).detail));});
});

test('近岸进退海水与湿润岩岸在各浏览器正确准备',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.setViewportSize({width:844,height:390});await page.goto('/?test=1');
 for(const state of['shore-wash','shore-side','rock-back']){
  await page.evaluate(async state=>{const h=window.__THREE_GAME_TEST_HOOKS__!;await h.setState(state);h.setSceneTime!(34);await new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r())));},state);
  const result=await page.evaluate(()=>{
   const objects=(window as unknown as {shoreObjects:THREE.Object3D[]}).shoreObjects,scene=objects.find(o=>(o as THREE.Scene).isScene&&o.getObjectByName('Coastal landscape'))!;
   const water=scene.children.find(o=>o.name.startsWith('Sea /')) as THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial>;
   const texture=water.material.uniforms.uShoreField.value as THREE.DataTexture;
   return{ready:water.material.uniforms.uShoreReady.value,width:texture.image.width,bytes:texture.image.data!.length,time:water.material.uniforms.uShoreTime.value,depthWrite:water.material.depthWrite,offroad:window.__THREE_GAME_DIAGNOSTICS__!.state!.offroad,roadDistance:window.__THREE_GAME_DIAGNOSTICS__!.state!.roadDistance};
  });
  expect(result.ready).toBe(1);expect([512,768]).toContain(result.width);expect(result.bytes).toBe(result.width**2*4);expect(result.time).toBe(34);expect(result.depthWrite).toBe(true);
  if(state==='shore-wash'){expect(result.offroad).toBe(true);expect(result.roadDistance).toBeGreaterThan(70);expect(result.roadDistance).toBeLessThan(76);}
 }
 expect(errors).toEqual([]);
});

test('减弱动态会冻结当前浪相，恢复时连续前进',async({page})=>{
 await page.goto('/?test=1');await page.evaluate(async()=>{await window.__THREE_GAME_TEST_HOOKS__!.setState('shore-wash');window.__THREE_GAME_TEST_HOOKS__!.setPausedForScreenshot(false);});
 const time=()=>page.evaluate(()=>{const w=window as unknown as {shoreObjects:THREE.Scene[]};const scene=w.shoreObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'))!;return(scene.children.find(o=>o.name.startsWith('Sea /')) as THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial>).material.uniforms.uShoreTime.value as number;});
 await page.click('#menu-button');await page.check('#reduced-motion');const frozen=await time();await page.click('#resume-button');await page.waitForTimeout(350);expect(await time()).toBe(frozen);
 await page.click('#menu-button');await page.uncheck('#reduced-motion');expect(await time()).toBe(frozen);await page.click('#resume-button');await expect.poll(time).toBeGreaterThan(frozen+.15);expect(await time()).toBeLessThan(frozen+1);
});
