import assert from'node:assert/strict';
import{NodeIO,PropertyType}from'@gltf-transform/core';
import{dedup,prune}from'@gltf-transform/functions';
import sharp from'sharp';
import{mkdir,readFile,writeFile}from'node:fs/promises';
import{createHash}from'node:crypto';

// Offline asset preparation only; no provider or credentials in the game.
const input=process.env.UNDERSTORY_SOURCE??'work/canopy-g-m87/canopy-g.glb',out=process.env.UNDERSTORY_OUT??'work/understory-m89-512';
await mkdir(out,{recursive:true});const hash=b=>createHash('sha256').update(b).digest('hex'),io=new NodeIO(),doc=await io.read(input),root=doc.getRoot(),materials=root.listMaterials(),primitives=root.listMeshes().flatMap(m=>m.listPrimitives());
assert.equal(materials.length,2);assert.equal(primitives.reduce((s,p)=>s+p.getIndices().getCount()/3,0),3124);
const attributes=primitives.map(p=>Object.fromEntries([...p.listSemantics(),'indices'].map(k=>{const a=k==='indices'?p.getIndices():p.getAttribute(k);return[k,hash(new Uint8Array(a.getArray().buffer,a.getArray().byteOffset,a.getArray().byteLength))];}))),factors=materials.map(m=>({name:m.getName(),baseColor:m.getBaseColorFactor(),metal:m.getMetallicFactor(),roughness:m.getRoughnessFactor(),normalScale:m.getNormalScale(),alphaMode:m.getAlphaMode(),alphaCutoff:m.getAlphaCutoff(),doubleSided:m.getDoubleSided()}));
const roles=[['color','getBaseColorTexture','setBaseColorTexture'],['normal','getNormalTexture','setNormalTexture'],['surface','getMetallicRoughnessTexture','setMetallicRoughnessTexture']],maps=[];let colorSource;
const linear=x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4,srgb=x=>x<=.0031308?x*12.92:1.055*x**(1/2.4)-.055;
for(const[role,get,set]of roles){
 const textures=materials.map(m=>m[get]());assert.ok(textures.every(Boolean));assert.equal(hash(textures[0].getImage()),hash(textures[1].getImage()),'Only merge byte-identical texture sources');
 const src=await sharp(textures[0].getImage()).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(src.info.width,1024);assert.equal(src.info.height,1024);if(role==='color')colorSource=src.data;
 const bytes=Buffer.alloc(512*512*4);let maxNormalLengthError=0;
 for(let y=0;y<512;y++)for(let x=0;x<512;x++){
  const at=(y*512+x)*4,samples=[];for(let j=0;j<2;j++)for(let i=0;i<2;i++)samples.push(((y*2+j)*1024+x*2+i)*4);
  const alpha=samples.reduce((s,i)=>s+colorSource[i+3]/255,0),weights=samples.map(i=>alpha>0?colorSource[i+3]/255:1),total=alpha||4;
  if(role==='color'){for(let c=0;c<3;c++)bytes[at+c]=Math.round(Math.min(1,Math.max(0,srgb(samples.reduce((s,i,k)=>s+linear(src.data[i+c]/255)*weights[k],0)/total)))*255);bytes[at+3]=Math.round(alpha/4*255);}
  else if(role==='normal'){const v=[0,1,2].map(c=>samples.reduce((s,i,k)=>s+(src.data[i+c]/255*2-1)*weights[k],0)/total),length=Math.hypot(...v);if(length<1e-8)v.splice(0,3,0,0,1);else for(let c=0;c<3;c++)v[c]/=length;for(let c=0;c<3;c++)bytes[at+c]=Math.round((v[c]*.5+.5)*255);bytes[at+3]=255;maxNormalLengthError=Math.max(maxNormalLengthError,Math.abs(Math.hypot(...[0,1,2].map(c=>bytes[at+c]/255*2-1))-1));}
  else{for(let c=0;c<3;c++)bytes[at+c]=Math.round(samples.reduce((s,i,k)=>s+src.data[i+c]*weights[k],0)/total);bytes[at+3]=255;}
 }
 const png=await sharp(bytes,{raw:{width:512,height:512,channels:4}}).png({compressionLevel:9}).toBuffer(),texture=doc.createTexture('Shared coastal understory '+role).setImage(png).setMimeType('image/png').setURI(role+'.png');for(const m of materials)m[set](texture);
 const coverage=data=>{let n=0;for(let i=3;i<data.length;i+=4)if(data[i]/255>=.45)n++;return n/(data.length/4);};maps.push({role,width:512,height:512,bytes:png.length,sha256:hash(png),sourceImageSha256:hash(textures[0].getImage()),maxNormalLengthError,...role==='color'?{sourceCoverage:coverage(src.data),coverage:coverage(bytes)}:{}});
}
await doc.transform(dedup({propertyTypes:[PropertyType.TEXTURE]}),prune({propertyTypes:[PropertyType.TEXTURE]}));const glb=await io.writeBinary(doc);await writeFile(out+'/understory.glb',glb);const check=await io.read(out+'/understory.glb'),actual=check.getRoot().listMeshes().flatMap(m=>m.listPrimitives());
for(let j=0;j<actual.length;j++)for(const[k,expected]of Object.entries(attributes[j])){const a=k==='indices'?actual[j].getIndices():actual[j].getAttribute(k),array=a.getArray();assert.equal(hash(new Uint8Array(array.buffer,array.byteOffset,array.byteLength)),expected,k);}
assert.equal(check.getRoot().listTextures().length,3);assert.equal(check.getRoot().listMaterials().length,2);for(const [i,m]of check.getRoot().listMaterials().entries()){assert.equal(m.getMetallicFactor(),factors[i].metal);assert.equal(m.getRoughnessFactor(),factors[i].roughness);}
const color=maps[0];assert.ok(Math.abs(color.coverage-color.sourceCoverage)<.03,'Atlas threshold coverage changed excessively');
const provenance=JSON.parse(await readFile(process.env.UNDERSTORY_PROVENANCE??'work/coastal-canopy-m86-source/downloaded-source.json','utf8')),origin=provenance.origin??provenance.assets.find(a=>a.id==='othonna_cerarioides');assert.ok(origin?.files?.length);
const report={origin,scope:'Work runtime candidate only. Complete3124tri geometry/UV/normal/index exact after roundtrip, original2 material factors retained because bark and leaf metal factors differ. Merge only duplicate image resources into3 shared512 maps. Albedo reduced in linear light weighted by original alpha, data maps alpha-weighted, tangent normals renormalized. No alpha dilation or coverage expansion; texture reduction is lossy and requires visual approval. Not terrain/wind/pressure/LOD/shadow or phone acceptance.',source:input,sourceSha256:hash(await readFile(input)),triangles:3124,materials:factors,maps,attributes,glb:{path:out+'/understory.glb',bytes:glb.length,sha256:hash(glb)},textures:3};await writeFile(out+'/source.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({bytes:glb.length,textures:3,materials:2,maps:maps.map(({role,bytes,sourceCoverage,coverage})=>({role,bytes,sourceCoverage,coverage}))}));
