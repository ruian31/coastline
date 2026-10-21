import * as THREE from 'three';
import { heightAt, coast, hill, roads } from './roads';
import { createSeededRandom } from '../utils/random';

/** Authored, deterministic coastal landscape. Distances and animation time are in metres / seconds. */
export function createScenery(scene: THREE.Scene, mobile: boolean): {
  update: (elapsed: number, carPosition: THREE.Vector3) => void;
  dispose: () => void;
} {
  const root = new THREE.Group();
  root.name = 'Coastal landscape';
  scene.add(root);
  const random = createSeededRandom(864203);
  const time = { value: 0 };
  const sun = new THREE.Vector3(.8, .16, .6).normalize();
  const windMaterials: THREE.MeshStandardMaterial[] = [];
  const resources = new Set<THREE.BufferGeometry | THREE.Material>();
  const textures: THREE.Texture[] = [];
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
    return { position: route.sample(i / Math.ceil(route.length / 5)).position, width: route.width };
  }));
  function roadDistance(x: number, z: number): number {
    let d = Infinity;
    for (const point of samples) d = Math.min(d, (point.position.x - x) ** 2 + (point.position.z - z) ** 2);
    return Math.sqrt(d);
  }
  function groundHeight(x: number, z: number): number {
    let closest = samples[0], distanceSquared = Infinity;
    for (const point of samples) {
      const distance = (point.position.x - x) ** 2 + (point.position.z - z) ** 2;
      if (distance < distanceSquared) { closest = point; distanceSquared = distance; }
    }
    const cut = 1 - THREE.MathUtils.smoothstep(Math.sqrt(distanceSquared), closest.width / 2 + 8, closest.width / 2 + 19);
    const y=heightAt(x,z);
    return y - Math.max(0, y - closest.position.y + .42) * cut - .025;
  }
  const terrainColor = new THREE.Color();
  const sand = new THREE.Color('#b59a6d');
  const grassColor = new THREE.Color('#61734a');
  const stoneColor = new THREE.Color('#85816c');

  // Ground: muted limestone, dry coastal grass, pale sand, darker sheltered gullies.
  const subdivisions = mobile ? 104 : 132;
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
  const groundMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .96, metalness: 0 });
  groundMaterial.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec3 vGroundPosition;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvGroundPosition = position;');
    shader.fragmentShader = 'varying vec3 vGroundPosition;\n' + shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float grit = fract(sin(dot(floor(vGroundPosition.xz * 9.0), vec2(12.9898,78.233))) * 43758.5453);
      float patches = sin(vGroundPosition.x*.12+sin(vGroundPosition.z*.095)*2.1)*sin(vGroundPosition.z*.14+vGroundPosition.x*.035);
      float lichen = smoothstep(.2,.6,patches);
      diffuseColor.rgb *= .79 + grit * .20 + patches * .12;
      diffuseColor.rgb = mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.77,.97,.62),lichen*.33);`);
  };
  groundMaterial.customProgramCacheKey = () => 'coastal-ground-grit-v1';
  place(terrain, groundMaterial, 'Limestone headland and grassy interior').receiveShadow = true;

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

  // View-dependent sun glitter, layered wave normals, and distance haze in one draw call.
  const ocean = place(new THREE.PlaneGeometry(9000, 9000, 1, 1), new THREE.ShaderMaterial({
    uniforms: { uTime: time, uSun: { value: sun } },
    vertexShader: `varying vec3 vWorld;
      void main(){vec4 wp=modelMatrix*vec4(position,1.0);vWorld=wp.xyz;gl_Position=projectionMatrix*viewMatrix*wp;}`,
    fragmentShader: `uniform float uTime;uniform vec3 uSun;varying vec3 vWorld;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.0),f.x),f.y);}
      void main(){
        vec2 p=vWorld.xz;float t=uTime;
        float warp=noise(p*.025+t*.012)*6.0;
        float w1=sin(p.x*.17+p.y*.11-t*.73+warp),w2=sin(p.x*-.13+p.y*.23+t*.51+warp*.71);
        float fine=noise(p*.76+vec2(t*.10,-t*.07))-.5;
        vec3 n=normalize(vec3(w1*.035+fine*.025,1.0,w2*.04+fine*.022));
        vec3 view=normalize(cameraPosition-vWorld);
        float fres=pow(1.0-max(dot(n,view),0.0),4.0);
        vec3 col=mix(vec3(.012,.065,.079),vec3(.18,.23,.31),fres*.82);
        vec3 halfway=normalize(view+uSun);
        float glitter=pow(max(dot(n,halfway),0.0),220.0);
        glitter*=.45+noise(p*1.1+t*.14)*.55;
        col+=vec3(2.5,1.08,.24)*glitter;
        col+=vec3(.025,.035,.038)*(noise(p*.31+warp*.05)-.5);
        float dist=length(cameraPosition.xz-p);
        col=mix(col,vec3(.51,.32,.28),smoothstep(650.0,3800.0,dist)*.72);
        gl_FragColor=vec4(col,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }), 'Sea / wavelets and moving sunset reflections');
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = -1.5;

  // A narrow irregular wash follows the actual elliptical shoreline, never a giant ocean grid.
  const foamPositions:number[]=[],foamUvs:number[]=[];
  const shorePoint=(a:number,band:number)=>[Math.cos(a)*355*(1.116+band*.017),-1.465,Math.sin(a)*292*(1.116+band*.017)];
  for(let i=0;i<320;i++) {
    const a=i/320*Math.PI*2,b=(i+1)/320*Math.PI*2;
    const p=[shorePoint(a,0),shorePoint(a,1),shorePoint(b,0),shorePoint(b,1)],uv=[[i/320,0],[i/320,1],[(i+1)/320,0],[(i+1)/320,1]];
    for(const index of [0,2,1,1,2,3]){foamPositions.push(...p[index]);foamUvs.push(...uv[index]);}
  }
  const foamGeometry=new THREE.BufferGeometry();foamGeometry.setAttribute('position',new THREE.Float32BufferAttribute(foamPositions,3));foamGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(foamUvs,2));
  place(foamGeometry,new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{uTime:time},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`uniform float uTime;varying vec2 vUv;void main(){
      float variation=sin(vUv.x*173.0+sin(vUv.x*73.0)*2.0)*.10;
      float wave=fract(vUv.y*.8-uTime*.075+variation),edge=exp(-pow((wave-.43)*15.0,2.0));
      float breakup=.5+.5*sin(vUv.x*473.0+sin(vUv.x*187.0)*2.0+uTime*.4);
      float opacity=edge*.24*breakup*sin(vUv.y*3.14159);
      gl_FragColor=vec4(.65,.70,.64,opacity);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`}), 'Soft receding shoreline wash');

  // Geometry assembly helpers keep repeated coastal assets in a handful of draw calls.
  function batch(geometry: THREE.BufferGeometry, material: THREE.Material, matrices: THREE.Matrix4[], colors?: THREE.Color[]): THREE.InstancedMesh {
    const mesh = new THREE.InstancedMesh(keep(geometry), keep(material), matrices.length);
    matrices.forEach((matrix, i) => { mesh.setMatrixAt(i, matrix); if (colors) mesh.setColorAt(i, colors[i]); });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    root.add(mesh);
    return mesh;
  }
  function matrix(x: number, y: number, z: number, sx: number, sy: number, sz: number, angle = random() * Math.PI * 2): THREE.Matrix4 {
    return new THREE.Matrix4().compose(new THREE.Vector3(x,y,z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),angle), new THREE.Vector3(sx,sy,sz));
  }
  function wind(color: number, amplitude: number): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({ color, roughness: .9, side: THREE.DoubleSide });
    material.onBeforeCompile = shader => {
      shader.uniforms.uSceneryTime = time;
      shader.vertexShader = 'uniform float uSceneryTime;\n' + shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        float phase=0.0;
        #ifdef USE_INSTANCING
          phase=instanceMatrix[3].x*.34+instanceMatrix[3].z*.19;
        #endif
        float anchoredHeight=max(position.y,0.0);
        transformed.x+=sin(uSceneryTime*1.25+phase+position.y*.2)*${amplitude.toFixed(4)}*anchoredHeight;
        transformed.z+=cos(uSceneryTime*.83+phase)*${(amplitude * .55).toFixed(4)}*anchoredHeight;`);
    };
    material.customProgramCacheKey = () => `coast-wind-${amplitude}`;
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
    if(roadDistance(x,z)<9 || y<-1.8)continue;
    const scale=.7+random()*3.4;
    rocks.push(matrix(x,y-.3,z,scale,scale*(.5+random()*.65),scale*(.8+random()*.5)));
    rockColors.push(new THREE.Color('#b3aa8f').multiplyScalar(.76+random()*.35));
  }
  batch(rockShape,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.93}),rocks,rockColors).name='Coastal limestone boulders';

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
  grassMaterial.map=plantTexture('grass');grassMaterial.alphaTest=.38;
  const grasses:THREE.Matrix4[]=[],grassesColors:THREE.Color[]=[];
  const anchors=Array.from({length:360},(_,i)=>({t:i/360+(random()-.5)*.001,side:i%2?1:-1,offset:8+random()*14}));
  for(let i=0;i<(mobile?3300:5700);i++) {
    const anchor=anchors[i%anchors.length],route=i%7===0?hill:coast;
    const s=route.sample(anchor.t+(random()-.5)*.007),offset=anchor.side*(anchor.offset+(random()-.5)*7);
    const x=s.position.x+s.right.x*offset,z=s.position.z+s.right.z*offset,y=groundHeight(x,z);
    if(y<-.4 || roadDistance(x,z)<6.8)continue;
    const size=.58+random()*.8;
    grasses.push(matrix(x,y-.05,z,size,size*(.55+random()*.6),size));
    grassesColors.push(new THREE.Color().setHSL(.16+random()*.04,.11,.74+random()*.16));
  }
  batch(grassGeometry,grassMaterial,grasses,grassesColors).name='Layered wind moving grass clusters';

  const bushGeometry=crossedCards(2.6,1.9,4),bushMaterial=wind(0xffffff,.035);
  bushMaterial.map=plantTexture('shrub');bushMaterial.alphaTest=.36;
  const bushes:THREE.Matrix4[]=[],bushColors:THREE.Color[]=[];
  for(let i=0;i<(mobile?420:720);i++) {
    const anchor=anchors[i%anchors.length],s=coast.sample(anchor.t+(random()-.5)*.012),offset=anchor.side*(12+random()*21);
    const x=s.position.x+s.right.x*offset,z=s.position.z+s.right.z*offset,y=groundHeight(x,z);
    if(y<.1||roadDistance(x,z)<9)continue;
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
    if(y<.3||roadDistance(x,z)<7.4)continue;
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
    if(y<.5||roadDistance(x,z)<7)continue;flowers.push(matrix(x,y,z,1,1,1));
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
  const frondVertices:number[]=[],frondColors:number[]=[];
  const crown=new THREE.Vector3(.65,7.8,0);
  const putTriangle=(a:THREE.Vector3,b:THREE.Vector3,c:THREE.Vector3,tint:number)=>{[a,b,c].forEach(v=>{frondVertices.push(v.x,v.y,v.z);frondColors.push(.63*tint,.84*tint,.43*tint);});};
  for(let branch=0;branch<9;branch++) {
    const angle=branch*Math.PI*2/9+random()*.25,dir=new THREE.Vector3(Math.cos(angle),0,Math.sin(angle)),across=new THREE.Vector3(-dir.z,0,dir.x);
    const length=3.1+random()*1.35,arch=.9+random()*.8,droop=1.15+random()*.85;
    const center=(t:number)=>crown.clone().addScaledVector(dir,t*length).add(new THREE.Vector3(0,Math.sin(t*Math.PI)*arch-t*t*droop+(branch%4===0?t*.65:0),0));
    for(let leaf=0;leaf<9;leaf++) {
      const t=.07+leaf*.10,width=Math.sin(t*Math.PI)*(.58+random()*.14);
      const a=center(t),b=center(t+.085),tint=.73+random()*.36;
      putTriangle(a.clone().addScaledVector(across,.022),a.clone().addScaledVector(across,-.022),b,tint*.85);
      for(const side of [-1,1]) {
        const tip=center(t+.12).addScaledVector(across,width*side);tip.y-=.16+width*.20;
        const mid=a.clone().lerp(tip,.52).addScaledVector(dir,.055);mid.y+=.055;
        putTriangle(a,b,mid,tint);
        putTriangle(b,tip,mid,tint*.95);
      }
    }
  }
  const frondGeometry=new THREE.BufferGeometry();frondGeometry.setAttribute('position',new THREE.Float32BufferAttribute(frondVertices,3));frondGeometry.setAttribute('color',new THREE.Float32BufferAttribute(frondColors,3));frondGeometry.computeVertexNormals();
  const frondMaterial=wind(0x718d43,.009);frondMaterial.vertexColors=true;
  const palms:THREE.Matrix4[]=[],palmColors:THREE.Color[]=[];
  for(let i=0;i<(mobile?48:82);i++) {
    const t=i<24?.10+random()*.17:random();
    // Reserve the future town and the tunnel portals for the next milestone.
    if((t>.32&&t<.42)||(t>.66&&t<.75))continue;
    const s=coast.sample(t),offset=(random()>.6?1:-1)*(11+random()*23);
    const x=s.position.x+s.right.x*offset,z=s.position.z+s.right.z*offset,y=groundHeight(x,z);
    if(y<.8||roadDistance(x,z)<10)continue;
    const size=.78+random()*.55;
    palms.push(matrix(x,y,z,size,size,size));palmColors.push(new THREE.Color().setHSL(.23,.23,.65+random()*.2));
  }
  batch(trunkGeometry,trunkMaterial,palms).name='Curved palm trunks';
  batch(frondGeometry,frondMaterial,palms,palmColors).name='Wind moving palm fronds';

  // Inland stone-pine silhouettes break the hill contour, leaving the coastal road open.
  const pines:THREE.Matrix4[]=[],pineCrowns:THREE.Matrix4[]=[],pineColors:THREE.Color[]=[];
  for(let i=0;i<(mobile?44:85);i++) {
    const x=(random()-.5)*460,z=(random()-.5)*360,y=groundHeight(x,z);
    if(roadDistance(x,z)<12)continue;
    const size=.8+random()*.8;
    pines.push(matrix(x,y,z,.18*size,5*size,.18*size,0));
    pineCrowns.push(matrix(x,y+4.7*size,z,3.8*size,1.8*size,3*size));
    pineColors.push(new THREE.Color().setHSL(.23,.23,.36+random()*.12));
  }
  const pineTrunk=new THREE.CylinderGeometry(.7,1,1,6);pineTrunk.translate(0,.5,0);
  batch(pineTrunk,new THREE.MeshStandardMaterial({color:0x78674e,roughness:1}),pines).name='Stone pine trunks';
  batch(new THREE.SphereGeometry(1,12,7),wind(0x74805e,.01),pineCrowns,pineColors).name='Sheltered stone pine crowns';

  // The imported routes also determine safe plant clearance, so future road edits stay coherent.
  root.userData.routeIds = roads.map(r=>r.id);
  root.userData.sceneryBudget = { tier:mobile?'mobile':'desktop', instancedBatches:10, terrainTriangles:subdivisions*subdivisions*2 };
  return {
    update(elapsed, carPosition) {
      time.value=elapsed;
      sky.position.set(carPosition.x,0,carPosition.z);
    },
    dispose() {
      root.removeFromParent();
      for(const resource of resources)resource.dispose();
      windMaterials.length=0;
      for(const texture of textures)texture.dispose();
    },
  };
}
