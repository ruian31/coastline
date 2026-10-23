import assert from'node:assert/strict';
import{NodeIO}from'@gltf-transform/core';
import{createServer}from'vite';
import{writeFile}from'node:fs/promises';
import{scanTopology}from'./solidify-scan.mjs';
const server=await createServer({server:{middlewareMode:true},appType:'custom'}),reports=[];
try{
 const THREE=await server.ssrLoadModule('three'),{scanSurface}=await server.ssrLoadModule('/src/world/ScannedCoast.ts');
 for(const[type,axis]of[['cliff','z'],['reef','y']])for(const lod of['near','far']){
  const folder=type==='cliff'?'coastal_cliff_01':'coastal_reef',doc=await new NodeIO().read(`public/assets/models/${folder}/${type}-${lod}.gltf`),meshes=doc.getRoot().listMeshes(),group=new THREE.Group(),geometries=[],material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  for(const mesh of meshes){assert.equal(scanTopology(mesh).openEdges,0);for(const p of mesh.listPrimitives()){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p.getAttribute('POSITION').getArray(),3));geometry.setIndex(Array.from(p.getIndices().getArray()));geometries.push(geometry);group.add(new THREE.Mesh(geometry,material));}}
  group.updateMatrixWorld(true);const surface=scanSurface(geometries),ray=new THREE.Raycaster();let supported=0,maximumError=0,volumeProbes=0;
  const bounds=surface.bounds;
  // Collision height must agree with an independent raycast through the visible triangles.
  for(let iz=0;iz<17;iz++)for(let ix=0;ix<29;ix++){
   const x=bounds.min.x+(bounds.max.x-bounds.min.x)*(ix+.37)/29,z=bounds.min.z+(bounds.max.z-bounds.min.z)*(iz+.61)/17;
   ray.set(new THREE.Vector3(x,100,z),new THREE.Vector3(0,-1,0));const hit=ray.intersectObject(group)[0],height=surface.height(x,z);
   if(hit){assert.notEqual(height,undefined);const error=Math.abs(height-hit.point.y);maximumError=Math.max(maximumError,error);assert.ok(error<.0001,'terrain support must match the actual highest triangle');supported++;}else assert.equal(height,undefined,'no rectangular invisible collision roof');
  }
  assert.ok(supported>100);
  // Rays from opposing sides must see a substantial entry and exit thickness.
  for(const x of[-25,-10,5,20])for(const other of(type==='cliff'?[2,4,6]:[-12,-4,4])){
   const from=new THREE.Vector3(x,axis==='y'?50:other,axis==='z'?50:other),to=from.clone();to[axis]=-50;
   ray.set(from,new THREE.Vector3(0,axis==='y'?-1:0,axis==='z'?-1:0));const a=ray.intersectObject(group)[0];ray.set(to,new THREE.Vector3(0,axis==='y'?1:0,axis==='z'?1:0));const b=ray.intersectObject(group)[0];
   if(!a||!b)continue;assert.ok(a.point[axis]-b.point[axis]>(type==='cliff'?14:3),'scan has real solid depth from both sides');volumeProbes++;
  }
  assert.ok(volumeProbes>=6);reports.push({type,lod,supported,volumeProbes,maximumHeightError:maximumError,topology:meshes.map(scanTopology)});geometries.forEach(g=>g.dispose());material.dispose();
 }
 const label=process.env.ROCK_CHECK_LABEL??String(Date.now());assert.match(label,/^[a-z0-9-]+$/);const output='artifacts/solid-rock-surface-checks-'+label+'.json';await writeFile(output,JSON.stringify(reports,null,2),{flag:'wx'});console.log(JSON.stringify({output,reports},null,2));
}finally{await server.close();}
