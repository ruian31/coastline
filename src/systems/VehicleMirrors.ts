import * as THREE from 'three';
import type {Convertible} from '../vehicles/Convertible';

/** A plane-aligned off-axis frustum uses every target pixel for the mirror.
 * Reflect the eye across the physical plane, then clip at that plane. */
export function mirrorCamera(surface:THREE.Mesh,eye:THREE.Vector3,camera:THREE.PerspectiveCamera,far:number){
  surface.updateWorldMatrix(true,false);surface.geometry.computeBoundingBox();
  const box=surface.geometry.boundingBox!,position=new THREE.Vector3().setFromMatrixPosition(surface.matrixWorld);
  const right=new THREE.Vector3().setFromMatrixColumn(surface.matrixWorld,0).normalize().negate(),up=new THREE.Vector3().setFromMatrixColumn(surface.matrixWorld,1).normalize(),normal=new THREE.Vector3().setFromMatrixColumn(surface.matrixWorld,2).normalize();
  const distance=eye.clone().sub(position).dot(normal);if(distance<.03)return false;
  camera.position.copy(eye).addScaledVector(normal,-2*distance);
  camera.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,up,normal.clone().negate()));camera.updateMatrixWorld(true);
  const a=new THREE.Vector3(box.min.x,box.min.y,0).applyMatrix4(surface.matrixWorld).applyMatrix4(camera.matrixWorldInverse),b=new THREE.Vector3(box.max.x,box.max.y,0).applyMatrix4(surface.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
  camera.near=distance+.002;camera.far=far;const ratio=camera.near/distance;
  camera.projectionMatrix.makePerspective(Math.min(a.x,b.x)*ratio,Math.max(a.x,b.x)*ratio,Math.max(a.y,b.y)*ratio,Math.min(a.y,b.y)*ratio,camera.near,far);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();return true;
}

/** Owns only the current car's three targets/materials; car owns its geometry.
 * No recursive onBeforeRender calls, extra shadow bake, or outside-view pass. */
