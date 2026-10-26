// Check the actual uploaded game texture and compiled proxy material. The CPU
// mip oracle sums original texels directly, independently of the runtime chain.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium,webkit,devices} from 'playwright';
const label=process.env.NORMAL_LABEL,kind=process.env.NORMAL_BROWSER??'chrome';assert.match(label??'',/^[a-z0-9-]+$/);assert.ok(['chrome','webkit'].includes(kind));
const out=`artifacts/scrub-normals-${label}`;await mkdir(out);
const browser=kind==='webkit'?await webkit.launch({executablePath:path.resolve('work/webkit-runtime/launch-webkit.sh')}):await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']}),page=await browser.newPage({...devices[kind==='webkit'?'iPhone 13':'Pixel 7'],viewport:{width:844,height:390}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
for(const file of ['three.module.js','three.core.js'])await page.route(`**/__qa/${file}`,route=>route.fulfill({path:path.resolve('node_modules/three/build',file),contentType:'text/javascript'}));
await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));window.normalObjects=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',e=>normalObjects.push(e.detail));});
try{
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:4191')+'/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setState('field-verge'));
 const result=await page.evaluate(async()=>{
  const T=await import('/__qa/three.module.js'),world=normalObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape')),root=world.getObjectByName('Coastal landscape'),renderer=normalObjects.find(o=>o.isWebGLRenderer),source=root.getObjectByName('Inland grey green scrub impostor 0');
  window.__THREE_GAME_TEST_HOOKS__.setPausedForScreenshot(true);let binding=false;
  source.onAfterRender=()=>{const gl=renderer.getContext(),props=renderer.properties.get(source.material),texture=props.uniforms.uScrubProxyNormal.value,program=props.currentProgram.program,active=gl.getParameter(gl.ACTIVE_TEXTURE),unit=gl.getUniform(program,gl.getUniformLocation(program,'uScrubProxyNormal'));gl.activeTexture(gl.TEXTURE0+unit);binding=Boolean(renderer.properties.get(texture).__webglTexture)&&gl.getParameter(gl.TEXTURE_BINDING_2D)===renderer.properties.get(texture).__webglTexture;gl.activeTexture(active);};
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));source.onAfterRender=()=>{};
  const normal=renderer.properties.get(source.material).uniforms.uScrubProxyNormal.value,color=source.material.map,width=normal.image.width,base=normal.image.getContext('2d').getImageData(0,0,width,width).data,mask=color.image.getContext('2d').getImageData(0,0,width,width).data,mips=[];
  const baseUnit=new Float64Array(width*width*3);for(let i=0;i<width*width;i++){const v=[0,1,2].map(c=>base[i*4+c]/127.5-1),length=Math.hypot(...v);for(let c=0;c<3;c++)baseUnit[i*3+c]=v[c]/length;}
  for(let level=1;level<normal.mipmaps.length;level++){
   const canvas=normal.mipmaps[level],size=canvas.width,step=width/size,data=canvas.getContext('2d').getImageData(0,0,size,size).data;let maxByteError=0,covered=0,cancelled=0;
   for(let y=0;y<size;y++)for(let x=0;x<size;x++){const sum=[0,0,0];let alpha=0;for(let dy=0;dy<step;dy++)for(let dx=0;dx<step;dx++){const i=((y*step+dy)*width+x*step+dx),a=mask[i*4+3];alpha+=a;for(let c=0;c<3;c++)sum[c]+=baseUnit[i*3+c]*a;}if(!alpha)continue;covered++;const length=Math.hypot(...sum),zero=length/alpha<=1e-8;if(zero)cancelled++;for(let c=0;c<3;c++){const direction=zero?(c===1?1:0):sum[c]/length;maxByteError=Math.max(maxByteError,Math.abs(data[(y*size+x)*4+c]-Math.round((direction*.5+.5)*255)));}}
   mips.push({level,size,covered,cancelled,maxByteError});
  }
  // Opposite normals can cancel exactly. A residual from Float64 addition
  // has no direction; verify the documented up-normal fallback in that case.
  const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info'),probe=new T.Scene(),camera=new T.Camera(),geometry=new T.PlaneGeometry(2,2),material=new T.RawShaderMaterial({glslVersion:T.GLSL3,uniforms:{uInput:{value:normal},uLevel:{value:0}},vertexShader:'in vec3 position;void main(){gl_Position=vec4(position,1.0);}',fragmentShader:'precision highp float;uniform sampler2D uInput;uniform int uLevel;out vec4 color;void main(){color=texelFetch(uInput,ivec2(gl_FragCoord.xy),uLevel);}',depthTest:false,blending:T.NoBlending}),quad=new T.Mesh(geometry,material),target=new T.WebGLRenderTarget(512,512,{depthBuffer:false}),previous=renderer.getRenderTarget(),uploads=[];probe.add(quad);
  try{for(let level=0;level<normal.mipmaps.length;level++){
   const canvas=normal.mipmaps[level],size=canvas.width,data=canvas.getContext('2d').getImageData(0,0,size,size).data,pixels=new Uint8Array(size*size*4);target.setSize(size,size);material.uniforms.uLevel.value=level;renderer.setRenderTarget(target);renderer.render(probe,camera);renderer.readRenderTargetPixels(target,0,0,size,size,pixels);let maxByteError=0,minAlpha=255;
   for(let y=0;y<size;y++)for(let x=0;x<size;x++)for(let c=0;c<4;c++){const actual=pixels[(y*size+x)*4+c],expected=data[((normal.flipY?size-1-y:y)*size+x)*4+c];maxByteError=Math.max(maxByteError,Math.abs(actual-expected));if(c===3)minAlpha=Math.min(minAlpha,actual);}uploads.push({level,size,maxByteError,minAlpha});
  }}finally{renderer.setRenderTarget(previous);target.dispose();geometry.dispose();material.dispose();renderer.resetState();}
  // Keep the production normal decoder/frame shader; only replace the final
  // output with that decoded vector so lighting cannot hide an axis error.
  const frameMaterial=source.material.clone(),compile=source.material.onBeforeCompile,known=[173,230,66],constant=new T.DataTexture(new Uint8Array([...known,255]),1,1),white=new T.DataTexture(new Uint8Array([255,255,255,255]),1,1);constant.needsUpdate=white.needsUpdate=true;frameMaterial.map=white;frameMaterial.fog=false;frameMaterial.toneMapped=false;frameMaterial.alphaToCoverage=false;frameMaterial.blending=T.NoBlending;
  frameMaterial.onBeforeCompile=(shader,r)=>{compile(shader,r);shader.uniforms.uScrubProxyNormal.value=constant;shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','outgoingLight=normalize(scrubProxyWorldN)*.5+.5;\n#include <opaque_fragment>');};frameMaterial.customProgramCacheKey=()=>source.material.customProgramCacheKey()+'-qa-object-normal-output';
  const frameScene=new T.Scene(),frameGeometry=new T.PlaneGeometry(2,2);frameGeometry.setAttribute('instanceGroundSlope',new T.InstancedBufferAttribute(new Float32Array(3),3));const mesh=new T.InstancedMesh(frameGeometry,frameMaterial,1);mesh.frustumCulled=false;frameScene.add(mesh);const frameCamera=new T.PerspectiveCamera(25,1,.1,20),frameTarget=new T.WebGLRenderTarget(32,32),frames=[];
  try{for(const yaw of [0,Math.PI/2,Math.PI,Math.PI*1.5])for(const sy of [.6,1.4]){
   const matrix=new T.Matrix4().compose(new T.Vector3(),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),yaw),new T.Vector3(2,sy,2));mesh.setMatrixAt(0,matrix);mesh.instanceMatrix.needsUpdate=true;frameCamera.position.set(Math.sin(yaw)*5,0,Math.cos(yaw)*5);frameCamera.lookAt(0,0,0);frameCamera.updateMatrixWorld();renderer.setRenderTarget(frameTarget);renderer.render(frameScene,frameCamera);const pixels=new Uint8Array(4);renderer.readRenderTargetPixels(frameTarget,16,16,1,1,pixels);const expected=new T.Vector3(...known.map(v=>v/127.5-1)).applyMatrix3(new T.Matrix3().getNormalMatrix(matrix)).normalize().toArray().map(v=>Math.round((v*.5+.5)*255));frames.push({yaw,sy,actual:Array.from(pixels),expected,maxByteError:Math.max(...expected.map((v,c)=>Math.abs(v-pixels[c])))});
  }}finally{renderer.setRenderTarget(previous);frameTarget.dispose();frameGeometry.dispose();frameMaterial.dispose();constant.dispose();white.dispose();renderer.resetState();}
  return{gpu:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),binding,colorSpace:normal.colorSpace,generateMipmaps:normal.generateMipmaps,metadata:normal.userData.normalMips,mips,uploads,frames};
 });
 result.bundle=await page.locator('script[type=module][src]').getAttribute('src');result.browser=kind;result.errors=errors;await writeFile(out+'/result.json',JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify({out,...result}));
 assert.equal(result.binding,true);assert.equal(result.colorSpace,'');assert.equal(result.generateMipmaps,false);assert.equal(result.metadata.levels,10);assert.deepEqual(errors,[]);assert.ok(result.mips.every(m=>m.maxByteError<=1));assert.ok(result.uploads.every(m=>m.maxByteError===0&&m.minAlpha===255));assert.ok(result.frames.every(m=>m.maxByteError<=1));
}catch(error){await writeFile(out+'/failure.json',JSON.stringify({error:String(error),errors},null,2),{flag:'wx'});throw error;}finally{await browser.close();}
