// Keep every photographed leaf, twig and woody component in both LODs.
// Simplify within each component; never join or randomly discard branches.
// Rebuilding is separate from runtime loading; verify gameplay before publishing.
import assert from 'node:assert/strict';
import {Document,NodeIO} from '@gltf-transform/core';
import {MeshoptSimplifier} from 'meshoptimizer';
import {PNG} from 'pngjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const cache='work/coastal-shrub-candidates/wild_rooibos_bush',output='public/assets/models/coastal_rooibos';
const inputs=[
 ['wild_rooibos_bush_1k.gltf','Models/gltf/1k/wild_rooibos_bush/wild_rooibos_bush_1k.gltf',23122,'589911681acc2ebac68ff12ded20460d'],
 ['wild_rooibos_bush.bin','Models/gltf/8k/wild_rooibos_bush/wild_rooibos_bush.bin',1236928,'0d6c39ac444bac0381ecdff32a191a9c'],
 ['textures/wild_rooibos_bush_diff_1k.jpg','Models/jpg/1k/wild_rooibos_bush/wild_rooibos_bush_diff_1k.jpg',374003,'47ee13b7a87d2aff07c0ec708a33f6ab'],
 ['textures/wild_rooibos_bush_alpha_1k.png','Models/png/1k/wild_rooibos_bush/wild_rooibos_bush_alpha_1k.png',90888,'f58e9c4d8874751b2a02dcc65c11c655'],
],provenance=[];
for(const[file,suffix,bytes,md5]of inputs){
 const target=path.join(cache,file),url='https://dl.polyhaven.org/file/ph-assets/'+suffix;let data;
 try{data=await readFile(target);}catch(error){if(error.code!=='ENOENT')throw error;const response=await fetch(url);assert.ok(response.ok,url);data=Buffer.from(await response.arrayBuffer());await mkdir(path.dirname(target),{recursive:true});await writeFile(target,data,{flag:'wx'});}
 assert.equal(data.length,bytes);assert.equal(createHash('md5').update(data).digest('hex'),md5);provenance.push({path:file,url,bytes,md5,sha256:createHash('sha256').update(data).digest('hex')});
}
await mkdir(output,{recursive:true});
execFileSync('python3',['-c',`from PIL import Image
from pathlib import Path
p=Path('${cache}/textures')
image=Image.open(p/'wild_rooibos_bush_diff_1k.jpg').convert('RGBA')
alpha=Image.open(p/'wild_rooibos_bush_alpha_1k.png').convert('L')
assert image.size==alpha.size==(1024,1024)
image.putalpha(alpha)
image.save('${cache}/merged-color.png')
`]);
const image=PNG.sync.read(await readFile(cache+'/merged-color.png')),valid=new Uint8Array(image.width*image.height),queue=new Int32Array(valid.length);let queued=0;
for(let i=0;i<valid.length;i++)if(image.data[i*4+3]){valid[i]=1;queue[queued++]=i;}
assert.ok(queued>1000,'photographed alpha must contain foliage');
// Extend RGB only beneath zero alpha; preserve the official silhouette exactly.
for(let at=0;at<queued;at++){const i=queue[at],x=i%image.width,y=Math.floor(i/image.width);for(const[nx,ny]of[[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){if(nx<0||nx>=image.width||ny<0||ny>=image.height)continue;const j=ny*image.width+nx;if(valid[j])continue;valid[j]=1;queue[queued++]=j;for(let c=0;c<3;c++)image.data[j*4+c]=image.data[i*4+c];}}
const rgba=PNG.sync.write(image);await writeFile(output+'/scrub-color.png',rgba);
const raw=JSON.parse(await readFile(cache+'/wild_rooibos_bush_1k.gltf','utf8')),materialNames=raw.materials.map(m=>m.name);raw.images=[];raw.textures=[];raw.materials=raw.materials.map(()=>({}));
const io=new NodeIO(),original=await io.readJSON({json:raw,resources:{'wild_rooibos_bush.bin':await readFile(cache+'/wild_rooibos_bush.bin')}});
await MeshoptSimplifier.ready;
function disconnected(indices,vertices){
 if(indices.length<3)return true;
 const parent=Uint32Array.from({length:vertices},(_,i)=>i),find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
 for(let i=0;i<indices.length;i+=3){parent[find(indices[i+1])]=find(indices[i]);parent[find(indices[i+2])]=find(indices[i]);}
 return new Set(Array.from(indices,i=>find(i))).size!==1;
}
function componentBorder(indices){
 const edges=new Map();for(let i=0;i<indices.length;i+=3)for(const [a,b]of [[indices[i],indices[i+1]],[indices[i+1],indices[i+2]],[indices[i+2],indices[i]]]){const key=a<b?`${a},${b}`:`${b},${a}`;edges.set(key,(edges.get(key)??0)+1);}
 const border=new Set();for(const [key,count]of edges)if(count===1)key.split(',').forEach(v=>border.add(Number(v)));return [...border];
}
const doc=new Document(),buffer=doc.createBuffer().setURI('scrub.bin'),texture=doc.createTexture('Photographed dry fine leaves').setImage(rgba).setMimeType('image/png').setURI('scrub-color.png'),material=doc.createMaterial('Fine leaf dry coastal scrub').setBaseColorTexture(texture).setDoubleSided(true).setAlphaMode('MASK').setAlphaCutoff(.45).setRoughnessFactor(1).setMetallicFactor(0),scene=doc.createScene('Rooted coastal rooibos'),variants=[];
for(const[variant,nodeName,widen]of[[0,'wild_rooibos_bush_d',1.4],[1,'wild_rooibos_bush_e',1.2]]){
 const node=original.getRoot().listNodes().find(n=>n.getName()===nodeName);assert.ok(node);const components=[],all=[];let sourceTriangles=0;
 for(const[primitiveIndex,primitive]of node.getMesh().listPrimitives().entries()){
  const sourcePrimitive=raw.meshes[raw.nodes.find(n=>n.name===nodeName).mesh].primitives[primitiveIndex],name=materialNames[sourcePrimitive.material],role=name.endsWith('_leaves')?'leaves':name.endsWith('_twigs')?'twigs':'wood',p=primitive.getAttribute('POSITION').getArray(),n=primitive.getAttribute('NORMAL').getArray(),uv=primitive.getAttribute('TEXCOORD_0').getArray(),indices=primitive.getIndices().getArray(),parent=Uint32Array.from({length:p.length/3},(_,i)=>i),find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};sourceTriangles+=indices.length/3;
  for(let i=0;i<indices.length;i+=3){parent[find(indices[i+1])]=find(indices[i]);parent[find(indices[i+2])]=find(indices[i]);}
  const groups=new Map();for(let i=0;i<indices.length;i+=3){const key=find(indices[i]),group=groups.get(key)??[];group.push(indices[i],indices[i+1],indices[i+2]);groups.set(key,group);}
  for(const faces of groups.values()){const unique=[...new Set(faces)],remap=new Map(unique.map((v,i)=>[v,i])),positions=new Float32Array(unique.flatMap(i=>Array.from(p.slice(i*3,i*3+3)))),attributes=new Float32Array(unique.flatMap(i=>[...n.slice(i*3,i*3+3),...uv.slice(i*2,i*2+2)]));components.push({role,positions,attributes,indices:new Uint32Array(faces.map(i=>remap.get(i)))});for(let i=0;i<positions.length;i+=3)all.push([positions[i],positions[i+1],positions[i+2]]);}
 }
  const rootY=Math.min(...all.map(p=>p[1])),top=Math.max(...all.map(p=>p[1])),feet=all.filter(p=>p[1]<rootY+.005),rootX=feet.reduce((s,p)=>s+p[0],0)/feet.length,rootZ=feet.reduce((s,p)=>s+p[2],0)/feet.length,scale=.91/(top-rootY),scaleXZ=scale*widen;
 for(const lod of ['near','far']){
  const positions=[],normals=[],uvs=[],indices=[],roles={leaves:0,twigs:0,wood:0};let maxError=0,keptWholeComponents=0;
  for(const c of components){
   const triangles=c.indices.length/3,near=lod==='near';
   const target=c.role==='leaves'?(near?4:2):c.role==='twigs'?Math.max(near?4:2,Math.floor(triangles*(near?.45:.16))):Math.max(near?6:4,Math.floor(triangles*(near?.32:.1))),locks=Uint8Array.from({length:c.positions.length/3},(_,i)=>c.positions[i*3+1]<rootY+.005?1:0),weights=near?[.02,.02,.02,.06,.06]:[.002,.002,.002,.008,.008];
   const border=c.role==='wood'?componentBorder(c.indices):[];for(const i of border)locks[i]=1;
   let[simplified,error]=MeshoptSimplifier.simplifyWithAttributes(c.indices,c.positions,3,c.attributes,5,weights,locks,Math.min(triangles,target)*3,near?.05:.2,c.role==='wood'?['LockBorder']:[]);
   // Thin wood can vanish or lose its joining face within a relative error
   // bound. Preserve that original component instead of floating its branches.
   const surviving=new Set(simplified);
   if(disconnected(simplified,c.positions.length/3)||border.some(i=>!surviving.has(i))){simplified=c.indices;error=0;keptWholeComponents++;}
   maxError=Math.max(maxError,error);roles[c.role]++;
   const unique=[...new Set(simplified)],remap=new Map(unique.map((v,i)=>[v,i+positions.length/3]));
   for(const i of unique){positions.push((c.positions[i*3]-rootX)*scaleXZ,(c.positions[i*3+1]-rootY)*scale,(c.positions[i*3+2]-rootZ)*scaleXZ);const normal=[c.attributes[i*5]/scaleXZ,c.attributes[i*5+1]/scale,c.attributes[i*5+2]/scaleXZ],length=Math.hypot(...normal);normals.push(...normal.map(v=>v/length));uvs.push(c.attributes[i*5+3],c.attributes[i*5+4]);}indices.push(...Array.from(simplified,i=>remap.get(i)));
  }
  assert.ok(positions.every(Number.isFinite)&&normals.every(Number.isFinite));assert.ok(Math.abs(Math.min(...positions.filter((_,i)=>i%3===1)))<1e-6,'both LODs must retain their original grounded root');assert.ok(positions.length/3<65536);
  const mesh=doc.createMesh(`Coastal scrub ${variant} ${lod}`).addPrimitive(doc.createPrimitive().setAttribute('POSITION',doc.createAccessor().setType('VEC3').setArray(new Float32Array(positions)).setBuffer(buffer)).setAttribute('NORMAL',doc.createAccessor().setType('VEC3').setArray(new Float32Array(normals)).setBuffer(buffer)).setAttribute('TEXCOORD_0',doc.createAccessor().setType('VEC2').setArray(new Float32Array(uvs)).setBuffer(buffer)).setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint16Array(indices)).setBuffer(buffer)).setMaterial(material));scene.addChild(doc.createNode(mesh.getName()).setMesh(mesh));
  variants.push({variant,node:nodeName,lod,sourceTriangles,sourceComponents:components.length,components:Object.values(roles).reduce((a,b)=>a+b,0),roles,triangles:indices.length/3,vertices:positions.length/3,maxError,keptWholeComponents,root:[rootX,rootY,rootZ],heightBeforeSimplification:.91,heightAfterSimplification:Math.max(...positions.filter((_,i)=>i%3===1)),horizontalWiden:widen});
 }
}
await io.write(output+'/scrub.gltf',doc);const preparedAssets=[];for(const file of ['scrub.gltf','scrub.bin','scrub-color.png']){const data=await readFile(output+'/'+file);preparedAssets.push({path:file,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});}
await writeFile(output+'/source.json',JSON.stringify({asset:'wild_rooibos_bush',page:'https://polyhaven.com/a/wild_rooibos_bush',license:'CC0-1.0',authors:{'James Ray Cock':'modeling','Jenelle van Heerden':'photography'},sourceFiles:provenance,conversion:'Complete plants d/e, ignore display translations. Both LODs keep every leaf/twig/wood component; near retains folded leaf fans, far simplifies each toward two triangles. Simplify within each connected component, lock the lowest 5mm and every wood border vertex, also use LockBorder for wood; retain its original geometry if simplification removes/disconnects it or loses any locked border vertex. Normalize original height to 0.91m, small plant modestly widened. Official RGB16 alpha converted to 8-bit high bytes by Pillow, then unchanged; RGB-only transparent dilation. No normal/ARM runtime maps. Far silhouette and actual-game cost remain subject to visual/GPU validation.',runtimeRequirements:{alphaTest:.45,alphaToCoverage:true,mipHelper:'src/world/PlantTexture.ts preserveRooibosCutoutMips',cutoffHelper:'src/world/PlantTexture.ts centerPlantAlphaCoverage',textures:'one 1024-square sRGB alpha atlas plus one 512-square sRGB proxy atlas, shared by all near/far instances'},variants,preparedAssets},null,2)+'\n');console.log(JSON.stringify({output,variants,preparedAssets}));
