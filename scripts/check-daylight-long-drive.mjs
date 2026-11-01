import assert from 'node:assert/strict';
import {chromium,devices} from 'playwright';
import {mkdir,writeFile,rename} from 'node:fs/promises';
const label=process.env.FULL_DAY_LABEL??'normal';assert.match(label,/^[a-z0-9-]+$/);const out='artifacts/daynight-m76-full-'+label;await mkdir(out);
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']}),context=await browser.newContext({...devices['Pixel 7'],viewport:{width:844,height:390},recordVideo:{dir:out,size:{width:844,height:390}}}),page=await context.newPage(),errors=[],points=[],actions=[];
let stop=false;for(const signal of['SIGINT','SIGTERM'])process.on(signal,()=>{stop=true;});
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(()=>localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true,daylight:'golden',daylightCycle:{hour:18.7,flow:true}})));
const read=()=>page.evaluate(()=>structuredClone(window.__THREE_GAME_DIAGNOSTICS__));
let result;
try{
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:5190')+'/?test=1');await page.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__?.daylight?.cycle&&!window.__THREE_GAME_DIAGNOSTICS__.daylight.loading);
 await page.locator('#start-auto').click();await page.locator('[data-camera="2"]').click();const start=await read(),began=Date.now(),module=await page.locator('script[type=module][src]').getAttribute('src');let previous=start.daylight.cycle.hour,advanced=0,nightAt=-1,dayAt=-1,requestedHill=false,sawHill=false,hillFinished=false,tunnelPasses=0,inTunnel=false;
 await page.evaluate(()=>{window.fullDayRaf=[];window.fullDayWatching=true;const sample=time=>{fullDayRaf.push(time);if(fullDayWatching)requestAnimationFrame(sample);};requestAnimationFrame(sample);});
 while(advanced<24&&!stop){
  await page.waitForTimeout(1000);const d=await read(),cycle=d.daylight.cycle;advanced+=(cycle.hour-previous+24)%24;previous=cycle.hour;
  assert.equal(d.state.running,true);assert.equal(d.state.paused,false);assert.equal(d.state.automatic,true);assert.equal(cycle.flow,true);assert.ok(cycle.cache.resident.length<=3);assert.deepEqual(errors,[]);assert.ok(Date.now()-began<2100000,'Full day exceeded35minutes');
  const tunnel=d.state.road==='coast'&&d.state.progress>.675&&d.state.progress<.742;if(tunnel&&!inTunnel)tunnelPasses++;inTunnel=tunnel;
  if(advanced>7&&nightAt<0){await page.locator('[data-camera="1"]').click();nightAt=advanced;actions.push({kind:'night-cockpit',advanced});}
  if(nightAt>=0&&nightAt<30&&advanced-nightAt>.3){await page.locator('[data-camera="2"]').click();actions.push({kind:'night-cinematic',advanced});nightAt=30;}
  if(advanced>17&&dayAt<0){await page.locator('[data-camera="1"]').click();dayAt=advanced;actions.push({kind:'day-cockpit',advanced});}
  if(dayAt>=0&&dayAt<30&&advanced-dayAt>.3){await page.locator('[data-camera="2"]').click();actions.push({kind:'day-cinematic',advanced});dayAt=30;}
  if(advanced>10&&!requestedHill){await page.locator('#junction-button').click();requestedHill=true;actions.push({kind:'request-hill',advanced});}
  if(d.state.road==='hill')sawHill=true;
  if(sawHill&&!hillFinished&&d.state.road==='coast'){const toggled=Boolean(d.state.preferHill);if(toggled)await page.locator('#junction-button').click();hillFinished=true;actions.push({kind:'return-coast',advanced,toggled});}
  points.push({wallSeconds:(Date.now()-began)/1000,advanced,hour:cycle.hour,frame:d.frame,elapsed:d.elapsed,position:d.player.position,speed:d.player.speed,road:d.state.road,progress:d.state.progress,distance:d.state.distance,camera:d.state.camera,score:d.score,cache:cycle.cache,lighting:d.lighting,renderer:d.renderer});
  if(points.length>30){const old=points.at(-31);assert.ok(d.state.distance-old.distance>2,'Cruise stalled for30seconds');}
  if(points.length%60===0){await writeFile(out+'/progress.json',JSON.stringify({module,advanced,wallSeconds:(Date.now()-began)/1000,points,actions,errors},null,2)+'\n');console.log(JSON.stringify({minute:Math.round((Date.now()-began)/60000),advanced,hour:cycle.hour,distance:d.state.distance,road:d.state.road,score:d.score,resident:cycle.cache.resident}));}
  if(points.length%300===0)await page.screenshot({path:out+'/minute-'+Math.round((Date.now()-began)/60000)+'.png',scale:'css'});
 }
 const end=await read(),raf=await page.evaluate(()=>{fullDayWatching=false;return fullDayRaf;});await writeFile(out+'/raf-timestamps.json',JSON.stringify({note:'Native RAF timestamps on host while recording video and periodic screenshots; not a phone/clean benchmark.',raf})+'\n');
 if(!stop){assert.ok(advanced>=24);assert.ok(end.state.distance-start.state.distance>10000);assert.ok(sawHill&&hillFinished);assert.ok(tunnelPasses>0);assert.ok(nightAt===30&&dayAt===30);}
 result={method:'Unmodified production clock at normal30min/day, actual start-auto/camera/junction UI inputs, original physics. No time multiplier, state/position/speed setter, synthetic visibility or scripted teleport. Android viewport on host. Full video and native RAF retained; periodic screenshots and observer add overhead, not phone FPS.',module,stopped:stop,start,end,advanced,wallSeconds:(Date.now()-began)/1000,sawHill,hillFinished,tunnelPasses,points,actions,errors};await page.screenshot({path:out+'/end.png',scale:'css'});await writeFile(out+'/result.json',JSON.stringify(result,null,2)+'\n');
}catch(error){await writeFile(out+'/failure.json',JSON.stringify({message:String(error),points,actions,errors,last:await read().catch(()=>null)},null,2)+'\n');throw error;}
finally{const video=page.video();await context.close();if(video)await rename(await video.path(),out+'/full-day.webm');await browser.close();}
console.log(JSON.stringify({complete:!stop,advanced:result.advanced,wallSeconds:result.wallSeconds,distance:result.end.state.distance-result.start.state.distance,tunnelPasses:result.tunnelPasses}));
