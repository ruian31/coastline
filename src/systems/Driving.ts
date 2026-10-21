import * as THREE from 'three';
import {coast,hill,nearestRoad,type RoadRoute,type RoadLocation} from '../world/roads';
export type DriveIntent={throttle:number;brake:number;steer:number;handbrake:boolean};
const wrap=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a));
export class Driving {
 position=new THREE.Vector3();yaw=0;pitch=0;speed=0;steer=0;automatic=false;route:RoadRoute=coast;progress=.04;direction=1;preferHill=false;distance=0;hit=false;
 road:RoadLocation;modelIndex=0;
 constructor(){this.road=nearestRoad(0,0);this.teleport(.04);}
 teleport(t:number,route=coast){this.route=route;this.progress=t;const s=route.sample(t);this.position.copy(s.position).addScaledVector(s.right,1.7);this.yaw=Math.atan2(s.tangent.x,s.tangent.z);this.pitch=-Math.asin(s.tangent.y);this.speed=0;this.steer=0;this.road=nearestRoad(this.position.x,this.position.z);}
 setAutomatic(enabled:boolean){if(enabled){this.road=nearestRoad(this.position.x,this.position.z);this.route=this.road.route;this.progress=this.road.t;const t=this.road.sample.tangent;this.direction=Math.sin(this.yaw)*t.x+Math.cos(this.yaw)*t.z>=0?1:-1;}this.automatic=enabled;}
 recover(){const s=this.road.sample;this.position.copy(s.position).addScaledVector(s.right,1.7*this.direction);this.yaw=Math.atan2(s.tangent.x,s.tangent.z)+(this.direction<0?Math.PI:0);this.pitch=-Math.asin(s.tangent.y)*this.direction;this.speed=0;this.steer=0;if(this.automatic)this.setAutomatic(true);}
 update(dt:number,input:DriveIntent){this.hit=false;const previousSpeed=this.speed;
 if(this.automatic){
 const s=this.route.sample(this.progress),look=this.route.sample(this.progress+this.direction*18/this.route.length),bend=Math.abs(wrap(Math.atan2(look.tangent.x,look.tangent.z)-Math.atan2(s.tangent.x,s.tangent.z))),target=(this.route===hill?10.5:14)/(1+bend*2.8);
 this.speed=THREE.MathUtils.damp(this.speed,target,1.5,dt);this.progress+=this.direction*this.speed*dt/this.route.length;
 if(this.route===coast){this.progress=(this.progress+1)%1;const junction=this.direction>0?.29:.66;if(this.preferHill&&Math.abs(this.progress-junction)<.0018){this.route=hill;this.progress=this.direction>0?0:1;}}
 else if(this.progress>=1||this.progress<=0){this.progress=this.direction>0?.66:.29;this.route=coast;this.preferHill=false;}
 const next=this.route.sample(this.progress),targetPosition=next.position.clone().addScaledVector(next.right,1.6*this.direction),desiredYaw=Math.atan2(next.tangent.x,next.tangent.z)+(this.direction<0?Math.PI:0);
 this.steer=THREE.MathUtils.damp(this.steer,THREE.MathUtils.clamp(wrap(desiredYaw-this.yaw)*2,-.5,.5),5,dt);this.position.lerp(targetPosition,1-Math.exp(-5*dt));this.yaw+=wrap(desiredYaw-this.yaw)*(1-Math.exp(-5*dt));this.pitch=THREE.MathUtils.damp(this.pitch,-Math.asin(next.tangent.y)*this.direction,5,dt);
 }else{
 const maxSpeed=[29,32,36][this.modelIndex]??29,throttle=input.throttle,brake=input.brake;
 let acceleration=throttle*(this.speed<0?9:5.8)*(1-Math.max(0,this.speed)/maxSpeed);
 if(brake>0)acceleration+=this.speed>.3?-brake*11:-brake*3.4;
 if(!throttle&&!brake)acceleration-=Math.sign(this.speed)*(.28+this.speed*this.speed*.0035);
 if(input.handbrake)acceleration-=Math.sign(this.speed)*15;
 this.speed=THREE.MathUtils.clamp(this.speed+acceleration*dt,-5,maxSpeed);if(!throttle&&!brake&&Math.sign(previousSpeed)!==Math.sign(this.speed))this.speed=0;
 this.steer=THREE.MathUtils.damp(this.steer,input.steer,9,dt);this.yaw+=Math.tan(this.steer*(.48/(1+Math.abs(this.speed)*.032)))*this.speed/2.65*dt;
 this.position.x+=Math.sin(this.yaw)*this.speed*dt;this.position.z+=Math.cos(this.yaw)*this.speed*dt;
 }
 this.road=nearestRoad(this.position.x,this.position.z);const r=this.road;
 if(r.distance>r.route.width/2-.7){this.speed*=Math.exp(-dt*1.3);if(r.distance>r.route.width/2+1.1){const offset=THREE.MathUtils.clamp(r.offset,-r.route.width/2-1,r.route.width/2+1);this.position.x=r.sample.position.x+r.sample.right.x*offset;this.position.z=r.sample.position.z+r.sample.right.z*offset;this.speed*=.65;this.hit=true;}}
 this.position.y=r.sample.position.y+.035;this.pitch=THREE.MathUtils.damp(this.pitch,-Math.asin(r.sample.tangent.y)*Math.cos(wrap(this.yaw-Math.atan2(r.sample.tangent.x,r.sample.tangent.z))),6,dt);
 this.distance+=Math.abs(this.speed)*dt;
 }
}
