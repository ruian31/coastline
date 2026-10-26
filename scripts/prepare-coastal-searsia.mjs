// Preserve the complete photographed f/g plants at close range. Distant leaf
// and twig charts use isolated source triangle masks; all wood parts survive.
// This offline recipe never changes runtime placements or removes source leaves.
import assert from 'node:assert/strict';
import {Document,NodeIO} from '@gltf-transform/core';
import {MeshoptSimplifier} from 'meshoptimizer';
import {PNG} from 'pngjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const cache='work/searsia-source',output=process.env.COASTAL_SEARSIA_OUTPUT??'public/assets/models/coastal_searsia';
const inputs=[
 {
  "path": "searsia_lucida_1k.gltf",
  "url": "https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/searsia_lucida/searsia_lucida_1k.gltf",
  "size": 31443,
  "md5": "befd961f4f139131eda7dfca952e8d78",
  "sha256": "ebdc8d776c058b9a6f9a04c57ca0540368531febd3bfa007d2e2d8af8d368f67"
 },
 {
  "path": "searsia_lucida.bin",
  "url": "https://dl.polyhaven.org/file/ph-assets/Models/gltf/8k/searsia_lucida/searsia_lucida.bin",
  "size": 17913396,
  "md5": "aa4c42ee903a3ac22d53386d82480e6d",
  "sha256": "e0be13cac215725de1f8438d96e1010049d655512a0608c36eabe2ba5abff851"
 },
 {
  "path": "textures/searsia_lucida_diff_1k.jpg",
  "url": "https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/searsia_lucida/searsia_lucida_diff_1k.jpg",
  "size": 498655,
  "md5": "d41a7089a41122ddc4edc96288105ecd",
  "sha256": "5d99ed106c6629d91cf5d29f067c1fd10ff4894df40634abb6c4694c59d3c764"
 },
 {
  "path": "textures/searsia_lucida_alpha_1k.png",
  "url": "https://dl.polyhaven.org/file/ph-assets/Models/png/1k/searsia_lucida/searsia_lucida_alpha_1k.png",
  "size": 54408,
  "md5": "dd64ebe2b0c5cabf6b8eb2e11df1c4a0",
  "sha256": "2306c054f7188aa34fdbfd1be725899159c82730c1a5c14fcc56ef7353107006"
 }
],provenance=[];
for(const record of inputs){
 const target=path.join(cache,record.path);let data;
 try{data=await readFile(target);}catch(error){if(error.code!=='ENOENT')throw error;const response=await fetch(record.url,{headers:{'User-Agent':'GoldenCoastAssetPipeline/0.1'},signal:AbortSignal.timeout(60000)});assert.ok(response.ok,record.url);data=Buffer.from(await response.arrayBuffer());await mkdir(path.dirname(target),{recursive:true});await writeFile(target,data,{flag:'wx'});}
 assert.equal(data.length,record.size);assert.equal(createHash('md5').update(data).digest('hex'),record.md5);assert.equal(createHash('sha256').update(data).digest('hex'),record.sha256);provenance.push({...record,bytes:record.size});
}
await mkdir(output,{recursive:true});
execFileSync('python3',['-c',`from PIL import Image
from pathlib import Path
p=Path('${cache}/textures')
image=Image.open(p/'searsia_lucida_diff_1k.jpg').convert('RGBA')
alpha=Image.open(p/'searsia_lucida_alpha_1k.png').convert('L')
assert image.size==alpha.size==(1024,1024)
image.putalpha(alpha)
image.save('${cache}/merged-color.png')
`]);
const image=PNG.sync.read(await readFile(cache+'/merged-color.png')),valid=new Uint8Array(image.width*image.height),queue=new Int32Array(valid.length);let queued=0;
for(let i=0;i<valid.length;i++)if(image.data[i*4+3]){valid[i]=1;queue[queued++]=i;}
assert.ok(queued>1000,'photographed alpha must contain foliage');
// Extend RGB only beneath zero alpha; preserve the official silhouette exactly.
for(let at=0;at<queued;at++){const i=queue[at],x=i%image.width,y=Math.floor(i/image.width);for(const[nx,ny]of[[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){if(nx<0||nx>=image.width||ny<0||ny>=image.height)continue;const j=ny*image.width+nx;if(valid[j])continue;valid[j]=1;queue[queued++]=j;for(let c=0;c<3;c++)image.data[j*4+c]=image.data[i*4+c];}}
const glyphs=createGlyphBuilder(image);
const raw=JSON.parse(await readFile(cache+'/searsia_lucida_1k.gltf','utf8')),materialNames=raw.materials.map(m=>m.name);raw.images=[];raw.textures=[];raw.materials=raw.materials.map(()=>({}));
const io=new NodeIO(),original=await io.readJSON({json:raw,resources:{'searsia_lucida.bin':await readFile(cache+'/searsia_lucida.bin')}});
// The new charts must never overwrite a triangle of the original photograph.
for(const mesh of original.getRoot().listMeshes())for(const primitive of mesh.listPrimitives()){
 const uv=primitive.getAttribute('TEXCOORD_0').getArray(),indices=primitive.getIndices().getArray();
 for(let i=0;i<indices.length;i+=3){const xs=Array.from(indices.slice(i,i+3),v=>uv[v*2]*1024);assert.ok(Math.max(...xs)<640||Math.min(...xs)>880,'source UV overlaps reserved glyph columns');}
}
await MeshoptSimplifier.ready;
function geometricIds(positions){const ids=[],lookup=new Map();for(let i=0;i<positions.length;i+=3){const key=[positions[i],positions[i+1],positions[i+2]].map(v=>Math.round(v*1e6)).join(',');if(!lookup.has(key))lookup.set(key,lookup.size);ids.push(lookup.get(key));}return ids;}
function disconnected(indices,positions){const vertices=positions.length/3;
 if(indices.length<3)return true;
 const parent=Uint32Array.from({length:vertices},(_,i)=>i),find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
 for(let i=0;i<indices.length;i+=3){parent[find(indices[i+1])]=find(indices[i]);parent[find(indices[i+2])]=find(indices[i]);}
 const ids=geometricIds(positions),representatives=new Map();for(let i=0;i<vertices;i++){if(representatives.has(ids[i]))parent[find(i)]=find(representatives.get(ids[i]));else representatives.set(ids[i],i);}return new Set(Array.from(indices,i=>find(i))).size!==1;
}
function componentBorder(indices,positions){const ids=geometricIds(positions);
 const edges=new Map();for(let i=0;i<indices.length;i+=3)for(const [a,b]of [[indices[i],indices[i+1]],[indices[i+1],indices[i+2]],[indices[i+2],indices[i]]]){const ga=ids[a],gb=ids[b],key=ga<gb?`${ga},${gb}`:`${gb},${ga}`;const edge=edges.get(key)??{count:0,vertices:[]};edge.count++;edge.vertices.push(a,b);edges.set(key,edge);}
 const border=new Set();for(const edge of edges.values())if(edge.count===1)edge.vertices.forEach(v=>border.add(v));return [...border];
}
const doc=new Document(),buffer=doc.createBuffer().setURI('scrub.bin'),texture=doc.createTexture('Photographed dry fine leaves').setMimeType('image/png').setURI('scrub-color.png'),material=doc.createMaterial('Fine leaf dry coastal scrub').setBaseColorTexture(texture).setDoubleSided(true).setAlphaMode('MASK').setAlphaCutoff(.45).setRoughnessFactor(1).setMetallicFactor(0),scene=doc.createScene('Rooted coastal Searsia'),variants=[];
for(const[variant,nodeName,widen]of[[0,'searsia_lucida_f_LOD0',1.2],[1,'searsia_lucida_g_LOD0',1.2]]){
 const node=original.getRoot().listNodes().find(n=>n.getName()===nodeName);assert.ok(node);const components=[],all=[];let sourceTriangles=0;
 for(const[primitiveIndex,primitive]of node.getMesh().listPrimitives().entries()){
  const sourcePrimitive=raw.meshes[raw.nodes.find(n=>n.name===nodeName).mesh].primitives[primitiveIndex],name=materialNames[sourcePrimitive.material],role=name.endsWith('_leaves')?'leaves':name.endsWith('_twigs')?'twigs':'wood',p=primitive.getAttribute('POSITION').getArray(),n=primitive.getAttribute('NORMAL').getArray(),uv=primitive.getAttribute('TEXCOORD_0').getArray(),indices=primitive.getIndices().getArray(),parent=Uint32Array.from({length:p.length/3},(_,i)=>i),find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};sourceTriangles+=indices.length/3;
  for(let i=0;i<indices.length;i+=3){parent[find(indices[i+1])]=find(indices[i]);parent[find(indices[i+2])]=find(indices[i]);}
  const ids=geometricIds(p),representatives=new Map();for(let i=0;i<ids.length;i++){if(representatives.has(ids[i]))parent[find(i)]=find(representatives.get(ids[i]));else representatives.set(ids[i],i);}
  const groups=new Map();for(let i=0;i<indices.length;i+=3){const key=find(indices[i]),group=groups.get(key)??[];group.push(indices[i],indices[i+1],indices[i+2]);groups.set(key,group);}
  for(const faces of groups.values()){const unique=[...new Set(faces)],remap=new Map(unique.map((v,i)=>[v,i])),positions=new Float32Array(unique.flatMap(i=>Array.from(p.slice(i*3,i*3+3)))),attributes=new Float32Array(unique.flatMap(i=>[...n.slice(i*3,i*3+3),...uv.slice(i*2,i*2+2)]));components.push({role,positions,attributes,indices:new Uint32Array(faces.map(i=>remap.get(i)))});for(let i=0;i<positions.length;i+=3)all.push([positions[i],positions[i+1],positions[i+2]]);}
 }
  const rootY=all.reduce((a,p)=>Math.min(a,p[1]),Infinity),top=all.reduce((a,p)=>Math.max(a,p[1]),-Infinity),feet=all.filter(p=>p[1]<rootY+.005),rootX=feet.reduce((s,p)=>s+p[0],0)/feet.length,rootZ=feet.reduce((s,p)=>s+p[2],0)/feet.length,scale=.91/(top-rootY),scaleXZ=scale*widen;
 for(const lod of ['near','far']){
  const positions=[],normals=[],uvs=[],indices=[],roles={leaves:0,twigs:0,wood:0};let maxError=0,keptWholeComponents=0,omittedWood=0;
  for(const originalComponent of components){
   const near=lod==='near';let c=originalComponent;
   if(!near&&c.role!=='wood')c=glyphs.panel(c);
   if(!near&&c.role==='wood'){
    // Weld coincident wood only for the distant mesh. Average bark UV/normal
    // seams inside the same bark strip; retain every physical wood component.
    const ids=geometricIds(c.positions),groups=new Map();ids.forEach((id,i)=>{const group=groups.get(id)??[];group.push(i);groups.set(id,group);});const positions=[],attributes=[];
    for(const group of groups.values()){const lowest=group.reduce((a,i)=>c.positions[i*3+1]<c.positions[a*3+1]?i:a,group[0]);positions.push(...c.positions.slice(lowest*3,lowest*3+3));const n=[0,1,2].map(k=>group.reduce((s,i)=>s+c.attributes[i*5+k],0)),length=Math.hypot(...n)||1;attributes.push(...n.map(v=>v/length),... [3,4].map(k=>group.reduce((s,i)=>s+c.attributes[i*5+k],0)/group.length));}
    const indices=[];for(let i=0;i<c.indices.length;i+=3){const tri=Array.from(c.indices.slice(i,i+3),j=>ids[j]);if(new Set(tri).size===3)indices.push(...tri);}c={role:c.role,positions:new Float32Array(positions),attributes:new Float32Array(attributes),indices:new Uint32Array(indices)};
   }
   const triangles=c.indices.length/3,locks=Uint8Array.from({length:c.positions.length/3},(_,i)=>c.positions[i*3+1]<rootY+.005?1:0),border=c.role==='wood'?componentBorder(c.indices,c.positions):[];for(const i of border)locks[i]=1;
   let simplified=c.indices,error=0;
   if(!near&&c.role==='wood'){
    [simplified,error]=MeshoptSimplifier.simplifyWithAttributes(c.indices,c.positions,3,c.attributes,5,[0,0,0,.001,.001],locks,Math.min(triangles,Math.max(4,Math.floor(triangles*.16)))*3,.15,['LockBorder']);
    const surviving=new Set(simplified);if(disconnected(simplified,c.positions)||Array.from(locks).some((locked,i)=>locked&&!surviving.has(i))){simplified=c.indices;error=0;keptWholeComponents++;}
   }
   maxError=Math.max(maxError,error);roles[c.role]++;
   const unique=[...new Set(simplified)],remap=new Map(unique.map((v,i)=>[v,i+positions.length/3]));
   for(const i of unique){positions.push((c.positions[i*3]-rootX)*scaleXZ,(c.positions[i*3+1]-rootY)*scale,(c.positions[i*3+2]-rootZ)*scaleXZ);const normal=[c.attributes[i*5]/scaleXZ,c.attributes[i*5+1]/scale,c.attributes[i*5+2]/scaleXZ],length=Math.hypot(...normal);normals.push(...normal.map(v=>v/length));uvs.push(c.attributes[i*5+3],c.attributes[i*5+4]);}indices.push(...Array.from(simplified,i=>remap.get(i)));
  }
  assert.ok(positions.every(Number.isFinite)&&normals.every(Number.isFinite));assert.ok(Math.abs(Math.min(...positions.filter((_,i)=>i%3===1)))<1e-6,'both LODs must retain their original grounded root');assert.ok(positions.length/3<65536);
  const mesh=doc.createMesh(`Coastal scrub ${variant} ${lod}`).addPrimitive(doc.createPrimitive().setAttribute('POSITION',doc.createAccessor().setType('VEC3').setArray(new Float32Array(positions)).setBuffer(buffer)).setAttribute('NORMAL',doc.createAccessor().setType('VEC3').setArray(new Float32Array(normals)).setBuffer(buffer)).setAttribute('TEXCOORD_0',doc.createAccessor().setType('VEC2').setArray(new Float32Array(uvs)).setBuffer(buffer)).setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint16Array(indices)).setBuffer(buffer)).setMaterial(material));scene.addChild(doc.createNode(mesh.getName()).setMesh(mesh));
  variants.push({variant,node:nodeName,lod,sourceTriangles,sourceComponents:components.length,components:Object.values(roles).reduce((a,b)=>a+b,0),roles,triangles:indices.length/3,vertices:positions.length/3,maxError,keptWholeComponents,omittedWood,root:[rootX,rootY,rootZ],heightBeforeSimplification:.91,heightAfterSimplification:Math.max(...positions.filter((_,i)=>i%3===1)),horizontalWiden:widen});
 }
}
const rgba=PNG.sync.write(image);texture.setImage(rgba);await writeFile(output+'/scrub-color.png',rgba);await io.write(output+'/scrub.gltf',doc);const preparedAssets=[];for(const file of ['scrub.gltf','scrub.bin','scrub-color.png']){const data=await readFile(output+'/'+file);preparedAssets.push({path:file,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});}
await writeFile(output+'/source.json',JSON.stringify({asset:'searsia_lucida',page:'https://polyhaven.com/a/searsia_lucida',license:'CC0-1.0',authors:{'James Ray Cock':'modeling','Jenelle van Heerden':'Photography'},sourceFiles:provenance,conversion:'Full source f/g near surfaces: no leaf, twig or wood omission/simplification. Far source leaf/twig UV triangle unions are individually masked into 16 unused 80x160 atlas tiles, 4px padding, 4x supersampling in linear light. Per-component UV-to-XYZ least-squares panels approximate distant curvature; native near UV is unchanged. Far wood welds only coincident positions and averages its bark UV/normals, retaining every component, physical boundary and locked root. Source RGB8/L8 alpha. No random removal or diameter-only support pruning.',glyphs:glyphs.metadata(),nativeAtlasRegions:[[0,0,625,420],[0,420,625,604],...glyphs.regions],variants,preparedAssets},null,2)+'\n');console.log(JSON.stringify({output,variants,preparedAssets}));

