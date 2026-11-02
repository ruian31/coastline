import * as THREE from 'three';

export type SeasonId='spring'|'summer'|'autumn'|'winter';
type ColorTriplet=[number,number,number];
export type SeasonLook={amount:number;ground:ColorTriplet;grass:ColorTriplet};
// Coefficients are linear reflectance multipliers, not display-space colors.
// Summer is the existing dry coast; evergreen foliage keeps its own materials.
export const SEASONS:Record<SeasonId,{label:string;look:SeasonLook}>={
 spring:{label:'春 · 草坡返绿',look:{amount:.88,ground:[.67,1.04,.42],grass:[.58,1.02,.34]}},
 summer:{label:'夏 · 金色海岸',look:{amount:0,ground:[1,1,1],grass:[1,1,1]}},
 autumn:{label:'秋 · 暖草初雨',look:{amount:.30,ground:[1.08,.97,.72],grass:[1.08,.91,.57]}},
 winter:{label:'冬 · 海岸湿绿',look:{amount:.66,ground:[.62,.91,.55],grass:[.54,.86,.48]}},
};
export const isSeasonId=(id:unknown):id is SeasonId=>typeof id==='string'&&Object.hasOwn(SEASONS,id);
const copyLook=(p:SeasonLook):SeasonLook=>({amount:p.amount,ground:[...p.ground],grass:[...p.grass]});

/** Manual phenology transition. It never reseeds placements or pressure data. */
export class CoastalSeasons{
 target:SeasonId='summer';readonly value=copyLook(SEASONS.summer.look);seconds=0;
 private from=copyLook(this.value);private progress=1;
 select(id:SeasonId){this.target=id;this.from=copyLook(this.value);this.progress=0;}
 advance(seconds:number,active:boolean){
  if(!active||!Number.isFinite(seconds)||seconds<=0)return false;
  this.seconds+=seconds;if(this.progress===1)return false;
  this.progress=Math.min(1,this.progress+seconds/60);if(this.progress>1-1e-10)this.progress=1;
  const t=this.progress*this.progress*(3-2*this.progress),to=SEASONS[this.target].look;
  this.value.amount=t===1?to.amount:this.from.amount+(to.amount-this.from.amount)*t;
  for(const key of ['ground','grass'] as const)for(let i=0;i<3;i++)this.value[key][i]=t===1?to[key][i]:this.from[key][i]+(to[key][i]-this.from[key][i])*t;
  return true;
 }
 get diagnostics(){return{target:this.target,transitioning:this.progress<1,seconds:this.seconds,...copyLook(this.value)};}
}

export function createSeasonUniforms(){return{
 uSeasonAmount:{value:0},uSeasonGround:{value:new THREE.Color(1,1,1)},uSeasonGrass:{value:new THREE.Color(1,1,1)},
};}
export type SeasonUniforms=ReturnType<typeof createSeasonUniforms>;

/** Shared by the actual near/far grass materials; alpha and shape stay intact. */
export function applyGrassSeason(material:THREE.MeshStandardMaterial,uniforms:SeasonUniforms){
 const before=material.onBeforeCompile,key=material.customProgramCacheKey();
 material.onBeforeCompile=(shader,renderer)=>{
  before.call(material,shader,renderer);Object.assign(shader.uniforms,uniforms);
  shader.vertexShader='varying vec3 vCoastalSeasonWorld;\n'+shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
   vec4 seasonWorld=vec4(transformed,1.0);
   #ifdef USE_INSTANCING
   seasonWorld=instanceMatrix*seasonWorld;
   #endif
   vCoastalSeasonWorld=(modelMatrix*seasonWorld).xyz;`);
  shader.fragmentShader='uniform float uSeasonAmount;uniform vec3 uSeasonGrass;varying vec3 vCoastalSeasonWorld;\n'+shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   if(uSeasonAmount>.00001){
    float seasonGrassLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
    float seasonPatch=.7+.3*sin(vCoastalSeasonWorld.x*.043+sin(vCoastalSeasonWorld.z*.037)*2.0);
    diffuseColor.rgb=mix(diffuseColor.rgb,seasonGrassLuma*uSeasonGrass,uSeasonAmount*seasonPatch);
   }`);
 };
 material.customProgramCacheKey=()=>key+'-coastal-grass-season-v1';
}
