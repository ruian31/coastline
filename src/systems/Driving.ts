import * as THREE from 'three';
import {coast,hill,heightAt,nearestRoad,roadSurfaceHeight,touchesGuardrail,type RoadRoute,type RoadLocation} from '../world/roads';
export type DriveIntent={throttle:number;brake:number;steer:number;handbrake:boolean};
export const ROAD_POSITION_CLEARANCE=.035;
const wrap=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a));
export class Driving {
 position=new THREE.Vector3();yaw=0;pitch=0;roll=0;speed=0;steer=0;automatic=false;route:RoadRoute=coast;progress=.84;direction=1;preferHill=false;distance=0;hit=false;offroad=false;
 road:RoadLocation;modelIndex=0;
 private ground=(x:number,z:number)=>heightAt(x,z);
 private blocked:(x:number,z:number)=>boolean=()=>false;
 setTerrain(ground:(x:number,z:number)=>number,blocked:(x:number,z:number)=>boolean=()=>false){this.ground=ground;this.blocked=blocked;}
 constructor(){this.road=nearestRoad(0,0);this.teleport(.84);}
 teleport(t:number,route=coast){this.route=route;this.progress=t;const s=route.sample(t);this.position.copy(s.position).addScaledVector(s.right,1.7);this.position.y+=ROAD_POSITION_CLEARANCE;this.yaw=Math.atan2(s.tangent.x,s.tangent.z);this.pitch=-Math.asin(s.tangent.y);this.roll=0;this.offroad=false;this.speed=0;this.steer=0;this.road=nearestRoad(this.position.x,this.position.z);}
 setAutomatic(enabled:boolean){if(enabled){this.road=nearestRoad(this.position.x,this.position.z);if(this.road.distance>this.road.route.width/2+.9)return false;this.route=this.road.route;this.progress=this.road.t;const t=this.road.sample.tangent;this.direction=Math.sin(this.yaw)*t.x+Math.cos(this.yaw)*t.z>=0?1:-1;}this.automatic=enabled;return true;}
 recover(){const s=this.road.sample;this.position.copy(s.position).addScaledVector(s.right,1.7*this.direction);this.position.y+=ROAD_POSITION_CLEARANCE;this.yaw=Math.atan2(s.tangent.x,s.tangent.z)+(this.direction<0?Math.PI:0);this.pitch=-Math.asin(s.tangent.y)*this.direction;this.roll=0;this.offroad=false;this.speed=0;this.steer=0;this.road=nearestRoad(this.position.x,this.position.z);this.position.y=this.road.sample.position.y+ROAD_POSITION_CLEARANCE;if(this.automatic)this.setAutomatic(true);}
 private support(x:number,z:number,yaw:number){
  const forwardX=Math.sin(yaw),forwardZ=Math.cos(yaw),rightX=forwardZ,rightZ=-forwardX;
  const heights:number[]=[];
  // Four tyre patches fit a support plane; road height is used only under the road.
  for(const longitudinal of[1.2,-1.2])for(const lateral of[-.72,.72]){
   const px=x+forwardX*longitudinal+rightX*lateral,pz=z+forwardZ*longitudinal+rightZ*lateral;
   heights.push(roadSurfaceHeight(nearestRoad(px,pz),px,pz,this.ground));
  }
  const front=(heights[0]+heights[1])*.5,rear=(heights[2]+heights[3])*.5,left=(heights[0]+heights[2])*.5,right=(heights[1]+heights[3])*.5;
  return{heights,height:(front+rear)*.5,pitch:-Math.atan2(front-rear,2.4),roll:Math.atan2(right-left,1.44)};
 }
 update(dt:number,input:DriveIntent){this.hit=false;const previousSpeed=this.speed,oldX=this.position.x,oldZ=this.position.z,oldYaw=this.yaw;
 if(this.automatic){
 const s=this.route.sample(this.progress),look=this.route.sample(this.progress+this.direction*18/this.route.length),bend=Math.abs(wrap(Math.atan2(look.tangent.x,look.tangent.z)-Math.atan2(s.tangent.x,s.tangent.z))),target=(this.route===hill?10.5:14)/(1+bend*2.8);
 this.speed=THREE.MathUtils.damp(this.speed,target,1.5,dt);this.progress+=this.direction*this.speed*dt/this.route.length;
 if(this.route===coast){this.progress=(this.progress+1)%1;const junction=this.direction>0?.29:.66;if(this.preferHill&&Math.abs(this.progress-junction)<.0018){this.route=hill;this.progress=this.direction>0?0:1;}}
 else if(this.progress>=1||this.progress<=0){this.progress=this.direction>0?.66:.29;this.route=coast;this.preferHill=false;}
 const next=this.route.sample(this.progress),targetPosition=next.position.clone().addScaledVector(next.right,1.6*this.direction),desiredYaw=Math.atan2(next.tangent.x,next.tangent.z)+(this.direction<0?Math.PI:0);
 this.steer=THREE.MathUtils.damp(this.steer,THREE.MathUtils.clamp(wrap(desiredYaw-this.yaw)*2,-.5,.5),5,dt);this.position.lerp(targetPosition,1-Math.exp(-5*dt));this.yaw+=wrap(desiredYaw-this.yaw)*(1-Math.exp(-5*dt));this.pitch=THREE.MathUtils.damp(this.pitch,-Math.asin(next.tangent.y)*this.direction,5,dt);
 }else{
 const maxSpeed=([29,32,36][this.modelIndex]??29)*(this.offroad?.6:1),throttle=input.throttle,brake=input.brake;
 let acceleration=throttle*(this.speed<0?9:5.8)*(1-Math.max(0,this.speed)/maxSpeed);
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
