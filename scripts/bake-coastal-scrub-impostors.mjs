// Bake albedo-only distant proxies from the actual rooted models. The game
// applies its own sunset/shadowing; no lighting or backdrop is baked here.
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const root='public/assets/models/coastal_scrub',label=process.env.SCRUB_BAKE_LABEL??String(Date.now());assert.match(label,/^[a-z0-9-]+$/);
const out='artifacts/scrub-impostor-bake-'+label;await mkdir(out);
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']}),page=await browser.newPage(),errors=[],atlas=new PNG({width:512,height:512}),views=[],inputs=[];
for(const path of ['scrub.gltf','scrub.bin','scrub-color.png'])inputs.push({path,sha256:createHash('sha256').update(await readFile(root+'/'+path)).digest('hex')});
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:5188')+'/scripts/bake-coastal-scrub.html');await page.waitForFunction(()=>window.bakeReady);
 for(let variant=0;variant<2;variant++)for(let view=0;view<5;view++){
  const result=await page.evaluate(([variant,view])=>window.scrubBake.render(variant,view),[variant,view]),bytes=Buffer.from(result.png.split(',')[1],'base64'),tile=PNG.sync.read(bytes);delete result.png;
  const index=variant*5+view,x=index%4*128,y=Math.floor(index/4)*128;let covered=0;
  for(let i=0;i<tile.data.length;i+=4)if(tile.data[i+3]>=128)covered++;assert.ok(covered>100,'proxy must contain actual foliage pixels');
  await writeFile(`${out}/${variant}-${view}.png`,bytes);
  // Fill only RGB beneath zero alpha, within this tile. Ordinary mip filtering
  // then retains leaf color instead of blending black into distant edges.
  const valid=new Uint8Array(128*128),queue=[];
  for(let i=0;i<valid.length;i++)if(tile.data[i*4+3]){valid[i]=1;queue.push(i);}
  for(let at=0;at<queue.length;at++){
   const i=queue[at],px=i%128,py=Math.floor(i/128);
   for(const[nx,ny]of[[px-1,py],[px+1,py],[px,py-1],[px,py+1]]){
    if(nx<0||nx>=128||ny<0||ny>=128)continue;const j=ny*128+nx;if(valid[j])continue;valid[j]=1;queue.push(j);for(let c=0;c<3;c++)tile.data[j*4+c]=tile.data[i*4+c];
   }
  }
  PNG.bitblt(tile,atlas,0,0,128,128,x,y);views.push({variant,view,tile:index,covered,...result});
 }
 assert.deepEqual(errors,[]);const bytes=PNG.sync.write(atlas);await writeFile(root+'/scrub-impostors.png',bytes);
 const result={kind:'Unlit photographed albedo from real model, four sides plus top per plant; RGB-only transparent dilation',inputs,size:[512,512],tileSize:128,views,output:{path:'scrub-impostors.png',bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')},errors};
 await writeFile(root+'/impostor-source.json',JSON.stringify(result,null,2)+'\n');await writeFile(out+'/result.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({out,output:result.output,views:views.map(v=>({variant:v.variant,view:v.view,covered:v.covered}))}));
}finally{await browser.close();}
