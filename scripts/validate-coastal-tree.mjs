import assert from 'node:assert/strict';
import {NodeIO} from '@gltf-transform/core';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
const root='public/assets/models/coastal_tree',meta=JSON.parse(await readFile(root+'/source.json','utf8'));
for(const item of meta.preparedAssets){const bytes=await readFile(root+'/'+item.file);assert.equal(bytes.length,item.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256);}
for(const item of meta.bakerInputs)assert.equal(createHash('sha256').update(await readFile(item.file)).digest('hex'),item.sha256);
assert.equal(meta.license,'CC0-1.0');assert.deepEqual(meta.bake.errors,[]);assert.equal(meta.bake.views.length,765);
for(const lod of['near','far'])assert.equal(meta.clusters.filter(c=>c.lod===lod).reduce((n,c)=>n+c.leaves,0),44168);
const document=await new NodeIO().read(root+'/tree.gltf'),models=[];
for(const [variant,mesh]of document.getRoot().listMeshes().entries()){
 const p=mesh.listPrimitives()[0],positions=p.getAttribute('POSITION'),normals=p.getAttribute('NORMAL'),uv=p.getAttribute('TEXCOORD_0'),indices=p.getIndices().getArray(),parent=Uint32Array.from({length:positions.getCount()},(_,i)=>i),used=new Set();
 const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};const pp=positions.getArray(),nn=normals.getArray(),tt=uv.getArray();let woodFaces=0;
 for(let i=0;i<positions.getCount();i++){
  assert.ok([pp[i*3],pp[i*3+1],pp[i*3+2]].every(Number.isFinite));assert.ok(Math.abs(Math.hypot(nn[i*3],nn[i*3+1],nn[i*3+2])-1)<.001);
  assert.ok(tt[i*2]>=0&&tt[i*2]<=1&&tt[i*2+1]>=0&&tt[i*2+1]<=1);
 }
 for(let i=0;i<indices.length;i+=3){const [a,b,c]=indices.slice(i,i+3);assert.ok(Math.max(a,b,c)<positions.getCount());if(tt[a*2+1]<.75)continue;assert.ok(tt[b*2+1]>.75&&tt[c*2+1]>.75,'no face crosses atlas roles');woodFaces++;parent[find(b)]=find(a);parent[find(c)]=find(a);used.add(a);used.add(b);used.add(c);}
 const woodComponents=new Set([...used].map(find)).size;assert.equal(woodComponents,35);assert.equal(woodFaces,meta.variants[variant].woodTriangles);assert.equal(indices.length/3,meta.variants[variant].triangles);assert.ok(Math.abs(positions.getMin([])[1])<1e-6);
 models.push({name:mesh.getName(),triangles:indices.length/3,woodFaces,woodComponents,vertices:positions.getCount(),bounds:[positions.getMin([]),positions.getMax([])]});
}
const result={models,verifiedAssets:meta.preparedAssets,totalBytes:meta.preparedAssets.reduce((n,a)=>n+a.bytes,0),views:meta.bake.views.length,sourceLeavesPerLod:44168,estimatedTextureBytesWithMips:23068672};
await writeFile('artifacts/coastal-tree-m38-validation.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
