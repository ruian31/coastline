import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import {createServer} from 'vite';
const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',logLevel:'error'});
try{
 const {DAYLIGHT_PRESETS}=await server.ssrLoadModule('/src/world/Daylight.ts'),metadata=JSON.parse(await readFile('public/assets/environment/daylight/source.json','utf8')),pinned=JSON.parse(await readFile('source-assets/daylight-skies.json','utf8')),rows=[];
 assert.equal(metadata.files.length,4);assert.equal(DAYLIGHT_PRESETS.length,5);
 const parse=b=>new HDRLoader().setDataType(THREE.FloatType).parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));
 for(const file of metadata.files){
  const preset=DAYLIGHT_PRESETS.find(p=>p.asset===file.id);assert.ok(preset);assert.equal(preset.gain,file.gain);
  const source=pinned.files.find(s=>s.id===file.id);assert.deepEqual(file.original,source);
  const bytes=await readFile('public/assets/environment/daylight/'+file.path);assert.equal(bytes.length,file.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);
  const image=parse(bytes);assert.equal(image.width,1024);assert.equal(image.height,512);
  const originalBytes=await readFile('work/daylight-source/'+file.id+'.hdr');assert.equal(createHash('sha256').update(originalBytes).digest('hex'),source.sha256);const original=parse(originalBytes);
  let max=0,maxError=0,brightest=0,brightestAt=0;
  for(let i=0;i<image.data.length;i++)if(i%4!==3){max=Math.max(max,image.data[i]);maxError=Math.max(maxError,Math.abs(image.data[i]*file.gain-original.data[i]));}
  assert.equal(maxError,0);assert.ok(max<=60000);
  for(let y=0;y<image.height/2;y++)for(let x=0;x<image.width;x++){const i=(y*image.width+x)*4,luma=.2126*image.data[i]+.7152*image.data[i+1]+.0722*image.data[i+2];if(luma>brightest){brightest=luma;brightestAt=i/4;}}
  const x=brightestAt%image.width,y=Math.floor(brightestAt/image.width),azimuth=((x+.5)/image.width-.5)*Math.PI*2,elevation=(.5-(y+.5)/image.height)*Math.PI;
  const direction=new THREE.Vector3(Math.cos(azimuth)*Math.cos(elevation),Math.sin(elevation),Math.sin(azimuth)*Math.cos(elevation)).applyAxisAngle(new THREE.Vector3(0,1,0),preset.rotation),dot=direction.dot(new THREE.Vector3().fromArray(preset.direction).normalize());
  if(preset.sunIntensity>0)assert.ok(dot>.9999999,file.id+' peak/key misalignment');
  rows.push({id:preset.id,asset:file.id,gain:file.gain,bytes:bytes.length,sha256:file.sha256,maxRuntimeRadiance:max,maxRestoredError:maxError,peakPixel:[x,y],peakDirection:direction.toArray(),keyDot:preset.sunIntensity>0?dot:null});
 }
 await writeFile(process.env.DAYLIGHT_VALIDATION_REPORT??'artifacts/daynight-m75/source-validation.json',JSON.stringify({method:'Independently decode pinned original/cache and prepared RGBE, verify bytes/SHA, restore every RGB value with recorded gain and compare exact Float32. Compare source upper-hemisphere brightest pixel and authored rotated sun/moon direction when direct light is enabled. Not browser/GPU/phone performance.',rows},null,2)+'\n');console.log(JSON.stringify(rows));
}finally{await server.close();}
