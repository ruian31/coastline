// One sequential GPU job, fixed unlit views of the real scanned components.
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {mkdir,readFile,writeFile,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const root='public/assets/models/coastal_tree',out='artifacts/coastal-tree-bake-'+(process.env.TREE_LABEL??Date.now());await mkdir(out);
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']}),page=await browser.newPage(),errors=[],atlas=new PNG({width:2048,height:2048}),views=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:5188')+'/scripts/bake-coastal-tree.html');await page.waitForFunction(()=>window.bakeReady);
 const metadata=JSON.parse(await readFile(root+'/source.json','utf8')),clusterCount=metadata.clusters.length;
 const decode=c=>{c/=255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;},encode=c=>Math.round(255*(c<=.0031308?c*12.92:1.055*c**(1/2.4)-.055));
 for(let cluster=0;cluster<clusterCount;cluster++)for(let view=0;view<3;view++){
  const png=await page.evaluate(([c,v])=>window.treeBake.render(c,v),[cluster,view]),source=PNG.sync.read(Buffer.from(png.split(',')[1],'base64')),tile=new PNG({width:60,height:60});let alphaIntegral=0;
  // Four-times supersampling, linear-light alpha-weighted colors. Match the
  // base cutoff area to the source's fractional pixel area, as well as mips.
  for(let y=0;y<60;y++)for(let x=0;x<60;x++){const sum=[0,0,0];let alpha=0;for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++){const i=((y*4+dy)*240+x*4+dx)*4,a=source.data[i+3]/255;alpha+=a;for(let c=0;c<3;c++)sum[c]+=decode(source.data[i+c])*a;}const i=(y*60+x)*4;for(let c=0;c<3;c++)tile.data[i+c]=alpha?encode(sum[c]/alpha):0;tile.data[i+3]=Math.round(alpha/16*255);alphaIntegral+=alpha/16;}
  const histogram=new Uint32Array(256);for(let i=3;i<tile.data.length;i+=4)histogram[tile.data[i]]++;
  const target=Math.round(alphaIntegral);let cumulative=0,level=255;while(level>1&&cumulative+histogram[level]<target){cumulative+=histogram[level];level--;}const alphaScale=target?Math.max(1,116/level):1;let covered=0;
  for(let i=3;i<tile.data.length;i+=4){tile.data[i]=Math.min(255,Math.round(tile.data[i]*alphaScale));if(tile.data[i]>=115)covered++;}
  const index=cluster*3+view,x=index%32*64,y=Math.floor(index/32)*64;
  PNG.bitblt(tile,atlas,0,0,60,60,x+2,y+2);views.push({cluster,view,covered,alphaIntegral,alphaScale});
  // RGB-only dilation over each tile, including its two-pixel gutter.
  const valid=new Uint8Array(4096),queue=[];for(let j=0;j<4096;j++){const i=((y+Math.floor(j/64))*2048+x+j%64)*4;if(atlas.data[i+3]){valid[j]=1;queue.push(j);}}
  for(let at=0;at<queue.length;at++){const j=queue[at],px=j%64,py=Math.floor(j/64),i=((y+py)*2048+x+px)*4;for(const[nx,ny]of[[px-1,py],[px+1,py],[px,py-1],[px,py+1]]){if(nx<0||nx>=64||ny<0||ny>=64)continue;const k=ny*64+nx;if(valid[k])continue;valid[k]=1;queue.push(k);const dest=((y+ny)*2048+x+nx)*4;for(let c=0;c<3;c++)atlas.data[dest+c]=atlas.data[i+c];}}
 }
 for(let c=0;c<clusterCount;c++)assert.ok(views.filter(v=>v.cluster===c).reduce((s,v)=>s+v.alphaIntegral,0)>0,`empty source cluster ${c}`);
 assert.deepEqual(errors,[]);await writeFile(root+'/tree-color.png',PNG.sync.write(atlas));
}finally{await browser.close();}
execFileSync('python3',['-c',`from PIL import Image
from math import sqrt
p='work/tree-reference-source/textures/'
color=Image.open('${root}/tree-color.png').convert('RGBA')
bark=Image.open(p+'island_tree_01_diff_1k.jpg').convert('RGBA').resize((1020,508),Image.Resampling.LANCZOS)
# Numeric normal resampling, renormalization, source roughness in alpha.
n=Image.open(p+'island_tree_01_nor_gl_1k.jpg').convert('RGB').resize((508,252),Image.Resampling.BOX)
arm=Image.open(p+'island_tree_01_arm_1k.jpg').convert('RGB').resize((508,252),Image.Resampling.BOX)
surface=Image.new('RGBA',(512,256));surface_pixels=[]
decode=lambda c: c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
encode=lambda c: c*12.92 if c<=.0031308 else 1.055*c**(1/2.4)-.055
for y in range(256):
 for x in range(512):
  xy=(min(507,max(0,x-2)),min(251,max(0,y-2)))
  ao,rough,_=arm.getpixel(xy)
  normal=[v/127.5-1 for v in n.getpixel(xy)];length=max(.0001,sqrt(sum(v*v for v in normal)))
  surface_pixels.append(tuple(round((v/length+1)*127.5) for v in normal)+(rough,))
surface.putdata(surface_pixels)
patch=Image.new('RGBA',(1024,512));bark_pixels=[]
ao_map=Image.open(p+'island_tree_01_arm_1k.jpg').convert('RGB').resize((1020,508),Image.Resampling.BOX)
for y in range(512):
 for x in range(1024):
  xy=(min(1019,max(0,x-2)),min(507,max(0,y-2)));ao=ao_map.getpixel(xy)[0];c=bark.getpixel(xy)
  bark_pixels.append(tuple(round(255*encode(decode(v/255)*(.35+.65*ao/255))) for v in c[:3])+(255,))
patch.putdata(bark_pixels)
# Opaque duplicated edge pixels prevent leaf color from bleeding into bark.
color.paste(patch,(0,1536));color.save('${root}/tree-color.webp',lossless=True,exact=True)
assert Image.open('${root}/tree-color.webp').convert('RGBA').tobytes()==color.tobytes()
packed=surface
packed.save('${root}/tree-surface.webp',lossless=True,exact=True)
assert Image.open('${root}/tree-surface.webp').convert('RGBA').tobytes()==packed.tobytes()
`]);
await unlink(root+'/tree-color.png');
const meta=JSON.parse(await readFile(root+'/source.json','utf8'));meta.bake={kind:'Unlit photographed albedo and 65% source AO; three orthographic axis views per actual spatial cluster; supersampled area-preserved base alpha; no sun or backdrop',views,errors};
for(const file of['tree-color.webp','tree-surface.webp']){const data=await readFile(root+'/'+file);meta.preparedAssets.push({file,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});}
meta.bakerInputs=[];for(const file of['scripts/prepare-coastal-tree.mjs','scripts/bake-coastal-tree.html','scripts/bake-coastal-tree.mjs'])meta.bakerInputs.push({file,sha256:createHash('sha256').update(await readFile(file)).digest('hex')});
await writeFile(root+'/source.json',JSON.stringify(meta,null,2)+'\n');await writeFile(out+'/result.json',JSON.stringify({views,errors,outputs:meta.preparedAssets},null,2)+'\n');console.log(JSON.stringify({out,outputs:meta.preparedAssets,coveredRange:[Math.min(...views.map(v=>v.covered)),Math.max(...views.map(v=>v.covered))]}));
