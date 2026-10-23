import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try {
 const {Driving,ROAD_POSITION_CLEARANCE}=await server.ssrLoadModule('/src/systems/Driving.ts');
 const {avoidCameraCollision}=await server.ssrLoadModule('/src/systems/CameraCollision.ts');
 const THREE=await server.ssrLoadModule('three');
 const {createDriver}=await server.ssrLoadModule('/src/vehicles/Driver.ts');
 for(const variant of[0,1,2]){
  const driver=createDriver(variant);driver.root.updateMatrixWorld(true);
  const eye=new THREE.Vector3(-.425,variant===2?1.25:1.29,-.43);
  for(const side of[-1,1]){
   const sleeveExit=new THREE.Vector3(-.425+side*.213,.938+(variant===2?-.035:0),-.265);
   const ray=new THREE.Raycaster(eye,sleeveExit.clone().sub(eye).normalize());
   const hit=ray.intersectObject(driver.root.getObjectByName('driver-forearms-and-hands'))[0];
   assert.ok(hit&&hit.point.distanceTo(sleeveExit)<.01,'cockpit must not see through an open forearm root');
  }
  driver.dispose();
 }
 const origin=new THREE.Vector3(0,2,0),camera=new THREE.Vector3(10,4,0);
 assert.ok(avoidCameraCollision(camera,origin,[{x:8,z:0,halfX:1,halfZ:2}],()=>0));assert.ok(camera.x<6.35,'camera boom stays in front of expanded wall');
 const slopeCamera=new THREE.Vector3(10,3,0);assert.ok(avoidCameraCollision(slopeCamera,origin,[],x=>x>5?5:0));assert.ok(slopeCamera.x<=5,'camera cannot look through rising hillside');
 const {CoastAudio}=await server.ssrLoadModule('/src/systems/CoastAudio.ts');
 const audio=new CoastAudio();audio.context={currentTime:.2,resume:async()=>{}};audio.noteTime=1.6;await audio.resume();assert.ok(audio.noteTime>=1.6,'resume preserves already scheduled music horizon');
 const {coast,hill}=await server.ssrLoadModule('/src/world/roads.ts');
 const empty={throttle:0,brake:0,steer:0,handbrake:false};
 const parked=new Driving();assert.ok(Math.abs(parked.position.y-coast.sample(.84).position.y-ROAD_POSITION_CLEARANCE)<1e-6,'teleport keeps the same road clearance as live physics');
 const loop=new Driving();loop.setAutomatic(true);let maxOffset=0;for(let i=0;i<60*220;i++){loop.update(1/60,empty);maxOffset=Math.max(maxOffset,loop.road.distance);assert.equal(loop.hit,false,'autopilot touched road boundary');}assert.ok(loop.distance>coast.length,'complete coastal loop');assert.ok(maxOffset<3,'autopilot stays on road');
 const branch=new Driving();branch.teleport(.282);branch.preferHill=true;branch.setAutomatic(true);let entered=false,returned=false;for(let i=0;i<60*150;i++){branch.update(1/60,empty);if(branch.route===hill)entered=true;else if(entered)returned=true;assert.equal(branch.hit,false,'branch autopilot touched boundary');}assert.ok(entered&&returned,'inland branch rejoins coastal loop');
 const reverse=new Driving();reverse.teleport(.668);reverse.yaw+=Math.PI;reverse.preferHill=true;reverse.setAutomatic(true);let reverseEntry=false,reverseReturn=false;for(let i=0;i<60*140;i++){reverse.update(1/60,empty);if(reverse.route===hill)reverseEntry=true;else if(reverseEntry)reverseReturn=true;}assert.ok(reverseEntry&&reverseReturn,'reverse route also traverses branch');
 const manual=new Driving();for(let i=0;i<60*4;i++)manual.update(1/60,{...empty,throttle:1});assert.ok(manual.speed>5,'throttle accelerates');const speed=manual.speed;for(let i=0;i<60;i++)manual.update(1/60,{...empty,handbrake:true});assert.ok(Math.abs(manual.speed)<speed,'handbrake reduces speed');manual.recover();assert.equal(manual.speed,0);assert.ok(Math.abs(manual.position.y-manual.road.sample.position.y-ROAD_POSITION_CLEARANCE)<1e-6,'recovery preserves road clearance');assert.ok(manual.road.distance<6,'recover on road');for(let i=0;i<60;i++)manual.update(1/60,{...empty,brake:1});assert.ok(manual.speed<-.5,'holding brake from rest engages low speed reverse');
 // Leave the real road onto a flat test field; distance must never clamp position.
 const free=new Driving();free.teleport(.12);const start=coast.sample(.12),level=start.position.y-.4;
 free.setTerrain(()=>level);free.yaw=Math.atan2(-start.right.x,-start.right.z);
 for(let i=0;i<60*12;i++)free.update(1/60,{...empty,throttle:1});
 assert.ok(free.road.distance>60,'manual driving explores land beyond the road');assert.equal(free.offroad,true);assert.equal(free.hit,false);
 assert.ok(Math.abs(free.position.y-level-ROAD_POSITION_CLEARANCE)<.01,'off-road support uses land, not nearest road elevation');
 const beforeCruise=free.position.clone();assert.equal(free.setAutomatic(true),false,'cruise cannot pull a remote car through scenery');assert.ok(free.position.equals(beforeCruise));
 // Support all four wheels on a real sloped plane far from any road.
 const base=free.position.clone();free.setTerrain((x,z)=>level+(x-base.x)*.13+(z-base.z)*.09);
 for(let i=0;i<120;i++)free.update(1/60,empty);
 const expected=level+(free.position.x-base.x)*.13+(free.position.z-base.z)*.09;
 assert.ok(Math.abs(free.position.y-expected-ROAD_POSITION_CLEARANCE)<.01,'tyres follow the sloped surface');assert.ok(Math.abs(free.pitch)+Math.abs(free.roll)>.1,'body follows terrain pitch and bank');
 // Stop at physical drops / raised walls, preserving the actual last safe position.
 for(const surface of[4,-4]){
  const obstacle=new Driving();obstacle.position.copy(base);obstacle.yaw=0;obstacle.setTerrain((x,z)=>z<base.z+5?level:level+surface);
  for(let i=0;i<60*6;i++)obstacle.update(1/60,{...empty,throttle:1});
  assert.ok(obstacle.position.z<base.z+5,'cannot jump onto a wall or drive over deep water');assert.ok(Math.abs(obstacle.position.y-level-ROAD_POSITION_CLEARANCE)<.01);
 }
 for(const [t,open]of[[.12,false],[.18,true]]){
  const rail=new Driving();rail.teleport(t);const road=coast.sample(t);rail.setTerrain(()=>road.position.y-.4);rail.yaw=Math.atan2(road.right.x,road.right.z);
  for(let i=0;i<60*6;i++)rail.update(1/60,{...empty,throttle:1});
  assert.ok(open?rail.road.offset>25:rail.road.offset<4.5,'physical guardrail spans stop the car; real gaps allow exploration');
 }
 console.log(JSON.stringify({passed:14,offroadDistance:Number(free.road.distance.toFixed(1)),coastalDistance:Math.round(loop.distance),coastalLength:Math.round(coast.length),maxOffset:Number(maxOffset.toFixed(3)),branchEntered:entered,branchReturned:returned,reverseBranch:reverseEntry&&reverseReturn},null,2));
}finally{await server.close();}
