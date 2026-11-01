import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import * as THREE from 'three';
const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',logLevel:'error'});
try{
 const {sampleDaylight,advanceDaylightHour,DAYLIGHT_KEYS,wrapDaylightHour,formatDaylightHour}=await server.ssrLoadModule('/src/world/Daylight.ts'),rows=[];
 for(const [hour,clock]of[[6+10/60,'06:10'],[18.7,'18:42'],[23.99999,'23:59'],[24,'00:00'],[-1,'23:00']])assert.equal(formatDaylightHour(hour),clock);
 assert.ok(Math.abs(advanceDaylightHour(18.7,1800,true)-18.7)<1e-12);assert.ok(Math.abs(advanceDaylightHour(23.9,15,true)-.1)<1e-12);
 assert.equal(advanceDaylightHour(18.7,60,false),18.7);assert.equal(advanceDaylightHour(2,NaN,true),2);assert.equal(advanceDaylightHour(2,-1,true),2);
 assert.throws(()=>sampleDaylight(NaN));assert.throws(()=>sampleDaylight(Infinity));assert.equal(wrapDaylightHour(-1),23);
 for(let i=0;i<=2880;i++){
  const s=sampleDaylight(i/120);assert.ok(s.blend>=0&&s.blend<=1);assert.ok(Math.abs(s.sun.length()-1)<1e-12);assert.ok(Math.abs(s.sun.dot(s.moon)+1)<1e-12);
  assert.ok(s.preset.direction[1]>=-1e-12);assert.ok(s.preset.sunIntensity>=0&&s.preset.sunIntensity<3);assert.ok(s.preset.glitter.every(Number.isFinite));
  for(const key of['sunColor','hemiSky','hemiGround','fog','waterHorizon'])assert.ok(new THREE.Color(s.preset[key]).toArray().every(v=>Number.isFinite(v)&&v>=0&&v<=1));
 }
 for(const hour of[0,6,19,...DAYLIGHT_KEYS.map(k=>k[0])]){
  const a=sampleDaylight(hour-1e-7),b=sampleDaylight(hour+1e-7),pa=a.preset,pb=b.preset;
  const radianceA=new THREE.Vector3().fromArray(pa.direction).multiplyScalar(pa.sunIntensity),radianceB=new THREE.Vector3().fromArray(pb.direction).multiplyScalar(pb.sunIntensity),directJump=radianceA.distanceTo(radianceB);
  assert.ok(directJump<1e-5,`${hour}: light discontinuity ${directJump}`);assert.ok(a.sun.distanceTo(b.sun)<1e-6);
  for(const key of['sunColor','hemiSky','hemiGround','fog','waterHorizon'])assert.ok(new THREE.Color(pa[key]).toArray().every((v,i)=>Math.abs(v-new THREE.Color(pb[key]).toArray()[i])<1e-6));
  assert.ok(Math.abs(pa.waterLight-pb.waterLight)<1e-6);assert.ok(pa.glitter.every((v,i)=>Math.abs(v-pb.glitter[i])<1e-5));rows.push({hour,directJump,sunJump:a.sun.distanceTo(b.sun)});
 }
 const report={scope:'Pure authoritative time/radiance model: 2881 samples, real30min/full-day scale, wrap and inactive clock, finite state, solar/lunar unit vectors and opposite directions, boundary color/water/glitter/direct-light continuity. Not browser/render/phone evidence.',rows};
 await mkdir('artifacts/daynight-m76',{recursive:true});await writeFile('artifacts/daynight-m76/timeline-cpu.json',JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{await server.close();}
