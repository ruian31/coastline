// Derive small closed offshore reliefs from the existing CC0 photographed reef.
import {NodeIO} from '@gltf-transform/core';
import * as THREE from 'three';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const input='public/assets/models/coastal_reef/reef-far.gltf',output='src/world/offshore-heights.json',doc=await new NodeIO().read(input),parts=[];
for(const mesh of doc.getRoot().listMeshes())for(const primitive of mesh.listPrimitives()){
 if(primitive.getMaterial()?.getName()==='solid-rock-body')continue;
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(primitive.getAttribute('POSITION').getArray(),3));geometry.setIndex(Array.from(primitive.getIndices().getArray()));
 const object=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));object.updateMatrixWorld(true);parts.push(object);
}
const width=19,height=13,ray=new THREE.Raycaster(new THREE.Vector3(),new THREE.Vector3(0,-1,0)),variants=[];
for(const [cx,cz,rx,rz]of[[-9,-6,22,16],[-15,-8,17,21],[-5,-9,25,14]]){
 const heights=[];
 for(let row=0;row<height;row++)for(let column=0;column<width;column++){
  const x=column/(width-1)*2-1,z=row/(height-1)*2-1;ray.ray.origin.set(cx+x*rx,10,cz+z*rz);const hit=ray.intersectObjects(parts,false)[0],edge=Math.max(Math.abs(x),Math.abs(z));
  const weight=1-THREE.MathUtils.smoothstep(edge,.72,1);heights.push(THREE.MathUtils.lerp(-.8,hit?hit.point.y:-.8,weight));
 }
 const scale=.45/Math.max(...heights);variants.push(heights.map(h=>Number((h>0?h*scale:h).toFixed(6))));
}
const source=JSON.parse(await readFile('public/assets/models/coastal_reef/source.json','utf8'));
const sha256=async path=>createHash('sha256').update(await readFile(path)).digest('hex');
await writeFile(output,JSON.stringify({source:source.page,license:source.license,authors:source.authors,sourceSha256:{gltf:await sha256(input),bin:await sha256('public/assets/models/coastal_reef/reef-far.bin')},width,height,variants})+'\n');
for(const mesh of parts){mesh.geometry.dispose();mesh.material.dispose();}console.log(JSON.stringify({output,variants:variants.length,vertices:width*height+1,triangles:(width-1)*(height-1)*2+2*(width+height-2)}));
