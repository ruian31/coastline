import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { coast, heightAt } from './roads';
import { createSeededRandom } from '../utils/random';

type Collider = { x: number; z: number; halfX: number; halfZ: number };
export function createLandmarks(scene: THREE.Scene, mobile: boolean,groundHeight:(x:number,z:number)=>number=heightAt): {
  update: (elapsed: number, carPosition: THREE.Vector3) => void;
  dispose: () => void;
  colliders: Collider[];
} {
  const root = new THREE.Group();root.name='Coastal destinations';scene.add(root);
  const random=createSeededRandom(99184),colliders:Collider[]=[];
  const materials:THREE.MeshStandardMaterial[]=[];
  const batches=new Map<THREE.Material,THREE.BufferGeometry[]>();
  const mat=(name:string,color:number,roughness=.85,metalness=0)=>{
    const material=new THREE.MeshStandardMaterial({name,color,roughness,metalness});materials.push(material);return material;
  };
  const walls=[mat('Warm ivory plaster',0xdacbb2),mat('Faded apricot plaster',0xc99878),mat('Ochre stucco',0xc5b280),mat('Pale coastal sage',0xa8b0a0)];
  const terracotta=mat('Weathered terracotta',0x9d5b41),roofEdges=mat('Warm roof seams',0x795141),stone=mat('Limestone lintels and paving',0xc0b59b);
  const wood=mat('Dark wood shutters and doors',0x365953),iron=mat('Painted railings and lamps',0x34423e,.55,.35),glass=mat('Quiet dark blue window panes',0x304c50,.28,.15);
  const cream=mat('Cream awning stripes',0xddd2b3),red=mat('Burnt red awning and lighthouse cap',0xa6503d),foliage=mat('Planter foliage',0x5f754f),pots=mat('Terracotta pots',0xaa6b51),white=mat('Lighthouse white plaster',0xe1ddd0);
  const tunnelMaterial=mat('Dim tunnel lining',0x3c4749,.97);tunnelMaterial.emissive.setHex(0x142023);tunnelMaterial.emissiveIntensity=.28;
  const rock=mat('Headland tunnel limestone',0x818478,.99);
  const paving=mat('Worn limestone pedestrian paving',0xaaa18b,.97);
  const tunnelShoulder=mat('Tunnel stone shoulder and drainage',0x4f5752,.98);
  const bulb=mat('Warm practical lamp lenses',0xffdf9b,.45);bulb.emissive.setHex(0xffbe62);bulb.emissiveIntensity=1.9;
  const signs:THREE.CanvasTexture[]=[];
  const surfaceTextures:THREE.CanvasTexture[]=[];
  // Tileable authored surface grain is shared by whole material roles.
  function surfaceTexture(kind:'plaster'|'limestone'|'tile'|'tunnel') {
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
    const ctx=canvas.getContext('2d')!,noise=createSeededRandom({plaster:413,limestone:701,tile:882,tunnel:509}[kind]);
    ctx.fillStyle=kind==='tunnel'?'#b8b9b3':kind==='tile'?'#d7c8bb':'#e6e2d8';ctx.fillRect(0,0,256,256);
    for(let i=0;i<190;i++) {
      const x=noise()*256,y=noise()*256,r=4+noise()*22;
      ctx.fillStyle=`rgba(${kind==='tile'?'94,62,42':'91,88,78'},${.012+noise()*.035})`;ctx.beginPath();ctx.ellipse(x,y,r,r*(.4+noise()),noise()*Math.PI,0,Math.PI*2);ctx.fill();
    }
    for(let i=0;i<11000;i++){const g=90+Math.floor(noise()*150);ctx.fillStyle=`rgba(${g},${g},${g},${kind==='plaster'?.1:.16})`;ctx.fillRect(noise()*256,noise()*256,1+noise()*1.6,1);}
    if(kind==='limestone'||kind==='tunnel') {
      const rows=kind==='tunnel'?4:5,cellH=256/rows;
      ctx.lineWidth=kind==='tunnel'?2:1.3;ctx.strokeStyle=kind==='tunnel'?'rgba(39,47,45,.25)':'rgba(82,78,64,.26)';
      for(let row=0;row<rows;row++) {
        const y=row*cellH;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(256,y);ctx.stroke();
        for(let col=-1;col<4;col++){const x=col*86+(row%2)*43;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+cellH);ctx.stroke();}
      }
    }
    const tex=new THREE.CanvasTexture(canvas);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;surfaceTextures.push(tex);return tex;
  }
  const plasterMap=surfaceTexture('plaster'),stoneMap=surfaceTexture('limestone'),roofMap=surfaceTexture('tile'),liningMap=surfaceTexture('tunnel');
  for(const wall of walls){wall.map=plasterMap;wall.bumpMap=plasterMap;wall.bumpScale=.025;wall.roughnessMap=plasterMap;}
  stone.map=stoneMap;stone.bumpMap=stoneMap;stone.bumpScale=.025;
  paving.map=stoneMap;paving.bumpMap=stoneMap;paving.bumpScale=.035;
  terracotta.map=roofMap;terracotta.bumpMap=roofMap;terracotta.bumpScale=.035;
  tunnelMaterial.map=liningMap;tunnelMaterial.bumpMap=liningMap;tunnelMaterial.bumpScale=.055;tunnelMaterial.roughnessMap=liningMap;
  tunnelShoulder.map=stoneMap;tunnelShoulder.bumpMap=stoneMap;tunnelShoulder.bumpScale=.03;
  function add(geometry:THREE.BufferGeometry,material:THREE.Material,transform:THREE.Matrix4=new THREE.Matrix4()) {
    const simple=geometry.index?geometry.toNonIndexed():geometry.clone();geometry.dispose();
    if(!simple.getAttribute('uv')){const p=simple.getAttribute('position'),uv:number[]=[];for(let i=0;i<p.count;i++)uv.push(p.getX(i)*.35,(p.getZ(i)+p.getY(i))*.35);simple.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));}
    simple.deleteAttribute('color');simple.applyMatrix4(transform);
    if(transform.determinant()<0){for(const key of ['position','normal','uv']){const a=simple.getAttribute(key);if(!a)continue;const size=a.itemSize;for(let i=0;i<a.count;i+=3)for(let c=0;c<size;c++){const value=a.array[(i+1)*size+c];a.array[(i+1)*size+c]=a.array[(i+2)*size+c];a.array[(i+2)*size+c]=value;}}simple.computeVertexNormals();}
    if(!batches.has(material))batches.set(material,[]);batches.get(material)!.push(simple);
  }
  const local=(x:number,y:number,z:number,ry=0)=>new THREE.Matrix4().makeRotationY(ry).setPosition(x,y,z);
  function box(parent:THREE.Matrix4,material:THREE.Material,x:number,y:number,z:number,w:number,h:number,d:number,ry=0) {
    add(new THREE.BoxGeometry(w,h,d),material,parent.clone().multiply(local(x,y,z,ry)));
  }
  function cylinder(parent:THREE.Matrix4,material:THREE.Material,x:number,y:number,z:number,r1:number,r2:number,h:number,segments=10) {
    add(new THREE.CylinderGeometry(r1,r2,h,segments),material,parent.clone().multiply(local(x,y,z)));
  }
  function sphere(parent:THREE.Matrix4,material:THREE.Material,x:number,y:number,z:number,sx:number,sy:number,sz:number) {
    add(new THREE.IcosahedronGeometry(1,1),material,parent.clone().multiply(local(x,y,z)).scale(new THREE.Vector3(sx,sy,sz)));
  }
  function routeFrame(t:number,side:number,offset:number,yOffset=0):THREE.Matrix4 {
    const s=coast.sample(t),p=s.position.clone().addScaledVector(s.right,side*offset);p.y+=yOffset;
    const direction=s.tangent.clone();direction.y=0;direction.normalize();
    return new THREE.Matrix4().makeBasis(direction,new THREE.Vector3(0,1,0),s.right).setPosition(p);
  }
  function collider(frame:THREE.Matrix4,w:number,d:number) {
    const p=new THREE.Vector3().setFromMatrixPosition(frame),e=frame.elements;
    colliders.push({x:p.x,z:p.z,halfX:Math.abs(e[0])*w/2+Math.abs(e[8])*d/2,halfZ:Math.abs(e[2])*w/2+Math.abs(e[10])*d/2});
  }
  function planter(frame:THREE.Matrix4,x:number,y:number,z:number,size=.65) {
    cylinder(frame,pots,x,y+size*.4,z,size*.43,size*.29,size*.8,8);
    sphere(frame,foliage,x,y+size*.95,z,size*.65,size*.58,size*.65);
  }
  function bench(frame:THREE.Matrix4,x:number,y:number,z:number) {
    box(frame,wood,x,y+.52,z,2.8,.14,.7);box(frame,wood,x,y+1.02,z+.29,2.8,.72,.12);
    for(const side of [-1,1]){box(frame,iron,x+side*1.05,y+.26,z,.12,.52,.65);box(frame,iron,x+side*1.05,y+.88,z+.3,.10,1.2,.10);}
  }
  function lamp(frame:THREE.Matrix4,x:number,z:number) {
    cylinder(frame,iron,x,2.1,z,.055,.075,4.2,7);cylinder(frame,iron,x,.16,z,.17,.21,.32,8);
    box(frame,iron,x,4.3,z,.55,.09,.55);box(frame,bulb,x,4.03,z,.32,.44,.32);
    cylinder(frame,iron,x,4.5,z,.05,.38,.34,4);
  }
  function sign(frame:THREE.Matrix4,text:string,x:number,y:number,z:number,width:number,face:number) {
    box(frame,wood,x,y,z,width+.16,.8,.13);
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
    const ctx=canvas.getContext('2d')!;ctx.fillStyle='#e4d7b8';ctx.fillRect(0,0,512,128);
    ctx.strokeStyle='#5b6859';ctx.lineWidth=4;ctx.strokeRect(9,9,494,110);
    ctx.fillStyle='#3d544c';ctx.font='600 35px Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,67);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=2;signs.push(texture);
    const material=new THREE.MeshStandardMaterial({map:texture,roughness:.9});materials.push(material);
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,.67),material);mesh.matrixAutoUpdate=false;
    mesh.matrix.copy(frame).multiply(local(x,y,z+face*.076,face>0?0:Math.PI));root.add(mesh);
  }
  function roofGeometry(w:number,d:number,h:number):THREE.BufferGeometry {
    const p=[[-w/2,0,-d/2],[w/2,0,-d/2],[-w/2,h,0],[w/2,h,0],[-w/2,0,d/2],[w/2,0,d/2]];
    const vertices:number[]=[];for(const indices of [[0,2,1],[1,2,3],[2,4,3],[3,4,5],[0,4,2],[1,3,5],[0,1,4],[1,5,4]])for(const i of indices)vertices.push(...p[i]);
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();return g;
  }
  function pavedBand(start:number,end:number,lo:number,hi:number,material:THREE.Material,terrain:boolean,lift:number,segments=60) {
    const p:number[]=[],uv:number[]=[],indices:number[]=[];
    for(let i=0;i<=segments;i++) {
      const t=THREE.MathUtils.lerp(start,end,i/segments),s=coast.sample(t);
      for(const offset of [lo,hi]) {
        const point=s.position.clone().addScaledVector(s.right,offset);
        point.y=(terrain?Math.max(s.position.y,heightAt(point.x,point.z)):s.position.y)+lift;
        p.push(point.x,point.y,point.z);uv.push(offset/2.2,(t-start)*coast.length/2.2);
      }
      if(i<segments){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();add(g,material);
  }
  function roofTiles(frame:THREE.Matrix4,w:number,d:number,roofY:number,h:number) {
    const count=Math.ceil(w/.49),r=.047;
    for(const side of [-1,1]) {
      const direction=new THREE.Vector3(0,-h,side*d/2),length=direction.length();
      const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
      for(let i=0;i<=count;i++) {
        const x=-w/2+i*w/count;
        const transform=new THREE.Matrix4().compose(new THREE.Vector3(x,roofY+h/2+.025,side*d/4),q,new THREE.Vector3(1,1,1));
        add(new THREE.CylinderGeometry(r,r,length,6,1,true),roofEdges,frame.clone().multiply(transform));
      }
      // Overlap lines interrupt each barrel into individual courses.
      for(let row=1;row<Math.ceil(d/1.1);row++) {
        const z=side*row*.55;if(Math.abs(z)>=d/2)continue;
        box(frame,roofEdges,0,roofY+h*(1-Math.abs(z)/(d/2))+.024,z,w,.026,.022);
      }
      box(frame,roofEdges,0,roofY-.04,side*d/2,w+.12,.18,.13);
    }
    const ridge=new THREE.Matrix4().makeRotationZ(Math.PI/2).setPosition(0,roofY+h+.055,0);
    add(new THREE.CylinderGeometry(.09,.09,w+.12,8,1,true),terracotta,frame.clone().multiply(ridge));
  }

  // Continuous paving grounds the village as a street rather than houses in a field.
  for(const side of [-1,1]) {
    const offsets=[side*5.02,side*12.7].sort((a,b)=>a-b);
    pavedBand(.328,.423,offsets[0],offsets[1],paving,true,.115,76);
    const n=74,step=(.423-.328)*coast.length/n;
    for(let i=0;i<n;i++) {
      const t=.328+(.423-.328)*(i+.5)/n,s=coast.sample(t),frame=routeFrame(t,side,5.08);
      const p=new THREE.Vector3().setFromMatrixPosition(frame);frame.elements[13]=Math.max(s.position.y,heightAt(p.x,p.z))+.055;
      box(frame,stone,0,0,0,step-.035,.23,.25);
      if(i%7===0)box(frame,iron,0,.13,side*.12,.58,.018,.33);
    }
  }

  // A compact waterfront quarter: two street fronts, human-scale shop details, and open road.
  const shops=['CAFFÈ MARINA','CASA AZZURRA','BOTTEGA DEL MARE','PENSIONE SOLE'];
  const houses=mobile?12:16;
  for(let i=0;i<houses;i++) {
    const row=Math.floor(i/2),side=i%2===0?-1:1,t=.337+row*.0105;
    const width=8.2+random()*2.2,depth=6.6+random()*2,height=i%5===0?6.6:8+random()*2;
    const frame=routeFrame(t,side,12+depth/2),pos=new THREE.Vector3().setFromMatrixPosition(frame);
    const base=Math.max(coast.sample(t).position.y-.22,groundHeight(pos.x,pos.z)-.6);
    frame.elements[13]=base;const facade=-side,front=facade*(depth/2+.06);
    box(frame,walls[i%walls.length],0,height/2,0,width,height,depth);
    // A sunk plinth prevents gaps where the sloped terrain meets the building.
    box(frame,stone,0,-.7,0,width+.16,1.5,depth+.16);box(frame,stone,0,.16,front,width+.28,.30,.24);
    add(roofGeometry(width+.8,depth+.8,1.35),terracotta,frame.clone().multiply(local(0,height+.08,0)));
    roofTiles(frame,width+.8,depth+.8,height+.08,1.35);
    box(frame,roofEdges,0,height+.04,facade*(depth/2+.4),width+.9,.18,.16);
    for(let tile=0;tile<Math.ceil(width/.6);tile++) {
      const x=-width/2+tile*.6;box(frame,roofEdges,x,height+.09,facade*(depth/2+.24),.045,.08,.33);
    }
    box(frame,walls[i%walls.length],width*.27,height+1.10,-depth*.18,.68,1.8,.66);box(frame,stone,width*.27,height+2.03,-depth*.18,.88,.16,.84);
    box(frame,wood,-width*.25,1.32,front,.98,2.4,.17);box(frame,stone,-width*.25,2.59,front,1.25,.16,.26);
    cylinder(frame,iron,-width*.25+.32,1.27,front+facade*.12,.045,.045,.11,6);
    for(const floor of [0,1])for(const col of [-1,1]) {
      const x=col*width*.26+(floor===0?width*.08:0),y=floor===0?2.05:height*.68;
      if(floor===0&&col===-1)continue;
      box(frame,stone,x,y,front,1.65,2.0,.15);box(frame,glass,x,y,front+facade*.09,1.36,1.72,.10);
      // Raised perimeter and shadowed reveal place the glazing behind a real frame.
      for(const edge of [-1,1])box(frame,stone,x+edge*.75,y,front+facade*.17,.12,1.94,.23);
      for(const edge of [-1,1])box(frame,stone,x,y+edge*.92,front+facade*.17,1.58,.11,.23);
      box(frame,wood,x,y,front+facade*.17,.07,1.74,.07);box(frame,wood,x,y,front+facade*.17,1.38,.06,.07);
      if(i%3===1)for(const curtain of [-1,1])box(frame,cream,x+curtain*.48,y,front+facade*.155,.19,1.59,.018);
      for(const shutter of [-1,1]) {
        box(frame,wood,x+shutter*1.04,y,front+facade*.12,.48,1.78,.12);
        for(let slat=0;slat<6;slat++)box(frame,iron,x+shutter*1.04,y-.65+slat*.25,front+facade*.19,.40,.045,.04);
      }
      box(frame,stone,x,y-1.05,front+facade*.13,1.9,.16,.40);
      if(floor===1&&col===1&&i%2===0){box(frame,pots,x,y-1.03,front+facade*.43,1.35,.26,.35);for(const dx of [-.4,0,.4])sphere(frame,foliage,x+dx,y-.83,front+facade*.44,.23,.19,.23);}
    }
    if(i%3===0) {
      const z=front+facade*.75,y=height*.68-1.1;
      box(frame,stone,0,y,z,width*.68,.18,1.4);
      box(frame,iron,0,y+.98,z+facade*.64,width*.68,.065,.065);
      for(let rail=0;rail<9;rail++)box(frame,iron,-width*.32+rail*width*.08,y+.55,z+facade*.64,.045,.84,.045);
      for(const x of [-width*.28,width*.28])planter(frame,x,y+.1,z,.55);
    }
    if(i%4===0) {
      const z=front+facade*.9;
      for(let stripe=0;stripe<8;stripe++)box(frame,stripe%2?red:cream,width*.1-2+stripe*.55,3.2,z,.55,.12,1.8);
      box(frame,red,width*.1,2.99,z+facade*.86,4.4,.35,.1);
      sign(frame,shops[(i/4)%shops.length],width*.1,3.96,front+facade*.15,Math.min(width*.72,5.3),facade);
    }
    planter(frame,width*.39,0,front+facade*.6,.78);
    // Rainwater hardware and coarse corner stones break the blank end elevations.
    const pipe=frame.clone().multiply(local(width/2-.12,0,front+facade*.16));
    cylinder(pipe,iron,0,height/2,0,.035,.035,height,7);
    for(let course=0;course<Math.floor(height/1.1);course++) {
      box(frame,stone,-width/2+.035,.45+course*1.1,front,.10,.23,.48);
      box(frame,stone,width/2-.035,.45+course*1.1,front,.10,.23,.48);
    }
    // Return-wall windows make the nearest side walls read as occupied buildings.
    for(const wallSide of [-1,1])for(const floorY of [2.1,height*.69]) {
      box(frame,stone,wallSide*(width/2+.035),floorY,0,.16,1.75,1.5);
      box(frame,glass,wallSide*(width/2+.13),floorY,0,.08,1.48,1.24);
      box(frame,wood,wallSide*(width/2+.18),floorY,0,.04,1.53,.045);
      box(frame,wood,wallSide*(width/2+.18),floorY,0,.04,.055,1.25);
      box(frame,stone,wallSide*(width/2+.15),floorY-.92,0,.4,.13,1.7);
    }
    box(frame,stone,-width*.25,.12,front+facade*.47,1.9,.24,.9);
    collider(frame,width,depth);
    const street=routeFrame(t,side,7.8);lamp(street,0,0);
    if(i%4===1)bench(street,0,0,side*.8);
    if(i%4===0){const terrace=routeFrame(t,side,10.4);cylinder(terrace,stone,2.4,.74,0,.57,.57,.09,12);cylinder(terrace,iron,2.4,.38,0,.045,.08,.72,7);for(const dir of [-1,1]){box(terrace,wood,2.4+dir*.8,.43,0,.5,.08,.5);box(terrace,wood,2.4+dir*.99,.75,0,.08,.65,.5);for(const dz of [-.2,.2])box(terrace,iron,2.4+dir*.8,.2,dz,.06,.4,.06);}}
  }

  // Curved, closed stone shell: continuous geometry follows the same route as the car.
  const tunnelStart=.68,tunnelEnd=.735,segments=mobile?36:54,arcSteps=32;
  function tunnelPoint(t:number,theta:number,radius:number,height:number):THREE.Vector3 {
    const s=coast.sample(t);return s.position.clone().addScaledVector(s.right,Math.cos(theta)*radius).add(new THREE.Vector3(0,Math.sin(theta)*height-.08,0));
  }
  function tunnelSurface(inner:boolean):THREE.BufferGeometry {
    const vertices:number[]=[],uv:number[]=[],indices:number[]=[],radius=inner?6.4:7.2,height=inner?6.6:7.45;
    for(let segment=0;segment<=segments;segment++)for(let arc=0;arc<=arcSteps;arc++) {
      const t=tunnelStart+(tunnelEnd-tunnelStart)*segment/segments,a=arc/arcSteps*Math.PI;
      const p=tunnelPoint(t,a,radius,height);vertices.push(p.x,p.y,p.z);uv.push(segment/segments*(tunnelEnd-tunnelStart)*coast.length/5,arc/arcSteps*4);
      if(segment<segments&&arc<arcSteps){const k=segment*(arcSteps+1)+arc,n=k+arcSteps+1;indices.push(...(inner?[k,k+1,n,n,k+1,n+1]:[k,n,k+1,n,n+1,k+1]));}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
  }
  tunnelMaterial.side=THREE.DoubleSide;rock.side=THREE.DoubleSide;
  add(tunnelSurface(true),tunnelMaterial);add(tunnelSurface(false),rock);
  for(const side of [-1,1]) {
    const range=[side*4.66,side*6.54].sort((a,b)=>a-b);
    pavedBand(tunnelStart,tunnelEnd,range[0],range[1],tunnelShoulder,true,.065,58);
    const drain=[side*4.96,side*5.12].sort((a,b)=>a-b);
    pavedBand(tunnelStart,tunnelEnd,drain[0],drain[1],iron,true,.078,58);
  }
  // Expansion joints and drain gratings are aligned to the curve, not world axes.
  const tunnelLength=(tunnelEnd-tunnelStart)*coast.length;
  for(let i=0;i<=18;i++) {
    const t=THREE.MathUtils.lerp(tunnelStart,tunnelEnd,i/18),frame=routeFrame(t,1,0);
    for(const side of [-1,1]) {
      const p=coast.sample(t).position.clone().addScaledVector(coast.sample(t).right,side*5.2);
      const y=Math.max(0,heightAt(p.x,p.z)-coast.sample(t).position.y);
      box(frame,tunnelShoulder,0,y+.19,side*6.04,tunnelLength/18+.05,.28,.4);
      box(frame,bulb,0,y+.14,side*5.72,.12,.10,.075);
      for(let slot=0;slot<4;slot++)box(frame,tunnelMaterial,-.17+slot*.11,y+.087,side*5.04,.035,.012,.17);
    }
    if(i%2===0) {
      const points=Array.from({length:33},(_,j)=>tunnelPoint(t,j/32*Math.PI,6.375,6.57));
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),32,.024,4,false),iron);
    }
  }
  // Thick portal rims close the inner/outer shell ends and make the opening legible.
  for(const t of [tunnelStart,tunnelEnd]) {
    const portal=routeFrame(t,1,0),portalVertices:number[]=[];
    for(let j=0;j<arcSteps;j++) {
      const a=j/arcSteps*Math.PI,b=(j+1)/arcSteps*Math.PI;
      const p=[[Math.cos(a)*6.37,Math.sin(a)*6.57,0],[Math.cos(a)*7.55,Math.sin(a)*7.8,0],[Math.cos(b)*6.37,Math.sin(b)*6.57,0],[Math.cos(b)*7.55,Math.sin(b)*7.8,0]];
      for(const i of [0,1,2,1,3,2])portalVertices.push(...p[i]);
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(portalVertices,3));g.computeVertexNormals();
    // Portal local X follows the road lateral axis, local Z follows the road direction.
    const s=coast.sample(t),frame=new THREE.Matrix4().makeBasis(s.right,new THREE.Vector3(0,1,0),s.tangent.clone().negate()).setPosition(s.position);
    add(g,stone,frame);
    box(portal,stone,0,7.75,0,.8,.32,15.1);
  }
  for(let i=0;i<=12;i++) {
    const t=tunnelStart+(tunnelEnd-tunnelStart)*i/12,frame=routeFrame(t,1,0);
    for(const side of [-1,1]) {
      box(frame,iron,0,3.65,side*5.15,.65,.55,.13);box(frame,bulb,0,3.65,side*5.06,.44,.27,.12);
      sphere(frame,rock,0,3.1,side*9.9,5.4,5.3,3.15);
    }
    sphere(frame,rock,0,10.9,0,5.6,3.25,10.1);
    // Narrow longitudinal ceiling fixture, readable while the environment is shadowed.
    box(frame,iron,0,6.37,0,1.3,.10,.28);box(frame,bulb,0,6.29,0,.95,.06,.15);
  }

  // Lighthouse cape: contrasting bands, glazing, gallery and a red conical lantern roof.
  const lighthouseFrame=routeFrame(.88,1,26),lighthousePosition=new THREE.Vector3().setFromMatrixPosition(lighthouseFrame);
  lighthouseFrame.elements[13]=Math.max(heightAt(lighthousePosition.x,lighthousePosition.z),-.2);
  cylinder(lighthouseFrame,stone,0,.25,0,5.2,5.5,.5,24);
  cylinder(lighthouseFrame,white,0,7.1,0,2.0,2.65,14,20);
  for(const y of [4.3,9.5])cylinder(lighthouseFrame,red,0,y,0,2.66-(y/14)*.65,2.66-((y-1.3)/14)*.65,1.3,20);
  cylinder(lighthouseFrame,stone,0,14.35,0,3,3.12,.35,24);
  cylinder(lighthouseFrame,glass,0,15.55,0,1.85,1.85,2.0,16);
  cylinder(lighthouseFrame,red,0,17.3,0,0,2.55,1.65,20);
  cylinder(lighthouseFrame,iron,0,18.5,0,.055,.055,1.5,8);
  cylinder(lighthouseFrame,bulb,0,15.55,0,.45,.45,.75,12);
  for(let i=0;i<16;i++) {
    const a=i/16*Math.PI*2;box(lighthouseFrame,iron,Math.cos(a)*2.7,14.98,Math.sin(a)*2.7,.055,1.0,.055);
    if(i%2===0)box(lighthouseFrame,iron,Math.cos(a)*1.85,15.55,Math.sin(a)*1.85,.07,2.1,.07);
  }
  add(new THREE.TorusGeometry(2.7,.045,4,32),iron,lighthouseFrame.clone().multiply(local(0,15.5,0)).multiply(new THREE.Matrix4().makeRotationX(Math.PI/2)));
  box(lighthouseFrame,wood,0,1.25,2.62,1.2,2.4,.15);
  for(const y of [5.8,10.8])box(lighthouseFrame,glass,0,y,2.45-y*.035,.65,1.35,.12);
  collider(lighthouseFrame,6,6);

  function supportTerrace(frame:THREE.Matrix4,width:number,depth:number){
    for(const z of[-depth/2+.45,depth/2-.45])for(let x=-width/2+.6;x<width/2;x+=3.2){
      const world=new THREE.Vector3(x,0,z).applyMatrix4(frame),height=Math.max(.5,world.y-groundHeight(world.x,world.z)+.5);
      box(frame,stone,x,-height/2-.16,z,.6,height,.65);
    }
    const connectorLength=depth===11?6.8:8.5,connectorZ=-depth/2-connectorLength/2+.2;
    box(frame,stone,0,-.15,connectorZ,2.5,.3,connectorLength);
    for(const x of[-.95,.95]){const world=new THREE.Vector3(x,0,connectorZ).applyMatrix4(frame),height=Math.max(.5,world.y-groundHeight(world.x,world.z)+.5);box(frame,stone,x,-height/2-.16,connectorZ,.35,height,.4);}
  }
  // Sunset viewpoint: terrace, rail, benches and a small interpretive sign.
  const viewpoint=routeFrame(.04,1,17);
  box(viewpoint,stone,0,-.12,0,18,.4,11);supportTerrace(viewpoint,18,11);
  for(let i=0;i<10;i++)box(viewpoint,iron,-8.5+i*1.9,.65,5.2,.07,1.3,.07);
  box(viewpoint,iron,0,1.27,5.2,18,.07,.07);
  bench(viewpoint,-4,0,1);bench(viewpoint,4,0,1);
  planter(viewpoint,-7,0,-3,1.1);planter(viewpoint,7,0,-3,1.1);
  sign(viewpoint,'PUNTA DEL SOLE',0,1.35,4.8,3.6,-1);

  // Palm bay has a quiet waterfront rest stop, rather than another large building.
  const bay=routeFrame(.18,1,18);
  box(bay,stone,0,-.13,0,13,.35,8);supportTerrace(bay,13,8);
  bench(bay,-3,0,1);bench(bay,3,0,1);lamp(bay,-5,-2);
  for(const x of [-5,5])planter(bay,x,0,2,1);
  cylinder(bay,wood,0,1.6,-1,.06,.07,3.2,8);
  const umbrella=new THREE.ConeGeometry(2.7,.8,10);add(umbrella,cream,bay.clone().multiply(local(0,3.5,-1)));

  // Merge all opaque pieces by material, preserving individual sign textures only.
  for(const [material,geometries] of batches) {
    const geometry=mergeGeometries(geometries,false);
    for(const g of geometries)g.dispose();
    if(!geometry)continue;
    const mesh=new THREE.Mesh(geometry,material);mesh.name=material.name;mesh.receiveShadow=true;
    mesh.castShadow=material===rock||material===tunnelMaterial||walls.includes(material as THREE.MeshStandardMaterial);
    root.add(mesh);
  }
  root.userData.tunnel={start:tunnelStart,end:tunnelEnd,interiorHalfWidth:6.4,interiorHeight:6.6};
  const meshes:THREE.Mesh[]=[];root.traverse(obj=>{if(obj instanceof THREE.Mesh)meshes.push(obj);});
  root.userData.diagnostics={draws:meshes.length,triangles:meshes.reduce((sum,mesh)=>sum+(mesh.geometry.index?mesh.geometry.index.count:mesh.geometry.getAttribute('position').count)/3,0)};
  return {
    update(_elapsed,_carPosition) {},
    dispose() {
      root.removeFromParent();root.traverse(object=>{if(object instanceof THREE.Mesh)object.geometry.dispose();});
      for(const material of materials)material.dispose();for(const texture of [...signs,...surfaceTextures])texture.dispose();
    },
    colliders,
  };
}
