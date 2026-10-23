import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {coast} from './roads';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createSeededRandom} from '../utils/random';

/** Bucket projected triangles once, then sample the actual rock surface without road/box proxies. */
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

/** Photographed faces plus authored solid rock bodies, overlapping land and extending below the sea. */
export function createScannedCoast(scene:THREE.Scene,ground:(x:number,z:number)=>number,mobile:boolean,manager:THREE.LoadingManager,rockMaterial:THREE.MeshStandardMaterial){
 const root=new THREE.Group();root.name='Eroded sandstone headland';scene.add(root);
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
 const sections:{group:THREE.Group;inverse:THREE.Matrix4;surface:ReturnType<typeof scanSurface>}[]=[];
 const bodyMaterial=rockMaterial.clone();bodyMaterial.name='Metre textured solid sandstone';bodyMaterial.vertexColors=false;bodyMaterial.color.set('#d7cfbc');materials.add(bodyMaterial);
 const localPoint=new THREE.Vector3();
 let disposed=false;const time={value:0};
 const cliffsReady=new GLTFLoader(manager).loadAsync(`${import.meta.env.BASE_URL}assets/models/coastal_cliff_01/cliff-${mobile?'far':'near'}.gltf`).then(gltf=>{
  const sources:THREE.Mesh[]=[];gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh)sources.push(o);});
  if(!sources.length)throw Error('Coastal scan has no mesh');
  for(const source of sources){
   geometries.add(source.geometry);const material=source.material as THREE.MeshStandardMaterial;materials.add(material);
   if(material.name==='solid-rock-body'){source.material=bodyMaterial;continue;}
   for(const t of[material.map,material.normalMap,material.aoMap,material.roughnessMap,material.metalnessMap])if(t){t.anisotropy=mobile?4:8;textures.add(t);}
   material.roughness=.94;material.normalScale.set(.75,.75);material.aoMapIntensity=.8;material.side=THREE.FrontSide;
  }
  if(!disposed){const surface=scanSurface(sources.map(source=>source.geometry));
   for(const [i,placement]of[{t:.827,shore:false},{t:.875,shore:false},{t:.829,shore:true},{t:.927,shore:true}].entries()){
    const sample=coast.sample(placement.t),offset=placement.shore?17.5:-21,x=sample.position.x+sample.right.x*offset,z=sample.position.z+sample.right.z*offset;
    const group=new THREE.Group();group.name=`sandstone-cut-${i}`;group.position.set(x,sample.position.y-(placement.shore?10.2:2.4),z);group.rotation.y=Math.atan2(sample.right.x,sample.right.z);group.scale.set(1.06,placement.shore?1:.83+(i%2)*.10,1.15);
    for(const source of sources){const mesh=new THREE.Mesh(source.geometry,source.material);mesh.name=source.material===bodyMaterial?'Closed sandstone side and back':'Photographed sandstone face';mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
    root.add(group);group.updateMatrixWorld(true);sections.push({group,inverse:group.matrixWorld.clone().invert(),surface});
   }
  }
  if(disposed){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}
  root.userData.diagnostics={source:'Poly Haven Coastal Cliff 01 + authored closed body',lod:mobile?'far':'near',triangles:sources.reduce((sum,source)=>sum+source.geometry.index!.count/3,0)*4,instances:4};
 });
 const shrubsReady=new GLTFLoader(manager).loadAsync(`${import.meta.env.BASE_URL}assets/models/coastal_shrubs/shrubs.gltf`).then(gltf=>{
  const random=createSeededRandom(82762),dummy=new THREE.Object3D(),variants=gltf.scene.children.filter(o=>o instanceof THREE.Group);
  for(const [variant,group]of variants.entries()){
   const meshes:THREE.Mesh[]=[];group.traverse(o=>{if(o instanceof THREE.Mesh)meshes.push(o);});
   for(const mesh of meshes){geometries.add(mesh.geometry);const m=mesh.material as THREE.MeshStandardMaterial;materials.add(m);for(const t of[m.map,m.normalMap,m.aoMap,m.roughnessMap,m.metalnessMap])if(t)textures.add(t);}
   if(disposed||!meshes.length||(mobile&&variant===0))continue;
   const geometry=mergeGeometries(meshes.map(mesh=>mesh.geometry),false);geometries.add(geometry);
   const material=(meshes[0].material as THREE.MeshStandardMaterial).clone();materials.add(material);material.alphaTest=.45;material.transparent=false;material.alphaToCoverage=true;material.side=THREE.DoubleSide;material.normalScale.set(.55,.55);
   material.onBeforeCompile=shader=>{shader.uniforms.uShrubTime=time;shader.vertexShader='uniform float uShrubTime;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    float h=max(position.y,0.0);float phase=instanceMatrix[3].x*.37+instanceMatrix[3].z*.13;
    transformed.x+=sin(uShrubTime*1.05+phase)*h*h*.055;
    transformed.z+=cos(uShrubTime*.8+phase)*h*h*.035;`);};material.customProgramCacheKey=()=> 'scanned-dry-shrub-v1';
   const count=mobile?12:14,instances=new THREE.InstancedMesh(geometry,material,count);instances.name='Scanned dry coastal scrub '+variant;instances.receiveShadow=true;instances.castShadow=!mobile;
   const beats=mobile?[.834,.85,.874,.902]:[.817,.832,.849,.867,.884,.903,.924];
   for(let i=0;i<count;i++){
    const t=beats[Math.floor(i/(mobile?3:2))]+(random()-.5)*.004,sample=coast.sample(t),side=i%4===0?1:-1,offset=side*(8.2+random()*(side===1?2.2:4.8));
    const x=sample.position.x+sample.right.x*offset,z=sample.position.z+sample.right.z*offset,scale=2.3+random()*1.8;
    dummy.position.set(x,ground(x,z)-.035,z);dummy.rotation.set(0,random()*Math.PI*2,0);dummy.scale.set(scale,scale*(.82+random()*.25),scale);dummy.updateMatrix();instances.setMatrixAt(i,dummy.matrix);
   }
   instances.computeBoundingSphere();root.add(instances);
  }
  if(disposed){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}
 });
 const reefReady=new GLTFLoader(manager).loadAsync(`${import.meta.env.BASE_URL}assets/models/coastal_reef/reef-${mobile?'far':'near'}.gltf`).then(gltf=>{
  const sources:THREE.Mesh[]=[];gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh)sources.push(o);});
  for(const source of sources){
   geometries.add(source.geometry);const material=source.material as THREE.MeshStandardMaterial;materials.add(material);
   if(material.name==='solid-rock-body'){source.material=bodyMaterial;continue;}
   for(const t of[material.map,material.normalMap,material.aoMap,material.roughnessMap,material.metalnessMap])if(t){t.anisotropy=mobile?4:8;textures.add(t);}
   material.normalScale.set(.65,.65);material.roughness=.86;material.side=THREE.FrontSide;
  }
  if(!disposed){const surface=scanSurface(sources.map(source=>source.geometry));
   for(const [index,t]of[.826,.929].entries()){
    const sample=coast.sample(t),group=new THREE.Group();group.name='Intertidal rock shelf '+index;group.position.copy(sample.position).addScaledVector(sample.right,38);group.position.y=-.15;group.rotation.y=Math.atan2(sample.right.x,sample.right.z)+index*.13;group.scale.set(.76,1.2,.55);
    for(const source of sources){const mesh=new THREE.Mesh(source.geometry,source.material);mesh.receiveShadow=true;group.add(mesh);}root.add(group);group.updateMatrixWorld(true);sections.push({group,inverse:group.matrixWorld.clone().invert(),surface});
   }
  }
  if(disposed){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}
 });
 const ready=Promise.all([cliffsReady,shrubsReady,reefReady]).then(()=>undefined);
 return{ready,root,
  update(position:THREE.Vector3,elapsed:number){time.value=elapsed;for(const section of sections)section.group.visible=section.group.position.distanceToSquared(position)<260*260;},
  groundHeight(x:number,z:number){let y=ground(x,z);for(const section of sections){localPoint.set(x,0,z).applyMatrix4(section.inverse);const top=section.surface.height(localPoint.x,localPoint.z);if(top!==undefined)y=Math.max(y,section.group.position.y+top*section.group.scale.y);}return y;},
  dispose(){disposed=true;root.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}
 };
}
