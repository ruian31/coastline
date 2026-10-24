import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try{
 const {createVegetationInteraction}=await server.ssrLoadModule('/src/world/VegetationInteraction.ts'),field=createVegetationInteraction(()=>0),shader={uniforms:{},vertexShader:''};field.setupShader(shader);
 const texture=shader.uniforms.uPlantPressure.value,origin=shader.uniforms.uPlantOrigin.value,car=new THREE.Object3D(),contacts=[[-.8,-1.2],[.8,-1.2],[-.8,1.2],[.8,1.2]].map(([x,z])=>new THREE.Vector3(x,0,z));
 const update=(time,x,z,yaw=0)=>{car.position.set(x,0,z);car.rotation.y=yaw;car.updateMatrixWorld(true);field.update(time,car,contacts);};
 const sample=(x,z)=>{const col=Math.floor(x/.2)-origin.x,row=Math.floor(z/.2)-origin.y;if(col<0||row<0||col>=256||row>=256)return null;const i=(row*256+col)*4;return Array.from(texture.image.data.slice(i,i+4));};
 const strongest=(x,z)=>{let best=[0,0,0,0];for(const dx of[-.1,0,.1])for(const dz of[-.1,0,.1]){const s=sample(x+dx,z+dz);if(s&&s[0]>best[0])best=s;}return best;};
 update(1,0,0);const fresh=strongest(-.8,-1.2);assert.ok(fresh[0]>204);assert.equal(fresh[2]+fresh[3]*256,10);
 for(let n=1;n<=12;n++)update(1+n*.1,0,n*.1);
 for(const side of[-.8,.8])for(const range of [[-1.1,-.1],[1.3,2.3]])for(let z=range[0];z<=range[1];z+=.2)assert.ok(strongest(side,z)[0]>170,'each axle must leave a continuous swept tyre path');
 const old=strongest(-.8,-1.2);assert.ok(old[0]>204&&old[2]+old[3]*256<16,'later soft body sweep must not replace the old deep tyre mark');
 for(let n=1;n<=8;n++)update(2.2+n*.1,0,1.2-n*.1);
 const reverse=sample(-.9,1.9);assert.ok(Math.abs(reverse[1]-128)<3,'reverse travel must lay grass backwards '+JSON.stringify(reverse));
 update(4,0,2,Math.PI/2);assert.ok(strongest(1.2,2.8)[0]>204,'wheel contacts follow actual vehicle rotation');
 update(10,80,0);assert.ok(field.diagnostics.teleports>0);assert.equal(sample(30,0),null);
 update(12,0,5);assert.deepEqual(strongest(-.8,-1.2),old,'recent world marks survive leaving and returning to the GPU window');assert.equal(strongest(15,5)[0],0,'teleports must not stamp a connecting stripe');
 update(80,80,0);update(81,0,5);assert.equal(strongest(-.8,-1.2)[0],0,'expired cached marks must not reappear');
 update(6554,0,5);assert.equal(strongest(-.8,-1.2)[0],0,'timestamp wrap must not resurrect old marks');
 update(6552,0,0);const nearWrap=strongest(-.8,-1.2);update(6552.2,80,0);update(6554,0,5);assert.deepEqual(strongest(-.8,-1.2),nearWrap,'fresh marks must survive a timestamp boundary and a window detour');
 const version=texture.version;field.update(6554,car,contacts);assert.equal(texture.version,version,'frozen time and pose must not upload again');
 let disposed=0;texture.addEventListener('dispose',()=>disposed++);field.dispose();field.dispose();assert.equal(disposed,1);
 const slope=createVegetationInteraction((x,z)=>x*.2+z*.55),slopeShader={uniforms:{},vertexShader:''};slope.setupShader(slopeShader);car.position.set(0,0,0);car.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(-.2,1,-.55).normalize());car.updateMatrixWorld(true);slope.update(1,car,contacts);
 const slopeTexture=slopeShader.uniforms.uPlantPressure.value,slopeOrigin=slopeShader.uniforms.uPlantOrigin.value,front=new THREE.Vector3(0,0,2).applyMatrix4(car.matrixWorld),col=Math.floor(front.x/.2)-slopeOrigin.x,row=Math.floor(front.z/.2)-slopeOrigin.y;
 assert.ok(Math.abs(front.y)>.65);assert.ok(slopeTexture.image.data[(row*256+col)*4]>20,'belly sweep must follow the pitched/rolled car support plane');slope.dispose();
 console.log(JSON.stringify({ok:true,checks:'swept tyre continuity, reverse and rotated contacts, softer body protection, cached world marks, no teleport stripe, expiry, stale/fresh timestamp wrap, pitched/rolled support plane, frozen upload and idempotent disposal',diagnostics:field.diagnostics}));
}finally{await server.close();}
