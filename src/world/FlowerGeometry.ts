import * as THREE from 'three';
import type {SeasonUniforms} from './Season';

export type FlowerHead={x:number;z:number;height:number};

/** Five small authored heads, merged into the existing world instance batch.
 * Each petal has a curved surface at both ends of the seasonal morph. */
export function createCoastalFlowerGeometry(heads:readonly FlowerHead[],mobile:boolean){
 const positions:number[]=[],closed:number[]=[],colors:number[]=[],parts:number[]=[],indices:number[]=[];
 const p=new THREE.Vector3(),q=new THREE.Vector3();
 function vertex(a:THREE.Vector3,b:THREE.Vector3,color:THREE.Color,petal=0){const id=positions.length/3;positions.push(a.x,a.y,a.z);closed.push(b.x,b.y,b.z);colors.push(color.r,color.g,color.b);parts.push(petal);return id;}
 function same(a:THREE.Vector3,color:THREE.Color){return vertex(a,a,color);}
 function triangle(a:number,b:number,c:number){indices.push(a,b,c);}
 const green=new THREE.Color('#7c8960'),darkGreen=new THREE.Color('#5b6b43'),seedColor=new THREE.Color('#92734c');
 for(const [i,head]of heads.entries()){
  const {x,z,height:h}=head,bendX=Math.sin(i*2.13)*.022,bendZ=Math.cos(i*1.71)*.018;
  // Tapered four-sided stems; one batch keeps these centimetre details cheap.
  const stem=positions.length/3;
  for(let ring=0;ring<2;ring++)for(let side=0;side<4;side++){
   const a=side*Math.PI/2+i*.37,r=ring?.0035:.009;
   same(p.set(x+Math.cos(a)*r+bendX*ring,h*ring,z+Math.sin(a)*r+bendZ*ring),green);
  }
  for(let side=0;side<4;side++){const a=stem+side,b=stem+(side+1)%4,c=a+4,d=b+4;triangle(a,c,b);triangle(b,c,d);}
  triangle(stem,stem+1,stem+2);triangle(stem,stem+2,stem+3);triangle(stem+4,stem+6,stem+5);triangle(stem+4,stem+7,stem+6);
  // Two narrow leaves have a raised central vein rather than a flat diamond.
  for(let leaf=0;leaf<2;leaf++){
   const along=.34+leaf*.25,angle=i*1.9+leaf*2.7,dx=Math.cos(angle),dz=Math.sin(angle),cx=x+bendX*along,cz=z+bendZ*along,cy=h*along;
   const a=same(p.set(cx,cy,cz),darkGreen),b=same(p.set(cx+dx*.048-dz*.016,cy+.012,cz+dz*.048+dx*.016),green),c=same(p.set(cx+dx*.105,cy+.028,cz+dz*.105),green),d=same(p.set(cx+dx*.048+dz*.016,cy+.012,cz+dz*.048-dx*.016),green),e=same(p.set(cx+dx*.05,cy+.022,cz+dz*.05),green);
   triangle(a,b,e);triangle(b,c,e);triangle(c,d,e);triangle(d,a,e);
  }
  const hx=x+bendX,hz=z+bendZ;
  // A small retained seed/receptacle is visible even with the petals closed.
  const seed=positions.length/3;
  for(const [sx,sy,sz]of [[0,.016,0],[.012,0,0],[0,0,.012],[-.012,0,0],[0,0,-.012],[0,-.014,0]])same(p.set(hx+sx,h+sy,hz+sz),seedColor);
  for(let j=0;j<4;j++){const a=seed+1+j,b=seed+1+(j+1)%4;triangle(seed,b,a);triangle(seed+5,a,b);}
  const base=new THREE.Color(i%2?'#b4a2bf':'#d3b875'),radial=mobile?2:3,across=2;
  for(let petal=0;petal<4;petal++){
   const start=positions.length/3,axis=petal*Math.PI/2+i*.31+Math.sin(i*1.7+petal)*.09,width=.63*(.92+.08*Math.cos(i+petal*2.1));
   for(let row=0;row<=radial;row++)for(let col=0;col<=across;col++){
    const t=row/radial,u=col/across*2-1,angle=axis+u*(.16+width*Math.sin(t*Math.PI*.5)),r=.004+.070*t*(1-.22*u*u);
    const openY=h-.006+.020*t+.020*t*t+(.008*u*u+.003*Math.sin(i*1.3+petal))*t;
    const closeR=.004+.017*t*(1-.12*u*u),closeY=h-.006+(.070+.003*Math.sin(i+petal))*t;
    p.set(hx+Math.cos(angle)*r,openY,hz+Math.sin(angle)*r);q.set(hx+Math.cos(angle)*closeR,closeY,hz+Math.sin(angle)*closeR);
    vertex(p,q,base.clone().multiplyScalar(.72+.28*t),1);
   }
   for(let row=0;row<radial;row++)for(let col=0;col<across;col++){const a=start+row*(across+1)+col,b=a+1,c=a+across+1,d=c+1;triangle(a,b,c);triangle(b,d,c);}
  }
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('flowerPetal',new THREE.Float32BufferAttribute(parts,1));geometry.setIndex(indices);geometry.computeVertexNormals();
 const closedGeometry=new THREE.BufferGeometry();closedGeometry.setAttribute('position',new THREE.Float32BufferAttribute(closed,3));closedGeometry.setIndex(indices);closedGeometry.computeVertexNormals();
 geometry.setAttribute('flowerClosedPosition',closedGeometry.getAttribute('position'));geometry.setAttribute('flowerClosedNormal',closedGeometry.getAttribute('normal'));closedGeometry.dispose();
 geometry.computeBoundingBox();for(let i=0;i<closed.length;i+=3)geometry.boundingBox!.expandByPoint(p.fromArray(closed,i));geometry.boundingSphere=geometry.boundingBox!.getBoundingSphere(new THREE.Sphere());return geometry;
}

/** Wrap last so bloom normals are established before the existing pressure
 * normal transform, and bloom positions before ground/wind/pressure offsets. */
export function applyFlowerSeason(material:THREE.MeshStandardMaterial,uniforms:SeasonUniforms){
 const before=material.onBeforeCompile,key=material.customProgramCacheKey();
 material.onBeforeCompile=(shader,renderer)=>{
  before.call(material,shader,renderer);Object.assign(shader.uniforms,uniforms);
  const ground=shader.vertexShader.includes('attribute vec3 instanceGroundSlope;');
  shader.vertexShader='attribute vec3 flowerClosedPosition,flowerClosedNormal;attribute float flowerPetal;uniform float uSeasonBloom;varying float vFlowerPetal;\n'+shader.vertexShader
   .replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
    objectNormal=normalize(mix(flowerClosedNormal,normal,uSeasonBloom));
    ${ground?`#ifdef USE_INSTANCING
    mat3 flowerBasis=mat3(modelMatrix)*mat3(instanceMatrix);
    vec3 flowerWorldNormal=flowerBasis[0]*objectNormal.x/dot(flowerBasis[0],flowerBasis[0])+flowerBasis[1]*objectNormal.y/dot(flowerBasis[1],flowerBasis[1])+flowerBasis[2]*objectNormal.z/dot(flowerBasis[2],flowerBasis[2]);
    flowerWorldNormal.xz-=instanceGroundSlope.xy*flowerWorldNormal.y;
    objectNormal=normalize(vec3(dot(flowerWorldNormal,flowerBasis[0]),dot(flowerWorldNormal,flowerBasis[1]),dot(flowerWorldNormal,flowerBasis[2])));
    #endif`:''}`)
   .replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed=mix(flowerClosedPosition,position,uSeasonBloom);vFlowerPetal=flowerPetal;')
   .replace('vec3 rootOffset=mat3(instanceMatrix)*vec3(position.x,0.0,position.z);','vec3 rootOffset=mat3(instanceMatrix)*vec3(transformed.x,0.0,transformed.z);')
   .replace('float anchoredHeight=max(position.y,0.0);','float anchoredHeight=max(mix(flowerClosedPosition.y,position.y,uSeasonBloom),0.0);')
   .replace('float coastPlantHeight=max(position.y,0.0)*length(coastPlantBasis[1]);','float coastPlantHeight=max(mix(flowerClosedPosition.y,position.y,uSeasonBloom),0.0)*length(coastPlantBasis[1]);');
  shader.fragmentShader='uniform float uSeasonBloom,uSeasonAmount;uniform vec3 uSeasonGrass;varying float vFlowerPetal;\n'+shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   float flowerLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
   if(vFlowerPetal>.5)diffuseColor.rgb=mix(flowerLuma*vec3(1.10,.86,.52),diffuseColor.rgb,smoothstep(.12,.65,uSeasonBloom));
   else diffuseColor.rgb=mix(diffuseColor.rgb,flowerLuma*uSeasonGrass,uSeasonAmount*.55);`);
 };
 material.customProgramCacheKey=()=>key+'-coastal-flower-bloom-v2';
}
