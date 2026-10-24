// Measure the actual game's distant inland grass material on a single-sample target.
// Constant projected size isolates distance coverage from geometric shrinking.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium,webkit,devices} from 'playwright';
import {PNG} from 'pngjs';
const label=process.env.FADE_LABEL;assert.match(label??'',/^[a-z0-9-]+$/);const kind=process.env.FADE_BROWSER??'chrome',mobile=process.env.FADE_DEVICE!=='desktop',out=`artifacts/grass-fade-${label}`;assert.ok(['chrome','webkit'].includes(kind));await mkdir(out);
const browser=kind==='webkit'?await webkit.launch({executablePath:path.resolve('work/webkit-runtime/launch-webkit.sh')}):await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']}),page=await browser.newPage(mobile?{...devices[kind==='webkit'?'iPhone 13':'Pixel 7'],viewport:{width:844,height:390}}:{viewport:{width:1280,height:720}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
for(const file of ['three.module.js','three.core.js'])await page.route(`**/__qa/${file}`,route=>route.fulfill({path:path.resolve('node_modules/three/build',file),contentType:'text/javascript'}));
await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));window.fadeObjects=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',e=>fadeObjects.push(e.detail));});
try{
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:4191')+'/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setState('field-verge'));
 const result=await page.evaluate(async()=>{
  const T=await import('/__qa/three.module.js'),world=fadeObjects.find(o=>o.isScene&&o.getObjectByName('Coastal landscape')),renderer=fadeObjects.find(o=>o.isWebGLRenderer),root=world.getObjectByName('Coastal landscape'),source=root.getObjectByName('Dry inland patch grass clusters'),geometry=source.geometry.clone(),range=root.userData.fieldGrassDetail.range;
  geometry.setAttribute('instanceGroundSlope',new T.InstancedBufferAttribute(new Float32Array(3),3));geometry.computeBoundingBox();const height=geometry.boundingBox.max.y,probe=new T.Scene();probe.background=new T.Color('#152b3c');probe.add(new T.HemisphereLight(0xffffff,0xffffff,2));
  const mesh=new T.InstancedMesh(geometry,source.material,1);mesh.frustumCulled=false;probe.add(mesh);const camera=new T.PerspectiveCamera(20,1,.1,500),target=new T.WebGLRenderTarget(256,256,{depthBuffer:true,samples:0}),previous=renderer.getRenderTarget(),samples=[];
  try{for(const distance of [range-40,range-30,range-20,range-10,range-3,range,range+5]){
   const scale=distance/8;mesh.setMatrixAt(0,new T.Matrix4().makeScale(scale,scale,scale));mesh.instanceMatrix.needsUpdate=true;camera.position.set(0,height*scale*.5,distance);camera.lookAt(0,height*scale*.5,0);camera.updateMatrixWorld();renderer.setRenderTarget(target);renderer.render(probe,camera);const pixels=new Uint8Array(256*256*4);renderer.readRenderTargetPixels(target,0,0,256,256,pixels);let coverage=0;
   for(let i=0;i<pixels.length;i+=4)if(Math.max(...[0,1,2].map(c=>Math.abs(pixels[i+c]-pixels[c])))>10)coverage++;
   samples.push({distance,coverage,pixels:Array.from(pixels)});
  }}finally{renderer.setRenderTarget(previous);target.dispose();geometry.dispose();}
  return{range,singleSampleTarget:true,actualMaterial:source.material.customProgramCacheKey(),samples};
 });
 for(const sample of result.samples){const png=new PNG({width:256,height:256});png.data=Buffer.from(sample.pixels);await writeFile(`${out}/distance-${sample.distance}.png`,PNG.sync.write(png),{flag:'wx'});delete sample.pixels;}
 result.assertThinning=process.env.FADE_DIAGNOSE!=='1';result.browser=kind;result.device=mobile?'mobile':'desktop';result.bundle=await page.locator('script[type=module][src]').getAttribute('src');result.errors=errors;await writeFile(`${out}/result.json`,JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify({out,...result}));
 assert.equal(result.range,mobile?Number(process.env.FADE_MOBILE_RANGE??120):260);const [base,early,mid,late,lastNear,end,beyond]=result.samples.map(s=>s.coverage);assert.ok(base>100);if(result.assertThinning){assert.ok(early<base&&early>mid);assert.ok(mid>late&&late>lastNear&&lastNear>0,'single-sample grass must thin through the final three metres');}assert.equal(end,0);assert.equal(beyond,0);assert.deepEqual(errors,[]);
}catch(error){await writeFile(`${out}/failure.json`,JSON.stringify({error:String(error),errors},null,2),{flag:'wx'});throw error;}finally{await browser.close();}
