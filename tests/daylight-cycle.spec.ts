import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';

async function initialize(page:any){
 await page.setViewportSize({width:844,height:390});
 await page.addInitScript(()=>{if(!sessionStorage.getItem('cycle-initialized')){localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));sessionStorage.setItem('cycle-initialized','1');}const w=window as any;w.cycleObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',(e:any)=>w.cycleObjects.push(e.detail));});
 await page.goto('/?test=1');await page.evaluate(async()=>{await window.__THREE_GAME_TEST_HOOKS__!.setState('cockpit');window.__THREE_GAME_TEST_HOOKS__!.setPausedForScreenshot(false);});
}
const read=(page:any)=>page.evaluate(()=>structuredClone(window.__THREE_GAME_DIAGNOSTICS__!));
const actual=(page:any)=>page.evaluate(()=>{const w=window as any,scene=w.cycleObjects.find((o:any)=>o.isScene&&o.getObjectByName('Coastal landscape')),renderer=w.cycleObjects.find((o:any)=>o.isWebGLRenderer),water=scene.getObjectByName('Sea / advancing shore wash and moving sunset reflections').material.uniforms,background=scene.getObjectByName('Continuous photographic coastal sky'),light=scene.getObjectByName('Cached golden-hour world sun');return{backgroundNull:scene.background===null,cycleVisible:Boolean(background?.visible),fallbackVisible:scene.getObjectByName('Golden hour sky and high cirrus').visible,environmentMapping:scene.environment.mapping,environmentRotation:scene.environmentRotation.y,waterHorizon:water.uWaterHorizon.value.toArray(),waterSun:water.uSun.value.toArray(),lightDirection:light.position.clone().sub(light.target.position).normalize().toArray(),glError:renderer.getContext().getError(),target:renderer.getRenderTarget(),rendererMemory:{...renderer.info.memory}};});

test('昼夜开关在真实驾驶时推进，暂停固定和重载保留当前时刻',async({page},info)=>{
 test.setTimeout(240000);const errors:string[]=[],hdr:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(r.url().endsWith('.hdr'))hdr.push(r.url());});
 await initialize(page);await page.locator('#menu-button').click();await page.locator('#time-flow').check();
 await expect.poll(async()=>{const d=await read(page);return Boolean(d.daylight?.cycle?.flow&&!d.daylight.loading);},{timeout:45000}).toBe(true);
 const paused=await read(page);await page.waitForTimeout(600);expect((await read(page)).daylight!.cycle!.hour).toBe(paused.daylight!.cycle!.hour);await expect(page.locator('#daylight-clock')).toHaveText('18:42');
 const bound=await actual(page);expect(bound.backgroundNull&&bound.cycleVisible).toBe(true);expect(bound.fallbackVisible).toBe(false);expect(bound.environmentMapping).toBe(306);expect(bound.target).toBe(null);expect(bound.glError).toBe(0);
 for(let i=0;i<3;i++)expect(bound.waterSun[i]).toBeCloseTo(bound.lightDirection[i],8);
 const before=await read(page);await page.locator('#resume-button').click();await expect.poll(async()=>(await read(page)).elapsed,{timeout:45000}).toBeGreaterThan(before.elapsed+.5);
 const driving=await read(page),hourDelta=driving.daylight!.cycle!.hour-before.daylight!.cycle!.hour;expect(hourDelta).toBeGreaterThan(0);expect(hourDelta).toBeCloseTo((driving.elapsed-before.elapsed)*24/1800,6);expect(driving.lighting!.bakes-before.lighting!.bakes).toBeLessThanOrEqual(1);
 await page.locator('#menu-button').click();await page.waitForTimeout(200);await page.locator('#time-flow').uncheck();const frozen=await read(page);await page.locator('#resume-button').click();const elapsed=frozen.elapsed;await expect.poll(async()=>(await read(page)).elapsed,{timeout:45000}).toBeGreaterThan(elapsed+.4);expect((await read(page)).daylight!.cycle!.hour).toBe(frozen.daylight!.cycle!.hour);
 await page.locator('#menu-button').click();await page.waitForTimeout(200);const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('coast-settings')!).daylightCycle);expect(saved.flow).toBe(false);expect(saved.hour).toBe(frozen.daylight!.cycle!.hour);
 hdr.length=0;await page.reload();await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('cockpit'));await expect.poll(async()=>(await read(page)).daylight!.cycle?.hour,{timeout:45000}).toBe(saved.hour);const reload=await actual(page);expect(reload.backgroundNull&&reload.cycleVisible).toBe(true);expect(reload.fallbackVisible).toBe(false);expect(hdr).toHaveLength(2);expect(hdr.some(v=>v.endsWith('/sky-mobile.hdr'))).toBe(true);
 await page.locator('#menu-button').click();await page.locator('#daylight-select').selectOption('golden');await expect.poll(async()=>{const d=await read(page);return !d.daylight!.loading&&!d.daylight!.cycle;},{timeout:45000}).toBe(true);expect(await page.locator('#time-flow').isChecked()).toBe(false);expect(await page.locator('#daylight-select').inputValue()).toBe('golden');const fixed=await actual(page);expect(fixed.backgroundNull).toBe(false);expect(fixed.cycleVisible).toBe(false);expect(errors).toEqual([]);
 await page.locator('#time-flow').scrollIntoViewIfNeeded();const target=await page.locator('.time-flow-label').boundingBox();expect(target!.height).toBeGreaterThanOrEqual(44);await page.screenshot({path:`artifacts/daynight-m76-menu-${info.project.name}.png`});
 await writeFile(`artifacts/daynight-m76-browser-${info.project.name}.json`,JSON.stringify({paused,bound,before,driving,frozen,saved,reload,fixed,hdr,errors},null,2)+'\n');
});

