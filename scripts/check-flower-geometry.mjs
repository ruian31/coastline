import assert from'node:assert/strict';import{createServer}from'vite';import{mkdir,writeFile}from'node:fs/promises';
const out=process.env.FLOWER_EVIDENCE??'artifacts/flowers-m83';await mkdir(out,{recursive:true});const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',logLevel:'error'});
try{
 const{createCoastalFlowerGeometry}=await server.ssrLoadModule('/src/world/FlowerGeometry.ts'),heads=Array.from({length:5},(_,i)=>({x:Math.sin(i*2)*.17,z:Math.cos(i*3)*.13,height:.27+i*.049})),rows=[];
 for(const mobile of [true,false]){
  const g=createCoastalFlowerGeometry(heads,mobile),p=g.attributes.position,c=g.attributes.flowerClosedPosition,n=g.attributes.normal,cn=g.attributes.flowerClosedNormal,petal=g.attributes.flowerPetal,idx=g.index.array;
  assert.ok(idx.length/3<=400);assert.equal(p.count,c.count);assert.ok(idx.every(i=>i<p.count));let minimumArea=Infinity,maxNormalError=0;
  const samples=[];
  for(const bloom of [0,.06,.12,.42,.71,1]){
   const vertices=Array.from({length:p.count},(_,i)=>[0,1,2].map(k=>c.array[i*3+k]*(1-bloom)+p.array[i*3+k]*bloom));
   for(let i=0;i<p.count;i++){const v=vertices[i];assert.ok(v.every(Number.isFinite));assert.ok(v.every((x,k)=>x>=g.boundingBox.min.getComponent(k)-1e-7&&x<=g.boundingBox.max.getComponent(k)+1e-7));const normal=[0,1,2].map(k=>cn.array[i*3+k]*(1-bloom)+n.array[i*3+k]*bloom);assert.ok(Math.hypot(...normal)>.01);maxNormalError=Math.max(maxNormalError,Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1));}
   for(let i=0;i<idx.length;i+=3){const[a,b,d]=[idx[i],idx[i+1],idx[i+2]].map(j=>vertices[j]),u=b.map((x,k)=>x-a[k]),v=d.map((x,k)=>x-a[k]),area=Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])*.5;assert.ok(area>1e-9,'Degenerate seasonal triangle');minimumArea=Math.min(minimumArea,area);}
   const perHead=p.count/heads.length,profiles=heads.map((_,j)=>{const ys=vertices.slice(j*perHead,(j+1)*perHead).filter((_,i)=>petal.getX(j*perHead+i)>.5).map(v=>v[1]);return Math.max(...ys)-Math.min(...ys);});assert.ok(profiles.every(h=>h>.03),'Flower became a horizontal disc');samples.push({bloom,profiles});
  }
  assert.ok(maxNormalError<1e-5);rows.push({mobile,heads:heads.length,vertices:p.count,triangles:idx.length/3,bounds:{min:g.boundingBox.min.toArray(),max:g.boundingBox.max.toArray()},minimumArea,maxNormalError,samples});g.dispose();
 }
 await writeFile(out+'/geometry-cpu.json',JSON.stringify({scope:'Actual procedural flower factory: finite indexed geometry, open/closed/intermediate shapes in bounds, no degenerate triangles, valid normals and curved petal height profile;≤400 triangles per5-head clump. Not a production GPU/contact, art or performance claim.',heads,rows},null,2)+'\n');console.log(JSON.stringify({pass:true,rows}));
}finally{await server.close();}
