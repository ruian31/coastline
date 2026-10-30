import assert from'node:assert/strict';import{createServer}from'vite';import{writeFile}from'node:fs/promises';
const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',logLevel:'error'}),rows=[];
try{const T=await server.ssrLoadModule('three'),{mirrorCamera}=await server.ssrLoadModule('/src/systems/VehicleMirrors.ts');
for(const yaw of[0,.8,2.9])for(const tilt of[0,.22]){
 const surface=new T.Mesh(new T.PlaneGeometry(.19,.065)),frame=new T.Group();frame.position.set(129,17,-208);frame.rotation.set(tilt,yaw,-tilt*.6,'YXZ');frame.add(surface);surface.position.set(-.3,1.4,.35);surface.rotation.set(.1,Math.PI+.18,.04);frame.updateMatrixWorld(true);
 const normal=new T.Vector3(0,0,1).transformDirection(surface.matrixWorld),u=new T.Vector3(1,0,0).transformDirection(surface.matrixWorld),v=new T.Vector3(0,1,0).transformDirection(surface.matrixWorld),center=surface.getWorldPosition(new T.Vector3()),eye=center.clone().addScaledVector(normal,.8).addScaledVector(u,-.24).addScaledVector(v,-.12),camera=new T.PerspectiveCamera();
 assert.equal(mirrorCamera(surface,eye,camera,180),true);const reflectedEye=eye.clone().addScaledVector(normal,-2*eye.clone().sub(center).dot(normal));assert.ok(camera.position.distanceTo(reflectedEye)<1e-9);
 const inverse=surface.matrixWorld.clone().invert(),positions=surface.geometry.getAttribute('position'),width=Math.abs(positions.getX(0)-positions.getX(1)),height=Math.abs(positions.getY(0)-positions.getY(2));let maxError=0;for(const x of[-.06,0,.06])for(const y of[-.02,.02]){
  // A point ten metres along the physical reflected ray, independent of the
  // production projection. Its object reflection must lie on the eye ray.
  const hit=new T.Vector3(x,y,0).applyMatrix4(surface.matrixWorld),incoming=hit.clone().sub(eye).normalize(),outgoing=incoming.clone().reflect(normal),object=hit.clone().addScaledVector(outgoing,10),objectReflection=object.clone().addScaledVector(normal,-2*object.clone().sub(center).dot(normal));
  assert.ok(new T.Ray(eye,objectReflection.clone().sub(eye).normalize()).distanceToPoint(hit)<1e-8);
  const ndc=object.clone().project(camera),local=hit.clone().applyMatrix4(inverse),error=Math.max(Math.abs(ndc.x+2*local.x/width),Math.abs(ndc.y-2*local.y/height));maxError=Math.max(maxError,error);assert.ok(error<1e-8,JSON.stringify({error,x,y,ndc:ndc.toArray(),local:local.toArray()}));assert.ok(ndc.z>=-1&&ndc.z<=1);
 }
 // Correct handedness: the mirror's local +X samples the image's left edge.
 const left=new T.Vector3(-.095,0,0).applyMatrix4(surface.matrixWorld).project(camera),right=new T.Vector3(.095,0,0).applyMatrix4(surface.matrixWorld).project(camera);assert.ok(left.x>.999999&&right.x<-.999999);
 assert.equal(mirrorCamera(surface,center.clone().addScaledVector(normal,-1),camera,180),false);
 rows.push({yaw,tilt,points:6,maxNdcError:maxError,reverseLocalX:true,backFacingSkipped:true});surface.geometry.dispose();surface.material.dispose();
}
await writeFile(process.env.MIRROR_CPU_REPORT??'artifacts/vehicle-mirrors-cpu.json',JSON.stringify({method:'Source mirrorCamera against independent reflection-ray intersection, world-transformed tilted planes. Six rigid poses, six physical reflected rays per pose, opposite horizontal edge mapping and back-face rejection. CPU optics only; not raster, actual scene alignment, refresh, performance or phone evidence.',rows},null,2)+'\n');console.log(JSON.stringify({poses:rows.length,rays:rows.length*6,maxNdcError:Math.max(...rows.map(r=>r.maxNdcError))}));
}finally{await server.close();}
