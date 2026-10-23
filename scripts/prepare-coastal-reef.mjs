import {NodeIO} from '@gltf-transform/core';
import {weld,simplify,dedup,prune} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import{solidifyScan}from'./solidify-scan.mjs';

const source='work/asset-sources/coast_rocks_01',output='public/assets/models/coastal_reef';
await mkdir(output,{recursive:true});await MeshoptSimplifier.ready;const io=new NodeIO(),lods=[];
for(const [name,target,error]of[['near',5000,.002],['far',1500,.004]]){
 const doc=await io.read(`${source}/coast_rocks_01.gltf`);let original=0;for(const mesh of doc.getRoot().listMeshes())for(const p of mesh.listPrimitives())original+=p.getIndices().getCount()/3;
 await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:target/original,error}),dedup(),prune());
 for(const material of doc.getRoot().listMaterials()){const arm=material.getMetallicRoughnessTexture();if(arm)material.setOcclusionTexture(arm).setOcclusionStrength(.85);material.setMetallicFactor(0);}
 const closure=solidifyScan(doc,{axis:'y',depth:5,backTriangles:name==='near'?600:300});await doc.transform(weld(),dedup(),prune({keepAttributes:true}));
 for(const buffer of doc.getRoot().listBuffers())buffer.setURI(`reef-${name}.bin`);
 await io.write(`${output}/reef-${name}.gltf`,doc);
 const triangles=doc.getRoot().listMeshes().reduce((n,m)=>n+m.listPrimitives().reduce((sum,p)=>sum+p.getIndices().getCount()/3,0),0);lods.push({name,original,target,error,triangles,closure});console.log(lods.at(-1));
}
await writeFile(`${output}/source.json`,JSON.stringify({asset:'coast_rocks_01',page:'https://polyhaven.com/a/coast_rocks_01',license:'CC0-1.0',authors:{'Rob Tuytel':'Photography, processing','Rico Cilliers':'cleanup'},sourceFiles:JSON.parse(await readFile(`${source}/source-files.json`,'utf8')),lods},null,2)+'\n');
