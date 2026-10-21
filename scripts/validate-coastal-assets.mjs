import {NodeIO} from '@gltf-transform/core';
import {readFile,stat,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';

const io=new NodeIO();
for(const folder of ['coastal_cliff_01','coastal_shrubs']){
 const root=`public/assets/models/${folder}`,names=folder==='coastal_cliff_01'?['cliff-near.gltf','cliff-far.gltf']:['shrubs.gltf'];
 const resources=new Set(),models=[];
 for(const name of names){
  const filename=path.join(root,name),gltf=JSON.parse(await readFile(filename,'utf8'));resources.add(name);
  for(const resource of [...gltf.buffers,...gltf.images])if(resource.uri)resources.add(resource.uri);
  const doc=await io.read(filename);let triangles=0;const bounds=[];
  for(const mesh of doc.getRoot().listMeshes())for(const primitive of mesh.listPrimitives()){
   const p=primitive.getAttribute('POSITION'),n=primitive.getAttribute('NORMAL'),uv=primitive.getAttribute('TEXCOORD_0'),indices=primitive.getIndices();
   assert.equal(p.getCount(),n.getCount());assert.equal(p.getCount(),uv.getCount());assert.equal(indices.getCount()%3,0);
   for(const index of indices.getArray())assert.ok(index<p.getCount(),'index outside vertex stream');
   assert.ok([...p.getArray(),...n.getArray(),...uv.getArray()].every(Number.isFinite));
   triangles+=indices.getCount()/3;bounds.push({min:p.getMin([]),max:p.getMax([])});
  }
  assert.ok(triangles>0&&triangles<=24000);models.push({name,triangles,bounds});
 }
 const files=[];
 for(const uri of resources){const filename=path.join(root,uri),bytes=await readFile(filename);files.push({uri,bytes:(await stat(filename)).size,sha256:createHash('sha256').update(bytes).digest('hex')});}
 const report={models,files,totalBytes:files.reduce((n,f)=>n+f.bytes,0)};
 await writeFile(path.join(root,'validation.json'),JSON.stringify(report,null,2)+'\n');console.log(folder,JSON.stringify(report.models.map(m=>({name:m.name,triangles:m.triangles}))),report.totalBytes+' bytes');
}