// Isolated source-UV cutouts for distant leaf/twig geometry.
// Native near surfaces are kept intact. The glyphs occupy unused atlas space.
function createGlyphBuilder(image){
 const charts=new Map(),regions=[],width=image.width,source=new Uint8Array(image.data);
 const decode=Float64Array.from({length:256},(_,i)=>{const c=i/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}),encode=c=>Math.round(255*(c<=.0031308?c*12.92:1.055*c**(1/2.4)-.055));
 const uv=(c,i)=>[c.attributes[i*5+3],c.attributes[i*5+4]];
 function bary(point,a,b,c){const d=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(d)<1e-14)return null;const x=((b[1]-c[1])*(point[0]-c[0])+(c[0]-b[0])*(point[1]-c[1]))/d,y=((c[1]-a[1])*(point[0]-c[0])+(a[0]-c[0])*(point[1]-c[1]))/d;return[x,y,1-x-y];}
 function chartFor(component){
  const key=Array.from({length:component.indices.length/3},(_,t)=>Array.from(component.indices.slice(t*3,t*3+3),i=>uv(component,i).map(v=>v.toFixed(6)).join(',')).sort().join('/')).sort().join('|');
  if(charts.has(key))return charts.get(key);if(charts.size>=18)throw Error('Source glyphs exceed unused atlas capacity');
  const points=Array.from({length:component.positions.length/3},(_,i)=>uv(component,i)),mean=[0,1].map(c=>points.reduce((s,p)=>s+p[c],0)/points.length);let xx=0,yy=0,xy=0;
  for(const p of points){xx+=(p[0]-mean[0])**2;yy+=(p[1]-mean[1])**2;xy+=(p[0]-mean[0])*(p[1]-mean[1]);}
  const angle=.5*Math.atan2(2*xy,xx-yy),long=[Math.cos(angle),Math.sin(angle)],across=[-long[1],long[0]],project=p=>[p[0]*across[0]+p[1]*across[1],p[0]*long[0]+p[1]*long[1]],projected=points.map(project),min=[0,1].map(c=>Math.min(...projected.map(p=>p[c]))),max=[0,1].map(c=>Math.max(...projected.map(p=>p[c]))),toSource=(s,t)=>[across[0]*(min[0]+s*(max[0]-min[0]))+long[0]*(min[1]+t*(max[1]-min[1])),across[1]*(min[0]+s*(max[0]-min[0]))+long[1]*(min[1]+t*(max[1]-min[1]))];
  const index=charts.size,tileX=640+index%3*80,tileY=Math.floor(index/3)*160,pad=4,w=80,h=160,bodyW=w-pad*2,bodyH=h-pad*2,triangles=Array.from({length:component.indices.length/3},(_,t)=>Array.from(component.indices.slice(t*3,t*3+3),i=>uv(component,i)));
  const inside=p=>triangles.some(tri=>{const weights=bary(p,...tri);return weights&&weights.every(v=>v>=-1e-8);});
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   let alpha=0;const rgb=[0,0,0];
   for(let sy=0;sy<4;sy++)for(let sx=0;sx<4;sx++){
    const point=toSource((x+(sx+.5)/4-pad)/bodyW,(y+(sy+.5)/4-pad)/bodyH);if(!inside(point))continue;
    const px=point[0]*width-.5,py=point[1]*width-.5,ix=Math.floor(px),iy=Math.floor(py),fx=px-ix,fy=py-iy;
    for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const i=(Math.max(0,Math.min(width-1,iy+dy))*width+Math.max(0,Math.min(width-1,ix+dx)))*4,weight=(dx?fx:1-fx)*(dy?fy:1-fy),a=source[i+3]*weight;alpha+=a;for(let c=0;c<3;c++)rgb[c]+=decode[source[i+c]]*a;}
   }
   const i=((tileY+y)*width+tileX+x)*4;for(let c=0;c<3;c++)image.data[i+c]=alpha?encode(rgb[c]/alpha):0;image.data[i+3]=Math.round(alpha/16);
  }
  // RGB dilation stays inside this glyph; its alpha silhouette is untouched.
  const seen=new Uint8Array(w*h),queue=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(image.data[((tileY+y)*width+tileX+x)*4+3]){const i=y*w+x;seen[i]=1;queue.push(i);}
  for(let at=0;at<queue.length;at++){const i=queue[at],x=i%w,y=Math.floor(i/w);for(const[nx,ny]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){if(nx<0||nx>=w||ny<0||ny>=h||seen[ny*w+nx])continue;seen[ny*w+nx]=1;queue.push(ny*w+nx);for(let c=0;c<3;c++)image.data[((tileY+ny)*width+tileX+nx)*4+c]=image.data[((tileY+y)*width+tileX+x)*4+c];}}
  const chart={index,key,tile:[tileX,tileY,w,h],pad,body:[bodyW,bodyH],mean,long,across,min,max,toSource,triangles,role:component.role};charts.set(key,chart);regions.push(chart.tile);return chart;
 }
 function panel(component){
  const chart=chartFor(component),points=Array.from({length:component.positions.length/3},(_,i)=>uv(component,i)),meanUV=[0,1].map(c=>points.reduce((s,p)=>s+p[c],0)/points.length),meanP=[0,1,2].map(c=>points.reduce((s,_,i)=>s+component.positions[i*3+c],0)/points.length);let xx=0,yy=0,xy=0;const px=[0,0,0],py=[0,0,0];
  for(let i=0;i<points.length;i++){const u=points[i][0]-meanUV[0],v=points[i][1]-meanUV[1];xx+=u*u;yy+=v*v;xy+=u*v;for(let c=0;c<3;c++){px[c]+=u*(component.positions[i*3+c]-meanP[c]);py[c]+=v*(component.positions[i*3+c]-meanP[c]);}}
  const determinant=xx*yy-xy*xy;if(determinant<1e-14)throw Error('Degenerate source UV panel');const du=px.map((v,c)=>(yy*v-xy*py[c])/determinant),dv=py.map((v,c)=>(xx*v-xy*px[c])/determinant),fit=p=>meanP.map((v,c)=>v+du[c]*(p[0]-meanUV[0])+dv[c]*(p[1]-meanUV[1]));
  const cross=[du[1]*dv[2]-du[2]*dv[1],du[2]*dv[0]-du[0]*dv[2],du[0]*dv[1]-du[1]*dv[0]],average=[0,1,2].map(c=>points.reduce((sum,_,i)=>sum+component.attributes[i*5+c],0)),sign=cross.reduce((sum,v,i)=>sum+v*average[i],0)<0?-1:1,length=Math.hypot(...cross);if(length<1e-10)throw Error('Degenerate fitted panel');const normal=cross.map(v=>v/length*sign);
  const segments=1,positions=[],attributes=[],indices=[];
  for(let row=0;row<=segments;row++)for(let side=0;side<2;side++){
   const point=chart.toSource(side,row/segments),p=fit(point);positions.push(...p);attributes.push(...normal,(chart.tile[0]+chart.pad+side*chart.body[0])/width,(chart.tile[1]+chart.pad+row/segments*chart.body[1])/width);
  }
  for(let row=0;row<segments;row++){const a=row*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  // Match the original facing; normals are transformed later with the clump.
  const a=positions.slice(0,3),b=positions.slice(3,6),c=positions.slice(6,9),ab=b.map((v,i)=>v-a[i]),ac=c.map((v,i)=>v-a[i]),faceCross=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
  if(faceCross.reduce((s,v,i)=>s+v*attributes[i],0)<0)for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
  return{role:component.role,positions:new Float32Array(positions),attributes:new Float32Array(attributes),indices:new Uint32Array(indices)};
 }
 return{panel,regions,metadata:()=>[...charts.values()].map(({index,role,tile,pad,body,mean,long,across,min,max,triangles})=>({index,role,tile,pad,body,mean,long,across,min,max,triangles}))};
}
