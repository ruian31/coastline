// Closed-loop keyboard playtest. Route math chooses keys; gameplay state is never teleported or edited.
import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
const dir='artifacts/manual-route';await mkdir(dir,{recursive:true});
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
const {coast,hill,nearestRoad}=await server.ssrLoadModule('/src/world/roads.ts');
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.__coastObserved=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',e=>window.__coastObserved.push(e.detail));});
await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:4188')+'/?test=1');await page.click('#start-button');
const held=new Set(),key=async(code,value)=>{if(value&&!held.has(code)){held.add(code);await page.keyboard.down(code);}else if(!value&&held.has(code)){held.delete(code);await page.keyboard.up(code);}};
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));let phase='coastal-loop',maxOffset=0,lap=false,visitedTown=false,enteredHill=false,returned=false,finished=false,frames=0,started=Date.now(),lastCapture=0;const samples=[];
try{
 while(Date.now()-started<330000){
  const sample=await page.evaluate(()=>{const d=window.__THREE_GAME_DIAGNOSTICS__;const scene=window.__coastObserved.find(s=>s.isScene&&s.getObjectByName('road-network'));const car=scene?.getObjectByName('convertible-'+d.state.car);return {d,yaw:car?.rotation.y};});
  const {d,yaw}=sample,p=d.player.position,loc=nearestRoad(p.x,p.z),speed=d.player.speed;
  maxOffset=Math.max(maxOffset,loc.distance);
  if(phase==='coastal-loop'&&d.state.progress>.34&&d.state.progress<.41&&!visitedTown){visitedTown=true;await page.screenshot({path:dir+'/manual-town.png'});}
  if(phase==='coastal-loop'&&d.state.distance>coast.length*.98&&loc.t>.835&&loc.t<.86){lap=true;phase='approach-branch';console.log(JSON.stringify({event:'coastal-lap',distance:d.state.distance,maxOffset,visitedTown}));}
  if(phase==='approach-branch'&&loc.route===coast&&loc.t>.277&&loc.t<.31){phase='hill';await page.screenshot({path:dir+'/junction-entry.png'});}
  const route=phase==='hill'?hill:coast,project=route===loc.route?loc:nearestRoad(p.x,p.z,route);
  if(phase==='hill'&&loc.route===hill){enteredHill=true;if(project.t>.985){phase='return';}}
  if(phase==='return'&&loc.route===coast&&loc.t>.655&&loc.t<.70){returned=true;finished=true;await page.screenshot({path:dir+'/junction-return.png'});samples.push(sample);break;}
  const ahead=8+Math.abs(speed)*.55,t=project.t+ahead/route.length,target=route.sample(t).position;
  const error=wrap(Math.atan2(target.x-p.x,target.z-p.z)-yaw),targetSpeed=Math.abs(error)>.4?7:12.5;
  await key('KeyA',error>.025);await key('KeyD',error<-.025);await key('KeyW',speed<targetSpeed-.2);await key('KeyS',speed>targetSpeed+1.4);
  samples.push({time:(Date.now()-started)/1000,phase,x:p.x,z:p.z,speed,offset:loc.distance,t:loc.t,route:loc.route.id,error,cameraError:d.cameraRig?.cockpitEyeError,fps:d.state.fps});frames++;
  if(Date.now()-lastCapture>10000){lastCapture=Date.now();console.log(JSON.stringify({phase,seconds:Math.round((Date.now()-started)/1000),distance:Math.round(d.state.distance),route:loc.route.id,t:Number(loc.t.toFixed(3)),maxOffset:Number(maxOffset.toFixed(2))}));}
  await page.waitForTimeout(110);
 }
}finally{for(const code of [...held])await key(code,false);await writeFile(dir+'/metrics.json',JSON.stringify({finished,lap,visitedTown,enteredHill,returned,maxOffset,seconds:(Date.now()-started)/1000,errors,samples},null,2));await browser.close();await server.close();}
if(!finished||!lap||!visitedTown||!enteredHill||!returned||errors.length)throw Error('Manual route evidence incomplete; see metrics.json');
console.log(JSON.stringify({finished,lap,visitedTown,enteredHill,returned,maxOffset,frames}));
