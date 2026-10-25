import * as THREE from 'three';

/** Preserve thin photographed leaves as an atlas shrinks. Regions are disjoint
 * pixel rectangles in the source image; opaque wood must stay outside them. */
export function preservePlantCutoutMips(texture:THREE.Texture,regions:readonly (readonly [number,number,number,number])[],threshold=.45):void {
 const source=texture.image as HTMLImageElement,width=source.width,height=source.height;
 if(width!==height||width<2||(width&(width-1))!==0)throw Error('Plant coverage requires a square power-of-two atlas');
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const context=canvas.getContext('2d',{willReadFrequently:true})!;context.drawImage(source,0,0);
 const base=context.getImageData(0,0,width,height).data,cut=Math.ceil(threshold*255),coverage=regions.map(([x,y,w,h])=>{
  let covered=0;for(let row=y;row<y+h;row++)for(let col=x;col<x+w;col++)if(base[(row*width+col)*4+3]>=cut)covered++;
  return covered/(w*h);
 });
 const srgb=texture.colorSpace===THREE.SRGBColorSpace,decode=Float64Array.from({length:256},(_,i)=>{const c=i/255;return srgb?(c<=.04045?c/12.92:((c+.055)/1.055)**2.4):c;}),encode=Uint8ClampedArray.from({length:4097},(_,i)=>{const c=i/4096;return 255*(srgb?(c<=.0031308?c*12.92:1.055*c**(1/2.4)-.055):c);});
 // The image and every mip use the same DOM source type. A GLTF ImageBitmap
 // mixed with Canvas mips would inherit the previous texture's unpack state.
 texture.image=canvas;const mipmaps:HTMLCanvasElement[]=[canvas];
 texture.mipmaps=mipmaps;let raw=base,rawWidth=width;
 for(let size=width/2;size>=1;size/=2){
  const mip=document.createElement('canvas');mip.width=mip.height=size;const ctx=mip.getContext('2d')!,image=ctx.createImageData(size,size),data=image.data,nextRaw=new Uint8ClampedArray(data.length);
  // Use the uncorrected chain, so alpha inflation never accumulates. RGB is
  // averaged in linear light with alpha weights, avoiding dark distant leaves.
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const sum=[0,0,0];let alpha=0;
   for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const i=((y*2+dy)*rawWidth+x*2+dx)*4,a=raw[i+3];alpha+=a;for(let c=0;c<3;c++)sum[c]+=decode[raw[i+c]]*a;}
   const i=(y*size+x)*4;for(let c=0;c<3;c++)nextRaw[i+c]=alpha?encode[Math.round(sum[c]/alpha*4096)]:0;nextRaw[i+3]=alpha/4;
  }
  data.set(nextRaw);raw=nextRaw;rawWidth=size;
  regions.forEach(([x,y,w,h],region)=>{
   const left=Math.round(x/width*size),top=Math.round(y/height*size),right=Math.round((x+w)/width*size),bottom=Math.round((y+h)/height*size),area=(right-left)*(bottom-top);
   if(!area||!coverage[region])return;
   const histogram=new Uint32Array(256);
   for(let row=top;row<bottom;row++)for(let col=left;col<right;col++)histogram[data[(row*size+col)*4+3]]++;
   const target=Math.max(1,Math.round(coverage[region]*area));let count=0,level=255;
   while(level>1&&count+histogram[level]<target){count+=histogram[level];level--;}
   const scale=Math.max(1,(cut+1)/level);
   for(let row=top;row<bottom;row++)for(let col=left;col<right;col++){const i=(row*size+col)*4+3;data[i]=Math.min(255,Math.round(data[i]*scale));}
  });
  ctx.putImageData(image,0,0);mipmaps.push(mip);
 }
 texture.generateMipmaps=false;texture.needsUpdate=true;
 texture.userData.alphaCoverage={threshold,regions:regions.map(region=>[...region]),coverage,averaging:srgb?'linear-light alpha-weighted sRGB':'linear alpha-weighted'};
}

