// Actual keyboard/touch driving, then an unpaused grass recovery interval.
// Ambient wind is held steady to make the pressure/rebound easier to inspect.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,devices} from 'playwright';
const label=process.env.VEGETATION_LABEL;assert.match(label??'',/^[a-z0-9-]+$/);const out=`artifacts/vegetation-${label}`,mobile=process.env.VEGETATION_DEVICE!=='desktop';await mkdir(out);
const ages=(process.env.VEGETATION_RECOVERY_AGES??'0,20,45,65').split(',').map(Number);assert.ok(ages.length>1&&ages[0]===0&&ages.every((a,i)=>Number.isFinite(a)&&a>=0&&a<=120&&(i===0||a>ages[i-1])));
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']}),context=await browser.newContext({...mobile?devices['Pixel 7']:{},viewport:mobile?{width:844,height:390}:{width:1280,height:720},recordVideo:{dir:out,size:mobile?{width:844,height:390}:{width:1280,height:720}}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));window.vegetationObjects=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',e=>vegetationObjects.push(e.detail));});
const cdp=mobile?await context.newCDPSession(page):null;let held=[];
const input=async(actions)=>{
 if(cdp){if(held.length)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});const points=[];for(const [i,action]of actions.entries()){const box=await page.locator(`[data-drive="${action}"]`).boundingBox();assert.ok(box);points.push({id:i+1,x:box.x+box.width/2,y:box.y+box.height/2,radiusX:6,radiusY:6,force:1});}if(points.length)await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});}
 else{const keys={throttle:'ArrowUp',brake:'ArrowDown',right:'ArrowRight',left:'ArrowLeft'};for(const a of held)if(!actions.includes(a))await page.keyboard.up(keys[a]);for(const a of actions)if(!held.includes(a))await page.keyboard.down(keys[a]);}held=actions;
};
const read=()=>page.evaluate(()=>{const scene=vegetationObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape')),root=scene.getObjectByName('Coastal landscape'),renderer=vegetationObjects.find(o=>o.isWebGLRenderer),canopy=root.getObjectByName('World anchored dry grass canopy'),uniforms=renderer.properties.get(canopy.material).uniforms,map=uniforms.uPlantPressure.value,data=map.image.data;let deep=0,soft=0;for(let i=0;i<data.length;i+=4){if(data[i]>204)deep++;else if(data[i]>16)soft++;}return{...window.__THREE_GAME_DIAGNOSTICS__,interaction:{...root.userData.vegetationInteraction,deep,soft,time:uniforms.uPlantTime.value}};});
const until=async(test,timeout=20000)=>{const end=Date.now()+timeout;while(Date.now()<end){const d=await read();if(test(d))return d;await page.waitForTimeout(100);}throw Error('Actual input/time progression timed out');};
try{
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:4191')+'/?test=1');await page.evaluate(async()=>{await window.__THREE_GAME_TEST_HOOKS__.setState('bank-inland');window.__THREE_GAME_TEST_HOOKS__.setReducedMotion(true);});
 const bundle=await page.locator('script[type=module][src]').getAttribute('src'),start=await read();await page.screenshot({path:out+'/before.png',scale:'css'});
 // Raise the ordinary orbit camera through real pointer input.
 await page.mouse.move(600,150);await page.mouse.down();await page.mouse.move(600,220,{steps:20});await page.mouse.up();
 await input(['throttle']);await until(d=>Math.hypot(d.player.position.x-start.player.position.x,d.player.position.z-start.player.position.z)>3);
 await page.screenshot({path:out+'/moving-straight.png',scale:'css'});
 await input(['throttle','right']);const turn=await until(d=>d.state.steer<-.5);await page.waitForTimeout(700);await page.screenshot({path:out+'/moving-turn.png',scale:'css'});await input(['throttle']);await until(d=>Math.hypot(d.player.position.x-start.player.position.x,d.player.position.z-start.player.position.z)>8);
 await input(['brake']);await until(d=>d.player.speed<.3);await input([]);const forward=await read();await page.screenshot({path:out+'/forward-tracks.png',scale:'css'});
 // Reverse over part of the same path; input release must stop fresh movement.
 await input(['brake']);await until(d=>d.player.speed<-.8);await page.waitForTimeout(700);await input(['throttle']);await until(d=>d.player.speed>-.3);await input([]);await until(d=>Math.abs(d.player.speed)<.1);const reversed=await read();
 await page.screenshot({path:out+'/reverse-tracks.png',scale:'css'});
 const recovery=[];for(const age of ages){const d=age===0?await read():await until(d=>d.elapsed-reversed.elapsed>=age,90000);recovery.push({age,elapsed:d.elapsed,position:d.player.position,interaction:d.interaction,renderer:d.renderer});await page.screenshot({path:`${out}/recovery-${age}.png`,scale:'css'});console.log(JSON.stringify({phase:'recovery',age,elapsed:d.elapsed,deep:d.interaction.deep,cached:d.interaction.cachedCells}));}
 const result={bundle,mobile,method:`Actual touch/keyboard forward, steer, brake and reverse, followed by ${ages.at(-1)} seconds of unpaused simulation; ambient wind held steady, pressure time advances normally`,start,turn,forward,reversed,recovery,errors};await writeFile(out+'/result.json',JSON.stringify(result,null,2),{flag:'wx'});
 assert.ok(forward.interaction.deep>start.interaction.deep);assert.ok(forward.interaction.uploads>start.interaction.uploads);assert.ok(turn.state.steer<-.5);assert.ok(reversed.interaction.time>forward.interaction.time);assert.ok(recovery.at(-1).elapsed-reversed.elapsed>=ages.at(-1));assert.deepEqual(errors,[]);
 const video=page.video();await context.close();await video.saveAs(out+'/driving-and-recovery.webm');
}finally{await browser.close();}
