// Exact power-of-two radiance normalization, retaining every RGBE source value
// without clipping bright suns/moons into HalfFloat. Runtime gains compensate.
import assert from 'node:assert/strict';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import * as THREE from 'three';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const out=process.env.DAYLIGHT_OUTPUT??'public/assets/environment/daylight',cache='work/daylight-source',source=JSON.parse(await readFile('source-assets/daylight-skies.json','utf8'));
await mkdir(cache,{recursive:true});
await mkdir(out,{recursive:true});const rows=[];
for(const original of source.files){
 const cachePath=cache+'/'+original.id+'.hdr';let bytes;
 try{bytes=await readFile(cachePath);}catch(error){if(error.code!=='ENOENT')throw error;const response=await fetch(original.url,{signal:AbortSignal.timeout(120000)});assert.ok(response.ok,original.url);bytes=Buffer.from(await response.arrayBuffer());assert.equal(bytes.length,original.bytes);assert.equal(createHash('md5').update(bytes).digest('hex'),original.md5);assert.equal(createHash('sha256').update(bytes).digest('hex'),original.sha256);await writeFile(cachePath,bytes,{flag:'wx'});}
 assert.equal(bytes.length,original.bytes);assert.equal(createHash('md5').update(bytes).digest('hex'),original.md5);assert.equal(createHash('sha256').update(bytes).digest('hex'),original.sha256);
 const parse=b=>new HDRLoader().setDataType(THREE.FloatType).parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));
 const image=parse(bytes);let max=0;for(let i=0;i<image.data.length;i++)if(i%4!==3)max=Math.max(max,image.data[i]);
 const gain=2**Math.max(0,Math.ceil(Math.log2(max/60000))),chunks=[Buffer.from(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${image.height} +X ${image.width}\n`)];
 for(let y=0;y<image.height;y++){
  chunks.push(Buffer.from([2,2,image.width>>8,image.width&255]));const scan=new Uint8Array(image.width*4);
  for(let x=0;x<image.width;x++){
   const i=(y*image.width+x)*4,c=[image.data[i]/gain,image.data[i+1]/gain,image.data[i+2]/gain],m=Math.max(...c);
   // Match this installed HDRLoader's RGBE decoder (2^exponent / 255),
   // including the source byte255 at an exact power-of-two maximum.
   if(!m)continue;const e=Math.ceil(Math.log2(m)),f=255/2**e;
   for(let k=0;k<3;k++){const value=Math.round(c[k]*f);assert.ok(value>=0&&value<=255);scan[x*4+k]=value;}
   scan[x*4+3]=e+128;
  }
  for(let channel=0;channel<4;channel++){
   const data=Uint8Array.from({length:image.width},(_,x)=>scan[x*4+channel]),encoded=[];
   let x=0;while(x<data.length){let run=1;while(x+run<data.length&&data[x+run]===data[x]&&run<127)run++;
    if(run>=4){encoded.push(128+run,data[x]);x+=run;continue;}
    const begin=x;x+=run;
    while(x<data.length&&x-begin<128){let next=1;while(x+next<data.length&&data[x+next]===data[x]&&next<4)next++;if(next>=4)break;x+=Math.min(next,128-(x-begin));}
    encoded.push(x-begin,...data.slice(begin,x));
   }
   chunks.push(Buffer.from(encoded));
  }
 }
 const encoded=Buffer.concat(chunks),decoded=parse(encoded);let maxError=0;assert.equal(decoded.data.length,image.data.length);
 for(let i=0;i<image.data.length;i++)if(i%4!==3)maxError=Math.max(maxError,Math.abs(decoded.data[i]*gain-image.data[i]));
 assert.equal(maxError,0);assert.ok(max/gain<=60000);
 const path=out+'/'+original.id+'.hdr';await writeFile(path,encoded);
 rows.push({id:original.id,original,gain,method:'Original RGBE radiance divided by an exact power of two, RLE re-encoded; every decoded source RGB value restored with zero error by multiplying the recorded gain.',width:image.width,height:image.height,originalMax:max,encodedMax:max/gain,maxRestoredError:maxError,path:original.id+'.hdr',bytes:encoded.length,sha256:createHash('sha256').update(encoded).digest('hex')});
}
await writeFile(out+'/source.json',JSON.stringify({purpose:'Four licensed pure-sky HDRs for representative coast daylight states. Source files remain unmodified in the local cache; runtime gains restore their original radiance. Default golden-hour files are separate and unchanged.',licensePage:source.licensePage,files:rows},null,2)+'\n');console.log(rows.map(({id,gain,originalMax,encodedMax,maxRestoredError,bytes})=>({id,gain,originalMax,encodedMax,maxRestoredError,bytes})));
