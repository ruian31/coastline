import {NodeIO} from '@gltf-transform/core';
import {prune,dedup} from '@gltf-transform/functions';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const source='work/asset-sources/wild_rooibos_bush',output='public/assets/models/coastal_shrubs';
execFileSync('python3',['-c',`from PIL import Image
from pathlib import Path
p=Path('${source}/textures')
im=Image.open(p/'wild_rooibos_bush_diff_1k.jpg').convert('RGBA')
im.putalpha(Image.open(p/'alpha.png').convert('L'))
im.save(p/'wild_rooibos_bush_color.png',optimize=True)
`]);
await mkdir(output,{recursive:true});const io=new NodeIO(),doc=await io.read(`${source}/wild_rooibos_bush.gltf`);
// Keep the two smaller authored plant variants; do not collapse alpha leaf cards into shapeless leaves.
for(const node of doc.getRoot().listNodes())if(!node.getName().endsWith('_d')&&!node.getName().endsWith('_e'))node.dispose();
await doc.transform(prune(),dedup());
const rgba=await readFile(`${source}/textures/wild_rooibos_bush_color.png`);
for(const texture of doc.getRoot().listTextures())if(texture.getName().includes('diff'))texture.setImage(rgba).setMimeType('image/png').setURI('shrub-color.png');
for(const material of doc.getRoot().listMaterials()){
 material.setAlphaMode('MASK').setAlphaCutoff(.45).setMetallicFactor(0).setRoughnessFactor(.92);
 const arm=material.getMetallicRoughnessTexture();if(arm)material.setOcclusionTexture(arm).setOcclusionStrength(.8);
}
await doc.transform(dedup(),prune());for(const buffer of doc.getRoot().listBuffers())buffer.setURI('shrubs.bin');
await io.write(`${output}/shrubs.gltf`,doc);
const variants=doc.getRoot().listMeshes().map(m=>({name:m.getName(),triangles:m.listPrimitives().reduce((n,p)=>n+p.getIndices().getCount()/3,0)}));
const files=JSON.parse(await readFile(`${source}/source-files.json`,'utf8'));
const alpha=JSON.parse(await readFile('work/wild_rooibos_bush-files.json','utf8')).Alpha['1k'].png;
await writeFile(`${output}/source.json`,JSON.stringify({asset:'wild_rooibos_bush',page:'https://polyhaven.com/a/wild_rooibos_bush',license:'CC0-1.0',authors:{'James Ray Cock':'modeling','Jenelle van Heerden':'photography'},sourceFiles:files,alpha,conversion:'Official 1k alpha merged losslessly into color; retain smaller d/e variants, add ARM red-channel AO',variants,colorSha256:createHash('sha256').update(rgba).digest('hex')},null,2)+'\n');
console.log(variants);
