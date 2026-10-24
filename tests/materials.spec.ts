import {test,expect} from '@playwright/test';
import {PNG} from 'pngjs';
import type * as THREE from 'three';

test('干草地、海砂与岩岸共用八张实际GPU表面纹理',async({page})=>{
 await page.setViewportSize({width:844,height:390});
 await page.addInitScript(()=>{localStorage.setItem('coast-settings',JSON.stringify({quality:'low',muted:true}));const w=window as unknown as {surfaceObjects:unknown[];__THREE_DEVTOOLS__:EventTarget};w.surfaceObjects=[];w.__THREE_DEVTOOLS__=new EventTarget();w.__THREE_DEVTOOLS__.addEventListener('observe',e=>w.surfaceObjects.push((e as CustomEvent).detail));});
 const requests:string[]=[],errors:string[]=[];page.on('request',r=>{if(r.url().includes('/assets/environment/'))requests.push(new URL(r.url()).pathname.split('/').at(-1)!);});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('/?test=1');await page.evaluate(()=>window.__THREE_GAME_TEST_HOOKS__!.setState('field-verge'));
 const result=await page.evaluate(()=>{
  const objects=(window as unknown as {surfaceObjects:unknown[]}).surfaceObjects,scene=objects.find(o=>(o as THREE.Scene).isScene&&(o as THREE.Scene).getObjectByName('Coastal landscape')) as THREE.Scene,renderer=objects.find(o=>(o as {isWebGLRenderer?:boolean}).isWebGLRenderer) as THREE.WebGLRenderer,root=scene.getObjectByName('Coastal landscape')!,ground=(root.getObjectByName('Limestone headland and grassy interior') as THREE.Mesh<THREE.BufferGeometry,THREE.Material>).material;
  // Inspect the uniforms of the program actually prepared by WebGLRenderer;
  // unreferenced files in public/ must not count as integrated PBR surfaces.
  const {uniforms}=renderer.properties.get(ground) as {uniforms:Record<string,{value:THREE.Texture}>},roles=['GroundColor','GroundSurface','SandColor','SandSurface','FieldColor','FieldSurface','RockColor','RockSurface'];
  return{key:ground.customProgramCacheKey(),textures:roles.map(role=>{const texture=uniforms['u'+role].value,image=texture.image as HTMLImageElement;return{role,id:texture.uuid,width:image.width,height:image.height,colorSpace:texture.colorSpace,src:image.currentSrc,mipmaps:texture.generateMipmaps};}),shoulders:scene.getObjectByName('road-network')!.children.filter(o=>(o as THREE.Mesh).material===ground).length};
 });
 expect(result.key).toContain('coastal-dry-field-rock-v6');expect(result.shoulders).toBe(6);expect(new Set(result.textures.map(t=>t.id)).size).toBe(8);
 for(const texture of result.textures){expect([texture.width,texture.height]).toEqual([1024,1024]);expect(texture.colorSpace).toBe(texture.role.endsWith('Color')?'srgb':'');expect(texture.mipmaps).toBe(true);}
 for(const file of ['ground-surface.webp','sand-surface.webp','field-color.jpg','field-surface.webp'])expect(requests.filter(r=>r===file).length).toBe(1);
 for(const file of ['ground-normal.jpg','ground-roughness.jpg','sand-normal.jpg','sand-roughness.jpg'])expect(requests).not.toContain(file);
 expect(errors).toEqual([]);
});

const region=(buffer:Buffer,box:[number,number,number,number])=>{
 const png=PNG.sync.read(buffer),sum=[0,0,0];let count=0;
 for(let y=box[1];y<box[3];y++)for(let x=box[0];x<box[2];x++){const index=(y*png.width+x)*4;for(let c=0;c<3;c++)sum[c]+=png.data[index+c];count++;}
 return sum.map(value=>value/count);
};

test('冷加载后车漆与沥青保持各自材质',async({page},info)=>{
 test.skip(!info.project.name.includes('mobile'),'保护曾出现异常的手机构图');
 await page.setViewportSize({width:390,height:664});await page.goto('/?test=1');
 const capture=async(name:string)=>{
  await page.evaluate(async state=>{const hooks=window.__THREE_GAME_TEST_HOOKS__!;hooks.setPausedForScreenshot(false);await hooks.setState(state);hooks.setPausedForScreenshot(true);hooks.setReducedMotion(true);await document.fonts.ready;await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));},name);
  return page.screenshot({scale:'css'});
 };
 const [red,green,blue]=region(await capture('tunnel'),[174,407,210,437]);
 expect(green-red,'cyan paint must not disappear into gray asphalt').toBeGreaterThan(10);
 expect(blue).toBeGreaterThan(110);
 const road=region(await capture('sport'),[165,260,215,290]);
 expect(road.reduce((sum,value)=>sum+value,0)/3,'asphalt must not become pale terrain').toBeLessThan(155);
});
