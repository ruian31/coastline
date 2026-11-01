import * as THREE from 'three';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import {getDaylightPreset,type DaylightId} from './Daylight';

import {sampleDaylight as sampleCycle,DAYLIGHT_KEYS} from './Daylight';

export function createDaylightCycle(renderer:THREE.WebGLRenderer){
 const maps=new Map<DaylightId,THREE.DataTexture>(),environments=new Map<DaylightId,THREE.WebGLRenderTarget>(),pending=new Map<DaylightId,Promise<void>>(),abort=new AbortController();
 let disposed=false,generation=0,lastUpdate=-Infinity;
 const data={sourceLoads:0,sourceBakes:0,updates:0,blendDraws:0,blendTriangles:0,sourceBakeDraws:0,sourceBakeTriangles:0,sourceBakeCpuMs:0,resident:[] as DaylightId[],peakResident:0};
 async function load(id:DaylightId){
  if(environments.has(id))return;if(pending.has(id))return pending.get(id)!;
  const promise=(async()=>{
   const p=getDaylightPreset(id),response=await fetch(import.meta.env.BASE_URL+'assets/environment/'+(p.asset?'daylight/'+p.asset+'.hdr':'sky-mobile.hdr'),{signal:abort.signal});if(!response.ok)throw new Error('Sky unavailable: '+id);
   const parsed=new HDRLoader().parse(await response.arrayBuffer());if(disposed)return;
   const texture=new THREE.DataTexture(parsed.data,parsed.width,parsed.height,THREE.RGBAFormat,parsed.type);texture.colorSpace=THREE.LinearSRGBColorSpace;texture.flipY=true;texture.wrapS=THREE.RepeatWrapping;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;
   texture.name='Cycle '+id+' HDR';maps.set(id,texture);data.sourceLoads++;
   try{const environment=bakeEnvironment(p,texture);environment.texture.name='Cycle '+id+' PMREM';environments.set(id,environment);data.sourceBakes++;}catch(error){maps.delete(id);texture.dispose();throw error;}
   data.peakResident=Math.max(data.peakResident,maps.size);data.resident=[...maps.keys()];
  })().finally(()=>pending.delete(id));pending.set(id,promise);return promise;
 }
 async function prepare(hour:number){
  const token=++generation,state=sampleCycle(hour),ids=new Set([state.a.id,state.b.id]);
  for(const id of ids){await load(id);if(disposed)return false;}
  if(token!==generation)return false;
  for(const [id,texture]of maps)if(!ids.has(id)){texture.dispose();maps.delete(id);environments.get(id)?.dispose();environments.delete(id);}
  data.resident=[...maps.keys()];lastUpdate=-Infinity;return true;
 }
 function has(hour:number){const state=sampleCycle(hour);return environments.has(state.a.id)&&environments.has(state.b.id);}
 async function prefetch(hour:number){const state=sampleCycle(hour),next=DAYLIGHT_KEYS[state.index+2]?.[1];if(next&&DAYLIGHT_KEYS[state.index+1][0]-state.hour<1)await load(next);}
 function trim(state:ReturnType<typeof sampleCycle>){const keep=new Set([state.a.id,state.b.id,DAYLIGHT_KEYS[state.index+2]?.[1]]);for(const[id,t]of maps)if(!keep.has(id)){t.dispose();maps.delete(id);environments.get(id)?.dispose();environments.delete(id);}data.resident=[...maps.keys()];}
 const target=new THREE.WebGLRenderTarget(1024,512,{type:THREE.HalfFloatType,depthBuffer:false,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter});
 target.texture.mapping=THREE.EquirectangularReflectionMapping;target.texture.wrapS=THREE.RepeatWrapping;
 const uniforms={mapA:{value:null as THREE.Texture|null},mapB:{value:null as THREE.Texture|null},phase:{value:0},yawA:{value:0},yawB:{value:0},sourceA:{value:new THREE.Vector2()},sourceB:{value:new THREE.Vector2()},elevationA:{value:0},elevationB:{value:0},gainA:{value:1},gainB:{value:1},sun:{value:new THREE.Vector3()},moon:{value:new THREE.Vector3()},sunColor:{value:new THREE.Color()},sunVisible:{value:0},moonVisible:{value:0}};
 const material=new THREE.ShaderMaterial({toneMapped:false,depthTest:false,depthWrite:false,uniforms,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`
  precision highp float;varying vec2 vUv;uniform sampler2D mapA,mapB;uniform float phase,yawA,yawB,elevationA,elevationB,gainA,gainB,sunVisible,moonVisible;uniform vec2 sourceA,sourceB;uniform vec3 sun,moon,sunColor;
  vec3 source(sampler2D tex,vec2 uv,vec2 peak,float elevation){
   // Smooth monotonic latitude remap keeps the horizon and zenith fixed while
   // moving the whole photographed light halo to the current solar altitude.
   if(uv.y>.5&&peak.y>.5){float q=(uv.y-.5)*2.,s=(peak.y-.5)*2.,t=max(.003,elevation/1.57079633),k=t*(1.-s)/max(.0001,s*(1.-t));uv.y=.5+.5*q/(k+(1.-k)*q);}
   uv=vec2(fract(uv.x),clamp(uv.y,.001,.999));vec3 c=texture2D(tex,uv).rgb;
   float dx=abs(uv.x-peak.x);dx=min(dx,1.-dx)*cos((peak.y-.5)*3.14159265);float d=length(vec2(dx,(uv.y-peak.y)*.5));
   // Remove the photographed source luminary before adding one moving disc.
   // The surrounding photographic cloud field remains the source of detail.
   if(d<.008){vec3 ring=vec3(0.);for(int i=0;i<8;i++){float angle=float(i)*.785398;vec2 offset=vec2(cos(angle)/max(.15,cos((peak.y-.5)*3.14159265)),sin(angle)*2.)*.008;ring+=texture2D(tex,vec2(fract(peak.x+offset.x),clamp(peak.y+offset.y,.001,.999))).rgb;}c=mix(ring*.125,c,smoothstep(.003,.008,d));}
   return c;
  }
  void main(){
   vec3 col=source(mapA,vec2(vUv.x-yawA,vUv.y),sourceA,elevationA)*gainA;
   if(phase>0.)col=mix(col,source(mapB,vec2(vUv.x-yawB,vUv.y),sourceB,elevationB)*gainB,phase);
   // Direct discs are drawn in the final view at its actual pixel resolution.
   gl_FragColor=vec4(max(col,vec3(0.)),1.);
  }`});
 // Own this triangle: the add-on FullScreenQuad shares a module-level
 // geometry, so disposing an old cycle would invalidate the new cycle's VAO.
 const quadCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1),quadGeometry=new THREE.BufferGeometry();
 quadGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,3,0,-1,-1,0,3,-1,0],3));quadGeometry.setAttribute('uv',new THREE.Float32BufferAttribute([0,2,0,0,2,0],2));
 const quad=new THREE.Mesh(quadGeometry,material);quad.frustumCulled=false;
 // A changing equirectangular RenderTarget cannot use Scene.background's
 // immutable equirect-to-cube cache. Sample the live radiance target directly.
 const backgroundMaterial=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,depthTest:false,fog:false,uniforms:{sky:{value:target.texture},sun:uniforms.sun,moon:uniforms.moon,sunColor:uniforms.sunColor,sunVisible:uniforms.sunVisible,moonVisible:uniforms.moonVisible},vertexShader:'varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*mat4(mat3(viewMatrix))*vec4(position,1.);gl_Position.z=gl_Position.w;}',fragmentShader:`
  varying vec3 vDirection;uniform sampler2D sky;uniform vec3 sun,moon,sunColor;uniform float sunVisible,moonVisible;
  void main(){vec3 d=normalize(vDirection);vec2 uv=vec2(atan(d.z,d.x)*.159154943+.5,asin(clamp(d.y,-1.,1.))*.318309886+.5);vec3 color=texture2D(sky,uv).rgb;
   float ds=dot(d,sun),dm=dot(d,moon),ss=max(1e-7,fwidth(ds)),ms=max(1e-7,fwidth(dm));
   float disc=smoothstep(cos(.0047)-ss,cos(.0047)+ss,ds),lunar=smoothstep(cos(.0047)-ms,cos(.0047)+ms,dm);
   color+=sunColor*(disc*14.+pow(max(0.,ds),1800.)*.35)*sunVisible;
   color+=vec3(.55,.68,1.)*(lunar*.65+pow(max(0.,dm),1800.)*.012)*moonVisible;
   gl_FragColor=vec4(color,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`});
 const geometry=new THREE.BoxGeometry(2,2,2),background=new THREE.Mesh(geometry,backgroundMaterial);background.name='Continuous photographic coastal sky';background.frustumCulled=false;background.renderOrder=-1000;
 const environmentMaterial=new THREE.ShaderMaterial({depthWrite:false,depthTest:false,toneMapped:false,uniforms:{a:{value:null as THREE.Texture|null},b:{value:null as THREE.Texture|null},blend:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'varying vec2 vUv;uniform sampler2D a,b;uniform float blend;void main(){gl_FragColor=mix(texture2D(a,vUv),texture2D(b,vUv),blend);}'}),environmentQuad=new THREE.Mesh(quadGeometry,environmentMaterial);
 let environment:THREE.WebGLRenderTarget|undefined;
 function bakeEnvironment(p:ReturnType<typeof getDaylightPreset>,texture:THREE.Texture){
  const previous=renderer.getRenderTarget(),autoReset=renderer.info.autoReset,generator=new THREE.PMREMGenerator(renderer),calls=renderer.info.render.calls,triangles=renderer.info.render.triangles,start=performance.now();
  try{
   const raw=new THREE.Vector3().fromArray(p.direction).applyAxisAngle(new THREE.Vector3(0,1,0),-p.rotation),az=Math.atan2(raw.z,raw.x);
   uniforms.mapA.value=uniforms.mapB.value=texture;uniforms.phase.value=0;uniforms.yawA.value=uniforms.yawB.value=((p.id==='night'?Math.PI:0)-az)/(Math.PI*2);
   uniforms.sourceA.value.set(az/(Math.PI*2)+.5,Math.asin(raw.y)/Math.PI+.5);uniforms.sourceB.value.copy(uniforms.sourceA.value);uniforms.elevationA.value=uniforms.elevationB.value=Math.asin(Math.max(0,raw.y));uniforms.gainA.value=uniforms.gainB.value=p.environment*p.gain;
   renderer.info.autoReset=false;renderer.setRenderTarget(target);renderer.render(quad,quadCamera);return generator.fromEquirectangular(target.texture);
  }finally{
   data.sourceBakeDraws+=Math.max(0,renderer.info.render.calls-calls);data.sourceBakeTriangles+=Math.max(0,renderer.info.render.triangles-triangles);data.sourceBakeCpuMs+=performance.now()-start;
   generator.dispose();renderer.setRenderTarget(previous);renderer.info.autoReset=autoReset;if(lastState&&has(lastState.hour))render(lastState.hour,lastUpdate,true,false);
  }
 }
 let lastState:ReturnType<typeof sampleCycle>|undefined;
 function render(hour:number,time=0,force=false,prune=true){
  if(!has(hour))throw new Error('Cycle pair not ready');
  const state=sampleCycle(hour),{a,b,sun,moon,blend}=state;lastState=state;
  uniforms.mapA.value=maps.get(a.id)!;uniforms.mapB.value=maps.get(b.id)!;uniforms.phase.value=a.id===b.id?0:blend;
  for(const [p,suffix]of [[a,'A'],[b,'B']] as const){
   // Preset dawn has already rotated its authored light direction by PI.
   const raw=new THREE.Vector3().fromArray(p.direction).applyAxisAngle(new THREE.Vector3(0,1,0),-p.rotation),sourceAz=Math.atan2(raw.z,raw.x),light=p.id==='night'?moon:sun;
   uniforms[('yaw'+suffix) as 'yawA'|'yawB'].value=(Math.atan2(light.z,light.x)-sourceAz)/(Math.PI*2);
   uniforms[('source'+suffix) as 'sourceA'|'sourceB'].value.set(sourceAz/(Math.PI*2)+.5,Math.asin(raw.y)/Math.PI+.5);
   uniforms[('elevation'+suffix) as 'elevationA'|'elevationB'].value=Math.asin(Math.max(0,light.y));
   uniforms[('gain'+suffix) as 'gainA'|'gainB'].value=p.sky*p.gain;
  }
  uniforms.sun.value.copy(sun);uniforms.moon.value.copy(moon);uniforms.sunColor.value.set(state.preset.sunColor);uniforms.sunVisible.value=THREE.MathUtils.smoothstep(sun.y,-.009,.03);uniforms.moonVisible.value=THREE.MathUtils.smoothstep(moon.y,-.009,.05);
  const previous=renderer.getRenderTarget(),autoReset=renderer.info.autoReset;
  try{
   if(force||time-lastUpdate>=.25){
    renderer.setRenderTarget(target);renderer.info.autoReset=false;renderer.render(quad,quadCamera);
    const ea=environments.get(a.id)!,eb=environments.get(b.id)!;
    if(a.id!==b.id){
     environment??=new THREE.WebGLRenderTarget(ea.width,ea.height,{type:THREE.HalfFloatType,depthBuffer:false});environment.texture.mapping=THREE.CubeUVReflectionMapping;
     environmentMaterial.uniforms.a.value=ea.texture;environmentMaterial.uniforms.b.value=eb.texture;environmentMaterial.uniforms.blend.value=blend;renderer.setRenderTarget(environment);renderer.render(environmentQuad,quadCamera);data.blendDraws++;data.blendTriangles++;
    }
    lastUpdate=time;data.updates++;data.blendDraws++;data.blendTriangles++;
   }
  }finally{renderer.setRenderTarget(previous);renderer.info.autoReset=autoReset;}
  if(prune)trim(state);return{state,texture:target.texture,environment:a.id===b.id?environments.get(a.id)!.texture:environment!.texture,environmentRotation:-Math.atan2(sun.z,sun.x)};
 }
 return{render,prepare,prefetch,has,background,diagnostics:data,beginFrame(){data.blendDraws=data.blendTriangles=0;},dispose(){if(disposed)return;disposed=true;abort.abort();background.removeFromParent();geometry.dispose();backgroundMaterial.dispose();quadGeometry.dispose();material.dispose();environmentMaterial.dispose();environment?.dispose();target.dispose();for(const t of maps.values())t.dispose();for(const e of environments.values())e.dispose();maps.clear();environments.clear();}};
}
