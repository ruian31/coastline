// Reuse the already licensed Fern 02 maps at runtime. This derived glTF has
// geometry only, so loading it cannot create duplicate texture objects.
import {Document,NodeIO} from '@gltf-transform/core';
import {MeshoptSimplifier} from 'meshoptimizer';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const source='public/assets/models/fern_02',output='public/assets/models/coastal_ferns',io=new NodeIO();
const manifest=JSON.parse(await readFile(`${source}/runtime-manifest.json`,'utf8')),provenance=JSON.parse(await readFile(`${source}/source.json`,'utf8')),inputs=[];
for(const entry of manifest.runtimeFiles){const data=await readFile(`${source}/${entry.path}`);assert.equal(createHash('sha256').update(data).digest('hex'),entry.sha256);inputs.push(entry);}
const original=await io.read(`${source}/fern_02_browser.gltf`),doc=new Document(),buffer=doc.createBuffer().setURI('ferns.bin'),material=doc.createMaterial('Borrow existing Fern 02 material at runtime').setDoubleSided(true).setRoughnessFactor(.85),scene=doc.createScene('Rooted curved coastal ferns'),variants=[];
await MeshoptSimplifier.ready;
for(const [variant,name]of ['Plane.006','Plane.059'].entries()){
 const primitive=original.getRoot().listMeshes().find(m=>m.getName()===name).listPrimitives()[0],pos=primitive.getAttribute('POSITION').getArray(),normal=primitive.getAttribute('NORMAL').getArray(),uv=primitive.getAttribute('TEXCOORD_0').getArray(),indices=primitive.getIndices().getArray();
 const parent=Array.from({length:pos.length/3},(_,i)=>i),find=i=>{while(parent[i]!==i)i=parent[i];return i;};
 for(let i=0;i<indices.length;i+=3){parent[find(indices[i+1])]=find(indices[i]);parent[find(indices[i+2])]=find(indices[i]);}
 const groups=new Map();for(let i=0;i<indices.length;i+=3){const k=find(indices[i]),group=groups.get(k)??[];group.push(...indices.slice(i,i+3));groups.set(k,group);}
 const minimum=[0,1,2].map(axis=>Math.min(...Array.from({length:pos.length/3},(_,i)=>pos[i*3+axis]))),maximum=[0,1,2].map(axis=>Math.max(...Array.from({length:pos.length/3},(_,i)=>pos[i*3+axis]))),root=[(minimum[0]+maximum[0])/2,minimum[1],(minimum[2]+maximum[2])/2],scale=[2.1,2.4,2.1];
 for(const lod of ['near','far']){
  const positions=[],normals=[],uvs=[],outIndices=[];let maxError=0;
  for(const group of groups.values()){
   const unique=[...new Set(group)],lookup=new Map(unique.map((v,i)=>[v,i])),p=new Float32Array(unique.flatMap(i=>Array.from(pos.slice(i*3,i*3+3)))),attributes=new Float32Array(unique.flatMap(i=>[...normal.slice(i*3,i*3+3),...uv.slice(i*2,i*2+2)])),local=new Uint32Array(group.map(i=>lookup.get(i)));
   const [simplified,error]=lod==='near'?[local,0]:MeshoptSimplifier.simplifyWithAttributes(local,p,3,attributes,5,[.015,.015,.015,.05,.05],null,28*3,.035);
   assert.ok(simplified.length>=6,'Every original curved frond must survive');maxError=Math.max(maxError,error);
   const kept=[...new Set(simplified)],remap=new Map(kept.map((v,i)=>[v,i+positions.length/3]));
   for(const i of kept){for(let axis=0;axis<3;axis++)positions.push((p[i*3+axis]-root[axis])*scale[axis]);const n=scale.map((s,axis)=>attributes[i*5+axis]/s),length=Math.hypot(...n);normals.push(...n.map(v=>v/length));uvs.push(attributes[i*5+3],attributes[i*5+4]);}
   outIndices.push(...Array.from(simplified,i=>remap.get(i)));
  }
  const mesh=doc.createMesh(`Coastal fern ${variant} ${lod}`).addPrimitive(doc.createPrimitive().setAttribute('POSITION',doc.createAccessor().setType('VEC3').setArray(new Float32Array(positions)).setBuffer(buffer)).setAttribute('NORMAL',doc.createAccessor().setType('VEC3').setArray(new Float32Array(normals)).setBuffer(buffer)).setAttribute('TEXCOORD_0',doc.createAccessor().setType('VEC2').setArray(new Float32Array(uvs)).setBuffer(buffer)).setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint16Array(outIndices)).setBuffer(buffer)).setMaterial(material));scene.addChild(doc.createNode(mesh.getName()).setMesh(mesh));
  variants.push({variant,lod,sourceMesh:name,sourceTriangles:indices.length/3,fronds:groups.size,triangles:outIndices.length/3,vertices:positions.length/3,maxError,root,scale});assert.ok(positions.every(Number.isFinite)&&normals.every(Number.isFinite));
 }
}
await mkdir(output,{recursive:true});await io.write(`${output}/ferns.gltf`,doc);const preparedAssets=[];
for(const path of ['ferns.gltf','ferns.bin']){const data=await readFile(`${output}/${path}`);preparedAssets.push({path,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});}
await writeFile(`${output}/source.json`,JSON.stringify({asset:'fern_02',page:provenance.page,license:provenance.license,authors:provenance.authors,inputs,conversion:'Reuse two smaller full Fern 02 plants. Preserve every connected curved frond in both LODs, simplify far fronds independently, keep original UVs and normals with inverse-scale correction, root at original minimum Y. Geometry-only glTF; runtime must borrow the already loaded Fern 02 material and its three textures. No new bitmap.',variants,preparedAssets},null,2)+'\n');console.log(JSON.stringify({output,variants,preparedAssets}));
