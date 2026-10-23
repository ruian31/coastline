import * as THREE from 'three';
import {createSeededRandom} from '../utils/random';

/** Feathered pinnate leaves: thin curved leaflets rather than broad triangular fans. */
export function createPalmCrown(mobile:boolean,distant=false):THREE.BufferGeometry {
 const random=createSeededRandom(864212),positions:number[]=[],colors:number[]=[];
 const crown=new THREE.Vector3(.65,7.8,0),fronds=distant?7:mobile?9:14,leaflets=distant?8:mobile?18:30;
 function triangle(a:THREE.Vector3,b:THREE.Vector3,c:THREE.Vector3,tint:number){
  for(const v of[a,b,c]){positions.push(v.x,v.y,v.z);colors.push(.42*tint,.60*tint,.23*tint);}
 }
 for(let frond=0;frond<fronds;frond++){
  const angle=frond*Math.PI*2/fronds+random()*.23,dir=new THREE.Vector3(Math.cos(angle),0,Math.sin(angle)),side=new THREE.Vector3(-dir.z,0,dir.x);
  const length=3.6+random()*1.2,arch=.8+random()*.75,droop=1.25+random()*1.45;
  const center=(t:number)=>crown.clone().addScaledVector(dir,t*length).add(new THREE.Vector3(0,Math.sin(t*Math.PI)*arch-t*t*droop,0));
  for(let leaf=0;leaf<leaflets;leaf++){
   const t=.045+leaf/leaflets*.91,a=center(t),b=center(t+.92/leaflets),rib=.017*(1-t*.8);
   triangle(a.clone().addScaledVector(side,rib),a.clone().addScaledVector(side,-rib),b,.74);
   triangle(b.clone().addScaledVector(side,rib*.7),a.clone().addScaledVector(side,rib),b,.74);
   const span=Math.pow(Math.sin(t*Math.PI),.65)*(.73+random()*.23);
   for(const sign of[-1,1]){
    const tip=center(Math.min(1,t+.09+t*.10)).addScaledVector(side,sign*span);tip.y-=.17+span*.30;
    const middle=a.clone().lerp(tip,.49);middle.y+=.045;
    const blade=.029+Math.sin(t*Math.PI)*.015,tint=.72+random()*.32;
    const left=middle.clone().addScaledVector(dir,blade),right=middle.clone().addScaledVector(dir,-blade);
    triangle(a,left,right,tint);triangle(left,tip,right,tint*.9);
   }
  }
 }
 // A few unfurled upright leaves give the crown a living, asymmetric centre.
 for(let spear=0;spear<3;spear++){
  const a=spear*2.399,side=new THREE.Vector3(Math.cos(a),0,Math.sin(a));
  const tip=crown.clone().addScaledVector(side,.55).add(new THREE.Vector3(0,1.8+spear*.12,0));
  triangle(crown.clone().addScaledVector(side,.07),crown.clone().addScaledVector(side,-.07),tip,.86);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();return geometry;
}

/** Overlapping uneven boughs replace the single smooth ellipsoid silhouette. */
export function createPineCrown(distant=false):THREE.BufferGeometry {
 const positions:number[]=[],colors:number[]=[],random=createSeededRandom(93855);
 for(let lobe=0;lobe<5;lobe++){
  const geometry=new THREE.IcosahedronGeometry(1,distant?0:1),p=geometry.getAttribute('position');
  const angle=lobe*2.399,x=lobe?Math.cos(angle)*.52:0,z=lobe?Math.sin(angle)*.45:0,y=lobe?-.07+random()*.22:.28;
  for(let i=0;i<p.count;i++){
   const px=p.getX(i),py=p.getY(i),pz=p.getZ(i),shape=1+Math.sin(px*9+pz*7)*.10+Math.sin(py*11-px*6)*.05;
   positions.push(px*.68*shape+x,py*.68*shape+y,pz*.66*shape+z);
   const shade=.63+(py+1)*.16;
   colors.push(.70*shade,.80*shade,.53*shade);
  }
  geometry.dispose();
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();return geometry;
}
