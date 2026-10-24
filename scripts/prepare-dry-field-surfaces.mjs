// Numeric PBR packing: preserve decoded OpenGL normal RGB and roughness in A.
// Originals remain reproducible through official hashes; no generated artwork.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';

const output=process.argv[2]??'public/assets/environment',cache='work/withered-grass-source';await mkdir(output,{recursive:true});await mkdir(cache,{recursive:true});
const digest=(data,algorithm='sha256')=>createHash(algorithm).update(data).digest('hex');
const originals=[
 {role:'color',kind:'diff',bytes:1138384,md5:'a6e00946839a9ab1975457ae4a39823b'},
 {role:'normal',kind:'nor_gl',bytes:1472149,md5:'1d86c19a4dd4826eeb6db9653f8736bb'},
 {role:'roughness',kind:'rough',bytes:824502,md5:'bd4219a20ed41f88098166497cdbc05d'},
];
for(const item of originals){
 item.url=`https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/withered_grass/withered_grass_${item.kind}_1k.jpg`;item.path=`${cache}/${item.role}.jpg`;
 let data,downloaded=false;try{data=await readFile(item.path);}catch{const response=await fetch(item.url,{headers:{'User-Agent':'GoldenCoastAssetPipeline/0.1'},signal:AbortSignal.timeout(60000)});assert.ok(response.ok);data=Buffer.from(await response.arrayBuffer());downloaded=true;}
 assert.equal(data.length,item.bytes);assert.equal(digest(data,'md5'),item.md5);item.sha256=digest(data);if(downloaded)await writeFile(item.path,data,{flag:'wx'});
}
const manifest=JSON.parse(await readFile('public/assets/environment/manifest.json','utf8')),existing=[];
for(const file of ['ground-normal.jpg','ground-roughness.jpg','sand-normal.jpg','sand-roughness.jpg']){
 const data=await readFile(`public/assets/environment/${file}`),source=manifest.assets.find(item=>item.file===file);assert.ok(source);assert.equal(digest(data),source.sha256);existing.push({file,bytes:data.length,sha256:digest(data),source:source.source,sourcePage:source.sourcePage,authors:source.authors});
}
const validation=JSON.parse(execFileSync('python3',['-c',`import json,sys
from pathlib import Path
from PIL import Image, __version__
out=Path(sys.argv[1]);cache=Path(sys.argv[2]);env=Path('public/assets/environment')
checks=[]
for stem,folder,normal,rough in [('ground',env,'ground-normal.jpg','ground-roughness.jpg'),('sand',env,'sand-normal.jpg','sand-roughness.jpg'),('field',cache,'normal.jpg','roughness.jpg')]:
 n=Image.open(folder/normal).convert('RGB');r=Image.open(folder/rough).convert('RGB')
 assert n.size==r.size==(1024,1024)
 assert r.getchannel('R').tobytes()==r.getchannel('G').tobytes()==r.getchannel('B').tobytes()
 packed=n.convert('RGBA');packed.putalpha(r.getchannel('R'));packed.save(out/(stem+'-surface.webp'),format='WEBP',lossless=True,quality=75,method=6,exact=True)
 decoded=Image.open(out/(stem+'-surface.webp'))
 assert decoded.convert('RGB').tobytes()==n.tobytes()
 assert decoded.getchannel('A').tobytes()==r.getchannel('R').tobytes()
 checks.append({'file':stem+'-surface.webp','dimensions':[1024,1024],'normalMaxByteError':0,'roughnessMaxByteError':0})
color=Image.open(cache/'color.jpg').convert('RGB');assert color.size==(1024,1024)
color.save(out/'field-color.jpg',quality=88,subsampling=0,optimize=True)
print(json.dumps({'pillowVersion':__version__,'checks':checks,'colorProcessing':'JPEG quality88 / subsampling0 / 1024 square; no resampling'}))
`,output,cache],{encoding:'utf8'}));
const outputs=[];
for(const file of ['ground-surface.webp','sand-surface.webp','field-surface.webp','field-color.jpg']){const data=await readFile(path.join(output,file));outputs.push({file,bytes:data.length,sha256:digest(data)});}
const metadata={license:'CC0-1.0',licenseUrl:'https://polyhaven.com/license',sourcePage:'https://polyhaven.com/a/withered_grass',asset:'withered_grass',authors:['Charlotte Baglioni'],physicalSizeMetres:[2,2],apiInfo:'https://api.polyhaven.com/info/withered_grass',apiFiles:'https://api.polyhaven.com/files/withered_grass',packing:'All *-surface.webp: RGB = decoded OpenGL normal, A = decoded grayscale roughness. No resizing or lossy encoding of those four channels. Existing coast/sand color maps remain unchanged.',originals,existing,...validation,outputs};
await writeFile(path.join(output,'dry-field-source.json'),JSON.stringify(metadata,null,2)+'\n');console.log(JSON.stringify({output,validation,outputs}));
