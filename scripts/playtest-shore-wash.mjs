import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium,devices} from 'playwright';

const label=process.env.SHORE_LABEL??new Date().toISOString().replace(/[^0-9]/g,'');
assert.match(label,/^[a-z0-9-]+$/);
const mobile=process.env.SHORE_DEVICE==='mobile',dir=`artifacts/shore-wash-${label}`;
await mkdir(dir); // Evidence is immutable: use a new label for every attempt.
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']});
const context=await browser.newContext({...mobile?{...devices['Pixel 7'],viewport:{width:844,height:390}}:{viewport:{width:1280,height:720}},recordVideo:{dir,size:mobile?{width:844,height:390}:{width:1280,height:720}}});
const page=await context.newPage(),errors=[];
for(const file of['three.module.js','three.core.js'])await page.route(`**/__qa/${file}`,route=>route.fulfill({path:path.resolve('node_modules/three/build',file),contentType:'text/javascript'}));
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(()=>{window.__shoreObserved=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',e=>window.__shoreObserved.push(e.detail));});
try{
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:5188')+'/?test=1');
 await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setState('shore-wash'));
 await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setPausedForScreenshot(true));
 // This pass uses the actual water vertex/fragment programs. Only final color
 // is replaced with white, in an offscreen target, to locate water/land contact.
 const samples=[];
 for(let i=0;i<=32;i++){
  await page.evaluate(t=>window.__THREE_GAME_TEST_HOOKS__.setSceneTime(t),30+i*.5);
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const sample=await page.evaluate(async()=>{
   const scene=window.__shoreObserved.find(o=>o.isScene&&o.getObjectByName('Coastal landscape'));
   const renderer=window.__shoreObserved.find(o=>o.isWebGLRenderer),water=scene.children.find(o=>o.name.startsWith('Sea /')),waves=scene.getObjectByName('Nearshore / physical advancing and receding water'),surfaces=[water,waves];
   const T=await import('/__qa/three.module.js'),previous=water.onBeforeRender;
   const camera=await new Promise(resolve=>{water.onBeforeRender=(...args)=>{previous(...args);resolve(args[2]);};});water.onBeforeRender=previous;window.__shoreCamera=camera;
   const width=innerWidth,height=innerHeight,target=new T.WebGLRenderTarget(width,height,{depthBuffer:true}),black=new T.MeshBasicMaterial({color:0});
   const materials=surfaces.map(surface=>{const mask=surface.material.clone();mask.uniforms=surface.material.uniforms;mask.fragmentShader=mask.fragmentShader.replace('gl_FragColor=vec4(color,alpha);','gl_FragColor=vec4(1.0);');return mask;});
   const old={target:renderer.getRenderTarget(),clear:renderer.autoClear,background:scene.background,override:scene.overrideMaterial,layers:camera.layers.mask,surfaces:surfaces.map(s=>({layers:s.layers.mask,material:s.material,visible:s.visible})),shadows:renderer.shadowMap.enabled};
   const pixels=new Uint8Array(width*height*4);
   try{
    renderer.shadowMap.enabled=false;renderer.setRenderTarget(target);scene.background=null;scene.overrideMaterial=black;surfaces.forEach(s=>s.visible=false);renderer.autoClear=true;renderer.render(scene,camera);
    scene.overrideMaterial=null;camera.layers.set(31);surfaces.forEach((s,i)=>{s.layers.set(31);s.visible=true;s.material=materials[i];});renderer.autoClear=false;renderer.render(scene,camera);renderer.readRenderTargetPixels(target,0,0,width,height,pixels);
   }finally{
    renderer.setRenderTarget(old.target);renderer.autoClear=old.clear;renderer.shadowMap.enabled=old.shadows;scene.background=old.background;scene.overrideMaterial=old.override;camera.layers.mask=old.layers;surfaces.forEach((s,i)=>{s.layers.mask=old.surfaces[i].layers;s.material=old.surfaces[i].material;s.visible=old.surfaces[i].visible;});target.dispose();materials.forEach(m=>m.dispose());black.dispose();
   }
   const terrain=scene.getObjectByName('Limestone headland and grassy interior'),ray=new T.Raycaster();
   const contacts=[.23,.29,.75,.9].map(f=>{const x=Math.round(width*f);let row=-1;for(let y=0;y<height;y++)if(pixels[((height-1-y)*width+x)*4]>100)row=y;
    // The first land pixel has a guaranteed near-shore terrain intersection;
    // the last water pixel can look past a shore lip onto the distant seabed.
    ray.setFromCamera(new T.Vector2((x+.5)/width*2-1,1-(row+1.5)/height*2),camera);const hit=ray.intersectObject(terrain)[0];return{x,row,world:hit?.point.toArray()??null};});
   return{time:water.material.uniforms.uShoreTime.value,contacts,player:window.__THREE_GAME_DIAGNOSTICS__.player.position};
  });
  samples.push(sample);
  if(i%4===0)await page.screenshot({path:`${dir}/phase-${i}.png`});
 }
 const excursions=samples[0].contacts.map((contact,i)=>{const contacts=samples.map(s=>s.contacts[i]);assert.ok(contacts.every(c=>c.world&&c.row>=0));const rows=contacts.map(c=>c.row),origin=contacts[0].world;const along=contacts.map(c=>Math.hypot(c.world[0]-origin[0],c.world[2]-origin[2]));return{x:contact.x,pixelRange:Math.max(...rows)-Math.min(...rows),worldSpan:Math.max(...along)};});
 await writeFile(`${dir}/depth-samples.json`,JSON.stringify({mobile,samples,excursions,errors},null,2));
 console.log(JSON.stringify({excursions}));
 assert.ok(excursions.filter(c=>c.pixelRange>=2&&c.worldSpan>.7).length>=3,'actual water depth must advance/recede across the rendered shore');
 for(let c=0;c<4;c++)assert.ok(Math.abs(samples[0].contacts[c].row-samples[16].contacts[c].row)<=2&&Math.abs(samples[16].contacts[c].row-samples[32].contacts[c].row)<=2,'shoreline returns after each full wave period');
 const probes=samples[0].contacts.flatMap((contact,c)=>{const row=Math.max(...samples.map(s=>s.contacts[c].row));return[-2,0,2,8].map(offset=>({x:contact.x,row:row+offset,control:offset===8}));}),wetSamples=[];
 for(let i=0;i<=16;i++){
  await page.evaluate(t=>window.__THREE_GAME_TEST_HOOKS__.setSceneTime(t),30+i*.5);
  const colors=await page.evaluate(async probes=>{
   const T=await import('/__qa/three.module.js'),scene=window.__shoreObserved.find(o=>o.isScene&&o.getObjectByName('Coastal landscape')),renderer=window.__shoreObserved.find(o=>o.isWebGLRenderer),camera=window.__shoreCamera;
   const water=scene.children.filter(o=>o.name.startsWith('Sea /')||o.name.startsWith('Nearshore /')),target=new T.WebGLRenderTarget(innerWidth,innerHeight),oldTarget=renderer.getRenderTarget();
   try{water.forEach(o=>o.visible=false);renderer.setRenderTarget(target);renderer.render(scene,camera);return probes.map(({x,row})=>{const color=new Uint8Array(4);renderer.readRenderTargetPixels(target,x,innerHeight-1-row,1,1,color);return Array.from(color).slice(0,3);});}
   finally{water.forEach(o=>o.visible=true);renderer.setRenderTarget(oldTarget);target.dispose();}
  },probes);
  wetSamples.push({time:30+i*.5,colors});
 }
 const wetVariation=probes.map((probe,i)=>{const values=wetSamples.map(s=>s.colors[i].reduce((a,b)=>a+b)/3),low=Math.min(...values),high=Math.max(...values);return{...probe,low,high,fraction:(high-low)/Math.max(high,1)};});
 await writeFile(`${dir}/wet-samples.json`,JSON.stringify({probes,wetSamples,wetVariation},null,2));
 assert.ok(wetVariation.filter(p=>!p.control&&p.fraction>.08&&p.high-p.low>5).length>=2,'actual ground shader must leave a visible wet/dry transition');
 assert.ok(wetVariation.filter(p=>p.control&&p.fraction<.01).length>=2,'unwashed upper shore must keep its dry material');
 await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setSceneTime(46));
 await page.screenshot({path:`${dir}/shore.png`});
 const startTime=await page.evaluate(()=>{window.__THREE_GAME_TEST_HOOKS__.setPausedForScreenshot(false);return window.__THREE_GAME_DIAGNOSTICS__.elapsed;});await page.waitForTimeout(18000);
 const end=await page.evaluate(()=>window.__THREE_GAME_DIAGNOSTICS__);assert.ok(end.elapsed-startTime>12,'unpaused recording must cover full wave cycles');
 assert.deepEqual(errors,[]);
 await writeFile(`${dir}/samples.json`,JSON.stringify({mobile,samples,excursions,wetVariation,motionSeconds:end.elapsed-startTime,renderer:end.renderer,errors},null,2));
 console.log(JSON.stringify({dir,mobile,excursions,wetPixels:wetVariation.filter(p=>!p.control&&p.fraction>.08).length,motionSeconds:end.elapsed-startTime,renderer:end.renderer,errors}));
}finally{await context.close();await browser.close();}