test('昼夜慢载入取消与失败保留原来的固定天空',async({page},info)=>{
 test.skip(info.project.name==='mobile-webkit','Network ownership is covered by both Chrome viewports; optical/clock/lifecycle checks above cover WebKit.');test.setTimeout(120000);
 await initialize(page);await page.locator('#menu-button').click();let held=false,release:()=>Promise<void>=async()=>{};
 await page.route('**/daylight/qwantani_dusk_2_puresky.hdr',route=>{held=true;release=()=>route.continue();});await page.locator('#time-flow').check();await expect.poll(()=>held).toBe(true);
 await page.locator('#daylight-select').selectOption('day');await expect.poll(async()=>{const d=await read(page);return !d.daylight!.loading&&d.daylight!.id;},{timeout:30000}).toBe('day');await release();await page.waitForTimeout(500);expect((await read(page)).daylight!.cycle).toBeUndefined();expect(await page.locator('#time-flow').isChecked()).toBe(false);
 await page.unroute('**/daylight/qwantani_dusk_2_puresky.hdr');await page.locator('#daylight-select').selectOption('golden');await expect.poll(async()=>(await read(page)).daylight!.id).toBe('golden');const before=await actual(page);
 let aborted=false;await page.route('**/daylight/qwantani_dusk_2_puresky.hdr',route=>{aborted=true;return route.abort();});await page.locator('#time-flow').check();await expect.poll(()=>aborted).toBe(true);await expect(page.locator('#time-flow')).not.toBeChecked();await expect.poll(async()=>(await read(page)).daylight!.loading).toBe(false);expect((await read(page)).daylight!.cycle).toBeUndefined();const after=await actual(page);expect(after.backgroundNull).toBe(false);expect(after.rendererMemory.textures).toBeLessThanOrEqual(before.rendererMemory.textures+1);expect(after.glError).toBe(0);
});

