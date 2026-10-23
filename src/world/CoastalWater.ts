import * as THREE from 'three';

export const SEA_LEVEL=-1.5;
const FIELD_WIDTH=1060,FIELD_DEPTH=940,HEIGHT_MIN=-8,HEIGHT_RANGE=80,SHORE_RANGE=32;

/** Actual ground heights and signed distance from their waterline; no ellipse approximation. */
export function buildShoreField(sample:(x:number,z:number)=>number,size:number,solidFloor?:((x:number,z:number)=>number)){
 if(!Number.isInteger(size)||size<3)throw Error('Shore field requires at least three samples per axis');
 const heights=new Float32Array(size*size),distance=new Float32Array(size*size).fill(Infinity),data=new Uint8Array(size*size*4);
 const dx=FIELD_WIDTH/(size-1),dz=FIELD_DEPTH/(size-1),diagonal=Math.hypot(dx,dz);
 const floor=solidFloor?new Float32Array(size*size):heights;
 for(let z=0;z<size;z++)for(let x=0;x<size;x++){const px=x*dx-FIELD_WIDTH/2,pz=z*dz-FIELD_DEPTH/2,h=sample(px,pz),base=solidFloor?solidFloor(px,pz):h;if(!Number.isFinite(h)||!Number.isFinite(base))throw Error('Non-finite shoreline height');heights[z*size+x]=h;if(solidFloor)floor[z*size+x]=base;}
 const seed=(i:number,j:number,step:number)=>{const h=heights[i],other=heights[j];if((h>=SEA_LEVEL)!==(other>=SEA_LEVEL))distance[i]=Math.min(distance[i],Math.abs(h-SEA_LEVEL)/Math.abs(h-other)*step);};
 for(let z=0;z<size;z++)for(let x=0;x<size;x++){
  const i=z*size+x;if(x)seed(i,i-1,dx);if(x<size-1)seed(i,i+1,dx);if(z)seed(i,i-size,dz);if(z<size-1)seed(i,i+size,dz);
  if(Number.isFinite(distance[i])){const left=Math.max(0,x-1),right=Math.min(size-1,x+1),back=Math.max(0,z-1),front=Math.min(size-1,z+1),gx=(heights[z*size+right]-heights[z*size+left])/((right-left)*dx),gz=(heights[front*size+x]-heights[back*size+x])/((front-back)*dz);distance[i]=Math.min(distance[i],Math.abs(heights[i]-SEA_LEVEL)/Math.max(Math.hypot(gx,gz),1e-6));}
 }
 // Two chamfer passes are linear in map size and retain sub-cell waterline seeds.
 for(let z=0;z<size;z++)for(let x=0;x<size;x++){
  const i=z*size+x;let d=distance[i];if(x)d=Math.min(d,distance[i-1]+dx);if(z)d=Math.min(d,distance[i-size]+dz);if(x&&z)d=Math.min(d,distance[i-size-1]+diagonal);if(z&&x<size-1)d=Math.min(d,distance[i-size+1]+diagonal);distance[i]=d;
 }
 for(let z=size-1;z>=0;z--)for(let x=size-1;x>=0;x--){
  const i=z*size+x;let d=distance[i];if(x<size-1)d=Math.min(d,distance[i+1]+dx);if(z<size-1)d=Math.min(d,distance[i+size]+dz);if(x<size-1&&z<size-1)d=Math.min(d,distance[i+size+1]+diagonal);if(x&&z<size-1)d=Math.min(d,distance[i+size-1]+diagonal);distance[i]=d;
 }
 for(let z=0;z<size;z++)for(let x=0;x<size;x++){
  const i=z*size+x,h=heights[i],encoded=Math.round(THREE.MathUtils.clamp((h-HEIGHT_MIN)/HEIGHT_RANGE,0,1)*65535);
  data[i*4]=encoded>>8;data[i*4+1]=encoded&255;data[i*4+2]=Math.round((1+(h>=SEA_LEVEL?1:-1)*Math.min(SHORE_RANGE,distance[i])/SHORE_RANGE)*127.5);
  let minimum=floor[i];for(let oz=-1;oz<=1;oz++)for(let ox=-1;ox<=1;ox++)minimum=Math.min(minimum,floor[THREE.MathUtils.clamp(z+oz,0,size-1)*size+THREE.MathUtils.clamp(x+ox,0,size-1)]);
  data[i*4+3]=minimum>.25?255:0;
 }
 return{data,size,heights,distance};
}

