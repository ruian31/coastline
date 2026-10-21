import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { createDriver } from './Driver';

/** Coordinates are metres, +Z forward, +Y up. Current cabins use right-hand drive. */
export const CAR_DEFINITIONS = [
  { name: '海风 · 经典', subtitle: '经典双座 / 暖棕皮革', color: '#96b9ac' },
  { name: '落日 · GT', subtitle: '现代豪华敞篷 / 奶油皮革', color: '#8c3433' },
  { name: '月白 · Sport', subtitle: '低姿运动敞篷 / 深蓝桶椅', color: '#ede6d4' },
] as const;

export interface Convertible {
  root: THREE.Group;
  cockpitEye: THREE.Vector3;
  cockpitLook: THREE.Vector3;
  update: (speed: number, steer: number, dt: number) => void;
  setContactShadow:(visible:boolean)=>void;
  dispose: () => void;
}

type MaterialKey = 'paint' | 'leather' | 'seam' | 'dark' | 'chrome' | 'wood' | 'glass' | 'lens' | 'mirror' | 'headlight' | 'tail' | 'amber';
type MaterialKit = Record<MaterialKey, THREE.MeshStandardMaterial>;

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Static authored parts collapse to one draw per material, while moving parts stay separate. */
class GeometryBatch {
  private batches = new Map<MaterialKey, THREE.BufferGeometry[]>();
  constructor(private materials: MaterialKit) {}

  add(key: MaterialKey, geo: THREE.BufferGeometry, position = V(0, 0, 0), rotation = new THREE.Euler(), scale = V(1, 1, 1)) {
    // All inputs become indexed, UV-bearing geometry before merge.
    let source = geo;
    if (source.index) source = source.toNonIndexed();
    else source = source.clone();
    if (!source.getAttribute('uv')) source.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(source.getAttribute('position').count * 2), 2));
    source.applyMatrix4(new THREE.Matrix4().compose(position, new THREE.Quaternion().setFromEuler(rotation), scale));
    if (key === 'leather' || key === 'wood' || key === 'paint') {
      // Metre-scaled box projection prevents bevel/extrusion UVs stretching the grain.
      const p = source.getAttribute('position'), n = source.getAttribute('normal'), uv = source.getAttribute('uv');
      const density = key === 'leather' ? 8 : key === 'wood' ? 2.1 : 12;
      for (let i = 0; i < p.count; i++) {
        const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i));
        if (ny >= nx && ny >= nz) uv.setXY(i, p.getX(i) * density, p.getZ(i) * density);
        else if (nx >= nz) uv.setXY(i, p.getZ(i) * density, p.getY(i) * density);
        else uv.setXY(i, p.getX(i) * density, p.getY(i) * density);
      }
    }
    const list = this.batches.get(key) ?? [];
    list.push(source);
    this.batches.set(key, list);
    geo.dispose();
  }

  box(key: MaterialKey, dimensions: [number, number, number], position: THREE.Vector3, radius = 0) {
    if (radius > 0) {
      // Bevelled extrusions give soft seams and highlights on seats and trim.
      const [w, h, d] = dimensions;
      const bevel = Math.min(radius, w / 4, h / 4, d / 3);
      const shape = roundedShape(w - bevel * 2, h - bevel * 2, bevel);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: d - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: key === 'leather' ? 4 : 2, steps: 1, curveSegments: key === 'leather' ? 8 : 5 });
      geo.translate(0, 0, -d / 2 + bevel);
      if (key === 'leather') {
        geo.deleteAttribute('normal'); geo.deleteAttribute('uv');
        const padded = mergeVertices(geo, .00001); padded.computeVertexNormals(); geo.dispose();
        this.add(key, padded, position);
      } else this.add(key, geo, position);
    } else this.add(key, new THREE.BoxGeometry(...dimensions), position);
  }

  tube(key: MaterialKey, points: THREE.Vector3[], radius: number, segments = 40) {
    this.add(key, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), segments, radius, 5, false));
  }

  finish(parent: THREE.Group) {
    for (const [key, pieces] of this.batches) {
      const merged = mergeGeometries(pieces, false);
      if (merged) {
        const mesh = new THREE.Mesh(merged, this.materials[key]);
        mesh.name = `vehicle-${key}`;
        mesh.castShadow = key !== 'glass' && key !== 'mirror' && key !== 'lens';
        mesh.receiveShadow = true;
        parent.add(mesh);
      }
      pieces.forEach(g => g.dispose());
    }
    this.batches.clear();
  }
}

function roundedShape(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const l = -w / 2 + r, rr = w / 2 - r, b = -h / 2 + r, t = h / 2 - r;
  s.moveTo(l, -h / 2); s.lineTo(rr, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, b);
  s.lineTo(w / 2, t); s.quadraticCurveTo(w / 2, h / 2, rr, h / 2);
  s.lineTo(l, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, t);
  s.lineTo(-w / 2, b); s.quadraticCurveTo(-w / 2, -h / 2, l, -h / 2);
  return s;
}

function upholsteryTexture(kind: 'leather' | 'wood' | 'paint') {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const c = canvas.getContext('2d')!;
  let seed = kind === 'leather' ? 5189 : kind === 'wood' ? 8213 : 3109;
  const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const image = c.createImageData(256, 256);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = kind === 'wood' ? 207 + rand() * 24 : kind === 'leather' ? 231 + rand() * 23 : 218 + rand() * 31;
    image.data[i] = value; image.data[i + 1] = value; image.data[i + 2] = value; image.data[i + 3] = 255;
  }
  c.putImageData(image, 0, 0);
  if (kind === 'wood') {
    for (let line = 0; line < 100; line++) {
      const y = line * 2.56, phase = rand() * 6.28;
      c.strokeStyle = `rgba(87,67,43,${.06 + rand() * .11})`; c.lineWidth = .5 + rand() * 1.1; c.beginPath();
      for (let x = 0; x <= 256; x += 4) {
        const wave = Math.sin(x / 45 + phase) * 1.8 + Math.sin(x / 14 + phase) * .45;
        if (x === 0) c.moveTo(x, y + wave); else c.lineTo(x, y + wave);
      }
      c.stroke();
    }
  } else if (kind === 'leather') {
    for (let i = 0; i < 2200; i++) {
      const x = rand() * 256, y = rand() * 256;
      c.strokeStyle = `rgba(107,98,86,${.025 + rand() * .055})`; c.lineWidth = .6;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + 1.7, y + .7); c.lineTo(x + 2.8, y - .3); c.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas); texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = kind === 'paint' ? THREE.NoColorSpace : THREE.SRGBColorSpace; texture.anisotropy = 4;
  texture.name = `vehicle-${kind}-grain`; return texture;
}

