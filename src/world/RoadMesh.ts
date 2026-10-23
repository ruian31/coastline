import * as THREE from 'three';
import { roads,coast,heightAt,nearestRoad,roadSurfaceHeight,vergeHeight,SHOULDER_WIDTH,VERGE_WIDTH,guardrailSpans,type RoadRoute } from './roads';
import {createSeededRandom} from '../utils/random';
export function createRoadMesh(scene:THREE.Scene,loadingManager=THREE.DefaultLoadingManager,ground=heightAt,terrainMaterial?:THREE.Material){
 const root=new THREE.Group();root.name='road-network';scene.add(root);const vergeGeometries:THREE.BufferGeometry[]=[];
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d')!,rng=createSeededRandom(814);
 ctx.fillStyle='#494c49';ctx.fillRect(0,0,256,256);
 for(let i=0;i<18000;i++){const v=60+Math.floor(rng()*44);ctx.fillStyle=`rgba(${v},${v+1},${v},.25)`;ctx.fillRect(rng()*256,rng()*256,1+rng(),1);}
 const map=new THREE.CanvasTexture(canvas);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
 const loader=new THREE.TextureLoader(loadingManager);const runtimeMaps:THREE.Texture[]=[];const loadRoad=(name:string,color=false)=>{const texture=loader.load(`${import.meta.env.BASE_URL}assets/environment/road-${name}.jpg`);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=8;if(color)texture.colorSpace=THREE.SRGBColorSpace;runtimeMaps.push(texture);return texture;};
 const asphalt=new THREE.MeshStandardMaterial({map:loadRoad('color',true),normalMap:loadRoad('normal'),normalScale:new THREE.Vector2(.35,.35),roughnessMap:loadRoad('roughness'),roughness:.95,color:0xb8b8b3}),gravel=new THREE.MeshStandardMaterial({color:0xbcb09a,roughness:1}),paint=new THREE.MeshStandardMaterial({color:0xeee1b7,roughness:.88}),steel=new THREE.MeshStandardMaterial({color:0xa6aaa0,metalness:.65,roughness:.44});
 asphalt.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor = .82 + .16 * roughnessFactor;');};asphalt.customProgramCacheKey=()=> 'coast-dry-asphalt-v1';
 function strip(route:RoadRoute,lo:number,hi:number,y:number,material:THREE.Material){const n=Math.ceil(route.length/2),p:number[]=[],uv:number[]=[],idx:number[]=[];
 for(let i=0;i<=n;i++){const s=route.sample(i/n);for(const x of[lo,hi]){p.push(s.position.x+s.right.x*x,s.position.y+y,s.position.z+s.right.z*x);uv.push(x/3,i*route.length/n/3);}
 if(i<n){const k=i*2;idx.push(k,k+2,k+1,k+1,k+2,k+3);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const m=new THREE.Mesh(g,material);m.receiveShadow=true;root.add(m);return m;}
 function verge(route:RoadRoute,side:number){
 const n=Math.ceil(route.length/3),rows=[0,.25,.5,.75,1,1.08],p:number[]=[],uv:number[]=[],idx:number[]=[];
 for(let i=0;i<=n;i++){const sample=route.sample(i/n);for(const f of rows){const offset=side*(route.width/2+SHOULDER_WIDTH+VERGE_WIDTH*f),x=sample.position.x+sample.right.x*offset,z=sample.position.z+sample.right.z*offset;
 p.push(x,f>1?ground(x,z)-.12:vergeHeight(sample,route.width,offset,ground),z);uv.push(offset/3,i*route.length/n/3);}
 if(i<n)for(let j=0;j<rows.length-1;j++){const a=i*rows.length+j,b=a+rows.length;if(side>0)idx.push(a,b,a+1,a+1,b,b+1);else idx.push(a,a+1,b,a+1,b+1,b);}}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(idx);geometry.computeVertexNormals();vergeGeometries.push(geometry);const mesh=new THREE.Mesh(geometry,terrainMaterial??gravel);mesh.name=`Graded ${route.id} verge ${side}`;mesh.receiveShadow=true;root.add(mesh);
 }
 for(const road of roads){for(const side of[-1,1])verge(road,side);strip(road,-road.width/2-SHOULDER_WIDTH,road.width/2+SHOULDER_WIDTH,-.055,terrainMaterial??gravel);strip(road,-road.width/2,road.width/2,0,asphalt);
 for(const side of[-1,1]){const d=side*(road.width/2-.3);strip(road,d-.055,d+.055,.017,paint);}
 const n=Math.floor(road.length/10),marks=new THREE.InstancedMesh(new THREE.BoxGeometry(.12,.018,3.3),paint,n),dummy=new THREE.Object3D();for(let i=0;i<n;i++){const s=road.sample((i+.5)/n);dummy.position.copy(s.position);dummy.position.y+=.021;dummy.rotation.set(-Math.asin(s.tangent.y),Math.atan2(s.tangent.x,s.tangent.z),0);dummy.updateMatrix();marks.setMatrixAt(i,dummy.matrix);}marks.instanceMatrix.needsUpdate=true;root.add(marks);}
 // Continuous outside guardrail, split around the town and two scenic pullouts.
 const spans=guardrailSpans;
 const railGeos:THREE.BufferGeometry[]=[];let postCount=0;for(const[s,e]of spans)postCount+=Math.ceil((e-s)*coast.length/7);
 const posts=new THREE.InstancedMesh(new THREE.BoxGeometry(.13,.85,.13),steel,postCount),dummy=new THREE.Object3D();let k=0;
 for(const[start,end]of spans){const n=Math.ceil((end-start)*coast.length/3),points:THREE.Vector3[]=[];for(let i=0;i<=n;i++){const s=coast.sample(start+(end-start)*i/n);points.push(s.position.clone().addScaledVector(s.right,coast.width/2+.65).add(new THREE.Vector3(0,.8,0)));}const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),n,.065,4,false);railGeos.push(g);const rail=new THREE.Mesh(g,steel);root.add(rail);
 const num=Math.ceil((end-start)*coast.length/7);for(let j=0;j<num;j++){const s=coast.sample(start+(end-start)*j/num);dummy.position.copy(s.position).addScaledVector(s.right,coast.width/2+.65);dummy.position.y+=.4;dummy.updateMatrix();posts.setMatrixAt(k++,dummy.matrix);}}
 root.add(posts);posts.instanceMatrix.needsUpdate=true;
 return{root,vergeGeometries,surfaceHeight:(x:number,z:number)=>roadSurfaceHeight(nearestRoad(x,z),x,z,ground),dispose(){root.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});[asphalt,gravel,paint,steel].forEach(m=>m.dispose());map.dispose();runtimeMaps.forEach(t=>t.dispose());scene.remove(root);}};
}
