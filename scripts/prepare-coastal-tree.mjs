// Offline only: retain the scanned trunk and spatial distribution of foliage.
// Small three-view clusters retain parallax; there is no whole-tree billboard.
import assert from 'node:assert/strict';
import {Document,NodeIO} from '@gltf-transform/core';
import {MeshoptSimplifier} from 'meshoptimizer';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const cache='work/tree-reference-source',output='public/assets/models/coastal_tree';
const inputs=[
 ['island_tree_01_1k.gltf','gltf/1k',8576,'fbc0c570ebd71ea88cedc1f9d5edb835'],
 ['island_tree_01.bin','gltf/8k',60709812,'8271f2d12c2727bd647ce0c242acdcec'],
 ['island_tree_01_diff_1k.jpg','jpg/1k',791327,'8a67489846657df6b859d97e0b80fcf4'],
 ['island_tree_01_nor_gl_1k.jpg','jpg/1k',1207134,'3871f67863453a16b866950202fa2b7f'],
 ['island_tree_01_arm_1k.jpg','jpg/1k',727403,'8077da7d1a001867c0da0cde6bc807f2'],
 ['island_tree_01_leaves_diff_1k.jpg','jpg/1k',191886,'1356cbb5a5dd1318f9f2a01eddbf03e1'],
 ['island_tree_01_leaves_alpha_1k.png','png/1k',57438,'5ad9fb9a06e70c069bd3d3ba23577375'],
 ['island_tree_01_leaves_arm_1k.jpg','jpg/1k',489476,'27b06c4a53ff115ed7d51ee94e417257'],
 ['island_tree_01_branches_diff_1k.jpg','jpg/1k',528304,'7792907fe2b2b748c129a2384192a579'],
 ['island_tree_01_branches_arm_1k.jpg','jpg/1k',484806,'5b6f5b3838f4a8f60fea14fa3a3fef9f'],
],provenance=[];
for(const[name,kind,bytes,md5]of inputs){
 const file=(kind.startsWith('gltf')?'':'textures/')+name,url=`https://dl.polyhaven.org/file/ph-assets/Models/${kind}/island_tree_01/${name}`,target=path.join(cache,file);let data;
 try{data=await readFile(target);}catch(e){if(e.code!=='ENOENT')throw e;const response=await fetch(url);assert.ok(response.ok,url);data=Buffer.from(await response.arrayBuffer());await mkdir(path.dirname(target),{recursive:true});await writeFile(target,data,{flag:'wx'});}
 assert.equal(data.length,bytes);assert.equal(createHash('md5').update(data).digest('hex'),md5);provenance.push({file,url,bytes,md5,sha256:createHash('sha256').update(data).digest('hex')});
}
await mkdir(output,{recursive:true});
execFileSync('python3',['-c',`from PIL import Image
p='${cache}/textures/'
im=Image.open(p+'island_tree_01_leaves_diff_1k.jpg').convert('RGBA')
alpha=Image.open(p+'island_tree_01_leaves_alpha_1k.png').convert('L')
assert im.size==alpha.size==(1024,1024)
im.putalpha(alpha)
im.save('${cache}/leaf-color.png')
`]);
const raw=JSON.parse(await readFile(cache+'/island_tree_01_1k.gltf','utf8'));
raw.images=[];raw.textures=[];raw.materials=[{},{},{}];delete raw.extensionsRequired;delete raw.extensionsUsed;
const io=new NodeIO(),original=await io.readJSON({json:raw,resources:{'island_tree_01.bin':await readFile(cache+'/island_tree_01.bin')}});
const primitives=original.getRoot().listMeshes()[0].listPrimitives().map(p=>({p:p.getAttribute('POSITION').getArray(),n:p.getAttribute('NORMAL').getArray(),uv:p.getAttribute('TEXCOORD_0').getArray(),indices:p.getIndices().getArray()}));
function components(p){
 const parent=Uint32Array.from({length:p.p.length/3},(_,i)=>i),find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
 for(let i=0;i<p.indices.length;i+=3){parent[find(p.indices[i+1])]=find(p.indices[i]);parent[find(p.indices[i+2])]=find(p.indices[i]);}
 const groups=new Map();for(let i=0;i<p.indices.length;i+=3){const key=find(p.indices[i]),g=groups.get(key)??[];g.push(p.indices[i],p.indices[i+1],p.indices[i+2]);groups.set(key,g);}
 return [...groups.values()].map(indices=>{const vertices=[...new Set(indices)],min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(const i of vertices)for(let a=0;a<3;a++){min[a]=Math.min(min[a],p.p[i*3+a]);max[a]=Math.max(max[a],p.p[i*3+a]);}return{indices,vertices,min,max,center:min.map((v,i)=>(v+max[i])/2)};});
}
const parts=primitives.map(components),clusters=[];
for(const[lod,cell]of[['near',.65],['far',1.05]]){
 const groups=new Map();for(const role of[1,2])for(const c of parts[role]){const key=c.center.map(v=>Math.floor(v/cell)).join(','),g=groups.get(key)??{lod,min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity],parts:[],leaves:0};for(let a=0;a<3;a++){g.min[a]=Math.min(g.min[a],c.min[a]);g.max[a]=Math.max(g.max[a],c.max[a]);}g.parts.push({role,component:c});if(role===1)g.leaves++;groups.set(key,g);}
 const all=[...groups.values()];for(const g of all){g.center=g.min.map((v,i)=>(v+g.max[i])/2);g.radius=Math.max(...g.max.map((v,i)=>(v-g.min[i])/2))+.025;g.feature=g.max.map((v,i)=>(v-g.min[i])/(2*g.radius)).concat(Math.log(1+g.leaves)/6);}
 for(const [i,g]of all.entries())g.tileGroup=clusters.length+i;
 clusters.push(...all);
}
// Every spatial cell is written as geometry so the browser bakes actual
// photographed alpha, AO and branch UV repetition rather than a drawn proxy.
const bakeDoc=new Document(),bakeBuffer=bakeDoc.createBuffer().setURI('tree-clusters.bin'),bakeScene=bakeDoc.createScene('Scanned cluster bake');let clusterIndex=0;
function accessor(doc,buffer,type,array){return doc.createAccessor().setType(type).setArray(array).setBuffer(buffer);}
for(const g of clusters){
 const mesh=bakeDoc.createMesh('cluster_'+clusterIndex++);
 for(const role of[1,2]){const positions=[],uvs=[],indices=[],p=primitives[role];for(const{component:c}of g.parts.filter(p=>p.role===role)){const remap=new Map(c.vertices.map((v,i)=>[v,i+positions.length/3]));for(const i of c.vertices){for(let a=0;a<3;a++)positions.push((p.p[i*3+a]-g.center[a])/g.radius);uvs.push(p.uv[i*2],p.uv[i*2+1]);}for(const i of c.indices)indices.push(remap.get(i));}if(!indices.length)continue;mesh.addPrimitive(bakeDoc.createPrimitive().setAttribute('POSITION',accessor(bakeDoc,bakeBuffer,'VEC3',new Float32Array(positions))).setAttribute('TEXCOORD_0',accessor(bakeDoc,bakeBuffer,'VEC2',new Float32Array(uvs))).setIndices(accessor(bakeDoc,bakeBuffer,'SCALAR',new Uint32Array(indices))).setMaterial(bakeDoc.createMaterial(role===1?'leaves':'branches')));}
 bakeScene.addChild(bakeDoc.createNode(mesh.getName()).setMesh(mesh));
}
await io.write(cache+'/tree-clusters.gltf',bakeDoc);
await MeshoptSimplifier.ready;
function connected(indices,vertices){
 const parent=Uint32Array.from({length:vertices},(_,i)=>i),find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
 for(let i=0;i<indices.length;i+=3){parent[find(indices[i+1])]=find(indices[i]);parent[find(indices[i+2])]=find(indices[i]);}
 return indices.length>0&&new Set(Array.from(indices,find)).size===1;
}
const doc=new Document(),buffer=doc.createBuffer().setURI('tree.bin'),scene=doc.createScene('Wind-shaped coastal tree'),material=doc.createMaterial('Scanned bark and spatial foliage').setDoubleSided(true).setAlphaMode('MASK').setAlphaCutoff(.45).setRoughnessFactor(.9).setMetallicFactor(0),variants=[];
const rootY=-.02032786664366722;
// Top 2048x1536 = 255 clusters x three 64px views. Bark is 1024x512.
function tileUv(group,view,u,v){const tile=group*3+view,x=tile%32*64,y=Math.floor(tile/32)*64;return[(x+2+u*60)/2048,(y+2+(1-v)*60)/2048];}
for(const lod of['near','far']){
 const positions=[],normals=[],uvs=[],indices=[];let woodTriangles=0,maxError=0,protectedConnections=0;
 for(const c of parts[0]){
  const p=primitives[0],remap=new Map(c.vertices.map((v,i)=>[v,i])),cp=new Float32Array(c.vertices.flatMap(i=>Array.from(p.p.slice(i*3,i*3+3)))),attr=new Float32Array(c.vertices.flatMap(i=>[...p.n.slice(i*3,i*3+3),...p.uv.slice(i*2,i*2+2)])),ci=new Uint32Array(c.indices.map(i=>remap.get(i))),locks=Uint8Array.from({length:c.vertices.length},(_,i)=>cp[i*3+1]<rootY+.03?1:0);
  const near=lod==='near',target=Math.max(near?12:4,Math.floor(ci.length/3*(near?.1:.012)))*3;
  const weights=near?[.03,.03,.03,.08,.08]:[.01,.01,.01,.015,.015],flags=near?['LockBorder']:[];
  let[simplified,error]=MeshoptSimplifier.simplifyWithAttributes(ci,cp,3,attr,5,weights,locks,target,near?.03:.2,flags);
  if(!connected(simplified,c.vertices.length)){
   protectedConnections++;
   for(let retry=1;retry<=3&&!connected(simplified,c.vertices.length);retry++)[simplified,error]=MeshoptSimplifier.simplifyWithAttributes(ci,cp,3,attr,5,weights,locks,Math.min(ci.length,Math.ceil(target*1.5**retry/3)*3),(near?.03:.2)/2**retry,flags);
   if(!connected(simplified,c.vertices.length)){simplified=ci;error=0;}
  }
  maxError=Math.max(maxError,error);woodTriangles+=simplified.length/3;
  const used=[...new Set(simplified)],outRemap=new Map(used.map((v,i)=>[v,i+positions.length/3]));for(const i of used){positions.push(cp[i*3],cp[i*3+1]-rootY,cp[i*3+2]);normals.push(...attr.slice(i*5,i*5+3));const uv=[(2+attr[i*5+3]*1020)/2048,(1538+attr[i*5+4]*508)/2048];uvs.push(...uv);}for(const i of simplified)indices.push(outRemap.get(i));
 }
 const foliage=clusters.filter(c=>c.lod===lod);
 for(const g of foliage)for(const[axis,front]of[[0,0],[1,1],[2,2]]){
  // Plane bases exactly match the three orthographic camera up/right axes.
  const basis=axis===0?[[0,0,-1],[0,1,0]]:axis===1?[[1,0,0],[0,0,-1]]:[[1,0,0],[0,1,0]],first=positions.length/3;
  for(const[u,v]of[[0,0],[1,0],[1,1],[0,1]]){const delta=[0,1,2].map(a=>((u*2-1)*basis[0][a]+(v*2-1)*basis[1][a])*g.radius*1.04);positions.push(...delta.map((d,a)=>g.center[a]+d-(a===1?rootY:0)));const normal=delta.map((d,a)=>g.center[a]+d*.3-(a===1?1.9:0)),length=Math.max(.0001,Math.hypot(...normal));normals.push(...normal.map(v=>v/length));uvs.push(...tileUv(g.tileGroup,front,u,v));}
  indices.push(first,first+1,first+2,first,first+2,first+3);
 }
 assert.ok(positions.length/3<65536);assert.ok(positions.every(Number.isFinite)&&normals.every(Number.isFinite));
 const mesh=doc.createMesh('Coastal tree '+lod).addPrimitive(doc.createPrimitive().setAttribute('POSITION',accessor(doc,buffer,'VEC3',new Float32Array(positions))).setAttribute('NORMAL',accessor(doc,buffer,'VEC3',new Float32Array(normals))).setAttribute('TEXCOORD_0',accessor(doc,buffer,'VEC2',new Float32Array(uvs))).setIndices(accessor(doc,buffer,'SCALAR',new Uint16Array(indices))).setMaterial(material));scene.addChild(doc.createNode('coastal_tree_'+lod).setMesh(mesh));
 variants.push({lod,triangles:indices.length/3,vertices:positions.length/3,woodTriangles,woodComponents:parts[0].length,foliageClusters:foliage.length,maxRelativeWoodError:maxError,protectedConnections,rootY});
}
await io.write(output+'/tree.gltf',doc);
const metadata={asset:'island_tree_01',page:'https://polyhaven.com/a/island_tree_01',license:'CC0-1.0',authors:{'Rob Tuytel':'scanning, processing','Rico Cilliers':'cleanup, processing'},sourceFiles:provenance,sourceTriangles:primitives.map(p=>p.indices.length/3),sourceComponents:parts.map(p=>p.length),conversion:'Main wood simplified per connected component, lowest 3cm locked; near also locks borders, far relaxes boundary simplification. All leaf/twig components partitioned by spatial centroid into .65m/1.05m cells. Every cell baked in three positive axis views without fixed lighting. Three orthogonal alpha cards per spatial cluster, identical image on both sides. Base alpha coverage corrected against supersampled area. Same scanned volume and root for both LODs; no whole-tree billboard. Source branch texture repeat [15,3.4], offset [0,-2.4] applied only during bake.',atlas:{size:2048,tileSize:64,gutter:2,foliage:[0,0,2048,1536],bark:[0,1536,1024,512],surfaceSize:[512,256]},variants,clusters:clusters.map(({lod,center,radius,tileGroup,leaves})=>({lod,center,radius,tileGroup,leaves})),preparedAssets:[]};
for(const file of['tree.gltf','tree.bin']){const data=await readFile(output+'/'+file);metadata.preparedAssets.push({file,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});}
await writeFile(output+'/source.json',JSON.stringify(metadata,null,2)+'\n');console.log(JSON.stringify({output,variants,bakeClusters:clusterIndex,preparedAssets:metadata.preparedAssets}));
