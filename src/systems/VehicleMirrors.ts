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

/** The authored eye and rigid body share the car transform. Reject only triangles
 * wholly outside one optical clip plane; retain crossing triangles verbatim.
 * Compact copies own their attributes, so disposing a mirror cannot invalidate
 * the full body's GPU buffers. Animated parts never enter this cache. */
function clipMirrorBody(mesh:THREE.Mesh,camera:THREE.Camera){
  const original=mesh.geometry,position=original.getAttribute('position'),index=original.index;
  if(original.groups.length||Object.keys(original.morphAttributes).length||Object.values(original.attributes).some(a=>'isInterleavedBufferAttribute' in a))return null;
  const matrix=new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse).multiply(mesh.matrixWorld).elements,masks=new Uint8Array(position.count),kept:number[]=[];
  for(let i=0;i<position.count;i++){
    const x=position.getX(i),y=position.getY(i),z=position.getZ(i),cx=matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12],cy=matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13],cz=matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14],w=matrix[3]*x+matrix[7]*y+matrix[11]*z+matrix[15],epsilon=1e-6*Math.max(1,Math.abs(w));
    masks[i]=(cx< -w-epsilon?1:0)|(cx>w+epsilon?2:0)|(cy< -w-epsilon?4:0)|(cy>w+epsilon?8:0)|(cz< -w-epsilon?16:0)|(cz>w+epsilon?32:0);
  }
  for(let i=0,n=index?.count??position.count;i<n;i+=3){
    const a=index?index.getX(i):i,b=index?index.getX(i+1):i+1,c=index?index.getX(i+2):i+2;
    if(!(masks[a]&masks[b]&masks[c]))kept.push(a,b,c);
  }
  const geometry=new THREE.BufferGeometry();geometry.name=mesh.name+'-mirror-subset';
  for(const [name,source]of Object.entries(original.attributes)){
    const attribute=source as THREE.BufferAttribute,values=attribute.array.slice(0,kept.length*attribute.itemSize);
    for(let i=0;i<kept.length;i++)for(let c=0;c<attribute.itemSize;c++)values[i*attribute.itemSize+c]=attribute.array[kept[i]*attribute.itemSize+c];
    geometry.setAttribute(name,new THREE.BufferAttribute(values,attribute.itemSize,attribute.normalized));
  }
  // Keep the original sort center, particularly for transparent glass/lenses.
  // A smaller bound could reorder them even when their pixels are unchanged.
  if(!original.boundingSphere)original.computeBoundingSphere();
  geometry.boundingSphere=original.boundingSphere!.clone();geometry.boundingBox=original.boundingBox?.clone()??null;
  return{mesh,original,geometry,empty:kept.length===0};
}

// Advance the original deadline, skipping missed slots without catch-up bursts.
// Resetting to now+interval aliases against 16.6ms phone RAF and loses updates.
const nextDeadline=(next:number,time:number,interval:number)=>Number.isFinite(next)?next+(Math.floor(Math.max(0,time-next)/interval)+1)*interval:time+interval;

/** Owns the current car's three targets/materials and compact mirror subsets.
 * No recursive onBeforeRender calls, extra shadow bake, or outside-view pass. */
