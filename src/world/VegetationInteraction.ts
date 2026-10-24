import * as THREE from 'three';

const SIZE=256,CELL=.2,PERIOD=6553.6,UPLOAD_INTERVAL=.08;

/** World-space pressure shared by the grass carpet and low plant materials.
 * RGBA8 stores strength, bend heading and a 16-bit 10 Hz timestamp. Recovery
 * runs in the vertex shader; CPU work touches only the car's swept footprint. */
export function createVegetationInteraction(ground:(x:number,z:number)=>number){
 const pixels=new Uint8Array(SIZE*SIZE*4),scratch=new Uint8Array(pixels.length);
 const texture=new THREE.DataTexture(pixels,SIZE,SIZE,THREE.RGBAFormat,THREE.UnsignedByteType);
 texture.name='World anchored vegetation pressure';texture.minFilter=texture.magFilter=THREE.NearestFilter;texture.generateMipmaps=false;texture.flipY=false;texture.colorSpace=THREE.NoColorSpace;texture.needsUpdate=true;
 const uniforms={uPlantPressure:{value:texture},uPlantOrigin:{value:new THREE.Vector2(-SIZE/2,-SIZE/2)},uPlantTime:{value:0},uPlantCar:{value:new THREE.Vector3(0,-1000,0)},uPlantUp:{value:new THREE.Vector3(0,1,0)},uPlantForward:{value:new THREE.Vector2(0,1)},uPlantSpeed:{value:0}};
 const previousWheels:THREE.Vector3[]=[],currentWheels:THREE.Vector3[]=[],lastCar=new THREE.Vector3(),lastPose=new THREE.Matrix4(),point=new THREE.Vector3(),decorated=new WeakSet<THREE.Material>();
 // Retain recent marks outside the GPU window, so a short detour cannot erase
 // them. Signed 16-bit cell coordinates cover ±6.5km, beyond this island.
 const recentMarks=new Map<number,number>(),worldKey=(x:number,z:number)=>(x&65535)+(z&65535)*65536;
 let lastTime=-Infinity,lastUpload=-Infinity,lastCleanup=-Infinity,period=-1,disposed=false,initialized=false;
 const diagnostics={size:SIZE,cellSize:CELL,bytes:pixels.byteLength,recoverySeconds:60,bodyRecoverySeconds:5,uploads:0,stamps:0,recenters:0,teleports:0,cachedCells:0,origin:uniforms.uPlantOrigin.value};
 const packedAge=(mark:number,time:number)=>((time-((mark>>>16)&65535)*.1)+PERIOD)%PERIOD;

 function recenter(x:number,z:number){
  const origin=uniforms.uPlantOrigin.value,cx=Math.floor(x/CELL),cz=Math.floor(z/CELL);
  if(initialized&&Math.abs(cx-origin.x-SIZE/2)<8&&Math.abs(cz-origin.y-SIZE/2)<8)return false;
  const nx=cx-SIZE/2,nz=cz-SIZE/2,dx=nx-origin.x,dz=nz-origin.y;
  scratch.fill(0);
  if(initialized&&Math.abs(dx)<SIZE&&Math.abs(dz)<SIZE){
   const lo=Math.max(0,-dx),hi=Math.min(SIZE,SIZE-dx);
   for(let row=Math.max(0,-dz);row<Math.min(SIZE,SIZE-dz);row++)scratch.set(pixels.subarray(((row+dz)*SIZE+lo+dx)*4,((row+dz)*SIZE+hi+dx)*4),(row*SIZE+lo)*4);
  }
  for(let row=0;row<SIZE;row++)for(let col=0;col<SIZE;col++){
   if(initialized&&row+dz>=0&&row+dz<SIZE&&col+dx>=0&&col+dx<SIZE)continue;
   const mark=recentMarks.get(worldKey(col+nx,row+nz));if(mark===undefined)continue;
   const i=(row*SIZE+col)*4;scratch[i]=mark&255;scratch[i+1]=(mark>>>8)&255;scratch[i+2]=(mark>>>16)&255;scratch[i+3]=mark>>>24;
  }
  pixels.set(scratch);origin.set(nx,nz);diagnostics.recenters++;return true;
 }
 const ageAt=(i:number,time:number)=>((time-(pixels[i+2]+pixels[i+3]*256)*.1)+PERIOD)%PERIOD;
 function stamp(x:number,z:number,radius:number,strength:number,heading:number,time:number){
  const origin=uniforms.uPlantOrigin.value,loX=Math.max(0,Math.floor((x-radius)/CELL)-origin.x),hiX=Math.min(SIZE-1,Math.floor((x+radius)/CELL)-origin.x),loZ=Math.max(0,Math.floor((z-radius)/CELL)-origin.y),hiZ=Math.min(SIZE-1,Math.floor((z+radius)/CELL)-origin.y);
  const tick=Math.floor(time*10),angle=Math.round(((heading/(Math.PI*2))%1+1)%1*255);
  for(let row=loZ;row<=hiZ;row++)for(let col=loX;col<=hiX;col++){
   const distance=Math.hypot((col+origin.x+.5)*CELL-x,(row+origin.y+.5)*CELL-z),value=strength*(1-THREE.MathUtils.smoothstep(distance,radius*.45,radius));if(value<=.01)continue;
   const i=(row*SIZE+col)*4,old=pixels[i]/255,age=ageAt(i,time),life=old>.8?60:5,remaining=old*(1-THREE.MathUtils.smoothstep(age,life*.2,life));
   // A recent deep tyre mark must survive a later, softer body sweep.
   if(value<remaining*.98)continue;
   pixels[i]=Math.round(value*255);pixels[i+1]=angle;pixels[i+2]=tick&255;pixels[i+3]=(tick>>8)&255;
   recentMarks.set(worldKey(col+origin.x,row+origin.y),(pixels[i]|(angle<<8)|((tick&255)<<16)|(((tick>>8)&255)<<24))>>>0);
  }
  diagnostics.stamps++;
 }
 const declarations=/* glsl */`
  uniform sampler2D uPlantPressure;
  uniform vec2 uPlantOrigin,uPlantForward;
  uniform vec3 uPlantCar,uPlantUp;
  uniform float uPlantTime,uPlantSpeed;
  vec3 coastPlantPressure(vec3 root){
   vec2 uv=(root.xz/${CELL.toFixed(3)}-uPlantOrigin)/${SIZE.toFixed(1)};
   vec4 mark=vec4(0.0);
   if(all(greaterThanEqual(uv,vec2(0.0)))&&all(lessThan(uv,vec2(1.0))))mark=texture2D(uPlantPressure,uv);
   float stampTime=(floor(mark.b*255.0+.5)+floor(mark.a*255.0+.5)*256.0)*.1;
   float age=mod(uPlantTime-stampTime+${PERIOD.toFixed(1)},${PERIOD.toFixed(1)});
   float life=mark.r>.8?60.0:5.0;
   // Fade before the moving texture boundary; cached marks must not suddenly
   // reappear on distant plant LODs when their world cells enter the window.
   float rangeFade=1.0-smoothstep(17.0,23.0,distance(root.xz,uPlantCar.xz));
   float oldPressure=mark.r*(1.0-smoothstep(life*.2,life,age))*rangeFade;
   float heading=mark.g*6.283185307;
   vec2 oldDirection=vec2(sin(heading),cos(heading));
   vec2 right=vec2(uPlantForward.y,-uPlantForward.x),delta=root.xz-uPlantCar.xz;
   float side=dot(delta,right),along=dot(delta,uPlantForward);
   float bellyHeight=uPlantCar.y-dot(uPlantUp.xz,delta)/max(.2,uPlantUp.y);
   float sameLevel=1.0-smoothstep(.55,1.6,abs(root.y-bellyHeight));
   float front=1.0-smoothstep(1.8,2.85,abs(along));
   float wake=(1.0-smoothstep(.75,1.95,abs(side)))*front*(.35+.65*smoothstep(0.0,5.0,uPlantSpeed));
   float belly=(1.0-smoothstep(.78,1.1,abs(side)))*front;
   float livePressure=max(wake*.58,belly*.88)*sameLevel;
   vec2 liveDirection=normalize(right*(side<0.0?-1.0:1.0)+uPlantForward*.18);
   float pressure=max(oldPressure,livePressure);
   vec2 direction=oldPressure>livePressure?oldDirection:liveDirection;
   return vec3(direction.x*pressure,pressure,direction.y*pressure);
  }
  vec3 coastBendByPressure(vec3 world,float height,vec3 force){
   return world+vec3(force.x*height*.95,-force.y*height*.93,force.z*height*.95);
  }
  vec3 coastBendPlant(vec3 world,vec3 root,float height,float flexibility){return coastBendByPressure(world,height,coastPlantPressure(root)*flexibility);}
 `;
 function setupShader(shader:THREE.WebGLProgramParametersWithUniforms){Object.assign(shader.uniforms,uniforms);shader.vertexShader=declarations+shader.vertexShader;}
 function attach(material:THREE.MeshStandardMaterial,flexibility=.85){
  if(decorated.has(material))return;decorated.add(material);
  const compile=material.onBeforeCompile,key=material.customProgramCacheKey();
  material.onBeforeCompile=(shader,renderer)=>{
   compile.call(material,shader,renderer);setupShader(shader);
   const followsGround=shader.vertexShader.includes('attribute vec3 instanceGroundSlope;');
   shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>',/* glsl */`
    #include <beginnormal_vertex>
    #ifdef USE_INSTANCING
     mat3 coastPlantBasis=mat3(modelMatrix)*mat3(instanceMatrix);
     vec3 coastPlantRoot=(modelMatrix*instanceMatrix*vec4(0.0,0.0,0.0,1.0)).xyz;
     ${followsGround?'coastPlantRoot.y+=instanceGroundSlope.z;':''}
     vec3 coastPlantForce=coastPlantPressure(coastPlantRoot)*${flexibility.toFixed(3)};
     vec2 coastPlantSlope=${followsGround?'instanceGroundSlope.xy':'vec2(0.0)'};
     if(coastPlantForce.y>0.0){
     vec3 coastPlantNormal=coastPlantBasis[0]*objectNormal.x/dot(coastPlantBasis[0],coastPlantBasis[0])+coastPlantBasis[1]*objectNormal.y/dot(coastPlantBasis[1],coastPlantBasis[1])+coastPlantBasis[2]*objectNormal.z/dot(coastPlantBasis[2],coastPlantBasis[2]);
     vec3 coastPlantShear=coastPlantForce*vec3(.95,-.93,.95);coastPlantShear.y+=dot(coastPlantSlope,coastPlantShear.xz);
     vec3 coastPlantPlane=vec3(-coastPlantSlope.x,1.0,-coastPlantSlope.y);
     coastPlantNormal-=coastPlantPlane*dot(coastPlantShear,coastPlantNormal)/max(.05,1.0+dot(coastPlantPlane,coastPlantShear));
     objectNormal=normalize(vec3(dot(coastPlantNormal,coastPlantBasis[0]),dot(coastPlantNormal,coastPlantBasis[1]),dot(coastPlantNormal,coastPlantBasis[2])));
     }
    #endif`);
   shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',/* glsl */`
    #ifdef USE_INSTANCING
     if(coastPlantForce.y>0.0){
     float coastPlantHeight=max(position.y,0.0)*length(coastPlantBasis[1]);
     vec3 coastPlantDelta=coastPlantForce*coastPlantHeight*vec3(.95,-.93,.95);
     coastPlantDelta.y+=dot(coastPlantSlope,coastPlantDelta.xz);
     // Authored matrices have orthogonal rotation/scale columns. Transform
     // the displacement back without a matrix inverse per vertex.
     transformed+=vec3(dot(coastPlantDelta,coastPlantBasis[0])/dot(coastPlantBasis[0],coastPlantBasis[0]),dot(coastPlantDelta,coastPlantBasis[1])/dot(coastPlantBasis[1],coastPlantBasis[1]),dot(coastPlantDelta,coastPlantBasis[2])/dot(coastPlantBasis[2],coastPlantBasis[2]));
     }
    #endif
    #include <project_vertex>`);
  };
  material.customProgramCacheKey=()=>key+`-vehicle-plant-pressure-v3-${flexibility}`;
 }
 return{diagnostics,setupShader,attach,
  update(elapsed:number,car:THREE.Object3D,wheelContacts:readonly THREE.Vector3[]){
   if(disposed||!Number.isFinite(elapsed)||(elapsed===lastTime&&car.matrixWorld.equals(lastPose)))return;lastPose.copy(car.matrixWorld);
   const position=car.position,newPeriod=Math.floor(elapsed/PERIOD);
   const resetClock=elapsed<lastTime||(Number.isFinite(lastTime)&&elapsed-lastTime>=60);
   if(resetClock)recentMarks.clear();
   // At timestamp wrap, rebuild only from the still-recent CPU records. This
   // removes stale GPU texels while retaining marks laid just before wrap.
   if(newPeriod!==period||resetClock){pixels.fill(0);initialized=false;period=newPeriod;lastCleanup=-Infinity;}
   const time=elapsed%PERIOD,travel=initialized?position.distanceTo(lastCar):0,teleport=travel>8;
   if(teleport)diagnostics.teleports++;
   const dt=initialized?elapsed-lastUpload:0;lastTime=elapsed;
   if(elapsed-lastCleanup>=1){for(const [key,mark]of recentMarks)if(packedAge(mark,time)>((mark&255)/255>.8?60:5))recentMarks.delete(key);lastCleanup=elapsed;}diagnostics.cachedCells=recentMarks.size;
   uniforms.uPlantTime.value=time;uniforms.uPlantCar.value.copy(position);
   point.set(0,1,0).transformDirection(car.matrixWorld);uniforms.uPlantUp.value.copy(point);
   point.set(0,0,1).transformDirection(car.matrixWorld);uniforms.uPlantForward.value.set(point.x,point.z).normalize();uniforms.uPlantSpeed.value=dt>0&&!teleport?travel/dt:0;
   const shifted=recenter(position.x,position.z);
   for(let i=0;i<wheelContacts.length;i++){
    currentWheels[i]??=new THREE.Vector3();currentWheels[i].copy(wheelContacts[i]).applyMatrix4(car.matrixWorld);
   }
   if(elapsed-lastUpload>=UPLOAD_INTERVAL||shifted){
    const forward=uniforms.uPlantForward.value,dx=position.x-lastCar.x,dz=position.z-lastCar.z,heading=travel>.015&&!teleport?Math.atan2(dx,dz):Math.atan2(forward.x,forward.y);
    const steps=initialized&&!teleport?Math.max(1,Math.ceil(travel/.12)):1;
    for(let i=0;i<currentWheels.length;i++){
     const current=currentWheels[i],previous=initialized&&!teleport?previousWheels[i]:current;
     for(let n=1;n<=steps;n++){
      point.lerpVectors(previous??current,current,n/steps);
      if(Math.abs(point.y-ground(point.x,point.z))<.6)stamp(point.x,point.z,.24,1,heading,time);
     }
    }
    // The low-pressure wake between the tyres recovers faster than tyre ruts.
    for(let n=1;n<=steps;n++){
     const t=n/steps,cx=initialized&&!teleport?THREE.MathUtils.lerp(lastCar.x,position.x,t):position.x,cz=initialized&&!teleport?THREE.MathUtils.lerp(lastCar.z,position.z,t):position.z,cy=initialized&&!teleport?THREE.MathUtils.lerp(lastCar.y,position.y,t):position.y,up=uniforms.uPlantUp.value;
     for(let along=-1.6;along<=1.6;along+=.4){const x=cx+forward.x*along,z=cz+forward.y*along,bellyHeight=cy-(up.x*(x-cx)+up.z*(z-cz))/Math.max(.2,up.y);if(Math.abs(bellyHeight-ground(x,z))<.65)stamp(x,z,.86,.54,heading,time);}
    }
    texture.needsUpdate=true;lastUpload=elapsed;diagnostics.uploads++;
    for(let i=0;i<currentWheels.length;i++){previousWheels[i]??=new THREE.Vector3();previousWheels[i].copy(currentWheels[i]);}
    lastCar.copy(position);initialized=true;
   }
  },
  dispose(){if(disposed)return;disposed=true;texture.dispose();recentMarks.clear();previousWheels.length=currentWheels.length=0;},
 };
}
export type VegetationInteraction=ReturnType<typeof createVegetationInteraction>;
