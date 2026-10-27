import * as THREE from 'three';
export type CameraCollider={x:number;z:number;halfX:number;halfZ:number;yaw?:number};
export type CameraSurfaceSource={geometry:THREE.BufferGeometry;transform?:THREE.Matrix4};
/** CPU-only index of immutable rendered surfaces. Nearby cells share one world
 * position buffer; their small index/mesh wrappers are created on first query. */
export function createCameraSurface(sources:readonly CameraSurfaceSource[]){
 const size=16,vertices:number[]=[],cells=new Map<string,{indices:number[];box:THREE.Box3;mesh?:THREE.Mesh}>(),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
 for(const{geometry,transform}of sources){const p=geometry.getAttribute('position'),index=geometry.index,count=index?.count??p.count;
  for(let i=0;i<count;i+=3){a.fromBufferAttribute(p,index?index.getX(i):i);b.fromBufferAttribute(p,index?index.getX(i+1):i+1);c.fromBufferAttribute(p,index?index.getX(i+2):i+2);if(transform){a.applyMatrix4(transform);b.applyMatrix4(transform);c.applyMatrix4(transform);}
   const first=vertices.length/3;vertices.push(a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z);
   for(let x=Math.floor(Math.min(a.x,b.x,c.x)/size);x<=Math.floor(Math.max(a.x,b.x,c.x)/size);x++)for(let z=Math.floor(Math.min(a.z,b.z,c.z)/size);z<=Math.floor(Math.max(a.z,b.z,c.z)/size);z++){
    const key=x+','+z,cell=cells.get(key)??{indices:[],box:new THREE.Box3()};if(!cells.has(key))cells.set(key,cell);cell.indices.push(first,first+1,first+2);cell.box.expandByPoint(a).expandByPoint(b).expandByPoint(c);
   }
  }
 }
 const position=new THREE.Float32BufferAttribute(vertices,3),material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),selected:THREE.Object3D[]=[];
 return{triangles:vertices.length/9,cells:cells.size,
  query(origin:THREE.Vector3,direction:THREE.Vector3,distance:number,radius:number){
   selected.length=0;const endX=origin.x+direction.x*distance,endZ=origin.z+direction.z*distance;
   for(let x=Math.floor((Math.min(origin.x,endX)-radius)/size);x<=Math.floor((Math.max(origin.x,endX)+radius)/size);x++)for(let z=Math.floor((Math.min(origin.z,endZ)-radius)/size);z<=Math.floor((Math.max(origin.z,endZ)+radius)/size);z++){
    const cell=cells.get(x+','+z);if(!cell)continue;
    if(!cell.mesh){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',position);geometry.setIndex(cell.indices);geometry.boundingBox=cell.box.clone().expandByScalar(.001);geometry.boundingSphere=geometry.boundingBox.getBoundingSphere(new THREE.Sphere());cell.mesh=new THREE.Mesh(geometry,material);}
    selected.push(cell.mesh);
   }return selected;
  },
  dispose(){for(const cell of cells.values())cell.mesh?.geometry.dispose();material.dispose();cells.clear();selected.length=0;},
 };
}
type CameraSurface=ReturnType<typeof createCameraSurface>;
const delta=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3(),rayOrigin=new THREE.Vector3(),raycaster=new THREE.Raycaster(),hits:THREE.Intersection[]=[];
const CAMERA_RADIUS=.3,PULLBACK=.12;
/** Contract along the requested direction. Rotation remains the caller's intent;
 * a later vertical shove or Cartesian lerp must not change that orbit direction. */
export function avoidCameraCollision(position:THREE.Vector3,origin:THREE.Vector3,colliders:readonly CameraCollider[],groundHeight:(x:number,z:number)=>number,surfaces:THREE.Object3D[]|CameraSurface=[]):boolean {
 delta.copy(position).sub(origin);const length=delta.length();if(length<1e-6)return false;
 let allowed=length;
 for(const c of colliders){let enter=0,exit=1;const cos=Math.cos(c.yaw??0),sin=Math.sin(c.yaw??0),x=origin.x-c.x,z=origin.z-c.z;
  for(const[start,direction,half]of[[cos*x-sin*z,cos*delta.x-sin*delta.z,c.halfX+CAMERA_RADIUS],[sin*x+cos*z,sin*delta.x+cos*delta.z,c.halfZ+CAMERA_RADIUS]]){
   if(Math.abs(direction)<1e-6){if(Math.abs(start)>half){enter=2;break;}}
   else{const a=(-half-start)/direction,b=(half-start)/direction;enter=Math.max(enter,Math.min(a,b));exit=Math.min(exit,Math.max(a,b));}
  }
  if(enter<=exit&&exit>=0&&enter<=1)allowed=Math.min(allowed,Math.max(0,enter*length-PULLBACK));
 }
 delta.divideScalar(length);
 const completeSurface=!Array.isArray(surfaces),meshBlockers=completeSurface?surfaces.query(origin,delta,allowed+PULLBACK,CAMERA_RADIUS):surfaces;
 if(meshBlockers.length&&allowed>0){
  right.set(delta.z,0,-delta.x);if(right.lengthSq()<1e-6)right.set(1,0,0);else right.normalize();up.crossVectors(delta,right).normalize();
  // Five parallel rays cover the small camera volume, including tunnel walls
  // and its actual curved ceiling. These borrow existing rendered geometry.
  for(const[a,b]of[[0,0],[CAMERA_RADIUS,0],[-CAMERA_RADIUS,0],[0,CAMERA_RADIUS],[0,-CAMERA_RADIUS]]){
   rayOrigin.copy(origin).addScaledVector(right,a).addScaledVector(up,b);raycaster.set(rayOrigin,delta);raycaster.near=0;raycaster.far=allowed+PULLBACK;hits.length=0;raycaster.intersectObjects(meshBlockers,false,hits);
   if(hits.length)allowed=Math.min(allowed,Math.max(0,hits[0].distance-PULLBACK));
  }
 }
 const blocked=(distance:number)=>origin.y+delta.y*distance<groundHeight(origin.x+delta.x*distance,origin.z+delta.z*distance)+CAMERA_RADIUS;
 if(blocked(0))allowed=0;
 else if(!completeSurface){
  // Approximate fallback for height-only callers. Production supplies actual
  // indexed ground triangles, so narrow crests cannot fall between samples.
  const steps=Math.min(192,Math.ceil(allowed/.1));let previous=0;
  for(let i=1;i<=steps;i++){const distance=allowed*i/steps;if(blocked(distance)){
    let low=previous,high=distance;for(let search=0;search<6;search++){const mid=(low+high)/2;if(blocked(mid))high=mid;else low=mid;}
    allowed=Math.max(0,low-PULLBACK);break;
   }previous=distance;}
 }
 position.copy(origin).addScaledVector(delta,allowed);return allowed<length-1e-5;
}
