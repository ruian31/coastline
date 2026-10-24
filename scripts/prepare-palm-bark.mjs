// Preserve the photographed aspect ratio; downsample numeric normals in linear
// channel space, renormalize, then losslessly pack normal RGB / roughness A.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const output=process.argv[2]??'public/assets/environment',cache='work/palm-bark-source';await mkdir(output,{recursive:true});await mkdir(cache,{recursive:true});
const hash=(data,algorithm='sha256')=>createHash(algorithm).update(data).digest('hex'),originals=[
 {role:'color',kind:'diff',bytes:1974940,md5:'d9c9ffbc6c32e51f81696416c0fc661e'},
 {role:'normal',kind:'nor_gl',bytes:1514646,md5:'c98b2f2f05b5178b68e74c3272a4fe77'},
 {role:'roughness',kind:'rough',bytes:1350564,md5:'d413cc8189861ae878078c199f70a3ea'},
];
for(const item of originals){
 item.url=`https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/palm_tree_bark/palm_tree_bark_${item.kind}_1k.jpg`;item.path=`${cache}/${item.role}.jpg`;
 let data,downloaded=false;try{data=await readFile(item.path);}catch{const r=await fetch(item.url,{headers:{'User-Agent':'GoldenCoastAssetPipeline/0.1'},signal:AbortSignal.timeout(60000)});assert.ok(r.ok);data=Buffer.from(await r.arrayBuffer());downloaded=true;}
 assert.equal(data.length,item.bytes);assert.equal(hash(data,'md5'),item.md5);item.sha256=hash(data);if(downloaded)await writeFile(item.path,data,{flag:'wx'});
}
const validation=JSON.parse(execFileSync('python3',['-c',`import json,math,sys
from pathlib import Path
from PIL import Image,__version__
out=Path(sys.argv[1]);cache=Path(sys.argv[2]);size=(512,1024)
c=Image.open(cache/'color.jpg').convert('RGB');n=Image.open(cache/'normal.jpg').convert('RGB');r=Image.open(cache/'roughness.jpg').convert('RGB')
assert c.size==n.size==r.size==(1024,2048)
assert r.getchannel('R').tobytes()==r.getchannel('G').tobytes()==r.getchannel('B').tobytes()
resized=n.resize(size,Image.Resampling.BOX);normalized=[];length_error=0
for pixel in resized.get_flattened_data():
 v=[channel/127.5-1 for channel in pixel];length=math.sqrt(sum(channel*channel for channel in v))
 if length<1e-8:v=[0,0,1];length=1
 pixel=tuple(round((channel/length*.5+.5)*255) for channel in v);normalized.append(pixel)
 length_error=max(length_error,abs(math.sqrt(sum((channel/127.5-1)**2 for channel in pixel))-1))
resized.putdata(normalized);rough=r.getchannel('R').resize(size,Image.Resampling.BOX)
resized.save(cache/'normal-512.png');rough.save(cache/'roughness-512.png')
packed=resized.convert('RGBA');packed.putalpha(rough);packed.save(out/'palm-bark-surface.webp',format='WEBP',lossless=True,quality=75,method=6,exact=True)
decoded=Image.open(out/'palm-bark-surface.webp')
assert decoded.convert('RGB').tobytes()==resized.tobytes();assert decoded.getchannel('A').tobytes()==rough.tobytes()
c.resize(size,Image.Resampling.LANCZOS).save(out/'palm-bark-color.jpg',quality=90,subsampling=0,optimize=True)
print(json.dumps({'pillowVersion':__version__,'inputDimensions':[1024,2048],'dimensions':list(size),'normalProcessing':'BOX reduction in numeric RGB, decode XYZ, normalize, quantize to 8-bit RGB','normalMaxLengthError':length_error,'roughnessProcessing':'grayscale BOX reduction','roughnessRange':rough.getextrema(),'colorProcessing':'LANCZOS reduction, JPEG90 / 4:4:4','packedDecodedNormalMaxByteError':0,'packedDecodedRoughnessMaxByteError':0}))
`,output,cache],{encoding:'utf8'}));
const outputs=[];for(const file of ['palm-bark-color.jpg','palm-bark-surface.webp']){const data=await readFile(path.join(output,file));outputs.push({file,bytes:data.length,sha256:hash(data)});}
const metadata={asset:'palm_tree_bark',sourcePage:'https://polyhaven.com/a/palm_tree_bark',apiInfo:'https://api.polyhaven.com/info/palm_tree_bark',apiFiles:'https://api.polyhaven.com/files/palm_tree_bark',license:'CC0-1.0',licenseUrl:'https://polyhaven.com/license',authors:{'Dimitrios Savva':'Photography','Rico Cilliers':'Processing'},sourcePageHeightMetres:1.3,aspectRatio:'original 1024×2048 retained; no square stretching',packing:'OpenGL normal RGB / roughness A. Lossless packing of the processed 512×1024 maps, not byte equality with the original resolution.',originals,...validation,outputs};
await writeFile(path.join(output,'palm-bark-source.json'),JSON.stringify(metadata,null,2)+'\n');console.log(JSON.stringify({output,validation,outputs}));
