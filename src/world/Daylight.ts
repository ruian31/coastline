import * as THREE from 'three';

// The photographed Kloppenheim06 opening, shared by sky, water and shadows.
export const GOLDEN_HOUR_SUN=new THREE.Vector3(.7557054630227001,.08121144680959244,.6498568719839308);
export const GOLDEN_HOUR_SKY_INTENSITY=.26;

export type DaylightId='dawn'|'day'|'golden'|'dusk'|'night';
export type DaylightPreset={
 id:DaylightId;label:string;clock:string;asset?:string;gain:number;rotation:number;
 direction:readonly number[];sky:number;environment:number;sunColor:string;sunIntensity:number;
 hemiSky:string;hemiGround:string;hemiIntensity:number;fog:string;waterLight:number;glitter:readonly number[];
};

/** Fixed representative hours are the first F07 slice. Continuous time and
 * transitions will use the same coupled sky/light/water state in a later step. */
export const DAYLIGHT_PRESETS:readonly DaylightPreset[]=[
 {id:'dawn',label:'晨曦海岸',clock:'06:10',asset:'qwantani_sunrise_puresky',gain:1,rotation:Math.PI,direction:[-.808195736442181,.03374117185137758,-.5879465833889813],sky:.2,environment:.3,sunColor:'#ffcca1',sunIntensity:1.9,hemiSky:'#a2b8d7',hemiGround:'#706258',hemiIntensity:.55,fog:'#a0a5b8',waterLight:.65,glitter:[2.2,1.3,.6]},
 {id:'day',label:'晴朗海岸',clock:'12:00',asset:'qwantani_noon_puresky',gain:2,rotation:0,direction:[.5225342272929596,.7631884172633813,.3801334253421615],sky:1.2,environment:.35,sunColor:'#fff7eb',sunIntensity:2.4,hemiSky:'#b0c9e4',hemiGround:'#8c7f68',hemiIntensity:.65,fog:'#a9bac4',waterLight:1.3,glitter:[3.8,3.4,2.8]},
 {id:'golden',label:'落日海岸',clock:'18:42',gain:1,rotation:0,direction:GOLDEN_HOUR_SUN.toArray(),sky:GOLDEN_HOUR_SKY_INTENSITY,environment:.7,sunColor:'#ffd09a',sunIntensity:2.5,hemiSky:'#a8bddc',hemiGround:'#8f7960',hemiIntensity:.9,fog:'#c8b1b4',waterLight:1,glitter:[2.5,1.35,.49]},
 {id:'dusk',label:'暮色海岸',clock:'19:30',asset:'qwantani_dusk_2_puresky',gain:1,rotation:0,direction:[.756,-.06,.65],sky:.10,environment:.14,sunColor:'#c4caff',sunIntensity:0,hemiSky:'#9a9bc9',hemiGround:'#4b475a',hemiIntensity:.23,fog:'#515874',waterLight:.3,glitter:[.04,.03,.04]},
 {id:'night',label:'月夜海岸',clock:'00:00',asset:'qwantani_moon_noon_puresky',gain:2,rotation:0,direction:[.3946476784031068,.8715950866559511,.290818181770403],sky:.12,environment:.06,sunColor:'#b6c9f5',sunIntensity:.28,hemiSky:'#7489b9',hemiGround:'#303848',hemiIntensity:.17,fog:'#151e32',waterLight:.14,glitter:[.22,.3,.45]},
];
export const isDaylightId=(value:unknown):value is DaylightId=>DAYLIGHT_PRESETS.some(p=>p.id===value);
export const getDaylightPreset=(id:DaylightId)=>DAYLIGHT_PRESETS.find(p=>p.id===id)!;