const shoreGLSL=`
uniform sampler2D uShoreField;uniform vec2 uShoreTexel,uShorePatchCenter;uniform float uShoreReady,uShoreTime,uShoreHarmonic;
vec4 coastField(vec2 p){vec2 uv=(p+vec2(530.0,470.0))/vec2(1060.0,940.0);if(uShoreReady<.5||min(uv.x,uv.y)<0.0||max(uv.x,uv.y)>1.0)return vec4(0.0);return texture2D(uShoreField,uv*(1.0-uShoreTexel)+uShoreTexel*.5);}
float coastHeight(vec4 field){return dot(field.rg,vec2(65280.0,255.0))/65535.0*80.0-8.0;}
float coastDistance(vec4 field){return field.b*64.0-32.0;}
float coastPhase(vec2 p,float distance,float t){return distance*.78-t*.78+sin(dot(p,vec2(.023,.019)))*.45;}
float coastPatch(vec2 p){vec2 edge=vec2(128.0)-abs(p-uShorePatchCenter);return smoothstep(0.0,24.0,min(edge.x,edge.y));}
float coastWave(vec2 p,float distance,float t){float phase=coastPhase(p,distance,t),fade=(1.0-smoothstep(10.0,30.0,abs(distance)))*coastPatch(p);return -1.5+(.27*sin(phase)+uShoreHarmonic*sin(phase*2.0-.4))*fade;}
`;

