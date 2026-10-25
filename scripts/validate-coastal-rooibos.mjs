// Independent binary/source checks; the preparer's counts are not the oracle.
import assert from 'node:assert/strict';
import {NodeIO} from '@gltf-transform/core';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {PNG} from 'pngjs';
const root='public/assets/models/coastal_rooibos',cache='work/coastal-shrub-candidates/wild_rooibos_bush',label=process.env.SCRUB_LABEL??String(Date.now());assert.match(label,/^[a-z0-9-]+$/);
const out='artifacts/coastal-rooibos-validation-'+label;await mkdir(out);
const source=JSON.parse(await readFile(root+'/source.json','utf8')),proxy=JSON.parse(await readFile(root+'/impostor-source.json','utf8')),geometry=[];
assert.equal(source.license,'CC0-1.0');assert.deepEqual(Object.keys(source.authors).sort(),['James Ray Cock','Jenelle van Heerden']);
for(const [base,files]of [[cache,source.sourceFiles],[root,source.preparedAssets],[root,proxy.inputs],[root,[proxy.output,proxy.normalOutput]]])for(const file of files){const bytes=await readFile(base+'/'+file.path);if(file.bytes)assert.equal(bytes.length,file.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);}
assert.equal(proxy.bakerInputs.length,3);for(const file of proxy.bakerInputs)assert.equal(createHash('sha256').update(await readFile(file.path)).digest('hex'),file.sha256);
const originalJSON=JSON.parse(await readFile(cache+'/wild_rooibos_bush_1k.gltf','utf8')),materialNames=originalJSON.materials.map(m=>m.name);originalJSON.images=[];originalJSON.textures=[];originalJSON.materials=originalJSON.materials.map(()=>({}));
const io=new NodeIO(),original=await io.readJSON({json:originalJSON,resources:{'wild_rooibos_bush.bin':await readFile(cache+'/wild_rooibos_bush.bin')}}),derived=await io.read(root+'/scrub.gltf');
assert.equal(derived.getRoot().listMeshes().length,4);
for(const mesh of derived.getRoot().listMeshes()){
 const [,variant,lod]=mesh.getName().match(/^Coastal scrub ([01]) (near|far)$/),meta=source.variants.find(v=>v.variant===Number(variant)&&v.lod===lod),input=original.getRoot().listNodes().find(n=>n.getName()===meta.node),originalVertices=[],woodBoundary=[],inputPrimitives=originalJSON.meshes[originalJSON.nodes.find(n=>n.name===meta.node).mesh].primitives;
 for(const [primitiveIndex,primitive]of input.getMesh().listPrimitives().entries()){
  const p=primitive.getAttribute('POSITION').getArray(),n=primitive.getAttribute('NORMAL').getArray(),uv=primitive.getAttribute('TEXCOORD_0').getArray();
  for(let i=0;i<p.length/3;i++)originalVertices.push([p[i*3],p[i*3+1],p[i*3+2],n[i*3],n[i*3+1],n[i*3+2],uv[i*2],uv[i*2+1]]);
  if(materialNames[inputPrimitives[primitiveIndex].material]!=='wild_rooibos_bush')continue;
  const edges=new Map(),faces=primitive.getIndices().getArray();for(let i=0;i<faces.length;i+=3)for(const [a,b]of [[faces[i],faces[i+1]],[faces[i+1],faces[i+2]],[faces[i+2],faces[i]]]){const key=a<b?`${a},${b}`:`${b},${a}`;edges.set(key,(edges.get(key)??0)+1);}
  const boundary=new Set();for(const [key,count]of edges)if(count===1)key.split(',').forEach(i=>boundary.add(Number(i)));
  for(const i of boundary)woodBoundary.push([p[i*3],p[i*3+1],p[i*3+2],uv[i*2],uv[i*2+1]]);
 }
 const ys=originalVertices.map(v=>v[1]),bottom=Math.min(...ys),top=Math.max(...ys),scale=.91/(top-bottom),sx=scale*meta.horizontalWiden,primitive=mesh.listPrimitives()[0],p=primitive.getAttribute('POSITION').getArray(),n=primitive.getAttribute('NORMAL').getArray(),uv=primitive.getAttribute('TEXCOORD_0').getArray(),indices=primitive.getIndices().getArray(),parent=Uint32Array.from({length:p.length/3},(_,i)=>i),find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
 assert.ok(p.every(Number.isFinite)&&n.every(Number.isFinite)&&uv.every(Number.isFinite));assert.ok(uv.every(v=>v>=0&&v<=1));
 let maxNormalError=0,maxSourceNormalError=0,degenerate=0;const exportedVertices=[];
 for(let i=0;i<p.length/3;i++){
  maxNormalError=Math.max(maxNormalError,Math.abs(Math.hypot(n[i*3],n[i*3+1],n[i*3+2])-1));
  const xyz=[p[i*3]/sx+meta.root[0],p[i*3+1]/scale+meta.root[1],p[i*3+2]/sx+meta.root[2]],matches=originalVertices.filter(v=>Math.abs(v[0]-xyz[0])<2e-6&&Math.abs(v[1]-xyz[1])<2e-6&&Math.abs(v[2]-xyz[2])<2e-6&&Math.abs(v[6]-uv[i*2])<1e-6&&Math.abs(v[7]-uv[i*2+1])<1e-6);
  exportedVertices.push([...xyz,uv[i*2],uv[i*2+1]]);
  assert.ok(matches.length,'every derived vertex and UV must match a source vertex');let error=Infinity;
  for(const v of matches){const normal=[v[3]/sx,v[4]/scale,v[5]/sx],length=Math.hypot(...normal);error=Math.min(error,Math.hypot(...normal.map((a,k)=>a/length-n[i*3+k])));}maxSourceNormalError=Math.max(maxSourceNormalError,error);
 }
 for(let i=0;i<indices.length;i+=3){const [a,b,c]=Array.from(indices.slice(i,i+3));parent[find(b)]=find(a);parent[find(c)]=find(a);const ab=[0,1,2].map(k=>p[b*3+k]-p[a*3+k]),ac=[0,1,2].map(k=>p[c*3+k]-p[a*3+k]);if(Math.hypot(ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0])<1e-12)degenerate++;}
 const components=new Set(Array.from(indices,i=>find(i))).size,minY=Math.min(...p.filter((_,i)=>i%3===1)),maxY=Math.max(...p.filter((_,i)=>i%3===1));
 assert.equal(components,meta.sourceComponents);assert.equal(degenerate,0);assert.equal(minY,0);assert.ok(maxNormalError<1e-6&&maxSourceNormalError<1e-6);assert.equal(indices.length/3,meta.triangles);
 const missingWoodBoundary=woodBoundary.filter(v=>!exportedVertices.some(p=>v.slice(0,3).every((value,k)=>Math.abs(value-p[k])<2e-6))).length;assert.ok(woodBoundary.length>0);assert.equal(missingWoodBoundary,0);
 geometry.push({name:mesh.getName(),triangles:indices.length/3,components,degenerate,minY,maxY,maxNormalError,maxSourceNormalError,woodBoundaryVertices:woodBoundary.length,missingWoodBoundary});
}
// The official mask is RGB16. Pillow converts its high bytes to 8-bit first;
// pngjs's default rescaling rounds differently at a few 16-bit sample values.
const alpha=PNG.sync.read(await readFile(cache+'/textures/wild_rooibos_bush_alpha_1k.png'),{skipRescale:true}),color=PNG.sync.read(await readFile(root+'/scrub-color.png'));let alphaError=0;
assert.equal(alpha.depth,16);assert.deepEqual([color.width,color.height],[1024,1024]);for(let i=0;i<color.width*color.height;i++)alphaError=Math.max(alphaError,Math.abs(color.data[i*4+3]-(alpha.data[i*4]>>8)));assert.equal(alphaError,0);assert.equal(proxy.views.length,10);assert.ok(proxy.views.every(v=>v.covered>100));
const result={geometry,alphaError,sourceAndProxyHashesVerified:true};await writeFile(out+'/result.json',JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify({out,...result}));