// Rooibos: fine leaf fans at the top left, twig cutouts below; the right-hand
// opaque bark strip is deliberately excluded from both coverage targets.
export function preserveRooibosCutoutMips(texture:THREE.Texture):void {
 const image=texture.image as {width:number;height:number};
 if(image.width!==1024||image.height!==1024)throw Error('Rooibos cutouts require the authored 1024-square atlas');
 preservePlantCutoutMips(texture,[[0,0,662,160],[0,160,662,864]]);
}

/** Object-space normals stay opaque to avoid the browser's premultiplied-alpha
 * rounding. Only the original colour coverage may contribute to their mips. */
export function preservePlantNormalMips(texture:THREE.Texture,coverage:THREE.Texture):void {
 const source=texture.image as HTMLImageElement,width=source.width,height=source.height,mask=coverage.image as HTMLCanvasElement;
 if(width!==height||width<2||(width&(width-1))!==0||mask.width!==width||mask.height!==height)throw Error('Plant normals require a matching square power-of-two coverage atlas');
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const context=canvas.getContext('2d',{willReadFrequently:true})!;context.drawImage(source,0,0);
 const base=context.getImageData(0,0,width,height).data,alpha=mask.getContext('2d',{willReadFrequently:true})!.getImageData(0,0,width,height).data;
 let raw=new Float32Array(base.length),rawWidth=width;
 for(let i=0;i<base.length;i+=4){const x=base[i]/127.5-1,y=base[i+1]/127.5-1,z=base[i+2]/127.5-1,length=Math.hypot(x,y,z);raw[i]=x/length;raw[i+1]=y/length;raw[i+2]=z/length;raw[i+3]=alpha[i+3]/255;}
 texture.image=canvas;const mipmaps:HTMLCanvasElement[]=[canvas];texture.mipmaps=mipmaps;
 for(let size=width/2;size>=1;size/=2){
  const mip=document.createElement('canvas');mip.width=mip.height=size;const ctx=mip.getContext('2d')!,image=ctx.createImageData(size,size),nextRaw=new Float32Array(image.data.length);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const sum=[0,0,0],empty=[0,0,0];let weight=0;
   for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const i=((y*2+dy)*rawWidth+x*2+dx)*4,a=raw[i+3];weight+=a;for(let c=0;c<3;c++){sum[c]+=raw[i+c]*a;empty[c]+=raw[i+c];}}
   const i=(y*size+x)*4;for(let c=0;c<3;c++)nextRaw[i+c]=weight?sum[c]/weight:empty[c]/4;nextRaw[i+3]=weight/4;
   // Keep the unnormalised resultant in the raw chain. Normalising each level
   // would overweight cancelled vectors when the following level is reduced.
   const length=Math.hypot(nextRaw[i],nextRaw[i+1],nextRaw[i+2]);
   for(let c=0;c<3;c++)image.data[i+c]=127.5*((length>1e-8?nextRaw[i+c]/length:c===1?1:0)+1);image.data[i+3]=255;
  }
  ctx.putImageData(image,0,0);mipmaps.push(mip);raw=nextRaw;rawWidth=size;
 }
 texture.colorSpace=THREE.NoColorSpace;texture.generateMipmaps=false;texture.needsUpdate=true;
 texture.userData.normalMips={levels:mipmaps.length,coverage:coverage.uuid,averaging:'original coverage weighted object XYZ',opaque:true};
}

/** Centre MSAA coverage on the authored cutoff. Three's forward-only smoothstep
 * removes subpixel needles even after their mip coverage has been preserved. */
export function centerPlantAlphaCoverage(material:THREE.Material):void {
 const compile=material.onBeforeCompile,key=material.customProgramCacheKey();
 material.onBeforeCompile=(shader,renderer)=>{
  compile(shader,renderer);
  shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',THREE.ShaderChunk.alphatest_fragment.replace('smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a )','smoothstep( alphaTest - fwidth( diffuseColor.a ) * .5, alphaTest + fwidth( diffuseColor.a ) * .5, diffuseColor.a )'));
 };
 material.customProgramCacheKey=()=>key+'-plant-centered-alpha-v1';
}
