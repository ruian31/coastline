import * as THREE from 'three';
import {coast,hill,heightAt,nearestRoad,roadSurfaceHeight,touchesGuardrail,type RoadRoute,type RoadLocation} from '../world/roads';
import type {VehicleDynamics} from './VehicleDynamics';
export type DriveIntent={throttle:number;brake:number;steer:number;handbrake:boolean};
export const ROAD_POSITION_CLEARANCE=.035;
const wrap=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a));
export class Driving {
 position=new THREE.Vector3();yaw=0;pitch=0;roll=0;speed=0;steer=0;automatic=false;route:RoadRoute=coast;progress=.84;direction=1;preferHill=false;distance=0;hit=false;offroad=false;
 road:RoadLocation;modelIndex=0;
 dynamics:VehicleDynamics|undefined;
 private legacyBraking=false;
 get braking(){return this.dynamics?.braking??this.legacyBraking;}
 private physicsPose=new THREE.Vector3(Infinity,Infinity,Infinity);private physicsYaw=Infinity;private physicsSpeed=Infinity;
 private physicsRotation=new THREE.Quaternion();private physicsEuler=new THREE.Euler(0,0,0,'YXZ');
 private junctionTime=0;
 setDynamics(dynamics:VehicleDynamics){this.dynamics?.dispose();this.dynamics=dynamics;this.resetDynamics();}
 resetDynamics(){this.legacyBraking=false;if(!this.dynamics)return;
  const support=this.support(this.position.x,this.position.z,this.yaw);
  // Teleports and old observation fixtures may start below town paving. Lift
  // to its actual support plane before the solver sees an overlapping chassis.
  if(support.height>this.position.y-ROAD_POSITION_CLEARANCE+.06){this.position.y=support.height+ROAD_POSITION_CLEARANCE;this.pitch=support.pitch;this.roll=support.roll;}
  this.physicsRotation.setFromEuler(this.physicsEuler.set(this.pitch,this.yaw,this.roll,'YXZ'));const root=this.position.clone();root.y-=ROAD_POSITION_CLEARANCE;this.dynamics.reset(root,this.physicsRotation,this.speed,this.modelIndex);this.rememberPhysicsPose();
 }
 private rememberPhysicsPose(){this.physicsPose.copy(this.position);this.physicsYaw=this.yaw;this.physicsSpeed=this.speed;}
 private ground=(x:number,z:number)=>heightAt(x,z);
 private blocked:(x:number,z:number)=>boolean=()=>false;
 setTerrain(ground:(x:number,z:number)=>number,blocked:(x:number,z:number)=>boolean=()=>false){this.ground=ground;this.blocked=blocked;}
 constructor(){this.road=nearestRoad(0,0);this.teleport(.84);}
 teleport(t:number,route=coast){this.route=route;this.progress=t;const s=route.sample(t);this.position.copy(s.position).addScaledVector(s.right,1.7);this.position.y+=ROAD_POSITION_CLEARANCE;this.yaw=Math.atan2(s.tangent.x,s.tangent.z);this.pitch=-Math.asin(s.tangent.y);this.roll=0;this.offroad=false;this.speed=0;this.steer=0;this.road=nearestRoad(this.position.x,this.position.z);this.resetDynamics();}
 setAutomatic(enabled:boolean){if(enabled){this.road=nearestRoad(this.position.x,this.position.z);if(this.road.distance>this.road.route.width/2+.9)return false;this.route=this.road.route;this.progress=this.road.t;const t=this.road.sample.tangent;this.direction=Math.sin(this.yaw)*t.x+Math.cos(this.yaw)*t.z>=0?1:-1;}this.automatic=enabled;return true;}
 recover(){const s=this.road.sample;this.position.copy(s.position).addScaledVector(s.right,1.7*this.direction);this.position.y+=ROAD_POSITION_CLEARANCE;this.yaw=Math.atan2(s.tangent.x,s.tangent.z)+(this.direction<0?Math.PI:0);this.pitch=-Math.asin(s.tangent.y)*this.direction;this.roll=0;this.offroad=false;this.speed=0;this.steer=0;this.road=nearestRoad(this.position.x,this.position.z);this.position.y=this.road.sample.position.y+ROAD_POSITION_CLEARANCE;if(this.automatic)this.setAutomatic(true);this.resetDynamics();}
 private support(x:number,z:number,yaw:number){
  const forwardX=Math.sin(yaw),forwardZ=Math.cos(yaw),rightX=forwardZ,rightZ=-forwardX;
  const heights:number[]=[];
  // Four tyre patches fit a support plane; road height is used only under the road.
  for(const longitudinal of[1.28,-1.28])for(const lateral of[-.845,.845]){
   const px=x+forwardX*longitudinal+rightX*lateral,pz=z+forwardZ*longitudinal+rightZ*lateral;
   heights.push(roadSurfaceHeight(nearestRoad(px,pz),px,pz,this.ground));
  }
  const front=(heights[0]+heights[1])*.5,rear=(heights[2]+heights[3])*.5,left=(heights[0]+heights[2])*.5,right=(heights[1]+heights[3])*.5;
  const forwardSlope=(front-rear)/2.56,rightSlope=(right-left)/1.69;
  return{heights,height:(front+rear)*.5,pitch:-Math.atan(forwardSlope),roll:Math.atan2(rightSlope,Math.sqrt(1+forwardSlope*forwardSlope))};
 }
 private updateDynamics(dt:number,input:DriveIntent){
  const dynamics=this.dynamics!;
  // Recovery, garage changes and existing test fixtures explicitly edit public
  // state. Reconcile those discontinuities once, never on normal moving steps.
  if(this.modelIndex!==dynamics.modelIndex||this.position.distanceToSquared(this.physicsPose)>1e-8||Math.abs(wrap(this.yaw-this.physicsYaw))>1e-5||Math.abs(this.speed-this.physicsSpeed)>.01)this.resetDynamics();
  this.hit=false;
  for(let remaining=dt;remaining>1e-7;){const h=Math.min(remaining,1/60);remaining-=h;
   this.road=nearestRoad(this.position.x,this.position.z);this.offroad=this.road.distance>this.road.route.width/2+.2;
   let controls=input;
   if(this.automatic){
    this.progress=nearestRoad(this.position.x,this.position.z,this.route).t;
    this.junctionTime=Math.max(0,this.junctionTime-h);
    if(this.route===coast){const junction=this.direction>0?.29:.66,remaining=((junction-this.progress)*this.direction+1)%1*coast.length;if(this.preferHill&&remaining<25){this.junctionTime=Math.max(this.junctionTime,2);if(remaining<6){this.route=hill;this.progress=nearestRoad(this.position.x,this.position.z,hill).t;this.junctionTime=4;}}}
    else{const remaining=(this.direction>0?1-this.progress:this.progress)*hill.length;if(remaining<25){this.junctionTime=Math.max(this.junctionTime,2);if(remaining<6){this.route=coast;this.progress=nearestRoad(this.position.x,this.position.z,coast).t;this.preferHill=false;this.junctionTime=4;}}}
    const s=this.route.sample(this.progress),lookDistance=this.junctionTime>0?5.5:THREE.MathUtils.clamp(6+Math.abs(this.speed)*.75,6,17),look=this.route.sample(this.progress+this.direction*lookDistance/this.route.length),target=look.position.clone().addScaledVector(look.right,1.6*this.direction),dx=target.x-this.position.x,dz=target.z-this.position.z;
    const localX=dx*Math.cos(this.yaw)-dz*Math.sin(this.yaw),steeringAngle=Math.atan2(2*2.56*localX,Math.max(4,dx*dx+dz*dz));
    const bend=Math.abs(wrap(Math.atan2(look.tangent.x,look.tangent.z)-Math.atan2(s.tangent.x,s.tangent.z))),curveSpeed=Math.sqrt(.66*9.81*2.56/Math.max(.001,Math.abs(Math.tan(steeringAngle)))),targetSpeed=Math.min((this.route===hill?10.5:14)/(1+bend*2.8),curveSpeed,this.junctionTime>0?5.5:Infinity),error=targetSpeed-this.speed;
    controls={throttle:THREE.MathUtils.clamp(error*.65,0,1),brake:THREE.MathUtils.clamp(-error*.45,0,1),steer:dynamics.normalizedSteer(steeringAngle,this.offroad),handbrake:false};
   }
   const previous=this.position.clone(),previousRotation=dynamics.rotation.clone();dynamics.update(h,controls,this.offroad,this.automatic);
   // Keep the established deep-water boundary. Ordinary hills and steps are
   // solved by the actual chassis/suspension instead of road-distance clamps.
   if(dynamics.position.y<-1.05){previous.y-=ROAD_POSITION_CLEARANCE;dynamics.reset(previous,previousRotation,0);this.hit=true;}
   this.position.copy(dynamics.position);this.position.y+=ROAD_POSITION_CLEARANCE;this.physicsEuler.setFromQuaternion(dynamics.rotation,'YXZ');this.pitch=this.physicsEuler.x;this.yaw=this.physicsEuler.y;this.roll=this.physicsEuler.z;this.speed=dynamics.speed;this.steer=dynamics.steer;this.hit||=dynamics.hit;this.distance+=Math.hypot(dynamics.velocity.x,dynamics.velocity.z)*h;
  }
  this.road=nearestRoad(this.position.x,this.position.z);this.offroad=this.road.distance>this.road.route.width/2+.2;this.rememberPhysicsPose();
 }
 update(dt:number,input:DriveIntent){if(this.dynamics){this.updateDynamics(dt,input);return;}this.hit=false;const previousSpeed=this.speed,oldX=this.position.x,oldZ=this.position.z,oldYaw=this.yaw;this.legacyBraking=false;
 if(this.automatic){
 const s=this.route.sample(this.progress),look=this.route.sample(this.progress+this.direction*18/this.route.length),bend=Math.abs(wrap(Math.atan2(look.tangent.x,look.tangent.z)-Math.atan2(s.tangent.x,s.tangent.z))),target=(this.route===hill?10.5:14)/(1+bend*2.8);
 this.speed=THREE.MathUtils.damp(this.speed,target,1.5,dt);this.progress+=this.direction*this.speed*dt/this.route.length;
 this.legacyBraking=previousSpeed>target+.2;
 if(this.route===coast){this.progress=(this.progress+1)%1;const junction=this.direction>0?.29:.66;if(this.preferHill&&Math.abs(this.progress-junction)<.0018){this.route=hill;this.progress=this.direction>0?0:1;}}
 else if(this.progress>=1||this.progress<=0){this.progress=this.direction>0?.66:.29;this.route=coast;this.preferHill=false;}
 const next=this.route.sample(this.progress),targetPosition=next.position.clone().addScaledVector(next.right,1.6*this.direction),desiredYaw=Math.atan2(next.tangent.x,next.tangent.z)+(this.direction<0?Math.PI:0);
 this.steer=THREE.MathUtils.damp(this.steer,THREE.MathUtils.clamp(wrap(desiredYaw-this.yaw)*2,-.5,.5),5,dt);this.position.lerp(targetPosition,1-Math.exp(-5*dt));this.yaw+=wrap(desiredYaw-this.yaw)*(1-Math.exp(-5*dt));this.pitch=THREE.MathUtils.damp(this.pitch,-Math.asin(next.tangent.y)*this.direction,5,dt);
 }else{
 const maxSpeed=([29,32,36][this.modelIndex]??29)*(this.offroad?.6:1),throttle=input.throttle,brake=input.brake;
 let acceleration=throttle*(this.speed<0?9:5.8)*(1-Math.max(0,this.speed)/maxSpeed);
 this.legacyBraking=brake>0&&this.speed>.3||throttle>0&&this.speed<-.3;
 if(brake>0)acceleration+=this.speed>.3?-brake*11:-brake*3.4;
 if(!throttle&&!brake)acceleration-=Math.sign(this.speed)*(.28+this.speed*this.speed*.0035);
 if(this.offroad)acceleration-=Math.sign(this.speed)*(.65+this.speed*this.speed*.006);
 if(input.handbrake)acceleration-=Math.sign(this.speed)*15;
 this.speed=THREE.MathUtils.clamp(this.speed+acceleration*dt,-5,maxSpeed);if(!throttle&&!brake&&Math.sign(previousSpeed)!==Math.sign(this.speed))this.speed=0;
 this.steer=THREE.MathUtils.damp(this.steer,input.steer,9,dt);this.yaw+=Math.tan(this.steer*(.48/(1+Math.abs(this.speed)*.032)))*this.speed/2.65*dt;
 this.position.x+=Math.sin(this.yaw)*this.speed*dt;this.position.z+=Math.cos(this.yaw)*this.speed*dt;
 }
 this.road=nearestRoad(this.position.x,this.position.z);this.offroad=this.road.distance>this.road.route.width/2+.2;
 if(this.automatic){this.position.y=this.road.sample.position.y+ROAD_POSITION_CLEARANCE;this.roll=THREE.MathUtils.damp(this.roll,0,6,dt);}
 else{
  let support=this.support(this.position.x,this.position.z,this.yaw);
  const previous=this.support(oldX,oldZ,oldYaw),travel=Math.hypot(this.position.x-oldX,this.position.z-oldZ);
  const abrupt=support.heights.some((height,i)=>height-previous.heights[i]>Math.max(.22,travel*.95)||previous.heights[i]-height>Math.max(.6,travel*1.3));
  const slope=Math.hypot(Math.tan(support.pitch),Math.tan(support.roll));
  // Solid scenery, steep steps and deep water stop a car. Road distance never does.
  if(touchesGuardrail(this.road)||this.blocked(this.position.x,this.position.z)||Math.min(...support.heights)<-1.05||abrupt||slope>1.05){
   this.position.x=oldX;this.position.z=oldZ;this.yaw=oldYaw;this.speed=0;this.hit=true;support=previous;this.road=nearestRoad(oldX,oldZ);
  }
  this.position.y=support.height+ROAD_POSITION_CLEARANCE;
  this.pitch=THREE.MathUtils.damp(this.pitch,support.pitch,10,dt);this.roll=THREE.MathUtils.damp(this.roll,support.roll,10,dt);
 }
 this.distance+=Math.abs(this.speed)*dt;
 }
}
