import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const out=process.env.UNDERSTORY_EVIDENCE??'artifacts/understory-m89-browser';
const read=(page:any)=>page.evaluate(()=>structuredClone(window.__THREE_GAME_DIAGNOSTICS__!));

async function observe(page:any){
 await page.setViewportSize({width:844,height:390});
 await page.addInitScript(()=>{
  localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true,music:false}));
  const w=window as any;w.understoryObjects=[];w.understoryDraws={};w.__THREE_DEVTOOLS__=new EventTarget();
  w.__THREE_DEVTOOLS__.addEventListener('observe',(e:any)=>w.understoryObjects.push(e.detail));
 });
}

const probe=(page:any)=>page.evaluate(()=>{
 const w=window as any,scene=w.understoryObjects.find((o:any)=>o.isScene&&o.userData.sunShadows),r=w.understoryObjects.find((o:any)=>o.isWebGLRenderer),root=scene.getObjectByName('Coastal landscape');
 const canopy=root.getObjectByName('World anchored dry grass canopy'),shared=r.properties.get(canopy.material).uniforms.uPlantPressure.value;
 const rows=[0,1].map(part=>{
  const mesh=root.getObjectByName('Complete coastal understory '+part),m=mesh.material,u=r.properties.get(m).uniforms;
  const placements=mesh.userData.authoredInstances.map((a:any)=>a.toArray());
  return{name:mesh.name,count:mesh.count,placements,geometry:mesh.geometry.uuid,material:m.uuid,
   textures:[m.map,m.normalMap,m.roughnessMap,m.metalnessMap].map(t=>t?.uuid??null),
   dimensions:[m.map,m.normalMap,m.roughnessMap].map(t=>[t.image.width,t.image.height]),
   groundAttribute:mesh.geometry.getAttribute('instanceGroundSlope').count,
   pressureSame:u.uPlantPressure.value===shared,pressure:shared.uuid,
   wind:u.uSceneryTime.value,windStrength:u.uSceneryWind.value,pressureTime:u.uPlantTime.value,
   pressureCar:u.uPlantCar.value.toArray(),draw:w.understoryDraws[mesh.name]??null};
 });
 // Raw marks near authored root positions establish that actual wheel/body
 // sweeps reached these plants, without synthesizing pressure or elapsed time.
 const u=r.properties.get(root.getObjectByName('Complete coastal understory 0').material).uniforms,data=shared.image.data,origin=u.uPlantOrigin.value,size=shared.image.width;
 let markedPlants=0;
 for(const m of rows[0].placements){let peak=0;const x=Math.floor(m[12]/.2)-origin.x,z=Math.floor(m[14]/.2)-origin.y;
  for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const col=x+dx,row=z+dz;if(col>=0&&row>=0&&col<size&&row<size)peak=Math.max(peak,data[(row*size+col)*4]);}
  if(peak>16)markedPlants++;
 }
 return{rows,metadata:structuredClone(root.userData.understory),meadowShrubs:root.userData.meadowShrubs,interaction:{...root.userData.vegetationInteraction},markedPlants,textureVersion:shared.version,glError:r.getContext().getError(),diagnostics:structuredClone(window.__THREE_GAME_DIAGNOSTICS__!)};
});

