// Verify actual half-float GPU radiance, independently of the timeline model.
import assert from 'node:assert/strict';
import {chromium,devices} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']}),rows=[];
try{
 for(const mobile of[false,true]){
  const context=await browser.newContext({...mobile?devices['Pixel 7']:{},viewport:{width:844,height:390}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>{
   localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));window.blendGains=[];window.blendPixels=null;window.envMixDraws=0;window.__THREE_DEVTOOLS__=new EventTarget();
   window.__THREE_DEVTOOLS__.addEventListener('observe',event=>{
    const renderer=event.detail;if(!renderer.isWebGLRenderer)return;const render=renderer.render;
    renderer.render=function(object,camera){
     const result=render.call(this,object,camera),u=object.material?.uniforms;if(object.isScene&&object.getObjectByName('Coastal landscape')&&renderer.getRenderTarget()===null)window.blendScene=object;if(!object.isMesh||!u)return result;
     if(u.a?.value?.name?.endsWith(' PMREM'))window.envMixDraws++;
     const gl=renderer.getContext(),target=renderer.getRenderTarget();
     if(u.mapA?.value?.name?.startsWith('Cycle ')){
      const program=renderer.properties.get(object.material).currentProgram.program;
      window.blendGains.push({source:u.mapA.value.name,gainA:gl.getUniform(program,gl.getUniformLocation(program,'gainA')),gainB:gl.getUniform(program,gl.getUniformLocation(program,'gainB')),phase:gl.getUniform(program,gl.getUniformLocation(program,'phase'))});
     }
     if(!window.blendPixels&&u.a?.value?.name?.endsWith(' PMREM')&&Math.abs(u.blend?.value-.5)<1e-7){
      const draw=gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING),read=gl.getParameter(gl.READ_FRAMEBUFFER_BINDING),fbo=gl.createFramebuffer(),samples=[];
      try{
       gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
       const pixel=(texture,x,y)=>{const data=new Float32Array(4);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,renderer.properties.get(texture).__webglTexture,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Incomplete half-float blend readback');gl.readPixels(x,y,1,1,gl.RGBA,gl.FLOAT,data);return Array.from(data);};
       for(const [fx,fy]of[[.1,.125],[.5,.25],[.8,.5],[.25,.75],[.5,.91]]){const x=Math.floor(target.width*fx),y=Math.floor(target.height*fy),a=pixel(u.a.value,x,y),b=pixel(u.b.value,x,y),actual=pixel(target.texture,x,y);samples.push({x,y,a,b,actual,expected:a.map((v,i)=>(v+b[i])/2)});}
       window.blendPixels={a:u.a.value.name,b:u.b.value.name,blend:u.blend.value,size:[target.width,target.height],samples,glError:gl.getError()};
      }finally{gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,draw);gl.bindFramebuffer(gl.READ_FRAMEBUFFER,read);gl.deleteFramebuffer(fbo);}
     }
     return result;
    };
   });
  });
  await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:4209')+'/?test=1');await page.evaluate(async()=>{const h=window.__THREE_GAME_TEST_HOOKS__;await h.setState('cockpit');h.setPausedForScreenshot(true);if(!await h.setDaylightCycle(18.35,false))throw Error('Cycle unavailable');});await page.waitForFunction(()=>window.__THREE_GAME_DIAGNOSTICS__?.daylight?.cycle?.hour===18.35);
  const result=await page.evaluate(()=>({gains:window.blendGains,pixels:window.blendPixels,diagnostics:structuredClone(window.__THREE_GAME_DIAGNOSTICS__)}));assert.ok(result.pixels);assert.equal(result.pixels.glError,0);assert.equal(result.pixels.a,'Cycle day PMREM');assert.equal(result.pixels.b,'Cycle golden PMREM');
  for(const name of['day','golden'])assert.ok(result.gains.some(g=>g.source===`Cycle ${name} HDR`&&g.phase===0&&Math.abs(g.gainA-.7)<1e-6));
  let nonzero=0,maxRelativeError=0;for(const p of result.pixels.samples)for(let c=0;c<3;c++){const expected=p.expected[c],error=Math.abs(p.actual[c]-expected);if(expected>1e-4)nonzero++;maxRelativeError=Math.max(maxRelativeError,error/Math.max(1e-4,expected));assert.ok(error<=Math.max(1e-5,expected*.002),JSON.stringify(p));}assert.ok(nonzero>=6);
  const direct=await page.evaluate(async()=>{window.envMixDraws=0;if(!await window.__THREE_GAME_TEST_HOOKS__.setDaylightCycle(13,false))throw Error('Day cycle unavailable');return{environment:window.blendScene.environment.name,extraMixDraws:window.envMixDraws};});assert.deepEqual(direct,{environment:'Cycle day PMREM',extraMixDraws:0});assert.deepEqual(errors,[]);rows.push({mode:mobile?'mobile':'desktop',...result,direct,maxRelativeError,errors});await context.close();
 }
 await mkdir('artifacts/daynight-m76',{recursive:true});await writeFile('artifacts/daynight-m76/gpu-radiance-blend.json',JSON.stringify({method:'Actual GPU uniform readback for source environment gains and FBO Float32 readback of both RGBA16F PMREM inputs plus their blended output at five same pixel centers. Eighteen-thirty-five is the exact half-weight between18.0/day and18.7/golden. Bounds allow half-float output rounding. Not performance or phone FPS.',rows},null,2)+'\n');console.log(rows.map(r=>({mode:r.mode,maxRelativeError:r.maxRelativeError})));
}finally{await browser.close();}
