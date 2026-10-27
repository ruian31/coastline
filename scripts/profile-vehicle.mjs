import {chromium,devices} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const label=process.env.VEHICLE_LABEL;assert.match(label??'',/^[a-z0-9-]+$/);
const out='artifacts/vehicle-'+label,base=process.env.TEST_BASE_URL??'http://127.0.0.1:4191';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']}),reports=[];
try{
 for(const legacy of[true,false])for(const state of['camera-wall','tunnel']){
  const errors=[],context=await browser.newContext({...devices['Pixel 7'],viewport:{width:844,height:390}}),page=await context.newPage(),cdp=await context.newCDPSession(page);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true})));
  const start=performance.now();await page.goto(base+'/?test=1'+(legacy?'&physics=0':''),{waitUntil:'domcontentloaded'});await page.locator('#start-button').waitFor({state:'visible'});await page.waitForFunction(()=>!(document.getElementById('start-button')).disabled,{timeout:180000});const readyMs=performance.now()-start;
  const mainPath=await page.locator('script[type="module"][src]').getAttribute('src'),main=Buffer.from(await(await fetch(new URL(mainPath,base))).arrayBuffer()),mainSha256=createHash('sha256').update(main).digest('hex');
  await page.evaluate(async state=>{await window.__THREE_GAME_TEST_HOOKS__.setState(state);window.__THREE_GAME_TEST_HOOKS__.setPausedForScreenshot(false);},state);await page.waitForTimeout(1000);
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Performance.enable');await cdp.send('HeapProfiler.collectGarbage');await page.waitForTimeout(500);
  const metric=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
  const before=await metric(),heapBefore=await cdp.send('Runtime.getHeapUsage'),initial=await page.evaluate(()=>structuredClone(window.__THREE_GAME_DIAGNOSTICS__)),wall=performance.now();
  await page.waitForTimeout(8000);
  const after=await metric(),heapAfter=await cdp.send('Runtime.getHeapUsage'),final=await page.evaluate(()=>structuredClone(window.__THREE_GAME_DIAGNOSTICS__)),wallMs=performance.now()-wall,frames=final.frame-initial.frame;
  const delta=Object.fromEntries(['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration'].map(key=>[key,(after[key]-before[key])*1000]));
  const report={legacy,state,mainPath,mainSha256,readyMs,wallMs,frames,simulationSeconds:final.elapsed-initial.elapsed,deltaMilliseconds:delta,taskMsPerFrame:delta.TaskDuration/frames,heapBefore,heapAfter,initial,final,errors};reports.push(report);console.log(JSON.stringify({legacy,state,readyMs,frames,delta,heapAfter,errors}));
  assert.equal(Boolean(final.vehicle),!legacy);assert.deepEqual(errors,[]);await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});await page.screenshot({path:`${out}/${legacy?'legacy':'dynamic'}-${state}.png`});await context.close();
 }
 assert.equal(new Set(reports.map(r=>r.mainSha256)).size,1,'Control and candidate must use the same built main bundle');
 await writeFile(out+'/result.json',JSON.stringify({method:'Sequential independent Chrome Android844x390 low contexts on the same host GPU. Same final main bundle, test-gated physics=0 keeps legacy Driving; default loads Rapier. Startup readyMs is unthrottled and includes scene/assets/shader readiness, not an isolated engine cost. Runtime uses4x CPU throttle, one8s interval after setup/GC; camera-wall is parked manual physics, tunnel is live cruise. Actual start/end poses and render counts are retained because dynamic suspension/path tracking can change the view. CDP Task/Script durations and Runtime heap including optional backingStorageSize are raw observations, not real OnePlus/iPhone FPS or isolated exact solver timing. No concurrent GPU or heavy CPU tasks.',base,reports},null,2)+'\n');
}finally{await browser.close();}
