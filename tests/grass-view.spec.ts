import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const out=process.env.GRASS_VIEW_EVIDENCE??'artifacts/grass-m95-browser';
const diagnostics=(page:any)=>page.evaluate(()=>structuredClone(window.__THREE_GAME_DIAGNOSTICS__!));
async function observe(page:any,mobile:boolean){
 if(mobile)await page.setViewportSize({width:844,height:390});
 await page.addInitScript(()=>{
  localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true,music:false,headlights:false}));
  const w=window as any;w.grassObjects=[];w.grassDraws=[];w.__THREE_DEVTOOLS__=new EventTarget();
  w.__THREE_DEVTOOLS__.addEventListener('observe',(e:any)=>w.grassObjects.push(e.detail));
 });
}
const probe=(page:any)=>page.evaluate(()=>{
 const w=window as any,s=w.grassObjects.find((o:any)=>o.isScene&&o.userData.sunShadows),r=w.grassObjects.find((o:any)=>o.isWebGLRenderer),m=s.getObjectByName('World anchored dry grass canopy'),p=r.properties.get(m.material),gl=r.getContext();
 w.grassMatrixReference??=m.instanceMatrix;
 return{config:structuredClone(m.userData.grassCanopy),count:m.count,capacity:m.instanceMatrix.count,geometry:m.geometry.uuid,matrixSame:m.instanceMatrix===w.grassMatrixReference,pressure:p.uniforms.uPlantPressure.value.uuid,
  shaderSide:Number(/const int CANOPY_SIDE = (\d+);/.exec(gl.getShaderSource(p.currentProgram.vertexShader))?.[1]),drawRange:{...m.geometry.drawRange},glError:gl.getError(),draws:structuredClone(w.grassDraws),diagnostics:structuredClone(window.__THREE_GAME_DIAGNOSTICS__!)};
});
async function watchDraws(page:any){
 await page.evaluate(()=>{
  const w=window as any,s=w.grassObjects.find((o:any)=>o.isScene&&o.userData.sunShadows),r=w.grassObjects.find((o:any)=>o.isWebGLRenderer),m=s.getObjectByName('World anchored dry grass canopy'),gl=r.getContext(),before=m.onBeforeRender,after=m.onAfterRender,draw=gl.drawArraysInstanced.bind(gl);
  m.onBeforeRender=function(...args:any[]){before.apply(this,args);w.grassDrawing={camera:args[2].position.toArray(),target:r.getRenderTarget()?.texture.name??'main'};};
  m.onAfterRender=function(...args:any[]){after.apply(this,args);w.grassDrawing=null;};
  gl.drawArraysInstanced=function(mode:number,first:number,count:number,instances:number){
   if(w.grassDrawing){const program=gl.getParameter(gl.CURRENT_PROGRAM);w.grassDraws.push({...w.grassDrawing,first,count,instances,
    center:Array.from(gl.getUniform(program,gl.getUniformLocation(program,'uCanopyCarXZ'))),car:Array.from(gl.getUniform(program,gl.getUniformLocation(program,'uPlantCar'))),linked:gl.getProgramParameter(program,gl.LINK_STATUS)});if(w.grassDraws.length>160)w.grassDraws.shift();}
   return draw(mode,first,count,instances);
  };
 });
}