function materialKit(index: number): { materials: MaterialKit; textures: THREE.Texture[] } {
  const spec = CAR_DEFINITIONS[index];
  const mat = (color: THREE.ColorRepresentation, roughness: number, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const materials: MaterialKit = {
    paint: new THREE.MeshPhysicalMaterial({ color: spec.color, roughness: .32, metalness: .18, clearcoat: .72, clearcoatRoughness: .24, envMapIntensity: .7 }),
    leather: mat(index === 1 ? '#bca588' : index === 2 ? '#253949' : '#a0704c', .86),
    seam: mat(index === 2 ? '#768892' : '#bf9a70', .88),
    dark: mat('#151a1b', .79),
    chrome: mat('#bdc6c8', .22, .88),
    wood: mat(index === 2 ? '#25292b' : '#805938', .4),
    glass: new THREE.MeshPhysicalMaterial({ color: '#b8d8db', roughness: .08, metalness: 0, transparent: true, opacity: .13, depthWrite: false, side: THREE.DoubleSide }),
    lens: new THREE.MeshPhysicalMaterial({color:'#d4e0dd',roughness:.07,metalness:0,clearcoat:1,clearcoatRoughness:.06,transparent:true,opacity:.2,depthWrite:false}),
    mirror: mat('#a0bbc1', .13, .95),
    headlight: new THREE.MeshStandardMaterial({ color: '#fff1c9', emissive: '#ffd396', emissiveIntensity: .55, roughness: .24 }),
    tail: new THREE.MeshPhysicalMaterial({ color: '#861d20', emissive: '#c12f23', emissiveIntensity: .28, roughness: .19,clearcoat:.8,clearcoatRoughness:.12 }),
    amber: new THREE.MeshStandardMaterial({ color: '#e99f32', emissive: '#a0570c', emissiveIntensity: .25, roughness: .3 }),
  };
  const leather = upholsteryTexture('leather'), wood = upholsteryTexture('wood'), paint = upholsteryTexture('paint');
  materials.leather.map = leather; materials.leather.bumpMap = leather; materials.leather.bumpScale = .00065; materials.leather.roughnessMap = leather;
  materials.dark.bumpMap=leather;materials.dark.bumpScale=.00035;materials.dark.roughnessMap=leather;
  materials.wood.map = wood; materials.wood.bumpMap = wood; materials.wood.bumpScale = .0009; materials.wood.roughnessMap = wood;
  materials.paint.roughnessMap = paint;
  return { materials, textures: [leather, wood, paint] };
}

function surface(sample: (u: number, v: number) => THREE.Vector3, us: number, vs: number) {
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  for (let i = 0; i <= us; i++) for (let j = 0; j <= vs; j++) {
    const p = sample(i / us, j / vs);
    positions.push(p.x, p.y, p.z); uvs.push(i / us, j / vs);
    if (i < us && j < vs) {
      const a = i * (vs + 1) + j, b = a + vs + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices); g.computeVertexNormals();
  return g;
}

const profileWidth = (z: number, variant: number) => {
  if (variant === 1) return .87 + .055 * Math.exp(-(((z + 1.2) / .75) ** 2)) + .035 * Math.exp(-(((z - 1.2) / .65) ** 2)) - .09 * Math.max(0, (Math.abs(z) - 1.7) / .5);
  if (variant === 2) return .83 + .11 * Math.exp(-(((z + 1.25) / .65) ** 2)) + .075 * Math.exp(-(((z - 1.27) / .6) ** 2)) - .17 * Math.max(0, (z - 1.75) / .4);
  return .81 + .115 * Math.exp(-(((z - 1.3) / .55) ** 2)) + .105 * Math.exp(-(((z + 1.3) / .6) ** 2)) - .11 * Math.max(0, (Math.abs(z) - 1.8) / .4);
};
const profileShoulder = (z: number, variant: number) => {
  if (variant === 1) return .96 + .045 * Math.exp(-(((z - 1.27) / .8) ** 2)) + .045 * Math.exp(-(((z + 1.2) / .8) ** 2)) - .09 * Math.max(0, (z - 1.7) / .5);
  if (variant === 2) return .86 + .13 * Math.exp(-(((z - 1.27) / .6) ** 2)) + .13 * Math.exp(-(((z + 1.3) / .65) ** 2)) - .08 * Math.max(0, (z - 1.65) / .5);
  return .91 + .105 * Math.exp(-(((z - 1.27) / .56) ** 2)) + .07 * Math.exp(-(((z + 1.3) / .65) ** 2));
};

function buildBody(batch: GeometryBatch, variant: number) {
  const bodyWidth = (z: number) => profileWidth(z, variant);
  const shoulder = (z: number) => profileShoulder(z, variant);
  // No surface crosses the cabin: the waist rails and separate hood/deck surround a real opening.
  for (const side of [-1, 1]) {
    batch.add('paint', surface((u, v) => {
      const z = -2.13 + u * 4.28;
      let bottom = .37;
      for (const wheelZ of [-1.28, 1.28]) {
        const distance = Math.abs(z - wheelZ);
        if (distance < .42) bottom = Math.max(bottom, .35 + Math.sqrt(.42 ** 2 - distance ** 2));
      }
      const y = bottom + (shoulder(z) - bottom) * v;
      return V(side * (bodyWidth(z) - .065 * (1 - v) + .02 * Math.sin(v * Math.PI)), y, z);
    }, 112, 6));
    // Return-facing skin normals for the opposite side.
    const rail: THREE.Vector3[] = [], chrome: THREE.Vector3[] = [];
    for (let i = 0; i <= 44; i++) {
      const z = -2.1 + i * 4.2 / 44;
      rail.push(V(side * bodyWidth(z), shoulder(z), z));
      chrome.push(V(side * (bodyWidth(z) + .005), shoulder(z) - .085, z));
    }
    batch.tube('paint', rail, .045, 76);
    batch.tube(variant === 2 ? 'dark' : 'chrome', chrome, variant === 2 ? .006 : .009, 76);
    // Wheel arch rolled edges.
    for (const z of [-1.28, 1.28]) {
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= 32; i++) {
        const a = Math.PI * i / 32;
        const pz = z + Math.cos(a) * .424;
        points.push(V(side * (bodyWidth(pz) + .005), .35 + Math.sin(a) * .424, pz));
      }
      batch.tube(variant === 0 ? 'chrome' : 'paint', points, variant === 0 ? .012 : .018, 34);
    }
    const sideSkinX = (y: number, z: number) => {
      let bottom = .37;
      for (const wheelZ of [-1.28, 1.28]) {
        const distance = Math.abs(z - wheelZ);
        if (distance < .42) bottom = Math.max(bottom, .35 + Math.sqrt(.42 ** 2 - distance ** 2));
      }
      const v = THREE.MathUtils.clamp((y - bottom) / (shoulder(z) - bottom), 0, 1);
      return bodyWidth(z) - .065 * (1 - v) + .02 * Math.sin(v * Math.PI);
    };
    const doorCurve = new THREE.CatmullRomCurve3([V(0, .91, .5), V(0, .66, .3), V(0, .42, -.68), V(0, .83, -.96)]);
    const doorSeam = Array.from({ length: 37 }, (_, i) => {
      const p = doorCurve.getPoint(i / 36); p.x = side * (sideSkinX(p.y, p.z) + .002); return p;
    });
    batch.tube('dark', doorSeam, .0025, 40);
    batch.box('chrome', [.025, .026, .12], V(side * (sideSkinX(.85, -.5) + .012), .85, -.5), .006);
  }
  for (const [start, end] of [[.61, 2.14], [-2.14, -.91]]) {
    batch.add('paint', surface((u, v) => {
      const z = start + u * (end - start), x = (v * 2 - 1) * bodyWidth(z);
      const crown = (variant === 2 ? -.015 : .045) * (1 - (v * 2 - 1) ** 2);
      return V(x, shoulder(z) + crown, z);
    }, 32, 24));
  }
  // Hood crease and louvres are deliberate scale details.
  if (variant === 0) batch.tube('chrome', [V(0, 1.015, .7), V(0, 1.025, 1.2), V(0, .975, 2.08)], .005, 22);
  else for (const side of [-1, 1]) batch.tube('paint', [V(side * .38, shoulder(.65) + .035, .65), V(side * .46, shoulder(1.2) + .035, 1.2), V(side * .42, shoulder(2) + .03, 2)], .011, 22);
  for (let i = 0; i < (variant === 0 ? 9 : 5); i++) for (const x of [-.54, .54]) batch.box('dark', [variant === 2 ? .24 : .19, .005, .014], V(x, shoulder(.85 + i * .036) + .021, .85 + i * .036));
  batch.box('dark', [1.47, .10, 1.61], V(0, .39, -.12));
  // Curved front and rear valances, including broad radiator aperture.
  for (const z of [-2.14, 2.14]) {
    batch.add('paint', surface((u, v) => V((u * 2 - 1) * .755, .41 + v * (shoulder(z) + .04 * Math.sin(u * Math.PI) - .41), z + Math.sin(u * Math.PI) * .025 * Math.sign(z)), 22, 7));
    batch.tube(variant === 0 ? 'chrome' : 'dark', [V(-.8, .49, z), V(-.62, .46, z * 1.025), V(0, .45, z * 1.03), V(.62, .46, z * 1.025), V(.8, .49, z)], variant === 0 ? .027 : .018, 36);
  }
  const grilleWidth = variant === 1 ? 1.12 : variant === 2 ? .79 : .91;
  batch.box('dark', [grilleWidth, variant === 2 ? .17 : .24, .04], V(0, .65, 2.174), .045);
  if (variant === 2) {
    for (let i = -4; i <= 4; i++) batch.box('dark', [.045, .10, .035], V(i * .075, .65, 2.215));
    batch.box('dark', [1.45, .045, .18], V(0, .39, 2.12), .015);
  } else {
    for (let i = -10; i <= 10; i++) batch.box('chrome', [.013, .2, .016], V(i * grilleWidth / 24, .65, 2.206));
    batch.box('chrome', [grilleWidth, .018, .022], V(0, .78, 2.208));
    batch.box('chrome', [grilleWidth, .018, .022], V(0, .52, 2.208));
  }
  for (const side of [-1, 1]) {
    if (variant === 0) {
      batch.add('chrome', new THREE.CylinderGeometry(.126, .126, .035, 36), V(side * .61, .82, 2.153), new THREE.Euler(Math.PI / 2, 0, 0));
      batch.add('chrome',surface((u,v)=>{const a=u*Math.PI*2,r=.012+v*.095;return V(side*.61+Math.sin(a)*r,.82+Math.cos(a)*r,2.166+.036*(r/.107)**2);},40,10));
      batch.add('headlight',new THREE.SphereGeometry(.025,16,10),V(side*.61,.82,2.195));
      batch.add('lens',new THREE.SphereGeometry(1,32,16),V(side*.61,.82,2.207),new THREE.Euler(),V(.109,.109,.022));
      for (let i = -3; i <= 3; i++) batch.box('chrome', [.0015, .15 - Math.abs(i) * .015, .0015], V(side * .61 + i * .023, .82, 2.218));
    } else {
      batch.box('dark', [.34, variant === 1 ? .095 : .065, .025], V(side * .585, variant === 1 ? .84 : .815, 2.168), .017);
      batch.box('headlight', [.30, .018, .025], V(side * .585, variant === 1 ? .86 : .825, 2.19), .006);
      batch.box('lens',[.33,variant===1?.087:.059,.018],V(side*.585,variant===1?.84:.815,2.212),.014);
      if (variant === 1) for (const dx of [-.065, .065]) batch.box('headlight', [.06, .03, .026], V(side * .585 + dx, .826, 2.191), .008);
      else batch.box('dark', [.20, .12, .035], V(side * .57, .57, 2.178), .014);
    }
    batch.box('amber', [.12, .022, .025], V(side * .61, .6, 2.18), .006);
    batch.box(variant === 0 ? 'chrome' : 'dark', [.31, variant === 0 ? .12 : .065, .035], V(side * .57, .75, -2.172), .018);
    batch.box('tail', [.27, variant === 0 ? .083 : .027, .035], V(side * .57, .75, -2.194), .012);
    batch.add('chrome', new THREE.CylinderGeometry(.04, .04, .22, 12, 1, true), V(side * .6, .32, -2.13), new THREE.Euler(Math.PI / 2, 0, 0));
  }
  if (variant === 2) {
    batch.box('tail', [.83, .012, .024], V(0, .75, -2.195));
    batch.tube('paint', [V(-.77, .99, -1.96), V(0, 1.015, -2.015), V(.77, .99, -1.96)], .025, 26);
    for (const side of [-1, 1]) batch.tube('chrome', [V(side * .42, 1.05, -.87), V(side * .42, 1.35, -.9), V(side * .63, 1.35, -.9), V(side * .63, 1.05, -.87)], .024, 14);
  }
  batch.box('dark', [.37, .11, .022], V(0, .62, -2.188), .008);
  batch.box('chrome', [.34, .006, .024], V(0, .66, -2.205));
}

function buildSculptedSeat(batch:GeometryBatch,x:number,variant:number){
  const shaped=(value:number,power:number)=>Math.sign(value)*Math.abs(value)**power;
  const radius=(u:number)=>u<=0||u>=1?0:Math.sin(u*Math.PI)**.17;
  const cushion=(u:number,v:number)=>{
    const a=-v*Math.PI*2,r=radius(u),across=shaped(Math.cos(a),.62),up=shaped(Math.sin(a),.65);
    const wing=(variant===2?.065:.034)*Math.abs(across)**5*Math.max(0,Math.sin(a))**.3;
    return V(x+(.27-.012*u)*r*across,.558+(variant===2?.064:.079)*r*up+wing-.012*(1-across*across)*Math.sin(u*Math.PI),-.675+u*.61);
  };
  const height=variant===2?.71:variant===1?.58:.54;
  const back=(u:number,v:number)=>{
    const a=v*Math.PI*2,r=radius(u),across=shaped(Math.cos(a),.6),front=shaped(Math.sin(a),.65);
    const width=(variant===2?.235:.264)*(1-.12*u+.075*Math.exp(-(((u-.72)/.18)**2)));
    const wing=(variant===2?.115:.062)*Math.abs(across)**4*Math.max(0,Math.sin(a))**.3;
    const lumbar=.021*Math.exp(-(((u-.3)/.2)**2))*Math.max(0,Math.sin(a));
    return V(x+width*r*across,.61+u*height,-.705-.085*u+.066*r*front+wing+lumbar);
  };
  batch.add('leather',surface(cushion,24,32));batch.add('leather',surface(back,28,36));
  const front=(u:number,nx:number)=>{const angle=Math.acos(shaped(nx,1/.6));const p=back(u,angle/(Math.PI*2));p.z+=.0016;return p;};
  const top=(u:number,nx:number)=>{const angle=Math.acos(shaped(nx,1/.62));const p=cushion(u,-angle/(Math.PI*2));p.y+=.0015;return p;};
  for(const side of[-1,1]){
    batch.tube('seam',Array.from({length:18},(_,i)=>front(.08+i/17*.84,side*.73)),.0018,24);
    batch.tube('seam',Array.from({length:18},(_,i)=>top(.07+i/17*.86,side*.71)),.0017,24);
    for(let i=0;i<26;i++){
      batch.tube('seam',[front(.12+i*.029,side*.69),front(.128+i*.029,side*.69)],.0008,1);
      batch.tube('seam',[top(.12+i*.029,side*.67),top(.128+i*.029,side*.67)],.0008,1);
    }
  }
  if(variant===0){
    for(let column=-2;column<=2;column++){
      batch.tube('wood',Array.from({length:14},(_,i)=>front(.12+i/13*.76,column*.205)),.0013,16);
      batch.tube('wood',Array.from({length:14},(_,i)=>top(.12+i/13*.76,column*.205)),.0011,16);
    }
  }else if(variant===1){
    for(const slope of[-1,1])for(let diagonal=-3;diagonal<=3;diagonal++){
      const points:THREE.Vector3[]=[];
      for(let i=0;i<=28;i++){const f=i/28,nx=(f-.5)*1.1*slope+diagonal*.205;if(Math.abs(nx)<=.55)points.push(front(.17+f*.66,nx));}
      if(points.length>1)batch.tube('seam',points,.00105,16);
    }
  }else{
    for(const u of[.27,.5,.73])batch.tube('seam',Array.from({length:15},(_,i)=>front(u,-.48+i/14*.96)),.0012,16);
  }
}

function buildCabin(batch: GeometryBatch, variant: number) {
  batch.box('dark', [1.49, .08, 1.5], V(0, .44, -.18));
  // A closed inner tub joins the floor, doors and rear deck. Wide phone views
  // must not see the rear wheels through the space behind the seats.
  batch.box('dark',[1.49,.61,.075],V(0,.7,-.92));
  // Full-height kickboard seals both footwells against the front wheel houses.
  // It overlaps the dash, floor and door liners so a low cockpit view stays enclosed.
  batch.box('dark', [1.52, .65, .12], V(0, .715, .63));
  for (const side of [-1, 1]) {
    batch.box('dark',[.045,.19,1.62],V(side*.735,.47,-.14));
    batch.box('leather',[.035,.35,1.62],V(side*.735,.72,-.14));
    batch.box('leather', [.055, .50, .65], V(side * .735, .70, .25), .012);
    batch.box('dark', [.12, .06, .48], V(side * .665, .485, .27), .012);
    batch.box('leather', [.08, .29, .35], V(side * .748, .81, .29), .014);
  }
  batch.box(variant === 0 ? 'wood' : 'dark', [1.46, .19, .15], V(0, .96, .57), .02);
  batch.add(variant===1?'leather':'dark',surface((u,v)=>{const a=v*Math.PI*2;return V((u*2-1)*.74,1.067+Math.sin(a)*.048,.59+Math.cos(a)*(variant===0?.12:.105));},32,20));
  batch.box('dark', [.65, .14, .035], V(-.37, .995, .475), .018);
  batch.add('dark',surface((u,v)=>{const a=u*Math.PI;return V(-.41+Math.cos(a)*.35,1.008+Math.sin(a)*.16,.44+v*.16);},32,8));
  // Passenger glovebox, vents and pull handle.
  batch.box('dark', [.44, .006, .008], V(.42, .99, .477));
  batch.box('chrome', [.11, .014, .015], V(.43, .955, .466), .004);
  for (const x of [-.68, .13, .66]) {
    batch.add('chrome', new THREE.CylinderGeometry(.034, .034, .013, 20), V(x, 1.015, .462), new THREE.Euler(Math.PI / 2, 0, 0));
    batch.box('dark', [.047, .032, .02], V(x, 1.015, .45));
    for (let i = -1; i <= 1; i++) batch.box('chrome', [.04, .002, .003], V(x, 1.015 + i * .009, .438));
  }
  // Radio fascia: slotted frequency window, chrome knobs, preset buttons.
  if (variant === 0) {
    batch.box('chrome', [.22, .10, .03], V(0, .9, .46), .006);
    batch.box('dark', [.15, .028, .01], V(0, .92, .437));
    for (const x of [-.084, .084]) batch.add('dark', new THREE.CylinderGeometry(.016, .016, .023, 12), V(x, .894, .435), new THREE.Euler(Math.PI / 2, 0, 0));
    for (let i = -2; i <= 2; i++) batch.box('dark', [.017, .009, .012], V(i * .028, .883, .436));
  } else {
    // Recessed centre infotainment and a bridge console distinguish the modern cabins.
    batch.box('chrome', [.29, .18, .025], V(.09, .96, .453), .008);
    batch.box('dark', [.267, .158, .016], V(.09, .96, .432), .006);
    batch.box('mirror', [.23, .10, .006], V(.09, .973, .421), .004);
    batch.box('headlight', [.11, .002, .004], V(.06, .96, .416));
    for (const x of [.01, .16]) batch.add('chrome', new THREE.CylinderGeometry(.021, .021, .017, 18), V(x, .84, .435), new THREE.Euler(Math.PI / 2, 0, 0));
    batch.box('leather', [.26, .19, .29], V(0, .73, .27), .02);
  }
  batch.box('leather', [variant === 0 ? .22 : .27, .24, 1.2], V(0, .54, -.1), .035);
  batch.box(variant === 0 ? 'wood' : 'dark', [variant === 0 ? .18 : .23, .027, .62], V(0, .676, -.12), .014);
  batch.add('dark', new THREE.ConeGeometry(.065, .1, 18), V(0, .724, .02));
  batch.tube('chrome', [V(0, .73, .02), V(0, .81, -.015), V(0, .86, -.04)], .012, 8);
  if (variant === 1) batch.box('chrome', [.065, .055, .12], V(0, .79, -.04), .017);
  else batch.add(variant === 0 ? 'wood' : 'dark', new THREE.SphereGeometry(.035, 14, 10), V(0, .87, -.04));
  // The centre-mounted handbrake stays readable beside the driver's elbow.
  batch.box('dark', [.065, .038, .11], V(.06, .698, -.43), .009);
  batch.tube('dark', [V(.06, .70, -.45), V(.06, .75, -.34), V(.06, .785, -.18)], .024, 10);
  batch.box('chrome', [.032, .022, .023], V(.06, .785, -.168), .005);
  // Floor pedals visible from driver eye looking down.
  for(const [i,x]of(variant===1?[-.28,-.48]:[-.57,-.42,-.28]).entries()){
    const width=variant===1&&i===0?.108:.07;
    batch.box('chrome',[width,.014,.13],V(x,.49,.35),.006);
    for(let rib=0;rib<5;rib++)batch.box('dark',[width*.87,.004,.012],V(x,.5,.302+rib*.024),.002);
  }
  for (const side of [-1, 1]) {
    const x = side * .425;
    buildSculptedSeat(batch,x,variant);
    if (variant === 2) {
      batch.box('dark', [.22, .07, .025], V(x, 1.18, -.686), .018);
      batch.box('seam', [.08, .018, .027], V(x, 1.09, -.672), .005);
    } else {
      for (const dx of [-.13, .13]) batch.box('chrome', [.014, .13, .014], V(x + dx, 1.15, -.73));
      batch.box('leather', [variant === 1 ? .38 : .31, .15, .12], V(x, 1.205, -.73), .037);
      batch.tube('seam', [V(x - .12, 1.232, -.667), V(x, 1.249, -.667), V(x + .12, 1.232, -.667)], .0015, 16);
    }
    batch.box('dark', [.053, .09, .033], V(x - side * .27, .64, -.5), .008);
    batch.box('tail', [.032, .013, .028], V(x - side * .27, .69, -.5));
    batch.box('leather', [.055, .36, 1.23], V(side * .735, .72, -.17), .018);
    batch.tube('seam', [V(side * .701, .78, -.72), V(side * .701, .78, -.4), V(side * .701, .78, .34)], .0022, 20);
    batch.box(variant === 0 ? 'wood' : 'dark', [.055, .045, .4], V(side * .714, .71, -.11), .012);
    batch.box('chrome', [.022, .026, .11], V(side * .714, .86, .12), .006);
    batch.add('chrome', new THREE.CylinderGeometry(.018, .018, .026, 12), V(side * .717, .75, .27), new THREE.Euler(0, 0, Math.PI / 2));
  }
  // Folded canvas roof behind the two seats.
  batch.box('dark', [1.3, .12, .18], V(0, .98, -.93), .035);
  for (let i = 0; i < 4; i++) batch.tube('wood', [V(-.6, 1.045, -.875 - i * .035), V(0, 1.06, -.875 - i * .035), V(.6, 1.045, -.875 - i * .035)], .004, 18);
}

function buildWindshield(batch: GeometryBatch, variant: number) {
  const bottomY = 1.085, topY = variant === 2 ? 1.47 : 1.56, bottomZ = .72, topZ = variant === 0 ? .43 : variant === 1 ? .28 : .21;
  const corners = [V(-.73, bottomY, bottomZ), V(-.65, topY, topZ), V(.65, topY, topZ), V(.73, bottomY, bottomZ)];
  batch.add('glass', surface((u, v) => V(THREE.MathUtils.lerp(-.73 + .08 * v, .73 - .08 * v, u), THREE.MathUtils.lerp(bottomY, topY, v), THREE.MathUtils.lerp(bottomZ, topZ, v)), 12, 3));
  for (let i = 0; i < 4; i++) batch.tube(variant === 0 ? 'chrome' : 'dark', [corners[i], corners[(i + 1) % 4]], variant === 0 ? .018 : .025, 1);
  for (const side of [-1, 1]) {
    batch.tube('dark', [V(side * .45, 1.105, .705), V(side * .39, 1.12, .67), V(side * .27, 1.12, .67)], .006, 3);
    batch.tube('chrome', [V(side * .78, .99, .43), V(side * .94, 1.08, .43)], .014, 3);
    batch.add('paint', new THREE.SphereGeometry(1, 18, 12), V(side * .97, 1.095, .43), new THREE.Euler(), V(.1, .061, .075));
    batch.add('mirror', new THREE.CircleGeometry(.055, 22), V(side * .97, 1.095, .372), new THREE.Euler(0, Math.PI, 0), V(1.45, .85, 1));
  }
  batch.tube('chrome', [V(0, topY - .01, topZ), V(0, topY - .14, topZ - .06)], .007, 1);
  batch.box('dark', [.19, .065, .03], V(0, topY - .15, topZ - .07), .01);
  batch.box('mirror', [.16, .047, .006], V(0, topY - .15, topZ - .09), .007);
}

function createWheel(materials: MaterialKit, variant: number) {
  const wheel = new THREE.Group();
  const batch = new GeometryBatch(materials);
  batch.add('dark', new THREE.TorusGeometry(.272, .065, 12, 48), V(0, 0, 0), new THREE.Euler(0, Math.PI / 2, 0), V(1, 1, 1.65));
  for (const side of [-1, 1]) {
    const face = side * .098;
    batch.add('dark', new THREE.TorusGeometry(.213, .012, 5, 40), V(face, 0, 0), new THREE.Euler(0, Math.PI / 2, 0));
    batch.add('chrome', new THREE.TorusGeometry(.193, .017, 6, 40), V(face, 0, 0), new THREE.Euler(0, Math.PI / 2, 0));
    batch.add('chrome', new THREE.CylinderGeometry(.065, .065, .025, 20), V(side * .115, 0, 0), new THREE.Euler(0, 0, Math.PI / 2));
    const spokeCount = variant === 0 ? 24 : variant === 1 ? 10 : 5;
    for (let i = 0; i < spokeCount; i++) {
      const a = i / spokeCount * Math.PI * 2;
      const b = a + (variant === 0 ? .32 : .10) * side;
      batch.tube('chrome', [V(side * .12, Math.sin(a) * .047, Math.cos(a) * .047), V(face, Math.sin(b) * .185, Math.cos(b) * .185)], variant === 0 ? .0032 : variant === 1 ? .009 : .019, 1);
    }
    if (variant > 0) {
      batch.add('dark', new THREE.CylinderGeometry(.16, .16, .008, 28), V(side * .072, 0, 0), new THREE.Euler(0, 0, Math.PI / 2));
      batch.box('tail', [.035, .095, .05], V(side * .084, -.055, .1), .007);
    }
    batch.add('wood', new THREE.CylinderGeometry(.032, .032, .027, 16), V(side * .132, 0, 0), new THREE.Euler(0, 0, Math.PI / 2));
  }
  // Tread blocks create visible scale at low speed while sharing the tyre draw.
  for (let i = 0; i < 48; i++) {
    const a = i / 48 * Math.PI * 2;
    batch.add('dark', new THREE.BoxGeometry(.14, .006, .014), V(0, Math.cos(a) * .338, Math.sin(a) * .338), new THREE.Euler(a, 0, .12));
  }
  batch.finish(wheel);
  return wheel;
}

function gaugeTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 256;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#101a1c'; c.fillRect(0, 0, 512, 256);
  for (const [cx, label, maximum] of [[139, 'KM/H', 180], [383, 'RPM ×1000', 8]] as const) {
    c.fillStyle = '#172224'; c.beginPath(); c.arc(cx, 128, 108, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#d2c9aa'; c.lineWidth = 2;
    for (let i = 0; i <= 36; i++) {
      const a = Math.PI * .75 + i / 36 * Math.PI * 1.5;
      c.beginPath(); c.moveTo(cx + Math.cos(a) * 98, 128 + Math.sin(a) * 98); c.lineTo(cx + Math.cos(a) * (i % 4 === 0 ? 84 : 91), 128 + Math.sin(a) * (i % 4 === 0 ? 84 : 91)); c.stroke();
    }
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#eee3c9'; c.font = '17px sans-serif';
    for (let i = 0; i <= 9; i++) {
      const a = Math.PI * .75 + i / 9 * Math.PI * 1.5;
      c.fillText(String(Math.round(i / 9 * maximum)), cx + Math.cos(a) * 71, 128 + Math.sin(a) * 71);
    }
    c.font = '12px sans-serif'; c.fillStyle = '#b1b5a4'; c.fillText(label, cx, 160);
    c.font = '10px sans-serif'; c.fillText('COASTLINE', cx, 183);
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
  return texture;
}

function radioTexture(variant: number) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = variant === 0 ? 96 : 256;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#101c20'; c.fillRect(0, 0, 512, 256);
  if (variant === 0) {
    c.fillStyle = '#d0bc84'; c.font = '28px monospace'; c.textAlign = 'left';
    c.fillText('FM', 18, 34); c.textAlign = 'right'; c.font = '36px monospace'; c.fillText('88.6', 490, 36);
    c.strokeStyle = '#b8b085'; c.lineWidth = 2;
    for (let i = 0; i <= 32; i++) { const x = 25 + i * 14.5; c.beginPath(); c.moveTo(x, 50); c.lineTo(x, i % 4 === 0 ? 84 : 68); c.stroke(); }
    c.fillStyle = '#d47f45'; c.fillRect(43, 45, 4, 46);
    c.fillStyle = '#9caa93'; c.font = '22px monospace'; c.textAlign = 'center'; c.fillText('COAST FM', 240, 32);
  } else {
    c.fillStyle = '#8ca4a6'; c.font = '18px sans-serif'; c.fillText(variant === 1 ? 'TOURING' : 'SPORT', 22, 30);
    c.textAlign = 'right'; c.fillStyle = '#e0d8c0'; c.fillText('18:42', 490, 30); c.textAlign = 'left';
    c.strokeStyle = '#385056'; c.beginPath(); c.moveTo(20, 45); c.lineTo(492, 45); c.stroke();
    c.fillStyle = '#e5d4ab'; c.font = '600 32px sans-serif'; c.fillText('COAST FM', 22, 96);
    c.fillStyle = '#9eafb0'; c.font = '21px sans-serif'; c.fillText('Golden Hour', 23, 130);
    c.fillStyle = '#b8bdb2'; c.font = '18px sans-serif'; c.fillText('88.6 FM  ·  STEREO', 23, 170);
    c.fillStyle = '#65888c'; c.fillRect(306, 58, 186, 134);
    c.fillStyle = '#23383c'; c.beginPath(); c.moveTo(306, 58); c.lineTo(373, 58); c.bezierCurveTo(328, 103, 422, 129, 382, 192); c.lineTo(306, 192); c.closePath(); c.fill();
    c.strokeStyle = '#e4c98e'; c.lineWidth = 5; c.beginPath(); c.moveTo(335, 190); c.bezierCurveTo(402, 151, 333, 116, 362, 63); c.stroke();
    c.fillStyle = '#faf0cc'; c.beginPath(); c.moveTo(365, 116); c.lineTo(357, 139); c.lineTo(375, 135); c.closePath(); c.fill();
    c.fillStyle = '#aab8b3'; c.font = '16px sans-serif'; c.fillText('COAST ROAD', 316, 220);
    c.fillStyle = '#607b7e'; c.fillRect(24, 214, 6, 17); c.fillRect(36, 214, 6, 17);
    c.strokeStyle = '#607b7e'; c.lineWidth = 3; c.beginPath(); c.moveTo(60, 223); c.lineTo(264, 223); c.stroke();
    c.strokeStyle = '#c3b183'; c.beginPath(); c.moveTo(60, 223); c.lineTo(114, 223); c.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4; texture.name = 'vehicle-radio-display'; return texture;
}

export function createConvertible(index = 0): Convertible {
  index = THREE.MathUtils.euclideanModulo(Math.floor(index), CAR_DEFINITIONS.length);
  const { materials, textures: surfaceTextures } = materialKit(index);
  // Double-sided authored body skins remain visible from both the road and the open cockpit.
  materials.paint.side = THREE.DoubleSide;
  const root = new THREE.Group(); root.name = `convertible-${index}`;
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;
  const shadowContext=shadowCanvas.getContext('2d')!,gradient=shadowContext.createRadialGradient(64,64,20,64,64,64);
  gradient.addColorStop(0,'rgba(0,0,0,.72)');gradient.addColorStop(.6,'rgba(0,0,0,.45)');gradient.addColorStop(1,'rgba(0,0,0,0)');
  shadowContext.fillStyle=gradient;shadowContext.fillRect(0,0,128,128);
  const shadowMap=new THREE.CanvasTexture(shadowCanvas);surfaceTextures.push(shadowMap);
  const contactShadow=new THREE.Mesh(new THREE.PlaneGeometry(2.5,4.9),new THREE.MeshBasicMaterial({map:shadowMap,transparent:true,opacity:.46,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
  contactShadow.name='vehicle-contact-shadow';contactShadow.rotation.x=-Math.PI/2;contactShadow.position.y=.008;contactShadow.visible=false;root.add(contactShadow);
  const batch = new GeometryBatch(materials);
  buildBody(batch, index); buildCabin(batch, index); buildWindshield(batch, index); batch.finish(root);

  const wheelTemplate = createWheel(materials, index), rolls: THREE.Group[] = [], steers: THREE.Group[] = [];
  for (const z of [-1.28, 1.28]) for (const x of [-.845, .845]) {
    const steering = new THREE.Group(); steering.position.set(x, .338, z);
    const roll = wheelTemplate.clone(true); steering.add(roll); root.add(steering); rolls.push(roll);
    if (z > 0) steers.push(steering);
  }

  const steeringTilt = new THREE.Group(); steeringTilt.position.set(-.425, 1.015, .17); steeringTilt.rotation.x = -.31;
  const steering = new THREE.Group(); steering.name = 'steeringWheel'; steeringTilt.add(steering); root.add(steeringTilt);
  const wheelBatch = new GeometryBatch(materials);
  if(index===2){
    const rim=Array.from({length:65},(_,i)=>{const a=i/64*Math.PI*2;return V(Math.cos(a)*.15,Math.max(-.108,Math.sin(a)*.155),0);});
    wheelBatch.tube('dark',rim,.019,80);
  }else wheelBatch.add(index===0?'wood':'dark',new THREE.TorusGeometry(.156,index===0?.014:.019,10,56));
  if(index===0){
    wheelBatch.add('chrome',new THREE.TorusGeometry(.139,.004,5,48));
    for(let i=0;i<3;i++){const angle=Math.PI*.5+i/3*Math.PI*2;wheelBatch.tube('chrome',[V(Math.cos(angle)*.028,Math.sin(angle)*.028,-.002),V(Math.cos(angle)*.14,Math.sin(angle)*.14,0)],.011,1);}
    wheelBatch.add('dark',new THREE.CylinderGeometry(.035,.035,.025,22),V(0,0,-.012),new THREE.Euler(Math.PI/2,0,0));
  }else{
    wheelBatch.box('dark',[.112,.082,.038],V(0,0,-.01),.025);
    for(const side of[-1,1]){
      wheelBatch.tube('dark',[V(side*.042,.008,-.004),V(side*.092,.03,-.002),V(side*.139,.042,0)],.018,4);
      wheelBatch.box('dark',[.041,.025,.012],V(side*.088,.028,-.025),.006);
      for(let key=-1;key<=1;key++)wheelBatch.box('chrome',[.004,.005,.002],V(side*.088+key*.01,.028,-.032));
      wheelBatch.tube('chrome',[V(side*.046,-.015,-.025),V(side*.087,.006,-.023),V(side*.121,.018,-.018)],.0035,8);
      wheelBatch.box('chrome',[.021,.067,.008],V(side*.122,.03,.035),.006);
    }
    wheelBatch.tube('dark',[V(0,-.025,-.003),V(0,-.075,-.002),V(0,index===2?-.108:-.142,0)],.014,4);
  }
  wheelBatch.add('chrome', new THREE.CylinderGeometry(.02, .02, .027, 20), V(0, 0, -.02), new THREE.Euler(Math.PI / 2, 0, 0));
  wheelBatch.finish(steering);

  const texture = gaugeTexture();
  const dialMat = new THREE.MeshBasicMaterial({ map: texture });
  const dials = new THREE.Mesh(new THREE.PlaneGeometry(.49, .245), dialMat);
  // Read from -Z: texture plane is turned to face the seated driver.
  dials.position.set(-.41, 1.008, .452); dials.rotation.y = Math.PI; dials.name = 'instrumentCluster'; root.add(dials);
  const needleMat = new THREE.MeshBasicMaterial({ color: '#e0a14e' });
  const needles: THREE.Group[] = [];
  for (const x of [-.298, -.532]) {
    const pivot = new THREE.Group(); pivot.position.set(x, 1.008, .447);
    const needle = new THREE.Mesh(new THREE.BoxGeometry(.069, .003, .003), needleMat); needle.position.x = .024; pivot.add(needle); root.add(pivot); needles.push(pivot);
  }
  // Rings live on the instrument-facing plane, one merged static chrome draw.
  const instrumentBatch = new GeometryBatch(materials);
  for (const x of [-.298, -.532]) instrumentBatch.add('chrome', new THREE.TorusGeometry(.104, .005, 6, 40), V(x, 1.008, .448));
  instrumentBatch.finish(root);

  const radioMap = radioTexture(index);
  const radioMat = new THREE.MeshBasicMaterial({ map: radioMap, color: index === 0 ? 0xbfc6b1 : 0xbcc6bf, toneMapped: false });
  const radio = new THREE.Mesh(new THREE.PlaneGeometry(index === 0 ? .145 : .249, index === 0 ? .027 : .125), radioMat);
  radio.position.set(index === 0 ? 0 : .09, index === 0 ? .92 : .97, index === 0 ? .427 : .412);
  radio.rotation.y = Math.PI; radio.name = 'radio-display'; root.add(radio);

  const driver = createDriver(index);
  root.add(driver.root);

  let wheelRotation = 0;
  const cockpitEye = V(-.425, index === 2 ? 1.25 : 1.29, -.43), cockpitLook = V(-.425, index === 2 ? 1.2 : 1.23, 12);
  root.userData.vehicle = { name: CAR_DEFINITIONS[index].name, length: 4.4, width: 1.9, wheelbase: 2.56, wheelRadius: .338 };
  return {
    root, cockpitEye, cockpitLook,setContactShadow(visible){contactShadow.visible=visible;},
    update(speed, steer, dt) {
      driver.update(steer, dt);
      contactShadow.rotation.set(-Math.PI/2,0,-root.rotation.z,'ZXY');
      // Speed is metres/second and steer is normalized [-1,1].
      wheelRotation = (wheelRotation + speed * Math.min(dt, .1) / .338) % (Math.PI * 2);
      rolls.forEach(roll => { roll.rotation.x = wheelRotation; });
      steers.forEach(front => { front.rotation.y = steer * .47; });
      steering.rotation.z = steer * -2.2;
      const kmh = Math.min(Math.abs(speed) * 3.6, 180);
      needles[0].rotation.z = -Math.PI * .25 + kmh / 180 * Math.PI * 1.5;
      needles[1].rotation.z = -Math.PI * .25 + Math.min(1, .12 + Math.abs(speed) / 52) * Math.PI * 1.5;
    },
    dispose() {
      driver.dispose();
      const geometries = new Set<THREE.BufferGeometry>();
      const mats = new Set<THREE.Material>();
      root.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        geometries.add(object.geometry);
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => mats.add(m));
      });
      geometries.forEach(g => g.dispose()); mats.forEach(m => m.dispose()); texture.dispose(); radioMap.dispose(); surfaceTextures.forEach(t => t.dispose());
      root.removeFromParent();
    },
  };
}
