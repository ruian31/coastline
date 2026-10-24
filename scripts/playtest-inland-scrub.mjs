// Actual driving views and user camera orbit, including the open inland slope.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,devices} from 'playwright';
const label=process.env.SCRUB_LABEL;assert.match(label??'',/^[a-z0-9-]+$/);
const mobile=process.env.SCRUB_DEVICE==='mobile',out=`artifacts/inland-scrub-${label}`;await mkdir(out);
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']}),context=await browser.newContext({...mobile?devices['Pixel 7']:{},viewport:mobile?{width:844,height:390}:{width:1280,height:720},recordVideo:{dir:out,size:mobile?{width:844,height:390}:{width:1280,height:720}}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));window.scrubObjects=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',e=>scrubObjects.push(e.detail));});
try{
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:4191')+'/?test=1');const bundle=await page.locator('script[type=module][src]').getAttribute('src'),views=[];
 const capture=async name=>{await page.screenshot({path:`${out}/${name}.png`,scale:'css'});views.push({name,...await page.evaluate(()=>{const root=scrubObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape')).getObjectByName('Coastal landscape');return{renderer:window.__THREE_GAME_DIAGNOSTICS__.renderer,road:{...root.userData.scrubDetail},field:{...root.userData.fieldScrubDetail}};})});};
 for(const state of ['field-verge','grass-verge','rock-back','cinematic',...process.env.SCRUB_DETAIL==='1'?['scrub-field']:[]]){
  await page.evaluate(async state=>{const h=window.__THREE_GAME_TEST_HOOKS__;await h.setState(state);h.setPausedForScreenshot(true);h.setReducedMotion(true);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));},state);await capture(state);
  if(state==='field-verge'||state==='rock-back'){
   const size=page.viewportSize();await page.mouse.move(size.width*.55,size.height*.43);await page.mouse.down();await page.mouse.move(size.width*.22,size.height*.45,{steps:30});await page.mouse.up();await page.waitForTimeout(250);await capture(state+'-inland');
   await page.evaluate(state=>window.__THREE_GAME_TEST_HOOKS__.setState(state),state);
   await page.mouse.move(size.width*.85,size.height*.43);await page.mouse.down();await page.mouse.move(size.width*.85-Math.PI/.005,size.height*.43,{steps:50});await page.mouse.up();await page.waitForTimeout(700);await capture(state+'-reverse');
  }
 }
 const result={bundle,mobile,views,errors};await writeFile(`${out}/result.json`,JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify({out,...result}));assert.deepEqual(errors,[]);
}catch(error){await writeFile(`${out}/failure.json`,JSON.stringify({error:String(error),errors},null,2),{flag:'wx'});throw error;}finally{await context.close();await browser.close();}