/** A flat far sea plus a real, local wave mesh; shared wet-shore uniforms. */
export function createCoastalWater(scene:THREE.Scene,mobile:boolean,time:{value:number},sun:THREE.Vector3){
 let disposed=false,fieldTexture=new THREE.DataTexture(new Uint8Array(4),1,1),ready=false;
 const field={value:fieldTexture},texel={value:new THREE.Vector2(1,1)},hasField={value:0},sky={value:null as THREE.Texture|null},hasSky={value:0},patchCenter={value:new THREE.Vector2()};
 const uniforms={uShoreField:field,uShoreTexel:texel,uShoreReady:hasField,uShoreTime:time,uShorePatchCenter:patchCenter,uShoreHarmonic:{value:mobile?0:.035}};
 fieldTexture.needsUpdate=true;
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:true,defines:{WATER_PATCH:0},uniforms:{...uniforms,uSun:{value:sun},uSkyMap:sky,uHasSky:hasSky},
  vertexShader:`${shoreGLSL}
   varying vec3 vWaterPlane;void main(){vec4 p=modelMatrix*vec4(position,1.0);
   #if WATER_PATCH == 1
   p.y=coastWave(p.xz,coastDistance(coastField(p.xz)),uShoreTime);
   #endif
   vWaterPlane=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`,
  fragmentShader:`${shoreGLSL}
   uniform sampler2D uSkyMap;uniform float uHasSky;uniform vec3 uSun;varying vec3 vWaterPlane;
   float waterHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float waterNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(waterHash(i),waterHash(i+vec2(1,0)),f.x),mix(waterHash(i+vec2(0,1)),waterHash(i+1.0),f.x),f.y);}
   void main(){
    vec3 world=vWaterPlane;vec2 p=world.xz;vec4 ground=coastField(p);if(ground.a>.99)discard;
    float distance=coastDistance(ground);vec2 patchEdge=vec2(128.0)-abs(p-uShorePatchCenter);
    bool inPatch=min(patchEdge.x,patchEdge.y)>0.0&&abs(distance)<31.5&&uShoreReady>.5;
    #if WATER_PATCH == 1
    if(!inPatch)discard;
    #else
    if(inPatch)discard;
    #endif
    float depth=max(0.0,world.y-coastHeight(ground)),t=uShoreTime;
    vec2 stepWorld=vec2(1060.0,940.0)*uShoreTexel;
    vec2 gradient=vec2(coastDistance(coastField(p+vec2(stepWorld.x,0.0)))-distance,coastDistance(coastField(p+vec2(0.0,stepWorld.y)))-distance)/stepWorld;
    float phase=coastPhase(p,distance,t),amplitude=(1.0-smoothstep(10.0,30.0,abs(distance)))*coastPatch(p);
    vec2 slope=gradient*(.27*cos(phase)+uShoreHarmonic*2.0*cos(phase*2.0-.4))*.78*amplitude;
    float warp=waterNoise(p*.025+t*.012)*6.0,w1=sin(p.x*.17+p.y*.11-t*.73+warp),w2=sin(p.x*-.13+p.y*.23+t*.51+warp*.71);
    float footprint=max(length(dFdx(p)),length(dFdy(p))),rippleFilter=1.0/(1.0+footprint*.6),w3=sin(p.x*.51-p.y*.39-t*1.13+warp*.8)*rippleFilter;
    vec2 fine=(vec2(waterNoise(p*.76+vec2(t*.10,-t*.07)),waterNoise(p.yx*.63+vec2(18.3-t*.08,9.7+t*.11)))-.5)*rippleFilter;
    vec3 normal=normalize(vec3(-slope.x+w1*.022+w2*.011+w3*.018+fine.x*.055,1.0,-slope.y+w2*.024-w1*.012-w3*.014+fine.y*.050));
    vec3 view=normalize(cameraPosition-world);float fresnel=pow(1.0-max(dot(normal,view),0.0),4.0);
    float opticalDepth=max(depth,max(0.0,-distance)*.13);
    vec3 water=mix(vec3(.008,.038,.057),vec3(.022,.115,.108),exp(-opticalDepth*.65)),reflection=vec3(.18,.23,.31);
    if(uHasSky>.5){vec3 reflected=reflect(-view,normal);vec2 uv=vec2(atan(reflected.z,reflected.x)*.159154943+.5,asin(clamp(reflected.y,-1.0,1.0))*.318309886+.5);reflection=min(texture2D(uSkyMap,uv).rgb,vec3(6.0))*.28;}
    vec3 color=mix(water,reflection,.025+fresnel*.88),halfway=normalize(view+uSun);
    float glitter=pow(max(dot(normal,halfway),0.0),220.0)*(.45+waterNoise(p*1.1+t*.14)*.55);color+=vec3(2.5,1.35,.49)*glitter;
    color+=vec3(.025,.035,.038)*(waterNoise(p*.31+warp*.05)-.5);
    float edge=1.0-smoothstep(.02,.55,depth),bubbles=smoothstep(.25,.7,waterNoise(p*2.7+vec2(t*.1,-t*.06)));
    float foam=edge*(.34+.66*bubbles)*(1.0-smoothstep(2.0,5.0,abs(distance)));
    foam+=exp(-depth*1.6)*pow(max(0.0,sin(phase)),8.0)*bubbles*.12;
    color=mix(color,vec3(.69,.71,.65),clamp(foam*.78,0.0,.8));
    float viewDistance=length(cameraPosition.xz-p);color=mix(color,vec3(.51,.32,.28),smoothstep(650.0,3800.0,viewDistance)*.72);
    float alpha=max(1.0-exp(-max(opticalDepth,.02)*1.8),fresnel*.8);alpha=mix(alpha,1.0,foam*.8);
    gl_FragColor=vec4(color,alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`,
 });
 const geometry=new THREE.PlaneGeometry(9000,9000),ocean=new THREE.Mesh(geometry,material);ocean.name='Sea / advancing shore wash and moving sunset reflections';ocean.rotation.x=-Math.PI/2;ocean.position.y=SEA_LEVEL;ocean.renderOrder=-5;scene.add(ocean);
 const cells=mobile?144:192,patchGeometry=new THREE.PlaneGeometry(288,288,cells,cells);patchGeometry.rotateX(-Math.PI/2);
 const patchIndices=new THREE.BufferAttribute(new Uint32Array(cells*cells*6),1).setUsage(THREE.DynamicDrawUsage);patchGeometry.setIndex(patchIndices);patchGeometry.setDrawRange(0,0);
 patchGeometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,SEA_LEVEL,0),Math.hypot(144,144,2));
 const patchMaterial=material.clone();patchMaterial.uniforms=material.uniforms;patchMaterial.defines={WATER_PATCH:1};
 const patch=new THREE.Mesh(patchGeometry,patchMaterial);patch.name='Nearshore / physical advancing and receding water';patch.renderOrder=-5;scene.add(patch);
 let cpuField:{distance:Float32Array;size:number}|undefined;
 const patchCell=new THREE.Vector2(Infinity,Infinity),vertexDistances=new Float32Array((cells+1)**2);
 function update(position:THREE.Vector3){
  patchCenter.value.set(position.x,position.z);if(!cpuField)return;
  const cx=Math.floor(position.x/8)*8,cz=Math.floor(position.z/8)*8;if(patchCell.x===cx&&patchCell.y===cz)return;
  patchCell.set(cx,cz);patch.position.set(cx,0,cz);
  const {distance,size}=cpuField,positions=patchGeometry.getAttribute('position');
  for(let i=0;i<positions.count;i++){
   const u=(positions.getX(i)+cx+FIELD_WIDTH/2)/FIELD_WIDTH*(size-1),v=(positions.getZ(i)+cz+FIELD_DEPTH/2)/FIELD_DEPTH*(size-1);
   if(u<0||v<0||u>=size-1||v>=size-1){vertexDistances[i]=Infinity;continue;}
   const x=Math.floor(u),z=Math.floor(v),fx=u-x,fz=v-z,a=z*size+x;
   vertexDistances[i]=distance[a]*(1-fx)*(1-fz)+distance[a+1]*fx*(1-fz)+distance[a+size]*(1-fx)*fz+distance[a+size+1]*fx*fz;
  }
  let count=0;const indices=patchIndices.array;
  for(let z=0;z<cells;z++)for(let x=0;x<cells;x++){
   const a=z*(cells+1)+x,b=a+cells+1,c=b+1,d=a+1;
   // Distance band plus a generous cell/height-field margin: exact cutout is
   // shared by both fragment programs, not approximated by this CPU filter.
   if(Math.min(vertexDistances[a],vertexDistances[b],vertexDistances[c],vertexDistances[d])>38)continue;
   indices[count++]=a;indices[count++]=b;indices[count++]=d;indices[count++]=b;indices[count++]=c;indices[count++]=d;
  }
  patchIndices.needsUpdate=true;patchGeometry.setDrawRange(0,count);patch.userData.triangles=count/3;
 }
 const decorated=new WeakSet<THREE.MeshStandardMaterial>();
 return{ocean,
  prepare(sample:(x:number,z:number)=>number,solidFloor:(x:number,z:number)=>number){if(disposed)return;const built=buildShoreField(sample,mobile?512:768,solidFloor),texture=new THREE.DataTexture(built.data,built.size,built.size);texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;fieldTexture.dispose();fieldTexture=texture;field.value=texture;cpuField={distance:built.distance,size:built.size};texel.value.set(1/built.size,1/built.size);hasField.value=1;ready=true;ocean.userData.shoreField={size:built.size,bytes:built.data.byteLength,waterLevel:SEA_LEVEL};patchCell.set(Infinity,Infinity);update(new THREE.Vector3(patchCenter.value.x,0,patchCenter.value.y));},
  update,
  setSkyReflection(texture:THREE.Texture){sky.value=texture;hasSky.value=1;},
  addWetness(target:THREE.MeshStandardMaterial){
   if(decorated.has(target))return;decorated.add(target);const previous=target.onBeforeCompile,key=target.customProgramCacheKey();
   target.onBeforeCompile=(shader,renderer)=>{previous.call(target,shader,renderer);Object.assign(shader.uniforms,uniforms);
    shader.vertexShader='varying vec3 vWetShoreWorld;\n'+shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
     vec4 shoreWorld=vec4(transformed,1.0);
     #ifdef USE_INSTANCING
     shoreWorld=instanceMatrix*shoreWorld;
     #endif
     vWetShoreWorld=(modelMatrix*shoreWorld).xyz;`);
    shader.fragmentShader='varying vec3 vWetShoreWorld;\n'+shoreGLSL+shader.fragmentShader.replace('#include <metalnessmap_fragment>',`#include <metalnessmap_fragment>
     if(uShoreReady>.5&&vWetShoreWorld.y>-2.8&&vWetShoreWorld.y<-.65){
      vec4 wetField=coastField(vWetShoreWorld.xz);float shore=coastDistance(wetField);
      float recent=max(coastWave(vWetShoreWorld.xz,shore,uShoreTime),max(coastWave(vWetShoreWorld.xz,shore,uShoreTime-1.5),coastWave(vWetShoreWorld.xz,shore,uShoreTime-3.0)));
      float wet=1.0-smoothstep(recent+.02,recent+.17,vWetShoreWorld.y);
      diffuseColor.rgb*=mix(1.0,.61,wet);roughnessFactor=mix(roughnessFactor,.43,wet*.85);
     }`);
   };target.customProgramCacheKey=()=>key+'-wet-shore-v1';
  },
  get ready(){return ready;},
  dispose(){disposed=true;ocean.removeFromParent();patch.removeFromParent();geometry.dispose();material.dispose();patchGeometry.dispose();patchMaterial.dispose();fieldTexture.dispose();cpuField=undefined;},
 };
}
