import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { heightAt, coast, hill, roads } from './roads';
import { createSeededRandom } from '../utils/random';
import {createPalmCrown,createPineCrown} from './TreeGeometry';
import {createCoastalWater} from './CoastalWater';

/** Authored, deterministic coastal landscape. Distances and animation time are in metres / seconds. */
export function createScenery(scene: THREE.Scene, mobile: boolean,loadingManager=THREE.DefaultLoadingManager): {
  update: (elapsed: number, carPosition: THREE.Vector3) => void;
  dispose: () => void;
  groundHeight: (x:number,z:number) => number;
  terrainHeight: (x:number,z:number) => number;
  terrainMaterial: THREE.Material;
  rockMaterial: THREE.MeshStandardMaterial;
  blocksCar: (x:number,z:number) => boolean;
  cullForCamera:(camera:THREE.Camera)=>void;
  registerInstances:(mesh:THREE.InstancedMesh,matrices:THREE.Matrix4[])=>void;
  prepareShore:(sample:(x:number,z:number)=>number)=>void;
  addShoreWetness:(material:THREE.MeshStandardMaterial)=>void;
  createShadowCasters:()=>THREE.Group;
  setSkyReflection:(texture:THREE.Texture)=>void;
  setLowDetail:(enabled:boolean)=>void;
} {
  const root = new THREE.Group();
  root.name = 'Coastal landscape';
  scene.add(root);
  let random = createSeededRandom(864203);
  const time = { value: 0 };
  const sun = new THREE.Vector3(.8058, .1072, .5824).normalize();
  const water=createCoastalWater(scene,mobile,time,sun);
  const windMaterials: THREE.MeshStandardMaterial[] = [];
  const resources = new Set<THREE.BufferGeometry | THREE.Material>();
  const textures: THREE.Texture[] = [];
  let disposed = false;
  const textureLoader = new THREE.TextureLoader(loadingManager);
  function surfaceTexture(file: string, color = false): THREE.Texture {
    const texture = textureLoader.load(`${import.meta.env.BASE_URL}assets/environment/${file}`, loaded => {
      if (disposed) loaded.dispose();
    });
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.anisotropy = mobile ? 4 : 8;
    textures.push(texture);
    return texture;
  }
  const groundMaps = {
    color: surfaceTexture('ground-color.jpg', true), normal: surfaceTexture('ground-normal.jpg'), roughness: surfaceTexture('ground-roughness.jpg'),
  };
  const sandMaps = {
    color: surfaceTexture('sand-color.jpg', true), normal: surfaceTexture('sand-normal.jpg'), roughness: surfaceTexture('sand-roughness.jpg'),
  };
  const rockMaps = {
    color: surfaceTexture('rock-color.jpg', true), normal: surfaceTexture('rock-normal.jpg'), roughness: surfaceTexture('rock-roughness.jpg'),
  };
  const keep = <T extends THREE.BufferGeometry | THREE.Material>(resource: T): T => {
    resources.add(resource);
    return resource;
  };
  const place = (geometry: THREE.BufferGeometry, material: THREE.Material, name: string): THREE.Mesh => {
    const mesh = new THREE.Mesh(keep(geometry), keep(material));
    mesh.name = name;
    root.add(mesh);
    return mesh;
  };
  const samples = roads.flatMap(route => Array.from({ length: Math.ceil(route.length / 5) }, (_, i) => {
    // The fixed sample spacing is used only for prop exclusion, never for driving.
    const t=i/Math.ceil(route.length/5);
    const sample=route.sample(t);
    return { position: sample.position, right:sample.right, width: route.width, id:route.id, t };
  }));
  function closestSurface(x:number,z:number) {
    let point=samples[0],squared=Infinity;
    for(const candidate of samples) {
      const d=(candidate.position.x-x)**2+(candidate.position.z-z)**2;
      if(d<squared){point=candidate;squared=d;}
    }
    return {point,distance:Math.sqrt(squared)};
  }
  function naturalVerge(x:number,z:number,clearance:number):boolean {
    const {point,distance}=closestSurface(x,z);
    if(distance<clearance)return false;
    if(point.id==='coast') {
      const seaward=(x-point.position.x)*point.right.x+(z-point.position.z)*point.right.z;
      if(point.t>.795&&point.t<.955&&Math.abs(point.t-.88)>.025&&seaward>11.5)return false;
      if(point.t>.865&&point.t<.895&&seaward>16)return false;
      if(point.t>.328&&point.t<.423&&distance<15.2)return false;
      if(point.t>.665&&point.t<.751&&distance<23)return false;
      // The tunnel hill is an exposed rock formation rather than a planted flat roof.
      if(point.t>.667&&point.t<.749&&distance<75)return false;
    }
    return true;
  }
  const shoreScale=(a:number)=>1+Math.sin(a*5+.4)*.025+Math.sin(a*11+1.8)*.014+Math.sin(a*19-.8)*.007;
  let sampledTerrain:((x:number,z:number)=>number)|null=null;
  function peninsulaHeight(x:number,z:number,distance:number,landward:number):number {
    const radius=Math.hypot(x/355,z/292),angle=Math.atan2(z/292,x/355);
    const shift=1+(shoreScale(angle)-1)*THREE.MathUtils.smoothstep(radius,.97,1.08);
    // The old opaque sea concealed a flat floor only 10cm underwater. Real wash
    // needs a descending seabed so a trough cannot uncover the whole bay.
    const coastal=heightAt(x/shift,z/shift)-Math.min(35,Math.max(0,radius/shift-1.118)*120);
    const mound=(cx:number,cz:number,rx:number,rz:number)=>Math.exp(-(((x-cx)/rx)**2+((z-cz)/rz)**2));
    const ridge=26*mound(-115,-125,100,83)+24*mound(-30,-100,105,105)
      +25*mound(110,-120,112,88)+23*mound(30,80,135,108)+18*mound(-130,140,95,78);
    const erosion=.86+.08*Math.sin(x*.043+Math.sin(z*.031)*2.4)+.06*Math.sin(z*.071+x*.019);
    return coastal+ridge*erosion*THREE.MathUtils.smoothstep(distance,17,58)*landward;
  }
  function groundHeight(x: number, z: number): number {
    if(sampledTerrain)return sampledTerrain(x,z);
    const {point:closest,distance}=closestSurface(x,z);
    const cut = 1 - THREE.MathUtils.smoothstep(distance, closest.width / 2 + 8, closest.width / 2 + 19);
    const outward=(x-closest.position.x)*closest.right.x+(z-closest.position.z)*closest.right.z;
    const landward=closest.id==='coast'?1-THREE.MathUtils.smoothstep(outward,8,28):1;
    let y=peninsulaHeight(x,z,distance,landward);
    if(closest.id==='coast'&&closest.t>.328&&closest.t<.423) {
      // Retain the existing town foundations and promenade before the hillside rises.
      y=THREE.MathUtils.lerp(heightAt(x,z),y,THREE.MathUtils.smoothstep(distance,25,46));
    }
    if(closest.id==='coast') {
      const headland=THREE.MathUtils.smoothstep(closest.t,.79,.805)*(1-THREE.MathUtils.smoothstep(closest.t,.945,.96));
      const lighthouse=1-THREE.MathUtils.smoothstep(Math.abs(closest.t-.88),.013,.025);
      const inlet=headland*(1-lighthouse)*THREE.MathUtils.smoothstep(outward,13,28);
      // Real coastal drop below the scanned rim; retain the lighthouse's continuous peninsula.
      y-=Math.max(0,y+2.2)*inlet;
    }
    return y - Math.max(0, y - closest.position.y + .62) * cut - .025;
  }
  const terrainColor = new THREE.Color();
  const sand = new THREE.Color('#b59a6d');
  const grassColor = new THREE.Color('#61734a');
  const stoneColor = new THREE.Color('#85816c');

  // Ground: muted limestone, dry coastal grass, pale sand, darker sheltered gullies.
  const subdivisions = mobile ? 120 : 160;
  const terrain = new THREE.PlaneGeometry(1060, 940, subdivisions, subdivisions);
  terrain.rotateX(-Math.PI / 2);
  const tp = terrain.getAttribute('position');
  const terrainColors: number[] = [];
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i), z = tp.getZ(i);
    const y = groundHeight(x, z);
    // Cut the hillside back at road edges: a flat-width road would otherwise be
    // swallowed by the uphill slope, particularly with the mobile terrain mesh.
    tp.setY(i, y);
    const noise = Math.sin(x * .082 + Math.sin(z * .033) * 3) * Math.cos(z * .069) * .5 + .5;
    const grain = Math.sin(x * .41 + z * .37) * .035;
    terrainColor.copy(sand).lerp(grassColor, THREE.MathUtils.smoothstep(y, 1, 10));
    terrainColor.lerp(stoneColor, Math.max(0, noise - .40) * .72);
    terrainColor.multiplyScalar(.74 + noise * .40 + grain);
    terrainColors.push(terrainColor.r, terrainColor.g, terrainColor.b);
  }
  terrain.setAttribute('color', new THREE.Float32BufferAttribute(terrainColors, 3));
  terrain.computeVertexNormals();
  sampledTerrain=(x,z)=>{
    if(Math.abs(x)>530||Math.abs(z)>470)return -4;
    const gx=THREE.MathUtils.clamp((x+530)/1060*subdivisions,0,subdivisions),gz=THREE.MathUtils.clamp((z+470)/940*subdivisions,0,subdivisions);
    const ix=Math.min(subdivisions-1,Math.floor(gx)),iz=Math.min(subdivisions-1,Math.floor(gz)),u=gx-ix,v=gz-iz,a=iz*(subdivisions+1)+ix,b=a+subdivisions+1,d=a+1,c=b+1;
    return u+v<=1?tp.getY(a)*(1-u-v)+tp.getY(d)*u+tp.getY(b)*v:tp.getY(c)*(u+v-1)+tp.getY(b)*(1-u)+tp.getY(d)*(1-v);
  };
  const groundMaterial = new THREE.MeshStandardMaterial({ roughness: .96, metalness: 0 });
  groundMaterial.onBeforeCompile = shader => {
    for (const [prefix, maps] of Object.entries({ Ground:groundMaps, Sand:sandMaps, Rock:rockMaps })) {
      shader.uniforms[`u${prefix}Color`] = { value:maps.color };
      shader.uniforms[`u${prefix}Normal`] = { value:maps.normal };
      shader.uniforms[`u${prefix}Rough`] = { value:maps.roughness };
    }
    shader.vertexShader = 'varying vec3 vGroundPosition;varying vec3 vGroundWorldNormal;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvGroundPosition = (modelMatrix*vec4(position,1.0)).xyz;vGroundWorldNormal=normalize(mat3(modelMatrix)*normal);');
    shader.fragmentShader = `varying vec3 vGroundPosition;varying vec3 vGroundWorldNormal;
      uniform sampler2D uGroundColor,uGroundNormal,uGroundRough,uSandColor,uSandNormal,uSandRough,uRockColor,uRockNormal,uRockRough;
      float coastHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float coastNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(coastHash(i),coastHash(i+vec2(1,0)),f.x),mix(coastHash(i+vec2(0,1)),coastHash(i+1.0),f.x),f.y);}
      vec3 coastTriplanar(sampler2D source,vec3 point,float size,vec3 weights){return texture2D(source,point.zy/size).rgb*weights.x+texture2D(source,point.xz/size).rgb*weights.y+texture2D(source,point.xy/size).rgb*weights.z;}
    ` + shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      vec2 soilUv=vGroundPosition.xz/15.0,sandUv=vGroundPosition.xz/12.0,rockUv=vGroundPosition.xz/3.5;
      float macro=coastNoise(vGroundPosition.xz*.035);
      float sandWeight=1.0-smoothstep(2.0,9.0,vGroundPosition.y+macro*2.2);
      vec3 triWeights=pow(abs(vGroundWorldNormal),vec3(4.0));triWeights/=max(dot(triWeights,vec3(1.0)),.001);
      float slope=1.0-clamp(vGroundWorldNormal.y,0.0,1.0);
      float rockWeight=clamp(slope*2.4+smoothstep(.76,.95,macro)*.13,0.0,.87);
      vec3 soil=texture2D(uGroundColor,soilUv).rgb;
      vec3 sand=texture2D(uSandColor,sandUv).rgb;
      vec3 stone=coastTriplanar(uRockColor,vGroundPosition,3.5,triWeights);
      ${mobile ? '' : `soil=mix(soil,texture2D(uGroundColor,soilUv*1.73+vec2(17.3,9.7)).rgb,coastNoise(vGroundPosition.xz*.08)*.34);
      sand=mix(sand,texture2D(uSandColor,sandUv*1.57+vec2(3.7,8.1)).rgb,.26);`}
      float meadowPattern=coastNoise(vGroundPosition.xz*.019+vec2(11.7,3.1));
      float grassCover=smoothstep(.19,.73,meadowPattern)*(1.0-smoothstep(.19,.46,slope));
      vec3 meadow=vec3(.14,.185,.077)*(.65+min(dot(soil,vec3(.24,.60,.16))*2.3,.70));
      soil=mix(soil,meadow,grassCover*.83);
      vec3 albedo=mix(mix(soil,sand,sandWeight),stone,rockWeight);
      float damp=1.0-smoothstep(-.7,1.4,vGroundPosition.y);
      diffuseColor.rgb=albedo*mix(.91,1.16,macro)*mix(1.0,.65,damp);
      vec3 soilNormal=texture2D(uGroundNormal,soilUv).xyz*2.0-1.0;
      vec3 sandNormal=texture2D(uSandNormal,sandUv).xyz*2.0-1.0;
      vec3 stoneNormal=texture2D(uRockNormal,rockUv).xyz*2.0-1.0;
      vec3 mixedGroundNormal=mix(mix(soilNormal,sandNormal,sandWeight),stoneNormal,rockWeight);
      float scannedRoughness=mix(mix(texture2D(uGroundRough,soilUv).r,texture2D(uSandRough,sandUv).r,sandWeight),texture2D(uRockRough,rockUv).r,rockWeight);
    `).replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor=clamp(scannedRoughness*.92,.67,1.0);')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal=normalize(normal+mat3(viewMatrix)*vec3(mixedGroundNormal.x*.42,0.0,mixedGroundNormal.y*.42));');
  };
  groundMaterial.customProgramCacheKey = () => `coastal-scanned-meadow-rock-v2-${mobile}`;
  water.addWetness(groundMaterial);
  place(terrain, groundMaterial, 'Limestone headland and grassy interior').receiveShadow = true;

  // The road passes through a continuous headland, with a true arched void at both portals.
  // This top surface is separate from the heightfield so the driving corridor remains open below it.
  const capStart=.6802,capEnd=.7348,capAlong=mobile?34:48,capAcross=32,capMin=-75,capMax=32;
  const capVertices:number[]=[];
  function capPoint(t:number,offset:number):THREE.Vector3 {
    const progress=(t-capStart)/(capEnd-capStart);
    const flankWeight=THREE.MathUtils.smoothstep(Math.abs(offset),6.4,12);
    const flankExtension=flankWeight*.015;
    const actualT=THREE.MathUtils.lerp(capStart-flankExtension,capEnd+flankExtension,progress);
    const sample=coast.sample(actualT),p=sample.position.clone().addScaledVector(sample.right,offset);
    const u=(offset-capMin)/(capMax-capMin);
    const weathering=.91+.055*Math.sin(p.x*.12+Math.sin(p.z*.07))+.035*Math.cos(p.z*.11+p.x*.04);
    const approach=Math.pow(Math.max(0,Math.sin(progress*Math.PI)),.40);
    const slopeIntoHill=1-flankWeight*(1-approach);
    const cover=Math.pow(Math.max(0,Math.sin(u*Math.PI)),1.25)*(12+18*Math.exp(-(((offset+22)/34)**2)))*weathering*slopeIntoHill;
    p.y=groundHeight(p.x,p.z)+cover;
    return p;
  }
  function capTriangle(a:THREE.Vector3,b:THREE.Vector3,c:THREE.Vector3) {
    capVertices.push(a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z);
  }
  for(let row=0;row<capAlong;row++)for(let col=0;col<capAcross;col++) {
    const t=THREE.MathUtils.lerp(capStart,capEnd,row/capAlong),t2=THREE.MathUtils.lerp(capStart,capEnd,(row+1)/capAlong);
    const x=THREE.MathUtils.lerp(capMin,capMax,col/capAcross),x2=THREE.MathUtils.lerp(capMin,capMax,(col+1)/capAcross);
    const a=capPoint(t,x),b=capPoint(t2,x),c=capPoint(t,x2),d=capPoint(t2,x2);
    capTriangle(a,b,c);capTriangle(b,d,c);
  }
  for(const t of [capStart,capEnd]) {
    const offsets=[capMin,-60,-45,-30,-20,-12,-8,-6.4,-5.6,-4.5,-3,-1.5,0,1.5,3,4.5,5.6,6.4,8,12,20,capMax];
    for(let i=0;i<offsets.length-1;i++) {
      const x=offsets[i],x2=offsets[i+1],a=capPoint(t,x),b=capPoint(t,x2),c=a.clone(),d=b.clone(),roadY=coast.sample(t).position.y;
      c.y=Math.abs(x)<=6.4?roadY+6.74*Math.sqrt(Math.max(0,1-(x/6.4)**2)):groundHeight(c.x,c.z)-.35;
      d.y=Math.abs(x2)<=6.4?roadY+6.74*Math.sqrt(Math.max(0,1-(x2/6.4)**2)):groundHeight(d.x,d.z)-.35;
      const tangent=coast.sample(t).tangent,sign=t===capStart?-1:1;
      const eroded=(bottom:THREE.Vector3,top:THREE.Vector3,v:number)=>{
        const p=bottom.clone().lerp(top,v);
        const relief=Math.sin(v*Math.PI)*.7*(Math.sin(p.x*.21+p.y*.48)+.5*Math.cos(p.z*.23-p.y*.39));
        return p.addScaledVector(tangent,sign*relief);
      };
      for(let layer=0;layer<8;layer++) {
        const lowA=eroded(c,a,layer/8),lowB=eroded(d,b,layer/8),topA=eroded(c,a,(layer+1)/8),topB=eroded(d,b,(layer+1)/8);
        if(t===capStart){capTriangle(topA,topB,lowA);capTriangle(topB,lowB,lowA);}else{capTriangle(topA,lowA,topB);capTriangle(topB,lowA,lowB);}
      }
    }
  }
  const rawCapGeometry=new THREE.BufferGeometry();rawCapGeometry.setAttribute('position',new THREE.Float32BufferAttribute(capVertices,3));
  const capGeometry=mergeVertices(rawCapGeometry,.001);rawCapGeometry.dispose();capGeometry.computeVertexNormals();
  const cap=place(capGeometry,groundMaterial,'Eroded headland over the mountain tunnel');cap.castShadow=true;cap.receiveShadow=true;
  capGeometry.computeBoundingBox();const capBounds=capGeometry.boundingBox!;
  function cameraGroundHeight(x:number,z:number):number {
    const base=groundHeight(x,z);if(x<capBounds.min.x-2||x>capBounds.max.x+2||z<capBounds.min.z-2||z>capBounds.max.z+2)return base;
    const{point}=closestSurface(x,z);
    if(point.id!=='coast')return base;
    const offset=(x-point.position.x)*point.right.x+(z-point.position.z)*point.right.z;
    // Preserve the air corridor inside the cave, while preventing an orbit camera entering its solid flanks.
    if(Math.abs(offset)<6.1||offset<capMin||offset>capMax)return base;
    const extension=THREE.MathUtils.smoothstep(Math.abs(offset),6.4,12)*.015;
    const progress=(point.t-(capStart-extension))/(capEnd-capStart+extension*2);
    if(progress<0||progress>1)return base;
    return Math.max(base,capPoint(THREE.MathUtils.lerp(capStart,capEnd,progress),offset).y);
  }

  // A sky dome avoids an external HDR dependency while retaining a consistent sunset direction.
  const sky = place(new THREE.SphereGeometry(1900, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uSun: { value: sun }, uTime: time },
    vertexShader: `varying vec3 vDirection;
      void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform vec3 uSun;uniform float uTime;varying vec3 vDirection;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.0),f.x),f.y);}
      void main(){
        vec3 dir=normalize(vDirection);float h=max(dir.y,0.0);
        vec3 horizon=vec3(.91,.39,.18),zenith=vec3(.065,.10,.25);
        vec3 col=mix(horizon,vec3(.28,.22,.38),smoothstep(0.0,.19,h));
        col=mix(col,zenith,smoothstep(.09,.72,h));
        float alignment=max(dot(dir,uSun),0.0);
        col+=vec3(.78,.28,.065)*pow(alignment,9.0);
        float disc=smoothstep(.99978,.99992,alignment);
        col+=vec3(6.5,3.2,.8)*disc;
        col+=vec3(.52,.18,.04)*pow(alignment,240.0);
        vec2 uv=dir.xz/max(dir.y+.16,.06);
        vec2 elongated=uv*vec2(.75,3.7)+vec2(uTime*.0018,0);
        float n=noise(elongated*1.3)+noise(elongated*3.2)*.38+noise(elongated*7.1)*.12;
        float clouds=smoothstep(.68,1.14,n)*smoothstep(.025,.10,h)*(1.0-smoothstep(.35,.67,h));
        vec3 cloudColor=mix(vec3(.24,.22,.35),vec3(.95,.52,.28),pow(alignment,3.0));
        col=mix(col,cloudColor,clouds*.52);
        col=mix(vec3(.54,.33,.30),col,smoothstep(-.055,.012,dir.y));
        gl_FragColor=vec4(col,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }), 'Golden hour sky and high cirrus');
  sky.frustumCulled = false;
  sky.renderOrder = -10;

  // Geometry assembly helpers keep repeated coastal assets in a handful of draw calls.
  type TreeLod={near:Uint8Array;detail:'near'|'far';anchors:THREE.Vector3[]};
  const visibleBatches:{mesh:THREE.InstancedMesh;matrices:THREE.Matrix4[];colors?:THREE.Color[];bounds:THREE.Sphere[];slots:Int32Array;limit:number;lod?:TreeLod}[]=[];
  const viewFrustum=new THREE.Frustum(),viewProjection=new THREE.Matrix4(),viewPosition=new THREE.Vector3();
  const debugPlacements=import.meta.env.DEV||new URLSearchParams(location.search).has('test');
  function registerInstances(mesh:THREE.InstancedMesh,matrices:THREE.Matrix4[],colors?:THREE.Color[],lod?:TreeLod){
    const geometry=mesh.geometry;mesh.computeBoundingSphere();geometry.computeBoundingSphere();
    const bounds=matrices.map(matrix=>{const sphere=geometry.boundingSphere!.clone().applyMatrix4(matrix);sphere.radius+=.8;return sphere;});
    visibleBatches.push({mesh,matrices,colors,bounds,slots:Int32Array.from(matrices.map((_,i)=>i)),limit:matrices.length,lod});
    if(debugPlacements)mesh.userData.authoredInstances=matrices;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);if(mesh.instanceColor)mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  }
  function batch(geometry: THREE.BufferGeometry, material: THREE.Material, matrices: THREE.Matrix4[], colors?: THREE.Color[],lod?:TreeLod): THREE.InstancedMesh {
    const mesh = new THREE.InstancedMesh(keep(geometry), keep(material), matrices.length);
    mesh.receiveShadow=true;
    matrices.forEach((matrix, i) => { mesh.setMatrixAt(i, matrix); if (colors) mesh.setColorAt(i, colors[i]); });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    registerInstances(mesh,matrices,colors,lod);
    root.add(mesh);
    return mesh;
  }
  function treeBatch(geometry:THREE.BufferGeometry,material:THREE.Material,matrices:THREE.Matrix4[],colors?:THREE.Color[],farGeometry?:THREE.BufferGeometry):THREE.Group {
    // Per-instance visibility removes the need for many spatial draw batches.
    const group=new THREE.Group();root.add(group);const near=new Uint8Array(matrices.length).fill(1),anchors=matrices.map(m=>new THREE.Vector3(m.elements[12],m.elements[13],m.elements[14]));
    const mesh=batch(geometry,material,matrices,colors,farGeometry?{near,anchors,detail:'near'}:undefined);mesh.name='Visible detailed trees';group.add(mesh);
    if(farGeometry){const far=batch(farGeometry,material,matrices,colors,{near,anchors,detail:'far'});far.name='Visible distant trees';group.add(far);}
    return group;
  }
  function matrix(x: number, y: number, z: number, sx: number, sy: number, sz: number, angle = random() * Math.PI * 2): THREE.Matrix4 {
    return new THREE.Matrix4().compose(new THREE.Vector3(x,y,z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),angle), new THREE.Vector3(sx,sy,sz));
  }
  function wind(color: number, amplitude: number,crownRoot=false): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({ color, roughness: .9, side: THREE.DoubleSide });
    material.onBeforeCompile = shader => {
      shader.uniforms.uSceneryTime = time;
      shader.vertexShader = 'uniform float uSceneryTime;\n' + shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        float phase=0.0;
        #ifdef USE_INSTANCING
          phase=instanceMatrix[3].x*.34+instanceMatrix[3].z*.19;
        #endif
        float anchoredHeight=${crownRoot?'length(position-vec3(.65,7.8,0.0))':'max(position.y,0.0)'};
        transformed.x+=sin(uSceneryTime*1.25+phase+position.y*.2)*${amplitude.toFixed(4)}*anchoredHeight;
        transformed.z+=cos(uSceneryTime*.83+phase)*${(amplitude * .55).toFixed(4)}*anchoredHeight;`);
    };
    material.customProgramCacheKey = () => `coast-wind-${amplitude}-${crownRoot}`;
    windMaterials.push(material);
    return material;
  }
  function combined(parts: { geometry: THREE.BufferGeometry; transform?: THREE.Matrix4; color?: THREE.Color }[]): THREE.BufferGeometry {
    const vertices: number[] = [], normals: number[] = [], colors: number[] = [];
    for (const part of parts) {
      const g = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry.clone();
      if (part.transform) g.applyMatrix4(part.transform);
      const p=g.getAttribute('position'),n=g.getAttribute('normal');
      for(let i=0;i<p.count;i++) {
        vertices.push(p.getX(i),p.getY(i),p.getZ(i));
        normals.push(n.getX(i),n.getY(i),n.getZ(i));
        const c=part.color || new THREE.Color(1,1,1); colors.push(c.r,c.g,c.b);
      }
      g.dispose();part.geometry.dispose();
    }
    const result = new THREE.BufferGeometry();
    result.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    result.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
    result.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    return result;
  }

  // Pale offshore stacks and two distant silhouettes establish the scale of the bay.
  const islandMatrices: THREE.Matrix4[] = [];
  const islandColors: THREE.Color[] = [];
  for(let i=0;i<20;i++) {
    const angle=i/20*Math.PI*2+.1;
    const distance=760+random()*480;
    islandMatrices.push(matrix(Math.cos(angle)*distance,-6,Math.sin(angle)*distance,65+random()*90,17+random()*47,38+random()*70));
    islandColors.push(new THREE.Color('#8b9b94').multiplyScalar(.75+random()*.15));
  }
  const islandShape = new THREE.SphereGeometry(1,24,12);
  const islandPosition=islandShape.getAttribute('position');
  for(let i=0;i<islandPosition.count;i++) {
    const y=islandPosition.getY(i);
    islandPosition.setY(i,y>0?y*(.65+.18*Math.sin(islandPosition.getX(i)*5)):y);
  }
  islandShape.computeVertexNormals();
  batch(islandShape,new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}),islandMatrices,islandColors).name='Hazy offshore islets';

  // Rocks are rounded limestone with deformed facets, never identical spheres.
  const rockShape = new THREE.SphereGeometry(1,12,8);
  const rp=rockShape.getAttribute('position');
  for(let i=0;i<rp.count;i++) {
    const x=rp.getX(i),y=rp.getY(i),z=rp.getZ(i),f=1+Math.sin(x*7+z*5)*.15;
    rp.setXYZ(i,x*f,y*(.9+Math.sin(z*4)*.12),z*f);
  }
  rockShape.computeVertexNormals();
  const rocks:THREE.Matrix4[]=[],rockColors:THREE.Color[]=[];
  for(let i=0;i<(mobile?90:145);i++) {
    const a=random()*Math.PI*2,r=.97+random()*.18,x=Math.cos(a)*355*r,z=Math.sin(a)*292*r;
    const y=groundHeight(x,z);
    if(!naturalVerge(x,z,9))continue;
    const scale=.7+random()*3.4;
    rocks.push(matrix(x,y-.3,z,scale,scale*(.5+random()*.65),scale*(.8+random()*.5)));
    rockColors.push(new THREE.Color('#e4dfd2').multiplyScalar(.88+random()*.22));
  }
  // Broken rock ledges anchor the sunset drive to the inland slope instead of filling it with props.
  for(let ridge=0;ridge<(mobile?6:10);ridge++) {
    const sample=coast.sample(.795+ridge*.0105),inland=sample.position.clone().addScaledVector(sample.right,-(31+random()*25));
    for(let piece=0;piece<2;piece++) {
      const x=inland.x+(random()-.5)*9,z=inland.z+(random()-.5)*8,y=groundHeight(x,z);
      const sx=4+random()*4,sy=3.5+random()*4.5,sz=2.6+random()*3.2;
      rocks.push(matrix(x,y-2.2,z,sx,sy,sz,Math.atan2(sample.tangent.x,sample.tangent.z)+.5));
      rockColors.push(new THREE.Color('#d1cbb9').multiplyScalar(.85+random()*.22));
    }
  }
  const rockMaterial=new THREE.MeshStandardMaterial({color:0xffffff,map:rockMaps.color,normalMap:rockMaps.normal,roughnessMap:rockMaps.roughness,roughness:.95});
  for(const texture of Object.values(rockMaps))texture.repeat.set(2,2);
  rockMaterial.normalScale.set(.72,.72);
  water.addWetness(rockMaterial);
  batch(rockShape,rockMaterial,rocks,rockColors).name='Coastal limestone boulders';

  // Procedural leaf atlases retain fine organic silhouettes without thousands of opaque triangles.
  function plantTexture(kind: 'grass' | 'shrub'): THREE.CanvasTexture {
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
    const ctx=canvas.getContext('2d')!;
    ctx.clearRect(0,0,256,256);
    if(kind==='grass') {
      for(let i=0;i<38;i++) {
        const base=35+random()*185,tip=base+(random()-.5)*115,top=18+random()*135;
        ctx.strokeStyle=`hsl(${65+random()*30},${22+random()*14}%,${23+random()*24}%)`;
        ctx.lineWidth=1.3+random()*3;ctx.lineCap='round';
        ctx.beginPath();ctx.moveTo(base,255);ctx.bezierCurveTo(base+(tip-base)*.2,160,tip,top+30,tip,top);ctx.stroke();
        if(i%4===0) {
          ctx.strokeStyle='#b3aa75';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(tip,top+21);ctx.lineTo(tip,top-6);ctx.stroke();
          for(let j=0;j<5;j++){ctx.beginPath();ctx.ellipse(tip+(j%2?3:-3),top+j*3-4,1.4,3,.4,0,Math.PI*2);ctx.fillStyle='#a69b64';ctx.fill();}
        }
      }
    } else {
      for(let branch=0;branch<9;branch++) {
        const endX=25+random()*207,endY=25+random()*145;
        ctx.strokeStyle='#665e42';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(128,255);ctx.quadraticCurveTo(128,endY,endX,endY);ctx.stroke();
      }
      for(let i=0;i<210;i++) {
        const angle=random()*Math.PI*2,r=Math.sqrt(random()),x=128+Math.cos(angle)*r*104,y=130+Math.sin(angle)*r*104;
        ctx.fillStyle=`hsl(${78+random()*30},${20+random()*18}%,${22+random()*21}%)`;
        ctx.beginPath();ctx.ellipse(x,y,4+random()*7,2+random()*3,angle,0,Math.PI*2);ctx.fill();
      }
    }
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
    textures.push(texture);return texture;
  }
  function crossedCards(width:number,height:number,planes:number):THREE.BufferGeometry {
    const positions:number[]=[],uvs:number[]=[];
    for(let i=0;i<planes;i++) {
      const a=i/planes*Math.PI,dx=Math.cos(a)*width/2,dz=Math.sin(a)*width/2;
      const p=[[-dx,0,-dz],[dx,0,dz],[-dx,height,-dz],[dx,height,dz]];
      const uv=[[0,0],[1,0],[0,1],[1,1]];
      for(const index of [0,1,2,1,3,2]){positions.push(...p[index]);uvs.push(...uv[index]);}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.computeVertexNormals();return geometry;
  }
  const grassGeometry=crossedCards(1.65,1.10,3),grassMaterial=wind(0xffffff,.095);
  grassMaterial.map=plantTexture('grass');grassMaterial.alphaTest=.46;grassMaterial.alphaToCoverage=true;
  const grasses:THREE.Matrix4[]=[],grassesColors:THREE.Color[]=[];
  const anchors=Array.from({length:360},(_,i)=>({t:i/360+(random()-.5)*.001,side:i%2?1:-1,offset:8+random()*14}));
  for(let i=0;i<(mobile?3300:5700);i++) {
    const anchor=anchors[i%anchors.length],route=i%7===0?hill:coast;
    const s=route.sample(anchor.t+(random()-.5)*.007),offset=anchor.side*(anchor.offset+(random()-.5)*7);
    const x=s.position.x+s.right.x*offset,z=s.position.z+s.right.z*offset,y=groundHeight(x,z);
    if(y<-.4 || !naturalVerge(x,z,6.8))continue;
    const size=.58+random()*.8;
    grasses.push(matrix(x,y-.05,z,size,size*(.55+random()*.6),size));
    grassesColors.push(new THREE.Color().setHSL(.16+random()*.04,.11,.74+random()*.16));
  }
  batch(grassGeometry,grassMaterial,grasses,grassesColors).name='Layered wind moving grass clusters';

  const bushGeometry=crossedCards(2.6,1.9,4),bushMaterial=wind(0xffffff,.035);
  bushMaterial.map=plantTexture('shrub');bushMaterial.alphaTest=.43;bushMaterial.alphaToCoverage=true;
  const bushes:THREE.Matrix4[]=[],bushColors:THREE.Color[]=[];
  for(let i=0;i<(mobile?420:720);i++) {
    const anchor=anchors[i%anchors.length],s=coast.sample(anchor.t+(random()-.5)*.012),offset=anchor.side*(12+random()*21);
    const x=s.position.x+s.right.x*offset,z=s.position.z+s.right.z*offset,y=groundHeight(x,z);
    if(y<.1||!naturalVerge(x,z,9))continue;
    if(anchor.t>.795&&anchor.t<.94&&Math.abs(offset)<16)continue;
    const size=.65+random()*1.15;
    bushes.push(matrix(x,y-.04,z,size,size*(.65+random()*.3),size));
    bushColors.push(new THREE.Color().setHSL(.19+random()*.07,.12,.72+random()*.19));
  }
  batch(bushGeometry,bushMaterial,bushes,bushColors).name='Fine leaf coastal maquis clusters';

  // Sculpted low fern rosettes provide a second silhouette between the fine grasses and shrubs.
  const fernVertices:number[]=[],fernColors:number[]=[];
  for(let frond=0;frond<7;frond++) {
    const angle=frond/7*Math.PI*2,dir=new THREE.Vector3(Math.cos(angle),0,Math.sin(angle)),side=new THREE.Vector3(-dir.z,0,dir.x);
    const center=(t:number)=>dir.clone().multiplyScalar(t*1.15).add(new THREE.Vector3(0,Math.sin(t*Math.PI*.83)*.65,0));
    for(let leaflet=1;leaflet<7;leaflet++) {
      const t=leaflet/8,a=center(t),b=center(t+.09);
      for(const sign of [-1,1]) {
        const tip=center(t+.15).addScaledVector(side,sign*Math.sin(t*Math.PI)*.27);tip.y-=.03;
        for(const v of [a,b,tip]){fernVertices.push(v.x,v.y,v.z);fernColors.push(.51+t*.18,.68+t*.21,.30+t*.08);}
      }
    }
  }
  const fernGeometry=new THREE.BufferGeometry();fernGeometry.setAttribute('position',new THREE.Float32BufferAttribute(fernVertices,3));fernGeometry.setAttribute('color',new THREE.Float32BufferAttribute(fernColors,3));fernGeometry.computeVertexNormals();
  const fernMaterial=wind(0x8ca864,.10);fernMaterial.vertexColors=true;
  const ferns:THREE.Matrix4[]=[];
  for(let i=0;i<(mobile?125:220);i++) {
    const s=coast.sample(random()),offset=(random()>.5?1:-1)*(8+random()*15),x=s.position.x+s.right.x*offset,z=s.position.z+s.right.z*offset,y=groundHeight(x,z);
    if(y<.3||!naturalVerge(x,z,7.4))continue;
    const size=.55+random()*.9;ferns.push(matrix(x,y,z,size,size,size));
  }
  batch(fernGeometry,fernMaterial,ferns).name='Curved coastal fern rosettes';

  // Tiny flowering clumps add restrained lavender and pale gold accents along the verge.
  const flowerParts:{geometry:THREE.BufferGeometry;transform:THREE.Matrix4;color:THREE.Color}[]=[];
  for(let i=0;i<5;i++) {
    const x=(random()-.5)*.45,z=(random()-.5)*.45,h=.25+random()*.28;
    flowerParts.push({geometry:new THREE.ConeGeometry(.018,h,3),transform:matrix(x,h/2,z,1,1,1,0),color:new THREE.Color('#879467')});
    const petals=new THREE.CircleGeometry(.075,5);petals.rotateX(-Math.PI/2);
    flowerParts.push({geometry:petals,transform:matrix(x,h,z,1,1,1,0),color:new THREE.Color(i%2?'#b5a5bd':'#d6c28b')});
  }
  const flowers:THREE.Matrix4[]=[];
  for(let i=0;i<(mobile?190:370);i++) {
    const anchor=anchors[i%anchors.length],s=coast.sample(anchor.t+(random()-.5)*.004),offset=anchor.side*(7.5+random()*8),x=s.position.x+s.right.x*offset,z=s.position.z+s.right.z*offset,y=groundHeight(x,z);
    if(y<.5||!naturalVerge(x,z,7))continue;flowers.push(matrix(x,y,z,1,1,1));
  }
  const flowerMaterial=wind(0xffffff,.10);flowerMaterial.vertexColors=true;
  batch(combined(flowerParts),flowerMaterial,flowers).name='Lavender and dune flowers';

  // Bent tapering palm trunks and finely divided fronds read from both cockpit and chase views.
  const trunkPoints=Array.from({length:8},(_,i)=>new THREE.Vector3(Math.sin(i/7*1.5)*.65,i/7*7.8,0));
  const trunkCurve=new THREE.CatmullRomCurve3(trunkPoints);
  const trunkGeometry=new THREE.TubeGeometry(trunkCurve,8,.20,7,false);
  const trunkPos=trunkGeometry.getAttribute('position');
  for(let i=0;i<trunkPos.count;i++) {
    const t=trunkPos.getY(i)/7.8;
    const cx=Math.sin(Math.max(0,t)*1.5)*.65;
    trunkPos.setX(i,cx+(trunkPos.getX(i)-cx)*(1.25-t*.45));
    trunkPos.setZ(i,trunkPos.getZ(i)*(1.25-t*.45));
  }
  trunkGeometry.computeVertexNormals();
  const trunkMaterial=new THREE.MeshStandardMaterial({color:0x8a7452,roughness:1});
  trunkMaterial.onBeforeCompile=shader=>{
    shader.vertexShader='varying float vPalmHeight;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPalmHeight=position.y;');
    shader.fragmentShader='varying float vPalmHeight;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=.82+.18*smoothstep(.13,.32,fract(vPalmHeight*3.8));');
  };
  trunkMaterial.customProgramCacheKey=()=>'coast-palm-trunk-rings';
  const frondGeometry=createPalmCrown(mobile);
  const frondMaterial=wind(0x9cae72,.014,true);frondMaterial.vertexColors=true;
  random=createSeededRandom(864208);
  const palms:THREE.Matrix4[]=[],palmColors:THREE.Color[]=[];
  for(let i=0;i<(mobile?48:82);i++) {
    const t=i<24?.10+random()*.17:random();
    // Reserve the future town and the tunnel portals for the next milestone.
    if((t>.32&&t<.42)||(t>.66&&t<.75))continue;
    const s=coast.sample(t),offset=(random()>.6?1:-1)*(11+random()*23);
    const x=s.position.x+s.right.x*offset,z=s.position.z+s.right.z*offset,y=groundHeight(x,z);
    if(y<.8||!naturalVerge(x,z,10))continue;
    const size=.78+random()*.55;
    palms.push(matrix(x,y,z,size,size,size));palmColors.push(new THREE.Color().setHSL(.23,.23,.65+random()*.2));
  }
  // A few deliberately framed trees give the opening sunset drive a layered near silhouette.
  for(const [i,t] of [ .844,.861,.883,.905 ].entries()) {
    const sample=coast.sample(t),offset=-(12.5+i%2*3),x=sample.position.x+sample.right.x*offset,z=sample.position.z+sample.right.z*offset;
    const size=.94+i*.07;
    palms.push(matrix(x,groundHeight(x,z),z,size,size,size,i*.87));palmColors.push(new THREE.Color('#c6cca6'));
  }
  treeBatch(trunkGeometry,trunkMaterial,palms).name='Curved palm trunks';
  treeBatch(frondGeometry,frondMaterial,palms,palmColors,createPalmCrown(mobile,true)).name='Wind moving palm fronds';

  // Inland stone-pine silhouettes break the hill contour, leaving the coastal road open.
  random=createSeededRandom(864209);
  const pines:THREE.Matrix4[]=[],pineCrowns:THREE.Matrix4[]=[],pineColors:THREE.Color[]=[];
  for(let i=0;i<(mobile?44:85);i++) {
    const x=(random()-.5)*460,z=(random()-.5)*360,y=groundHeight(x,z);
    if(!naturalVerge(x,z,12))continue;
    const size=.8+random()*.8;
    pines.push(matrix(x,y,z,.18*size,5*size,.18*size,0));
    pineCrowns.push(matrix(x,y+4.7*size,z,3.8*size,1.8*size,3*size));
    pineColors.push(new THREE.Color().setHSL(.23,.23,.36+random()*.12));
  }
  const pineTrunk=new THREE.CylinderGeometry(.7,1,1,6);pineTrunk.translate(0,.5,0);
  treeBatch(pineTrunk,new THREE.MeshStandardMaterial({color:0x78674e,roughness:1}),pines).name='Stone pine trunks';
  const pineMaterial=wind(0x899968,.01);pineMaterial.vertexColors=true;
  treeBatch(createPineCrown(),pineMaterial,pineCrowns,pineColors,createPineCrown(true)).name='Sheltered stone pine boughs';

  // Baked contact occlusion grounds static props even when mobile sun shadows are disabled.
  // One shared texture and one draw; projected onto the rendered heightfield rather than a flat decal.
  const contactCanvas=document.createElement('canvas');contactCanvas.width=contactCanvas.height=128;
  const contactContext=contactCanvas.getContext('2d')!,gradient=contactContext.createRadialGradient(64,64,2,64,64,64);
  gradient.addColorStop(0,'rgba(255,255,255,.38)');gradient.addColorStop(.35,'rgba(255,255,255,.18)');gradient.addColorStop(1,'rgba(255,255,255,0)');contactContext.fillStyle=gradient;contactContext.fillRect(0,0,128,128);
  const contactMap=new THREE.CanvasTexture(contactCanvas);textures.push(contactMap);
  const contactPositions:number[]=[],contactUvs:number[]=[],contactIndices:number[]=[];
  for(const [matrices,radiusScale]of[[palms,1.1],[pines,7.5],[rocks,.7]] as const){
    for(const m of matrices){const x=m.elements[12],z=m.elements[14],radius=Math.hypot(m.elements[0],m.elements[2])*radiusScale,start=contactPositions.length/3;
      for(let j=0;j<3;j++)for(let i=0;i<3;i++){const px=x+(i-1)*radius,pz=z+(j-1)*radius;contactPositions.push(px,groundHeight(px,pz)+.025,pz);contactUvs.push(i/2,1-j/2);}
      for(let j=0;j<2;j++)for(let i=0;i<2;i++){const a=start+j*3+i;contactIndices.push(a,a+3,a+1,a+1,a+3,a+4);}
    }
  }
  const contactGeometry=new THREE.BufferGeometry();contactGeometry.setAttribute('position',new THREE.Float32BufferAttribute(contactPositions,3));contactGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(contactUvs,2));contactGeometry.setIndex(contactIndices);
  place(contactGeometry,new THREE.MeshBasicMaterial({color:0x131b17,map:contactMap,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}),'Soft contact occlusion under palms, pines and boulders');

  // The imported routes also determine safe plant clearance, so future road edits stay coherent.
  root.userData.routeIds = roads.map(r=>r.id);
  let instancedBatches=0;root.traverse(object=>{if(object instanceof THREE.InstancedMesh)instancedBatches++;});
  root.userData.sceneryBudget = { tier:mobile?'mobile':'desktop', instancedBatches, terrainTriangles:subdivisions*subdivisions*2 };
  const obstacles=[
    ...palms.map(m=>({x:m.elements[12],z:m.elements[14],radius:.25*Math.hypot(m.elements[0],m.elements[2])+.78})),
    ...pines.map(m=>({x:m.elements[12],z:m.elements[14],radius:Math.hypot(m.elements[0],m.elements[2])+.78})),
    ...rocks.map(m=>({x:m.elements[12],z:m.elements[14],radius:Math.max(Math.hypot(m.elements[0],m.elements[2]),Math.hypot(m.elements[8],m.elements[10]))*.85+.78})),
  ];
  return {
    groundHeight:cameraGroundHeight,
    terrainHeight:groundHeight,
    terrainMaterial:groundMaterial,
    rockMaterial,
    blocksCar:(x,z)=>obstacles.some(o=>(x-o.x)**2+(z-o.z)**2<o.radius**2),
    registerInstances,
    prepareShore:sample=>water.prepare(sample,groundHeight),
    addShoreWetness:water.addWetness,
    createShadowCasters(){
      const group=new THREE.Group();root.updateMatrixWorld(true);
      for(const name of['Limestone headland and grassy interior','Eroded headland over the mountain tunnel']){
        const source=root.getObjectByName(name) as THREE.Mesh;const mesh=new THREE.Mesh(source.geometry,source.material);mesh.name=name;mesh.matrixAutoUpdate=false;mesh.matrix.copy(source.matrixWorld);mesh.castShadow=true;group.add(mesh);
        const materials=Array.isArray(source.material)?source.material:[source.material];for(const material of materials)material.shadowSide=THREE.FrontSide;
      }
      for(const record of visibleBatches){
        if(record.lod?.detail==='near')continue;
        const name=record.mesh.parent?.name??'',isTree=/palm|pine/.test(name);
        if(!isTree&&record.mesh.name!=='Coastal limestone boulders')continue;
        const mesh=new THREE.InstancedMesh(record.mesh.geometry,record.mesh.material,record.matrices.length);mesh.name=name||record.mesh.name;
        record.matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;mesh.matrixAutoUpdate=false;mesh.matrix.copy(record.mesh.matrixWorld);mesh.castShadow=true;group.add(mesh);
      }
      return group;
    },
    cullForCamera(camera){
      camera.updateMatrixWorld();camera.getWorldPosition(viewPosition);viewProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);viewFrustum.setFromProjectionMatrix(viewProjection);
      for(const record of visibleBatches){const{mesh,matrices,colors,bounds,slots,limit,lod}=record;let count=0,changed=false;
        for(let i=0;i<limit;i++){
          if(lod){if(lod.detail==='near'){const distance=lod.anchors[i].distanceToSquared(viewPosition),range=mobile?130:200;if(distance<(range-12)**2)lod.near[i]=1;else if(distance>(range+12)**2)lod.near[i]=0;}if(Boolean(lod.near[i])!==(lod.detail==='near'))continue;}
          // Retain off-screen casters if a later lighting pass enables their shadows.
          if(!mesh.castShadow&&!viewFrustum.intersectsSphere(bounds[i]))continue;
          if(slots[count]!==i){mesh.setMatrixAt(count,matrices[i]);if(colors)mesh.setColorAt(count,colors[i]);slots[count]=i;changed=true;}count++;
        }
        mesh.count=count;if(changed){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
      }
    },
    setSkyReflection:texture=>water.setSkyReflection(texture),
    setLowDetail(enabled){
      for(const record of visibleBatches){const child=record.mesh;
        const factor=child.name.includes('grass clusters')?.55:child.name.includes('maquis')?.65:child.name.includes('fern rosettes')?.6:1;
        const full=record.matrices.length;child.userData.fullCount=full;
        record.limit=enabled?Math.min(full,Math.max(1,Math.floor(full*factor))):full;
      }
    },
    update(elapsed, carPosition) {
      time.value=elapsed;
      water.update(carPosition);
      sky.position.set(carPosition.x,0,carPosition.z);
    },
    dispose() {
      disposed = true;
      water.dispose();
      root.removeFromParent();
      for(const resource of resources)resource.dispose();
      windMaterials.length=0;
      for(const texture of textures)texture.dispose();
    },
  };
}
