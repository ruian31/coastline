import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {coast} from './roads';
import {createSeededRandom} from '../utils/random';

/** Scanned hero foliage complements the low-cost procedural distance kit. */
export function createImportedVegetation(scene:THREE.Scene,groundHeight:(x:number,z:number)=>number,mobile:boolean,loadingManager=THREE.DefaultLoadingManager){
 const root=new THREE.Group();root.name='Scanned coastal ferns';scene.add(root);
 const time={value:0},geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();let disposed=false,lowDetail=false;
 const ready=new GLTFLoader(loadingManager).loadAsync(`${import.meta.env.BASE_URL}assets/models/fern_02/fern_02_browser.gltf`).then(gltf=>{
  const sources:THREE.Mesh[]=[];gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh)sources.push(o);});
  if(!sources.length)throw Error('Scanned fern resource contains no meshes');
  const sourceMaterials=new Set<THREE.Material>(),sourceGeometries=new Set<THREE.BufferGeometry>();
  for(const source of sources){sourceGeometries.add(source.geometry);const m=source.material as THREE.MeshStandardMaterial;sourceMaterials.add(m);for(const t of[m.map,m.normalMap,m.roughnessMap,m.metalnessMap,m.aoMap])if(t)textures.add(t);}
  if(disposed){sourceGeometries.forEach(g=>g.dispose());sourceMaterials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());return;}
  const material=(sources[0].material as THREE.MeshStandardMaterial).clone();material.name='Scanned fern leaf PBR';material.alphaTest=.45;material.alphaToCoverage=true;material.transparent=false;material.side=THREE.DoubleSide;material.roughness=.85;material.metalness=0;material.normalScale.set(.6,.6);
  material.onBeforeCompile=shader=>{shader.uniforms.uFernTime=time;shader.vertexShader='uniform float uFernTime;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   float phase=instanceMatrix[3].x*.37+instanceMatrix[3].z*.23;
   float h=max(position.y,0.0);
   transformed.x+=sin(uFernTime*1.2+phase+h*3.0)*h*h*.16;
   transformed.z+=cos(uFernTime*.87+phase)*h*h*.10;`);};material.customProgramCacheKey=()=> 'scanned-fern-wind-v1';materials.add(material);
  const random=createSeededRandom(15347),count=mobile?4:16,dummy=new THREE.Object3D(),beats=[.835,.846,.857,.88,.035,.17,.25,.46,.54,.61,.77,.805,.91,.96,.12,.29];let totalTriangles=0;
  sources.forEach((source,variant)=>{const geometry=source.geometry.clone();geometry.computeBoundingBox();const bounds=geometry.boundingBox!,center=bounds.getCenter(new THREE.Vector3());geometry.translate(-center.x,-bounds.min.y,-center.z);geometries.add(geometry);const instances=new THREE.InstancedMesh(geometry,material,count);instances.name=source.name+'-roadside';instances.receiveShadow=true;instances.castShadow=false;
   for(let i=0;i<count;i++){const t=beats[i]+(variant-1.5)*.0015,s=coast.sample(t),side=(i+variant)%2?1:-1,offset=side*(7.1+random()*1.7),x=s.position.x+s.right.x*offset,z=s.position.z+s.right.z*offset,scale=1.35+random()*.7;dummy.position.set(x,groundHeight(x,z)-.025,z);dummy.rotation.set(0,random()*Math.PI*2,0);dummy.scale.setScalar(scale);dummy.updateMatrix();instances.setMatrixAt(i,dummy.matrix);}
   instances.instanceMatrix.needsUpdate=true;instances.computeBoundingSphere();instances.userData.fullCount=count;instances.count=lowDetail?Math.max(1,Math.floor(count*.5)):count;root.add(instances);totalTriangles+=(geometry.index?geometry.index.count:geometry.getAttribute('position').count)/3*count;
  });
  sourceMaterials.forEach(m=>m.dispose());sourceGeometries.forEach(g=>g.dispose());root.userData.diagnostics={models:sources.length,instances:sources.length*count,triangles:totalTriangles,materials:1,textures:textures.size};
 });
 return{ready,root,setLowDetail(enabled:boolean){lowDetail=enabled;for(const child of root.children)if(child instanceof THREE.InstancedMesh)child.count=enabled?Math.max(1,Math.floor(child.userData.fullCount*.5)):child.userData.fullCount;},update(elapsed:number){time.value=elapsed;},dispose(){disposed=true;root.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
