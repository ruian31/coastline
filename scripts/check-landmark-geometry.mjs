// Canonical triangle/attribute/transform signatures ignore mesh partitioning.
// Compare baseline and candidate reports; this is not a visual or FPS test.
import assert from 'node:assert/strict';import {chromium,devices} from 'playwright';import {mkdir,writeFile} from 'node:fs/promises';
const label=process.env.LANDMARK_LABEL;assert.match(label??'',/^[a-z0-9-]+$/);const out='artifacts/landmark-geometry-'+label;await mkdir(out);
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu','--use-gl=angle','--use-angle=gl']}),samples=[],errors=[];
try{for(const mobile of[false,true]){
 const page=await browser.newPage({...mobile?devices['Pixel 7']:{},viewport:mobile?{width:844,height:390}:{width:1280,height:720}});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));window.landmarkObjects=[];window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',e=>landmarkObjects.push(e.detail));});
 await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:5190')+'/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__.setState('town'));
 const report=await page.evaluate(async()=>{
  const scene=landmarkObjects.find(o=>o.isScene&&o.getObjectByName('Coastal destinations')),root=scene.getObjectByName('Coastal destinations'),roles=new Map();root.updateWorldMatrix(true,true);
  root.traverse(mesh=>{if(!mesh.isMesh)return;const material=mesh.material,g=mesh.geometry,key=JSON.stringify([material.name,material.type,material.color.toArray(),material.roughness,material.metalness,Boolean(material.map),material.side]),role=roles.get(key)??{triangles:[],meshes:0},attributes=Object.entries(g.attributes).sort(([a],[b])=>a.localeCompare(b));
   const bits=attributes.map(([name,a])=>{if(!(a.array instanceof Float32Array))throw Error('Unexpected landmark attribute storage');return{name,size:a.itemSize,normalized:a.normalized,bits:new Uint32Array(a.array.buffer,a.array.byteOffset,a.array.length)};});
   const prefix=JSON.stringify([mesh.matrixWorld.toArray(),bits.map(a=>[a.name,a.size,a.normalized])]),count=g.index?.count??g.attributes.position.count;
   for(let i=0;i<count;i+=3){const row=[];for(let j=0;j<3;j++){const vertex=g.index?g.index.getX(i+j):i+j;for(const a of bits)for(let c=0;c<a.size;c++)row.push(a.bits[vertex*a.size+c]);}role.triangles.push(prefix+'|'+row.join(','));}
   role.meshes++;roles.set(key,role);
  });
  const signatures=[];for(const [role,data]of roles){data.triangles.sort();const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(data.triangles.join('\n')));signatures.push({role,triangles:data.triangles.length,sha256:Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join(''),meshes:data.meshes});}
  signatures.sort((a,b)=>a.role.localeCompare(b.role));return{signatures,triangles:signatures.reduce((n,r)=>n+r.triangles,0),tunnel:root.userData.tunnel,diagnostics:root.userData.diagnostics};
 });samples.push({mobile,bundle:await page.locator('script[type=module][src]').getAttribute('src'),...report});await page.close();
}assert.deepEqual(errors,[]);await writeFile(out+'/result.json',JSON.stringify({method:'All destination triangle attribute bits and full world transforms sorted per unchanged material role, SHA-256; ignores only mesh grouping/order',samples,errors},null,2));console.log(JSON.stringify({out,samples:samples.map(s=>({mobile:s.mobile,triangles:s.triangles,roles:s.signatures.length,meshes:s.diagnostics.draws})),errors}));
}finally{await browser.close();}
