import {test,expect}from'@playwright/test';

test('三车灯光跟随实际制动与倒车，前灯开关保留',async({page},info)=>{
 test.setTimeout(240000);await page.setViewportSize({width:844,height:390});
 await page.addInitScript(()=>{if(!localStorage.getItem('coast-settings'))localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));(window as any).lampObjects=[];(window as any).__THREE_DEVTOOLS__=new EventTarget();(window as any).__THREE_DEVTOOLS__.addEventListener('observe',(e:any)=>(window as any).lampObjects.push(e.detail));});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.goto('/?test=1');await page.locator('#start-button').click({timeout:120000});
 const read=()=>page.evaluate(()=>{
  const d=structuredClone(window.__THREE_GAME_DIAGNOSTICS__!),scene=(window as any).lampObjects.find((o:any)=>o.isScene&&o.getObjectByName('Coastal landscape')),car=scene.getObjectByName('convertible-'+d.state!.car),lamps=(key:string)=>car.getObjectByName('vehicle-'+key).material.emissiveIntensity;
  return{diagnostics:d,brake:lamps('brakeLamp'),reverse:lamps('reverseLamp'),accessory:lamps('tail'),beams:car.children.filter((o:any)=>o.isSpotLight).map((o:any)=>({intensity:o.intensity,shadow:o.castShadow,position:o.position.toArray()}))};
 });
 const mobile=info.project.name.includes('mobile');
 const pedal=async(name:'throttle'|'brake',down:boolean)=>{if(mobile){if(down){const box=await page.locator(`[data-drive="${name}"]`).boundingBox();expect(box).not.toBeNull();await page.mouse.move(box!.x+box!.width/2,box!.y+box!.height/2);await page.mouse.down();}else await page.mouse.up();}else{const key=name==='throttle'?'KeyW':'KeyS';if(down)await page.keyboard.down(key);else await page.keyboard.up(key);}};
 const records=[];
 for(let model=0;model<3;model++){
  if(model){await page.keyboard.press('KeyR');await page.click('#garage-button');await page.click(`[data-car="${model}"]`);await page.click('#garage-done');}
  await expect.poll(async()=>(await read()).diagnostics.state!.car).toBe(model);
  await pedal('throttle',true);await expect.poll(async()=>(await read()).diagnostics.player.speed,{timeout:30000}).toBeGreaterThan(4);await pedal('throttle',false);const coast=await read();expect(coast.diagnostics.vehicleLights!.braking).toBe(false);expect(coast.reverse).toBe(0);
  await pedal('brake',true);await expect.poll(async()=>(await read()).diagnostics.vehicleLights!.braking,{intervals:[25,50,50]}).toBe(true);const braking=await read();expect(braking.brake).toBeGreaterThan(coast.brake*4);expect(braking.accessory).toBe(coast.accessory);
  await page.screenshot({path:`artifacts/lights-m63-${info.project.name}-${model}-brake.png`});
  await expect.poll(async()=>(await read()).diagnostics.player.speed,{timeout:30000}).toBeLessThan(-.5);const reverse=await read();expect(reverse.diagnostics.vehicleLights!.braking).toBe(false);expect(reverse.diagnostics.vehicleLights!.reversing).toBe(true);expect(reverse.reverse).toBeGreaterThan(1);await pedal('brake',false);
  await page.screenshot({path:`artifacts/lights-m63-${info.project.name}-${model}-reverse.png`});
  await pedal('throttle',true);await expect.poll(async()=>(await read()).diagnostics.player.speed,{timeout:30000}).toBeGreaterThan(.5);await pedal('throttle',false);await expect.poll(async()=>(await read()).diagnostics.vehicleLights!.braking).toBe(false);await expect.poll(async()=>(await read()).reverse).toBe(0);
  const forward=await read();expect(forward.beams).toHaveLength(2);expect(forward.beams.every((b:any)=>b.intensity>0&&!b.shadow)).toBe(true);records.push({model,coast,braking,reverse,forward});
 }
 await page.keyboard.press('KeyH');await expect.poll(async()=>(await read()).diagnostics.vehicleLights!.headlights).toBe(false);await page.click('#menu-button');await expect(page.locator('#headlights-enabled')).not.toBeChecked();await page.locator('#headlights-enabled').check();await expect.poll(async()=>(await read()).diagnostics.vehicleLights!.headlights).toBe(true);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('coast-settings')!).headlights)).toBe(true);
 await page.locator('#headlights-enabled').uncheck();await page.click('#resume-button');await page.reload();await page.locator('#start-button').click({timeout:120000});await expect.poll(async()=>(await read()).diagnostics.vehicleLights!.headlights).toBe(false);expect((await read()).beams.every((b:any)=>b.intensity===0)).toBe(true);expect(errors).toEqual([]);
 await test.info().attach('lamp-input-records',{body:JSON.stringify({method:'Live RAF with trusted keyboard or browser pointer pedals. Initial scene settles normally; no assigned speed or stepped clock. Same-model lamp materials are observed after real acceleration, service braking, reverse and forward again. Browser emulation is not physical phone performance.',records,errors},null,2),contentType:'application/json'});
});