test('完整低灌丛共享真实风压，画质切换保留近株，键盘穿行后暂停恢复',async({page},info)=>{
 test.setTimeout(150000);await mkdir(out,{recursive:true});await observe(page);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('/?test=1');await page.evaluate(async()=>{
  const h=window.__THREE_GAME_TEST_HOOKS__!;await h.setState('understory');h.setPausedForScreenshot(true);
  const w=window as any,scene=w.understoryObjects.find((o:any)=>o.isScene&&o.userData.sunShadows);
  for(const part of [0,1]){
   const mesh=scene.getObjectByName('Complete coastal understory '+part);
   mesh.onAfterRender=(renderer:any,_scene:any,_camera:any,_geometry:any,material:any)=>{
    if(renderer.getRenderTarget())return;
    const gl=renderer.getContext(),p=renderer.properties.get(material),program=p.currentProgram.program,u=p.uniforms,unit=gl.getUniform(program,gl.getUniformLocation(program,'uPlantPressure')),active=gl.getParameter(gl.ACTIVE_TEXTURE);
    let bound=false;if(typeof unit==='number'){gl.activeTexture(gl.TEXTURE0+unit);bound=gl.getParameter(gl.TEXTURE_BINDING_2D)===renderer.properties.get(u.uPlantPressure.value).__webglTexture;gl.activeTexture(active);}
    w.understoryDraws[mesh.name]={linked:gl.getProgramParameter(program,gl.LINK_STATUS),pressureBound:bound,
     wind:gl.getUniform(program,gl.getUniformLocation(program,'uSceneryTime')),
     pressureTime:gl.getUniform(program,gl.getUniformLocation(program,'uPlantTime'))};
   };
  }
 });
 await expect.poll(async()=>{const p=await probe(page);return p.rows.every((r:any)=>r.draw?.linked&&r.draw?.pressureBound);},{timeout:20000}).toBe(true);
 const initial=await probe(page);
 expect(initial.metadata.ready).toBe(true);
 expect(initial.meadowShrubs).toBeGreaterThanOrEqual(6);
 expect(initial.meadowShrubs).toBeLessThanOrEqual(9);
 const placements=18+initial.meadowShrubs;
 expect(initial.metadata.placements).toBe(placements);
 expect(initial.rows[0].placements).toEqual(initial.rows[1].placements);
 expect(initial.rows.every((r:any)=>r.count>0&&r.pressureSame&&r.groundAttribute===placements)).toBe(true);
 expect(initial.rows[0].textures).toEqual(initial.rows[1].textures);expect(new Set(initial.rows.flatMap((r:any)=>r.textures).filter(Boolean)).size).toBe(3);
 for(const r of initial.rows){expect(r.dimensions).toEqual([[512,512],[512,512],[512,512]]);expect(r.placements).toHaveLength(placements);expect(r.draw.wind).toBeCloseTo(r.wind,4);expect(r.draw.pressureTime).toBeCloseTo(r.pressureTime,4);}
 const quality=[];
 await page.locator('#menu-button').click();await expect.poll(async()=>(await read(page)).state!.paused).toBe(true);
 for(const tier of ['high','low']){
  await page.locator('#quality-select').selectOption(tier);await expect.poll(async()=>(await read(page)).state!.quality).toBe(tier);
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  const current=await probe(page);expect(current.metadata.placements).toBe(placements);
  for(let i=0;i<2;i++){
   expect(current.rows[i].placements).toEqual(initial.rows[i].placements);expect(current.rows[i].count).toBe(initial.rows[i].count);
   expect(current.rows[i].geometry).toBe(initial.rows[i].geometry);expect(current.rows[i].pressure).toBe(initial.rows[i].pressure);
  }
  quality.push({tier,current});
 }
 // Only fixture framing was frozen. Driving, pressure stamping and subsequent
 // pause/resume use the ordinary UI and trusted keyboard events.
 await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setPausedForScreenshot(false));await page.locator('#resume-button').click();
 await expect.poll(async()=>(await read(page)).state!.paused).toBe(false);
 const before=await probe(page),center=before.metadata.centers[1],samples:any[]=[];let closest=Infinity;
 await page.keyboard.down('ArrowUp');
 try{
  await expect.poll(async()=>{
   const d=await read(page),p=d.player.position,distance=Math.hypot(p.x-center[0],p.z-center[2]);closest=Math.min(closest,distance);samples.push({elapsed:d.elapsed,position:p,speed:d.player.speed,distance});
   return Math.hypot(p.x-before.diagnostics.player.position.x,p.z-before.diagnostics.player.position.z);
  },{timeout:60000,intervals:[100,100,150,200]}).toBeGreaterThan(8.5);
 }finally{
  await page.keyboard.up('ArrowUp');
  await writeFile(`${out}/${info.project.name}-drive-samples.json`,JSON.stringify({samples,closest,end:await read(page)},null,2)+'\n');
 }
 const driven=await probe(page);expect(closest).toBeLessThan(2);expect(driven.diagnostics.state!.automatic).toBe(false);
 expect(driven.markedPlants).toBeGreaterThan(before.markedPlants);expect(driven.interaction.cachedCells).toBeGreaterThan(before.interaction.cachedCells);
 expect(driven.rows.every((r:any)=>r.pressureSame&&r.wind>initial.rows[0].wind)).toBe(true);expect(driven.rows[0].pressureCar).not.toEqual(before.rows[0].pressureCar);
 await page.locator('#menu-button').click();await expect.poll(async()=>(await read(page)).state!.paused).toBe(true);const paused=await probe(page);
 await page.waitForTimeout(350);const frozen=await probe(page);expect(frozen.textureVersion).toBe(paused.textureVersion);
 for(let i=0;i<2;i++){expect(frozen.rows[i].wind).toBe(paused.rows[i].wind);expect(frozen.rows[i].pressureTime).toBe(paused.rows[i].pressureTime);expect(frozen.rows[i].pressureCar).toEqual(paused.rows[i].pressureCar);}
 await page.locator('#resume-button').click();await expect.poll(async()=>(await read(page)).elapsed,{timeout:15000}).toBeGreaterThan(paused.diagnostics.elapsed+.3);
 const resumed=await probe(page);expect(resumed.glError).toBe(0);expect(errors).toEqual([]);
 await page.screenshot({path:`${out}/${info.project.name}-playing.png`,scale:'css'});
 await writeFile(`${out}/${info.project.name}.json`,JSON.stringify({scope:'Production understory fixture only for setup/frozen quality comparison. Actual shared compiled material uniforms and main-view GL pressure binding, stable authored placements/quality preservation, trusted keyboard drive through patch, actual UI pause/resume. Raw marks near plant roots prove the swept pressure field reached the authored patch, not exact GPU vertex displacement or visual contact. Browser device emulation is not physical-phone performance. No synthetic driving steps or pressure/season time.',initial,quality,before,driven,closest,samples,paused,frozen,resumed,errors},null,2)+'\n');
});

