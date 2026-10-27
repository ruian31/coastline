import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const out=process.env.VEHICLE_REPORT_DIR??'artifacts/vehicle-m61-cpu';await mkdir(out,{recursive:true});
const server=await createServer({configFile:false,server:{middlewareMode:true,watch:null},appType:'custom',logLevel:'error'});
try{
 const THREE=await server.ssrLoadModule('three'),{VehicleDynamics,VEHICLE_PROFILES}=await server.ssrLoadModule('/src/systems/VehicleDynamics.ts');
 const DT=1/60,EMPTY={throttle:0,brake:0,steer:0,handbrake:false},reports=[];
 const level=()=>0,uneven=(x,z)=>.09*Math.sin(2*Math.PI*z/3.5)+.045*Math.sin(2*Math.PI*x/5+.6)+.035*Math.sin(2*Math.PI*(x+z)/2.4),oneWheel=(x,z)=>.08*Math.exp(-(((x+.845)/.4)**2+((z-6)/1.2)**2));
 function floor(ground){
  if(ground===level)return new THREE.PlaneGeometry(400,400).rotateX(-Math.PI/2);
  const nx=80,nz=420,spacing=.25,p=[],indices=[];
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=-10+i*spacing,z=-5+j*spacing;p.push(x,ground(x,z),z);}
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;indices.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(indices);return g;
 }
 const quaternion=new THREE.Quaternion(),euler=new THREE.Euler(0,0,0,'YXZ'),point=new THREE.Vector3();
 const scenarios=[
  {id:'flat-coast',seconds:8,ground:level,speed:12,input:()=>EMPTY},
  {id:'flat-brake',seconds:4,ground:level,speed:12,input:()=>({...EMPTY,brake:1}),automatic:true},
  {id:'steer-release',seconds:6,ground:level,speed:12,input:t=>({...EMPTY,steer:t<1?1:0})},
  {id:'small-undulations-12',seconds:8,ground:uneven,speed:12,input:()=>EMPTY},
  {id:'small-undulations-6',seconds:8,ground:uneven,speed:6,input:()=>EMPTY},
  {id:'one-wheel-bump',seconds:6,ground:oneWheel,speed:4,input:t=>t<3?EMPTY:{...EMPTY,brake:1},automatic:true},
  {id:'acceleration',seconds:8,ground:level,speed:0,input:()=>({...EMPTY,throttle:1})},
  {id:'reverse-forward',seconds:10,ground:level,speed:0,input:t=>({...EMPTY,brake:t<4?1:0,throttle:t>=4?1:0})},
  {id:'solid-wall',seconds:4,ground:level,speed:28,input:()=>({...EMPTY,throttle:1}),wall:true},
 ];
 for(let model=0;model<3;model++)for(const scenario of scenarios){
  const geometry=floor(scenario.ground),primitives=scenario.wall?[{position:new THREE.Vector3(0,1,12),halfSize:new THREE.Vector3(8,1,.2)}]:[],car=await VehicleDynamics.create([{geometry}],primitives,model);
  try{
   car.reset(new THREE.Vector3(0,.22,0),quaternion.identity());
   for(let i=0;i<180;i++)car.update(DT,EMPTY);
   assert.ok(Math.abs(car.diagnostics.mass-VEHICLE_PROFILES[model].mass)<.1,'Declared physical mass');
   if(scenario.ground===level){assert.equal(car.wheels.filter(w=>w.contact).length,4);assert.ok(Math.abs(car.position.y)<.025,'Chassis settles over its four springs');}
   car.reset(car.position,car.rotation,scenario.speed);
   const initial=car.position.clone(),samples=[];let travelled=0,previous=initial.clone(),firstStop=null;
   for(let i=0;i<scenario.seconds/DT;i++){
    const input=scenario.input(i*DT);car.update(DT,input,false,scenario.automatic??false);euler.setFromQuaternion(car.rotation,'YXZ');travelled+=car.position.distanceTo(previous);previous.copy(car.position);
    if(!firstStop&&scenario.speed>0&&car.speed<=.2)firstStop={time:(i+1)*DT,travelled};
    const wheels=car.wheels.map(w=>{point.copy(w.position);point.y-=.338;point.applyQuaternion(car.rotation).add(car.position);return{length:w.length,force:w.force,contact:w.contact,localCentre:w.position.toArray(),rotation:w.rotation,steering:w.steering,worldBottom:point.toArray(),groundY:scenario.ground(point.x,point.z),visualError:point.y-scenario.ground(point.x,point.z)};});
    const sample={time:(i+1)*DT,input,position:car.position.toArray(),rotation:car.rotation.toArray(),velocity:car.velocity.toArray(),speed:car.speed,lateralSpeed:car.lateralSpeed,steeringAngle:car.steeringAngle,yaw:euler.y,pitch:euler.x,roll:euler.z,wheels};
    assert.ok([...sample.position,...sample.rotation,...sample.velocity,sample.speed,...wheels.flatMap(w=>[w.length,w.force,w.visualError])].every(Number.isFinite),'Finite body and spring state');samples.push(sample);
   }
   const absoluteContactErrors=samples.flatMap(s=>s.wheels.filter(w=>w.contact).map(w=>Math.abs(w.visualError))).sort((a,b)=>a-b);
   const summary={model,mass:car.diagnostics.mass,scenario:scenario.id,initialSpeed:scenario.speed,finalSpeed:car.speed,speedAt2:samples[119].speed,firstStop,travelled,netXZ:Math.hypot(car.position.x-initial.x,car.position.z-initial.z),maximumLateralSpeed:Math.max(...samples.map(s=>Math.abs(s.lateralSpeed))),yawAt1:samples[59].yaw,maxAbsRoll:Math.max(...samples.map(s=>Math.abs(s.roll))),maxAbsPitch:Math.max(...samples.map(s=>Math.abs(s.pitch))),contacts:samples.flatMap(s=>s.wheels).filter(w=>w.contact).length,wheelSamples:samples.length*4,visualContactErrorP95:absoluteContactErrors[Math.floor((absoluteContactErrors.length-1)*.95)],visualContactErrorMax:absoluteContactErrors.at(-1),maxLeftRightLengthDifference:Math.max(...samples.flatMap(s=>[Math.abs(s.wheels[0].length-s.wheels[1].length),Math.abs(s.wheels[2].length-s.wheels[3].length)])),finalPosition:car.position.toArray(),finalWheelLengthSpread:Math.max(...car.wheels.map(w=>w.length))-Math.min(...car.wheels.map(w=>w.length))};
   if(scenario.id==='flat-coast'){assert.ok(summary.speedAt2>10.5&&summary.speedAt2<12);assert.ok(summary.visualContactErrorP95<.01);}
   if(scenario.id==='flat-brake'){assert.ok(firstStop&&firstStop.time>1.2&&firstStop.time<3.5);assert.ok(firstStop.travelled>7&&firstStop.travelled<20);assert.ok(Math.abs(car.speed)<.1);}
   if(scenario.id==='steer-release'){assert.ok(summary.maximumLateralSpeed>.1,'Body motion can differ from heading');assert.ok(summary.yawAt1>.1&&summary.yawAt1<1.5);assert.ok(Math.abs(car.steeringAngle)<.001);assert.ok(car.speed>6);}
   if(scenario.id==='small-undulations-12'){assert.ok(summary.netXZ>30,'Continuous small undulations must not cause an internal-edge crash');assert.ok(summary.maxAbsRoll<.5&&summary.maxAbsPitch<.5);}
   if(scenario.id==='one-wheel-bump'){assert.ok(summary.maxLeftRightLengthDifference>.015,'Independent left/right spring travel');assert.ok(summary.finalWheelLengthSpread<.012,'Spring motion settles after passing the bump');}
   if(scenario.id==='reverse-forward'){assert.ok(samples[239].speed<-.5,'Held brake can deliberately engage reverse after the pause');assert.ok(car.speed>5,'Throttle brakes reverse motion then accelerates forward');}
   if(scenario.wall){assert.ok(car.position.z<10.2,'Chassis stops before solid wall rather than tunnelling through');assert.ok(summary.netXZ<11);}
   reports.push(summary);await writeFile(`${out}/${model}-${scenario.id}.json`,JSON.stringify({summary,samples},null,2)+'\n');
  }finally{car.dispose();geometry.dispose();}
 }
 const acceleration=reports.filter(r=>r.scenario==='acceleration');assert.ok(acceleration[1].speedAt2>acceleration[0].speedAt2+.5&&acceleration[2].speedAt2>acceleration[1].speedAt2+.5,'Actual acceleration distinguishes the three profiles');
 const {Driving}=await server.ssrLoadModule('/src/systems/Driving.ts'),raisedGeometry=new THREE.PlaneGeometry(4000,4000).rotateX(-Math.PI/2).translate(0,2,0),raised=await VehicleDynamics.create([{geometry:raisedGeometry}]);let placement;
 try{const driving=new Driving();driving.setTerrain(()=>2);driving.position.set(1200,.035,1200);driving.yaw=0;driving.pitch=0;driving.roll=0;driving.setDynamics(raised);
  const corrected=driving.position.toArray();let middle,maximumY=-Infinity;for(let i=0;i<120;i++){driving.update(DT,EMPTY);maximumY=Math.max(maximumY,driving.position.y);if(i===59)middle=driving.position.clone();}
  placement={method:'Actual Driving reset starts at the obsolete zero-height terrain pose over a physical floor at2m; the same floor height is supplied by the terrain/support callback, then120 real fixed steps. Checks actual height and last-second pose drift, rather than requiring a post-solver instantaneous velocity of zero. This isolates buried-spawn prevention from camera assertions.',corrected,after:driving.position.toArray(),maximumY,lastSecondDrift:driving.position.distanceTo(middle),velocity:raised.velocity.toArray(),contacts:raised.wheels.map(w=>w.contact)};
  await writeFile(`${out}/placement.json`,JSON.stringify(placement,null,2)+'\n');
  assert.ok(corrected[1]>=2.03);assert.ok(driving.position.y>2.02&&driving.position.y<2.08);assert.ok(maximumY<2.135);assert.ok(placement.lastSecondDrift<.01);assert.equal(placement.contacts.filter(Boolean).length,4);
 }finally{raised.dispose();raisedGeometry.dispose();}
 const source=await readFile('src/systems/VehicleDynamics.ts'),drivingSource=await readFile('src/systems/Driving.ts');await writeFile(`${out}/result.json`,JSON.stringify({method:'CPU invokes exact VehicleDynamics source through Vite SSR, no browser or renderer. One chassis and four spring-ray tyres, fixed1/60, 3s settle then controlled initial speed. Actual acceleration/reverse inputs are separately labelled. Flat plane, .25m triangulated analytic undulations/one-wheel bump, primitive wall. Wheel gap estimates post-step body plus pre-step ray length, with no visual correction; airborne samples are excluded from contact-gap percentiles and counted explicitly. No real-device performance claim.',sourceSha256:createHash('sha256').update(source).digest('hex'),drivingSourceSha256:createHash('sha256').update(drivingSource).digest('hex'),profiles:VEHICLE_PROFILES,reports,placement},null,2)+'\n');console.log(JSON.stringify({passed:reports.length+1,reports,placement},null,2));
}finally{await server.close();}
