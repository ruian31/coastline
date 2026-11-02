import assert from 'node:assert/strict';
import {chromium,devices} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';

const label=process.env.SEASON_DRIVE_LABEL;assert.match(label??'',/^[a-z0-9-]+$/);
const out='artifacts/season-drive-'+label;await mkdir(out);
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']}),context=await browser.newContext({...devices['Pixel 7'],viewport:{width:844,height:390},recordVideo:{dir:out,size:{width:844,height:390}}}),page=await context.newPage(),errors=[],samples=[],captures=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const read=()=>page.evaluate(()=>structuredClone(window.__THREE_GAME_DIAGNOSTICS__));
await page.addInitScript(()=>localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true,music:false})));
try{
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:4218')+'/?test=1');await page.waitForFunction(()=>!document.querySelector('#start-auto').disabled,{timeout:60000});
 // Season selection is still an internal interface in M80. All subsequent
 // progress uses the real game clock and driving UI; no synthetic time steps.
 await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setSeason('spring',0));await page.locator('#start-auto').click();await page.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__.state.running&&!window.__THREE_GAME_DIAGNOSTICS__.state.paused);
 const start=await read(),wallStart=Date.now();let cockpit=false,previous=start.season.amount;
 while((await read()).season.seconds<start.season.seconds+60.2){
  const d=await read();assert.equal(d.state.paused,false);assert.ok(d.season.amount>=previous);previous=d.season.amount;samples.push({wallSeconds:(Date.now()-wallStart)/1000,...d});
  if(!cockpit&&d.season.seconds-start.season.seconds>28){await page.locator('[data-camera="1"]').click();cockpit=true;}
  if(captures.length<5&&d.season.seconds-start.season.seconds>=captures.length*15){const image=out+'/phase-'+captures.length+'.png';await page.screenshot({path:image,scale:'css'});captures.push({image,diagnostics:d});}
  assert.ok(Date.now()-wallStart<180000,'Season clock stalled');await page.waitForTimeout(1000);
 }
 const spring=await read();assert.equal(spring.season.amount,.88);assert.equal(spring.season.transitioning,false);assert.equal(spring.season.target,'spring');assert.ok(spring.state.distance-start.state.distance>250);assert.ok(spring.vehicleMirrors.active&&spring.vehicleMirrors.passes>0);
 await page.locator('#menu-button').click();await page.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__.state.paused);await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setSeason('winter',0));const paused=await read();assert.equal(paused.season.amount,.88);await page.waitForTimeout(400);assert.deepEqual((await read()).season,paused.season);
 await page.locator('#resume-button').click();await page.waitForFunction(s=>window.__THREE_GAME_DIAGNOSTICS__.season.seconds>s+5,paused.season.seconds,{timeout:30000});const winterStart=await read();assert.ok(winterStart.season.amount<.88&&winterStart.season.amount>.66);assert.equal(winterStart.season.target,'winter');await page.screenshot({path:out+'/winter-start.png',scale:'css'});assert.deepEqual(errors,[]);
 await writeFile(out+'/result.json',JSON.stringify({scope:'Internal source seasonal surface phase. Only initial season selection uses hook; normal-speed game clock drives60-second summer-to-spring transition, actual auto/cockpit UI and paused winter interruption/resume. Driving is never teleported or stepped by hooks. Host Android viewport, not physical-phone performance, flowers/year cycle or complete seasonal art acceptance.',module:await page.locator('script[type=module][src]').getAttribute('src'),start,spring,paused,winterStart,samples,captures,errors},null,2)+'\n');console.log(JSON.stringify({pass:true,seconds:spring.season.seconds-start.season.seconds,metres:spring.state.distance-start.state.distance,mirrorPasses:spring.vehicleMirrors.passes,samples:samples.length}));
}catch(error){await writeFile(out+'/failure.json',JSON.stringify({message:String(error),samples,captures,errors},null,2)+'\n');throw error;}
finally{await context.close();await browser.close();}
