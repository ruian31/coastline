import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.WEATHER_EVIDENCE??'artifacts/weather-m78-optics';await mkdir(out);
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']}),page=await browser.newPage({viewport:{width:844,height:390}}),errors=[],rows=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(()=>{
 localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));window.weatherObjects=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',event=>{const r=event.detail;weatherObjects.push(r);if(r.isWebGLRenderer){const render=r.render;r.render=function(o,c){const result=render.call(this,o,c);if(o.isMesh&&o.material?.uniforms?.cloud)window.weatherQuad={mesh:o,target:r.getRenderTarget()};return result;};}});
});
try{
 await page.goto((process.env.WEATHER_BASE_URL??'http://127.0.0.1:4216')+'/?test=1');await page.evaluate(async()=>{const h=window.__THREE_GAME_TEST_HOOKS__;await h.setState('active-play');h.setPausedForScreenshot(true);});
 for(const light of['dawn','golden','night'])for(const weather of['cloudy','fog']){
  await page.evaluate(async({light,weather})=>{const h=window.__THREE_GAME_TEST_HOOKS__;await h.setDaylight(light);h.setWeather(weather,60);},{light,weather});
  const result=await page.evaluate(()=>{
   const renderer=weatherObjects.find(o=>o.isWebGLRenderer),scene=weatherObjects.find(o=>o.isScene&&o.userData.sunShadows),{mesh,target}=weatherQuad,u=mesh.material.uniforms,gl=renderer.getContext(),draw=gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING),read=gl.getParameter(gl.READ_FRAMEBUFFER_BINDING),binding=gl.getParameter(gl.TEXTURE_BINDING_2D),fbo=gl.createFramebuffer(),samples=[];
   try{
    gl.bindTexture(gl.TEXTURE_2D,renderer.properties.get(u.source.value).__webglTexture);const gpuWrap=gl.getTexParameter(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S);gl.bindTexture(gl.TEXTURE_2D,binding);
    gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,renderer.properties.get(target.texture).__webglTexture,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Weather HDR framebuffer incomplete');
    for(const longitude of[0,((u.yaw.value%1)+1)%1])for(const latitude of[.6,.8,.94]){
     const x=Math.floor(longitude*target.width),y=Math.floor(latitude*target.height),pixels=[];
     for(let offset=-5;offset<=5;offset++){const p=new Float32Array(4);gl.readPixels((x+offset+target.width)%target.width,y,1,1,gl.RGBA,gl.FLOAT,p);pixels.push(Array.from(p).slice(0,3));}
     let curvature=0;for(let i=1;i<pixels.length-1;i++)for(let channel=0;channel<3;channel++){const ref=(pixels[i-1][channel]+pixels[i+1][channel])*.5;curvature=Math.max(curvature,Math.abs(pixels[i][channel]-ref)/Math.max(.02,ref));}samples.push({x,y,pixels,curvature});
    }
    const water=scene.getObjectByName('Sea / advancing shore wash and moving sunset reflections').material.uniforms;
    return{width:target.width,height:target.height,sourceWrap:u.source.value.wrapS,gpuWrap,yaw:u.yaw.value,samples,waterFog:water.uWeatherFogDensity.value,sceneFog:scene.fog.density,waterFogColor:water.uWeatherFogColor.value.toArray(),sceneFogColor:scene.fog.color.toArray(),error:gl.getError()};
   }finally{gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,draw);gl.bindFramebuffer(gl.READ_FRAMEBUFFER,read);gl.bindTexture(gl.TEXTURE_2D,binding);gl.deleteFramebuffer(fbo);}
  });rows.push({light,weather,...result});
 }
 const maxCurvature=Math.max(...rows.flatMap(r=>r.samples.map(s=>s.curvature))),report={scope:'Actual fixed-source GPU wrap and half-float weather RT boundary pixels at rotated dawn/golden/night; live water fog uniform equality. No complete artistic, phone performance or rain acceptance claim.',rows,maxCurvature,limit:.12,errors};await writeFile(out+'/result.json',JSON.stringify(report,null,2)+'\n');assert.deepEqual(errors,[]);for(const r of rows){assert.equal(r.sourceWrap,1000);assert.equal(r.gpuWrap,10497);assert.equal(r.error,0);assert.equal(r.waterFog,r.sceneFog);assert.deepEqual(r.waterFogColor,r.sceneFogColor);}assert.ok(maxCurvature<=report.limit,'Weather sky narrow seam '+maxCurvature);console.log(JSON.stringify({pass:true,maxCurvature,samples:rows.length}));
}finally{await browser.close();}
