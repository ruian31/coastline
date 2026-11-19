import * as THREE from 'three';
import type {SeasonLighting} from './Season';

// The photographed Kloppenheim06 opening, shared by sky, water and shadows.
export const GOLDEN_HOUR_SUN=new THREE.Vector3(.7557054630227001,.08121144680959244,.6498568719839308);
export const GOLDEN_HOUR_SKY_INTENSITY=.26;

/** Compress strong highlights and add diffuse warm horizon radiance once,
 * before the same half-float photo feeds the sky, sea and reflections. */
export function softenGoldenHour(texture:THREE.DataTexture) {
 const {data,width,height}=texture.image;
 if(!(data instanceof Uint16Array)||data.length!==width*height*4)return;
 const azimuth=Math.atan2(GOLDEN_HOUR_SUN.z,GOLDEN_HOUR_SUN.x);
 const horizonScatter=new Float32Array(width);
 for(let x=0;x<width;x++){
  const longitude=((x+.5)/width-.5)*Math.PI*2;
  horizonScatter[x]=.19*(.36+.64*Math.max(0,Math.cos(longitude-azimuth)));
 }
 const {fromHalfFloat,toHalfFloat}=THREE.DataUtils;
 for(let y=0;y<height;y++){
  const elevation=(.5-(y+.5)/height)*Math.PI;
  const horizon=Math.exp(-((elevation/.27)**2));
  const diffuse=.10+Math.exp(-((elevation/.42)**2))*.08;
  for(let x=0;x<width;x++){
   const pixel=(y*width+x)*4;
   const r=fromHalfFloat(data[pixel]),g=fromHalfFloat(data[pixel+1]),b=fromHalfFloat(data[pixel+2]);
   const luma=.2126*r+.7152*g+.0722*b;
   const shoulder=1/(1+.13*Math.max(0,luma-1.4));
   const scatter=horizon*horizonScatter[x];
   data[pixel]=toHalfFloat((r+(luma-r)*diffuse)*shoulder+scatter*1.2);
   data[pixel+1]=toHalfFloat((g+(luma-g)*diffuse)*shoulder+scatter*.87);
   data[pixel+2]=toHalfFloat((b+(luma-b)*diffuse)*shoulder+scatter*.64);
  }
 }
}

export type DaylightId='dawn'|'day'|'golden'|'dusk'|'night';
export type DaylightPreset={
 id:DaylightId;label:string;clock:string;asset?:string;gain:number;rotation:number;
 direction:readonly number[];sky:number;environment:number;sunColor:THREE.ColorRepresentation;sunIntensity:number;
 hemiSky:THREE.ColorRepresentation;hemiGround:THREE.ColorRepresentation;hemiIntensity:number;fog:THREE.ColorRepresentation;waterHorizon?:THREE.ColorRepresentation;waterLight:number;glitter:readonly number[];
};

/** Fixed representative hours preserve the default sunset. Optional continuous
 * time samples these same authored sky/light/water roles. */
export const DAYLIGHT_PRESETS:readonly DaylightPreset[]=[
 {id:'dawn',label:'晨曦海岸',clock:'06:10',asset:'qwantani_sunrise_puresky',gain:1,rotation:Math.PI,direction:[-.808195736442181,.03374117185137758,-.5879465833889813],sky:.2,environment:.3,sunColor:'#ffcca1',sunIntensity:1.9,hemiSky:'#a2b8d7',hemiGround:'#706258',hemiIntensity:.55,fog:'#a0a5b8',waterLight:.65,glitter:[2.2,1.3,.6]},
 {id:'day',label:'晴朗海岸',clock:'12:00',asset:'qwantani_noon_puresky',gain:2,rotation:0,direction:[.5225342272929596,.7631884172633813,.3801334253421615],sky:1.2,environment:.35,sunColor:'#fff7eb',sunIntensity:2.4,hemiSky:'#b0c9e4',hemiGround:'#8c7f68',hemiIntensity:.65,fog:'#a9bac4',waterLight:1.3,glitter:[3.8,3.4,2.8]},
 {id:'golden',label:'落日海岸',clock:'18:42',gain:1,rotation:0,direction:GOLDEN_HOUR_SUN.toArray(),sky:GOLDEN_HOUR_SKY_INTENSITY,environment:.7,sunColor:'#ffd09a',sunIntensity:2.5,hemiSky:'#a8bddc',hemiGround:'#8f7960',hemiIntensity:.9,fog:'#c8b1b4',waterHorizon:new THREE.Color().setRGB(.51,.32,.28),waterLight:1,glitter:[2.5,1.35,.49]},
 {id:'dusk',label:'暮色海岸',clock:'19:30',asset:'qwantani_dusk_2_puresky',gain:1,rotation:0,direction:[.756,-.06,.65],sky:.10,environment:.14,sunColor:'#c4caff',sunIntensity:0,hemiSky:'#9a9bc9',hemiGround:'#4b475a',hemiIntensity:.23,fog:'#515874',waterLight:.3,glitter:[.04,.03,.04]},
 {id:'night',label:'月夜海岸',clock:'00:00',asset:'qwantani_moon_noon_puresky',gain:2,rotation:0,direction:[.3946476784031068,.8715950866559511,.290818181770403],sky:.12,environment:.06,sunColor:'#b6c9f5',sunIntensity:.28,hemiSky:'#7489b9',hemiGround:'#303848',hemiIntensity:.17,fog:'#151e32',waterLight:.14,glitter:[.22,.3,.45]},
];
export const isDaylightId=(value:unknown):value is DaylightId=>DAYLIGHT_PRESETS.some(p=>p.id===value);
export const getDaylightPreset=(id:DaylightId)=>DAYLIGHT_PRESETS.find(p=>p.id===id)!;

