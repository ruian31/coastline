// Actual game geometry and decoded alpha atlases, rendered as controlled white
// masks. This diagnoses minification; it does not score beauty or phone FPS.
import assert from 'node:assert/strict';
import {chromium,devices} from 'playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import ts from 'typescript';
import {PNG} from 'pngjs';
const label=process.env.GRASS_LABEL;assert.match(label??'',/^[a-z0-9-]+$/);const out='artifacts/grass-coverage-'+label;await mkdir(out);
const helper=await readFile('src/world/PlantTexture.ts','utf8'),helperJS=ts.transpileModule(helper,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace(/from ['"]three['"]/g,"from '/__qa/three.module.js'");
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']}),page=await browser.newPage({...devices['Pixel 7'],viewport:{width:844,height:390}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
for(const file of ['three.module.js','three.core.js'])await page.route('**/__qa/'+file,route=>route.fulfill({path:path.resolve('node_modules/three/build',file),contentType:'text/javascript'}));
await page.route('**/__qa/PlantTexture.js',route=>route.fulfill({body:helperJS,contentType:'text/javascript'}));
await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));window.grassProbeObjects=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',e=>grassProbeObjects.push(e.detail));});
try{
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:4191')+'/?test=1');await page.evaluate(async()=>{const h=window.__THREE_GAME_TEST_HOOKS__;await h.setState('field-verge');h.setPausedForScreenshot(true);h.setReducedMotion(true);});
 const result=await page.evaluate(async()=>{
  const T=await import('/__qa/three.module.js'),{preservePlantCutoutMips,centerPlantAlphaCoverage}=await import('/__qa/PlantTexture.js'),world=grassProbeObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape')),renderer=grassProbeObjects.find(o=>o.isWebGLRenderer),root=world.getObjectByName('Coastal landscape'),roles=[['photographed','Photographed low coastal grass 0'],['procedural','Dry inland patch grass clusters']],rows=[],atlases=[];
  const previous=renderer.getRenderTarget(),scene=new T.Scene();scene.background=new T.Color(0);const camera=new T.OrthographicCamera(-1,1,1,-1,.01,20);
  try{for(const [role,name]of roles){
   const source=root.getObjectByName(name),map=source.material.map,canvas=document.createElement('canvas');canvas.width=map.image.width;canvas.height=map.image.height;canvas.getContext('2d').drawImage(map.image,0,0);
   const textures=[false,true].map(corrected=>{const t=new T.CanvasTexture(canvas);for(const p of ['flipY','colorSpace','wrapS','wrapT','minFilter','magFilter','anisotropy'])t[p]=map[p];if(corrected)preservePlantCutoutMips(t,[[0,0,canvas.width,canvas.height]],source.material.alphaTest);return t;});
   const geometry=source.geometry.clone();geometry.computeBoundingBox();const box=geometry.boundingBox,h=box.max.y-box.min.y,center=box.getCenter(new T.Vector3()),mesh=new T.InstancedMesh(geometry,new T.MeshBasicMaterial(),1);mesh.material.dispose();mesh.frustumCulled=false;mesh.setMatrixAt(0,new T.Matrix4());scene.add(mesh);atlases.push({role,name,size:canvas.width,triangles:geometry.index?geometry.index.count/3:geometry.getAttribute('position').count/3,alphaTest:source.material.alphaTest,coverage:textures[1].userData.alphaCoverage});
   try{for(const samples of [0,4]){
    const target=new T.WebGLRenderTarget(128,128,{samples,depthBuffer:true});
    try{for(const corrected of [false,true])for(const centered of [false,true]){
     const material=new T.MeshBasicMaterial({map:textures[corrected?1:0],side:T.DoubleSide,alphaTest:source.material.alphaTest,alphaToCoverage:true,toneMapped:false});
     material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','gl_FragColor=vec4(vec3(1.0),diffuseColor.a);');};if(centered)centerPlantAlphaCoverage(material);mesh.material=material;
     try{for(const angle of [0,Math.PI/2])for(const projectedHeight of [8,16,32,64]){
      const span=h*128/projectedHeight;camera.left=camera.bottom=-span/2;camera.right=camera.top=span/2;camera.position.copy(center).add(new T.Vector3(Math.sin(angle)*4,0,Math.cos(angle)*4));camera.lookAt(center);camera.updateProjectionMatrix();renderer.setRenderTarget(target);renderer.render(scene,camera);
      const data=new Uint8Array(128*128*4);renderer.readRenderTargetPixels(target,0,0,128,128,data);let covered=0,integrated=0;for(let i=0;i<data.length;i+=4){if(data[i]>=128)covered++;integrated+=data[i]/255;}
      rows.push({role,samples,corrected,centered,angle,projectedHeight,covered,integrated,pixels:Array.from(data)});
     }}finally{material.dispose();}
    }}finally{target.dispose();}
   }}finally{scene.remove(mesh);geometry.dispose();textures.forEach(t=>t.dispose());}
  }}finally{renderer.setRenderTarget(previous);}
  const uploads=[],gl=renderer.getContext();
  try{for(const [role,name]of roles){
   const map=root.getObjectByName(name).material.map;if(!map.mipmaps.length){uploads.push({role,manual:false});continue;}
   renderer.initTexture(map);const handle=renderer.properties.get(map).__webglTexture,fb=gl.createFramebuffer(),levels=[];gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
   try{for(const level of [...new Set([0,2,4,8,map.mipmaps.length-1])]){
    const canvas=map.mipmaps[level],cpu=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,gpu=new Uint8Array(cpu.length);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,handle,level);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Incomplete actual grass texture mip');gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,gpu);
    let maxAlphaError=0,maxRgbErrorOnCutout=0;const cutoff=Math.ceil(map.userData.alphaCoverage.threshold*255);
    for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const a=(y*canvas.width+x)*4,b=((map.flipY?canvas.height-1-y:y)*canvas.width+x)*4;maxAlphaError=Math.max(maxAlphaError,Math.abs(gpu[a+3]-cpu[b+3]));if(cpu[b+3]>=cutoff)for(let c=0;c<3;c++)maxRgbErrorOnCutout=Math.max(maxRgbErrorOnCutout,Math.abs(gpu[a+c]-cpu[b+c]));}
    levels.push({level,size:canvas.width,maxAlphaError,maxRgbErrorOnCutout});
   }}finally{gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.deleteFramebuffer(fb);}
   uploads.push({role,manual:true,flipY:map.flipY,levels});
  }}finally{renderer.resetState();renderer.setRenderTarget(previous);}
  return{kind:'Actual runtime meshes/atlases, fixed white cutout masks; all input copies isolated from the game. Actual GPU mip readback accounts for each atlas flipY.',atlases,rows,uploads};
 });
 for(const row of result.rows){const png=new PNG({width:128,height:128}),raw=Buffer.from(row.pixels);for(let y=0;y<128;y++)raw.copy(png.data,y*128*4,(127-y)*128*4,(128-y)*128*4);await writeFile(`${out}/${row.role}-${row.samples}-${Number(row.corrected)}${Number(row.centered)}-${row.angle===0?'front':'side'}-${row.projectedHeight}.png`,PNG.sync.write(png),{flag:'wx'});delete row.pixels;}
 result.bundle=await page.locator('script[type=module][src]').getAttribute('src');result.helperSha256=createHash('sha256').update(helper).digest('hex');result.probeSha256=createHash('sha256').update(await readFile('scripts/check-grass-coverage.mjs')).digest('hex');result.errors=errors;await writeFile(out+'/result.json',JSON.stringify(result,null,2),{flag:'wx'});assert.deepEqual(errors,[]);assert.equal(result.rows.length,128);assert.ok(result.uploads.filter(u=>u.manual).every(u=>u.levels.every(l=>l.maxAlphaError===0&&l.maxRgbErrorOnCutout<=2)));
 // Match each small projected mask to its own ordinary-mip/stock-alpha control.
 // This asserts silhouette retention, not a beauty score or device performance.
 for(const row of result.rows.filter(r=>r.corrected&&r.centered&&r.projectedHeight<=16)){
  const control=result.rows.find(r=>!r.corrected&&!r.centered&&r.role===row.role&&r.samples===row.samples&&r.angle===row.angle&&r.projectedHeight===row.projectedHeight);
  assert.ok(row.covered>0&&row.integrated>control.integrated,JSON.stringify({row,control}));
 }
 console.log(JSON.stringify({out,atlases:result.atlases,uploads:result.uploads,frontSingleSample:result.rows.filter(r=>r.samples===0&&r.angle===0&&r.projectedHeight===8)}));
}finally{await browser.close();}
