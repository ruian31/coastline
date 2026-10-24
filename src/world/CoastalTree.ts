import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {preservePlantCutoutMips,centerPlantAlphaCoverage} from './PlantTexture';

/** Prepared scanned trunk plus spatial, three-view foliage clusters. Geometry,
 * material and textures are owned by the caller after this promise resolves. */
export async function loadCoastalTree(mobile:boolean,time:{value:number},manager=THREE.DefaultLoadingManager){
 const path=`${import.meta.env.BASE_URL}assets/models/coastal_tree/`,loader=new THREE.TextureLoader(manager),textures:THREE.Texture[]=[];
 const mapReady=(file:string,color=false)=>new Promise<THREE.Texture>((resolve,reject)=>{
  const texture=loader.load(path+file,resolve,undefined,reject);texture.flipY=false;texture.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;texture.anisotropy=mobile?4:8;textures.push(texture);
 });
 const results=await Promise.allSettled([new GLTFLoader(manager).loadAsync(path+'tree.gltf'),mapReady('tree-color.webp',true),mapReady('tree-surface.webp')]);
 if(results.some(r=>r.status==='rejected')){
  textures.forEach(t=>t.dispose());const model=results[0];if(model.status==='fulfilled')model.value.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});
  throw Error('Coastal tree asset failed to load');
 }
 const gltf=(results[0] as PromiseFulfilledResult<Awaited<ReturnType<GLTFLoader['loadAsync']>>>).value,map=textures[0],surface=textures[1],models:Record<string,THREE.BufferGeometry>={};
 gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh){models[o.name]=o.geometry;(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});
 const near=models.coastal_tree_near,far=models.coastal_tree_far;if(!near||!far){textures.forEach(t=>t.dispose());Object.values(models).forEach(g=>g.dispose());throw Error('Incomplete coastal tree LODs');}
 const regions=Array.from({length:765},(_,i)=>[i%32*64,Math.floor(i/32)*64,64,64] as const);preservePlantCutoutMips(map,regions);
 const material=new THREE.MeshStandardMaterial({name:'Scanned coastal tree bark and foliage',map,normalMap:surface,normalScale:new THREE.Vector2(.65,.65),roughnessMap:surface,roughness:1,side:THREE.DoubleSide,alphaTest:.45,alphaToCoverage:true});
 material.userData.rigidTree=true;
 material.onBeforeCompile=shader=>{
  shader.uniforms.uSceneryTime=time;
  shader.vertexShader='uniform float uSceneryTime;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    float phase=0.0;
    #ifdef USE_INSTANCING
      phase=instanceMatrix[3].x*.34+instanceMatrix[3].z*.19;
    #endif
    float leaf=1.0-step(.75,uv.y);
    transformed.x+=leaf*sin(uSceneryTime*1.25+phase+position.y*.2)*.009*max(position.y-.5,0.0);
    transformed.z+=leaf*cos(uSceneryTime*.83+phase)*.005*max(position.y-.5,0.0);`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`if(vMapUv.y<.75)diffuseColor.a*=smoothstep(1.2,3.8,length(vViewPosition));
    #include <alphatest_fragment>`).replace('#include <roughnessmap_fragment>',THREE.ShaderChunk.roughnessmap_fragment.replace('texture2D( roughnessMap, vRoughnessMapUv )','(vRoughnessMapUv.y<.75?vec4(0.0,0.0,0.0,.9):texture2D(roughnessMap,vec2(vRoughnessMapUv.x*2.0,(vRoughnessMapUv.y-.75)*4.0)))').replace('texelRoughness.g','texelRoughness.a')).replace('#include <normal_fragment_maps>',THREE.ShaderChunk.normal_fragment_maps.replace('texture2D( normalMap, vNormalMapUv ).xyz','(vNormalMapUv.y<.75?vec3(.5,.5,1.0):texture2D(normalMap,vec2(vNormalMapUv.x*2.0,(vNormalMapUv.y-.75)*4.0)).xyz)')).replace('#include <normal_fragment_begin>',`#include <normal_fragment_begin>
    #ifdef DOUBLE_SIDED
      if(vMapUv.y<.75){normal*=faceDirection;nonPerturbedNormal=normal;}
    #endif`);
 };
 material.customProgramCacheKey=()=> 'coastal-scanned-tree-three-view-v1-camera-leaf-fade-v1';centerPlantAlphaCoverage(material);
 return{near,far,material,textures};
}
