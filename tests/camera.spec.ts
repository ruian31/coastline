import {test,expect}from'@playwright/test';
import type * as THREE from'three';

test('贴墙第三人称保留旋转方向，离开遮挡后平滑拉远',async({page})=>{
 test.setTimeout(180000);await page.setViewportSize({width:844,height:390});
 await page.addInitScript(()=>{
  localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));
  const w=window as unknown as{cameraObjects:THREE.Object3D[];__THREE_DEVTOOLS__:EventTarget};w.cameraObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.cameraObjects.push((e as CustomEvent).detail));
 });
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/?test=1');
 await page.evaluate(async()=>{const h=window.__THREE_GAME_TEST_HOOKS__!;await h.setState('camera-wall');h.setPausedForScreenshot(true);});
 const inspect=()=>page.evaluate(async()=>{
  const scene=(window as unknown as{cameraObjects:THREE.Scene[]}).cameraObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'))!,car=scene.getObjectByName('convertible-0')!;
  let camera:THREE.Camera|undefined;scene.onAfterRender=(_r,_s,c)=>{camera=c;};await new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r())));
  const rig=window.__THREE_GAME_DIAGNOSTICS__!.cameraRig!,dx=camera!.position.x-car.position.x,dz=camera!.position.z-car.position.z,observed=Math.atan2(-dx,-dz),expected=car.rotation.y+rig.orbitYaw;
  return{...rig,angleError:Math.abs(Math.atan2(Math.sin(observed-expected),Math.cos(observed-expected))),position:camera!.position.toArray()};
 });
 await expect.poll(async()=>(await inspect()).boomDistance).toBeLessThan(7);
 const blocked=await inspect();expect(blocked.boomDistance).toBeGreaterThan(.5);
 await page.mouse.move(700,203);await page.mouse.down();await page.mouse.move(700-Math.PI/.005,203);await page.mouse.up();
 await expect.poll(async()=>(await inspect()).availableDistance).toBeGreaterThan(8);
 const opening=await inspect();expect(opening.orbitYaw-blocked.orbitYaw).toBeCloseTo(Math.PI,2);expect(opening.angleError).toBeLessThan(.03);expect(opening.boomDistance!).toBeLessThan(opening.availableDistance!-.2);
 await expect.poll(async()=>{const r=await inspect();return r.availableDistance!-r.boomDistance!;},{timeout:20000}).toBeLessThan(.1);
 const open=await inspect();expect(open.angleError).toBeLessThan(.03);
 // The same real drag must work in the bore: the previous per-frame tunnel
 // override received input but left the actual camera completely stationary.
 await page.evaluate(async()=>{const h=window.__THREE_GAME_TEST_HOOKS__!;await h.setState('tunnel');h.setPausedForScreenshot(true);});await page.waitForTimeout(150);const before=await inspect();
 await page.mouse.move(700,203);await page.mouse.down();await page.mouse.move(250,160,{steps:24});await page.mouse.up();await page.waitForTimeout(150);
 const after=await inspect();expect(after.orbitYaw-before.orbitYaw).toBeCloseTo(2.25,2);expect(after.angleError).toBeLessThan(.03);expect(Math.hypot(...after.position.map((v,i)=>v-before.position[i]))).toBeGreaterThan(3);expect(after.boomDistance).toBeLessThanOrEqual(after.availableDistance!+.001);
 expect(errors).toEqual([]);
});

test('手机抬起第二指仍能继续拖动镜头，油门释放不粘连',async({page,context,browserName},info)=>{
 test.skip(browserName!=='chromium'||!info.project.name.includes('mobile'),'CDP原生多指与油门仅在Android项目执行');test.setTimeout(90000);await page.setViewportSize({width:844,height:390});
 await page.goto('/?test=1');await page.evaluate(async()=>{const h=window.__THREE_GAME_TEST_HOOKS__!;await h.setState('tunnel');h.setPausedForScreenshot(true);});
 const cdp=await context.newCDPSession(page),first={id:1,x:650,y:195},second={id:2,x:500,y:200};
 const touch=(type:'touchStart'|'touchEnd'|'touchMove',touchPoints:{id:number;x:number;y:number}[])=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
 const yaw=()=>page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__!.cameraRig!.orbitYaw);
 const before=await yaw();await touch('touchStart',[first]);first.x-=30;await touch('touchMove',[first]);await expect.poll(yaw).toBeGreaterThan(before+.1);
 await touch('touchStart',[first,second]);await touch('touchEnd',[second]);const released=await yaw();first.x-=60;await touch('touchMove',[first]);await expect.poll(yaw).toBeGreaterThan(released+.2);
 const box=await page.locator('[data-drive="throttle"]').boundingBox();expect(box).not.toBeNull();const pedal={id:3,x:box!.x+box!.width/2,y:box!.y+box!.height/2};
 await touch('touchStart',[first,pedal]);await expect(page.locator('[data-drive="throttle"]')).toHaveClass(/held/);await touch('touchEnd',[pedal]);await expect(page.locator('[data-drive="throttle"]')).not.toHaveClass(/held/);
 const pedalReleased=await yaw();first.x-=60;await touch('touchMove',[first]);await expect.poll(yaw).toBeGreaterThan(pedalReleased+.2);await touch('touchEnd',[]);await cdp.detach();
});
