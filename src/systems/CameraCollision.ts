import * as THREE from 'three';
export type CameraCollider={x:number;z:number;halfX:number;halfZ:number};
/** Shorten both desired and interpolated booms; checking only the target lets smoothing cross walls. */
export function avoidCameraCollision(position:THREE.Vector3,origin:THREE.Vector3,colliders:readonly CameraCollider[],groundHeight:(x:number,z:number)=>number):boolean {
 const delta=position.clone().sub(origin);let fraction=1;
 for(const c of colliders){let enter=0,exit=1;
  for(const axis of ['x','z'] as const){const center=axis==='x'?c.x:c.z,half=(axis==='x'?c.halfX:c.halfZ)+.65,direction=delta[axis],start=origin[axis];
   if(Math.abs(direction)<.0001){if(start<center-half||start>center+half){enter=2;break;}}
   else{const a=(center-half-start)/direction,b=(center+half-start)/direction;enter=Math.max(enter,Math.min(a,b));exit=Math.min(exit,Math.max(a,b));}
  }
  if(enter<=exit&&enter>0&&enter<fraction)fraction=Math.max(.08,enter-.065);
 }
 for(let i=1;i<=16;i++){const t=i/16;if(t>fraction)break;const x=origin.x+delta.x*t,z=origin.z+delta.z*t,y=origin.y+delta.y*t;if(y<groundHeight(x,z)+.45){fraction=Math.max(.08,t-1/16);break;}}
 if(fraction<1)position.copy(origin).addScaledVector(delta,fraction);
 position.y=Math.max(position.y,groundHeight(position.x,position.z)+.55);
 return fraction<1;
}