test('真实主视图与镜面采用各自草体范围，切档不重建，驾驶与绕看保持窗口约束',async({page},info)=>{
 test.setTimeout(180000);await mkdir(out,{recursive:true});await observe(page,info.project.name!=='desktop-chrome');
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('understory'));await watchDraws(page);
 await expect.poll(async()=>(await probe(page)).draws.filter((d:any)=>d.target==='main').length,{timeout:20000}).toBeGreaterThan(2);
 const initial=await probe(page);expect(initial.config.fineLeaves).toBe(true);expect(initial.config.radius).toBeGreaterThanOrEqual(info.project.name==='desktop-chrome'?13.5:9.8);
 expect(initial.shaderSide).toBe(initial.config.cellsPerSide);expect(initial.count).toBe(initial.config.fullCount/2);expect(initial.capacity).toBe(initial.config.fullCount);
 await page.locator('[data-camera="1"]').click();
 await expect.poll(async()=>(await probe(page)).draws.filter((d:any)=>d.target.startsWith('rearview-')).length,{timeout:25000}).toBeGreaterThan(2);
 const cockpit=await probe(page);const mirror=cockpit.draws.filter((d:any)=>d.target.startsWith('rearview-'));
 expect(mirror.every((d:any)=>d.first===72&&d.count===24&&d.linked)).toBe(true);
 expect(cockpit.draws.filter((d:any)=>d.target==='main').every((d:any)=>d.first===0&&d.count===96&&d.linked)).toBe(true);
 expect(cockpit.drawRange).toEqual({start:0,count:96});expect(cockpit.config.secondaryView).toBe(false);
 await page.locator('#menu-button').click();const qualities=[];
 for(const tier of ['high','low']){
  await page.locator('#quality-select').selectOption(tier);await expect.poll(async()=>(await diagnostics(page)).state!.quality).toBe(tier);
  await expect.poll(async()=>{const p=await probe(page);return p.count===p.config.fullCount/(tier==='low'?2:1);}).toBe(true);
  const p=await probe(page);expect([p.geometry,p.pressure]).toEqual([initial.geometry,initial.pressure]);expect(p.matrixSame).toBe(true);expect(p.shaderSide).toBe(p.config.cellsPerSide);qualities.push({tier,p});
 }
 await page.locator('#resume-button').click();await page.locator('[data-camera="0"]').click();
 const before=await diagnostics(page);await page.keyboard.down('ArrowUp');
 try{await expect.poll(async()=>{const d=await diagnostics(page);return Math.hypot(d.player.position.x-before.player.position.x,d.player.position.z-before.player.position.z);},{timeout:45000}).toBeGreaterThan(4);}finally{await page.keyboard.up('ArrowUp');}
 await page.mouse.move(450,170);await page.mouse.down();await page.mouse.move(650,170,{steps:18});await page.mouse.up();
 await page.waitForTimeout(350);const driven=await probe(page),main=driven.draws.filter((d:any)=>d.target==='main').slice(-10);
 expect(main.length).toBeGreaterThan(2);
 for(const d of main){const dx=d.camera[0]-d.car[0],dz=d.camera[2]-d.car[2],k=Math.min(.5,5/Math.max(Math.hypot(dx,dz),.001));expect(d.center[0]).toBeCloseTo(d.car[0]+dx*k,2);expect(d.center[1]).toBeCloseTo(d.car[2]+dz*k,2);expect(Math.hypot(d.center[0]-d.car[0],d.center[1]-d.car[2])).toBeLessThanOrEqual(5.01);}
 expect(driven.config.viewCentered).toBe(true);expect(driven.glError).toBe(0);expect(errors).toEqual([]);
 await page.screenshot({path:`${out}/${info.project.name}-driving.png`,scale:'css'});
 await writeFile(`${out}/${info.project.name}.json`,JSON.stringify({scope:'Production candidate. Fixture setup, then actual UI camera/quality and trusted keyboard/mouse. Native drawArraysInstanced first/count observed for the canopy only, proving main96/mirror24 and primary restoration; actual GPU center/car uniforms verify midpoint/cap. Quality resources keep identity. Not vertex contact/recovery, motion-art or physical-phone performance.',initial,cockpit,qualities,driven,errors},null,2)+'\n');
});

test('细草资源404后使用原预算回退并能从普通入口驾驶',async({page},info)=>{
 test.setTimeout(150000);await mkdir(out,{recursive:true});await observe(page,info.project.name!=='desktop-chrome');let blocked=0;
 const errors:string[]=[],badResponses:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404')&&!m.location().url.includes('coastal_fine_grass'))errors.push(m.text());});
 page.on('response',r=>{if(r.status()>=400&&!r.url().includes('/coastal_fine_grass/grass.gltf'))badResponses.push(r.url());});
 await page.route('**/assets/models/coastal_fine_grass/grass.gltf',async route=>{blocked++;await route.fulfill({status:404,body:'Intentional missing fine-grass model'});});
 await page.goto('/?test=1');await expect(page.locator('#start-button')).toBeEnabled({timeout:60000});await page.locator('#start-button').click();
 await expect.poll(async()=>(await diagnostics(page)).state!.running).toBe(true);
 const initial=await probe(page);expect(blocked).toBeGreaterThan(0);expect(initial.config.fineLeaves).toBe(false);expect(initial.config.photographed).toBe(true);
 expect(initial.config.cellsPerSide).toBe(info.project.name==='desktop-chrome'?64:48);expect(initial.shaderSide).toBe(initial.config.cellsPerSide);expect(initial.count).toBe(initial.config.fullCount/2);expect(initial.config.viewCentered).toBe(false);
 const before=await diagnostics(page);await page.keyboard.down('ArrowUp');try{await expect.poll(async()=>{const d=await diagnostics(page);return Math.hypot(d.player.position.x-before.player.position.x,d.player.position.z-before.player.position.z);},{timeout:30000}).toBeGreaterThan(3);}finally{await page.keyboard.up('ArrowUp');}
 const end=await probe(page);expect(end.glError).toBe(0);expect(errors).toEqual([]);expect(badResponses).toEqual([]);
 await writeFile(`${out}/fallback-${info.project.name}.json`,JSON.stringify({scope:'Only fine model404; actual ordinary start button and trusted keyboard driving. Legacy photographed fallback shader/draw-side budget retained; reserved instance storage is still larger. Not phone performance.',blocked,initial,end,errors,badResponses},null,2)+'\n');
});
