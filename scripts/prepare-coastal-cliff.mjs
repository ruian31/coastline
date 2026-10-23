// Offline only. Original CC0 source stays in work/asset-sources, never in the bundle.
import {NodeIO} from '@gltf-transform/core';
import {weld,simplify,prune,dedup} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import{solidifyScan}from'./solidify-scan.mjs';

const source=process.argv[2]??'work/asset-sources/coastal_cliff_01/coastal_cliff_01.gltf';
const output='public/assets/models/coastal_cliff_01';
await mkdir(output,{recursive:true});await MeshoptSimplifier.ready;
const io=new NodeIO(),report={asset:'coastal_cliff_01',license:'CC0-1.0',page:'https://polyhaven.com/a/coastal_cliff_01',authors:{'Rob Tuytel':'Photography, processing','Rico Cilliers':'cleanup'},sourceFiles:JSON.parse(await readFile(path.join(path.dirname(source),'source-files.json'),'utf8')),lods:[]};
for(const [name,target,error] of [['near',24000,.0015],['far',6000,.006]]){
 const doc=await io.read(source);let original=0;
 for(const mesh of doc.getRoot().listMeshes())for(const primitive of mesh.listPrimitives())original+=primitive.getIndices().getCount()/3;
 // UV boundaries are retained by weld/simplify; scanned normals and texture coordinates survive.
 await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:target/original,error}),dedup(),prune());
 for(const material of doc.getRoot().listMaterials()){
  material.setDoubleSided(false);material.setMetallicFactor(0);
  const arm=material.getMetallicRoughnessTexture();if(arm)material.setOcclusionTexture(arm).setOcclusionStrength(.85);
 }
 const closure=solidifyScan(doc,{axis:'z',depth:18,backTriangles:name==='near'?1500:600});
 await doc.transform(weld(),dedup(),prune({keepAttributes:true}));
 for(const [index,buffer] of doc.getRoot().listBuffers().entries())buffer.setURI(`cliff-${name}-${index}.bin`);
 const filename=`cliff-${name}.gltf`;await io.write(path.join(output,filename),doc);
 let triangles=0,vertices=0;
 for(const mesh of doc.getRoot().listMeshes())for(const p of mesh.listPrimitives()){triangles+=p.getIndices().getCount()/3;vertices+=p.getAttribute('POSITION').getCount();}
 const data=await readFile(path.join(output,filename));report.lods.push({name,originalTriangles:original,targetTriangles:target,triangles,vertices,error,closure,sha256:createHash('sha256').update(data).digest('hex')});
 console.log(JSON.stringify(report.lods.at(-1)));
}
await writeFile(path.join(output,'source.json'),JSON.stringify(report,null,2)+'\n');
