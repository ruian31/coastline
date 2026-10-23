// Losslessly pack the already decoded, licensed local rock maps. No resampling.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const folder='public/assets/environment',inputs=[];
for(const path of ['rock-normal.jpg','rock-roughness.jpg']){
 const data=await readFile(`${folder}/${path}`);inputs.push({path,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});
}
const image=JSON.parse(execFileSync('python3',['-c',`from PIL import Image
import json
p='${folder}/'
n=Image.open(p+'rock-normal.jpg').convert('RGB')
r=Image.open(p+'rock-roughness.jpg').convert('RGB')
assert n.size==r.size
assert r.getchannel('R').tobytes()==r.getchannel('G').tobytes()==r.getchannel('B').tobytes()
packed=n.convert('RGBA')
packed.putalpha(r.getchannel('R'))
packed.save(p+'rock-surface.png',optimize=True)
decoded=Image.open(p+'rock-surface.png')
assert decoded.convert('RGB').tobytes()==n.tobytes()
assert decoded.getchannel('A').tobytes()==r.getchannel('R').tobytes()
print(json.dumps({'dimensions':n.size,'normalMaxByteError':0,'roughnessMaxByteError':0}))
`],{encoding:'utf8'}));
const output=await readFile(`${folder}/rock-surface.png`),metadata={license:'CC0-1.0',source:'Existing local rock maps; original source and author in docs/06-资源来源.md',inputs,packing:'RGB = original decoded OpenGL normal; A = original decoded grayscale roughness. No resampling or lossy encoding. Original JPEG files retained for reproducibility.',...image,output:{path:'rock-surface.png',bytes:output.length,sha256:createHash('sha256').update(output).digest('hex')}};
await writeFile(`${folder}/rock-surface-source.json`,JSON.stringify(metadata,null,2)+'\n');console.log(JSON.stringify(metadata));
