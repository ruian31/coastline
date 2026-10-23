// Actual authored tree geometry/materials, shown from several angles without
// world occlusion. These model previews supplement, never replace gameplay QA.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,devices} from 'playwright';
import {PNG} from 'pngjs';

const label=process.env.PINE_LABEL??String(Date.now()),mobile=process.env.PINE_DEVICE==='mobile';assert.match(label,/^[a-z0-9-]+$/);
const dir=`artifacts/pine-canopy-${label}`;await mkdir(dir);
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']});
const context=await browser.newContext({...mobile?devices['Pixel 7']:{},viewport:mobile?{width:844,height:390}:{width:1024,height:768}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(()=>{
 localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));window.pineObjects=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',e=>window.pineObjects.push(e.detail));
});
try{
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:5188')+'/?test=1');
 for(const state of['active-play','tree-shadow','town','tunnel-exit']){
  await page.evaluate(async state=>{const h=window.__THREE_GAME_TEST_HOOKS__;await h.setState(state);h.setPausedForScreenshot(true);h.setReducedMotion(true);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));},state);
  await page.screenshot({path:`${dir}/world-${state}.png`,scale:'css'});
 }
 await page.addStyleTag({content:'#app :not(#game-canvas){visibility:hidden!important}'});
 const setup=await page.evaluate(()=>{
  const scene=window.pineObjects.find(o=>o.isScene&&o.userData.sunShadows),renderer=window.pineObjects.find(o=>o.isWebGLRenderer);
  const group=scene.getObjectByName('Sheltered stone pine boughs'),trunks=scene.getObjectByName('Stone pine trunks'),near=group.children.find(o=>o.name==='Visible detailed trees'),far=group.children.find(o=>o.name==='Visible distant trees'),trunk=trunks.children.find(o=>o.isInstancedMesh);
  const sun=scene.getObjectByName('Cached golden-hour world sun');sun.shadow.intensity=0;scene.children.forEach(o=>o.visible=Boolean(o.isLight));scene.background=new near.material.color.constructor(0x899295);
  const size=near.userData.authoredInstances[0].elements[5]/1.8,previews=[];
  for(const source of[near,trunk]){
   const mesh=new source.constructor(source.geometry,source.material,1),matrix=source.userData.authoredInstances[0].clone();matrix.setPosition(0,source===near?4.7*size:0,0);mesh.setMatrixAt(0,matrix);mesh.instanceMatrix.needsUpdate=true;mesh.frustumCulled=false;scene.add(mesh);previews.push(mesh);
  }
  window.pinePreview={scene,renderer,near,far,trunk,previews,size,eye:[13,7,15]};
  // The renderer calls this before building its projection/frustum. Keep the
  // game's render loop running so screenshots retain normal browser timing.
  scene.onBeforeRender=(_r,_s,camera)=>{const{eye,size}=window.pinePreview;camera.position.set(...eye.map(v=>v*size));camera.lookAt(0,4.4*size,0);camera.updateMatrixWorld();};
  const mipCoverage=(near.material.map?.mipmaps??[]).filter(image=>image.width>=2).map((image,level)=>{
   const pixels=image.getContext('2d').getImageData(0,0,image.width,image.height).data,tileSize=image.width/2,tiles=[];
   for(let tile=0;tile<3;tile++){let covered=0,max=0;for(let y=0;y<tileSize;y++)for(let x=0;x<tileSize;x++){const a=pixels[((Math.floor(tile/2)*tileSize+y)*image.width+tile%2*tileSize+x)*4+3];if(a>=128)covered++;max=Math.max(max,a);}tiles.push({coverage:covered/(tileSize*tileSize),maxAlpha:max/255});}
   return{level,width:image.width,tiles};
  });
  return{size,near:near.geometry.getAttribute('position').count/3,far:far.geometry.getAttribute('position').count/3,mipCoverage,atlas:near.material.map?.image?.toDataURL?.()??null};
 });
 if(setup.atlas)await writeFile(`${dir}/needle-atlas.png`,Buffer.from(setup.atlas.split(',')[1],'base64'));
 const hasAtlas=Boolean(setup.atlas);delete setup.atlas;
 const views=[['front',[13,7,15]],['side',[-16,7,2]],['back',[-9,8,-16]],['above',[10,17,9]]];
 for(const lod of['near','far'])for(const[name,eye]of views){
  await page.evaluate(async({lod,eye})=>{
   const{previews}=window.pinePreview,source=window.pinePreview[lod];window.pinePreview.eye=eye;previews[0].geometry=source.geometry;previews[0].material=source.material;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  },{lod,eye});
  await page.screenshot({path:`${dir}/${lod}-${name}.png`,scale:'css'});
 }
 for(const distance of[130,300,700]){
  await page.evaluate(async distance=>{const p=window.pinePreview;p.eye=[0,4.4,distance];p.previews[0].geometry=p.far.geometry;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));},distance);
  await page.screenshot({path:`${dir}/far-distance-${distance}.png`,scale:'css'});
 }
 const masks=[];
 for(const distance of[20,130,300,700])for(const solid of[false,true]){
  await page.evaluate(async({solid,distance})=>{
   const{scene,near,far,previews}=window.pinePreview;window.pinePreview.eye=distance===20?[13,7,15]:[0,4.4,distance];
   scene.background.set(0);previews[1].visible=false;previews[0].geometry=distance===20?near.geometry:far.geometry;
   const material=near.material.clone();material.onBeforeCompile=(shader,r)=>{near.material.onBeforeCompile(shader,r);shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>',`#include <dithering_fragment>
    #ifdef USE_MAP
      if(vMapUv.x>.5&&vMapUv.y<.5)discard;
    #endif
    gl_FragColor.rgb=vec3(1.0);`);};material.customProgramCacheKey=()=>near.material.customProgramCacheKey()+'-pine-qa-white';if(solid){material.alphaTest=0;material.alphaToCoverage=false;}
   window.pineMaskMaterial?.dispose();window.pineMaskMaterial=material;previews[0].material=material;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  },{solid,distance});
  const data=PNG.sync.read(await page.screenshot({path:`${dir}/mask-${distance}-${solid?'solid':'cutout'}.png`,scale:'css'})).data;let covered=0,weighted=0;for(let i=0;i<data.length;i+=4){weighted+=data[i]/255;if(data[i]>200&&data[i+1]>200&&data[i+2]>200)covered++;}masks.push({distance,solid,covered,weighted});
 }
 assert.deepEqual(errors,[]);const openFraction=1-masks[0].covered/masks[1].covered;
 if(hasAtlas){
  assert.ok(openFraction>.12&&openFraction<.7,'needle gaps must remain visible without losing most of the crown');assert.ok(masks[0].covered>800,'the cutout canopy must actually render');assert.ok(setup.near<=700&&setup.far<=240);
  assert.equal(setup.mipCoverage.length,9);for(const mip of setup.mipCoverage)for(const tile of mip.tiles)assert.ok(tile.maxAlpha>=.5,'each distant spray must survive the shadow cutoff');
  for(const sample of masks.filter(m=>!m.solid&&m.distance>=130))assert.ok(sample.weighted>1,'far canopy must still contribute real GPU pixels at '+sample.distance+'m');
 }
 const result={mobile,...setup,masks,openFraction,errors};await writeFile(`${dir}/result.json`,JSON.stringify(result,null,2));console.log(JSON.stringify({dir,...result}));
}finally{await context.close();await browser.close();}
