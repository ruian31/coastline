import assert from 'node:assert/strict';
import {chromium,devices} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const out=process.env.SEASON_DEFAULT_EVIDENCE??'artifacts/seasons-m80-default-source';await mkdir(out);
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']}),rows=[],baselines=new Map();
try{
 for(const [name,url]of [['control',process.env.SEASON_CONTROL_URL??'http://127.0.0.1:4217'],['candidate',process.env.SEASON_BASE_URL??'http://127.0.0.1:4218']])for(const mode of ['desktop','mobile']){
  const context=await browser.newContext({...mode==='mobile'?devices['Pixel 7']:{},viewport:mode==='mobile'?{width:844,height:390}:{width:1280,height:720}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  for(const file of ['three.module.js','three.core.js'])await page.route('**/__qa/'+file,route=>route.fulfill({path:path.resolve('node_modules/three/build',file),contentType:'text/javascript'}));
  await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));window.seasonObjects=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',e=>{const r=e.detail;seasonObjects.push(r);if(r.isWebGLRenderer){const render=r.render;r.render=function(o,c){if(o.isScene&&o.userData.sunShadows&&!r.getRenderTarget())window.seasonCamera=c;return render.call(this,o,c);};}});});
  await page.goto(url+'/?test=1');
  for(const view of ['active-play','bank-inland']){
   await page.evaluate(async view=>{const h=window.__THREE_GAME_TEST_HOOKS__;await h.setState(view);h.setPausedForScreenshot(true);h.setReducedMotion(true);await h.setDaylightCycle(13,false);},view);
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const result=await page.evaluate(async()=>{
    const T=await import('/__qa/three.module.js'),scene=seasonObjects.find(o=>o.isScene&&o.userData.sunShadows),r=seasonObjects.find(o=>o.isWebGLRenderer),camera=seasonCamera,w=r.domElement.width,h=r.domElement.height,old=r.getRenderTarget(),target=new T.WebGLRenderTarget(w,h,{samples:4,type:T.UnsignedByteType,depthBuffer:true});target.texture.colorSpace=T.SRGBColorSpace;
    try{r.setRenderTarget(target);const pictures=[];for(let i=0;i<4;i++){r.render(scene,camera);const bytes=new Uint8Array(w*h*4);r.readRenderTargetPixels(target,0,0,w,h,bytes);const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(bytes),w,h),0,0);if(i>=2)pictures.push(canvas.toDataURL('image/png'));}
     return{pictures,width:w,height:h,glError:r.getContext().getError(),camera:{world:camera.matrixWorld.toArray(),projection:camera.projectionMatrix.toArray()},diagnostics:structuredClone(window.__THREE_GAME_DIAGNOSTICS__)};
    }finally{r.setRenderTarget(old);target.dispose();}
   });
   const buffers=result.pictures.map(s=>Buffer.from(s.split(',')[1],'base64')),a=await sharp(buffers[0]).raw().toBuffer(),b=await sharp(buffers[1]).raw().toBuffer();assert.deepEqual(a,b,'Repeated owned-target renders changed');assert.equal(result.glError,0);assert.ok(a.some((v,i)=>i%4!==3&&v>0));
   const key=mode+'-'+view;if(name==='control')baselines.set(key,{pixels:a,camera:result.camera,player:result.diagnostics.player.position});let difference;
   if(name==='candidate'){const base=baselines.get(key);assert.deepEqual(result.camera,base.camera);assert.deepEqual(result.diagnostics.player.position,base.player);let changed=0,max=0,sum=0;for(let i=0;i<a.length;i++){const d=Math.abs(a[i]-base.pixels[i]);if(d)changed++;max=Math.max(max,d);sum+=d;}difference={changed,max,mean:sum/a.length};assert.equal(result.diagnostics.season.target,'summer');assert.equal(result.diagnostics.season.amount,0);}
   await writeFile(out+'/'+name+'-'+key+'.png',buffers[0]);const{pictures,...data}=result;rows.push({name,mode,view,module:await page.locator('script[type=module][src]').getAttribute('src'),...data,difference,errors:[...errors]});assert.deepEqual(errors,[]);
  }await context.close();
 }
 const report={scope:'M79 source control versus M80 default summer source,2 modes x2 actual views at13h and frozen identical camera/player. Original production geometry/materials; no work clones. Owned MSAA4 sRGB8 target read by Three API, no default-canvas toDataURL reads. Repeated owned renders asserted byte-identical; cross-build differences reported before acceptance. GPU images retain raw bottom-up row order. Not artistic, active physics or physical-phone performance acceptance.',rows};await writeFile(out+'/result.json',JSON.stringify(report,null,2)+'\n');
 for(const row of rows.filter(r=>r.name==='candidate'))assert.ok(row.difference.max<=1&&row.difference.mean<.01,'Default seasonal shader changes image: '+row.mode+'/'+row.view);
 console.log(JSON.stringify({pass:true,rows:rows.filter(r=>r.name==='candidate').map(r=>({mode:r.mode,view:r.view,difference:r.difference}))}));
}catch(error){await writeFile(out+'/failure.json',JSON.stringify({message:String(error),rows},null,2)+'\n');throw error;}
finally{await browser.close();}
