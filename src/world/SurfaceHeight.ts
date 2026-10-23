import * as THREE from 'three';

/** Bucket projected triangles once, then sample the rendered surface without box/curve proxies. */
export function scanSurface(parts:THREE.BufferGeometry[]){
 const bounds=new THREE.Box3();for(const geometry of parts){geometry.computeBoundingBox();bounds.union(geometry.boundingBox!);}
 const cell=2,columns=Math.max(1,Math.ceil((bounds.max.x-bounds.min.x)/cell)),bins=new Map<number,number[]>(),triangles:number[]=[];
 for(const geometry of parts){const p=geometry.getAttribute('position'),indices=geometry.index!,index=indices.array;
  for(let i=0;i<index.length;i+=3){const a=index[i],b=index[i+1],c=index[i+2],ax=p.getX(a),az=p.getZ(a),ay=p.getY(a),bx=p.getX(b)-ax,bz=p.getZ(b)-az,by=p.getY(b)-ay,cx=p.getX(c)-ax,cz=p.getZ(c)-az,cy=p.getY(c)-ay,denominator=bx*cz-bz*cx;
   if(Math.abs(denominator)<1e-8)continue;const offset=triangles.length;triangles.push(ax,az,ay,bx,bz,by,cx,cz,cy,1/denominator);
   const x0=Math.max(0,Math.floor((Math.min(ax,ax+bx,ax+cx)-bounds.min.x)/cell)),x1=Math.min(columns-1,Math.floor((Math.max(ax,ax+bx,ax+cx)-bounds.min.x)/cell)),z0=Math.max(0,Math.floor((Math.min(az,az+bz,az+cz)-bounds.min.z)/cell)),z1=Math.floor((Math.max(az,az+bz,az+cz)-bounds.min.z)/cell);
   for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++){const key=z*columns+x;if(!bins.has(key))bins.set(key,[]);bins.get(key)!.push(offset);}
  }
 }
 const data=new Float64Array(triangles);
 return{bounds,height(x:number,z:number):number|undefined{
  if(x<bounds.min.x||x>bounds.max.x||z<bounds.min.z||z>bounds.max.z)return;
  const key=Math.floor((z-bounds.min.z)/cell)*columns+Math.min(columns-1,Math.floor((x-bounds.min.x)/cell));let height=-Infinity;
  for(const i of bins.get(key)??[]){const dx=x-data[i],dz=z-data[i+1],u=(dx*data[i+7]-dz*data[i+6])*data[i+9],v=(data[i+3]*dz-data[i+4]*dx)*data[i+9];if(u>=-1e-7&&v>=-1e-7&&u+v<=1+1e-7)height=Math.max(height,data[i+2]+u*data[i+5]+v*data[i+8]);}
  return Number.isFinite(height)?height:undefined;
 }};
}
