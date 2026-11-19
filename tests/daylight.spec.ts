import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const evidenceDirectory=process.env.DAYLIGHT_EVIDENCE_DIR??'artifacts';
test.beforeAll(async()=>{await mkdir(evidenceDirectory,{recursive:true});});

test('五个海岸时段同步实际天空水面阴影和暂停镜面',async({page},info)=>{
 test.setTimeout(240000);const mobile=info.project.name.includes('mobile');await page.setViewportSize(mobile?{width:844,height:390}:{width:1280,height:720});
 const errors:string[]=[],hdrRequests:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(r.url().endsWith('.hdr'))hdrRequests.push(r.url());});
 await page.addInitScript(()=>{
  if(!sessionStorage.getItem('daylight-test-initialized')){localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));sessionStorage.setItem('daylight-test-initialized','1');}const w=window as any;w.dayObjects=[];w.badBakeTargets=[];w.__THREE_DEVTOOLS__=new EventTarget();
  w.__THREE_DEVTOOLS__.addEventListener('observe',(event:any)=>{const object=event.detail;w.dayObjects.push(object);if(object.isWebGLRenderer){const render=object.render;object.render=function(scene:any,camera:any){if(camera.position.y===2000&&object.getRenderTarget()===null)w.badBakeTargets.push({at:performance.now()});return render.call(this,scene,camera);};}});
 });
 await page.goto('/?test=1');await page.waitForFunction(()=>window.__THREE_GAME_TEST_HOOKS__);
 await page.evaluate(async()=>{const h=window.__THREE_GAME_TEST_HOOKS__!;await h.setState('cockpit');h.setPausedForScreenshot(true);h.setReducedMotion(true);});
 const read=()=>page.evaluate(()=>structuredClone(window.__THREE_GAME_DIAGNOSTICS__!));
 const waitFrames=async(count:number)=>{const frame=(await read()).frame;await expect.poll(async()=>(await read()).frame,{timeout:30000}).toBeGreaterThanOrEqual(frame+count);};
 await waitFrames(8);const initial=await read();expect(initial.daylight!.id).toBe('golden');expect(initial.lighting!.bakes).toBe(1);
 await page.locator('#menu-button').click();const records=[];
 for(const id of ['day','night','dawn','dusk','golden','night']){
  const before=await read();await page.locator('#daylight-select').selectOption(id);
  await expect.poll(async()=>{const d=await read();return !d.daylight!.loading&&d.daylight!.id;},{timeout:45000}).toBe(id);await waitFrames(8);
  const after=await read();expect(after.lighting!.ready).toBe(true);expect(after.lighting!.bakes).toBe(before.lighting!.bakes+1);expect(after.lighting!.casters).toBe(initial.lighting!.casters);
  const changedMirrors=after.vehicleMirrors!.passes-before.vehicleMirrors!.passes;expect(changedMirrors).toBeGreaterThan(0);expect(changedMirrors).toBeLessThanOrEqual(3);await waitFrames(6);expect((await read()).vehicleMirrors!.passes).toBe(after.vehicleMirrors!.passes);
  const actual=await page.evaluate(()=>{
   const w=window as any,scene=w.dayObjects.find((o:any)=>o.isScene&&o.getObjectByName('Coastal landscape')),renderer=w.dayObjects.find((o:any)=>o.isWebGLRenderer),sun=scene.getObjectByName('Cached golden-hour world sun'),water=scene.getObjectByName('Sea / advancing shore wash and moving sunset reflections').material.uniforms;
   const direction=sun.position.clone().sub(sun.target.position).normalize(),fog=scene.fog.color.toArray(),horizon=water.uWaterHorizon.value.toArray(),background=scene.background;
   return{sun:direction.toArray(),waterSun:water.uSun.value.toArray(),sunIntensity:sun.intensity,waterSkyIdentity:water.uSkyMap.value===background,waterSkyGain:water.uSkyIntensity.value,skyGain:scene.backgroundIntensity,waterYaw:water.uSkyYaw.value*Math.PI*2,skyYaw:scene.backgroundRotation.y,environmentYaw:scene.environmentRotation.y,fog,horizon,target:renderer.getRenderTarget(),autoReset:renderer.info.autoReset,badBakeTargets:w.badBakeTargets.length,skyDimensions:[background.image.width,background.image.height],glError:renderer.getContext().getError()};
  });
  expect(actual.waterSkyIdentity).toBe(true);expect(actual.waterSkyGain).toBeCloseTo(actual.skyGain,10);expect(actual.waterYaw).toBeCloseTo(actual.skyYaw,10);expect(actual.environmentYaw).toBe(actual.skyYaw);
  for(let i=0;i<3;i++){expect(actual.sun[i]).toBeCloseTo(actual.waterSun[i],7);if(id!=='golden')expect(actual.horizon[i]).toBeCloseTo(actual.fog[i],10);}
  expect(actual.target).toBe(null);expect(actual.autoReset).toBe(true);expect(actual.badBakeTargets).toBe(0);expect(actual.glError).toBe(0);expect(actual.sunIntensity).toBe(id==='dusk'?0:id==='night'?.28:id==='day'?2.4:id==='dawn'?1.9:2.5);
  expect(after.renderer.textures).toBeLessThanOrEqual(initial.renderer.textures);expect(after.renderer.geometries).toBeLessThanOrEqual(initial.renderer.geometries);
  records.push({id,before,after,changedMirrors,actual});
 }
 await page.locator('#daylight-select').scrollIntoViewIfNeeded();const menuImage=`${evidenceDirectory}/daynight-m75-menu-${info.project.name}.png`;await page.screenshot({path:menuImage});
 const size=await page.locator('#daylight-select').boundingBox();expect(size!.height).toBeGreaterThanOrEqual(44);expect(size!.width).toBeGreaterThanOrEqual(140);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('coast-settings')!).daylight);expect(saved).toBe('night');
 // The initializer preserves localStorage on reload; observe the saved choice.
 hdrRequests.length=0;await page.reload();await page.evaluate(async()=>{const h=window.__THREE_GAME_TEST_HOOKS__!;await h.setState('active-play');h.setPausedForScreenshot(true);});
 await expect.poll(async()=>(await read()).daylight!.id,{timeout:45000}).toBe('night');expect(hdrRequests).toHaveLength(1);expect(hdrRequests[0]).toContain('/daylight/qwantani_moon_noon_puresky.hdr');expect((await read()).lighting!.bakes).toBe(1);expect(errors).toEqual([]);
 await writeFile(`${evidenceDirectory}/daynight-m75-browser-${info.project.name}.json`,JSON.stringify({records,menuImage,size,reloadHdrRequests:hdrRequests,errors},null,2)+'\n');
});

