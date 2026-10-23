// Compose small, multi-directional clumps from licensed photographed grass
// parts. Source display translations are excluded; every part has a root pivot.
import {Document,NodeIO} from '@gltf-transform/core';
import * as THREE from 'three';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';

const source='work/asset-sources/m20-vegetation-audit/grass_bermuda_01',output='public/assets/models/coastal_grass';
const files=JSON.parse(await readFile('work/asset-sources/m20-vegetation-audit/grass_bermuda_01-files.json','utf8')),catalog=JSON.parse(await readFile('work/asset-sources/m20-vegetation-audit/grass_bermuda_01-catalog-metadata.json','utf8'));
const gltfFile=files.gltf['1k'].gltf,sourceFiles={'grass_bermuda_01_1k.gltf':gltfFile,'grass_bermuda_01.bin':gltfFile.include['grass_bermuda_01.bin'],'textures/grass_bermuda_01_diff_1k.jpg':gltfFile.include['textures/grass_bermuda_01_diff_1k.jpg'],'textures/grass_bermuda_01_alpha_1k.png':files.Alpha['1k'].png},provenance=[];
for(const [path,metadata]of Object.entries(sourceFiles)){
 const data=await readFile(`${source}/${path}`);assert.equal(createHash('md5').update(data).digest('hex'),metadata.md5,path+' official MD5');provenance.push({path,...metadata,sha256:createHash('sha256').update(data).digest('hex')});
}
await mkdir(output,{recursive:true});
execFileSync('python3',['-c',`from PIL import Image
from pathlib import Path
p=Path('${source}/textures')
im=Image.open(p/'grass_bermuda_01_diff_1k.jpg').convert('RGBA')
im.putalpha(Image.open(p/'grass_bermuda_01_alpha_1k.png').convert('L'))
im.save('${output}/grass-color.png',optimize=True)
`]);
const rgba=await readFile(`${output}/grass-color.png`),raw=JSON.parse(await readFile(`${source}/grass_bermuda_01_1k.gltf`,'utf8'));
// Original normal/ARM files are deliberately not used or downloaded. Strip
// their JSON references before decoding, instead of silently requesting them.
raw.images=[{uri:'grass-color.png'}];raw.textures=[{source:0}];raw.materials=[{name:'Photographed coastal grass',doubleSided:true,alphaMode:'MASK',alphaCutoff:.43,pbrMetallicRoughness:{baseColorTexture:{index:0},metallicFactor:0,roughnessFactor:1}}];
const io=new NodeIO(),original=await io.readJSON({json:raw,resources:{'grass_bermuda_01.bin':await readFile(`${source}/grass_bermuda_01.bin`),'grass-color.png':rgba}}),parts=new Map();
for(const node of original.getRoot().listNodes()){
 const primitive=node.getMesh()?.listPrimitives()[0];if(!primitive)continue;
 const geometry=new THREE.BufferGeometry();
 for(const [semantic,attribute,size]of[['POSITION','position',3],['NORMAL','normal',3],['TEXCOORD_0','uv',2]])geometry.setAttribute(attribute,new THREE.Float32BufferAttribute(primitive.getAttribute(semantic).getArray(),size));
 geometry.setIndex(Array.from(primitive.getIndices().getArray()));geometry.computeBoundingBox();const bounds=geometry.boundingBox,p=geometry.getAttribute('position'),root=new THREE.Vector3();let count=0;
 for(let i=0;i<p.count;i++)if(p.getY(i)<bounds.min.y+(bounds.max.y-bounds.min.y)*.12){root.add(new THREE.Vector3(p.getX(i),0,p.getZ(i)));count++;}
 root.divideScalar(count);geometry.translate(-root.x,-bounds.min.y,-root.z);parts.set(node.getName().replace('grass_bermuda_01_',''),geometry);
}
const doc=new Document(),buffer=doc.createBuffer().setURI('grass.bin'),texture=doc.createTexture('Photographed grass with official alpha').setImage(rgba).setMimeType('image/png').setURI('grass-color.png'),material=doc.createMaterial('Coastal grass cutout').setBaseColorTexture(texture).setDoubleSided(true).setAlphaMode('MASK').setAlphaCutoff(.43).setRoughnessFactor(1).setMetallicFactor(0),scene=doc.createScene('Rooted coastal grass clumps'),variants=[];
for(const [variant,names]of[['a',['seedling_c','seedling_a','medium_b','small_c','dead_a','single_a']],['b',['seedling_b','seedling_c','medium_d','small_b','dead_b','single_a']],['c',['seedling_a','seedling_b','medium_a','small_e','dead_a','single_b']]]){
 const positions=[],normals=[],uvs=[],indices=[];
 for(const [partIndex,name]of names.entries()){
  const g=parts.get(name).clone(),angle=partIndex*2.399+variant.charCodeAt(0)*.63,radius=partIndex===1?.08:partIndex?.14+partIndex*.015:0;
  g.scale(5,4.2,5);g.rotateY(angle);g.translate(Math.cos(angle)*radius,0,Math.sin(angle)*radius);
  const offset=positions.length/3;positions.push(...g.getAttribute('position').array);normals.push(...g.getAttribute('normal').array);uvs.push(...g.getAttribute('uv').array);indices.push(...Array.from(g.index.array,i=>i+offset));g.dispose();
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeBoundingBox();const extent=geometry.boundingBox.getSize(new THREE.Vector3());
 const primitive=doc.createPrimitive().setAttribute('POSITION',doc.createAccessor().setType('VEC3').setArray(new Float32Array(positions)).setBuffer(buffer)).setAttribute('NORMAL',doc.createAccessor().setType('VEC3').setArray(new Float32Array(normals)).setBuffer(buffer)).setAttribute('TEXCOORD_0',doc.createAccessor().setType('VEC2').setArray(new Float32Array(uvs)).setBuffer(buffer)).setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint16Array(indices)).setBuffer(buffer)).setMaterial(material);
 scene.addChild(doc.createNode('Coastal grass clump '+variant).setMesh(doc.createMesh('Coastal grass clump '+variant).addPrimitive(primitive)));
 variants.push({variant,parts:names,triangles:indices.length/3,vertices:positions.length/3,extent:extent.toArray()});assert.ok(indices.length/3<=350&&extent.y>=.5&&extent.y<=.75);geometry.dispose();
}
await io.write(`${output}/grass.gltf`,doc);
const preparedAssets=[];
for(const path of ['grass.gltf','grass.bin','grass-color.png']){const data=await readFile(`${output}/${path}`);preparedAssets.push({path,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});}
await writeFile(`${output}/source.json`,JSON.stringify({asset:'grass_bermuda_01',page:'https://polyhaven.com/a/grass_bermuda_01',license:'CC0-1.0',authors:catalog.authors,sourceFiles:provenance,conversion:'Official separate alpha losslessly merged into diffuse; no normal/ARM. Remove display-node translations, root each part, compose three multi-directional clumps at 5x width/depth and 4.2x height. Thin open leaf surfaces are intentional; not closed volume models.',variants,preparedAssets},null,2)+'\n');
for(const geometry of parts.values())geometry.dispose();console.log(JSON.stringify({output,variants,colorBytes:rgba.length}));
