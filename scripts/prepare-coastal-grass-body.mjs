import sharp from 'sharp';import {mkdir,readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
const input='source-assets/dry-coastal-grass-atlas-m94-rgb.png',out='work/dry-grass-m94';await mkdir(out,{recursive:true});
const source=await readFile(input),hash=b=>createHash('sha256').update(b).digest('hex'),raw=await sharp(source).removeAlpha().raw().toBuffer({resolveWithObject:true});
assert.equal(raw.info.width,1254);assert.equal(raw.info.height,1254);
assert.equal(hash(source),'fc389dba8c37a9279d0cdde48eea5400f4405bace18a4aaf3afecca02e4a0480','Use the reviewed opaque RGB source');
const entries=[],parts=[];
for(let cell=0;cell<4;cell++){
 const ox=(cell%2)*627,oy=Math.floor(cell/2)*627,data=Buffer.alloc(627*627*4);let minX=627,minY=627,maxX=-1,maxY=-1,empty=0,opaque=0;
 for(let y=0;y<627;y++)for(let x=0;x<627;x++){
  const from=((oy+y)*1254+ox+x)*3,at=(y*627+x)*4,m=Math.max(raw.data[from],raw.data[from+1],raw.data[from+2]),v=Math.max(0,Math.min(1,(m-6)/34)),alpha=v*v*(3-2*v);
  for(let c=0;c<3;c++)data[at+c]=raw.data[from+c];data[at+3]=Math.round(alpha*255);
  if(!data[at+3])empty++;if(data[at+3]===255)opaque++;
  if(data[at+3]>16){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
 }
 assert.ok(minX>0&&minY>0&&maxX<626&&maxY<626,'No clipped source tuft');assert.ok(opaque>1000&&empty>10000);
 const bbox={left:Math.max(0,minX-4),top:Math.max(0,minY-4),width:Math.min(626,maxX+4)-Math.max(0,minX-4)+1,height:Math.min(626,maxY+4)-Math.max(0,minY-4)+1};
 const resized=await sharp(data,{raw:{width:627,height:627,channels:4}}).extract(bbox).resize(448,448,{fit:'inside',kernel:'lanczos3'}).png().toBuffer({resolveWithObject:true});
 const left=(cell%2)*512+Math.floor((512-resized.info.width)/2),top=Math.floor(cell/2)*512+480-resized.info.height;
 parts.push({input:resized.data,left,top});entries.push({cell,bbox,empty,opaque,width:resized.info.width,height:resized.info.height,left,top});
}
const texture=await sharp({create:{width:1024,height:1024,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(parts).png({compressionLevel:9}).toBuffer();await writeFile(out+'/atlas1024.png',texture);
await writeFile(out+'/source.json',JSON.stringify({provider:'Built-in image_gen tool',source:{file:input,bytes:source.length,sha256:hash(source)},prompt:'source-assets/dry-coastal-grass-atlas-m94-rgb.prompt.txt',scope:'Opaque RGB intermediate with black background. Deterministic soft-black-key alpha= smoothstep(6,40,max(R,G,B)), no semantic redraw or alpha dilation. This heuristic is not recovered native alpha and can thin dark leaves; requires mip/edge and in-world visual approval. Source silhouette bounds include alpha>16,4px crop padding, fit into448x448 and common rooted baseline at480 in each512 cell. Runtime candidate only.',entries,output:{file:out+'/atlas1024.png',bytes:texture.length,sha256:hash(texture)}},null,2)+'\n');console.log({outputBytes:texture.length,entries});
