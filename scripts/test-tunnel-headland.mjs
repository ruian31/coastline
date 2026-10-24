// Independent triangle rays and open-edge topology, including side flanks that
// a central driving-clearance check cannot see. No browser or GPU is used.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import * as THREE from 'three';
import {createServer} from 'vite';
const label=process.env.TUNNEL_CHECK_LABEL??String(Date.now());assert.match(label,/^[a-z0-9-]+$/);
const out=`artifacts/tunnel-surface-${label}`;await mkdir(out);
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try{
 const {createTunnelHeadland}=await server.ssrLoadModule('/src/world/TunnelHeadland.ts'),{coast,heightAt,nearestRoad}=await server.ssrLoadModule('/src/world/roads.ts'),{avoidCameraCollision}=await server.ssrLoadModule('/src/systems/CameraCollision.ts'),results=[];
 for(const mobile of [false,true])for(const relief of [false,true]){
  const ground=(x,z)=>heightAt(x,z)+(relief?1.2*Math.sin(x*.07)*Math.cos(z*.06):0),model=createTunnelHeadland(mobile,ground),geometry=model.geometry,material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),mesh=new THREE.Mesh(geometry,material),ray=new THREE.Raycaster();mesh.updateMatrixWorld(true);geometry.computeBoundingBox();
  const p=geometry.getAttribute('position'),indices=geometry.index.array,bounds=geometry.boundingBox,edges=new Map();let checked=0,roofSamples=0,maxHeightError=0,missingRoof=0;
  const actual=(x,z)=>{ray.set(new THREE.Vector3(x,200,z),new THREE.Vector3(0,-1,0));return ray.intersectObject(mesh)[0]?.point.y;};
  for(let x=bounds.min.x-.1;x<bounds.max.x+.2;x+=2.7)for(let z=bounds.min.z-.1;z<bounds.max.z+.2;z+=2.7){
   const roof=actual(x,z),road=nearestRoad(x,z,coast);if(road.distance<6.4)continue;
   const expected=Math.max(ground(x,z),roof??-Infinity),got=model.groundHeight(x,z),error=Math.abs(expected-got);maxHeightError=Math.max(maxHeightError,error);if(roof!==undefined&&roof>ground(x,z)+.1){roofSamples++;if(got<roof-.1)missingRoof++;}checked++;
  }
  for(let i=0;i<indices.length;i+=3)for(let j=0;j<3;j++){const a=indices[i+j],b=indices[i+(j+1)%3],key=[Math.min(a,b),Math.max(a,b)].join(',');edges.set(key,(edges.get(key)??0)+1);}
  const badEdges=[];let boundary=0;
  for(const [key,count] of edges){assert.ok(count<=2,'non-manifold headland edge');if(count!==1)continue;boundary++;const vertices=key.split(',').map(Number).map(i=>({x:p.getX(i),y:p.getY(i),z:p.getZ(i)}));if(vertices.some(v=>v.y>ground(v.x,v.z)+.05&&nearestRoad(v.x,v.z,coast).distance>6.6))badEdges.push(vertices);}
  let airChecks=0;for(let i=0;i<=20;i++)for(const offset of [-4.3,0,4.3]){const s=coast.sample(.681+i/20*.053),v=s.position.clone().addScaledVector(s.right,offset);assert.equal(model.groundHeight(v.x,v.z),ground(v.x,v.z),'preserve central air corridor');airChecks++;}
  const s=coast.sample(.735),origin=s.position.clone().addScaledVector(s.right,-4),yaw=Math.atan2(s.tangent.x,s.tangent.z)+Math.PI/2;origin.y=ground(origin.x,origin.z)+1.15;const camera=origin.clone().add(new THREE.Vector3(-Math.sin(yaw)*5.8,2.1,-Math.cos(yaw)*5.8));avoidCameraCollision(camera,origin,[],model.groundHeight);
  const cameraRoof=nearestRoad(camera.x,camera.z,coast).distance<6.1?undefined:actual(camera.x,camera.z),cameraFloor=Math.max(ground(camera.x,camera.z),cameraRoof??-Infinity);assert.ok(camera.y>=cameraFloor+.54,'side camera must remain above actual solid geometry');
  const result={mobile,relief,triangles:indices.length/3,checked,roofSamples,maxHeightError,missingRoof,boundaryEdges:boundary,openElevatedEdges:badEdges.length,airChecks,camera:camera.toArray(),cameraFloor};results.push(result);
  await writeFile(`${out}/${mobile?'mobile':'desktop'}-${relief?'relief':'base'}.json`,JSON.stringify({result,badEdges},null,2),{flag:'wx'});console.log(JSON.stringify(result));
  assert.ok(roofSamples>100);assert.ok(maxHeightError<.001);assert.equal(missingRoof,0);assert.deepEqual(badEdges,[]);geometry.dispose();material.dispose();
 }
 await writeFile(`${out}/summary.json`,JSON.stringify(results,null,2),{flag:'wx'});
}finally{await server.close();}
