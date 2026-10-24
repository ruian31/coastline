import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const label=process.env.SCRUB_LABEL??String(Date.now());assert.match(label,/^[a-z0-9-]+$/);const out=`artifacts/coastal-rooibos-asset-${label}`;await mkdir(out);
const browser=process.env.SCRUB_BROWSER==='webkit'?await webkit.launch({executablePath:process.env.WEBKIT_EXECUTABLE_PATH}):await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']}),page=await browser.newPage({viewport:{width:1000,height:700}}),errors=[],views=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:5188')+'/scripts/preview-coastal-rooibos.html');await page.waitForFunction(()=>window.rooibosReady);
 const upload=await page.evaluate(()=>window.rooibosTextureProbe());assert.deepEqual(upload.preceding,{flipY:true,premultiplyAlpha:true});assert.deepEqual(upload.state,{flipY:false,premultiplyAlpha:false});assert.ok(upload.sourceIsCanvas&&upload.allMipsAreCanvas);assert.equal(upload.error,0);assert.ok(upload.levels.every(l=>l.maxAlphaError===0&&l.maxRgbError<=2),JSON.stringify(upload));
 assert.ok(upload.linearReference.tested>1000&&upload.linearReference.maxRgbError<=2,JSON.stringify(upload.linearReference));
 for(const variant of [0,1])for(const lod of ['near','far'])for(const angle of ['front','side','above']){
  const report=await page.evaluate(({variant,lod,angle})=>window.rooibosPreview.select(variant,lod,angle),{variant,lod,angle});await page.screenshot({path:`${out}/${variant}-${lod}-${angle}.png`,scale:'css'});views.push({variant,lod,angle,...report});
  assert.equal(report.triangles,[2344,1541,1058,736][variant*2+(lod==='far'?1:0)]);assert.deepEqual([report.map.width,report.map.height],[1024,1024]);assert.equal(report.map.generateMipmaps,false);assert.deepEqual(report.map.mips,Array.from({length:11},(_,i)=>[1024/2**i,1024/2**i]));assert.ok(report.key.endsWith('-plant-centered-alpha-v1'));
 }
 assert.equal(new Set(views.map(v=>v.map.uuid)).size,1);assert.deepEqual(errors,[]);
 const source=JSON.parse(await readFile('public/assets/models/coastal_rooibos/source.json','utf8'));
 await writeFile(`${out}/result.json`,JSON.stringify({kind:'Isolated rooted geometry with preserved fine-leaf mip coverage; not gameplay or real-phone evidence',source,upload,views,errors},null,2),{flag:'wx'});console.log(JSON.stringify({out,upload,views:views.length,errors}));
}catch(error){await writeFile(`${out}/failure.json`,JSON.stringify({views,errors,failure:String(error)},null,2),{flag:'wx'});throw error;}finally{await browser.close();}
