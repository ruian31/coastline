import {test,expect} from '@playwright/test';
const dismissPortrait=async(page:import('@playwright/test').Page)=>{if(await page.locator('#landscape-prompt').isVisible())await page.click('#portrait-continue');};
const state=async(page:import('@playwright/test').Page)=>page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__!);
test('驾驶、巡航接管、三视角、选车和暂停恢复',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/?test=1');await expect(page.locator('#start-button')).toBeVisible();await dismissPortrait(page);await page.click('#start-button');await expect(page.locator('#welcome')).toBeHidden();
 const mobile=info.project.name.includes('mobile');
 const accelerate=async()=>{
  if(mobile){const b=await page.locator('[data-drive="throttle"]').boundingBox();expect(b).not.toBeNull();await page.mouse.move(b!.x+b!.width/2,b!.y+b!.height/2);await page.mouse.down();await expect.poll(async()=> (await state(page)).player.speed).toBeGreaterThan(.5);await page.mouse.up();}
  else{await page.keyboard.down('KeyW');await expect.poll(async()=> (await state(page)).player.speed).toBeGreaterThan(.5);await page.keyboard.up('KeyW');}
 };
 await accelerate();
 await page.click('#auto-button');await expect.poll(async()=> (await state(page)).state?.automatic).toBe(true);await page.click('[data-camera="1"]');await expect.poll(async()=> (await state(page)).state?.camera).toBe(1);
 await page.click('[data-camera="2"]');await expect.poll(async()=> (await state(page)).state?.camera).toBe(2);await expect.poll(async()=> (await state(page)).state?.automatic).toBe(true);
 if(mobile){const b=await page.locator('[data-drive="brake"]').boundingBox();await page.mouse.click(b!.x+b!.width/2,b!.y+b!.height/2);}
 else{await page.keyboard.press('KeyS');}
 await expect.poll(async()=> (await state(page)).state?.automatic).toBe(false);await expect.poll(async()=> (await state(page)).state?.camera).toBe(0);
 await page.click('#garage-button');await page.click('[data-car="1"]');await page.click('#garage-done');await expect.poll(async()=> (await state(page)).state?.car).toBe(1);await accelerate();
 await page.click('#garage-button');await page.click('[data-car="2"]');await page.click('#garage-done');await expect.poll(async()=> (await state(page)).state?.car).toBe(2);await accelerate();
 await page.click('#menu-button');await expect(page.locator('#menu-panel')).toBeVisible();await expect.poll(async()=> (await state(page)).state?.paused).toBe(true);const before=(await state(page)).player.position;await page.waitForTimeout(200);expect((await state(page)).player.position).toEqual(before);await page.click('#resume-button');await expect.poll(async()=> (await state(page)).state?.paused).toBe(false);
 await page.screenshot({path:`artifacts/${info.project.name}-m1.png`});expect(errors).toEqual([]);
});
test('控制区与画布在横竖屏可见且不横向溢出',async({page},info)=>{await page.goto('/?test=1');await dismissPortrait(page);await page.click('#start-button');for(const size of info.project.name.includes('mobile')?[{width:390,height:844},{width:844,height:390}]:[{width:1440,height:900}]){await page.setViewportSize(size);await expect(page.locator('#game-canvas')).toBeVisible();await expect(page.locator('[data-camera="1"]')).toBeVisible();if(info.project.name.includes('mobile'))await expect(page.locator('[data-drive="throttle"]')).toBeInViewport();expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(size.width);await page.screenshot({path:`artifacts/layout-${size.width}x${size.height}.png`});}});

test('暂停时静音快捷键不能恢复音频',async({page})=>{await page.goto('/?test=1');await dismissPortrait(page);await page.click('#start-button');await expect.poll(async()=> (await state(page)).state?.audioState).toBe('running');await page.click('#menu-button');await page.keyboard.press('KeyM');await page.keyboard.press('KeyM');await expect.poll(async()=> (await state(page)).state?.paused).toBe(true);await expect.poll(async()=> (await state(page)).state?.audioState).toBe('suspended');await page.click('#resume-button');await expect.poll(async()=> (await state(page)).state?.audioState).toBe('running');});


test('车内急转时视点固定在驾驶位，避免穿入靠背',async({page})=>{
 await page.goto('/?test=1');await dismissPortrait(page);await page.click('#start-button');await page.click('[data-camera="1"]');
 await page.keyboard.down('KeyW');await expect.poll(async()=>(await state(page)).player.speed).toBeGreaterThan(3);
 await page.keyboard.down('KeyA');await page.waitForTimeout(650);
 expect((await state(page)).cameraRig?.cockpitEyeError).toBeLessThan(.01);
 await page.keyboard.up('KeyA');await page.keyboard.up('KeyW');
});


test('等待路面贴图加载后再开放驾驶',async({page})=>{
 let release!:()=>void;const held=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/road-color.jpg',async route=>{await held;await route.continue();});
 try{
  await page.goto('/?test=1',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#start-button')).toBeDisabled();
 }finally{release();}
 await expect(page.locator('#start-button')).toBeEnabled({timeout:30000});
 await dismissPortrait(page);await page.click('#start-button');await expect(page.locator('#welcome')).toBeHidden();
});


test('手机默认横屏引导，旋转后直接显示游戏',async({page},info)=>{
 test.skip(!info.project.name.includes('mobile'),'手机默认呈现');
 await page.goto('/?test=1');await expect(page.locator('#landscape-prompt')).toBeVisible();
 await page.setViewportSize({width:844,height:390});await expect(page.locator('#landscape-prompt')).toBeHidden();
 await page.click('#start-button');await expect(page.locator('#welcome')).toBeHidden();
});

test('手机开始点击先申请全屏，再锁定横屏',async({page},info)=>{
 test.skip(!info.project.name.includes('mobile'),'手机默认呈现');
 await page.addInitScript(()=>{
  const events:string[]=[];(window as unknown as {presentationEvents:string[]}).presentationEvents=events;
  Object.defineProperty(document,'fullscreenEnabled',{configurable:true,value:true});
  Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{configurable:true,value:()=>{events.push('fullscreen');return Promise.resolve();}});
  Object.defineProperty(screen,'orientation',{configurable:true,value:{lock:(value:string)=>{events.push(value);return Promise.resolve();}}});
 });
 await page.goto('/?test=1');await expect(page.locator('#landscape-launch')).toBeEnabled();await page.click('#landscape-launch');
 await expect.poll(()=>page.evaluate(()=>(window as unknown as {presentationEvents:string[]}).presentationEvents)).toEqual(['fullscreen','landscape']);
 await page.click('#portrait-continue');await expect(page.locator('#landscape-prompt')).toBeHidden();
 await expect.poll(async()=>(await state(page)).state?.running).toBe(true);
});


test('图形上下文丢失时显示可恢复的重载提示',async({page})=>{
 await page.goto('/?test=1');await dismissPortrait(page);await page.click('#start-button');
 const supported=await page.evaluate(()=>{const canvas=document.querySelector<HTMLCanvasElement>('#game-canvas')!,gl=canvas.getContext('webgl2'),extension=gl?.getExtension('WEBGL_lose_context');if(!extension)return false;extension.loseContext();return true;});
 test.skip(!supported,'当前测试引擎未开放WEBGL_lose_context扩展');
 await expect(page.locator('#error-panel')).toBeVisible();await expect(page.locator('#error-message')).toContainText('重新加载');
});