export function createVehicleMirrors(renderer:THREE.WebGLRenderer,scene:THREE.Scene,car:Convertible,mobile:boolean,cull:(camera:THREE.Camera,secondary?:boolean)=>void){
  const bias=new THREE.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),eye=new THREE.Vector3(),localEye=new THREE.Vector3(),view=new THREE.Matrix4(),clipMatrix=new THREE.Matrix4(),clipPoint=new THREE.Vector4();
  car.root.updateWorldMatrix(true,true);const fixedEye=car.cockpitEye.clone().applyMatrix4(car.root.matrixWorld);
  const entries=car.mirrors.map(surface=>{
    const center=surface.name.endsWith('center'),target=new THREE.WebGLRenderTarget(center?384:192,128,{type:THREE.HalfFloatType,depthBuffer:true,samples:Math.min(mobile?0:4,renderer.capabilities.maxSamples)});
    target.texture.name=surface.name+'-linear-view';target.texture.generateMipmaps=true;target.texture.minFilter=THREE.LinearMipmapLinearFilter;
    const matrix=new THREE.Matrix4(),original=surface.material,material=new THREE.ShaderMaterial({name:surface.name+'-reflection',uniforms:{image:{value:target.texture},project:{value:matrix}},
      vertexShader:'uniform mat4 project;varying vec4 reflectedUv;void main(){reflectedUv=project*vec4(position,1.0);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'uniform sampler2D image;varying vec4 reflectedUv;void main(){gl_FragColor=texture2DProj(image,reflectedUv);gl_FragColor.rgb*=vec3(.94,.975,.98);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',toneMapped:true});
    const camera=new THREE.PerspectiveCamera(),body=mirrorCamera(surface,fixedEye,camera,mobile?180:300)?car.mirrorBody.map(mesh=>clipMirrorBody(mesh,camera)).filter(e=>e!==null):[];
    return{surface,original,material,target,matrix,camera,body,next:-Infinity,last:-Infinity,updates:0,pose:new THREE.Matrix4(),eye:new THREE.Vector3()};
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
  let cursor=0,enabled=false,nextPass=-Infinity;const data={active:false,passes:0,draws:0,triangles:0,views:entries.map(e=>({name:e.surface.name,updates:0,width:e.target.width,height:e.target.height}))};
  return{
    diagnostics:data,
    update(time:number,mainCamera:THREE.PerspectiveCamera,active:boolean,refresh=true){
      data.active=active;data.draws=0;data.triangles=0;
      if(!active){enabled=false;for(const e of entries)e.surface.material=e.original;return;}
      for(const e of entries)if(e.updates)e.surface.material=e.material;
      if(!enabled){for(const e of entries){e.last=-Infinity;e.next=-Infinity;}nextPass=-Infinity;enabled=true;}
      // One extra render per frame, at most60 slots/sec and30Hz per glass.
      // Two visible mirrors alternate; three share the same bounded budget.
      if(time+.001<nextPass)return;
      mainCamera.updateMatrixWorld(true);mainCamera.getWorldPosition(eye);view.multiplyMatrices(mainCamera.projectionMatrix,mainCamera.matrixWorldInverse);
      let entry:typeof entries[number]|undefined;
      for(let i=0;i<entries.length;i++){
        const e=entries[(cursor+i)%entries.length];
        // Keep the last image in a paused cockpit. A new car/pose or a newly
        // visible uninitialized mirror still gets one capture, then freezes.
        const dirty=!e.pose.equals(e.surface.matrixWorld)||e.eye.distanceToSquared(eye)>1e-12;
        if((!refresh&&Number.isFinite(e.last)&&!dirty)||time+.001<e.next||!visibleGlass(e.surface))continue;
        if(!mirrorCamera(e.surface,eye,e.camera,mobile?180:300))continue;entry=e;cursor=(cursor+i+1)%entries.length;break;
      }
      if(!entry)return;
      const previousTarget=renderer.getRenderTarget(),xr=renderer.xr.enabled,shadowUpdate=renderer.shadowMap.autoUpdate,shadowNeedsUpdate=renderer.shadowMap.needsUpdate;
      const visible=entries.map(e=>e.surface.visible);
      // Turning the head keeps the authored eye fixed. Fall back to full body
      // geometry if a future camera moves that eye outside this rigid contract.
      localEye.copy(eye);car.root.worldToLocal(localEye);
      const body=localEye.distanceToSquared(car.cockpitEye)<1e-10?entry.body:[],bodyVisible=body.map(e=>e.mesh.visible);
      try{
        entries.forEach(e=>e.surface.visible=false);renderer.xr.enabled=false;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;
        cull(entry.camera,true);entry.matrix.copy(bias).multiply(entry.camera.projectionMatrix).multiply(entry.camera.matrixWorldInverse).multiply(entry.surface.matrixWorld);
        for(const e of body){e.mesh.geometry=e.geometry;if(e.empty)e.mesh.visible=false;}
        renderer.setRenderTarget(entry.target);renderer.clear();renderer.render(scene,entry.camera);
        entry.surface.material=entry.material;entry.last=time;entry.next=nextDeadline(entry.next,time,1/30);nextPass=nextDeadline(nextPass,time,1/60);entry.pose.copy(entry.surface.matrixWorld);entry.eye.copy(eye);entry.updates++;data.passes++;data.draws=renderer.info.render.calls;data.triangles=renderer.info.render.triangles;
        data.views[entries.indexOf(entry)].updates=entry.updates;
      }finally{
        body.forEach((e,i)=>{e.mesh.geometry=e.original;e.mesh.visible=bodyVisible[i];});
        entries.forEach((e,i)=>e.surface.visible=visible[i]);renderer.xr.enabled=xr;renderer.shadowMap.autoUpdate=shadowUpdate;renderer.shadowMap.needsUpdate=shadowNeedsUpdate;renderer.setRenderTarget(previousTarget);cull(mainCamera);
      }
    },
    dispose(){for(const e of entries){e.surface.material=e.original;e.target.dispose();e.material.dispose();for(const b of e.body)b.geometry.dispose();}},
  };
}
