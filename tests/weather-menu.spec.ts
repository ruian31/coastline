import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const read=(page:any)=>page.evaluate(()=>structuredClone(window.__THREE_GAME_DIAGNOSTICS__!));
async function start(page:any){
 await page.setViewportSize({width:844,height:390});
 await page.addInitScript(()=>{if(!sessionStorage.getItem('weather-menu-started')){localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true,music:false}));sessionStorage.setItem('weather-menu-started','1');}});
 await page.goto('/?test=1');await expect(page.locator('#start-auto')).toBeEnabled({timeout:60000});await page.locator('#start-auto').click();await expect.poll(async()=>(await read(page)).state?.running,{timeout:20000}).toBe(true);
}

test('天气菜单可触达，手选缓慢变化且重载保留中途天气和湿度',async({page},info)=>{
 test.setTimeout(160000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await mkdir('artifacts/weather-m79-menu',{recursive:true});await start(page);await page.locator('#menu-button').click();await page.locator('#weather-select').selectOption('drizzle');
 await expect.poll(async()=>(await read(page)).weather!.target,{timeout:20000}).toBe('drizzle');const chosen=await read(page);expect(chosen.weather!.rain).toBe(0);expect(await page.locator('#weather-natural').isChecked()).toBe(false);await expect(page.locator('#weather-status')).toContainText('缓缓转为');
 for(const id of['weather-select','weather-natural']){await page.locator('#'+id).scrollIntoViewIfNeeded();const box=await page.locator('#'+id).locator('..').boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);expect(box!.width).toBeLessThanOrEqual(844);}
 await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setWeather!('drizzle',17.25));await page.locator('#weather-natural').check();const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('coast-settings')!).weather);expect(saved.target).toBe('drizzle');expect(saved.natural).toBe(true);expect(saved.seconds).toBeGreaterThanOrEqual(17.25);expect(saved.value.rain).toBeGreaterThan(0);expect(saved.value.rain).toBeLessThan(.72);expect(saved.wetness).toBeGreaterThan(0);
 await page.screenshot({path:`artifacts/weather-m79-menu/${info.project.name}.png`});await page.reload();await expect(page.locator('#start-auto')).toBeEnabled({timeout:60000});const restored=await read(page);for(const key of['cloud','mist','rain','wind'] as const)expect(restored.weather![key]).toBe(saved.value[key]);expect(restored.weather!.wetness).toBe(saved.wetness);expect(restored.weather!.seconds).toBe(saved.seconds);expect(restored.weather!.natural).toBe(true);await page.waitForTimeout(250);expect((await read(page)).weather!.seconds).toBe(saved.seconds);
 await page.locator('#start-auto').click();await expect.poll(async()=>{const d=await read(page);return Boolean(d.vehicle?.wetness&&d.weather?.drizzle?.active&&d.weather.audio?.ready&&d.weather.seconds>saved.seconds+.3);},{timeout:30000}).toBe(true);const active=await read(page);expect(active.weather!.audio!.gain).toBeGreaterThan(0);await page.locator('#menu-button').click();await expect.poll(async()=>(await read(page)).state!.audioState,{timeout:15000}).toBe('suspended');
 await page.locator('#weather-select').selectOption('clear');expect(await page.locator('#weather-natural').isChecked()).toBe(false);const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('coast-settings')!).weather);expect(after.target).toBe('clear');expect(after.wetness).toBeGreaterThan(0);expect(after.value.rain).toBeGreaterThan(0);expect(errors).toEqual([]);
 await writeFile(`artifacts/weather-m79-menu/${info.project.name}.json`,JSON.stringify({chosen,saved,restored,active,after,errors},null,2)+'\n');
});


test('重复细雨与回晴复用雨池和遮雨资源，暂停冻结同一雨时钟',async({page},info)=>{
 test.setTimeout(100000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page);
 const rows=[];for(let i=0;i<3;i++){
  await page.evaluate(()=>{const h=window.__THREE_GAME_TEST_HOOKS__!;h.setPausedForScreenshot(true);h.setWeather!('drizzle',180);});
  await expect.poll(async()=>(await read(page)).weather!.drizzle!.active,{timeout:20000}).toBe(true);
  const frame=(await read(page)).frame;await expect.poll(async()=>(await read(page)).frame,{timeout:20000}).toBeGreaterThan(frame);
  const rain=await read(page);await page.waitForTimeout(300);const frozen=await read(page);expect(frozen.weather!.seconds).toBe(rain.weather!.seconds);expect(frozen.weather!.drizzle!.seconds).toBe(rain.weather!.drizzle!.seconds);expect(rain.weather!.drizzle!.scheduledDraws).toBe(1);expect(rain.weather!.drizzle!.capacity).toBe(info.project.name.includes('mobile')?540:960);
  await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setWeather!('clear',180));await expect.poll(async()=>(await read(page)).weather!.drizzle!.active,{timeout:20000}).toBe(false);const clear=await read(page);expect(clear.weather!.drizzle!.scheduledDraws).toBe(0);expect(clear.weather!.wetness).toBeGreaterThan(0);rows.push({rain,clear});
 }
 expect(rows[2].rain.renderer.geometries).toBe(rows[1].rain.renderer.geometries);expect(rows[2].rain.renderer.textures).toBe(rows[1].rain.renderer.textures);expect(errors).toEqual([]);await writeFile(`artifacts/weather-m79-menu/lifecycle-${info.project.name}.json`,JSON.stringify({rows,errors},null,2)+'\n');
});
