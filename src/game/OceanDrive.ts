import {createScannedCoast} from '../world/ScannedCoast';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import {createScenery,GOLDEN_HOUR_SUN} from '../world/Scenery';
import {getDaylightPreset,seasonalDaylight,softenGoldenHour,isDaylightId,DAYLIGHT_HOURS,advanceDaylightHour,wrapDaylightHour,formatDaylightHour,type DaylightId} from '../world/Daylight';
import {createCoastalDrizzle} from '../world/CoastalDrizzle';
import {CoastalWeather,isWeatherId,WEATHER} from '../world/Weather';
import {CoastalSeasons,isSeasonId,SEASONS} from '../world/Season';
import {createWeatherSky,type WeatherSkyInput} from '../world/WeatherSky';
import type {DaylightPreset} from '../world/Daylight';
import {createDaylightCycle} from '../world/DaylightCycle';
import {createRoadMesh} from '../world/RoadMesh';
import {createLandmarks} from '../world/Landmarks';
import {createImportedVegetation} from '../world/ImportedVegetation';
import {coast,hill,roads,landmarks} from '../world/roads';
import {createConvertible,CAR_DEFINITIONS,type Convertible} from '../vehicles/Convertible';
import {MobilePresentation} from '../core/MobilePresentation';
import {Driving,ROAD_POSITION_CLEARANCE} from '../systems/Driving';
import {DriveInput} from '../core/DriveInput';
import {CoastAudio} from '../systems/CoastAudio';
import {createStaticSunShadows} from '../systems/StaticSunShadows';
import {avoidCameraCollision,createCameraSurface,type CameraSurfaceSource} from '../systems/CameraCollision';
import type {VehicleSurface} from '../systems/VehicleDynamics';
import {createVehicleMirrors} from '../systems/VehicleMirrors';
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const icons:Record<string,string>={sound:'<path d="m3 9 4 0 5-4v14l-5-4H3z"/><path d="M16 8a7 7 0 0 1 0 8M19 5a11 11 0 0 1 0 14"/>',mute:'<path d="m3 9 4 0 5-4v14l-5-4H3zM16 9l5 6m0-6-5 6"/>',car:'<path d="m4 10 2-5h12l2 5M3 10h18v8H3zM6 18v2m12-2v2M6 13h2m8 0h2"/>',menu:'<path d="M8 5v14M16 5v14"/>',play:'<path d="m9 5 10 7-10 7z"/>',pause:'<path d="M8 5v14M16 5v14"/>',next:'<path d="m5 5 10 7-10 7zM19 5v14"/>'};
const svg=(name:string)=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
const cachedMarkup=new WeakMap<HTMLElement,string>();
const setMarkup=(id:string,value:string)=>{const el=$(id);if(cachedMarkup.get(el)!==value){el.innerHTML=value;cachedMarkup.set(el,value);}};
const setText=(id:string,value:string)=>{const el=$(id);if(el.textContent!==value)el.textContent=value;};
const setPressed=(el:HTMLElement,value:boolean)=>{const text=String(value);if(el.getAttribute('aria-pressed')!==text)el.setAttribute('aria-pressed',text);};
function makeMapPath(route:typeof coast,count=120){const path=new Path2D();for(let i=0;i<=count;i++){const p=route.sample(i/count).position;path.lineTo(p.x*.292,p.z*.292);}return path;}
export class OceanDrive {
 private drizzle:ReturnType<typeof createCoastalDrizzle>;
 private season=new CoastalSeasons();
 private weather=new CoastalWeather();private weatherSky:ReturnType<typeof createWeatherSky>;private baseAtmosphere?:(WeatherSkyInput&{preset:DaylightPreset;environmentRotation:number});
 private appliedWeather=false;private weatherFog=new THREE.Color();private weatherHemi?:THREE.HemisphereLight;private inTunnel=false;
 private headlights=true;
 private daylightId:DaylightId='golden';private preferredDaylight:DaylightId='golden';private daylightRequest=0;private daylightLoading=false;
 private daylightCycle?:ReturnType<typeof createDaylightCycle>;private preparingCycle?:ReturnType<typeof createDaylightCycle>;private cycleHour=18.7;private timeFlow=false;private cycleLoading=false;private preferredCycle=false;private preferredFlow=false;
 private sunOffset=GOLDEN_HOUR_SUN.clone().multiplyScalar(120);
 private mirrors:ReturnType<typeof createVehicleMirrors>;
 readonly scene=new THREE.Scene();readonly camera=new THREE.PerspectiveCamera(56,1,.045,3200);readonly driving=new Driving();readonly audio=new CoastAudio();
 private presentation:MobilePresentation;private renderer:THREE.WebGLRenderer;private input:DriveInput;private scenery:ReturnType<typeof createScenery>;private roadMesh:ReturnType<typeof createRoadMesh>;private destinations:ReturnType<typeof createLandmarks>;private importedPlants:ReturnType<typeof createImportedVegetation>;private scannedCoast:ReturnType<typeof createScannedCoast>;private car:Convertible;private sunlight:THREE.DirectionalLight;private staticSun:ReturnType<typeof createStaticSunShadows>;
 private sceneReady:Promise<void>=Promise.resolve();private assetsReady:Promise<void>=Promise.resolve();private lightingReady:Promise<void>=Promise.resolve();private disposed=false;private hdrTexture:THREE.DataTexture|null=null;private mobile=matchMedia('(pointer:coarse)').matches||innerWidth<700;private running=false;private paused=false;private screenshotPaused=false;private captureStableAmbient=false;private frame=0;private elapsed=0;private ambientElapsed=0;private lastTime=0;private accumulator=0;private raf=0;private cameraMode=0;private orbitYaw=.55;private orbitPitch=.22;private lookYaw=0;private lookPitch=0;private toastTimer=0;private reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;private autoTier=this.mobile?'low':'medium';private lowFrameTime=0;private quality='auto';private carIndex=0;private currentLandmark=0;private visited=new Set<string>();private uiClock=0;private cameraSnap=true;private fps=60;private abort=new AbortController();
 private mapRoadPaths=roads.map(route=>makeMapPath(route));private mapLandmass=makeMapPath(coast,100);private landmarkPositions=landmarks.map(l=>coast.sample(l.t).position);
 private cameraSurface:ReturnType<typeof createCameraSurface>|undefined;private cameraBoomDistance=0;private cameraAvailableDistance=0;private cameraOrigin=new THREE.Vector3();private desiredPosition=new THREE.Vector3();private desiredTarget=new THREE.Vector3();private target=new THREE.Vector3();private mapContext:CanvasRenderingContext2D;private environmentTarget:THREE.WebGLRenderTarget|undefined;
 constructor(private canvas:HTMLCanvasElement){
 const loadingManager=new THREE.LoadingManager();this.assetsReady=new Promise(resolve=>{loadingManager.onLoad=()=>resolve();});
 this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.92;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;
 this.weatherSky=createWeatherSky(this.renderer,this.mobile);
 const pmrem=new THREE.PMREMGenerator(this.renderer),room=new RoomEnvironment();this.environmentTarget=pmrem.fromScene(room,.05);this.scene.environment=this.environmentTarget.texture;this.scene.environmentIntensity=.62;pmrem.dispose();room.dispose();
 this.scene.fog=new THREE.FogExp2('#c8b1b4',.0005);this.scene.add(new THREE.HemisphereLight('#a8bddc','#8f7960',.9));this.sunlight=new THREE.DirectionalLight('#ffd09a',2.1);this.sunlight.position.copy(this.sunOffset);this.sunlight.castShadow=true;this.sunlight.shadow.mapSize.set(this.mobile?1024:2048,this.mobile?1024:2048);this.sunlight.shadow.camera.left=-28;this.sunlight.shadow.camera.right=28;this.sunlight.shadow.camera.top=28;this.sunlight.shadow.camera.bottom=-28;this.sunlight.shadow.camera.near=.5;this.sunlight.shadow.camera.far=240;this.sunlight.shadow.bias=-.00035;this.sunlight.shadow.normalBias=.035;this.scene.add(this.sunlight,this.sunlight.target);
 this.scenery=createScenery(this.scene,this.mobile,loadingManager);this.scannedCoast=createScannedCoast(this.scene,{ground:this.scenery.groundHeight,mobile:this.mobile,manager:loadingManager,rockMaterial:this.scenery.rockMaterial,registerInstances:this.scenery.registerInstances,addWetness:this.scenery.addShoreWetness});this.roadMesh=createRoadMesh(this.scene,loadingManager,this.scenery.terrainHeight,this.scenery.terrainMaterial,this.scenery.addShoreWetness);this.scenery.prepareVerge(this.roadMesh.vergeGeometries);this.destinations=createLandmarks(this.scene,this.mobile,this.scenery.groundHeight,this.scenery.addShoreWetness);this.importedPlants=createImportedVegetation(this.scene,this.scenery.groundHeight,this.mobile,loadingManager,this.scenery.registerInstances);void this.importedPlants.ready.catch(()=>this.toast('近景植被暂未加载，使用基础景观继续。'));this.driving.setTerrain((x,z)=>Math.max(this.scannedCoast.groundHeight(x,z),this.destinations.pavingHeight(x,z)??-Infinity),(x,z)=>this.scenery.blocksCar(x,z));this.car=createConvertible(0);this.scene.add(this.car.root);this.mirrors=createVehicleMirrors(this.renderer,this.scene,this.car,this.mobile,this.scenery.cullForCamera);this.staticSun=createStaticSunShadows(this.scene,this.renderer,this.sunlight,this.mobile,this.scenery.createShadowCasters);
 this.drizzle=createCoastalDrizzle(this.scene,this.mobile,(x,z)=>Math.max(this.scannedCoast.groundHeight(x,z),this.scenery.rainCoverHeight(x,z)));
 const fernReady=this.scenery.prepareFerns(this.importedPlants.ready.then(()=>this.importedPlants.fernMaterial,()=>undefined));
 this.mapContext=$<HTMLCanvasElement>('minimap').getContext('2d')!;this.input=new DriveInput(canvas);this.input.onAction=a=>this.action(a);this.input.onLook=(x,y)=>{if(!this.running||this.paused)return;if(this.cameraMode===1){this.lookYaw=THREE.MathUtils.clamp(this.lookYaw-x,-1.6,1.6);this.lookPitch=THREE.MathUtils.clamp(this.lookPitch+y,-.4,1.5);}else if(this.cameraMode===0){this.orbitYaw-=x;this.orbitPitch=THREE.MathUtils.clamp(this.orbitPitch+y,.08,.8);}};this.input.onManual=()=>{if(this.running&&!this.paused&&this.driving.automatic){this.driving.setAutomatic(false);if(this.cameraMode===2)this.setCamera(0);this.toast('已接管，慢慢开。');this.updateUI();}};
 this.presentation=new MobilePresentation(this.mobile,()=>{if(!this.running)this.start(false);else void this.presentation.enter();});this.wireUI();this.loadPreferences();this.scenery.setSeason(this.season.value);this.resize();const signal=this.abort.signal;window.addEventListener('resize',()=>this.resize(),{signal});document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.running&&!this.paused)this.setPaused(true);},{signal});window.addEventListener('blur',()=>{if(this.running&&!this.paused)this.setPaused(true);},{signal});canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.showError('图形上下文暂时中断，请重新加载继续旅程。');},{signal});
 this.loadPhotographicLighting(loadingManager);const start=$<HTMLButtonElement>('start-button'),auto=$<HTMLButtonElement>('start-auto');start.disabled=true;auto.disabled=true;start.setAttribute('aria-busy','true');start.innerHTML='海岸风景载入中 <span>…</span>';this.sceneReady=Promise.allSettled([this.assetsReady,this.lightingReady,this.scenery.ready,this.importedPlants.ready,fernReady,this.scannedCoast.ready]).then(async()=>{if(!this.disposed){this.scenery.prepareShore((x,z)=>this.scannedCoast.groundHeight(x,z));this.staticSun.prepare();
 const cameraSources:CameraSurfaceSource[]=[...this.scenery.cameraSurfaces,...this.destinations.cameraMeshes.map(mesh=>({geometry:mesh.geometry,transform:mesh.matrixWorld}))];
 this.scannedCoast.root.updateMatrixWorld(true);this.scannedCoast.root.traverse(object=>{const mesh=object as THREE.Mesh;if(mesh.isMesh&&!(mesh as THREE.InstancedMesh).isInstancedMesh)cameraSources.push({geometry:mesh.geometry,transform:mesh.matrixWorld});});
 this.cameraSurface=createCameraSurface(cameraSources);this.scene.userData.cameraSurface={triangles:this.cameraSurface.triangles,cells:this.cameraSurface.cells};
 const physicsParams=new URLSearchParams(location.search),legacyControl=(import.meta.env.DEV||physicsParams.has('test'))&&physicsParams.get('physics')==='0';
 if(!legacyControl){
  const {VehicleDynamics}=await import('../systems/VehicleDynamics');
  const surfaces:VehicleSurface[]=[...this.scenery.vehicleSurfaces,...this.roadMesh.vehicleSurfaces,...this.destinations.vehicleSurfaces];
  // Scanned photographic faces never become collision meshes. Use only the
  // authored closed bodies, reduced to a convex proxy per placement.
  this.scannedCoast.root.traverse(object=>{const mesh=object as THREE.Mesh;if(mesh.isMesh&&!(mesh as THREE.InstancedMesh).isInstancedMesh&&/Closed/.test(mesh.name))surfaces.push({geometry:mesh.geometry,transform:mesh.matrixWorld,convex:true});});
  const dynamics=await VehicleDynamics.create(surfaces,[...this.scenery.vehiclePrimitives,...this.roadMesh.vehiclePrimitives,...this.destinations.vehiclePrimitives],this.carIndex);
  if(this.disposed)dynamics.dispose();else{this.driving.setDynamics(dynamics);for(let i=0;i<60;i++)this.driving.update(1/60,{throttle:0,brake:0,steer:0,handbrake:false});}
 }
 await this.renderer.compileAsync(this.scene,this.camera);}}).catch(error=>{console.error(error);if(!this.disposed)this.toast('场景正在逐步准备，稍候可继续驾驶。');});void this.sceneReady.then(()=>{if(this.disposed)return;start.disabled=false;auto.disabled=false;start.removeAttribute('aria-busy');start.innerHTML='开往海边 <span>↗</span>';this.presentation.setReady();});this.installHooks();this.raf=requestAnimationFrame(t=>this.tick(t));
 }
 private loadPhotographicLighting(loadingManager:THREE.LoadingManager){
  if(this.preferredCycle)this.daylightId=this.preferredDaylight;
  this.lightingReady=(this.preferredCycle?this.activateDaylightCycle(this.cycleHour,this.preferredFlow):this.loadDaylight(this.preferredDaylight,loadingManager)).then(async loaded=>{
   if(!loaded&&!this.disposed&&this.preferredCycle)loaded=await this.loadDaylight(this.preferredDaylight,loadingManager);
   if(!loaded&&!this.disposed&&this.preferredDaylight!=='golden')loaded=await this.loadDaylight('golden',loadingManager);
   if(!loaded&&!this.disposed)this.toast('使用本地落日天空继续旅程。');
  });
 }
 private async loadDaylight(id:DaylightId,loadingManager?:THREE.LoadingManager):Promise<boolean>{
  const request=++this.daylightRequest,preset=getDaylightPreset(id),select=$<HTMLSelectElement>('daylight-select'),status=$('daylight-status');
  this.cancelPreparingCycle();
  if(this.hdrTexture&&this.daylightId===id){
   this.daylightLoading=false;select.value=id;select.removeAttribute('aria-busy');status.classList.add('hidden');return true;
  }
  this.daylightLoading=true;select.value=id;select.setAttribute('aria-busy','true');status.textContent='正在载入'+preset.label+'…';status.classList.remove('hidden');
  let texture:THREE.DataTexture|undefined,target:THREE.WebGLRenderTarget|undefined;
  try{
   const path=preset.asset?'daylight/'+preset.asset+'.hdr':this.mobile?'sky-mobile.hdr':'sky.hdr';
   texture=await new HDRLoader(loadingManager).loadAsync(import.meta.env.BASE_URL+'assets/environment/'+path);
   if(this.disposed||request!==this.daylightRequest){texture.dispose();return false;}
   if(id==='golden')softenGoldenHour(texture);
   texture.mapping=THREE.EquirectangularReflectionMapping;texture.wrapS=THREE.RepeatWrapping;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;
   const generator=new THREE.PMREMGenerator(this.renderer);
   try{target=generator.fromEquirectangular(texture);}finally{generator.dispose();}
   const previousTexture=this.hdrTexture,previousTarget=this.environmentTarget;
   this.hdrTexture=texture;this.environmentTarget=target;this.daylightId=id;this.preferredDaylight=id;
   this.daylightCycle?.dispose();this.daylightCycle=undefined;this.timeFlow=false;this.cycleLoading=false;
   this.applyFixedDaylight();this.applyWeather(true);this.mirrors.invalidate();
   previousTexture?.dispose();previousTarget?.dispose();this.savePreferences();this.updateUI();return true;
  }catch{
   texture?.dispose();target?.dispose();if(!this.disposed&&request===this.daylightRequest)this.toast('这个时段暂未载入，可继续当前旅程。');return false;
  }finally{
   if(!this.disposed&&request===this.daylightRequest){this.daylightLoading=false;select.value=this.daylightId;select.removeAttribute('aria-busy');status.classList.add('hidden');}
  }
 }

 private applyFixedDaylight(){
  if(!this.hdrTexture||!this.environmentTarget)return;const p=seasonalDaylight(getDaylightPreset(this.daylightId),this.season.value.lighting);
  this.scene.environment=this.environmentTarget.texture;this.scene.environmentIntensity=p.environment*p.gain;this.scene.environmentRotation.y=p.rotation;
  this.scene.background=this.hdrTexture;this.scene.backgroundIntensity=p.sky*p.gain;this.scene.backgroundRotation.y=p.rotation;
  this.scenery.setSkyReflection(this.hdrTexture);this.scenery.setDaylight(p);
  this.sunOffset.fromArray(p.direction).normalize().multiplyScalar(120);this.sunlight.color.set(p.sunColor);this.sunlight.intensity=p.sunIntensity;
  const hemi=this.scene.children.find(o=>o instanceof THREE.HemisphereLight) as THREE.HemisphereLight|undefined;
  if(hemi){hemi.color.set(p.hemiSky);hemi.groundColor.set(p.hemiGround);hemi.intensity=p.hemiIntensity;}
  (this.scene.fog as THREE.FogExp2).color.set(p.fog);this.updateLighting();this.staticSun.setLighting(this.sunlight.color,p.sunIntensity);
  const fallback=this.scene.getObjectByName('Golden hour sky and high cirrus');if(fallback)fallback.visible=false;
  this.rememberAtmosphere(this.hdrTexture,this.environmentTarget.texture,p,false);
 }
 private cancelPreparingCycle(){this.preparingCycle?.dispose();this.preparingCycle=undefined;}
 private async activateDaylightCycle(hour:number,flow:boolean){
  const request=++this.daylightRequest;this.cancelPreparingCycle();const candidate=createDaylightCycle(this.renderer);this.preparingCycle=candidate;this.daylightLoading=true;
  const status=$('daylight-status');status.textContent='正在准备昼夜风景…';status.classList.remove('hidden');this.updateDaylightUI();
  try{
   if(!await candidate.prepare(hour)||this.disposed||request!==this.daylightRequest){candidate.dispose();return false;}
   candidate.render(hour,performance.now()/1000,true);
   const oldCycle=this.daylightCycle,oldTexture=this.hdrTexture,oldEnvironment=this.environmentTarget;
   this.daylightCycle=candidate;this.timeFlow=flow;this.cycleHour=wrapDaylightHour(hour);this.cycleLoading=false;
   this.applyDaylightCycle(performance.now()/1000,true);this.hdrTexture=null;this.environmentTarget=undefined;
   this.preparingCycle=undefined;oldCycle?.dispose();oldTexture?.dispose();oldEnvironment?.dispose();this.savePreferences();return true;
  }catch{
   candidate.dispose();if(this.daylightCycle===candidate)this.daylightCycle=undefined;
   if(!this.disposed&&request===this.daylightRequest)this.toast('昼夜风景暂未载入，继续当前时段。');return false;
  }finally{
   if(this.preparingCycle===candidate)this.preparingCycle=undefined;
   if(!this.disposed&&request===this.daylightRequest){this.daylightLoading=false;status.classList.add('hidden');this.updateUI();}
  }
 }
 private async setTimeFlow(flow:boolean){
  if(!flow){this.timeFlow=false;if(this.preparingCycle||!this.daylightCycle){this.daylightRequest++;this.cancelPreparingCycle();this.daylightLoading=false;$('daylight-status').classList.add('hidden');}this.savePreferences();this.updateUI();return;}
  if(this.daylightCycle){this.timeFlow=true;this.savePreferences();this.updateUI();return;}
  await this.activateDaylightCycle(DAYLIGHT_HOURS[this.daylightId],true);
 }
 private applyDaylightCycle(time:number,force=false){
  const cycle=this.daylightCycle;if(!cycle)return;const result=cycle.render(this.cycleHour,time,force,true,this.season.value.lighting),p=result.state.preset;
  this.scene.background=null;if(!cycle.background.parent)this.scene.add(cycle.background);
  this.scene.environment=result.environment;this.scene.environmentIntensity=p.environment;this.scene.environmentRotation.y=result.environmentRotation;
  this.scenery.setSkyReflection(result.texture);this.scenery.setDaylight(p);
  this.sunOffset.fromArray(p.direction).normalize().multiplyScalar(120);this.sunlight.color.set(p.sunColor);this.sunlight.intensity=p.sunIntensity;
  const hemi=this.scene.children.find(o=>o instanceof THREE.HemisphereLight) as THREE.HemisphereLight|undefined;
  if(hemi){hemi.color.set(p.hemiSky);hemi.groundColor.set(p.hemiGround);hemi.intensity=p.hemiIntensity;}
  (this.scene.fog as THREE.FogExp2).color.set(p.fog);this.updateLighting();this.staticSun.setLighting(this.sunlight.color,p.sunIntensity,1);
  this.rememberAtmosphere(result.texture,result.environment,p,true);
  if(force){const fallback=this.scene.getObjectByName('Golden hour sky and high cirrus');if(fallback)fallback.visible=false;this.mirrors.invalidate();}
 }
 private rememberAtmosphere(sky:THREE.Texture,environment:THREE.Texture,preset:DaylightPreset,discs:boolean){
  const base=this.baseAtmosphere??={sky,environment,preset,discs,skyGain:1,skyRotation:0,environmentGain:1,environmentRotation:0,fog:new THREE.Color(),sun:new THREE.Vector3(),moon:new THREE.Vector3(),sunColor:new THREE.Color(),sunVisible:0,moonVisible:0};
  base.sky=sky;base.environment=environment;base.preset=preset;base.discs=discs;base.skyGain=discs?1:this.scene.backgroundIntensity;base.skyRotation=preset.rotation;base.environmentGain=this.scene.environmentIntensity;base.environmentRotation=this.scene.environmentRotation.y;
  base.fog.set(preset.fog);base.sun.fromArray(preset.direction).normalize();if(discs&&(this.cycleHour<6||this.cycleHour>=19))base.sun.negate();base.moon.copy(base.sun).negate();base.sunColor.set(preset.sunColor);base.sunVisible=THREE.MathUtils.smoothstep(base.sun.y,-.009,.03);base.moonVisible=THREE.MathUtils.smoothstep(base.moon.y,-.009,.05);if(discs){base.sunVisible*=this.season.value.lighting.sun;base.moonVisible*=this.season.value.lighting.sun;}
  this.weatherHemi??=this.scene.children.find(o=>o instanceof THREE.HemisphereLight) as THREE.HemisphereLight|undefined;
 }
 private applyWeather(force=false){
  const base=this.baseAtmosphere;if(!base)return;const w=this.weather.value,p=base.preset;if(w.cloud<1e-6&&w.mist<1e-6&&!this.appliedWeather)return;const amount=Math.min(1,w.cloud*.7+w.mist*.3);
  // Keep dusk/night dark: use the daylight fog radiance rather than a white
  // overlay. Direct sun and reflected glitter attenuate together.
  this.weatherFog.copy(base.fog);const grey=this.weatherFog.r*.2126+this.weatherFog.g*.7152+this.weatherFog.b*.0722;
  this.weatherFog.lerp(new THREE.Color().setRGB(grey*.94,grey,grey*1.03),amount*.72);
  const output=this.weatherSky.render({...base,fog:this.weatherFog},w,this.weather.seconds,force),attenuation=(1-w.cloud*.88)*(1-w.mist*.55);this.appliedWeather=Boolean(output);
  if(output){this.scene.background=null;if(!output.background.parent)this.scene.add(output.background);if(this.daylightCycle)this.daylightCycle.background.visible=false;this.scene.environment=output.environment;this.scene.environmentIntensity=1;this.scenery.setSkyReflection(output.sky);}
  else{if(this.daylightCycle){this.scene.background=null;this.daylightCycle.background.visible=true;}else{this.scene.background=base.sky;this.scene.backgroundIntensity=base.skyGain;this.scene.backgroundRotation.y=base.skyRotation;}this.scene.environment=base.environment;this.scene.environmentIntensity=base.environmentGain;this.scenery.setSkyReflection(base.sky);}
  this.scene.environmentRotation.y=base.environmentRotation;
  this.sunlight.intensity=p.sunIntensity*attenuation;
  if(this.weatherHemi)this.weatherHemi.intensity=p.hemiIntensity*(1-amount*.13);
  const fog=this.scene.fog as THREE.FogExp2;fog.color.copy(this.weatherFog);fog.density=.0005+w.cloud*.00045+w.mist*.007;this.scenery.setWeatherFog(output?fog.density:0,this.weatherFog);
  this.scenery.setDaylight(output?{...p,sky:1,gain:1,rotation:0,sunIntensity:p.sunIntensity*attenuation,waterLight:p.waterLight*(1-amount*.35),waterHorizon:this.weatherFog,glitter:p.glitter.map(c=>c*attenuation)}:p);
  this.staticSun.setLighting(this.sunlight.color,this.sunlight.intensity,this.daylightCycle?1:0);
 }
 private updateDaylightCycle(dt:number,time:number,seasonChanged=false){
  const cycle=this.daylightCycle;cycle?.beginFrame();if(!cycle||!this.running||this.paused||this.screenshotPaused||document.hidden)return;
  if(!this.timeFlow){if(seasonChanged)this.applyDaylightCycle(time,!this.season.transitioning);return;}
  const next=advanceDaylightHour(this.cycleHour,dt,!this.cycleLoading);
  const fail=()=>{if(this.daylightCycle===cycle){this.timeFlow=false;this.cycleLoading=false;this.toast('时间暂留在这里，可稍后继续昼夜变化。');this.savePreferences();this.updateUI();}};
  if(!cycle.has(next)){
   if(!this.cycleLoading){this.cycleLoading=true;void cycle.prepare(next).catch(fail).finally(()=>{if(this.daylightCycle===cycle)this.cycleLoading=false;});}
   return;
  }
  this.cycleHour=next;this.applyDaylightCycle(time);void cycle.prefetch(next).catch(fail);
 }
 private updateDaylightUI(){
  const select=$<HTMLSelectElement>('daylight-select'),cycle=this.daylightCycle;
  let clock=getDaylightPreset(this.daylightId).clock,label=getDaylightPreset(this.daylightId).label;
  if(cycle){clock=formatDaylightHour(this.cycleHour);label=this.timeFlow?'海岸时光':'时光停留';
   let current=select.querySelector<HTMLOptionElement>('option[value="current"]');if(!current){current=document.createElement('option');current.value='current';select.prepend(current);}current.textContent='当前 · '+clock;if(!this.daylightLoading)select.value='current';
  }else{select.querySelector('option[value="current"]')?.remove();if(!this.daylightLoading)select.value=this.daylightId;}
  setText('daylight-clock',clock);setText('daylight-label',label);if(!this.daylightLoading)$<HTMLInputElement>('time-flow').checked=this.timeFlow;
  if(this.daylightLoading)select.setAttribute('aria-busy','true');else select.removeAttribute('aria-busy');$<HTMLInputElement>('time-flow').setAttribute('aria-busy',String(this.daylightLoading));
 }

 private wireUI(){
 $('sound-button').innerHTML=svg('sound');$('garage-button').innerHTML=svg('car');$('menu-button').innerHTML=svg('menu');$('radio-button').innerHTML=svg('pause');$('next-track').innerHTML=svg('next');
 $('start-button').onclick=()=>this.start(false);$('start-auto').onclick=()=>this.start(true);$('auto-button').onclick=()=>this.action('auto');$('menu-button').onclick=()=>this.action('pause');$('garage-button').onclick=()=>this.action('garage');$('sound-button').onclick=()=>this.action('mute');$('resume-button').onclick=()=>{if(this.mobile)void this.presentation.enter();this.setPaused(false);};$('recover-button').onclick=()=>{this.driving.recover();this.cameraSnap=true;this.setPaused(false);this.toast('已回到道路。');};$('recenter-button').onclick=()=>this.recenter();$('junction-button').onclick=()=>{this.driving.preferHill=!this.driving.preferHill;this.toast(this.driving.preferHill?'下个岔路驶入山间支线':'继续沿海环线');this.updateUI();};
 document.querySelectorAll<HTMLElement>('[data-camera]').forEach(b=>b.onclick=()=>this.setCamera(Number(b.dataset.camera)));
 $('radio-button').onclick=()=>{this.audio.musicEnabled=!this.audio.musicEnabled;this.audio.applyVolumes();this.updateUI();this.savePreferences();};$('next-track').onclick=()=>{this.audio.next();this.updateUI();};
 $<HTMLInputElement>('music-volume').oninput=e=>{this.audio.musicVolume=Number((e.target as HTMLInputElement).value)/100;this.audio.applyVolumes();this.savePreferences();};$<HTMLInputElement>('ambient-volume').oninput=e=>{this.audio.ambientVolume=Number((e.target as HTMLInputElement).value)/100;this.audio.applyVolumes();this.savePreferences();};$<HTMLSelectElement>('quality-select').onchange=e=>{this.quality=(e.target as HTMLSelectElement).value;this.staticSun.restore();this.autoTier=this.mobile?'low':'medium';this.lowFrameTime=0;this.resize();this.savePreferences();};$<HTMLInputElement>('reduced-motion').onchange=e=>{this.reducedMotion=(e.target as HTMLInputElement).checked;this.savePreferences();};
 $<HTMLInputElement>('headlights-enabled').onchange=e=>{this.headlights=(e.target as HTMLInputElement).checked;this.savePreferences();};
 $<HTMLSelectElement>('daylight-select').onchange=e=>{const id=(e.target as HTMLSelectElement).value;if(isDaylightId(id))void this.loadDaylight(id);};
 $<HTMLSelectElement>('weather-select').onchange=e=>{const id=(e.target as HTMLSelectElement).value;if(!isWeatherId(id))return;this.weather.setNatural(false);this.weather.select(id);this.savePreferences();this.updateUI();};
 $<HTMLInputElement>('weather-natural').onchange=e=>{this.weather.setNatural((e.target as HTMLInputElement).checked);this.savePreferences();this.updateUI();};
 $<HTMLSelectElement>('season-select').onchange=e=>{const id=(e.target as HTMLSelectElement).value;if(!isSeasonId(id))return;this.season.setNatural(false);this.season.select(id);this.savePreferences();this.updateUI();};
 $<HTMLInputElement>('season-natural').onchange=e=>{this.season.setNatural((e.target as HTMLInputElement).checked);this.savePreferences();this.updateUI();};
 $<HTMLInputElement>('time-flow').onchange=e=>{void this.setTimeFlow((e.target as HTMLInputElement).checked);};
 $('fullscreen-button').onclick=()=>{if(this.mobile){void this.presentation.enter();return;}if(document.fullscreenElement){void document.exitFullscreen();}else if(document.documentElement.requestFullscreen){void document.documentElement.requestFullscreen().catch(()=>this.toast('当前浏览器不支持全屏，可直接继续游玩。'));}else this.toast('当前浏览器不支持全屏，可直接继续游玩。');};
 $('close-garage').onclick=$('garage-done').onclick=()=>{ $('garage-panel').classList.add('hidden');if(this.running)this.setPaused(false);};
 $('car-options').innerHTML=CAR_DEFINITIONS.map((c,i)=>`<button class="car-option ${i===0?'selected':''}" data-car="${i}" aria-label="选择${c.name}"><span class="car-swatch"><svg viewBox="0 0 140 60" fill="none"><path d="M12 38 17 27 50 22 69 13 91 15 104 24 124 28 131 39 128 45H13Z" fill="${c.color}"/><path d="m56 22 15-7 17 1 10 8" stroke="#d5ddcc" stroke-width="2"/><path d="M16 39h112" stroke="#eff1da70"/><circle cx="36" cy="43" r="10" fill="#152127"/><circle cx="36" cy="43" r="5" fill="#aebbb7"/><circle cx="111" cy="43" r="10" fill="#152127"/><circle cx="111" cy="43" r="5" fill="#aebbb7"/></svg></span><strong>${c.name}</strong><small>${c.subtitle}</small></button>`).join('');document.querySelectorAll<HTMLElement>('[data-car]').forEach(b=>b.onclick=()=>this.changeCar(Number(b.dataset.car)));
 }
 private start(automatic:boolean){if(this.mobile)void this.presentation.enter();this.running=true;this.paused=false;this.driving.setAutomatic(automatic);$('welcome').classList.add('hidden');$('menu-button').classList.remove('hidden');$('driving-ui').classList.remove('hidden');this.orbitYaw=-.08;this.cameraSnap=true;void this.audio.unlock().catch(()=>this.toast('可在右上角重新打开声音。'));this.updateUI();this.toast(automatic?'已开启自动巡航，拖动画面看风景。':this.mobile?'左侧转向，右侧油门与刹车。':'WASD 驾驶 · C 切换视角 · P 自动巡航');}
 private action(action:string){if(action==='mute'){this.audio.muted=!this.audio.muted;if(this.running&&!this.paused&&!document.hidden)void this.audio.unlock();this.audio.applyVolumes();this.updateUI();this.savePreferences();return;}
 if(action==='garage'){this.setPaused(true,false);$('menu-panel').classList.add('hidden');$('garage-panel').classList.remove('hidden');this.cameraMode=0;this.orbitYaw=.65;this.orbitPitch=.25;this.cameraSnap=true;return;}
 if(!this.running)return;if(action==='pause'){this.setPaused(!this.paused);return;}if(this.paused)return;
 if(action==='lights'){this.headlights=!this.headlights;$<HTMLInputElement>('headlights-enabled').checked=this.headlights;this.savePreferences();this.toast(this.headlights?'前照灯已开启。':'前照灯已关闭。');}
 if(action==='camera')this.setCamera((this.cameraMode+1)%3);if(action==='auto'){if(!this.driving.setAutomatic(!this.driving.automatic)){this.toast('回到公路后可开启自动巡航。');return;}if(!this.driving.automatic&&this.cameraMode===2)this.setCamera(0);this.toast(this.driving.automatic?'自动巡航已开启。':'已切换手动驾驶。');}if(action==='recover'){this.driving.recover();this.cameraSnap=true;this.toast('已回到道路。');}this.updateUI();}
 private setPaused(value:boolean,showMenu=true){this.paused=value;this.input.clear();$('menu-panel').classList.toggle('hidden',!value||!showMenu);if(!value){$('garage-panel').classList.add('hidden');if(this.running)void this.audio.resume();}else void this.audio.pause();if(value)this.savePreferences();this.updateUI();}
 private setCamera(mode:number){if(mode===2&&!this.driving.automatic&&!this.driving.setAutomatic(true)){this.toast('回到公路后可开启电影巡航。');return;}this.cameraMode=mode;this.lookYaw=0;this.lookPitch=0;this.orbitYaw=-.08;this.orbitPitch=.22;if(mode===2&&!this.driving.automatic){this.driving.setAutomatic(true);this.toast('电影镜头 · 自动巡航');}this.cameraSnap=true;this.updateUI();}
 private recenter(){this.lookYaw=0;this.lookPitch=0;this.orbitYaw=-.08;this.orbitPitch=.22;}
 private changeCar(index:number){if(index===this.carIndex)return;this.mirrors.dispose();this.scene.remove(this.car.root);this.car.dispose();this.carIndex=index;this.car=createConvertible(index);this.scene.add(this.car.root);this.mirrors=createVehicleMirrors(this.renderer,this.scene,this.car,this.mobile,this.scenery.cullForCamera);this.staticSun.registerReceivers(this.car.root);this.car.setContactShadow(true);this.driving.modelIndex=index;this.driving.speed=0;this.driving.resetDynamics();this.cameraSnap=true;this.updateCar(0);document.querySelectorAll<HTMLElement>('[data-car]').forEach(el=>el.classList.toggle('selected',Number(el.dataset.car)===index));this.toast(CAR_DEFINITIONS[index].name+'，准备出发。');}
 private resolveBuildingCollisions(){const d=this.driving;if(d.dynamics)return;for(const c of this.destinations.colliders){const dx=d.position.x-c.x,dz=d.position.z-c.z,hx=c.halfX+.8,hz=c.halfZ+.8;if(Math.abs(dx)<hx&&Math.abs(dz)<hz){if(hx-Math.abs(dx)<hz-Math.abs(dz))d.position.x=c.x+Math.sign(dx||1)*hx;else d.position.z=c.z+Math.sign(dz||1)*hz;d.speed*=.35;d.hit=true;}}}
 private updateCar(dt:number){this.car.root.position.copy(this.driving.position);this.car.root.position.y-=ROAD_POSITION_CLEARANCE;if(this.driving.dynamics)this.car.root.quaternion.copy(this.driving.dynamics.rotation);else this.car.root.rotation.set(this.driving.pitch,this.driving.yaw,this.driving.roll-this.driving.steer*Math.min(Math.abs(this.driving.speed)/25,1)*.025,'YXZ');this.car.update(this.driving.speed,this.driving.steer,dt,this.driving.dynamics?.wheels);this.car.setLights(this.headlights,this.driving.braking,this.driving.speed<-.2);for(const name of ['driver-head','driver-linen-shirt']){const part=this.car.root.getObjectByName(name);if(part)part.visible=this.cameraMode!==1;}const sleeves=this.car.root.getObjectByName('driver-cockpit-sleeves');if(sleeves)sleeves.visible=this.cameraMode===1;this.car.root.updateMatrixWorld(true);}
 private updateCamera(dt:number){const p=this.driving.position,yaw=this.driving.yaw,inTunnel=this.driving.road.route===coast&&this.driving.road.t>.675&&this.driving.road.t<.742&&this.driving.road.distance<6.1&&p.y<this.driving.road.sample.position.y+6.6;
 if(this.cameraMode===1){this.desiredPosition.copy(this.car.cockpitEye).applyMatrix4(this.car.root.matrixWorld);const eye=this.car.cockpitEye;const localTarget=new THREE.Vector3(eye.x+Math.sin(this.lookYaw)*8,eye.y-.16-this.lookPitch*5,eye.z+Math.cos(this.lookYaw)*8);this.desiredTarget.copy(localTarget).applyMatrix4(this.car.root.matrixWorld);}
 else{let angle=this.orbitYaw,distance=this.mobile?(innerHeight>innerWidth?9.2:8.5):8.6,height=2.2+this.orbitPitch*4.5;
 if(this.cameraMode===2&&!this.reducedMotion){const phase=Math.floor(this.elapsed/14)%3;angle=[.72,-.7,.16][phase]+Math.sin(this.elapsed*.08)*.12;distance=[10,10.5,15][phase];height=[2.7,1.9,5.6][phase];}if(inTunnel){distance=5.8;if(this.cameraMode===2){angle=.05;height=2.1;}}
 this.desiredPosition.set(p.x-Math.sin(yaw+angle)*distance,p.y+height,p.z-Math.cos(yaw+angle)*distance);this.desiredTarget.set(p.x+Math.sin(yaw)*2,p.y+1,p.z+Math.cos(yaw)*2);}
 const blend=this.cameraSnap?1:1-Math.exp(-(this.cameraMode===1?18:4)*dt);
 if(this.cameraMode===1){this.camera.position.copy(this.desiredPosition);this.target.copy(this.desiredTarget);}
 else{
  this.cameraOrigin.copy(p);this.cameraOrigin.y=Math.max(p.y+1.35,this.scannedCoast.groundHeight(p.x,p.z)+.35);
  this.avoidCameraObstacles(this.desiredPosition);
  if(this.cameraMode===0){
   this.cameraAvailableDistance=this.desiredPosition.distanceTo(this.cameraOrigin);
   // Rotation follows the requested orbit even beside a wall. Contract before
   // contact, then release the boom gently instead of easing through scenery.
   this.cameraBoomDistance=this.cameraSnap||this.cameraAvailableDistance<this.cameraBoomDistance?this.cameraAvailableDistance:THREE.MathUtils.damp(this.cameraBoomDistance,this.cameraAvailableDistance,2.5,dt);
   this.camera.position.copy(this.desiredPosition).sub(this.cameraOrigin).setLength(this.cameraBoomDistance).add(this.cameraOrigin);
   const lead=2*Math.min(1,this.cameraBoomDistance/6);this.desiredTarget.set(p.x+Math.sin(yaw)*lead,p.y+1,p.z+Math.cos(yaw)*lead);this.target.copy(this.desiredTarget);
  }else{this.camera.position.lerp(this.desiredPosition,blend);this.target.lerp(this.desiredTarget,blend);this.avoidCameraObstacles(this.camera.position);}
 }
 this.camera.lookAt(this.target);const fov=this.cameraMode===1?(this.mobile?71:68):this.mobile&&innerHeight>innerWidth?64:54;if(this.camera.fov!==fov){this.camera.fov=fov;this.camera.updateProjectionMatrix();}this.cameraSnap=false;
 }
 private avoidCameraObstacles(position:THREE.Vector3){avoidCameraCollision(position,this.cameraOrigin,this.destinations.cameraColliders,(x,z)=>this.scannedCoast.groundHeight(x,z),this.cameraSurface);}
 private updateLighting(){const p=this.driving.position;this.sunlight.position.copy(p).add(this.sunOffset);this.sunlight.target.position.copy(p);this.sunlight.target.updateMatrixWorld();}
 private updateAutomaticQuality(frameTime:number){
  if(!this.running||this.paused||this.screenshotPaused||this.quality!=='auto')return;
  const low=this.autoTier==='low';if(low&&(!this.mobile||this.staticSun.diagnostics.mode!=='cached-world'))return;
  const threshold=low?40:this.mobile?26:38;
  this.lowFrameTime=this.fps<threshold?this.lowFrameTime+frameTime:Math.max(0,this.lowFrameTime-frameTime*.5);
  if(this.lowFrameTime<=5)return;this.lowFrameTime=0;
  if(!low){this.autoTier='low';this.resize();this.toast('已自动切换为流畅画面。');}
  else if(this.staticSun.reduceForPerformance())this.toast('已减少投影，让驾驶更流畅。');
 }
 private updateWeatherEffects(){
  const w=this.weather.value,wet=this.weather.wetness;this.scenery.setWeather(w.wind,wet);this.importedPlants.setWind(w.wind);this.scannedCoast.setWind(w.wind);
  const p=this.driving.position,cover=Math.max(this.scannedCoast.groundHeight(p.x,p.z),this.scenery.rainCoverHeight(p.x,p.z));
  this.inTunnel=cover>p.y+1.8;this.driving.wetness=this.inTunnel?0:wet;
 }
 private tick(time:number){this.raf=requestAnimationFrame(t=>this.tick(t));const rawDt=(time-(this.lastTime||time))/1000,dt=Math.min(.1,rawDt);this.lastTime=time;this.fps=THREE.MathUtils.damp(this.fps,rawDt>0?1/rawDt:60,1,Math.min(rawDt,1));this.frame++;
 const seasonChanged=this.season.advance(dt,this.running&&!this.paused&&!this.screenshotPaused&&!document.hidden);if(seasonChanged){this.scenery.setSeason(this.season.value);if(!this.daylightCycle)this.applyFixedDaylight();}
 this.weatherSky.beginFrame();this.weather.advance(dt,this.running&&!this.paused&&!this.screenshotPaused&&!document.hidden);this.updateWeatherEffects();
 if(!this.paused&&!this.screenshotPaused){this.elapsed+=dt;if(!this.reducedMotion)this.ambientElapsed+=dt;if(this.running){this.accumulator+=dt;const intent=this.input.read();while(this.accumulator>=1/60){this.driving.update(1/60,intent);this.resolveBuildingCollisions();this.accumulator-=1/60;}this.audio.update(this.driving.speed,this.elapsed,this.inTunnel,this.weather.value.wind,this.weather.value.rain);}}
 this.updateDaylightCycle(dt,time/1000,seasonChanged);this.applyWeather();this.updateCar(this.paused||this.screenshotPaused?0:dt);if(this.running)this.scenery.updateVehicle(this.elapsed,this.car.root,this.car.wheelContacts);this.destinations.update(this.elapsed,this.driving.position);this.updateLighting();this.updateCamera(dt);this.scenery.update(this.captureStableAmbient?20:this.ambientElapsed,this.driving.position,this.camera.position);this.importedPlants.update(this.captureStableAmbient?20:this.ambientElapsed);this.scannedCoast.update(this.driving.position,this.captureStableAmbient?20:this.ambientElapsed);this.drizzle.update(this.camera.position,this.weather.seconds,this.running?this.weather.value.rain:0,this.weather.value.wind,this.inTunnel);this.scenery.cullForCamera(this.camera);this.staticSun.update(this.car.root);this.mirrors.update(time/1000,this.camera,this.running&&this.cameraMode===1&&!this.disposed,!this.paused&&!this.screenshotPaused&&!document.hidden);this.renderer.render(this.scene,this.camera);this.updateAutomaticQuality(Math.min(rawDt,1));this.uiClock+=dt;if(this.uiClock>.08){this.uiClock=0;this.updateUI();this.drawMap();this.updateDiagnostics();}
 }
 private updateUI(){this.updateDaylightUI();$<HTMLSelectElement>('season-select').value=this.season.target;$<HTMLInputElement>('season-natural').checked=this.season.natural;setText('season-status',this.season.transitioning?'正缓缓转为'+SEASONS[this.season.target].label+' · 约60秒':this.season.natural?'四季缓缓流转 · 一年约48分钟':'季节停留 · '+SEASONS[this.season.target].label);$<HTMLSelectElement>('weather-select').value=this.weather.target;$<HTMLInputElement>('weather-natural').checked=this.weather.natural;setText('weather-status',this.weather.transitioning?'正缓缓转为'+WEATHER[this.weather.target].label+' · 约45秒':this.weather.natural?'以晴天为主，偶尔轻雾与细雨':'天气停留 · '+WEATHER[this.weather.target].label);const d=this.driving;const speed=Math.round(Math.abs(d.speed)*3.6);setText('speed-value',String(speed));$('speed-fill').style.width=Math.min(speed/130*100,100)+'%';setText('gear-value',d.speed<-.2?'R':speed<1?'N':String(Math.min(5,1+Math.floor(speed/24))));setText('drive-mode',this.paused?'旅程暂停':d.automatic?'自动巡航':'手动驾驶');setText('distance-value',(d.distance/1000).toFixed(1)+' km');setText('road-name',d.offroad?'海岸原野':d.road.route.name);setText('auto-label',d.automatic?'正在巡航':'自动巡航');$('auto-button').classList.toggle('active',d.automatic);setPressed($('auto-button'),d.automatic);document.body.classList.toggle('automatic',d.automatic);document.querySelectorAll<HTMLElement>('[data-camera]').forEach(b=>{b.classList.toggle('selected',Number(b.dataset.camera)===this.cameraMode);setPressed(b,Number(b.dataset.camera)===this.cameraMode);});
 let nearest=0,min=Infinity;landmarks.forEach((l,i)=>{const p=this.landmarkPositions[i],dist=p.distanceTo(d.position);if(dist<min){min=dist;nearest=i;}if(this.running&&dist<35&&!this.visited.has(l.name)){this.visited.add(l.name);try{localStorage.setItem('coast-visited',JSON.stringify([...this.visited]));}catch{}if(this.visited.size>1)this.toast('途经 · '+l.name);}});this.currentLandmark=nearest;setText('location-name',landmarks[nearest].name);setMarkup('sound-button',svg(this.audio.muted?'mute':'sound'));document.body.classList.toggle('muted',this.audio.muted);document.body.classList.toggle('music-off',!this.audio.musicEnabled);setMarkup('radio-button',svg(this.audio.musicEnabled?'pause':'play'));setMarkup('radio-track',this.audio.track?'海岸来信 <span class="radio-dot">·</span> <span class="track-en">Sea Letters</span>':'余晖时分 <span class="radio-dot">·</span> <span class="track-en">Golden Hour</span>');setText('junction-label',d.preferHill?'驶入山间 ↖':'继续沿海 ↗');setText('map-route-label',d.road.route===hill?'HILL ROAD':'COASTLINE');}
 private drawMap(){const ctx=this.mapContext,w=256;ctx.clearRect(0,0,w,w);ctx.save();ctx.translate(128,128);ctx.fillStyle='#102e3299';ctx.beginPath();ctx.arc(0,0,119,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(0,0,119,0,Math.PI*2);ctx.clip();const scale=.292;ctx.fillStyle='#a6b28b1c';ctx.fill(this.mapLandmass);for(const [index,road] of roads.entries()){ctx.strokeStyle=road===this.driving.road.route?'#ead19d':'#aac4bc99';ctx.lineWidth=road===this.driving.road.route?2.5:1.5;ctx.stroke(this.mapRoadPaths[index]);}landmarks.forEach((l,i)=>{const p=this.landmarkPositions[i];ctx.beginPath();ctx.arc(p.x*scale,p.z*scale,i===this.currentLandmark?3.5:2.3,0,Math.PI*2);ctx.fillStyle=this.visited.has(l.name)?'#edce97':'#ecf1da80';ctx.fill();});const p=this.driving.position;ctx.translate(p.x*scale,p.z*scale);ctx.rotate(-this.driving.yaw);ctx.fillStyle='#fff8df';ctx.shadowColor='#edce97';ctx.shadowBlur=7;ctx.beginPath();ctx.moveTo(0,7);ctx.lineTo(5,-5);ctx.lineTo(0,-3);ctx.lineTo(-5,-5);ctx.closePath();ctx.fill();ctx.restore();}
 private resize(){const tier=this.quality==='auto'?this.autoTier:this.quality;const dpr=tier==='low'?1:tier==='high'?Math.min(devicePixelRatio,this.mobile?1.5:2):Math.min(devicePixelRatio,this.mobile?1.15:1.6);this.renderer.setPixelRatio(dpr);this.renderer.setSize(innerWidth,innerHeight,false);this.renderer.shadowMap.enabled=tier!=='low';this.staticSun?.setQuality(tier);this.car.setContactShadow(true);this.scenery.setLowDetail(tier==='low');this.importedPlants.setLowDetail(tier==='low');this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();}
 private toast(text:string){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(this.toastTimer);this.toastTimer=window.setTimeout(()=>$('toast').classList.remove('show'),2800);}
 private savePreferences(){try{localStorage.setItem('coast-settings',JSON.stringify({muted:this.audio.muted,music:this.audio.musicEnabled,musicVolume:this.audio.musicVolume,ambientVolume:this.audio.ambientVolume,quality:this.quality,reducedMotion:this.reducedMotion,headlights:this.headlights,season:this.season.snapshot(),weather:this.weather.snapshot(),daylight:this.daylightId,daylightCycle:this.daylightCycle?{hour:this.cycleHour,flow:this.timeFlow}:undefined}));}catch{}}
 private loadPreferences(){try{const v=JSON.parse(localStorage.getItem('coast-settings')||'{}');this.audio.muted=v.muted??false;this.audio.musicEnabled=v.music??true;this.audio.musicVolume=v.musicVolume??.5;this.audio.ambientVolume=v.ambientVolume??.65;this.quality=v.quality??'auto';this.headlights=v.headlights!==false;this.season.restore(v.season);this.weather.restore(v.weather);if(isDaylightId(v.daylight))this.preferredDaylight=v.daylight;if(v.daylightCycle&&typeof v.daylightCycle.hour==='number'&&Number.isFinite(v.daylightCycle.hour)){this.preferredCycle=true;this.preferredFlow=v.daylightCycle.flow===true;this.cycleHour=wrapDaylightHour(v.daylightCycle.hour);}this.reducedMotion=v.reducedMotion??this.reducedMotion;this.visited=new Set(JSON.parse(localStorage.getItem('coast-visited')||'[]'));}catch{}$<HTMLInputElement>('music-volume').value=String(this.audio.musicVolume*100);$<HTMLInputElement>('ambient-volume').value=String(this.audio.ambientVolume*100);$<HTMLSelectElement>('quality-select').value=this.quality;$<HTMLInputElement>('reduced-motion').checked=this.reducedMotion;$<HTMLInputElement>('headlights-enabled').checked=this.headlights;$<HTMLSelectElement>('daylight-select').value=this.preferredDaylight;}
 private showError(message:string){$('error-message').textContent=message;$('error-panel').classList.remove('hidden');this.paused=true;void this.audio.pause();}
 private updateDiagnostics(){if(!import.meta.env.DEV&&!new URLSearchParams(location.search).has('test'))return;const info=this.renderer.info,sun=this.staticSun.diagnostics;window.__THREE_GAME_DIAGNOSTICS__={frame:this.frame,elapsed:this.elapsed,score:this.visited.size,targetScore:landmarks.length,complete:this.visited.size===landmarks.length,player:{position:{x:this.driving.position.x,y:this.driving.position.y,z:this.driving.position.z},speed:this.driving.speed},vehicle:this.driving.dynamics?.diagnostics,season:this.season.diagnostics,weather:{...this.weather.diagnostics,drizzle:structuredClone(this.drizzle.diagnostics),audio:this.audio.weatherDiagnostics,sky:{...this.weatherSky.diagnostics}},daylight:{id:this.daylightId,loading:this.daylightLoading,direction:this.sunOffset.clone().normalize().toArray(),skyIntensity:this.scene.backgroundIntensity,environmentIntensity:this.scene.environmentIntensity,cycle:this.daylightCycle?{hour:this.cycleHour,flow:this.timeFlow,loading:this.cycleLoading,cache:structuredClone(this.daylightCycle.diagnostics)}:undefined},vehicleLights:{...this.car.root.userData.lights},vehicleMirrors:structuredClone(this.mirrors.diagnostics),cameraRig:{orbitYaw:this.orbitYaw,orbitPitch:this.orbitPitch,boomDistance:this.cameraMode===0?this.cameraBoomDistance:null,availableDistance:this.cameraMode===0?this.cameraAvailableDistance:null,cockpitEyeError:this.cameraMode===1?this.camera.position.distanceTo(this.car.cockpitEye.clone().applyMatrix4(this.car.root.matrixWorld)):null},lighting:{...sun},renderer:{calls:info.render.calls+sun.localDraws+this.mirrors.diagnostics.draws+(this.daylightCycle?.diagnostics.blendDraws??0)+this.weatherSky.diagnostics.draws,triangles:info.render.triangles+sun.localTriangles+this.mirrors.diagnostics.triangles+(this.daylightCycle?.diagnostics.blendTriangles??0)+this.weatherSky.diagnostics.triangles,mainCalls:info.render.calls,mainTriangles:info.render.triangles,geometries:info.memory.geometries,textures:info.memory.textures},canvas:{clientWidth:innerWidth,clientHeight:innerHeight,width:this.canvas.width,height:this.canvas.height,dpr:this.renderer.getPixelRatio()},state:{running:this.running,paused:this.paused,automatic:this.driving.automatic,camera:this.cameraMode,car:this.carIndex,road:this.driving.road.route.id,progress:this.driving.road.t,steer:this.driving.steer,offroad:this.driving.offroad,roadDistance:this.driving.road.distance,groundPitch:this.driving.pitch,groundRoll:this.driving.roll,hit:this.driving.hit,distance:this.driving.distance,preferHill:this.driving.preferHill,music:this.audio.musicEnabled,muted:this.audio.muted,audioState:this.audio.context?.state??'locked',fps:Math.round(this.fps),quality:this.quality,renderTier:this.quality==='auto'?this.autoTier:this.quality}};}
 private installHooks(){if(!import.meta.env.DEV&&!new URLSearchParams(location.search).has('test'))return;window.__THREE_GAME_TEST_HOOKS__={setSeason:(id:string,seconds=0)=>{if(!isSeasonId(id)||!Number.isFinite(seconds)||seconds<0||seconds>2400)throw Error('Invalid seasonal study');this.season.select(id);this.season.advance(seconds,true);this.scenery.setSeason(this.season.value);if(this.daylightCycle)this.applyDaylightCycle(performance.now()/1000,true);else this.applyFixedDaylight();this.applyWeather(true);this.mirrors.invalidate();this.updateDiagnostics();},setWeather:(id:string,seconds=0)=>{if(!isWeatherId(id)||!Number.isFinite(seconds)||seconds<0||seconds>2400)throw Error('Invalid weather study');this.weather.select(id);this.weather.advance(seconds,true);this.updateWeatherEffects();this.applyWeather(true);this.mirrors.invalidate();this.updateDiagnostics();},setDaylightCycle:(hour:number,flow=false)=>{if(!Number.isFinite(hour))throw Error('Invalid daylight hour');return this.activateDaylightCycle(wrapDaylightHour(hour),flow);},setDaylight:(id:string)=>{if(!isDaylightId(id))throw Error('Unknown daylight: '+id);return this.loadDaylight(id);},setState:async(name:string)=>{await this.sceneReady;const requestedName=name,phase=/^daylight-(dawn|day|golden|dusk|night)(-cockpit)?$/.exec(name),cyclePhase=/^cycle-(dawn|day|afternoon|golden|dusk|night)(-cockpit)?$/.exec(name);if(phase||cyclePhase)name=(phase??cyclePhase)![2]?'cockpit':'active-play';const locations:Record<string,number>={'active-play':.84,'reverse-cruise':.18,'cockpit':.84,'classic-mirrors':.84,'gt-mirrors':.84,'sport-mirrors':.84,'tunnel-mirrors':.71,'sunset':.84,'town':.37,'tunnel-approach':.666,'tunnel':.71,'tunnel-exit':.738,'cinematic':.12,'sport':.84,'modern':.84,'classic-cabin':.84,'gt-cabin':.84,'sport-cabin':.84,'offroad-start':.12,'rock-side':.802,'rock-back':.827,'shore-side':.927,'rock-drive-start':.78,'shore-wash':.18,'shore-wash-low':.18,'tree-shadow':.54,'building-shadow':.4175,'grass-verge':.12,'fern-verge':.12,'field-verge':.12,'scrub-field':.12,'bank-inland':.18,'understory':.18,'coastal-tree-near':.18,'coastal-tree-side':.18,'camera-wall':.37};if(!(name in locations))throw Error('Unknown state: '+name);this.presentation.allowPortrait();this.running=true;this.paused=false;$('welcome').classList.add('hidden');$('menu-button').classList.remove('hidden');$('driving-ui').classList.remove('hidden');$('menu-panel').classList.add('hidden');$('garage-panel').classList.add('hidden');this.driving.teleport(locations[name]);if(name==='sport'||name==='sport-cabin'||name==='sport-mirrors')this.changeCar(2);else if(name==='modern'||name==='gt-cabin'||name==='gt-mirrors')this.changeCar(1);else this.changeCar(0);this.setCamera(name==='cockpit'||name.endsWith('-cabin')||name.endsWith('-mirrors')?1:name==='cinematic'?2:0);if(name.endsWith('-cabin')){this.lookYaw=.88;this.lookPitch=1.4;}this.driving.setAutomatic(true);this.driving.speed=11;if(name==='reverse-cruise'){this.driving.yaw+=Math.PI;this.driving.setAutomatic(true);}if(name==='tree-shadow'||name==='building-shadow'){this.driving.setAutomatic(false);this.driving.speed=0;}if(name==='rock-back'){const s=coast.sample(.827);this.driving.setAutomatic(false);this.driving.position.copy(s.position).addScaledVector(s.right,-57);this.driving.position.y=this.scannedCoast.groundHeight(this.driving.position.x,this.driving.position.z)+ROAD_POSITION_CLEARANCE;this.driving.yaw=Math.atan2(s.right.x,s.right.z);this.driving.speed=0;for(let i=0;i<8&&this.scenery.blocksCar(this.driving.position.x,this.driving.position.z);i++)this.driving.position.addScaledVector(s.tangent,4);this.driving.update(1,{throttle:0,brake:0,steer:0,handbrake:false});this.orbitYaw=.6;this.orbitPitch=.55;}if(name==='shore-wash'||name==='shore-wash-low'){const s=coast.sample(.18);this.driving.setAutomatic(false);this.driving.position.copy(s.position).addScaledVector(s.right,74);this.driving.position.y=this.scannedCoast.groundHeight(this.driving.position.x,this.driving.position.z)+ROAD_POSITION_CLEARANCE;this.driving.yaw=Math.atan2(s.right.x,s.right.z);this.driving.speed=0;this.driving.update(1,{throttle:0,brake:0,steer:0,handbrake:false});this.orbitYaw=.35;this.orbitPitch=name==='shore-wash-low'?.12:.65;}if(name==='rock-side'||name==='shore-side'){this.orbitYaw=name==='rock-side'?-.9:1.4;this.orbitPitch=.55;}if(name==='grass-verge'){
 const sample=coast.sample(.12);this.driving.setAutomatic(false);this.driving.position.copy(sample.position).addScaledVector(sample.right,-12);this.driving.position.y=this.scannedCoast.groundHeight(this.driving.position.x,this.driving.position.z)+ROAD_POSITION_CLEARANCE;this.driving.speed=0;
 this.driving.update(1,{throttle:0,brake:0,steer:0,handbrake:false});this.orbitYaw=.95;this.orbitPitch=.45;
 }
 if(name==='fern-verge'){
 const source=this.scene.getObjectByName('Curved coastal fern rosettes') as THREE.InstancedMesh,anchor=new THREE.Vector3().setFromMatrixPosition(source.userData.authoredInstances[0]);
 this.driving.setAutomatic(false);this.driving.position.copy(anchor).add(new THREE.Vector3(3,0,-4));this.driving.position.y=this.scannedCoast.groundHeight(this.driving.position.x,this.driving.position.z)+ROAD_POSITION_CLEARANCE;this.driving.yaw=0;this.driving.speed=0;this.driving.update(1,{throttle:0,brake:0,steer:0,handbrake:false});this.orbitYaw=0;this.orbitPitch=.3;
 }
 if(name==='field-verge'||name==='scrub-field'){
 const source=this.scene.getObjectByName(name==='scrub-field'?'Inland grey green maquis colonies':'Dry inland patch grass clusters') as THREE.InstancedMesh,matrices=source.userData.authoredInstances as THREE.Matrix4[],sample=coast.sample(.12),target=sample.position.clone().addScaledVector(sample.right,-30);
 const nearby=matrices.slice(0,Math.floor(matrices.length*(name==='scrub-field'?.65:.55))).reduce((a,b)=>new THREE.Vector3().setFromMatrixPosition(a).distanceToSquared(target)<new THREE.Vector3().setFromMatrixPosition(b).distanceToSquared(target)?a:b),anchor=new THREE.Vector3().setFromMatrixPosition(nearby);
 this.driving.setAutomatic(false);this.driving.position.copy(anchor).add(new THREE.Vector3(4,0,-5));this.driving.position.y=this.scannedCoast.groundHeight(this.driving.position.x,this.driving.position.z)+ROAD_POSITION_CLEARANCE;this.driving.yaw=0;this.driving.speed=0;this.driving.update(1,{throttle:0,brake:0,steer:0,handbrake:false});this.orbitYaw=0;this.orbitPitch=.35;
 }
 if(name==='coastal-tree-near'||name==='coastal-tree-side'){
 const group=this.scene.getObjectByName('Wind-shaped coastal trees');if(!group)throw Error('Scanned coastal trees unavailable');
 const source=group.children[0] as THREE.InstancedMesh,matrices=source.userData.authoredInstances as THREE.Matrix4[],sample=coast.sample(.18),target=sample.position.clone().addScaledVector(sample.right,-30);
 const isolated=matrices.filter(a=>matrices.every(b=>a===b||(a.elements[12]-b.elements[12])**2+(a.elements[14]-b.elements[14])**2>144)),nearest=(isolated.length?isolated:matrices).reduce((a,b)=>new THREE.Vector3().setFromMatrixPosition(a).distanceToSquared(target)<new THREE.Vector3().setFromMatrixPosition(b).distanceToSquared(target)?a:b),anchor=new THREE.Vector3().setFromMatrixPosition(nearest),angle=name==='coastal-tree-side'?Math.PI/2:0;
 this.driving.setAutomatic(false);this.driving.position.copy(anchor).add(new THREE.Vector3(-3,0,-6).applyAxisAngle(new THREE.Vector3(0,1,0),angle));this.driving.position.y=this.scannedCoast.groundHeight(this.driving.position.x,this.driving.position.z)+ROAD_POSITION_CLEARANCE;this.driving.yaw=angle;this.driving.speed=0;this.driving.update(1,{throttle:0,brake:0,steer:0,handbrake:false});this.orbitYaw=0;this.orbitPitch=.3;
 }
 if(name==='understory'){
 const sample=coast.sample(.18);this.driving.setAutomatic(false);this.driving.position.copy(sample.position).addScaledVector(sample.right,-29).addScaledVector(sample.tangent,-6);this.driving.position.y=this.scannedCoast.groundHeight(this.driving.position.x,this.driving.position.z)+ROAD_POSITION_CLEARANCE;this.driving.yaw=Math.atan2(sample.tangent.x,sample.tangent.z);this.driving.speed=0;this.driving.update(1/60,{throttle:0,brake:0,steer:0,handbrake:false});this.orbitYaw=.4;this.orbitPitch=.25;
 }
 if(name==='bank-inland'){
 const s=coast.sample(.18);this.driving.setAutomatic(false);this.driving.position.copy(s.position).addScaledVector(s.right,-26);this.driving.yaw=Math.atan2(-s.right.x,-s.right.z);this.driving.speed=0;
 for(let i=0;i<8&&this.scenery.blocksCar(this.driving.position.x,this.driving.position.z);i++)this.driving.position.addScaledVector(s.tangent,4);
 this.driving.position.y=this.scannedCoast.groundHeight(this.driving.position.x,this.driving.position.z)+ROAD_POSITION_CLEARANCE;this.driving.update(1,{throttle:0,brake:0,steer:0,handbrake:false});this.orbitYaw=.4;this.orbitPitch=.22;
 }
 if(name==='camera-wall'){
 const road=coast.sample(.37),wall=this.destinations.colliders.reduce((a,b)=>(a.x-road.position.x)**2+(a.z-road.position.z)**2<(b.x-road.position.x)**2+(b.z-road.position.z)**2?a:b),dx=road.position.x-wall.x,dz=road.position.z-wall.z;
 this.driving.setAutomatic(false);this.driving.speed=0;
 if(Math.abs(dx)/(wall.halfX+1.8)>Math.abs(dz)/(wall.halfZ+1.8))this.driving.position.set(wall.x+Math.sign(dx||1)*(wall.halfX+1.8),0,THREE.MathUtils.clamp(road.position.z,wall.z-wall.halfZ,wall.z+wall.halfZ));
 else this.driving.position.set(THREE.MathUtils.clamp(road.position.x,wall.x-wall.halfX,wall.x+wall.halfX),0,wall.z+Math.sign(dz||1)*(wall.halfZ+1.8));
 this.driving.position.y=this.scannedCoast.groundHeight(this.driving.position.x,this.driving.position.z)+ROAD_POSITION_CLEARANCE;this.driving.yaw=Math.atan2(this.driving.position.x-wall.x,this.driving.position.z-wall.z);this.driving.update(1,{throttle:0,brake:0,steer:0,handbrake:false});this.orbitYaw=0;this.orbitPitch=.22;
 }
 this.driving.resetDynamics();this.elapsed=30;this.ambientElapsed=30;this.cameraSnap=true;this.updateCar(0);this.updateCamera(0);if(phase){const phasePaused=this.screenshotPaused;this.screenshotPaused=true;try{if(!await this.loadDaylight(phase[1] as DaylightId))throw Error('Daylight fixture unavailable: '+phase[1]);}finally{this.screenshotPaused=phasePaused;}}if(cyclePhase){const phasePaused=this.screenshotPaused;this.screenshotPaused=true;try{const hour=cyclePhase[1]==='afternoon'?17.5:DAYLIGHT_HOURS[cyclePhase[1] as DaylightId];if(!await this.activateDaylightCycle(hour,false))throw Error('Cycle fixture unavailable: '+cyclePhase[1]);}finally{this.screenshotPaused=phasePaused;}}this.updateUI();clearTimeout(this.toastTimer);$('toast').classList.remove('show');const wasPaused=this.screenshotPaused;this.screenshotPaused=true;try{await this.renderer.compileAsync(this.scene,this.camera);await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));this.updateDiagnostics();}finally{this.screenshotPaused=wasPaused;}return{state:requestedName};},stepDriving:(seconds:number,intent?:{throttle:number;brake:number;steer:number;handbrake:boolean})=>{if(!Number.isFinite(seconds)||seconds<0||seconds>30)throw Error('Invalid driving interval');if(intent)this.driving.setAutomatic(false);for(let t=0;t<seconds-1e-7;t+=1/60)this.driving.update(1/60,intent??{throttle:0,brake:0,steer:0,handbrake:false});this.updateCar(0);this.updateCamera(0);this.updateDiagnostics();},setSceneTime:(seconds:number)=>{if(!Number.isFinite(seconds)||seconds<0)throw Error('Invalid scene time');this.elapsed=seconds;this.ambientElapsed=seconds;this.captureStableAmbient=false;this.screenshotPaused=true;this.scenery.updateVehicle(seconds,this.car.root,this.car.wheelContacts);this.scenery.update(seconds,this.driving.position);this.scannedCoast.update(this.driving.position,seconds);},setPausedForScreenshot:(v:boolean)=>{this.screenshotPaused=v;},setReducedMotion:(v:boolean)=>{this.captureStableAmbient=v;}};}
 dispose(){this.disposed=true;this.drizzle.dispose();this.weatherSky.dispose();this.cancelPreparingCycle();this.daylightCycle?.dispose();this.hdrTexture?.dispose();cancelAnimationFrame(this.raf);this.abort.abort();this.presentation.dispose();clearTimeout(this.toastTimer);this.input.dispose();this.audio.dispose();this.staticSun.dispose();this.cameraSurface?.dispose();this.driving.dynamics?.dispose();this.scenery.dispose();this.roadMesh.dispose();this.destinations.dispose();this.importedPlants.dispose();this.scannedCoast.dispose();this.mirrors.dispose();this.car.dispose();this.environmentTarget?.dispose();this.renderer.dispose();delete window.__THREE_GAME_DIAGNOSTICS__;delete window.__THREE_GAME_TEST_HOOKS__;}
}
