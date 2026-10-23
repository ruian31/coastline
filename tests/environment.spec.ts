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

test('实体岩岸背部埋入实际地形，礁石基座深入海面',async({page})=>{
 await page.addInitScript(()=>{
  const globals=window as unknown as {__coastScenes:unknown[];__THREE_DEVTOOLS__:EventTarget};globals.__coastScenes=[];globals.__THREE_DEVTOOLS__=new EventTarget();globals.__THREE_DEVTOOLS__.addEventListener('observe',event=>globals.__coastScenes.push((event as CustomEvent).detail));
 });
 await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('rock-side'));
 const snapshot=await page.evaluate(()=>{
  const scene=(window as unknown as {__coastScenes:THREE.Scene[]}).__coastScenes.find(s=>s.isScene&&s.getObjectByName('Coastal landscape'))!;
  const meshData=(mesh:THREE.Mesh)=>{const p=mesh.geometry.getAttribute('position');return{positions:Array.from({length:p.count},(_,i)=>[p.getX(i),p.getY(i),p.getZ(i)]).flat(),indices:Array.from(mesh.geometry.index!.array)};};
  const terrain=scene.getObjectByName('Limestone headland and grassy interior') as THREE.Mesh,root=scene.getObjectByName('Eroded sandstone headland')!;
  const cliffs=root.children.filter(group=>group.name.startsWith('sandstone-cut-'));
  return{terrain:meshData(terrain),parts:cliffs[0].children.map(mesh=>meshData(mesh as THREE.Mesh)),matrices:cliffs.map(group=>group.matrixWorld.toArray()),reefs:root.children.filter(group=>group.name.startsWith('Intertidal rock shelf')).map(group=>{
   let min=Infinity;group.traverse(o=>{const mesh=o as THREE.Mesh;if(!mesh.isMesh)return;const p=mesh.geometry.getAttribute('position');for(let i=0;i<p.count;i++)min=Math.min(min,p.getY(i)*group.scale.y+group.position.y);});return min;
  })};
 });
 expect(snapshot.matrices).toHaveLength(4);expect(snapshot.parts).toHaveLength(2);expect(snapshot.reefs).toHaveLength(2);for(const bottom of snapshot.reefs)expect(bottom).toBeLessThan(-5);
 const resources:THREE.BufferGeometry[]=[],material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
 const geometry=(data:typeof snapshot.terrain)=>{expect(data.positions.length%3).toBe(0);expect(data.positions.every(Number.isFinite)).toBe(true);expect(data.indices.every(index=>index>=0&&index<data.positions.length/3)).toBe(true);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(data.positions,3));g.setIndex(data.indices);resources.push(g);return g;};
 const terrain=new THREE.Mesh(geometry(snapshot.terrain),material),parts=snapshot.parts.map(geometry),ray=new THREE.Raycaster();terrain.updateMatrixWorld(true);
 for(const matrix of snapshot.matrices){const group=new THREE.Group();for(const part of parts)group.add(new THREE.Mesh(part,material));group.matrixAutoUpdate=false;group.matrix.fromArray(matrix);group.updateMatrixWorld(true);let contacts=0;
  for(const x of[-35,-20,0,20,35])for(const z of[-13,-17]){
   const p=new THREE.Vector3(x,0,z).applyMatrix4(group.matrixWorld);ray.set(new THREE.Vector3(p.x,120,p.z),new THREE.Vector3(0,-1,0));const rock=ray.intersectObject(group),land=ray.intersectObject(terrain)[0];if(rock.length<2)continue;
   expect(land).toBeDefined();const bottom=Math.min(...rock.map(hit=>hit.point.y));expect(bottom,'rock backing intersects solid land instead of hovering above it').toBeLessThan(land.point.y-.2);contacts++;
  }
  expect(contacts).toBeGreaterThanOrEqual(6);
 }
 resources.forEach(g=>g.dispose());material.dispose();
});
