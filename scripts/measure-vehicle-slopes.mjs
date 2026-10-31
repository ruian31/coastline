import {createServer} from 'vite';
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const out=process.env.VEHICLE_SLOPE_REPORT_DIR??'artifacts/vehicle-slopes-m73';await mkdir(out,{recursive:true});
const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',logLevel:'error'});
try{
 const T=await server.ssrLoadModule('three'),{VehicleDynamics}=await server.ssrLoadModule('/src/systems/VehicleDynamics.ts'),rows=[];
 for(const model of[0,1,2])for(const offroad of[false,true])for(const degrees of[0,10,15,20,25,30]){
  const angle=degrees*Math.PI/180,geometry=new T.PlaneGeometry(2000,2000).rotateX(-Math.PI/2-angle),car=await VehicleDynamics.create([{geometry}],[],model);
  try{
   car.reset(new T.Vector3(0,.22,0),new T.Quaternion().setFromEuler(new T.Euler(-angle,0,0)));
   for(let i=0;i<180;i++)car.update(1/60,{throttle:0,brake:1,steer:0,handbrake:false},offroad,true);
   car.reset(car.position,car.rotation,0);const start=car.position.clone(),samples=[];
   for(let i=0;i<720;i++){
    car.update(1/60,{throttle:1,brake:0,steer:0,handbrake:false},offroad,false);
    assert.ok([...car.position.toArray(),...car.velocity.toArray(),...car.rotation.toArray()].every(Number.isFinite),'Finite physical state');
    assert.ok(Math.abs(car.position.x)<900&&Math.abs(car.position.z)<900,'Never run off the finite test plane');
    if(i%30===29)samples.push({seconds:(i+1)/60,speed:car.speed,position:car.position.toArray(),velocity:car.velocity.toArray(),pitch:new T.Euler().setFromQuaternion(car.rotation,'YXZ').x,contacts:car.wheels.filter(w=>w.contact).length,wheels:car.wheels.map((w,j)=>({contact:w.contact,force:w.force,normal:car.controller.wheelContactNormal(j),engine:car.controller.wheelEngineForce(j),forwardImpulse:car.controller.wheelForwardImpulse(j)}))});
   }
   const end=samples.at(-1),row={model,offroad,degrees,uphillDistance:car.position.clone().sub(start).dot(new T.Vector3(0,Math.sin(angle),Math.cos(angle))),speedAt2:samples[3].speed,speedAt8:samples[15].speed,finalSpeed:car.speed,lastPitchDegrees:-end.pitch*180/Math.PI,lastContacts:end.contacts,lastEngine:Math.abs(end.wheels.reduce((s,w)=>s+w.engine,0)),gravityAlongSlope:car.diagnostics.mass*9.81*Math.sin(angle),samples};rows.push(row);
   console.log(JSON.stringify({...row,samples:undefined}));
  }finally{car.dispose();geometry.dispose();}
 }
 const source=await readFile('src/systems/VehicleDynamics.ts');await writeFile(out+'/result.json',JSON.stringify({method:'Exact current VehicleDynamics source via SSR, unmodified. Each model x road/offroad x six2000m constant planes with bounds and finite-state assertions. Fixed1/60;3s service-brake settle then declared zero-speed reset,12s actual full-throttle fixed physics. No browser, no actual bank fixture and no assigned movement after start. Measures traction/engine grade behavior without interpreting every stall as a bug.',sourceSha256:createHash('sha256').update(source).digest('hex'),rows},null,2)+'\n');
}finally{await server.close();}
