import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.SEASON_EVIDENCE??'artifacts/seasons-m80';await mkdir(out,{recursive:true});
const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',logLevel:'error'});
try{
 const{CoastalSeasons,SEASONS,isSeasonId}=await server.ssrLoadModule('/src/world/Season.ts');
 for(const id of ['spring','summer','autumn','winter'])assert.equal(isSeasonId(id),true);
 for(const id of ['__proto__','constructor',null,NaN,'monsoon'])assert.equal(isSeasonId(id),false);
 const s=new CoastalSeasons(),initial=JSON.stringify(s.diagnostics),rows=[];
 for(const [seconds,active]of [[10,false],[NaN,true],[Infinity,true],[-1,true],[0,true]]){assert.equal(s.advance(seconds,active),false);assert.equal(JSON.stringify(s.diagnostics),initial);}
 s.select('spring');let previous=structuredClone(s.value);
 for(let i=0;i<3600;i++){assert.equal(s.advance(1/60,true),true);assert.ok(s.value.amount>=previous.amount);for(const key of ['ground','grass'])for(let k=0;k<3;k++){assert.ok(Number.isFinite(s.value[key][k]));assert.ok(Math.abs(s.value[key][k]-previous[key][k])<.001);}previous=structuredClone(s.value);if(i%1200===0)rows.push(structuredClone(s.diagnostics));}
 assert.deepEqual(s.value,SEASONS.spring.look);assert.equal(s.diagnostics.transitioning,false);
 s.select('summer');s.advance(17.25,true);const mid=structuredClone(s.value),frozen=JSON.stringify(s.diagnostics);assert.equal(s.advance(120,false),false);assert.equal(JSON.stringify(s.diagnostics),frozen);s.select('winter');assert.deepEqual(s.value,mid);s.advance(60,true);assert.deepEqual(s.value,SEASONS.winter.look);
 for(const id of ['autumn','summer','spring','summer']){s.select(id);s.advance(60,true);assert.deepEqual(s.value,SEASONS[id].look);rows.push(structuredClone(s.diagnostics));}
 const table=JSON.stringify(SEASONS);s.value.grass[0]=500;assert.equal(JSON.stringify(SEASONS),table);
 const report={scope:'CPU manual60-second linear-reflectance seasonal palette transition, inactive freeze, interruption continuity, exact target endpoints and no aliasing of palette constants. Internal surface phase only; not flowers, seasonal lighting, menu, year cycle or gameplay acceptance.',rows,default:JSON.parse(initial)};await writeFile(out+'/timeline-cpu.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:true,rows:rows.length}));
}finally{await server.close();}