test('时段慢请求与加载失败保留最新的可用天空',async({page},info)=>{
 test.skip(info.project.name==='mobile-webkit','Network-race ownership checked on desktop and Android Chrome; optical/lighting checks above cover WebKit.');test.setTimeout(120000);
 await page.addInitScript(()=>localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true})));
 await page.goto('/?test=1');await page.evaluate(async()=>{await window.__THREE_GAME_TEST_HOOKS__!.setState('active-play');window.__THREE_GAME_TEST_HOOKS__!.setPausedForScreenshot(true);});
 let release:()=>Promise<void>=async()=>{},held=false;
 await page.route('**/daylight/qwantani_moon_noon_puresky.hdr',route=>{held=true;release=()=>route.continue();});
 await page.evaluate(()=>{(window as any).oldDaylight=window.__THREE_GAME_TEST_HOOKS__!.setDaylight!('night');});await expect.poll(()=>held).toBe(true);
 expect(await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setDaylight!('day'))).toBe(true);await release();expect(await page.evaluate(()=>(window as any).oldDaylight)).toBe(false);
 await expect.poll(()=>page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__!.daylight!.id)).toBe('day');
 await page.route('**/daylight/qwantani_sunrise_puresky.hdr',route=>route.abort());expect(await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setDaylight!('dawn'))).toBe(false);
 await expect.poll(()=>page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__!.daylight!.loading)).toBe(false);expect(await page.locator('#daylight-select').inputValue()).toBe('day');
 await page.locator('#auto-button').click();await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setPausedForScreenshot(false));const start=await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__!.elapsed);await expect.poll(()=>page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__!.elapsed),{timeout:15000}).toBeGreaterThan(start+.3);
});

test('异步时段机位在天空载入期间保持车辆和场景时钟',async({page},info)=>{
 test.skip(info.project.name!=='desktop-chrome','Fixture control-flow regression; desktop Chrome covers the delayed request, formal captures cover both viewports.');test.setTimeout(60000);
 await page.addInitScript(()=>localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true})));
 await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('active-play'));
 let held=false,release:()=>Promise<void>=async()=>{};
 await page.route('**/daylight/qwantani_moon_noon_puresky.hdr',route=>{held=true;release=()=>route.continue();});
 await page.evaluate(()=>{(window as any).phaseFixture=window.__THREE_GAME_TEST_HOOKS__!.setState('daylight-night');});await expect.poll(()=>held).toBe(true);
 await page.waitForTimeout(250);const before=await page.evaluate(()=>structuredClone(window.__THREE_GAME_DIAGNOSTICS__!));
 await expect.poll(()=>page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__!.frame)).toBeGreaterThan(before.frame+8);
 const during=await page.evaluate(()=>structuredClone(window.__THREE_GAME_DIAGNOSTICS__!));expect(during.elapsed).toBe(30);expect(during.player.position).toEqual(before.player.position);expect(during.state!.progress).toBe(before.state!.progress);
 await release();expect(await page.evaluate(()=>(window as any).phaseFixture)).toEqual({state:'daylight-night'});
});
