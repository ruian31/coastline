// CPU-only: preserve six complete CC0 native sprigs, their UVs and leaf normals.
import{Document,NodeIO}from'@gltf-transform/core';import * as THREE from'three';import{readFile,writeFile,mkdir}from'node:fs/promises';import{createHash}from'node:crypto';import assert from'node:assert/strict';import{execFileSync}from'node:child_process';
const cache='work/meadow-grass-source',out='public/assets/models/coastal_fine_grass',source=JSON.parse(await readFile('public/assets/environment/meadow-source.json','utf8'));await mkdir(out,{recursive:true});
for(const entry of source.sources){const bytes=await readFile(cache+'/'+entry.file);assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256);}
execFileSync('python3',['-c',`from PIL import Image
p='${cache}/'
color=Image.open(p+'dry-color.png').convert('RGBA')
alpha=Image.open(p+'alpha.png').point(lambda x:x/256).convert('L')
assert color.size==alpha.size==(1024,1024)
color.putalpha(alpha);color.save(p+'fine-color.png',optimize=True)
`]);
const rgba=await readFile(cache+'/fine-color.png'),raw=JSON.parse(await readFile(cache+'/grass_medium_01_1k.gltf','utf8'));raw.images=[{uri:'grass-color.png'}];raw.textures=[{source:0}];raw.materials=[{doubleSided:true,alphaMode:'MASK',alphaCutoff:.43,pbrMetallicRoughness:{baseColorTexture:{index:0},metallicFactor:0,roughnessFactor:1}}];
const io=new NodeIO(),input=await io.readJSON({json:raw,resources:{'grass_medium_01.bin':await readFile(cache+'/grass_medium_01.bin'),'grass-color.png':rgba}}),parts=new Map();
for(const node of input.getRoot().listNodes()){
 if(!node.getName().includes('_tiny_'))continue;const primitive=node.getMesh()?.listPrimitives()[0];if(!primitive)continue;
 const g=new THREE.BufferGeometry();for(const[semantic,name,size]of[['POSITION','position',3],['NORMAL','normal',3],['TEXCOORD_0','uv',2]])g.setAttribute(name,new THREE.Float32BufferAttribute(primitive.getAttribute(semantic).getArray(),size));g.setIndex(Array.from(primitive.getIndices().getArray()));g.computeBoundingBox();const box=g.boundingBox,p=g.getAttribute('position'),root=new THREE.Vector3();let n=0;for(let i=0;i<p.count;i++)if(p.getY(i)<box.min.y+(box.max.y-box.min.y)*.12){root.add(new THREE.Vector3(p.getX(i),0,p.getZ(i)));n++;}assert.ok(n);root.divideScalar(n);g.translate(-root.x,-box.min.y,-root.z);parts.set(node.getName().replace('grass_medium_01_','').replace('_LOD0',''),g);
}
assert.equal(parts.size,6);const doc=new Document(),buffer=doc.createBuffer().setURI('grass.bin'),texture=doc.createTexture().setURI('grass-color.png').setMimeType('image/png').setImage(rgba),material=doc.createMaterial('Photographed dry fine grass').setDoubleSided(true).setAlphaMode('MASK').setAlphaCutoff(.43).setMetallicFactor(0).setRoughnessFactor(1).setBaseColorTexture(texture),scene=doc.createScene('Complete multidirectional dry grass sprigs'),variants=[];
for(let variant=0;variant<3;variant++){
 const positions=[],normals=[],uvs=[],indices=[],names=['tiny_a','tiny_b','tiny_c','tiny_d','tiny_e','tiny_f'];
 for(let i=0;i<names.length;i++){
  const g=parts.get(names[(i+variant*2)%6]).clone(),angle=i*2.399+variant*.91,radius=i===0?0:.045+i*.012;g.scale(4.7,5.5,4.7);g.rotateY(angle);g.translate(Math.cos(angle)*radius,0,Math.sin(angle)*radius);const offset=positions.length/3;positions.push(...g.getAttribute('position').array);normals.push(...g.getAttribute('normal').array);uvs.push(...g.getAttribute('uv').array);indices.push(...Array.from(g.index.array,v=>v+offset));g.dispose();
 }
 const primitive=doc.createPrimitive().setMaterial(material);for(const[name,type,array]of[['POSITION','VEC3',positions],['NORMAL','VEC3',normals],['TEXCOORD_0','VEC2',uvs]])primitive.setAttribute(name,doc.createAccessor().setType(type).setArray(new Float32Array(array)).setBuffer(buffer));primitive.setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint16Array(indices)).setBuffer(buffer));scene.addChild(doc.createNode('Fine dry grass clump '+variant).setMesh(doc.createMesh('Fine dry grass clump '+variant).addPrimitive(primitive)));assert.equal(indices.length/3,301);variants.push({variant,parts:names,triangles:indices.length/3,vertices:positions.length/3});
}
await io.write(out+'/grass.gltf',doc);const outputs=[];for(const file of['grass.gltf','grass.bin','grass-color.png']){const bytes=await readFile(out+'/'+file);outputs.push({file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
await writeFile(out+'/source.json',JSON.stringify({asset:'grass_medium_01',baker:{file:'scripts/prepare-fine-coastal-grass.mjs',sha256:createHash('sha256').update(await readFile('scripts/prepare-fine-coastal-grass.mjs')).digest('hex')},outputs,page:source.page,license:source.license,authors:source.authors,sources:source.sources,method:'Root all six complete native tiny sprigs, rotate and assemble three clumps. XZ ×4.7, Y ×5.5. Original UVs and transformed source normals, no simplification or new clump billboard.',variants},null,2)+'\n');console.log(JSON.stringify({out,variants}));
