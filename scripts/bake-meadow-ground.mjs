// Offline photographed grass -> tileable albedo + tangent normal/roughness.
// One GPU browser at a time; runtime assets are written only after it closes.
import{chromium}from'playwright';import{PNG}from'pngjs';import{readFile,writeFile,mkdir}from'node:fs/promises';import{createHash}from'node:crypto';import{execFileSync}from'node:child_process';import assert from'node:assert/strict';
const label=process.env.MEADOW_LABEL;assert.match(label??'',/^[a-z0-9-]+$/);const density=Number(process.env.MEADOW_DENSITY??288);assert.ok(Number.isInteger(density)&&density>=16&&density<=400);
const cache='work/meadow-grass-source',out='artifacts/meadow-ground-'+label,root='public/assets/environment';await mkdir(cache,{recursive:true});await mkdir(out);
const inputs=[
 ['grass_medium_01_1k.gltf','gltf/1k',27110,'28dd8247f3faa749bf87a0b84be01e7e'],
 ['grass_medium_01.bin','gltf/8k',1006632,'e0527a0561c2dae5b7b5c1b478d8c6bf'],
 ['dry-color.png','png/1k',2167830,'6f5ae8d4f152542de30aad6b6a3ea327','grass_medium_01_dry_diff_1k.png'],
 ['alpha.png','png/1k',648718,'6b5b251ef1ca9a69ab9f49def66d758a','grass_medium_01_alpha_1k.png'],
 ['normal.jpg','jpg/1k',956166,'fcf43dd1253f56e4c361079f34155c37','grass_medium_01_nor_gl_1k.jpg'],
],sources=[];
for(const[file,kind,bytes,md5,remote=file]of inputs){
 const url=`https://dl.polyhaven.org/file/ph-assets/Models/${kind}/grass_medium_01/${remote}`;let data;try{data=await readFile(cache+'/'+file);}catch(e){if(e.code!=='ENOENT')throw e;const response=await fetch(url);assert.ok(response.ok);data=Buffer.from(await response.arrayBuffer());await writeFile(cache+'/'+file,data,{flag:'wx'});}
 assert.equal(data.length,bytes);assert.equal(createHash('md5').update(data).digest('hex'),md5);sources.push({file,url,bytes,md5,sha256:createHash('sha256').update(data).digest('hex')});
}
execFileSync('python3',['-c',`from PIL import Image
p='${cache}/'
color=Image.open(p+'dry-color.png').convert('RGBA')
alpha=Image.open(p+'alpha.png').point(lambda x:x/256).convert('L')
assert color.size==alpha.size==(1024,1024)
color.putalpha(alpha);color.save(p+'bake-color.png',optimize=True)
`]);
const model=JSON.parse(await readFile(cache+'/grass_medium_01_1k.gltf','utf8'));model.images=[{uri:'bake-color.png'},{uri:'normal.jpg'}];model.textures=[{source:0},{source:1}];model.materials=[{alphaMode:'MASK',alphaCutoff:.43,doubleSided:true,normalTexture:{index:1},pbrMetallicRoughness:{baseColorTexture:{index:0},roughnessFactor:1,metallicFactor:0}}];await writeFile(cache+'/bake.gltf',JSON.stringify(model));
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']}),page=await browser.newPage(),errors=[],images={};let metadata;
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:5188')+`/scripts/bake-meadow-ground.html?density=${density}`);await page.waitForFunction(()=>window.bakeReady);
 metadata=await page.evaluate(()=>{const{size,tile,count,submittedTriangles}=window.meadowBake;return{size,tile,count,submittedTriangles};});
 metadata.flatNormal=await page.evaluate(()=>window.meadowBake.render('calibration'));for(const [i,expected]of[128,128,255,255].entries())assert.ok(Math.abs(metadata.flatNormal[i]-expected)<=1,'Linear normal target must preserve a flat up-facing surface');
 metadata.tiltedNormal=await page.evaluate(()=>window.meadowBake.render('calibration-tilt'));for(const [i,expected]of[173,66,230,255].entries())assert.ok(Math.abs(metadata.tiltedNormal[i]-expected)<=1,'Known world +X/-Z/up normal must preserve channel order and sign');
 for(const pass of['color','normal','coverage']){images[pass]=Buffer.from(await page.evaluate(pass=>window.meadowBake.render(pass),pass),'base64');console.log('rendered',pass);}
 for(const pass of['color','normal'])for(const axis of['x','z']){
  const shifted=Buffer.from(await page.evaluate(([pass,axis])=>window.meadowBake.render(pass,axis==='x'?1:0,axis==='z'?1:0),[pass,axis]),'base64'),base=images[pass],{size}=metadata;let changed=0,maxError=0;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){let error=0;const sx=axis==='x'?(x+size/2)%size:x,sy=axis==='z'?(y+size/2)%size:y;for(let c=0;c<4;c++)error=Math.max(error,Math.abs(base[(sy*size+sx)*4+c]-shifted[(y*size+x)*4+c]));maxError=Math.max(maxError,error);if(error>8)changed++;}
  metadata[pass+'PeriodCheck'+axis.toUpperCase()]={method:'Actual camera shift by half a world tile, compared to wrapped original pixels',maxError,changedFraction:changed/(size*size)};assert.ok(changed/(size*size)<.003,'Periodic geometry must render the same wrapped field');
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
for(const[pass,data]of Object.entries(images)){const png=new PNG({width:metadata.size,height:metadata.size});png.data=data;await writeFile(out+'/'+pass+'-source.png',PNG.sync.write(png));}
const decode=Float64Array.from({length:256},(_,i)=>{const c=i/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}),encode=c=>Math.round(255*(c<=.0031308?c*12.92:1.055*c**(1/2.4)-.055));
const size=metadata.size/2,color=new PNG({width:size,height:size}),surface=new PNG({width:size,height:size});let coverage=0,maxNormalLengthError=0;
for(let i=3;i<images.coverage.length;i+=4)coverage+=images.coverage[i]/255;metadata.grassCoverage=coverage/(metadata.size**2);
for(let y=0;y<size;y++)for(let x=0;x<size;x++){
 const rgb=[0,0,0],normal=[0,0,0];let roughness=0;
 for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const i=((y*2+dy)*metadata.size+x*2+dx)*4;assert.equal(images.color[i+3],255);for(let c=0;c<3;c++){rgb[c]+=decode[images.color[i+c]]*.25;normal[c]+=(images.normal[i+c]/127.5-1)*.25;}roughness+=images.normal[i+3]*.25;}
 const i=(y*size+x)*4,length=Math.max(.0001,Math.hypot(...normal));for(let c=0;c<3;c++){color.data[i+c]=encode(rgb[c]);surface.data[i+c]=Math.round((normal[c]/length+1)*127.5);}color.data[i+3]=255;surface.data[i+3]=Math.round(roughness);maxNormalLengthError=Math.max(maxNormalLengthError,Math.abs(Math.hypot(...[0,1,2].map(c=>surface.data[i+c]/127.5-1))-1));
}
metadata.maxNormalLengthError=maxNormalLengthError;assert.ok(maxNormalLengthError<.007);assert.ok(metadata.grassCoverage>.15&&metadata.grassCoverage<.99);
await writeFile(out+'/color.png',PNG.sync.write(color));await writeFile(out+'/surface.png',PNG.sync.write(surface));
execFileSync('python3',['-c',`from PIL import Image
for role in ['color','surface']:
 im=Image.open('${out}/'+role+'.png').convert('RGBA')
 target='${root}/meadow-'+role+'.webp'
 im.save(target,lossless=True,exact=True)
 assert Image.open(target).convert('RGBA').tobytes()==im.tobytes()
`]);
const outputs=[],bakerInputs=[];for(const file of['meadow-color.webp','meadow-surface.webp']){const bytes=await readFile(root+'/'+file);outputs.push({file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
for(const file of['scripts/bake-meadow-ground.html','scripts/bake-meadow-ground.mjs','public/assets/environment/field-color.jpg','public/assets/environment/field-surface.webp'])bakerInputs.push({file,sha256:createHash('sha256').update(await readFile(file)).digest('hex')});
const result={asset:'grass_medium_01',page:'https://polyhaven.com/a/grass_medium_01',license:'CC0-1.0',authors:{'Rob Tuytel':'Photography','Rico Cilliers':'Modeling'},method:'Top-down actual large a/b/c clumps, unlit photographed dry albedo, actual geometry/photo normals and fixed roughness; periodic world placements; linear-light 2x colour downsample and renormalized normals. RGB16 PNG decoded to high-byte RGB8; official separate Alpha16 converted to high-byte Alpha8. Underlay uses existing CC0 Withered Grass scan (dry-field-source.json). Separate sRGB/linear render targets, flat-normal calibration. PNG row zero is world +Z for runtime ground flipY=true and worldXZ UVs; normal RGB is world X/Z/up. No sun or backdrop baked.',sources,bakerInputs,metadata,outputs,errors};
await writeFile(root+'/meadow-source.json',JSON.stringify(result,null,2)+'\n');await writeFile(out+'/result.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({out,metadata,outputs,errors}));