test('实际时钟跨越暮色边界时海平线颜色连续且阴影不逐帧烘焙',async({page},info)=>{
 test.skip(info.project.name==='mobile-webkit','Short wall-clock crossing is checked on both hardware Chrome viewports; software WebKit has the clock lifecycle test above.');test.setTimeout(120000);
 await initialize(page);await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setDaylightCycle!(19.49,true));const before=await read(page),a=await actual(page);
 await expect.poll(async()=>(await read(page)).daylight!.cycle!.hour,{timeout:20000}).toBeGreaterThan(19.51);const after=await read(page),b=await actual(page);
 for(let i=0;i<3;i++)expect(Math.abs(a.waterHorizon[i]-b.waterHorizon[i])).toBeLessThan(.03);expect(after.lighting!.bakes-before.lighting!.bakes).toBeLessThanOrEqual(1);expect(after.daylight!.cycle!.cache.resident.length).toBeLessThanOrEqual(3);expect(a.glError+b.glError).toBe(0);
 await writeFile(`artifacts/daynight-m76-boundary-${info.project.name}.json`,JSON.stringify({before,after,a,b},null,2)+'\n');
});

test('欢迎页不推进已保存的昼夜，开始驾驶后才流动',async({page},info)=>{
 test.setTimeout(150000);await page.setViewportSize({width:844,height:390});
 await page.addInitScript(()=>localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true,daylight:'day',daylightCycle:{hour:13,flow:true}})));
 await page.goto('/?test=1');await expect(page.locator('#start-auto')).toBeEnabled({timeout:60000});await expect.poll(async()=>(await read(page)).daylight!.cycle?.hour,{timeout:30000}).toBe(13);
 const welcome=await read(page);expect(welcome.state!.running).toBe(false);await page.waitForTimeout(700);expect((await read(page)).daylight!.cycle!.hour).toBe(13);
 await page.locator('#start-auto').click();await expect.poll(async()=>(await read(page)).daylight!.cycle!.hour,{timeout:30000}).toBeGreaterThan(13);const started=await read(page);
 await writeFile(`artifacts/daynight-m76-startup-${info.project.name}.json`,JSON.stringify({welcome,started,note:'Saved flowing clock remains exactly13:00 on welcome; actual start-auto input starts the normal30-minute cycle.'},null,2)+'\n');
});


test('有窗口浏览器失去真实焦点后保持昼夜暂停',async({page,context},info)=>{
 test.skip(process.env.HEADED_BROWSER!=='1'||info.project.name==='mobile-webkit','Native focus is checked in the headed Chrome/Xvfb pass with Playwright focus emulation disabled.');test.setTimeout(120000);
 await initialize(page);const session=await context.newCDPSession(page);await session.send('Emulation.setFocusEmulationEnabled',{enabled:false});await page.bringToFront();await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setDaylightCycle!(13,true));const start=await read(page);await expect.poll(async()=>(await read(page)).daylight!.cycle!.hour,{timeout:30000}).toBeGreaterThan(start.daylight!.cycle!.hour);
 const other=await context.newPage();await other.goto('about:blank');await other.bringToFront();const visibility=await page.evaluate(()=>({hidden:document.hidden,focused:document.hasFocus()}));expect(visibility.hidden||!visibility.focused).toBe(true);
 await expect.poll(async()=>(await read(page)).state!.paused,{timeout:15000}).toBe(true);const a=await read(page);await page.waitForTimeout(900);const b=await read(page);expect(a.daylight!.cycle!.hour).toBe(b.daylight!.cycle!.hour);
 await page.bringToFront();await other.close();expect((await read(page)).state!.paused).toBe(true);await page.locator('#resume-button').click();await expect.poll(async()=>(await read(page)).daylight!.cycle!.hour,{timeout:15000}).toBeGreaterThan(b.daylight!.cycle!.hour);
 await writeFile(`artifacts/daynight-m76-background-${info.project.name}.json`,JSON.stringify({visibility,a,b,resumed:await read(page),note:'Headed Chrome/Xvfb with Playwright forced-focus override disabled. Actual blur observed when another browser target comes forward; recorded visibility/focus state is authoritative. Not phone performance.'},null,2)+'\n');
});
