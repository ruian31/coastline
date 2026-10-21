import type {DriveIntent} from '../systems/Driving';
export class DriveInput {
 private keys=new Set<string>();private held=new Map<number,string>();private abort=new AbortController();private drag:{id:number;x:number;y:number}|null=null;
 onAction:(action:string)=>void=()=>{};onLook:(x:number,y:number)=>void=()=>{};onManual:()=>void=()=>{};
 constructor(canvas:HTMLCanvasElement){const signal=this.abort.signal;
 window.addEventListener('keydown',e=>{if((e.target instanceof HTMLInputElement)||(e.target instanceof HTMLSelectElement))return;
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();this.keys.add(e.code);
 if(['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))this.onManual();
 if(!e.repeat){const map:Record<string,string>={KeyC:'camera',KeyP:'auto',KeyV:'garage',KeyR:'recover',Escape:'pause',KeyM:'mute'};if(map[e.code])this.onAction(map[e.code]);}},{signal});
 window.addEventListener('keyup',e=>this.keys.delete(e.code),{signal});window.addEventListener('blur',()=>this.clear(),{signal});document.addEventListener('visibilitychange',()=>this.clear(),{signal});
 document.querySelectorAll<HTMLElement>('[data-drive]').forEach(el=>{el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture(e.pointerId);this.held.set(e.pointerId,el.dataset.drive!);el.classList.add('held');this.onManual();},{signal});
 for(const event of['pointerup','pointercancel','lostpointercapture'])el.addEventListener(event,e=>{this.held.delete((e as PointerEvent).pointerId);el.classList.remove('held');},{signal});});
 canvas.addEventListener('pointerdown',e=>{this.drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);},{signal});canvas.addEventListener('pointermove',e=>{if(this.drag?.id!==e.pointerId)return;this.onLook((e.clientX-this.drag.x)*.005,(e.clientY-this.drag.y)*.004);this.drag.x=e.clientX;this.drag.y=e.clientY;},{signal});
 for(const event of['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{this.drag=null;},{signal});
 }
 read():DriveIntent {const pressed=(...s:string[])=>s.some(k=>this.keys.has(k)||[...this.held.values()].includes(k));return{throttle:pressed('KeyW','ArrowUp','throttle')?1:0,brake:pressed('KeyS','ArrowDown','brake')?1:0,steer:(pressed('KeyA','ArrowLeft','left')?1:0)-(pressed('KeyD','ArrowRight','right')?1:0),handbrake:pressed('Space','handbrake')};}
 clear(){this.keys.clear();this.held.clear();this.drag=null;document.querySelectorAll('.held').forEach(el=>el.classList.remove('held'));}
 dispose(){this.clear();this.abort.abort();}
}
