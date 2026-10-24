import * as THREE from 'three';
import {createCoastalGroundMaterial,usePackedRockRoughness} from './GroundMaterial';
import {scanSurface} from './SurfaceHeight';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createTunnelHeadland} from './TunnelHeadland';
import { heightAt, coast, hill, roads } from './roads';
import { createSeededRandom } from '../utils/random';
import {createPalmCrown,createPineCrown,createPineNeedleAtlas} from './TreeGeometry';
import {createCoastalWater} from './CoastalWater';
import offshoreHeightsText from './offshore-heights.json?raw';

/** Sampled from the existing photographed CC0 reef; the underwater edge and
 * bottom form a closed body. Different crops retain broken natural ridges. */
const offshoreHeights=JSON.parse(offshoreHeightsText) as {width:number;height:number;variants:number[][]};
function offshoreRockGeometry(variant:number):THREE.BufferGeometry {
  const {width,height}=offshoreHeights,positions:number[]=[],colors:number[]=[],indices:number[]=[],boundary:number[][]=[];
  const vertex=(x:number,y:number,z:number)=>{
    positions.push(x,y,z);const strata=.025*Math.sin(y*38+x*4+variant*1.71),shade=.79+Math.min(.18,Math.max(0,y)*.2)+strata;
    colors.push(shade,shade*.99,shade*(.92+Math.min(.06,Math.max(0,.25-y)*.15)));
  };
  for(let row=0;row<height;row++)for(let column=0;column<width;column++)vertex(column/(width-1)*2-1,offshoreHeights.variants[variant][row*width+column],row/(height-1)*2-1);
  const edgeCounts=new Map<string,{a:number;b:number;count:number}>();
  for(let row=0;row<height-1;row++)for(let column=0;column<width-1;column++){
    const a=row*width+column,b=a+1,c=a+width,d=c+1;
    for(const triangle of[[a,c,b],[b,c,d]]){indices.push(...triangle);for(let i=0;i<3;i++){const a=triangle[i],b=triangle[(i+1)%3],key=Math.min(a,b)+','+Math.max(a,b),edge=edgeCounts.get(key)??{a,b,count:0};edge.count++;edgeCounts.set(key,edge);}}
  }
  for(const edge of edgeCounts.values())if(edge.count===1)boundary.push([edge.a,edge.b]);
  const bottom=positions.length/3;vertex(0,-1.05,0);for(const [a,b]of boundary)indices.push(bottom,b,a);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

/** Authored, deterministic coastal landscape. Distances and animation time are in metres / seconds. */
export function createScenery(scene: THREE.Scene, mobile: boolean,loadingManager=THREE.DefaultLoadingManager): {
  ready:Promise<void>;
  prepareVerge:(parts:THREE.BufferGeometry[])=>void;
  prepareFerns:(source:Promise<THREE.MeshStandardMaterial|undefined>)=>Promise<void>;
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
  let vergeSurface:ReturnType<typeof scanSurface>|undefined;
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
    color: surfaceTexture('ground-color.jpg', true), surface: surfaceTexture('ground-surface.webp'),
  };
  const sandMaps = {
    color: surfaceTexture('sand-color.jpg', true), surface: surfaceTexture('sand-surface.webp'),
  };
  const fieldMaps={color:surfaceTexture('field-color.jpg',true),surface:surfaceTexture('field-surface.webp')};
  const rockMaps = {
    color: surfaceTexture('rock-color.jpg', true), surface: surfaceTexture('rock-surface.png'),
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
  const groundMaterial=createCoastalGroundMaterial(groundMaps,sandMaps,rockMaps,fieldMaps,mobile);
  water.addWetness(groundMaterial);
  place(terrain, groundMaterial, 'Limestone headland and grassy interior').receiveShadow = true;

  const headland=createTunnelHeadland(mobile,groundHeight);
  const cap=place(headland.geometry,groundMaterial,'Eroded headland over the mountain tunnel');cap.castShadow=true;cap.receiveShadow=true;
  const cameraGroundHeight=headland.groundHeight;

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
  type InstanceLod={near:Uint8Array;detail:'near'|'far'|'impostor';anchors?:THREE.Vector3[];indices?:number[];source?:{limit:number};distant?:Uint8Array;range?:number};
  type InstanceBatch={mesh:THREE.InstancedMesh;matrices:THREE.Matrix4[];colors?:THREE.Color[];bounds:THREE.Sphere[];slots:Int32Array;limit:number;lod?:InstanceLod;groundSlopes?:{source:Float32Array;attribute:THREE.InstancedBufferAttribute};spatial?:{cells:{bounds:THREE.Sphere;indices:number[]}[];candidates:number[]}};
  const visibleBatches:InstanceBatch[]=[];
  type FoliageDetail={key:string;near:Uint8Array;anchors:THREE.Vector3[];source:typeof visibleBatches[number];enter:number;exit:number;cap:number;visible:number;budget?:string;distant?:Uint8Array;impostorRange?:number};
  const foliageDetails:FoliageDetail[]=[];
  const viewFrustum=new THREE.Frustum(),viewProjection=new THREE.Matrix4(),viewPosition=new THREE.Vector3();
  const debugPlacements=import.meta.env.DEV||new URLSearchParams(location.search).has('test');
  function registerInstances(mesh:THREE.InstancedMesh,matrices:THREE.Matrix4[],colors?:THREE.Color[],lod?:InstanceLod){
    const geometry=mesh.geometry;mesh.computeBoundingSphere();geometry.computeBoundingSphere();
    const bounds=matrices.map(matrix=>{const sphere=geometry.boundingSphere!.clone().applyMatrix4(matrix);sphere.radius+=.8;return sphere;});
    visibleBatches.push({mesh,matrices,colors,bounds,slots:Int32Array.from(matrices.map((_,i)=>i)),limit:mesh.count,lod});
    if(debugPlacements)mesh.userData.authoredInstances=matrices;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);if(mesh.instanceColor)mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  }
  function refreshCellBounds(record:InstanceBatch){
    for(const cell of record.spatial?.cells??[]){cell.bounds.makeEmpty();for(const i of cell.indices)cell.bounds.union(record.bounds[i]);}
  }
  function partitionField(mesh:THREE.InstancedMesh){
    const record=visibleBatches.find(record=>record.mesh===mesh)!,cells=new Map<string,{bounds:THREE.Sphere;indices:number[]}>();
    record.matrices.forEach((matrix,i)=>{const e=matrix.elements,key=`${Math.floor(e[12]/32)},${Math.floor(e[14]/32)}`,cell=cells.get(key)??{bounds:new THREE.Sphere(),indices:[]};cells.set(key,cell);cell.indices.push(i);});
    record.spatial={cells:[...cells.values()],candidates:[]};refreshCellBounds(record);
  }
  function fieldCandidates(record:InstanceBatch,range?:number){
    if(!record.spatial)return undefined;
    const candidates=record.spatial.candidates;candidates.length=0;
    for(const cell of record.spatial.cells){
      const center=cell.bounds.center;
      if(range&&((center.x-viewPosition.x)**2+(center.z-viewPosition.z)**2)>(range+cell.bounds.radius)**2)continue;
      if(!record.mesh.castShadow&&!viewFrustum.intersectsSphere(cell.bounds))continue;
      for(const i of cell.indices)if(i<record.limit)candidates.push(i);
    }
    // Keep the original draw order, including overlapping alpha-to-coverage
    // leaves. Cells only remove work; they do not rearrange authored instances.
    candidates.sort((a,b)=>a-b);return candidates;
  }
  function uploadVisiblePrefix(attribute:THREE.BufferAttribute,count:number){
    attribute.clearUpdateRanges();attribute.addUpdateRange(0,count*attribute.itemSize);attribute.needsUpdate=true;
  }
  function batch(geometry: THREE.BufferGeometry, material: THREE.Material, matrices: THREE.Matrix4[], colors?: THREE.Color[],lod?:InstanceLod): THREE.InstancedMesh {
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
  function groundFollowing(material:THREE.MeshStandardMaterial){
    const compileWind=material.onBeforeCompile,windKey=material.customProgramCacheKey();
    material.onBeforeCompile=(shader,renderer)=>{
      compileWind(shader,renderer);
      // Keep stems upright while their lower surface follows rendered soil.
      // Wind uses authored height, so roots stay anchored on this plane.
      shader.vertexShader='attribute vec3 instanceGroundSlope;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        vec3 rootOffset=mat3(instanceMatrix)*vec3(position.x,0.0,position.z);
        transformed.y+=(dot(instanceGroundSlope.xy,rootOffset.xz)+instanceGroundSlope.z)/max(length(instanceMatrix[1].xyz),.001);`);
    };
    material.customProgramCacheKey=()=>windKey+'-ground-plane-v2';
  }
  function dryFieldColor(material:THREE.MeshStandardMaterial,brightness:number){
    const compile=material.onBeforeCompile,key=material.customProgramCacheKey();
    material.onBeforeCompile=(shader,renderer)=>{
      compile(shader,renderer);shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        float dryGrassValue=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
        diffuseColor.rgb=mix(diffuseColor.rgb,dryGrassValue*vec3(1.12,1.01,.76)*${brightness.toFixed(2)},.7);`);
    };
    material.customProgramCacheKey=()=>`${key}-dry-field-color-${brightness}`;
  }
  function groundSlopes(mesh:THREE.InstancedMesh,matrices:THREE.Matrix4[]){
    // Per-instance spheres below include shader deformation; the renderer's
    // undeformed aggregate sphere must not cull this compacted batch again.
    mesh.frustumCulled=false;
    const surfaceHeight=(x:number,z:number)=>Math.max(groundHeight(x,z),vergeSurface?.height(x,z)??-Infinity),slopes=new Float32Array(matrices.length*3);
    matrices.forEach((matrix,i)=>{const x=matrix.elements[12],z=matrix.elements[14],step=.15;slopes[i*3]=(surfaceHeight(x+step,z)-surfaceHeight(x-step,z))/(2*step);slopes[i*3+1]=(surfaceHeight(x,z+step)-surfaceHeight(x,z-step))/(2*step);slopes[i*3+2]=surfaceHeight(x,z)-groundHeight(x,z);});
    const record=visibleBatches.find(record=>record.mesh===mesh)!;
    const attribute=record.groundSlopes?.attribute??new THREE.InstancedBufferAttribute(slopes.slice(),3);
    if(record.groundSlopes){(attribute.array as Float32Array).set(slopes);attribute.needsUpdate=true;record.slots.fill(-1);}
    attribute.setUsage(THREE.DynamicDrawUsage);mesh.geometry.setAttribute('instanceGroundSlope',attribute);record.groundSlopes={source:slopes,attribute};
    mesh.geometry.computeBoundingBox();const box=mesh.geometry.boundingBox!,reach=Math.hypot(Math.max(Math.abs(box.min.x),Math.abs(box.max.x)),Math.max(Math.abs(box.min.z),Math.abs(box.max.z)));
    matrices.forEach((matrix,i)=>{const e=matrix.elements,scale=Math.max(Math.hypot(e[0],e[2]),Math.hypot(e[8],e[10])),sphere=mesh.geometry.boundingSphere!.clone().applyMatrix4(matrix);sphere.center.y+=slopes[i*3+2];sphere.radius+=.8+reach*scale*Math.hypot(slopes[i*3],slopes[i*3+1]);record.bounds[i].copy(sphere);});
    refreshCellBounds(record);
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

  // Rotate three distinct ridges while preserving the existing random sequence,
  // so changing distant geology does not rearrange nearby rocks or plants.
  const islandMatrices: THREE.Matrix4[][] = [[],[],[]];
  const islandColors: THREE.Color[][] = [[],[],[]];
  for(let i=0;i<20;i++) {
    const angle=i/20*Math.PI*2+.1;
    const distance=760+random()*480;
    islandMatrices[i%3].push(matrix(Math.cos(angle)*distance,-6,Math.sin(angle)*distance,65+random()*90,17+random()*47,38+random()*70));
    islandColors[i%3].push(new THREE.Color('#94978d').multiplyScalar(.75+random()*.15));
  }
  const islandMaterial=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,vertexColors:true});
  for(let variant=0;variant<3;variant++)batch(offshoreRockGeometry(variant),islandMaterial,islandMatrices[variant],islandColors[variant]).name=`Weathered offshore rock ridge ${variant}`;

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
  const rockMaterial=new THREE.MeshStandardMaterial({color:0xffffff,map:rockMaps.color,normalMap:rockMaps.surface,roughnessMap:rockMaps.surface,roughness:.95});
  usePackedRockRoughness(rockMaterial);
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
  const grassGeometry=crossedCards(1.10,.75,3),grassMaterial=wind(0xffffff,.095);
  grassMaterial.map=plantTexture('grass');grassMaterial.alphaTest=.46;grassMaterial.alphaToCoverage=true;groundFollowing(grassMaterial);
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
  const grassMesh=batch(grassGeometry,grassMaterial,grasses,grassesColors);grassMesh.name='Layered wind moving grass clusters';
  groundSlopes(grassMesh,grasses);

  // Inland patches have their own random stream: changing their density must
  // never shuffle the established road, tree, rock or roadside placements.
  const fieldRandom=createSeededRandom(864224),fieldGrasses:THREE.Matrix4[]=[],fieldColors:THREE.Color[]=[];
  for(let patch=0;patch<100;patch++){
    const t=(patch+.2+fieldRandom()*.6)/100,s=coast.sample(t),offset=27+fieldRandom()*82;
    const cx=s.position.x-s.right.x*offset,cz=s.position.z-s.right.z*offset,rx=7+fieldRandom()*7,rz=5+fieldRandom()*6,angle=fieldRandom()*Math.PI*2;
    for(let tuft=0;tuft<(mobile?54:84);tuft++){
      const a=fieldRandom()*Math.PI*2,r=Math.sqrt(fieldRandom()),dx=Math.cos(a)*r*rx,dz=Math.sin(a)*r*rz;
      const x=cx+dx*Math.cos(angle)-dz*Math.sin(angle),z=cz+dx*Math.sin(angle)+dz*Math.cos(angle),y=groundHeight(x,z);
      if(y<1.8||!naturalVerge(x,z,13.5))continue;
      const gradient=Math.hypot((groundHeight(x+.3,z)-groundHeight(x-.3,z))/.6,(groundHeight(x,z+.3)-groundHeight(x,z-.3))/.6);
      if(gradient>.6)continue;
      const size=.8+fieldRandom()*.85;
      fieldGrasses.push(matrix(x,y-.05,z,size,size*(.65+fieldRandom()*.4),size,fieldRandom()*Math.PI*2));
      fieldColors.push(new THREE.Color().setHSL(.105+fieldRandom()*.025,.24,.65+fieldRandom()*.16));
    }
  }
  // Shuffle together, so the low-detail prefix thins every patch rather than
  // removing one end of the coast. No runtime quality switch regenerates it.
  for(let i=fieldGrasses.length-1;i>0;i--){const j=Math.floor(fieldRandom()*(i+1));[fieldGrasses[i],fieldGrasses[j]]=[fieldGrasses[j],fieldGrasses[i]];[fieldColors[i],fieldColors[j]]=[fieldColors[j],fieldColors[i]];}
  const fieldRange=mobile?150:260,fieldMaterial=wind(0xffffff,.095);fieldMaterial.copy(grassMaterial);fieldMaterial.name='Dry inland grass with distance thinning';groundFollowing(fieldMaterial);dryFieldColor(fieldMaterial,1);
  const compileField=fieldMaterial.onBeforeCompile,fieldKey=fieldMaterial.customProgramCacheKey();
  fieldMaterial.onBeforeCompile=(shader,renderer)=>{
    compileField(shader,renderer);
    shader.vertexShader='varying float vFieldDistance;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vec3 fieldAnchor=(modelMatrix*instanceMatrix*vec4(0.0,0.0,0.0,1.0)).xyz;
      vFieldDistance=length(fieldAnchor.xz-cameraPosition.xz);`);
    shader.fragmentShader='varying float vFieldDistance;\n'+shader.fragmentShader.replace('#include <alphatest_fragment>',`#include <alphatest_fragment>
      diffuseColor.a*=1.0-smoothstep(${(fieldRange-35).toFixed(1)},${fieldRange.toFixed(1)},vFieldDistance);
      if(diffuseColor.a<.0001)discard;`);
  };
  fieldMaterial.customProgramCacheKey=()=>`${fieldKey}-field-range-${fieldRange}`;
  const fieldMesh=batch(grassGeometry.clone(),fieldMaterial,fieldGrasses,fieldColors);fieldMesh.name='Dry inland patch grass clusters';groundSlopes(fieldMesh,fieldGrasses);partitionField(fieldMesh);
  const fieldRecord=visibleBatches.find(record=>record.mesh===fieldMesh)!,fieldNear=new Uint8Array(fieldGrasses.length);fieldRecord.lod={near:fieldNear,detail:'far',range:fieldRange};
  root.userData.fieldGrassDetail={ready:false,placements:fieldGrasses.length,range:fieldRange,nearLimit:mobile?48:96,budget:'photographedGrass',selected:0,visible:0};

  const grassReady=new GLTFLoader(loadingManager).loadAsync(`${import.meta.env.BASE_URL}assets/models/coastal_grass/grass.gltf`).then(gltf=>{
    const sources:THREE.Mesh[]=[];gltf.scene.traverse(object=>{if((object as THREE.Mesh).isMesh)sources.push(object as THREE.Mesh);});
    const sourceMaterials=new Set(sources.map(mesh=>mesh.material as THREE.MeshStandardMaterial)),map=(sources[0]?.material as THREE.MeshStandardMaterial|undefined)?.map;
    if(disposed){sources.forEach(mesh=>mesh.geometry.dispose());sourceMaterials.forEach(material=>material.dispose());map?.dispose();return;}
    if(sources.length!==3||!map||sources.some(mesh=>!mesh.geometry.getAttribute('uv'))){sources.forEach(mesh=>mesh.geometry.dispose());sourceMaterials.forEach(material=>material.dispose());map?.dispose();throw Error('Coastal grass needs three rooted variants and its alpha atlas');}
    textures.push(map);map.anisotropy=mobile?4:8;
    const material=wind(0xffffff,.16);material.name='Photographed coastal grass cutout';material.map=map;material.alphaTest=.43;material.alphaToCoverage=true;
    groundFollowing(material);
    const fieldNearMaterial=wind(0xffffff,.16);fieldNearMaterial.copy(material);fieldNearMaterial.name='Dry photographed inland grass';groundFollowing(fieldNearMaterial);dryFieldColor(fieldNearMaterial,1.4);
    const near=new Uint8Array(grasses.length),farRecord=visibleBatches.find(record=>record.mesh===grassMesh)!;
    sources.forEach((source,variant)=>{
      const indices=Array.from({length:grasses.length},(_,i)=>i).filter(i=>i%3===variant),matrices=indices.map(i=>grasses[i]),colors=indices.map(i=>grassesColors[i]);
      const mesh=batch(source.geometry,material,matrices,colors,{near,detail:'near',indices});mesh.name='Photographed low coastal grass '+variant;
      groundSlopes(mesh,matrices);
      const fieldIndices=Array.from({length:fieldGrasses.length},(_,i)=>i).filter(i=>i%3===variant),fieldMatrices=fieldIndices.map(i=>fieldGrasses[i]),fieldTints=fieldIndices.map(i=>fieldColors[i]);
      const field=batch(source.geometry.clone(),fieldNearMaterial,fieldMatrices,fieldTints,{near:fieldNear,detail:'near',indices:fieldIndices,source:fieldRecord,range:mobile?24:35});field.name='Photographed dry inland grass '+variant;groundSlopes(field,fieldMatrices);partitionField(field);
    });
    farRecord.lod={near,detail:'far'};foliageDetails.push({key:'grassDetail',near,source:farRecord,anchors:grasses.map(matrix=>new THREE.Vector3().setFromMatrixPosition(matrix)),enter:mobile?20:30,exit:mobile?24:35,cap:mobile?48:96,visible:0,budget:'photographedGrass'});
    foliageDetails.push({key:'fieldGrassDetail',near:fieldNear,source:fieldRecord,anchors:fieldGrasses.map(matrix=>new THREE.Vector3().setFromMatrixPosition(matrix)),enter:mobile?20:30,exit:mobile?24:35,cap:mobile?48:96,visible:0,budget:'photographedGrass'});
    sourceMaterials.forEach(material=>material.dispose());
    root.userData.grassDetail={ready:true,nearLimit:mobile?48:96,enterRange:mobile?20:30,exitRange:mobile?24:35,selected:0,budget:'photographedGrass'};
    root.userData.fieldGrassDetail.ready=true;
  }).catch(error=>{root.userData.grassDetail={ready:false,fallback:true,error:String(error)};root.userData.fieldGrassDetail.fallback=true;});

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
  const bushMesh=batch(bushGeometry,bushMaterial,bushes,bushColors);bushMesh.name='Fine leaf coastal maquis clusters';
  function scrubImpostorGeometry(geometry:THREE.BufferGeometry,variant:number){
    geometry.computeBoundingBox();const box=geometry.boundingBox!,w=2*Math.max(Math.abs(box.min.x),Math.abs(box.max.x),Math.abs(box.min.z),Math.abs(box.max.z))+.1,h=box.max.y;
    const positions:number[]=[],uvs:number[]=[],indices:number[]=[];
    for(let view=0;view<5;view++){
      const angle=view*Math.PI/2,quad=view===4?[[-w/2,h*.58,w/2],[w/2,h*.58,w/2],[-w/2,h*.58,-w/2],[w/2,h*.58,-w/2]]:[[-w/2,-.05,0],[w/2,-.05,0],[-w/2,h+.05,0],[w/2,h+.05,0]],offset=positions.length/3,tile=variant*5+view,col=tile%4,row=Math.floor(tile/4);
      for(const[x,y,z]of quad)positions.push(view===4?x:x*Math.cos(angle),y,view===4?z:-x*Math.sin(angle));
      uvs.push(col/4,1-(row+1)/4,(col+1)/4,1-(row+1)/4,col/4,1-row/4,(col+1)/4,1-row/4);
      indices.push(offset,offset+1,offset+2,offset+1,offset+3,offset+2);
    }
    const proxy=new THREE.BufferGeometry();proxy.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));proxy.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));proxy.setIndex(indices);proxy.computeVertexNormals();return proxy;
  }
  const scrubReady=new GLTFLoader(loadingManager).loadAsync(`${import.meta.env.BASE_URL}assets/models/coastal_scrub/scrub.gltf`).then(async gltf=>{
    const sources:THREE.Mesh[]=[];gltf.scene.traverse(object=>{if((object as THREE.Mesh).isMesh)sources.push(object as THREE.Mesh);});
    const sourceMaterials=new Set(sources.map(mesh=>mesh.material as THREE.MeshStandardMaterial)),map=(sources[0]?.material as THREE.MeshStandardMaterial|undefined)?.map;
    const expectedNames=new Set(['Coastal_scrub_0_near','Coastal_scrub_0_far','Coastal_scrub_1_near','Coastal_scrub_1_far']);
    if(disposed||sources.length!==4||!map||sources.some(mesh=>!expectedNames.delete(mesh.name)||!mesh.geometry.getAttribute('uv'))){sources.forEach(mesh=>mesh.geometry.dispose());sourceMaterials.forEach(material=>material.dispose());map?.dispose();if(!disposed)throw Error('Coastal scrub needs two near/far pairs and its alpha atlas');return;}
    let proxyMap:THREE.Texture;
    try{proxyMap=await textureLoader.loadAsync(`${import.meta.env.BASE_URL}assets/models/coastal_scrub/scrub-impostors.png`);}
    catch(error){sources.forEach(mesh=>mesh.geometry.dispose());sourceMaterials.forEach(material=>material.dispose());map.dispose();throw error;}
    if(disposed){sources.forEach(mesh=>mesh.geometry.dispose());sourceMaterials.forEach(material=>material.dispose());map.dispose();proxyMap.dispose();return;}
    proxyMap.colorSpace=THREE.SRGBColorSpace;proxyMap.anisotropy=mobile?4:8;textures.push(proxyMap);
    textures.push(map);map.anisotropy=mobile?4:8;
    const material=wind(0xffffff,.045);material.name='Photographed grey-green coastal scrub';material.map=map;material.alphaTest=.45;material.alphaToCoverage=true;groundFollowing(material);
    const proxyMaterial=wind(0xffffff,.045);proxyMaterial.name='Distant photographed scrub volume';proxyMaterial.map=proxyMap;proxyMaterial.alphaTest=.12;proxyMaterial.alphaToCoverage=true;proxyMaterial.side=THREE.FrontSide;groundFollowing(proxyMaterial);
    const compileProxy=proxyMaterial.onBeforeCompile,proxyKey=proxyMaterial.customProgramCacheKey();
    proxyMaterial.onBeforeCompile=(shader,renderer)=>{compileProxy(shader,renderer);shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=normalize(mat3(viewMatrix)*vec3(0.0,1.0,0.0));');};proxyMaterial.customProgramCacheKey=()=>proxyKey+'-scrub-impostor-up';
    const sourceRecord=visibleBatches.find(record=>record.mesh===bushMesh)!,near=new Uint8Array(bushes.length),distant=new Uint8Array(bushes.length);
    const variantFor=(index:number)=>(Math.imul(index+1,2654435761)>>>16)&1;
    for(const source of sources){
      const match=/Coastal_scrub_([01])_(near|far)$/.exec(source.name);if(!match)throw Error('Unknown scrub variant '+source.name);
      const variant=Number(match[1]),detail=match[2] as 'near'|'far',indices=Array.from({length:bushes.length},(_,i)=>i).filter(i=>variantFor(i)===variant),matrices=indices.map(i=>bushes[i]),colors=indices.map(i=>bushColors[i]);
      const mesh=batch(source.geometry,material,matrices,colors,{near,detail,indices,source:sourceRecord,distant});mesh.name=`Grey green coastal scrub ${detail} ${variant}`;groundSlopes(mesh,matrices);
      if(detail==='near'){const proxy=batch(scrubImpostorGeometry(source.geometry,variant),proxyMaterial,matrices,colors,{near,detail:'impostor',indices,source:sourceRecord,distant});proxy.name=`Grey green coastal scrub impostor ${variant}`;groundSlopes(proxy,matrices);}
    }
    bushMesh.visible=false;sourceMaterials.forEach(material=>material.dispose());
    // The procedural atlas is only a loading/failure fallback. Once both real
    // LOD pairs are valid, release it instead of retaining an unused GPU map.
    const fallbackMap=bushMaterial.map!;bushMaterial.map=null;fallbackMap.dispose();textures.splice(textures.indexOf(fallbackMap),1);
    bushMaterial.dispose();resources.delete(bushMaterial);windMaterials.splice(windMaterials.indexOf(bushMaterial),1);
    foliageDetails.push({key:'scrubDetail',near,source:sourceRecord,anchors:bushes.map(matrix=>new THREE.Vector3().setFromMatrixPosition(matrix)),enter:mobile?30:45,exit:mobile?36:53,cap:mobile?8:16,visible:0,distant,impostorRange:mobile?60:110});
    root.userData.scrubDetail={ready:true,nearLimit:mobile?8:16,enterRange:mobile?30:45,exitRange:mobile?36:53,impostorRange:mobile?60:110,selected:0,visible:0};
  }).catch(error=>{root.userData.scrubDetail={ready:false,fallback:true,error:String(error)};});

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
  const fernMesh=batch(fernGeometry,fernMaterial,ferns);fernMesh.name='Curved coastal fern rosettes';
  // Geometry-only LODs borrow the existing photographed maps. ImportedVegetation
  // owns those textures; this landscape owns only its new material and geometry.
  async function prepareFerns(source:Promise<THREE.MeshStandardMaterial|undefined>){
    try{
      const template=await source;if(disposed)return;if(!template?.map)throw Error('Fern photographs unavailable');
      const gltf=await new GLTFLoader(loadingManager).loadAsync(`${import.meta.env.BASE_URL}assets/models/coastal_ferns/ferns.gltf`),sources:THREE.Mesh[]=[];
      gltf.scene.traverse(object=>{if((object as THREE.Mesh).isMesh)sources.push(object as THREE.Mesh);});
      const sourceMaterials=new Set(sources.map(mesh=>mesh.material as THREE.Material)),expected=new Set(['Coastal_fern_0_near','Coastal_fern_0_far','Coastal_fern_1_near','Coastal_fern_1_far']);
      if(disposed||sources.length!==4||sources.some(mesh=>!expected.delete(mesh.name)||!mesh.geometry.getAttribute('uv'))){sources.forEach(mesh=>mesh.geometry.dispose());sourceMaterials.forEach(material=>material.dispose());if(!disposed)throw Error('Coastal ferns require two complete near/far pairs');return;}
      // Material.copy preserves the wind callback; clone would omit it. Maps
      // are shared references, not added to this scenery's texture ownership.
      const material=wind(0xffffff,.065);material.copy(template);material.name='Curved photographed coastal fern';material.vertexColors=false;groundFollowing(material);
      const sourceRecord=visibleBatches.find(record=>record.mesh===fernMesh)!,near=new Uint8Array(ferns.length),variantFor=(index:number)=>(Math.imul(index+1,2246822519)>>>19)&1;
      for(const source of sources){
        const match=/Coastal_fern_([01])_(near|far)$/.exec(source.name)!,variant=Number(match[1]),detail=match[2] as 'near'|'far',indices=Array.from({length:ferns.length},(_,i)=>i).filter(i=>variantFor(i)===variant),matrices=indices.map(i=>ferns[i]);
        // The photographed fronds meet above their lowest leaf tip. Bury the
        // crown slightly; a zero minimum-Y alone would leave several stems up.
        source.geometry.translate(0,-.075,0);
        const mesh=batch(source.geometry,material,matrices,undefined,{near,detail,indices,source:sourceRecord});mesh.name=`Curved photographed fern ${detail} ${variant}`;groundSlopes(mesh,matrices);
      }
      fernMesh.visible=false;sourceMaterials.forEach(material=>material.dispose());fernMaterial.dispose();resources.delete(fernMaterial);windMaterials.splice(windMaterials.indexOf(fernMaterial),1);
      foliageDetails.push({key:'fernDetail',near,source:sourceRecord,anchors:ferns.map(matrix=>new THREE.Vector3().setFromMatrixPosition(matrix)),enter:mobile?26:40,exit:mobile?32:48,cap:mobile?8:16,visible:0});
      root.userData.fernDetail={ready:true,nearLimit:mobile?8:16,enterRange:mobile?26:40,exitRange:mobile?32:48,selected:0,visible:0,crownSink:.075};
      let count=0;root.traverse(object=>{if(object instanceof THREE.InstancedMesh)count++;});root.userData.sceneryBudget.instancedBatches=count;
    }catch(error){if(!disposed)root.userData.fernDetail={ready:false,fallback:true,error:String(error)};}
  }

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
  const frondMaterial=wind(0xd3d5ad,.014,true);frondMaterial.vertexColors=true;
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
    pineColors.push(new THREE.Color().setHSL(.23,.10,.72+random()*.12));
  }
  const pineTrunk=new THREE.CylinderGeometry(.7,1,1,6);pineTrunk.translate(0,.5,0);
  treeBatch(pineTrunk,new THREE.MeshStandardMaterial({color:0x78674e,roughness:1}),pines).name='Stone pine trunks';
  const pineMaterial=wind(0xffffff,.01);pineMaterial.vertexColors=true;
  const pineAtlas=createPineNeedleAtlas();textures.push(pineAtlas);pineMaterial.map=pineAtlas;pineMaterial.alphaTest=.38;pineMaterial.alphaToCoverage=true;
  const pineWind=pineMaterial.onBeforeCompile,pineWindKey=pineMaterial.customProgramCacheKey;
  pineMaterial.onBeforeCompile=(shader,renderer)=>{
    pineWind(shader,renderer);
    // Needle cards use canopy-volume normals, identical on both faces. Undo
    // the stock back-face flip only for foliage; wood keeps its surface normal.
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_begin>',`#include <normal_fragment_begin>
      #if defined(DOUBLE_SIDED) && defined(USE_MAP)
        if(vMapUv.x<.5||vMapUv.y>.5){normal*=faceDirection;nonPerturbedNormal=normal;}
      #endif`);
  };
  pineMaterial.customProgramCacheKey=()=>pineWindKey()+'-pine-volume-normal-v1';
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
    ready:Promise.all([grassReady,scrubReady]).then(()=>{let count=0;root.traverse(object=>{if(object instanceof THREE.InstancedMesh)count++;});root.userData.sceneryBudget.instancedBatches=count;}),
    prepareFerns,
    prepareVerge(parts){vergeSurface=parts.length?scanSurface(parts):undefined;for(const record of visibleBatches)if(record.groundSlopes)groundSlopes(record.mesh,record.matrices);root.userData.vergeSurface={ready:Boolean(vergeSurface),parts:parts.length};},
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
        // Pine needle gaps are finer than the world cache's texels. Bake the
        // full authored crown once; only the visible color pass uses far LOD.
        const pineCrown=record.mesh.parent?.name==='Sheltered stone pine boughs';
        if(record.lod?.detail===(pineCrown?'far':'near'))continue;
        const name=record.mesh.parent?.name??'',isTree=/palm|pine/.test(name);
        if(!isTree&&record.mesh.name!=='Coastal limestone boulders')continue;
        const mesh=new THREE.InstancedMesh(record.mesh.geometry,record.mesh.material,record.matrices.length);mesh.name=name||record.mesh.name;
        record.matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;mesh.matrixAutoUpdate=false;mesh.matrix.copy(record.mesh.matrixWorld);mesh.castShadow=true;group.add(mesh);
      }
      return group;
    },
    cullForCamera(camera){
      camera.updateMatrixWorld();camera.getWorldPosition(viewPosition);viewProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);viewFrustum.setFromProjectionMatrix(viewProjection);
      const detailBudgets=new Map<string,{cap:number;candidates:{detail:FoliageDetail;index:number;distance:number}[]}>();
      for(const detail of foliageDetails){
        const key=detail.budget??detail.key,budget=detailBudgets.get(key)??{cap:detail.cap,candidates:[]};detailBudgets.set(key,budget);budget.cap=Math.min(budget.cap,detail.cap);
        const enter=detail.enter,exit=detail.exit;detail.visible=0;
        const sourceCandidates=fieldCandidates(detail.source,exit);
        for(let slot=0;slot<(sourceCandidates?.length??detail.source.limit);slot++){
          const i=sourceCandidates?.[slot]??slot;
          const distance=detail.anchors[i].distanceToSquared(viewPosition);
          if(detail.distant){const range=detail.impostorRange!;if(distance>(range+6)**2)detail.distant[i]=1;else if(distance<(range-6)**2)detail.distant[i]=0;}
          // Distance is much cheaper than six frustum planes. Far-away field
          // tufts cannot enter this small near pool even when facing them.
          if(distance>=(detail.near[i]?exit:enter)**2)continue;
          // Choose within the view first; grass behind the driver must not
          // consume the small near-detail budget. The far-card bounds include
          // a wind margin and also contain all three shorter near clumps.
          if(!viewFrustum.intersectsSphere(detail.source.bounds[i]))continue;
          // Retain a selected grass tuft until a competing one is 2m closer;
          // tiny camera changes must not reshuffle a saturated shared budget.
          budget.candidates.push({detail,index:i,distance:detail.budget?Math.sqrt(distance)-(detail.near[i]?2:0):distance});
        }
        detail.near.fill(0);root.userData[detail.key].selected=0;
      }
      for(const budget of detailBudgets.values()){
        budget.candidates.sort((a,b)=>a.distance-b.distance);
        for(let i=0;i<Math.min(budget.cap,budget.candidates.length);i++){const candidate=budget.candidates[i];candidate.detail.near[candidate.index]=1;root.userData[candidate.detail.key].selected++;}
      }
      for(const record of visibleBatches){const{mesh,matrices,colors,bounds,slots,limit,lod,groundSlopes}=record;let count=0,changed=false;
        const candidates=fieldCandidates(record,lod?.range);
        for(let slot=0;slot<(candidates?.length??limit);slot++){
          const i=candidates?.[slot]??slot;
          if(lod?.range&&((matrices[i].elements[12]-viewPosition.x)**2+(matrices[i].elements[14]-viewPosition.z)**2)>lod.range**2)continue;
          if(lod){const index=lod.indices?.[i]??i;if(lod.source&&index>=lod.source.limit)continue;if(lod.anchors&&lod.detail==='near'){const distance=lod.anchors[i].distanceToSquared(viewPosition),range=mobile?130:200;if(distance<(range-12)**2)lod.near[index]=1;else if(distance>(range+12)**2)lod.near[index]=0;}const near=Boolean(lod.near[index]);if(lod.detail==='near'?!near:near||Boolean(lod.distant?.[index])!==(lod.detail==='impostor'))continue;}
          // Retain off-screen casters if a later lighting pass enables their shadows.
          if(!mesh.castShadow&&!viewFrustum.intersectsSphere(bounds[i]))continue;
          if(slots[count]!==i){mesh.setMatrixAt(count,matrices[i]);if(colors)mesh.setColorAt(count,colors[i]);if(groundSlopes)groundSlopes.attribute.setXYZ(count,groundSlopes.source[i*3],groundSlopes.source[i*3+1],groundSlopes.source[i*3+2]);slots[count]=i;changed=true;}count++;
        }
        mesh.count=count;if(changed){uploadVisiblePrefix(mesh.instanceMatrix,count);if(mesh.instanceColor)uploadVisiblePrefix(mesh.instanceColor,count);if(groundSlopes)uploadVisiblePrefix(groundSlopes.attribute,count);}
        if(lod?.indices&&lod.detail==='near'){const detail=foliageDetails.find(detail=>detail.near===lod.near);if(detail)detail.visible+=count;}
      }
      for(const detail of foliageDetails)root.userData[detail.key].visible=detail.visible;
    },
    setSkyReflection:texture=>water.setSkyReflection(texture),
    setLowDetail(enabled){
      for(const record of visibleBatches){const child=record.mesh;
        const factor=child.name.includes('grass clusters')?.55:child.name.includes('maquis')?.65:child.name.includes('fern rosettes')?.6:child.parent?.name==='Scanned coastal ferns'?.5:1;
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
      vergeSurface=undefined;
      water.dispose();
      root.removeFromParent();
      for(const resource of resources)resource.dispose();
      windMaterials.length=0;
      for(const texture of textures)texture.dispose();
    },
  };
}
