// Technical texture conversion only. The generated RGBA original is preserved.
import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const source='source-assets/palm-fronds-v1.png',prompt='source-assets/palm-fronds-v1.prompt.txt',out='public/assets/environment',bytes=await readFile(source),sha256=data=>createHash('sha256').update(data).digest('hex');
assert.equal(sha256(bytes),'350f95ec96ab4782f3598190cd17f0d16916e0994c9ed2753a3287bd884faccc');
const metadata=await sharp(bytes).metadata();assert.equal(metadata.width,1254);assert.equal(metadata.height,1254);assert.equal(metadata.channels,4);
const outputs=[];
for(const size of [512,1024]){
 const file=`palm-fronds-${size}.webp`,path=out+'/'+file;await sharp(bytes).resize(size,size,{kernel:'lanczos3'}).webp({lossless:true}).toFile(path);const data=await readFile(path);outputs.push({file,bytes:data.length,sha256:sha256(data),size:[size,size]});
}
await writeFile(out+'/palm-fronds-source.json',JSON.stringify({provider:'Built-in image_gen tool',transparentBackground:true,source:{file:source,bytes:bytes.length,sha256:sha256(bytes),size:[1254,1254]},prompt:{file:prompt,sha256:sha256(await readFile(prompt))},recipe:{file:'scripts/prepare-palm-fronds.mjs',sha256:sha256(await readFile('scripts/prepare-palm-fronds.mjs')),sharp:sharp.versions.sharp,resize:'Lanczos3 power-of-two resize, RGBA alpha resampled and preserved',encoding:'lossless WebP; resampling changes source pixels'},outputs},null,2)+'\n');console.log(JSON.stringify({outputs}));
