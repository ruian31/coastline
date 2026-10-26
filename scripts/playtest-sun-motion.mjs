import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,devices} from 'playwright';

const label=process.env.SUN_LABEL??String(Date.now()),mobile=process.env.SUN_DEVICE!=='desktop';assert.match(label,/^[a-z0-9-]+$/);
const startState=process.env.SUN_START_STATE??'tree-shadow';assert.ok(['tree-shadow','tunnel-exit'].includes(startState));
const dir=`artifacts/sun-motion-${label}`;await mkdir(dir);
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']});
const size=mobile?{width:844,height:390}:{width:1280,height:720};
const context=await browser.newContext({...mobile?devices['Pixel 7']:{},viewport:size,recordVideo:{dir,size}}),page=await context.newPage(),errors=[],samples=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(mobile=>{localStorage.setItem('coast-settings',JSON.stringify({quality:mobile?'low':'medium',muted:true}));window.sunObjects=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',e=>window.sunObjects.push(e.detail));},mobile);
try{
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:4191')+'/?test=1');await page.evaluate(state=>window.__THREE_GAME_TEST_HOOKS__.setState(state),startState);
 // Tunnel exit already cruises; the tree-shadow fixture starts parked.
 if(startState==='tree-shadow')await page.click('#auto-button');
 const bundle=await page.locator('script[type=module][src]').getAttribute('src');
 const started=Date.now();
 for(let second=0;second<18;second++){
  await page.waitForTimeout(1000);if(second===7)await page.click('[data-camera="1"]');if(second===12)await page.click('[data-camera="0"]');
  samples.push(await page.evaluate(()=>{const scene=window.sunObjects.find(o=>o.isScene&&o.userData.sunShadows);return{state:window.__THREE_GAME_DIAGNOSTICS__,sun:{...scene.userData.sunShadows}};}));
  if([0,6,10,17].includes(second))await page.screenshot({path:`${dir}/drive-${second}.png`,scale:'css'});
 }
 const duration=(Date.now()-started)/1000,video=page.video();await context.close();await video.saveAs(`${dir}/drive.webm`);
 assert.deepEqual(errors,[]);assert.ok(samples.at(-1).state.state.progress>samples[0].state.state.progress);assert.ok(samples.at(-1).state.state.distance>80);
 for(const sample of samples){assert.equal(sample.sun.bakes,1);if(mobile)assert.equal(sample.sun.localPasses,0);else assert.ok(sample.sun.localDraws>0);}
 const result={bundle,startState,mobile,duration,errors,samples};await writeFile(`${dir}/samples.json`,JSON.stringify(result,null,2));console.log(JSON.stringify({dir,bundle,startState,mobile,duration,progress:samples.at(-1).state.state.progress,distance:samples.at(-1).state.state.distance,errors}));
}finally{await context.close();await browser.close();}
