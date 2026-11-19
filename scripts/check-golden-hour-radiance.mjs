import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
import {DataTexture,DataUtils,RGBAFormat,HalfFloatType} from 'three';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';

const server=await createServer({
  configFile:false,server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',logLevel:'error'
});
const report=[];
try {
  const {softenGoldenHour}=await server.ssrLoadModule('/src/world/Daylight.ts');
  const {fromHalfFloat}=DataUtils;
  for(const file of ['sky-mobile.hdr','sky.hdr']){
    const bytes=await readFile('public/assets/environment/'+file);
    const parsed=new HDRLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
    const {data,width,height,type}=parsed;
    assert.equal(type,HalfFloatType);
    const original=data.slice();
    const texture=new DataTexture(data,width,height,RGBAFormat,type);
    const start=performance.now();
    softenGoldenHour(texture);
    const ms=performance.now()-start;
    assert.equal(texture.image.data,data);
    assert.equal(texture.image.width,width);
    assert.equal(texture.image.height,height);
    const luma=(values,index)=>
      .2126*fromHalfFloat(values[index])+.7152*fromHalfFloat(values[index+1])+.0722*fromHalfFloat(values[index+2]);
    let peakBefore=0,peakAfter=0,warmSamples=0,warmChanges=0,clipCount=0;
    for(let i=0;i<data.length;i+=4){
      assert.equal(data[i+3],original[i+3]);
      const before=luma(original,i),after=luma(data,i);
      peakBefore=Math.max(peakBefore,before);
      peakAfter=Math.max(peakAfter,after);
      if(!Number.isFinite(after)||after<0)clipCount++;
      const row=Math.floor(i/(width*4))/height;
      if(Math.abs(row-.5)<.04&&before>.12&&before<.8){
        warmSamples++;
        const redGain=fromHalfFloat(data[i])-fromHalfFloat(original[i]);
        const blueGain=fromHalfFloat(data[i+2])-fromHalfFloat(original[i+2]);
        if(after>before&&redGain>blueGain)warmChanges++;
      }
    }
    assert.equal(clipCount,0);
    assert.ok(peakAfter<peakBefore*.55,'The strongest cloud highlights should soften');
    assert.ok(warmSamples>1000&&warmChanges>warmSamples*.8,'Shaded horizon samples should receive warm fill');
    report.push({file,width,height,ms,peakBefore,peakAfter,warmSamples,warmChanges});
    texture.dispose();
  }
} finally {
  await server.close();
}
const directory='artifacts/soft-sunset-m100';
await mkdir(directory,{recursive:true});
await writeFile(directory+'/cpu-radiance.json',JSON.stringify({scope:'Actual original golden hour HDRs passed through the production half-float transform on the host CPU.',report},null,2));
console.log(report);
