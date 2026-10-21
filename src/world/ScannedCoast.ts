import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {coast} from './roads';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createSeededRandom} from '../utils/random';

/** Representative headland. Scans replace the smooth bank; original high meshes stay offline. */
export function createScannedCoast(scene:THREE.Scene,ground:(x:number,z:number)=>number,mobile:boolean,manager:THREE.LoadingManager){
 const root=new THREE.Group();root.name='Eroded sandstone headland';scene.add(root);
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
 const sections:{mesh:THREE.Mesh;center:THREE.Vector3;right:THREE.Vector3;halfWidth:number;halfDepth:number;top:number}[]=[];
 let disposed=false;const time={value:0};
 const cliffsReady=new GLTFLoader(manager).loadAsync(`${import.meta.env.BASE_URL}assets/models/coastal_cliff_01/cliff-${mobile?'far':'near'}.gltf`).then(gltf=>{
  const sources:THREE.Mesh[]=[];gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh)sources.push(o);});
  if(!sources.length)throw Error('Coastal scan has no mesh');
  for(const source of sources){
   geometries.add(source.geometry);const material=source.material as THREE.MeshStandardMaterial;materials.add(material);
   for(const t of[material.map,material.normalMap,material.aoMap,material.roughnessMap,material.metalnessMap])if(t){t.anisotropy=mobile?4:8;textures.add(t);}
   material.roughness=.94;material.normalScale.set(.75,.75);material.aoMapIntensity=.8;
   if(disposed)continue;
   source.geometry.computeBoundingBox();const box=source.geometry.boundingBox!;
   // Local +Z is the photographed face. It faces the road and sea, with its back buried in land.
   for(const [i,placement]of[{t:.827,shore:false},{t:.875,shore:false},{t:.829,shore:true},{t:.927,shore:true}].entries()){
    const sample=coast.sample(placement.t),offset=placement.shore?17.5:-21,x=sample.position.x+sample.right.x*offset,z=sample.position.z+sample.right.z*offset;
    const mesh=new THREE.Mesh(source.geometry,material);mesh.name=`sandstone-cut-${i}`;
    mesh.position.set(x,sample.position.y-(placement.shore?10.2:2.4),z);mesh.rotation.y=Math.atan2(sample.right.x,sample.right.z);mesh.scale.set(1.06,placement.shore?1:.83+(i%2)*.10,1.15);
    mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);
    sections.push({mesh,center:mesh.position.clone(),right:sample.right,halfWidth:(box.max.x-box.min.x)*.53,halfDepth:6.5,top:mesh.position.y+box.max.y*mesh.scale.y});
   }
  }
  if(disposed){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}
  root.userData.diagnostics={source:'Poly Haven Coastal Cliff 01',lod:mobile?'far':'near',triangles:(mobile?6000:23994)*sections.length,instances:sections.length};
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
  gltf.scene.traverse(o=>{
   if(!(o instanceof THREE.Mesh))return;
   geometries.add(o.geometry);const material=o.material as THREE.MeshStandardMaterial;materials.add(material);
   for(const t of[material.map,material.normalMap,material.aoMap,material.roughnessMap,material.metalnessMap])if(t){t.anisotropy=mobile?4:8;textures.add(t);}
   material.normalScale.set(.65,.65);material.roughness=.86;
   if(disposed)return;
   for(const [index,t]of[.826,.929].entries()){
    const sample=coast.sample(t),mesh=new THREE.Mesh(o.geometry,material);
    mesh.name='Intertidal rock shelf '+index;mesh.position.copy(sample.position).addScaledVector(sample.right,38);mesh.position.y=-.15;mesh.rotation.y=Math.atan2(sample.right.x,sample.right.z)+index*.13;mesh.scale.set(.76,1.2,.55);mesh.receiveShadow=true;root.add(mesh);
   }
  });
  if(disposed){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}
 });
 const ready=Promise.all([cliffsReady,shrubsReady,reefReady]).then(()=>undefined);
 return{ready,root,
  update(position:THREE.Vector3,elapsed:number){time.value=elapsed;for(const section of sections)section.mesh.visible=section.center.distanceToSquared(position)<260*260;},
  groundHeight(x:number,z:number){let y=ground(x,z);for(const section of sections){const dx=x-section.center.x,dz=z-section.center.z,lateral=dx*section.right.x+dz*section.right.z,along=dx*section.right.z-dz*section.right.x;if(Math.abs(along)<section.halfWidth+1&&Math.abs(lateral)<section.halfDepth+1)y=Math.max(y,section.top);}return y;},
  dispose(){disposed=true;root.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}
 };
}
