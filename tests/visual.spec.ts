import {test,expect} from '@playwright/test';
const state=async(page:import('@playwright/test').Page)=>page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__!);
test('驾驶、巡航接管、三视角、选车和暂停恢复',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/?test=1');await expect(page.locator('#start-button')).toBeVisible();await page.click('#start-button');await expect(page.locator('#welcome')).toBeHidden();
 const mobile=info.project.name.includes('mobile');
 if(mobile){const b=await page.locator('[data-drive="throttle"]').boundingBox();expect(b).not.toBeNull();await page.mouse.move(b!.x+b!.width/2,b!.y+b!.height/2);await page.mouse.down();await expect.poll(async()=> (await state(page)).player.speed).toBeGreaterThan(.5);await page.mouse.up();}
 else{await page.keyboard.down('KeyW');await expect.poll(async()=> (await state(page)).player.speed).toBeGreaterThan(.5);await page.keyboard.up('KeyW');}
 await page.click('#auto-button');await expect.poll(async()=> (await state(page)).state?.automatic).toBe(true);await page.click('[data-camera="1"]');await expect.poll(async()=> (await state(page)).state?.camera).toBe(1);
 await page.click('[data-camera="2"]');await expect.poll(async()=> (await state(page)).state?.camera).toBe(2);await expect.poll(async()=> (await state(page)).state?.automatic).toBe(true);
 if(mobile){const b=await page.locator('[data-drive="brake"]').boundingBox();await page.mouse.click(b!.x+b!.width/2,b!.y+b!.height/2);}
 else{await page.keyboard.press('KeyS');}
 await expect.poll(async()=> (await state(page)).state?.automatic).toBe(false);await expect.poll(async()=> (await state(page)).state?.camera).toBe(0);
 await page.click('#garage-button');await page.click('[data-car="1"]');await page.click('#garage-done');await expect.poll(async()=> (await state(page)).state?.car).toBe(1);
 await page.click('#garage-button');await page.click('[data-car="2"]');await page.click('#garage-done');await expect.poll(async()=> (await state(page)).state?.car).toBe(2);
 await page.click('#menu-button');await expect(page.locator('#menu-panel')).toBeVisible();await expect.poll(async()=> (await state(page)).state?.paused).toBe(true);const before=(await state(page)).player.position;await page.waitForTimeout(200);expect((await state(page)).player.position).toEqual(before);await page.click('#resume-button');await expect.poll(async()=> (await state(page)).state?.paused).toBe(false);
 await page.screenshot({path:`artifacts/${info.project.name}-m1.png`});expect(errors).toEqual([]);
});
test('控制区与画布在横竖屏可见且不横向溢出',async({page},info)=>{await page.goto('/?test=1');await page.click('#start-button');for(const size of info.project.name.includes('mobile')?[{width:390,height:844},{width:844,height:390}]:[{width:1440,height:900}]){await page.setViewportSize(size);await expect(page.locator('#game-canvas')).toBeVisible();await expect(page.locator('[data-camera="1"]')).toBeVisible();if(info.project.name.includes('mobile'))await expect(page.locator('[data-drive="throttle"]')).toBeInViewport();expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(size.width);await page.screenshot({path:`artifacts/layout-${size.width}x${size.height}.png`});}});
