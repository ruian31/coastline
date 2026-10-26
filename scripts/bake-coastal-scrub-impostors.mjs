// Actual source plants -> straight albedo and per-leaf object-space normals.
// Supersampling resolves coverage on the CPU; no lit colour or backdrop baked.
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const asset=process.env.SCRUB_ASSET??'coastal_scrub';assert.ok(['coastal_scrub','coastal_rooibos','coastal_searsia'].includes(asset));
const root='public/assets/models/'+asset,label=process.env.SCRUB_BAKE_LABEL??String(Date.now());assert.match(label,/^[a-z0-9-]+$/);
const out='artifacts/scrub-impostor-bake-'+label;await mkdir(out);
const inputs=[],bakerInputs=[];
for(const path of ['scrub.gltf','scrub.bin','scrub-color.png',...asset==='coastal_searsia'?['source.json']:[]])inputs.push({path,sha256:createHash('sha256').update(await readFile(root+'/'+path)).digest('hex')});
for(const path of ['scripts/bake-coastal-scrub-impostors.mjs','scripts/bake-coastal-scrub.html','src/world/PlantTexture.ts'])bakerInputs.push({path,sha256:createHash('sha256').update(await readFile(path)).digest('hex')});
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']}),page=await browser.newPage(),errors=[],captures=[];
let calibration,normalCalibration;
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:5188')+'/scripts/bake-coastal-scrub.html?asset='+asset);await page.waitForFunction(()=>window.bakeReady);
 calibration=await page.evaluate(()=>window.scrubBake.render(0,0,'calibration'));
 normalCalibration=await page.evaluate(()=>window.scrubBake.render(0,0,'normal-calibration'));
 for(let variant=0;variant<2;variant++)for(let view=0;view<5;view++){
  const data={variant,view};
  for(const pass of ['color','normal'])data[pass]=await page.evaluate(([variant,view,pass])=>window.scrubBake.render(variant,view,pass),[variant,view,pass]);
  captures.push(data);
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}

const decode=Float64Array.from({length:256},(_,i)=>{const c=i/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}),encode=c=>Math.round(255*(c<=.0031308?c*12.92:1.055*c**(1/2.4)-.055));
function reduce(source,normal=false){
 const result=new PNG({width:128,height:128});
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){
  const sum=[0,0,0];let alpha=0;
  for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++){
   const i=((y*4+dy)*512+x*4+dx)*4,a=source.data[i+3];alpha+=a;
   for(let c=0;c<3;c++)sum[c]+=(normal?source.data[i+c]/127.5-1:decode[source.data[i+c]])*a;
  }
  const i=(y*128+x)*4;result.data[i+3]=Math.round(alpha/16);
  if(!alpha)continue;
  if(normal){const length=Math.hypot(...sum);assert.ok(length>0);for(let c=0;c<3;c++)result.data[i+c]=Math.round((sum[c]/length*.5+.5)*255);}
  else for(let c=0;c<3;c++)result.data[i+c]=encode(sum[c]/alpha);
 }
 return result;
}
function dilate(tile){
 const valid=new Uint8Array(128*128),queue=[];
 for(let i=0;i<valid.length;i++)if(tile.data[i*4+3]){valid[i]=1;queue.push(i);}
 for(let at=0;at<queue.length;at++){
  const i=queue[at],x=i%128,y=Math.floor(i/128);
  for(const[nx,ny]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
   if(nx<0||nx>=128||ny<0||ny>=128)continue;
   const j=ny*128+nx;if(valid[j])continue;valid[j]=1;queue.push(j);
   for(let c=0;c<3;c++)tile.data[j*4+c]=tile.data[i*4+c];
  }
 }
}
const decodePng=value=>PNG.sync.read(Buffer.from(value.png.split(',')[1],'base64'));
const colorControl=reduce(decodePng(calibration)),normalControl=reduce(decodePng(normalCalibration),true);
function calibrationError(image,expected){let maximum=0,checked=0;for(let i=0;i<image.data.length;i+=4)if(image.data[i+3]){checked++;for(let c=0;c<3;c++)maximum=Math.max(maximum,Math.abs(image.data[i+c]-expected[c]));}assert.ok(checked>100);assert.ok(maximum<=1);return{checked,maxError:maximum,expected};}
const controls={color:calibrationError(colorControl,[137,170,89]),normal:calibrationError(normalControl,[173,230,66])};
await writeFile(out+'/color-calibration.png',PNG.sync.write(colorControl));await writeFile(out+'/normal-calibration.png',PNG.sync.write(normalControl));
const atlas=new PNG({width:512,height:512}),normals=new PNG({width:512,height:512}),views=[];
// Opaque data avoids premultiplied-alpha quantization of encoded normals.
// Colour carries the coverage mask; transparent normal RGB is dilated below.
for(let i=0;i<normals.data.length;i+=4)normals.data.set([128,255,128,255],i);
let maxNormalLengthError=0;
for(const capture of captures){
 const color=reduce(decodePng(capture.color)),normal=reduce(decodePng(capture.normal),true),tile=capture.variant*5+capture.view,x=tile%4*128,y=Math.floor(tile/4)*128;let covered=0;
 for(let i=0;i<color.data.length;i+=4){
  assert.equal(color.data[i+3],normal.data[i+3]);
  if(color.data[i+3]>=128)covered++;
  if(color.data[i+3])maxNormalLengthError=Math.max(maxNormalLengthError,Math.abs(Math.hypot(...[0,1,2].map(c=>normal.data[i+c]/127.5-1))-1));
 }
 assert.ok(covered>100);dilate(color);dilate(normal);
 for(let i=3;i<normal.data.length;i+=4)normal.data[i]=255;
 PNG.bitblt(color,atlas,0,0,128,128,x,y);PNG.bitblt(normal,normals,0,0,128,128,x,y);
 await writeFile(`${out}/${capture.variant}-${capture.view}.png`,PNG.sync.write(color));
 views.push({variant:capture.variant,view:capture.view,tile,covered,width:capture.color.width,height:capture.color.height});
}
assert.ok(maxNormalLengthError<.007);
const colorBytes=PNG.sync.write(atlas),normalBytes=PNG.sync.write(normals);
await writeFile(root+'/scrub-impostors.png',colorBytes);await writeFile(root+'/scrub-impostor-normals.png',normalBytes);
const output=(path,bytes)=>({path,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
const result={kind:'Unlit source albedo and per-view face-oriented object XYZ normals. No MSAA, opaque authored alpha cutoff, 4x raster then linear-light alpha-weighted colour and renormalized normals. Byte-identical source masks checked before setting normal alpha opaque; full tile RGB dilation. Colour carries coverage, normal data stays opaque. No sun baked.',inputs,bakerInputs,size:[512,512],tileSize:128,sourceRasterSize:512,views,controls,maxNormalLengthError,output:output('scrub-impostors.png',colorBytes),normalOutput:output('scrub-impostor-normals.png',normalBytes),errors};
await writeFile(root+'/impostor-source.json',JSON.stringify(result,null,2)+'\n');await writeFile(out+'/result.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({out,output:result.output,normalOutput:result.normalOutput,controls,maxNormalLengthError}));
