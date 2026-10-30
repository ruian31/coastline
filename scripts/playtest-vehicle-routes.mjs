import {chromium,devices} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const label=process.env.VEHICLE_LABEL;assert.match(label??'',/^[a-z0-9-]+$/);
const out='artifacts/vehicle-'+label,base=process.env.TEST_BASE_URL??'http://127.0.0.1:4191';await mkdir(out,{recursive:true});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),files=['src/systems/VehicleDynamics.ts','src/systems/Driving.ts','src/game/OceanDrive.ts','src/world/roads.ts','src/world/Scenery.ts','src/world/ScannedCoast.ts','src/world/inland-relief-v2.json','src/world/Landmarks.ts','src/world/RoadMesh.ts','src/vehicles/Convertible.ts'];
const sources=await Promise.all(files.map(async file=>({file,sha256:hash(await readFile(file))})));
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']}),reports=[];
try{
 for(const mobile of[false,true]){
  const device=mobile?'android':'desktop',context=await browser.newContext({...mobile?devices['Pixel 7']:{},viewport:mobile?{width:844,height:390}:{width:1280,height:720}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.addInitScript(()=>localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true})));
  await page.goto(base+'/?test=1');await page.waitForFunction(()=>window.__THREE_GAME_TEST_HOOKS__);await page.evaluate(async()=>{await window.__THREE_GAME_TEST_HOOKS__.setState('active-play');window.__THREE_GAME_TEST_HOOKS__.setPausedForScreenshot(true);});
  const modulePaths=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name).filter(name=>/\/assets\/.*\.js$/.test(name))),modules=[];
  for(const url of modulePaths){const bytes=Buffer.from(await(await fetch(url)).arrayBuffer());modules.push({url,bytes:bytes.length,sha256:hash(bytes)});}
  for(const state of['active-play','modern','sport','reverse-cruise']){
   await page.evaluate(async state=>{await window.__THREE_GAME_TEST_HOOKS__.setState(state);window.__THREE_GAME_TEST_HOOKS__.setPausedForScreenshot(true);},state);await page.locator('#junction-button').click();
   const result=await page.evaluate(()=>{const initial=structuredClone(window.__THREE_GAME_DIAGNOSTICS__),samples=[];for(let i=0;i<800;i++){window.__THREE_GAME_TEST_HOOKS__.stepDriving(.5);const d=window.__THREE_GAME_DIAGNOSTICS__;samples.push({time:(i+1)*.5,player:d.player,state:d.state,vehicle:d.vehicle});}return{initial,samples};});
   const last=result.samples.at(-1),summary={device,state,mass:last.vehicle.mass,steps:last.vehicle.steps-result.initial.vehicle.steps,observedRoads:[...new Set(result.samples.map(s=>s.state.road))],maxObservedRoadDistance:Math.max(...result.samples.map(s=>s.state.roadDistance)),offroadSamples:result.samples.filter(s=>s.state.offroad).length,slowSamples:result.samples.filter(s=>s.player.speed<.5).length,sawMidHill:result.samples.some(s=>s.state.road==='hill'&&s.state.progress>.2&&s.state.progress<.8),final:last};
   await writeFile(`${out}/${device}-${state}.json`,JSON.stringify({summary,...result},null,2)+'\n');reports.push({modules,...summary});console.log(JSON.stringify({device,state,steps:summary.steps,maxRoad:summary.maxObservedRoadDistance,slow:summary.slowSamples,sawHill:summary.sawMidHill,finalRoad:last.state.road,preferHill:last.state.preferHill}));await page.screenshot({path:`${out}/${device}-${state}.png`});
   assert.equal(summary.steps,24000,'Only the requested fixed physics steps should run while RAF simulation is paused');assert.equal(summary.slowSamples,0,'Cruise cannot remain stuck against a junction obstacle');assert.ok(summary.sawMidHill);assert.equal(last.state.road,'coast');assert.equal(last.state.preferHill,false);assert.ok(summary.maxObservedRoadDistance<4.5);assert.deepEqual(errors,[]);
  }
  await context.close();
 }
 for(const source of sources)assert.equal(hash(await readFile(source.file)),source.sha256,'Source changed during trajectory observation');
 await writeFile(out+'/result.json',JSON.stringify({method:'Actual compiled game world, both geometry tiers, dynamic mass/suspension and throttle/brake/steering autopilot. Real junction UI click; forward three cars plus reverse-direction classic. Rendering continues but simulation RAF is screenshot-paused;800 hook.stepDriving(.5) calls each execute30 actual1/60 Driving updates,24,000 steps per trajectory. Raw observations every.5s are not continuous peak/error detection. This is CPU trajectory verification, not a real-time driving video, phone performance or real touch evidence.',base,sources,reports},null,2)+'\n');
}finally{await browser.close();}
