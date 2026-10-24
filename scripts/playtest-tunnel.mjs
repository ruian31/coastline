// Drive through the real tunnel, switch views through the real controls, and
// independently raycast the rendered headland/lining above the road corridor.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium,devices} from 'playwright';
import {createServer} from 'vite';
const label=process.env.TUNNEL_LABEL;assert.match(label??'',/^[a-z0-9-]+$/);
const mobile=process.env.TUNNEL_DEVICE==='mobile',out=`artifacts/tunnel-${label}`;await mkdir(out);
const server=await createServer({server:{middlewareMode:true},appType:'custom'}),{coast}=await server.ssrLoadModule('/src/world/roads.ts');
const points=[];for(let i=0;i<=32;i++){const t=.677+i/32*.062,s=coast.sample(t);for(const lateral of [-4.3,0,4.3]){const p=s.position.clone().addScaledVector(s.right,lateral);points.push({t,lateral,x:p.x,y:s.position.y+1,z:p.z});}}
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']}),size=mobile?{width:844,height:390}:{width:1280,height:720},context=await browser.newContext({...mobile?devices['Pixel 7']:{},viewport:size,recordVideo:{dir:out,size}}),page=await context.newPage(),errors=[],samples=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
for(const file of ['three.module.js','three.core.js'])await page.route(`**/__qa/${file}`,r=>r.fulfill({path:path.resolve('node_modules/three/build',file),contentType:'text/javascript'}));
await page.addInitScript(mobile=>{localStorage.setItem('coast-settings',JSON.stringify({quality:mobile?'low':'medium',muted:true}));window.tunnelObjects=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',e=>tunnelObjects.push(e.detail));},mobile);
try{
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:4191')+'/?test=1');await page.evaluate(async()=>{await window.__THREE_GAME_TEST_HOOKS__.setState('tunnel-approach');window.__THREE_GAME_TEST_HOOKS__.setPausedForScreenshot(true);});
 const bundle=await page.locator('script[type=module][src]').getAttribute('src');
 const clearance=await page.evaluate(async points=>{
  const T=await import('/__qa/three.module.js'),scene=tunnelObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape')),names=['Eroded headland over the mountain tunnel','Dim tunnel lining','Headland tunnel limestone'],material=new T.MeshBasicMaterial({side:T.DoubleSide}),meshes=names.map(name=>{const source=scene.getObjectByName(name);if(!source)throw Error('Missing actual tunnel surface '+name);const mesh=new T.Mesh(source.geometry,material);mesh.matrixAutoUpdate=false;mesh.matrix.copy(source.matrixWorld);mesh.updateMatrixWorld(true);return mesh;}),ray=new T.Raycaster(),samples=[];
  try{for(const p of points){ray.set(new T.Vector3(p.x,p.y,p.z),new T.Vector3(0,1,0));const hit=ray.intersectObjects(meshes)[0];samples.push({...p,headroomAboveEye:hit?.distance??null});}return samples;}finally{material.dispose();}
 },points);
 await writeFile(`${out}/clearance.json`,JSON.stringify(clearance,null,2),{flag:'wx'});
 const interior=clearance.filter(p=>p.t>.681&&p.t<.734);
 assert.ok(interior.length>60&&interior.every(p=>p.headroomAboveEye!==null),'the actual tunnel roof must exist throughout the interior');
 for(const p of clearance)if(p.headroomAboveEye!==null)assert.ok(p.headroomAboveEye>1.6,'headland/lining intrudes into car corridor at '+JSON.stringify(p));
 await page.screenshot({path:`${out}/approach.png`,scale:'css'});await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setPausedForScreenshot(false));
 const started=Date.now(),captured=new Set();let cockpit=false,chase=false;
 while(Date.now()-started<24000){
  const d=await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__),t=d.state.progress;
  if(t>.685&&!cockpit){await page.click('[data-camera="1"]');cockpit=true;}
  if(t>.731&&!chase){await page.click('[data-camera="0"]');chase=true;}
  samples.push({seconds:(Date.now()-started)/1000,...d});
  for(const [name,threshold] of [['entry',.683],['cabin',.710],['reveal',.7375],['coast',.747]])if(t>threshold&&!captured.has(name)){await page.screenshot({path:`${out}/${name}.png`,scale:'css'});captured.add(name);}
  if(t>.747)break;await page.waitForTimeout(100);
 }
 await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setPausedForScreenshot(true));
 await page.mouse.move(size.width*.1,size.height*.57);await page.mouse.down();await page.mouse.move(size.width*.1+Math.PI/.005,size.height*.57,{steps:45});await page.mouse.up();await page.waitForTimeout(1000);await page.screenshot({path:`${out}/portal-back.png`,scale:'css'});
 const result={bundle,mobile,seconds:(Date.now()-started)/1000,cockpit,chase,captured:[...captured],errors,samples};await writeFile(`${out}/result.json`,JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify({out,bundle,mobile,seconds:result.seconds,captured:result.captured,end:samples.at(-1)?.state.progress,clearanceSamples:clearance.length,minimumHeadroom:Math.min(...clearance.filter(p=>p.headroomAboveEye!==null).map(p=>p.headroomAboveEye)),errors}));
 assert.deepEqual(errors,[]);assert.equal(captured.size,4);assert.ok(samples.at(-1).state.progress>.747);assert.ok(samples.every(s=>!s.state.hit&&!s.state.offroad));assert.ok(samples.filter(s=>s.state.camera===1).every(s=>s.cameraRig.cockpitEyeError<.01));
}catch(error){await writeFile(`${out}/failure.json`,JSON.stringify({error:String(error),errors,samples},null,2),{flag:'wx'});throw error;}finally{await context.close();await browser.close();await server.close();}
