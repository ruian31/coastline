import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,devices} from 'playwright';

const label=process.env.WEATHER_DRIVE_LABEL;assert.match(label??'',/^[a-z0-9-]+$/);
const out='artifacts/weather-drive-'+label;await mkdir(out);
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']});
const context=await browser.newContext({...devices['Pixel 7'],viewport:{width:844,height:390},recordVideo:{dir:out,size:{width:844,height:390}}});
const page=await context.newPage(),errors=[],samples=[],captures=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const read=()=>page.evaluate(()=>structuredClone(window.__THREE_GAME_DIAGNOSTICS__));
await page.addInitScript(()=>localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:false,music:false})));
try{
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:4217')+'/?test=1');
 await page.waitForFunction(()=>!document.querySelector('#start-auto').disabled,{timeout:60000});
 await page.locator('#start-auto').click();await page.locator('#menu-button').click();
 await page.locator('#time-flow').check();await page.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__?.daylight?.cycle?.flow,{timeout:60000});
 await page.locator('#weather-select').selectOption('drizzle');await page.locator('#resume-button').click();await page.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__.state.paused===false);
 const start=await read(),wallStart=Date.now();let cabin=false;
 while((await read()).weather.seconds<start.weather.seconds+46){
  const d=await read();assert.equal(d.state.paused,false);samples.push({wallSeconds:(Date.now()-wallStart)/1000,...d});
  if(!cabin&&d.weather.seconds-start.weather.seconds>24){await page.locator('[data-camera="1"]').click();cabin=true;}
  if(captures.length<4&&d.weather.seconds-start.weather.seconds>captures.length*14){const file=out+'/rain-'+captures.length+'.png';await page.screenshot({path:file,scale:'css'});captures.push({file,phaseWallSeconds:(Date.now()-wallStart)/1000,diagnostics:d});}
  assert.ok(Date.now()-wallStart<180000,'Normal weather clock stalled');await page.waitForTimeout(1000);
 }
 const rainy=await read();assert.equal(rainy.weather.target,'drizzle');assert.equal(rainy.weather.transitioning,false);assert.equal(rainy.weather.rain,.72);assert.ok(rainy.weather.wetness>.15);assert.ok(rainy.weather.drizzle.active);assert.ok(rainy.weather.audio.gain>0);assert.ok(rainy.vehicleMirrors.active);assert.ok(rainy.vehicleMirrors.passes>0);assert.ok(rainy.state.distance-start.state.distance>150);assert.ok(rainy.daylight.cycle.hour>start.daylight.cycle.hour);
 // Native Android-style touch input, with game time and speed left untouched.
 await page.locator('[data-camera="0"]').click();const cdp=await context.newCDPSession(page),pedal=await page.locator('[data-drive="throttle"]').boundingBox();
 const touch={x:pedal.x+pedal.width/2,y:pedal.y+pedal.height/2,radiusX:8,radiusY:8,id:1};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch]});await page.waitForTimeout(2500);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const manual=await read();assert.equal(manual.state.automatic,false);assert.ok(manual.vehicle.wetness>0);await page.locator('#auto-button').click();
 await page.locator('#menu-button').click();await page.locator('#weather-select').selectOption('clear');await page.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__.state.paused);const paused=await read();await page.waitForTimeout(400);assert.equal((await read()).weather.seconds,paused.weather.seconds);await page.locator('#resume-button').click();
 await page.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__.state.paused===false);const dryStart=await read();await page.waitForFunction(s=>window.__THREE_GAME_DIAGNOSTICS__.weather.seconds>s+20,dryStart.weather.seconds,{timeout:90000});const drying=await read();assert.ok(drying.weather.rain>0&&drying.weather.rain<.72);assert.ok(drying.weather.wetness>0);await page.screenshot({path:out+'/clearing.png',scale:'css'});
 assert.deepEqual(errors,[]);await writeFile(out+'/result.json',JSON.stringify({scope:'Normal-speed actual UI selection, time flow and auto-drive for46 active weather seconds; cockpit mirrors, native CDP Android touch takeover, paused clock and20-second clearing. No weather/drive hooks called. Host GPU mobile emulation, not physical phone FPS or full weather journey acceptance.',module:await page.locator('script[type=module][src]').getAttribute('src'),start,rainy,manual,paused,drying,samples,captures,errors},null,2)+'\n');console.log(JSON.stringify({pass:true,activeSeconds:rainy.weather.seconds-start.weather.seconds,metres:rainy.state.distance-start.state.distance,samples:samples.length,rainWet:rainy.weather.wetness,mirrorPasses:rainy.vehicleMirrors.passes}));
}catch(error){await writeFile(out+'/failure.json',JSON.stringify({message:String(error),samples,captures,errors},null,2)+'\n');throw error;}
finally{await context.close();await browser.close();}
