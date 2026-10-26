// Geometry-only derivative of the closed CC0 Boulder 01 scan. Existing game
// rock maps supply metre-scale detail, avoiding atlas seams after simplification.
import assert from 'node:assert/strict';
import {NodeIO} from '@gltf-transform/core';
import {MeshoptSimplifier} from 'meshoptimizer';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source='work/boulder-m47-source',out='src/world/boulder-shape.json';
const files=JSON.parse(await readFile(source+'/source-files.json','utf8')).files.filter(f=>/\.(gltf|bin)$/.test(f.file));
for(const f of files)assert.equal(createHash('sha256').update(await readFile(source+'/'+f.file)).digest('hex'),f.sha256);
const doc=await new NodeIO().read(source+'/boulder_01.gltf'),primitive=doc.getRoot().listMeshes()[0].listPrimitives()[0];
const positions=primitive.getAttribute('POSITION').getArray(),normals=primitive.getAttribute('NORMAL').getArray(),indices=new Uint32Array(primitive.getIndices().getArray());
await MeshoptSimplifier.ready;
const [selected,error]=MeshoptSimplifier.simplifyWithAttributes(indices,positions,3,normals,3,[.05,.05,.05],null,512*3,.04,['Permissive']);
assert.equal(selected.length,512*3);
const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(let i=0;i<positions.length;i+=3)for(let j=0;j<3;j++){lo[j]=Math.min(lo[j],positions[i+j]);hi[j]=Math.max(hi[j],positions[i+j]);}
const center=lo.map((n,i)=>(n+hi[i])/2),scale=2/Math.max(hi[0]-lo[0],hi[2]-lo[2]),remap=new Map(),position=[],normal=[],index=[];
for(const old of selected){if(!remap.has(old)){remap.set(old,remap.size);for(let c=0;c<3;c++){position.push(Math.fround((positions[old*3+c]-center[c])*scale+(c===1?.35:0)));normal.push(normals[old*3+c]);}}index.push(remap.get(old));}
// Exact position seams are welded for topology only; keep source normal splits.
const ids=new Map(),vertex=[];for(let i=0;i<position.length;i+=3){const key=position.slice(i,i+3).join(',');if(!ids.has(key))ids.set(key,ids.size);vertex.push(ids.get(key));}
const edges=new Map();let volume=0;
for(let i=0;i<index.length;i+=3){const face=index.slice(i,i+3),welded=face.map(v=>vertex[v]);assert.equal(new Set(welded).size,3);for(let j=0;j<3;j++){const a=welded[j],b=welded[(j+1)%3],key=a<b?a+','+b:b+','+a;edges.set(key,(edges.get(key)??0)+1);}const[a,b,c]=face.map(v=>position.slice(v*3,v*3+3));volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;}
assert.ok([...edges.values()].every(count=>count===2));assert.ok(volume>.1);
const packed=[new Float32Array(position),new Float32Array(normal),new Uint16Array(index)].map(a=>Buffer.from(a.buffer));
const data={asset:'boulder_01',page:'https://polyhaven.com/a/boulder_01',license:'CC0-1.0',author:'Rico Cilliers',sourceFiles:files,recipe:{meshoptimizer:'1.2.0',triangles:512,error,normalWeight:.05,flags:['Permissive'],center,uniformScale:scale,verticalOffset:.35,material:'Existing Rock Boulder Dry maps, metre triplanar; source UV atlas not used'},diagnostics:{sourceTriangles:indices.length/3,triangles:index.length/3,vertices:normal.length/3,openEdges:0,nonmanifoldEdges:0,signedVolume:volume},encoding:'base64 Float32 position/normal, Uint16 index; little endian',geometrySha256:createHash('sha256').update(Buffer.concat(packed)).digest('hex'),position:packed[0].toString('base64'),normal:packed[1].toString('base64'),index:packed[2].toString('base64')};
await writeFile(out,JSON.stringify(data)+'\n');console.log(JSON.stringify({out,bytes:(await readFile(out)).length,...data.diagnostics}));
