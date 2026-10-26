// Independent source surface, physical wood boundary and masked image checks.
import {NodeIO} from '@gltf-transform/core';
import {Matrix4,Matrix3,Vector3} from 'three';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {PNG} from 'pngjs';
import assert from 'node:assert/strict';

const root='public/assets/models/coastal_searsia',cache='work/searsia-source',label=process.env.SCRUB_LABEL??String(Date.now());assert.match(label,/^[a-z0-9-]+$/);
const out='artifacts/coastal-searsia-validation-'+label;await mkdir(out);
const meta=JSON.parse(await readFile(root+'/source.json')),proxy=JSON.parse(await readFile(root+'/impostor-source.json'));
assert.equal(meta.license,'CC0-1.0');assert.equal(meta.glyphs.length,16);assert.equal(meta.nativeAtlasRegions.length,18);
for(const [base,files]of [[cache,meta.sourceFiles],[root,meta.preparedAssets],[root,proxy.inputs],[root,[proxy.output,proxy.normalOutput]],['.',proxy.bakerInputs]])for(const file of files){const data=await readFile(base+'/'+file.path);if(file.bytes)assert.equal(data.length,file.bytes);assert.equal(createHash('sha256').update(data).digest('hex'),file.sha256);}
const io=new NodeIO(),raw=JSON.parse(await readFile('work/searsia-source/searsia_lucida_1k.gltf'));
raw.images=[];raw.textures=[];raw.materials=raw.materials.map(()=>({}));
const original=await io.readJSON({json:raw,resources:{'searsia_lucida.bin':await readFile('work/searsia-source/searsia_lucida.bin')}});
const lod=await io.read(root+'/scrub.gltf');assert.equal(lod.getRoot().listMeshes().length,4);
const primitive=(doc,name)=>doc.getRoot().listMeshes().find(m=>m.getName()===name).listPrimitives()[0];
function transformed(primitives,matrix){
 const result={vertices:[],faces:[]},normalMatrix=new Matrix3().getNormalMatrix(matrix);
 for(const p of primitives){const positions=p.getAttribute('POSITION'),normals=p.getAttribute('NORMAL'),uv=p.getAttribute('TEXCOORD_0'),base=result.vertices.length;
  for(let i=0;i<positions.getCount();i++){const v=new Vector3().fromArray(positions.getArray(),i*3).applyMatrix4(matrix),n=new Vector3().fromArray(normals.getArray(),i*3).applyMatrix3(normalMatrix).normalize();result.vertices.push([...v.toArray(),...n.toArray(),...uv.getArray().slice(i*2,i*2+2)]);}
  const indices=p.getIndices().getArray();for(let i=0;i<indices.length;i+=3)result.faces.push(Array.from(indices.slice(i,i+3),j=>j+base));
 }return result;
}
function compare(expected,actual,label){
 const bucket=v=>[...v.slice(0,3).map(c=>Math.round(c*1e4)),...v.slice(6).map(c=>Math.round(c*1e6))].join(','),lookup=new Map();let maxError=0;
 expected.vertices.forEach((v,i)=>{const key=bucket(v),list=lookup.get(key)??[];list.push(i);lookup.set(key,list);});
 const ids=actual.vertices.map(v=>{const options=lookup.get(bucket(v))??[];let error=Infinity,match=-1;for(const i of options){const e=Math.max(...v.map((c,k)=>Math.abs(c-expected.vertices[i][k])));if(e<error){error=e;match=i;}}assert.ok(error<2e-6,`${label} source surface mismatch ${error}`);maxError=Math.max(maxError,error);return match;});
 // Equal attributes may have separate original indices; canonicalize them first.
 const exact=v=>v.map(c=>c.toFixed(6)).join(','),canonical=new Map();const expectedIds=expected.vertices.map((v,i)=>{const key=exact(v);if(!canonical.has(key))canonical.set(key,i);return canonical.get(key);});
 const faceKey=face=>{const values=face.map(i=>expectedIds[i]);return [values,values.slice(1).concat(values[0]),values.slice(2).concat(values.slice(0,2))].map(v=>v.join(',')).sort()[0];};
 const counts=new Map();for(const f of expected.faces){const key=faceKey(f);counts.set(key,(counts.get(key)??0)+1);}for(const face of actual.faces){const key=faceKey(face.map(i=>ids[i])),count=counts.get(key)??0;assert.ok(count>0,`${label} extra/reversed triangle`);counts.set(key,count-1);}assert.equal([...counts.values()].reduce((a,b)=>a+b,0),0,`${label} missing source triangles`);
 return{label,triangles:actual.faces.length,vertices:actual.vertices.length,maxAttributeError:maxError,missingFaces:0,extraOrReversedFaces:0};
}
const reports=[];
for(const[variant,name]of [[0,'searsia_lucida_f_LOD0'],[1,'searsia_lucida_g_LOD0']]){
 const primitives=original.getRoot().listNodes().find(n=>n.getName()===name).getMesh().listPrimitives(),used=[];
 for(const p of primitives)for(const i of new Set(p.getIndices().getArray()))used.push(Array.from(p.getAttribute('POSITION').getArray().slice(i*3,i*3+3)));
 const bottom=Math.min(...used.map(v=>v[1])),top=Math.max(...used.map(v=>v[1])),feet=used.filter(v=>v[1]<bottom+.005),root=new Vector3(feet.reduce((s,v)=>s+v[0],0)/feet.length,bottom,feet.reduce((s,v)=>s+v[2],0)/feet.length),scale=.91/(top-bottom),matrix=new Matrix4().makeScale(scale*1.2,scale,scale*1.2).multiply(new Matrix4().makeTranslation(-root.x,-root.y,-root.z));
 reports.push(compare(transformed(primitives,matrix),transformed([primitive(lod,`Coastal scrub ${variant} near`)],new Matrix4()),name));
}
// Far geometry may change curvature/UVs, but every woody source component
// must still have faces, and every physical boundary/root stays in place.
const woodReports=[];
for(const [variant,name]of [[0,'searsia_lucida_f_LOD0'],[1,'searsia_lucida_g_LOD0']]){
 const source=original.getRoot().listNodes().find(n=>n.getName()===name).getMesh().listPrimitives()[0],p=source.getAttribute('POSITION').getArray(),indices=source.getIndices().getArray(),parent=Uint32Array.from({length:p.length/3},(_,i)=>i),find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;},same=new Map(),geometric=[];
 for(let i=0;i<p.length/3;i++){const key=Array.from(p.slice(i*3,i*3+3),v=>Math.round(v*1e6)).join(',');if(same.has(key))parent[find(i)]=find(same.get(key));else same.set(key,i);geometric[i]=same.get(key);}
 for(let i=0;i<indices.length;i+=3){parent[find(indices[i+1])]=find(indices[i]);parent[find(indices[i+2])]=find(indices[i]);}
 const components=new Set(Array.from(indices,find)),edges=new Map();
 for(let i=0;i<indices.length;i+=3)for(let k=0;k<3;k++){const a=geometric[indices[i+k]],b=geometric[indices[i+(k+1)%3]],key=[a,b].sort((a,b)=>a-b).join(',');edges.set(key,(edges.get(key)??0)+1);}
 const sourceMeta=meta.variants.find(v=>v.variant===variant&&v.lod==='near');assert.equal(sourceMeta.omittedWood,0);
 const all=original.getRoot().listNodes().find(n=>n.getName()===name).getMesh().listPrimitives().flatMap(pr=>Array.from(new Set(pr.getIndices().getArray()),i=>Array.from(pr.getAttribute('POSITION').getArray().slice(i*3,i*3+3)))),bottom=Math.min(...all.map(v=>v[1])),top=Math.max(...all.map(v=>v[1])),feet=all.filter(v=>v[1]<bottom+.005),origin=[feet.reduce((s,v)=>s+v[0],0)/feet.length,bottom,feet.reduce((s,v)=>s+v[2],0)/feet.length],sy=.91/(top-bottom),sx=sy*1.2,far=primitive(lod,`Coastal scrub ${variant} far`),fp=far.getAttribute('POSITION').getArray(),fu=far.getAttribute('TEXCOORD_0').getArray(),fi=far.getIndices().getArray(),matches=new Map(),exported=[];
 const bucket=new Map();for(let i=0;i<p.length/3;i++){const key=Math.floor(p[i*3]*1e4),list=bucket.get(key)??[];list.push(i);bucket.set(key,list);}
 for(let i=0;i<fp.length/3;i++)if(fu[i*2]>.88){const v=[fp[i*3]/sx+origin[0],fp[i*3+1]/sy+origin[1],fp[i*3+2]/sx+origin[2]],key=Math.floor(v[0]*1e4);let best=-1,error=Infinity;for(const cell of[key-1,key,key+1])for(const j of bucket.get(cell)??[]){const e=Math.hypot(...v.map((x,k)=>x-p[j*3+k]));if(e<error){error=e;best=j;}}assert.ok(error<2e-6,'far wood remains on its source support');matches.set(i,find(best));exported.push(v);}
 const present=new Set();for(let i=0;i<fi.length;i+=3){const ids=Array.from(fi.slice(i,i+3),j=>matches.get(j));if(ids.some(v=>v!==undefined)){assert.ok(ids.every(v=>v===ids[0]),'wood faces cannot bridge source components');present.add(ids[0]);}}
 assert.deepEqual([...present].sort((a,b)=>a-b),[...components].sort((a,b)=>a-b));
 const locked=new Set();for(const [key,count]of edges)if(count===1)key.split(',').map(Number).forEach(i=>locked.add(i));for(let i=0;i<p.length/3;i++)if(p[i*3+1]<bottom+.005)locked.add(i);
 let missing=0;for(const i of locked)if(!exported.some(v=>Math.hypot(...v.map((x,k)=>x-p[i*3+k]))<2e-6))missing++;assert.equal(missing,0);woodReports.push({variant,sourceWoodComponents:components.size,farWoodComponents:present.size,boundaryAndRootPoints:locked.size,missing});
}
const originalImage=PNG.sync.read(await readFile(cache+'/merged-color.png')),packed=PNG.sync.read(await readFile(root+'/scrub-color.png')),samples=[];
const originalAlpha=PNG.sync.read(await readFile(cache+'/textures/searsia_lucida_alpha_1k.png'));assert.equal(originalAlpha.depth,8);assert.equal(originalAlpha.colorType,0);for(let i=0;i<1024*1024;i++)assert.equal(originalImage.data[i*4+3],originalAlpha.data[i*4]);
const edge=(a,b,p)=>(p[0]-a[0])*(b[1]-a[1])-(p[1]-a[1])*(b[0]-a[0]);
let changedAlpha=0,changedColor=0;for(let y=0;y<1024;y++)for(let x=0;x<1024;x++)if(x<625||x>=906){const i=(y*1024+x)*4;if(originalImage.data[i+3]!==packed.data[i+3])changedAlpha++;if(originalImage.data[i+3])for(let c=0;c<3;c++)if(originalImage.data[i+c]!==packed.data[i+c])changedColor++;}
for(const glyph of meta.glyphs){
 const mask=new Uint8Array(1024*1024);for(const tri of glyph.triangles){const x0=Math.max(0,Math.floor(Math.min(...tri.map(p=>p[0]))*1024)),x1=Math.min(1023,Math.ceil(Math.max(...tri.map(p=>p[0]))*1024)),y0=Math.max(0,Math.floor(Math.min(...tri.map(p=>p[1]))*1024)),y1=Math.min(1023,Math.ceil(Math.max(...tri.map(p=>p[1]))*1024));for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const p=[(x+.5)/1024,(y+.5)/1024],e=tri.map((a,i)=>edge(a,tri[(i+1)%3],p));if(e.every(v=>v>=-1e-10)||e.every(v=>v<=1e-10))mask[y*1024+x]=1;}}
 let sourceMass=0,sourceOpaque=0,glyphMass=0,glyphOpaque=0;for(let i=0;i<mask.length;i++)if(mask[i]){const a=originalImage.data[i*4+3];sourceMass+=a/255;if(a>=Math.ceil(.45*255))sourceOpaque++;}const [x0,y0,w,h]=glyph.tile;for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){const a=packed.data[(y*1024+x)*4+3];glyphMass+=a/255;if(a>=Math.ceil(.45*255))glyphOpaque++;}
 const area=(glyph.max[0]-glyph.min[0])*(glyph.max[1]-glyph.min[1])*1024**2,jacobian=area/(glyph.body[0]*glyph.body[1]);samples.push({index:glyph.index,role:glyph.role,sourceMass,sourceOpaque,glyphMassInSourcePixels:glyphMass*jacobian,glyphOpaqueInSourcePixels:glyphOpaque*jacobian,massError:(glyphMass*jacobian/sourceMass-1),opaqueError:(glyphOpaque*jacobian/sourceOpaque-1)});
}
assert.equal(changedAlpha,0);assert.equal(changedColor,0);
for(const s of samples){assert.ok(Math.abs(s.massError)<.005,'isolated glyph alpha area changes less than 0.5%');assert.ok(Math.abs(s.opaqueError)<.05,'cutoff raster area changes less than 5% at finite tile resolution');}
const result={nearSurfaces:reports,woodReports,changedAlpha,changedColor,glyphCoverage:samples,sourceAndProxyHashesVerified:true};await writeFile(out+'/result.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({out,nearSurfaces:reports,woodReports,changedAlpha,changedColor,glyphs:samples.length,maxMassError:Math.max(...samples.map(s=>Math.abs(s.massError))),maxOpaqueError:Math.max(...samples.map(s=>Math.abs(s.opaqueError)))}));
