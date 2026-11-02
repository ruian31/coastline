import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createServer} from 'vite';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const out=process.env.WET_VEHICLE_REPORT??'artifacts/weather-m79-vehicle';await mkdir(out,{recursive:true});
const baselineRevision='f45d825',baseline=execFileSync('git',['show',baselineRevision+':src/systems/VehicleDynamics.ts'],{encoding:'utf8'}),hash=s=>createHash('sha256').update(s).digest('hex');let controlLoads=0;
const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',logLevel:'error',plugins:[{name:'pinned-dry-vehicle-control',enforce:'pre',transform(code,id){if(id.endsWith('/src/systems/VehicleDynamics.ts?wet-control')){controlLoads++;return{code:baseline,map:null};}}}]});
try{
 const THREE=await server.ssrLoadModule('three'),current=await server.ssrLoadModule('/src/systems/VehicleDynamics.ts'),control=await server.ssrLoadModule('/src/systems/VehicleDynamics.ts?wet-control'),DT=1/60,empty={throttle:0,brake:0,steer:0,handbrake:false},rows=[];
 assert.equal(controlLoads,1);assert.equal(hash(baseline),'ecad100eb704502d233fd76014d771fb0a8d6439f7b8003d5d2b0abf3ef5233d');
 async function run(Factory,model,scenario,wetness){
  const geometry=new THREE.PlaneGeometry(400,400).rotateX(-Math.PI/2),car=await Factory.create([{geometry}],[],model);const samples=[];
  try{
   car.reset(new THREE.Vector3(0,.22,0),new THREE.Quaternion());for(let i=0;i<180;i++)car.update(DT,empty);assert.equal(car.wheels.filter(w=>w.contact).length,4);car.reset(car.position,car.rotation,12);
   let stop=null,travelled=0,previous=car.position.clone(),maxSteer=0,maxLateral=0;
   for(let i=0;i<360;i++){
    const input=scenario==='brake'?{...empty,brake:1}:scenario==='turn'?{...empty,steer:i<90?.8:0}:empty;
    car.update(DT,input,false,scenario==='brake',wetness);travelled+=car.position.distanceTo(previous);previous.copy(car.position);if(!stop&&car.speed<=.2)stop={seconds:(i+1)*DT,metres:travelled};
    const sample=[...car.position.toArray(),...car.rotation.toArray(),...car.velocity.toArray(),car.steeringAngle,...car.wheels.flatMap(w=>[w.length,w.force,Number(w.contact)])];assert.ok(sample.every(Number.isFinite));samples.push(sample);maxSteer=Math.max(maxSteer,Math.abs(car.steeringAngle));maxLateral=Math.max(maxLateral,Math.abs(car.lateralSpeed));
   }
   return{hash:hash(JSON.stringify(samples)),last:samples.at(-1),stop,travelled,maxSteer,maxLateral,wetness:car.diagnostics.wetness??0};
  }finally{car.dispose();geometry.dispose();}
 }
 for(let model=0;model<3;model++)for(const scenario of['coast','brake','turn']){
  const old=await run(control.VehicleDynamics,model,scenario,0),dry=await run(current.VehicleDynamics,model,scenario,0),wet=await run(current.VehicleDynamics,model,scenario,.72);assert.equal(dry.hash,old.hash,'Dry physics changed: '+model+'/'+scenario);assert.equal(wet.wetness,.72);
  if(scenario==='turn'){assert.ok(wet.maxSteer<dry.maxSteer);assert.ok(Math.hypot(wet.last[0]-dry.last[0],wet.last[2]-dry.last[2])>.1,'Wet steering should change the actual trajectory');}
  if(scenario==='brake'){assert.ok(wet.stop&&wet.stop.seconds>1&&wet.stop.seconds<5);}
  rows.push({model,scenario,old,dry,wet});
 }
 const report={scope:'Pinned M78 exact dry-control source versus current dry and72% wet Rapier on identical flat triangle floor, three models/coast/brake/turn,360 measured60Hz steps after180 settle. Full state hashes prove all9 dry traces unchanged. Wet tyres lower friction/steering while braking remains controlled; does not prove every real-world wet route or phone feel.',baselineRevision,baselineSha256:hash(baseline),currentSha256:hash(await readFile('src/systems/VehicleDynamics.ts')),rows};await writeFile(out+'/result.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:true,dryIdentical:9,rows:rows.map(r=>({model:r.model,scenario:r.scenario,oldStop:r.old.stop,wetStop:r.wet.stop,drySteer:r.dry.maxSteer,wetSteer:r.wet.maxSteer}))}));
}finally{await server.close();}
