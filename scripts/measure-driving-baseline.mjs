// CPU observation harness. Calls the current Driving.update; no alternative
// dynamics, browser, renderer, acceleration replay, or expected handling score.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'artifacts/driving-m60-baseline');
await mkdir(output,{recursive:true});
const DT=1/60,INITIAL_SPEED=12,STOP_THRESHOLD=.2;
const EMPTY={throttle:0,brake:0,steer:0,handbrake:false};
const sourceFiles=['src/systems/Driving.ts','src/world/roads.ts','src/vehicles/Convertible.ts','src/game/OceanDrive.ts'];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const sources=await Promise.all(sourceFiles.map(async file=>{const bytes=await readFile(path.join(root,file));return{file,sha256:hash(bytes),text:bytes.toString('utf8')};}));
const source=file=>sources.find(record=>record.file===file).text;

// Extract the current rendered tyre-bottom contact coordinates rather than
// constructing the car's canvas textures/geometry in Node. Stop if the source
// contract changes, instead of silently continuing with stale dimensions.
const vehicle=source('src/vehicles/Convertible.ts');
const wheelLoop=vehicle.match(/for\s*\(const z of \[([^\]]+)\]\)\s*for\s*\(const x of \[([^\]]+)\]\)/);
const wheelCentre=vehicle.match(/steering\.position\.set\(x,\s*([\d.]+),\s*z\)/);
const tyreBottom=vehicle.match(/wheelContacts\.push\(V\(x,steering\.position\.y-([\d.]+),z\)\)/);
assert.ok(wheelLoop&&wheelCentre&&tyreBottom,'Rendered tyre contact source contract changed');
const zCoordinates=wheelLoop[1].split(',').map(Number),xCoordinates=wheelLoop[2].split(',').map(Number);
assert.equal(zCoordinates.length,2);assert.equal(xCoordinates.length,2);
const localFeet=zCoordinates.flatMap(z=>xCoordinates.map(x=>({x,y:Number(wheelCentre[1])-Number(tyreBottom[1]),z})));
assert.ok(localFeet.every(p=>Object.values(p).every(Number.isFinite)));
const modelNames=[...vehicle.matchAll(/\{ name: '([^']+)'/g)].map(match=>match[1]);
assert.equal(modelNames.length,3,'This finite measurement set expects the current three cars');
const game=source('src/game/OceanDrive.ts');
assert.ok(game.includes('this.car.root.position.y-=ROAD_POSITION_CLEARANCE;'),'Vehicle root clearance contract changed');
assert.ok(game.includes("this.driving.roll-this.driving.steer*Math.min(Math.abs(this.driving.speed)/25,1)*.025,'YXZ'"),'Rendered roll/orientation contract changed');

const method={
  kind:'CPU measurements of current source, not a real-input acceleration or suspension video',
  fixedStepSeconds:DT,initialSpeedMps:INITIAL_SPEED,
  initialization:'Set position/yaw; settle at zero speed for 120 actual update steps; assign speed=12 m/s once. This is a declared test initial condition, not user acceleration.',
  controls:'Every measured step calls current Driving.update(1/60, input). All measured cases have zero throttle; brake case holds brake=1 for its complete bounded interval.',
  offroad:'Controlled fields are at world (1200,1200), far from every road. Existing offroad drag remains enabled. No comparison treats this as asphalt friction.',
  road:'Additional short windows start at actual coast.sample(.18), offset 1.7 m, tangent heading, using the current roadSurfaceHeight/nearestRoad and heightAt terrain fallback. No autopilot, steering assistance, scene props, or renderer. Road-only status is measured, not assumed.',
  stop:'First sample speed<=0.2 m/s is the low-speed stopping threshold. First speed<=0 is a separate sampled event. A zero-crossing estimate linearly interpolates the two speed samples; it is not an exact continuous physics event. Continued braking may subsequently reverse.',
  motion:'XZ and 3D velocities come from successive positions divided by dt. Heading error compares actual XZ displacement direction to the end-of-step body yaw; reverse travel therefore has approximately pi error. Lateral velocity projects measured displacement onto the body right axis.',
  acceleration:'World acceleration is the difference of two observed displacement-velocity intervals divided by dt. Lateral acceleration uses the midpoint heading of those intervals. First-step acceleration is null; no acceleration is inferred from the assigned initial speed.',
  tyreError:'Transform extracted rendered tyre-bottom local points by the existing updateCar YXZ body pose (including visual steering roll), subtracting ROAD_POSITION_CLEARANCE from root Y. Compare each transformed bottom with the analytic ground at that exact XZ; in road windows query the actual exported roadSurfaceHeight over heightAt instead, so the road deck is not mistaken for wheel hover above its underlying terrain. This estimates CPU geometric gap/burial, without wheel suspension, rendered deformation, or video claims.',
  tyreSign:'Positive error means wheel bottom above ground; negative means burial. 2 cm threshold counts are descriptive, not acceptance thresholds.',
  unevenGround:{base:10,origin:[1200,1200],terms:[{amplitude:.09,axis:'z',wavelength:3.5,phase:0},{amplitude:.045,axis:'x',wavelength:5,phase:.6},{amplitude:.035,axis:'x+z',wavelength:2.4,phase:0}],formula:'10 + .09*sin(2*pi*(z-1200)/3.5) + .045*sin(2*pi*(x-1200)/5 + .6) + .035*sin(2*pi*(x+z-2400)/2.4)'},
  finiteDurationsSeconds:{'field-coast':24,'field-brake':4,'field-steer-return':6,'field-small-undulations':8,'road-coast-short':2,'road-brake':4},
};

const server=await createServer({root,configFile:false,cacheDir:path.join(output,'vite-cache'),logLevel:'error',server:{middlewareMode:true,watch:null,hmr:false},appType:'custom',optimizeDeps:{noDiscovery:true,include:[]}});
try{
  const {Driving,ROAD_POSITION_CLEARANCE}=await server.ssrLoadModule('/src/systems/Driving.ts');
  const {heightAt,nearestRoad,roadSurfaceHeight}=await server.ssrLoadModule('/src/world/roads.ts');
  const THREE=await server.ssrLoadModule('three');
  const wrap=angle=>Math.atan2(Math.sin(angle),Math.cos(angle));
  const level=()=>10;
  const undulations=(x,z)=>10+.09*Math.sin(2*Math.PI*(z-1200)/3.5)+.045*Math.sin(2*Math.PI*(x-1200)/5+.6)+.035*Math.sin(2*Math.PI*(x+z-2400)/2.4);
  const scenarios=[
    {id:'field-coast',surface:'controlled-flat-offroad',seconds:24,ground:level,input:()=>({...EMPTY})},
    {id:'field-brake',surface:'controlled-flat-offroad',seconds:4,ground:level,input:()=>({...EMPTY,brake:1})},
    {id:'field-steer-return',surface:'controlled-flat-offroad',seconds:6,ground:level,input:step=>({...EMPTY,steer:step<60?1:0})},
    {id:'field-small-undulations',surface:'controlled-continuous-undulations-offroad',seconds:8,ground:undulations,input:()=>({...EMPTY})},
    {id:'road-coast-short',surface:'actual-coast-route-with-heightAt-fallback',seconds:2,ground:heightAt,road:true,input:()=>({...EMPTY})},
    {id:'road-brake',surface:'actual-coast-route-with-heightAt-fallback',seconds:4,ground:heightAt,road:true,input:()=>({...EMPTY,brake:1})},
  ];
  const pose=new THREE.Matrix4(),quaternion=new THREE.Quaternion(),euler=new THREE.Euler(),rootPosition=new THREE.Vector3(),point=new THREE.Vector3(),scale=new THREE.Vector3(1,1,1);
  function tyres(d,ground){
    rootPosition.copy(d.position);rootPosition.y-=ROAD_POSITION_CLEARANCE;
    const visualRoll=d.roll-d.steer*Math.min(Math.abs(d.speed)/25,1)*.025;
    quaternion.setFromEuler(euler.set(d.pitch,d.yaw,visualRoll,'YXZ'));
    pose.compose(rootPosition,quaternion,scale);
    return localFeet.map((local,index)=>{
      point.set(local.x,local.y,local.z).applyMatrix4(pose);
      const groundY=ground(point.x,point.z);
      return{index,world:{x:point.x,y:point.y,z:point.z},groundY,errorMetres:point.y-groundY};
    });
  }
  function state(d,time,input,motion,distance,initialYaw,ground){
    return{timeSeconds:time,input,speedMps:d.speed,speedKph:d.speed*3.6,position:{x:d.position.x,y:d.position.y,z:d.position.z},yawRadians:d.yaw,headingFromStartRadians:wrap(d.yaw-initialYaw),steer:d.steer,pitchRadians:d.pitch,rollRadians:d.roll,offroad:d.offroad,hit:d.hit,road:{id:d.road.route.id,t:d.road.t,distanceMetres:d.road.distance},travelledXZMetres:distance,motion,tyres:tyres(d,ground)};
  }
  const percentile=(values,q)=>{const sorted=[...values].sort((a,b)=>a-b);if(!sorted.length)return null;const at=(sorted.length-1)*q,lo=Math.floor(at),hi=Math.ceil(at);return sorted[lo]+(sorted[hi]-sorted[lo])*(at-lo);};
  const event=sample=>sample?{timeSeconds:sample.timeSeconds,speedMps:sample.speedMps,travelledXZMetres:sample.travelledXZMetres,position:sample.position}:null;
  function summarize(samples,scenario){
    const live=samples.slice(1),moving=live.filter(s=>s.motion.speedXZ>.01),firstLow=live.find(s=>s.speedMps<=STOP_THRESHOLD),zeroIndex=samples.findIndex((s,i)=>i>0&&s.speedMps<=0);
    let zeroEstimate=null;
    if(zeroIndex>0){const before=samples[zeroIndex-1],after=samples[zeroIndex],fraction=before.speedMps/(before.speedMps-after.speedMps);zeroEstimate={timeSeconds:before.timeSeconds+fraction*DT,travelledXZMetres:before.travelledXZMetres+fraction*(after.travelledXZMetres-before.travelledXZMetres),sampleBracketSeconds:[before.timeSeconds,after.timeSeconds],distanceBracketMetres:[before.travelledXZMetres,after.travelledXZMetres]};}
    const errors=live.flatMap(s=>s.tyres.map(tyre=>tyre.errorMetres)),absErrors=errors.map(Math.abs),lateralAcceleration=live.filter(s=>s.motion.lateralAccelerationMps2!==null);
    let worstTyre=null;
    for(const sample of live)for(const tyre of sample.tyres)if(!worstTyre||Math.abs(tyre.errorMetres)>Math.abs(worstTyre.errorMetres))worstTyre={timeSeconds:sample.timeSeconds,index:tyre.index,errorMetres:tyre.errorMetres,world:tyre.world,groundY:tyre.groundY,carPosition:sample.position,pitchRadians:sample.pitchRadians,rollRadians:sample.rollRadians};
    const closestToTime=t=>samples.reduce((a,b)=>Math.abs(a.timeSeconds-t)<Math.abs(b.timeSeconds-t)?a:b);
    const start=samples[0],last=samples.at(-1),atOne=closestToTime(1),atTwo=closestToTime(2),atThree=closestToTime(3);
    return{
      surface:scenario.surface,seconds:last.timeSeconds,steps:live.length,initialSpeedMps:start.speedMps,finalSpeedMps:last.speedMps,speedAt1Second:atOne.speedMps,speedAt2Seconds:atTwo.speedMps,speedAt3Seconds:atThree.speedMps,
      travelledXZMetres:last.travelledXZMetres,netDisplacementXZMetres:Math.hypot(last.position.x-start.position.x,last.position.z-start.position.z),
      stoppingThresholdMps:STOP_THRESHOLD,firstLowSpeed:event(firstLow),firstNonForward:zeroIndex>0?event(samples[zeroIndex]):null,interpolatedZeroCrossing:zeroEstimate,
      reversedDuringRun:live.some(s=>s.speedMps<0),minimumSpeedMps:Math.min(...samples.map(s=>s.speedMps)),maximumAbsoluteHeadingFromStartRadians:Math.max(...live.map(s=>Math.abs(s.headingFromStartRadians))),headingAt1SecondRadians:atOne.headingFromStartRadians,headingAt2SecondsRadians:atTwo.headingFromStartRadians,steerAt1Second:atOne.steer,steerAt2Seconds:atTwo.steer,
      maximumAbsoluteVelocityHeadingErrorRadians:moving.length?Math.max(...moving.map(s=>Math.abs(s.motion.velocityHeadingErrorRadians))):null,
      maximumAbsoluteLateralVelocityMps:Math.max(...live.map(s=>Math.abs(s.motion.lateralVelocityMps))),
      peakAbsoluteLateralAccelerationMps2:lateralAcceleration.length?Math.max(...lateralAcceleration.map(s=>Math.abs(s.motion.lateralAccelerationMps2))):null,
      maximumDisplacementSpeedVsScalarSpeedErrorMps:Math.max(...live.map(s=>Math.abs(s.motion.speedXZ-Math.abs(s.speedMps)))),
      offroadSamples:live.filter(s=>s.offroad).length,onroadSamples:live.filter(s=>!s.offroad).length,collisionSamples:live.filter(s=>s.hit).length,minimumRoadDistanceMetres:Math.min(...samples.map(s=>s.road.distanceMetres)),roadOnlyForWholeRun:live.every(s=>!s.offroad),
      tyreError:{count:errors.length,signedMinMetres:Math.min(...errors),signedMaxMetres:Math.max(...errors),absoluteP50Metres:percentile(absErrors,.5),absoluteP95Metres:percentile(absErrors,.95),absoluteP99Metres:percentile(absErrors,.99),absoluteMaxMetres:Math.max(...absErrors),rmsMetres:Math.sqrt(errors.reduce((sum,error)=>sum+error*error,0)/errors.length),aboveGroundByOver2cm:errors.filter(e=>e>.02).length,belowGroundByOver2cm:errors.filter(e=>e<-.02).length,worstSample:worstTyre},
    };
  }
  function run(modelIndex,scenario){
    const d=new Driving();d.modelIndex=modelIndex;d.setTerrain(scenario.ground);
    const contactSurface=scenario.road?(x,z)=>roadSurfaceHeight(nearestRoad(x,z),x,z,scenario.ground):scenario.ground;
    if(scenario.road)d.teleport(.18);
    else{d.position.set(1200,scenario.ground(1200,1200)+ROAD_POSITION_CLEARANCE,1200);d.yaw=.37;d.pitch=0;d.roll=0;d.speed=0;d.setAutomatic(false);}
    for(let step=0;step<120;step++)d.update(DT,EMPTY);
    d.speed=INITIAL_SPEED;d.distance=0;
    const initialYaw=d.yaw;
    const samples=[state(d,0,null,null,0,initialYaw,contactSurface)];
    let previousVelocity=null,distance=0;
    for(let step=0;step<Math.round(scenario.seconds/DT);step++){
      const before={x:d.position.x,y:d.position.y,z:d.position.z,yaw:d.yaw},input=scenario.input(step);
      d.update(DT,input);
      const vx=(d.position.x-before.x)/DT,vy=(d.position.y-before.y)/DT,vz=(d.position.z-before.z)/DT,speedXZ=Math.hypot(vx,vz),velocityYaw=speedXZ>1e-8?Math.atan2(vx,vz):null;
      distance+=speedXZ*DT;
      const acceleration=previousVelocity?{x:(vx-previousVelocity.x)/DT,y:(vy-previousVelocity.y)/DT,z:(vz-previousVelocity.z)/DT}:null;
      const accelerationHeading=previousVelocity?previousVelocity.bodyYaw+wrap(d.yaw-previousVelocity.bodyYaw)*.5:null;
      const motion={velocityMps:{x:vx,y:vy,z:vz},speedXZ,speed3D:Math.hypot(vx,vy,vz),velocityYawRadians:velocityYaw,velocityHeadingErrorRadians:velocityYaw===null?null:wrap(velocityYaw-d.yaw),forwardVelocityMps:vx*Math.sin(d.yaw)+vz*Math.cos(d.yaw),lateralVelocityMps:vx*Math.cos(d.yaw)-vz*Math.sin(d.yaw),yawRateRadiansPerSecond:wrap(d.yaw-before.yaw)/DT,accelerationMps2:acceleration,lateralAccelerationMps2:acceleration?acceleration.x*Math.cos(accelerationHeading)-acceleration.z*Math.sin(accelerationHeading):null};
      previousVelocity={x:vx,y:vy,z:vz,bodyYaw:d.yaw};
      const sample=state(d,(step+1)*DT,input,motion,distance,initialYaw,contactSurface);
      assert.ok([sample.speedMps,...Object.values(sample.position),sample.yawRadians,motion.speedXZ,...sample.tyres.map(t=>t.errorMetres)].every(Number.isFinite),'Measurement produced non-finite state');
      samples.push(sample);
    }
    if(!scenario.road)assert.ok(samples.every(s=>s.offroad&&s.road.distanceMetres>250),'Controlled field approached an actual road; relocate the test field');
    return{modelIndex,modelName:modelNames[modelIndex],scenario:scenario.id,surface:scenario.surface,summary:summarize(samples,scenario),samples};
  }
  const results=[];
  for(let modelIndex=0;modelIndex<modelNames.length;modelIndex++)for(const scenario of scenarios)results.push(run(modelIndex,scenario));
  // Determinism is measured by repeating the exact calls; no physics output is
  // prescribed. The second pass must have identical complete raw JSON.
  for(const first of results){const repeat=run(first.modelIndex,scenarios.find(s=>s.id===first.scenario));assert.equal(hash(JSON.stringify(repeat)),hash(JSON.stringify(first)),'Repeated measurement diverged: '+first.scenario);}
  for(const record of sources)assert.equal(hash(await readFile(path.join(root,record.file))),record.sha256,'Source changed during measurement: '+record.file);

  const metadata={schema:1,method,nodeVersion:process.version,platform:process.platform,sourceHashes:sources.map(({file,sha256})=>({file,sha256})),script:{file:'scripts/measure-driving-baseline.mjs',sha256:hash(await readFile(fileURLToPath(import.meta.url)))},ssr:{configFile:false,watch:null,browser:false,gpu:false},modelNames,localTyreBottomContacts:localFeet,wheelCoordinateSource:{loop:wheelLoop[0],centre:wheelCentre[0],bottom:tyreBottom[0]},repeatCheck:{runs:2,exactRawSampleHashesEqual:true},scenarioCount:results.length,stepCountPerPass:results.reduce((sum,r)=>sum+r.summary.steps,0)};
  const files=[];
  async function save(file,value){const text=typeof value==='string'?value:JSON.stringify(value,null,2)+'\n';await writeFile(path.join(output,file),text);files.push({file,bytes:Buffer.byteLength(text),sha256:hash(text)});}
  for(const result of results)await save(`${['classic','gt','sport'][result.modelIndex]}-${result.scenario}.json`,result);
  const sameMeasuredSummariesAcrossCars=scenarios.every(scenario=>{const matches=results.filter(r=>r.scenario===scenario.id);return matches.every(r=>JSON.stringify(r.summary)===JSON.stringify(matches[0].summary));});
  const firstCase=id=>results.find(r=>r.modelIndex===0&&r.scenario===id).summary;
  const fieldCoast=firstCase('field-coast'),roadCoast=firstCase('road-coast-short'),fieldBrake=firstCase('field-brake'),roadBrake=firstCase('road-brake'),steering=firstCase('field-steer-return'),bumps=firstCase('field-small-undulations');
  const observations={sameMeasuredSummariesAcrossCars,scope:'Only the declared zero-throttle initial-speed cases; does not measure user acceleration or top speed',fieldCoastSpeedAt2Seconds:fieldCoast.speedAt2Seconds,roadCoastSpeedAt2Seconds:roadCoast.speedAt2Seconds,fieldFirstLowSpeed:fieldBrake.firstLowSpeed,roadFirstLowSpeed:roadBrake.firstLowSpeed,fieldBrakeFirstNonForward:fieldBrake.firstNonForward,roadBrakeFirstNonForward:roadBrake.firstNonForward,steeringHeadingAt1SecondDegrees:steering.headingAt1SecondRadians*180/Math.PI,steeringPeakLateralAccelerationMps2:steering.peakAbsoluteLateralAccelerationMps2,steeringMaxAbsoluteLateralVelocityMps:steering.maximumAbsoluteLateralVelocityMps,steeringMaxAbsoluteVelocityHeadingErrorRadians:steering.maximumAbsoluteVelocityHeadingErrorRadians,controlledUndulationTyreError:bumps.tyreError};
  const summary={metadata,observations,results:results.map(({modelIndex,modelName,scenario,surface,summary})=>({modelIndex,modelName,scenario,surface,...summary}))};
  await save('summary.json',summary);
  const fmt=(n,digits=4)=>n===null?'n/a':n.toFixed(digits);
  const lines=[
    '# M60 驾驶 CPU 基线','',
    `Driving SHA-256: \`${metadata.sourceHashes[0].sha256}\`。固定步长 1/60 秒；${results.length} 个场景，逐样本完全重复两遍。没有浏览器或 GPU。`,'',
    '**初速 12 m/s 是直接设置的测试初始条件，不是用户实际加速过程。** 离路场地保留生产 offroad 摩擦；道路短窗单独列出。停止阈值为正向速度 ≤0.2 m/s；持续按住刹车后的倒车单独记录。','',
    '## 本次观测','',
    `- 三车在这六类工况中的完整测量汇总${sameMeasuredSummariesAcrossCars?'逐项相同':'存在差异'}。本次未测油门加速或极速，不把此结果外推到那些工况。`,
    `- 松油门2秒，离路受控平地速度 ${fmt(fieldCoast.speedAt2Seconds)} m/s，道路速度 ${fmt(roadCoast.speedAt2Seconds)} m/s。后者${roadCoast.roadOnlyForWholeRun?'全程保持 onroad':'并非全程 onroad'}；两者摩擦工况分开记录。`,
    `- 全转向1秒，车头累计转过 ${fmt(steering.headingAt1SecondRadians*180/Math.PI,2)}°；峰侧向加速度 ${fmt(steering.peakAbsoluteLateralAccelerationMps2)} m/s²。位移速度与车头夹角最大 ${steering.maximumAbsoluteVelocityHeadingErrorRadians.toExponential(3)} rad，侧向速度最大 ${steering.maximumAbsoluteLateralVelocityMps.toExponential(3)} m/s；该工况未观察到可分辨的横向滑移。`,
    `- 持续制动在离路场地 ${fmt(fieldBrake.firstNonForward.timeSeconds)} 秒、道路 ${fmt(roadBrake.firstNonForward.timeSeconds)} 秒首次采到非正速度，后续进入倒车。因此完整4秒轨迹长度不作为刹停距离。`,'',
    '| 车型 | 场景 | 2秒速度 m/s | 首次≤0.2 时间/路程 | 峰侧向加速度 m/s² | 最大侧向速度 m/s | 离路步数 |','| --- | --- | ---: | --- | ---: | ---: | ---: |',
    ...results.map(r=>`| ${r.modelName} | ${r.scenario} | ${fmt(r.summary.speedAt2Seconds)} | ${r.summary.firstLowSpeed?`${fmt(r.summary.firstLowSpeed.timeSeconds)}s / ${fmt(r.summary.firstLowSpeed.travelledXZMetres)}m`:'未到阈值'} | ${fmt(r.summary.peakAbsoluteLateralAccelerationMps2)} | ${fmt(r.summary.maximumAbsoluteLateralVelocityMps,9)} | ${r.summary.offroadSamples}/${r.summary.steps} |`),'',
    '## 连续小起伏：轮底与实际解析地面的 CPU 几何误差','',
    '使用当前四个轮底局部坐标及 updateCar 的 YXZ 车身变换。正值为悬空、负值为埋入；包含当前姿态平滑，不表示独立悬挂位移，也不是现场录像。','',
    '| 车型 | 绝对误差 P50 cm | P95 cm | 最大 cm | 带符号范围 cm |','| --- | ---: | ---: | ---: | --- |',
    ...results.filter(r=>r.scenario==='field-small-undulations').map(r=>`| ${r.modelName} | ${fmt(r.summary.tyreError.absoluteP50Metres*100)} | ${fmt(r.summary.tyreError.absoluteP95Metres*100)} | ${fmt(r.summary.tyreError.absoluteMaxMetres*100)} | ${fmt(r.summary.tyreError.signedMinMetres*100)} … ${fmt(r.summary.tyreError.signedMaxMetres*100)} |`),'',
    '## 限制与原始数据','',
    '- 每个车型/场景 JSON 保存所有 1/60 秒输入、位置、速度、航向、实际位移速度、朝向夹角、侧向速度/加速度、路面状态和四轮误差。','- 平地/起伏场地远离实际公路，地面是受控解析函数，未禁用 offroad 摩擦。','- 道路短窗使用当前真实 coast 曲线与路面高度逻辑；场景外地面用 heightAt，无渲染、路边物体或手机性能证据。','- 首次非正速度只给出采样事件及线性插值估计，不把离散模型未实际采到的零速称为精确停车。','- 方法、源码/脚本 SHA、地面公式、可重复性记录和汇总见 summary.json；文件哈希见 manifest.json。','',
  ];
  await save('report.md',lines.join('\n'));
  await writeFile(path.join(output,'manifest.json'),JSON.stringify({sourceHashes:metadata.sourceHashes,script:metadata.script,files},null,2)+'\n');
  console.log(JSON.stringify({output,drivingSha256:metadata.sourceHashes[0].sha256,scenarioCount:results.length,stepsPerPass:metadata.stepCountPerPass,repeatExact:true,results:results.filter(r=>['field-coast','field-brake','field-steer-return','field-small-undulations','road-coast-short','road-brake'].includes(r.scenario)).map(r=>({car:r.modelName,scenario:r.scenario,speedAt2s:r.summary.speedAt2Seconds,firstLowSpeed:r.summary.firstLowSpeed,headingAt1s:r.summary.headingAt1SecondRadians,peakLateralAcceleration:r.summary.peakAbsoluteLateralAccelerationMps2,maxLateralVelocity:r.summary.maximumAbsoluteLateralVelocityMps,tyreErrorP95:r.summary.tyreError.absoluteP95Metres,tyreErrorMax:r.summary.tyreError.absoluteMaxMetres,offroadSamples:r.summary.offroadSamples,hitSamples:r.summary.collisionSamples}))},null,2));
}finally{await server.close();}
