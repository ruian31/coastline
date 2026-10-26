// Exercise the real scenery culler across each grass transition. Fixed authored
// plants must retain their body while close sprigs enter/leave the detail pool.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const label=process.env.APPROACH_LABEL;assert.match(label??'',/^[a-z0-9-]+$/);
const out=`artifacts/grass-approach-${label}`;await mkdir(out);
const html=`<!doctype html><link rel="icon" href="data:,"><script type="module">
import * as T from 'three';import {createScenery} from '/src/world/Scenery.ts';
window.probe=async mobile=>{
 const scene=new T.Scene(),scenery=createScenery(scene,mobile),samples=[];
 try{await scenery.ready;const root=scene.getObjectByName('Coastal landscape');if(!root.userData.fineGrass.ready)throw Error('Fine grass required');
 const key=m=>Array.from(new Float32Array(m.elements),v=>v.toFixed(4)).join(',');
 const has=(mesh,wanted)=>{const matrix=new T.Matrix4();for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);if(key(matrix)===wanted)return true;}return false;};
 for(const low of[false,true])for(const field of[false,true]){
  scenery.setLowDetail(low);const body=root.getObjectByName(field?'Dry inland patch grass clusters':'Layered wind moving grass clusters'),matrix=body.userData.authoredInstances[0],wanted=key(matrix),rootPoint=new T.Vector3().setFromMatrixPosition(matrix),near=[0,1,2].map(i=>root.getObjectByName((field?'Photographed dry inland grass ':'Photographed low coastal grass ')+i)),camera=new T.PerspectiveCamera(50,16/9,.05,300),path=[];
  for(const distance of[38,34,30,26,24,22,20,18,16,14,12,10,8,6,4,2]){
   camera.position.copy(rootPoint).add(new T.Vector3(0,1,distance));camera.lookAt(rootPoint.clone().add(new T.Vector3(0,.3,0)));camera.updateMatrixWorld();scenery.cullForCamera(camera);
   path.push({distance,body:has(body,wanted),detail:near.some(mesh=>has(mesh,wanted))});
  }
  samples.push({field,low,path});
 }return{mobile,samples};}finally{scenery.dispose();}
};window.probeReady=true;</script>`;
await writeFile('work/grass-approach-probe.html',html);
const browser=await chromium.launch({channel:'chrome'}),samples=[],errors=[];
try{for(const mobile of[false,true]){
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto((process.env.TEST_BASE_URL??'http://127.0.0.1:5188')+'/work/grass-approach-probe.html');await page.waitForFunction(()=>window.probeReady);samples.push(await page.evaluate(mobile=>window.probe(mobile),mobile));await page.close();
}await writeFile(out+'/result.json',JSON.stringify({method:'Actual source createScenery/cullForCamera, full and low prefixes, fixed authored plant and original matrices across 38m to 2m; source factory check, no FPS measurement',samples,errors},null,2));
assert.deepEqual(errors,[]);for(const config of samples)for(const test of config.samples){assert.ok(test.path.every(p=>p.body),'a grass body must not vanish at detail transitions');assert.ok(test.path.some(p=>p.detail),'close detail must actually enter');assert.ok(test.path.some(p=>!p.detail),'the path must also cover the distant state');}console.log(JSON.stringify({out,configurations:samples.reduce((n,c)=>n+c.samples.length,0),samples:samples.reduce((n,c)=>n+c.samples.reduce((n,p)=>n+p.path.length,0),0),errors}));
}finally{await browser.close();}
