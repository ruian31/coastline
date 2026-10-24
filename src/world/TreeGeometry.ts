import * as THREE from 'three';
import {createSeededRandom} from '../utils/random';

/** Staggered young/old fronds form a crown volume, not one umbrella of lines.
 * Both LODs keep the same rachis scaffold; nearby leaflets have a folded ridge. */
export function createPalmCrown(mobile:boolean,distant=false):THREE.BufferGeometry {
 const random=createSeededRandom(864212),positions:number[]=[],colors:number[]=[];
 const crown=new THREE.Vector3(.65,7.8,0),fronds=mobile?14:18,leaflets=distant?(mobile?5:8):mobile?9:17;
 function triangle(a:THREE.Vector3,b:THREE.Vector3,c:THREE.Vector3,tint:number,dry=0){
  for(const v of[a,b,c]){positions.push(v.x,v.y,v.z);colors.push((.39+dry*.15)*tint,(.53-dry*.10)*tint,(.22-dry*.035)*tint);}
 }
 for(let frond=0;frond<fronds;frond++){
  // Phyllotaxis and different ages break the repeated, evenly spaced curtain.
  // This stream authors fronds only; leaflet detail cannot move the far crown.
  const tier=frond%3,angle=frond*2.399963+random()*.21,dir=new THREE.Vector3(Math.cos(angle),0,Math.sin(angle)),side=new THREE.Vector3(-dir.z,0,dir.x);
  const length=[4.25,3.95,3.1][tier]+random()*.55,arch=[.55,.7,.75][tier]+random()*.3,droop=[2.4,1.35,.6][tier]+random()*.4,sweep=(random()-.5)*.65,dry=tier===0?.30+random()*.28:random()*.1;
  const leafRandom=createSeededRandom(864213+frond*73);
  // Every petiole grows from the actual trunk tip. Younger fronds rise while
  // old outer fronds hang down, rather than raising disconnected tier roots.
  const center=(t:number)=>crown.clone().addScaledVector(dir,t*length).addScaledVector(side,Math.sin(t*Math.PI)*sweep).add(new THREE.Vector3(0,Math.sin(t*Math.PI)*arch+t*[0,.6,1.8][tier]-t*t*droop,0));
  for(let segment=0;segment<(distant?4:6);segment++){
   const t=segment/(distant?4:6),u=(segment+1)/(distant?4:6),a=center(t),b=center(u),width=.052*(1-t)*.9+.006,tipWidth=.052*(1-u)*.9+.006;
   const left=a.clone().addScaledVector(side,width),right=a.clone().addScaledVector(side,-width),endLeft=b.clone().addScaledVector(side,tipWidth),endRight=b.clone().addScaledVector(side,-tipWidth);
   triangle(left,right,endLeft,.82,dry);triangle(right,endRight,endLeft,.82,dry);
  }
  for(let leaf=0;leaf<leaflets;leaf++){
   const t=.13+(leaf+(leafRandom()-.5)*.25)/leaflets*.79,span=Math.pow(Math.sin(t*Math.PI),.65)*(.78+leafRandom()*.26);
   for(const sign of[-1,1]){
    const a=center(t+sign*.012),tip=center(Math.min(1,t+.07+t*.12)).addScaledVector(side,sign*span);tip.y-=.12+span*(.24+leafRandom()*.25);
    const middle=a.clone().lerp(tip,.52);middle.y+=.11+leafRandom()*.07;
    const blade=(.04+Math.sin(t*Math.PI)*.035)*(distant?1.3:1),tint=.76+leafRandom()*.24;
    const left=middle.clone().addScaledVector(dir,blade),right=middle.clone().addScaledVector(dir,-blade);
    if(distant){triangle(a,left,right,tint,dry);triangle(left,tip,right,tint*.94,dry);}
    else{
     const ridge=middle.clone();ridge.y+=.027;
     triangle(a,left,ridge,tint,dry);triangle(a,ridge,right,tint*.94,dry);
     triangle(left,tip,ridge,tint,dry);triangle(ridge,tip,right,tint*.94,dry);
    }
   }
  }
 }
 // A few unfurled upright leaves give the crown a living, asymmetric centre.
 for(let spear=0;spear<3;spear++){
  const a=spear*2.399,side=new THREE.Vector3(Math.cos(a),0,Math.sin(a));
  const tip=crown.clone().addScaledVector(side,.55).add(new THREE.Vector3(0,1.8+spear*.12,0));
  const left=crown.clone().addScaledVector(side,.07),right=crown.clone().addScaledVector(side,-.07),ridge=crown.clone().lerp(tip,.5).add(new THREE.Vector3(-side.z*.07,0,side.x*.07));
  triangle(left,right,ridge,.86);triangle(left,ridge,tip,.86);triangle(ridge,right,tip,.8);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();return geometry;
}

/** One local atlas serves needle sprays and the opaque branch swatch. */
export function createPineNeedleAtlas():THREE.CanvasTexture {
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
 const context=canvas.getContext('2d')!,random=createSeededRandom(86275);
 context.lineCap='round';
 const stroke=(points:number[],color:string,width:number)=>{
  context.strokeStyle=color;context.lineWidth=width;context.beginPath();context.moveTo(points[0],points[1]);
  for(let i=2;i<points.length;i+=2)context.lineTo(points[i],points[i+1]);context.stroke();
 };
 for(let tile=0;tile<3;tile++){
  context.save();context.translate(tile%2*256,Math.floor(tile/2)*256);
  // Forked woody spray with uneven bundles of long, fine needles. Empty space
  // between the needles survives alpha testing instead of forming a solid blob.
  const stem=(t:number)=>new THREE.Vector2(125+Math.sin(t*5+tile)*9,239-t*195);
  for(let branch=0;branch<11;branch++){
   const t=.10+branch*.072,base=stem(t);
   for(const sign of[-1,1]){
    const length=(30+Math.sin(t*Math.PI)*48)*( .85+random()*.25),end=base.clone().add(new THREE.Vector2(sign*length,-24-random()*23));
    stroke([base.x,base.y,end.x,end.y],'#70684b',1.8);
    for(let bundle=0;bundle<9;bundle++){
     const at=base.clone().lerp(end,.16+bundle*.092),fan=sign*(.3+random()*.5)-Math.PI/2;
     for(let needle=0;needle<5;needle++){
      const angle=fan+(needle-2)*.23+(random()-.5)*.14,l=(17+random()*19)*(1-t*.25),tip=at.clone().add(new THREE.Vector2(Math.cos(angle)*l,Math.sin(angle)*l));
      const shade=88+Math.floor(random()*43),green=shade+14+Math.floor(random()*12),blue=shade-21;
      stroke([at.x,at.y,(at.x+tip.x)*.5+sign*2,(at.y+tip.y)*.5,tip.x,tip.y],`rgb(${shade},${green},${blue})`,1.15+random()*.65);
     }
    }
   }
  }
  for(let i=0;i<10;i++){const a=stem(i/10),b=stem((i+1)/10);stroke([a.x,a.y,b.x,b.y],'#807154',2.8-i*.16);}
  context.restore();
 }
 context.fillStyle='#91816b';context.fillRect(258,258,254,254);
 const texture=new THREE.CanvasTexture(canvas);texture.name='Coastal pine needle sprays and branch atlas';texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
 // Ordinary mip averaging erases thin needles before they reach either the
 // color cutoff or the shadow renderer's .5 cutoff. Preserve each spray tile's
 // base alpha coverage independently; never mix it with the opaque wood tile.
 const base=context.getImageData(0,0,512,512).data,coverage:number[]=[];
 for(let tile=0;tile<3;tile++){
  let count=0;for(let y=0;y<256;y++)for(let x=0;x<256;x++)if(base[((Math.floor(tile/2)*256+y)*512+tile%2*256+x)*4+3]>=128)count++;
  coverage.push(count/65536);
 }
 texture.mipmaps=[canvas];let raw=base,rawWidth=512;
 for(let size=256;size>=2;size/=2){
  const mip=document.createElement('canvas');mip.width=mip.height=size;const ctx=mip.getContext('2d')!,image=ctx.createImageData(size,size),data=image.data,tileSize=size/2,nextRaw=new Uint8ClampedArray(data.length);
  // Exact 2x2 box reduction, premultiplied while averaging to avoid black edges.
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const sums=[0,0,0];let alpha=0;
   for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const i=((y*2+dy)*rawWidth+x*2+dx)*4,a=raw[i+3];alpha+=a;for(let c=0;c<3;c++)sums[c]+=raw[i+c]*a;}
   const i=(y*size+x)*4;for(let c=0;c<3;c++)nextRaw[i+c]=alpha?sums[c]/alpha:0;nextRaw[i+3]=alpha/4;
  }
  data.set(nextRaw);raw=nextRaw;rawWidth=size;
  for(let tile=0;tile<3;tile++){
   const histogram=new Uint32Array(256),indices:number[]=[];
   for(let y=0;y<tileSize;y++)for(let x=0;x<tileSize;x++){const index=((Math.floor(tile/2)*tileSize+y)*size+tile%2*tileSize+x)*4+3;indices.push(index);histogram[data[index]]++;}
   const target=Math.max(1,Math.round(coverage[tile]*tileSize*tileSize));let count=0,cutoff=255;
   while(cutoff>1&&count+histogram[cutoff]<target){count+=histogram[cutoff];cutoff--;}
   const scale=Math.max(1,129/cutoff);for(const index of indices)data[index]=Math.min(255,Math.round(data[index]*scale));
  }
  ctx.putImageData(image,0,0);texture.mipmaps.push(mip);
 }
 const last=document.createElement('canvas');last.width=last.height=1;last.getContext('2d')!.drawImage(texture.mipmaps.at(-1) as HTMLCanvasElement,0,0,1,1);texture.mipmaps.push(last);texture.generateMipmaps=false;
 texture.userData.alphaCoverage={threshold:.5,tiles:coverage};
 return texture;
}

