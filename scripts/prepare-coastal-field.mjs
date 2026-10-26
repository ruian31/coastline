// Offline technical conversion; preserve the generated original and prompt.
import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const source='source-assets/coastal-field-v1.png',prompt='source-assets/coastal-field-v1.prompt.txt',recipe='scripts/prepare-coastal-field.mjs',out='public/assets/environment';
const sha256=data=>createHash('sha256').update(data).digest('hex'),bytes=await readFile(source),metadata=await sharp(bytes).metadata();
assert.equal(sha256(bytes),'c697e00b1b0efba640c6ce7ab67ab73d13fc2dbaffdc02bafef2b7be86ca82bf');
assert.equal(metadata.width,1254);assert.equal(metadata.height,1254);assert.equal(metadata.channels,3);
const outputs=[];
for(const size of [512,1024]){
 const file=`coastal-field-v1-${size}.webp`,path=out+'/'+file;
 await sharp(bytes).resize(size,size,{kernel:'lanczos3'}).webp({quality:92}).toFile(path);
 const data=await readFile(path);outputs.push({file,bytes:data.length,sha256:sha256(data),size:[size,size]});
}
await writeFile(out+'/coastal-field-source.json',JSON.stringify({provider:'Built-in image_gen tool',transparentBackground:false,source:{file:source,bytes:bytes.length,sha256:sha256(bytes),size:[1254,1254]},prompt:{file:prompt,sha256:sha256(await readFile(prompt))},recipe:{file:recipe,sha256:sha256(await readFile(recipe)),sharp:sharp.versions.sharp,resize:'Lanczos3 power-of-two resize',encoding:'lossy WebP quality 92; no recoloring or generated normal/height map'},usage:'16m world-XZ field base color with mirrored repeat and small existing macro warp. Replaces the previous field color sampler; existing 2m photographed grass micro-normal and roughness remain. This is generated albedo, not a scan or a source-matched PBR set. Mirroring hides edge discontinuity; original edges are not claimed to be seamless.',outputs},null,2)+'\n');
console.log(JSON.stringify({outputs},null,2));
