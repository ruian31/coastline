import * as THREE from 'three';
export type RoadSample = { position: THREE.Vector3; tangent: THREE.Vector3; right: THREE.Vector3 };
export type RoadRoute = { id: string; name: string; curve: THREE.CatmullRomCurve3; length: number; width: number; closed: boolean; sample: (t:number)=>RoadSample };
export function heightAt(x:number,z:number):number {
 const r=Math.sqrt((x/355)**2+(z/292)**2), inland=Math.max(0,1-r);
 return -1.6+Math.min(9,Math.max(0,(1.12-r)*53))+inland*14+Math.sin(x*.018)*Math.cos(z*.016)*inland*7;
}
function makeRoute(id:string,name:string,points:THREE.Vector3[],closed:boolean,width:number):RoadRoute {
 const curve=new THREE.CatmullRomCurve3(points,closed,'catmullrom',.45),length=curve.getLength();
 return {id,name,curve,length,width,closed,sample:(t:number)=>{const u=closed?((t%1)+1)%1:THREE.MathUtils.clamp(t,0,1);const position=curve.getPointAt(u),tangent=curve.getTangentAt(u).normalize(),right=new THREE.Vector3(tangent.z,0,-tangent.x).normalize();return{position,tangent,right};}};
}
const loopPoints=Array.from({length:48},(_,i)=>{const a=i/48*Math.PI*2,x=320*Math.cos(a)+18*Math.sin(a*3),z=254*Math.sin(a)+12*Math.cos(a*2);return new THREE.Vector3(x,heightAt(x,z)+.22,z);});
export const coast=makeRoute('coast','逐海环线',loopPoints,true,9.2);
const a=coast.sample(.29).position,b=coast.sample(.66).position;
const inland=[a,a.clone().lerp(b,.12),new THREE.Vector3(-65,heightAt(-65,40)+.22,40),new THREE.Vector3(-135,heightAt(-135,-40)+.22,-40),b.clone().lerp(a,.12),b].map(p=>new THREE.Vector3(p.x,heightAt(p.x,p.z)+.22,p.z));
export const hill=makeRoute('hill','山间支线',inland,false,7.6);
export const roads=[coast,hill];
const tables=roads.map(route=>{const count=Math.ceil(route.length/3);return{route,points:Array.from({length:count+1},(_,i)=>route.sample(i/count).position),count};});
export type RoadLocation={route:RoadRoute;t:number;sample:RoadSample;distance:number;offset:number};
export const SHOULDER_WIDTH=1.15,VERGE_WIDTH=4.4;
export const guardrailSpans:Array<[number,number]>=[[.055,.16],[.20,.32],[.43,.665],[.745,.85],[.91,.995]];
/** The same graded shoulder is used by the visible mesh and tyre support. */
export function vergeHeight(sample:RoadSample,width:number,offset:number,ground:(x:number,z:number)=>number):number {
 const edge=width/2+SHOULDER_WIDTH,outer=edge+VERGE_WIDTH;
 const end=ground(sample.position.x+sample.right.x*Math.sign(offset)*outer,sample.position.z+sample.right.z*Math.sign(offset)*outer);
 return THREE.MathUtils.lerp(sample.position.y-.055,end,THREE.MathUtils.smoothstep(Math.abs(offset),edge,outer));
}
export function roadSurfaceHeight(location:RoadLocation,x:number,z:number,ground:(x:number,z:number)=>number):number {
 const base=ground(x,z),half=location.route.width/2;
 if(location.distance<=half)return Math.max(base,location.sample.position.y);
 if(location.distance<=half+SHOULDER_WIDTH)return Math.max(base,location.sample.position.y-.055);
 if(location.distance<half+SHOULDER_WIDTH+VERGE_WIDTH)return Math.max(base,vergeHeight(location.sample,location.route.width,location.offset,ground));
 return base;
}
export function touchesGuardrail(location:RoadLocation):boolean {
 return location.route===coast&&Math.abs(location.offset-(coast.width/2+.65))<.88&&guardrailSpans.some(([start,end])=>location.t>=start&&location.t<=end);
}
export function nearestRoad(x:number,z:number,only?:RoadRoute):RoadLocation {
 let distance=Infinity,found=coast,u=0;
 for(const table of tables){if(only&&table.route!==only)continue;const{points,count,route}=table;
 for(let i=0;i<count;i++){const a=points[i],b=points[i+1],dx=b.x-a.x,dz=b.z-a.z,s=THREE.MathUtils.clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1),px=a.x+s*dx,pz=a.z+s*dz,d=(x-px)**2+(z-pz)**2;
 if(d<distance){distance=d;found=route;u=(i+s)/count;}}}
 const sample=found.sample(u);return{route:found,t:u,sample,distance:Math.sqrt(distance),offset:(x-sample.position.x)*sample.right.x+(z-sample.position.z)*sample.right.z};
}
export const landmarks=[{name:'落日观景台',en:'SUNSET POINT',t:.04},{name:'棕榈海湾',en:'PALM BAY',t:.18},{name:'蔚蓝小镇',en:'PORTO AZZURRO',t:.37},{name:'山海隧道',en:'CAPE TUNNEL',t:.70},{name:'灯塔岬角',en:'LIGHTHOUSE CAPE',t:.88}];
