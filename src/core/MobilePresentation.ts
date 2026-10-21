/** Fullscreen must begin inside a player's click; orientation locking follows it. */
export class MobilePresentation {
 private portraitAllowed=false;private started=false;private failed=false;
 private prompt=document.getElementById('landscape-prompt')!;
 private launch=document.getElementById('landscape-launch') as HTMLButtonElement;
 private note=document.getElementById('landscape-note')!;
 private abort=new AbortController();
 constructor(private enabled:boolean,onLaunch:()=>void){
  const signal=this.abort.signal;
  this.launch.addEventListener('click',onLaunch,{signal});
  document.getElementById('portrait-continue')!.addEventListener('click',()=>this.allowPortrait(),{signal});
  window.addEventListener('resize',()=>this.update(),{signal});
  document.addEventListener('fullscreenchange',()=>this.update(),{signal});
  this.update();
 }
 setReady(){this.launch.disabled=false;this.update();}
 allowPortrait(){this.portraitAllowed=true;this.update();}
 private update(){
  this.prompt.classList.toggle('hidden',!this.enabled||innerWidth>=innerHeight||this.portraitAllowed);
  this.launch.textContent=this.started?'横屏全屏继续':'横屏全屏开始';
  const standalone=matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches;
  this.note.textContent=this.failed?'请手动横置手机；当前浏览器未允许自动横屏全屏。':typeof document.documentElement.requestFullscreen==='function'&&document.fullscreenEnabled!==false
   ?'点击后进入全屏，并尝试自动转为横屏。也可以直接横置手机。'
   :standalone?'请横置手机，画面会自动铺满可用空间。':'请横置手机。iPhone 可在分享菜单中添加到主屏幕，再打开以隐藏浏览器栏。';
 }
 async enter(){
  if(!this.enabled)return;
  this.started=true;this.failed=false;
  try{
   if(!document.fullscreenElement&&document.fullscreenEnabled!==false&&document.documentElement.requestFullscreen)
    await document.documentElement.requestFullscreen({navigationUI:'hide'});
   const orientation=screen.orientation as ScreenOrientation&{lock?:(orientation:string)=>Promise<void>};
   if(orientation?.lock)await orientation.lock('landscape');
  }catch{
   // Rejection is an expected browser capability boundary, not a game failure.
   this.failed=true;
  }
  this.update();
 }
 dispose(){this.abort.abort();}
}
