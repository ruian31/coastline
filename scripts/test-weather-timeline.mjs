import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',logLevel:'error'});
try{
 const {CoastalWeather,WEATHER,isWeatherId}=await server.ssrLoadModule('/src/world/Weather.ts');
 for(const id of['clear','cloudy','fog','drizzle'])assert.ok(isWeatherId(id));
 for(const id of['__proto__','constructor',null,NaN,'storm'])assert.ok(!isWeatherId(id));
 const w=new CoastalWeather();const initial=JSON.stringify(w.diagnostics);w.advance(120,false);w.advance(NaN,true);w.advance(-1,true);assert.equal(JSON.stringify(w.diagnostics),initial);
 w.select('fog');const rows=[];let previous={...w.value};
 for(let i=0;i<2700;i++){
  w.advance(1/60,true);for(const key of['cloud','mist','rain','wind']){assert.ok(Number.isFinite(w.value[key]));assert.ok(Math.abs(w.value[key]-previous[key])<.001);}
  previous={...w.value};if(i%900===0)rows.push({...w.diagnostics});
 }
 assert.deepEqual(w.value,WEATHER.fog.values);assert.equal(w.transitioning,false);
 w.select('clear');w.advance(13,true);const before={...w.value};w.select('drizzle');assert.deepEqual(w.value,before);w.advance(180,true);assert.deepEqual(w.value,WEATHER.drizzle.values);assert.ok(w.wetness>.68&&w.wetness<.72);
 const wet=w.wetness;w.select('clear');assert.equal(w.wetness,wet);w.advance(120,true);assert.ok(w.wetness>0&&w.wetness<wet);rows.push({...w.diagnostics});
 const a=new CoastalWeather(),b=new CoastalWeather();a.setNatural(true);b.setNatural(true);a.advance(1800,true);for(let i=0;i<7200;i++)b.advance(.25,true);assert.deepEqual(a.diagnostics,b.diagnostics);
 const pause=JSON.stringify(a.diagnostics);a.advance(3600,false);assert.equal(JSON.stringify(a.diagnostics),pause);
 const rainStart=new CoastalWeather();rainStart.select('drizzle',true);rainStart.setNatural(true);rainStart.advance(90,true);assert.equal(rainStart.target,'cloudy');
 const sequence=new CoastalWeather();sequence.setNatural(true);const targets=[];
 for(let i=0;i<1650*4;i++){sequence.advance(.25,true);if(targets.at(-1)?.id!==sequence.target)targets.push({at:sequence.seconds,id:sequence.target});for(const value of Object.values(sequence.value))assert.ok(Number.isFinite(value)&&value>=0&&value<=1.25);}
 assert.deepEqual(targets.map(t=>t.id),['clear','cloudy','clear','fog','clear','cloudy','drizzle','cloudy','clear']);
 const original=new CoastalWeather();original.select('drizzle');original.advance(17.25,true);original.setNatural(true);
 const restored=new CoastalWeather();assert.ok(restored.restore(JSON.parse(JSON.stringify(original.snapshot()))));assert.deepEqual(restored.snapshot(),original.snapshot());original.advance(90,true);restored.advance(90,true);assert.deepEqual(restored.snapshot(),original.snapshot());
 for(const invalid of[null,{}, {...original.snapshot(),target:'__proto__'},{...original.snapshot(),value:{cloud:NaN}},{...original.snapshot(),wetness:4},{...original.snapshot(),hold:-1}]){const before=JSON.stringify(restored.snapshot());assert.equal(restored.restore(invalid),false);assert.equal(JSON.stringify(restored.snapshot()),before);}
 const report={scope:'Authoritative CPU weather clock: finite values,45s continuous manual transition/interruption, inactive freeze, gradual wet/dry, deterministic1800s replay, sunny-majority1650s journey, exact mid-transition snapshot replay and atomic rejection of invalid snapshots. Not rendered/weather/audio/vehicle acceptance.',rows,targets,final:a.diagnostics};
 const out=process.env.WEATHER_EVIDENCE??'artifacts/weather-m78';await mkdir(out,{recursive:true});await writeFile(out+'/timeline-cpu.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:true,targets,wetting:wet,dried:w.wetness}));
}finally{await server.close();}