/** Authored seasonal radiance, independent of solar direction/day length.
 * Keep summer's objects and exact coefficients untouched. */
export function seasonalDaylight(p:DaylightPreset,l:Readonly<SeasonLighting>):DaylightPreset{
 if(l.sky===1&&l.sun===1&&l.ambient===1&&l.warmth===0)return p;
 const w=l.warmth,tint=new THREE.Color().setRGB(1+w*.65,1+w*.15,1-w*.8),soft=new THREE.Color().setRGB(1+w*.25,1,1-w*.35);
 const color=(c:THREE.ColorRepresentation,t:THREE.Color)=>new THREE.Color(c).multiply(t);
 return{...p,sky:p.sky*l.sky,environment:p.environment*l.ambient,sunIntensity:p.sunIntensity*l.sun,sunColor:color(p.sunColor,tint),hemiIntensity:p.hemiIntensity*l.ambient,hemiSky:color(p.hemiSky,soft),hemiGround:color(p.hemiGround,soft),fog:color(p.fog,soft),waterHorizon:color(p.waterHorizon??p.fog,soft),waterLight:p.waterLight*l.ambient,glitter:p.glitter.map((v,i)=>v*[tint.r,tint.g,tint.b][i]*l.sun)};
}

export const DAYLIGHT_HOURS:Record<DaylightId,number>={dawn:6+10/60,day:12,golden:18+42/60,dusk:19.5,night:0};
export const DAYLIGHT_CYCLE_SECONDS=1800;
// Keep the low-sun cloudy photograph close to sunset, so latitude alignment
// does not stretch its cloud shafts through a bright afternoon sky.
export const DAYLIGHT_KEYS:readonly (readonly [number,DaylightId])[]=[[0,'night'],[5,'night'],[DAYLIGHT_HOURS.dawn,'dawn'],[9,'day'],[18,'day'],[18.7,'golden'],[19.5,'dusk'],[21,'night'],[24,'night']];
export function wrapDaylightHour(hour:number){if(!Number.isFinite(hour))throw new RangeError('Invalid daylight hour');return hour>=0&&hour<24?hour:((hour%24)+24)%24;}
export function formatDaylightHour(hour:number){const minutes=Math.floor(wrapDaylightHour(hour)*60+1e-7)%1440;return String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');}
export function advanceDaylightHour(hour:number,seconds:number,active:boolean){
 return wrapDaylightHour(hour+(active&&Number.isFinite(seconds)&&seconds>0?seconds*24/DAYLIGHT_CYCLE_SECONDS:0));
}

/** Continuous celestial motion is independent of the photographic keyframes.
 * The photos provide cloud detail and color; their old luminaries are removed
 * by the cycle renderer so crossfades do not create two stationary suns. */
export function sampleDaylight(hour:number){
 hour=wrapDaylightHour(hour);let index=0;while(index<DAYLIGHT_KEYS.length-2&&hour>=DAYLIGHT_KEYS[index+1][0])index++;
 const [at,aId]=DAYLIGHT_KEYS[index],[bt,bId]=DAYLIGHT_KEYS[index+1],a=getDaylightPreset(aId),b=getDaylightPreset(bId),linear=(hour-at)/(bt-at),blend=linear*linear*(3-2*linear);
 const mix=(a:number,b:number)=>THREE.MathUtils.lerp(a,b,blend),color=(a:THREE.ColorRepresentation,b:THREE.ColorRepresentation)=>new THREE.Color(a).lerp(new THREE.Color(b),blend);
 const phase=hour>=6&&hour<19?(hour-6)/13*Math.PI:((hour<6?hour+24:hour)-19)/11*Math.PI+Math.PI;
 const altitude=.9*Math.sin(phase),azimuth=Math.atan2(GOLDEN_HOUR_SUN.z,GOLDEN_HOUR_SUN.x)+Math.PI+phase;
 const sun=new THREE.Vector3(Math.cos(azimuth)*Math.sqrt(1-altitude*altitude),altitude,Math.sin(azimuth)*Math.sqrt(1-altitude*altitude)),moon=sun.clone().negate(),night=altitude<0,direction=night?moon:sun;
 const visible=THREE.MathUtils.smoothstep(direction.y,0,night?.2:.04);
 const preset:DaylightPreset={...a,gain:1,rotation:0,direction:direction.toArray(),sky:1,environment:1,sunColor:color(a.sunColor,b.sunColor),sunIntensity:night?.28*visible*THREE.MathUtils.smoothstep(hour<6?6-hour:hour-19,0,2):mix(a.sunIntensity,b.sunIntensity)*visible,hemiSky:color(a.hemiSky,b.hemiSky),hemiGround:color(a.hemiGround,b.hemiGround),hemiIntensity:mix(a.hemiIntensity,b.hemiIntensity),fog:color(a.fog,b.fog),waterHorizon:color(a.waterHorizon??a.fog,b.waterHorizon??b.fog),waterLight:mix(a.waterLight,b.waterLight),glitter:(night?[.22,.3,.45]:a.glitter.map((v,i)=>mix(v,b.glitter[i]))).map(v=>v*visible)};
 return{hour,index,a,b,blend,sun,moon,night,preset};
}
