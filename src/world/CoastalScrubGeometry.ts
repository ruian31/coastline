import * as THREE from 'three';
import {createSeededRandom} from '../utils/random';

/** A low spreading crown built from woody forks and curved oval leaves. */
export function createCoastalScrubGeometry(seed: number, dense: boolean) {
  const random=createSeededRandom(seed);
  const positions:number[]=[], colors:number[]=[], indices:number[]=[], detail:number[]=[];
  const up=new THREE.Vector3(0,1,0);
  const wood=new THREE.Color('#85806b');
  const fresh=new THREE.Color('#8c8c5d');
  const old=new THREE.Color('#575d3a');
  const silver=new THREE.Color('#a6a680');

  function vertex(point:THREE.Vector3,color:THREE.Color){
    positions.push(point.x,point.y,point.z);
    colors.push(color.r,color.g,color.b);
  }

  function twig(start:THREE.Vector3,end:THREE.Vector3,baseWidth:number,tipWidth:number){
    const axis=end.clone().sub(start).normalize();
    const side=new THREE.Vector3().crossVectors(axis,up).normalize();
    const forward=new THREE.Vector3().crossVectors(axis,side);
    const sides=4, first=positions.length/3;
    const color=wood.clone().multiplyScalar(.72+random()*.38);
    for(let i=0;i<sides;i++){
      const angle=i*2*Math.PI/sides;
      const offset=side.clone().multiplyScalar(Math.cos(angle)).addScaledVector(forward,Math.sin(angle));
      vertex(start.clone().addScaledVector(offset,baseWidth),color);
      vertex(end.clone().addScaledVector(offset,tipWidth),color);
      const a=first+i*2,b=first+(i+1)%sides*2;
      indices.push(a,b,b+1,a,b+1,a+1);
    }
  }

  function leaf(anchor:THREE.Vector3,angle:number,inMirror:boolean){
    const length=.061+random()*.067,width=length*(.29+random()*.17);
    const elevation=(random()-.3)*1.15;
    const forward=new THREE.Vector3(Math.cos(angle)*Math.cos(elevation),Math.sin(elevation),Math.sin(angle)*Math.cos(elevation));
    const across=new THREE.Vector3().crossVectors(forward,up).normalize();
    across.applyAxisAngle(forward,(random()-.5)*1.8);
    const near=anchor.clone().addScaledVector(forward,length*.32);
    const far=anchor.clone().addScaledVector(forward,length*.72).addScaledVector(up,-length*.03);
    const tip=anchor.clone().addScaledVector(forward,length).addScaledVector(up,-length*.10);
    const ridge=anchor.clone().addScaledVector(forward,length*.5).addScaledVector(up,length*.08);
    const color=old.clone().lerp(fresh,random());
    if(random()<.42)color.lerp(silver,.74);
    color.multiplyScalar(.55+THREE.MathUtils.smoothstep(anchor.y,.07,.47)*.59);
    const first=positions.length/3;
    for(const point of [anchor,near.clone().addScaledVector(across,width),far.clone().addScaledVector(across,width*.73),tip,far.clone().addScaledVector(across,-width*.73),near.clone().addScaledVector(across,-width),ridge])vertex(point,color);
    const faces=inMirror?indices:detail;
    for(let i=0;i<6;i++)faces.push(first+i,first+(i+1)%6,first+6);
  }

  for(let i=0;i<15;i++){
    const angle=i*2.399963+(random()-.5)*.45;
    const inner=i%3===0,radius=inner?.16+random()*.19:.43+random()*.49;
    const height=(inner?.36:.22)+random()*.22;
    const stem=new THREE.Vector3(Math.cos(angle)*.065,.025,Math.sin(angle)*.065);
    const fork=new THREE.Vector3(Math.cos(angle)*radius*.55,height*.54,Math.sin(angle)*radius*.55);
    const tip=new THREE.Vector3(Math.cos(angle)*radius,height,Math.sin(angle)*radius);
    twig(stem,fork,.010,.005);
    twig(fork,tip,.005,.0016);
    for(let side=-1;side<=1;side++){
      const branch=tip.clone().lerp(fork,.27+(side+1)*.21);
      const theta=angle+side*(.96+random()*.69);
      const reach=.13+random()*.19, lift=.018+random()*.14;
      const end=branch.clone().add(new THREE.Vector3(Math.cos(theta)*reach,lift,Math.sin(theta)*reach));
      twig(branch,end,.0026,.0008);
      const count=dense?9:6;
      for(let j=0;j<count;j++){
        const anchor=branch.clone().lerp(end,(j+1)/(count+1));
        leaf(anchor,theta+(j%2?1:-1)*(.46+random()*1.48),j%3===1);
      }
    }
  }

  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  // Keep the branch structure and evenly sampled leaves in the mirror prefix.
  geometry.setIndex([...indices,...detail]);
  geometry.computeVertexNormals();
  return {geometry,mirrorIndexCount:indices.length,fullIndexCount:indices.length+detail.length};
}
