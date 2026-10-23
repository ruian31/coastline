// Keyboard and Android multi-touch drive from the road onto real rendered terrain and back.
import{chromium,devices}from'@playwright/test';
import{createServer}from'vite';
import{mkdir,writeFile}from'node:fs/promises';
const rocky=process.env.OFFROAD_ROUTE==='rocks',label=process.env.OFFROAD_LABEL??`${rocky?'rocks':'drive'}-${Date.now()}`;
if(!/^[a-z0-9-]+$/.test(label))throw Error('OFFROAD_LABEL must contain lowercase letters, digits and hyphens');
const dir=`artifacts/offroad-${label}`;await mkdir(dir);
const server=await createServer({server:{middlewareMode:true},appType:'custom'}),{coast}=await server.ssrLoadModule('/src/world/roads.ts');
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']});
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
try{for(const mobile of(process.env.OFFROAD_DEVICE==='mobile'?[true]:process.env.OFFROAD_DEVICE==='desktop'?[false]:[false,true])){
 const name=mobile?'android-touch':'desktop-keyboard',context=await browser.newContext({...mobile?devices['Pixel 7']:{},viewport:mobile?{width:844,height:390}:{width:1280,height:720},recordVideo:{dir,size:mobile?{width:844,height:390}:{width:1280,height:720}}}),page=await context.newPage(),errors=[],samples=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.addInitScript(()=>{window.__coastObserved=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',e=>window.__coastObserved.push(e.detail));});
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:4188')+'/?test=1');await page.evaluate(rocky=>window.__THREE_GAME_TEST_HOOKS__.setState(rocky?'rock-drive-start':'offroad-start'),rocky);
 const cdp=mobile?await context.newCDPSession(page):null,buttons={};if(mobile)for(const action of['throttle','brake','left','right']){const box=await page.locator(`[data-drive="${action}"]`).boundingBox();buttons[action]={x:box.x+box.width/2,y:box.y+box.height/2};}
 let held=new Set(),touchHeld=[];const setInput=async desired=>{if(mobile){const points=actions=>actions.map(action=>({...buttons[action],id:['throttle','brake','left','right'].indexOf(action)+1}));if(desired.join(',')!==touchHeld.join(',')){if(touchHeld.length)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});if(desired.length)await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points(desired)});}touchHeld=desired;}else{const mapping={throttle:'KeyW',brake:'KeyS',left:'KeyA',right:'KeyD'},next=new Set(desired.map(a=>mapping[a]));for(const key of held)if(!next.has(key))await page.keyboard.up(key);for(const key of next)if(!held.has(key))await page.keyboard.down(key);held=next;}};
 const point=(t,offset,along=0)=>{const s=coast.sample(t);return{x:s.position.x+s.right.x*offset+s.tangent.x*along,z:s.position.z+s.right.z*offset+s.tangent.z*along};};
 const waypoints=rocky?[point(.78,-70),point(.827,-75),point(.78,-70),point(.78,-1.7)]:[point(.12,-65,24),point(.155,-1.7)];let waypoint=0,target=waypoints[0],phase='leave-road',maxDistance=0,finished=false,lastCapture=0;const started=Date.now();
 while(Date.now()-started<(rocky?110000:65000)){
  const sample=await page.evaluate(()=>{const d=window.__THREE_GAME_DIAGNOSTICS__,scene=window.__coastObserved.find(s=>s.isScene&&s.getObjectByName('road-network')),car=scene.getObjectByName('convertible-'+d.state.car);return{d,yaw:car.rotation.y,grass:{...scene.getObjectByName('Coastal landscape').userData.grassDetail}};});
  const{d,yaw}=sample,p=d.player.position,speed=d.player.speed;maxDistance=Math.max(maxDistance,d.state.roadDistance);
  if(waypoint<waypoints.length-1&&Math.hypot(p.x-target.x,p.z-target.z)<7){
   await setInput([]);await page.screenshot({path:`${dir}/${name}-waypoint-${waypoint}.png`});
   if(rocky&&waypoint===1){
    await setInput(['brake']);await page.waitForFunction(()=>Math.abs(window.__THREE_GAME_DIAGNOSTICS__.player.speed)<.35);await setInput([]);
    const size=page.viewportSize();for(const[view,delta]of[.2,-.4].entries()){
     await page.mouse.move(size.width*.55,size.height*.43);await page.mouse.down();await page.mouse.move(size.width*(.55+delta),size.height*.45,{steps:30});await page.mouse.up();await page.waitForTimeout(500);await page.screenshot({path:`${dir}/${name}-orbit-${view}.png`});
     const d=await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__);samples.push({seconds:(Date.now()-started)/1000,phase:'orbit',position:d.player.position,speed:d.player.speed,roadDistance:d.state.roadDistance,renderer:d.renderer});
    }
    await page.click(mobile?'[data-camera="0"]':'#recenter-button');
   }
   waypoint++;target=waypoints[waypoint];phase=waypoint===waypoints.length-1?'return':'inland';
  }
  if(phase==='return'&&d.state.roadDistance<3.4){finished=true;await setInput(['brake']);await page.waitForTimeout(600);await setInput([]);await page.screenshot({path:`${dir}/${name}-returned.png`});break;}
  const error=wrap(Math.atan2(target.x-p.x,target.z-p.z)-yaw),targetSpeed=Math.abs(error)>.65?4.5:8;
  const desired=[];if(error>.045)desired.push('left');if(error<-.045)desired.push('right');if(speed<targetSpeed-.15)desired.push('throttle');if(speed>targetSpeed+1.1)desired.push('brake');await setInput(desired);
  samples.push({seconds:(Date.now()-started)/1000,phase,position:p,speed,roadDistance:d.state.roadDistance,pitch:d.state.groundPitch,roll:d.state.groundRoll,hit:d.state.hit,renderer:d.renderer,grass:sample.grass,pressed:await page.locator('[data-drive].held').evaluateAll(elements=>elements.map(el=>el.dataset.drive))});
  if(Date.now()-lastCapture>7000){lastCapture=Date.now();await page.screenshot({path:`${dir}/${name}-${samples.length}.png`});console.log(JSON.stringify({name,phase,seconds:Math.round((Date.now()-started)/1000),roadDistance:d.state.roadDistance,speed}));}
  await page.waitForTimeout(90);
 }
 await setInput([]);await page.screenshot({path:`${dir}/${name}-last.png`});const video=page.video();await context.close();await video.saveAs(`${dir}/${name}.webm`);
 await writeFile(`${dir}/${name}.json`,JSON.stringify({finished,maxDistance,errors,samples},null,2));
 if(!finished||maxDistance<30||errors.length)throw Error(`${name}: off-road drive incomplete; see evidence`);
}}finally{await browser.close();await server.close();}
