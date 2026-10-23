import * as THREE from 'three';

/** Fixed world occlusion is cached. Higher tiers multiply a moving local map
 * into that same sun, so local detail cannot illuminate an occluded hillside.
 * Bake proxies borrow geometry/materials; their instance buffers are temporary. */
export function createStaticSunShadows(scene:THREE.Scene,renderer:THREE.WebGLRenderer,localSun:THREE.DirectionalLight,mobile:boolean,makeSceneryCasters:()=>THREE.Group){
 const worldSun=new THREE.DirectionalLight(localSun.color,2.5);worldSun.name='Cached golden-hour world sun';worldSun.castShadow=true;
 const shadow=worldSun.shadow;shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);shadow.autoUpdate=false;shadow.normalBias=.035;
 const data={ready:false,mode:'loading',bakes:0,bakeDraws:0,localPasses:0,localDraws:0,localTriangles:0,casters:0,mapSize:shadow.mapSize.x,projectedWidth:0,projectedHeight:0};scene.userData.sunShadows=data;
 const proxyScene=new THREE.Scene(),blankCamera=new THREE.PerspectiveCamera(30,1,.1,1);
 blankCamera.position.set(0,2000,0);blankCamera.lookAt(0,3000,0);
 const uniforms={coastLocalEnabled:{value:false},coastLocalMap:{value:null as THREE.DepthTexture|null},coastLocalMatrix:{value:localSun.shadow.matrix},coastLocalSize:{value:localSun.shadow.mapSize},coastLocalBias:{value:localSun.shadow.bias},coastLocalNormalBias:{value:localSun.shadow.normalBias}};
 const decorated=new WeakSet<THREE.Material>();
 const previousAutoUpdate=renderer.shadowMap.autoUpdate;renderer.shadowMap.autoUpdate=false;
 let tier='low',disposed=false,fallback=false,target:THREE.WebGLRenderTarget|null=new THREE.WebGLRenderTarget(1,1);
 localSun.shadow.autoUpdate=false;

 function registerReceivers(root:THREE.Object3D){
  root.traverse(object=>{
   const mesh=object as THREE.Mesh;if(!mesh.isMesh)return;
   for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
    if(!(material as THREE.MeshStandardMaterial).isMeshStandardMaterial||decorated.has(material))continue;
    decorated.add(material);const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
    material.onBeforeCompile=(shader,renderer)=>{
     previous.call(material,shader,renderer);if(tier==='low')return;Object.assign(shader.uniforms,uniforms);
     shader.vertexShader='uniform mat4 coastLocalMatrix;\nuniform float coastLocalNormalBias;\nvarying vec4 vCoastLocalCoord;\n'+shader.vertexShader.replace('#include <shadowmap_vertex>',`#include <shadowmap_vertex>
      #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
       vCoastLocalCoord = coastLocalMatrix * (worldPosition + vec4(shadowWorldNormal * coastLocalNormalBias, 0.0));
      #endif`);
     shader.fragmentShader='uniform bool coastLocalEnabled;\nuniform sampler2DShadow coastLocalMap;\nuniform vec2 coastLocalSize;\nuniform float coastLocalBias;\nvarying vec4 vCoastLocalCoord;\n'+shader.fragmentShader.replace('#include <lights_fragment_begin>',THREE.ShaderChunk.lights_fragment_begin.replace('directionalLightShadow = directionalLightShadows[ i ];',`directionalLightShadow = directionalLightShadows[ i ];
      if (coastLocalEnabled && receiveShadow && directLight.visible) {
       directLight.color *= getShadow(coastLocalMap, coastLocalSize, 1.0, coastLocalBias, 1.0, vCoastLocalCoord);
      }`));
    };
    material.customProgramCacheKey=()=>key+(tier==='low'?'-coast-world-only-v1':'-coast-local-shadow-v1');material.needsUpdate=true;
   }
  });
 }

 function applyQuality(){
  if(!data.ready)return;
  const shadows=!(tier==='low'&&fallback);data.mode=!shadows?'unshadowed-fallback':tier==='low'?'cached-world':'cached-world-and-local';worldSun.castShadow=shadows;
  const enabled=tier!=='low';
  if(uniforms.coastLocalEnabled.value!==enabled){
   uniforms.coastLocalEnabled.value=enabled;
   scene.traverse(object=>{const mesh=object as THREE.Mesh;if(mesh.isMesh)for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])if(decorated.has(material))material.needsUpdate=true;});
  }
  renderer.shadowMap.enabled=shadows;
 }

 function prepare(){
  if(data.ready||disposed)return;
  scene.updateMatrixWorld(true);
  const casters=makeSceneryCasters();proxyScene.add(casters);
  // Scanned rock and built structures are static. Small instanced shrubs remain
  // excluded here; their compacted buffers are not an authored placement set.
  for(const name of['Eroded sandstone headland','Coastal destinations']){
   scene.getObjectByName(name)?.traverse(object=>{
    const source=object as THREE.Mesh;
    if(!source.isMesh||(source as THREE.InstancedMesh).isInstancedMesh)return;
    const materials=Array.isArray(source.material)?source.material:[source.material];
    if(materials.some(m=>m.transparent||!(m as THREE.MeshStandardMaterial).isMeshStandardMaterial))return;
    const mesh=new THREE.Mesh(source.geometry,source.material);mesh.name=source.name;mesh.matrixAutoUpdate=false;mesh.matrix.copy(source.matrixWorld);mesh.castShadow=true;casters.add(mesh);
   });
  }
  casters.traverse(object=>{const mesh=object as THREE.Mesh;if(mesh.isMesh){mesh.castShadow=true;mesh.onBeforeShadow=()=>{data.bakeDraws++;};data.casters++;}});
  const direction=localSun.position.clone().sub(localSun.target.position).normalize();worldSun.target.position.set(0,20,0);worldSun.position.copy(worldSun.target.position).addScaledVector(direction,1400);
  proxyScene.add(worldSun,worldSun.target);proxyScene.updateMatrixWorld(true);shadow.updateMatrices(worldSun);
  const lightBounds=new THREE.Box3(),point=new THREE.Vector3(),worldBox=new THREE.Box3();
  casters.updateMatrixWorld(true);
  const include=(p:THREE.Vector3)=>{lightBounds.expandByPoint(p.applyMatrix4(shadow.camera.matrixWorldInverse));};
  casters.traverse(object=>{
   const mesh=object as THREE.Mesh;if(!mesh.isMesh)return;
   if(mesh.name==='Limestone headland and grassy interior'){
    const positions=mesh.geometry.getAttribute('position');
    for(let i=0;i<positions.count;i++)if(positions.getY(i)>-2){point.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);const height=point.y;include(point);point.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);point.y=height+3;include(point);}
   }else{
    if((mesh as THREE.InstancedMesh).isInstancedMesh){const instances=mesh as THREE.InstancedMesh;instances.computeBoundingBox();worldBox.copy(instances.boundingBox!).applyMatrix4(mesh.matrixWorld);}
    else{mesh.geometry.computeBoundingBox();worldBox.copy(mesh.geometry.boundingBox!).applyMatrix4(mesh.matrixWorld);}
    for(const x of[worldBox.min.x,worldBox.max.x])for(const y of[worldBox.min.y,worldBox.max.y])for(const z of[worldBox.min.z,worldBox.max.z])include(point.set(x,y,z));
   }
  });
  const camera=shadow.camera;camera.left=lightBounds.min.x-10;camera.right=lightBounds.max.x+10;camera.bottom=lightBounds.min.y-10;camera.top=lightBounds.max.y+10;camera.near=Math.max(.1,-lightBounds.max.z-20);camera.far=-lightBounds.min.z+20;camera.updateProjectionMatrix();shadow.bias=-.015/(camera.far-camera.near);
  data.projectedWidth=camera.right-camera.left;data.projectedHeight=camera.top-camera.bottom;
  // Public render entry point: the ordinary view looks away from all proxies,
  // while the separate shadow camera still visits the complete static world.
  const previousTarget=renderer.getRenderTarget(),previousEnabled=renderer.shadowMap.enabled;
  try{
   renderer.shadowMap.enabled=true;renderer.shadowMap.needsUpdate=true;shadow.needsUpdate=true;renderer.setRenderTarget(target);renderer.render(proxyScene,blankCamera);
   data.ready=!!shadow.map;data.bakes++;
  }finally{
   renderer.setRenderTarget(previousTarget);renderer.shadowMap.enabled=previousEnabled;target?.dispose();target=null;
   casters.traverse(object=>{if((object as THREE.InstancedMesh).isInstancedMesh)(object as THREE.InstancedMesh).dispose();});casters.removeFromParent();casters.clear();
  }
  if(data.ready){scene.add(worldSun,worldSun.target);proxyScene.add(localSun,localSun.target);uniforms.coastLocalMap.value=shadow.map!.depthTexture;registerReceivers(scene);applyQuality();}
 }

 function update(car:THREE.Object3D){
  data.localDraws=0;data.localTriangles=0;
  if(!data.ready||disposed||tier==='low')return;
  const parent=car.parent,previousTarget=renderer.getRenderTarget(),autoReset=renderer.info.autoReset;
  try{
   // Static world occlusion is already in the global factor. Only the moving
   // car is redrawn here; this factor can darken light, never add direct light.
   proxyScene.add(car);renderer.shadowMap.needsUpdate=true;localSun.shadow.needsUpdate=true;target??=new THREE.WebGLRenderTarget(1,1);renderer.setRenderTarget(target);renderer.info.autoReset=false;renderer.info.reset();renderer.render(proxyScene,blankCamera);data.localPasses++;data.localDraws=renderer.info.render.calls;data.localTriangles=renderer.info.render.triangles;
   uniforms.coastLocalMap.value=localSun.shadow.map!.depthTexture;
  }finally{if(parent)parent.add(car);else car.removeFromParent();renderer.setRenderTarget(previousTarget);renderer.info.autoReset=autoReset;}
 }

 return{prepare,update,registerReceivers,diagnostics:data,setQuality(value:string){tier=value;if(tier!=='low')fallback=false;applyQuality();},restore(){fallback=false;applyQuality();},reduceForPerformance(){if(tier!=='low'||fallback)return false;fallback=true;applyQuality();return true;},dispose(){disposed=true;worldSun.removeFromParent();worldSun.target.removeFromParent();worldSun.dispose();localSun.shadow.dispose();target?.dispose();proxyScene.clear();renderer.shadowMap.autoUpdate=previousAutoUpdate;delete scene.userData.sunShadows;}};
}