test('低灌丛资源404时仍可从普通按钮开始驾驶',async({page},info)=>{
 test.setTimeout(100000);await mkdir(out,{recursive:true});await observe(page);
 const errors:string[]=[],unexpectedResponses:string[]=[];let intercepted=0;
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404')&&!m.location().url.includes('coastal_understory'))errors.push(m.text());});
 page.on('response',r=>{if(r.status()>=400&&!r.url().includes('/coastal_understory/understory.glb'))unexpectedResponses.push(r.url());});
 await page.route('**/assets/models/coastal_understory/understory.glb',async route=>{intercepted++;await route.fulfill({status:404,body:'Intentional missing understory asset'});});
 await page.goto('/?test=1');await expect(page.locator('#start-button')).toBeEnabled({timeout:60000});await page.locator('#start-button').click();
 await expect.poll(async()=>(await read(page)).state!.running,{timeout:15000}).toBe(true);
 const start=await read(page);await page.keyboard.down('ArrowUp');try{
  await expect.poll(async()=>{const d=await read(page);return Math.hypot(d.player.position.x-start.player.position.x,d.player.position.z-start.player.position.z);},{timeout:20000}).toBeGreaterThan(3);
 }finally{await page.keyboard.up('ArrowUp');}
 const end=await read(page),asset=await page.evaluate(()=>{const w=window as any,s=w.understoryObjects.find((o:any)=>o.isScene&&o.userData.sunShadows);return structuredClone(s.getObjectByName('Coastal landscape').userData.understory);});
 expect(intercepted).toBeGreaterThan(0);expect(asset.ready).toBe(false);expect(asset.error).toBeTruthy();expect(end.state!.paused).toBe(false);expect(errors).toEqual([]);expect(unexpectedResponses).toEqual([]);
 await writeFile(`${out}/missing-${info.project.name}.json`,JSON.stringify({scope:'Intentional understory GLB404 only, actual ordinary start button and keyboard driving. No fixture teleport or synthetic driving. Device emulation is not physical-phone performance.',intercepted,asset,start,end,errors,unexpectedResponses},null,2)+'\n');
});
