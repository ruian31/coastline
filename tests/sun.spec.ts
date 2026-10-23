import {test,expect} from '@playwright/test';
import type * as THREE from 'three';

test('夕阳方向在首个动画帧之前确定，流畅档复用完整世界阴影',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>{
  const w=window as unknown as {sunObjects:unknown[];__THREE_DEVTOOLS__:EventTarget;resumeFrames:()=>void};w.sunObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.sunObjects.push((e as CustomEvent).detail));
  localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));
  const request=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window),queued=new Map<number,FrameRequestCallback>();let id=0;
  window.requestAnimationFrame=callback=>{queued.set(--id,callback);return id;};window.cancelAnimationFrame=value=>{if(value<0)queued.delete(value);else cancel(value);};
  w.resumeFrames=()=>{window.requestAnimationFrame=request;window.cancelAnimationFrame=cancel;for(const callback of queued.values())request(callback);queued.clear();};
 });
 await page.goto('/?test=1');await expect(page.locator('#start-button')).toBeEnabled();
 const before=await page.evaluate(()=>{
  const objects=(window as unknown as {sunObjects:THREE.Scene[]}).sunObjects,scene=objects.find(o=>o.isScene&&o.userData.sunShadows)!,sun=scene.getObjectByName('Cached golden-hour world sun') as THREE.DirectionalLight;
  return{...scene.userData.sunShadows,direction:sun.position.clone().sub(sun.target.position).normalize().toArray(),map:sun.shadow.map!.texture.uuid,matrix:sun.shadow.matrix.elements.slice()};
 });
 expect(before.ready).toBe(true);expect(before.bakes).toBe(1);expect(before.localPasses).toBe(0);
 const magnitude=Math.hypot(96,13,72);for(const [i,value]of[96,13,72].entries())expect(before.direction[i]).toBeCloseTo(value/magnitude,8);
 await page.evaluate(()=>{(window as unknown as {resumeFrames:()=>void}).resumeFrames();});
 await page.evaluate(async()=>{await window.__THREE_GAME_TEST_HOOKS__!.setState('tree-shadow');window.__THREE_GAME_TEST_HOOKS__!.setPausedForScreenshot(false);await new Promise<void>(resolve=>{let count=0;function tick(){if(++count<60)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});});
 const after=await page.evaluate(()=>{
  const scene=(window as unknown as {sunObjects:THREE.Scene[]}).sunObjects.find(o=>o.isScene&&o.userData.sunShadows)!,sun=scene.getObjectByName('Cached golden-hour world sun') as THREE.DirectionalLight;
  return{...scene.userData.sunShadows,map:sun.shadow.map!.texture.uuid,matrix:sun.shadow.matrix.elements.slice(),lights:scene.children.filter(o=>(o as THREE.DirectionalLight).isDirectionalLight).length};
 });
 expect(after.bakes).toBe(1);expect(after.bakeDraws).toBe(before.bakeDraws);expect(after.localPasses).toBe(0);expect(after.map).toBe(before.map);expect(after.matrix).toEqual(before.matrix);expect(after.lights).toBe(1);expect(errors).toEqual([]);
});

test('手机自动档持续低帧率时减少投影，手动选择画质可恢复缓存',async({page},info)=>{
 test.skip(!info.project.name.includes('mobile'),'手机自动档的持续帧率保护');
 await page.addInitScript(()=>{
  const w=window as unknown as {sunObjects:unknown[];__THREE_DEVTOOLS__:EventTarget};w.sunObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.sunObjects.push((e as CustomEvent).detail));
  localStorage.setItem('coast-settings',JSON.stringify({quality:'auto',muted:true}));
  const request=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=callback=>request(t=>callback(t*3));
 });
 await page.setViewportSize({width:844,height:390});await page.goto('/?test=1');await page.click('#start-auto');
 const snapshot=()=>page.evaluate(()=>{
  const scene=(window as unknown as {sunObjects:THREE.Scene[]}).sunObjects.find(o=>o.isScene&&o.userData.sunShadows)!,sun=scene.getObjectByName('Cached golden-hour world sun') as THREE.DirectionalLight;
  return{...scene.userData.sunShadows,map:sun.shadow.map!.texture.uuid,matrix:sun.shadow.matrix.elements.slice(),cast:sun.castShadow,frame:window.__THREE_GAME_DIAGNOSTICS__?.frame,fps:window.__THREE_GAME_DIAGNOSTICS__?.state?.fps};
 });
 await expect.poll(async()=>(await snapshot()).mode,{timeout:20000}).toBe('unshadowed-fallback');const before=await snapshot();expect(before.cast).toBe(false);expect(before.bakes).toBe(1);
 await page.click('#menu-button');await page.selectOption('#quality-select','low');await page.click('#resume-button');await page.waitForTimeout(200);
 const after=await snapshot();expect(after.cast).toBe(true);expect(after.mode).toBe('cached-world');expect(after.map).toBe(before.map);expect(after.matrix).toEqual(before.matrix);expect(after.bakes).toBe(1);
});