/** Seven rising branch fans carry a porous umbrella crown, with the same
 * authored scaffold in both LODs. Cards cross in 3D rather than facing a camera. */
export function createPineCrown(distant=false):THREE.BufferGeometry {
 const positions:number[]=[],colors:number[]=[],uvs:number[]=[],normals:number[]=[],random=createSeededRandom(93855);
 const vertex=(p:THREE.Vector3,uv:THREE.Vector2,shade:number,normal:THREE.Vector3)=>{positions.push(p.x,p.y,p.z);uvs.push(uv.x,uv.y);colors.push(shade,shade,shade);normals.push(normal.x,normal.y,normal.z);};
 function wood(a:THREE.Vector3,b:THREE.Vector3,radius:number){
  const direction=b.clone().sub(a).normalize(),side=new THREE.Vector3(0,1,0).cross(direction).normalize(),up=direction.clone().cross(side),sides=distant?3:4,uv=new THREE.Vector2(.875,.125);
  const rim=(point:THREE.Vector3,angle:number,r:number)=>point.clone().addScaledVector(side,Math.cos(angle)*r).addScaledVector(up,Math.sin(angle)*r);
  for(let edge=0;edge<sides;edge++){
   const t=edge/sides*Math.PI*2,n=(edge+1)/sides*Math.PI*2,p=[rim(a,t,radius),rim(a,n,radius),rim(b,t,radius*.52),rim(b,n,radius*.52)];
   for(const i of[0,1,2,1,3,2])vertex(p[i],uv,.68,p[1].clone().sub(p[0]).cross(direction).normalize());
  }
 }
 function spray(center:THREE.Vector3,angle:number,width:number,height:number,tile:number,shade:number){
  const segments=distant?1:2;
  for(const card of distant?[0,2]:[0,1,2]){
   const yaw=angle+card*Math.PI/3,tilt=[.12,.85,1.15][card],side=new THREE.Vector3(Math.cos(yaw),0,Math.sin(yaw)),outward=new THREE.Vector3(-side.z,0,side.x);
   const growth=outward.clone().multiplyScalar(Math.sin(tilt)).add(new THREE.Vector3(0,Math.cos(tilt),0));
   // Leaning and nearly horizontal sprays fill the canopy from above. Keep the
   // same orientations in the far LOD rather than turning a cross toward view.
   const point=(u:number,v:number)=>center.clone().addScaledVector(side,(u-.5)*width).addScaledVector(growth,(v-.18)*height).addScaledVector(outward,v*v*.08);
   const uv=(u:number,v:number)=>new THREE.Vector2((tile%2+(4+u*248)/256)*.5,1-(Math.floor(tile/2)+(252-v*248)/256)*.5);
   for(let row=0;row<segments;row++){
    const lower=row/segments,upper=(row+1)/segments;
    for(const[u,v]of[[0,lower],[1,lower],[0,upper],[1,lower],[1,upper],[0,upper]]){
     const p=point(u,v),normal=new THREE.Vector3(p.x,(p.y+.65)*1.7,p.z).normalize();vertex(p,uv(u,v),shade*(.86+v*.14),normal);
    }
   }
  }
 }
 for(let branch=0;branch<7;branch++){
  const angle=branch*2.399+.16,radial=new THREE.Vector3(Math.cos(angle),0,Math.sin(angle)),side=new THREE.Vector3(-radial.z,0,radial.x),reach=.62+random()*.31;
  const base=new THREE.Vector3(0,-1.18+branch*.045,0),elbow=radial.clone().multiplyScalar(reach*.43);elbow.y=-.38+branch*.035;
  const end=radial.clone().multiplyScalar(reach);end.y=-.12+random()*.17;
  wood(base,elbow,.028);wood(elbow,end,.019);
  for(let cluster=0;cluster<5;cluster++){
   // Consume the same scaffold sequence for both LODs; only remove detail.
   const offset=(cluster-2)*.105,center=end.clone().addScaledVector(side,offset).addScaledVector(radial,(random()-.5)*.27);center.y+=random()*.23-.11;
   const width=.42+random()*.21,height=.56+random()*.18,shade=.77+random()*.23;
   if(distant&&cluster%2===1)continue;
   spray(center,angle+cluster*.71,width*(distant?1.12:1),height,cluster%3,shade);
  }
 }
 // Break the hollow centre without closing the silhouette into a smooth dome.
 for(let cluster=0;cluster<4;cluster++)spray(new THREE.Vector3(Math.cos(cluster*2.4)*.24,.13+cluster*.045,Math.sin(cluster*2.4)*.23),cluster*2.4,.59,.62,cluster%3,.91);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));return geometry;
}
