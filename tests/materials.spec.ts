import {test,expect} from '@playwright/test';
import {PNG} from 'pngjs';

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
