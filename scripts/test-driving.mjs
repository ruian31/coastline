import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try {
 const {Driving}=await server.ssrLoadModule('/src/systems/Driving.ts');
 const {avoidCameraCollision}=await server.ssrLoadModule('/src/systems/CameraCollision.ts');
 const THREE=await server.ssrLoadModule('three');
 const origin=new THREE.Vector3(0,2,0),camera=new THREE.Vector3(10,4,0);
 assert.ok(avoidCameraCollision(camera,origin,[{x:8,z:0,halfX:1,halfZ:2}],()=>0));assert.ok(camera.x<6.35,'camera boom stays in front of expanded wall');
 const slopeCamera=new THREE.Vector3(10,3,0);assert.ok(avoidCameraCollision(slopeCamera,origin,[],x=>x>5?5:0));assert.ok(slopeCamera.x<=5,'camera cannot look through rising hillside');
 const {CoastAudio}=await server.ssrLoadModule('/src/systems/CoastAudio.ts');
 const audio=new CoastAudio();audio.context={currentTime:.2,resume:async()=>{}};audio.noteTime=1.6;await audio.resume();assert.ok(audio.noteTime>=1.6,'resume preserves already scheduled music horizon');
 const {coast,hill}=await server.ssrLoadModule('/src/world/roads.ts');
 const empty={throttle:0,brake:0,steer:0,handbrake:false};
 const loop=new Driving();loop.setAutomatic(true);let maxOffset=0;for(let i=0;i<60*220;i++){loop.update(1/60,empty);maxOffset=Math.max(maxOffset,loop.road.distance);assert.equal(loop.hit,false,'autopilot touched road boundary');}assert.ok(loop.distance>coast.length,'complete coastal loop');assert.ok(maxOffset<3,'autopilot stays on road');
 const branch=new Driving();branch.teleport(.282);branch.preferHill=true;branch.setAutomatic(true);let entered=false,returned=false;for(let i=0;i<60*150;i++){branch.update(1/60,empty);if(branch.route===hill)entered=true;else if(entered)returned=true;assert.equal(branch.hit,false,'branch autopilot touched boundary');}assert.ok(entered&&returned,'inland branch rejoins coastal loop');
 const reverse=new Driving();reverse.teleport(.668);reverse.yaw+=Math.PI;reverse.preferHill=true;reverse.setAutomatic(true);let reverseEntry=false,reverseReturn=false;for(let i=0;i<60*140;i++){reverse.update(1/60,empty);if(reverse.route===hill)reverseEntry=true;else if(reverseEntry)reverseReturn=true;}assert.ok(reverseEntry&&reverseReturn,'reverse route also traverses branch');
 const manual=new Driving();for(let i=0;i<60*4;i++)manual.update(1/60,{...empty,throttle:1});assert.ok(manual.speed>5,'throttle accelerates');const speed=manual.speed;for(let i=0;i<60;i++)manual.update(1/60,{...empty,handbrake:true});assert.ok(Math.abs(manual.speed)<speed,'handbrake reduces speed');manual.recover();assert.equal(manual.speed,0);assert.ok(manual.road.distance<6,'recover on road');for(let i=0;i<60;i++)manual.update(1/60,{...empty,brake:1});assert.ok(manual.speed<-.5,'holding brake from rest engages low speed reverse');
 console.log(JSON.stringify({passed:8,coastalDistance:Math.round(loop.distance),coastalLength:Math.round(coast.length),maxOffset:Number(maxOffset.toFixed(3)),branchEntered:entered,branchReturned:returned,reverseBranch:reverseEntry&&reverseReturn},null,2));
}finally{await server.close();}
