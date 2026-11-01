// Read the actual HDR sky render target across each source's repeat boundary.
// A smooth source can have a gradient here; a mip seam creates a narrow spike.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const label=process.env.SEAM_LABEL??'candidate';assert.match(label,/^[a-z0-9-]+$/);
const out='artifacts/daynight-seams-'+label;await mkdir(out);
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']}),context=await browser.newContext({viewport:{width:844,height:390}}),page=await context.newPage(),rows=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(()=>{
 localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));window.seamObjects=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',event=>{const r=event.detail;seamObjects.push(r);if(r.isWebGLRenderer){const render=r.render;r.render=function(o,c){const result=render.call(this,o,c);if(o.isMesh&&o.material?.uniforms?.mapA?.value?.name?.startsWith('Cycle '))window.seamQuad={mesh:o,target:r.getRenderTarget()};return result;};}});
});
try{
 await page.goto((process.env.SEAM_BASE_URL??'http://127.0.0.1:5190')+'/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setState('active-play'));await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setPausedForScreenshot(true));
 const module=await page.locator('script[type=module][src]').getAttribute('src');
 for(const hour of[6.74818399997922,9.962501333311296,18.35,20.3]){
  await page.evaluate(h=>window.__THREE_GAME_TEST_HOOKS__.setDaylightCycle(h,false),hour);
  const sample=await page.evaluate(()=>{
   const renderer=seamObjects.find(o=>o.isWebGLRenderer),{mesh,target}=seamQuad,u=mesh.material.uniforms,gl=renderer.getContext(),draw=gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING),read=gl.getParameter(gl.READ_FRAMEBUFFER_BINDING),fbo=gl.createFramebuffer(),samples=[];
   try{
    gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,renderer.properties.get(target.texture).__webglTexture,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Sky HDR framebuffer incomplete');
    const fraction=v=>((v%1)+1)%1;
    for(const suffix of['A','B'])for(const latitude of[.7,.85,.95]){
     const x=Math.floor(fraction(u['yaw'+suffix].value)*target.width),y=Math.floor(latitude*target.height),pixels=[];
     for(let offset=-5;offset<=5;offset++){const p=new Float32Array(4);gl.readPixels((x+offset+target.width)%target.width,y,1,1,gl.RGBA,gl.FLOAT,p);pixels.push(Array.from(p).slice(0,3));}
     let curvature=0;for(let i=1;i<pixels.length-1;i++)for(let c=0;c<3;c++){const reference=(pixels[i-1][c]+pixels[i+1][c])*.5;curvature=Math.max(curvature,Math.abs(pixels[i][c]-reference)/Math.max(.02,reference));}
     samples.push({source:u['map'+suffix].value.name,x,y,pixels,curvature});
    }
    return{width:target.width,height:target.height,samples,error:gl.getError()};
   }finally{gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,draw);gl.bindFramebuffer(gl.READ_FRAMEBUFFER,read);gl.deleteFramebuffer(fbo);}
  });rows.push({hour,...sample});
 }
 const maxCurvature=Math.max(...rows.flatMap(r=>r.samples.map(s=>s.curvature))),report={scope:'Actual production cycle HDR RT, adjacent pixel curvature at source repeat boundaries away from the sun. Four authored hours, not a phone/performance or complete visual-quality test.',module,rows,maxCurvature,limit:.12,errors};await writeFile(out+'/result.json',JSON.stringify(report,null,2)+'\n');
 assert.deepEqual(errors,[]);assert.ok(rows.every(r=>r.error===0));assert.ok(maxCurvature<=.12,'Narrow sky mip seam: '+maxCurvature);console.log(JSON.stringify({module,maxCurvature,limit:.12}));
}finally{await context.close();await browser.close();}
