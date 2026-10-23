import assert from 'node:assert/strict';
import {createServer} from 'vite';

const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try{
 const {buildShoreField,SEA_LEVEL}=await server.ssrLoadModule('/src/world/CoastalWater.ts');
 const size=257,dx=1060/(size-1),dz=940/(size-1);
 for(const [nx,nz]of[[1,0],[.6,.8]]){
  const built=buildShoreField((x,z)=>SEA_LEVEL+.14*(nx*x+nz*z),size);
  let checked=0,maxDistanceError=0,maxHeightError=0;
  // Keep the perpendicular foot inside the finite map. Chamfer distance has
  // an 8-neighbour angular error plus a sub-cell seed error; it is not an EDT.
  for(let z=10;z<size-10;z++)for(let x=10;x<size-10;x++){
   const i=z*size+x,expected=nx*(x*dx-530)+nz*(z*dz-470);
   if(Math.abs(expected)>25)continue;
   const decodedHeight=((built.data[i*4]*256+built.data[i*4+1])/65535)*80-8;
   const decodedDistance=built.data[i*4+2]/255*64-32;
   maxHeightError=Math.max(maxHeightError,Math.abs(decodedHeight-(SEA_LEVEL+.14*expected)));
   maxDistanceError=Math.max(maxDistanceError,Math.abs(decodedDistance-expected));
   assert.ok(Math.abs(decodedDistance-expected)<Math.abs(expected)*.085+Math.max(dx,dz)*.25+.13,'shoreline distance follows an analytic oblique coast within grid precision');
   checked++;
  }
  assert.ok(checked>1000);assert.ok(maxHeightError<.00062,'packed height keeps sub-millimetre precision');
  console.log(JSON.stringify({normal:[nx,nz],checked,maxDistanceError,maxHeightError}));
 }
 // A rock roof is not a filled column: water beneath an overhang must survive
 // the conservative solid-land mask, while genuinely high ground is rejected.
 const overhang=buildShoreField((x,z)=>Math.hypot(x,z)<20?5:SEA_LEVEL-3,65,()=>SEA_LEVEL-3);
 assert.equal(overhang.data[(32*65+32)*4+3],0);
 const island=buildShoreField((x,z)=>Math.hypot(x,z)<60?5:SEA_LEVEL-3,65);
 assert.equal(island.data[(32*65+32)*4+3],255);
 for(const [height,expected]of[[SEA_LEVEL-2,0],[5,255]]){
  const all=buildShoreField(()=>height,17);
  assert.ok(all.data.every((v,i)=>i%4!==2||v===expected),'coasts outside the map have a saturated finite distance');
 }
 assert.throws(()=>buildShoreField(()=>NaN,17),/Non-finite/);
 console.log('PASS: analytic shore distance, height precision, overhang mask, map bounds and invalid samples');
}finally{await server.close();}
