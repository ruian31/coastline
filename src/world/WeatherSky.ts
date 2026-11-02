import * as THREE from 'three';
import type {WeatherValues} from './Weather';

export type WeatherSkyInput={sky:THREE.Texture;skyGain:number;skyRotation:number;environment:THREE.Texture;environmentGain:number;fog:THREE.Color;sun:THREE.Vector3;moon:THREE.Vector3;sunColor:THREE.Color;discs:boolean;sunVisible:number;moonVisible:number};
const vertex='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';

/** Weather is composed in linear radiance. It borrows the active daylight sky
 * and PMREM; it never regenerates or owns either one. Clear skies bypass all
 * weather resources and passes, including on the first visit. */
export function createWeatherSky(renderer:THREE.WebGLRenderer,mobile=false){
 let resources:ReturnType<typeof createResources>|undefined,disposed=false,lastTime=-Infinity,lastSky:THREE.Texture|undefined,lastEnvironment:THREE.Texture|undefined;
 const diagnostics={updates:0,draws:0,triangles:0,active:false};
 function createResources(){
  const target=new THREE.WebGLRenderTarget(mobile?512:1024,mobile?256:512,{type:THREE.HalfFloatType,depthBuffer:false,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter});target.texture.mapping=THREE.EquirectangularReflectionMapping;target.texture.wrapS=THREE.RepeatWrapping;
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,3,0,-1,-1,0,3,-1,0],3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute([0,2,0,0,2,0],2));
  const uniforms={source:{value:null as THREE.Texture|null},gain:{value:1},yaw:{value:0},cloud:{value:0},mist:{value:0},time:{value:0},fogColor:{value:new THREE.Color()}};
  const material=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,uniforms,vertexShader:vertex,fragmentShader:`
   precision highp float;varying vec2 vUv;uniform sampler2D source;uniform float gain,yaw,cloud,mist,time;uniform vec3 fogColor;
   float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
   float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
   float fbm(vec3 p){return noise(p)*.57+noise(p*2.03)*.28+noise(p*4.07)*.15;}
   void main(){
    float az=(vUv.x-.5)*6.283185307,el=(vUv.y-.5)*3.141592654;vec3 d=vec3(cos(el)*cos(az),sin(el),cos(el)*sin(az));
    vec3 base=texture2D(source,vec2(vUv.x-yaw,clamp(vUv.y,.001,.999))).rgb*gain;
    // Thick cloud has finite transmission even over the HDR photograph's
    // extremely bright old solar core. Merely crossfading leaves a hot sun.
    base=mix(base,min(base,fogColor*1.7+vec3(.01)),cloud*cloud);
    // A direction-space field has no longitude seam or pinched UV pole.
    float n=fbm(d*4.2+vec3(time*.0018,0.,time*.0011)),upper=smoothstep(-.09,.2,d.y);
    float body=smoothstep(.3,.68,n),cover=cloud*(.76+body*.24)*(.82+.18*upper);
    vec3 cloudy=fogColor*(.76+.35*body+.16*max(d.y,0.));
    vec3 col=mix(base,cloudy,cover);float haze=mist*(.68+.28*(1.-smoothstep(0.,.45,abs(d.y))));
    gl_FragColor=vec4(max(mix(col,fogColor,haze),vec3(0.)),1.);
   }`});
  const camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1),quad=new THREE.Mesh(geometry,material);quad.frustumCulled=false;
  const environmentMaterial=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,vertexShader:vertex,uniforms:{source:{value:null as THREE.Texture|null},gain:{value:1},amount:{value:0},peakLimit:{value:0},fogColor:uniforms.fogColor},fragmentShader:'varying vec2 vUv;uniform sampler2D source;uniform float gain,amount,peakLimit;uniform vec3 fogColor;void main(){vec3 base=texture2D(source,vUv).rgb*gain;base=mix(base,min(base,fogColor*1.7+vec3(.01)),peakLimit);gl_FragColor=vec4(mix(base,fogColor*.85,amount),1.);}'});
  const environmentQuad=new THREE.Mesh(geometry,environmentMaterial);environmentQuad.frustumCulled=false;
  const backgroundMaterial=new THREE.ShaderMaterial({side:THREE.BackSide,depthTest:false,depthWrite:false,fog:false,uniforms:{sky:{value:target.texture},sun:{value:new THREE.Vector3()},moon:{value:new THREE.Vector3()},sunColor:{value:new THREE.Color()},sunVisible:{value:0},moonVisible:{value:0}},vertexShader:'varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*mat4(mat3(viewMatrix))*vec4(position,1.);gl_Position.z=gl_Position.w;}',fragmentShader:`
   varying vec3 vDirection;uniform sampler2D sky;uniform vec3 sun,moon,sunColor;uniform float sunVisible,moonVisible;
   void main(){vec3 d=normalize(vDirection);vec2 uv=vec2(atan(d.z,d.x)*.159154943+.5,asin(clamp(d.y,-1.,1.))*.318309886+.5);vec3 col=texture2D(sky,uv).rgb;
    float ds=dot(d,sun),dm=dot(d,moon),ss=max(1e-7,fwidth(ds)),ms=max(1e-7,fwidth(dm));col+=sunColor*(smoothstep(cos(.0047)-ss,cos(.0047)+ss,ds)*14.+pow(max(0.,ds),1800.)*.35)*sunVisible;col+=vec3(.55,.68,1.)*(smoothstep(cos(.0047)-ms,cos(.0047)+ms,dm)*.65+pow(max(0.,dm),1800.)*.012)*moonVisible;
    gl_FragColor=vec4(col,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`});
  const box=new THREE.BoxGeometry(2,2,2),background=new THREE.Mesh(box,backgroundMaterial);background.name='Coastal weather sky';background.renderOrder=-1000;background.frustumCulled=false;
  return{target,geometry,material,camera,quad,uniforms,environmentMaterial,environmentQuad,environment:undefined as THREE.WebGLRenderTarget|undefined,box,backgroundMaterial,background};
 }
 return{diagnostics,beginFrame(){diagnostics.draws=diagnostics.triangles=0;},
  render(input:WeatherSkyInput,state:WeatherValues,time:number,force=false){
   if(disposed)throw Error('Weather sky disposed');diagnostics.active=state.cloud>1e-6||state.mist>1e-6;
   if(!diagnostics.active){if(resources)resources.background.visible=false;return null;}
   const r=resources??=createResources(),u=r.uniforms;r.background.visible=true;
   u.source.value=input.sky;u.gain.value=input.skyGain;u.yaw.value=input.skyRotation/(Math.PI*2);u.cloud.value=state.cloud;u.mist.value=state.mist;u.time.value=time;u.fogColor.value.copy(input.fog);
   const bg=r.backgroundMaterial.uniforms;bg.sun.value.copy(input.sun);bg.moon.value.copy(input.moon);bg.sunColor.value.copy(input.sunColor);bg.sunVisible.value=input.discs?input.sunVisible*(1-state.cloud*.96)*(1-state.mist):0;bg.moonVisible.value=input.discs?input.moonVisible*(1-state.cloud*.96)*(1-state.mist):0;
   const changed=input.sky!==lastSky||input.environment!==lastEnvironment;
   if(force||changed||time-lastTime>=.25){
    const image=input.environment.image as {width:number;height:number};if(!image||!Number.isFinite(image.width)||!Number.isFinite(image.height))throw Error('Weather needs a ready CubeUV environment');if(!r.environment||r.environment.width!==image.width||r.environment.height!==image.height){r.environment?.dispose();r.environment=new THREE.WebGLRenderTarget(image.width,image.height,{type:THREE.HalfFloatType,depthBuffer:false});r.environment.texture.mapping=THREE.CubeUVReflectionMapping;}
    const e=r.environmentMaterial.uniforms;e.source.value=input.environment;e.gain.value=input.environmentGain;e.peakLimit.value=state.cloud*state.cloud;e.amount.value=Math.min(.96,state.cloud*.72+state.mist*.24);
    const previous=renderer.getRenderTarget(),reset=renderer.info.autoReset;
    try{renderer.info.autoReset=false;renderer.setRenderTarget(r.target);renderer.render(r.quad,r.camera);renderer.setRenderTarget(r.environment);renderer.render(r.environmentQuad,r.camera);diagnostics.draws+=2;diagnostics.triangles+=2;diagnostics.updates++;lastTime=time;lastSky=input.sky;lastEnvironment=input.environment;}
    finally{renderer.setRenderTarget(previous);renderer.info.autoReset=reset;}
   }
   return{sky:r.target.texture,environment:r.environment!.texture,background:r.background};
  },dispose(){if(disposed)return;disposed=true;const r=resources;if(!r)return;r.background.removeFromParent();r.box.dispose();r.geometry.dispose();r.material.dispose();r.environmentMaterial.dispose();r.backgroundMaterial.dispose();r.target.dispose();r.environment?.dispose();resources=undefined;}
 };
}
