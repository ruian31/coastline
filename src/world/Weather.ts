export type WeatherId='clear'|'cloudy'|'fog'|'drizzle';
export type WeatherValues={cloud:number;mist:number;rain:number;wind:number};
export const WEATHER:Record<WeatherId,{label:string;values:WeatherValues}>={
 clear:{label:'晴朗海岸',values:{cloud:0,mist:0,rain:0,wind:1}},
 cloudy:{label:'云影漫行',values:{cloud:.68,mist:.12,rain:0,wind:1.16}},
 fog:{label:'轻雾入海',values:{cloud:.8,mist:1,rain:0,wind:.78}},
 drizzle:{label:'海岸细雨',values:{cloud:1,mist:.32,rain:.72,wind:1.24}},
};
export const isWeatherId=(value:unknown):value is WeatherId=>typeof value==='string'&&Object.hasOwn(WEATHER,value);
// The sunny intervals are deliberately longer than either mist or rain.
const journey:readonly (readonly [WeatherId,number])[]=[['clear',360],['cloudy',180],['clear',300],['fog',120],['clear',360],['cloudy',120],['drizzle',90],['cloudy',120]];
const keys=['cloud','mist','rain','wind'] as const;

/** One clock drives the atmospheric, surface, wind and audio consumers. Pausing
 * never advances it; choosing a new target starts at the currently visible state. */
export class CoastalWeather {
 target:WeatherId='clear';natural=false;readonly value:WeatherValues={...WEATHER.clear.values};wetness=0;seconds=0;
 private from:WeatherValues={...this.value};private progress=1;private stage=0;private hold=journey[0][1];
 select(id:WeatherId,immediate=false){
  this.target=id;this.from={...this.value};this.progress=immediate?1:0;
  if(immediate)Object.assign(this.value,WEATHER[id].values);
 }
 setNatural(enabled:boolean){this.natural=enabled;this.stage=Math.max(0,journey.findIndex(([id])=>id===this.target));this.hold=journey[this.stage][1];}
 advance(seconds:number,active:boolean){
  if(!active||!Number.isFinite(seconds)||seconds<=0)return;
  // Bounded substeps make a long controlled replay follow the same transition
  // and rain wetting/drying process as ordinary frames.
  let remaining=seconds;
  while(remaining>1e-8){const dt=Math.min(remaining,.25);remaining-=dt;this.seconds+=dt;
   if(this.natural){this.hold-=dt;if(this.hold<=0){this.stage=(this.stage+1)%journey.length;this.select(journey[this.stage][0]);this.hold+=journey[this.stage][1];}}
   this.progress=Math.min(1,this.progress+dt/45);if(this.progress>1-1e-10)this.progress=1;const t=this.progress*this.progress*(3-2*this.progress);
   for(const key of keys)this.value[key]=this.from[key]+(WEATHER[this.target].values[key]-this.from[key])*t;
   const wetTarget=this.value.rain;this.wetness+=(wetTarget-this.wetness)*(1-Math.exp(-dt/(wetTarget>this.wetness?40:180)));
  }
 }
 get transitioning(){return this.progress<1;}
 snapshot(){return{target:this.target,natural:this.natural,value:{...this.value},from:{...this.from},progress:this.progress,wetness:this.wetness,seconds:this.seconds,stage:this.stage,hold:this.hold};}
 restore(saved:unknown){
  if(!saved||typeof saved!=='object')return false;const s=saved as ReturnType<CoastalWeather['snapshot']>;
  const finite=(v:unknown,min:number,max=Infinity):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
  const values=(v:WeatherValues)=>v&&keys.every(key=>finite(v[key],0,key==='wind'?3:1));
  if(!isWeatherId(s.target)||typeof s.natural!=='boolean'||!values(s.value)||!values(s.from)||!finite(s.progress,0,1)||!finite(s.wetness,0,1)||!finite(s.seconds,0)||!Number.isInteger(s.stage)||s.stage<0||s.stage>=journey.length||!finite(s.hold,0,360))return false;
  this.target=s.target;this.natural=s.natural;Object.assign(this.value,s.value);this.from={...s.from};this.progress=s.progress;this.wetness=s.wetness;this.seconds=s.seconds;this.stage=s.stage;this.hold=s.hold;return true;
 }
 get diagnostics(){return{target:this.target,natural:this.natural,transitioning:this.transitioning,seconds:this.seconds,...this.value,wetness:this.wetness};}
}
