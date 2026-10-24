// Read actual uploaded terrain textures through an unlit texelFetch shader.
// CPU WebP losslessness does not imply a browser JPEG/alpha round trip is exact.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium,webkit,devices} from '@playwright/test';
const label=process.env.PACK_LABEL??String(Date.now());assert.match(label,/^[a-z0-9-]+$/);
const kind=process.env.PACK_BROWSER??'chrome',out=`artifacts/packed-ground-${label}`;await mkdir(out);
const browser=kind==='webkit'?await webkit.launch({executablePath:path.resolve('work/webkit-runtime/launch-webkit.sh')}):await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']}),page=await browser.newPage({...devices[kind==='webkit'?'iPhone 13':'Pixel 7'],viewport:{width:844,height:390}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
for(const file of ['three.module.js','three.core.js'])await page.route(`**/__qa/${file}`,route=>route.fulfill({path:path.resolve('node_modules/three/build',file),contentType:'text/javascript'}));
for(const file of ['normal','roughness'])await page.route(`**/__qa/field-${file}.jpg`,route=>route.fulfill({path:path.resolve(`work/withered-grass-source/${file}.jpg`),contentType:'image/jpeg'}));
await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));window.packObjects=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',e=>packObjects.push(e.detail));});
try{
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:4191')+'/?test=1');await page.evaluate(async()=>{await window.__THREE_GAME_TEST_HOOKS__.setState('field-verge');window.__THREE_GAME_TEST_HOOKS__.setPausedForScreenshot(true);});
 const result=await page.evaluate(async()=>{
  const T=await import('/__qa/three.module.js'),scene=packObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape')),renderer=packObjects.find(o=>o.isWebGLRenderer),ground=scene.getObjectByName('Limestone headland and grassy interior').material,uniforms=renderer.properties.get(ground).uniforms,gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
  const probeScene=new T.Scene(),camera=new T.Camera(),geometry=new T.PlaneGeometry(2,2),material=new T.RawShaderMaterial({glslVersion:T.GLSL3,uniforms:{uInput:{value:null},uAlpha:{value:false}},vertexShader:'in vec3 position;void main(){gl_Position=vec4(position,1.0);}',fragmentShader:'precision highp float;uniform sampler2D uInput;uniform bool uAlpha;out vec4 color;void main(){vec4 value=texelFetch(uInput,ivec2(gl_FragCoord.xy),0);color=vec4(uAlpha?vec3(value.a):value.rgb,1.0);}',depthTest:false,depthWrite:false,blending:T.NoBlending}),quad=new T.Mesh(geometry,material),target=new T.WebGLRenderTarget(1024,1024,{depthBuffer:false,stencilBuffer:false});probeScene.add(quad);
  const previous=renderer.getRenderTarget(),samples=[],loader=new T.TextureLoader(),render=(texture,alpha)=>{material.uniforms.uInput.value=texture;material.uniforms.uAlpha.value=alpha;renderer.setRenderTarget(target);renderer.render(probeScene,camera);const pixels=new Uint8Array(1024*1024*4);renderer.readRenderTargetPixels(target,0,0,1024,1024,pixels);return pixels;},compare=(a,b)=>{let maximum=0,changed=0,sum=0;for(let i=0;i<a.length;i+=4)for(let c=0;c<3;c++){const delta=Math.abs(a[i+c]-b[i+c]);maximum=Math.max(maximum,delta);if(delta)changed++;sum+=delta;}return{maxByteError:maximum,changedChannels:changed,meanByteError:sum/(1024*1024*3)};};
  try{
   for(const [role,stem] of [['Ground','ground'],['Sand','sand'],['Field','field']]){
    const normal=await loader.loadAsync(stem==='field'?'/__qa/field-normal.jpg':`/assets/environment/${stem}-normal.jpg`),rough=await loader.loadAsync(stem==='field'?'/__qa/field-roughness.jpg':`/assets/environment/${stem}-roughness.jpg`);
    try{normal.colorSpace=rough.colorSpace=T.NoColorSpace;const packed=uniforms[`u${role}Surface`].value;samples.push({role,normal:compare(render(normal,false),render(packed,false)),roughness:compare(render(rough,false),render(packed,true))});}finally{normal.dispose();rough.dispose();}
   }
  }finally{renderer.setRenderTarget(previous);target.dispose();geometry.dispose();material.dispose();renderer.resetState();}
  return{kind:'1024² texelFetch/readRenderTargetPixels of actual game texture objects; reference JPEGs decoded/uploaded by the same browser; not CPU encoding comparison or phone FPS',gpu:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),samples};
 });
 result.browser=kind;result.bundle=await page.locator('script[type=module][src]').getAttribute('src');result.errors=errors;await writeFile(`${out}/result.json`,JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify({out,...result}));assert.deepEqual(errors,[]);
 for(const sample of result.samples){assert.ok(sample.normal.maxByteError<=3);assert.ok(sample.roughness.maxByteError<=2);}
}catch(error){await writeFile(`${out}/failure.json`,JSON.stringify({error:String(error),errors},null,2),{flag:'wx'});throw error;}finally{await browser.close();}
