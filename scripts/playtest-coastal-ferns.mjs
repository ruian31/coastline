import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const label=process.env.FERN_LABEL??String(Date.now());assert.match(label,/^[a-z0-9-]+$/);const out=`artifacts/coastal-fern-asset-${label}`;await mkdir(out);
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']}),page=await browser.newPage({viewport:{width:1000,height:700}}),errors=[],views=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:5188')+'/scripts/preview-coastal-ferns.html');await page.waitForFunction(()=>window.fernReady);
 for(const variant of [0,1])for(const lod of ['near','far'])for(const angle of ['front','side','above']){
  const report=await page.evaluate(({variant,lod,angle})=>window.fernPreview.select(variant,lod,angle),{variant,lod,angle});await page.screenshot({path:`${out}/${variant}-${lod}-${angle}.png`,scale:'css'});views.push({variant,lod,angle,...report});
  assert.ok(report.triangles<=816);assert.ok(report.maps.every(t=>t.width===1024&&t.height===1024));
 }
 const source=JSON.parse(await readFile('public/assets/models/coastal_ferns/source.json','utf8'));assert.ok(source.variants.every(v=>v.fronds===7));assert.deepEqual(errors,[]);await writeFile(`${out}/result.json`,JSON.stringify({kind:'Isolated actual derived geometry with already shipped Fern 02 PBR maps; not gameplay evidence',source,views,errors},null,2),{flag:'wx'});console.log(JSON.stringify({out,views:views.length,errors}));
}catch(error){await writeFile(`${out}/failure.json`,JSON.stringify({views,errors,failure:String(error)},null,2),{flag:'wx'});throw error;}finally{await browser.close();}
