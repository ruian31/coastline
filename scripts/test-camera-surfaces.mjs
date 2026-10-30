import {createServer} from 'vite';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';

const context=new Proxy({measureText:()=>({width:10}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>context})};
const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',logLevel:'error'}),reports=[];
// Preserve M59's exact obstructed ray in the first shop's local coordinates.
// Cape grading changes 3D curve length and hence the town's world placement.
// The awning geometry, ray length and first-hit assertion remain unchanged.
const original={origin:[-151.64982094051373,11.572793955371,208.9926214241251],desired:[-156.7213778378672,14.722793955371,202.04716890921247],firstHit:4.624915580877807,legacyResultDistance:7.934821390894517};
const local={origin:[-3.9081094522123436,1.584392740439041,7.428601009777793],desired:[3.6157141893453826,4.73439274043904,3.2630184801984683]};
try {
 const THREE=await server.ssrLoadModule('three');
 const {createLandmarks}=await server.ssrLoadModule('/src/world/Landmarks.ts');
 const {coast,heightAt}=await server.ssrLoadModule('/src/world/roads.ts');
 const {createSeededRandom}=await server.ssrLoadModule('/src/utils/random.ts');
 const {avoidCameraCollision,createCameraSurface}=await server.ssrLoadModule('/src/systems/CameraCollision.ts');
 const random=createSeededRandom(99184);random();const depth=6.6+random()*2;
 const sample=coast.sample(.337),position=sample.position.clone().addScaledVector(sample.right,-(12+depth/2)),direction=sample.tangent.clone();
 direction.y=0;direction.normalize();position.y=Math.max(sample.position.y-.22,heightAt(position.x,position.z)-.6);
 const frame=new THREE.Matrix4().makeBasis(direction,new THREE.Vector3(0,1,0),sample.right).setPosition(position);
 for(const mobile of [true,false]) {
  const scene=new THREE.Scene(),world=createLandmarks(scene,mobile);scene.updateMatrixWorld(true);
  const origin=new THREE.Vector3(...local.origin).applyMatrix4(frame),desired=new THREE.Vector3(...local.desired).applyMatrix4(frame);
  const ray=new THREE.Raycaster(origin,desired.clone().sub(origin).normalize(),0,origin.distanceTo(desired)),all=[];
  scene.traverse(object=>{if(object.isMesh)all.push(object);});
  const first=ray.intersectObjects(all,false)[0];
  assert.ok(first?.object.name.startsWith('Cream awning stripes'));
  assert.ok(Math.abs(first.distance-original.firstHit)<1e-5);
  const surface=createCameraSurface(world.cameraMeshes.map(mesh=>({geometry:mesh.geometry,transform:mesh.matrixWorld}))),camera=desired.clone();
  assert.ok(avoidCameraCollision(camera,origin,world.cameraColliders,heightAt,surface));
  const distance=camera.distanceTo(origin);assert.ok(distance<first.distance-.1);
  ray.far=distance;assert.equal(ray.intersectObjects(all,false).length,0);
  reports.push({mobile,mesh:first.object.name,firstHitDistance:first.distance,requested:origin.distanceTo(desired),newDistance:distance,legacyResultDistance:original.legacyResultDistance,sourceTriangles:surface.triangles,cells:surface.cells,origin:origin.toArray(),desired:desired.toArray(),camera:camera.toArray()});
  surface.dispose();world.dispose();
 }
 await writeFile(process.env.CAMERA_SURFACE_REPORT??'artifacts/camera-surface-regression.json',JSON.stringify({method:'CPU-only source Landmarks with no-op 2D canvas; exact authored positions/transforms, no raster/material/phone evidence. M59 ray rebased in the same first-shop local frame after intentional route reparameterization; fixed first awning hit and distance preserved. Production collision index must contract before the awning and an independent ray to the result must be clear. Both geometry tiers.',original,local,frame:frame.toArray(),reports},null,2));
 console.log(JSON.stringify(reports));
} finally {await server.close();delete globalThis.document;}
