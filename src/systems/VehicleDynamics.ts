import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {DriveIntent} from './Driving';

export const VEHICLE_PROFILES=[
 {mass:1280,stiffness:30,compression:4.2,relaxation:6,acceleration:4,maxSpeed:29},
 {mass:1540,stiffness:36,compression:4.6,relaxation:6.5,acceleration:4.7,maxSpeed:32},
 {mass:1320,stiffness:44,compression:5.2,relaxation:7,acceleration:5.6,maxSpeed:36},
] as const;
const RADIUS=.338,REST_LENGTH=.32,WHEELBASE=2.56;
export type VehicleWheel={position:THREE.Vector3;rotation:number;steering:number;contact:boolean;length:number;force:number};
export type VehicleSurface={geometry:THREE.BufferGeometry;transform?:THREE.Matrix4;convex?:boolean};
export type VehiclePrimitive={position:THREE.Vector3;halfSize?:THREE.Vector3;radius?:number;height?:number;yaw?:number};
let ready:Promise<void>|undefined;

/** One dynamic chassis with four spring/damper ray tyres. Static level proxies
 * live in this world; no renderer, frame clock or mesh animation owns physics. */
export class VehicleDynamics {
 static async create(surfaces:readonly VehicleSurface[],primitives:readonly VehiclePrimitive[]=[],model=0){
  await(ready??=RAPIER.init());return new VehicleDynamics(surfaces,primitives,model);
 }
 readonly position=new THREE.Vector3();readonly rotation=new THREE.Quaternion();readonly velocity=new THREE.Vector3();
 readonly wheels:VehicleWheel[]=Array.from({length:4},()=>({position:new THREE.Vector3(),rotation:0,steering:0,contact:false,length:REST_LENGTH,force:0}));
 speed=0;lateralSpeed=0;steer=0;steeringAngle=0;hit=false;braking=false;modelIndex:number;
 private readonly world=new RAPIER.World({x:0,y:-9.81,z:0});
 private readonly body:RAPIER.RigidBody;private controller:RAPIER.DynamicRayCastVehicleController;
 private reverseDelay=0;private hardpointY=0;private disposed=false;private triangles=0;private steps=0;private contactsReady=false;
 private readonly forward=new THREE.Vector3();private readonly right=new THREE.Vector3();
 private constructor(surfaces:readonly VehicleSurface[],primitives:readonly VehiclePrimitive[],model:number){
  this.modelIndex=model;
  const point=new THREE.Vector3();
  for(const source of surfaces){
   const p=source.geometry.getAttribute('position'),vertices=new Float32Array(p.count*3);
   for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i);if(source.transform)point.applyMatrix4(source.transform);vertices.set([point.x,point.y,point.z],i*3);}
   let shape:RAPIER.ColliderDesc|null;
   if(source.convex)shape=RAPIER.ColliderDesc.convexHull(vertices);
   else{const index=source.geometry.index,indices=index?Uint32Array.from(index.array):Uint32Array.from({length:p.count},(_,i)=>i);
    // Without adjacency correction a chassis can catch an internal floor edge
    // and lose almost all forward speed on a smooth, continuous small bump.
    shape=RAPIER.ColliderDesc.trimesh(vertices,indices,RAPIER.TriMeshFlags.FIX_INTERNAL_EDGES);this.triangles+=indices.length/3;
   }
   if(shape)this.world.createCollider(shape.setFriction(.9).setRestitution(.02));
  }
  for(const primitive of primitives){const h=primitive.halfSize;
   const shape=h?RAPIER.ColliderDesc.cuboid(h.x,h.y,h.z):RAPIER.ColliderDesc.cylinder((primitive.height??4)/2,primitive.radius??.2);
   shape.setTranslation(primitive.position.x,primitive.position.y,primitive.position.z);
   if(primitive.yaw)shape.setRotation({x:0,y:Math.sin(primitive.yaw/2),z:0,w:Math.cos(primitive.yaw/2)});
   this.world.createCollider(shape.setFriction(.5).setRestitution(.02));
  }
  this.body=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setAngularDamping(.5).setCcdEnabled(true));
  this.world.createCollider(RAPIER.ColliderDesc.cuboid(.8,.28,1.98).setTranslation(0,.52,0).setDensity(0).setFriction(.3).setRestitution(.03),this.body);
  this.controller=this.world.createVehicleController(this.body);this.configure(model);
 }
 private configure(index:number){
  this.modelIndex=index;const p=VEHICLE_PROFILES[index]??VEHICLE_PROFILES[0],mass=p.mass;
  this.body.setAdditionalMassProperties(mass,{x:0,y:.48,z:0},{x:mass*1.3,y:mass*1.55,z:mass*.4},{x:0,y:0,z:0,w:1},true);
  this.body.recomputeMassPropertiesFromColliders();
  this.world.removeVehicleController(this.controller);this.controller=this.world.createVehicleController(this.body);
  const vehicle=this.controller;vehicle.indexUpAxis=1;vehicle.setIndexForwardAxis=2;
  // Compensate static sag so the authored tyre centres remain at .338m when
  // resting on flat ground. Each wheel still compresses/extends independently.
  this.hardpointY=RADIUS+REST_LENGTH-9.81/(4*p.stiffness);
  for(const z of[-1.28,1.28])for(const x of[-.845,.845]){const i=vehicle.numWheels();
   vehicle.addWheel({x,y:this.hardpointY,z},{x:0,y:-1,z:0},{x:-1,y:0,z:0},REST_LENGTH,RADIUS);
   vehicle.setWheelSuspensionStiffness(i,p.stiffness);vehicle.setWheelSuspensionCompression(i,p.compression);vehicle.setWheelSuspensionRelaxation(i,p.relaxation);
   vehicle.setWheelMaxSuspensionTravel(i,.16);vehicle.setWheelMaxSuspensionForce(i,mass*9.81*.9);vehicle.setWheelFrictionSlip(i,.95);vehicle.setWheelSideFrictionStiffness(i,1);
   this.wheels[i].position.set(x,RADIUS,z);this.wheels[i].rotation=0;this.wheels[i].contact=false;
  }
 }
 reset(position:THREE.Vector3,rotation:THREE.Quaternion,speed=0,model=this.modelIndex){
  if(model!==this.modelIndex)this.configure(model);
  this.body.setTranslation(position,true);this.body.setRotation(rotation,true);this.forward.set(0,0,1).applyQuaternion(rotation);
  this.body.setLinvel(this.forward.multiplyScalar(speed),true);this.body.setAngvel({x:0,y:0,z:0},true);this.body.resetForces(true);this.body.resetTorques(true);
  this.reverseDelay=0;this.steer=0;this.steeringAngle=0;this.braking=false;this.contactsReady=false;this.world.propagateModifiedBodyPositionsToColliders();this.readState();
 }
 update(dt:number,input:DriveIntent,offroad=false,automatic=false){
  const p=VEHICLE_PROFILES[this.modelIndex]??VEHICLE_PROFILES[0],mass=p.mass,vehicle=this.controller;
  this.readState();const beforeSpeed=this.speed,absSpeed=Math.abs(beforeSpeed);
  this.steer=THREE.MathUtils.damp(this.steer,input.steer,7,dt);
  const grip=offroad?.68:.95,maxSteering=this.maxSteering(offroad);
  this.steeringAngle=this.steer*maxSteering;
  let engine=0,brake=0;
  if(input.throttle>0){this.reverseDelay=0;if(beforeSpeed<-.3)brake=input.throttle*8;else engine=input.throttle*mass*p.acceleration*Math.max(0,1-Math.max(0,beforeSpeed)/(p.maxSpeed*(offroad?.72:1)));}
  else if(input.brake>0){
   if(beforeSpeed>.3||automatic){this.reverseDelay=0;brake=input.brake*6.5;}
   else{this.reverseDelay+=dt;if(this.reverseDelay<.4)brake=input.brake*6.5;else engine=-input.brake*mass*2.5*Math.max(0,1-Math.abs(Math.min(0,beforeSpeed))/5);}
  }else{this.reverseDelay=0;if(absSpeed<.15&&Math.abs(this.lateralSpeed)<.12)brake=2;}
  // Show commanded service braking, including cruise and braking out of reverse.
  // Automatic low-speed hold and a parking handbrake do not light the pedal lamps.
  this.braking=brake>.05&&(input.brake>0||input.throttle>0);
  this.body.resetForces(false);this.body.resetTorques(false);
  const drag=Math.sign(beforeSpeed)*(mass*(offroad?.5:.12)+.4*beforeSpeed*beforeSpeed);
  this.body.addForce({x:-this.forward.x*drag,y:0,z:-this.forward.z*drag},Boolean(engine||brake||input.steer));
  for(let i=0;i<4;i++){
   vehicle.setWheelEngineForce(i,i<2?engine/2:0);
   // Rapier brake is an impulse (N*s), not a force. Multiplying by dt avoids
   // frame-rate-dependent stopping and the very abrupt old 11m/s² clamp.
   vehicle.setWheelBrake(i,(brake+(input.handbrake&&i<2?9:0))*mass*dt/4);
   vehicle.setWheelSteering(i,i>=2?this.steeringAngle:0);vehicle.setWheelFrictionSlip(i,grip*(input.handbrake&&i<2?.48:1));
  }
  vehicle.updateVehicle(dt,RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC);this.world.timestep=dt;this.world.step();this.steps++;this.contactsReady=true;this.readState();
  this.hit=beforeSpeed-this.speed>2;
 }
 private maxSteering(offroad:boolean){return Math.min(.48,Math.atan((offroad?.68:.95)*.82*9.81*WHEELBASE/(this.speed*this.speed+1)));}
 normalizedSteer(angle:number,offroad:boolean){return THREE.MathUtils.clamp(angle/this.maxSteering(offroad),-1,1);}
 private readState(){
  const p=this.body.translation(),q=this.body.rotation(),v=this.body.linvel();this.position.set(p.x,p.y,p.z);this.rotation.set(q.x,q.y,q.z,q.w);this.velocity.set(v.x,v.y,v.z);
  this.forward.set(0,0,1).applyQuaternion(this.rotation);this.right.set(1,0,0).applyQuaternion(this.rotation);this.speed=this.velocity.dot(this.forward);this.lateralSpeed=this.velocity.dot(this.right);
  // A teleport/paused garage has no contact query at its new pose yet. Display
  // the nominal authored wheels there; never reuse contact data from elsewhere.
  for(let i=0;i<4;i++){const wheel=this.wheels[i];wheel.length=this.contactsReady?(this.controller.wheelSuspensionLength(i)??REST_LENGTH):this.hardpointY-RADIUS;wheel.position.y=this.hardpointY-wheel.length;wheel.rotation=this.controller.wheelRotation(i)??0;wheel.steering=i>=2?this.steeringAngle:0;wheel.contact=this.contactsReady&&this.controller.wheelIsInContact(i);wheel.force=this.contactsReady?(this.controller.wheelSuspensionForce(i)??0):0;}
 }
 get diagnostics(){return{engine:'Rapier 0.21.0',mass:this.body.mass(),steps:this.steps,colliders:this.world.colliders.len(),fixedTriangles:this.triangles,velocity:this.velocity.toArray(),lateralSpeed:this.lateralSpeed,steeringAngle:this.steeringAngle,wheels:this.wheels.map(w=>({length:w.length,force:w.force,contact:w.contact,y:w.position.y}))};}
 dispose(){if(!this.disposed){this.disposed=true;this.world.free();}}
}
