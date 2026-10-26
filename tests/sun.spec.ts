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
  // Independent oracle: decode the actual loaded HDR, rather than repeating
  // the runtime direction constant. HDR rows start at the upper pole.
  const texture=scene.background as THREE.DataTexture,image=texture.image as {width:number;height:number;data:Uint16Array|Float32Array};
  const half=(v:number)=>{const s=(v&32768)?-1:1,e=(v>>10)&31,f=v&1023;return s*(e===0?2**-14*(f/1024):e===31?(f?NaN:Infinity):2**(e-15)*(1+f/1024));};
  const channel=(i:number)=>image.data instanceof Uint16Array?half(image.data[i]):image.data[i];let brightest=-Infinity,px=0,py=0;
  for(let y=0;y<image.height/2;y++)for(let x=0;x<image.width;x++){const i=(y*image.width+x)*4,l=channel(i)*.2126+channel(i+1)*.7152+channel(i+2)*.0722;if(l>brightest){brightest=l;px=x;py=y;}}
  const azimuth=((px+.5)/image.width-.5)*Math.PI*2,elevation=(.5-(py+.5)/image.height)*Math.PI,skySun=[Math.cos(elevation)*Math.cos(azimuth),Math.sin(elevation),Math.cos(elevation)*Math.sin(azimuth)];
  const water=scene.getObjectByName('Sea / advancing shore wash and moving sunset reflections') as THREE.Mesh<THREE.BufferGeometry,THREE.ShaderMaterial>;
  const renderer=(objects as unknown as (THREE.WebGLRenderer&{isWebGLRenderer?:boolean})[]).find(o=>o.isWebGLRenderer)!,gl=renderer.getContext() as WebGL2RenderingContext;
  const hdrMipLevels:number[]=[];const floatFramebuffer=Boolean(gl.getExtension('EXT_color_buffer_float'));
  if(floatFramebuffer){const native=(renderer.properties.get(texture) as {__webglTexture:WebGLTexture}).__webglTexture,previous=gl.getParameter(gl.FRAMEBUFFER_BINDING),fbo=gl.createFramebuffer();try{gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);for(let level=0;level<=Math.log2(image.width);level++){gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,native,level);hdrMipLevels.push(gl.checkFramebufferStatus(gl.FRAMEBUFFER));}}finally{gl.bindFramebuffer(gl.FRAMEBUFFER,previous);gl.deleteFramebuffer(fbo);renderer.resetState();}}
  return{...scene.userData.sunShadows,direction:sun.position.clone().sub(sun.target.position).normalize().toArray(),skySun,brightest,flipY:texture.flipY,mipmapped:texture.generateMipmaps&&texture.minFilter===1008,floatFramebuffer,hdrMipLevels,glError:gl.getError(),skyRotation:scene.backgroundRotation.toArray().slice(0,3),environmentRotation:scene.environmentRotation.toArray().slice(0,3),sameWaterSource:water.material.uniforms.uSkyMap.value===texture,waterIntensity:water.material.uniforms.uSkyIntensity.value,skyIntensity:scene.backgroundIntensity,waterSun:water.material.uniforms.uSun.value.toArray(),map:sun.shadow.map!.texture.uuid,matrix:sun.shadow.matrix.elements.slice()};
 });
 expect(before.ready).toBe(true);expect(before.bakes).toBe(1);expect(before.localPasses).toBe(0);
 expect(before.brightest).toBeGreaterThan(1);expect(before.flipY).toBe(true);expect(before.mipmapped).toBe(true);expect(before.direction.reduce((sum:number,v:number,i:number)=>sum+v*before.skySun[i],0)).toBeGreaterThan(.99998);
 expect(before.glError).toBe(0);if(before.floatFramebuffer){expect(before.hdrMipLevels.length).toBeGreaterThanOrEqual(11);expect(before.hdrMipLevels.every((status:number)=>status===36053)).toBe(true);}
 await test.info().attach('actual-hdr-and-fixed-sun',{body:JSON.stringify(before,null,2),contentType:'application/json'});
 expect(before.sameWaterSource).toBe(true);expect(before.waterIntensity).toBe(before.skyIntensity);expect(before.skyRotation).toEqual([0,0,0]);expect(before.environmentRotation).toEqual([0,0,0]);for(const [i,v]of before.direction.entries())expect(v).toBeCloseTo(before.waterSun[i],8);
 await page.evaluate(()=>{(window as unknown as {resumeFrames:()=>void}).resumeFrames();});
 await page.evaluate(async()=>{await window.__THREE_GAME_TEST_HOOKS__!.setState('tree-shadow');window.__THREE_GAME_TEST_HOOKS__!.setPausedForScreenshot(false);await new Promise<void>(resolve=>{let count=0;function tick(){if(++count<60)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});});
 const after=await page.evaluate(()=>{
  const scene=(window as unknown as {sunObjects:THREE.Scene[]}).sunObjects.find(o=>o.isScene&&o.userData.sunShadows)!,sun=scene.getObjectByName('Cached golden-hour world sun') as THREE.DirectionalLight;
  return{...scene.userData.sunShadows,map:sun.shadow.map!.texture.uuid,matrix:sun.shadow.matrix.elements.slice(),lights:scene.children.filter(o=>(o as THREE.DirectionalLight).isDirectionalLight).length};
 });
 expect(after.bakes).toBe(1);expect(after.bakeDraws).toBe(before.bakeDraws);expect(after.localPasses).toBe(0);expect(after.map).toBe(before.map);expect(after.matrix).toEqual(before.matrix);expect(after.lights).toBe(1);expect(errors).toEqual([]);
});

test('天空照片失败后仍能用本地夕阳开始驾驶',async({page})=>{
 await page.setViewportSize({width:844,height:390});
 await page.route('**/assets/environment/sky*.hdr',route=>route.abort());
 await page.addInitScript(()=>{
  localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));const w=window as unknown as {skyFallbackObjects:unknown[];__THREE_DEVTOOLS__:EventTarget};w.skyFallbackObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.skyFallbackObjects.push((e as CustomEvent).detail));
 });
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/?test=1');await expect(page.locator('#start-button')).toBeEnabled({timeout:20000});await page.click('#start-button');
 await expect.poll(()=>page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__?.state?.running)).toBe(true);
 const state=await page.evaluate(()=>{const scene=(window as unknown as {skyFallbackObjects:THREE.Scene[]}).skyFallbackObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'))!,water=scene.getObjectByName('Sea / advancing shore wash and moving sunset reflections') as THREE.Mesh<THREE.BufferGeometry,THREE.ShaderMaterial>;return{running:window.__THREE_GAME_DIAGNOSTICS__!.state?.running,background:scene.background,sky:scene.getObjectByName('Golden hour sky and high cirrus')!.visible,waterSky:water.material.uniforms.uHasSky.value,sun:scene.userData.sunShadows};});
 expect(state.running).toBe(true);expect(state.background).toBeNull();expect(state.sky).toBe(true);expect(state.waterSky).toBe(0);expect(state.sun.ready).toBe(true);expect(errors).toEqual([]);
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
