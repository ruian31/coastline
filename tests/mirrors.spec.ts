import {test,expect} from '@playwright/test';

test('三车镜面保留实际后方、左右反射与资源生命周期',async({page},info)=>{
 test.setTimeout(180000);await page.setViewportSize(info.project.name.includes('mobile')?{width:844,height:390}:{width:1280,height:720});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>{
  localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));const w=window as any;w.mirrorObjects=[];w.mirrorTargets={};w.__THREE_DEVTOOLS__=new EventTarget();
  w.__THREE_DEVTOOLS__.addEventListener('observe',(event:any)=>{const object=event.detail;w.mirrorObjects.push(object);if(object.isWebGLRenderer){const original=object.setRenderTarget;object.setRenderTarget=function(target:any,...args:any[]){if(target?.texture.name.startsWith('rearview-'))w.mirrorTargets[target.texture.name]=target;return original.call(this,target,...args);};}});
 });
 await page.goto('/?test=1');await page.waitForFunction(()=>Boolean(window.__THREE_GAME_TEST_HOOKS__));
 const read=()=>page.evaluate(()=>structuredClone(window.__THREE_GAME_DIAGNOSTICS__!));
 const records=[];
 for(const [car,state]of ['active-play','modern','sport','active-play'].entries()){
  await page.evaluate(async state=>{await window.__THREE_GAME_TEST_HOOKS__!.setState(state);window.__THREE_GAME_TEST_HOOKS__!.setPausedForScreenshot(true);},state);
  await page.locator('[data-camera="1"]').click();
  await expect.poll(async()=>{const d=await read();return d.vehicleMirrors!.views.find(v=>v.name==='rearview-center')!.updates;},{timeout:20000}).toBeGreaterThan(0);
  const forward=await read();expect(forward.state!.car).toBe(car===3?0:car);expect(forward.vehicleMirrors!.active).toBe(true);expect(forward.cameraRig!.cockpitEyeError).toBeLessThan(.00001);
  const image=`artifacts/mirrors-m67-${info.project.name}-${car}-forward.png`;await page.screenshot({path:image});
  if(car===0){
   await page.evaluate(()=>{window.__THREE_GAME_TEST_HOOKS__!.stepDriving!(3,{throttle:0,brake:0,steer:0,handbrake:true});window.__THREE_GAME_TEST_HOOKS__!.setPausedForScreenshot(false);});
   await expect.poll(async()=>Math.abs((await read()).player.speed)).toBeLessThan(.15);
   // QA-only boards are placed along independently reflected rays through the
   // real center glass. Read the production half-float target with Three's API.
   const names=await page.evaluate(()=>{
    const w=window as any,scene=w.mirrorObjects.find((o:any)=>o.isScene&&o.getObjectByName('Coastal landscape')),car=scene.getObjectByName('convertible-0'),surface=car.getObjectByName('rearview-center'),basic=car.getObjectByName('radio-display').material;
    const eye=car.localToWorld(car.position.clone().set(-.425,1.29,-.43)),center=surface.position.clone().setFromMatrixPosition(surface.matrixWorld),normal=center.clone().set(0,0,1).transformDirection(surface.matrixWorld),reflectedEye=eye.clone().addScaledVector(normal,-2*eye.clone().sub(center).dot(normal));
    surface.geometry.computeBoundingBox();const width=surface.geometry.boundingBox.max.x-surface.geometry.boundingBox.min.x;
    const boards=[[-1,0xff0000],[1,0x0000ff]].map(([side,color],i)=>{const hit=center.clone().set(side*width*.23,0,0).applyMatrix4(surface.matrixWorld),ray=hit.clone().sub(eye).normalize().reflect(normal),board=new surface.constructor(surface.geometry.clone(),new basic.constructor({color,toneMapped:false,fog:false}));board.name='mirror-qa-board-'+i;board.position.copy(hit).addScaledVector(ray,12);board.scale.set(2.5,9,1);board.lookAt(reflectedEye);scene.add(board);return board.name;});return boards;
   });
   const start=(await read()).vehicleMirrors!.views.find(v=>v.name==='rearview-center')!.updates;
   await expect.poll(async()=>(await read()).vehicleMirrors!.views.find(v=>v.name==='rearview-center')!.updates).toBeGreaterThan(start+1);
   const pixels=await page.evaluate(()=>{
    const w=window as any,renderer=w.mirrorObjects.find((o:any)=>o.isWebGLRenderer),target=w.mirrorTargets['rearview-center-linear-view'],buffer=new Uint16Array(target.width*target.height*4);renderer.readRenderTargetPixels(target,0,0,target.width,target.height,buffer);
    const half=(h:number)=>{const sign=h&32768?-1:1,exponent=(h>>10)&31,mantissa=h&1023;return sign*(exponent===0?2**-14*mantissa/1024:exponent===31?Infinity:(1+mantissa/1024)*2**(exponent-15));};
    let red=0,blue=0,redX=0,blueX=0;for(let i=0;i<buffer.length;i+=4){const r=half(buffer[i]),g=half(buffer[i+1]),b=half(buffer[i+2]),x=i/4%target.width;if(r>.4&&r>g*3&&r>b*3){red++;redX+=x;}if(b>.4&&b>r*3&&b>g*3){blue++;blueX+=x;}}
    return{width:target.width,height:target.height,red,blue,redX:redX/red,blueX:blueX/blue};
   });
   expect(pixels.red).toBeGreaterThan(40);expect(pixels.blue).toBeGreaterThan(40);expect(pixels.redX).toBeGreaterThan(pixels.width*.6);expect(pixels.blueX).toBeLessThan(pixels.width*.4);
   await page.screenshot({path:`artifacts/mirrors-m67-${info.project.name}-colored-rays.png`});
   await page.evaluate(names=>{const scene=(window as any).mirrorObjects.find((o:any)=>o.isScene&&o.getObjectByName('Coastal landscape'));for(const name of names){const board=scene.getObjectByName(name);board.removeFromParent();board.geometry.dispose();board.material.dispose();}},names);
   records.push({pixels});
  }
  await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setPausedForScreenshot(true));await page.waitForTimeout(350);const frozen=await read();await page.waitForTimeout(300);expect((await read()).vehicleMirrors!.passes).toBe(frozen.vehicleMirrors!.passes);
  await page.locator('[data-camera="0"]').click();await expect.poll(async()=>(await read()).vehicleMirrors!.active).toBe(false);const outside=await read();await page.waitForTimeout(250);expect((await read()).vehicleMirrors!.passes).toBe(outside.vehicleMirrors!.passes);
  records.push({car:forward.state!.car,forward,outside,image});
 }
 const first=records.find((r:any)=>r.car===0) as any,last=records[records.length-1] as any;expect(last.forward.renderer.textures).toBeLessThanOrEqual(first.forward.renderer.textures);expect(last.forward.renderer.geometries).toBeLessThanOrEqual(first.forward.renderer.geometries);expect(errors).toEqual([]);
 await info.attach('mirror-records',{body:JSON.stringify({method:'Actual production three-car views and switch lifecycle. QA-only red/blue boards on independently reflected rays verify physical target left/right via Three half-float readback; they are removed and never shipped. Trusted camera UI, frozen driving fixtures; no live driving or physical phone FPS claim.',records,errors},null,2),contentType:'application/json'});
});
