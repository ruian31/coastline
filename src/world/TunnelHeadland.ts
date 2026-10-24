import * as THREE from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {coast,nearestRoad} from './roads';
import {scanSurface} from './SurfaceHeight';

/** One actual surface supplies the rendered headland and its drive/camera
 * height. The bore stays an air corridor, with the roof supported above it. */
export function createTunnelHeadland(mobile:boolean,ground:(x:number,z:number)=>number){
 const start=.6802,end=.7348,along=mobile?34:48,min=-75,max=32,extension=.004;
 // Roof and portal use exactly the same cross-section, including arch knots.
 const offsets=[...new Set([...Array.from({length:33},(_,i)=>THREE.MathUtils.lerp(min,max,i/32)),-60,-45,-30,-20,-12,-8,-6.4,-5.6,-4.5,-3,-1.5,0,1.5,3,4.5,5.6,6.4,8,12,20])].sort((a,b)=>a-b);
 const point=(t:number,offset:number)=>{
  const progress=(t-start)/(end-start),flank=THREE.MathUtils.smoothstep(Math.abs(offset),6.4,12),spread=flank*extension;
  const sample=coast.sample(THREE.MathUtils.lerp(start-spread,end+spread,progress)),p=sample.position.clone().addScaledVector(sample.right,offset),u=(offset-min)/(max-min);
  const weathering=.91+.055*Math.sin(p.x*.12+Math.sin(p.z*.07))+.035*Math.cos(p.z*.11+p.x*.04);
  // Gentle longitudinal shoulders; the central cover encloses the arch.
  const approach=Math.pow(Math.max(0,Math.sin(progress*Math.PI)),1.15),slope=1-flank*(1-approach);
  p.y=ground(p.x,p.z)+Math.pow(Math.max(0,Math.sin(u*Math.PI)),1.25)*(12+18*Math.exp(-(((offset+22)/34)**2)))*weathering*slope;
  return p;
 };
 const rows=Array.from({length:along+1},(_,row)=>offsets.map(offset=>point(THREE.MathUtils.lerp(start,end,row/along),offset))),vertices:number[]=[];
 const triangle=(a:THREE.Vector3,b:THREE.Vector3,c:THREE.Vector3)=>vertices.push(a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z);
 for(let row=0;row<along;row++)for(let col=0;col<offsets.length-1;col++){
  const a=rows[row][col],b=rows[row+1][col],c=rows[row][col+1],d=rows[row+1][col+1];triangle(a,b,c);triangle(b,d,c);
 }
 for(const [t,edge,sign] of [[start,rows[0],-1],[end,rows[along],1]] as const){
  const roadY=coast.sample(t).position.y,tangent=coast.sample(t).tangent;
  for(let col=0;col<offsets.length-1;col++){
   const a=edge[col],b=edge[col+1],c=a.clone(),d=b.clone(),x=offsets[col],x2=offsets[col+1];
   c.y=Math.abs(x)<=6.4?roadY+6.74*Math.sqrt(Math.max(0,1-(x/6.4)**2)):ground(c.x,c.z)-.35;
   d.y=Math.abs(x2)<=6.4?roadY+6.74*Math.sqrt(Math.max(0,1-(x2/6.4)**2)):ground(d.x,d.z)-.35;
   const eroded=(bottom:THREE.Vector3,top:THREE.Vector3,v:number)=>{
    if(v===1)return top; // Preserve the exact shared roof edge.
    const p=bottom.clone().lerp(top,v),relief=Math.sin(v*Math.PI)*.7*(Math.sin(p.x*.21+p.y*.48)+.5*Math.cos(p.z*.23-p.y*.39));
    return p.addScaledVector(tangent,sign*relief);
   };
   for(let layer=0;layer<8;layer++){
    const lowA=eroded(c,a,layer/8),lowB=eroded(d,b,layer/8),topA=eroded(c,a,(layer+1)/8),topB=eroded(d,b,(layer+1)/8);
    if(sign<0){triangle(topA,topB,lowA);triangle(topB,lowB,lowA);}else{triangle(topA,lowA,topB);triangle(topB,lowA,lowB);}
   }
  }
 }
 const raw=new THREE.BufferGeometry();raw.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 const geometry=mergeVertices(raw,.001);raw.dispose();geometry.computeVertexNormals();
 const surface=scanSurface([geometry]);
 return{geometry,groundHeight(x:number,z:number){
  const base=ground(x,z),roof=surface.height(x,z);if(roof===undefined||roof<=base)return base;
  // Continuous road projection identifies the air corridor; prop-exclusion
  // samples cannot invert a deformed, triangulated mountain boundary.
  if(nearestRoad(x,z,coast).distance<6.1)return base;
  return roof;
 }};
}
