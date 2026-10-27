import {test,expect} from '@playwright/test';

test('真实油门后保留滑行，制动后可恢复到道路',async({page},info)=>{
 test.setTimeout(180000);await page.setViewportSize({width:844,height:390});
 await page.addInitScript(()=>localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true})));
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/?test=1');
 await page.locator('#start-button').click({timeout:120000});
 const read=()=>page.evaluate(()=>structuredClone(window.__THREE_GAME_DIAGNOSTICS__!));
 await expect.poll(async()=>(await read()).vehicle?.engine).toBe('Rapier 0.21.0');
 const mobile=info.project.name.includes('mobile');
 const press=async(action:'throttle'|'brake',down:boolean)=>{
  if(mobile){if(down){const b=await page.locator(`[data-drive="${action}"]`).boundingBox();expect(b).not.toBeNull();await page.mouse.move(b!.x+b!.width/2,b!.y+b!.height/2);await page.mouse.down();}else await page.mouse.up();}
  else{const key=action==='throttle'?'KeyW':'KeyS';if(down)await page.keyboard.down(key);else await page.keyboard.up(key);}
 };
 const start=await read();await press('throttle',true);await expect.poll(async()=>(await read()).player.speed,{timeout:30000}).toBeGreaterThan(8);await press('throttle',false);
 const released=await read();await page.waitForFunction(t=>window.__THREE_GAME_DIAGNOSTICS__!.elapsed>t+.6,released.elapsed,{timeout:20000});const coasted=await read();
 expect(coasted.player.speed).toBeGreaterThan(released.player.speed*.75);expect(coasted.player.speed).toBeLessThan(released.player.speed+.8);
 await press('brake',true);await expect.poll(async()=>Math.abs((await read()).player.speed),{timeout:20000,intervals:[25,50,50]}).toBeLessThan(.25);await press('brake',false);const braked=await read();
 const travelled=Math.hypot(braked.player.position.x-start.player.position.x,braked.player.position.z-start.player.position.z);expect(travelled).toBeGreaterThan(10);
 await page.keyboard.press('KeyR');await expect.poll(async()=>Math.abs((await read()).player.speed)).toBeLessThan(.1);await expect.poll(async()=>(await read()).state!.roadDistance).toBeLessThan(3);
 const recovered=await read();expect(recovered.vehicle!.wheels).toHaveLength(4);expect(recovered.vehicle!.wheels.every(w=>Number.isFinite(w.length)&&Number.isFinite(w.force))).toBe(true);expect(errors).toEqual([]);
 await page.screenshot({path:`artifacts/vehicle-m61-${info.project.name}.png`});
 await test.info().attach('actual-input-state',{body:JSON.stringify({method:'Trusted keyboard or browser pointer pedal inputs and live RAF physics; no assigned velocity or stepped test clock. Mobile pointer checks are browser emulation, not physical-device performance.',start,released,coasted,braked,recovered,travelled,errors},null,2),contentType:'application/json'});
});
