import * as THREE from 'three';

export type SeasonId='spring'|'summer'|'autumn'|'winter';
type ColorTriplet=[number,number,number];
export type SeasonLook={amount:number;ground:ColorTriplet;grass:ColorTriplet;bloom:number};
// Coefficients are linear reflectance multipliers, not display-space colors.
// Summer is the existing dry coast; evergreen foliage keeps its own materials.
export const SEASONS:Record<SeasonId,{label:string;look:SeasonLook}>={
 spring:{label:'春 · 草坡返绿',look:{amount:.88,ground:[.67,1.04,.42],grass:[.58,1.02,.34],bloom:1}},
 summer:{label:'夏 · 金色海岸',look:{amount:0,ground:[1,1,1],grass:[1,1,1],bloom:.42}},
 autumn:{label:'秋 · 暖草初雨',look:{amount:.30,ground:[1.08,.97,.72],grass:[1.08,.91,.57],bloom:.12}},
 winter:{label:'冬 · 海岸湿绿',look:{amount:.66,ground:[.62,.91,.55],grass:[.54,.86,.48],bloom:.06}},
};
export const isSeasonId=(id:unknown):id is SeasonId=>typeof id==='string'&&Object.hasOwn(SEASONS,id);
const copyLook=(p:SeasonLook):SeasonLook=>({amount:p.amount,ground:[...p.ground],grass:[...p.grass],bloom:p.bloom});
const order:readonly SeasonId[]=['spring','summer','autumn','winter'];
const seasonSeconds=720;

/** One phenology clock; it never reseeds placements or pressure data. */
export class CoastalSeasons{
 target:SeasonId='summer';natural=false;readonly value=copyLook(SEASONS.summer.look);seconds=0;
 private from=copyLook(this.value);private progress=1;private hold=seasonSeconds;
 select(id:SeasonId){this.target=id;this.from=copyLook(this.value);this.progress=0;}
 setNatural(enabled:boolean){if(enabled&&!this.natural)this.hold=seasonSeconds;this.natural=enabled;}
 advance(seconds:number,active:boolean){
  if(!active||!Number.isFinite(seconds)||seconds<=0)return false;
  this.seconds+=seconds;let remaining=seconds,changed=false;
  // Split at natural boundaries so a saved/replayed interval follows the same
  // seasons as ordinary frames, even when it crosses an entire year.
  while(remaining>1e-8){
   const dt=Math.min(remaining,this.natural?this.hold:remaining);remaining-=dt;
   if(this.progress<1){
    this.progress=Math.min(1,this.progress+dt/60);if(this.progress>1-1e-10)this.progress=1;
    const t=this.progress*this.progress*(3-2*this.progress),to=SEASONS[this.target].look;
    this.value.amount=t===1?to.amount:this.from.amount+(to.amount-this.from.amount)*t;
    this.value.bloom=t===1?to.bloom:this.from.bloom+(to.bloom-this.from.bloom)*t;
    for(const key of ['ground','grass'] as const)for(let i=0;i<3;i++)this.value[key][i]=t===1?to[key][i]:this.from[key][i]+(to[key][i]-this.from[key][i])*t;
    changed=true;
   }
   if(this.natural){this.hold-=dt;if(this.hold<1e-8){this.hold=seasonSeconds;this.select(order[(order.indexOf(this.target)+1)%order.length]);changed=true;}}
  }
  return changed;
 }
 get transitioning(){return this.progress<1;}
 snapshot(){return{target:this.target,natural:this.natural,value:copyLook(this.value),from:copyLook(this.from),progress:this.progress,hold:this.hold,seconds:this.seconds};}
 restore(saved:unknown){
  if(!saved||typeof saved!=='object')return false;const s=saved as ReturnType<CoastalSeasons['snapshot']>;
  const finite=(v:unknown,min:number,max=Infinity):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
  const look=(v:SeasonLook)=>v&&finite(v.amount,0,1)&&(v.bloom===undefined||finite(v.bloom,0,1))&&[v.ground,v.grass].every(c=>Array.isArray(c)&&c.length===3&&c.every(n=>finite(n,0,2)));
  if(!isSeasonId(s.target)||typeof s.natural!=='boolean'||!look(s.value)||!look(s.from)||!finite(s.progress,0,1)||!finite(s.hold,0,seasonSeconds)||!finite(s.seconds,0))return false;
  // M81/M82 saved the same surface state before flowers had a bloom channel.
  // Keep every existing field exact; initialize only the new flower state.
  const bloom=SEASONS[s.target].look.bloom;
  this.target=s.target;this.natural=s.natural;Object.assign(this.value,copyLook({...s.value,bloom:s.value.bloom??bloom}));this.from=copyLook({...s.from,bloom:s.from.bloom??bloom});this.progress=s.progress;this.hold=s.hold;this.seconds=s.seconds;return true;
 }
 get diagnostics(){return{target:this.target,natural:this.natural,transitioning:this.transitioning,seconds:this.seconds,remaining:this.hold,...copyLook(this.value)};}
}

export function createSeasonUniforms(){return{
 uSeasonAmount:{value:0},uSeasonGround:{value:new THREE.Color(1,1,1)},uSeasonGrass:{value:new THREE.Color(1,1,1)},uSeasonBloom:{value:SEASONS.summer.look.bloom},
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
