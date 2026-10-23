// Extract two spatially separate photographed plants, then simplify each
// connected leaf/branch independently so distant geometry cannot join leaves.
import {Document,NodeIO} from '@gltf-transform/core';
import {MeshoptSimplifier} from 'meshoptimizer';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';

const cache='work/asset-sources/m20-vegetation-audit',source=cache+'/shrub_04',output='public/assets/models/coastal_scrub';
const files=JSON.parse(await readFile(cache+'/shrub_04-files.json','utf8')),catalog=JSON.parse(await readFile(cache+'/shrub_04-catalog-metadata.json','utf8')),model=files.gltf['1k'].gltf;
const inputs={'shrub_04_1k.gltf':model,'shrub_04.bin':model.include['shrub_04.bin'],'textures/shrub_04_diff_1k.jpg':model.include['textures/shrub_04_diff_1k.jpg'],'textures/shrub_04_alpha_1k.png':files.Alpha['1k'].png},provenance=[];
for(const[path,metadata]of Object.entries(inputs)){
 const data=await readFile(source+'/'+path);assert.equal(createHash('md5').update(data).digest('hex'),metadata.md5);provenance.push({path,...metadata,sha256:createHash('sha256').update(data).digest('hex')});
}
await mkdir(output,{recursive:true});
execFileSync('python3',['-c',`from PIL import Image
from pathlib import Path
p=Path('${source}/textures')
im=Image.open(p/'shrub_04_diff_1k.jpg').convert('RGBA')
im.putalpha(Image.open(p/'shrub_04_alpha_1k.png').convert('L'))
im.save('${output}/scrub-color.png',optimize=True)
`]);
const rgba=await readFile(output+'/scrub-color.png'),raw=JSON.parse(await readFile(source+'/shrub_04_1k.gltf','utf8'));
raw.images=[];raw.textures=[];raw.materials=[{}];
const io=new NodeIO(),original=await io.readJSON({json:raw,resources:{'shrub_04.bin':await readFile(source+'/shrub_04.bin')}}),primitive=original.getRoot().listMeshes()[0].listPrimitives()[0];
const pos=primitive.getAttribute('POSITION').getArray(),normal=primitive.getAttribute('NORMAL').getArray(),uv=primitive.getAttribute('TEXCOORD_0').getArray(),allIndices=primitive.getIndices().getArray();
await MeshoptSimplifier.ready;
const doc=new Document(),buffer=doc.createBuffer().setURI('scrub.bin'),texture=doc.createTexture('Photographed grey-green leaves').setImage(rgba).setMimeType('image/png').setURI('scrub-color.png'),material=doc.createMaterial('Grey-green coastal scrub').setBaseColorTexture(texture).setDoubleSided(true).setAlphaMode('MASK').setAlphaCutoff(.45).setRoughnessFactor(1).setMetallicFactor(0),scene=doc.createScene('Rooted coastal scrub'),variants=[];
for(const[variant,minX,maxX]of[[0,-1,-.416],[1,-.416,-.266]]){
 const faces=[],parent=Array.from({length:pos.length/3},(_,i)=>i),find=i=>{while(parent[i]!==i)i=parent[i];return i;};
 for(let i=0;i<allIndices.length;i+=3){const face=Array.from(allIndices.slice(i,i+3)),inside=face.map(j=>pos[j*3]>minX&&pos[j*3]<maxX);assert.ok(inside.every(Boolean)||inside.every(v=>!v),'crop must not cut a face');if(!inside[0])continue;faces.push(face);parent[find(face[1])]=find(face[0]);parent[find(face[2])]=find(face[0]);}
 const groups=new Map();for(const face of faces){const key=find(face[0]),group=groups.get(key)??[];group.push(...face);groups.set(key,group);}
 const components=Array.from(groups.values(),indices=>{
  const unique=[...new Set(indices)],remap=new Map(unique.map((v,i)=>[v,i])),positions=new Float32Array(unique.flatMap(i=>Array.from(pos.slice(i*3,i*3+3)))),attributes=new Float32Array(unique.flatMap(i=>[...normal.slice(i*3,i*3+3),...uv.slice(i*2,i*2+2)]));
  return{positions,attributes,indices:new Uint32Array(indices.map(i=>remap.get(i))),leaf:indices.length/3<=24};
 });
 const lower=components.flatMap(c=>Array.from({length:c.positions.length/3},(_,i)=>[c.positions[i*3],c.positions[i*3+1],c.positions[i*3+2]])).sort((a,b)=>a[1]-b[1]),rootY=lower[0][1],feet=lower.filter(p=>p[1]<rootY+.012),rootX=feet.reduce((sum,p)=>sum+p[0],0)/feet.length,rootZ=feet.reduce((sum,p)=>sum+p[2],0)/feet.length;
 for(const lod of ['near','far']){
  const positions=[],normals=[],uvs=[],indices=[];let leaves=0,branches=0,maxError=0;
  for(const[index,c]of components.entries()){
   const target=c.leaf?(lod==='near'?6:2):Math.max(8,Math.floor(c.indices.length/3*(lod==='near'?.26:.08)));
   const weights=lod==='near'?[.02,.02,.02,.08,.08]:c.leaf?[0,0,0,.005,.005]:[.005,.005,.005,.01,.01];
   const[simplified,error]=MeshoptSimplifier.simplifyWithAttributes(c.indices,c.positions,3,c.attributes,5,weights,null,target*3,lod==='near'?.035:c.leaf?.4:.16);
   assert.ok(simplified.length>=3,'every authored component must survive both LODs');
   maxError=Math.max(maxError,error);if(c.leaf)leaves++;else branches++;
   const unique=[...new Set(simplified)],remap=new Map(unique.map((v,i)=>[v,i+positions.length/3]));
   for(const i of unique){positions.push((c.positions[i*3]-rootX)*12,(c.positions[i*3+1]-rootY)*6,(c.positions[i*3+2]-rootZ)*12);normals.push(c.attributes[i*5]/2,c.attributes[i*5+1],c.attributes[i*5+2]/2);const last=normals.length-3,length=Math.hypot(...normals.slice(last));for(let k=0;k<3;k++)normals[last+k]/=length;uvs.push(c.attributes[i*5+3],c.attributes[i*5+4]);}
   indices.push(...Array.from(simplified,i=>remap.get(i)));
  }
  const mesh=doc.createMesh(`Coastal scrub ${variant} ${lod}`).addPrimitive(doc.createPrimitive().setAttribute('POSITION',doc.createAccessor().setType('VEC3').setArray(new Float32Array(positions)).setBuffer(buffer)).setAttribute('NORMAL',doc.createAccessor().setType('VEC3').setArray(new Float32Array(normals)).setBuffer(buffer)).setAttribute('TEXCOORD_0',doc.createAccessor().setType('VEC2').setArray(new Float32Array(uvs)).setBuffer(buffer)).setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint16Array(indices)).setBuffer(buffer)).setMaterial(material));
  scene.addChild(doc.createNode(mesh.getName()).setMesh(mesh));variants.push({variant,lod,sourceTriangles:faces.length,components:components.length,triangles:indices.length/3,vertices:positions.length/3,leaves,branches,maxError});assert.ok(positions.every(Number.isFinite)&&normals.every(Number.isFinite));
 }
}
await io.write(output+'/scrub.gltf',doc);const preparedAssets=[];
for(const path of ['scrub.gltf','scrub.bin','scrub-color.png']){const data=await readFile(output+'/'+path);preparedAssets.push({path,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});}
await writeFile(output+'/source.json',JSON.stringify({asset:'shrub_04',page:'https://polyhaven.com/a/shrub_04',license:'CC0-1.0',authors:catalog.authors,sourceFiles:provenance,conversion:'Two complete non-intersecting x bands; ignore source display translation, reset roots, scale xz 12x/y 6x. Simplify connected components independently; both LODs retain every leaf and woody component, far reduces each leaf toward two triangles. Merge official alpha into diffuse; no normal/ARM.',variants,preparedAssets},null,2)+'\n');
console.log(JSON.stringify({output,variants,preparedAssets}));