export function createVehicleMirrors(renderer:THREE.WebGLRenderer,scene:THREE.Scene,car:Convertible,mobile:boolean,cull:(camera:THREE.Camera,secondary?:boolean)=>void){
  const bias=new THREE.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),eye=new THREE.Vector3(),view=new THREE.Matrix4(),clipMatrix=new THREE.Matrix4(),clipPoint=new THREE.Vector4();
  const entries=car.mirrors.map(surface=>{
    const center=surface.name.endsWith('center'),target=new THREE.WebGLRenderTarget(center?384:192,128,{type:THREE.HalfFloatType,depthBuffer:true,samples:Math.min(mobile?0:4,renderer.capabilities.maxSamples)});
    target.texture.name=surface.name+'-linear-view';target.texture.generateMipmaps=true;target.texture.minFilter=THREE.LinearMipmapLinearFilter;
    const matrix=new THREE.Matrix4(),original=surface.material,material=new THREE.ShaderMaterial({name:surface.name+'-reflection',uniforms:{image:{value:target.texture},project:{value:matrix}},
      vertexShader:'uniform mat4 project;varying vec4 reflectedUv;void main(){reflectedUv=project*vec4(position,1.0);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'uniform sampler2D image;varying vec4 reflectedUv;void main(){gl_FragColor=texture2DProj(image,reflectedUv);gl_FragColor.rgb*=vec3(.94,.975,.98);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',toneMapped:true});
    return{surface,original,material,target,matrix,camera:new THREE.PerspectiveCamera(),last:-Infinity,updates:0,pose:new THREE.Matrix4(),eye:new THREE.Vector3()};
  });
  // Test the actual glass vertices: a sphere can overlap the screen even when
  // the entire thin mirror is outside it. Homogeneous planes also handle edges
  // crossing the screen without requiring any vertex to be inside.
  const visibleGlass=(surface:THREE.Mesh)=>{
    clipMatrix.multiplyMatrices(view,surface.matrixWorld);const p=surface.geometry.getAttribute('position');let outside=63;
    for(let i=0;i<p.count;i++){
      clipPoint.set(p.getX(i),p.getY(i),p.getZ(i),1).applyMatrix4(clipMatrix);const{x,y,z,w}=clipPoint;
      outside&=(x< -w?1:0)|(x>w?2:0)|(y< -w?4:0)|(y>w?8:0)|(z< -w?16:0)|(z>w?32:0);
      if(!outside)return true;
    }return false;
  };
  let cursor=0,enabled=false,lastPassTime=-Infinity;const data={active:false,passes:0,draws:0,triangles:0,views:entries.map(e=>({name:e.surface.name,updates:0,width:e.target.width,height:e.target.height}))};
  return{
    diagnostics:data,
    update(time:number,mainCamera:THREE.PerspectiveCamera,active:boolean,refresh=true){
      data.active=active;data.draws=0;data.triangles=0;
      if(!active){enabled=false;for(const e of entries)e.surface.material=e.original;return;}
      for(const e of entries)if(e.updates)e.surface.material=e.material;
      if(!enabled){for(const e of entries)e.last=-Infinity;lastPassTime=-Infinity;enabled=true;}
      // One view per slot, staggered. Mobile center8Hz/sides4Hz, at most16 slots/sec; desktop stays36.
      if(time-lastPassTime<1/(mobile?16:36))return;
      mainCamera.updateMatrixWorld(true);mainCamera.getWorldPosition(eye);view.multiplyMatrices(mainCamera.projectionMatrix,mainCamera.matrixWorldInverse);
      let entry:typeof entries[number]|undefined;
      for(let i=0;i<entries.length;i++){
        const e=entries[(cursor+i)%entries.length];
        // Keep the last image in a paused cockpit. A new car/pose or a newly
        // visible uninitialized mirror still gets one capture, then freezes.
        const dirty=!e.pose.equals(e.surface.matrixWorld)||e.eye.distanceToSquared(eye)>1e-12;
        if((!refresh&&Number.isFinite(e.last)&&!dirty)||time-e.last<1/(mobile?(e.surface.name.endsWith('center')?8:4):12)||!visibleGlass(e.surface))continue;
        if(!mirrorCamera(e.surface,eye,e.camera,mobile?180:300))continue;entry=e;cursor=(cursor+i+1)%entries.length;break;
      }
      if(!entry)return;
      const previousTarget=renderer.getRenderTarget(),xr=renderer.xr.enabled,shadowUpdate=renderer.shadowMap.autoUpdate,shadowNeedsUpdate=renderer.shadowMap.needsUpdate;
      const visible=entries.map(e=>e.surface.visible);
      try{
        entries.forEach(e=>e.surface.visible=false);renderer.xr.enabled=false;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;
        cull(entry.camera,true);entry.matrix.copy(bias).multiply(entry.camera.projectionMatrix).multiply(entry.camera.matrixWorldInverse).multiply(entry.surface.matrixWorld);
        renderer.setRenderTarget(entry.target);renderer.clear();renderer.render(scene,entry.camera);
        entry.surface.material=entry.material;entry.last=time;lastPassTime=time;entry.pose.copy(entry.surface.matrixWorld);entry.eye.copy(eye);entry.updates++;data.passes++;data.draws=renderer.info.render.calls;data.triangles=renderer.info.render.triangles;
        data.views[entries.indexOf(entry)].updates=entry.updates;
      }finally{
        entries.forEach((e,i)=>e.surface.visible=visible[i]);renderer.xr.enabled=xr;renderer.shadowMap.autoUpdate=shadowUpdate;renderer.shadowMap.needsUpdate=shadowNeedsUpdate;renderer.setRenderTarget(previousTarget);cull(mainCamera);
      }
    },
    dispose(){for(const e of entries){e.surface.material=e.original;e.target.dispose();e.material.dispose();}},
  };
}
