import {test,expect} from '@playwright/test';
import * as THREE from 'three';

test('树木根部落在实际绘制的地形网格上',async({page})=>{
 await page.addInitScript(()=>{
  const globals=window as unknown as {__coastScenes:unknown[];__THREE_DEVTOOLS__:EventTarget};
  globals.__coastScenes=[];globals.__THREE_DEVTOOLS__=new EventTarget();
  globals.__THREE_DEVTOOLS__.addEventListener('observe',event=>globals.__coastScenes.push((event as CustomEvent).detail));
 });
 await page.goto('/?test=1');if(await page.locator('#landscape-prompt').isVisible())await page.click('#portrait-continue');await page.click('#start-button');
 const snapshot=await page.evaluate(()=>{
  const globals=window as unknown as {__coastScenes:THREE.Scene[]};
  const scene=globals.__coastScenes.find(s=>s.isScene&&s.getObjectByName('Coastal landscape'))!;
  const terrain=scene.getObjectByName('Limestone headland and grassy interior') as THREE.Mesh;
  const feet:number[][]=[];
  for(const name of ['Curved palm trunks','Stone pine trunks'])scene.getObjectByName(name)!.traverse(object=>{
   const mesh=object as THREE.InstancedMesh;if(!mesh.isInstancedMesh)return;
   const matrix=mesh.matrix.clone();for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);feet.push([matrix.elements[12],matrix.elements[13],matrix.elements[14]]);}
  });
  return{positions:Array.from(terrain.geometry.getAttribute('position').array as ArrayLike<number>),indices:Array.from(terrain.geometry.index!.array),feet:feet.filter((_,i)=>i%Math.ceil(feet.length/20)===0)};
 });
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(snapshot.positions,3));geometry.setIndex(snapshot.indices);
 const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),terrain=new THREE.Mesh(geometry,material),ray=new THREE.Raycaster();terrain.updateMatrixWorld(true);
 expect(snapshot.feet.length).toBeGreaterThan(10);
 for(const [x,y,z]of snapshot.feet){ray.set(new THREE.Vector3(x,150,z),new THREE.Vector3(0,-1,0));const hit=ray.intersectObject(terrain)[0];expect(hit,'tree must have terrain below it').toBeDefined();expect(Math.abs(y-hit.point.y),'root must touch the rendered surface').toBeLessThan(.03);}
 geometry.dispose();material.dispose();
});
